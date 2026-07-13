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
const HERE = dirname(fileURLToPath(import.meta.url))
const skillMd = readFileSync(join(HERE, '..', 'SKILL.md'), 'utf8')
const tour = JSON.parse(
  readFileSync(join(HERE, '..', '..', '..', '.tours', 'architect-war-system.tour'), 'utf8'),
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
// probe-build deferral, whereas the gate-time `gate_failure_class` classifier (`classOf`) keys on
// re-running the failing gate at the classification base and comparing failing identifiers — the two
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
