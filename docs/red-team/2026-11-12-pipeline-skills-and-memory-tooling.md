# Red-team: 2026-11-08-pipeline-skills-and-memory-tooling

- **Plan:** `docs/plans/2026-11-08-pipeline-skills-and-memory-tooling.md`
- **Verdict:** ADJUDICATED (round 1: every blocker patched in place, AI-declared)
**Rounds:** 1
- **Artifact kind:** impl-plan
- **Base:** `63c3253b` (origin/master after plans 1 to 7 of the campaign merged, release 0.21.46). Sandbox clone at that sha.
- **Probes:** 12 (6 spine, 6 bespoke), 4 executed, 8 analyzed, all on target, none dropped. Escape guard exit 0 for the clone and the main checkout.
- **Gate:** first pass BLOCKED (7 Major blocker rows and 4 needsDecision rows, several the same defect seen by more than one probe, plus 21 minors). After the patches, 14 findings were stamped adjudicated. The gate returned ADJUDICATED at rounds 1 with no route upstream.

## Measured at base

| Surface | Size | Line | Room |
|---|---|---|---|
| `GLOSSARY.md` | 111,335 B | 111,616 B advisory, 131,072 B hard | 281 B to advisory |
| Version slots | 0.21.46 | | next free patch 0.21.47 |

## Patched in place (Lead, AI-declared)

- **Negative prose guards were line-bound (Major).** End states 10, 14, 29 and 33 matched one line and, except End state 10, one case. A re-cased or re-wrapped stale phrase passed them. Each now matches case-insensitively over whitespace-joined text with `perl -0777`, and End state 10 reads only `*.md` surfaces. The tasks' absent-pins follow the same rule. Each new check was run at base in a throwaway clone: each finds its stale phrase.
- **PIN-14 and PIN-27 contradicted each other (Major).** PIN-14 adds a clause to the §4 "half-stamped relaunch" row, and PIN-27 kept that row byte-identical. The row now changes only by the PIN-14 clause and keeps its bold name.
- **Evidence rows were missing (Major).** The run-manifest artifacts of #2708, #2709 and #2710, the config artifact of #2715 and the campaigns directory of #2678 now have rows: read by the red-team Lead, or deferred to the T1.5 worker with a reason.
- **End state 31 had no producer for `PHASE_BASE` (Major).** No manifest field names a phase base, and the endstate-check dispatch runs the literal as written. The doc-truth plan merged to master before this plan's branch was cut, so this plan no longer stacks. The check now compares with `origin/master` and keeps the strictly-greater test. At base it is red (0.21.46 equals 0.21.46), and with the slots at 0.21.47 it prints `PASS-E31`.
- **ADR 0044 has no three-leak-shape or three-header-line count (Major).** T1.3 and PIN-25 now add text at three named Decision items: item 3 names **Partial-source read**, item 4's Trials-header list gains the `budget-check:` line, and item 6's "`/war-room` names the three keys" is de-mirrored. End state 14's absent half now matches `three keys` anywhere in the body.
- **Red-team Step 5 kept the old rule (Major).** Step 5's "only unit" clause and its `<n>` definition contradicted the new Step 6 text. T1.1 now rewrites both.
- **The ADR 0045 Decision-log form missed ADR 0063 (Major).** ADR 0063 Decision 4 says a line that narrows a decision carries `failed because:`. The routed-run exception narrows the "only unit" rule, so the T1.1 line form and End state 5 now carry that field. The ADR 0044 line is an extension, and End state 14 accepts the field as optional.
- **The glossary basis was stale (needsDecision, self-decided).** `GLOSSARY.md` is 111,335 B at base, 281 B under its advisory line. Three term rows would cross it, so PIN-26 keeps the rows out, with the figures restated.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| End state 31 compares with `origin/master` | `PHASE_BASE` from the run manifest | AI-declared |
| The "half-stamped relaunch" row takes the PIN-14 clause | both rows byte-identical | AI-declared |
| The ADR 0045 Decision-log line carries `failed because:` | the doc-truth form without it | AI-declared, applying ADR 0063 Decision 4 |
| ADR 0044 gains text at Decision items 3, 4 and 6 | rewrite the three-count statements to four | AI-declared |

## Residual risk (minors not patched)

- Positive prose guards (End states 1, 10, 12 and others) still match one line. A seat reads the diff.
- `run-manifest.md` now documents `workflow_run`, which weakens A20's "no doc names it" basis. T1.5 still confirms the field against a real ledger.
- End state 39 and T1.6's Criterion 9b pin check the same `scratchpad` rule.
- The Notes count "All 13 issues" predates the claims that raised the count to 20.
- T1.4 rewrites the `/war-room` "Each a positive integer" sentence. Other sites with the same claim are left to its same-scope survey.
