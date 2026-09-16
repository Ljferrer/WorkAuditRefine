---
name: compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator
description: Fixing a closed operator enumeration at its main site can leave a sibling clause still naming the dropped operator
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - closed enumeration
    - compound check
    - short-circuit
    - max exit code
    - shell OR
    - dead mention
    - sibling clause
    - endstate check
    - COMPOUND CHECKS
    - D16
    - PIN-20
    - workflow-template
  slug: compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-10 (task 10.1), landed b5f5a69b5dad11861341b1c9ef82f0cebda4a09b on dev/2026-09-06-engine-and-audit-verdict-integrity"
  tags: 
    - war
    - audit-findings
    - workflow-template
    - endstate-check
    - closed-enumeration
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T17:13:39.241Z
---

# A closed operator enumeration fixed at its main site can leave a sibling clause still naming the dropped operator

**Found (code-verified — landed tip `b5f5a69b5dad11861341b1c9ef82f0cebda4a09b` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the run-scoped `_refinery` worktree
whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

Task 10.1 (endstate attestation states, D16/PIN-20) first landed the `COMPOUND CHECKS` clause in
`skills/war/assets/workflow-template.js` (the `endstate-check` dispatch build) enumerating the
top-level joins a compound `.cmd` check can carry as `` `;` ``, `` `&&` ``, `` `||` `` or a newline,
with the artifact's final `exit_code` set to the maximum of the per-command statuses.

**The defect:** for `A || B` with `A` red and `B` green, the shell exits 0 (the `||` short-circuits
on the first success) but the max-of-statuses rule reads 1 — the artifact records red for a check
that actually passed. Since the gate-audit seats map a red artifact to `unmet`, and an `unmet`
End-state condition holds the land, this is a false `unmet`: the max-of-statuses rule is right for
`;`/`&&`/newline joins (every command must run and any red should count) but wrong for `||`, whose
whole point is that a later success cures an earlier failure.

**The fix, landed:** the current `COMPOUND CHECKS (#1782)` clause enumerates the top-level joins as
only `` `;` ``, `` `&&` `` or a newline — `` `||` `` is dropped from the join enumeration entirely
(confirmed at the landed tip, `skills/war/assets/workflow-template.js`, the `endstate-check`
dispatch build, search "COMPOUND CHECKS (#1782)"). The card mirror on `agents/war-auditor.md`
carries the D16 execution rung too (search `intake_lint`/`cmd_bytes_mismatch` near the card's
execution rung 1).

**The recurrence — a dead mention reopened the same defect from a second site.** The same prompt
paragraph carries a second, separate closed enumeration: the short-circuit note on `cmd[i] exit:
skipped` ("a command the run never reached — short-circuited by `&&`"). The first fix round only
edited the top-level-join list; it left this short-circuit parenthetical still naming `` `||` `` as
well, which invited the opposite reading — that a `||`-joined operand could still be indexed and
skip-recorded as its own top-level command. Three gate-audit seats flagged this on the fix commit
itself; an ace batch deleted the four characters (` \|\| `) and split a card sentence at a
semicolon. A second four-seat panel then approved unanimously with every remaining finding
disposed `note`. **Confirmed at the landed tip: the short-circuit parenthetical now reads
"short-circuited by `` `&&` ``" only — no `` `||` `` anywhere in either enumeration.**

**Still true at the landed tip: no fixture pins either enumeration's exact operator list.**
`skills/war/assets/workflow-template.test.mjs` asserts only `/COMPOUND CHECKS \(#1782\)/` — a loose
label match. Re-adding `` `||` `` to either the top-level-join list or the short-circuit
parenthetical would red nothing in the test suite. Treat this as a live gap, not a closed one.

**Pattern (recurrence of [[source-comment-lags-emitted-prompt-after-rewrite]]'s "closed
enumeration" trap, mirror-image direction):** that lesson's instance was an *addition* not
propagated to a sibling closed-form restatement; this instance is a *removal* not propagated to a
sibling closed-form restatement of the same set. Either direction, the root cause is the same:
one membership fact, stated in prose at more than one site, decays independently at each site. A
one-shot grep for the changed operator's literal character (here, `` `||` ``) across the whole
touched paragraph — not just the line the fix round targeted — would have caught this in the first
fix round instead of needing a second one.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `COMPOUND CHECKS (#1782)` (the `endstate-check` dispatch build, inside the
`ENDSTATE-CHECK DISPATCH` prompt); `skills/war/assets/workflow-template.test.mjs`, search
`COMPOUND CHECKS \\(#1782\\)`; `agents/war-auditor.md`, search `intake_lint` near the card's
execution rung 1.

**Related:** [[source-comment-lags-emitted-prompt-after-rewrite]] (the general closed-enumeration
class); [[audit-panel-unanimity-beats-majority-and-round0-escalation-is-a-known-pre-phase-11-gap]]
(the same task 10.1 incident's audit-process side — why the panel split on this exact defect and
what the escalation meant).
