// Codex /snipe request boundary. Targets and paths arrive as structured data;
// only the established seat/lens grammar is delegated to the shared parser.

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readlinkSync } from 'node:fs'

import { parseSnipeArgs } from '../../../../../skills/snipe/assets/snipe-args.mjs'
import { RESERVED_LENSES } from '../../../../../skills/war/assets/war-config.mjs'

export class SnipeRequestError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SnipeRequestError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SnipeRequestError(code, message)
}

function git(cwd, args, { allowDiff = false, binary = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: binary ? null : 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) fail('GIT_FAILED', `git ${args[0]} failed: ${result.error.message}`)
  if (allowDiff && (result.status === 0 || result.status === 1)) return result
  if (result.status !== 0) {
    const detail = String(result.stderr || '').trim()
    fail('GIT_FAILED', `git ${args[0]} failed${detail ? `: ${detail}` : ''}`)
  }
  return result
}

function stdout(cwd, args) {
  return git(cwd, args).stdout.trim()
}

function resolveCommit(cwd, ref) {
  const result = spawnSync('git', ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], {
    cwd,
    encoding: 'utf8',
  })
  if (result.status !== 0) fail('MISSING_REF', `cannot resolve commit ref '${ref}'`)
  return result.stdout.trim()
}

function repoRoot(cwd) {
  return stdout(cwd, ['rev-parse', '--show-toplevel'])
}

function normalizePaths(paths = []) {
  if (!Array.isArray(paths)) fail('INVALID_PATHS', 'paths must be an array of literal repository-relative strings')
  return paths.map((path, index) => {
    if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
      fail('INVALID_PATHS', `paths[${index}] must be a nonempty string without NUL bytes`)
    }
    if (path.startsWith('/') || path.split('/').includes('..')) {
      fail('INVALID_PATHS', `paths[${index}] must stay within the repository`)
    }
    return path
  })
}

function pathspecs(paths) {
  return paths.map(path => `:(literal)${path}`)
}

function resolveProfile({ profile, inheritedProfile, supportedProfiles }) {
  if (!supportedProfiles || typeof supportedProfiles !== 'object' || Array.isArray(supportedProfiles)) {
    fail('UNSUPPORTED_PROFILE', 'the selected host did not provide supported Codex profiles')
  }
  const selected = { ...(inheritedProfile || {}), ...(profile || {}) }
  if (typeof selected.model !== 'string' || typeof selected.effort !== 'string') {
    fail('UNSUPPORTED_PROFILE', 'a Codex model and effort must be inherited or explicitly selected')
  }
  const efforts = supportedProfiles[selected.model]
  if (!Array.isArray(efforts) || !efforts.includes(selected.effort)) {
    fail('UNSUPPORTED_PROFILE', `unsupported Codex profile '${selected.model}/${selected.effort}' on the selected host`)
  }
  return Object.freeze(selected)
}

function defaultBranchRef(cwd) {
  const result = spawnSync('git', ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'], {
    cwd,
    encoding: 'utf8',
  })
  if (result.status !== 0 || !result.stdout.trim()) {
    fail('DEFAULT_BRANCH_UNAVAILABLE', 'cannot determine the actual default branch from refs/remotes/origin/HEAD')
  }
  return result.stdout.trim()
}

function hasDiff(cwd, baseSha, headSha, paths) {
  const args = ['diff', '--quiet', baseSha, headSha]
  if (paths.length) args.push('--', ...pathspecs(paths))
  const result = git(cwd, args, { allowDiff: true })
  if (result.status > 1) fail('GIT_FAILED', 'git diff failed while validating the review range')
  return result.status === 1
}

function finishCommittedScope({ cwd, root, description, comparison, baseSha, headSha, paths }) {
  if (!hasDiff(cwd, baseSha, headSha, paths)) {
    fail('EMPTY_DIFF', `resolved target '${description}' has no changes in the requested paths`)
  }
  return Object.freeze({
    kind: 'committed',
    advisory: false,
    repository: root,
    description,
    comparison,
    baseSha,
    headSha,
    paths: Object.freeze([...paths]),
  })
}

function mergeBaseScope(cwd, root, baseRef, headRef, description, paths) {
  const baseTip = resolveCommit(cwd, baseRef)
  const headSha = resolveCommit(cwd, headRef)
  const baseSha = stdout(cwd, ['merge-base', baseTip, headSha])
  return finishCommittedScope({ cwd, root, description, comparison: 'merge-base', baseSha, headSha, paths })
}

function parseRange(expression) {
  if (typeof expression !== 'string' || expression.includes('...')) {
    fail('INVALID_TARGET', "range target must be an explicit two-dot expression such as 'base..head'")
  }
  const separator = expression.indexOf('..')
  if (separator <= 0 || separator !== expression.lastIndexOf('..') || separator + 2 >= expression.length) {
    fail('INVALID_TARGET', "range target must be an explicit two-dot expression such as 'base..head'")
  }
  return [expression.slice(0, separator), expression.slice(separator + 2)]
}

function parsePrUrl(url) {
  let parsed
  try { parsed = new URL(url) } catch { fail('INVALID_TARGET', 'PR target must be a full GitHub pull-request URL') }
  const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/)
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || !match) {
    fail('INVALID_TARGET', 'PR target must be a full https://github.com/OWNER/REPO/pull/NUMBER URL')
  }
  return { owner: match[1], repository: match[2], number: Number(match[3]) }
}

function originIdentity(cwd) {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' })
  if (result.status !== 0) return null
  const value = result.stdout.trim()
  let path = null
  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'github.com') path = parsed.pathname.slice(1)
  } catch {
    const scp = value.match(/^[^@/]+@github\.com:(.+)$/)
    if (scp) path = scp[1]
  }
  const match = path?.match(/^([^/]+)\/([^/]+?)(?:\.git)?$/)
  return match ? { owner: match[1], repository: match[2] } : null
}

function dirtyParts(cwd, paths) {
  const suffix = paths.length ? ['--', ...pathspecs(paths)] : []
  const staged = git(cwd, ['diff', '--cached', '--binary', '--no-ext-diff', ...suffix], { binary: true }).stdout
  const unstaged = git(cwd, ['diff', '--binary', '--no-ext-diff', ...suffix], { binary: true }).stdout
  const untrackedOutput = git(cwd, ['ls-files', '--others', '--exclude-standard', '-z', ...suffix], { binary: true }).stdout
  const untracked = untrackedOutput.toString('utf8').split('\0').filter(Boolean).sort()
  return { staged, unstaged, untracked }
}

function dirtyFingerprint(cwd, paths) {
  const hash = createHash('sha256')
  const headSha = resolveCommit(cwd, 'HEAD')
  const { staged, unstaged, untracked } = dirtyParts(cwd, paths)
  hash.update('HEAD\0').update(headSha).update('\0STAGED\0').update(staged).update('\0UNSTAGED\0').update(unstaged)
  for (const path of untracked) {
    const absolute = `${cwd}/${path}`
    const stat = lstatSync(absolute)
    hash.update('\0UNTRACKED\0').update(path).update('\0').update(String(stat.mode)).update('\0')
    hash.update(stat.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute))
  }
  return hash.digest('hex')
}

function dirtyScope(root, paths) {
  const { staged, unstaged, untracked } = dirtyParts(root, paths)
  const included = []
  if (staged.length) included.push('staged')
  if (unstaged.length) included.push('unstaged')
  if (untracked.length) included.push('untracked')
  if (included.length === 0) return null
  return Object.freeze({
    kind: 'dirty',
    advisory: true,
    repository: root,
    description: 'working tree (advisory)',
    comparison: 'working-tree',
    headSha: resolveCommit(root, 'HEAD'),
    paths: Object.freeze([...paths]),
    included: Object.freeze(included),
    fingerprint: dirtyFingerprint(root, paths),
  })
}

function resolveTarget(cwd, target, paths) {
  const root = repoRoot(cwd)
  if (target == null || target.type === 'default') {
    const dirty = dirtyScope(root, paths)
    if (dirty) return dirty
    const defaultRef = defaultBranchRef(root)
    return mergeBaseScope(root, root, defaultRef, 'HEAD', `default branch ${defaultRef}...HEAD`, paths)
  }
  if (!target || typeof target !== 'object') fail('INVALID_TARGET', 'target must be a structured target object')
  if (target.type === 'ref') {
    if (typeof target.ref !== 'string' || !target.ref) fail('INVALID_TARGET', 'ref target requires a nonempty ref')
    return mergeBaseScope(root, root, target.ref, 'HEAD', `ref ${target.ref}...HEAD`, paths)
  }
  if (target.type === 'merge-base') {
    if (typeof target.base !== 'string' || !target.base) fail('INVALID_TARGET', 'merge-base target requires a base ref')
    const head = target.head ?? 'HEAD'
    if (typeof head !== 'string' || !head) fail('INVALID_TARGET', 'merge-base target head must be a nonempty ref')
    return mergeBaseScope(root, root, target.base, head, `merge-base ${target.base}...${head}`, paths)
  }
  if (target.type === 'range') {
    const [baseRef, headRef] = parseRange(target.expression)
    const baseSha = resolveCommit(root, baseRef)
    const headSha = resolveCommit(root, headRef)
    return finishCommittedScope({
      cwd: root,
      root,
      description: `range ${target.expression}`,
      comparison: 'two-dot',
      baseSha,
      headSha,
      paths,
    })
  }
  if (target.type === 'pr') {
    const pr = parsePrUrl(target.url)
    if (typeof target.base !== 'string' || !target.base) {
      fail('INVALID_TARGET', 'PR target requires the PR base ref or commit from trusted coordinator metadata')
    }
    const headRef = `refs/pull/${pr.number}/head`
    const headResult = spawnSync('git', ['rev-parse', '--verify', '--end-of-options', `${headRef}^{commit}`], { cwd: root, encoding: 'utf8' })
    if (headResult.status !== 0) {
      fail('PR_OBJECTS_UNAVAILABLE', `PR #${pr.number} objects are unavailable locally; coordinator-side preparation is required`)
    }
    const identity = originIdentity(root)
    if (!identity || identity.owner.toLowerCase() !== pr.owner.toLowerCase() || identity.repository.toLowerCase() !== pr.repository.toLowerCase()) {
      fail('PR_REPOSITORY_MISMATCH', `PR URL does not match this repository's GitHub origin`)
    }
    return mergeBaseScope(root, root, target.base, headRef, `PR ${target.url}`, paths)
  }
  fail('INVALID_TARGET', `unsupported target type '${target.type}'`)
}

export function prepareSnipeRequest(input = {}) {
  if (!input || typeof input !== 'object') fail('INVALID_ARGUMENTS', 'request must be an object')
  const parsed = parseSnipeArgs(input.rawArgs ?? '')
  if (parsed.errors.length) fail('INVALID_ARGUMENTS', parsed.errors.join('; '))
  if (RESERVED_LENSES.includes(parsed.target)) {
    fail('INVALID_ARGUMENTS', `lens '${parsed.target}' is reserved for built-in passes (${RESERVED_LENSES.join('|')}) — not snipe-selectable`)
  }
  if (parsed.target) {
    fail('AMBIGUOUS_TARGET', "Codex target text must use the structured 'target' field; rawArgs accepts only seats and lenses")
  }
  const paths = normalizePaths(input.paths)
  const profile = resolveProfile(input)
  const scope = resolveTarget(input.cwd ?? process.cwd(), input.target, paths)
  return Object.freeze({
    panel: Object.freeze({ seats: parsed.seats, named: Object.freeze([...parsed.named]), autoCount: parsed.autoCount }),
    profile,
    scope,
  })
}

export function verifySnipeScope(scope) {
  if (!scope || typeof scope !== 'object') fail('INVALID_TARGET', 'scope is required')
  if (scope.kind === 'committed') {
    resolveCommit(scope.repository, scope.baseSha)
    resolveCommit(scope.repository, scope.headSha)
    return { stable: true, before: null, after: null }
  }
  if (scope.kind !== 'dirty') fail('INVALID_TARGET', `unknown scope kind '${scope.kind}'`)
  const after = dirtyFingerprint(scope.repository, scope.paths)
  return { stable: after === scope.fingerprint, before: scope.fingerprint, after }
}
