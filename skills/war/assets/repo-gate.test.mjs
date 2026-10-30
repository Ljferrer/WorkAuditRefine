import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const runner = fileURLToPath(new URL('./repo-gate.mjs', import.meta.url))
const quote = value => `'${value.replaceAll("'", "'\\''")}'`
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'war-gate-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  function put(path, text) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  put('scratch/.keep', '')
  put('skills/basic.test.mjs', "import { test } from 'node:test'; test('node fixture', () => {})\n")
  const env = { ...process.env, TMPDIR: join(root, 'scratch'), WAR_GATE_SHELL_JOBS: '2', WAR_GATE_NODE_JOBS: '2' }
  delete env.NODE_TEST_CONTEXT
  const run = (overrides = {}) => spawnSync(process.execPath, [runner], {
    cwd: root, env: { ...env, ...overrides }, encoding: 'utf8', timeout: 20000,
  })
  return { root, put, env, run }
}

test('full gate overlaps both bounded pools, runs every suite once, and keeps logs and scratch isolated', t => {
  const { root, put, run } = fixture(t)
  rmSync(join(root, 'skills/basic.test.mjs'))
  put('job.mjs', `
import { appendFileSync, existsSync, writeFileSync } from 'node:fs'
import { setTimeout } from 'node:timers/promises'
const name = process.argv[2]
const record = event => appendFileSync('trace', JSON.stringify({ name, event, tmp: process.env.TMPDIR }) + '\\n')
record('start')
writeFileSync(name + '.ready', '')
if (!name.endsWith('c')) {
  const deadline = Date.now() + 5000
  while (!['node-a', 'node-b', 'shell-a', 'shell-b'].every(n => existsSync(n + '.ready'))) {
    if (Date.now() > deadline) throw new Error('both Node files and both shell suites must overlap')
    await setTimeout(10)
  }
}
console.log('stdout:' + name)
console.error('stderr:' + name)
await setTimeout(100)
record('end')
`)
  for (const name of ['a', 'b', 'c']) {
    put(`skills/${name}.test.mjs`, `process.argv[2] = 'node-${name}'; await import('../job.mjs')\n`)
    put(`other/${name} shell.test.sh`, `${quote(process.execPath)} job.mjs shell-${name}\n`)
  }
  for (const dir of ['.claude', '.git', 'node_modules', 'nested/.claude', 'nested/node_modules']) {
    put(`${dir}/excluded.test.sh`, 'echo wrongly-discovered >> trace; exit 9\n')
  }
  put('not-a-test.sh', 'echo wrongly-discovered >> trace; exit 9\n')
  symlinkSync(join(root, 'not-a-test.sh'), join(root, 'symlink.test.sh'))
  symlinkSync(join(root, '.claude'), join(root, 'linked-directory'))
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /== gate complete: 4\/4 jobs; 0 failed ==/)
  const events = readFileSync(join(root, 'trace'), 'utf8').trim().split('\n').map(JSON.parse)
  const live = { node: 0, shell: 0 }, peak = { ...live }
  for (const event of events) {
    const kind = event.name.split('-')[0]
    live[kind] += event.event === 'start' ? 1 : -1
    peak[kind] = Math.max(peak[kind], live[kind])
  }
  assert.deepEqual(peak, { node: 2, shell: 2 })
  assert.deepEqual(live, { node: 0, shell: 0 })
  const starts = events.filter(e => e.event === 'start')
  assert.equal(starts.length, 6)
  assert.equal(new Set(starts.map(e => e.name)).size, 6)
  assert.equal(new Set(starts.map(e => e.tmp)).size, 4, 'Node and each shell suite have separate scratch dirs')
  for (const event of starts) assert.equal(existsSync(event.tmp), false, 'scratch is cleaned after all jobs finish')
  for (const name of ['a', 'b', 'c']) {
    const banner = `== gate(bash): ./other/${name} shell.test.sh ==`
    assert.equal(result.stdout.split(banner).length - 1, 1)
    assert.ok(result.stdout.includes(`${banner}\nstdout:shell-${name}\nstderr:shell-${name}`))
  }
  const logs = result.stdout.match(/^Gate logs: (.+)$/m)[1]
  for (const file of ['node.log', 'shell-0.log', 'shell-1.log', 'shell-2.log']) assert.ok(existsSync(join(logs, file)))
})

for (const failure of ['node', 'shell', 'both']) test(`a ${failure} failure cannot hide other suites or produce a green gate`, t => {
  const { put, run } = fixture(t)
  if (failure !== 'shell') put('skills/basic.test.mjs', "throw new Error('node-failure')\n")
  put('a.test.sh', `echo first-suite; exit ${failure !== 'node' ? 7 : 0}\n`)
  put('z.test.sh', 'echo last-suite\n')
  const result = run({ WAR_GATE_SHELL_JOBS: '1', WAR_GATE_NODE_JOBS: '1' })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stdout, /first-suite/)
  assert.match(result.stdout, /last-suite/)
  assert.match(result.stdout, /== gate complete: 3\/3 jobs; [12] failed ==/)
  assert.match(result.stdout, /== gate\(node\) ==/)
})

test('zero shell suites still runs the Node gate', t => {
  const { run } = fixture(t)
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /== gate complete: 1\/1 jobs; 0 failed ==/)
})

test('a shell launch error fails visibly and drains every queued suite', t => {
  const { put, run } = fixture(t)
  put('a.test.sh', 'exit 0\n'); put('b.test.sh', 'exit 0\n')
  const result = run({ PATH: '/nonexistent-war-test-path' })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stdout, /Launch failed: spawn bash ENOENT/)
  assert.match(result.stdout, /== gate complete: 3\/3 jobs; 2 failed ==/)
})

test('invalid pool sizes fail before launching any tests', t => {
  const { run } = fixture(t)
  for (const key of ['WAR_GATE_SHELL_JOBS', 'WAR_GATE_NODE_JOBS']) for (const value of ['0', '-1', '2.5', '33', 'oops']) {
    const result = run({ [key]: value })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /must be an integer from 1 to 32/)
    assert.doesNotMatch(result.stdout, /Gate logs:|gate complete/)
  }
})

test('termination kills descendants, drains active jobs, and never reports a complete gate', async t => {
  const { root, put, env } = fixture(t)
  put('stubborn.mjs', "import { writeFileSync } from 'node:fs'; process.on('SIGTERM', () => {}); writeFileSync('child.pid', String(process.pid)); setInterval(() => {}, 100)\n")
  put('a.test.sh', `${quote(process.execPath)} stubborn.mjs &\nwait\n`)
  put('z.test.sh', 'touch should-not-run\n')
  const child = spawn(process.execPath, [runner], { cwd: root, env: { ...env, WAR_GATE_SHELL_JOBS: '1' } })
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  const closed = new Promise(resolve => child.on('close', (code, signal) => resolve({ code, signal })))
  t.after(() => { if (child.exitCode === null) child.kill('SIGTERM') })
  const deadline = Date.now() + 5000
  while (!existsSync(join(root, 'child.pid'))) {
    assert.ok(Date.now() < deadline, 'descendant started')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  const pid = Number(readFileSync(join(root, 'child.pid'), 'utf8'))
  t.after(() => { try { process.kill(pid, 'SIGKILL') } catch {} })
  child.kill('SIGTERM')
  assert.deepEqual(await closed, { code: 143, signal: null }, output)
  assert.match(output, /== gate interrupted:/)
  assert.doesNotMatch(output, /== gate complete:/)
  assert.equal(existsSync(join(root, 'should-not-run')), false)
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
})
