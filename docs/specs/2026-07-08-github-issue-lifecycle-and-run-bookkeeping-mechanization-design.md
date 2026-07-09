# Mechanize WAR's GitHub side-effects — gate issue filing, preflight gh auth, couple epic-close to done, allowlist known-stranded remotes, and package the stacked-doc snap

Addresses (memory lessons): war-execution-must-file-issues, gh-account-must-be-ljferrer, close-epic-when-status-done, aftermath-2026-07-03-stranded-remote-set, stacked-pr-shared-doc-conflict-fix-merge-theirs

Depends on: [`2026-07-08-land-path-integrity-and-status-enum-discipline-design.md`](2026-07-08-land-path-integrity-and-status-enum-discipline-design.md) — build **after** it (see §8/§9). The issue-lifecycle floor keys on the phase-level `landed` decision and the epic-close coupling rides the `status:done` transition; both are stabilized by that spec's land-path and phase-vs-task status-enum discipline.

Status: proposed (2026-07-08). Current version: 0.14.14.

---

## 1. Context — the gap / problem

WAR's entire GitHub surface is **prose-governed** and drifts silently from run state. Every side-effect that touches an issue, an epic, the `gh` account, a stranded remote, or a stacked doc lives only as a sentence in a `SKILL.md` — none is a checkable gate, so each has failed in the field:

- **Issue filing is doctrine, not mechanism** (`war-execution-must-file-issues`, user-confirmed). The decompose step in `skills/war/SKILL.md` ("On approval, file **all phase epics up front**… Break each phase into **task sub-issues just-in-time**") is explicit prose, but an agent rationalized skipping issue filing **entirely** from an unrelated plan line (`No GitHub issue filed — finding id is the audit's Mx`, which only waives pre-filing an *audit finding*). Nothing caught the omission — no floor asserts the epics/sub-issues the ledger claims actually exist.
- **The `gh` active account flips mid-run** (`gh-account-must-be-ljferrer`). `gh` defaults active to a **non-collaborator** and can silently revert mid-session (observed: Ljferrer for phases 1–4, silently SQPferrer by phase 5). A whole batch of `gh issue close/edit` then fails (`does not have the correct permissions to execute CloseIssue`; `failed to update 1 issue` — the label change silently dropped). Because plain SSH `git push` still succeeds, the failure surfaces only **post-push**, where it is easy to misdiagnose. The lesson's remedy — "re-assert before EACH gh write batch" — is today a manual Lead chore.
- **A done epic stays open** (`close-epic-when-status-done`). Marking a phase epic `status:done` and `gh issue close`-ing it are **decoupled prose instructions**; epic #52 was set `status:done` but left open, misrepresenting run state on the board.
- **Aftermath re-flags a fixed stranded set every run** (`aftermath-2026-07-03-stranded-remote-set`, repo). 26 remote WAR branches are permanently known-stranded — content landed under rewritten SHAs, so they can never pass the tip-reachable + PR-merged remote-deletion bar. `skills/aftermath/SKILL.md` re-derives them as fresh **needs-human** rows in *every* future run. The bar is correct and must not lower; the noise is pure re-derivation.
- **Stacked branches conflict on churny shared docs** (`stacked-pr-shared-doc-conflict-fix-merge-theirs`). Stacked branches sharing `docs/plans`/`docs/specs`/roadmap files with master conflict there and only there — code is fine — forcing a hand-run merge-master / `checkout --theirs` / fast-forward recipe per branch (proven 6× on the v0.8.x stack).

**This spec ratifies converting each prose invariant into a mechanism**: a `gh` auth preflight, a hard issue-lifecycle floor, a label-and-close coupling, a committed known-stranded allowlist, and a packaged stacked-doc snap — so the GitHub surface is *verified*, not trusted.

## 2. Pivotal constraints

- **C1 — The plugin ships generic; personal identity stays in local config.** The expected `gh` account (`Ljferrer`) is a personal, machine-local fact and a redaction-lint hazard (a handle). No shipped script or committed file may hardcode it. It must come from run config; unset ⇒ the preflight is a **no-op** (single-account repos are unaffected).
- **C2 — Do not widen agent capability (ADR 0002).** All `gh` writes are **Lead-side** (auditors have no writes; the servitor has no Bash; workers/refiner never touch issues/PRs). The issue floor and preflight are Lead-invoked checks — they must **not** grant the refiner or any confined agent a `gh` verb.
- **C3 — Never lower an evidence bar (aftermath doctrine).** The known-stranded allowlist **suppresses re-derivation noise**; it must not make an un-adjudicated branch deletable. Remote deletion stays gated on tip-reachable + PR-merged. An allowlist row is an *acknowledgement that a branch is permanently stranded*, evidenced by its landing PR — never a deletion license.
- **C4 — Git is the resume/truth source (ADR 0008).** Issue existence and closure are verified against live `gh`/git, never a ledger claim alone (the ledger is the weakest authority). The floor reconciles the ledger's `epic_issue`/`issue` fields *toward* `gh`, never the reverse.
- **C5 — Floor exit contract is load-bearing (ADR 0006 family).** A new floor mirrors the `assert-*-in-diff.sh` contract exactly: `0` = verified, `1` = the named route (issues-missing / done-but-open), `2` = tooling/ref error that must **never** collapse into the `1` route.
- **C6 — Never `--force` a shared ref.** The stacked-doc snap fast-forwards a docs-only fix (first parent = old tip); a wrong-content push auto-rejects non-ff as the safety net (per `stacked-pr-shared-doc-conflict-fix-merge-theirs`). No `reset --hard`, no force-push.
- **C7 — Reduce recurrence at the source before adding tooling.** ADR 0011 (stack-and-plow) already bases plan N on plan N-1's tip, so new campaigns carry shared docs forward instead of re-diverging from stale master. The snap helper is the **residual fallback**, not the primary fix.

## 3. Resolved design tree (decision → resolution)

| Sub-friction | Decision | Resolution |
|---|---|---|
| `gh-account-must-be-ljferrer` | Where does the expected account live? | New `overrides.ghUser` (string\|null, default `null`) in `war-config.mjs` `DEFAULTS` + `KNOWN_OVERRIDES`. Personal handle stays in the operator's local `.claude/war/config.json`; the shipped plugin ships `null`. |
| `gh-account-must-be-ljferrer` | How is auth asserted? | New `skills/_shared/gh-preflight.sh <expected-user>`: reads `gh auth status`, switches with `gh auth switch` on drift, **re-verifies** with `gh api user --jq .login`, and **fails loud** (non-zero) if the active account still mismatches. `ghUser` unset ⇒ exit 0 no-op. |
| `gh-account-must-be-ljferrer` | When does it run? | Lead standing instruction: run `gh-preflight.sh` at the head of **every gh write batch** (decompose file-epics, per-phase task sub-issues, checkpoint close/mirror, Finish PR, and each aftermath close batch). Reused by the issue floor (below). |
| `war-execution-must-file-issues` | Prose → mechanism | New Lead-invoked floor `skills/war/assets/assert-issues-filed.sh` asserting the phase's `epic_issue` and every task's `issue` (from the ledger) exist on `gh`; runs at the checkpoint before the DAG advances. A `1` halts the advance — issue filing becomes verifiable, not doctrinal. |
| `war-execution-must-file-issues` | Guard against the exact rationalization | The floor is keyed on the **ledger's own** `epic_issue`/`tasks[].issue` fields, orthogonal to any plan's `No GitHub issue filed` audit-finding line — the two can never again be conflated because the floor never reads plan prose. |
| `close-epic-when-status-done` | Couple label + close | Same script, `--close-epic <n> --sha <sha>` mode: performs `gh issue edit --add-label status:done --remove-label status:in-progress` **and** `gh issue close --reason completed --comment "<phase> landed @ <sha>"` as one action. |
| `close-epic-when-status-done` | Make the coupling non-bypassable | The floor's **landed-phase assertion** requires the epic state == `CLOSED` (and label `status:done`). A done-but-open epic returns `1` and halts — `status:done` cannot survive the checkpoint without the close. |
| `aftermath-2026-07-03-stranded-remote-set` | Where does the allowlist live? | New committed file `docs/aftermath/known-stranded.tsv` (columns `remote_ref`\t`landed_pr`\t`note`), seeded with the 26 recorded stranded refs. Committed = durable, human-reviewed, shared across machines. |
| `aftermath-2026-07-03-stranded-remote-set` | How does aftermath use it without lowering the bar (C3) | New report bucket **"acknowledged-stranded"**: a remote branch matching an allowlist row is suppressed from **needs-human** and is **never auto-deleted** (it still fails the deletion gate by construction). Adding a row requires the `landed_pr` evidence column. |
| `stacked-pr-shared-doc-conflict-fix-merge-theirs` | Source fix | Reaffirm **ADR 0011 stack-and-plow** as the primary recurrence reducer (already ratified — new campaigns carry docs forward). No new ADR for the source fix. |
| `stacked-pr-shared-doc-conflict-fix-merge-theirs` | Residual fallback | Package the proven recipe as `skills/war-campaign/assets/snap-shared-docs.sh <branch>`: merge `origin/master`, resolve the **canonical churny-doc pathspec** (`docs/plans docs/specs docs/roadmaps`) with `checkout --theirs`, guard byte-identity outside the pathspec, verify with `git merge-tree`, fast-forward push (never `--force`). |

## 4. Mechanics (per component)

### 4.1 `gh` auth preflight — `skills/_shared/gh-preflight.sh`
Single argument: the expected account (the Lead passes `overrides.ghUser`). Behavior:
1. Empty/unset expected user ⇒ **exit 0** immediately (no-op; single-account repos and the shipped default are untouched — C1).
2. Read active account (`gh auth status`, parse `Active account`). If it equals the expected user ⇒ exit 0.
3. On drift: `gh auth switch --hostname github.com --user <expected>`, then **re-verify** `gh api user --jq .login`.
4. Verified match ⇒ exit 0. Still mismatched (switch failed, account absent) ⇒ **exit non-zero, printing both the wanted and actual login** — the batch must not proceed into silent post-push write failures. This is the fail-loud fix for the "surfaces only after push" misdiagnosis.

Lead standing instruction (added to `skills/war/SKILL.md`, mirrored where aftermath does closes): run this before each gh write batch. It is a Lead-only check — it adds **no** `gh` capability to any confined agent (C2).

### 4.2 Issue-lifecycle floor — `skills/war/assets/assert-issues-filed.sh`
Mirrors the `assert-test-in-diff.sh` exit contract (C5): `0` verified · `1` the named route (`issues-missing` / `done-but-open`) · `2` gh/ledger/ref error (never collapses into `1`). Modes:

- **`assert <ledger.json> <phase-id>`** (default): reads the phase's `epic_issue` and each `tasks[].issue` from the ledger (schema in `skills/war/references/schemas.md`). Asserts each is non-null **and** `gh issue view <n> --json state,labels` confirms it exists. On a phase the Lead is landing, additionally asserts the **epic is `CLOSED` and labeled `status:done`** (the close-coupling teeth, §4.3). Runs `gh-preflight.sh` first so a mid-run account flip cannot fake a `2`.
- **`--close-epic <n> --sha <sha>`**: the atomic label-and-close (§4.3).

Invocation: the Lead runs `assert` at the **Checkpoint** (`skills/war/SKILL.md` `## Checkpoint`) before advancing the DAG. A `1` blocks the advance and surfaces which epic/task issue is missing or which done epic is still open — converting the prose "must file issues" invariant into a hard gate. A `2` (gh/network/ledger-parse failure) escalates as a tooling error, never a silent pass. Placed in `skills/war/assets/` beside the floor family; **Lead-invoked**, not refiner-side (the refiner stays git-confined — C2).

### 4.3 Close-on-done coupling
`assert-issues-filed.sh --close-epic <n> --sha <sha>` runs, in one call: `gh issue edit <n> --add-label status:done --remove-label status:in-progress` then `gh issue close <n> --reason completed --comment "<phase> landed @ <sha>"` (gh-preflight first). The Lead calls this at the checkpoint of a landed phase instead of two separate commands. The enforcement teeth are in §4.2's landed-phase assertion: the very next `assert` fails `done-but-open` if the close did not take, so `status:done` can never again outlive an open epic.

### 4.4 Aftermath known-stranded allowlist
- **File**: `docs/aftermath/known-stranded.tsv`, tab-separated `remote_ref`, `landed_pr`, `note`; comment lines (`#`) and blanks ignored. Seeded from `aftermath-2026-07-03-stranded-remote-set` (the `integration/pipelineskills/*` + `war/pipelineskills/*`, `integration/memsub/*` + `war/memsub/*`, `war/compaction/*`, `war/followup444/*`, and the two `claude/*` session remotes — 26 refs, each with its landing PR).
- **Consultation** (`skills/aftermath/SKILL.md`, Class-1 remote-branch reasoning): after deriving the remote candidate set from `git ls-remote` truth, a candidate whose ref matches an allowlist row is routed to a new **"acknowledged-stranded"** report bucket — printed for the record, **excluded from needs-human**, and **never auto-deleted** (it still fails tip-reachable + PR-merged, so the deletion bar is untouched — C3). Clearing an acknowledged-stranded remote remains a deliberate manual `git push origin --delete` outside aftermath's gates.
- **Adding a row** requires the `landed_pr` column populated (the evidence that content landed elsewhere) — the human-review discipline that keeps the allowlist honest.

### 4.5 Stacked shared-doc snap — `skills/war-campaign/assets/snap-shared-docs.sh`
Packages the `stacked-pr-shared-doc-conflict-fix-merge-theirs` recipe as one command, run per conflicting branch in a detached scratch worktree off `origin/<branch>`:
1. `git merge --no-edit origin/master`; resolve each unmerged path under the canonical churny-doc pathspec (`docs/plans docs/specs docs/roadmaps`) with `git checkout --theirs -- "$f" && git add -- "$f"` (`--theirs` in a merge-of-master = master's canonical copy).
2. **Guard before push**: 0 unmerged paths remain **AND** `git diff origin/<branch> HEAD -- . ':(exclude)docs/plans' ':(exclude)docs/specs' ':(exclude)docs/roadmaps'` is empty (code byte-identical to the reviewed tip — a docs-only snap never alters code).
3. `git push origin HEAD:refs/heads/<branch>` — first parent = old tip ⇒ fast-forwards; a wrong-content push auto-rejects non-ff (C6). Never `--force`.
4. Verify `git merge-tree --messages origin/master origin/<branch>` shows 0 CONFLICT before trusting GitHub's (lagging) mergeability.

bash-3.2/zsh-safe idioms from the lesson (iterate with `while IFS= read -r`; quote paths for `git show`). ADR 0011 remains the primary recurrence reducer (C7); this helper is invoked only when a docs-only conflict surfaces anyway.

## 5. Surface changes (files touched)

| File | Change |
|---|---|
| `skills/_shared/gh-preflight.sh` | **new** — auth preflight (§4.1) |
| `skills/_shared/gh-preflight.test.sh` | **new** — no-op path, drift-switch path, fail-loud path (stubbed `gh`) |
| `skills/war/assets/assert-issues-filed.sh` | **new** — issue-lifecycle floor + `--close-epic` mode (§4.2/§4.3) |
| `skills/war/assets/assert-issues-filed.test.sh` | **new** — floor exit contract 0/1/2, done-but-open detection (stubbed `gh` + fixture ledger) |
| `skills/war/assets/war-config.mjs` | add `ghUser` to `overrides` DEFAULTS + `KNOWN_OVERRIDES` (null\|string validation, reuse existing loop) |
| `skills/war/assets/war-config.test.mjs` | assert `ghUser` known-key acceptance + non-string rejection |
| `skills/war/SKILL.md` | Decompose + Checkpoint: name `gh-preflight.sh` before gh batches, `assert-issues-filed.sh` at the checkpoint gate, `--close-epic` as the landed-phase action |
| `skills/aftermath/SKILL.md` | Class-1 remote reasoning: consult `known-stranded.tsv`, add the acknowledged-stranded bucket |
| `docs/aftermath/known-stranded.tsv` | **new** — committed allowlist, seeded with the 26 refs |
| `skills/war-campaign/assets/snap-shared-docs.sh` | **new** — packaged snap recipe (§4.5) |
| `skills/war-campaign/assets/snap-shared-docs.test.sh` | **new** — pathspec resolution + byte-identity guard (fixture repo) |
| `skills/war-room/SKILL.md` | surface `overrides.ghUser` as a configurable knob (single line) |
| `CONTEXT.md` | new terms (§6) |
| `docs/adr/0023-*.md`, `docs/adr/0024-*.md` | **new** ADRs (§7) |

## 6. New domain terms (CONTEXT.md)

- **gh preflight** — the pre-batch assertion that the active `gh` account is the run's `overrides.ghUser`, re-switching on drift and failing loud on an unrecoverable mismatch, so a mid-run account flip never silently drops a write batch. _Avoid_: relying on a once-at-session-start auth check.
- **issue-lifecycle floor** — the Lead-invoked check (`assert-issues-filed.sh`) that phase epics and task sub-issues named in the ledger actually exist on `gh`, and are closed with `status:done` on a landed phase. A hard gate at the checkpoint; issue filing is verified, not doctrinal. _Avoid_: trusting the ledger's `epic_issue`/`issue` fields as proof of filing.
- **acknowledged-stranded** — an aftermath report bucket for remote branches an operator has permanently accepted as stranded (content landed under rewritten SHAs), recorded in `known-stranded.tsv` with a landing PR. Suppressed from needs-human, never auto-deleted, the deletion bar unchanged. _Avoid_: re-deriving them as fresh needs-human rows every run.
- **churny shared docs** — the pathspec (`docs/plans docs/specs docs/roadmaps`) whose files a stacked branch predictably conflicts on against master; snapped to master's canonical copy by `snap-shared-docs.sh`. _Avoid_: rebasing or force-pushing a docs-only conflict.

## 7. Recommended ADRs

- **ADR 0023 — WAR's GitHub side-effects are mechanically gated, not doctrinal.** Records: the issue-lifecycle floor (issue filing is a checkable gate keyed on the ledger, orthogonal to any plan's `No GitHub issue filed` line), the `gh` preflight (`overrides.ghUser`; fail-loud on unrecoverable drift; ships null/generic — C1), and the close-on-done coupling (`status:done` cannot outlive an open epic). Notes C2 (Lead-side only, no confined-agent capability widening).
- **ADR 0024 — Aftermath consults a committed known-stranded allowlist; the deletion bar never lowers.** Records that acknowledged-stranded remotes are suppressed from needs-human via `docs/aftermath/known-stranded.tsv` evidenced by landing PRs, explicitly without changing the tip-reachable + PR-merged deletion gate (C3).
- The stacked-doc snap needs **no new ADR** — it reaffirms ADR 0011 as the source fix and packages an already-recorded recipe.

## 8. Open risks / implementation notes

- **Depends on the land-path/status-enum spec.** Build **after** `2026-07-08-land-path-integrity-and-status-enum-discipline-design.md`: the floor's landed-phase branch (close-on-done, close task issues) keys on a correct phase-level `landed` decision, and the epic `status:done` transition must not be confused with the task-level `merged` enum (`phase-vs-task-status-enum-leakage`). Sequencing avoids re-anchoring the floor on a status vocabulary still in flux.
- **`gh auth status` parse fragility.** The `Active account` line format is a `gh` CLI surface that can change across versions. Mitigation: prefer `gh api user --jq .login` as the authoritative post-switch verify; treat a parse miss as a `2` (tooling error → escalate), never a `0`.
- **The floor cannot verify sub-issues never filed.** It asserts the ledger's recorded issue numbers exist; a task the Lead forgot to record in the ledger at all is invisible to it. This is acceptable — the same rationalization that skipped filing would also skip the ledger record, but the ledger→gate coupling makes the omission surface at the next `war-config`/schema validation and at any human ledger read. `ponytail:` the floor guards the recorded-but-unfiled and done-but-open cases (the observed failures), not a fully absent bookkeeping intent.
- **Allowlist match precision.** Match `known-stranded.tsv` rows against `git ls-remote` refs by exact ref name (`refs/heads/<ref>`), never a substring, so `war/memsub/p1-task1` never shadows `war/memsub/p1-task10`.
- **Snap helper scope.** The canonical pathspec is the three doc dirs that have actually conflicted; if a future churny shared doc emerges outside them (e.g. `CONTEXT.md`), extend the pathspec rather than widening to "all docs" (a code-touching doc must never be blindly `--theirs`'d).

## 9. Non-goals / deferred

- **No new confined-agent capability.** This spec does not give the refiner, auditor, worker, or servitor any `gh` verb (C2). All mechanization is Lead-side.
- **No PreToolUse hook intercepting `gh` Bash calls.** A hook that gated every `gh issue`/`gh pr` invocation was considered and rejected as over-built: gh writes are Lead-side where Bash is fail-open advisory, and the preflight-before-batch idiom + the checkpoint floor cover the observed failures with far less surface. Revisit only if a batch bypasses the preflight in practice.
- **No automatic remote deletion of acknowledged-stranded branches.** Clearing them stays a deliberate manual operator action outside aftermath's gates (C3).
- **No change to the stack-and-plow branch model.** ADR 0011 is reaffirmed, not revised; `snap-shared-docs.sh` is a fallback, not a new merge strategy.
- **Not addressed here:** the land-path CAS/status-enum corrections themselves (the dependency spec owns them).

## 10. Validation criteria (concrete, testable)

1. **gh preflight no-op.** `gh-preflight.sh ""` (empty expected user) exits `0` without invoking `gh` — verified in `gh-preflight.test.sh` with a `gh` stub that fails if called.
2. **gh preflight drift-switch.** With a stubbed `gh` reporting active account `B` and expected `A`, `gh-preflight.sh A` invokes `gh auth switch … --user A`, re-verifies via `gh api user`, and exits `0`.
3. **gh preflight fail-loud.** With a stub where the switch does not change the active account, `gh-preflight.sh A` exits **non-zero** and prints both wanted (`A`) and actual login — never `0`.
4. **Issue floor — all filed.** Against a fixture ledger with `epic_issue` and every `tasks[].issue` set and a `gh` stub reporting each exists, `assert-issues-filed.sh assert <ledger> <phase>` exits `0`.
5. **Issue floor — missing.** With one task `issue` null (or `gh issue view` reporting not-found), it exits `1` naming the missing issue; a `gh` network failure exits `2` (never `1`) — the exit contract is asserted in `assert-issues-filed.test.sh`.
6. **Issue floor — done-but-open.** On a landed phase whose epic `gh issue view` reports `state:OPEN` with label `status:done`, the floor exits `1` (`done-but-open`); with `state:CLOSED` it exits `0`.
7. **Close coupling atomic.** `assert-issues-filed.sh --close-epic <n> --sha <sha>` issues both the label edit and the `gh issue close` (asserted via the `gh` stub's recorded argv); after it, criterion 6 passes for that epic.
8. **`overrides.ghUser` wiring.** `war-config.test.mjs` accepts `overrides.ghUser: "someuser"` and rejects a non-string; the shipped `DEFAULTS.overrides.ghUser` is `null`.
9. **Allowlist suppression.** With `known-stranded.tsv` containing a ref and a simulated `git ls-remote` set including it, the aftermath classification routes that ref to acknowledged-stranded (not needs-human) and never into any delete list — verified against the seeded 26 refs.
10. **Allowlist does not lower the bar.** A remote ref **not** in the allowlist that fails tip-reachable + PR-merged still reports as needs-human (the deletion gate is unchanged — C3).
11. **Snap byte-identity guard.** `snap-shared-docs.test.sh`: on a fixture where a branch and master differ only under `docs/plans`/`docs/specs`, the helper resolves to master's copy, the post-resolve code diff (excluding the pathspec) is empty, and the push is a fast-forward; a fixture with a code difference **outside** the pathspec makes the guard refuse to push.
12. **Redaction clean.** No shipped script or committed file (`gh-preflight.sh`, `assert-issues-filed.sh`, `known-stranded.tsv`, ADRs) contains the literal expected-account handle; `node skills/_shared/war-memory.mjs lint docs/learnings/` stays green (no new personal-fact leakage into committed learnings).
