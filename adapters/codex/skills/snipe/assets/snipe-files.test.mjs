import { mkdtempSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { consumeRegularFile } from './snipe-files.mjs'

test('bounded reads reject oversized, special, symlink and changed files', () => {
  const root = mkdtempSync(join(tmpdir(), 'snipe-files-'))
  const file = join(root, 'file')
  writeFileSync(file, 'abc')
  let content = ''
  assert.equal(consumeRegularFile(file, 3, chunk => { content += chunk }), 3)
  assert.equal(content, 'abc')
  assert.throws(() => consumeRegularFile(file, 2, () => {}), /limit/)
  assert.throws(() => consumeRegularFile(root, 3, () => {}), /regular/)
  symlinkSync(file, join(root, 'link'))
  assert.throws(() => consumeRegularFile(join(root, 'link'), 3, () => {}))
  execFileSync('mkfifo', [join(root, 'fifo')])
  assert.throws(() => consumeRegularFile(join(root, 'fifo'), 3, () => {}), /regular/)
  assert.throws(() => consumeRegularFile(file, 3, () => writeFileSync(file, 'changed')), /changed|limit/)
  assert.throws(() => consumeRegularFile(file, 100, () => {}, Date.now() - 1), /deadline/)
})

test('bounded-reader guard removals expose independent unsafe witnesses', async () => {
  const source = readFileSync(new URL('./snipe-files.mjs', import.meta.url), 'utf8')
  const root = mkdtempSync(join(tmpdir(), 'snipe-reader-mutants-'))
  const file = join(root, 'file')
  const link = join(root, 'link')
  const fifo = join(root, 'fifo')
  writeFileSync(file, 'abc')
  symlinkSync(file, link)
  execFileSync('mkfifo', [fifo])
  const cases = [
    [' | constants.O_NOFOLLOW', '', mutant => assert.equal(mutant.consumeRegularFile(link, 3, () => {}), 3)],
    ["if (!before.isFile()) throw new Error('scope input must be a regular file')", '', mutant => assert.equal(mutant.consumeRegularFile(fifo, 3, () => {}), 0)],
    ["if (total > limit) throw new Error('file capture byte limit exceeded')", '', mutant => assert.equal(mutant.consumeRegularFile(file, 2, () => {}), 3)],
    ["if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new Error('scope input changed during capture')", '', mutant => assert.equal(mutant.consumeRegularFile(file, 3, () => writeFileSync(file, 'xyz')), 3)],
    ["if (Date.now() > deadline) throw new Error('file capture deadline exceeded')", '', mutant => assert.equal(mutant.consumeRegularFile(file, 3, () => {}, Date.now() - 1), 3)],
  ]
  for (const [guard, replacement, witness] of cases) {
    writeFileSync(file, 'abc')
    assert.throws(() => witness({ consumeRegularFile }), guard)
    writeFileSync(file, 'abc')
    assert.ok(source.includes(guard), guard)
    const path = join(mkdtempSync(join(root, 'mutant-')), 'reader.mjs')
    writeFileSync(path, source.replaceAll(guard, replacement))
    await witness(await import(pathToFileURL(path)))
  }
  const blocking = join(root, 'blocking.mjs')
  writeFileSync(blocking, source.replace(' | constants.O_NONBLOCK', ''))
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import {consumeRegularFile} from ${JSON.stringify(pathToFileURL(blocking).href)}; consumeRegularFile(${JSON.stringify(fifo)},3,()=>{})`], { timeout: 500, killSignal: 'SIGKILL' })
  assert.equal(result.error?.code, 'ETIMEDOUT')
})
