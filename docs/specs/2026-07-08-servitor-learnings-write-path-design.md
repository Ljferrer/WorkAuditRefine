# Servitor learnings write path — local-root-anchored writes, Gate-2 promotion, and a user-memory mutation guard

Source: `/survey-corps` 2026-07-07, from issue #584 (severity major: a default-ON `commitLearnings`
publish that silently orphans every lesson, plus destructive edits to hand-curated personal memory).
Not yet a plan — convert with `/war-strategy`, then validate with `/red-team`.

**Issues addressed: #584.** (Also partially closes the ratified #58 deferral recorded in
`hooks/validate-worktree-scope.sh`'s header — see §3.E.)

## 1. Context — the gap / problem

Three cooperating mechanisms, all live at tip, break the learnings publication path and the
personal-memory safety contract. Each is verified against the current tree:

1. **The servitor's write target is an unanchored path string.** The Wrap-up step in
   `workflow-template.js` dispatches `war-servitor` with `Your only writable path …:
   ${learningsTarget}` — whatever string Setup threaded, typically the relative `docs/learnings/`.
   A relative path resolves against the servitor subagent's cwd (the launch session's environment),
   which is **never** a working-branch checkout: `cmd_resolve_working_branch` in
   `provision-worktrees.sh` returns the desired branch only when `branch_checked_out_anywhere` is
   false, so post-checkout-guard the run's working branch is checked out **nowhere** — in every
   topology, not just launch-from-worktree. Observed live: `files_written` landed in the launch
   worktree's `docs/learnings/phase-1.md`, off the working branch, invisible to the phase PR.
2. **Gate 2 commits in a checkout that does not exist and never reconciles.** The post-servitor
   publication step in `skills/war/SKILL.md` says the Lead — "in its working-branch checkout" —
   lints and commits `docs(learnings): phase N`. Per point 1 that checkout has no referent, and the
   step never reconciles `servitorResult.files_written` against the tree being committed — so a
   lesson written elsewhere is silently absent from the commit. The orphaning is structural: the
   default-ON `commitLearnings` publish claims lessons ride the phase PR while the file sits in an
   unrelated worktree.
3. **The scope hook allows any checkout's `docs/learnings`.** The `*war-servitor*` branch of
   `hooks/validate-worktree-scope.sh` allows by bare path shape
   (`*/.claude/projects/*/memory/*|*/docs/learnings/*`) — a write into *any* checkout's
   `docs/learnings` passes. Its own header records full memory-root anchoring as deferred (#58).
   So the hook cannot catch mechanism 1.
4. **The standing surface still teaches retired routing and sanctions destructive edits.**
   `agents/war-servitor.md`'s Inputs bullet carries the either/or routing that
   `skills/war/SKILL.md` Setup step 4 explicitly retires ("the old either/or fallback is
   retired"): *if an agent-memory dir exists … else append to `docs/learnings/phase-<N>.md`* — the
   observed `phase-1.md` aggregate filename matches the else-branch verbatim. And its D1
   ("update that file in place") and D2 (supersession: "update or replace the stale file")
   affirmatively sanction editing **pre-existing** local-root files with no run-authored vs
   user-authored distinction. Observed live: two hand-curated personal memory files
   (predating the campaign, unrelated to the run) were destructively edited. The
   `validate-servitor-provenance.sh` hook cannot catch this: its header documents that Edit
   payloads pass through untouched, and a Write over an existing file is only content-checked,
   never authorship-checked.

Net effect: for every post-guard run, `commitLearnings` (default true) publishes nothing that
rides the phase PR, and the local memory root — the operator's personal, unreviewed store — is
mutable in place by an agent fed LLM-authored audit monologue.

## 2. Pivotal constraints

- **Post-guard topology: the working branch is checked out nowhere.** Verified in
  `cmd_resolve_working_branch` (collision ⇒ fresh `dev/<date>-<slug>` checked out nowhere;
  no collision ⇒ the branch was already checked out nowhere). Any publication design must create
  its own commit context; no existing checkout can be assumed. The `_refinery` worktree is on the
  **integration** branch (see the `ensure-refinery-worktree` Provision step), not the working
  branch, and is refiner-owned.
- **Hooks cannot receive per-run values.** A hook process gets the JSON payload (`tool_input`,
  `agent_type`, cwd) plus the harness's static environment fixed at session start; a WAR run has
  no channel to thread run-resolved root paths into the hook process. Hook-level tightening must
  therefore be structural (glob subtraction) or content-based (inspecting the target file), never
  "compare against the run's resolved roots".
- **Both-surfaces rule.** Servitor behavior lives in `agents/war-servitor.md` (standing) and the
  string-built Wrap-up prompt in `workflow-template.js` (dispatched); every behavioral change
  lands in both in the same commit.
- **`learningsTarget` is load-bearing on the read path.** `workflow-template.js` uses it as the
  worker self-query `--repo` flag (`workerSelfQueryRepoFlag`, learnings-read-path T1); its
  semantic (resolved repo root) cannot be silently repurposed.
- **ADR 0015 (two-root, files-canonical) and ADR 0007 (provenance ladder).** Lessons route by
  `metadata.type`; `user-confirmed` outranks agent writes; temperature is location; knowledge is
  never deleted. ADR 0002: servitor confinement is capability-first (no Bash — unchanged here).
- **`provision-worktrees.sh` is the single tested owner of git-topology mutation** (macOS
  bash 3.2-safe). Any new checkout the publication path needs is a subcommand there, not prose git.
- **Push-first CAS, never force.** The Gate-2 commit advances the shared working branch; it obeys
  the same discipline as the land path (`land_stale`-style reject → fetch, ff, retry — never
  `--force`).
- **Same-file siblings.** `docs/specs/2026-07-08-war-run-lifecycle-robustness-design.md` also
  edits `workflow-template.js` and `skills/war/SKILL.md` — disjoint constructs, same files; this
  spec carries a dependsOn ordering edge on it. Separately,
  `docs/plans/2026-07-07-diagnosis-preflight-self-confound-gate.md` (merged, unexecuted) appends
  one sentence to `agents/war-servitor.md`'s D3 block — an external ordering/rebase note only
  (this spec touches D1/D2/Inputs/Routing, not D3), not a dependency.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. Servitor write-root shape** | **Local-root-only writes; the servitor never writes `docs/learnings` again.** Options: (1) status quo two-glob writes — rejected, it is the broken state; (2) anchor repo-root writes into a working-branch checkout provisioned before Wrap-up (marker-file hook anchoring, pre-land staleness handling, a worktree live inside the Workflow) — rejected as the heavier mechanism: the publication checkout is needed at Gate 2 anyway, and giving the servitor direct repo-root access keeps the #58 hole open in some form; (3) **chosen**: the servitor writes every lesson — all `metadata.type`s — into the **local root** at an absolute threaded path; `type: project` marks a lesson *promotable*, and the Lead's Gate 2 promotes it into the repo root. Write-time routing collapses to one root; publication becomes a reviewed Lead action. ADR 0015's two roots survive: type still decides which root a lesson ultimately lives in — only the *writer* of the repo root changes (Lead, not servitor). |
| **B. Threading** | Setup resolves **both roots to absolute paths** and threads a new Workflow arg **`memoryLocalRoot`** (absolute local root — the servitor's only writable path). `learningsTarget` is **retained unchanged** as the read-path resolved repo root (`workerSelfQueryRepoFlag` and the seed render keep working; sibling-spec-disjoint). The Wrap-up dispatch gates on `memoryLocalRoot` (legacy args without it ⇒ Wrap-up skipped with a logged line — the existing memory-disabled semantics, fail-open, never a crash). The header args comment ("memory dir or docs/learnings/") is rewritten in the same commit (source-comment-lag lesson). |
| **C. Gate-2 commit context** | **A transient publication worktree, provisioned and removed by `provision-worktrees.sh`.** Options: (1) prose `git worktree add` in SKILL.md — rejected (single-tested-owner doctrine); (2) plumbing `commit-tree` + existing `land-advance` — rejected: the CLAUDE.md pointer duty must *read* the working-tip `CLAUDE.md`, and the redaction lint must run over a real repo-root directory, so a checkout is needed regardless; (3) **chosen**: a new subcommand (working name `ensure-publication-worktree <path> <workingBranch>`) mirroring the `ensure-refinery-worktree` idiom, cut at the landed working tip under `<worktreeRoot>/<runId>/_publication`, plus owned removal after the push (removal failure fails loud — the teardown reap-order lesson). The worktree is **per-Gate-2 transient**: it never persists across phases, so the working branch returns to checked-out-nowhere before the next phase's `land-advance` `update-ref` (which would otherwise desync a live checkout). |
| **D. Gate-2 reconciliation** | Gate 2 gains a **files_written assertion**: every path in `servitorResult.files_written` must be under the resolved absolute local root (prefix check). Any path outside ⇒ **fail loud** — the phase report records the stray path and the Lead escalates; never silently accepted, never silently dropped. This is the belt to A's suspenders: even a confused servitor (or a stale template) cannot orphan a lesson invisibly again. |
| **E. Scope-hook tightening (#58)** | The `*war-servitor*` branch of `validate-worktree-scope.sh` **drops the `*/docs/learnings/*` alternative** — the servitor has no legitimate repo-root write left, so the allowance is subtracted rather than anchored. The local glob `*/.claude/projects/*/memory/*` **remains shape-based**: per the pivotal constraint, the hook has no channel to learn the run's resolved root, so positive per-run anchoring is impossible; the residual (a write into a *different project's* memory dir) is re-ratified, now bounded by F's content guard, which denies mutation of any pre-existing untagged file wherever it lives. The `..`-segment guard and the worker/auditor branches are untouched. The header's #58 deferral note is updated to record this resolution. |
| **F. User-memory mutation guard (discriminator + enforcement)** | **Provenance-presence marks a file WAR-editable.** A pre-existing memory file whose frontmatter lacks `metadata.provenance` is treated as **user-authored at the top of the ladder** (ADR 0007: an untagged hand-curated file is the operator's own writing — outranking any agent write) and is **immutable to the servitor**: no Edit, no overwriting Write. `validate-servitor-provenance.sh` — which already parses the payload and owns the servitor case — gains an **existing-target mutation guard**: for `agent_type` `*war-servitor*` and a target path matching the memory glob, if the file **exists** and its frontmatter has no `metadata.provenance`, deny (exit 2) both Edit and Write, with a message directing to a new cross-linked file. Files **with** provenance stay editable (D1 dedup-in-place on run/WAR-authored lessons, archived-lesson corrections, D2 same-or-higher-tier supersession all keep working). The header's "Edit passes through untouched" documentation is rewritten in the same commit. Alternatives rejected: threading prior-phase `files_written` as a run-authorship list (state the hook can't see; the Lead-side list also misses prior *runs*' lessons, which must stay editable); denying all Edits (breaks D1/D2 wholesale). |
| **G. Discipline prose (both surfaces, same commit)** | D1 gains the qualifier: *update in place only a file bearing `metadata.provenance`; a covering file without it is user-authored — never edit it; write a new file and `[[slug]]`-cross-link it*. D2 gains: *only provenance-tagged files are supersession-editable; contradicting an untagged file ⇒ new file carrying the supersession note inline, old file untouched*. Both `agents/war-servitor.md` and the D1/D2 clauses in the Wrap-up dispatched prompt change together. The `Never` list gains "edit a pre-existing memory file that carries no `metadata.provenance`". |
| **H. Either/or retirement (standing surface)** | The Inputs bullet's *if an agent-memory dir exists … else append to `docs/learnings/phase-<N>.md`* is replaced with the two-root doctrine: one writable root (the threaded absolute local root), one file per fact, `type` decides eventual publication (Gate 2), never the write location; aggregate `phase-<N>.md` appends are explicitly dead. The `## Routing` section's "you write the file to your learnings target with the right type" is reworded to match A (all files local; `type: project` = promotable). The dispatched prompt carries no either/or today (verified) — this is a standing-surface-only retirement, but the same commit still updates the template's stale header comment (B). |
| **I. Promotion semantics** | **Promotion is a move, completed only after the push succeeds.** Gate 2 selects `type: project` files from the reconciled `files_written`; with `commitLearnings` on and a non-empty selection: provision the publication worktree (C), copy the files into `<pub>/docs/learnings/` (honoring a non-null `overrides.learningsTarget` as the repo-root path — its old "must match the servitor scope-hook glob" constraint in Setup step 4 is obsolete under E and is rewritten), run the redaction lint there (fail-closed: a flagged file is **not promoted** — it simply stays in the local root and is reported; "demoted, never dropped" becomes "never left the local root"), commit `docs(learnings): phase N` + the CLAUDE.md pointer duty (unchanged wording, now executed in the publication worktree), push (CAS; reject ⇒ fetch, ff, retry once, then escalate — never force), remove the worktree, and **only then** delete the promoted originals from the local root (the content is on origin; a failed push leaves every lesson in the local root — nothing is ever lost). `render-index` then regenerates the local `MEMORY.md` exactly as today. |

## 4. Mechanics (per component/role)

### Lead — Setup (`skills/war/SKILL.md` step 4)
- Resolve both roots to **absolute paths** at Setup (the local root already expands from `~`; the
  repo root resolves against the launch checkout for the read path, unchanged). Record both in the
  ledger. Thread `memoryLocalRoot` (absolute local root) into every per-phase Workflow alongside
  the existing `learningsTarget` (read-path repo root, unchanged).
- Rewrite the `overrides.learningsTarget` sentence: it remains the repo-root path override
  (read path + Gate-2 promotion destination); the scope-hook-glob compatibility clause is deleted
  (the servitor no longer writes there).

### Workflow — Wrap-up (`workflow-template.js`, dispatched prompt)
- Dispatch condition becomes `landResult.status === 'landed' && memoryLocalRoot` (absent ⇒
  skipped + logged, the memory-disabled path).
- The "only writable path" clause names the absolute `${memoryLocalRoot}` and states: every lesson
  file — regardless of `metadata.type` — is written under this root; `type: project` marks it for
  the Lead's Gate-2 promotion into the repo root; never write into any `docs/learnings/`.
- D1/D2 clauses gain the G qualifiers verbatim-in-spirit (context-tailored, not byte-mirrored —
  the verbatim-mirror lesson).
- The args header comment for `learningsTarget` is corrected; a `memoryLocalRoot` line is added.

### Standing surface (`agents/war-servitor.md`, same commit as the template)
- Inputs bullet: either/or routing replaced per H (single absolute local writable root; no
  `phase-<N>.md` aggregates).
- D1/D2: the G qualifiers. `## Routing`: reworded per A/H. `## Never`: the untagged-file rule.
- D3, the provenance table, the frontmatter format, and the archived-lessons section are untouched
  (the diagnosis-preflight plan's pending D3 sentence rebases cleanly).

### `hooks/validate-worktree-scope.sh` (+ `validate-worktree-scope.test.sh`)
- Servitor case: `*/.claude/projects/*/memory/*` only; the `*/docs/learnings/*` alternative and its
  mention in the deny message are removed. Header #58 note updated. All other branches untouched.

### `hooks/validate-servitor-provenance.sh` (+ its test)
- New existing-target mutation guard (F), placed before the current Write-only short-circuit:
  servitor + memory-glob path + target file exists + file frontmatter lacks nested
  `metadata.provenance` (reuse the existing awk extraction idiom, applied to the file instead of
  `tool_input.content`) ⇒ deny for Write, Edit, and NotebookEdit. The `MEMORY.md` exact-basename
  exemption stays above it. Everything else (non-servitor pass-through, new-file Write content
  check, tier validation) is unchanged.

### `skills/war/assets/provision-worktrees.sh` (+ its test)
- New subcommand for the transient publication worktree (C): create-or-reattach at the working
  tip, and its owned removal (fail loud on failure; never `--force`-remove a dirty worktree —
  escalate instead). Bash-3.2-safe, `die`/`_tmp_err` idioms (not the `ensure-origin`
  stderr-swallowing anti-pattern).

### Lead — Gate 2 (`skills/war/SKILL.md`, post-servitor publication + manual-land bullet)
- Insert the reconciliation assertion (D) before any publication work.
- Replace "in its working-branch checkout" with the publication-worktree procedure (I), including
  the CAS retry rule and the move-after-push rule.
- The manual-land bullet ("Capture learnings on every landed phase") threads the same absolute
  `memoryLocalRoot` when the Lead spawns the servitor itself, and runs the same Gate 2.

### Unchanged, deliberately
- `war-memory.mjs` (lint/query/render-index CLIs), `SERVITOR_RESULT` schema
  (`files_written` already carries what D needs), the servitor's capability allowlist, the
  provenance ladder tiers, prefetch, and the `..` guard.

## 5. Surface changes (files touched)

- `skills/war/assets/workflow-template.js` + `workflow-template.test.mjs` — `memoryLocalRoot` arg
  + Wrap-up gate; Wrap-up prompt clauses (writable path, D1/D2 qualifiers); header comment.
- `agents/war-servitor.md` — Inputs, D1, D2, Routing, Never (same commit as the template).
- `hooks/validate-worktree-scope.sh` + `validate-worktree-scope.test.sh` — servitor glob
  subtraction; header note.
- `hooks/validate-servitor-provenance.sh` + its test — existing-target mutation guard; header
  rewrite.
- `skills/war/assets/provision-worktrees.sh` + `provision-worktrees.test.sh` — publication
  worktree subcommand + removal.
- `skills/war/SKILL.md` — Setup step 4 (absolute roots, `memoryLocalRoot`, override sentence);
  Gate 2 (reconciliation + promotion procedure); manual-land bullet.
- `CONTEXT.md` — new terms (§6); `docs/adr/` — new ADR (§7).

## 6. New domain terms (CONTEXT.md)

- **publication worktree** — the transient, run-scoped working-branch checkout
  (`<worktreeRoot>/<runId>/_publication`) the Lead provisions at Gate 2 to lint, commit, and push
  `docs(learnings): phase N`; created and removed by `provision-worktrees.sh`; never persists
  across phases.
- **promotion** — Gate 2 moving a `type: project` lesson from the local root into the repo root
  via the publication worktree; a move completed only after the push succeeds — a failed push or a
  redaction flag leaves the lesson in the local root, never dropped.
- **WAR-editable memory file** — a memory file whose frontmatter carries nested
  `metadata.provenance`; the only kind the servitor may Edit or overwrite. An untagged
  pre-existing file is user-authored, top-of-ladder, and immutable to agents.

## 7. Recommended ADRs

- **New ADR (next free number at land time): "Servitor writes are local-root-only; repo-root
  publication is a Lead Gate-2 promotion."** Records: (a) the write/publish split — the servitor
  writes one root (absolute, threaded), the Lead is the sole repo-root writer, via a transient
  publication worktree, push-first CAS, promotion-as-move; (b) the provenance-presence
  discriminator — an untagged pre-existing memory file is user-authored and agent-immutable,
  enforced fail-closed in `validate-servitor-provenance.sh`; (c) the #58 residual re-ratified:
  the local glob stays shape-based because hooks cannot receive per-run values — bounded by (b).
  Amends ADR 0015 (roots and type-routing unchanged; the repo-root *writer* changes) and extends
  ADR 0002/0007; touches no enum (ADR 0005) and no resume precedence (ADR 0008).

## 8. Open risks / implementation notes

- **In-run recall lag for promoted lessons.** After promotion, a lesson lives on the working
  branch; later phases' prefetch `--repo` reads the launch checkout, which lags until the campaign
  PR merges. Same class as the existing CLAUDE.md known trap (unmerged `docs/learnings` branches);
  accepted residual — the phase `handoff`/notes carry in-run context.
- **Cross-project local-root residual.** The shape-based local glob still admits another project's
  memory dir; the mutation guard bounds the damage (no pre-existing untagged file is editable
  anywhere), and the threaded absolute path makes the wrong-project write improbable. Recorded in
  the ADR, not silently accepted.
- **Gate-2 CAS race.** A concurrent push to the working branch between the land and Gate 2 rejects
  the publication push — fetch, ff the publication worktree, retry once, then escalate. Never
  force; `land_stale` ≠ `conflict` discipline applies.
- **Provenance extraction on the target file** must use the nested-`metadata:` scan (the
  frontmatter-tools-negation single-line lesson); a top-level `provenance:` line must not count as
  tagged.
- **Ordering:** lands after `docs/specs/2026-07-08-war-run-lifecycle-robustness-design.md`
  (same-file, disjoint constructs — `workflow-template.js`, `skills/war/SKILL.md`); the merged,
  unexecuted diagnosis-preflight plan appends one sentence to `agents/war-servitor.md` D3 — this
  spec avoids D3, but whichever executes second rebases across the other's hunks in that file.
- **Legacy args fail open:** a phase launched with old args (no `memoryLocalRoot`) skips Wrap-up
  with a logged line rather than dispatching a servitor with an unanchored target — degraded is
  better than orphaned.

## 9. Non-goals / deferred

- **No per-run root anchoring inside hook processes** — structurally impossible (static hook
  environment); the residual is bounded, not plumbed around.
- **No run-authorship ledger threaded to the servitor** — provenance presence is the
  discriminator; prior runs' tagged lessons stay editable by design.
- **No change to `war-memory.mjs`,** the provenance tiers, `SERVITOR_RESULT`, prefetch, seed
  render, or `/lessons-learned` (its migrate/evict flows are Lead/main-session surfaces the
  servitor hook changes never gate).
- **No fix for the read-path lag** (fresh working-branch lessons invisible to `--repo` until the
  campaign PR merges) — pre-existing, documented, out of scope.
- **No enum changes** — no new statuses, land decisions, or hard-escalation reasons.

## 10. Validation criteria (concrete, testable)

1. **`workflow-template.test.mjs` — threading + gate:** with `memoryLocalRoot` set, the Wrap-up
   prompt contains the absolute local root and does **not** name `docs/learnings` as writable;
   with it absent, no servitor dispatch occurs and a skip line is logged (delete-the-feature
   check: both assertions fail if the gate or the clause is removed).
2. **`validate-worktree-scope.test.sh`:** a servitor Write to any `*/docs/learnings/*` path is
   denied; a servitor Write under `*/.claude/projects/*/memory/*` is allowed; the `..` rejection
   and the worker/auditor branches are byte-unchanged in behavior (existing cases still pass).
3. **`validate-servitor-provenance` test:** servitor Edit of an existing memory file without
   nested `metadata.provenance` → deny; Edit of an existing tagged file → allow; Write over an
   existing untagged file → deny; Write to a new path with a valid tier → allow (regression);
   a top-level `provenance:` line does not count as tagged; a non-servitor Edit of the same
   untagged file → allow (back-compat).
4. **`provision-worktrees.test.sh`:** the publication subcommand creates a worktree on the working
   branch at its tip; re-invocation reattaches idempotently; removal succeeds clean and fails loud
   (non-zero, message) on a dirty worktree; after removal the working branch is checked out
   nowhere (`branch_checked_out_anywhere` false).
5. **Both-surfaces drift check:** a text-scan test asserts `agents/war-servitor.md` and the
   Wrap-up prompt source both carry the mutation-guard tokens (`metadata.provenance`,
   never-edit/user-authored anchors — token-anchored, sentence-case-tolerant per the prose-grep
   lesson), and that `agents/war-servitor.md` no longer contains the either/or tokens
   (`phase-<N>.md`, "else: append") nor the template header the stale "(memory dir or
   docs/learnings/)" comment.
6. **SKILL.md structure:** Gate 2 names the reconciliation assertion, the publication worktree,
   the retry-once CAS rule, and the move-after-push rule (grep-checkable anchors).
7. **Deferred backstops (operator-verifiable only — material for the future plan):** on a live
   launch-from-worktree `/war` run with `commitLearnings` on — (a) the phase PR diff contains
   `docs(learnings): phase N` with the promoted lesson files; (b) a checksum sweep of pre-existing
   hand-curated local-root files before/after the run shows zero mutations; (c) after each Gate 2
   the working branch is checked out nowhere. Runner: the next live campaign; not unit-testable.
