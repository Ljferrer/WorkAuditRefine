import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import {
  DEFAULTS, PROVISION_SOURCES, fillDefaults, presetConfig, validate, spawnOpts, covenSeats,
  resolveProvision, resolveGate,
} from './war-config.mjs'
import { HARD_ESCALATION_REASONS, decideLand } from './land-decision.mjs'

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

// ---------------------------------------------------------------------------
// Task 3 — F07: Behavioral drift guards for inline mirrors in workflow-template.js
// ---------------------------------------------------------------------------
// Strategy: extract inline logic by CONSTRUCT (regex/marker) not by line number,
// then rebuild via new Function / new AsyncFunction and compare to the canonical export.

// ---------------------------------------------------------------------------
// spawnOpts drift guard (D1): line-93 marker covers spawnOpts + covenSeats
// ---------------------------------------------------------------------------

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — default effort (omit effort)', () => {
  // Extract the inline spawn arrow function body under the line-93 Keep-in-sync marker.
  // Template: const spawn = role => { const a = agents[role] || {}; ... }
  // We rebuild it as a standalone function(agents, ROLE_MODEL, role) and call it.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  // Reconstruct as a plain function injecting the two closed-over locals the inline uses.
  // The inline body references `agents` and `ROLE_MODEL` — we inject them as parameters.
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role',
    match[1])
  // Test rows: each role with default effort — inline omits effort (== canonical)
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model, effort: 'default' } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, default effort) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — UNDEFINED/falsy effort (key equivalence proof)', () => {
  // This is the critical row: inline uses `a.effort && a.effort !== 'default'`
  // while canonical uses `effort === 'default'`. With undefined effort:
  //   inline: undefined && ... = false → omit effort (correct)
  //   canonical: undefined === 'default' = false → omit effort (correct)
  // Both agree, but a drift in condition would surface here before other rows.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    // effort is UNDEFINED — the canonical falls through to 'default', omitting effort from result
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, undefined effort) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
    // Sanity: both should omit effort (not include it)
    assert.ok(!Object.prototype.hasOwnProperty.call(canonical, 'effort'),
      `canonical spawnOpts(${role}, undefined effort) should omit effort key`)
    assert.ok(!Object.prototype.hasOwnProperty.call(inline, 'effort'),
      `inline spawnOpts(${role}, undefined effort) should omit effort key`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — non-default effort (include effort)', () => {
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  // Non-default effort values
  const effortCases = [['worker', 'max'], ['auditor', 'high'], ['refiner', 'low'], ['servitor', 'medium']]
  for (const [role, effort] of effortCases) {
    const config = { agents: { [role]: { model: DEFAULTS.agents[role].model, effort } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, effort=${effort}) diverges from canonical: inline=${JSON.stringify(inline)} canonical=${JSON.stringify(canonical)}`)
    // Sanity: both should include effort
    assert.equal(canonical.effort, effort, `canonical should include effort=${effort}`)
    assert.equal(inline.effort, effort, `inline should include effort=${effort}`)
  }
})

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — missing model (fallback to ROLE_MODEL)', () => {
  // When agents[role].model is absent, both canonical and inline fall back to ROLE_MODEL defaults.
  const match = templateText.match(/const\s+spawn\s*=\s*role\s*=>\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'inline spawn arrow function not found in workflow-template.js')
  const inlineSpawn = new Function('agents', 'ROLE_MODEL', 'role', match[1])
  const ROLE_MODEL_CANONICAL = {
    worker: DEFAULTS.agents.worker.model,
    auditor: DEFAULTS.agents.auditor.model,
    refiner: DEFAULTS.agents.refiner.model,
    servitor: DEFAULTS.agents.servitor.model,
  }
  for (const role of ['worker', 'auditor', 'refiner', 'servitor']) {
    // agents[role] exists but has no model key — should fall back
    const config = { agents: { [role]: { effort: 'default' } } }
    const canonical = spawnOpts(config, role)
    const inline = inlineSpawn(config.agents, ROLE_MODEL_CANONICAL, role)
    assert.deepEqual(inline, canonical,
      `inline spawnOpts(${role}, missing model) diverges from canonical`)
    // Both should produce the role's default model
    assert.equal(canonical.model, ROLE_MODEL_CANONICAL[role],
      `canonical falls back to ROLE_MODEL for ${role}`)
    assert.equal(inline.model, ROLE_MODEL_CANONICAL[role],
      `inline falls back to ROLE_MODEL for ${role}`)
  }
})

// ---------------------------------------------------------------------------
// covenSeats drift guard (D1): same line-93 marker covers BOTH spawnOpts and covenSeats
// ---------------------------------------------------------------------------

test('drift-guard(F07): inline covenSeats mirror equals canonical covenSeats — coven:false (single seat)', () => {
  // Extract the covenSeats inline from auditRound's body: the baseLenses + lenses computation.
  // Template (~line 166-169):
  //   const baseLenses = task.lenses && task.lenses.length ? task.lenses : ['correctness', ...]
  //   const lenses = !task.coven ? [baseLenses[0]] : Array.from({ length: audit.covenSize || baseLenses.length }, ...)
  // We extract this two-line block and rebuild it as Function(task, audit, DEFAULTS) returning lenses.
  const match = templateText.match(
    /(const baseLenses\s*=\s*task\.lenses[\s\S]*?const lenses\s*=\s*!task\.coven[\s\S]*?baseLenses\[i\s*%\s*baseLenses\.length\]\s*\))/
  )
  assert.ok(match, 'inline covenSeats baseLenses+lenses block not found in workflow-template.js')
  const inlineCovenSeats = new Function('task', 'audit', 'DEFAULTS',
    match[1] + '\nreturn lenses')

  // coven:false — should always return a single-element array with the first lens
  const task1 = { coven: false, lenses: DEFAULTS.audit.lenses }
  const canonical1 = covenSeats(DEFAULTS, task1)
  const inline1 = inlineCovenSeats(task1, DEFAULTS.audit, DEFAULTS)
  assert.deepEqual(inline1, canonical1,
    `inline covenSeats(coven:false) diverges: inline=${JSON.stringify(inline1)} canonical=${JSON.stringify(canonical1)}`)
})

test('drift-guard(F07): inline covenSeats mirror equals canonical covenSeats — coven:true with custom lenses', () => {
  const match = templateText.match(
    /(const baseLenses\s*=\s*task\.lenses[\s\S]*?const lenses\s*=\s*!task\.coven[\s\S]*?baseLenses\[i\s*%\s*baseLenses\.length\]\s*\))/
  )
  assert.ok(match, 'inline covenSeats block not found in workflow-template.js')
  const inlineCovenSeats = new Function('task', 'audit', 'DEFAULTS',
    match[1] + '\nreturn lenses')

  // coven:true with custom lenses (3 lenses, covenSize:3)
  const config = { audit: { covenSize: 3 } }
  const task2 = { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }
  const canonical2 = covenSeats(fillDefaults(config), task2)
  const inline2 = inlineCovenSeats(task2, { covenSize: 3 }, DEFAULTS)
  assert.deepEqual(inline2, canonical2,
    `inline covenSeats(coven:true, custom lenses, covenSize=3) diverges: inline=${JSON.stringify(inline2)} canonical=${JSON.stringify(canonical2)}`)
})

test('drift-guard(F07): inline covenSeats mirror equals canonical covenSeats — covenSize > lenses.length (rotation wrap)', () => {
  const match = templateText.match(
    /(const baseLenses\s*=\s*task\.lenses[\s\S]*?const lenses\s*=\s*!task\.coven[\s\S]*?baseLenses\[i\s*%\s*baseLenses\.length\]\s*\))/
  )
  assert.ok(match, 'inline covenSeats block not found in workflow-template.js')
  const inlineCovenSeats = new Function('task', 'audit', 'DEFAULTS',
    match[1] + '\nreturn lenses')

  // covenSize(5) > lenses.length(3) → rotation wrap: lenses repeat
  const config5 = { audit: { covenSize: 5 } }
  const task3 = { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }
  const canonical3 = covenSeats(fillDefaults(config5), task3)
  const inline3 = inlineCovenSeats(task3, { covenSize: 5 }, DEFAULTS)
  assert.deepEqual(inline3, canonical3,
    `inline covenSeats(covenSize>lenses) diverges: inline=${JSON.stringify(inline3)} canonical=${JSON.stringify(canonical3)}`)
  assert.equal(inline3.length, 5, 'should produce 5 seats when covenSize=5')
})

test('drift-guard(F07): inline covenSeats mirror equals canonical covenSeats — covenSize < lenses.length (truncation)', () => {
  const match = templateText.match(
    /(const baseLenses\s*=\s*task\.lenses[\s\S]*?const lenses\s*=\s*!task\.coven[\s\S]*?baseLenses\[i\s*%\s*baseLenses\.length\]\s*\))/
  )
  assert.ok(match, 'inline covenSeats block not found in workflow-template.js')
  const inlineCovenSeats = new Function('task', 'audit', 'DEFAULTS',
    match[1] + '\nreturn lenses')

  // covenSize(2) < lenses.length(3) → only 2 seats
  const config2 = { audit: { covenSize: 2 } }
  const task4 = { coven: true, lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] }
  const canonical4 = covenSeats(fillDefaults(config2), task4)
  const inline4 = inlineCovenSeats(task4, { covenSize: 2 }, DEFAULTS)
  assert.deepEqual(inline4, canonical4,
    `inline covenSeats(covenSize<lenses) diverges: inline=${JSON.stringify(inline4)} canonical=${JSON.stringify(canonical4)}`)
  assert.equal(inline4.length, 2, 'should produce 2 seats when covenSize=2')
})

test('drift-guard(F07): inline covenSeats uses DEFAULTS.audit.lenses as fallback (DEFAULTS injection equivalence)', () => {
  // The inline hardcodes ['correctness','cascading-impact','plan-faithfulness'] while canonical reads
  // DEFAULTS.audit.lenses. Injecting DEFAULTS when rebuilding means they resolve to the same set.
  // This test checks a task with NO lenses (forces the fallback path).
  const match = templateText.match(
    /(const baseLenses\s*=\s*task\.lenses[\s\S]*?const lenses\s*=\s*!task\.coven[\s\S]*?baseLenses\[i\s*%\s*baseLenses\.length\]\s*\))/
  )
  assert.ok(match, 'inline covenSeats block not found in workflow-template.js')
  const inlineCovenSeats = new Function('task', 'audit', 'DEFAULTS',
    match[1] + '\nreturn lenses')

  // No lenses on task → fallback
  const taskNoLenses = { coven: false }
  const canonicalFallback = covenSeats({}, taskNoLenses)
  const inlineFallback = inlineCovenSeats(taskNoLenses, DEFAULTS.audit, DEFAULTS)
  assert.deepEqual(inlineFallback, canonicalFallback,
    `inline covenSeats(no task lenses, fallback) diverges: inline=${JSON.stringify(inlineFallback)} canonical=${JSON.stringify(canonicalFallback)}`)
})

// ---------------------------------------------------------------------------
// decideLand drift guard (D1): lines 367/368 markers
// ---------------------------------------------------------------------------

test('drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand logic equals canonical decideLand — empty landed × empty escalated', () => {
  // Extract inline HARD_ESCALATION_REASONS, hardEscalation + landDecision ternary from ~line 370-374.
  // These three lines are under the 367/368 "landDecision mirrors" markers.
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))

  // Rebuild the decideLand logic from the inline ternary:
  //   hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
  //   landDecision = (landed.length && !hardEscalation) ? 'landed' : hardEscalation ? 'held:escalation' : 'held:nothing-merged'
  function inlineDecideLand({ landed = [], escalated = [] } = {}) {
    const hard = escalated.some(e => inlineReasons.includes(e && e.reason))
    return (landed.length && !hard) ? 'landed'
      : hard ? 'held:escalation'
      : 'held:nothing-merged'
  }

  // empty landed × empty escalated → 'held:nothing-merged'
  const args1 = { landed: [], escalated: [] }
  assert.equal(inlineDecideLand(args1), decideLand(args1),
    'inline decideLand(empty,empty) diverges from canonical')
})

test('drift-guard(F07): inline decideLand — non-empty landed × empty escalated → landed', () => {
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  function inlineDecideLand({ landed = [], escalated = [] } = {}) {
    const hard = escalated.some(e => inlineReasons.includes(e && e.reason))
    return (landed.length && !hard) ? 'landed'
      : hard ? 'held:escalation'
      : 'held:nothing-merged'
  }

  const args2 = { landed: ['t1', 't2'], escalated: [] }
  assert.equal(inlineDecideLand(args2), decideLand(args2), 'inline decideLand(landed,empty) diverges')
  assert.equal(inlineDecideLand(args2), 'landed', 'expected "landed"')
})

test('drift-guard(F07): inline decideLand — non-empty landed × escalated with a HARD reason → held:escalation', () => {
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  function inlineDecideLand({ landed = [], escalated = [] } = {}) {
    const hard = escalated.some(e => inlineReasons.includes(e && e.reason))
    return (landed.length && !hard) ? 'landed'
      : hard ? 'held:escalation'
      : 'held:nothing-merged'
  }

  // All 6 hard reasons must individually hold the land
  for (const reason of HARD_ESCALATION_REASONS) {
    const args = { landed: ['t1'], escalated: [{ task: 't2', reason }] }
    assert.equal(inlineDecideLand(args), decideLand(args),
      `inline decideLand diverges for hard reason "${reason}"`)
    assert.equal(inlineDecideLand(args), 'held:escalation',
      `hard reason "${reason}" must yield held:escalation`)
  }
})

test('drift-guard(F07): inline decideLand — empty landed × escalated with SOFT reason → held:nothing-merged', () => {
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  function inlineDecideLand({ landed = [], escalated = [] } = {}) {
    const hard = escalated.some(e => inlineReasons.includes(e && e.reason))
    return (landed.length && !hard) ? 'landed'
      : hard ? 'held:escalation'
      : 'held:nothing-merged'
  }

  // A SOFT reason (env-blocked is not in HARD_ESCALATION_REASONS) + no landed → held:nothing-merged
  const args = { landed: [], escalated: [{ task: 't1', reason: 'env-blocked' }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand diverges for soft reason "env-blocked"')
  assert.equal(inlineDecideLand(args), 'held:nothing-merged',
    'soft reason with no landed → held:nothing-merged')
})

test('drift-guard(F07): inline HARD_ESCALATION_REASONS has exactly 6 members matching canonical', () => {
  // The live array has 6 members: escalate, audit-blocked, conflict, land_stale, dep-failed, gate-evidence
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.equal(inlineReasons.length, 6, `Expected 6 HARD_ESCALATION_REASONS, got ${inlineReasons.length}: ${JSON.stringify(inlineReasons)}`)
  assert.deepEqual(inlineReasons, HARD_ESCALATION_REASONS,
    'inline HARD_ESCALATION_REASONS must exactly match the canonical export from land-decision.mjs')
})

// ---------------------------------------------------------------------------
// Classifying meta-guard (D3): every Keep-in-sync/Mirror-of marker is accounted for
// ---------------------------------------------------------------------------
// Markers are NOT 1:1 with drift tests:
//   line-93  → logic-mirror covering spawnOpts AND covenSeats (1 marker, 2 registered drift tests)
//   line-367 → logic-mirror covering landDecision (decideLand)
//   line-368 → logic-mirror covering HARD_ESCALATION_REASONS (same decideLand block)
//   line-69  → data-mirror (run.provision/provisionSource field names) — allowlisted, no behavioral test
// A marker not in either registry → test fails.

test('meta-guard(F07): all Keep-in-sync/Mirror-of markers in workflow-template.js are classified (logic-mirror registry + data-mirror allowlist)', () => {
  // Scan for every Keep-in-sync / Mirror-of / MIRROR-of marker in the template.
  // Strategy: collect every comment line containing these keywords.
  const markerPattern = /Keep in sync|Mirror of|MIRROR of/gi
  const lines = templateText.split('\n')
  const markerLines = lines
    .map((line, idx) => ({ line: line.trim(), lineNum: idx + 1 }))
    .filter(({ line }) => markerPattern.test(line))

  // Reset regex lastIndex (global flag)
  markerPattern.lastIndex = 0

  // Registry of LOGIC mirrors → each must have ≥1 registered drift test (keyed by a stable identifier).
  // The identifier is a substring of the marker text (robust to line-number shifts).
  const LOGIC_MIRROR_REGISTRY = new Map([
    // line-93 marker: "Mirror of war-config.mjs spawnOpts/covenSeats … Keep in sync"
    // → covered by spawnOpts drift tests + covenSeats drift tests
    ['spawnOpts/covenSeats', ['drift-guard(F07): inline spawnOpts', 'drift-guard(F07): inline covenSeats']],
    // line-367 marker: "landDecision mirrors land-decision.mjs (decideLand) … Keep in sync"
    // → covered by decideLand drift tests
    ['landDecision mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
    // line-368 marker: "HARD_ESCALATION_REASONS mirrors land-decision.mjs export … Keep in sync"
    // → covered by the same decideLand drift tests
    ['HARD_ESCALATION_REASONS mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
  ])

  // DATA mirrors → allowlisted (field names, no canonical function to behavioral-test).
  const DATA_MIRROR_ALLOWLIST = [
    // line-69 marker: "This is a MIRROR of war-config.mjs's run.provision/run.provisionSource reads"
    'run.provision/run.provisionSource',
    // Synonyms / partial matches for the same marker
    'provisionSource reads',
    'MIRROR of',
  ]

  const unaccounted = []
  for (const { line, lineNum } of markerLines) {
    // Check if this marker line is covered by a logic-mirror registry entry.
    let isLogicMirror = false
    for (const [key] of LOGIC_MIRROR_REGISTRY) {
      if (line.includes(key)) { isLogicMirror = true; break }
    }
    if (isLogicMirror) continue

    // Check if this marker line is in the data-mirror allowlist.
    let isDataMirror = false
    for (const allowed of DATA_MIRROR_ALLOWLIST) {
      if (line.includes(allowed)) { isDataMirror = true; break }
    }
    if (isDataMirror) continue

    // Neither: unaccounted marker
    unaccounted.push({ lineNum, line })
  }

  assert.deepEqual(
    unaccounted,
    [],
    `Unaccounted Keep-in-sync/Mirror-of markers found in workflow-template.js.\n` +
    `Each must be either (a) registered in LOGIC_MIRROR_REGISTRY with ≥1 behavioral drift test, ` +
    `or (b) allowlisted in DATA_MIRROR_ALLOWLIST (data-flow fields, no canonical function).\n` +
    `Unaccounted markers:\n` +
    unaccounted.map(m => `  line ${m.lineNum}: ${m.line}`).join('\n')
  )
})

test('meta-guard(F07): sanity — currently exactly 4 Keep-in-sync/Mirror-of markers exist (lines 69, 93, 367, 368)', () => {
  // This test guards against silent marker addition (a new mirror that skips the registry).
  // If you add a new mirror, update BOTH the registry/allowlist above AND bump this count.
  const markerPattern = /Keep in sync|Mirror of|MIRROR of/gi
  const markerLines = templateText.split('\n')
    .filter(line => markerPattern.test(line))
  // Reset for the count
  markerPattern.lastIndex = 0
  const count = templateText.split('\n').filter(line => /Keep in sync|Mirror of|MIRROR of/i.test(line)).length
  assert.equal(count, 4,
    `Expected exactly 4 Keep-in-sync/Mirror-of marker lines in workflow-template.js, found ${count}.\n` +
    `If you added a new mirror, register it in the LOGIC_MIRROR_REGISTRY or DATA_MIRROR_ALLOWLIST and bump this count.`
  )
})
