# Aftermath consults a committed known-stranded allowlist; the deletion bar never lowers

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

`/aftermath` re-derives a fixed set of permanently-stranded remote branches as fresh **needs-human**
rows on *every* run (`aftermath-2026-07-03-stranded-remote-set`, repo). The recorded stranded set —
`integration/pipelineskills/*` + `war/pipelineskills/*`, `integration/memsub/*` + `war/memsub/*`,
`war/compaction/*`, `war/followup444/*`, and two `claude/*` session remotes — is content that **landed
under rewritten SHAs**, so those refs can never pass the remote-deletion bar (tip-reachable +
PR-merged). The bar is correct and must not lower; the noise is pure re-derivation of already-adjudicated
branches. Full mechanics:
[the design spec](../specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md)
and [the plan](../plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md).

## Decision

**A committed allowlist records which remote branches an operator has permanently accepted as stranded,
each evidenced by its landing PR; aftermath routes an allowlist-matched ref to a dedicated
acknowledged-stranded bucket — suppressed from needs-human, never auto-deleted — and the tip-reachable +
PR-merged deletion gate stays byte-untouched.**

### (A) The allowlist is a committed, evidenced file — `docs/aftermath/known-stranded.tsv`

Tab-separated columns `remote_ref`, `landed_pr`, `note`; `#` comment lines and blanks ignored. Committed
(not local) so it is durable, human-reviewed, and shared across machines. **Adding a row requires the
`landed_pr` column populated** — the evidence that the content landed elsewhere under a rewritten SHA —
**or**, for a genuinely PR-less stranded ref (a `claude/*` session remote the record shows has no
per-branch merged PR), `landed_pr` = `-` with a `note` documenting the PR-less reason. Every row is
justified by a PR *or* a documented note, never left blank — the honesty discipline that keeps the
allowlist from becoming a silent deletion license.

### (B) An allowlist match routes to acknowledged-stranded — suppressed, never deleted

`skills/aftermath/SKILL.md` Class-1 remote-branch reasoning: after deriving the candidate set from
`git ls-remote` truth, a candidate whose ref matches an allowlist row **by exact `refs/heads/<ref>`
name — never a substring** (so `war/memsub/p1-task1` never shadows `war/memsub/p1-task10`) is routed to
a new **acknowledged-stranded** report bucket — printed for the record, **excluded from needs-human**,
and **never entering any delete list**.

### (C) The deletion bar is byte-untouched — an allowlist row is an acknowledgement, not a license

The remote-deletion gate (tip-reachable + PR-merged) is unchanged (**C3**). An acknowledged-stranded ref
still fails that gate by construction — the allowlist only *suppresses the re-derivation noise*, it does
**not** make an un-adjudicated branch deletable. A remote ref **not** in the allowlist that fails the
gate still reports as needs-human. Clearing an acknowledged-stranded remote remains a **deliberate
manual `git push origin --delete`** outside aftermath's gates — aftermath never auto-deletes it.

## Relationship to prior ADRs

- **Leaves the aftermath deletion doctrine untouched.** The tip-reachable + PR-merged bar is
  byte-unchanged (C3); this ADR adds a *suppression* bucket for already-adjudicated refs, never a new
  deletion path or a lowered bar.
- **Consistent with [ADR 0002](0002-scope-by-agent-type.md).** The allowlist is consulted by the
  Lead-run aftermath classification; no confined agent gains a `gh`/deletion verb. Aftermath's
  gh-close batch is guarded by the same `gh-preflight.sh`
  ([ADR 0026](0026-github-side-effects-mechanically-gated.md)) — a mid-run account flip never silently
  drops an aftermath close.
- Historical ADRs are superseded, never edited.

## Considered options

- **A committed allowlist vs. a local/uncommitted one (chosen: committed).** The stranded set is a
  durable, human-reviewed fact shared across every machine that runs aftermath; a local file would
  re-derive noise on every other clone.
- **Suppress vs. auto-delete an allowlisted ref (chosen: suppress).** Auto-deleting on an allowlist
  match would lower the evidence bar (C3) — the whole point is that these refs *cannot* pass
  tip-reachable + PR-merged. The allowlist acknowledges; the operator deletes manually.
- **Exact `refs/heads/<ref>` match vs. substring/prefix (chosen: exact).** A substring match would let
  `…/p1-task1` shadow `…/p1-task10`; the exact ref-name match is precise.
- **Require `landed_pr` on every row vs. allow a documented PR-less note (chosen: PR *or* note).** The
  two `claude/*` session remotes have no per-branch merged PR; a genuinely PR-less ref carries
  `landed_pr` = `-` plus a documenting `note`, so the evidence discipline holds without falsifying a PR
  number.

## Consequences

- The recorded stranded set stops appearing as fresh needs-human rows every run — it routes to
  acknowledged-stranded, printed for the record and suppressed from the action list.
- A new committed `docs/aftermath/known-stranded.tsv` (schema + comment header) is the durable,
  reviewed allowlist. **Execution reality:** all recorded refs were manually cleared from origin after
  recording, so at land time the seed resolves against `git ls-remote` to whatever subset still shows
  (possibly none) — the committed file and the consultation mechanism are the deliverable, not a
  non-empty row count.
- The deletion bar is unchanged; a non-allowlisted stranded ref still reports needs-human, and clearing
  an acknowledged ref stays a deliberate manual operator action.
- Named residual: the live suppression behavior (allowlist match → acknowledged-stranded, deletion bar
  unchanged) is Lead-executed prose over live `git ls-remote`/`gh` state with no test asset family for
  the aftermath skill — validated by the first `/aftermath` run after landing plus a `/red-team` prose
  read, a declared backstop, not a mechanical gate.

## References

- Design spec:
  [`docs/specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md`](../specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md)
  — §4.4 (the allowlist + acknowledged-stranded bucket), §10 validation criteria 9–10.
- Implementation plan:
  [`docs/plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md`](../plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md).
- [ADR 0026](0026-github-side-effects-mechanically-gated.md) — the `gh-preflight.sh` that guards
  aftermath's own gh-close batch.
- [ADR 0002](0002-scope-by-agent-type.md) — capability-first confinement (the allowlist is
  Lead-consulted; no confined agent gains a deletion verb).
- Memory lesson (the originating friction): [[aftermath-2026-07-03-stranded-remote-set]].
