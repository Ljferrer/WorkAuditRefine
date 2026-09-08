import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
