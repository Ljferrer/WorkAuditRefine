# Portable lesson seed corpus (`docs/seed/`)

This directory ships the **portable-lesson seed corpus** — a curated set of durable, repo-agnostic
engineering lessons (git/`gh`/shell gotchas, test-authoring wisdom, language footguns, CI/build
and filesystem/path/regex edge cases) that any repo can warm-seed into its memory with one
command: `/lessons-learned seed`. It is a first-class, versioned WAR asset — shipped inside the
plugin cache, not fetched from GitHub at seed time.

## Contents

| File | What it is |
| --- | --- |
| `seed.tar.gz` | The corpus — a gzip tarball of one `<slug>.md` lesson per member. |
| `seed-manifest.json` | The committed, reviewable mirror: per-member `slug` / `bytes` / `sha256` / `description` / `type` / `provenance`, split into `seed` and `archive` arrays. The manifest is the single source consumers dedup and review against. |
| `archive/archive.tar.gz` | Evicted members (materializes on the **first** eviction — git needs no empty dir; an absent archive is a zero-member tier). |

The tarball is a binary blob on purpose (constraint: don't lug the corpus around as an open
directory of markdown). Reviewability is restored by the manifest, never by unpacking into the
tree. Equality is always **contents-level** (member set + per-member bytes + sha256), never
gz-byte-level — gzip is nondeterministic and BSD/GNU `tar` diverge, so no tool ever hashes the
tarball blob. `skills/lessons-learned/assets/seed-pack.mjs` packs / verifies / evicts the corpus;
`skills/lessons-learned/seed-set.test.mjs` is the standing contract that `verify` stays green
against the committed pair.

## Caps (dual-axis, operator-gated eviction)

Overflow on **either** axis; nothing is ever auto-deleted.

- **Seed tier:** ≤ 50 members **and** ≤ 1,500,000 B uncompressed. Overflow refuses the pack with a
  ranked eviction proposal (near-dupe → largest bytes → oldest date); the operator gates the
  strike list, then `evict` moves members to the archive tier.
- **Archive tier:** ≤ 500 members **and** ≤ 100,000,000 B (100 MB). Archive overflow refuses the
  add **loudly** — the operator prunes by hand.

Current corpus: **29 members / 80,068 B uncompressed** (largest member 7,387 B) — well inside both
seed-tier axes.

## Contributing a lesson

Any WAR user can grow the corpus without push access:

- **Inside `WorkAuditRefine`:** the bare `/lessons-learned` pass nominates portable candidates and,
  behind one operator gate, re-packs them directly into this corpus.
- **From any other repo:** the bare pass files a `seed-candidate` issue on
  `Ljferrer/WorkAuditRefine` carrying the full lesson body and a fixed, greppable
  `Seed-candidate: <slug>` marker line (redaction-lint-gated before filing; slug-deduped against
  both manifest tiers and existing open/closed `seed-candidate` issues). The WAR-repo bare pass
  sweeps those issues, gates ingestion, and — on acceptance — re-packs the member and closes the
  issue citing the commit.

## Source corpus

Imported once (read-only) from **`Ljferrer/war-game`** `docs/learnings/` at commit
**`5478dba931a6d84250ef5275212a95cb166d863f`** ("Scrub WAR-internal cross-refs from seed lessons",
2026-07-21) — the post-scrub state of the war-game seeding session (multi-agent mining pass +
manual scrub) that produced the portable set: **29 lessons, redaction-lint-clean, zero
`[[wikilinks]]`**, matching the design spec's verified fingerprint (29 scrubbed lessons, ~80 KB
content, largest member 7.4 KB — `docs/specs/2026-07-22-lessons-learned-seed-design.md` §Source
corpus). The spec cited `@ master`; that fingerprint pins this scrub commit specifically —
war-game `master` has since accumulated its own per-run phase lessons (unrelated to the curated
portable set), so the pinned commit, not the moving `master` tip, is the corpus of record. The
corpus is thereafter canonical here; war-game is never read again.

### Description backfills at import

`seed-pack.mjs pack` refuses any member whose manifest `description` resolves empty (the manifest
row is the design's sole review surface and the nomination issue title). Four source members
carried no `description:` and no `metadata.title`; each was backfilled at import from the file's
own H1 heading (verbatim), recorded here — never silently:

| Member (slug) | Backfilled `description` (from H1) |
| --- | --- |
| `drift-matrix-stated-vs-covered-cells` | Drift matrix stated vs covered cells |
| `json-parse-catch-misses-valid-scalar` | JSON.parse catch does not guard against valid-but-non-object scalars |
| `printf-json-escaping-vacuous-test-case` | printf-interpolated JSON payloads make embedded-quote test cases vacuous |
| `teardown-phase-reap-order-and-delete-fail-loud` | teardown-phase: reap _refinery BEFORE branch delete; delete must fail loud |
