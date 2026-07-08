# Servitor writes are local-root-only; repo-root publication is a Lead Gate-2 promotion; user-authored memory is agent-immutable

**Status:** accepted (design ratified 2026-07-08; implementation tracked by the spec and plan below)

WAR's servitor learnings write path failed at two seams (#584). First, with `commitLearnings` on
(the default) a landed phase's lessons **never rode the phase PR**: the servitor's relative write
target resolved against the launch session's cwd — off the working branch — and the Lead's Gate-2
commit was attempted "in its working-branch checkout", a checkout the post-checkout guard
([ADR 0018](0018-war-working-branch-checkout-guard.md)) guarantees **never exists**. Second, the
servitor's D1/D2 disciplines affirmatively **sanctioned editing pre-existing hand-curated personal
memory files** — the operator's own store was mutable to an agent. This records the contract that
fixes both. Full mechanics: [the design spec](../specs/2026-07-08-servitor-learnings-write-path-design.md)
and [the plan](../plans/2026-07-08-servitor-learnings-write-path.md).

## Decision

**The servitor writes to exactly one root — the threaded absolute local memory root. Repo-root
publication is a Lead-owned Gate-2 promotion performed in a transient publication worktree, as a
copy-with-marker. A pre-existing memory file that carries no nested `metadata.provenance` is
user-authored and immutable to the servitor.**

### (A) The write/publish split — one servitor root, the Lead the sole repo-root writer

The servitor's writable surface collapses to **one root**: Setup threads a new `memoryLocalRoot`
arg (the absolute local root — `~` expanded — the servitor's *only* writable path). `learningsTarget`
is retained untouched as the read-path resolved repo root (feeding the worker self-query `--repo` and
the Gate-2 promotion destination). The servitor writes **every** lesson file locally, regardless of
`metadata.type`; `type: project` merely marks a file **promotable**. The Wrap-up dispatch gates on
`memoryLocalRoot`: absent (the named producer is Setup's memory-probe failure) ⇒ skipped + a logged
line, fail-open — never a dispatch with an unanchored target.

Repo-root publication becomes a **Lead Gate-2 promotion**: reconcile `servitorResult.files_written`
against the local root (an absolute-prefix check; any stray path fails loud and escalates — never
silently accepted or dropped), select the `type: project` files, provision a transient publication
worktree on the working branch via a new `provision-worktrees.sh` subcommand pair
(`ensure-publication-worktree` / `remove-publication-worktree`, mirroring the `ensure-refinery-worktree`
idiom — single-tested-owner doctrine ([ADR 0001](0001-explicitly-managed-worktrees.md)), never a prose
`git worktree add`), copy + redaction-lint there (fail-closed: a flagged file stays local, never
dropped), commit `docs(learnings): phase N` + the byte-identical CLAUDE.md pointer duty, push via the
existing `ensure-origin` push-first CAS, remove the worktree, then stamp the promoted local originals
(below). Rejected: keeping the servitor as a two-root writer (the write-off-the-branch bug is
structural — a reviewer-side agent has no working-branch checkout to commit in); a servitor that
commits (it has no Bash — the primary confinement — by design).

### (I) Promotion is a copy-with-marker, not a move

A promoted lesson is **copied** into the repo root and the local original is **kept**, stamped after
the push with a nested marker — exactly `metadata.promoted: <workingBranch>@phase-<N>` — and **never
deleted**. Lifecycle: the marker is stamped **only after the successful push**; the marked local row
stays visible to `render-index`/prefetch/`/lessons-learned` and is retired by a **future
`/lessons-learned` pass once the merge is confirmed**. A same-slug repo file is **overwritten on
promote** — overwrite-on-promote is the ratified update mechanism for a recurrence edit (the local
marked copy, when present, is the canonical recurrence-edit target and is provenance-tagged so the
mutation guard (F) allows the edit). Rationale for copy-not-move: a move creates a **recall blind
spot** — the lesson would vanish from local retrieval the moment it is promoted, yet remain unmerged
until the campaign PR lands, and this repo has stranded-branch precedent (a promoted lesson can sit
unmerged for a long time). A failed push or a redaction flag leaves the lesson **unmarked** in the
local root, never dropped. Rejected: publish-and-delete (the blind spot above); marking before the
push (a failed push would falsely claim publication).

### (F) The provenance-presence discriminator — user memory is immutable

`validate-servitor-provenance.sh` gains an **existing-target mutation guard**, gating Write, Edit,
**and** NotebookEdit (it runs before the Write-only new-content tier check). A pre-existing on-disk
memory file whose frontmatter lacks a **nested** `metadata.provenance` value is **user-authored,
top-of-ladder** ([ADR 0007](0007-memory-provenance.md)), and immutable to the servitor — all three
edit tools are denied; the servitor writes a new `[[slug]]`-cross-linked file instead. Presence of the
key (any tier value), not correctness of the tier, is the discriminator; a **top-level** `provenance:`
line does not count. The guard reads the **target file on disk**, not the tool payload — a Write whose
*content* carries a valid tier over an existing untagged file is still denied. The pinned fail
direction: `[ -f "$fp" ]` false — a nonexistent target **or a relative path** — falls through to the
new-file path, safe because the fail-closed scope hook denies out-of-root and relative writes first
(this hook never re-implements scope).

### (E, re-ratified) The scope hook's local glob stays shape-based

The scope hook's `war-servitor` branch **drops** the `*/docs/learnings/*` alternative — under the
Gate-2 promotion model the servitor has no legitimate repo-root write left. Its remaining allowance is
the local glob `*/.claude/projects/*/memory/*`, which **stays shape-based** because a hook process
cannot receive per-run values (the #58 residual, re-ratified). The cross-project residual it admits is
now bounded by (F)'s content guard — a shape match no longer implies a sanctioned write. The **accepted
tagged-file mutability residual:** a provenance-tagged file stays servitor-editable per D1/D2 even if a
human later hand-edits it; in practice untagged ≈ hand-authored, tagged ≈ run-authored, so the
discriminator holds in the common case.

### (D) The `p<N>-publication` naming, and crash-heal posture

The publication worktree is named `<worktreeRoot>/<runId>/p<N>-publication` — **phase-scoped**, per the
run-scoped-vs-phase-scoped naming convention [ADR 0021](0021-run-lifecycle-provision-contract.md)
establishes (`_refinery` is run-scoped with clean-tree re-attach heals; `p<N>-` dirs are phase-scoped
so a cross-phase relaunch never collides). A leftover publication worktree from a crash is **healed** by
a Setup pre-flight and a Gate-2 entry scan: clean ⇒ removed, dirty ⇒ escalated. This closes the
silent-campaign-fork hazard — a leaked publication checkout would otherwise make `resolve-working-branch`
see a collision and cut a fresh `dev/<date>-<slug>` fork.

## Relationship to prior ADRs

- **Amends [ADR 0015](0015-files-canonical-memory-with-derived-index.md)** — the two roots and
  `metadata.type` routing are unchanged; the **repo-root *writer*** changes (the Lead, via Gate-2
  promotion, not the servitor).
- **Extends [ADR 0002](0002-scope-by-agent-type.md)** — the servitor scope narrows to one local glob;
  the provenance guard adds a content-based immutability layer on top of the shape gate.
- **Extends [ADR 0007](0007-memory-provenance.md)** — provenance *presence* now discriminates
  user-authored (top-of-ladder, immutable) from run-authored (editable).
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — no enum, status,
  `land-decision.mjs`, or `SERVITOR_RESULT` schema change.
- **Leaves [ADR 0008](0008-git-is-the-resume-source-of-truth.md) untouched** — resume precedence is
  unchanged.
- Historical ADRs are superseded, never edited.

## Considered options

- **Copy-with-marker versus move (chosen: copy).** A move opens a recall blind spot between promotion
  and campaign-PR merge; the marker + local retention keeps the lesson recall-visible in-run, and a
  future `/lessons-learned` pass retires the marked copy once merge is confirmed.
- **Per-run scope-hook values versus a content guard (chosen: content guard).** A hook process cannot
  receive per-run values, so the local glob must stay shape-based; the immutability discipline moves to
  a content check (provenance-presence) that a hook *can* enforce from the target file on disk.
- **Servitor commits the promotion versus the Lead (chosen: Lead).** The servitor has no Bash and no
  working-branch checkout; the Lead already owns Gate-2 render/lint, so it owns the promotion commit and
  the transient publication worktree too.
