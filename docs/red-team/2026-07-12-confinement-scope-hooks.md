# Red-team report — confinement-scope-hooks

**Plan:** `docs/plans/2026-07-12-confinement-scope-hooks.md`
**Source spec:** `docs/specs/2026-07-12-confinement-scope-hooks-design.md`
**Run:** Workflow `wf_20bad6fe-882` (session-opus; `agents.redteam` absent on the stack — inherit-session). Base: `bf0d576` (detached worktree `redteam-p4`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED-WITH-NOTES**

- Blockers: **0** · needsDecision: **0** · Minors: **8**
- Coverage whole: 7/7 spine + bespoke probes on-target, 0 off-target, 0 dropped, 0 fail (5 warn, 2 pass).
- Escape guard: clean (exit 0).

## Attack surface / executed proof

- **Executed:** 2 (executable-proof spine + baseline-repro bespoke). Baseline-repro CONFIRMED the narrowing is real, unstarted work — the base carries unanchored `*war-*` arms in `validate-servitor-provenance.sh`, `validate-auditor-git.sh`, `validate-worktree-scope.sh`, `warn-bash-write-scope.sh`, and the warn hook's deny-route count is already 0 (advisory posture is **preserved**, not introduced) with a terminal `exit 0`.
- **Analyzed:** 5 (claims-vs-reality, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan).
- **Drift-guards (Lead-run):** `unguarded-new-mirror` — vacuous (plan introduces no new `workflow-template.js` inline mirror; it reads the source-derived `NS` constant, verified). `default-flip-old-absent` — the scope-narrow is code-arm anchoring, not a doc-default flip; End-state 3/4 already assert the OLD unanchored shape *absent* across enumerated surfaces via standing convention cases. `ff-topology` — not applicable (no per-task merge-commit topology anchors; "integrated tip" refers to standard phase-close sweeps).
- **Backstop-legitimacy:** 6 AI-declared backstops, all legitimate — each names a concrete why-deferred (field-only observability, no captured live payload, non-hermetic realpath divergence, structurally-unavailable per-run threading, ratified best-effort posture, non-test-floor surface) and a runner/canary or an explicit structural bound. Per AI-declared provenance (ADR 0014), each is flagged for operator attention — recommend review at merge / a `/war-strategy` human upgrade pass.

## Resolutions applied (plan patched → commit `86c8b69`)

All 8 minors were non-blocking; the mechanical plan-accuracy corrections were auto-applied to prevent worker no-op hunts and an acceptance-grep miscount:

1. **SERV_MEM allow-case over-count (4 probes concurring).** Plan said "case 4a + the two clean-memory regression cases" flip red under `$HOME`-anchoring; the live `validate-worktree-scope.test.sh` has exactly **two** SERV_MEM allow cases (4a + one regression). Corrected at End state 5, Task 1.2, and Q3.
2. **warn-hook exit-0 wording.** "three early `exit 0`s" is internally inconsistent with the separate terminal-`exit 0` call-out (the hook has 2 early + 1 terminal). Reworded at End state 2 and Q11; the greppable assertion itself was already correct.
3. **End-state-4 exactly-TWO-survivors grep.** The reworded servitor deny-message must not embed the literal unanchored glob (a third `grep` hit would break the count). Tightened the survey clause to require descriptive naming.
4. **ADR-0002 substring-prose straggler = no-op.** The live 48-line ADR carries no `*war-<role>*` / substring-semantics arm prose; the "update ADR 0002 policy-table prose" edit is self-nullifying. Dropped from the End-state-3 straggler list and Task 1.4 piece 1 (only the additive dated addendum lands there).

## Residual risk (auto-noted, non-blocking)

- **AI-Commander's Intent is machine-authored** (ADR 0014). Well-formed (nine individually-checkable End states, per-condition task mapping, sufficient for the stated Purpose) but un-ratified by an operator. Human upgrade path: `/war-strategy docs/plans/2026-07-12-confinement-scope-hooks.md`.
- The 6 AI-declared backstops carry their standing operator-attention marker.
