import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import {
  DEFAULTS, PROVISION_SOURCES, ROSTER_POLICIES, RESERVED_LENSES, fillDefaults, presetConfig, validate, spawnOpts,
  validateRoster, widenRoster, resolveWidenSource, resolveProvision, resolveGate,
} from './war-config.mjs'
import { HARD_ESCALATION_REASONS, decideLand } from './land-decision.mjs'

// Helper: read workflow-template.js as text relative to this test file.
const __dir = dirname(fileURLToPath(import.meta.url))
const templateText = readFileSync(join(__dir, 'workflow-template.js'), 'utf8')

// Helper: recursively find files matching a predicate under a root, excluding pruned dirs.
function walkFiles(root, predicate, pruned = ['node_modules', '.git', 'worktrees']) {
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

// T1.4: unit test that walkFiles prunes 'worktrees' by basename.
// Uses a synthesized tmp fixture: <tmp>/worktrees/<run>/skills/x.test.mjs
// If 'worktrees' is removed from the default pruned list, this test goes RED.
test('walkFiles: skips files under a worktrees/ dir (basename prune)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'war-config-test-'))
  // Fixture: <tmp>/worktrees/run123/skills/x.test.mjs  ← should be pruned
  mkdirSync(join(tmp, 'worktrees', 'run123', 'skills'), { recursive: true })
  writeFileSync(join(tmp, 'worktrees', 'run123', 'skills', 'x.test.mjs'), '')
  // Fixture: <tmp>/skills/y.test.mjs  ← should be found
  mkdirSync(join(tmp, 'skills'), { recursive: true })
  writeFileSync(join(tmp, 'skills', 'y.test.mjs'), '')

  const found = walkFiles(tmp, name => name.endsWith('.test.mjs'))
  // The file under worktrees/ must be absent (pruned by basename 'worktrees')
  assert.ok(
    !found.some(p => p.includes('worktrees')),
    `walkFiles must prune 'worktrees/' by basename; found: ${found.join(', ')}`
  )
  // The file under skills/ must be present
  assert.ok(
    found.some(p => p.endsWith(join('skills', 'y.test.mjs'))),
    `walkFiles must still find files outside 'worktrees/'; found: ${found.join(', ')}`
  )
})

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
  assert.equal(c.agents.worker.model, 'opus')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.agents.auditor.effort, 'xhigh')
  assert.equal(c.agents.servitor.effort, 'high')
  assert.equal(c.audit.rosterPolicy, 'auto')
  assert.equal(validate({}).valid, true)
})

test('deepMerge via fillDefaults does not mutate DEFAULTS', () => {
  const snapshot = JSON.stringify(DEFAULTS)
  fillDefaults({ agents: { worker: { model: 'opus' } } })
  assert.equal(JSON.stringify(DEFAULTS), snapshot)
})

test('partial override merges over defaults', () => {
  const c = fillDefaults({ agents: { worker: { model: 'haiku', effort: 'low' } } })
  assert.equal(c.agents.worker.model, 'haiku')
  assert.equal(c.agents.worker.effort, 'low')
  assert.equal(c.agents.auditor.model, 'opus')   // untouched default
  assert.equal(c.agents.refiner.model, 'sonnet') // untouched default
})

test('thorough preset', () => {
  const c = presetConfig('thorough')
  assert.equal(c.agents.worker.model, 'fable')
  assert.equal(c.agents.worker.effort, 'max')
  assert.equal(c.agents.auditor.model, 'opus')
  assert.equal(c.agents.auditor.effort, 'max')
  assert.equal(c.agents.servitor.model, 'opus')
  assert.equal(c.agents.servitor.effort, 'default')
  assert.equal(c.audit.rosterPolicy, 'auto')       // inherited: Lead seeds 1-5 seats per task
  assert.equal(c.audit.roster.length, 5)
  assert.deepEqual(c.audit.roster.map(s => s.lens),
    ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'test-fidelity'])
  assert.equal(validate(c).valid, true)
})

test('economy preset (pinned to its historical effective config)', () => {
  const c = presetConfig('economy')
  assert.equal(c.agents.worker.model, 'sonnet')
  assert.equal(c.agents.worker.effort, 'default')
  assert.equal(c.agents.auditor.model, 'sonnet')
  assert.equal(c.agents.servitor.model, 'sonnet')
  assert.equal(c.agents.servitor.effort, 'default') // pinned — DEFAULTS moved to high
  assert.equal(c.audit.rosterPolicy, 'solo')
  assert.equal(c.run.roundLimit, 2)
  assert.equal(c.run.ace, false)                    // pinned — DEFAULTS moved to true
  assert.equal(c.memory.commitLearnings, false)     // pinned — DEFAULTS moved to true
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

// --- audit roster validation + D3 legacy-key courtesy errors ------------------

test('legacy audit.covenSize rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { covenSize: 3 } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.covenSize/)
  assert.match(msg, /\/war-room/)
})

test('legacy audit.lenses rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { lenses: ['correctness'] } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.lenses/)
  assert.match(msg, /\/war-room/)
})

test('legacy audit.covenPolicy rejected with a courtesy error naming the key and /war-room', () => {
  const r = validate({ audit: { covenPolicy: 'all' } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /audit\.covenPolicy/)
  assert.match(msg, /rosterPolicy/)
  assert.match(msg, /\/war-room/)
})

test('bad rosterPolicy rejected', () => {
  assert.equal(validate({ audit: { rosterPolicy: 'never' } }).valid, false)
})

test('each ROSTER_POLICIES member is accepted', () => {
  for (const p of ROSTER_POLICIES) {
    assert.equal(validate({ audit: { rosterPolicy: p } }).valid, true, `rosterPolicy ${p} should be valid`)
  }
})

test('invalid roster rejected through validate() with an audit.-prefixed error', () => {
  const r = validate({ audit: { roster: [] } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /audit\.roster/)
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

// --- run.ace (--ace opt-in pre-merge nit auto-fix; default false) -------------

test('ace defaults to true; economy pins false', () => {
  assert.equal(DEFAULTS.run.ace, true)
  for (const preset of ['balanced', 'thorough']) {
    assert.equal(presetConfig(preset).run.ace, true, `${preset} preset must inherit run.ace === true`)
  }
  assert.equal(presetConfig('economy').run.ace, false, 'economy preset must pin run.ace === false')
})

test('non-boolean ace rejected', () => {
  const r = validate({ run: { ace: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /run\.ace must be a boolean/)
})

// --- memory block (compounding-memory retrieval + publication) ----------------
// DEFAULTS.memory = { retrieval: true, topK: 10, commitLearnings: true }.
// Doctrine: no accepted-but-ignored keys, so validate() rejects bad types AND unknown keys.

test('memory defaults: retrieval true, topK 10, commitLearnings true', () => {
  const c = fillDefaults({})
  assert.deepEqual(c.memory, { retrieval: true, topK: 10, commitLearnings: true })
})

test('commitLearnings defaults to true; economy pins false', () => {
  assert.equal(DEFAULTS.memory.commitLearnings, true)
  for (const preset of ['balanced', 'thorough']) {
    assert.equal(presetConfig(preset).memory.commitLearnings, true, `${preset} preset must inherit memory.commitLearnings === true`)
  }
  assert.equal(presetConfig('economy').memory.commitLearnings, false, 'economy preset must pin memory.commitLearnings === false')
})

// criterion 12: a config WITHOUT a memory block fills defaults clean and validates.
// Temp-break: remove DEFAULTS.memory and fillDefaults({}) yields undefined memory → validate fails here.
test('old config without a memory block fills defaults clean and validates (criterion 12)', () => {
  const legacy = { version: 1, agents: { worker: { model: 'opus', effort: 'max' } } } // no memory key
  const c = fillDefaults(legacy)
  assert.deepEqual(c.memory, { retrieval: true, topK: 10, commitLearnings: true })
  assert.equal(validate(legacy).valid, true, validate(legacy).errors.join('\n'))
})

test('memory block: a fully-specified valid block passes', () => {
  const r = validate({ memory: { retrieval: false, topK: 5, commitLearnings: true } })
  assert.equal(r.valid, true, r.errors.join('\n'))
})

// The 'memory must be an object' branch (validate line 137). Both inputs reach it:
//   {memory:null} — deepMerge replaces the default object with null (isObj(null)===false)
//   {memory:[]}   — isObj rejects arrays
test('memory non-object rejected (null / array reach the object-type branch)', () => {
  const rNull = validate({ memory: null })
  assert.equal(rNull.valid, false)
  assert.match(rNull.errors.join('\n'), /memory must be an object/)
  const rArr = validate({ memory: [] })
  assert.equal(rArr.valid, false)
  assert.match(rArr.errors.join('\n'), /memory must be an object/)
})

test('memory.retrieval non-boolean rejected', () => {
  const r = validate({ memory: { retrieval: 'yes' } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.retrieval must be a boolean/)
})

test('memory.commitLearnings non-boolean rejected', () => {
  const r = validate({ memory: { commitLearnings: 1 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.commitLearnings must be a boolean/)
})

test('memory.topK non-integer rejected', () => {
  const r = validate({ memory: { topK: 2.5 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.topK must be an integer >= 1/)
})

test('memory.topK below 1 rejected', () => {
  const r = validate({ memory: { topK: 0 } })
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /memory\.topK must be an integer >= 1/)
})

// Doctrine proof: an unknown memory key is a config error, never silently kept (no accepted-but-ignored keys).
test('unknown memory key rejected (no accepted-but-ignored keys)', () => {
  const r = validate({ memory: { topN: 3 } })
  assert.equal(r.valid, false)
  const msg = r.errors.join('\n')
  assert.match(msg, /memory\.topN/)
  assert.match(msg, /\/war-room/)
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
  assert.deepEqual(spawnOpts(DEFAULTS, 'refiner'), { model: 'sonnet' })
})

test('spawnOpts includes non-default effort', () => {
  assert.deepEqual(spawnOpts(DEFAULTS, 'worker'), { model: 'opus', effort: 'max' })
  assert.deepEqual(spawnOpts(presetConfig('thorough'), 'worker'), { model: 'fable', effort: 'max' })
})

// --- validateRoster (D8) / widenRoster (D5) unit tests -------------------------

test('validateRoster: accepts 1–5 distinct-lens entries, depth present or absent', () => {
  assert.deepEqual(validateRoster([{ lens: 'correctness' }]), { valid: true, errors: [] })
  const five = [
    { lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' },
    { lens: 'performance' }, { lens: 'simplicity' }, { lens: 'usability', depth: 'deep' },
  ]
  assert.deepEqual(validateRoster(five), { valid: true, errors: [] })
})

test('validateRoster: DEFAULTS.audit.roster is valid (trio at deep)', () => {
  assert.deepEqual(validateRoster(DEFAULTS.audit.roster), { valid: true, errors: [] })
})

test('validateRoster: rejects an empty roster and a 6-entry roster (1–5 bound)', () => {
  assert.equal(validateRoster([]).valid, false)
  const six = ['a', 'b', 'c', 'd', 'e', 'f'].map(l => ({ lens: l }))
  assert.equal(validateRoster(six).valid, false)
})

test('validateRoster: rejects duplicate lenses (distinct-lens rule)', () => {
  const r = validateRoster([{ lens: 'correctness' }, { lens: 'correctness' }])
  assert.equal(r.valid, false)
  assert.match(r.errors.join('\n'), /duplicat/i)
})

test('validateRoster: rejects empty and non-string lens', () => {
  assert.equal(validateRoster([{ lens: '' }]).valid, false)
  assert.equal(validateRoster([{ lens: 42 }]).valid, false)
})

test("validateRoster: rejects depth 'shallow' (enum is neighbors|deep)", () => {
  assert.equal(validateRoster([{ lens: 'correctness', depth: 'shallow' }]).valid, false)
})

test('validateRoster: rejects non-object entries', () => {
  assert.equal(validateRoster(['correctness']).valid, false)
  assert.equal(validateRoster([null]).valid, false)
})

test('widenRoster: solo security seat + default trio → 4 seats, security first, appended seats carry default depths', () => {
  const out = widenRoster([{ lens: 'security', depth: 'deep' }], DEFAULTS.audit.roster)
  assert.deepEqual(out.map(s => s.lens), ['security', 'correctness', 'cascading-impact', 'plan-faithfulness'])
  assert.equal(out[0].depth, 'deep')
  assert.ok(out.slice(1).every(s => s.depth === 'deep'), 'appended default seats keep their configured depths')
})

test('widenRoster: union dedupes — solo correctness@neighbors + trio → 3 seats, kept seat keeps its depth', () => {
  const out = widenRoster([{ lens: 'correctness', depth: 'neighbors' }], DEFAULTS.audit.roster)
  assert.deepEqual(out.map(s => s.lens), ['correctness', 'cascading-impact', 'plan-faithfulness'])
  assert.equal(out[0].depth, 'neighbors', 'the kept seat keeps its own depth (union, not replacement)')
})

test('widenRoster: caps at 5 — 1 seat + a 5-lens default → 5 seats, never 6', () => {
  const FIVE = ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'performance']
    .map(l => ({ lens: l, depth: 'deep' }))
  const out = widenRoster([{ lens: 'usability', depth: 'neighbors' }], FIVE)
  assert.equal(out.length, 5)
  assert.equal(out[0].lens, 'usability')
})

// ---------------------------------------------------------------------------
// resolveWidenSource (D4): auditor-nominated lone-seat widening source
// ---------------------------------------------------------------------------

const DEF = DEFAULTS.audit.roster

test('resolveWidenSource: valid nomination → per-seat deep, source "nominated"', () => {
  const r = resolveWidenSource(['security', 'performance'], DEF)
  assert.equal(r.source, 'nominated')
  assert.deepEqual(r.seats, [{ lens: 'security', depth: 'deep' }, { lens: 'performance', depth: 'deep' }])
})

test('resolveWidenSource: single-lens valid nomination → one deep seat, "nominated"', () => {
  const r = resolveWidenSource(['usability'], DEF)
  assert.equal(r.source, 'nominated')
  assert.deepEqual(r.seats, [{ lens: 'usability', depth: 'deep' }])
})

test('resolveWidenSource: RESERVED_LENSES entry rejects the WHOLE nomination → default fallback (no per-entry salvage)', () => {
  for (const reserved of RESERVED_LENSES) {
    const r = resolveWidenSource(['security', reserved], DEF)
    assert.equal(r.source, 'default', `nomination containing reserved lens "${reserved}" must fall back whole-field`)
    assert.strictEqual(r.seats, DEF, 'fallback returns defaultRoster verbatim (same reference)')
  }
})

test('resolveWidenSource: duplicate lenses → default fallback', () => {
  const r = resolveWidenSource(['security', 'security'], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: empty-string entry → default fallback', () => {
  const r = resolveWidenSource(['security', ''], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: non-string entry → default fallback', () => {
  const r = resolveWidenSource(['security', 42], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: empty array [] → default fallback', () => {
  const r = resolveWidenSource([], DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: undefined (absent widen) → default fallback', () => {
  const r = resolveWidenSource(undefined, DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: non-array (string) → default fallback', () => {
  const r = resolveWidenSource('security', DEF)
  assert.equal(r.source, 'default')
  assert.strictEqual(r.seats, DEF)
})

test('resolveWidenSource: own-lens nomination is legal — widenRoster dedupes it (lone seat kept once)', () => {
  // A lone `correctness` seat nominating `correctness` + `security`: resolveWidenSource accepts it
  // (distinct, non-reserved), and feeding the result through widenRoster dedupes the seat's own lens.
  const { seats } = resolveWidenSource(['correctness', 'security'], DEF)
  const widened = widenRoster([{ lens: 'correctness', depth: 'neighbors' }], seats)
  assert.deepEqual(widened.map(s => s.lens), ['correctness', 'security'])
  assert.equal(widened[0].depth, 'neighbors', 'the lone seat keeps its own depth (union, not replacement)')
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
  assert.ok(result.includes("-not -path '*/node_modules/*'"), `expected -not -path '*/node_modules/*' prune, got: ${result}`)
})

test('resolveGate: with a declared gate — contains find for *.test.sh with .git prune', () => {
  const result = resolveGate('node --test x')
  assert.ok(result.includes("-not -path '*/.git/*'"), `expected -not -path '*/.git/*' prune, got: ${result}`)
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
  // dep-failed was the Task 1 (F02) foundation; land_stale pre-existed; Task 4 (F04/R3) added gate-evidence (6 items total).
  // L1 (unify): 'unrunnable-deps' is now in land-decision.mjs too — the inline literal and the
  // canonical export are IDENTICAL (exact equality, no scheduler-local divergence).
  // M2: 'no-test' added to both mirrors (8 members). Container-packaging: 'unpackaged' added to both mirrors (9 members total).
  //
  // The template has:
  //   const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged']
  const match = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(match, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  // Normalize single-quoted strings to double-quoted for JSON.parse.
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  // EXACT EQUALITY: the inline literal must equal the canonical export, member-for-member (order-insensitive).
  assert.deepEqual([...parsed].sort(), [...HARD_ESCALATION_REASONS].sort(),
    'inline HARD_ESCALATION_REASONS must equal the canonical export exactly (no divergence)')
  assert.ok(HARD_ESCALATION_REASONS.includes('unrunnable-deps'), 'unrunnable-deps must be in canonical HARD_ESCALATION_REASONS (L1 unify)')
  assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'), 'dep-failed must be in HARD_ESCALATION_REASONS (F02 foundation)')
  assert.ok(HARD_ESCALATION_REASONS.includes('no-test'), 'no-test must be in canonical HARD_ESCALATION_REASONS (M2)')
  assert.ok(HARD_ESCALATION_REASONS.includes('unpackaged'), 'unpackaged must be in canonical HARD_ESCALATION_REASONS (container-packaging floor)')
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

test('node-test breadth: all *.test.mjs files in the repo are under skills/ (reachable by skills/**/*.test.mjs glob)', () => {
  // The declared gate uses `node --test 'skills/**/*.test.mjs'` which only reaches skills/.
  // Assert that every *.test.mjs file in the repo (excluding pruned paths) is under skills/.
  // Any file outside skills/ would be silently orphaned by the declared node glob.
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs'))
  const outsideSkills = found.filter(p => {
    const rel = relative(REPO_ROOT, p)
    return !rel.startsWith('skills/')
  })
  assert.deepEqual(
    outsideSkills,
    [],
    `These *.test.mjs files are outside skills/ and would be silently orphaned by 'node --test skills/**/*.test.mjs':\n${outsideSkills.map(p => '  ' + relative(REPO_ROOT, p)).join('\n')}`
  )
})

test('node-test breadth: skills/ contains at least the expected set of *.test.mjs suites', () => {
  // Sanity check that we actually found the known suites (guards against an accidentally empty walk).
  const found = walkFiles(REPO_ROOT, name => name.endsWith('.test.mjs'))
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
// Task 3 — F06: Default rosterPolicy 'all'; presets; historical-spec doc contract
// ---------------------------------------------------------------------------

// 2026-07-03 operator default flip: rosterPolicy default is now 'auto' (supersedes F06's 'all').
test('fillDefaults: audit.rosterPolicy defaults to auto (Lead seeds 1-N seats per task)', () => {
  const c = fillDefaults({})
  assert.equal(c.audit.rosterPolicy, 'auto',
    'fillDefaults({}) must produce audit.rosterPolicy === "auto" (Lead seeds per-task rosters by blast radius)')
})

test('preset economy keeps explicit rosterPolicy:solo (deepMerge override unaffected by DEFAULTS flip)', () => {
  const c = presetConfig('economy')
  assert.equal(c.audit.rosterPolicy, 'solo',
    'economy preset must keep rosterPolicy:"solo" regardless of the DEFAULTS value')
})

test('preset thorough inherits rosterPolicy:auto', () => {
  const c = presetConfig('thorough')
  assert.equal(c.audit.rosterPolicy, 'auto',
    'thorough preset must inherit rosterPolicy:"auto" (1-5 seats seeded per task)')
})

test('preset balanced (= fillDefaults) is rosterPolicy:auto', () => {
  const c = presetConfig('balanced')
  assert.equal(c.audit.rosterPolicy, 'auto',
    'balanced preset (= DEFAULTS) must be rosterPolicy:"auto"')
})

test('F06 — doc-contract: design spec balanced preset table updated to covenPolicy all', () => {
  const text = readDoc('docs/specs/2026-06-18-war-room-design.md')
  // The design spec preset table had balanced=auto; must now show all
  // Look for the table row for balanced having 'all' rather than 'auto'
  const hasAll = text.includes('`all`') || text.includes('"all"') || text.includes("'all'") ||
    text.includes('covenPolicy: all') || text.includes('covenPolicy:"all"')
  assert.ok(hasAll,
    'design spec must show balanced covenPolicy as all in the preset table (F06)')
})

// ---------------------------------------------------------------------------
// Task 3 — F07: Behavioral drift guards for inline mirrors in workflow-template.js
// ---------------------------------------------------------------------------
// Strategy: extract inline logic by CONSTRUCT (regex/marker) not by line number,
// then rebuild via new Function / new AsyncFunction and compare to the canonical export.

// ---------------------------------------------------------------------------
// spawnOpts drift guard (D1): the combined spawnOpts/validateRoster/widenRoster
// marker covers all three mirrors
// ---------------------------------------------------------------------------

test('drift-guard(F07): inline spawnOpts mirror equals canonical spawnOpts — default effort (omit effort)', () => {
  // Extract the inline spawn arrow function body under the combined Keep-in-sync marker.
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
// validateRoster/widenRoster drift guards (D9): the same combined
// spawnOpts/validateRoster/widenRoster marker covers all three mirrors
// ---------------------------------------------------------------------------

const VR_EXTRACT = /const validateRoster\s*=\s*roster\s*=>\s*\{([\s\S]*?)\n\}/
const WR_EXTRACT = /const widenRoster\s*=\s*\(roster,\s*defaultRoster\)\s*=>\s*\{([\s\S]*?)\n\}/

test('drift-guard(F07): inline validateRoster mirror equals canonical validateRoster across accept/reject cases', () => {
  const match = templateText.match(VR_EXTRACT)
  assert.ok(match, 'inline validateRoster arrow not found in workflow-template.js')
  const inline = new Function('roster', match[1])
  const cases = [
    [{ lens: 'correctness' }],
    [{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }],
    DEFAULTS.audit.roster,
    [],
    undefined,
    'not-an-array',
    ['a', 'b', 'c', 'd', 'e', 'f'].map(l => ({ lens: l })),
    [{ lens: 'x' }, { lens: 'x' }],
    [{ lens: '' }],
    [{ lens: 42 }],
    [{ lens: 'ok', depth: 'shallow' }],
    ['just-a-string'],
    [null],
  ]
  for (const c of cases) {
    assert.deepEqual(inline(c), validateRoster(c),
      `inline validateRoster diverges from canonical for case ${JSON.stringify(c)}`)
  }
})

test('drift-guard(F07): inline widenRoster mirror equals canonical widenRoster across union/dedupe/cap cases', () => {
  const match = templateText.match(WR_EXTRACT)
  assert.ok(match, 'inline widenRoster arrow not found in workflow-template.js')
  const inline = new Function('roster', 'defaultRoster', match[1])
  const FIVE = ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'performance']
    .map(l => ({ lens: l, depth: 'deep' }))
  const cases = [
    [[{ lens: 'security', depth: 'deep' }], DEFAULTS.audit.roster],
    [[{ lens: 'correctness', depth: 'neighbors' }], DEFAULTS.audit.roster],
    [[{ lens: 'usability', depth: 'neighbors' }], FIVE],
    [DEFAULTS.audit.roster, DEFAULTS.audit.roster],
    [[{ lens: 'a' }], []],
    [[{ lens: 'a' }], undefined],
  ]
  for (const [roster, def] of cases) {
    assert.deepEqual(inline(roster, def), widenRoster(roster, def),
      `inline widenRoster diverges from canonical for case ${JSON.stringify([roster, def])}`)
  }
})

// resolveWidenSource (D4) lives under the same combined spawnOpts/validateRoster/widenRoster/resolveWidenSource
// marker. Its inline arrow references the inline RESERVED_LENSES array, so extract BOTH and inject the
// array into the new Function (mirroring the decideLand extract-and-inject pattern) — this way a drift in
// EITHER the inline RESERVED_LENSES literal or the inline validation logic bites.
const RWS_EXTRACT = /const resolveWidenSource\s*=\s*\(nominated,\s*defaultRoster\)\s*=>\s*\{([\s\S]*?)\n\}/
const RL_INLINE_EXTRACT = /const\s+RESERVED_LENSES\s*=\s*(\[[^\]]*\])/

test('drift-guard(F07): inline resolveWidenSource mirror equals canonical resolveWidenSource across nominated/fallback cases', () => {
  const rwsMatch = templateText.match(RWS_EXTRACT)
  assert.ok(rwsMatch, 'inline resolveWidenSource arrow not found in workflow-template.js')
  const rlMatch = templateText.match(RL_INLINE_EXTRACT)
  assert.ok(rlMatch, 'inline RESERVED_LENSES literal not found in workflow-template.js')
  const inlineReserved = JSON.parse(rlMatch[1].replace(/'/g, '"'))
  // The extracted body references RESERVED_LENSES; inject it as a parameter so the closure resolves.
  const inline = new Function('nominated', 'defaultRoster', 'RESERVED_LENSES', rwsMatch[1])
  const call = (nominated, def) => inline(nominated, def, inlineReserved)

  const DEF = DEFAULTS.audit.roster
  const cases = [
    [['security', 'performance'], DEF],       // valid multi
    [['usability'], DEF],                      // valid single
    [['execution-evidence'], DEF],             // reserved → fallback
    [['security', 'pin-validity'], DEF],       // reserved among valid → whole-field fallback
    [['security', 'security'], DEF],           // duplicate → fallback
    [['security', ''], DEF],                   // empty string → fallback
    [['security', 42], DEF],                   // non-string → fallback
    [[], DEF],                                 // empty array → fallback
    [undefined, DEF],                          // absent → fallback
    ['security', DEF],                         // non-array → fallback
    [['correctness', 'security'], DEF],        // own-lens legal → nominated
  ]
  for (const [nominated, def] of cases) {
    assert.deepEqual(call(nominated, def), resolveWidenSource(nominated, def),
      `inline resolveWidenSource diverges from canonical for case ${JSON.stringify([nominated, def])}`)
  }

  // The inline RESERVED_LENSES literal must itself equal the canonical export (guards a stale inline copy).
  assert.deepEqual(inlineReserved, RESERVED_LENSES,
    'inline RESERVED_LENSES literal in workflow-template.js diverges from canonical RESERVED_LENSES export')
})

// ---------------------------------------------------------------------------
// decideLand drift guard (D1): the landDecision + HARD_ESCALATION_REASONS markers
// ---------------------------------------------------------------------------

// Helper: extract the inline hardEscalation + landDecision ternary from workflow-template.js
// and rebuild it as an executable function via new Function — mirroring the spawnOpts/validateRoster
// extract-and-execute pattern so that template-side ternary drift (not just array drift) bites.
function buildInlineDecideLand() {
  // Extract the HARD_ESCALATION_REASONS array literal from the template.
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))

  // Extract the inline hardEscalation expression + the 3-branch landDecision ternary.
  // The regex captures from 'const hardEscalation = escalated.some' through 'held:nothing-merged'.
  const ternaryMatch = templateText.match(
    /(const hardEscalation\s*=\s*escalated\.some[\s\S]*?'held:nothing-merged')/
  )
  assert.ok(ternaryMatch, 'inline hardEscalation + landDecision ternary not found in workflow-template.js')

  // Rebuild via new Function — the extracted code references landed, escalated, HARD_ESCALATION_REASONS.
  // Injecting the extracted array as HARD_ESCALATION_REASONS keeps the extraction faithful.
  const fnBody = ternaryMatch[1] + '\nreturn landDecision'
  const fn = new Function('landed', 'escalated', 'HARD_ESCALATION_REASONS', fnBody)
  return ({ landed = [], escalated = [] } = {}) => fn(landed, escalated, inlineReasons)
}

test('drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand logic equals canonical decideLand — empty landed × empty escalated', () => {
  // Extract the inline HARD_ESCALATION_REASONS, hardEscalation + landDecision ternary — the block
  // under the "landDecision mirrors" / "HARD_ESCALATION_REASONS mirrors" Keep-in-sync markers.
  // Uses new Function to execute the LIVE template code so ternary-level drift is detected (not just array drift).
  const inlineDecideLand = buildInlineDecideLand()

  // empty landed × empty escalated → 'held:nothing-merged'
  const args1 = { landed: [], escalated: [] }
  assert.equal(inlineDecideLand(args1), decideLand(args1),
    'inline decideLand(empty,empty) diverges from canonical')
})

test('drift-guard(F07): inline decideLand — non-empty landed × empty escalated → landed', () => {
  const inlineDecideLand = buildInlineDecideLand()

  const args2 = { landed: ['t1', 't2'], escalated: [] }
  assert.equal(inlineDecideLand(args2), decideLand(args2), 'inline decideLand(landed,empty) diverges')
  assert.equal(inlineDecideLand(args2), 'landed', 'expected "landed"')
})

test('drift-guard(F07): inline decideLand — non-empty landed × escalated with a HARD reason → held:escalation', () => {
  const inlineDecideLand = buildInlineDecideLand()

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
  const inlineDecideLand = buildInlineDecideLand()

  // A SOFT reason (env-blocked is not in HARD_ESCALATION_REASONS) + no landed → held:nothing-merged
  const args = { landed: [], escalated: [{ task: 't1', reason: 'env-blocked' }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand diverges for soft reason "env-blocked"')
  assert.equal(inlineDecideLand(args), 'held:nothing-merged',
    'soft reason with no landed → held:nothing-merged')
})

test('drift-guard(F07): inline decideLand — empty landed × HARD escalation → held:escalation', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // empty-landed × HARD-escalation → held:escalation (not held:nothing-merged)
  const args = { landed: [], escalated: [{ task: 't1', reason: HARD_ESCALATION_REASONS[0] }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand(empty,HARD) diverges from canonical')
  assert.equal(inlineDecideLand(args), 'held:escalation',
    'empty-landed × HARD-escalation must yield held:escalation')
})

test('drift-guard(F07): inline decideLand — non-empty landed × SOFT escalation → landed', () => {
  const inlineDecideLand = buildInlineDecideLand()

  // non-empty-landed × SOFT-escalation → landed (soft escalation does not hold the land)
  const args = { landed: ['t1'], escalated: [{ task: 't2', reason: 'env-blocked' }] }
  assert.equal(inlineDecideLand(args), decideLand(args),
    'inline decideLand(non-empty,SOFT) diverges from canonical')
  assert.equal(inlineDecideLand(args), 'landed',
    'non-empty-landed × SOFT-escalation must yield landed')
})

test('drift-guard(F07): inline HARD_ESCALATION_REASONS equals the canonical export exactly (L1 unify)', () => {
  // L1 (unify): 'unrunnable-deps' is now in land-decision.mjs too — inline and canonical are IDENTICAL
  // (7 members each, no scheduler-local divergence). Exact equality, order-insensitive.
  const herMatch = templateText.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS not found in workflow-template.js')
  const inlineReasons = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.deepEqual([...inlineReasons].sort(), [...HARD_ESCALATION_REASONS].sort(),
    'inline HARD_ESCALATION_REASONS must equal the canonical export exactly (no divergence)')
})

// ---------------------------------------------------------------------------
// Classifying meta-guard (D3): every Keep-in-sync/Mirror-of marker is accounted for
// ---------------------------------------------------------------------------
// Markers are NOT 1:1 with drift tests (anchored by construct, not line number):
//   the combined spawnOpts/validateRoster/widenRoster marker → logic-mirror (1 marker, 3 drift-test families)
//   the landDecision marker → logic-mirror covering landDecision (decideLand)
//   the HARD_ESCALATION_REASONS marker → logic-mirror (same decideLand block)
//   the run.provision data-mirror marker → data-mirror (field names) — allowlisted, no behavioral test
// A marker not in either registry → test fails.

test('meta-guard(F07): all Keep-in-sync/Mirror-of markers in workflow-template.js are classified (logic-mirror registry + data-mirror allowlist)', () => {
  // Scan for every Keep-in-sync / Mirror-of / MIRROR-of marker in the template.
  // Strategy: collect every comment line containing these keywords.
  // NOTE: use a NON-global /i regex in the filter predicate — a /gi regex is stateful
  // (.test() advances lastIndex), causing consecutive matching lines to be silently dropped.
  const markerFilterPattern = /Keep in sync|Mirror of|MIRROR of/i
  const lines = templateText.split('\n')
  const markerLines = lines
    .map((line, idx) => ({ line: line.trim(), lineNum: idx + 1 }))
    .filter(({ line }) => markerFilterPattern.test(line))

  // Registry of LOGIC mirrors → each must have ≥1 registered drift test (keyed by a stable identifier).
  // The identifier is a substring of the marker text (robust to line-number shifts).
  const LOGIC_MIRROR_REGISTRY = new Map([
    // Combined marker: "Mirror of war-config.mjs spawnOpts/validateRoster/widenRoster/resolveWidenSource … Keep in sync"
    // → covered by the spawnOpts + validateRoster + widenRoster + resolveWidenSource drift tests
    ['spawnOpts/validateRoster/widenRoster', ['drift-guard(F07): inline spawnOpts', 'drift-guard(F07): inline validateRoster', 'drift-guard(F07): inline widenRoster', 'drift-guard(F07): inline resolveWidenSource']],
    // Marker: "landDecision mirrors land-decision.mjs (decideLand) … Keep in sync"
    // → covered by decideLand drift tests
    ['landDecision mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
    // Marker: "HARD_ESCALATION_REASONS mirrors land-decision.mjs export … Keep in sync"
    // → covered by the same decideLand drift tests
    ['HARD_ESCALATION_REASONS mirrors', ['drift-guard(F07): inline HARD_ESCALATION_REASONS + decideLand', 'drift-guard(F07): inline decideLand']],
  ])

  // DATA mirrors → allowlisted (field names, no canonical function to behavioral-test).
  const DATA_MIRROR_ALLOWLIST = [
    // Marker: "This is a MIRROR of war-config.mjs's run.provision/run.provisionSource reads".
    // 'This is a MIRROR of' is the marker's exact lead-in (the marker line ends there; the field
    // tokens sit on the following line). The meta-guard scans line-by-line, so the lead-in
    // fragment needs this anchored entry.
    'This is a MIRROR of',
    'run.provision/run.provisionSource',
    'provisionSource reads',
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

  // Second half of the meta-guard: verify that every drift test NAME registered in
  // LOGIC_MIRROR_REGISTRY's VALUES actually EXISTS in this test file.
  //
  // Without this, the registry values are decorative — deleting a drift test while
  // leaving the template marker + registry entry intact would keep the first assertion
  // green (marker is classified) while the behavioral coverage is silently gone.
  //
  // Strategy: read this test file's own source and check each registered name string
  // appears as a literal `test('<name>` or `test("<name>` substring.
  const thisFileText = readFileSync(fileURLToPath(import.meta.url), 'utf8')

  const missingDriftTests = []
  for (const [key, testNames] of LOGIC_MIRROR_REGISTRY) {
    for (const testName of testNames) {
      // A test definition looks like: test('drift-guard(F07): inline spawnOpts...')
      // We check for test('<testName> (starts-with match, robust to varying suffixes).
      const singleQuote = `test('${testName}`
      const doubleQuote = `test("${testName}`
      if (!thisFileText.includes(singleQuote) && !thisFileText.includes(doubleQuote)) {
        missingDriftTests.push({ key, testName })
      }
    }
  }

  assert.deepEqual(
    missingDriftTests,
    [],
    `LOGIC_MIRROR_REGISTRY references drift-test names that do not exist in this test file.\n` +
    `A registered test name must appear as a literal test('<name>...) definition.\n` +
    `Deleting a drift test without removing it from LOGIC_MIRROR_REGISTRY is not allowed.\n` +
    `Missing drift tests:\n` +
    missingDriftTests.map(m => `  registry key "${m.key}" → test name "${m.testName}"`).join('\n')
  )

  // Exact-membership assertions for DATA_MIRROR_ALLOWLIST (T1.6):
  // The bare catch-all 'MIRROR of' has been replaced with the anchored 'This is a MIRROR of'.
  assert.ok(!DATA_MIRROR_ALLOWLIST.includes('MIRROR of'),
    "DATA_MIRROR_ALLOWLIST must not contain the bare catch-all 'MIRROR of' (use 'This is a MIRROR of' instead)")
  assert.ok(DATA_MIRROR_ALLOWLIST.includes('This is a MIRROR of'),
    "DATA_MIRROR_ALLOWLIST must contain the anchored entry 'This is a MIRROR of'")
})

test('meta-guard(F07): sanity — exactly 4 Keep-in-sync/Mirror-of markers exist (run.provision data mirror; spawnOpts/validateRoster/widenRoster; landDecision; HARD_ESCALATION_REASONS)', () => {
  // This test guards against silent marker addition (a new mirror that skips the registry).
  // Anchored by construct, not line number. If you add a new mirror, update BOTH the
  // registry/allowlist above AND bump this count.
  const count = templateText.split('\n').filter(line => /Keep in sync|Mirror of|MIRROR of/i.test(line)).length
  assert.equal(count, 4,
    `Expected exactly 4 Keep-in-sync/Mirror-of marker lines in workflow-template.js, found ${count}.\n` +
    `If you added a new mirror, register it in the LOGIC_MIRROR_REGISTRY or DATA_MIRROR_ALLOWLIST and bump this count.`
  )
})
