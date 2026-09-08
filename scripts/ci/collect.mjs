import { execFileSync, spawn } from 'node:child_process'
import { lstatSync, mkdirSync, openSync, closeSync, writeSync, readFileSync, writeFileSync, readlinkSync } from 'node:fs'
import { dirname, delimiter, join, resolve, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { platform, arch, release } from 'node:os'
import { fileURLToPath } from 'node:url'

const baselineSkips = JSON.parse(readFileSync(new URL('./baseline-skips.json', import.meta.url), 'utf8'))

export function discoverTests(root) {
  return execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0').filter(path => /^(skills|hooks|adapters|tests\/parity|scripts\/ci)\/.+\.test\.(mjs|sh)$/.test(path)).sort()
}

function snapshot(root, output) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024 })
  const hash = createHash('sha256')
  const excluded = relative(root, output).split(sep).join('/')
  const paths = [...new Set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean))].sort()
  for (const path of paths) {
    if (path === excluded || path.startsWith(excluded + '/')) continue
    const absolute = join(root, path)
    const stat = lstatSync(absolute, { throwIfNoEntry: false })
    const bytes = stat?.isSymbolicLink() ? Buffer.from(readlinkSync(absolute)) : stat?.isFile() ? readFileSync(absolute) : Buffer.alloc(0)
    const digest = createHash('sha256').update(bytes).digest('hex')
    hash.update(JSON.stringify([path, stat?.mode ?? null, bytes.length, digest]) + '\n')
  }
  return { sourceSha: git('rev-parse', 'HEAD').trim(),
    trackedChanges: git('diff', 'HEAD', '--name-only', '-z').split('\0').filter(Boolean),
    untrackedInputs: git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && path !== excluded && !path.startsWith(excluded + '/')),
    indexDigest: createHash('sha256').update(git('ls-files', '--stage', '-z')).digest('hex'),
    contentDigest: hash.digest('hex') }
}

export async function collect({ root, output, inventory, timeoutMs = 600000 }) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer')
  const before = snapshot(root, output)
  const discovered = discoverTests(root)
  if (!discovered.length) throw new Error('empty inventory')
  inventory ??= JSON.parse(readFileSync(join(root, 'scripts/ci/test-inventory.json'), 'utf8'))
  if (JSON.stringify(inventory) !== JSON.stringify(discovered)) throw new Error('inventory mismatch')
  for (const path of discovered) {
    if (!lstatSync(join(root, path), { throwIfNoEntry: false })?.isFile()) throw new Error(`missing regular test file: ${path}`)
  }
  mkdirSync(output)
  const suites = []
  for (const [index, path] of discovered.entries()) {
    const directory = join(resolve(output), String(index))
    mkdirSync(directory)
    const env = {
      PATH: dirname(process.execPath) + delimiter + (process.env.PATH ?? ''), TMPDIR: process.env.TMPDIR ?? '/tmp',
      GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(directory, 'gitconfig'),
      GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'file',
      LANG: 'C', LC_ALL: 'C',
    }
    writeFileSync(env.GIT_CONFIG_GLOBAL, '')
    const command = path.endsWith('.mjs') ? [process.execPath, '--test', '--test-reporter=tap', path] : ['/bin/bash', path]
    const stdout = join(directory, 'stdout.log')
    const stderr = join(directory, 'stderr.log')
    const execution = await execute(command, root, env, stdout, stderr, timeoutMs)
    const text = readFileSync(stdout, 'utf8')
    const errorText = readFileSync(stderr, 'utf8')
    const lines = [...text.split('\n').map(line => ({ channel: 'stdout', line })), ...errorText.split('\n').map(line => ({ channel: 'stderr', line }))]
    const skips = lines.filter(({ line }) => /^\s*SKIP\b/i.test(line) || /^\s*(?:ok|not ok) \d+.*# (?:SKIP|TODO)\b/i.test(line)).map(({ line, channel }) => {
      const name = line.match(/^ok \d+ - (.*?) # SKIP(?:\s|$)/)?.[1]
      return { line, channel, reason: channel === 'stdout' ? baselineSkips[path]?.[name] ?? null : null }
    })
    const passed = lines.filter(({ line }) => /^ok(?: \d+)? - \S/.test(line)).length
      + (path === 'skills/_shared/war-memory-lint.test.sh' && /^lint: clean\s*$/m.test(text) ? 1 : 0)
    const failed = lines.filter(({ line }) => /^(?:not ok|FAIL)(?:\s|$)/.test(line)).length
    const counts = path.endsWith('.mjs') ? Object.fromEntries(['tests', 'pass', 'fail', 'skipped', 'cancelled', 'todo'].map(key => [key, Number(text.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] ?? NaN)]))
      : { tests: passed + failed, pass: passed, fail: failed, skipped: skips.length, cancelled: 0, todo: 0 }
    const invalidCounts = Object.values(counts).some(n => !Number.isSafeInteger(n)) || counts.tests < 1 || counts.fail > 0 || counts.cancelled > 0 || counts.todo > 0 || counts.skipped !== skips.length || text.includes(`# Subtest: ${path}\n`)
    const status = execution.exitCode === 0 && !execution.failure && !execution.cleanupError && !invalidCounts && skips.every(s => s.reason) ? (skips.length ? 'allowed-skips' : 'passed') : 'failed'
    suites.push({ path, command, stdout, stderr, ...execution, counts, skips, status })
  }
  const after = snapshot(root, output)
  const stability = JSON.stringify(before) === JSON.stringify(after) ? 'unchanged' : 'changed'
  const report = {
    schemaVersion: 1, evidenceLevel: 'baseline',
    sourceSha: before.sourceSha, before, after, stability,
    environment: { platform: platform(), arch: arch(), osRelease: release(), node: process.version,
      git: execFileSync('git', ['--version'], { encoding: 'utf8' }).trim(),
      bash: execFileSync('/bin/bash', ['--version'], { encoding: 'utf8' }).split('\n')[0],
    },
    inventory: discovered, suites, ok: stability === 'unchanged' && suites.every(s => ['passed', 'allowed-skips'].includes(s.status)),
  }
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}

function execute(command, cwd, env, stdout, stderr, timeoutMs) {
  return new Promise(resolve => {
    const out = openSync(stdout, 'wx'), err = openSync(stderr, 'wx')
    let bytes = 0, failure = null, cleanupError = null
    const child = spawn(command[0], command.slice(1), { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    function stop(reason) {
      if (failure) return
      failure = reason
      terminateGroup()
    }
    function terminateGroup() {
      if (!child.pid) return
      try { process.kill(-child.pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') cleanupError = error.message }
    }
    const timer = setTimeout(() => stop('timeout'), timeoutMs)
    for (const [stream, fd] of [[child.stdout, out], [child.stderr, err]]) stream.on('data', chunk => {
      const remaining = Math.max(0, 16 * 1024 * 1024 - bytes)
      writeSync(fd, chunk.subarray(0, remaining))
      bytes += chunk.length
      if (bytes > 16 * 1024 * 1024) stop('output-limit')
    })
    child.on('error', error => { failure = error.message })
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer)
      terminateGroup()
      closeSync(out); closeSync(err)
      resolve({ exitCode, signal, failure, cleanupError })
    })
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [mode, output] = process.argv.slice(2)
  if (mode === '--inventory' && !output) console.log(JSON.stringify(discoverTests(process.cwd()), null, 2))
  else if (mode === '--run' && output) {
    const report = await collect({ root: process.cwd(), output: resolve(output) })
    console.log(JSON.stringify({ ok: report.ok, suites: report.suites.length, report: join(resolve(output), 'report.json') }))
    process.exitCode = report.ok ? 0 : 1
  } else throw new Error('usage: node scripts/ci/collect.mjs --inventory | --run <new-output-directory>')
}
