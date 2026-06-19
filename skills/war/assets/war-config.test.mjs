import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  DEFAULTS, fillDefaults, presetConfig, validate, spawnOpts, covenSeats,
} from './war-config.mjs'

// Helper: read workflow-template.js as text relative to this test file.
const __dir = dirname(fileURLToPath(import.meta.url))
const templateText = readFileSync(join(__dir, 'workflow-template.js'), 'utf8')

test('DEFAULTS validate', () => {
  assert.equal(validate(DEFAULTS).valid, true)
})

test('empty input fills to balanced defaults and validates', () => {
  const c = fillDefaults({})
  assert.equal(c.agents.worker.model, 'sonnet')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.audit.covenPolicy, 'auto')
  assert.equal(validate({}).valid, true)
})

test('deepMerge via fillDefaults does not mutate DEFAULTS', () => {
  const snapshot = JSON.stringify(DEFAULTS)
  fillDefaults({ agents: { worker: { model: 'opus' } } })
  assert.equal(JSON.stringify(DEFAULTS), snapshot)
})

test('partial override merges over defaults', () => {
  const c = fillDefaults({ agents: { worker: { model: 'opus', effort: 'max' } } })
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')   // untouched default
  assert.equal(c.agents.refiner.model, 'sonnet') // untouched default
})

test('thorough preset', () => {
  const c = presetConfig('thorough')
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.effort, 'high')
  assert.equal(c.audit.covenPolicy, 'all')
  assert.equal(validate(c).valid, true)
})

test('economy preset', () => {
  const c = presetConfig('economy')
  assert.equal(c.audit.covenSize, 3)   // economy keeps the default covenSize; 'solo' is what yields the single auditor
  assert.equal(c.audit.covenPolicy, 'solo')
  assert.equal(c.run.roundLimit, 2)
  assert.equal(validate(c).valid, true)
})

test('unknown preset throws', () => {
  assert.throws(() => presetConfig('turbo'), /unknown preset/)
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

test('covenSize below 1 rejected', () => {
  assert.equal(validate({ audit: { covenSize: 0 } }).valid, false)
})

test('bad covenPolicy rejected', () => {
  assert.equal(validate({ audit: { covenPolicy: 'never' } }).valid, false)
})

test('non-boolean autoEscalate rejected', () => {
  assert.equal(validate({ audit: { autoEscalate: 'yes' } }).valid, false)
})

test('roundLimit below 1 rejected', () => {
  assert.equal(validate({ run: { roundLimit: 0 } }).valid, false)
})

test('unknown role rejected', () => {
  assert.equal(validate({ agents: { wizard: { model: 'opus', effort: 'default' } } }).valid, false)
})

test('spawnOpts omits effort when default', () => {
  assert.deepEqual(spawnOpts(DEFAULTS, 'worker'), { model: 'sonnet' })
})

test('spawnOpts includes non-default effort', () => {
  assert.deepEqual(spawnOpts(presetConfig('thorough'), 'worker'), { model: 'opus', effort: 'max' })
})

test('covenSeats single seat when not coven', () => {
  assert.deepEqual(
    covenSeats(DEFAULTS, { coven: false, lenses: DEFAULTS.audit.lenses }),
    ['correctness'])
})

test('covenSeats covenSize seats rotating lenses', () => {
  const c = fillDefaults({ audit: { covenSize: 3 } })
  assert.deepEqual(
    covenSeats(c, { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }),
    ['correctness', 'cascading-impact', 'plan-faithfulness'])
})

test('covenSeats falls back to the default trio length when audit has no covenSize', () => {
  assert.deepEqual(
    covenSeats({}, { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }),
    ['correctness', 'cascading-impact', 'plan-faithfulness'])
})

test('covenSeats uses default lenses when the task has none', () => {
  assert.deepEqual(covenSeats({}, { coven: false }), ['correctness'])
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

test('drift-guard: inline fallback lenses in workflow-template.js matches DEFAULTS.audit.lenses (#6 Nit 1)', () => {
  // The template has:
  //   const baseLenses = task.lenses && task.lenses.length ? task.lenses : ['correctness', 'cascading-impact', 'plan-faithfulness']
  // Extract the fallback array literal after the ternary's false-branch colon.
  const match = templateText.match(/task\.lenses\s*:\s*(\[[^\]]+\])/)
  assert.ok(match, 'inline fallback lenses array not found in workflow-template.js')
  // Normalize single-quoted strings to double-quoted for JSON.parse.
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  assert.deepEqual(parsed, DEFAULTS.audit.lenses)
})
