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
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const FREEZE = 'data:text/javascript,for (const C of [Object, Set, Map, Array, WeakMap, WeakSet, Promise, RegExp, Function]) Object.freeze(C.prototype)'
const childEnv = () => { const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; return env }

test('frozen intrinsics: a strict-mode phase lands with the built-in prototypes frozen', () => {
  const harness = pathToFileURL(join(here, 'workflow-template.test-harness.mjs')).href
  // STRICT is the Workflow sandbox's mode: the probe throws if the engine body runs sloppy (a sloppy
  // call binds this to globalThis), where the frozen-prototype assignment would fail silently, not throw.
  // reverted is the negative control: the template with keyRegistry's two methods set by plain assignment
  // again, which must die under the freeze. Each anchor is counted, so a reworded fix reds here.
  const child = `import { runPhase, src, HANDOFF_ARGS, handoffImpl } from ${JSON.stringify(harness)}
const STRICT = "'use strict'\\nif (this !== undefined) throw new Error('engine body not strict')\\n"
const anchors = [["own('add', (k, f) => {", "s.add = (k, f) => {"], ["  })\\n  own('delete', k => { s.rows.delete(k); return del(k) })", "  }\\n  s.delete = k => { s.rows.delete(k); return del(k) }"]]
const counts = anchors.map(([from]) => src.split(from).length - 1)
if (counts.join() !== '1,1') { process.stdout.write(JSON.stringify({ counts })); process.exit(0) }
const reverted = anchors.reduce((t, [from, to]) => t.replace(from, to), src)
const { out } = await runPhase(HANDOFF_ARGS(), handoffImpl(undefined), {}, STRICT + src)
const { out: rev } = await runPhase(HANDOFF_ARGS(), handoffImpl(undefined), {}, STRICT + reverted)
process.stdout.write(JSON.stringify({ frozen: Object.isFrozen(Set.prototype) && Object.isFrozen(Array.prototype), landDecision: out.landDecision, error: out.workflowError?.message ?? null, counts, revLand: rev.landDecision, revError: rev.workflowError?.message ?? null }))`
  const r = spawnSync(process.execPath, ['--import', FREEZE, '--input-type=module', '-e', child], { encoding: 'utf8', env: childEnv(), timeout: 120000 })
  assert.equal(r.status, 0, `the child run exits 0\n${r.stderr}`)
  const res = JSON.parse(r.stdout.trim().split('\n').pop())
  assert.deepEqual(res.counts, [1, 1], 'each revert-control anchor occurs exactly once in the template')
  assert.equal(res.frozen, true, 'presence guard: the child froze the prototypes')
  assert.equal(res.landDecision, 'landed', `the phase lands under frozen prototypes (got ${res.landDecision}: ${JSON.stringify(res.error)})`)
  assert.notEqual(res.revLand, 'landed', 'negative control: the plain-assignment keyRegistry does not land under frozen prototypes')
  assert.match(String(res.revError), /read.?only/i, `negative control: it dies on the read-only assignment (got ${JSON.stringify(res.revError)})`)
})

test('frozen intrinsics: the keyRegistry row tests pass with the built-in prototypes frozen', () => {
  const names = ['re-mint identity: a reworded title on the same file and line window is a re-mint', 'file-followups: a VERIFY FIRST row unfolds the merged[] rows it carried before the stamp']
  const pattern = '^(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$'
  const r = spawnSync(process.execPath, ['--import', FREEZE, '--test', '--test-reporter=tap', '--test-name-pattern=' + pattern, join(here, 'workflow-template.engine-1.test.mjs')], { encoding: 'utf8', env: childEnv(), timeout: 300000 })
  assert.equal(r.status, 0, `the frozen child test run exits 0\n${r.stdout.slice(-4000)}\n${r.stderr}`)
  assert.match(r.stdout, /^# pass 2$/m, 'presence guard: both named tests ran and passed')
  assert.match(r.stdout, /^# fail 0$/m, 'no test failed under frozen prototypes')
})

// Static scan for the defect class over both scripts that run in the Workflow sandbox: an assignment to
// a property whose name exists on a frozen built-in prototype. No name is excluded: neither script
// assigns one today (length, size, name and constructor included), so the set stays the full union.
const PROTO_NAMES = new Set([Object, Set, Map, WeakMap, WeakSet, Array, Promise, RegExp, Function].flatMap(C => Object.getOwnPropertyNames(C.prototype)))
const ASSIGN = /(?:\.([A-Za-z_$][\w$]*)|\[\s*['"`]([^'"`\]]+)['"`]\s*\])\s*(?:=(?![=>])|\+=|-=|\*=|\/=|%=|\|\|=|&&=|\?\?=|\|=|&=)/g
const protoAssignments = text => text.split('\n').flatMap((l, i) => /^\s*\/\//.test(l) ? [] : [...l.matchAll(ASSIGN)].map(m => m[1] ?? m[2]).filter(n => PROTO_NAMES.has(n)).map(n => `${i + 1}: .${n} = in ${l.trim().slice(0, 120)}`))

test('frozen intrinsics: no sandbox script assigns a property named on a frozen built-in prototype', () => {
  for (const rel of ['workflow-template.js', '../../red-team/assets/workflow-scaffold.js']) {
    const text = readFileSync(join(here, rel), 'utf8')
    assert.ok(text.length > 1000, `presence guard: ${rel} was read`)
    assert.deepEqual(protoAssignments(text), [], `${rel} assigns a property a frozen prototype owns; define it with Object.defineProperty`)
  }
  // mutation control: a planted plain assignment is reported, and a comparison is not
  assert.deepEqual(protoAssignments('const s = new Set()\ns.add = x\nif (s.size === 0) s.delete == y\n'), ['2: .add = in s.add = x'], 'the scan reports a planted s.add = x and nothing else')
})
