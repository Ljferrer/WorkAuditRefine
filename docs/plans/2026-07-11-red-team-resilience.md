# Red-team resilience — analyzed-agent fallback + ff-topology probe

Source spec: docs/specs/2026-07-11-red-team-resilience-design.md
Issues: #727 (whole — close at aftermath). #650 is **not** closed by this plan: the survey
manifest (`.claude/aot/2026-07-11-survey.json`) assigns #650 to the partial-phase-recovery spec;
this plan only lands the ff-topology (red-team) half — leave #650 open with a scoping comment
naming what landed here.

## Commander's Intent

- **Purpose:** stop `/red-team` from silently reporting strength it does not have — a harness that
  drops the built-in `Explore` agent must degrade to a logged fallback instead of collapsing 11/13
  probes, and a plan anchored on per-task merge commits that WAR's fast-forward topology never
  creates must trip a mandatory probe instead of sailing to CLEARED.
- **Method:** a reactive shared dispatch wrapper in the scaffold (preferred `Explore`, overridable
  via `args.analyzedAgentType`; fixed fallback `general-purpose`; both dispatch sites; a second
  death **rethrows** so both sites converge on the existing pipeline-catch → Layer-4 →
  dropped-marker → `INCOMPLETE` path), plus a Lead-run `ff-topology` executed probe ratified as
  prose (SKILL.md Step 2 mandatory derivation rule + `references/lenses.md` catalog row — never a
  `SPINE` entry), both pinned by behavioral tests and a clause-anchored presence-pair drift guard.
  The plan implements the spec's resolved design tree; one mechanics deviation (rethrow, not
  return-null) is logged in Notes and honors the spec's own exhausted-fallback contract.
- **End state:**
  1. `node --test skills/red-team/assets/workflow-scaffold.test.mjs` is green; a mock harness that
     throws on `agentType: 'Explore'` yields FINDINGS results for all analyzed probes via captured
     fallback dispatches with `agentType: 'general-purpose'`, zero dropped markers, and a logged
     diagnostic carrying the stable token `analyzed-agent fallback engaged` (greppably distinct
     from the Layer-4 `retrying once` line).
  2. The same recovery holds when the mock returns `null` instead of throwing (both failure shapes
     pinned by test variants).
  3. With both agent types dead, the affected probe slot ends as `{ probe, dropped: true }` and the
     scaffold's returned `expected` equals the full probe count — pinned for **both** sites (a
     both-dead analyzed probe, and a both-dead *confirm* on a blocking analyzed probe), and a
     committed test pipes the both-dead scaffold output through
     `node skills/red-team/assets/red-team-gate.mjs --stdin` and asserts verdict `INCOMPLETE`.
  4. Captured opts for executed probes show `agentType` undefined with exactly one dispatch each —
     the fallback wrapper never touches the executed path.
  5. `args.analyzedAgentType: 'custom-agent'` appears as the dispatched agentType at **both** the
     probe (`runProbe`) and adversarial-confirm (`confirmStage`) sites; and with
     `args.analyzedAgentType: 'general-purpose'` (preferred === fallback) a dead dispatch produces
     **no** identical second dispatch — it goes straight to the rethrow/Layer-4 path.
  6. `grep -c "'Explore'" skills/red-team/assets/workflow-scaffold.js` counts exactly 1 — the
     preferred-type constant; both dispatch sites reference constants, not the literal.
  7. The scaffold's SAFETY comment no longer names Explore as the sole analysis agent (the old
     sentence `Analysis probes are read-only (Explore agent)` greps to zero hits; the replacement
     names the preferred-with-fallback pair and the scope-lock + escape-guard confinement).
  8. `skills/red-team/references/lenses.md` bespoke catalog contains an `ff-topology` executed row
     whose gist names the fast-forward fixture (linear single-parent chain, no per-task merge
     commit, single `--no-ff` phase land), all three trigger anchors (`^1`, `--first-parent`,
     post-merge three-dot), the fixture carve-outs (fresh `git init` synthetic repo — never a copy
     of `repo`; provision-exempt — never warn-and-skip on a repo provision failure), and the
     vacuous-pass clause (false-positive trigger → `status:"pass"`, `findings:[]`, never invent a
     clause); the note under the table states mandatory-when-triggered, `--fast`-proof, and
     precedence over the no-runnable-artifacts executed-drop guidance.
  9. `skills/red-team/SKILL.md` Step 2 names `ff-topology` as mandatory when a per-task
     merge-commit anchor appears, never skipped under `--fast`, carries the grep-is-a-floor manual
     prose-read mandate, and states the probe applies to design-doc/PRD artifact kinds too (its
     fixture is self-contained, so the drop-executed-probes guidance does not exempt it).
  10. The presence-pair drift guard in `workflow-scaffold.test.mjs` turns red when either prose
      surface loses the `ff-topology` token **or** its load-bearing clauses — a case-insensitive,
      mid-sentence-anchored assert that each surface's ff-topology region still carries `mandatory`
      and `--fast`.
  11. The catalog row's fixture claims reproduce in a scratch repo: post-merge
      `git diff <integration>...<task>` emits nothing, and `git rev-parse <task-tip>^1` resolves to
      the chain's previous commit — worker-run evidence, transcript recorded in the task
      done-report.
  12. Every new behavioral test fails against the pre-change scaffold (mutation check: stash the
      scaffold edits → new cases red; restore → green) — worker-run evidence recorded in the task
      done-report.
  13. `CONTEXT.md` defines **topology-void** and **analyzed-agent fallback** in the glossary's
      house style (`**Term**:` + `_Avoid_:` under the
      `### Red-team plan-vs-state grading (ADR 0032 / ADR 0033)` section).
  14. All four release slots carry the next free patch above the live integration base.

## Build order (for /war)

- **Phase 1 — fallback + probe + guards**: Task 1 (all four red-team surfaces, coupled by the
  presence-pair guard) ∥ Task 2 (CONTEXT.md terms) — file-disjoint, one wave.
- **Phase 2 — release**: version bump, trailing (shared slot files must land last).

## Phase 1 — analyzed-agent fallback and ff-topology probe

### Task 1: scaffold fallback + behavioral tests + prose pair + presence guard

- Files: `skills/red-team/assets/workflow-scaffold.js`,
  `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/red-team/SKILL.md`,
  `skills/red-team/references/lenses.md`
- Plan slice — implement spec §4 with the Notes-logged deviations; all four files are one task
  because the presence-pair guard (in the test file) reads both prose files, and the fallback
  tests live in that same test file (same file → same task, per the decomposition rule):

  **`workflow-scaffold.js`** —
  1. Named module-level constants placed **immediately after the
     `const { planFile, repo, ... } = A` args destructure** (NOT beside `ADVERSARIAL_CONFIRM`,
     which precedes the `A` initialization — placing them there is a reference-before-init
     crash): `ANALYZED_AGENT` = `analyzedAgentType ?? 'Explore'` (add `analyzedAgentType` to that
     destructure; this constant is the only surviving `'Explore'` literal) and
     `ANALYZED_AGENT_FALLBACK = 'general-purpose'`.
  2. Shared fallback dispatcher `dispatchAgent(prompt, opts)` used by **both** dispatch sites:
     - `opts.agentType` undefined (executed probes) → plain `agent(prompt, opts)`, no wrapping.
     - Otherwise `await agent(prompt, opts)` in a try/catch where a throw **or** a nullish result
       (treated uniformly — the failure shape is harness-version-dependent) triggers one `log()`
       diagnostic with the stable token `analyzed-agent fallback engaged:` naming the probe label,
       the dead agentType, and the fallback, then a re-dispatch with
       `{ ...opts, agentType: ANALYZED_AGENT_FALLBACK }`.
     - **Redundant-dispatch guard:** when `opts.agentType === ANALYZED_AGENT_FALLBACK` already
       (operator override to `general-purpose`), a first death skips the identical re-dispatch and
       goes straight to the exhausted path.
     - **Exhausted path — rethrow, never swallow:** a second death (throw or nullish fallback
       result — normalize nullish to a throw) throws a descriptive Error naming the probe label
       and both dead types. The Workflow `pipeline()` catches a throwing stage and nulls the whole
       item (the documented semantics `workflow-scaffold.test.mjs`'s `fakePipeline` mirrors), so
       both sites — probe AND confirm — converge on the existing Layer-4 retry → dropped-marker →
       gate-`INCOMPLETE` path. Do NOT return null from the exhausted path: at the confirm site a
       null confirm result falls through `if (c && c.reproduced === false)` and silently lets an
       unconfirmed fail stand as a blocker, mis-stating adversarial-confirm coverage (see Notes).
     - Comment the bound: worst case per analyzed probe is 2 dispatches × (initial + one Layer-4
       retry) = 4, plus the same factor on a confirm — bounded, composes with Layer 4, never
       multiplies it unboundedly.
  3. Both dispatch sites — the `runProbe` arrow and the `confirmStage` confirm `agent(...)` call —
     switch to `dispatchAgent(...)` with the ternary
     `agentType: p.technique === 'analyzed' ? ANALYZED_AGENT : undefined` (identical at both
     sites; executed probes keep `undefined` and bypass the fallback entirely).
  4. Comment truth: rewrite the SAFETY block sentence `Analysis probes are read-only (Explore
     agent).` to name the preferred-with-fallback pair and note that fallback confinement rides
     the scope-lock preamble (prevention) + `assert-no-repo-escape.sh` (detection, ADR 0033).
     Grep the whole file for `Explore` in the same edit and reconcile every mention. **Manual
     same-scope survey note:** grep is a floor — also hand-scan the scaffold's other comment
     blocks and the test file's test titles for prose implying Explore-only analysis, and fix
     stragglers as survey-derived corrections.

  **`workflow-scaffold.test.mjs`** — new behavioral cases on the existing mock-agent harness
  (`runScaffold`/`compileScaffold`, which already captures every dispatch's `opts` and `logs`).
  Agent-name literals (`'Explore'`, `'general-purpose'`) are **deliberately hardcoded** in the
  tests: the scaffold compiles as a function body (nothing importable), and a future default
  change must loudly break these tests, not silently ride through.
  1. Fallback recovery — mock `agent` throws (and, in a second variant, returns null) whenever
     `opts.agentType === 'Explore'`, answers normally otherwise: every analyzed probe still yields
     a FINDINGS result, captured opts show the fallback dispatch with
     `agentType: 'general-purpose'`, `probeResults` contains zero dropped markers, and
     `logs` carries the stable `analyzed-agent fallback engaged` token.
  2. Exhausted fallback stays loud — mock dies for *both* agent types on analyzed probes: each
     analyzed probe emits `{ probe, dropped: true }`, returned `expected` still equals the full
     probe count, executed probes unaffected. **Gate pipe (committed, End-state 3):** spawn
     `node red-team-gate.mjs --stdin` (spawnSync with the scaffold's returned object as stdin
     JSON) and assert the emitted verdict is `INCOMPLETE`.
  3. Confirm-site both-dead — a blocking analyzed probe (status `fail`, one Major) whose confirm
     dies for **both** agent types: after the Layer-4 retry the probe slot ends as
     `{ probe, dropped: true }` (never an unconfirmed fail standing as a blocker), `expected`
     equals the full probe count.
  4. Executed probes never wrapped — captured opts for `technique: 'executed'` probes show
     `agentType` undefined and exactly one dispatch (no fallback re-dispatch).
  5. Override honored — `args.analyzedAgentType: 'custom-agent'` appears as the preferred type at
     both the probe and the confirm dispatch sites; and with
     `args.analyzedAgentType: 'general-purpose'` a dead analyzed dispatch is attempted exactly
     once per pipeline pass (no identical second dispatch).
  6. Confirm-site parity — a blocking analyzed probe whose confirm's `Explore` dispatch dies once
     still gets a fallback-dispatched confirm (captured confirm opts show `general-purpose`).
  7. Prose presence pair — read `../SKILL.md` and `../references/lenses.md` (the same cross-file
     read idiom the D7 guard in `red-team-gate.test.mjs` uses) and assert: (a) the literal probe
     name `ff-topology` is present in both; (b) in each surface, the ff-topology region also
     matches case-insensitive mid-sentence anchors for `mandatory` and `--fast` (the
     mirrored-clause-presence lesson: token presence alone lets "mandatory" rot to "recommended"
     while the guard stays green).
  Delete-the-feature check on every new case (weak-assertion lesson): each must fail against the
  pre-change scaffold — verify by stashing the scaffold edits (cases 1–6) / stripping the token or
  the `mandatory` clause from a prose copy (case 7). Record the red/green transcript in the task
  done-report (End-state 12).

  **`SKILL.md`** — append to Step 2's derive-probes cue list the mandatory derivation rule (spec
  §4 blockquote, verbatim in substance): per-task merge-commit anchor (`^1` on a task/merge ref,
  `--first-parent` per-task diffs, a post-merge three-dot floor base, or prose claiming a per-task
  "merge commit") → **`ff-topology`** (executed, from the catalog) — mandatory when any such
  anchor appears, never skipped under `--fast`; token grep is the floor — also read the plan's
  evidence-pipeline / floor-invocation prose for merge-anchor claims phrased without the tokens,
  and add the probe on a prose match too. **Precedence clause:** the rule applies to every
  `artifactKind` including `design-doc`/`prd` — the probe builds its own runnable fixture, so the
  lenses.md "no runnable artifacts → drop the executed probes" guidance never exempts it. Like
  `default-flip-old-absent`, the Lead adds it as a bespoke executed probe (scaffold array or
  `args.probes`) — never by editing the `SPINE` const.

  **`references/lenses.md`** — add the `ff-topology` row to the bespoke probe catalog table
  (spec §4 row: plan feature = per-task merge-commit anchor; technique = executed; gist = build a
  throwaway repo reproducing WAR's real topology — base commit → integration branch → ≥2 "task"
  integrations as fast-forward merges (linear single-parent chain, NO per-task merge commit) →
  one final `--no-ff` phase land — then evaluate every claimed anchor against it; error,
  wrong-commit resolution (`^1` on a single-parent tip walks to the previous commit), or
  degenerate/empty diff (post-merge `<integration>...<task>` is always empty once the task tip is
  an ancestor) = topology-void → Major, fixture output as evidence). The gist additionally states
  three carve-outs the unconditional executed scope-lock would otherwise contradict:
  - **Fixture, not repo copy:** the fixture is a fresh `git init` synthetic repo built inside the
    throwaway sandbox — never a copy of `repo`; nothing in `repo` is inspected or run.
  - **Provision-exempt:** the plan's `provision` commands set up the repo copy, which this probe
    does not use — build and evaluate the fixture even if repo provisioning failed or was
    skipped; a provision failure never converts this probe to warn-and-skip.
  - **Vacuous pass:** if on reading the plan no clause actually anchors per-task evidence on
    merge topology (a false-positive token trigger — `^1` in an unrelated code block), return
    `status:"pass"` with `findings:[]` — never invent a clause to evaluate.
  Add one sentence under the table: the row is mandatory when triggered, `--fast`-proof, and
  takes precedence over the "no runnable artifacts → drop the executed probes" guidance (mirrors
  the SKILL.md Step 2 rule; the presence-pair guard in `workflow-scaffold.test.mjs` pins the
  pair). Also extend the report template's `## Attack surface` line with a fallback slot —
  `Fallback: <none | analyzed-agent fallback engaged on: probe names>` — so a run executed under
  fallback records the coverage degradation in the durable artifact, not only the transcript.

  Fixture sanity (End-state 11): before finalizing the catalog gist, reproduce the topology-void
  classes in a scratch repo (ff chain + `--no-ff` land; confirm the empty three-dot diff and the
  `^1` mis-resolution) and record the transcript in the task done-report.

  Out of scope, per spec: no `SPINE` array edit, no `red-team-gate.mjs` change, no new enum or
  escalation reason (ADR 0005 untouched — `HARD_ESCALATION_REASONS` is not touched at all), no
  `agents/*.md` surface (the scaffold is a red-team asset, not a WAR dispatched-prompt pair).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: CONTEXT.md domain terms

- Files: `CONTEXT.md`
- Plan slice: add the two spec §6 terms to the glossary under the existing
  `### Red-team plan-vs-state grading (ADR 0032 / ADR 0033)` section, in house style
  (`**Term**:` definition + `_Avoid_:` line):
  - **topology-void** — a plan clause anchored on git topology that does not exist under WAR's
    fast-forward per-task merges (a per-task merge commit, its `^1` parent, a non-empty post-merge
    three-dot diff). _Avoid_: conflating with a merge *conflict* — the anchor is void, not
    contested.
  - **analyzed-agent fallback** — the red-team scaffold's reactive re-dispatch of an analyzed
    probe/confirm from the preferred read-only agent type to `general-purpose` when the harness
    lacks the preferred type. _Avoid_: "capability check" — the fallback is reactive (detect the
    dead dispatch, re-dispatch), never a pre-flight harness query.
  Verification in lieu of a test (self-authored guard, case-insensitive with a stable mid-sentence
  anchor per the sentence-case lesson): `grep -in 'topology-void' CONTEXT.md` and
  `grep -in 'analyzed-agent fallback' CONTEXT.md` each hit exactly once in the glossary. **Manual
  same-scope survey note:** also read the surrounding glossary section to confirm neither term
  collides with an existing entry or the war-memory provenance vocabulary.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — release

### Task 3: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump **all four slots to the next free patch above the live integration base at
  land time** — `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json`
  `metadata.version` **and** `plugins[0].version`, and the `README.md` `## Status` line
  (replace-in-place, never a badge, never an emptied field). This plan deliberately carries **no
  version literal** (the stale-literal class has 12 recorded recurrences): resolve the number from
  the four slots themselves at land time. The lock-step drift guard `version-slots.test.mjs` is
  the arbiter — a bump that misses a slot goes red.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **ff-topology mandatory-trigger adherence in a live run** · why deferred: the derivation rule is
  Lead-run prose (the ratified shape for conditional probes — spec constraint on `SPINE`
  ownership); no mechanical trigger exists, and trigger-token drift is an accepted spec §8 risk —
  the presence-pair guard pins the rule's *existence and its mandatory/`--fast` clauses*, not the
  Lead's obedience · runner: the first `/red-team` run against a plan carrying a per-task
  merge-commit anchor; the run report must show the `ff-topology` probe in its attack surface.
- **Live-harness fallback engagement + `general-purpose` validity** · why deferred: the mock
  harness pins both failure shapes (throw and null), but a real mid-session `Explore` drop (the
  recorded 2026-07-10 incident shape) — and the continued existence of `general-purpose` itself,
  the one harness-owned name the recovery path depends on — are only observable in production ·
  runner: the next `/red-team` run transcript on a harness lacking `Explore` — the log must show
  the `analyzed-agent fallback engaged` token with zero dropped markers, not the executed-only
  collapse; a dead `general-purpose` surfaces as dropped markers → `INCOMPLETE`, never a silent
  pass.

## Notes / conscious deviations

- **Exhausted fallback rethrows; spec §4.2's "returns null" mechanics are superseded.** The spec
  claimed a null return gives "the same shape they see today" — false at the confirm site:
  verified against the documented pipeline semantics (a throwing stage nulls the whole item;
  `fakePipeline` in `workflow-scaffold.test.mjs` mirrors this), a *throwing* confirm today routes
  to Layer-4 → dropped → `INCOMPLETE`, while a *null* confirm result falls through
  `if (c && c.reproduced === false)` and lets the unconfirmed fail stand as a blocker. The spec's
  own design-tree row ("Exhausted fallback | Unchanged Layer-4 path: dropped marker → gate
  `INCOMPLETE` → the Lead re-runs") resolves the intended direction, so `dispatchAgent` throws on
  second death and both sites converge on dropped → `INCOMPLETE`. Side effect (deliberate): a
  null-shaped confirm death, which today silently lets the fail stand, now also routes to
  `INCOMPLETE` — the Lead re-runs instead of reporting an unconfirmed blocker. Both directions are
  fail-closed (neither yields `CLEARED`).
- **Constants sit after the args destructure, not beside `ADVERSARIAL_CONFIRM`** (spec §4.1 said
  "near ADVERSARIAL_CONFIRM"): `ANALYZED_AGENT` reads the destructured `analyzedAgentType`, and
  `A` is initialized ~13 lines after `ADVERSARIAL_CONFIRM` — the literal placement is a
  reference-before-init runtime crash on every run.
- **Redundant-dispatch guard added** (not in spec): preferred === fallback ⇒ a dead dispatch skips
  the identical second dispatch. No fallback opt-out flag for operator overrides — the fallback
  stays active and logged even over an explicit stricter `args.analyzedAgentType` (YAGNI; the log
  token + report slot make the widening visible; the spec fixed the fallback type deliberately).
- **Presence-pair guard strengthened past token presence:** case-insensitive mid-sentence anchors
  for `mandatory` and `--fast` per surface (the
  gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity lesson — token-only
  lets "mandatory" rot to "recommended" silently).
- **Catalog gist carries three carve-outs the spec lacked** — git-init fixture (never a repo
  copy), provision-exempt (the unconditional executed scope-lock + provision directive would
  otherwise direct the probe to copy the repo and to warn-and-skip on a provision failure), and
  the vacuous-pass clause (a false-positive `^1` token trigger costs one passing probe, never a
  manufactured finding — the FINDINGS-means-defect contract already ratifies `pass` +
  `findings:[]`).
- **Explicit precedence over the executed-drop guidance:** lenses.md says design docs/PRDs drop
  executed probes; the ff-topology rule wins because its fixture is self-contained — stated on
  both prose surfaces so the implementer never resolves the conflict silently.
- **Validation-criteria homes named (ADR 0017):** spec criterion 3 (gate pipe → `INCOMPLETE`) is a
  committed automated test in `workflow-scaffold.test.mjs`; criteria 11 (scratch-repo fixture
  reproduction) and 12 (stash-the-edits mutation check) are worker-run evidence recorded in the
  Task 1 done-report — the auditor verifies the transcripts, nothing is waived in prose.
- **Tests hardcode agent-name literals** (`'Explore'`, `'general-purpose'`): the scaffold compiles
  as a function body with nothing importable, and the chosen coupling direction is loud-break — a
  future default change must turn these tests red. Harness validity of `general-purpose` is not
  CI-testable; it rides the live-harness backstop.
- **Fallback observability:** the log line carries the stable token
  `analyzed-agent fallback engaged` (distinct from Layer-4's `retrying once`), pinned by test; the
  report template's Attack-surface line gains a `Fallback:` slot (one lenses.md line beyond spec)
  so the durable report records degraded-mode runs, not just the transcript.
- **Scratch-copy snapshot note:** the scaffold is copied to a per-run scratch path; already-copied
  scaffolds of in-flight/resumed red-team runs keep the old ternary. A resumed run that hits the
  missing-Explore shape must re-copy the scaffold from the landed tree; nothing mechanical
  enforces this — it is a one-line operator note, accepted.
- **All four Task-1 files ride one task** despite spanning code and prose: the presence-pair guard
  lives in the same test file as the fallback behavioral cases and reads both prose surfaces —
  splitting would either collide on `workflow-scaffold.test.mjs` (forbidden same-file parallel) or
  ship the guard before/after its guarded tokens (defined-but-not-yet-emitted). The spec §8 note
  calling the scaffold+test pair "file-disjoint from the two prose files" is unsatisfiable as a
  split and is superseded by this combined shape.
- **The spec's `Explore`-literal criterion is a count** (`grep -c` = 1), not an absence guard —
  the literal legitimately survives in the preferred-type constant.
- **Capability widening on fallback** (`general-purpose` writes where `Explore` cannot) is
  accepted per spec §8: confinement rides the existing scope-lock preamble +
  `assert-no-repo-escape.sh` unchanged; no new confinement surface is in scope.
- **CONTEXT.md is authoritative scope** (spec §6 wins over §5's "No other surfaces", which is
  red-team-surface-scoped); it rides its own minimal task so cross-plan campaign rebases on this
  high-traffic file conflict as small as possible.
- **No `agents/*.md` change:** the prompt-surface split rule (standing `agents/*.md` +
  `workflow-template.js` same commit) does not bind here — the changed dispatch prompts live in
  the red-team scaffold, which is its own single surface.

## Open decisions

None — the spec's design tree plus the Notes-logged reconciliations resolve every mechanism
decision; `/red-team` ratifies the backstops above.
