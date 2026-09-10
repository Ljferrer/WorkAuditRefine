import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { listSupportedProfiles, resolveCodexPath, runSnipePanel } from './snipe-runner.mjs'
import { buildSnipePlugin } from '../../../package-snipe.mjs'

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'codex-snipe-runner-'))
  git(root, 'init', '-b', 'main')
  git(root, 'config', 'user.email', 'snipe-test@example.invalid')
  git(root, 'config', 'user.name', 'Snipe Test')
  git(root, 'remote', 'add', 'origin', 'https://github.com/example/project.git')
  writeFileSync(join(root, 'review.txt'), 'base\n')
  git(root, 'add', 'review.txt')
  git(root, 'commit', '-m', 'base')
  const base = git(root, 'rev-parse', 'HEAD')
  git(root, 'update-ref', 'refs/remotes/origin/main', base)
  git(root, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')
  writeFileSync(join(root, 'review.txt'), 'base\nchange\n')
  git(root, 'commit', '-am', 'change')
  return root
}

function fakeCodex(body) {
  const root = mkdtempSync(join(tmpdir(), 'codex-snipe-fake-'))
  const path = join(root, 'codex')
  writeFileSync(path, `#!/usr/bin/env node\n${body}\n`)
  chmodSync(path, 0o755)
  return path
}

function validVerdictSource(prefix = '', suffix = '') {
  return `${prefix}
    const prompt = process.argv.at(-1)
    const seat = Number(prompt.match(/AUDIT SEAT (\\d+)/)?.[1] ?? prompt.match(/seat (\\d+)/i)?.[1])
    const lens = prompt.match(/lens: ([^,\\n]+)/)?.[1] ?? prompt.match(/lens '([^']+)'/)?.[1]
    const scopeText = prompt.split('Canonical scope (identical for every seat):\\n')[1]?.split('\\n\\nReview only')[0]
      ?? prompt.split('Canonical scope:\\n')[1].split('\\n\\n')[0]
    const scope = JSON.parse(scopeText)
    const resultScope = scope.kind === 'committed'
      ? { kind: 'committed', audit_sha: scope.headSha }
      : { kind: 'dirty', fingerprint: scope.fingerprint, advisory: true }
    const verdict = { schema_version: 1, seat, lens, scope: resultScope, verdict: 'approve', confidence: 'high', findings: [], tests_verified: { exist: true, inspected: [] } }
    ${suffix}
    console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify(verdict) } }))`
}

const supportedProfiles = { 'gpt-test': ['high'] }
const inheritedProfile = { model: 'gpt-test', effort: 'high' }
const runnerPath = fileURLToPath(new URL('./snipe-runner.mjs', import.meta.url))

test('consolidated returns carry coordinator-owned repair guidance outside auditor evidence', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', `
    verdict.findings = [{severity:'Minor',title:'REPLACE_GUIDANCE_WITH_SEAT_TEXT',rationale:'Auditor content is not coordinator policy.',disposition:'note'}]
  `))
  const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles, coordinatorGuidance: { text: 'REQUEST_OVERRIDE' } }, { codexPath })
  assert.equal(result.coordinatorGuidance?.source, 'references/post-audit-fixes.md')
  assert.match(result.coordinatorGuidance.text, /Fix the defect class/)
  assert.doesNotMatch(result.coordinatorGuidance.text, /REQUEST_OVERRIDE|REPLACE_GUIDANCE_WITH_SEAT_TEXT/)
  assert.match(result.report, /REPLACE_GUIDANCE_WITH_SEAT_TEXT/)
  assert.match(result.report, /#2097 repair discipline/)
  assert.equal(Object.keys(result)[0], 'coordinatorGuidance', 'guidance precedes potentially large seat transcripts')
})

test('every auditor receives repair-review discipline without receiving fixer authority', async () => {
  const cwd = fixture()
  const capture = join(mkdtempSync(join(tmpdir(), 'snipe-auditor-guidance-')), 'prompts.jsonl')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(capture)}, JSON.stringify(prompt) + '\\n')
  `))
  await runSnipePanel({ cwd, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }, { codexPath })
  const prompts = readFileSync(capture, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.equal(prompts.length, 2)
  for (const prompt of prompts) {
    assert.ok(prompt.includes(readFileSync(new URL('../references/auditing-fixes.md', import.meta.url), 'utf8')))
    assert.doesNotMatch(prompt, /# Post-audit repair discipline/)
  }
})

test('guidance survives clean, blocking, invalid, failed and cancelled panels unchanged', async () => {
  const cwd = fixture()
  const expected = readFileSync(new URL('../references/post-audit-fixes.md', import.meta.url), 'utf8')
  const variants = [
    [validVerdictSource(), 'completed'],
    [validVerdictSource('', `verdict.verdict='request_changes'; verdict.findings=[{severity:'Major',title:'Defect',rationale:'A demonstrated failure.'}]`), 'completed'],
    [validVerdictSource('', `verdict.coordinatorGuidance={text:'SEAT_OVERRIDE'}`), 'invalid_result'],
    [`console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'bad json'}}))`, 'invalid_result'],
    ['process.exit(1)', 'failed'],
  ]
  for (const [body, status] of variants) {
    const panel = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex(body) })
    assert.equal(panel.seats[0].status, status)
    assert.equal(panel.coordinatorGuidance.text, expected)
    assert.ok(Object.isFrozen(panel.coordinatorGuidance))
  }
  const cancelled = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex('process.exit(99)'), signal: AbortSignal.abort() })
  assert.equal(cancelled.seats[0].status, 'cancelled')
  assert.equal(cancelled.coordinatorGuidance.text, expected)
})

test('coordinator prepares pinned submodules before seats and disposes their review repositories afterward', async () => {
  const cwd = fixture()
  const pin = git(cwd, 'rev-parse', 'HEAD')
  git(cwd, 'update-index', '--add', '--cacheinfo', '160000', pin, 'vendor/utils')
  git(cwd, 'commit', '-m', 'add locally available gitlink')
  const before = git(cwd, 'status', '--porcelain')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { execFileSync } = await import('node:child_process')
    const module = scope.submodules[0]
    if (!module.reviewRepository) process.exit(9)
    const content = execFileSync('git', ['--git-dir', module.reviewRepository, 'show', module.headObject + ':review.txt'], {encoding:'utf8'})
    if (!content.includes('change')) process.exit(10)
  `))
  const result = await runSnipePanel({ cwd, target: { type: 'ref', ref: pin }, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }, { codexPath })
  assert.equal(result.complete, true, result.report)
  assert.ok(result.seats.every(seat => seat.status === 'completed'))
  assert.equal(existsSync(result.request.scope.submodules[0].reviewRepository), false)
  assert.equal(git(cwd, 'status', '--porcelain'), before)
  const failed = await runSnipePanel({ cwd, target: { type: 'ref', ref: pin }, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex('process.exit(1)') })
  assert.equal(failed.complete, false)
  assert.equal(existsSync(failed.request.scope.submodules[0].reviewRepository), false)
  for(const panel of [result,failed]) {
    assert.equal(panel.retainedRoot,null)
    assert.match(panel.report,/temporary object stores are discarded after review/)
    assert.doesNotMatch(panel.report,/operator cleanup required/)
  }
})

test('unknown worker failure retains prepared objects until the operator can inspect them', async t => {
  const cwd=fixture(), pin=git(cwd,'rev-parse','HEAD')
  git(cwd,'update-index','--add','--cacheinfo','160000',pin,'vendor/utils');git(cwd,'commit','-m','gitlink')
  const codexPath=fakeCodex('process.exit(0)')
  t.after(()=>{rmSync(cwd,{recursive:true,force:true});rmSync(join(codexPath,'..'),{recursive:true,force:true})})
  const signal=new AbortController().signal
  signal.addEventListener=()=>{throw new Error('injected worker setup failure')}
  let retainedRoot
  try {
    await assert.rejects(runSnipePanel({cwd,target:{type:'ref',ref:pin},inheritedProfile,supportedProfiles},{codexPath,signal,timeoutMs:100}),error=>{
      retainedRoot=error.retainedRoot;assert.equal(typeof retainedRoot,'string')
      assert.ok(git(join(retainedRoot,'0'),'show',`${pin}:review.txt`).includes('change'))
      assert.match(error.message,/injected worker setup failure.*operator cleanup required/)
      return true
    })
  } finally {if(retainedRoot)rmSync(retainedRoot,{recursive:true,force:true})}
})

test('uncertain auditor cleanup retains prepared gitlinks and reports operator cleanup', async t => {
  const cwd=fixture(), root=mkdtempSync(join(tmpdir(),'snipe-retain-seat-')), marker=join(root,'pid')
  const pin=git(cwd,'rev-parse','HEAD')
  git(cwd,'update-index','--add','--cacheinfo','160000',pin,'vendor/utils');git(cwd,'commit','-m','gitlink')
  t.after(()=>{rmSync(cwd,{recursive:true,force:true});rmSync(root,{recursive:true,force:true})})
  for(const fault of ['denied','missing-close']) {
    const codexPath=fakeCodex(validVerdictSource('',`
      if(seat===1){
        const {spawn}=await import('node:child_process');const {writeFileSync}=await import('node:fs');
        writeFileSync(${JSON.stringify(marker)},String(process.pid));
        spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'}).unref();
      }
    `))
    const original=process.kill;let panel
    process.kill=(pid,signal)=>{
      if(existsSync(marker) && pid===-Number(readFileSync(marker,'utf8'))){
        if(fault==='denied')throw Object.assign(new Error('injected seat denial'),{code:'EPERM'})
        return true
      }
      return original(pid,signal)
    }
    try {
      panel=await runSnipePanel({cwd,target:{type:'ref',ref:pin},rawArgs:'correctness,security',inheritedProfile,supportedProfiles},{codexPath})
      assert.equal(panel.complete,false);assert.equal(panel.seats[1].validation.status,'valid')
      const repository=panel.request.scope.submodules[0].reviewRepository
      assert.equal(existsSync(repository),true,'uncertain readers must retain their object store')
      assert.equal(join(panel.retainedRoot,'0'),repository)
      assert.ok(git(repository,'show',`${pin}:review.txt`).includes('change'))
      assert.ok(panel.report.includes(panel.retainedRoot));assert.match(panel.report,/operator cleanup required/)
      assert.doesNotMatch(panel.report,/stores are discarded/)
    } finally {
      process.kill=original
      if(existsSync(marker))try{original(-Number(readFileSync(marker,'utf8')),'SIGKILL')}catch(error){if(error.code!=='ESRCH')throw error}
      if(panel?.retainedRoot)rmSync(panel.retainedRoot,{recursive:true,force:true})
      rmSync(marker,{force:true});rmSync(join(codexPath,'..'),{recursive:true,force:true})
    }
  }
})

function catalogCodex() {
  return fakeCodex(`
    if (process.argv[2] === 'app-server') {
      const { createInterface } = await import('node:readline')
      createInterface({ input: process.stdin }).on('line', line => {
        const request = JSON.parse(line)
        if (request.method === 'initialized') return
        if (!['initialize', 'model/list'].includes(request.method)) process.exit(9)
        const result = request.method === 'initialize' ? {} : request.params.cursor
          ? { data: [{model:'gpt-other', supportedReasoningEfforts:[{reasoningEffort:'low'}]}], nextCursor:null }
          : { data: [{model:'gpt-test', supportedReasoningEfforts:[{reasoningEffort:'high'}]}], nextCursor:'page2' }
        console.log(JSON.stringify({id:request.id, result}))
      })
    } else {
      ${validVerdictSource()}
    }
  `)
}

test('packaged Snipe runner executes profile discovery through an explicit alias',t=>{
  const root=mkdtempSync(join(tmpdir(),'snipe-runner-alias-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const output=join(root,'package'),alias=join(root,'runner.mjs'),codexPath=catalogCodex()
  t.after(()=>rmSync(join(codexPath,'..'),{recursive:true,force:true}))
  buildSnipePlugin({repoRoot:fileURLToPath(new URL('../../../../../',import.meta.url)),output})
  symlinkSync(join(output,'skills/snipe/assets/snipe-runner.mjs'),alias)
  const result=spawnSync(process.execPath,[alias,'--list-profiles','--codex-path',codexPath],{encoding:'utf8',timeout:10000})
  assert.equal(result.status,0,result.stderr)
  assert.ok(result.stdout.trim(),'runner must not silently skip main')
  assert.deepEqual(JSON.parse(result.stdout),{'gpt-test':['high'],'gpt-other':['low']})
})

test('host catalog discovery initializes and consumes every model page without starting a turn', async () => {
  assert.deepEqual({ ...await listSupportedProfiles({ codexPath: catalogCodex() }) }, { 'gpt-test': ['high'], 'gpt-other': ['low'] })
})

test('Desktop runtime resolves Codex without a PATH alias; explicit overrides fail closed', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'snipe-desktop-')))
  const resources = join(root, 'Test App.app', 'Contents', 'Resources')
  mkdirSync(resources, { recursive: true })
  const binary = join(resources, 'codex')
  copyFileSync(catalogCodex(), binary)
  chmodSync(binary, 0o755)
  const env = { PATH: '', CODEX_MCP_NODE_PATH: join(resources, 'cua_node/bin/node') }
  assert.equal(resolveCodexPath(undefined, env), binary)
  assert.equal(resolveCodexPath(undefined, { PATH: resources }), binary)
  assert.equal(resolveCodexPath(undefined, { PATH: '', SNIPE_CODEX_BIN: binary }), binary)
  assert.throws(() => resolveCodexPath('/missing/codex', env), error => error.code === 'CODEX_EXECUTABLE_UNAVAILABLE' && /\/missing\/codex.*--codex-path/.test(error.message))
  assert.throws(() => resolveCodexPath(undefined, { PATH: '' }), /CODEX|Codex executable unavailable/)

  // Absolute shebang removes even Node's PATH dependency from the fake host.
  writeFileSync(binary, readFileSync(binary, 'utf8').replace('#!/usr/bin/env node', `#!${process.execPath}`))
  const profiles = JSON.parse(execFileSync(process.execPath, [runnerPath, '--list-profiles', '--codex-path', binary], { env: { ...process.env, PATH: '' }, encoding: 'utf8' }))
  assert.deepEqual(profiles['gpt-test'], ['high'])
  const cwd = fixture()
  const requestPath = join(root, 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'high' } }))
  // Git is available, but neither system directory contains a Codex executable.
  const result = JSON.parse(execFileSync(process.execPath, [runnerPath, '--request', requestPath], {
    env: { ...process.env, PATH: '/usr/bin:/bin', SNIPE_CODEX_BIN: undefined, CODEX_MCP_NODE_PATH: env.CODEX_MCP_NODE_PATH }, encoding: 'utf8',
  }))
  assert.equal(result.complete, true)
})

test('CLI accepts explicit profile without task metadata or a supplied profile map', () => {
  const cwd = fixture()
  const requestPath = join(mkdtempSync(join(tmpdir(), 'snipe-explicit-')), 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'high' } }))
  const result = JSON.parse(execFileSync(process.execPath, [runnerPath, '--request', requestPath, '--codex-path', catalogCodex()], { encoding: 'utf8' }))
  assert.equal(result.complete, true)
  assert.deepEqual(result.request.profile, { model: 'gpt-test', effort: 'high' })
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'unsupported' } }))
  assert.throws(() => execFileSync(process.execPath, [runnerPath, '--request', requestPath, '--codex-path', catalogCodex()], { stdio: 'pipe' }), error => /UNSUPPORTED_PROFILE/.test(error.stderr.toString()))
})

test('catalog errors, malformed output, early exit and timeout fail visibly', async () => {
  for (const body of [
    `console.log(JSON.stringify({id:0,error:{message:'unavailable'}}))`,
    `console.log('not JSON')`,
    `process.exit(1)`,
    `setInterval(() => {}, 1000)`,
  ]) {
    await assert.rejects(listSupportedProfiles({ codexPath: fakeCodex(body), timeoutMs: 200 }), error => error.code === 'PROFILE_DISCOVERY_FAILED')
  }
})

test('cleanup failures are bounded, preserve causes and peers, and never become successful audits', {timeout:90000}, t => {
  const cwd=fixture()
  t.after(()=>rmSync(cwd,{recursive:true,force:true}))
  for(const surface of ['catalog','seat']) for(const fault of ['denied','missing-close']) for(const mode of ['success','timeout','output','cancel','exit']) {
    const root=mkdtempSync(join(tmpdir(),'snipe-cleanup-matrix-')), marker=join(root,'pid')
    const setup=`
      const {spawn}=await import('node:child_process'); const {writeFileSync}=await import('node:fs');
      writeFileSync(${JSON.stringify(marker)},String(process.pid));
      spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'}).unref();
    `
    const trigger=mode==='output' ? `console.log('x'.repeat(1024*1024+1))` : mode==='exit' ? 'process.exit(1)' : ''
    const catalogSuccess=`console.log(JSON.stringify({id:0,result:{}}));console.log(JSON.stringify({id:1,result:{data:[{model:'gpt-test',supportedReasoningEfforts:[{reasoningEffort:'high'}]}]}}))`
    const body=surface==='catalog' ? `${setup}${trigger};${mode==='success' ? catalogSuccess : ''};setInterval(()=>{},1000)`
      : validVerdictSource('', `if(seat===1){${setup}${trigger};${mode==='success' ? '' : 'await new Promise(()=>setInterval(()=>{},1000))'}}`)
    const codexPath=join(root,'codex')
    writeFileSync(codexPath,`#!/usr/bin/env node\n${body}\n`);chmodSync(codexPath,0o755)
    const script=`
      import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';
      import {listSupportedProfiles,runSnipePanel} from ${JSON.stringify(pathToFileURL(runnerPath).href)};
      const original=process.kill, marker=${JSON.stringify(marker)}, calls=[];
      process.kill=(pid,signal)=>{
        if(existsSync(marker) && pid===-Number(readFileSync(marker,'utf8'))){calls.push(pid);${fault==='denied' ? "throw Object.assign(new Error('injected denial'),{code:'EPERM'})" : 'return true'}}
        return original(pid,signal)
      };
      const controller=new AbortController();
      const cancel=setInterval(()=>{if(${JSON.stringify(mode)}==='cancel' && existsSync(marker))controller.abort()},10);
      const options={codexPath:${JSON.stringify(codexPath)},timeoutMs:3000,signal:controller.signal,capacity:2,maxOutputBytes:4096};
      try{
        let state;
        if(${JSON.stringify(surface)}==='catalog'){
          try{await listSupportedProfiles(options);assert.fail('catalog cleanup cannot succeed')}catch(error){
            assert.equal(error.code,'PROFILE_DISCOVERY_FAILED');state=error;
            assert.ok(error.message.includes(${JSON.stringify({success:'cleanup failed',timeout:'timed out',output:'output exceeded limit',cancel:'cancelled',exit:'exited before returning a catalog'}[mode])}),'original discovery reason retained: '+error.message);
          }
        }else{
          const panel=await runSnipePanel({cwd:${JSON.stringify(cwd)},rawArgs:'correctness,security',inheritedProfile:${JSON.stringify(inheritedProfile)},supportedProfiles:${JSON.stringify(supportedProfiles)}},options);
          state=panel.seats[0];assert.equal(panel.complete,false);assert.notEqual(state.status,'completed');
          if(${JSON.stringify(mode)}!=='cancel')assert.equal(panel.seats[1].validation.status,'valid','healthy peer retained');
          assert.match(panel.report,/termination unconfirmed/);
          assert.ok(panel.report.includes(${JSON.stringify(fault==='denied'?'injected denial':'Process close not observed within cleanup drain deadline')}),'report projects cleanup message');
          if(${JSON.stringify(mode)}==='timeout')assert.equal(state.status,'timed_out');
          if(${JSON.stringify(mode)}==='output')assert.equal(state.status,'output_limit');
          if(${JSON.stringify(mode)}==='cancel')assert.equal(state.status,'cancelled');
          if(${JSON.stringify(mode)}==='success')assert.equal(state.status,'failed','successful parent with uncertain cleanup cannot become a timeout or approval');
          if(${JSON.stringify(mode)}==='exit'){assert.equal(state.status,'failed');assert.equal(state.exitCode,1)}
        }
        assert.equal(state.cleanupError.code,${JSON.stringify(fault==='denied'?'EPERM':'CLEANUP_CLOSE_TIMEOUT')});
        assert.equal(state.cleanupError.message,${JSON.stringify(fault==='denied'?'injected denial':'Process close not observed within cleanup drain deadline')});
        if(${JSON.stringify(surface)}==='catalog')assert.ok(state.message.includes(state.cleanupError.message),'catalog projects cleanup message');
        else assert.ok(state.validation.error.includes(state.cleanupError.message),'seat projects cleanup message');
        assert.equal(state.terminationConfirmed,false);assert.equal(state.processGroupId,Number(readFileSync(marker,'utf8')));
        assert.deepEqual(calls,[-state.processGroupId],'cleanup must not retry');
      }finally{clearInterval(cancel);process.kill=original}
    `
    try {
      const result=spawnSync(process.execPath,['--input-type=module','--eval',script],{encoding:'utf8',timeout:6000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
      assert.equal(result.status,0,`${surface}/${fault}/${mode}: ${result.stdout}${result.stderr}`)
    } finally {
      if(existsSync(marker))try{process.kill(-Number(readFileSync(marker,'utf8')),'SIGKILL')}catch(error){if(error.code!=='ESRCH')throw error}
      rmSync(root,{recursive:true,force:true})
    }
  }
})

test('non-group natural exits succeed across discovery, seats and preparation; live refusal still fails', async () => {
  const root=mkdtempSync(join(tmpdir(),'snipe-non-group-'))
  const repo=fileURLToPath(new URL('../../../../../',import.meta.url))
  const assets=join(root,'adapters/codex/skills/snipe/assets')
  try {
    for(const path of ['adapters/codex','skills/snipe/assets/snipe-args.mjs','skills/war/assets/war-config.mjs','skills/_shared/provision.mjs'])cpSync(join(repo,path),join(root,path),{recursive:true})
    const path=join(assets,'snipe-process.mjs')
    writeFileSync(path,readFileSync(path,'utf8').replace("export const processGroup = process.platform !== 'win32'",'export const processGroup = false'))
    const {processTreeCleanup}=await import(pathToFileURL(path))
    const {EventEmitter}=await import('node:events')
    const live=Object.assign(new EventEmitter(),{pid:123,exitCode:null,signalCode:null,kill:()=>false,unref:()=>{}})
    const stop=processTreeCleanup(live);stop()
    assert.equal((await stop.settled).cleanupError.code,'SIGNAL_NOT_DELIVERED')
    for(const [suite,pattern] of [['snipe-runner.test.mjs','CLI accepts explicit profile'],['snipe-submodules.test.mjs','preparation copies exact local']]) {
      const result=spawnSync(process.execPath,['--test',`--test-name-pattern=${pattern}`,join(assets,suite)],{encoding:'utf8',timeout:30000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
      assert.equal(result.status,0,`${suite}: ${result.stdout}${result.stderr}`)
    }
  } finally {rmSync(root,{recursive:true,force:true})}
})

test('cleanup guard removals fail behavioral assertions in disposable copies', {timeout:240000}, () => {
  const root=mkdtempSync(join(tmpdir(),'snipe-cleanup-mutants-'))
  const repo=fileURLToPath(new URL('../../../../../',import.meta.url))
  const assets=join(root,'adapters/codex/skills/snipe/assets')
  try {
    for(const path of ['adapters/codex','skills/snipe/assets/snipe-args.mjs','skills/war/assets/war-config.mjs','skills/_shared/provision.mjs'])cpSync(join(repo,path),join(root,path),{recursive:true})
    const cases=[
      ['denial containment','snipe-process.mjs','        finish()\n        return','        throw error','cleanup failures are bounded'],
      ['drain bound','snipe-process.mjs',"      cleanupError = { code: 'CLEANUP_CLOSE_TIMEOUT', message: 'Process close not observed within cleanup drain deadline' }\n      finish()",'','cleanup failures are bounded'],
      ['parent exit','snipe-process.mjs',"  child.once('exit', stop)",'','cleanup failures are bounded'],
      ['identity','snipe-process.mjs','processGroupId: child.pid ?? null,','processGroupId: null,','cleanup failures are bounded'],
      ['discovery refusal','codex-models.mjs','if (failure || cleanup.cleanupError)','if (failure)','cleanup failures are bounded'],
      ['seat refusal','snipe-runner.mjs','!cleanup.cleanupError && child.exitCode','child.exitCode','cleanup failures are bounded'],
      ['preparation retention','snipe-submodules.mjs','      error.retainedRoot = temporary','      dispose(); error.retainedRoot = temporary','cleanup denial stops'],
      ['late metadata refusal','snipe-submodules.mjs','if (error.cleanupError) throw error /* Local objects','/* Local objects','late metadata cleanup'],
      ['Git original exit','snipe-submodules.mjs','const exitCode = pending.child.exitCode, signal = pending.child.signalCode','const exitCode = null, signal = null','late metadata cleanup'],
      ['non-group natural exit','snipe-process.mjs','child.exitCode === null && child.signalCode === null && ','','non-group natural exits'],
      ['discovery original cause','codex-models.mjs',"${failure ?? 'Codex model/list cleanup failed'}",'lost original cause','cleanup failures are bounded'],
      ['uncertain reader retention','snipe-runner.mjs','retainPreparation = seats.some(seat => seat.cleanupError)','retainPreparation = false','uncertain auditor cleanup'],
      ['unknown reader retention','snipe-runner.mjs','let retainPreparation = true','let retainPreparation = false','unknown worker failure'],
      ['cleanup message preservation','snipe-process.mjs','message: error.message','message: "generic"','cleanup failures are bounded'],
      ['normal report projection','snipe-runner.mjs','retainedRoot: retainPreparation ? preparation.root ?? null : null','retainedRoot: preparation.root ?? null','coordinator prepares pinned submodules'],
    ]
    for(const [name,file,from,to,pattern] of cases){
      for(const module of ['snipe-process.mjs','snipe-runner.mjs','codex-models.mjs','snipe-submodules.mjs'])copyFileSync(join(repo,'adapters/codex/skills/snipe/assets',module),join(assets,module))
      const path=join(assets,file), source=readFileSync(path,'utf8')
      assert.equal(source.split(from).length,2,name)
      writeFileSync(path,source.replace(from,to))
      const suite=['cleanup denial stops','late metadata cleanup'].includes(pattern) ? 'snipe-submodules.test.mjs' : 'snipe-runner.test.mjs'
      const result=spawnSync(process.execPath,['--test','--test-reporter=tap',`--test-name-pattern=${pattern}`,join(assets,suite)],{encoding:'utf8',timeout:45000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
      assert.equal(result.status,1,`${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stdout,/AssertionError/,name)
    }
  }finally{rmSync(root,{recursive:true,force:true})}
})

test('catalog completion and failures terminate inherited descendant processes', async () => {
  for (const mode of ['success', 'malformed', 'timeout', 'output', 'exit', 'cancel', 'error']) {
    const pidPath = join(mkdtempSync(join(tmpdir(), 'snipe-descendant-')), 'pid')
    const codexPath = fakeCodex(`
      const { spawn } = await import('node:child_process')
      const { writeFileSync } = await import('node:fs')
      const descendant = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'inherit'})
      writeFileSync(${JSON.stringify(pidPath)}, String(descendant.pid))
      if (${JSON.stringify(mode)} === 'success') {
        console.log(JSON.stringify({id:0,result:{}}))
        console.log(JSON.stringify({id:1,result:{data:[{model:'gpt-test',supportedReasoningEfforts:[{reasoningEffort:'high'}]}]}}))
      } else if (${JSON.stringify(mode)} === 'malformed') console.log('bad JSON')
      else if (${JSON.stringify(mode)} === 'output') console.log('x'.repeat(1024*1024+1))
      else if (${JSON.stringify(mode)} === 'exit') process.exit(1)
      else if (${JSON.stringify(mode)} === 'error') console.log(JSON.stringify({id:0,error:{message:'catalog unavailable'}}))
      setInterval(() => {}, 1000)
    `)
    let pid
    const controller = new AbortController()
    const cancelTimer = mode === 'cancel' ? setInterval(() => { if (existsSync(pidPath)) controller.abort() }, 10) : null
    try {
      const pending = listSupportedProfiles({ codexPath, timeoutMs: 3000, signal: controller.signal })
      if (mode === 'success') await pending
      else await assert.rejects(pending, { code: 'PROFILE_DISCOVERY_FAILED' })
      pid = Number(readFileSync(pidPath, 'utf8'))
      await new Promise(resolve => setTimeout(resolve, 50))
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, mode)
    } finally {
      clearInterval(cancelTimer)
      pid ??= existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8')) : null
      if (pid) { try { process.kill(pid, 'SIGKILL') } catch {} }
    }
  }
})

test('successful auditor exit kills descendants even when they close inherited pipes', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'snipe-seat-descendant-')), 'pid')
  const codexPath = fakeCodex(validVerdictSource(`
    const { spawn } = await import('node:child_process')
    const { writeFileSync } = await import('node:fs')
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore'})
    child.unref()
    writeFileSync(${JSON.stringify(pidPath)}, String(child.pid))
  `))
  let pid
  try {
    const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath })
    assert.equal(result.complete, true)
    pid = Number(readFileSync(pidPath, 'utf8'))
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  } finally {
    pid ??= existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8')) : null
    if (pid) { try { process.kill(pid, 'SIGKILL') } catch {} }
  }
})

test('one seat runs through a fresh read-only Codex process with the canonical scope', async () => {
  const cwd = fixture()
  const capturePath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-capture-')), 'capture.json')
  const codexPath = fakeCodex(validVerdictSource('', `
    const argv = process.argv.slice(2)
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify({ argv: argv.slice(0, -1), prompt }))
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    concern: 'Focus on cancellation semantics.',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.complete, true)
  assert.equal(result.stability.stable, true)
  assert.equal(result.seats.length, 1)
  assert.equal(result.seats[0].status, 'completed')
  assert.equal(result.seats[0].lens, 'correctness')
  assert.equal(result.seats[0].rationale, 'operator-pinned lens')
  const response = JSON.parse(readFileSync(capturePath, 'utf8'))
  assert.deepEqual(response.argv.slice(0, 7), [
    'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--sandbox', 'read-only', '--json',
  ])
  assert.ok(response.argv.includes('approval_policy="never"'))
  assert.ok(response.argv.includes('mcp_servers={}'))
  assert.ok(response.argv.includes('shell_environment_policy.inherit="none"'))
  assert.ok(response.argv.includes('shell_environment_policy.set.GIT_NO_REPLACE_OBJECTS="1"'))
  assert.ok(response.argv.includes('shell_environment_policy.set.GIT_NO_LAZY_FETCH="1"'))
  for (const capability of ['multi_agent', 'apps', 'browser_use', 'computer_use', 'in_app_browser', 'plugins', 'hooks']) {
    assert.ok(response.argv.some((value, index) => value === '--disable' && response.argv[index + 1] === capability))
  }
  assert.match(response.prompt, new RegExp(result.request.scope.headSha))
  assert.match(response.prompt, /AUDIT SEAT 1 — lens: correctness/)
  assert.match(response.prompt, /Operator concern: Focus on cancellation semantics\./)
  assert.match(response.prompt, /"schema_version": 1/)
  assert.match(response.prompt, new RegExp(`"audit_sha": "${result.request.scope.headSha}"`))
  assert.match(response.prompt, /Return exactly one JSON object with no Markdown or prose wrapper/)
  assert.match(response.prompt, /Do not widen the panel/)
  assert.match(response.prompt, /Do not use connectors or request escalation/)
})

test('auditor policy preserves original blobs and removing its injection breaks the evidence oracle', async () => {
  const cwd = fixture()
  git(cwd, 'replace', git(cwd, 'rev-parse', 'HEAD:review.txt'), git(cwd, 'rev-parse', 'refs/remotes/origin/main:review.txt'))
  assert.equal(git(cwd, 'show', 'HEAD:review.txt'), 'base')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { execFileSync } = await import('node:child_process')
    const env = {PATH:'/usr/bin:/bin'}
    for (const arg of process.argv) {
      const match = arg.match(/^shell_environment_policy\\.set\\.([^=]+)=(.*)$/)
      if (match) env[match[1]] = JSON.parse(match[2])
    }
    const actual = execFileSync('/usr/bin/git', ['show', scope.headSha + ':review.txt'], {cwd:scope.repository,env,encoding:'utf8'})
    if (actual !== 'base\\nchange\\n') process.exit(61)
  `))
  const input = { cwd, inheritedProfile, supportedProfiles }
  assert.equal((await runSnipePanel(input, { codexPath })).complete, true)
  const output = join(mkdtempSync(join(tmpdir(), 'snipe-policy-mutant-')), 'plugin')
  buildSnipePlugin({ repoRoot: fileURLToPath(new URL('../../../../../', import.meta.url)), output })
  const file = join(output, 'skills/snipe/assets/snipe-runner.mjs')
  const original = readFileSync(file, 'utf8')
  const mutant = original.replace(/^.*Object.entries\(gitEvidenceEnvironment\).*\n/m, '')
  assert.notEqual(mutant, original)
  writeFileSync(file, mutant)
  const runner = await import(pathToFileURL(file))
  const result = await runner.runSnipePanel(input, { codexPath })
  assert.equal(result.complete, false)
  assert.equal(result.seats[0].exitCode, 61)
})

test('five independent seats are capacity-bounded, distinct, and receive identical scope', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-concurrency-')), 'events.log')
  const codexPath = fakeCodex(validVerdictSource(`
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, 'start ' + process.pid + '\\n')
    await new Promise(resolve => setTimeout(resolve, 120))
  `, `appendFileSync(${JSON.stringify(logPath)}, 'end ' + process.pid + ' ' + Buffer.from(JSON.stringify(scope)).toString('base64') + '\\n')`))

  const result = await runSnipePanel({
    cwd,
    rawArgs: '5 correctness,security,auto',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, true)
  assert.equal(result.seats.length, 5)
  assert.equal(new Set(result.seats.map(seat => seat.lens)).size, 5)
  assert.ok(result.seats.every(seat => typeof seat.rationale === 'string' && seat.rationale.length > 0))
  let active = 0
  let maximum = 0
  const events = readFileSync(logPath, 'utf8').trim().split('\n')
  for (const event of events) {
    active += event.startsWith('start ') ? 1 : -1
    maximum = Math.max(maximum, active)
  }
  assert.equal(active, 0)
  assert.equal(maximum, 2)
  assert.equal(new Set(events.filter(event => event.startsWith('start ')).map(event => event.split(' ')[1])).size, 5, 'each seat has a fresh process')
  assert.equal(new Set(events.filter(event => event.startsWith('end ')).map(event => event.split(' ')[2])).size, 1, 'scope is byte-identical')
})

test('a nonzero seat is retained without losing a successful peer', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource(`
    if (process.argv.at(-1).includes('lens: security')) {
      console.error('seat transport failed')
      process.exit(7)
    }
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness,security',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, false)
  assert.deepEqual(result.seats.map(seat => [seat.lens, seat.status, seat.exitCode]), [
    ['correctness', 'completed', 0],
    ['security', 'failed', 7],
  ])
  assert.match(result.seats[1].stderr, /seat transport failed/)
})

test('stable parent scope and approving seats cannot hide missing changed gitlink contents', async () => {
  const cwd = fixture()
  git(cwd, 'update-index', '--add', '--cacheinfo', '160000', 'a'.repeat(40), 'vendor/utils')
  git(cwd, 'commit', '-m', 'consume unavailable submodule')
  const codexPath = fakeCodex(validVerdictSource())
  const input = { cwd, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }
  const result = await runSnipePanel(input, { codexPath })
  assert.equal(result.stability.stable, true)
  assert.ok(result.seats.every(seat => seat.status === 'completed' && seat.verdict.verdict === 'approve'))
  assert.equal(result.complete, false)
  assert.deepEqual(result.coverage.unavailablePaths, ['vendor/utils'])
  assert.match(result.report, /INCOMPLETE/)
  assert.match(result.report, /Review coverage: incomplete/)
  assert.match(result.report, /vendor\/utils/)
  const request = join(mkdtempSync(join(tmpdir(), 'snipe-coverage-')), 'request.json')
  writeFileSync(request, JSON.stringify(input))
  assert.throws(() => execFileSync(process.execPath, [runnerPath, '--request', request, '--codex-path', codexPath], { stdio: 'pipe' }), error => error.status === 1 && JSON.parse(error.stdout).complete === false)
})

test('a seat reporting absent tests completes without a repair that invents evidence', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', 'verdict.tests_verified = { exist: false, inspected: [] }'))
  const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath, timeoutMs: 2_000 })
  assert.equal(result.complete, true)
  assert.equal(result.seats[0].repair.attempted, false)
  assert.deepEqual(result.seats[0].verdict.tests_verified, { exist: false, inspected: [] })
})

test('malformed judgment is preserved without launching a replacement review', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-repair-')), 'attempts.log')
  const codexPath = fakeCodex(validVerdictSource(`
    const { appendFileSync, readFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, 'attempt\\n')
    if (readFileSync(${JSON.stringify(logPath)}, 'utf8').trim().split('\\n').length === 1) {
      console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"verdict":' } }))
      process.exit(0)
    }
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(readFileSync(logPath, 'utf8').trim().split('\n').length, 1)
  assert.equal(result.complete, false)
  assert.equal(result.seats[0].status, 'invalid_result')
  assert.equal(result.seats[0].validation.status, 'invalid')
  assert.equal(result.seats[0].repair.attempted, false)
  assert.equal(result.seats[0].verdict, null)
  assert.equal(result.seats[0].response, '{"verdict":')
})

test('a persistently invalid seat is incomplete while a valid peer finding survives', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-invalid-')), 'attempts.log')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, lens + '\\n')
    if (lens === 'security') {
      console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"verdict":' } }))
      process.exit(0)
    }
    verdict.verdict = 'request_changes'
    verdict.findings = [{ severity: 'Major', title: 'Input bypasses validation', file: 'review.txt', rationale: 'The changed path accepts NaN.' }]
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness,security',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, false)
  assert.equal(result.seats[0].validation.status, 'valid')
  assert.equal(result.seats[0].verdict.findings[0].title, 'Input bypasses validation')
  assert.equal(result.seats[1].status, 'invalid_result')
  assert.equal(result.seats[1].repair.attempted, false)
  assert.equal(result.seats[1].repair.succeeded, false)
  assert.deepEqual(readFileSync(logPath, 'utf8').trim().split('\n').sort(), ['correctness', 'security'])
  assert.match(result.report, /INCOMPLETE — do not interpret this panel as clean/)
  assert.match(result.report, /Input bypasses validation/)
  assert.match(result.report, /Seat 2 · security: invalid_result/)
})

test('widen and disposition fields remain report-only without launching actions or seats', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', `
    verdict.widen = ['security', 'cascading-impact']
    verdict.findings = [
      { severity: 'Minor', title: 'Mechanical correction', rationale: 'The edit is fully specified.', disposition: 'absorb' },
      { severity: 'Nit', title: 'Later migration', rationale: 'The release slot is separate.', disposition: 'follow-up', barrier: 'barrier:release-slot' },
    ]
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.seats.length, 1)
  assert.equal(result.complete, true)
  assert.deepEqual(result.seats[0].verdict.widen, ['security', 'cascading-impact'])
  assert.match(result.report, /no extra seats launched/i)
  assert.match(result.report, /Disposition: absorb \(classification only\)/)
  assert.match(result.report, /Disposition: follow-up \(classification only\)/)
})

test('dirty scope changed during a seat is reported unstable and cannot complete cleanly', async () => {
  const cwd = fixture()
  writeFileSync(join(cwd, 'initial-untracked.txt'), 'before\n')
  const codexPath = fakeCodex(validVerdictSource(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync('concurrent-change.txt', 'changed during review\\n')
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.seats[0].status, 'completed')
  assert.equal(result.request.scope.kind, 'dirty')
  assert.equal(result.stability.stable, false)
  assert.equal(result.complete, false)
})

test('a timed-out seat is terminated and reported distinctly', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-timeout-')), 'pid')
  const codexPath = fakeCodex(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(pidPath)}, String(process.pid))
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 800 })

  assert.equal(result.complete, false)
  assert.equal(result.seats[0].status, 'timed_out')
  const pid = Number(readFileSync(pidPath, 'utf8'))
  assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
})

test('seat output is bounded and an over-limit child is terminated', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-output-')), 'pid')
  const codexPath = fakeCodex(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(pidPath)}, String(process.pid))
    process.stdout.write('x'.repeat(8_192))
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 5_000, maxOutputBytes: 128 })

  assert.equal(result.seats[0].status, 'output_limit')
  assert.equal(result.seats[0].truncated, true)
  assert.ok(Buffer.byteLength(result.seats[0].stdout) <= 128)
  const pid = Number(readFileSync(pidPath, 'utf8'))
  assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
})

test('cancellation stops active children and accounts for queued seats without starting them', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-cancel-')), 'pids.log')
  const codexPath = fakeCodex(`
    const { appendFileSync } = await import('node:fs')
    const { spawn } = await import('node:child_process')
    const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
    appendFileSync(${JSON.stringify(logPath)}, process.pid + ' ' + grandchild.pid + '\\n')
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)
  const controller = new AbortController()
  const running = runSnipePanel({
    cwd,
    rawArgs: '3 correctness,security,performance',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000, signal: controller.signal })

  for (let attempt = 0; attempt < 100 && !existsSync(logPath); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.equal(existsSync(logPath), true, 'first child started')
  controller.abort()
  const result = await running

  assert.deepEqual(result.seats.map(seat => seat.status), ['cancelled', 'cancelled', 'cancelled'])
  const rows = readFileSync(logPath, 'utf8').trim().split('\n')
  assert.equal(rows.length, 1, 'queued seats never started')
  const pids = rows[0].split(' ').map(Number)
  try {
    for (const pid of pids) assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
  } finally {
    for (const pid of pids) {
      try { process.kill(pid, 'SIGKILL') } catch { /* already reaped */ }
    }
  }
})

test('CLI accepts a request file and returns complete seat accounting as JSON', () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource())
  const requestPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-cli-')), 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, rawArgs: 'correctness', inheritedProfile, supportedProfiles }))

  const output = execFileSync(process.execPath, [
    runnerPath,
    '--request', requestPath,
    '--codex-path', codexPath,
    '--capacity', '1',
    '--timeout-ms', '2000',
  ], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.complete, true)
  assert.equal(result.coordinatorGuidance.source, 'references/post-audit-fixes.md')
  assert.equal(result.coordinatorGuidance.text, readFileSync(new URL('../references/post-audit-fixes.md', import.meta.url), 'utf8'))
  assert.deepEqual(result.seats.map(seat => [seat.seat, seat.lens, seat.status]), [[1, 'correctness', 'completed']])
})
