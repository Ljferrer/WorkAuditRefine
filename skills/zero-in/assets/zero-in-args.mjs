// /zero-in argument parsing and the achievability guard.
// Pure ESM, no deps beyond the /snipe helper. Used by the /zero-in SKILL as a CLI:
//   node zero-in-args.mjs [--config <path>]   < raw argument text on stdin
//   node zero-in-args.mjs --assess            < card JSON on stdin
// Text arrives on stdin because a brief holds quotes and shell bytes.
// Each form prints one JSON object and exits 0. The Lead stops on `errors` or a `hold`.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseSnipeArgs, snipeTier, snipeRoundCap } from '../../snipe/assets/snipe-args.mjs'

export const DEFAULT_ROUNDS = 3
export const DEFAULT_SIZE = 3
const MAX_SIZE = 5
const FLAG = /(^|\s)--([a-z][a-z-]*)(?:=(\S*)|\s+(?!--)(\S+))?(?=\s|$)/g
const NEAR_MISS = /^(rounds?|sizes?|seats?)$/
const LENS_TEXT = /^[a-z][a-z0-9-]*(,[a-z][a-z0-9-]*)*$/

const intIn = (text, max) => (/^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= max ? Number(text) : null)

export function parseZeroInArgs(raw = '', roundCap = DEFAULT_ROUNDS) {
  const errors = []
  const flags = {}
  const brief = String(raw).replace(FLAG, (whole, lead, name, eq, spaced) => {
    if (!['rounds', 'size', 'seats'].includes(name)) {
      if (NEAR_MISS.test(name)) { errors.push(`unknown flag --${name}`); return lead }
      return whole
    }
    if (name in flags) errors.push(`--${name} appears more than once`)
    flags[name] = eq ?? spaced ?? ''
    return lead
  }).replace(/\s+/g, ' ').trim()

  if (!brief) errors.push('a brief is required: an issue number or a bug description')
  const issues = [...brief.matchAll(/#(\d+)/g)].map(m => Number(m[1]))

  const read = (name, max, fallback) => {
    if (!(name in flags)) return fallback
    if (flags[name] === '') { errors.push(`--${name} needs a value`); return fallback }
    const n = intIn(flags[name], max)
    if (n === null) errors.push(`--${name} must be an integer from 1 to ${max}`)
    return n ?? fallback
  }
  const rounds = read('rounds', roundCap, Math.min(DEFAULT_ROUNDS, roundCap))
  const size = read('size', MAX_SIZE, DEFAULT_SIZE)
  if ('seats' in flags && flags.seats === '') errors.push('--seats needs a value')

  const lensText = flags.seats || 'auto'
  const seats = parseSnipeArgs(LENS_TEXT.test(lensText) ? lensText : '')
  const refused = !LENS_TEXT.test(lensText) || seats.target !== ''
  if (refused) errors.push(`--seats takes auto or a comma list of lenses (got ${lensText})`)
  errors.push(...seats.errors)
  const named = refused ? [] : seats.named
  if (named.length > size) errors.push(`${named.length} named lenses exceed --size ${size}`)

  return { brief, issues, rounds, size, named, autoCount: Math.max(0, size - named.length), errors }
}

const filled = v => typeof v === 'string' && v.trim() !== ''

// The floor under the Lead's own judgment: a card goes only if each field the guard
// needs is present. It cannot prove a check is a good one, so the SKILL holds that rule.
export function assessCard(card) {
  if (card === null || typeof card !== 'object' || Array.isArray(card)) return { verdict: 'hold', reasons: ['not a card'] }
  const reasons = []
  const { endStates, direction, asks } = card
  if (!Array.isArray(endStates) || endStates.length === 0) reasons.push('no measurable end state')
  else endStates.forEach((row, i) => {
    const n = i + 1
    if (row === null || typeof row !== 'object') { reasons.push(`end state ${n} is not a row`); return }
    for (const field of ['claim', 'check', 'source']) {
      if (!filled(row[field])) reasons.push(`end state ${n} has no ${field}`)
    }
    if (filled(row.claim) && row.check === row.claim) reasons.push(`end state ${n} restates its claim as its check`)
  })
  if (!Array.isArray(direction) || !direction.some(filled)) reasons.push('no direction: name the first file or step')
  if (!Array.isArray(asks)) reasons.push('asks must be a list')
  else for (const ask of asks) reasons.push(`open ask: ${ask}`)
  return { verdict: reasons.length ? 'hold' : 'go', reasons }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2)
  const input = readFileSync(0, 'utf8')
  if (argv.includes('--assess')) {
    let card
    try { card = JSON.parse(input) } catch {
      console.log(JSON.stringify({ verdict: 'hold', reasons: ['card is not valid JSON'] }))
      process.exit(0)
    }
    console.log(JSON.stringify(assessCard(card)))
    process.exit(0)
  }
  const ci = argv.indexOf('--config')
  const configPath = ci !== -1 ? argv[ci + 1] : '.claude/war/config.json'
  let config = {}
  try { config = JSON.parse(readFileSync(configPath, 'utf8')) ?? {} } catch { /* fail-open: defaults ladder */ }
  const roundCap = snipeRoundCap(config)
  console.log(JSON.stringify({ ...parseZeroInArgs(input, roundCap), tier: snipeTier(config), roundCap }, null, 2))
}
