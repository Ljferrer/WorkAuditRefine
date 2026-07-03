# Red Team — Issue #422 nit sweep — ledger CLI parity + true doc claims (2026-07-02)
**Verdict:** CLEARED-WITH-NOTES — sole gate blocker refuted by GitHub's own rendered HTML; every executed baseline reproduced; no plan patch required.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (vs issue #422 snapshot), consistency-placeholders, dependency-feasibility. Bespoke: anchor-check (analyzed), baseline-repro (executed), tests-run (executed). Executed in sandbox: executable-proof, baseline-repro, tests-run — throwaway `cp -R` copies / detached git worktree at `df4d20b`, repo never touched. Provision: `[]` (structural fallback — no manifest, no lockfile, no submodules).

## Executed proof
- `baseline-repro` → all three claimed baselines reproduce at tip `df4d20b`: (a) CLI `record` with `--pr` omitted silently DELETES the persisted `pr` (unconditional key → `undefined` → dropped by `JSON.stringify`); (b) the §7.1 lifecycle example run verbatim crashes at `path.resolve(undefined)` (missing `--plan`); (c) `--stopPoint` does not persist through the CLI (stays `null`).
- `tests-run` → `campaign-ledger.test.mjs` 27/27 green; full declared gate 348/348; the file already matches the `skills/**/*.test.mjs` glob — plan's "no gate edits" claim holds.
- `executable-proof` → no mismatches in the plan's runnable artifacts.

## Findings
### Major (refuted — recorded as note, does not block)
- [Major→refuted] `consistency-placeholders` + `anchor-check` (adversarially "CONFIRMED") both claimed the plan's `#roles--gas-town-lineage` anchor is wrong (single hyphen expected from `## Roles → Gas Town lineage`). → **Live disproof:** `gh api repos/Ljferrer/WorkAuditRefine/readme -H "Accept: application/vnd.github.html"` renders `id="user-content-roles--gas-town-lineage"` — **double hyphen**, exactly as the plan wrote. GitHub's slugger removes `→` but keeps both surrounding spaces, each becoming a hyphen. Both probes (and the confirm seat) shared the same wrong slugger model — a correlated-error case the confirm stage cannot catch.

## Resolutions applied (grill decisions — AFK self-adjudication)
- Roles-anchor blocker → dismissed with reproduced live evidence (rendered-HTML anchor id); plan unchanged. The two other target anchors (`#author-a-plan-war-strategy`, `#run-a-campaign-war-campaign`) also verified in the same rendered output, matching the plan verbatim.

## Residual risk
- Anchor verification was against the default-branch README render; the headings are unchanged on `dev/art-of-war`, so slugs are identical. If plan 2/3 retitle README sections, T1's links must be re-verified then (they own those files serially, per the roadmap contention table).
- Coverage whole: 8/8 probes on-target, 0 dropped. Gate summary: pass 6 / fail 2 (both fails = the single refuted finding).
