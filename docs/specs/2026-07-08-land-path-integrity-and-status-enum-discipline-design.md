# Land self-reports must match git: a single land-truth guard, contender-less-transient auto-recovery, and drift-guarded status enums

**Status:** design spec (decision record) — not executable. `/war-machine` converts this to a plan; `/red-team` validates; `/war` executes.
**Slug:** `land-path-integrity-and-status-enum-discipline` (plan shares the slug, drops the `-design` suffix).
**Repo version at authoring:** 0.14.14. Version literals below are non-authoritative — resolve the next free patch from the four release slots at land time.
**Source spec:** this file.

Addresses (memory lessons): war-phantom-land-reports-success-without-advancing-integration, land-local-follower-ref-can-lag-sync-before-next-phase, phase-land-stale-spurious-cas-recovery, absent-origin-working-branch-baseline-also-forces-manual-land, held-escalation-lead-manual-completion, shared-status-enum-widening-silently-widens-land-path, phase-vs-task-status-enum-leakage

---

## 1. Context — the gap / problem

Every WAR phase ends the same way: the refiner merges `integration/<slug>/phase-N` into the working branch with `--no-ff` and advances the working ref via a push-first CAS. The Workflow then reads the refiner's self-reported `MergeResult` (`status`, `working_sha`) and decides `landDecision`. Seven recorded frictions all trace to one root: **the land trusts the refiner's self-report instead of git ground truth, and the manual recovery paths are prose the Lead must remember rather than a verified operation.**

Concretely, in the live code (`skills/war/assets/`):

1. **Phantom land** (`war-phantom-land-reports-success-without-advancing-integration`, high). `cmd_land_advance` in `provision-worktrees.sh` captures `pre_push_local` (the working tip before the push) and, on push success, reads back `git ls-remote origin refs/heads/<working>` and asserts `actual == new_sha`. But it never asserts `new_sha != pre_push_local`. When the integration branch is *already up to date* with the working tip, `git merge --no-ff integration` produces **no merge commit**, HEAD stays at the old tip, the push is a no-op that exits 0, and the readback passes because origin already holds that sha. The refiner returns `status:'landed'` with `working_sha` equal to the prior phase's tip; `workflow-template.js` reads `landResult.working_sha` into `handoff.tipSha` verbatim; a stacked dependent then builds on a tip that silently dropped the phase's work. Detection today is a memory-documented manual protocol ("after every land, verify `working_sha` is NEW") with **no code enforcement**.

2. **Ref lag** (`land-local-follower-ref-can-lag-sync-before-next-phase`, high). Manual land paths (the `held:land-failed` auto-recover, the escalation-path land) do `git merge && git push` in the Lead worktree, bypassing `cmd_land_advance`'s ls-remote readback + follower `update-ref`. Those bypassing paths can leave the local or origin working ref lagging `landResult.working_sha`, and the next Provision cuts off a stale ref (6+ recorded "false-missing" cascades).

3. **Spurious `land_stale`** (`phase-land-stale-spurious-cas-recovery`, high). The reland loop (`agents/war-refiner.md` §land-phase steps 2–3, mirrored in the `workflow-template.js` land prompt) returns `land_stale` on `roundLimit` CAS exhaustion **without distinguishing a real divergence from a single contender-less transient** (common when a release phase pushes one commit). `land_stale` ∈ `HARD_ESCALATION_REASONS` → `held:escalation`, so the servitor (gated on `landResult.status === 'landed'`) is **never spawned** (`servitorResult: null`), forcing a full Lead manual re-verify + reland + manual-servitor-spawn.

4. **Absent-origin manual land** (`absent-origin-working-branch-baseline-also-forces-manual-land`, high). `held:land-failed` has two independent causes — a checkout collision, and a missing `origin/<working>` baseline — but the SKILL.md Checkpoint `held:land-failed` auto-recover bullet gates only on "the working branch is checked out in the Lead worktree". The absent-origin cause never matches, so it forces a manual land even though `cmd_ensure_origin` already exists to fix it.

5. **Fragile escalation completion** (`held-escalation-lead-manual-completion`, medium). A `held:escalation` with N-1 tasks landed and one trivial Major forces the Lead to hand-run a 6-step dance (rebase → gate → ff-merge → push-first CAS → verify remote moved → detach `_refinery`) to avoid a ~44-min full re-run — the CAS/ref-sync steps being exactly the error-prone ones the guard above would verify.

6. **Shared-enum widening** (`shared-status-enum-widening-silently-widens-land-path`, medium). `HARD_ESCALATION_REASONS` is one array shared by the merge-task and land-phase modes and hand-mirrored between `land-decision.mjs` and `workflow-template.js`. Values only the merge-task prompts emit (`no-test`, `unpackaged`) are inert in the land-phase `.includes(landResult.status)` check — guarded today only by a hand-written unreachability **comment**, one prompt drift away from a silent hard escalation.

7. **Phase-vs-task enum leak** (`phase-vs-task-status-enum-leakage`, low). Phase-level `landDecision` tokens (`landed`) leak into task-level status prose. Cosmetic today, but nothing mechanically separates the two enums (both defined in `schemas.md`), so a future worker could gate on a task status string that can never equal `landed` and silently never proceed.

The unifying decision: **make the land primitive assert git ground truth, route every land path through it, teach the reland loop to tell a transient from a divergence, and convert the two prose-only enum invariants into drift-guarded tests.**

## 2. Pivotal constraints

- **Git is the source of truth** (ADR 0008). The land must reconcile records toward git, never git toward records. `working_sha` is authoritative only when git confirms the working ref advanced to it.
- **Never force-push** (ADR 0004). The non-ff rejection *is* the CAS. The phantom-land and ref-lag fixes add read-side assertions and CAS `update-ref`s only — no new force path.
- **`land-advance` exit contract is 0/2/3** and must stay stable: 0 = pushed + local follower advanced; 2 = `[rejected]` → reland; 3 = other push error → escalate. A git error must never collapse into a success or a reland (mirrors the floor-script 0/1/2 discipline).
- **`HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` stay single-source-of-truth in `land-decision.mjs`, hand-mirrored in `workflow-template.js`** (ADR 0005). Do not split the constant per mode — that breaks the mirror and the existing drift-guard. Never add a new member to satisfy any fix here (ADR 0005: no `held:workflow-error`-style additions).
- **Prompt surfaces are split.** Any reland-loop behavior change touches both the standing `agents/war-refiner.md` §land-phase and the dispatched `workflow-template.js` land prompt, in the same commit (recorded `standing-instruction-vs-dispatched-prompt-coverage-split`).
- **The resolved gate is a runtime string**, not something a shell subcommand can own — so the escalation-completion helper cannot be a single bespoke script; the gate stays a Lead-run step (this bounds friction 5's resolution).
- **Fail-loud, never fail-silent** on the land path: a land that cannot prove it advanced must hold, not report success.

## 3. Resolved design tree (decision → resolution)

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Where does the phantom-land guard live? | In `cmd_land_advance` (`provision-worktrees.sh`), the single chokepoint every land routes through. `pre_push_local` is already captured; add one guard: refuse (exit 3, loud die) when `new_sha == pre_push_local` — the `--no-ff` merge produced no new commit, so the integration branch had nothing ahead of `<working>`. Not a prose Lead protocol. |
| D2 | Does the Workflow also assert `working_sha` advanced? | It relies on the guard in D1 rather than re-implementing the check — but the `handoff.tipSha` assignment in `workflow-template.js` stays keyed on a *guarded* `landResult.working_sha`. A `landDecision:'landed'` can now only arise after `land-advance` returned 0, which D1 makes impossible without a real advance. |
| D3 | How is ref lag fixed without a new subcommand? | Route **every** land through `cmd_land_advance`, which already does the ls-remote readback + follower `update-ref` CAS on success. The manual paths (auto-recover, escalation completion) stop doing raw `git push` and call `land-advance <working> <merge-sha>` instead — the reconciliation becomes automatic. The next phase's `cmd_ensure_integration` origin-derivation is the standing backstop (SKILL.md already: pre-phase sync no longer load-bearing). |
| D4 | Transient vs. real divergence on CAS exhaustion? | Before returning `land_stale`, the reland loop runs `git rev-list --left-right --count <working>...origin/<working>`. `0	0` (contender-less transient) → one more push-first attempt; a nonzero right count (real divergence) → `land_stale`. Mirrored in `agents/war-refiner.md` §land-phase and the `workflow-template.js` land prompt. |
| D5 | Servitor on a stale-then-resolved land? | No enum change. A land that resolves after the transient returns `status:'landed'`, so the **existing** `servitorResult` gate (`landResult.status === 'landed' && memoryLocalRoot`) spawns the servitor automatically. The `servitorResult: null` forced-manual path only survives for a *genuine* divergence held for the Lead. |
| D6 | Broaden the `held:land-failed` auto-recover to the absent-origin cause? | Yes. The SKILL.md Checkpoint bullet branches on **which root cause fired**: (a) checkout collision (existing) → merge+gate+`land-advance`; (b) absent origin baseline, detected via empty `git ls-remote origin refs/heads/<working>` → `cmd_ensure_origin <working>` then `land-advance`. Both gate the same push-first CAS on a green gate. |
| D7 | Codify escalation completion as a bespoke script? | No — the resolved gate is a runtime string a shell subcommand can't own. Instead, collapse the fragile git steps (CAS land + follower sync + phantom verify) into the **single `land-advance` call** shared with D3/D6, and keep rebase-onto-integration + resolved-gate as Lead steps. The 6-step dance becomes {rebase in `_refinery`, run resolved gate, `land-advance`, detach} — the error-prone part is now one verified primitive. (Deliberate deviation from the friction's literal "helper" ask; rationale = gate-is-a-string.) |
| D8 | Split `HARD_ESCALATION_REASONS` per mode? | No (breaks the mirror + existing drift-guard). Replace the hand-written unreachability **comment** at the land-phase `.includes(landResult.status)` site with a **drift-guarded test** pinning, per mode, which reasons are reachable (`no-test`/`unpackaged` reachable only from merge-task prompts; the land-phase set is `escalate`/`audit-blocked`/`conflict`/`land_stale`/`dep-failed`/`gate-evidence`/`unrunnable-deps`). Mechanical enforcement, not prose. |
| D9 | Enforce the phase/task enum-level separation? | Add a doc-contract test that sources **both** enums fresh from `schemas.md` (task status enum + `landDecision` enum) and flags a phase-level `landDecision` token (e.g. `landed`) used in a task-level status context across `agents/*.md` + `schemas.md`. Tracks enum growth (e.g. `held:submodule-pr`) without a hardcoded literal. |

## 4. Mechanics (per component / role)

### `provision-worktrees.sh` — `cmd_land_advance` (the land primitive)
- **Phantom-land guard (D1).** After capturing `pre_push_local` and before treating a 0-exit push as success — or immediately after, guarding the success return — assert `[ "$new_sha" != "$pre_push_local" ]`. On equality, `die` with a phantom-land message ("`<new-sha>` equals the pre-push working tip — the `--no-ff` merge produced no new commit; the integration branch had nothing ahead of `<working>`; refusing to report a land that did not advance") and **exit 3** (escalate class — not reland). When `pre_push_local` is empty (first land onto a fresh branch), the guard is skipped (a genuine first advance has no prior tip; the existing ls-remote readback still confirms origin holds `new_sha`).
- **Ref reconciliation (D3)** is unchanged mechanically — the existing success path already does `git ls-remote origin refs/heads/<working>` readback (`actual == new_sha` else exit 3) and the CAS `git update-ref refs/heads/<working> <new-sha> <pre_push_local>`. The change is that *more callers now route through it* (see refiner/Lead below).
- **`cmd_ensure_origin`** is unchanged; it is now invoked from the broadened auto-recover (D6) in addition to Setup.

### `agents/war-refiner.md` §land-phase + `workflow-template.js` land prompt (reland loop, D4/D5)
- The `≤ roundLimit` push-first CAS loop gains a pre-surrender step: on the final failed attempt, run `git rev-list --left-right --count <working>...origin/<working>`. Output `0\t0` ⇒ contender-less transient ⇒ attempt one more push-first land (re-fetch, re-detach `origin/<working>`, re-merge, re-gate, `land-advance`); a nonzero **right** count ⇒ genuine divergence ⇒ return `status:"land_stale"`.
- Both surfaces updated in the same commit. The `workflow-template.js` land dispatch string (the `landDecision === 'landed'` block) and the standing `agents/war-refiner.md` step 2/3 prose must state the identical discrimination.
- **No new status or enum.** A transient that resolves returns `landed`; the existing `servitorResult` gate then spawns the wrap-up servitor with no Lead step (D5). Only a true divergence reaches the `HARD_ESCALATION_REASONS.includes('land_stale')` → `held:escalation` path.

### `skills/war/SKILL.md` — Checkpoint `held:land-failed` (D6) + escalation completion (D7)
- The `held:land-failed` auto-recover bullet is rewritten to **branch on root cause**:
  - **checkout collision** (working branch checked out in the Lead worktree, `git merge-base --is-ancestor <working> <integration>` holds) → merge `integration/<phase> --no-ff`, run the resolved gate, and on green call `provision-worktrees.sh land-advance <working> <merge-sha>` (replaces the raw `git push`).
  - **absent origin baseline** (`git ls-remote origin refs/heads/<working>` returns empty) → `provision-worktrees.sh ensure-origin <working>`, then the same merge + gate + `land-advance`.
  - every other cause (real conflict, red gate) stays a hold, unchanged.
  - Under `--afk` auto-perform; interactively offer and wait. The green-gate guard and the `baseline` carve-out are preserved verbatim.
- The escalation-completion path (the memory-documented 6-step dance) is rewritten to reuse the same primitive: {rebase the integration branch onto the working tip in `_refinery`, run the resolved gate, `land-advance <working> <merge-sha>` (this single call performs the CAS, the follower sync, and the phantom guard), detach `_refinery`}. The prose stops enumerating raw push/rev-parse/ls-remote steps.
- The opportunistic-resync bullet (ff-only, on-branch, clean-guard) is unchanged.

### Status-enum discipline (D8/D9) — tests, not prose
- **Per-mode reachability drift-guard (D8).** In `land-decision.test.mjs` (the existing owner of the `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS` drift-guard across the 4 doc surfaces + the inline mirror), add a test asserting the land-phase-reachable subset of `HARD_ESCALATION_REASONS` and that `no-test`/`unpackaged` are **not** reachable from any land-phase prompt (parsing the `workflow-template.js` land block for emitted `status:` literals). The hand-written unreachability comment at the `.includes(landResult.status)` site is removed once the test pins it.
- **Enum-level-separation doc-contract (D9).** A new test (co-located with the other doc-parity tests in `land-decision.test.mjs`, or a sibling under `skills/war/`) extracts the task status enum (`"todo"|"working"|"audited"|"merged"|"escalated"|"blocked"`) and the `landDecision` enum **fresh from `schemas.md`**, then greps `agents/*.md` + `schemas.md` for a phase-level `landDecision` token used in a task-level status-equality context (and vice-versa), failing on a leak. Sourcing from `schemas.md` makes it track future enum growth (`held:submodule-pr`, etc.) with no hardcoded literal.

## 5. Surface changes (files touched)

- `skills/war/assets/provision-worktrees.sh` — `cmd_land_advance`: phantom-land guard (D1). `cmd_ensure_origin` unchanged (new caller only).
- `skills/war/assets/workflow-template.js` — land-phase dispatch prompt: reland-loop transient discrimination (D4); remove the hand-written unreachability comment at the land-phase `HARD_ESCALATION_REASONS.includes(landResult.status)` site once D8's test pins it.
- `agents/war-refiner.md` — §land-phase steps 2–3: mirror the transient discrimination (D4), same commit as `workflow-template.js`.
- `skills/war/SKILL.md` — Checkpoint `held:land-failed` bullet (D6, root-cause branch); escalation-completion prose (D7, reuse `land-advance`).
- `skills/war/assets/provision-worktrees.test.sh` — `land-advance` phantom-land guard case (new-sha == pre-push tip ⇒ exit 3); the existing "working branch actually advanced" assertion is extended.
- `skills/war/assets/land-decision.test.mjs` — per-mode `HARD_ESCALATION_REASONS` reachability drift-guard (D8); phase/task enum-level-separation doc-contract (D9).
- `skills/war/assets/workflow-template.test.mjs` — assert the land block emits the `rev-list --left-right --count` discrimination and that a stale-then-resolved land reaches the servitor gate (D5).
- `docs/adr/` — one new ADR (see §7).
- `CONTEXT.md` — new terms (see §6).
- Release slots (four, per CLAUDE.md) — trailing version bump; literal resolved at land time.

## 6. New domain terms (CONTEXT.md)

- **Phantom land** — a land that reports `status:'landed'` while `working_sha` equals the pre-push working tip; the `--no-ff` merge produced no commit because the integration branch had nothing ahead of the working branch, so the phase's work was silently dropped. Now refused by the `land-advance` phantom-land guard (exit 3).
- **Land-truth guard** — the `cmd_land_advance` assertion set that makes a `landed` result provable against git: origin readback (`ls-remote == new_sha`) **and** actual-advance (`new_sha != pre_push_local`). A `landDecision:'landed'` is trustworthy only downstream of it.
- **Contender-less transient CAS** — a single push rejection with **no** active competing run, distinguished from a real divergence by `git rev-list --left-right --count <working>...origin/<working>` returning `0	0`; auto-retried rather than surrendered as `land_stale`.
- **Land primitive (single land chokepoint)** — `provision-worktrees.sh land-advance` as the one path every land (in-flow, auto-recover, escalation-completion) routes through, so the land-truth guard and follower reconciliation cover all of them.

## 7. Recommended ADRs

- **New ADR — "The land asserts git ground truth; a `landed` result is never self-reported."** Ratifies: `land-advance` is the single land chokepoint; a land that cannot prove the working ref advanced (phantom-land guard) holds rather than reports success; every manual land path routes through the primitive. Extends ADR 0008 (git-is-truth) onto the land path and complements ADR 0004 (never-force) and ADR 0018 (working-branch resolution/`ensure-origin`). Cross-reference ADR 0005 (no `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS` additions — this spec adds none).
- **Optional amendment to ADR 0005** — record that per-mode status-enum reachability is enforced by a drift-guarded test, not a hand-written unreachability comment (D8), keeping the shared constant single-source-of-truth.

## 8. Open risks / implementation notes

- **First-land skip on the phantom guard.** When `pre_push_local` is empty (fresh working branch, no prior tip), the phantom guard must skip — a genuine first advance has no prior sha to compare. The ls-remote readback still confirms origin holds `new_sha`. Get this carve-out right or the first phase of every run false-fails.
- **`rev-list --left-right --count` cwd.** The discrimination runs in `_refinery` (detached at `origin/<working>`); `<working>` must resolve to the local follower ref and `origin/<working>` to the freshly-fetched remote — fetch immediately before the count or the transient/divergence read is stale (mirrors the reland loop's existing re-fetch).
- **Mirror drift.** D4 touches both `agents/war-refiner.md` and `workflow-template.js`; landing one without the other silently diverges the standing vs. dispatched surfaces. The plan must make them one task (file-disjoint but same-phase, or one task editing both).
- **D9 false positives.** A doc-contract grep for `landed` in task context can trip on prose that legitimately narrates the phase land near task language (e.g. war-worker.md's "dep task's landed SHA"). The check must anchor on **status-equality / status-assignment** context, not any occurrence of the token — else it's noise. Prefer a tight anchor (token adjacent to `status`/`landDecision` equality) over a bare word match.
- **`--afk` vs. interactive** parity in the broadened auto-recover (D6): the absent-origin branch must obey the same green-gate-before-push and `--afk`-auto / interactive-offer discipline as the checkout-collision branch.
- The `land-local-follower-ref-can-lag` lesson is `[local]`/agent-unverified and partly mitigated already by `cmd_ensure_integration`'s origin-derivation; D3's contribution is closing the *manual-land bypass* of the follower CAS, not re-deriving refs the next phase already re-derives.

## 9. Non-goals / deferred

- **No new `MergeResult` status, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS` member.** Every fix reuses existing statuses (ADR 0005).
- **No bespoke escalation-completion shell script** (D7 rationale: the resolved gate is a runtime string).
- **No splitting `HARD_ESCALATION_REASONS` per mode** (D8: keep single-source-of-truth + mirror).
- **Submodule land paths** (`agents/war-refiner.md` §submodule land, 2A/2B) inherit the phantom guard automatically (they call `land-advance`), but no submodule-specific transient/divergence tuning is in scope.
- **The `held:phase-incomplete` / `held:workflow-error` retry ladder** is untouched — this spec is scoped to the land step and its enums.
- **General `ledger.json` reconciliation** (ADR 0008 class A/B/C) is untouched beyond the land path.

## 10. Validation criteria (concrete, testable)

1. **Phantom-land guard.** A `provision-worktrees.test.sh` case: seed a working branch, detach `_refinery` at its tip, run `land-advance <working> <tip-sha>` where `<tip-sha>` equals the pre-push local tip → exits **3**, prints the phantom-land die message, and leaves `refs/heads/<working>` unchanged. A companion case with a genuinely-advanced `<new-sha>` still exits 0 and advances the follower.
2. **First-land carve-out.** `land-advance <fresh-working> <sha>` with no prior `refs/heads/<fresh-working>` (empty `pre_push_local`) exits 0 (guard skipped), origin readback still enforced.
3. **Transient vs. divergence (D4).** A `workflow-template.test.mjs` assertion that the land dispatch prompt contains the `rev-list --left-right --count <working>...origin/<working>` discrimination and returns `land_stale` only on a nonzero right-side count; a `0\t0` result triggers one more push-first attempt. The same string is present in `agents/war-refiner.md` §land-phase (grep parity).
4. **Servitor on stale-then-resolved (D5).** A test that a land resolving after a transient (final `status:'landed'`) reaches the `servitorResult` dispatch (`landResult.status === 'landed' && memoryLocalRoot`) with no Lead intervention — `servitorResult` is non-null.
5. **Absent-origin auto-recover (D6).** SKILL.md Checkpoint `held:land-failed` prose branches on both root causes, names `git ls-remote origin refs/heads/<working>` as the absent-origin detector and `ensure-origin` as its recovery, and both branches end in `land-advance` on a green gate. (Prose-contract assertion + human review.)
6. **Escalation completion reuses the primitive (D7).** SKILL.md escalation-completion prose issues a single `land-advance <working> <merge-sha>` call for the CAS/sync/verify and no raw `git push`/`update-ref`/`ls-remote` steps.
7. **Per-mode enum reachability (D8).** `land-decision.test.mjs` fails if `no-test` or `unpackaged` becomes reachable from a land-phase prompt, and pins the land-phase-reachable subset. The hand-written unreachability comment is gone and the test enforces its claim.
8. **Enum-level separation (D9).** The doc-contract test sources both enums from `schemas.md` and fails on an injected phase-level `landDecision` token (`landed`) placed in a task-level status-equality context in a fixture; it passes on the current tree and does not false-trip on war-worker.md's "landed SHA" narration.
9. **No enum growth.** `git diff` shows `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` (both mirrors + all 4 doc surfaces) byte-unchanged; the existing `land-decision.test.mjs` drift-guard still passes.
10. **Mirror parity.** The reland-loop change appears in both `agents/war-refiner.md` and `workflow-template.js`, verified by the standing-vs-dispatched grep parity assertion.
11. **Full suite green.** `node --test 'skills/**/*.test.mjs'`, every `hooks`+`skills` `*.test.sh`, and `war-memory lint docs/learnings/` pass.
