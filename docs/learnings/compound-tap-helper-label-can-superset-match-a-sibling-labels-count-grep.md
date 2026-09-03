---
name: compound-tap-helper-label-can-superset-match-a-sibling-labels-count-grep
description: "A parameterized TAP helper's compound label text can substring-match a sibling label's future grep-count check"
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

**Found (code-verified — landed tip `abb1f1515977b54fe9153ec178b21153ec04ff4a` on
`dev/2026-08-25-authoring-doctrine-and-lint-coherence`, read via the `_refinery39` worktree,
gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-08-25-authoring-doctrine-and-lint-coherence-2026-09-02-r3/_refinery/`,
`HEAD` byte-equal to the landed tip; `skills/war-strategy/war-strategy-structure.test.sh` lines
708-713):** the `ctl()` helper (line 671) takes an optional fourth argument naming which
positive-control helper a pattern backs, defaulting to `lacks_i`, and prints TAP lines like
`ok - <name> pattern <n> is alive`. Two doctrine-scoped patterns share one assembled regex
(`r8`/`r9` both back the same underlying text), so pattern 8's call passes a **compound** label:

```sh
ctl 8 "$f8a$f8b" "$r8a$r8b" lacks_doc_i/lacks_char_i
```

This prints `ok - lacks_doc_i/lacks_char_i pattern 8 is alive`, which literally **contains** the
substring `lacks_char_i pattern` (the exact substring pattern 9's own dedicated check,
`grep -c 'lacks_char_i pattern'`, would look for). Today this causes no wrong result: the actual
End-state 9 check greps `'lacks_doc_i pattern'` (note the space immediately after the helper
name), and the compound label has `/` there instead of a space, so the count still resolves to
exactly 4 (patterns 6 and 7 only — pattern 8's compound label doesn't match that specific
substring). But a **hypothetical future** check mirroring End state 9's shape for
`lacks_char_i` specifically (`grep -c 'lacks_char_i pattern'`) would over-count by 2 — pattern 8's
two TAP lines plus pattern 9's two — because pattern 8's compound label IS a superset string
containing that exact substring.

**Why it happened:** `ctl()`'s parameterization is correct and one call legitimately suffices
for `r8`, since it backs both `lacks_doc_i` and `lacks_char_i` with the identical assembled
string — the plan's mechanism latitude explicitly sanctioned this shape. The compound label was a
reasonable way to attribute the shared call to both helpers it backs, without anticipating that a
later maintainer might grep for one helper's name in isolation.

**The durable pattern:** when a parameterized test/TAP helper accepts a label argument that is
later used as a `grep -c '<label> <suffix>'` discriminator, a **compound** label built by
concatenating two individual label names (e.g. `a/b`, `a+b`, `a,b`) is a superset string of
either individual label — any future count-based check for one individual label alone risks
matching the compound line too, unless the check's own substring happens to require a character
(like a trailing space) the compound form doesn't produce at that position. This is a close
cousin of [[regex-word-boundary-does-not-stop-at-a-hyphen-use-token-set-compare-for-superstring-tokens]]
(same "superset substring defeats a later discriminator" theme) but the trap here is plain-string
label composition, not a regex word-boundary illusion.

**How to apply:** when adding a compound/combined label to a parameterized test helper that
other checks discriminate by exact substring or `grep -c`, pick a delimiter or shape that can
never itself be a superset of any individual label already grepped for elsewhere in the suite
(e.g. a short joint alias like `r8`, or a delimiter guaranteed absent from every individual
label). Cheaper alternative: leave the compound label as-is and simply note in a comment, next to
any future count check for an individual sub-label, that a compound line could inflate the count.

**Locate-cue (verify still present before acting):** `skills/war-strategy/war-strategy-structure.test.sh`,
`ctl()` at line 671, pattern 8's call at line 710, pattern 9's dedicated call at line 713.

## Related

[[regex-word-boundary-does-not-stop-at-a-hyphen-use-token-set-compare-for-superstring-tokens]] —
the regex-side sibling of this same "superset substring" trap.
