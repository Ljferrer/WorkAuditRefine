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

import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Lockfile -> install command. Kept to the single lockfile the plan names; this
// map is the floor, not an ecosystem matrix. Add entries only with a spec change.
const LOCKFILE_INSTALL = Object.freeze({
  'pnpm-lock.yaml': 'pnpm install --frozen-lockfile',
})

const SUBMODULE_INIT = 'git submodule update --init --recursive'

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

function describe(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}
