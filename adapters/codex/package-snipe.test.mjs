import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, symlinkSync, cpSync, mkdirSync, renameSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSnipePlugin, verifySnipePlugin } from './package-snipe.mjs'
import { buildPlanningPlugin } from './package-planning.mjs'
test('Snipe builder executes through a filesystem alias',t=>{
  const root=mkdtempSync(join(tmpdir(),'snipe-builder-alias-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const alias=join(root,'builder.mjs'),output=join(root,'package')
  symlinkSync(fileURLToPath(new URL('./package-snipe.mjs',import.meta.url)),alias)
  const result=spawnSync(process.execPath,[alias,output],{encoding:'utf8'})
  assert.equal(result.status,0,result.stderr)
  assert.ok(result.stdout.trim(),'builder must not silently skip main')
  assert.ok(verifySnipePlugin(output).includes('skills/snipe/SKILL.md'))
})

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function outputRoot() {
  return join(mkdtempSync(join(tmpdir(), 'codex-snipe-package-')), 'plugin')
}

test('S-A16 builds a standalone Snipe-only plugin with its shared dependency closure', async () => {
  const output = outputRoot()
  const inventory = buildSnipePlugin({ repoRoot, output })

  assert.deepEqual(inventory, [
    '.codex-plugin/plugin.json',
    'skills/snipe/SKILL.md',
    'skills/snipe/agents/openai.yaml',
    'skills/snipe/assets/codex-models.mjs',
    'skills/snipe/assets/shared/skills/_shared/provision.mjs',
    'skills/snipe/assets/shared/skills/snipe/assets/snipe-args.mjs',
    'skills/snipe/assets/shared/skills/war/assets/war-config.mjs',
    'skills/snipe/assets/snipe-files.mjs',
    'skills/snipe/assets/snipe-git-policy.mjs',
    'skills/snipe/assets/snipe-process.mjs',
    'skills/snipe/assets/snipe-request.mjs',
    'skills/snipe/assets/snipe-result.mjs',
    'skills/snipe/assets/snipe-runner.mjs',
    'skills/snipe/assets/snipe-submodules.mjs',
    'skills/snipe/references/auditing-fixes.md',
    'skills/snipe/references/codex-auditor.md',
    'skills/snipe/references/post-audit-fixes.md',
    'skills/snipe/references/submodules.md',
  ])
  const manifest = JSON.parse(readFileSync(join(output, '.codex-plugin/plugin.json'), 'utf8'))
  assert.equal(manifest.skills, './skills/')
  const skill = readFileSync(join(output, 'skills/snipe/SKILL.md'), 'utf8')
  const skillName = skill.match(/^name: (.+)$/m)[1]
  const invocation = `$${manifest.name}:${skillName}`
  const metadata = readFileSync(join(output, 'skills/snipe/agents/openai.yaml'), 'utf8')
  const skillPrompt = JSON.parse(metadata.match(/^\s*default_prompt: (.+)$/m)[1])
  for (const prompt of [manifest.interface.defaultPrompt, skillPrompt]) {
    assert.equal(prompt.match(/\$[\w:-]+/)[0], invocation, 'default prompts must use the host plugin-qualified skill name')
  }
  assert.equal('hooks' in manifest, false)
  assert.equal(inventory.some(path => path.startsWith('hooks/')), false)
  assert.doesNotThrow(() => verifySnipePlugin(output))
  for (const name of ['auditing-fixes.md', 'post-audit-fixes.md']) {
    assert.equal(readFileSync(join(output, 'skills/snipe/references', name), 'utf8'),
      readFileSync(join(repoRoot, 'adapters/codex/skills/snipe/references', name), 'utf8'))
  }

  const runner = await import(`${pathToFileURL(join(output, 'skills/snipe/assets/snipe-runner.mjs'))}?standalone`)
  assert.equal(typeof runner.runSnipePanel, 'function')
  assert.equal(inventory.some(path => readFileSync(join(output, path), 'utf8').includes(repoRoot)), false)
})

test('S-A16 rejects a wrong skill component and fails closed when a shared file is missing', () => {
  const absentSource = mkdtempSync(join(tmpdir(), 'codex-snipe-source-missing-'))
  const absentOutput = join(absentSource, 'output')
  assert.throws(() => buildSnipePlugin({ repoRoot: absentSource, output: absentOutput }), /missing source component/)
  assert.equal(existsSync(absentOutput), false)

  const output = outputRoot()
  buildSnipePlugin({ repoRoot, output })

  const manifestPath = join(output, '.codex-plugin/plugin.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, skills: './wrong/' }, null, 2)}\n`)
  assert.throws(() => verifySnipePlugin(output), /skills must be '\.\/skills\/'/)

  manifest.skills = './skills/'
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  rmSync(join(output, 'skills/snipe/assets/shared/skills/war/assets/war-config.mjs'))
  assert.throws(() => verifySnipePlugin(output), /missing required package file/)
  const load = spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    `await import(${JSON.stringify(pathToFileURL(join(output, 'skills/snipe/assets/snipe-runner.mjs')).href)})`,
  ], { encoding: 'utf8' })
  assert.notEqual(load.status, 0)
  assert.match(load.stderr, /ERR_MODULE_NOT_FOUND/)
})


test('both builders reject symlinked source roots, ancestors, leaves and version input before output', t => {
  const root=mkdtempSync(join(tmpdir(),'war-package-source-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=join(root,'source');mkdirSync(source)
  for(const path of ['adapters/codex','skills','.claude-plugin','docs/adr'])cpSync(join(repoRoot,path),join(source,path),{recursive:true})
  for(const [name,build] of [['snipe',buildSnipePlugin],['planning',buildPlanningPlugin]]) {
    for(const path of ['', 'adapters', 'skills', '.claude-plugin', '.claude-plugin/plugin.json', 'adapters/codex/skills/snipe/assets/snipe-process.mjs']) {
      const target=path ? join(source,path) : source,saved=join(root,'saved')
      renameSync(target,saved);symlinkSync(saved,target)
      const output=join(root,'output')
      try {
        assert.throws(()=>build({repoRoot:source,output}),/source/,`${name}: ${path || 'root'}`)
        assert.equal(existsSync(output),false,'refusal must precede output creation')
      } finally {rmSync(target);renameSync(saved,target);rmSync(output,{recursive:true,force:true})}
    }
  }
})

test('shared source root, ancestor and regular-leaf checks fail disposable mutation oracles', async t => {
  const root=mkdtempSync(join(tmpdir(),'war-source-mutants-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=join(root,'source');mkdirSync(join(source,'real'),{recursive:true});writeFileSync(join(source,'real/file'),'fixture')
  symlinkSync(join(source,'real'),join(source,'alias'));symlinkSync(source,join(root,'root-alias'))
  const original=readFileSync(new URL('./package-source.mjs',import.meta.url),'utf8')
  const {regularSource}=await import('./package-source.mjs')
  for(const [index,from,to,base,path] of [
    [0,"!lstatSync(root,{throwIfNoEntry:false})?.isDirectory()",'false',join(root,'root-alias'),'real/file'],
    [1,'!stat || stat.isSymbolicLink()','!stat',source,'alias/file'],
    [2,'!lstatSync(current).isFile()','false',source,'real'],
  ]) {
    assert.ok(original.includes(from))
    const file=join(root,`${index}.mjs`);writeFileSync(file,original.replace(from,to))
    const mutant=await import(pathToFileURL(file))
    const oracle=read=>assert.throws(()=>read(base,path),/source/)
    oracle(regularSource);assert.throws(()=>oracle(mutant.regularSource),{name:'AssertionError'})
  }
})
