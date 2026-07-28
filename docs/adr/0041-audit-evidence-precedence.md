# Audit evidence is judged by per-claim-shape ladders, never one total order

**Status:** accepted (design ratified 2026-07-28; implemented by the spec and plan below)

WAR has precedence rules for resume state ([ADR 0008](0008-git-is-the-resume-source-of-truth.md):
git > labels > ledger) and for version literals (task instruction > red-team adjudication > plan
body literal), but until this ADR had **none for audit evidence**. A seat judging a claim chooses
among the pinned blob, the mutable working tree, the gate-evidence artifact, the worker's
done-report, git history verbs, threaded run context, and prefetched lessons — with the rules
scattered as prose and never stated as a ladder. Three recorded lessons exist because a seat
trusted the wrong surface (mapped one-to-one in [the precedent-lesson mapping](#precedent-lesson-mapping-spec-102)
below), #1138 measured 52 guard denials across 29 of 31 seats, and the 2026-07-27 campaign close
produced two **Lead**-side evidence errors (a Gate-2 candidate sweep run against the wrong tree; a
dispatch prompt asserting a `deps` fix that was never applied — caught only by the servitor's
verify-on-write). The gap was not missing tactics; it was a missing **decision** about which
surface outranks which, per kind of claim. Full mechanics:
[the design spec](../specs/2026-07-28-audit-evidence-precedence-design.md) §3–§4 and
[the plan](../plans/2026-07-28-audit-evidence-precedence.md).

## Decision

**Audit evidence is judged per claim shape: four closed shapes, each with its own short ladder,
plus universal floor rules that hold for every shape and every bound role. The higher rung rules
the verdict; a cross-rung contradiction is recorded, never silenced. Enforcement is token-anchored
prose guards on tiered copies — the AuditVerdict schema is untouched.**

The resolved design tree:

| # | Decision | Resolution |
|---|----------|------------|
| D1 | One total order vs per-claim-shape | **Per-claim-shape ladders** — four shapes, each with its own short ladder, plus universal floor rules |
| D2 | Shape set open or closed | **Closed + default arm** — unmatched claims are judged under `content-at-pin` (strictest); if unworkable, a SOFT `cannot-confirm`, never a new shape |
| D3 | Conflict semantics | **Rule + record** — the higher rung rules the verdict; a cross-rung contradiction is mandatorily recorded as a `disposition: note` finding naming both rungs |
| D4 | Enforcement | **Token guard, tiered copies** — full ladders on `agents/war-auditor.md`; compact skeleton in the dispatched prompt; token-anchored both-surfaces registry row; AuditVerdict schema untouched |
| D5 | Who is bound | **Widest scope (operator-chosen over the narrower recommendation): all auditor seats incl. reserved passes, the Lead's phase-close/Gate-2 evidence duties, and the servitor** — each pre-existing role discipline cited as that role's instantiation, not restated |

### The four claim shapes and their ladders (spec §4.1)

Shape names are deliberately distinct from lens names — the `execution` shape classifies a claim;
the `execution-evidence` reserved lens judges gate output through it. Conflating the `execution`
shape with the `execution-evidence` lens is the recorded near-collision risk (spec §8); the
CONTEXT.md `_Avoid_` line is the ratified mitigation.

**`content-at-pin`** — "is X present / absent / worded-thus at the judged state."
1. Pinned blob: `git show <audit_sha>:<path>` (or the pinned three-dot diff, recomputed per round).
2. Working-tree Read/Grep — **advisory corroboration only**, never the sole basis (tree may carry
   uncommitted edits; existing doctrine, now ranked).
3. Worker done-report claims about content.

**`execution`** — "did it run / did it pass."
1. Gate-evidence artifact (`_refinery/.war/gate-<taskId>.log`) — the **sole** basis for a HARD
   provably-unrun finding (existing rule, now rung 1).
2. Refiner-reported inline gate result — SOFT (possibly curated).
3. Worker done-report / in-task probe evidence — SOFT, **never a hold**
   (`deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold`).
4. Absent evidence ⇒ SOFT `cannot-confirm`, never a hold.

**`history`** — "when did this change / was it ever removed."
1. Pinned history verbs, verb-per-claim-shape: `git log -S` for occurrence-count change, `-G` for
   content-pattern change, `git show` (not `-S`) for presence-at-tip; `git blame` at the pin.
2. Prose or comments *claiming* history ("measured 50 of 50 at the implementation base") — a claim
   to verify, never evidence
   (`bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands`).

**`authority`** — "what was decided / what version / what is in scope."
1. Task instruction (the dispatched prompt, incl. the threaded adjudication set).
2. Red-team report `## Adjudications` rows.
3. Plan body literal.
4. Roadmap/spec literals (non-authoritative at land time — existing doctrine).

The `authority` ladder generalizes the existing version chain; the version chain is its
`authority` instance.

### Universal floor rules (spec §4.2 — all shapes, all bound roles)

- The working tree and the worker done-report are **never the top rung** of any ladder.
- Prefetched lessons are **never evidence**. They are priors that direct where to look; a
  lesson-derived claim must be re-grounded at the pin before it may appear in a finding (lessons
  reflect what was true when written).
- Conflict rule (D3): the higher rung rules the verdict; the cross-rung contradiction is
  mandatorily recorded as a `disposition: note` finding naming both rungs. Benign forward-advance
  stays benign — the steady-state pin/HEAD mismatch is not a cross-rung contradiction.
- Default arm (D2): unmatched claim → `content-at-pin`; unworkable → SOFT `cannot-confirm`.

### Precedent-lesson mapping (spec §10.2)

The ratified proof that the D1 four-shape split covers the incidents that motivated it: each of
the three precedent lessons named in the spec's context maps to **exactly one** claim shape and to
the surface that shape's ladder forbids as a verdict basis.

- `audit-worktree-pre-impl-tip-stale-verdict` → **`content-at-pin`**. The seat ruled from a stale
  worktree HEAD instead of the pinned blob at `audit_sha`; the ladder forbids the working tree as
  the sole basis for any content verdict (rung 2 — advisory corroboration only; rung 1 is
  `git show <audit_sha>:<path>`).
- `audit-log-finding-can-be-stale-by-land-time` → **`content-at-pin`**. The consumer trusted a
  recorded audit finding's prose as evidence of content at the judged state after the state had
  advanced; the ladder forbids ruling from a prose claim about content when the pinned read is
  available — re-ground at the tip before acting.
- `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` → **`content-at-pin`**. The seat treated
  a Bash-guard denial of shell `grep` as exhausting rung 1 and fell back to lower-rung prose while
  the unrestricted Grep tool still reached the pinned content; the ladder forbids resting a
  content verdict on rung-3 claims while a rung-1 read remains reachable — the default arm's SOFT
  `cannot-confirm` is licensed only when rung 1 is genuinely unworkable.

## Relationship to prior ADRs

- **[ADR 0007](0007-memory-provenance.md) — memory provenance.** The servitor's verify-on-write
  discipline **is** its instantiation of the floor rules (referent found → `code-verified`;
  absent → `agent-unverified` + absence note; an ungroundable Lead-asserted specific claim is
  refused and the discrepancy flagged). Cited, not restated — one cross-reference line on
  `agents/war-servitor.md`, no behavioral change.
- **[ADR 0008](0008-git-is-the-resume-source-of-truth.md) — resume precedence.** Not subsumed:
  resume state keeps its own doctrine (git > labels > ledger); the Lead's `ls-remote` remote-truth
  binding cites it rather than restating it. Resume precedence and audit-evidence precedence are
  sibling doctrines, not one ladder.
- **[ADR 0025](0025-drift-guard-discipline.md) — drift-guard discipline.** The ladder is mirrored
  prose (standing card + dispatched prompt skeleton + Lead/glossary surfaces); every mirror ships
  its token-anchored drift guard in the same task that creates it.

## Considered options

- **One total evidence order (rejected).** Rank inverts by claim: for "is X present at the pin"
  the pinned blob outranks the gate log; for "did the mapped test run" the gate log outranks the
  blob. Any single total order is therefore wrong somewhere — and would be gamed at its top rung.
- **A runtime schema field (rejected).** A per-finding evidence-rung field on AuditVerdict waits
  for a consumer to exist; the ladder is judgment guidance, deliberately schema-free. The
  AuditVerdict schema is byte-unchanged by this ADR.

## Consequences

- Verdicts stand on the right surface per kind of claim, and cross-rung contradictions surface as
  recorded `note` findings — signal, never silence.
- The bound roles are exactly the D5 set — all auditor seats including the reserved
  `execution-evidence` and `pin-validity` passes, the Lead's phase-close/Gate-2 evidence duties,
  and the servitor. Workers and refiners are deliberately not bound.
- Progressive disclosure holds: the full ladders live on the standing auditor card; dispatched
  prompts and Lead/servitor surfaces carry only the token skeleton (the four shape names,
  `never the top rung`, `never evidence`) plus a pointer here.
- The third precedent-lesson mapping is the least clean fit: the ladders (like `history`'s rung 1)
  mostly *prescribe* the ranked surface rather than *forbid* a named one, so
  `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` maps to misuse of the D2 default arm —
  self-demotion off a reachable rung 1 — rather than to a listed forbidden surface; recorded here
  rather than silently dropped.
- If the `execution` shape name confuses against the `execution-evidence` lens in practice,
  renaming the shape is a one-plan token sweep (the guards are token-anchored).

## References

- [Design spec](../specs/2026-07-28-audit-evidence-precedence-design.md) — decisions D1–D5,
  mechanics §4, validation criteria §10.
- [Implementation plan](../plans/2026-07-28-audit-evidence-precedence.md).
- Precedent lessons (by slug, in `docs/learnings/` / the memory roots):
  `audit-worktree-pre-impl-tip-stale-verdict`, `audit-log-finding-can-be-stale-by-land-time`,
  `auditor-grep-tool-unrestricted-by-git-verb-bash-guard`.
