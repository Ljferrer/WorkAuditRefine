---
name: repo-doc-sweep-needs-leader-strip-before-whitespace-normalize-before-grep
description: "A repo-wide doc-cascade sweep for a reworded clause must strip comment leaders (#, //, *, >) BEFORE whitespace-normalizing and grepping — whitespace-normalization alone still misses a clause whose reflow leaves a leader mid-clause; every sweep also needs a paired known-present control so a zero-hit run is provably a broken matcher, not a clean pass"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: repo-doc-sweep-needs-leader-strip-before-whitespace-normalize-before-grep
  phase: "gate-evidence-and-release-integrity plan, red-team rounds 1-3 + operator ruling 2026-07-26 (Commander's Intent Method, phase 1 §4.4 sweep)"
  keywords: 
    - doc cascade sweep
    - repo-wide grep
    - comment leader strip
    - whitespace normalize
    - case-insensitive grep
    - reflowed clause
    - multi-word clause line break
    - control anchor
    - zero-hit false pass
    - sed tr grep pipeline
    - section 4.4 sweep
  tags: 
    - doc-cascade
    - sweep-methodology
    - red-team
    - plan-design
  created: 2026-07-26
  originSessionId: 8e038db9-6931-4633-b7d8-6d7977473ca5
  modified: 2026-07-26T22:56:22.967Z
---

# A doc-cascade sweep needs `leader-strip → whitespace-normalize → case-insensitive grep`, paired with a control anchor

**What (agent-unverified — recorded from the ratified plan's Commander's Intent Method section and
its red-team history, not a committed script; the pipeline is a worker-run shell one-liner, not a
repo file, so there is no code referent to verify):**

A repo-wide sweep hunting for surviving occurrences of a reworded clause (e.g. "this only thing CI
runs") across doc/comment files went through three red-team rounds before landing on:

```
sed -E 's@^[[:space:]]*(#+|//+|\*+|>+)[[:space:]]?@@' <file> | tr -s '[:space:]' ' ' | grep -io '<clause>'
```

Two failure modes had to be closed in order:

1. **Line-scoped grep alone** false-negates the moment a multi-word clause reflows across a line
   break (a hard-wrapped comment or prose paragraph) — the clause is present in the file but never on
   one physical line.
2. **Whitespace-normalization alone does NOT fix (1)** in a comment-bearing file: joining lines
   without first stripping the comment leader leaves the leader **mid-clause** after normalization
   (e.g. `… staleness is the # CAS retry's job …`), so the grep still misses it. The leader strip has
   to run **first**, before the whitespace join, or the join re-introduces exactly the token that
   breaks the match.

**Anti-cheat requirement — pair every sweep with a control:** a sweep that returns zero hits over an
UNAMENDED surface (the clause never reworded) is the sweep's own failure mode, indistinguishable from
"nothing left to find" unless a known-present anchor is grepped in the same pass and asserted
present. A clean PASS with an absent control is a broken matcher, never evidence of a clean sweep.

**Why it's durable/reusable:** any future plan or task that needs to prove a rewording (or a banned
phrase's retirement) propagated across every doc/comment surface in a repo should reach for this
three-stage pipeline plus control-anchor pairing directly, rather than re-discovering the two failure
modes through another red-team cycle. See
[[misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep]] for the sibling case (a
banned two-token *pairing* spanning a comment line break) and
[[backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring]] for the opposite-direction
trap (a retirement grep false-redding on a legitimately-landed substring) — all three belong to the
same "a naive repo grep is not a reliable doc-cascade oracle" family.

## Related

[[plan-survey-token-sweep-misses-untagged-siblings]] — a different sweep-completeness gap (missing
files, not missing matches within a file).
