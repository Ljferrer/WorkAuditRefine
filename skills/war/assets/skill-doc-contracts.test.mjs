import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Doc-contract drift guards (plan: drift-guards-for-mirrored-and-asserted-facts, Task 1.4).
// Root is resolved from import.meta.url — NEVER process.cwd() (subagent cwd is the main repo;
// cwd resets between bash calls). HERE = skills/war/assets.
// ponytail: deliberately regex/JSON extraction, not a markdown AST parser — the registry/prose
// guards in this campaign take extraction+equality as the ceiling, no AST scanner.
// Maintenance rule: a sanctioned rewrite of a guarded claim updates its row in the SAME commit —
// this file is where revert-pressure lands when a row reds; correct the row to the new truth,
// never delete or weaken it to make a reword pass.
const HERE = dirname(fileURLToPath(import.meta.url))
const skillMd = readFileSync(join(HERE, '..', 'SKILL.md'), 'utf8')
// Prompt-surface simplification (spec §4.3): tier-2+ SKILL.md blocks moved verbatim into
// references/ — presence keys relocate their read to the destination file; OLD-absent keys widen
// to a UNION over origin + every destination (adjudication I).
const resumeMd = readFileSync(join(HERE, '..', 'references', 'resume-and-recovery.md'), 'utf8')
const dockerMd = readFileSync(join(HERE, '..', 'references', 'docker-gate.md'), 'utf8')
const setupRefMd = readFileSync(join(HERE, '..', 'references', 'setup.md'), 'utf8')
const submoduleMd = readFileSync(join(HERE, '..', 'references', 'submodule-flows.md'), 'utf8')
const tour = JSON.parse(
  readFileSync(join(HERE, '..', '..', '..', '.tours', 'architect-war-system.tour'), 'utf8'),
)
// Spec-truth guards (D15–D17) read the ratified design specs directly — same construct-anchored
// extraction style as the SKILL.md/tour rows above.
const specCasIsolation = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'specs', '2026-06-25-concurrent-run-land-isolation-design.md'),
  'utf8',
)
const specProseDrift = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'specs', '2026-07-12-prose-drift-corrections-design.md'),
  'utf8',
)
// Glossary + contract reads (D19/D20) — same construct-anchored style as the rows above.
// CONTEXT.md is the repo-root ubiquitous-language glossary; schemas.md is the war skill's contract
// sheet (skills/war/references/), so the two roots differ — both resolved from HERE, never cwd.
const contextMd = readFileSync(join(HERE, '..', '..', '..', 'CONTEXT.md'), 'utf8')
const schemasMd = readFileSync(join(HERE, '..', 'references', 'schemas.md'), 'utf8')
// (D23) This file's FIRST `docs/adr/` read — same construct-anchored style, third root.
const adr0037 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0037-run-scoped-staged-phase-scripts.md'),
  'utf8',
)
// (D25) The two surfaces of ONE cross-ADR prose mirror — 0040 §B is the canonical source, 0019's
// Amendment the mirror site. Both are read so a per-surface revert reds (ADR 0025's mirror registry).
const adr0019 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0019-target-derived-execution-values.md'),
  'utf8',
)
const adr0040 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0040-environment-class-gate-failures-earn-one-retry.md'),
  'utf8',
)
// (D26) The audit-evidence-precedence doctrine's glossary mirror — CONTEXT.md `### Audit` terms
// restate ADR 0041's D3 conflict semantics and lessons floor rule (ADR 0025 same-task mirror guard).
const adr0041 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0041-audit-evidence-precedence.md'),
  'utf8',
)
// (D29) The prompt-surface-budgets doctrine's canonical record plus its two prose mirror surfaces
// beyond CONTEXT.md (read via contextMd above): CLAUDE.md's hot/cold-law summary, and the budget
// suite's header formula comment — the ×1.10/×1.25 numeric pair's ONLY mirror block (neither
// prose summary carries the numbers; verified at this task's base).
const adr0042 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0042-prompt-surface-budgets.md'),
  'utf8',
)
const claudeMd = readFileSync(join(HERE, '..', '..', '..', 'CLAUDE.md'), 'utf8')
const budgetSuiteSrc = readFileSync(join(HERE, 'prompt-surface-budgets.test.mjs'), 'utf8')
// (D9) The submodule-mutation floor's two surfaces: the refiner card that SHOWS the invocation
// (fourth root — agents/, alongside skills/, docs/ and the repo root above) and the script that
// PRINTS its own usage. The basename is a const so this file can build its patterns from it and
// never spell the retired flag-first byte-run — see the D9 block at the end of this file.
const FLOOR_SCRIPT = 'assert-no-submodule-mutation.sh'
const refinerCard = readFileSync(join(HERE, '..', '..', '..', 'agents', 'war-refiner.md'), 'utf8')
// The disposition-eligibility reference — read for the source-derivable absorb-eligibility
// presence guard (realized-absorb-rate Task 3.3, re-anchored by ask-disposition Task 1.1): the
// clarification lives in the evicted eligibility blockquotes, whose home is now
// skills/war/references/disposition-eligibility.md (the card keeps a trigger pointer); it is
// never mirrored into auditPrompt() or the DISPOSITION RULE sentences.
const eligibilityRef = readFileSync(
  join(HERE, '..', 'references', 'disposition-eligibility.md'),
  'utf8',
)
const floorScriptSrc = readFileSync(join(HERE, FLOOR_SCRIPT), 'utf8')
// (refiner-evict) The ADR 0042 eviction of the refiner card's `## Gate-failure classification`
// section (plan 2026-09-03-in-band-absorb-default, D12 · Task 2.1) — the new references home and
// the two references files whose in-card `#gate-failure-classification` anchors were re-keyed.
const gateFailureMd = readFileSync(
  join(HERE, '..', 'references', 'gate-failure-classification.md'),
  'utf8',
)
const budgetRaiseFloorMd = readFileSync(
  join(HERE, '..', 'references', 'budget-raise-floor.md'),
  'utf8',
)
const refinerRecoveryMd = readFileSync(
  join(HERE, '..', 'references', 'refiner-recovery.md'),
  'utf8',
)
// (D34–D36) The authoring-side-verification glossary mirrors (plan 2026-08-24, Task 2.3): the
// war-strategy authoring surfaces are the canonical homes the new/converged CONTEXT.md glossary
// entries restate — SKILL.md §3's rule 8 + §2's oracle-duality bullet, the interview doctrine's
// pin-ledger/recon-lane/probe law, and the strategy-verifier charter. Read here so each mirror
// row can assert BOTH surfaces (ADR 0025: a one-sided edit reds).
const warStrategySkillMd = readFileSync(
  join(HERE, '..', '..', 'war-strategy', 'SKILL.md'),
  'utf8',
)
const planInterviewMd = readFileSync(
  join(HERE, '..', '..', 'war-strategy', 'references', 'plan-interview.md'),
  'utf8',
)
const verifierCharterMd = readFileSync(
  join(HERE, '..', '..', 'war-strategy', 'references', 'strategy-verifier.md'),
  'utf8',
)
// (D36, re-bind #1652/#1676) The Evidence-artifacts duty's THREE normative homes, all landed since
// the row was first authored against the consumption surface alone: ADR 0044's `### Evidence-duty
// home` section (the decision record), `/survey-corps` Step 0.3's issue template, and the clustered
// filing prompt's emission clause in the engine template (the /war filing site). The recorded
// [[guard-duty-authored-in-an-earlier-phase-cannot-bind-a-normative-home-landing-in-a-later-phase]]
// lesson is exactly this row's history — the homes landed a phase later, so the binding is made
// here, not left on the one generic consumption-surface key.
const adr0044 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0044-authoring-contract-and-merged-artifact.md'),
  'utf8',
)
const surveyCorpsSkillMd = readFileSync(
  join(HERE, '..', '..', 'survey-corps', 'SKILL.md'),
  'utf8',
)
const workflowTemplateSrc = readFileSync(join(HERE, 'workflow-template.js'), 'utf8')
// (D37–D42) The ask-disposition surfaces (#1550; plan 2026-08-25-ask-disposition, Task 2.3):
// ADR 0013's dated amendment is the canonical decision record the new CONTEXT.md glossary terms
// restate; ADR 0012 carries the one-line cross-ref; design.md + file-followups.md carry the
// Task 2.2 reference mirrors; war-review's SKILL.md is the canonical home of the grind-measurement
// doctrine. Read here so every mirror row asserts BOTH surfaces (ADR 0025: a one-sided edit reds).
const adr0013 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0013-commanders-intent-and-disposition-routing.md'),
  'utf8',
)
const adr0012 = readFileSync(
  join(HERE, '..', '..', '..', 'docs', 'adr', '0012-intra-phase-visibility-and-phase-close-sweep.md'),
  'utf8',
)
const designRefMd = readFileSync(join(HERE, '..', 'references', 'design.md'), 'utf8')
const fileFollowupsMd = readFileSync(join(HERE, '..', 'references', 'file-followups.md'), 'utf8')
const auditorCard = readFileSync(join(HERE, '..', '..', '..', 'agents', 'war-auditor.md'), 'utf8')
const gastownMd = readFileSync(join(HERE, '..', 'references', 'gastown-design-params.md'), 'utf8')
const warReviewSkillMd = readFileSync(
  join(HERE, '..', '..', 'war-review', 'SKILL.md'),
  'utf8',
)

// Strip comment leaders BEFORE whitespace-normalizing, then collapse every whitespace run to one
// space — the recorded doc-cascade sweep trap ([[repo-doc-sweep-needs-leader-strip-before-whitespace-normalize-before-grep]]):
// normalizing first glues `#`/`//`/`>` leaders into the sentence, and a clause wrapped at ~100
// columns never matches a contiguous key. Markdown bold `*` is deliberately NOT treated as a leader
// in these two files — stripping it would mangle the very `**term**` markers the blocks extract by.
const norm = (s) =>
  s.split('\n').map((l) => l.replace(/^\s*(?:\/\/+|>+|#+)\s?/, '')).join(' ').replace(/\s+/g, ' ')

// (D10) The Checkpoint classification ladder's routing predicates are the source of truth; each
// class's inline example list must map to its predicate. The recorded regression
// ([[held-workflow-error-infra-death-prose-mismatch]]): infra-death (timeout / killed /
// non-completed) belongs to held:phase-incomplete and must NEVER migrate into the
// held:workflow-error class-examples list. Located by construct (the `status !== "completed"`
// rule and the `held:workflow-error` outcome bullet), not by line number.
test('D10 — held:workflow-error class examples exclude infra-death (which routes held:phase-incomplete)', () => {
  // Rule 1 of the fail-closed ladder: `status !== "completed"` → its target class + predicate text.
  const rule1 = skillMd.match(
    /If `status !== "completed"`\s*\(([^)]*)\)\s*→ classify as `(held:[a-z-]+)`/,
  )
  assert.ok(rule1, 'could not locate the `status !== "completed"` classification rule in SKILL.md')
  assert.equal(
    rule1[2],
    'held:phase-incomplete',
    'the infra-death predicate (status !== "completed") must route to held:phase-incomplete',
  )
  const predicate = rule1[1].toLowerCase()

  // The infra-death vocabulary the predicate claims for held:phase-incomplete. Asserting these
  // are present in the predicate binds this denylist to the doc's own wording — if the predicate
  // is reworded away from these terms, this guard fails loudly and must be updated deliberately.
  const INFRA_DEATH = ['timed out', 'killed']
  for (const term of INFRA_DEATH) {
    assert.ok(
      predicate.includes(term),
      `the held:phase-incomplete predicate should name infra-death term "${term}" (reworded? update this guard)`,
    )
  }

  // Isolate the held:workflow-error outcome bullet by construct (marker → next held:* bullet).
  // Relocated read: the outcome-handling bullets moved verbatim into references/resume-and-recovery.md.
  const wfErr = resumeMd.match(/- \*\*`held:workflow-error`[\s\S]*?(?=\n\s*- \*\*`held:)/)
  assert.ok(wfErr, 'could not locate the held:workflow-error outcome bullet in references/resume-and-recovery.md')
  const examples = wfErr[0].match(
    /\*\*Class examples\*\*(.*?)(?:Those never route|The documented exit)/s,
  )
  assert.ok(examples, 'could not locate the "Class examples" list inside the held:workflow-error bullet')
  const examplesText = examples[1].toLowerCase()

  for (const term of INFRA_DEATH) {
    assert.ok(
      !examplesText.includes(term),
      `infra-death term "${term}" must NOT appear in the held:workflow-error class examples — ` +
        `it routes held:phase-incomplete ([[held-workflow-error-infra-death-prose-mismatch]])`,
    )
  }
})

// (D12) Tour step 17 (the step whose file is land-decision.mjs) is mechanism-style narrative: it
// describes the mirror invariant and names the guard that holds it, with NO snapshot member count
// and NO line-number reference. Located by its `file` construct, not step index. The live rot this
// replaces was "lists 8 reasons — the same 8" and "workflow-template.js (≈841)".
// [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]]
test('D12 — tour step 17 (land-decision.mjs) carries no member count / line-number reference', () => {
  const step = tour.steps.find((s) => s.file === 'skills/war/assets/land-decision.mjs')
  assert.ok(step, 'could not find the tour step whose file is land-decision.mjs')
  const desc = step.description

  const FORBIDDEN = [
    { re: /\d+\s+reasons?/i, label: 'member count ("N reasons")' },
    { re: /same\s+\d+/i, label: 'snapshot count ("same N")' },
    { re: /≈\s*\d+/, label: 'approximate line-number reference ("≈N")' },
  ]
  for (const { re, label } of FORBIDDEN) {
    const hit = desc.match(re)
    assert.ok(!hit, `tour step 17 must not carry a ${label}; found: ${hit ? hit[0] : ''}`)
  }

  // Non-vacuity: the step must actually name the mirror invariant + its guard (so the grep above
  // is asserting against real mechanism-narrative, not an emptied-out step).
  assert.match(
    desc,
    /mirror-registry drift-guard/i,
    'tour step 17 should name the mirror-registry drift-guard that holds the mirrors identical',
  )
})

// (D13) Every `.sh` asset invoked in SKILL.md or its eviction-destination references/ files must run
// under `bash`, never `node` — the scripts are
// `#!/usr/bin/env bash`, so a `node <script>.sh` invocation SyntaxErrors on every Setup, Gate-2, and
// manual-land call (#741). The riskiest exposure is the Checkpoint/escalation land recipes: a
// SyntaxError on `land-advance` tempts a Lead into the raw `git push` those recipes exist to prevent.
// Assert-OLD-absent: no `node ` immediately invoking a non-whitespace path token ending `.sh`
// anywhere in the file — matches BOTH the `${CLAUDE_PLUGIN_ROOT}/…/provision-worktrees.sh` form and
// the `…/provision-worktrees.sh` elided form; the invocation *shape*, not "node" and ".sh" merely
// co-occurring in prose (a `.mjs` helper followed later by `*.test.sh` never matches, since `\S*`
// cannot cross the space between them). The `bash`-prefixed presence companion is anti-vacuous — no
// other D-series guard locks the land recipes' presence, so a wholesale deletion would otherwise pass.
test('D13 — SKILL.md and its eviction destinations invoke every .sh asset with bash, never node (#741)', () => {
  // UNION scan (adjudication I): the OLD-absent invocation-shape key covers the origin surface plus
  // every eviction destination, so a moved recipe can never re-shelter a `node …*.sh` invocation.
  for (const [name, text] of [
    ['SKILL.md', skillMd],
    ['references/setup.md', setupRefMd],
    ['references/docker-gate.md', dockerMd],
    ['references/submodule-flows.md', submoduleMd],
    ['references/resume-and-recovery.md', resumeMd],
  ]) {
    const nodeSh = text.match(/node\s+\S*\.sh\b/)
    assert.ok(
      !nodeSh,
      `${name} invokes a .sh asset with node ("${nodeSh ? nodeSh[0] : ''}") — ` +
        'use bash, or rephrase the example without a literal `node …*.sh` invocation shape',
    )
  }
  assert.match(
    skillMd,
    /bash\s+\S*provision-worktrees\.sh\b/,
    'SKILL.md must retain at least one `bash …/provision-worktrees.sh` invocation (Setup/Gate-2 calls present)',
  )
  assert.match(
    resumeMd,
    /bash\s+\S*provision-worktrees\.sh\b/,
    'references/resume-and-recovery.md must retain at least one `bash …/provision-worktrees.sh` invocation (land recipes present)',
  )
})

// (D14) The Setup step-3 "Daemon reachable" docker bullet must not attribute the platform-signature
// list to the gate-time classifier (#799): the signature list governs ONLY Setup-time per-image
// probe-build deferral, whereas the gate-time `gate_failure_class` is produced by the refiner
// re-running the failing gate at the classification base and comparing failing identifiers (per
// `agents/war-refiner.md`), and only READ by `classOf` in `workflow-template.js` — the two
// share only the `'introduced'` fallthrough. Assert-OLD-absent on the misattribution clause
// (case-insensitive, mid-sentence anchor — the corrected sentence legitimately still says "gate-time
// classifier" to DENY the coupling, so we never key on the bare term). The companion isolates the
// bullet by its `**Daemon reachable**` marker (D10-style intended-location extraction, not a
// whole-file presence check) and asserts the three signatures survive — so deleting the bullet fails
// loudly instead of passing vacuously.
test('D14 — docker bullet does not misattribute the signature list to the gate-time classifier (#799)', () => {
  // UNION on the OLD-absent misattribution clause (adjudication I); the bullet itself moved
  // verbatim into references/docker-gate.md, so the extraction read relocates there.
  for (const text of [skillMd, setupRefMd, dockerMd, submoduleMd, resumeMd]) {
    assert.doesNotMatch(
      text,
      /signature list is what the gate-time classifier keys on/i,
      'the docker prose still couples the platform-signature list to the gate-time classifier ' +
        '(#799 misattribution) — the list governs only Setup-time probe-build deferral',
    )
  }
  const bullet = dockerMd.match(/\*\*Daemon reachable\*\*[\s\S]*?(?=\n\s*- \*\*)/)
  assert.ok(bullet, 'could not locate the **Daemon reachable** docker bullet in references/docker-gate.md')
  for (const sig of ['EBADPLATFORM', 'no matching manifest for <platform>', 'exec format error']) {
    assert.ok(
      bullet[0].includes(sig),
      `the **Daemon reachable** bullet must still name the platform signature "${sig}"`,
    )
  }
})

// (D15) The 2026-06-25 §5.3 land-phase CAS prose was corrected by the #804 prose-drift pass: the
// superseded bare-SHA push + `non-fast-forward` classification is replaced by cmd_land_advance's
// push-first HEAD:refs form, `[rejected]`-token classification, and a 0/2/3 exit contract, with a
// supersession pointer naming cmd_land_advance as the contract of record. This row guards that
// ALREADY-CORRECT prose (no correction applied in this task) — mental-delete check: reverting §5.3
// to the superseded mechanics drops the pointer / push-first / [rejected] / exit codes and reds this.
// Located by the `### 5.3 land-phase` heading construct, not a line number.
test('D15 — 2026-06-25 §5.3 land-phase keeps the push-first CAS contract (cmd_land_advance pointer, [rejected] classification, 0/2/3 exit)', () => {
  const sec = specCasIsolation.match(/### 5\.3 land-phase[\s\S]*?(?=\n### |\n## )/)
  assert.ok(sec, 'could not locate §5.3 land-phase section in the 2026-06-25 spec')
  const s = sec[0]
  assert.match(s, /push-first/i, '§5.3 must state push-first land ordering')
  assert.match(
    s,
    /cmd_land_advance/,
    '§5.3 must keep its supersession pointer to cmd_land_advance (the contract of record)',
  )
  assert.match(s, /\[rejected\]/, "§5.3 must classify the push on the '[rejected]' token")
  for (const code of ['exit 0', 'exit 2', 'exit 3']) {
    assert.ok(
      s.includes(code),
      `§5.3 must document the "${code}" arm of the 0/2/3 land-advance exit contract`,
    )
  }
})

// (D16) The Setup step-3 "Daemon reachable" docker bullet must name the reader-vs-producer split
// truthfully (#887): the REFINER performs the classification-base gate re-run (per
// agents/war-refiner.md Gate-failure classification), and `classOf` in workflow-template.js is a pure
// READER of the refiner-computed gate_failure_class (classOf reads the class off a MergeResult; it
// never re-runs a gate). This row guards prose THIS task CORRECTS, so it carries a Red-proof in the
// commit body. Extract the bullet by its `**Daemon reachable**` marker (D10/D14-style intended-location
// extraction). Negative arm is reword-tolerant: a case-tolerant, mid-sentence pairing of `classOf`
// with a following `re-run`/`re-running` verb — never a byte-lock on the corrected sentence.
test('D16 — docker bullet names classOf a reader of the refiner-computed class, never the re-run agent (#887)', () => {
  // Relocated read: the docker bullet moved verbatim into references/docker-gate.md (D14's move).
  const bullet = dockerMd.match(/\*\*Daemon reachable\*\*[\s\S]*?(?=\n\s*- \*\*)/)
  assert.ok(bullet, 'could not locate the **Daemon reachable** docker bullet in references/docker-gate.md')
  const b = bullet[0]
  // Presence: the refiner is the re-run performer, and classOf is named a reader.
  assert.match(
    b,
    /refiner[\s\S]{0,80}re-runn?/i,
    'the docker bullet must name the refiner as the classification-base gate re-run performer',
  )
  assert.match(
    b,
    /classOf[\s\S]{0,80}read/i,
    'the docker bullet must name classOf as a reader of the refiner-computed gate_failure_class',
  )
  // Negative (reword-tolerant): classOf is never cast as the agent of the re-run.
  assert.doesNotMatch(
    b,
    /classOf[\s\S]{0,80}re-runn?/i,
    'the docker bullet still pairs classOf with the re-run as its verb (#887 reader-vs-producer ' +
      'misattribution) — the refiner re-runs the gate; classOf only reads the resulting class',
  )
})

// (D17) The 2026-07-12 prose-drift spec's #799 replacement-text prescription (§4.2) and its problem
// statement (§1) once asserted, in the spec's own voice, that `classOf` "keys on re-running the
// failing gate" — an instance of the same reader-vs-producer misattribution D16 guards, corrected in
// this task by the #887 docs/specs sweep. Post-#894 truth: the refiner performs the classification-base
// re-run; classOf in workflow-template.js only reads the resulting class. Presence arm anchors on §4.2
// (the prescriptive passage); the reword-tolerant negative arm scans the WHOLE spec so a re-drift at
// EITHER occurrence reds. This row guards prose THIS task corrects → Red-proof in the commit body.
test('D17 — 2026-07-12 prose-drift spec names classOf a reader, never the re-run agent (#887 sweep-corrected)', () => {
  const sec = specProseDrift.match(/### 4\.2[\s\S]*?(?=\n### |\n## )/)
  assert.ok(sec, 'could not locate §4.2 docker-bullet reword section in the 2026-07-12 spec')
  assert.match(
    sec[0],
    /refiner[\s\S]{0,80}re-runn?/i,
    '§4.2 must name the refiner as the classification-base re-run performer',
  )
  assert.match(
    sec[0],
    /classOf[\s\S]{0,80}read/i,
    '§4.2 must name classOf as a reader of the refiner-computed class',
  )
  assert.doesNotMatch(
    specProseDrift,
    /classOf[\s\S]{0,80}re-runn?/i,
    'the 2026-07-12 spec still pairs classOf with the re-run as its verb (reader-vs-producer ' +
      'misattribution) — classOf only reads the refiner-computed gate_failure_class',
  )
})

// (D18) references/resume-and-recovery.md's `gate_failed`-routing **`environment`** arm must document the BOUNDED
// environment-proceed mechanics, never the retired gate-time zero-retry doctrine — the arm formerly
// declared the gate-time route identical to a provision `env-blocked` (soft-escalate, 0 FIX rounds,
// worktree kept, siblings proceed). Live truth: an `environment` gate failure earns ONE environment-proceed
// re-run per gate site whose gate must go FULLY GREEN (never a proceed-over, no debt); merge-site
// exhaustion is HARD via reason 'escalate' → held:escalation, land-site exhaustion → env-blocked +
// held:land-failed (workflow-template.js both gate sites; agents/war-refiner.md step 3).
//
// Extraction is BY CONSTRUCT — the `- **`environment`** →` bullet only, never a whole-file scan:
// "0 FIX rounds" and the zero-round soft doctrine legitimately survive in the PROVISION `env-blocked`
// bullet above, which a whole-file absence key would false-trip (D10/D14/D16-style
// intended-location extraction).
//
// Absence keys are MARKUP-TOLERANT (red-team correction): the live bullet interleaves `**` and
// backticks, so a plain-space phrase would match nothing even pre-change and be born vacuous.
// Red-then-green PROVEN at the pre-change base (commit body carries the proof): both absence keys
// HIT the old bullet and every presence anchor and both routing pairs were ABSENT from it — so a
// revert reds every arm.
//
// The routing arms are PAIRED, not presence-anywhere (#1040): the retired four-entry companion loop
// asserted `merge site` / `land site` / `held:escalation` / `held:land-failed` each present ANYWHERE
// in the bullet, so it greened a bullet with the two exhaustion routes SWAPPED. Proven RED against
// an in-memory copy of the extracted bullet with the two `held:*` tokens swapped (SKILL.md is never
// edited); the commit body carries that swap red plus the per-pair green-half capture record.
// TWO fail-closed residuals — both loud false reds forcing a deliberate re-anchor, never a silent
// pass: (a) the pairing assumes site-before-route ordering within each sentence (true of the live
// bullet, inherent to first-following-token semantics); (b) a later doc edit that adds an early
// JOINT mention ("at either the merge site or land site …") ahead of the real routing sentences
// makes the first-following grab capture from the joint sentence.
//
// The first key's inner space is written `\s+` on purpose: the retired phrase is one of the three
// anchors the End-state-9 retired-claim sweep greps line-locally across `skills/war/` + `agents/`
// (this file included), so spelling it contiguously here would make the guard trip the very floor it
// backs. `\s+` keeps the literal out of the source line while matching the live prose identically —
// and, per the two-line-pairing lesson, strictly widens it across a wrap.
test('D18 — gate_failed environment arm documents bounded environment-proceed, not the gate-time zero-retry doctrine (#1030)', () => {
  // Relocated read: the `gate_failed` routing bullets moved verbatim into
  // references/resume-and-recovery.md (prompt-surface simplification).
  const bullet = resumeMd.match(/^ {2}- \*\*`environment`\*\* →[\s\S]*?(?=\n {2}- \*\*)/m)
  assert.ok(
    bullet,
    'could not locate the `- **`environment`** →` bullet under the `gate_failed` routing ' +
      'in references/resume-and-recovery.md — the D18 construct is gone or its markup changed',
  )
  const b = bullet[0]
  // Absence: the retired gate-time doctrine, in either of its two live-byte-derived forms.
  assert.doesNotMatch(
    b,
    /env-blocked[\s*`]{0,6}doctrine applied\s+at gate time/i,
    'the environment arm still claims the env-blocked doctrine is "applied at gate time" — a ' +
      'gate-time environment failure now earns ONE bounded environment-proceed re-run first',
  )
  assert.doesNotMatch(
    b,
    /same handling as a provision[\s*`]{0,6}env-blocked/i,
    'the environment arm still equates gate-time handling with a provision env-blocked — the ' +
      'provision route stays zero-round, the gate-time route spends one environment-proceed retry',
  )
  // Presence: the bounded mechanics, both gate sites, and the green-required asymmetry.
  assert.match(b, /environment-proceed/i, 'the environment arm must name the environment-proceed re-run')
  assert.match(
    b,
    /fully green/i,
    'the environment arm must state the re-run gate has to come back fully green (never a ' +
      'proceed-over — the asymmetry with baseline-proceed)',
  )
  // Non-vacuous companion, PAIRED: for each gate site the FIRST `held:*` token following it must be
  // that site's own exhaustion route — presence-anywhere anchors could not discriminate a swapped
  // routing (#1040). Site presence is subsumed: a missing site token fails the assert.ok loudly.
  for (const [site, route] of [
    ['merge site', 'held:escalation'],
    ['land site', 'held:land-failed'],
  ]) {
    const pair = b.match(new RegExp(`${site}[^]*?(held:[a-z-]+)`, 'i'))
    assert.ok(
      pair,
      `the environment arm must name the ${site} and route its exhaustion to an explicit held:* ` +
        `outcome — the ${site} token is gone, or no held:* token follows it`,
    )
    assert.equal(
      pair[1].toLowerCase(),
      route,
      `${site} exhaustion must route ${route}, but the first held:* token after "${site}" is ` +
        `"${pair[1]}" — the two exhaustion routes read swapped (#1040)`,
    )
  }
})

// ---- Task 1.3 locks (a)/(b)/(c) — plan 2026-07-24-runbook-and-standing-record-coherence ----

// (D19) The CONTEXT.md `**Adjudication**:` glossary term must keep the provenance-discipline clause
// on its `_Avoid_` line — the doctrine that a row comes only from the named producers (two at this row's authoring; three since the #1550 ask-ruling widening — D19a below guards the count) and is
// never sourced from surrounding prose (#1087). Recorded regression: the 2026-07-22
// audit-adjudication-threading spec justified overwriting that clause by citing a duplicate home at
// `skills/red-team/references/lenses.md` which never carried it, so the plan-faithful rewrite left
// the doctrine with ZERO operative anchors repo-wide
// ([[spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong]]; that spec now carries a dated
// correction note at the citing non-goal). This row is the committed guard against a second orphaning.
//
// Extraction is BY CONSTRUCT — the bolded term to the next bolded glossary term — never a
// whole-file scan: the same doctrine has a second standing home in SKILL.md step 5, and a
// repo-wide key could not tell the two anchors apart (deleting this one would still pass).
// The key spells its inner spaces `\s+` on purpose, D18's first absence key being the in-file
// precedent: CONTEXT.md wraps near 100 columns, so the restored `_Avoid_` line may legitimately wrap
// mid-phrase, and per the two-line-pairing lesson the `\s+` form strictly widens the match across a
// wrap. It also keeps the contiguous literal out of this file, which the plan's wrap-tolerant
// repo-wide doctrine census expects to return zero hits here — a guard must never trip the floor it backs.
test('D19 — CONTEXT.md **Adjudication** term keeps its provenance-discipline doctrine clause (#1087)', () => {
  const block = contextMd.match(/^\*\*Adjudication\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:)/m)
  assert.ok(
    block,
    'could not locate the `**Adjudication**:` glossary term in CONTEXT.md (bolded term → next ' +
      'bolded glossary term) — the extraction construct rotted',
  )
  assert.match(
    block[0],
    /never\s+mined\s+from\s+arbitrary\s+prose/i,
    "the CONTEXT.md **Adjudication** term's `_Avoid_` line must keep the provenance-discipline " +
      'doctrine clause — it is the doctrine\'s original and standing anchor (#1087); correct this ' +
      'row to a sanctioned rewording, never drop the clause to make a reword pass',
  )
})

// (D19a) The Adjudication producer enumeration widened two → three (#1550; ADR 0013 amendment
// 2026-08-25, ask-disposition Task 2.3) — the CONTEXT.md **Adjudication** entry carries BOTH edit
// sites: the definition-body producer enumeration (which now names the Checkpoint's ask rulings as
// the third producer, minted at the strike-list gate) and the `_Avoid_` count line D19 guards
// (now "the three named producers"). OLD-absent per PIN-8's law: the retired literal "two named
// producers" was verified present at this task's base — its base carrier is CONTEXT.md's own
// `_Avoid_` count line ("rows come only from the two named producers"), the byte-run this widening
// rewrote in place. It is NOT quoted by D19's block comment above: that comment was rewritten in
// the companion commit that completed the same task (the widening landed in fbadb88, the D19
// comment rewrite in the immediately-following 13a83a4) and now reads "two at this row's
// authoring; three since the #1550 ask-ruling widening", so citing it as the carrier would name
// a byte-run the D19 comment rewrite removed. Never a count word on a never-present value. Same extraction
// construct as D19.
test('D19a — CONTEXT.md **Adjudication** producer enumeration is widened two → three, old count literal retired (#1550)', () => {
  const block = contextMd.match(/^\*\*Adjudication\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:)/m)
  assert.ok(
    block,
    'could not locate the `**Adjudication**:` glossary term in CONTEXT.md (bolded term → next ' +
      'bolded glossary term) — the extraction construct rotted',
  )
  const b = norm(block[0])
  for (const [re, what] of [
    [/Checkpoint['’]s\s+ask\s+rulings/i, "the third producer (the Checkpoint's ask rulings) in the definition body"],
    [/strike-list\s+gate/i, 'the strike-list gate as the minting site'],
    [/three\s+named\s+producers/i, 'the widened `_Avoid_` count line ("the three named producers")'],
  ]) {
    assert.match(
      b,
      re,
      `the CONTEXT.md **Adjudication** entry must carry ${what} (#1550). Correct this row to a ` +
        'sanctioned rewording, never drop the widening to make a reword pass',
    )
  }
  assert.ok(
    !/two\s+named\s+producers/i.test(b),
    'the retired "two named producers" count literal must be gone from the **Adjudication** entry ' +
      '(OLD-absent — the literal was present at the ask-disposition task base; #1550)',
  )
})

// (D20) `skills/war/references/schemas.md`'s ledger.json contract block must declare the top-level
// `adjudications` key (#1016). SKILL.md step 5 ("record each row in the run ledger") and this same
// file's args-contract paragraph both cite that key as the record a recovery relaunch re-threads
// `args.adjudications` from — a ledger block that never declares it leaves both citations dangling,
// which is the #1016 gap itself. Heading located by PREFIX (the live line continues
// ``at `.claude/teams/<run-id>/```), region terminated at the block's closing fence — an exact-line
// heading match finds nothing, and a whole-file key would pass on the args-contract paragraph alone.
test('D20 — schemas.md ledger.json block declares the top-level adjudications key (#1016)', () => {
  const block = schemasMd.match(/^## ledger\.json — run state[^\n]*\n```jsonc\n([\s\S]*?)\n```/m)
  assert.ok(
    block,
    'could not locate the `## ledger.json — run state` jsonc block in references/schemas.md ' +
      '(heading prefix → closing fence) — the extraction construct rotted',
  )
  assert.match(
    block[1],
    /adjudications/,
    'the ledger.json contract block must declare the top-level `adjudications` key — SKILL.md ' +
      "step 5 and this file's args contract both cite it as the re-thread source (#1016)",
  )
})

// (D21) references/resume-and-recovery.md's `held:land-failed` Outcome-handling bullet must carry BOTH arms by which a
// gate-time `environment` failure reaches the hold (#1039). The retired sentence was unconditional —
// the retry was declared spent for every such entry — which is false on the baseline-proceed arm,
// where a `baseline-proceed` re-land's `environment`-classified failure routes straight to the hold
// with NO `environment-proceed` retry ever dispatched (the two `*-proceed` flavors never chain), so
// the operator's first manual re-run genuinely is the first fresh attempt.
//
// This is a PRESENCE key on the two-path shape and deliberately NOT an `/already\s+spent/i` absence
// key: the sanctioned replacement keeps that token inside the CONDITIONAL primary-land arm, so an
// absence key would red the correct text and green the unconditional one only by accident. The
// defect is the unconditional framing, not the token.
//
// Extraction copies the live construct at `land-decision.test.mjs` (same bullet, same file): locate
// the REAL 2-space-indented ``- **`held:land-failed``` header — a TOKEN-ONLY prefix, trailing bullet
// text variable; the compact ``- **`held:land-failed`**`` wrap is *schemas.md*'s header form and has
// zero occurrences in the bullet's home file — and terminate at the next SAME-INDENT 2-space `- **` sibling, never
// a top-level `- **` one (that truncates at the nested `    - **(a)` sub-bullet, or, read the other
// way, over-extends past the whole `- **Escalation-completion land …**` sibling and would let arm
// vocabulary from unrelated prose green the lock). Arm markers are markup-tolerant (D18's idiom), so
// a bold/backtick reshuffle inside an arm name does not false-red.
test('D21 — held:land-failed bullet names both environment arms, never one unconditional retry-spent claim (#1039)', () => {
  // Relocated read: the held:land-failed bullet moved verbatim into
  // references/resume-and-recovery.md (prompt-surface simplification).
  const lines = resumeMd.split('\n')
  const headerIdx = lines.findIndex((l) => /^ {2}- \*\*`held:land-failed`/.test(l))
  assert.ok(
    headerIdx >= 0,
    'could not locate the 2-space ``- **`held:land-failed``` bullet header in ' +
      'references/resume-and-recovery.md — anchor rotted (non-vacuous guard)',
  )
  let endIdx = lines.length
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (/^ {2}- \*\*/.test(lines[i])) { endIdx = i; break }  // next SAME-INDENT sibling, not a nested `    - **`
  }
  const region = lines.slice(headerIdx, endIdx).join('\n')
  // Non-vacuous: the region must reach root cause (c) — proves the extraction did not truncate early
  // at a nested sub-bullet (the exact failure the same-indent terminator avoids).
  assert.match(
    region,
    /dead land agent/i,
    'the extracted held:land-failed region must span through root cause (c) "dead land agent" — ' +
      'extraction truncated too early',
  )
  for (const [re, arm, why] of [
    [/primary-land[\s*`]{0,6}arm/i, 'primary-land', 'the land gate failure was itself classified `environment`, a bounded environment-proceed re-land was dispatched, and it came back `environment` a second time — the retry IS spent there'],
    [/baseline-proceed[\s*`]{0,6}arm/i, 'baseline-proceed', 'a `baseline-proceed` re-land failed `environment`-classified with no environment-proceed retry ever dispatched — the manual re-run is the first fresh attempt'],
  ]) {
    assert.match(
      region,
      re,
      `the held:land-failed bullet must name the ${arm} arm (${why}) — a single unconditional ` +
        'retry-spent sentence is false on one of the two paths (#1039)',
    )
  }
})

// (D22) SKILL.md's Gate-2 post-servitor publication flow must carry the PRE-PUSH STAGED-FILE
// CHECK — the fail-closed `git fetch origin` boundary refresh, the unpushed-RANGE probe, the
// refusal, the neutralized-pair exemption, the undo that removes a condemned tip commit from
// the working branch, AND the revert routing for a condemned commit that is not the tip — between
// the `docs(learnings): phase N` commit step and the `provision-worktrees.sh ensure-origin` push
// invocation (#1083, #1136, #1192, #1288, #1287). Recorded incident: a Gate-2 promotion commit authored in a publication worktree whose
// tracked version-slot files were stale swept them into the docs commit and silently reverted a
// landed release — the lock-step version guard stayed green throughout, because lock-step is not
// monotonic ([[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]). The staged
// file *list* is the root-cause probe: the mechanism is a bulk stage of stale tracked files, so it
// catches every stale-staged path (a stale skill or hook alike), not just the four version slots.
//
// The range arm (#1192): the probe formerly inspected the tip commit alone, so a poisoned commit
// sitting one below the tip reached origin unexamined — on exactly the re-entry shapes the flow's
// own revert prose contemplates. The live probe enumerates every unpushed commit with its file set,
// and condemnation is range-scoped. This arm is keyed on TWO fragments — the adjacent
// `git log --name-only` form AND a later `..HEAD` range token — deliberately NOT on the upstream
// revision literal: the flow pins ONE deterministic no-upstream fallback spelled with a different
// left-hand side, and both commands must satisfy the same key without alternation. The RANGE-TOKEN
// fragment has its own negative reference below — (c), which carries the command form and no range
// token at all — so it is not a load-bearing fragment with zero test signal (the recorded
// [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]] class:
// a fragment with no both-ways proof is a blind spot, not a lock).
// The two both-ways gaps this comment once recorded as RESIDUAL are closed at this shape (#1287):
// reference (d) below (range token present / command form absent) proves the COMMAND-FORM
// fragment, and reference (e) (revert routing absent, range probe and undo arm present) proves
// the `git revert` routing arm — each asserted red through the live key, so neither fragment is
// droppable with zero test signal any longer.
//
// The undo arm (#1136): detect-and-refuse alone left the condemned docs commit sitting on the
// working branch inside the publication worktree — the remedy re-provisioned but never removed it,
// leaving a release-reverting commit one `ensure-origin` from origin. The arm is pinned on
// `reset --hard HEAD~1`, deliberately NOT on bare `reset --hard`: the remedy's own carve-out
// sentence names the no-`reset --hard` shared-branch doctrine inside this same region, so a bare
// key would be greened by the doctrine mention alone and negative reference (b) below would stop
// discriminating. The revert-routing arm is keyed on the `git revert` adjacent form for the same
// reason — a bare `revert` key is unusable because the incident sentence above already reads
// "silently reverted a landed release".
//
// The fetch arm (#1288): the probe's left boundary (`@{upstream}` / `origin/<working>`) is a
// remote-tracking ref, only as fresh as the last fetch — an unrefreshed boundary condemns (and
// reverts) commits origin already has, so the flow orders a fail-closed `git fetch origin
// <working>` refresh immediately before the probe. The arm is keyed on the `git fetch origin`
// ADJACENT form (markup-tolerant), deliberately NOT bare `fetch`: the freshness sentence-pair's
// own explanatory words ("only as fresh as the last fetch", "non-zero fetch exit") would green a
// bare key with the command stripped — negative reference (g) below is exactly that shape
// (command dropped, prose retained in position), the analogue of (b)'s bare `reset --hard`
// doctrine mention.
//
// The exemption arm (#1287): the neutralized-pair exemption (a condemned commit reverted by a
// later commit in the same range, linked by git's own `This reverts commit <sha>.` body token)
// landed with zero key coverage — deleting it left this row green. Keyed on the mid-sentence
// `This reverts commit` adjacent form (markup-tolerant), ordered between the do-not-push refusal
// and the `reset --hard HEAD~1` carve-out, mirroring live prose order. Reference (h) below
// (exemption absent) is the arm's both-ways proof.
//
// The terminal arm (#1287): re-anchored on the push INVOCATION shape — `provision-worktrees.sh`
// adjacent to `ensure-origin` — never the bare token. The same diff that added the exemption
// prose added two in-region `ensure-origin` prose mentions ahead of the push step, and the bare
// token key's ordered match ended inside the termination sentence's decoy mention — the push
// invocation sat OUTSIDE the match (reproduced mechanically; the label-to-guard-region class).
// The two prose mentions are sanctioned in-region survivors the invocation anchor is designed to
// skip. Reference (f) below (invocation dropped, bare prose mention retained) is the arm's own
// both-ways proof.
//
// The key is ONE ORDERED match, never independent presence checks — arm order mirrors live prose
// order: commit step → fetch refresh (`git fetch origin`) → range probe (`git log --name-only`)
// → range token (`..HEAD`) → do-not-push clause → exemption (`This reverts commit`) → undo
// (`reset --hard HEAD~1`) → revert routing (`git revert`) → push invocation
// (`provision-worktrees.sh` adjacent to `ensure-origin`). That single regex locks the pairing
// (refresh + probe + refusal + exemption + both undo routes) AND the position (after the commit,
// before the push) at once — dropping any arm, or relocating one outside that span, fails it RED.
// Every arm anchors INSIDE the bounded extracted region — none relies on first-token-after
// scanning (the label-to-guard-region class).
//
// Extraction is BY CONSTRUCT — the `**Post-servitor publication (Gate 2` marker to the next `##`
// heading — never a whole-file scan. `ensure-origin` token census (a dated snapshot, re-measured
// 2026-08-18 at this task's rebased base; mechanized as the default-deny D33 census row below, so
// this sentence can never silently re-rot): `skills/war/SKILL.md` carries FOUR tokens — one in
// Setup step 2 (outside the region) plus three in-region: the push invocation the terminal arm
// anchors on, and the two sanctioned prose-survivor mentions ahead of it (the fallback sentence's
// "fork point against the `ensure-origin` push target" and the termination sentence's "proceeds
// to the `ensure-origin` push below") that the invocation anchor is designed to skip.
// `references/resume-and-recovery.md` carries TWO tokens (both in its Checkpoint
// absent-origin-baseline arm); `references/setup.md` carries ZERO — its crash-heal detail carries
// `remove-publication-worktree` only. A whole-file key could therefore be greened by prose
// outside the flow this row polices. Markup-tolerant on the emphasis
// spans (D18/D21's idiom): a bold/backtick reshuffle inside a clause must not false-red.
//
// The do-not-push refusal and the leading `docs(learnings): phase N` anchor (#1521/#1689): both
// were load-bearing fragments with zero test signal — every reference (a)-(h) carried them, so
// deleting either from the key left this row green. References (i) and (j) below close that gap.
// (i) keeps the whole flow live-shaped and swaps only the refusal clause for a report-and-continue
// sentence — a probe that finds a condemned path and pushes anyway is the exact defect the clause
// states — so deleting the refusal fragment greens (i) and reds the row.
// (j) paraphrases the commit step's subject away, keeping every later arm live-shaped, so the
// leading anchor is its only gap — delete that fragment from the key and (j) matches, reding the
// row. A reference differing at TWO points cannot prove the anchor: the key would reject it at the
// second gap and the drill would read green. Verified by scratch deletion at this task's base.
//
// ONE ordered key, shared by the live row and its TEN negative references — all eleven must never
// drift apart.
const D22_ORDERED_SPAN =
  /docs\(learnings\): phase N[\s\S]*?git[\s*`]{0,4}fetch\s+origin[\s\S]*?git[\s*`]{0,4}log\s+--name-only[\s\S]*?\.\.HEAD[\s\S]*?do\s+\*{0,2}not\*{0,2}\s+push[\s\S]*?This\s+reverts\s+commit[\s\S]*?reset[\s*`]{0,4}--hard[\s*`]{0,4}HEAD~1[\s\S]*?git[\s*`]{0,4}revert[\s\S]*?provision-worktrees\.sh[\s*`]{0,4}ensure-origin/
// Unwired negative references (both-ways proof, zero fixture files — the structural-test
// blind-spot idiom). Each is a hand-written region shape differing from the live one at exactly
// ONE point, and each is run through the SAME live key and asserted red.
//
// (a) The retired pre-#1192 shape: tip-only probe, undo and revert prose intact — now carrying
// the fetch step and the exemption sentence, so the range arm stays its ONLY designated gap. Red
// at the range arm — it carries neither of that arm's two fragments.
const D22_REGION_HEAD_ONLY_PROBE =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, list the docs commit staged file ' +
  'set — `git show --name-only --format= HEAD` — and confirm every path is under the promotion ' +
  'destination or is `CLAUDE.md`: **ANY** other path means stale tracked files were staged — do ' +
  '**not** push. **Neutralized-pair exemption:** a commit is *not* condemned when a later commit ' +
  "in the same range reverts it — linked by git's own `This reverts commit <sha>.` body token. " +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. On any re-entry ' +
  'shape where `git log` shows the condemned docs commit is not the tip, never rewind — ' +
  '`git revert` that commit instead; a conflicted revert is `git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (b) The pre-#1136 shape carried forward onto the NEW probe and revert routing: undo clause
// absent, a bare `reset --hard` doctrine mention present so the proof also covers the pinning
// decision above (a bare key would green THIS string — which holds ONLY while the mention sits
// AFTER the exemption anchor and BEFORE the `git revert` route: the key's undo arm scans the
// text between `This reverts commit` and `git revert`, so an arm inserted after the mention
// strands it outside that scan and silently kills the pinning proof; re-run the weakened-key
// drill after ANY arm insert) — now carrying the fetch step and the exemption sentence, so the
// undo arm stays its ONLY designated gap. Red at the undo arm.
const D22_REGION_WITHOUT_UNDO =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. ' +
  '**Neutralized-pair exemption:** a commit is *not* condemned when a later commit in the same ' +
  "range reverts it — linked by git's own `This reverts commit <sha>.` body token. " +
  'The refiner never runs `reset --hard` on a shared branch. ' +
  '`git revert` each condemned commit, then re-probe. Run `remove-publication-worktree`, ' +
  're-provision, and re-commit. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (c) The tip-only REGRESSION shape: the range arm's first fragment present, its range token gone,
// everything else live — now carrying the fetch step and the exemption sentence, so the range
// token stays its ONLY designated gap. Without this reference that second fragment would be
// load-bearing in the key yet droppable with zero test signal — (a) alone cannot prove it,
// because (a) is missing both.
const D22_REGION_WITHOUT_RANGE =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, list the tip commit file set — ' +
  "`git log --name-only --format='commit %H' -1 HEAD` — and confirm every path is under the " +
  'promotion destination: **ANY** other path means stale tracked files were staged — do **not** ' +
  'push. **Neutralized-pair exemption:** a commit is *not* condemned when a later commit in the ' +
  "same range reverts it — linked by git's own `This reverts commit <sha>.` body token. " +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (d) The COMMAND-FORM gap (closes the first recorded residual): the range token present, the
// `git log --name-only` probe form absent — the file sets read per commit through a different
// command. Red at the range arm's command-form fragment; without this reference that fragment
// would be droppable with zero test signal ((a) is missing both range fragments).
const D22_REGION_WITHOUT_COMMAND_FORM =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  "Before pushing, walk every unpushed commit in `'@{upstream}'..HEAD`, reading each commit's " +
  'file set with `git show --name-only --format= <sha>`, and confirm every path is under the ' +
  'promotion destination: **ANY** other path means stale tracked files were staged — do **not** ' +
  'push. **Neutralized-pair exemption:** a commit is *not* condemned when a later commit in the ' +
  "same range reverts it — linked by git's own `This reverts commit <sha>.` body token. " +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (e) The REVERT-ROUTING gap (closes the second recorded residual): range probe and undo arm
// present and live-shaped, the `git revert` route for a non-tip condemned commit gone (the
// exemption sentence's "git's own `This reverts" cannot satisfy the arm — the apostrophe breaks
// the adjacency). Red at the revert arm.
const D22_REGION_WITHOUT_REVERT_ROUTING =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. **Neutralized-pair exemption:** a commit is *not* condemned ' +
  "when a later commit in the same range reverts it — linked by git's own `This reverts commit " +
  '<sha>.` body token. ' +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, escalate — leave the worktree in place for inspection. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (f) The TERMINAL-ARM gap (the arm's own both-ways proof — /red-team round 1): the
// `provision-worktrees.sh ensure-origin` push invocation dropped while a bare in-region
// `ensure-origin` prose mention (the termination sentence's decoy) stays. The retired bare-token
// terminal would GREEN this string — the invocation anchor is what reds it. Red at the terminal
// arm.
const D22_REGION_WITHOUT_PUSH_INVOCATION =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. **Neutralized-pair exemption:** a commit is *not* condemned ' +
  "when a later commit in the same range reverts it — linked by git's own `This reverts commit " +
  '<sha>.` body token. ' +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a clean re-probe proceeds to ' +
  'the `ensure-origin` push below. ' +
  '- Push (push-first CAS, never force).'
// (g) The FETCH gap (the G13 adjacency proof): the `git fetch origin` command dropped while the
// freshness sentence's own bare-fetch explanatory prose stays in position — a bare `fetch` key
// would GREEN this string; the `git fetch origin` adjacent form is what reds it (the analogue of
// (b)'s bare `reset --hard` doctrine mention). Red at the fetch arm.
const D22_REGION_WITHOUT_FETCH =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** Remote-tracking refs are only as fresh as the ' +
  'last fetch, and an unrefreshed left boundary would condemn commits origin already has; on a ' +
  'non-zero fetch exit: do not probe — escalate. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. **Neutralized-pair exemption:** a commit is *not* condemned ' +
  "when a later commit in the same range reverts it — linked by git's own `This reverts commit " +
  '<sha>.` body token. ' +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (h) The EXEMPTION gap: the neutralized-pair exemption sentence gone, everything else
// live-shaped. Red at the exemption arm.
const D22_REGION_WITHOUT_EXEMPTION =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. ' +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (i) The DO-NOT-PUSH gap (#1521/#1689): the probe still enumerates the range and still names the
// condemned paths, but the refusal clause is replaced by report-and-continue — the shape where a
// condemned commit is reported and pushed anyway. Everything else is live-shaped, so the refusal
// is the ONLY designated gap. Red at the refusal arm; without this reference the
// `do **not** push` fragment carried zero test signal.
const D22_REGION_WITHOUT_REFUSAL =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — report the condemned paths in the phase report and continue. ' +
  '**Neutralized-pair exemption:** a commit is *not* condemned when a later commit in the same ' +
  "range reverts it — linked by git's own `This reverts commit <sha>.` body token. " +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
// (j) The LEADING-ANCHOR gap (#1521/#1689): the commit step paraphrases its subject instead of
// spelling the `docs(learnings): phase N` message, everything after it live-shaped — the anchor is
// the ONLY designated gap. Red at the span's left boundary. This is what proves the anchor
// POSITIONS the ordered match after the commit step rather than merely decorating it: delete the
// fragment from the key and every remaining arm matches this string, so the row reds.
const D22_REGION_WITHOUT_COMMIT_ANCHOR =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit the phase learnings in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** **Refresh first:** `git fetch origin <working>` — ' +
  'remote-tracking refs are only as fresh as the last fetch; a non-zero fetch exit escalates. ' +
  'Before pushing, enumerate every unpushed commit ' +
  "and its file set — `git log --name-only --format='commit %H' '@{upstream}'..HEAD` — and confirm " +
  'every path is under the promotion destination: **ANY** other path means stale tracked files ' +
  'were staged — do **not** push. **Neutralized-pair exemption:** a commit is *not* condemned ' +
  "when a later commit in the same range reverts it — linked by git's own `This reverts commit " +
  '<sha>.` body token. ' +
  '**Undo the condemned commit first**: `git reset --hard HEAD~1`. When the condemned commit ' +
  'is not the tip, never rewind — `git revert` that commit instead; a conflicted revert is ' +
  '`git revert --abort` + escalate. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
test('D22 — SKILL.md Gate-2 flow orders the fail-closed fetch refresh, the unpushed-range probe, its do-not-push clause, the neutralized-pair exemption, the tip-undo carve-out and the revert routing between commit and push invocation (#1083, #1136, #1192, #1288, #1287)', () => {
  const region = skillMd.match(/\*\*Post-servitor publication \(Gate 2[\s\S]*?(?=\n## )/)
  assert.ok(
    region,
    'could not locate the `**Post-servitor publication (Gate 2` flow in SKILL.md (marker → next ' +
      '`##` heading) — the extraction construct rotted',
  )
  // Non-vacuous: the region must span through the push step, so a truncated extraction reds here
  // (a distinguishable failure) instead of masquerading as a missing duty below.
  assert.match(
    region[0],
    /provision-worktrees\.sh[\s*`]{0,4}ensure-origin/,
    'the extracted Gate-2 region must span through the `provision-worktrees.sh ensure-origin` ' +
      'push invocation — extraction truncated too early',
  )
  assert.match(
    region[0],
    D22_ORDERED_SPAN,
    'the Gate-2 flow must carry the pre-push staged-file check as ONE ordered span — the docs ' +
      'commit step, then the fail-closed `git fetch origin` boundary refresh, then the ' +
      'unpushed-RANGE probe (the whole range, never the tip alone), then its do-not-push ' +
      'refusal, then the neutralized-pair exemption, then the undo carve-out for a condemned ' +
      'tip commit, then the revert routing for a condemned commit that is not the tip, then the ' +
      '`provision-worktrees.sh ensure-origin` push invocation (#1083, #1136, #1192, #1288, ' +
      '#1287). Every arm is load-bearing: the probe without the refresh condemns commits origin ' +
      'already has, the probe without the refusal is advice, the refusal without the probe has ' +
      'no trigger, refusal without the undo strands the poisoned commit on the working branch ' +
      'one push from origin, a tip-only probe never sees a poisoned commit below the tip at ' +
      'all, and without the exemption a neutralized pair re-enters the undo routing forever. ' +
      'The arm list and the pinning rationale for each are in the block comment above this row ' +
      '— correct the row to a sanctioned rewording, never drop an arm to make it pass',
  )
  // Both-ways proof: the same key must REJECT all eight near-miss shapes. Without these, a key
  // that silently stopped discriminating on any one arm would still read green above.
  for (const [label, negative, why] of [
    [
      '(a) retired tip-only probe',
      D22_REGION_HEAD_ONLY_PROBE,
      'the range arm no longer discriminates — a region probing only the tip commit satisfies it',
    ],
    [
      '(b) undo clause absent',
      D22_REGION_WITHOUT_UNDO,
      'the undo arm no longer discriminates — a bare shared-branch doctrine mention satisfies it',
    ],
    [
      '(c) range token absent',
      D22_REGION_WITHOUT_RANGE,
      "the range arm's second fragment no longer discriminates — a probe naming the right command " +
        'but scoped to the tip satisfies it',
    ],
    [
      '(d) command form absent',
      D22_REGION_WITHOUT_COMMAND_FORM,
      "the range arm's command-form fragment no longer discriminates — a region carrying the " +
        'range token without the `git log --name-only` probe satisfies it',
    ],
    [
      '(e) revert routing absent',
      D22_REGION_WITHOUT_REVERT_ROUTING,
      'the revert-routing arm no longer discriminates — a region with no `git revert` route for ' +
        'a non-tip condemned commit satisfies it',
    ],
    [
      '(f) push invocation absent',
      D22_REGION_WITHOUT_PUSH_INVOCATION,
      'the terminal arm no longer discriminates — a bare in-region `ensure-origin` prose mention ' +
        'satisfies it without any push invocation',
    ],
    [
      '(g) fetch command absent',
      D22_REGION_WITHOUT_FETCH,
      "the fetch arm no longer discriminates — the freshness sentence's own explanatory prose " +
        'satisfies it with the `git fetch origin` command stripped',
    ],
    [
      '(h) exemption absent',
      D22_REGION_WITHOUT_EXEMPTION,
      'the exemption arm no longer discriminates — a region that drops the neutralized-pair ' +
        'exemption satisfies it',
    ],
    [
      '(i) refusal replaced by report-and-continue',
      D22_REGION_WITHOUT_REFUSAL,
      'the do-not-push arm no longer discriminates — a region that reports condemned paths and ' +
        'pushes anyway satisfies it',
    ],
    [
      '(j) commit-message anchor paraphrased',
      D22_REGION_WITHOUT_COMMIT_ANCHOR,
      'the leading `docs(learnings): phase N` anchor no longer positions the span — a region ' +
        'whose commit step never names the docs commit satisfies it',
    ],
  ]) {
    assert.doesNotMatch(
      negative,
      D22_ORDERED_SPAN,
      `the D22 ordered key matched negative reference ${label}: ${why}. Tighten the key, never ` +
        'relax a negative reference to make this pass',
    )
  }
})

// (D33) The D22 extraction rationale's `ensure-origin` token census, MECHANIZED (#1287, #1288).
// That census was comment prose held by nothing, and it rotted silently twice — its in-region
// accounting predated the two prose-survivor mentions entirely, and its reference-file sentence
// undercounted references/resume-and-recovery.md (TWO tokens, not one). Default-deny in BOTH
// directions (the D30 census shape, the recorded
// [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
// class): a dropped token reds (the push invocation or a Checkpoint recipe lost its occurrence),
// and a NEW token reds — designed friction: legitimate growth must update this map AND the D22
// census comment in the SAME diff (the Gate-2 freshness insert was itself authored under a
// no-new-`ensure-origin` constraint so these counts held). Population: skills/war/SKILL.md plus
// every file DIRECTLY under skills/war/references/ — the walk is a FLAT `readdirSync`, not
// recursive, so a file inside a subdirectory would be invisible to it. That hole is closed by
// assertion rather than by recursion: the walk also asserts the directory holds NO subdirectory
// (true at this row's base — the directory is flat), so a new nested carrier surface cannot appear
// silently either. Add a recursive walk, and rewrite this sentence with it, if a subdirectory is
// ever wanted. Counts are occurrence counts (a dated snapshot, measured 2026-08-18), never line
// counts.
test('D33 — `ensure-origin` token census: SKILL.md and every references/ file carry exactly the recorded occurrence counts (#1287, #1288)', () => {
  const count = (src) => src.split('ensure-origin').length - 1

  // SKILL.md: one Setup-step-2 token outside the Gate-2 region, plus three in-region — the two
  // sanctioned prose-survivor mentions and the push invocation the D22 terminal arm anchors on.
  assert.equal(
    count(skillMd),
    4,
    'SKILL.md `ensure-origin` census drifted (expected 4: Setup step 2, the two in-region prose ' +
      'survivors, the push invocation). A dropped token means a guarded construct lost its ' +
      'occurrence — restore it; a new token must update this census and the D22 census comment ' +
      'in the SAME diff, never relax the count',
  )
  const region = skillMd.match(/\*\*Post-servitor publication \(Gate 2[\s\S]*?(?=\n## )/)
  assert.ok(region, 'could not locate the `**Post-servitor publication (Gate 2` flow in SKILL.md')
  assert.equal(
    count(region[0]),
    3,
    'the Gate-2 region `ensure-origin` census drifted (expected 3: the two sanctioned prose ' +
      'survivors + the push invocation). The D22 terminal arm is designed against exactly this ' +
      'population — re-verify the invocation anchoring before touching either count',
  )

  // Every references/ file, default-deny: only resume-and-recovery.md carries the token (twice,
  // both in its Checkpoint absent-origin-baseline arm); everything else — setup.md included — is
  // ZERO.
  const refDir = join(HERE, '..', 'references')
  const expectedRefCounts = { 'resume-and-recovery.md': 2 }
  const entries = readdirSync(refDir, { withFileTypes: true })
  const seen = entries.filter((e) => e.isFile())
  assert.ok(seen.length > 0, 'non-vacuity: the references/ walk discovered no files at all')
  // The flat walk's claim, made true by assertion (#1525): a subdirectory would hide carrier files
  // from the census below. Adding one is a lock-step change — make the walk recursive and rewrite
  // the census comment in the SAME diff, never delete this assert to land the directory.
  assert.deepEqual(
    entries.filter((e) => !e.isFile()).map((e) => e.name),
    [],
    'skills/war/references/ gained a subdirectory, which the FLAT readdirSync census below cannot ' +
      'see — make the walk recursive and update the D22/D33 census comments in the SAME diff',
  )
  for (const name of ['resume-and-recovery.md', 'setup.md']) {
    assert.ok(
      seen.some((e) => e.name === name),
      `non-vacuity: references/${name} is gone — the census names it and must move with a rename`,
    )
  }
  for (const entry of seen) {
    const expected = expectedRefCounts[entry.name] ?? 0
    assert.equal(
      count(readFileSync(join(refDir, entry.name), 'utf8')),
      expected,
      `references/${entry.name} \`ensure-origin\` census drifted (expected ${expected}). A new ` +
        'carrier surface must be added to this expected map and the D22 census comment in the ' +
        'SAME diff; a dropped occurrence means a recipe rotted — restore it, never relax the count',
    )
  }
  // The census comment's setup.md claim has a second half — its crash-heal detail carries
  // `remove-publication-worktree` — pinned here so the ZERO row above cannot be satisfied by the
  // file simply emptying out.
  assert.ok(
    setupRefMd.includes('remove-publication-worktree'),
    'references/setup.md must still carry `remove-publication-worktree` in its crash-heal detail ' +
      '— the D22 census comment records it as the file\'s publication-flow token',
  )
})

// ---- Task 2.1 doc-cascade gates (plan 2026-07-26-dispatch-args-and-floor-coverage) ----
//
// The ADR 0037 and CONTEXT.md amendments below are deliberately phrased OUT of the spec §4.4
// four-surface embedded-args token-pair grep — named descriptively and never quoted here, because a
// comment restating that sweep's own alternation becomes a hit for the sweep it describes and
// silently forks the count (#1241/#1163; the recorded
// [[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]] class — this banner WAS
// that hit, and D30 below is the mechanical census that replaces the hand-run grep). Nothing else in
// the suite reads them, so without these two rows the doc reword would ship with no mechanical check
// of any kind. They are PER-MEDIUM, not uniform: an ADR is append-only, so its superseded
// sentences legitimately stay byte-intact and only NEW-present can discriminate; CONTEXT.md is a
// living glossary edited in place, so it gets NEW-present AND OLD-absent. Every OLD-absent
// predicate is sentence-literal-scoped — never a bare `two` word test (decision 2's
// "two pure, independently-tested exports" sentence is still true and must not trip it).

// (D23) ADR 0037 decision 2 carries TWO `two`-scoped sentences — the substitution sentence ("replaces
// exactly once each of the two `export const meta` anchor literals") AND the exports sentence ("the
// stager also exports the two anchor literals as constants"). Task 2.1 falsifies BOTH: the stager
// gained an optional third exactly-once substitution and now exports three anchors. The correction
// channel is one inline dated amendment note covering both — NOT a retro-edit of the ratified
// sentences (append-only). NEW-present only, and proven sufficient: leave the ADR unamended and every
// row below REDs. Extraction is BY CONSTRUCT (decision 2 → decision 3), never a whole-file scan —
// decision 3 and the Consequences section discuss the same stager and would green a deleted note.
test('D23 — ADR 0037 decision 2 carries the dated amendment covering BOTH of its two-scoped sentences (#1134)', () => {
  const block = adr0037.match(/^2\. \*\*A dedicated stager[\s\S]*?(?=\n3\. \*\*)/m)
  assert.ok(
    block,
    'could not locate ADR 0037 decision 2 (`2. **A dedicated stager` → `3. **`) — the extraction ' +
      'construct rotted',
  )
  const b = norm(block[0])
  // Non-vacuous: the extraction really spans decision 2's own claims, not an empty slice.
  assert.match(b, /anchor-guard test/i, 'the extracted decision-2 block must span its anchor-guard sentence — extraction truncated')
  for (const [re, what] of [
    [/Amendment \(2026-07-27/, 'the inline dated amendment note itself'],
    [/--args/, 'the `--args <file>` flag that introduces the third substitution'],
    [/optional[\s*_`]{0,4}third[\s*_`]{0,4}exactly-once substitution/i,
      'the THIRD exactly-once substitution (the substitution sentence’s correction)'],
    [/three[\s*_`]{0,4}anchor literals/i,
      'the now-THREE exported anchor literals (the exports sentence’s correction — amending only ' +
      'the substitution sentence leaves the more directly-falsified one stale)'],
  ]) {
    assert.match(
      b,
      re,
      `ADR 0037 decision 2 must name ${what}. Correct this row to a sanctioned rewording of the ` +
        'amendment, never delete it to make a reword pass',
    )
  }
})

// (D24) CONTEXT.md's staged-phase-script glossary entry claimed the stager substitutes exactly the
// two `export const meta` anchor literals. A living glossary is edited IN PLACE, so this row is
// NEW-present AND OLD-absent — the bare unqualified two-only claim must be gone, keyed on the
// sentence literal (not the word `two`, which stays legitimately in the corrected sentence naming the
// two meta anchors). Extraction is BY CONSTRUCT — the bolded term to the next bolded glossary term OR
// the next `###` heading, D19's idiom — never a whole-file scan: ADR 0037's own prose and the
// `_Avoid_` line below discuss the same stager.
test('D24 — CONTEXT.md staged-phase-script entry names the optional third substitution, drops the two-only claim (#1134)', () => {
  const block = contextMd.match(/^\*\*Staged phase script\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:|\n### )/m)
  assert.ok(
    block,
    'could not locate the `**Staged phase script**:` glossary entry in CONTEXT.md (bolded term → ' +
      'next bolded term or `###` heading) — the extraction construct rotted',
  )
  const b = norm(block[0])
  // Non-vacuous: the extraction really spans the entry's substitution prose.
  assert.match(b, /fails loud/i, 'the extracted entry must span its fail-loud sentence — extraction truncated')
  assert.doesNotMatch(
    b,
    /substitutes the two `export const meta` anchor literals/i,
    'the CONTEXT.md staged-phase-script entry still makes the bare unqualified two-only ' +
      'substitution claim — the stager now makes an OPTIONAL THIRD exactly-once substitution under ' +
      '`--args <file>` (#1134)',
  )
  for (const [re, what] of [
    [/--args/, 'the `--args <file>` flag'],
    [/optional[\s*_`]{0,4}third/i, 'the optional THIRD exactly-once substitution'],
  ]) {
    assert.match(
      b,
      re,
      `the CONTEXT.md staged-phase-script entry must name ${what}. Correct this row to a sanctioned ` +
        'rewording, never drop the clause to make a reword pass',
    )
  }
})

// (D25) CROSS-ADR MIRROR — the no-chaining routing fact lives on TWO surfaces (#1115, ADR 0025).
// ADR 0040 §B is the canonical source: a `baseline-proceed` re-dispatch that then fails
// `environment` keeps the PRE-RETRY routing, and that routing is TWO-SITED — soft `env-blocked` at
// the merge site, `held:land-failed` at the land site. ADR 0019's Amendment restates it; before
// #1115 it named only the merge-site half ("keeps this ADR's original soft `env-blocked` routing"),
// silently dropping the land-site half its own next sentence already models. This row reads BOTH
// files so a revert on EITHER surface reds — the standing both-surfaces registry shape; neither ADR
// may drift alone.
//
// Extraction is BY CONSTRUCT per surface, never a whole-file scan — and the 0019 side is scoped to
// the NO-CHAINING clause alone, NOT the whole Amendment paragraph. That scoping is the row's whole
// discriminating power: the immediately following "Exhaustion routes by site" sentence already
// carries `merge site`, `land site` and `held:land-failed`, so a paragraph-wide presence check
// would read green against the reverted single-site clause (the recorded presence-anywhere blind
// spot, [[multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap]]). Keys are
// ORDERED and per-surface, anchored on the ADRs' own tokens rather than either ADR's sentence bytes,
// so sanctioned rewording latitude on either side does not false-red.
test('D25 — the no-chaining two-site routing fact is present on BOTH mirror surfaces, ADR 0019 Amendment and ADR 0040 §B (#1115)', () => {
  // 0019: the no-chaining clause — its own `(ADR 0040 §B)` cross-reference (the mirror pointer)
  // through to the start of the separate exhaustion sentence.
  const clause0019 = adr0019.match(/\(ADR 0040 §B\)[\s\S]*?(?=Exhaustion routes by site)/)
  assert.ok(
    clause0019,
    'could not locate ADR 0019\'s no-chaining clause (`(ADR 0040 §B)` → `Exhaustion routes by ' +
      'site`) — the extraction construct rotted',
  )
  // 0040: §B in full — heading to the next `###`.
  const sectionB = adr0040.match(/^### \(B\) No chaining between recovery dispatches[\s\S]*?(?=\n### )/m)
  assert.ok(
    sectionB,
    'could not locate ADR 0040 §B (`### (B) No chaining between recovery dispatches` → next ' +
      '`###`) — the extraction construct rotted',
  )
  for (const [surface, block, key, why] of [
    [
      'ADR 0040 §B (canonical source)',
      sectionB[0],
      /env-blocked[\s\S]{0,60}held:land-failed/,
      'the chained-failure routing as ONE pair — soft `env-blocked` (merge site) AND ' +
        '`held:land-failed` (land site). Naming one status alone is the exact half-truth #1115 ' +
        'corrected on the 0019 side',
    ],
    [
      'ADR 0019 Amendment (mirror site)',
      clause0019[0],
      /env-blocked[\s\S]{0,80}merge[\s*_`]{0,4}site[\s\S]{0,80}held:land-failed[\s\S]{0,80}land[\s*_`]{0,4}site/,
      'both statuses WITH their sites — soft `env-blocked` at the merge site, `held:land-failed` ' +
        'at the land site (#1115). The bare single-site form is what this row exists to catch',
    ],
  ]) {
    // Non-vacuous per surface: each extracted block must really span its own no-chaining sentence.
    assert.match(
      norm(block),
      /baseline-proceed/,
      `the extracted ${surface} block must span its \`baseline-proceed\` no-chaining sentence — ` +
        'extraction truncated too early',
    )
    assert.match(
      norm(block),
      key,
      `${surface} must carry ${why}. Both surfaces mirror one fact: correct this row to a ` +
        'sanctioned rewording, never drop a surface or a half to make it pass',
    )
  }
  // OLD-absent on the mirror site only (an ADR Amendment is edited in place; the superseded
  // original Decision text above it is append-only and deliberately untouched — D24's idiom).
  assert.doesNotMatch(
    norm(clause0019[0]),
    /keeps this ADR.s original soft/i,
    'ADR 0019\'s no-chaining clause still carries the single-site form ("keeps this ADR\'s ' +
      'original soft `env-blocked` routing") — it must name both sites, mirroring ADR 0040 §B (#1115)',
  )
})

// (D26) GLOSSARY ↔ ADR MIRROR — the three audit-evidence-precedence glossary terms in CONTEXT.md's
// `### Audit` section (**Claim shape**, **Evidence rung**, **Rule + record**) restate doctrine that
// ADR 0041 carries canonically: the `execution`-shape vs `execution-evidence`-lens disambiguation,
// the lessons floor rule (priors, never evidence), and the D3 conflict rule (`disposition: note`
// naming both rungs, plus the benign-forward-advance carve-out — so the `Rule + record` entry's
// `_Avoid_` doctrine is anchored too, not just its definition body). ADR 0025: a new mirror ships
// its drift guard in the same task — this row is that guard, landing in the commit that creates
// the mirror. Extraction is BY CONSTRUCT per term —
// bolded term → next bolded term or `###` heading, D19/D24's idiom — never a whole-file scan (the
// same doctrine clauses live on the auditor card and, as skeleton tokens, on the dispatched prompt;
// a repo-wide key could not tell the anchors apart). Keys are token-anchored `\s+`-wrapped `/…/i`
// forms, never sentence bytes — sanctioned rewording latitude on either surface must not false-red;
// a one-sided edit (glossary reworded away from the doctrine, or the ADR clause dropped) reds.
test('D26 — CONTEXT.md audit-evidence glossary terms mirror ADR 0041 doctrine clauses on both surfaces', () => {
  for (const [term, keys] of [
    [
      'Claim shape',
      [
        [
          /execution[`*_]{0,2}\s+shape\s+with\s+the\s+[`*_]{0,2}execution-evidence[`*_]{0,2}\s+lens/i,
          'the `execution`-shape vs `execution-evidence`-lens disambiguation clause',
        ],
      ],
    ],
    [
      'Evidence rung',
      [
        [/priors/i, 'the lessons-are-priors half of the lessons floor rule'],
        [/never\s+evidence/i, 'the never-evidence half of the lessons floor rule'],
      ],
    ],
    [
      'Rule + record',
      [
        [/disposition:?[\s`*_]{0,3}note/i, 'the D3 `disposition: note` recording channel'],
        [/naming\s+both\s+rungs/i, 'the D3 both-rungs-named recording clause'],
        [/benign\s+forward-advance/i, 'the benign-forward-advance carve-out'],
      ],
    ],
  ]) {
    // `Rule + record` carries a regex metacharacter — escape the term before building the pattern.
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = contextMd.match(
      new RegExp(`^\\*\\*${t}\\*\\*:[\\s\\S]*?(?=\\n\\*\\*[^\\n*]+\\*\\*:|\\n### )`, 'm'),
    )
    assert.ok(
      block,
      `could not locate the \`**${term}**:\` glossary term in CONTEXT.md (bolded term → next ` +
        'bolded term or `###` heading) — the extraction construct rotted',
    )
    // Non-vacuous: every entry must really reach its own `_Avoid_` line.
    assert.match(
      norm(block[0]),
      /_Avoid_/,
      `the extracted **${term}** entry must span its \`_Avoid_\` line — extraction truncated`,
    )
    for (const [key, what] of keys) {
      for (const [surface, text] of [
        [`CONTEXT.md **${term}** entry (mirror)`, norm(block[0])],
        ['ADR 0041 (canonical source)', norm(adr0041)],
      ]) {
        assert.match(
          text,
          key,
          `${surface} must carry ${what} (ADR 0025 mirror registry). Correct this row to a ` +
            'sanctioned rewording, never drop the clause on one surface to make it pass',
        )
      }
    }
  }
})

// (D27) SKILL.md's `**Lead evidence bindings` paragraph — the Lead's phase-close/Gate-2
// instantiation of the ADR 0041 evidence-precedence doctrine (plan 2026-07-28-audit-evidence-
// precedence, Task 1.3). The paragraph carries the spec §4.4 token skeleton (the four claim-shape
// names + the two floor tokens) plus THREE Lead bindings, each pinned by its own distinctive
// anchor pair — the skeleton alone cannot discriminate: delete any single binding and all six
// skeleton tokens survive, so a skeleton-only row would stay green on exactly the loss that
// matters (D19/D21/D22's per-claim-anchor idiom). Extraction is BY CONSTRUCT — the `**Lead
// evidence bindings` bold lead-in to the next bold lead-in paragraph or `##` heading, never a
// whole-file scan: the shape names and both floor tokens also live on the auditor card, in
// ADR 0041, and in CONTEXT.md's `### Audit` glossary, so a repo-wide key could not tell the
// anchors apart. Keys are token-anchored `\s+`-wrapped `/…/i` forms, never sentence bytes —
// sanctioned rewording latitude must not false-red.
test('D27 — SKILL.md Lead evidence bindings paragraph carries the §4.4 skeleton and all three bindings, each with its own anchor pair (ADR 0041)', () => {
  const region = skillMd.match(/\*\*Lead evidence bindings[\s\S]*?(?=\n\*\*|\n## )/)
  assert.ok(
    region,
    'could not locate the `**Lead evidence bindings` paragraph in SKILL.md (bold lead-in → next ' +
      'bold lead-in or `##` heading) — the extraction construct rotted',
  )
  const b = norm(region[0])
  // The mandated ADR pointer (skeleton + pointer only, never a restated ladder).
  assert.match(
    b,
    /ADR\s+0041/,
    'the Lead evidence bindings paragraph must point at ADR 0041 (the doctrine record) — the ' +
      'binding surface is skeleton + pointer, never a restated ladder',
  )
  // The spec §4.4 token skeleton: four shape names + the two floor-rule tokens.
  for (const key of [
    /content-at-pin/i,
    /\bexecution\b/i,
    /\bhistory\b/i,
    /\bauthority\b/i,
    /never\s+the\s+top\s+rung/i,
    /never\s+evidence/i,
  ]) {
    assert.match(
      b,
      key,
      `the Lead evidence bindings paragraph must carry the §4.4 skeleton token ${key} — correct ` +
        'this row to a sanctioned rewording, never drop a token to make it pass',
    )
  }
  // One distinctive anchor pair per binding — deleting any single binding reds its own pair.
  for (const [binding, keys] of [
    [
      '(1) close-out evidence in a dedicated worktree',
      [/dedicated\s+worktree/i, /never\s+the\s+main\s+checkout/i],
    ],
    ['(2) remote truth via ls-remote, ADR 0008 cited', [/ls-remote/i, /0008/]],
    ['(3) a threaded claim is rung 1 of authority', [/rung\s+1[\s\S]{0,40}authority/i, /unverified/i]],
  ]) {
    for (const key of keys) {
      assert.match(
        b,
        key,
        `the Lead evidence bindings paragraph must keep binding ${binding}'s anchor ${key} — ` +
          'each binding is pinned by its own pair, so losing one binding reds while the skeleton ' +
          'survives; correct this row to a sanctioned rewording, never drop a binding',
      )
    }
  }
})

// (D28) GLOSSARY → CANONICAL-HOME POINTER PAIRS — Task 6.2's two CONTEXT.md compressions (#1228)
// replaced operative procedure with a trigger pointer at each doctrine's single surviving operative
// home. The residual this guard closes: war-config.test.mjs pins the '### Recovery relaunch'
// heading + entry-point tokens at the destination, and a destination-file rename already reds
// loudly (this file readFileSync's both destinations at module scope, and war-config.test.mjs
// enumerates both paths in its UNION absence sweeps) — but nothing pins the CONTEXT.md trigger
// clauses/paths, the submodule sub-procedure's mergeCommit.oid + operator-supplied-SHA content,
// or the runbook's record-as-owned / args.recovery / reclaimStaleRemote / full-original-DAG
// tokens. A within-file re-home or a gutted section is the rot class D28 closes — the recorded
// [[verbatim-doc-move-breaks-relative-links-authored-for-old-location]] /
// [[spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong]] rot class D19 exists for.
// Per compressed entry, two halves: (a) the glossary entry keeps its definition anchors plus the
// trigger clause naming its destination path; (b) the destination still carries the delegated
// doctrine's tokens, extracted BY CONSTRUCT from its own heading to EOF (submodule-flows.md's
// section is its file's trailing section; the resume-and-recovery.md match deliberately spans the
// Recovery-relaunch subsection plus the held-partial-phase runbook — see the recDest comment)
// — never a whole-file scan. Delete-and-trace: re-home or gut a
// destination section and its (b) reds while CONTEXT.md still points at it; drop a pointer or a
// definition core and its (a) reds.
test('D28 — CONTEXT.md compressed glossary entries keep definition + trigger pointer, and each destination carries the delegated doctrine (#1228)', () => {
  // --- Pair 1: **`held:submodule-pr`** → references/submodule-flows.md ---
  const subEntry = contextMd.match(/^\*\*`held:submodule-pr`\*\*[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m)
  assert.ok(
    subEntry,
    'could not locate the `**`held:submodule-pr`**` glossary entry in CONTEXT.md (bolded term → ' +
      'next bolded term or `###` heading) — the extraction construct rotted',
  )
  const sub = norm(subEntry[0])
  for (const [re, what] of [
    [/\*\*human-triggered\*\* resume/i, 'the human-triggered-resume definition core'],
    [/there is \*\*no\*\* background poller/i, 'the no-background-poller clause'],
    [/reachable on the submodule remote/i, 'the remote-reachable-SHA clause'],
    [/When clearing the hold/i, 'the trigger clause ("When clearing the hold, read …")'],
    [/skills\/war\/references\/submodule-flows\.md/, 'the destination path'],
  ]) {
    assert.match(
      sub,
      re,
      `the CONTEXT.md \`held:submodule-pr\` entry must keep ${what} — correct this row to a ` +
        'sanctioned rewording, never drop the anchor to make a reword pass',
    )
  }
  const subDest = submoduleMd.match(/^## `held:submodule-pr` sub-procedure[\s\S]*$/m)
  assert.ok(
    subDest,
    'references/submodule-flows.md no longer carries the `## `held:submodule-pr` sub-procedure` ' +
      "section — CONTEXT.md's trigger pointer now dangles; re-anchor BOTH surfaces together",
  )
  for (const [re, what] of [
    [/mergeCommit\.oid/, 'the `mergeCommit.oid`-as-landed-SHA step'],
    [/operator-supplied SHA/i, 'the operator-supplied-SHA fallback'],
  ]) {
    assert.match(
      norm(subDest[0]),
      re,
      `the submodule-flows.md sub-procedure section must keep ${what} — it is the doctrine's sole ` +
        'operative home since the #1228 glossary compression',
    )
  }

  // --- Pair 2: **recovery relaunch** → references/resume-and-recovery.md ---
  const recEntry = contextMd.match(/^\*\*recovery relaunch\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m)
  assert.ok(
    recEntry,
    'could not locate the `**recovery relaunch**:` glossary entry in CONTEXT.md (bolded term → ' +
      'next bolded term or `###` heading) — the extraction construct rotted',
  )
  const rec = norm(recEntry[0])
  for (const [re, what] of [
    [/\*\*fresh Workflow run\*\*/i, 'the fresh-Workflow-run definition core'],
    [/same numeric `phase\.id`/i, 'the same-numeric-phase.id clause'],
    [/owned-file continuity/i, 'the owned-file-continuity clause'],
    [/\*\*never\*\* `resumeFromRunId`/, 'the never-resumeFromRunId clause'],
    [/when retrying an escalated task or a held phase/i, 'the trigger clause'],
    [/skills\/war\/references\/resume-and-recovery\.md/, 'the destination path'],
  ]) {
    assert.match(
      rec,
      re,
      `the CONTEXT.md recovery-relaunch entry must keep ${what} — correct this row to a ` +
        'sanctioned rewording, never drop the anchor to make a reword pass',
    )
  }
  // Heading → EOF: the pointer delegates to the whole playbook (the Recovery relaunch subsection
  // plus the held-partial-phase runbook that carries orphan adoption + reclaimStaleRemote arming).
  const recDest = resumeMd.match(/^### Recovery relaunch\n[\s\S]*$/m)
  assert.ok(
    recDest,
    'references/resume-and-recovery.md no longer carries the `### Recovery relaunch` section — ' +
      "CONTEXT.md's trigger pointer now dangles; re-anchor BOTH surfaces together",
  )
  for (const [re, what] of [
    // First key anchors in the Recovery-relaunch body proper (its only in-extraction occurrence)
    // — gutting that body while the adjacent runbook survives must red, since the CONTEXT.md
    // pointer promises the single-task vs full-DAG entry-point split that lives only there.
    [/two entry points/i, 'the two-entry-point structure the CONTEXT.md pointer names'],
    [/record-as-owned/, 'the `record-as-owned` orphan-adoption step'],
    [/args\.recovery/, 'the `args.recovery` arming'],
    [/reclaimStaleRemote/, 'the `reclaimStaleRemote` arming'],
    [/full original phase DAG/i, 'the full-original-DAG clause'],
  ]) {
    assert.match(
      norm(recDest[0]),
      re,
      `the resume-and-recovery.md Recovery-relaunch playbook must keep ${what} — it is the ` +
        'doctrine\'s sole operative home since the #1228 glossary compression',
    )
  }
})

// (D29) ADR 0042 DOCTRINE MIRROR — the hot/cold law + budget doctrine is hand-synced across three
// surfaces beyond the ADR (#1208; folded into Task 6.2 and lost to a row-label collision —
// [[folded-in-followup-can-be-silently-consumed-by-a-row-label-collision]] — relanded as #1231):
// CONTEXT.md's `### Prompt-surface budgets` glossary terms (**Surface budget**, **Prose
// temperature**, **Trigger pointer**), CLAUDE.md's `## Doctrine placement` summary, and
// prompt-surface-budgets.test.mjs's header formula comment (D5/adjudication-D mandates the budget
// constants carry the formula — and it is the ×1.10/×1.25 numeric pair's ONLY mirror block:
// neither prose summary carries the numbers). ADR 0025: every key is asserted on BOTH its mirror
// block and norm(adr0042), so a one-sided edit reds while sanctioned rewording latitude does not —
// keys are token-anchored `\s+`-wrapped `/…/i` forms with `[`*_]{0,2}` emphasis tolerance (the
// ADR italicizes *is* in "the trigger *is* the skeleton"), never sentence bytes. Extraction is BY
// CONSTRUCT (D19/D24/D26's idiom), never a whole-file scan: per glossary term bolded term → next
// bolded-term-with-colon or `###` heading (the colon matters — the Surface-budget body wraps a
// bold `**Advisory line**` cross-reference to column 0); CLAUDE.md heading → next `##`; budget
// suite file start → first top-level `import` (so the per-row PLACEHOLDER/derivation comments
// below the imports can never satisfy the formula keys). Direction-PAIRED keys bind each ratchet
// arm to its own consequence inside one bounded-gap regex (lowering↔normal-PR,
// raising↔commit-body; advisory↔×1.10, hard↔×1.25; the tier ladder in canonical order) — the
// recorded [[multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap]]
// class: presence-anywhere keys stay green on exactly the direction inversion that matters.
test('D29 — ADR 0042 doctrine mirrors (CONTEXT.md glossary terms, CLAUDE.md hot/cold summary, budget-suite formula) track the canonical ADR on both surfaces (#1208)', () => {
  const adr = norm(adr0042)
  const assertMirror = (blockName, blockText, keys) => {
    for (const [key, what] of keys) {
      for (const [surface, text] of [
        [blockName, blockText],
        ['ADR 0042 (canonical source)', adr],
      ]) {
        assert.match(
          text,
          key,
          `${surface} must carry ${what} (ADR 0025 mirror registry). Correct this row to a ` +
            'sanctioned rewording, never drop the clause on one surface to make it pass',
        )
      }
    }
  }

  // --- CONTEXT.md `### Prompt-surface budgets` glossary terms, per-term extraction ---
  for (const [term, keys] of [
    [
      'Surface budget',
      [
        [/lowering[\s\S]{0,20}is\s+a\s+normal\s+PR/i, 'the lowering-is-a-normal-PR ratchet arm'],
        [
          /raising[\s\S]{0,60}commit\s+body/i,
          'the raising-needs-commit-body-justification ratchet arm',
        ],
        [/advisory\s+line\s+warns/i, 'the advisory-line-warns half of the enforcement split'],
        [/hard\s+line\s+is\s+a\s+red\s+test/i, 'the hard-line-reds half of the enforcement split'],
        [/cold\s+storage\s+is\s+unbudgeted/i, 'the cold-storage-is-unbudgeted carve-out'],
      ],
    ],
    [
      'Prose temperature',
      [
        [/branch-frequency/i, 'the branch-frequency definition core'],
        [
          /every-phase[\s\S]{0,8}once-per-run[\s\S]{0,8}branch-gated[\s\S]{0,8}incident-only/i,
          'the four-tier ladder in canonical order',
        ],
        [
          /tier-1\s+\(every-invocation\)\s+doctrine\s+stays\s+inline/i,
          'the only-tier-1-stays-inline placement rule',
        ],
      ],
    ],
    [
      'Trigger pointer',
      [
        [/when\s+<trigger>,\s+read\s+references\//i, 'the fixed `when <trigger>` pointer shape'],
        [
          /trigger\s+[`*_]{0,2}is[`*_]{0,2}\s+the\s+skeleton/i,
          'the trigger-is-the-skeleton clause',
        ],
        [/byte-identical/i, 'the byte-identical-move eviction rule'],
        [
          /pointers?\s+without\s+(?:a\s+)?triggers?/i,
          'the pointer-without-a-trigger defect clause',
        ],
      ],
    ],
  ]) {
    // Mirror D26's idiom: escape the term before building the pattern, so a future
    // metachar-bearing term cannot silently mis-anchor the extraction.
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = contextMd.match(
      new RegExp(`^\\*\\*${t}\\*\\*:[\\s\\S]*?(?=\\n\\*\\*[^\\n*]+\\*\\*:|\\n### )`, 'm'),
    )
    assert.ok(
      block,
      `could not locate the \`**${term}**:\` glossary term in CONTEXT.md (bolded term → next ` +
        'bolded term or `###` heading) — the extraction construct rotted',
    )
    // Non-vacuous: every entry must really reach its own `_Avoid_` line.
    assert.match(
      norm(block[0]),
      /_Avoid_/,
      `the extracted **${term}** entry must span its \`_Avoid_\` line — extraction truncated`,
    )
    assertMirror(`CONTEXT.md **${term}** entry (mirror)`, norm(block[0]), keys)
  }

  // --- CLAUDE.md `## Doctrine placement` summary, heading → next `##` ---
  const placement = claudeMd.match(/^## Doctrine placement[\s\S]*?(?=\n## )/m)
  assert.ok(
    placement,
    'could not locate the `## Doctrine placement` section in CLAUDE.md (heading → next `##`) — ' +
      'the extraction construct rotted',
  )
  assertMirror('CLAUDE.md ## Doctrine placement summary (mirror)', norm(placement[0]), [
    [/when\s+<trigger>,\s+read\s+references\//i, 'the fixed `when <trigger>` pointer shape'],
    [/trigger\s+[`*_]{0,2}is[`*_]{0,2}\s+the\s+skeleton/i, 'the trigger-is-the-skeleton clause'],
    [/pointers?\s+without\s+(?:a\s+)?triggers?/i, 'the pointer-without-a-trigger defect clause'],
    [/byte-identical/i, 'the byte-identical-move eviction rule'],
    [/tier-1\s+\(every-invocation\)/i, 'the tier-1 every-invocation inline reservation'],
    [/lowering[\s\S]{0,20}is\s+a\s+normal\s+PR/i, 'the lowering-is-a-normal-PR ratchet arm'],
    [
      /raising[\s\S]{0,60}commit\s+body/i,
      'the raising-needs-commit-body-justification ratchet arm',
    ],
  ])

  // --- Budget-suite header formula comment, file start → first top-level `import` ---
  const formula = budgetSuiteSrc.match(/^[\s\S]*?(?=^import )/m)
  assert.ok(
    formula,
    "could not locate prompt-surface-budgets.test.mjs's header comment (file start → first " +
      'top-level `import`) — the extraction construct rotted',
  )
  // Non-vacuous: the header must really reach its Formula sentence — anchored on that
  // sentence's OWN opener bytes, never the bare word. The bare word was satisfiable by any
  // other mention inside the extracted region, and the coupling comment a few lines above the
  // formula carried exactly such a mention until this commit paraphrased it to name the
  // derivation instead — so a truncated extraction, or a deleted formula sentence, could have
  // matched that mention and left this assert green. (Paraphrased rather than quoted here: a
  // comment restating retired wording is what false-reds a later retirement sweep.)
  assert.match(
    norm(formula[0]),
    /Formula \(adjudication D\)/i,
    'the extracted budget-suite header must span its Formula sentence — extraction truncated',
  )
  assertMirror(
    'prompt-surface-budgets.test.mjs header formula comment (mirror)',
    norm(formula[0]),
    [
      [/advisory\s*=\s*post-shrink[\s\S]{0,30}1\.10/i, 'the advisory↔×1.10 formula binding'],
      [/hard\s*=\s*post-shrink[\s\S]{0,30}1\.25/i, 'the hard↔×1.25 formula binding'],
    ],
  )
})

// (D32) EVICTED-GLOSSARY POINTER PAIRS — the verdict-adjudication-integrity plan's D14 eviction
// (#1265, #1357; its decision tree labels this guard "D30", a label this file had already spent on
// the dispatch-args census below, so the row lands as D32) moved five cold recovery-entry bodies
// out of CONTEXT.md into the unbudgeted cold home references/glossary-cold.md, leaving per-term
// `when <trigger>, read …` pointers; a second wave (2026-08-27, marked inline below) moved three
// more the same way, so the row now covers every evicted term, not one plan's five. Modelled on D28: each residue is a hand-copied cross-file
// fact (the destination path plus the per-term heading it must resolve to) with no other guard —
// a renamed or dropped destination heading must red here while CONTEXT.md still promises it, and
// a residue that loses its trigger clause or destination path must red too (a pointer without a
// trigger is a defect, ADR 0042). Extraction is BY CONSTRUCT (D28's idiom): CONTEXT.md bolded
// term → next bolded term or `###` heading; glossary-cold.md `##` term heading → next `##` or
// EOF — never line numbers; exactly-one-match per surface, and each cold body must span its
// `_Avoid_` line (D26's non-vacuity floor — a gutted or truncated body reds, not just a missing
// heading).
test('D32 — evicted CONTEXT.md glossary entries keep trigger pointers, and glossary-cold.md carries each term body (#1265, #1357)', () => {
  const glossaryColdMd = readFileSync(join(HERE, '..', 'references', 'glossary-cold.md'), 'utf8')
  // Each row pins the term (CONTEXT.md bold heading) AND the exact cold-home heading line — a
  // trailing-tolerance wildcard after the term would stay green on an appended rename
  // (`## Stale prior attempts (renamed)` matched a `[^\n]*`-suffixed draft of this row).
  for (const [term, coldHeading] of [
    ['provision base divergence', '## provision base divergence'],
    ['Orphan adoption', '## Orphan adoption (`record-as-owned`)'],
    ['Stale prior attempt', '## Stale prior attempt'],
    ['Dead-agent land failure', '## Dead-agent land failure'],
    ['Near-miss diagnostic', '## Near-miss diagnostic'],
    // Wave 2 — the 2026-08-27 in-run-finding-resolution plan's Task 3 funded CONTEXT.md's two new
    // re-entry/citation glossary terms by a byte-identical eviction of three more cold entries
    // (coldness criterion, stated in glossary-cold.md's header: incident-only / one-command terms
    // fully narrated in their own operative home — ADR 0023 + resume-and-recovery.md, ADR 0045 +
    // red-team/references/loop-budget.md, ADR 0027 + aftermath/SKILL.md respectively). Never a
    // ceiling raise; these rows are the lock-step re-anchor the eviction owes.
    ['Land-truth guard', '## Land-truth guard'],
    ['Route-upstream', '## Route-upstream'],
    // in-run-finding-resolution Phase 3 Task 2 completion (#1902): two more cold bodies evicted
    // to fund the pinned ~1 KB of CONTEXT.md slack.
    ['residual-set verification', '## residual-set verification'],
    ['churny shared docs', '## churny shared docs'],
    ['patch-equivalence probe', '## patch-equivalence probe'],
    // Wave 3 — the #1953 eviction pass (2026-08-31) restored CONTEXT.md headroom from 1 B to
    // 2,064 B under the unchanged ceiling. Coldness per the header criterion: each body is fully
    // narrated in its own operative home — the retired-token sweep in skills/war/SKILL.md's
    // phase-close paragraph, the done-unmet route on agents/war-refiner.md's floor section plus
    // assert-done-when.sh's own header. The Strategy-verifier seat was CONSIDERED and rejected:
    // D36 guard-binds it inline as one of the eight authoring-side-verification mirror terms.
    // Never a ceiling raise; these rows are the lock-step re-anchor the eviction owes.
    ['Retired-token sweep', '## Retired-token sweep'],
    ['done-unmet route', '## done-unmet route'],
  ]) {
    // Mirror D26's idiom: escape the term before building the pattern.
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // --- (a) CONTEXT.md residue: heading survives, with trigger clause + literal destination ---
    const residues = [
      ...contextMd.matchAll(
        new RegExp(`^\\*\\*${t}\\*\\*[\\s\\S]*?(?=\\n\\*\\*[^\\n*]+\\*\\*|\\n### )`, 'gm'),
      ),
    ]
    assert.equal(
      residues.length,
      1,
      `expected exactly one \`**${term}**\` glossary entry in CONTEXT.md (bolded term → next ` +
        `bolded term or \`###\` heading), found ${residues.length} — the extraction construct ` +
        'rotted or the residue was dropped',
    )
    const residue = norm(residues[0][0])
    assert.match(
      residue,
      /\bwhen\s+\S[\s\S]*?,\s*read\s/i,
      `the CONTEXT.md \`${term}\` residue must keep its \`when <trigger>, read …\` clause — a ` +
        'pointer without a trigger is a defect (ADR 0042); restore the trigger, never bare-link',
    )
    assert.match(
      residue,
      /skills\/war\/references\/glossary-cold\.md/,
      `the CONTEXT.md \`${term}\` residue must keep the literal glossary-cold.md destination ` +
        'path — re-anchor BOTH surfaces together on any re-home',
    )
    // --- (b) cold-home destination: exactly one per-term heading with a non-empty body ---
    // The heading line is matched as an exact literal (no trailing tolerance — see above).
    // Terminator is next `##` heading or TRUE end-of-input (`(?![\s\S])` — under the `m` flag a
    // bare `$` matches every line end, which would truncate each body to the empty string).
    const h = coldHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const dests = [
      ...glossaryColdMd.matchAll(
        new RegExp(`^${h}\\n([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`, 'gm'),
      ),
    ]
    assert.equal(
      dests.length,
      1,
      `expected exactly one \`${coldHeading}\` heading in references/glossary-cold.md, found ` +
        `${dests.length} — CONTEXT.md's trigger pointer now dangles; re-anchor BOTH surfaces together`,
    )
    const destBody = norm(dests[0][1])
    assert.ok(
      destBody.trim().length > 0,
      `the glossary-cold.md \`${term}\` body is empty — the evicted doctrine's sole operative ` +
        'home was gutted; restore the byte-identical body',
    )
    assert.match(
      destBody,
      /_Avoid_/,
      `the glossary-cold.md \`${term}\` body must span its \`_Avoid_\` line — extraction ` +
        'truncated or the moved body lost its tail',
    )
  }
})

// ---- Task 1 non-vacuity census (plan 2026-08-02-structural-test-nonvacuity) ----
//
// (D30) The dispatch-args doc-cascade sweep (spec §4.4) named FOUR live surfaces as the complete
// population carrying the stager's two args-embedding identifiers. Nothing mechanically held that
// count — the sweep was a hand-run grep — so a fifth surface could appear, or one of the four lose
// its occurrence, with every suite green. This row is that census, default-deny in BOTH directions
// (the recorded [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
// class: a superset-only census ships exactly the blind spot it was written to close).
//
// SELF-EXCLUDING BY CONSTRUCTION: both identifiers are assembled from split fragments, so this file
// carries neither contiguously and can never appear in its own result set. That is not decoration —
// this suite WAS a hit until the Task 2.1 banner above was reworded in this same commit (#1241,
// #1163). For the same reason the expected paths below are plain path strings, and every comment and
// failure message here names the sweep descriptively and never quotes its alternation.
//
// PER-ALTERNATE, not merely the union: the two identifiers are NOT independently load-bearing at
// this base. The embedded-args identifier hits all four surfaces; the fallback-anchor identifier
// hits only the three non-SKILL.md ones (SKILL.md's staging prose cites the first and not the
// second). A union-only equality is therefore fully satisfiable by the first alternate alone, so a
// rotted second fragment would narrow this census SILENTLY. Split-fragment construction is what
// makes that fragment uniquely rot-prone: the literal is by design un-findable by the very sweep it
// implements, so no repo-wide grep can catch a typo in it either. The per-alternate sets are the
// only mechanical hold on it.
//
// Designed friction: this row intentionally REDs on legitimate growth. A fifth surface carrying
// either identifier is a correct change that must update the expected list in the SAME diff.
test('D30 — the dispatch-args identifier sweep hits exactly its four expected surfaces, per alternate and in union (#1241, #1163)', () => {
  // Split fragments — see the self-exclusion note above. Rotting either half of either token
  // REDs that alternate's own assert, which is the proof neither half is dead weight.
  const embeddingToken = 'EMBEDDED' + '_ARGS'
  const fallbackToken = 'ARGS' + '_FALLBACK_ANCHOR'

  // Repo-relative paths are built during the walk, so they are forward-slashed by construction
  // and need no separator normalization. Root anchored from HERE, never cwd (see the file header).
  const walk = (absDir, relPrefix) =>
    readdirSync(absDir, { withFileTypes: true }).flatMap((entry) => {
      const abs = join(absDir, entry.name)
      const rel = `${relPrefix}${entry.name}`
      if (entry.isDirectory()) return walk(abs, `${rel}/`)
      return entry.isFile() ? [[rel, abs]] : []
    })
  const files = walk(join(HERE, '..', '..', '..', 'skills'), 'skills/')
  assert.ok(files.length > 0, 'non-vacuity: the skills/ walk discovered no files at all')

  const hits = (token) =>
    files.filter(([, abs]) => readFileSync(abs, 'utf8').includes(token)).map(([rel]) => rel).sort()

  const EXPECTED_EMBEDDING_SURFACES = [
    'skills/war/SKILL.md',
    'skills/war/assets/stage-workflow.mjs',
    'skills/war/assets/stage-workflow.test.mjs',
    'skills/war/assets/workflow-template.js',
  ]
  // The fallback-anchor identifier is a code-only export: SKILL.md's prose cites the embedding
  // identifier alone, so this set is the four minus SKILL.md (measured at this task's base).
  const EXPECTED_FALLBACK_SURFACES = EXPECTED_EMBEDDING_SURFACES.filter(
    (p) => p !== 'skills/war/SKILL.md',
  )

  const assertCensus = (label, actual, expected) => {
    const want = [...expected].sort()
    const missing = want.filter((p) => !actual.includes(p))
    const unexpected = actual.filter((p) => !want.includes(p))
    assert.deepEqual(
      actual,
      want,
      `${label}: the four-surface sweep census drifted — missing ${JSON.stringify(missing)}, ` +
        `unexpected ${JSON.stringify(unexpected)}. A new surface carrying the identifier is a ` +
        'correct change that must update this expected list in the SAME diff; a missing surface ' +
        'means the occurrence was dropped — restore it, or retire the entry deliberately. Never ' +
        'relax this census to make a drift pass',
    )
  }

  assertCensus('embedded-args identifier', hits(embeddingToken), EXPECTED_EMBEDDING_SURFACES)
  assertCensus('args fallback-anchor identifier', hits(fallbackToken), EXPECTED_FALLBACK_SURFACES)

  const union = files
    .filter(([, abs]) => {
      const src = readFileSync(abs, 'utf8')
      return src.includes(embeddingToken) || src.includes(fallbackToken)
    })
    .map(([rel]) => rel)
    .sort()
  assertCensus('union of both identifiers', union, EXPECTED_EMBEDDING_SURFACES)
})

// ---- Task 1.4 card↔script usage guard (plan 2026-08-02-war-engine-and-standing-doc-truth) ----

// (D9) The refiner card SHOWS an invocation of the submodule-mutation floor; the script PRINTS its
// own usage. Nothing held the two in agreement — the card shipped the declared-gitlink flag ahead
// of both positionals while the script's usage puts it last, so a refiner copying the card's shape
// verbatim would hand the script a flag where it expects its first positional (#1219). This row is
// that agreement, and it is a SHAPE agreement, never byte equality: the placeholder names differ
// by design (the card names the two branches by their WAR roles, the script by its own parameter
// names), so the shared invariant is the ORDER and the arity — two positionals, then the flag.
//
// Extraction is BY CONSTRUCT on both sides and deliberately NARROW on the card: the gitlink-bump
// sub-bullet, then the one backtick code span inside it that opens with the script token — never
// the whole bullet and never the whole file. That narrowing is load-bearing, not tidiness: the
// same bullet legitimately mentions the flag ahead of the positionals in PROSE twice (its
// "pass …" lead-in and its closing "refused even with …" parenthetical), and the neighbouring
// sub-bullet shows the sanctioned no-flag form, so a bullet-wide or file-wide order check would be
// literally false about the CORRECT file and would red on plan-mandated text.
//
// Patterns are FRAGMENT-BUILT from the basename const declared at the top of this file, and the
// negative reference below is interpolated rather than spelled: the retired defect is the script
// token immediately followed by the flag, so this row must never carry that byte-run contiguously
// in its source, comments or messages, or it becomes a hit for the very sweep that retired it
// ([[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]]).
const DECLARED_FLAG = '--declared'
// The shape of one invocation string: the placeholders standing ahead of the FIRST flag, and where
// the declared-gitlink flag sits relative to them. Shared by both surfaces AND by the negative
// reference, so a reader that stopped discriminating cannot green one surface silently.
const invocationShape = (text) => {
  const firstFlagAt = text.search(/--[a-z]/)
  const head = firstFlagAt < 0 ? text : text.slice(0, firstFlagAt)
  const leading = [...head.matchAll(/<[A-Za-z][A-Za-z0-9]*>/g)].map((m) => m[0])
  const declaredAt = text.indexOf(DECLARED_FLAG)
  const lastLeadingEnd = leading.length
    ? head.lastIndexOf(leading[leading.length - 1]) + leading[leading.length - 1].length
    : -1
  return {
    leading,
    declaredPresent: declaredAt >= 0,
    declaredTrails: leading.length > 0 && declaredAt > lastLeadingEnd,
  }
}
test("D9 — the refiner card's gitlink-bump invocation agrees in shape with the floor script's own usage line (#1219)", () => {
  const bullet = refinerCard.match(/^ *- For a \*\*gitlink-bump task\*\*[\s\S]*?(?=\n *- )/m)
  assert.ok(
    bullet,
    'could not locate the gitlink-bump sub-bullet in agents/war-refiner.md (its bolded task-type ' +
      'marker → the next sub-bullet) — the extraction construct rotted',
  )
  const shown = bullet[0].match(new RegExp('`(' + FLOOR_SCRIPT.replace(/\./g, '\\.') + '[^`]*)`'))
  assert.ok(
    shown,
    'the gitlink-bump sub-bullet no longer SHOWS a floor invocation in a code span — this row ' +
      'polices the shape the refiner is shown, so its disappearance is a contract change to ' +
      'adjudicate, never a pass',
  )
  const usage = floorScriptSrc.match(/usage: \$PROG([^"]*)"/)
  assert.ok(
    usage,
    "could not locate the floor script's own usage string — the extraction construct rotted",
  )

  const card = invocationShape(shown[1])
  const script = invocationShape(usage[1])

  // Arity is pinned once, on the card, and the script must AGREE with it — a drift on either
  // surface reds as the disagreement it is. Deltas are interpolated because a custom assertion
  // message suppresses node:assert's generated diff
  // ([[assert-deepequal-custom-message-suppresses-diff-interpolate-delta]]).
  assert.equal(
    card.leading.length,
    2,
    'the card must show exactly two positional placeholders ahead of the first flag; it shows ' +
      `${card.leading.length} (${JSON.stringify(card.leading)}). Extraction rotted, or the ` +
      "invocation's argument contract changed and this row must be re-adjudicated",
  )
  assert.equal(
    script.leading.length,
    card.leading.length,
    `card↔script arity disagreement: the card shows ${card.leading.length} positional ` +
      `placeholder(s) ${JSON.stringify(card.leading)} but the script's usage declares ` +
      `${script.leading.length} ${JSON.stringify(script.leading)} ahead of its first flag. The ` +
      'two surfaces describe ONE call; whichever moved must bring the other with it in the same diff',
  )
  for (const [label, shape] of [
    ['refiner card invocation', card],
    ['floor script usage line', script],
  ]) {
    assert.ok(
      shape.declaredPresent,
      `${label}: the declared-gitlink flag is absent. This row polices where that flag sits, so ` +
        'its removal is a contract change to adjudicate, never a pass',
    )
    assert.ok(
      shape.declaredTrails,
      `${label}: the declared-gitlink flag stands ahead of a positional argument. The script ` +
        'consumes its positionals by position, so a refiner copying this shape hands it a flag ' +
        'where the first argument belongs (#1219) — both surfaces put that flag last. Never ' +
        'relax this row to match a surface that drifted',
    )
  }

  // Both-ways proof (unwired, interpolated so this file never spells the retired byte-run): the
  // pre-#1219 card shape led with the flag. Read by the SAME shape reader it must fail both the
  // arity and the trailing facts — otherwise the reader stopped discriminating and every green
  // above is vacuous.
  const retired = invocationShape(`${FLOOR_SCRIPT} ${DECLARED_FLAG} <integrationBranch> <taskBranch>`)
  assert.equal(
    retired.leading.length,
    0,
    'the shape reader no longer discriminates: it counted ' +
      `${retired.leading.length} positional placeholder(s) ahead of the first flag in the retired ` +
      'flag-first shape, which by construction has none. Tighten the reader, never relax this proof',
  )
  assert.equal(
    retired.declaredTrails,
    false,
    'the shape reader no longer discriminates: it read the retired flag-first shape as ' +
      'flag-trailing. Tighten the reader, never relax this proof',
  )
})

// ---- Task 1.1 done-when intake guard (plan 2026-08-05-precision-chain-and-loop-breaker) ----

// (D31) The Decompose step's done-when intake sub-bullet — the authoring contract's done-when law
// (ADR 0044) made mechanical on the /war side (plan 2026-08-05-precision-chain-and-loop-breaker,
// Task 1.1; red-team F8 converted End state 1's judge tag into this row, so the guard rides its
// fact's own task). Four clauses are load-bearing and easy to lose in a reword — (a) and (b) from
// Task 1.1, (c) and (d) added by the #1332 intake landing and pinned by the keys below:
//   (a) the FULL-BULLET parse — soft-wrapped physical lines joined with single spaces until the
//       next `- ` bullet or a blank line. The authoring template wraps its bullets, so a
//       first-line-only parse truncates the staged command mid-token and the truncated command
//       later red-fails as a spurious done-unmet at merge;
//   (b) the intake-defect rule — a `requiresTest: true` task without a `Done when:` command:
//       interactive runs surface it at the approval gate; under --afk the Lead refuses
//       dispatch; the Lead never invents an acceptance command. The SKILL.md
//       `Legacy arm (checked first)` clause gates the rule — a plan with no `Done when:`
//       bullets anywhere stages unchanged and the intake-defect rule does not fire;
//   (c) the VALUE boundary (#1332) — the staged command is the text AFTER the `Done when:` key,
//       never the key itself, so a parse that keeps the label stages an unrunnable command;
//   (d) the BACKTICK-STRIPPING boundary (#1332) — backticks are markup and are stripped, so the
//       staged command is the code span's text, never a string carrying backtick characters.
// Also pinned: the template's no-command arm (`None — <basis>`) stages `doneWhen: null` — without
// that arm the intake would stage the literal "None — <basis>" prose as an executable command —
// and the legacy arm (no `Done when:` bullets anywhere ⇒ stages unchanged, byte-identical
// downstream prompts). Extraction is BY CONSTRUCT and SECTION-ANCHORED (D22's region idiom): the
// `## Decompose + approve` region (heading → next `## ` heading) is extracted first — so the
// sub-bullet relocating out of the Decompose gate, where the Lead's procedure would no longer
// carry the intake step, reds the region filter instead of greening on a whole-file hit — and
// within it SKILL.md keeps one step/sub-bullet per physical line, so the row takes the single
// line carrying the `**Done-when intake` bold lead-in (uniqueness asserted): the sub-bullet
// itself carries `Done when:` multiple times, and the token is free to recur in future steps'
// prose — the lead-in line is the stable construct. Keys are token-anchored
// `\s+`-tolerant forms, never sentence bytes — sanctioned rewording latitude must not false-red;
// correct a key to the new truth, never drop it to make a reword pass.
//
// The two intake-defect ROUTING arms are PAIRED keys, never presence-anywhere
// (#1040, D18's in-file precedent;
// [[multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap]]): independent
// presence keys over the same bullet green a reword with the two behaviors SWAPPED ("interactive
// runs refuse dispatch; under `--afk` surface it at the approval gate") — an inversion of the
// exact routing the plan slice names, and an --afk approval gate does not exist. Each key binds
// its trigger token to its own arm's behavior through a bounded NEGATED-SCAN gap that refuses to
// cross the other arm's trigger token, and the interactive trigger is anchored to its live token
// form (`interactive runs`, never bare `interactive`) — a bare trigger with the negated gap
// alone re-matches a collided reword at a second `interactive` token occurrence
// ("interactive-style", #1375). Two inverted-routing shapes are provably rejected by the
// negative references below: the arms-SWAPPED reword (each behavior keeping its own aside, only
// the routing inverted) and the arms-COLLIDED reword (#1375's shape — the `--afk` arm routed
// through an interactive-style review to the approval gate while interactive runs get the
// refusal, the other arm's trigger token sitting inside one key's gap). Shared by the live row
// and both negative references below — the uses must never drift apart.
// EVERY fragment now has a both-ways proof — the residual this comment once recorded is CLOSED
// (#1521/#1689). The AFK key's negated gap is proven by the COLLIDED reference (deleting
// `(?!interactive)` reds it — the measured `--afk` → `refuses dispatch` gap is 111 chars, inside
// the {0,120} bound), and the interactive key's LIVE-TOKEN ANCHOR is proven by the same reference
// (deleting `\s+runs` reds it at the `interactive-style` token). The interactive key's `(?!--afk)`
// gap needed a THIRD reference, because neither of the first two can reach it: SWAPPED's
// `interactive runs` → `approval gate` distance is 165 chars, already over the {0,80} bound, and
// COLLIDED carries no `approval gate` after its `interactive runs` token. D31_ARMS_AFK_IN_GAP
// below is that reference — `interactive runs` … `--afk` … `approval gate` with a measured 53-char
// gap, well inside the bound — so deleting `(?!--afk)` greens a reference asserted red and the row
// reds. Measured by scratch deletion at this task's base, not assumed; re-measure the gap after
// ANY reword of that reference.
const D31_INTERACTIVE_ARM = /interactive\s+runs(?:(?!--afk)[\s\S]){0,80}approval\s+gate/i
const D31_AFK_ARM = /--afk(?:(?!interactive)[\s\S]){0,120}refuses\s+dispatch/i
// Unwired negative reference (both-ways proof, zero fixture files — D22/D9's idiom): a
// hand-written copy of the intake-defect prose with the two routing arms swapped, each behavior
// keeping its own aside so BOTH discriminating tokens (`refuses dispatch`, `approval gate`)
// stay present and only the routing inverts. Both paired keys must red on it: the interactive
// key's bounded gap cannot reach across the transplanted refusal clause, and no dispatch
// refusal follows `--afk` at all. SKILL.md itself is never edited to prove a guard.
const D31_ARMS_SWAPPED =
  'A `requiresTest: true` task without a `Done when:` command is an **intake defect**: on ' +
  'interactive runs the Lead **refuses dispatch** (a hard stop — no teammate launches, and the ' +
  'Lead never invents an acceptance command); under `--afk` it **surfaces the defect at the ' +
  'approval gate** (the operator supplies the command or re-rules `requiresTest`).'
// Second unwired negative reference — the arms-COLLIDED reword (#1375): inverted routing hidden
// by a cross-key token collision, the other arm's trigger token placed INSIDE one key's gap. The
// `--afk` arm rides an "interactive-style" review to the approval gate while interactive runs
// get the refusal. The untightened keys both matched this shape (the interactive key at the
// "interactive-style" token occurrence, the afk key scanning straight across it) — the fixture
// and the tightened keys land together. Both tightened keys must red on it: `interactive-style`
// is not the live `interactive runs` trigger form, and the afk key's negated gap refuses to
// cross the `interactive` token. SKILL.md itself is never edited to prove a guard.
const D31_ARMS_COLLIDED =
  'A `requiresTest: true` task without a `Done when:` command is an **intake defect**: under ' +
  '`--afk` it rides an interactive-style review to the **approval gate**; interactive runs get ' +
  'the refusal — the Lead **refuses dispatch** and never invents an acceptance command.'
// Third unwired negative reference (#1521/#1689) — the AFK-IN-GAP reword: interactive runs are
// routed to the approval gate (the inverted routing), and the `--afk` token sits INSIDE the
// interactive key's gap, 53 chars from `interactive runs` to `approval gate` — inside the {0,80}
// bound, so the key without `(?!--afk)` matches. This is the ONLY reference that exercises that
// fragment: the SWAPPED gap is 165 chars (over the bound) and COLLIDED has no `approval gate`
// after its interactive token. Both keys must red on it — the interactive key at the negated gap,
// the afk key because no `refuses dispatch` follows `--afk` at all. SKILL.md itself is never
// edited to prove a guard.
const D31_ARMS_AFK_IN_GAP =
  'A `requiresTest: true` task without a `Done when:` command is an **intake defect**: on ' +
  'interactive runs the Lead defers to `--afk` and surfaces it at the **approval gate**; the ' +
  '`--afk` path instead stages the task unchanged.'
test('D31 — SKILL.md Decompose done-when intake keeps the full-bullet parse clause and the requiresTest-without-Done-when intake-defect rule (F8, Task 1.1)', () => {
  const decompose = skillMd.match(/^## Decompose \+ approve[\s\S]*?(?=\n## )/m)
  assert.ok(
    decompose,
    'could not locate the `## Decompose + approve` region in SKILL.md (heading → next `## ` ' +
      'heading) — the D31 extraction construct rotted',
  )
  const leadIns = decompose[0].split('\n').filter((l) => l.includes('**Done-when intake'))
  assert.equal(
    leadIns.length,
    1,
    'expected exactly one `**Done-when intake` lead-in line in the Decompose + approve region, ' +
      `found ${leadIns.length} — the extraction construct rotted (sub-bullet moved out of the ` +
      'Decompose gate, duplicated, split across lines, or the lead-in was reworded)',
  )
  const b = norm(leadIns[0])
  for (const [key, why] of [
    // the staged field, alongside the sibling per-task fields
    [/tasks\[\]\.doneWhen/, 'the staged per-task field name tasks[].doneWhen'],
    [/string\s*\|\s*null/i, 'the doneWhen string|null typing'],
    [/`requiresTest`\s*\/\s*`deps`/, 'the alongside-requiresTest/deps staging clause'],
    // (a) the full-bullet parse clause
    [/full\s+bullet\s+content/i, 'the FULL-bullet parse declaration'],
    [/joined\s+with\s+single\s+spaces/i, 'the soft-wrap single-space join'],
    [/next\s+`- `\s+bullet\s+or\s+a\s+blank\s+line/i, 'the parse terminator — next `- ` bullet or a blank line'],
    [/first-line-only\s+parse/i, 'the first-line-only-parse hazard naming'],
    [/spurious\s+`?done-unmet`?/i, 'the spurious done-unmet consequence'],
    // the no-command arm stages null, never an executable "None — <basis>" string
    [/None — <basis>/, "the template's no-command arm literal"],
    [/doneWhen:\s*null`?,?\s+exactly\s+like\s+an\s+absent\s+bullet/i, 'the None-stages-null equivalence'],
    // (b) the intake-defect rule — the two routing arms PAIRED, never presence-anywhere (#1040)
    [/requiresTest:\s*true`?\s+task\s+without/i, 'the requiresTest-true-without-Done-when trigger'],
    [/intake\s+defect/i, 'the intake-defect naming'],
    [D31_INTERACTIVE_ARM, 'the interactive arm routes to the approval gate'],
    [D31_AFK_ARM, 'the --afk arm routes to dispatch refusal'],
    [/never\s+invents\s+an\s+acceptance\s+command/i, 'the Lead-never-invents floor'],
    // the legacy arm
    [/bullets\s+anywhere\s+stages\s+unchanged/i, 'the legacy no-bullets-anywhere unchanged arm'],
    [/byte-identical/i, 'the legacy byte-identity consequence'],
    // the value boundary — the staged command is the bullet's value, never the key (#1332)
    [
      /text\s+AFTER\s+the\s+`?Done when:`?\s+key/i,
      'the value-boundary clause — the text AFTER the `Done when:` key, never the key itself',
    ],
    // the backtick-stripping boundary — the command is the code-span text, markup stripped;
    // this key lands in the same commit as its SKILL.md clause (#1332)
    [
      /backticks\s+are\s+markup,\s+stripped/i,
      'the backtick-stripping clause — the command is the code-span text, backticks stripped',
    ],
    // legacy precedence — the legacy arm gates the intake-defect rule off (#1332)
    [
      /intake-defect\s+rule\s+does\s+not\s+fire/i,
      'the legacy-precedence clause — the intake-defect rule does not fire on a legacy plan',
    ],
  ]) {
    assert.match(
      b,
      key,
      `the done-when intake sub-bullet must keep ${why} (key ${key}) — correct this row to a ` +
        'sanctioned rewording, never drop the clause to make a reword pass',
    )
  }
  // Both-ways proof: the paired arm keys must REJECT both inverted-routing shapes — without
  // this, a key that silently stopped discriminating (a widened gap, a dropped trigger token, a
  // de-anchored trigger) would still read green above.
  for (const [negName, negative] of [
    ['arms-swapped', D31_ARMS_SWAPPED],
    ['arms-collided (#1375)', D31_ARMS_COLLIDED],
    ['afk-in-gap (#1521/#1689)', D31_ARMS_AFK_IN_GAP],
  ]) {
    for (const [key, why] of [
      [
        D31_INTERACTIVE_ARM,
        'a bullet not routing interactive runs to the approval gate satisfies it',
      ],
      [D31_AFK_ARM, 'a bullet not routing the --afk arm to dispatch refusal satisfies it'],
    ]) {
      assert.doesNotMatch(
        norm(negative),
        key,
        `the D31 paired arm key ${key} matched the ${negName} negative reference: ${why}. ` +
          'Tighten the key, never relax the negative reference to make this pass',
      )
    }
  }
})

// Source-derivable absorb eligibility (realized-absorb-rate Task 3.3; ADR 0013's 2026-08-20
// amendment; re-anchored to the eviction destination by ask-disposition Task 1.1 in the same
// commit as the eviction). The evicted `disposition:'absorb'` block — now in
// skills/war/references/disposition-eligibility.md — carries the clarification that a
// doc fact deterministically re-derivable from a machine-readable in-repo source is mechanical
// regardless of value count, with "single-file" read on the fix's WRITE FOOTPRINT (the doc), not
// the source it reads from. Presence-guarded by a stable mid-sentence token so a rewrite
// that drops the clarification reds here — correct this row to a sanctioned rewording, never
// delete it to make a reword pass.
test('disposition-eligibility.md absorb block carries the source-derivable eligibility clarification (write-footprint token)', () => {
  const block = eligibilityRef.match(/`disposition:'absorb'`[\s\S]*?(?=\n\n|\n- )/)
  assert.ok(block, "could not locate the `disposition:'absorb'` block in skills/war/references/disposition-eligibility.md")
  assert.match(
    norm(block[0]),
    /write footprint/i,
    'the absorb block must keep the source-derivable eligibility clarification (stable token ' +
      '"write footprint" — the single-file test reads on the doc being corrected, not the ' +
      'machine-readable source it derives from)',
  )
})

// (D34) RETIRED D4/D5 CONNECTIVES (#1498) — CONTEXT.md was the third live surface of the two
// authoring laws the war-strategy convergence retired the old wording of: the D4 issue-derived
// source-form clause (the retired claims/source-form phrasing → "issue-derived facts use …") and
// the D5 done-when connective (the retired elsewhere-connective → "permitted (not required) on
// any other task; otherwise"). (Retired forms paraphrased rather than quoted here, per D9's and
// D29's precedent: a comment restating retired wording is what false-reds a later retirement
// sweep.) Both directions are committed assertions, per the
// recorded [[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]] lesson: the
// NEW-present half is extracted BY CONSTRUCT from the owning glossary entry (D19/D26's idiom), and
// the OLD-absent half sweeps all THREE converged surfaces (CONTEXT.md + the two canonical
// war-strategy homes) so a revert on any one reds. Keys are `\s+`-wrapped so the retired literal
// never appears contiguously in this file and a wrapped line still matches (D18's idiom).
// Deliberately OUT of the OLD-absent sweep: ADR 0044 §Decision item 4 (a historical decision
// record, outside the pin sweep), skills/war-machine/SKILL.md's conversion directive, and
// skills/survey-corps/SKILL.md's already-converged "carries" phrasing — per #1498's own survey.
test('D34 — CONTEXT.md carries the converged D4/D5 connectives; the retired forms are absent on all three converged surfaces (#1498)', () => {
  // NEW-present, by construct: the **Evidence tag** entry carries the converged D4 clause.
  const evTag = contextMd.match(/^\*\*Evidence tag\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:|\n### )/m)
  assert.ok(evTag, 'could not locate the `**Evidence tag**:` glossary entry in CONTEXT.md')
  assert.match(
    norm(evTag[0]),
    /issue-derived\s+facts\s+use\s+`?\(verified:\s+issue\s+#N/i,
    'the CONTEXT.md **Evidence tag** entry must carry the converged D4 clause ' +
      '("issue-derived facts use `(verified: issue #N (<date>))`") — correct this row to a ' +
      'sanctioned rewording, never revert to the retired connective',
  )
  // NEW-present, by construct: the **Done-when** entry carries the converged D5 connective.
  const doneWhen = contextMd.match(/^\*\*Done-when\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:|\n### )/m)
  assert.ok(doneWhen, 'could not locate the `**Done-when**:` glossary entry in CONTEXT.md')
  assert.match(
    norm(doneWhen[0]),
    /permitted\s+\(not\s+required\)\s+on\s+any\s+other\s+task;\s+otherwise/i,
    'the CONTEXT.md **Done-when** entry must carry the converged D5 connective ' +
      '("permitted (not required) on any other task; otherwise `None — <basis>`")',
  )
  // OLD-absent, all three converged surfaces — the committed half of the both-directions gate.
  for (const [name, text] of [
    ['CONTEXT.md', contextMd],
    ['skills/war-strategy/SKILL.md', warStrategySkillMd],
    ['skills/war-strategy/references/plan-interview.md', planInterviewMd],
  ]) {
    assert.doesNotMatch(
      norm(text),
      /issue-derived\s+claims\s+use\s+the\s+source\s+form/i,
      `${name} still carries the retired D4 connective ("issue-derived claims use the source ` +
        'form") — the converged wording is "issue-derived facts use `(verified: …)`" (#1498)',
    )
    assert.doesNotMatch(
      norm(text),
      /permitted\s+\(not\s+required\)\s+elsewhere\s+—\s+otherwise/i,
      `${name} still carries the retired D5 connective ("permitted (not required) elsewhere — ` +
        'otherwise") — the converged wording is "on any other task; otherwise" (#1498)',
    )
  }
})

// (D35) TOUCHED-DOC ACCURACY DUTY MIRROR (#1603) — the CONTEXT.md **Touched-doc accuracy duty**
// glossary entry restates doctrine whose canonical operative home is `/war-strategy` §3 authoring
// rule 8 (with ADR 0025's 2026-08-19 amendment as the decision record). The entry landed with
// zero mechanical coverage — this row is the same-commit-family guard the file's own D26/D29
// precedent mandates (ADR 0025: a new mirror ships its drift guard). Extraction is BY CONSTRUCT
// on both surfaces — the bolded glossary term → next bolded term or `###` heading, and rule 8's
// numbered bullet → the next numbered rule or `##` heading — never a whole-file scan, because
// war-strategy/SKILL.md repeats this row's tokens OUTSIDE rule 8: at this task's base it carries
// three `de-mirror` hits and four `plan defect` hits, one and two of them outside rule 8 (a
// dated count snapshot), so a whole-file key would green with rule 8 itself deleted. It also
// carries two `explicitly defer` hits, both inside rule 8 itself — included for the full
// token-count picture, not as evidence of outside-rule-8 repetition. (The trichotomy's two
// OTHER homes — docs/adr/0025 and skills/war/references/touched-doc-accuracy.md — are not read by
// this row at all, and no End state of the source plan pins their tokens; the earlier "End states
// 3/10 pin elsewhere" citation was wrong on both counts: End state 3 pins the CANONICAL rule 8
// tokens through war-strategy-structure.test.sh, End state 10 pins the ADR 0044 amendment, and
// End state 7 is this row's own.) Keys are token-anchored `\s+`-wrapped forms, never sentence bytes —
// sanctioned rewording latitude on either surface must not false-red; a one-sided edit reds.
test('D35 — CONTEXT.md **Touched-doc accuracy duty** entry mirrors war-strategy rule 8 on both surfaces (#1603)', () => {
  const entry = contextMd.match(
    /^\*\*Touched-doc accuracy duty\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*:|\n### )/m,
  )
  assert.ok(
    entry,
    'could not locate the `**Touched-doc accuracy duty**:` glossary entry in CONTEXT.md ' +
      '(bolded term → next bolded term or `###` heading) — the extraction construct rotted',
  )
  assert.match(
    norm(entry[0]),
    /_Avoid_/,
    'the extracted **Touched-doc accuracy duty** entry must span its `_Avoid_` line — ' +
      'extraction truncated',
  )
  const rule8 = warStrategySkillMd.match(/^8\. \*\*Touched-doc fact[\s\S]*?(?=\n\d+\. \*\*|\n## )/m)
  assert.ok(
    rule8,
    'could not locate §3 authoring rule 8 (`8. **Touched-doc fact`) in ' +
      'skills/war-strategy/SKILL.md — the canonical home rotted; re-anchor BOTH surfaces together',
  )
  for (const [key, what] of [
    [/machine-readable\s+in-repo\s+source/i, 'the machine-readable-source scope clause'],
    [/never\s+prose\s+claims\s+generally/i, 'the never-prose-claims-generally scope limit'],
    [/de-mirror/i, 'the de-mirror arm of the trichotomy'],
    [/explicitly\s+defer/i, 'the explicitly-defer arm of the trichotomy'],
    [/plan\s+defect/i, 'the silent-restatement-is-a-plan-defect consequence'],
    [/touched-doc-accuracy\.md/, 'the pointer to the reference text'],
    [/2026-08-19/, "the ADR 0025 amendment date (the doctrine's decision record)"],
  ]) {
    for (const [surface, text] of [
      ['CONTEXT.md **Touched-doc accuracy duty** entry (mirror)', norm(entry[0])],
      ['war-strategy SKILL.md rule 8 (canonical home)', norm(rule8[0])],
    ]) {
      assert.match(
        text,
        key,
        `${surface} must carry ${what} (ADR 0025 mirror registry, #1603). Correct this row to ` +
          'a sanctioned rewording, never drop the clause on one surface to make it pass',
      )
    }
  }
})

// (D36) THE EIGHT AUTHORING-SIDE-VERIFICATION GLOSSARY TERMS (plan 2026-08-24, Task 2.3) — each
// new CONTEXT.md entry restates doctrine whose canonical home is a war-strategy authoring
// surface (the interview doctrine, the strategy-verifier charter, or SKILL.md §2) — except the
// Evidence-artifacts-duty row, whose normative homes are the FILING surfaces and are bound here
// for the first time (#1652/#1676): ADR 0044's `### Evidence-duty home` section (the decision
// record), `/survey-corps` Step 0.3's issue template, and the clustered filing prompt's emission
// clause in `workflow-template.js`. That row shipped bound to the CONSUMPTION surface
// (plan-interview.md) with ONE generic section-name key, because its three normative homes landed
// a phase after the row — the recorded
// [[guard-duty-authored-in-an-earlier-phase-cannot-bind-a-normative-home-landing-in-a-later-phase]]
// lesson is this row's own history. The re-bind is what makes a deletion at any home red here.
// Per the recorded [[context-md-doctrine-mirror-can-land-without-a-skill-doc-contracts-drift-guard-row]]
// lesson a glossary mirror is guarded ONLY when its row is authored deliberately — these are
// those rows.
//
// Extraction is BY CONSTRUCT on BOTH sides (#1683 — D35's idiom; the canonical side was a
// whole-file scan until this task). Glossary side: the bolded term escaped, colon not required
// after the bold marker — exactly ONE of the eight headers carries a parenthesized token before
// its colon (`**Ratified-pin ledger** (`PIN-<n>`):`), a dated count measured at this task's base;
// the retired "two headers" claim was a miscount (#1653) — and every entry must span its own
// `_Avoid_` line (non-vacuity). Canonical side: each home names the SECTION, NUMBERED STEP or
// PROMPT LINE that owns the doctrine, and the extracted span is asserted strictly shorter than its
// file, so a construct regex that silently degrades into a whole-file match reds instead of
// greening a deleted clause.
//
// Keys are token-anchored `\s+`-wrapped `/…/i` forms. A key is MIRRORED by default — asserted on
// the glossary entry AND on its canonical span, so a one-sided edit reds. A key listed under
// `canonicalOnly` states procedure the glossary deliberately summarizes away (the glossary defines
// the term; the filing surfaces carry the steps) and is asserted on the canonical span alone —
// never dropped from that side to make a reword pass.
const D36_ROWS = [
  [
    'Run-history recon lane',
    [
      {
        name: 'references/plan-interview.md (Stage 0 — silent recon)',
        text: planInterviewMd,
        construct: /\*\*Stage 0 — silent recon\.\*\*[\s\S]*?(?=\n\*\*Stage 1)/,
        keys: [
          [/run\s+manifests/i, 'the run-manifests corpus class'],
          [/epic\s+phase\s+reports/i, 'the epic-phase-reports corpus class'],
          [/war-followup\s+corpus/i, 'the war-followup corpus class'],
          [/Evidence\s+artifacts[`*_]{0,4}\s+section/i, 'the issue-linked evidence-artifacts read'],
          [/fail-open/i, 'the fail-open posture'],
        ],
      },
    ],
  ],
  [
    'Strategy-verifier seat',
    [
      {
        // The charter's doctrine span — arming principle → refute charter → refute-flow bounds →
        // degraded modes, terminated at `## WAIVE semantics` (the WAIVE channel row's own home
        // below). The worked example and the leak-shape section sit outside it deliberately.
        name: 'references/strategy-verifier.md (arming principle → degraded modes)',
        text: verifierCharterMd,
        construct: /## The arming principle and its four arms[\s\S]*?(?=\n## WAIVE semantics)/,
        keys: [
          [/wrong\s+branch\s+surfaces\s+only\s+at\s+run\s+time/i, 'the arming principle sentence'],
          [/caught\s+by:/i, 'the `caught by:` half of the output contract'],
          [/NOTHING/, 'the `caught by: NOTHING` legal answer'],
          [/re-arms?\s+once/i, 'the amend-and-re-arm-once refute bound'],
          [/live\s+fork/i, 'the unresolved-refute = live-fork terminal'],
          [/corpus-empty/, 'the corpus-empty degraded stamp'],
          [/corpus-partial/, 'the corpus-partial degraded stamp'],
          [/unavailable/i, 'the unavailable degraded stamp'],
        ],
      },
    ],
  ],
  [
    'Ratified-pin ledger',
    [
      {
        name: 'references/plan-interview.md (## The ratified-pin ledger + the WAIVE channel)',
        text: planInterviewMd,
        construct: /## The ratified-pin ledger \+ the WAIVE channel[\s\S]*?(?=\n## )/,
        keys: [
          [
            /lands\s+in\s+the\s+artifact,\s+not\s+the\s+transcript/i,
            'the artifact-borne-state principle sentence (verbatim on both surfaces)',
          ],
          [/digits-only/i, 'the digits-only token grammar'],
          [/right-delimited/i, 'the right-delimited match rule'],
          [/letter\s+suffixes/i, 'the no-letter-suffixes rule'],
          [/landing-class\s+cell/i, 'the per-pin landing-class cell'],
          [/single-class\s+cell\s+covers\s+all\s+row\s+pins/i, 'the single-class-cell coverage rule'],
          [/enumerate-aloud/i, "gate 1's enumerate-aloud hard half of the inseparable pair"],
        ],
      },
    ],
  ],
  [
    'WAIVE channel',
    [
      {
        name: 'references/strategy-verifier.md (## WAIVE semantics)',
        text: verifierCharterMd,
        construct: /## WAIVE semantics \(the skip channel\)[\s\S]*?(?=\n## )/,
        keys: [
          [/operator\s+utterances/i, 'the skips-are-operator-utterances rule'],
          [/fired\s+arm/i, 'the fired-arming-arm row field'],
          [/armed-by-rule\s+unwaived/i, 'the AFK armed-by-rule-unwaived statement'],
          [/defect/i, 'the WAIVE-row-in-an-AFK-plan-is-a-defect consequence'],
          [/waive-rate-per-arm/i, 'the /war-review telemetry consumer'],
        ],
      },
    ],
  ],
  [
    // The re-bind (#1652/#1676): three normative homes, one row. The consumption surface
    // (plan-interview.md) is NOT read here — it is the **Run-history recon lane** row's home, and
    // binding the filing-side duty to it is what left the duty guarded by a single generic key.
    'Evidence-artifacts duty',
    [
      {
        name: 'docs/adr/0044 (### Evidence-duty home)',
        text: adr0044,
        construct: /### Evidence-duty home[\s\S]*?(?=\n#{2,3} )/,
        keys: [
          [/Evidence\s+artifacts[`*_]{0,4}\s+section/i, 'the `## Evidence artifacts` section name'],
          [/survey-corps/, 'the /survey-corps issue-template home'],
          [/clustered\s+filing\s+prompt/i, "the /war clustered filing prompt's emission home"],
          [/amendment\s+records\s+the\s+decision/i, 'the ADR-records-the-decision division of labour'],
        ],
        canonicalOnly: [
          [
            /normative\s+where\s+their\s+authors\s+actually\s+work/i,
            'the evidence-duty-home rule (an ADR-only duty is invisible to every producer it binds)',
          ],
        ],
      },
      {
        name: 'skills/survey-corps/SKILL.md (Step 0.3 item 3 — Draft the issue)',
        text: surveyCorpsSkillMd,
        construct: /^3\. \*\*Draft the issue\.\*\*[\s\S]*?(?=\n\d+\. \*\*|\n## )/m,
        keys: [
          [/Evidence\s+artifacts[`*_]{0,4}\s+section/i, 'the required `## Evidence artifacts` section'],
          [/named\s+gap/i, 'the consumed-issue-without-the-section named gap'],
          [/never\s+a\s+blocker/i, 'the never-a-blocker consequence of that gap'],
        ],
        canonicalOnly: [
          [/never\s+empty/i, 'the never-empty rule (no readable evidence means the draft says why)'],
        ],
      },
      {
        // A one-line construct (D31's lead-in idiom): the emission clause is one `pt` template
        // line inside the file-followups dispatch, and the span assert below proves the extraction
        // narrowed to it rather than reading the whole engine template.
        name: 'skills/war/assets/workflow-template.js (clustered filing prompt — emission clause)',
        text: workflowTemplateSrc,
        construct: /^\s*\+ pt`EACH filed issue's body additionally ends with[^\n]*$/m,
        keys: [
          [/Evidence\s+artifacts[`*_\\]{0,4}\s+section/i, 'the `## Evidence artifacts` section name'],
        ],
        canonicalOnly: [
          [
            /ends\s+with\s+an\s+[\\`]{0,2}##\s+Evidence\s+artifacts/i,
            'the ends-with-the-section mandate on each filed issue body',
          ],
          [
            /copied\s+verbatim\s+from\s+the\s+candidate\s+rows/i,
            'the values-copied-verbatim rule (the filing agent never reconstructs evidence)',
          ],
        ],
      },
    ],
  ],
  [
    'Evidence consumed block',
    [
      {
        name: 'references/plan-interview.md (Stage 0 lane 2 — the run-history recon lane bullet)',
        text: planInterviewMd,
        construct: /^2\. \*\*The run-history recon lane\*\*[\s\S]*?(?=\n\d+\. \*\*|\n\n)/m,
        keys: [
          [/one\s+row\s+per\s+linked\s+artifact/i, 'the one-row-per-artifact form'],
          [/unread-with-reason/i, 'the read-or-unread-with-reason arm'],
          [/never\s+a\s+new\s+required\s+H2/i, 'the never-a-new-required-H2 law'],
        ],
      },
    ],
  ],
  [
    'Omittability probe',
    [
      {
        name: 'references/plan-interview.md (Stage 1 falsifier list — the omittability-probe bullet)',
        text: planInterviewMd,
        construct: /^- \*\*the omittability probe\*\*[\s\S]*?(?=\n- \*\*|\n\n)/m,
        keys: [
          [/omit\s+it\s+silently/i, 'the could-the-run-omit-it-silently question'],
          [/no\s+check\s+at\s+all/i, 'the outcome-with-no-check-at-all contrast'],
          [/delete-the-feature/i, "the delete-the-feature probe (the probe's dual)"],
        ],
      },
    ],
  ],
  [
    'Oracle duality',
    [
      {
        name: 'skills/war-strategy/SKILL.md §2 (the oracle-duality bullet)',
        text: warStrategySkillMd,
        construct: /^- \*\*Oracle duality \(#1628\):\*\*[\s\S]*?(?=\n- \*\*|\n## )/m,
        keys: [
          [/decisive\s+printed\s+token/i, 'the decisive-printed-token requirement'],
          [/exit\s+status/i, 'the in-addition-to-exit-status clause'],
          [/single-signal-oracle/i, "the advisory lint's single-signal-oracle rule name"],
        ],
      },
    ],
  ],
]
test('D36 — the eight authoring-side-verification CONTEXT.md glossary terms mirror their canonical war-strategy surfaces', () => {
  for (const [term, canonicals] of D36_ROWS) {
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = contextMd.match(
      new RegExp(`^\\*\\*${t}\\*\\*[\\s\\S]*?(?=\\n\\*\\*[^\\n*]+\\*\\*|\\n### )`, 'm'),
    )
    assert.ok(
      block,
      `could not locate the \`**${term}**\` glossary entry in CONTEXT.md (bolded term → next ` +
        'bolded term or `###` heading) — the extraction construct rotted',
    )
    assert.match(
      norm(block[0]),
      /_Avoid_/,
      `the extracted **${term}** entry must span its \`_Avoid_\` line — extraction truncated`,
    )
    const mirror = norm(block[0])
    for (const { name, text, construct, keys, canonicalOnly = [] } of canonicals) {
      const span = text.match(construct)
      assert.ok(
        span,
        `could not locate the canonical construct for **${term}** in ${name} ` +
          `(${construct}) — the extraction construct rotted; re-anchor BOTH surfaces together`,
      )
      // Non-vacuity of the narrowing itself (#1683): a construct that matched the whole file would
      // reinstate the whole-file scan this row replaced, silently.
      assert.ok(
        span[0].length > 0 && span[0].length < text.length,
        `the canonical construct for **${term}** in ${name} extracted the whole file (or nothing) ` +
          '— the span must be a proper construct, never a whole-file scan',
      )
      const canonical = norm(span[0])
      for (const [key, what] of keys) {
        for (const [surface, textUnderTest] of [
          [`CONTEXT.md **${term}** entry (mirror)`, mirror],
          [`${name} (canonical home)`, canonical],
        ]) {
          assert.match(
            textUnderTest,
            key,
            `${surface} must carry ${what} (ADR 0025 mirror registry). Correct this row to a ` +
              'sanctioned rewording, never drop the clause on one surface to make it pass',
          )
        }
      }
      for (const [key, what] of canonicalOnly) {
        assert.match(
          canonical,
          key,
          `${name} (canonical home, **${term}**) must carry ${what} — the glossary summarizes it ` +
            'away by design, so this surface is its only anchor; correct this row to a sanctioned ' +
            'rewording, never drop the clause to make it pass',
        )
      }
    }
  }
})

// ── Ask-disposition rows (#1550; plan 2026-08-25-ask-disposition, Task 2.3) ──────────────────────
//
// DISCOVERED-GUARD CENSUS (D6 · PIN-6 · PIN-8), run at this task's base (the phase-2 integration
// tip) over the grep surface `**/*.test.mjs` + `**/*.test.sh` + `.tours/`, domain = guards
// anchored on the passages this task edits (CONTEXT.md **Disposition** / **Adjudication** /
// **Clean handoff** + the new glossary region; the CLAUDE.md Known-traps disposition bullet).
// Found (four-sentence floor): (1) D19 in this suite anchors the **Adjudication** `_Avoid_`
// provenance clause — extended in place by D19a above, same commit as the widening. (2)
// prompt-surface-budgets.test.mjs carries the CONTEXT.md (126,976 B) and CLAUDE.md (16,384 B)
// hard ceilings — D12's budget arbiter, exercised by this task's Done-when. (3) Tour step 2
// anchors CONTEXT.md at the Container/Contents heading — outside the edited region, retyped
// pattern-only by Task 2.5 and pinned in D39 below. (4) No `.test.sh` surface anchors any touched
// passage (refinery-surface, war-pipeline-structure, and lessons-learned-doc-contract read other
// regions — verified by token grep at base); the doc-cli-consistency and war-config `.test.mjs`
// suites were also read and likewise anchor other regions. Survey-derived
// straggler, listed per the slice: workflow-template.test.mjs's 'handoff block (criterion 6)'
// test TITLE still enumerates the pre-widening seven-key handoff literal `{ tipSha, polish,
// absorbed, followUps, notes, endState, intentPresent }` — title prose only (its assertions are
// per-key and the ninth key is additive by guardrail: no exact-key validator exists), and its
// home is the engine suite outside this task's Files list.

// (D37) THE SEVEN ASK-DISPOSITION GLOSSARY TERMS — each new CONTEXT.md entry restates doctrine
// whose canonical home is the ADR 0013 dated amendment (the decision record), the SKILL.md
// Checkpoint (the ruling-gate duties), or war-review's SKILL.md (the grind-measurement rows).
// Per the recorded [[context-md-doctrine-mirror-can-land-without-a-skill-doc-contracts-drift-guard-row]]
// lesson a glossary mirror is guarded ONLY when its row is authored deliberately — these are those
// rows, landing beside the mirrors' own task wave. D36's extraction idiom (term escaped, colon not
// required — several headers carry a parenthesized token before it); every entry must span its own
// `_Avoid_` line (non-vacuity); keys are token-anchored `\s+`-wrapped `/…/i` forms asserted on
// BOTH surfaces so sanctioned rewording latitude never false-reds and a one-sided edit reds. The
// two SKILL.md-homed terms assert their canonical half against the ASK-RULING-GATE BULLET itself
// (#1705), not the whole file and not the `## Checkpoint` region D41 extracts. The region was the
// row's first narrowing and it is not enough: the region's SIBLING follow-up-filing-floor bullet
// carries `consolidation` and the `file-followups` dispatch token, so the two Never-filed-unruled
// keys that name them pass with the ask-ruling-gate bullet DELETED — measured by scratch deletion
// at this task's base, not assumed. SKILL.md keeps one Checkpoint bullet per physical line, so the
// bullet is taken as the single line carrying the `**Ask ruling gate` bold lead-in, uniqueness
// asserted (D31's lead-in idiom). Whole-file keys are worse again: /absolute/i matches Gate-2's
// absolute `memoryLocalRoot` and /consolidation/i the filing floor.
test('D37 — the seven ask-disposition CONTEXT.md glossary terms mirror their canonical homes (#1550)', () => {
  const checkpoint = skillMd.match(/^## Checkpoint[\s\S]*?(?=\n## )/m)
  assert.ok(
    checkpoint,
    'could not locate the `## Checkpoint` section in SKILL.md — construct rotted (D41 shares ' +
      'this extraction)',
  )
  // #1705: narrow from the region to the bullet that actually owns the two duties.
  const askGateLines = checkpoint[0].split('\n').filter((l) => l.includes('**Ask ruling gate'))
  assert.equal(
    askGateLines.length,
    1,
    'expected exactly one `**Ask ruling gate` lead-in line in the SKILL.md `## Checkpoint` ' +
      `region, found ${askGateLines.length} — the extraction construct rotted (the bullet moved ` +
      'out of Checkpoint, was duplicated, split across lines, or the lead-in was reworded)',
  )
  const askGate = askGateLines[0]
  for (const [term, canonicalName, canonicalText, keys] of [
    [
      'Ask disposition',
      'docs/adr/0013 (2026-08-25 amendment)',
      adr0013,
      [
        [/Minor\/Nit-only/i, 'the Minor/Nit-only scope'],
        [/by\s+construction/i, 'the by-construction basis of that scope'],
        [/severity\s+filter/i, 'the severity-filter reachability argument'],
        [/blockingOf/, 'the Critical/Major `blockingOf` contrast'],
        [/question\s+\+\s+fork/i, 'the mandatory question + fork field'],
      ],
    ],
    [
      'asks[] channel',
      'docs/adr/0013 (2026-08-25 amendment)',
      adr0013,
      [
        [/asks\[\]/, 'the `asks[]` record itself'],
        [/beside\s+`?minorsFiled`?/i, 'the beside-`minorsFiled` return placement'],
        [/lossy\s+ninth/i, 'the lossy ninth handoff key'],
        [/never\s+a\s+throw/i, "the demote() refusal's never-a-throw arm"],
        [/destroy\s+the\s+parked\s+records/i, 'the throw-would-destroy-the-parked-records rationale'],
      ],
    ],
    [
      'Ruled / unruled ask',
      'docs/adr/0013 (2026-08-25 amendment)',
      adr0013,
      [
        [/Lead-side/i, 'the ruled-ask Lead-side filing site'],
        [/filing\s+parity/i, 'the filing-parity duty'],
        [/dedup\s+against\s+engine-filed\s+rows/i, 'the dedup-against-engine-filed-rows half of parity'],
        [/adjudications?`?\s+rows?/i, 'the ruling-minted-as-adjudication-row contract'],
      ],
    ],
    [
      'Never-filed-unruled',
      'skills/war/SKILL.md (the ask-ruling-gate bullet)',
      askGate,
      [
        [/unruled\s+ask/i, 'the unruled-ask subject'],
        [/consolidation/i, 'the consolidation exclusion'],
        [/file-followups`?\s+dispatch/i, 'the file-followups-dispatch exclusion'],
        [/never\s+re-adds\s+one/i, 'the Lead-never-re-adds-one clause'],
      ],
    ],
    [
      'Strike-list ruling gate',
      'skills/war/SKILL.md (the ask-ruling-gate bullet)',
      askGate,
      [
        [/parked\s+asks\s+in\s+a\s+single\s+pass/i, 'the one-gate-single-pass form'],
        [/absolute/i, 'the absolute advance floor'],
        [/over\s+an\s+unruled\s+ask/i, 'the never-advance-over-an-unruled-ask floor statement'],
        [/hard\s+wait/i, "the floor's interactive binding (a hard wait)"],
        [/demotes?\s+to\s+follow-up\s+with\s+the\s+question\s+preserved/i, 'the `--afk` no-match demotion arm'],
        [/suppression\s+rows?\s+(?:is|are)\s+minted/i, 'the suppression-row minting rule'],
        [/operator\s+ruling/i, "the suppression rule's operator-ruling-only provenance"],
      ],
    ],
    [
      'Grind measurement',
      'skills/war-review/SKILL.md (grind-measurement row)',
      warReviewSkillMd,
      [
        [/phases\[\]\.dispatches\.fixRounds/, 'the terminal fixRounds source'],
        [/audit-round/i, "the filing site's audit-round field source"],
        [/`?minorsFiled`?\s+rationales/i, 'the `minorsFiled` rationales source'],
        [/round-level\s+attribution\s+does\s+not\s+exist/i, 'the named coarseness'],
      ],
    ],
    [
      'Failure-routing asymmetry',
      'skills/war-review/SKILL.md (grind-measurement row)',
      warReviewSkillMd,
      [
        [/#1664/, 'the tracked refinement issue'],
        [/instrumentation-first/i, 'the instrumentation-first routing arm'],
        [/per-round\s+`?auditLog`?\s+row/i, 'the per-round auditLog refinement shape'],
        [/no\s+grinding/i, 'the never-a-silent-"no grinding" contrast'],
      ],
    ],
  ]) {
    const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = contextMd.match(
      new RegExp(`^\\*\\*${t}\\*\\*[\\s\\S]*?(?=\\n\\*\\*[^\\n*]+\\*\\*|\\n### )`, 'm'),
    )
    assert.ok(
      block,
      `could not locate the \`**${term}**\` glossary entry in CONTEXT.md (bolded term → next ` +
        'bolded term or `###` heading) — the extraction construct rotted',
    )
    assert.match(
      norm(block[0]),
      /_Avoid_/,
      `the extracted **${term}** entry must span its \`_Avoid_\` line — extraction truncated`,
    )
    for (const [key, what] of keys) {
      for (const [surface, text] of [
        [`CONTEXT.md **${term}** entry (mirror)`, norm(block[0])],
        [`${canonicalName} (canonical home)`, norm(canonicalText)],
      ]) {
        assert.match(
          text,
          key,
          `${surface} must carry ${what} (ADR 0025 mirror registry, #1550). Correct this row to ` +
            'a sanctioned rewording, never drop the clause on one surface to make it pass',
        )
      }
    }
  }
})

// (D37a) THE WIDENED PRE-EXISTING ENTRIES (D6 discovery sites) — CONTEXT.md's **Disposition** and
// **Clean handoff** entries and the CLAUDE.md Known-traps disposition bullet predate #1550 and were
// widened in place by this task; the D6 census records them as sitting OUTSIDE every discovered
// guard surface, so without this row End state 9's named check is green whether the widenings are
// present or reverted. Same idiom as D19a/D37: extraction BY CONSTRUCT with a tail non-vacuity
// assert, widened-form keys, and OLD-absent closed-phrasing keys (each closed literal verified
// present at the plan's implementation base `a60221a` and retired by this task — the absence
// asserts guard against a revert, never a never-present value; PIN-8).
test('D37a — the widened **Disposition**/**Clean handoff** entries and the CLAUDE.md Known-traps bullet carry the four-member shapes, closed phrasings retired (#1550)', () => {
  // CONTEXT.md **Disposition** — four-member header, the in-diff absorb default with its ask-only
  // never-a-default tail (re-keyed by plan 2026-09-03-in-band-absorb-default Task 3.2 from the
  // retired `absorb` and `ask` are never defaults pair; the old-default-absent row guards the pair
  // absent), demote() ask refusal.
  const disposition = contextMd.match(/^\*\*Disposition\*\*[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m)
  assert.ok(
    disposition,
    'could not locate the `**Disposition**` glossary entry in CONTEXT.md (bolded term → next ' +
      'bolded term or `###` heading) — the extraction construct rotted',
  )
  const d = norm(disposition[0])
  assert.match(
    d,
    /_Avoid_/,
    'the extracted **Disposition** entry must span its `_Avoid_` line — extraction truncated',
  )
  for (const [re, what] of [
    [/\(`absorb` \| `follow-up` \| `note` \| `ask`\)/, 'the four-member header'],
    [/fully specified Minor\/Nit defaults to `absorb`/, 'the in-diff absorb default'],
    [/`follow-up` needs a tag from the \*\*Barrier list\*\*/, 'the barrier-list cross-reference'],
    [/`ask` is never a default/, 'the ask-only never-a-default tail'],
    [/`demote\(\)`\s+refuses\s+an\s+ask/i, "the demote() ask refusal"],
    [/re-route\s+onto\s+`asks\[\]`/i, "the refusal's re-route-onto-`asks[]` arm"],
  ]) {
    assert.match(
      d,
      re,
      `the CONTEXT.md **Disposition** entry must carry ${what} (#1550). Correct this row to a ` +
        'sanctioned rewording, never drop the widening to make it pass',
    )
  }
  // CONTEXT.md **Clean handoff** — the ninth `asks` key inside the 9-key handoff list, and the
  // parked-ask disposal arm.
  const handoff = contextMd.match(/^\*\*Clean handoff\*\*[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m)
  assert.ok(
    handoff,
    'could not locate the `**Clean handoff**` glossary entry in CONTEXT.md — the extraction ' +
      'construct rotted',
  )
  const h = norm(handoff[0])
  assert.match(
    h,
    /_Avoid_/,
    'the extracted **Clean handoff** entry must span its `_Avoid_` line — extraction truncated',
  )
  assert.match(
    h,
    /\{ tipSha, polish, absorbed, followUps, asks, notes, endState, intentPresent, backstops \}/,
    'the **Clean handoff** entry must render the 9-key handoff list with `asks` fifth (#1550)',
  )
  assert.match(
    h,
    /parked\s+as\s+an\s+ask\s+\(question\s+\+\s+fork/i,
    'the **Clean handoff** entry must carry the parked-ask (question + fork) disposal arm (#1550)',
  )
  // CLAUDE.md Known-traps disposition bullet — the four-member set + never-filed-unruled.
  const bullet = claudeMd.match(/^- Findings route by auditor-owned `disposition`.*$/m)
  assert.ok(
    bullet,
    'could not locate the Known-traps disposition bullet in CLAUDE.md (the `- Findings route by ' +
      'auditor-owned `disposition`` construct) — the extraction construct rotted',
  )
  const b = norm(bullet[0])
  assert.match(
    b,
    /ADR 0017/,
    'the extracted Known-traps bullet must span through its ADR 0017 tail — extraction truncated',
  )
  for (const [re, what] of [
    [/`absorb`\/`follow-up`\/`note`\/`ask`/, 'the four-member set'],
    [/fully specified Minor\/Nit defaults to `absorb`/, 'the in-diff absorb default'],
    [/`follow-up` needs a `barrier` tag/, 'the barrier-tag clause'],
    [/`ask` is never a default/, 'the ask-only never-a-default tail'],
    [/unruled `ask` is never filed/i, 'the never-filed-unruled law'],
    [/Checkpoint strike-list gate/i, 'the strike-list ruling site'],
  ]) {
    assert.match(
      b,
      re,
      `the CLAUDE.md Known-traps disposition bullet must carry ${what} (#1550). Correct this ` +
        'row to a sanctioned rewording, never drop the widening to make it pass',
    )
  }
  // OLD-absent closed phrasings (verified present at the plan base `a60221a`, retired by this
  // task; the asserts guard against a revert — PIN-8).
  assert.ok(
    !/\(`absorb` \| `follow-up` \| `note`\):/.test(contextMd),
    'the retired three-member **Disposition** header `(`absorb` | `follow-up` | `note`):` must ' +
      'be gone from CONTEXT.md (OLD-absent; PIN-8)',
  )
  assert.ok(
    !/`absorb` is never a default/.test(norm(contextMd)),
    'the retired singular `absorb` is never a default literal must be gone from CONTEXT.md — ' +
      'the current wording reads a fully specified Minor/Nit defaults to `absorb`; `ask` is ' +
      'never a default, which shares no substring with the retired form (OLD-absent, ' +
      'norm()-surface: the base literal wrapped across lines; PIN-8)',
  )
  assert.ok(
    !/followUps, notes/.test(norm(contextMd)),
    'the retired 8-key handoff-list fragment `followUps, notes` must be gone from CONTEXT.md — ' +
      'the ninth `asks` key sits between them (OLD-absent; PIN-8)',
  )
  assert.ok(
    !/`absorb`\/`follow-up`\/`note`\)/.test(claudeMd),
    'the retired three-member set `(`absorb`/`follow-up`/`note`)` must be gone from CLAUDE.md ' +
      '(OLD-absent; PIN-8)',
  )
})

// (D38) THE ADR 0013 DATED AMENDMENT + THE ADR 0012 CROSS-REF (D5 · PIN-6), D23's idiom: the
// correction channel is one dated append-only amendment, never a retro-edit of ratified body text.
// Extraction is BY CONSTRUCT — the 2026-08-25 amendment heading to the NEXT H2 (or EOF), so a
// later appended amendment cannot satisfy a key on the guarded amendment's behalf (sibling
// amendments carry the same byte-discipline closing sentence, so an EOF-bound or whole-file key
// could not tell a deleted amendment apart). The Status currency line is asserted separately.
test('D38 — ADR 0013 carries the dated 2026-08-25 ask-disposition amendment and ADR 0012 the cross-ref (#1550)', () => {
  const block = adr0013.match(/^## Amendment \(2026-08-25\)(?:(?!\n## )[\s\S])*/m)
  assert.ok(
    block,
    'could not locate the `## Amendment (2026-08-25)` heading in ADR 0013 — the extraction ' +
      'construct rotted (or the amendment was removed: it is append-only, restore it)',
  )
  const b = norm(block[0])
  for (const [re, what] of [
    [/fourth\s+disposition\s+member/i, 'the fourth-member widening'],
    [/Minor\/Nit-only/i, 'the Minor/Nit-only scope in plain sight (PIN-5)'],
    [/Never\s+filed\s+unruled/i, 'the never-filed-unruled law'],
    [/absolute\s+advance\s+floor/i, 'the absolute advance floor'],
    [/strike-list\s+gate/i, 'the one Checkpoint strike-list gate'],
    [/two\s+→\s+three/, 'the adjudication producer widening two → three'],
    [/#1664/, 'the channel-2 deferral tracker'],
    [/backstop-dependent/i, "the roundLimit=6 justification's backstop dependence"],
    [/pre-existing body text above/i, 'the byte-discipline closing sentence (append-only law)'],
  ]) {
    assert.match(
      b,
      re,
      `the ADR 0013 2026-08-25 amendment must record ${what}. Correct this row to a sanctioned ` +
        'rewording of the amendment, never delete it to make a reword pass',
    )
  }
  assert.match(
    norm(adr0013.slice(0, adr0013.indexOf('## Amendment'))),
    /amended\s+2026-08-25/i,
    "ADR 0013's Status currency line must name the 2026-08-25 amendment (the D23 precedent: the " +
      'status line and the amendment land together)',
  )
  const xref = adr0012.match(/^\*Cross-reference \(2026-08-25\):[^\n]*$/m)
  assert.ok(
    xref,
    'ADR 0012 must carry the one-line 2026-08-25 cross-reference (its line-90 style) — the ' +
      'extraction construct rotted or the line was dropped',
  )
  assert.match(
    xref[0],
    /0013-commanders-intent-and-disposition-routing\.md/,
    "the ADR 0012 cross-ref must link ADR 0013's file (the 0012↔0013 cross-ref guardrail, PIN-6)",
  )
})

// (D39) THE TOUR ARM (D10 · PIN-10) — tour step 8 is retyped to the disposition world, and every
// step Task 2.5 touched (steps 2, 4, 8 — located by title construct, never index) carries a
// pattern-only anchor: the installed player resolves `line` before `pattern`, so a raw `line` key
// beside a pattern is not decorative but actively re-rots the anchor; files under same-phase
// sibling edit are unsatisfiable at any base and are pattern-only by construction.
test('D39 — tour step 8 is retyped to the disposition ladder; touched steps carry pattern-only anchors (#1550, D10)', () => {
  const touched = [
    [/^2 ·/, 'CONTEXT.md'],
    [/^4 ·/, 'skills/war/SKILL.md'],
    [/^8 ·/, 'skills/war/assets/workflow-template.js'],
  ]
  for (const [titleRe, file] of touched) {
    const step = tour.steps.find((s) => titleRe.test(s.title || ''))
    assert.ok(step, `could not find the tour step titled ${titleRe} — the title construct rotted`)
    assert.equal(step.file, file, `the ${titleRe} step must anchor into ${file}`)
    assert.equal(
      typeof step.pattern,
      'string',
      `the ${titleRe} step must carry a \`pattern\` anchor (D10 — pattern-only is the only protecting form)`,
    )
    assert.ok(
      !('line' in step),
      `the ${titleRe} step must NOT carry a raw \`line\` key — the player resolves line before pattern (D10)`,
    )
  }
  const step8 = tour.steps.find((s) => /^8 ·/.test(s.title || ''))
  assert.match(step8.pattern, /dispositionOf/, "step 8's pattern must anchor on `dispositionOf`")
  for (const [re, what] of [
    [/four-member/i, 'the four-member ladder'],
    [/precedes\s+the\s+absorb\s+chain/i, 'the ask-arm-precedes-absorb-chain order'],
    [/parkAsk/, 'the parkAsk parking mechanism'],
    [/question\s+\+\s+fork/i, 'the question + fork record'],
    [/strike-list/i, 'the Checkpoint strike-list gate'],
    [/never\s+filed\s+unruled/i, 'the never-filed-unruled law'],
    [/refuses?\W{1,3}an\s+ask/i, "demote()'s ask refusal"],
  ]) {
    assert.match(
      norm(step8.description),
      re,
      `tour step 8 must narrate ${what} (the disposition-world retype, #1550)`,
    )
  }
})

// (D40) SCHEMAS.MD ENUM-LINE PINS (D6 CLASS-1/CLASS-2) — the audit-outcome disposition enum line,
// the mandatory `ask` field row, the top-level `asks` return row, the ninth handoff `asks` row
// (ADDITIVE — no exact-key validator exists or is introduced, PIN-13), the widened
// GitHub-conventions routing sentence, and the Three-producers adjudications paragraph. OLD-absent
// keys cite literals verified present at the plan's implementation base `a60221a` and retired at
// this task's base by merged dep Task 2.2 — each absence assert guards against a revert of that
// widening, never a never-present value (PIN-8): the pre-widening enum tail
// `"note" — auditor-owned` and the `**Two producers**` count literal.
//
// The never-filed-unruled key is CONSTRUCT-SCOPED (#1706), not whole-file: the phrase has TWO
// carriers in schemas.md — the `## GitHub conventions` routing bullet this row means, and the
// AuditVerdict `ask?` field comment far above it — so a whole-file key passes with the named
// GitHub-conventions clause deleted (measured by scratch deletion at this task's base, not
// assumed). The bullet is one physical line, extracted by its
// `- **Minor/Nit** findings route by **disposition**` lead-in.
test('D40 — schemas.md carries the widened enum/field/return/handoff/producer shapes, old literals retired (#1550)', () => {
  const routingBullet = schemasMd.match(
    /^- \*\*Minor\/Nit\*\* findings route by \*\*disposition\*\*[^\n]*$/m,
  )
  assert.ok(
    routingBullet,
    'could not locate the `## GitHub conventions` disposition-routing bullet in ' +
      'references/schemas.md (`- **Minor/Nit** findings route by **disposition**` lead-in) — the ' +
      'extraction construct rotted',
  )
  for (const [re, what] of [
    [/"absorb"\|"follow-up"\|"note"\|"ask"/, 'the four-member disposition enum comment'],
    [/ask\?,\s+\/\/ \{ question, fork \} — MANDATORY on a disposition:'ask' finding/, 'the mandatory ask field row (question+fork)'],
    [/asks: \[ \{ task, seat, sha, question, fork, finding \} \]/, 'the top-level return `asks` row (full finding kept)'],
    [/asks: \[ \{ task, seat, sha, question, fork \} \]/, 'the handoff ninth `asks` row (lossy projection)'],
    [/NINTH handoff key, ADDITIVE/, "the ninth key's additive law (no exact-key validator)"],
    [/refuses an ask/i, "demote()'s ask refusal in the routing sentence"],
    [/Three producers/i, 'the widened Three-producers adjudications paragraph'],
  ]) {
    assert.match(
      schemasMd,
      re,
      `references/schemas.md must carry ${what} (#1550). Correct this row to a sanctioned ` +
        'rewording, never drop the shape on this surface to make it pass',
    )
  }
  assert.match(
    routingBullet[0],
    /never filed unruled/i,
    'the `## GitHub conventions` disposition-routing bullet must carry the never-filed-unruled ' +
      'clause (#1550, #1706) — scoped to this bullet because the AuditVerdict `ask?` field comment ' +
      'carries the same phrase; correct this row to a sanctioned rewording, never widen the key ' +
      'back to the whole file to make it pass',
  )
  for (const [re, what] of [
    [/"note" — auditor-owned/, 'the pre-widening three-member enum tail'],
    [/\*\*Two producers\*\*/, 'the pre-widening producer count literal'],
  ]) {
    assert.ok(
      !re.test(schemasMd),
      `the retired literal ${re} (${what}) must be gone from references/schemas.md — OLD-absent, ` +
        'cited from the ask-disposition task base (PIN-8)',
    )
  }
})

// (D41) SKILL.MD CHECKPOINT + DECOMPOSE PINS (Task 2.1's duties, rule-7 deps edge) — the
// handoff-render pin covers the NINE-entry ORDER, not membership alone (D6: the `asks` entry sits
// in the operator-action cluster, adjacent to the follow-ups row; `Unexecuted backstops` renders
// as the mandatory ninth line after the parenthesized block); the ask ruling gate carries the
// absolute floor with its interactive binding, filing parity, and the `--afk` posture; the
// Decompose step-5 producer sentence is widened at BOTH edit sites (D5). OLD-absent keys cite
// literals verified present at the plan's implementation base `a60221a` and retired at this task's
// base by merged dep Task 2.1 — the absence asserts guard against a revert of that widening, never
// a never-present value (PIN-8): `the two producers above` and `` `absorb` is never defaulted ``.
// This test also carries the #1708 own-gh-write routing arm for the region's TWO Lead-side filing
// sites (the ask ruling gate and the sibling follow-up filing floor), pinned per bullet with its
// own OLD-absent literal — see the block comment beside it.
test('D41 — SKILL.md Checkpoint renders the 9-key handoff order and the ask ruling gate; Decompose producers widened at both sites (#1550)', () => {
  const checkpoint = skillMd.match(/^## Checkpoint[\s\S]*?(?=\n## )/m)
  assert.ok(checkpoint, 'could not locate the `## Checkpoint` section in SKILL.md — construct rotted')
  const cp = norm(checkpoint[0])
  // The 9-entry render ORDER — strictly monotonic positions, so a membership-only reshuffle reds.
  const ORDER = [
    'tipSha',
    'polish',
    'absorbed',
    'follow-ups filed',
    'asks parked',
    'notes',
    'End-state condition statuses',
    'intentPresent',
    'Unexecuted backstops',
  ]
  let last = -1
  for (const entry of ORDER) {
    const at = cp.indexOf(entry)
    assert.ok(at > last, `the Checkpoint handoff render must carry \`${entry}\` AFTER its predecessor — the 9-entry order is pinned (asks in the operator-action cluster, adjacent to the follow-ups row; D6)`)
    last = at
  }
  for (const [re, what] of [
    [/Ask ruling gate/i, 'the ask ruling gate bullet'],
    [/one gate rules all parked asks in a single pass/i, 'the one-gate single-pass form'],
    [/absolute/i, 'the absolute advance floor'],
    [/hard wait/i, 'the interactive binding (a hard wait)'],
    [/no severity, count, or staleness exception/i, 'the no-exception clause'],
    [/Ruled-ask filing parity/i, 'the filing-parity duty'],
    [/Evidence artifacts/i, "parity's Evidence-artifacts section"],
    [/third producer/i, 'the ruling-minted-as-third-producer clause'],
    [/never re-adds one/i, 'the Lead-never-re-adds-one clause'],
    [/demotes to follow-up with the question preserved/i, 'the `--afk` no-match demotion arm'],
    [/provenance-marked/i, "the suppression row's provenance marking"],
  ]) {
    assert.match(cp, re, `the SKILL.md Checkpoint must carry ${what} (#1550, Task 2.1's duty pinned here per rule 7)`)
  }
  // (#1708) THE TWO LEAD-SIDE FILING SITES EACH EXECUTE AS THEIR OWN PREFLIGHTED gh-write, AFTER
  // the per-phase batch has closed — the ruled-ask filing site (this gate rules after that batch)
  // and the sibling follow-up filing floor (it fires at the Checkpoint, likewise after it). The
  // retired routing sent both writes INTO a batch that is already closed by the time either fires.
  // Extraction is PER BULLET, never region-wide: both bullets live in this same `## Checkpoint`
  // region and now share the `gh-write of its own` vocabulary, so a region key would match the
  // sibling and stay non-discriminating for the bullet it names (the recorded
  // [[region-scoped-drift-guard-can-stay-vacuous-when-a-sibling-construct-shares-vocabulary-in-the-same-region]]
  // lesson). Each extraction must span its own tail marker (D26's non-vacuity floor). The
  // OLD-absent key cites the retired literal `inside the preflighted per-phase gh-write batch`,
  // verified present TWICE at the plan's measurement base c8c22e5 and retired by this task — the
  // `## Per phase` section's own legitimate batch line reads `inside the same preflighted
  // per-phase gh-write batch` and is deliberately not matched (PIN-8).
  for (const [name, re, tail, tailWhat] of [
    ['the ask ruling gate bullet', /^- \*\*Ask ruling gate[\s\S]*?(?=\n- \*\*|\n## |$)/m, /never mints one/, 'its `--afk` suppression-row tail'],
    ['the follow-up filing floor bullet', /^- \*\*Follow-up filing floor[\s\S]*?(?=\n- \*\*|\n## |$)/m, /Never advance over a null/, 'its never-advance-over-a-null-issue tail'],
  ]) {
    const bullet = checkpoint[0].match(re)
    assert.ok(bullet, `could not locate ${name} in the \`## Checkpoint\` section — the extraction construct rotted (#1708)`)
    const b = norm(bullet[0])
    assert.match(b, tail, `the extracted ${name} must span ${tailWhat} — extraction truncated (non-vacuity floor)`)
    assert.match(
      b,
      /gh-write of its own/i,
      `${name} must route its Lead-side filing as its OWN gh-write, not into the per-phase batch (#1708)`,
    )
    assert.match(
      b,
      /gh-preflight\.sh/,
      `${name} must name its own \`gh-preflight.sh\` run — an own-site write carries no batch preflight (#1708)`,
    )
    assert.match(
      b,
      /(?:has already closed|has closed)/i,
      `${name} must state that the per-phase gh-write batch is already closed when this write fires (#1708)`,
    )
  }
  assert.ok(
    !/inside the preflighted per-phase gh-write batch/i.test(skillMd),
    'the retired `inside the preflighted per-phase gh-write batch` routing must be gone from ' +
      'SKILL.md (OLD-absent, base-verified at c8c22e5; the `## Per phase` batch line reads ' +
      '`inside the same preflighted per-phase gh-write batch` and is untouched; PIN-8, #1708)',
  )
  // Decompose step-5 producer widening — both edit sites of the one bullet (D5 · PIN-6).
  const s = norm(skillMd)
  assert.match(s, /the Checkpoint['’]s ask rulings/i, 'Decompose step 5 must enumerate the third producer (edit site 1)')
  assert.match(s, /three producers above/i, 'Decompose step 5 provenance discipline must count three producers (edit site 2)')
  assert.ok(!/two producers above/i.test(s), 'the retired `two producers above` literal must be gone from SKILL.md (OLD-absent, base-verified; PIN-8)')
  // The per-phase disposition sentence (the Audits bullet) — widened form, old default literal retired.
  assert.match(s, /decision-shaped Minor\/Nit only the operator can rule/i, 'the Audits bullet must carry the ask arm')
  // Re-keyed by plan 2026-09-03-in-band-absorb-default Task 3.2: the widened pair `absorb` and
  // `ask` are never defaulted retired with the in-diff absorb default (old-default-absent guards it).
  assert.match(s, /a fully specified one defaults to `absorb`, `phaseClose:true` outside the task diff/, 'the Audits bullet must carry the in-diff absorb default')
  assert.match(s, /needs a `barrier` tag/, 'the Audits bullet must carry the follow-up barrier-tag clause')
  assert.match(s, /`ask` is never a default/, 'the Audits bullet must carry the ask-only never-a-default tail')
  assert.ok(!/`absorb` is never defaulted/.test(s), 'the retired single-member `absorb` is never defaulted literal must be gone from SKILL.md (OLD-absent, base-verified; PIN-8)')
})

// (D42) TASK 2.2's REFERENCES SENTENCES (rule-7 deps edge) — design.md's row-7 enum and §18 ask
// clause, file-followups.md's ruled-ask parity text, the refiner card's parked-ask exclusion, and
// schemas.md's consolidation exclusion. OLD-absent cites the row-7 literal
// `absorb/follow-up/note — ADR 0013`, verified present at the plan's implementation base
// `a60221a` and retired at this task's base by merged dep Task 2.2 — the absence assert guards
// against a revert of that widening, never a never-present value (PIN-8).
test('D42 — the references mirrors carry the widened ask shapes; the closed row-7 literal is retired (#1550)', () => {
  for (const [name, text, re, what] of [
    ['references/design.md', designRefMd, /absorb\/follow-up\/note\/ask — ADR 0013, amended 2026-08-25/, 'the widened row-7 disposition enum with the amendment date'],
    ['references/design.md', designRefMd, /`ask` \(#1550, ADR 0013 amendment 2026-08-25/, "§18's ask clause with its provenance"],
    ['references/design.md', designRefMd, /refuses an ask/i, "§18's demote() ask-refusal clause"],
    ['references/design.md', designRefMd, /never filed unruled/i, "§18's never-filed-unruled law"],
    ['references/file-followups.md', fileFollowupsMd, /Ruled-ask filing parity/i, 'the canonical ruled-ask parity heading'],
    ['references/file-followups.md', fileFollowupsMd, /unruled ask is never filed/i, 'the never-filed-unruled statement'],
    ['references/file-followups.md', fileFollowupsMd, /Lead-side/, 'the ruled-ask Lead-side filing site'],
    ['agents/war-refiner.md', refinerCard, /a parked ask is never in the batch/i, "the file-followups dispatch's parked-ask exclusion"],
    ['references/schemas.md', schemasMd, /structurally excluded/i, "consolidation's structural asks exclusion"],
  ]) {
    assert.match(
      norm(text),
      re,
      `${name} must carry ${what} (#1550, Task 2.2's sentence pinned here per rule 7). Correct ` +
        'this row to a sanctioned rewording, never drop the clause to make it pass',
    )
  }
  assert.ok(
    !/absorb\/follow-up\/note — ADR 0013\)/.test(designRefMd),
    'the retired closed row-7 literal `absorb/follow-up/note — ADR 0013)` must be gone from ' +
      'references/design.md (OLD-absent, base-verified; PIN-8)',
  )
})

// (D43) THE RE-ENTRY / ABSORB-BUDGET BOUNDARY IN ITS THREE LIVING-DOC HOMES (#1812; plan
// 2026-08-27-in-run-finding-resolution, D10 · Task 3; re-keyed by plan
// 2026-09-03-in-band-absorb-default, D5 · Task 2.2). The 2026-08-27 ADR 0013 amendment retired the
// ace ladder's budget-exhaustion stop condition in favour of budget-bounded re-entry bounded by the
// floor-retry reserve; the 2026-09-03 amendment retired THAT reserve (`fixRounds < roundLimit − 2`)
// in favour of the per-task absorb budget (`absorbRounds < run.absorbRounds`, PIN-7). #1812's drift
// was silent precisely because NO row carried the token, so each flip ships the guard: this row
// binds the CURRENT boundary prose on every LIVING doc home — SKILL.md's `--ace` bullet,
// CONTEXT.md's **Ace bisection** glossary row, and design.md §18's disposition-routing bullet —
// plus the retired literals' absence on those same surfaces.
//
// THE ADR 0013 HOME IS DELIBERATELY EXEMPT, and the exemption is APPEND-ONLY-LAW-DERIVED, never
// oversight: the 2026-08-20 amendment's ratified clause ("the remainder demotes on budget
// exhaustion") and the 2026-08-27 amendment's currency clause (the floor-retry reserve) are
// historical law that survives byte-untouched by design, each superseded in *currency* by a dated
// note rather than edited. A blanket absence assert over the ADR would demand the very edit the
// append-only law forbids. So the exemption is not a hole: the final block below asserts BOTH
// sides of it — the historical clauses still present AND the dated supersession notes present —
// so deleting the history, or dropping the note that makes it readable as history, reds here.
//
// Extraction is BY CONSTRUCT on all three surfaces (the D35 idiom — never line numbers, which rot
// across the serial merge queue): the `--ace` bullet → next top-level `- **` bullet; the bolded
// glossary term → next bolded term or `###` heading; §18's disposition-routing bullet → next
// `- **` or `##` heading. Each extraction must span its own tail marker (D26's non-vacuity floor —
// a truncated extraction reds instead of trivially passing). Keys are token-anchored `/…/i` forms,
// not sentence bytes: sanctioned rewording latitude on any home must not false-red; a one-sided
// edit (one home re-authored, another left on the retired boundary) reds.
test('D43 — the re-entry / absorb-budget boundary is present in all three living-doc homes and the retired budget-exhaustion and reserve literals are gone (#1812; reserve-retired)', () => {
  const HOMES = [
    [
      'skills/war/SKILL.md `--ace` bullet',
      skillMd.match(/^ {2}- \*\*`--ace`[\s\S]*?(?=\n- \*\*)/m),
      '`  - **`--ace`` → next top-level `- **` bullet',
      [/Residual rule/, 'its `Residual rule:` tail'],
    ],
    [
      'CONTEXT.md **Ace bisection** glossary row',
      contextMd.match(/^\*\*Ace bisection\*\*:[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m),
      'bolded term → next bolded term or `###` heading',
      [/_Avoid_/, 'its `_Avoid_` line'],
    ],
    [
      'skills/war/references/design.md §18 disposition-routing bullet',
      designRefMd.match(/^- \*\*Disposition routing \(ADR 0013\)[\s\S]*?(?=\n- \*\*|\n## )/m),
      '`- **Disposition routing (ADR 0013)` → next `- **` or `##` heading',
      [/orchestrator backstop/, 'its orchestrator-backstop tail'],
    ],
  ]
  for (const [name, m, construct, [tail, tailWhat]] of HOMES) {
    assert.ok(m, `could not locate the ${name} (${construct}) — the extraction construct rotted`)
    const text = norm(m[0])
    assert.match(
      text,
      tail,
      `the extracted ${name} must span ${tailWhat} — extraction truncated (a short read would ` +
        'satisfy the keys below vacuously)',
    )
    for (const [key, what] of [
      [/absorb budget/i, 'the absorb-budget stop condition'],
      [/re-entry/i, 'the budget-bounded re-entry token'],
      [/absorbRounds\s*<\s*run\.absorbRounds/, 'the budget arithmetic (`absorbRounds < run.absorbRounds`)'],
      // The three token keys above are all satisfied by a re-entry sentence ALONE, so a home can
      // carry them while stating the ladder's OPPOSITE semantics for the bisection remainder. The
      // engine's arm (`aceBisect`: `if (r.task.absorbRounds >= absorbRounds) … routeToSweep(f, …)`
      // over the still-queued subsets) routes those subsets to the phase-close sweep as absorbs —
      // never `follow-up`, never a demotion (D5: only a subset that failed its own re-audit
      // demotes). This key binds that arm's route: the budget stop must be stated as sending the
      // still-queued/remaining subsets to the sweep, in either clause order.
      [
        /(subsets still queued|still-queued subsets|remaining subsets)[\s\S]{0,160}?sweep|sweep[\s\S]{0,160}?(subsets still queued|still-queued subsets|remaining subsets)/i,
        'the bisection budget-stop sweep route (a spent absorb budget mid-bisection sends the ' +
          'still-queued subsets to the sweep as absorbs — never demotes them)',
      ],
    ]) {
      assert.match(
        text,
        key,
        `${name} must carry ${what} (#1812, ADR 0013 amendment 2026-09-03). Correct this row to a ` +
          'sanctioned rewording, never drop the clause on one home to make it pass',
      )
    }
    // The retired reserve-stop demote route, construct-scoped: a home that still says the
    // still-queued subsets DEMOTE states the pre-2026-09-03 arm. The key is forward-only
    // (phrase, then `demote` within 60 chars). At this task's cut base it reds on two homes:
    // CONTEXT.md's "the remaining subsets demote to `follow-up`" and design.md's "the remaining
    // subsets demote straight to `follow-up`". SKILL.md's base placed `demote` AHEAD of the
    // phrase ("subsets demote (plus the subsets still queued when the floor-retry reserve stops
    // the ladder"), which this key does not match, so on SKILL.md it guards prospectively only
    // and the three positive keys above bind that home. Do not widen the key to the
    // `demote ... subsets still queued` direction: the re-authored SKILL.md bullet ("subsets
    // demote (subsets still queued at a spent budget ride to the sweep") would false-red.
    assert.ok(
      !/(subsets still queued|still-queued subsets|remaining subsets)[\s\S]{0,60}?demote/i.test(text),
      `${name} still states the retired reserve-stop demote arm (the still-queued subsets demote) — ` +
        'they ride to the sweep as absorbs now (D5, PIN-7)',
    )
  }
  // OLD-absent, whole-surface (End state 9's own form). The exhaustion literals were verified
  // present at the 2026-08-27 task's cut base — SKILL.md and CONTEXT.md each carried `exhaustion
  // demotes the remainder` once, design.md `budget-exhausted remainder` once — so these guard a
  // revert of that flip, never a never-present value (PIN-8). Deliberately NOT applied to
  // docs/adr/0013 — see the append-only-law exemption in the header comment and its two-sided
  // proof below.
  for (const [name, text, literal] of [
    ['skills/war/SKILL.md', skillMd, 'exhaustion demotes the remainder'],
    ['CONTEXT.md', contextMd, 'exhaustion demotes the remainder'],
    ['skills/war/references/design.md', designRefMd, 'budget-exhausted remainder'],
  ]) {
    assert.ok(
      !norm(text).includes(literal),
      `the retired budget-exhaustion literal "${literal}" must be gone from ${name} ` +
        '(OLD-absent, base-verified; #1812, PIN-8) — the living docs carry the absorb budget now',
    )
  }
  // The ADR home's exemption, proven from BOTH sides so the carve-out cannot hollow the row.
  // Construct-scoped (the D35 idiom): each supersession note QUOTES the historical literal
  // verbatim, so a whole-surface match is satisfied by the quotation alone — deleting the
  // superseded clause (the exact append-only-law violation this assert exists to catch) leaves a
  // whole-file assert green (proven: the scratch deletion passed before this scoping). Extract
  // each amendment section and assert inside THAT span.
  // Extract from the RAW text (norm() joins every line and strips '#', so headings do not survive
  // it), then normalize the extracted span for the literal match.
  const section = (date) =>
    norm((adr0013.match(new RegExp(`## Amendment \\(${date}\\)[\\s\\S]*?(?=\\n## |$)`)) || [''])[0])
  const adr0820 = section('2026-08-20')
  const adr0827 = section('2026-08-27')
  const adr0903 = section('2026-09-03')
  for (const [date, span] of [['2026-08-20', adr0820], ['2026-08-27', adr0827], ['2026-09-03', adr0903]]) {
    assert.ok(
      span.length > 200,
      `ADR 0013: the \`## Amendment (${date})\` section did not extract (non-vacuity guard) — a ` +
        'heading rename or removal reds here before the scoped asserts below can pass vacuously',
    )
  }
  assert.match(
    adr0820,
    /the remainder demotes on budget exhaustion/,
    "ADR 0013's 2026-08-20 clause is ratified append-only law and must survive byte-untouched — " +
      'this row exempts the ADR from the living-doc absence asserts precisely because of that law; ' +
      'restore the historical clause rather than editing it out',
  )
  assert.match(
    adr0827,
    /floor-retry reserve \(`fixRounds < roundLimit − 2`\)/,
    "ADR 0013's 2026-08-27 currency clause (the floor-retry reserve) is ratified append-only law " +
      'and must survive byte-untouched — the 2026-09-03 note supersedes its currency, never its bytes',
  )
  assert.match(
    adr0903,
    /absorbRounds\s*<\s*run\.absorbRounds/,
    'ADR 0013 must carry the dated 2026-09-03 supersession note naming the absorb budget — it is ' +
      'what makes the surviving 2026-08-27 clause readable as history rather than current doctrine ' +
      '(the exemption above is only sound while this note stands)',
  )
  assert.match(
    adr0903,
    /2026-08-27 clause[\s\S]{0,120}?historical/i,
    "ADR 0013's 2026-09-03 amendment must name the 2026-08-27 currency clause as historical",
  )
})

// (reserve-retired) THE `roundLimit − 2` RESERVE ARITHMETIC IS ABSENT FROM EVERY LIVING SURFACE
// (plan 2026-09-03-in-band-absorb-default, End state 5 · Task 2.2; PIN-7). OLD-absent, whole-surface,
// base-verified: at this task's cut base the reserve shape was present in SKILL.md's `--ace` bullet,
// CONTEXT.md's **Ace bisection** and **Re-entry** rows, and design.md §18 (Task 2.2 re-authored
// them), and Task 2.1 had already retired it from `disposition-eligibility.md` widening 1, the
// `schemas.md` re-entry row, and the engine's seven comments plus its four emitted reserve-stop
// strings (two log() calls plus the demote() and routeToSweep() reason literals they guarded)
// (rule 7: this task's gate reads those three surfaces after the dep rebase). Two shapes
// are guarded: the arithmetic itself (`roundLimit − 2`, either minus glyph, any spacing, case-
// folded — the End-state check's own regex) and the retired token `floor-retry reserve` (the
// merge-floor retry LOOP keeps its `floor-retry` label — only the reserve compound is retired).
// ADR 0013 is exempt (append-only law — D43 proves both sides of that exemption).
test('reserve-retired — the roundLimit − 2 reserve arithmetic and the floor-retry-reserve token are absent from the six living surfaces (End state 5, PIN-7)', () => {
  for (const [name, text] of [
    ['skills/war/SKILL.md', skillMd],
    ['CONTEXT.md', contextMd],
    ['skills/war/references/design.md', designRefMd],
    ['skills/war/references/disposition-eligibility.md', eligibilityRef],
    ['skills/war/references/schemas.md', schemasMd],
    ['skills/war/assets/workflow-template.js', workflowTemplateSrc],
  ]) {
    const t = norm(text)
    assert.ok(
      !/roundLimit\s*(?:−|-|–)\s*2/i.test(t),
      `${name} still carries the retired \`roundLimit − 2\` reserve arithmetic (OLD-absent, ` +
        'base-verified; End state 5, PIN-7) — the absorb budget `absorbRounds < run.absorbRounds` ' +
        'is the ace ladder\'s sole bound now',
    )
    assert.ok(
      !/floor-retry reserve/i.test(t),
      `${name} still names the retired \`floor-retry reserve\` (OLD-absent, base-verified; End ` +
        'state 5) — re-author to the absorb budget',
    )
  }
  // The positive half: the six surfaces carry the NEW arithmetic, so an emptied surface cannot
  // satisfy the absence asserts vacuously.
  for (const [name, text] of [
    ['skills/war/SKILL.md', skillMd],
    ['CONTEXT.md', contextMd],
    ['skills/war/references/design.md', designRefMd],
    ['skills/war/references/disposition-eligibility.md', eligibilityRef],
    ['skills/war/references/schemas.md', schemasMd],
    ['skills/war/assets/workflow-template.js', workflowTemplateSrc],
  ]) {
    assert.match(
      norm(text),
      /absorbRounds\s*<\s*run\.absorbRounds/,
      `${name} must state the absorb-budget gate \`absorbRounds < run.absorbRounds\` (D5) — the ` +
        'retired-shape asserts above are only meaningful while the successor is present',
    )
  }
})

// (refiner-evict) THE `## Gate-failure classification` EVICTION (plan 2026-09-03-in-band-absorb-
// default, D12 · Task 2.1 moved it, Task 2.2 pins it; ADR 0042). Three rows: (a) the evicted body
// is present VERBATIM in skills/war/references/gate-failure-classification.md — extract by
// construct (the `## Gate-failure classification` heading → end of file, the section's only
// terminator there) and assert BYTE equality against the pinned SHA-256 of the pre-eviction card
// bytes (3,126 B, `git show e673850^:agents/war-refiner.md`, the section up to `## Gate contract`);
// a reword, a dropped bullet, or a re-flow reds here — an ADR 0042 eviction is a byte-identical
// move, and a sanctioned later edit re-pins the digest in the same commit with its rationale.
// (b) the card's trigger pointer is pinned — trigger + link, never a bare link (a pointer without
// a trigger is a defect, ADR 0042) — and the card no longer carries the body. (c) no
// `#gate-failure-classification` in-page anchor token survives in the card or the two references
// files that linked into it (case-insensitive): an in-page anchor cannot resolve into the moved
// section, so a surviving token is a dangling link.
const GATE_FAILURE_SECTION_SHA256 = '927b5e3345a883124bc7270a0f53349469b6c73267d0ed0ab58595c8418679ad'
test('refiner-evict (a) — the evicted `## Gate-failure classification` body is present verbatim in gate-failure-classification.md (extract and byte equality; ADR 0042, D12)', () => {
  const heading = '\n## Gate-failure classification\n'
  const at = gateFailureMd.indexOf(heading)
  assert.ok(at >= 0, 'gate-failure-classification.md lost its `## Gate-failure classification` heading')
  assert.equal(
    gateFailureMd.indexOf(heading, at + 1),
    -1,
    'expected exactly one `## Gate-failure classification` heading in gate-failure-classification.md',
  )
  const body = gateFailureMd.slice(at + 1)
  assert.ok(!/\n## /.test(body.slice(heading.length)), 'the evicted section must be the file\'s last `##` section (heading → end of file)')
  // Non-vacuity: the extraction spans the section's tail bullet.
  assert.match(body, /\*\*Debt reuse:\*\*/, 'the extracted section must span its `**Debt reuse:**` tail bullet')
  assert.equal(Buffer.byteLength(body, 'utf8'), 3126, 'the evicted section is 3,126 B (the pre-eviction card bytes)')
  assert.equal(
    createHash('sha256').update(body, 'utf8').digest('hex'),
    GATE_FAILURE_SECTION_SHA256,
    'the evicted `## Gate-failure classification` section must be byte-identical to the ' +
      'pre-eviction card text (ADR 0042 byte-identical move) — a sanctioned edit re-pins ' +
      'GATE_FAILURE_SECTION_SHA256 in this commit with its rationale',
  )
})
test('refiner-evict (b) — the refiner card keeps the fixed trigger pointer to gate-failure-classification.md and no longer carries the body', () => {
  assert.match(
    refinerCard,
    /when the gate is red, read \[gate-failure-classification\.md\]\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/gate-failure-classification\.md\)/,
    'the card must carry the fixed trigger pointer "when the gate is red, read ' +
      '[gate-failure-classification.md](${CLAUDE_PLUGIN_ROOT}/skills/war/references/' +
      'gate-failure-classification.md)" (trigger + link; ADR 0042, D12)',
  )
  assert.match(
    refinerCard,
    /^## Gate-failure classification$/m,
    'the card keeps the `## Gate-failure classification` heading over the pointer',
  )
  for (const literal of ['Per-site classification base', 'Precondition-marker short-circuit', 'Debt reuse:']) {
    assert.ok(
      !refinerCard.includes(literal),
      `the card still carries the evicted body literal "${literal}" — the section lives in ` +
        'gate-failure-classification.md only (a duplicated body drifts)',
    )
  }
})
test('refiner-evict (c) — no `#gate-failure-classification` anchor token survives in the card, budget-raise-floor.md, or refiner-recovery.md', () => {
  for (const [name, text] of [
    ['agents/war-refiner.md', refinerCard],
    ['skills/war/references/budget-raise-floor.md', budgetRaiseFloorMd],
    ['skills/war/references/refiner-recovery.md', refinerRecoveryMd],
  ]) {
    assert.ok(
      !/#gate-failure-classification/i.test(text),
      `${name} still carries the retired in-page anchor token \`#gate-failure-classification\` — ` +
        'the section moved to skills/war/references/gate-failure-classification.md; re-key the link',
    )
    assert.match(
      text,
      /gate-failure-classification\.md/,
      `${name} must name the references home gate-failure-classification.md (the re-keyed link)`,
    )
  }
})

// (D44) THE INTENT-CEILING LATITUDE MIRROR (#1513) — CONTEXT.md's **Intent ceiling / plan floor**
// glossary entry restates the `Mechanism latitude:` reading whose canonical decision record is
// ADR 0013's `## Amendment (2026-08-17): the latitude-clause reading`. The entry landed with no
// mechanical coverage of that half: D38 binds only the 2026-08-25 ask amendment, D43 the #1812
// reserve rows, and no other row reads this pair — so a rewrite of either surface alone shipped
// silent, which is exactly the [[context-md-doctrine-mirror-can-land-without-a-skill-doc-contracts-drift-guard-row]]
// class ADR 0025 makes a same-commit duty. The clause is a standing latitude fence every worker
// and auditor prompt threads, so the mirror is load-bearing at run time, not decorative.
//
// Extraction is BY CONSTRUCT on both surfaces (the D35 idiom): the bolded glossary term → next
// bolded term or `###` heading, and the dated amendment heading → the next `## ` heading — never a
// whole-file scan, because ADR 0013 carries several dated amendments and CONTEXT.md's neighbouring
// **Disposition** entry shares this vocabulary. Each extraction must span its own tail marker (the
// `_Avoid_` line; the amendment's never-waives bullet) so a truncated read reds instead of passing
// vacuously. Anchor literals are copied from the post-plan-A, post-Phase-1-eviction tree — Phase 1
// Task 5 kept the latitude clause HOT in CONTEXT.md, so these are live bytes, not evicted ones.
// Keys are token-anchored `\s+`-wrapped forms asserted on BOTH surfaces: a one-sided edit reds,
// and sanctioned rewording latitude on either surface must not false-red.
test("D44 — CONTEXT.md **Intent ceiling / plan floor** mirrors ADR 0013's 2026-08-17 latitude-clause amendment (#1513)", () => {
  const entry = contextMd.match(
    /^\*\*Intent ceiling \/ plan floor\*\*[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m,
  )
  assert.ok(
    entry,
    'could not locate the `**Intent ceiling / plan floor**` glossary entry in CONTEXT.md (bolded ' +
      'term → next bolded term or `###` heading) — the extraction construct rotted',
  )
  assert.match(
    norm(entry[0]),
    /_Avoid_/,
    'the extracted **Intent ceiling / plan floor** entry must span its `_Avoid_` line — ' +
      'extraction truncated',
  )
  const amendment = adr0013.match(
    /## Amendment \(2026-08-17\): the latitude-clause reading[\s\S]*?(?=\n## )/,
  )
  assert.ok(
    amendment,
    "could not locate ADR 0013's `## Amendment (2026-08-17): the latitude-clause reading` section " +
      '(heading → next `## ` heading) — the canonical home rotted; re-anchor BOTH surfaces together',
  )
  const canonical = norm(amendment[0])
  assert.match(
    canonical,
    /never\s+waives\s+a\s+check,\s+gate,\s+or\s+backstop/i,
    'the extracted 2026-08-17 amendment must span its never-waives bullet — extraction truncated ' +
      '(a short read would satisfy the keys below vacuously)',
  )
  for (const [key, what] of [
    [/Mechanism\s+latitude/i, 'the `Mechanism latitude:` clause name'],
    [/Binding\s+guardrails/i, 'the paired `Binding guardrails:` list'],
    [/floor/i, 'the plan-slice-is-the-floor half of the pair'],
    [/ceiling/i, 'the intent-is-the-ceiling half of the pair'],
    [/contradicts\s+the\s+slice/i, 'the re-read of "contradicts the slice" against the guardrails'],
    [/in-band/i, 'the in-band reading of a licensed mechanism substitution'],
    [/End\s+states/i, 'the End-states half of the blocking floor'],
    [/never\s+waives\s+a\s+check,\s+gate,\s+or\s+backstop/i, 'the never-waives-a-check floor'],
    [/ADR[-\s]0017/i, 'the ADR 0017 citation carrying that floor'],
  ]) {
    for (const [surface, text] of [
      ['CONTEXT.md **Intent ceiling / plan floor** entry (mirror)', norm(entry[0])],
      ['docs/adr/0013 `## Amendment (2026-08-17)` (canonical home)', canonical],
    ]) {
      assert.match(
        text,
        key,
        `${surface} must carry ${what} (ADR 0025 mirror registry, #1513). Correct this row to a ` +
          'sanctioned rewording, never drop the clause on one surface to make it pass',
      )
    }
  }
})

// economy-ace-flip (2026-09-03 in-band-absorb-default Task 1.3, D14, PIN-16): the economy preset
// no longer pins `run.ace: false` — every preset inherits `DEFAULTS.run.ace` (true), and `run.ace`
// gates the per-task ace ladder only. Eight statements across five surfaces stated the old preset
// fact; all five are guarded below (Task 1.1 authored the war-room/SKILL.md and war-config.test.mjs
// rewrites). OLD-absent is LINE-SCOPED and case-folded: a single physical line holding `economy`,
// an `ace` token, and `off`/`false` is a hit — line scope reaches both README statements and both
// halves of war-room's one-line economy bullet, and never crosses a test boundary in
// war-config.test.mjs. README's defaults paragraph is kept as separate physical lines so
// `commitLearnings: false` never shares a line with the economy sentence; rejoining it false-reds
// the OLD-absent row.
const readmeMd = readFileSync(join(HERE, '..', '..', '..', 'README.md'), 'utf8')
const warRoomMd = readFileSync(join(HERE, '..', '..', 'war-room', 'SKILL.md'), 'utf8')
const warConfigTestSrc = readFileSync(join(HERE, 'war-config.test.mjs'), 'utf8')
const ECONOMY_ACE_FLIP_SURFACES = [
  ['README.md', readmeMd],
  ['skills/war/SKILL.md', skillMd],
  ['skills/war/references/schemas.md', schemasMd],
  ['skills/war-room/SKILL.md', warRoomMd],
  ['skills/war/assets/war-config.test.mjs', warConfigTestSrc],
]
// One physical line → OLD hit iff all three tokens co-occur on it (case-folded, token-bounded so
// `offer`/`falsehood` prose never false-reds and `preface`/`ace_diff_files` never counts as `ace`;
// a hyphenated `false-` compound does count, because the hyphen is a word boundary — and so does
// the `off` side: `trade-off` and `one-off` match `\boff\b` the same way, so a line pairing
// `economy`, `ace`, and `barrier:trade-off` is a hit).
const economyAceOffLines = (text) =>
  text
    .split('\n')
    .map((l, i) => [i + 1, l.toLowerCase()])
    .filter(([, l]) => /economy/.test(l) && /\bace\b/.test(l) && /\b(?:off|false)\b/.test(l))
    .map(([n]) => n)

test('economy-ace-flip — the line-scoped detector fires on the retired README/SKILL/schemas shapes (self-check)', () => {
  // Negative reference: five retired physical-line shapes (items 1, 2 and 4 are abridged from the
  // pre-flip README/SKILL lines, item 3 is the pre-flip schemas line with its indent dropped, item
  // 5 is item 1 in uppercase so the case-fold is exercised). Narrowing any clause drops a shape
  // from the expected [1, 2, 3, 4, 5] and reds this test. The second assert guards the `\bace\b`
  // token boundary; a dropped off/false clause only widens the detector.
  const retired = [
    '| `--ace` | no | on via config `run.ace` (economy preset: off) | Fix nits on the spot |',
    '  - **`--ace` (default on via `run.ace`; the economy preset pins it off).** With `run.ace`,',
    '  // ace = pre-merge auto-fix of absorb-disposition nits (default true; economy preset false);',
    'a solo roster, a 2-round budget, and ace off. `/war-room` only ever asks (economy)',
    '| --ACE | no | on via config run.ace (ECONOMY preset: OFF) |',
  ].join('\n')
  assert.deepEqual(economyAceOffLines(retired), [1, 2, 3, 4, 5])
  // And a lawful post-flip line — all three words present but `ace` only as a sub-token — is clean.
  assert.deepEqual(
    economyAceOffLines('economy: ace_diff_files stays off; the preface is false'),
    [],
  )
})

test('economy-ace-flip — OLD-absent: no surface carries a line pairing economy, an ace token, and off/false', () => {
  for (const [surface, text] of ECONOMY_ACE_FLIP_SURFACES) {
    const hits = economyAceOffLines(text)
    assert.deepEqual(
      hits,
      [],
      `${surface} line(s) ${hits.join(', ')} still state the retired "economy pins ace off" fact ` +
        '(D14, PIN-16) — every preset inherits run.ace on; rewrite the line, never drop this row ' +
        '(a README defaults-paragraph reflow also trips this: keep `commitLearnings: false` off ' +
        'the economy line — split the paragraph back)',
    )
  }
})

test('economy-ace-flip — NEW-present: every surface carries the inherited-on fact', () => {
  for (const [surface, text, key, what] of [
    ['README.md', readmeMd, /`--ace` \| no \| on via config `run\.ace` \(default `true`; every preset inherits it on\)/, 'the `--ace` row'],
    ['README.md', readmeMd, /`run\.ace` stays inherited on \(no preset pins the ace ladder/, 'the today\'s-defaults economy sentence'],
    ['skills/war/SKILL.md', skillMd, /\*\*`--ace` \(default on via `run\.ace`; every preset inherits it on\)\.\*\*/, 'the `--ace` bullet'],
    ['skills/war/references/schemas.md', schemasMd, /\/\/ ace = gates the per-task ace ladder only \(.*default true; every preset inherits it on\)/, 'the `ace` config comment'],
    ['skills/war-room/SKILL.md', warRoomMd, /\*\*economy\*\*[^\n]*`run\.ace` inherited on/, 'the economy preset bullet'],
    ['skills/war-room/SKILL.md', warRoomMd, /`run\.ace` \(bool[^\n]*default `true`\)/, 'the run.ace whitelist row'],
    ['skills/war/assets/war-config.test.mjs', warConfigTestSrc, /preset-ace-on/, 'the preset-ace-on census fixture'],
    ['skills/war/assets/war-config.test.mjs', warConfigTestSrc, /assert\.equal\(c\.run\.ace, true\)/, 'the economy-inherits assertion'],
  ]) {
    assert.match(
      text,
      key,
      `${surface} must carry ${what} stating run.ace is inherited on by every preset (D14, ` +
        'PIN-16). Correct this row to a sanctioned rewording, never delete it',
    )
  }
})

// (old-default-absent) THE RETIRED "ABSORB IS NEVER A DEFAULT" CONJUNCTIONS ARE ABSENT FROM THE EIGHT
// LIVING SURFACES (plan 2026-09-03-in-band-absorb-default, End state 8 · Task 3.2; D1/D2). The
// in-diff `absorb` default retired three conjunction shapes, base-verified at this task's cut base:
// `absorb` and `ask` are never default* (CLAUDE.md, CONTEXT.md, SKILL.md, design.md — the `*`
// covers `defaults` and `defaulted`), `absorb` and `ask` never defaulted (gastown-design-params.md),
// and the zero-token-gap `absorb` is never a default (the ADR rule-4 literal that once lived on
// the card, `schemas.md`, and the three `workflow-template.js` sites Task 3.1 rewrote — rule 7:
// this row reads those three surfaces after the dep rebase). Detection runs on a NORMALIZED
// surface — `//`/`>`/`#` line leaders stripped by `norm` BEFORE the join (so a phrase wrapped
// across a comment boundary flattens contiguous), then backticks and single and double quotes
// stripped, whitespace collapsed, case-folded — so a single-quoted engine comment (`'absorb' and
// 'ask' are NEVER defaulted`), a `//`-wrapped one, a wrapped Markdown line, or a benign re-case
// cannot evade it (the recorded [[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] lesson).
// The lawful rewrite keeps an
// `ask`-only tail ("defaults to absorb; ask is never a default"), which shares no shape with the
// three retired forms — the self-check below proves both halves of the detector. ADR 0013 is
// exempt (append-only law): Decision 4's ratified clause survives byte-untouched, and the
// 2026-09-04 amendment section carries the supersession — pinned present in row (b).
const oldDefaultFlat = (s) => norm(s).replace(/[`'"]/g, '').replace(/\s+/g, ' ').toLowerCase()
const OLD_DEFAULT_SHAPES = [
  [/absorb and ask are never default/, '`absorb` and `ask` are never default*'],
  [/absorb and ask never defaulted/, '`absorb` and `ask` never defaulted'],
  [/absorb is never a default/, '`absorb` is never a default (zero-token gap)'],
]
const OLD_DEFAULT_SURFACES = [
  ['CLAUDE.md', claudeMd],
  ['CONTEXT.md', contextMd],
  ['agents/war-auditor.md', auditorCard],
  ['skills/war/SKILL.md', skillMd],
  ['skills/war/assets/workflow-template.js', workflowTemplateSrc],
  ['skills/war/references/design.md', designRefMd],
  ['skills/war/references/gastown-design-params.md', gastownMd],
  ['skills/war/references/schemas.md', schemasMd],
]
const oldDefaultHits = (text) => OLD_DEFAULT_SHAPES.filter(([re]) => re.test(oldDefaultFlat(text))).map(([, what]) => what)

test('old-default-absent (self-check) — the lawful rewrite passes and each single-quoted comment site reds on its own', () => {
  // Positive fixture: the sanctioned `ask`-only tail is not an OLD hit.
  assert.deepEqual(
    oldDefaultHits('A fully specified Minor/Nit defaults to `absorb`; `ask` is never a default.'),
    [],
    'the lawful rewrite "defaults to absorb; ask is never a default" must pass the detector',
  )
  // Negative fixtures: the two retired single-quoted workflow-template.js comment sites, each
  // asserted ALONE so each proves its own shape. Site 1 is the AUDIT_VERDICT schema comment with
  // the phrase deliberately wrapped across a `//` boundary (the real pre-3.1 line carried
  // `are never defaulted` on one physical line) — only the `norm` leader strip makes it fire.
  // Site 2 is the dispositionOf header as it read before Task 3.1, unwrapped and upper-cased —
  // quote-stripping and case-folding make it fire.
  const wrappedAuditVerdictSite = [
    "    // Disposition routing (ADR 0013): auditor-owned, orthogonal to severity. Omitted → severity default",
    "    // (Minor → follow-up, Nit → note; 'absorb' and 'ask' are never",
    "    // defaulted). phaseClose:true routes an absorb to the phase-close queue.",
    "    disposition: { enum: ['absorb', 'follow-up', 'note', 'ask'] },",
  ].join('\n')
  assert.deepEqual(
    oldDefaultHits(wrappedAuditVerdictSite),
    ['`absorb` and `ask` are never default*'],
    'a `//`-wrapped single-quoted AUDIT_VERDICT comment site must red on the detector (leader strip)',
  )
  const unwrappedDispositionOfSite = [
    "// Disposition classification (ADR 0013; ask member #1550): Defaults when omitted:",
    "// Minor → 'follow-up', Nit → 'note'; 'absorb' and 'ask' are NEVER defaulted — an ask exists only",
  ].join('\n')
  assert.deepEqual(
    oldDefaultHits(unwrappedDispositionOfSite),
    ['`absorb` and `ask` are never default*'],
    'the single-line upper-cased dispositionOf comment site must red on the detector (quote strip + case-fold)',
  )
  // Each shape fires on its own base-verified literal (no shape is dead).
  assert.deepEqual(oldDefaultHits('`absorb` and `ask` never defaulted (ADR 0013)'), ['`absorb` and `ask` never defaulted'])
  assert.deepEqual(oldDefaultHits('Nit → note; `absorb` is never a default.'), ['`absorb` is never a default (zero-token gap)'])
})

// (barrier-list) CONTEXT.md's **Barrier list** glossary entry hand-spells all four BARRIER_TOKENS.
// The registry rows in workflow-template.test.mjs bind the inline mirror, the auditor card, the
// eligibility doc, and the schemas.md row — this row binds the fifth hand copy to the canonical
// array literal in land-decision.mjs (ADR 0025 same-commit mirror duty; the recorded
// [[default-flip-must-audit-all-doc-surfaces]] class), extracted by construct (bolded term to
// the next bolded term or `###` heading), never by line number.
const landDecisionSrc = readFileSync(join(HERE, 'land-decision.mjs'), 'utf8')
test('barrier-list — the CONTEXT.md **Barrier list** entry names every canonical BARRIER_TOKENS member', () => {
  const lit = landDecisionSrc.match(/export const BARRIER_TOKENS = (\[[^\]]+\])/)
  assert.ok(lit, 'could not locate the `export const BARRIER_TOKENS = [...]` literal in land-decision.mjs')
  const canonical = JSON.parse(lit[1].replace(/'/g, '"'))
  assert.equal(canonical.length, 4, 'BARRIER_TOKENS must carry exactly four members (PIN-1)')
  const entry = contextMd.match(/^\*\*Barrier list\*\*[\s\S]*?(?=\n\*\*[^\n*]+\*\*|\n### )/m)
  assert.ok(entry, 'could not locate the `**Barrier list**` glossary entry in CONTEXT.md — the extraction construct rotted')
  const e = norm(entry[0])
  assert.match(e, /_Avoid_/, 'the extracted **Barrier list** entry must span its `_Avoid_` line — extraction truncated')
  const named = [...new Set(e.match(/barrier:[a-z-]+/g) || [])].sort()
  assert.deepEqual(
    named,
    [...canonical].sort(),
    'the CONTEXT.md **Barrier list** entry must name exactly the canonical BARRIER_TOKENS members — ' +
      'update this glossary copy in the same commit as land-decision.mjs (ADR 0025)',
  )
  assert.match(
    e,
    /`barrier:rationale-comment` \(the fix removes or edits a `ponytail:`\/deliberate-mirror rationale line\)/,
    'the CONTEXT.md barrier:rationale-comment gloss must keep the canonical `removes or edits` pair',
  )
})

test('old-default-absent (a) — the three retired conjunction shapes are absent from the eight living surfaces after normalization (End state 8)', () => {
  for (const [name, text] of OLD_DEFAULT_SURFACES) {
    const hits = oldDefaultHits(text)
    assert.deepEqual(
      hits,
      [],
      `${name} still carries the retired ${hits.join(' / ')} wording (OLD-absent, base-verified; ` +
        'End state 8, D1/D2) — a fully specified Minor/Nit defaults to `absorb` now; only `ask` is ' +
        'never a default',
    )
  }
})

test('old-default-absent (b) — every living surface carries the in-diff absorb default and ADR 0013 carries the 2026-09-04 amendment section', () => {
  // The positive half: an emptied surface cannot satisfy the absence asserts vacuously.
  for (const [name, text] of OLD_DEFAULT_SURFACES) {
    assert.match(
      oldDefaultFlat(text),
      /defaults to absorb/,
      `${name} must state that a fully specified Minor/Nit defaults to absorb (D1/D2; End state 8) — ` +
        'the retired-shape asserts are only meaningful while the successor is present',
    )
  }
  // The ADR home is exempt from the absence guard (append-only law) and instead pins the
  // amendment section by construct: the dated heading through the NEXT H2 (or EOF).
  const block = adr0013.match(/^## Amendment \(2026-09-04\)(?:(?!\n## )[\s\S])*/m)
  assert.ok(block, 'ADR 0013 must carry the `## Amendment (2026-09-04)` in-diff absorb default section (Task 3.2)')
  const a = norm(block[0])
  for (const [re, what] of [
    [/defaults to `absorb`/, 'the in-diff absorb default'],
    [/`BARRIER_TOKENS`/, 'the barrier list name'],
    [/`barrier:release-slot`, `barrier:underspecified`, `barrier:rationale-comment`/, 'the three follow-up barriers'],
    [/`barrier:trade-off`/, 'the ask-route barrier'],
    [/scope argument is never a barrier/i, 'the scope-argument exclusion'],
    [/byte-untouched/, "Decision 4's byte-untouched clause"],
  ]) {
    assert.match(a, re, `the ADR 0013 2026-09-04 amendment must carry ${what}`)
  }
  assert.match(
    adr0013,
    /Nit → note; `absorb` is never a default\. Critical\/Major blocking is untouched\./,
    "Decision 4's ratified clause must survive byte-untouched in ADR 0013 (append-only law)",
  )
})
