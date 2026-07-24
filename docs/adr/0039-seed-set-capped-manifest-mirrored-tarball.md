# The seed set is a capped, manifest-mirrored tarball

**Status:** accepted (design ratified 2026-07-22; implementation tracked by the spec and plan below)

WAR's memory subsystem is files-canonical for both per-repo roots — one durable lesson, one Markdown
file, browsable and diffable in place ([ADR 0015](0015-files-canonical-memory-with-derived-index.md)).
The portable seed corpus (29 lessons scrubbed from `Ljferrer/war-game`, the initial content for
`/lessons-learned seed`) needed a distribution shape before any of that could ship, and the operator's
pivotal constraint (spec §2 decision 1) broke from the files-canonical convention on purpose: ship it as
`docs/seed/seed.tar.gz`, "so they don't get lugged around as an open directory full of markdown files" —
one versioned, plugin-cached blob, not 29-plus loose files in the tree. A bare blob is unreviewable and
undedupable, so the design pairs it with a committed `docs/seed/seed-manifest.json` mirroring the
tarball's contents (per-member slug, bytes, sha256, description, type, provenance) and routes every
consumer — the `seed` verb's collision scan, the corpus contract test, nomination and ingestion dedup —
through the manifest, never through unpacking the blob. Full mechanics:
[the design spec](../specs/2026-07-22-lessons-learned-seed-design.md) §2 decision 1, §3, §4, §7, and
[the plan](../plans/2026-07-22-lessons-learned-seed.md) Task 1.1 (`seed-pack.mjs` pack/verify/evict),
Task 1.2 (the committed corpus + contract test), Task 2.3 (this ADR).

This qualifies for a record on all three counts. **Hard to reverse:** the seed verb's collision scan, the
corpus contract test, and the nomination/ingestion dedup path all read this exact tarball+manifest
shape — unwinding it later means rewriting every consumer, not just one. **Surprising without context:**
a binary blob committed to git breaks the repo's own files-canonical memory convention (ADR 0015), and a
future reader who knows that convention will wonder why the seed set doesn't follow it; the manifest is
the reason the break is safe. **Real trade-off:** a loose directory of Markdown files stays natively
reviewable but is exactly the unwieldy lugging the operator rejected, while the tarball-plus-manifest
pairing buys back reviewability at the cost of a second surface (the manifest) that must be kept in
equality with the first — a cost `seed-pack.mjs verify`'s contents-level check exists specifically to
hold to zero.

## Decision

**The seed set ships as one compressed tarball (`docs/seed/seed.tar.gz`) whose reviewable surface is a
committed, equality-guarded manifest (`docs/seed/seed-manifest.json`) — never the unpacked files, and
never a byte-level hash of the archive itself.**

1. **The tarball is the distribution artifact; the manifest is the review artifact.** `seed.tar.gz` is
   what `/lessons-learned seed` unpacks at warm-seed time; `seed-manifest.json` — one file, `seed` and
   `archive` arrays, members sorted by slug — is what a human or a dedup check reads instead. A PR
   touching the seed set is reviewed by diffing the manifest, not by extracting the blob.
2. **Equality is contents-level, never gzip-byte-level.** `seed-pack.mjs verify` unpacks to a temp
   directory and asserts the manifest's member set, per-member bytes, and sha256 match the unpacked
   contents. Gzip compression is nondeterministic, so two packs of an identical corpus can produce
   different tarball bytes with no real drift; hashing the archive itself would make that a false
   positive. `skills/lessons-learned/seed-set.test.mjs` runs this same check against the committed pair
   as a standing corpus contract, discovered by the repo's `node --test 'skills/**/*.test.mjs'` gate.
3. **The manifest is the single source for every downstream reader.** Nomination dedup, ingestion dedup,
   and `evict`'s archive-cap arithmetic all read the manifest's `seed`/`archive` arrays — never by
   unpacking `archive.tar.gz` to recompute. One authoritative mirror, not several ad hoc re-derivations.
4. **The duplication is deliberate, and it is what the drift guard is for.** The manifest restates facts
   the tarball already contains; that restatement is what makes the blob reviewable without extraction,
   at the cost of a drift surface — `verify` is the mechanical guard that holds the two in equality.

## Considered options

- **A directory of loose Markdown files, no tarball (rejected).** Natively reviewable and consistent
  with the repo's own files-canonical convention (ADR 0015), but exactly the "lugged around as an open
  directory full of markdown files" shape the operator rejected for a versioned, plugin-shipped asset.
- **Tarball with no manifest, review by unpacking (rejected).** Restores the directory-of-files problem
  one `tar -xzf` away, and leaves nomination/ingestion dedup with no structured surface to query — every
  consumer would have to unpack first.
- **Manifest equality at the gzip-byte level (rejected).** Gzip is nondeterministic across runs and
  platforms; hashing the archive bytes would flag a false drift on every re-pack of an unchanged corpus.
  Contents-level equality (member set + per-member bytes + sha256) is the guarantee the design actually
  needs.
- **Two manifests, one per tier, instead of one (rejected).** A single `seed-manifest.json` with `seed`
  and `archive` arrays keeps one source for consumers that must check both tiers (nomination exclusion
  checks both); two files would double the drift surface for no benefit.

## Consequences

- `seed-pack.mjs` (plan Task 1.1) becomes the sole tool permitted to write `seed.tar.gz` /
  `seed-manifest.json`, and only in lock-step; a hand-edit of one without the other is exactly the drift
  `verify` exists to catch.
- No test anywhere may assert the tarball's raw bytes or its gzip hash — an auditor finding no byte-hash
  of `seed.tar.gz` is confirming this design, not catching a gap (spec §8, plan Notes).
- The manifest is load-bearing beyond review: nomination dedup, ingestion dedup, and `evict`'s cap
  arithmetic all read it as the single source of truth, so a manifest bug is a dedup/cap bug, not merely
  a display bug.
- `docs/seed/archive/` may ship with no committed `archive.tar.gz` until the first eviction; `verify`
  treats an absent archive as a zero-member tier, so the pairing discipline binds from the first
  eviction onward, not before.
- The seed set is a **named exception** to the repo's files-canonical memory convention, not a
  replacement for it — [ADR 0015](0015-files-canonical-memory-with-derived-index.md) is untouched, and
  both per-repo memory roots stay loose Markdown files.

## References

- Design spec: [`docs/specs/2026-07-22-lessons-learned-seed-design.md`](../specs/2026-07-22-lessons-learned-seed-design.md)
  — §2 decision 1 (distribution is a tarball), §3 (resolved design tree — compression, manifest,
  equality axis), §4 (`seed-pack.mjs` mechanics), §7 (this ADR), §10 criterion 1 (manifest equality).
- Implementation plan: [`docs/plans/2026-07-22-lessons-learned-seed.md`](../plans/2026-07-22-lessons-learned-seed.md)
  — Task 1.1 (`seed-pack.mjs` pack/verify/evict), Task 1.2 (the committed corpus + `seed-set.test.mjs`
  contract), Task 2.3 (this ADR + the CONTEXT.md terms).
- [ADR 0015](0015-files-canonical-memory-with-derived-index.md) — files-canonical memory with a derived
  index; the convention this ADR deliberately departs from for the portable corpus, and stays untouched
  for both per-repo roots.
- [ADR 0025](0025-drift-guard-discipline.md) — the mirror-registry doctrine (a canonical source and a
  mirror site, each guarded) that the manifest↔tarball equality check follows.
