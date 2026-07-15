# Gate evidence and prose truth — engine-owned resolveGate composition, plus the coupled prose/doc-contract corrections

Plan file: `docs/plans/2026-07-14-gate-evidence-and-prose-truth.md`
Source spec: docs/specs/2026-07-14-gate-evidence-and-prose-truth-design.md
Issues addressed: #894, #887, #892, #893
Stacks on: nothing — manifest `dependsOn` is empty; base is the live master tip at campaign launch
(ADR 0011 stack order is campaign-decided; the 2026-07-14 siblings share only the four release slots)

## Commander's Intent

- **Purpose:** The dispatched gate string is enforced by prose alone: `resolveGate()` composes the
  self-discovering `*.test.sh` loop only behind the `--resolve-gate` CLI flag, while
  `workflow-template.js` interpolates raw `${plan.gate}` at all nine gate-bearing dispatch sites — so
  a Lead that misses Setup step 3 ships a shell-blind gate silently (five identical gate-audit
  findings across five seats prove it happens). Move composition into the engine (#894), then correct
  the three coupled prose drifts that same move re-baselines: unguarded `docs/specs/` code-fact prose
  (#887), the false zero-task entry-validation justification on two mirrored surfaces (#892), and the
  self-contradictory land-cwd bullet in a landed plan (#893).
- **Method:** Two stages, ordered hard (spec constraint 4): the #894 engine slice lands first — one
  coupled commit spanning `war-config.mjs` idempotence, the hand-mirrored inline composition point in
  `workflow-template.js` (sandbox cannot import; new mirror ⇒ its D2 registry row in the same task),
  the refiner card re-attribution, and the SKILL.md Setup step 3 belt-and-suspenders sentence — then
  the prose/doc-truth stage sweeps and guards against **post-#894** mechanics. Guardrails: the Lead's
  `--resolve-gate` pre-resolution stays (belt; engine is the suspenders); composition is idempotent so
  double resolution is harmless by construction; no guard, prompt, or assertion enumerates `*.test.sh`
  suites or counts (anchor on the discovery-clause token only); every locked prompt substring a clause
  edit touches is updated in the same commit, never loosened; every grep sweep is a floor with a
  mandatory manual same-scope survey recorded in the commit body; no enum/escalation surface moves
  (`land-decision.mjs`, `KNOWN_LAND_DECISIONS`, `HARD_ESCALATION_REASONS` untouched — ADR 0005);
  nothing in stage 2 "fixes" code toward old prose — code and the #815 count test are already correct.
- **End state:**
  1. `node --test skills/war/assets/war-config.test.mjs` green, including the idempotence trio: an
     already-composed input returned byte-unchanged; `resolveGate(resolveGate(g))` equals
     `resolveGate(g)` for a plain gate; empty/null input still yields the discovery-only clause.
  2. The engine's gate composition point exists in `workflow-template.js`, located **by named
     construct**: the in-place `plan.gate` normalization statement (guarded per Task 1.1) and the
     inline `resolveGate` mirror's own declaration inside the extracted mirror block. **A bare
     `grep -c 'resolveGate' skills/war/assets/workflow-template.js` is non-zero is NOT the check** —
     it is vacuous, already satisfied at base (count 1) by the `resolveGate` prose inside the
     emitted STALE-LOOKING-BUT-CORRECT calibration prompt, which this plan deliberately leaves
     standing (grill Q27); any composition grep must pin a token absent from that prompt string.
     The D2 mirror-registry test in `workflow-template.test.mjs` is the arbiter: a behavioral row
     holding the inline mirror equal to the canonical `resolveGate` over the null/empty, plain, and
     pre-composed case set — the pre-composed fixture built from the canonical `resolveGate` output,
     never a hardcoded composed string — with the registry's sanity floor bumped to `>= 8` and its
     message naming the new row (mentally delete the inline mirror or the composition line: the row
     / the prompt asserts must fail).
  3. Rendered-prompt evidence in `workflow-template.test.mjs`, asserted over an **enumerated
     inventory of the nine gate-bearing dispatch captures** (by label/`dispatchKind` — the enumerated
     count is the anti-vacuity floor; a capture an existing fixture cannot reach is added, never
     skipped): with a plain JS-only fixture gate every captured prompt carries the `*.test.sh`
     discovery-clause token **exactly once**; with a pre-composed fixture gate, still exactly once
     (idempotence arm); a null/absent fixture gate renders the discovery-only clause (deliberate
     behavior change from today's literal `null` render — its own locked case). No assertion
     anywhere enumerates shell suites or states a suite count.
  4. `agents/war-refiner.md`'s Gate contract paragraph attributes the dispatched string's composition
     to the engine's gate composition point (Lead Setup pre-resolution named as the belt), retains
     the verbatim-run duty and the baseline carve-out, and shares one commit with the
     `workflow-template.js` composition change (verify via `git log --follow` on both paths).
  5. `skills/war/SKILL.md` Setup step 3 still instructs Lead pre-resolution via `--resolve-gate` AND
     states the engine's idempotent normalization (case-tolerant mid-sentence anchor); the existing
     `war-config.test.mjs` doc-contract asserting SKILL.md mentions `--resolve-gate` stays green.
  6. Stage ordering held: the Phase-1 engine commit is an ancestor of every Phase-2 commit
     (`git merge-base --is-ancestor` per commit pair at the Phase-2 land).
  7. **#892:** `grep -rin 'zero-task' skills/war/assets/workflow-template.js
     skills/war/references/schemas.md` — **case-insensitive** (a reword that splits the clause into
     its own sentence naturally re-cases the token to `Zero-task`; the same sentence-case
     false-negative class End state 8 guards against) — yields no match claiming a zero-task phase
     builds the Provision-barrier prompt or requires the phase fields for prompt-build reasons; both
     surfaces instead carry the defensive fail-fast rationale naming `held:workflow-error`. The one
     legitimate surviving `zero-task` mention (schemas.md's true zero-tasks/derivation-vacuous
     sentence, kept by design) is excluded by pairing the floor with the claim token
     (`… | grep -i 'provision-barrier\|requires them'`). Both edits share one commit.
  8. **#893:** `grep -c -i 'exact bytes, backticks included'
     docs/plans/2026-07-12-audit-gate-evidence-fidelity.md` returns 0 — **case-insensitive, anchored
     on the interior token**, never the parenthesised full phrase: a case-sensitive
     `grep -c '(exact bytes, backticks included)'` false-negates on a re-cased copy while the
     self-contradiction survives (the recorded sentence-case false-negative class — see the
     `prompt-only-clause-grep-guard-must-tolerate-sentence-case` learning). **AND** the count of the
     **backticked** land-cwd literal (the form wrapping `_refinery` in backticks) in that same file
     is **exactly 1** — the sole legitimate survivor being the Task-1.2 slice's learning-note
     **prose noun** (a directory name in prose, correct as-is, untouched). Both *code-literal*
     claims — the task-1.1 land-cwd bullet **and** the `**#815:**` test-mapping sub-bullet under its
     Tests list — then byte-match the non-backtick form that the shipped code (the land step-2
     clause in `workflow-template.js`) and the #815 count-test regex both actually carry; that plan's
     own End state #8 already used the non-backtick form and stays untouched. The #815 durable count
     test in `workflow-template.test.mjs` is untouched and green.
  9. `node --test skills/war/assets/skill-doc-contracts.test.mjs` green with at least two new
     spec-truth rows — the 2026-06-25 §5.3 push-first-CAS prose guard and the docker-bullet
     reader-vs-producer guard — plus one row per claim the #887 sweep **corrects**; each row fails
     when its guarded prose is mentally reverted, and every row guarding a correction applied in
     this plan is additionally proven red against the pre-fix prose (`Red-proof:` block in the
     commit body, prose-drift precedent).
  10. The `skills/war/SKILL.md` docker Daemon-reachable bullet no longer attributes the
      classification-base gate re-run to `classOf`; it names the refiner as performing the re-run
      (per `agents/war-refiner.md` Gate-failure classification) and `classOf` as a reader of the
      refiner-computed `gate_failure_class`; the existing D14 guard stays green. **The correction is
      OLD-absent on every surface carrying the old value, not merely NEW-present in the bullet**
      (/war-strategy §3 rule 6). The surfaces are **enumerated, and each closed by its own
      mechanism** — deliberately NOT by a repo-wide grep (see the scope note below):
      - `skills/war/SKILL.md`'s `**Daemon reachable**` bullet — closed by Task 2.1's reword plus the
        new guard row's **bullet-scoped** negative arm (D14's own extraction anchor).
      - `skills/war/assets/skill-doc-contracts.test.mjs`'s **D14 block comment**, which restates the
        same misattribution ("…classifier (`classOf`) keys on / re-running the failing gate…") —
        corrected **in the same task**; that file is already Task-2.1-owned, so no ownership-rule
        conflict and no follow-up issue. **This is the surface the both-surfaces rule turns on here.**
      - `docs/specs/2026-07-12-prose-drift-corrections-design.md` — a live misattribution in its own
        voice, inside the #887 sweep's `docs/specs/` scope; process-covered there.
      - **Not a surface:** this plan's own source spec
        (`docs/specs/2026-07-14-gate-evidence-and-prose-truth-design.md`) pairs `classOf` with the
        re-run while *describing the defect and the desired end state*. A spec's statement **of** a
        drift is not an instance of it and must survive untouched.
      **Scope note (red-team adjudication, 2026-07-15):** the assertion stays **bullet-scoped**,
      matching spec criterion 10 verbatim. A repo-scoped OLD-absent grep was tried and rejected: it
      invents scope the spec does not carry, needs a carve-out list that rots as future specs
      describe this same drift, and — decisively — a **line-based** repo grep is **vacuous on the
      very surface it was invented to catch**, because D14's comment wraps the pairing across two
      lines (`classOf` ends one, `re-running` opens the next). The in-task D14 correction, not a
      wider grep, is what closes rule 6 here.
  11. Every sweep-bearing task (1.1, 2.1, 2.2, **2.3**) records its sweep as a `Survey:` block in
      its implementation commit body — the grep-floor command, every hit's disposition, and the
      manual same-scope survey outcome (stragglers listed as survey-derived corrections, or an
      explicit none-found note); zero survey notes recorded = this item failed. Task 2.1's block
      additionally carries the per-hit verify/correct adjudication for the docs/specs sweep. Task
      2.3's block carries the per-hit *code-literal claim vs prose noun* adjudication for its
      `land worktree` sweep.
  12. A new ADR (next free number) records "Gate self-discovery composition is engine-owned"
      including the rejected fail-closed alternative, and `CONTEXT.md` gains the **Gate composition
      point** and **Spec-truth guard** glossary entries (spec §6 definitions).
  13. Full gates green at each phase's land (`node --test 'skills/**/*.test.mjs'` + the composed
      gate's own shell-suite discovery loop; `node skills/_shared/war-memory.mjs lint
      docs/learnings/` for the touched learnings); all four release slots bumped together to the
      next free patch (Phase 3).

## Build order (for /war)

- **Contention (verified):** the two 2026-07-14 sibling specs (red-team fallback/anchor hygiene;
  lessons-learned repo-projection integrity) touch `skills/red-team/**` and
  `skills/lessons-learned/**` respectively — zero overlap with this plan's footprint except the four
  release slots, which are serial by stack order and resolved from the live tip at land time.
- **Why two content phases (spec constraint 4, binding):** same-file collisions —
  `skills/war/SKILL.md` (Setup step 3 edit in Phase 1 vs the docker-bullet sentence in Phase 2) and
  `skills/war/assets/workflow-template.js` (composition point + nine dispatch sites in Phase 1 vs the
  entry-validation comment in Phase 2) — plus semantic sequencing: the #887 sweep certifies spec
  prose against post-#894 gate mechanics, so sweeping first would certify prose the very next land
  falsifies.
- **Phase-2 ownership rule:** `skill-doc-contracts.test.mjs` is Task-2.1-owned; Task 2.1's sweep
  **corrections are bounded to `docs/specs/*.md` plus its own two listed files** — a survey
  straggler pointing anywhere else (`schemas.md`, `workflow-template.js`, `agents/*.md`, …) is
  recorded in the `Survey:` block and routed to a Lead-filed follow-up issue, never edited in-task
  (file-disjointness with Tasks 2.2/2.3 holds by construction).

1. **Phase 1 — Engine-owned gate composition (#894)** (Task 1.1 ∥ Task 1.2, file-disjoint)
2. **Phase 2 — Prose and doc-contract truth (#887, #892, #893)** (Tasks 2.1 ∥ 2.2 ∥ 2.3, file-disjoint)
3. **Phase 3 — Release** (four version slots, lands last)

## Phase 1 — Engine-owned gate composition (#894)

### Task 1.1: resolveGate idempotence + engine composition point + refiner/SKILL.md both-surfaces + D2 row

- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`,
  `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
  `agents/war-refiner.md`, `skills/war/SKILL.md`
- Plan slice:
  - **Canonical idempotence (`war-config.mjs`):** `resolveGate(declaredGate)` detects the
    discovery-clause token in the input; present ⇒ return the input unchanged; absent ⇒ today's
    composition. The token is a **named const inside `resolveGate`'s own module scope** — a short
    stable substring of the find clause (the `-name '*.test.sh'` neighborhood) — used BOTH to build
    the discovery string and as the detector, so composer and detector cannot drift from each other
    by construction; the inline mirror duplicates the same pairing. Empty/null behavior unchanged
    (discovery clause alone). Update the function's header comment to state the idempotence contract
    in the same commit (source-comment-lags lesson). The `--resolve-gate` CLI flag and its behavior
    stay.
  - **Inline mirror + gate composition point (`workflow-template.js`):** add a hand-mirrored inline
    copy of `resolveGate` **inside the existing extracted mirror block** (between the
    `const ROLE_MODEL =` and `const defaultRoster` anchors the D2 harness already slices and evals),
    marked with the **two-sided** mirror-comment convention this repo already uses (verified,
    red-team 2026-07-15): the **canonical side** carries `// MIRRORED inline in workflow-template.js.
    Keep in sync.` (as `war-config.mjs` lines 261/292/312/327 and `land-decision.mjs` line 2 already
    do), and the **mirror side** — the block head at `workflow-template.js`'s
    `Mirror of war-config.mjs <exports> — the Workflow sandbox can't import. Keep in sync.` comment —
    gets `resolveGate` appended to its export list. So Task 1.1 touches **both** markers: add the
    `// MIRRORED inline …` line immediately above `export function resolveGate` in `war-config.mjs`
    (same commit as the idempotence-header update), and extend the `workflow-template.js` block-head
    export list to name `resolveGate`. The comment names the canonical export and the D2 registry
    row as arbiter. The existing `inlineHelpers` shim then exposes the inline copy with a one-token
    addition to its return list, no new extractor. Apply it as **in-place normalization of `plan.gate`, once, immediately after entry
    validation** (the hoisted `problems` throw) — in-place is mandated, not latitude: it is the only
    shape that satisfies both spec clauses (single composition point AND the nine interpolation
    sites untouched in source).
    **Null-safe by mandate, not by implementer discretion (red-team finding, 2026-07-15):** the
    statement is `if (plan) plan.gate = resolveGate(plan.gate)` — **guarded**. `plan` is destructured
    with no default and is **never** entry-validated (the `problems`/`missingPhaseFields` block
    checks only the derivation trio and the three phase fields), and the template's own
    `testPattern` line guards it with `plan &&` — proving an absent `plan` is a reachable state.
    An **unconditional** `plan.gate = …` at that position would TypeError on a plan-less zero-task
    phase, converting a clean `held:nothing-merged` into `held:workflow-error` — a regression that
    would also falsify Task 2.2's own replacement rationale. Adding `plan` to entry validation is
    **not** the alternative: that is the fail-closed validation spec §9 cuts and Task 1.2's ADR
    records as rejected. An absent `plan` object is a **no-op**, distinct from the absent/null
    `plan.gate` arm (which renders the discovery-only clause). Add a **plan-less / zero-task fixture
    arm** to the prompt-assert set so this boundary stays proven.
    Verified at survey base: `plan.gate` is read nowhere before the nine dispatch sites (earlier
    matches are comments only), so no pre-composition consumer exists, and a resumed/relaunched
    phase re-enters the template from the top and re-applies composition idempotently. Grep-verify
    consumers at the dispatch base: `grep -n 'plan\.gate' skills/war/assets/workflow-template.js`
    and handle **every** match — each is the composition point, one of the nine gate-bearing
    dispatch sites (the worker task prompt's `Gate:` line; the merge-task rebase clause; the
    fix-round re-merge clause; the baseline-proceed re-merge clause; the intra-phase-dep
    integrated-tip re-run clause; the polish keep-green clause; the polish re-merge clause; the land
    step-2 merge clause; the baseline-proceed re-land clause), or a comment to reword to match
    in-place normalization. **Grep is a completeness floor, not a ceiling — after the grep,
    hand-scan the file's same-scope comments and prompt clauses (and `workflow-template.test.mjs`
    titles/locked substrings) for gate-provenance statements the token misses, and list each
    straggler as a survey-derived correction in the commit-body `Survey:` block.**
  - **Refiner card (both-surfaces, same commit):** `agents/war-refiner.md`'s Gate contract paragraph
    currently reads "a **resolved, self-discovering string** (produced by `war-config.mjs
    --resolve-gate`)" — re-attribute the string's provenance to the engine's gate composition point
    (Lead Setup pre-resolution remains as the belt); keep the verbatim-run duty, the
    gate-failure-classification pointer, and the baseline carve-out untouched. The classification
    procedure itself needs no edit: its identifier comparison is runner-agnostic and the Gate
    contract already states it "covers all runners, including bash suites". Sweep the card:
    `grep -n -i 'resolve' agents/war-refiner.md`, handle every match; **grep is a floor, not a
    ceiling — hand-scan the card's same-scope headings and surrounding sentences for stale
    provenance phrasing and list each straggler as a survey-derived correction.**
  - **SKILL.md Setup step 3 (same commit):** keep the pre-resolution instruction (including the
    closing "Never run a phase without the resolved gate." — still true as the belt); append the
    engine-normalization sentence — the engine now normalizes the dispatched gate idempotently
    (belt-and-suspenders), so a missed pre-resolution can no longer produce a shell-blind gate. The
    existing `war-config.test.mjs` doc-contract ('SKILL.md mentions --resolve-gate') must stay green.
  - **Tests, same commit:**
    - `war-config.test.mjs`: the idempotence trio — pre-composed input (built from `resolveGate`'s
      own output, never a hardcoded composed string) returned byte-unchanged;
      `resolveGate(resolveGate(g)) === resolveGate(g)` for a plain gate; empty/null still yields the
      discovery-only clause. Existing composition cases untouched.
    - `workflow-template.test.mjs`: (a) the new **D2 mirror-registry behavioral row** binding the
      inline mirror to the canonical `resolveGate` over the null/empty, plain, and pre-composed case
      set — the pre-composed case input computed from the **canonical** output, so a partial token
      move (detector const moved in one copy only) makes the row fail; extend the existing
      `inlineHelpers` return list to expose the mirror; bump the `MIRROR_REGISTRY.length >= 7`
      sanity floor to `>= 8` with the message naming the resolveGate row; (b) rendered-prompt
      asserts over an **enumerated inventory of the nine gate-bearing dispatch captures** (by
      label/`dispatchKind`; add a capture for any site no existing fixture reaches — the enumerated
      count is the anti-vacuity floor, so deleting the composition line reds every arm): plain
      JS-only fixture gate ⇒ the discovery-clause token **exactly once** per prompt (verified at
      survey base: no fixed prompt prose carries the token — the only `test.sh` match outside the
      dispatch sites is a non-emitted comment; re-verify at the dispatch base); (c) the idempotence
      arm — a pre-composed fixture gate also yields exactly one occurrence per prompt; (d) the
      null-gate arm — a null/absent fixture gate renders the discovery-only clause (today it renders
      the literal string `null`; this is the deliberate, spec-ratified improvement); (e)
      **locked-substring inventory**: every pre-existing locked substring that renders a fixture
      gate updated deliberately in this commit, never loosened — survey-base finding: zero such
      locks exist (`Run the gate (` and worker `Gate: `-line locks: no matches; prompt byte-identity
      pairs compare two equally-composed renders and hold) — but the inventory is re-run against
      the dispatch base, not trusted from this plan.
  - No change to `resolveGate`'s discovery exclusions (`node_modules`/`.git`/`.claude`), floor-script
    discovery patterns, or the gate-failure classification procedure (spec §9).
- requiresTest: true (mapped evidence: the `war-config.test.mjs` and `workflow-template.test.mjs`
  changes in this diff; suite runs under the plan gate `node --test 'skills/**/*.test.mjs'`)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: ADR + CONTEXT.md terms

- Files: `docs/adr/0036-gate-self-discovery-composition-engine-owned.md`, `CONTEXT.md`
- Plan slice: Author the ADR recording the decision (spec §7): the dispatched gate string is composed
  by the engine's gate composition point — idempotent, hand-mirrored inline per the
  sandbox-cannot-import rule, drift-guarded by its D2 registry row — amending the F12
  self-discovering-gate decision; the Lead's Setup pre-resolution is retained as advisory belt, no
  longer the enforcement. Record the rejected alternative (fail-closed entry validation on
  `plan.gate`) and why (it converts silent evidence loss into a run-blocker and leaves the duty on
  the Lead) — this is where spec §9's "no fail-closed validation" cut is documented. **Resolve the
  ADR number to the next free one at land time** (0036 as of authoring — non-authoritative). Add
  `CONTEXT.md` glossary entries per spec §6: **Gate composition point** and **Spec-truth guard** —
  the latter is defined-but-not-yet-emitted; its first rows are produced in Task 2.1 (annotate the
  cross-link so an auditor links the producing task, not a dangling ref).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Prose and doc-contract truth (#887, #892, #893)

### Task 2.1: Spec-truth guards + docker-bullet tightening + docs/specs sweep (#887)

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`,
  `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` (re-verify target — may be
  zero-diff), plus any `docs/specs/*.md` sweep hit corrected as a survey-derived change
- Plan slice:
  - **Docker-bullet tightening:** in the Setup step 3 "Daemon reachable" bullet (locate by the
    `**Daemon reachable**` marker), reword the classifier sentence so the **refiner** performs the
    classification-base gate re-run (per `agents/war-refiner.md` Gate-failure classification) and
    `classOf` in `workflow-template.js` is a pure **reader** of the refiner-computed
    `gate_failure_class`, routing only on the reported class. Keep the D14 guard green: the reword
    must retain the three platform-signature names inside the bullet and must not reintroduce the
    banned misattribution clause. **This task's SKILL.md edit is bounded to the Daemon-reachable
    bullet** — the step-3 gate/engine-normalization sentences Phase 1 landed are out of its scope
    (End state 5's anchor grep re-checks them at this phase's land). This is the
    `skills/war/SKILL.md` edit that trails Phase 1's step-3 edit (spec constraint 4).
  - **Second surface of the same correction — the D14 block comment (red-team finding, 2026-07-15):**
    `skill-doc-contracts.test.mjs`'s own D14 explanatory comment restates the misattribution it
    guards against — "the gate-time `gate_failure_class` classifier (`classOf`) keys on re-running
    the failing gate at the classification base and comparing failing identifiers". Reword it to the
    same reader-vs-producer truth **in this task** (the file is already Task-2.1-owned — no
    ownership-rule conflict, no follow-up). This surface is invisible to every other mechanism here:
    it is not under `docs/specs/` so the #887 sweep grep never reaches it, and D14's own extraction
    plus the new negative arm are scoped *within the extracted SKILL.md bullet*. Sweep it with a
    **multi-line** matcher (the D14 pairing wraps `classOf` / `re-running` across two comment lines,
    so a line-based `grep` misses it): e.g. `grep -rniz 'classOf'` then confirm the re-run verb is no
    longer paired with it, or a `perl -0777` / `rg -U` multiline scan over
    `skills/war/assets/skill-doc-contracts.test.mjs` and `skills/war/SKILL.md`. Handle every match;
    **grep is a floor, not a ceiling — hand-scan both files' same-scope comments and test titles for
    re-run-agency phrasing that names the classifier without the `classOf` token, and list each
    straggler as a survey-derived correction** in the `Survey:` block. Do **not** widen the sweep to
    the plan's own source spec — a spec describing this drift is not an instance of it.
  - **Spec-truth guard rows (`skill-doc-contracts.test.mjs`):** extend with rows at the next free
    D-numbers (self-discover across the D-series test files at implementation time; D15/D16 free at
    survey base), same construct-anchored extraction style as D10/D12 (locate by construct, extract
    by regex, assert the truth-bearing tokens; the file's own ponytail note ratifies
    extraction-not-AST as the ceiling). Add one sentence to the file's header comment stating the
    maintenance rule: **a sanctioned rewrite of a guarded claim updates its row in the same
    commit** — the header is where revert-pressure lands when a row reds.
    - **2026-06-25 §5.3 CAS-prose guard:** the push-first CAS prose in
      `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` keeps its supersession pointer
      to the `cmd_land_advance` subcommand and its load-bearing claims — push-first ordering, the
      `[rejected]`-token classification, the 0/2/3 exit contract — anchored so a rewrite that drops
      or inverts any of them fails the test.
    - **Docker-bullet reader-vs-producer guard:** D10-style intended-location extraction of the
      bullet by its `**Daemon reachable**` marker; **presence arm** — `classOf` named a reader of
      the refiner-computed `gate_failure_class` and the refiner named as the re-run performer;
      **negative arm, reword-tolerant** — within the extracted bullet, no phrasing casts `classOf`
      as the agent of the re-run (case-tolerant mid-sentence regex pairing `classOf` with
      `re-run`/`re-running` as its verb — never a byte-lock on the new sentence).
    - One further row per claim the sweep below **corrects** (sweep hits verified-correct get a
      `Survey:` disposition, not a row; see Notes). **Row classification (red-team 2026-07-15 — the
      two named rows are NOT both verified-correct):** the **docker-bullet reader-vs-producer row
      guards prose this task corrects** (Task 2.1's first bullet rewords the live-wrong `classOf`
      misattribution), so it carries a `Red-proof:` block like every other corrected-claim row. Only
      the **2026-06-25 §5.3 CAS row** guards already-correct prose and takes the **mental-delete
      check** instead. For every row guarding a correction applied in this task — the docker-bullet
      row and each sweep-corrected claim — prove it red against the pre-fix prose and paste the
      failing assertion output as a `Red-proof:` block in the commit message body (prose-drift
      precedent).
  - **Sweep (grep floor + mandatory survey) — scoped to #894 gate mechanics, not bare filenames
    (red-team adjudication, 2026-07-15):**
    `grep -rln 'resolveGate\|classOf\|plan\.gate' docs/specs/`
    — re-verify each hit's code-fact prose against the **post-#894** tree, correcting verified
    drifts and adding a guard row for each corrected claim. **Why this token set, not the broader
    one:** the original `workflow-template\.js|war-config\.mjs|provision-worktrees\.sh|…|land-advance`
    grep matched **77 of 90** spec files — 86% of the corpus, an untractable per-file
    re-verification buried inside a task that also does the docker + D14 rewords and the guard rows.
    This plan is about gate composition; the three gate-mechanics tokens (`resolveGate`, `classOf`,
    `plan.gate`) match **~15** specs — the surface that can actually have drifted *on #894's
    mechanics* — while a spec merely *naming* `workflow-template.js` is rarely a code-fact drift
    about this change. **This plan's own source spec
    (`docs/specs/2026-07-14-gate-evidence-and-prose-truth-design.md`) is a sweep hit that must be
    dispositioned `Survey:` verified-correct, never "corrected" — its `classOf`/re-run prose
    describes the defect and desired end state (see End state 10).** Corrections are bounded to
    `docs/specs/*.md` + this task's two listed files (Phase-2 ownership rule); stragglers outside
    that set route to Lead-filed follow-up issues. **Grep is a completeness floor, not a ceiling —
    after the grep, hand-scan the candidate specs' same-scope headings, tables, and inline comments
    for code-fact claims phrased without greppable construct tokens, and list each straggler as a
    survey-derived correction.** Record the full sweep + survey outcome (per-hit disposition;
    explicit none-found notes) as a `Survey:` block in the implementation commit body (End state 11).
- requiresTest: true (mapped evidence: the new spec-truth rows in `skill-doc-contracts.test.mjs`;
  the modified file matches the `assert-test-in-diff.sh` `skills/**/*.test.mjs` pattern)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Entry-validation fail-fast rationale, both mirrored surfaces (#892)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/references/schemas.md`
- Plan slice: In the comment block above `const problems = []`, reword the PHASE-FIELD class bullet:
  the unconditional check is **defensive fail-fast** — every absent key named at entry as
  `held:workflow-error`, instead of an opaque throw deep inside pt-tagged prompt construction —
  and delete the "even a zero-task phase builds the Provision-barrier prompt from these fields"
  justification (false: the Provision-barrier dispatch sits inside `if (tasks.length)`; a zero-task
  phase resolves `held:nothing-merged` without reaching any pt-tagged build). Keep the
  guarded-access and no-earlier-deref notes — they are true. In `skills/war/references/schemas.md`,
  reword the "Entry validation (H)" blockquote's mirrored clause ("so even a zero-task phase
  requires them") to the same fail-fast rationale; the two-category structure, the suffix rule, and
  the zero-tasks/derivation-vacuous sentence stay (they are true). **One commit for both surfaces**
  (mirror-drift prevention). Comment/prose-only — no behavior, no test cascade (verified: no test
  locks the old wording). Sweep: `grep -rin 'zero-task' skills/war/assets/workflow-template.js
  skills/war/references/schemas.md` — **case-insensitive** (a reword re-cases the mid-sentence
  token; End state 7's compliant default), the surviving legitimate mention (the kept
  zero-tasks/derivation-vacuous sentence) excluded by pairing with the claim token — handle every
  match; **grep is a floor, not a ceiling —
  hand-scan both files' same-scope comments/blockquotes (and `workflow-template.test.mjs` titles)
  for other restatements of the zero-task justification and list each straggler as a survey-derived
  correction in the commit-body `Survey:` block.**
- requiresTest: false — comment/blockquote reword only; the spec ratifies no test cascade (no-test
  route by design, justification recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: Plan-doc bullet correction + learnings resolution notes (#893, #894 origin lesson)

- Files: `docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`,
  `docs/learnings/plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test.md`,
  `docs/learnings/refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind.md`
- Plan slice: Correct **both** code-literal claims in the landed plan — they are two bullets, not
  one, and fixing only the first leaves the same falsehood standing (red-team finding, 2026-07-15):
  - **(a) the task-1.1 land-cwd bullet:** replace the backticked replacement literal with the
    non-backtick form its own End state #8 specifies (the form the shipped code carries, locked by
    the #815 durable count test), and delete the "(exact bytes, backticks included)" parenthetical.
  - **(b) the `**#815:**` test-mapping sub-bullet under that same task's Tests list:** it describes
    what the new count assertion asserts — "exactly 1 of `` `cwd stays the `_refinery` land
    worktree` ``" — with `_refinery` backticked, while the shipped test's regex
    (`workflow-template.test.mjs`, the #815 durable source-count test) carries **no** backticks.
    Rewrite its literal to the non-backtick form so the bullet describes the regex that actually
    ships. It carries no "(exact bytes…)" parenthetical, so End state 8's first grep alone never
    reaches it — this bullet is the reason End state 8 also counts the backticked form.
  - **Leave alone:** that plan's End state #8 (already non-backticked, correct) and its Task-1.2
    learning-note **prose noun** "(the `_refinery` land worktree)" — prose naming a directory, not a
    claim about a code literal; backticks are correct there and it is the one occurrence End state
    8's count of 1 expects to survive.
  - **Sweep (grep floor + mandatory survey)** — Task 2.3 is sweep-bearing like every other content
    task: `grep -n 'land worktree' docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`, handle
    every match, adjudicating each as *code-literal claim* (correct to non-backtick) vs *prose noun*
    (leave). **Grep is a completeness floor, not a ceiling — after the grep, hand-scan the file's
    same-scope bullets, End-state items, and Tests sub-lists for further restatements of the #815
    counted literals phrased without the `land worktree` token, and list each straggler as a
    survey-derived correction** in the commit-body `Survey:` block (End state 11).

  Bullet (a), bullet (b), End state #8, shipped code, and the count test then all agree —
  **no code or test change** (nothing may "fix" code toward the old bullets; code and the #815 test
  are already correct). Append the resolution note to the #893 source learning (repo-convention
  recurrence-note style; frontmatter otherwise untouched). Also append the resolution note to the
  #894 originating lesson `refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind` —
  its "never composed" fact is stale-by-design after Phase 1 (the engine now composes; the lesson
  stays hot as the pattern record, no archive, no retitle). Keep
  `node skills/_shared/war-memory.mjs lint docs/learnings/` green.
- requiresTest: false — docs-only; the redaction lint is the in-task check
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes engine behavior (`workflow-template.js`, `war-config.mjs`) and
  shipped skill/agent prose — users only receive it via a release. Bump all four release slots
  together to the **next free patch above the live integration base at land time** (never a
  resolved semver literal in this plan, per the /war-strategy §2 next-free-patch convention):
  `plugin.json` `version`, `marketplace.json` `metadata.version` AND `plugins[0].version`, and the
  `README.md` `## Status` line (replace-in-place, never emptied, no badge). Expected integration
  base: the working-branch tip after this plan's Phase 2 lands; if campaign siblings land first,
  their bumps advance the base — version literals anywhere are non-authoritative. Standalone
  fallback: a run of this plan through plain `/war` resolves the next free patch from the four
  slots themselves. `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial
  bump is a red test.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live-run confirmation that belt-and-suspenders never double-runs: with Lead Setup pre-resolution
  active, the shell suites execute exactly once per gate invocation in the teed log · why deferred:
  idempotence is unit-proven at the function and prompt layers; the Lead→engine composition chain
  end-to-end is only observable in a real run · runner: operator of the next `/war` run, via the
  gate log / `/war-review`.
- **Out-of-footprint survey stragglers** — any #887 survey hit pointing outside
  `docs/specs/*.md` + Task 2.1's listed files (e.g. `schemas.md`, `agents/*.md`) is
  found-but-not-corrected in-task by the ownership rule · why deferred: editing it in-task would
  break Phase-2 file-disjointness · runner: the Lead files one follow-up issue per straggler at
  phase close, from the `Survey:` block (ADR 0017 — named owner, no prose waiver).

## Notes / conscious deviations

- **Task 1.1 is deliberately one coupled task:** spec constraint 4 names the #894 slice as one
  unit (`workflow-template.js` + `war-config.mjs` + tests + `agents/war-refiner.md` +
  `skills/war/SKILL.md` step 3); the both-surfaces rule (spec constraint 3) chains the refiner card
  into the engine commit, and the new-mirror rule (/war-strategy §3 rule 5) chains the D2 registry
  row into the same task — an unguarded mirror is a plan defect, never a follow-up. Splitting
  `war-config.mjs` from the mirror would strand the behavioral row (it binds both sides). Audit
  roster/effort is run configuration (`/war-room`), not a plan surface — no roster ask here.
- **In-place `plan.gate` normalization is mandated, not latitude (grill Q1):** the spec's design
  tree offers "in-place or a single const all nine sites read", but its same row requires the nine
  interpolation sites stay untouched in source — only in-place satisfies both. Resolved toward the
  self-consistent reading; deviates from the spec's literal latitude wording.
- **Detector token = a named const shared by composer and detector (grill Q2):** the exact bytes
  are implementation-time detail bounded by: a short stable substring of the find clause (the
  `-name '*.test.sh'` neighborhood), declared once in canonical `resolveGate` and used for both
  composing and detecting, duplicated in the inline mirror; the D2 pre-composed case is computed
  from the canonical output, so a partial move of the pairing reds the registry row.
- **Null-gate behavior change is deliberate and locked (grill Q3):** today a null `plan.gate`
  renders the literal string `null` into prompts (the `pt` tag throws only on `undefined`; `null`
  coerces) — after composition a gate-less plan dispatches the discovery-only clause. Strictly a
  fix; ratified by spec criterion 1's empty/null clause; locked by its own prompt-assert arm.
- **D2 row reuses the existing extractor (grill Q4):** the inline mirror is placed inside the
  already-sliced `const ROLE_MODEL =` … `const defaultRoster` block, so the existing
  `inlineHelpers` `new Function` shim exposes it via a one-token return-list addition — no new
  anchors, no second shim (curried-inline-mirror lesson consulted; resolveGate is un-curried and
  needs no adapter).
- **Spec-truth guard maintenance rule lives in one place (grill Q5):** the
  `skill-doc-contracts.test.mjs` header (where revert-pressure lands). The CONTEXT.md entry defines
  the term only — duplicating the rule there would mint a new mirrored-prose pair.
- **Guard-row threshold adjudicated (grill Q6):** spec §3 ("per corrected/verified claim") vs §4.2
  ("each corrected claim") — resolved as: rows for the two named residuals (one of which guards
  verified-correct prose) plus every claim the sweep corrects; sweep hits verified-correct get a
  `Survey:` disposition, not a row. Bounds the row count; consistent with §3's "not one guard per
  spec file".
- **#892's replacement rationale prose stays unguarded — accepted residual, NOT a backstop
  (red-team adjudication, 2026-07-15; operator-ratified):** no test locks the old or new wording
  (verified). Adding a comment-prose drift guard on engine-source comments would open a new guard
  class spec §9 cuts and this plan does not ratify — so the exposure is **documented here, not
  backstopped**, following the Q9 precedent below (a design residual, not a deferred validation).
  It was demoted out of `## Deferred validations (backstops)` because its declared runner did not
  exist: `/survey-corps` mines **memory lessons and open issues** into specs and never scans source
  comments for prose drift, so "future doc-truth sweeps (`/survey-corps` doc-drift mining) … only
  if it re-rots" named no real owner and no accountable timing — which ADR 0017 forbids in a
  backstop. The entry's claim that "the spec mandates no new guard for it" was also false: spec
  §"no test cascade" says only that **existing** tests do not break, not that a future guard is
  barred. A residual with no runner is honest; a backstop with a fictional one is not.
- **Live-run gate-log confirmation dropped, not deferred (red-team adjudication, 2026-07-15;
  operator-ratified):** the plan previously deferred "live-run confirmation that a real refiner
  executes the composed gate — the teed `.war/gate-*.log` shows the discovery loop's banners". That
  check **can never fail** and was removed rather than kept as a false honesty marker: the Lead's
  Setup `--resolve-gate` pre-resolution (the belt, retained by End state 5) already composes the
  gate before any phase runs, and the refiner tees the log at every merge — so the artifact is
  byte-identical whether engine composition works, is broken, or is absent. It has zero
  discriminating power for the #894 payload. Detection stays where Q12 ratified it: the **test
  layer** (the D2 behavioral row + the enumerated exactly-once prompt asserts). The surviving
  double-run backstop does NOT share this defect — a second discovery loop is observable only with
  the new engine actually installed.
- **Accepted double-composition residual (grill Q9):** an `overrides.gate` carrying a hand-rolled
  `*.test.sh` loop phrased without the detector token gains a second discovery loop (suites run
  twice — slow, never wrong); the converse (a gate legitimately containing the token) skips
  composition but that gate is running the suites by its own construction. Both are
  operator-visible at Setup pre-resolution. Broadening the detector buys nothing but new
  false-positive surface; documented here, not backstopped (a design residual, not a deferred
  validation).
- **Gate-failure classification untouched (grill Q11):** identifier comparison is runner-agnostic
  and the refiner Gate contract already states it covers bash suites; a failing suite's identifier
  is its banner-printed path. Spec §9 ratifies no procedure change.
- **No seat-side discovery-token assertion (grill Q12):** the gate-audit / integrated-tip seats are
  deliberately NOT taught to demand the token in gate logs — the D2 row + the enumerated
  exactly-once prompt asserts catch a composition regression at test time (earlier and cheaper),
  and a seat-side demand would false-HARD on the Q9 token-free-operator-gate residual. Reversible
  later if the operator wants audit-layer defense-in-depth.
- **Composition point is safe under resume (grill Q13):** verified — no code reads `plan.gate`
  before the nine dispatch sites; a resumed dead phase re-enters the template and re-applies
  composition idempotently.
- **Exactly-once asserts are enumerated, not ambient (grill Q8/Q14):** the nine capture sites are
  enumerated by label/`dispatchKind` (anti-vacuity floor); verified at survey base that no fixed
  prompt prose carries the discovery token; deleting the composition line reds every arm.
- **Locked-substring blast radius surveyed ≈ zero but re-verified at base (grill Q16):** no test
  locks a rendered fixture-gate substring at the survey base (`Run the gate (` / worker `Gate: `
  line locks: no matches; byte-identity pairs compare two equally-composed renders and hold);
  Task 1.1 re-runs the inventory against its dispatch base and updates every touched lock in the
  same commit, never loosening.
- **No handoff/telemetry gate echo (grill Q19):** verified — `plan.gate` appears only at the nine
  dispatch sites plus comments; no handoff/ledger surface echoes it. The Task 1.1 grep step
  re-verifies at the dispatch base.
- **Setup step 3's closing imperative stays (grill Q22):** "Never run a phase without the resolved
  gate." remains true as the belt instruction; the appended sentence states the engine backstop.
  Task 2.1's later SKILL.md edit is scope-bounded to the Daemon-reachable bullet so it cannot drift
  into the step-3 gate sentences; End state 5's anchor grep re-checks at the Phase-2 land.
- **Other standing cards verified clean (grill Q27):** `agents/war-worker.md` carries no gate
  provenance statement; `agents/war-auditor.md`'s calibration sentence names `resolveGate` as the
  self-discovery gate — still true post-#894, and it is byte-mirrored in `workflow-template.js`'s
  STALE-LOOKING-BUT-CORRECT block, so touching it would drag the both-surfaces byte-compare for no
  truth gain. Neither file joins the slice.
- **Spec §9 cuts mapped for /red-team (grill Q29):** rejected fail-closed `plan.gate` validation →
  recorded in the ADR (Task 1.2); no AST/blanket parser over the spec corpus, no
  `skill-doc-contracts.test.mjs` rename, no docs/plans retro-verification beyond #893, no
  exclusions/floor/classification changes, no enum moves → non-goals restated in the relevant task
  slices and this section; #892's unguarded replacement prose → accepted residual documented in
  this section (red-team 2026-07-15 demoted it from a backstop entry: its declared `/survey-corps`
  runner does not exist — see the residual note above).
- **Originating lesson closed in-plan (grill Q30):** the #894 origin lesson
  (`refiner-dispatched-gate-…-shell-suite-blind`) gets its resolution note in Task 2.3 (repo-root
  learning, file-disjoint, lint-guarded) — the audit-gate-evidence-fidelity plan's Task 1.2 is the
  precedent; leaving it to the servitor would strand a stale-by-design fact in the hot set.
- **Open-question defaults applied (a/a/a):** Task 1.2 (ADR + CONTEXT) kept — checkout-guard
  precedent, and the decision amends F12; the #893 learning note included — cheap, lint-guarded,
  closes the loop the learning records; both CONTEXT.md terms land in Phase 1's single touch with
  the defined-but-not-yet-emitted annotation for "Spec-truth guard".
- **2026-06-25 spec listed in Task 2.1 Files as a re-verify target** — currently correct, so the
  edit may be zero-diff while its guard row still lands (plan-affected-file-list lesson: the
  coverage lands in `skill-doc-contracts.test.mjs`; a zero-diff verify is the correct outcome, not
  an omission — VERIFY-task precedent).
- **Sweep-hit spec files are survey-owned, not enumerated:** the #887 grep's hit list is a
  survey-base snapshot; Task 2.1 re-runs it against its dispatch base, and every corrected file +
  its guard row is recorded in the `Survey:`/`Red-proof:` commit-body blocks (ADR 0017 — guards +
  verified corrections, never a prose waiver).
- **D14 compatibility is an explicit Task 2.1 duty:** the docker-bullet reword keeps the three
  platform-signature names inside the bullet and does not reintroduce the banned misattribution
  clause; D14 red after the reword = the reword is wrong, not the guard.
- **Own trailing release phase kept (grill Q20):** engine + shipped skill/agent prose reach users
  only via a release; every predecessor plan carries its own directive-form release phase.
- **ADR number and D-numbers resolve at land time:** 0036 and D15/D16 are survey-base snapshots,
  non-authoritative (stacked-plan literal lesson) — self-discover the next free at implementation.
- **requiresTest/tier routing verified (grill Q25):** `isDocsTask` requires every task file to end
  `.md` — Task 2.2 (a `.js` comment + `.md`) correctly routes the base worker tier; Tasks 1.2/2.3
  route the docs tier; Task 2.1 requiresTest true via its modified `skills/**/*.test.mjs` file.
- **requiresPackaging: false on all tasks** — meta-repo engine-JS/prose/doc changes; no Dockerfile
  in the footprint.
- **Anchors by named construct throughout** — never line numbers (they rot across the serial merge
  queue).

## Ratified decisions (operator, 2026-07-14 conversion volley)

- **Double-composition residual (grill Q9): accepted + documented.** An `overrides.gate` carrying
  a hand-rolled `*.test.sh` loop phrased without the detector token gets the discovery loop
  appended a second time — shell suites run twice per gate invocation (slower merges, never wrong
  results). Ratified over broadening the detector (rejected: more false-positive
  composition-skip surface for zero proven cases). The residual is recorded in
  `## Notes / conscious deviations`; the Setup step 3 pre-resolution belt keeps it
  operator-visible.
- **Seat-side gate-log token expectation (grill Q12): test layer only.** The integrated-tip /
  execution-evidence seats are deliberately NOT taught to expect the discovery token in teed gate
  logs — detection lives in the D2 behavioral row plus the enumerated exactly-once prompt asserts.
  Ratified over audit-layer defense-in-depth (rejected: false-HARDs on the accepted
  double-composition residual and a new both-surfaces prompt slice).
