---
name: floor-script-discovery-set-must-mirror-gate-exclusions
description: "Floor match set must mirror gate find excl+depth"
metadata:
  node_type: memory
  type: project
  keywords: [find predicate, depth bound, node_modules filter, glob asymmetry, over-credit, case arms]
  slug: floor-script-discovery-set-must-mirror-gate-exclusions
  phase: worker-test-floor/t1
  date: 2026-06-29
  tags:
    - floor-script
    - gate
    - discovery
    - test-coverage
  related:
    - weak-test-assertion-passes-without-feature-being-exercised
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Floor script match patterns must mirror the gate's find exclusions exactly

**Rule:** when a floor script (`assert-test-in-diff.sh`) claims its match set equals the gate's discovery set, diff the two mechanisms line-by-line — path exclusions, depth bounds, name patterns. Any asymmetry over-credits (floor passes, gate won't run the test) or under-credits; close each, or document a proof the gap is unreachable via `git diff`. Two recurring shapes:
- **Exclusions:** mirror the gate's `-not -path '*/node_modules/*' -not -path '*/.git/*'` with `case` arms returning 1 — don't accept ANY path ending `.test.sh`.
- **Unbounded depth:** match a depth-agnostic glob (`skills/**/*.test.mjs`) with a nested prefix+suffix `case`, not an enumerated depth ladder that misses depth 6+.

Fixed in the `match_default` function of `assert-test-in-diff.sh` (exclusion arms + depth-agnostic nested case, ponytail-commented).

**Why:** floor/gate asymmetry silently mis-credits test presence either direction.
**How to apply:** on any "EXACTLY equals the gate's discovery set" claim, enumerate both discovery mechanisms and diff them.

[[weak-test-assertion-passes-without-feature-being-exercised]]
