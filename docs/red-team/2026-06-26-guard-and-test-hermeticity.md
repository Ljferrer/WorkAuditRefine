# Red-Team Report — Guard Fidelity & Test Hermeticity (#95 · #102)

**Plan:** `docs/plans/2026-06-26-guard-and-test-hermeticity.md` · **Date:** 2026-06-26
**Verdict:** **CLEARED-WITH-NOTES** (raw gate BLOCKED → all blockers adjudicated/patched)

## Attack surface
6 probes, all on-target. Every cited anchor re-verified exactly (rel_guard :119-137, case 11 :138-139, `$WT/plain` :47,
servitor frontmatter :148-216, `..` cases :226-253, ABSENCE CHECK 2 :156-181, war-refiner.md gate :24 / switch :38).

## Findings & resolutions
- **[Critical/Major ×8 — ADJUDICATED, not defects] coverage-vs-source "plan diverges from spec".** The probe flagged
  every place the plan does MORE than the spec — includes #95 fix (b) as Task 3, 4 tasks vs 3, v0.6.8 vs v0.6.6, an
  "Operator decisions" section. **All intentional, operator-ratified:** the operator explicitly chose to include
  #95(b) (gated after #95a's audit), and the roadmap assigns plan 3 → v0.6.8. The spec is the pre-decision baseline;
  the plan is authoritative (memory `redteam-adjudication-is-authoritative-version-source`). No change.
- **[Major — NON-DEFECT] executable-proof: the #95 case-11 flake does not reproduce on this macOS/BSD host.** For the
  relative payload, `dirname` converges to `.` and the progress guard stops the walk (exit 2, GREEN) in every
  reproduction tried, incl. a simulated GNU-mktemp worst case. The flake WAS real in clandiso-0625, so Task 1's
  hermetic fix remains valid robustness; the meta-suite stays green with all plan edits applied. No defect.
- **[Minor — PATCHED] #95(b) PRESENCE assertion would false-RED.** The reword writes `` `.war-task`-free `` (backtick
  splits the substring) and the mechanism token `TMPDIR=$(cd /` contains `$(` (a BRE anchor). Patched Task 3 Step 1 to
  assert with `grep -qF 'TMPDIR='` (robust literal), not the contiguous substring or a BRE grep.
- **[Minor — NOTED] BSD `mktemp -d` ignores `TMPDIR`.** #95(b)'s pin is a no-op on macOS; load-bearing only on
  GNU-coreutils CI. Kept as Linux-CI defense-in-depth (Task 1 is the real fix). Recorded in the plan's Notes.
- **[Minor] version.** v0.6.8 is correct (plan 3 on plan 2's v0.6.7); sandbox bump 0.6.6→0.6.8 stayed green. The
  spec's v0.6.6 literal is the superseded standalone proposal.

**Terminal verdict: CLEARED-WITH-NOTES.** Ready for `/war`.
