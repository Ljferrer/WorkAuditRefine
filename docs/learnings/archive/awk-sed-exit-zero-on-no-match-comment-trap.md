---
name: awk-sed-exit-zero-on-no-match-comment-trap
description: "[RESOLVED] awk/sed exit 0 no-match; ||true grep-only"
metadata:
  node_type: memory
  slug: awk-sed-exit-zero-on-no-match-comment-trap
  phase: memory-provenance/p1-t1
  type: project
  tags:
    - shell
    - awk
    - sed
    - grep
    - bash
    - comment-accuracy
    - gate-design
  files:
    - hooks/validate-servitor-provenance.sh
  relates:
    - "[[printf-json-escaping-vacuous-test-case]]"
    - "[[inline-comment-names-wrong-purpose-for-load-bearing-code]]"
  created: 2026-06-29
  originSessionId: memory-provenance-war-servitor
---

# awk/sed exit 0 on no-match; `|| true` comments must name the tool that actually fails

**Rule:** under `set -euo pipefail`, awk and sed exit 0 on no-match (they just emit nothing) —
only grep/fgrep/diff-style stages exit non-zero. In an awk/sed extraction pipeline the
deny-on-absent path is the empty-string `case`/`[ -z ]` guard, not the pipeline exit code;
`|| true` there is defense-in-depth, not load-bearing. A comment claiming otherwise can mislead
a maintainer into removing it (or trusting it) for the wrong stage.

Fixed/landed in `hooks/validate-servitor-provenance.sh`: the extraction-pipeline comment now
names grep as the exception and calls its `|| true` belt-and-suspenders.

**Why:** a comment asserting a causal safety role the code doesn't have invites unsafe edits.
**How to apply:** when writing "this `|| true` is load-bearing", name which specific pipeline
stage exits non-zero on no-match and confirm it does. See
[[inline-comment-names-wrong-purpose-for-load-bearing-code]].
