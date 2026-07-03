# WAR compounding memory — files-canonical two-root store, in-memory SQLite index, per-seat JIT retrieval

**Status:** grilled and operator-ratified 2026-07-03; adversarially verified against the codebase the
same day (7-seat verification workflow, 58 checks, 42 findings absorbed into this revision — see §11).
Companion ADR: [`0015`](../adr/0015-files-canonical-memory-with-derived-index.md). The executable plan
is authored separately via `/war-strategy`.

## Commander's Intent

- **Purpose:** the memory corpus must compound **without bound** while never again hitting the flat-index
  failure of 2026-07-03: a hand-maintained `MEMORY.md` approaching the 24.4KB hard read limit, two
  processes racing rewrites of it ("File has been modified since read"), and a compaction target met only
  by **deleting durable lessons**. Learnings must also **transfer between machines and users through git**
  so the memory system becomes the compounding, portable moat — not a per-machine archive.
- **Method:** invert the P0 recommendation — lesson **files stay canonical**; the SQLite/FTS5 index
  (builtin `node:sqlite`, zero new dependencies) is **built in memory per invocation** and never persists.
  Split the corpus into two roots (committable repo root, private local root) both already allowlisted by
  the existing scope hook. `MEMORY.md` becomes a **generated projection** capped by *selection*, never by
  deletion; overflow is resolved by **archiving** (a file move, still indexed and queryable forever).
  Retrieval is **Lead-prefetched per seat** and injected into agent prompts following the `intentClause`
  threading pattern — zero new agent capabilities, zero guard widening. Publication is gated
  **fail-closed** (redaction lint → PR review → repo CI); retrieval fails **open**.
- **End state** (each condition individually checkable — §10 maps them to tests):
  1. No process hand-edits `MEMORY.md`: the projection is written only by whole-file atomic render, and
     two concurrent lesson writers touch distinct files — the index race is structurally impossible.
  2. The corpus grows unboundedly while the hot index stays under budget: archiving moves files, deletes
     nothing, and archived lessons still surface in `query` results.
  3. The index is built from committed + local text alone, per invocation — **no derived state outlives
     a process**, so there is nothing to corrupt, back up, or migrate.
  4. Every worker / auditor seat / fix-worker / servitor spawn receives its **own** retrieved memory
     block (unique query per seat), capped by the CLI at a stated byte budget.
  5. Retrieval failure (no CLI, old Node, query error) never blocks a phase — the run proceeds
     lesson-less and the ledger says so.
  6. No lesson containing lint-flagged private content can reach the repo root: it is demoted to the
     local root and reported, never silently committed.
  7. Servitor confinement is byte-identical: same tool allowlist, same two hooks, no widening.
  8. Two users adding or archiving **different** lessons merge in git with zero conflicts — the repo
     root carries **no generated shared file** — and `war-memory consolidate` flags near-duplicates
     for curation after a merge.

## 1. Context — the gap

The servitor writes durable learnings as one-file-per-lesson markdown plus a hand-maintained `MEMORY.md`
index table (`agents/war-servitor.md`, admission disciplines D1–D4). Two structural failures emerged at
~133 lessons (count as of 2026-07-03):

- **The index is a shared mutable file.** The servitor's D4 updates rows in place; interactive sessions
  append rows per the auto-memory convention; a consolidation hook compacts it concurrently. Result:
  write races, byte-length churn mid-edit, and retry loops through the fact-forcing gate.
- **The index budget is met by deletion.** `MEMORY.md` must stay under ~17KB advisory / 24.4KB hard read
  limit (`safe-swap.sh` hard-fails above 200 lines / 25KB — a related but distinct budget). Past the
  fat-summary trims, the residual bulk is slug strings and table syntax — so staying under budget means
  dropping durable-lesson rows, i.e. destroying indexed knowledge. There is also **no retrieval**: a
  lesson helps only if it survives into the auto-loaded index and a human-sized context;
  `docs/learnings/` fallback files are write-only.

Nothing injects memory into WAR's agents today. The one context-injection pattern is Commander's Intent
(`args.intent` → `intentClause`), threaded at the worker, auditor, ace, gate-audit, polish-sweep and
servitor spawn sites in `skills/war/assets/workflow-template.js` — notably **not** at the refiner or the
fix-worker/add-test dispatches.

## 2. Pivotal constraints

1. **Prompts are built inside the sandboxed Workflow script** — no filesystem or Bash at prompt-build
   time. Anything injected must arrive via `args` (Lead-side prefetch) or an agent's own tools.
2. **The servitor has no Bash** (ADR 0002 / F01 D1) and its writes are gated by two PreToolUse hooks:
   path scope (`*/.claude/projects/*/memory/*` or `*/docs/learnings/*` — `hooks/validate-worktree-scope.sh`)
   and provenance frontmatter (`hooks/validate-servitor-provenance.sh`). Both ride the
   `Write|Edit|NotebookEdit` matcher (the provenance gate content-checks Write only); **Bash never
   triggers either** ([[scope-hook-blind-to-bash-write-path]]). The design must not create a Bash-side
   **lesson-write** path for the servitor. (Bash-side writes of *derived* artifacts — the Lead's
   projection render, a worker's query-log append — are accepted residuals of the existing Bash-blind
   surface, and none of them writes a lesson.)
3. **The auditor's Bash guard allows read-only git only** — an auditor cannot run a retrieval CLI
   without widening a security hook.
4. **Binary files do not merge in git** — and neither do two regenerations of a shared generated text
   file. Anything committed that two users can both rewrite must be one-fact-per-file text.
5. **`node:sqlite` requires Node ≥ 24** (verified: v24.17.0 ships `DatabaseSync` + FTS5, SQLite 3.53.0).
   WAR has no `package.json` and adds no npm dependency for this feature.
6. **WAR is a public MIT repo.** Committing memories is publishing them; the corpus today mixes repo
   learnings with account names, absolute home paths, and billing notes.
7. **Claude Code auto-loads** `~/.claude/projects/<proj>/memory/MEMORY.md` (first ~200 lines / 25KB) at
   session start; the hard read cap on any single file is ~24.4KB. (The 24.4KB/17KB figures are
   platform-observed and operator-hook-advisory respectively — they are not constants defined anywhere
   in this repo; `safe-swap.sh`'s own 200-line/25600-byte budget is a separate trench.)
8. The Lead has Bash and resolves config, gate, and learnings target at run Setup
   (`skills/war/SKILL.md`); tasks are decomposed just-in-time at each phase's start — so per-task
   retrieval can only run at **phase launch**, in the Lead's Bash context, after decompose.

## 3. Resolved design tree (operator-ratified 2026-07-03; verification-hardened same day)

| # | Decision | Resolution |
|---|----------|-----------|
| Q1 | Substrate & dependencies | Builtin `node:sqlite` + FTS5 only. **No sqlite-vec, no embeddings, no npm deps.** Node ≥ 24 floor documented. Semantic recall approximated by servitor-authored `keywords:` at capture time. Upgrade trigger: operator-observed irrelevant/empty memory blocks (the query log supplies the query-side evidence). |
| Q2 | Canonical substrate | **Files canonical; the index is derived and maximally disposable — built in `:memory:` per CLI invocation, never written to disk.** (Verification hardened the ratified "disposable, full-rebuild-every-time" decision to its logical end: the persistent DB file, fingerprint dirty-check, and corruption story were ceremony around a sub-second rebuild.) |
| Q2b | Containers | **Text-only committing.** Archive = plain per-lesson `.md` in `archive/` (git packfiles already compress); no gzip, no committed binary, and no committed generated index (see Q6). |
| Q3 | Committable/local split | **Two roots, one union index.** Repo root `docs/learnings/` (committable) + local root `~/.claude/projects/<proj>/memory/` (private). Routing by `metadata.type` with a fail-safe default (untyped/unrecognized → local); fail-closed redaction lint; PR review = 2nd gate; WAR-repo CI memory audit = 3rd gate. `memory.commitLearnings` defaults **false** unless `/war-room` explicitly enables it. Lead renders + commits repo-root learnings post-servitor. |
| Q4 | Schema | **One new frontmatter field: `keywords:`.** Temperature is *location* (hot dir vs `archive/`), not a status field. Killed: `kind`, TTL, scope/repo/branch columns, stored salience, retrieval stats, reserved embedding column. Query log (local JSONL) records queries + result scores — it can show empty/low-score rates and query distribution; it **cannot measure misses**. v1 salience = provenance tier + recency; absent provenance ranks as `agent-unverified`. |
| Q5 | Retrieval (P1) | **Lead prefetch, per seat.** Query = task title + plan slice + role/lens descriptor ⇒ one unique result set per agent. topK default **10** (`/war-room`-configurable); ~4KB byte budget is a CLI flag with a fixed default (not a config key). Workers/auditors/fix-workers per-task; servitor **phase-scoped** (findings don't exist at prefetch time; the Workflow cannot exec). Refiner excluded. Retrieval fails **open**; workers may self-query mid-task. |
| Q6 | Projection & race | **One** projection: the local union `MEMORY.md`, generated-only (atomic temp+rename), rendered by the Lead each phase and by curation verbs. The repo root carries **no generated file** (a committed regenerated table is a guaranteed merge-conflict surface — it would break E8). Servitor D4 deleted (standing file, dispatched prompt line, and `memory_index_updated` result field). Hand-appends tolerated and normalized at next render. Render refuses above **either** budget axis (24.4KB bytes / 200 lines); below that, ≥17KB warns with ranked archive candidates. Hot ≡ indexed invariant. |
| Q7 | Curation & migration | `retire`/`merge` **recommendations** → archive (never delete; verdicts inform, recommendations act); merge-sources archived with a `merged into [[target]]` note; `/lessons-learned` gains a final render step; mechanical `archive` verb shared by human and skill. Migration = one-time adoption verb (dry-run default) + shipped playbook, for corpora predating this design. |

## 4. Mechanics

### 4.1 Store layout — two roots, one in-memory index

```
<repo>/docs/learnings/            # repo root (committable) — used only when commitLearnings
  <slug>.md                       #   hot lessons (one file per lesson, frontmatter per §4.2)
  archive/<slug>.md               #   cold lessons (same format; moved here, never deleted)
                                  #   NO generated files here — nothing to merge-conflict on

~/.claude/projects/<proj>/memory/ # local root (private, never committed)
  <slug>.md                       #   hot lessons (user/feedback/untyped + lint-demoted lessons)
  archive/<slug>.md               #   cold lessons
  MEMORY.md                       #   THE projection: union of both roots' hot rows (auto-loaded)
  war-memory-queries.jsonl        #   query log: {ts, query, seat, topSlugs, scores}. Never committed.
```

There is **no database file** — the FTS index lives in `:memory:` for the life of one CLI invocation
(§4.3), so nothing derived needs gitignoring, backing up, or healing. Both roots fall under the
servitor scope hook's existing globs — **zero hook changes**. One standing constraint restated: a
`learningsTarget` override must itself match the hook's `*/docs/learnings/*` glob (or the memory glob);
values outside it are hook-denied for the servitor — unchanged from today.

`overrides.learningsTarget` survives with narrowed meaning: a non-null value overrides the **repo-root
path** (default `docs/learnings/`). The local root is fixed. The old either/or fallback (no local dir →
write to `docs/learnings/`) is retired: the local root is always creatable, and the repo root is used
iff `memory.commitLearnings` is true. *This is a deliberate behavior change*, called out in §5.

### 4.2 Lesson file format — one new field

Existing frontmatter is untouched (`name`, `description`, `metadata.{type, provenance, slug, phase,
tags, created}`) — the provenance gate keeps working unmodified. One addition:

```yaml
metadata:
  ...
  keywords: [worktree-hang, ancestor-walk, infinite-loop, relative-path]  # NEW, optional
```

`keywords` are servitor-authored synonym aliases written at capture time — write-time semantic
expansion in place of embeddings. Optional: legacy lessons without it index fine (title/description/
body/tags still match); the migration backfills it.

**Archive note convention:** archiving appends one body line —
`> archived 2026-07-03: resolved — <one-line reason>` (or `merged into [[target]]`). Temperature itself
is the file's location; there is no status field to drift.

### 4.3 The CLI — `skills/_shared/war-memory.mjs`

Zero-dependency Node ≥ 24 script (`node:sqlite`, `node:fs`). Every invocation walks both roots
(hot + `archive/`), parses frontmatter, and builds the FTS5 index **in `:memory:`** — each row carrying
its source root (repo/local) and temperature (hot/cold). At ~10³ lessons this is sub-second; there is
no persistent index, no fingerprint, no schema versioning, and no corruption story *by construction*.
(If a future corpus makes per-invocation builds measurably slow, a persistent cache is the recorded
upgrade — see §8.) Verbs:

- **`query <text> [--seat <label>] [--top-k N] [--budget BYTES]`** — translates raw text to an FTS5
  OR-query of significant terms (callers stay dumb), ranks with `bm25()` weighted
  name/description/keywords/tags ≫ body, orders by (BM25, provenance tier, recency) — a lesson without
  `metadata.provenance` ranks as `agent-unverified` — truncates to top-k and byte budget, appends one
  line to the query log, and prints the ready-to-inject prompt block (§4.5). That block is the only
  output format; a JSON mode can be added when a caller that parses it exists.
  **`--queries <file>`** batches N labeled queries through one process (one corpus walk, N result
  blocks) — the Lead's per-seat prefetch is one invocation per phase, not one per seat.
- **`render-index`** — regenerates the local union projection atomically (write `MEMORY.md.tmp`,
  rename). Row format is today's table row plus provenance marker. Budget behavior in §4.4.
- **`archive <slug>... | --candidates`** — the one mechanical mover: `git mv` in the repo root, plain
  `mv` in the local root (not a git repo), append the archive note, then re-render. `--candidates`
  applies the renderer's current overflow list. Callers: the operator (on renderer warning) and
  `/lessons-learned` (its retire/merge-source arms).
- **`consolidate`** — the post-merge linter: re-render, then for each lesson changed since the merge
  base, FTS-query the rest of the corpus and **flag** near-duplicate pairs (report only — merging is
  `/lessons-learned`'s judgment, never automated).
- **`lint [<paths>]`** — the redaction lint (§4.6), exposed standalone for the Lead's pre-commit check
  and for CI. The pattern list is a hardcoded array in this script — extending it is editing one array
  in a zero-dep file the operator owns; a config knob for it was considered and cut (no consumer).
- **`migrate [--apply]`** — the adoption verb (§4.8). Dry-run by default.

Failure discipline: on Node < 24 every verb exits non-zero with one clear line
(`war-memory: requires node:sqlite (Node >= 24); memory features disabled`). No verb ever blocks a WAR
run (§4.5 fail-open).

### 4.4 The projection — generated-only, capped by selection

- **Nobody hand-edits `MEMORY.md` again** — not the servitor (D4 deleted in all three places it lives:
  the standing file, the dispatched wrap-up prompt, and the `memory_index_updated` result field), not
  hooks, not humans. Writers write lesson files; the projection is a render artifact. Hand-appends by
  interactive sessions following the stock auto-memory convention are *tolerated*: the next render
  absorbs the lesson file and regenerates the table normalized (renders are idempotent).
- **When renders happen:** the Lead runs `render-index` after the servitor returns each phase (before
  the learnings commit, §4.6); `/lessons-learned`, `archive`, `consolidate`, and `migrate` all end by
  rendering. No watcher, no hook — a bounded set of named trigger points.
- **Invariant: hot ≡ indexed.** Every hot lesson gets exactly one row; the renderer never silently
  drops one. Cold lessons appear in no projection (query-only).
- **Budget:** at ≥ 17KB — render succeeds with a loud warning + ranked archive candidates (lowest
  provenance tier, then oldest; absent provenance ranks lowest). Above **either** hard axis — 24.4KB
  bytes or 200 lines — render **refuses** (past the read cap the file is useless anyway); the fix is
  one `archive --candidates` away. At the observed ~134 bytes/row, ~110–120 hot lessons fit; the
  current 133-lesson corpus (18.6KB projection) triggers candidates immediately, by design.
- `safe-swap.sh verify` keeps its existing 200-line/25KB hard-fail as belt-and-suspenders; because the
  renderer refuses on both axes first, verify passes by construction.

### 4.5 Retrieval (P1) — Lead prefetch, per seat, threaded like intent

At **each phase's launch** — in the same Lead Bash context that resolved gate/config at run Setup,
immediately after the just-in-time task decompose — the Lead runs **one batched `query --queries`
invocation** covering every prospective seat (skipped entirely when `memory.retrieval` is `false`):

- **worker / fix-worker (per task):** `<task title> <plan slice> implementer pitfalls`
- **auditor (per task × per roster seat):** `<task title> <plan slice> <lens> <lens catalog line>` —
  distinct lenses pull distinct lessons, which *decorrelates* the seats rather than biasing them
  identically.
- **servitor (per phase):** all task titles + slices + "memory dedup capture" — phase-scoped because
  audit findings do not exist at prefetch time and the sandboxed Workflow cannot exec (§2.1); archive
  near-dupes are caught post-hoc by `consolidate`.
- **refiner:** none — its discipline is procedural, already in its prompt.

The CLI emits the blocks; the Lead threads a map into the Workflow as `args.memory`
(`{ byTask: {t1: {worker, seats: {lens: block}}}, servitor: block }`), and the template concatenates a
`memoryClause` at the worker, auditor, fix-worker, add-test and servitor spawn sites, **following** the
`intentClause` threading pattern. Precision note from verification: the fix-worker and add-test
dispatches carry no `intentClause` today, so those two are *new* injection points, not mirrors; the
ace / gate-audit / polish-sweep sites (which do carry intent) get **no** memoryClause in v1 — their
inputs are a specific finding or an executed gate output, not a fresh implementation problem. Injected
line format:

```
PRIOR LESSONS (memory — trust per provenance tag):
- [slug] (code-verified, phase 3): <description> — <how-to-apply line if present>
```

Defaults: `topK: 10` (a `/war-room`-configurable config key) and a ~4KB per-block byte budget (a CLI
flag with a fixed default — deliberately not a config key), **enforced by the CLI** — the first hard
token-shaped cap in WAR. Empty result ⇒ empty clause ⇒ prompt byte-identical to today. Any prefetch
failure ⇒ empty clause + one ledger line (`memory: prefetch failed (<reason>) — phase ran
lesson-less`). **Retrieval fails open; publication fails closed** — enhancement vs. irreversibility.

Workers additionally get one prompt line: they *may* run
`node <plugin>/skills/_shared/war-memory.mjs query '<terms>'` mid-task when they hit something
unfamiliar (workers have Bash; no other role gains anything). Its only side-effect write is the
query-log append in the local root — an accepted Bash-blind residual per §2.2, and never a lesson.

### 4.6 Publication path — three gates, fail-closed

Routing at write time (servitor prompt): `metadata.type: project` → repo root **iff**
`memory.commitLearnings`, else local root; `user`/`feedback` → local root, always; **absent or
unrecognized `type` → local root** (fail-safe — a lesson is never committed by default; the live
corpus has 46/133 untyped files, so this default is load-bearing, and `migrate` reports untyped files
in its dry run).

1. **Gate 1 — redaction lint** (`war-memory lint`, run inside `render-index`, `migrate`, and by the
   Lead before the learnings commit): hardcoded deterministic patterns — absolute home paths
   (`/Users/<name>`, `/home/<name>`), email addresses, **account handles / @-mentions and
   git-host account-name patterns**, and credential-shaped strings (`ghp_…`, `github_pat_…`, `sk-…`,
   `AKIA…`, PEM headers). A flagged repo-root lesson is **demoted to the local root and reported** —
   never committed, never dropped. Matches WAR's escalate-don't-guess doctrine.
2. **Gate 2 — post-servitor render + commit.** After the servitor returns, the Lead runs
   `render-index`, runs `lint` over the repo root, then commits repo-root learnings
   (`docs(learnings): phase N`, working branch). Precedent for the Lead authoring docs in its
   working-branch checkout: the ADR-promotion duty in `skills/war/SKILL.md`'s phase-report step
   ("Promote any ADR-worthy deviation to a real `docs/adr/` entry"); this is the first place SKILL.md
   states explicit Lead commit mechanics. Every published lesson thereby rides the phase PR and is
   human-reviewed like code.
3. **Gate 3 — CI (WAR's own GitHub repo only, not plugin code):** `.github/workflows/memory-audit.yml`
   runs `war-memory lint docs/learnings/` (directory-wide — simpler than diff-scoped and strictly
   stronger) on every PR. It is the only automated enforcement on a hand-committed lesson that never
   went through the CLI; enforced-by-CI, deliberately not unit-validated (§10 note).

### 4.7 Config & `/war-room`

`war-config.mjs` gains one block (defaults shown) **and** `validate()` gains its type checks
(`retrieval`/`commitLearnings` boolean, `topK` integer ≥ 1) — the module's stated doctrine is "no
accepted-but-ignored keys", so the new block must be validated like every other:

```json
"memory": { "retrieval": true, "topK": 10, "commitLearnings": false }
```

`memory.retrieval: false` has exactly one reader: the Lead skips the prefetch step (§4.5).
`/war-room` gains two asks — (a) **topK** (with the balanced default), and (b) **commitLearnings** —
an explicit question with the pitch ("commit distilled, lint-scrubbed engineering lessons so they
travel with the repo and compound across your team; existing `docs/learnings/` presence is a signal
you already do"). Unconfigured runs keep `false`. Its frontmatter description must also name the
memory asks ([[default-flip-must-audit-all-doc-surfaces]]). While in `references/schemas.md`, refresh
the **whole** run-config jsonc literal — it currently omits `run.ace/provision/provisionSource/
provisionAuto` and would otherwise go a fourth key stale.

### 4.8 Curation retrofit & migration

**/lessons-learned:** verdicts keep their meanings; the *actions* change — the `retire` and `merge`
**recommendations** now route through the `archive` verb (retire → archive; merge-source → fold
content into target, then archive with the merged-into note; the hub-link downgrade to
`keep-compress` still applies first). So even merged-away lessons stay queryable. The staging /
verify / atomic-swap machinery needs **two** taught rules, not zero: (1) a `[[wikilink]]` resolving
into `archive/` is **not dangling** — cold links are legal; (2) the index-row↔file hard-fail becomes
**root-aware** — union-projection rows for repo-root lessons resolve against the repo root, not the
staged local dir (without this, no swap can complete once `commitLearnings` is enabled). The staged
copy of `war-memory-queries.jsonl` rides along inertly — harmless, or excluded from the tarball if
backup size ever matters. The pipeline gains a final step: `war-memory render-index`.

**Migration (one-time adoption verb + shipped playbook** — for corpora predating this design; WAR's
own 133-lesson corpus is the reference migration**):** `war-memory migrate` (dry-run default;
`--apply` to execute) mechanically: detects the legacy layout, splits routes (`type` + lint →
repo-root candidates vs. local; untyped files reported and routed local unless the operator retypes
them), creates `archive/`, moves `[RESOLVED]`-marked and renderer-overflow candidates into it, renders
the projection. The playbook (`skills/lessons-learned/references/migration.md`) adds the
agent-assisted steps: a keywords-backfill fan-out over the corpus, and the reviewed PR that lands the
repo root (gate 2's first use).

### 4.9 Servitor deltas (prompt + standing file + result contract — no capability change)

- **D1 (dedup):** unchanged mechanics, better inputs — reads the union projection as today, plus the
  Lead-prefetched phase-scoped related-lessons block; may update an *archived* lesson in place (both
  roots' globs already allow it) but never moves temperature — un-archiving is a curation act.
- **D4 (index hygiene): deleted everywhere it lives** — the standing-file discipline
  (`agents/war-servitor.md`), the *second* independent append-pointer instruction in that file's
  Inputs section ("append a one-line pointer to `MEMORY.md`"), the dispatched wrap-up prompt's D4
  line in `workflow-template.js`, and the `memory_index_updated` field in the ServitorResult contract
  (standing file Return block, `references/schemas.md`, and the workflow result schema). The servitor
  writes lesson files only; the existing D4-presence tests invert to assert **absence**
  ([[standing-instruction-vs-dispatched-prompt-coverage-split]] — one commit, both surfaces).
- **New duty:** author `keywords:` (3–8 synonym aliases a future searcher would type) on every lesson.
- Routing rule per §4.6 stated in the standing file; the dispatched prompt names the concrete root
  path(s) for this run.

## 5. Surface changes

| Surface | Change |
|---|---|
| `skills/_shared/war-memory.mjs` | **NEW** — the CLI (§4.3), zero-dep, Node ≥ 24, in-memory index |
| `skills/_shared/war-memory.test.mjs` | **NEW** — unit suite (§10); auto-discovered by the existing gate |
| `agents/war-servitor.md` | D4 + Inputs append-pointer instruction deleted; `memory_index_updated` retired from Return block; keywords duty; routing rule; archive-update rule (§4.9) |
| `skills/war/SKILL.md` | Setup: two-root resolution replaces the either/or fallback (**behavior change**: `docs/learnings/` written iff `commitLearnings`); Node probe; per-phase batched prefetch step after decompose; post-servitor render + lint + learnings commit |
| `skills/war/assets/workflow-template.js` | `args.memory` threading; `memoryClause` at worker/auditor/fix-worker/add-test/servitor sites (fix-worker + add-test are new injection points); wrap-up prompt's D4 line deleted; `memory_index_updated` dropped from the ServitorResult schema |
| `skills/war/assets/war-config.mjs` | `memory` block + `validate()` checks (§4.7) |
| `skills/war/references/schemas.md` | `memory` block documented; `memory_index_updated` retired from ServitorResult; full run-config jsonc literal refreshed (§4.7) |
| `skills/war-room/SKILL.md` | two new asks (`topK`, `commitLearnings` pitch) + frontmatter description update |
| `skills/lessons-learned/SKILL.md` | retire/merge recommendations → archive verb; final render step |
| `skills/lessons-learned/assets/safe-swap.sh` | archive-aware wikilink rule + root-aware index-row check (§4.8); budget check unchanged |
| `skills/lessons-learned/references/migration.md` | **NEW** — the adoption playbook (§4.8) |
| `CONTEXT.md` | new Memory terms (§6) |
| `docs/adr/0015-…` | **NEW** — companion ADR |
| README / war-help | memory feature + Node ≥ 24 note for it |
| `.github/workflows/memory-audit.yml` | **NEW, WAR repo only** — gate 3 (not plugin code; the repo's first Actions workflow) |
| Version slots ×4 | operator-owned bump at land time ([[release-bump-slots-canonical-no-badge]]) |

Out of plugin scope, documented as guidance only: retargeting the operator's personal PostToolUse
size-warn hook from "compact by hand" to "run `war-memory render-index`"; `/consolidate-memory`
sessions should defer index hygiene to `render-index`/`consolidate` — lesson-content merging remains
`/lessons-learned`'s job.

## 6. New domain terms (CONTEXT.md)

Memory root (repo/local) · Hot set · Cold set (archive) · Index projection · Derived memory index ·
Redaction lint · Memory prefetch. Definitions land in `CONTEXT.md`'s existing `### Memory` section
(glossary-only wording). "Reindex" is deliberately folded into *Derived memory index* — with an
in-memory index there is no reindex verb to name.

## 7. Recommended ADRs

One: [`0015-files-canonical-memory-with-derived-index.md`](../adr/0015-files-canonical-memory-with-derived-index.md)
— files-canonical vs. SQLite-canonical inversion, text-only committing, temperature-is-location.
All three sub-decisions are hard to reverse, surprising without context, and the product of real
trade-offs; nothing else here clears that bar.

## 8. Open risks / implementation notes

- **FTS quality on short queries** is the load-bearing bet. Mitigations: keywords field, OR-expansion,
  BM25 field weights, and the query log as query-side evidence (empty/low-score rates and query
  distribution — it cannot measure misses; the honest upgrade trigger is operators/agents repeatedly
  seeing irrelevant or empty memory blocks). The declared vector upgrade path if that happens:
  sqlite-vec **plus a persistent embedding cache keyed by content hash** (recompute-expensive values
  cannot live in an index that never outlives a process — the "reserved embedding column" was dropped
  for exactly this reason).
- **Per-invocation rebuild cost:** sub-second at current scale; the batched `--queries` mode already
  amortizes the corpus walk across a phase's seats. If a future corpus makes builds measurably slow,
  a persistent cache file is the recorded upgrade — added when measured, not before.
- **Seat correlation:** per-seat queries mitigate; residual overlap is provenance-labeled.
- **Prompt bloat:** capped at CLI level (~4KB/block); topK is the pressure valve.
- **Two machines, one local root each:** local-root lessons do not travel (by design — they're
  private). Only the repo root compounds across machines/users.
- **Grep noise from `archive/`:** archived prose can match repo-wide greps run by future workers;
  accepted (scoped greps dominate) — revisit only if it demonstrably misleads an agent.
- **Line refs in this spec** will drift; anchor by construct at implementation time
  ([[plan-line-number-refs-stale-use-construct-locator]]).

## 9. Non-goals / deferred

Vectors/embeddings (declared trigger + cache path in §8); a persistent index/DB file (deferred until a
measured rebuild cost demands it); committed generated projections in the repo root (a browsable
GitHub index can be added later *with* a union-merge driver or regenerate-on-merge rule — not before);
gzip archives or any committed binary (ADR 0015); a JSON output mode for `query` (add when a parsing
caller exists); configurable lint patterns (the array lives in the script); any server/daemon
(Zep/mem0/Letta class); GraphRAG/knowledge graphs; a codebase embedding index (agentic grep stays
correct for code); retrieval-stat-driven salience in v1 (log first, wire later); cross-repo global
memory bus; background watchers/pollers (memory is never a `held:*` hold); CRDT/auto-merge of
duplicate lessons (curation judgment stays human-gated); per-role retrieval matrix; refiner/ace/
gate-audit/polish injection.

## 10. Validation criteria (concrete, testable)

Unit (`war-memory.test.mjs`): (1) frontmatter parse round-trip incl. nested `metadata.provenance`,
absent `keywords`, and absent `type`/`provenance` (defaulting per §4.6/§4.3); (2) routing table —
`type` (incl. absent/unrecognized → local) × `commitLearnings` × lint-hit ⇒ destination root, with the
demote-and-report path asserted; (3) lint: each hardcoded pattern class caught — home paths, emails,
**handles/account-names**, credentials — and clean prose passes; (4) render: atomicity (tmp+rename
observed), hot ≡ indexed, union across both roots, ≥17KB warn + candidate ordering (tier then age,
absent-provenance lowest), refusal on **both** hard axes (24.4KB bytes; 200 lines); (5) index-from-
text-only: two invocations over the same corpus give identical results with no on-disk artifact
created besides the query log; (6) query: BM25 hit via `keywords:` only (body lacks the term);
provenance/recency ordering incl. untagged-ranks-lowest; top-k and byte budget enforced; prompt block
shape; `--queries` batch returns one labeled block per entry; query-log line appended; (7) archive
verb: file moved (git mv vs mv per root), note appended, projection re-rendered; (8) consolidate:
near-dupe pair flagged, no auto-merge; (9) Node < 24 stub: clean one-line failure, exit non-zero.
Template (`workflow-template.test.mjs`): (10) `memoryClause` present at worker/auditor/fix-worker/
add-test/servitor sites, absent at refiner/ace/gate-audit/polish; empty map ⇒ byte-identical prompts
(temp-break: remove the clause, watch the mapped test fail); (11) the existing D4-presence assertions
(dispatched prompt + standing file) are **inverted** to assert D4 and the append-pointer instruction
are absent, and the ServitorResult schema no longer carries `memory_index_updated`. Config
(`war-config.test.mjs`): (12) `memory` block validated (booleans, `topK ≥ 1`); old configs without the
block fill defaults clean. Curation: (13) safe-swap fixture — a staged corpus with an archived lesson
and a repo-root row passes verify (archive-aware wikilinks; root-aware row check). Existing suites:
(14) both servitor hooks' test files pass **unchanged** — the no-widening proof. Migration: (15)
dry-run on a fixture corpus (typed + untyped + lint-tripping files) reports the exact move/route plan
incl. the untyped report; `--apply` executes it and the fixture's projection meets budget; a two-clone
disjoint add/archive merge in the fixture completes with zero conflicts. Gate 3 is enforced-by-CI and
deliberately has no unit criterion. End-state mapping: E1→4, E2→7+6, E3→5, E4→6+10, E5→9+10, E6→2+3,
E7→14, E8→15.

## 11. Verification record

Adversarially verified 2026-07-03 by a 7-seat workflow (five codebase-claim verifiers over hooks /
workflow spawn sites / curation pipeline / config surfaces / environmental facts, one anti-over-
engineering critic, one completeness critic against the ratified decision log): 58 checks, 42 non-OK
findings (0 blocker / 13 major), all absorbed into this revision. The two structural amendments over
the as-grilled draft, both strengthening ratified decisions rather than reversing them: the index
became in-memory-per-invocation (Q2's "disposable" taken to its logical end — the persistent DB file,
fingerprint self-heal, WAL note, and corruption story were ceremony around a sub-second rebuild), and
the committed repo-root `MEMORY.md` projection was cut (a regenerated shared committed file is a
guaranteed merge-conflict surface — it would have broken ratified end state E8; the repo root now
carries only per-lesson files).
