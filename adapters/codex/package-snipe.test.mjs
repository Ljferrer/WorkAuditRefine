import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSnipePlugin, verifySnipePlugin } from './package-snipe.mjs'

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
    'skills/snipe/assets/shared/skills/_shared/provision.mjs',
    'skills/snipe/assets/shared/skills/snipe/assets/snipe-args.mjs',
    'skills/snipe/assets/shared/skills/war/assets/war-config.mjs',
    'skills/snipe/assets/snipe-request.mjs',
    'skills/snipe/assets/snipe-result.mjs',
    'skills/snipe/assets/snipe-runner.mjs',
    'skills/snipe/references/codex-auditor.md',
  ])
  const manifest = JSON.parse(readFileSync(join(output, '.codex-plugin/plugin.json'), 'utf8'))
  assert.equal(manifest.skills, './skills/')
  assert.equal('hooks' in manifest, false)
  assert.equal(inventory.some(path => path.startsWith('hooks/')), false)
  assert.doesNotThrow(() => verifySnipePlugin(output))

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
