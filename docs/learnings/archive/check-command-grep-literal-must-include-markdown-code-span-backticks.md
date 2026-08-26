---
name: check-command-grep-literal-must-include-markdown-code-span-backticks
description: "A grep -F check literal must include Markdown code-span backticks or the pin is permanently unreachable"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: check-command-grep-literal-must-include-markdown-code-span-backticks
  phase: 2026-08-06-verdict-adjudication-integrity/1.2 (End state 8)
  keywords: 
    - grep -oiF
    - fixed-string literal
    - markdown code span
    - backtick
    - NEW-present check
    - permanently unreachable pin
    - End state check
    - false negative
    - correct content wrong pin
  tags: 
    - war
    - plan-authoring
    - red-team
    - check-command
    - markdown
  created: 2026-08-16
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T08:22:06.912Z
---

# A `grep -oiF` NEW-present literal must include the landed Markdown's code-span backticks, or the pin is permanently unreachable

**Code-verified** at landed tip `10ab150911e7425e16d0944931129593e1410e1` on
`dev/2026-08-06-verdict-adjudication-integrity`, read via the run-scoped `_refinery` worktree
(`<repo-root>/.claude/war-worktrees/2026-08-06-verdict-adjudication-integrity-2026-08-16/_refinery/`).

Plan End state 8 mandated: ADR 0045 attributes the ≤2 per-blocker bound to `/red-team`'s Step 5, never
to ADR 0043. The two NEW-present halves of the `check:` command were authored as:

```
tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -oiF "/red-team's Step 5" | wc -l
tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -oiF "/red-team Step 5's" | wc -l
```

The landed ADR text (confirmed at the pin, `docs/adr/0045-red-team-loop-budget-and-route-upstream.md`
line 29) reads `` the per-blocker bound `/red-team`'s Step 5 already imposed `` — a literal backtick
sits between `` `/red-team` `` and `'s`, because the plan's own D11 wording mandate wraps the tool
name in a Markdown code span. `grep -oiF` treats the pattern as a fixed string; the backtick-free
needle `"/red-team's Step 5"` can never match the backtick-bearing landed text, so the count is 0 at
every measurement — before the fix AND after. This was not a one-off: an earlier pre-launch commit
(`48f1f13`) had already "repaired" one incarnation of this exact defect class in the same End-state row,
and the fix substituted one unreachable fixed-string form for another.

**The content was correct; only the acceptance pin was broken.** The land-barrier endstate-check
artifact (`.war/endstate-1-8.log`) is stamped at the confirmed tip and reports `exit_code: 1` — the
phase's only red End-state row — while independent content-at-pin reading proves the substance is met
(both retired misattribution forms are genuinely absent, and the correct attribution is genuinely
present). Every gate-audit seat this phase correctly read the pinned blob rather than trusting the red
artifact, and routed the defect as a Minor/follow-up on the *check literal*, never a hold on the *ADR
content*.

**How to apply (authoring or reviewing a plan `check:` grep against prose you know will render
Markdown):** whenever a NEW-present literal targets a term that a sibling plan clause (or the
target file's own convention) wraps in backticks — a code identifier, a slash-command name, a flag —
either (a) include the backticks verbatim in the `-F` literal, matching the exact mandated wording
byte-for-byte, or (b) strip backticks from the joined stream before matching
(`tr -d '\`'` ahead of the `grep -oiF`), or (c) split the literal on the markup boundary and match the
prose fragments separately. Re-execute the amended command against the actual landed bytes before
trusting a `≥ 1` pin — do not predict the count from the plan's own quoted wording.

**Related:** [[check-command-literal-dollar-in-grep-pattern-needs-dash-f]] — the sibling gotcha in the
same family (a literal `$` needs `-F` to avoid being read as a BRE anchor); this lesson is the
complementary case where `-F` is already correctly present but the literal itself omits markup the
landed text actually carries.

**Locate-cue (verify still present before acting):**
`docs/adr/0045-red-team-loop-budget-and-route-upstream.md` line 29 (and line 111,
`` `/red-team` Step 5's ≤ 2 re-verify attempts ``); the broken check lives in
`docs/plans/2026-08-06-verdict-adjudication-integrity.md`'s End state 8 (the two `grep -oiF` lines
quoted above) — filed as a Minor follow-up finding at land, not fixed in-phase.

> archived 2026-08-25: resolved — moved to archive
