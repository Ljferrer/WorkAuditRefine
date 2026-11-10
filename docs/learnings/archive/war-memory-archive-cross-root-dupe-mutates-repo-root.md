---
name: war-memory-archive-cross-root-dupe-mutates-repo-root
description: "RESOLVED (prefer-local dupe rule + regression test, 2026-07-21): war-memory archive given a cross-root-dupe slug + --repo used to git-mv the REPO copy (staged, tree dirtied); cmdArchive now prefers the LOCAL record, so --repo is safe and wanted for the trailing re-render — archiving a dupe's local copy still frees zero projection bytes"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: war-memory archive cross-root dupe repo-root mutation prefer-local lessons-learned housekeeping staging render-index projection budget git-mv staged
  originSessionId: 51d13119-13c7-47df-9d25-18d015b337b8
  modified: 2026-07-21T16:35:27.898Z
---

Incident (2026-07-21 /lessons-learned pass): `war-memory archive --local "$STAGING" --repo docs/learnings <slug>` moved the **repo-root** copies of three cross-root-duplicate slugs into `docs/learnings/archive/` as **staged git renames** (note appended), leaving the staging copies hot. Mechanism (code-verified in `cmdArchive`, war-memory.mjs): `walkCorpus(roots)` walks local-then-repo and the hot `bySlug` Map kept the **last** record per slug, so the repo record won for a dupe; the `requireLocal` comment ("moves files under the local root") overclaimed. Repaired with `git restore --staged --worktree docs/learnings`.

**Resolution (2026-07-21, worktree branch claude/gallant-volhard-c3efa9):** `cmdArchive` now builds `bySlug` with an order-independent prefer-local rule — a cross-root dupe archives the LOCAL copy and never touches the committed repo file; a repo-only slug still git-mv's within the repo root. Locked by the regression test `archive: cross-root dupe slug moves the LOCAL copy; committed repo copy untouched` (war-memory.test.mjs), and the /lessons-learned Phase-5 prose now states the dupe semantics explicitly.

**Why:** the skill's Phase-5 text says to always pass `--repo` to `archive` (so its trailing re-render keeps `[repo]` rows) — pre-fix, following that letter on a cross-root dupe dirtied the committed root.

**How to apply:** once the fix is merged, pass `--repo` to `archive` as the skill instructs — it is safe for dupes and required for `[repo]`-row survival in the trailing re-render. (Pre-fix checkouts only: archive `--local` **only**, then run the explicit `render-index --local "$STAGING" --repo <repo-root>`.) Two adjacent facts survive the fix: archiving a byte-identical dupe's local copy frees **zero** projection bytes (the repo row survives; headroom is repo-description-driven, see [[projection-byte-budget-driven-by-descriptions-not-bodies]]), and it is hub-safe regardless of inbound count — the repo copy keeps the slug hot ([[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]] is satisfied by that copy). Same last-wins Map pattern still exists in `cmdMigrate` (flagged as a follow-up). Related: [[archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it]].

> archived 2026-07-27: resolved — moved to archive
