# Resume precedence + reconciliation — make git the stated source of truth Implementation Plan (audit finding L2)

**Goal:** WAR advertises a "three-layer resumable source of truth" (GitHub issue labels, `ledger.json`, the Workflow
`resumeFromRunId` journal) with **no stated precedence** and **no check** that a recorded `merge_sha` is reachable on
the branch. The load-bearing fact that resolves a crash-window disagreement — **git can only *lag*, never be
*wrong***, because push-first CAS never `--force`es a shared branch, so the integration/working branches are
monotonic — is written down **nowhere**. L2 **states the precedence (git > labels > ledger)** and adds a
**Lead-run resume reconciliation pre-flight** (prose, no new code) that repairs the lagging layers *toward git* and
**halts on an unexplained commit** (closing the create-only `--owned-file` guard's resume-time gap).

**Docs-only.** No code, no new asset, no test churn (spec §8.6). Every task is `requiresTest:false`.

**Source spec:** [`docs/specs/2026-06-29-resume-precedence-reconciliation-design.md`](../specs/2026-06-29-resume-precedence-reconciliation-design.md).
**ADR:** [`0008-git-is-the-resume-source-of-truth.md`](../adr/0008-git-is-the-resume-source-of-truth.md) (**already
written + accepted**) — the **canonical precedence statement** all three doc tasks mirror. **CONTEXT.md** terms
(Resume precedence / Resume reconciliation (pre-flight)) are **already landed** — not in scope.

**Position in the stack:** L2 is **fourth** (after M3, on M3's tip), owns **v0.7.6** off the v0.7.5 baseline. L2
touches **no** `workflow-template.js`. It does touch SKILL.md and schemas.md, which M1/M2 also edit earlier in the
stack (**different sections** — see Out of scope), so L2's workers re-anchor by named construct (memory
`plan-line-number-refs-stale-use-construct-locator`).

## Build order (for `/war`)

- **Phase 1 — precedence + pre-flight prose:** T1 (SKILL.md) ∥ T2 (design.md) ∥ T3 (schemas.md). **Disjoint files,
  no inter-task dependency** — each independently mirrors **ADR-0008** as the canonical precedence source, so the
  three cannot drift on the "git > labels > ledger" claim (the parity anchor is the landed ADR, not each other).
- **Phase 2 — release:** T4 (v0.7.6).

## Operator decisions — RESOLVED (2026-06-29, grill-with-docs)

- **DP1 — Decomposition: three per-file tasks (SKILL.md / design.md / schemas.md) + release.** The operator chose
  granular per-file audits over one combined doc task. The parity risk (three surfaces stating the same precedence)
  is closed structurally: **all three mirror the already-landed ADR-0008**, not each other, so they share a single
  canonical source and can run in parallel without coupling. *Rejected:* one combined doc task (operator preferred
  granular audits); by-audience grouping.
- **DP2 — Docs-only: no code, no asset, no test (spec §8.6).** The only thing that can ever be wrong is a *lagging*
  record (git is monotonic), so resume reduces to "re-derive the lagging layers from git"; a tested `verify-resume.sh`
  is **YAGNI** until a real mid-window crash is observed to bite (ADR-0008 considered options; the pre-flight is a
  **Lead checklist, not enforced code**). All tasks `requiresTest:false`.
- **DP3 — Release: +0.0.1 → v0.7.6, implemented in order** (after M3's v0.7.5). Next free patch by construct if the
  stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — Precedence + reconciliation pre-flight (prose)

### Task 1 — SKILL.md: precedence rule + Resume A/B/C reconciliation checklist (L2, prose)

**Files:** modify `skills/war/SKILL.md` (spec §5) —
- Setup step 5 (the resume sentence, currently *"read it + open issues and continue"*): replace with the **precedence
  rule** (git branch state > GitHub issue labels > `ledger.json`) + a pointer to the reconciliation pre-flight.
- Add a short **Resume** procedure near the Checkpoint section: the **A/B/C divergence table as a Lead checklist** —
  **A (ledger ahead:** `merge_sha` unreachable → merge never landed → **trust git**, revert ledger `merged`→`audited`
  + label, re-queue, report); **B (git ahead:** branch carries work the ledger didn't mark merged → crash after push
  → **trust git**, mark merged, flip label, report); **C (unexplained:** a branch commit no ledger task claims →
  foreign/concurrent push → **HALT** to the Lead, do **not** auto-repair). Plus the landed-phase (working-branch)
  check at phase granularity. **Repair flows one-way toward git; never mutate git to match a record.**

**`requiresTest`: false.**

- [ ] **Step 1 — (no test — prose.)**
- [ ] **Step 2 — Implement (prose).** Mirror ADR-0008's precedence verbatim-in-substance; anchor by named construct
  (the resume setup step, the Checkpoint section), not line numbers (SKILL.md shifts under M1/M2 earlier in the
  stack). State A/B trust-git + C halt with the fixed dispositions.
- [ ] **Step 3 — Run the full self-discovering gate → green** (no executable surface).
- [ ] **Step 4 — Commit** — `docs(war): SKILL.md resume precedence (git > labels > ledger) + A/B/C reconciliation pre-flight checklist (L2)`
- **Closes:** validation criteria #2 (pre-flight as a Lead checklist), #3 (class C halts), #4 (one-way repair).

### Task 2 — design.md §6: precedence + ledger-as-lagging-view + journal off-ladder (L2, prose)

**Files:** modify `skills/war/references/design.md` §6 (spec §5) — state the precedence (git > labels > ledger), tag
the ledger a **lagging view**, note the `resumeFromRunId` journal is **off-ladder** (intra-phase replay cache, not a
landed-state record — a resumed phase re-runs gate + CAS, so a stale cached "merged" is caught at re-land, never
trusted), and **cross-link the reconciliation pre-flight**.

**`requiresTest`: false.**

- [ ] **Step 1 — (no test — prose.)**
- [ ] **Step 2 — Implement (prose).** Mirror ADR-0008; anchor by named construct (§6 / the "three-layer source of
  truth" passage). State the journal-off-ladder reason (resumed phase re-runs gate + CAS).
- [ ] **Step 3 — Run the full self-discovering gate → green.**
- [ ] **Step 4 — Commit** — `docs(war): design.md §6 states resume precedence + ledger lagging-view + journal off-ladder (L2)`
- **Closes:** validation criteria #1 (precedence written down), #5 (journal boundary stated).

### Task 3 — schemas.md: `merge_sha` is advisory (L2, prose)

**Files:** modify `skills/war/references/schemas.md` (spec §5) — at the `## ledger.json` block, one line noting
`merge_sha` is **advisory** — authoritative **only when reachable on the branch** (the pre-flight's invariant).

**`requiresTest`: false.**

- [ ] **Step 1 — (no test — prose.)**
- [ ] **Step 2 — Implement (prose).** Add the one advisory line at the `## ledger.json` block; anchor by named
  construct (schemas.md shifts under M1/M2's enum + Task-shape edits earlier in the stack).
- [ ] **Step 3 — Run the full self-discovering gate → green.**
- [ ] **Step 4 — Commit** — `docs(war): schemas.md notes ledger.json merge_sha is advisory — authoritative only when reachable (L2)`
- **Closes:** the schemas surface (spec §5 row); supports criterion #1.

---

## Phase 2 — Release

### Task 4 — Version bump v0.7.6 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.7.5"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.5` → `0.7.6`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four
  by hand). Next free patch by construct if the stack order shifts. Status copy: resume precedence stated
  (git > labels > ledger) + Lead-run reconciliation pre-flight (A/B trust-git, C halts).
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.6 — resume precedence + reconciliation pre-flight (L2)`

---

## Test plan

**No automated tests** (DP2, spec §8.6) — the diff touches only `*.md` (SKILL/design/schemas) + the four release
slots; no `.mjs/.js`, no new asset. **Gate** = the full self-discovering multi-runner, which must stay **green**
(proving the doc edits broke nothing):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Validation criteria (spec §8), all prose-verified by review:** #1 precedence written down (T1+T2) · #2 pre-flight
as a Lead checklist (T1) · #3 class C halts, no auto-repair of an unexplained commit (T1) · #4 repair is one-way
toward git (T1) · #5 journal boundary stated (T2) · #6 no code changed — diff is `*.md` only (all tasks).

## Recommended ADRs

**None new.** [`ADR-0008 — git is the resume source of truth`](../adr/0008-git-is-the-resume-source-of-truth.md) is
**already written + accepted** (it cleared the bar: surprising — "three-layer source of truth" reads as three
co-equal authorities; real trade-off — the rejected transactional-ledger alternative; moderately hard to reverse —
the "git wins, ledger advisory" stance shapes every future resume). This plan implements its consequences; no further
ADR.

## Out of scope / Deferred

- **No tested `verify-resume.sh` gate, no transactional `ledger.json`** — both rejected in ADR-0008 (YAGNI / against
  the architecture). The pre-flight is a **Lead checklist**, not enforced code; git's monotonicity is the real safety
  net. Deferred until a real mid-window crash is observed to bite.
- **The `resumeFromRunId` journal stays off-ladder** — no reconciliation logic is defined for it (a resumed phase
  re-runs gate + CAS).
- **Same-file across the stack (re-anchor by construct):** SKILL.md is also edited by **M1** (Checkpoint dead-phase
  classification + return-contract line) and **M2** (decompose `requiresTest`); schemas.md by **M1** (landDecision
  enum) and **M2** (Task shape + `MergeResult.status`). L2's edits are to **different sections** (resume setup step +
  Resume checklist; the `## ledger.json` block), so they are additive — but L2 lands **fourth**, so its workers
  re-anchor on the post-M1/M2/M3 tip by named construct, expecting line shifts (memory
  `plan-line-number-refs-stale-use-construct-locator`). L2 touches no `workflow-template.js`.
- **No GitHub issue filed** — plan-docs only; finding id is the audit's **L2**.

## Coverage

| Finding | Coverage |
|---|---|
| **L2** | **full (docs)** — precedence (git > labels > ledger) stated in SKILL.md (T1) + design.md §6 (T2); the A/B/C reconciliation pre-flight as a Lead checklist with C-halts + one-way repair (T1); `merge_sha` tagged advisory in schemas.md (T3); journal marked off-ladder (T2). ADR-0008 + CONTEXT terms already landed. No code by design (spec §8.6). |
