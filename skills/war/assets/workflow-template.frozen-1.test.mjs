// Frozen built-in prototypes — the engine runs in Claude Code's Workflow sandbox shape (part 1)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Claude Code 2.1.322 runs a Workflow script in strict code with the built-in prototypes frozen
// (Set, Map, Array, Object ...). There, an own-property assignment that shadows a frozen prototype
// property (s.add = ...) throws 'Attempted to assign to readonly property.', and every /war phase
// died at engine entry. A freeze cannot be undone in-process, so each test spawns a child node with
// a preload that freezes the prototypes of Object, Set, Map, Array, WeakMap, WeakSet, Promise, RegExp,
// Function, String, Number, Boolean, Date and Symbol, and the Iterator prototype. Error.prototype stays
// unfrozen: freezing it breaks node.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const FREEZE = 'data:text/javascript,for (const p of [Object, Set, Map, Array, WeakMap, WeakSet, Promise, RegExp, Function, String, Number, Boolean, Date, Symbol].map(C => C.prototype).concat(Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())))) Object.freeze(p)'
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
process.stdout.write(JSON.stringify({ frozen: [Object, Set, Map, Array, WeakMap, WeakSet, Promise, RegExp, Function, String, Number, Boolean, Date, Symbol].every(C => Object.isFrozen(C.prototype)) && Object.isFrozen(Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))), landDecision: out.landDecision, error: out.workflowError?.message ?? null, counts, revLand: rev.landDecision, revError: rev.workflowError?.message ?? null }))`
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

// Static scan for the defect class over both scripts that run in the Workflow sandbox: an assignment,
// compound assignment or ++/-- on a property whose name exists on a built-in prototype the sandbox
// freezes (or may freeze). The name list takes every own property name of the Object, Set, Map,
// WeakMap, WeakSet, Array, Promise, RegExp, Function, Error, String, Number, Boolean, Date and Symbol
// prototypes and of the Iterator prototype. The scan reads names only, so Error is listed here even
// though freezing Error.prototype breaks node. No name is excluded: neither script uses one today.
// Blind spots: Object.assign, Reflect.set, computed keys (s[k] = v) and a prefix ++/-- whose operand
// starts on the next line (legal JS, left unscanned to keep ++/-- off line breaks) are not scanned;
// the runtime tests above are the only guard there.
const PROTOS = [Object, Set, Map, WeakMap, WeakSet, Array, Promise, RegExp, Function, Error, String, Number, Boolean, Date, Symbol].map(C => C.prototype)
  .concat(Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())))
const PROTO_NAMES = new Set(PROTOS.flatMap(p => Object.getOwnPropertyNames(p)))
// A legal assignment the scan flags (an own property on a plain object, such as o.size = 1) joins this
// list: { file, text, reason }, where file is the path as scanned and text is the reported text after
// the line number. Empty today.
const PROTO_ASSIGN_EXEMPT = []
// KEY is .name or ['name']; \s* runs across newlines, so an operator on the next line is still seen.
const KEY = String.raw`(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*['"${'`'}]([^'"${'`'}\]]+)['"${'`'}]\s*\])`
const OPS = String.raw`\*\*=|\*=|\/=|%=|\+=|-=|<<=|>>>=|>>=|&&=|&=|\^=|\|\|=|\|=|\?\?=|=(?![=>])`
const SCANS = [
  new RegExp(KEY + String.raw`\s*(?:${OPS})`, 'g'),
  // ++/-- never cross a line break (ASI ends the statement there), and a prefix ++/-- never follows an
  // identifier, ) or ] (that is a postfix one). The prefix operand's last segment is .name or ['name'].
  new RegExp(KEY + String.raw`[ \t]*(?:\+\+|--)`, 'g'),
  new RegExp(String.raw`(?<![\w$)\]][ \t]*)(?:\+\+|--)[ \t]*[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*|\s*\[\s*['"${'`'}][^'"${'`'}\]]+['"${'`'}]\s*\])*?\s*` + KEY + String.raw`(?![\w$]|\s*[.[])`, 'g'),
]
// Whole-line // comments are blanked (their newline kept, so line numbers hold); a // inside code or a
// string is left alone. Each hit reports its line and the matched text, its receiver name in front.
const protoAssignments = (text, file = '', exempt = PROTO_ASSIGN_EXEMPT) => {
  const code = text.split('\n').map(l => /^\s*\/\//.test(l) ? '' : l).join('\n')
  const hits = []
  for (const re of SCANS) for (const m of code.matchAll(re)) {
    if (!PROTO_NAMES.has(m[1] ?? m[2])) continue
    const recv = re === SCANS[2] ? '' : (code.slice(0, m.index).match(/[A-Za-z_$][\w$]*$/) || [''])[0]
    const hit = { line: code.slice(0, m.index).split('\n').length, text: (recv + m[0]).replace(/\s+/g, ' ').trim() }
    if (!exempt.some(e => e.file === file && e.text === hit.text)) hits.push(hit)
  }
  return hits.sort((a, b) => a.line - b.line).map(h => `${h.line}: ${h.text}`)
}

test('frozen intrinsics: no sandbox script assigns a property named on a frozen built-in prototype', () => {
  assert.ok(PROTO_NAMES.has('add') && PROTO_NAMES.has('toFixed') && PROTO_NAMES.has('message') && PROTO_NAMES.has('drop'), 'presence guard: the name list holds Set, Number, Error and Iterator prototype names')
  for (const e of PROTO_ASSIGN_EXEMPT) assert.ok(e.file && e.text && e.reason, `exemption ${JSON.stringify(e)} names its file, text and reason`)
  for (const rel of ['workflow-template.js', '../../red-team/assets/workflow-scaffold.js']) {
    const text = readFileSync(join(here, rel), 'utf8')
    assert.ok(text.length > 1000, `presence guard: ${rel} was read`)
    assert.deepEqual(protoAssignments(text, rel), [], `${rel} assigns a property a frozen built-in prototype owns: define it with Object.defineProperty, or, if the assignment is legal (a plain object), add a PROTO_ASSIGN_EXEMPT entry with its reason`)
  }
  // mutation controls: each row names its source and the exact report
  const rows = [
    ['const s = new Set()\ns.add = x\nif (s.size === 0) s.delete == y\n', ['2: s.add ='], 'plain assignment; a comparison is not a hit'],
    ["s['add'] = x", ["1: s['add'] ="], 'bracket key'],
    ['s[`add`] = x', ['1: s[`add`] ='], 'backtick bracket key'],
    ...['+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??='].map(op => [`s.size ${op} 2`, [`1: s.size ${op}`], `compound ${op}`]),
    ['s.size++', ['1: s.size++'], 'postfix ++'],
    ['s.size--', ['1: s.size--'], 'postfix --'],
    ['++s.size', ['1: ++s.size'], 'prefix ++'],
    ['--a.b.size', ['1: --a.b.size'], 'prefix -- on the last segment'],
    ["++s['size']", ["1: ++s['size']"], 'prefix ++ on a bracket key'],
    ["--a['b'].size", ["1: --a['b'].size"], 'prefix -- through a bracket segment'],
    ['i++\ns.size > 0', [], 'a postfix ++ ends at the line break, so the next line is no prefix operand'],
    ['s.size\n++x', [], 'a ++ on the next line is no postfix on s.size'],
    ['a.b++ s.size', [], 'a ++ right after an identifier is a postfix, never a prefix (synthetic text)'],
    ['x\n++\ns.size', [], 'a prefix ++ does not reach an operand on the next line (the named blind spot)'],
    ['s.add\n  = f', ['1: s.add ='], 'the operator on the next line'],
    ['  // s.add = x', [], 'a whole-line comment is skipped'],
    ["const u = 'http://h'; s.add = x", ['1: s.add ='], 'a // inside a string is not a comment'],
    ['s.size >= 2 && s.size <= 3 && s.size !== 1 && s.size == 0', [], 'comparisons are not hits'],
  ]
  for (const [text, want, why] of rows) assert.deepEqual(protoAssignments(text, 'ctl.js'), want, `control (${why}): ${JSON.stringify(text)}`)
  const ex = [{ file: 'ctl.js', text: 'o.size =', reason: 'control: o is a plain object' }]
  assert.deepEqual(protoAssignments('o.size = 1\np.size = 2', 'ctl.js', ex), ['2: p.size ='], 'an exempt hit is skipped and a non-exempt one still reports')
  assert.deepEqual(protoAssignments('o.size = 1', 'other.js', ex), ['1: o.size ='], 'an exemption binds only its own file')
})
