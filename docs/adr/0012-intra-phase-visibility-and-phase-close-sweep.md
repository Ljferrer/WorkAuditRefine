# Intra-phase visibility — deps grant a fast-forwarded base at dispatch; referential seams close in a phase-close sweep

**Status:** proposed (design ratified in the 2026-07-02 clean-handoff review; implementation pending — see the spec)

WAR cuts every task worktree at ONE captured integration tip in the refiner's Provision barrier and never
re-pins it — merged sibling content is invisible until the next phase. That was read as a consequence of the
frozen-phase-base doctrine (ADR 0001/0003 lineage: reproducible bases, comparable audits, "dependency ⇒
phase edge"). The v0.9.0 companion-skills run showed the cost: a task that *links to* a sibling's deliverable
(T1's orientation card → T4's README sections) had no correct home — same-phase parallel meant dangling
references at audit time, and a whole extra phase for a doc link is absurd. Meanwhile "add X" + "call X from
Y" always needed two full phase-land cycles even though the wave machinery (`deps` → `nextWave` gating on
merged predecessors) already orders execution correctly — waves order *when* a worker runs, but nothing lets
it *see* what its predecessors merged. This ADR records how visibility is granted without breaking the
frozen base or the resume guarantees. Full mechanics:
[the design spec](../specs/2026-07-02-war-clean-handoff-design.md) §4.4–4.5.

## Decision

**Two mechanisms, matched to two kinds of coupling; the frozen base stays HARD for same-wave parallel tasks.**

1. **Declared dependencies grant visibility at wave dispatch — worker-side, no script change.** When a task
   carries `deps`, its worker prompt begins with `git -C <own worktree> rebase <integrationBranch>`. All
   worktrees share one repo's refs, and the serial merge queue has already advanced the local integration
   ref with the deps' content by the time `nextWave()` releases the task — so on first dispatch (a virgin
   branch with zero commits) the rebase is a pure fast-forward. Doctrine change in `/war-strategy`'s
   code-boundary rule: **dependency ⇒ wave edge** ("add X" + "call X from Y" = one phase, two waves);
   phase edges remain for what must be *landed* first (cross-repo gitlink bumps, release phases).
2. **Seams undeclared at plan time close in a phase-close coherence sweep — declared at audit time by the
   flagging auditor.** Between the post-merge gate-audit pass and the Land decision — only when the phase
   would otherwise land and the `phaseCloseQueue` is non-empty — the refiner cuts a `_polish` worktree at
   the *integrated* tip (existing `ensure-worktree`, new tip argument) and one war-worker fixes ONLY the
   queued findings. A referential seam (an anchor/heading/symbol one merged task defines and another
   references, dangling at the integrated tip) reaches the queue **exclusively** as an auditor-flagged
   `disposition:'absorb'` + `phaseClose:true` finding — audit-time discovery, never ad-hoc sweep-time
   hunting; the bounded scope is what makes discard sufficient. A full auditor panel re-audits the polish
   SHA, and the refiner merges it — or **discards** it, in which case the pre-polish tip lands exactly as
   it would have (fail-open; the ace never-hold invariant extended to phase scope). Discarded queue
   findings re-file as follow-ups.
3. **Never-reset-on-reuse is preserved.** No script-side branch resets exist in either mechanism. A
   resume-with-commits dispatch rebase can conflict — earlier and cheaper than today's merge-time conflict —
   and the worker must return `status:blocked` (existing escalation), never resolve.

## Considered options

- **`repin-worktree` script subcommand / `--fetch-and-rebase` flag (rejected).** Any script-side reset
  breaks the load-bearing never-reset-on-reuse guarantee that protects un-merged commits across resume. The
  worker-prompt rebase achieves identical visibility with zero script diff and degrades safely to `blocked`.
- **Sequencing referential coupling into earlier waves or phases (rejected as the general answer).** Waves
  order *when*, not *what base* — without the dispatch rebase, ordering confers nothing; and a doc link never
  justified a phase edge (a full extra land cycle). With mechanism 1, *declared* referential deps MAY use a
  wave edge; the sweep remains the net for coupling nobody declared (planning and red-team both missed
  T1→T4 in the reference run — you cannot sequence what you did not see).
- **Worker mid-phase self-fetch/rebase for ALL tasks (rejected).** Independent tasks gain nothing and lose
  the reproducible common base that makes parallel audits comparable; per-worker moving bases make the
  three-dot audit diff's merge-base nondeterministic mid-run.
- **No sweep — keep exporting seams as follow-up issues (rejected).** The operator's core critique: auditors
  exist to get gaps addressed before proceeding; littering mechanical seams as issues is deferred work with
  interest.

## Consequences

- **Audit and merge get easier, not harder, for dep-bearing tasks** — the merge-base sits nearer the tip, so
  the three-dot diff is exactly the task's own additions and the merge-time rebase shrinks.
- **The sweep adds at most one worker + one panel round per phase**, and only when something is queued; a
  rejected polish costs a wasted worker, never a bad land, never a hold.
- **Resume semantics preserved by explicit accounting**: the sweep is recorded in the run ledger as a
  task-grade entry (`p<N>-polish`, merge SHA) and its plan-namespaced branch (`war/<slug>/p<N>-polish`)
  registered in the run's owned-refs ledger at `ensure-worktree` time — so reconciliation classes A/B/C map
  the polish commit to a known entry instead of class-C-halting on a foreign commit.
- **Same-wave parallel tasks still require file-disjointness** — nothing here relaxes that; only the
  *between-wave* and *phase-close* seams changed.

## References

- Design spec: [`docs/specs/2026-07-02-war-clean-handoff-design.md`](../specs/2026-07-02-war-clean-handoff-design.md)
  §4.4 (dep-wave visibility), §4.5 (sweep), §10 criteria 4–5.
- [ADR-0001 — Explicitly managed worktrees](0001-explicitly-managed-worktrees.md) and
  [ADR-0003 — Plan-namespaced branches](0003-plan-namespaced-branches.md) — the provisioning lineage this
  amends (frozen-single-tip reading narrowed to same-wave scope).
- [ADR-0013 — Commander's intent and disposition routing](0013-commanders-intent-and-disposition-routing.md)
  — the routing taxonomy that feeds the sweep's `phaseCloseQueue`.
- Memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks` — the up-front-provision
  friction this dispatch-time mechanism sidesteps.
- Reference run: epics #416/#417, follow-up litter #422 — the T1→T4 dangling-link case.
