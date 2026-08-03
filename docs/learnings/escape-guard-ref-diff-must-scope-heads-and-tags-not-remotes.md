---
name: escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes
description: "An exact pre/post git ref-diff escape guard must scope to refs/heads/ and refs/tags/ only — refs/remotes/* moves on any background git fetch, and in a repo with many linked worktrees sharing one ref store an unscoped diff makes 'no escape' unreachable during normal concurrent activity"
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
    - macOS
    - mktemp
  keywords: 
    - refs/remotes exclusion
    - git for-each-ref
    - shared ref store
    - linked worktrees
    - background git fetch
    - assert-no-repo-escape.sh
    - snapshot baseline
    - pwd -P
    - var folders symlink
    - private var folders
    - path containment
    - gitignored leak paths
    - git status --porcelain blind spot
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T09:23:17.698Z
---

# An exact ref-diff escape guard: scope to `refs/heads/`+`refs/tags/`, and normalize paths physically

Landed in `skills/red-team/assets/assert-no-repo-escape.sh` (`--snapshot`/`--baseline` modes, End
state 3 of `2026-08-02-redteam-doctrine-and-guards`) — verify still present before acting.

## 1. Namespace-scope the ref-diff, or concurrent activity looks like an escape

An exact (name-agnostic) diff of `git for-each-ref`'s full output between a pre-run snapshot and a
post-run check is the right fix for a name-heuristic escape guard (closes the class where a probe
invents a ref name that slips a `redteam-*`/`*-sandbox-*` pattern) — but `for-each-ref` also
enumerates **`refs/remotes/*`**, and that namespace moves on any background or IDE `git fetch`,
which is never a probe writing into the repo (an origin-side probe push is a different, still-open
ceiling). Reproduced at the phase base: a plain `git fetch` produced a `refs/remotes/origin/*`
delta, and a branch created in a **different worktree of the same repo** produced a `refs/heads/*`
delta — this repo alone carried 137 refs across 47 linked worktrees sharing one ref store at that
time. **Fix:** scope the exact diff to `refs/heads/` and `refs/tags/` only; within those two
namespaces the diff stays fully name-agnostic (no allowlist, no pattern — a name exclusion here
would reopen the exact heuristic hole the diff exists to close). The residual class the namespace
scope *cannot* remove — a concurrent **local** branch/tag from another session or worktree during
the run window — is a true non-escape and must be triaged by **action-provenance first** (was this
delta authored by the probe?) rather than blocked on reflexively; a delta no probe authored is
recorded, not treated as containment-blocking.

## 2. Path containment must resolve BOTH sides physically before comparing

When an escape guard refuses a `--snapshot`/`--baseline` artifact path that resolves inside the
target repo's working tree (to avoid the porcelain-dirty check false-tripping on its own artifact),
a **one-sided** `pwd -P` normalization is not enough. On macOS, `mktemp -d` returns a path under
`/var/folders/…`, which is itself a **symlink alias** of `/private/var/folders/…` (reproduced at
the phase base) — checking the artifact path logically but the repo path physically (or vice
versa) makes the guard's own in-tree containment case go red, or silently lets the mirror-image
alias bypass containment entirely. Fix: resolve **both** sides physically before comparing —
`repo_norm=$(cd "$repo_dir" && pwd -P)` and, for the artifact, `cd` into its **parent** dir first
(the artifact file itself need not exist yet in snapshot mode) and reattach the basename:
`art_norm=$(cd "$(dirname "$artifact")" && pwd -P)/$(basename "$artifact")`.

## 3. `git status --porcelain` is blind to gitignored files (named ceiling, not fixed here)

`git status --porcelain` does not report ignored paths — a probe that leaks a write into
`node_modules/`, a `*.log`, or another gitignored path is invisible to a porcelain-based pre-run
residue check, to the snapshot-mode refusal, and adds no ref for the ref-diff to see either.
Widening to `--ignored` needs its own back-compat pin and a ruling on legitimately-ignored dirs, so
this repo recorded it as a **named residual ceiling** rather than fixing it in the same pass — if
you inherit or port this guard, don't assume `--porcelain` is a complete dirty-tree check.

**How to apply:** when building any pre/post state-diff guard (refs, files, processes) in an
environment with concurrent actors sharing one store, (a) scope the diff's namespace to what only
your own actor can write, never everything the underlying enumeration API returns, and (b) if the
guard also does path-containment checks against a `mktemp`-generated path, resolve every side of
the comparison through the *same* physical-vs-logical resolution — mixing `pwd` and `pwd -P` across
the two sides of a comparison is a silent, environment-dependent false result.

Related: [[cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target]] (the
sandbox-idiom fix this same guard's ref-diff made necessary — the old sanctioned idiom would have
tripped this very guard).
