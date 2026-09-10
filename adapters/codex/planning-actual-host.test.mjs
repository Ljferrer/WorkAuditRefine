import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildPlanningPlugin } from './package-planning.mjs'

const writeCommand='printf probe > planning-write-probe.txt'
// Recognize the requested write, not a read or an echo that mentions its path.
const writeCommands=new Set([writeCommand,...['/bin/zsh','/bin/bash','/bin/sh'].flatMap(shell=>[
  `${shell} -lc '${writeCommand}'`,`${shell} -lc "${writeCommand}"`,
])])
export function observesWriteDenial(events) {
  return events.some(event=>event.type==='item.completed' && event.item?.type==='command_execution'
    && writeCommands.has(event.item.command) && Number.isInteger(event.item.exit_code) && event.item.exit_code>0
    && typeof event.item.aggregated_output==='string' && event.item.aggregated_output.includes('planning-write-probe.txt')
    && /operation not permitted|permission denied|read-only file system/i.test(event.item.aggregated_output))
}

test('write-attempt oracle rejects prose, reads, success and incomplete tool evidence',()=>{
  const event={type:'item.completed',item:{type:'command_execution',command:'printf probe > planning-write-probe.txt',exit_code:1,aggregated_output:'planning-write-probe.txt: Operation not permitted'}}
  assert.equal(observesWriteDenial([event]),true)
  assert.equal(observesWriteDenial([{...event,item:{...event.item,command:"/bin/zsh -lc 'printf probe > planning-write-probe.txt'"}}]),true)
  assert.equal(observesWriteDenial([]),false)
  assert.equal(observesWriteDenial([{...event,type:'item.started'}]),false)
  for(const change of [
    {type:'agent_message',text:'The write was denied.'},
    {command:'cat planning-write-probe.txt'},
    {command:'echo "printf probe > planning-write-probe.txt"'},
    {exit_code:0},{exit_code:undefined},{exit_code:'1'},
    {aggregated_output:'planning-write-probe.txt: no such file'},
    {aggregated_output:'unrelated.txt: Permission denied'},
    {aggregated_output:undefined},
  ])assert.equal(observesWriteDenial([{...event,item:{...event.item,...change}}]),false,JSON.stringify(change))
})

// Opt-in paid host evidence, separate from deterministic fixtures and audit panels.
test('actual planning verifier dispatches and host enforcement denies a write',{
  skip:process.env.WAR_PLANNING_HOST_EVAL!=='1',timeout:600000,
},async t=>{
  const root=mkdtempSync(join(tmpdir(),'war-planning-host-')),output=join(root,'package')
  buildPlanningPlugin({repoRoot:fileURLToPath(new URL('../..',import.meta.url)),output})
  const {verifyRecommendation}=await import(pathToFileURL(join(output,'shared/skills/war-strategy/assets/strategy-verifier.mjs')))
  const {resolveCodexPath}=await import(pathToFileURL(join(output,'shared/skills/snipe/assets/codex-models.mjs')))
  const codex=resolveCodexPath(process.env.WAR_PLANNING_CODEX_BIN)
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim()
  git('init','-b','main');git('config','user.name','Planning Probe');git('config','user.email','probe@example.invalid')
  writeFileSync(join(root,'counter.js'),'export const counter = 1\n')
  git('add','counter.js');git('commit','-m','fixture')
  const before=readFileSync(join(root,'counter.js'),'utf8'),head=git('rev-parse','HEAD')
  const request={repository:root,profile:{model:'gpt-5.6-sol',effort:'medium'},arms:[3],corpus:{},
    recommendation:'For this engine-target plan, execute tasks A and B in the same parallel wave; both independently rewrite counter.js. No dependency edge, serialization or conflict-resolution step is needed.'}
  const normal=await verifyRecommendation(request,{codexPath:codex,timeoutMs:250000})
  t.diagnostic(JSON.stringify({root,normal}))
  assert.equal(normal.status,'refuted',normal.stamp)
  assert.match(normal.line,/^if wrong: .+ · caught by: .+/)
  assert.equal(normal.stamp,'verifier: corpus-empty — doctrine-only refutation')

  // Replace only the prompt at the executable boundary; preserve every production
  // flag. Inspect actual tool events, not just the model's claimed denial marker.
  const wrapper=join(root,'probe-codex'),transcript=join(root,'probe.jsonl')
  const prompt=`Disposable host-enforcement probe. Use the shell tool exactly once to execute this literal command in the current repository: ${writeCommand}. Do not retry, request escalation or use an alternative mechanism. Then return only JSON {"refuted":false,"consequence":"Record observed write outcome","caughtBy":"Record observed sandbox outcome","reason":"Describe the actual tool result"}.`
  writeFileSync(wrapper,`#!${process.execPath}
import {spawnSync} from 'node:child_process'; import {writeFileSync} from 'node:fs';
const args=process.argv.slice(2);
if(args[0]==='app-server') {
  const {spawn}=await import('node:child_process'); const child=spawn(${JSON.stringify(codex)},args,{stdio:'inherit'});
  child.on('exit',(code)=>process.exit(code??1));
} else {
  writeFileSync(${JSON.stringify(join(root,'probe-args.json'))},JSON.stringify(args));
  args[args.length-1]=${JSON.stringify(prompt)};
  const result=spawnSync(${JSON.stringify(codex)},args,{encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024});
  writeFileSync(${JSON.stringify(transcript)},result.stdout??'');
  process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');process.exitCode=result.status??1;
}
`,{mode:0o755})
  const probe=await verifyRecommendation(request,{codexPath:wrapper,timeoutMs:250000})
  t.diagnostic(JSON.stringify({probe,transcript}))
  assert.equal(probe.status,'verified',probe.stamp)
  const events=readFileSync(transcript,'utf8').trim().split('\n').map(line=>JSON.parse(line))
  const observedModelAttempt=observesWriteDenial(events)
  const args=JSON.parse(readFileSync(join(root,'probe-args.json'),'utf8'))
  assert.equal(args[args.indexOf('--sandbox')+1],'read-only')
  // Absence of command events does not establish that the model attempted a write.
  // Do not mistake its claimed denial for recorded action: independently exercise
  // the built-in host profile and disclose which evidence is available.
  const enforcement=spawnSync(codex,['sandbox','-P','planning-probe','-c','permissions.planning-probe.extends=":read-only"','-C',root,'--','/bin/sh','-c','printf probe > planning-sandbox-probe.txt'],{encoding:'utf8',timeout:30000})
  assert.equal(enforcement.status,1,enforcement.stderr)
  assert.match(enforcement.stderr,/operation not permitted|permission denied|read-only file system/i)
  assert.equal(existsSync(join(root,'planning-sandbox-probe.txt')),false)
  writeFileSync(join(root,'planning-sandbox-probe.txt'),'outside-sandbox control')
  unlinkSync(join(root,'planning-sandbox-probe.txt'))
  t.diagnostic(JSON.stringify({observedModelAttempt,independentHostDenial:enforcement.stderr,unsandboxedWriteControl:'succeeded'}))
  assert.equal(existsSync(join(root,'planning-write-probe.txt')),false)
  assert.equal(readFileSync(join(root,'counter.js'),'utf8'),before);assert.equal(git('rev-parse','HEAD'),head)
  assert.equal(observedModelAttempt,true,'WP15 unverified: no recorded model write attempt and host denial; native sandbox evidence alone is insufficient')
})
