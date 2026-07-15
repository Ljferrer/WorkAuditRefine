# Gate evidence and prose truth — engine-owned resolveGate composition, plus the coupled prose/doc-contract corrections

Source issues: #894, #887, #892, #893
Date: 2026-07-14
Status: ratified design spec (decision record — no dispatch structure; /war-machine carves phases)

## 1. Context — the gap / problem

Four verified defects share one spine: what the engine actually does has drifted from what the
prose says it does, and in the worst case (#894) the prose *is* the only enforcement.

- **#894 (major, gate-evidence).** `resolveGate()` in `skills/war/assets/war-config.mjs` composes a
  declared gate with a `find`-based `*.test.sh` discovery-and-run loop, but its only call site is the
  `--resolve-gate` CLI flag. `skills/war/assets/workflow-template.js` has **zero** `resolveGate` call
  sites and interpolates raw `${plan.gate}` at all nine gate-bearing dispatch sites (the worker task
  prompt's `Gate:` line; the merge-task rebase clause; the fix-round re-merge clause; the
  baseline-proceed re-merge clause; the intra-phase-dep integrated-tip re-run clause; the polish
  keep-green clause; the polish re-merge clause; the land step-2 merge clause; the baseline-proceed
  re-land clause). `agents/war-refiner.md` merge-task step 7 tees that raw run to the authoritative
  `.war/gate-*.log` artifact, and its Gate contract section *asserts* the dispatched string is
  "a resolved, self-discovering string (produced by `war-config.mjs --resolve-gate`)". The only thing
  making that true is `skills/war/SKILL.md` Setup step 3 telling the Lead to pre-resolve — a prose
  contract the lesson evidence proves fails silently (5 identical gate-audit findings across 5 seats
  in one hooks-diff phase, 2026-07-12/13). When it fails, the executed gate is JS-only: a shell-suite
  regression cannot fail a merge, and every captured gate artifact is structurally shell-blind.
- **#887 (doc-drift, deferred-backstop owner).** `docs/specs/*.md` prose describing real code
  mechanics has no doc-contract coverage (unlike `skills/*/SKILL.md`, guarded by
  `skills/war/assets/skill-doc-contracts.test.mjs`). Named residuals: the §5.3 push-first CAS rewrite
  in `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` (currently correct, guarded only
  by its supersession pointer, free to re-rot) and the `skills/war/SKILL.md` docker Daemon-reachable
  bullet, which still attributes the classification-base gate re-run to `classOf` — the code documents
  `classOf` as a pure *reader* of the refiner-computed `gate_failure_class` (the refiner performs the
  re-run per `agents/war-refiner.md` Gate-failure classification).
- **#892 (doc-drift).** The hoisted entry-validation in `workflow-template.js` checks the PHASE-FIELD
  class (`ph.title`/`ph.workingBranch`/`ph.integrationBranch`) unconditionally — deliberate — but the
  justifying comment above `const problems = []` claims "even a zero-task phase builds the
  Provision-barrier prompt from these fields", and the mirrored "Entry validation (H)" blockquote in
  `skills/war/references/schemas.md` repeats it ("so even a zero-task phase requires them"). False:
  the Provision-barrier dispatch sits inside `if (tasks.length)`, and a zero-task phase resolves to
  `held:nothing-merged` without reaching any pt-tagged build.
- **#893 (doc-drift).** The landed plan `docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`
  task-1.1 land-cwd bullet instructs a backticked replacement literal ("the gate's cwd stays the
  `` `_refinery` `` land worktree", "(exact bytes, backticks included)") that contradicts the same
  plan's End state #8 non-backtick grep and the shipped code — `workflow-template.js` carries the
  non-backtick form, locked by the #815 durable count test (exactly 2 "cwd stays the task worktree",
  exactly 1 "cwd stays the _refinery land worktree") in `workflow-template.test.mjs`.

## 2. Pivotal constraints

1. **The Workflow sandbox cannot import.** `workflow-template.js` cannot `import { resolveGate }`
   from `war-config.mjs`; any engine-side composition must be a hand-mirrored inline copy with a
   drift guard, following the existing convention (the `resolveWidenSource` "MIRRORED inline …
   Keep in sync" comment + the D2 mirror registry in `workflow-template.test.mjs`).
2. **Idempotence is mandatory.** `skills/war/SKILL.md` Setup step 3 (Lead pre-resolution via
   `--resolve-gate`) stays — it is where `overrides.gate` and docker-build strings are composed and
   operator-confirmed. If the engine also composes, a pre-resolved gate must NOT gain a second
   discovery loop (which would run every shell suite twice per gate invocation).
3. **Both-surfaces rule (ADR 0025 / standing-vs-dispatched split).** A change to what the dispatched
   gate string *is* must update `agents/war-refiner.md` (which describes that string's provenance and
   the verbatim-run duty) in the **same commit** as `workflow-template.js`.
4. **Phase-ordering constraint (binding on the plan converter).** The engine change (#894:
   `workflow-template.js` + `war-config.mjs` + tests + `agents/war-refiner.md` + `skills/war/SKILL.md`
   Setup step 3, one coupled slice) must **land before** the prose/doc corrections (#887 spec-truth
   sweep + doc-contract guards, #892 entry-validation comment + `schemas.md` mirror, #893 plan-doc
   bullet). Two reasons, both hard: (a) **same-file collisions** — `skills/war/SKILL.md` (Setup step 3
   edit vs the docker-bullet classOf sentence) and `skills/war/assets/workflow-template.js` (nine gate
   dispatch sites vs the entry-validation comment) would rebase-conflict if carved into one phase's
   parallel tasks; (b) **semantic sequencing** — the #887 sweep re-verifies spec prose against gate
   mechanics, and those mechanics change under #894 (gate composition moves from Lead prose-duty to
   engine code), so sweeping first would certify prose against a base that the very next land
   falsifies. /war-machine must carve #894 into its own phase and the three doc corrections into a
   subsequent phase.
5. **Never enumerate shell suites.** Per the war-strategy template rule, no guard, prompt, or spec
   sentence may list `*.test.sh` suites or state a suite count — assertions anchor on the discovery
   clause token, never an enumeration.
6. **Locked prompt substrings move in the same commit, never loosen.** Rendered dispatched prompts
   will now carry the composed gate; every existing prompt-substring lock that interpolates a fixture
   gate must be updated deliberately in the same commit.
7. **Anchor by named construct, never line number** (line numbers rot across the serial merge queue).
8. **ADR 0017.** The #887 sweep is the named owner of a deferred backstop — its output must be
   guards + verified corrections, never a prose waiver.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Enforcement shape for #894: keep prose contract / fail-closed entry validation on `plan.gate` / engine-owned composition | **Engine-owned composition.** Route dispatched gate runs through the resolveGate composition inside `workflow-template.js`. A fail-closed validation would only convert silent evidence loss into a run-blocker and leave the duty on the Lead; composition removes the failure mode. The Lead's Setup pre-resolution stays as the belt (operator visibility, docker/override flow); the engine is the suspenders. |
| Where composition happens: at each of the nine sites / once near entry | **Once, immediately after entry validation** — a single gate composition point normalizing the declared gate (in-place `plan.gate` normalization or a single const all nine sites read; implementation latitude, smallest diff wins). The nine interpolation sites stay untouched in source. |
| Double-composition hazard | **Make canonical `resolveGate` idempotent**: if the declared gate already contains the discovery-clause token (the `find … -name '*.test.sh'` clause), return it unchanged. The inline mirror inherits the same semantics; the drift guard holds them equal. Update the `resolveGate` header comment in the same commit (source-comment-lags lesson). |
| Drift control for the inline copy | **A new behavioral row in the existing D2 mirror registry** (`workflow-template.test.mjs`): inline mirror vs canonical `resolveGate` over a case set (null/empty gate → discovery-only; plain gate → composed; already-composed gate → unchanged). No new test file, no AST scanner. |
| Refiner card (#894 both-surfaces) | `agents/war-refiner.md` Gate contract paragraph re-attributes the string's provenance: composed by the engine's gate composition point (Lead Setup pre-resolution remains as the belt), run **verbatim** as today. Same commit as the engine change. |
| `skills/war/SKILL.md` Setup step 3 | Keep the pre-resolution instruction; add that the engine now normalizes the dispatched gate idempotently (belt-and-suspenders), so a missed pre-resolution can no longer produce a shell-blind gate. Same commit as the engine change (this is the step-3 edit that collides with #887's docker-bullet edit — ordering constraint 4). |
| docs/specs doc-contract mechanism (#887) | **Per-claim anchored guards, not a blanket parser**: extend `skills/war/assets/skill-doc-contracts.test.mjs` with spec-truth rows following its existing D10/D12 pattern (construct-anchored regex extraction + equality/absence asserts; the file's own ponytail note ratifies extraction-not-AST as the ceiling). Guards are added per corrected/verified claim, starting with the two named residuals — not one guard per spec file. |
| #887 sweep scope over 87 spec files | Grep-floor discovery of code-fact prose (specs naming live constructs/files) + the issue's named candidates, each match re-verified against **post-#894** code; every sweep carries the mandatory manual same-scope survey (see §4). |
| #892 rewording | Justify the unconditional PHASE-FIELD check as **defensive fail-fast** — every absent key named at entry as `held:workflow-error`, instead of an opaque mid-build pt-tag throw — without citing any zero-task runtime path. Source comment and `schemas.md` "Entry validation (H)" blockquote reworded **in one commit** (mirror-drift prevention). No test locks the old wording (verified), so no test cascade. |
| #893 correction | One-line plan-doc edit: reword the task-1.1 bullet's replacement literal to the non-backtick form End state #8 and the shipped code carry, and drop the "(exact bytes, backticks included)" parenthetical. Code and tests untouched — they already agree. Optionally append the repo-convention resolution note to `docs/learnings/plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test.md` (redaction lint must stay green). |
| Ordering | Two stages: engine first (#894), prose/doc truth second (#887, #892, #893). See constraint 4. |

## 4. Mechanics

### 4.1 Engine — gate composition point (#894, stage 1)

- `skills/war/assets/war-config.mjs`: `resolveGate(declaredGate)` becomes idempotent — detect the
  discovery-clause token (a stable substring of its own `find … -name '*.test.sh'` loop) in the
  input; present ⇒ return the input unchanged; absent ⇒ today's composition. Header comment updated
  in the same commit to state the idempotence contract.
- `skills/war/assets/workflow-template.js`: add an inline hand-mirrored copy of `resolveGate`
  (marked with the repo's "MIRRORED inline … Keep in sync" comment convention, naming the canonical
  export and the D2 registry row as arbiter), applied **once** immediately after entry validation so
  every downstream `${plan.gate}` interpolation — all nine gate-bearing dispatch sites — renders the
  composed, self-discovering string. Grep-verify consumers first: `grep -n 'plan\.gate'
  skills/war/assets/workflow-template.js`, handle every match (each is either the composition point,
  one of the nine dispatch sites, or a comment to reword). **Grep is a completeness floor, not a
  ceiling — after the grep, hand-scan the file's same-scope comments and prompt clauses (and
  `workflow-template.test.mjs` titles/locked substrings) for gate-provenance statements the token
  misses, and list each straggler as a survey-derived correction.**
- `agents/war-refiner.md`: the Gate contract paragraph currently reads the string as "produced by
  `war-config.mjs --resolve-gate`" — re-attribute to the engine's gate composition point (Lead
  pre-resolution = belt), keep the verbatim-run duty and the baseline carve-out untouched. Same
  commit as the engine change (both-surfaces rule). Sweep the card: `grep -n -i 'resolve'
  agents/war-refiner.md`, handle every match; **grep is a floor, not a ceiling — hand-scan the card's
  same-scope headings and surrounding sentences for stale provenance phrasing and list each straggler
  as a survey-derived correction.**
- `skills/war/SKILL.md` Setup step 3: append the engine-normalization sentence (see design tree).
- Tests, same commit:
  - `war-config.test.mjs`: idempotence cases — `resolveGate(resolveGate(g)) === resolveGate(g)` for a
    plain gate; already-composed input returned byte-unchanged; empty/null input still yields the
    discovery-only clause.
  - `workflow-template.test.mjs`: (a) the new D2 mirror-registry behavioral row (bump the registry's
    sanity floor if it counts rows); (b) rendered-prompt asserts — with a plain JS-only fixture gate,
    every captured gate-bearing dispatch prompt carries the discovery-clause token **exactly once**;
    (c) the idempotence arm — a pre-composed fixture gate also yields exactly one occurrence per
    prompt; (d) every pre-existing locked substring that renders a fixture gate updated deliberately,
    never loosened.

### 4.2 Spec-truth guards and sweep (#887, stage 2)

- Extend `skills/war/assets/skill-doc-contracts.test.mjs` with spec-truth rows (D10/D12 pattern:
  locate by construct, extract by regex, assert the truth-bearing tokens):
  - **2026-06-25 §5.3 guard**: the push-first CAS prose in
    `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` keeps its supersession pointer to
    `cmd_land_advance` and its load-bearing claims (push-first ordering; the `[rejected]` token;
    the 0/2/3 exit contract) — anchored so a rewrite that drops or inverts them fails the test.
  - **Docker-bullet reader-vs-producer guard**: the `skills/war/SKILL.md` Daemon-reachable bullet's
    classifier sentence names `classOf` as a *reader* of the refiner-computed `gate_failure_class`
    and never attributes the classification-base re-run to it (the tightened sentence #887 ships).
- Tighten that docker-bullet sentence: the refiner performs the base re-run (per
  `agents/war-refiner.md` Gate-failure classification); `classOf` in `workflow-template.js` only
  routes on the reported class. This is the `skills/war/SKILL.md` edit that must trail #894's step-3
  edit (constraint 4).
- Sweep: `grep -rln 'workflow-template\.js\|war-config\.mjs\|provision-worktrees\.sh\|resolveGate\|land-advance\|classOf' docs/specs/`
  — re-verify each hit's code-fact prose against the **post-#894** tree, correcting verified drifts
  and adding a guard row for each corrected claim. **Grep is a completeness floor, not a ceiling —
  after the grep, hand-scan the candidate specs' same-scope headings, tables, and inline comments for
  code-fact claims phrased without greppable construct tokens, and list each straggler as a
  survey-derived correction.** Record the sweep + survey outcome in the implementation commit body.

### 4.3 Entry-validation prose (#892, stage 2)

- `skills/war/assets/workflow-template.js`: reword the PHASE-FIELD class bullet in the comment block
  above `const problems = []` — the unconditional check is defensive fail-fast (a named
  `held:workflow-error` at entry with every absent key listed, instead of an opaque throw deep inside
  pt-tagged prompt construction); delete the "even a zero-task phase builds the Provision-barrier
  prompt" justification. Keep the guarded-access and no-earlier-deref notes — they are true.
- `skills/war/references/schemas.md`: the "Entry validation (H)" blockquote's mirrored clause ("so
  even a zero-task phase requires them") reworded to the same fail-fast rationale; the two-category
  structure, the suffix rule, and the zero-tasks/derivation-vacuous sentence stay (they are true).
- **One commit for both surfaces.** Sweep: `grep -rn 'zero-task' skills/war/assets/workflow-template.js skills/war/references/schemas.md`,
  handle every match. **Grep is a floor, not a ceiling — hand-scan both files' same-scope
  comments/blockquotes (and `workflow-template.test.mjs` titles) for other restatements of the
  zero-task justification and list each straggler as a survey-derived correction.**

### 4.4 Plan-doc bullet (#893, stage 2)

- `docs/plans/2026-07-12-audit-gate-evidence-fidelity.md` task-1.1 land-cwd bullet: replace the
  backticked replacement literal with the non-backtick form its own End state #8 specifies, delete
  the "(exact bytes, backticks included)" parenthetical. Bullet, End state #8, shipped code, and the
  #815 durable count test then agree; no code/test change.
- Optional: append the resolution note to
  `docs/learnings/plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test.md`
  and keep `node skills/_shared/war-memory.mjs lint docs/learnings/` green.

## 5. Surface changes

| File | Stage | Change |
|---|---|---|
| `skills/war/assets/war-config.mjs` | 1 | `resolveGate` idempotence + header comment |
| `skills/war/assets/workflow-template.js` | 1 | inline resolveGate mirror + single composition point after entry validation |
| `skills/war/assets/war-config.test.mjs` | 1 | idempotence cases |
| `skills/war/assets/workflow-template.test.mjs` | 1 | D2 registry row; exactly-once discovery-token prompt asserts; lock maintenance |
| `agents/war-refiner.md` | 1 | Gate contract provenance re-attribution (same commit as engine) |
| `skills/war/SKILL.md` | 1 | Setup step 3 engine-normalization note |
| `skills/war/SKILL.md` | 2 | docker-bullet classOf reader-vs-producer sentence tightened (#887) |
| `skills/war/assets/skill-doc-contracts.test.mjs` | 2 | spec-truth guard rows (§5.3 CAS prose; docker-bullet sentence; one row per further corrected claim) |
| `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` | 2 | re-verified vs post-stage-1 code; corrected only if drifted |
| `docs/specs/*.md` (sweep hits) | 2 | verified code-fact corrections per §4.2 |
| `skills/war/assets/workflow-template.js` | 2 | entry-validation PHASE-FIELD comment reword (#892) |
| `skills/war/references/schemas.md` | 2 | "Entry validation (H)" blockquote reword (#892, same commit as the comment) |
| `docs/plans/2026-07-12-audit-gate-evidence-fidelity.md` | 2 | task-1.1 bullet literal correction (#893) |
| `docs/learnings/plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test.md` | 2 | optional resolution note (#893) |

Stage 1 = the #894 engine slice; stage 2 = the prose/doc-truth slice. Stage 1 lands first
(constraint 4); the two `workflow-template.js` and two `skills/war/SKILL.md` rows above are the
same-file collisions that force the split.

## 6. New domain terms (CONTEXT.md)

- **Gate composition point** — the single site in `workflow-template.js`, immediately after entry
  validation, where the declared gate is normalized (idempotently) to its self-discovering form;
  every dispatched gate run downstream renders the composed string.
- **Spec-truth guard** — a per-claim, construct-anchored doc-contract row in
  `skill-doc-contracts.test.mjs` locking a `docs/specs/` (or SKILL.md) code-fact sentence to the
  mechanics it describes.

## 7. Recommended ADRs

- **"Gate self-discovery composition is engine-owned"** — amends the F12 self-discovering-gate
  decision: the dispatched gate string is composed by the engine's gate composition point
  (idempotent, mirrored inline per the sandbox-cannot-import rule, drift-guarded in the D2 registry);
  the Lead's Setup pre-resolution is retained as advisory belt, no longer the enforcement.
  Record the rejected alternative (fail-closed entry validation on `plan.gate`) and why.

## 8. Open risks / implementation notes

- **Phase-ordering constraint restated for /war-machine** (binding): stage 1 (#894) is its own phase
  and lands before the stage-2 phase (#887, #892, #893). Same-file collisions:
  `skills/war/SKILL.md` (Setup step 3 vs docker bullet) and `workflow-template.js` (nine dispatch
  sites vs entry-validation comment). Semantic: the #887 sweep certifies spec prose against
  post-stage-1 gate mechanics.
- **Locked-substring blast radius**: any test asserting a rendered prompt around a fixture gate
  (TMPDIR clauses, evidence-dispatch lines, worker `Gate:` line) may now see the composed string;
  inventory them during implementation and update in the same commit — never loosen (End-state
  discipline from the audit-gate-evidence-fidelity precedent).
- **Idempotence detector coupling**: the detection token is a substring of the discovery clause; if
  the clause wording ever changes, canonical function, detector, and inline mirror move together —
  the D2 behavioral row is the arbiter that catches a partial move.
- **`plan.gate` echo surfaces**: if any handoff/telemetry line echoes the gate, it will now echo the
  composed string — that is the truthful value; verify consumers via the §4.1 grep + survey.
- **`--resolve-gate` CLI stays**: Setup step 3 and any operator tooling keep working; engine
  idempotence makes double resolution harmless by construction.
- **#887 sweep evasion**: a spec stating code-facts without greppable construct tokens escapes the
  grep floor; the mandatory manual survey is the mitigation, and its outcome must be recorded (zero
  survey notes recorded = incomplete validation).
- **#893 is docs-only**: nothing in stage 2 may "fix" code toward the old bullet — code and the #815
  count test are already correct; only the plan prose moves.

## 9. Non-goals / deferred

- No markdown/AST parser and no blanket contract over all 87 `docs/specs/` files — guards are
  per-claim, added when a claim is verified or corrected (the existing ponytail ceiling in
  `skill-doc-contracts.test.mjs` is ratified, not raised).
- No change to `resolveGate`'s discovery exclusions (`node_modules`/`.git`/`.claude`), to floor-script
  discovery patterns, or to the gate-failure classification procedure in `agents/war-refiner.md`.
- No new fail-closed entry validation on `plan.gate` (superseded by engine composition).
- No enum or escalation-surface changes (`KNOWN_LAND_DECISIONS`, `HARD_ESCALATION_REASONS`,
  `land-decision.mjs` untouched — ADR 0005).
- No renaming of `skill-doc-contracts.test.mjs` despite its now-wider remit.
- No retro-verification of `docs/plans/` beyond the single #893 bullet (plans are historical records;
  #893 is corrected only because it is internally self-contradictory).

## 10. Validation criteria

Each criterion is independently checkable on the tree at the relevant stage's land.

1. `node --test skills/war/assets/war-config.test.mjs` green, including: `resolveGate` on an
   already-composed string returns it byte-unchanged; `resolveGate(resolveGate(g))` equals
   `resolveGate(g)` for a plain gate; empty/null input still yields the discovery-only clause.
2. `grep -c 'resolveGate' skills/war/assets/workflow-template.js` is non-zero, and the D2
   mirror-registry test in `workflow-template.test.mjs` includes a behavioral row holding the inline
   mirror equal to the canonical `resolveGate` over the null/plain/pre-composed case set (delete the
   inline mirror mentally: the row must fail).
3. Rendered-prompt evidence: the new `workflow-template.test.mjs` cases assert that with a plain
   fixture gate every gate-bearing dispatched prompt carries the `*.test.sh` discovery-clause token
   **exactly once**, and with a pre-composed fixture gate still exactly once (idempotence arm). No
   assertion anywhere enumerates shell suites or a suite count.
4. `agents/war-refiner.md` Gate contract paragraph attributes the dispatched string's composition to
   the engine (case-tolerant, mid-sentence-anchored grep), retains the verbatim-run duty, and the
   change shares a commit with the `workflow-template.js` composition change (verify via
   `git log --follow` on both paths at the stage-1 land).
5. `skills/war/SKILL.md` Setup step 3 still instructs Lead pre-resolution AND states the engine's
   idempotent normalization (case-tolerant mid-sentence anchor grep).
6. Stage ordering held: the stage-1 engine commit is an ancestor of every stage-2 commit
   (`git merge-base --is-ancestor` per commit pair).
7. `grep -rn 'zero-task' skills/war/assets/workflow-template.js skills/war/references/schemas.md`
   yields no match claiming a zero-task phase builds the Provision-barrier prompt or requires the
   phase fields for prompt-build reasons; both files instead carry the fail-fast rationale naming
   `held:workflow-error`; both edits share one commit.
8. `grep -c '(exact bytes, backticks included)' docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`
   returns 0, and the task-1.1 bullet's replacement literal now byte-matches the non-backtick form in
   its own End state #8; the #815 durable count test in `workflow-template.test.mjs` is untouched and
   green.
9. `node --test skills/war/assets/skill-doc-contracts.test.mjs` green with at least two new
   spec-truth rows (the 2026-06-25 §5.3 CAS-prose guard; the docker-bullet reader-vs-producer guard),
   and each row fails when its guarded prose is reverted to the pre-fix wording (weak-assertion
   check: delete the correction mentally).
10. The `skills/war/SKILL.md` docker bullet no longer attributes the classification-base re-run to
    `classOf`; it names `classOf` as a reader of the refiner-computed `gate_failure_class`.
11. The #887 sweep record exists in the stage-2 implementation commit body: the grep-floor command,
    every hit's verify/correct disposition, and the manual same-scope survey outcome (stragglers
    listed as survey-derived corrections, or an explicit none-found note) — zero survey notes
    recorded = criterion failed.
12. Full gates green at each stage's land: `node --test 'skills/**/*.test.mjs'`; the shell suites via
    the composed gate's own discovery loop; `node skills/_shared/war-memory.mjs lint docs/learnings/`
    if any learning was touched.
