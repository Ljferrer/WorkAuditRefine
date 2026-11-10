// Frozen built-in prototypes — the engine runs in Claude Code's Workflow sandbox shape (part 1)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Claude Code 2.1.322 runs a Workflow script in strict code with the built-in prototypes frozen
// (Set, Map, Array, Object ...). There, an own-property assignment that shadows a frozen prototype
// property (s.add = ...) throws 'Attempted to assign to readonly property.', and every /war phase
// died at engine entry. A freeze cannot be undone in-process, so each test spawns a child node with
// a preload that freezes the prototypes. Error.prototype stays unfrozen: freezing it breaks node.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const FREEZE = 'data:text/javascript,for (const C of [Object, Set, Map, Array, WeakMap, WeakSet, Promise, RegExp, Function]) Object.freeze(C.prototype)'
const childEnv = () => { const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; return env }

test('frozen intrinsics: a strict-mode phase lands with the built-in prototypes frozen', () => {
  const harness = pathToFileURL(join(here, 'workflow-template.test-harness.mjs')).href
  const child = `import { runPhase, src, HANDOFF_ARGS, handoffImpl } from ${JSON.stringify(harness)}
const { out } = await runPhase(HANDOFF_ARGS(), handoffImpl(undefined), {}, "'use strict'\\n" + src)
process.stdout.write(JSON.stringify({ frozen: Object.isFrozen(Set.prototype) && Object.isFrozen(Array.prototype), landDecision: out.landDecision, error: out.workflowError?.message ?? null }))`
  const r = spawnSync(process.execPath, ['--import', FREEZE, '--input-type=module', '-e', child], { encoding: 'utf8', env: childEnv(), timeout: 120000 })
  assert.equal(r.status, 0, `the child run exits 0\n${r.stderr}`)
  const res = JSON.parse(r.stdout.trim().split('\n').pop())
  assert.equal(res.frozen, true, 'presence guard: the child froze the prototypes')
  assert.equal(res.landDecision, 'landed', `the phase lands under frozen prototypes (got ${res.landDecision}: ${JSON.stringify(res.error)})`)
})

test('frozen intrinsics: the keyRegistry row tests pass with the built-in prototypes frozen', () => {
  const names = ['re-mint identity: a reworded title on the same file and line window is a re-mint', 'file-followups: a VERIFY FIRST row unfolds the merged[] rows it carried before the stamp']
  const pattern = '^(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$'
  const r = spawnSync(process.execPath, ['--import', FREEZE, '--test', '--test-reporter=tap', '--test-name-pattern=' + pattern, join(here, 'workflow-template.engine-1.test.mjs')], { encoding: 'utf8', env: childEnv(), timeout: 300000 })
  assert.equal(r.status, 0, `the frozen child test run exits 0\n${r.stdout.slice(-4000)}\n${r.stderr}`)
  assert.match(r.stdout, /^# pass 2$/m, 'presence guard: both named tests ran and passed')
  assert.match(r.stdout, /^# fail 0$/m, 'no test failed under frozen prototypes')
})
