---
name: floor-script-discovery-set-must-mirror-gate-exclusions
description: "A floor script that claims its match set equals the gate's discovery set must mirror the gate's find exclusions and depth exactly"
metadata:
  type: project
  provenance: code-verified
  keywords: [find predicate, depth bound, node_modules filter, glob asymmetry, over-credit, case arms, assert-test-in-diff, match_default, match_sh_suite, near_miss, near-miss diagnostic, diagnostic-only helper, misattributed advisory]
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
---

# Floor script match patterns must mirror the gate's find exclusions exactly

**Rule:** when a floor script (`assert-test-in-diff.sh`) claims its match set equals the gate's discovery set, diff the two mechanisms line by line: path exclusions, depth bounds, name patterns. Any asymmetry over-credits (the floor passes, but the gate won't run the test) or under-credits. Close each gap, or document a proof that `git diff` cannot reach it. Two recurring shapes:
- **Exclusions:** mirror the gate's `-not -path '*/node_modules/*' -not -path '*/.git/*'` with `case` arms returning 1. Don't accept ANY path ending `.test.sh`.
- **Unbounded depth:** match a depth-agnostic glob (`skills/**/*.test.mjs`) with a nested prefix+suffix `case`, not an enumerated depth ladder that misses depth 6+.

Fixed in the `match_default` function of `assert-test-in-diff.sh` (exclusion arms plus a depth-agnostic nested case).

**Also applies to diagnostic-only helpers.** A later `near_miss()` helper in the same file matched test-shaped paths (`*.test.*|*.spec.*|*_test.*`, basename `test_*`) with no exclusion arms, while `match_sh_suite()` beside it mirrors the gate's exclusions. A test file under an excluded prefix was reported as a near-miss, and the closing advisory blamed the pattern instead of the location. `near_miss()` never changes the exit code, but a misleading diagnostic still sends the next fix-worker toward the wrong fix. Every new sibling helper must mirror the exclusion arms, or scope its advisory prose (e.g. "or the file's location is gate-excluded").

**Why:** floor/gate asymmetry silently mis-credits test presence in either direction.
**How to apply:** on any "EXACTLY equals the gate's discovery set" claim, enumerate both discovery mechanisms and diff them.

[[weak-test-assertion-passes-without-feature-being-exercised]]

> archived 2026-07-11: resolved — moved to archive
