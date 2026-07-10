# Capture grounds on the committed tip, not the working tree

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

Two recorded frictions show a *capture* step — the servitor recording a learning, an auditor forming a
verify-and-close verdict — trusting a surface that does not match the committed tree, so a fact enters the
record naming code that is not there:

- **[[audit-log-finding-can-be-stale-by-land-time]]** — the audit log is the assembled record across a
  task's audit + fix-round history, so a finding can name a defect a fix round already resolved *before*
  land. Three near-duplicate findings named a tautological IIFE test in `campaign-ledger.test.mjs` that did
  not exist at the landed tip. The servitor's D3 verify-on-write confirms the referent *file* exists — not
  that the specific finding still *matches* — so a stale gotcha entered memory with a file/line that no
  longer described the code.
- **[[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]]** — "already remediated" /
  verify-and-close classifications were formed by grepping the **working tree**. A transient uncommitted
  (later reverted) edit produces a grep hit that lies about the committed tree; v0.8.0 #267 read a `grep`-0
  during an uncommitted window and misclassified a real fix as a no-op. A recurring class with
  [[audit-worktree-pre-impl-tip-stale-verdict]].

The through-line: **a capture verdict was computed against a mutable surface (a persisted log line, a
dirty working tree) instead of the committed tip the fact is supposed to describe.** Full mechanics:
[the design spec](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md) (frictions 4–5,
§4.4/§4.6) and [the plan](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).

## Decision

**Every capture verdict grounds on the committed tip, not a mutable surface.** Concretely:

1. **The servitor's D3 gains a finding-match check for audit-log-sourced facts.** Before recording an
   audit finding as a live gotcha, the servitor re-Grep/Reads the **named construct** — the specific
   defect (e.g. the tautological test), not merely the file — at the landed tip. Construct still matches →
   `code-verified`, keep the file/line locate-cue. Construct no longer matches (fixed in-flight) → record
   only the **generic pattern/rule** at `agent-unverified`, **never** the file/line as a current instance,
   with the note *"audit finding resolved in a fix round before land — recorded as pattern, not live
   instance."* This is the servitor's existing Read/Grep capability, no new tool: it runs *after* land, so
   its working tree **is** the committed tip.
2. **Auditor verify-and-close / already-done no-op claims ground against the pinned `audit_sha`.** The
   blob read is `git show <audit_sha>:<path>` (already in the allowlist — `show`); history-shaped
   questions use `git log -S<token>` / `git log -G<regex>` (already allowlisted — `log`), chosen per claim
   shape (`-S` answers "when did this token count change", not "is the token present at the path"). The
   working-tree grep may run as an advisory pre-check but **must never be the sole basis** for a
   verify-and-close verdict.
3. **The auditor git allowlist is not widened.** `git show <audit_sha>:<path>` covers the blob read and
   `git log -S/-G` covers history search, so `git grep` stays **absent** from `validate-auditor-git.sh`.
   The guard test asserts `git show <sha>:<path>` is accepted and a `git grep` invocation is denied — the
   test is the mechanical record of the deliberate non-widening.

## Relationship to prior ADRs

- **Extends [ADR 0007](0007-memory-provenance.md).** The provenance ladder already forbids recording a
  fact as `code-verified` with a live file/line unless its referent is confirmed; the finding-match check
  sharpens "referent exists" into "the finding still matches", degrading an unmatched finding to the
  generic pattern at `agent-unverified`. It adds no new tier.
- **Pairs with [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md).** The pinned,
  validated `audit_sha` this ADR grounds on is supplied by ADR 0024's pin-to-integrated-tip machinery;
  this cluster **consumes** that SHA, it does not build it (which is why the plan lands after the
  audit-gate-verdict-fidelity plan).
- **Respects [ADR 0002](0002-scope-by-agent-type.md).** The auditor's read-only git allowlist is
  unchanged; the servitor gains no Bash and no new capability — its post-land working tree already reflects
  the committed tip.
- **Rides [ADR 0025](0025-drift-guard-discipline.md).** The servitor finding-match clause and the auditor
  committed-grounding clause are each dispatched-prompt copies of a standing `agents/*.md` directive; a
  both-surfaces drift-guard in `workflow-template.test.mjs` fails if either surface lacks its clause.
- Historical ADRs are superseded, never edited.

## Considered options

- **Widen the auditor allowlist to add a `grep` verb (rejected — deferred).** A read-only `git grep <sha>`
  would be convenient, but `git show <sha>:<path>` + `git log -S` cover the verify-and-close need, and
  widening enlarges the auditor read surface for marginal convenience. Deferred to a future spec if a real
  search-shaped verify-and-close case demands it.
- **Back-fix already-polluted memory (out of scope).** Repairing the existing stale
  `campaign-ledger.test.mjs` finding is a `/lessons-learned` housekeeping pass, not a code change; this
  ADR prevents *new* pollution.
- **One ADR covering both halves of the cluster (rejected — chose two).** The housekeeping-tooling changes
  ([ADR 0028](0028-memory-store-integrity-tool-enforced.md)) and the capture-grounding changes touch
  disjoint subsystems; a reader looking up either should find a scoped record.

## Consequences

- `CONTEXT.md` gains two of the five new terms in this cluster — **Finding-match check** and
  **Committed-tree grounding** (the other three land with [ADR 0028](0028-memory-store-integrity-tool-enforced.md)).
- Re-Grep per audit finding adds bounded Read/Grep calls at capture time (finding count per phase is
  small); no new tool, no Bash — within existing confinement.
- The doctrine ships to marketplace-pinned users via a version bump of the four release slots.
- Named residual: obedience is prompt-enforced — the drift-guard proves both surfaces carry the clause,
  not that a live servitor/auditor honors it; the first landed phase after this and the next VERIFY-shaped
  `/war` task are the declared backstop runners.

## References

- Design spec:
  [`docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md)
  — frictions 4–5, the resolved design tree, and validation criteria 7–8.
- Implementation plan:
  [`docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md`](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).
- [ADR 0007](0007-memory-provenance.md) — the provenance ladder the finding-match check extends
  (`code-verified` → `agent-unverified` degrade for an unmatched finding).
- [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md) — the pin-to-integrated-tip
  machinery supplying the `audit_sha` this ADR grounds verify-and-close on.
- [ADR 0002](0002-scope-by-agent-type.md) — the auditor read-only allowlist and servitor confinement,
  both left unwidened.
- [ADR 0025](0025-drift-guard-discipline.md) — the both-surfaces discipline the servitor and auditor
  clauses ride.
- [ADR 0028](0028-memory-store-integrity-tool-enforced.md) — the housekeeping-tooling half of this cluster.
- Memory lessons (the originating friction cluster):
  [[audit-log-finding-can-be-stale-by-land-time]], [[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]],
  [[audit-worktree-pre-impl-tip-stale-verdict]].
