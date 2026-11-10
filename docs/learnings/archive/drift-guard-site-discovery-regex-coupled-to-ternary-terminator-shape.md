---
name: drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape
description: "RESOLVED (drift-guard-and-floor-diagnostic-hardening/1.2, #1050): FLOOR_SITE_RE's ternary-false-arm terminator silently dropped differently-shaped future sites — re-anchored on the enclosing template's own closing backtick plus a rawCount parity assert"
metadata:
  type: project
  provenance: code-verified
  slug: drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape
  phase: test-floor-target-repo/1.2
  tags:
    - drift-guard
    - workflow-template
    - test-authoring
    - non-vacuity-floor
    - regex-fragility
  created: 2026-07-23
  keywords:
    - FLOOR_SITE_RE
    - site discovery regex
    - drift guard
    - ternary false-arm
    - non-vacuity floor
    - shape-coupled discovery
    - silent coverage drop
    - matchAll site sweep
    - grep-sweep-is-a-floor
    - workflow-template.test.mjs
    - closing backtick anchor
    - raw count cross-check
---

# A drift-guard's site-discovery regex can be coupled to one code shape, not the invocation itself

**What happened:** `skills/war/assets/workflow-template.test.mjs`'s `FLOOR_SITE_RE` discovered the
dispatched `assert-test-in-diff.sh` floor sites by terminating its lazy capture span on a
ternary-false-arm marker — so a future site written in any other shape (clause inlined, or
composed through a helper) was invisible to the guard while the `>= 3` non-vacuity floor stayed
green. Any `matchAll`-sweep drift-guard inherits this: the *terminator* pattern silently defines
what counts as "a site". Sibling of [[plan-survey-token-sweep-misses-untagged-siblings]], but for
automated regex discovery — the automation gives false confidence precisely because it is silent
on the gap.

**How to apply:** when authoring or reviewing a `matchAll`-based site sweep, (a) terminate on the
invocation's own tokens or enclosing delimiter, not a downstream syntactic marker; or (b)
cross-check the discovered-site count against a raw occurrence count of the invocation literal
alone and fail loud on mismatch — never trust an unconditioned `>= N` floor to catch a
shape-coupled drop.

**RESOLVED (2026-07-25, drift-guard-and-floor-diagnostic-hardening/1.2, #1050):** both fixes
landed (re-locate by grepping `FLOOR_SITE_RE`, never a cached line number): the regex now
terminates on the enclosing `pt` template literal's own closing backtick (a negated-backtick
class), and a `FLOOR_HEAD_RE`-derived `rawCount` is asserted `=== sites.length`, so a future
shape-coupled escape reds the parity instead of riding the `>= 3` floor (floor and per-site token
asserts retained unchanged). Two accepted residuals, documented in the guard's own header comment:
an inline backtick before a site's capture tokens truncates that capture (fail-closed, loud red);
a site whose invocation head diverges from the canonical interpolation escapes both sides of the
equality silently (mitigated only by copy-an-existing-head convention). Keep this lesson live for
the next drift-guard built on the `matchAll`-sweep idiom; this instance is closed.

[[plan-survey-token-sweep-misses-untagged-siblings]]
[[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]

> archived 2026-07-27: resolved — moved to archive
