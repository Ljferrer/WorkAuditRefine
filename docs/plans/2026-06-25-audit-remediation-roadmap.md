# Audit Remediation Roadmap — 12 findings → 5 plans

Index for converting the [agent-architecture-audit](../specs/) fix-specs (F01–F12) into implementation
plans. Grouping decided 2026-06-25 (operator): **4 themed plans** after Plan 1; **per-plan version bump**.

## Grouping principles
1. **Co-group same-file findings** so WAR serializes them as dependent *tasks* (clean), instead of forcing a
   later plan to rebase + re-anchor stale line-refs. Hard clusters: `provision-worktrees.sh` = {F08,F09};
   `war-servitor.md` = {F01,F05}; `war-config.test.mjs` = {F06,F07,F12}.
2. **Foundation first** — F07 (broadens the drift guard) + F12 (makes the multi-runner gate real) protect
   every plan that lands after them.
3. **Per-plan release** — each plan ends in its own version bump (operator choice).

## Plans (execute in order — WAR runs one plan at a time; serial execution dissolves cross-plan file overlap)

| # | Plan | Findings | Sev | Ver (propose) | Status |
|---|------|----------|-----|------|--------|
| 1 | [Audit & scheduler integrity](2026-06-25-audit-scheduler-integrity.md) | F11, F02, F04 | HIGH | v0.5.2 | **drafted + verified** |
| 2 | [Verification-layer integrity](2026-06-25-verification-layer-integrity.md) | F07, F12 | MED/HIGH | v0.5.3 | **drafted** |
| 3 | [Provisioning lifecycle](2026-06-25-provisioning-lifecycle.md) | F08, F09, F10 +#69/#71 | LOW/NIT | v0.5.4 | **drafted** |
| 4 | [Servitor confinement & memory](2026-06-25-servitor-confinement-memory.md) | F01, F05 +#58 | HIGH/MED | v0.6.0 | **drafted** |
| 5 | [Audit fidelity](2026-06-25-audit-fidelity.md) | F03, F06 | HIGH/MED | v0.7.0 | **drafted** |

### Plan 2 — Verification-layer integrity {F07, F12} · v0.5.3 · *foundation, land first*
- **F07** (mirror-logic drift guard): guard mirrored *logic* not just constants — `spawnOpts`, `covenSeats`,
  `decideLand`'s inline copy, drift tests. **Folds in Plan 1's constant drift guard.**
- **F12** (multi-runner gate): single `node --test` under-covers (misses `*.test.sh`); add a gate resolver +
  coverage meta-test; `SKILL.md`/`war-refiner.md` re-detect-and-run-all.
- Files: `war-config.mjs`, `war-config.test.mjs`, `land-decision.test.mjs`, `workflow-template.{js,test.mjs}`,
  `SKILL.md`, `war-refiner.md`, schemas. Shared `war-config.test.mjs` → serialize as tasks.

### Plan 3 — Provisioning lifecycle {F08, F09, F10} · v0.5.4 · *low-risk, independent of audit core*
- **F08** (LOW): wire or remove dead `branch_ahead_of` in `provision-worktrees.sh`.
- **F09** (LOW): enforce the `--owned-file` ownership ledger at **teardown & resume**, not just create.
- **F10** (NIT): the `<integration-tip>` literal placeholder is ambiguous beside resolved paths in the provision prompt.
- Files: `provision-worktrees.sh` + `provision-worktrees.test.sh` (F08/F09), `workflow-template.js` provision-prompt
  region + `workflow-template.test.mjs` (F10). No intra-file conflict (different files).

### Plan 4 — Servitor confinement & memory {F01, F05} · v0.6.0 · *minor: agent tool-surface change*
- **F01** (HIGH): scope hook is `Write|Edit|NotebookEdit`-only → the Bash write path is ungated; give the servitor
  a `tools:` allowlist; reword "physically confines" to attribute confinement to the allowlist, not the hook.
- **F05** (MED): servitor memory-admission discipline (capture signal not noise; user-correction priority).
- Files: `war-servitor.md` (both — serialize as tasks), `war-worker.md`, hooks, ADR 0002 (F01); `workflow-template.js`
  wrap-up prompt, optional `references/servitor-memory.md` (F05).

### Plan 5 — Audit fidelity {F03, F06} · v0.7.0 · *minor: audit behavior; lands last*
- **F03** (HIGH): pin the auditor baseline to the **integration branch**, not the (laggy) main checkout; precompute
  a diff artifact (`computeDiff`) so the read-only auditor sees the right candidate diff.
- **F06** (MED): default audit breadth = the full **3-lens panel** (DEFAULTS/PRESETS); confirm the default-coven path.
- Files: `workflow-template.js` audit region (both), `war-auditor.md` + schemas (F03), `war-config.{mjs,test.mjs}`
  + README + war-room (F06). **Extends F07's drift guard** (landed in Plan 2) — clean serial rebase.

## How each plan gets built
- House format (Status / Problem / Decisions / Solution shape / Affected files / Alternatives / Validation /
  Open decisions), TDD task slices (write failing test → run → implement → run → commit).
- **Gate** = the full multi-runner command (the F12 lesson): `node --test skills/**/*.test.mjs` + all three
  `*.test.sh` suites.
- Each plan re-anchors line-refs by **construct** at draft time; workers re-confirm at execution.
- Ratify each plan with `/red-team` (operator-run) before `/war` execution.

## Cross-plan notes
- `war-config.test.mjs` is touched by Plan 2 (F07/F12) and Plan 5 (F06). Resolved by order: Plan 2 establishes
  the drift-guard structure; Plan 5 extends it.
- Version numbers are proposals; each plan's release task confirms (could collapse v0.6.0/v0.7.0 if 4 & 5 land together).
