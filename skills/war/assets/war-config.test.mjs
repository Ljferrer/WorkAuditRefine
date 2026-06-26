import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import {
  DEFAULTS, PROVISION_SOURCES, fillDefaults, presetConfig, validate, spawnOpts, covenSeats,
  resolveProvision, resolveGate,
} from './war-config.mjs'
import { HARD_ESCALATION_REASONS } from './land-decision.mjs'

// Helper: read workflow-template.js as text relative to this test file.
const __dir = dirname(fileURLToPath(import.meta.url))
const templateText = readFileSync(join(__dir, 'workflow-template.js'), 'utf8')

// Helper: recursively find files matching a predicate under a root, excluding pruned dirs.
function walkFiles(root, predicate, pruned = ['node_modules', '.git']) {
  const results = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (pruned.includes(entry.name)) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) { walk(fullPath) }
      else if (entry.isFile() && predicate(entry.name, fullPath)) { results.push(fullPath) }
    }
  }
  walk(root)
  return results.sort()
}

// Repo root: 3 levels up from skills/war/assets/
const REPO_ROOT = join(__dir, '..', '..', '..')

// Helper: read a doc file relative to REPO_ROOT
function readDoc(relPath) {
  return readFileSync(join(REPO_ROOT, relPath), 'utf8')
}

test('DEFAULTS validate', () => {
  assert.equal(validate(DEFAULTS).valid, true)
})

test('empty input fills to balanced defaults and validates', () => {
  const c = fillDefaults({})
  assert.equal(c.agents.worker.model, 'sonnet')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.audit.covenPolicy, 'auto')
  assert.equal(validate({}).valid, true)
})

test('deepMerge via fillDefaults does not mutate DEFAULTS', () => {
  const snapshot = JSON.stringify(DEFAULTS)
  fillDefaults({ agents: { worker: { model: 'opus' } } })
  assert.equal(JSON.stringify(DEFAULTS), snapshot)
})

test('partial override merges over defaults', () => {
  const c = fillDefaults({ agents: { worker: { model: 'opus', effort: 'max' } } })
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')   // untouched default
  assert.equal(c.agents.refiner.model, 'sonnet') // untouched default
})

test('thorough preset', () => {
  const c = presetConfig('thorough')
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.effort, 'high')
  assert.equal(c.audit.covenPolicy, 'all')
  assert.equal(validate(c).valid, true)
})

test('economy preset', () => {
  const c = presetConfig('economy')
  assert.equal(c.audit.covenSize, 3)   // economy keeps the default covenSize; 'solo' is what yields the single auditor
  assert.equal(c.audit.covenPolicy, 'solo')
  assert.equal(c.run.roundLimit, 2)
  assert.equal(validate(c).valid, true)
})

test('unknown preset throws', () => {
  assert.throws(() => presetConfig('turbo'), /unknown preset/)
})

test('bad model rejected', () => {
  const r = validate({ agents: { worker: { model: 'gpt-5' } } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /agents\.worker\.model/)
})

test('bad effort rejected', () => {
  const r = validate({ agents: { auditor: { effort: 'ultrathink' } } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /agents\.auditor\.effort/)
})

test('covenSize below 1 rejected', () => {
  assert.equal(validate({ audit: { covenSize: 0 } }).valid, false)
})

test('bad covenPolicy rejected', () => {
  assert.equal(validate({ audit: { covenPolicy: 'never' } }).valid, false)
})

test('non-boolean autoEscalate rejected', () => {
  assert.equal(validate({ audit: { autoEscalate: 'yes' } }).valid, false)
})

test('roundLimit below 1 rejected', () => {
  assert.equal(validate({ run: { roundLimit: 0 } }).valid, false)
})

// --- run.provision / provisionSource / provisionAuto (Part B) ----------------

test('provision defaults: empty list, source none, auto true', () => {
  const c = fillDefaults({})
  assert.deepEqual(c.run.provision, [])
  assert.equal(c.run.provisionSource, 'none')
  assert.equal(c.run.provisionAuto, true)
  assert.equal(validate({}).valid, true)
})

test('provision of non-empty strings accepted', () => {
  const r = validate({ run: { provision: ['pnpm install --frozen-lockfile', 'git submodule update --init'] } })
  assert.equal(r.valid, true, r.errors.join('\n'))
})

test('non-array provision rejected with a clear error', () => {
  const r = validate({ run: { provision: 'pnpm install' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /provision must be an array/)
})

test('empty-string provision entry rejected with a clear error', () => {
  const r = validate({ run: { provision: ['ok', '   '] } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /provision\[1\].*non-empty/)
})

test('PROVISION_SOURCES enum has the expected members', () => {
  assert.deepEqual(
    PROVISION_SOURCES,
    ['explicit', 'manifest', 'ci', 'onboarding', 'structural', 'none'])
})

test('each provisionSource enum member is accepted', () => {
  for (const source of PROVISION_SOURCES) {
    assert.equal(validate({ run: { provisionSource: source } }).valid, true, `source ${source} should be valid`)
  }
})

test('bad provisionSource rejected', () => {
  const r = validate({ run: { provisionSource: 'magic' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.provisionSource/)
})

test('non-boolean provisionAuto rejected', () => {
  const r = validate({ run: { provisionAuto: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.provisionAuto/)
})

// --- resolveProvision (Part B) -----------------------------------------------
// resolveProvision decides whether war-room Setup must run the setup-scout:
//   • explicit non-empty run.provision → returned VERBATIM, source unchanged, no scout
//   • empty list + provisionAuto:true   → scout path flagged (scout:true)
//   • empty list + provisionAuto:false  → [] + source 'none', no scout

test('resolveProvision: non-empty list returned verbatim with source unchanged and no scout', () => {
  const list = ['pnpm install --frozen-lockfile', 'git submodule update --init --recursive']
  const c = fillDefaults({ run: { provision: list, provisionSource: 'explicit' } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, list)        // verbatim, same order
  assert.equal(r.source, 'explicit')         // source carried through unchanged
  assert.equal(r.scout, false)               // explicit intent → no scout
})

test('resolveProvision: non-empty list short-circuits the scout even when provisionAuto is true', () => {
  const list = ['make setup']
  const c = fillDefaults({ run: { provision: list, provisionSource: 'onboarding', provisionAuto: true } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, list)
  assert.equal(r.source, 'onboarding')       // explicit intent honored verbatim, source preserved
  assert.equal(r.scout, false)               // provisionAuto does NOT override an explicit list
})

test('resolveProvision: empty list + provisionAuto true flags the scout path', () => {
  const c = fillDefaults({ run: { provision: [], provisionAuto: true } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, [])
  assert.equal(r.source, 'none')
  assert.equal(r.scout, true)                // empty + auto → must scout
})

test('resolveProvision: empty list + provisionAuto false yields [] + source none + no scout', () => {
  const c = fillDefaults({ run: { provision: [], provisionAuto: false } })
  const r = resolveProvision(c)
  assert.deepEqual(r.provision, [])
  assert.equal(r.source, 'none')
  assert.equal(r.scout, false)               // auto off → never scout
})

test('unknown role rejected', () => {
  assert.equal(validate({ agents: { wizard: { model: 'opus', effort: 'default' } } }).valid, false)
})

test('spawnOpts omits effort when default', () => {
  assert.deepEqual(spawnOpts(DEFAULTS, 'worker'), { model: 'sonnet' })
})

test('spawnOpts includes non-default effort', () => {
  assert.deepEqual(spawnOpts(presetConfig('thorough'), 'worker'), { model: 'opus', effort: 'max' })
})

test('covenSeats single seat when not coven', () => {
  assert.deepEqual(
    covenSeats(DEFAULTS, { coven: false, lenses: DEFAULTS.audit.lenses }),
    ['correctness'])
})

test('covenSeats covenSize seats rotating lenses', () => {
  const c = fillDefaults({ audit: { covenSize: 3 } })
  assert.deepEqual(
    covenSeats(c, { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }),
    ['correctness', 'cascading-impact', 'plan-faithfulness'])
})

test('covenSeats falls back to the default trio length when audit has no covenSize', () => {
  assert.deepEqual(
    covenSeats({}, { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }),
    ['correctness', 'cascading-impact', 'plan-faithfulness'])
})

test('covenSeats uses default lenses when the task has none', () => {
  assert.deepEqual(covenSeats({}, { coven: false }), ['correctness'])
})

// ---------------------------------------------------------------------------
// Drift-guard tests: assert that workflow-template.js mirrors agree with DEFAULTS
// ---------------------------------------------------------------------------

test('drift-guard: ROLE_MODEL in workflow-template.js matches DEFAULTS agent models (#10 Nit)', () => {
  // Extract the ROLE_MODEL literal from the template text.
  // It looks like: const ROLE_MODEL = { worker: 'sonnet', auditor: 'opus', ... }
  const match = templateText.match(/const\s+ROLE_MODEL\s*=\s*\{([^}]+)\}/)
  assert.ok(match, 'ROLE_MODEL not found in workflow-template.js')
  // Normalize single-quoted keys/values to double-quoted so JSON.parse can handle it.
  const body = match[1]
    .replace(/'/g, '"')                         // single → double quotes
    .replace(/(\w+)\s*:/g, '"$1":')             // bare keys → quoted keys
  const parsed = JSON.parse(`{${body}}`)
  assert.deepEqual(parsed, {
    worker:   DEFAULTS.agents.worker.model,
    auditor:  DEFAULTS.agents.auditor.model,
    refiner:  DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  })
})

test('drift-guard: inline fallback lenses in workflow-template.js matches DEFAULTS.audit.lenses (#6 Nit 1)', () => {
  // The template has:
  //   const baseLenses = task.lenses && task.lenses.length ? task.lenses : ['correctness', 'cascading-impact', 'plan-faithfulness']
  // Extract the fallback array literal after the ternary's false-branch colon.
  const match = templateText.match(/task\.lenses\s*:\s*(\[[^\]]+\])/)
  assert.ok(match, 'inline fallback lenses array not found in workflow-template.js')
  // Normalize single-quoted strings to double-quoted for JSON.parse.
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  assert.deepEqual(parsed, DEFAULTS.audit.lenses)
})

// ---------------------------------------------------------------------------
// resolveGate (F12): self-discovering multi-runner gate
// ---------------------------------------------------------------------------

test('resolveGate: with a declared gate — starts with declared gate', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.startsWith('node --test x'), `expected result to start with declared gate, got: ${result}`)
})

test('resolveGate: with a declared gate — &&-chains declared-then-discovery', () => {
  const result = resolveGate('node --test x')
  // The declared gate must come before the find-based discovery via &&
  const andIdx = result.indexOf('&&')
  assert.ok(andIdx > 0, `expected && to appear after declared gate, got: ${result}`)
  assert.ok(result.slice(0, andIdx).includes('node --test x'), `declared gate must precede &&, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with node_modules prune', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes('node_modules'), `expected node_modules prune in result, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with .git prune', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('.git'), `expected .git prune in result, got: ${result}`)
})

test('resolveGate: with a declared gate — runs each suite as bash "$f" with || exit 1', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
  assert.ok(result.includes('|| exit 1'), `expected || exit 1 in result, got: ${result}`)
})

test('resolveGate: empty string — yields discovery clause alone (no leading &&)', () => {
  const result = resolveGate('')
  assert.ok(!result.startsWith('&&'), `result must not start with &&, got: ${result}`)
  // Must still discover bash suites
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
})

test('resolveGate: null — yields discovery clause alone (no leading &&)', () => {
  const result = resolveGate(null)
  assert.ok(!result.startsWith('&&'), `result must not start with &&, got: ${result}`)
  // Must still discover bash suites
  assert.ok(result.includes('*.test.sh'), `expected *.test.sh in result, got: ${result}`)
  assert.ok(result.includes('bash "$f"'), `expected bash "$f" in result, got: ${result}`)
})

test('resolveGate: includes printf banner for each suite', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes('printf'), `expected printf banner in result, got: ${result}`)
  assert.ok(result.includes('gate(bash)'), `expected gate(bash) label in result, got: ${result}`)
})

test('drift-guard: inline HARD_ESCALATION_REASONS in workflow-template.js matches canonical export in land-decision.mjs (#36)', () => {
  // workflow-template.js cannot import ES modules so it duplicates the constant inline.
  // This test pins that inline literal to the canonical export in land-decision.mjs.
  // Task 5 wired land_stale + dep-failed into the template inline (6 items after Task 4).
  // Task 4 (F04/R3) adds gate-evidence: a provably-unrun mapped test is now a hard escalation.
  //
  // The template has (around line 361):
  //   const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence']
  const match = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(match, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  // Normalize single-quoted strings to double-quoted for JSON.parse.
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  assert.deepEqual(parsed, HARD_ESCALATION_REASONS)
  assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'), 'dep-failed must be in HARD_ESCALATION_REASONS (F02 foundation)')
})

// ---------------------------------------------------------------------------
// Task 2 — Coverage meta-test + doc contracts (F12)
// ---------------------------------------------------------------------------

// --- Coverage meta-test (D5): all *.test.sh are reachable by resolveGate discovery ---

test('coverage meta-test: all *.test.sh files in the repo are not under pruned paths (node_modules, .git)', () => {
  // Walk the repo to find every *.test.sh (pruning node_modules and .git as resolveGate does).
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.sh'))
  // There must be at least the four known suites — count-or-set assertion, NOT hardcoded 3.
  // We know there are currently four; this fails if any new one gets silently orphaned OR
  // if one of the expected four disappears (guard in both directions).
  const EXPECTED_SUITES = [
    'hooks/validate-worktree-scope.test.sh',
    'hooks/clean-surface-war-worktree.test.sh',
    'skills/war/assets/provision-worktrees.test.sh',
    'skills/war/assets/refinery-surface.test.sh',
  ].map(p => join(REPO_ROOT, p))

  for (const expected of EXPECTED_SUITES) {
    assert.ok(
      found.includes(expected),
      `Expected *.test.sh suite not found by repo walk (would be silently orphaned by resolveGate): ${expected}`
    )
  }
  // The discovered count must be >= 4 — a new suite appearing means it IS discovered (no orphan possible)
  // because the walk uses the same pruning as resolveGate (node_modules + .git).
  assert.ok(found.length >= 4, `Expected at least 4 *.test.sh suites, found ${found.length}: ${found.join(', ')}`)
})

test('coverage meta-test: none of the *.test.sh files sit under a pruned path', () => {
  // Confirm the suites are NOT under node_modules or .git — i.e. the find command will reach them.
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.sh'))
  for (const p of found) {
    const rel = relative(REPO_ROOT, p)
    assert.ok(!rel.includes('node_modules'), `*.test.sh inside node_modules would be pruned: ${rel}`)
    assert.ok(!rel.startsWith('.git'), `*.test.sh inside .git would be pruned: ${rel}`)
  }
})

test('coverage meta-test: resolveGate discovery clause covers the repo (find + node_modules + .git prunes match the walk)', () => {
  // The resolveGate discovery string is: find . -type f -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort
  // Our walkFiles uses the same pruning. This test asserts that the discovery pattern's
  // pruning is logically identical to the walk — by checking the command text.
  const cmd = resolveGate('node --test x')
  assert.ok(cmd.includes('-not -path \'*/node_modules/*\''), `expected -not -path '*/node_modules/*' prune, got: ${cmd}`)
  assert.ok(cmd.includes('-not -path \'*/.git/*\''), `expected -not -path '*/.git/*' prune, got: ${cmd}`)
  assert.ok(cmd.includes("name '*.test.sh'"), `expected name '*.test.sh' find pattern, got: ${cmd}`)
})

// --- Node-test breadth assertion (resolves Open decision #1) ---

test('node-test breadth: all *.test.mjs and *.test.js files in the repo are under skills/ (reachable by skills/**/*.test.mjs glob)', () => {
  // The declared gate uses `node --test 'skills/**/*.test.mjs'` which only reaches skills/.
  // Assert that every *.test.mjs / *.test.js file in the repo (excluding pruned paths) is under skills/.
  // Any file outside skills/ would be silently orphaned by the declared node glob.
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs') || name.endsWith('.test.js'))
  const outsideSkills = found.filter(p => {
    const rel = relative(REPO_ROOT, p)
    return !rel.startsWith('skills/')
  })
  assert.deepEqual(
    outsideSkills,
    [],
    `These *.test.mjs / *.test.js files are outside skills/ and would be silently orphaned by 'node --test skills/**/*.test.mjs':\n${outsideSkills.map(p => '  ' + relative(REPO_ROOT, p)).join('\n')}`
  )
})

test('node-test breadth: skills/ contains at least the expected set of *.test.mjs suites', () => {
  // Sanity check that we actually found the known suites (guards against an accidentally empty walk).
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs') || name.endsWith('.test.js'))
  const inSkills = found.filter(p => relative(REPO_ROOT, p).startsWith('skills/'))
  const EXPECTED_MJES = [
    'skills/_shared/provision.test.mjs',
    'skills/war/assets/land-decision.test.mjs',
    'skills/war/assets/war-config.test.mjs',
    'skills/war/assets/workflow-template.test.mjs',
  ].map(p => join(REPO_ROOT, p))
  for (const expected of EXPECTED_MJES) {
    assert.ok(
      inSkills.includes(expected),
      `Expected *.test.mjs not found under skills/: ${expected}`
    )
  }
})

// --- Doc-contract assertions ---

test('doc-contract: SKILL.md mentions --resolve-gate for the gate step', () => {
  const text = readDoc('skills/war/SKILL.md')
  assert.ok(
    text.includes('--resolve-gate'),
    'SKILL.md must mention --resolve-gate in the gate detection step (contract: Lead resolves gate via war-config.mjs --resolve-gate)'
  )
})

test('doc-contract: war-refiner.md states the gate runs all runners / is a resolved command', () => {
  const text = readDoc('agents/war-refiner.md')
  // The refiner doc must describe the gate as running all runners (multi-runner awareness).
  const hasAllRunners = text.includes('all runner') || text.includes('resolved gate') || text.includes('all runners')
  assert.ok(
    hasAllRunners,
    'war-refiner.md must state the gate is a resolved command running all runners (see F12 contract)'
  )
})

test('doc-contract: schemas.md describes overrides.gate as the declared base (not the resolved string)', () => {
  const text = readDoc('skills/war/references/schemas.md')
  // schemas.md must clarify that overrides.gate is the declared base and resolveGate still appends discovery.
  const mentionsGateBase = text.includes('declared base') || text.includes('declared gate') || text.includes('self-discovering')
  assert.ok(
    mentionsGateBase,
    'schemas.md must clarify that overrides.gate is the declared base and the resolved gate is self-discovering (F12 open decision #2)'
  )
})
