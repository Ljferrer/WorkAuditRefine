---
name: whole-suite-check-command-non-discriminating-when-its-own-tests-ship-unmerged
description: "An End-state check: command that runs a whole pre-existing test suite is non-discriminating…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: whole-suite-check-command-non-discriminating-when-its-own-tests-ship-unmerged
  phase: "realized-absorb-rate/phase-2 (landed dev/2026-08-19-realized-absorb-rate, merge 7cacd59)"
  keywords: 
    - check command
    - end-state
    - vacuously green
    - whole-suite check
    - non-discriminating
    - presence pin
    - gate-audit
    - ADR 0041
    - untouched tip
    - plan authoring
  tags: 
    - war
    - plan-authoring
    - gate-audit
    - end-state
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T13:50:26.401Z
---

# A plan's End-state check: command that runs a whole pre-existing suite doesn't discriminate feature-present from feature-absent when the suite's own new tests ship in the same commit

**Found (code-verified — landed tip `7cacd59` on `dev/2026-08-19-realized-absorb-rate`, phase 2):**
this phase's post-merge gate-audit seat correctly ruled an End-state condition **UNMET** at an
untouched tip, even though the condition's mapped `check:` command — running the whole pre-existing
test suite — reported green. The suite read green not because the feature was present, but because
the suite itself, including the new assertions meant to exercise the feature, ships in the same
unmerged commit as the feature: at an untouched tip neither the feature nor its own tests exist yet,
so there is nothing for the (absent) new tests to catch, and the rest of the pre-existing suite
passes regardless. The gate-audit's content-at-pin rung beat the naive execution rung here — exactly
[ADR 0041](../docs/adr/0041-audit-evidence-precedence.md)'s evidence-precedence design working as
intended.

**The general class this flags for plan authoring:** a `check:` command that invokes a whole
pre-existing test suite (e.g. `node --test 'skills/**/*.test.mjs'` or similar) is **non-discriminating**
as an End-state acceptance condition whenever that same commit also adds the tests meant to prove the
condition — the suite is green in both the feature-present and feature-absent worlds, so "the suite
passes" carries zero evidential weight for *this specific* condition. The suggested authoring pattern:
pair the whole-suite invocation with a **presence pin** — a `grep -F` (or equivalent) for the new test's
name or file existing — so the check fails outright at an untouched tip (file/test absent) instead of
silently delegating to a suite that cannot yet contain the discriminating assertion.

**Why this matters beyond this one phase:** this is a plan-authoring pattern to apply going forward,
not a defect to fix in already-landed code — any future merged plan whose End-state condition names a
"run the test suite" check without an accompanying presence pin on its own new test/file is exposed to
the same vacuous-pass risk this gate-audit seat correctly caught by content-at-pin evidence rather than
naive execution evidence.

## Locate-cue (verify still present before acting)

`docs/adr/0041-audit-evidence-precedence.md` — the evidence-precedence doctrine this gate-audit
outcome instantiates; confirm still present before citing as backing doctrine.

## Related

[[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — a sibling "green suite ≠
proof for this specific condition" hazard, on the gate-log-threading side rather than the
suite-composition side.
[[grep-c-assertion-count-floor-is-a-fragile-dated-snapshot]] — another End-state check-authoring
fragility class, on count-snapshot brittleness rather than suite non-discrimination.

> archived 2026-08-30: resolved — moved to archive
