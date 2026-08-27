# Glossary cold home — evicted CONTEXT.md entries

The unbudgeted cold home (ADR 0042: `references/` files carry no byte budget) for evicted
`CONTEXT.md` glossary bodies. Each body below was byte-identical to its pre-eviction `CONTEXT.md`
text **at eviction time** (only repo-root-relative links were re-anchored for this file's depth),
moved under an additive per-term heading — and the glossary keeps the `**Term**:` heading plus
one fixed-shape trigger pointer (`when <trigger>, read skills/war/references/glossary-cold.md`). Prose temperature is branch
frequency (ADR 0042): these are cold but still authoritative — never delete a body; evict more the
same way. **Coldness criterion** (stated per eviction wave): a term qualifies when it names a
retired mechanism, or when it is fully narrated in its own operative home (a `references/` file, an
owning skill's SKILL.md, or its ADR) so the glossary needs only a pointer — incident-only recovery
and one-command forensics entries are the standing example. Bold glossary cross-references inside
the moved bodies (**Empty-orphan reclaim**, **Dead phase**, **Land primitive**) resolve in
`CONTEXT.md`, their original home.

## provision base divergence

The local working-branch ref and `origin/<working>` are **neither equal nor ancestor-related** when
`cmd_ensure_integration` cuts a phase's integration branch. A **fail-loud halt** — the script dies
non-zero carrying both SHAs and the two repair directions, cuts no branch, and the phase never starts —
never a silent pick of one side (ADR 0008: repair toward git). Equal / behind / ahead resolve
automatically (cut at the origin tip when behind, with a guarded follower fast-forward); only true
divergence halts.
_Avoid_: silently picking local or origin; conflating it with a fetch failure / no-origin (which falls
back to today's local cut with a warning).

## Orphan adoption (`record-as-owned`)

Repairing the owned-file ledger *toward git* so a non-empty partial-phase integration branch — real
merged commits left by a held/escalated run whose local state was torn down — becomes a legitimate
resume target. The `record-as-owned` subcommand proves the branch strictly descends the frozen base,
prints its ahead-commits for the Lead to map to merged tasks
([ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md) — an unexplained commit halts), and
appends the ref to the run's owned-file ledger, **moving no ref**. The ADR 0008-conformant opposite of
reclaim-deletion — **Empty-orphan reclaim** *deletes* a branch proven empty; adoption *keeps* one proven
non-empty — and the tooled, proof-carrying form of a recovery relaunch's owned-file continuity.
_Avoid_: resetting or moving the branch (adoption records toward git, never mutates it); conflating it
with empty-orphan reclaim (opposite direction — keep vs delete).

## Stale prior attempt

An unmerged remote `war/<slug>/pN-tK` task branch whose tip is **not an ancestor** of the frozen phase
base's integration tip — left by a prior run whose local state was torn down, so it never merged and
shares only an older base. It blocks the identically-named relaunch push (a non-fast-forward rejection);
at the Provision barrier the fresh-cut stale-remote probe catches it (the `STALE_REMOTE` marker) and
classifies it as a per-task **`env-blocked`** outcome — the worker is never spawned, **siblings
proceed**, never a phase halt. Reconciled only by Lead-sanctioned remote deletion
(`--reclaim-stale-remote`, proof-gated, prints its restore command) or by adopting the remote tip —
**never** a force-push. A remote tip that *is* an ancestor of the frozen tip is already-integrated work
that warns and proceeds, not a stale prior attempt.
_Avoid_: SHA inequality as the test (ancestry is — an already-merged remote is not stale); force-pushing
over it; treating it as a phase halt (it is per-task `env-blocked`).

## Dead-agent land failure

A `held:land-failed` root cause where the `land:phase-<N>` dispatch itself never produced a
trustworthy `MergeResult` — it died (returned `null`; the observed class: a transient API error, 0
tokens, `land-advance` never ran) or returned a status the primary land routing chain's arms do not
recognize. A terminal `else` on that chain, mirroring the baseline-proceed re-land's existing
`reLand ? reLand.status : 'error'` fallback idiom, pushes one escalated `phase-<N>-land` entry
(`reason:'error'`, `detail: landResult` — `null` on a dead dispatch) and sets
`landDecision = 'held:land-failed'`: a **reused** enum member, no `land-decision.mjs` change
([ADR 0005](../../../docs/adr/0005-dead-phase-halts-the-dag.md) enum discipline). Distinct from a **Dead
phase**: the *Workflow itself* completed normally (`status: completed`, `handoff` present) — only its
land *sub-dispatch* produced no usable result. A land dispatch that *throws* instead routes
`held:workflow-error` via the top-level catch; the two constructs partition the failure space.
_Avoid_: conflating with **Dead phase** (there the whole Workflow never completed); treating the
printed `resumeFromRunId` hint as the recovery — it replays the run's journal live, re-running
already-merged `merge:*` agents' gate + push-first CAS, which is exactly wrong when the integration
tip is already complete and green.

## Near-miss diagnostic

The advisory stderr block `assert-test-in-diff.sh` emits on exit 1 when the diff contains test-shaped
files the **active** pattern set does not match — it names the active set and each near-miss path so
the `no-test` route says "your pattern missed these" instead of "add a test". Never affects the exit
code; carried to the add-test worker and the exhaustion escalation as `MergeResult.floor_diagnostic`.
_Avoid_: routing on it (fail-open advisory — absent ⇒ every consumer byte-identical); calling it a
floor failure reason (`no-test` is the reason; this is context on it); conflating the near-miss set
with the active pattern set (the scan is a fixed documented shape list, not the matcher).

## Land-truth guard

The `land-advance` (**Land primitive**) assertion set that makes a `landed` result **provable against
git** rather than self-reported. Immediately before the push it captures the **pre-push origin tip**
(`git ls-remote origin refs/heads/<working>`; a failed readback exits non-zero and never collapses
into the first-land carve-out), and it refuses a **phantom land** (exit 3) when `<merge-sha>` equals
that pre-push origin tip **and** the local follower already sits at it; the post-push readback still
confirms origin advanced to `<merge-sha>`. Immediately before that push — and deliberately *after* the
early-return arms, so already-landed reconciliation stays cwd-independent — it also asserts
`HEAD == <merge-sha>`: the push source is `HEAD:`, so a wrong-cwd invocation dies with the catalogued
`EX_WRONG_BRANCH` (6) naming both SHAs and the expected cwd (normally the detached `_refinery`) rather
than surfacing as a misleading `[rejected]` exit 2 — which is what makes exit 2 mean **only** a real
concurrent advance ([ADR 0023 amendment](../../../docs/adr/0023-land-asserts-git-ground-truth.md)). Where the
pre-push origin-tip capture proves *where* the ref is going, the precheck proves *what* is going there.
Anchored on the **origin tip, never the local follower** (which lags). A `landDecision:'landed'` is
trustworthy only downstream of it — extends
[ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md) onto the land path
([ADR 0023](../../../docs/adr/0023-land-asserts-git-ground-truth.md)).
_Avoid_: anchoring the advance check on the local follower ref (it lags); treating the post-push
readback alone as sufficient (it passes on a phantom, which never advanced origin).

## Route-upstream

The loop-breaker exit: a plan that cannot stop churning in verification is routed back to the
`/war-strategy` interview instead of ground forever. Carried as the typed gate output field
`routeUpstream: boolean` — pure arithmetic over the unstamped subset (the round limit reached with
an unstamped root open, or an unstamped `needsDecision` at rounds ≥ 2) — with the pinned invariant
`routeUpstream: true` ⇒ verdict `BLOCKED` (a stamped-out `ADJUDICATED` run never routes upstream;
an `INCOMPLETE` run re-runs its probes instead of routing). On a route-upstream terminal the report
gains the `## Route upstream` block — the residual questions as the regrill agenda plus the exact
re-entry command — and `/war-campaign`'s step-3 triage halts with `stopPoint:
redteam-route-upstream`, never skip-and-continue (ADR 0011).
_Avoid_: a sixth verdict, a `KNOWN_LAND_DECISIONS` member, or Lead-invented prose (ADR 0043
precedence untouched — the field rides beside the verdict); emitting the field with no rounds
inputs (absent inputs ⇒ absent outputs).

## patch-equivalence probe

The `git cherry <landing-ref> <sha>` check (landing ref first) that tests whether a gate-failing
candidate's patches already landed under a rewritten SHA. Zero `+` lines among ≥1 `-` lines ⇒ every
patch is already in the landing branch by patch-id — **proven equivalent**, the evidence a
tip-reachability gate cannot produce, and grounds for a `known-stranded.tsv` row in the
**acknowledged-stranded** bucket. Any `+` line ⇒ patch-equivalence is **not proven** (squashes and
conflict-resolved rebases legitimately change patch-ids) ⇒ needs-human, no row — never read as
proof of unmerged work. Never a deletion license (ADR 0027 C3).
_Avoid_: treating a zero-`+` result as permission to delete; reading a `+` line as proof of unmerged
work; probing against a stale local landing ref; trusting an empty result (suspect — check argument
order).
