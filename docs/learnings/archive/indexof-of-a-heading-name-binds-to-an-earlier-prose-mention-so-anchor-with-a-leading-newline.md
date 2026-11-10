---
name: indexof-of-a-heading-name-binds-to-an-earlier-prose-mention-so-anchor-with-a-leading-newline
description: "indexOf('## Heading') binds to the first prose or table mention of that heading; anchor with a leading newline or a /^## Heading/m regex"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: indexof-of-a-heading-name-binds-to-an-earlier-prose-mention-so-anchor-with-a-leading-newline
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.1
  keywords:
    - indexOf heading
    - section slice
    - leading newline anchor
    - multiline regex
    - prose mention
    - README Status heading
    - test region extraction
  tags:
    - testing
    - extraction
  files:
    - skills/war/assets/version-slots.test.mjs
  created: 2026-07-09
---

# `indexOf('## X')` can bind to a prose mention, not the heading

**Rule:** to slice a markdown section in a test, anchor on `'\n## X'` or a multiline regex
(`/^## X/m`), never on a bare `indexOf('## X')`.

**Why:** a heading name quoted earlier in a table or prose makes `indexOf('## X')` return that
earlier offset, so a section-sliced assert reads the wrong region. In `version-slots.test.mjs`, the
README `## Status` extraction first anchored on `readme.indexOf('## Status')`. The first match was
the backtick-quoted reference inside the `## Releasing` table
(`` | `README.md` | the `## Status` line/paragraph | ``), not the heading. It still extracted the
right value only because no bold semver token sat between the table row and the real heading. It
would have silently mis-extracted once the Releasing prose grew such a token.

**How to apply:** the fix anchors on `readme.indexOf('\n## Status')`. The real heading is always
newline-prefixed, and the table's backtick reference never is. Check for this whenever a heading
name is also mentioned in prose elsewhere in the same doc.

Split from [[version-slots-no-cross-slot-consistency-test]].

> archived 2026-07-11: resolved — moved to archive
