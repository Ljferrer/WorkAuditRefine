# Red-team report — Auditor pin-validity lens drops the denied `git fetch` (#310)

**Plan:** [`docs/plans/2026-07-01-auditor-pin-validity-no-fetch.md`](../plans/2026-07-01-auditor-pin-validity-no-fetch.md)
**Source spec:** [`docs/specs/2026-07-01-auditor-pin-validity-no-fetch-design.md`](../specs/2026-07-01-auditor-pin-validity-no-fetch-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.10 (landOrder 10) · **Stacked base:** Plan 9 tip `c4b1957` (v0.8.9) · **Closes:** #310

## Verdict: **CLEARED** (two remediation rounds — the trickiest plan in the stack)

A small doc/test change (drop the denied `git fetch` from the auditor's pin-validity lens; pin that `fetch` stays denied) that hid **three real plan defects**, all found + fixed before build.

## Real defects found & fixed

| Round | Probe | Sev | Defect | Fix @ |
|---|---|---|---|---|
| 1 | `executable-proof` | Major (CONFIRMED) | Step 5's `grep 'fetch'` "returns nothing" contradicts the reword, which **deliberately keeps** a `` do NOT `git fetch` `` rationale line — a worker would false-fail or strip the required citation. | `d7d3eae` (then round-2 refined) |
| 2 | `executable-proof` / `reverify` | Major (CONFIRMED) | My round-1 fix `git( -C [^ ]+)? fetch` left `-C` **optional** → still matched the bare `git fetch` rationale. Now `git -C [^ ]+ fetch` (require `-C`) matches the removed command only. | `0749cee` |
| 2 | `claims-vs-reality` | Major (needsDecision) | The "conditional cross-note" was **not** vacuous: `2026-06-29-submodule-support-design.md` §5.4 L158 literally prescribes an auditor `git -C <submodule> fetch`. Step 5b now **rewords** that spec (aligns it to the no-fetch lens) instead of a no-op verify-close; Files bullet updated. | `0749cee` |
| 2 | `dependency-feasibility` | ND (PLAUSIBLE) | Step 2 claimed a `-C cat-file` allow-case already exists; it doesn't (only `-C rev-parse` H1 + `-C show` H2). Step 2 now **adds** `git -C <sub> cat-file -e <oid>` → allow (the reworded lens relies on it). | `0749cee` |

Round-2 re-verify: `reverify-step5-grep-requires-C` **pass**, `reverify-step5b-spec-align-and-step2` **pass**, `executable-proof` **pass**, spine `coverage`/`consistency`/`dependency` all **pass**.

## Adjudicated non-blocking

- **`claims-vs-reality` Majors — "`-C fetch` deny-case / `-C cat-file` allow-case missing".** These are T1's **Step 2 deliverables** (the plan explicitly adds them) — the not-yet-implemented misfire (`redteam-claims-vs-reality-misfires-on-impl-plans`; the very class Plan 9/#311 fixes, in the still-installed pre-#311 scaffold). Not defects.
- **Gate `INCOMPLETE` — read_anchor artifact.** `baseline-gate-green` **passed** but was marked off-target because it quoted `## Gate` (not one of the fingerprint's first-four `##` tokens). The baseline is independently confirmed green: `validate-auditor-git.test.sh` 62/62, `node --test` 0 real failures (only the known nested-worktree breadth artifact), and the on-target `executable-proof` also ran the gate clean. Coverage is materially whole; Lead-adjudicated.

## Coverage summary

Round 2: `{ probes: 7, pass: 6, fail: 0, warn: 1, offTarget: [baseline-gate-green (attestation artifact)] }`. All three real defects fixed + re-verified; residual findings are the impl-plan misfire + an attestation technicality. Lead-adjudicated to **CLEARED**.
