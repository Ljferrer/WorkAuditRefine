# Adoption playbook — migrating a flat memory corpus to the two-root store

One-time steps to move a pre-existing, flat memory store (a single `MEMORY.md` index + `[[wikilinked]]`
topic files, all in one dir) onto the two-root, archive-aware layout the `war-memory` CLI expects. WAR's
own 133-lesson corpus is the reference migration.

The migration is **mechanical (the `migrate` verb) + agent-assisted (retype, keywords backfill, the
reviewed PR)**. It runs against your live corpus, so read the whole playbook before starting.

## What the two roots are

- **Local root** — the un-tracked personal store (today's dir holding `MEMORY.md`). Everything routes
  here by default. Never committed.
- **Repo root** — an in-repo `docs/learnings/` dir, written **only** when `memory.commitLearnings` is on
  and a lesson is `metadata.type: project` and passes the redaction lint. Committed, human-reviewed.
- **Archive** — a `archive/` subdir under each root for cold (retired/merged/overflow) lessons. Still
  queryable; never deleted.

Set the roots by flag or env for every command below:

```bash
export CLAUDE_MEMORY_LOCAL="$HOME/.claude/projects/<project-slug>/memory"   # your live local root
export CLAUDE_MEMORY_REPO="$(git rev-parse --show-toplevel)/docs/learnings"  # repo root (only if committing)
cli() { node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" "$@"; }   # a function, so it works in bash and zsh
```

(or invoke `node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" <verb> …` directly, and pass
`--local <dir>` / `--repo <dir>` explicitly on each invocation.)

## Prerequisite — Node ≥ 24

`war-memory` needs `node:sqlite` (Node ≥ 24). On an older runtime every verb exits non-zero with a
one-line message and does nothing — no partial migration. Check `node --version` first.

## Step 1 — `migrate` dry-run (no writes)

```bash
cli migrate --local "$CLAUDE_MEMORY_LOCAL"
```

Dry-run is the default — it writes nothing. It prints the plan in four buckets:

- `→ repo root` — `type: project` lessons that *would* commit (only when you later pass
  `--commit-learnings`).
- `→ local root` — everything else; `[demoted]` marks a lesson a redaction-lint hit forced local.
- `→ archive` — `[RESOLVED]`-marked lessons that will move into `archive/`.
- `untyped (routed local, retype to commit)` — lessons with an absent or unrecognized
  `metadata.type`. **These are the ones to look at next.**

On WAR's corpus 46/133 lessons are untyped, so this list is long by design. Untyped is a **fail-safe
default**: a lesson is never committed to the repo until you deliberately type it `project`.

## Step 2 — retype the untyped files (agent-assisted, before `--apply`)

For each slug in the `untyped` bucket, decide its `metadata.type` and add it to the topic file's
frontmatter. Routing (`routeRoot` in `war-memory.mjs`):

| `metadata.type` | routes to | when |
|---|---|---|
| `project` | **repo root** | iff `commitLearnings` on **and** the lesson passes redaction lint |
| `user` / `feedback` | local root | always |
| absent / anything else | local root | always (fail-safe) |

Only type a lesson `project` if it is a durable, shareable engineering lesson with **no** personal paths,
emails, handles, or secrets — the redaction lint (Step 4 / gate 3) will demote it to local and report it
otherwise, but retype deliberately, don't rely on the net. Leave genuinely personal lessons untyped or
`user`; they stay local.

A fan-out `Workflow` (one agent per batch of ~5–8 slugs, each reading the lesson and proposing a type)
makes this tractable on a large corpus. The operator confirms the `project` set — it is the set that will
become public.

## Step 3 — `migrate --apply` (executes)

```bash
cli migrate --local "$CLAUDE_MEMORY_LOCAL" --apply
```

`--apply` creates `archive/` and moves the `[RESOLVED]`-marked lessons into it, then renders the
projection. Re-run the Step 1 dry-run first if you retyped a lot — confirm the buckets read the way you
expect before executing.

> Migration edits your live store directly (it is not the `/lessons-learned` staging flow). Take a backup
> first: `tar czf memory-premigrate.tgz -C "$(dirname "$CLAUDE_MEMORY_LOCAL")" "$(basename "$CLAUDE_MEMORY_LOCAL")"`.

## Step 4 — keywords backfill (agent-assisted fan-out)

The query verb weights `metadata.keywords` heavily (name/description/keywords/tags ≫ body), so a lesson
with no keywords is under-retrievable. Backfill 3–8 synonym aliases a future searcher would actually type
onto every lesson. Keywords are **nested under `metadata:`** as `metadata.keywords` — an inline or block
YAML list:

```yaml
---
name: some-lesson-slug
description: One-line durable rule.
metadata:
  slug: some-lesson-slug
  type: project
  provenance: code-verified
  keywords: [flat index, byte ceiling, race, projection]
---
```

Fan out a `Workflow` over the corpus (batches of ~5–8), each agent reading the lesson and authoring the
keyword list, preserving all other frontmatter exactly. Keywords feed the in-memory FTS5 index at query
time (they are not stored in the projection), so no re-render is strictly required — but render once to
confirm the corpus still parses and stays within budget:

```bash
cli render-index --local "$CLAUDE_MEMORY_LOCAL"
```

## Step 5 — the reviewed learnings PR (gate 2's first use)

This is the first time the **repo root** is populated and committed — gate 2 (post-render lint + commit)
run by hand. A lesson's root is decided by **which directory the file physically sits in**: the CLI never
relocates a lesson into the repo root for you (`migrate --apply` only archives `[RESOLVED]` lessons;
`render-index` only ever writes the local `MEMORY.md` — no repo-root projection is ever written). So:

1. Confirm committing is on for this repo (`memory.commitLearnings` — opt-in / off by default; `/war-room`
   turns it on; check `.claude/war/config.json`) — the operator signal that
   `project`-typed lessons may travel.
2. **Move the confirmed `project`-typed files into the repo root** — the set the dry-run reported under
   `→ repo root`, minus anything you decided to keep local. `mkdir -p "$CLAUDE_MEMORY_REPO"` then move each
   file (a plain `mv` from the local root, or author it fresh under `docs/learnings/`).
3. **Lint the repo root directory-wide** — the fail-closed redaction gate; any hit (home path, email,
   handle, credential shape) exits non-zero, so fix or move it back to local before committing:

   ```bash
   cli lint "$CLAUDE_MEMORY_REPO"
   ```

4. Re-render so the projection reflects the moved files — repo-root rows now carry a trailing `[repo]`
   marker in the union projection (`render-index` still writes only the local `MEMORY.md`; pass `--repo`
   so the walk sees the repo-root lessons and marks them):

   ```bash
   cli render-index --local "$CLAUDE_MEMORY_LOCAL" --repo "$CLAUDE_MEMORY_REPO"
   ```

5. **Ensure the target repo's `CLAUDE.md` carries the pointer line** (append-if-absent — create `CLAUDE.md`
   if it does not exist, never rewrite or reorder existing operator content), so every plain Claude Code
   session in a fresh clone inherits the lessons ambiently. It rides **this same reviewed PR**. The
   **ratified pointer line** (byte-identical across every surface that emits it):

   > 📚 **Durable engineering lessons live in `docs/learnings/`** — one fact per Markdown file, provenance-tagged frontmatter. Before changing a subsystem, read the lessons that name it (plain Read/Grep, or ranked retrieval via the `work-audit-refine` plugin's `war-memory` query).

6. Commit the repo root **and the `CLAUDE.md` pointer** on a branch and open a PR: `git add docs/learnings
   CLAUDE.md && git commit -m 'docs(learnings): adopt two-root memory store'`. The CI gate
   (`.github/workflows/memory-audit.yml`) re-runs `lint docs/learnings/` on the PR — the same fail-closed
   check, now automated. Every published lesson is human-reviewed like code before it lands.

After this PR merges the repo root travels with the repo and compounds across the team. The local root
keeps carrying everything untyped/personal, exactly as before.

## After migration

- `/lessons-learned` housekeeping rounds now **archive** (not delete) retired/merged lessons, and the
  final projection step is `render-index` — see [`SKILL.md`](../SKILL.md).
- A staged `war-memory-queries.jsonl` query log may appear in the local root; it is inert and never
  indexed.

## Evict — undoing the migration

`/lessons-learned evict` reverses Step 5: repo-root lessons return to the local root and the repo stops
carrying learnings. Like the migration, it is a **reviewed git change** (it deletes repo content), not
just a file move. No lesson is ever deleted — eviction only relocates.

1. **Preflight.** Resolve both roots (same env/flags as the top of this playbook); require a clean git
   tree and a non-empty repo root. Default scope is the **full** repo root, hot + `archive/`; a
   selective evict names slugs as extra arguments (`/lessons-learned evict <slug>…`).
2. **Ask about the flag — always, and first.** Ask the operator whether to also set
   `memory.commitLearnings: false` (edit `.claude/war/config.json`, or via `/war-room`). `commitLearnings`
   is opt-in / off by default, but a populated repo root means it was turned **on**, so an evict
   **without** flipping it back off is temporary: the next landed WAR phase repopulates `docs/learnings/`.
   Apply their answer before moving any file; if they decline, say so in the final report so the
   repopulation surprise is on record.
3. **Collision check.** For each evictee, confirm the local root (hot **and** `archive/`) has no file
   with the same slug. A hit means the lesson exists in both roots — diff and reconcile by hand (keep
   one, fold residue into it) before evicting. Never clobber.
4. **Move, preserving temperature.** `mv` repo hot → local hot, repo `archive/` → local `archive/`.
   (`git mv` cannot cross out of the repo; plain `mv` then `git add -A docs/learnings/` records the
   deletions.) Frontmatter travels untouched — `type: project` stays, so re-migrating later is just
   Step 5 again. The **`CLAUDE.md` pointer is left in place by default** (harmless once the dir empties, and
   it points at a path a future re-migration restores); removing it is a call to make in the eviction PR.
5. **Re-render + verify.** `cli render-index --local "$CLAUDE_MEMORY_LOCAL"` — evicted rows lose their
   trailing `[repo]` marker automatically (root = physical location). The local index re-absorbs the
   rows; on a budget REFUSE, archive low-tier lessons by **explicit slug** (never `--candidates`) and
   re-render.
6. **The eviction PR.** Commit the `docs/learnings/` deletions on a branch and open a PR — eviction is
   human-reviewed like the migration was. CI's `memory-audit` gate fails open once the dir is absent.
