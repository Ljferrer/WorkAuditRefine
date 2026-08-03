# Red Team — 2026-08-02-structural-test-nonvacuity (2026-08-02)

**Verdict:** BLOCKED (advisory) — every root finding across three rounds is patched in the plan and carries an adjudication row; one scope-bounded residual is recorded under `## Open decisions`. Per the ratified operator directive (`redteam-blocked-is-advisory-once-patched-and-adjudicated`), the campaign proceeds.

Source spec: [2026-08-02-structural-test-nonvacuity-design](../specs/2026-08-02-structural-test-nonvacuity-design.md).
Plan authored by `/war-machine --afk` (ADR 0014) — its `## AI-Commander's Intent` and AI-declared backstops had no operator ratification entering this pass.

## Attack surface

Spine (all six, every round): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`.

Bespoke, round 1 (8): `anchor-check-live-constructs`, `snippet-fidelity-quoted-literals`, `baseline-repro-four-surface-sweep`, `baseline-repro-derivation-shape`, `baseline-repro-auditor-guard-cases`, `stager-throw-arms`, `default-flip-old-absent` (mandatory drift-guard probe), `ff-topology` (mandatory — the plan carries merge-topology evidence prose).
Round 2 (3): `derivation-shape-v2`, `census-per-alternate-v2`, `stager-arms-polarity-v2`.
Round 3 (1): `derivation-guard-v3`.

Lead-run, not scaffold probes: `unguarded-new-mirror` (**vacuous pass** — the plan's footprint is five test/doc files; `workflow-template.js`, the inline-mirror host, is untouched, and the only `assertMirror` references are to existing keys the plan leaves unchanged) and the **backstop-legitimacy check** (below).

Coverage: 14/14, 9/9, 7/7 probes on-target — zero off-target, zero dropped, in every round. Fallback: none; `Explore` was present, so `analyzedAgentType` was omitted and no sticky pin engaged.

Runs: `wf_8baee38d-099`, `wf_a5e90ed9-e0f`, `wf_02f46762-72d`. 37 agents, 0 errors.

## Executed proof

- Baseline suites, unmutated: `bash hooks/validate-auditor-git.test.sh` → 95/95 PASS; `node --test` over the three touched `.mjs` suites → 56/56 pass.
- Four-surface sweep at base → exactly 5 files; `skill-doc-contracts.test.mjs` is a live hit (1 occurrence of each token), so Task 1(a) is real work and the four expected surfaces are all present with no unexpected fifth.
- Per-token census → `EMBEDDED_ARGS` hits 5 files, `ARGS_FALLBACK_ANCHOR` hits 4 — **`skills/war/SKILL.md` carries the first and not the second**.
- Derivation-guard subjects → exactly 10 (nine `FILE_BUDGETS` rows + `WORKFLOW_LITERAL_BUDGET`), confirming deviation 2's correction of the handoff's "eleven".
- Spec's bare fused regex → fails exactly `WORKFLOW_LITERAL_BUDGET`; the parenthetical-tolerant variants → pass all ten with zero comment rewrites.
- Auditor-guard cases → all four target characters are in the live `tr -d` residue set; C8 confirmed group C's last case; C9–C12 appended → 99/99 cases pass with C1–C8 byte-unchanged; per-character widening REDs exactly its case; widening only `{` leaves C10 green (the plan's named fake-proof hazard, confirmed).
- Stager arms → arm (a) exits 1 with `expected exactly one args fallback anchor in template, found 0`; arm (b) exits 1 with `could not locate the …` from `insertArgsPrelude`; throw order confirmed as name → description → args-fallback substitutions, then `insertArgsPrelude`.
- Census as amended → baseline PASS; all three mutation directions RED with delta-naming messages; self-exclusion holds (`skill-doc-contracts.test.mjs` stays absent from the sweep with the new test inside it).
- `ff-topology` → the two-dot `<phase-base>..<tip>` census is ff-safe in both topologies; **WAR's serial merge queue produces no per-task merge commits at all** (the refiner rebases and the merge fast-forwards).
- Escape guard: exit 0 (round 1), exit 1 (rounds 2–3 — **self-confound**, see Safety), exit 0 after commit.

## Findings

### Major

- [Major] Deviation 4 presented a false dichotomy (split the regex, or rewrite a live comment) → a third shape exists. **Reality:** a parenthetical-tolerant fused regex passes all ten live subjects with zero rewrites. The probe additionally claimed a *live* false-green from the split shape; I could not reproduce that — zero subjects pair the two predicates across lines at the base. **Resolution:** adopted the fused shape; the plan now records the hazard as latent, not live.
- [Major] End state 2's census union-equality is satisfiable by one alternate. **Reality:** reproduced exactly — `ARGS_FALLBACK_ANCHOR` is absent from `SKILL.md`, so the `EMBEDDED_ARGS` alternate alone yields the four-file set; rotting the second fragment is silent, and split-fragment construction makes that literal un-findable by the very sweep it implements. **Resolution:** per-alternate expected sets + union on top + a third mutation proof. Re-verified PASS.
- [Major] End state 6 claimed a fixture edit green-restores the fallback arm. **Reality:** adding the tail makes the stager exit 0, so the non-zero-exit assert fails — it REDs. Only restoring the stager re-greens. **Resolution:** reworded as a RED-direction decoy discriminator. Re-verified PASS, zero findings.
- [Major] My own round-1 patch was defective: `[^)]*` matches U+000A, so the optional group spanned comment lines and re-admitted cross-line pairing. **Resolution:** `[^)\n]*`. Independently reproduced before patching.
- [Major] The guard's subject discovery had no floor tying it to `Object.keys(FILE_BUDGETS)` — a row reflowed to a multi-line literal silently drops out (10 → 9) and its derivation comment could then be deleted with the guard green, the exact unauditable-bare-row outcome #1233 exists to prevent. **Resolution:** discovery floor added; sentinel pinned by declaration shape (the identifier also occurs at a use site); no-self-match extended to both subject classes.
- [Major] My round-2 justification overclaimed: "verified at the phase base … only the `\n`-anchored one REDs" is unreproducible — all ten live subjects RED under both variants, because every live byte count is followed by ` →`, not ` (`. A worker executing the mandated proof would have recorded a fake load-bearing proof. **Resolution:** claim restated as prophylactic with its scope named, and the proof list now specifies the shape that actually discriminates.

### Minor (auto-fixed in the plan)

Task 2's submodule-predicate rationale (nothing pins "re-run"; it discriminates because the invocation is unconditional) · backstop 1 marked already-discharged · the nonexistent "JSON-parse deny" (invalid JSON passes through at exit 0 with no marker — the plan's own earlier sentence already said so) · C12's missing single-out-of-allowlist-byte discipline · four rather than two non-derivation-leading blocks · deviation 3's "different merge commits" → "task commits" · deviation 8's out-of-scope class (13 hits, 8 under `docs/`, one a **live** learnings lesson — the exemption is by scope, not frozenness) · `adjudication N` cross-refs retargeted here · Purpose's "five guards" vs Task 3's two *absent* guards · End state 12's unnamed artifact · End state 4's one-task ≠ one-commit.

## Resolutions applied (grill decisions)

`--afk`: no operator; every decision below is Lead-self-adjudicated per ADR 0014.

| Finding | Decision | Plan ref patched |
|---|---|---|
| Fused-vs-split derivation regex | adopt fusion-preserving shape, then newline-anchor it | End state 5, Task 1(e), deviation 4 |
| Census alternate not load-bearing | per-alternate expected sets + union + 3rd proof | End state 2, Task 1(b) |
| Fallback-arm green-restore polarity | reword as RED-direction discriminator | End state 6, Task 3 |
| Subject-discovery vacuity | add discovery floor + reshape proof | End state 5 |
| `\n` justification unreproducible | restate as prophylactic; specify the discriminating proof shape | End state 5 |
| CASE GROUP J/K reading contradiction | pin the historical reading; drop forward-coverage claim | Task 4 |
| Arithmetic binding of derivation to row literals | **not taken** — scope-bounded, recorded | `## Open decisions` |

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->

1. Per-alternate census expected sets — embedded-args token → all four surfaces; fallback-anchor token → the four minus `skills/war/SKILL.md` — supersede the plan's original single union hit-set equality (End state 2 / Task 1(b)).
2. `/post-shrink [\d,]+ B(?: \([^)\n]*\))? @ [0-9a-f]{7}/` supersedes both the spec §3 row-4 bare fused regex and the conversion-time two-independent-contains-predicates shape (End state 5 / Task 1(e) / deviation 4). The `\n` is prophylactic — no live subject discriminates the variants.
3. Stager fallback-arm fixture-tail edit is a RED-direction proof; the green-restore for both arms is restoring `stage-workflow.mjs` — supersedes End state 6's original "flips it green again" (End state 6 / Task 3).
4. CASE GROUP J/K's "C … cases above" is **historical**, scoped to the cases extant at those widenings — it does not forward-cover C9–C12; supersedes Task 4's "automatically cover the additions" clause.

## Residual risk

- **Adjudicated scope-bounded, recorded in the plan's `## Open decisions`:** the derivation guard binds presence and shape, not the derivation's arithmetic against the row's own `hard`/`advisory` literals. A derivation-shaped but wrong (or copy-pasted) comment still passes. Arithmetic binding carries real permanently-RED risk from ceil-KB rounding and was not taken without an operator.
- Backstops are **AI-declared** (ADR 0014) — no human ratified them. Backstop 1 is verified already discharged by the roadmap; backstop 2 (mutation-proof protocol) is legitimate, correctly narrowed, and has a named runner and timing.
- Exact-message coupling on two stager fragments is deliberate (deviation 6) — a future stager reword REDs them loudly.
- The four-surface census intentionally REDs on legitimate growth; a future fifth surface must update the expected lists in the same diff.

## Safety

- No probe mutated the target repo. Round-1 escape guard exit 0. Rounds 2–3 exit 1 was a **self-confound**, diagnosed through the action-provenance gate: the sole stray file was `docs/plans/2026-08-02-structural-test-nonvacuity.md`, which *I* patched and which `/red-team` explicitly sanctions writing. It clears on commit. Worth noting the guard cannot today distinguish the sanctioned plan-patch write from a genuine escape — the `--snapshot`/`--baseline` two-mode ref-diff in campaign plan 2 (`2026-08-02-redteam-doctrine-and-guards`) is exactly the fix.
- The `ff-topology` probe built its fixture in a fresh temp `git init` repo, not in the shared sandbox (the recorded branch-residue incident).
- Two of the six Majors were defects in **my own patches**, caught by the bounded re-verify loop. Both central measurements were reproduced independently before the corrective patch, per the reproduce-before-patching discipline — which is also how the round-1 probe's overstated "live false-green" claim was caught.
