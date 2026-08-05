# Red Team — 2026-08-04-interview-and-authoring-contract (2026-08-05)
**Verdict:** ADJUDICATED — gate-emitted (`red-team-gate.mjs`, ADR 0043): every blocker and
`needsDecision` across four rounds is patched and carries an adjudication row; the re-run
executed probes prove their patches; the stamped-not-reverified findings stay listed below
per stamp-never-remove. No residual open questions. **Rounds: 4** (1 initial + 3
continuation re-verify).

Runs: `wf_15a87d52-a96` (round 1, 11 probes, prior session) · `wf_3b039877-c0d` (round 2,
full 11-probe re-verify of the patched plan, this session) · `wf_5ed065be-d00` /
`wf_a0868ccc-8d7` (rounds 3–4, targeted executed-probe re-runs). artifactKind: `impl-plan`.
repo = the session worktree (not foreign). Probes/confirms on `opus`/`high` per
`agents.redteam`. provision `[]`. Continuation note: rounds 2–4 ran against the repo's landed
**0.15.1** red-team assets (gate `ADJUDICATED` verdict, snapshot/baseline escape guard,
three drift-guard spine probes) — the 0.15.0 plugin-cache skill copy predates them; this
repo is the plugin, so the in-repo assets are authoritative.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders,
dependency-feasibility, intent-vs-plan. Bespoke: retired-wording-anchors,
spec-decision-anchors, checks-run-at-base, extraction-compat, default-flip-old-absent.
Executed in sandbox (`git clone --no-hardlinks` — linked-worktree-safe): executable-proof,
checks-run-at-base, extraction-compat, default-flip-old-absent.
Lead-run: backstop-legitimacy (**pass**, re-run round 2 on the patched entries),
unguarded-new-mirror (**vacuous pass** — /war engine untouched; Task 5's lenses↔scaffold
dual-home edit pins in-diff), ff-topology (**not triggered** — no merge-topology anchor),
**guard-split-deps-edge** (**pass**, run at round 2 — absent from round 1, which predates
its 0.15.1 landing: Task 8 carries `deps: [6, 7]`; the survey-corps pin was re-homed to
Task 3 with `deps: [1, 4]` at round 2).
Coverage: 11/11 on-target every gated round; 0 off-target, 0 dropped. Escape guard:
snapshot/baseline ref-diff clean (exit 0) after each executed round; round 1's exit-1 was
provenance-cleared as the Lead's own operator-requested config edit (self-confound gate).

## Executed proof (highlights, rounds 2–4)
- `checks-run-at-base` → **pass**: both structure suites, `plan-literal-lint.test.mjs`,
  `version-slots.test.mjs`, `workflow-scaffold.test.mjs` green at base; lint exit 0 without
  `--strict`.
- `executable-proof` round 3 → **pass**: 100/116 slug pairing reproduces at `94ee5b3`; D7
  guard located in `red-team-gate.test.mjs` and both Task-5 suites green; End-state 5/6/9
  anchors correctly red-pre-land; `lacks()` case-sensitivity + `has_i()` precedent confirmed.
- `extraction-compat` rounds 3–4: both fixtures (operator-form = the plan itself; synthesized
  AFK-form) pass every /war extraction move — one intent heading per ADR 0014 arm, 10 task
  blocks with full per-field bullet census (incl. tolerated `Done when:`), backstops parse
  both headings, 10 End states enumerate, Part-1 H2s never leak into phase discovery.
  Round-3 Major: the round-2 patch's "`extractFiles` ingests both forms" was **refuted by
  importing the real function** — bullet-form-only; compact form over-widens or (bare paths,
  no backtick) yields `[]` → `unparseable footprint`; round 4 added the third outcome: a
  path-shaped backtick in the bled-in block **silently replaces** the footprint (no throw).
- `default-flip-old-absent` rounds 2–4: reproduced, each round, that the enumerated
  old-absent anchor table missed live retired-doctrine lines (`never authors` family;
  `spec ≠ plan` / `authored by interview` / usage-conversion framings; then the CONTEXT.md
  `_Avoid_` line, the README routing clause whose only anchors Task 6's own rename removes,
  and the `Nothing else is required` closer) — and that the simulated stale surface passes
  every committed pin while the hand-run family does detect it. The class is structural:
  see Adjudications.

## Findings

### Round 1 (22 blockers · 6 needsDecision · 22 minors → 12 roots; all patched + operator-adjudicated)
Recorded in this report's prior revision and the round-1 commit (`e223a23`): out-of-section
war-strategy doctrine carriers; Task-5 scaffold-vs-prose scope (Q1 widen); End state 6
green-at-base; case-sensitive retirement guards; End state 5 pattern-table absence; CLAUDE.md
slash mismatch; hand-grep-only enforcement (Q4 → committed pins, new Task 8); survey-corps
no-check (Q5); Part-2 tail shape (Q2); per-task field layout (Q3); Part 1 not self-contained;
example-doc heading arms (Q6); plus eight minors.

### Round 2 (13 blockers · 6 needsDecision · 16 minors → 11 roots; all patched, stamped `adjudicated`)
99/116 pairing figure irreproducible (→ 100/116 at `94ee5b3`, D12 dated snapshot) · D7
two-contract guard mislocated in Task 5 (→ `red-team-gate.test.mjs`, second Done-when suite)
· `lacks()` case-sensitive, no insensitive absence arm (→ explicit `lacks_i()` mandate) ·
`never authors` family unanchored (→ anchor added) · End-state-5 new-present direction
uncommitted (→ Task 8 pins both ways on its four suite-owned surfaces; war-strategy rides
its own suite) · structure-test lock-step violated for Tasks 4/6/7 (→ survey-corps pin
re-homed to Task 3 `deps: [1, 4]`; constraint restated per ADR 0025) · spec-§8 `judge:`-tag
mitigation unowned (→ Task 5 extends `backstop-legitimacy.md`) · §4b gap-review rows
unmapped (→ Task 1 slice) · ES2 mutation-red not individually checkable (→ SOFT-evidence
split) · Purpose sufficiency gap: Task 4 unclaimed (→ End state 10, AI-declared) ·
plan-as-fixture shape mismatch (→ all 10 task blocks reformatted to separate bullets) ·
minors: ES4 non-verbatim quote, ES9 undecidable `Status`, `requiresPackaging` inconsistency,
base-enumeration staleness, D5 restatement, README anchor-link rot, heading-anchor
qualifier, spec-§4a `war-memory` literal, delete-the-feature probe unmapped.

### Round 3 (2 roots; patched; extraction claim re-proven at round 4)
The round-2 patch itself minted a false fact — "`extractFiles` ingests both forms" (an
analyzed-probe Minor laundered into the plan; refuted by execution) · four retired-gospel
framings uncovered (`spec ≠ plan`, `authored by interview`, `converts spec → plan`,
`convert a spec into a plan`); `cannot execute one` recorded as a deliberate NON-anchor
(stays true of input-shape specs — over-retirement guard) · `lacks_i()` body ambiguity:
"comment-leader-stripped" named a nonexistent behavior; resolved to mirror `lacks()` via
`strip_prose` (preserving the `## Status` drop that protects Task 10's own release blurb —
the release-blurb-trips-its-own-guard class).

### Round 4 (2 Major · 2 Minor; patched, stamped `adjudicated` — per-blocker budget exhausted)
CONTEXT.md `_Avoid_: authoring one without a ratified spec` unanchored · README routing
clause unpinned once Task 6's own rename removes its only anchors · `Nothing else is
required` residual framing · extraction bare-paths clause missing the silent-replacement
outcome. All four patched (16-anchor table; clause qualified); the enumeration-completeness
class is closed by adjudication, not a fifth round — see Adjudications.

## Resolutions applied (grill decisions)
Round 1 (operator, 2026-08-05): Q1 widen Task 5 · Q2 two separate tail H2s · Q3 separate
`- ` bullets · Q4 committed pins (new Task 8) · Q5 survey-corps pin · Q6 two example docs.
Rounds 2–4 (Lead continuation, per-row provenance below): eleven round-2 roots, two round-3
roots, four round-4 findings — patch commits `ec38ab0`, `ab0201c`, `4a75914`, plus the
operator version ruling in `9185a2c`.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->
- **Release version = `0.16.0`** (minor — the merged-artifact doctrine change) supersedes the
  plan's original "next free patch above the live base (≈0.15.2)" and A3; all four slots
  lock-step; `plan-literal-lint`'s `hardcoded-version: 0.16.0` advisory hit is answered by
  this row — operator-ratified (2026-08-05).
- Part-2 tail = TWO separate H2s (`## Notes / conscious deviations`, `## Open decisions`)
  supersedes spec §4b's collapsed single H2 — Task 1 §2 (Q2) — operator-ratified (2026-08-05).
- Per-task fields = SEPARATE `- ` bullets — operator-ratified (2026-08-05, Q3); rationale
  corrected at rounds 3–4 by executed proof: an **extraction requirement** (`extractFiles`
  ingests only the bullet form; compact-form outcomes: over-widened footprint, `[]` →
  `unparseable footprint`, or silent footprint replacement), superseding round 2's refuted
  "ingests both forms" analyzed claim — AI-declared.
- Task 5 Files = SKILL.md + lenses.md + backstop-legitimacy.md + workflow-scaffold.js +
  workflow-scaffold.test.mjs; Done-when runs workflow-scaffold.test.mjs AND
  red-team-gate.test.mjs (D7's actual home); "engine untouched" binds the /war engine only —
  operator-ratified (2026-08-05, Q1) + AI-declared widening (backstop-legitimacy.md gains the
  `judge:`-tag grading rule, the spec-§8 mitigation's owner).
- Task numbering: gospel-pins task = Task 8 (`deps: [6, 7]`); ADR = Task 9; release =
  Task 10 — operator-ratified (2026-08-05, Q4/Q5); survey-corps new-present pin re-homed to
  Task 3 (`deps: [1, 4]`, ADR 0025 guard-split shape) — AI-declared.
- Pairing figure = **100/116 `*-design.md` specs paired at `94ee5b3`** (dated snapshot, D12)
  supersedes the plan's and spec §1's `99/116` (measured 2026-08-04 pre-landing; spec edits
  out of scope — this row is the superseding record) — AI-declared.
- Integration base `94ee5b3` supersedes plan-body `382dba1`; the branch's `e223a23`/`7b9224d`
  are recorded as touching no plan-named surface — AI-declared.
- End state 10 (survey-corps directive claimed + pinned) added — derives from operator
  decisions D16 + D11; closes the intent-sufficiency gap — AI-declared.
- End state 9's decidable form: ADR title line contains `authoring contract`;
  `**Status:** accepted` (house format; no "current" value exists) — AI-declared.
- D5 restated: `Done when:` required iff `requiresTest: true`, permitted elsewhere (Task 10
  carries one voluntarily) — AI-declared.
- Old-absent anchor table = the committed FLOOR (16 anchors), not an exhaustiveness proof —
  the rewrite duty binds by construct; residual rides End state 5's land-time
  comment-leader-stripped hand sweep + post-land coherence; `cannot execute one` is a
  deliberate NON-anchor (true of input-shape specs — over-retirement guard). Class closed by
  adjudication after two re-verify rounds (per-blocker budget) — AI-declared.
- `lacks_i()` body = `strip_prose < "$1" | grep -qiF -e "$2"` (inherits the
  `## Status`/`## Changelog` drop; comment-leader stripping belongs to the hand sweep only)
  — AI-declared.

## Residual risk
- **What ADJUDICATED means here** (stamped, patched, not probe-re-proven): all analyzed-probe
  findings of rounds 2–4 (per Step 5, analyzed findings close by adjudication) and the
  round-4 executed findings (per-blocker re-verify budget exhausted after two rounds). The
  three re-run executed probes are probe-proven (`executable-proof` pass; `extraction-compat`
  warn/minor-only; `default-flip-old-absent`'s round-3 patch set verified).
- The anchor-table exhaustiveness class: four rounds, four tails — treat any further instance
  found at land as expected floor-vs-ceiling residual, not a new defect class; the binding
  duty is the by-construct section rewrite.
- `extractFiles`' silent-footprint-replacement arm (compact task rendering + any backticked
  path in bled-in prose → wrong non-empty footprint, no throw) is a **latent war-campaign
  hazard beyond this plan's scope** — the merged template's separate-bullet law avoids it;
  flagged for a follow-up issue.
- ES2's mutation-red proof remains deliberately-uncommitted done-report evidence — SOFT by
  repo precedent, never a hold. The spec file intentionally retains §4b's compact renderings
  and the 99/116 literal; the plan + this report are the superseding record.
- Deferred validations stand as declared (adoption + interview-length telemetry via
  `/war-review` at the next campaign wrap-up); backstop-legitimacy passed both rounds.
- Loop-breaker note for the record: rounds 2 and 3 each contained a patch-minted defect
  (the `extractFiles` "both forms" claim; the round-2 anchor additions' own gaps) — live
  evidence for the cross-round budget + finding-class taxonomy this campaign's follow-on
  loop-breaker spec proposes.
