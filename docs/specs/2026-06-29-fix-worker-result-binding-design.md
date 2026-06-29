# Bind the fix-worker result — escalate a blocked worker early via a shared `blockedReason` predicate

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding L3), resolved by grilling

The audit/fix loop dispatches a fix-worker fire-and-forget: [`workflow-template.js:291-296`](../../skills/war/assets/workflow-template.js#L291) does `await agent(…FIX_NEEDED…)` and **never binds the result**, then `round++`. The initial-worker call eight lines up ([`:264-266`](../../skills/war/assets/workflow-template.js#L264)) does the opposite — it binds `impl` and `if (!impl || impl.status === 'blocked')` returns `verdict:'escalate'` with the worker's `blocked_reason`. So a fix-worker that finishes `status:'blocked'` ([WORKER_RESULT enum, `:30-34`](../../skills/war/assets/workflow-template.js#L30)) is treated identically to a clean fix: the loop re-audits, the auditors re-flag the still-broken code, and after `roundLimit` rounds the loop falls through to `audit-blocked` ([`:298`](../../skills/war/assets/workflow-template.js#L298)).

**This is not a correctness bug** — there is no silent land and no infinite loop; the loop always terminates at `audit-blocked`. It is a **deferred escalation**: the Lead waits out up to `roundLimit − 1` wasted rounds and receives a generic `audit-blocked` instead of the worker's actual `blocked_reason`. This spec binds the result and escalates a blocked worker immediately, and factors the check into one predicate so the next fix-worker dispatch (M2's no-test fixer) inherits it.

## 1. Grounding (verified on this branch)

- **The fix-worker dispatch is fire-and-forget.** [`:291`](../../skills/war/assets/workflow-template.js#L291) `await agent(…)` with no binding; [`:296`](../../skills/war/assets/workflow-template.js#L296) `round++` unconditionally. The returned `WORKER_RESULT` (which *can* be `{ status:'blocked', blocked_reason }`) is discarded.
- **The initial-worker dispatch is not.** [`:264-265`](../../skills/war/assets/workflow-template.js#L264) is the exact guard to mirror: `if (!impl || impl.status === 'blocked') return { …, verdict:'escalate', blocked: (impl && impl.blocked_reason) || 'worker returned no result' }`.
- **The loop terminates regardless.** A blocked fix leaves the code broken; the next `auditRound` re-flags it; at `round === roundLimit` the `while` exits and [`:298`](../../skills/war/assets/workflow-template.js#L298) sets `audit-blocked`. So the blocked signal is currently **non-load-bearing** — fixing it changes *latency and message quality*, not terminal correctness.
- **The asymmetry is only partly principled.** A blocked *initial* worker yields no SHA to audit (it returns `expected:0`, `seats:[]`); a blocked *fix* worker is post-audit and carries real `seats`. That difference justifies the different *return shape*, **not** discarding the result — binding it is strictly better at both sites.
- **A second dispatch site is imminent.** M2's spec (`2026-06-29-worker-test-floor-design.md` §3.3) adds a no-test fix-worker that, as drafted, would also discard its result. **M2 lands before L3**, so by L3's implementation there are 2–3 worker-spawn sites needing the identical check.

## 2. Decision

1. **Bind the fix result and escalate on block**, mirroring [`:264`](../../skills/war/assets/workflow-template.js#L264): a fix-worker returning `null`/dead or `status:'blocked'` sets `verdict='escalate'`, carries `blocked = <reason>`, and **breaks** the loop immediately (no extra re-audit round, no `round++`). `escalate` is already a `HARD_ESCALATION_REASON`, so the land decision is unchanged (`held:escalation`); the `blocked` field distinguishes it from a round-exhaustion `audit-blocked`.
2. **Factor the check into a shared `blockedReason(result)` predicate**, used at *every* worker-spawn site (initial worker, audit-fix-loop fixer, and M2's no-test fixer when built). Centralizing the "did this worker deliver?" decision means a new dispatch site cannot re-introduce the bug by forgetting the check. It is local loop logic — **not** a mirrored constant — so there is no `land-decision.mjs` drift-guard cascade.
3. **Escalate immediately, not after one more audit.** A worker self-reporting `blocked` means findings remain; re-auditing would only re-confirm them and burn the round this finding is about. The (low) risk of a false-block — a worker that says blocked but actually pushed an approvable fix — costs only a Lead glance, never a wrong land.

**Why `escalate` over a new `fix-blocked` verdict (the more-explicit option, rejected):** a new verdict would add a member to `HARD_ESCALATION_REASONS` — the constant just unified in L1 — forcing a cascade to `land-decision.mjs` + the inline mirror + both drift-guards + new land-decision tests. Disproportionate for a LOW finding; `escalate` + a populated `blocked` field is already unambiguous.

## 3. The shared `blockedReason` predicate

A pure helper beside the existing loop predicates ([`workflow-template.js:148-149`](../../skills/war/assets/workflow-template.js#L148), `allApprove` / `isSplit`):

```js
// → reason string if the worker did not deliver (null/dead or self-reported blocked), else null
const blockedReason = r => !r ? 'worker returned no result'
  : (r.status === 'blocked' ? (r.blocked_reason || 'worker returned no result') : null)
```

Applied at the three sites:

| Site | Before | After |
|---|---|---|
| **Initial worker** ([`:264-265`](../../skills/war/assets/workflow-template.js#L264)) | `if (!impl \|\| impl.status === 'blocked') return { …, blocked: (impl && impl.blocked_reason) \|\| '…' }` | `const why = blockedReason(impl); if (why) return { task, verdict:'escalate', seats:[], expected:0, blocked: why }` |
| **Audit-fix-loop fixer** ([`:291-296`](../../skills/war/assets/workflow-template.js#L291)) — *the bug* | `await agent(…FIX_NEEDED…); round++` | `const fix = await agent(…FIX_NEEDED…); const why = blockedReason(fix); if (why) { verdict = 'escalate'; blocked = why; break } round++` |
| **M2 no-test fixer** (proposed, not yet built) | *(would discard its result)* | same `blockedReason(fix)` → escalate-with-reason; cross-referenced so M2 adopts it |

The loop's outer scope gains `let blocked = null` (alongside `round, verdict, seats, expected` at [`:268`](../../skills/war/assets/workflow-template.js#L268)), and the loop return ([`:299`](../../skills/war/assets/workflow-template.js#L299)) becomes `{ task, verdict, seats, expected, blocked }` — so the reason flows into the `auditLog` entry that already reads `r.blocked` ([`:305`](../../skills/war/assets/workflow-template.js#L305)). The unresolved `seats` are still returned, so the Lead sees both *what* the auditors flagged and *why* the fixer couldn't resolve it.

## 4. Surface changes

| File | Change |
|---|---|
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | Add `blockedReason` beside `allApprove`/`isSplit` (`:148`). Rewrite the initial-worker guard (`:264`) to use it. Bind the fix-worker result (`:291`), check `blockedReason`, escalate-with-`blocked`-and-break before `round++`. Declare `let blocked = null` (`:268`); add `blocked` to the loop return (`:299`). |
| [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) | Add a loop-level test (via the `buildSeqImpl` harness): a fix-worker returning `{ status:'blocked', blocked_reason:'…' }` escalates **on that round** (`verdict:'escalate'`, `blocked` set, `auditLog[].blocked` populated) — **not** after `roundLimit` rounds. Optionally a unit test of `blockedReason` over null / `blocked`(+/− reason) / `implemented`. |
| `CONTEXT.md` | Add the **Worker block** term (§5), disambiguating it from `env-blocked` and `audit-blocked`. |
| [`docs/specs/2026-06-29-worker-test-floor-design.md`](2026-06-29-worker-test-floor-design.md) | Cross-reference note (no edit required to land L3): M2's no-test fix-worker must bind its result via `blockedReason`. Recorded here since **M2 lands first**. |

No ADR (§6). No mirrored-constant cascade.

## 5. New domain term (for CONTEXT.md)

- **Worker block**: a worker — initial *or* fix — returning `status:'blocked'` (or dying / returning null), which **escalates the task immediately** carrying the worker's `blocked_reason`, decided uniformly by the `blockedReason` predicate at every dispatch site. _Avoid_: conflating it with **`env-blocked`** (a provision failure — the worker was never spawned) or **`audit-blocked`** (the audit/fix loop exhausted `roundLimit` without unanimous approve). All three hold the land, but a *worker block* is the worker itself reporting it cannot proceed, with a reason.

## 6. No ADR

This does **not** warrant an ADR. After the change the two worker-dispatch sites are *symmetric* (both bind + check) — the end state is unremarkable, the diff is trivially reversible (one predicate + one branch), and there is no surprising trade-off left for a future reader. The only sub-choice (escalate now vs one more audit) is decided by the finding itself: a blocked worker means findings remain, so an extra round is pure waste. The reasoning is captured here and in the commit message. (Per the domain-modeling ADR bar: not hard-to-reverse, not surprising-in-result.)

## 7. Validation criteria

1. **Blocked fix escalates early.** A fix-worker returning `status:'blocked'` on round *r* < `roundLimit` yields `verdict:'escalate'` with `blocked` set on round *r* — the loop does **not** run further audit rounds.
2. **Reason reaches the Lead.** The escalation's `blocked` field carries the worker's `blocked_reason` (fallback `'worker returned no result'` for a null/dead agent), and it appears in the task's `auditLog` entry.
3. **Predicate is total.** `blockedReason` returns a reason for null and for `status:'blocked'` (with or without `blocked_reason`), and `null` for `status:'implemented'`.
4. **Initial-worker behavior preserved.** The `:264` guard, rewritten to use `blockedReason`, still escalates a blocked/dead initial worker with `expected:0`, `seats:[]`, and the reason.
5. **Land semantics unchanged.** A blocked fix-worker yields `held:escalation` (via the existing `escalate` ∈ `HARD_ESCALATION_REASONS`); no change to `land-decision.mjs` or its drift-guards.
6. **Full gate green.** All `*.test.mjs` + `*.test.sh` runners pass.
