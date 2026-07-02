# Red Team — gate-audit `integration_sha` validation plan (2026-07-01)

**Verdict:** CLEARED-WITH-NOTES — no blockers, no open decisions; two Minors found and auto-patched into the plan.

Plan: [`docs/plans/2026-07-01-gate-audit-integration-sha-validation.md`](../plans/2026-07-01-gate-audit-integration-sha-validation.md) (spec 12, issue #393, v0.8.12).
Source spec: [`docs/specs/2026-07-01-gate-audit-integration-sha-validation-design.md`](../specs/2026-07-01-gate-audit-integration-sha-validation-design.md).
Repo tip at verification: `95b385f`.

## Attack surface

Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke: snippet-fidelity (anchor/fixture-coupling constructs), command-diff (pre-state greps + regex claims), guard-allows-catfile (D2's "no guard change" dependency), edits-compose (apply D1+D2+test edits, run suite), baseline-repro (full gate at tip).
Executed in sandbox: 6 of 10 probes (executable-proof, command-diff, guard-allows-catfile, edits-compose, baseline-repro + one precondition probe). Coverage whole: 10/10 expected probes ran on-target, 0 dropped.

## Executed proof

- **Baseline:** full self-discovering gate green in a sandbox copy of the tip — `node --test` 320/320 + 13/13 `*.test.sh` runners.
- **Full TDD simulation (Steps 2–6):** RED set is exactly {T1-3 new sentinel, D1 `pinOrSentinel` unit test, D2 `cat-file` prompt assertion} with T1-1/T1-4 staying green pre-production (as the plan predicts); post-D1+D2 GREEN = 322/322; Step-6 greps = 2/0/1/1 as stated.
- **Wiring proofs reproduce:** always-sentinel `pinOrSentinel` body → T1-1 **and** T1-4 RED (both copy sites route through the helper); deleting the `cat-file -t` line → only the D2 assertion RED.
- **Regex claims (decision d):** all 8 cases behave as the plan asserts — `/^[0-9a-f]{7,40}$/` accepts the 24-hex spec example (the plan's correction of the spec's self-contradiction is right), rejects the ellipsis-tailed value, rejects `'sha-abc123unique'` (fixture would collapse post-D1, confirming decision (e)), accepts `'c0ffee1234'`.
- **Guard (decision f):** driven as its own `.test.sh` drives it, `agent_type: war-auditor` — `git -C <path> cat-file -t abc1234` → ALLOW (exit 0, `-C` peel works); sentinel-argument form → DENY exit 2 naming `()`; `git -C <path> push origin main` → DENY (peel does not widen verbs). "No guard change" holds.

## Findings

### Minor (2 — both auto-patched)
- [Minor] *Integration base pinned to `72d07c7`* → real master tip is `95b385f` (PR #395 docs-only merge; `git diff 72d07c7..HEAD` over every plan-relevant file is empty, all anchors/version slots verified live at the real tip). Resolution: Coordination bullet reworded to "latest `origin/master`", `72d07c7` demoted to grounding snapshot.
- [Minor] *Decision (f) attributes the sentinel denial to "`()`/spaces"* → executed proof shows **space is inside** the guard's char-allowlist (`A-Za-z0-9 ./_=:,@^-`); only the parens trigger the deny. Resolution: decision (f) reworded to parens-only attribution + explicit "do not drop the parens from the sentinel text".

## Resolutions applied (grill decisions)

- No grill rounds needed — no Critical/Major/needsDecision. Both Minors auto-fixed in place (Coordination "Integration base" bullet; Operator decision (f)).

## Residual risk

- The sentinel's guard-denial depends on the parens characters staying in the sentinel string — now documented in decision (f); a future sentinel reword without parens would reach real git instead of the guard (still SOFT via `cat-file` failure, but by a different mechanism).
- Version literal `0.8.12` remains subject to the plan's own next-free-patch fallback if the landed baseline moves before land time.
