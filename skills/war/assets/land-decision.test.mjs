import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decideLand, HARD_ESCALATION_REASONS } from './land-decision.mjs'

test('lands when something merged and no hard escalation', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [] }), 'landed')
})
test('holds on escalate', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'escalate' }] }), 'held:escalation')
})
test('holds on audit-blocked even with a merged task', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'audit-blocked' }] }), 'held:escalation')
})
test('holds on conflict', () => {
  assert.equal(decideLand({ landed: [], escalated: [{ reason: 'conflict' }] }), 'held:escalation')
})
test('nothing-merged when nothing landed and no hard escalation (formerly the silent skip)', () => {
  assert.equal(decideLand({ landed: [], escalated: [{ reason: 'gate_failed' }] }), 'held:nothing-merged')
})
test('nothing-merged on a totally empty phase', () => {
  assert.equal(decideLand({ landed: [], escalated: [] }), 'held:nothing-merged')
})
test('gate_failed/error are NOT hard escalations (preserve existing land semantics)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'gate_failed' }] }), 'landed')
  assert.ok(!HARD_ESCALATION_REASONS.includes('gate_failed'))
  assert.ok(!HARD_ESCALATION_REASONS.includes('error'))
})
test('tolerates null/garbage escalation entries', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [null, {}] }), 'landed')
})
test('defaults to nothing-merged with no args', () => {
  assert.equal(decideLand(), 'held:nothing-merged')
})
test('holds on land_stale (CAS-exhaustion is a hard escalation, distinct from content conflict)', () => {
  assert.equal(decideLand({ escalated: [{ reason: 'land_stale' }] }), 'held:escalation')
})
test('dep-failed is a hard escalation reason (F02 foundation)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'dep-failed' }] }), 'held:escalation')
  assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'))
})
test('gate-evidence is a hard escalation reason (F04 R3: provably-unrun mapped test holds the land)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'gate-evidence' }] }), 'held:escalation')
  assert.ok(HARD_ESCALATION_REASONS.includes('gate-evidence'))
})
