# Red-team: 2026-11-08-shell-floors-tests-and-lint

- **Plan:** `docs/plans/2026-11-08-shell-floors-tests-and-lint.md`
- **Verdict:** ADJUDICATED (round 1: every blocker patched in place, AI-declared, with five Lead design rulings)
**Rounds:** 1
- **Artifact kind:** impl-plan
- **Base:** `4bca2722` (origin/master after plans 1 to 8 of the campaign merged, release 0.21.47). Sandbox clone at that sha.
- **Probes:** 12 (6 spine, 6 bespoke), 4 executed, 8 analyzed, all on target, none dropped. Escape guard exit 0 for the clone and the main checkout.
- **Gate:** first pass BLOCKED (40 blocker rows, 19 needsDecision rows and 30 minors, 39 distinct findings in about 11 classes). The plan was drafted at `35aa4144` before plans 4 to 8 landed, so most findings are moved anchors. After the patches, 74 findings were stamped adjudicated. The gate returned ADJUDICATED at rounds 1 with no route upstream.

## Measured at base

| Surface | Size | Line | Room |
|---|---|---|---|
| `GLOSSARY.md` | 111,335 B | 111,616 B advisory, 131,072 B hard | 281 B to advisory |
| `agents/war-refiner.md` | | | 98 B |
| Workflow prompt-literal share | | | 497 B |
| Version slots | 0.21.47 | | next free patch 0.21.48 |

## Lead rulings (AI-declared)

- **D1, staged gate pass.** `repo-gate.mjs` now runs one Node job per test file in a pool. T1.13 adds one `gate(node-staged)` glob job outside the pools, with `WAR_TEMPLATE_STRIPPED=1`, so the total is `suites.length + tests.length + 1`. The six live fixture counts each rise by one.
- **D2, byte budgets.** The operator ruling of 2026-11-09 applies: fund growth by a tighter rewrite or a byte-identical eviction first, else raise the line by the measured need with a `Budget-Raise: ADR-0042 <surface> +<bytes>` trailer. Constraint 7, PIN-22, A22, the guardrail, End state 25 and T2.1 now agree.
- **D3, the D43 test title.** It names "every living-doc home", with no count word, and `schemas.md` joins `HOMES`.
- **D4, glossary.** `GLOSSARY.md` has 281 B left under its advisory line, so overflow terms go to `glossary-cold.md`.
- **D5, open follow-ups.** #2880 joins T1.9, and #2900 and #2901 join T2.5. The claimed set rises to 40.

## Patched in place (Lead and patch agent, AI-declared)

- **Moved counts (Major).** The `lacks_char_i` label rows number 6 at base, not 4. `EVICTED_2115` has 3 rows, not 4 (#2119 deleted one), so the target is 4.
- **Moved test sites (Major).** The #2266 asserts now match `adr0013Body`, so T1.9 and End state 13 retarget to those two asserts by numbered item.
- **The repo gate restructure (Critical, needsDecision).** Ruled by D1.
- **The budget contradiction (Major, needsDecision).** Ruled by D2.
- **Decision logs exist (Major).** ADR 0006, ADR 0034 and ADR 0044 already carry `## Decision log`, so T2.5 appends one line to each in the ADR 0063 form.
- **The PIN-26 tokenizer (Major).** It now probes only a command-position `node --test` and skips quoted text, `$` tokens and redirects, so the plan's own Done-when commands do not trip it.
- **Evidence rows (Major).** #2792 gains a row, and #2716 gains its `.claude/war/config.json` artifact.
- **Check hygiene.** No check holds a `;` inside quotes or a nested backtick, and every negative guard matches case-insensitively over joined text. The patch agent ran all 51 checks at base in a throwaway clone: each one exits red for its stated reason, with no syntax error.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| One `gate(node-staged)` glob job, total `suites + tests + 1` | one job, total `suites + 1` | AI-declared (D1) |
| Cited `Budget-Raise:` allowed after a tighter rewrite | no ceiling rises | AI-declared, applying the operator ruling of 2026-11-09 (D2) |
| `EVICTED_2115` length 4 | length 5 | AI-declared |
| T2.5 appends Decision-log lines | adds a `## Decision log` heading | AI-declared |

## Residual risk (minors not patched)

- TRIAL-1 (whether RG.4b is reachable) stays unsettled. The plan states both counts.
- TRIAL-5's "23 B of headroom" stays as a historical trial record.
- The plan names 0.21.47 and 0.21.48 as literals. T3.1 still resolves the next free patch at land time.
