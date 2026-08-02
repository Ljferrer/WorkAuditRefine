# Land-path correctness and standing-surface truth sweep — Gate-2 unpushed-range probe, re-land `landResult` symmetry, refiner-card accuracy, ADR/tour prose truth

Issues addressed: #1192, #1245, #1219, #1161, #1221, #1240, #1225, #1211

Survey group: `war-engine-and-standing-doc-truth` (operator-directed merge of three dependsOn-2 satellites).
dependsOn: `structural-test-nonvacuity` — both pin files this spec edits (`skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/workflow-template.test.mjs`) are concurrently hardened there; this spec's work lands **after**, rebasing its pin edits onto the hardened suites.

## 1. Context — the gap / problem

Three coherent defect families sit on or beside the `/war` land-and-publish path.

**(a) The only two behavior-changing defects in the backlog, both on the land path.**

- **#1192 — Gate-2 pre-push probe inspects only `HEAD`.** The 0.14.67 remedy for #1136 made the
  Gate-2 **Pre-push staged-file check** (the `**Post-servitor publication (Gate 2` flow in
  `skills/war/SKILL.md`) undo a condemned promotion commit (`git reset --hard HEAD~1`) instead of
  merely refusing the push — but the probe subject is `git show --name-only --format= HEAD` and
  nothing else. If Gate-2 stages a poisoned commit and the process dies **before** the push, a
  re-entry re-provisions and commits again: the poison now sits at `HEAD~1`, where the probe never
  looks, and the next `ensure-origin` push carries it to origin — the silent-release-revert
  incident class the remedy exists to close. The flow's existing `git revert` arm ("condemned docs
  commit is **not** `HEAD`") never fires, because only a probed commit can be condemned. Verified
  live: no `@{upstream}..HEAD` range form exists anywhere under `skills/war/`.
- **#1245 — re-land `submodule-pr` arms leave `landResult` stale.** In
  `skills/war/assets/workflow-template.js`, the initial land assigns the dispatched MergeResult
  directly to `landResult`, so a `status:'submodule-pr'` return leaves `pr_number`/`pr_remote`
  readable on `landResult`. Both re-land arms (dispatch labels `land:phase-<id>:environment-proceed`
  and `land:phase-<id>:baseline-proceed`) capture the dispatched result into `reLand`, and their
  `reLand.status === 'submodule-pr'` branches push the PR fields onto the `escalated` entry — but
  never run `landResult = reLand` (only the `'landed'` branches do). `landResult` stays the first,
  failed `gate_failed` attempt. Currently inert (no consumer reads `landResult.pr_number` on the
  `held:submodule-pr` path), but any future consumer works on the initial-land path and silently
  reads `undefined` on either re-land path, and a third arm authored by mirroring one of these two
  inherits the omission.

**(b) Three accuracy defects on the refiner role's standing surfaces** (all autoFixable or
one-to-few-line; the dispatched prompts are already correct — the standing card contradicts them,
exactly the standing-instruction-vs-dispatched-prompt mirror split the repo warns about):

- **#1219** — two survival-net sentences in `agents/war-refiner.md` misname their carrier dispatch.
  The closing sentence of `## Submodule-as-repo provisioning` claims "Your dispatched **merge/land**
  prompt threads the submodule targetRepo/targetBase and the 2A/2B routing" — but that section fires
  on a **provision** dispatch, whose real carrier is the provision-barrier prompt's `submodNote` in
  `workflow-template.js` (which threads targetRepo/targetBase and the
  `git submodule update --init --recursive` step). The closing sentence of
  `### Submodule phase (2A WAR-owned / 2B PR-and-hold)` over-attributes 2A/2B routing to the
  "merge/land prompt" when it lives solely in `submodLandNote`, threaded into the three **land**
  prompts only. Under adjudication row O(3) (respected, not re-opened) no reference path resolves
  against a foreign target repo, so these inline fallbacks are the **only** carrier in exactly the
  submodule/cross-repo context where they fire.
- **#1161** — the step-6 gitlink-bump bullet of `agents/war-refiner.md` shows
  `assert-no-submodule-mutation.sh --declared <integrationBranch> <taskBranch>` (flag first), but
  `skills/war/assets/assert-no-submodule-mutation.sh` binds `base="$1" branch="$2"` before its
  option loop, so the documented form dies `unexpected positional argument` exit 2 → refiner
  `status:'error'` soft-escalation on a legitimate declared gitlink bump. All five dispatched-prompt
  sites already use the trailing-flag form, and the dispatch-args phase-1 test pins `--declared`
  after both positionals — the card contradicts a test-pinned point.
- **#1221** — in `skills/war/references/refiner-recovery.md`, the sections
  `## Submodule-as-repo provisioning` and `## Reland discrimination — superproject land-phase step 3`
  each open with a `Trigger:` line; `## Submodule land arms (2A / 2B)` is the only top-level section
  without one (verified: exactly two `Trigger:` lines in the file). The ADR 0042 D4 pointer contract
  is met card-side; this is the file's own sibling convention left incomplete.

**(c) A zero-behavior-change doc-truth sweep** (the repo's established sweep genre):

- **#1240** — the dated Amendment note (2026-07-27, #1134) under the mirror-registry Consequences
  bullet of `docs/adr/0037-run-scoped-staged-phase-scripts.md` describes the third exported anchor's
  "mirror site" as the `const A =` ternary's args-fallback tail in `workflow-template.js`. That
  direction is backwards: the load-bearing `COUPLING (ADR 0037, #1134)` comment at the ternary
  itself states that `stage-workflow.mjs` **mirrors the ternary's fallback tail** — the live
  template code is the canonical source; the stager's exported constant
  (`ARGS_FALLBACK_ANCHOR`) is the hand-maintained copy, matching the direction of the existing
  `export const meta` ↔ stager-export pair.
- **#1225** — tour step 16 (`.tours/architect-war-system.tour`, "16 · Wrap-up — the write-scoped
  servitor") narrates a "four-point memory-admission checklist (D1 dedup, D2 correction-priority,
  D3 verify-cue, D4 index-hygiene)", but the live servitor Wrap-up prompt says the standing card
  "carries the FULL text of the **three** disciplines … follow ALL three" (D4 deleted; the
  template's own header records the retirement). The step's line anchor points at provision-barrier
  recovery code instead of the servitor dispatch.
- **#1211** — three sibling one-clause residuals: (1) the D22 extraction-rationale comment in
  `skill-doc-contracts.test.mjs` (the "Extraction is BY CONSTRUCT" paragraph of the D22 block)
  claims `references/setup.md` and `references/resume-and-recovery.md` each "carry both tokens" —
  verified false: `setup.md` carries only `remove-publication-worktree`, `resume-and-recovery.md`
  only `ensure-origin`; comment-only, the assertion is unaffected. (2) ADR 0008's Consequences
  bullet still says the reconciliation pre-flight's "discipline lives in `SKILL.md` prose" — it was
  evicted to `skills/war/references/resume-and-recovery.md`; SKILL.md keeps only the trigger
  pointer. (3) the `- **Outcome handling (§4.3):**` bullet in `skills/war/SKILL.md` triggers on
  "a merge/land `gate_failed` carries a `gate_failure_class`", narrower than the referenced block,
  which also covers the class-less introduced fail-safe; widen to "arrives (with or without a
  `gate_failure_class`)".

## 2. Pivotal constraints

1. **Behavior-change boundary.** Only #1192 (Lead-prose flow semantics + its pins) and #1245 (one
   assignment in two arms) change behavior. Everything else is prose, comments, or additive pins —
   any diff that widens a guard, changes an exit code, or touches an enum is out of scope.
2. **Order relative to `structural-test-nonvacuity`.** Both pin files this spec edits are
   restructured there first; this spec's pin edits rebase onto the hardened suites. Dropping the
   optional guards below makes that edge vacuous but harmless.
3. **D22 discipline is preserved, not relaxed.** The D22 row stays ONE ordered key shared by the
   live row and an unwired negative reference (both-ways proof); the rewrite must keep every arm
   load-bearing and must not decay into independent presence checks.
4. **The `reset --hard` carve-out keeps its exact scope**: an unpushed commit at `HEAD` in the
   transient Lead-owned publication worktree, and nothing else. Any condemned commit that is not
   `HEAD` is `git revert` territory — never rewind. The bounded-retry escalation rule (condemned
   again after re-provision → escalate, never loop) carries over unchanged.
5. **ADR 0037's append-only amendment channel**: all ratified/pre-existing body sentences stay
   byte-intact; the correction is a new dated note appended under the same Consequences bullet.
6. **Standing-vs-dispatched mirror discipline**: every refiner-card fix is verified against the
   dispatched-prompt carriers in `workflow-template.js` in the same diff (here the dispatched side
   is already correct — the diff records the greps proving it).
7. **Adjudicated decisions are respected, not re-opened**: adjudication row O (pointers are
   best-effort enrichment, D4 owner-relative skeleton, no plugin-root anchor) stands — #1219's fix
   keeps the inline fallback sentences as the sole cross-repo carrier and merely makes them
   accurate.
8. **Anchor by named construct, never line number** (tour-narrative lesson; line numbers rot across
   the serial merge queue). Applies to the spec's own references and to the tour-step fix.
9. **Coupling-comment referential rule**: any new consistency guard or comment must describe, never
   restate, the byte pattern it polices (the self-match lesson).
10. **Same-file collisions exist across the three families** — see §8; decomposition must respect
    them (that carving is /war-machine's job; the spec only names the collisions).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Gate-2 probe subject | Widen from `HEAD` to the **unpushed range** — `@{upstream}..HEAD`; when the publication worktree has no upstream configured, the documented fallback is the working branch's remote counterpart (`origin/<working>..HEAD`, i.e. the fork point against the push target). Rejected: keep HEAD-only and lean on re-entry prose (the crash-window residual is the incident class). |
| D2 | Condemnation rule | **Any** commit in the probed range whose file set escapes the promotion destination (or `CLAUDE.md` pointer duty) is condemned — not just `HEAD`. |
| D3 | Undo routing | Condemned commit **is** `HEAD` and is the only condemned commit → the existing sanctioned `git reset --hard HEAD~1` carve-out. Condemned commit is **not** `HEAD`, or multiple commits are condemned → `git revert` each condemned commit (never rewind); conflicted revert → `revert --abort` + escalate, worktree left for inspection. Bounded-retry escalation carried over verbatim. |
| D4 | D22 pin rewrite | Rewrite `D22_ORDERED_SPAN`, the negative reference, and the assertion prose together to lock the new range-probe wording. The **retired HEAD-only probe shape becomes the new negative reference** (`D22_REGION_WITHOUT_UNDO` is superseded by / joined with a HEAD-only-probe region), so a regression to the pre-fix wording reads red through the same key. Rejected: loosening the key to match both wordings. |
| D5 | `landResult` symmetry | Assign `landResult = reLand` inside the `reLand.status === 'submodule-pr'` branch of **both** re-land arms, restoring symmetry with the initial land. No other behavioral change. |
| D6 | Arm-symmetry pin | Optional additive pin in `workflow-template.test.mjs` (source-scan, registry-test-family style): both re-land arms' `submodule-pr` branches contain the assignment, keyed so a mirrored third arm without it goes red (e.g. count `submodule-pr` branches vs count of assignments). |
| D7 | Card carrier naming (#1219) | The `## Submodule-as-repo provisioning` closing sentence names the **provision-barrier dispatch** and its `git submodule update --init --recursive` step as the carrier; the `### Submodule phase (2A WAR-owned / 2B PR-and-hold)` closing sentence narrows "merge/land prompt" to "**land** prompt". Rejected: any reference-path carrier (adjudication O forbids it cross-repo). |
| D8 | `--declared` order (#1161) | One-line reorder to `assert-no-submodule-mutation.sh <integrationBranch> <taskBranch> --declared` — positionals first, flag trailing, matching the script's usage line and all five dispatched sites. |
| D9 | Card↔script usage guard | Optional additive drift guard in `skill-doc-contracts.test.mjs`: the card's shown `--declared` invocation is consistent with the script's own `usage:` line (extraction + agreement, referential message). If dropped, the dependsOn edge for this family is vacuous but harmless. |
| D10 | `Trigger:` line (#1221) | One additive line opening `## Submodule land arms (2A / 2B)` in `refiner-recovery.md`, mirroring the card-side pointer's condition (a land-phase — or 2A merge — dispatch whose phase `target repo` is a submodule). No other bytes in the section move (does not disturb the prior plan's byte-identity of moved blocks). |
| D11 | ADR 0037 correction (#1240) | Append a dated correction note under the same Consequences bullet (the amendment-note channel): the ternary's args-fallback tail in `workflow-template.js` is the **canonical source**; the stager's third exported anchor is the **mirror site** — direction re-derived from the `COUPLING (ADR 0037, #1134)` comment at the ternary. All pre-existing bytes intact. |
| D12 | Mirror-direction guard | Optional doc-consistency check that ADR 0037's mirror-direction prose agrees with the coupling comment it describes — worded descriptively (never restating the grep pattern or the tail's bytes, per the self-match lesson). If its cost/fragility is judged high at plan time, drop it and record the omission in the plan's backstops. |
| D13 | Tour step 16 (#1225) | Rewrite the step narration to the live three-discipline prompt (D4 retired), and re-point the step's anchor at the servitor Wrap-up dispatch — located by named construct (the `Memory admission checklist` prompt text in `workflow-template.js`), with the line number derived from that construct at edit time. |
| D14 | ADR 0008 attribution (#1211-2) | In-place single-clause edit of the Consequences bullet's factual attribution — the discipline lives in `skills/war/references/resume-and-recovery.md`, with `SKILL.md` keeping the trigger pointer. This corrects a rotted factual pointer, not a ratified decision sentence; no amendment-note channel is mandated for ADR 0008. |
| D15 | D22 rationale comment (#1211-1) | Correct the "carry both tokens" claim to the true distribution (`setup.md`: `remove-publication-worktree` only; `resume-and-recovery.md`: `ensure-origin` only). Because #1192's D22 rewrite edits the **same comment block**, the correction rides the D22 rewrite rather than a separate pass (see §8). |
| D16 | Sweep validation shape | Per-medium NEW-present / OLD-absent doc-consistency greps recorded in the diff (old-absent-gate lesson), each grep followed by the mandatory manual same-scope survey (§10). |

## 4. Mechanics

### 4.1 Gate-2 unpushed-range probe (#1192) — Lead prose + pins

Surface: the `**Post-servitor publication (Gate 2` flow in `skills/war/SKILL.md`, the
**Pre-push staged-file check (never skip)** clause.

- The probe enumerates every commit in the unpushed range (D1) and lists each commit's file set
  (the current `git show --name-only --format=` idiom generalizes to the range — e.g. one
  `git log --name-only --format=<sep>` over the range, or per-commit `git show`; the plan picks ONE
  copy-pasteable command and the D22 key locks its wording). Condemnation is per D2.
- The undo routing replaces the "by construction, the condemned commit *is* `HEAD`" precondition
  prose: that claim was true only because the probe looked at nothing else. New prose routes per
  D3 and keeps the carve-out sentence's scope wording intact (constraint 4).
- The bounded-retry escalation ("condemned again after re-provision → escalate, the staleness is
  not worktree-local") carries over unchanged.
- `skill-doc-contracts.test.mjs` D22: rewrite `D22_ORDERED_SPAN` to the new ordered arms
  (commit step → range probe → do-not-push clause → undo/revert routing → `ensure-origin` push),
  keep the one-ordered-key + unwired-negative-reference idiom, and make the pre-fix HEAD-only
  shape a rejected reference (D4). The extraction construct (marker → next `##` heading) is
  unchanged. While editing this block, apply D15 to its rationale paragraph.

### 4.2 Re-land arm symmetry (#1245) — engine

Surface: `skills/war/assets/workflow-template.js`, the two re-land arms (dispatch labels
`land:phase-<id>:environment-proceed`, `land:phase-<id>:baseline-proceed`).

- In each arm's `reLand.status === 'submodule-pr'` branch, add `landResult = reLand` beside the
  existing `escalated.push(...)` + `landDecision = 'held:submodule-pr'` pair — the exact shape the
  initial land already has by construction (it assigns the dispatched result to `landResult`
  directly).
- Optional pin per D6 in `workflow-template.test.mjs`.
- Note: `workflow-template.js` is Workflow-sandbox code (no imports); this change touches no
  mirrored enum, so no drift-guard registry row is implicated.

### 4.3 Refiner standing surfaces (#1219, #1161, #1221)

Surface: `agents/war-refiner.md` (one task owns the whole file — two issues edit it),
`skills/war/references/refiner-recovery.md`.

- #1219 per D7: two sentence rewrites, anchored by their section headings
  (`## Submodule-as-repo provisioning`; `### Submodule phase (2A WAR-owned / 2B PR-and-hold)`).
  The diff records the greps proving the dispatched carriers (`submodNote` in the provision-barrier
  prompt; `submodLandNote` on the three land prompts) say what the card now attributes to them
  (constraint 6).
- #1161 per D8: reorder the step-6 gitlink-bump bullet's invocation. The surrounding prose
  (gitlink-only exits 0; content change still refused) is already correct and stays.
- #1221 per D10: one additive `Trigger:` line.
- Optional guard per D9.

### 4.4 Doc-truth sweep (#1240, #1225, #1211)

- #1240 per D11: dated correction note (2026-08-02, #1240) appended under the mirror-registry
  Consequences bullet of ADR 0037, direction stated canonical-source → mirror-site explicitly,
  citing the coupling comment as the derivation source. Optional guard per D12.
- #1225 per D13: tour step 16's description drops the four-point/D4 narration for the live
  three-discipline wording, keeps the accurate Mechanism/Implication material (no-Bash allowlist,
  exactly-once capture, `servitorResult` guard), and re-anchors at the servitor Wrap-up dispatch.
  Same-scope hand-scan duty (§10) explicitly covers the rest of the step's claims — e.g. the
  step's "gates to `learningsTarget`" write-path claim predates the two-root split
  (`memoryLocalRoot` is the servitor's only writable path); list any such straggler as a
  survey-derived correction in the same diff.
- #1211: item 1 rides the D22 rewrite (D15); item 2 per D14; item 3 widens the
  `- **Outcome handling (§4.3):**` bullet's trigger clause in `skills/war/SKILL.md` to
  "a merge/land `gate_failed` arrives (with or without a `gate_failure_class`)".

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/war/SKILL.md` | Gate-2 Pre-push staged-file check: range probe + condemnation + undo/revert routing (§4.1); Outcome-handling bullet trigger clause widened (§4.4). Two distinct constructs in one file — see §8 collisions. |
| `skills/war/assets/skill-doc-contracts.test.mjs` | D22 ordered key + negative reference + assertion prose rewritten (§4.1); D22 rationale-comment token-distribution fix (D15); optional card↔script usage guard (D9). |
| `skills/war/assets/workflow-template.js` | `landResult = reLand` in the `submodule-pr` branch of both re-land arms (§4.2). |
| `skills/war/assets/workflow-template.test.mjs` | Optional arm-symmetry pin (D6). |
| `agents/war-refiner.md` | Two carrier-naming sentence fixes (#1219); `--declared` invocation reorder (#1161). |
| `skills/war/references/refiner-recovery.md` | Additive `Trigger:` line on `## Submodule land arms (2A / 2B)` (#1221). |
| `docs/adr/0037-run-scoped-staged-phase-scripts.md` | Appended dated correction note under the mirror-registry Consequences bullet (#1240). |
| `docs/adr/0008-git-is-the-resume-source-of-truth.md` | Consequences-bullet attribution clause corrected in place (#1211-2). |
| `.tours/architect-war-system.tour` | Step 16 narration + anchor rewrite (#1225). |

## 6. New domain terms (CONTEXT.md)

None. "Unpushed range" is standard git vocabulary; no new WAR construct is introduced.

## 7. Recommended ADRs

None new. ADR 0037 is amended through its own established correction channel (D11); ADR 0008
receives a factual-pointer correction, not a decision change. The Gate-2 probe widening changes a
remedy's mechanics, not the decision (the #1136 remedy's decision — condemn and undo before push —
is unchanged; its subject is widened), so no ADR is warranted.

## 8. Open risks / implementation notes

- **Same-file collisions (for /war-machine's decomposition, not restated as dispatch here):**
  - `skills/war/SKILL.md` is edited by #1192 (Gate-2 flow) and #1211-3 (Outcome-handling bullet) —
    same file ⇒ same task, or ordered phases; the survey rationale's internal build order
    (engine → cards → doc sweep) exists to avoid this serial-merge rebase fight.
  - `skills/war/assets/skill-doc-contracts.test.mjs` is edited by #1192 (D22 pins), #1211-1 (a
    comment **inside the same D22 block** — hence D15 folds it into the D22 rewrite), and
    optionally D9. One owner.
  - Both pin files are also owned by the `structural-test-nonvacuity` group — this spec lands
    after it (constraint 2).
- **No-upstream fallback determinism (#1192):** the transient publication worktree may not have an
  upstream configured; the flow must give the Lead ONE deterministic fallback command (D1), not a
  choice. The plan should pin the exact command text since D22 locks its wording.
- **D22 key complexity:** the rewrite adds a routing arm (revert path) to an already-long ordered
  regex. Keep the one-key discipline but let the revert-routing arm match tolerantly (the D18/D21
  markup-tolerance idiom) so a bold/backtick reshuffle does not false-red.
- **#1245 fail-first proof practicality:** the clean red proof is running the new arm-symmetry pin
  (D6) against the pre-fix source. If D6 is dropped, the fix is still provable by inspection diff
  but loses its regression lock — record that in the plan's backstops rather than waiving silently
  (ADR 0017).
- **Tour anchor rot:** `.tours` steps require a file/line pair; the line is derived from the named
  construct at edit time and will rot again. Accepted — the tour-narrative lesson's standing
  posture; the named construct in the description is the durable anchor.
- **Version/release:** no release phase is specified here. If the campaign cuts one, the version is
  the next free patch resolved from the four slots at land time — never a literal from this spec.

## 9. Non-goals / deferred

- No change to floor scripts, exit-code contracts, enums (`HARD_ESCALATION_REASONS`,
  `KNOWN_LAND_DECISIONS`), or the push-first CAS.
- Not re-opening adjudication row O (#1215) or the ADJUDICATED-verdict doctrine (#1207) — both are
  other groups' scope and/or settled.
- Not renaming or restructuring `refiner-recovery.md` sections, and not touching the byte-identity
  of any previously moved block.
- Not adding a consumer for `landResult.pr_number` — #1245 restores symmetry only.
- Not fixing other tour steps; #1225 is step 16 only (plus its same-scope survey stragglers).
- No behavior change anywhere in family (c).

## 10. Validation criteria

1. **Fail-first, crash-window shape (#1192):** the rewritten D22 ordered key REJECTS the pre-fix
   HEAD-only Gate-2 region (the retired shape is the negative reference, asserted red through the
   live key), and MATCHES the new range-probe flow. Run the D22 test against the pre-fix
   `SKILL.md` → red; against the fixed file → green.
2. **Fail-first, stale-`landResult` shape (#1245):** the arm-symmetry pin (D6) run against the
   pre-fix `workflow-template.js` → red; post-fix → green; and the pin's key counts arms such that
   a third `submodule-pr` branch without the assignment reds it. (If D6 is dropped: plan backstop
   entry required.)
3. **Card↔carrier truth (#1219, #1161):** in the same diff, recorded greps show
   (a) `agents/war-refiner.md` no longer attributes provisioning-time submodule threading to a
   merge/land prompt (OLD-absent: the exact retired sentence), and names the provision dispatch
   (NEW-present); (b) the 2A/2B routing sentence says "land prompt" (NEW-present) with the
   "merge/land prompt" form absent from that section; (c) the card's shown invocation is
   `assert-no-submodule-mutation.sh <integrationBranch> <taskBranch> --declared` and the flag-first
   form is absent file-wide; (d) `submodNote` / `submodLandNote` in `workflow-template.js` still
   carry what the card now attributes to them. **Grep is a floor:** after each grep, hand-scan the
   same scope (the full refiner card; the three land prompts and the barrier prompt in
   `workflow-template.js`) for sibling claims about dispatched carriers, and list every straggler
   as a survey-derived correction.
4. **Trigger convention (#1221):** `refiner-recovery.md` carries exactly three top-level sections
   and exactly three `Trigger:` lines, one opening each; the diff for that file is additive-only.
5. **Doc-truth NEW-present / OLD-absent, per medium (#1240, #1225, #1211):**
   - ADR 0037: the correction note is present under the mirror-registry Consequences bullet, dated
     and citing #1240; every pre-existing byte of the ADR is unchanged (diff is append-only at that
     bullet). The note's stated direction agrees with the `COUPLING (ADR 0037, #1134)` comment.
   - Tour step 16: "three disciplines" narration present; "four-point" and "D4" narration absent
     from the step; the anchor's file/line resolves to the servitor Wrap-up dispatch region.
   - ADR 0008: the phrase locating the pre-flight discipline in "`SKILL.md` prose" is absent; the
     bullet names `references/resume-and-recovery.md` (with the SKILL.md trigger pointer noted).
   - `skills/war/SKILL.md` Outcome-handling bullet: the widened clause present; the narrower
     "carries a `gate_failure_class`" trigger form absent from that bullet.
   - D22 rationale comment: the "carry both tokens" claim absent; the corrected per-file token
     distribution present.
   Each grep is a floor: hand-scan the enclosing scope (the whole ADR / the whole tour step / the
   D22 comment block / the bullet's list) for sibling stale claims and record stragglers as
   survey-derived corrections in the same diff.
6. **Suites green at land:** `node --test 'skills/**/*.test.mjs'` and the shell suites under
   `hooks/` and `skills/` pass; no gate, floor, or redaction-lint change is expected from this spec.
