# Red-team report — github-issue-lifecycle-and-run-bookkeeping-mechanization

**Plan:** `docs/plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md`
**Source spec:** `docs/specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md`
**Date:** 2026-07-09 · **Baseline:** `dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization` @ `f6da10c` (= origin/master; plans 1–3 landed)
**Verdict:** **CLEARED** (round 3) · self-adjudicated under AFK (campaign 2026-07-08-memory-frictions).

## Attack surface
6 spine lenses + 9 bespoke probes (round 1) proving the plan's concrete premises in throwaway sandboxes; 2 drift-guard spine probes vacuous (plan touches no inline `workflow-template.js` mirror and flips no existing default — the `ghUser` knob is a new null-shipping override, not a flip); backstop-legitimacy check run over the 4 declared entries.

## Executed proof
- **Round 1** (15 probes): 11 pass / 4 warn / 0 fail; all on-target, 0 dropped. Verdict BLOCKED (1 Major + 2 needsDecision + 1 Minor).
- **Round 2** (10 probes): the tsv-invariant, backstop-legitimacy, handle-scope patches CLEARED; a deeper CONFIRMED Major surfaced (per-phase mirror site) + a Minor ordinal slip.
- **Round 3** (7 probes): 7 pass / 0 findings → **CLEARED**.

Every factual-premise probe passed: ledger schema `epic_issue`/`tasks[].issue` fields present; `war-config.mjs` `DEFAULTS.overrides` + `KNOWN_OVERRIDES` + per-key validation idiom present; `assert-*-in-diff.sh` family uses the 0/1/2 exit contract with the `die` idiom; the stranded-remote learning records ref *families* with an inconsistent count (25 vs 26); `skills/aftermath/SKILL.md` Class-1 reasoning + tip-reachable+PR-merged deletion gate present; `skills/war/SKILL.md` Decompose/Per-phase/Checkpoint/Finish constructs present; spec §4.5 states the snap recipe (no `docs/learnings` copy); ADR 0026/0027 free, four release slots all at 0.14.17 (next 0.14.18).

## Findings & resolutions applied (all patched on dev/slug-4)
1. **[Major] Preflight batch-site under-coverage.** Spec §4.1 enumerates every gh-write batch (Decompose file-epics, per-phase sub-issues, per-phase *mirror*/update, Checkpoint close, Finish PR, aftermath close); the plan wired preflight into only Decompose + Checkpoint, and backstop #2 promised red-team checks *all* sites. Round 2 further isolated that spec site 3's *mirror* half lives at `skills/war/SKILL.md ## Per phase` (executes **before** the `## Checkpoint` floor, so the floor's embedded preflight cannot guard it). **Fix:** Task 1.4 + end-state 9 now name `gh-preflight.sh` before every gh-write site keyed by named construct — Decompose, **Per-phase update+mirror**, Checkpoint close, Finish PR — and Task 1.5 names it before the aftermath issue-close batch. Backstop #2 now verifies a state the tasks create.
2. **[needsDecision] `claude/*` refs vs the `landed_pr` invariant.** The two `claude/*` session remotes are recorded as having no per-branch merged PR, contradicting "every row carries a landed_pr". **Fix:** end-state 6 + Task 1.5 relax the invariant to *`landed_pr` populated **or** a `note` documenting a genuinely PR-less stranded ref* (sentinel `landed_pr` = `-`); also recorded the execution reality that all 26 recorded refs are already deleted from origin (`git ls-remote` = 0), so the seed legitimately resolves empty — the committed file + consultation mechanism are the deliverable, not a row count.
3. **[needsDecision] Backstop (c) named a non-existent runner.** "ledger schema validation" — no run-`ledger.json` validator exists (the schema block constrains only present-entry shape; `campaign-ledger.test.mjs` is a different, campaign-scope ledger). **Fix:** relabeled as an *accepted limitation, not a mechanically-validated deferral*, runner = human ledger review at Decompose + the ADR 0026 doctrine note; no claim of mechanical validation.
4. **[Minor] End-state 8 over-broad.** "No committed file contains the handle" is false — `Ljferrer` is the pre-existing public author identity in plugin.json/marketplace.json/README. **Fix:** re-scoped to spec criterion 12 — the *new* gh-auth artifacts + the `war-config` default only, explicitly excluding the public author identity; never a blanket repo grep.
5. **[Minor] Ordinal labeling** ("fifth" applied to two different batches). **Fix:** relabeled by named construct, no ordinals.

## Residual risk
None blocking. The 4 declared backstops are all legitimate post-fix (justified deferral, named runner + timing): live allowlist suppression (first `/aftermath` run + `/red-team`), preflight-before-every-batch prose discipline (`/red-team` prose check + first live run), the accepted unrecorded-task limitation (human Decompose review + ADR note), and `snap-shared-docs` against a real stacked conflict (next campaign stacking event). All `source: plan`, operator-ratified — none AI-declared.
