# Interview & authoring contract — one interview, one artifact

WAR owns its front door: the Dry-Run Interview discipline ships in-repo as canonical authoring
doctrine, **one interview runs to completion and produces one merged artifact** — a plan whose
first half is the ratified decision record and whose second half is the decomposed phases — and
that merged shape becomes the **uniform execution artifact on every path** (interactive and
AFK). Standalone specs survive only as *input* shapes. Zero engine, hook, floor, or schema
changes; Part 2 keeps today's exact plan headings so extraction is untouched.

## 1. Context — the gap / problem

The pipeline's front door is its only stage with no ratified discipline. `/grill-with-docs` —
the README's "Required Auxiliary Plugin" — is a 7-line stub routing to `/grilling` (5
sentences) (verified: `~/.claude/skills/grill-with-docs/SKILL.md`,
`~/.claude/skills/grilling/SKILL.md`, read 2026-08-04), while README §Required Auxiliary Plugin
attributes to it a design-tree walk "until the result is unambiguous and cleanly
phase-decomposable" that the stub does not contain (verified: `README.md`). `/war-machine`'s
adversarial grill agent invokes "the full question tree grill-with-docs would have asked" — a
tree defined nowhere, reconstructed from training memory (verified:
`skills/war-machine/SKILL.md` §2).

The two-artifact pipeline (spec, then plan) makes the user run **two interviews** and pays a
measured defect tax at the conversion seam:

- Across the 10 newest red-team reports, a 57-finding classification measured ~40% *false repo
  facts*, ~35% *under-specification* (`needsDecision`), ~19% *validations unprovable or vacuous
  at the base* (verified: 18-agent fan-out over `docs/red-team/`, 2026-08-04 session; that
  session's classification, not a committed artifact). Conversion invents what the interview
  never extracted; spec §10 criteria drop between files; intent is drafted at conversion
  instead of elicitation.
- Operator-relayed user feedback: "need to improve my requirements for sure… Getting to the end
  of a run and it's just a bit imprecise. Tests too" (user).
- Spec→plan pairing is 1:1 in 99 of 116 cases by exact slug (verified: slug join over
  `docs/specs/` × `docs/plans/`, 2026-08-04); the lone deliberate 1:N
  (`2026-06-29-submodule-support` → increments 1–2) is modeled by the roadmap layer, not the
  file split.
- The Dry-Run Interview meta-prompt's own deliverable is already the merged shape — decisions,
  assumptions ledger, and build phases in one document (user-provided:
  `Refined MetaPrompt.md`). The split is WAR's deviation.

0.15.1 hardened validation (ADR 0043 `ADJUDICATED`, guard-split deps-edge — verified:
`git log eb651a5..382dba1`) and touched no authoring surface. This spec is the authoring-side
counterpart.

## 2. Pivotal constraints

- **Extraction compatibility (hard):** Part 1/Part 2 is prose framing, never heading nesting.
  Part 2 carries today's exact H2 headings — `## Commander's Intent`, `## Build order`,
  `## Phase N — <name>`, `## Deferred validations (backstops)`, per-task `Files:` back-ticked
  comma-separated — so `/war` decompose, intent extraction (both ADR 0014 headings), backstop
  surfacing, and the campaign ledger's `extractFiles` run unmodified.
- **ADR 0042 (hot/cold law):** doctrine lives in a `references/` file behind a one-line trigger
  pointer; budgeted-surface growth cites the justification rule.
- **ADR 0017:** new required sections use the backstop vehicle — required, explicit `None`,
  red-team-graded; no prose waivers.
- **ADR 0013 / 0014:** Commander's Intent is never invented or defaulted — echo-back confirm;
  under `--afk`, AI-authored rows carry per-row `AI-declared` markers (ADR 0043 row pattern).
- **ADR 0007:** artifact evidence tags map onto the provenance ladder in one glossary entry but
  keep distinct syntax (ADR 0024 tier-collision precedent).
- **`plan-literal-lint.mjs` is ratified report-only** — all new rules advisory; nothing fails
  closed at authoring or intake.
- **Engine untouched:** no change to `workflow-template.js`, hooks, floors, schemas, `/war`
  intake. Slot consumption is the follow-on precision-chain spec.
- **Structure-test lock-step:** every ratified sentence lands with its pin in the same task,
  presence + retired-wording-absence (the 0.15.1 pattern).

## 3. Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Spec boundary | Full authoring contract: doctrine + templates + pins + advisory lint + directives + README + CLAUDE.md/war-help cascade + ADR + CONTEXT.md; engine out | (user — Q1) |
| D2 | Entry point | Self-sufficient: `/war-strategy` bare-invoke runs the interview from the references file; Grill Me demoted to recommended front door, bound via the HANDOFF DIRECTIVE when installed | (user — Q2) |
| D3 | Doctrine home | `skills/war-strategy/references/plan-interview.md` — one home; war-strategy and war-machine consume by reference | [assumed: war-strategy owns the templates — if wrong: byte-identical move] |
| D4 | Evidence-tag syntax | `(user)` / `(verified: <source> at <base>)` / `[assumed: default — if wrong: <consequence>]`; one CONTEXT.md entry maps onto the ADR 0007 ladder | (user — Q3) |
| D5 | Done-when law | `Done when: <command>` required iff `requiresTest: true` (`None` + basis elsewhere); every End state carries one tag from the closed set `check:` \| `gate:` \| `HARD at audit_sha` (observable + judge seat) \| `backstop:` row | (user — Q4) |
| D6 | Enforcement | Ledger + backstop-candidates = required sections with explicit `None`; tags + End-state form = template law for new artifacts, advisory lint + red-team grading; legacy grandfathered | (user — Q5) |
| D7 | Adoption bet | Authoring weight is borne on both paths; checkable via round telemetry | (user — Q6) |
| D15 | **Collapse** | One interview to completion → one merged artifact: Part 1 decision record + Part 2 decomposed phases, at `docs/plans/YYYY-MM-DD-<slug>.md` | (user — Q8 turn) |
| D16 | **Uniform reach** | The merged shape is the universal execution artifact — war-machine AFK conversion emits it too (Part 1 = decision digest from the source spec); red-team and /war face one shape | (user — Q8) |
| D17 | Vocabulary | **Plan** = the self-contained merged artifact; **spec** = standalone decision record, valid as *input only* (survey-corps AFK intermediate, external drafts) | [assumed: minimal glossary churn — if wrong: rename at conversion] |
| D18 | Criteria unification | Spec-§10-style validation criteria and plan End states unify: one numbered End-state list in Commander's Intent, each bullet tagged per D5 — the carryover hole dies by construction | [assumed: consequence of D15 — if wrong: reintroduce a separate criteria section] |
| D19 | Single ledger | One `## Assumptions ledger` (Part 1); conversion/AFK carries rows forward or retires with stated reason | [assumed: consequence of D15] |
| D8 | Question budget | Default 14, status-line-visible, operator-raisable | [assumed — if wrong: one line] |
| D9 | Gap-review interviews | Same question contract binds with-artifact reviews | [assumed] |
| D10 | Lint home | Extend `plan-literal-lint.mjs`; no sibling | [assumed] |
| D11 | Issue-derived claims | `(verified: issue #N (<date>))` source form | [assumed] |
| D12 | Staleness rule | Conventions gain: literals are dated snapshots at a stated base; re-measure at the task's rebased base | [assumed] |
| D13 | ADR count | One ADR ratifies contract + collapse + placement reversal | [assumed — if wrong: split] |
| D14 | AFK provenance | AI-authored rows/tags carry per-row `AI-declared` | [assumed] |

## 4. Mechanics

### a. `skills/war-strategy/references/plan-interview.md` (new — the doctrine)

The Dry-Run Interview adapted to WAR, running **once to completion** and producing the merged
plan. Stages: **(0)** silent recon — tree, `CONTEXT.md`, `docs/adr/`, related plans, fail-open
`war-memory.mjs query '<slug> plan-authoring' --repo docs/learnings`; **(1)** silent rehearsal +
pre-mortem naming ≥2 landmine falsifiers from the WAR probe list: same-file collisions,
unregistered mirrors, default-flip surface enumeration, guard-split deps edges, submodule/repo
boundaries, release slots, frozen-base staleness, gate discoverability; **(1b)** private
full-template draft before Q1, every slot filled and tagged (D4); unknowns binned
settled / executor's-latitude / default-and-tag / fork (necessity test: name the two plans the
answer forks between; intent material never default-and-tagged); **(2)** the interview — status
line (`Locked · Open forks · Qk/14`), one question per turn, `Recommended:` with graded basis,
bare-assent semantics, ≥2 falsifiers early; **(3)** one mid-budget checkpoint on the riskiest
assumption; **(4)** coverage sweep, then **two echo-backs in the closing sequence**: the decision
record (Part 1) with the Defaulted-decisions recap, then the decomposed phases (Part 2, drafted
silently via the §3 code-boundary rules); **(5)** two silent gates — completeness (provenance
scan: an untagged claim of fact is a bug; memory/training never a `(verified:)` source) and the
executor gate: *"could `/war` decompose-dispatch this, and `/red-team` attack it, with zero
operator questions?"* Terminal state: the merged plan at `docs/plans/YYYY-MM-DD-<slug>.md`.
When rehearsal shows the work exceeds one plan (the rare 1:N), the deliverable is N merged
plans + a roadmap — the roadmap layer, not a file split. Stop rules: saturation, completion
bar, budget exhaustion (default-and-tag the rest), operator exit.

A **decisive-slots table** hard-links extraction to consumers: criteria + checks → tagged End
states (D18); constraints/landmines → `## Pivotal constraints` → red-team probe derivation;
file footprints → per-task `Files:` → decomposition rule 1 + contention; deferred-validation
candidates → `## Deferred validations (backstops)`; target repos → rule 3; mirrors /
default-flips / guard-splits → rules 5–7; assumptions → the ledger → red-team's
`[assumed]`-first probes; terms → CONTEXT.md; triad-passing choices → ADRs.

### b. `skills/war-strategy/SKILL.md` — the merged plan template

§2's plan template absorbs the decision record; the spec template is relabeled **input shape**
(unchanged sections, plus D4 tags and the §10 check-form so AFK specs arrive tagged). Merged
template, flat H2s throughout:

```
# <Title — the change in one line>
## Context — the gap / problem            ← tagged claims (D4)
## Pivotal constraints
## Resolved design tree                   ← table: decision → resolution → source
## Assumptions ledger                     ← assumption · basis · blast radius · check (or None)
## Non-goals / deferred
## New domain terms · Recommended ADRs
## Commander's Intent                     ← Purpose / Method / End state: numbered, each tagged
                                            per D5 — the unified validation criteria (D18)
## Build order (for /war)
## Phase 1 — <name>
### Task 1: <name>
  - Files: … · Plan slice: … · Done when: <command|None+basis> · requiresTest · requiresPackaging
    · deps · target repo
## Deferred validations (backstops)       ← required; explicit None allowed
## Notes / conscious deviations · Open decisions
```

§1's dependency check becomes a recommendation. §4 gains the ADR 0042 pointer (*when authoring
a plan from scratch, read `references/plan-interview.md`*); bare-invoke runs the interview
itself; the HANDOFF DIRECTIVE widens (intent interview + author-into-the-merged-template);
with-artifact review converts external drafts and legacy specs **into the merged shape**, with
gap rows for untagged claims, missing ledger, untagged End states, and Done-when absences. The
"Reference the live artifact" conventions gain the D12 staleness sentence. Gap interviews bind
to the D9 contract.

### c. `skills/war-machine/SKILL.md` + `references/afk-conversion.md`

Conversion emits the **merged shape**: Part 1 is a decision digest distilled from the source
spec (citing it and its issues per D11), Part 2 the drafted phases. The grill agent's charter
replaces the training-memory question tree with "run `references/plan-interview.md`'s falsifier
probes and provenance scan against the draft." New **sandbox-execution duty**: any behavioral
claim ("X passes / REDs against live subject Y at base Z") is executed once at conversion, not
read, its result recorded beside the claim. `--afk`: D14 `AI-declared` markers per row.

### d. `skills/survey-corps/SKILL.md`

Unchanged role (specs remain its output — the AFK input shape); one directive: tag every
synthesized claim per D4/D11 so invention is visible and vetoable.

### e. `skills/red-team/SKILL.md` (Step 1 wording only)

Source-of-truth resolution gains the merged arm: a plan whose Part 1 carries the decision
record is its own source of truth (`--spec` defaults to the plan itself; plan-vs-spec probes
become Part-2-vs-Part-1 internal-coherence probes). `artifactKind` heuristic is already
compatible — a `docs/plans/` file with per-task `Files:` under `## Build order` classifies
`impl-plan` (verified: `skills/red-team/SKILL.md` Step 2).

### f. `skills/war-strategy/assets/plan-literal-lint.mjs`

New advisory rules: untagged End-state bullet; `requiresTest: true` without `Done when:`;
missing `## Assumptions ledger`; untagged factual claim shape in `## Context`; vague-trigger
vocabulary ("properly", "correctly", "coherent") in End states.

### g. Structure tests

`war-strategy-structure.test.sh`: pins for the merged template's section set, the tagged
End-state form, `Done when:`, the ledger heading, the §4 pointer, the D12 sentence — presence +
old-absent (retired two-template wording). `war-pipeline-structure.test.sh`: pins for
war-machine's merged-output directive, grill charter, sandbox-execution duty.

### h. Doc cascade — `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`, `CONTEXT.md`

README §Required→§Recommended Auxiliary Plugin (WAR owns the doctrine; shells are optional
front doors; drift rationale retired as inverted). The pipeline-gospel prose ("**A spec is not
a plan**", "/grill-with-docs authors the spec") is rewritten on every surface that carries it —
grep-swept old-absent: the plan carries its ratified decision record; a spec is a standalone
decision record used as input. CONTEXT.md: **Plan** and **Spec** redefined per D17; new terms
Evidence tag (with ladder mapping + _Avoid_: memory/training as a verified source), Assumptions
ledger, Done-when, Decisive slot, Executor gate (authoring). Status blurb per release-slot law.

### i. New ADR (next free number)

Ratifies: the authoring output contract (D4–D6, D18–D19), the **one-interview one-artifact
collapse and its uniform reach** (D15–D16, with the 99/116 pairing evidence and the extraction-
compatibility constraint), and the doctrine-placement reversal (D2). Supersedes the README's
required-and-not-reimplemented stance.

## 5. Surface changes

- `skills/war-strategy/references/plan-interview.md` (new)
- `skills/war-strategy/SKILL.md` · `war-strategy-structure.test.sh` ·
  `assets/plan-literal-lint.mjs` (+ test)
- `skills/war-machine/SKILL.md` · `war-pipeline-structure.test.sh` ·
  `references/afk-conversion.md`
- `skills/survey-corps/SKILL.md` · `skills/red-team/SKILL.md` (Step 1 arm)
- `README.md` · `CLAUDE.md` · `skills/war-help/SKILL.md` · `CONTEXT.md`
- `docs/adr/<next>-authoring-contract-and-merged-artifact.md`
- Release: four version slots, own trailing phase

## 6. New domain terms (CONTEXT.md)

Plan (merged, self-contained) · Spec (input shape) · Evidence tag · Assumptions ledger ·
Done-when · Decisive slot · Executor gate (authoring). Glossary-only.

## 7. Recommended ADRs

One (D13): "Authoring contract & the merged plan artifact" — hard to reverse (artifact shape
ripples through every downstream consumer), surprising without context (reverses both the
README stance and the spec/plan gospel), real trade-off (two-file separation of concerns vs
one-seam defect tax; collapse chosen on 99/116 pairing + measured seam defects).

## 8. Open risks / implementation notes

- **Doc-cascade breadth:** the spec-is-not-a-plan gospel lives on several surfaces; the sweep
  must land new-present AND old-absent in one phase, with the leader-strip-before-normalize
  grep discipline the learnings record.
- **Extraction regression:** the merged template's Part 1 sections must never collide with the
  H2s extraction greps; the structure test pins the exact Part 2 heading set (presence) and the
  template's own example headings are the fixture.
- **Budget pressure (ADR 0042):** §2 grows; justification rule in the commit body if the
  advisory line trips.
- **Box-ticking backfire:** mandatory tags invite vacuous checks — pre-mortem includes the
  delete-the-feature probe; lint stays advisory; backstop-legitimacy grades `judge:` tags.
- **Merged-doc length:** ~1.5–2× today's plans; red-team fingerprints headings (unaffected);
  human navigation rests on the fixed section order.
- **In-flight artifacts:** existing specs/plans are grandfathered (D6); with-artifact
  conversion upgrades a legacy pair into one merged doc on request, never retroactively.
- **This spec's own shape** is the legacy input shape (it predates the merged template it
  ratifies) — expected; it converts into the first merged plan at conversion time, per D17.

## 9. Non-goals / deferred

- Engine/floor/schema consumption of the slots (`doneWhen` parsing, `assert-done-when.sh`,
  gate-log verification, `unverified` handoff status) — the **precision-chain spec**.
- Red-team round accounting / route-upstream — the **loop-breaker spec** (sequenced after; its
  route-upstream destination is this interview).
- `/war-review` plan-quality telemetry — with the loop-breaker.
- Survey-corps emitting merged docs directly (total collapse) — rejected: AFK synthesis keeps
  its ratification intermediate.
- Track playbooks; a new interview slash command; upstream Grill Me PRs; `/war` intake changes.

## 10. Validation criteria

- V1 WHEN `/war-strategy` is invoked bare with no Grill Me family installed THE SESSION SHALL
  proceed into the interview per `references/plan-interview.md` and terminate only on a merged
  plan file · check: §1/§4 wording + structure-test pin; interview doctrine names the terminal
  artifact.
- V2 WHEN the structure tests run THE SUITE SHALL fail if any ratified merged-template internal
  (section set, tagged End-state form, `Done when:`, ledger, pointer, D12 sentence) is absent
  or the retired two-template wording returns · check: both structure tests green; each new pin
  proven red once against a mutated copy during development.
- V3 WHEN `plan-literal-lint.mjs` runs against a fixture violating each new rule THE LINT SHALL
  report every violation and exit 0 without `--strict` · check: one lint test case per rule.
- V4 WHEN war-machine converts a spec THE OUTPUT SHALL be one merged-shape plan (Part 1 digest
  citing the source spec) and the grill prompt SHALL reference `plan-interview.md`; the
  training-memory question-tree wording SHALL be absent · check: SKILL grep new-present +
  old-absent; pipeline-structure pins.
- V5 WHEN the doc cascade lands THE retired gospel wording ("A spec is not a plan" as current
  doctrine; "required" Grill Me framing) SHALL be absent across README, CLAUDE.md, war-help,
  war-strategy, CONTEXT.md, and the new wording present on each · check: repo-wide sweep grep,
  new-present AND old-absent per surface.
- V6 WHEN `/red-team` is pointed at a merged plan with no `--spec` THE SKILL SHALL treat the
  plan's Part 1 as the source of truth · check: Step 1 wording grep.
- V7 WHEN a merged plan authored under this contract reaches `/war` THE decompose extraction
  SHALL find intent, phases, tasks, and backstops unchanged · check: run the template's example
  doc through the existing extraction greps in a sandbox (analyzed, no engine edits).

**Deferred-validation candidates:** adoption telemetry (red-team rounds per plan trending down
over the next campaign) · why deferrable: needs a campaign of field data · runner:
`/war-review` rows (ratify in the loop-breaker spec) · interview-length telemetry (questions
per merged plan vs the old two-interview total) · why deferrable: same · runner: same.
