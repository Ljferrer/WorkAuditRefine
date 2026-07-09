---
name: floor-script-discovery-set-must-mirror-gate-exclusions
description: "Floor match set must mirror gate find excl+depth (3rd recurrence: gate-pin-status.sh)"
metadata:
  type: project
  provenance: code-verified
  keywords: [find predicate, depth bound, node_modules filter, glob asymmetry, over-credit, case arms, byte-copy matcher, drift guard, gate-pin-status]
  slug: floor-script-discovery-set-must-mirror-gate-exclusions
  phase: audit-gate-verdict-fidelity/t1.1
  date: 2026-07-09
  tags:
    - floor-script
    - gate
    - discovery
    - test-coverage
  related:
    - weak-test-assertion-passes-without-feature-being-exercised
  promoted: true
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Floor script match patterns must mirror the gate's find exclusions exactly

**Rule:** when a floor script (`assert-test-in-diff.sh`) claims its match set equals the gate's discovery set, diff the two mechanisms line-by-line — path exclusions, depth bounds, name patterns. Any asymmetry over-credits (floor passes, gate won't run the test) or under-credits; close each, or document a proof the gap is unreachable via `git diff`. Two recurring shapes:
- **Exclusions:** mirror the gate's `-not -path '*/node_modules/*' -not -path '*/.git/*'` with `case` arms returning 1 — don't accept ANY path ending `.test.sh`.
- **Unbounded depth:** match a depth-agnostic glob (`skills/**/*.test.mjs`) with a nested prefix+suffix `case`, not an enumerated depth ladder that misses depth 6+.

Fixed in the `match_default` function of `assert-test-in-diff.sh` (exclusion arms + depth-agnostic nested case, ponytail-commented).

**Why:** floor/gate asymmetry silently mis-credits test presence either direction.
**How to apply:** on any "EXACTLY equals the gate's discovery set" claim, enumerate both discovery mechanisms and diff them.

## Recurrence 3 — `gate-pin-status.sh` standalone default (audit-gate-verdict-fidelity/t1.1, 2026-07-09)

`gate-pin-status.sh`'s `match_sh_suite`/`match_default` (verify still present before acting — found at `skills/war/assets/gate-pin-status.sh` lines 94-109 @ phase audit-gate-verdict-fidelity/t1.1) are a **byte-for-byte copy** of `assert-test-in-diff.sh`'s discovery matchers, used only for the standalone default path (absent `--mapped`; the pipeline always passes an explicit `--mapped` list, so this copy never reaches the anti-cheat HARD path). The in-code comment now explicitly cites this memory slug by name — a nice closed loop — but **there is still no automated test locking the two copies in sync**; if the gate's discovery set changes in `assert-test-in-diff.sh`, this third copy drifts silently with zero test failure. Audit-adjudicated as Nit/informational both times (plan explicitly scopes the default as standalone-only, so blast radius is nil). Third occurrence of the same byte-copy-without-drift-guard idiom in this codebase (siblings: `assert-guard-specificity-in-diff.sh`'s covering-test match set, per its own header, mirrors the same set a fourth time) — if a fourth floor script adds its own copy, consider extracting the shared matcher into one sourced function instead of continuing to hand-copy it.

[[weak-test-assertion-passes-without-feature-being-exercised]]
