# Visual projections and diff-grounded recaps — plan renders, run recaps, adjudication recaps

## Context — the gap / problem

Merged plans, mid-run escalations, and completed runs reach the operator as dense Markdown; readability suffers exactly at the review moments that matter (user). Issue #1880 records the adopted idea and its assessment (verified: issue #1880 (2026-08-27)). The pattern source is BuilderIO's `/visual-plan` and `/visual-recap` skills: typed-block review surfaces with a diff-grounding rule ("structured blocks derived mechanically from the actual diff; the model writes only the prose") and reviewability budgets — but both hard-depend on the hosted Agent-Native Plans MCP, and their local-files mode still needs the `npx @agent-native/core` CLI plus the hosted Plan UI to preview (verified: BuilderIO/skills@main `visual-plan`/`visual-recap` SKILL.md + `references/local-files.md`, read 2026-08-27). WAR adopts the pattern natively, zero new dependencies.

Load-bearing repo facts at base `20407a0`:

- `/war-review` already writes an untracked run file at `$RUNS/<runId>-review.md` riding the `.claude/` exclude (verified: `skills/war-review/SKILL.md` §6 at `20407a0`) — the recap sibling follows the same pattern.
- `skills/war/SKILL.md` is budget-floored at hard 73728 bytes and measures 71661 at base — ~2067 bytes of headroom for the Phase 3 pointer (verified: `skills/war/assets/prompt-surface-budgets.test.mjs` at `20407a0`).
- The reference-link integrity test's `const SCAN_DIRS` covers only `agents/` and `skills/war/references/` (verified: `skills/war/assets/reference-link-integrity.test.mjs`, `SCAN_DIRS` const, at `20407a0`); it skips absolute URLs of any scheme via its `/^[a-z][a-z0-9+.-]*:/i` guard, so widening cannot red external links (verified: same file at `20407a0`).
- `grep -rl 'never canonical' docs/adr/` returns zero hits — the ES8 phrase is unique-by-construction (verified: `docs/adr/` grep at `20407a0`).

**Evidence consumed** — issue #1880: read · BuilderIO `visual-plan`/`visual-recap` SKILL.md + `local-files.md`: read · `skills/war-review/SKILL.md`, `skills/war/SKILL.md` (escalation/Checkpoint region), `skills/war-strategy/SKILL.md` + structure test, `plan-interview.md`, `prompt-surface-budgets.test.mjs`, `reference-link-integrity.test.mjs`: read · run manifests under `.claude/war/runs/`: **unread — reason:** no prior run exercises these surfaces; nothing to consume.

## Pivotal constraints

- Zero new runtime dependencies — no renderer asset, no external service; the model authors HTML per doctrine (the BuilderIO grounding rule *is* prose discipline, not a parser).
- The Workflow sandbox cannot invoke skills — the adjudication recap is Lead-side prose at the escalation surface, never a `workflow-template.js` change.
- ADR 0042 hot/cold law — doctrine lands in one `references/` file; each consuming surface carries only a `when <trigger>, read references/<file>` pointer.
- The `/war` SKILL.md pointer must fit the existing hard byte budget — no budget raise.
- Renders are never canonical: the merged `.md` / landed diff stays the only execution artifact.

## Resolved design tree

| # | Decision | Resolution | Source | Pins · class |
|---|----------|------------|--------|--------------|
| D1 | Scope | Issue #1880 items 1–3; BuilderIO front-door wiring deferred | (user) | PIN-1 · non-goal |
| D2 | Layering | Three layers: canonical `.md`/diff → durable render → opportunistic Artifact review surface; feedback flows one-way into the canonical artifact, the render regenerates | (user) | PIN-2 · guardrail ‡ |
| D3 | Output homes | Run/adjudication recaps untracked at `.claude/war/runs/<runId>-recap.html`; plan projections **committed** at `docs/plans/renders/<plan-basename>.html` (deterministic plan↔render mapping) | (user) | PIN-3 · guardrail + slice |
| D4 | Renderer | Prose doctrine only — no renderer asset; a mechanical renderer is a second parser of the merged-plan shape and is the rejected ceiling | (user) | PIN-4 · context |
| D5 | Freshness | Drift test pins committed renders: embedded stamp == sha256 of the plan file; freshness-only, never parses plan structure; negative arm fixture-based | (user) | PIN-5 · end-state + guardrail ‡ |
| D6 | Regeneration cadence | `/war-strategy` regenerates at authoring/conversion; `/red-team` regenerates at proceed-verdict (CLEARED/ADJUDICATED), never per micro-patch; the drift test is the net | (user) | PIN-6 · slice |
| D7 | Self-containment | Binding guardrail: zero external fetches in any committed render; default posture no-JS (`<details>`, CSS tabs, anchors); small inline scripts are explicit latitude; mermaid legal only in the Artifact copy | (user) | PIN-7 · guardrail ‡ |
| D8 | Config | Tri-state `strategy.htmlProjection: "commit" \| "local" \| "off"`, default `"commit"`; flags `--no-html` (⇒ off) and `--no-commit-html` (⇒ local); precedence flag > config > default; explicit `null` = unset | (user) | PIN-8 · end-state + slice |
| D9 | Bootstrap | Dogfood: this plan's own projection is the first committed render — the drift test's real baseline and the living exemplar | (user) | PIN-9 · slice + end-state |
| D10 | Link integrity | Widen `SCAN_DIRS` to the three consuming skill dirs; the widening task absorbs any pre-existing link reds it surfaces | (user) | PIN-10 · end-state + slice |
| D11 | Budgets + size gate | Recap budgets adopted from the source skills (3-8 key-change sections, ~150 lines each); adjudication recap size-gated per A1 | (user) | PIN-11 · slice |
| D12 | Phase split | Phases 2 and 3 are legally mergeable (all files disjoint); split kept as the issue's cold-path-first sequencing — a choice, not a constraint | (user) | PIN-12 · context |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Adjudication size gate defaults to: skip when the escalation diff touches < 5 files and < ~200 changed lines | [assumed: reasonable threshold — the source skill states no numeric rule ("skip it for small, single-file, or obvious diffs"); if wrong: operator tunes one doctrine line] | recaps generated for trivial escalations, or skipped for meaty ones | backstop row 2 |
| A2 | The war-strategy structure test survives the additive projection section untouched | [assumed: its pins are template-byte-scoped — if wrong: fix scoped inside Phase 2 Task 2] | one red test in one task | ES4's chain runs it |
| A3 | Model-authored HTML per doctrine is adequate render quality | [assumed: the source skills work the same way — if wrong: a renderer is minted later from observed failures] | renders underwhelm; doctrine iterates | backstop rows 1–2 |

## Non-goals / deferred

- BuilderIO `/visual-plan` / `/visual-recap` front-door wiring (issue #1880 item 4) — deferred to a later plan; if ever adopted, local-files mode only.
- CONTEXT.md glossary adoption of the new terms — deferred; a glossary mirror needs its own drift-guard row this plan does not fund.
- Any mechanical renderer asset — rejected ceiling (D4), revisited only from observed field failures.

## New domain terms · Recommended ADRs

Terms introduced (glossary adoption deferred, above): **visual projection** (committed render of a merged plan) · **run recap** (untracked diff-grounded render of a completed run) · **adjudication recap** (untracked size-gated render of an in-flight escalation). Recommended ADR: the one-way-projections ADR — minted by Phase 2 Task 4 (passes the triad: hard to reverse once renders are committed repo-wide; surprising without context; a genuine canonical-vs-projection trade-off).

## Commander's Intent

- **Purpose:** an operator can see any plan, any mid-run escalation, and any completed run as a self-contained visual render — plan structure and built work legible at a glance, downloadable from GitHub and openable anywhere — without the render ever becoming canonical.
- **Method:** one doctrine references file — `skills/war/references/visual-projections.md` — carrying the recap skeleton, the 3-8-section / ~150-line budgets, the diff-grounding rule, the zero-external-fetch guardrail, the adjudication size gate, and a compact worked exemplar, consumed by trigger pointer from four surfaces: `/war-review` (post-run recap), `/war-strategy` (plan projection at authoring/conversion), `/war` (size-gated adjudication recap at the escalation/Checkpoint surface), `/red-team` (projection regeneration at proceed-verdict). Plan projections are committed at `docs/plans/renders/<plan-basename>.html` — the deterministic plan↔render mapping the drift test discovers — default `"commit"` via tri-state `strategy.htmlProjection` (`"commit" | "local" | "off"`, flags `--no-html` / `--no-commit-html`, precedence flag > config > default), pinned by a freshness-only drift test (embedded stamp == hash of the plan file). Run and adjudication recaps are untracked under `.claude/war/runs/`, Artifact-opportunistic. This plan ships its own committed projection as the first render. A new ADR pins the one-way-projection law. `/war-room` documents the new key.
- **Mechanism latitude:** HTML/CSS layout and diagram composition, exact pointer wording, recap section ordering, and inline-script use within the zero-fetch guardrail are implementer's choice; substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** zero external fetches in any committed render · renders are never canonical — feedback flows into the `.md`, the render regenerates · the drift test stays freshness-only, never parsing plan structure · the `/war` SKILL.md pointer fits under the existing hard budget — no budget raise.
- **End state:**
  1. `skills/war/references/visual-projections.md` carries the skeleton, budgets, grounding rule, zero-fetch guardrail, and size gate · check: `for t in skeleton grounding '3-8' 150 'zero external fetches' 'size gate'; do grep -n "$t" skills/war/references/visual-projections.md || exit 1; done && echo DOCTRINE-OK` (each grep prints its matched line; the budget line is pinned ASCII `3-8`).
  2. The freshness drift test mechanizes its negative arm (stamp-mismatch fixture in a temp dir → red) and its positive arm sweeps `docs/plans/renders/` asserting non-emptiness and per-render stamp == sha256 of its plan · check: `node --test skills/war-strategy/assets/projection-freshness.test.mjs`.
  3. `strategy.htmlProjection` accepted as exactly `"commit" | "local" | "off"`, default `"commit"`, explicit `null` = unset · check: `node --test --test-name-pattern 'htmlProjection' skills/war/assets/war-config.test.mjs 2>&1 | grep -E '^# pass [1-9]'`.
  4. `/war-strategy` SKILL.md documents the projection step and both flags · check: `grep -n 'no-commit-html' skills/war-strategy/SKILL.md && grep -n 'visual-projections' skills/war-strategy/SKILL.md && bash skills/war-strategy/war-strategy-structure.test.sh`.
  5. `/war-review` SKILL.md carries the recap step and pointer · check: `grep -n 'visual-projections' skills/war-review/SKILL.md`.
  6. `/war` SKILL.md's escalation/Checkpoint surface carries the size-gated recap pointer, under budget · check: `grep -n 'visual-projections' skills/war/SKILL.md && node --test skills/war/assets/prompt-surface-budgets.test.mjs`.
  7. `/red-team` SKILL.md carries the verdict-time regeneration duty · check: `grep -n 'visual-projections' skills/red-team/SKILL.md`.
  8. The projections ADR is committed at the next free number, minted by its named owning task (Phase 2 Task 4), stating the one-way law and the zero-fetch guardrail · check: `grep -l 'never canonical' docs/adr/00*.md` prints the new ADR filename (the check proves phrase presence only; next-free-number + owning-task is enforced by the owning task and audit, not this grep).
  9. `/war-room` SKILL.md mentions the new key · check: `grep -n 'htmlProjection' skills/war-room/SKILL.md`.
  10. Full JS + shell suites green · gate: resolved gate self-discovery.
  11. `SCAN_DIRS` in the integrity test covers the three consuming SKILL.md surfaces · check: `grep -n 'war-review' skills/war/assets/reference-link-integrity.test.mjs && node --test skills/war/assets/reference-link-integrity.test.mjs`.

## Build order (for /war)

Phase 1 (doctrine + war-review recap) → Phase 2 (projection + config + ADR) → Phase 3 (hot-path pointers) → Phase 4 (release).

## Phase 1 — Doctrine + war-review recap

### Task 1: Author the visual-projections doctrine file
- Files: `skills/war/references/visual-projections.md`
- Plan slice: new file carrying — the three-layer law (canonical `.md`/diff → durable render → opportunistic Artifact review surface, feedback one-way); the recap skeleton (outcome narrative → file-tree with per-file change flags → 3-8 key-change sections at ~150 lines each, ASCII `3-8` on the budget line); the diff-grounding rule (structured content derived mechanically from real paths/fields/hunks — prose is the only free-written layer; facts absent from the diff are omitted or marked inferred); the zero-external-fetch binding guardrail with no-JS default posture and small-inline-script latitude; mermaid legal only in the Artifact copy, never a committed render; the adjudication size gate (skip when the escalation diff touches < 5 files and < ~200 changed lines — per A1); the stamp contract for committed projections (`<meta name="war-plan-hash" content="sha256:<hex>">` + `<meta name="war-plan-path" content="docs/plans/<file>.md">`, mapping `docs/plans/renders/<plan-basename>.html`); untracked recap homes under `.claude/war/runs/`; Artifact-opportunistic publish (file always written first, publish fail-open); one compact worked exemplar.
- Done when: None — prose doctrine; End state 1's per-token check is the oracle.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: /war-review recap step
- Files: `skills/war-review/SKILL.md`
- Plan slice: add the run-recap step to the emit flow — render the recap of the run's landed range to `$RUNS/<runId>-recap.html` (untracked, same exclude as the review file), Artifact-opportunistic, grounded in the manifest + landed diff; carry the ADR-0042-shaped trigger pointer `when rendering the run recap, read ../war/references/visual-projections.md`; the recap is skippable by the operator and degrades honestly (`n/a` posture) when the landed range is unsourceable.
- Done when: None — prose surface; End state 5's grep is the oracle.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Widen reference-link integrity to the consuming skills
- Files: `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: extend `const SCAN_DIRS` to cover `skills/war-review/`, `skills/war-strategy/`, and `skills/red-team/`; fix any pre-existing link reds the widened scan surfaces (footprint may grow by the surfaced reference files — absorb latitude, listed in the done report); the absolute-URL skip guard already exempts external links (verified at `20407a0`).
- Done when: `node --test skills/war/assets/reference-link-integrity.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [Task 1, Task 2]
- target repo: superproject

## Phase 2 — Projection + config + ADR

### Task 1: Tri-state htmlProjection config key
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: add `strategy.htmlProjection` to DEFAULTS (`"commit"`) and validation (accept exactly `"commit" | "local" | "off"`; explicit `null` reads as unset per the repo's null-equals-absent convention — never a hard reject); the drift-guard/validation test rows land in this same task (mirror rule); test names contain `htmlProjection` so End state 3's `--test-name-pattern` matches.
- Done when: `node --test --test-name-pattern 'htmlProjection' skills/war/assets/war-config.test.mjs 2>&1 | grep -E '^# pass [1-9]'`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: /war-strategy projection step + flags
- Files: `skills/war-strategy/SKILL.md`
- Plan slice: document the projection step at authoring/conversion close — resolve the mode (flag > `.claude/war/config.json` > default `"commit"`); `--no-html` ⇒ off, `--no-commit-html` ⇒ local/untracked; on `"commit"`, author the render at `docs/plans/renders/<plan-basename>.html` per the doctrine pointer (`when rendering a plan projection, read ../war/references/visual-projections.md`) with the stamp contract, in the same commit as the plan; keep the addition additive so the structure test's template pins are untouched (A2 — a scoped fix lands here if wrong).
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Freshness drift test + this plan's dogfood render
- Files: `skills/war-strategy/assets/projection-freshness.test.mjs`, `docs/plans/renders/2026-08-27-visual-projections-and-recaps.html`
- Plan slice: the test sweeps `docs/plans/renders/*.html`, asserts the dir is non-empty, and for each render reads the `war-plan-hash` / `war-plan-path` meta stamps and asserts stamp == sha256 of the referenced plan file (missing plan, missing stamp, or mismatch ⇒ red); the negative arm constructs a stamp-mismatch fixture in a temp dir and asserts red — never depends on repo state; freshness-only, no plan-structure parsing (guardrail). The render is this plan's own projection authored per the doctrine: self-contained, zero external fetches, stamped against `docs/plans/2026-08-27-visual-projections-and-recaps.md` at the integration tip.
- Done when: `node --test skills/war-strategy/assets/projection-freshness.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: Mint the one-way-projections ADR
- Files: `docs/adr/00NN-visual-renders-are-one-way-projections.md`
- Plan slice: `00NN` resolves to the next free number at land time — this task owns the minting (a land-time-numbered placeholder without an owning task recurs unresolved). Content: renders are generated one-way projections of the merged plan / landed diff, never canonical (the exact phrase `never canonical` appears — End state 8's unique-by-construction oracle); feedback flows into the `.md` and the render regenerates; committed renders make zero external fetches; the freshness drift test is the net, regeneration cadence per D6.
- Done when: None — prose record; End state 8's grep is the oracle.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: /war-room documents the key
- Files: `skills/war-room/SKILL.md`
- Plan slice: the config interview/presets mention `strategy.htmlProjection` (tri-state, default `"commit"`, the two war-strategy flags as per-invocation overrides).
- Done when: None — prose surface; End state 9's grep is the oracle.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Hot-path pointers

### Task 1: /war adjudication-recap pointer
- Files: `skills/war/SKILL.md`
- Plan slice: at the escalation/Checkpoint surface, add the Lead-side size-gated pointer — on a hard escalation, a `held:*` adjudication, or the ask strike-list gate, when the escalation diff clears the doctrine's size gate, render an adjudication recap of `frozen-phase-base..integration-tip` to `$RUNS/<runId>-recap.html` per `when rendering an adjudication recap, read references/visual-projections.md`; generated concurrently, never blocking, never a new gate (ADR 0017-consistent — a presentation aid, not a validation). Guardrail: the addition fits the existing hard byte budget — no raise; trim elsewhere-legal prose is out of scope, so budget pressure routes to escalation, not a raise.
- Done when: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: /red-team regeneration duty
- Files: `skills/red-team/SKILL.md`
- Plan slice: at proceed-verdict emission (CLEARED / ADJUDICATED), when the graded plan has a committed render at `docs/plans/renders/<plan-basename>.html`, regenerate it against the patched plan in the same commit as the final patch — never per micro-patch (D6); the freshness drift test is the enforcement net.
- Done when: None — prose surface; End state 7's grep is the oracle.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Release

### Task 1: Version bump, four slots in lock-step
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump to the next free patch above the live base at land time (version literals in this plan are non-authoritative); all four slots together — `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`, README `## Status` replace-in-place.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Recap render quality (run recap) · why deferred: prompt-behavior, no mechanical oracle for visual quality · runner: operator runs `/war-review` against a recent run manifest and judges the output, first post-land run.
- Adjudication recap utility + A1 threshold fit · why deferred: needs a real mid-run escalation · runner: operator judges at the first post-land escalation; tunes the doctrine's size-gate line if A1 is wrong.

## Notes / conscious deviations

- Phases 2 and 3 are file-disjoint and legally one phase; the split is the issue's cold-path-first sequencing, kept deliberately (PIN-12).
- End state 8's grep proves phrase presence only; the next-free-number + owning-task half is enforced by Phase 2 Task 4 and audit.
- No `WAIVE-<n>` rows: every armed verification ran (ADR grep, URL-skip guard, budget headroom, `SCAN_DIRS` location — all at `20407a0`).

## Open decisions

None.
