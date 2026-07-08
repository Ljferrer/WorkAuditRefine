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

test('verdict BLOCKED on full coverage with an on-target Major (non-pass probe)', () => {
  // onResult hardcodes status:'pass' — a pass-probe Major is now CLEARED (the new filter).
  // Use a raw fail-status probe to carry the Major so the test asserts BLOCKED for a genuine defect.
  const failProbe = { probe: 'a', technique: 'analyzed', status: 'fail', read_anchor: anchor(), findings: [F('Major')] }
  const cov = classifyCoverage([failProbe, onResult('b')], 2, FP, '/repo')
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

// --- T2.1: probeStatus threading + status-aware classify ---

test('allFindings threads probeStatus from parent probe', () => {
  const results = [{ probe: 'x', status: 'pass', findings: [F('Critical')] }]
  assert.equal(allFindings(results)[0].probeStatus, 'pass')
})

test('Critical from a pass probe → NOT a blocker (CLEARED)', () => {
  const findings = allFindings([{ probe: 'x', status: 'pass', findings: [F('Critical')] }])
  assert.equal(classify(findings).blockers.length, 0)
  assert.equal(verdict(findings), 'CLEARED')
})

test('Critical from a fail probe → IS a blocker (BLOCKED)', () => {
  const findings = allFindings([{ probe: 'x', status: 'fail', findings: [F('Critical')] }])
  assert.equal(classify(findings).blockers.length, 1)
  assert.equal(verdict(findings), 'BLOCKED')
})

test('needsDecision from a pass probe → still BLOCKED', () => {
  const findings = allFindings([{ probe: 'x', status: 'pass', findings: [F('Minor', { needsDecision: true })] }])
  assert.equal(classify(findings).needsDecision.length, 1)
  assert.equal(verdict(findings), 'BLOCKED')
})

test('bare Major (no probeStatus) → back-compat still BLOCKED', () => {
  // F() creates a finding with no probeStatus; undefined !== 'pass' so it must block.
  assert.equal(verdict([F('Major')]), 'BLOCKED')
})

// --- T2 (#311, gate-side): severity-less findings routed to needsDecision, not dropped ---

test('severity-less finding on a fail probe → needsDecision + BLOCKED (not silently dropped)', () => {
  const findings = allFindings([
    { probe: 'x', status: 'fail', findings: [{ file: 'a.js', line: 1, summary: 'no severity here' }] },
  ])
  assert.equal(classify(findings).needsDecision.length, 1)
  assert.equal(verdict(findings), 'BLOCKED')
})

test('severity-less finding on a pass probe → NOT a blocker, does not force BLOCKED (preserves #50)', () => {
  const findings = allFindings([
    { probe: 'x', status: 'pass', findings: [{ file: 'a.js', line: 1, summary: 'no severity here' }] },
  ])
  assert.equal(classify(findings).blockers.length, 0)
  assert.equal(classify(findings).needsDecision.length, 0)
  assert.notEqual(verdict(findings), 'BLOCKED')
})

test('two DISTINCT severity-less findings on a fail probe → TWO needsDecision entries (not deduped to one)', () => {
  const findings = allFindings([
    { probe: 'x', status: 'fail', findings: [
      { file: 'a.js', line: 1, summary: 'first malformed' },
      { file: 'b.js', line: 2, summary: 'second malformed' },
    ] },
  ])
  assert.equal(classify(findings).needsDecision.length, 2)
})

// --- T2 (#587): unwrapEnvelope unit + main() CLI refusal + step-4 doc lock ---

import { unwrapEnvelope } from './red-team-gate.mjs'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GATE = path.join(__dirname, 'red-team-gate.mjs')
const repoRoot = path.resolve(__dirname, '../../..')

function runGate(args, input) {
  return spawnSync(process.execPath, [GATE, ...args], { input, encoding: 'utf8' })
}

// --- unwrapEnvelope (End-state 5: five cases) ---

test('unwrapEnvelope returns .result for the harness task-output envelope shape', () => {
  const payload = { probeResults: [{ probe: 'a' }], expected: 1 }
  assert.deepEqual(unwrapEnvelope({ result: payload }), payload)
})

test('unwrapEnvelope returns a direct object (its own probeResults) unchanged', () => {
  const direct = { probeResults: [{ probe: 'a' }] }
  assert.equal(unwrapEnvelope(direct), direct)
})

test('unwrapEnvelope returns an array unchanged', () => {
  const arr = [{ probe: 'a' }]
  assert.equal(unwrapEnvelope(arr), arr)
})

test('unwrapEnvelope: a top-level probeResults wins over a nested .result', () => {
  const both = { probeResults: [{ probe: 'top' }], result: { probeResults: [{ probe: 'nested' }] } }
  assert.equal(unwrapEnvelope(both), both)
})

test('unwrapEnvelope does NOT unwrap when .result is not an object-with-probeResults (falls to floor)', () => {
  const noProbes = { result: { fingerprint: {} } }
  assert.equal(unwrapEnvelope(noProbes), noProbes)
  const resultIsArray = { result: [{ probe: 'a' }] }
  assert.equal(unwrapEnvelope(resultIsArray), resultIsArray)
})

// --- CLI: main() refusal + unwrap (the only layer where main()'s exit/stderr is observable) ---

// One status:'fail' Critical probe whose read_anchor matches the fingerprint. Fidelity is
// load-bearing: an invalid anchor or ran < expected would yield INCOMPLETE, not BLOCKED.
const FP587 = { absPath: '/repo/docs/plans/p.md', titleLine: '# My Plan', tokens: ['## A'] }
const failCritical = {
  probe: 'x', kind: 'bespoke', technique: 'analyzed', status: 'fail',
  read_anchor: { resolved_path: '/repo/docs/plans/p.md', plan_title: '# My Plan' },
  findings: [{ severity: 'Critical', claim: 'boom', planRef: 'Task 1' }],
}

test('CLI: envelope wrapping the full scaffold return with a fail Critical → exit 0, BLOCKED, probe counted (#587 repro inverted)', () => {
  const envelope = { result: {
    plan: '/repo/docs/plans/p.md', repo: '/repo', fingerprint: FP587,
    provision: [], expected: 1, probeResults: [failCritical],
  } }
  const r = runGate(['--stdin'], JSON.stringify(envelope))
  assert.equal(r.status, 0, r.stderr)
  const out = JSON.parse(r.stdout)
  assert.equal(out.verdict, 'BLOCKED')
  assert.ok(out.summary.probes >= 1, `expected probes >= 1, got ${out.summary.probes}`)
})

test('CLI: coverage-null envelope (no fingerprint/expected) with the same fail Critical → still BLOCKED', () => {
  const r = runGate(['--stdin'], JSON.stringify({ result: { probeResults: [failCritical] } }))
  assert.equal(r.status, 0, r.stderr)
  assert.equal(JSON.parse(r.stdout).verdict, 'BLOCKED')
})

for (const [label, input] of [
  ['empty object', {}],
  ['empty-result envelope', { result: {} }],
  ['empty array', []],
]) {
  test(`CLI: zero-probe input via --stdin (${label}) → non-zero exit, zero-probe stderr, no verdict on stdout`, () => {
    const r = runGate(['--stdin'], JSON.stringify(input))
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /zero[- ]probe|0 probes?/i)
    assert.ok(!r.stdout.includes('verdict'), `stdout must carry no verdict, got: ${r.stdout}`)
  })
}

test('CLI: zero-probe input via the file argument (not --stdin) → same refusal (mode-independent)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'red-team-gate-'))
  const file = path.join(dir, 'empty.json')
  fs.writeFileSync(file, JSON.stringify({ result: {} }))
  const r = runGate([file])
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /zero[- ]probe|0 probes?/i)
  assert.ok(!r.stdout.includes('verdict'), `stdout must carry no verdict, got: ${r.stdout}`)
})

// --- Step-4 doc lock (read the SKILL.md from repoRoot, per campaign-ledger.test.mjs idiom) ---

test('SKILL.md step 4 names both accepted input shapes, the .result unwrap, and the zero-probe refusal', () => {
  const md = fs.readFileSync(path.join(repoRoot, 'skills/red-team/SKILL.md'), 'utf8')
  assert.match(md, /task-output/i)
  assert.match(md, /\.result/)
  assert.match(md, /zero[- ]probe|0 probes?/i)
})
