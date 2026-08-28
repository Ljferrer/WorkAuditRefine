---
name: a-both-ways-proof-can-be-vacuous-twice-over-normalized-extraction-and-a-wrapped-literal
description: "A construct-scoped assert extracted from norm()-joined text silently yields '', and a scratch-deletion proof whose literal wraps across a source line is a no-op — either one turns a both-ways proof into theatre"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: a-both-ways-proof-can-be-vacuous-twice-over-normalized-extraction-and-a-wrapped-literal
  phase: "2026-08-27-in-run-finding-resolution/phase 3 Lead escalation-completion (#1903, commit 5e4880f)"
  keywords:
    - both-ways proof
    - construct-scoped extraction
    - norm collapse
    - non-vacuity guard
    - scratch deletion
    - wrapped literal
    - vacuous assert
    - skill-doc-contracts
---

Two independent ways the same verification came out green while proving nothing — both hit in one
sitting while fixing a drift-guard row (`skill-doc-contracts.test.mjs` D43):

1. **Extraction over normalized text.** The suite's `norm()` maps every line through
   `replace(/^\s*(?:\/\/+|>+|#+)\s?/, '')` and joins with spaces — so headings and newlines do not
   survive it. A section extraction written as `norm(text).match(/## Heading[\s\S]*?(?=\n## |$)/)`
   returns `''`, and the scoped `assert.match('' , /literal/)`… fails loudly only because a
   **non-vacuity guard** (`assert.ok(span.length > 200, …)`) was added in the same edit. Without
   that guard the row would have gone green while asserting over an empty string. **Extract from
   the RAW text, normalize the extracted span.**

2. **A scratch-deletion whose literal wraps.** The both-ways proof deleted
   `the remainder demotes on budget exhaustion` from the target section with a plain string
   replace — but the source wraps it as `budget\n  exhaustion`, so the edit was a **no-op** and the
   suite stayed green. That green was read (briefly) as *confirming* the vacuity being
   investigated. Scratch edits over prose must be **wrap-aware** (`re.sub(r'a\s+b\s+c', …)`), and
   a proof that produces no diff is not a proof — `git diff --stat` the scratch state before
   trusting its result.

Standing rule: a both-ways proof owes two checks of its own — that the scratch edit actually
changed bytes, and that the assert's input is non-empty.
