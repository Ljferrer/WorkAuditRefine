# The land asserts git ground truth; a `landed` result is never self-reported

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

Every WAR phase ends by merging `integration/<slug>/phase-N` into the working branch with `--no-ff`
and advancing the working ref via a push-first CAS; the Workflow then reads the refiner's
self-reported `MergeResult` (`status`, `working_sha`) to decide `landDecision`. Seven recorded
frictions all trace to one root: **the land trusted the refiner's self-report instead of git ground
truth, and the manual recovery paths were prose the Lead had to remember rather than a verified
operation.** The sharpest is the **phantom land** — when the integration branch is already up to date
with the working tip, `git merge --no-ff integration` produces no merge commit, the push is a no-op
that exits 0, the ls-remote readback passes because origin already holds that sha, and the refiner
returns `status:'landed'` with `working_sha` equal to the *prior* phase's tip, so a stacked dependent
silently builds on a tip that dropped the phase's work. Full mechanics:
[the design spec](../specs/2026-07-08-land-path-integrity-and-status-enum-discipline-design.md) and
[the plan](../plans/2026-07-08-land-path-integrity-and-status-enum-discipline.md).

## Decision

**A WAR phase lands only when git proves the working ref advanced. `land-advance` is the single land
chokepoint every land path routes through; it asserts the advance against git ground truth — the
pre-push origin tip — and holds (never reports success) when it cannot prove the ref moved. No manual
land re-implements a raw push, and no fix here adds a status, `HARD_ESCALATION_REASONS`, or
`KNOWN_LAND_DECISIONS` member.**

### (A) `land-advance` is the single land chokepoint

`provision-worktrees.sh land-advance <working> <merge-sha>` is the one primitive **every** land routes
through — the refiner's in-flow land, the `held:land-failed` auto-recover (both root-cause branches),
and the escalation-completion land. The 2-arg contract is deliberately stable so every caller (the two
Workflow land prompts, the SKILL.md operator prose, the submodule 2A path) is unaffected by the
guard's internals. Consequence: the land-truth guard and the follower CAS reconciliation cover all
lands at once, and there is no second, unverified land path to drift.

### (B) The land-truth guard is anchored on the pre-push origin tip

Immediately before the push, `land-advance` captures the **pre-push origin tip**
(`git ls-remote origin refs/heads/<working>`), checking the readback's exit code: a non-zero rc
(network/remote error) exits 3 — a failed readback **never** collapses into the empty/first-land
reading. It then branches:

- **empty readback** (rc 0, no ref) — a true first land onto a fresh branch: the guard is skipped and
  the existing post-push readback (`actual == new_sha`) still enforces the advance.
- **`<merge-sha>` == pre-push origin tip AND the local follower also sits at it** — a **phantom land**:
  the `--no-ff` merge produced no commit, so origin did not advance. `die` with the phantom-land
  message and **exit 3** (escalate class, never a reland).
- **`<merge-sha>` == pre-push origin tip, follower lags or is absent** — **already landed** (an
  interrupted prior attempt pushed `<merge-sha>` but died before the follower CAS): skip the no-op
  push, reconcile the follower to `<merge-sha>`, **exit 0**.
- **`<merge-sha>` != pre-push origin tip** — the normal path: push, `[rejected]` classification,
  post-push readback, follower CAS. The 0/2/3 exit contract is unchanged.

The anchor is the **origin tip, never the local follower** `refs/heads/<working>`, which lags — the
follower is fast-forwarded toward origin *outside* `land-advance`, in the next phase's
`cmd_ensure_integration`. Anchoring on the origin tip is exactly what lets the manual land paths route
through the primitive: the `held:land-failed` checkout-collision recovery merges in the Lead worktree,
advancing the checked-out follower to `<merge-sha>` *before* `land-advance` runs — a local-tip guard
would false-phantom that.

### (C) Already-landed reconciliation is ADR 0008 repair inside the primitive — with a fail-safe residual

The exit-0 already-landed branch is **[ADR 0008](0008-git-is-the-resume-source-of-truth.md)
reconciliation applied inside the land primitive**: origin is authoritative, so a follower that lags a
sha origin already holds is repaired *toward git* (the record moves, never git). This is what makes an
in-loop re-land idempotent instead of a false phantom, and it is load-bearing for the contender-less
transient retry (D).

**Documented residual (accepted, fail-safe):** the `origin == follower == <merge-sha> ⇒ phantom
(exit 3)` classification also catches the rare **cross-resume already-landed** case — a prior
interrupted land pushed `<merge-sha>`, then `cmd_ensure_integration`'s behind-case fast-forwarded the
follower to it before this land ran. Both collapse to phantom because the follower is advanced
*outside* `land-advance` there. This is deliberate: escalating a benign already-landed is **safe** (the
work is on origin; the now-`land-advance`-routed escalation-completion path resolves it), **rare**
(needs a cross-invocation resume of an interrupted land), and matches the original guard's behavior.
Auto-reconciling it would require phase-base context that breaks the stable 2-arg contract (A) — not
worth it. The load-bearing exit-0 branch remains correct for the in-loop transient recovery (D), where
`cmd_ensure_integration` has not yet run and the follower genuinely lags.

### (D) A contender-less transient is auto-recovered, not surrendered

On final CAS-attempt failure the reland loop fetches and runs
`git rev-list --left-right --count <merge-sha>...origin/<working>` — the merge sha it tried to push vs.
the fresh origin tip, never the lagging local follower. A **right count of 0** (every origin commit is
already in the merge sha ⇒ no contender) buys **exactly one** extra push-first attempt beyond
`roundLimit` exhaustion; a **nonzero** right count is a real divergence and returns `land_stale` at
once. A transient that resolves returns `status:'landed'`, so the **existing** `servitorResult` gate
spawns the wrap-up servitor with no Lead intervention — only a genuine divergence reaches the
`land_stale` → `held:escalation` path. **No new status or enum.** The discrimination is mirrored
byte-parallel in `agents/war-refiner.md` §land-phase and the `workflow-template.js` land prompt.

### (E) Per-mode enum reachability is a drift-guarded test; the comment stays as narration

`HARD_ESCALATION_REASONS` is one array shared by the merge-task and land-phase modes
([ADR 0005](0005-dead-phase-halts-the-dag.md): single-source-of-truth, hand-mirrored, never split per
mode, never grown to satisfy a fix). The land-phase-reachable subset
(`escalate`/`audit-blocked`/`conflict`/`land_stale`/`dep-failed`/`gate-evidence`/`unrunnable-deps`) is
pinned by a **drift-guarded test** against the exported constant and the emitted land-phase prompts;
the test fails if `no-test`/`unpackaged` (merge-task-only) becomes reachable from any land prompt.
**Amendment to the spec's original framing (grill Q7):** the hand-written unreachability comment at the
`.includes(landResult.status)` site is **retained as narration** — the test enforces the invariant
mechanically, the comment keeps it human-readable. The phase-level `landDecision` vs. task-level status
enum separation is likewise pinned by a doc-contract test sourcing both enums fresh from `schemas.md`.

### (F) No manual land bypasses the primitive

Both manual land paths route through `land-advance` on a green gate, retiring their raw-git recipes:

- the **`held:land-failed` auto-recover** branches on root cause — checkout collision (merge in the
  Lead worktree) and absent-origin baseline (empty `ls-remote` ⇒ `ensure-origin`, gated on a
  `merge-base --is-ancestor` trustworthiness predicate so origin is never bootstrapped from an
  untrusted local ref) — both ending in `land-advance`.
- the **escalation-completion land** collapses onto the one-primitive topology every land uses (detach
  `_refinery` at `origin/<working>`, `git merge --no-ff <integration-tip>`, resolved gate, single
  `land-advance <working> <merge-sha>`), with **no** raw `git push`/`update-ref`/`ls-remote`/
  `--force-with-lease` and **no** rebase. The canonical recipe recorded in the memory lesson
  `held-escalation-lead-manual-completion` is updated to match, so the recorded procedure no longer
  contradicts this ADR.

## Relationship to prior ADRs

- **Extends [ADR 0008](0008-git-is-the-resume-source-of-truth.md)** onto the land path — git is the
  source of truth for the land, and the already-landed branch (C) is ADR 0008 repair-toward-git applied
  inside the primitive.
- **Complements [ADR 0004](0004-refinery-merges-in-a-worktree.md)** — the guard adds read-side
  assertions and CAS `update-ref`s only; the non-ff rejection is still the CAS and there is **no** new
  force path (never `--force`/`--force-with-lease` on the land).
- **Complements [ADR 0018](0018-war-working-branch-checkout-guard.md)** — the absent-origin branch
  reuses `ensure-origin` (ADR 0018's working-branch bootstrap), now fired from the mid-run auto-recover
  as well as at Setup.
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — no status,
  `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS` member is added; (E) records that per-mode
  reachability is now a drift-guarded test rather than a comment alone, the shared constant staying
  single-source-of-truth.
- Historical ADRs are superseded, never edited.

## Considered options

- **Assert the advance in the Workflow vs. in the primitive (chosen: the primitive).** A Workflow-side
  check would re-implement the assertion and miss the manual land paths; the guard in `land-advance`
  covers every land at once.
- **Anchor on the pre-push local tip vs. the pre-push origin tip (chosen: origin).** The source spec's
  `pre_push_local` anchor false-phantoms the manual lands, which advance the checked-out follower before
  `land-advance` runs. The origin tip is the ground truth and is what lets all lands share one primitive.
- **A bespoke escalation-completion shell script vs. reusing the primitive (chosen: reuse).** The
  resolved gate is a runtime string a subcommand cannot own, so the escalation completion stays
  Lead-run steps whose one error-prone part (CAS + follower sync + phantom verify) is the single
  verified `land-advance` call.
- **Auto-reconcile the cross-resume already-landed vs. fail-safe escalate (chosen: escalate).** See
  (C): auto-reconciliation would break the stable 2-arg contract for a rare, safe case.
- **Split `HARD_ESCALATION_REASONS` per mode vs. a drift-guarded test (chosen: test).** Splitting breaks
  the mirror and the existing drift-guard (ADR 0005); the test pins per-mode reachability without
  touching the shared constant.
