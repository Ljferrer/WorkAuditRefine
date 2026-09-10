# Refiner recovery — submodule-as-repo provisioning, reland discrimination, submodule land arms, gate-classification base re-run, diff probe, merge-task two-worktree split, land-barrier endstate-check steps, MergeResult merge-task-only fields

Verbatim evictions from `agents/war-refiner.md` (prompt-surface simplification, Task 4.1, plus
the § Base re-run + re-attach block from references-pointer-integrity Task 1.2 — an ADR 0042
budget eviction; plus the § Diff probe body, the § merge-task two-worktree split paragraph and
the `### Submodule phase` 2A/2B routing tail from engine-and-audit-verdict-integrity Task 1.1, #2115, and
the § Land-barrier endstate-check steps and the § MergeResult merge-task-only fields parenthetical from its Task 5.1, #2156 — ADR 0042 headroom evictions; each moved block was byte-identical to its pre-eviction card text at eviction
time). Positional words inside the moved blocks ("below", "above") refer to their original card
positions — "All merge-task and land-phase steps below" means the card's own
merge-task/land-phase sections, and the reland-discrimination block sat as step 3 of the card's
superproject land loop (the card's on-push-success return — the old step 4 — was evicted to
budget-raise-floor.md § Evicted: § land-phase / Superproject phase, alongside the CAS loop). The dispatched land
prompts in `skills/war/assets/workflow-template.js` still carry the full discrimination text
(registry-pinned, `relandDiscrimination`); this file is the standing copy the grep-parity
suite reads.

## Submodule-as-repo provisioning

Trigger: a phase's `target repo` is a submodule (not the superproject).

When a phase's `target repo` is a submodule (not the superproject), the **entire cwd-scoped toolchain runs from the initialized submodule checkout** — the same scripts, no changes to `provision-worktrees.sh`, only the cwd changes.

Before invoking any toolchain steps for a submodule phase:

1. **Initialize the submodule checkout** in the superproject worktree: `git -C <superWorktree> submodule update --init --recursive`. This materializes the submodule's `.git` at `<superWorktree>/<submodulePath>/`.
2. The **submodule checkout** is `<superWorktree>/<submodulePath>/` — this becomes the cwd for all subsequent toolchain steps for this phase.
3. **Cut the integration branch off the submodule's resolved base**: `git -C <submoduleCheckout> checkout -b integration/<slug>/phase-N <resolvedBase>`. The resolved base is the explicit signal from run config, the `branch` field in `.gitmodules`, or a value raised to the human at launch (never silently the remote default).
4. **Create task worktrees under `<worktreeRoot>/<runId>/`** using `git -C <submoduleCheckout> worktree add <worktreeRoot>/<runId>/p<phase>-<taskId> <taskBranch>` (the worktree path is phase-scoped — `p<phase>-<taskId>` mirrors the task branch shape). All task and `_refinery` worktrees for a submodule phase live under the same `<worktreeRoot>/<runId>/` root, with cwd resolved relative to the submodule checkout.

All merge-task and land-phase steps below run with `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout. The submodule's own `.git`, remote, and branches are the authority — the superproject is not consulted.

Evicted verbatim from the `agents/war-refiner.md` § Submodule-as-repo provisioning paragraph (ADR 0042; the card keeps the trigger pointer):

> All merge-task and land-phase steps below then run with `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout; the submodule's own `.git`, remote, and branches are the authority. Your dispatched provision-barrier prompt's `submodNote` (built in `workflow-template.js`) is the carrier of the submodule targetRepo/targetBase and the `git submodule update --init --recursive` step.

## Reland discrimination — superproject land-phase step 3

Trigger: the final failed CAS attempt of a land (after `roundLimit` rejected pushes), before returning `land_stale`. Identical discrimination, scoped to the submodule checkout/remote, applies at 2A step 3 below.

**Before surrendering to `land_stale`, discriminate a contender-less transient from a real divergence** (D4). On the final failed CAS attempt (after `roundLimit` rejected pushes), do NOT return `land_stale` yet — run `git fetch origin <working>` then `git rev-list --left-right --count <merge-sha>...origin/<working>`: the merge sha the loop just tried to push vs. the freshly-fetched origin tip, NEVER the local follower `refs/heads/<working>` (it lags; operator decision 2d). Right count 0 (contender-less transient: every commit on the fetched origin tip is already contained in the merge sha, so no competing commit exists and the rejection cannot be a lost CAS) buys exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once — not a slot inside `roundLimit`): re-fetch, re-detach at `origin/<working>`, re-merge `--no-ff`, re-gate, `land-advance`; if that extra attempt also fails, return `status: "land_stale"`. Otherwise a nonzero right count (real contender commits on origin) is a real divergence: return `status: "land_stale"` immediately, with no extra attempt. `land_stale` is a hard escalation distinct from a content `conflict` (no merge-text contradictions, only topology contention); held for the Lead. The retry branch is live, not dead code — right count 0 is reachable when the prior push actually landed but the client saw a transient error (the retry's `land-advance` then exits 0 via Task 1.1's already-landed reconciliation) or when a remote hiccup produced a spurious rejection; a transient that resolves returns `status: "landed"` (**no new status**), so the Workflow's landed path spawns the servitor wrap-up automatically.

## Submodule land arms (2A / 2B)

Trigger: a land-phase (or 2A merge) dispatch whose phase's `target repo` is a submodule.

Routing (the card's `### Submodule phase` tail, evicted #2115): declared WAR-owned ⇒ **2A** — the same push-first CAS loop and final-attempt discrimination, scoped to the submodule checkout and remote; otherwise ⇒ **2B (default)** — push the submodule integration branch, open a PR, and return `status: "submodule-pr"` with `pr_number`/`pr_remote` (never author the merge commit; the run holds until a human merges). Your dispatched land prompt's `submodLandNote` — threaded into the three land prompts only (initial land, environment-proceed re-land, baseline-proceed re-land) — carries the submodule targetRepo/targetBase and the 2A/2B routing.

### Submodule phase — 2A (WAR-owned submodule)

When `target repo` is a submodule **and** the run config declares the submodule as WAR-owned, WAR authors the submodule merge directly (no hold). All cwd below refers to the **submodule checkout** (`<superWorktree>/<submodulePath>/`).

1. Verify all of the submodule phase's task branches are merged into the submodule integration branch.
2. In the submodule's `_refinery`, run the same push-first CAS loop as the superproject land (≤ `roundLimit` attempts), scoped to the submodule checkout:
   ```
   git -C <submodule-_refinery> fetch
   git -C <submodule-_refinery> switch --detach origin/<submodule-working>
   git -C <submodule-_refinery> merge --no-ff integration/<slug>/phase-N
   <run the gate>                                                              # green required (submodule's gate)
   provision-worktrees.sh land-advance <submodule-working> <merge-sha>        # cwd = submodule checkout
   ```
   - Same push-first CAS semantics as above. `land-advance` runs with cwd = submodule checkout, pushing to the submodule remote only.
   - On push success → record the landed SHA; proceed to step 3.
   - On push rejection → re-fetch, re-detach, re-merge, re-gate (same reland loop).
   - On any other push error → return `status: "error"`.
3. **Same transient-vs-divergence discrimination before surrendering** (D4), scoped to the submodule checkout/remote: on the final failed CAS attempt run `git fetch origin <submodule-working>` then `git rev-list --left-right --count <merge-sha>...origin/<submodule-working>` — the merge sha the loop just tried to push vs. the freshly-fetched submodule origin tip, NEVER the local follower. Right count 0 (contender-less transient) buys exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once — not a slot inside `roundLimit`): re-fetch, re-detach, re-merge `--no-ff`, re-gate, `land-advance`; if that extra attempt also fails, return `status: "land_stale"`. Otherwise a nonzero right count (real contender commits on origin) is a real divergence: return `status: "land_stale"` immediately, with no extra attempt.
4. On push success → return `status: "landed"` with the **submodule's** new working SHA. The Workflow threads this SHA to the dependent gitlink-bump task via the ledger — no hold, no resume required.

### Submodule phase — 2B (PR-and-hold, default)

When `target repo` is a submodule **and** it is **not** declared WAR-owned, WAR pushes the submodule task branch and opens a PR. The run holds until the human merges.

1. Verify all of the submodule phase's task branches are merged into the submodule integration branch.
2. Push the submodule integration branch to the submodule remote: `git -C <submoduleCheckout> push origin integration/<slug>/phase-N`.
3. Open a PR in the submodule repo: `gh pr create --repo <pr_remote> --head integration/<slug>/phase-N --base <submodule-base> --title <...> --body <...>`. Capture the PR number.
4. Return `status: "submodule-pr"` with the PR number and the submodule remote (`pr_number`, `pr_remote`). **Do NOT** author the merge commit. The Workflow maps this to `landDecision: "held:submodule-pr"` and records the PR number/remote in the ledger.
5. The run is now held. It resumes only when a human re-triggers `/war` after merging the PR (the Lead's resume procedure checks `gh pr view <pr_number> --json state,mergeCommit -R <pr_remote>` and takes `mergeCommit.oid` as the submodule phase's landed SHA).

## Base re-run + re-attach (gate classification)

Trigger: a gate-failure classification requires the base re-run (merge-task or land-phase). "That base" below is the per-site classification base that `skills/war/references/gate-failure-classification.md` (the evicted classification section) names.

- **Base re-run + re-attach:** detach `_refinery` at that base (`git -C <_refinery> checkout --detach <base>`), re-run ONLY the failing gate there, then **RE-ATTACH `_refinery` to the integration branch before you return** (`git -C <_refinery> checkout <integrationBranch>`). Every merge/land dispatch also **begins** with that same idempotent re-attach (the re-attached-by-default `_refinery`), so a dispatch that died mid-classification cannot strand the queue detached.

## Pin-transfer arms

The merge slot's pin-transfer probe (see `agents/war-refiner.md` § pin-transfer probe for steps 1-3, which produce `BASE`, `N`, `PRE`, `CHERRY`, `TIP`, `POST`). Return `BASE` as `dispatch_base` on every result that carries `rebased_tip`. Take the arms in this order:

4. **`already_upstream` first.** Post-rebase diff empty **and** `N > 0` **and** every `CHERRY` line starting `-` **and** `PRE` non-empty → `status: "already_upstream"` with `rebased_tip`, `dispatch_base` (the pre-rebase `BASE`), both patch-ids, `already_upstream_commits` (the SHAs `CHERRY` listed). This is a candidate for already-upstream completion. The engine independently compares the complete approved and final Git trees; cherry matches alone do not prove current content. The consumer refuses an `already_upstream` whose fields carry the **contradiction signature** — `rebased_tip` equal to `dispatch_base`, a non-empty `POST`, or an empty `already_upstream_commits` each refuse the status; equal non-empty patch-ids then route `transferred`, anything else routes the `mismatch` re-audit (D4, PIN-8, #1973). Never report `already_upstream` to carry a different true result.

Success evidence is mandatory: transferred requires a usable rebased tip, non-empty equal patch IDs and independently equal exact content identities; otherwise a usable tip is fully re-audited. Every success-bearing status with an absent/malformed destination holds before any receipt or re-audit. An uncontradicted already_upstream also requires a usable dispatch base, non-empty PRE, explicit empty POST and non-empty valid matched commit SHAs; missing evidence holds. The engine independently verifies the approved content and actual pre/post Git state before accounting a transfer. An error, missing or unknown status retains the ordinary merge fallback only for unchanged approved content or independently equal patch and exact content identities; changed content requires the full re-audit.

5. **Fail closed.** Post-rebase diff EMPTY **and** (`N` is 0, **or** any `CHERRY` line starts `+`, **or** `PRE` is empty) — the empty post-rebase diff is the shared precondition for all three legs, so this is never an unscoped 3-way OR → `status: "empty-unmatched"`, `detail` naming the failing leg. Never `already_upstream`, never a transfer: empty-equals-empty is not equality, and a zero-commit branch is vacuously an ancestor.
6. **Otherwise compare patch-ids**, returning `rebased_tip`, `dispatch_base` (the pre-rebase `BASE`) and both ids either way: `PRE` non-empty and `PRE == POST` → `status: "transferred"` (a provisional claim; independent exact content identity must also match before the pin transfers); `PRE != POST` → `status: "mismatch"` (the Workflow re-audits the rebased tip full-panel, in the lock, before the merge).
7. Any unclassifiable git/env error → `status: "error"` with `detail`. The engine checks actual post-probe Git state before choosing the ordinary fallback or full re-audit; a partial rebase is never inferred harmless from an error.

## Diff probe

Trigger: a `diff-probe` dispatch (the card's `## Diff probe` body, evicted #2115).

ONE **`diff-probe:<taskId>`** run per task (`dispatchKind: diff-probe`), after the worker returns green and **before** the audit seats convene. Read-only — no merge, push, rebase, or gate: in `<taskWorktree>` run `git diff --name-only $(git merge-base <base> <tip>)..<tip>` — `<base>` is the integration branch, or the task's `targetBase` for a submodule task (the superproject branch does not exist in that checkout) — and return `{ diff_files: [<one repo-relative path per output line, verbatim>] }` (`DiffProbeResult`) — the git-derived changed-file list the engine's disposition default and intake filing floor read; never the worker's own file report. Idempotent on resume. On a git error return `{ detail }` with **no** `diff_files` — the engine keeps its old default for that task (fail-open); never block, never a `MergeResult`.

## merge-task two-worktree split

Trigger: before the merge-task rebase of the task branch (the card's `## merge-task` opening paragraph, evicted #2115).

merge-task is **inherently split across two worktrees** — the task branch stays checked out in `<taskWorktree>`, and `git rebase` must operate on the checked-out branch, so the rebase cannot run in `_refinery`. (`git rebase --onto` does **not** dodge this; a no-checkout `update-ref` replay desyncs the task worktree and blocks the next fix-rebase — do **not** use it.)

## Land-barrier endstate-check steps

Trigger: an `endstate-check` dispatch, per enumerated condition row (the card's `## Land-barrier endstate-check dispatch` numbered steps, evicted #2156).

1. The prompt threads the row's check literal in a **fenced block** whose fence length exceeds every backtick run inside the literal — content backticks are **never** the fence. Write the bytes between the fences **byte-verbatim** to `<_refinery>/.war/endstate-<phaseId>-<n>.cmd` — copy bytes, never re-quote/re-escape (a single-quoted `${...}` run survives exactly) — then verify the written bytes equal the fenced literal: on mismatch record a `cmd_bytes_mismatch` line in the artifact and do **not** execute any corrected variant (the row fails loudly via its artifact). Execute it **from the file** (file-threaded — never interpolated into another script; the done-when floor's hygiene), under a timeout. A row the dispatch intake-linted **unsupported** is record-only: its artifact records the `intake_lint` verdict, never a half-run.
2. Tee the FULL stdout+stderr of the **entire** command line — a compound/pipeline/multi-command check runs end-to-end, every command's output captured — to the sibling artifact `<_refinery>/.war/endstate-<phaseId>-<n>.log`, stamped: the **first** line is `tip_sha: <git -C <_refinery> rev-parse HEAD>`, then the captured output, then a final `exit_code: <code>` line. The `tip_sha` stamp is **load-bearing** — the gate-audit seats compare it against the confirmed tip and attest a stale (mismatched) artifact `unverified`, so a prior-run artifact can never read as `met`.
3. A red, hung, or timed-out command still gets its artifact (whatever it produced, plus its exit/timeout note) — record it and move on; **a failing check never fails this dispatch**.

## MergeResult merge-task-only fields

Trigger: a merge-task return where the step that sets one of `floor_diagnostic`, `mappedTests`, `done_when_log_path`, `floor_route` or `gate_segment` is in doubt (the card's `## Return` MergeResult parenthetical, evicted #2156 a4).

(`floor_diagnostic` is merge-task-only — the exit-1 test floor's verbatim stderr, per step 4; `mappedTests` is merge-task-only — the exit-0 test floor's matched paths from stdout, per step 4; `done_when_log_path` is merge-task-only — the done-when floor's teed evidence artifact, its absolute path returned on exit 1, per step 8; `floor_route` is merge-task-only — the literal `"budget-uncited"` riding `status: "no-test"` when the step-7 Budget-Raise floor's exit 1 fired, never any other value; `gate_segment` is merge-task-only — step 10's FORCED mid-gate return, `"incomplete"` riding `status: "error"`)

## Recovery task provenance

On a sanctioned recovery relaunch, run `task-integrated.sh <task-branch> <integration> <working>`
from the per-task repository before ensure-worktree: submodule tasks use targetRepo and targetBase;
ordinary tasks use the main repository and phase workingBranch. Follow the dispatched RECOVERY TASK
PROOFS entries. The engine resolves relative targetRepo values against mainCheckout and normalizes
the path before provisioning, snapshots, reconciliation and gate capture; use that same absolute
path and return the artifact produced by the dispatched mktemp prefix. This is a read-only Git helper, a sibling of
`provision-worktrees.sh`. Exit 0 (`TASK_INTEGRATED`) proves the local task branch is integrated
and contains a nonempty commit in the phase with the exact `WAR-Task: <task branch>` trailer.
The helper collects the union of paths changed by every qualifying owned commit, preserving
rename sides, Gitlinks, modes and deletions, including changes that net back to the phase base.
Final task/integration content must match on every path. The interval from before the first
owned commit to the task tip must contain surviving net work and no nonempty contribution outside
those qualifying owned commits. Earlier sibling history and later empty bookkeeping are allowed;
mixed later history (including nonempty merge commits) returns no proof because attribution is
uncertain. This deliberately sends even potentially valid mixed work through ordinary work/audit.
NUL-delimited literal paths preserve filename syntax; input refs are re-read before success.
Only the complete result permits `preMerged`. Exit 1 (`NO_TASK_PROOF`) takes ordinary ensure-worktree
and work/audit, including sibling-only, zero-commit, empty-tagged, untagged legacy, cancelled-owned,
mixed-history or changed-content branches. No new phase hold is introduced for absent proof.
Exit 2 or any unrecognized failure stops the barrier with the command and stderr recorded.
Never replace the helper with ancestor plus a shared commit count. Trailers are committed Git
provenance, available after cloning on another machine; no local marker, reflog, label or journal
can substitute for the proof. The normal resume pre-flight still reconciles unexplained commits.

## Uncertain merge reconciliation

A merge or land can push successfully and lose its response. It is still a mutation. The engine
reads a Git snapshot before dispatch (retrying unavailable reads on the recovery tier). After a
normal reply, a separate read-only `merge-confirm` refiner checks actual Git state before the
engine routes that reply. Death, missing/error results, or unconfirmed replies dispatch a fresh
refiner using `agents.refiner.recovery` (defaults/presets are defined in `war-config.mjs`). The
ordinary refiner tier stays independent. Maintenance is bounded by `run.roundLimit`; auditors
never acquire Git write permissions. This maintenance does not consume worker fix/absorb rounds.

Use the context's repository, source and target branches, including a submodule repository when
specified. Resolve full commit SHAs and query origin's exact target ref; a failed remote query
is not an absent ref. The snapshot stores Git identities, not a local-state completion marker.
Before pin rebase and task/polish/terminal merges, local target must equal origin target, or a
fresh integration cut must equal its published origin seed when origin target is absent.
Use the explicit context seed: `workingBranch` for an ordinary phase, `task.targetBase` inside a
submodule repository. Pin preflight/proof and every task merge/retry target the integration branch,
not the seed/base branch. Polish and terminal merges use the same phase seed; submodule land
targets `targetBase`. Never query a superproject branch as a submodule seed.
On disagreement, `target-reconcile` may safely fast-forward a clean local follower to origin
target, or to the published seed when origin target is absent,
then an independent snapshot decides readiness even if maintenance lost its reply. Never publish
unaccounted local-only history or change the current task during this maintenance. Unresolved
history holds after the bounded attempts; Git remains available for the next agent to reconcile.

The pin-transfer mutator has separate read-only `pin-snapshot` and `pin-confirm` dispatches.
Follow the engine's `PIN_GIT_PROOF` prompt to resolve reported pins independently, compare the
approved Git tree to the pre-rebase content (the first parent for a known regressed tip being
forward-reverted), and recompute actual dispatch base, patch IDs and cherry matches. A transfer
requires actual nonempty equal patches, equal exact content identities and target ancestry. Completion by `already_upstream`
also requires actual task/local/origin tip equality, empty post-rebase content, positive task
count and the complete unique matched **non-merge** task commit set that Git lists. Check coverage
of every distinct reported commit; equal lengths alone plus coverage of cherry rows would accept
duplicate proof rows. Read `head_tree` from the actual post-rebase task tip. Only equality with
`approved_tree` permits the no-panel shortcut: cherry omits merge commits and may match a change
that upstream later reverted. Complete tree equality proves current content without requiring
cherry to cover merge history. Different, missing or malformed final tree evidence gets the full
in-lock content re-audit. Every mismatch re-audit compares the original approved task diff and
changes since approval against the acceptance criteria; the ordinary integration diff alone may
omit dropped content. A complete fresh approving panel plus an independent re-read proving the
same published destination permits completion with a `mismatch`/`re-ran` receipt and no empty
content merge. Rejected, incomplete, dead or pin-invalid panels emit no approval receipt. Unknown
or moved shared Git refs cannot complete; read-only deaths retain their existing classifications.
Fabricated identities or unproved content hold. Integration refs must not change
during this rebase-only operation. Missing reported dispatch bases on transferred/mismatch
results are filled from Git proof, never left as null provenance.

Check both local and remote state before and after maintenance. Respect a live or unknown writer;
if its mutation cannot be ruled out or safely completed, return uncertain. Never overwrite
foreign content, reset a shared ref, force-push, or ask the human to run Git commands.

For normal confirmation, resolve the reported success SHA independently as a Git commit; a
7–40 digit lowercase hex abbreviation is acceptable only when Git resolves it unambiguously.
Return full local/remote/source identities and `reported_sha`, never inferred matching strings.
Task success requires source = local target = origin target, the same patch-id and exact content_id as the snapshot,
and `base_is_ancestor: true` from `git merge-base --is-ancestor <snapshot base> <local target>`
(exit 0). A verified task no-op can have an empty patch; uncertain recovery still requires the
nonempty patch and advancement described below. Land success requires the actual two ordered
parents [captured remote working base, captured integration source] and an unchanged source tip.
On resume, the exact phase commit may already equal the captured remote tip: accept its full
first parent and exact captured integration second parent. In both cases the captured local
base must be an ancestor of the current target, so a foreign local branch cannot be overwritten.
The captured remote base must be a full commit SHA; an absent branch cannot be a commit parent.
A normal non-success reply is confirmed only when both target refs equal their respective
snapshots. Re-read refs after computing evidence; movement or a Git error returns `{}`. A failed
read after mutation cannot prove absence, even when the mutator reported a known floor failure.
The engine records confirmation evidence, or invokes recovery before any completion accounting.

For a task/polish/terminal merge, unchanged target refs allow one retry of the full original
operation in this recovery dispatch. An already-advanced target must be exactly the current
source tip, fast-forward from the captured base, with no foreign commits and the same nonempty
patch-id and exact content_id as the captured task diff. Complete an interrupted push without force. Rerun the gate
into a fresh artifact and run every applicable floor against the **captured base SHA**, never
against an already-advanced target branch (which would erase the task diff). The original
baseline/environment exceptions and known forward-revert remain binding; do not change audited
content or resolve content conflicts. A changed patch needs a ruling and re-audit.

For a land, reuse an already-pushed phase commit only when its two parents are exactly the
captured remote working base and integration source, or reuse that exact two-parent phase commit
if it was already the captured remote tip before dispatch. This already-published case may have
an empty snapshot patch and no local advancement; it still requires Git ancestry and source proof.
Complete the original push-first local CAS,
respecting checkout/worktree cleanliness. Never create a second phase commit to replace a lost
response. Gate the actual landed commit in a fresh artifact. Divergence/foreign advance is
uncertain and requires further agent investigation before publishing more state.

Return the engine's `MERGE_RECONCILIATION` shape: echo snapshot identities, report current local
and origin target SHAs, current source tip, verified patch-id, `base_is_ancestor` from Git in both modes,
and the complete normal MergeResult
with its captured gate path. A land additionally reports its actual commit parents. `unmerged`
requires both target refs unchanged from their respective snapshots after the retry; it never
means “no response.” The workflow validates these fields before accounting success or safe
absence. Exhausted uncertainty holds before land (`held:workflow-error`), preserving all branches
and the evidence ledger for the next agent. A proved-unmerged infrastructure death retains its
existing soft classification; a read-only audit/probe death keeps its existing site classification.

Across machines, fetch the named source/target refs and reconstruct from commit history and
remote refs, using the recovery provenance helper for task skips. Missing evidence means rerun
work/audit or continue agent reconciliation, never trust a previous machine's local marker or
reflog as completion. The runtime tests exercise real Git mutations and local remotes; a live
refiner's faithful execution of this procedure remains part of the agent contract.

## Exact Git diff identity

Read before producing `content_id`, `pre_content_id` or `post_content_id`. Stable patch IDs
ignore whitespace and are only advisory; they cannot prove that audited behavior survived.
For the full commit identities named by the dispatch, run this read-only recipe in that
repository (`$1` is the diff base, `$2` the tip). Preserve the raw NUL-delimited bytes through
the pipe; do not put them in a shell variable or hash rendered text. A failed command makes
the proof unavailable, never an empty or invented identity.

```bash
set -o pipefail
git diff --raw -z --no-abbrev --no-renames --ignore-submodules=none --no-relative -O/dev/null "$1" "$2" -- | git hash-object --stdin
```

The identity includes changed paths, old/new blob or Gitlink object IDs, and old/new modes.
It preserves whitespace and binary contents and disables rename inference and configured
path ordering. Unchanged paths are omitted, so an unrelated sibling file does not invalidate
an otherwise unchanged task diff. An upstream change to the same file can conservatively
require a full re-audit, even when a textual rebase was conflict-free. Empty diffs have the
Git hash of the empty byte stream; they are not missing evidence. Existing nonempty-patch
requirements and the already-upstream complete-tree check remain independent obligations.

Snapshots compute the identity for the expected task diff (using the approved parent when
performing a known forward-revert). Pin confirmation independently computes both pre/post
identities. Normal task confirmation and task recovery recompute it against the captured
base and current source, never echo the snapshot. Both equal patch IDs and equal exact
identities are required before preserving approval or recording task merge completion.
Land still requires its exact captured source commit and ordered phase-commit parents.
