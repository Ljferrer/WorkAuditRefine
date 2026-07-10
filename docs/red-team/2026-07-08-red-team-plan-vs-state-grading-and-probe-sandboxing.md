# Red-team report — red-team-plan-vs-state-grading-and-probe-sandboxing

**Plan:** `docs/plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md`
**Source spec:** `docs/specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md`
**Repo baseline:** `dev/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing` @ `6296af0` (stacked on plans 1–7)
**Run:** `wf_650700e4-13f` · **Date:** 2026-07-10

## Verdict: **CLEARED**

14 probes, **14 pass, 0 fail**. No blockers, no `needsDecision`, no minors. On-target 14/14; no off-target or dropped probes. No plan patch required.

## Attack surface

6 spine lenses + 8 bespoke (construct-anchors for each task's edit target + drift-guard + backstop-legitimacy). Executed: 1 (`executable-proof` copied the repo to a throwaway sandbox, ran `node --test` full + targeted, every `hooks/`/`skills/` `*.test.sh`, and `war-memory lint`, then grepped anchors — all green, `rt-plan8` never touched). Analyzed: 13.

## Verified (all held at the tip)

- **Task 1.1 anchors** — `workflow-scaffold.js` carries the args destructure (`{ planFile, repo, sourceSpec, probes=[], fingerprint, provision=[] }`, the `provision` back-compat precedent artifactKind joins), the `preconditionRule` (#311) preamble, the `runProbe` composition site, and `scopeLock('executed')` with the "cd into that copy" text to harden.
- **Task 1.2 anchors** — `red-team-gate.mjs` has `classify()`/`verdict()` and the existing pass-demote rule (`probeStatus !== 'pass'` blocks); the D7 "two-contract" summary sentence is present on BOTH `workflow-scaffold.js` (CONTRACTS comment) and `references/lenses.md`, so the pin has real anchors.
- **Task 1.4 anchors** — `SKILL.md` carries the Diagnosis/self-confound gate section citing the cwd-reset escape precedent; `lenses.md` carries the "(Optional, deferred) deterministic execution harness" bullet Task 1.4 rewrites.
- **Task 1.5 anchor** — `auditPrompt()` has the `intentClause` construct (the append precedent for `adjudicationClause`); `agents/war-auditor.md` is the standing mirror surface.
- **Task 1.6** — highest existing ADR is 0031; 0032/0033 are the next free numbers.
- **Drift-guard** — both new mirrors ship their same-task guard: Task 1.5's adjudicationClause both-surfaces drift assert in `workflow-template.test.mjs`, and Task 1.2's D7 two-contract greps on both surfaces. `default-flip-old-absent` vacuous (no default-flip task).
- **Backstop-legitimacy** — all 4 deferrals (escape-guard junk-ref heuristic ceiling; deliverableAbsence self-tagging trust; artifactKind misclassification; live adjudication threading) are justified with concrete reasons and named runners; none over-declared.

## Residual risk

- Four ratified backstops carried into the `/war` handoff — each a legitimate deferral with a named runner (guard output/lessons feed; adversarial-confirm loop; Lead pre-flight run-header eyeball; first stacked campaign run + `/red-team` prose check).
