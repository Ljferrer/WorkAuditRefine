# Red-team report — Auditor git-guard read-only `git -C <path>` + reworded gate-audit pin

**Plan:** [`docs/plans/2026-06-30-auditor-git-guard-readonly-c-flag.md`](../plans/2026-06-30-auditor-git-guard-readonly-c-flag.md)
**Source spec:** [`docs/specs/2026-06-30-auditor-git-guard-readonly-c-flag-design.md`](../specs/2026-06-30-auditor-git-guard-readonly-c-flag-design.md)
**Date:** 2026-06-30 · **Target:** v0.8.4 (landOrder 4) · **Base:** `origin/master` `d704495` (v0.8.3) · **Closes:** #222

## Verdict: **CLEARED** (after two remediation rounds)

Initial gate returned **BLOCKED** — two independently-CONFIRMED Criticals (the plan shipped a failing node suite) plus one `needsDecision` Minor. All were patched in place and the corrected plan was re-verified to a fully green gate in a throwaway sandbox (node 295/295; all 13 `*.test.sh` pass, incl `validate-auditor-git.test.sh` GROUP H 62/62).

## Attack surface

8 probes, all on-target: 5 spine + 3 bespoke.
- **Executed (throwaway sandboxes):** `executable-proof`, `tdd-222`, `reword-222`, plus two full re-verification passes.
- **Analyzed (read-only):** `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `anchor-222`.
- **Outcomes (initial):** pass 5 · fail 3 · warn 0. The peel + reword *mechanisms* were sound throughout; every defect was in **test-authoring instructions**, not the behavioral change.

### Bespoke probes
- **`anchor-222`** (analyzed, pass): confirmed the guard's global-flag `esac` → `# Extract the subcommand` insertion point and the `workflow-template.js:503-504` `EXACTLY this bracket test` / `[ "$(git -C` reword target, all verbatim at HEAD; confirmed `-C` has no arm today (falls to `*)` default deny) and the char allowlist forbids `$ ( ) [ ] "`.
- **`tdd-222`** (executed, pass): reproduced the Phase-1 peel RED→GREEN and load-bearing revert.
- **`reword-222`** (executed, fail→resolved): see Critical #1 below.

## Findings & resolutions applied

| # | Probe(s) | Severity | Finding | Resolution |
|---|----------|----------|---------|------------|
| 1 | `executable-proof` + `reword-222` (both CONFIRMED, two sandboxes) | **Critical** | Phase 2 deletes the `[ "$(git -C` substring, but `skills/war/assets/workflow-template.test.mjs:1532-1544` (test `#193 T2-2`) **hard-asserts** that exact substring is present. Plan as written → node suite RED (295→294). Plan omitted that `.test.mjs` from Task 2, claimed "no test asserts on this string" (×3), and marked Task 2 `requiresTest:false`. Probe evidence: reword-only → `pass 294 / fail 1`; reword + assertion update → `pass 295 / fail 0`. | Added `workflow-template.test.mjs` to Task 2's Files; set `requiresTest:true`; added a Step-1 that updates `#193 T2-2` to the new bare form (RED-first) and renames it off "bracket test"; corrected the three false "no test" claims + the Gate table T2 row + Build-order line. |
| 2 | `coverage-vs-source` (CONFIRMED) | **Minor** (`needsDecision:false`) | Plan called the spec's `git -C -C` rationale "wrong/bogus". In fact both are correct for *different* inputs: `git -C -C rev-parse` (no path) → peel leaves `rev-parse HEAD` → ALLOW (plan right); `git -C /path -C rev-parse` (path between flags) → peel leaves `-C rev-parse` → default deny (spec right). | Reworded the plan's line-78 bullet and the `ponytail:` comment note (lines ~102) to acknowledge both inputs are safe and which one each statement addresses. |
| 3 | `coverage-vs-source` (CONFIRMED) | **Minor** (`needsDecision:true` → blocked) | The double-`-C` peel edge case was documented but untested — a future change to the token-drop pattern could silently regress it. | **Chose option A** (add a test): added **H6** `expect_allow "git -C -C rev-parse HEAD"` (load-bearing red-first, like H1/H2), asserting the accepted harmless-double-`-C` behavior. |

### Round-2 defects (surfaced by the first full re-verification of the patched plan)

Re-verifying the round-1 patch end-to-end (not just the isolated probe) surfaced **two more test-authoring defects** the plan's literal instructions would have shipped RED:

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 4 | **Critical** | Phase-1 Step-1's H5 (the bracket/`$()` injection-parity deny) built its payload via `auditor_cmd`, whose `printf '{…"command":"%s"…}'` emits **invalid JSON** when the command contains double-quotes (H5's bracket form). The guard's `jq` then reads an empty `.agent_type` → non-auditor `*) exit 0` pass-through → the deny is **vacuous** (rc 0), so H5 fails and `validate-auditor-git.test.sh` exits 1. (memory `printf-json-escaping-vacuous-test-case`.) | Rewrote H5 to build its payload with an explicit `jq -nc --arg c '…' '{agent_type:"war-auditor",tool_input:{command:$c}}'` snippet (inlined in the plan); noted H1–H4/H6 have no embedded `"` so `auditor_cmd` stays fine for them. |
| 5 | **Critical** | Phase-2 Step-1 (as first patched) told the worker to assert the emitted prompt contains the **literal** `git -C ${refineryPath} rev-parse HEAD`. But the prompt is a template literal; `${refineryPath}` is already interpolated in the emitted string `p` (sibling test `#193 T2-1` asserts the interpolated `/abs/repo/.claude/worktrees/run-2026/_refinery`). Asserting the literal token → node `294/1`. (The Step-3 *grep* is fine — it matches the **source** file, which does contain the literal template.) | Rewrote Step-1 to assert the **interpolated** fixture path (matching T2-1), explicitly warning that `${refineryPath}` appears only in the source (grep), never in the emitted prompt (assertion). |

## Re-verification (final)

The doubly-patched plan was executed end-to-end in a clean detached-worktree sandbox at the integration base `d704495`:
- **Phase 1:** RED pre-peel (H1/H2/H6 `expect_allow` fail — `rest` begins `-C ` → default deny); GREEN post-peel **62/62** (H1/H2/H6 allow; H3/H4/H5 deny exit 2 + `WAR:`; C5 stays deny; H5 built via `jq` denies correctly).
- **Phase 2:** `#193 T2-2` RED pre-reword (single-file `108/1`); after reword + test update the full gate is **green**.
- **Full gate:** `node --test 'skills/**/*.test.mjs'` → **tests 295 / pass 295 / fail 0**; all **13** `*.test.sh` pass.
- **Grep post-conditions:** `grep -F '[ "$(git -C' workflow-template.js` → nothing; `grep -F 'git -C ${refineryPath} rev-parse HEAD' workflow-template.js` → hit (L504).

## Residual risk

None blocking. This plan is the fix for the recurring `gate-audit-pin-bracket-test-blocked-by-git-guard` SOFT-downgrade pattern (#310/#222) — the `-C` half. It deliberately does **not** widen the verb allowlist to admit `git fetch` (the separate submodule-lens half, tracked at [#310](https://github.com/Ljferrer/WorkAuditRefine/issues/310)); GROUP H keeps to read verbs only, and H3/H5 + C5 prove the write/injection defenses stay closed.

## Coverage summary

`{ probes: 8, executed: 3, analyzed: 5, expected: 8, onTarget: 8, offTarget: [], dropped: [] }` — coverage whole. Initial fail 3 (all test-authoring, all patched); two remediation rounds; final re-verify green. No `INCOMPLETE` condition.
