import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  DEFAULTS, PRESETS, MODELS, EFFORTS, ROLES, PROVISION_SOURCES, ROSTER_POLICIES, RESERVED_LENSES,
  fillDefaults, presetConfig, agentMatrix, workerTierMatrix, validate, spawnOpts,
  validateRoster, widenRoster, resolveWidenSource, resolveProvision, resolveGate,
} from './war-config.mjs'
import { HARD_ESCALATION_REASONS, decideLand } from './land-decision.mjs'

// Helper: read workflow-template.js as text relative to this test file.
const __dir = dirname(fileURLToPath(import.meta.url))
const templateText = readFileSync(join(__dir, 'workflow-template.js'), 'utf8')

// Helper: recursively find files matching a predicate under a root, excluding pruned dirs.
function walkFiles(root, predicate, pruned = ['node_modules', '.git', 'worktrees']) {
  const results = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (pruned.includes(entry.name)) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) { walk(fullPath) }
      else if (entry.isFile() && predicate(entry.name, fullPath)) { results.push(fullPath) }
    }
  }
  walk(root)
  return results.sort()
}

// T1.4: unit test that walkFiles prunes 'worktrees' by basename.
// Uses a synthesized tmp fixture: <tmp>/worktrees/<run>/skills/x.test.mjs
// If 'worktrees' is removed from the default pruned list, this test goes RED.
test('walkFiles: skips files under a worktrees/ dir (basename prune)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'war-config-test-'))
  // Fixture: <tmp>/worktrees/run123/skills/x.test.mjs  ← should be pruned
  mkdirSync(join(tmp, 'worktrees', 'run123', 'skills'), { recursive: true })
  writeFileSync(join(tmp, 'worktrees', 'run123', 'skills', 'x.test.mjs'), '')
  // Fixture: <tmp>/skills/y.test.mjs  ← should be found
  mkdirSync(join(tmp, 'skills'), { recursive: true })
  writeFileSync(join(tmp, 'skills', 'y.test.mjs'), '')

  const found = walkFiles(tmp, name => name.endsWith('.test.mjs'))
  // The file under worktrees/ must be absent (pruned by basename 'worktrees')
  assert.ok(
    !found.some(p => p.includes('worktrees')),
    `walkFiles must prune 'worktrees/' by basename; found: ${found.join(', ')}`
  )
  // The file under skills/ must be present
  assert.ok(
    found.some(p => p.endsWith(join('skills', 'y.test.mjs'))),
    `walkFiles must still find files outside 'worktrees/'; found: ${found.join(', ')}`
  )
})

// Repo root: 3 levels up from skills/war/assets/
const REPO_ROOT = join(__dir, '..', '..', '..')

// Helper: read a doc file relative to REPO_ROOT
function readDoc(relPath) {
  return readFileSync(join(REPO_ROOT, relPath), 'utf8')
}

test('DEFAULTS validate', () => {
  assert.equal(validate(DEFAULTS).valid, true)
})

test('empty input fills to balanced defaults and validates', () => {
  const c = fillDefaults({})
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.agents.auditor.effort, 'xhigh')
  assert.equal(c.agents.servitor.effort, 'high')
  assert.equal(c.audit.rosterPolicy, 'auto')
  assert.equal(validate({}).valid, true)
})

test('deepMerge via fillDefaults does not mutate DEFAULTS', () => {
  const snapshot = JSON.stringify(DEFAULTS)
  fillDefaults({ agents: { worker: { model: 'opus' } } })
  assert.equal(JSON.stringify(DEFAULTS), snapshot)
})

test('partial override merges over defaults', () => {
  const c = fillDefaults({ agents: { worker: { model: 'haiku', effort: 'low' } } })
  assert.equal(c.agents.worker.model, 'haiku')
  assert.equal(c.agents.worker.effort, 'low')
  assert.equal(c.agents.auditor.model, 'opus')   // untouched default
  assert.equal(c.agents.refiner.model, 'sonnet') // untouched default
})

test('thorough preset', () => {
  const c = presetConfig('thorough')
  assert.equal(c.agents.worker.model, 'fable')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.agents.auditor.effort, 'max')
  assert.equal(c.agents.servitor.model, 'opus')
  assert.equal(c.agents.servitor.effort, 'default')
  assert.equal(c.audit.rosterPolicy, 'auto')       // inherited: Lead seeds 1-5 seats per task
  assert.equal(c.audit.roster.length, 5)
  assert.deepEqual(c.audit.roster.map(s => s.lens),
    ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'test-fidelity'])
  assert.equal(validate(c).valid, true)
})

test('economy preset (pinned to its historical effective config)', () => {
  const c = presetConfig('economy')
  assert.equal(c.agents.worker.model, 'sonnet')
  assert.equal(c.agents.worker.effort, 'default')
  assert.equal(c.agents.auditor.model, 'sonnet')
  assert.equal(c.agents.servitor.model, 'sonnet')
  assert.equal(c.agents.servitor.effort, 'default') // pinned — DEFAULTS moved to high
  assert.equal(c.audit.rosterPolicy, 'solo')
  assert.equal(c.run.roundLimit, 2)
  assert.equal(c.run.ace, false)                    // pinned — DEFAULTS moved to true
  assert.equal(c.memory.commitLearnings, false)     // inherited — DEFAULTS is now false; economy no longer pins it
  assert.equal(validate(c).valid, true)
})

test('unknown preset throws', () => {
  assert.throws(() => presetConfig('turbo'), /unknown preset/)
})

// --- agentMatrix (D6): enumerated (preset, role, model, effort) matrix + completeness -----------
// The matrix is the single watched surface for the (preset, role) → (model, effort) facts (ADR 0025).
// It reuses presetConfig()'s merge and iterates the live PRESETS/ROLES, so the completeness test proves
// every (preset × role) cell is present with a valid model/effort — a regressed derivation that drops or
// fabricates a cell, or a preset carrying an out-of-enum literal, goes red here.

test('agentMatrix: one valid (model, effort) row per PRESETS key × role, total coverage (#656, D6)', () => {
  const matrix = agentMatrix()
  const presets = Object.keys(PRESETS)
  // Total: exactly |PRESETS| × |ROLES| rows — no missing and no phantom cell.
  assert.equal(matrix.length, presets.length * ROLES.length,
    `agentMatrix must have one row per (preset × role) = ${presets.length}×${ROLES.length}; got ${matrix.length}`)
  const seen = new Set()
  for (const preset of presets) {
    for (const role of ROLES) {
      const rows = matrix.filter(r => r.preset === preset && r.role === role)
      assert.equal(rows.length, 1,
        `agentMatrix must carry exactly one row for (preset=${preset}, role=${role}); got ${rows.length}`)
      const { model, effort } = rows[0]
      assert.ok(MODELS.includes(model),
        `agentMatrix (${preset}, ${role}).model ${JSON.stringify(model)} must be one of ${MODELS.join('|')}`)
      assert.ok(EFFORTS.includes(effort),
        `agentMatrix (${preset}, ${role}).effort ${JSON.stringify(effort)} must be one of ${EFFORTS.join('|')}`)
      seen.add(`${preset}/${role}`)
    }
  }
  // No phantom cell: every emitted row is a real (PRESETS key × ROLES) pair.
  for (const r of matrix) {
    assert.ok(seen.has(`${r.preset}/${r.role}`),
      `agentMatrix emitted an unexpected row (preset=${r.preset}, role=${r.role}) outside PRESETS × ROLES`)
  }
})

test('agentMatrix: each row equals the presetConfig() merge (reuses the canonical merge, never re-implements it) (#656, D6)', () => {
  // Delete-and-trace: if agentMatrix ever hand-rolls the merge and drifts from presetConfig(), this
  // equality bites. Today it delegates, so this pins the delegation against a future rewrite.
  for (const { preset, role, model, effort } of agentMatrix()) {
    const a = presetConfig(preset).agents[role]
    assert.equal(model, a.model, `agentMatrix (${preset}, ${role}).model must equal presetConfig().agents.${role}.model`)
    assert.equal(effort, a.effort, `agentMatrix (${preset}, ${role}).effort must equal presetConfig().agents.${role}.effort`)
  }
})

// --- agents.redteam (validator-only, NOT a phase ROLE) + worker tiers (T1.1) --------------------
// redteam joins validation only: it must NEVER enter ROLES or the (preset, role) agentMatrix — the
// per-phase spawn path stays four roles (/red-team consumes redteam fail-open). worker.docs/fix are
// per-tier { model, effort } refinements of the worker role, validated exactly like a role tier.

test('matrix stays four roles: ROLES is exactly the four phase roles and excludes redteam (T1.1)', () => {
  assert.deepEqual(ROLES, ['worker', 'auditor', 'refiner', 'servitor'])
  assert.equal(ROLES.length, 4, 'ROLES must stay exactly four phase roles')
  assert.ok(!ROLES.includes('redteam'), 'redteam is NOT a phase role — it joins validation only')
  // agentMatrix enumerates ROLES only, so no emitted row may carry role "redteam".
  assert.ok(!agentMatrix().some(r => r.role === 'redteam'),
    'agentMatrix must stay four roles — redteam must never appear as a matrix row')
  // Delete-the-feature: if redteam were pushed into ROLES, both the length check and the row count bite.
  assert.equal(agentMatrix().length, Object.keys(PRESETS).length * 4,
    'agentMatrix must have exactly |PRESETS| × 4 rows (four roles, redteam excluded)')
})

test('agents.redteam is preset-populated: balanced opus/max in DEFAULTS, thorough/economy override (fix + red-team asks)', () => {
  // /war-room now asks for the red-team model/effort and never leaves it blank — the values live in
  // DEFAULTS (balanced) + the two overriding presets. Delete-the-feature: drop the redteam blocks and
  // the deepEquals below go red.
  assert.deepEqual(DEFAULTS.agents.redteam, { model: 'opus', effort: 'max' }, 'DEFAULTS (balanced) red-team must be opus/max')
  const REDTEAM = { balanced: { model: 'opus', effort: 'max' }, thorough: { model: 'fable', effort: 'xhigh' }, economy: { model: 'sonnet', effort: 'max' } }
  for (const [preset, expected] of Object.entries(REDTEAM)) {
    assert.deepEqual(presetConfig(preset).agents.redteam, expected, `${preset} preset red-team must be ${JSON.stringify(expected)}`)
  }
  // A partial input that omits redteam still validates (the block is optional at the input layer;
  // fillDefaults injects the balanced default, and a missing config FILE still lets /red-team inherit).
  assert.equal(validate({ agents: { worker: { model: 'opus' } } }).valid, true)
})

test('agents.redteam validates when present: every MODELS model and every EFFORTS effort accepted (T1.1)', () => {
  for (const model of MODELS) {
    assert.equal(validate({ agents: { redteam: { model, effort: 'high' } } }).valid, true, `redteam model ${model} should validate`)
  }
  for (const effort of EFFORTS) {
    assert.equal(validate({ agents: { redteam: { model: 'opus', effort } } }).valid, true, `redteam effort ${effort} should validate`)
  }
})

test('agents.redteam rejects a bad model / bad effort with an error naming the key (T1.1)', () => {
  // Delete-the-feature: without the redteam validation call, both of these validate as an unknown-but-ignored
  // key — so each MUST be rejected with a redteam-scoped error.
  const rm = validate({ agents: { redteam: { model: 'gpt-5', effort: 'high' } } })
  assert.equal(rm.valid, false)
  assert.match(rm.errors.join('\n'), /agents\.redteam\.model/)
  const re = validate({ agents: { redteam: { model: 'opus', effort: 'ultrathink' } } })
  assert.equal(re.valid, false)
  assert.match(re.errors.join('\n'), /agents\.redteam\.effort/)
})

test('agents.redteam rejects unknown sub-keys with a courtesy error naming the key and /war-room (T1.1)', () => {
  const r = validate({ agents: { redteam: { model: 'opus', effort: 'high', depth: 'deep' } } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /agents\.redteam\.depth/)
  assert.match(msg, /\/war-room/)
})

test('agents.redteam non-object rejected (null / scalar / array reach the tier object-type branch) (T1.1)', () => {
  for (const bad of [null, 'opus', 42, ['opus']]) {
    const r = validate({ agents: { redteam: bad } })
    assert.equal(r.valid, false, `redteam ${JSON.stringify(bad)} must be rejected`)
    assert.match(r.errors.join('\n'), /agents\.redteam must be an object/)
  }
})

test('agents.redteam is tolerated by the unknown-agent-key loop; a genuine unknown key is still rejected (T1.1)', () => {
  // redteam must pass the known-agent-key gate (it is a valid non-role agent key)…
  assert.equal(validate({ agents: { redteam: { model: 'opus', effort: 'high' } } }).valid, true)
  // …while a genuine typo/unknown agent key is rejected, naming the key and /war-room.
  const r = validate({ agents: { wizard: { model: 'opus', effort: 'max' } } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /agents\.wizard/)
  assert.match(msg, /\/war-room/)
})

test('agents.worker.docs defaults to { sonnet, default }; balanced inherits, thorough → opus/high, economy → haiku/high (T1.1)', () => {
  // Delete-the-feature: remove docs from DEFAULTS.agents.worker → the DEFAULTS deepEqual fails.
  assert.deepEqual(DEFAULTS.agents.worker.docs, { model: 'sonnet', effort: 'default' })
  const DOCS = { balanced: { model: 'sonnet', effort: 'default' }, thorough: { model: 'opus', effort: 'high' }, economy: { model: 'haiku', effort: 'high' } }
  for (const [preset, expected] of Object.entries(DOCS)) {
    assert.deepEqual(presetConfig(preset).agents.worker.docs, expected, `${preset} preset docs tier must be ${JSON.stringify(expected)}`)
  }
})

test('legacy worker block without a docs tier fills it from DEFAULTS and validates (criterion-12 style) (T1.1)', () => {
  const legacy = { version: 1, agents: { worker: { model: 'opus', effort: 'max' } } } // no docs key
  const c = fillDefaults(legacy)
  assert.deepEqual(c.agents.worker.docs, { model: 'sonnet', effort: 'default' })
  assert.equal(validate(legacy).valid, true, validate(legacy).errors.join('\n'))
})

test('agents.worker.docs rejects bad model / bad effort / unknown sub-key (validated like a role tier) (T1.1)', () => {
  const rm = validate({ agents: { worker: { docs: { model: 'gpt-5', effort: 'default' } } } })
  assert.equal(rm.valid, false)
  assert.match(rm.errors.join('\n'), /agents\.worker\.docs\.model/)
  const re = validate({ agents: { worker: { docs: { model: 'sonnet', effort: 'ultrathink' } } } })
  assert.equal(re.valid, false)
  assert.match(re.errors.join('\n'), /agents\.worker\.docs\.effort/)
  const rk = validate({ agents: { worker: { docs: { model: 'sonnet', effort: 'default', tier: 'x' } } } })
  assert.equal(rk.valid, false)
  const msg = rk.errors.join('\n')
  assert.match(msg, /agents\.worker\.docs\.tier/)
  assert.match(msg, /\/war-room/)
})

test('agents.worker.fix is preset-populated (balanced fable/high in DEFAULTS) and validated when present (fix + red-team asks)', () => {
  // /war-room now asks for the fix-worker model/effort and never leaves it blank — balanced's value
  // lives in DEFAULTS, thorough/economy override. Delete-the-feature: drop the fix blocks → these fail.
  assert.deepEqual(DEFAULTS.agents.worker.fix, { model: 'fable', effort: 'high' }, 'DEFAULTS (balanced) fix tier must be fable/high')
  const FIX = { balanced: { model: 'fable', effort: 'high' }, thorough: { model: 'fable', effort: 'max' }, economy: { model: 'opus', effort: 'default' } }
  for (const [preset, expected] of Object.entries(FIX)) {
    assert.deepEqual(presetConfig(preset).agents.worker.fix, expected, `${preset} preset fix tier must be ${JSON.stringify(expected)}`)
  }
  // Present + valid → accepted.
  assert.equal(validate({ agents: { worker: { fix: { model: 'opus', effort: 'max' } } } }).valid, true)
  // Present + bad effort → rejected. Delete-the-feature: without the fix validation call this validates.
  const re = validate({ agents: { worker: { fix: { model: 'opus', effort: 'nope' } } } })
  assert.equal(re.valid, false)
  assert.match(re.errors.join('\n'), /agents\.worker\.fix\.effort/)
  // Unknown sub-key → courtesy error naming the key and /war-room.
  const rk = validate({ agents: { worker: { fix: { model: 'opus', effort: 'max', extra: 1 } } } })
  assert.equal(rk.valid, false)
  assert.match(rk.errors.join('\n'), /agents\.worker\.fix\.extra/)
  assert.match(rk.errors.join('\n'), /\/war-room/)
})

// --- workerTierMatrix (T1.1): sibling canonical export the doc-honesty lens consults -------------
// Mirrors the agentMatrix pattern: base + docs + fix rows per preset — docs and fix are both defaulted
// in DEFAULTS (fix flipped from absent-by-default once /war-room began asking for the fix-worker tier).

test('workerTierMatrix: base + docs + fix row per preset; fix now defaulted; exact tier values pinned elsewhere (fix + red-team asks)', () => {
  const matrix = workerTierMatrix()
  const presets = Object.keys(PRESETS)
  for (const preset of presets) {
    const base = matrix.filter(r => r.preset === preset && r.tier === 'base')
    const docs = matrix.filter(r => r.preset === preset && r.tier === 'docs')
    const fix = matrix.filter(r => r.preset === preset && r.tier === 'fix')
    assert.equal(base.length, 1, `workerTierMatrix must carry exactly one base row for ${preset}`)
    assert.equal(docs.length, 1, `workerTierMatrix must carry exactly one docs row for ${preset}`)
    assert.equal(fix.length, 1, `workerTierMatrix must carry exactly one fix row for ${preset} (fix is now defaulted)`)
    // Exact per-preset docs/fix values live in the dedicated docs + fix tests and the
    // "each row equals presetConfig() merge" delegation test below (thorough docs = opus/high, not sonnet).
  }
  // fix is now defaulted in DEFAULTS → every preset emits a fix row. Delete-the-feature: drop the fix
  // block from DEFAULTS and every preset, and the per-preset fix.length===1 check above goes red (the
  // push stays isObj(w.fix)-guarded, so an unset fix would omit its row — the derivation is real).
  assert.ok(presets.every(p => matrix.some(r => r.preset === p && r.tier === 'fix')),
    'fix is defaulted in DEFAULTS, so every preset must emit a fix row')
  // Total rows: base + docs + fix per preset (3 × |PRESETS|), no phantom tier.
  assert.equal(matrix.length, presets.length * 3, `workerTierMatrix must have base+docs+fix per preset = ${presets.length}×3 rows`)
  // Every row's model/effort is a valid enum value (an out-of-enum tier literal goes red here).
  for (const r of matrix) {
    assert.ok(MODELS.includes(r.model), `workerTierMatrix (${r.preset}, ${r.tier}).model ${JSON.stringify(r.model)} must be a valid model`)
    assert.ok(EFFORTS.includes(r.effort), `workerTierMatrix (${r.preset}, ${r.tier}).effort ${JSON.stringify(r.effort)} must be a valid effort`)
  }
})

test('workerTierMatrix: each row equals the presetConfig() merge (reuses the canonical merge, never re-implements it) (T1.1)', () => {
  // Delegation guard mirroring agentMatrix's — if workerTierMatrix ever hand-rolls the merge, this bites.
  for (const { preset, tier, model, effort } of workerTierMatrix()) {
    const w = presetConfig(preset).agents.worker
    const block = tier === 'base' ? w : w[tier]
    assert.equal(model, block.model, `workerTierMatrix (${preset}, ${tier}).model must equal the presetConfig() worker${tier === 'base' ? '' : '.' + tier} source`)
    assert.equal(effort, block.effort, `workerTierMatrix (${preset}, ${tier}).effort must equal the same source`)
  }
})

test('bad model rejected', () => {
  const r = validate({ agents: { worker: { model: 'gpt-5' } } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /agents\.worker\.model/)
})

test('bad effort rejected', () => {
  const r = validate({ agents: { auditor: { effort: 'ultrathink' } } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /agents\.auditor\.effort/)
})

// --- audit roster validation + D3 legacy-key courtesy errors ------------------

test('legacy audit.covenSize rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { covenSize: 3 } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.covenSize/)
  assert.match(msg, /\/war-room/)
})

test('legacy audit.lenses rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { lenses: ['correctness'] } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.lenses/)
  assert.match(msg, /\/war-room/)
})

test('legacy audit.covenPolicy rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { covenPolicy: 'all' } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.covenPolicy/)
  assert.match(msg, /rosterPolicy/)
  assert.match(msg, /\/war-room/)
})

test('bad rosterPolicy rejected', () => {
  assert.equal(validate({ audit: { rosterPolicy: 'never' } }).valid, false)
})

test('each ROSTER_POLICIES member is accepted', () => {
  for (const p of ROSTER_POLICIES) {
    assert.equal(validate({ audit: { rosterPolicy: p } }).valid, true, `rosterPolicy ${p} should be valid`)
  }
})

test('invalid roster rejected through validate() with an audit.-prefixed error', () => {
  const r = validate({ audit: { roster: [] } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /audit\.roster/)
})

test('non-boolean autoEscalate rejected', () => {
  assert.equal(validate({ audit: { autoEscalate: 'yes' } }).valid, false)
})

test('roundLimit below 1 rejected', () => {
  assert.equal(validate({ run: { roundLimit: 0 } }).valid, false)
})

// --- run.provision / provisionSource / provisionAuto (Part B) ----------------

test('provision defaults: empty list, source none, auto true', () => {
  const c = fillDefaults({})
  assert.deepEqual(c.run.provision, [])
  assert.equal(c.run.provisionSource, 'none')
  assert.equal(c.run.provisionAuto, true)
  assert.equal(validate({}).valid, true)
})

test('provision of non-empty strings accepted', () => {
  const r = validate({ run: { provision: ['pnpm install --frozen-lockfile', 'git submodule update --init'] } })
  assert.equal(r.valid, true, r.errors.join('\n'))
})

test('non-array provision rejected with a clear error', () => {
  const r = validate({ run: { provision: 'pnpm install' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /provision must be an array/)
})

test('empty-string provision entry rejected with a clear error', () => {
  const r = validate({ run: { provision: ['ok', '   '] } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /provision\[1\].*non-empty/)
})

test('PROVISION_SOURCES enum has the expected members', () => {
  assert.deepEqual(
    PROVISION_SOURCES,
    ['explicit', 'manifest', 'ci', 'onboarding', 'structural', 'none'])
})

test('each provisionSource enum member is accepted', () => {
  for (const source of PROVISION_SOURCES) {
    assert.equal(validate({ run: { provisionSource: source } }).valid, true, `source ${source} should be valid`)
  }
})

test('bad provisionSource rejected', () => {
  const r = validate({ run: { provisionSource: 'magic' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.provisionSource/)
})

test('non-boolean provisionAuto rejected', () => {
  const r = validate({ run: { provisionAuto: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.provisionAuto/)
})

// --- run.ace (--ace opt-in pre-merge nit auto-fix; default false) -------------

test('ace defaults to true; economy pins false', () => {
  assert.equal(DEFAULTS.run.ace, true)
  for (const preset of ['balanced', 'thorough']) {
    assert.equal(presetConfig(preset).run.ace, true, `${preset} preset must inherit run.ace === true`)
  }
  assert.equal(presetConfig('economy').run.ace, false, 'economy preset must pin run.ace === false')
})

test('non-boolean ace rejected', () => {
  const r = validate({ run: { ace: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.ace must be a boolean/)
})

// --- memory block (compounding-memory retrieval + publication) ----------------
// DEFAULTS.memory = { retrieval: true, topK: 10, commitLearnings: false }.
// Publication is now a conscious opt-in (T1.1 flip) — the store stays local unless /war-room turns it on.
// Doctrine: no accepted-but-ignored keys, so validate() rejects bad types AND unknown keys.

test('memory defaults: retrieval true, topK 10, commitLearnings false (opt-in publication)', () => {
  const c = fillDefaults({})
  assert.deepEqual(c.memory, { retrieval: true, topK: 10, commitLearnings: false })
})

test('commitLearnings defaults to false; all three presets inherit false (opt-in publication, economy no longer pins) (T1.1)', () => {
  // Delete-the-feature: revert the DEFAULTS flip → this line fails.
  assert.equal(DEFAULTS.memory.commitLearnings, false)
  for (const preset of ['balanced', 'thorough', 'economy']) {
    assert.equal(presetConfig(preset).memory.commitLearnings, false,
      `${preset} preset must inherit memory.commitLearnings === false (publication is now an opt-in)`)
  }
  // The economy preset's own memory pin was deleted as now-redundant (DEFAULTS returned to false).
  // Delete-the-feature: re-add `memory: { commitLearnings: false }` to economy → this assertion fails.
  assert.ok(!Object.prototype.hasOwnProperty.call(PRESETS.economy, 'memory'),
    'economy preset must NOT carry a redundant memory pin now that DEFAULTS.memory.commitLearnings is false')
})

// criterion 12: a config WITHOUT a memory block fills defaults clean and validates.
// Temp-break: remove DEFAULTS.memory and fillDefaults({}) yields undefined memory → validate fails here.
test('old config without a memory block fills defaults clean and validates (criterion 12)', () => {
  const legacy = { version: 1, agents: { worker: { model: 'opus', effort: 'max' } } } // no memory key
  const c = fillDefaults(legacy)
  assert.deepEqual(c.memory, { retrieval: true, topK: 10, commitLearnings: false })
  assert.equal(validate(legacy).valid, true, validate(legacy).errors.join('\n'))
})

test('memory block: a fully-specified valid block passes', () => {
  const r = validate({ memory: { retrieval: false, topK: 5, commitLearnings: true } })
  assert.equal(r.valid, true, r.errors.join('\n'))
})

// The 'memory must be an object' branch (validate line 137). Both inputs reach it:
//   {memory:null} — deepMerge replaces the default object with null (isObj(null)===false)
//   {memory:[]}   — isObj rejects arrays
test('memory non-object rejected (null / array reach the object-type branch)', () => {
  const rNull = validate({ memory: null })
  assert.equal(rNull.valid, false)
  assert.match(rNull.errors.join('\n'), /memory must be an object/)
  const rArr = validate({ memory: [] })
  assert.equal(rArr.valid, false)
  assert.match(rArr.errors.join('\n'), /memory must be an object/)
})

test('memory.retrieval non-boolean rejected', () => {
  const r = validate({ memory: { retrieval: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.retrieval must be a boolean/)
})

test('memory.commitLearnings non-boolean rejected', () => {
  const r = validate({ memory: { commitLearnings: 1 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.commitLearnings must be a boolean/)
})

// --- Doc-claim drift guard (Task 3.1 / End-state 6): no surface reasserts the retired ------------
// commitLearnings default-`true` claim, and every documented default stays bound to the canonical
// DEFAULTS value. Two extraction+equality clauses pin the STRUCTURED "default <value>" surfaces
// (schemas.md's memory row; war-config.mjs's own memory-defaults comment — the surface the red-team
// correction flagged as fixed-in-diff but otherwise unguarded); one zero-match scan proves the
// retired-true claim absent from the enumerated doc set. All matchers are case-insensitive and
// mid-sentence anchored so a sentence-case reword still binds. Delete-the-feature: revert the
// DEFAULTS flip to `true` (docs still say false/off) and every clause below goes red.
//
// The two structured surfaces are EXTRACTED, not swept, and are excluded from the free-text adjacency
// sweep because a proximity scan mis-fires on their shape:
//   - schemas.md lists `retrieval` (legitimately `default true`) on the SAME row as the
//     `commitLearnings` destructure token (doc-contract leak-detector false-positive family).
//   - war-config.mjs's comment wraps across `// `-prefixed lines, so a single-line sweep can't bridge
//     `commitLearnings:` to its `(default …)` value.
// Extraction sidesteps both and pins the exact value (stronger than absence-of-true); the prose
// surfaces, whose claims are free text, get the sweep.

const WORD_TO_BOOL = { true: true, on: true, false: false, off: false }

// The enumerated doc set (sub-issue #779 Files list + red-team correction: migration.md, war-config.mjs).
const RETIRED_CLAIM_SURFACES = [
  'README.md',
  'CLAUDE.md',
  'skills/war-room/SKILL.md',
  'skills/war/references/schemas.md',
  'skills/lessons-learned/SKILL.md',
  'skills/lessons-learned/references/migration.md',
  'skills/war/assets/war-config.mjs',
]
// Structured surfaces pinned by clauses A/C — excluded from the prose adjacency sweep (see header).
const STRUCTURED_SURFACES = new Set([
  'skills/war/references/schemas.md',
  'skills/war/assets/war-config.mjs',
])

// Retired-true claim scanners. Each targets a real pre-flip form (the removed lines in the Phase-2
// retire commits) and is proven absent from every current surface.
const RETIRED_PUBLICATION_PHRASES = [
  /lessons\s+commit\s+by\s+default/i,           // retired README §heading ("why lessons commit by default")
  /(?:leans?|defaults?)\s+towards?\s+sharing/i, // retired "that default leans toward sharing" rationale
]
// commitLearnings' default asserted true/on within one `;`/newline-bounded clause — so an opt-in
// "off by default … turn it on" phrasing or an action-write can't co-trip it.
const COMMITLEARNINGS_DEFAULT_TRUE = /commitLearnings`?[^;\n]{0,90}?defaults?\s+(?:is\s+|to\s+)?[*`]*(?:true|on)\b/i
// Bare "commitLearnings: true" value-assertion that is NOT an opt-in accept action (set/write …: true).
const COMMITLEARNINGS_BARE_TRUE = /(.{0,16})commitLearnings`?\s*:\s*`?\**(?:true|on)\b/gi
function bareTrueOffense(text) {
  for (const m of text.matchAll(COMMITLEARNINGS_BARE_TRUE)) {
    if (/\b(?:set|write|writes|writing)\b/i.test(m[1])) continue // migrate/opt-in accept, not a default claim
    return m[0]
  }
  return null
}

// Clause A: schemas.md memory row documents commitLearnings' default == canonical.
test('doc-claim guard: schemas.md memory row documents commitLearnings default == DEFAULTS (extraction + equality)', () => {
  const text = readDoc('skills/war/references/schemas.md')
  // Slice from the commitLearnings DEFINITION (last "commitLearnings:" — the row's destructure token
  // has no colon), so retrieval's own "default true" earlier on the row can't be misread as this one.
  const row = text.slice(text.lastIndexOf('commitLearnings:'))
  const m = row.match(/default\s+(\w+)/i)
  assert.ok(m, 'schemas.md memory row must document the commitLearnings default (e.g. "…(bool, default false…")')
  const documented = WORD_TO_BOOL[m[1].toLowerCase()]
  assert.equal(documented, DEFAULTS.memory.commitLearnings,
    `schemas.md documents commitLearnings default "${m[1]}" (→ ${documented}) but ` +
    `DEFAULTS.memory.commitLearnings is ${DEFAULTS.memory.commitLearnings} — bind the doc to the canonical value`)
})

// Clause C: war-config.mjs memory-defaults comment documents commitLearnings' default == canonical.
test('doc-claim guard: war-config.mjs memory-defaults comment documents commitLearnings default == DEFAULTS', () => {
  const src = readDoc('skills/war/assets/war-config.mjs')
  const at = src.indexOf('commitLearnings: write the repo-root')
  assert.ok(at >= 0, 'war-config.mjs must retain the memory-defaults comment naming commitLearnings')
  const block = src.slice(at, at + 240).replace(/\n\s*\/\/\s?/g, ' ') // unwrap the `// ` comment lines
  const m = block.match(/\(default\s+(\w+)/i)
  assert.ok(m, 'war-config.mjs comment must state the commitLearnings default (e.g. "(default OFF …")')
  const documented = WORD_TO_BOOL[m[1].toLowerCase()]
  assert.equal(documented, DEFAULTS.memory.commitLearnings,
    `war-config.mjs comment states commitLearnings default "${m[1]}" (→ ${documented}) but canonical is ` +
    `${DEFAULTS.memory.commitLearnings} — a future comment re-introducing "default ON/true" must fail here`)
})

// Clause B: the retired default-true claim is absent from every enumerated surface.
test('doc-claim guard: no enumerated surface reasserts the retired commitLearnings default-`true` claim', () => {
  const offenses = []
  for (const surface of RETIRED_CLAIM_SURFACES) {
    const text = readDoc(surface)
    for (const re of RETIRED_PUBLICATION_PHRASES) {
      const m = text.match(re)
      if (m) offenses.push(`${surface}: retired publication rationale "${m[0]}"`)
    }
    const bare = bareTrueOffense(text)
    if (bare) offenses.push(`${surface}: bare default-true value "${bare.trim()}"`)
    // Free-text adjacency sweep — prose surfaces only; structured surfaces are pinned by A/C (see header).
    if (!STRUCTURED_SURFACES.has(surface)) {
      const m = text.match(COMMITLEARNINGS_DEFAULT_TRUE)
      if (m) offenses.push(`${surface}: commitLearnings default asserted true/on "${m[0]}"`)
    }
  }
  assert.deepEqual(offenses, [],
    'A surface reasserts the retired commitLearnings default-`true` claim (the flip landed `false`):\n  ' +
    offenses.join('\n  '))
})

test('memory.topK non-integer rejected', () => {
  const r = validate({ memory: { topK: 2.5 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.topK must be an integer >= 1/)
})

test('memory.topK below 1 rejected', () => {
  const r = validate({ memory: { topK: 0 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.topK must be an integer >= 1/)
})

// Doctrine proof: an unknown memory key is a config error, never silently kept (no accepted-but-ignored keys).
test('unknown memory key rejected (no accepted-but-ignored keys)', () => {
  const r = validate({ memory: { topN: 3 } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /memory\.topN/)
  assert.match(msg, /\/war-room/)
})

// --- overrides.testPattern + overrides validation hardening (#574, ADR 0006) --
// DEFAULTS.overrides.testPattern = null (today's hardcoded gate-mirror floor). A string is the
// run's pinned test-floor glob set, embedded single-quoted into an agent-executed shell line
// (assert-test-in-diff.sh --pattern) — so it must be a NON-EMPTY glob-safe string, and unknown
// overrides.* keys get a courtesy error (the memory.* precedent — a typo never runs the bare floor).

// The 'overrides must be an object' branch (mirrors the memory.* non-object guard). Both inputs
// reach it: {overrides:null} — deepMerge replaces the default object with null (isObj(null)===false);
// {overrides:'x'} — a scalar is not an object. Without the guard, Object.keys(null) throws a raw
// TypeError instead of a named validation error (end state 1, delete-the-feature).
test('overrides non-object rejected (null / scalar reach the object-type branch, no throw)', () => {
  const rNull = validate({ overrides: null })
  assert.equal(rNull.valid, false)
  assert.match(rNull.errors.join('\n'), /overrides must be an object/)
  const rStr = validate({ overrides: 'x' })
  assert.equal(rStr.valid, false)
  assert.match(rStr.errors.join('\n'), /overrides must be an object/)
  // A valid overrides object still validates as before.
  assert.equal(validate({ overrides: { gate: null, testPattern: '*.test.ts' } }).valid, true)
})

test('overrides.testPattern defaults to null (today\'s hardcoded floor, byte-identical)', () => {
  assert.equal(DEFAULTS.overrides.testPattern, null)
  assert.equal(fillDefaults({}).overrides.testPattern, null)
  assert.equal(validate({}).valid, true)
})

// --- overrides.ghUser (gh-preflight expected account, ships null — C1) ---
test('overrides.ghUser defaults to null (no real handle in any committed file, C1)', () => {
  assert.equal(DEFAULTS.overrides.ghUser, null)
  assert.equal(fillDefaults({}).overrides.ghUser, null)
})

test('overrides.ghUser accepts a handle string', () => {
  const r = validate({ overrides: { ghUser: 'someuser' } })
  assert.equal(r.valid, true, `ghUser string should validate; errors: ${r.errors.join('\n')}`)
})

test('overrides.ghUser non-string/non-null rejected with an error naming the key', () => {
  for (const bad of [42, true, ['someuser'], { login: 'someuser' }]) {
    const r = validate({ overrides: { ghUser: bad } })
    assert.equal(r.valid, false, `ghUser ${JSON.stringify(bad)} must be rejected`)
    assert.match(r.errors.join('\n'), /overrides\.ghUser/)
  }
})

test('overrides.testPattern accepts a glob string (single- and multi-token, glob charclass)', () => {
  for (const p of ['*.test.ts', '*.test.ts *.test.tsx', '*.test.[jt]s', 'src/*.spec.js']) {
    const r = validate({ overrides: { testPattern: p } })
    assert.equal(r.valid, true, `testPattern ${JSON.stringify(p)} should validate; errors: ${r.errors.join('\n')}`)
  }
})

test('overrides.testPattern non-string/non-null rejected with an error naming the key', () => {
  for (const bad of [42, true, ['*.test.ts'], { glob: '*.test.ts' }]) {
    const r = validate({ overrides: { testPattern: bad } })
    assert.equal(r.valid, false, `testPattern ${JSON.stringify(bad)} must be rejected`)
    assert.match(r.errors.join('\n'), /overrides\.testPattern/)
  }
})

// Delete-the-check guard: strip the glob-safe charset test and every one of these strings
// validates as a plain string — so each MUST be rejected with an error naming the key. Covers
// the shell-metacharacters that break out of the single-quoting, plus empty and trailing-newline.
test('overrides.testPattern rejects glob-unsafe / empty strings (shell-metachar break-out)', () => {
  const unsafe = [
    "foo'; rm -rf /",   // single quote — breaks the single-quoting
    'a;b',              // command separator
    'a`id`',            // backtick command substitution
    '$FOO',             // parameter expansion
    'a\nb',             // embedded newline
    'abc\n',            // TRAILING newline (the /^…$/-before-\n anchor trap)
    '',                 // empty is not a usable pattern (must be null instead)
  ]
  for (const p of unsafe) {
    const r = validate({ overrides: { testPattern: p } })
    assert.equal(r.valid, false, `unsafe testPattern ${JSON.stringify(p)} must be rejected`)
    assert.match(r.errors.join('\n'), /overrides\.testPattern/)
  }
})

// Glob-SHAPE guard (end state 6): beyond the charset break-out check, two token shapes mis-match under
// the floor's `case`-fnmatch and must be rejected — a `**/` token (fnmatch `*` already crosses `/`) and a
// `*<word>*` substring shape whose word is unbounded by `.`/`/` (over-matches, e.g. `*test_*` catches
// `latest_results.py`). These are glob-clean strings (pass the charset guard), so a shape check is the
// only thing that rejects them.
test('overrides.testPattern accepts depth-agnostic suffix and root+nested prefix forms', () => {
  for (const p of [null, '*.test.ts *.test.tsx', 'test_*.py */test_*.py']) {
    const r = validate({ overrides: { testPattern: p } })
    assert.equal(r.valid, true, `testPattern ${JSON.stringify(p)} should validate; errors: ${r.errors.join('\n')}`)
  }
})

// Delete-and-trace: each of these is a plain glob-clean string, so with the shape check removed it would
// validate — the guard is the only rejecter. `**/*.test.ts` trips the `**/` arm; `*test_*.py` trips the
// `*word*` substring arm; `''` trips the charset arm (kept, per plan).
test('overrides.testPattern rejects **/ and *word* over-match shapes (end state 6 matrix)', () => {
  for (const p of ['**/*.test.ts', '*test_*.py', '']) {
    const r = validate({ overrides: { testPattern: p } })
    assert.equal(r.valid, false, `mis-globbing testPattern ${JSON.stringify(p)} must be rejected`)
    assert.match(r.errors.join('\n'), /overrides\.testPattern/)
  }
  // The rejection names the correct form: `**/` error points at `*.ext`/`pre_* */pre_*`; `*word*` error
  // points at the `.`/`/`-bounded anchor. Delete-the-feature: without the shape check these strings pass.
  assert.match(validate({ overrides: { testPattern: '**/*.test.ts' } }).errors.join('\n'), /\*\.ext|pre_\*/)
  assert.match(validate({ overrides: { testPattern: '*test_*.py' } }).errors.join('\n'), /\*word\*|test_\*\.py/)
})

test('unknown overrides key rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ overrides: { testPatern: '*.test.ts' } }) // typo: single 't'
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /overrides\.testPatern/)
  assert.match(msg, /\/war-room/)
})

// --- resolveProvision (Part B) -----------------------------------------------
// resolveProvision decides whether war-room Setup must run the setup-scout:
//   • explicit non-empty run.provision → returned VERBATIM, source unchanged, no scout
//   • empty list + provisionAuto:true   → scout path flagged (scout:true)
//   • empty list + provisionAuto:false  → [] + source 'none', no scout

test('resolveProvision: non-empty list returned verbatim with source unchanged and no scout', () => {
  const list = ['pnpm install --frozen-lockfile', 'git submodule update --init --recursive']
  const c = fillDefaults({ run: { provision: list, provisionSource: 'explicit' } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, list)        // verbatim, same order
  assert.equal(r.source, 'explicit')         // source carried through unchanged
  assert.equal(r.scout, false)               // explicit intent → no scout
})

test('resolveProvision: non-empty list short-circuits the scout even when provisionAuto is true', () => {
  const list = ['make setup']
  const c = fillDefaults({ run: { provision: list, provisionSource: 'onboarding', provisionAuto: true } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, list)
  assert.equal(r.source, 'onboarding')       // explicit intent honored verbatim, source preserved
  assert.equal(r.scout, false)               // provisionAuto does NOT override an explicit list
})

test('resolveProvision: empty list + provisionAuto true flags the scout path', () => {
  const c = fillDefaults({ run: { provision: [], provisionAuto: true } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, [])
  assert.equal(r.source, 'none')
  assert.equal(r.scout, true)                // empty + auto → must scout
})

test('resolveProvision: empty list + provisionAuto false yields [] + source none + no scout', () => {
  const c = fillDefaults({ run: { provision: [], provisionAuto: false } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, [])
  assert.equal(r.source, 'none')
  assert.equal(r.scout, false)               // auto off → never scout
})

test('unknown role rejected', () => {
  assert.equal(validate({ agents: { wizard: { model: 'opus', effort: 'default' } } }).valid, false)
})

test('spawnOpts omits effort when default', () => {
  assert.deepEqual(spawnOpts(DEFAULTS, 'refiner'), { model: 'sonnet' })
})

test('spawnOpts includes non-default effort', () => {
  assert.deepEqual(spawnOpts(DEFAULTS, 'worker'), { model: 'opus', effort: 'max' })
  assert.deepEqual(spawnOpts(presetConfig('thorough'), 'worker'), { model: 'fable', effort: 'max' })
})

// --- validateRoster (D8) / widenRoster (D5) unit tests -------------------------

test('validateRoster: accepts 1–5 distinct-lens entries, depth present or absent', () => {
  assert.deepEqual(validateRoster([{ lens: 'correctness' }]), { valid: true, errors: [] })
  const five = [
    { lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' },
    { lens: 'performance' }, { lens: 'simplicity' }, { lens: 'usability', depth: 'deep' },
  ]
  assert.deepEqual(validateRoster(five), { valid: true, errors: [] })
})

test('validateRoster: DEFAULTS.audit.roster is valid (trio at deep)', () => {
  assert.deepEqual(validateRoster(DEFAULTS.audit.roster), { valid: true, errors: [] })
})

test('validateRoster: rejects an empty roster and a 6-entry roster (1–5 bound)', () => {
  assert.equal(validateRoster([]).valid, false)
  const six = ['a', 'b', 'c', 'd', 'e', 'f'].map(l => ({ lens: l }))
  assert.equal(validateRoster(six).valid, false)
})

test('validateRoster: rejects duplicate lenses (distinct-lens rule)', () => {
  const r = validateRoster([{ lens: 'correctness' }, { lens: 'correctness' }])
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /duplicat/i)
})

test('validateRoster: rejects empty and non-string lens', () => {
  assert.equal(validateRoster([{ lens: '' }]).valid, false)
  assert.equal(validateRoster([{ lens: 42 }]).valid, false)
})

test("validateRoster: rejects depth 'shallow' (enum is neighbors|deep)", () => {
  assert.equal(validateRoster([{ lens: 'correctness', depth: 'shallow' }]).valid, false)
})

test('validateRoster: rejects non-object entries', () => {
  assert.equal(validateRoster(['correctness']).valid, false)
  assert.equal(validateRoster([null]).valid, false)
})

test('widenRoster: solo security seat + default trio → 4 seats, security first, appended seats carry default depths', () => {
  const out = widenRoster([{ lens: 'security', depth: 'deep' }], DEFAULTS.audit.roster)
  assert.deepEqual(out.map(s => s.lens), ['security', 'correctness', 'cascading-impact', 'plan-faithfulness'])
  assert.equal(out[0].depth, 'deep')
  assert.ok(out.slice(1).every(s => s.depth === 'deep'), 'appended default seats keep their configured depths')
})

test('widenRoster: union dedupes — solo correctness@neighbors + trio → 3 seats, kept seat keeps its depth', () => {
  const out = widenRoster([{ lens: 'correctness', depth: 'neighbors' }], DEFAULTS.audit.roster)
  assert.deepEqual(out.map(s => s.lens), ['correctness', 'cascading-impact', 'plan-faithfulness'])
  assert.equal(out[0].depth, 'neighbors', 'the kept seat keeps its own depth (union, not replacement)')
})

test('widenRoster: caps at 5 — 1 seat + a 5-lens default → 5 seats, never 6', () => {
  const FIVE = ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'performance']
    .map(l => ({ lens: l, depth: 'deep' }))
  const out = widenRoster([{ lens: 'usability', depth: 'neighbors' }], FIVE)
  assert.equal(out.length, 5)
  assert.equal(out[0].lens, 'usability')
})

// ---------------------------------------------------------------------------
// resolveWidenSource (D4): auditor-nominated lone-seat widening source
// ---------------------------------------------------------------------------

const DEF = DEFAULTS.audit.roster

test('resolveWidenSource: valid nomination → per-seat deep, source "nominated"', () => {
  const r = resolveWidenSource(['security', 'performance'], DEF)
  assert.equal(r.source, 'nominated')
  assert.deepEqual(r.seats, [{ lens: 'security', depth: 'deep' }, { lens: 'performance', depth: 'deep' }])
})

test('resolveWidenSource: single-lens valid nomination → one deep seat, "nominated"', () => {
  const r = resolveWidenSource(['usability'], DEF)
  assert.equal(r.source, 'nominated')
  assert.deepEqual(r.seats, [{ lens: 'usability', depth: 'deep' }])
})

test('resolveWidenSource: RESERVED_LENSES entry rejects the WHOLE nomination → default fallback (no per-entry salvage)', () => {
  for (const reserved of RESERVED_LENSES) {
    const r = resolveWidenSource(['security', reserved], DEF)
    assert.equal(r.source, 'default', `nomination containing reserved lens "${reserved}" must fall back whole-field`)
    assert.strictEqual(r.seats, DEF, 'fallback returns defaultRoster verbatim (same reference)')
  }
})

test('resolveWidenSource: duplicate lenses → default fallback', () => {
  const r = resolveWidenSource(['security', 'security'], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: empty-string entry → default fallback', () => {
  const r = resolveWidenSource(['security', ''], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: non-string entry → default fallback', () => {
  const r = resolveWidenSource(['security', 42], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: empty array [] → default fallback', () => {
  const r = resolveWidenSource([], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: undefined (absent widen) → default fallback', () => {
  const r = resolveWidenSource(undefined, DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: non-array (string) → default fallback', () => {
  const r = resolveWidenSource('security', DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: own-lens nomination is legal — widenRoster dedupes it (lone seat kept once)', () => {
  // A lone `correctness` seat nominating `correctness` + `security`: resolveWidenSource accepts it
  // (distinct, non-reserved), and feeding the result through widenRoster dedupes the seat's own lens.
  const { seats } = resolveWidenSource(['correctness', 'security'], DEF)
  const widened = widenRoster([{ lens: 'correctness', depth: 'neighbors' }], seats)
  assert.deepEqual(widened.map(s => s.lens), ['correctness', 'security'])
  assert.equal(widened[0].depth, 'neighbors', 'the lone seat keeps its own depth (union, not replacement)')
})

// ---------------------------------------------------------------------------
// Drift-guard tests: assert that workflow-template.js mirrors agree with DEFAULTS
// ---------------------------------------------------------------------------

test('drift-guard: ROLE_MODEL in workflow-template.js matches DEFAULTS agent models (#10 Nit)', () => {
  // Extract the ROLE_MODEL literal from the template text.
  // It looks like: const ROLE_MODEL = { worker: 'sonnet', auditor: 'opus', ... }
  const match = templateText.match(/const\s+ROLE_MODEL\s*=\s*\{([^}]+)\}/)
  assert.ok(match, 'ROLE_MODEL not found in workflow-template.js')
  // Normalize single-quoted keys/values to double-quoted so JSON.parse can handle it.
  const body = match[1]
    .replace(/'/g, '"')                         // single → double quotes
    .replace(/(\w+)\s*:/g, '"$1":')             // bare keys → quoted keys
  const parsed = JSON.parse(`{${body}}`)
  assert.deepEqual(parsed, {
    worker:   DEFAULTS.agents.worker.model,
    auditor:  DEFAULTS.agents.auditor.model,
    refiner:  DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  })
})

// Drift-guard: each agents/war-<role>.md frontmatter `model:` must equal the
// corresponding DEFAULTS.agents.<role>.model, so an agent file's spawned model can
// never silently disagree with the config authority (the doc-rot this fixes: worker
// frontmatter said `sonnet` while DEFAULTS.agents.worker.model is `opus`).
test('drift-guard: agents/war-<role>.md frontmatter model matches DEFAULTS.agents.<role>.model', () => {
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    const text = readDoc(`agents/war-${role}.md`)
    // Isolate the leading YAML frontmatter block (between the first two --- fences)
    // so a stray `model:` in prose can't satisfy the match.
    const fm = text.match(/^---\n([\s\S]*?)\n---/)
    assert.ok(fm, `agents/war-${role}.md must open with a --- frontmatter block`)
    const modelLine = fm[1].match(/^model:\s*(\S+)\s*$/m)
    assert.ok(modelLine, `agents/war-${role}.md frontmatter must declare a model:`)
    assert.equal(modelLine[1], DEFAULTS.agents[role].model,
      `agents/war-${role}.md frontmatter model "${modelLine[1]}" must equal DEFAULTS.agents.${role}.model "${DEFAULTS.agents[role].model}"`)
  }
})

// ---------------------------------------------------------------------------
// resolveGate (F12): self-discovering multi-runner gate
// ---------------------------------------------------------------------------

test('resolveGate: with a declared gate — starts with declared gate', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.startsWith('node --test x'), `expected result to start with declared gate, got: ${result}`)
})

test('resolveGate: with a declared gate — &&-chains declared-then-discovery', () => {
  const result = resolveGate('node --test x')
  // The declared gate must come before the find-based discovery via &&
  const andIdx = result.indexOf('&&')
  assert.ok(andIdx > 0, `expected && to appear after declared gate, got: ${result}`)
  assert.ok(result.slice(0, andIdx).includes('node --test x'), `declared gate must precede &&, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with node_modules prune', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes("-not -path '*/node_modules/*'"), `expected -not -path '*/node_modules/*' prune, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with .git prune', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes("-not -path '*/.git/*'"), `expected -not -path '*/.git/*' prune, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with .claude prune (skips ~100 stale worktree suites)', () => {
  // The .claude/ exclusion keeps a repo-root gate run from executing the stale duplicate
  // *.test.sh suites under .claude/worktrees/ (WAR's own task worktrees). Mirrored by
  // assert-test-in-diff.sh's match_default arm (ADR 0006 floor/gate alignment).
  const result = resolveGate('node --test x')
  assert.ok(result.includes("-not -path '*/.claude/*'"), `expected -not -path '*/.claude/*' prune, got: ${result}`)
})

test('resolveGate: with a declared gate — runs each suite as bash "$f" with || exit 1', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
  assert.ok(result.includes('|| exit 1'), `expected || exit 1 in result, got: ${result}`)
})

test('resolveGate: empty string — yields discovery clause alone (no leading &&)', () => {
  const result = resolveGate('')
  assert.ok(!result.startsWith('&&'), `result must not start with &&, got: ${result}`)
  // Must still discover bash suites
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
})

test('resolveGate: null — yields discovery clause alone (no leading &&)', () => {
  const result = resolveGate(null)
  assert.ok(!result.startsWith('&&'), `result must not start with &&, got: ${result}`)
  // Must still discover bash suites
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
})

test('resolveGate: includes printf banner for each suite', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('printf'), `expected printf banner in result, got: ${result}`)
  assert.ok(result.includes('gate(bash)'), `expected gate(bash) label in result, got: ${result}`)
})

// Idempotence trio (ADR 0036): the engine now composes plan.gate AND the Lead still pre-resolves via
// --resolve-gate, so resolveGate MUST be idempotent — composing an already-composed gate is a no-op.
// The pre-composed inputs are built from resolveGate's OWN output, never a hardcoded composed string,
// so a partial move of the detector/composer token pairing would red these.
test('resolveGate: idempotent — an already-composed gate (built from resolveGate output) is returned BYTE-UNCHANGED', () => {
  const composed = resolveGate('node --test x')      // pre-composed input from resolveGate's own output
  assert.equal(resolveGate(composed), composed,
    'a gate already carrying the discovery clause is returned unchanged (no second discovery loop appended)')
})

test('resolveGate: idempotent — resolveGate(resolveGate(g)) === resolveGate(g) for a plain gate', () => {
  const g = 'make gate'
  assert.equal(resolveGate(resolveGate(g)), resolveGate(g),
    'double composition equals single composition (idempotence)')
})

test('resolveGate: idempotent — empty/null still yields the discovery-only clause, itself idempotent', () => {
  const disco = resolveGate(null)
  assert.equal(resolveGate(''), disco, 'empty and null both yield the same discovery-only clause (unchanged)')
  assert.ok(!disco.startsWith('&&') && disco.includes('*.test.sh') && disco.includes('bash "$f"'),
    'the discovery-only clause has no leading && and still discovers/runs bash suites')
  assert.equal(resolveGate(disco), disco,
    'the discovery-only clause is itself idempotent under re-composition (it already carries the token)')
})

// ---------------------------------------------------------------------------
// CLI usage string — pinned to the implemented verb set
// ---------------------------------------------------------------------------
// The usage line must document every mode the CLI actually handles, including
// --resolve-gate (the Lead calls `war-config.mjs --resolve-gate <base>` to get
// the self-discovering gate string). Runs the live `--help` output so a usage
// line that drifts from the implemented flag handlers goes red.
test('CLI --help usage documents the implemented verb set (incl --resolve-gate)', () => {
  const usage = execFileSync('node', [join(__dir, 'war-config.mjs'), '--help'], { encoding: 'utf8' })
  for (const verb of ['--preset', '<path>', '--stdin', '--resolve-gate', '--fill-defaults']) {
    assert.ok(usage.includes(verb), `usage line must document ${verb}; got: ${usage.trim()}`)
  }
})

test('drift-guard: inline HARD_ESCALATION_REASONS in workflow-template.js matches canonical export in land-decision.mjs (#36)', () => {
  // workflow-template.js cannot import ES modules so it duplicates the constant inline.
  // This test pins that inline literal to the canonical export in land-decision.mjs.
  // dep-failed was the Task 1 (F02) foundation; land_stale pre-existed; Task 4 (F04/R3) added gate-evidence (6 items total).
  // L1 (unify): 'unrunnable-deps' is now in land-decision.mjs too — the inline literal and the
  // canonical export are IDENTICAL (exact equality, no scheduler-local divergence).
  // M2: 'no-test' added to both mirrors (8 members). Container-packaging: 'unpackaged' added to both mirrors (9 members total).
  //
  // The template has:
  //   const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged']
  const match = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(match, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  // Normalize single-quoted strings to double-quoted for JSON.parse.
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  // EXACT EQUALITY: the inline literal must equal the canonical export, member-for-member (order-insensitive).
  assert.deepEqual([...parsed].sort(), [...HARD_ESCALATION_REASONS].sort(),
    'inline HARD_ESCALATION_REASONS must equal the canonical export exactly (no divergence)')
  assert.ok(HARD_ESCALATION_REASONS.includes('unrunnable-deps'), 'unrunnable-deps must be in canonical HARD_ESCALATION_REASONS (L1 unify)')
  assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'), 'dep-failed must be in HARD_ESCALATION_REASONS (F02 foundation)')
  assert.ok(HARD_ESCALATION_REASONS.includes('no-test'), 'no-test must be in canonical HARD_ESCALATION_REASONS (M2)')
  assert.ok(HARD_ESCALATION_REASONS.includes('unpackaged'), 'unpackaged must be in canonical HARD_ESCALATION_REASONS (container-packaging floor)')
})

// ---------------------------------------------------------------------------
// Task 2 — Coverage meta-test + doc contracts (F12)
// ---------------------------------------------------------------------------

// --- Coverage meta-test (D5): all *.test.sh are reachable by resolveGate discovery ---

test('coverage meta-test: all *.test.sh files in the repo are not under pruned paths (node_modules, .git)', () => {
  // Walk the repo to find every *.test.sh (pruning node_modules and .git as resolveGate does).
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.sh'))
  // There must be at least the four known suites — count-or-set assertion, NOT hardcoded 3.
  // We know there are currently four; this fails if any new one gets silently orphaned OR
  // if one of the expected four disappears (guard in both directions).
  const EXPECTED_SUITES = [
    'hooks/validate-worktree-scope.test.sh',
    'hooks/clean-surface-war-worktree.test.sh',
    'skills/war/assets/provision-worktrees.test.sh',
    'skills/war/assets/refinery-surface.test.sh',
  ].map(p => join(REPO_ROOT, p))

  for (const expected of EXPECTED_SUITES) {
    assert.ok(
      found.includes(expected),
      `Expected *.test.sh suite not found by repo walk (would be silently orphaned by resolveGate): ${expected}`
    )
  }
  // The discovered count must be >= 4 — a new suite appearing means it IS discovered (no orphan possible)
  // because the walk uses the same pruning as resolveGate (node_modules + .git).
  assert.ok(found.length >= 4, `Expected at least 4 *.test.sh suites, found ${found.length}: ${found.join(', ')}`)
})

test('coverage meta-test: none of the *.test.sh files sit under a pruned path', () => {
  // Confirm the suites are NOT under node_modules or .git — i.e. the find command will reach them.
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.sh'))
  for (const p of found) {
    const rel = relative(REPO_ROOT, p)
    assert.ok(!rel.includes('node_modules'), `*.test.sh inside node_modules would be pruned: ${rel}`)
    assert.ok(!rel.startsWith('.git'), `*.test.sh inside .git would be pruned: ${rel}`)
  }
})

test('coverage meta-test: resolveGate discovery clause covers the repo (find + node_modules + .git prunes match the walk)', () => {
  // The resolveGate discovery string is: find . -type f -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort
  // Our walkFiles uses the same pruning. This test asserts that the discovery pattern's
  // pruning is logically identical to the walk — by checking the command text.
  const cmd = resolveGate('node --test x')
  assert.ok(cmd.includes('-not -path \'*/node_modules/*\''), `expected -not -path '*/node_modules/*' prune, got: ${cmd}`)
  assert.ok(cmd.includes('-not -path \'*/.git/*\''), `expected -not -path '*/.git/*' prune, got: ${cmd}`)
  assert.ok(cmd.includes("name '*.test.sh'"), `expected name '*.test.sh' find pattern, got: ${cmd}`)
})

// --- Node-test breadth assertion (resolves Open decision #1) ---

test('node-test breadth: all *.test.mjs files in the repo are under skills/ (reachable by skills/**/*.test.mjs glob)', () => {
  // The declared gate uses `node --test 'skills/**/*.test.mjs'` which only reaches skills/.
  // Assert that every *.test.mjs file in the repo (excluding pruned paths) is under skills/.
  // Any file outside skills/ would be silently orphaned by the declared node glob.
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs'))
  const outsideSkills = found.filter(p => {
    const rel = relative(REPO_ROOT, p)
    return !rel.startsWith('skills/')
  })
  assert.deepEqual(
    outsideSkills,
    [],
    `These *.test.mjs files are outside skills/ and would be silently orphaned by 'node --test skills/**/*.test.mjs':\n${outsideSkills.map(p => '  ' + relative(REPO_ROOT, p)).join('\n')}`
  )
})

test('node-test breadth: skills/ contains at least the expected set of *.test.mjs suites', () => {
  // Sanity check that we actually found the known suites (guards against an accidentally empty walk).
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs'))
  const inSkills = found.filter(p => relative(REPO_ROOT, p).startsWith('skills/'))
  const EXPECTED_MJES = [
    'skills/_shared/provision.test.mjs',
    'skills/war/assets/land-decision.test.mjs',
    'skills/war/assets/war-config.test.mjs',
    'skills/war/assets/workflow-template.test.mjs',
  ].map(p => join(REPO_ROOT, p))
  for (const expected of EXPECTED_MJES) {
    assert.ok(
      inSkills.includes(expected),
      `Expected *.test.mjs not found under skills/: ${expected}`
    )
  }
})

// --- Doc-contract assertions ---

test('doc-contract: SKILL.md mentions --resolve-gate for the gate step', () => {
  const text = readDoc('skills/war/SKILL.md')
  assert.ok(
    text.includes('--resolve-gate'),
    'SKILL.md must mention --resolve-gate in the gate detection step (contract: Lead resolves gate via war-config.mjs --resolve-gate)'
  )
})

test('doc-contract: war-refiner.md states the gate runs all runners / is a resolved command', () => {
  const text = readDoc('agents/war-refiner.md')
  // The refiner doc must describe the gate as running all runners (multi-runner awareness).
  const hasAllRunners = text.includes('all runner') || text.includes('resolved gate') || text.includes('all runners')
  assert.ok(
    hasAllRunners,
    'war-refiner.md must state the gate is a resolved command running all runners (see F12 contract)'
  )
})

test('doc-contract: schemas.md describes overrides.gate as the declared base (not the resolved string)', () => {
  const text = readDoc('skills/war/references/schemas.md')
  // schemas.md must clarify that overrides.gate is the declared base and resolveGate still appends discovery.
  const mentionsGateBase = text.includes('declared base') || text.includes('declared gate') || text.includes('self-discovering')
  assert.ok(
    mentionsGateBase,
    'schemas.md must clarify that overrides.gate is the declared base and the resolved gate is self-discovering (F12 open decision #2)'
  )
})

// --- Learnings read-path doc contracts (T2, #534) ---
// Each grep is SCOPED to the clause it guards (by slicing the sentence that owns the token)
// so removing that specific clause's --repo/pointer duty makes THIS test — not another — go red.

test('doc-contract: SKILL.md prefetch clause passes --repo (read-path wiring, #534)', () => {
  const text = readDoc('skills/war/SKILL.md')
  // The prefetch invocation is the batched `query --queries <file>` line. Slice the sentence
  // that owns it and assert --repo lives inside — so dropping --repo from the prefetch (only)
  // fails here even though the Gate 2 render clause also carries --repo.
  const marker = 'query --queries <file>'
  const idx = text.indexOf(marker)
  assert.ok(idx >= 0, 'SKILL.md must retain the batched `query --queries <file>` prefetch invocation')
  // Bound the clause to the end of its Markdown paragraph (blank line).
  const clauseEnd = text.indexOf('\n\n', idx)
  const clause = text.slice(idx, clauseEnd === -1 ? undefined : clauseEnd)
  assert.ok(
    clause.includes('--repo'),
    'SKILL.md prefetch clause (`query --queries`) must pass `--repo <resolved repo root>` so prefetch reads the repo root (#534)'
  )
})

test('doc-contract: SKILL.md Gate 2 render-index passes --local AND --repo (read-path wiring, #534)', () => {
  const text = readDoc('skills/war/SKILL.md')
  // The Gate 2 render is the render-index that "regenerates the local MEMORY.md projection".
  // --local is required (the CLI fails loud rather than guess <cwd>/memory) and --repo keeps
  // a repo-adopted store's [repo] rows on re-render (#534).
  const marker = 'render-index --local <local root> --repo'
  assert.ok(
    text.includes(marker),
    'SKILL.md Gate 2 publication must run `render-index --local <local root> --repo <resolved repo root>` — --local so the projection lands in the project store, --repo so [repo] rows survive re-render (#534)'
  )
})

test('doc-contract: SKILL.md Gate 2 has the append-if-absent CLAUDE.md pointer duty (#534)', () => {
  const text = readDoc('skills/war/SKILL.md')
  // The pointer duty: append (if absent) the ratified pointer line to the target repo's CLAUDE.md,
  // in the same docs(learnings) commit. Guard the duty prose AND the ratified line's unique phrase.
  assert.ok(
    text.includes('CLAUDE.md') && text.includes('append'),
    'SKILL.md must state the append-if-absent CLAUDE.md pointer duty in the Gate 2 publication step (#534)'
  )
  assert.ok(
    text.includes('Durable engineering lessons live in'),
    'SKILL.md must carry the ratified CLAUDE.md pointer line verbatim (`Durable engineering lessons live in …`) (#534)'
  )
})

// Pointer byte-identity (#656, D4): the ratified "Durable engineering lessons live" pointer line is
// duplicated across three canonical surfaces (CLAUDE.md, the /war SKILL, the lessons-learned migration
// reference). CLAUDE.md calls it "ratified and byte-identical across surfaces — never reword it", but the
// #534 duty test above only asserts PRESENCE — a reworded copy on one surface still passes it
// (`gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity`). This binds all three to
// each other byte-for-byte. Scope is these three surfaces ONLY — never a changelog/release-blurb, whose
// quoting of old wording must not trip the guard (`release-blurb-describing-a-rename-trips-the-renames-
// own-absence-guard`). The blockquote/indentation PREFIX legitimately differs per surface, so extraction
// starts at the 📚 lead marker (the first byte of the ratified content). The #534 duty test is orthogonal
// and stays.
test('pointer byte-identity: the ratified pointer line is byte-identical across the three canonical surfaces (#656, D4)', () => {
  const ANCHOR = 'Durable engineering lessons live'
  const LEAD = '📚'
  const SURFACES = ['CLAUDE.md', 'skills/war/SKILL.md', 'skills/lessons-learned/references/migration.md']
  const extractPointer = relPath => {
    const text = readDoc(relPath)
    const anchorIdx = text.indexOf(ANCHOR)
    assert.ok(anchorIdx >= 0, `${relPath} must carry the ratified pointer line (anchor "${ANCHOR}")`)
    // Isolate the single line owning the anchor, then slice from the 📚 lead marker so each surface's
    // legitimately-different blockquote/indentation prefix is excluded from the byte comparison.
    const lineStart = text.lastIndexOf('\n', anchorIdx) + 1
    const nlIdx = text.indexOf('\n', anchorIdx)
    const line = text.slice(lineStart, nlIdx === -1 ? undefined : nlIdx)
    const leadIdx = line.indexOf(LEAD)
    assert.ok(leadIdx >= 0, `${relPath} pointer line must retain the ${LEAD} lead marker`)
    return line.slice(leadIdx)
  }
  const [canonical, ...rest] = SURFACES.map(extractPointer)
  rest.forEach((pointer, i) => {
    assert.equal(pointer, canonical,
      `${SURFACES[i + 1]} pointer line must be byte-identical to ${SURFACES[0]} — the ratified pointer ` +
      `line is byte-identical across surfaces; reword it on all three canonical surfaces or none`)
  })
})

// ---------------------------------------------------------------------------
// Servitor learnings write path doc contracts (#584, End-state 6)
// Token-anchored + case-tolerant (`prompt-only-clause-grep-guard-must-tolerate-sentence-case`);
// the three existing Gate-2 locks above (render-index --local AND --repo, the pointer duty,
// prefetch --repo) stay green unmodified.
// ---------------------------------------------------------------------------

// Slice Setup step 4 (the "two memory roots" item) from its anchor to the seed-render sub-bullet.
function setupTwoRootsSection() {
  const text = readDoc('skills/war/SKILL.md')
  const start = text.indexOf('Resolve the **two memory roots**')
  assert.ok(start >= 0, 'SKILL.md must retain the Setup "two memory roots" step')
  const end = text.indexOf('Setup seed render', start)
  return text.slice(start, end === -1 ? undefined : end)
}

// Slice the Gate-2 publication step from its anchor to the next top-level heading.
function gate2Section() {
  const text = readDoc('skills/war/SKILL.md')
  const start = text.indexOf('**Post-servitor publication (Gate 2')
  assert.ok(start >= 0, 'SKILL.md must retain the Gate 2 post-servitor publication step')
  const end = text.indexOf('\n## ', start)
  return text.slice(start, end === -1 ? undefined : end)
}

test('doc-contract: SKILL.md Setup step 4 threads memoryLocalRoot and names the memory-probe omission producer (#584)', () => {
  const section = setupTwoRootsSection()
  const lc = section.toLowerCase()
  assert.ok(section.includes('memoryLocalRoot'), 'Setup step 4 must thread `memoryLocalRoot` (the servitor\'s only writable path)')
  assert.ok(
    lc.includes('memory probe') && (lc.includes('omit') || lc.includes('omission')),
    'Setup step 4 must name the memory-probe failure as the producer that omits memoryLocalRoot (Wrap-up self-skips)'
  )
})

test('doc-contract: SKILL.md drops the retired scope-hook-glob compatibility clause (Task 2 obsoletes it, #584)', () => {
  const text = readDoc('skills/war/SKILL.md')
  assert.ok(
    !text.includes('must still match the servitor scope-hook'),
    'SKILL.md must drop the retired "must still match the servitor scope-hook\'s glob" clause — the servitor has no repo-root write left'
  )
})

test('doc-contract: SKILL.md Gate 2 carries the files_written reconciliation assertion (#584)', () => {
  const section = gate2Section()
  const lc = section.toLowerCase()
  assert.ok(section.includes('files_written'), 'Gate 2 must name the servitorResult.files_written reconciliation')
  assert.ok(
    lc.includes('reconciliation') || lc.includes('prefix check'),
    'Gate 2 files_written check must be an absolute-prefix reconciliation (fail loud on a stray path)'
  )
})

test('doc-contract: SKILL.md Gate 2 names the p<N>-publication worktree and the crash-heal scan (#584)', () => {
  const section = gate2Section()
  assert.ok(
    section.includes('p<N>-publication'),
    'Gate 2 must name the phase-scoped `p<N>-publication` worktree'
  )
  assert.ok(
    section.includes('ensure-publication-worktree') && section.includes('remove-publication-worktree'),
    'Gate 2 must use the provision-worktrees.sh publication subcommand pair (never a prose git worktree add)'
  )
  // Heal-clause token: the entry scan for a leftover publication worktree.
  assert.ok(
    section.includes('p*-publication'),
    'Gate 2 must carry the entry heal-scan clause (leftover `p*-publication` worktree ⇒ clean-remove / dirty-escalate)'
  )
})

test('doc-contract: SKILL.md Gate 2 carries the retry-once CAS rule (#584)', () => {
  const section = gate2Section().toLowerCase()
  assert.ok(
    section.includes('retry once') && section.includes('escalate'),
    'Gate 2 push failure must fetch/replay, retry once, then escalate (never force)'
  )
})

test('doc-contract: SKILL.md Gate 2 carries the copy-with-marker / marker-after-push rule (#584)', () => {
  const section = gate2Section()
  const lc = section.toLowerCase()
  assert.ok(section.includes('metadata.promoted'), 'Gate 2 must name the `metadata.promoted:` marker shape')
  assert.ok(
    lc.includes('never delete'),
    'Gate 2 marker rule must state the local original is never deleted (copy-with-marker, not a move)'
  )
  assert.ok(
    lc.includes('after the successful push') || lc.includes('only after the push') || (lc.includes('after') && lc.includes('push')),
    'Gate 2 must stamp the marker only after the successful push'
  )
})

test('doc-contract: SKILL.md Gate 2 carries the overwrite-on-promote rule (#584)', () => {
  const section = gate2Section().toLowerCase()
  assert.ok(
    section.includes('overwrite-on-promote') || (section.includes('overwrit') && section.includes('same-slug')),
    'Gate 2 must state a same-slug repo file is overwritten on promote (the recurrence-update mechanism)'
  )
})

test('doc-contract: swept surfaces no longer offer docs/learnings as a servitor-writable glob or aggregate file (#584)', () => {
  // Enumerated file list — anchored to these files, never a repo-root scan
  // (`absence-guard-search-root-must-anchor-to-subtree`,
  //  `enumerated-file-list-absence-guard-for-rename-with-legitimate-history`).
  // `docs/learnings/` itself is legitimate (the promotion destination) — anchor on the retired
  // *phrasings*: the servitor-writable glob (`docs/learnings/*`) and the aggregate-file shape.
  const sweptSurfaces = [
    'skills/war/SKILL.md',
    'skills/war/references/design.md',
    'skills/war/references/schemas.md',
  ]
  for (const relPath of sweptSurfaces) {
    const text = readDoc(relPath)
    assert.ok(
      !text.includes('docs/learnings/*'),
      `${relPath} must not offer \`docs/learnings/*\` as a servitor-writable glob (servitor writes only the local root now)`
    )
    assert.ok(
      !text.includes('docs/learnings/phase-') && !text.includes('phase-N.md'),
      `${relPath} must not carry the retired \`docs/learnings/phase-<N>.md\` aggregate-file shape (one file per fact, local-root only)`
    )
  }
})

// ---------------------------------------------------------------------------
// Run-lifecycle robustness doc contracts (#582/#583/#586, End-state 6 — SKILL.md half)
// Token-anchored + case-tolerant per `prompt-only-clause-grep-guard-must-tolerate-sentence-case`.
// ---------------------------------------------------------------------------

test('doc-contract: SKILL.md launch step names the derivation trio planSlug/runId/worktreeRoot (I/H)', () => {
  const text = readDoc('skills/war/SKILL.md')
  // The launch instruction is the "Run one Workflow per phase" step; assert the trio is named there.
  const marker = 'Run **one Workflow per phase**'
  const idx = text.indexOf(marker)
  assert.ok(idx >= 0, 'SKILL.md must retain the "Run one Workflow per phase" launch step')
  const clause = text.slice(idx, text.indexOf('\n\n', idx) === -1 ? undefined : text.indexOf('\n\n', idx))
  for (const key of ['planSlug', 'runId', 'worktreeRoot']) {
    assert.ok(
      clause.includes(key),
      `SKILL.md launch step must name required top-level arg \`${key}\` (I: launch-step documentation)`
    )
  }
})

// Helper: slice the `### Recovery relaunch` subsection body (heading → next top-level heading).
function recoveryRelaunchSection() {
  const text = readDoc('skills/war/SKILL.md')
  const lc = text.toLowerCase()
  const start = lc.indexOf('### recovery relaunch')
  assert.ok(start >= 0, 'SKILL.md must carry a `### Recovery relaunch` subsection (G)')
  // Bound at the next `## ` (top-level) heading after the subsection.
  const rest = text.indexOf('\n## ', start)
  return text.slice(start, rest === -1 ? undefined : rest)
}

test('doc-contract: SKILL.md recovery-relaunch names both entry points (single-task + whole-phase) (G)', () => {
  const section = recoveryRelaunchSection().toLowerCase()
  assert.ok(section.includes('single-task'), 'recovery-relaunch body must name the single-task retry entry point')
  assert.ok(
    section.includes('whole-phase'),
    'recovery-relaunch body must name the whole-phase relaunch entry point'
  )
  // Whole-phase relaunch covers held:workflow-error and retries-exhausted held:phase-incomplete.
  assert.ok(
    section.includes('held:workflow-error'),
    'recovery-relaunch whole-phase entry must name held:workflow-error'
  )
  assert.ok(
    section.includes('held:phase-incomplete'),
    'recovery-relaunch whole-phase entry must name held:phase-incomplete'
  )
})

test('doc-contract: SKILL.md recovery-relaunch names owned-file continuity, never resumeFromRunId, keep-commits-as-WIP (G)', () => {
  const section = recoveryRelaunchSection()
  const lc = section.toLowerCase()
  assert.ok(lc.includes('owned-file') || lc.includes('ownedfile'), 'recovery-relaunch must name owned-file continuity')
  // resumeFromRunId is a code identifier — assert it appears (as the forbidden path) verbatim.
  assert.ok(
    section.includes('resumeFromRunId'),
    'recovery-relaunch must name resumeFromRunId (the forbidden replay path)'
  )
  // Keep-commits-as-WIP directive: fix forward, never rewrite/reset/force the kept commits.
  assert.ok(
    lc.includes('kept') || lc.includes('keep them') || lc.includes('fix') && lc.includes('forward'),
    'recovery-relaunch must direct keeping prior commits and fixing forward (no reset/force)'
  )
  assert.ok(
    lc.includes('reset') || lc.includes('force') || lc.includes('rewritten'),
    'recovery-relaunch must state prior commits are never rewritten (no reset/--force)'
  )
})

test('doc-contract: SKILL.md held:workflow-error prose names the provision-refusal / no-evidence case (C)', () => {
  const text = readDoc('skills/war/SKILL.md')
  const lc = text.toLowerCase()
  const idx = lc.indexOf('`held:workflow-error` — terminal')
  assert.ok(idx >= 0, 'SKILL.md must retain the held:workflow-error terminal outcome bullet')
  // Bound to the end of the bullet (next list-item at the same indent, or blank line).
  const bulletEnd = text.indexOf('\n  - ', idx)
  const clause = text.slice(idx, bulletEnd === -1 ? undefined : bulletEnd).toLowerCase()
  assert.ok(
    clause.includes('refus') || clause.includes('no execution evidence') || clause.includes('no-result'),
    'held:workflow-error class examples must name the provision-refusal / no-execution-evidence case (C)'
  )
})

test('doc-contract: SKILL.md env-blocked bullet carries the evidence-gate token (C)', () => {
  const text = readDoc('skills/war/SKILL.md')
  const lc = text.toLowerCase()
  const idx = lc.indexOf('`env-blocked` task outcome')
  assert.ok(idx >= 0, 'SKILL.md must retain the env-blocked task outcome bullet')
  const bulletEnd = text.indexOf('\n- ', idx)
  const clause = text.slice(idx, bulletEnd === -1 ? undefined : bulletEnd).toLowerCase()
  assert.ok(
    clause.includes('evidence-gate') || clause.includes('evidence gate') || clause.includes('execution evidence'),
    'env-blocked bullet must note the outcome is evidence-gated (no execution evidence ⇒ held:workflow-error) (C)'
  )
})

test('doc-contract: no stale `_polish` token in the swept doc surfaces (rename to p<N>-polish; ADR 0012 excluded)', () => {
  // Enumerated file list — search is anchored to these files, never a repo-root scan
  // (learnings `enumerated-file-list-absence-guard-for-rename-with-legitimate-history`,
  //  `absence-guard-search-root-must-anchor-to-subtree`). docs/adr/0012-* keeps its historical
  //  `_polish` mention and is deliberately NOT in this list.
  const sweptSurfaces = [
    'skills/war/SKILL.md',
    'skills/war/references/design.md',
    'CONTEXT.md',
  ]
  for (const relPath of sweptSurfaces) {
    const text = readDoc(relPath)
    assert.ok(
      !text.includes('_polish'),
      `${relPath} must not carry a stale \`_polish\` token — the polish worktree path is now \`p<N>-polish\` (D)`
    )
  }
})

// The Per-phase retired-token sweep (#930) is a Lead-run, judgment-triggered detection step that
// catches stale command recipes in memory lessons when a phase retires/renames/consolidates a
// land/merge/escalation mechanism. It files debt (a `war-followup` issue) and records a line — it
// NEVER blocks a land, and it is NOT the ADR 0012 phase-close coherence sweep. Lock the clause's
// load-bearing elements by anchor, scoped to the clause region so the 3 pre-existing `war-followup`
// occurrences elsewhere in SKILL.md don't satisfy the routing anchor. Style: #534 prefetch-clause
// slicing (case-insensitive indexOf + region bound at the next `**Post-servitor publication` bold
// lead-in, the held:workflow-error bounding move); mid-sentence anchors only, never whole sentences
// (learning `prompt-only-clause-grep-guard-must-tolerate-sentence-case` — rewording tolerance).
test('doc-contract: SKILL.md Per-phase retired-token sweep clause — trigger family, war-followup routing, record line (#930)', () => {
  const text = readDoc('skills/war/SKILL.md')
  const lc = text.toLowerCase()
  // Region extraction: the clause opens with the `Retired-token sweep` bold lead-in and runs to the
  // next bold-lead-in paragraph (`**Post-servitor publication`). Pre-fix this anchor has zero
  // occurrences in SKILL.md (provably red at the dispatch base).
  const anchor = lc.indexOf('retired-token sweep')
  assert.ok(anchor >= 0, 'SKILL.md must carry the Per-phase retired-token sweep clause (#930)')
  // Section containment: the clause lives under `## Per phase (in DAG order)`, before `## Resume`.
  const perPhase = lc.indexOf('## per phase (in dag order)')
  const resume = lc.indexOf('## resume')
  assert.ok(perPhase >= 0 && resume > perPhase,
    'SKILL.md must retain `## Per phase (in DAG order)` before `## Resume`')
  assert.ok(anchor > perPhase && anchor < resume,
    'the retired-token sweep clause must sit inside `## Per phase (in DAG order)` (after that heading, before `## Resume`)')
  const end = lc.indexOf('**post-servitor publication', anchor)
  assert.ok(end > anchor, 'the retired-token sweep clause must precede the `**Post-servitor publication` block')
  const region = lc.slice(anchor, end)
  // Trigger family — retire / rename / consolidate a land, merge, or escalation mechanism.
  for (const tok of ['retire', 'rename', 'consolidate', 'land', 'merge', 'escalation']) {
    assert.ok(region.includes(tok),
      `retired-token sweep clause must name the trigger-family token \`${tok}\` (retire/rename/consolidate a land/merge/escalation mechanism)`)
  }
  // Routing — repo-root load-bearing hits file one consolidated `war-followup` issue. Region scope
  // discriminates this from the 3 pre-existing `war-followup` occurrences elsewhere in SKILL.md.
  assert.ok(region.includes('war-followup'),
    'retired-token sweep clause must route repo-root load-bearing hits to a `war-followup` issue')
  // Record line — the literal greppable prefix plus the no-trigger `n/a` arm.
  assert.ok(region.includes('retired-token sweep:'),
    'retired-token sweep clause must state the record line with the literal `retired-token sweep:` prefix')
  assert.ok(region.includes('n/a'),
    'retired-token sweep clause must state the `retired-token sweep: n/a` no-trigger arm')
})

// ---------------------------------------------------------------------------
// Task 3 — F06: Default rosterPolicy 'all'; presets; historical-spec doc contract
// ---------------------------------------------------------------------------

// 2026-07-03 operator default flip: rosterPolicy default is now 'auto' (supersedes F06's 'all').
test('fillDefaults: audit.rosterPolicy defaults to auto (Lead seeds 1-N seats per task)', () => {
  const c = fillDefaults({})
  assert.equal(c.audit.rosterPolicy, 'auto',
    'fillDefaults({}) must produce audit.rosterPolicy === "auto" (Lead seeds per-task rosters by blast radius)')
})

test('preset economy keeps explicit rosterPolicy:solo (deepMerge override unaffected by DEFAULTS flip)', () => {
  const c = presetConfig('economy')
  assert.equal(c.audit.rosterPolicy, 'solo',
    'economy preset must keep rosterPolicy:"solo" regardless of the DEFAULTS value')
})

test('preset thorough inherits rosterPolicy:auto', () => {
  const c = presetConfig('thorough')
  assert.equal(c.audit.rosterPolicy, 'auto',
    'thorough preset must inherit rosterPolicy:"auto" (1-5 seats seeded per task)')
})

test('preset balanced (= fillDefaults) is rosterPolicy:auto', () => {
  const c = presetConfig('balanced')
  assert.equal(c.audit.rosterPolicy, 'auto',
    'balanced preset (= DEFAULTS) must be rosterPolicy:"auto"')
})

test('F06 — doc-contract: design spec balanced preset table updated to covenPolicy all', () => {
  const text = readDoc('docs/specs/2026-06-18-war-room-design.md')
  // The design spec preset table had balanced=auto; must now show all
  // Look for the table row for balanced having 'all' rather than 'auto'
  const hasAll = text.includes('`all`') || text.includes('"all"') || text.includes("'all'") ||
    text.includes('covenPolicy: all') || text.includes('covenPolicy:"all"')
  assert.ok(hasAll,
    'design spec must show balanced covenPolicy as all in the preset table (F06)')
})

// ---------------------------------------------------------------------------
// Task 3 — F07: Behavioral drift guards for inline mirrors in workflow-template.js
// ---------------------------------------------------------------------------
// Strategy: extract inline logic by CONSTRUCT (regex/marker) not by line number,
// then rebuild via new Function / new AsyncFunction and compare to the canonical export.

// ---------------------------------------------------------------------------
// spawnOpts drift guard (D1): the combined spawnOpts/validateRoster/widenRoster
// marker covers all three mirrors
// ---------------------------------------------------------------------------

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — default effort (omit effort)', () => {
  // Extract the inline spawn arrow function body under the combined Keep-in-sync marker.
  // Template: const spawn = role => { const a = agents[role] || {}; ... }
  // We rebuild it as a standalone function(agents, ROLE_MODEL, role) and call it.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  // Reconstruct as a plain function injecting the two closed-over locals the inline uses.
  // The inline body references `agents` and `ROLE_MODEL` — we inject them as parameters.
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role',
    match[1])
  // Test rows: each role with default effort — inline omits effort (== canonical)
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model, effort: 'default' } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, default effort) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — UNDEFINED/falsy effort (key equivalence proof)', () => {
  // This is the critical row: inline uses `a.effort && a.effort !== 'default'`
  // while canonical uses `effort === 'default'`. With undefined effort:
  //   inline: undefined && ... = false → omit effort (correct)
  //   canonical: undefined === 'default' = false → omit effort (correct)
  // Both agree, but a drift in condition would surface here before other rows.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    // effort is UNDEFINED — the canonical falls through to 'default', omitting effort from result
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, undefined effort) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
    // Sanity: both should omit effort (not include it)
    assert.ok(!Object.prototype.hasOwnProperty.call(canonical, 'effort'),
      `canonical spawnOpts(${role}, undefined effort) should omit effort key`)
    assert.ok(!Object.prototype.hasOwnProperty.call(inline, 'effort'),
      `inline spawnOpts(${role}, undefined effort) should omit effort key`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — non-default effort (include effort)', () => {
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  // Non-default effort values
  const effortCases = [['worker', 'max'], ['auditor', 'high'], ['refiner', 'low'], ['servitor', 'medium']]
  for (const [role, effort] of effortCases) {
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model, effort } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, effort=${effort}) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
    // Sanity: both should include effort
    assert.equal(canonical.effort, effort, `canonical should include effort=${effort}`)
    assert.equal(inline.effort, effort, `inline should include effort=${effort}`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — missing model (fallback to ROLE_MODEL)', () => {
  // When agents[role].model is absent, both canonical and inline fall back to ROLE_MODEL defaults.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    // agents[role] exists but has no model key — should fall back
    const config = { agents: { [role]: { effort: 'default' } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, missing model) diverges from canonical`)
    // Both should produce the role's default model
    assert.equal(canonical.model, ROLE_MODEL_CANONICAL[role],
      `canonical falls back to ROLE_MODEL for ${role}`)
    assert.equal(inline.model, ROLE_MODEL_CANONICAL[role],
      `inline falls back to ROLE_MODEL for ${role}`)
  }
})

// ---------------------------------------------------------------------------
// validateRoster/widenRoster drift guards (D9): the same combined
// spawnOpts/validateRoster/widenRoster marker covers all three mirrors
// ---------------------------------------------------------------------------

const VR_EXTRACT = /const validateRoster\s*=\s*roster\s*=>\s*\{([\s\S]*?)\n\}/
const WR_EXTRACT = /const widenRoster\s*=\s*\(roster,\s*defaultRoster\)\s*=>\s*\{([\s\S]*?)\n\}/

test('drift-guard(F07): inline validateRoster mirror equals canonical validateRoster across accept/reject cases', () => {
  const match = templateText.match(VR_EXTRACT)
  assert.ok(match, 'inline validateRoster arrow not found in workflow-template.js')
  const inline = new Function('roster', match[1])
  const cases = [
    [{ lens: 'correctness' }],
    [{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }],
    DEFAULTS.audit.roster,
    [],
    undefined,
    'not-an-array',
    ['a', 'b', 'c', 'd', 'e', 'f'].map(l => ({ lens: l })),
    [{ lens: 'x' }, { lens: 'x' }],
    [{ lens: '' }],
    [{ lens: 42 }],
    [{ lens: 'ok', depth: 'shallow' }],
    ['just-a-string'],
    [null],
  ]
  for (const c of cases) {
    assert.deepEqual(inline(c), validateRoster(c),
      `inline validateRoster diverges from canonical for case ${JSON.stringify(c)}`)
  }
})

test('drift-guard(F07): inline widenRoster mirror equals canonical widenRoster across union/dedupe/cap cases', () => {
  const match = templateText.match(WR_EXTRACT)
  assert.ok(match, 'inline widenRoster arrow not found in workflow-template.js')
  const inline = new Function('roster', 'defaultRoster', match[1])
  const FIVE = ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'performance']
    .map(l => ({ lens: l, depth: 'deep' }))
  const cases = [
    [[{ lens: 'security', depth: 'deep' }], DEFAULTS.audit.roster],
    [[{ lens: 'correctness', depth: 'neighbors' }], DEFAULTS.audit.roster],
    [[{ lens: 'usability', depth: 'neighbors' }], FIVE],
    [DEFAULTS.audit.roster, DEFAULTS.audit.roster],
    [[{ lens: 'a' }], []],
    [[{ lens: 'a' }], undefined],
  ]
  for (const [roster, def] of cases) {
    assert.deepEqual(inline(roster, def), widenRoster(roster, def),
      `inline widenRoster diverges from canonical for case ${JSON.stringify([roster, def])}`)
  }
})

// resolveWidenSource (D4) lives under the same combined spawnOpts/validateRoster/widenRoster/resolveWidenSource
// marker. Its inline arrow references the inline RESERVED_LENSES array, so extract BOTH and inject the
// array into the new Function (mirroring the decideLand extract-and-inject pattern) — this way a drift in
// EITHER the inline RESERVED_LENSES literal or the inline validation logic bites.
const RWS_EXTRACT = /const resolveWidenSource\s*=\s*\(nominated,\s*defaultRoster\)\s*=>\s*\{([\s\S]*?)\n\}/
const RL_INLINE_EXTRACT = /const\s+RESERVED_LENSES\s*=\s*(\[[^\]]*\])/

test('drift-guard(F07): inline resolveWidenSource mirror equals canonical resolveWidenSource across nominated/fallback cases', () => {
  const rwsMatch = templateText.match(RWS_EXTRACT)
  assert.ok(rwsMatch, 'inline resolveWidenSource arrow not found in workflow-template.js')
  const rlMatch = templateText.match(RL_INLINE_EXTRACT)
  assert.ok(rlMatch, 'inline RESERVED_LENSES literal not found in workflow-template.js')
  const inlineReserved = JSON.parse(rlMatch[1].replace(/'/g, '"'))
  // The extracted body references RESERVED_LENSES; inject it as a parameter so the closure resolves.
  const inline = new Function('nominated', 'defaultRoster', 'RESERVED_LENSES', rwsMatch[1])
  const call = (nominated, def) => inline(nominated, def, inlineReserved)

  const DEF = DEFAULTS.audit.roster
  const cases = [
    [['security', 'performance'], DEF],       // valid multi
    [['usability'], DEF],                      // valid single
    [['execution-evidence'], DEF],             // reserved → fallback
    [['security', 'pin-validity'], DEF],       // reserved among valid → whole-field fallback
    [['security', 'security'], DEF],           // duplicate → fallback
    [['security', ''], DEF],                   // empty string → fallback
    [['security', 42], DEF],                   // non-string → fallback
    [[], DEF],                                 // empty array → fallback
    [undefined, DEF],                          // absent → fallback
    ['security', DEF],                         // non-array → fallback
    [['correctness', 'security'], DEF],        // own-lens legal → nominated
  ]
  for (const [nominated, def] of cases) {
    assert.deepEqual(call(nominated, def), resolveWidenSource(nominated, def),
      `inline resolveWidenSource diverges from canonical for case ${JSON.stringify([nominated, def])}`)
  }

  // The inline RESERVED_LENSES literal must itself equal the canonical export (guards a stale inline copy).
  assert.deepEqual(inlineReserved, RESERVED_LENSES,
    'inline RESERVED_LENSES literal in workflow-template.js diverges from canonical RESERVED_LENSES export')
})

// resolveGate (ADR 0036): the inline gate-composition mirror. Extract the arrow body + its own detector
// const and behaviorally compare to canonical resolveGate over the null/empty/plain/pre-composed set — the
// pre-composed case built from the CANONICAL output, so a partial token move (detector const moved in one
// copy only, breaking idempotence) diverges. Registered under the block-head marker's LOGIC_MIRROR entry.
const RG_EXTRACT = /const resolveGate\s*=\s*\(declaredGate\)\s*=>\s*\{([\s\S]*?)\n\}/
const RG_TOKEN_EXTRACT = /const\s+GATE_DISCOVERY_TOKEN\s*=\s*(`[^`]*`)/
test('drift-guard(F07): inline resolveGate mirror equals canonical resolveGate across null/empty/plain/pre-composed cases', () => {
  const rgMatch = templateText.match(RG_EXTRACT)
  assert.ok(rgMatch, 'inline resolveGate arrow not found in workflow-template.js')
  const tokMatch = templateText.match(RG_TOKEN_EXTRACT)
  assert.ok(tokMatch, 'inline GATE_DISCOVERY_TOKEN literal not found in workflow-template.js')
  const inlineToken = new Function(`return (${tokMatch[1]})`)()
  // The extracted body references GATE_DISCOVERY_TOKEN; inject it as a parameter so the closure resolves.
  const inline = new Function('declaredGate', 'GATE_DISCOVERY_TOKEN', rgMatch[1])
  const call = (g) => inline(g, inlineToken)

  const plain = `node --test 'skills/**/*.test.mjs'`
  const cases = [
    null,                 // null → discovery clause alone
    '',                   // empty → discovery clause alone
    plain,                // plain → composes declared && discovery
    resolveGate(plain),   // pre-composed FROM CANONICAL output → idempotent, returned unchanged
  ]
  for (const g of cases) {
    assert.equal(call(g), resolveGate(g),
      `inline resolveGate diverges from canonical for case ${JSON.stringify(g)}`)
  }
  // The inline detector token must be a real substring of the canonical discovery clause (a token move in
  // the inline copy only would recompose the pre-composed case above — this pins the token to canonical too).
  assert.ok(resolveGate(null).includes(inlineToken),
    'inline GATE_DISCOVERY_TOKEN in workflow-template.js is not a substring of the canonical discovery clause (detector/composer drift)')
})

// ---------------------------------------------------------------------------
// decideLand drift guard (D1): the landDecision + HARD_ESCALATION_REASONS markers
// ---------------------------------------------------------------------------

// Helper: extract the inline hardEscalation + landDecision ternary from workflow-template.js
// and rebuild it as an executable function via new Function — mirroring the spawnOpts/validateRoster
// extract-and-execute pattern so that template-side ternary drift (not just array drift) bites.
function buildInlineDecideLand() {
  // Extract the HARD_ESCALATION_REASONS array literal from the template.
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))

  // Extract the inline hardEscalation expression + the 3-branch landDecision ternary.
  // The regex captures from 'const hardEscalation = escalated.some' through 'held:nothing-merged'.
  const ternaryMatch = templateText.match(
    /(const hardEscalation\s*=\s*escalated\.some[\s\S]*?'held:nothing-merged')/
  )
  assert.ok(ternaryMatch, 'inline hardEscalation + landDecision ternary not found in workflow-template.js')

  // Rebuild via new Function — the extracted code references landed, escalated, HARD_ESCALATION_REASONS.
  // Injecting the extracted array as HARD_ESCALATION_REASONS keeps the extraction faithful.
  const fnBody = ternaryMatch[1] + '\nreturn landDecision'
  const fn = new Function('landed', 'escalated', 'HARD_ESCALATION_REASONS', fnBody)
  return ({ landed = [], escalated = [] } = {}) => fn(landed, escalated, inlineReasons)
}

test('drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand logic equals canonical decideLand — empty landed × empty escalated', () => {
  // Extract the inline HARD_ESCALATION_REASONS, hardEscalation + landDecision ternary — the block
  // under the "landDecision mirrors" / "HARD_ESCALATION_REASONS mirrors" Keep-in-sync markers.
  // Uses new Function to execute the LIVE template code so ternary-level drift is detected (not just array drift).
  const inlineDecideLand = buildInlineDecideLand()

  // empty landed × empty escalated → 'held:nothing-merged'
  const args1 = { landed: [], escalated: [] }
  assert.equal(inlineDecideLand(args1), decideLand(args1),
    'inline decideLand(empty,empty) diverges from canonical')
})

test('drift-guard(F07): inline decideLand — non-empty landed × empty escalated → landed', () => {
  const inlineDecideLand = buildInlineDecideLand()

  const args2 = { landed: ['t1', 't2'], escalated: [] }
  assert.equal(inlineDecideLand(args2), decideLand(args2), 'inline decideLand(landed,empty) diverges')
  assert.equal(inlineDecideLand(args2), 'landed', 'expected "landed"')
})

test('drift-guard(F07): inline decideLand — non-empty landed × escalated with a HARD reason → held:escalation', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // All 6 hard reasons must individually hold the land
  for (const reason of HARD_ESCALATION_REASONS) {
    const args = { landed: ['t1'], escalated: [{ task: 't2', reason }] }
    assert.equal(inlineDecideLand(args), decideLand(args),
      `inline decideLand diverges for hard reason "${reason}"`)
    assert.equal(inlineDecideLand(args), 'held:escalation',
      `hard reason "${reason}" must yield held:escalation`)
  }
})

test('drift-guard(F07): inline decideLand — empty landed × escalated with SOFT reason → held:nothing-merged', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // A SOFT reason (env-blocked is not in HARD_ESCALATION_REASONS) + no landed → held:nothing-merged
  const args = { landed: [], escalated: [{ task: 't1', reason: 'env-blocked' }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand diverges for soft reason "env-blocked"')
  assert.equal(inlineDecideLand(args), 'held:nothing-merged',
    'soft reason with no landed → held:nothing-merged')
})

test('drift-guard(F07): inline decideLand — empty landed × HARD escalation → held:escalation', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // empty-landed × HARD-escalation → held:escalation (not held:nothing-merged)
  const args = { landed: [], escalated: [{ task: 't1', reason: HARD_ESCALATION_REASONS[0] }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand(empty,HARD) diverges from canonical')
  assert.equal(inlineDecideLand(args), 'held:escalation',
    'empty-landed × HARD-escalation must yield held:escalation')
})

test('drift-guard(F07): inline decideLand — non-empty landed × SOFT escalation → landed', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // non-empty-landed × SOFT-escalation → landed (soft escalation does not hold the land)
  const args = { landed: ['t1'], escalated: [{ task: 't2', reason: 'env-blocked' }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand(non-empty,SOFT) diverges from canonical')
  assert.equal(inlineDecideLand(args), 'landed',
    'non-empty-landed × SOFT-escalation must yield landed')
})

test('drift-guard(F07): inline HARD_ESCALATION_REASONS equals the canonical export exactly (L1 unify)', () => {
  // L1 (unify): 'unrunnable-deps' is now in land-decision.mjs too — inline and canonical are IDENTICAL
  // (7 members each, no scheduler-local divergence). Exact equality, order-insensitive.
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.deepEqual([...inlineReasons].sort(), [...HARD_ESCALATION_REASONS].sort(),
    'inline HARD_ESCALATION_REASONS must equal the canonical export exactly (no divergence)')
})

// ---------------------------------------------------------------------------
// Classifying meta-guard (D3): every Keep-in-sync/Mirror-of marker is accounted for
// ---------------------------------------------------------------------------
// Markers are NOT 1:1 with drift tests (anchored by construct, not line number):
//   the combined spawnOpts/validateRoster/widenRoster marker → logic-mirror (1 marker, 3 drift-test families)
//   the landDecision marker → logic-mirror covering landDecision (decideLand)
//   the HARD_ESCALATION_REASONS marker → logic-mirror (same decideLand block)
//   the run.provision data-mirror marker → data-mirror (field names) — allowlisted, no behavioral test
// A marker not in either registry → test fails.

test('meta-guard(F07): all Keep-in-sync/Mirror-of markers in workflow-template.js are classified (logic-mirror registry + data-mirror allowlist)', () => {
  // Scan for every Keep-in-sync / Mirror-of / MIRROR-of marker in the template.
  // Strategy: collect every comment line containing these keywords.
  // NOTE: use a NON-global /i regex in the filter predicate — a /gi regex is stateful
  // (.test() advances lastIndex), causing consecutive matching lines to be silently dropped.
  const markerFilterPattern = /Keep in sync|Mirror of|MIRROR of/i
  const lines = templateText.split('\n')
  const markerLines = lines
    .map((line, idx) => ({ line: line.trim(), lineNum: idx + 1 }))
    .filter(({ line }) => markerFilterPattern.test(line))

  // Registry of LOGIC mirrors → each must have ≥1 registered drift test (keyed by a stable identifier).
  // The identifier is a substring of the marker text (robust to line-number shifts).
  const LOGIC_MIRROR_REGISTRY = new Map([
    // Combined marker: "Mirror of war-config.mjs spawnOpts/validateRoster/widenRoster/resolveWidenSource/resolveGate … Keep in sync"
    // → covered by the spawnOpts + validateRoster + widenRoster + resolveWidenSource + resolveGate drift tests
    ['spawnOpts/validateRoster/widenRoster', ['drift-guard(F07): inline spawnOpts', 'drift-guard(F07): inline validateRoster', 'drift-guard(F07): inline widenRoster', 'drift-guard(F07): inline resolveWidenSource', 'drift-guard(F07): inline resolveGate']],
    // Marker: "landDecision mirrors land-decision.mjs (decideLand) … Keep in sync"
    // → covered by decideLand drift tests
    ['landDecision mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
    // Marker: "HARD_ESCALATION_REASONS mirrors land-decision.mjs export … Keep in sync"
    // → covered by the same decideLand drift tests
    ['HARD_ESCALATION_REASONS mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
  ])

  // DATA mirrors → allowlisted (field names, no canonical function to behavioral-test).
  const DATA_MIRROR_ALLOWLIST = [
    // Marker: "This is a MIRROR of war-config.mjs's run.provision/run.provisionSource reads".
    // 'This is a MIRROR of' is the marker's exact lead-in (the marker line ends there; the field
    // tokens sit on the following line). The meta-guard scans line-by-line, so the lead-in
    // fragment needs this anchored entry.
    'This is a MIRROR of',
    'run.provision/run.provisionSource',
    'provisionSource reads',
  ]

  const unaccounted = []
  for (const { line, lineNum } of markerLines) {
    // Check if this marker line is covered by a logic-mirror registry entry.
    let isLogicMirror = false
    for (const [key] of LOGIC_MIRROR_REGISTRY) {
      if (line.includes(key)) { isLogicMirror = true; break }
    }
    if (isLogicMirror) continue

    // Check if this marker line is in the data-mirror allowlist.
    let isDataMirror = false
    for (const allowed of DATA_MIRROR_ALLOWLIST) {
      if (line.includes(allowed)) { isDataMirror = true; break }
    }
    if (isDataMirror) continue

    // Neither: unaccounted marker
    unaccounted.push({ lineNum, line })
  }

  assert.deepEqual(
    unaccounted,
    [],
    `Unaccounted Keep-in-sync/Mirror-of markers found in workflow-template.js.\n` +
    `Each must be either (a) registered in LOGIC_MIRROR_REGISTRY with ≥1 behavioral drift test, ` +
    `or (b) allowlisted in DATA_MIRROR_ALLOWLIST (data-flow fields, no canonical function).\n` +
    `Unaccounted markers:\n` +
    unaccounted.map(m => `  line ${m.lineNum}: ${m.line}`).join('\n')
  )

  // Second half of the meta-guard: verify that every drift test NAME registered in
  // LOGIC_MIRROR_REGISTRY's VALUES actually EXISTS in this test file.
  //
  // Without this, the registry values are decorative — deleting a drift test while
  // leaving the template marker + registry entry intact would keep the first assertion
  // green (marker is classified) while the behavioral coverage is silently gone.
  //
  // Strategy: read this test file's own source and check each registered name string
  // appears as a literal `test('<name>` or `test("<name>` substring.
  const thisFileText = readFileSync(fileURLToPath(import.meta.url), 'utf8')

  const missingDriftTests = []
  for (const [key, testNames] of LOGIC_MIRROR_REGISTRY) {
    for (const testName of testNames) {
      // A test definition looks like: test('drift-guard(F07): inline spawnOpts...')
      // We check for test('<testName> (starts-with match, robust to varying suffixes).
      const singleQuote = `test('${testName}`
      const doubleQuote = `test("${testName}`
      if (!thisFileText.includes(singleQuote) && !thisFileText.includes(doubleQuote)) {
        missingDriftTests.push({ key, testName })
      }
    }
  }

  assert.deepEqual(
    missingDriftTests,
    [],
    `LOGIC_MIRROR_REGISTRY references drift-test names that do not exist in this test file.\n` +
    `A registered test name must appear as a literal test('<name>...) definition.\n` +
    `Deleting a drift test without removing it from LOGIC_MIRROR_REGISTRY is not allowed.\n` +
    `Missing drift tests:\n` +
    missingDriftTests.map(m => `  registry key "${m.key}" → test name "${m.testName}"`).join('\n')
  )

  // Exact-membership assertions for DATA_MIRROR_ALLOWLIST (T1.6):
  // The bare catch-all 'MIRROR of' has been replaced with the anchored 'This is a MIRROR of'.
  assert.ok(!DATA_MIRROR_ALLOWLIST.includes('MIRROR of'),
    "DATA_MIRROR_ALLOWLIST must not contain the bare catch-all 'MIRROR of' (use 'This is a MIRROR of' instead)")
  assert.ok(DATA_MIRROR_ALLOWLIST.includes('This is a MIRROR of'),
    "DATA_MIRROR_ALLOWLIST must contain the anchored entry 'This is a MIRROR of'")
})

test('meta-guard(F07): sanity — exactly 4 Keep-in-sync/Mirror-of markers exist (run.provision data mirror; spawnOpts/validateRoster/widenRoster; landDecision; HARD_ESCALATION_REASONS)', () => {
  // This test guards against silent marker addition (a new mirror that skips the registry).
  // Anchored by construct, not line number. If you add a new mirror, update BOTH the
  // registry/allowlist above AND bump this count.
  const count = templateText.split('\n').filter(line => /Keep in sync|Mirror of|MIRROR of/i.test(line)).length
  assert.equal(count, 4,
    `Expected exactly 4 Keep-in-sync/Mirror-of marker lines in workflow-template.js, found ${count}.\n` +
    `If you added a new mirror, register it in the LOGIC_MIRROR_REGISTRY or DATA_MIRROR_ALLOWLIST and bump this count.`
  )
})
