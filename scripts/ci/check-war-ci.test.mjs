import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, lstatSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkWarCI } from './check-war-ci.mjs'

const sourceSha='a'.repeat(40)
const inventory=JSON.parse(readFileSync(new URL('./test-inventory.json',import.meta.url),'utf8'))
function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'war-final-gate-'))
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  for(const platform of ['linux','darwin']) {
    const directory=join(root,`baseline-${platform}`);mkdirSync(directory)
    const snapshot={sourceSha,trackedChanges:[],untrackedInputs:[],indexDigest:'b'.repeat(64),contentDigest:'c'.repeat(64)}
    const report={schemaVersion:1,evidenceLevel:'baseline',sourceSha,ok:true,stability:'unchanged',before:snapshot,after:structuredClone(snapshot),
      environment:{platform,node:'v24.17.0',arch:'arm64',osRelease:'fixture',git:'git version fixture',bash:'GNU bash fixture'},inventory,
      suites:inventory.map((path,index)=>{
        mkdirSync(join(directory,String(index)));writeFileSync(join(directory,String(index),'stdout.log'),'ok - fixture\n');writeFileSync(join(directory,String(index),'stderr.log'),'')
        return {path,exitCode:0,signal:null,failure:null,cleanupError:null,status:'passed',skips:[],counts:{tests:1,pass:1,fail:0,skipped:0,cancelled:0,todo:0}}
      })}
    writeFileSync(join(directory,'report.json'),JSON.stringify(report))
  }
  return {sourceSha,needs:{baseline:{result:'success'}},root}
}

test('mandatory baseline job cannot be failed, skipped, cancelled, missing or malformed', () => {
  for(const needs of [null,{},[],{baseline:null},...['failure','skipped','cancelled','neutral','',true].map(result=>({baseline:{result}}))]) {
    assert.throws(()=>checkWarCI({sourceSha:'a'.repeat(40),needs,root:'/unused'}),/mandatory baseline job/)
  }
})

test('final gate requires the complete platform reports and their diagnostic files', t => {
  const input=fixture(t)
  assert.equal(checkWarCI(input).evidenceLevel,'baseline')
  const reportPath=join(input.root,'baseline-linux/report.json')
  const report=JSON.parse(readFileSync(reportPath,'utf8'));report.suites[0].terminationConfirmed=true
  writeFileSync(reportPath,JSON.stringify(report));assert.equal(checkWarCI(input).ok,true)
  rmSync(join(input.root,'baseline-darwin/report.json'))
  assert.throws(()=>checkWarCI(input),/report/)
})

test('only named approved skips pass, including an entirely opt-in host suite', t => {
  const input=fixture(t), path=join(input.root,'baseline-linux/report.json')
  const report=JSON.parse(readFileSync(path,'utf8'))
  const policy=JSON.parse(readFileSync(new URL('./baseline-skips.json',import.meta.url),'utf8'))
  const suite=report.suites.find(s=>Object.hasOwn(policy,s.path))
  const [name,reason]=Object.entries(policy[suite.path])[0]
  suite.counts={tests:1,pass:0,fail:0,skipped:1,cancelled:0,todo:0};suite.status='allowed-skips'
  suite.skips=[{line:`ok 1 - ${name} # SKIP`,channel:'stdout',reason}]
  writeFileSync(path,JSON.stringify(report));assert.equal(checkWarCI(input).ok,true)
  suite.skips=[{line:'ok 1 - unknown # SKIP',channel:'stdout'}]
  writeFileSync(path,JSON.stringify(report));assert.throws(()=>checkWarCI(input),/unapproved skip/)
})

test('malformed, wrong-revision, dirty, reduced and failed platform evidence is rejected', t => {
  const input=fixture(t), path=join(input.root,'baseline-linux/report.json')
  const original=readFileSync(path,'utf8')
  const cases=[
    ['version',r=>r.schemaVersion=2],['kind',r=>r.evidenceLevel='parity'],['failed report',r=>r.ok=false],
    ['revision',r=>r.sourceSha='d'.repeat(40)],['stability',r=>r.stability='changed'],
    ['snapshot',r=>r.after.contentDigest='d'.repeat(64)],['snapshot revision',r=>r.before.sourceSha=r.after.sourceSha='d'.repeat(40)],
    ...['trackedChanges','untrackedInputs'].map(field=>[field,r=>{r.before[field]=r.after[field]=['changed']}]),
    ...['indexDigest','contentDigest'].map(field=>[field,r=>{r.before[field]=r.after[field]=''}]),
    ['platform',r=>r.environment.platform='darwin'],['node',r=>r.environment.node='v22.0.0'],
    ...['arch','osRelease','git','bash'].map(field=>[field,r=>delete r.environment[field]]),
    ['census',r=>r.inventory=r.inventory.slice(1)],['missing suite',r=>r.suites.pop()],
    ['duplicate suite',r=>r.suites[1]=r.suites[0]],['exit',r=>r.suites[0].exitCode=1],
    ['signal',r=>r.suites[0].signal='SIGTERM'],['failure',r=>r.suites[0].failure='timeout'],
    ['cleanup',r=>r.suites[0].cleanupError={code:'EPERM'}],['termination',r=>r.suites[0].terminationConfirmed=false],
    ...['false',null,0].map(value=>[`malformed termination ${value}`,r=>r.suites[0].terminationConfirmed=value]),
    ...['tests','pass','fail','skipped','cancelled','todo'].map(field=>[field,r=>r.suites[0].counts[field]=-1]),
    ['empty',r=>r.suites[0].counts.tests=r.suites[0].counts.pass=0],['count mismatch',r=>r.suites[0].counts.tests=2],
    ['failed cases',r=>{r.suites[0].counts.tests=2;r.suites[0].counts.fail=1}],
    ['cancelled cases',r=>{r.suites[0].counts.tests=2;r.suites[0].counts.cancelled=1}],
    ['todo cases',r=>{r.suites[0].counts.tests=2;r.suites[0].counts.todo=1}],
    ['unaccounted skip',r=>r.suites[0].skips=[{line:'ok 1 - unknown # SKIP',channel:'stdout'}]],
    ['status',r=>r.suites[0].status='skipped'],
  ]
  for(const [name,mutate] of cases) {
    const report=JSON.parse(original);mutate(report);writeFileSync(path,JSON.stringify(report))
    assert.throws(()=>checkWarCI(input),name)
  }
  for(const text of ['{','null','[]']){writeFileSync(path,text);assert.throws(()=>checkWarCI(input),'malformed JSON/report')}
  writeFileSync(path,original)
  assert.throws(()=>checkWarCI({...input,needs:{baseline:{result:'success'},unexpected:{result:'success'}}}),/job set/)
  assert.throws(()=>checkWarCI({...input,sourceSha:'HEAD'}),/SHA/)
  const log=join(input.root,'baseline-linux/0/stdout.log')
  rmSync(log);assert.throws(()=>checkWarCI(input),/stdout.log/)
  symlinkSync(join(input.root,'baseline-linux/0/stderr.log'),log);assert.throws(()=>checkWarCI(input),/regular artifact/)
})

test('final gate CLI propagates rejection instead of hiding exit status', t => {
  const input=fixture(t), cli=fileURLToPath(new URL('./check-war-ci.mjs',import.meta.url))
  for(const [result,status] of [['success',0],['failure',1],['skipped',1],['cancelled',1]]) {
    const run=spawnSync(process.execPath,[cli,input.sourceSha,input.root],{encoding:'utf8',env:{...process.env,WAR_CI_NEEDS:JSON.stringify({baseline:{result}})}})
    assert.equal(run.status,status,run.stderr)
    if(status===0)assert.equal(JSON.parse(run.stdout).ok,true)
  }
})

function checkClaudeInventory(manifest) {
  assert.deepEqual(Object.keys(manifest).sort(),['name','description','version','author','license','homepage','repository','keywords','skills','agents'].sort(),'unreviewed manifest surface')
  assert.deepEqual(manifest.skills,['war','war-room','red-team','lessons-learned','war-help','war-strategy','war-campaign','survey-corps','war-machine','aftermath','war-review','snipe'].map(name=>`./skills/${name}`))
  assert.deepEqual(manifest.agents,['war-auditor','war-refiner','war-servitor','war-worker'].map(name=>`./agents/${name}.md`))
  assert.equal(Object.hasOwn(manifest,'hooks'),false,'retain default hooks discovery')
}

test('Claude package entry inventory is independently reviewed, not generated from the manifest', () => {
  const root=fileURLToPath(new URL('../../',import.meta.url))
  const manifest=JSON.parse(readFileSync(join(root,'.claude-plugin/plugin.json'),'utf8'))
  checkClaudeInventory(manifest)
  for(const path of [...manifest.skills.map(p=>`${p}/SKILL.md`),...manifest.agents,'hooks/hooks.json'])assert.ok(lstatSync(join(root,path)).isFile(),path)
  for(const change of [m=>m.skills.pop(),m=>m.agents.push('./agents/unreviewed.md'),m=>m.hooks='./different.json',
    ...['commands','mcpServers','lspServers','outputStyles','unknownFutureSurface'].map(key=>m=>m[key]='./unreviewed')]) {
    const altered=structuredClone(manifest);change(altered);assert.throws(()=>checkClaudeInventory(altered))
  }
})

function checkWorkflow(yaml) {
  const workflow=JSON.parse(execFileSync('python3',['-c',"import sys,yaml,json; print(json.dumps(yaml.load(sys.stdin.read(),Loader=yaml.BaseLoader)))"],{input:yaml,encoding:'utf8'}))
  assert.deepEqual(Object.keys(workflow.on).sort(),['merge_group','pull_request','push','workflow_dispatch'])
  for(const [event,options] of Object.entries(workflow.on))if(event!=='push')assert.equal(options,'')
  assert.deepEqual(workflow.on.push,{branches:['master','codex-port']})
  assert.deepEqual(workflow.permissions,{contents:'read'})
  assert.deepEqual(Object.keys(workflow.jobs),['baseline','gate'])
  const {baseline,gate}=workflow.jobs
  assert.equal(baseline.strategy['fail-fast'],'false')
  assert.deepEqual(baseline.strategy.matrix.include,[{platform:'linux',runner:'ubuntu-24.04'},{platform:'darwin',runner:'macos-15'}])
  assert.equal(baseline['runs-on'],'${{ matrix.runner }}')
  assert.equal(gate.name,'WAR CI');assert.equal(gate.if,'always()');assert.deepEqual(gate.needs,['baseline'])
  const collect=baseline.steps.find(s=>s.name==='Complete tracked baseline and package contracts')
  assert.equal(collect.run,'node scripts/ci/collect.mjs --run "$RUNNER_TEMP/war-baseline"')
  const upload=baseline.steps.find(s=>s.uses?.startsWith('actions/upload-artifact@'))
  assert.equal(upload.if,'always()');assert.equal(upload.with.name,'baseline-${{ matrix.platform }}')
  assert.equal(upload.with.path,'${{ runner.temp }}/war-baseline/')
  assert.equal(upload.with['if-no-files-found'],'error')
  const download=gate.steps.find(s=>s.uses?.startsWith('actions/download-artifact@'))
  assert.equal(download.with.pattern,'baseline-*');assert.equal(download.with.path,'${{ runner.temp }}/war-reports')
  assert.notEqual(download.with['merge-multiple'],'true')
  const final=gate.steps.at(-1)
  assert.deepEqual(final.env,{WAR_CI_NEEDS:'${{ toJSON(needs) }}',WAR_CI_SHA:'${{ github.sha }}'})
  assert.equal(final.run,'node scripts/ci/check-war-ci.mjs "$WAR_CI_SHA" "$RUNNER_TEMP/war-reports"')
  for(const job of [baseline,gate])for(const step of job.steps) {
    assert.equal(step['continue-on-error'],undefined)
    if(step.uses)assert.match(step.uses,/^actions\/[a-z-]+@[a-f0-9]{40}$/)
    if(step.uses?.startsWith('actions/checkout@'))assert.equal(step.with['persist-credentials'],'false')
    if(step.uses?.startsWith('actions/setup-node@'))assert.equal(step.with['node-version'],'24')
  }
  assert.equal(baseline.steps[0].with['fetch-depth'],'0')
}

test('inert workflow wiring preserves complete matrix evidence and a fail-closed WAR CI gate', () => {
  const yaml=readFileSync(new URL('./war-ci.yml',import.meta.url),'utf8')
  checkWorkflow(yaml)
  for(const [from,to] of [['if: always()','if: success()'],['fail-fast: false','fail-fast: true'],['name: WAR CI','name: Other'],['needs: [baseline]','needs: []'],['node scripts/ci/check-war-ci.mjs','echo node scripts/ci/check-war-ci.mjs'],['persist-credentials: false','persist-credentials: true'],['pattern: baseline-*','pattern: unrelated-*']]) {
    assert.throws(()=>checkWorkflow(yaml.replaceAll(from,to)),from)
  }
  assert.equal(lstatSync(new URL('../../.github/workflows/war-ci.yml',import.meta.url),{throwIfNoEntry:false}),undefined,'T4 must not activate the workflow')
})

test('removing final-gate guards fails the corresponding behavioral assertions', t => {
  const root=mkdtempSync(join(tmpdir(),'war-gate-mutants-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  for(const file of ['check-war-ci.test.mjs','test-inventory.json','baseline-skips.json'])copyFileSync(new URL(file,import.meta.url),join(root,file))
  const source=readFileSync(new URL('./check-war-ci.mjs',import.meta.url),'utf8')
  for(const [from,to,pattern] of [
    ["needs.baseline?.result==='success'",'true','final gate CLI propagates'],
    ["Object.hasOwn(skipPolicy[suite.path] ?? {},name) && ",'','only named approved skips'],
    ["    assert.equal(report.sourceSha,sourceSha,'report tested revision differs')",'','malformed, wrong-revision'],
    ["    assert.deepEqual(report.suites.map(s=>s.path),inventory,'missing, duplicate or reordered suite results')",'','malformed, wrong-revision'],
    ["      assert.equal(suite.exitCode,0,`${suite.path}: exit failed`)",'','malformed, wrong-revision'],
    ['suite.terminationConfirmed===undefined || suite.terminationConfirmed===true','suite.terminationConfirmed!==false','malformed, wrong-revision'],
  ]) {
    assert.equal(source.split(from).length,2,from);writeFileSync(join(root,'check-war-ci.mjs'),source.replace(from,to))
    const result=spawnSync(process.execPath,['--test','--test-reporter=tap',`--test-name-pattern=${pattern}`,join(root,'check-war-ci.test.mjs')],{encoding:'utf8',timeout:15000,env:{...process.env,NODE_TEST_CONTEXT:undefined}})
    assert.equal(result.status,1,result.stdout+result.stderr);assert.match(result.stdout,/AssertionError/)
  }
})
