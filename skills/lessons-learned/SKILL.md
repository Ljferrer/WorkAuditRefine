---
name: lessons-learned
description: Audit and tidy this project's Claude memory store (the MEMORY.md index plus its [[wikilinked]] topic files) — fan out agents to verify every memory against the live repo, classify stale vs durable, then compress / re-anchor / retire and rewrite the index, fault-tolerantly (backup → stage → verify → atomic swap). Always a full pass over the local repo's memory. Use when the user runs /lessons-learned, wants a memory housekeeping or "lessons learned" round, asks whether MEMORY.md is too large / stale / how full it is, or wants to prune, compress, or de-duplicate accumulated learnings. Invoked as /lessons-learned migrate, it instead runs the one-time two-root adoption playbook — retype untyped lessons, archive [RESOLVED] ones, and split committable project lessons into docs/learnings/ via a reviewed PR. Invoked as /lessons-learned evict, it undoes that migration — repo-root lessons return to the local root via a reviewed deletion PR, asking whether to also set commitLearnings: false.
---

# /lessons-learned — fault-tolerant memory housekeeping

You run a **full pass** over this project's Claude memory store: verify every memory against the **live repo**, decide what is stale vs. still relevant, then **compress / re-anchor / retire / merge** the topic files and rewrite the `MEMORY.md` index. The pass is **fault-tolerant to interruption** (laptop closing mid-run) and **reports at every phase**.

## `migrate` mode — one-time two-root adoption

If the arguments contain the word **`migrate`** (`/lessons-learned migrate`), do **not** run the housekeeping phases below. Instead load [`references/migration.md`](references/migration.md) and execute that playbook: `migrate` dry-run → agent-assisted retype of the `untyped` bucket → `migrate --apply` (archives `[RESOLVED]` lessons) → keywords backfill → move the operator-confirmed `project`-typed set into `docs/learnings/` and open the reviewed learnings PR (gate 2 by hand, `lint` fail-closed). Three warnings the playbook expands on:

- Migration edits the **live store directly** (it is not the staging flow below) — take the tarball backup the playbook names before `--apply`.
- Requires Node ≥ 24 (`node:sqlite`); on older Node every verb no-ops with a message.
- The `project`-typed set becomes **public on merge** — the operator confirms it explicitly; the redaction lint is the net, not the decision.

## `evict` mode — undoing the migration

If the arguments contain **`evict`** (`/lessons-learned evict [slug…]`), do **not** run the housekeeping phases. Load [`references/migration.md`](references/migration.md) and execute its **Evict** section: return repo-root lessons to the local root (temperature preserved — repo `archive/` lands in local `archive/`), re-render the projection, and open the reviewed deletion PR. Two rules that section expands on:

- **Always ask the operator whether to also set `memory.commitLearnings: false`** in `.claude/war/config.json` (or via `/war-room`) — the default is `true`, so without the flip the next landed WAR phase repopulates `docs/learnings/` and the evict is temporary. Ask **before** moving any file; apply their answer; record a decline in the final report.
- Check for slug collisions between the roots before moving; diff and reconcile by hand — never clobber.

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
- Budget (from `consolidate-memory`): `MEMORY.md` should stay **< 200 lines and ~25 KB**. Compute **% full** on both axes; the byte axis usually binds.
- Gather the live-repo baseline the verifiers need: current version (`plugin.json`), top-level layout, recent merges (`git log --oneline --merges`), and where the code under audit actually lives.
- **Detect the repo root** — `docs/learnings/` in the audited repo (or the configured `overrides.learningsTarget`); call it `$REPO_ROOT`. Count its topic files too and report that count alongside the local inventory. When `$REPO_ROOT` exists and is **non-empty** and the local `MEMORY.md` **lacks any `[repo]`-marked rows** (a fresh clone that never adopted the repo lessons), run the **Setup seed render** — the same idempotent seed WAR Setup runs (Task 2, identical flag set; only the `<local>` path is environment-specific) — so the projection reflects the repo lessons before you inventory staleness, and **say so in the Phase 0 report**. This seed is the **sole** live-dir write in Phase 0 and is safe to run before the Phase 1 backup: it only reprojects the index from existing files (never touches a topic file), and, like the Phase 5 render, it regenerates `MEMORY.md` atomically (`.tmp` + rename) and idempotently.

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM" --repo "$REPO_ROOT"
  ```

  (Skip the seed only when the Node probe reports memory unavailable — Node < 24 / no `node:sqlite`.)
- **Report:** local file count, disk, `MEMORY.md` lines/bytes + % full, the `$REPO_ROOT` file count (and whether the seed render ran), and a one-line verdict on whether it is over/under budget.

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

- **Report:** counts by verdict and by recommendation; call out anything `stale` or low-confidence.

### 3 — Plan + the hub-link safety check (the step that prevents rot)

Before archiving anything, **check inbound links** for every `retire` / `merge` candidate:

```bash
cd "$STAGING" && grep -rl "\[\[<slug>\]\]" . | grep -v '^./MEMORY.md'
```

- **0–1 inbound refs, no durable residue** → safe to retire.
- **≥ 2 inbound refs** → it is a **concept hub**. A memory can be dead as a *bug warning* yet load-bearing as a *concept anchor* that siblings cite as "same family as …". **Do not delete it.** Downgrade to `keep-compress`: shrink it to a one-line `**RESOLVED (instance) — kept as concept anchor.**` stub and keep its index row.

**`retire` and `merge` archive, they do not delete.** A surviving hub-downgrade runs **first** (a `keep-compress` stub is never archived). For every candidate that survives the downgrade check, the action is `war-memory archive <slug>` — the lesson leaves the hot set but stays queryable in `archive/`. Knowledge is archived, never deleted (Commander's Intent: *knowledge is archived, never deleted*). A `merge` also folds the source's residue into the target first (Phase 4), then archives the source with a `merged into [[target]]` note.

Produce the final action plan: the bucketed table (keep / fix-anchor / compress / retire / merge), with the archive list and any hub-downgrades named explicitly.

- **Report:** the plan table and the hub-downgrade decisions, so the user sees what is about to be archived (the backup makes it reversible, but surface it anyway).

### 4 — Apply edits to STAGING (fan-out)

Author a `Workflow` over the `keep-compress` + `fix-anchor` + `merge` items (batches of ~5), each agent editing files **in `$STAGING`** and re-verifying against the live repo. Rules every editor must follow:

- **Preserve frontmatter exactly** (`name`, all `metadata.*` including `provenance`, `tags`, `relates`, `created`, `originSessionId`). Touch only the body — except a `fix-anchor` may correct a wrong `files:`/path in frontmatter.
- **`fix-anchor`:** re-anchor a drifted reference by **named construct** ("the `isHardGateEvidence` declaration in workflow-template.js"), **never a fresh line number** — line numbers rot (this repo's own `plan-line-number-refs-stale-use-construct-locator` lesson). Replace a stale quoted snippet with its current form.
- **`keep-compress`:** trim to (a) the durable rule stated tightly, (b) a one-line "fixed/landed in `<ref>`" note, (c) surviving `[[cross-links]]` and `**Why:**`/`**How to apply:**`. Cut dated per-release logs, long code snapshots, multi-phase bookkeeping.
- **`merge`:** fold the source's durable residue into the target (one sentence + a `relates` cross-link), then append a `merged into [[target]]` note to the source body. The source is **archived in Phase 5** (the editor does not archive it) — its content stays queryable in `archive/`.
- **Illustrative wikilinks pollute the graph.** Never write a real-looking `[[lowercase-slug]]` as an *example* in prose or an index summary cell — verify counts it as a link/row. Use plain words ("inbound links") or a non-ascii placeholder.

- **Report:** files edited, what was trimmed/re-anchored, and the new line counts of the biggest compressions.

### 5 — Archive, merge-source removal, index render (in STAGING)

- **Archive** the confirmed `retire` files and the `merge` sources — point the CLI at the staging root so the live dir stays untouched:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" archive --local "$STAGING" <slug>...
  ```

  This appends an archive note, `mv`s each into `$STAGING/archive/` (the local root is not a git repo, so a plain move — no `git mv`), and stays queryable. It does **not** delete. A `[[wikilink]]` into `archive/` is legal (safe-swap treats it as resolved, not dangling), so leave inbound links to an archived slug in place.
- **Fix only the frontmatter `relates:` entries** that point at an archived slug if you want the graph tidy — body `[[…]]` mentions may stay, since the target now lives in `archive/` and still resolves. (Contrast a true delete, which would orphan them — this pipeline no longer deletes.)
- **Render the projection** — the final, authoritative index rewrite is generated, not hand-typed (the projection is derived from the files; a hand-authored `MEMORY.md` summary is normalised away at the next render). **Pass `--repo <repo root>` when the repo root exists** (`docs/learnings/` in the audited repo, or the configured override) so the walk sees the repo-root lessons and re-marks their `[repo]` rows; omit it only when no repo root resolves:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$STAGING" --repo "$REPO_ROOT"
  ```

  `archive` already re-renders after archiving, so an explicit `render-index` here is the belt-and-suspenders final projection. It regenerates `$STAGING/MEMORY.md` atomically (`.tmp` + rename), drops archived rows, and keeps the table format and `[[slug]]` convention. If it refuses on budget (above the hard axis), archive more low-tier/old lessons and re-render.
- The staged copy of `war-memory-queries.jsonl` (the query log, if the corpus has one) **rides along inertly** in `$STAGING` — it is harmless in the swap and never indexed. Leave it; exclude it from the backup tarball only if backup size ever matters.

### 6 — Verify STAGING (the gate)

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/safe-swap.sh" verify "$STAGING"
```

It checks: every index row maps to a file (**hard fail**; rows carrying the trailing `[repo]` marker are skipped — their files live in the repo root, not the staged local dir), every file is indexed (warn), no dangling wikilinks (warn — a link resolving into `archive/` is **not** dangling, so archived-slug links are fine; investigate only links to a slug that exists in neither the hot set nor `archive/`), and `MEMORY.md` within budget (**hard fail** if over). **If it does not print `VERIFY: PASS`, do NOT swap** — fix `$STAGING` and re-verify. The live store is still pristine, so there is no rush.

### 7 — Atomic swap + final report

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/safe-swap.sh" commit "$MEM"
```

`commit` re-verifies staging itself and refuses to swap on failure, then moves `$MEM → $MEM.prev.<UTC>` and `$STAGING → $MEM`. Capture `PREV=`.

- **Report:** before/after `MEMORY.md` lines/bytes + % full, before/after file count and total disk, the buckets actioned (kept / compressed / re-anchored / retired / merged / hubs restored), and the backup + prev paths for reverting.

### 8 — Capture the meta-lesson (optional)

If the run surfaced a reusable housekeeping insight, write it as a new memory in the now-live `$MEM` (with an index pointer), following the auto-memory format. Then this skill's own pass is recorded for the next round.

## Resume & recovery (interruption)

| State on restart | What happened | Fix |
|---|---|---|
| `$MEM/MEMORY.md` present, `$MEM.staging` present | died before commit | discard staging, restart: `rm -rf "$MEM.staging"` |
| `$MEM` missing, `$MEM.staging` present | died **between** the two swap `mv`s | `safe-swap.sh recover "$MEM"` restores staging → live |
| `$MEM` missing, no staging | catastrophic | `tar xzf <newest lessons-learned.bak.*.tgz> -C <parent>` |

`safe-swap.sh recover "$MEM"` diagnoses and repairs the first two automatically. The backup tarball is always the fallback.

## Common mistakes

- **Editing the live dir instead of staging.** Defeats fault tolerance. All edits go to `$STAGING`; the live dir is read-only until `commit`.
- **Retiring a concept hub.** A `resolved` memory with several inbound links is a vocabulary node — keep it as a compressed anchor, or you orphan every sibling that cites it. Always run the Phase-3 grep.
- **Re-anchoring to a fresh line number.** It will rot again. Anchor by named construct.
- **Treating "the bug is fixed" as "stale".** That is `resolved` (compress, keep the rule), not `stale` (retire).
- **Illustrative `[[slug]]` in examples.** Pollutes the link graph and the verify report. Don't write example wikilinks that look real.
- **Deleting instead of archiving a `retire`/`merge`.** `rm` destroys knowledge; `war-memory archive <slug>` keeps it queryable. This pipeline archives — it never `rm`s a lesson.
- **Swapping on a `VERIFY: FAIL` or warnings you didn't read.** A link into `archive/` is legal (cold links resolve); the real rot is a link to a slug in neither the hot set nor `archive/`. Resolve those before committing.
- **Dropping `--repo` from the Phase 5 render on a repo-adopted store.** `render-index` re-derives the projection from the roots it is told to walk; if `$REPO_ROOT` exists but you render `--local` only, the walk never sees the repo lessons and the regenerated `MEMORY.md` **silently drops every `[repo]` row**. Always pass `--repo <repo root>` in Phase 5 when the repo root exists. (The **evict** re-render is the deliberate exception — it stays local-only *by design* so eviction drops the `[repo]` markers.)

## Note on write gates

Writing into the memory dir may trip this repo's `validate-servitor-provenance` / `validate-worktree-scope` hooks and any `GateGuard` fact-force prompt. These are **exempt for the main session and non-servitor agents** (the provenance gate fires only on `war-servitor` agent_type), so your edits pass — satisfy any fact-force prompt briefly and proceed. Always use **absolute paths with no `..`** segment.
