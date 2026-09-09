import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildRedTeamPlugin, verifyRedTeamPlugin } from './package-red-team.mjs'

const repoRoot=fileURLToPath(new URL('../..',import.meta.url)),name='work-audit-refine-red-team'
const expected=[
  '.codex-plugin/plugin.json','build-info.json','skills/red-team/SKILL.md','skills/red-team/agents/openai.yaml',
  'skills/red-team/assets/codex-models.mjs','skills/red-team/assets/red-team-evidence.mjs','skills/red-team/assets/red-team-gate.mjs',
  'skills/red-team/assets/red-team-runner.mjs','skills/red-team/assets/snipe-git-policy.mjs','skills/red-team/assets/snipe-process.mjs',
  'skills/red-team/references/host.md','skills/red-team/references/plan-repair.md','skills/red-team/references/probing.md',
].sort()
function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'red-team-package-')),source=join(root,'source'),output=join(root,'built',name)
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  const sources=[...expected.filter(path=>path.startsWith('skills/')).map(path=>{
    if(path.endsWith('/red-team-gate.mjs'))return path
    if(/\/(codex-models|snipe-git-policy|snipe-process)\.mjs$/.test(path))return `adapters/codex/${path.replace('red-team/assets','snipe/assets')}`
    return `adapters/codex/${path}`
  }),'adapters/codex/package-red-team.mjs']
  for(const path of sources) {mkdirSync(dirname(join(source,path)),{recursive:true});cpSync(join(repoRoot,path),join(source,path))}
  return {root,source,output,build:()=>buildRedTeamPlugin({repoRoot:source,output})}
}
function edit(path,transform){writeFileSync(path,transform(readFileSync(path,'utf8')))}
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()

test('standalone inventory and deterministic receipt survive relocation and a real fixture run',async t=>{
  const f=fixture(t),first=f.build(),again=buildRedTeamPlugin({repoRoot:f.source,output:join(f.root,'again',name)})
  assert.deepEqual(first.files,expected)
  assert.equal(first.artifactSha256,again.artifactSha256)
  assert.equal(first.source.revision,null);assert.equal(first.source.dirty,null);assert.equal(first.source.status,'unavailable')
  assert.match(first.version,/^0\.1\.0\+codex\.unversioned\.[a-f0-9]{12}$/)
  const relocated=join(f.root,'relocated',name);mkdirSync(dirname(relocated));renameSync(f.output,relocated);rmSync(f.source,{recursive:true})
  const runner=await import(pathToFileURL(join(relocated,'skills/red-team/assets/red-team-runner.mjs')))
  assert.equal(typeof runner.runRedTeam,'function')
  const target=join(f.root,'target');mkdirSync(target);git(target,'init');git(target,'config','user.email','fixture@example.invalid');git(target,'config','user.name','Fixture')
  const planFile=join(target,'plan.md');writeFileSync(planFile,'# Known-clean fixture\nCheck the arithmetic.\n');git(target,'add','.');git(target,'commit','-m','fixture')
  const run=await runner.runRedTeam({repository:target,planFile,evidenceDir:join(f.root,'evidence'),profile:{model:'gpt-5.6-sol',effort:'medium'},
    probes:[{name:'clean',technique:'analyzed',instructions:'Read the fixture plan.'}]},{codexPath:process.execPath,discover:async()=>({'gpt-5.6-sol':['medium']}),dispatch:async ctx=>({result:{
      probe:ctx.probe.name,technique:ctx.probe.technique,status:'pass',findings:[],evidence:'The fixture plan has no contradictory arithmetic statement.',
      read_anchor:{resolved_path:ctx.scope.planFile,plan_sha256:ctx.scope.planSha256,target_revision:ctx.scope.revision},
    }})})
  assert.equal(run.final.verdict,'CLEARED')
  assert.equal(run.attempts.length,1)
  for(const path of Object.keys(run.codeIdentity))assert.ok(path.startsWith('./')||path.startsWith('../references/'),path)
  assert.ok(Object.keys(run.codeIdentity).includes('./red-team-gate.mjs'))
  assert.deepEqual(verifyRedTeamPlugin(relocated),first)
  for(const ref of ['probing','plan-repair','host'])assert.equal(readFileSync(join(relocated,`skills/red-team/references/${ref}.md`),'utf8'),readFileSync(join(repoRoot,`adapters/codex/skills/red-team/references/${ref}.md`),'utf8'))
})

test('source commit and dirty input hashes describe the actual artifact without Claude version coupling',t=>{
  const f=fixture(t);git(f.source,'init');git(f.source,'config','user.email','fixture@example.invalid');git(f.source,'config','user.name','Fixture');git(f.source,'add','.');git(f.source,'commit','-m','source')
  const clean=f.build();assert.equal(clean.source.revision,git(f.source,'rev-parse','HEAD'));assert.equal(clean.source.dirty,false)
  edit(join(f.source,'adapters/codex/skills/red-team/references/probing.md'),text=>`${text}\nFixture addition.\n`)
  const dirty=buildRedTeamPlugin({repoRoot:f.source,output:join(f.root,'dirty',name)})
  assert.equal(dirty.source.revision,clean.source.revision);assert.equal(dirty.source.dirty,true)
  assert.notEqual(dirty.source.sha256,clean.source.sha256);assert.notEqual(dirty.artifactSha256,clean.artifactSha256)
  assert.notEqual(dirty.version,clean.version)
})

test('missing runtime asset fails verification and independent module loading',t=>{
  const f=fixture(t);f.build();rmSync(join(f.output,'skills/red-team/assets/codex-models.mjs'))
  assert.throws(()=>verifyRedTeamPlugin(f.output),/missing required package file/)
  const load=spawnSync(process.execPath,['--input-type=module','--eval',`await import(${JSON.stringify(pathToFileURL(join(f.output,'skills/red-team/assets/red-team-runner.mjs')).href)})`],{encoding:'utf8'})
  assert.notEqual(load.status,0);assert.match(load.stderr,/ERR_MODULE_NOT_FOUND/)
})

for(const path of ['.codex-plugin/plugin.json','skills/red-team/SKILL.md','skills/red-team/agents/openai.yaml'])test(`qualified invocation guard rejects independent mutation in ${path}`,t=>{
  const f=fixture(t);f.build();edit(join(f.output,path),text=>text.replaceAll('$work-audit-refine-red-team:red-team','$work-audit-refine-red-team:wrong'))
  assert.throws(()=>verifyRedTeamPlugin(f.output),/qualified invocation mismatch/)
})

test('import, identity resource, and document reference closure reject missing and escaping targets',t=>{
  for(const mutation of [
    {path:'skills/red-team/assets/red-team-runner.mjs',text:"\nimport './missing.mjs'\n",error:/missing runtime import/},
    {path:'skills/red-team/assets/red-team-runner.mjs',text:"\nconst identity='./missing.md'\n",error:/missing runtime resource/},
    {path:'skills/red-team/assets/red-team-runner.mjs',text:"\nimport '../../../../outside.mjs'\n",error:/escapes package/},
    {path:'skills/red-team/SKILL.md',text:'\n[missing](references/missing.md)\n',error:/missing reference/},
    {path:'skills/red-team/SKILL.md',text:'\n[escape](../../../outside.md)\n',error:/escapes package/},
  ]) {
    const f=fixture(t);f.build();edit(join(f.output,mutation.path),text=>text+mutation.text)
    assert.throws(()=>verifyRedTeamPlugin(f.output),mutation.error)
  }
})

test('source and package symlinks are rejected including an intermediate source directory',t=>{
  for(const sourceLink of [false,true]) {
    const f=fixture(t),path=join(f.source,'adapters/codex/skills/red-team',sourceLink?'references':'SKILL.md'),away=join(f.root,'away')
    renameSync(path,away);symlinkSync(away,path)
    assert.throws(()=>f.build(),/symlinks/);assert.equal(existsSync(f.output),false)
  }
  const f=fixture(t);f.build();const path=join(f.output,'skills/red-team/assets/red-team-gate.mjs');rmSync(path);symlinkSync(join(repoRoot,'skills/red-team/assets/red-team-gate.mjs'),path)
  assert.throws(()=>verifyRedTeamPlugin(f.output),/symlinks/)
})

test('missing source, overwritten outputs, extra files, and digest mutations fail closed',t=>{
  const f=fixture(t),component=join(f.source,'adapters/codex/skills/red-team/assets/red-team-evidence.mjs'),bytes=readFileSync(component)
  rmSync(component);assert.throws(()=>f.build(),/missing source component/);assert.equal(existsSync(f.output),false)
  writeFileSync(component,bytes);f.build();assert.throws(()=>f.build(),/already exists/)
  writeFileSync(join(f.output,'unexpected.txt'),'extra');assert.throws(()=>verifyRedTeamPlugin(f.output),/unexpected or missing/);rmSync(join(f.output,'unexpected.txt'))
  edit(join(f.output,'skills/red-team/references/probing.md'),text=>text+'\nChanged guidance.\n');assert.throws(()=>verifyRedTeamPlugin(f.output),/file hash mismatch/)
})

test('builder CLI rejects option-shaped outputs and executes through filesystem alias',t=>{
  const f=fixture(t),alias=join(f.root,'builder.mjs');symlinkSync(join(repoRoot,'adapters/codex/package-red-team.mjs'),alias)
  const bad=spawnSync(process.execPath,[alias,'--help'],{encoding:'utf8',cwd:f.root});assert.notEqual(bad.status,0);assert.match(bad.stderr,/usage:/);assert.equal(existsSync(join(f.root,'--help')),false)
  const run=spawnSync(process.execPath,[alias,f.output],{encoding:'utf8'});assert.equal(run.status,0,run.stderr)
  assert.equal(JSON.parse(run.stdout).artifactSha256,verifyRedTeamPlugin(f.output).artifactSha256)
})
