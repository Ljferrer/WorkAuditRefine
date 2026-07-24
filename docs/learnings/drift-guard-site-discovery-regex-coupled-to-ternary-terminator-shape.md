---
name: drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape
description: "A drift-guard's site-discovery regex anchored on a ternary's `: pt\`` false-arm terminator silently drops a future site written in a different shape"
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
---

# A drift-guard's site-discovery regex can be coupled to one code shape, not the invocation itself

**What happened:** `skills/war/assets/workflow-template.test.mjs` (verify still present before
acting — found at line 2367 @ phase test-floor-target-repo, `FLOOR_SITE_RE`) discovers every
dispatched `assert-test-in-diff.sh` merge-task floor invocation site with:

```
/assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}([^]*?)\n\s*: pt`/g
```

The lazy `([^]*?)` span is terminated by the literal `\n\s*: pt\`` — i.e. it assumes every site
is a ternary's **false arm** starting on its own line. All four live sites at this base match
that shape and the guard is genuinely discriminating today (a worker delete-one-of-four probe
confirmed RED per the audit log). The `>= 3` non-vacuity floor is the right call — never an exact
hardcoded site count (three sibling audit passes across this phase all reconfirmed that ratified
choice).

**The gap:** if a future dispatched floor site is ever written **without** that exact
ternary-false-arm shape — the `: pt\`` clause inlined, or the invocation composed through a
helper (the `gateCaptureClause`/`classificationClause` idiom already used two lines away in the
same file) — the regex does not discover it at all. With N sites already ≥ 3, the `>= 3` floor
stays green while the new, differently-shaped site silently ships with **no** capture
instruction and no guard coverage.

**Why this matters beyond this one file:** any drift-guard built by `matchAll`-sweeping source
for occurrences of an invocation literal, then capturing "the rest of this call site" via a lazy
span, inherits the same risk — the *terminator* pattern silently defines what counts as "a site,"
and a differently-formatted future instance is invisible to the guard rather than loudly failing
it. This is a sibling of the plan-survey-token-sweep pattern (see
[[plan-survey-token-sweep-misses-untagged-siblings]]) but for **automated regex-based** discovery
rather than a manual hand-scan — the automation gives false confidence that "the sweep is
complete" precisely because it is silent on the gap.

**How to apply:** when authoring or reviewing a `matchAll`-based drift-guard site sweep,
(a) prefer terminating on the invocation's own tokens rather than a downstream syntactic marker
(here: bound the span by a fixed character budget after `${testPatternArg}`, or scan forward to
the next site's start, instead of requiring `: pt\``); or (b) cross-check the discovered-site
count against a raw occurrence count of the invocation literal alone, and fail loud on a
mismatch, rather than trusting an unconditioned `>= N` floor to catch a shape-coupled drop.

Not a defect in the current diff (informational, `note` disposition, three separate audit
passes) — recorded so the next drift-guard built on this idiom knows the discovery contract is
shape-coupled, not token-coupled.

[[plan-survey-token-sweep-misses-untagged-siblings]]
[[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
