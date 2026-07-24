# Red-team report — CLI main-guard normalization (realpathSync idiom)

- **Plan:** `docs/plans/2026-07-22-cli-main-guard-normalization.md`
- **Source spec:** `docs/specs/2026-07-22-cli-main-guard-normalization-design.md`
- **Repo base:** `dev/2026-07-22-cli-main-guard-normalization` @ `cae15d3` (campaign plan 8 of 9)
- **artifactKind:** `tdd-plan` (red-first — the three regression tests ship failing pre-implementation)
- **Verdict:** **CLEARED-WITH-NOTES** (1 round; zero blockers, zero `needsDecision`; no plan patch required)
- **Run:** `wf_403b3e9b-5bd` (task `wjcql6gyi`) — model opus / effort high

## Attack surface

- **Executed proof:** 3 probes (2 bespoke + 1 spine) — `guard-mechanism-executable-proof`, `usage-stream-correction`, and the spine `executable-proof`. All in throwaway sandboxes / read-only invocations; target repo never mutated (escape guard exit 0).
- **Analyzed:** 6 probes (5 spine + 1 bespoke `sweep-and-survivor-completeness`).
- **Coverage:** expected 9, on-target 9, offTarget 0, dropped 0 — coverage whole.
- **Lead-run checks:** backstop-legitimacy (1 AI-declared entry) + the two drift-guard spine probes (`unguarded-new-mirror` vacuous — the plan adds no inline mirror to `workflow-template.js`; `default-flip-old-absent` folded into `sweep-and-survivor-completeness` — the End-state-1 sweep asserts the OLD unnormalized forms *absent* across skills/ + hooks/, not merely the new form present). `ff-topology` not mandated — the plan anchors no merge-commit topology.

## Executed proof — highlights

- **`guard-mechanism-executable-proof` (PASS) — the plan's whole premise proven on Node v24.17.0.** Two throwaway ES-module CLIs (bare `fileURLToPath(import.meta.url) === process.argv[1]` replicating stage-workflow's form; normalized `process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])`), each invoked three ways in a realpath'd mktemp dir:
  - **Direct absolute:** both run `main()`.
  - **Relative (`cd`; `node ./x.mjs`):** the bare guard **still runs `main()`** — argv[1] arrives pre-resolved absolute and equal to the realpath'd `import.meta.url`. The issue-#988 relative-invocation trigger is **non-discriminating (vacuous)** on this Node.
  - **Symlink (`node /path/to/link.mjs`):** the bare guard **silently exits 0** (argv[1] keeps the symlink path while `import.meta.url` resolves to the target — the real bug); the normalized guard **runs `main()`**.
  Both PASS conditions met: relative does not discriminate, symlink does. The plan's mechanism correction and its red-first test design (symlink-invocation fixtures) rest on a true premise.
- **`usage-stream-correction` (PASS):** the three real CLIs run no-args at base, stdout/stderr captured separately — `stage-workflow.mjs` usage on **stderr** (exit non-zero), `war-config.mjs` usage on **stdout** (exit 1 — the plan's spec-correction claim, matching its own header comment distinguishing the usage error from "errors on stderr"), `campaign-ledger.mjs` usage on **stderr**. Every per-file stream assertion in End state 2 / Task 1.1 matches reality; no mandated regression test asserts against the wrong stream.
- **`executable-proof` (spine, PASS):** plan commands and snippets execute as written in the sandbox copy.

## Analyzed — highlights

- **`sweep-and-survivor-completeness` (PASS):** the two anchored greps (`=== process.argv[1]`, `file://${process.argv`) over skills/ + hooks/ return **exactly** the three target guards (stage-workflow.mjs:97, war-config.mjs:425, campaign-ledger.mjs:537) and nothing else at base; the three normalized survivors (war-memory.mjs, red-team-gate.mjs try/catch form, plan-literal-lint.mjs at `skills/war-strategy/assets/`) match neither pattern, so the post-fix sweep goes clean and is discriminating. No fourth unnormalized run-as-CLI guard exists. Cross-plan contention: plan 8's write set (3 guard files + 3 test files + 1 lesson) is disjoint from plan-literal-lint.mjs and from plan 9 (`war-strategy-structure-lock`) surfaces.
- **`claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`:** all pass, no findings.

## Findings and resolutions

None blocking. No plan patch was required this round.

### Auto-noted (Minor, non-blocking)

- **AI-declared intent (`intent-vs-plan`, probe PASS):** the `## AI-Commander's Intent` block is AI-authored under `/war-machine --afk` (ADR 0014), no operator ratification — the plan's own Notes record this. The intent is well-formed: End-state conditions 1–6 each individually checkable, each mapped to a delivering task, collectively sufficient. No intent defect. Ratification path is this red-team validation; human upgrade path is `/war-strategy <plan>`.
- **1 AI-declared backstop (Lead backstop-legitimacy check):** legitimate — the live-local `MEMORY.md` render-under-budget check depends on the operator's local memory corpus, not repo fixtures (the repo-side redaction lint runs in-phase), and names its runner + timing (operator `render-index` after merge, `--repo` flag mandated; also Phase 0 of the next `/lessons-learned` pass). No cheaper pre-merge proxy covers it. Carries its AI-declared marker for operator attention (ADR 0014 provenance).

## Spine lenses — all pass

`claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan` — 6/6 pass (the sole `intent-vs-plan` Minor is the AI-declared note above, not a defect).

## Adjudications

| # | ruling | route | re |
|---|--------|-------|----|
| 1 | AFK provenance standing — the `## AI-Commander's Intent` + `## Deferred validations (backstops — AI-declared)` headings are AI-declared (ADR 0014); intent is the ceiling, plan slice the floor; the backstop's AI-declared marker renders at every land and in the wrap-up. | auto-noted; ratified | Intent + backstop carry no operator ratification. |
| 2 | Mechanism provenance — the executable proof (Node v24.17.0) confirms the plan's correction of issue #988: relative invocation is a vacuous trigger (argv[1] pre-resolved); **symlink invocation** is the real discriminating trigger the red-first tests must fixture. Task 1.2's lesson RESOLVED note records this mechanism. | confirmed by executed probe; no patch | The origin lesson's description still names relative invocation as the trigger until Task 1.2 corrects it. |
