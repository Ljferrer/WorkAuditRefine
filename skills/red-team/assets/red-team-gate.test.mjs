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
