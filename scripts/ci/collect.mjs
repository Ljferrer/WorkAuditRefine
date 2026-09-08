import { execFileSync, spawn } from 'node:child_process'
import { lstatSync, mkdirSync, openSync, closeSync, writeSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { platform, arch, release } from 'node:os'
import { fileURLToPath } from 'node:url'

const baselineSkips = JSON.parse(readFileSync(new URL('./baseline-skips.json', import.meta.url), 'utf8'))

export function discoverTests(root) {
  return execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0').filter(path => /^(skills|hooks|adapters|tests\/parity|scripts\/ci)\/.+\.test\.(mjs|sh)$/.test(path)).sort()
}

export async function collect({ root, output, inventory = discoverTests(root), timeoutMs = 600000 }) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer')
  const discovered = discoverTests(root)
  if (!discovered.length) throw new Error('empty inventory')
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
      PATH: process.env.PATH, TMPDIR: process.env.TMPDIR ?? '/tmp',
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
    const counts = path.endsWith('.mjs') ? Object.fromEntries(['tests', 'pass', 'fail', 'skipped', 'cancelled', 'todo'].map(key => [key, Number(text.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] ?? NaN)])) : null
    const skipLines = text.split('\n').filter(line => /^SKIP\b/.test(line) || /^\s*(?:ok|not ok) \d+.*# (?:SKIP|TODO)\b/i.test(line))
    const skips = skipLines.map(line => {
      const name = line.match(/^ok \d+ - (.*?) # SKIP(?:\s|$)/)?.[1]
      return { line, reason: baselineSkips[path]?.[name] ?? null }
    })
    const invalidCounts = counts && (Object.values(counts).some(n => !Number.isSafeInteger(n)) || counts.tests < 1 || counts.fail > 0 || counts.cancelled > 0 || counts.todo > 0 || counts.skipped !== skips.length || text.includes(`# Subtest: ${path}\n`))
    const status = execution.exitCode === 0 && !execution.failure && !invalidCounts && skips.every(s => s.reason) ? (skips.length ? 'allowed-skips' : 'passed') : 'failed'
    suites.push({ path, command, stdout, stderr, ...execution, counts, skips, status })
  }
  const report = {
    schemaVersion: 1, evidenceLevel: 'baseline',
    sourceSha: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    worktreeStatus: execFileSync('git', ['-C', root, 'status', '--porcelain=v1', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean),
    environment: { platform: platform(), arch: arch(), osRelease: release(), node: process.version,
      git: execFileSync('git', ['--version'], { encoding: 'utf8' }).trim(),
      bash: execFileSync('/bin/bash', ['--version'], { encoding: 'utf8' }).split('\n')[0],
    },
    inventory: discovered, suites, ok: suites.every(s => ['passed', 'allowed-skips'].includes(s.status)),
  }
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}

function execute(command, cwd, env, stdout, stderr, timeoutMs) {
  return new Promise(resolve => {
    const out = openSync(stdout, 'wx'), err = openSync(stderr, 'wx')
    let bytes = 0, failure = null
    const child = spawn(command[0], command.slice(1), { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    function stop(reason) {
      failure ??= reason
      try { process.kill(-child.pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') failure = error.message }
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
      closeSync(out); closeSync(err)
      resolve({ exitCode, signal, failure })
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
