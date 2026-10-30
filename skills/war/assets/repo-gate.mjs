#!/usr/bin/env node
// WAR's own full gate: Node files and discovered shell suites run in separate bounded pools.
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function jobs(name) {
  const value = process.env[name] ?? '2'
  if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 32) {
    throw new Error(`${name} must be an integer from 1 to 32`)
  }
  return Number(value)
}

function shellSuites(dir = '.') {
  const paths = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!['.git', '.claude', 'node_modules'].includes(entry.name)) paths.push(...shellSuites(`${dir}/${entry.name}`))
    } else if (entry.isFile() && entry.name.endsWith('.test.sh')) paths.push(`${dir}/${entry.name}`)
  }
  return paths.sort()
}

async function main() {
  const shellJobs = jobs('WAR_GATE_SHELL_JOBS'), nodeJobs = jobs('WAR_GATE_NODE_JOBS')
  // Discover before launching anything; an unreadable directory must fail the gate.
  const suites = shellSuites()
  const logs = mkdtempSync(join(tmpdir(), 'war-gate-'))
  console.log(`Gate logs: ${logs}`)
  console.log(`Gate workers: ${nodeJobs} Node files + ${shellJobs} shell suites`)
  const active = new Set()
  let interrupted = 0, cancellation, completed = 0, failed = 0
  const killGroup = (pid, signal) => {
    try { process.kill(-pid, signal) } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  const stop = signal => {
    if (interrupted) return
    interrupted = signal === 'SIGINT' ? 130 : 143
    const pids = [...active]
    for (const pid of pids) killGroup(pid, 'SIGTERM')
    // Also kill descendants whose immediate parent exits before they do.
    cancellation = new Promise(resolve => setTimeout(() => {
      for (const pid of pids) killGroup(pid, 'SIGKILL')
      resolve()
    }, 1000))
  }
  const onInt = () => stop('SIGINT'), onTerm = () => stop('SIGTERM')
  process.on('SIGINT', onInt)
  process.on('SIGTERM', onTerm)

  async function run(label, command, args, id) {
    if (interrupted) return
    const scratch = join(logs, `${id}.tmp`), log = join(logs, `${id}.log`)
    mkdirSync(scratch)
    const fd = openSync(log, 'w')
    const start = performance.now()
    let result
    try {
      result = await new Promise(resolve => {
        const child = spawn(command, args, {
          env: { ...process.env, TMPDIR: scratch },
          stdio: ['ignore', fd, fd], detached: true,
        })
        if (child.pid) active.add(child.pid)
        let error
        child.on('error', value => { error = value })
        child.on('close', (code, signal) => {
          active.delete(child.pid)
          resolve({ code, signal, error })
        })
      })
    } finally { closeSync(fd) }
    if (result.code !== 0 || result.signal || result.error) failed++
    // Emit each finished suite as one block so concurrent output cannot mix test evidence.
    process.stdout.write(`\n== ${label} ==\n${readFileSync(log, 'utf8')}\n`)
    if (result.error) console.log(`Launch failed: ${result.error.message}`)
    console.log(`== gate result: ${label}; exit=${result.code ?? result.signal ?? 'error'}; seconds=${((performance.now() - start) / 1000).toFixed(2)} ==`)
    completed++
  }

  let next = 0
  async function shellWorker() {
    while (!interrupted && next < suites.length) {
      const index = next++
      await run(`gate(bash): ${suites[index]}`, 'bash', [suites[index]], `shell-${index}`)
    }
  }
  try {
    const results = await Promise.allSettled([
      run('gate(node)', process.execPath, ['--test', `--test-concurrency=${nodeJobs}`, 'skills/**/*.test.mjs'], 'node'),
      ...Array.from({ length: Math.min(shellJobs, suites.length) }, shellWorker),
    ])
    for (const result of results) {
      if (result.status === 'rejected') { failed++; console.error(`Gate error: ${result.reason.message}`) }
    }
    if (cancellation) await cancellation
    if (interrupted) console.log(`== gate interrupted: ${completed}/${suites.length + 1} jobs ==`)
    else if (completed !== suites.length + 1) console.log(`== gate incomplete: ${completed}/${suites.length + 1} jobs ==`)
    else console.log(`== gate complete: ${completed}/${suites.length + 1} jobs; ${failed} failed ==`)
    return interrupted || (failed || completed !== suites.length + 1 ? 1 : 0)
  } finally {
    process.removeListener('SIGINT', onInt)
    process.removeListener('SIGTERM', onTerm)
    for (const name of readdirSync(logs)) {
      if (name.endsWith('.tmp')) rmSync(join(logs, name), { recursive: true, force: true })
    }
  }
}

try { process.exitCode = await main() }
catch (error) { console.error(`Gate error: ${error.message}`); process.exitCode = 1 }
