import { execFile, execFileSync } from 'node:child_process'
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const gitOptions = ['--no-optional-locks', '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'submodule.recurse=false', '-c', 'protocol.allow=never']
const inside = (root, path) => path === root || path.startsWith(root + sep)

// Do not inherit Git routing, lazy-fetch, replace-object, helper or URL-rewrite settings.
function gitEnvironment() {
  return {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_NO_LAZY_FETCH: '1', GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0',
    GIT_SSH_COMMAND: 'ssh -oBatchMode=yes -oPermitLocalCommand=no',
  }
}

function safePath(path) {
  return typeof path === 'string' && path.length > 0 && !isAbsolute(path)
    && !/[\\\x00-\x1f\x7f]/.test(path) && path.split('/').every(part => part && !['.', '..', '.git'].includes(part.toLowerCase()))
}

export function localSubmoduleRepository(root, path) {
  if (!safePath(path)) return null
  try {
    let nested = realpathSync(root)
    for (const part of path.split('/')) {
      nested = join(nested, part)
      if (!lstatSync(nested).isDirectory() || lstatSync(nested).isSymbolicLink()) return null
    }
    if (lstatSync(join(nested, '.git')).isSymbolicLink()) return null
    const read = (cwd, ...args) => execFileSync('git', [...gitOptions, ...args], { cwd, env: gitEnvironment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000 }).trim()
    if (realpathSync(read(nested, 'rev-parse', '--show-toplevel')) !== nested) return null
    const gitDir = realpathSync(read(nested, 'rev-parse', '--absolute-git-dir'))
    const common = realpathSync(resolve(root, read(root, 'rev-parse', '--git-common-dir')))
    if (!inside(nested, gitDir) && !inside(join(common, 'modules'), gitDir)) return null
    return nested
  } catch { return null }
}

export function localCommitAvailable(repository, object) {
  if (!object) return true
  try {
    execFileSync('git', [...gitOptions, 'cat-file', '-e', `${object}^{commit}`], { cwd: repository, env: gitEnvironment(), stdio: 'pipe', timeout: 5000 })
    return true
  } catch { return false }
}

async function git(cwd, args, { input, signal } = {}) {
  const pending = exec('git', [...gitOptions, ...args], {
    cwd, env: gitEnvironment(), encoding: 'buffer', timeout: 30000,
    maxBuffer: 64 * 1024 * 1024, signal, detached: process.platform !== 'win32',
  })
  const stop = () => {
    try {
      if (process.platform !== 'win32' && pending.child.pid) process.kill(-pending.child.pid, 'SIGKILL')
      else pending.child.kill('SIGKILL')
    } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  const timer = setTimeout(stop, 30000)
  signal?.addEventListener('abort', stop, { once: true })
  pending.child.once('exit', stop)
  pending.child.stdin.on('error', () => {}) // Early Git exits are reported by the process result.
  pending.child.stdin.end(input)
  try { return (await pending).stdout } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', stop)
    stop()
  }
}

async function copyCommit(source, destination, sha, signal) {
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('invalid gitlink commit')
  await git(source, ['cat-file', '-e', `${sha}^{commit}`], { signal })
  const tree = (await git(source, ['rev-parse', `${sha}^{tree}`], { signal })).toString().trim()
  const entries = (await git(source, ['ls-tree', '-r', '-t', '-z', sha], { signal })).toString().split('\0').filter(Boolean)
  const objects = new Set([sha, tree])
  for (const entry of entries) {
    const match = entry.match(/^\d+ (blob|tree) ([0-9a-f]{40})\t/)
    if (match) objects.add(match[2])
  }
  // Explicit object IDs avoid walking history, invoking upload-pack, or copying source config.
  const pack = await git(source, ['pack-objects', '--stdout'], { input: [...objects].join('\n') + '\n', signal })
  await git(destination, ['index-pack', '--stdin'], { input: pack, signal })
}

function remoteIdentity(value, parent) {
  if (typeof value !== 'string' || /[\\\s\x00-\x1f\x7f%]/.test(value)) throw new Error('unsupported submodule remote URL')
  const scp = value.match(/^git@([a-zA-Z0-9.-]+):(.+)$/)
  let url
  try {
    if (value.startsWith('./') || value.startsWith('../')) {
      const base = remoteIdentity(parent)
      url = new URL(value, base.url.replace(/\/$/, '') + '/')
    } else url = new URL(scp ? `ssh://git@${scp[1]}/${scp[2]}` : value)
  } catch { throw new Error('submodule remote must be an absolute HTTPS or Git SSH URL (relative metadata needs a verified parent remote)') }
  const loopback = url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname)
  if ((!['https:', 'ssh:'].includes(url.protocol) && !loopback) || url.password || url.search || url.hash
    || (url.protocol === 'ssh:' ? url.username !== 'git' : Boolean(url.username))
    || (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(url.hostname) && url.hostname !== '[::1]')
    || !url.hostname || !/^\/(?:[a-zA-Z0-9_][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9_][a-zA-Z0-9._-]*\/?$/.test(url.pathname)) {
    throw new Error('unsupported submodule remote URL; credentials, helpers, redirects and arbitrary transports are not allowed')
  }
  return { url: url.href, identity: `${url.host.toLowerCase()}${url.pathname.replace(/\/$/, '').replace(/\.git$/, '')}` }
}

async function moduleRemote(repository, revision, path, signal) {
  let data
  if (revision === 'working-tree') {
    const file = join(repository, '.gitmodules')
    if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) throw new Error('working-tree .gitmodules must be a regular file')
    data = readFileSync(file)
  } else data = await git(repository, ['cat-file', 'blob', `${revision}:.gitmodules`], { signal })
  if (data.length > 1024 * 1024) throw new Error('.gitmodules exceeds preparation limit')
  const config = await git(repository, ['config', '--no-includes', '--file', '-', '--null', '--get-regexp', '^submodule\\..*\\.(path|url)$'], { input: data, signal })
  const entries = new Map()
  for (const field of config.toString().split('\0').filter(Boolean)) {
    const newline = field.indexOf('\n')
    const key = field.slice(0, newline).match(/^submodule\.(.+)\.(path|url)$/)
    if (!key) continue
    const entry = entries.get(key[1]) ?? {}
    if (Object.hasOwn(entry, key[2])) throw new Error('ambiguous .gitmodules entry')
    entry[key[2]] = field.slice(newline + 1)
    entries.set(key[1], entry)
  }
  const matches = [...entries.values()].filter(entry => entry.path === path)
  if (matches.length !== 1 || !matches[0].url) throw new Error('no unique pinned .gitmodules remote for submodule path')
  return matches[0].url
}

function metadataRevisions(scope, change) {
  if (scope.kind === 'committed') return [scope.baseSha, scope.headSha]
  return change.source === 'staged' ? [scope.headSha, ''] : ['', 'working-tree']
}

async function nestedChanges(repository, base, head, signal) {
  async function pins(sha) {
    if (!sha) return new Map()
    const entries = (await git(repository, ['ls-tree', '-r', '-z', sha], { signal })).toString().split('\0')
    return new Map(entries.flatMap(entry => {
      const match = entry.match(/^160000 commit ([0-9a-f]{40})\t([\s\S]+)$/)
      return match ? [[match[2], match[1]]] : []
    }))
  }
  const before = await pins(base)
  const after = await pins(head)
  return [...new Set([...before.keys(), ...after.keys()])].filter(path => before.get(path) !== after.get(path))
    .map(path => ({ path, baseObject: before.get(path) ?? null, headObject: after.get(path) ?? null }))
}

export async function prepareSnipeSubmodules(scope, { remotes = {}, signal } = {}) {
  if (!remotes || typeof remotes !== 'object' || Array.isArray(remotes)
    || Object.entries(remotes).some(([path, url]) => !safePath(path) || typeof url !== 'string')) {
    throw new TypeError('submoduleRemotes must map literal repository-relative submodule paths to approved remote URLs')
  }
  if (!scope.submodules?.length) return { scope, dispose() {} }
  signal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(120000)])
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'snipe-submodule-review-')))
  const dispose = () => rmSync(temporary, { recursive: true, force: true })
  try {
    const changes = []
    let origin
    try { origin = (await git(scope.repository, ['config', '--local', '--no-includes', '--get', 'remote.origin.url'], { signal })).toString().trim() } catch { /* Absolute metadata needs no parent URL. */ }
    const queue = scope.submodules.map(change => ({ change, repository: scope.repository, relativePath: change.path, revisions: metadataRevisions(scope, change), parentRemote: origin, depth: 0 }))
    for (const { change, repository, relativePath, revisions, parentRemote, depth } of queue) {
      const destination = join(temporary, String(changes.length))
      try {
        if (changes.length >= 32 || depth >= 4) throw new Error('submodule preparation count/depth limit reached; coverage is incomplete')
        if (signal.aborted) throw new Error('submodule preparation cancelled or timed out')
        if (!safePath(change.path)) throw new Error('unsafe submodule path')
        if (change.unresolvedHead) throw new Error('working-tree submodule head could not be pinned')
        if (change.nestedDirty) throw new Error('nested submodule has uncommitted content')
        mkdirSync(destination)
        await git(destination, ['init', '--bare', '--template='], { signal })
        const sources = [localSubmoduleRepository(scope.repository, change.path), repository].filter(Boolean)
        for (const sha of [change.baseObject, change.headObject].filter(Boolean)) {
          let copied = false
          for (const source of sources) {
            try { await copyCommit(source, destination, sha, signal); copied = true; break } catch { /* Try the next local source. */ }
          }
          if (!copied) {
            if (!Object.hasOwn(remotes, change.path)) throw new Error(`pinned submodule commit ${sha} is unavailable locally; provide an explicitly approved submoduleRemotes entry`)
            const approved = remoteIdentity(remotes[change.path])
            for (const [index, object] of [change.baseObject, change.headObject].entries()) {
              if (!object) continue
              const recorded = await moduleRemote(repository, revisions[index], relativePath, signal)
              if (remoteIdentity(recorded, parentRemote).identity !== approved.identity) throw new Error('approved remote does not match pinned .gitmodules provenance')
            }
            await git(destination, ['-c', 'protocol.https.allow=always', '-c', 'protocol.ssh.allow=always', '-c', 'protocol.http.allow=always', '-c', 'http.followRedirects=false', 'fetch', '--depth=1', '--no-tags', '--no-recurse-submodules', '--no-write-fetch-head', approved.url, sha], { signal })
            // Require the exact commit and its tree/blob closure, not just a successful fetch.
            await copyCommit(destination, destination, sha, signal)
          }
        }
        const children = await nestedChanges(destination, change.baseObject, change.headObject, signal)
        let remote
        try {
          const recorded = await moduleRemote(repository, revisions[change.headObject ? 1 : 0], relativePath, signal)
          remote = remoteIdentity(recorded, parentRemote).url
        } catch { /* Local objects or absolute nested URLs do not require a parent remote. */ }
        for (const child of children) queue.push({
          change: { ...child, path: `${change.path}/${child.path}` }, repository: destination,
          relativePath: child.path, revisions: [change.baseObject, change.headObject], parentRemote: remote, depth: depth + 1,
        })
        changes.push(Object.freeze({ ...change, contentsAvailable: true, limitation: null, reviewRepository: destination }))
      } catch (error) {
        changes.push(Object.freeze({ ...change, contentsAvailable: false, limitation: error.message.slice(0, 1000) }))
      }
    }
    return { scope: Object.freeze({ ...scope, submodules: Object.freeze(changes) }), dispose }
  } catch (error) { dispose(); throw error }
}
