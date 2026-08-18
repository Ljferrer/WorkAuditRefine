---
name: column-0-bound-regex-does-not-terminate-inside-an-indented-fenced-bullet-block
description: "A construct-anchored extraction bound written as column-0-only (^- |^#|^```|^blank) does not terminate at an indented sibling bullet inside a fenced block — an anchor placed inside such a fence extracts through to the next column-0 heading, silently widening if later additive edits insert more indented bullets in that window"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: column-0-bound-regex-does-not-terminate-inside-an-indented-fenced-bullet-block
  phase: "2026-08-06-war-strategy-mirror-guards/phase-1 task 1.1 (audit findings, landed dev/2026-08-06-war-strategy-mirror-guards 2026-08-17)"
  keywords: 
    - extract_range
    - MEQ_BOUND
    - construct-anchored extraction
    - column-0 bullet
    - indented fence bullet
    - mirror-equality block
    - tag-set projection
    - forward-cascade
    - additive Phase-2 sub-bullet
    - project_tags
    - silent scope widening
  tags: 
    - war-strategy
    - test-authoring
    - guard-design
    - extraction-regex
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-18T05:40:25.153Z
---

# A column-0-only bound regex does not stop at an indented sibling bullet inside a fence

**What happened (code-verified — read at the landed tip `8f72837fda0e505da9200694fd9b69223e90629a`,
via the `_refinery` worktree whose `HEAD` equals that tip, gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-08-06-war-strategy-mirror-guards-2026-08-17/_refinery/`):**
`skills/war-strategy/war-strategy-structure.test.sh`'s `extract_range()` (line 247) and its shared
bound `MEQ_BOUND='^- |^#|^```|^[[:space:]]*$'` (line 257) are used to slice a "tag-set" atom out of
the merged-plan template fence, anchored on `- End state: <numbered list` (line 341). Inside that
fence every bullet is indented 2-4 spaces (`  - Purpose:`, `  - End state:`), so `MEQ_BOUND`'s
column-0 `^- ` arm never matches any of them — the range only terminates on the next **column-0**
construct, which here happens to be `## Build order (for /war)`. The extraction is therefore not
scoped to the End-state slot's three lines; it is scoped to "everything from the anchor to the next
column-0 heading", and it is only a 3-line slot today because nothing else sits between the anchor
and that heading.

**Why it matters:** any future additive edit that inserts more indented bullets into that same
window (a sanctioned, non-deviant edit under this plan's own "Mechanism latitude" clause — see
[[war-machine-parallel-pair-conversion-sanctioned]] for a sibling case of operator-sanctioned
additive latitude) is silently swept into the extraction. If that new prose ever contains one of the
guard's colon-bearing trigger tokens (`check:`, `gate:`, `HARD at audit_sha`, `backstop:`), the
projected keyword sequence changes and the mirror-equality atom reds — pointing at a divergence the
doctrine side of the mirror never caused. Today (Phase 1 of this plan) the window is inert because
nothing else lives in it; the risk is dormant, not live.

**The generalizable rule:** when writing a construct-anchored extraction bound for a fenced/indented
block, a bound written only for the document's outer (column-0) bullet shape does not protect against
sibling growth *inside* the fence. Either (a) scope the anchor's own bound to the indentation level of
the anchor itself (e.g. add a `^[[:space:]]*- ` arm used only for extractions inside such a fence,
keeping the column-0 arm for outer prose bullets), or (b) if the wider window is intentional and safe
today, record *why* (which trigger tokens would break it) so a later editor adding sibling content
knows to keep it token-free rather than rediscovering the risk as a red suite.

## Locate cue

`extract_range()` at `skills/war-strategy/war-strategy-structure.test.sh:247`, `MEQ_BOUND` at line
257, the tag-set anchor call at line 341 — verify still present before acting.

## Related

[[war-machine-parallel-pair-conversion-sanctioned]] (a different sanctioned-additive-latitude case in
this same doctrine family). This plan's own Phase 2 Task 2.1 (`#1431`, additive `Mechanism latitude:`
/ `Binding guardrails:` template sub-bullets) is the concrete edit expected to land inside this exact
window — if it hits the widening, tighten per option (a) above rather than widening `MEQ_BOUND`
globally, which other atoms in the same file rely on staying column-0-scoped.
