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
// on its `_Avoid_` line — the doctrine that a row comes only from the two named producers and is
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

// (D21) SKILL.md's `held:land-failed` Outcome-handling bullet must carry BOTH arms by which a
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
// zero occurrences in SKILL.md — and terminate at the next SAME-INDENT 2-space `- **` sibling, never
// a top-level `- **` one (that truncates at the nested `    - **(a)` sub-bullet, or, read the other
// way, over-extends past the whole `- **Escalation-completion land …**` sibling and would let arm
// vocabulary from unrelated prose green the lock). Arm markers are markup-tolerant (D18's idiom), so
// a bold/backtick reshuffle inside an arm name does not false-red.
test('D21 — SKILL.md held:land-failed bullet names both environment arms, never one unconditional retry-spent claim (#1039)', () => {
  const lines = skillMd.split('\n')
  const headerIdx = lines.findIndex((l) => /^ {2}- \*\*`held:land-failed`/.test(l))
  assert.ok(
    headerIdx >= 0,
    'could not locate the 2-space ``- **`held:land-failed``` bullet header in SKILL.md — anchor ' +
      'rotted (non-vacuous guard)',
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
// CHECK — probe, refusal, AND the undo that removes the condemned commit from the working branch —
// between the `docs(learnings): phase N` commit step and the `ensure-origin` push step
// (#1083, #1136). Recorded incident: a Gate-2 promotion commit authored in a publication worktree whose
// tracked version-slot files were stale swept them into the docs commit and silently reverted a
// landed release — the lock-step version guard stayed green throughout, because lock-step is not
// monotonic ([[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]). The staged
// file *list* is the root-cause probe: the mechanism is a bulk stage of stale tracked files, so it
// catches every stale-staged path (a stale skill or hook alike), not just the four version slots.
//
// The undo arm (#1136): detect-and-refuse alone left the condemned docs commit sitting on the
// working branch inside the publication worktree — the remedy re-provisioned but never removed it,
// leaving a release-reverting commit one `ensure-origin` from origin. The arm is pinned on
// `reset --hard HEAD~1`, deliberately NOT on bare `reset --hard`: the remedy's own carve-out
// sentence names the no-`reset --hard` shared-branch doctrine inside this same region, so a bare
// key would be greened by the doctrine mention alone and the negative reference below would stop
// discriminating. A bare `revert` key is unusable for the same reason — the incident sentence
// above already reads "silently reverted a landed release".
//
// The key is ONE ORDERED match, never independent presence checks: commit step → `--name-only`
// probe → do-not-push clause → undo (`reset --hard HEAD~1`) → `ensure-origin` push step. That
// single regex locks the pairing (probe + refusal + undo) AND the position (after the commit,
// before the push) at once — dropping any arm, or relocating one outside that span, fails it RED.
//
// Extraction is BY CONSTRUCT — the `**Post-servitor publication (Gate 2` marker to the next `##`
// heading — never a whole-file scan: `ensure-origin` and `remove-publication-worktree` also appear
// in Setup step 2's crash-heal pre-flight and the Checkpoint land recipes, so a whole-file key
// could be greened by prose outside the flow this row polices. Markup-tolerant on the emphasis
// spans (D18/D21's idiom): a bold/backtick reshuffle inside a clause must not false-red.
//
// ONE ordered key, shared by the live row and its negative reference — the two must never drift.
const D22_ORDERED_SPAN =
  /docs\(learnings\): phase N[\s\S]*?git show\s+--name-only[\s\S]*?do\s+\*{0,2}not\*{0,2}\s+push[\s\S]*?reset[\s*`]{0,4}--hard[\s*`]{0,4}HEAD~1[\s\S]*?ensure-origin/
// Unwired negative reference (both-ways proof, zero fixture files — the structural-test
// blind-spot idiom): the pre-#1136 region shape, probe and refusal intact, undo clause absent,
// carrying a bare `reset --hard` doctrine mention so the proof also covers the pinning decision
// above (a bare key would green THIS string). Run through the same ordered key, asserted red.
const D22_REGION_WITHOUT_UNDO =
  '**Post-servitor publication (Gate 2, spec §4.6). ' +
  '- Commit `docs(learnings): phase N` in the publication worktree, plus the CLAUDE.md pointer duty. ' +
  '- **Pre-push staged-file check (never skip).** Before pushing, list the staged file set — ' +
  '`git show --name-only --format= HEAD` — and confirm every path is under the promotion ' +
  'destination: **ANY** other path means stale tracked files were staged — do **not** push; the ' +
  'refiner never runs `reset --hard` on a shared branch. Run `remove-publication-worktree`, ' +
  're-provision, and re-commit. ' +
  '- Push via `provision-worktrees.sh ensure-origin <working>` (push-first CAS, never force).'
test('D22 — SKILL.md Gate-2 flow orders the pre-push staged-file probe, its do-not-push clause and the undo step between commit and push (#1083, #1136)', () => {
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
    /ensure-origin/,
    'the extracted Gate-2 region must span through the `ensure-origin` push step — extraction ' +
      'truncated too early',
  )
  assert.match(
    region[0],
    D22_ORDERED_SPAN,
    'the Gate-2 flow must carry the pre-push staged-file check as ONE ordered span — the ' +
      '`docs(learnings): phase N` commit step, then the `git show --name-only` staged-file probe, ' +
      'then its do-not-push clause, then the `git reset --hard HEAD~1` undo of the condemned ' +
      'commit, then the `ensure-origin` push step (#1083, #1136). Every arm is load-bearing: the ' +
      'probe without the refusal is advice, the refusal without the probe has no trigger, and ' +
      'refusal without the undo strands the poisoned commit on the working branch one push from ' +
      'origin. Correct this row to a sanctioned rewording, never drop an arm to make it pass',
  )
  // Both-ways proof: the same key must REJECT the pre-#1136 shape (undo absent, bare `reset
  // --hard` doctrine mention present). Without this, a key that silently stopped discriminating
  // would still read green above.
  assert.doesNotMatch(
    D22_REGION_WITHOUT_UNDO,
    D22_ORDERED_SPAN,
    'the D22 ordered key matched a region whose undo clause is absent — the key no longer ' +
      'discriminates (a bare `reset --hard` mention must not satisfy the undo arm). Tighten the ' +
      'key, never relax this negative reference',
  )
})

// ---- Task 2.1 doc-cascade gates (plan 2026-07-26-dispatch-args-and-floor-coverage) ----
//
// The ADR 0037 and CONTEXT.md amendments below are deliberately phrased OUT of the spec §4.4
// four-surface `EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR` grep, and nothing else in the suite reads them —
// so without these two rows the doc reword would ship with no mechanical check of any kind. They are
// PER-MEDIUM, not uniform: an ADR is append-only, so its superseded sentences legitimately stay
// byte-intact and only NEW-present can discriminate; CONTEXT.md is a living glossary edited in place,
// so it gets NEW-present AND OLD-absent. Every OLD-absent predicate is sentence-literal-scoped —
// never a bare `two` word test (decision 2's "two pure, independently-tested exports" sentence is
// still true and must not trip it).

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
// naming both rungs). ADR 0025: a new mirror ships its drift guard in the same task — this row is
// that guard, landing in the commit that creates the mirror. Extraction is BY CONSTRUCT per term —
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
