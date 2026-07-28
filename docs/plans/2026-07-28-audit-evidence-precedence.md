# Audit evidence precedence — per-claim-shape ladders for every evidence-handling role

Source spec: [docs/specs/2026-07-28-audit-evidence-precedence-design.md](../specs/2026-07-28-audit-evidence-precedence-design.md)
(ratified via `/grill-with-docs` 2026-07-28; design tree D1–D5 resolved there — this plan carries no
re-litigation of those decisions). The spec must be committed on the working branch before `/war`
runs: task workers cite its sections by number.

## Commander's Intent

- **Purpose:** every evidence-handling role in WAR judges claims against one ratified precedence
  doctrine, so verdicts stand on the right surface and cross-rung contradictions surface as
  recorded signal, never silence.
- **Method:** four closed claim-shape ladders (`content-at-pin`, `execution`, `history`,
  `authority`) plus universal floor rules; full ladders on the auditor card, token skeletons on the
  dispatched-prompt and Lead/servitor surfaces (progressive disclosure); token-anchored drift
  guards land in the same task as their mirrors; pre-existing role disciplines (ADR 0007, 0008)
  are cited as instantiations, never restated. Docs-tier workers run fable/high for this
  implementation (run config, not plan structure — see Notes).
- **End state:**
  1. `agents/war-auditor.md` carries an `## Evidence precedence` section with all four ladders and
     both floor clauses (token-greppable: the four shape names, `never the top rung`,
     `never evidence`).
  2. `auditPrompt()` and the gate-audit seat prompt carry the skeleton; the both-surfaces registry
     row reds on a one-sided edit of card or prompt.
  3. `skills/war/SKILL.md`'s phase-close and Gate-2 bullets carry the three Lead bindings +
     skeleton; a `skill-doc-contracts.test.mjs` row pins its tokens.
  4. The `agents/war-servitor.md` diff is exactly one added cross-reference line.
  5. `CONTEXT.md` `### Audit` gains **claim shape**, **evidence rung**, **rule + record**, each
     with an `_Avoid_` line.
  6. A new ADR at the next free number records D1–D5, the ladders, and the two rejected
     alternatives, cross-referencing ADR 0007/0008/0025.
  7. The AuditVerdict schema is byte-unchanged.
  8. The dispatched prompt surface carries no full ladder — shape-name occurrences there ≤ the
     skeleton block.
  9. All four release slots bumped in lock-step to the next free patch above the live base;
     `version-slots.test.mjs` green.

## Build order (for /war)

Phase 1 — doctrine + guards (one phase, two waves: 1.1 alone, then 1.2 ∥ 1.3).
Phase 2 — release (trailing, own phase per the decomposition rule).

## Phase 1 — Doctrine and guards

### Task 1.1: Doctrine record — ADR, glossary, servitor cross-reference

- Files: `docs/adr/0041-audit-evidence-precedence.md`, `CONTEXT.md`, `agents/war-servitor.md`
- Plan slice: Author the ADR per spec §7 — resolve the number as the **next free** in the live
  `docs/adr/` listing at the task base (0041 as measured 2026-07-28; the `Files:` name above
  follows the resolved number — non-authoritative literal) — recording D1–D5 (spec §3), the four
  ladders and floor rules (spec §4.1–4.2), and the two rejected alternatives (total order; runtime
  schema field), with Status/Context/Decision/Consequences in the house ADR style and
  cross-references to ADR 0007, 0008, 0025. Add the three glossary terms to `CONTEXT.md`'s
  `### Audit` section per spec §6 — **claim shape**, **evidence rung**, **rule + record** — each
  with its `_Avoid_:` line (including the `execution`-shape vs `execution-evidence`-lens
  disambiguation). Append exactly one cross-reference line to `agents/war-servitor.md` naming
  verify-on-write (ADR 0007) as the servitor's instantiation of the evidence floor rules, citing
  the new ADR by its resolved number (End state 4: the diff to that file is one added line).
  Before writing, grep the existing doc-contract suites for assertions that read `CONTEXT.md` or
  `agents/war-servitor.md` and confirm the additions land outside every pinned extraction region
  (a spliced insertion that orphans an existing comment/anchor is the recorded `#1034`-class rot).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Auditor card + dispatched prompt + both-surfaces registry row

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Add the `## Evidence precedence` section to `agents/war-auditor.md` — the full four
  ladders and universal floor rules, spec §4.1–4.2 verbatim in substance (rung order, the SOFT/HARD
  anchors, the lesson citations), citing the ADR landed by Task 1.1 by its resolved number (read it
  from the rebased tip — first action is the dep rebase). Append the compact token skeleton (spec
  §4.4: four shape names + `never the top rung` + `never evidence` + a pointer to the standing
  card) to the string-built `auditPrompt()` **and** the gate-audit seat prompt in
  `workflow-template.js` — the standing/dispatched split requires both surfaces in this one commit.
  Add one both-surfaces registry row to `workflow-template.test.mjs` binding the skeleton tokens on
  card and prompt (token-anchored, never byte-pinned — sanctioned rewording latitude on either side
  must not false-red); follow the existing registry-row idiom in that suite, and do not mirror any
  sibling row's shape without re-verifying each copied assertion against these two surfaces (the
  recorded donor-omission trap). End state 8 check in-task: shape-name occurrences on the prompt
  surface ≤ the skeleton block. The AuditVerdict schema and every enum are untouched (End state 7).
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: Lead bindings + doc-contract row

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: Add the three Lead bindings (spec §4.3) to `skills/war/SKILL.md` — (1) close-out
  evidence gathered at the plan's branch tip in a dedicated worktree, never the main checkout;
  (2) remote truth via `ls-remote`, citing ADR 0008 rather than restating it; (3) a claim the Lead
  threads into a dispatch prompt becomes rung 1 of `authority` for the receiving agent, so the Lead
  grounds it at `content-at-pin`/`execution` first or marks it unverified — as skeleton + pointer
  to the ADR landed by Task 1.1 (resolved number from the rebased tip), attached to the existing
  phase-close and Gate-2 bullets (find the anchor bullets by their named constructs, not line
  numbers). Add one row to `skill-doc-contracts.test.mjs` pinning the SKILL.md skeleton tokens,
  following that suite's extraction-region idiom (marker-to-heading, markup-tolerant); the row is
  token-anchored per spec §4.4.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four release slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four version slots in lock-step to the **next free patch above the live
  integration base at land time** (never a plan literal; re-read the slots at the rebased tip).
  Replace the README `## Status` paragraph in place, authored against the
  `### Status-blurb authoring checklist` in `## Releasing` and answering each item in the done
  report. `version-slots.test.mjs` is the arbiter (lock-step, monotonic floor, undersell guard,
  checklist presence lock). Describe: the four claim-shape ladders, which surfaces carry full text
  vs skeleton, the two new guard rows, and the fact that no engine code path or schema moved —
  scoping that label per checklist item 5.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Seats actually practicing **rule + record** (cross-rung contradictions filed as
  `disposition: note` findings naming both rungs) · why deferred: the ladder is judgment guidance —
  prompt-enforced, deliberately schema-free (spec §9), so no pre-merge check can prove live seat
  behavior · runner: `/war-review` over the next completed multi-seat `/war` run (pairs naturally
  with the #1179 denial-rate comparison, same run).
- Lead phase-close bindings exercised as behavior (not just text) · why deferred: the refiner/main
  scope hook fail-opens — Lead doctrine is prompt-enforced and only its text is guarded (spec §8)
  · runner: the next campaign close / Gate-2 pass, self-audited against the three bindings.

## Notes / conscious deviations

- **Run config (operator-directed, 2026-07-28): default profile, all worker tiers fable/high.**
  Launch with `.claude/war/config.json` on the default (`balanced`) profile plus the operator's
  worker override — `agents.worker: { model: 'fable', effort: 'high', docs: { model: 'fable',
  effort: 'high' }, fix: { model: 'fable', effort: 'high' } }` — so every worker spawn (base,
  docs-tier, and fix/ace rounds) runs fable/high. Auditor, servitor, and red-team stay at the
  profile defaults (`DEFAULTS` in `war-config.mjs` is the arbiter). With all three tiers pinned
  identically, the docs-vs-base mechanical classification (Task 1.1 all-`*.md`; Tasks 1.2/1.3
  mixed) no longer changes model or effort anywhere — it remains dispatch bookkeeping only.
- **The `deps: [1.1]` edges are content dependencies, not collision dodges** — file sets are fully
  disjoint. 1.2 and 1.3 cite the new ADR by its resolved number, which 1.1 authors; per the
  2026-07-27 execution-outcome correction on the standing-doc sweep's red-team report, a task
  citing a sibling-authored artifact takes a real wave edge (same-wave "lands together" is not
  "builds together" — every worktree is cut from the frozen phase base).
- Spec §8 flags the `execution` shape name's one-token distance from the reserved
  `execution-evidence` lens; the CONTEXT.md `_Avoid_` line (Task 1.1) is the ratified mitigation.

## Open decisions

- **Done-report placement** (below all mechanical evidence in every ladder, above nothing) is the
  one rung not forced by a recorded lesson — spec §8 flags it for `/red-team` attention: confirm
  or re-rank during validation.
