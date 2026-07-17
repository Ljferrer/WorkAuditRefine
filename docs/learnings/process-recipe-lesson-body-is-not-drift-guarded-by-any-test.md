---
name: process-recipe-lesson-body-is-not-drift-guarded-by-any-test
description: "Lesson raw-command recipes rot when the land path changes"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - memory lesson decay
    - stale recipe
    - held-escalation
    - land-advance
    - force-with-lease
    - no drift guard
    - manual completion
    - doc rot in learnings
  provenance: agent-unverified
  slug: process-recipe-lesson-body-is-not-drift-guarded-by-any-test
  phase: land-path-integrity-and-status-enum-discipline/t1.3
  tags: 
    - memory-system
    - land-path
    - doc-rot
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

A repo-root memory lesson (`docs/learnings/*.md`) whose body is a hand-authored *operational recipe* — a numbered list of literal git commands for a Lead to run manually (e.g. [[held-escalation-lead-manual-completion]]'s old step 5: raw `git push ... --force-with-lease=...`) — is exactly the kind of prose that goes stale the moment the underlying mechanism is refactored to a single primitive, and **nothing catches it automatically**: it is not source code, so no drift-guard test, floor, or grep-parity check binds it (unlike `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS`, which are protected by hand-mirrored drift-guard tests per this repo's CLAUDE.md). The only backstop is a human/red-team prose-contract review at the time of the refactor.

This phase's Commander's Intent explicitly named the fix for this exact case: when `cmd_land_advance` became the one primitive for every land call site (in-flow, auto-recover, escalation-completion), the intent required the escalation-completion recipe in the memory lesson to be rewritten onto the same detach-at-origin + `merge --no-ff` + `land-advance` topology, with **no** raw `git push`/`update-ref`/`ls-remote`/`--force-with-lease` step left in the prose. The audit for the task that did this rewrite flagged (Nit, disposition `note`) that even the surrounding **"Why" narration** kept a past-tense mention of the old dance — teaching narration describing a retired approach is fine, but it is a live trip-hazard for anyone naively grepping the lesson file for the retired token, since no automated absence guard binds this file (matching the recurring pattern in [[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]]).

**Verification note:** I could not independently confirm the post-rewrite content of `docs/learnings/held-escalation-lead-manual-completion.md` in this write — both checkouts available to me (`.claude/worktrees/nice-visvesvaraya-cabb53` and the main repo root) are on branches that predate `dev/2026-07-08-land-path-integrity-and-status-enum-discipline` and still show the OLD raw-`--force-with-lease` step 5 verbatim. This is consistent with known worktree-staleness (per [[audit-worktree-pre-impl-tip-stale-verdict]]) rather than a real defect, but it means: **before trusting or further editing that lesson's recipe, re-Read it on the actual landed working branch first** — do not assume either local checkout reflects the phase's outcome. Tagged `agent-unverified` for that reason.

**How to apply:** whenever a plan/phase changes a land, merge, or escalation mechanism, grep `docs/learnings/` for literal command tokens the old mechanism used (`git push`, `force-with-lease`, `update-ref`, `rebase`, etc.) as part of the retired-token sweep (mechanized 2026-07-16, #930) — memory lesson bodies are a doc surface just like SKILL.md/CONTEXT.md/ADRs, but with zero structural enforcement.

**Mechanized (#930, 2026-07-16):** the manual backstop this lesson's "How to apply" paragraph could only describe as a human recipe is now mechanized as the retired-token sweep clause under `## Per phase (in DAG order)` in `skills/war/SKILL.md`, backed by its `doc-contract:` guard in `skills/war/assets/war-config.test.mjs` (*both defined-but-not-yet-emitted; produced in Task 1.1, same phase*). The clause runs two hot-only nets (a tip-true grep of both memory roots as a completeness floor, then a fully-flagged ranked `war-memory` query plus a bounded hand-scan) at every landed phase close, adjudicates every hit load-bearing vs exempt, routes repo-root load-bearing hits to one dedup-checked consolidated `war-followup` issue, and writes a mandatory record line. Deliberately worded as a mechanization note rather than a resolved marker: the trigger is still a Lead judgment call that can misjudge the no-trigger `n/a` case, so the warning above stays live.

Related: [[held-escalation-lead-manual-completion]], [[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]], [[default-flip-must-audit-all-doc-surfaces]], [[source-comment-lags-emitted-prompt-after-rewrite]].
