# Launch entry validation completeness + engine-throw escalate routing — no more opaque deep deaths or re-dispatch loops

Issues addressed: #740, #742

## 1. Context — the gap / problem

Two live defects in `skills/war/assets/workflow-template.js` let launch-time and engine-side errors
surface as the wrong outcome, deep in the run instead of at the boundary:

- **#740 (Major, live):** the Entry validation (H) block at the top of the `try{}` body validates only
  the derivation inputs (`planSlug`/`runId`/`worktreeRoot` trio + `phase.id`) and only *conditionally*
  (when some task lacks an explicit `branch`/`worktree`). But `ph.title`, `ph.workingBranch`, and
  `ph.integrationBranch` are interpolated fallback-free through the fail-loud `pt` tag (ADR 0034) in
  the Provision-barrier prompt, `depClause`, both merge-task prompt sites, the classification clause,
  the evidence dispatch, the phase-close sweep, and the land block. A launch omitting any of them
  escapes the named-key entry error and dies opaquely inside prompt construction as a generic
  `held:workflow-error` — the exact failure entry validation exists to prevent. This blocked a real
  phase-1 launch on 2026-07-11.
- **#742 (Critical, live):** a worker reporting `files_changed` as absolute main-checkout paths (a
  known cosmetic mis-report — the confined war-worker's real main-checkout writes are already
  scope-hook-denied) trips `assertReportedPathsInWorktree`, whose throw at its call site inside the
  parallel work thunk is uncaught. The thunk resolves to `null`, `results.filter(Boolean)` drops it,
  `done.add` never runs, and `nextWave()` re-dispatches a fresh full worker each wave iteration —
  discarding completed, pushed, gate-green work (~660k tokens / 24 min per round). The loop is bounded
  only by the wave-loop guard (`tasks.length + 2` iterations), after which the post-loop ghost-dep
  sweep mislabels the task `unrunnable-deps` with an empty `missingDeps` — a misleading held outcome
  after massive waste, silently hazardous under `--afk`.

Common root: an error raised *by the engine* (not by an agent) has no routing contract — it either
detonates as an opaque catch-all or vanishes into a dropped thunk. This spec gives both classes a
named, boundary-time route.

## 2. Pivotal constraints

1. **ADR 0005 enum discipline.** `held:workflow-error` must NEVER be added to
   `HARD_ESCALATION_REASONS`. No new escalation reason and no new land-decision member is introduced
   anywhere in this design — the engine-throw route reuses the existing `'escalate'` reason, and the
   entry-validation throws keep routing to `held:workflow-error` via the existing `catch`. The
   hand-mirrored copies in `land-decision.mjs` / `workflow-template.js` are therefore untouched.
2. **Entry validation placement.** New checks live in the existing Entry validation (H) block at the
   top of the `try{}` body — before any pt-tagged interpolation and before git is touched — so a
   missing input dies at ENTRY with the exact absent keys named.
3. **`pt` stays the backstop, never the primary.** The ADR 0034 `pt` tag continues to guard every
   interpolation; entry validation is the named-key front line for *known-required* fields, not a
   replacement for `pt`.
4. **Wave-loop invariant (new, load-bearing):** a task dispatched into a work wave must terminate in
   exactly one collected result — it may never re-enter the work wave because of an engine-side
   throw. Escalation, not silent re-dispatch, is the route for engine errors mid-thunk.
5. **Both-surfaces rule.** The worker `files_changed` contract lives on two prompt surfaces —
   standing (`agents/war-worker.md`) and dispatched (string-built in `workflow-template.js`) — plus
   `skills/war/references/schemas.md`. All must change in the same commit or they drift silently.
6. **Scope-hook reality bounds the normalization.** `validate-worktree-scope.sh` already denies the
   confined war-worker any main-checkout Write/Edit, so a main-rooted `files_changed` entry is
   necessarily a *reporting* artifact, not evidence of a real off-worktree write — normalizing it is
   safe. An absolute path outside both the worktree and the main checkout remains a loud failure.
7. **Structure-test locks.** `workflow-template.test.mjs` asserts `references/schemas.md` mentions
   entry validation (the `schemas.md notes the entry validation` assertion); the prose rewrite must
   keep that anchor satisfied while widening it to the new phase-field class.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Which phase fields become unconditionally required | `ph.title`, `ph.workingBranch`, `ph.integrationBranch` — each is interpolated fallback-free in pt-tagged prompts regardless of whether tasks carry explicit branch/worktree. (`ph.id` stays in the existing conditional derivation class.) |
| Conditional vs unconditional check | Unconditional — a zero-task phase still builds the Provision-barrier prompt from these fields, so the "zero tasks ⇒ vacuously no throw" rule applies only to the legacy derivation classes, not the new phase-field class. |
| Error shape | One aggregated named-key error in the existing missing-trio message style (`requires phase { title, workingBranch, integrationBranch } — missing: [<keys>]`), pushed onto the same `problems` list so a single launch error names every absent key across all classes at once. |
| Error routing | Unchanged: throw at entry → existing `catch` → `held:workflow-error`, git untouched. No enum change (constraint 1). |
| Engine-throw handling in the work thunk | Wrap the whole per-task work+audit thunk body (the async closure inside `parallel(wave.map(...))`) in try/catch returning `{ task, verdict: 'escalate', seats: [], expected: 0, blocked: <engine-error message> }` — closes the entire dropped-thunk class (the path-contract throw today, any residual pt throw tomorrow), not just the one call site. `done.add` then runs in the normal collection loop; the task never re-enters a wave. |
| Narrow catch at the assert call site instead? | Rejected — it fixes only #742's literal reproducer; any other engine-side throw in the thunk would re-open the identical re-dispatch loop. The thunk-wide catch enforces the wave-loop invariant once, where all paths route through. |
| Main-rooted-but-in-repo reported paths | Normalize, don't fail: when a reported absolute path sits under `mainCheckout` (and `mainCheckout` is set), rewrite it to the equivalent worktree-relative path, log a warning naming the task and original path, and use the normalized array downstream. Anything absolute outside both roots still throws → caught → `verdict: 'escalate'`. When `mainCheckout` is unset, no normalization is attempted (falls through to the throw). |
| Worker contract tightening | State the `files_changed` = worktree-relative-paths contract explicitly on both prompt surfaces and in `schemas.md`'s `WorkerResult` (`files_changed: ["path"]` → worktree-relative), per constraint 5. |
| Post-loop `unrunnable-deps` sweep | Untouched. With the invariant enforced, the empty-`missingDeps` mislabel can no longer be reached via engine throws; the sweep keeps its genuine ghost-dep purpose. |

## 4. Mechanics

### Entry validation block (`workflow-template.js`, the Entry validation (H) block at the top of the `try{}` body)

- Keep the existing conditional derivation validation (trio + `phase.id`) byte-compatible in message
  content — the `run-lifecycle §1 entry validation` test family must stay green unmodified.
- Add, in the same block and feeding the same `problems` aggregation, an **unconditional** phase-field
  check: for each of `title`, `workingBranch`, `integrationBranch`, a nullish/empty value on `ph`
  appends one problem naming the dotted key (`phase.title` etc.), matching the missing-trio style.
  `ph` itself nullish ⇒ all three named. A single throw carries the joined problem list.
- Token sweep (floor): grep `ph\.` across the pt-tagged prompt builders and dispatch sites in
  `workflow-template.js` and handle every match — confirm every fallback-free `ph.*` interpolation is
  covered by either the new required set, the existing `phase.id` class, or an explicit `?? '<unset>'`
  default. **Grep is a floor, not a ceiling: after the grep, hand-scan the same file's same-scope
  comments and test titles (the Entry validation (H) comment block, the `pt` tag comment, the
  run-lifecycle test names) plus the Entry validation (H) blockquote in
  `skills/war/references/schemas.md`, and list each straggler still describing the old
  trio-only/conditional contract as a survey-derived correction.**

### Work-thunk engine-throw route (`workflow-template.js`, the async task closure inside `parallel(wave.map(...))` in the wave loop)

- Wrap the closure body in try/catch. On catch: return
  `{ task, verdict: 'escalate', seats: [], expected: 0, blocked: 'engine error during work/audit: <err.message>' }`.
  The existing collection loop (`for (const r of results.filter(Boolean))`) then records the
  `auditLog` entry, adds the task to `done`, and the escalate branch pushes
  `{ task, reason: 'escalate', ... }` — a HARD reason already in `HARD_ESCALATION_REASONS`, so the
  phase holds as `held:escalation` with the true diagnostic instead of looping.
- The caught message is carried verbatim (uncurated) in `blocked` — it is the only evidence trail.
- Token sweep (floor): grep `assertReportedPathsInWorktree` in `workflow-template.js` and handle every
  call site (one today, at the path-contract line after the worker returns) so each sits inside the
  new catch's coverage. **Grep is a floor, not a ceiling: after the grep, hand-scan the same-scope
  comments (the path-contract comment block above the helper, the spec-§9/criterion-10 references)
  and the nearby test titles in `workflow-template.test.mjs`, and list each comment still claiming
  the violation "fails loud" with no route as a survey-derived correction.**

### Reported-path normalization (`assertReportedPathsInWorktree` in `workflow-template.js`)

- Reshape the helper from assert-only to normalize-or-throw (rename to reflect it, e.g.
  `normalizeReportedPaths`, updating its comment block in the same edit): for each reported string,
  (a) relative → pass through unchanged (cd contract); (b) absolute under the task worktree → pass;
  (c) absolute under `mainCheckout` (only when `mainCheckout` is truthy) → rewrite to the
  worktree-relative remainder and `log()` a warning naming the task id and the original path;
  (d) any other absolute → throw the existing named path-contract error (now caught → escalate).
- The caller uses the returned normalized array for everything downstream of the assert
  (`impl.files_changed` consumers), so records never carry the main-rooted form.

### Worker `files_changed` contract (both prompt surfaces + schema, one commit)

- `agents/war-worker.md` (standing): state that `files_changed` paths MUST be worktree-relative
  (never absolute, never main-checkout-rooted), beside the existing `WorkerResult` return line.
- Dispatched worker prompt in `workflow-template.js` (the `Implement WAR task …` builder): one
  matching sentence.
- `skills/war/references/schemas.md`: annotate `files_changed` in `WorkerResult` as
  worktree-relative, and widen the Entry validation (H) blockquote to document the new unconditional
  phase-field class (keeping the phrase "entry validation" intact for the structure test).
- Token sweep (floor): grep `files_changed` across `workflow-template.js`, `agents/war-worker.md`,
  and `skills/war/references/schemas.md` and handle every match against the worktree-relative
  contract. **Grep is a floor, not a ceiling: after the grep, hand-scan each file's same-scope
  titles/comments (war-worker.md's submodule step that says `files_changed` includes the gitlink
  path, the schemas.md `WorkerResult` prose, any test fixture comments naming reported paths) and
  list each straggler that implies absolute or main-rooted paths are acceptable as a survey-derived
  correction.**

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | Entry validation (H) block: unconditional phase-field checks; work thunk: try/catch → `verdict:'escalate'`; `assertReportedPathsInWorktree` → normalize-or-throw (+ comment/rename); dispatched worker prompt: worktree-relative `files_changed` sentence. |
| `skills/war/assets/workflow-template.test.mjs` | New entry-validation cases beside the `run-lifecycle §1 entry validation` family; escalate-not-redispatch case; normalization case; widen the schemas.md structure assertion to the phase-field class. |
| `agents/war-worker.md` | Worktree-relative `files_changed` contract sentence (same commit as the dispatched-prompt sentence — both-surfaces rule). |
| `skills/war/references/schemas.md` | Entry validation (H) blockquote widened to the unconditional phase-field class; `WorkerResult.files_changed` annotated worktree-relative. |

## 6. New domain terms (CONTEXT.md)

None. ("Wave-loop invariant" is documented as a comment at the thunk catch, not promoted to the
glossary — it names an internal engine guarantee, not an operator-facing concept.)

## 7. Recommended ADRs

None. The design operates strictly inside the existing ADR 0005 (enum discipline — explicitly
honored by adding no reason and never touching `HARD_ESCALATION_REASONS`) and ADR 0034 (`pt`
fail-loud interpolation) postures.

## 8. Open risks / implementation notes

- **Thunk-wide catch can dress an engine bug as a per-task escalate.** Accepted: the escalate is a
  HARD hold (phase never lands silently), and the verbatim error message in `blocked`/`auditLog` is
  the diagnosis trail. This is strictly better than today's dropped-thunk re-dispatch.
- **Normalization must stay narrow.** Only `mainCheckout`-prefixed absolutes are rewritten;
  `mainCheckout` is optional at the args boundary (`A.mainCheckout`), so a falsy value must disable
  normalization entirely rather than guessing a root.
- **Zero-task phases now fail earlier** on missing phase fields (entry, named keys) where they
  previously died inside the Provision-barrier `pt` interpolation with the generic message — a
  strictly earlier/cleaner surface, but tests asserting the old zero-task vacuous-no-throw behavior
  must be re-checked: that rule now applies only to the derivation classes.
- **Anchors:** all edits are located by named construct — the Entry validation (H) block, the
  `parallel(wave.map(...))` work thunk, `assertReportedPathsInWorktree`, the `run-lifecycle §1
  entry validation` test family — never by line number (line numbers rot across the serial merge
  queue).

## 9. Non-goals / deferred

- No new escalation reason, land decision, or any change to the `HARD_ESCALATION_REASONS` /
  `KNOWN_LAND_DECISIONS` mirrors (ADR 0005; `held:workflow-error` stays out of
  `HARD_ESCALATION_REASONS` permanently).
- No blocking-mode change to worker Bash write scoping (issue #809's territory).
- No relabeling rework of the post-loop `unrunnable-deps` ghost-dep sweep — the invariant removes
  the engine-throw path into it; genuine ghost deps keep their existing label.
- No entry validation of agent/audit/run config shapes beyond the phase fields named here (roster
  validation already fails loud per-task).
- No retry/resume semantics for an escalated engine-throw task — recovery stays Lead-driven, as for
  every `held:escalation`.

## 10. Validation criteria

1. **Entry — missing phase fields:** launching with tasks carrying explicit `branch`/`worktree` but
   `ph.title` absent returns `held:workflow-error` whose message names `phase.title`; zero agents
   spawned; git untouched. Same individually for `phase.workingBranch` and
   `phase.integrationBranch`; all three absent ⇒ one error naming all three.
2. **Entry — class aggregation:** trio absent AND `ph.workingBranch` absent ⇒ one error naming both
   classes' keys in a single message.
3. **Entry — regression:** the existing `run-lifecycle §1 entry validation` cases (a)–(d) pass
   unmodified.
4. **Escalate, not re-dispatch:** a mocked worker returning `files_changed` with an absolute path
   outside both roots yields exactly ONE `work:<id>` dispatch, the task in `escalated` with
   `reason: 'escalate'` and the path-contract message in `blocked`, `landDecision:
   'held:escalation'` — and never `unrunnable-deps`, never a second work dispatch.
5. **Normalization:** a mocked worker reporting a `mainCheckout`-rooted path that maps into the repo
   proceeds to audit normally; the collected records carry the worktree-relative form; a warning
   log line names the task and original path. With `mainCheckout` unset, the same report escalates
   per criterion 4.
6. **Both surfaces:** the worktree-relative `files_changed` sentence is present on BOTH prompt
   surfaces (`agents/war-worker.md` and the dispatched prompt builder) — locked by a test in
   `workflow-template.test.mjs`, and both land in the same commit.
7. **Schemas prose:** the Entry validation (H) blockquote in `skills/war/references/schemas.md`
   documents the unconditional phase-field class; the widened structure assertion in
   `workflow-template.test.mjs` locks it (and the legacy "entry validation" phrase anchor still
   matches).
8. **Sweeps complete:** the three token sweeps in §4 (`ph\.` interpolations, `files_changed`,
   `assertReportedPathsInWorktree` call sites) are executed with every match handled — **and each
   sweep's mandatory manual same-scope title/comment survey is performed, with every straggler
   listed and fixed as a survey-derived correction** (a grep with zero survey notes recorded is an
   incomplete validation).
