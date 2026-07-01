# Auditor pin-validity lens drops the denied `git fetch` Implementation Plan (issue #310)

**Goal:** make the submodule pin-validity lens runnable by the read-only auditor **without** widening the git guard. Reword the lens in [`agents/war-auditor.md`](../../agents/war-auditor.md) to drop `git -C <sub> fetch` — the ledger SHA-match becomes the authoritative in-seat check, remote-reachability is delegated to the dep-task land + Lead pre-flight reconciliation, and a read-only `cat-file -e` is a best-effort non-blocking confirmation. Add deny-tests to [`validate-auditor-git.test.sh`](../../hooks/validate-auditor-git.test.sh) pinning that `fetch` **stays** denied. **No change to `validate-auditor-git.sh`.**

**Source spec:** [`docs/specs/2026-07-01-auditor-pin-validity-no-fetch-design.md`](../specs/2026-07-01-auditor-pin-validity-no-fetch-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source** (this slug = landOrder 10 = **v0.8.10**).
Memory hooks: [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]] (`fetch` deliberately excluded; spec 4 added the `-C` peel), [[auditor-cannot-execute-the-tests-it-must-verify-pass]], [[absence-guard-verb-specific-coverage-gap]] (cover the `-C` form too), [[in-memory-landed-shas-inert-for-cross-phase-bump]] (ledger is authoritative SHA source), [[gate-under-covers-after-cross-branch-merge-new-runner]], [[version-slots-no-cross-slot-consistency-test]] (#release).

**Ratify with `/red-team` before `/war`** — it changes an auditor lens (a verification contract). Run `/red-team` on this plan first.

## Coordination

- **Target version:** **v0.8.10** (roadmap landOrder 10, severity MED). Bumps `0.8.9 → 0.8.10`.
- **Integration base:** the **landed tip of Spec 9 (v0.8.9)**. **Standalone fallback:** off a different tip, re-baseline the release to the next free patch off the live tip and drop the pin — version literal not authoritative ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). The lens reword + deny-tests are baseline-independent.
- **Depends on spec 4 (v0.8.4, LANDED):** spec 4's `-C <path>` peel is what already lets `git -C <sub> cat-file -e <oid>` through. So at any base ≥ v0.8.4 the sibling read verb works; only `fetch` is denied. (If somehow run below v0.8.4, the `cat-file -e` step also needs the peel — but the stack is well past v0.8.4.)
- **File-independence:** `agents/war-auditor.md` + `hooks/validate-auditor-git.test.sh` are an isolated lane, disjoint from every other pending spec except the four version slots. `validate-auditor-git.sh` is **untouched** (spec 4's owner; no conflict).
- **Four-slot serial land (replace-in-place, no badge):** `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status`. All four read `0.8.10` after the release task; verify by hand.
- **Commit boundaries:** two tasks, one commit each — T1 (lens + deny-test), T2 (release).

## Operator decisions — RESOLVED (bake in exactly)

- **Drop the `git -C <sub> fetch`** from the auditor lens (Option 1). **No guard change.**
- **Ledger-match is the authoritative in-seat check:** new SHA == the dep submodule task's landed SHA (ledger read). A mismatch → **Critical / `request_changes`** (unchanged).
- **Remote-reachability delegated & cited** — established by the dep task's land + the Lead pre-flight reconciliation (`SKILL.md`, submodule co-source-of-truth). The lens names this instead of re-verifying via `fetch`.
- **Local `cat-file -e <oid>` is a best-effort, NON-blocking sanity confirmation** — its **absence is not a finding** (the object need not be fetched into the read-only checkout). Never false-block a legitimate pin.
- **Deny-test pins `fetch` stays denied** — both bare `git fetch` and the `-C`-prefixed `git -C <sub> fetch` (the `-C` form matters post-spec-4 peel) exit 2 with a `WAR:` marker. The resolution is "drop the call," not "allow the verb."

---

## Phase 1 — reword the lens + pin the guard

### Task 1 — Drop `fetch` from the pin-validity lens; deny-test that `fetch` stays denied (#310)

**Files:** [`agents/war-auditor.md`](../../agents/war-auditor.md) (pin-validity lens Step 3; anchor by the `If this is a gitlink-bump task` / `Verify the new SHA is reachable on the submodule remote` construct), [`hooks/validate-auditor-git.test.sh`](../../hooks/validate-auditor-git.test.sh) (deny-cases).

**`requiresTest`: true** — the deny-test is the load-bearing artifact (a regression pin that `fetch` stays denied). The lens reword is prose, guarded by a grep step + the deny-test.

- [ ] **Step 1 — Establish the guard baseline (deny is green-from-start).** Run `bash hooks/validate-auditor-git.test.sh` → passes at HEAD. Confirm `fetch` is already denied: the existing default-deny arm rejects it. This test guards existing-correct behavior, so a true RED-first isn't available — Step 3 proves load-bearing by temp-allow.
- [ ] **Step 2 — Add the deny-cases.** In `validate-auditor-git.test.sh`, add: (a) `git -C /abs/sub fetch` → assert exit 2 with a `WAR:` deny marker; (b) bare `git fetch` → exit 2 with `WAR:`. Keep/confirm the existing read-verb allow-cases (`-C <path> rev-parse`, `-C <path> cat-file`, `-C <path> show`) still pass — proving the resolution did **not** widen the allowlist. Run → **GREEN**.
- [ ] **Step 3 — Prove the deny-cases load-bearing (temp-allow + revert).** Temporarily add a `fetch` arm to the `validate-auditor-git.sh` subcommand allowlist → the new deny-cases go **RED** (fetch now allowed); **revert** the guard immediately (the guard must ship byte-identical). Confirms the deny-tests actually assert the exclusion.
- [ ] **Step 4 — Reword the lens (drop fetch).** In `agents/war-auditor.md`, rewrite pin-validity Step 3: the authoritative check is the ledger SHA-match (new SHA == dep task's landed SHA); remote-reachability is established upstream (dep-task land + Lead pre-flight reconciliation — cite it); **do NOT `git fetch`** (read-only, denied by design); a read-only `git -C <sub> cat-file -e <oid>` is an optional non-blocking confirmation whose **absence is not a finding**. Fold the old Step 4 (SHA == dep task's landed SHA) in as the load-bearing check; a mismatch still → **Critical / `request_changes`**.
- [ ] **Step 5 — Grep-verify the prose.** `grep -n 'fetch' agents/war-auditor.md` returns nothing in the pin-validity lens block (the `fetch` instruction is gone); the lens still names the dep-task landed-SHA ledger match as authoritative and cites the pre-flight reconciliation.
- [ ] **Step 6 — Full self-discovering gate → green** (incl. `validate-auditor-git.test.sh`). Commit — `fix(war): drop denied git fetch from auditor pin-validity lens; pin fetch-stays-denied (#310)`.
- **Closes #310.** The lens runs within allowed read verbs; the guard is unchanged and the exclusion is regression-pinned.

---

## Phase 2 — Release v0.8.10

### Task 2 — Bump the four canonical version slots + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json`; `.claude-plugin/marketplace.json` (×2); `README.md` `## Status` (REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.9 → 0.8.10`** (or next free patch off the live tip). README `## Status` copy: *auditor pin-validity lens drops the denied `git fetch` — ledger-match authoritative, reachability delegated upstream; guard unchanged.* Verify all four by hand.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.10 — auditor pin-validity no-fetch (#310)`.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

`validate-auditor-git.test.sh` is among the self-discovered `*.test.sh` runners. Run **all** post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]); the count is self-discovered, never a literal ([[task-prompt-suite-count-stale-after-stacking]]).

## Coverage

| Issue | Task | Kind | Closure |
|---|---|---|---|
| #310 | Task 1 (Phase 1) | lens reword + deny-test | drop `fetch`; ledger-match authoritative; `cat-file -e` best-effort non-blocking; reachability delegated + cited; deny-test pins `fetch` (bare + `-C` form) stays denied; guard byte-unchanged |
| *(release)* | Task 2 (Phase 2) | version bump | four slots `0.8.9 → 0.8.10` (fallback: next free patch off live tip) |

## Deliberate simplifications (ponytail)

- **One impl task, not two.** The lens reword and the deny-test are one coherent unit — the deny-test justifies why the lens can drop `fetch` (the verb stays denied on purpose). Splitting them separates a claim from its proof.
- **Deny-test is green-from-start.** `fetch` is already denied; a true RED-first is impossible. The temp-allow+revert (Step 3) is the repo's standard load-bearing proof for a regression pin.
- **No `validate-auditor-git.sh` change.** The guard is correct; the lens was asking for a verb it rightly denies. Zero guard surface added ([[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]]).
- **`war-auditor.md` prose guarded by grep, not a bespoke test.** Agent-instruction prose; the grep step (no `fetch` in the lens) + the behavioral deny-test are sufficient — a dedicated prose test would be brittle.
