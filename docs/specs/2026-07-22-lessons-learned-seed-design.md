# `/lessons-learned seed` — a capped, manifest-mirrored portable-lesson corpus + warm-seeding, nomination, and issue-borne contribution

Grilled and ratified 2026-07-22 (operator interview, 4 resolved forks + 1 intent amendment:
README + `war-help` documentation added to the end state). Source corpus: the 29 scrubbed
portable lessons at `Ljferrer/war-game` @ `master` `docs/learnings/` (~80 KB content bytes,
132 KB on disk; largest member 7.4 KB, zero `[[wikilinks]]` — verified 2026-07-22).

## 1. Context — the gap / problem

WAR distills durable engineering lessons per repo, but the portable subset — git/shell gotchas,
test-authoring wisdom, language footguns — dies with each repo's memory root. Warm-seeding a new
repo today is a hand-run cherry-pick (the war-game seeding session that produced the source
corpus took a multi-agent mining pass plus a manual scrub). There is no canonical portable
corpus, no distribution channel, and no way for a WAR user without push access to contribute a
lesson back. Meanwhile `/lessons-learned` already owns every adjacent mechanism: the two-root
model, the redaction lint, operator-gated eviction (`tighten`), and a reviewed-PR publication
discipline. (Dated context statement — describes drift as of authoring; do not "correct" against
later state.)

## 2. Pivotal constraints

1. **Distribution is a tarball** (operator): the corpus ships as `docs/seed/seed.tar.gz`, "so
   they don't get lugged around as an open directory full of markdown files." Reviewability is
   restored by a committed manifest, never by unpacking into the tree.
2. **Destination is asked, not assumed** (operator): `/lessons-learned seed` asks per run whether
   lessons land in the target's `docs/learnings/` (committed, team-visible) or its local memory
   root (untracked); default `docs/learnings/`.
3. **Dual caps, operator-gated eviction** (operator): seed ≤ 50 members AND ≤ 1500 KB
   uncompressed — overflow on either axis; evictions to `docs/seed/archive/` behind one
   strike-list ask (the `tighten` gate pattern). Archive ≤ 500 members AND ≤ 100 MB; archive
   overflow refuses the add loudly — no automatic deletion, ever.
4. **Contribution without PRs** (operator): a foreign-repo `/lessons-learned` run contributes
   candidates by opening `seed-candidate` issues on `Ljferrer/WorkAuditRefine` with the full
   lesson in the body — the `memory-mined` filing discipline (fixed greppable body line,
   open+closed dedup, temp-file redaction lint, fail-closed withhold) is the template.
5. **The plugin cache ships `docs/`** (verified): the verb's seed source is
   `${CLAUDE_PLUGIN_ROOT}/docs/seed/` — version-pinned by installation; no GitHub fetch, no
   local-checkout dependency.
6. **Vocabulary collision is real**: "Setup seed render" (SKILL.md Phase 0) already means the
   idempotent `render-index` projection. The new mode must disambiguate explicitly or the two
   "seed"s will be conflated by every future reader.
7. **The redaction lint reads files, never stdin** (recorded red-team finding): every lint gate
   in this design writes a temp `.md` and lints the file. A lint hit withholds; **no auto-scrub,
   ever**.

## 3. Resolved design tree

| Decision | Resolution |
| --- | --- |
| Compress = ? | `.tar.gz` blob (operator), portable `tar -czf`/`-xzf` flags only (BSD + GNU) |
| Reviewability of a binary blob | Committed `seed-manifest.json` beside it: per-member `slug`, `bytes`, `sha256`, `description`, `type`, `provenance`; equality-tested against tarball **contents** (member set + bytes + sha256), never gz bytes (gzip is nondeterministic) |
| One manifest or two | One — `docs/seed/seed-manifest.json` with `seed` and `archive` arrays; single source for dedup consumers |
| Seed destination in target | Ask at seed time: `docs/learnings/` (default) vs local memory root; non-git target collapses the ask to local-root only |
| Cap semantics | Dual-axis on both tiers (count AND uncompressed bytes); overflow on either |
| Eviction ranking | Near-dupe first (`findNearDupes`), then largest `bytes`, then oldest `effectiveDate`; no hard floors (curation is already operator-gated end to end) |
| Archive overflow | Refuse + report; operator prunes by hand |
| Where nomination runs | The bare `/lessons-learned` pass gains a nomination phase; portability rubric decides candidacy |
| In-WAR vs foreign contribution | In `WorkAuditRefine`: gated direct re-pack. Elsewhere: gated `seed-candidate` issue per candidate |
| Ingestion loop | The WAR-repo bare pass sweeps open `seed-candidate` issues for gated ingestion; accepted → re-pack + close citing the commit; rejected → comment + close |
| Provenance of a seeded lesson | `metadata.seededFrom: work-audit-refine/docs/seed@<plugin version>` stamped at placement (lint-safe: no account URL shape); stamped lessons are never re-nominated |
| New CLI surface | One new asset `skills/lessons-learned/assets/seed-pack.mjs` (pack / verify / evict); `war-memory.mjs` untouched — seed-pack imports its exported helpers (`lint`, `findNearDupes`, `effectiveDate`) |
| Mode prose | Delegated to new `references/seeding.md` (the `migrate`/`evict` pattern), SKILL.md keeps dispatch + warnings |

## 4. Mechanics

### `skills/lessons-learned/assets/seed-pack.mjs` (new CLI asset)

Node ≥ 24 (inherits `war-memory.mjs` imports via `../../_shared/war-memory.mjs`). Shells to
system `tar` with portable flags only. Three verbs:

- `pack <src-dir> --out <seed-dir>` — for each `*.md` member: redaction-lint fail-closed
  (any hit → exit 1, name the member + pattern), reject any `[[` occurrence (seeds are
  standalone), collect `slug/bytes/sha256/description/type/provenance`. Enforce seed caps
  (≤ 50, ≤ 1,500,000 B uncompressed); on overflow exit 4 printing a ranked eviction proposal
  (near-dupe → largest → oldest) — never packs a capped-out set. On success write
  `seed.tar.gz` + `seed-manifest.json` (members sorted by slug).
- `verify <seed-dir>` — unpack to a temp dir; assert manifest ↔ contents equality (member set,
  per-member bytes, sha256), both cap axes on both tiers, every member lint-clean and
  wikilink-free. Any failure → non-zero exit naming the axis. This is the verb the corpus
  contract test and any CI hook call.
- `evict --slugs <a,b,...> <seed-dir>` — move members seed → `archive/archive.tar.gz`,
  rewriting both manifest arrays; refuse (exit 5) if the archive would exceed either archive
  cap. Never deletes — archive is append-only by this verb.

### `docs/seed/` (new committed surface)

`seed.tar.gz` (the corpus), `seed-manifest.json` (both tiers), `README.md` (what this is, the
caps, the contribution flow, the source-corpus citation), `archive/archive.tar.gz`
(materializes on first eviction — git needs no empty dir). Initial corpus: the 29 scrubbed
war-game lessons, imported once from `Ljferrer/war-game` @ `master` `docs/learnings/` and
packed through `seed-pack.mjs pack` (so the initial commit already proves the lint/wikilink/cap
gates).

### `/lessons-learned seed` (new mode; prose in `references/seeding.md` `## Seed`)

1. **Preflight**: resolve `${CLAUDE_PLUGIN_ROOT}/docs/seed/`; run `seed-pack.mjs verify` on the
   shipped pair — a failed verify aborts the mode (corrupt or tampered ship).
2. **Destination ask** (one ask): `docs/learnings/` (default) vs local memory root; the ask also
   offers slug exclusions. Non-git target → local root only.
3. **Unpack to temp; collision scan** across BOTH target roots — colliding slugs are skipped and
   reported, never clobbered (the `evict`-mode discipline).
4. **Stamp** each placed file `metadata.seededFrom: work-audit-refine/docs/seed@<version>`
   (version read from the plugin's `plugin.json`).
5. **Place**: repo-root destination → write into `docs/learnings/`, `war-memory.mjs lint` the
   dir fail-closed, `render-index --local … --repo …`, one commit on a
   `dev/<date>-memory-seed` branch, PR when a remote exists (the `migrate` Step-5 discipline).
   Local destination → write, `render-index` (with `--repo` iff the repo root is non-empty), no
   git.
6. **Report**: placed / skipped-collision / lint outcome / projection bytes, surfacing
   `render-index`'s advisory warning verbatim when the 17,000 B threshold is pressed (29 seeds ≈
   +5–7 KB of `[repo]` rows).

### Nomination (bare-pass extension; prose in `references/seeding.md` `## Nominate`)

During the bare pass's per-memory review, each surviving lesson is also judged against the
portability rubric: *would the kernel help an unrelated repo* — git/`gh`/shell/bash gotchas,
test-authoring wisdom, language footguns, CI/build/deployment patterns, filesystem/path/regex
edge cases; **excluded**: engine-internal (WAR orchestration contracts), product-internal,
`seededFrom`-stamped, slug already present in either manifest tier, slug already carried by an
open or closed `seed-candidate` issue.

- **Inside `WorkAuditRefine`**: candidates are proposed as direct seed-set additions — one
  operator gate, then `seed-pack.mjs pack` re-packs (cap overflow triggers the eviction
  strike-list ask), and the change rides the run's normal reviewed commit.
- **Any other repo**: one drafted issue per candidate — title from the lesson `description`,
  label `seed-candidate` (created on the target repo if absent), body carrying the fixed
  greppable line `Seed-candidate: <slug>`, the provenance tier, and the full lesson markdown in
  a fenced block. Slug-dedup searches issues in both states for the fixed line before drafting.
  Every body (title included) goes through the temp-file redaction lint; a hit → `withheld:
  redaction`, not filed. Filing is one batch gate: present all drafts, file only approved ones.
  All `gh` writes ride `gh-preflight.sh` with a quoted possibly-empty configured account. Every
  candidate gets a report row: `filed #N` / `withheld: redaction` / `already-in-seed` /
  `previously-filed (#N)` / `rejected (operator)`.

### Ingestion (WAR-repo bare pass only; prose in `references/seeding.md` `## Ingest`)

`gh issue list --label seed-candidate --state open` → per issue, extract the fenced lesson,
temp-file lint it, check the slug against both manifest tiers → one operator batch gate →
accepted: member written to a staging dir, `seed-pack.mjs pack` re-packs (cap/evict gates
apply), one commit, issue closed with a comment citing the commit; rejected: comment naming the
reason + close. Report rows mirror nomination's.

### `skills/lessons-learned/SKILL.md` (the mode)

Frontmatter description gains the clause "Invoked as /lessons-learned seed, it instead
warm-seeds the current repo's memory from the plugin-shipped portable seed set…". A new
`` ## `seed` mode — warm-seed a repo from the portable corpus `` section slots between the
`tighten` mode and the "Any other argument text" sentinel: dispatch rule + preflight gates +
warning bullets + "Load `references/seeding.md`". The bare-pass phase list gains the nomination
phase (delegating likewise). A disambiguation note lands beside Phase 0: the **Setup seed
render** projects lessons that already exist; **`seed` mode** imports new ones — the two share a
word, not a mechanism.

### Explicitly unchanged

`war-memory.mjs` (no new verb — seed-pack imports its exports), the `tighten`/`migrate`/`evict`
modes, the projection thresholds, `LINT_PATTERNS`, the servitor write path, and the
`PROJECTION_HEADER` title quirk (pre-existing; out of scope).

## 5. Surface changes

- `skills/lessons-learned/assets/seed-pack.mjs` — new CLI asset (pack / verify / evict)
- `skills/lessons-learned/assets/seed-pack.test.mjs` — new; fixture-driven verb tests
- `docs/seed/seed.tar.gz`, `docs/seed/seed-manifest.json`, `docs/seed/README.md` — new; initial
  29-member corpus
- `skills/lessons-learned/seed-set.test.mjs` — new; the committed-corpus contract (shells
  `seed-pack.mjs verify` against `docs/seed/`)
- `skills/lessons-learned/references/seeding.md` — new; `## Seed` / `## Nominate` / `## Ingest`
- `skills/lessons-learned/SKILL.md` — mode section, frontmatter clause, nomination phase hook,
  Setup-seed-render disambiguation
- `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` — new assertions (mode section
  placement, frontmatter clause, disambiguation, seeding.md section presence, README +
  `war-help` mentions)
- `CONTEXT.md` — new domain terms (§6)
- `docs/adr/` — one new ADR at the next free number above the live set (§7)
- `README.md` — seed mode + contribution flow documentation
- `skills/war-help/SKILL.md` — orientation card gains the seed verb
- Release phase: all four version slots in lock-step (`version-slots.test.mjs` is the arbiter)

## 6. New domain terms (CONTEXT.md)

- **Seed set** — the capped, manifest-mirrored portable-lesson corpus shipped at
  `docs/seed/seed.tar.gz`; ≤ 50 members / ≤ 1500 KB uncompressed. _Avoid_: seed render (the
  Phase-0 projection), corpus (unqualified).
- **Seed candidate** — a portable lesson nominated for the seed set; foreign repos contribute
  one via a `seed-candidate` issue carrying the full lesson body. _Avoid_: memory-mined (defect
  mining — a different loop with a different label).
- **Warm-seed** — injecting the seed set into a repo's chosen memory root via
  `/lessons-learned seed`; collision-skipping, lint-gated, `seededFrom`-stamped. _Avoid_: seed
  render (projection of lessons already present), sync (re-running tops up; nothing tracks or
  updates downstream copies).
- **Seed archive** — the overflow tier at `docs/seed/archive/`; ≤ 500 members / ≤ 100 MB,
  append-only via `seed-pack.mjs evict`, pruned only by hand. _Avoid_: memory archive / the
  roots' `archive/` cold tier (per-repo eviction of live memories — a different mechanism with
  different caps).

## 7. Recommended ADRs

One: **"The seed set is a capped, manifest-mirrored tarball"** — the corpus ships as a binary
blob whose committed manifest is the reviewable/dedupable projection, with contents-level (never
byte-level) equality as the drift guard. Qualifies: hard to reverse (every consumer — the seed
verb, the contract test, the issue-dedup — reads this format), surprising later (a tarball in
git is unusual; the manifest is why it works), real trade-off (directory lugging vs review
opacity; the manifest + `verify` verb buy back review at the cost of a mirror that must be
equality-guarded).

## 8. Open risks / implementation notes

- **BSD vs GNU tar**: only `-czf`/`-xzf`/`-C` style flags are portable; no `--sort`. Contents
  hashing, not archive-byte hashing, is what makes this safe — hold that line in every test.
- **Manifest is a mirror**: `seed-manifest.json` duplicates tarball facts; the equality check in
  `verify` (and the corpus contract test calling it) is the drift guard. A change to either
  without the other must fail the gate.
- **`gh` search is substring-fragile**: the fixed `Seed-candidate: <slug>` body line is the
  dedup token; keep it byte-stable across the nomination and ingestion prose.
- **Cross-skill import**: `seed-pack.mjs` imports `../../_shared/war-memory.mjs`; both inherit
  Node ≥ 24. On older Node the mode fails loud at preflight (same message the CLI already
  emits), never partially seeds.
- **Foreign-repo `gh` identity**: contributors file issues under their own account;
  `gh-preflight.sh` is invoked with the *configured* `overrides.ghUser` (quoted, possibly
  empty = no-op) — never a hardcoded account. The existing hardcoded `Ljferrer` preflight in
  the tighten prose is scoped to WAR-repo pushes and stays as-is.
- **Issue-body size**: a 7 KB lesson in a fenced block is fine (GitHub caps bodies at 65,536
  chars); no truncation logic needed at current member sizes — revisit only if a member ever
  approaches the cap.

## 9. Non-goals / deferred

- No auto-sync of previously seeded repos — re-running `seed` tops up (collision-skip makes it
  idempotent); no tracking of downstream repos.
- No auto-scrub of redaction-lint hits, anywhere — withheld is the only failure mode.
- No GitHub-fetch fallback for the tarball — the plugin cache is the sole source; an old plugin
  seeds its own vintage, by design.
- No automatic issue→seed ingestion — ingestion is always operator-gated in a WAR-repo run.
- No new `war-memory.mjs` verb; no change to projection thresholds or `LINT_PATTERNS`.
- The `PROJECTION_HEADER` hardcoded title ("Project Memory — WorkAuditRefine" in every target's
  MEMORY.md) is a pre-existing quirk, untouched here.
- Per-member update/versioning semantics (a seeded lesson later improved upstream) — deferred;
  today the collision-skip means the target keeps its copy.

## 10. Validation criteria

1. **Manifest equality**: `seed-pack.mjs verify` against the committed `docs/seed/` passes; a
   fixture with one member's bytes altered (tarball or manifest side) fails naming the member.
2. **Caps**: a 51-member fixture and an over-1,500,000-B fixture each make `pack` exit 4 with a
   ranked eviction proposal; an `evict` that would push the archive past either axis exits 5.
3. **Lint gate**: a fixture member containing a home path makes `pack` exit 1 naming the member
   and pattern; the seed mode refuses a repo-root placement when the directory lint fails.
4. **Wikilink gate**: a fixture member containing `[[` makes `pack` exit non-zero.
5. **Collision skip**: seeding into a root already holding slug X leaves the existing file
   byte-identical and reports the skip.
6. **Provenance stamp**: every placed member carries `metadata.seededFrom`; a stamped fixture
   lesson is excluded by the nomination rubric.
7. **Dedup**: a fixture manifest containing slug X yields no nomination draft for X.
8. **Doc contract**: the mode section sits between `tighten` and the sentinel; the frontmatter
   clause, Phase-0 disambiguation, `seeding.md` section headings, and README + `war-help`
   mentions all assert present (assert behaviors and thresholds ≤ 50 / ≤ 1,500,000, not layout
   literals).
9. **Release**: all four version slots move in lock-step (existing `version-slots.test.mjs`).
