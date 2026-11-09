# Red-team: 2026-11-08-engine-recovery-relaunch-and-land

- **Plan:** `docs/plans/2026-11-08-engine-recovery-relaunch-and-land.md`
- **Base:** `7e70e874` (plans 1 and 2 of campaign 2026-11-08-survey-debt landed)
- **Rounds:** 1
- **Verdict:** BLOCKED (route upstream: the staged-template cap needs an operator ruling)
- **Probes:** 13 (6 spine, 7 bespoke), 5 executed, 8 analyzed, none dropped. Escape guard exit 0 against the snapshot.

## Blocker that needs a ruling

**Staged-template cap (Critical).** `stage-workflow.test.mjs` arm (p) needs the stripped template plus `ARGS_HEADROOM_BYTES` (119,808 B) at or under 524,288 B. At `7e70e874` the stripped template is 404,473 B, so the room is **7 B**, not the 459 B the plan states (measured at `279a0d4a`). The plan's own estimate is about 860 B of engine growth, and only six decision rows carry an estimate. The probe's read of every engine slice puts the growth at about 4 to 5 KB. No slice names bytes to cut, and the plan forbids lowering `ARGS_HEADROOM_BYTES`. Plans 4 and 5 add engine bytes under the same rule, and no queued plan names bytes it frees. The first engine task over 7 B reds arm (p).

## Patched in place (Lead, AI-declared under --afk)

- **Statement-runner split (Major):** 33 awk programs held `;` inside single quotes. The END-STATE CHECK runner splits at `;`, so 26 End-state checks could never print their token. Each `END{r=(C); print ...; exit !r}` is now `END{r=(C)} END{print ...} END{exit !r}`. Proven: the E3 program prints `PASS-E3` on a matching TAP line and `RED-E3` otherwise.
- **TAP `#` escape (Major):** Node's TAP reporter prints `(#2657)` as `(\#2657)`. 43 awk `ok`-line anchors now match `\(\\#NNNN\)`. `--test-name-pattern` arguments are unchanged.
- **Case-sensitive prose greps (Major):** the 28 runbook greps in T4.2's Done when and End states 18, 23, 24 and 32 are now `grep -qi`.
- **T2.1b count (Major):** the Done when now counts the End state 25 fixture `snapshot reply git_error (#2589)`, and n is 11.

## Open for the regrill (not yet patched)

- T1.1's card eviction breaks `workflow-template.recovery.test.mjs` (the #2626 card asserts, the Every-attempt line rule, the `recoveryTriggers` set). Add that file to T1.1 Files, or evict other bytes.
- T3.1's worker card has 20 B free at the base, not 97 B. The two named evictions free about 516 B net of pointer cost against at least 577 B needed. Name a third block or shrink the growth.
- T4.2's Done when misses End state 24's `patch-id` and `repoint` tokens, and no check covers D29's Manifest restamp half.
- T5.1's Done when is green at base. Only End state 19's HARD judgment catches a missing bump.
- D37 and D17 (c) predate ADR 0059. Point them at `setup.md` § Run root.
- #2750 (push after a pin-transfer rebase): the smallest fix is one `floorFixHead` sentence in T3.1 that names the merge-slot rebase as a dispatch-rebase for the lease carve-out.
- Minor: stale counts (21 and 18 claimed issues, the plan lists 28), the D10 grep evidence, the D37 adopt-form pointer (it lives in `schemas.md` staleRemote row), the T4.2 D32 anchor (it is § Held-partial-phase recovery runbook step 4), and the operator re-confirmation of appended End states 24 to 32.
