// /snipe argument parsing + seat/lens reconciliation + seat-tier resolution (#1920).
// Pure ESM, no deps. Used by the /snipe SKILL as a CLI:
//   node snipe-args.mjs '<raw arg string>' [--config <path to .claude/war/config.json>]
// Prints one JSON object: { target, seats, named, autoCount, tier, errors }.
// Always exits 0 — the Lead refuses to spawn when `errors` is non-empty.
//
// Grammar (trailing, order-tolerant between the two arg tokens):
//   /snipe [<target>] [<seats 1-5>] [<lens[,lens...]>]
// A bare single word with no comma counts as a lens only when it is `auto` or a catalog
// lens — anything else (a ref, a path, `master`) is target text. A comma-bearing token is
// always a lens list (novel lens words allowed there, same as a hand-written roster).
// `auto` entries are seats the Lead picks itself. Effective seats =
// min(5, max(<seats>, lens-token count, 1)); autoCount = effective - named count.

import { RESERVED_LENSES, MODELS, EFFORTS, fillDefaults } from '../../war/assets/war-config.mjs'

// Parse-time catalog for the bare-single-word case only — comma lists accept novel lenses.
// Union of the preset roster pools; keep in sync when a preset introduces a new lens.
export const SNIPE_LENS_CATALOG = [
  'correctness', 'cascading-impact', 'plan-faithfulness', 'simplicity',
  'performance', 'security', 'test-fidelity',
]

const LENS_LIST = /^[a-z][a-z0-9-]*(,[a-z][a-z0-9-]*)+$/
const LENS_WORD = /^[a-z][a-z0-9-]*$/

export function parseSnipeArgs(raw = '') {
  const errors = []
  const tokens = String(raw).trim().split(/\s+/).filter(Boolean)

  let seatsToken = null
  let lensToken = null
  // Peel up to two arg tokens off the tail, order-tolerant; stop at the first non-arg token.
  while (tokens.length > 0 && (seatsToken === null || lensToken === null)) {
    const t = tokens[tokens.length - 1]
    if (seatsToken === null && /^\d+$/.test(t)) { seatsToken = t; tokens.pop(); continue }
    const isLens = LENS_LIST.test(t) || (LENS_WORD.test(t) && (t === 'auto' || SNIPE_LENS_CATALOG.includes(t)))
    if (lensToken === null && isLens) { lensToken = t; tokens.pop(); continue }
    break
  }
  const target = tokens.join(' ')

  let requested = null
  if (seatsToken !== null) {
    requested = Number(seatsToken)
    if (requested < 1 || requested > 5) errors.push(`seat count must be 1-5 (got ${requested})`)
  }

  const lensEntries = lensToken === null ? ['auto'] : lensToken.split(',').filter(Boolean)
  const named = lensEntries.filter(l => l !== 'auto')
  for (const l of named) {
    if (RESERVED_LENSES.includes(l)) errors.push(`lens '${l}' is reserved for built-in passes (${RESERVED_LENSES.join('|')}) — not snipe-selectable`)
  }
  const dupes = named.filter((l, i) => named.indexOf(l) !== i)
  for (const d of [...new Set(dupes)]) errors.push(`lens '${d}' appears more than once — seats take distinct lenses`)
  if (named.length > 5) errors.push(`at most 5 named lenses (got ${named.length})`)

  const seats = Math.min(5, Math.max(requested ?? 0, lensEntries.length, 1))
  return { target, seats, named, autoCount: Math.max(0, seats - named.length), errors }
}

// Seat model/effort ladder (#1920, operator requirement): agents.snipe when present, else
// agents.auditor, else DEFAULTS (fillDefaults supplies it). Returned in spawnOpts shape:
// effort 'default' is omitted (= inherit session), mirroring war-config spawnOpts.
export function snipeTier(config = {}) {
  const agents = fillDefaults(config).agents
  const t = agents.snipe ?? agents.auditor
  const model = MODELS.includes(t.model) ? t.model : agents.auditor.model
  const effort = EFFORTS.includes(t.effort) ? t.effort : 'default'
  return effort === 'default' ? { model } : { model, effort }
}

// --- CLI ------------------------------------------------------------------
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2)
  const ci = argv.indexOf('--config')
  const configPath = ci !== -1 ? argv.splice(ci, 2)[1] : '.claude/war/config.json'
  let config = {}
  try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch { /* fail-open: defaults ladder */ }
  const parsed = parseSnipeArgs(argv.join(' '))
  console.log(JSON.stringify({ ...parsed, tier: snipeTier(config) }, null, 2))
}
