#!/usr/bin/env node
// Deterministic campaign-ledger core behind /war-campaign (spec §7.2).
// Node stdlib only (node:fs, node:path). Single-writer (the campaign Lead);
// every ledger write is atomic (temp file in the same dir + rename).
//
// Ledger shape: { campaign, created, mode: 'stack'|'wait-for-merge',
//                 plans: [{ slug, plan, status, branch, pr, sha, stopPoint, files }] }
// Inbox = <campaignDir>/inbox/ — one file per dropped plan (maildir-style), swept
// into the ledger at plan boundaries. No git transport for the queue.

import fs from 'node:fs'
import path from 'node:path'

export const MODES = ['stack', 'wait-for-merge']

// ---------------------------------------------------------------------------
// Files: extraction — anchored, block-based (never a single-line/lazy regex).
// ---------------------------------------------------------------------------

// Matches the line that opens a Files: block. `s?` also matches the house
// singular "**File:**" form — silent-miss is the unsafe direction here.
const FILES_ANCHOR = /^\s*(-\s+)?\*{0,2}Files?:\*{0,2}\s*/i
const NEW_CONSTRUCT = /^\s*(#{1,6}\s|\*\*|-\s*\[[ xX]\])/

// Consume the anchor line's remainder + continuation lines until a blank line
// or a new construct (heading, bold, checkbox item).
function collectBlock(lines) {
  let start = -1
  let remainder = ''
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FILES_ANCHOR)
    if (m) {
      start = i
      remainder = lines[i].slice(m[0].length)
      break
    }
  }
  if (start === -1) return null

  const parts = [remainder]
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') break
    if (NEW_CONSTRUCT.test(line)) break
    parts.push(line)
  }
  return parts.join(' ')
}

// Strip parenthetical/em-dash annotation clauses, but keep a parenthetical
// whose content is exactly one backticked path-shaped token (bare-path form).
function stripAnnotations(text) {
  return text.replace(/\(([^()]*)\)/g, (whole, inner) => {
    const trimmed = inner.trim()
    const soleToken = trimmed.match(/^`([^`]+)`$/)
    if (soleToken && isPathShaped(soleToken[1])) return ` ${trimmed} `
    return ' '
  }).replace(/—[^,]*$/g, '') // trailing em-dash annotation clause
}

function isPathShaped(token) {
  if (/\s/.test(token)) return false
  if (/[<>]/.test(token)) return false
  if (token.startsWith('#')) return false
  return token.includes('/') || /\.[A-Za-z0-9]+$/.test(token)
}

// Extract the file footprint from a plan's `Files:` block. `lines` is either
// the full plan text split into lines, or an already-sliced block (tests pass
// small fixtures directly).
export function extractFiles(lines) {
  const arr = Array.isArray(lines) ? lines : String(lines).split(/\r?\n/)
  const block = collectBlock(arr)
  if (block == null) return []

  const cleaned = stripAnnotations(block)
  const files = []
  for (const raw of cleaned.split(',')) {
    for (const m of raw.matchAll(/`([^`]+)`/g)) {
      if (isPathShaped(m[1]) && !files.includes(m[1])) files.push(m[1])
    }
  }
  return files
}

function extractFilesFromPlanFile(planPath) {
  const text = fs.readFileSync(planPath, 'utf8')
  return extractFiles(text.split(/\r?\n/))
}

// ---------------------------------------------------------------------------
// Contention: intersect two footprints.
// ---------------------------------------------------------------------------

export function intersectFootprints(a, b) {
  const setB = new Set(b)
  return a.filter((f) => setB.has(f))
}

// Refuse (throw) if any two entries in `entries` ([{ plan, files }]) overlap
// and no explicit order is given for them. An explicit order is ANY given
// sequence — init's list position or sweep's append order both count.
// `positions` (optional) maps plan path -> explicit index, required for any
// entry with an unparseable (empty) footprint.
function assertOrderable(entries, { positions } = {}) {
  for (const e of entries) {
    if (e.files.length === 0 && !(positions && Object.prototype.hasOwnProperty.call(positions, e.plan))) {
      throw new Error(`unparseable footprint for ${e.plan} — explicit position required`)
    }
  }
  // Overlap is expected/normal (release-bearing plans regularly share
  // plugin.json/marketplace.json/README.md). An explicitly given order
  // (the array order of `entries` itself) SATISFIES the check — we never
  // refuse here. Refusal only happens for the unparseable-footprint case
  // above, where no order can be derived at all.
}

// ---------------------------------------------------------------------------
// Ledger I/O — atomic writes (temp file + rename).
// ---------------------------------------------------------------------------

function ledgerPath(campaignDir) {
  return path.join(campaignDir, 'ledger.json')
}

function readLedgerFile(campaignDir) {
  return JSON.parse(fs.readFileSync(ledgerPath(campaignDir), 'utf8'))
}

function writeLedgerAtomic(campaignDir, ledger) {
  const target = ledgerPath(campaignDir)
  const tmp = `${target}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(ledger, null, 2) + '\n')
  fs.renameSync(tmp, target)
}

function slugify(planPath) {
  return path.basename(planPath).replace(/\.[^.]+$/, '')
}

function makePlanEntry(planPath, files) {
  return {
    slug: slugify(planPath),
    plan: path.resolve(planPath),
    status: 'queued',
    branch: null,
    pr: null,
    sha: null,
    stopPoint: null,
    files,
  }
}

// Resolve a roadmap file's index into an ordered list of plan paths.
// The roadmap is authoring input + on-demand snapshot (never the live feed —
// spec Rev 1); this reads a simple numbered/bulleted index list of paths.
function resolveRoadmapPlans(roadmapPath) {
  const text = fs.readFileSync(roadmapPath, 'utf8')
  const roadmapDir = path.dirname(roadmapPath)
  const plans = []
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\d+[.)]|-)\s+(\S+\.md)\s*$/)
    if (m) plans.push(path.resolve(roadmapDir, m[1]))
  }
  return plans
}

// init(campaignDir, { plans, roadmap, mode, positions }) -> ledger
export function init(campaignDir, opts = {}) {
  const { mode, positions } = opts
  if (!MODES.includes(mode)) throw new Error(`mode must be one of ${MODES.join('|')}, got ${mode}`)

  const planPaths = opts.roadmap ? resolveRoadmapPlans(opts.roadmap) : (opts.plans || [])
  const entries = planPaths.map((p) => ({ plan: path.resolve(p), files: extractFilesFromPlanFile(p) }))

  assertOrderable(entries, { positions })

  fs.mkdirSync(campaignDir, { recursive: true })
  fs.mkdirSync(path.join(campaignDir, 'inbox'), { recursive: true })

  const ledger = {
    campaign: path.basename(campaignDir),
    created: new Date().toISOString(),
    mode,
    plans: entries.map((e) => makePlanEntry(e.plan, e.files)),
  }
  writeLedgerAtomic(campaignDir, ledger)
  return ledger
}

// addToInbox(campaignDir, planPath, { filename, ref }) — maildir-style, no ledger touch.
// With `ref`, the drop is TWO lines: line 1 the resolved plan path (unchanged),
// line 2 `ref: <git-ref>` (cross-branch provenance — the plan lives on that ref,
// materialized at the plan boundary). Without `ref`, byte-identical to the legacy
// single-line drop. sweep() parses line 1 as the plan path either way.
export function addToInbox(campaignDir, planPath, opts = {}) {
  const inboxDir = path.join(campaignDir, 'inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  const filename = opts.filename || `${Date.now()}-${process.pid}-${slugify(planPath)}.plan`
  const dest = path.join(inboxDir, filename)
  const body = path.resolve(planPath) + '\n' + (opts.ref ? `ref: ${opts.ref}\n` : '')
  fs.writeFileSync(dest, body)
  return dest
}

// sweep(campaignDir) — move inbox entries into the queue in dependency-safe
// (deterministic: inbox filename) order, contention-checking against the
// existing queue + each other; deletes consumed inbox files. Returns
// { added: [...plans], overlaps: [{ paths, plans }] } for reporting.
export function sweep(campaignDir) {
  const inboxDir = path.join(campaignDir, 'inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  const inboxFiles = fs.readdirSync(inboxDir).sort() // deterministic serialization order
  if (inboxFiles.length === 0) return { added: [], overlaps: [] }

  const ledger = readLedgerFile(campaignDir)
  const existingFiles = ledger.plans.flatMap((p) => p.files)

  const newEntries = inboxFiles.map((fname) => {
    // Drop line 1 is the plan path; an optional line 2 (`ref: <git-ref>`) is
    // cross-branch provenance consumed by the Lead's materialize step BEFORE
    // sweep, never here — sweep stays git-free. Parse line 1 only (a legacy
    // one-line drop has just that line). A still-missing path throws ENOENT
    // via extractFilesFromPlanFile below: the fail-loud backstop for a skipped
    // materialization.
    const planPath = fs.readFileSync(path.join(inboxDir, fname), 'utf8').split(/\r?\n/, 1)[0].trim()
    return { fname, plan: planPath, files: extractFilesFromPlanFile(planPath) }
  })

  // unparseable inbox entries have no explicit position available at sweep
  // time either — refuse the same way init does.
  assertOrderable(newEntries)

  const overlaps = []
  let seenFiles = [...existingFiles]
  for (const e of newEntries) {
    const overlap = intersectFootprints(e.files, seenFiles)
    if (overlap.length) overlaps.push({ paths: overlap, plan: e.plan })
    seenFiles = seenFiles.concat(e.files)
  }

  ledger.plans.push(...newEntries.map((e) => makePlanEntry(e.plan, e.files)))
  writeLedgerAtomic(campaignDir, ledger)

  for (const f of inboxFiles) fs.unlinkSync(path.join(inboxDir, f))

  return { added: newEntries.map((e) => e.plan), overlaps }
}

// next(campaignDir) -> first queued plan entry, or null.
export function next(campaignDir) {
  const ledger = readLedgerFile(campaignDir)
  return ledger.plans.find((p) => p.status === 'queued') || null
}

// record(campaignDir, { plan, status, branch, pr, sha, stopPoint }) — atomic
// update of the matching entry (matched by resolved plan path).
export function record(campaignDir, update) {
  const ledger = readLedgerFile(campaignDir)
  const target = path.resolve(update.plan)
  const entry = ledger.plans.find((p) => p.plan === target)
  if (!entry) throw new Error(`no ledger entry for plan ${target}`)

  for (const key of ['status', 'branch', 'pr', 'sha', 'stopPoint']) {
    if (Object.prototype.hasOwnProperty.call(update, key)) entry[key] = update[key]
  }
  writeLedgerAtomic(campaignDir, ledger)
  return entry
}

// ---------------------------------------------------------------------------
// CLI dispatch (subcommands: init / add / sweep / next / record).
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
      out[key] = val
    } else {
      out._.push(a)
    }
  }
  return out
}

function main() {
  const [, , cmd, ...rest] = process.argv
  const args = parseArgs(rest)
  const campaignDir = args.campaign || '.claude/campaigns/default'

  switch (cmd) {
    case 'init': {
      const mode = args['wait-for-merge'] ? 'wait-for-merge' : 'stack'
      const opts = args.roadmap ? { roadmap: args.roadmap, mode } : { plans: args._, mode }
      console.log(JSON.stringify(init(campaignDir, opts), null, 2))
      break
    }
    case 'add': {
      // Positional at the skill layer (`add <plan> [<ref>]`); the Lead
      // translates the positional ref into --ref when shelling out here.
      const addOpts = typeof args.ref === 'string' ? { ref: args.ref } : {}
      console.log(addToInbox(campaignDir, args._[0], addOpts))
      break
    }
    case 'sweep': {
      console.log(JSON.stringify(sweep(campaignDir), null, 2))
      break
    }
    case 'next': {
      console.log(JSON.stringify(next(campaignDir), null, 2))
      break
    }
    case 'record': {
      // Build the update CONDITIONALLY — record() stamps every own key, and
      // JSON.stringify drops undefined, so an unconditional key would silently
      // DELETE an existing value when its flag is omitted (#422 items 4+6).
      const update = { plan: args.plan }
      for (const key of ['status', 'branch', 'sha', 'stopPoint']) {
        if (Object.prototype.hasOwnProperty.call(args, key)) update[key] = args[key]
      }
      if (Object.prototype.hasOwnProperty.call(args, 'pr')) update.pr = Number(args.pr)
      console.log(JSON.stringify(record(campaignDir, update), null, 2))
      break
    }
    default:
      console.error('usage: campaign-ledger.mjs <init|add|sweep|next|record> [--campaign <dir>] ...')
      process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
