import { isAbsolute } from 'node:path'
// Pure verdict/classification logic for /red-team. No deps. The Red Team Lead pipes the
// verification Workflow's aggregated `probeResults` through this to classify blockers and
// compute the verdict that drives the grill loop. (The Workflow sandbox only COLLECTS
// findings; classification + verdict live here, run by the Lead via Bash.)

export const BLOCKER_SEVERITIES = ['Critical', 'Major']

export function allFindings(results) {
  return (results || []).flatMap(r =>
    r && Array.isArray(r.findings) ? r.findings.map(f => ({ probe: r.probe, ...f })) : [])
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

export function dedupe(findings) {
  const seen = new Set(), out = []
  for (const f of findings) {
    const key = `${f.planRef || ''}|${f.severity}|${f.claim || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

export function classify(findings) {
  const fs = dedupe(findings)
  return {
    blockers:      fs.filter(f => BLOCKER_SEVERITIES.includes(f.severity)),
    needsDecision: fs.filter(f => f.needsDecision === true),
    minors:        fs.filter(f => f.severity === 'Minor' && f.needsDecision !== true),
  }
}

// Compute the gate over the currently-OPEN findings (the Lead removes resolved ones
// during the grill loop). BLOCKED = work remains; loop until it is not BLOCKED.
export function verdict(findings) {
  const { blockers, needsDecision, minors } = classify(findings)
  if (blockers.length || needsDecision.length) return 'BLOCKED'
  return minors.length ? 'CLEARED-WITH-NOTES' : 'CLEARED'
}

export function summarize(results) {
  const r = (results || []).filter(Boolean)
  const count = pred => r.filter(pred).length
  return {
    probes: r.length,
    executed: count(x => x.technique === 'executed'),
    analyzed: count(x => x.technique === 'analyzed'),
    pass: count(x => x.status === 'pass'),
    fail: count(x => x.status === 'fail'),
    warn: count(x => x.status === 'warn'),
  }
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
  const findings = allFindings(results)
  process.stdout.write(JSON.stringify(
    { verdict: verdict(findings), ...classify(findings), summary: summarize(results) }, null, 2) + '\n')
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
