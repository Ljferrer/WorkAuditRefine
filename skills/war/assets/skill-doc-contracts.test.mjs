import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  const wfErr = skillMd.match(/- \*\*`held:workflow-error`[\s\S]*?(?=\n\s*- \*\*`held:)/)
  assert.ok(wfErr, 'could not locate the held:workflow-error outcome bullet in SKILL.md')
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

// (D13) Every `.sh` asset invoked in SKILL.md must run under `bash`, never `node` — the scripts are
// `#!/usr/bin/env bash`, so a `node <script>.sh` invocation SyntaxErrors on every Setup, Gate-2, and
// manual-land call (#741). The riskiest exposure is the Checkpoint/escalation land recipes: a
// SyntaxError on `land-advance` tempts a Lead into the raw `git push` those recipes exist to prevent.
// Assert-OLD-absent: no `node ` immediately invoking a non-whitespace path token ending `.sh`
// anywhere in the file — matches BOTH the `${CLAUDE_PLUGIN_ROOT}/…/provision-worktrees.sh` form and
// the `…/provision-worktrees.sh` elided form; the invocation *shape*, not "node" and ".sh" merely
// co-occurring in prose (a `.mjs` helper followed later by `*.test.sh` never matches, since `\S*`
// cannot cross the space between them). The `bash`-prefixed presence companion is anti-vacuous — no
// other D-series guard locks the land recipes' presence, so a wholesale deletion would otherwise pass.
test('D13 — SKILL.md invokes every .sh asset with bash, never node (#741)', () => {
  const nodeSh = skillMd.match(/node\s+\S*\.sh\b/)
  assert.ok(
    !nodeSh,
    `SKILL.md invokes a .sh asset with node ("${nodeSh ? nodeSh[0] : ''}") — ` +
      'use bash, or rephrase the example without a literal `node …*.sh` invocation shape',
  )
  assert.match(
    skillMd,
    /bash\s+\S*provision-worktrees\.sh\b/,
    'SKILL.md must retain at least one `bash …/provision-worktrees.sh` invocation (land recipes present)',
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
test('D14 — SKILL.md docker bullet does not misattribute the signature list to the gate-time classifier (#799)', () => {
  assert.doesNotMatch(
    skillMd,
    /signature list is what the gate-time classifier keys on/i,
    'SKILL.md still couples the platform-signature list to the gate-time classifier (#799 ' +
      'misattribution) — the list governs only Setup-time probe-build deferral',
  )
  const bullet = skillMd.match(/\*\*Daemon reachable\*\*[\s\S]*?(?=\n\s*- \*\*)/)
  assert.ok(bullet, 'could not locate the **Daemon reachable** docker bullet in SKILL.md')
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
test('D16 — SKILL.md docker bullet names classOf a reader of the refiner-computed class, never the re-run agent (#887)', () => {
  const bullet = skillMd.match(/\*\*Daemon reachable\*\*[\s\S]*?(?=\n\s*- \*\*)/)
  assert.ok(bullet, 'could not locate the **Daemon reachable** docker bullet in SKILL.md')
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

// (D18) SKILL.md's `gate_failed`-routing **`environment`** arm must document the BOUNDED
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
// HIT the old bullet and all six presence anchors were ABSENT from it — so a revert reds every arm.
//
// The first key's inner space is written `\s+` on purpose: the retired phrase is one of the three
// anchors the End-state-9 retired-claim sweep greps line-locally across `skills/war/` + `agents/`
// (this file included), so spelling it contiguously here would make the guard trip the very floor it
// backs. `\s+` keeps the literal out of the source line while matching the live prose identically —
// and, per the two-line-pairing lesson, strictly widens it across a wrap.
test('D18 — SKILL.md gate_failed environment arm documents bounded environment-proceed, not the gate-time zero-retry doctrine (#1030)', () => {
  const bullet = skillMd.match(/^ {2}- \*\*`environment`\*\* →[\s\S]*?(?=\n {2}- \*\*)/m)
  assert.ok(
    bullet,
    'could not locate the `- **`environment`** →` bullet under SKILL.md\'s `gate_failed` routing ' +
      'by class — the D18 construct is gone or its markup changed',
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
  // Non-vacuous companion: the bullet names BOTH gate sites and each site's exhaustion route.
  for (const [anchor, why] of [
    ['merge site', 'the environment arm must name the merge gate site'],
    ['land site', 'the environment arm must name the land gate site'],
    ['held:escalation', 'merge-site exhaustion must route held:escalation (the phase holds)'],
    ['held:land-failed', 'land-site exhaustion must route held:land-failed'],
  ]) {
    assert.ok(new RegExp(anchor, 'i').test(b), why)
  }
})
