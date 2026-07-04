# Red-team — Rename pipeline-edge skills (`/war-survey-corps` → `/survey-corps`, `/war-aftermath` → `/aftermath`)

**Plan:** `docs/plans/2026-07-03-rename-survey-corps-aftermath.md`
**Date:** 2026-07-03 · **Repo baseline:** `dev/2026-07-03-rename-survey-corps-aftermath` @ `23f6d17` (cut from plan-4's tip; v0.14.0)
**Source spec:** none (operator-drafted; the 2026-07-02 pipeline-skills spec is cited only as a historical-exemption surface)
**Verdict: CLEARED** (one `needsDecision` adjudicated and patched under `--afk`)

## Attack surface
7 probes, all on-target, none dropped: 4 spine (preconditions/claims-vs-reality, consistency-preconditions, dependency-feasibility, intent-vs-plan) + 3 bespoke rename probes (inventory-fidelity, untagged-sibling, structure-test-feasibility). `executable-proof` dropped (the plan ships no runnable artifacts — its `grep -rF … → 0` claims are post-rename end-state deliverables, not provable plan artifacts); `coverage-vs-source` dropped (no source spec).

## Executed proof
- **structure-test-feasibility** (executed, sandboxed `cp -R`): `skills/war-machine/war-pipeline-structure.test.sh` currently references the OLD paths via path vars, defines the `has()` + `fm_has_key()` helpers the plan builds a `lacks()` inverse from, and PASSES as-is (exit 0). The plan's "repoint path vars + add paired presence/absence guards" is feasible.

## Findings & resolution
- **[Minor / needsDecision — RESOLVED] Stale occurrence count for `skills/war-help/SKILL.md`.** The Phase-1 inventory table credited war-help with `2 | 2` old-token occurrences; a live grep finds **3 each** — frontmatter description (1), table cell (1), and the README URL anchor (`#turn-issues-into-specs-war-survey-corps` / `#clean-up-war-aftermath`) (1). The inventory was authored against `a9c0241`; the URL anchor was omitted from the numeric column.
  - **Not a feasibility blocker:** the plan's own "What changes" prose for war-help already names the anchor links ("anchor links become `#…-survey-corps` / `#…-aftermath`"), so all three instances were in-scope; the worker's grep-driven sweep + the paired `lacks()` absence guard (which enumerates war-help/SKILL.md) catch every token regardless of the count.
  - **Patched:** count column corrected to `3 | 3` and the cell note now reads "description + table cell + URL anchor". Objective correction (grep-verified) — no re-run required.

## Residual risk
None blocking. The absence guard is correctly scoped to an enumerated live-surface list (not a repo-root recursive grep), and `docs/` is preserved as history. The untagged-sibling probe found no indirect/anchor references beyond the tokened occurrences the plan already inventories.
