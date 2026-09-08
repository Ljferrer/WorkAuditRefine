import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { test } from 'node:test'
import { discoverTests, collect } from './collect.mjs'

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'war-collector-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  execFileSync('git', ['init', '-q', root])
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true })
    writeFileSync(join(root, name), text)
  }
  execFileSync('git', ['-C', root, 'add', '.'])
  execFileSync('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'])
  return root
}

test('inventory selects every tracked suite root, safely retaining spaced paths', t => {
  const files = ['skills/a.test.mjs', 'hooks/a b.test.sh', 'adapters/codex/a.test.mjs',
    'tests/parity/a.test.mjs', 'scripts/ci/a.test.mjs']
  const root = fixture(t, Object.fromEntries([...files, '.claude/worktrees/stale.test.mjs'].map(f => [f, ''])))
  assert.deepEqual(discoverTests(root), files.sort())
})

test('zero-exit empty JavaScript and unapproved skips do not masquerade as executed tests', async t => {
  const root = fixture(t, {
    'skills/empty.test.mjs': '',
    'skills/skip.test.mjs': "import {test} from 'node:test'; test('not run', {skip:true}, () => {});",
    'hooks/skip.test.sh': 'echo "SKIP no dependency"',
  })
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(report.ok, false)
  assert.ok(report.suites.every(s => s.status !== 'passed'))
})

test('collector refuses empty, omitted and missing tracked tests before execution', async t => {
  const root = fixture(t, { 'skills/a.test.mjs': '', 'hooks/b.test.sh': '' })
  await assert.rejects(collect({ root, output: join(root, 'omitted'), inventory: ['skills/a.test.mjs'] }), /inventory mismatch/)
  rmSync(join(root, 'hooks/b.test.sh'))
  await assert.rejects(collect({ root, output: join(root, 'missing') }), /missing.*hooks\/b.test.sh/)
  const empty = fixture(t, { 'README.md': '' })
  await assert.rejects(collect({ root: empty, output: join(empty, 'report') }), /empty inventory/)
})

test('logs preserve failing exit and later suites still run with explicit counts', async t => {
  const root = fixture(t, {
    'hooks/failure.test.sh': 'echo distinctive-failure; exit 7',
    'skills/pass.test.mjs': "import {test} from 'node:test'; test('witness', () => {});",
  })
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(report.ok, false)
  assert.equal(report.suites[0].exitCode, 7)
  assert.match(readFileSync(report.suites[0].stdout, 'utf8'), /distinctive-failure/)
  assert.equal(report.suites[1].counts.tests, 1)
  assert.equal(report.suites[1].status, 'passed')
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'report/report.json'), 'utf8')), report)
})

test('only named host skips are allowed and remain explicitly incomplete host evidence', async t => {
  const name = 'installed plugin resolves packaged default prompts in fresh host sessions without implicit audits'
  const root = fixture(t, { 'adapters/codex/snipe-discovery-host.test.mjs': `import {test} from 'node:test'; test(${JSON.stringify(name)}, {skip:true}, () => {});` })
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(report.ok, true)
  assert.equal(report.evidenceLevel, 'baseline')
  assert.equal(report.suites[0].status, 'allowed-skips')
  assert.match(report.suites[0].skips[0].reason, /not credential-free baseline evidence/)
})

test('timeout kills a hanging suite and is not a successful exit', async t => {
  const root = fixture(t, { 'hooks/hang.test.sh': 'sleep 60' })
  const report = await collect({ root, output: join(root, 'report'), timeoutMs: 100 })
  assert.equal(report.ok, false)
  assert.equal(report.suites[0].failure, 'timeout')
  assert.equal(report.suites[0].signal, 'SIGKILL')
})
