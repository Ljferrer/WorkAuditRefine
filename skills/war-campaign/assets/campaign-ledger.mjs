#!/usr/bin/env node
// Deterministic campaign-ledger core behind /war-campaign (spec §7.2).
// Node stdlib only (node:fs, node:path). Single-writer (the campaign Lead);
// every ledger write is atomic (temp file in the same dir + rename).
//
// Ledger shape: { campaign, created, mode: 'stack'|'wait-for-merge',
//                 plans: [{ slug, plan, status, branch, pr, sha, stopPoint, files, backstops }] }
// `backstops` is each plan's handoff `backstops[]` (schemas.md) — the validations
// that plan's /war run deferred; null until recorded (in-flight ledgers predate it).
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
// A continuation line ends the Files block when it opens a NEW construct: a
// heading, a bold line, a checkbox item, OR any other list item (`- `). The
// plain-bullet break (`-\s`) scopes the block to the Files line's OWN content:
// on a real /war-machine plan `- Files:` is immediately followed by `- Plan slice:`
// with no blank line between, and without this break the backtick-heavy Plan-slice
// prose bleeds into the block — its construct-name backticks defeat the
// backtick-absence fallback in extractFiles, so a bare `- Files:` path is lost and
// init throws `unparseable footprint` (a /red-team CRITICAL). The checkbox
// alternative is retained for the space-less `-[x]` form the plain-bullet pattern
// would miss.
const NEW_CONSTRUCT = /^\s*(#{1,6}\s|\*\*|-\s*\[[ xX]\]|-\s)/

// Consume the anchor line's remainder + continuation lines until a blank line or
// a new construct (heading, bold, checkbox, or any new list item — the list-item
// break keeps the block scoped to the Files line's own content).
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
//
// Backticked path-shaped tokens are the PRIMARY extraction — backticks are the
// precision mechanism that keeps prose words and doc paths out of the footprint
// (constraint 6). Backtick-ABSENCE fallback: if the annotation-stripped block
// carries NO backtick character at all and is non-empty (the bare `- Files:`
// shape a /war-machine plan often emits), split on commas and accept whole
// segments passing isPathShaped(). The trigger is backtick ABSENCE, not
// zero-files: a block whose sole backticked token is non-path-shaped stays
// backtick-only, yields [], and surfaces via assertOrderable's fail-loud throw —
// never diluted by a bare fallback (mixed lines defer to backticks).
//
// Fallback ceilings (both fail-loud-backstopped, never a silent wrong ingest):
//  - isPathShaped over-acceptance: it accepts any dot-suffixed token (a stray
//    prose `e.g.` would pass), so a sloppy bare line can over-widen the footprint.
//    Bounded — worst case is an over-conservative contention order, never a throw.
//  - Parenthetical keep-rule asymmetry: stripAnnotations preserves a parenthetical
//    ONLY when its sole content is a BACKTICKED path token; a bare parenthesized
//    path is stripped BEFORE the fallback sees it. A block reduced to empty that
//    way yields [] and surfaces via the fail-loud throw.
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
  // Backtick-ABSENCE fallback (see header): fires ONLY when the cleaned block
  // carries no backtick at all — any backtick present keeps extraction
  // backtick-only, so a bare path never dilutes a mixed line (constraint 6).
  if (!cleaned.includes('`') && cleaned.trim() !== '') {
    for (const raw of cleaned.split(',')) {
      const seg = raw.trim()
      if (isPathShaped(seg) && !files.includes(seg)) files.push(seg)
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
      throw new Error(
        `unparseable footprint for ${e.plan} — explicit position required, ` +
          `or give the plan a Files: line with backticked, comma-separated paths ` +
          `(extractFiles reads backticked tokens; see war-strategy §2)`,
      )
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
    backstops: null,
  }
}

// Resolve a roadmap file's plan index into an ordered list of resolved plan paths.
// The roadmap is authoring input + on-demand snapshot (never the live feed — spec
// Rev 1). Two accepted forms, read in a SINGLE pass so queue order is document line
// order:
//   1. A bare bulleted/numbered list line whose sole content is a `.md` path
//      (`- plans/a.md` or `1. plans/a.md`) — the legacy contract, accepted ANYWHERE
//      outside code fences (NOT subject to the first-table restriction below).
//   2. A plan-index TABLE row (a line starting with `|`) WITHIN THE FIRST TABLE:
//      contributes the target of its FIRST markdown link whose target ends `.md`
//      (`[slug](../plans/<file>.md)`). This is the ratified roadmap template
//      (war-strategy SKILL.md §2); every committed roadmap uses it. Header/separator
//      rows carry no link and so contribute nothing — the link requirement is the
//      structural filter.
// Both forms resolve their target against the roadmap's own directory, so a
// `../plans/<file>.md` target from a `docs/roadmaps/` roadmap lands in `docs/plans/`.
//
// FIRST-TABLE-ONLY ingestion (the #738 fix): a /war-machine roadmap carries auxiliary
// tables AFTER the plan index — the issue→spec→plan chain (whose rows link
// `../specs/*-design.md`) and the shared-file contention table. Only the first
// contiguous table block is ingested: a two-flag state machine where ANY leading-`|`
// line opens the table (`inTable`) and the first non-table line seen after ≥1 table
// line closes it PERMANENTLY (`tableClosed`); later tables contribute nothing. This is
// structural and name-blind (constraint 1) — no `../specs/` path or `-design.md`
// suffix heuristic. A stray leading-`|` prose line before the real plan index thus
// opens AND closes a link-less first table, disqualifying the real table — the parse
// then 0-plan-throws (loud and named; a pinned fixture).
//
// CODE-FENCE-BLIND: lines inside ```-delimited fences are invisible to BOTH forms (an
// `inFence` toggle). A fenced EXAMPLE table would otherwise BECOME the first table and
// mis-ingest its illustrative links.
//
// FAIL-LOUD contract: a parse that yields 0 plans THROWS (naming the roadmap path, both
// accepted forms, the first-table-only restriction, and the `--plans` explicit-seed
// escape hatch). Returning [] would let init() write a valid-but-empty ledger at exit 0
// — the #585 silent failure.
//
// Documented ceilings (with triggers):
//  (a) First-link-per-row, WITHIN THE FIRST TABLE: only the first `.md` link target in
//      a first-table row is taken. The ratified template keeps the Plan column the only
//      linked cell; backticked doc paths in the Files-owned / contention cells are never
//      extracted (link syntax is the whole precision mechanism — `isPathShaped` does not
//      discriminate here). A future first table with a `.md` link in a column BEFORE the
//      Plan column would mis-ingest.
//  (b) Bulleted MARKDOWN-LINK lines (`- [slug](../plans/x.md)`) match NEITHER form
//      (out of contract, operator-ratified); the 0-plan throw names the miss.
//  (c) Legacy spec-index roadmaps are OUT OF CONTRACT: a FIRST table linking
//      `../specs/*.md` would seed a campaign of spec files. First-table-only ingestion
//      SUPERSEDES the old whole-document ceiling for the chain-table shape (a later
//      spec-linking table is now structurally ignored), but this ceiling is RETAINED
//      for a roadmap whose *first* table links non-plans: deliberately NO path or
//      `-design.md` suffix heuristic discriminates (target-repo-agnostic code carries no
//      repo naming convention). Such over-ingestion surfaces via the existing backstops
//      (assertOrderable's unparseable-footprint throw — a spec has no `Files:` block —
//      or extractFilesFromPlanFile's ENOENT).
function resolveRoadmapPlans(roadmapPath) {
  const text = fs.readFileSync(roadmapPath, 'utf8')
  const roadmapDir = path.dirname(roadmapPath)
  const plans = []
  let inFence = false
  let inTable = false
  let tableClosed = false
  for (const line of text.split(/\r?\n/)) {
    // Code fences hide their contents from BOTH forms. The ```-delimiter line
    // toggles the fence and is itself skipped.
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const isTableLine = /^\s*\|/.test(line)
    // First-table state machine: the first NON-table line after any table line
    // closes the first table permanently (later tables are inert). A bare-list line
    // is a non-table line, so it closes the table too — but still ingests as form 1.
    if (!isTableLine && inTable) tableClosed = true

    const bare = line.match(/^\s*(?:\d+[.)]|-)\s+(\S+\.md)\s*$/)
    if (bare) {
      plans.push(path.resolve(roadmapDir, bare[1]))
      continue
    }
    // A table row (leading-`|`, whitespace-tolerant) within the first table
    // contributes its first markdown link target ending `.md` immediately before the
    // closing paren (target whitespace-free, so `<file>.md#anchor` and non-`.md`
    // targets don't match).
    if (isTableLine && !tableClosed) {
      inTable = true
      const link = line.match(/\[[^\]]*\]\((\S+\.md)\)/)
      if (link) plans.push(path.resolve(roadmapDir, link[1]))
    }
  }
  if (plans.length === 0) {
    throw new Error(
      `0 plans parsed from ${roadmapPath} — expected a plan-index table ` +
        `([slug](../plans/<file>.md) rows; ONLY the first table in the document is ingested) ` +
        `or bare bulleted/numbered .md path lines; ` +
        `bulleted markdown links (- [slug](file.md)) are not an accepted form. ` +
        `To seed a campaign explicitly instead of from a roadmap, pass --plans.`,
    )
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

// record(campaignDir, { plan, status, branch, pr, sha, stopPoint, backstops }) — atomic
// update of the matching entry (matched by resolved plan path). `backstops` is the
// plan's handoff `backstops[]`, stamped only when the key is present (hasOwnProperty
// guard) so an omitted flag never deletes an existing value (#422).
export function record(campaignDir, update) {
  const ledger = readLedgerFile(campaignDir)
  const target = path.resolve(update.plan)
  const entry = ledger.plans.find((p) => p.plan === target)
  if (!entry) throw new Error(`no ledger entry for plan ${target}`)

  for (const key of ['status', 'branch', 'pr', 'sha', 'stopPoint', 'backstops']) {
    if (Object.prototype.hasOwnProperty.call(update, key)) entry[key] = update[key]
  }
  writeLedgerAtomic(campaignDir, ledger)
  return entry
}

// aggregateBackstops(campaignDir) -> flat list of every backstop deferred across
// the whole campaign, each tagged with its origin plan slug, for the wrap-up
// "Unexecuted backstops" render. Tolerates entries predating the field (null /
// missing `backstops` contribute nothing). AI-declared entries keep their
// `aiDeclared` flag so the render can mark them.
export function aggregateBackstops(campaignDir) {
  const ledger = readLedgerFile(campaignDir)
  const out = []
  for (const p of ledger.plans) {
    if (!Array.isArray(p.backstops)) continue // null/absent — in-flight or none deferred
    for (const b of p.backstops) out.push({ ...b, plan: p.slug })
  }
  return out
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
      // --backstops is the plan's handoff backstops[] as a JSON array string.
      if (Object.prototype.hasOwnProperty.call(args, 'backstops')) update.backstops = JSON.parse(args.backstops)
      console.log(JSON.stringify(record(campaignDir, update), null, 2))
      break
    }
    default:
      console.error('usage: campaign-ledger.mjs <init|add|sweep|next|record> [--campaign <dir>] ...')
      process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
