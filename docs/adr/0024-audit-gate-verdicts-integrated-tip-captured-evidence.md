# Audit/gate verdicts are computed at the integrated tip from captured evidence

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

WAR's auditor/gate layer is the anti-cheat spine — it is what stops a phase from landing
green-by-deletion or on a mis-read tree. Across dozens of recorded runs it has been defeated along two
axes, and every recorded defeat resolved through *hand-run LLM reconstruction* rather than a mechanical
check. **Axis A — the verdict is computed against the wrong tree:** once ≥ 2 tasks land in sequence on
one integration branch the gate-audit `gateHeadSha` pin near-guaranteed mismatches the worktree HEAD
(31+ recurrences of [[gate-audit-pin-bracket-test-blocked-by-git-guard]]), every case a *benign forward
advance* the seat re-proved by hand; a seat pinned mid-phase can read a pre-implementation tip and emit
a false verdict ([[audit-worktree-pre-impl-tip-stale-verdict]]); and when a within-phase Task N
cross-references a sibling Task M's code, N can gate green on its own frozen base while that base lacks
M's code ([[within-phase-dep-gate-must-rerun-on-integrated-tip]]). **Axis B — the verdict accepts weak
evidence:** the *"Do NOT curate or excerpt"* prose clause on the `gate_output`-population sites is a
should-do the refiner may ignore ([[gate-output-curated-excerpt-obscures-mapped-test-evidence]]), and a
gate-audit seat's own `verdict: 'escalate'` was ignored entirely — the hold-land decision keyed on
finding *severity* alone, so a finding-less `escalate` silently landed
([[gate-evidence-severity-not-verdict-gates-hard-path]]). The through-line: **the load-bearing checks
were prose the agent may skip, and the deterministic parts (ancestor proof, tip equality, evidence
capture) were reconstructed per-seat instead of computed once and enforced.** Full mechanics:
[the design spec](../specs/2026-07-08-audit-gate-verdict-fidelity-design.md) and
[the plan](../plans/2026-07-08-audit-gate-verdict-fidelity.md).

## Decision

**Every audit/gate verdict is computed against the integrated tip and gated on captured evidence.
The deterministic parts of the tree-fidelity and evidence proof move out of per-seat prose into Node
checks, a refiner-run shell floor, and a tee'd gate artifact; the remaining LLM judgment narrows to
the parts that genuinely require it. No new status, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS`
member is added.** Three sub-decisions:

### (A) The integrated tip is land-authoritative; per-branch gates are advisory

When a phase carries any intra-phase `deps` edge between same-repo tasks, the authoritative gate is a
single **integrated-tip gate re-run** — `plan.gate` executed once at the final integration tip after the
serial merge queue — whose captured output feeds one authoritative `execution-evidence` seat. Per-branch
(work-wave) gate results are advisory for the dep-crossing tasks: a task that gates green on its frozen
base ([ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md) grants a fast-forwarded base at
dispatch, so within-phase cross-references are legal — which is *exactly* why their authoritative gate
must be the integrated tip, not the per-branch base) is not trusted to have exercised the sibling code
it references until the gate runs where that code is present. A phase with **no** intra-phase deps keeps
today's per-task passes unchanged — no extra re-run, gate-audit prompts byte-identical to before.

### (B) The tree-fidelity proof is mechanical, not per-seat reconstruction

Two independent deterministic checks replace the hand-run `cat-file` → `merge-base --is-ancestor` →
mapped-diff recipe:

- **The benign-advance floor** (`gate-pin-status.sh`, refiner-run) classifies the pin drift once:
  equal SHAs ⇒ `CONFIRMED`; the observed tip descends the pinned gate SHA **and** none of the task's
  own mapped files changed in the intervening range ⇒ **`BENIGN-ADVANCE`** (a *benign forward-advance* —
  treated as pin-CONFIRMED, never a burned round, the intervening file list printed as cited evidence);
  a mapped file changed or not an ancestor ⇒ `STALE-MISMATCH`; a git/ref error or the `(integration_sha
  …)` sentinel ⇒ exit 2 (never collapsed into a status — the caller treats it as a cannot-confirm SOFT).
  The `--mapped` set the pipeline passes is **that task's own changed-file set**, deliberately *not* the
  global gate-discovery set: sibling merges in the serial queue almost always add their own test files,
  so a global default would read every non-final task as `STALE-MISMATCH` and permanently defuse the
  provably-unrun HARD path this doctrine exists to protect. The `execution-evidence` seat consumes the
  stamped `pin_status` token + cited diff; it may spot-verify with a single allowlisted read-only verb,
  but never reconstructs the proof.
- **The pin-equality gate** (pure Node, in the Workflow body) verifies each seat judged the tree it was
  dispatched to review: a seat whose returned `audit_sha` is well-formed and ≠ its dispatched pin (for
  the gate-audit seat, the observed `_refinery` tip; for work-wave seats, the worker/fix-worker
  `head_sha`) has its findings tagged **`pin-mismatch`** and **excluded from the HARD path** — they
  cannot enter `escalated` or block a merge; a SOFT absence-note (task, seat, both SHAs) is recorded.
  Demotion fires only on a well-formed differing pair — an absent or malformed pin on either side is
  today's behavior (fail-open). The two checks are orthogonal: `pin_status` classifies the
  `gateHeadSha`↔`observedHead` relationship, while pin-equality checks seat-vs-observed-tip, so under a
  `BENIGN-ADVANCE` the seat legitimately returns the advanced tip as its `audit_sha` and is **not**
  demoted.

The `pin-mismatch` tag is a **findings tag**, not a memory-provenance tier: it does **not** ride the
`agent-unverified < code-verified < user-confirmed` ladder of
[ADR 0007](0007-memory-provenance.md) (see Relationship, below).

### (C) A finding-less `escalate` is HARD by design; `gate-evidence` stays SOFT-by-default

`isHardGateEvidence` (and the end-state-only seat's `isHard`) fires on `verdict === 'escalate'`
**or** a Critical/Major finding: verdict is a **second, orthogonal HARD trigger** alongside severity
(defence-in-depth — a finding-less `escalate` no longer lands silently, matching the general WAR rule
that any `escalate` halts). This **does not weaken** the default: `gate-evidence` is still SOFT unless a
mapped test is *provably unrun* (the HARD unrun determination is made only against the captured
**gate-evidence artifact** — the tee'd full gate stdout+stderr under `_refinery/.war/gate-<taskId>.log`,
never a possibly-curated inline paste; a missing artifact ⇒ SOFT cannot-confirm, never a hold). The
SOFT-by-default rule still governs Minor/Nit findings, and a `STALE-MISMATCH`/`ERROR`/cannot-confirm
case keeps `verdict` at `approve`/`request_changes` with a SOFT note — never `escalate` (which stays
reserved for plan-wrong/underspecified), so the preserved stale-tip SOFT-defusing rule never flips into
a HARD hold via this trigger.

## Relationship to prior ADRs

- **Cross-references [ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md) (intra-phase
  visibility)** — the dep-wave fast-forwarded base that makes within-phase cross-references legal is the
  reason the integrated-tip gate (A) must be authoritative for dep-crossing tasks.
- **Follows [ADR 0019](0019-target-derived-execution-values.md) (target-derived execution values)** — the
  benign-advance floor's `--mapped` default and the guard-specificity floor mirror `resolveGate`'s
  discovery set (`floor ⊆ gate`), and the "an orthogonal tag routes, the status enum stays untouched"
  vehicle here is the same class/`disposition`-routes-not-status doctrine ADR 0019 states (mirroring the
  [ADR 0013](0013-commanders-intent-and-disposition-routing.md) disposition precedent).
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — (C) reuses the existing
  `gate-evidence` escalation reason for the verdict trigger; **no** new status,
  `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS` member is added, so the hand-mirrored enum and its
  drift guard are byte-unchanged. A one-line header note in `land-decision.mjs` records that
  `gate-evidence` HARD now fires on a provably-unrun mapped test **or** a finding-less
  `verdict === 'escalate'`, so Lead adjudication never misreads the reason as provably-unrun-only.
- **Leaves [ADR 0007](0007-memory-provenance.md)'s provenance ladder untouched** — the pin-equality
  demotion tag (B) is `pin-mismatch`, a findings tag orthogonal to the memory ladder. The source spec
  named it `agent-unverified`; it is renamed here to avoid collision with `war-memory`'s
  `agent-unverified` provenance tier, which is an unrelated concept (how a durable *lesson* was
  established, not how an *audit finding* was scoped). The ladder is neither extended nor consumed by
  this change.
- Historical ADRs are superseded, never edited.

## Considered options

- **Verdict-hard via a new `HARD_ESCALATION_REASONS` member vs. reusing `gate-evidence` (chosen:
  reuse).** A dedicated reason would cascade across both hand-mirrors + the drift guard + four doc
  surfaces (the #236 shared-enum-widening lesson) for no behavioral gain — `gate-evidence` already names
  the gate-audit HARD lane; (C) only adds a second trigger into it.
- **Per-seat hand-run pin proof vs. a refiner-side floor + Node pin-equality (chosen: mechanical).** The
  auditor Bash is fail-closed to a read-only git-verb allowlist and cannot run a helper script, so the
  script-based proof runs refiner-side and is handed to the seat as a token + cited evidence; the
  pin-equality gate independently guards the seat's own tip in pure Node. It is not a fresh trust
  surface — it is the same git the auditor would query, computed once.
- **Naming the demotion tag `agent-unverified` (spec) vs. `pin-mismatch` (chosen: `pin-mismatch`).**
  `agent-unverified` is exclusively a `war-memory` provenance tier in this repo; reusing the string for
  an audit findings tag would collide two unrelated concepts. `pin-mismatch` names the mechanism (the
  seat's `audit_sha` did not match its dispatched pin) and rides no ladder.
- **`--mapped` from the global gate-discovery set vs. the task's own changed-file set (chosen:
  task-own).** A global test-glob default reads every non-final task in the serial queue as
  `STALE-MISMATCH` (siblings add their own test files), permanently defusing the provably-unrun HARD
  path. The task-own first-parent diff set is the only default that keeps `BENIGN-ADVANCE` meaningful.

## References

- Design spec: [`docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md`](../specs/2026-07-08-audit-gate-verdict-fidelity-design.md)
  — the two failure axes, the resolved design tree (D1–D8), and the validation criteria.
- Implementation plan: [`docs/plans/2026-07-08-audit-gate-verdict-fidelity.md`](../plans/2026-07-08-audit-gate-verdict-fidelity.md).
- [ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md) — intra-phase visibility; why the
  integrated tip is authoritative for dep-crossing tasks.
- [ADR 0019](0019-target-derived-execution-values.md) — target-derived values; the `floor ⊆ gate`
  discipline and the orthogonal-tag-routes-not-status doctrine this ADR follows.
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the `disposition` orthogonal-routing
  precedent (findings tags route independently of severity).
- [ADR 0005](0005-dead-phase-halts-the-dag.md) — the enum discipline deliberately left untouched (no new
  status / hard-escalation reason / land decision).
- [ADR 0007](0007-memory-provenance.md) — the memory-provenance ladder the `pin-mismatch` findings tag
  does **not** ride.
- Memory: [[gate-audit-pin-bracket-test-blocked-by-git-guard]], [[audit-worktree-pre-impl-tip-stale-verdict]],
  [[within-phase-dep-gate-must-rerun-on-integrated-tip]], [[gate-output-curated-excerpt-obscures-mapped-test-evidence]],
  [[gate-evidence-severity-not-verdict-gates-hard-path]] — the originating friction cluster.
