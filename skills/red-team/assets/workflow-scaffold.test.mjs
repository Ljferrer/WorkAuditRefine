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
