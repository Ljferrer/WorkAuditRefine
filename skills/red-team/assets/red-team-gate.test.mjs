import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupe, classify, verdict, summarize, allFindings } from './red-team-gate.mjs'

const F = (severity, extra = {}) => ({ severity, claim: 'c', planRef: 'Task 1', ...extra })

test('verdict CLEARED on no findings', () => {
  assert.equal(verdict([]), 'CLEARED')
})

test('verdict CLEARED-WITH-NOTES on minors only', () => {
  assert.equal(verdict([F('Minor')]), 'CLEARED-WITH-NOTES')
})

test('verdict BLOCKED on a Major', () => {
  assert.equal(verdict([F('Major')]), 'BLOCKED')
})

test('verdict BLOCKED on a Critical', () => {
  assert.equal(verdict([F('Critical')]), 'BLOCKED')
})

test('verdict BLOCKED on a needsDecision even at Minor severity', () => {
  assert.equal(verdict([F('Minor', { needsDecision: true })]), 'BLOCKED')
})

test('classify buckets by severity and needsDecision', () => {
  const c = classify([
    F('Critical'), F('Major'), F('Minor'),
    F('Minor', { needsDecision: true, planRef: 'Task 2' }),
  ])
  assert.equal(c.blockers.length, 2)
  assert.equal(c.needsDecision.length, 1)
  assert.equal(c.minors.length, 1)
})

test('dedupe drops identical findings', () => {
  assert.equal(dedupe([F('Major'), F('Major')]).length, 1)
})

test('dedupe keeps distinct planRefs', () => {
  assert.equal(dedupe([F('Major'), F('Major', { planRef: 'Task 9' })]).length, 2)
})

test('allFindings flattens probe results and tags the probe', () => {
  const results = [
    { probe: 'x', findings: [F('Major')] },
    { probe: 'y', findings: [F('Minor')] },
    { probe: 'z', findings: [] },
  ]
  assert.equal(allFindings(results).length, 2)
  assert.equal(allFindings(results)[0].probe, 'x')
})

test('summarize counts techniques and statuses', () => {
  const s = summarize([
    { technique: 'executed', status: 'pass' },
    { technique: 'analyzed', status: 'fail' },
    { technique: 'analyzed', status: 'warn' },
  ])
  assert.equal(s.probes, 3)
  assert.equal(s.executed, 1)
  assert.equal(s.analyzed, 2)
  assert.equal(s.pass, 1)
  assert.equal(s.fail, 1)
  assert.equal(s.warn, 1)
})

import { normalizeTitle, isOnTarget } from './red-team-gate.mjs'

const FP = { absPath: '/repo/docs/plans/p.md', titleLine: '# My Plan', tokens: ['## A', '## B'] }
const anchor = (over = {}) => ({ resolved_path: '/repo/docs/plans/p.md', plan_title: '# My Plan', ...over })

test('normalizeTitle strips leading #, collapses whitespace, lowercases', () => {
  assert.equal(normalizeTitle('#  My   Plan '), normalizeTitle('my plan'))
  assert.equal(normalizeTitle('## My Plan'), 'my plan')
})

test('isOnTarget true when title matches and path is absolute under repo', () => {
  assert.equal(isOnTarget({ read_anchor: anchor() }, FP, '/repo'), true)
})

test('isOnTarget false when the attested title is a different plan (the drift signal)', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ plan_title: '# OmniEMR Section B' }) }, FP, '/repo'), false)
})

test('isOnTarget false when resolved_path is outside repo', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ resolved_path: '/other/docs/plans/p.md' }) }, FP, '/repo'), false)
})

test('isOnTarget false when resolved_path is not absolute', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ resolved_path: 'docs/plans/p.md' }) }, FP, '/repo'), false)
})

test('isOnTarget false when read_anchor is missing (required attestation absent)', () => {
  assert.equal(isOnTarget({ findings: [] }, FP, '/repo'), false)
})

test('isOnTarget true (back-compat) when no fingerprint is supplied', () => {
  assert.equal(isOnTarget({ findings: [] }, null, null), true)
})

import { classifyCoverage, isIncomplete } from './red-team-gate.mjs'

const onResult = (probe, findings = []) =>
  ({ probe, technique: 'analyzed', status: 'pass', read_anchor: anchor(), findings })
const offResult = (probe) =>
  ({ probe, technique: 'analyzed', status: 'pass', read_anchor: anchor({ plan_title: '# Wrong Plan' }), findings: [F('Major')] })
const droppedMarker = (probe) => ({ probe, dropped: true })

test('classifyCoverage splits on-target / off-target / dropped', () => {
  const c = classifyCoverage(
    [onResult('a'), offResult('b'), droppedMarker('c')], 3, FP, '/repo')
  assert.deepEqual(c.onTarget.map(r => r.probe), ['a'])
  assert.deepEqual(c.offTarget, ['b'])
  assert.deepEqual(c.dropped, ['c'])
  assert.equal(c.ran, 2)
  assert.equal(c.expected, 3)
})

test('isIncomplete true when a probe is off-target', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')), true)
})

test('isIncomplete true when a probe was dropped', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), droppedMarker('b')], 2, FP, '/repo')), true)
})

test('isIncomplete true when fewer probes ran than expected', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a')], 3, FP, '/repo')), true)
})

test('isIncomplete false on full on-target coverage', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), onResult('b')], 2, FP, '/repo')), false)
})

// --- verdict with coverage (the F1/F2/F3 regressions) ---
test('verdict INCOMPLETE when an off-target probe is present, never CLEARED (F1/F3)', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'INCOMPLETE')
})

test('verdict INCOMPLETE when a probe was dropped, never CLEARED (F2)', () => {
  const cov = classifyCoverage([onResult('a'), droppedMarker('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'INCOMPLETE')
})

test('off-target findings are discarded — they never reach classify/verdict', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')
  // offResult carried a Major; because it is off-target it must not appear in on-target findings.
  assert.equal(allFindings(cov.onTarget).length, 0)
})

test('verdict CLEARED on full on-target coverage with no findings (preserves today)', () => {
  const cov = classifyCoverage([onResult('a'), onResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'CLEARED')
})

test('verdict BLOCKED on full coverage with an on-target Major', () => {
  const cov = classifyCoverage([onResult('a', [F('Major')]), onResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'BLOCKED')
})

test('verdict back-compat: no coverage arg behaves as today', () => {
  assert.equal(verdict([F('Major')]), 'BLOCKED')
  assert.equal(verdict([]), 'CLEARED')
})

test('summarize with coverage reports expected / onTarget / offTarget / dropped', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b'), droppedMarker('c')], 3, FP, '/repo')
  const s = summarize(cov.onTarget, cov)
  assert.equal(s.expected, 3)
  assert.equal(s.onTarget, 1)
  assert.deepEqual(s.offTarget, ['b'])
  assert.deepEqual(s.dropped, ['c'])
})
