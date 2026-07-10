# Memory-store integrity is tool-enforced, not prose-enforced

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

The memory subsystem is files-canonical ([ADR 0015](0015-files-canonical-memory-with-derived-index.md)):
one durable lesson = one Markdown file across a **hot** root and a cold `archive/`, projected into a
generated `MEMORY.md`. Housekeeping (`/lessons-learned`) and per-phase capture (the servitor) both mutate
that store, and three recorded frictions show it losing integrity across those passes — in every case the
invariant that *should* have held was carried in prose, not in a tool:

- **[[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]]** — the retire/merge flow can strip
  a `resolved` lesson that is still a *concept hub*, a vocabulary node siblings cite as "same family
  as …". The 2026-06-30 pass removed two hubs and orphaned ~16 inbound `[[wikilinks]]`. The Phase-3
  hub-link grep lived in `skills/lessons-learned/SKILL.md` only as prose the agent could skip.
- **[[dangling-link-verdict-must-check-archive-before-removal]]** — fan-out verifier agents classified a
  `[[link]]` as "dangling" from a **hot-only** check (`ls <staging>/<slug>.md`), never consulting
  `archive/`. A 2026-07-04 run would have severed 6 of 7 *live cold links* that `safe-swap.sh`'s
  `resolves_in()` already treats as resolved. The central verify tool is archive-aware; the dispatched
  verifier *prompt* was not, and it is the verifier that recommends removal.
- **[[lessons-learned-tooling-traps]]** — `war-memory archive --candidates` read like a query but was a
  *mutation*: `cmdArchive` set `slugs = buildProjection(records).candidates` and archived every one — at a
  render `refuse` verdict, the entire hot set. The only guard was a SKILL gotcha "archive explicit slugs
  only": prose in front of a loaded gun.

The through-line: **every integrity-preserving step was a remembered discipline, not a mechanical one.**
Full mechanics:
[the design spec](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md) (frictions 1–3, §3–§4)
and [the plan](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).

## Decision

**Memory-store integrity moves from remembered discipline into the tooling. Only genuine curation
judgment — which hub to keep, which lesson to compress — stays human.** Concretely:

1. **`war-memory archive --candidates` is non-destructive by default.** `--candidates` alone **lists** the
   ranked candidate set and mutates nothing (a dry-run); mutation requires an explicit second flag
   (`--apply`) or an explicit slug list (`archive <slug>…`, unchanged). The render `refuse`/`warn`
   messages that mention `--candidates` say it *lists*, not that it archives the set.
2. **`archive` emits an inbound-hub count and WARNs on a concept hub.** For each slug about to be archived,
   a hot inbound count ≥2 writes `WARN: archiving concept hub '<slug>' (<n> inbound refs) — its index row
   disappears; consider keep-compress stub` to stderr. The WARN is **advisory and non-blocking (exit 0)**:
   archive is link-safe (cold links resolve), so blocking on inbound count would be a false gate; the WARN
   surfaces the lost hot index row and the decision stays human.
3. **A new `war-memory inbound <slug> [--repo <root>]` subcommand** counts hot inbound `[[slug]]` refs
   across both roots (excluding the slug's own file) and lists the citing slugs — the mechanical form of
   the SKILL Phase-3 grep. Pure read; no `requireLocal`.
4. **The archive-aware `safe-swap verify` is the sole authority on link removal.** `do_verify`'s
   `resolves_in()` already treats `archive/<slug>.md` as resolved for both the index-row hard-fail and the
   dangling-link warn; a `safe-swap.test.sh` case freezes that semantics. Fan-out verifier agents are
   forbidden from recommending removal on a hot-only `ls`; the SKILL verifier prompt states the three-way
   **HOT / COLD / MISSING** trichotomy and routes all dangling/row adjudication through the central check.
5. **Concept hubs are downgraded-to-stub, never dropped.** A hub whose bug-warning value is resolved but
   whose vocabulary-anchor value persists is compressed to a `RESOLVED — kept as concept anchor` stub that
   retains its hot index row, never removed.

## Relationship to prior ADRs

- **Operates within [ADR 0015](0015-files-canonical-memory-with-derived-index.md).** Archive is a file
  move plus a body note, never a deletion; a cold lesson stays queryable and its inbound links resolve.
  This ADR adds **no** delete path — the hub concern is purely the lost *hot index row*, and the true
  orphan (`rm`) case the pipeline no longer performs. Files stay canonical; enforcement lives in
  `war-memory`/`safe-swap` and re-renders, never in a hand-edited `MEMORY.md`.
- **Rides [ADR 0025](0025-drift-guard-discipline.md).** The verifier trichotomy is a prompt clause; where
  it is a dispatched-prompt copy of a standing directive it carries the both-surfaces discipline, and the
  message-reword lands with its OLD-absent guard in the same task.
- **Leaves [ADR 0002](0002-scope-by-agent-type.md) / [ADR 0022](0022-servitor-local-root-writes-gate-2-promotion.md)
  untouched** — no new servitor capability, no Bash; the `inbound` count is a read-only `war-memory` call
  the Lead/operator runs, not a servitor mutation.
- Historical ADRs are superseded, never edited.

## Considered options

- **Block archive on inbound count (rejected — false gate).** Archiving is link-safe (cold links resolve),
  so a hard block on inbound refs would refuse a legitimate archive. The WARN is advisory; a hard block
  belongs only on a true `rm`, which the pipeline does not do.
- **Add an `rm`-blocker or delete verb to `war-memory` (rejected — nothing to guard).** The pipeline
  archives, never deletes; `safe-swap verify`'s archive-aware dangling check already catches a true orphan.
- **A central classification service for the fan-out verifier (rejected — over-built).** The fix is the
  prompt trichotomy plus routing removal decisions through the existing `safe-swap verify`, not a new
  service.

## Consequences

- `CONTEXT.md` gains three of the five new terms in this cluster — **Concept hub**, **Link trichotomy
  (HOT/COLD/MISSING)**, **Non-destructive default (`--candidates`)** (the other two land with
  [ADR 0029](0029-capture-grounds-on-committed-tip.md)).
- Any script or doc invoking `archive --candidates` expecting mutation breaks (intended); the call-site
  sweep updates them. The SKILL already forbids running `--candidates`, so the live corpus should have none.
- The doctrine ships to marketplace-pinned users via a version bump of the four release slots.
- Named residual: a *future* doc re-introducing a mutating `--candidates` example is out of this change's
  reach — the sweep greps the current tree; the drift-guard/`/lessons-learned` posture is the standing
  backstop.

## References

- Design spec:
  [`docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md)
  — frictions 1–3, the resolved design tree, and validation criteria 1–6.
- Implementation plan:
  [`docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md`](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).
- [ADR 0015](0015-files-canonical-memory-with-derived-index.md) — files-canonical memory; archive is a
  move, never a deletion; the derived-projection posture this ADR preserves.
- [ADR 0025](0025-drift-guard-discipline.md) — the both-surfaces and OLD-absent disciplines the verifier
  trichotomy and message reword ride.
- [ADR 0029](0029-capture-grounds-on-committed-tip.md) — the capture-grounding half of this cluster; two
  ADRs because the subsystems (housekeeping tooling vs capture) are disjoint.
- Memory lessons (the originating friction cluster):
  [[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]],
  [[dangling-link-verdict-must-check-archive-before-removal]], [[lessons-learned-tooling-traps]].
