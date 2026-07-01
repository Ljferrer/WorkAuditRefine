# Red-team report — Submodule + servitor hygiene sweep (#333 #279 #282 #294 #296 #300 #303 #307)

**Plan:** [`docs/plans/2026-07-01-submodule-servitor-hygiene-sweep.md`](../plans/2026-07-01-submodule-servitor-hygiene-sweep.md)
**Source spec:** [`docs/specs/2026-07-01-submodule-servitor-hygiene-sweep-design.md`](../specs/2026-07-01-submodule-servitor-hygiene-sweep-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.11 (landOrder 11, LAST) · **Stacked base:** Plan 10 tip `1583dbf` (v0.8.10) · **Closes:** #333/#279/#282/#294/#296/#300/#303/#307

## Verdict: **CLEARED** (gate: CLEARED-WITH-NOTES; notes fixed @ `c6882a7`)

The one load-bearing part — **T4 dropping the inert `landedShas` engine threading (#300)** — is confirmed **behavior-neutral**; the rest is comment/prose/test-isolation hygiene. `0` blockers, `0` needsDecision.

## The load-bearing probe: `verify-inert-landedShas-T4` — **PASS**

Enumerated every `landedShas` use in `workflow-template.js`: declared L102, **produced** per-phase in the refine loop (`landedShas.set(r.task.id, mr.integration_sha)`, L529), and **consumed** only at L302 (gitlink-bump dispatch: `landedShas.get(depSubmodTask.id) || '<dep-submodule-landed-sha>'`). The dep submodule task is in a **prior phase**, so at the current phase's dispatch the per-phase map never holds `depSubmodTask.id` → the read is cross-phase-**empty** → falls back to the placeholder → resolved from the ledger (war-worker.md T7). No intra-phase load-bearing consumer. Dropping it changes no observable behavior (matches memory `in-memory-landed-shas-inert-for-cross-phase-bump`). `anchor-T1-guard-arms`, `anchor-T2-T3-prose`, `baseline-gate-green` all **pass**.

## Notes (all fixed @ `c6882a7`)

| Probe(s) | Note | Fix |
|---|---|---|
| claims-vs-reality / executable-proof / consistency | **provision.mjs path wrong** — Files bullet cited `skills/war/assets/provision.mjs` (dead link); actual is `skills/_shared/provision.mjs` (regex `/^\s*path\s*=\s*(.+)$/` at ~L39). | Corrected path in the Files bullet. |
| executable-proof (Minor) / dependency | **#296 locator wrong** — plan said `§4.3`, but SKILL.md has no §4.3; the text is at L87 in `## Checkpoint`: "…(`held:submodule-pr` sub-procedure **below**)", and the sub-procedure is actually **above** (in `## Resume`, L69). | Re-anchored to `## Checkpoint`, quoted the real text, kept the drop-"below" fix. |
| dependency (ND) | **#303 placeholder scope incomplete** — the `<submodule-remote>`/`<submodule_remote>` placeholder in `gh pr` examples also lives in SKILL.md L71 and schemas.md L219, not just war-refiner.md → #303 would remain partially open. | Expanded #303-1 to SKILL.md (T3) + added Step 2b to align schemas.md L219 (T2, its owner). |
| dependency (ND) | **targetRepo note anchor ambiguous** (T2 Step 2). | Anchored to the `targetRepo?:` field line (~schemas.md L73). |

## Coverage summary

`{ probes: 9, executed: 2, analyzed: 7, pass: 5, fail: 3, warn: 1, onTarget: 9, offTarget: [], dropped: [] }` — coverage whole; `0` blockers, `0` needsDecision. The failing spine probes carried only doc-path/locator/scope notes (all fixed); the load-bearing T4 verify-inert + baseline + anchors passed. Lead-adjudicated to **CLEARED**.
