# Servitor wrap-up grounds on a threaded landed-tip anchor — retire the cwd-is-tip premise from both prompt surfaces

Source spec: `docs/specs/2026-07-22-servitor-wrapup-landed-tip-design.md` (from issue #990; 2026-07-22 survey).

Sequencing (campaign spine, authoritative in the survey manifest — not re-mechanized here): stacks on
`docs/plans/2026-07-22-audit-adjudication-threading.md`, which stacks on
`docs/plans/2026-07-22-auditor-guard-ergonomics.md`. See Notes for the stated stacking assumptions.

## AI-Commander's Intent

*(AI-drafted per ADR 0014 — unattended `/war-machine --afk` conversion of the ratified spec; the
heading variant is the provenance marker, never operator-confirmed; `/red-team` ratifies)*

- **Purpose:** the servitor stops trusting its own cwd as the just-landed phase — the engine threads
  the landed-tip anchor it already computes, both wrap-up prompt surfaces carry the grounding ladder
  the 11 recorded recurrences distilled, and the false "your working tree IS the committed tip"
  premise is retired everywhere it is asserted — so phase-close capture stops minting
  confidently-wrong `code-verified` lessons from stale checkouts and stops wasting rounds hunting
  worktrees Refine already reaped.
- **Method:** hoist the handoff block's existing `tipSha` computation above the Wrap-up dispatch and
  reuse it — one source of truth, zero new tip semantics, the null case pre-resolved to a named
  placeholder string so the `pt` undefined-interpolation guard can never fire (ADR 0034); carry the
  compact four-step grounding ladder (cwd preflight → `gitdir`-matched worktree lookup → ref-check
  dead-end → gate-audit fallback) as ONE shared clause per surface, servitor confinement untouched
  (no Bash, Read/Grep/Glob only — ADR 0002); rewrite the premise parenthetical at both surfaces in
  the same task and lock everything with a new D3 both-surfaces registry row at an exact no-slack
  floor, whole-string premise-absence guards, and threaded-value tests; amend ADR 0029 append-only;
  the origin lesson gets a dated mitigation note, never an archive.
- **End state:**
  1. Both prompt surfaces — `agents/war-servitor.md` and the dispatched Wrap-up prompt string-built
     in `skills/war/assets/workflow-template.js` — carry the landed-tip anchor input and the
     four-step grounding ladder as one shared clause each; neither asserts the cwd-is-tip premise in
     any asserting form.
  2. The Wrap-up prompt threads a `Landed tip:` line from the hoisted handoff computation; a null
     tip pre-resolves to the named placeholder — the dispatch never throws and never renders the
     string `undefined`, test-exercised both ways (known `working_sha` present in the prompt;
     `working_sha` absent → last pinned `gateHeadSha` fallback, else the placeholder).
  3. `handoff.tipSha` semantics are byte-identical before/after the hoist — the existing
     `handoff block (criterion 6)` test passes unmodified.
  4. A new D3 both-surfaces registry row locks the grounding directive — reverting the clause on
     either surface alone reds it; the `REGISTRY.length` floor and its enumerating assertion message
     read the new exact row count, no slack (#693); the existing `servitor finding-match check` row
     passes unmodified (its four anchors survive the premise rewrite).
  5. Whole-string `doesNotMatch` guards prove the asserting cwd-is-tip form absent from both
     surfaces while the new negated grounding prose passes.
  6. `docs/adr/0029-capture-grounds-on-committed-tip.md` carries a dated append-only Amendment
     naming both superseded premise sentences; the original body above it is byte-unchanged
     EXCEPT the Status line, which reads `accepted; amended 2026-07-22` (the Status update is part
     of the body — a literal whole-body byte check would contradict it).
  7. `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md` carries the
     dated "Mechanized (#990)" mitigation note; its frontmatter `description` stays one line; the
     redaction lint stays green (`node skills/_shared/war-memory.mjs lint docs/learnings/`).
  8. `CONTEXT.md`'s `Finding-match check` entry carries the new `_Avoid_` clause; no new glossary
     term exists.
  9. `node --test 'skills/**/*.test.mjs'` green, and the self-discovery shell-test gate green
     (reference `resolveGate` in `war-config.mjs`; never an enumerated suite list).
  10. Release lands last: all four version slots in lock-step at the next free patch above the live
      base.

## Build order (for /war)

1. **Phase 1 — Thread the anchor + retire the premise** (waves: 1.1 ∥ 1.2)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Thread the anchor + retire the premise

### Task 1.1: Hoisted landed-tip threading + grounding ladder on both surfaces + drift guards

- Files: `skills/war/assets/workflow-template.js`, `agents/war-servitor.md`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **Engine — hoist + thread (spec D1, constraint 4).** In `workflow-template.js`, hoist
  the handoff block's `lastPinned` + `tipSha` computation (the `working_sha`-when-landed chain, else
  the last SHA-shaped `gateHeadSha` in `mergedTasksForGateAudit`, else null — currently inside the
  `if (landDecision === 'landed' || landDecision === 'held:escalation')` handoff block) to **top
  level between the land section's close and the Wrap-up gate** (the `if (landResult &&
  landResult.status === 'landed' && memoryLocalRoot)` construct), **retaining its `landResult && …`
  null-guard — never inside the Wrap-up `if`**: the handoff block also emits on `held:escalation`,
  where `landResult` can be NULL (land never dispatched), and an inside-the-gate hoist would
  dereference an undeclared const there → top-level catch → `held:workflow-error` on exactly the
  degraded path that most needs a handoff. The handoff block consumes the hoisted consts unchanged
  (Wrap-up fires only on `landed`, a strict subset of the handoff's emit conditions). The hoist
  moves the computation verbatim — preserve the existing truthy-string check on `working_sha` (no
  new SHA-shape validation; see Notes on the spec-prose drift) so `handoff.tipSha` is byte-identical
  before/after (spec criterion 7); the moved lines contain no template literals, so the move leaves
  the #931 census undisturbed. Pre-resolve the null case to the named placeholder string
  ("landed tip unrecorded — ground via the gate-audit `auditSha` entries in your audit-log input")
  BEFORE any interpolation — the `pt` tag throws on undefined values (ADR 0034) and `working_sha` is
  contract-promised but not schema-required in `MERGE_RESULT`. Thread one input line adjacent to the
  prompt's phase-header line (the `Wrap up learnings for WAR phase …` fragment):
  `Landed tip: <resolved tip> on <ph.workingBranch>`. Also thread the plan slug — the Wrap-up
  prompt today carries only `ph.id`/`ph.title`/`ph.workingBranch`, and the working branch does not
  reliably embed the slug (this very campaign lands on a `claude/…` branch) — via the existing
  pt-safe idiom `planSlug || '<plan-slug>'` (already used by the Provision prompt and the
  polish-branch derivation), into the Landed-tip line or the ladder block, for the worktree-lookup
  step's `gitdir` slug-match; a missing slug degrades gracefully (tip-SHA equality stays the
  strongest rung). **Engine — grounding ladder (D3/D4).** Add
  one new `pt` block — the LANDED-TIP GROUNDING ladder — adjacent to the existing
  `FINDING-MATCH CHECK` block, carrying the compact four steps: (1) *preflight* — resolve the cwd's
  `.git` (a gitlink **file** in a worktree; a **directory** in the main checkout — read
  `<repo-root>/.git/HEAD` there) and compare its HEAD against the threaded landed tip + working
  branch; match ⇒ direct Read/Grep is `code-verified`-capable; (2) *worktree lookup* — enumerate
  `.git/worktrees/*` entries and match by each entry's `gitdir` physical path containing this plan's
  slug — never trust bare names (task-id and `_refinery` names collide across concurrent plans and
  git auto-suffixes numerically); an entry `HEAD` equal to the threaded tip SHA is the strongest
  match; read referents at that entry's `gitdir` path; (3) *ref check* — a loose/packed ref for the
  landed branch with no live worktree is still a dead end for Read — spend no rounds on it;
  (4) *gate-audit fallback* — trust the pinned `auditSha` verdicts (`gateEvidence:true`) in the
  audit-log input, and record anything else `agent-unverified` with the checkout-topology evidence
  in the absence-note; never assert a plan/code mismatch from a lagging view. **Engine — premise
  rewrite (D5).** Rewrite the `FINDING-MATCH CHECK` parenthetical ("your post-land working tree IS
  the committed tip — no new capability needed") to the explicit inversion: the working tree is NOT
  assumed to be the committed tip — ground on the threaded landed tip via the grounding ladder
  (still no new capability). **Standing card (constraint 1 — same task as the template).** In
  `agents/war-servitor.md`: `## Inputs` gains the landed-tip anchor bullet (the tip SHA + working
  branch the phase landed on, or the named unrecorded-placeholder semantics); new subsection
  "Landed-tip grounding — run before any D3 / finding-match read" adjacent to the admission
  checklist, carrying the same four-step ladder; the D3 absence-note arm and the Finding-match check
  paragraph reference it (one shared clause, never per-discipline duplicates — D4); the premise
  sentence ("your post-land working tree *is* the committed tip, so this needs no new capability")
  rewritten per D5. The finding-match discipline itself (match → `code-verified` with locate-cue /
  no match → generic pattern at `agent-unverified`) is untouched — constraint 7. **Drift guards
  (D6 — the registry row lands in the SAME task as the directive).** In
  `workflow-template.test.mjs`: (a) new D3 both-surfaces registry row for the grounding directive —
  surfaces `['war-servitor.md', servitorMd]` + `['servitor Wrap-up prompt', servitorP]`; anchors
  chosen from tokens unique to the new clause (e.g. stale-cwd / `gitdir` / "not assumed" /
  gate-audit fallback — exact regexes are worker latitude, but each must red on a per-surface
  revert; verify red-first by temp-revert during development). Anchor-token precondition: every
  new-row anchor must be a token ABSENT from both surfaces today (`/gitdir/i` and a "not assumed"
  token verified absent at draft time) — in particular never reuse `/<session-worktree>/i`, which
  already appears in the standing card's D3 path-hygiene text and is anchored by the EXISTING
  path-hygiene registry row: behind a reused token, a ladder-only revert would stay green. Bump the
  `REGISTRY.length` floor and
  its enumerating assertion message to the new exact row count in the same edit — floor equals true
  count, no slack (#693); resolve the count against the REBASED integration tip at implementation
  time (see Notes for the expected sibling-plan state), never a literal frozen from this plan.
  (b) Premise-absence guards: `assert.doesNotMatch` on BOTH whole surface strings (whole-string
  regex, never line-scoped — a pairing wrapping a line break must still be caught) for the asserting
  cwd-is-tip form (working-tree … is/IS/reflects … committed-tip), anchored so the new negated
  prose ("is NOT assumed to be the committed tip") passes — anchor the asserting form or exclude the
  negation token. (c) Threaded-value tests: with the test's fake land dispatch returning a known
  `working_sha`, the dispatched servitor prompt contains that SHA in its `Landed tip:` line; with
  `working_sha` deleted from the fake result, the dispatch does not throw (the `pt` guard stays
  unhit) and the prompt renders the documented fallback (last pinned `gateHeadSha`, else the named
  placeholder) — never the string `undefined`. (d) The existing `handoff block (criterion 6)` test
  and the existing `servitor finding-match check` registry row (anchors `finding-match` /
  `named construct` / `pattern, not live instance` / `agent-unverified`) pass unmodified. **#931
  census discipline (whole task):** every new prompt string is `pt`-tagged (or single-quoted); no
  backticks in new comments — the untagged-template-literal census in `workflow-template.test.mjs`
  is default-deny exact-multiset, so an untagged backtick addition reds CI; `LITERAL_REGISTRY`
  should need no touch. **Premise
  sweep (this task's half) + mandatory survey.** Grep "committed tip" over `agents/` and
  `skills/war/assets/`: the asserting hits are exactly the two premise sentences this task rewrites;
  the auditor-pin hits ("the worker's committed tip", near the AUDIT PIN comment and the audit-seat
  pin machinery) assert a different, true fact and are confirmed-correct, not edited. Then hand-scan
  the same-scope prose/comments of both surfaces for same-meaning siblings that encode the premise
  in different words; list stragglers as survey-derived corrections in the done report. Spec §10
  criteria 1–7.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: ADR 0029 amendment, lesson mitigation note, glossary `_Avoid_` clause

- Files: `docs/adr/0029-capture-grounds-on-committed-tip.md`, `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md`, `CONTEXT.md`
- Plan slice: **ADR (D7 — append-only, never rewrite).** Append a dated Amendment section
  (2026-07-22) to `docs/adr/0029-capture-grounds-on-committed-tip.md`; the original body above the
  amendment stays byte-unchanged EXCEPT the Status line, updated to "accepted; amended 2026-07-22"
  — the Status update and the appended section are the ONLY edits (the Status line sits inside that
  body, so a literal whole-body byte check is not the criterion). The amendment names BOTH
  superseded premise sentences — decision item 1's "its working tree **is** the committed tip" and
  the ADR 0002 relationship bullet's "already **reflects** the committed tip" (the phrasing a naive
  "is the committed tip" grep misses — survey-derived straggler from the spec) — records the
  11-recurrence evidence (2026-07-10 → 2026-07-19, five campaigns, lesson
  `servitor-verify-on-write-worktree-can-lag-just-landed-phase`, modal case: main checkout with zero
  live worktrees), and states the corrected mechanism: capture still grounds on the committed tip
  (decision unchanged, strengthened), but via the threaded landed-tip anchor + prompt-borne
  grounding ladder, not the servitor's own working tree. **Lesson (D8 — mitigation note, never
  archive).** Append a short dated "Mechanized (#990)" note to the origin lesson: the ladder is now
  standing guidance on both wrap-up prompt surfaces and the engine threads the landed-tip anchor;
  the recurrence history stays as canonical long-form detail (the lesson is a cross-linked hub —
  temperature moves are out of scope). Frontmatter `description` stays one line (projection byte
  budget is description-driven). This is a normal worker edit landing via the phase PR, not a
  servitor write; the fail-closed redaction lint (`node skills/_shared/war-memory.mjs lint
  docs/learnings/` — exactly what CI runs) must stay green. **Glossary (D9 — extend, never mint).**
  In `CONTEXT.md`, extend the existing `Finding-match check` entry's `_Avoid_` clause with the trap:
  assuming the wrap-up cwd is the committed tip — ground on the threaded landed-tip anchor. No new
  term; the entry's definition prose ("at the landed tip") needs no correction (survey-confirmed in
  the spec). **Premise sweep (this task's half) + mandatory survey.** Grep "committed tip" over
  `docs/adr/` and `CONTEXT.md` and hand-survey for same-meaning siblings: the two ADR 0029 sentences
  are the amendment's named targets;
  `docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md` and
  `docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md` repeat the premise and are
  DELIBERATELY uncorrected (historical-artifact convention, spec constraint 5) — do not edit them;
  stale copies under `.claude/teams/` and `.claude/war/runs/` are uncommitted run scratch — out of
  scope, never edited. Spec §10 criteria 8–11.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land
  time — `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`,
  and the README `## Status` line (replace-in-place, no badge). `version-slots.test.mjs` is the
  arbiter — never a resolved v-literal from this plan (version literals in plans are
  non-authoritative). Expected integration base: branch `claude/work-audit-specs-plans-4304cd`
  after the stacked sibling plans land — a campaign base that will have advanced by land time;
  resolve the patch from the four slots as they stand at land. Standalone fallback: a run through
  plain `/war` (outside the campaign) resolves the next free patch from the four slots itself.
  Release blurb describes the change additively: the engine threads a landed-tip anchor into the
  servitor wrap-up and both prompt surfaces carry the stale-cwd grounding ladder — phrase the old
  behavior as retired ("the servitor no longer assumes its cwd is the landed tip"), never as
  current; the premise-absence guards are scoped to the two servitor prompt surfaces, so README
  prose cannot trip them, but keep the blurb non-asserting anyway (release-blurb lessons).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Live ladder obedience — the drift guards prove both surfaces CARRY the directive, not that a live
  servitor honors it (the same prompt-enforced residual ADR 0029 already records): the first landed
  phase's wrap-up after release should show the ladder in use (preflight / `gitdir`-matched worktree
  evidence, or the gate-audit fallback explicitly taken) instead of a stale-cwd `code-verified`
  write · why deferred: live-agent behavior; not fixture-able in CI · runner: operator at the first
  post-release `/war` phase land, cross-checked via `/war-review` friction signals.
- Live placeholder path — a real land dispatch omitting `working_sha` rendering the named
  unrecorded-placeholder line in a live wrap-up prompt (CI exercises the path with fakes only) ·
  why deferred: needs a live degraded land, rare by construction · runner: operator inspection at
  the first live wrap-up whose prompt shows the placeholder.

## Notes / conscious deviations

- **AI-declared provenance (ADR 0014):** drafted unattended by `/war-machine --afk`; the intent and
  backstop headings carry the AI-declared variants — the heading itself is the provenance marker.
  Tone/scope/standing constraints checked against the operator-confirmed exemplar intents
  (`docs/plans/2026-07-21-lessons-learned-tighten.md`, `docs/plans/2026-07-22-lessons-learned-seed.md`);
  no divergence beyond the required heading variant. `/red-team` ratifies.
- **Stacking assumptions (stated, not re-mechanized):** this plan lands after
  `docs/plans/2026-07-22-audit-adjudication-threading.md` (drafted concurrently — unreadable at
  draft time; assumptions stated against its spec
  `docs/specs/2026-07-22-audit-adjudication-threading-design.md`): that spec's D6 explicitly adds
  NO D3 registry row and leaves the row-count floor unchanged, while it DOES touch
  `workflow-template.js` (the `adjudicationClause` consumer sites incl. the gate-audit-family seat
  prompts) and `workflow-template.test.mjs` (extending an existing both-surfaces test pair). The
  already-drafted `docs/plans/2026-07-22-auditor-guard-ergonomics.md` (lands first) adds one D3
  registry row and moves the floor to its new exact count. Consequence: at THIS plan's land time
  the registry's true row count is expected to be one above today's, and Task 1.1 bumps the floor
  to true-count-plus-one — but the binding directive is "current true row count + 1, resolved
  against the rebased tip", never these expected literals; if the sibling plan deviates from its
  spec and adds a row, the directive still resolves correctly.
- **Shared-file hotspot (cross-plan):** `skills/war/assets/workflow-template.js` and
  `workflow-template.test.mjs` are touched by at least three plans in this campaign
  (auditor-guard-ergonomics → audit-adjudication-threading → this, serialized by the campaign
  spine exactly to protect the registry and its no-slack floor). Within this plan only Task 1.1
  touches them — 1.1 ∥ 1.2 are file-disjoint.
- **Task 1.1 deliberately carries three files:** spec constraint 1 (both prompt surfaces change in
  the same commit) and D6 (a new both-surfaces directive lands its registry row in the same task)
  fuse the two surface edits and their drift guard into one task. Not a file-collision dodge.
- **Hoist fidelity over spec prose (self-adjudicated):** spec §4 describes the hoisted computation
  as "`working_sha` when status is `landed` and SHA-shaped"; the live code's check on `working_sha`
  is truthy-string only — the SHA-shape regex applies to the `gateHeadSha` fallback. Spec
  criterion 7 (byte-identical `handoff.tipSha` before/after) wins: the hoist moves the computation
  verbatim and adds no new validation. Resolved toward the checkable pair, recorded here rather
  than silently.
- **The 2026-07-08 originating spec/plan premise repeats stay uncorrected** (historical-artifact
  convention) — an auditor finding them unedited is confirming the design, not catching an
  omission. Same for the unmodified auditor-pin "worker's committed tip" comments in
  `workflow-template.js` (a different, true fact).
- **requiresPackaging: false throughout** — no packaging surface in this repo (the packaging floor
  is Dockerfile-gated and would no-op regardless).
- **No new inline mirror, no MIRROR_REGISTRY row:** the grounding ladder is a both-surfaces
  directive (D3 registry row, Task 1.1), not a hand-copied canonical export; `land-decision.mjs`
  and the mirrored enum copies are byte-untouched.

## Open decisions

None unconvertible — the spec's design tree (D1–D9) resolved every fork. Three self-adjudications
recorded per ADR 0014 (unattended pass; `/red-team` ratifies): (1) hoist fidelity resolved toward
byte-identical semantics over the spec's "SHA-shaped `working_sha`" phrasing (Notes); (2) the
registry floor is left in directive form ("current true row count + 1 at the rebased tip") with the
expected sibling-plan state recorded but non-binding (Notes); (3) the new registry row's exact
anchor regexes and the premise-absence guard's negation-exclusion shape are worker latitude within
the red-first requirement — each anchor must red on a per-surface revert, and the absence guard must
not false-positive on the negated grounding prose.
