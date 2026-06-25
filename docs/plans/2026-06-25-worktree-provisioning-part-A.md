# Worktree Provisioning Implementation Plan

**Goal:** Turn WAR's implicit, untested, worker-self-created worktree handling into a **deterministic,
refiner-owned lifecycle** behind one tested shell asset — and replace the proven-NO-OP `WAR_WORKTREE`
scope guard with an enforceable `agent_type`-keyed hook.

> **Scope — Part A (container) only.** The [merged spec](../specs/2026-06-25-worktree-provisioning-design.md)
> has two layers: **Part A** (this plan — the git-topology lifecycle) and **Part B** (the
> *contents*: making a worktree gate-ready via a repo-derived `run.provision` list — setup-scout,
> `provision.mjs`, the `env-blocked` verdict, the red-team scaffold). **Part B is a separate
> follow-up plan** (it carries the spec's 8 open decisions and deserves its own grilling pass). The
> one place the two meet is the refiner's Provision barrier — see the seam note in Task 5.

**Architecture:** Two tested shell assets + thin wiring. The **provisioning script**
(`skills/war/assets/provision-worktrees.sh`, with `*.test.sh`) owns all shared git-state mutation —
cut/reuse the plan-namespaced integration branch, `git worktree add` each task on the integration tip
with a `.war-task` marker, idempotent "ensure" with conservative heal, run-scoped teardown, and
`.git/info/exclude` upkeep. The **scope hook** (`hooks/validate-worktree-scope.sh`, rewritten, with
`*.test.sh`) enforces write-scope by `agent_type` + marker, not by an env var. The **Workflow
template** stays thin: the refiner's Provision barrier calls the script; the worker no longer touches
the container. This mirrors the repo's tested-core / thin-scaffold split (`red-team-gate.mjs`,
`land-decision.mjs`).

**Tech Stack:** POSIX-ish bash (`set -euo pipefail`), `git`, `jq` (already a hook dependency). Tests
are plain-bash assertion scripts over throwaway `mktemp -d` git repos and crafted stdin fixtures — no
bats, no `package.json`, no live Claude harness. The Workflow scaffold is plain JS run by the Workflow
tool.

**Source of truth:** [`docs/specs/2026-06-25-worktree-provisioning-design.md`](../specs/2026-06-25-worktree-provisioning-design.md)
(decisions D1–D11, experiments E1–E2). Hard decisions also recorded as
[ADR 0001](../adr/0001-explicitly-managed-worktrees.md) (explicit worktrees, not `isolation:'worktree'`),
[ADR 0002](../adr/0002-scope-by-agent-type.md) (scope by `agent_type`), and
[ADR 0003](../adr/0003-plan-namespaced-branches.md) (plan-namespaced branches). Vocabulary in
[CONTEXT.md](../../CONTEXT.md).

**Empirical basis (do not re-litigate without re-running the probe):** E1 proved the hook payload
carries `agent_type` (per-subagent) but `session_id`/`cwd` are shared with the parent and a worker's
`export` does not survive its own next Bash call → the `WAR_WORKTREE` guard cannot scope workers. E2
proved a nested worktree shows as `?? .claude/` in the parent `git status` unless `.claude/` is
git-excluded.

## Build order (for `/war`)

- **Phase 1 — Scope hook rewrite (testable core):** Task 1. Independent; retires the broken guard.
- **Phase 2 — Provisioning script (testable core):** Task 2 → Task 3 → Task 4 (each builds on the
  prior's helpers + harness).
- **Phase 3 — Workflow integration:** Task 5 (depends on Phase 2).
- **Phase 4 — Docs & retire:** Task 6 (depends on Phases 1–3 landing).
- **Phase 5 — Release & verify:** Task 7 (depends on all).

**Back-compat contract:** the rewritten hook is **fail-open for any `agent_type` that is not a
recognized `war-*` role** (and for the main session, which has no `agent_type`) — no non-WAR agent and
no existing non-worker flow is newly constrained. `git worktree add` paths and integration branches
that already exist for the *current* run are reused, never re-created, so a resume is a no-op.

---

## Phase 1 — Scope hook rewrite

### Task 1: Rewrite `validate-worktree-scope.sh` as an `agent_type`-keyed guard (D10)

**Files:**
- Rewrite: `hooks/validate-worktree-scope.sh`
- Test (new): `hooks/validate-worktree-scope.test.sh`

- [ ] **Step 1: Write the failing tests**

Create `hooks/validate-worktree-scope.test.sh` — a plain-bash runner that pipes crafted PreToolUse
payloads into the hook and asserts exit codes. Helper:

```bash
run() { printf '%s' "$1" | bash hooks/validate-worktree-scope.sh >/dev/null 2>&1; echo $?; }
mk()  { printf '{"agent_type":%s,"tool_input":{"file_path":"%s"}}' "$1" "$2"; }   # $1 already JSON (quoted string or omitted)
```

Cases (each asserts the exit code), using a throwaway worktree dir that does/doesn't hold `.war-task`:
- `war-worker` writing **inside** a dir whose ancestor has `.war-task` → **0**
- `war-worker` writing with **no `.war-task` ancestor** (e.g. the main checkout) → **2**
- `war-auditor` writing anywhere → **2** (hard-deny)
- `war-servitor` writing under `…/.claude/projects/<p>/memory/x.md` → **0**; under a random path → **2**
- `war-servitor` writing under `…/docs/learnings/phase-1.md` → **0**
- `war-refiner` writing anywhere → **0**
- payload with **no `agent_type`** (main session) → **0**
- payload with an **unknown** `agent_type` (`"some-other-agent"`) → **0** (fail-open)
- payload with **no `file_path`** (e.g. a Bash tool) → **0**

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bash hooks/validate-worktree-scope.test.sh`
Expected: FAIL — the current hook ignores `agent_type` (NO-OP unless `WAR_WORKTREE`), so the deny
cases return 0.

- [ ] **Step 3: Write the implementation**

Replace `hooks/validate-worktree-scope.sh` with an `agent_type`-keyed guard. Shape:

```bash
#!/usr/bin/env bash
# WAR worktree-scope guard (PreToolUse: Write|Edit|NotebookEdit).
# Enforced by agent_type from the hook payload (see ADR 0002); fail-open for non-WAR agents.
set -euo pipefail
input="$(cat)"
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }
atype="$(get '.agent_type')"
path="$(get '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path')"
deny() { echo "WAR: $1" >&2; exit 2; }

case "$atype" in
  *war-auditor*)  [ -n "$path" ] && deny "auditors are read-only; refusing write to '$path'." ; exit 0 ;;
  *war-worker*)
    [ -z "$path" ] && exit 0
    d="$(dirname "$path")"
    while [ "$d" != "/" ] && [ -n "$d" ]; do
      [ -e "$d/.war-task" ] && exit 0
      d="$(dirname "$d")"
    done
    deny "write to '$path' is outside any provisioned worktree (no .war-task marker). Stay in your worktree." ;;
  *war-servitor*)
    [ -z "$path" ] && exit 0
    case "$path" in
      */.claude/projects/*/memory/*|*/docs/learnings/*) exit 0 ;;
      *) deny "servitor write to '$path' is outside the learnings target." ;;
    esac ;;
  *) exit 0 ;;   # war-refiner, main session (no agent_type), and any non-WAR agent → unrestricted
esac
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bash hooks/validate-worktree-scope.test.sh` → all cases pass.
Optional: `shellcheck hooks/validate-worktree-scope.sh` clean.

- [ ] **Step 5: Commit**

```bash
git add hooks/validate-worktree-scope.sh hooks/validate-worktree-scope.test.sh
git commit -m "refactor(hooks): scope guard keyed on agent_type + .war-task marker, retire WAR_WORKTREE env (D10, ADR 0002)"
```

---

## Phase 2 — Provisioning script

> One asset `skills/war/assets/provision-worktrees.sh` exposing subcommands; one test file
> `skills/war/assets/provision-worktrees.test.sh` whose harness spins a fresh repo per case:
> `setup_repo() { T=$(mktemp -d); git -C "$T" init -q; …; echo "$T"; }`. Each task appends its cases.

### Task 2: `ensure-integration` + git-exclude (D6, D7, D8)

**Files:**
- New: `skills/war/assets/provision-worktrees.sh` (shebang, `set -euo pipefail`, arg dispatch, `ensure-integration`, `ensure-exclude`)
- Test (new): `skills/war/assets/provision-worktrees.test.sh`

- [ ] **Step 1: Write the failing tests**

In a fresh repo with an initial commit on the working branch:
- `ensure-integration <slug> 1 <working-tip>` creates branch `integration/<slug>/phase-1` at the
  working tip → assert `git rev-parse --verify integration/<slug>/phase-1` succeeds.
- Calling it **again** (resume) is a no-op and does **not** move the branch → assert the SHA is
  unchanged even after a new commit on the working branch (proves "never re-cut").
- After provisioning, `.git/info/exclude` contains a `.claude/` line; calling `ensure-exclude` twice
  does not duplicate it → assert exactly one match.
- A **foreign** `integration/<slug>/phase-1` (created out-of-band, not recorded in the run ledger)
  makes `ensure-integration` **exit non-zero** with a "foreign branch" message → assert fail-loud.
  (Ledger ownership is passed in, e.g. `--owned` flag or a ledger path the script reads.)

- [ ] **Step 2: Run the tests → fail** (`bash skills/war/assets/provision-worktrees.test.sh`): script/subcommand absent.

- [ ] **Step 3: Implement `ensure-integration` + `ensure-exclude`.** Reuse if the branch exists and
  is recorded as ours; create from the supplied base if absent; fail loud if it exists but is not
  ours. `ensure-exclude` appends `.claude/` to `.git/info/exclude` only if not already present.

- [ ] **Step 4: Run the tests → pass.**

- [ ] **Step 5: Commit**

```bash
git add skills/war/assets/provision-worktrees.sh skills/war/assets/provision-worktrees.test.sh
git commit -m "feat(war): provision-worktrees ensure-integration + git-exclude, plan-namespaced (D6/D7/D8, ADR 0003)"
```

### Task 3: `ensure-worktree` — create, marker, conservative heal (D4, D7)

**Files:**
- Modify: `skills/war/assets/provision-worktrees.sh` (add `ensure-worktree`)
- Test: `skills/war/assets/provision-worktrees.test.sh` (append)

- [ ] **Step 1: Write the failing tests**
- Fresh: `ensure-worktree <path> <branch> <integration-tip>` → `git worktree list` shows `<path>` on
  `<branch>`; `<path>/.war-task` exists; the branch points at the integration tip.
- Idempotent: a second call with the same args is a no-op (worktree still present, not recreated) →
  assert a sentinel file written into the worktree survives the second call.
- **Conservative heal — preserve:** make a commit on `<branch>` inside the worktree, then call
  `ensure-worktree` again → the worktree and its commit are **untouched** (assert the commit SHA and
  the sentinel survive). Never destroys work with un-merged commits.
- **Heal — recreate empty:** delete the worktree dir out-of-band (leaving git's registry stale) →
  `ensure-worktree` prunes + recreates it cleanly (assert `.war-task` present again).
- **Fail-loud:** an unregistered dir at `<path>` that contains changes (not a git worktree) →
  `ensure-worktree` exits non-zero, does not delete it.

- [ ] **Step 2: Run → fail.**
- [ ] **Step 3: Implement `ensure-worktree`** with the create / reuse / heal / fail-loud branches;
  drop `.war-task` at the worktree root on create.
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(war): provision-worktrees ensure-worktree with .war-task marker + conservative heal (D4/D7)"
```

### Task 4: `teardown-task` / `teardown-phase` / `prune` (D9)

**Files:**
- Modify: `skills/war/assets/provision-worktrees.sh` (add teardown subcommands)
- Test: `skills/war/assets/provision-worktrees.test.sh` (append)

- [ ] **Step 1: Write the failing tests**
- `teardown-task <path> <branch>` removes the worktree and deletes the (merged) branch → assert both
  gone from `git worktree list` / `git branch`.
- `teardown-phase <slug> <N>` removes the integration branch and any remaining phase worktrees → assert gone.
- **Keep-on-escalation:** `teardown-task --keep <path> <branch>` (or an escalation flag) leaves the
  worktree + branch intact → assert still present.
- `prune` runs `git worktree prune` and only affects this repo's stale registry; a sibling path under
  a *different* `run-id` is **never touched** → assert an unrelated run dir survives.

- [ ] **Step 2: Run → fail.**
- [ ] **Step 3: Implement** the three subcommands, all run-scoped; teardown refuses to operate on a
  path outside the current `run-id` dir.
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(war): provision-worktrees run-scoped teardown + prune, keep-on-escalation (D9)"
```

---

## Phase 3 — Workflow integration

### Task 5: Wire the refiner Provision barrier; remove worker self-create + no-op exports (D3)

**Files:**
- Modify: `skills/war/assets/workflow-template.js`

- [ ] **Step 1: Write the failing tests/checks**

The template is plain JS exercised by compiling it as an `AsyncFunction` with mocked Workflow globals
(the repo's existing pattern). Add assertions that:
- the worker prompt **no longer** contains `git worktree add` or `export WAR_WORKTREE` (grep the
  generated prompt strings — assert absent);
- a **Provision** phase/stage exists that invokes `provision-worktrees.sh ensure-integration` then
  `ensure-worktree` per task **before** the worker fan-out (barrier);
- the worker/auditor prompts still receive the absolute `task.worktree` path;
- `plan-slug` and `run-id` are threaded into branch/path construction.

- [ ] **Step 2: Run → fail** (current template self-creates in the worker, lines ~113-115).
- [ ] **Step 3: Implement** — add the refiner Provision barrier calling the script; change the worker
  prompt to "work in the already-provisioned worktree at `${task.worktree}`" (no `git worktree add`,
  no `export WAR_WORKTREE`); change the fix-worker prompt likewise; compute `task.branch`/`task.worktree`
  from `plan-slug` + `run-id`.

  > **Seam with Part B (deferred).** This barrier is exactly where the merged spec's repo-derived
  > `run.provision` list runs (after each worktree is created, before the worker installs/drives the
  > gate). This plan builds the barrier but **does not** wire in the `provision` list, the
  > `env-blocked` verdict, or the setup-scout — those land in the **Part B plan**. Keep the barrier's
  > shape open to threading a per-task provision step so Part B is an addition, not a rewrite.
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(war): refiner Provision barrier owns worktrees; worker no longer self-creates (D3)"
```

---

## Phase 4 — Docs & retire

### Task 6: Update docs to the new model; assert no lingering `WAR_WORKTREE`

**Files:**
- Modify: `agents/war-servitor.md`, `skills/war/SKILL.md`, `skills/war/references/design.md`,
  `skills/war/references/schemas.md`

- [ ] **Step 1: Write the failing check**
- `grep -rn "WAR_WORKTREE" skills agents hooks` returns **only** historical mentions in `docs/`
  (none in the live skill/agent/hook surface) → assert the live surface is clean.
- The servitor/SKILL/schemas describe scope as **`agent_type`-based** and provisioning as
  **refiner-owned**; branches as **plan-namespaced** → assert key phrases present.

- [ ] **Step 2: Run → fail** (current docs say scope is via `WAR_WORKTREE`; e.g. SKILL.md:52,
  schemas.md:68, design.md:90, servitor.md:11).
- [ ] **Step 3: Implement** the doc edits: scope guard is `agent_type` + `.war-task` (link ADR 0002);
  refiner owns provisioning via `provision-worktrees.sh` (link ADR 0001); branches plan-namespaced
  (link ADR 0003); the servitor is confined by path-pattern, not `WAR_WORKTREE`.
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5: Commit**

```bash
git commit -am "docs(war): scope-by-agent-type + refiner-owned provisioning + plan-namespaced branches; retire WAR_WORKTREE prose"
```

---

## Phase 5 — Release & verify

### Task 7: Version bump + full green

**Files:**
- Modify: the canonical version-bump file list (see README "Releasing").

- [ ] **Step 1:** Bump the version across the README-documented file list (`.claude-plugin/plugin.json`
  `version`, README badge/status, any `vX.Y.Z` strings the bump-list names).
- [ ] **Step 2:** Run the whole gate: `bash hooks/validate-worktree-scope.test.sh` +
  `bash skills/war/assets/provision-worktrees.test.sh` + the template compile-check → all green;
  `grep -rn WAR_WORKTREE skills agents hooks` clean.
- [ ] **Step 3: Commit**

```bash
git commit -am "chore(release): worktree-provisioning — deterministic refiner-owned lifecycle + agent_type scope guard"
```

---

## Notes / conscious deviations (ratify in this plan's `/red-team`)

- **Exact per-worktree confinement is intentionally dropped** (E1 proved it unattainable). The hook
  confines workers to *a* provisioned worktree, not *their* worktree; a sibling-worktree write is an
  accepted residual mitigated by absolute-path prompts + auditor review (ADR 0002).
- **`run-id` vs `plan-slug` in branch names:** branches use `plan-slug` for readability; uniqueness
  against a concurrent *identical-plan* run is handled by ledger-based foreign-branch fail-loud
  (Task 2), not by putting `run-id` in the branch name (ADR 0003). Worktree *paths* carry `run-id`.
- **Ledger ownership input:** Tasks 2/4 assume the script is told which refs the current run owns
  (a flag or a ledger path). The exact handshake with the ledger (`.claude/teams/<run-id>/`) is a
  small open seam to pin during Phase 2 implementation.
