---
name: lessons-learned
description: Audit and tidy this project's Claude memory store (the MEMORY.md index plus its [[wikilinked]] topic files) — fan out agents to verify every memory against the live repo, classify stale vs durable, then compress / re-anchor / retire and rewrite the index, fault-tolerantly (backup → stage → verify → atomic swap). Always a full pass over the local repo's memory. Use when the user runs /lessons-learned, wants a memory housekeeping or "lessons learned" round, asks whether MEMORY.md is too large / stale / how full it is, or wants to prune, compress, or de-duplicate accumulated learnings. Invoked as /lessons-learned migrate, it instead runs the one-time two-root adoption playbook — retype untyped lessons, archive [RESOLVED] ones, and split committable project lessons into docs/learnings/ via a reviewed PR. Invoked as /lessons-learned evict, it undoes that migration — repo-root lessons return to the local root via a reviewed deletion PR, asking whether to also set commitLearnings: false. Invoked as /lessons-learned tighten, it runs the operator-gated projection-shrink pass — preflight the render-state (already under the advisory line means nothing to do), plan usage-scored evictions behind hard floors via the tighten-plan verb, gate every mutation behind one strike-list ask, execute local archives through the staged swap and any repo archives through a reviewed PR, then report before/after sizes with a loud shortfall block if the target is still missed. Invoked as /lessons-learned seed, it instead warm-seeds the current repo's memory from the plugin-shipped portable seed set — unpacking the capped, manifest-mirrored corpus into an operator-chosen destination (docs/learnings/ or the local memory root), skipping slug collisions, stamping each placed lesson metadata.seededFrom, linting fail-closed before any repo-root write, and re-rendering MEMORY.md; the same bare pass also nominates portable lessons back into the corpus — re-packing in-WAR candidates behind one operator gate and filing redaction-linted seed-candidate issues from everywhere else.
---

# /lessons-learned — fault-tolerant memory housekeeping

You run a **full pass** over this project's Claude memory store: verify every memory against the **live repo**, decide what is stale vs. still relevant, then **compress / re-anchor / retire / merge** the topic files and rewrite the `MEMORY.md` index. The pass is **fault-tolerant to interruption** (laptop closing mid-run) and **reports at every phase**.

## `migrate` mode — one-time two-root adoption

If the arguments contain the word **`migrate`** (`/lessons-learned migrate`), do **not** run the housekeeping phases below.

**Pre-flight — the opt-in gate (before staging or moving anything).** Migration's endpoint is publishing the `project`-typed set to the committed repo root, which only travels when `memory.commitLearnings` is on. That flag is **opt-in / off by default** (`/war-room` turns it on), so resolve the effective value first — but **`test -f .claude/war/config.json` before invoking the resolver**, which exits non-zero on an **absent** config (the most common state, since `/war-room` is opt-in). **Absent** → **skip** the resolver call entirely; the effective defaults apply, i.e. `memory.commitLearnings: false`. **Present** → run the existing command unchanged — `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs .claude/war/config.json --fill-defaults` — and read `memory.commitLearnings`.

- Already `true` (the operator opted in earlier) → proceed to the playbook.
- `false` → **ask the operator to opt in now** ("lessons travel with the repo, human-reviewed like code"), then branch on the answer:
  - **Accept** → write `memory.commitLearnings: true` through the **validator path** — merge the flag into the existing config (or a minimal `{"memory":{"commitLearnings":true}}` when the file is absent) and pipe it through `--stdin --fill-defaults` to a temp file, then `mv` it into place (the never-truncate discipline `/war-room` uses — a validation failure leaves any existing config intact):

    ```bash
    mkdir -p .claude/war
    printf '%s' '<config-json-with-commitLearnings-true>' \
      | node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin --fill-defaults \
      > .claude/war/config.json.tmp \
      && mv .claude/war/config.json.tmp .claude/war/config.json \
      || { echo "validation failed — config NOT written"; rm -f .claude/war/config.json.tmp; }
    ```

    Then proceed to the playbook.
  - **Decline** → **abort: "nothing migrated — re-run after opting in."** Nothing is staged, nothing is moved — the store is untouched.

Once the flag is on, load [`references/migration.md`](references/migration.md) and execute that playbook: `migrate` dry-run → agent-assisted retype of the `untyped` bucket → `migrate --apply` (archives `[RESOLVED]` lessons) → keywords backfill → move the operator-confirmed `project`-typed set into `docs/learnings/` and open the reviewed learnings PR (gate 2 by hand, `lint` fail-closed). Three warnings the playbook expands on:

- Migration edits the **live store directly** (it is not the staging flow below) — take the tarball backup the playbook names before `--apply`.
- Requires Node ≥ 24 (`node:sqlite`); on older Node every verb exits non-zero with a one-line message and does nothing (callers fail open; no partial migration).
- The `project`-typed set becomes **public on merge** — the operator confirms it explicitly; the redaction lint is the net, not the decision.

## `evict` mode — undoing the migration

If the arguments contain **`evict`** (`/lessons-learned evict [slug…]`), do **not** run the housekeeping phases. Load [`references/migration.md`](references/migration.md) and execute its **Evict** section: return repo-root lessons to the local root (temperature preserved — repo `archive/` lands in local `archive/`), re-render the projection, and open the reviewed deletion PR. Two rules that section expands on:

- **Always ask the operator whether to also set `memory.commitLearnings: false`** in `.claude/war/config.json` (or via `/war-room`) — `commitLearnings` is opt-in / off by default, but a populated repo root means the operator turned it **on**, so without flipping it back off the next landed WAR phase repopulates `docs/learnings/` and the evict is temporary. Ask **before** moving any file; apply their answer; record a decline in the final report.
- Check for slug collisions between the roots before moving; diff and reconcile by hand — never clobber.

## `tighten` mode — operator-gated projection shrink

If the arguments contain **`tighten`** (`/lessons-learned tighten`), do **not** run the housekeeping
phases below. The projection's structural bound (2-column rows, the 160 B `SUMMARY_CELL_BYTES` cap) is
one-time and already in place — `tighten` is the **repeatable** lever that keeps a growing corpus under
the `WARN_BYTES` advisory line (17,000 B) via usage-scored eviction, one operator-approved gate at a
time. Resolve `$MEM` per [Locate the memory store](#locate-the-memory-store) and `$REPO_ROOT` the same
way Phase 0 does (both defined further down this doc — this mode still runs before/instead of the
numbered phases, it just borrows their variable names). Five steps, strict order:

1. **Preflight** (read-only — nothing is staged or mutated yet):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" tighten-plan --local "$MEM" --repo "$REPO_ROOT"
   ```

   (`--target` defaults to 17,000 = `WARN_BYTES`; pass `--target <bytes>` only for a different bound.)
   Read the printed JSON's `verdict` field — `buildProjection`'s own read on the **current, live** corpus
   (`ok` | `warn` | `refuse`). **`verdict: "ok"` — strictly under the advisory line — means report
   "nothing to tighten" and stop; no later step runs.** Anything else (`warn` or `refuse`) proceeds —
   this is exactly the render WARN's own trigger (`bytes >= WARN_BYTES`), never a `≤ target` reading (the
   two diverge at exactly 17,000 B, where render already warns).

2. **Plan.** Reuse that same JSON — `tighten-plan` is the corpus authority; **never re-derive hits,
   floors, or ranking by hand.** Its `eligible` array is the ranked mutation set (ascending `hits`, ties
   by `tier` then `ageDays`), one entry per candidate: `slug`, `hits`, `tier`, `ageDays`, `inbound`,
   `bytesFreed`, a running `cumulativeFreed` — plus, on a cross-root dupe, `dupe: true` /
   `copies: ["local","repo"]`. The top-level `cutIndex` marks how many entries (from the top) the
   **default** proposal strikes to clear `cutGoalBytes` (`currentBytes` down to `target − slack`, `slack`
   = 500 B); `projectedBytes` is the file size if exactly that default set lands. Optionally fold in
   editorial description trims for cells the 160 B cap visibly cut mid-thought — polish only, never
   counted toward the byte math (eviction owns bytes; edits are cosmetic).

3. **Gate** (the single destructive phase — every mutation behind one ask, never a row-by-row
   negotiation). Present the full `eligible` list as a strike-list — slug · hits · tier · age · inbound ·
   bytes, the `cutIndex` entries pre-selected as the default — plus the projected post-run size
   (`currentBytes` minus the *approved* set's `bytesFreed` sum; recompute it if the operator strikes a
   different subset than the default). Collect the approved subset in this one ask.

4. **Execute**, in this order — a struck dupe only fully archives across both sub-steps below, so the
   order is load-bearing, not stylistic:
   - If the approved set touches any `[repo]`-marked slug, first
     `git -C "$REPO_ROOT" checkout -b dev/<YYYY-MM-DD>-memory-tighten` off the current HEAD, so every
     repo-root move below lands on the dedicated branch, never wherever `$REPO_ROOT` happened to be
     checked out.
   - **Local**, reusing the Phase 1/5/6/7 subcommands verbatim (no fan-out — this isn't the audit
     flow): `safe-swap.sh stage "$MEM"` for `$STAGING`, then the same Phase 5 `archive` /
     `render-index` invocations (both flags, `--repo "$REPO_ROOT"` included) against the approved
     local-side slugs in place of a retire/merge list (a struck dupe's **local** half moves now — the
     prefer-local rule wins while both copies are hot; a repo-only slug's sole copy also moves now,
     `git mv`d straight into the branch above) plus any approved editorial trims, then the same Phase 6
     `verify` and Phase 7 `commit` invocations. Take the same stale-staging guard as the bare pass — a
     `stage` refusal over a leftover `.staging` dir means `recover` first.
   - **Repo**, only after the local commit lands: a struck dupe's repo half is now its slug's *sole* hot
     copy, so `archive --local "$MEM" --repo "$REPO_ROOT" <struck-dupe-slugs>` now resolves to it and
     `git mv`s it inside `$REPO_ROOT` (repo-only slugs already moved above — a no-op for them here). Then
     `lint "$REPO_ROOT"` (fail-closed), `git -C "$REPO_ROOT" add -A && git commit` (one commit, covering
     every move this run made). **Before the push**, run
     `bash "${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh" Ljferrer` (the recorded gh-account
     gotcha — a stale active account on a multi-account machine silently drops the PR onto the wrong
     identity), then push and open the PR. Skip every bullet in this step when nothing `[repo]`-marked
     was struck.
   - *(Why local-then-repo: `archive`'s prefer-local rule — the fix for the recorded "archiving a dupe's
     local copy frees zero projection bytes" incident — always resolves a slug hot in both roots to its
     local copy; no flag forces the repo copy while a local hot copy survives. A struck `dupe: true`
     entry needs both passes, in this order, to actually drop its row.)*

5. **Report.** Before/after `MEMORY.md` lines + bytes + % full on both axes, the actioned buckets (slugs
   struck: local-only / repo-only / dupe-both), any editorial trims, the PR URL (or "no repo-side change"
   when nothing `[repo]`-marked was struck), and the local swap's backup + `.prev` paths. **When the
   approved subset still leaves the file at or above `target`** (fewer strikes than the default
   `cutIndex`, or the eligible list itself falls short) — **execute anyway, then report the shortfall
   loudly**: bytes still missing plus the next-best candidates (the same `eligible` array from `cutIndex`
   onward). Never silent, never a second automatic gate — the operator re-runs `tighten` by hand for
   another pass if they want to close the gap.

## `seed` mode — warm-seed a repo from the portable corpus

If the arguments contain **`seed`** (`/lessons-learned seed`), do **not** run the housekeeping
phases below. This mode **imports** portable lessons the current repo has never had — it unpacks
the plugin-shipped seed corpus at `${CLAUDE_PLUGIN_ROOT}/docs/seed/` into the memory root you
choose, never reprojecting or pruning lessons already present (that is the Phase-0 **Setup seed
render**, a different mechanism — see the disambiguation note beside Phase 0).

**Preflight gates — both fail-closed, before any write:**

- **Corpus verify.** Resolve `${CLAUDE_PLUGIN_ROOT}/docs/seed/` and run `seed-pack.mjs verify` on
  the shipped `seed.tar.gz` + `seed-manifest.json` pair. A **non-zero exit aborts the mode
  outright** — treat it as a corrupt or tampered plugin install; never re-pack it yourself.
- **Lint fail-closed before any repo-root write.** A `docs/learnings/` destination lints the whole
  directory (`war-memory.mjs lint`) *before* the render/commit/PR, and a single hit **refuses the
  entire repo-root placement** — no render, no commit, no PR, no auto-scrub.

**Warnings:**

- **Collisions are skipped, never clobbered.** A slug already present in *either* root (the target
  `docs/learnings/` or the local `$MEM`) is left byte-identical and reported — warm-seeding never
  overwrites an existing lesson.
- **Every placed member is stamped `metadata.seededFrom`.** That stamp is exactly what the
  `## Nominate` rubric excludes on sight, so a seeded lesson is never re-nominated back into the
  set it came from.
- **A non-git target collapses the destination ask to the local root only** — there is no repo to
  commit a `docs/learnings/` placement into.

Load [`references/seeding.md`](references/seeding.md) and execute its `## Seed` section (the
destination ask, unpack-to-temp, both-root collision scan, `seededFrom` stamp, lint-gated
placement, and the placed / skipped-collision / lint / projection-bytes report).

Any other argument text (or none) means a normal housekeeping pass.

## The cardinal invariant — never mutate the live store until it is verified

The project memory dir is **not git-tracked**, so a backup tarball is the only recovery point. Therefore:

> **All edits happen in a `<memdir>.staging` copy. The LIVE memory dir is read-only until the final, verified atomic swap.**

If the machine sleeps or the process dies during analysis or editing, the live store is **pristine** — just restart. The only mutation of the live dir is two back-to-back `mv`s at the very end, and `safe-swap.sh recover` repairs even an interruption between those. The deterministic backup / stage / verify / swap / recover steps are owned by [`assets/safe-swap.sh`](assets/safe-swap.sh) — **shell out to it; do not hand-roll the swap.**

This is an `Agent` + `Workflow` skill. Fan-out is the default for the read-heavy phases (a real store is ~100 files); only drop to inline single-agent work for a tiny store (≲ 20 memories). Cost is not the constraint — thoroughness is.

## Locate the memory store

Your project memory dir is the directory holding `MEMORY.md` named in your system prompt's **auto-memory** section (e.g. `~/.claude/projects/<project-slug>/memory/`). Confirm it exists and contains `MEMORY.md` before doing anything. Call it `$MEM` below; always use its **absolute path** (the scope hooks reject `..` segments).

## Phases

Create a todo per phase. Do them in order. Report after each.

### 0 — Inventory & budget (read-only except the one idempotent seed render below)

- Count topic files, total disk, and `MEMORY.md` size (`wc -l -c`).
- Budget (from `consolidate-memory`): `MEMORY.md` should stay **< 200 lines and ~25 KB** (the hard cap;
  render refuses above it). The **advisory line** sits well under that, at `WARN_BYTES` = 17,000 B —
  `buildProjection`'s `warn` verdict, and the trigger for the `tighten` mode below. Compute **% full** on
  both axes; the byte axis usually binds.
- Gather the live-repo baseline the verifiers need: current version (`plugin.json`), top-level layout, recent merges (`git log --oneline --merges`), and where the code under audit actually lives.
- **Detect the repo root** — `docs/learnings/` in the audited repo (or the configured `overrides.learningsTarget`); call it `$REPO_ROOT`. Count its topic files too and report that count alongside the local inventory. When `$REPO_ROOT` exists and is **non-empty** and the local `MEMORY.md` **lacks any `[repo]`-marked rows** (a fresh clone that never adopted the repo lessons), run the **Setup seed render** — the same idempotent seed WAR Setup runs (Task 2, identical flag set; only the `<local>` path is environment-specific) — so the projection reflects the repo lessons before you inventory staleness, and **say so in the Phase 0 report**. This seed is the **sole** live-dir write in Phase 0 and is safe to run before the Phase 1 backup: it only reprojects the index from existing files (never touches a topic file), and, like the Phase 5 render, it regenerates `MEMORY.md` atomically (`.tmp` + rename) and idempotently.

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM" --repo "$REPO_ROOT"
  ```

  (Skip the seed only when the Node probe reports memory unavailable — Node < 24 / no `node:sqlite`.)

  > **Disambiguation ("seed" names two mechanisms):** the **Setup seed render** here *projects* lessons that **already exist** in the roots into `MEMORY.md`; the **`seed` mode** (`/lessons-learned seed`) *imports* **new** lessons from the plugin-shipped portable corpus into a memory root — the two share the word, not a mechanism.
- **Report:** local file count, disk, `MEMORY.md` lines/bytes + % full, the `$REPO_ROOT` file count (and whether the seed render ran), and a one-line verdict on whether it is over/under budget. **At or above the 17,000 B advisory line, name it and suggest `/lessons-learned tighten`** (the operator-gated projection-shrink pass, run separately from this housekeeping round) as the next step.

### 1 — Backup & stage (the fault-tolerance step)

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/safe-swap.sh" stage "$MEM"
```

This writes a timestamped `lessons-learned.bak.<UTC>.tgz` next to `$MEM` and a `$MEM.staging` copy. Capture the printed `BACKUP=` and `STAGING=` paths. **Every edit, delete, and index rewrite from here on targets `$STAGING`, never `$MEM`.** (If `stage` errors that a staging dir already exists, a prior run was interrupted — run the `recover` subcommand and resolve it before continuing.)

- **Report:** backup tarball path + staging path, and the invariant ("live store untouched until verified swap").

### 2 — Investigate staleness (fan-out, read-only)

Author a `Workflow` that batches the topic files (~5–6 per agent) and has each agent **verify its memories against the live repo**: read the memory, extract its concrete claims (file paths, symbols, flags, version numbers, line refs, `RESOLVED` markers, behaviors), then **read/grep the actual repo** to confirm each. Emit one structured verdict per memory using this schema:

```json
{ "slug": "string",
  "verdict": "current | anchor-drift | resolved | superseded | dated-done | stale",
  "confidence": "high | medium | low",
  "evidence": "concrete check performed — a file:line read, a grep hit/miss, a version compared (REQUIRED, no guessing)",
  "recommendation": "keep | keep-compress | fix-anchor | retire | merge",
  "mergeWith": "slug to merge into, if recommendation=merge",
  "reason": "one sentence" }
```

Verdict meanings — separate **is the lesson still true?** from **do its anchors still resolve?**:

| verdict | meaning | typical recommendation |
|---|---|---|
| `current` | lesson applies AND anchors resolve | `keep` |
| `anchor-drift` | lesson durable, but a cited file/line/symbol/version moved or fell behind | `fix-anchor` / `keep-compress` |
| `resolved` | warns of a bug/gap the repo NOW fixes | `keep-compress` (rule survives) or `retire` (no residue) |
| `superseded` | another memory covers it better | `merge` |
| `dated-done` | a project/roadmap whose work is complete | `retire` or `keep-compress` |
| `stale` | the lesson itself no longer holds (mechanism removed) | `retire` |

Most memories are **transferable lessons** — a durable pattern almost never goes `stale` just because one code site changed. "The fix landed" or "the line number moved" is `resolved` / `anchor-drift`, not `stale`.

**Link trichotomy — never adjudicate a `[[link]]` from a hot-only listing.** Every `[[link]]` target is in exactly one of three states: **HOT** (`<root>/<slug>.md` — a live topic file; keep), **COLD** (`<root>/archive/<slug>.md` — an archived file; keep, a link into `archive/` is a legal cold link, not dangling), or **MISSING** (in neither the hot set nor `archive/` — the only genuine removal candidate). A verifier **never** recommends removing a link or an index row from a hot-only `ls <staging>/<slug>.md`: that listing cannot see COLD targets and would falsely orphan every legal archived link. All dangling-link and index-row adjudication defers to the central archive-aware `safe-swap verify` (Phase 6), which is the sole authority on link removal — a verifier flags a *suspected* MISSING target for that check, it does not itself delete.

**Also record each lesson's recurrence trail.** As each investigator reads a memory, capture the re-trigger count from the `phase` field's free-text recurrence annotations (e.g. "+ 28 recurrences", "recurred …/T5") — read them as prose, no schema change. A lesson re-triggered ≥ 2 times is a **graduation candidate** input for Phase 3; note the slug and the count alongside the verdict.

- **Report:** counts by verdict and by recommendation; call out anything `stale` or low-confidence, and the recurrence counts for any lesson with ≥ 2 re-triggers.

### 3 — Plan + the hub-link safety check (the step that prevents rot)

Before archiving anything, **check inbound links** for every `retire` / `merge` candidate — the mechanical count comes from `war-memory inbound`, which walks both roots, counts files whose body cites `[[<slug>]]`, excludes the slug's own file, and lists the citing slugs:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" inbound <slug> --local "$STAGING" --repo "$REPO_ROOT"
```

- **0–1 inbound refs, no durable residue** → safe to retire.
- **≥ 2 inbound refs** → it is a **concept hub**. A memory can be dead as a *bug warning* yet load-bearing as a *concept anchor* that siblings cite as "same family as …". **Do not delete it.** Downgrade to `keep-compress`: shrink it to a one-line `**RESOLVED (instance) — kept as concept anchor.**` stub and keep its index row.

**`retire` and `merge` archive, they do not delete.** A surviving hub-downgrade runs **first** (a `keep-compress` stub is never archived). For every candidate that survives the downgrade check, the action is `war-memory archive <slug>` — the lesson leaves the hot set but stays queryable in `archive/`. Knowledge is archived, never deleted (Commander's Intent: *knowledge is archived, never deleted*). A `merge` also folds the source's residue into the target first (Phase 4), then archives the source with a `merged into [[target]]` note.

Produce the final action plan: the bucketed table (keep / fix-anchor / compress / retire / merge), with the archive list and any hub-downgrades named explicitly.

**Graduation candidates.** From the Phase 2 recurrence trails, list any lesson with **≥ 2 recorded re-triggers whose content describes a machine-checkable invariant** — a greppable pattern, a diff property, an enum mirror, or a string presence. For each, record: the lesson slug, its recurrence count, and a one-line proposed enforcement shape (hook / floor / drift-guard test / lint). A lesson recurring ≥ 2 times but describing a judgment call (no mechanically checkable invariant) is **not** a candidate — leave it out. This subsection is **flag-only**: the housekeeping pass **never implements** the enforcement and **never auto-files** an issue — the operator decides whether anything is built or filed.

- **Report:** the plan table and the hub-downgrade decisions, so the user sees what is about to be archived (the backup makes it reversible, but surface it anyway), plus the graduation-candidates list (or "none").

### 4 — Apply edits to STAGING (fan-out)

Author a `Workflow` over the `keep-compress` + `fix-anchor` + `merge` items (batches of ~5), each agent editing files **in `$STAGING`** and re-verifying against the live repo. Rules every editor must follow:

- **Preserve frontmatter exactly** (`name`, all `metadata.*` including `provenance`, `tags`, `relates`, `created`, `originSessionId`). Touch only the body — except a `fix-anchor` may correct a wrong `files:`/path in frontmatter.
- **`fix-anchor`:** re-anchor a drifted reference by **named construct** ("the `isHardGateEvidence` declaration in workflow-template.js"), **never a fresh line number** — line numbers rot (this repo's own `plan-line-number-refs-stale-use-construct-locator` lesson). Replace a stale quoted snippet with its current form.
- **`keep-compress`:** trim to (a) the durable rule stated tightly, (b) a one-line "fixed/landed in `<ref>`" note, (c) surviving `[[cross-links]]` and `**Why:**`/`**How to apply:**`. Cut dated per-release logs, long code snapshots, multi-phase bookkeeping.
- **`merge`:** fold the source's durable residue into the target (one sentence + a `relates` cross-link), then append a `merged into [[target]]` note to the source body. The source is **archived in Phase 5** (the editor does not archive it) — its content stays queryable in `archive/`.
- **Illustrative wikilinks pollute the graph.** Never write a real-looking `[[lowercase-slug]]` as an *example* in prose or an index summary cell — verify counts it as a link/row. Use plain words ("inbound links") or a non-ascii placeholder.

- **Report:** files edited, what was trimmed/re-anchored, and the new line counts of the biggest compressions.

### 5 — Archive, merge-source removal, index render (in STAGING)

- **Archive** the confirmed `retire` files and the `merge` sources — point the CLI at the staging root so the live dir stays untouched, and **pass `--repo "$REPO_ROOT"` when the repo root exists** (omit it only when no repo root resolves — the same conditional the render below carries):

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" archive --local "$STAGING" --repo "$REPO_ROOT" <slug>...
  ```

  This appends an archive note, `mv`s each into `$STAGING/archive/` (the local root is not a git repo, so a plain move — no `git mv`), and stays queryable. It does **not** delete. A slug hot in **both** roots archives the **staging copy only** — `archive` prefers the local record for a cross-root dupe, so passing `--repo` never mutates the committed repo copy (it stays hot and keeps its `[repo]` row). **`archive`'s trailing re-render now walks both roots**, so the staged projection keeps its `[repo]` rows even if the pass dies before the explicit render step below — without `--repo`, that intermediate render silently drops every `[repo]` row on a repo-adopted store. A `[[wikilink]]` into `archive/` is legal (safe-swap treats it as resolved, not dangling), so leave inbound links to an archived slug in place.
- **Fix only the frontmatter `relates:` entries** that point at an archived slug if you want the graph tidy — body `[[…]]` mentions may stay, since the target now lives in `archive/` and still resolves. (Contrast a true delete, which would orphan them — this pipeline no longer deletes.)
- **Render the projection** — the final, authoritative index rewrite is generated, not hand-typed (the projection is derived from the files; a hand-authored `MEMORY.md` summary is normalised away at the next render). **Pass `--repo <repo root>` when the repo root exists** (`docs/learnings/` in the audited repo, or the configured override) so the walk sees the repo-root lessons and re-marks their `[repo]` rows; omit it only when no repo root resolves:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$STAGING" --repo "$REPO_ROOT"
  ```

  `archive` already re-renders after archiving, so an explicit `render-index` here is the belt-and-suspenders final projection. It regenerates `$STAGING/MEMORY.md` atomically (`.tmp` + rename), drops archived rows, and keeps the table format and `[[slug]]` convention. If it refuses on budget (above the hard axis), archive more low-tier/old lessons and re-render.
- The staged copy of `war-memory-queries.jsonl` (the query log, if the corpus has one) **rides along inertly** in `$STAGING` — it is harmless in the swap and never indexed. Leave it; exclude it from the backup tarball only if backup size ever matters.

### 6 — Verify STAGING (the gate)

```bash
CLAUDE_MEMORY_REPO="$REPO_ROOT" bash "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/safe-swap.sh" verify "$STAGING"
```

Set the `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefix when the repo root exists (same conditional as the Phase 5 commands; each command block runs in its own shell, so re-resolve `$REPO_ROOT` here rather than assuming live shell state — omit the prefix only when no repo root resolves). It checks: every index row maps to a file (**hard fail**; rows carrying the trailing `[repo]` marker are skipped — their files live in the repo root, not the staged local dir), every file is indexed (warn), no dangling wikilinks (warn — a link resolving into `archive/` is **not** dangling, so archived-slug links are fine; investigate only links to a slug that exists in neither the hot set nor `archive/`), `MEMORY.md` within budget (**hard fail** if over), and — when `CLAUDE_MEMORY_REPO` names a populated repo root — that the projection still carries its `[repo]` rows (**hard fail** if the repo root holds hot lessons but `MEMORY.md` carries zero `[repo]` rows: the wholesale-drop the Phase 5 `--repo` prevents). **If it does not print `VERIFY: PASS`, do NOT swap** — fix `$STAGING` and re-verify. The live store is still pristine, so there is no rush.

### 7 — Atomic swap + final report

```bash
CLAUDE_MEMORY_REPO="$REPO_ROOT" bash "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/safe-swap.sh" commit "$MEM"
```

`commit` re-verifies staging itself — with the same repo-completeness gate when `CLAUDE_MEMORY_REPO` is set, so thread the prefix whenever the repo root exists (re-resolving `$REPO_ROOT` in this fresh shell, same conditional as above) — and refuses to swap on failure, then moves `$MEM → $MEM.prev.<UTC>` and `$STAGING → $MEM`. Capture `PREV=`.

- **Report:** before/after `MEMORY.md` lines/bytes + % full, before/after file count and total disk, the buckets actioned (kept / compressed / re-anchored / retired / merged / hubs restored), and the backup + prev paths for reverting.
- **Surface the Phase 3 graduation-candidates list verbatim** (slug · recurrence count · proposed enforcement shape), or state "none". Restate the flag-only constraint: nothing here was implemented or filed — the operator decides.

### 8 — Capture the meta-lesson (optional)

If the run surfaced a reusable housekeeping insight, write it as a new memory in the now-live `$MEM` (with an index pointer), following the auto-memory format. Then this skill's own pass is recorded for the next round.

### 9 — Nominate portable lessons + sweep contributions (delegated)

The bare pass closes by feeding the **portable seed corpus** (`docs/seed/`). This phase is only a hook — the mechanics live in [`references/seeding.md`](references/seeding.md), run after the swap so nominations are judged against the settled store:

- **Nominate** — each lesson the Phase 2 review already read is *also* judged against the portability rubric in [`references/seeding.md`](references/seeding.md) `## Nominate`. Inside `WorkAuditRefine` an approved candidate is re-packed into the seed set behind one operator gate; from any other repo it becomes a redaction-linted `seed-candidate` issue on the plugin's own repo.
- **Ingest** (WAR repo only) — when this pass runs inside `WorkAuditRefine`, sweep open `seed-candidate` issues per [`references/seeding.md`](references/seeding.md) `## Ingest`: extract the fenced lesson → temp-file lint → manifest dedup → one batch gate → re-pack and close-citing-the-commit for each accepted issue.

Both bullets delegate entirely to `references/seeding.md`; this list entry is only the phase hook that fires them.

## Resume & recovery (interruption)

| State on restart | What happened | Fix |
|---|---|---|
| `$MEM/MEMORY.md` present, `$MEM.staging` present | died before commit | discard staging, restart: `rm -rf "$MEM.staging"` |
| `$MEM` missing, `$MEM.staging` present | died **between** the two swap `mv`s | `safe-swap.sh recover "$MEM"` restores staging → live |
| `$MEM` missing, no staging | catastrophic | `tar xzf <newest lessons-learned.bak.*.tgz> -C <parent>` |

`safe-swap.sh recover "$MEM"` diagnoses and repairs the first two automatically. The backup tarball is always the fallback.

## Common mistakes

- **Editing the live dir instead of staging.** Defeats fault tolerance. All edits go to `$STAGING`; the live dir is read-only until `commit`.
- **Retiring a concept hub.** A `resolved` memory with several inbound links is a vocabulary node — keep it as a compressed anchor, or you orphan every sibling that cites it. Always run the Phase-3 `war-memory inbound` check.
- **Re-anchoring to a fresh line number.** It will rot again. Anchor by named construct.
- **Treating "the bug is fixed" as "stale".** That is `resolved` (compress, keep the rule), not `stale` (retire).
- **Illustrative `[[slug]]` in examples.** Pollutes the link graph and the verify report. Don't write example wikilinks that look real.
- **Deleting instead of archiving a `retire`/`merge`.** `rm` destroys knowledge; `war-memory archive <slug>` keeps it queryable. This pipeline archives — it never `rm`s a lesson.
- **Swapping on a `VERIFY: FAIL` or warnings you didn't read.** A link into `archive/` is legal (cold links resolve); the real rot is a link to a slug in neither the hot set nor `archive/`. Resolve those before committing.
- **Dropping `--repo` from the Phase 5 archive or render on a repo-adopted store.** Both `archive` (its trailing re-render) and `render-index` re-derive the projection from the roots they are told to walk; if `$REPO_ROOT` exists but you invoke either `--local` only, the walk never sees the repo lessons and the regenerated `MEMORY.md` **silently drops every `[repo]` row**. Always pass `--repo <repo root>` on **both** the Phase 5 `archive` and the Phase 5 render when the repo root exists — and thread `CLAUDE_MEMORY_REPO="$REPO_ROOT"` into the Phase 6/7 `verify`/`commit`, whose repo-completeness hard fail now backstops this mistake (a zero-`[repo]`-row projection against a populated repo root refuses to swap). (The **evict** re-render is the deliberate exception — it stays local-only *by design* so eviction drops the `[repo]` markers.)
- **Claiming a single-copy dupe archive frees projection bytes.** A cross-root dupe's `tighten-plan` entry (`dupe: true`, `copies: ["local","repo"]`) reports the saving for archiving **both** copies together — striking only one side (including a bare `archive <slug>` that only ever touches the local record, per the prefer-local rule) leaves the row exactly as it was; `buildProjection` re-collapses the surviving twin right back into the same row. Always archive both sides of a struck dupe, local before repo (`tighten`'s Execute step 4).
- **Hand-truncating a summary cell, or truncating after appending tags.** The projection's cell cap (`SUMMARY_CELL_BYTES` = 160 B) truncates the **description text first**, *then* appends the `[tier]`/`[repo]` markers — reversing that order (or hand-editing a cell to "fit") can sever a trailing `[repo]` marker, which `safe-swap.sh verify`'s repo-completeness check and the row classifiers both key on. Let `buildProjection` / `render-index` own every summary cell; never hand-truncate one.

## Note on write gates

Writing into the memory dir may trip this repo's `validate-servitor-provenance` / `validate-worktree-scope` hooks and any `GateGuard` fact-force prompt. These are **exempt for the main session and non-servitor agents** (the provenance gate fires only on `war-servitor` agent_type), so your edits pass — satisfy any fact-force prompt briefly and proceed. Always use **absolute paths with no `..`** segment.
