---
name: compound-tap-helper-label-can-superset-match-a-sibling-labels-count-grep
description: "A compound TAP label like a/b is a superset of label a, so a later grep -c for one sub-label can over-count; use a non-superset alias."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: compound-tap-helper-label-can-superset-match-a-sibling-labels-count-grep
  phase: 2026-08-25-authoring-doctrine-and-lint-coherence/phase-2 task 2.2 (correctness lens)
  keywords: 
    - TAP output naming
    - compound label
    - grep -c count guard
    - parameterized test helper
    - substring superset
    - shell test naming fragility
    - ctl helper
    - lacks_doc_i
    - positive control naming
    - future grep collision
  tags: 
    - shell-tests
    - structural-test
    - test-design
    - war-strategy
  created: 2026-09-02
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-03T05:12:24.139Z
---

# A parameterized TAP helper's compound label can be a superset substring of a sibling label a future check greps for

**Rule:** when a parameterized test helper takes a label that later checks discriminate by `grep -c '<label> <suffix>'`, a compound label built by joining two individual labels (`a/b`, `a+b`, `a,b`) is a superset string of either label. A future count check for one label alone can match the compound line too, unless the check's substring happens to require a character (such as a trailing space) the compound form does not produce at that position.

**Instance (still present, harmless today):** in `skills/war-strategy/war-strategy-structure.test.sh`, the `ctl()` helper takes an optional fourth argument naming the positive-control helper a pattern backs and prints `ok - <name> pattern <n> is alive`. Pattern 8's call passes the compound label `lacks_doc_i/lacks_char_i` because `r8` backs both helpers with one assembled regex. That TAP line contains the substring `lacks_char_i pattern`. The existing End-state count greps `'lacks_doc_i pattern'` with a space after the name, so the `/` in the compound label keeps the count correct. A future `grep -c 'lacks_char_i pattern'` check would over-count by pattern 8's two lines.

**Why it happened:** the compound label was a reasonable way to attribute one shared call to both helpers it backs. Nobody anticipated a later maintainer grepping for one helper's name in isolation.

**How to apply:** when adding a compound label to a helper whose labels other checks count by substring, pick a shape that can never be a superset of any individual label already grepped for (a short joint alias like `r8`, or a delimiter absent from every individual label). Cheaper alternative: leave the label and add a comment next to any future count check for an individual sub-label noting that a compound line could inflate the count.

**Locate-cue:** `skills/war-strategy/war-strategy-structure.test.sh`, the `ctl()` helper, pattern 8's `ctl 8 ... lacks_doc_i/lacks_char_i` call, and pattern 9's dedicated `ctl 9 ... lacks_char_i` call.

## Related

[[regex-word-boundary-does-not-stop-at-a-hyphen-use-token-set-compare-for-superstring-tokens]]: the regex-side sibling of the same "superset substring defeats a later discriminator" trap. Here the trap is plain-string label composition, not a word-boundary illusion.
