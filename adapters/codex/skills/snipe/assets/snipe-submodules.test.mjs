import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { prepareSnipeRequest } from './snipe-request.mjs'
import { localSubmoduleRepository, prepareSnipeSubmodules } from './snipe-submodules.mjs'

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function repository() {
  const root = mkdtempSync(join(tmpdir(), 'snipe-submodules-test-'))
  git(root, 'init', '-b', 'main')
  git(root, 'config', 'user.name', 'Snipe Test')
  git(root, 'config', 'user.email', 'snipe@example.invalid')
  writeFileSync(join(root, 'code.txt'), 'base\n')
  writeFileSync(join(root, 'identity.txt'), root)
  git(root, 'add', '.')
  git(root, 'commit', '-m', 'base')
  return root
}

function fixture() {
  const root = repository()
  const child = repository()
  const baseObject = git(child, 'rev-parse', 'HEAD')
  writeFileSync(join(child, 'code.txt'), 'changed\n')
  git(child, 'commit', '-am', 'change')
  const headObject = git(child, 'rev-parse', 'HEAD')
  mkdirSync(join(root, 'vendor'))
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', child, 'vendor/utils')
  git(root, 'update-index', '--cacheinfo', '160000', baseObject, 'vendor/utils')
  git(root, 'commit', '-m', 'base submodule')
  const base = git(root, 'rev-parse', 'HEAD')
  git(root, 'add', 'vendor/utils')
  git(root, 'commit', '-m', 'advance submodule')
  return { root, child, baseObject, headObject, input: { cwd: root, target: { type: 'ref', ref: base }, profile: { model: 'test', effort: 'low' }, supportedProfiles: { test: ['low'] } } }
}

test('cleanup denial stops preparation without source fallback and retains review objects', async t => {
  const f=fixture(), scope=prepareSnipeRequest(f.input).scope
  t.after(()=>{rmSync(f.root,{recursive:true,force:true});rmSync(f.child,{recursive:true,force:true})})
  for(const failAt of [1,2,3,8]) {
    const original=process.kill, groups=[]
    let retained, failure
    process.kill=(pid,signal)=>{
      if(pid < -1){groups.push(pid);if(groups.length===failAt)throw Object.assign(new Error('injected Git denial'),{code:'EPERM'})}
      return original(pid,signal)
    }
    try {
      await assert.rejects(prepareSnipeSubmodules(scope), error=>{failure=error;retained=error.retainedRoot;return error.code==='SUBMODULE_CLEANUP_FAILED'})
      assert.equal(failure.cleanupError.code,'EPERM')
      assert.equal(failure.terminationConfirmed,false)
      assert.equal(failure.processGroupId,-groups.at(-1))
      assert.equal(groups.length,failAt,'no subsequent Git operation or fallback after denied cleanup')
      assert.equal(existsSync(retained),true)
      assert.match(failure.message,/operator cleanup required/)
    } finally {
      process.kill=original
      for(const group of groups)try{original(group,'SIGKILL')}catch(error){if(error.code!=='ESRCH')throw error}
      if(retained)rmSync(retained,{recursive:true,force:true})
    }
  }
})

test('preparation copies exact local gitlink contents into a disposable read-only review repository', async () => {
  const { root, input, baseObject, headObject } = fixture()
  const before = git(root, 'status', '--porcelain=v2')
  const beforeHead = git(join(root, 'vendor/utils'), 'rev-parse', 'HEAD')
  const beforeIndex = readFileSync(join(root, '.git/index'))
  const prepared = await prepareSnipeSubmodules(prepareSnipeRequest(input).scope)
  const change = prepared.scope.submodules[0]
  try {
    assert.equal(change.contentsAvailable, true)
    assert.notEqual(change.reviewRepository, join(root, 'vendor/utils'))
    assert.equal(git(change.reviewRepository, 'show', `${baseObject}:code.txt`), 'base')
    assert.equal(git(change.reviewRepository, 'show', `${headObject}:code.txt`), 'changed')
    assert.deepEqual(readFileSync(join(root, '.git/index')), beforeIndex)
    assert.equal(git(root, 'status', '--porcelain=v2'), before)
    assert.equal(git(join(root, 'vendor/utils'), 'rev-parse', 'HEAD'), beforeHead)
  } finally { prepared.dispose() }
  assert.equal(existsSync(change.reviewRepository), false)
})

test('a locally present commit with a missing blob stays incomplete without lazy network fetching', async t => {
  const { root, child, scope, url, requests, headObject } = await remoteFixture(t)
  mkdirSync(join(root, 'vendor'))
  const nested = join(root, 'vendor/utils')
  git(root, 'clone', '--no-hardlinks', child, nested)
  const blob = git(nested, 'rev-parse', `${headObject}:code.txt`)
  rmSync(join(nested, '.git/objects', blob.slice(0, 2), blob.slice(2)))
  git(nested, 'config', 'remote.origin.url', url)
  git(nested, 'config', 'remote.origin.promisor', 'true')
  git(nested, 'config', 'extensions.partialClone', 'origin')
  const prepared = await prepareSnipeSubmodules(scope)
  try {
    assert.equal(prepared.scope.submodules[0].contentsAvailable, false)
    assert.deepEqual(requests, [])
  } finally { prepared.dispose() }
})

async function remoteFixture(t) {
  const child = repository()
  const baseObject = git(child, 'rev-parse', 'HEAD')
  writeFileSync(join(child, 'code.txt'), 'remote change\n')
  git(child, 'commit', '-am', 'remote change')
  const headObject = git(child, 'rev-parse', 'HEAD')
  const requests = []
  const server = createServer((request, response) => {
    requests.push(request.url)
    const chunks = []
    request.on('data', data => chunks.push(data))
    request.on('end', () => {
      const advertise = request.method === 'GET'
      try {
        const data = execFileSync('git', ['-c', 'uploadpack.allowReachableSHA1InWant=true', 'upload-pack', '--stateless-rpc', ...(advertise ? ['--advertise-refs'] : []), child], { input: Buffer.concat(chunks), stdio: ['pipe', 'pipe', 'pipe'] })
        response.setHeader('Content-Type', `application/x-git-upload-pack-${advertise ? 'advertisement' : 'result'}`)
        response.end(advertise ? Buffer.concat([Buffer.from('001e# service=git-upload-pack\n0000'), data]) : data)
      } catch { response.writeHead(500); response.end('fixture object unavailable') }
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}/utils.git`
  const root = repository()
  writeFileSync(join(root, '.gitmodules'), `[submodule "utils"]\npath = vendor/utils\nurl = ${url}\n`)
  git(root, 'add', '.gitmodules')
  git(root, 'update-index', '--add', '--cacheinfo', '160000', baseObject, 'vendor/utils')
  git(root, 'commit', '-m', 'base pointer')
  const base = git(root, 'rev-parse', 'HEAD')
  git(root, 'update-index', '--cacheinfo', '160000', headObject, 'vendor/utils')
  git(root, 'commit', '-m', 'head pointer')
  const scope = prepareSnipeRequest({ cwd: root, target: { type: 'ref', ref: base }, profile: { model: 'test', effort: 'low' }, supportedProfiles: { test: ['low'] } }).scope
  return { root, child, scope, url, requests, baseObject, headObject }
}

test('only an approved matching remote may supply missing base and head commits', async t => {
  const { root, scope, url, requests, baseObject, headObject } = await remoteFixture(t)
  const before = git(root, 'status', '--porcelain=v2')
  const unapproved = await prepareSnipeSubmodules(scope)
  assert.equal(unapproved.scope.submodules[0].contentsAvailable, false)
  assert.deepEqual(requests, [])
  unapproved.dispose()
  const prepared = await prepareSnipeSubmodules(scope, { remotes: { 'vendor/utils': url } })
  try {
    const change = prepared.scope.submodules[0]
    assert.equal(change.contentsAvailable, true, change.limitation)
    assert.equal(git(change.reviewRepository, 'show', `${baseObject}:code.txt`), 'base')
    assert.equal(git(change.reviewRepository, 'show', `${headObject}:code.txt`), 'remote change')
    assert.ok(requests.length > 0)
    assert.equal(git(root, 'status', '--porcelain=v2'), before)
    assert.equal(existsSync(join(root, 'vendor/utils')), false)
  } finally { prepared.dispose() }
})

test('mismatched, credential-bearing and helper remotes receive no network requests', async t => {
  const { scope, url, requests } = await remoteFixture(t)
  for (const remote of [url.replace('/utils.git', '/other.git'), 'ext::touch /tmp/never', '/tmp/repo', 'file:///tmp/repo', url.replace('http://', 'http://user:secret@'), 'ssh://-host/repo']) {
    const prepared = await prepareSnipeSubmodules(scope, { remotes: { 'vendor/utils': remote } })
    try { assert.equal(prepared.scope.submodules[0].contentsAvailable, false) } finally { prepared.dispose() }
  }
  assert.deepEqual(requests, [])
})

test('missing remote base or head remains incomplete instead of substituting a branch tip', async t => {
  const { scope, url } = await remoteFixture(t)
  for (const side of ['baseObject', 'headObject']) {
    const changed = { ...scope, submodules: [{ ...scope.submodules[0], [side]: 'f'.repeat(40) }] }
    const prepared = await prepareSnipeSubmodules(changed, { remotes: { 'vendor/utils': url } })
    try {
      assert.equal(prepared.scope.submodules[0].contentsAvailable, false)
      assert.equal(prepared.scope.submodules[0][side], 'f'.repeat(40))
    } finally { prepared.dispose() }
  }
})

test('symlink escapes and traversal are not used as local object sources', async () => {
  const { root, input } = fixture()
  const outside = repository()
  symlinkSync(join(root, 'vendor'), join(outside, 'vendor'))
  assert.equal(localSubmoduleRepository(outside, 'vendor/utils'), null)
  assert.equal(localSubmoduleRepository(root, '../elsewhere'), null)
  const original = prepareSnipeRequest(input).scope
  const prepared = await prepareSnipeSubmodules({ ...original, repository: outside })
  try { assert.equal(prepared.scope.submodules[0].contentsAvailable, false) } finally { prepared.dispose() }
})

test('dirty staged pins use index metadata rather than a changed working-tree URL', async t => {
  const { root, url, baseObject } = await remoteFixture(t)
  git(root, 'update-index', '--cacheinfo', '160000', baseObject, 'vendor/utils')
  mkdirSync(join(root, 'vendor/utils'), { recursive: true })
  writeFileSync(join(root, '.gitmodules'), '[submodule "utils"]\npath = vendor/utils\nurl = ext::untrusted\n')
  const scope = prepareSnipeRequest({ cwd: root, profile: { model: 'test', effort: 'low' }, supportedProfiles: { test: ['low'] } }).scope
  assert.equal(scope.kind, 'dirty')
  const prepared = await prepareSnipeSubmodules(scope, { remotes: { 'vendor/utils': url } })
  try { assert.ok(prepared.scope.submodules.every(change => change.contentsAvailable), JSON.stringify(prepared.scope.submodules)) } finally { prepared.dispose() }
})

test('nested changed gitlinks require their own approval and are prepared at exact pins', async t => {
  const remote = await remoteFixture(t)
  const { root, input } = fixture()
  const nested = join(root, 'vendor/utils')
  git(nested, 'config', 'user.name', 'Snipe Test')
  git(nested, 'config', 'user.email', 'snipe@example.invalid')
  writeFileSync(join(nested, '.gitmodules'), `[submodule "inner"]\npath = inner/lib\nurl = ${remote.url}\n`)
  git(nested, 'add', '.gitmodules')
  git(nested, 'update-index', '--add', '--cacheinfo', '160000', remote.baseObject, 'inner/lib')
  git(nested, 'commit', '-m', 'base inner pin')
  git(root, 'add', 'vendor/utils')
  git(root, 'commit', '-m', 'base outer pin')
  const base = git(root, 'rev-parse', 'HEAD')
  git(nested, 'update-index', '--cacheinfo', '160000', remote.headObject, 'inner/lib')
  git(nested, 'commit', '-m', 'head inner pin')
  git(root, 'add', 'vendor/utils')
  git(root, 'commit', '-m', 'head outer pin')
  const scope = prepareSnipeRequest({ ...input, target: { type: 'ref', ref: base } }).scope
  const unapproved = await prepareSnipeSubmodules(scope)
  assert.deepEqual(unapproved.scope.submodules.map(change => [change.path, change.contentsAvailable]), [
    ['vendor/utils', true], ['vendor/utils/inner/lib', false],
  ])
  assert.deepEqual(remote.requests, [])
  unapproved.dispose()
  const prepared = await prepareSnipeSubmodules(scope, { remotes: { 'vendor/utils/inner/lib': remote.url } })
  try {
    const change = prepared.scope.submodules.find(change => change.path === 'vendor/utils/inner/lib')
    assert.equal(change.contentsAvailable, true, change.limitation)
    assert.equal(git(change.reviewRepository, 'show', `${remote.baseObject}:code.txt`), 'base')
    assert.equal(git(change.reviewRepository, 'show', `${remote.headObject}:code.txt`), 'remote change')
    assert.equal(existsSync(join(nested, 'inner/lib')), false)
  } finally { prepared.dispose() }
})
