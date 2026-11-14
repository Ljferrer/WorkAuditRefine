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

// Inits only the uninitialized (`-`) submodules, so a reused worktree keeps every
// initialized sibling at its own HEAD (operator ruling 2026-11-13). A fresh
// clone has every submodule uninitialized, so it still inits them all.
// `xargs -r` runs no update on empty input. No `;`, so no statement split.
// GIT_LITERAL_PATHSPECS=1 reads each repo-controlled path literally, so a `-`
// path such as `lib*` never matches an initialized sibling such as `libx`.
// The first half inits the superproject's own uninitialized paths. A nested
// uninitialized path under an initialized parent is unreachable from the
// superproject, so `foreach --recursive` runs the same init-only step inside
// each initialized submodule. Its grep/cut filter equals the awk one and keeps
// `$` and `\` out of the text, so every hand copy stays byte-identical.
const SUBMODULE_INIT = `git submodule status | awk '/^-/{print $2}' | GIT_LITERAL_PATHSPECS=1 xargs -r git submodule update --init --recursive -- && git submodule foreach --recursive "git submodule status | grep '^-' | cut -d ' ' -f 2 | GIT_LITERAL_PATHSPECS=1 xargs -r git submodule update --init --recursive --"`

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

// Discard-exit tails: a step ending in one of these always exits 0, so a failed
// install would pass the Provision barrier (#2716). The closed set is plan
// assumption A26 (docs/plans/2026-11-08-shell-floors-tests-and-lint.md); a new
// tail joins it with its own fixture row. Whitespace between operator and word may vary.
const DISCARD_EXIT_TAILS = Object.freeze([
  { tail: '|| true', re: /\|\|\s*true$/ },
  { tail: '|| :', re: /\|\|\s*:$/ },
  { tail: '|| exit 0', re: /\|\|\s*exit\s+0$/ },
  { tail: '; true', re: /;\s*true$/ },
])

/**
 * Validate a pinned provision list.
 * Accepts an array of non-empty (once trimmed) strings — an empty array is valid
 * (the default: no steps). Rejects non-arrays, any entry that is not a string or
 * is empty/whitespace-only, and any entry whose trimmed text ends in a
 * discard-exit tail (DISCARD_EXIT_TAILS), with one clear, indexed error per
 * offender. An `||` fallback to a real command (`a || b`) is accepted.
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
      return
    }
    const hit = DISCARD_EXIT_TAILS.find(({ re }) => re.test(entry.trim()))
    if (hit) {
      errors.push(`provision[${i}] ends in a discard-exit tail ('${hit.tail}'); a failed step must fail the Provision barrier (#2716)`)
    }
  })
  return { ok: errors.length === 0, errors }
}

/**
 * Tiny structural fallback: the last-resort provisioning floor when no explicit
 * list / CI / onboarding signal is available. Returns, in order:
 *   - SUBMODULE_INIT (init only uninitialized)  iff repoDir/.gitmodules exists
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
