import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync, writeFileSync, statSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { createGitFixture, startFixtureProcess } from './git-fixture.mjs'
import { startIssueService } from './issue-service.mjs'

test('real kill after push before ledger write survives a new process without a duplicate landing', {timeout:20000}, async t => {
  const fixture = createGitFixture(t)
  const first = startFixtureProcess(fixture, 'land', {checkpoint:'after-push'})
  await first.checkpoint('after-push')
  assert.equal(fixture.remoteTip(), fixture.candidate)
  assert.equal(existsSync(join(fixture.root, 'ledger.json')), false)
  first.kill()
  const killed = await first.result
  assert.equal(killed.signal, 'SIGKILL')
  assert.equal(killed.reason, null, 'the test kills at the checkpoint, not the timeout')
  const restarted = await startFixtureProcess(fixture, 'land').result
  assert.equal(restarted.code, 0, restarted.stderr)
  assert.equal(fixture.remoteTip(), fixture.candidate)
  assert.deepEqual(JSON.parse(readFileSync(join(fixture.root, 'ledger.json'), 'utf8')), {landed:fixture.candidate, reconciledFrom:'git'})
  assert.equal(fixture.remoteUpdates(), 2, 'one baseline update plus exactly one candidate update')
  assert.equal(readFileSync(join(fixture.root, 'pushes.log'), 'utf8').trim().split('\n').length, 1)
  assert.equal((await startFixtureProcess(fixture, 'land').result).code, 0)
  assert.equal(fixture.remoteUpdates(), 2, 'another restart is idempotent')
})

test('malformed persisted ledger fails before any push; a stale known ledger is reconciled', {timeout:20000}, async t => {
  const fixture = createGitFixture(t)
  writeFileSync(join(fixture.root, 'ledger.json'), '{partial')
  const invalid = await startFixtureProcess(fixture, 'land').result
  assert.equal(invalid.code, 1)
  assert.equal(fixture.remoteTip(), fixture.base)
  assert.equal(existsSync(join(fixture.root, 'pushes.log')), false)
  writeFileSync(join(fixture.root, 'ledger.json'), JSON.stringify({landed:fixture.base, reconciledFrom:'git'}))
  assert.equal((await startFixtureProcess(fixture, 'land').result).code, 0)
  assert.equal(JSON.parse(readFileSync(join(fixture.root, 'ledger.json'), 'utf8')).landed, fixture.candidate)
})

test('fixture Git refuses network transports and points origin only at its own bare repository', t => {
  const fixture = createGitFixture(t)
  assert.equal(fixture.git(['remote','get-url','origin']), fixture.remote)
  for (const url of ['https://127.0.0.1:1/not-a-repo', 'ssh://127.0.0.1:1/not-a-repo']) {
    assert.throws(() => fixture.git(['ls-remote', url]), /transport .* not allowed/)
  }
})

test('timeout after issue persistence is recovered by a new client via correlation, not another create', {timeout:20000}, async t => {
  const fixture = createGitFixture(t)
  const service = await startIssueService(t, fixture.root, {timeoutAfterSuccess:true})
  writeFileSync(join(fixture.root, 'service.json'), JSON.stringify({url:service.url, correlation:'case-P15'}))
  const first = await startFixtureProcess(fixture, 'issue').result
  assert.equal(first.code, 1)
  assert.match(first.stderr, /TimeoutError|AbortError/)
  assert.equal(service.issues().length, 1, 'write persisted before response was lost')
  assert.equal(existsSync(join(fixture.root, 'issue-result.json')), false)
  const second = await startFixtureProcess(fixture, 'issue').result
  assert.equal(second.code, 0, second.stderr)
  assert.deepEqual(JSON.parse(readFileSync(join(fixture.root, 'issue-result.json'), 'utf8')), {id:1, correlation:'case-P15'})
  assert.equal(service.issues().length, 1)
  assert.deepEqual(service.requests().map(r => r.method), ['GET','POST','GET'])
})

test('unknown remote state refuses recovery without overwriting ledger or foreign commit', {timeout:20000}, async t => {
  const fixture = createGitFixture(t)
  writeFileSync(join(fixture.work, 'value.txt'), 'foreign\n')
  fixture.git(['commit', '-am', 'foreign'])
  fixture.git(['push', 'origin', 'HEAD:refs/heads/main'])
  const foreign = fixture.remoteTip(), ledger = JSON.stringify({landed:fixture.base, reconciledFrom:'git'})
  writeFileSync(join(fixture.root, 'ledger.json'), ledger)
  const result = await startFixtureProcess(fixture, 'land').result
  assert.equal(result.code, 1)
  assert.match(result.stderr, /unexplained remote tip/)
  assert.equal(fixture.remoteTip(), foreign)
  assert.equal(readFileSync(join(fixture.root, 'ledger.json'), 'utf8'), ledger)
  assert.equal(existsSync(join(fixture.root, 'pushes.log')), false)
})

test('owned processes have bounded hangs/output and reap inherited-pipe descendants on parent exit', {timeout:20000}, async t => {
  const fixture = createGitFixture(t)
  const hung = await startFixtureProcess(fixture, 'hang', {timeoutMs:150}).result
  assert.equal(hung.reason, 'timeout')
  assert.equal(hung.signal, 'SIGKILL')
  const flood = await startFixtureProcess(fixture, 'flood').result
  assert.equal(flood.reason, 'output-limit')
  assert.ok(flood.stdout.length <= 1024*1024)
  const parent = await startFixtureProcess(fixture, 'descendant').result
  assert.equal(parent.code, 0, parent.stderr)
  assert.equal(parent.reason, null, 'parent exit must clean up before the timeout')
  assert.equal(parent.cleanupError, null)
  const heartbeat = join(fixture.root, 'heartbeat')
  const before = statSync(heartbeat).mtimeMs
  await new Promise(resolve => setTimeout(resolve, 120))
  assert.equal(statSync(heartbeat).mtimeMs, before)
})

test('fixture guard removals produce assertion failures in disposable subprocess tests', {timeout:90000}, () => {
  const dir=mkdtempSync(join(tmpdir(),'war-fixture-mutations-'))
  try {
    const files=['git-fixture.test.mjs','git-fixture.mjs','fixture-process.mjs','issue-service.mjs']
    const sources=Object.fromEntries(files.map(file=>[file,readFileSync(new URL(file,import.meta.url),'utf8')]))
    const mutations=[
      ['duplicate landing','fixture-process.mjs','if (tip === base) {','if (tip === base || tip === candidate) {','real kill'],
      ['unknown remote refusal','fixture-process.mjs',"else if (tip !== candidate) throw new Error('unexplained remote tip; refusing to land or repair ledger')",'','unknown remote state'],
      ['ledger read','fixture-process.mjs',"const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : null",'const ledger = null','malformed persisted'],
      ['parent exit cleanup','git-fixture.mjs',"  child.on('exit', kill)",'','owned processes'],
      ['output bound','git-fixture.mjs','stdout.length > 1024*1024','false','owned processes'],
      ['issue correlation','fixture-process.mjs',"const matches = await request('GET')",'const matches = []','timeout after issue'],
    ]
    for (const [name,file,needle,replacement,pattern] of mutations) {
      for (const item of files) copyFileSync(new URL(item,import.meta.url),join(dir,item))
      assert.equal(sources[file].split(needle).length,2,name)
      writeFileSync(join(dir,file),sources[file].replace(needle,replacement))
      const env={...process.env}; delete env.NODE_TEST_CONTEXT
      const result=spawnSync(process.execPath,['--test','--test-reporter=tap',`--test-name-pattern=${pattern}`,join(dir,'git-fixture.test.mjs')],{env,encoding:'utf8',timeout:25000,maxBuffer:4*1024*1024})
      assert.equal(result.status,1,`${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stdout,/not ok/,name)
      assert.match(result.stdout,/AssertionError/,name)
    }
  } finally { rmSync(dir,{recursive:true,force:true}) }
})
