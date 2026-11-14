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
  delete env.WAR_TEMPLATE_STRIPPED
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
  assert.match(result.stdout, /== gate complete: 7\/7 jobs; 0 failed ==/)
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
  assert.equal(new Set(starts.map(e => e.tmp)).size, 6, 'each Node file and each shell suite has its own scratch dir')
  for (const event of starts) assert.equal(existsSync(event.tmp), false, 'scratch is cleaned after all jobs finish')
  for (const name of ['a', 'b', 'c']) {
    const banner = `== gate(bash): ./other/${name} shell.test.sh ==`
    assert.equal(result.stdout.split(banner).length - 1, 1)
    assert.ok(result.stdout.includes(`${banner}\nstdout:shell-${name}\nstderr:shell-${name}`))
  }
  const logs = result.stdout.match(/^Gate logs: (.+)$/m)[1]
  for (const file of ['node-0.log', 'node-1.log', 'node-2.log', 'shell-0.log', 'shell-1.log', 'shell-2.log']) assert.ok(existsSync(join(logs, file)))
})

for (const failure of ['node', 'shell', 'both']) test(`a ${failure} failure cannot hide other suites or produce a green gate`, t => {
  const { put, run } = fixture(t)
  if (failure !== 'shell') put('skills/basic.test.mjs', "throw new Error('node-failure')\n")
  // The smaller file starts second in each pool, so it proves a failure drains the pool.
  put('skills/z.test.mjs', "console.log('last-node')\n")
  put('a.test.sh', `echo first-suite; exit ${failure !== 'node' ? 7 : 0}\n`)
  put('z.test.sh', 'echo last-suite\n')
  const result = run({ WAR_GATE_SHELL_JOBS: '1', WAR_GATE_NODE_JOBS: '1' })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  for (const text of ['first-suite', 'last-suite', 'last-node']) assert.match(result.stdout, new RegExp(text))
  assert.match(result.stdout, new RegExp(`== gate complete: 5/5 jobs; ${failure === 'both' ? 2 : 1} failed ==`))
  assert.match(result.stdout, new RegExp(`== gate result: gate\\(node\\): \\./skills/basic\\.test\\.mjs; exit=${failure === 'shell' ? 0 : 1};`))
  assert.match(result.stdout, new RegExp(`== gate result: gate\\(bash\\): \\./a\\.test\\.sh; exit=${failure === 'node' ? 0 : 7};`))
  assert.match(result.stdout, /== gate result: gate\(node\): \.\/skills\/z\.test\.mjs; exit=0;/)
})

test('zero shell suites still runs the Node gate', t => {
  const { run } = fixture(t)
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /== gate complete: 2\/2 jobs; 0 failed ==/)
})

for (const shape of ['an empty skills folder', 'no skills folder']) test(`zero Node files (${shape}) still runs the shell suites`, t => {
  const { root, put, run } = fixture(t)
  rmSync(join(root, 'skills'), { recursive: true, force: true })
  if (shape === 'an empty skills folder') mkdirSync(join(root, 'skills'))
  put('a.test.sh', 'echo only-suite\n')
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /only-suite/)
  assert.match(result.stdout, /== gate complete: 2\/2 jobs; 0 failed ==/)
  assert.doesNotMatch(result.stdout, /gate\(node\)/)
})

test('the Node file set matches the old skills glob, and odd file names run as themselves', t => {
  const { root, put, run } = fixture(t)
  rmSync(join(root, 'skills/basic.test.mjs'))
  const job = name => `import { appendFileSync } from 'node:fs'\nappendFileSync('ran', ${JSON.stringify(name)} + '\\n')\n`
  // Run: plain, nested, glob characters, a symlinked file.
  for (const name of ['plain', 'nested/deep', 'odd[1]', 'br{a}ce', 'pa(r)en', 'st*r', 'n!(o)']) put(`skills/${name}.test.mjs`, job(name))
  put('skills/odd1.test.mjs', job('odd1'))
  symlinkSync(join(root, 'skills/plain.test.mjs'), join(root, 'skills/link.test.mjs'))
  // Left out: hidden folders, node_modules, files outside skills/, a symlinked folder.
  for (const dir of ['.hid', '.claude', 'node_modules', 'nested/node_modules']) put(`skills/${dir}/x.test.mjs`, job(`wrong:${dir}`))
  put('hooks/outside.test.mjs', job('wrong:outside'))
  mkdirSync(join(root, 'elsewhere'))
  put('elsewhere/linked.test.mjs', job('wrong:linkdir'))
  symlinkSync(join(root, 'elsewhere'), join(root, 'skills/linkdir'))
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const ran = readFileSync(join(root, 'ran'), 'utf8').trim().split('\n').sort()
  assert.deepEqual(ran, ['br{a}ce', 'n!(o)', 'nested/deep', 'odd1', 'odd[1]', 'pa(r)en', 'plain', 'plain', 'st*r'])
  assert.match(result.stdout, /== gate complete: 10\/10 jobs; 0 failed ==/)
})

test('a shell launch error fails visibly and drains every queued suite', t => {
  const { put, run } = fixture(t)
  put('a.test.sh', 'exit 0\n'); put('b.test.sh', 'exit 0\n')
  const result = run({ PATH: '/nonexistent-war-test-path' })
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stdout, /Launch failed: spawn bash ENOENT/)
  assert.match(result.stdout, /== gate complete: 4\/4 jobs; 2 failed ==/)
})

test('gate(node-staged) reruns the workflow-template files with WAR_TEMPLATE_STRIPPED=1, and per-file jobs run without it', t => {
  const { root, put, run } = fixture(t)
  put('skills/war/assets/workflow-template.js', '// engine stand-in\n')
  put('skills/war/assets/workflow-template.flag.test.mjs', "import { appendFileSync } from 'node:fs'; import { test } from 'node:test'\n" +
    "test('flag', () => { appendFileSync('record', process.env.TMPDIR.split('/').pop() + ' ' + (process.env.WAR_TEMPLATE_STRIPPED ?? 'unset') + '\\n') })\n")
  const result = run()
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /== gate complete: 3\/3 jobs; 0 failed ==/)
  assert.match(result.stdout, /== gate result: gate\(node-staged\); exit=0;/)
  // Each line names the job's scratch dir, so the record shows which child saw the flag.
  const record = readFileSync(join(root, 'record'), 'utf8').trim().split('\n').sort()
  assert.equal(record.length, 2, record.join('\n'))
  assert.equal(record.filter(line => line === 'node-staged.tmp 1').length, 1, record.join('\n'))
  assert.equal(record.filter(line => /^node-[0-9]+\.tmp unset$/.test(line)).length, 1, record.join('\n'))
})

test('gate(node-staged) fails and names the empty match when the engine exists but no topic file does', t => {
  const { put, run } = fixture(t)
  put('skills/war/assets/workflow-template.js', '// engine stand-in\n')
  const result = run()
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stdout, /== gate complete: 2\/2 jobs; 1 failed ==/)
  const block = result.stdout.split('== gate(node-staged) ==')[1]?.split('== gate result:')[0] ?? ''
  assert.match(block, /tests 0/)
  assert.match(block, /matched no tests: skills\/war\/assets\/workflow-template\.\*\.test\.mjs/)
})

test('the staged rerun passes --test-concurrency set from WAR_GATE_NODE_JOBS', t => {
  for (const jobs of ['1', '2']) {
    const { root, put, run } = fixture(t)
    put('skills/war/assets/workflow-template.js', '// engine stand-in\n')
    // Each staged file waits for its peer. Only a concurrency of 2 lets both start together.
    for (const name of ['a', 'b']) {
      put(`skills/war/assets/workflow-template.${name}.test.mjs`, "import { appendFileSync, existsSync, writeFileSync } from 'node:fs'\n" +
        "import { setTimeout } from 'node:timers/promises'; import { test } from 'node:test'\n" +
        `test('${name}', async () => {\n  if (process.env.WAR_TEMPLATE_STRIPPED !== '1') return\n` +
        `  writeFileSync('${name}.ready', '')\n  const deadline = Date.now() + 5000\n` +
        `  while (!existsSync('${name === 'a' ? 'b' : 'a'}.ready') && Date.now() < deadline) await setTimeout(10)\n` +
        `  appendFileSync('record', existsSync('${name === 'a' ? 'b' : 'a'}.ready') ? 'overlap\\n' : 'alone\\n')\n})\n`)
    }
    const result = run({ WAR_GATE_NODE_JOBS: jobs })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    const record = readFileSync(join(root, 'record'), 'utf8').trim().split('\n').sort()
    assert.deepEqual(record, jobs === '1' ? ['alone', 'overlap'] : ['overlap', 'overlap'], `WAR_GATE_NODE_JOBS=${jobs}`)
  }
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

async function terminate(t, preload, thrown) {
  const { root, put, env } = fixture(t)
  put('stubborn.mjs', "import { writeFileSync } from 'node:fs'; process.on('SIGTERM', () => {}); writeFileSync('child.pid', String(process.pid)); setInterval(() => {}, 100)\n")
  put('a.test.sh', `${quote(process.execPath)} stubborn.mjs &\nwait\n`)
  put('z.test.sh', 'touch should-not-run\n')
  if (preload) put('preload.mjs', preload)
  const args = preload ? ['--import', './preload.mjs', runner] : [runner]
  const child = spawn(process.execPath, args, { cwd: root, env: { ...env, WAR_GATE_SHELL_JOBS: '1' } })
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  const closed = new Promise(resolve => child.on('close', (code, signal) => resolve({ code, signal })))
  t.after(() => { if (child.exitCode === null) child.kill('SIGTERM') })
  // The file can exist before its pid is written. An empty read is pid 0, and a kill of
  // pid 0 signals this test's own process group, so wait for a whole pid.
  const deadline = Date.now() + 5000
  const readPid = () => (existsSync(join(root, 'child.pid')) ? readFileSync(join(root, 'child.pid'), 'utf8') : '')
  while (!/^[1-9][0-9]*$/.test(readPid())) {
    assert.ok(Date.now() < deadline, 'descendant started')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  const pid = Number(readPid())
  t.after(() => { try { process.kill(pid, 'SIGKILL') } catch {} })
  child.kill('SIGTERM')
  if (thrown) {
    // Any other kill error still throws out of the stop path, so the gate exits 1.
    assert.deepEqual(await closed, { code: 1, signal: null }, output)
    assert.match(output, new RegExp(`kill ${thrown}`))
    return
  }
  assert.deepEqual(await closed, { code: 143, signal: null }, output)
  assert.match(output, /== gate interrupted:/)
  assert.doesNotMatch(output, /== gate complete:/)
  assert.equal(existsSync(join(root, 'should-not-run')), false)
  // The gate's SIGKILL has been sent, but the orphan's reaper can lag under load. Allow 2 s.
  const reaped = Date.now() + 2000
  const alive = () => { try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') return false; throw error } }
  while (alive() && Date.now() < reaped) await new Promise(resolve => setTimeout(resolve, 20))
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
}

test('termination kills descendants, drains active jobs, and never reports a complete gate', t => terminate(t))

// macOS can refuse a group kill with EPERM when only exiting or zombie members remain.
// The preload sends each group signal for real, then throws EPERM, so the stop path sees it.
const mkKill = code => `const kill = process.kill.bind(process)
process.kill = (pid, signal) => {
  if (pid >= 0) return kill(pid, signal)
  try { kill(pid, signal) } catch {}
  throw Object.assign(new Error('kill ${code}'), { code: '${code}', errno: -1, syscall: 'kill' })
}
`
const epermKill = mkKill('EPERM')
test('a group kill that throws EPERM still exits 143 and never reports a complete gate', t => terminate(t, epermKill))

test('a group kill that throws any other code still throws, so the gate exits 1', t => terminate(t, mkKill('EIO'), 'EIO'))

const pad = n => `# ${'x'.repeat(n)}\n`
const order = root => readFileSync(join(root, 'order'), 'utf8').trim().split('\n')

test('with no recorded times, shell suites start largest file first, ties in path order', t => {
  const { root, put, run } = fixture(t)
  put('a.test.sh', 'echo a >> order\n' + pad(10))
  put('b.test.sh', 'echo b >> order\n' + pad(300))
  put('c.test.sh', 'echo c >> order\n' + pad(10))
  put('nested/d.test.sh', 'echo d >> order\n' + pad(100))
  const result = run({ WAR_GATE_SHELL_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['b', 'd', 'a', 'c'])
})

test('shell suites start slowest first by the last run, and a new suite starts before them', t => {
  const { root, put, run } = fixture(t)
  assert.equal(spawnSync('git', ['init', '-q', root]).status, 0)
  const times = join(root, '.git', 'war-gate-times.json')
  // slow is the smallest file, so size order alone would start it last.
  put('slow.test.sh', 'echo slow >> order; sleep 0.6\n')
  put('mid.test.sh', 'echo mid >> order; sleep 0.3\n' + pad(50))
  put('fast.test.sh', 'echo fast >> order\n' + pad(100))
  let result = run({ WAR_GATE_SHELL_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['fast', 'mid', 'slow'], 'the first run has no record, so size order')
  const recorded = JSON.parse(readFileSync(times, 'utf8'))
  assert.deepEqual(Object.keys(recorded).sort(), ['./fast.test.sh', './mid.test.sh', './skills/basic.test.mjs', './slow.test.sh'])
  assert.ok(recorded['./slow.test.sh'] > recorded['./mid.test.sh'] && recorded['./mid.test.sh'] > recorded['./fast.test.sh'])
  rmSync(join(root, 'order'))
  put('new.test.sh', 'echo new >> order\n')
  result = run({ WAR_GATE_SHELL_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['new', 'slow', 'mid', 'fast'])
  // A suite that no longer exists drops out of the record; a broken record falls back to size order.
  rmSync(join(root, 'mid.test.sh'))
  writeFileSync(times, '{ not json')
  rmSync(join(root, 'order'))
  result = run({ WAR_GATE_SHELL_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['fast', 'slow', 'new'])
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(times, 'utf8'))).sort(), ['./fast.test.sh', './new.test.sh', './skills/basic.test.mjs', './slow.test.sh'])
})

test('the Node pool defaults to 6 and the shell pool to 4 when the knobs are unset', t => {
  const { root, env } = fixture(t)
  const clean = { ...env }
  delete clean.WAR_GATE_SHELL_JOBS
  delete clean.WAR_GATE_NODE_JOBS
  const result = spawnSync(process.execPath, [runner], { cwd: root, env: clean, encoding: 'utf8', timeout: 20000 })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /^Gate workers: 6 Node files \+ 4 shell suites$/m)
})

test('Node test files start slowest first by the last run, and their times are recorded', t => {
  const { root, put, run } = fixture(t)
  assert.equal(spawnSync('git', ['init', '-q', root]).status, 0)
  const times = join(root, '.git', 'war-gate-times.json')
  rmSync(join(root, 'skills/basic.test.mjs'))
  // A file appends its name when it starts; slow holds its only test longest. The gaps
  // (0, 0.7 and 1.4 s) stay wider than process start-up noise on a loaded machine.
  const job = (name, ms) => `import { appendFileSync } from 'node:fs'; import { test } from 'node:test'\n` +
    `appendFileSync('order', '${name}\\n')\ntest('${name}', async () => { await new Promise(r => setTimeout(r, ${ms})) })\n`
  // Padding makes the size order the reverse of the slowest order, and the names make
  // the path order the reverse of the size order, so each run tells the three apart.
  put('skills/c-fast.test.mjs', job('fast', 0) + '// ' + 'x'.repeat(300) + '\n')
  put('skills/b-mid.test.mjs', job('mid', 700) + '// ' + 'x'.repeat(100) + '\n')
  put('skills/a-slow.test.mjs', job('slow', 1400))
  let result = run({ WAR_GATE_NODE_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['fast', 'mid', 'slow'], 'the first run has no record, so size order')
  const recorded = JSON.parse(readFileSync(times, 'utf8'))
  assert.ok(recorded['./skills/a-slow.test.mjs'] > recorded['./skills/b-mid.test.mjs'], JSON.stringify(recorded))
  assert.ok(recorded['./skills/b-mid.test.mjs'] > recorded['./skills/c-fast.test.mjs'], JSON.stringify(recorded))
  rmSync(join(root, 'order'))
  result = run({ WAR_GATE_NODE_JOBS: '1' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(order(root), ['slow', 'mid', 'fast'])
  assert.match(result.stdout, /✔ slow/, 'the spec reporter still writes the gate log')
})
