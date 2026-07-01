// Canonical schema, defaults, presets, and validation for a WAR run config
// (.claude/war/config.json). Pure ESM, no deps. Used by:
//   • /war-room  (producer): `--preset <name>`, and `--stdin --fill-defaults` to validate+resolve before writing
//   • /war Lead  (consumer): `<path> --fill-defaults` to resolve a file, then thread into Workflow args
// The Workflow sandbox cannot import this module, so workflow-template.js mirrors
// spawnOpts/covenSeats inline — THIS module is the tested source of truth; keep them in sync.

import { validateProvision } from '../../_shared/provision.mjs'

export const MODELS = ['opus', 'sonnet', 'haiku', 'fable']
export const EFFORTS = ['default', 'low', 'medium', 'high', 'xhigh', 'max']
export const COVEN_POLICIES = ['auto', 'all', 'solo']
export const ROLES = ['worker', 'auditor', 'refiner', 'servitor']
// How a run's provision list was derived. 'explicit' = pinned by the user;
// 'manifest'/'ci'/'onboarding'/'structural' = scouted (descending authority);
// 'none' = no steps / not yet scouted. See provisioning Part-B plan.
export const PROVISION_SOURCES = ['explicit', 'manifest', 'ci', 'onboarding', 'structural', 'none']

export const DEFAULTS = {
  version: 1,
  profile: 'balanced',
  agents: {
    worker:   { model: 'sonnet', effort: 'default' },
    auditor:  { model: 'opus',   effort: 'default' },
    refiner:  { model: 'sonnet', effort: 'default' },
    servitor: { model: 'sonnet', effort: 'default' },
  },
  audit: {
    covenSize: 3,
    lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'],
    covenPolicy: 'all',
    autoEscalate: true,
  },
  run: { roundLimit: 3, afk: false, ace: false, provision: [], provisionSource: 'none', provisionAuto: true },
  overrides: { gate: null, workingBranch: null, landingBranch: null, learningsTarget: null },
}

// Presets are partials, deep-merged over DEFAULTS by presetConfig().
export const PRESETS = {
  balanced: { profile: 'balanced' },
  thorough: {
    profile: 'thorough',
    agents: { worker: { model: 'opus', effort: 'max' }, auditor: { model: 'opus', effort: 'high' } },
    audit: { covenPolicy: 'all' },
  },
  economy: {
    profile: 'economy',
    agents: { worker: { model: 'sonnet', effort: 'default' }, auditor: { model: 'sonnet', effort: 'default' } },
    audit: { covenPolicy: 'solo' },
    run: { roundLimit: 2 },
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
  for (const role of Object.keys(c.agents)) {
    if (!ROLES.includes(role)) errors.push(`agents.${role} is not a known role (${ROLES.join('|')})`)
  }

  const au = c.audit
  if (!Number.isInteger(au.covenSize) || au.covenSize < 1) errors.push(`audit.covenSize must be an integer >= 1 (got ${JSON.stringify(au.covenSize)})`)
  if (!Array.isArray(au.lenses) || au.lenses.length < 1 || !au.lenses.every(l => typeof l === 'string' && l)) errors.push('audit.lenses must be a non-empty array of strings')
  if (!COVEN_POLICIES.includes(au.covenPolicy)) errors.push(`audit.covenPolicy must be one of ${COVEN_POLICIES.join('|')} (got ${JSON.stringify(au.covenPolicy)})`)
  if (typeof au.autoEscalate !== 'boolean') errors.push('audit.autoEscalate must be a boolean')

  if (!Number.isInteger(c.run.roundLimit) || c.run.roundLimit < 1) errors.push(`run.roundLimit must be an integer >= 1 (got ${JSON.stringify(c.run.roundLimit)})`)
  if (typeof c.run.afk !== 'boolean') errors.push('run.afk must be a boolean')
  if (typeof c.run.ace !== 'boolean') errors.push('run.ace must be a boolean')
  // run.provision is validated by the shared primitive (array of non-empty strings; [] is valid).
  for (const e of validateProvision(c.run.provision).errors) errors.push(`run.${e}`)
  if (!PROVISION_SOURCES.includes(c.run.provisionSource)) errors.push(`run.provisionSource must be one of ${PROVISION_SOURCES.join('|')} (got ${JSON.stringify(c.run.provisionSource)})`)
  if (typeof c.run.provisionAuto !== 'boolean') errors.push('run.provisionAuto must be a boolean')

  for (const k of Object.keys(c.overrides)) {
    const v = c.overrides[k]
    if (v !== null && typeof v !== 'string') errors.push(`overrides.${k} must be null or a string`)
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

// Lenses for a task's audit round: one seat unless task.coven, then covenSize seats
// rotating through the task's lenses. MIRRORED inline in workflow-template.js. Keep in sync.
export function covenSeats(config, task) {
  const lenses = task.lenses && task.lenses.length ? task.lenses : DEFAULTS.audit.lenses
  if (!task.coven) return [lenses[0]]
  const size = (config.audit && config.audit.covenSize) || lenses.length
  return Array.from({ length: size }, (_, i) => lenses[i % lenses.length])
}

// Self-discovering multi-runner gate (F12).
// Given the declared base command (e.g. `node --test 'skills/**/*.test.mjs'`), returns
// a portable shell string that runs the declared gate AND discovers + runs every *.test.sh
// found in the repo tree (excluding node_modules and .git). The bash suites are sorted and
// executed in order; any non-zero exit aborts immediately (|| exit 1).
// Empty/null/falsy declaredGate → the discovery clause ALONE (no leading &&).
export function resolveGate(declaredGate) {
  const discovery = [
    `for f in $(find . -type f -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort);`,
    `do printf '\\n== gate(bash): %s ==\\n' "$f" && bash "$f" || exit 1; done`,
  ].join(' ')
  if (!declaredGate) return discovery
  return `${declaredGate} && ${discovery}`
}

// --- CLI ---------------------------------------------------------------------
// node war-config.mjs --preset <name>            -> print a filled preset config (stdout)
// node war-config.mjs <path>   [--fill-defaults] -> validate a file; print filled config or "valid"
// node war-config.mjs --stdin  [--fill-defaults] -> validate JSON from stdin; same output
// exit 0 = valid; exit 1 = invalid (errors on stderr) or usage error
async function main(argv) {
  const args = argv.slice(2)
  const has = f => args.includes(f)
  const valOf = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }

  if (has('--help') || args.length === 0) {
    process.stdout.write('usage: war-config.mjs (--preset <name> | <path> | --stdin) [--fill-defaults]\n')
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
