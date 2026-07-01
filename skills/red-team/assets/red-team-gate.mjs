import { isAbsolute } from 'node:path'
// Pure verdict/classification logic for /red-team. No deps. The Red Team Lead pipes the
// verification Workflow's aggregated `probeResults` through this to classify blockers and
// compute the verdict that drives the grill loop. (The Workflow sandbox only COLLECTS
// findings; classification + verdict live here, run by the Lead via Bash.)

export const BLOCKER_SEVERITIES = ['Critical', 'Major']
// The severities the gate understands. A finding whose `severity` is absent or outside
// this set is MALFORMED — it must not silently fall through every bucket (#311).
const KNOWN_SEVERITIES = [...BLOCKER_SEVERITIES, 'Minor']

export function allFindings(results) {
  return (results || []).flatMap(r =>
    r && Array.isArray(r.findings) ? r.findings.map(f => ({ probe: r.probe, probeStatus: r.status, ...f })) : [])
}

// --- Layer 3: anchor attestation --------------------------------------------
// Normalize a plan's title line for tolerant comparison: drop a leading '# ',
// collapse internal whitespace, lowercase.
export function normalizeTitle(s) {
  return String(s || '').replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

// True iff `p` is exactly `repo` or sits under `repo/`.
function isUnder(p, repo) {
  const base = String(repo).replace(/\/+$/, '')
  return p === base || p.startsWith(base + '/')
}

// A probe result is ON-TARGET iff it attests reading the RIGHT plan:
//  - read_anchor.plan_title matches the fingerprint's titleLine (normalized), AND
//  - read_anchor.resolved_path is absolute and under `repo`.
// A missing/non-object read_anchor ⇒ off-target (it cannot prove what it read).
// Back-compat: with no fingerprint, anchors are not enforced (returns true).
export function isOnTarget(result, fingerprint, repo) {
  if (!fingerprint) return true
  const a = result && result.read_anchor
  if (!a || typeof a !== 'object') return false
  const titleOk = normalizeTitle(a.plan_title) === normalizeTitle(fingerprint.titleLine)
  const p = a.resolved_path
  const pathOk = typeof p === 'string' && isAbsolute(p) && (!repo || isUnder(p, repo))
  return titleOk && pathOk
}

// --- Layer 4: coverage accounting + fail-closed verdict ----------------------
// Split probeResults into on-target / off-target / dropped. A dropped marker is
// { probe, dropped:true } (the scaffold emits one per probe whose agent died after
// a retry). Off-target findings are discarded by the caller (they describe the wrong
// artifact). `ran` = on-target + off-target (the slots that produced a real result).
export function classifyCoverage(probeResults, expected, fingerprint, repo) {
  const results = Array.isArray(probeResults) ? probeResults : []
  const dropped = [], onTarget = [], offTarget = []
  for (const r of results) {
    if (!r) continue
    if (r.dropped === true) { dropped.push(r.probe || 'unknown'); continue }
    if (isOnTarget(r, fingerprint, repo)) onTarget.push(r)
    else offTarget.push(r.probe || 'unknown')
  }
  const ran = onTarget.length + offTarget.length
  const exp = Number.isInteger(expected) ? expected : ran + dropped.length
  return { onTarget, offTarget, dropped, ran, expected: exp }
}

// INCOMPLETE when any probe was off-target, any was dropped, or fewer ran than expected.
export function isIncomplete(coverage) {
  if (!coverage) return false
  return coverage.offTarget.length > 0 || coverage.dropped.length > 0 || coverage.ran < coverage.expected
}

export function dedupe(findings) {
  const seen = new Set(), out = []
  for (const f of findings) {
    // Primary key is planRef|severity|claim. When severity AND claim are both absent
    // (a malformed finding), that key collapses distinct findings to one — fall back to
    // file|line|summary so two severity-less findings don't vanish into a single slot (#311).
    const key = (f.severity == null && f.claim == null)
      ? `${f.file || ''}|${f.line || ''}|${f.summary || ''}`
      : `${f.planRef || ''}|${f.severity}|${f.claim || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

export function classify(findings) {
  const fs = dedupe(findings).map(f => {
    // A finding with no/invalid severity is malformed. On a non-pass probe it is a genuine
    // (mis-shaped) defect → force needsDecision so it can't fall through every bucket. On a
    // pass probe demote it to Minor (informational), never a blocker — preserves #50.
    if (KNOWN_SEVERITIES.includes(f.severity)) return f
    return f.probeStatus !== 'pass' ? { ...f, needsDecision: true } : { ...f, severity: 'Minor' }
  })
  return {
    blockers:      fs.filter(f => BLOCKER_SEVERITIES.includes(f.severity) && f.probeStatus !== 'pass'),
    needsDecision: fs.filter(f => f.needsDecision === true),
    minors:        fs.filter(f => f.severity === 'Minor' && f.needsDecision !== true),
  }
}

// Compute the gate over the currently-OPEN findings (the Lead removes resolved ones
// during the grill loop). BLOCKED = work remains; loop until it is not BLOCKED.
// `coverage` (optional) is the classifyCoverage result. Incomplete coverage is fail-closed:
// the gate NEVER returns CLEARED while a probe was off-target, dropped, or never ran.
export function verdict(findings, coverage = null) {
  if (isIncomplete(coverage)) return 'INCOMPLETE'
  const { blockers, needsDecision, minors } = classify(findings)
  if (blockers.length || needsDecision.length) return 'BLOCKED'
  return minors.length ? 'CLEARED-WITH-NOTES' : 'CLEARED'
}

// When `coverage` is supplied, the summary also reports the coverage accounting
// (expected vs on-target, plus the off-target / dropped probe names).
export function summarize(results, coverage = null) {
  const r = (results || []).filter(Boolean)
  const count = pred => r.filter(pred).length
  const base = {
    probes: r.length,
    executed: count(x => x.technique === 'executed'),
    analyzed: count(x => x.technique === 'analyzed'),
    pass: count(x => x.status === 'pass'),
    fail: count(x => x.status === 'fail'),
    warn: count(x => x.status === 'warn'),
  }
  if (coverage) {
    base.expected = coverage.expected
    base.onTarget = coverage.onTarget.length
    base.offTarget = coverage.offTarget
    base.dropped = coverage.dropped
  }
  return base
}

// --- CLI ---------------------------------------------------------------------
// node red-team-gate.mjs <results.json>   -> classify + verdict (results = [...] or { probeResults:[...] })
// node red-team-gate.mjs --stdin          -> same, reading JSON from stdin
async function main(argv) {
  const args = argv.slice(2)
  let raw
  if (args.includes('--stdin')) {
    raw = await new Promise((res, rej) => {
      let d = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', c => { d += c })
      process.stdin.on('end', () => res(d))
      process.stdin.on('error', rej)
    })
  } else {
    const path = args.find(a => !a.startsWith('--'))
    if (!path) { process.stderr.write('usage: red-team-gate.mjs (<results.json> | --stdin)\n'); process.exit(1) }
    const { readFileSync } = await import('node:fs')
    raw = readFileSync(path, 'utf8')
  }
  let parsed
  try { parsed = JSON.parse(raw) }
  catch (e) { process.stderr.write(`invalid JSON: ${e.message}\n`); process.exit(1) }
  const results = Array.isArray(parsed) ? parsed : (parsed.probeResults || [])
  const fingerprint = Array.isArray(parsed) ? null : (parsed.fingerprint || null)
  const repo = Array.isArray(parsed) ? null : (parsed.repo || null)
  const expected = Array.isArray(parsed) ? undefined : parsed.expected
  // Coverage accounting kicks in once the run supplies a fingerprint or an expected count;
  // otherwise behave exactly as before. Off-target findings are discarded before classify.
  const coverage = (fingerprint || Number.isInteger(expected))
    ? classifyCoverage(results, expected, fingerprint, repo)
    : null
  const trusted = coverage ? coverage.onTarget : results
  const findings = allFindings(trusted)
  process.stdout.write(JSON.stringify(
    { verdict: verdict(findings, coverage), ...classify(findings), summary: summarize(trusted, coverage) },
    null, 2) + '\n')
}

import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
// Compare realpath-resolved paths so the CLI runs even when invoked via a symlinked path
// (e.g. ${CLAUDE_PLUGIN_ROOT} under a symlinked plugins cache, or /tmp → /private/tmp on macOS).
let invokedDirectly = false
try { invokedDirectly = !!process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]) } catch {}
if (invokedDirectly) {
  main(process.argv)
}
