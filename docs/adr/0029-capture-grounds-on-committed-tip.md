# Capture grounds on the committed tip, not the working tree

**Status:** accepted; amended 2026-07-22

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

## Amendment (2026-07-22): capture grounds on a threaded landed-tip anchor, not the servitor's own working tree

The original Decision's servitor half rests on the same premise asserted in two different sentences — a
phrasing gap that matters for anyone grepping for it. Decision item 1 argues the D3 finding-match check
"runs *after* land, so its working tree **is** the committed tip," while the
[ADR 0002](0002-scope-by-agent-type.md) relationship bullet restates it in different words: the servitor's
post-land working tree "already **reflects** the committed tip." A grep for the literal string "is the
committed tip" catches the first and misses the second. Both sentences are superseded here — not because
the *decision* changed (capture must still ground on the committed tip, never a mutable surface), but
because the *mechanism* they lean on — "the servitor runs after land, therefore its cwd already sees the
landed tip" — does not hold.

[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] recorded 11 recurrences of exactly this
failure (2026-07-10 → 2026-07-19, across five campaigns) before this amendment landed: the servitor's
threaded cwd is a session-scoped checkout frozen at provision time ([ADR 0001](0001-explicitly-managed-worktrees.md)),
and nothing re-syncs it after land. By the later recurrences the **modal** case at wrap-up time is the main
checkout with **zero live worktrees** — no `.git/worktrees/` entry to read the landed branch from, and in
the most recent shape not even a locally fetched ref for it. "Runs after land" never implied "sees the
landed tip."

**Decision, corrected — the servitor half.** The decision item is unchanged in substance and strengthened
in mechanism: capture still grounds on the committed tip. What changes is how the servitor gets there —
never by trusting its own working tree to already be that tip. The engine now threads a `Landed tip:` line
into the Wrap-up dispatch (the handoff block's existing `tipSha` computation — the landed `working_sha`,
else the last SHA-shaped `gateHeadSha`, else a named placeholder — hoisted above the Wrap-up gate so it is
populated on every landed dispatch). Both prompt surfaces (`agents/war-servitor.md` and the dispatched
Wrap-up prompt in `skills/war/assets/workflow-template.js`) carry one shared four-step grounding ladder
ahead of any D3/finding-match read: (1) cwd preflight — compare the checkout's own HEAD against the
threaded tip and working branch; (2) `gitdir`-matched worktree lookup — enumerate `.git/worktrees/*` and
match by each entry's physical path against this plan's slug, never by bare name (names collide across
concurrent plans); (3) ref check — a resolvable ref with no live worktree is still a dead end for Read,
spend no rounds on it; (4) gate-audit fallback — trust the pinned `auditSha` verdicts (`gateEvidence:true`)
and record anything else `agent-unverified` with the checkout-topology evidence in the absence note, never
asserting a plan/code mismatch from a lagging view. The servitor gains no new capability — still no Bash,
still Read/Grep/Glob only, [ADR 0002](0002-scope-by-agent-type.md) unwidened — it is told which tip to
ground against instead of assuming its own cwd already is that tip.

This amendment supersedes only the two sentences named above; the auditor half of the Decision (items 2–3),
the Considered options, and the rest of this ADR's original body stand as originally ratified and are left
byte-unchanged. Full mechanics: [the design spec](../specs/2026-07-22-servitor-wrapup-landed-tip-design.md)
and [the plan](../plans/2026-07-22-servitor-wrapup-landed-tip.md).
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] carries the full recurrence history and its
own dated mitigation note.
