# Git is the resume source of truth; labels and the ledger are lagging views

**Status:** accepted (design ratified; implementation tracked by the spec below)

WAR advertises a "three-layer resumable source of truth" — GitHub issue labels, `ledger.json`, and the Workflow `resumeFromRunId` journal ([`design.md:58-62`](../../skills/war/references/design.md#L58)) — but the three are written by different actors at different moments, with **no stated precedence** and **no check** that a recorded `merge_sha` is reachable on the branch; the resume sentence ([`SKILL.md:23`](../../skills/war/SKILL.md#L23)) says only "read it + open issues and continue" (agent-architecture audit finding L2, 2026-06-29). A future reader will ask why the `ledger.json` — listed as a "source of truth" — is treated as disposable, and why resume trusts git over the records the Lead actually wrote. This records it. Full mechanics: [the design spec](../specs/2026-06-29-resume-precedence-reconciliation-design.md).

## Decision

**Git is the de-facto source of truth across the resume layers, and that precedence is now stated and acted on.** Three sub-decisions:

1. **A stated precedence: git branch state > GitHub issue labels > `ledger.json`.** Git wins because the refiner's push-first CAS never `--force`es a shared branch ([`SKILL.md:53`](../../skills/war/SKILL.md#L53)), so the integration/working branches are monotonic — a recorded merge is real *iff* its SHA is reachable. Labels beat the ledger because they are remote-durable and human-visible (they survive a local wipe); the ledger is the richest record but the weakest authority — local, uncommitted, written by no code, a **lagging view**.

2. **A resume reconciliation pre-flight (prose, no new code).** Before continuing, the Lead runs a read-only cross-check that repairs the lagging layers *toward git* and halts on an unexplained commit. Three divergence classes: **A** (ledger marks a task merged but its `merge_sha` is unreachable → the merge never landed → trust git, re-queue) and **B** (the branch carries work the ledger never recorded → crash after push → trust git, mark merged) auto-reconcile silently with a report; **C** (a branch commit no ledger task claims → a foreign/concurrent push) **halts** for the Lead — because trusting git is only sound for commits *this run* authored. Class C closes a real blind spot: the `--owned-file` ownership guard is enforced at branch *create*, not at resume.

3. **The journal is off-ladder.** The `resumeFromRunId` journal is an intra-phase replay cache, not a landed-state record. A resumed phase re-runs the gate and the push-first CAS, so a stale cached "merged" is caught at re-land, never trusted — no reconciliation is defined for it.

## Considered options

- **Documentation-only precedence sentence (rejected as too thin).** Just stating "git wins" tells a resuming Lead to trust the branch, but leaves "continue from a stale ledger" as the default action; the active pre-flight converts a wasted re-run (or a silently-absorbed foreign commit) into a deliberate, reported reconciliation.
- **A transactional, code-written `ledger.json` (rejected, YAGNI).** A single code writer + validator would stop the ledger drifting, but it contradicts the architecture — the Lead orchestrates, it does not write code; the ledger is its notebook, not a database — and git's CAS-monotonicity already provides the durability it would buy. Deferred until a real mid-window crash is observed to bite.
- **A tested `verify-resume.sh` gate (rejected for now).** WAR's code-gate idiom (like `validate-*.sh`) applied to resume. Sound, but the only thing that can ever be wrong is a *lagging* record, so the cross-check is a one-time Lead procedure, not a per-run gate — a script is premature until the prose proves insufficient.

## Consequences

- `SKILL.md` and `design.md` §6 state the precedence and tag the ledger a lagging view; `schemas.md` notes `merge_sha` is advisory (authoritative only when reachable on the branch). The "three-layer source of truth" framing is corrected to one authority + two durable/advisory records.
- The reconciliation pre-flight is a **Lead checklist, not enforced code** — its discipline lives in `SKILL.md` prose, with the same erosion risk as any prompt-layer rule. This is accepted deliberately: git's monotonicity is the real safety net; the pre-flight only saves wasted re-work and surfaces the foreign-commit case earlier.
- Repair is **one-way** — records are rewritten toward git; no step mutates git to match a record. A resuming Lead can therefore never corrupt a branch by reconciling.
- Class C halts on *any* unclaimed commit, including benign ones (e.g. a human hotfix pushed onto the integration branch). That false-positive cost is preferred over silently absorbing a concurrent run's work.

## References

- Design spec: [`docs/specs/2026-06-29-resume-precedence-reconciliation-design.md`](../specs/2026-06-29-resume-precedence-reconciliation-design.md) — precedence ladder, the A/B/C pre-flight, surface changes, validation criteria.
- Audit finding **L2** (2026-06-29 agent-architecture audit) — the originating defect.
- [ADR-0003](0003-plan-namespaced-branches.md) / the `--owned-file` ownership ledger — the create-time foreign-ref guard whose resume-time gap Class C closes.
- [ADR-0010](0010-submodule-landing-authority.md) — extends this model to make the submodule remote a co-source-of-truth: git is monotonic there too, so a gitlink SHA is authoritative iff reachable on the submodule remote, and the reconciliation pre-flight extends to verify it.
