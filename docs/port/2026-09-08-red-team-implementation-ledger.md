# Red-team implementation ledger

## Contract and boundary

Original, unamended input: [plan](../plans/2026-09-08-codex-red-team-migration.md), imported from `46aef4a25b68874bff7b3b3fed14f9058c270da7` in `5b442a28`.
Plan SHA-256: `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`.
Freshly fetched base: `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5` (`origin/codex-port`), unchanged from handoff. Isolated branch `codex/red-team-implementation`; existing checkouts preserved.
Phase 1 starting commit: `5b442a28`. Phase 2 starting commit: pending.
No exposure to Claude red-team findings, amended plan, or earlier incorrect handoff. Historical #2097 describes other campaigns and is authorized evidence, not this withheld review.

Scope: Phases 1–2, open PR onto codex-port, local relocatable artifact and install handoff. No installation, independent review, Phase 3, merge, release, or issue comment.
Snipe profile explicitly selected by operator: `gpt-5.6-sol / medium` (configured identity, not independently observed identity). Raw args follow the direct request: `4 correctness,plan-faithfulness,auto`; the handoff additionally names simplicity, so use `4 correctness,simplicity,plan-faithfulness,auto` to satisfy its full roster. Up to three panels per phase plus one shared reserve, seven maximum; incomplete panels count.

## Evidence intake

Read full original plan and #2097 historical body/comments; [original snapshot](red-team-implementation-evidence/issue-2097.json), [metadata](red-team-implementation-evidence/issue-2097.metadata.json). Snapshot hash verified: `b0f8f558f764e37f97f5266802cd34e9fea1e2f794b21e218e18fabcb026124c`. Linked external code, transcripts and reports remain unread; historical narratives are not independently reproduced evidence. Read repository CLAUDE.md and the named finding-class lesson. No AGENTS.md found in the baseline inventory; user-provided global rules apply.
Profile catalog discovery succeeded before any panel; it is not an audit invocation. Timing/token/billed cost data for setup not measured.

## Declared hypotheses before implementation

| ID | Departure / prediction | Discriminating test | Status |
|---|---|---|---|
| H1 | Role-timed sibling/consumer prompts will expose omitted relevant obligations while preserving intentionally different siblings. | Omitted sibling and intentionally different sibling scenarios; delivery checks separately from actual behavior. | pending |
| H2 | Complete intake with explicit operator-comment precedence prevents body-only contradiction. | Body/comment conflict, unchanged control, unavailable comments, unlisted artifact. | pending; evidence module delegated file-disjoint |
| H3 | Repair guidance sweeps design/tasks/end states/commands/backstops and paraphrases, preventing same-patch contradictions. | Cross-surface obligation scenario, with independent expected violations. | pending |
| H4 | Triggered references can reduce entrypoint load without losing role obligations. | Full delivered-content checks and separate behavior evidence; structure alone does not prove comprehension. | pending |
| R1 | Adapter-owned coordinator can reuse canonical gate and current process/discovery helpers while isolating executed proofs in independent temporary repositories. No shared engine change needed. | Known-clean/seeded-defect, dead/off-target/no-op results, target and linked metadata isolation, finite failure fixtures. | pending |

## Chronology

- Setup: fetched the named refs, created isolated worktree, verified original hashes, committed only original plan. No remote advancement to reconcile.
- Phase 1 implementation begins. Main owns runtime and ledger; evidence subagent owns only evidence module/tests. No code commits or panel invocations yet.

## Panel accounting and residuals

Phase 1: 0/3. Phase 2: 0/3. Reserve: 0/1. Total: 0/7.
No findings yet; no severity reclassification, reversals or oscillations to report. All acceptance, package and host observations pending. B1 installed observation/independent Codex attempt and B2 alignment remain deferred. Claude Step-0 completion is operator-supplied; its findings remain withheld.

### R1 refinement before code

Inspecting the maintained escape guard and archived sandbox-ref incident confirms linked worktrees share refs. Use `git clone --no-hardlinks` with a detached pinned revision and no remote in each attempt, rather than archive extraction: this retains history needed by topology probes while giving every attempt independent metadata. Reject escaping symlinks; unavailable submodules remain explicit coverage gaps. Analysis also uses isolated copies. The adapter records before/after target state without deleting or rebaselining foreign changes. This replaces the canonical shell guard's remote-read and cleanup mechanics, while retaining diagnostic-vs-defect separation. Test with a linked-worktree target and synthetic probe-created refs.

### Phase 1 coding wave / pre-panel observations

- Implemented runtime, evidence intake, role guidance and tests. No shared canonical code changed; gate/discovery/process helpers are imported for reuse. Capacity is explicitly sequential (1); bounded requests allow at most 32 selected probes, retries 0–2, finite per-attempt timeout, and Lead-controlled round limit. These are declared local mechanism choices, not shared defaults.
- First acceptance attempt failed at module import: the canonical gate relative import climbed one directory too far. [Raw failure](red-team-implementation-evidence/p1-initial-import-failure.log). Corrected the import; sibling package rewrite remains Phase 2 work. No tests ran in that failed attempt.
- Follow-up counterexample exposed environment-gap laundering through a later canonical gate computation. [Observed red](red-team-implementation-evidence/p1-gap-repipe-red.log). The runtime now retains source/environment/escape gaps as dropped diagnostic markers in the complete gate input; working-copy re-pipes cannot erase them. Canonical gate itself remains unchanged.
- [Phase 1 acceptance](red-team-implementation-evidence/p1-acceptance-before-panel-1.log): 47 passed, 0 failed/skipped, ~16.8 seconds on Node 24.17.0. Includes real child-process transport timeout/cancellation/no-op/malformed cases, independent linked-worktree metadata, foreign-state preservation, seeded blocker plus fresh confirmation, lost confirmations, source-gap repipe and evidence stream cancellation.
- H1/H3 scenario oracles demonstrate the planted omission/cross-surface contradiction and legitimate controls. H4 fake-dispatch capture proves the complete probing reference reaches both roles and excludes Lead repair authority. H2 fixtures preserve full issue/comment evidence and precedence, with pagination/unavailable/unlisted-artifact controls. These are offline evidence, not actual model comprehension; H1–H4 behavioral effect remains pending, with no causal cost/round claim.
- Skill validator attempted by guidance worker on system Python; unavailable because PyYAML is missing. No dependency installed. Structure acceptance passed; official validator remains a named pending check.
- No reversals of operator policy, no audit findings yet. Known live-host/installed observations remain deferred. Process-helper cleanup contract inspected; uncertainty retains the owned root and yields incomplete output, without retrying denied cleanup.
