# Submodule support, Increment 2 — first-class (refuse-undeclared, route-declared) Implementation Plan

**Goal:** let **one WAR run produce, audit, and land a change inside a git submodule**. Relax Increment 1's guard
from *refuse-all* to *refuse-undeclared, route-declared*, and add the machinery: a repo-scoped `target repo` tag, a
**submodule-as-repo** phase (the existing cwd-scoped toolchain run from the initialized submodule checkout), the
submodule edit and the pin bump as **two tasks** with a phase→phase SHA dependency threaded via the ledger, and a
refiner that lands **2A** (CAS, for a declared WAR-owned submodule) or **2B** (PR-and-hold, the default) with a new
`held:submodule-pr` outcome cleared by a `gh`-detected resume. The Increment-1 fail-closed net survives the relax —
anything off the explicit first-class path is still refused.

**Source spec:** [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md)
§4.2, §5. **ADRs:** [`0009-first-class-submodule-support.md`](../adr/0009-first-class-submodule-support.md)
(repo-per-phase) + [`0010-submodule-landing-authority.md`](../adr/0010-submodule-landing-authority.md) (PR-and-hold /
WAR-owned) — **both written + accepted**. **CONTEXT.md** terms (`Target repo`, `Repo-per-phase`, `Submodule task`,
`Submodule-as-repo`, `Gitlink-bump task`, `Pin-validity`, `PR-and-hold landing`, `WAR-owned submodule`,
`held:submodule-pr`, `Submodule base branch`, …) are **already landed** — not in scope.

**Position in the stack:** **second of two** stacked submodule plans, owns **v0.7.9** off **Increment 1's v0.7.8
tip**. It **relaxes** `assert-no-submodule-mutation.sh` (built in Increment 1) and extends the M1/L2/L3 constructs
that landed in the audit stack. Re-anchor by named construct (memory `plan-line-number-refs-stale-use-construct-locator`).

**Re-anchored integration facts (verified on the v0.7.7 tip):**
- The landDecision **known set is unguarded prose in three spots** — the return-contract line `SKILL.md:40`, the
  fail-closed classifier `SKILL.md:62` (*"not in the known set → `held:workflow-error`"*), and the enum
  `schemas.md:198`. `held:submodule-pr` **must be added to all three** or the classifier silently rewrites the hold.
  There is **no `KNOWN_LAND_DECISIONS` constant** (the spec's earlier phrasing was wrong) and no drift-guard — the
  guard is deferred ([#271](https://github.com/Ljferrer/WorkAuditRefine/issues/271)).
- `held:submodule-pr` is set **directly** (like `held:workflow-error`), **not** via `HARD_ESCALATION_REASONS`
  (`land-decision.mjs:12`) — so **no mirrored-constant cascade**.
- `MERGE_RESULT.status` (`workflow-template.js:46`) and `blockedReason` (`:157`, sites `:273/:303/:350`) are the
  L3-era constructs the engine extends. `provision-worktrees.sh` is **cwd-scoped** (`git_dir()` ~`:64`,
  `ensure-integration <base>` ~`:150`) — **no script change**; the refiner runs it from the submodule checkout.

## Build order (for `/war`)

- **Phase 1 — Foundations** *(tested, disjoint files, parallel)*: T1 `submodulePaths(repoDir)` helper + test
  (`provision.mjs`) ∥ T2 **relax** `assert-no-submodule-mutation.sh` + test (a `--declared` flag).
- **Phase 2 — Lead-side prose (`SKILL.md`, one task):** T3 — the decompose router + `held:submodule-pr` known-set +
  Checkpoint held-handling + Resume gh-detection + reconciliation extension. deps Phase 1. *Lands the known-set
  before the engine emits it.*
- **Phase 3 — The engine (`workflow-template.js`, one task, tested):** T4 — `target repo` threading + 2A/2B landing +
  `held:submodule-pr` return + relax-flag threading + new `MERGE_RESULT.status` + submodule/bump worker dispatch via
  `blockedReason`. deps Phase 1 + Phase 2.
- **Phase 4 — Agent contracts** *(disjoint prose, parallel)*: T5 `war-refiner.md` ∥ T6 `war-auditor.md` ∥
  T7 `war-worker.md` ∥ T8 `war-setup-scout.md`. deps Phase 3.
- **Phase 5 — Schema + design docs** *(disjoint prose, parallel)*: T9 `schemas.md` ∥ T10 `design.md §6` ∥
  T11 `ADR-0008` cross-link. deps Phase 3/4.
- **Phase 6 — release:** T12 (v0.7.9).

One-task-per-phase for the two shared files (`SKILL.md` T3, `workflow-template.js` T4) — same-file serialization
(memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

## Operator decisions — RESOLVED (2026-06-30, grill-with-docs)

- **DP1 — Decomposition: six phases.** Foundations / SKILL.md / engine / agent contracts / docs / release. The
  `SKILL.md` and `workflow-template.js` work is **one task each** (same-file serialization; the concerns inside each
  are cohesive). Phase 2 (SKILL.md known-set) lands **before** Phase 3 (engine emits `held:submodule-pr`). *Rejected:*
  serial-splitting either mega-file (DAG overhead for little audit gain); a 3rd "produce vs land" plan (operator chose
  two plans).
- **DP2 — `held:submodule-pr` is set directly, not via `HARD_ESCALATION_REASONS`** — like `held:workflow-error`. No
  `land-decision.mjs` / mirror / drift-guard cascade. The known set is **unguarded prose in 3 spots**; T3 + T9
  **enumerate all three** (`SKILL.md:40`, `SKILL.md:62`, `schemas.md:198`); the structural drift-guard is **deferred**
  ([#271](https://github.com/Ljferrer/WorkAuditRefine/issues/271)).
- **DP3 — `provision-worktrees.sh` needs no code change** (cwd-scoped). Submodule-as-repo is a **refiner-contract**
  change (T5: run the toolchain from the initialized submodule checkout) + **cwd threading** in the engine (T4).
- **DP4 — Pin-validity bar = reachable on the submodule remote** (not "merged-to-mainline"); a pushed feature-branch
  tip is acceptable — a submodule legitimately pinned to a non-default branch is allowed (spec Q3b).
- **DP5 — Landing authority: 2B PR-and-hold default, 2A WAR-owned opt-in.** `--afk` forces the WAR-owned (2A)
  confirmation at launch (an un-owned submodule under `--afk` is refused up front, else the run deadlocks on a hold no
  one can clear) — spec Q2, ADR-0010.
- **DP6 — Release: +0.0.1 → v0.7.9 off v0.7.8.** Four canonical slots, no badge; next free patch by construct if the
  stack order shifts.

---

## Phase 1 — Foundations

### Task 1 — `submodulePaths(repoDir)` helper + unit test (Increment 2, code)

**Files:**
- modify `skills/_shared/provision.mjs` — add `submodulePaths(repoDir)`: if `repoDir/.gitmodules` is absent return
  `[]`; else return the array of submodule **path** values (the `path = …` entries). ~10 lines; never throws on a
  missing dir (match the `structuralFallback` style beside it).
- modify the existing provision test file (`skills/_shared/provision.test.mjs`) — unit test: a `.gitmodules` fixture
  with two submodules → both paths; **no `.gitmodules`** → `[]`; a malformed/edge `.gitmodules` → a defined,
  non-throwing result.

**`requiresTest`: true.**

- [ ] **Step 1 — Write the failing unit test** (fixture-driven; assert exact path arrays + the `[]` empty case).
- [ ] **Step 2 — Run gate → fail** (helper absent).
- [ ] **Step 3 — Implement** `submodulePaths` (additive; parse `.gitmodules` `path =` lines, e.g. `git config -f`
  or a line scan — match the module's existing style). `// ponytail:` note it feeds the war-room/decompose overlap
  check and the guard relax.
- [ ] **Step 4 — Run the full self-discovering gate → green.**
- [ ] **Step 5 — Commit** — `feat(war): submodulePaths(repoDir) — parse .gitmodules paths for the overlap check (Increment 2)`
- **Closes:** the `.gitmodules` parser the router (T3) and contracts reference.

### Task 2 — Relax `assert-no-submodule-mutation.sh` with a `--declared` flag + test (Increment 2, shell)

**Files:**
- modify `skills/war/assets/assert-no-submodule-mutation.sh` — add a `--declared` flag. **Default (no flag): refuse
  any submodule mutation** (Increment 1 behavior, unchanged). **With `--declared`: a gitlink-only move is allowed
  (exit 0)** — this is the legitimate **gitlink-bump task** path (the pin move is validated separately by the
  auditor's pin-validity lens, T6). A non-gitlink submodule-content change still refuses even with `--declared` (a
  declared *submodule task* is audited/merged **inside** the submodule repo, so its diff carries no superproject
  gitlink — it never reaches this guard).
- modify `skills/war/assets/assert-no-submodule-mutation.test.sh` — add cases: `--declared` + gitlink-only move →
  exit 0; `--declared` + a non-gitlink submodule-path content change → exit 1 (still refused); **no flag** + gitlink
  move → exit 1 (Increment-1 behavior intact — regression guard).

**`requiresTest`: true.** **deps:** the Increment-1 script exists (v0.7.8).

- [ ] **Step 1 — Write the failing cases** (the three above; assert the **no-flag** path is byte-for-byte the
  Increment-1 behavior — memory `weak-test-assertion-passes-without-feature-being-exercised`, prove the flag is
  load-bearing by also asserting the no-flag refuse).
- [ ] **Step 2 — Run gate → fail** (`--declared` unhandled).
- [ ] **Step 3 — Implement the flag** (bash 3.2; argument parse + the allow-gitlink-only branch).
- [ ] **Step 4 — Run the full self-discovering gate → green.**
- [ ] **Step 5 — Commit** — `feat(war): assert-no-submodule-mutation.sh --declared allows a legitimate gitlink-bump (Increment 2)`
- **Closes:** the refuse-all → refuse-undeclared flip at the floor.

---

## Phase 2 — Lead-side prose (`SKILL.md`)

### Task 3 — Decompose router + known-set + held-handling + resume gh-detection + reconciliation extension (Increment 2, prose)

**Files (one task — all `SKILL.md`):** modify `skills/war/SKILL.md` —
- **Decompose router:** overlap plan targets against `.gitmodules` paths (via `submodulePaths`, T1). A target under a
  submodule path → **propose** classifying that task as a **submodule task** (`target repo` = the submodule) + a
  paired **gitlink-bump task** depending on it; require **human approval**; the tag is **explicit** on the sub-issue +
  ledger. Fire the **launch-time resolutions**: **base branch** (explicit signal only — run-config override →
  `.gitmodules` `branch` → otherwise **raise to the human**; never silently the remote default); **reachability
  precondition** (`gh`-reachable; flagged at `/red-team`, not runtime); **AFK ownership confirmation** (an un-owned
  submodule under `--afk` is refused at launch — DP5).
- **Known-set** *(enumerate both surfaces)*: add `held:submodule-pr` to the **return-contract line** (`:40`) **and**
  the **§4.2 fail-closed classifier known set** (`:62`) — or the classifier rewrites it to `held:workflow-error`.
- **Checkpoint §4.3 held-handling:** `held:submodule-pr` is an **interactive hold** (halts; only arises in non-AFK
  2B), **never advances the DAG**, git state **preserved**; cleared by the Resume procedure below.
- **Resume (§44-56):** a `held:submodule-pr` sub-procedure — on a **human-triggered** resume, `gh pr view <n> --json
  state,mergeCommit` against the **submodule remote** (PR number/remote read from the ledger); `MERGED` → take
  **`mergeCommit.oid`** (squash/rebase-correct) as the submodule phase's landed SHA, write it to the ledger, clear the
  hold, run the bump task; `OPEN` → stay held; **fallback** operator-supplied SHA; **no poller**. **Extend the A/B/C
  reconciliation:** the **submodule remote is a co-source-of-truth** — the recorded gitlink SHA is authoritative only
  when **reachable on the submodule remote** (the same `merge_sha`-advisory rule, now for the pin).

**`requiresTest`: false** — Lead-side prose; criteria are prompt-level (no deterministic Lead harness — matches the
M1/L2 precedent). **deps:** Phase 1 (router uses `submodulePaths`).

- [ ] **Step 1 — (no behavioral test — prose.)**
- [ ] **Step 2 — Implement (prose).** Anchor by named construct (the Decompose section, the return-contract line, the
  §4.2 classifier, the Checkpoint §4.3 block, the Resume A/B/C section). **Enumerate both known-set surfaces** (`:40`
  + `:62`).
- [ ] **Step 3 — Run the full self-discovering gate → green** (no executable surface).
- [ ] **Step 4 — Commit** — `docs(war): SKILL.md submodule router + held:submodule-pr known-set + gh-resume + reconciliation extension (Increment 2)`
- **Closes:** the Lead's whole submodule behavior; readies the known-set for the engine (T4).

---

## Phase 3 — The engine (`workflow-template.js`)

### Task 4 — `target repo` threading + 2A/2B landing + held:submodule-pr + relax-flag + dispatch via blockedReason (Increment 2, code)

**Files (one task — all `workflow-template.js`):**
- modify `skills/war/assets/workflow-template.js` —
  - **`target repo` threading:** carry a phase/task's target repo into the Provision/worktree/merge/land dispatches;
    for a **submodule phase**, the refiner is invoked with **cwd = the initialized submodule checkout** and the
    submodule's base (DP3 — no `provision-worktrees.sh` change).
  - **2A/2B landing:** map the refiner's land result for a submodule phase to `landDecision:'landed'` (2A CAS) **or**
    `landDecision:'held:submodule-pr'` (2B — carry the PR number/remote into the ledger).
  - **New `MERGE_RESULT.status`** `submodule-pr` (the refiner's "branch pushed, PR opened, awaiting merge" result)
    → mapped to `held:submodule-pr`.
  - **Relax-flag threading:** the merge-task prompt passes **`--declared`** to `assert-no-submodule-mutation.sh` for a
    declared **gitlink-bump task** (the legit pin move passes); a **submodule task**'s merge-task runs **inside the
    submodule repo** (no superproject gitlink — the guard is a no-op there).
  - **Worker dispatch:** the **submodule-task worker** and the **gitlink-bump worker** are new dispatch sites — route
    each through L3's `blockedReason` (`:157`) so a blocked submodule/bump worker escalates early with its reason.
- test `skills/war/assets/workflow-template.test.mjs` — behavioral via `buildSeqImpl`: (1) a 2B submodule land →
  `held:submodule-pr` with the PR ref captured; (2) a declared bump task's merge-task passes `--declared`; (3) a
  blocked bump worker escalates via `blockedReason`.

**`requiresTest`: true.** **deps:** Phase 1 (helper + relaxed script) + Phase 2 (known-set ready).

- [ ] **Step 1 — Write failing tests** (the three above; unique tokens; assert `held:submodule-pr` is **returned
  directly**, not routed through `decideLand`/`HARD_ESCALATION_REASONS` — DP2).
- [ ] **Step 2 — Run gate → fail** (no submodule landing / status / threading).
- [ ] **Step 3 — Implement.** Add the `submodule-pr` `MERGE_RESULT.status`, the 2A/2B mapping, the `held:submodule-pr`
  direct return, the `--declared` thread, the `target repo` cwd threading, and the two `blockedReason` dispatch sites.
  Re-anchor by named construct. **Do not** touch `HARD_ESCALATION_REASONS` / `land-decision.mjs` / its drift-guard
  (verify untouched + green).
- [ ] **Step 4 — Run gate → pass.** New tests green; whole node suite + every `*.test.sh` green.
- [ ] **Step 5 — Commit** — `feat(war): submodule landing (2A CAS / 2B PR-and-hold) + held:submodule-pr + declared-guard relax + bump dispatch (Increment 2)`
- **Closes:** the engine (spec §5.2-5.6).

---

## Phase 4 — Agent contracts (disjoint prose, parallel)

### Task 5 — `war-refiner.md`: submodule-as-repo provisioning + 2A/2B landing + relaxed-guard step (Increment 2, prose)
**Files:** modify `agents/war-refiner.md` — for a **submodule phase**, run the cwd-scoped toolchain **from the
initialized submodule checkout** (ensure `git submodule update --init --recursive` first; cut the submodule
integration branch off its **resolved base**; `git worktree add` under `<worktreeRoot>/<runId>/`). **Land:** **2A** =
the submodule's own `land-advance` push-first CAS (cwd = submodule), author the merge, record the SHA; **2B** = push
the submodule branch, `gh pr create` in the submodule repo, return `status:"submodule-pr"` with the PR number/remote.
At merge-task, pass **`--declared`** to `assert-no-submodule-mutation.sh` for a declared gitlink-bump task.
**`requiresTest`: false.** **deps:** T4.

### Task 6 — `war-auditor.md`: pin-validity lens + submodule-internal diff base (Increment 2, prose)
**Files:** modify `agents/war-auditor.md` — (a) a **submodule task** is reviewed **inside** the submodule worktree
(`git -C <submodule-task-worktree> diff <sub-integration>...<branch>`) — real file diffs, no gitlink. (b) the
**`pin-validity`** lens for a **gitlink-bump task**: **validate** the gitlink-only diff — the new SHA is **reachable
on the submodule remote** (`git -C <submodule> fetch && git cat-file -e <oid>`, DP4 — not necessarily the default
branch) **and** equals the dep submodule task's landed SHA. A gitlink move on **any non-bump task** → hard refuse
(the fail-closed net survives the relax). **`requiresTest`: false.** **deps:** T4.

### Task 7 — `war-worker.md`: submodule-task + gitlink-bump-task mechanics (Increment 2, prose)
**Files:** modify `agents/war-worker.md` — a **submodule task**: `cd` into the submodule task worktree, implement,
**write the mapped tests in the submodule repo**, gate green, commit, push the submodule branch. A **gitlink-bump
task**: resolve the dep submodule task's **landed SHA from the ledger**, `git -C <super> add <submodule-path>` at that
SHA, commit (the bump is a *worker* commit — contents, preserving Container/Contents). Supersedes the Increment-1
**block** for a *declared* submodule-path target (the block still fires for an **un**declared one).
**`requiresTest`: false.** **deps:** T4.

### Task 8 — `war-setup-scout.md`: scout the submodule's own provision list (Increment 2, prose)
**Files:** modify `agents/war-setup-scout.md` — when scouting for a **submodule phase**, run against the **submodule
dir** so the submodule gets **its own** provision list / gate-readiness (its own CI/onboarding signals), independent
of the superproject. **`requiresTest`: false.** **deps:** T4.

- [ ] Each task: **Step 1** (no test — prose) · **Step 2** implement, anchor by named construct · **Step 3** gate
  green · **Step 4** commit (`docs(war): <surface> submodule contract (Increment 2)`).
- **Closes:** the agent-contract surface (spec §5.2-5.5).

---

## Phase 5 — Schema + design docs (disjoint prose, parallel)

### Task 9 — `schemas.md`: target repo + held:submodule-pr enum + MERGE_RESULT.status + ledger fields (Increment 2, prose)
**Files:** modify `skills/war/references/schemas.md` — Task shape gains **`target repo`** (beside `requiresTest`, the
`:68` construct); the **landDecision enum** (`:198`) gains **`held:submodule-pr`** *(the third known-set surface —
DP2)*; `MERGE_RESULT.status` gains **`submodule-pr`**; **`ledger.json`** gains **submodule PR/SHA fields** (advisory,
**authoritative-when-reachable** — the same rule as `merge_sha`, the `:74` construct). **`requiresTest`: false.**
**deps:** T4.

### Task 10 — `design.md §6`: the submodule remote as a resume co-source-of-truth (Increment 2, prose)
**Files:** modify `skills/war/references/design.md` §6 — the resume-precedence model now spans the **submodule
remote**: git is monotonic there too, so the gitlink SHA is authoritative iff reachable on the submodule remote; the
reconciliation pre-flight extends to verify it. **`requiresTest`: false.** **deps:** T4.

### Task 11 — `ADR-0008` cross-link to ADR-0010 (Increment 2, prose)
**Files:** modify `docs/adr/0008-git-is-the-resume-source-of-truth.md` — a one-line **References/Consequences
addendum** noting the model is **extended by [ADR-0010]** to make the submodule remote a co-source-of-truth (ADR-0010
already records the substance; this is the back-link). **`requiresTest`: false.** **deps:** T4.

- [ ] Each task: **Step 1** (no test — prose) · **Step 2** implement, anchor by named construct · **Step 3** gate
  green · **Step 4** commit.
- **Closes:** the schema + design + ADR surfaces (spec §6, §7).

---

## Phase 6 — Release

### Task 12 — Version bump v0.7.9 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.7.8"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.8` → `0.7.9`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four
  by hand). Next free patch by construct if the stack order shifts. Status copy: first-class submodule support —
  repo-per-phase, submodule-as-repo, 2B PR-and-hold default / 2A WAR-owned opt-in, `held:submodule-pr` + gh-resume.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.9 — first-class submodule support (Increment 2)`

---

## Test plan

**Gate** = the self-discovering multi-runner:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `submodulePaths` unit | two-submodule fixture → both paths; no `.gitmodules` → `[]` | fixture-driven |
| T2 | `--declared` flag | `--declared`+gitlink → exit 0; `--declared`+content → exit 1; **no-flag**+gitlink → exit 1 | regression-guards Increment 1 |
| T4 #1 | 2B → held:submodule-pr | submodule land (2B) → `held:submodule-pr`, PR ref captured, **direct return** (no `decideLand`) | unique token; DP2 |
| T4 #2 | declared bump passes guard | bump task merge-task passes `--declared`; pin move not refused | |
| T4 #3 | bump dispatch binds blockedReason | a blocked bump worker → early escalate with reason | L3 site |
| T3, T5-T11 | (no test — prose) | full gate green | criteria prose-verified by review |

**Validation criteria (spec §12, Increment 2):** #6 submodule task worked/audited **inside** the submodule repo
(T5-T7) · #7 mapped test lands in the submodule repo; M2 floor runs against the submodule diff (T5) · #8 2B → PR +
`held:submodule-pr` + gh-resume on `mergeCommit.oid` (T3+T4) · #9 2A CAS, no hold (T4+T5) · #10 pin-validity approves
reachable+matching, refuses local-only/mismatched (T6) · #11 a gitlink move on a non-bump task is a hard refuse (T2
no-flag + T6) · #12 AFK un-owned submodule refused at launch (T3) · #13 `held:submodule-pr` in the known-set, never
rewritten (T3+T9 enumerate all three) · #14 base-branch raises to the human when unresolved (T3).

**Regression guard:** the existing `workflow-template.test.mjs` + `war-config.test.mjs` + `assert-no-submodule-mutation.test.sh`
+ every `*.test.sh` stay green — T4 is additive (a new status + a direct-return branch + threading),
`HARD_ESCALATION_REASONS`/`land-decision.mjs` untouched (DP2); T2's no-flag path preserves Increment 1.

## Recommended ADRs

**None new.** [`ADR-0009`](../adr/0009-first-class-submodule-support.md) (repo-per-phase) and
[`ADR-0010`](../adr/0010-submodule-landing-authority.md) (landing authority) are **already written + accepted**. This
plan implements them; T11 only back-links ADR-0008 → ADR-0010.

## Out of scope / Deferred

- **The landDecision prose-enum drift-guard** — [#271](https://github.com/Ljferrer/WorkAuditRefine/issues/271); T3+T9
  enumerate the three surfaces by hand instead.
- **`HARD_ESCALATION_REASONS` / `land-decision.mjs` unchanged** (DP2) — `held:submodule-pr` is set directly.
- **Recursive / nested submodules beyond one level**, **non-GitHub-host submodules** (out of scope; flagged at
  `/red-team` — spec §11), **mixed-repo phases**, **auto-merging the 2B PR**, **a background PR-merge poller** — all
  rejected in the spec.
- **No GitHub issue filed for the plan tasks** — `/war` files the phase epic + task sub-issues at decompose.

## Coverage

| Surface | Coverage |
|---|---|
| **Increment 2 (spec §4.2, §5)** | **full** — `submodulePaths` (T1) + guard relax (T2) + SKILL.md router/known-set/held/resume/reconciliation (T3) + engine 2A/2B/held:submodule-pr/relax/dispatch (T4) + refiner/auditor/worker/setup-scout contracts (T5-T8) + schemas/design/ADR docs (T9-T11). The Increment-1 fail-closed net survives the relax (T2 no-flag + T6). ADR-0009/0010 + CONTEXT terms already landed. Drift-guard deferred (#271). |
