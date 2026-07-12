# Partial-phase recovery & task-branch hygiene — adopt held work, re-dispatch one task, fail-loud ref proofs

Source spec: docs/specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md
Issues: **Closes #725, #728; closes the residual of #731 and the engine half of #650**
(the red-team ff-topology half of #650 belongs to the red-team file family — spec §9,
not this plan). Scope class: recovery tooling inside the existing ADR 0003/0005/0008
doctrines — five shell mechanics in `provision-worktrees.sh`, four engine mechanics
in `workflow-template.js` (with the mandatory `agents/war-worker.md` prompt-surface
mirror and the `references/schemas.md` contract rows), one negative enum drift-guard,
plus the runbook/glossary/ADR prose.

## Commander's Intent

- Purpose: A `held:escalation` partial phase (observed live: 6 of 7 tasks merged,
  one escalated, gate-audit HARD-held) currently strands real work: the non-empty
  integration branch blocks relaunch, resume is whole-run only, plan-defect
  escalations look identical to implementation defects, a missing local base ref
  dies cryptically, stale remote task branches reject relaunch pushes, the reclaim
  safety proof reads a git error as "proven empty" (#728 — an ADR 0008 violation
  waiting to fire), and manual lands get no follower-sync assertion (#731 residual).
  Make recovery adoption-plus-re-dispatch, never deletion-plus-re-run, and make
  every destructive proof fail loud on command error.
- Method: Implement the spec's resolved design tree — the plan does not re-litigate
  it. All five shell mechanics land as **one task** (they share
  `provision-worktrees.sh`; same file → same task): §4.5 proof-1 rc-capture
  hardening, §4.1 `record-as-owned` (repairs the ledger toward git, moves no ref),
  §4.4 fresh-cut stale-remote probe + opt-in `--reclaim-stale-remote`
  (delete-then-plain-push, never force-push; the probe keys on **ancestry of the
  frozen tip**, so an already-merged remote is never flagged and never deleted;
  per the operator-ratified adjudication the stale shape is a **per-task
  classification** — the script's dedicated exit code + `STALE_REMOTE` marker
  are its direct-invocation contract, and the provision barrier classifies
  instead of halting),
  §4.6 `sync-follower` (manual-land assertion; **cites** the landed
  `cmd_land_advance`/`cmd_ensure_integration` mechanization from #593, never
  rebuilds it), §4.7 origin-fallback cut + missing-local-ref diagnostic. The
  engine task owns `workflow-template.js`, its test file, `agents/war-worker.md`,
  and `references/schemas.md` together (prompt-surface split + args contract, same
  commit): §4.2 git-derived merged-set skip **executed by the existing
  provision-barrier refiner dispatch** (the Workflow sandbox has no shell/fs —
  the refiner runs the ancestry checks and returns the merged set; ancestor task
  branches recorded `merged`, terminal task status, never `landed`), gated on a
  new `args.recovery` field so the recovery machinery stays dormant on
  non-recovery launches;
  §4.3 `PLAN-DEFECT:` sentinel → orthogonal `defectClass: 'plan'` escalation
  metadata at **every** worker-authored-blocked escalation site (no new enum
  member anywhere — ADR 0005); §4.4 engine half: the barrier reports per-task
  `staleRemote` classifications on its env-outcome and the engine maps each to
  the **existing per-task `env-blocked` status** (worker never spawned, full
  two-direction diagnostic + restore command, siblings proceed, dependents
  follow existing dep-failed semantics — ADR 0021's all-or-nothing topology
  barrier untouched); §4.4 stale-prior-attempt push-handoff sentence on
  both worker surfaces (`FORCE_WITH_LEASE_RULE` stays byte-identical, unwidened).
  A parallel task pins the negative drift-guard in `land-decision.test.mjs`
  (canonical exports AND the hand-mirrored inline copies). Runbook, glossary, and
  the recommended ADR follow as prose tasks; trailing release phase ships the
  behavior change.
- End state:
  1. `provision-worktrees.test.sh`: `ensure-integration --reclaim-empty-orphan`
     with an unresolvable `<base>` exits 3 (`EX_FOREIGN`) and the orphan branch's
     tip SHA is unchanged; grep + review confirm no `2>/dev/null || true` remains
     on the reclaim proof-1 `git log` — its rc is captured separately (the
     `_tmp_err` idiom already used by the fetch path in `cmd_ensure_integration`)
     and a non-zero rc dies `EX_FOREIGN`, never reads as empty. (#728)
  2. All pre-existing reclaim cases (empty-orphan delete, unique-commit refusal,
     origin-present refusal, no-flag die) pass unmodified — resolvable-base reclaim
     behavior is byte-compatible. (#728)
  3. `record-as-owned <branch> <base> --owned-file PATH`: with a branch strictly
     descending from `<base>` it prints the `git log --oneline <base>..<branch>`
     ahead-commits, appends exactly one ledger line (via `record_owned_file`,
     which creates the ledger file/dir when absent), exits 0, and moves **no
     ref** (all branch SHAs unchanged); a second identical invocation is a no-op
     exit 0; it refuses (exit 3, ledger unchanged) when `<base>` is not an
     ancestor of `<branch>` or when either ref is unresolvable
     (`git rev-parse --verify --quiet` both, same fail-loud discipline as §4.5);
     after adoption, `ensure-integration` for the same slug/N takes the unchanged
     owned-reuse path (branch printed, tip SHA unchanged, no re-cut). (#725.1)
  4. The three existing `EX_FOREIGN` die messages that direct the operator to
     record a branch as owned (`cmd_ensure_integration`'s foreign-branch die,
     `cmd_teardown_task`'s no-ledger/unrecorded dies, `cmd_teardown_phase`'s
     equivalents) all name the literal `record-as-owned` verb. (#725.1)
  5. `ensure-worktree` on the **fresh-cut path only** (no local branch), invoked
     directly: a remote `refs/heads/<branch>` that is **not an ancestor of the
     frozen integration tip** dies with a **new dedicated exit code** (next free
     code in the script's exit-code header block, documented there) and a
     diagnostic **led by a stable machine-readable `STALE_REMOTE` marker line**
     (remote SHA, frozen tip — the token the provision barrier keys on to
     classify per task, never the numeric code) naming the *stale prior attempt*
     shape, both recovery directions — (a) adopt via
     `git branch <branch> <remote-sha>` + relaunch, (b) sanctioned
     `--reclaim-stale-remote` — **and the reversibility line**
     `git push origin <remote-sha>:refs/heads/<branch>`; no ref or worktree is
     created or modified. A remote that **is** an ancestor of (or equal to) the
     frozen tip warns and proceeds — its work is already integrated and a later
     plain push fast-forwards, so it is not a stale prior attempt. At the
     provision barrier this exit is a **per-task classification, never a phase
     halt** (end state 22). (#650)
  6. `ensure-worktree --reclaim-stale-remote` on the die shape deletes the remote
     ref (`git push origin --delete`, rc-checked, die on failure) only after
     **three mechanical proofs** — the branch matches the `war/*/p*-t*` namespace
     glob, the local ref is absent, and the remote tip is **not** an ancestor of
     the frozen tip — and warns with the deleted SHA plus the same restore
     command; then cuts fresh at the frozen tip. The flag is inert when a local
     ref exists (reuse path owns it) and inert on an ancestor remote (probe
     passed; nothing deleted). (#650, spec §8 risk)
  7. `ensure-worktree` fresh-cut with an **unreachable** remote warns and proceeds
     (worktree created at the frozen tip) — the probe's `ls-remote` rc is captured
     separately and network failure is fail-open by design (offline runs must
     provision; the worker's escalation sentence is the deliberate backstop). (#650)
  8. `sync-follower <branch>`: local == origin exits 0; local strictly behind and
     not checked out → guarded CAS fast-forward (`git update-ref` with expected old
     value); checked out anywhere → warn, still exit 0 (byte-consistent with
     `cmd_ensure_integration`'s follower-ff discipline); local absent → follower
     created at the origin tip; strictly ahead or diverged → exit 7 (`EX_DIVERGED`)
     with both SHAs and the two ADR 0008 repair directions (reuse the existing
     DIVERGED die wording); origin ref absent → die with the "nothing landed to
     origin — did the manual land push?" hint; `ls-remote` failure → die, never
     read as "absent". Never force-pushes; never touches origin. (#731)
  9. `ensure-integration` create path with **no local base ref** and a resolvable
     `origin/<base>` cuts the integration branch at the origin tip (warn emitted,
     exit 0, no follower ff — there is no local ref to move); with **neither**
     resolvable it dies naming the missing-local-ref cause and the fix (message
     references lesson `war-provision-barrier-needs-local-working-branch-ref`),
     not the raw "not a valid object name". (#725.4)
  10. `workflow-template.test.mjs`: with `args.recovery` **absent**, every
      dispatched prompt is byte-identical to today **except** the
      provision-barrier prompt, whose only delta is the always-on stale-remote
      classification step (end state 22 — the probe is default behavior, not
      recovery machinery); the recovery machinery itself (derive-and-skip,
      reclaim pass-through) is dormant and non-recovery launches are
      path-identical. With `args.recovery.sanctioned`, the
      provision-barrier prompt carries the derive-and-skip step and the
      `--reclaim-stale-remote` pass-through iff `recovery.reclaimStaleRemote`;
      a mocked barrier return `{ ok: true, preMerged: [ids] }` causes each listed
      task to be recorded `merged` (terminal task status — never `landed`) with
      note `recovered: pre-merged on adopted integration branch`, entered into
      the scheduler's done+succeeded sets and the `landed` list, given an
      `auditLog` entry, and **no worker dispatch occurs for it** — a merged-set
      task that is a `deps` entry of the re-dispatched task therefore satisfies
      the dep-block pre-check (no spurious `dep-failed`); tasks not listed
      dispatch normally; pre-merged tasks are **not** entered into
      `mergedTasksForGateAudit` (no gate log exists for them this run). (#725.2)
  11. `workflow-template.test.mjs`: the recovered phase still dispatches the
      post-merge gate-audit (`execution-evidence` lens) for the re-dispatched
      task at the newly integrated tip — the merged-set skip never skips the
      gate-audit — and the endState block (when the phase claims conditions)
      rides that pass, so every condition is verified at the integrated tip;
      in the degenerate all-pre-merged case with endState claims, the existing
      End-state-only seat branch fires. (#725.2)
  12. `workflow-template.test.mjs`: a worker result with `blocked_reason` starting
      with the literal `PLAN-DEFECT:` (strict case-sensitive `startsWith`,
      position 0 — the sentinel is a shared JS constant used by both the prompt
      string and the check) produces an escalation record with
      `defectClass: 'plan'` riding into the machine-readable `handoff` block;
      the sentinel is left inside `blocked_reason` (raw worker text is evidence,
      never stripped); without the sentinel the field is **absent** (never
      `'implementation'` by default); the escalation `reason` value is unchanged
      in both cases. Tagging applies at **every** site where worker-authored
      blocked text rides an escalation record — the wave-collector site
      (`escalated.push({ …, blocked: r.blocked })`, which also carries a blocked
      audit-round fix-worker's reason) **and** the floor sub-loop's blocked
      fix-worker site — covered by tests for both paths. (#725.3)
  13. `land-decision.test.mjs`: neither `'plan-defect'` nor `'held:plan-defect'`
      is a member of `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS`, asserted
      against **both** the canonical `land-decision.mjs` exports and the inline
      mirrors in `workflow-template.js`; `land-decision.mjs`'s diff is
      comment-only (a note on the `HARD_ESCALATION_REASONS` block that defect
      classification is escalation-record metadata, never a reason). (ADR 0005)
  14. Both-surfaces token tests in `workflow-template.test.mjs` (the established
      D3-registry idiom: a casing/position-stable **mid-sentence fragment** per
      sentence, never a quote/backtick-bearing byte literal): the `PLAN-DEFECT:`
      sentinel sentence and the stale-prior-attempt push-handoff sentence are
      each present on `agents/war-worker.md` **and** the dispatched worker
      prompt, with a delete-the-feature check per surface proving the anchors
      are non-vacuous. (#725.3, #650)
  15. Grep + review over the full plan diff: no **added executable git
      invocation** (shell command or JS-built command string) contains `--force`
      or `--force-with-lease`; the new prompt-prose sentence may name
      `--force-with-lease` only to forbid widening it; the
      `FORCE_WITH_LEASE_RULE` string and its `agents/war-worker.md` mirror are
      byte-unchanged (the existing byte-compare test still green, unmodified).
      (invariant)
  16. `skills/war/SKILL.md`: the held-partial-phase recovery runbook exists and
      sequences adjudicate (`defectClass: 'plan'` → `/red-team` plan amendment,
      stop) → map every `<base>..<integration>` commit to a merged task
      (unexplained commit → halt, ADR 0008) → `record-as-owned` against the
      ledger the relaunch will pass as `args.ownedFile` → sanctioned recovery
      relaunch passing the **full original phase DAG** plus `args.recovery`
      (threading `--reclaim-stale-remote` through it when sanctioned) → barrier-
      derived merged-set skip + single-task re-dispatch + gate-audit + unchanged
      CAS land → `sync-follower <working>` on any manual completion. The
      Recovery-relaunch subsection's **Owned-file continuity** bullet is
      reworded to route through `record-as-owned` (the tooled, proof-carrying
      form of its untooled "append the ref" option); the **Manual-land hygiene**
      paragraph is reworded in the same change to position the new trailing
      `sync-follower` step as a **deviation-detecting assertion** (correctness
      still comes from origin-derived cuts + `land-advance`'s mechanized
      follower CAS — the two paragraphs must not contradict); the
      escalation-completion-land recipe and both `held:land-failed` auto-recover
      recipes (a)/(b) each end with the `sync-follower <working>` step adjacent
      to their `land-advance` mention, citing `cmd_land_advance`'s follower CAS
      as the automated-path mechanization. (#725, #731)
  17. `CONTEXT.md` carries the four new/extended terms from spec §6: orphan
      adoption (`record-as-owned`), stale prior attempt, defect class, sanctioned
      recovery relaunch (extended usage).
  18. A new ADR (next free number in `docs/adr/`) records: partial-phase recovery
      is adoption plus re-dispatch, never deletion plus re-run — adopted tip as
      the recovery frozen base; merged-set from git ancestry; destructive
      reconciliation always flag-gated, mechanically-proved, fail-loud-on-command-
      error; `defectClass` stays out of every land/escalation enum.
  19. `skills/war/references/schemas.md` documents the four new contract rows:
      the `args.recovery` field (Provisioning args table — shape
      `{ sanctioned: true, reclaimStaleRemote?: boolean }`, absent ⇒ dormant),
      the provision-barrier env-outcome's optional `preMerged: [taskId]` return,
      the provision-barrier env-outcome's optional
      `staleRemote: [{ task, remoteSha, frozenTip }]` return, and the
      escalation record's optional `defectClass` metadata (never a
      `reason`). (#725.2, #725.3, #650)
  20. Suites green: `node --test 'skills/**/*.test.mjs'` and
      `bash skills/war/assets/provision-worktrees.test.sh`.
  21. Release: all four version slots (`.claude-plugin/plugin.json` `version`,
      `.claude-plugin/marketplace.json` `metadata.version` and
      `plugins[0].version`, the `README.md` `## Status` replace-in-place line)
      agree on the next free patch above the live integration base at land time.
  22. `workflow-template.test.mjs`: a mocked provision-barrier env-outcome
      carrying `staleRemote: [{ task, remoteSha, frozenTip }]` (mock keyed on
      the barrier dispatch **label**, lesson
      `provision-phase-mocks-must-match-on-label-not-just-phase`) records each
      listed task as the existing per-task **`env-blocked`** status with **no
      worker dispatch**, a blocked diagnostic carrying both recovery directions
      — adopt via `git branch <branch> <remoteSha>` + relaunch, or sanctioned
      `--reclaim-stale-remote` — and the restore command
      `git push origin <remoteSha>:refs/heads/<branch>`; sibling tasks dispatch
      normally with statuses unaffected; a dependent of a blocked task follows
      the **existing dep-failed semantics**; the classification rides the
      machine-readable `handoff` block; the barrier prompt instructs
      classify-and-continue on the `STALE_REMOTE` marker (a nonzero
      ensure-worktree exit whose output carries the marker is captured into
      `staleRemote`, remaining tasks still provisioned; any other nonzero exit
      remains a barrier failure as today); no whole-phase halt occurs. (#650)

## Build order (for /war)

Two phases. Phase 1 carries the whole feature in two waves: wave 1 is the three
file-disjoint code tasks (shell family; engine+worker-prompt+schemas family;
land-decision family) plus the ADR; wave 2 is the two prose tasks that name the
wave-1 constructs (`deps` edges, no file overlap). Phase 2 is the release bump
(decomposition rule 4: release = its own trailing phase; it touches the shared
slot files that every stacked plan in this campaign also touches).

## Phase 1 — Recovery mechanics, fail-loud proofs, and doctrine prose

### Task 1: provision-worktrees.sh — five mechanics + shell test cases

- Files: `skills/war/assets/provision-worktrees.sh`,
  `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: implement spec §4.5, §4.1, §4.4 (script half), §4.6, §4.7 in the one
  script that owns them all (same file → same task; splitting would either collide
  or serialize five lands for zero isolation gain):
  - **§4.5 reclaim proof-1 hardening (#728), in `cmd_ensure_integration`'s
    `--reclaim-empty-orphan` block:** before the log proof,
    `git rev-parse --verify --quiet "$base^{commit}"` or die `EX_FOREIGN`; replace
    the `orphan_commits="$(git log --oneline "$base..$branch" 2>/dev/null || true)"`
    swallow with an rc-captured form (the `_tmp_err` idiom the fetch path in this
    same function already uses — lesson
    `ensure-origin-swallows-stderr-unlike-sibling-subcommands`); non-zero rc dies
    `EX_FOREIGN` surfacing git's stderr; only rc-0 empty output passes proof 1.
    Update the two-proof comment block above the code. Grep the touched function
    for `2>/dev/null` prose describing proof 1 — **grep is a floor: also hand-scan
    the reclaim comment block and the test file's reclaim case family titles and
    comments for descriptions of the old swallowed-error behavior, and list any
    stragglers as survey-derived corrections.**
  - **§4.1 `record-as-owned <branch> <base> --owned-file PATH` (#725.1):** proof 1
    (lineage): `rev-parse --verify --quiet` both refs (die `EX_FOREIGN` on either
    failure), then `git merge-base --is-ancestor <base> <branch>` or die
    `EX_FOREIGN` (a branch not strictly descending from the frozen base is foreign
    work). Proof 2 (informed sanction): print the `<base>..<branch>` ahead-commits
    to stdout before recording — deliberately **prose-adjudicated, not
    mechanized**: task merges land under fast-forward topology (plus phase-close
    sweep polish merges), so a second-parent/merge-shape classifier would
    false-refuse legitimate histories; the Lead maps the printed commits to
    merged tasks via the run's audit log/ledger SHAs (runbook step 2), and an
    unexplained commit halts (ADR 0008). On both proofs: append `<branch>`
    idempotently via the existing `record_owned_file` helper (already-recorded →
    no-op exit 0; the helper mkdir-p's the ledger dir, so a not-yet-existing new
    run ledger is fine). **No ref is created, moved, or deleted.** New usage
    line + dispatch-table row. Align the three existing "record it as owned" /
    "record the branch as owned" / `(record-as-owned)` die messages
    (`cmd_ensure_integration` foreign-branch die, `cmd_teardown_task`,
    `cmd_teardown_phase`) on the literal `record-as-owned` verb — grep
    `record.*as.*owned` across the script, **plus a manual same-scope survey of
    every die message in the three functions for stragglers**.
  - **§4.4 stale-remote probe + `--reclaim-stale-remote` (#650), in
    `cmd_ensure_worktree`:** on the fresh-cut path only (local `<branch>` absent),
    probe `git ls-remote origin "refs/heads/<branch>"` with rc captured separately
    from output; network failure → warn and proceed (fail-open by design). The
    stale test is **ancestry, not SHA inequality** (this is the spec's own
    definition of a stale prior attempt — "never merged and shares only an older
    base"): a remote ref whose tip **is** an ancestor of (or equal to) the frozen
    integration tip is already-integrated work — warn and proceed (a later plain
    push fast-forwards; dying or deleting here would punish exactly the merged
    tasks a recovery relaunch re-provisions). A remote ref that is **not** an
    ancestor → die with a **new dedicated exit code** (next free code in the
    exit-code header block; document it there — live-artifact rule, never restate
    the final number in prose elsewhere) and a diagnostic **led by a stable
    machine-readable `STALE_REMOTE` marker line** (remote SHA, frozen tip) —
    the token the provision barrier keys on to classify the task per-task
    instead of halting (engine half, Task 2; the numeric code is never
    special-cased in prompt prose) — naming the stale-prior-attempt shape,
    both recovery directions (mirroring the ensure-integration DIVERGED die's
    two-direction style), **and the restore command**
    `git push origin <remote-sha>:refs/heads/<branch>`
    (reversible-until-GC, ADR 0008 spirit). The die is the script's own
    direct-invocation contract; at the run level the stale shape routes as a
    per-task `env-blocked` soft outcome, never `held:workflow-error`. `--reclaim-stale-remote` (new flag on
    `ensure-worktree`, Lead-supplied only on a sanctioned recovery relaunch):
    **three mechanical proofs** before acting — (1) `<branch>` matches the
    `war/*/p*-t*` namespace case-glob (the positional is caller-supplied, so the
    namespace claim is proved in-script, not by construction; every other
    destructive path here proves its own preconditions), (2) local ref absent
    (local ref present → flag inert, reuse path owns it), (3) the remote tip is
    NOT an ancestor of the frozen tip (never delete integrated work); then
    `git push origin --delete "refs/heads/<branch>"` rc-checked (die on failure)
    with a warn printing the deleted SHA + the same restore command, and cut
    fresh at the frozen tip as today. **No force-push exists on any path.**
  - **§4.6 `sync-follower <branch>` (#731 residual):** local via
    `rev-parse --verify --quiet refs/heads/<branch>`; origin via `ls-remote` with
    rc captured separately (rc ≠ 0 → die, network error is never "absent"; origin
    genuinely absent → die with the "nothing landed to origin — did the manual
    land push?" hint). Equal → exit 0. Local strictly behind
    (`merge-base --is-ancestor local origin`) → guarded CAS ff (`git update-ref`
    with expected old value), skipped with a warn (still exit 0) when checked out
    anywhere. Local absent → create the follower at the origin tip (mirrors
    `cmd_land_advance`'s create branch). Ahead/diverged → die `EX_DIVERGED` with
    both SHAs, reusing the existing DIVERGED die's two-repair-directions wording.
    Never force-pushes, never touches origin. This subcommand **cites** the landed
    #593 mechanization (`cmd_land_advance` post-push readback + follower CAS +
    ALREADY-LANDED reconcile; `cmd_ensure_integration` create-path reconcile) as
    the automated-path contract — it does not rebuild any of it. New usage line +
    dispatch-table row.
  - **§4.7 missing local base ref (#725.4), in `cmd_ensure_integration`'s create
    path:** extend the post-fetch resolution: `local_sha` empty + `origin_sha`
    non-empty → `cut_ref="$origin_sha"` with a warn naming the origin fallback
    (no follower ff — nothing local to move); both empty → die with the
    missing-local-ref diagnostic naming the cause and fix and referencing lesson
    `war-provision-barrier-needs-local-working-branch-ref`.
  - **Tests (`provision-worktrees.test.sh`, extending the existing case
    families):** reclaim unresolvable-base (exit 3, orphan tip unchanged) +
    existing reclaim cases unmodified; record-as-owned accept/print/no-ref-moved,
    idempotent re-run, non-ancestor refuse, unresolvable-ref refuse,
    ensure-integration owned-reuse after adoption; stale-remote probe die on a
    non-ancestor remote (fixture remote, nothing created, message carries the
    `STALE_REMOTE` marker + the restore command, dedicated exit code pinned
    here as the script's own contract), ancestor-remote warn-and-proceed
    (nothing deleted), reclaim
    flag deletes a non-ancestor remote + cuts fresh (warn carries deleted SHA +
    restore command), flag inert with local ref, flag refuses a non-namespace
    branch shape, unreachable-remote warn-and-proceed; sync-follower equal /
    behind-ff / checked-out-warn / diverged exit 7 no-ref-moved /
    origin-absent die / ls-remote-failure die; origin-fallback cut (warn, exit 0)
    and both-absent die message.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: workflow-template.js engine mechanics + war-worker.md mirrors + schemas.md rows + tests

- Files: `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`, `agents/war-worker.md`,
  `agents/war-refiner.md`, `skills/war/references/schemas.md`
- Plan slice: implement spec §4.2, §4.3 (engine + worker surfaces), §4.4
  (barrier classification + env-blocked mapping + prompt half), plus the
  schemas.md contract rows. The two `agents/war-worker.md`
  sentences land in the same commit as their `workflow-template.js`
  dispatched-prompt twins (prompt-surface split):
  - **§4.2 merged-set derivation — placement resolved:** the Workflow sandbox has
    no shell/fs (the args-header comment is the contract), so the ancestry checks
    are run by the **existing provision-barrier refiner dispatch** (dispatchKind
    `'provision-barrier'` — no new dispatch, no new dispatchKind; existing mocks
    keyed on label/dispatchKind are unaffected, lesson
    `provision-phase-mocks-must-match-on-label-not-just-phase`). Gating: a new
    top-level `args.recovery` (`{ sanctioned: true, reclaimStaleRemote?: boolean }`;
    absent ⇒ everything below is dormant and every dispatched prompt is
    byte-identical to today apart from the barrier prompt's always-on §4.4
    stale-remote classification clause (default behavior, not recovery
    machinery — end states 10/22), and `resumeFromRunId` replays / accidental
    same-named local
    branches never trigger derivation). When `recovery.sanctioned`, the barrier
    prompt's per-task step 3 becomes derive-then-cut: after capturing TIP, for
    each task **first** check whether the local task branch exists AND
    `git merge-base --is-ancestor <branch> "$TIP"` holds — on true, report the
    task id in a new optional `preMerged` array on the env-outcome return and
    **skip that task's ensure-worktree** (no worktree is needed for a task that
    will not run; this ordering also means a fresh cut can never pollute the
    ancestry check — derivation always precedes creation); on false/absent, run
    ensure-worktree as today, appending `--reclaim-stale-remote` iff
    `recovery.reclaimStaleRemote`. `ENV_OUTCOME` gains the optional
    `preMerged: { type: 'array' }` property. Post-barrier, the Workflow records
    each returned pre-merged id that matches a task: status `merged` (terminal
    task status — never `landed`) with note
    `recovered: pre-merged on adopted integration branch`, `done.add` +
    `succeeded.add` (so a dep-block pre-check on the re-dispatched task passes),
    `landed.push(id)` (the phase-return landed list is bare task ids), one
    `auditLog` entry, and **no worker dispatch**; it does **not** enter
    `mergedTasksForGateAudit` (no gate ran for it this run — the handoff `tipSha`
    fallback reads `mergedTasksForGateAudit`, which stays truthful). Everything
    downstream is unchanged: full Work+Audit for the re-dispatched task, serial
    Refine, per-task post-merge gate-audit (`execution-evidence` lens) at the new
    integrated tip with the endState block riding it (the seat verifies every
    claimed condition at the tip, so conditions owned by pre-merged tasks render
    `met` **earned**, never silent — the existing End-state-only seat branch
    covers the degenerate all-pre-merged case), unchanged push-first CAS land.
    Issue labels and `ledger.json` are reconciled toward the git-derived answer
    by the Lead (runbook step; ADR 0008 — records toward git, engine touches
    neither). **Note (spec §8): a task branch that exists but is NOT an ancestor
    (the escalated task's half-done branch) takes the existing-branch reuse path
    — prior commits kept, no reset added anywhere.**
  - **§4.3 sentinel + defectClass:** define one shared JS constant (e.g.
    `PLAN_DEFECT_SENTINEL = 'PLAN-DEFECT:'`) used by both the prompt sentence and
    the check — the contract is strict, case-sensitive `startsWith` at position 0
    (no trim, no case folding; the worker is instructed to *prefix*), and the
    sentinel is **left inside `blocked_reason`** (raw worker text is the evidence
    trail; never stripped). One sentence added to the worker's "Stop and escalate
    instead of guessing" clause on **both** surfaces (standing card section in
    `agents/war-worker.md`; the dispatched worker prompt string in
    `workflow-template.js`): when the block's root cause is a plan/spec defect
    (plan contradicts the code, a specced construct cannot exist as described, an
    ambiguity with no intent-consistent resolution), prefix `blocked_reason` with
    the literal token `PLAN-DEFECT:`. Tagging applies at **every** escalation
    site whose record carries worker-authored blocked text — the wave-collector
    push (`{ …, blocked: r.blocked }`, which already carries both the initial
    worker's and a blocked audit-round fix-worker's reason) and the floor
    sub-loop's blocked-fix-worker push — via one tiny helper (a fix-round plan
    defect is exactly as plan-shaped as a first-round one; the engine-authored
    blocked strings at the other sites can never carry the sentinel and need no
    exclusion logic). Set `defectClass: 'plan'` iff the blocked text starts with
    the sentinel; **absent** otherwise. `defectClass` is metadata orthogonal to
    `reason` — it never enters `decideLand`, `HARD_ESCALATION_REASONS`, or
    `KNOWN_LAND_DECISIONS` (ADR 0005; the negative guard is Task 3's), and it
    rides the escalation record into the `handoff` block. Vocabulary already
    checked in the spec: `plan-defect` collides with no provenance tier or
    existing enum/tag.
  - **§4.4 barrier classification → per-task `env-blocked` mapping
    (operator-ratified routing):** the provision-barrier prompt's per-task
    ensure-worktree step gains an **always-on** classify-and-continue clause
    (not gated on `args.recovery` — the probe is default behavior): a nonzero
    ensure-worktree exit whose output carries the `STALE_REMOTE` marker is
    captured — task id, remote SHA, frozen tip — into a new optional
    `staleRemote` array on the env-outcome return, and the barrier **continues
    with the remaining tasks** (the marker token is the key, never the numeric
    exit code — live-artifact rule; any other nonzero exit remains a barrier
    failure exactly as today). `ENV_OUTCOME` gains the optional
    `staleRemote: { type: 'array' }` property. Post-barrier, the Workflow maps
    each `staleRemote` entry to the **existing per-task `env-blocked` status**
    (worker never spawned) with the full two-direction diagnostic — (a) adopt
    via `git branch <branch> <remoteSha>` + relaunch, (b) sanctioned
    `--reclaim-stale-remote` — plus the restore command
    `git push origin <remoteSha>:refs/heads/<branch>`; the entry rides the
    machine-readable `handoff` block. Siblings dispatch normally; **dependents
    of a blocked task follow the existing dep-failed semantics** (no new
    routing); the phase ends in the normal held/handoff flow and recovery is
    adjudicate + relaunch with the merged-set skip (§4.2) re-dispatching only
    the blocked task(s). ADR 0021's all-or-nothing topology barrier is **not**
    restructured — all cuttable worktrees are still cut from the one frozen
    base; stale-remote is env classification, the same family as
    `run.provision` failures.
    **Standing-card twin (`agents/war-refiner.md`, prompt-surface split —
    the provision barrier is refiner-dispatched, `dispatchKind:
    provision-barrier`):** that card today reads "Fail **loud** on any non-zero
    exit — do not special-case a code"; reword it in the SAME commit so a
    `STALE_REMOTE`-marker exit is the one classify-and-continue carve-out
    (capture into the `staleRemote` env-outcome array, continue with the
    remaining tasks) while every other nonzero exit stays fail-loud exactly as
    today — the marker token is the key, never the numeric code. Add a
    both-surfaces token test asserting the barrier's dispatched clause
    (`workflow-template.js`) and the `war-refiner.md` card carry the same
    `STALE_REMOTE` carve-out (anchor-token, delete-the-feature per surface —
    not a new inline mirror of a canonical export, so no D2 registry row is owed).
  - **§4.4 stale-prior-attempt sentence:** one sentence adjacent to
    `FORCE_WITH_LEASE_RULE` on both surfaces (`agents/war-worker.md` "Dep-wave
    rebase + force-with-lease carve-out" section; the dispatched prompt clause in
    `workflow-template.js` where `FORCE_WITH_LEASE_RULE` is concatenated):
    a non-fast-forward push rejection where the remote task branch was never
    merged and shares only an older base is a *stale prior attempt* — do not
    rebase onto it, merge it, or widen `--force-with-lease`; escalate with the
    remote tip SHA and the divergence base in `blocked_reason`.
    `FORCE_WITH_LEASE_RULE` itself stays **byte-identical** and its existing
    byte-compare test is not touched.
  - **schemas.md rows:** the `args.recovery` field in the Provisioning-args
    table (shape, dormant-when-absent semantics, who supplies it — the Lead, only
    on a sanctioned recovery relaunch per the SKILL.md runbook), the env-outcome
    `preMerged` return, the env-outcome
    `staleRemote: [{ task, remoteSha, frozenTip }]` return (always-on
    classification, per-task `env-blocked` mapping), and the escalation
    record's optional `defectClass`
    (metadata, never a `reason`; shape-compatible absence). The existing
    `schemas-manifest.test.sh` locks only manifest-contract phrases — these are
    pure additions.
  - **Tests (`workflow-template.test.mjs`):** recovery-absent byte-identity
    (every prompt except the barrier's, whose sole delta is the always-on
    stale-remote classification clause — asserted present regardless of
    `args.recovery`); recovery-sanctioned barrier prompt
    carries the derive-and-skip step; reclaim pass-through iff
    `recovery.reclaimStaleRemote`; mocked `preMerged` → `merged` + done/succeeded/
    landed/auditLog + no dispatch + dep-on-pre-merged task not `dep-failed` +
    not in `mergedTasksForGateAudit`; mocked `staleRemote` (mock keyed on the
    barrier dispatch label) → per-task `env-blocked` + no worker dispatch +
    two-direction diagnostic with restore command + handoff visibility +
    siblings dispatch normally + dependent of a blocked task follows existing
    dep-failed semantics (end state 22); absent/non-ancestor branch → normal
    dispatch; gate-audit still dispatched on the recovered phase; `defectClass`
    tagging (sentinel → `'plan'` + rides handoff; no sentinel → field absent;
    `reason` unchanged both ways; covered at both the wave-collector and
    floor-sub-loop sites); two both-surfaces token tests for the new sentences
    (the D3-registry idiom — casing/position-stable mid-sentence fragments on
    `agents/war-worker.md` and the emitted worker prompt, never quote/backtick
    byte literals; run a delete-the-feature check per surface to prove the
    anchors are non-vacuous). These are anchor-token both-surfaces tests, not
    new inline mirrors of a canonical export — no D2 mirror-registry row is owed.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: land-decision negative drift-guard + comment

- Files: `skills/war/assets/land-decision.mjs`,
  `skills/war/assets/land-decision.test.mjs`
- Plan slice: spec §4.3's guard half. `land-decision.test.mjs` gains the negative
  drift-guard: neither `'plan-defect'` nor `'held:plan-defect'` is a member of
  `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS`, asserted against **both**
  the canonical exports it already imports and the hand-mirrored inline copies in
  `workflow-template.js` (read the file's text / extract the mirrored arrays the
  way the existing mirror assertions do — read-only on `workflow-template.js`, no
  edit, so this task stays file-disjoint from Task 2). `land-decision.mjs` changes
  **comment-only**: a note on the `HARD_ESCALATION_REASONS` block that defect
  classification is escalation-record metadata on the escalation record, never a
  reason enum member (pins ADR 0005 against someone later "completing" the
  feature into the enum). No enum member added or removed anywhere in this task.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: ADR — partial-phase recovery is adoption plus re-dispatch

- Files: `docs/adr/0035-partial-phase-recovery-adoption-not-deletion.md`
  (number = next free in `docs/adr/` at rebase time; 0035 measured at draft time
  against a live 0034 tip — re-derive from the live directory, never trust this
  literal; parallel campaign plans may also add ADRs)
- Plan slice: spec §7's recommended ADR, as a decision record (not a mechanics
  duplicate): the adopted integration tip becomes the recovery relaunch's frozen
  phase base; the merged-set is derived from git ancestry, never labels/ledger,
  and is executed by the provision-barrier refiner (the engine has no shell —
  agents run git, the Workflow routes results); destructive reconciliation
  (empty-orphan delete, stale-remote delete) is always flag-gated, mechanically
  proved (namespace + local-absence + ancestry), fail-loud-on-command-error (a
  git error is never "empty"/"absent"), and prints its own reverse path;
  `defectClass` stays out of every land/escalation enum. Note explicitly that no
  amendment to ADR 0005 or ADR 0008 is needed — this doctrine operates strictly
  inside both.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: SKILL.md — recovery runbook + sync-follower recipe steps + routing + prose reconciliation

- Files: `skills/war/SKILL.md`
- Plan slice: spec §4.8 + the §4.6 recipe steps + §4.3 routing prose + the two
  same-file prose reconciliations the new steps force:
  - New subsection under the resume/held adjudication doctrine — the
    **held-partial-phase recovery runbook** — sequencing: (1) adjudicate the
    escalation (`defectClass: 'plan'`, or a Lead reading the audit log and
    locating the defect in the plan slice → `/red-team` plan amendment, stop —
    never worker fix-rounds, never escalation-completion; implementation defect →
    continue); (2) map every `git log <base>..<integration>` commit to a merged
    task in the run's audit log/ledger (unexplained commit → halt, ADR 0008);
    (3) `record-as-owned <integration-branch> <base> --owned-file <ledger>` where
    `<ledger>` is **the file the relaunch will pass as `args.ownedFile`** —
    default: reuse the prior run's `.claude/teams/<prior-run-id>/owned-refs`
    (which typically already records the branch; the invocation is then an
    idempotent no-op whose printed ahead-commits still serve step 2's
    adjudication), else point it at the new run's path (the subcommand creates
    the file); (4) relaunch as a sanctioned recovery relaunch passing the **full
    original phase DAG** with the adopted integration tip as the frozen phase
    base and `args.recovery: { sanctioned: true, reclaimStaleRemote: <adjudicated> }`
    — the barrier-derived merged set is authoritative over any hand-filtered
    DAG (git > Lead bookkeeping); (5) the derivation skips the merged tasks,
    re-dispatches the escalated one, re-runs the gate-audit, lands through the
    unchanged CAS path; the Lead then reconciles issue labels + ledger toward
    the recovered statuses (the standard pre-flight direction); (6) on any
    *manual* completion instead, finish with `sync-follower <working>`.
    Cross-reference the existing escalation-completion-land recipe as the
    "small, fully-understood Major" shortcut and Recovery-relaunch entry (a) as
    the dep-less single-task form; position the full-DAG recovery relaunch as
    the default for a held partial phase.
  - **Owned-file continuity bullet (Recovery relaunch subsection):** reword to
    route through `record-as-owned` — it is the tooled, proof-carrying form of
    the bullet's existing untooled "append the `integration/<slug>/phase-<N>`
    ref into the new run's owned-file" option; the reuse-the-prior-ledger option
    stays first. No third path is introduced.
  - The **escalation-completion land** recipe and **both** `held:land-failed`
    auto-recover recipes (a) and (b) each gain a final
    `node …/provision-worktrees.sh sync-follower <working>` step, placed adjacent
    to each recipe's `land-advance` mention (the structure-test-friendly anchor),
    with the prose citing `cmd_land_advance`'s follower CAS as the automated-path
    mechanization — the manual step is an **assertion catching a recipe
    deviation** (a raw `git push` instead of `land-advance`), not a load-bearing
    sync.
  - **Manual-land hygiene paragraph:** reword in this same task so it cannot
    read as contradicting the new trailing step — pre-phase sync remains
    non-load-bearing for correctness (origin-derived cuts + the mechanized
    follower CAS), and the trailing `sync-follower` is the cheap deviation
    detector for the manual paths, not a required sync.
  - Grep the SKILL.md manual-land prose for statements the new assertion step
    supersedes — **grep is a floor: hand-scan the resume/held adjudication
    subsections, the Recovery-relaunch subsection, and the "Manual-land hygiene"
    paragraph for stragglers and list them as survey-derived corrections.**
- requiresTest: false
- requiresPackaging: false
- deps: [Task 1, Task 2]  ← wave edge: the runbook names `record-as-owned`,
  `--reclaim-stale-remote`, `args.recovery`, `sync-follower`, and `defectClass` —
  the worker rebases onto the integration tip and verifies each named construct
  exists in the merged code before citing it (no file overlap with Tasks 1–2)
- target repo: superproject

### Task 6: CONTEXT.md — four domain terms

- Files: `CONTEXT.md`
- Plan slice: spec §6, placed in the fitting existing `###` subsections (orphan
  adoption + stale prior attempt under Worktree provisioning; defect class under
  Phase outcomes or Clean handoff; sanctioned recovery relaunch extends its
  existing usage under State & resume — locate by term, not line number):
  **orphan adoption (`record-as-owned`)** — repairing the owned-file ledger
  toward git so a non-empty partial-phase integration branch becomes a legitimate
  resume target, the ADR 0008-conformant opposite of reclaim-deletion; **stale
  prior attempt** — an unmerged remote `war/<slug>/pN-tK` whose tip is not an
  ancestor of the frozen phase base's integration tip, left by a prior run whose
  local state was torn down; blocks the identically-named relaunch push;
  reconciled by Lead-sanctioned remote deletion, never force-push; **defect
  class** — escalation-record metadata (`defectClass: 'plan'`) distinguishing a
  plan/spec defect (routes to `/red-team` plan amendment) from an implementation
  defect (routes to fix-rounds / escalation-completion), orthogonal to escalation
  `reason`, never an enum member; **sanctioned recovery relaunch** — extend the
  existing entry: now also the context that licenses `record-as-owned`,
  `args.recovery`/`--reclaim-stale-remote`, and the merged-set single-task
  re-dispatch.
- requiresTest: false
- requiresPackaging: false
- deps: [Task 1, Task 2]  ← wave edge: same reason as Task 5; file-disjoint from
  everything in this plan (contention with stacked predecessors noted below)
- target repo: superproject

## Phase 2 — Release

### Task 7: Version bump across the four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
  `README.md`
- Plan slice: bump all four version slots together — `.claude-plugin/plugin.json`
  `version`, `.claude-plugin/marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place,
  never emptied, no badge) — to the **next free patch above the live integration
  base at land time**. This plan stacks fourth in its campaign: up to three
  predecessors may each have bumped, so the worker resolves the number by reading
  the four slots at its rebased base and taking the next free patch — a plan
  version literal is non-authoritative by doctrine, which is why none appears
  here. Standalone fallback (plain `/war`, no campaign): the same rule holds —
  resolve the next free patch from the four slots themselves. Release blurb
  (README Status line context, if any prose accompanies the bump): describe the
  recovery tooling without quoting retired old-behavior tokens (the
  rename-blurb absence-guard lesson).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Live-fire recovery of a real held partial phase** (the observed
  `wf_20ff5e9e-6a4` shape: adopt via `record-as-owned`, relaunch with
  `args.recovery`, merged-set skips N−1 tasks, one re-dispatch, gate-audit, CAS
  land) · why deferred: the unit/shell tests prove each mechanic in fixture
  repos and the engine path against a mocked barrier return, but the end-to-end
  Lead-driven runbook sequence over a genuine `held:escalation` cannot be
  synthesized inside a task gate · runner: the Lead, first real `held:escalation`
  recovery after this plan lands (runbook §4.8 is the script); result recorded in
  that run's ledger/phase report.
- **Offline probe fail-open under a genuinely absent network** · why deferred:
  the shell test simulates an unreachable remote via a bad remote URL; a true
  no-network environment (DNS down, sandbox `--network none`) may fail in a
  different mode · runner: `/red-team` executed probe or the first offline
  relaunch; the worker's stale-prior-attempt escalation sentence is the designed
  backstop either way (spec §8).

## Notes / conscious deviations

- **§4.2 placement (grill Q1, resolved).** The spec locates the merged-set
  derivation "in `workflow-template.js`", but the Workflow sandbox has no
  shell/fs (its own args-header contract). Resolution: the **existing
  provision-barrier refiner dispatch** runs the ancestry checks and returns the
  merged set via a new optional `preMerged` field on its env-outcome — no new
  dispatch, no new dispatchKind, existing mock keying untouched, and criteria
  10/11 stay pure-JS testable by mocking the barrier return. The rejected
  alternatives: a Lead-computed args list (trusts Lead bookkeeping over git —
  the exact failure ADR 0008 exists to prevent) and a new dedicated dispatch
  (a second Provision-phase dispatch shape for zero isolation gain).
- **Derivation precedes creation (grill Q2, resolved).** The refiner derives
  per task **before** cutting: a pre-merged task's ensure-worktree is skipped
  entirely (no worktree for a task that never runs), so a fresh cut can never
  pollute the ancestry check and the spec's "vacuous on a first run" claim is
  true by ordering, not by luck. Belt: the §4.4 probe keys on **ancestry**, not
  SHA inequality — a lingering remote of an already-merged task (torn-down-local
  shape) warns and proceeds instead of being flagged or deleted. The spec's
  §4.4 (as amended 2026-07-11) states this ancestry rule directly.
- **Derivation is gated, not unconditional (grill Q17, resolved).** A new
  top-level `args.recovery` (documented in schemas.md) arms both the derive-and-
  skip step and the `--reclaim-stale-remote` pass-through; absent ⇒ every
  dispatched prompt is byte-identical to today except the barrier prompt's
  always-on stale-remote classification clause (default behavior, not recovery
  machinery — end state 10), so `resumeFromRunId` replays and
  coincidental same-named local branches are untouched by construction.
- **Engine derivation vs the SKILL.md pre-flight (grill Q6, resolved).** The
  reconciliation pre-flight remains the Lead's diagnostic and bookkeeping-repair
  tool; the barrier derivation is the **authoritative execution-time filter**
  (git at the moment of provisioning > any Lead-assembled DAG). The runbook
  passes the full original phase DAG and lets the engine skip — this also fixes
  the dep hole in Recovery-relaunch entry (a): a single-task DAG dep-blocks when
  the escalated task depends on a merged sibling absent from `args.tasks`.
  Entry (a) remains documented for dep-less single-task retries.
- **Pre-merged bookkeeping (grill Q4, resolved).** In-engine: `done` +
  `succeeded` (dep-gate), `landed` (bare ids — matching `landed.push(task.id)`),
  one `auditLog` entry, **not** `mergedTasksForGateAudit` (the handoff `tipSha`
  fallback reads that list; skipped tasks contribute no gateHeadSha and must
  not). Labels/ledger: Lead-reconciled toward git per the pre-flight direction.
- **Gate-audit / endState scope (grill Q5, resolved — no code change).** The
  per-task gate-audit covers only this-run-merged tasks (only they have
  `.war/gate-<id>.log`); the endState block rides that pass and the seat
  verifies **every** claimed condition at the integrated tip, so conditions
  owned by pre-merged tasks render `met` earned (the content is in the tip and
  the seat examined it), never silently. The existing End-state-only seat branch
  covers the degenerate all-pre-merged relaunch.
- **defectClass sites (grill Q7, resolved).** Tagging applies wherever
  worker-authored blocked text rides an escalation record — the wave-collector
  push and the floor-sub-loop push — via one helper; a fix-round plan defect is
  as plan-shaped as a first-round one. Engine-authored blocked strings can never
  carry the sentinel; no exclusion logic needed.
- **Sentinel contract pinned (grill Q8, resolved).** Shared JS constant; strict
  case-sensitive `startsWith` at position 0; sentinel left inside
  `blocked_reason` (evidence, never stripped). Both-surfaces tests use the
  D3-registry mid-sentence-fragment idiom, not byte-compare
  (`shared-string-constant-quote-literal-byte-anchor-fragility`);
  `FORCE_WITH_LEASE_RULE`'s existing byte-compare is untouched.
- **Ledger target (grill Q9, resolved).** `record-as-owned` targets the file
  the relaunch will pass as `args.ownedFile`; default is reusing the prior run's
  ledger (already records the branch — the invocation degrades to an idempotent
  proof-and-print). It supersedes the Owned-file-continuity bullet's untooled
  "append the ref" option (reworded in Task 5); no third operator path exists.
- **Proof 2 stays prose (grill Q10, resolved).** Task merges land under
  fast-forward topology (and the phase-close sweep adds polish merges), so a
  mechanical merge-shape/second-parent classifier would false-refuse legitimate
  histories; the printed ahead-commits + Lead mapping against audit-log/ledger
  SHAs is the ADR 0008 mechanism, and the runbook's halt-on-unexplained is its
  teeth. Backstop 1 (live-fire recovery) exercises it.
- **Reclaim proofs mechanized (grill Q3/Q11/Q12, resolved).** The remote
  deletion now carries three in-script proofs (namespace case-glob on the
  caller-supplied positional, local-ref absence, non-ancestry of the frozen
  tip) and both the die and the reclaim warn print the remote SHA + the restore
  command (`git push origin <sha>:refs/heads/<branch>`) — reversible until
  remote GC. Phase-wide flag threading is safe because deletion is per-branch
  proof-gated, not sanction-only (see survivor 1).
- **Criterion-15 scope (grill Q13, resolved).** The force-token check covers
  **added executable git invocations** only; the new worker-prompt sentence
  deliberately names `--force-with-lease` to forbid widening it, and prose/
  comments are excluded from the grep's blast radius (end state 15 wording).
- **Operator-ratified survivor adjudication (2026-07-11): §4.4 failure routing
  changed from whole-phase barrier die to per-task env-blocked soft outcome**
  (probe-classification at the barrier; ADR 0021 topology all-or-nothing
  untouched; siblings proceed; recovery via adopt + merged-set re-dispatch).
  Overrides the spec's original resolved-tree row by operator decision.
  Rationale: phases are growing — a whole-phase halt on one task's stale ref
  wastes reruns, and this plan's own adopt + merged-set machinery makes a held
  partial phase cheaply recoverable. Mechanics: the script keeps its dedicated
  exit code + `STALE_REMOTE` marker as the direct-invocation contract (end
  state 5, pinned in the shell test); the barrier keys on the marker token
  (never the numeric code — the barrier prompt still never special-cases
  codes) and classifies into the env-outcome `staleRemote` list; the engine
  maps to the existing `env-blocked` status (end state 22).
- **Stack contention (roadmap table input).** This plan stacks **last (pos 4)**
  in its campaign and overlaps: `skills/war/assets/workflow-template.js` +
  `workflow-template.test.mjs` with plan 2026-07-11-drift-guard-tightening
  (pos 2, test-only) and plan 2026-07-11-servitor-redaction-at-source (pos 3,
  D3 registry row + template edit); `CONTEXT.md` with
  2026-07-11-red-team-resilience (pos 1); the four release slots with pos 1 and
  pos 3. Mitigations baked in: every edit here is anchored by named construct
  (`cmd_ensure_integration` reclaim block, `FORCE_WITH_LEASE_RULE`, "Stop and
  escalate instead of guessing", the D3/D2 registries), never line number; any
  registry/floor count encountered at rebase (e.g. the D3 `REGISTRY.length >=`
  floor pos 3 raises to 10) is **re-derived from the live array at rebase time,
  never taken from a plan literal**; the ADR number and the version are resolved
  from the live artifacts at rebase/land time.
- **Task decomposition confirmed (grill Q16).** Two mega code tasks are forced
  by the file-disjoint rule (five shell mechanics share one script + one test
  file; three engine mechanics share the template + its test + the worker card),
  with §4.4 split across them along its natural surface seam — the script half
  in Task 1, the prompt half + its both-surfaces test wholly in Task 2 (the test
  reads only Task-2 surfaces). Task 3 reads `workflow-template.js` without
  editing it, staying disjoint. SKILL.md (§4.6 recipe steps + §4.8 runbook +
  reconciliations) is one task; CONTEXT.md another.
- **Surface completeness (grill Q18).** schemas.md added to Task 2 (args flag,
  `preMerged`, `defectClass` — end state 19); CONTEXT.md and the ADR were
  already tasks. CLAUDE.md's execution-architecture paragraph is **deliberately
  untouched**: the normal phase path is unchanged and the recovery runbook is
  SKILL.md doctrine; promote later only if recoveries become routine.
- **Task 1 is deliberately large** (five mechanics). They all live in
  `provision-worktrees.sh` + its one test file; the same-file rule binds them into
  one task, and splitting across phases would serialize five lands for no
  isolation gain. The five mechanics are internally independent (distinct
  functions/subcommands), which keeps audit reviewable per-mechanic.
- **`--reclaim-stale-remote` deletes unique commits by design** (the superseded
  attempt is unmerged — proof 3 proves non-ancestry). Sanction = the
  Lead-supplied `args.recovery` on a recovery relaunch; safety floor = the three
  proofs plus the default fail-loud die whose diagnostic forces adopt-vs-discard
  adjudication first, plus the printed restore line. End state 6 proves the flag
  is inert when a local ref exists (spec §8's required test).
- **`defectClass` absent ≠ `'implementation'`.** The field is only ever set to
  `'plan'`; absence keeps prior-run records shape-compatible and asserts no
  classification nobody made (spec §4.3).
- **No enum touches anywhere** (ADR 0005): no new member of
  `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or the task/phase status
  enums; the re-dispatch path classifies already-integrated tasks with the
  existing terminal `merged`. Task 3's negative guard pins this permanently.
- **`sync-follower` checked-out-behind warns and exits 0** — consistent with
  ensure-integration's follower-ff skip; tightening to a distinct exit code is an
  explicit follow-up if operators find the warn insufficient (spec §8), not this
  plan. The trailing recipe step is a deviation detector by design — it passes
  trivially when the recipe was followed, and that is its job (grill Q15).
- **#731's automated half is cited, not rebuilt**: `cmd_land_advance` +
  `cmd_ensure_integration` create-path reconcile (landed #593) are the contract;
  the only new code is the manual-path assertion subcommand.
- **Out of scope (spec §9):** the #650 red-team ff-topology half (red-team file
  family); the auditor-lens plan-defect sentinel (`agents/war-auditor.md` —
  Lead-adjudication prose covers it until an auditor-family group picks it up);
  automated `/red-team` invocation on `defectClass: 'plan'` (routing stays a Lead
  decision); unconditional restart-time remote cleanup (rejected, not deferred).

## Open decisions

One decision remains surfaced for the operator at the interactive gate (it has
a baked-in recommendation the plan already implements; overriding it is a
small, localized edit). A second draft-time decision — stale-remote failure
routing — was adjudicated by the operator on 2026-07-11 in favor of the
per-task `env-blocked` soft outcome and is no longer open (see the
operator-ratified survivor adjudication entry in Notes; the spec's resolved
tree carries the matching amendment line):

1. **Reclaim sanction scope.** `args.recovery.reclaimStaleRemote` threads
   `--reclaim-stale-remote` onto **every** ensure-worktree line of the relaunch —
   one sanction can authorize N remote deletions. Recommendation (implemented):
   keep phase-wide threading; each deletion is independently proof-gated
   (namespace glob + local-absence + **non-ancestry of the frozen tip**, so
   merged work is mechanically undeletable) and prints its restore command.
   Alternative (per-branch flag values) buys marginal safety the ancestry proof
   already provides, at real threading complexity. Raised because remote
   deletion is the plan's least reversible act.

All other draft-time unknowns are live-artifact lookups, not decisions: the new
ensure-worktree exit code (next free in the script's header block; 8 measured at
draft time) and the ADR number (next free in `docs/adr/`; 0035 measured at draft
time) are re-derived from the live artifacts at implementation time.
