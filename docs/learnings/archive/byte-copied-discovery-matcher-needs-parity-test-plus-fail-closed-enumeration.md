---
name: byte-copied-discovery-matcher-needs-parity-test-plus-fail-closed-enumeration
description: "When a byte-copied matcher idiom recurs in 3+ sibling scripts, add a parity test and a fail-closed enumeration over the directory so an unknown copy is caught"
metadata:
  type: project
  provenance: code-verified
  keywords: [byte copy, parity test, fail-closed enumeration, classification census, drift, sibling scripts, discovery matcher]
  slug: byte-copied-discovery-matcher-needs-parity-test-plus-fail-closed-enumeration
  phase: drift-guard-tightening (2026-07-11)
  date: 2026-07-11
  tags:
    - floor-script
    - gate
    - discovery
    - drift-guard
---

# Byte-copied discovery matchers drift silently: pair a parity test with a fail-closed census

**Rule:** byte-copied discovery matchers (`gate-pin-status.sh`, `assert-guard-specificity-in-diff.sh`) drift silently. When a byte-copy-without-drift-guard idiom recurs 3+ times across sibling files, pair a parity test with a fail-closed census of every script in the directory.

**Why:** `gate-pin-status.sh`'s `match_sh_suite`/`match_default` were a byte-for-byte copy of `assert-test-in-diff.sh`'s discovery matchers, and `assert-guard-specificity-in-diff.sh`'s covering-test match set mirrored the same set again. No test locked the copies in sync, so a change to the gate's discovery set would drift each copy with zero test failure. A parity test added to the next copy only catches copies you already know about.

**How it was closed:**
- The Case 10 parity idiom was replicated into `gate-pin-status.test.sh` and `assert-guard-specificity-in-diff.test.sh`. The gate side is extracted from `resolveGate`'s output via the `--resolve-gate` CLI; the floor side from the executable `return 1 ;;` case arms in comment-stripped source. Each file got its own parity case and a mutation case that proves the parity assertion is load-bearing.
- A fail-closed classification case in `assert-test-in-diff.test.sh` enumerates every non-test `.sh` in `skills/war/assets/` against a hardcoded `parity` / `exempt: <reason>` row list. Present-but-unclassified or classified-but-absent fails loud. The enumeration is not prefix-narrowed, so non-`assert-*` scripts are in the set. Each `parity` row is content-verified: its twin `.test.sh` must invoke `--resolve-gate`. A permanent mutation arm (a stub new floor script) proves the census itself is non-vacuous.

**How to apply:** at the third copy of a hand-copied matcher, add the parity test AND a fail-closed enumeration over the whole directory or class, so an unknown future copy is caught by construction, not by someone remembering to extend the roster.

> archived 2026-07-11: resolved — moved to archive
