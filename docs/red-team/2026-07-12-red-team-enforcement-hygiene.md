# Red-team report — red-team-enforcement-hygiene

**Plan:** `docs/plans/2026-07-12-red-team-enforcement-hygiene.md`
**Source spec:** `docs/specs/2026-07-12-red-team-enforcement-hygiene-design.md`
**Run:** Workflow `wf_2655c926-085` (session-opus). Base: `4850e67` (detached worktree `redteam-p6`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED-WITH-NOTES**

- Blockers **0** · needsDecision **0** · Minors **3**. Coverage whole (7/7 on-target, 0 fail / 5 pass / 2 warn, 0 dropped). Escape guard clean.

## Baseline-repro (executed) — PASS

All three targeted bugs proven real and unstarted at `4850e67`:
1. `red-team-gate.mjs` `classify()` force-promotes a severity-less env-gap note on a non-pass probe to `needsDecision:true` (blocks) — the trap the plan removes (`f.probeStatus !== 'pass' ? { ...f, needsDecision: true }`, ~line 118).
2. `grep -c 'discarded as a non-defect' workflow-scaffold.js` = 1 (the CONTRACTS wording reworded by #808).
3. `assert-no-repo-escape.sh` `die()` default = `${2:-1}` (escape code), line 40 — the #812 fix flips it to `${2:-2}`.

## Spine lenses

claims-vs-reality **pass** · coverage-vs-source **pass** · dependency-feasibility **pass** · intent-vs-plan **pass** (Minor: AI-Commander's Intent machine-authored — 9 End-states individually checkable + task-mapped; human upgrade `/war-strategy`). executable-proof **warn** / consistency-placeholders **warn** — both flag the same relates-link count Minor (below).

## Resolution applied (plan patched → commit `bcb7b5c`)

**Minor (2 probes concurring): inbound-link count wrong.** The plan (End-state 7 + Task 1.3) said the tracking lesson is kept because of "`relates:` links from three lessons." Verified real count: **5** total inbound refs (4 hot + 1 archived) — **2** via `relates:` frontmatter (`pass-probe-demotion-gate-layer-without-probe-contract` hot + `archive/run-provision-config-not-yet-mirrored-into-template`), **3** via body `[[wikilinks]]` (`scope-hook-blind-to-bash-write-path`, `redteam-claims-vs-reality-misfires-on-impl-plans`, `redteam-executed-probe-cwd-reset-hits-real-remote`). Reworded both surfaces to drop the rot-prone count and name both link kinds; the load-bearing keep-the-file-and-slug instruction is unchanged (and correct regardless of count).

## Drift-guards (Lead-run)

- `unguarded-new-mirror` — the plan's both-surfaces mirror (dispatched `provisionDirective` string ↔ standing `lenses.md` bullet) is **self-guarded**: End-state 2 ships a region-scoped presence-pair lock in `workflow-scaffold.test.mjs` (the ±320-char-window pattern) asserting both surfaces carry the load-bearing `envGap: true` clauses, not just the token. No unguarded mirror. (No new `workflow-template.js` mirror — this plan touches red-team assets only.)
- `default-flip-old-absent` — Task 1.2 flips a one-line shell default (`${2:-1}`→`${2:-2}`), guarded by a source-level `${2:-2}` lock **and** a standing negative call-site lock (every `die "` call site must carry an explicit exit code). Not a doc-surface default flip; adequately guarded.
- `ff-topology` — N/A (no per-task merge-commit topology anchors; the "±320-char-window" is a reused test pattern).

## Backstops (2 AI-declared + 3 argued no-backstop residuals — all legitimate)

- Live-run confirmation of the env-gap note's full path (agent stamps `envGap:true` → gate demotes → not BLOCKED) · runner: next /red-team run against a provisioned repo · covered by `classify()` unit tests + prompt-surface locks.
- Behavioral exercise of the `die()` default · deferred as impossible-without-planting-the-hazard · source-level `${2:-2}` + call-site locks stand in.
- No-backstop residuals (flag omission = safe failure direction; stale scaffold copies = throwaway-by-design; paraphrase rot beyond the region lock = ordinary doc-sweep class) — well-argued, accepted.

Each AI-declared entry carries its operator-attention marker (ADR 0014).

## Residual risk

AI-Commander's Intent un-ratified by operator (human upgrade: `/war-strategy <plan>`).
