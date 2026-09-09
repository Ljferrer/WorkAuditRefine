import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, realpathSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runRedTeam, provision, snapshotTarget, dispatchCodex, gate } from './red-team-runner.mjs'
const profile={model:'gpt-5.6-sol',effort:'medium'}
function git(repo,...args){return execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}
function fixture(t) {
  const root=realpathSync(mkdtempSync(join(tmpdir(),'red-team-test-'))),repo=join(root,'target')
  execFileSync('git',['init',repo],{stdio:'pipe'});git(repo,'config','user.email','fixture@example.invalid');git(repo,'config','user.name','Fixture')
  const planFile=join(repo,'plan.md');writeFileSync(planFile,'# Fixture plan\n\nVerify the sum is four.\n');writeFileSync(join(repo,'sum.txt'),'4\n')
  git(repo,'add','.');git(repo,'commit','-m','fixture')
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  return {root,repo,request:{repository:repo,planFile,evidenceDir:join(root,'evidence'),profile,retries:0,probes:[{name:'sum',technique:'analyzed',instructions:'Compare sum.txt to four.'}]}}
}
const options={codexPath:process.execPath,discover:async()=>({'gpt-5.6-sol':['medium']})}
function result(ctx,defect=false) {
  const anchor={resolved_path:ctx.scope.planFile,plan_sha256:ctx.scope.planSha256,target_revision:ctx.scope.revision}
  return ctx.confirmation ? {read_anchor:anchor,evidence:'Independently read sum.txt',reproduced:true,note:'The observed mismatch reproduces.'}
    : {probe:ctx.probe.name,technique:ctx.probe.technique,status:defect?'fail':'pass',read_anchor:anchor,evidence:'Read sum.txt and compared the literal 4.',findings:defect?[{severity:'Major',claim:'sum is four',reality:'sum is five',evidence:'sum.txt contains 5',planRef:'Verify the sum'}]:[]}
}

test('known-clean analysis requires actual scoped result and preserves originals',async t=>{
  const f=fixture(t),seen=[]
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{seen.push(ctx);assert.equal(readFileSync(join(ctx.work,'sum.txt'),'utf8'),'4\n');return {result:result(ctx)}}})
  assert.equal(run.final.verdict,'CLEARED');assert.equal(seen.length,1);assert.equal(run.attempts[0].stage,'probe')
  assert.equal(readFileSync(join(f.request.evidenceDir,'original-plan.md'),'utf8'),readFileSync(f.request.planFile,'utf8'))
  for(const file of ['attempt-1-raw.json','initial-gate-input.json','initial-gate-output.json','working-copy.json','final-result.json','target-after.json'])assert.ok(existsSync(join(f.request.evidenceDir,file)))
  assert.ok(!existsSync(seen[0].work));assert.deepEqual(snapshotTarget(f.repo),run.target)
})
test('seeded defect is independently confirmed and BLOCKED; stamps cannot enter from seats',async t=>{
  const f=fixture(t);writeFileSync(join(f.repo,'sum.txt'),'5\n');git(f.repo,'add','.');git(f.repo,'commit','-m','seed')
  const work=[]
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{
    work.push(ctx.work);assert.equal(readFileSync(join(ctx.work,'sum.txt'),'utf8'),'5\n')
    const r=result(ctx,true);if(!ctx.confirmation)r.findings[0].adjudicated=true
    return {result:r}
  }})
  assert.equal(run.final.verdict,'BLOCKED');assert.equal(run.final.blockers.length,1);assert.notEqual(work[0],work[1]);assert.equal(run.attempts.length,2)
  const raw=JSON.parse(readFileSync(join(f.request.evidenceDir,'attempt-1-raw.json')))
  assert.equal(raw.result.findings[0].adjudicated,true);assert.equal(run.final.blockers[0].adjudicated,undefined)
})
for(const bad of ['no-op','off-target','missing-evidence','false-pass','wrong-technique'])test(`${bad} cannot certify coverage`,async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{
    const r=result(ctx)
    if(bad==='no-op')return {exitCode:0}
    if(bad==='off-target')r.read_anchor.plan_sha256='wrong'
    if(bad==='missing-evidence')r.evidence=''
    if(bad==='false-pass')r.findings=[{severity:'Major'}]
    if(bad==='wrong-technique')r.technique='executed'
    return {result:r}
  }})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.deepEqual(run.final.summary.dropped,['sum'])
})
test('dead confirmation stays incomplete with first finding retained',async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>ctx.confirmation?{failure:'timeout'}:{result:result(ctx,true)}})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(run.attempts.length,2)
  assert.equal(JSON.parse(readFileSync(join(f.request.evidenceDir,'attempt-1-raw.json'))).result.findings[0].severity,'Major')
})
test('independent refutation retains both observations and yields notes',async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>({result:ctx.confirmation?{...result(ctx),reproduced:false,note:'Probe compared wrong fixture.'}:result(ctx,true)})})
  assert.equal(run.final.verdict,'CLEARED-WITH-NOTES');assert.match(run.final.minors[0].reality,/independently unconfirmed/)
})
test('initial attempts do not consume optional retries; all selected probes attempted',async t=>{
  const f=fixture(t);f.request.retries=1;f.request.probes.push({...f.request.probes[0],name:'other'})
  const counts={}
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{counts[ctx.probe.name]=(counts[ctx.probe.name]??0)+1;return counts[ctx.probe.name]===1?{failure:'timeout'}:{result:result(ctx)}}})
  assert.deepEqual(counts,{sum:2,other:2});assert.equal(run.final.verdict,'CLEARED');assert.equal(run.attempts[0].transport,'timeout')
})
test('unsupported or missing profile gives explicit incomplete initialization with no fake attempt',async t=>{
  for(const chosen of [undefined,{model:'absent',effort:'medium'}]) {
    const f=fixture(t);f.request.profile=chosen;let calls=0
    const run=await runRedTeam(f.request,{...options,dispatch:async()=>{calls++}})
    assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(calls,0);assert.equal(run.attempts.length,0)
  }
})
test('exact inherited profile works; explicit selection takes precedence',async t=>{
  const f=fixture(t);delete f.request.profile;f.request.inheritedProfile=profile
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>({result:result(ctx)})})
  assert.equal(run.final.verdict,'CLEARED')
})
test('empty selection, reused evidence and metadata output are refused',async t=>{
  const f=fixture(t)
  await assert.rejects(runRedTeam({...f.request,probes:[]},options),/nonempty/)
  await assert.rejects(runRedTeam({...f.request,evidenceDir:join(f.repo,'.git','evidence')},options),/outside/)
  await runRedTeam(f.request,{...options,dispatch:async ctx=>({result:result(ctx)})})
  await assert.rejects(runRedTeam(f.request,options),/already exists/)
})
test('dirty state is preserved, not laundered into a passing snapshot',async t=>{
  const f=fixture(t);writeFileSync(join(f.repo,'sum.txt'),'foreign')
  const run=await runRedTeam(f.request,options)
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(readFileSync(join(f.repo,'sum.txt'),'utf8'),'foreign');assert.equal(run.attempts.length,0)
})
test('linked-worktree proof refs and source edits stay inside independent metadata',async t=>{
  const f=fixture(t),linked=join(f.root,'linked');git(f.repo,'worktree','add','--detach',linked,'HEAD')
  f.request.repository=linked;f.request.planFile=join(linked,'plan.md');f.request.probes[0].technique='executed'
  const before=git(f.repo,'for-each-ref')
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{
    assert.equal(git(ctx.work,'remote'),'');git(ctx.work,'branch','probe-branch');writeFileSync(join(ctx.work,'sum.txt'),'proof change')
    return {result:result(ctx)}
  }})
  assert.equal(run.final.verdict,'CLEARED');assert.equal(git(f.repo,'for-each-ref'),before);assert.equal(readFileSync(join(linked,'sum.txt'),'utf8'),'4\n')
})
test('escaping symlink refuses provisioning without changing target',t=>{
  const f=fixture(t);symlinkSync('/etc',join(f.repo,'escape'));git(f.repo,'add','.');git(f.repo,'commit','-m','link')
  assert.throws(()=>provision(f.repo,git(f.repo,'rev-parse','HEAD')),/escaping symlink/)
})
test('foreign mutation detected and retained without automatic cleanup',async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{git(f.repo,'branch','foreign');return {result:result(ctx)}}})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.ok(git(f.repo,'branch','--list','foreign'));assert.ok(run.gaps.some(g=>g.kind==='target-state-changed'))
})
test('cancel before dispatch records incomplete, zero attempted seats',async t=>{
  const f=fixture(t),controller=new AbortController();controller.abort()
  const run=await runRedTeam(f.request,{...options,signal:controller.signal,dispatch:async()=>{throw Error('should not run')}})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(run.attempts.length,0)
})
test('canonical adjudication distinguishes patched from reproven; gaps outrank stamps',()=>{
  const input={repo:'/repo',fingerprint:{titleLine:'# Plan'},expected:1,rounds:1,roundLimit:3,probeResults:[{probe:'x',status:'fail',technique:'analyzed',read_anchor:{resolved_path:'/repo/plan',plan_title:'# Plan'},findings:[{severity:'Major',claim:'x',adjudicated:true}]}]}
  assert.equal(gate(input).verdict,'ADJUDICATED');input.probeResults.push({probe:'diagnostic',dropped:true});input.expected++;assert.equal(gate(input).verdict,'INCOMPLETE')
})

function executable(f,body) {
  const path=join(f.root,'fake-codex')
  writeFileSync(path,`#!${process.execPath}\n${body}\n`,{mode:0o755})
  return path
}
test('real transport records JSONL, enforces sandbox args and disables inherited capabilities',async t=>{
  const f=fixture(t),codexPath=executable(f,`const args=process.argv.slice(2); console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({args})}}));`)
  for(const technique of ['analyzed','executed']) {
    const raw=await dispatchCodex({prompt:'fixture',work:f.repo,profile,technique,timeoutMs:3000,codexPath})
    assert.equal(raw.failure,undefined);assert.equal(raw.exitCode,0)
    const a=raw.result.args;assert.equal(a[a.indexOf('--sandbox')+1],technique==='analyzed'?'read-only':'workspace-write')
    for(const flag of ['--ignore-user-config','--ignore-rules','--strict-config','approval_policy="never"','mcp_servers={}','shell_environment_policy.inherit="none"','sandbox_workspace_write.network_access=false','sandbox_workspace_write.exclude_slash_tmp=true','sandbox_workspace_write.exclude_tmpdir_env_var=true'])assert.ok(a.includes(flag),flag)
    assert.ok(!a.includes('--dangerously-bypass-approvals-and-sandbox'))
  }
})
test('real successful no-op and malformed JSON transports cannot return a usable result',async t=>{
  for(const body of ['',`console.log('not JSON')`,`process.exit(7)`]) {
    const f=fixture(t),codexPath=executable(f,body)
    const raw=await dispatchCodex({prompt:'fixture',work:f.repo,profile,technique:'analyzed',timeoutMs:3000,codexPath})
    assert.ok(raw.failure);assert.equal(raw.result,undefined)
  }
})
test('real timeout and cancellation settle without widening or retry',async t=>{
  const f=fixture(t),codexPath=executable(f,'setInterval(()=>{},1000)')
  const raw=await dispatchCodex({prompt:'fixture',work:f.repo,profile,technique:'analyzed',timeoutMs:100,codexPath})
  assert.equal(raw.failure,'timeout')
  const controller=new AbortController();setTimeout(()=>controller.abort(),100)
  const cancelled=await dispatchCodex({prompt:'fixture',work:f.repo,profile,technique:'analyzed',timeoutMs:3000,codexPath,signal:controller.signal})
  assert.equal(cancelled.failure,'cancelled')
})
test('uncertain cleanup retains owned root and forbids a retry',async t=>{
  const f=fixture(t);f.request.retries=2
  const run=await runRedTeam(f.request,{...options,dispatch:async()=>({terminationConfirmed:false,cleanupError:{code:'EPERM'},failure:'cleanup uncertain'})})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(run.attempts.length,1)
  assert.ok(existsSync(run.attempts[0].retainedRoot));rmSync(run.attempts[0].retainedRoot,{recursive:true,force:true})
})
test('source gaps stay incomplete even when every probe passes',async t=>{
  const f=fixture(t);f.request.issues=[{url:'https://github.com/owner/repo/issues/1'}]
  const run=await runRedTeam(f.request,{...options,fetch:async()=>({ok:false,status:403}),dispatch:async ctx=>({result:result(ctx)})})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(run.final.summary.onTarget,1);assert.ok(run.gaps.some(g=>g.kind==='source-intake'))
})

test('source and environment gaps cannot be erased by canonical gate repipe',async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>({result:{...result(ctx,true),status:'warn',findings:[{severity:'Minor',envGap:true,claim:'dependencies unavailable',reality:'setup failed',evidence:'install refused',planRef:'check'}]}})})
  const input=JSON.parse(readFileSync(join(f.request.evidenceDir,'working-copy.json')))
  assert.equal(run.final.verdict,'INCOMPLETE');assert.equal(gate(input).verdict,'INCOMPLETE')
})

test('mixed findings get independent confirmations and retain only the reproduced blocker',async t=>{
  const f=fixture(t),candidates=[]
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{
    if(ctx.confirmation){assert.equal(ctx.prior.findings.length,1);candidates.push(ctx.prior.findings[0].candidateId);return {result:{...result(ctx),reproduced:ctx.prior.findings[0].claim==='real'}}}
    const r=result(ctx,true);r.findings=[{...r.findings[0],claim:'real'},{...r.findings[0],claim:'false'}];return {result:r}
  }})
  assert.equal(run.final.verdict,'BLOCKED');assert.deepEqual(run.final.blockers.map(f=>f.claim),['real']);assert.equal(run.final.minors[0].claim,'false');assert.equal(new Set(candidates).size,2)
})
for(const mutation of ['config','other-ref','ignored-content'])test(`target guard detects ${mutation} without cleanup`,async t=>{
  const f=fixture(t);writeFileSync(join(f.repo,'.gitignore'),'ignored\n');git(f.repo,'add','.');git(f.repo,'commit','-m','ignore');writeFileSync(join(f.repo,'ignored'),'old')
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{
    if(mutation==='config')git(f.repo,'remote','add','foreign','https://example.invalid/repo')
    if(mutation==='other-ref')git(f.repo,'update-ref','refs/notes/foreign','HEAD')
    if(mutation==='ignored-content')writeFileSync(join(f.repo,'ignored'),'new')
    return {result:result(ctx)}
  }})
  assert.equal(run.final.verdict,'INCOMPLETE');assert.ok(run.gaps.some(g=>g.kind==='target-state-changed'))
})
test('operative scope consistently names isolated repository for probes and confirmation',async t=>{
  const f=fixture(t)
  const run=await runRedTeam(f.request,{...options,dispatch:async ctx=>{assert.equal(ctx.scope.repository,ctx.work);assert.ok(ctx.scope.planFile.startsWith(ctx.scope.repository+'/'));return {result:result(ctx,true)}}})
  assert.equal(run.final.verdict,'BLOCKED')
})
test('prompt larger than argv capacity reaches real process stdin with exact bytes',async t=>{
  const f=fixture(t),codexPath=executable(f,`let text='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>text+=s);process.stdin.on('end',()=>console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({length:text.length,tail:text.slice(-4),arg:process.argv.at(-1)})}})));`)
  const raw=await dispatchCodex({prompt:'x'.repeat(2*1024*1024)+'TAIL',work:f.repo,profile,technique:'analyzed',timeoutMs:3000,codexPath})
  assert.equal(raw.failure,undefined);assert.equal(raw.result.length,2*1024*1024+4);assert.equal(raw.result.tail,'TAIL');assert.equal(raw.result.arg,'-')
})
