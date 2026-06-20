import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const scaffoldPath = join(__dirname, 'workflow-scaffold.js')
const src = readFileSync(scaffoldPath, 'utf8')

// Step 2: Compile the scaffold body as an async function with Workflow globals injected.
// The Workflow harness wraps the file body as an async function; the meta export is replaced
// with a const. This mirrors the exact check in the plan.
test('scaffold syntax OK — compiles as async function body with Workflow globals', () => {
  const body = src.replace(/^export const meta/m, 'const meta')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  // Must not throw
  new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', body)
})

// Step 3: All 5 spine lens names present + BESPOKE PROBES injection point + adversarial-confirm stage.
const SPINE_NAMES = [
  'claims-vs-reality',
  'executable-proof',
  'coverage-vs-source',
  'consistency-placeholders',
  'dependency-feasibility',
]

for (const name of SPINE_NAMES) {
  test(`scaffold structure OK — spine lens '${name}' present`, () => {
    assert.ok(src.includes(`name: '${name}'`), `Missing spine lens: ${name}`)
  })
}

test("scaffold structure OK — BESPOKE PROBES injection point present", () => {
  assert.ok(src.includes('BESPOKE PROBES'), 'Missing BESPOKE PROBES injection point')
})

test("scaffold structure OK — adversarial-confirm declared as named constant", () => {
  assert.ok(
    src.includes("ADVERSARIAL_CONFIRM = 'adversarial-confirm'"),
    "Missing named constant: ADVERSARIAL_CONFIRM = 'adversarial-confirm'"
  )
})

test("scaffold structure OK — adversarial-confirm survives comment stripping", () => {
  // Strip line comments (// to end of line) and block comments (/* ... */)
  const stripped = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(
    stripped.includes('adversarial-confirm'),
    "adversarial-confirm not present in non-comment source — must appear in executable code"
  )
})

// --- Behavioral harness: run the scaffold exactly as the Workflow runtime does --------------
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function compileScaffold() {
  const body = src.replace(/^export const meta/m, 'const meta')
  return new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', body)
}

// Faithful pipeline: each item flows through every stage independently; a throwing stage drops
// it to null (mirrors the Workflow tool's documented pipeline() semantics).
async function fakePipeline(items, ...stages) {
  return Promise.all(items.map(async (item, i) => {
    let v = item
    for (const stage of stages) {
      try { v = await stage(v, item, i) } catch { return null }
    }
    return v
  }))
}

// Run the scaffold with a mock `agent`. agentImpl(prompt, opts) returns the probe/confirm result
// (or null to simulate a dead probe). Captures every prompt + opts and every log line.
async function runScaffold(args, agentImpl) {
  const prompts = [], logs = []
  const fn = compileScaffold()
  const agent = async (prompt, opts = {}) => { prompts.push({ prompt, opts }); return agentImpl(prompt, opts) }
  const log = (m) => logs.push(m)
  const out = await fn(agent, () => {}, fakePipeline, log, () => {}, args, {})
  return { out, prompts, logs }
}

const FP = { absPath: '/abs/PLAN.md', titleLine: '# Land-path-agnostic Wrap-up', tokens: ['## A'] }
const anchorOf = (a) => ({ resolved_path: a.planFile, plan_title: a.fingerprint.titleLine })
const baseArgs = (over = {}) =>
  ({ planFile: '/abs/PLAN.md', repo: '/abs/REPO', sourceSpec: '/abs/SPEC.md', fingerprint: FP, probes: [], ...over })
// Default mock: every probe passes, attesting it read the right plan.
const passResult = (a) => (_, opts) =>
  ({ probe: opts.label, kind: 'spine', technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] })

test('scaffold return threads the fingerprint + expected + repo to the gate', async () => {
  const a = baseArgs()
  const { out } = await runScaffold(a, passResult(a))
  assert.deepEqual(out.fingerprint, FP, 'fingerprint is threaded through unchanged')
  assert.equal(out.repo, '/abs/REPO', 'repo is returned for the gate under-repo check')
  assert.equal(out.expected, 5, 'expected = number of probes that ran (5 spine, sourceSpec set)')
  assert.equal(out.plan, '/abs/PLAN.md')
})

test('scaffold aborts when no fingerprint is supplied (Lead pre-flight is mandatory)', async () => {
  await assert.rejects(
    runScaffold(baseArgs({ fingerprint: undefined }), () => ({ status: 'pass', findings: [] })),
    /fingerprint/i,
    'a missing fingerprint must fail loud, not run unanchored probes'
  )
})

test('scaffold structure OK — scopeLock is a declared, invoked constant (survives comment stripping)', () => {
  const stripped = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/scopeLock\s*=/.test(stripped), 'scopeLock must be a declared constant, not only a comment')
  assert.ok(/scopeLock\(/.test(stripped), 'scopeLock must be invoked in executable code')
})

test('every probe prompt is scope-locked to the absolute planFile + repo + fingerprint title', async () => {
  const a = baseArgs({ probes: [
    { name: 'b1', kind: 'bespoke', technique: 'executed', prompt: 'do b1' },
    { name: 'b2', kind: 'bespoke', technique: 'analyzed', prompt: 'do b2' },
  ] })
  const { prompts } = await runScaffold(a, passResult(a))
  const probePrompts = prompts.filter(p => p.opts.phase === 'Probe')
  assert.equal(probePrompts.length, 7, '5 spine (sourceSpec set keeps coverage-vs-source) + 2 bespoke')
  for (const { prompt } of probePrompts) {
    assert.match(prompt, /SCOPE-LOCK/, 'every probe prompt carries the SCOPE-LOCK preamble')
    assert.ok(prompt.includes('/abs/PLAN.md'), 'scope-lock names the absolute planFile')
    assert.ok(prompt.includes('/abs/REPO'), 'scope-lock names the absolute repo')
    assert.ok(prompt.includes('Land-path-agnostic Wrap-up'), 'scope-lock names the expected plan title')
    assert.match(prompt, /IGNORE the session cwd/, 'scope-lock disowns the ambient cwd')
  }
})

test('executed probes are told to work in a COPY of repo; analyzed probes are read-restricted', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  assert.match(byLabel['probe:executable-proof'], /cp -R|worktree add/, 'executed probe copies the repo')
  assert.match(byLabel['probe:executable-proof'], /\bcd\b/, 'executed probe cds into the copy')
  assert.match(byLabel['probe:claims-vs-reality'], /Restrict every Read/, 'analyzed probe is read-restricted to repo')
})
