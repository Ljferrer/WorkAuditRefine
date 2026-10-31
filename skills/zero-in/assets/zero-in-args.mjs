// /zero-in argument parsing and the achievability guard.
// Pure ESM, no deps beyond the /snipe helper. Used by the /zero-in SKILL as a CLI:
//   node zero-in-args.mjs [--config <path>]   < file holding the raw argument text
//   node zero-in-args.mjs --assess            < file holding the card JSON
// Text arrives from a file because a brief holds quotes, shell bytes and any line.
// Each form prints one JSON object and exits 0. The Lead stops on `errors` or a `hold`.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseSnipeArgs, snipeTier, snipeRoundCap, SNIPE_LENS_CATALOG } from '../../snipe/assets/snipe-args.mjs'

export const DEFAULT_ROUNDS = 3
export const DEFAULT_SIZE = 3
const MAX_SIZE = 5
// The first arm skips a backtick span, so flag text in a quoted command stays brief text.
const FLAG = /`[^`\n]*`|(^|\s)--([A-Za-z][A-Za-z0-9-]*)(?:=(\S*)|\s+(?!--|`)(\S+))?(?=\s|$)/g
const NEAR_MISS = /round|size|seat/i
const ISSUE_REF = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)|(?<![\w./-])([\w.-]+\/[\w.-]+)#(\d+)|(?<![\w/#])#(\d+)/g
const LENS_TEXT = /^[a-z][a-z0-9-]*(,[a-z][a-z0-9-]*)*$/

const intIn = (text, max) => (/^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= max ? Number(text) : null)

// Each form `gh issue view` can read: a number for this repo, a URL for any other.
function issueRefs(brief) {
  if (/^\d+$/.test(brief)) return [brief]
  const refs = [...brief.matchAll(ISSUE_REF)].map(([, urlRepo, urlNum, repo, repoNum, num]) => {
    if (num) return num
    return `https://github.com/${urlRepo ?? repo}/issues/${urlNum ?? repoNum}`
  })
  return [...new Set(refs)]
}

export function parseZeroInArgs(raw = '', roundCap = DEFAULT_ROUNDS) {
  const errors = []
  const flags = {}
  const brief = String(raw).replace(FLAG, (whole, lead, name, eq, spaced) => {
    if (whole.startsWith('`')) return whole
    if (!['rounds', 'size', 'seats'].includes(name)) {
      if (NEAR_MISS.test(name)) { errors.push(`unknown flag --${name}: put flag text from a bug description in backticks`); return lead }
      return whole
    }
    if (name in flags) errors.push(`--${name} appears more than once`)
    flags[name] = eq ?? spaced ?? ''
    return lead
  }).replace(/\s+/g, ' ').trim()

  if (!brief) errors.push('a brief is required: an issue number or a bug description')
  const issues = issueRefs(brief)

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
  if (size === 1 && named.some(l => !SNIPE_LENS_CATALOG.includes(l))) errors.push('--size 1 takes a catalog lens: /snipe reads a lone other lens as target text')

  return { brief, issues, rounds, size, named, autoCount: Math.max(0, size - named.length), errors }
}

const filled = v => typeof v === 'string' && v.trim() !== ''
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

// The floor under the Lead's own judgment. It proves each request has one home and each
// row covers a request and has its fields. It cannot prove a check is a good one, so the SKILL holds that rule.
export function assessCard(card) {
  if (card === null || typeof card !== 'object' || Array.isArray(card)) return { verdict: 'hold', reasons: ['not a card'] }
  const reasons = []
  const { requested, endStates, direction, asks, outOfReach = [] } = card
  if (!Array.isArray(endStates) || endStates.length === 0) reasons.push('no measurable end state')
  else endStates.forEach((row, i) => {
    const n = i + 1
    if (row === null || typeof row !== 'object') { reasons.push(`end state ${n} is not a row`); return }
    for (const field of ['claim', 'check', 'source', 'covers']) {
      if (!filled(row[field])) reasons.push(`end state ${n} has no ${field}`)
    }
    if (filled(row.claim) && filled(row.check) && same(row.check, row.claim)) reasons.push(`end state ${n} restates its claim as its check`)
    if (filled(row.covers) && !(Array.isArray(requested) && requested.some(want => filled(want) && same(want, row.covers)))) reasons.push(`end state ${n} covers no request`)
  })
  if (!Array.isArray(direction) || !direction.some(filled)) reasons.push('no direction: name the first file or step')
  if (!Array.isArray(asks)) reasons.push('asks must be a list')
  else for (const ask of asks) reasons.push(`open ask: ${ask}`)
  if (!Array.isArray(outOfReach)) reasons.push('outOfReach must be a list')
  if (!Array.isArray(requested) || !requested.some(filled)) reasons.push('requested must list each thing the brief asks for')
  else {
    const covered = (Array.isArray(endStates) ? endStates : []).map(row => row?.covers).filter(filled)
    const outside = (Array.isArray(outOfReach) ? outOfReach : []).filter(filled)
    for (const want of requested) {
      const inRow = filled(want) && covered.some(home => same(home, want))
      const inOutside = filled(want) && outside.some(home => same(home, want))
      if (!inRow && !inOutside) reasons.push(`request not covered: ${want}`)
      if (inRow && inOutside) reasons.push(`request in both an end state and outOfReach: ${want}`)
    }
  }
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
