# Resume precedence + reconciliation — make git the stated source of truth across the three resume layers

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding L2), resolved by grilling

WAR advertises a **three-layer resumable source of truth** ([`design.md:17`](../../skills/war/references/design.md#L17), [`:35`](../../skills/war/references/design.md#L35), [`:58-62`](../../skills/war/references/design.md#L58)): GitHub issue labels, `ledger.json`, and the Workflow `resumeFromRunId` journal. These three are written by **different actors at different moments** — labels by the Lead's `gh` calls, `ledger.json` by Lead prose (**no `.mjs/.js` reads or writes it** — only the unrelated `ownedFile` branch-ref ledger is code-consumed), the journal by the runtime — and the resume sentence ([`SKILL.md:23`](../../skills/war/SKILL.md#L23)) says only *"read it + open issues and continue."* There is **no stated precedence** for when the layers disagree and **no check** that a `merge_sha` recorded in the ledger is actually reachable on the branch.

The crash window: the refiner pushes a merge → **[crash]** → the Lead never flips the label or updates the ledger. The branch is now ahead of both other layers. The load-bearing fact that resolves this — **git can only *lag*, never be *wrong***, because push-first CAS never `--force`es a shared branch ([`SKILL.md:53`](../../skills/war/SKILL.md#L53)) so the integration/working branches are monotonic — is written down **nowhere**.

This spec **states the precedence (git > labels > ledger)** and adds a **Lead-run resume reconciliation pre-flight** (prose, no new code) that repairs the lagging layers toward git and halts on an unexplained commit.

## 1. Grounding (verified on this branch)

- **`ledger.json` is Lead prose, not a transactional log.** `rg` over `skills/war/**/*.{mjs,js}` finds only `ownedFile` (the `--owned-file` branch-ref ledger, a *separate* artifact at [`workflow-template.js:86`](../../skills/war/assets/workflow-template.js#L86)) — **no code reads or writes `ledger.json`**. Its schema ([`schemas.md`](../../skills/war/references/schemas.md), `## ledger.json`) is descriptive only; the per-task `merge_sha?` field is recorded by the Lead, validated by nothing.
- **Git is already the de-facto truth.** The refiner owns all merges, one at a time, **never `--force`/`reset --hard` on shared branches** ([`SKILL.md:53`](../../skills/war/SKILL.md#L53)); landing is a push-first CAS ([`design.md:80`](../../skills/war/references/design.md#L80)). So a recorded merge is real **iff** its SHA is reachable on the branch — the branch cannot record a merge that did not happen, nor un-record one that did.
- **The ownership guard is create-only.** `ensure-integration` enforces `--owned-file` at branch **create**, not at resume/teardown (project memory: `provision-ownership-ledger-gates-create-not-teardown`). So a foreign/concurrent commit appearing on a resumed integration branch is a **genuine blind spot** today.
- **The journal is a different mechanism.** `resumeFromRunId` replays completed `agent()` results so a resumed phase does not re-spawn finished work (M1's bounded auto-resume uses it). It records *intra-phase progress*, not *landed cross-phase state* — it is not a peer of labels/ledger.

## 2. Decision

1. **State the precedence** for the durable cross-phase layers: **git branch state > GitHub issue labels > `ledger.json`.** Git wins because it is monotonic under push-first CAS; labels beat the ledger because they are remote-durable and human-visible (they survive a local wipe); the ledger is richest but weakest — local, uncommitted, a **lagging view**.
2. **Add a resume reconciliation pre-flight** the Lead runs before continuing (read-only git; no new code, no new asset). It cross-checks every ledger-recorded `merge_sha` against the branch, repairs the ledger + labels **toward git**, and **halts on an unexplained commit**.
3. **Draw a boundary around the journal.** The precedence ladder governs only git/labels/ledger. The `resumeFromRunId` journal is an intra-phase replay cache and is **explicitly not authoritative for landed state** — a resumed phase re-runs the gate and the push-first CAS, so a stale cached "merged" is caught at re-land, never trusted. No reconciliation logic is defined for it.

**Why prose, not a tested verifier:** the only thing that can ever be wrong is a *lagging* record (git is monotonic), so resume reduces to "re-derive the lagging layers from git." A machine-checkable SHA file emitted by the Workflow is **YAGNI** until a real mid-window crash is observed to bite. (Per the audit's own minimal-rec instinct, and ponytail rung 1: the lazy fix that holds.)

## 3. The precedence ladder

| Rank | Layer | Authority | Why this rank |
|---|---|---|---|
| 1 | **git branch state** (integration + working branches) | **Authoritative** | Push-first CAS never `--force`es → branches are monotonic; a merge is real iff its SHA is reachable. |
| 2 | **GitHub issue labels** (`status:*`) | Durable record | Remote, human-visible, survive a local wipe — but written by the Lead *after* the merge, so they can lag. |
| 3 | **`ledger.json`** | Advisory / lagging view | Local, uncommitted, richest detail (SHAs, verdicts, worktree map) but no code writes or validates it. |
| — | Workflow `resumeFromRunId` journal | **Off-ladder** | Intra-phase replay cache, not a landed-state record; a resumed phase re-runs gate + CAS, so it is never trusted for "did this land." |

**On any disagreement, repair flows toward git — never mutate git to match a record.**

## 4. The resume reconciliation pre-flight

A read-only procedure the Lead runs for the current/most-recent phase's integration branch (and the working branch for landed phases) before resuming work. Three divergence classes, each with a fixed disposition:

| Class | Condition | Disposition |
|---|---|---|
| **A — ledger ahead** | Ledger marks a task `merged` (has `merge_sha`) but `git merge-base --is-ancestor <merge_sha> <integration_branch>` fails (SHA not reachable). | The merge never landed. **Trust git:** revert the task's ledger status (`merged`→`audited`) + label, re-enter it into the refine queue. **Report.** |
| **B — git ahead** | A commit reachable on the branch maps to a ledger task (by recorded branch/SHA) the ledger does **not** mark `merged`. | Crash hit *after* the push. **Trust git:** mark the task `merged` with that SHA, flip the label. **Report.** |
| **C — unexplained** | A commit reachable on the branch maps to **no** ledger task. | Foreign/concurrent push (the create-only `--owned-file` guard's concern, resurfacing at resume). **HALT** and surface to the Lead for a decision. **Do not auto-repair** — trusting git is only sound for commits this run authored. |

The pre-flight emits a short **reconciliation report**: what it repaired (A/B) and any halt (C). A/B repairs are silent state corrections toward git; C is the only class that blocks. The whole pass is read-only git (`merge-base --is-ancestor`, `rev-list`, `branch --contains`) — safe for the Lead to run at any resume.

**Landed-phase check (working branch):** each phase lands as one `--no-ff` commit ([`SKILL.md:37`](../../skills/war/SKILL.md#L37)); the pre-flight verifies that commit is present on the working branch **iff** the ledger marks the phase `landed` (same A/B/C logic at phase granularity).

## 5. Surface changes

Documentation only — no code, no new asset.

| File | Change |
|---|---|
| [`skills/war/SKILL.md`](../../skills/war/SKILL.md) | Setup step 5 ([`:23`](../../skills/war/SKILL.md#L23)): replace *"read it + open issues and continue"* with the precedence rule + a pointer to the reconciliation pre-flight. Add a short **Resume** procedure (the A/B/C table as a Lead checklist) near the Checkpoint section. |
| [`skills/war/references/design.md`](../../skills/war/references/design.md) | §6 ([`:58-62`](../../skills/war/references/design.md#L58)): state the precedence (git > labels > ledger), tag the ledger as a *lagging view*, and note the journal is off-ladder (intra-phase replay, not landed-state). Cross-link the pre-flight. |
| [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) | At the `## ledger.json` block: one line noting `merge_sha` is *advisory* — authoritative only when reachable on the branch (the pre-flight's invariant). |
| `CONTEXT.md` | Add the two glossary terms in §6 below. |
| [`docs/adr/0008-git-is-the-resume-source-of-truth.md`](../adr/0008-git-is-the-resume-source-of-truth.md) | New ADR (§7) — **written.** |

## 6. New domain terms (for CONTEXT.md)

- **Resume precedence**: the ordering **git branch state > GitHub issue labels > `ledger.json`** that decides which layer wins when the three resume records disagree. Git wins because push-first CAS makes the shared branches monotonic, so a recorded merge is real iff its SHA is reachable. _Avoid_: treating the "three-layer source of truth" as three co-equal authorities — only git is authoritative; labels and the ledger are durable/advisory records that can lag.
- **Resume reconciliation (pre-flight)**: the read-only cross-check a resuming Lead runs before continuing — verifies each ledger-recorded `merge_sha` is reachable on its branch, repairs the ledger + labels *toward git*, and **halts on an unexplained (foreign) commit** rather than absorbing it. _Avoid_: editing git to match a stale record, or auto-trusting a commit no ledger task claims.

## 7. ADR (written)

This **warrants an ADR** — [`0008-git-is-the-resume-source-of-truth.md`](../adr/0008-git-is-the-resume-source-of-truth.md). It clears the domain-modeling bar:

- **Surprising without context** — "three-layer source of truth" reads as three co-equal authorities; the decision is that only **git** is authoritative and the other two are lagging records. A future reader will wonder why the ledger is treated as disposable.
- **A real trade-off** — the considered alternative (make `ledger.json` transactional: a single code writer + validator so it can't drift) was **rejected** as YAGNI and against the architecture (the Lead orchestrates, it does not write code; the ledger is its notebook, not a database). Git's CAS-monotonicity already provides the durability the transactional ledger would buy.
- **Moderately hard to reverse** — the stance "git wins, ledger is advisory" shapes every future resume/recovery decision; flipping to an authoritative ledger later is a real re-architecture.

The ADR records: *git is the de-facto source of truth; labels and the ledger are durable/advisory lagging views; resume reconciles toward git and halts on a foreign commit; the Workflow journal is an off-ladder intra-phase cache.*

## 8. Validation criteria

1. **Precedence is written down.** `SKILL.md` and `design.md` §6 both state git > labels > ledger, and tag the ledger as a lagging view.
2. **The pre-flight is specified as a Lead checklist.** The A/B/C table appears in `SKILL.md` with the fixed dispositions (trust git on A/B, halt on C).
3. **Class C halts.** The procedure explicitly does **not** auto-repair an unexplained commit — it surfaces to the Lead (closing the create-only ownership-guard gap at resume).
4. **Repair direction is one-way.** No step mutates git to match a record; every repair rewrites a label/ledger entry toward git.
5. **Journal boundary stated.** `design.md` §6 marks the `resumeFromRunId` journal off-ladder, with the reason (resumed phase re-runs gate + CAS).
6. **No code changed.** The diff touches only `*.md` (SKILL/design/schemas/CONTEXT/ADR); no `.mjs/.js`, no new asset, no test churn.
