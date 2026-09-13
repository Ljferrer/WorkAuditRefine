---
name: mirrored-rules-block-embeds-a-trigger-literal-example-into-every-prompt-not-just-gated-ones
description: "A standing rules block quoting a conditional trigger phrase as prose makes that literal ride every prompt, not only the gated ones"
metadata: 
  promoted: dev/2026-09-11-backward-chain-doctrine@phase-2
  node_type: memory
  type: project
  keywords: 
    - DEPS ALREADY MERGED
    - dep-wave trigger
    - byte-equal mirror
    - standing rules block
    - worker card
    - presence check
    - literal token leak
    - backward-chain
    - self-satisfying trigger
    - discriminator not unique
    - quoted literal ambiguity
    - narrowing symptom not shape
  provenance: code-verified
  slug: mirrored-rules-block-embeds-a-trigger-literal-example-into-every-prompt-not-just-gated-ones
  phase: "2026-09-11-backward-chain-doctrine/phase-2 (task 2.1) +1 recurrence (phase-3 task p3-polish, landed b9e9bfd748e902091e5ef6e336ee2fffc62e9a5b, 2026-09-12 — two more fix attempts narrowed the quoted trigger wording without closing the gap)"
  tags: 
    - engine
    - prompt-surface
    - worker-card
    - drift
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-13T02:55:48.333Z
---

`agents/war-worker.md`'s dep-wave rebase carve-out keys on the literal presence of the string
`DEPS ALREADY MERGED` in the dispatched prompt (that clause is only added by `depClause()` in
`skills/war/assets/workflow-template.js` when the task declares `deps`). Task 2.1 added
`BACKWARD_CHAIN_WORKER_RULES` — a rules block mirrored byte-equal into every `work:` build,
regardless of whether the task has deps — and that block's rule 1 quotes the trigger phrase as an
illustrative example: "When the prompt carries `DEPS ALREADY MERGED`, the rebase is still the first
act...". That means the literal substring `DEPS ALREADY MERGED` now appears in **every** WORK
prompt, dep-less tasks included, even though the actual conditional clause is still correctly
gated. Any future check that tries to detect "does this prompt carry the deps-rebase directive" by
grepping for that literal string, instead of the full clause form (`DEPS ALREADY MERGED: this task
declares deps [...]`), will now always match. This finding was filed as follow-up #2314 rather than
fixed in-run (its absorb attempt regressed on re-audit and was forward-reverted), so the literal
still rides every WORK prompt at land.

Generalizes: when byte-equal-mirroring a standing rules/doctrine block into a dispatched prompt,
never quote another conditional clause's exact trigger token as illustrative prose inside the
mirrored block — paraphrase it, or the token's presence stops being a reliable signal anywhere in
that prompt family.

Locate-cue: verify still present before acting — `BACKWARD_CHAIN_WORKER_RULES` rule 1 and the
`depClause()` helper, both in `skills/war/assets/workflow-template.js`; the dep-wave rebase carve-out
prose lives at `agents/war-worker.md`.

## Recurrence (2026-09-11-backward-chain-doctrine/phase-3 "Release", task `p3-polish`, landed
`b9e9bfd748e902091e5ef6e336ee2fffc62e9a5b` on `dev/2026-09-11-backward-chain-doctrine`,
2026-09-12) — two more fix attempts on the same gap; the literal still rides every WORK prompt

`code-verified` at the landed tip, read via the run-scoped `_refinery` worktree whose `HEAD` equals
this SHA (`<repo-root>/.claude/war-worktrees/16a5695b-f2d2-46ae-801b-2fe413d9f12c/_refinery/`, a
run-UUID-keyed root — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
Recurrence 21). Phase 3's phase-close polish took two more passes at this exact gap: round 1
narrowed rule 1's prose to quote `DEPS ALREADY MERGED:` (colon added, the "prepended dispatch
clause" wording); a later re-audit judged even that narrower quote self-satisfying ("the quoted
literal matches the rules block's own mention, so only the prose words discriminate") and asked
for the fuller phrase `DEPS ALREADY MERGED: this task declares deps` to be quoted instead. At the
landed tip, `skills/war/references/backward-chain-worker.md` rule 1 and its byte-equal mirror
`BACKWARD_CHAIN_WORKER_RULES` (`skills/war/assets/workflow-template.js`) both still read only
"...the prepended `DEPS ALREADY MERGED:` dispatch clause..." — round 1's narrower quote landed,
round 2's fuller-quote suggestion did not. The literal substring `DEPS ALREADY MERGED` (still,
now, always followed by a colon) continues to ride every WORK prompt, dep-less tasks included,
exactly as this lesson's original instance described — three separate fix attempts across two
phases have narrowed the wording without closing the underlying "the mirrored rules block quotes
its own trigger token" shape. Any construct string-matching for the literal token, rather than the
full `depClause()` output, still cannot distinguish "this task has deps" from "this rules block
merely describes the concept."

**Sharper form of the Rule:** narrowing HOW MUCH of a shared trigger literal a mirrored rules
block quotes (adding a colon, adding one more word) treats the symptom, not the shape — the fix
that actually closes this class is paraphrasing the trigger away entirely (never quoting the
literal token verbatim inside descriptive prose), which is what the original entry already
recommended and what two subsequent fix rounds still did not do.
