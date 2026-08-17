---
name: reuse-hygiene-corruption-signature-can-force-restore-uncommitted-git-rm
description: "provision-worktrees.sh's reuse-path submodule-hygiene repair (D19) classifies purely on porcelain SHAPE (staged deletions at a matching gitlink SHA) — a submodule worker's own uncommitted `git rm <file>` produces the identical shape and gets silently force-restored by `git submodule update --init --force`, undoing real intentional work."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - reuse_hygiene_one
    - WORKTREE_HYGIENE
    - corruption signature
    - staged deletions
    - submodule update --init --force
    - provision-worktrees.sh
    - ensure-worktree reuse
    - porcelain shape heuristic
    - false positive repair
    - git rm undone
    - D19
  provenance: code-verified
  slug: reuse-hygiene-corruption-signature-can-force-restore-uncommitted-git-rm
  phase: 2026-08-06-handoff-schemas-contract/1.2 (2026-08-17)
  tags: 
    - plan-code-mismatch
    - worktree-provisioning
    - submodule-safety
    - heuristic-false-positive
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T12:08:08.125Z
---

`ensure-worktree`'s reuse path in `skills/war/assets/provision-worktrees.sh`
(`reuse_hygiene_one()`) repairs a killed-worker's corrupted submodule checkout
automatically — it detects a dirty submodule whose checked-out HEAD still matches the
recorded gitlink SHA, classifies the dirt against a "corruption signature," and if it
matches, drops a stale `index.lock` and runs `git submodule update --init --force -- "$h_sub"`.
This is deliberate, adjudicated behavior (D19, /red-team 2026-08-17): "anything else is
`detected`-only, tree untouched — `--force` never destroys a submodule worker's legitimate
WIP." The narrowing from the plan's literal condition (porcelain non-empty AND SHA match) to
the corruption-signature classification exists specifically to protect ordinary in-progress
edits.

**The gap the narrowing does not close:** the corruption signature is *porcelain-shape*
matching only — every line must be a staged deletion (`D  <path>`) or an untracked entry
whose path is among the staged deletions (the emptied-index/files-on-disk variant of the
same corruption). Read at the pin (`skills/war/assets/provision-worktrees.sh`,
`reuse_hygiene_one()`, lines ~770-816):

```sh
h_staged_del="$(git -C "$h_wt/$h_sub" diff --cached --name-only --diff-filter=D ...)"
...
case "$h_line" in
  "D  "*) ;;
  "?? "*) printf '%s\n' "$h_staged_del" | grep -Fxq -- "${h_line:3}" || h_shape=0 ;;
  *) h_shape=0 ;;
esac
...
git -C "$h_wt" submodule update --init --force -- "$h_sub"
```

A submodule-content worker who ran `git rm <file>` (staged the deletion, has not yet
committed) produces **exactly** `D  <file>` in the submodule's porcelain, at a gitlink SHA
that still matches (nothing has been committed to move it) — indistinguishable by shape from
the actual corruption (a killed mid-populate leaving an emptied index). The repair arm fires
and `--force` restores the file, silently reverting the worker's real, intentional deletion.
This is *not* a bug against the plan — it matches the threaded adjudication's own wording
exactly ("anything else is detected-only... `--force` never destroys legitimate WIP" is
scoped to non-matching shapes; a staged `git rm` is shape-matching by construction) — but the
residual is real and was recorded only as a `note` (gate-audit confirmed a second time, not
re-litigable). The suite's own coverage (`HYG.n`) only proves the *unstaged*-edit case is
safe; no fixture exercises a staged deletion.

**Pattern to watch for:** a "corruption vs. legitimate work" heuristic keyed purely on git
*porcelain shape* (not on intent, timing, or a lock/marker the worker itself could set) will
always have a blind spot where real work produces the same shape as the failure it's meant to
catch. Before relying on such a heuristic to auto-repair (here: `--force`-restore) shared
state another agent may be actively mutating, check whether the corruption signature can be
produced by an in-progress, uncommitted, intentional operation of the same kind the tool is
trying to protect — staged deletions are exactly what `git rm` produces on the happy path.

**If ever revisited:** the safest close is not silence-and-defer but adding a positive
corruption signal beyond shape — e.g. also requiring a stale `index.lock` (already in the
signature as `h_lock`, but currently only tightens the `detail` string, never the repair
gate) or a submodule-worker "in progress" marker the refiner could set/clear, so a bare
staged-deletion-only shape with no lock and no marker stays `detected`, not `repaired`.

Related: [[floor-script-header-can-claim-unbacked-downstream-capture]] (same phase, same
mechanism's test-fixture comment separately overclaimed an unrelated downstream consumer).
