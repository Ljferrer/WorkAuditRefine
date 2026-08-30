# Red Team — docs/plans/2026-08-30-engine-concurrency-and-pin-transfer.md (2026-08-30)
**Verdict:** ADJUDICATED — every blocker patched and adjudication-rowed; the round-3 findings were patched without probe re-runs, so the gate terminates ADJUDICATED, never a hand-written CLEARED.
**Rounds:** 3

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan — all three rounds. Bespoke round 1: anchor-check, default-flip-old-absent, ff-topology, semaphore-feasibility, reserve-accounting. Round 2: ff-topology-r2, default-flip-old-absent-r2, semaphore-feasibility-r2, patch-coherence-r2. Round 3 (post-master-merge, 63 commits): post-merge-drift-r3, patch-coherence-r3. Executed in sandbox: ff-topology(×2), default-flip-old-absent(×2), semaphore-feasibility(×2), plus the spine executable-proof fixture runs. Lead-run drift-guard probes: unguarded-new-mirror (vacuous pass), guard-split-deps-edge (1 finding, patched), touched-doc-fact-coverage (minor, patched), backstop-legitimacy (pass). artifactKind: impl-plan. Fallback: none — analyzed probes ran on Explore.

## Executed proof
- Semaphore harness (r1+r2): leaf-permit design completes at wave 5×4 seats, N=4, peak ≤ 4; rejected thunk → null slot, counter drains to N; knob-null path hands the same thunks array to `parallel()`. Wrapped-wave variant deadlocks at width ≥ N (0/16 dispatches) — drove PIN-15.
- ff-topology (r1+r2): whole-tree diff predicate non-empty for every task after the first; raw `git diff` byte-compare breaks on index/hunk drift; `git patch-id --stable` equal on content-clean and pure line-shift rebases, differs on any content byte; empty diff → empty patch-id equals empty (drove the fail-closed arm); `rev-list`/`cherry` post-rebase readings invert the #1895 guard (drove the pre-rebase pin); `git cherry` names task commits, never upstream equivalents.
- fixRounds probe: `undefined < 6 === false` kills the hoisted ace; merge-slot seed clobbers wave-side charges — drove PIN-13.
- Budget suite at both bases: workflow-template.js share 77,891 B (hard 79,872), war-auditor 26,296 B (hard 28,672), CONTEXT.md 126,035 B at merged base d3624aa (hard 126,976), war-refiner 34,802 B (hard 34,816).
- Doc-sweep grep (r2): the four enumerated surfaces carry their OLD tokens; war-room line states the per-site semantics twice — drove the OLD-token LIST rule.
- End-state 7/9 fixtures (r3): wrap-aware selector needed (hard-wrapped ADRs false-negate), `-m1` still multi-file (head -1), case-sensitive glossary leg false-negates — all patched into the check literals.

## Findings
### Critical
- [Critical] fixRounds seed at the merge slot breaks under the wave-side hoist (never-dispatching ace / clobbered charges) → patched: wave-side seed, never-lowering merge-slot seed, PIN-13, budget behaviour test.
- [Critical] Empty patch-id equality transfers the pin on a zero-commit branch (#1895 re-opened) → patched: PIN-16 arm precedes the equality test, empty pre-rebase patch-id fails closed.

### Major (all patched, adjudicated)
- Pin-transfer predicate named no normalisation → `git patch-id --stable`, conflict-free rebase as stated precondition (D2, PIN-14).
- Missing empty-diff arm → `already_upstream` arm with pre-rebase `rev-list`/`cherry` legs, matched task commits recorded (PIN-16).
- Wrapped-`batched()` latitude branch deadlocks → leaf-permit rule, completion test (PIN-15).
- Permit leak on rejection undetectable → finally-release plus drain assertion (End state 1).
- PIN-17 in-run ceiling raise contradicted ADR 0048 → operator adjudication row ADJ-1 carries the exception; floor and trailer form untouched.
- Red ace-tip gate vs PIN-2 unreconciled → forward-revert governs (D7); stale task-2.1 sentence rewritten in round 3.
- Doc sweep mis-enumerated (three-vs-four, design.md unowned, lesson description stamp missing, single tokens vacuous under shared phrasings) → four surfaces enumerated with per-path OLD-token lists, `skill-doc-contracts.test.mjs` rides task 1.2, lesson description RESOLVED stamp asserted.
- End state 8 check was prose / unowned script → committed `doc-semantics.test.mjs` owned by task 1.2 (wrap-aware, non-empty input, archive-tolerant).
- End state 9 two-commands-in-one-row / comment-vs-prompt blind → single joined command plus `scanTemplateLiterals` census row, wording authored unwrapped.
- End state 7 grep fragile (case, wrap, multi-file) → wrap-aware selector, `head -1`, case-insensitive legs, `**Pin transfer**` glossary marker.
- Pin transfer domain term unowned → CONTEXT.md glossary entry rides task 2.1.
- Byte headroom unbudgeted → PIN-17 clauses on tasks 1.2 and 2.1, refiner surface included.
- Task 1.2 wording depended on `batched()`'s fate → construct-free doc wording, no deps edge.
- `changed_files[]` near-homograph / agent-asserted delta set → declared `ace_diff_files` carrier, git-derived authority, seat-detected excess arm (PIN-18).
- Refiner return-shape surfaces unowned → `agents/war-refiner.md` + schemas.md merge-task rows ride task 2.1 (PIN-11 same-commit rule).
- PIN-16 had no owning task or End state → task 2.1 slice + End state 5 fixtures.

### Minor
Auto-patched: `pipeline()` citation re-anchored; schemas.md "two lines" corrected; D3 cell rewritten to the git-derived set; Method upstream/task-commit outlier corrected; A1 blast radius corrected; `dispatchBase` naming.

## Resolutions applied (grill decisions)
- Semaphore scope → every agent dispatch, leaf seam (Q1) → D1/PIN-4.
- Pin-transfer predicate → patch-equality, then `git patch-id --stable` with 8 operator pins (Q2, r2) → D2, PIN-1..8, PIN-14.
- Delta-scale granularity → file-level (Q3) → D3.
- Floor-retry loop → unchanged in-lock (Q4) → D4.
- Doc sweep → enumerated four surfaces, lesson exempt with description stamp (Q5, r1, r2) → D5, task 1.2.
- One ADR, seat-approval transfer ratified, PIN-9..11 (Q6) → D6, task 2.2.
- Latitude/floor split confirmed with amendments; PIN-12 gate-green ace tip → Intent block.
- fixRounds seed → never-lowering, pre-ace provenance stamp (r1 grill) → PIN-13.
- ADR 0048 exception → ADJ-1 ruled row, trailer stays `Budget-Raise: ADR-0042 <surface> +<bytes>` (r2 grill).
- Red ace-tip gate → forward-revert via `r.aceReverted`, never a hold (r2 grill) → D7.
- Global wording scope → /war engine, red-team qualifier kept (r2 grill) → D5.
- File-set carrier → declared `ace_diff_files` + re-audit-seat independent diff check (r3 grill) → PIN-18 widened.

## Adjudications
- ADJ-1: operator overrules ADR 0048 §1/§2 for this plan — a writing task that cannot fit after eviction raises that surface's ceiling by ≤ +2,048 B, cited with the floor's accepted trailer form — supersedes ADR 0048's worker-lane prohibition for this plan only — operator-ratified (2026-08-30).
- `git patch-id --stable` equality supersedes the issue-#1913-comment literal `git diff <reauditedTip> <rebasedTip>` empty — D2; the literal form is only ever true for the first task in the queue — operator-ratified (2026-08-30).
- PIN-16 `<taskTip>` = the PRE-rebase task tip for both `rev-list --count` and `git cherry` legs — supersedes the unqualified pin wording — operator-ratified (2026-08-30).
- Provenance field names matched TASK commits — supersedes the round-2 "matched upstream commits" Method wording — operator-ratified (2026-08-30).
- `ace_diff_files` declared WORKER_RESULT property supersedes task 2.1's "no new schema field" clause — operator-ratified (2026-08-30).
- Round-3 findings (stale red-gate sentence, End-state 7/9 grep mechanics, refiner-surface ownership, Method outlier) patched without probe re-runs — stamped `adjudicated: true`, retained in the gate record — operator-ratified (2026-08-30).

## Residual risk
- Wall-clock win and semaphore-vs-harness-cap composition are deferred validations (backstops, operator via `/war-review`).
- aceBisect ladder's four filed residual fragilities predate this plan and are untouched.
- End state 9's wrap tolerance rests on the authored-unwrapped instruction, not a mechanical guard.
- The plan branch merged origin/master at d3624aa mid-verification; round 3's drift probe verified the load-bearing anchors at that tip. Headroom figures are dated snapshots — re-measure at each task base (D12).
- Escape-guard note: round-1 baseline showed one moved ref, `refs/heads/claude/open-issues-triage-c3cdf5` — provenance-cleared as the Lead's own plan commits, not probe residue. All later guard runs exit 0.

## Safety
All execution probes ran in throwaway temp dirs or `git clone --no-hardlinks` sandboxes; the repo received only plan-file patches and this report. No pushes, no deploys. One probe-created stray file (`a.txt`) was removed by the probe itself; guard re-runs confirmed clean.
