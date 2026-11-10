---
name: escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes
description: "An exact pre/post git ref-diff escape guard must scope to refs/heads/ and refs/tags/ only, because refs/remotes/* moves on any background git fetch"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes
  phase: 2026-08-02-redteam-doctrine-and-guards/phase-2 task 2.1 (End state 3)
  created: 2026-08-02
  tags:
    - red-team
    - escape-guard
    - ref-diff
    - shared-ref-store
  keywords:
    - refs/remotes exclusion
    - git for-each-ref
    - shared ref store
    - linked worktrees
    - background git fetch
    - assert-no-repo-escape.sh
    - snapshot baseline
    - action provenance
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-09-03T09:57:52.062Z
---

# An exact ref-diff escape guard: scope to `refs/heads/` and `refs/tags/`

**Rule:** an exact (name-agnostic) diff of `git for-each-ref` between a pre-run snapshot and a
post-run check must scope to `refs/heads/` and `refs/tags/` only.

**Why:** `for-each-ref` also lists `refs/remotes/*`, and that namespace moves on any background or
IDE `git fetch`. A fetch is never a probe writing into the repo. In a repo with many linked
worktrees sharing one ref store, an unscoped diff makes "no escape" unreachable during normal
concurrent activity. A plain `git fetch` produced a `refs/remotes/origin/*` delta, and a branch
created in a different worktree of the same repo produced a `refs/heads/*` delta.

**How to apply:**
- Within `refs/heads/` and `refs/tags/`, keep the diff fully name-agnostic. No allowlist, no
  pattern. A name exclusion would reopen the heuristic hole the exact diff exists to close (a probe
  inventing a ref name that slips a `redteam-*`/`*-sandbox-*` pattern).
- The namespace scope cannot remove a concurrent local branch or tag from another session or
  worktree. Triage it by action provenance first (did the probe author this delta?). A delta no
  probe authored is recorded, not treated as containment-blocking.
- An origin-side probe push is a different, still-open ceiling.
- For any pre/post state-diff guard (refs, files, processes) with concurrent actors sharing one
  store, scope the diff to what only your own actor can write, never to everything the enumeration
  API returns.

Landed in `skills/red-team/assets/assert-no-repo-escape.sh` (`--snapshot`/`--baseline` modes).
Verify still present before acting.

The same guard's other two traps live in their own lessons:
`compare-path-containment-with-both-sides-resolved-physically` (macOS `/var` alias) and
`git-status-porcelain-is-blind-to-gitignored-files-snapshot-ls-files-ignored` (ignored-file writes).

Related: [[cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target]] (the
sandbox-idiom fix this same guard's ref-diff made necessary — the old sanctioned idiom would have
tripped this very guard).

> archived 2026-08-15: resolved — moved to archive
