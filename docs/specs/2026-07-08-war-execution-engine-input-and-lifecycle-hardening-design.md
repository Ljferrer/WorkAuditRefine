# WAR execution-engine input & lifecycle hardening — defensive parse guards, an engine-level undefined-render guard, a central provision exit-code table, and a self-healing provision barrier

Source: `/survey-corps` 2026-07-08, from a memory-mined cluster of ten recorded engine-hardening lessons.
Not yet a plan — convert with `/war-strategy`, then validate with `/red-team`.

Addresses (memory lessons): overrides-loop-lacks-nonobject-type-guard-unlike-memory-block, json-parse-catch-misses-valid-scalar, post-loop-assert-closes-silent-undefined-class, fail-open-design-bounds-xargs-word-split-blast-radius, provision-nonidempotent-orphan-integration-branch-blocks-relaunch, provision-divergence-die-exit-7-unenumerated, provision-ensure-exclude-cwd-contract, provision-phase-mocks-must-match-on-label-not-just-phase, provision-conservative-heal-not-gated-on-ahead-check

Baseline: master, v0.14.14 line. Every current-behavior claim below is verified against the live tree.

## 1. Context — the gap / problem

WAR's core engine scripts — `skills/war/assets/war-config.mjs`, `skills/war/assets/workflow-template.js`,
`skills/red-team/assets/workflow-scaffold.js`, `skills/war/assets/provision-worktrees.sh`, and
`hooks/inject-campaign-state.sh` — are individually correct on the happy path but share a family of
**trust-boundary defects**: each crashes with a raw stack trace, silently misbehaves, or forces
dangerous manual recovery when handed imperfect input or a half-run state. None is a live-fire outage
today (each is guarded by a downstream fail-open, a stringified-object delivery contract, or a prompt
convention), but every one converts a *wrong-class* failure — a raw `TypeError`, a fabricated env
excuse, a silent no-op, an operator hand-editing git refs — into an operator-visible papercut. This
spec hardens the seams **mechanically**, converting prose-only invariants into code enforcement.

Ten frictions, in three bands. Each premise is verified against the named construct:

**Band 1 — defensive parsing at ingest boundaries.**
1. **`war-config` overrides loop has no non-object guard** (`overrides-loop-lacks-nonobject-type-guard-unlike-memory-block`).
   In `validate()`, the `memory` block guards `if (!isObj(mem)) errors.push('memory must be an object')`
   before iterating, but the `overrides` block immediately below it iterates `Object.keys(c.overrides)`
   with **no** `isObj` guard. Because `deepMerge` preserves an explicit `overrides: null`, a hand-edited
   `.claude/war/config.json` with `"overrides": null` makes `Object.keys(null)` throw an uncaught
   `TypeError` — `main()` dies with a raw stack trace instead of returning the clean
   `{ valid: false, errors }` every other malformed key produces. Pre-existing gap, routed Minor.
2. **`JSON.parse` arg-normalization lets valid scalars through** (`json-parse-catch-misses-valid-scalar`).
   Both Workflow entrypoints normalize `args` with a parse-if-string idiom:
   `workflow-template.js` uses `const A = typeof args === 'string' ? JSON.parse(args) : (args || {})`
   (no try/catch at all); `workflow-scaffold.js` uses `try { A = ... JSON.parse(args) ... } catch { A = {} }`.
   The catch only traps `SyntaxError`. A syntactically valid scalar — `'null'`, `'true'`, `'5'` — parses
   fine (`JSON.parse('null') === null`), sails past the catch, and the subsequent destructure
   (`const { planFile, ... } = A`) throws a raw `TypeError`, bypassing every downstream domain guard
   (the fingerprint check, the entry-validation check). Latent only because both delivery paths always
   send a stringified object. Same defect class as friction 1.
3. **Missing spawn args interpolate literal `undefined` into prompts** (`post-loop-assert-closes-silent-undefined-class`).
   `workflow-template.js` string-builds every dispatched prompt. A missing interpolation input renders
   the literal text `undefined` into the sub-agent's prompt. The `#586` entry-validation check (and the
   per-task derivation throw) now closes this for the **branch/worktree derivation path only** — a
   missing `phase.id` is caught because it would produce `pundefined-` names. Every *other* interpolated
   field (a missing `provisionSource`, `integrationBranch`, `audit_sha`, `plan.gate`, …) has no general
   guard: it silently ships `undefined` to the worker/auditor/refiner as if it were real content.

**Band 2 — provisioning lifecycle: exit-code scheme & idempotency.**
4. **`inject-campaign-state.sh` word-splits its ledger sort on spaces** (`fail-open-design-bounds-xargs-word-split-blast-radius`).
   The SessionStart hook collects candidate `ledger.json` paths into a newline-separated `$candidates`,
   then sorts newest-first with `printf '%s' "$candidates" | xargs ls -t`. `xargs` word-splits on **spaces**,
   not just the newlines the inline comment justifies. A scan root (`$CLAUDE_PROJECT_DIR` or the hook's
   input cwd — externally supplied session cwd) or a campaign directory name containing a space fragments
   into multiple `ls` arguments, breaking the sort so campaign-state injection silently doesn't fire for
   that session. A resume/compaction-survival papercut, bounded to silence only because the hook is fail-open.
5. **A half-run Provision barrier orphans a non-runId-scoped integration branch that blocks relaunch**
   (`provision-nonidempotent-orphan-integration-branch-blocks-relaunch`).
   `cmd_ensure_integration` in `provision-worktrees.sh` refuses (exit 3, ADR 0003) a branch that exists
   but is not recorded as owned by this run. The branch name (`integration/<slug>/phase-<N>`) is plan+phase
   scoped, **not** runId-scoped, and the `--owned-file` ledger does not travel across runIds. So a Provision
   barrier that dies half-way (integration branch created, ledger not yet appended, or a fresh relaunch under
   a new runId) leaves an orphan that collides on relaunch: every worker escalates "Provision precondition
   violated." Clearing it is manual and dangerous — the operator must first prove the orphan carries no
   unique commits. (The sibling run-lifecycle spec — below — solves the *documented-playbook* half via
   owned-file continuity; the *truly orphaned half-run* still needs manual clearing.)
6. **`provision-worktrees.sh` dies use an uncatalogued exit-code set** (`provision-divergence-die-exit-7-unenumerated`).
   The script's `die "…" <code>` calls use an ad-hoc set — 1 (generic), 3 (foreign/unowned branch, ADR 0003),
   4 (non-empty unregistered dir), 5 (out-of-run-scope teardown), 6 (worktree on wrong branch with dirty tree),
   7 (base/origin divergence, ADR 0008) — with **no central table**. Safe today only because the Provision
   prompt keys on *any* non-zero exit = halt; but the sibling spec's future "surfacing" step and any consumer
   that special-cases exit 3 would let exit 7 (and any newly-added die) fall through unhandled.
7. **`cmd_ensure_exclude` resolves its target repo implicitly from cwd** (`provision-ensure-exclude-cwd-contract`).
   `cmd_ensure_exclude` takes no arguments and resolves the git dir via `git_dir()` → `git rev-parse --git-dir`
   from the caller's cwd. It "works" in unit tests (cwd = repo) but would write `.claude/` into the wrong
   git dir if ever invoked from a task worktree. The correctness contract is held only by prompt-pinning
   `mainCheckout` — a cwd-coupled, pipeline-only failure class, not code-enforced.

**Band 3 — recurring audit/test footguns from the provision dispatch shapes.**
8. **The two Provision dispatches differ only by `opts.label`** (`provision-phase-mocks-must-match-on-label-not-just-phase`).
   `workflow-template.js` issues two semantically distinct refiner dispatches that both carry
   `phase: 'Provision'` + seat `war-refiner`: the phase-wide git-topology barrier (`label: provision:phase-<id>`)
   and the per-task env-provision (`label: provision-run:<taskId>`). They differ *only* by label. Any mock or
   handler keying on `phase` alone shadows both and returns the wrong shape — exactly what
   `workflow-template.test.mjs` is forced to work around today: `defaultImpl` matches
   `seat === 'war-refiner' && opts.phase === 'Provision'` (catching both) and must add a separate
   label-regex line for polish, and `isProvisionRun` must `&&` a `/^provision-run:/` label regex onto the
   phase check. Parsing label prefixes to recover the dispatch identity is the footgun, and audits
   repeatedly mis-flag the second ladder line as "unreachable."
9. **Deliberate uncalled/invariant-documentation code is re-litigated every phase**
   (`provision-conservative-heal-not-gated-on-ahead-check`). A `branch_ahead_of` helper (defined, never
   called — it documented a heal invariant) was flagged as dead code **four separate times** by auditors
   before being deleted. There is no recognized marker for "deliberately unwired," so the audit lens
   re-flags such constructs each phase. The naive "fix" (wiring an ahead-check into the conservative heal)
   would have introduced a work-destroying ref-reset path — so the class needs a *convention*, not a wiring.

These are one cluster because they share a mechanism (imperfect input / half-run state at an engine seam)
and one enforcement mode (mechanical: a guard, a table, a marker convention, a drift test) — not a UX theme.

**Relationship to the sibling run-lifecycle spec.** `docs/specs/2026-07-08-war-run-lifecycle-robustness-design.md`
(ratified, ADR 0021) covers three *adjacent* frictions from live `/war` runs: the provision **dispatch
contract** (refiner mode three + `ENV_OUTCOME` capture + evidence-gated `env-blocked`), phase-scoped
worktree **keying**, and launch-args **entry validation** (#586). This spec deliberately does **not** re-open
any of those decisions. It takes only the slices ADR 0021 left open (§9), and its future plan must be
roadmap-ordered **after** the ADR 0021 plan lands (both edit the same `workflow-template.js` dispatch
surface and `provision-worktrees.sh`) — or explicitly rebase over it.

## 2. Pivotal constraints

- **Trust-boundary hardening is never "lazy away"-able.** Input validation at ingest (config file,
  Workflow `args`, session cwd, a relaunch's git state) is exactly the class ponytail's "when NOT to be
  lazy" protects. Every guard here is minimal but present.
- **The Workflow sandbox cannot import** (CLAUDE.md; ADR-adjacent). `workflow-template.js` and
  `workflow-scaffold.js` run in a no-filesystem, no-`import` sandbox. A "single shared helper" spanning the
  two args-parse sites is therefore impossible via `import`; any shared logic is a **hand-mirrored**
  construct governed by a drift-guard test (the same discipline as `HARD_ESCALATION_REASONS` /
  `land-decision.mjs`). The two parse sites are the *only* two, so a mirrored one-liner is the correct shape.
- **`provision-worktrees.sh` stays bash-3.2-safe** (macOS 3.2.57 — no globstar, no associative arrays,
  no `${,,}`) and remains the **single tested owner** of all shared git-topology mutation. Indexed arrays
  and process substitution `< <(…)` are 3.2-safe and permitted.
- **ADR 0003 (plan-namespaced branches; fail-loud on foreign refs) is respected.** The default
  `cmd_ensure_integration` path still dies loud (exit 3) on an unowned branch. Any self-heal is **opt-in
  (an explicit Lead-supplied flag on a sanctioned recovery relaunch)** and evidence-gated — it never
  silently reclaims a foreign branch on a first launch.
- **ADR 0008 (git is the resume source of truth; repair toward git, never git toward records) and the
  never-destroy-work invariant.** A self-heal may delete an orphan branch **only** after mechanically
  proving it carries no unique commits (`git log <base>..<branch>` empty) **and** is absent from origin
  (`git ls-remote --exit-code`). This honors learning
  `provision-nonidempotent-orphan-integration-branch-blocks-relaunch` verbatim ("Never delete an orphan
  integration branch without first proving it carries no unique commits") and learning
  `provision-conservative-heal-not-gated-on-ahead-check`'s warning against any ref-**reset** heal (deleting
  a proven-empty branch resets no work).
- **Both-surfaces rule.** Auditor/refiner behavior lives in dispatched prompts (`workflow-template.js`)
  **and** standing cards (`agents/*.md`); any behavioral change lands in both in the same commit,
  drift-guarded.
- **Enum discipline (ADR 0005).** No new `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or
  `MERGE_RESULT`/task-status members. A wrong-class ingest failure routes to the **existing**
  `held:workflow-error` via the existing catch, git untouched. `held:workflow-error` is never added to
  `HARD_ESCALATION_REASONS`.
- **Fail-open hooks stay fail-open.** `inject-campaign-state.sh` may never abort a session; the word-split
  fix must preserve its "no campaign → silent exit 0" posture.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. `overrides` non-object guard (friction 1)** | In `war-config.mjs` `validate()`, add `if (!isObj(c.overrides)) { errors.push('overrides must be an object') }` and wrap the existing known-key loop in the `else`, **mirroring the `memory` block three lines above**. `deepMerge` still preserves `overrides: null`, but `validate()` now returns a clean `{ valid: false, errors: ['overrides must be an object'] }` instead of throwing. Regression cases: `validate({overrides: null})` and `validate({overrides: 'x'})` return `valid: false` with that error and **do not throw**. Rejected: a `try/catch` in `main()` (masks the class instead of naming it; the sibling `memory` guard is the established idiom). |
| **B. Scalar-safe args normalization (frictions 2)** | Add, at **both** parse sites, a mirrored guard after the parse: the normalized value must be a non-null object (`typeof x === 'object' && x !== null && !Array.isArray(x)`), else — in `workflow-template.js` (drives real dispatch) **throw** a named error (`workflow-template: args must be a JSON object, got <type>`) that routes to `held:workflow-error`; in `workflow-scaffold.js` (a throwaway probe) fall back to `{}` (its existing catch posture) so the downstream fingerprint check produces the clean "titleLine required" refusal. Rejected: a **single importable shared helper** — the sandbox cannot import (§2); the two sites are the only two, so a mirrored one-liner + a drift-guard test is the correct shape, not a new module. |
| **C. Engine-level undefined-render guard (friction 3)** | Introduce one thin `dispatch(prompt, opts)` wrapper in `workflow-template.js` that **all** spawn sites route through (mechanical rename of the ~24 `await agent(...)` call sites to `await dispatch(...)`); the wrapper throws before spawning if the fully-interpolated `prompt` contains the literal token `undefined` (word-boundary match), with a message naming `opts.label` and hinting "a required interpolation input was missing." Generalizes the `#586` derivation-path fix to *every* interpolated field. The 3-case derivation test stays the per-gate pattern. Rejected: per-site asserts (the recurring-class problem the friction names); scanning `opts` inputs instead of the rendered prompt (misses fields interpolated from nested/derived values). False-positive risk (a legitimate prose "undefined") is accepted and mitigated (§8): engine-authored prompts reword to "unset"/"absent". |
| **D. Newline/space-safe campaign-ledger sort (friction 4)** | In `inject-campaign-state.sh`, replace `printf '%s' "$candidates" \| xargs ls -t` with: read `$candidates` into a bash **indexed array** via `while IFS= read -r f; do [ -n "$f" ] && arr+=("$f"); done`, then iterate `ls -t "${arr[@]}"`'s output through `while IFS= read -r ledger; do …; done < <(ls -t "${arr[@]}" 2>/dev/null)`. Closes the space word-split on **both** the `ls` input (array, not word-split args) and the loop (line-read, not `$(…)` split). Preserves fail-open silent-exit-0 and the newest-first mtime order. Bash-3.2-safe (indexed arrays + process substitution both work in 3.2). Rejected: `stat`-based manual mtime sort (BSD/GNU `stat` flag divergence — less portable, more code). |
| **E. Central provision exit-code table + mechanical enforcement (friction 6)** | Add a **named-constant catalogue** at the top of `provision-worktrees.sh`: `readonly EX_FOREIGN=3 EX_DIRTY_UNREG=4 EX_OUT_OF_RUN=5 EX_WRONG_BRANCH=6 EX_DIVERGED=7` (1 = generic `die` default), with a comment block naming each code's meaning and its governing ADR. Every coded `die` references the constant (`die "…" "$EX_DIVERGED"`) instead of a bare literal. Enforcement: a `provision-worktrees.test.sh` case asserts (a) every `die "…" <n>` in the file uses a catalogued constant (no un-catalogued numeric literal), and (b) the surfacing contract — **any non-zero provision exit halts** — is documented and the Provision prompt keys on non-zero, not a specific code. Satisfies *both* of the friction's options at once. Rejected: a comment-only table (does not prevent a future un-catalogued `die` from drifting in). |
| **F. Explicit target-repo arg for `ensure-exclude` (friction 7)** | `cmd_ensure_exclude` gains an **optional positional `<repo-dir>`**; when supplied it resolves the git dir via `git -C "<repo-dir>" rev-parse --git-dir` instead of cwd. Absent → current cwd behavior (back-compat for the existing no-arg tests). The Provision barrier prompt (and `agents/war-refiner.md`) is updated to pass `mainCheckout` explicitly, so the contract is **code-enforced** at the wired call site rather than prompt-pinned. Sibling cwd-resolving subcommands are noted but not rewritten (they already run from the refinery worktree by construction; ensure-exclude is the one whose target *must* be the main checkout, not the caller's worktree). Rejected: making the arg **required** (breaks the existing no-arg unit tests and the ledger-less callers for no safety gain when cwd already is the repo). |
| **G. Self-healing provision barrier for an empty orphan branch (friction 5)** | `cmd_ensure_integration` gains an **opt-in `--reclaim-empty-orphan` flag** (Lead-supplied only on a sanctioned recovery relaunch — never on a first launch). When the branch exists, is **not** owned, its name is in **this run's exact namespace** (`integration/<slug>/phase-<N>`), and the reclaim flag is set, the barrier proves it is a safe orphan — `git log <base>..<branch>` is **empty** (no unique commits) **and** `git ls-remote --exit-code origin <branch>` reports it **absent from origin** — then deletes it and re-cuts fresh (or records it owned), logging the proof. If **either** proof fails → the unchanged exit-3 die (never delete a branch with unique commits or one published to origin). Default path (no flag) is byte-identical to today (exit 3). This is the mechanical replacement for the manual, dangerous orphan-clearing; it composes with ADR 0021's owned-file-continuity recovery relaunch (owned-file continuity reuses a branch **with** landed sibling commits; `--reclaim-empty-orphan` clears a **provably empty** half-run leftover). Rejected: **automatic** reclaim on any launch (erodes ADR 0003's foreign-branch protection); a `branch_ahead_of`-style ahead-check wired into the *heal* (learning `provision-conservative-heal-not-gated-on-ahead-check` — introduces a work-destroying reset path). |
| **H. First-class dispatch discriminator for the Provision dispatches (friction 8)** | Add a stable `dispatchKind` field to the spawn `opts` of the provisioning dispatches — `provision-barrier`, `provision-run`, `polish-worktree` — so mocks, handlers, and the audit lens key on `opts.dispatchKind` rather than `opts.phase` + a parsed `label` prefix. `workflow-template.test.mjs`'s `defaultImpl`, `isProvision`, and `isProvisionRun` switch to the discriminator; a test asserts the barrier and the per-task provision-run carry **distinct** `dispatchKind` values (so no handler can shadow both). Removes the recurring "second ladder line unreachable" audit false-flag. Coheres with ADR 0021's `provision` refiner mode (the discriminator names *which* provision dispatch; the mode names the refiner's *duty*). Rejected: renaming `phase` (semantically load-bearing across scheduling/logging); relying on `label` string-prefix parsing (the footgun itself). |
| **I. Recognized marker for deliberately-unwired code (friction 9)** | Standardize the repo's existing `// ponytail:` / `# ponytail:` comment token (already present in `provision-worktrees.sh` and CLAUDE.md's memory pointer discipline) as the recognized signal for "deliberately uncalled / invariant-documentation code." Add one clause to `agents/war-auditor.md` (standing surface): a construct on the line(s) named by a `ponytail:` / `deliberately-unwired:` comment stating *why* it is intentionally unwired is **not** a dead-code finding — re-flagging it is out of scope. Convention + one standing-card clause; no code deleted (the `branch_ahead_of` helper is already gone). Rejected: a lint/floor script that greps for uncalled functions (a whole-repo static-analysis apparatus for a documentation-convention problem — the over-build the friction's own history warns against). |

## 4. Mechanics (per component/role)

### `skills/war/assets/war-config.mjs` (A)
In `validate()`, immediately before the `KNOWN_OVERRIDES` loop, add the `isObj(c.overrides)` guard and
move the loop into its `else`, byte-mirroring the `memory` block's shape (`if (!isObj(mem)) { errors.push(…) }
else { … }`). `isObj` (module-top: `v !== null && typeof v === 'object' && !Array.isArray(v)`) already exists
— reuse it. No new export, no `main()` change.

### `skills/war/assets/workflow-template.js` (B, C, H)
- **B:** after `const A = typeof args === 'string' ? JSON.parse(args) : (args || {})`, add the non-null-object
  guard; on failure `throw new Error('workflow-template: args must be a JSON object …')` inside the existing
  `try{}` → `held:workflow-error`. Wrap the bare `JSON.parse` in the same `try` so a malformed string is the
  same clean class (not a raw `SyntaxError` escaping the sandbox).
- **C:** define `const dispatch = (prompt, opts) => { if (/\bundefined\b/.test(prompt)) throw new Error(\`dispatch \${opts.label || '(no label)'}: interpolated prompt contains literal "undefined" — a required input was missing\`); return agent(prompt, opts) }`; rename every `await agent(` spawn site to `await dispatch(`. (`agent` remains the Workflow-provided primitive `dispatch` closes over.)
- **H:** the two Provision dispatches and the polish dispatch each gain `dispatchKind` in their `opts`
  (`provision-barrier` at the phase git-topology barrier, `provision-run` at `provisionStep`,
  `polish-worktree` at the phase-close sweep). Source comments at each site name the `dispatchKind` +
  the paired `agents/war-refiner.md` mode (learning `source-comment-lags-emitted-prompt-after-rewrite`).

### `skills/red-team/assets/workflow-scaffold.js` (B)
In the `try { A = typeof args === 'string' ? JSON.parse(args) : (args ?? {}) } catch { A = {} }` block, add
the non-null-object check to the success path: a valid scalar is normalized to `{}` (same posture as the
catch), so the existing "`args.fingerprint.titleLine` is required" refusal fires cleanly instead of a raw
destructure `TypeError`.

### `skills/war/assets/provision-worktrees.sh` (E, F, G)
- **E:** named `readonly EX_*` constants + catalogue comment at the top (near `PROG`/`die`); rewrite each
  coded `die` (lines carrying `3`/`4`/`5`/`6`/`7`) to use the constant.
- **F:** `cmd_ensure_exclude` accepts an optional `<repo-dir>` positional; resolve via `git -C` when present.
- **G:** `cmd_ensure_integration` gains `--reclaim-empty-orphan`; on an unowned same-namespace branch with
  the flag set, run the two-proof check (empty `git log <base>..<branch>` + `git ls-remote --exit-code origin`
  absence) and reclaim-or-die-3. New/extended `provision-worktrees.test.sh` cases: reclaim of a proven-empty
  origin-absent orphan succeeds; a branch with a unique commit → exit 3 (no delete); a branch present on
  origin → exit 3; the flag absent → exit 3 (default byte-identical).

### `hooks/inject-campaign-state.sh` (D)
Replace the `xargs ls -t` line with the indexed-array + `< <(ls -t "${arr[@]}")` line-read loop. Keep the
`is_active` filter, the winner/passed-over bookkeeping, and both silent-exit-0 guards untouched.

### `agents/war-refiner.md` (F) and `agents/war-auditor.md` (I) — standing surfaces
- **war-refiner.md:** the provisioning-duty section notes `ensure-exclude` is now called with the explicit
  main-checkout path (both-surfaces coherence with the template prompt change).
- **war-auditor.md:** one clause — a construct annotated with a `ponytail:` / `deliberately-unwired:`
  comment stating why it is intentionally uncalled is not a dead-code finding.

### Tests
`war-config.test.mjs` (A cases), `workflow-template.test.mjs` (B throw, C guard 3-case, H discriminator +
mock/`isProvisionRun` switch), `workflow-scaffold.test.mjs` (B scalar case), `provision-worktrees.test.sh`
(E catalogue + surfacing, F target-repo, G reclaim proofs). A drift-guard test asserts the B guard exists at
**both** args-parse sites.

## 5. Surface changes (files touched)

- `skills/war/assets/war-config.mjs` — `overrides` non-object guard (A).
- `skills/war/assets/war-config.test.mjs` — `overrides: null` / `'x'` regression cases (A).
- `skills/war/assets/workflow-template.js` — args scalar guard (B); `dispatch` undefined-render wrapper +
  call-site rename (C); `dispatchKind` on the three provision dispatches (H).
- `skills/war/assets/workflow-template.test.mjs` — B/C/H cases; mock + `isProvision`/`isProvisionRun`
  switch to `dispatchKind`.
- `skills/red-team/assets/workflow-scaffold.js` — args scalar guard (B).
- `skills/red-team/assets/workflow-scaffold.test.mjs` — scalar-arg case (B).
- `skills/war/assets/provision-worktrees.sh` — exit-code catalogue (E); `ensure-exclude` target-repo arg
  (F); `ensure-integration --reclaim-empty-orphan` self-heal (G).
- `skills/war/assets/provision-worktrees.test.sh` — E/F/G cases.
- `hooks/inject-campaign-state.sh` — newline/space-safe ledger sort (D).
- `hooks/inject-campaign-state.test.sh` — space-bearing-path case (D).
- `agents/war-refiner.md` — explicit-target `ensure-exclude` note (F, both-surfaces).
- `agents/war-auditor.md` — deliberately-unwired marker clause (I).
- `CONTEXT.md` — new terms (§6).
- No changes: `land-decision.mjs`, any enum set, any other hook. (ADR 0021's dispatch-contract/keying/
  entry-validation edits are that spec's; this plan is sequenced after it.)

## 6. New domain terms (CONTEXT.md)

- **Ingest guard** — a defensive check at an engine trust boundary (config file, Workflow `args`, session
  cwd, a relaunch's git state) that converts imperfect input into a *named* clean error, never a raw
  `TypeError` / crash. The `overrides` object guard, the args non-null-object guard, and the undefined-render
  guard are all ingest guards. _Avoid_: input sanitizer (implies mutation; these reject, not clean).
- **Undefined-render guard** — the `dispatch()` wrapper's assertion that no interpolated agent prompt ships
  the literal token `undefined`; a missing interpolation input throws (naming the dispatch label) instead of
  silently sending garbage to a sub-agent. _Avoid_: prompt validator (too broad — this checks one signature).
- **Provision exit-code catalogue** — the named-constant table in `provision-worktrees.sh` (`EX_FOREIGN=3`,
  `EX_DIVERGED=7`, …) that is the single source of the script's non-zero exit meanings; the surfacing contract
  is "any non-zero = halt." _Avoid_: error codes (undifferentiated from git's own).
- **Empty-orphan reclaim** — the opt-in, evidence-gated self-heal by which the Provision barrier deletes and
  re-cuts a half-run's orphaned integration branch **only** after proving it carries no unique commits and is
  absent from origin. Distinct from ADR 0021's owned-file-continuity recovery relaunch (which *reuses* a
  branch carrying landed commits). _Avoid_: force reclaim, branch cleanup (neither names the two proofs).
- **Dispatch kind** — the stable `opts.dispatchKind` discriminator (`provision-barrier`, `provision-run`,
  `polish-worktree`, …) that identifies *which* engine dispatch a call is, so handlers/mocks/audits key on it
  rather than parsing `label` prefixes or matching on `phase` alone. _Avoid_: dispatch type (collides with
  `agent_type`).
- **Deliberately-unwired marker** — the recognized `ponytail:` / `deliberately-unwired:` comment naming *why*
  a construct is intentionally uncalled; the audit lens does not raise dead-code findings against it. _Avoid_:
  dead-code exemption (sounds like a suppression list).

## 7. Recommended ADRs

- **New ADR 0023 — "Engine ingest guards & provision exit-code contract."** Records: every engine trust
  boundary returns a named clean error, never a raw crash (A/B/C); the provision exit-code catalogue is the
  single source of non-zero meanings and the surfacing contract is "any non-zero = halt" (E); the Provision
  barrier's empty-orphan reclaim is opt-in, same-namespace, and two-proof-gated (G), extending ADR 0003
  (foreign-branch fail-loud stays the default) and ADR 0008 (repair toward git; never a work-destroying
  reset — deleting a proven-empty branch resets no work). Explicitly leaves ADR 0005's enum sets untouched.
- **Amend ADR 0002 (scope by agent_type) or ADR 0013 (disposition routing) — minor:** note the
  deliberately-unwired marker convention (I) as an audit-lens exemption (whichever ADR the auditor-card
  clause most naturally extends; a standalone ADR is overkill for a one-clause convention).
- No ADR for D or H (a hook word-split fix and a test-ergonomics discriminator — implementation detail).

## 8. Open risks / implementation notes

- **Undefined-render guard false positives (C).** `/\bundefined\b/` matches a legitimate prose "undefined" in
  an engine-authored prompt. Mitigation: WAR prompts are engine-authored and few; reword any legitimate
  literal to "unset"/"absent". If a real collision surfaces, narrow the pattern to interpolation-adjacent
  signatures (`/undefined`, `undefined-`, `:undefined`, `"undefined"`) rather than a bare word — but start
  with the simplest guard and tighten only on evidence.
- **Empty-orphan reclaim vs. a concurrent same-plan run (G).** Two concurrent runs of the *same* plan+phase
  is already undefined, and the two proofs (empty log + origin-absent) guarantee nothing is lost even in that
  case. The reclaim is opt-in on a Lead-sanctioned relaunch, so it never fires unattended. Accepted residual.
- **`ensure-exclude` sibling cwd-coupling (F).** Only `ensure-exclude` is rewired here; other cwd-resolving
  subcommands run from the refinery worktree by construction. If a future call site moves, apply the same
  explicit-target pattern — do not pre-emptively rewire all siblings (YAGNI).
- **Prompt-surface sequencing.** This plan's `workflow-template.js` dispatch edits (C/H) and
  `provision-worktrees.sh` edits (E/F/G) collide with the ADR 0021 plan on the same surfaces; the roadmap
  must land this **after** ADR 0021's plan, or rebase. State the base explicitly at roadmap time (learning
  `plan-gate-enumeration-stale-after-stacking`).
- **Mirrored-guard drift (B).** The two args-parse guards are hand-mirrored across sandbox files; the
  drift-guard test is load-bearing (learning `standing-instruction-vs-dispatched-prompt-coverage-split`).
- **Anchor every test by named construct** (`validate`, `dispatch`, `dispatchKind`, `EX_DIVERGED`,
  `--reclaim-empty-orphan`), never a line number (they rot across the serial merge queue).

## 9. Non-goals / deferred

- **No re-opening of ADR 0021 decisions** — the provision dispatch **contract** (`ENV_OUTCOME` capture,
  evidence-gated `env-blocked`, refiner mode three), phase-scoped worktree **keying**, and launch-args
  **entry validation** are that spec's; this spec only adds the `dispatchKind` discriminator (H) on top of
  the dispatches ADR 0021 already unified, the general undefined-render guard (C) on top of its trio-only
  entry check, and the empty-orphan reclaim (G) alongside its owned-file-continuity playbook.
- **No `resumeFromRunId` change** — the journal stays off-ladder (ADR 0021 / design.md §6); empty-orphan
  reclaim is a Provision-barrier concern, not a resume-cache one.
- **No `MERGE_RESULT` / `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` / `land-decision.mjs` change**
  (ADR 0005). Every wrong-class ingest failure routes to the existing `held:workflow-error`.
- **No whole-repo dead-code lint** (I is a comment convention + one auditor clause, not a static-analysis
  apparatus).
- **No non-numeric phase ids, no auto-heal worktree re-point** — those are ADR 0021's deliberate keeps (E/F
  there); unchanged here.
- **No rewrite of sibling cwd-resolving subcommands** beyond `ensure-exclude` (F).
- **No new dependency, no new module** — the sandbox-can't-import constraint makes a shared parse helper a
  mirrored one-liner, not a file.

## 10. Validation criteria (concrete, testable)

1. **`overrides` guard (`war-config.test.mjs`):** `validate({overrides: null})` and `validate({overrides: 'x'})`
   each return `{ valid: false, errors: [...] }` containing `'overrides must be an object'` and **do not throw**;
   a valid `overrides` object still validates as before (delete-the-feature: reverting the guard makes the
   `null` case throw).
2. **Args scalar guard (`workflow-template.test.mjs` + `workflow-scaffold.test.mjs`):** invoking with
   `args = 'null'` (and `'true'`, `'5'`) in the template → `held:workflow-error` naming "args must be a JSON
   object", **not** a raw `TypeError`, zero agents dispatched; in the scaffold → the clean
   "titleLine required" refusal. A drift-guard test asserts the non-null-object guard is present at **both**
   parse sites.
3. **Undefined-render guard (`workflow-template.test.mjs`):** a dispatch whose interpolated prompt contains the
   literal `undefined` throws before spawn, the error names the dispatch `label`, and no agent is dispatched;
   the 3-case pattern (present field → no throw; missing field → throw; label named) holds; reverting the
   guard lets the `undefined`-bearing prompt ship (delete-the-feature).
4. **Campaign-ledger sort (`inject-campaign-state.test.sh`):** with a campaign directory path **containing a
   space**, the newest-active campaign is still selected and injected (today's `xargs` version fails this);
   with no active campaign the hook still exits 0 silently; newest-first order preserved for multiple active
   campaigns.
5. **Exit-code catalogue (`provision-worktrees.test.sh`):** every `die "…" <n>` in `provision-worktrees.sh`
   uses a catalogued `EX_*` constant (no un-catalogued numeric literal — grep assertion); the catalogue names
   codes 3/4/5/6/7 and their ADRs; the surfacing contract "any non-zero = halt" is documented and asserted.
6. **`ensure-exclude` target repo (`provision-worktrees.test.sh`):** `ensure-exclude <repo-dir>` invoked from a
   **different** cwd writes the `.claude/` exclude into `<repo-dir>`'s git dir (not the caller's); the no-arg
   form is byte-identical to today.
7. **Empty-orphan reclaim (`provision-worktrees.test.sh`):** with `--reclaim-empty-orphan`, a same-namespace
   unowned branch that is proven empty (`git log <base>..<branch>` empty) **and** origin-absent is deleted and
   re-cut (relaunch proceeds); the **same** branch carrying one unique commit → exit `EX_FOREIGN` (3), branch
   **not** deleted; a branch present on origin → exit 3, not deleted; **without** the flag → exit 3 (default
   byte-identical to today).
8. **Dispatch discriminator (`workflow-template.test.mjs`):** the phase git-topology barrier and the per-task
   provision-run carry **distinct** `opts.dispatchKind` values; the mock, `isProvision`, and `isProvisionRun`
   key on `dispatchKind` (no `label`-prefix regex); a handler keying on `dispatchKind` can select one dispatch
   without shadowing the other (delete-the-feature: collapsing them to a single `dispatchKind` makes the
   distinctness assertion fail).
9. **Deliberately-unwired marker (grep-able, `agents/war-auditor.md`):** the standing card names the
   `ponytail:` / `deliberately-unwired:` marker as a dead-code-finding exemption (presence check).
10. **Both-surfaces coherence (grep-able):** `agents/war-refiner.md` reflects the explicit-target
    `ensure-exclude` call (F); the `dispatchKind` names used in `workflow-template.js` prompts and the modes in
    `agents/war-refiner.md` are consistent (no orphaned discriminator).
