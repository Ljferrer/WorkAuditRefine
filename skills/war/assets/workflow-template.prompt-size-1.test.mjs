// Prompt-size census of the fix-prompt classes (part 1 of 1)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
//
// Plan 2026-11-08-model-routing-and-prompt-byte-budgets, Task 2.1 (PIN-8, D8, #2634). Each row renders
// one fix-prompt class from the harness fixtures, records its bytes and its clause list, classifies
// each clause, and holds the class at or below the size pinned after the D7 cut (#2633: the
// FIX_ROUND_DOCTRINE_CLAUSE opener no longer restates rules 9 and 10).
//
// A clause is one head line of the prompt, plus the lines that hang under it (a numbered rule or
// finding, an indented sub-line, a `- ` bullet). CLAUSES names every head line a fix prompt may carry;
// a head line no entry matches reds its row, so a new clause must join CLAUSES and the pins together.
// INLINE_CLAUSES names the shared sentences that ride inside another clause's line.
// Each clause is classified from the live renders, never declared by hand:
//   pointer      the clause tells the agent to read a `references/` file (`read … references/<file>.md`)
//   always       the clause rides all eight classes
//   conditional  the clause rides some classes only
// The pins hold the bytes (an upper bound) and the clause list with its classes (exact). A prompt that
// grows past its pin, gains or loses a clause, or changes a clause's class reds its row. Lowering a
// pin is a normal edit; raising one needs a cited reason in the commit body, as for the budget suite.
// Each row also proves its own comparison red: one byte added to FIX_GATE_RULE, rendered through the
// same fixtures, puts every class over its pin.
import { test } from 'node:test'
import {
  assert,
  src,
  runForm,
  runPhase,
  PROVISION_ARGS,
  ACE_ARGS,
  SWEEP_ARGS,
  LATE_FIX_ARGS,
  dwTask,
  fixNeededImpl,
  floorRetryImpl,
  pkgFloorRetryImpl,
  aceBase,
  bisectSubsetImpl,
  reentryImpl,
  sweepBase,
  queuedAbsorb,
  terminalImpl,
  lateFixImpl,
} from './workflow-template.test-harness.mjs'

// runForm is imported for the staged-form census (stage-workflow.test.mjs `indent-strip: harness runs
// the staged form`). This file has no compile site of its own: runPhase compiles through the harness
// build(), which wraps runForm, so WAR_TEMPLATE_STRIPPED=1 renders the staged bytes here too.
assert.equal(typeof runForm, 'function', 'the harness exports runForm')

// Each class: the fixture runs that dispatch it, and the label family of its prompts.
const CLASSES = [
  { cls: 'FIX_NEEDED', label: /^fix:/,
    runs: s => [() => runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), fixNeededImpl(), {}, s)] },
  { cls: 'floor retries', label: /^(add-test|make-pass|cite-budget|package-it):/,
    runs: s => [() => runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), floorRetryImpl(), {}, s),
      () => runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), pkgFloorRetryImpl(), {}, s)] },
  { cls: 'ace subset', label: /^ace:subset:/,
    runs: s => [() => runPhase(ACE_ARGS({ tasks: [dwTask()] }), bisectSubsetImpl(), {}, s)] },
  { cls: 'ace re-entry', label: /^ace:reentry:/,
    runs: s => [() => runPhase(ACE_ARGS({ tasks: [dwTask()] }), reentryImpl(), {}, s)] },
  { cls: 'advisory polish', label: /^ace:polish:/,
    runs: s => [() => runPhase(ACE_ARGS({ tasks: [dwTask()] }), aceBase(), {}, s)] },
  { cls: 'phase-close sweep', label: /^polish:/,
    runs: s => [() => runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]), {}, s)] },
  { cls: 'terminal pass', label: /^terminal:/,
    runs: s => [() => runPhase(SWEEP_ARGS(), terminalImpl(), {}, s)] },
  { cls: 'late-fix', label: /^late-fix:/,
    runs: s => [() => runPhase(LATE_FIX_ARGS(), lateFixImpl(), {}, s)] },
]

// Head-line clauses, in no particular order. A line that matches none of these, and is not a hung line, reds.
const CLAUSES = [
  ['authority line', /^Your authority is the \/war launch/],
  ['class header', /^(FIX_NEEDED|ADD_TEST|MAKE_DONE_PASS|CITE_BUDGET|PACKAGE_IT|ADVISORY POLISH \(--ace\)|ACE BISECTION SUBSET|ACE RE-ENTRY BATCH|PHASE-CLOSE COHERENCE SWEEP|TERMINAL PASS|LATE-FIX PASS) for WAR (task|phase) /],
  ['gate line', /^Gate: /],
  ['fix gate rule line', /^Before you commit, run only the tests you touched/],
  ['blocking findings', /^Resolve ALL of these blocking findings/],
  ['merge-slot rebase', /^A merge-slot rebase may have moved/],
  ['floor instruction', /^(Add a mapped test for this task|Make this command pass|Resolve it for the slice described in)/],
  ['already approved', /^This task is ALREADY APPROVED\./],
  ['ace commit rule', /^(Make ONE commit only|Apply the smallest mechanical fix for EACH finding)/],
  ['preflight', /^PREFLIGHT \(resume idempotency\)/],
  ['dead attempt', /^Dead attempt: /],
  ['sweep instruction', /^Fix ONLY the queued findings below/],
  ['queued findings', /^Queued findings \(verbatim\):/],
  ['merged slices', /^Merged tasks' plan slices/],
  ['late-fix instruction', /^Fix the defect below and make ONE commit/],
  ['late-fix slice', /^Task \S+'s plan slice: /],
  ['late-fix already fixed', /^If the integrated tip already fixes the defect/],
  ['fix-round doctrine', /^FIX-ROUND DOCTRINE: /],
  ['fix-round scope', /^FIX-ROUND SCOPE: /],
  ['fix-round fence', /^FIX-ROUND FENCE: /],
  ['fix-round files', /^FIX-ROUND FILES: /],
  ['backward-chain fix', /^BACKWARD-CHAIN FIX \(/],
  ['depth pointer', /^Depth: /],
  ['examples pointer', /^Examples: /],
  ['commit body layout', /^Commit body: /],
  ['ace diff files', /^Also return `ace_diff_files`/],
  ['task provenance', /^TASK PROVENANCE: /],
  ['memory query', /^MEMORY QUERY: /],
  ['commit message source', /^Never read a commit message from a scratchpad/],
  ['write tools', /^Change file content only with Edit or Write/],
]
const HUNG = /^(\d+\. |\s|- )/
const constOf = name => {
  const m = src.match(new RegExp(`^const ${name} = '([^']+)'$`, 'm'))
  assert.ok(m, `${name} resolves in the template source`)
  return m[1]
}
const FIX_GATE_RULE = constOf('FIX_GATE_RULE')
const INLINE_CLAUSES = [['FIX_GATE_RULE', FIX_GATE_RULE], ['TRAILER_BLOCK_RULE', constOf('TRAILER_BLOCK_RULE')]]
const POINTER = /\bread\b[^\n]*\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/[\w/-]*references\/[\w.-]+\.md/

// Split one prompt into its clauses: { name: text }. Throws on a head line no clause names.
const clausesOf = (prompt, label) => {
  const out = {}
  let cur = null
  for (const line of prompt.split('\n')) {
    if (line === '') continue
    if (HUNG.test(line) && cur) { out[cur] += '\n' + line; continue }
    const hit = CLAUSES.filter(([, re]) => re.test(line))
    assert.equal(hit.length, 1, `${label}: the head line "${line.slice(0, 80)}" matches exactly one CLAUSES entry (found ${hit.length})`)
    cur = hit[0][0]
    out[cur] = out[cur] === undefined ? line : out[cur] + '\n' + line
  }
  for (const [name, text] of INLINE_CLAUSES) if (prompt.includes(text)) out[name] = text
  return out
}

const render = async (source) => {
  const byClass = {}
  for (const c of CLASSES) {
    const runs = []
    for (const run of c.runs(source)) runs.push(await run())   // serial: the fixtures share harness state
    const prompts = runs.flatMap(r => r.calls).filter(x => c.label.test(x.opts.label || ''))
    byClass[c.cls] = prompts.map(x => ({ label: x.opts.label, prompt: x.prompt, bytes: Buffer.byteLength(x.prompt, 'utf8') }))
  }
  return byClass
}

const live = await render(src)
const grownSrc = src.replace(`const FIX_GATE_RULE = '${FIX_GATE_RULE}'`, `const FIX_GATE_RULE = '${FIX_GATE_RULE}+'`)
const grown = await render(grownSrc)

// Clause text per class (union over the class's prompts), and each clause's class from the live renders.
const clauseText = {}
for (const c of CLASSES) {
  clauseText[c.cls] = {}
  for (const p of live[c.cls]) Object.assign(clauseText[c.cls], clausesOf(p.prompt, p.label))
}
const kindOf = name => {
  const texts = CLASSES.map(c => clauseText[c.cls][name]).filter(t => t !== undefined)
  if (texts.some(t => POINTER.test(t))) return 'pointer'
  return texts.length === CLASSES.length ? 'always' : 'conditional'
}

// The pins, measured after the D7 cut (plan 2026-11-08 Task 2.1). bytes: the largest prompt of the
// class; clauses: every clause the class carries, with its class.
const ALWAYS = ['FIX_GATE_RULE', 'TRAILER_BLOCK_RULE', 'authority line', 'class header', 'commit message source', 'memory query', 'write tools']
const POINTERS = ['depth pointer', 'examples pointer']
const pinOf = (bytes, conditional, pointers = POINTERS) => ({
  bytes,
  clauses: Object.fromEntries([...ALWAYS.map(n => [n, 'always']), ...pointers.map(n => [n, 'pointer']), ...conditional.map(n => [n, 'conditional'])].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
})
const CHAIN = ['backward-chain fix', 'commit body layout']
const PINS = {
  'FIX_NEEDED': pinOf(5741, [...CHAIN, 'blocking findings', 'fix gate rule line', 'fix-round doctrine', 'gate line', 'task provenance']),
  'floor retries': pinOf(4317, [...CHAIN, 'floor instruction', 'gate line', 'merge-slot rebase']),
  'ace subset': pinOf(7391, [...CHAIN, 'ace commit rule', 'ace diff files', 'dead attempt', 'fix-round doctrine', 'gate line', 'preflight']),
  'ace re-entry': pinOf(7449, [...CHAIN, 'ace commit rule', 'ace diff files', 'dead attempt', 'fix-round doctrine', 'gate line', 'preflight']),
  'advisory polish': pinOf(7856, [...CHAIN, 'ace commit rule', 'ace diff files', 'already approved', 'fix-round doctrine', 'fix-round fence', 'fix-round files', 'fix-round scope', 'gate line']),
  'phase-close sweep': pinOf(6728, [...CHAIN, 'ace diff files', 'fix-round doctrine', 'fix-round fence', 'fix-round scope', 'merged slices', 'queued findings', 'sweep instruction']),
  'terminal pass': pinOf(7425, [...CHAIN, 'ace commit rule', 'ace diff files', 'fix-round doctrine', 'fix-round fence', 'fix-round scope', 'gate line']),
  // The late-fix pass carries no backward-chain clause (late-defects Task 3.1), so it has no pointer clause.
  'late-fix': pinOf(4643, ['fix-round doctrine', 'fix-round fence', 'fix-round scope', 'gate line', 'late-fix already fixed', 'late-fix instruction', 'late-fix slice'], []),
}

for (const c of CLASSES) {
  test(`prompt size — ${c.cls}`, () => {
    const prompts = live[c.cls]
    assert.ok(prompts.length > 0, `${c.cls}: the fixtures dispatch at least one prompt of the class (non-vacuity)`)
    const pin = PINS[c.cls]
    const clauses = Object.fromEntries(Object.keys(clauseText[c.cls]).sort().map(n => [n, kindOf(n)]))
    const max = Math.max(...prompts.map(p => p.bytes))
    console.log(`PROMPT-SIZE ${c.cls}: ${max} B (pin ${pin.bytes}) ${prompts.map(p => `${p.label}=${p.bytes}`).join(' ')} clauses: ${Object.entries(clauses).map(([n, k]) => `${n}[${k}]`).join(', ')}`)
    for (const p of prompts) {
      assert.ok(p.bytes <= pin.bytes, `${c.cls}: prompt "${p.label}" is ${p.bytes} B, over its pin of ${pin.bytes} B`)
    }
    assert.deepEqual(clauses, pin.clauses, `${c.cls}: the clause list and each clause's class match the pin`)
    // Mutation-red control: one byte added to FIX_GATE_RULE puts this class over its pin.
    assert.ok(grown[c.cls].length > 0 && grown[c.cls].some(p => p.bytes > pin.bytes),
      `${c.cls}: a one-byte growth of FIX_GATE_RULE puts the class over its pin (the comparison observes growth)`)
  })
}
