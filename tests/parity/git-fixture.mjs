import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ownProcess } from '../../scripts/ci/owned-process.mjs'

// No credential/config forwarding. Git can only use file transport, and every
// fixture starts from empty config, hooks and templates instead of user defaults.
export function fixtureEnvironment(root) {
  return { PATH:`${dirname(process.execPath)}:${process.env.PATH ?? '/usr/bin:/bin'}`,
    TMPDIR:root, LANG:'C', LC_ALL:'C', GIT_CONFIG_NOSYSTEM:'1',
    GIT_CONFIG_GLOBAL:join(root, 'gitconfig'), GIT_TERMINAL_PROMPT:'0', GIT_ALLOW_PROTOCOL:'file' }
}

export function fixtureGit(root, cwd, args) {
  const result = spawnSync('git', ['-c', `core.hooksPath=${join(root, 'empty')}`, '-c', 'commit.gpgSign=false', ...args],
    {cwd, env:fixtureEnvironment(root), encoding:'utf8', timeout:5000, maxBuffer:1024*1024})
  if (result.error || result.status !== 0) throw new Error(`fixture git ${args[0]} failed: ${result.error?.message ?? result.stderr}`)
  return result.stdout.trim()
}

export function createGitFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'war-parity-git-'))
  const children = new Set()
  const fixture = {cleanupIncomplete:false}
  t.after(async () => {
    for (const child of children) child.kill()
    await Promise.all([...children].map(child => child.result))
    if(fixture.cleanupIncomplete) throw new Error(`fixture cleanup incomplete; evidence retained at ${root}`)
    rmSync(root, {recursive:true, force:true})
  })
  mkdirSync(join(root, 'empty'))
  writeFileSync(join(root, 'gitconfig'), '')
  const work = join(root, 'work'), remote = join(root, 'remote.git')
  mkdirSync(work)
  const git = args => fixtureGit(root, work, args)
  git(['init', '--initial-branch=main', `--template=${join(root, 'empty')}`])
  git(['config', 'user.name', 'Parity Fixture'])
  git(['config', 'user.email', 'parity@example.invalid'])
  git(['init', '--bare', '--initial-branch=main', `--template=${join(root, 'empty')}`, remote])
  fixtureGit(root, remote, ['config', 'core.logAllRefUpdates', 'true'])
  writeFileSync(join(work, 'value.txt'), 'baseline\n')
  git(['add', 'value.txt']); git(['commit', '-m', 'baseline'])
  const base = git(['rev-parse', 'HEAD'])
  git(['remote', 'add', 'origin', remote]); git(['push', 'origin', 'HEAD:refs/heads/main'])
  writeFileSync(join(work, 'value.txt'), 'candidate\n')
  git(['commit', '-am', 'candidate'])
  const candidate = git(['rev-parse', 'HEAD'])
  writeFileSync(join(root, 'fixture.json'), JSON.stringify({base, candidate}))
  Object.assign(fixture,{root, work, remote, base, candidate, children, git,
    remoteTip:() => fixtureGit(root, remote, ['rev-parse', 'refs/heads/main']),
    remoteUpdates:() => fixtureGit(root, remote, ['reflog', 'show', '--format=%H', 'refs/heads/main']).split('\n').length })
  return fixture
}

export function startFixtureProcess(fixture, operation, {checkpoint, timeoutMs=5000} = {}) {
  const args = [fileURLToPath(new URL('fixture-process.mjs', import.meta.url)), fixture.root, operation]
  if (checkpoint) args.push(checkpoint)
  const child = spawn(process.execPath, args, {cwd:fixture.root, env:fixtureEnvironment(fixture.root), detached:true, stdio:['ignore','pipe','pipe']})
  let stdout = '', stderr = '', done = false
  const watchers = new Set()
  const notify = () => { for (const fn of watchers) fn() }
  const owner=ownProcess(child,{timeoutMs,onData(channel,data) {
    if(channel==='stdout') {
      stdout += data.toString()
      if (stdout.length > 1024*1024) { stdout=stdout.slice(0,1024*1024); owner.stop('output-limit') }
      notify()
    } else {
      stderr += data.toString()
      if (stderr.length > 1024*1024) { stderr=stderr.slice(0,1024*1024); owner.stop('output-limit') }
    }
  }})
  const result=owner.result.then(execution=>{
    if(execution.terminationConfirmed===false) fixture.cleanupIncomplete=true
    done=true;notify()
    const {exitCode,failure,...state}=execution
    return {...state,code:execution.terminationConfirmed===false ? null : exitCode,
      stdout,stderr,reason:failure ?? (execution.cleanupError ? 'cleanup-denied' : null)}
  })
  const handle = {kill:owner.kill, result, checkpoint: name => new Promise((resolve, reject) => {
    const inspect = () => {
      if (stdout.split('\n').includes(`checkpoint:${name}`)) { watchers.delete(inspect); resolve() }
      else if (done) { watchers.delete(inspect); reject(new Error(`missing checkpoint ${name}: process ended; ${stderr}`)) }
    }
    watchers.add(inspect); inspect()
  })}
  fixture.children.add(handle)
  result.then(() => fixture.children.delete(handle))
  return handle
}
