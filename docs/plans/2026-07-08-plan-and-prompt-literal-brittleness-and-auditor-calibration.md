# Kill stack-fragile literals; calibrate auditors to inert-slice patterns — implementation plan

**Source spec:** `docs/specs/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration-design.md`
**Slug:** `plan-and-prompt-literal-brittleness-and-auditor-calibration` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** lands **after** plan 2 (`audit-gate-verdict-fidelity` — spec-declared: the calibration subsection appends to the settled severity/disposition auditor surfaces) **and** plan 3 (`drift-guards-for-mirrored-and-asserted-facts` — owns the four-slot version test this spec duplicated, and edits the same `war-strategy` SKILL/structure-test pair).

## Commander's Intent

**Purpose.** Kill stack-fragile literals at authoring time and stop auditors re-litigating the four known correct-but-stale-looking patterns — plans reference live artifacts (construct locators, the self-discovery gate, canonical exports, dotted paths, next-free-patch), and the calibration is written once into the auditor surfaces instead of re-derived per seat, per pass.

**Method.** A "reference the live artifact, never a stack-fragile literal" convention block lands in the `/war-strategy` plan template (§2) with per-field rules — construct locators over `:N-M` ranges, `resolveGate` by name over suite enumerations/counts, "append to the canonical export" over restated array literals, dotted paths over flat-key abbreviations, "next free patch above the live base" over version literals, the "defined-but-not-yet-emitted; produced in Task N" annotation, and the grep-as-floor survey rule — each locked verbatim by `war-strategy-structure.test.sh`. A new advisory `plan-literal-lint.mjs` (modeled on `war-memory.mjs`'s `LINT_PATTERNS`/`lint()` shape; report-and-exit-0, `--strict` opt-in; never a CI gate) mechanically flags the cheap literals at conversion and in `/red-team`'s spine. `/war-machine` gains the next-free-patch release directive. Four **stale-looking-but-correct calibration** rules land in `agents/war-auditor.md` (primary carrier — the only surface reaching the inline gate-audit seats) and mirror into `auditPrompt()` with a both-surfaces drift test — each rule gated on live-artifact confirmation, never a blanket amnesty. `/red-team`'s `executable-proof` probe explicitly extracts and runs plan-authored `requiresTest:false` grep guards; `/survey-corps` carries the grep-floor rule from the first authoring surface. ADR 0030 ratifies.

**End state** (each individually checkable):
1. `skills/war-strategy/SKILL.md` §2 carries the convention block with all six rules (construct locator, self-discovery gate, canonical export, dotted path, next-free-patch, grep-floor) plus the defined-but-not-yet-emitted annotation; `war-strategy-structure.test.sh` locks each new line verbatim and fails if any is removed. (spec criterion 1)
2. `skills/war-strategy/assets/plan-literal-lint.mjs` exists; on a fixture plan containing a `:120-140` ref, a literal `foo.test.sh` gate list, an "ALL FIVE suites" count, and a `v0.14.9` in a release task it reports one hit per pattern; on the compliant rewrites it reports zero; default exit 0, `--strict` non-zero on any hit; `plan-literal-lint.test.mjs` green under `node --test` with positive AND negative fixtures per pattern. (spec criterion 2)
3. `agents/war-auditor.md` carries the four calibration rules (literal drift; defined-but-not-yet-emitted cross-link; file-list location gap / cascade; grep-sweep floor), each with the "only when the live artifact confirms" qualifier. (spec criterion 4)
4. The same four calibration anchors appear in the built `auditPrompt()` output; the both-surfaces drift test in `workflow-template.test.mjs` asserts each anchor in **both** surfaces and fails if either drops it — anchored on casing/position-stable mid-sentence phrases, never quote-bearing byte literals. (spec criterion 5)
5. `skills/war-machine/SKILL.md` carries a release-drafting directive — "bump all four slots to the next free patch above the live integration base at land time" — and no hardcoded `v<semver>` release target. (spec criterion 6; delta: added new, no existing release prose to reword)
6. The `executable-proof` spine probe prompt in `skills/red-team/assets/workflow-scaffold.js` explicitly names extraction + execution of plan-authored `requiresTest:false` verification commands; `workflow-scaffold.test.mjs` asserts it. (spec criterion 7)
7. `skills/survey-corps/SKILL.md` carries the grep-as-floor manual-survey convention. (spec criterion 8)
8. `CONTEXT.md` defines the five terms: construct locator, stack-fragile literal, defined-but-not-yet-emitted slice, grep as floor, stale-looking-but-correct calibration. (spec criterion 9)
9. `docs/adr/0030-*.md` records the authoring conventions, the four calibration rules with their confirmation floor, and the lint's advisory placement, cross-referencing ADR 0008/0013/0006. (spec criterion 10; renumbered — see deltas)
10. Full suites green: `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, `war-memory.mjs lint docs/learnings/`. (spec criterion 11)
11. The four release slots move together to the next free patch, resolved at land time; plan 3's `version-slots.test.mjs` is green at that bump. (spec criterion 12, remapped — see deltas)

## Build order (for /war)

### Phase 1 — Conventions, lint, calibration, probes

Seven file-disjoint tasks, no intra-phase deps — run in parallel.

**Task 1.1 — Plan-template conventions + structure-test locks**
- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: Add the **"Reference the live artifact, never a stack-fragile literal"** convention block adjacent to the §2 plan template and thread the per-field rules (spec §4.1): locators name the enclosing symbol/comment header, `:N-M` reserved for flat config files qualified "approx., measured at base `<sha>`"; gate directives reference `resolveGate` in `war-config.mjs` by name, never a `*.test.sh` enumeration or a suite count; mirrored constants say "append to the canonical export — the drift guard is the arbiter", never a restated final literal; nested keys use dotted paths (`metadata.provenance`); release tasks say "next free patch above the live base"; the standing **"defined-but-not-yet-emitted; produced in Task N"** annotation for cross-slice mirrored constants/schemas/prose-refs; the **grep-sweep floor** note ("grep X, handle every match" requires a manual same-scope title/comment survey; stragglers are survey-derived corrections). Also name `plan-literal-lint.mjs` in the §4 conversion flow (war-strategy runs it on every plan it authors and surfaces hits in the conversion report). Extend `war-strategy-structure.test.sh` with fixed-string locks for each new convention line (the existing verbatim-line-lock mechanism). **Cross-plan note:** plan 3 (drift-guards Task 1.6) adds two other authoring rules to these same files — roadmap serializes; this task rebases onto them and appends, never rewords plan-3 lines.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — `plan-literal-lint.mjs` + test (new)**
- Files: `skills/war-strategy/assets/plan-literal-lint.mjs` (new; the `assets/` dir is new), `skills/war-strategy/assets/plan-literal-lint.test.mjs` (new)
- Plan slice: Regex module modeled on the `LINT_PATTERNS` array + `lint(text)` + CLI shape in `skills/_shared/war-memory.mjs` — no parser, no dependency. Patterns (spec §4.3, each cheap and high-precision): line-range ref (`:\s?\d+[-–]\d+` / `lines?\s+\d+[-–]\d+` on a Files/locator line); literal suite list (a `*.test.sh` token in the same directive as `gate`/`run`); suite count (`ALL\s+(FIVE|SIX|\d+)` / `all\s+\d+\s+suites?` near a gate directive); hardcoded version (`v?\d+\.\d+\.\d+` inside a task whose name matches `release` — advisory precisely because a legitimately-cited baseline version can false-positive). Prints `{pattern, match}` hits; exit 0 by default, non-zero only under `--strict`. **Fail-open by decision** — never a CI gate (the only CI job stays the redaction lint). Test: one positive and one negative fixture per pattern, delete-the-pattern-and-it-passes discipline.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.3 — `/war-machine` release directive**
- Files: `skills/war-machine/SKILL.md`
- Plan slice: **Add** (delta: verified at conversion — the file has zero existing release/version/bump prose to reword) a release-drafting directive to the conversion doctrine: when a drafted plan carries a trailing release phase, emit the directive form — "bump all four slots to the next free patch above the live integration base at land time; state the expected base and the standalone-fallback rule" — never a resolved `v<semver>` literal. Anchor at the with-artifact conversion doctrine construct.
- requiresTest: false (prose only)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Auditor calibration rules, both surfaces**
- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Add a **"Stale-looking-but-correct calibration"** subsection under the existing `## Latitude and disposition (ADR 0013)` block in `agents/war-auditor.md` — the primary carrier, since the inline gate-audit seats (`execution-evidence`, `end-state`) never call `auditPrompt()` and receive base clauses only via the standing file. Four rules, each demoting **only** on live-artifact confirmation: (1) plan-literal vs candidate divergence on a line range / suite count / version bump is a Nit at most when the construct, self-discovery gate, or worktree baseline confirms the candidate correct — never a hold; (2) a dangling ref at a task tip is a defect **only if** the plan lacks the "produced in Task N" cross-link — with it, Nit/`note`, confirmed at the post-merge integration tip; (3) an untouched plan file-list entry: confirm the guard's real home (grep the sibling/precedent) before flagging; a location gap or drift-guard-forced cascade touch is a faithful deviation (Nit), block only on a demonstrably-untrue claim; (4) a grep sweep is a floor — confirm the plan carried the same-scope manual survey before treating a surviving sibling as the worker's omission. Mirror the same sentences into `auditPrompt()` in `workflow-template.js` (same commit — prompt-surface split rule). `workflow-template.test.mjs`: both-surfaces drift test asserting one casing/position-stable **mid-sentence** anchor per rule appears in both the standing file and the built `auditPrompt()` output (the existing latitude/disposition both-surfaces pattern; never a quote-bearing byte literal — recorded anchor-fragility lesson), plus an assertion that each rule retains its "only when the live artifact confirms" qualifier (locks the amnesty floor against silent widening).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — Tighten the `executable-proof` probe**
- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: In the `executable-proof` spine probe definition (the `{ name: 'executable-proof', kind: 'spine', technique: 'executed' }` entry), tighten the prompt gist to **explicitly** extract plan-authored `requiresTest:false` verification commands (self-authored greps) and run them in the sandbox, flagging any that false-negate against a re-cased/re-positioned landing site — the recorded sentence-case false-negative class. Also state the compliant default the probe expects: prose-clause grep guards are case-insensitive (`grep -rin`) and anchored on a stable mid-sentence token. `workflow-scaffold.test.mjs`: extend the existing spine assertions (the test already pins the spine probe names) with a content assertion on the tightened gist.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — `/survey-corps` grep-floor convention**
- Files: `skills/survey-corps/SKILL.md`
- Plan slice: Mirror the grep-sweep floor rule into the survey step (spec §4.7): any token-sweep instruction the survey emits into a spec carries the mandatory manual same-scope title/comment survey note — so the discipline exists from the first authoring surface, not only at plan conversion. One convention paragraph, anchored at the spec-synthesis construct.
- requiresTest: false (prose only)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.7 — Doctrine docs: ADR 0030 + CONTEXT.md terms**
- Files: `docs/adr/0030-live-artifacts-over-stack-fragile-literals.md` (new), `CONTEXT.md`
- Plan slice: Author ADR 0030 per spec §7 (renumbered from the spec's stale "0023" — plans 1–5 claim 0023–0029; re-resolve against `docs/adr/` at land time): (a) construct locators / self-discovery / canonical-export / dotted-path / next-free-patch as the ratified authoring forms, backed by the advisory `plan-literal-lint`; (b) the four calibration rules and their demote-only-when-confirmed floor; (c) the cross-slot version test as the enforced release-audit form — **noting it ships in the drift-guards plan** (`version-slots.test.mjs`), this ADR only records the doctrine. Cross-reference ADR 0008, 0013, 0006. CONTEXT.md: the five terms verbatim from spec §6 — **Construct locator**, **Stack-fragile literal**, **Defined-but-not-yet-emitted slice**, **Grep as floor**, **Stale-looking-but-correct calibration**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1.

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it — this plan practicing its own next-free-patch directive). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Plan 3's `version-slots.test.mjs` (landed earlier in the campaign) must be green at the bump.
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Live calibration obedience** (auditors actually demoting per the four rules instead of re-litigating) · why deferred: the drift test proves the clauses exist on both surfaces, not that a live seat honors them · runner: the first `/war` run after landing (phase report shows the four patterns graded Nit/note where live-artifact-confirmed) + `/red-team`.
- **Lint precision burn-in** (false-positive rate of the four patterns, esp. the version literal on legitimately-cited baselines) · why deferred: advisory by decision until burn-in; promoting to `--strict`/CI needs observed precision · runner: `/war-strategy` conversion reports + `/red-team` spine over the next several plans.
- **Matrix row-count completeness** (`drift-matrix-stated-vs-covered-cells`) · why deferred: mechanically enforcing rows × columns requires parsing prose matrix dimensions — spec §9 non-goal; the enumerate-all-cells discipline remains spec-ratified doctrine, **not** authored into the war-strategy template by this plan (Task 1.1 ships the six named rules + the defined-but-not-yet-emitted annotation, no enumerate-all-cells convention) · runner: the auditor's `test-fidelity` lens at audit time (the sole runner this plan actually delivers; agents/war-auditor.md).
- **Grep-sweep sibling survival** (semantic completeness) · why deferred: same-meaning siblings in different words are not mechanically detectable — spec design tree keeps it a convention · runner: the survey-corps + war-strategy grep-floor notes and calibration rule 4 at audit time.

## Notes / conscious deviations

- **Four operator-ratified conversion deltas (2026-07-08 volley):** (1) spec §4.4's `version-consistency.test.mjs` is **dropped as a duplicate** — plan 3 (`drift-guards`) Task 1.1 builds `version-slots.test.mjs` from the same lesson with the same four-slot assertions; spec criteria 3 and 12 remap to that artifact, and this plan's ADR records the doctrine while plan 3 ships the test; (2) the ADR renumbers to **0030** — the spec's 0023 predates plans 1–5 claiming 0023–0029; (3) `skills/war-machine/SKILL.md` has **no existing release prose** (verified: zero version/bump/slot hits at conversion) — Task 1.3 adds the directive as new prose rather than rewording; (4) roadmap orders this plan **after plans 2 and 3** — plan 2 settles the auditor surfaces this plan appends to (spec §8), plan 3 owns the version test and edits the same war-strategy SKILL/structure-test pair.
- **Cross-plan contention (for the roadmap table):** `agents/war-auditor.md` + `workflow-template.js` + `workflow-template.test.mjs` shared with plans 2, 3, 5; `skills/war-strategy/SKILL.md` + `war-strategy-structure.test.sh` shared with plan 3; `skills/red-team/assets/workflow-scaffold.js`/`.test.mjs` unique to this plan (plan 3 touches red-team's SKILL.md + lenses.md — different files, no collision); `CONTEXT.md`, `docs/adr/`, release slots shared with all. Roadmap serializes; every task rebases onto landed content.
- **The lint lives in `skills/war-strategy/assets/`** (new dir) — it is a war-strategy authoring tool, and the `node --test 'skills/**/*.test.mjs'` glob reaches its test there.
- **Advisory, fail-open lint placement is ratified, not an oversight** (spec constraint 7 / §9): plans are not part of the `/war` gate; CI stays redaction-lint-only; promotion to a hard gate is deferred pending burn-in.
- **Calibration rules are floors with a locked qualifier** — the drift test asserts the "only when the live artifact confirms" phrase survives on both surfaces, so a future edit cannot silently widen a rule into unconditional amnesty (spec §8).
- **No historical plan sweep** (spec §9): the conventions govern new authoring; existing `docs/plans/` literals are out of scope.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all four deltas approved as-is.
