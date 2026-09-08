import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { parseSnipeVerdict, renderSnipeReport, validateSnipeVerdict } from './snipe-result.mjs'

const expected = {
  seat: 1,
  lens: 'correctness',
  scope: { kind: 'committed', headSha: 'a'.repeat(40) },
}

function valid(overrides = {}) {
  return {
    schema_version: 1,
    seat: 1,
    lens: 'correctness',
    scope: { kind: 'committed', audit_sha: 'a'.repeat(40) },
    verdict: 'approve',
    confidence: 'high',
    findings: [],
    tests_verified: { exist: true, inspected: ['test/review.test.mjs'] },
    ...overrides,
  }
}

test('a valid committed verdict is pinned to the expected seat, lens, and revision', () => {
  assert.deepEqual(validateSnipeVerdict(valid(), expected), valid())
})

test('absent tests remain absent rather than requiring schema repair to invent evidence', () => {
  const result = valid({ tests_verified: { exist: false, inspected: [] } })
  assert.deepEqual(validateSnipeVerdict(result, expected), result)
})

test('only documented WAR field aliases normalize into the versioned Snipe contract', () => {
  const result = validateSnipeVerdict({
    schema_version: 1,
    seat: 'seat-1',
    lens: 'correctness',
    audit_sha: 'a'.repeat(40),
    verdict: 'approve',
    confidence: 'medium',
    findings: [{
      severity: 'Minor',
      title: 'Choose the error wording',
      file: 'src/review.mjs',
      evidence: 'Two public messages now disagree.',
      fix: 'Use one message.',
      disposition: 'ask',
      ask: { question: 'Which wording?', fork: 'Keep the old wording or adopt the new wording.' },
    }],
    tests_inspected: ['test/review.test.mjs'],
  }, expected)

  assert.deepEqual(result, {
    schema_version: 1,
    seat: 1,
    lens: 'correctness',
    scope: { kind: 'committed', audit_sha: 'a'.repeat(40) },
    verdict: 'approve',
    confidence: 'medium',
    findings: [{
      severity: 'Minor',
      title: 'Choose the error wording',
      file: 'src/review.mjs',
      rationale: 'Two public messages now disagree.',
      suggested_fix: 'Use one message.',
      disposition: 'ask',
      ask: { question: 'Which wording?', alternatives: 'Keep the old wording or adopt the new wording.' },
    }],
    tests_verified: { exist: true, inspected: ['test/review.test.mjs'] },
  })
})

test('a dirty verdict must echo its advisory fingerprint instead of a commit identity', () => {
  const fingerprint = 'b'.repeat(64)
  const result = validateSnipeVerdict(valid({
    scope: { kind: 'dirty', fingerprint, advisory: true },
  }), {
    ...expected,
    scope: { kind: 'dirty', fingerprint },
  })
  assert.deepEqual(result.scope, { kind: 'dirty', fingerprint, advisory: true })
})

test('result intake requires one complete JSON object with no prose wrapper', () => {
  assert.deepEqual(parseSnipeVerdict(JSON.stringify(valid()), expected), valid())
  for (const response of [
    '{"schema_version":1',
    `${JSON.stringify(valid())}\nextra`,
    `\`\`\`json\n${JSON.stringify(valid())}\n\`\`\``,
  ]) {
    assert.throws(
      () => parseSnipeVerdict(response, expected),
      error => error.code === 'MALFORMED_JSON',
    )
  }
})

test('wrong identity, malformed findings, and inconsistent approval are rejected distinctly', () => {
  const cases = [
    [valid({ seat: 2 }), 'SEAT_MISMATCH'],
    [valid({ lens: 'security' }), 'LENS_MISMATCH'],
    [valid({ scope: { kind: 'committed', audit_sha: 'c'.repeat(40) } }), 'SCOPE_MISMATCH'],
    [valid({ scope: { kind: 'committed', audit_sha: 'a'.repeat(40), advisory: true } }), 'SCOPE_MISMATCH'],
    [valid({ findings: [{ severity: 'Major', title: 'Missing rationale' }] }), 'INVALID_RESULT'],
    [valid({ findings: [{ severity: 'Major', title: 'Unsafe', rationale: 'The write is allowed.' }] }), 'INCONSISTENT_VERDICT'],
    [valid({ findings: [{ severity: 'Minor', title: 'No route', rationale: 'Routing is absent.' }] }), 'INVALID_FINDING'],
    [valid({ verdict: 'escalate' }), 'INVALID_RESULT'],
    [valid({ tests_verified: { exist: 'false', inspected: [] } }), 'INVALID_RESULT'],
    [valid({ widen: ['pin-validity'] }), 'INVALID_RESULT'],
    [{ ...valid(), invented: true }, 'UNKNOWN_FIELD'],
  ]
  for (const [value, code] of cases) {
    assert.throws(() => validateSnipeVerdict(value, expected), error => error.code === code)
  }
})

test('S-A09 revision rejection fails when its identity guard is removed from a disposable mutant', async () => {
  const wrongRevision = valid({ scope: { kind: 'committed', audit_sha: 'c'.repeat(40) } })
  assert.throws(() => validateSnipeVerdict(wrongRevision, expected), error => error.code === 'SCOPE_MISMATCH')

  const sourcePath = fileURLToPath(new URL('./snipe-result.mjs', import.meta.url))
  const original = readFileSync(sourcePath, 'utf8')
  const mutant = original
    .replace(
      "import { RESERVED_LENSES } from '../../../../../skills/war/assets/war-config.mjs'",
      "const RESERVED_LENSES = ['execution-evidence', 'pin-validity']",
    )
    .replace(' || scope.audit_sha !== expected.scope.headSha', '')
  assert.notEqual(mutant, original)
  const mutantPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-result-mutant-')), 'snipe-result.mjs')
  writeFileSync(mutantPath, mutant)
  const mutatedModule = await import(`${pathToFileURL(mutantPath)}?revision-guard-removed`)
  assert.doesNotThrow(() => mutatedModule.validateSnipeVerdict(wrongRevision, expected))
})

test('informational report orders scope, outcomes, attributed findings, limitations, and asks', () => {
  const fingerprint = 'd'.repeat(64)
  const sharedFinding = {
    severity: 'Major',
    title: 'Validation can be bypassed',
    file: 'src/review.mjs',
    rationale: 'NaN reaches the public result.',
  }
  const report = renderSnipeReport({
    request: {
      profile: { model: 'gpt-test', effort: 'high' },
      scope: {
        kind: 'dirty', advisory: true, description: 'working tree (advisory)', fingerprint,
        included: ['staged', 'unstaged'], paths: [],
        submodules: [{ path: 'vendor/engine', contentsAvailable: false, limitation: 'nested content uncaptured' }],
      },
    },
    complete: false,
    stability: { stable: false, before: fingerprint, after: 'e'.repeat(64) },
    seats: [
      { seat: 1, lens: 'correctness', status: 'completed', validation: { status: 'valid' }, repair: { attempted: false }, verdict: {
        verdict: 'request_changes', confidence: 'high', widen: ['security'],
        findings: [sharedFinding, {
          severity: 'Minor', title: 'Choose compatibility policy', rationale: 'Two policies are viable.',
          disposition: 'ask', ask: { question: 'Keep the alias?', alternatives: 'Keep it or remove it.' },
        }, {
          severity: 'Minor', title: 'Tighten the message', rationale: 'The wording is mechanical.', disposition: 'absorb',
        }, {
          severity: 'Nit', title: 'Document the later migration', rationale: 'The migration is outside this change.', disposition: 'follow-up', barrier: 'barrier:release-slot',
        }],
      } },
      { seat: 2, lens: 'security', status: 'completed', validation: { status: 'valid' }, repair: { attempted: true, succeeded: true }, verdict: {
        verdict: 'request_changes', confidence: 'medium', findings: [sharedFinding],
      } },
      { seat: 3, lens: 'test-fidelity', status: 'invalid_result', validation: { status: 'invalid', error: 'wrong revision' }, repair: { attempted: true, succeeded: false }, verdict: null },
      { seat: 4, lens: 'usability', status: 'completed', validation: { status: 'valid' }, repair: { attempted: false }, verdict: {
        verdict: 'escalate', confidence: 'low', findings: [], escalate_reason: 'The operator must choose the public compatibility policy.',
      } },
    ],
  })

  assert.match(report, /^# Snipe report\n\n## Scope/)
  assert.match(report, /INCOMPLETE — do not interpret this panel as clean/)
  assert.match(report, /Dirty advisory scope/)
  assert.match(report, /changed during review/)
  assert.match(report, /Seat 3 · test-fidelity: invalid_result/)
  assert.match(report, /Seat 4 · usability: completed — validated; verdict escalate; confidence low/)
  assert.match(report, /Operator decision required: The operator must choose the public compatibility policy\./)
  assert.match(report, /Validation can be bypassed.*would block in a phase/s)
  assert.match(report, /Seats: 1 \(correctness\), 2 \(security\)/)
  assert.equal(report.match(/### Major · Validation can be bypassed/g)?.length, 1)
  assert.match(report, /Question: Keep the alias\?/)
  assert.match(report, /Alternatives: Keep it or remove it\./)
  assert.match(report, /Disposition: absorb \(classification only\)/)
  assert.match(report, /Disposition: follow-up \(classification only\)/)
  assert.match(report, /Widen recommendation.*report-only.*security/is)
  assert.match(report, /nested content uncaptured/)
  assert.match(report, /No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed\./)
})
