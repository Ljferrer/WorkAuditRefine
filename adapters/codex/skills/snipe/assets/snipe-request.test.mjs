import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import os from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  prepareSnipeRequest,
  verifySnipeScope,
  githubOriginIdentity,
} from './snipe-request.mjs'

const supportedProfiles = {
  'gpt-test': ['low', 'high'],
  'gpt-fast': ['low'],
}
const inheritedProfile = { model: 'gpt-test', effort: 'high' }

test('GitHub origin identity resolves a declarative trusted SSH alias without connecting', () => {
  const directory = mkdtempSync(join(tmpdir(), 'snipe-ssh-'))
  const config = join(directory, 'config')
  writeFileSync(config, 'Host SQP.github.com\n  HostName github.com\n  IdentityFile ~/.ssh/key\n')
  for (const remote of ['git@SQP.github.com:example/project.git', 'ssh://git@SQP.github.com/example/project.git']) {
    assert.deepEqual(githubOriginIdentity(remote, config), { owner: 'example', repository: 'project' })
  }
})

test('SSH alias identity respects first-value, wildcard and negated Host matching', () => {
  const config = join(mkdtempSync(join(tmpdir(), 'snipe-ssh-')), 'config')
  writeFileSync(config, 'Host *.github.com !blocked.github.com\n HostName = "github.com" # approved host\nHost *\n HostName elsewhere.invalid\n')
  assert.deepEqual(githubOriginIdentity('git@SQP.github.com:example/project.git', config), { owner: 'example', repository: 'project' })
  assert.equal(githubOriginIdentity('git@blocked.github.com:example/project.git', config), null)
  writeFileSync(config, 'Host *\n HostName evilgithub.com\nHost SQP.github.com\n HostName github.com\n')
  assert.equal(githubOriginIdentity('git@SQP.github.com:example/project.git', config), null)
})

test('SSH alias identity refuses ambiguous config and never executes its commands', () => {
  const directory = mkdtempSync(join(tmpdir(), 'snipe-ssh-'))
  const config = join(directory, 'config')
  const marker = join(directory, 'executed')
  for (const extra of [`Match exec "touch ${marker}"`, 'Include other.conf', 'CanonicalizeHostname yes', 'HostName %h', 'Host [invalid]']) {
    writeFileSync(config, `Host SQP.github.com\n HostName github.com\n${extra}\n`)
    assert.equal(githubOriginIdentity('git@SQP.github.com:example/project.git', config), null, extra)
  }
  writeFileSync(config, `Host SQP.github.com\n HostName github.com\n ProxyCommand touch ${marker}\n LocalCommand touch ${marker}\n`)
  assert.ok(githubOriginIdentity('git@SQP.github.com:example/project.git', config))
  assert.equal(existsSync(marker), false)
  chmodSync(config, 0o666)
  assert.equal(githubOriginIdentity('git@SQP.github.com:example/project.git', config), null)
  assert.equal(githubOriginIdentity('git@SQP.github.com:example/project.git', join(directory, 'missing')), null)
})

test('GitHub origin identity rejects malformed, lookalike and injection-shaped remotes', () => {
  const config = join(mkdtempSync(join(tmpdir(), 'snipe-ssh-')), 'config')
  writeFileSync(config, 'Host SQP.github.com\n HostName github.com\n')
  for (const remote of [
    'https://evilgithub.com/example/project.git', 'https://github.com.evil/example/project.git',
    'http://github.com/example/project.git', 'file://github.com/example/project.git',
    'https://user:password@github.com/example/project.git',
    'git@unknown.github.com:example/project.git', 'ssh://git@SQP.github.com:2222/example/project.git',
    'git@SQP.github.com:example/project.git;touch-marker', 'git@-oProxyCommand=touch:example/project.git',
    'git@SQP.github.com:example/../project.git', 'git@SQP.github.com:example/%70roject.git',
    'git@SQP.github.com:example/project.git\n', 'ssh://git@SQP.github.com/example/project.git?x',
  ]) assert.equal(githubOriginIdentity(remote, config), null, remote)
  for (const remote of ['https://github.com/example/project.git', 'git@github.com:example/project.git', 'ssh://git@github.com:22/example/project.git']) {
    assert.deepEqual(githubOriginIdentity(remote, config), { owner: 'example', repository: 'project' })
  }
})

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'codex-snipe-request-'))
  git(root, 'init', '-b', 'main')
  git(root, 'config', 'user.email', 'snipe-test@example.invalid')
  git(root, 'config', 'user.name', 'Snipe Test')
  git(root, 'remote', 'add', 'origin', 'https://github.com/example/project.git')
  writeFileSync(join(root, 'review.txt'), 'base\n')
  git(root, 'add', 'review.txt')
  git(root, 'commit', '-m', 'base')
  const base = git(root, 'rev-parse', 'HEAD')
  git(root, 'update-ref', 'refs/remotes/origin/main', base)
  git(root, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')
  writeFileSync(join(root, 'review.txt'), 'base\nchange\n')
  git(root, 'commit', '-am', 'change')
  return { root, base, head: git(root, 'rev-parse', 'HEAD') }
}

function prepare(root, overrides = {}) {
  return prepareSnipeRequest({
    cwd: root,
    rawArgs: '',
    inheritedProfile,
    supportedProfiles,
    ...overrides,
  })
}

test('scope capture does not execute repository-configured fsmonitor or text conversion commands', () => {
  const { root } = fixture()
  const temporary = mkdtempSync(join(tmpdir(), 'snipe-config-command-'))
  const script = join(temporary, 'probe')
  const marker = join(temporary, 'executed')
  writeFileSync(script, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed')\n`)
  chmodSync(script, 0o755)
  git(root, 'config', 'core.fsmonitor', script)
  git(root, 'config', 'diff.probe.textconv', script)
  writeFileSync(join(root, '.gitattributes'), '*.txt diff=probe\n')
  writeFileSync(join(root, 'review.txt'), 'dirty\n')
  prepare(root)
  assert.equal(existsSync(marker), false)
})

test('default request reuses legacy seat/lens parsing and pins the default-branch comparison', () => {
  const { root, base, head } = fixture()
  const request = prepare(root, { rawArgs: '2 correctness,custom-lens' })

  assert.deepEqual(request.panel, {
    seats: 2,
    named: ['correctness', 'custom-lens'],
    autoCount: 0,
  })
  assert.deepEqual(request.profile, inheritedProfile)
  assert.equal(request.scope.kind, 'committed')
  assert.equal(request.scope.comparison, 'merge-base')
  assert.equal(request.scope.baseSha, base)
  assert.equal(request.scope.headSha, head)
  assert.equal(request.scope.advisory, false)
})

test('invalid seats, duplicate/reserved lenses, and unsupported profiles fail visibly', () => {
  const { root } = fixture()
  assert.throws(() => prepare(root, { rawArgs: '0' }), error => error.code === 'INVALID_ARGUMENTS')
  assert.throws(() => prepare(root, { rawArgs: 'correctness,correctness' }), error => error.code === 'INVALID_ARGUMENTS')
  assert.throws(() => prepare(root, { rawArgs: 'execution-evidence,correctness' }), error => error.code === 'INVALID_ARGUMENTS')
  assert.throws(() => prepare(root, { rawArgs: 'execution-evidence' }), error => error.code === 'INVALID_ARGUMENTS')
  assert.throws(
    () => prepare(root, { profile: { model: 'gpt-unknown', effort: 'high' } }),
    error => error.code === 'UNSUPPORTED_PROFILE',
  )
  assert.throws(
    () => prepare(root, { profile: { model: 'gpt-fast', effort: 'high' } }),
    error => error.code === 'UNSUPPORTED_PROFILE',
  )
})

test('legacy target text is rejected in favor of the explicit target envelope', () => {
  const { root } = fixture()
  assert.throws(
    () => prepare(root, { rawArgs: '123 2 correctness,security' }),
    error => error.code === 'AMBIGUOUS_TARGET' && /target/.test(error.message),
  )
})

test('explicit two-dot and merge-base targets retain distinct comparison semantics', () => {
  const { root, base, head } = fixture()
  const range = prepare(root, { target: { type: 'range', expression: `${base}..${head}` } })
  const mergeBase = prepare(root, { target: { type: 'merge-base', base: 'refs/remotes/origin/main', head: 'HEAD' } })

  assert.equal(range.scope.comparison, 'two-dot')
  assert.equal(range.scope.baseSha, base)
  assert.equal(range.scope.headSha, head)
  assert.equal(mergeBase.scope.comparison, 'merge-base')
  assert.equal(mergeBase.scope.baseSha, base)
  assert.equal(mergeBase.scope.headSha, head)
})

test('literal path filters preserve spaces and shell metacharacters without execution', () => {
  const { root, base } = fixture()
  const path = 'space $(touch SHOULD_NOT_EXIST); quote\' file.txt'
  writeFileSync(join(root, path), 'new\n')
  git(root, 'add', '--', path)
  git(root, 'commit', '-m', 'literal path')

  const request = prepare(root, {
    target: { type: 'range', expression: `${base}..HEAD` },
    paths: [path],
  })
  assert.deepEqual(request.scope.paths, [path])
  assert.throws(() => readFileSync(join(root, 'SHOULD_NOT_EXIST')))
})

test('git pathspec magic is treated as literal path content', () => {
  const { root, base } = fixture()
  const path = ':(glob)*.txt'
  writeFileSync(join(root, path), 'literal magic\n')
  git(root, 'add', '--', `:(literal)${path}`)
  git(root, 'commit', '-m', 'literal pathspec magic')

  const request = prepare(root, {
    target: { type: 'range', expression: `${base}..HEAD` },
    paths: [path],
  })
  assert.deepEqual(request.scope.paths, [path])
})

test('injection-shaped refs are literal git arguments and cannot run commands', () => {
  const { root } = fixture()
  const marker = join(root, 'SHOULD_NOT_EXIST')
  assert.throws(
    () => prepare(root, { target: { type: 'ref', ref: 'HEAD;touch SHOULD_NOT_EXIST' } }),
    error => error.code === 'MISSING_REF',
  )
  assert.throws(() => readFileSync(marker))
})

test('a locally prepared PR URL resolves against the matching origin and pins its commits', () => {
  const { root, head: prBase } = fixture()
  writeFileSync(join(root, 'pr-only.txt'), 'pull request head\n')
  git(root, 'add', 'pr-only.txt')
  git(root, 'commit', '-m', 'pull request head')
  const prHead = git(root, 'rev-parse', 'HEAD')
  git(root, 'update-ref', 'refs/pull/7/head', prHead)
  const request = prepare(root, {
    target: { type: 'pr', url: 'https://github.com/example/project/pull/7', base: prBase },
    profile: { model: 'gpt-fast', effort: 'low' },
  })

  assert.deepEqual(request.profile, { model: 'gpt-fast', effort: 'low' })
  assert.equal(request.scope.baseSha, prBase, 'uses the declared PR base, not origin/HEAD')
  assert.equal(request.scope.headSha, prHead)
  assert.match(request.scope.description, /pull\/7/)
})

test('PR identity rejects a lookalike GitHub origin host', () => {
  const { root, head } = fixture()
  git(root, 'remote', 'set-url', 'origin', 'https://evilgithub.com/example/project.git')
  git(root, 'update-ref', 'refs/pull/7/head', head)

  assert.throws(
    () => prepare(root, {
      target: { type: 'pr', url: 'https://github.com/example/project/pull/7', base: 'refs/remotes/origin/main' },
    }),
    error => error.code === 'PR_REPOSITORY_MISMATCH',
  )
})

test('PR targets resolve SSH aliases through the host config and retain repository matching', t => {
  const { root, base, head } = fixture()
  const hostHome = mkdtempSync(join(tmpdir(), 'snipe-host-'))
  mkdirSync(join(hostHome, '.ssh'))
  writeFileSync(join(hostHome, '.ssh', 'config'), 'Host SQP.github.com\n HostName github.com\n')
  t.mock.method(os, 'homedir', () => hostHome)
  git(root, 'remote', 'set-url', 'origin', 'git@SQP.github.com:example/project.git')
  git(root, 'update-ref', 'refs/pull/7/head', head)
  const target = { type: 'pr', url: 'https://github.com/example/project/pull/7', base }
  const before = git(root, 'status', '--porcelain=v1')
  const request = prepare(root, { target })
  assert.equal(request.scope.baseSha, base)
  assert.equal(request.scope.headSha, head)
  for (const url of ['https://github.com/other/project/pull/7', 'https://github.com/example/other/pull/7']) {
    assert.throws(() => prepare(root, { target: { ...target, url } }), error => error.code === 'PR_REPOSITORY_MISMATCH')
  }
  const marker = join(hostHome, 'executed')
  git(root, 'config', 'core.sshCommand', `touch ${marker}`)
  assert.throws(() => prepare(root, { target }), error => error.code === 'PR_REPOSITORY_MISMATCH')
  assert.equal(existsSync(marker), false)
  assert.equal(git(root, 'status', '--porcelain=v1'), before)
})

test('missing refs, empty diffs, and unavailable PR objects are distinct failures', () => {
  const { root, head } = fixture()
  assert.throws(
    () => prepare(root, { target: { type: 'ref', ref: 'refs/heads/missing' } }),
    error => error.code === 'MISSING_REF',
  )
  assert.throws(
    () => prepare(root, { target: { type: 'range', expression: `${head}..${head}` } }),
    error => error.code === 'EMPTY_DIFF',
  )
  assert.throws(
    () => prepare(root, { target: { type: 'pr', url: 'https://github.com/example/project/pull/42', base: 'HEAD' } }),
    error => error.code === 'PR_OBJECTS_UNAVAILABLE',
  )
})

test('explicit committed scope ignores unrelated dirty checkout changes', () => {
  const { root, base, head } = fixture()
  writeFileSync(join(root, 'unrelated.txt'), 'dirty\n')
  const request = prepare(root, { target: { type: 'range', expression: `${base}..${head}` } })

  assert.equal(request.scope.kind, 'committed')
  assert.equal(request.scope.advisory, false)
  assert.deepEqual(verifySnipeScope(request.scope), {
    stable: true,
    before: null,
    after: null,
  })
})

test('committed gitlink changes are disclosed as Snipe scope instead of phase-refused', () => {
  const { root } = fixture()
  const nested = mkdtempSync(join(tmpdir(), 'codex-snipe-submodule-'))
  git(nested, 'init', '-b', 'main')
  git(nested, 'config', 'user.email', 'snipe-test@example.invalid')
  git(nested, 'config', 'user.name', 'Snipe Test')
  writeFileSync(join(nested, 'nested.txt'), 'nested\n')
  git(nested, 'add', 'nested.txt')
  git(nested, 'commit', '-m', 'nested base')
  const nestedHead = git(nested, 'rev-parse', 'HEAD')
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', nested, 'vendor/engine')
  git(root, 'commit', '-am', 'add submodule')

  const request = prepare(root)
  assert.deepEqual(request.scope.submodules, [{
    path: 'vendor/engine',
    baseObject: null,
    headObject: nestedHead,
    contentsAvailable: true,
    limitation: null,
  }])
})

test('dirty staged gitlink changes disclose their exact pointer and availability', () => {
  const { root } = fixture()
  const nested = mkdtempSync(join(tmpdir(), 'codex-snipe-dirty-submodule-'))
  git(nested, 'init', '-b', 'main')
  git(nested, 'config', 'user.email', 'snipe-test@example.invalid')
  git(nested, 'config', 'user.name', 'Snipe Test')
  writeFileSync(join(nested, 'nested.txt'), 'base\n')
  git(nested, 'add', 'nested.txt')
  git(nested, 'commit', '-m', 'nested base')
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', nested, 'vendor/engine')
  git(root, 'commit', '-am', 'add submodule')
  const oldObject = git(root, 'rev-parse', 'HEAD:vendor/engine')

  writeFileSync(join(root, 'vendor/engine', 'nested.txt'), 'base\nadvance\n')
  git(join(root, 'vendor/engine'), 'commit', '-am', 'nested advance')
  const newObject = git(join(root, 'vendor/engine'), 'rev-parse', 'HEAD')
  git(root, 'add', 'vendor/engine')

  const request = prepare(root)
  assert.equal(request.scope.kind, 'dirty')
  assert.deepEqual(request.scope.submodules, [{
    path: 'vendor/engine',
    baseObject: oldObject,
    headObject: newObject,
    contentsAvailable: true,
    limitation: null,
    source: 'staged',
  }])
})

test('dirty unstaged gitlink changes disclose the checked-out pointer', () => {
  const { root } = fixture()
  const nested = mkdtempSync(join(tmpdir(), 'codex-snipe-unstaged-submodule-'))
  git(nested, 'init', '-b', 'main')
  git(nested, 'config', 'user.email', 'snipe-test@example.invalid')
  git(nested, 'config', 'user.name', 'Snipe Test')
  writeFileSync(join(nested, 'nested.txt'), 'base\n')
  git(nested, 'add', 'nested.txt')
  git(nested, 'commit', '-m', 'nested base')
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', nested, 'vendor/engine')
  git(root, 'commit', '-am', 'add submodule')
  const oldObject = git(root, 'rev-parse', 'HEAD:vendor/engine')

  writeFileSync(join(root, 'vendor/engine', 'nested.txt'), 'base\nadvance\n')
  git(join(root, 'vendor/engine'), 'commit', '-am', 'nested advance')
  const newObject = git(join(root, 'vendor/engine'), 'rev-parse', 'HEAD')

  const request = prepare(root)
  assert.equal(request.scope.kind, 'dirty')
  assert.deepEqual(request.scope.submodules, [{
    path: 'vendor/engine',
    baseObject: oldObject,
    headObject: newObject,
    contentsAvailable: true,
    limitation: null,
    source: 'unstaged',
  }])
})

test('uncommitted nested submodule content is disclosed as uncaptured and unstable', () => {
  const { root } = fixture()
  const nested = mkdtempSync(join(tmpdir(), 'codex-snipe-uncommitted-submodule-'))
  git(nested, 'init', '-b', 'main')
  git(nested, 'config', 'user.email', 'snipe-test@example.invalid')
  git(nested, 'config', 'user.name', 'Snipe Test')
  writeFileSync(join(nested, 'nested.txt'), 'base\n')
  git(nested, 'add', 'nested.txt')
  git(nested, 'commit', '-m', 'nested base')
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', nested, 'vendor/engine')
  git(root, 'commit', '-am', 'add submodule')
  const pinnedObject = git(root, 'rev-parse', 'HEAD:vendor/engine')

  writeFileSync(join(root, 'vendor/engine', 'nested.txt'), 'uncommitted one\n')
  const request = prepare(root)
  assert.deepEqual(request.scope.submodules, [{
    path: 'vendor/engine',
    baseObject: pinnedObject,
    headObject: pinnedObject,
    contentsAvailable: false,
    limitation: 'nested submodule has uncommitted content; exact scope stability cannot be proven',
    nestedDirty: true,
    source: 'unstaged',
  }])
  assert.equal(verifySnipeScope(request.scope).stable, false)

  writeFileSync(join(root, 'vendor/engine', 'nested.txt'), 'uncommitted two\n')
  assert.equal(verifySnipeScope(request.scope).stable, false)
})

test('dirty default includes staged, unstaged, and untracked content and detects later changes', () => {
  const { root, head } = fixture()
  writeFileSync(join(root, 'staged.txt'), 'staged\n')
  git(root, 'add', 'staged.txt')
  writeFileSync(join(root, 'review.txt'), 'base\nchange\nunstaged\n')
  mkdirSync(join(root, 'untracked dir'))
  writeFileSync(join(root, 'untracked dir', 'file.txt'), 'untracked\n')

  const request = prepare(root)
  assert.equal(request.scope.kind, 'dirty')
  assert.equal(request.scope.advisory, true)
  assert.equal(request.scope.headSha, head)
  assert.deepEqual(request.scope.included, ['staged', 'unstaged', 'untracked'])
  assert.deepEqual(verifySnipeScope(request.scope), {
    stable: true,
    before: request.scope.fingerprint,
    after: request.scope.fingerprint,
  })

  writeFileSync(join(root, 'untracked dir', 'file.txt'), 'changed during review\n')
  const changed = verifySnipeScope(request.scope)
  assert.equal(changed.stable, false)
  assert.equal(changed.before, request.scope.fingerprint)
  assert.notEqual(changed.after, request.scope.fingerprint)
})
