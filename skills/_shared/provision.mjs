// Shared provisioning primitives for WAR + red-team (Part B).
//
// Two tiny, pure-ish helpers:
//   validateProvision(list) — guards a pinned run.provision list before it is used.
//   structuralFallback(repoDir) — a DELIBERATELY TINY structural floor: submodule
//     init + a single known lockfile install, nothing else.
//
// Repo-specific intelligence (CI / onboarding derivation) lives in the read-only
// setup-scout AGENT, not here. structuralFallback is intentionally NOT an
// ecosystem table — extending it with language/framework detection is an
// explicit anti-goal (see docs/plans/2026-06-25-worktree-provisioning-part-B.md).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Lockfile -> install command. Kept to the single lockfile the plan names; this
// map is the floor, not an ecosystem matrix. Add entries only with a spec change.
const LOCKFILE_INSTALL = Object.freeze({
  'pnpm-lock.yaml': 'pnpm install --frozen-lockfile',
})

const SUBMODULE_INIT = 'git submodule update --init --recursive'

/**
 * Parse .gitmodules and return the array of submodule path values.
 * Returns [] if repoDir/.gitmodules is absent or repoDir is empty/missing.
 * Never throws on a missing dir (matches structuralFallback style).
 * // ponytail: feeds the war-room/decompose overlap check and the relax guard (T2/T3).
 *
 * @param {string} repoDir
 * @returns {string[]}
 */
export function submodulePaths(repoDir) {
  if (typeof repoDir !== 'string' || repoDir === '') return []
  const p = join(repoDir, '.gitmodules')
  if (!existsSync(p)) return []
  const paths = []
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    // Greedy-to-EOL capture is intentional: a .gitmodules `path =` value runs to end of line (paths may contain spaces).
    const m = line.match(/^\s*path\s*=\s*(.+)$/)
    if (m) paths.push(m[1].trim())
  }
  return paths
}

/**
 * Validate a pinned provision list.
 * Accepts an array of non-empty (once trimmed) strings — an empty array is valid
 * (the default: no steps). Rejects non-arrays, and any entry that is not a
 * string or is empty/whitespace-only, with one clear, indexed error per offender.
 *
 * @param {unknown} list
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateProvision(list) {
  const errors = []
  if (!Array.isArray(list)) {
    errors.push(`provision must be an array of strings, got ${describe(list)}`)
    return { ok: false, errors }
  }
  list.forEach((entry, i) => {
    if (typeof entry !== 'string') {
      errors.push(`provision[${i}] must be a string, got ${describe(entry)}`)
      return
    }
    if (entry.trim() === '') {
      errors.push(`provision[${i}] must be a non-empty (non-whitespace) string`)
    }
  })
  return { ok: errors.length === 0, errors }
}

/**
 * Tiny structural fallback: the last-resort provisioning floor when no explicit
 * list / CI / onboarding signal is available. Returns, in order:
 *   - 'git submodule update --init --recursive'  iff repoDir/.gitmodules exists
 *   - the lockfile-matched install               iff a known lockfile exists
 * Both (in that order) if both apply; [] if neither. Never throws on a missing dir.
 *
 * @param {string} repoDir
 * @returns {string[]}
 */
export function structuralFallback(repoDir) {
  if (typeof repoDir !== 'string' || repoDir === '') return []
  const steps = []
  if (existsSync(join(repoDir, '.gitmodules'))) {
    steps.push(SUBMODULE_INIT)
  }
  for (const [lockfile, install] of Object.entries(LOCKFILE_INSTALL)) {
    if (existsSync(join(repoDir, lockfile))) {
      steps.push(install)
      break // tiny floor: a single install step
    }
  }
  return steps
}

const MANIFEST_FILE = '.war-provision.json'
const ALLOWED_KEYS = new Set(['provision', 'rationale'])

/**
 * Read and validate a committed repo provisioning manifest (.war-provision.json).
 * Absent file  → { found: false }
 * Present file → parse JSON, guard non-object, check unknown keys, validateProvision.
 *   All pass → { found:true, ok:true, provision, rationale }
 *   Any fail → { found:true, ok:false, errors:[…] }
 * The `source` field is NEVER read from the file — the caller stamps it ('manifest').
 *
 * @param {string} repoDir
 * @returns {{ found: boolean, ok?: boolean, provision?: string[], rationale?: string, errors?: string[] }}
 */
export function readManifest(repoDir) {
  const path = join(repoDir, MANIFEST_FILE)
  if (!existsSync(path)) return { found: false }

  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    return { found: true, ok: false, errors: ['invalid JSON: ' + e.message] }
  }

  // Guard: non-object JSON (null, [], "x", 42) parses without throwing but
  // Object.keys(parsed) crashes or gives wrong results. ponytail: required guard
  // per memory json-parse-catch-misses-valid-scalar.
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { found: true, ok: false, errors: ['manifest must be a JSON object {provision, rationale?}'] }
  }

  const errors = []

  // Unknown-key check runs INDEPENDENTLY of validateProvision (not short-circuited).
  // This ensures a manifest carrying its own 'source' key is always rejected.
  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`unknown key '${key}' (only 'provision' and 'rationale' are allowed)`)
    }
  }

  const vr = validateProvision(parsed.provision)
  if (!vr.ok) errors.push(...vr.errors)

  if (errors.length > 0) return { found: true, ok: false, errors }
  return { found: true, ok: true, provision: parsed.provision, rationale: parsed.rationale }
}

function describe(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}
