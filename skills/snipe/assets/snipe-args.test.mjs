import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSnipeArgs, snipeTier, SNIPE_LENS_CATALOG } from './snipe-args.mjs'
import { DEFAULTS, RESERVED_LENSES } from '../../war/assets/war-config.mjs'

// --- parsing + reconciliation (#1920 grammar) -----------------------------

test('bare /snipe: 1 seat, all auto, empty target', () => {
  const r = parseSnipeArgs('')
  assert.deepEqual(r, { target: '', seats: 1, named: [], autoCount: 1, errors: [] })
})

test('trailing integer alone sets seat count, all auto', () => {
  const r = parseSnipeArgs('3')
  assert.equal(r.seats, 3)
  assert.deepEqual(r.named, [])
  assert.equal(r.autoCount, 3)
  assert.deepEqual(r.errors, [])
})

test('named lens list alone sets the seat count exactly', () => {
  const r = parseSnipeArgs('correctness,security')
  assert.equal(r.seats, 2)
  assert.deepEqual(r.named, ['correctness', 'security'])
  assert.equal(r.autoCount, 0)
})

test('issue example: 3 correctness,auto → one pinned + two Lead-picked', () => {
  const r = parseSnipeArgs('3 correctness,auto')
  assert.equal(r.seats, 3)
  assert.deepEqual(r.named, ['correctness'])
  assert.equal(r.autoCount, 2)
})

test('order-tolerant: lens list then integer parses the same', () => {
  assert.deepEqual(parseSnipeArgs('correctness,auto 3'), parseSnipeArgs('3 correctness,auto'))
})

test('auto entries are seats: correctness,auto,auto → 3 seats without an integer', () => {
  const r = parseSnipeArgs('correctness,auto,auto')
  assert.equal(r.seats, 3)
  assert.equal(r.autoCount, 2)
})

test('target text survives in front of both trailing args', () => {
  const r = parseSnipeArgs('origin/master..HEAD 2 correctness,auto')
  assert.equal(r.target, 'origin/master..HEAD')
  assert.equal(r.seats, 2)
})

test('bare single word: catalog lens is a lens, anything else is target', () => {
  const lens = parseSnipeArgs('correctness')
  assert.deepEqual(lens.named, ['correctness'])
  assert.equal(lens.target, '')
  const ref = parseSnipeArgs('master')
  assert.deepEqual(ref.named, [])
  assert.equal(ref.target, 'master')
  assert.ok(SNIPE_LENS_CATALOG.includes('correctness'))
})

test('named count above the integer wins (effective = max), capped at 5', () => {
  const r = parseSnipeArgs('2 correctness,security,performance')
  assert.equal(r.seats, 3)
  const capped = parseSnipeArgs('5 a1,a2,a3,a4,a5,a6'.replace(/a(\d)/g, 'lens-$1'))
  assert.equal(capped.seats, 5)
  assert.equal(capped.errors.length, 1)
  assert.match(capped.errors[0], /at most 5 named lenses/)
})

test('seat count outside 1-5 and duplicate/reserved lenses are refused', () => {
  assert.match(parseSnipeArgs('7').errors[0], /seat count must be 1-5/)
  assert.match(parseSnipeArgs('0').errors[0], /seat count must be 1-5/)
  assert.match(parseSnipeArgs('correctness,correctness').errors[0], /more than once/)
  const reserved = parseSnipeArgs(`${RESERVED_LENSES[0]},correctness`)
  assert.match(reserved.errors[0], /reserved for built-in passes/)
})

// --- tier ladder: agents.snipe → agents.auditor → DEFAULTS (#1920) --------

test('snipeTier ladder: snipe tier wins, else auditor, else DEFAULTS auditor', () => {
  assert.deepEqual(snipeTier({ agents: { snipe: { model: 'haiku', effort: 'low' } } }), { model: 'haiku', effort: 'low' })
  assert.deepEqual(snipeTier({ agents: { auditor: { model: 'opus', effort: 'high' } } }), { model: 'opus', effort: 'high' })
  const d = snipeTier({})
  assert.equal(d.model, DEFAULTS.agents.auditor.model)
  assert.equal(d.effort, DEFAULTS.agents.auditor.effort === 'default' ? undefined : DEFAULTS.agents.auditor.effort)
})

test('snipeTier omits effort when default (spawnOpts shape)', () => {
  const r = snipeTier({ agents: { snipe: { model: 'sonnet', effort: 'default' } } })
  assert.deepEqual(r, { model: 'sonnet' })
})
