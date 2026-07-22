# `/lessons-learned seed` — portable seed corpus, warm-seeding, nomination + issue-borne contribution

Source spec: `docs/specs/2026-07-22-lessons-learned-seed-design.md` (grilled + ratified
2026-07-22, intent confirmed with amendment).

## Commander's Intent

*(operator-authored; confirmed 2026-07-22 with amendment — intent is the ceiling, the plan slice
is the floor)*

- **Purpose:** make the portable-lesson corpus a first-class, versioned WAR asset — any new repo
  warm-seeds its memory in one command, and any WAR user can grow the corpus without PR access.
- **Method:** ship the scrubbed corpus as a capped, manifest-mirrored `docs/seed/seed.tar.gz`
  packed by a tested asset script; extend `/lessons-learned` with a `seed` verb (unpack →
  operator-chosen destination → lint-gated placement + provenance stamp); teach the bare pass to
  nominate portable candidates — direct gated additions inside WorkAuditRefine, redaction-linted
  `seed-candidate` issues from everywhere else; enforce dual caps with tighten-style
  operator-gated eviction to `docs/seed/archive/`.
- **End state:**
  1. `docs/seed/seed.tar.gz` + `seed-manifest.json` committed; manifest mirrors tarball contents
     (member set, bytes, sha256) — equality-tested.
  2. The 29 scrubbed war-game lessons are the initial corpus; every member redaction-lint-clean,
     zero `[[wikilinks]]`.
  3. Caps test-enforced: seed ≤ 50 members and ≤ 1,500,000 B uncompressed; archive ≤ 500 and
     ≤ 100 MB; overflow eviction operator-gated; archive overflow refuses loudly.
  4. `/lessons-learned seed` unpacks the plugin-shipped tarball, asks destination
     (`docs/learnings/` vs local memory root), skips slug collisions, stamps
     `metadata.seededFrom`, lints fail-closed before any repo-root write, re-renders MEMORY.md.
  5. The bare pass nominates portable candidates: in-WAR → gated seed-set addition; foreign
     repo → gated, slug-deduped, lint-withheld `seed-candidate` issue on
     `Ljferrer/WorkAuditRefine` carrying the full lesson body.
  6. The WAR-repo bare pass sweeps open `seed-candidate` issues for gated ingestion; accepted →
     re-packed + issue closed citing the commit.
  7. Doc-contract tests cover the new mode section and the "Setup seed render" disambiguation.
  8. `README.md` and the `war-help` orientation card both document the seed verb and the
     contribution flow; CONTEXT.md terms + one ADR landed.
  9. Trailing release phase bumps all four version slots in lock-step.

## Build order (for /war)

1. **Phase 1 — Packer + committed corpus** (waves: 1.1 → 1.2)
2. **Phase 2 — Skill + docs wiring** (waves: 2.1 ∥ 2.3 ∥ 2.4 → 2.2)
3. **Phase 3 — Release** (trailing, own phase)

## Phase 1 — Packer + committed corpus

### Task 1.1: `seed-pack.mjs` — pack / verify / evict

- Files: `skills/lessons-learned/assets/seed-pack.mjs`, `skills/lessons-learned/assets/seed-pack.test.mjs`
- Plan slice: New Node ≥ 24 CLI asset with three verbs, per spec §4. `pack <src-dir> --out
  <seed-dir>`: per-member redaction lint fail-closed (import `lint` from
  `../../_shared/war-memory.mjs`; exit 1 naming member + pattern), reject any `[[` occurrence,
  collect slug/bytes/sha256/description/type/provenance, enforce seed caps (≤ 50 members, ≤
  1,500,000 B uncompressed — dual-axis, overflow on either), exit 4 with a ranked eviction
  proposal on overflow (near-dupe via `findNearDupes` → largest bytes → oldest `effectiveDate`),
  else write `seed.tar.gz` + `seed-manifest.json` (single manifest, `seed` + `archive` arrays,
  members sorted by slug). `verify <seed-dir>`: unpack to temp, assert manifest ↔ contents
  equality (member set, per-member bytes, sha256), both cap axes on both tiers, per-member
  lint + wikilink cleanliness; non-zero exit naming the failed axis. `evict --slugs <a,b,...>
  <seed-dir>`: move members to `archive/archive.tar.gz` rewriting both manifest arrays; exit 5
  when the archive would exceed either archive cap; never deletes. Pack refuses (exit 1,
  naming the offender) on an empty member set, two members resolving to the same slug
  (`metadata.slug` wins over filename), or a member whose description resolves empty after the
  description → `metadata.title` fallback (the manifest row is the review surface and the
  nomination issue title). Pack reads any existing `seed-manifest.json` in `--out` and carries
  its `archive` array forward unchanged (absent → empty array); pack never touches
  `archive.tar.gz`. Evict computes archive-cap totals (count and bytes) from the manifest
  `archive` array plus the incoming members — never by unpacking the existing archive (verify
  owns contents equality; the manifest is the single source for cap arithmetic). Any tar or
  filesystem failure exits non-zero echoing the underlying error (spawnSync status/error
  checked; no dedicated exit code). Shell out to system `tar` with portable flags only
  (`-czf`/`-xzf`/`-C`; no `--sort` — BSD compat); equality is contents-level, never
  gz-byte-level. Mapped tests (spec §10 criteria 1–4): fixture corpus packs and round-trips
  verify green; altered-member fixture fails verify naming the member; 51-member and
  over-byte-cap fixtures exit 4 with proposal; home-path member exits 1; `[[` member exits
  non-zero; archive-overflow evict exits 5 (the fixture fabricates a manifest whose archive
  rows already sit at a cap axis — no large real archive fixture); empty-dir, dup-slug, and
  description-less fixtures each exit 1 naming the cause; re-pack over an unchanged corpus
  yields a byte-identical `seed-manifest.json` (the tarball blob may churn — accepted, never
  asserted); re-pack into a seed-dir holding a non-empty archive tier leaves the archive array
  identical and verify green.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: import the corpus, commit `docs/seed/`, corpus contract test

- Files: `docs/seed/seed.tar.gz`, `docs/seed/seed-manifest.json`, `docs/seed/README.md`, `skills/lessons-learned/seed-set.test.mjs`
- Plan slice: One-time import: fetch the 29 lessons from `Ljferrer/war-game` @ `master`
  `docs/learnings/` (clone shallow or read the operator's local checkout; record the source
  commit in `docs/seed/README.md`), stage to a temp dir, run `seed-pack.mjs pack` — the pack's
  own lint/wikilink/cap gates are the import filter; a member failing them is reported and
  dropped only with operator confirmation, never silently. Four known description-less members
  (`drift-matrix-stated-vs-covered-cells`, `json-parse-catch-misses-valid-scalar`,
  `printf-json-escaping-vacuous-test-case`, `teardown-phase-reap-order-and-delete-fail-loud`)
  get a `description` backfilled from each file's H1 title at import — the backfills recorded
  in `docs/seed/README.md`, never silent. Author `docs/seed/README.md`: what
  the seed set is, both cap tiers, the contribution flow (`seed-candidate` issues), and the
  source-corpus citation. Author `skills/lessons-learned/seed-set.test.mjs`: shells
  `seed-pack.mjs verify` against the committed `docs/seed/` and asserts exit 0 — the standing
  corpus contract (drift guard for the manifest↔tarball mirror; discovered by the repo's
  `node --test 'skills/**/*.test.mjs'` gate); resolve `docs/seed/` and `seed-pack.mjs` off
  `import.meta.url` (the sibling doc-contract test's repo-root idiom), never `process.cwd()`.
  Mapped tests (spec §10 criterion 1 standing
  form): `seed-set.test.mjs` green against the committed pair; temp-break proof — mutating one
  manifest byte in a fixture copy makes it fail.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Skill + docs wiring

### Task 2.1: `references/seeding.md` — the mode playbook

- Files: `skills/lessons-learned/references/seeding.md`
- Plan slice: New reference with three sections, per spec §4 mechanics. `## Seed`: preflight
  (`${CLAUDE_PLUGIN_ROOT}/docs/seed/` + `seed-pack.mjs verify`; failed verify aborts),
  destination ask (default `docs/learnings/`, local-root alternative, slug exclusions offered,
  non-git target collapses to local-root), unpack to temp, both-root collision scan
  (skip + report, never clobber), `metadata.seededFrom: work-audit-refine/docs/seed@<version>`
  stamp (version from the plugin's `plugin.json`), placement (repo-root: lint dir fail-closed →
  `render-index --local … --repo …` → one commit on `dev/<date>-memory-seed` → PR when a remote
  exists; local: write + render, no git — an absent local memory root is created by placement,
  `render-index` mkdirs recursively, never an abort), report (placed / skipped / lint /
  projection bytes, surfacing the render's advisory warning verbatim). `## Nominate`: the
  portability rubric
  (portable kernel categories; exclusions: engine-internal, product-internal,
  `seededFrom`-stamped, slug in either manifest tier, slug carried by an open or closed
  `seed-candidate` issue), the in-WAR direct-re-pack path (one operator gate), the foreign-repo
  issue path (title from lesson description; label `seed-candidate` created-if-absent; fixed
  greppable body line `Seed-candidate: <slug>`; provenance tier; full lesson fenced; temp-file
  redaction lint fail-closed → `withheld: redaction`; both-states slug dedup BEFORE drafting;
  one batch filing gate; `gh-preflight.sh` with the quoted possibly-empty configured account;
  every gh read and write in this path carries `-R Ljferrer/WorkAuditRefine` — the slug-dedup
  search, the label ensure, the issue create; "target repo" here always means the WAR repo,
  never the repo being audited; label attach is best-effort — when creation or attach fails or
  is silently dropped (non-collaborator: the normal case for foreign contributors), file
  without it and note label-missing in the report row, the fixed `Seed-candidate:` body line
  being the authoritative marker; a failed create never aborts the batch — remaining approved
  drafts still file, and re-running is safe because the pre-draft dedup marks earlier
  successes previously-filed; per-candidate report rows `filed #N` / `withheld: redaction` /
  `already-in-seed` / `previously-filed (#N)` / `rejected (operator)` / `failed (gh: <first
  stderr line>)`). `## Ingest` (WAR repo only): the sweep is the UNION of
  `gh issue list -R Ljferrer/WorkAuditRefine --label seed-candidate --state open` and a
  body-line search for `Seed-candidate:` over open issues — a body-line hit missing the label
  gets the label added during the sweep (the WAR-repo run has permission), so the label
  converges to a browsing convenience, never the ingestion gate. Per issue: extract the FIRST
  fenced code block (later fences ignored) → temp-file lint → manifest dedup → one batch gate
  → accepted: stage + re-pack + commit + close citing the commit — the member staged after the
  gate is the SAME extraction that was linted (never re-fetch the body after the gate, so an
  author edit between gate and commit cannot bypass the lint); rejected: comment naming the
  reason + close; a body with no fence, a fence that does not parse to a lesson (frontmatter
  with a non-empty slug), or a fenced slug differing from the `Seed-candidate:` line's gets
  report row `malformed (no extractable lesson)` and rides the same gate to a
  comment-and-close — never a guessed repair; report rows otherwise mirror `## Nominate`.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: SKILL.md mode wiring + doc-contract assertions

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: SKILL.md: append the frontmatter-description clause ("Invoked as /lessons-learned
  seed, it instead warm-seeds the current repo's memory from the plugin-shipped portable seed
  set…" — house run-on style); insert `` ## `seed` mode — warm-seed a repo from the portable
  corpus `` between the `tighten` mode section and the "Any other argument text" sentinel
  (dispatch rule + preflight gates + warning bullets + "Load
  [`references/seeding.md`](references/seeding.md)"); add the nomination phase hook to the bare
  pass's phase list (delegating to `references/seeding.md` `## Nominate` / `## Ingest`); add the
  Phase-0 disambiguation note (Setup seed render projects existing lessons; `seed` mode imports
  new ones). Extend `lessons-learned-doc-contract.test.mjs` (`doc-contract:` prefix
  convention): mode section present between tighten and the sentinel; frontmatter clause
  present; disambiguation sentence present; `seeding.md` carries all three section headings
  AND its load-bearing directives — the collision-skip rule, the `seededFrom` stamp line, the
  nomination exclusions (stamped + both manifest tiers + issue states), and the
  lint-fail-closed placement rule (locking the prose that owns spec §10 criteria
  3(b)/5/6/7's behaviors); `README.md` and `skills/war-help/SKILL.md` each mention the seed
  verb — assert behaviors and the ≤ 50 / ≤ 1,500,000 thresholds, never layout literals. Mapped
  tests (spec §10 criteria 8 + prose locks for 3(b)/5/6/7): the new doc-contract assertions
  themselves, with a temp-break proof deleting the mode section heading from a fixture copy.
- requiresTest: true
- requiresPackaging: false
- deps: [2.1, 2.4]
- target repo: superproject

### Task 2.3: CONTEXT.md terms + ADR

- Files: `CONTEXT.md`, `docs/adr/` (new ADR at the next free number above the live set)
- Plan slice: CONTEXT.md `### Memory` gains the four spec §6 terms in house format (bold term,
  definition prose, `_Avoid_:` line): **Seed set**, **Seed candidate**, **Warm-seed**, **Seed
  archive** — each `_Avoid_` line steering off the Setup-seed-render and memory-mined
  collisions. New ADR "The seed set is a capped, manifest-mirrored tarball" per spec §7
  (status: accepted, design ratified 2026-07-22; the three-part Qualifies justification from
  the spec).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.4: operator-facing docs — README + war-help

- Files: `README.md`, `skills/war-help/SKILL.md`
- Plan slice: README gains a short seed-mode entry where the other `/lessons-learned` modes are
  documented — the one-command warm-seed, the caps, and the `seed-candidate` contribution flow
  (one sentence each). `skills/war-help/SKILL.md`'s orientation card adds `/lessons-learned
  seed` beside the existing `/lessons-learned` mention so a new operator discovers warm-seeding
  from the card. Keep both surfaces consistent with the SKILL.md clause landing in Task 2.2
  (2.2's doc-contract assertions read these two files — defined-but-not-yet-asserted here;
  asserted in Task 2.2).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump to the next free patch above the live base across all four version slots in
  lock-step; `version-slots.test.mjs` is the arbiter. Release notes line: seed corpus +
  `/lessons-learned seed` + `seed-candidate` contribution flow.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

Full suite green per phase: `node --test 'skills/**/*.test.mjs'` and the self-discovery
shell-test gate (reference `resolveGate` in `war-config.mjs`; never enumerate suites — the
resolved gate already runs every `*.test.sh`).

## Deferred validations (backstops — AI-declared)

- First live `/lessons-learned seed` on a fresh repo — destination-ask UX, PR delivery,
  projection-warn surfacing · why deferred: needs a live operator and a real target repo; not
  fixture-able in CI · runner: operator, first post-release warm-seed.
- Live agent-mode behaviors of spec §10 criteria 3(b), 5, 6, 7 — collision skip, `seededFrom`
  stamp, nomination exclusion of stamped/manifest slugs, mode lint-refusal on a dirty
  destination dir · why deferred: skill-prose behaviors executed by the Lead, not fixture-able
  code paths; their directives are doc-contract-locked in Task 2.2 · runner: operator, first
  live warm-seed + first nomination post-release.
- First foreign-repo `seed-candidate` filing — live `gh` auth, label auto-create, dedup against
  real GitHub search · why deferred: needs a live `gh` session on a non-WAR repo · runner:
  operator, first nomination from a foreign repo post-release.
- Ingestion sweep against a real contributed issue — fenced-lesson extraction from a
  third-party-authored body · why deferred: needs an actual external contribution · runner:
  operator, first WAR-repo bare pass after a `seed-candidate` issue exists.
- Archive caps at real scale (≤ 500 / ≤ 100 MB refuse path) · why deferred: unreachable until
  hundreds of evictions; fixture coverage only (criterion 2) · runner: fixture tests now;
  operator if the archive ever approaches the cap.

## Notes / conscious deviations

- `README.md` is touched by Phase 2 (Task 2.4 docs entry) **and** Phase 3 (the version slot) —
  cross-phase same-file is legal (phases land serially); noted so no auditor reads it as a
  file-disjointness violation.
- Task 1.2 reads an external repo (`Ljferrer/war-game` @ `master`) — read-only import, source
  commit recorded in `docs/seed/README.md`; the corpus is thereafter canonical in this repo and
  war-game is never read again.
- Tarball bytes are deliberately NOT asserted equal anywhere (gzip nondeterminism); every
  equality check is contents-level (member set + bytes + sha256). An auditor finding no
  byte-hash of `seed.tar.gz` is confirming the design.
- `seed-pack.mjs` shells to system `tar` (portable flags only) rather than adding a tar
  dependency — deliberate; BSD/GNU divergence is contained by never asserting archive bytes.
- `war-memory.mjs` is intentionally absent from every Files list — seed-pack imports its
  exported helpers; an auditor finding it unmodified is confirming the design, not catching an
  omission.
- `docs/seed/archive/` ships empty (no committed `archive.tar.gz` until the first eviction) —
  git needs no empty dir; `verify` treats an absent archive as a zero-member tier.
- The doc-contract assertions for README/war-help live in Task 2.2 (not 2.4) to keep the test
  file single-writer; 2.2's `deps: [2.1, 2.4]` orders the waves so those surfaces exist before
  the assertions run.
- **AI-declared backstops (ADR 0014):** the Commander's Intent was operator-confirmed in the
  2026-07-22 interview (with amendment), but the deferred validations and the grill
  adjudications below were self-adjudicated in an unattended (`--afk`-style) grill pass — hence
  the AI-declared heading variant; `/red-team` ratifies.
- **Union ingest sweep supersedes the spec's letter:** spec §4 sketches the sweep as
  `gh issue list --label seed-candidate --state open`; the grill established GitHub silently
  drops labels on issue creation by non-collaborators — exactly the population the contribution
  flow exists for — so the plan's sweep is the label+body-line UNION and the label is
  convenience, never the gate. Strengthens intent (no contribution invisible); deviates from
  the sketch.
- **Report-row vocabulary extended** beyond spec §4's five rows with `failed (gh: …)`
  (nomination) and `malformed (no extractable lesson)` (ingestion) — failure rows the spec
  never enumerated; no silent outcomes.
- **Pack refusal set strengthens the spec under the latitude rule:** empty member set,
  duplicate slug, and empty-description refusals are not in spec §4's letter; each closes a
  silent-corruption path in the manifest (the design's sole review surface). Four real members
  of the initial 29 are description-less today — Task 1.2 backfills them at import, recorded
  in `docs/seed/README.md`.
- **Evict's cap arithmetic reads the manifest, never re-hashes the archive** — decided here
  (spec silent) so criterion 2's exit-5 test is a three-line fixture instead of a ~100 MB
  artifact; verify still owns contents equality.

## Open decisions

None — all forks resolved in the 2026-07-22 interview (4 AskUserQuestion resolutions + the
intent amendment recorded in the spec's design tree and provenance line); 6 grill survivors
self-adjudicated into the slices and deviations above per ADR 0014 (unattended pass), for
`/red-team` ratification.
