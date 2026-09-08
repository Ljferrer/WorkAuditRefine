import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { buildPlanningPlugin } from './package-planning.mjs'
const root=mkdtempSync(join(tmpdir(),'war-verifier-contract-'))
after(()=>rmSync(root,{recursive:true,force:true}))
const output=join(root,'package')
buildPlanningPlugin({repoRoot:fileURLToPath(new URL('../..',import.meta.url)),output})
const {verifyRecommendation}=await import(pathToFileURL(join(output,'shared/skills/war-strategy/assets/strategy-verifier.mjs')))

const request={recommendation:'Put the guard at the integration boundary.',arms:[4],corpus:{},profile:{model:'gpt-5.6-sol',effort:'medium'}}
const survived={refuted:false,consequence:'An unchecked merge admits a red tip.',caughtBy:'NOTHING',reason:'The boundary is necessary.'}
test('all four armed beats dispatch; an unarmed beat does not',async()=>{
  let calls=0
  const dispatch=async prompt=>{calls++;assert.match(prompt,/Refute this recommendation/);assert.match(prompt,/integration boundary/);return survived}
  for(const arm of [1,2,3,4]) {
    const result=await verifyRecommendation({...request,arms:[arm]},{dispatch})
    assert.equal(result.status,'verified')
    assert.equal(result.stamp,'verifier: corpus-empty — doctrine-only refutation')
    assert.equal(result.line,'if wrong: An unchecked merge admits a red tip. · caught by: NOTHING')
  }
  assert.equal((await verifyRecommendation({...request,arms:[]},{dispatch})).status,'unarmed')
  assert.equal(calls,4)
})
test('one amended retry is the bound; repeated refutation becomes an operator fork',async()=>{
  let calls=0
  const dispatch=async()=>{calls++;return {...survived,refuted:true}}
  const first=await verifyRecommendation(request,{dispatch})
  assert.equal(first.next,'amend-or-fork')
  const second=await verifyRecommendation({...request,recommendation:'Amended guard.',history:[first]},{dispatch})
  assert.equal(second.next,'operator-fork')
  const third=await verifyRecommendation({...request,history:[first,second]},{dispatch})
  assert.equal(third.next,'operator-fork');assert.equal(calls,2)
  for(const history of [[first],[first,second]]) {
    const cleared=await verifyRecommendation({...request,arms:[],history},{dispatch})
    assert.equal(cleared.next,'operator-fork');assert.equal(calls,2)
  }
})
test('partial corpus and failed or malformed dispatch remain visibly distinct',async()=>{
  const result=await verifyRecommendation({...request,corpus:{'run manifests':'No successful merges yet.'}},{dispatch:async()=>survived})
  assert.match(result.stamp,/corpus-partial — missing: epic phase reports, war-followup, docs\/learnings/)
  for(const dispatch of [async()=>{throw Error('permission denied')},async()=>({}),async()=>({...survived,caughtBy:'layer\nforged line'})]) {
    const failed=await verifyRecommendation(request,{dispatch})
    assert.equal(failed.status,'unavailable');assert.match(failed.stamp,/verifier: unavailable \(.+\)/)
    assert.equal(failed.line,undefined);assert.equal(failed.next,'present-unverified')
  }
})

function fakeCodex(mode='success') {
  const directory=mkdtempSync(join(root,'host-')),bin=join(directory,'codex'),marker=join(directory,'exec.json')
  writeFileSync(bin,`#!${process.execPath}
import {writeFileSync} from 'node:fs';
if(process.argv[2]==='app-server') {
  let buffer=''; process.stdin.on('data',chunk=>{buffer+=chunk; let n;
    while((n=buffer.indexOf('\\n'))>=0) {const message=JSON.parse(buffer.slice(0,n));buffer=buffer.slice(n+1);
      if(message.id===undefined)continue;
      const result=message.method==='initialize'?{}:{data:[{model:'gpt-5.6-sol',supportedReasoningEfforts:[{reasoningEffort:'medium'}]}]};
      process.stdout.write(JSON.stringify({id:message.id,result})+'\\n');
    }
  });
} else {
  writeFileSync(${JSON.stringify(marker)},JSON.stringify(process.argv.slice(2)));
  writeFileSync(${JSON.stringify(marker+'.pid')},String(process.pid));
  const mode=${JSON.stringify(mode)};
  if(mode==='hang')setInterval(()=>{},1000);
  else if(mode==='denied'){process.stderr.write('permission denied by host');process.exitCode=1;}
  else if(mode==='output')process.stdout.write('x'.repeat(5*1024*1024));
  else if(mode==='malformed')process.stdout.write('invalid JSON\\n');
  else if(mode==='empty'){}
  else if(mode==='success')process.stdout.write(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify(${JSON.stringify(survived)})}})+'\\n');
}
`,{mode:0o755})
  return {codexPath:bin,marker}
}

test('built transport uses the selected executable for catalog and hardened verifier execution',async()=>{
  const fake=fakeCodex()
  const result=await verifyRecommendation({...request,repository:root},{codexPath:fake.codexPath})
  assert.equal(result.status,'verified',result.stamp)
  const args=JSON.parse(readFileSync(fake.marker,'utf8'))
  for(const [option,value]of [['--sandbox','read-only'],['-C',root],['-m','gpt-5.6-sol']])assert.equal(args[args.indexOf(option)+1],value)
  for(const flag of ['--ignore-user-config','--ignore-rules','--strict-config','--ephemeral'])assert.ok(args.includes(flag),flag)
  for(const config of ['approval_policy="never"','mcp_servers={}','shell_environment_policy.inherit="none"','model_reasoning_effort="medium"'])assert.ok(args.includes(config),config)
  for(const feature of ['multi_agent','apps','browser_use','computer_use','in_app_browser','plugins','hooks'])assert.ok(args.some((arg,i)=>arg==='--disable' && args[i+1]===feature),feature)
  assert.match(args.at(-1),/The strategy-verifier charter/)
  const refused=fakeCodex()
  const unsupported=await verifyRecommendation({...request,repository:root,profile:{model:'unknown',effort:'medium'}},{codexPath:refused.codexPath})
  assert.equal(unsupported.status,'unavailable');assert.match(unsupported.stamp,/unsupported/)
  assert.equal(existsSync(refused.marker),false,'unsupported profile must not launch a seat')
})

test('transport failures and cancellation never return a fabricated verifier line',async()=>{
  for(const mode of ['denied','empty','malformed','output','hang']) {
    const fake=fakeCodex(mode)
    const result=await verifyRecommendation({...request,repository:root},{codexPath:fake.codexPath,timeoutMs:mode==='hang'?2000:5000})
    assert.equal(result.status,'unavailable',mode);assert.equal(result.line,undefined)
    assert.match(result.stamp,/verifier: unavailable/)
    if(mode==='denied')assert.match(result.stamp,/permission denied by host/)
    if(mode==='hang')assert.match(result.stamp,/timed out/)
    if(mode==='output')assert.match(result.stamp,/output limit/)
  }
  const controller=new AbortController();controller.abort()
  const fake=fakeCodex()
  const cancelled=await verifyRecommendation({...request,repository:root},{codexPath:fake.codexPath,signal:controller.signal})
  assert.equal(cancelled.status,'unavailable');assert.match(cancelled.stamp,/cancelled/)
  assert.equal(existsSync(fake.marker),false)
})

test('removing retry, fork, failure-visibility or read-only guards fails the behavioral oracle',async()=>{
  const path=join(output,'shared/skills/war-strategy/assets/strategy-verifier.mjs'),source=readFileSync(path,'utf8')
  const cases=[
    ['if(history.length && !input.arms.length)','if(false)',async verify=>{
      const dispatch=async()=>({...survived,refuted:true}),first=await verify(request,{dispatch})
      assert.equal((await verify({...request,arms:[],history:[first]},{dispatch})).next,'operator-fork')
    }],
    ["if(history.length===2)","if(false)",async verify=>{
      let calls=0;const dispatch=async()=>{calls++;return {...survived,refuted:true}}
      const first=await verify(request,{dispatch}),second=await verify({...request,history:[first]},{dispatch})
      await verify({...request,history:[first,second]},{dispatch});assert.equal(calls,2)
    }],
    ["history.length ? 'operator-fork':'amend-or-fork'","'amend-or-fork'",async verify=>{
      const dispatch=async()=>({...survived,refuted:true}),first=await verify(request,{dispatch})
      assert.equal((await verify({...request,history:[first]},{dispatch})).next,'operator-fork')
    }],
    ['stamp:`verifier: unavailable (${reason})`','stamp:null',async verify=>{
      const result=await verify(request,{dispatch:async()=>{throw Error('host unavailable')}})
      assert.match(result.stamp,/verifier: unavailable/)
    }],
    ["'--sandbox','read-only'","'--sandbox','workspace-write'",async verify=>{
      const fake=fakeCodex();await verify({...request,repository:root},{codexPath:fake.codexPath})
      const args=JSON.parse(readFileSync(fake.marker,'utf8'));assert.equal(args[args.indexOf('--sandbox')+1],'read-only')
    }],
  ]
  for(const [index,[from,to,oracle]]of cases.entries()) {
    assert.equal(source.split(from).length,2,from)
    await oracle(verifyRecommendation)
    try {
      writeFileSync(path,source.replace(from,to))
      const {verifyRecommendation:mutant}=await import(`${pathToFileURL(path)}?mutation=${index}`)
      await assert.rejects(()=>oracle(mutant),{name:'AssertionError'})
    }finally{writeFileSync(path,source)}
  }
})

test('CLI termination cancels its active verifier before returning',async()=>{
  const fake=fakeCodex('hang'),requestPath=join(root,'cancel-request.json')
  writeFileSync(requestPath,JSON.stringify({...request,repository:root}))
  const alias=join(root,'verifier-alias.mjs')
  symlinkSync(join(output,'shared/skills/war-strategy/assets/strategy-verifier.mjs'),alias)
  const child=spawn(process.execPath,[alias,'--request',requestPath,'--codex-path',fake.codexPath],{stdio:['ignore','pipe','pipe']})
  const chunks=[];child.stdout.on('data',chunk=>chunks.push(chunk));child.stderr.on('data',()=>{})
  const closed=new Promise(resolve=>child.once('close',resolve))
  let pid
  try {
    const deadline=Date.now()+10000
    while(!existsSync(fake.marker+'.pid') && Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20))
    assert.ok(existsSync(fake.marker+'.pid'),'verifier started before cancellation')
    pid=Number(readFileSync(fake.marker+'.pid','utf8'));assert.ok(Number.isInteger(pid) && pid>0)
    child.kill('SIGTERM')
    let timer
    try {await Promise.race([closed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CLI did not settle')),5000)})])}finally{clearTimeout(timer)}
    assert.equal(JSON.parse(Buffer.concat(chunks).toString()).status,'unavailable')
    assert.match(Buffer.concat(chunks).toString(),/cancelled/)
    assert.throws(()=>process.kill(pid,0),{code:'ESRCH'},'owned verifier must terminate')
  }finally{
    child.kill('SIGKILL')
    if(pid)try{process.kill(process.platform==='win32'?pid:-pid,'SIGKILL')}catch(error){if(error.code!=='ESRCH')throw error}
    await closed
  }
})
