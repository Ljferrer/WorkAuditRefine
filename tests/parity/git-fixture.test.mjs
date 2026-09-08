import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync, writeFileSync, statSync, mkdtempSync, copyFileSync, rmSync, mkdirSync } from 'node:fs'
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
  const malformed=['{partial','null','[]','0','true','"text"','{}',
    JSON.stringify({landed:fixture.base}),
    JSON.stringify({landed:fixture.base,reconciledFrom:'ledger'}),
    JSON.stringify({landed:null,reconciledFrom:'git'}),
    JSON.stringify({landed:'f'.repeat(40),reconciledFrom:'git'}),
    JSON.stringify({landed:fixture.base,reconciledFrom:'git',unknownDecision:'allow'}),
  ]
  for (const text of malformed) {
    writeFileSync(join(fixture.root, 'ledger.json'), text)
    const invalid = await startFixtureProcess(fixture, 'land').result
    assert.equal(invalid.code, 1, text)
    assert.equal(fixture.remoteTip(), fixture.base, text)
    assert.equal(existsSync(join(fixture.root, 'pushes.log')), false, text)
    assert.equal(readFileSync(join(fixture.root, 'ledger.json'),'utf8'),text,'invalid persisted evidence must survive')
  }
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

test('ledger and remote state pairs never turn a contradictory landing claim into another push', {timeout:30000}, async t => {
  const cases=[
    ['absent','base','push'], ['absent','candidate','repair'], ['absent','foreign','refuse'],
    ['base','base','push'], ['base','candidate','repair'], ['base','foreign','refuse'],
    ['candidate','base','refuse'], ['candidate','candidate','repair'], ['candidate','foreign','refuse'],
  ]
  for (const [recorded,remoteState,expected] of cases) {
      const fixture=createGitFixture(t)
      if (remoteState==='foreign') {
        writeFileSync(join(fixture.work,'value.txt'),'foreign\n')
        fixture.git(['commit','-am','foreign'])
      }
      if (remoteState!=='base') fixture.git(['push','origin','HEAD:refs/heads/main'])
      const tip=fixture.remoteTip(), updates=fixture.remoteUpdates()
      const ledger=recorded==='absent' ? null : JSON.stringify({landed:fixture[recorded],reconciledFrom:'git'})
      const path=join(fixture.root,'ledger.json')
      if (ledger!==null) writeFileSync(path,ledger)
      const result=await startFixtureProcess(fixture,'land').result
      const refuses=expected==='refuse'
      assert.equal(result.code,refuses ? 1 : 0,`${recorded}/${remoteState}: ${result.stderr}`)
      if (refuses) {
        assert.equal(fixture.remoteTip(),tip)
        assert.equal(fixture.remoteUpdates(),updates)
        assert.equal(existsSync(join(fixture.root,'pushes.log')),false)
        assert.equal(existsSync(path) ? readFileSync(path,'utf8') : null,ledger)
      } else {
        assert.equal(fixture.remoteTip(),fixture.candidate)
        assert.equal(JSON.parse(readFileSync(path,'utf8')).landed,fixture.candidate)
        assert.equal(fixture.remoteUpdates(),updates+(expected==='push' ? 1 : 0))
        assert.equal(existsSync(join(fixture.root,'pushes.log')),expected==='push')
      }
  }
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

test('fixture cleanup denial with inherited pipes settles failure and preserves uncertain state', {timeout:10000}, async t => {
  for(const mode of ['denied','missing-close']) {
  const fixture=createGitFixture(t), original=process.kill, groups=new Set()
  process.kill=(pid,signal)=>{
    if(pid < -1) {
      groups.add(pid)
      if(mode==='denied') throw Object.assign(new Error('injected fixture cleanup denial'),{code:'EPERM'})
      return true
    }
    return original(pid,signal)
  }
  let pending, deadline
  try {
    pending=startFixtureProcess(fixture,'descendant',{timeoutMs:1000}).result
    const result=await Promise.race([pending,new Promise(resolve=>{deadline=setTimeout(()=>resolve(null),1500)})])
    assert.notEqual(result,null,'fixture result must not depend on child close')
    assert.equal(result.code,null,'unconfirmed cleanup cannot masquerade as successful fixture execution')
    if(mode==='denied') assert.match(result.cleanupError,/injected fixture cleanup denial/)
    else assert.equal(result.reason,'process-close-timeout')
    assert.equal(result.terminationConfirmed,false)
    assert.equal(fixture.cleanupIncomplete,true)
  } finally {
    clearTimeout(deadline);process.kill=original
    for(const group of groups) {try{original(group,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}}
    await pending
    // The injected denial has now been cleaned with the real host capability.
    // Production denials have no such override and preserve their fixture root.
    fixture.cleanupIncomplete=false
  }
  }
})

test('uncertain fixture cleanup fails teardown and retains evidence even when a caller ignores the result', {timeout:10000}, () => {
  const root=mkdtempSync(join(tmpdir(),'war-retained-fixture-')), marker=join(root,'root.json')
  let retained
  try {
    const script=`
      import {test} from 'node:test'
      import {writeFileSync} from 'node:fs'
      import {createGitFixture,startFixtureProcess} from ${JSON.stringify(new URL('./git-fixture.mjs',import.meta.url).href)}
      test('caller ignores result',async t=>{
        const fixture=createGitFixture(t), original=process.kill, groups=new Set()
        writeFileSync(${JSON.stringify(marker)},JSON.stringify(fixture.root))
        process.kill=(pid,signal)=>{if(pid < -1){groups.add(pid);throw Object.assign(new Error('denied'),{code:'EPERM'})}return original(pid,signal)}
        try{await startFixtureProcess(fixture,'descendant').result}
        finally{process.kill=original;for(const group of groups)try{original(group,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}}
      })
    `
    const file=join(root,'retained.test.mjs')
    writeFileSync(file,script)
    const result=spawnSync(process.execPath,['--test',file],{encoding:'utf8',timeout:5000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
    retained=JSON.parse(readFileSync(marker,'utf8'))
    assert.equal(result.status,1,result.stdout+result.stderr)
    assert.match(result.stdout+result.stderr,/fixture cleanup incomplete; evidence retained/)
    assert.equal(existsSync(join(retained,'fixture.json')),true)
  } finally {
    if(retained) rmSync(retained,{recursive:true,force:true})
    rmSync(root,{recursive:true,force:true})
  }
})

test('fixture guard removals produce assertion failures in disposable subprocess tests', {timeout:90000}, () => {
  const dir=mkdtempSync(join(tmpdir(),'war-fixture-mutations-'))
  try {
    const parity=join(dir,'tests/parity'), ci=join(dir,'scripts/ci')
    mkdirSync(parity,{recursive:true});mkdirSync(ci,{recursive:true})
    const files=['git-fixture.test.mjs','git-fixture.mjs','fixture-process.mjs','issue-service.mjs']
    const sources=Object.fromEntries(files.map(file=>[file,readFileSync(new URL(file,import.meta.url),'utf8')]))
    sources['owned-process.mjs']=readFileSync(new URL('../../scripts/ci/owned-process.mjs',import.meta.url),'utf8')
    const mutations=[
      ['duplicate landing','fixture-process.mjs','if (tip === base) {','if (tip === base || tip === candidate) {','real kill'],
      ['unknown remote refusal','fixture-process.mjs',"else if (tip !== candidate) throw new Error('unexplained remote tip; refusing to land or repair ledger')",'','unknown remote state'],
      ['ledger read','fixture-process.mjs',"const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'))","const ledger = {landed:base,reconciledFrom:'git'}",'malformed persisted'],
      ['ledger shape','fixture-process.mjs',"  if (Object.keys(ledger ?? {}).sort().join(',') !== 'landed,reconciledFrom') throw new Error('invalid persisted ledger shape')",'','malformed persisted'],
      ['ledger revision','fixture-process.mjs',"  if (![base, candidate].includes(ledger.landed)) throw new Error('unexplained persisted ledger revision')",'','malformed persisted'],
      ['ledger provenance','fixture-process.mjs',"  if (ledger.reconciledFrom !== 'git') throw new Error('invalid persisted ledger provenance')",'','malformed persisted'],
      ['ledger remote pair','fixture-process.mjs',"if (recordedRevision === candidate && tip === base) throw new Error('ledger-ahead contradiction; explicit landing decision required')",'','ledger and remote'],
      ['ledger pair first arm','fixture-process.mjs','recordedRevision === candidate && tip === base','tip === base','ledger and remote'],
      ['ledger pair second arm','fixture-process.mjs','recordedRevision === candidate && tip === base','recordedRevision === candidate','ledger and remote'],
      ['parent exit cleanup','owned-process.mjs',"  child.once('exit',kill)",'','owned processes'],
      ['output bound','git-fixture.mjs','stdout.length > 1024*1024','false','owned processes'],
      ['issue correlation','fixture-process.mjs',"const matches = await request('GET')",'const matches = []','timeout after issue'],
      ['denial finalization','owned-process.mjs','        finish()\n        return','        return','fixture cleanup denial'],
      ['drain deadline','owned-process.mjs',"drainTimer ??= setTimeout(()=>{failure ??= 'process-close-timeout';finish()},250)",'','fixture cleanup denial'],
      ['teardown failure','git-fixture.mjs',"    if(fixture.cleanupIncomplete) throw new Error(`fixture cleanup incomplete; evidence retained at ${root}`)",'','uncertain fixture cleanup'],
    ]
    for (const [name,file,needle,replacement,pattern] of mutations) {
      for (const item of files) copyFileSync(new URL(item,import.meta.url),join(parity,item))
      writeFileSync(join(ci,'owned-process.mjs'),sources['owned-process.mjs'])
      assert.equal(sources[file].split(needle).length,2,name)
      writeFileSync(join(file==='owned-process.mjs' ? ci : parity,file),sources[file].replace(needle,replacement))
      const env={...process.env}; delete env.NODE_TEST_CONTEXT
      const result=spawnSync(process.execPath,['--test','--test-reporter=tap',`--test-name-pattern=${pattern}`,join(parity,'git-fixture.test.mjs')],{env,encoding:'utf8',timeout:25000,maxBuffer:4*1024*1024})
      assert.equal(result.status,1,`${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stdout,/not ok/,name)
      assert.match(result.stdout,/AssertionError/,name)
    }
  } finally { rmSync(dir,{recursive:true,force:true}) }
})
