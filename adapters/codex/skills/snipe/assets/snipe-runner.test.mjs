import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { runSnipePanel } from './snipe-runner.mjs'

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'codex-snipe-runner-'))
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
  return root
}

function fakeCodex(body) {
  const root = mkdtempSync(join(tmpdir(), 'codex-snipe-fake-'))
  const path = join(root, 'codex')
  writeFileSync(path, `#!/usr/bin/env node\n${body}\n`)
  chmodSync(path, 0o755)
  return path
}

const supportedProfiles = { 'gpt-test': ['high'] }
const inheritedProfile = { model: 'gpt-test', effort: 'high' }
const runnerPath = fileURLToPath(new URL('./snipe-runner.mjs', import.meta.url))

test('one seat runs through a fresh read-only Codex process with the canonical scope', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(`
    const argv = process.argv.slice(2)
    const prompt = argv.at(-1)
    console.log(JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: JSON.stringify({ argv: argv.slice(0, -1), prompt }) },
    }))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    concern: 'Focus on cancellation semantics.',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.complete, true)
  assert.equal(result.stability.stable, true)
  assert.equal(result.seats.length, 1)
  assert.equal(result.seats[0].status, 'completed')
  assert.equal(result.seats[0].lens, 'correctness')
  assert.equal(result.seats[0].rationale, 'operator-pinned lens')
  const response = JSON.parse(result.seats[0].response)
  assert.deepEqual(response.argv.slice(0, 7), [
    'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--sandbox', 'read-only', '--json',
  ])
  assert.ok(response.argv.includes('approval_policy="never"'))
  assert.ok(response.argv.includes('mcp_servers={}'))
  assert.ok(response.argv.includes('shell_environment_policy.inherit="none"'))
  for (const capability of ['multi_agent', 'apps', 'browser_use', 'computer_use', 'in_app_browser', 'plugins', 'hooks']) {
    assert.ok(response.argv.some((value, index) => value === '--disable' && response.argv[index + 1] === capability))
  }
  assert.match(response.prompt, new RegExp(result.request.scope.headSha))
  assert.match(response.prompt, /AUDIT SEAT 1 — lens: correctness/)
  assert.match(response.prompt, /Operator concern: Focus on cancellation semantics\./)
  assert.match(response.prompt, /Do not widen the panel/)
  assert.match(response.prompt, /Do not use connectors or request escalation/)
})

test('five independent seats are capacity-bounded, distinct, and receive identical scope', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-concurrency-')), 'events.log')
  const codexPath = fakeCodex(`
    const { appendFileSync } = await import('node:fs')
    const argv = process.argv.slice(2)
    const prompt = argv.at(-1)
    appendFileSync(${JSON.stringify(logPath)}, 'start ' + process.pid + '\\n')
    await new Promise(resolve => setTimeout(resolve, 120))
    appendFileSync(${JSON.stringify(logPath)}, 'end ' + process.pid + '\\n')
    const scope = prompt.split('Canonical scope (identical for every seat):\\n')[1].split('\\n\\nReview only')[0]
    console.log(JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: JSON.stringify({ pid: process.pid, scope }) },
    }))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: '5 correctness,security,auto',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, true)
  assert.equal(result.seats.length, 5)
  assert.equal(new Set(result.seats.map(seat => seat.lens)).size, 5)
  assert.ok(result.seats.every(seat => typeof seat.rationale === 'string' && seat.rationale.length > 0))
  const responses = result.seats.map(seat => JSON.parse(seat.response))
  assert.equal(new Set(responses.map(response => response.pid)).size, 5, 'each seat has a fresh process')
  assert.equal(new Set(responses.map(response => response.scope)).size, 1, 'scope is byte-identical')

  let active = 0
  let maximum = 0
  for (const event of readFileSync(logPath, 'utf8').trim().split('\n')) {
    active += event.startsWith('start ') ? 1 : -1
    maximum = Math.max(maximum, active)
  }
  assert.equal(active, 0)
  assert.equal(maximum, 2)
})

test('a nonzero seat is retained without losing a successful peer', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(`
    const prompt = process.argv.at(-1)
    if (prompt.includes('lens: security')) {
      console.error('seat transport failed')
      process.exit(7)
    }
    console.log(JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: '{"verdict":"approve"}' },
    }))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness,security',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, false)
  assert.deepEqual(result.seats.map(seat => [seat.lens, seat.status, seat.exitCode]), [
    ['correctness', 'completed', 0],
    ['security', 'failed', 7],
  ])
  assert.match(result.seats[1].stderr, /seat transport failed/)
})

test('dirty scope changed during a seat is reported unstable and cannot complete cleanly', async () => {
  const cwd = fixture()
  writeFileSync(join(cwd, 'initial-untracked.txt'), 'before\n')
  const codexPath = fakeCodex(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync('concurrent-change.txt', 'changed during review\\n')
    console.log(JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: '{"verdict":"approve"}' },
    }))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.seats[0].status, 'completed')
  assert.equal(result.request.scope.kind, 'dirty')
  assert.equal(result.stability.stable, false)
  assert.equal(result.complete, false)
})

test('a timed-out seat is terminated and reported distinctly', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-timeout-')), 'pid')
  const codexPath = fakeCodex(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(pidPath)}, String(process.pid))
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 800 })

  assert.equal(result.complete, false)
  assert.equal(result.seats[0].status, 'timed_out')
  const pid = Number(readFileSync(pidPath, 'utf8'))
  assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
})

test('seat output is bounded and an over-limit child is terminated', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-output-')), 'pid')
  const codexPath = fakeCodex(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(pidPath)}, String(process.pid))
    process.stdout.write('x'.repeat(8_192))
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 5_000, maxOutputBytes: 128 })

  assert.equal(result.seats[0].status, 'output_limit')
  assert.equal(result.seats[0].truncated, true)
  assert.ok(Buffer.byteLength(result.seats[0].stdout) <= 128)
  const pid = Number(readFileSync(pidPath, 'utf8'))
  assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
})

test('cancellation stops active children and accounts for queued seats without starting them', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-cancel-')), 'pids.log')
  const codexPath = fakeCodex(`
    const { appendFileSync } = await import('node:fs')
    const { spawn } = await import('node:child_process')
    const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
    appendFileSync(${JSON.stringify(logPath)}, process.pid + ' ' + grandchild.pid + '\\n')
    await new Promise(resolve => setTimeout(resolve, 10_000))
  `)
  const controller = new AbortController()
  const running = runSnipePanel({
    cwd,
    rawArgs: '3 correctness,security,performance',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000, signal: controller.signal })

  for (let attempt = 0; attempt < 100 && !existsSync(logPath); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.equal(existsSync(logPath), true, 'first child started')
  controller.abort()
  const result = await running

  assert.deepEqual(result.seats.map(seat => seat.status), ['cancelled', 'cancelled', 'cancelled'])
  const rows = readFileSync(logPath, 'utf8').trim().split('\n')
  assert.equal(rows.length, 1, 'queued seats never started')
  const pids = rows[0].split(' ').map(Number)
  try {
    for (const pid of pids) assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH')
  } finally {
    for (const pid of pids) {
      try { process.kill(pid, 'SIGKILL') } catch { /* already reaped */ }
    }
  }
})

test('CLI accepts a request file and returns complete seat accounting as JSON', () => {
  const cwd = fixture()
  const codexPath = fakeCodex(`
    console.log(JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: '{"verdict":"approve"}' },
    }))
  `)
  const requestPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-cli-')), 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, rawArgs: 'correctness', inheritedProfile, supportedProfiles }))

  const output = execFileSync(process.execPath, [
    runnerPath,
    '--request', requestPath,
    '--codex-path', codexPath,
    '--capacity', '1',
    '--timeout-ms', '2000',
  ], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.complete, true)
  assert.deepEqual(result.seats.map(seat => [seat.seat, seat.lens, seat.status]), [[1, 'correctness', 'completed']])
})
