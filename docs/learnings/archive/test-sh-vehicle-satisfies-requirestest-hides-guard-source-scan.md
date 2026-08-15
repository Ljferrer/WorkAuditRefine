---
name: test-sh-vehicle-satisfies-requirestest-hides-guard-source-scan
description: "A production-enforcement file shipped as a *.test.sh (the gate-discovery vehicle trick) satisfies assert-test-in-diff.sh's requiresTest for free, AND its added guard lines are scanned only as guard-specificity COVERAGE, never as guard SOURCE — its own exit-2 guard can never be stamped 'uncovered'"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: test-sh-vehicle-satisfies-requirestest-hides-guard-source-scan
  phase: "gate-evidence-and-release-integrity/phase-1 task 1.1 (#1081, landed dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26)"
  keywords: 
    - gate-discovery vehicle
    - test.sh vehicle
    - requiresTest satisfied
    - assert-test-in-diff.sh
    - assert-guard-specificity-in-diff.sh
    - is_test_file
    - match_sh_suite
    - floor blind spot
    - production code disguised as test
    - guard coverage vs guard source
    - merge-path floor
  tags: 
    - guard-architecture
    - merge-path-floor
    - war-memory
    - plan-design
  created: 2026-07-26
  originSessionId: 8e038db9-6931-4633-b7d8-6d7977473ca5
  modified: 2026-07-26T22:55:57.601Z
---

# A `*.test.sh` gate-discovery vehicle is structurally invisible to the guard-specificity floor's SOURCE scan

**What (code-verified — found at `skills/_shared/war-memory-lint.test.sh`,
`skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-guard-specificity-in-diff.sh`
@ dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26):** `#1081` deliberately shipped
the redaction-lint-as-gate-evidence wrapper as `skills/_shared/war-memory-lint.test.sh` — production
enforcement code, not a test — specifically so the gate's existing `find . -name '*.test.sh'`
self-discovery would pick it up with zero engine change (`resolveGate` untouched). Both merge-path
floors classify purely by filename, unconditionally:

- `assert-test-in-diff.sh`'s `match_sh_suite`/gate-mirror default matches any `*.test.sh` path and
  treats it as satisfying `requiresTest` — union with the gate's own unconditional discovery arm
  means **any** task whose diff touches only this file satisfies `requiresTest` with **zero real
  test content**.
- `assert-guard-specificity-in-diff.sh`'s `is_test_file()` matches the identical pattern, so this
  file's own added lines feed the guard-specificity **COVERAGE** corpus and are **never** scanned as
  a guard **SOURCE** — a new `exit 2`/`die` guard added inside this file can never be stamped
  `uncovered`, no matter how weak its actual test coverage is.

**Why it's not a defect here:** the wrapper's real coverage comes from three meta-tests in
`skills/_shared/war-memory.test.mjs` (spawn against a violating fixture, a clean fixture, and a
missing-target fixture) — genuinely non-vacuous. The gap is a **structural blind spot in the two
generic floors**, not an under-tested guard in this instance. The only fix would be renaming the
vehicle away from `*.test.sh`, which contradicts the whole point of the trick (zero-engine-change
gate discovery) — so it is a deliberately accepted, permanent trade-off for this specific file, not
something to chase.

**Why it's durable/reusable:** any future plan that reaches for the same "ship production code as a
gate-discovered `*.test.sh`" trick inherits both blind spots automatically. Before repeating the
pattern, check: (a) does `requiresTest` on that task now pass without a companion real test — is that
acceptable, or does the task need an explicit `*.test.mjs`/`*.test.sh` sibling anyway? (b) will any
guard added *inside* the vehicle file ever need `assert-guard-specificity-in-diff.sh`'s coverage
check to actually bite — if so, either accept the permanent `uncovered` false-positive (document it,
as this phase did) or put the guard in a sibling non-`*.test.sh` file instead.

## Related

[[audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard]] — a different floor/gate
anti-cheat mechanism, same family of "the floor classifies by shape, not by intent."

> archived 2026-08-15: resolved — moved to archive
