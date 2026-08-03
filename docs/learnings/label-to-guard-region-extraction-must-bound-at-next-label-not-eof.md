---
name: label-to-guard-region-extraction-must-bound-at-next-label-not-eof
description: "A structural-test helper that extracts a per-arm region as 'from this dispatch label to the first matching guard-branch pattern found anywhere after it' is right-unbounded: an arm with no guard of its own, placed before a guarded sibling arm, silently borrows the sibling's guard and its assignment, reading as symmetric when it is not — bound the search at the NEXT label match (or end-of-text only for the last arm), never at end-of-file unconditionally"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: label-to-guard-region-extraction-must-bound-at-next-label-not-eof
  phase: 2026-08-02-war-engine-and-standing-doc-truth/1.2
  keywords: 
    - region extraction
    - right-unbounded
    - relandSubmodArms
    - SUBMOD_GUARD_RE
    - arm-symmetry pin
    - structural test
    - guard branch
    - label to end-of-file
    - false green
  tags: 
    - testing
    - structural-test
    - pattern
    - blind-spot
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T16:55:18.339Z
---

# A label→guard region extractor that scans to end-of-text can borrow a sibling's guard

**The residual (code-verified at `skills/war/assets/workflow-template.test.mjs`'s D6
arm-symmetry pin — `relandSubmodArms`, `RELAND_LABEL_RE`/`RELAND_LABEL_FLAVOR`, `SUBMOD_GUARD_RE`,
around line 7944-7975, landed tip `8f0d1009d1727e020d830f98debe91df09cd205d`; verify still present
before acting):** the helper slices `after = text.slice(m.index)` from a matched dispatch label to
**end of the whole source**, then takes the **first** guard-branch pattern match anywhere in that
slice as "this arm's guard." For the two live arms this is exact, because each arm's own guard
happens to be the nearest one downstream. But the boundary is never bounded at the **next** label
match. A future arm with **no** guard branch of its own, inserted **before** an existing guarded
arm, silently binds to the *later* arm's guard and is scored `guarded: true` / `assigns: true` —
a false green for exactly the regression class the pin exists to catch (a real 2B PR-and-hold path
falling through to `held:land-failed` and losing the PR ref). This was flagged independently in
both the worker audit and the post-merge gate-audit re-confirmation of the same task, i.e. it is a
structural property of the extractor, not a one-off observation.

**Why it wasn't a hold:** the pin's mandated regression shape — a third arm **mirrored** from a
live one (which by definition copies the guard along with everything else) but missing the
`landResult = reLand` assignment — is genuinely caught, with a standing both-ways proof. The gap is
a guardless-arm shape the plan never enumerated, not a failure of the mandated property.

**Pattern to reuse:** when writing a source-text structural test that extracts a per-instance
region as "label X to the first occurrence of pattern Y after it," and multiple instances of label
X can appear in the same file, bound each region's search window at the **next** label match (or
end-of-text only for whichever instance is textually last) before searching for Y. An unbounded
"scan to EOF, take first match" search silently attributes a downstream sibling's construct to an
upstream instance that has none of its own — the exact blind-spot class
[[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]] targets,
here recurring in the *region-boundary* dimension rather than the token-matching dimension. A
fixture arm carrying no guard at all, inserted before a guarded arm, is the discriminating negative
reference this class of pin needs but frequently lacks.
