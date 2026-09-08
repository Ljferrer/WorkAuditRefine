import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, chmodSync, statSync, symlinkSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
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
  mkdirSync(join(root, 'scripts/ci'), { recursive: true })
  writeFileSync(join(root, 'scripts/ci/test-inventory.json'), JSON.stringify(Object.keys(files).filter(f => /^(skills|hooks|adapters|tests\/parity|scripts\/ci)\/.+\.test\.(mjs|sh)$/.test(f)).sort()))
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

test('shell completion requires case evidence and skips on either channel fail', async t => {
  const root = fixture(t, {
    'hooks/empty.test.sh': '',
    'hooks/noop.test.sh': 'exit 0',
    'hooks/stderr.test.sh': 'echo "ok - first"; echo "SKIP missing tool" >&2',
    'hooks/pass.test.sh': 'echo "ok 1 - executed assertion"',
  })
  const report = await collect({ root, output: join(root, 'report') })
  assert.deepEqual(report.suites.map(s => s.status), ['failed', 'failed', 'passed', 'failed'])
  assert.equal(report.suites[2].counts.tests, 1)
  assert.equal(report.suites[3].skips[0].channel, 'stderr')
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

test('nested node uses the running runtime instead of an ambient shim, without forwarding secrets', async t => {
  const root = fixture(t, { 'hooks/nested.test.sh': 'node -e \'if(process.env.WAR_TEST_SECRET) process.exit(8); console.log(process.version)\'; echo "ok - nested runtime"' })
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'node'), '#!/bin/sh\necho ambient-shim >&2; exit 9\n')
  chmodSync(join(bin, 'node'), 0o755)
  const previousPath = process.env.PATH
  const previousSecret = process.env.WAR_TEST_SECRET
  process.env.PATH = bin + ':' + previousPath
  process.env.WAR_TEST_SECRET = 'must-not-reach-suite'
  try {
    const report = await collect({ root, output: join(root, 'report') })
    assert.equal(report.ok, true)
    assert.equal(readFileSync(report.suites[0].stdout, 'utf8').trim(), process.version + '\nok - nested runtime')
  } finally {
    process.env.PATH = previousPath
    if (previousSecret === undefined) delete process.env.WAR_TEST_SECRET
    else process.env.WAR_TEST_SECRET = previousSecret
  }
})

test('CLI exposes the failing child status as nonzero while keeping its diagnostic log', t => {
  const root = fixture(t, { 'hooks/fail.test.sh': 'echo child-failure; exit 7' })
  const output = join(root, 'report')
  assert.throws(() => execFileSync(process.execPath, [fileURLToPath(new URL('./collect.mjs', import.meta.url)), '--run', output], { cwd: root, encoding: 'utf8' }), error => error.status === 1)
  const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'))
  assert.equal(report.suites[0].exitCode, 7)
  assert.match(readFileSync(report.suites[0].stdout, 'utf8'), /child-failure/)
})

test('output floods are bounded and marked failed rather than accepted on exit zero', async t => {
  const root = fixture(t, { 'hooks/flood.test.sh': 'node -e \'process.stdout.write("x".repeat(17*1024*1024))\'' })
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(report.ok, false)
  assert.equal(report.suites[0].failure, 'output-limit')
  assert.equal(readFileSync(report.suites[0].stdout).length, 16*1024*1024)
})

test('revision and tracked-content drift cannot bind earlier results to a new clean SHA', async t => {
  for (const action of ['git -c user.name=Fixture -c user.email=fixture@example.invalid commit --allow-empty -qm moved', 'echo changed >> README.md']) {
    const root = fixture(t, { 'README.md': 'original', 'hooks/move.test.sh': `${action}\necho "ok - ran"` })
    const initial = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    const report = await collect({ root, output: join(root, 'report') })
    assert.equal(report.ok, false)
    assert.equal(report.sourceSha, initial)
    assert.equal(report.stability, 'changed')
    assert.notDeepEqual(report.before, report.after)
  }
})

test('CLI refuses a staged deletion against the reviewed census', t => {
  const root = fixture(t, { 'hooks/a.test.sh': 'echo "ok - a"', 'hooks/b.test.sh': 'echo "ok - b"' })
  execFileSync('git', ['-C', root, 'rm', 'hooks/b.test.sh'])
  assert.throws(() => execFileSync(process.execPath, [fileURLToPath(new URL('./collect.mjs', import.meta.url)), '--run', join(root, 'report')], { cwd: root, encoding: 'utf8', stdio: 'pipe' }), error => error.status !== 0 && /inventory mismatch/.test(error.stderr))
})

test('metadata-shaped bytes cannot be redistributed across dirty files without detection', async t => {
  const root = fixture(t, {
    'a.txt': 'base-a', 'b.txt': 'base-b',
    'z-action.mjs': "import{writeFileSync,statSync}from'node:fs'; const marker=JSON.stringify(['b.txt',statSync('b.txt').mode]); writeFileSync('a.txt','');writeFileSync('b.txt','X'+marker+'Y');",
    'hooks/drift.test.sh': 'node z-action.mjs; echo "ok - mutation"',
  })
  const marker = JSON.stringify(['b.txt', statSync(join(root, 'b.txt')).mode])
  writeFileSync(join(root, 'a.txt'), marker + 'X')
  writeFileSync(join(root, 'b.txt'), 'Y')
  const report = await collect({ root, output: join(root, 'report') })
  assert.deepEqual(report.before.trackedChanges, report.after.trackedChanges)
  assert.equal(report.before.indexDigest, report.after.indexDigest)
  assert.notEqual(report.before.contentDigest, report.after.contentDigest)
  assert.equal(report.ok, false)
})

test('already-dirty content drift is detected without changed path membership', async t => {
  for (const tracked of [true, false]) {
    const root = fixture(t, { ...(tracked ? { 'data.txt': 'base' } : {}), 'hooks/drift.test.sh': 'echo after > data.txt; echo "ok - mutation"' })
    writeFileSync(join(root, 'data.txt'), 'before')
    const report = await collect({ root, output: join(root, 'report') })
    assert.equal(report.before.sourceSha, report.after.sourceSha)
    assert.equal(report.before.indexDigest, report.after.indexDigest)
    assert.deepEqual(report.before.trackedChanges, report.after.trackedChanges)
    assert.deepEqual(report.before.untrackedInputs, report.after.untrackedInputs)
    assert.equal(report.ok, false)
  }
})

test('index-only drift is detected without changing worktree content or path membership', async t => {
  const root = fixture(t, {
    'data.txt': 'base',
    'action.mjs': "import{execFileSync}from'node:child_process';const blob=execFileSync('git',['hash-object','-w','--stdin'],{input:'index-only',encoding:'utf8'}).trim();execFileSync('git',['update-index','--cacheinfo','100644,'+blob+',data.txt']);",
    'hooks/drift.test.sh': 'node action.mjs; echo "ok - mutation"',
  })
  writeFileSync(join(root, 'data.txt'), 'working')
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(report.before.sourceSha, report.after.sourceSha)
  assert.equal(report.before.contentDigest, report.after.contentDigest)
  assert.deepEqual(report.before.trackedChanges, report.after.trackedChanges)
  assert.notEqual(report.before.indexDigest, report.after.indexDigest)
  assert.equal(report.ok, false)
})

test('cleanup error independently prevents successful suite classification', async t => {
  const root = fixture(t, { 'hooks/pass.test.sh': 'echo "ok - assertion"; while [ ! -s report/0/stdout.log ]; do sleep 0.01; done' })
  const original = process.kill
  process.kill = (pid, signal) => {
    if (pid < 0) throw Object.assign(new Error('simulated cleanup denial'), { code: 'EPERM' })
    return original(pid, signal)
  }
  try {
    const report = await collect({ root, output: join(root, 'report') })
    assert.equal(report.suites[0].exitCode, 0)
    assert.equal(report.suites[0].failure, null)
    assert.equal(report.suites[0].cleanupError, 'simulated cleanup denial')
    assert.equal(report.suites[0].status, 'failed')
    assert.equal(report.ok, false)
  } finally { process.kill = original }
})

async function descendantFixture(t, redirected) {
  const root = fixture(t, {
    'worker.mjs': "import{writeFileSync,appendFileSync}from'node:fs'; writeFileSync(process.argv[2],String(process.pid)); setInterval(()=>appendFileSync(process.argv[3],'x'),20);",
    'hooks/background.test.sh': `node worker.mjs report/pid report/heartbeat ${redirected ? '</dev/null >/dev/null 2>&1' : ''} &\nwhile [ ! -f report/heartbeat ]; do sleep 0.02; done\necho "ok - child launched"`,
  })
  const report = await collect({ root, output: join(root, 'report'), timeoutMs: 3000 })
  const pid = Number(readFileSync(join(root, 'report/pid'), 'utf8'))
  t.after(() => { try { process.kill(pid, 'SIGKILL') } catch {} })
  const first = readFileSync(join(root, 'report/heartbeat'), 'utf8')
  await new Promise(resolve => setTimeout(resolve, 150))
  assert.equal(readFileSync(join(root, 'report/heartbeat'), 'utf8'), first, 'redirected descendant must stop executing after parent completes')
  let state = ''
  try { state = execFileSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).trim() } catch (error) { assert.equal(error.status, 1) }
  assert.ok(state === '' || state.startsWith('Z'), `descendant still running: ${state}`)
  assert.equal(report.ok, true)
  assert.equal(report.suites[0].failure, null)
}

test('successful suite exit also terminates redirected descendants', t => descendantFixture(t, true))
test('successful parent exit terminates descendants with inherited output pipes', t => descendantFixture(t, false))

test('cleanup denial with inherited pipes settles a failed report without waiting for descendant exit', async t => {
  for(const mode of ['denied','missing-close']) {
  const root=fixture(t,{
    'worker.mjs':"import{writeFileSync}from'node:fs';writeFileSync('report/ready','ready');setInterval(()=>{},1000)",
    'hooks/denied.test.sh':'node worker.mjs &\nwhile [ ! -f report/ready ]; do sleep 0.02; done\necho "ok - ready"',
  })
  const original=process.kill, groups=new Set()
  process.kill=(pid,signal)=>{
    if(pid < -1) {
      groups.add(pid)
      if(mode==='denied') throw Object.assign(new Error('injected group denial'),{code:'EPERM'})
      return true
    }
    return original(pid,signal)
  }
  let pending, deadline
  try {
    pending=collect({root,output:join(root,'report'),timeoutMs:1000})
    const report=await Promise.race([pending,new Promise(resolve=>{deadline=setTimeout(()=>resolve(null),1500)})])
    assert.notEqual(report,null,'cleanup failure must not depend on child close')
    assert.equal(report.ok,false)
    if(mode==='denied') assert.match(report.suites[0].cleanupError,/injected group denial/)
    else assert.equal(report.suites[0].failure,'process-close-timeout')
    assert.equal(report.suites[0].status,'failed')
    assert.equal(report.suites[0].terminationConfirmed,false)
    assert.ok(Number.isSafeInteger(report.suites[0].processGroupId) && report.suites[0].processGroupId>1)
    assert.deepEqual([...groups],[-report.suites[0].processGroupId],'retained identity must match the owned signal target')
    const saved=readFileSync(join(root,'report/report.json'),'utf8')
    await new Promise(resolve=>setTimeout(resolve,50))
    assert.equal(readFileSync(join(root,'report/report.json'),'utf8'),saved)
  } finally {
    clearTimeout(deadline);process.kill=original
    for(const group of groups) {try{original(group,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}}
    await pending
  }
  }
})

test('shared process owner contains output capture, stream and spawn errors', t => {
  const temporary=mkdtempSync(join(tmpdir(),'war-owner-errors-'))
  t.after(()=>rmSync(temporary,{recursive:true,force:true}))
  for(const mode of ['capture','stream','spawn']) {
    const script=`
      import assert from 'node:assert/strict'
      import {spawn} from 'node:child_process'
      import {ownProcess} from ${JSON.stringify(new URL('./owned-process.mjs',import.meta.url).href)}
      const mode=${JSON.stringify(mode)}, uncaught=[]
      const child=spawn(mode==='spawn' ? ${JSON.stringify(join(temporary,'missing-executable'))} : process.execPath,
        ['-e','process.stdout.write("ready");setInterval(()=>{},1000)'],{detached:true,stdio:['ignore','pipe','pipe']})
      const cleanup=()=>{if(child.pid)try{process.kill(-child.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}}
      const record=error=>{uncaught.push(error.message);cleanup()}
      process.on('uncaughtException',record)
      const owner=ownProcess(child,{timeoutMs:1000,onData(){if(mode==='capture')throw new Error('fixture disk error')}})
      const streamTimer=mode==='stream' ? setTimeout(()=>child.stdout.emit('error',new Error('fixture stream error')),50) : null
      const rescue=setTimeout(cleanup,2000)
      let result
      try{result=await owner.result}finally{clearTimeout(rescue);clearTimeout(streamTimer);process.removeListener('uncaughtException',record);cleanup()}
      assert.deepEqual(uncaught,[])
      assert.match(result.failure,mode==='capture' ? /output capture failed/ : mode==='stream' ? /output stream failed/ : /ENOENT/)
    `
    const result=spawnSync(process.execPath,['--input-type=module','--eval',script],{encoding:'utf8',timeout:4000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
    assert.equal(result.status,0,`${mode}: ${result.stdout}${result.stderr}`)
  }
})

test('zero-exit shell failure rows on either channel still fail', async t => {
  for (const row of ['FAIL - assertion failed', 'not ok 1 - assertion failed']) {
    for (const channel of ['', '>&2']) {
      const root = fixture(t, { 'hooks/fail.test.sh': `echo '${row}' ${channel}; exit 0` })
      const report = await collect({ root, output: join(root, 'report') })
      assert.equal(report.suites[0].exitCode, 0)
      assert.equal(report.suites[0].counts.fail, 1)
      assert.equal(report.suites[0].status, 'failed')
      assert.equal(report.ok, false)
    }
  }
})

test('mode-only drift is detected with stable bytes, index and path membership', async t => {
  const root = fixture(t, { 'data.txt': 'same', 'hooks/mode.test.sh': 'chmod 640 data.txt; echo "ok - permission change"' })
  chmodSync(join(root, 'data.txt'), 0o600)
  const report = await collect({ root, output: join(root, 'report') })
  assert.equal(readFileSync(join(root, 'data.txt'), 'utf8'), 'same')
  assert.equal(report.before.sourceSha, report.after.sourceSha)
  assert.equal(report.before.indexDigest, report.after.indexDigest)
  assert.deepEqual(report.before.trackedChanges, report.after.trackedChanges)
  assert.equal(report.ok, false)
})

test('symlinked tracked suite is rejected before executing its target', async t => {
  const root = fixture(t, { 'target.sh': 'echo changed > sentinel; echo "ok - unexpected execution"', 'hooks/link.test.sh': '' })
  rmSync(join(root, 'hooks/link.test.sh'))
  symlinkSync('../target.sh', join(root, 'hooks/link.test.sh'))
  execFileSync('git', ['-C', root, 'add', 'hooks/link.test.sh'])
  await assert.rejects(collect({ root, output: join(root, 'report') }), /missing regular test file/)
  assert.equal(existsSync(join(root, 'sentinel')), false)
})

test('targeted guard removals fail their independent behavioral regressions', t => {
  const cases = [
    ['shell-count', 'counts.tests < 1', 'false', 'shell completion'],
    ['stderr-skip', "const errorText = readFileSync(stderr, 'utf8')", "const errorText = ''", 'shell completion'],
    ['census', "if (JSON.stringify(inventory) !== JSON.stringify(discovered)) throw new Error('inventory mismatch')", '', 'CLI refuses'],
    ['revision', "stability === 'unchanged' && ", '', 'revision and'],
    ['descendant', "child.once('exit',kill)", '', 'inherited output', 'owned-process.mjs'],
    ['output-limit', 'bytes > 16 * 1024 * 1024', 'false', 'output floods'],
    ['runtime-path', "dirname(process.execPath) + delimiter + (process.env.PATH ?? '')", "process.env.PATH ?? ''", 'nested node'],
    ['index-digest', ".update(git('ls-files', '--stage', '-z'))", ".update('')", 'index-only'],
    ['content-digest', "contentDigest: hash.digest('hex')", "contentDigest: 'removed'", 'already-dirty content'],
    ['cleanup-error', '!execution.cleanupError && ', '', 'cleanup error'],
    ['framing', "hash.update(JSON.stringify([path, stat?.mode ?? null, bytes.length, digest]) + '\\n')", "hash.update(JSON.stringify([path, stat?.mode ?? null])); hash.update(bytes)", 'metadata-shaped'],
    ['failure-row', 'counts.fail > 0', 'false', 'zero-exit shell failure'],
    ['mode', '[path, stat?.mode ?? null, bytes.length, digest]', '[path, null, bytes.length, digest]', 'mode-only'],
    ['regular-file', "lstatSync(join(root, path), { throwIfNoEntry: false })?.isFile()", "lstatSync(join(root, path), { throwIfNoEntry: false })", 'symlinked tracked'],
    ['denial-finalization', '        finish()\n        return', '        return', 'cleanup denial', 'owned-process.mjs'],
    ['drain-deadline', "drainTimer ??= setTimeout(()=>{failure ??= 'process-close-timeout';finish()},250)", '', 'cleanup denial', 'owned-process.mjs'],
    ['capture-error', 'try {onData(channel,chunk)} catch(error) {stop(`output capture failed: ${error.message}`)}', 'onData(channel,chunk)', 'shared process owner', 'owned-process.mjs'],
    ['stream-error', "stream?.on('error',error=>stop(`output stream failed: ${error.message}`))", '', 'shared process owner', 'owned-process.mjs'],
    ['spawn-error', "child.on('error',error=>stop(error.message))", '', 'shared process owner', 'owned-process.mjs'],
    ['group-identity', 'processGroupId:child.pid ?? null, ', '', 'cleanup denial', 'owned-process.mjs'],
  ]
  for (const [name, from, to, pattern, file='collect.mjs'] of cases) {
    const source=readFileSync(new URL(file,import.meta.url),'utf8')
    assert.equal(source.split(from).length, 2, `mutation ${name} must alter one real guard`)
    const root = mkdtempSync(join(tmpdir(), 'war-collector-mutant-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    for(const module of ['collect.mjs','owned-process.mjs']) writeFileSync(join(root,module),readFileSync(new URL(module,import.meta.url)))
    writeFileSync(join(root, file), source.replace(from, to))
    writeFileSync(join(root, 'collect.test.mjs'), readFileSync(fileURLToPath(import.meta.url)))
    writeFileSync(join(root, 'baseline-skips.json'), readFileSync(new URL('./baseline-skips.json', import.meta.url)))
    assert.throws(() => execFileSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, join(root, 'collect.test.mjs')], { env: { ...process.env, NODE_TEST_CONTEXT: undefined }, encoding: 'utf8', timeout: 15000, stdio: 'pipe' }), error => error.status === 1 && /not ok \d+ -/.test(error.stdout) && /AssertionError/.test(error.stdout), `mutation ${name} must fail an assertion, not initialization`)
  }
})
