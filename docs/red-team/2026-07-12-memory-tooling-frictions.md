# Red-team report — memory-tooling-frictions

**Plan:** `docs/plans/2026-07-12-memory-tooling-frictions.md`
**Source spec:** `docs/specs/2026-07-12-memory-tooling-frictions-design.md`
**Run:** Workflow `wf_6eda5a86-18a` (session-opus). Base: `9cbfdcb` (detached worktree `redteam-p8`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED-WITH-NOTES**

- Blockers **0** · needsDecision **0** · Minors **1** (AI-intent note only). Coverage whole (7/7 on-target, **0 fail / 7 pass**, 0 warn, 0 dropped). Escape guard clean. No plan patch required.

## Baseline-repro (executed) — PASS

The four targeted frictions are real and unstarted at `9cbfdcb`:
1. **#821** `buildProjection` cross-root double-count: the same slug present in both roots (a promoted twin) emits **two** projection rows for one fact; `archiveCandidates` is fed the non-deduped hot set. (This is the exact double-count the campaign Lead has been manually working around every Gate-2 by removing promoted local duplicates.)
2. **#822** survey-corps Step 0 Mine step 3 instructs citing `<local-root>/<slug>.md` — a home-path form that trips the fail-closed redaction lint — not slug-only.
3. **#823** `lessons-learned` migrate pre-flight runs `war-config.mjs … --fill-defaults` with no `test -f .claude/war/config.json` guard ahead of it, and `--fill-defaults` exits nonzero on an absent config — so the most common state (no config) makes the pre-flight fail.
4. **#820** repo rows starve the single hard cap with no root-aware remediation lever (the headroom deficit).

## Executable-proof (executed) — PASS

The probe implemented the proposed fixes in a sandbox and verified them: slug dedup inside `buildProjection` (repo copy wins) collapses the twin to one `[repo]` row and feeds the deduped set to `archiveCandidates`; the root-aware `archiveCandidates` comparator orders local-before-repo on an equal-tier tie; the slug-only survey-corps citation passes lint; the `test -f`-guarded migrate pre-flight reaches `commitLearnings: false` on an absent config with no nonzero-exit command. Baseline suite (`war-memory.test.mjs`) green.

## Spine lenses

claims-vs-reality · executable-proof · coverage-vs-source · consistency-placeholders · dependency-feasibility · intent-vs-plan — **all pass**. The one Minor: AI-Commander's Intent is machine-authored (8 End-states individually checkable + each task-mapped; the untouched-surface constraints — ADR 0022 promotion semantics, lint posture, budget constants, `war-config.mjs` CLI — asserted). Human upgrade `/war-strategy`.

## Drift-guards (Lead-run)

- `unguarded-new-mirror` — **vacuous**. No new `workflow-template.js`/canonical-export mirror; Task 1.1 edits `war-memory.mjs`'s own `buildProjection`/`archiveCandidates`.
- `default-flip-old-absent` — N/A (no default flip / scope-narrow).
- `ff-topology` — N/A (no per-task merge-commit topology anchors; the "stacks eighth" contention analysis is about file footprints).

## Backstops (4 — AI-declared, all legitimate)

- Live two-root headroom (≥4,000 B on the operator's real store) · deferred because Task 1.4's in-run acceptance is repo-rows-only against a scratch local · runner: operator / `/aftermath` post-campaign render.
- Fresh-clone migrate pre-flight walkthrough · runner: **/red-team sandbox probe on this plan** (the executable-proof above exercised exactly this path — absent-config → `commitLearnings:false`, no nonzero-exit command — satisfying the named runner) / next real `/lessons-learned migrate`.
- `cmdArchive` slug-shadowing residual (accepted) · no in-plan fix (conflicts with the ratified recurrence-edit contract); Task 1.1's dedup stops the twin from ever being nominated.
- Per-root byte-budget insufficiency tripwire · runner: next `/lessons-learned` housekeeping re-measure; a recurring `refuse` or <1,000 B headroom files a `war-followup`.

Each carries its AI-declared operator-attention marker (ADR 0014).

## Residual risk

AI-Commander's Intent un-ratified by operator (human upgrade: `/war-strategy <plan>`).
