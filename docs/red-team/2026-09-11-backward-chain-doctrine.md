# Red Team — docs/plans/2026-09-11-backward-chain-doctrine.md (2026-09-11)
**Verdict:** ADJUDICATED — every blocker and needsDecision patched in place and Lead-stamped; the delete-the-feature probe re-ran green twice, the other executed re-verify attempts are spent (2 of 2), so the patched findings are adjudicated, not re-proven (ADR 0043)
**Rounds:** 2
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Artifact kind: `impl-plan` (a `docs/plans/` file with per-task `Files:` under the phase headings). Source of truth: the plan itself (merged arm, Part 1 is the decision record). Repo: this worktree at `668e4ff9` (plan commits on top). Round-limit: 3 (`run.redteamRoundLimit`). Model: opus, effort high (`agents.redteam`). Provision: none (`.war-provision.json` absent, structural fallback empty).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: template-headroom, auditor-card-byte-line, census-default-deny, end-state-red-at-base (executed); engine-anchors, enumeration-drift (analyzed). Executed in sandbox: executable-proof, template-headroom, auditor-card-byte-line, census-default-deny, end-state-red-at-base. Lead-run: the four drift-guard probes (unguarded-new-mirror pass, default-flip-old-absent vacuous, guard-split-deps-edge pass, touched-doc-fact-coverage two gaps), backstop-legitimacy (pass), judge-tag grading (one needsDecision). `ff-topology`: not triggered (no merge-topology anchor in the plan).
Fallback: none. All 12 probes on target (read_anchor matched the fingerprint); 0 dropped.
Escape guard: snapshots 1 and 2 clean (exit 0). Snapshot 3 exit 1 on one stray working-tree file, `docs/red-team/2026-09-11-backward-chain-doctrine.md`: action-provenance settled as Lead-authored (this report, the sanctioned Lead write), not a probe escape. No ref delta, no gitignored delta.

## Executed proof
- Stripped template headroom re-measured: 344,134 B stripped, 49,082 B under the args-headroom line (matches A1's second line). A 12,000 B pad keeps `stage-workflow.test.mjs` green; a 60,000 B pad reds the headroom floor.
- Auditor card: 28,411 of 28,672 B hard (261 free); a 262 B append reds `prompt-surface-budgets.test.mjs`, a 200 B append stays green.
- Template prompt-literal share: 137,169 of 137,216 B hard (47 free) — the binding line the plan had missed; a 1,037 B constant reds the suite.
- Placement census: an empty new `skills/war/references/` file reds `doc-cli-consistency.test.mjs` with `UNPLACED`; a listed-but-absent path reds with `STALE ROW`; a placed file with a heading is green in the census, `reference-link-integrity.test.mjs` and `skill-doc-contracts.test.mjs` (both `skills/war/` and `skills/war-strategy/`). Task 1.1's one-task decomposition is forced, not chosen.
- Delete-the-feature over every `check:` and `Done when:` at base (three attempts): round 1 found End states 2–6 and Tasks 1.1, 2.1, 3.1 green at base; after the patches, attempt 2 of `end-state-red-at-base` passed with 0 findings: every deliverable-bearing `check:` and `Done when:` is red at base, the simulated four-slot bump prints `RELEASE_OK`, and the awk TAP idiom prints its token under `bash -o pipefail`. `executable-proof` attempt 2 still found three defects (the floor-family round input, a trigger-blind End state 11 grep, an index read on a missing baseline ref); all three are patched and stamped, and its re-verify attempts are spent.
- Manual check after the D6 patch (Lead-run, at base, commit `6b6c12dd`): End state 1 RED, End state 5 RED, End state 11 / Task 2.2 RED, End state 12 / Task 2.3 RED, Task 1.1 RED, Task 2.1 RED, Task 3.1 RED (missing working-branch ref fails loudly), End state 8 baseline suite GREEN. Every deliverable oracle is red before the work exists.
- CONTEXT.md: 122,853 of 126,976 B hard (4,123 free); existing glossary entries run 572–903 B.

## Findings
### Critical
- [Critical, needsDecision] A1 named only the args-headroom line → `WORKFLOW_LITERAL_BUDGET` (prompt-literal share) has 47 B free and Task 2.1 adds thousands. Resolution: operator re-baseline pass on that one constant before `/war`, sized by the ADR 0042 D5 formula (A1, G13, End state 17, Build order precondition). Adjudicated.
### Major
- Corrective-round helper written as bare `absorbRounds` → that identifier is the run budget const; the spent meter is `r.task.absorbRounds`. Patched in D4, End state 5, Task 2.1.
- Helper base ambiguous (0-based in-loop `round`) → 1-based; first audit and first fix are round 1. Patched; adjudicated.
- Helper input undefined at six of seven fix-applying sites → per-site rule: in-loop index at FIX_NEEDED and the roster audit, `fixRounds + absorbRounds` at the ace sites, round 1 by definition for the sweep, terminal pass, floor family and pin-content re-audit; fixture arm for the relaunch-seeded ace value. Patched; adjudicated (D6).
- End state 11's grep passed on a trigger-less, negating mention → anchored on the pointer shape and the bullet position. Patched; adjudicated.
- Task 3.1's baseline read the index when the working-branch ref was missing → resolved in its own step, fails loudly. Patched; adjudicated.
- Worker file "eight rules" enumerated nine clauses → eight numbered rules, the `DEPS ALREADY MERGED` rebase clause inside rule 1. Patched; adjudicated.
- Audit-side reach unstated for the three gate-audit-family seats → they carry no backward-chain clause; comment + byte-identical fixture arm. Patched; adjudicated.
- End state 1 pinned seed slugs the plan never listed → 28 slugs enumerated in the Skeleton record, external ones abstracted. Patched; adjudicated.
- No End state measured the Purpose's round claim → backstop row 1 gains corrective rounds per task with the 2026-09-06 in-run baseline; the Purpose says it is measured there. Patched; adjudicated.
- Relation tags enumerated only under New domain terms → restated verbatim in the audit, fixer, and examples slices. Patched.
- Task 2.2's `Done when:` was two arms of End state 11's three → equal now. Patched.
- Prose-clause grep guards case-sensitive → `-Fiq`. Patched.
- End states 2–6 checks named an existing green suite → each greps its exact fixture title from TAP output with a SIGPIPE-safe awk idiom. Patched.
- Task 1.1, 2.1, 3.1 `Done when:` green at base → red-at-base clauses added (file existence and headings; six fixture titles plus card pointers; strict version increase over the working-branch merge-base plus the CHANGELOG head heading). Patched.
- The Non-goals follow-up filing had no Part-2 home → backstop row 2 and End state 15. Patched.
- `resolveGate` self-discovers only `*.test.sh` → the plan declares its gate (`node --test 'skills/**/*.test.mjs'`) and End states 9, 10, 13, 17 name it. Patched.
- Touched-doc (Lead-run): the fixer file's seven build names and the round-5 numeral were unguarded → two fixture assertions in Task 2.1. Patched.
- Judge-tag (Lead-run): End state 8 was half commandable → 8 is a `check:` on `war-config.test.mjs`, 16 is the HARD judgment. Patched.
### Minor
- Critical path chain line missed End states 7 (needs T2.1), 8, 9, 10, 14, then 15–17 → all seventeen chained. Task 2.2's pin description named the wrong mechanism → the four `construct:` regions and the structure test. A7's check cell → out of band. End state 12's check omitted `schemas.md` → union. Census unit → seven prompt-build sites, the floor family one site with four labels. D15's idiom → the `FIX_ROUND_RULES` extraction, not the sentinel pin. `CONTEXT.md` byte line → A9. "One line per task" → the task under fix. End state 17's second conjunct had no runner → moved into End state 16 (HARD). The re-baseline "sized to growth" had no procedure → the D5 formula. All patched.

## Resolutions applied (grill decisions)
- Literal-share ceiling → operator re-baseline pass before `/war`, one surface, D5-sized; new End state 17; A1 rewritten; G13 → Pivotal constraints, A1, G13, Build order, End state 17.
- Gate-audit seats → no audit block, comment + fixture arm → D6, Task 2.1.
- Seed slugs → 28 enumerated, external abstracted → Notes (Skeleton record, entry E), Task 1.2.
- Purpose measure → backstop row 1 third count, in-run baseline 2026-09-06 run; #2097 a second series for the post-land loop → Commander's Intent, End state 14, backstop row 1, issue #2302.
- End state 8 → split into 8 (check) and 16 (HARD).
- Queued fixtures (build names, round-5 pointer) → Task 2.1.

## Adjudications
- The template prompt-literal ceiling (`WORKFLOW_LITERAL_BUDGET`) is raised only by the operator re-baseline pass before `/war`, scoped to that one surface — supersedes the plan's earlier silence on that line — Pivotal constraints, A1, G13 — operator-ratified (2026-09-11)
- The raise is sized by the ADR 0042 D5 formula from the freshly measured share, not hand-sized to the plan's growth — supersedes "sized to this plan's measured growth" — A1, G13 — AI-declared (the pass's own gate is where the operator approves the exact numbers)
- Corrective round is 1-based; the first audit and the first fix are round 1 — supersedes the unbased "fix rounds + ace charges" — D4, G9, End states 4 and 5, Task 2.1 — AI-declared, refined per site by the operator-ratified row below
- The worker file carries eight numbered rules; the `DEPS ALREADY MERGED` rebase clause is a sub-clause of rule 1 — supersedes the nine-clause enumeration — Task 1.1 (W) — AI-declared (transcribes the Q8 record)
- The three gate-audit-family seats carry no backward-chain clause — D6, Task 2.1 — operator-ratified (2026-09-11)
- Seed-entry slugs: 28 per the Skeleton record; an external private entry's slug never encodes its source — Notes, Task 1.2 — operator-ratified (2026-09-11)
- Round outcome measured by backstop row 1: corrective rounds per task, in-run baseline the 2026-09-06 run (14 of 26 spent all 6 ace charges; 22 of 26 unanimous at round 0), direction down; #2097 a second series for the post-land loop — Commander's Intent, End state 14, backstop row 1, #2302 — operator-ratified (2026-09-11)
- End state 8 split: 8 `check: node --test skills/war/assets/war-config.test.mjs`, 16 `HARD at audit_sha` — operator-ratified (2026-09-11)
- Task 3.1's baseline is the merge-base with the working branch `dev/2026-09-11-backward-chain-doctrine` (the `dev/<plan-slug>` convention), never `origin/master` — A10, Task 3.1, End state 13 — AI-declared
- The plan declares its gate, `node --test 'skills/**/*.test.mjs'`; `resolveGate` appends only the `*.test.sh` sweep — Build order, End states 9, 10, 13, 17 — AI-declared
- Corrective round per site: FIX_NEEDED and the roster audit read the in-loop index; the three ace sites read `r.task.fixRounds + r.task.absorbRounds`, never `r.round`; the sweep, the terminal pass, the floor family and the pin-content re-audit are round 1 by definition — supersedes the single-formula helper — D4, G9, End state 5, Task 2.1 — operator-ratified (2026-09-11)
- End state 11 and Task 2.2 anchor on the pointer shape (`when <trigger>, read …backward-chain-plan.md`) and the bullet position, never a bare filename — operator-ratified (2026-09-11, the manual-check condition)
- The release baseline resolves in its own step and fails on a missing ref; a bare `:<path>` index read is never a baseline — Task 3.1, End state 13 — AI-declared

## Residual risk
- A10: if the Lead names a different working branch at launch, the branch literal in Task 3.1's `Done when:` and End state 13 must be patched at decompose.
- A second mid-run re-baseline is not sanctioned; if Phase 2 still reds on the literal-share line after the D5 raise, Task 2.1 funds it by eviction.
- Task 2.2 must insert its two edits outside the four `construct:` regions `skill-doc-contracts.test.mjs` pins on `plan-interview.md`.
- The `## Round 5 and later` tier is reachable only within `run.roundLimit` and `run.absorbRounds` (both 6); the plan never widens them (PIN-2).
- External private seeds are abstracted; the redaction check on each new bank entry is manual (D16).
