// Canonical schema, defaults, presets, and validation for a WAR run config
// (.claude/war/config.json). Pure ESM, no deps. Used by:
//   • /war-room  (producer): `--preset <name>`, and `--stdin --fill-defaults` to validate+resolve before writing
//   • /war Lead  (consumer): `<path> --fill-defaults` to resolve a file, then thread into Workflow args
// The Workflow sandbox cannot import this module, so workflow-template.js mirrors
// spawnOpts/validateRoster/widenRoster/resolveWidenSource inline — THIS module is the tested source of truth; keep them in sync.

import { validateProvision } from '../../_shared/provision.mjs'

export const MODELS = ['opus', 'sonnet', 'haiku', 'fable']
export const EFFORTS = ['default', 'low', 'medium', 'high', 'xhigh', 'max']
export const ROSTER_POLICIES = ['auto', 'all', 'solo']
// Lenses reserved for built-in passes — never roster-selectable, never a valid widen nomination (D4).
// (execution-evidence = post-merge gate-audit pass; pin-validity = gitlink-bump pre-flight.)
export const RESERVED_LENSES = ['execution-evidence', 'pin-validity']
export const ROLES = ['worker', 'auditor', 'refiner', 'servitor']
// How a run's provision list was derived. 'explicit' = pinned by the user;
// 'manifest'/'ci'/'onboarding'/'structural' = scouted (descending authority);
// 'none' = no steps / not yet scouted. See provisioning Part-B plan.
export const PROVISION_SOURCES = ['explicit', 'manifest', 'ci', 'onboarding', 'structural', 'none']

export const DEFAULTS = {
  version: 1,
  profile: 'balanced',
  agents: {
    // worker.docs: the tier that dispatches all-*.md tasks (defaults sonnet everywhere). worker.fix
    // (fix-round + --ace tier) defaults to a fast, cheap follow-up tier (fable/high) — the balanced
    // profile's value, which thorough/economy override; a config may still override it per-run.
    worker:   { model: 'opus',   effort: 'max', docs: { model: 'sonnet', effort: 'default' }, fix: { model: 'fable', effort: 'high' } },
    auditor:  { model: 'opus',   effort: 'xhigh' },
    refiner:  { model: 'sonnet', effort: 'default' },
    servitor: { model: 'sonnet', effort: 'high' },
    // redteam: the model/effort /red-team threads (fail-open) into its probe + adversarial-confirm
    // sub-agents. NOT a phase role (never in ROLES/agentMatrix); the balanced default is opus/max,
    // overridden by thorough/economy. Consumed only when /red-team runs against this repo.
    redteam:  { model: 'opus',   effort: 'max' },
  },
  audit: {
    roster: [
      { lens: 'correctness', depth: 'deep' },
      { lens: 'cascading-impact', depth: 'deep' },
      { lens: 'plan-faithfulness', depth: 'deep' },
    ],
    rosterPolicy: 'auto',
    autoEscalate: true,
  },
  run: { roundLimit: 3, afk: false, ace: true, provision: [], provisionSource: 'none', provisionAuto: true },
  // Compounding-memory retrieval + publication (spec 2026-07-03). retrieval: Lead prefetches
  // per-seat lesson blocks; topK: max lessons per block; commitLearnings: write the repo-root
  // docs/learnings/ lessons (default OFF — a conscious opt-in via /war-room; when on, published
  // lessons are lint-scrubbed and ride each phase PR, human-reviewed like code; all presets inherit off).
  memory: { retrieval: true, topK: 10, commitLearnings: false },
  // overrides.testPattern: the run's pinned test-floor glob set (space-separated glob tokens) | null.
  // null ⇒ today's hardcoded gate-mirror floor defaults, byte-identical. Floor ⊆ gate is ONE Setup
  // decision (ADR 0006): testPattern is pinned TOGETHER with the gate, and the floor always unions the
  // gate's unconditional *.test.sh discovery — so no custom pattern can make the floor exceed the gate.
  // overrides.ghUser: the personal `gh` account gh-preflight.sh asserts is active before every gh write
  // batch (multi-account machines) | null. Ships null — no real handle in any committed file (C1); it lives
  // in the local .claude/war/config.json. Validated as string|null by the generic overrides loop below.
  overrides: { gate: null, workingBranch: null, landingBranch: null, learningsTarget: null, testPattern: null, ghUser: null },
}

// Presets are partials, deep-merged over DEFAULTS by presetConfig().
export const PRESETS = {
  balanced: { profile: 'balanced' },
  thorough: {
    profile: 'thorough',
    agents: {
      worker:   { model: 'fable', effort: 'max', fix: { model: 'fable', effort: 'max' } },
      auditor:  { model: 'opus',  effort: 'max' },
      servitor: { model: 'opus',  effort: 'default' },
      redteam:  { model: 'fable', effort: 'xhigh' },
    },
    // 5-lens pool: under rosterPolicy 'auto' the Lead seeds 1–5 seats per task from it.
    audit: {
      roster: [
        { lens: 'correctness', depth: 'deep' },
        { lens: 'cascading-impact', depth: 'deep' },
        { lens: 'plan-faithfulness', depth: 'deep' },
        { lens: 'security', depth: 'deep' },
        { lens: 'test-fidelity', depth: 'deep' },
      ],
    },
  },
  economy: {
    profile: 'economy',
    // Pins every knob that drifted from DEFAULTS so economy's effective config stays what it always was.
    agents: {
      worker:   { model: 'sonnet', effort: 'default', fix: { model: 'opus', effort: 'default' } },
      auditor:  { model: 'sonnet', effort: 'default' },
      servitor: { model: 'sonnet', effort: 'default' },
      redteam:  { model: 'sonnet', effort: 'max' },
    },
    audit: { rosterPolicy: 'solo' },
    run: { roundLimit: 2, ace: false },
    // (memory.commitLearnings is no longer pinned — DEFAULTS is now false, so economy inherits off.)
  },
}

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)

export function deepMerge(base, over) {
  if (!isObj(over)) return over === undefined ? base : over
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const k of Object.keys(over)) {
    out[k] = isObj(over[k]) && isObj(out[k]) ? deepMerge(out[k], over[k]) : over[k]
  }
  return out
}

export function fillDefaults(partial = {}) {
  return deepMerge(DEFAULTS, partial)
}

export function presetConfig(name) {
  if (!PRESETS[name]) throw new Error(`unknown preset "${name}" (have: ${Object.keys(PRESETS).join(', ')})`)
  return fillDefaults(PRESETS[name])
}

// Enumerated (preset, role, model, effort) matrix (D6) — one row per (preset × role), each row the
// EFFECTIVE model/effort after DEFAULTS.agents is deep-merged with that preset's agents partial.
// Reuses presetConfig()'s merge (never re-implements it) and iterates the live PRESETS/ROLES, so a new
// preset or role is automatically enumerated. This is the single watched surface binding these
// (preset, role) → (model, effort) facts to their canonical source; the doc-honesty audit lens consults
// it, and war-config.test.mjs proves the coverage is total (ADR 0025 drift-guard discipline).
export function agentMatrix() {
  return Object.keys(PRESETS).flatMap(preset => {
    const { agents } = presetConfig(preset)
    return ROLES.map(role => ({ preset, role, model: agents[role].model, effort: agents[role].effort }))
  })
}

// Enumerated (preset, tier, model, effort) worker-tier matrix — the worker-role sibling of
// agentMatrix() (ADR 0025 drift-guard discipline). One row per (preset × PRESENT worker tier):
// 'base' (the worker role's own model/effort), 'docs' (defaulted in DEFAULTS — the all-*.md tier),
// and 'fix' (the fix-round + --ace tier — now defaulted in DEFAULTS too, so every preset emits a fix
// row). Reuses presetConfig()'s merge and iterates the live PRESETS, so a new preset or tier is
// enumerated automatically. The doc-honesty lens consults it to prove documented tier defaults (e.g.
// docs=sonnet everywhere, fix=fable/high on balanced) match this canonical source, not a hand-copied literal.
export function workerTierMatrix() {
  return Object.keys(PRESETS).flatMap(preset => {
    const w = presetConfig(preset).agents.worker
    // base + docs are always effective (both defaulted in DEFAULTS); fix is likewise defaulted in
    // DEFAULTS now, so every preset emits a fix row. The push stays guarded on isObj(w.fix), so a
    // hand-written config that drops the fix tier simply omits its row (never a fabricated tautology).
    const tiers = [['base', w], ['docs', w.docs]]
    if (isObj(w.fix)) tiers.push(['fix', w.fix])
    return tiers.map(([tier, block]) => ({ preset, tier, model: block.model, effort: block.effort }))
  })
}

// Validate an optional agent tier block { model, effort } — model/effort must be in the role enums
// and no unknown sub-keys (the memory.* unknown-key precedent, so a typo never runs silently). Used
// for agents.redteam and the agents.worker.docs/fix tiers: validated exactly like a phase role, but
// none of them is itself a ROLE (redteam feeds /red-team; the tiers refine worker dispatch).
function validateAgentTier(block, path, errors) {
  if (!isObj(block)) { errors.push(`${path} must be an object { model, effort }`); return }
  if (!MODELS.includes(block.model)) errors.push(`${path}.model must be one of ${MODELS.join('|')} (got ${JSON.stringify(block.model)})`)
  if (!EFFORTS.includes(block.effort)) errors.push(`${path}.effort must be one of ${EFFORTS.join('|')} (got ${JSON.stringify(block.effort)})`)
  for (const k of Object.keys(block)) {
    if (k !== 'model' && k !== 'effort') errors.push(`${path}.${k} is not a known key (model|effort) — run /war-room to regenerate the config`)
  }
}

// Validate the *effective* (filled) config. Returns { valid, errors:[string] }.
export function validate(input) {
  const errors = []
  const c = fillDefaults(input)
  if (c.version !== 1) errors.push(`version must be 1 (got ${JSON.stringify(c.version)})`)

  for (const role of ROLES) {
    const a = c.agents[role]
    if (!isObj(a)) { errors.push(`agents.${role} missing`); continue }
    if (!MODELS.includes(a.model)) errors.push(`agents.${role}.model must be one of ${MODELS.join('|')} (got ${JSON.stringify(a.model)})`)
    if (!EFFORTS.includes(a.effort)) errors.push(`agents.${role}.effort must be one of ${EFFORTS.join('|')} (got ${JSON.stringify(a.effort)})`)
  }
  // Worker tiers: agents.worker.docs (all-*.md dispatch tier) and agents.worker.fix (fix-round + --ace
  // tier) — both defaulted in DEFAULTS. Each a { model, effort } tier validated like a role when present
  // (unknown sub-keys rejected); a hand-written config may still omit either, which validates fine.
  const worker = c.agents.worker
  if (isObj(worker)) {
    if (Object.prototype.hasOwnProperty.call(worker, 'docs')) validateAgentTier(worker.docs, 'agents.worker.docs', errors)
    if (Object.prototype.hasOwnProperty.call(worker, 'fix')) validateAgentTier(worker.fix, 'agents.worker.fix', errors)
  }
  // agents.redteam — a { model, effort } tier validated like a role when present, but NOT a phase ROLE:
  // it joins validation only (/red-team consumes it fail-open; the per-phase spawn path never does, and
  // agentMatrix stays four roles). Defaulted in DEFAULTS (balanced opus/max, preset-overridden); a config
  // that omits it still validates and red-team then inherits the session.
  if (Object.prototype.hasOwnProperty.call(c.agents, 'redteam')) validateAgentTier(c.agents.redteam, 'agents.redteam', errors)
  const KNOWN_AGENT_KEYS = [...ROLES, 'redteam']
  for (const key of Object.keys(c.agents)) {
    if (!KNOWN_AGENT_KEYS.includes(key)) errors.push(`agents.${key} is not a known agent key (${KNOWN_AGENT_KEYS.join('|')}) — run /war-room to regenerate the config`)
  }

  const au = c.audit
  // D3 courtesy errors: legacy keys survive fillDefaults (deepMerge keeps unknown keys), so detect
  // them on c.audit directly. Crisp validation errors ARE the migration — no shims, no ignored keys.
  if (Object.prototype.hasOwnProperty.call(au, 'covenSize')) errors.push('audit.covenSize was removed (seat count = roster length) — run /war-room to regenerate the config')
  if (Object.prototype.hasOwnProperty.call(au, 'lenses')) errors.push('audit.lenses was removed (lenses live on audit.roster seats) — run /war-room to regenerate the config')
  if (Object.prototype.hasOwnProperty.call(au, 'covenPolicy')) errors.push('audit.covenPolicy was renamed to audit.rosterPolicy — run /war-room to regenerate the config')
  for (const e of validateRoster(au.roster).errors) errors.push(`audit.${e}`)
  if (!ROSTER_POLICIES.includes(au.rosterPolicy)) errors.push(`audit.rosterPolicy must be one of ${ROSTER_POLICIES.join('|')} (got ${JSON.stringify(au.rosterPolicy)})`)
  if (typeof au.autoEscalate !== 'boolean') errors.push('audit.autoEscalate must be a boolean')

  if (!Number.isInteger(c.run.roundLimit) || c.run.roundLimit < 1) errors.push(`run.roundLimit must be an integer >= 1 (got ${JSON.stringify(c.run.roundLimit)})`)
  if (typeof c.run.afk !== 'boolean') errors.push('run.afk must be a boolean')
  if (typeof c.run.ace !== 'boolean') errors.push('run.ace must be a boolean')
  // run.provision is validated by the shared primitive (array of non-empty strings; [] is valid).
  for (const e of validateProvision(c.run.provision).errors) errors.push(`run.${e}`)
  if (!PROVISION_SOURCES.includes(c.run.provisionSource)) errors.push(`run.provisionSource must be one of ${PROVISION_SOURCES.join('|')} (got ${JSON.stringify(c.run.provisionSource)})`)
  if (typeof c.run.provisionAuto !== 'boolean') errors.push('run.provisionAuto must be a boolean')

  const mem = c.memory
  if (!isObj(mem)) { errors.push('memory must be an object') }
  else {
    if (typeof mem.retrieval !== 'boolean') errors.push('memory.retrieval must be a boolean')
    if (!Number.isInteger(mem.topK) || mem.topK < 1) errors.push(`memory.topK must be an integer >= 1 (got ${JSON.stringify(mem.topK)})`)
    if (typeof mem.commitLearnings !== 'boolean') errors.push('memory.commitLearnings must be a boolean')
    // No accepted-but-ignored keys: an unknown memory key is a config error, not silently kept.
    for (const k of Object.keys(mem)) {
      if (!['retrieval', 'topK', 'commitLearnings'].includes(k)) errors.push(`memory.${k} is not a known key (retrieval|topK|commitLearnings) — run /war-room to regenerate the config`)
    }
  }

  // Overrides: known keys only (a courtesy error on typos like `testPatern` — the memory.* precedent,
  // so a mistyped key never silently runs the bare floor), each null or a string. testPattern carries two
  // extra checks. (1) glob-safe charset: its value is embedded single-quoted into an agent-executed shell
  // line (assert-test-in-diff.sh --pattern), so any char outside [A-Za-z0-9_.*?/[] -] — notably a quote,
  // ';', backtick, '$', or newline — could break out of the quoting, and an empty string is not usable.
  // (2) per space-separated token, a glob-SHAPE check against two forms that mis-match under the floor's
  // `case`-fnmatch: a `**/` token (fnmatch `*` already crosses `/`, so `**/` is not recursive descent — the
  // depth-agnostic form is a bare `*.ext` suffix; prefix conventions use the `pre_* */pre_*` root+nested
  // pair, per the case-glob-star lesson) and a `*<word>*` substring shape whose word is unbounded by `.`/`/`
  // (`*test_*` over-matches `latest_results.py`; anchor as `test_*.py` or `*/test_*.py`). Shape checks run
  // only on the clean charset — they are correctness footguns, not injection.
  const KNOWN_OVERRIDES = ['gate', 'workingBranch', 'landingBranch', 'learningsTarget', 'testPattern', 'ghUser']
  const GLOB_UNSAFE = /[^A-Za-z0-9_.*?\/ \[\]-]/
  // Non-object guard mirrors the memory.* block above: a hand-edited `overrides: null`/`overrides: 'x'`
  // would otherwise throw a raw TypeError at Object.keys() instead of a named validation error.
  if (!isObj(c.overrides)) { errors.push('overrides must be an object') }
  else for (const k of Object.keys(c.overrides)) {
    const v = c.overrides[k]
    if (!KNOWN_OVERRIDES.includes(k)) { errors.push(`overrides.${k} is not a known key (${KNOWN_OVERRIDES.join('|')}) — run /war-room to regenerate the config`); continue }
    if (v !== null && typeof v !== 'string') { errors.push(`overrides.${k} must be null or a string`); continue }
    if (k === 'testPattern' && typeof v === 'string') {
      if (v === '' || GLOB_UNSAFE.test(v))
        errors.push(`overrides.testPattern must be a non-empty glob-safe string (only [A-Za-z0-9_.*?/[] -]; no quotes, ';', backticks, '$', or newlines) — it is embedded into an agent-executed shell command`)
      else for (const tok of v.split(/\s+/).filter(Boolean)) {
        if (tok.includes('**/'))
          errors.push(`overrides.testPattern token '${tok}' contains '**/', which mis-globs under the floor's case-fnmatch ('*' already crosses '/') — use a bare '*.ext' suffix for depth-agnostic match, or the 'pre_* */pre_*' root+nested pair for a prefix convention`)
        else if (/\*[A-Za-z0-9_]+\*/.test(tok))
          errors.push(`overrides.testPattern token '${tok}' is a '*word*' substring shape that over-matches (e.g. '*test_*' also matches 'latest_results.py') — bound the word with '.'/'/' (e.g. 'test_*.py' or '*/test_*.py')`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}

// Spawn opts for a role: model always; effort only when non-default (omitted = inherit session).
// MIRRORED inline in workflow-template.js. Keep in sync.
export function spawnOpts(config, role) {
  const a = (config.agents || {})[role] || {}
  const model = a.model || DEFAULTS.agents[role].model
  const effort = a.effort || 'default'
  return effort === 'default' ? { model } : { model, effort }
}

// Resolve the provisioning intent for war-room Setup: decide whether the setup-scout
// must run, without doing any scouting here (the scout is an agent; this is pure config).
// Returns { provision: string[], source: string, scout: boolean }:
//   • explicit non-empty run.provision → returned VERBATIM, run.provisionSource carried
//     through unchanged, scout:false (explicit operator intent is honored, never re-scouted);
//   • empty list + provisionAuto true   → { provision: [], source: 'none', scout: true }
//     (signals Setup to run the scout, present its proposal, and pin the confirmed list);
//   • empty list + provisionAuto false  → { provision: [], source: 'none', scout: false }
//     (auto off → no scout, no steps).
// Operates on a filled config; reads only config.run.
export function resolveProvision(config) {
  const run = (config && config.run) || {}
  const provision = Array.isArray(run.provision) ? run.provision : []
  if (provision.length > 0) {
    // Explicit intent: verbatim list, source unchanged, no scout.
    return { provision, source: run.provisionSource || 'explicit', scout: false }
  }
  // Empty list: scout only when provisionAuto is on.
  return { provision: [], source: 'none', scout: run.provisionAuto === true }
}

// Roster validation (D8): a roster is an array of 1–5 seats; each seat an object with a
// non-empty string lens; depth absent or one of neighbors|deep; lenses distinct.
// Returns { valid, errors: [string] }. MIRRORED inline in workflow-template.js. Keep in sync.
export function validateRoster(roster) {
  const errors = []
  if (!Array.isArray(roster) || roster.length < 1 || roster.length > 5) {
    errors.push(`roster must be an array of 1-5 seats (got ${JSON.stringify(roster)})`)
    return { valid: false, errors }
  }
  const seen = []
  roster.forEach((seat, i) => {
    if (seat === null || typeof seat !== 'object' || Array.isArray(seat)) { errors.push(`roster[${i}] must be an object { lens, depth? }`); return }
    if (typeof seat.lens !== 'string' || !seat.lens) errors.push(`roster[${i}].lens must be a non-empty string`)
    else if (seen.includes(seat.lens)) errors.push(`roster[${i}].lens "${seat.lens}" duplicates an earlier seat (lenses must be distinct)`)
    else seen.push(seat.lens)
    if (seat.depth !== undefined && seat.depth !== 'neighbors' && seat.depth !== 'deep') errors.push(`roster[${i}].depth must be "neighbors" or "deep" when present (got ${JSON.stringify(seat.depth)})`)
  })
  return { valid: errors.length === 0, errors }
}

// Lone-seat auto-escalation union (D5): keep the existing seats, append default entries whose
// lenses are absent (at their configured depths), cap 5 — union, never replacement, so the Lead's
// chosen lens is never discarded. MIRRORED inline in workflow-template.js. Keep in sync.
export function widenRoster(roster, defaultRoster) {
  const out = [...roster]
  for (const seat of defaultRoster || []) {
    if (out.length >= 5) break
    if (!out.some(s => s.lens === seat.lens)) out.push(seat)
  }
  return out
}

// Lone-seat widening SOURCE (D4): pick the seats a triggered lone seat widens toward. A valid auditor
// nomination is a non-empty array of DISTINCT, non-empty strings, NONE reserved — strict whole-field
// (any bad entry rejects the whole nomination, no per-entry salvage). Valid → seats from the nominated
// lenses @ deep, source 'nominated'; anything else → defaultRoster verbatim, source 'default' (the
// byte-identical trio-union fallback). The returned seats feed widenRoster (which keeps the lone seat,
// dedupes, caps 5), so a nomination naming the seat's own lens is legal. MIRRORED inline in
// workflow-template.js. Keep in sync.
export function resolveWidenSource(nominated, defaultRoster) {
  const valid = Array.isArray(nominated) && nominated.length > 0 &&
    nominated.every(l => typeof l === 'string' && l.length > 0 && !RESERVED_LENSES.includes(l)) &&
    new Set(nominated).size === nominated.length
  return valid
    ? { source: 'nominated', seats: nominated.map(lens => ({ lens, depth: 'deep' })) }
    : { source: 'default', seats: defaultRoster }
}

// Self-discovering multi-runner gate (F12).
// Given the declared base command (e.g. `node --test 'skills/**/*.test.mjs'`), returns
// a portable shell string that runs the declared gate AND discovers + runs every *.test.sh
// found in the repo tree (excluding node_modules, .git, and .claude). The bash suites are
// sorted and executed in order; any non-zero exit aborts immediately (|| exit 1).
// The .claude/ exclusion keeps a repo-root gate run from executing the ~100 stale duplicate
// suites under .claude/worktrees/ (WAR's own task worktrees).
// Empty/null/falsy declaredGate → the discovery clause ALONE (no leading &&).
export function resolveGate(declaredGate) {
  const discovery = [
    `for f in $(find . -type f -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/*' | sort);`,
    `do printf '\\n== gate(bash): %s ==\\n' "$f" && bash "$f" || exit 1; done`,
  ].join(' ')
  if (!declaredGate) return discovery
  return `${declaredGate} && ${discovery}`
}

// --- CLI ---------------------------------------------------------------------
// node war-config.mjs --preset <name>            -> print a filled preset config (stdout)
// node war-config.mjs --resolve-gate <cmd>       -> print the self-discovering gate string
// node war-config.mjs <path>   [--fill-defaults] -> validate a file; print filled config or "valid"
// node war-config.mjs --stdin  [--fill-defaults] -> validate JSON from stdin; same output
// exit 0 = valid; exit 1 = invalid (errors on stderr) or usage error
async function main(argv) {
  const args = argv.slice(2)
  const has = f => args.includes(f)
  const valOf = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }

  if (has('--help') || args.length === 0) {
    process.stdout.write('usage: war-config.mjs (--preset <name> | <path> | --stdin | --resolve-gate <cmd>) [--fill-defaults]\n')
    process.exit(args.length === 0 ? 1 : 0)
  }

  if (has('--resolve-gate')) {
    const cmd = valOf('--resolve-gate') ?? ''
    process.stdout.write(resolveGate(cmd) + '\n')
    process.exit(0)
  }

  if (has('--preset')) {
    try { process.stdout.write(JSON.stringify(presetConfig(valOf('--preset')), null, 2) + '\n'); process.exit(0) }
    catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
  }

  let raw
  if (has('--stdin')) {
    raw = await new Promise((res, rej) => {
      let d = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', c => { d += c })
      process.stdin.on('end', () => res(d))
      process.stdin.on('error', rej)
    })
  } else {
    const path = args.find(a => !a.startsWith('--'))
    if (!path) { process.stderr.write('no config path given\n'); process.exit(1) }
    const { readFileSync } = await import('node:fs')
    try { raw = readFileSync(path, 'utf8') }
    catch (e) { process.stderr.write(`cannot read ${path}: ${e.message}\n`); process.exit(1) }
  }

  let parsed
  try { parsed = JSON.parse(raw) }
  catch (e) { process.stderr.write(`invalid JSON: ${e.message}\n`); process.exit(1) }

  const { valid, errors } = validate(parsed)
  if (!valid) { process.stderr.write('invalid config:\n' + errors.map(e => '  - ' + e).join('\n') + '\n'); process.exit(1) }
  process.stdout.write(has('--fill-defaults') ? JSON.stringify(fillDefaults(parsed), null, 2) + '\n' : 'valid\n')
  process.exit(0)
}

// Run as CLI only when invoked directly (not when imported by the test).
import { fileURLToPath } from 'node:url'
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv)
}
