import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, renameSync, writeFileSync, symlinkSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildPlanningPlugin, verifyPlanningPlugin } from './package-planning.mjs'

const repoRoot=fileURLToPath(new URL('../..',import.meta.url))
test('planning package runs the canonical advisory lint after moving away from its source', t => {
  const root=mkdtempSync(join(tmpdir(),'war-planning-package-'))
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  const output=join(root,'work-audit-refine-planning')
  buildPlanningPlugin({repoRoot,output})
  const moved=join(root,'moved');renameSync(output,moved)
  const files=verifyPlanningPlugin(moved)
  assert.ok(files.includes('skills/war-strategy/SKILL.md'))
  for(const relative of ['SKILL.md','references/plan-interview.md','references/strategy-verifier.md','assets/plan-literal-lint.mjs']) {
    assert.equal(readFileSync(join(moved,'shared/skills/war-strategy',relative),'utf8'),readFileSync(join(repoRoot,'skills/war-strategy',relative),'utf8'))
  }
  const plan=join(root,'draft.md');writeFileSync(plan,'# Draft\n\nA release task: bump to v1.2.3.\n')
  const lint=join(moved,'shared/skills/war-strategy/assets/plan-literal-lint.mjs')
  const run=spawnSync(process.execPath,[lint,plan],{cwd:root,encoding:'utf8'})
  assert.equal(run.status,0,run.stderr)
  assert.ok(run.stdout.length>0)
  const source=spawnSync(process.execPath,[join(repoRoot,'skills/war-strategy/assets/plan-literal-lint.mjs'),plan],{encoding:'utf8'})
  assert.equal(run.stdout,source.stdout)
  for(const path of files)assert.equal(readFileSync(join(moved,path),'utf8').includes(repoRoot),false,path)
})

test('package resource links stay resolvable without pulling the development checkout into the archive', t => {
  const root=mkdtempSync(join(tmpdir(),'war-planning-links-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const output=join(root,'work-audit-refine-planning');buildPlanningPlugin({repoRoot,output})
  const files=verifyPlanningPlugin(output)
  assert.deepEqual(files,[
    '.codex-plugin/plugin.json',
    'shared/docs/adr/0025-drift-guard-discipline.md',
    'shared/skills/war-strategy/SKILL.md',
    'shared/skills/war-strategy/assets/plan-literal-lint.mjs',
    'shared/skills/war-strategy/references/host.md',
    'shared/skills/war-strategy/references/plan-interview.md',
    'shared/skills/war-strategy/references/strategy-verifier.md',
    'skills/war-strategy/SKILL.md',
    'skills/war-strategy/agents/openai.yaml',
  ])
  let checked=0
  for(const file of files.filter(p=>p.endsWith('.md'))) {
    // Template/example fences describe user-produced artifacts, not installed resources.
    const prose=readFileSync(join(output,file),'utf8').replace(/```[^\n]*\n[\s\S]*?```/g,'')
    for(const [,href]of prose.matchAll(/\]\(([^)]+)\)/g)) {
      if(href.startsWith('https://') || href.startsWith('#'))continue
      const target=relative(output,resolve(dirname(join(output,file)),href.split('#')[0])).replaceAll('\\','/')
      assert.ok(files.includes(target),`${file} has unresolved link ${href}`);checked++
    }
  }
  assert.ok(checked>=8,'required guidance links must actually be exercised')
  assert.equal(readFileSync(join(output,'shared/skills/war-strategy/references/host.md'),'utf8'),readFileSync(join(repoRoot,'adapters/codex/skills/war-strategy/references/host.md'),'utf8'))
})

test('planning verifier rejects missing components, symlinks and unreviewed manifest capabilities', t => {
  const root=mkdtempSync(join(tmpdir(),'war-planning-reject-'))
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  const output=join(root,'work-audit-refine-planning');buildPlanningPlugin({repoRoot,output})
  const manifestPath=join(output,'.codex-plugin/plugin.json'), original=readFileSync(manifestPath,'utf8')
  for(const change of [m=>m.mcpServers={},m=>m.apps='./app.json',m=>m.skills='./shared/',m=>m.interface.capabilities=['Execute'],m=>m.version='invalid']) {
    const m=JSON.parse(original);change(m);writeFileSync(manifestPath,JSON.stringify(m))
    assert.throws(()=>verifyPlanningPlugin(output),/manifest/)
  }
  writeFileSync(manifestPath,original)
  const target=join(output,'shared/skills/war-strategy/references/plan-interview.md')
  const saved=readFileSync(target)
  rmSync(target);assert.throws(()=>verifyPlanningPlugin(output),/missing/)
  symlinkSync(join(repoRoot,'skills/war-strategy/references/plan-interview.md'),target)
  assert.throws(()=>verifyPlanningPlugin(output),/unsupported/)
  rmSync(target);writeFileSync(target,saved)
  writeFileSync(join(output,'extra.md'),'unexpected')
  assert.throws(()=>verifyPlanningPlugin(output),/unexpected/)
})

test('builder refuses source symlink ancestors before producing any package', t => {
  const root=mkdtempSync(join(tmpdir(),'war-planning-source-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=join(root,'source');mkdirSync(source)
  for(const dir of ['adapters','skills','docs','.claude-plugin'])symlinkSync(join(repoRoot,dir),join(source,dir))
  const output=join(root,'work-audit-refine-planning')
  assert.throws(()=>buildPlanningPlugin({repoRoot:source,output}),/source/)
  assert.equal(existsSync(output),false)
})
