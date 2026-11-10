---
name: check-command-grep-literal-must-include-markdown-code-span-backticks
description: "A plan check: grep literal must match the landed bytes (-F for $, include code-span backticks), and must be re-run against the landed text"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
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
    - grep -F
    - literal dollar sign
    - mid-pattern anchor
    - grep shim
    - BRE anchor
  tags: 
    - war
    - plan-authoring
    - red-team
    - check-command
    - markdown
    - shell
  created: 2026-08-16
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T08:22:06.912Z
---

# A `grep -oiF` NEW-present literal must include the landed Markdown's code-span backticks, or the pin is permanently unreachable

Plan End state 8 mandated: ADR 0045 attributes the ≤2 per-blocker bound to `/red-team`'s Step 5, never
to ADR 0043. The two NEW-present halves of the `check:` command were authored as:

```
tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -oiF "/red-team's Step 5" | wc -l
tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -oiF "/red-team Step 5's" | wc -l
```

The landed ADR text reads `` the per-blocker bound `/red-team`'s Step 5 already imposed `` — a literal
backtick sits between `` `/red-team` `` and `'s`, because the plan's own wording mandate wraps the tool
name in a Markdown code span. `grep -oiF` treats the pattern as a fixed string; the backtick-free
needle `"/red-team's Step 5"` can never match the backtick-bearing landed text, so the count is 0 at
every measurement — before the fix AND after. An earlier pre-launch "repair" of this same row had
substituted one unreachable fixed-string form for another.

**The content was correct; only the acceptance pin was broken.** The End-state check artifact reported
`exit_code: 1`, while reading the content at the pin proved the substance met. Every gate-audit seat
correctly read the pinned blob rather than trusting the red artifact, and routed the defect as a
Minor/follow-up on the *check literal*, never a hold on the *ADR content*.

**How to apply (authoring or reviewing a plan `check:` grep):**
- **Code spans:** whenever a NEW-present literal targets a term that a sibling plan clause (or the
  target file's own convention) wraps in backticks — a code identifier, a slash-command name, a flag —
  either (a) include the backticks verbatim in the `-F` literal, matching the exact mandated wording
  byte-for-byte, or (b) strip backticks from the joined stream before matching
  (`tr -d '\`'` ahead of the `grep -oiF`), or (c) split the literal on the markup boundary and match the
  prose fragments separately.
- **Literal `$`:** a check literal that contains a shell-variable-looking token (`$foo`, `"$foo"`,
  `${foo}`) must use `grep -F` (or `-Fn`/`-Fc`). `/red-team` measured the `grep` shim in scope reading an
  unescaped mid-pattern `$` as an anchor and returning no match against a correctly landed line
  (`grep -nF -- '-s "$baseline_file"' skills/red-team/assets/assert-no-repo-escape.sh` needs the `-F`).
  Without `-F`, the check can read a met End state as unmet. Treat a missing `-F` on such a pattern as a
  potential false "unmet", not a style nit.
- Re-execute the amended command against the actual landed bytes before trusting a `≥ 1` pin — do not
  predict the count from the plan's own quoted wording.

**Related:** [[template-defers-runtime-values-to-agent-via-literal-placeholder]] (a different `$`
hazard on the emitter side).

**Locate-cue (verify still present before acting):**
`docs/adr/0045-red-team-loop-budget-and-route-upstream.md` (the `` `/red-team`'s Step 5 `` and
`` `/red-team` Step 5's ≤ 2 re-verify attempts `` sentences); the broken check lives in
`docs/plans/2026-08-06-verdict-adjudication-integrity.md`'s End state 8 — filed as a Minor follow-up
finding at land, not fixed in-phase.

> archived 2026-08-25: resolved — moved to archive
