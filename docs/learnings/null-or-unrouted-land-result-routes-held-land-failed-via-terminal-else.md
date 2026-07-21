---
name: null-or-unrouted-land-result-routes-held-land-failed-via-terminal-else
description: "A dead/unrouted land dispatch needs one terminal else on the landResult&&-guarded chain, reusing an existing held:* enum member"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: null-or-unrouted-land-result-routes-held-land-failed-via-terminal-else
  phase: "land-failure-recovery/phase-1 (tasks 1.1-1.5, landed dev/2026-07-16-land-failure-recovery)"
  keywords: 
    - landResult null
    - dead land agent
    - terminal else
    - held:land-failed
    - unrouted status
    - transient API error
    - landDecision stays landed
    - workflow-template land routing
    - falls through to landed
    - 529 repro
  tags: 
    - workflow-template
    - land
    - routing
    - engine
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
---

# A land routing chain built entirely of `landResult &&`-guarded `else if` arms silently falls through to the pre-dispatch `'landed'` default on a dead/unrouted dispatch

**What happened (code-verified — found at `skills/war/assets/workflow-template.js`, the LAND
routing chain under the `---- LAND — only when no hard escalation is open ----` banner comment;
verified via the phase's own `_refinery` worktree under `<repo-root>/.claude/worktrees/`, since
the main checkout still lagged the just-landed phase — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]):** `landDecision` is initialized
to `'landed'` *before* the land agent is even dispatched (optimistic default). Every arm that
routes a land outcome is written `else if (landResult && landResult.status === X)`. If the land
dispatch **dies without returning** (a transient API error mid-run — the observed case: a 529
returning 0 tokens, run still finishes `status: 'completed'`), `landResult` stays `null` and
**every** `landResult &&`-guarded arm is skipped — `landDecision` never changes from its
pre-dispatch `'landed'` default. The phase reads as landed, the DAG advances, the epic closes, and
the next phase cuts its integration base from an `origin/<working>` tip that silently lacks this
phase's content. The identical hazard exists for a **non-null but unrouted** status: any land
result whose `status` matches none of the routed values (`submodule-pr`, a `HARD_ESCALATION_REASONS`
member, `gate_failed`, `error`, `landed`) also falls through untouched.

**The fix pattern:** add one **terminal `else`** closing the whole `landResult &&`-guarded chain
that catches both cases — a null `landResult` and a non-null one with an unrecognized `status` —
and routes it to an **existing** `held:*` enum member (here `held:land-failed`, reusing
`land-decision.mjs`'s existing 6-value emitted set — no enum change, no new member anywhere). The
fallback reason string mirrors the codebase's existing `reLand ? reLand.status : 'error'`
ternary idiom (the baseline-proceed re-land's own fallback), so the pattern was already present
one call site over — this terminal else is the same idiom applied to the primary chain:
`reason: landResult ? String(landResult.status || 'error') : 'error'`.

**Partition discipline:** a land dispatch that **throws** is a separate failure class, already
routed by the template's top-level `try/catch` to `held:workflow-error` (HARD, no re-land) —
the terminal else owns *only* the returned-but-unrouted case. The two constructs partition the
failure space with no overlap; state the partition in a code comment at the arm so a future editor
doesn't conflate them.

**Why this is a generic pattern, not a one-off:** any routing chain built as a sequence of
`result && result.field === X` guards has the same latent gap — a null/absent result and an
unrecognized value both silently preserve whatever the routing variable was initialized to,
which is easy to make optimistic (`'landed'`, `'success'`, `'ok'`) precisely because the happy
path is what gets tested first. Audit every such chain for a terminal catch-all before trusting
its default value on the unhappy path.

## Related

[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] — the sibling null-result hazard
in the wave-dispatch loop (a different WAR engine chain, same "an uncaught/absent result must not
silently fall through" family). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] —
the verification technique used to confirm this fix landed despite a lagging main checkout.
[[never-follow-resumefromrunid-hint-after-a-land-failure]] — the companion fix in the same phase
(the recovery-prose half of the same land-failure story).
