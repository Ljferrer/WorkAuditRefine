# Kill stack-fragile literals in plans/prompts; calibrate auditors to legitimate inert-slice patterns

Addresses (memory lessons): plan-line-number-refs-stale-use-construct-locator, defined-but-not-yet-emitted-plan-slice-pattern, plan-affected-file-list-doc-completeness-vs-correctness, plan-survey-token-sweep-misses-untagged-siblings, prompt-only-clause-grep-guard-must-tolerate-sentence-case, task-prompt-suite-count-stale-after-stacking, stacked-release-plan-version-literal-lags-operator-target, drift-matrix-stated-vs-covered-cells

> **Status:** design spec (decision record). Carries no dispatch structure — `/war` cannot execute it. `/war-strategy` converts it to a plan; `/red-team` validates that plan.
>
> **Depends on:** `docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md` — build after it. That spec settles how a verdict maps to severity/disposition and the gate-vs-evidence contract; this spec adds *new calibration clauses* to the same auditor surfaces (`agents/war-auditor.md` standing prompt + the dispatched `auditPrompt()` in `workflow-template.js`) and the same both-surfaces drift test. Landing this first would force a re-merge of those surfaces. See §8/§9.

## 1. Context — the gap / problem

Two coupled classes of friction, both mined from recurring servitor lessons, both rooted in the same fact: **a WAR plan is drafted against a base that keeps moving as earlier stacked tasks land into the integration tip.** Any *literal* the plan or a task prompt pins to that base rots the instant the base advances, and the resulting plan↔candidate divergence looks like scope creep to an auditor who re-adjudicates it from scratch every pass.

**Class A — stack-fragile literals in plans and prompts.**

- `[plan-line-number-refs-stale-use-construct-locator]` — plans cite `file :N-M` line ranges; intervening phases shift the target and the range points at the wrong lines (F05/p3-t5: cited `:420-426`, landed `427-431`). Companion `[plan-gate-enumeration-stale-after-stacking]` — a plan gate block enumerates three `*.test.sh` suites; stacked work adds a fourth; the self-discovery gate finds all four and the plan literal is stale. Companion `[plan-array-literal-lags-canonical-export]` — a plan restates the *final* value of a mirrored constant (`HARD_ESCALATION_REASONS`) that has already been appended to on the live export. Companion `[plan-prose-top-level-vs-nested-key-impl-mismatch]` — plan prose abbreviates a nested YAML path (`metadata.provenance`) as a flat key (`provenance:`), which would never match a real memory file.
- `[task-prompt-suite-count-stale-after-stacking]` — a task **prompt** hardcodes a suite count ("run ALL FIVE") that stales the moment a stacked task adds a runner; prompts are executed literally, so a wrong count makes the worker stop short of the real set. Strictly worse than plan-doc staleness because the prompt is the operative directive, and the last place a wrong number is caught.
- `[stacked-release-plan-version-literal-lags-operator-target]` — a release task pins a hardcoded version literal; an earlier stacked plan lands and the target is now `vY`, not the plan's `vX`. Recurred seven times (v0.8.6 → v0.14.11); every time the worker self-corrected off the live tip and the auditor filed a Nit. Companion open gap `[version-slots-no-cross-slot-consistency-test]` — the four canonical version slots have **no** automated equality test, so a partial bump is a silent no-op the gate cannot see.
- `[prompt-only-clause-grep-guard-must-tolerate-sentence-case]` — a `requiresTest:false` prose task whose only completeness check is a self-authored **case-sensitive** grep false-negates against a correctly-landed but re-cased/re-positioned instance, giving false confidence the clause landed everywhere.

**Class B — auditors misgrade correct-but-stale-looking patterns.** Each is a pattern the auditor re-derives per seat, per pass, often blocking or noisily Nit-ing a candidate that is in fact correct:

- `[defined-but-not-yet-emitted-plan-slice-pattern]` — a foundation task legitimately adds a constant/field/prose-ref *before* its emitter task lands (serial slices sharing a mirrored constant/schema). Without an explicit "produced in Task N" cross-link, auditors misgrade the inert slice as dead code / an omission and return `audit-blocked`. Recurred through 2026-07-07.
- `[plan-affected-file-list-doc-completeness-vs-correctness]` and its companion `[plan-file-list-incomplete-when-drift-guard-forces-cascade]` — plan affected-file lists routinely name a file the diff never touches (the guard/coverage legitimately lives elsewhere, e.g. the `HARD_ESCALATION_REASONS` cross-mirror drift guard lives in `war-config.test.mjs`, not the plan-named `land-decision.test.mjs`), or a drift guard forces an unlisted cascade touch. The packaging-floor instance alone was flagged **5×** across serial worker + gate-audit passes, always downgraded to Nit.
- `[plan-survey-token-sweep-misses-untagged-siblings]` — a plan step "grep for `<token>`, rename/delete every match" is a sound *mechanical* step but an unsound *completeness* claim: siblings encoding the same stale concept in different words (a numbered-nit drift guard, a prose doc-contract test) survive the sweep silently.
- `[drift-matrix-stated-vs-covered-cells]` — when a plan cites a coverage matrix (A × B), workers fill the natural example cells and silently miss boundary combinations (the `decideLand` drift guard originally covered 4 of the reachable cells, missing empty-landed×hard and non-empty-landed×soft). Review misses it because each present cell looks correct in isolation.

**Why the current surfaces do not catch this.** The self-discovery mechanism the fix wants already exists — `resolveGate(declaredGate)` in `skills/war/assets/war-config.mjs` emits a portable `find … -name '*.test.sh' … | sort` clause that runs *every* discovered suite regardless of any plan literal. The problem is authoring discipline never routed people to it: the plan template in `skills/war-strategy/SKILL.md` §2 shows a `Files:`/`Plan slice:` shape with no convention forbidding line-range/suite-count/version literals, and `agents/war-auditor.md` has latitude/disposition/calibration rules but nothing naming these four inert-slice patterns, so each auditor re-litigates them. These are prose-discipline gaps that recur precisely because nothing mechanical or standing carries them.

## 2. Pivotal constraints

1. **Git is the ground truth, plan literals are advisory (ADR 0008).** Every convention here must resolve the *live* artifact (the construct in the file, the self-discovery gate, the canonical export, the worktree baseline) and treat the plan/prompt literal as approximate. Nothing here may invert that: repair records toward git, never the reverse.
2. **Auditor calibration must reach every seat, including gate-audit.** Per `[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]`, the gate-audit seats (`execution-evidence`, `end-state`) build prompts inline and do **not** call `auditPrompt()`. A new base calibration clause reaches them only through the standing `agents/war-auditor.md` surface. So the standing `.md` is the primary carrier; the dispatched `auditPrompt()` clause is the mirror. Both change in one commit (prompt-surface split rule).
3. **Both-surfaces changes need a drift guard.** A calibration clause added to `agents/war-auditor.md` and mirrored into `auditPrompt()` drifts silently unless a test asserts the shared sentence appears in both — follow the existing latitude/disposition both-surfaces test pattern in `workflow-template.test.mjs`. Anchor on a casing/position-stable mid-sentence phrase, not a byte-fragile literal (per `[shared-string-constant-quote-literal-byte-anchor-fragility]`).
4. **Calibration lowers false alarms; it must never license a real defect.** A calibration rule may only demote a finding when the *live artifact* confirms the pattern is benign (the construct is the intended target; the guard's real home carries the coverage; the plan carries the cross-link). A demonstrably-untrue claim still blocks. This is the floor-not-ceiling shape already in CONTEXT.md.
5. **Mechanical over prose where cheap (rule 7 of the brief).** Where a literal is cheaply detectable (raw line ranges, literal `*.test.sh` lists near a gate directive, hardcoded suite counts, cross-slot version skew) prefer a lint/test over a prose "please don't". Where detection needs semantic judgment (matrix cell completeness, grep-sweep sibling survival) the enforcement stays an authoring convention.
6. **No new dependency, minimal new surface.** The self-discovery gate, the redaction-lint pattern shape (`LINT_PATTERNS`/`lint()` in `war-memory.mjs`), the red-team `executable-proof` probe, and the `war-strategy-structure.test.sh` verbatim-line lock all already exist. Extend them; do not build parallel machinery.
7. **Advisory, fail-open placement for the plan lint.** Plans live in `docs/plans/` and are not part of the `/war` gate. A plan-literal lint runs at authoring/validation time (`/war-strategy` conversion, `/red-team` spine), reports hits, and never hard-blocks CI — the only CI job is the memory redaction lint.

## 3. Resolved design tree (decision → resolution)

| Decision | Resolution |
|---|---|
| How to stop line-range literals (`:N-M`) | **Construct locators.** Plan template + `/war-strategy` convention: reference `file + enclosing symbol / comment header + change description`, never a raw line range. Reserve `:N-M` only for flat config files with no named construct, and then qualify "approx., measured at base `<sha>`". |
| How to stop gate-suite enumeration | **Name the self-discovery mechanism.** Plan gate blocks and merge checklists reference `resolveGate` in `war-config.mjs` (or "run ALL discovered `*.test.sh`") — never a literal suite list. |
| How to stop mirrored-constant final-value restatement | **"Append to the canonical export" phrasing.** Plans say "add `<value>` to the canonical `HARD_ESCALATION_REASONS` export in `land-decision.mjs`; the drift guard in `war-config.test.mjs` is the arbiter" — never a restated array literal. |
| How to stop flat-key abbreviation of nested paths | **Dotted-path convention.** Plans/prompts write `metadata.provenance` (dotted), never a bare `provenance:` that implies a top-level key. |
| How to stop hardcoded suite **counts** in prompts | **Forbid literal counts.** Task prompts and merge checklists use "run ALL discovered `*.test.sh` suites" / `resolveGate`, never "run ALL FIVE". Same rule at every level (plan doc, prompt, checklist). |
| How to stop hardcoded release version literals | **Compute at land time.** `/war-machine` emits a "next free patch above the live integration base" directive instead of a literal; the release task resolves the bump off the worktree baseline. No hardcoded `vX` in the plan. |
| Mechanical backstop for the cheap literals | **Advisory `plan-literal-lint.mjs`** (new, regex-based, mirrors `war-memory.mjs`'s `LINT_PATTERNS`/`lint()` shape): flags `:N-M` refs on locator/Files lines, literal `*.test.sh` lists near "gate"/"run", numeric suite-count phrasing near a gate directive, and hardcoded `v<semver>` in a release task. Run by `/war-strategy` on the plan it authors and by `/red-team`'s spine; reports hits, fail-open, never a CI gate. |
| Mechanical backstop for version-slot skew | **Cross-slot consistency test** (new, framework-free `*.test.mjs`): asserts `plugin.json.version === marketplace.json.metadata.version === marketplace.json.plugins[0].version` and that `README.md ## Status` contains that string. Closes `[version-slots-no-cross-slot-consistency-test]`; runs on every `node --test`. |
| Inert cross-slice slices misgraded as dead code | **Cross-link convention + auditor rule.** Plan MUST carry a "defined-but-not-yet-emitted; produced in Task N" note on any mirrored constant/schema/prose-ref whose emitter is a later task. Auditor rule (both surfaces): a dangling ref at a task tip is a defect **only if the plan lacks the cross-link**; with the link present, grade Nit/`note` and confirm resolution at the integration tip post-merge. |
| File-list "wrong file" / cascade touches misgraded | **Auditor pre-check + worker PR-body note.** Auditor rule (both surfaces): when a plan file-list entry is untouched, confirm the guard's *real home* (grep the sibling/precedent reason's coverage) before flagging; classify a location gap as Nit unless a demonstrably-untrue claim stands; a drift-guard-forced cascade touch is a "faithful, necessary deviation", not scope creep. Worker convention: note cascade touches in the PR/commit body for traceability. |
| Grep-sweep siblings survive silently | **Grep = floor, not ceiling.** `/survey-corps` + `/war-strategy` convention: any "grep X, handle every match" step carries a mandatory manual title/comment survey of the target file's same-scope tests; each straggler is called out as a "survey-derived correction". (Semantic — stays a convention, no lint.) |
| Matrix coverage cells silently missed | **Enumerate-all-cells discipline.** Convention: after writing matrix-style drift tests, enumerate ALL cells in a meta-comment/table with test-row count == rows × columns. (Semantic completeness — stays a convention; the row-count lint is a deferred non-goal, §9.) |
| Where the calibration clauses live | Standing `agents/war-auditor.md` (reaches every seat incl. gate-audit) as primary; dispatched `auditPrompt()` in `workflow-template.js` as the mirror; both-surfaces drift test in `workflow-template.test.mjs`. |
| Prose-grep guards on `requiresTest:false` tasks | **`grep -rin` default + red-team proof.** Convention: prose-clause grep guards default to case-insensitive, anchored on a casing/position-stable mid-sentence token. The `executable-proof` red-team probe explicitly extracts and *runs* plan-authored `requiresTest:false` verification commands in its sandbox, so a false-negating guard is caught pre-build. |

## 4. Mechanics (per component / role)

### 4.1 Plan template & `/war-strategy` authoring conventions — `skills/war-strategy/SKILL.md` §2

Add a short **"Reference the live artifact, never a stack-fragile literal"** convention block adjacent to the plan template, and thread the individual rules into the per-task field descriptions:

- `Files:` / locator prose → "name the enclosing symbol or comment header, not a `:N-M` range; reserve line ranges for flat config files and qualify them as approximate against a named base."
- Gate directives → "reference the self-discovery gate (`resolveGate` in `war-config.mjs`) by name; never enumerate `*.test.sh` suites or state a suite count."
- Mirrored constants → "say 'append to the canonical export in `land-decision.mjs`; the drift guard in `war-config.test.mjs` is the arbiter'; never restate the final array literal."
- Nested keys → "use the dotted path (`metadata.provenance`), never a flat abbreviation."
- Release tasks → "state 'next free patch above the live base', never a hardcoded `v<semver>`."
- A standing **"defined-but-not-yet-emitted; produced in Task N"** annotation for any cross-slice mirrored constant/schema/prose-ref (Class B `defined-but-not-yet-emitted`).
- A **grep-sweep floor** note: "'grep X, handle every match' requires a manual same-scope title/comment survey; list stragglers as survey-derived corrections."

The `war-strategy-structure.test.sh` verbatim-line lock is extended with fixed-string checks for the new convention lines so a future edit that drops them fails the structure test (the existing mechanism — it already locks the five spec sections, three templates, and the intent block).

### 4.2 `/war-machine` release directive — `skills/war-machine/SKILL.md`

Where the machine drafts a trailing release phase, it emits the **directive form** ("bump all four slots to the next free patch above the live integration base at land time") rather than resolving a literal at draft time — matching the ratified pattern in the `[stacked-release-plan-version-literal-lags-operator-target]` lesson (state expected base + standalone-fallback rule).

### 4.3 `plan-literal-lint.mjs` — new advisory lint

A small regex-based module modeled byte-for-byte on the `LINT_PATTERNS` array + `lint(text)` function + CLI in `skills/_shared/war-memory.mjs` (no new dependency, no parser). Patterns, each cheap and high-precision:

- **line-range ref** — `:\s?\d+[-–]\d+` or `lines?\s+\d+[-–]\d+` on a Files/locator line.
- **literal suite list** — a `*.test.sh` token in the same directive as `gate`/`run`.
- **suite count** — `ALL\s+(FIVE|SIX|\d+)` / `all\s+\d+\s+suites?` near a gate directive.
- **hardcoded version** — `v?\d+\.\d+\.\d+` inside a task whose name matches `release`.

It prints `{pattern, match}` hits (same shape as `war-memory lint`) and exits non-zero only in an explicit `--strict` mode; default is report-and-exit-0. `/war-strategy` runs it on the plan it authors and surfaces hits in the conversion report; `/red-team`'s universal spine runs it as an analyzed probe. **Fail-open** — a lint miss never blocks a land. A `plan-literal-lint.test.mjs` covers each pattern with a positive and a negative fixture (delete-the-pattern-and-it-passes discipline).

### 4.4 Cross-slot version-consistency test — new `*.test.mjs`

Framework-free, under `skills/` so the `node --test 'skills/**/*.test.mjs'` glob picks it up. Reads the three JSON/markdown slot files at the repo root and asserts:

- `plugin.json.version === marketplace.json.metadata.version === marketplace.json.plugins[0].version` (the `plugins[0].version` slot is the documented single-slot-update footgun), and
- `README.md`'s `## Status` line contains that exact version string.

This is the enforced form of the manual release-audit protocol in `[version-slots-no-cross-slot-consistency-test]`; it converts a silent-partial-bump no-op into a red test. It does **not** assert a *specific* version (that would rot every release) — only internal equality.

### 4.5 Auditor calibration clauses — `agents/war-auditor.md` + `auditPrompt()`

Add a **"Stale-looking-but-correct calibration"** subsection under the existing *Latitude and disposition (ADR 0013)* block in `agents/war-auditor.md` (primary carrier — reaches gate-audit seats), and mirror the same sentences into the `auditPrompt()` string in `skills/war/assets/workflow-template.js` (dispatched carrier). Four rules, each phrased so it demotes **only** when the live artifact confirms benignity:

1. **Line/gate/version literal drift** — plan literal vs candidate divergence on a line range, suite count, or version bump is a Nit at most when the construct/self-discovery gate/worktree baseline confirms the candidate is correct; never a hold. (Class A.)
2. **Defined-but-not-yet-emitted** — a dangling ref at a task tip is a defect **only if the plan lacks a "produced in Task N" cross-link**; with the link, grade Nit/`note` and confirm at the post-merge integration tip.
3. **File-list location gap** — when a plan file-list entry is untouched, confirm the guard's real home (grep the sibling/precedent reason) before flagging; a location gap or a drift-guard-forced cascade touch is a faithful deviation (Nit), not scope creep — block only on a demonstrably-untrue claim.
4. **Grep-sweep completeness** — a "grep X" sweep is a floor; confirm the plan carried a same-scope manual survey before treating a surviving sibling as the worker's omission vs. a plan-authoring gap.

A both-surfaces drift test in `workflow-template.test.mjs` asserts a stable anchor phrase from each rule appears in **both** `agents/war-auditor.md` and the built `auditPrompt()` output, following the existing latitude/disposition both-surfaces test.

### 4.6 Red-team `executable-proof` probe — `skills/red-team/assets/workflow-scaffold.js`

The `executable-proof` spine probe already copies the repo into a sandbox and runs every runnable artifact the plan ships (`workflow-scaffold.js`, `technique: 'executed'`). Tighten its prompt gist so it **explicitly** extracts plan-authored `requiresTest:false` verification commands (self-authored greps) and runs them, flagging any that false-negate against a re-cased/re-positioned landing site — the exact class caught as Finding C in the `[prompt-only-clause-grep-guard-must-tolerate-sentence-case]` lesson. Covered by an added assertion in `workflow-scaffold.test.mjs`.

### 4.7 `/survey-corps` grep-floor convention — `skills/survey-corps/SKILL.md`

Mirror the §4.1 grep-sweep floor rule into the survey step: any token-sweep instruction the survey emits into a spec carries the mandatory manual same-scope survey note, so the discipline is present from the first authoring surface, not only at plan conversion.

## 5. Surface changes (files touched)

- `skills/war-strategy/SKILL.md` — §2 plan template: new "reference the live artifact" convention block + threaded per-field rules + defined-but-not-yet-emitted annotation + grep-sweep floor note.
- `skills/war-strategy/war-strategy-structure.test.sh` — verbatim-line locks for the new convention lines.
- `skills/war-strategy/assets/plan-literal-lint.mjs` — **new** advisory lint (regex, `war-memory.mjs` `lint()` shape).
- `skills/war-strategy/assets/plan-literal-lint.test.mjs` — **new** per-pattern positive/negative fixtures.
- `skills/war-machine/SKILL.md` — release-directive ("next free patch above live base") instead of a literal.
- `agents/war-auditor.md` — new "stale-looking-but-correct calibration" subsection (four rules).
- `skills/war/assets/workflow-template.js` — mirror the calibration clauses into `auditPrompt()`.
- `skills/war/assets/workflow-template.test.mjs` — both-surfaces drift test for the calibration anchors.
- `skills/red-team/assets/workflow-scaffold.js` — `executable-proof` prompt tightened to extract+run plan-authored `requiresTest:false` grep guards.
- `skills/red-team/assets/workflow-scaffold.test.mjs` — assertion for the tightened probe.
- `skills/war/assets/version-consistency.test.mjs` — **new** cross-slot version equality test (framework-free).
- `skills/survey-corps/SKILL.md` — grep-floor survey convention mirrored into the survey step.
- `CONTEXT.md` — new domain terms (§6).
- `docs/adr/0023-*.md` — **new** ADR (§7).
- Release slots (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` ×2, `README.md ## Status`) — trailing version bump above 0.14.14, resolved at land time (never a literal in the plan).

## 6. New domain terms (CONTEXT.md)

- **Construct locator** — a plan/prompt reference by enclosing symbol or comment header (+ change description) rather than a `:N-M` line range; stable across integration churn. Contrast: line-range literal (stale on any prior land).
- **Stack-fragile literal** — any plan/prompt value pinned to the drafting base that rots when an earlier stacked task lands: line ranges, `*.test.sh` enumerations, suite counts, mirrored-constant final arrays, hardcoded version bumps, flat-key abbreviations of nested paths. Authoritative form is always the live artifact (construct, self-discovery gate, canonical export, worktree baseline).
- **Defined-but-not-yet-emitted slice** — a foundation task's constant/field/prose-ref added before its emitter task lands; benign **iff** the plan carries a "produced in Task N" cross-link. Without the link, auditors misgrade it as dead code.
- **Grep as floor** — a token sweep is a completeness *floor*, not a *ceiling*: it must be backed by a manual same-scope survey, because same-meaning siblings encode the concept in different words. (Extends the existing floor/ceiling language.)
- **Stale-looking-but-correct calibration** — the auditor discipline of demoting a plan↔candidate divergence to Nit **only** when the live artifact confirms benignity, done once per pattern rather than re-litigated per seat.

## 7. Recommended ADRs

- **ADR 0023 — Plans reference live artifacts, never stack-fragile literals; auditors calibrate the inert-slice patterns.** Records: (a) construct locators / self-discovery / canonical-export / dotted-path / next-free-patch as the ratified authoring forms, backed by the advisory `plan-literal-lint`; (b) the four auditor calibration rules and their "demote only when the live artifact confirms" floor; (c) the cross-slot version-consistency test as the enforced form of the manual release-audit protocol. Cross-references ADR 0008 (git is resume truth), ADR 0013 (intent/disposition), ADR 0006 (deterministic test floor / self-discovery gate).

No amendment to existing ADRs is required; this spec extends their surfaces without contradicting them.

## 8. Open risks / implementation notes

- **Ordering vs. the audit-gate-verdict-fidelity spec.** Both edit `agents/war-auditor.md`, `auditPrompt()`, and the `workflow-template.test.mjs` both-surfaces test. Build this **after** `docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md` lands so the calibration subsection is appended to the settled severity/disposition surface, not rebased under it. If the campaign stacks them, this plan's base is that spec's tip.
- **Lint precision vs. noise.** The `plan-literal-lint` version-literal pattern (`v?\d+\.\d+\.\d+` inside a release task) can false-positive on a legitimately-cited *baseline* version. Keep it advisory and scoped to release-named tasks; a false hit costs a glance, not a block. Ponytail: single regex module, no AST.
- **Anchor fragility on the both-surfaces test.** Per `[shared-string-constant-quote-literal-byte-anchor-fragility]`, anchor the drift test on a mid-sentence semantic phrase, not a literal containing quote marks or capitalization that a future normalization would flip.
- **Calibration must not become a blanket amnesty.** Each rule is gated on live-artifact confirmation; the drift test locks the *presence* of the "only when confirmed" qualifier so a future edit cannot silently widen a rule into an unconditional downgrade.
- **Version-consistency test placement.** It reads repo-root files from under `skills/`; use a path relative to the test file's own location (not cwd) so it is cwd-independent like the shell tests.

## 9. Non-goals / deferred

- **A CI-blocking plan lint.** The plan-literal lint is advisory/fail-open by decision; the only CI job stays the memory redaction lint. Promoting it to a hard gate is deferred (needs a false-positive burn-in first).
- **A matrix row-count lint** (`[drift-matrix-stated-vs-covered-cells]`). Enforcing "test-row count == rows × columns" mechanically needs parsing the stated matrix dimensions out of prose — deferred as a non-goal; the enumerate-all-cells meta-comment convention is the ratified fix.
- **Auto-rewriting existing stale plans.** This spec governs *new* authoring + *ongoing* auditing; it does not sweep historical `docs/plans/` for existing literals.
- **Changing `resolveGate` or the gate mechanism.** The self-discovery gate is correct as-is; this spec only routes authors to reference it by name.
- **Version *value* assertion.** The cross-slot test asserts internal equality only, never a specific version (that would rot every release).

## 10. Validation criteria (concrete, testable)

1. `skills/war-strategy/SKILL.md` §2 contains the "reference the live artifact, never a stack-fragile literal" convention with all six rules (construct locator, self-discovery gate, canonical export, dotted path, next-free-patch, grep-floor) **and** the defined-but-not-yet-emitted "produced in Task N" annotation; `war-strategy-structure.test.sh` locks each new line verbatim and fails if any is removed.
2. `skills/war-strategy/assets/plan-literal-lint.mjs` exists and, on a fixture plan containing a `:120-140` ref, a literal `foo.test.sh` gate list, an "ALL FIVE suites" count, and a `v0.14.9` in a release task, reports one hit per pattern; on the construct-locator/self-discovery/next-free-patch rewrites of the same plan it reports zero. Default exit 0; `--strict` exits non-zero on any hit. `plan-literal-lint.test.mjs` passes under `node --test`.
3. The new `version-consistency.test.mjs` passes on the current tree (all four slots equal at 0.14.14) and **fails** when any one slot is mutated to a different version — including the `marketplace.json plugins[0].version` slot specifically.
4. `agents/war-auditor.md` contains the four calibration rules (line/gate/version drift; defined-but-not-yet-emitted cross-link; file-list location gap / cascade; grep-sweep floor), each carrying the "only when the live artifact confirms" qualifier.
5. The same four calibration anchors appear in the built `auditPrompt()` output from `skills/war/assets/workflow-template.js`; the both-surfaces drift test in `workflow-template.test.mjs` asserts each anchor is present in **both** the standing `.md` and the dispatched prompt, and fails if either drops it.
6. `skills/war-machine/SKILL.md` release-drafting prose emits a "next free patch above the live base" directive and contains no hardcoded `v<semver>` release target.
7. `skills/red-team/assets/workflow-scaffold.js` `executable-proof` probe prompt explicitly names extraction+execution of plan-authored `requiresTest:false` verification commands; `workflow-scaffold.test.mjs` asserts it.
8. `skills/survey-corps/SKILL.md` carries the grep-as-floor manual-survey convention.
9. `CONTEXT.md` defines: construct locator, stack-fragile literal, defined-but-not-yet-emitted slice, grep as floor, stale-looking-but-correct calibration.
10. `docs/adr/0023-*.md` exists and records the authoring-convention + calibration + cross-slot-test decisions with the ADR 0008/0013/0006 cross-references.
11. Full suites stay green: `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, and `node skills/_shared/war-memory.mjs lint docs/learnings/`.
12. Trailing release phase bumps all four version slots to the next free patch above 0.14.14, resolved at land time (no literal in the plan), and the new `version-consistency.test.mjs` is green at that bump.
