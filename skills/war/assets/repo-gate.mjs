#!/usr/bin/env node
// WAR's own full gate: Node files and discovered shell suites run in separate bounded pools.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function jobs(name, fallback) {
  const value = process.env[name] ?? fallback
  if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 32) {
    throw new Error(`${name} must be an integer from 1 to 32`)
  }
  return Number(value)
}

function discover(dir, suffix) {
  const paths = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!['.git', '.claude', 'node_modules'].includes(entry.name)) paths.push(...discover(`${dir}/${entry.name}`, suffix))
    } else if (entry.isFile() && entry.name.endsWith(suffix)) paths.push(`${dir}/${entry.name}`)
  }
  return paths.sort()
}
const shellSuites = () => discover('.', '.test.sh')
// The same set as the `skills/**/*.test.mjs` glob, listed so the gate can order it.
const nodeFiles = () => { try { return discover('./skills', '.test.mjs') } catch (error) { if (error.code === 'ENOENT') return []; throw error } }

// Each shell suite's and Node test file's seconds from the last gate run, kept in the git common dir so every
// worktree of the repo shares them. A missing or unreadable file means no record.
function timesFile() {
  const git = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' })
  return git.status === 0 && git.stdout.trim() ? join(git.stdout.trim(), 'war-gate-times.json') : null
}
function readTimes(file) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch { return {} }
}

// Start the slowest suites first, so a long suite never runs alone at the end of the gate.
// A suite with no record starts before every recorded one, largest file first.
function slowestFirst(paths, times) {
  const seconds = path => (Number.isFinite(times[path]) ? times[path] : Infinity)
  const size = new Map(paths.map(path => [path, statSync(path).size]))
  return [...paths].sort((a, b) =>
    (seconds(b) - seconds(a)) || (size.get(b) - size.get(a)) || (a < b ? -1 : a > b ? 1 : 0))
}

// Keep only suites that still exist. A failed write only costs the next run its order.
function writeTimes(file, suites, times, ran) {
  const next = {}
  for (const suite of suites) {
    const seconds = ran.has(suite) ? ran.get(suite) : times[suite]
    if (Number.isFinite(seconds)) next[suite] = Math.round(seconds * 100) / 100
  }
  const tmp = `${file}.${process.pid}.tmp`
  try {
    writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n')
    renameSync(tmp, file)
  } catch { rmSync(tmp, { force: true }) }
}

async function main() {
  const shellJobs = jobs('WAR_GATE_SHELL_JOBS', '4'), nodeJobs = jobs('WAR_GATE_NODE_JOBS', '6')
  // Discover before launching anything; an unreadable directory must fail the gate.
  const file = timesFile(), times = file ? readTimes(file) : {}
  const suites = slowestFirst(shellSuites(), times)
  const tests = slowestFirst(nodeFiles(), times)
  const ran = new Map()
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
    const seconds = (performance.now() - start) / 1000
    console.log(`== gate result: ${label}; exit=${result.code ?? result.signal ?? 'error'}; seconds=${seconds.toFixed(2)} ==`)
    completed++
    return seconds
  }

  // One worker pool per kind. Each Node test file runs as its own `node --test` job,
  // because `node --test` sorts the files it is given and so ignores a start order.
  function pool(items, kind, command, prefix, id) {
    let next = 0
    return async function worker() {
      while (!interrupted && next < items.length) {
        const index = next++
        const seconds = await run(`gate(${kind}): ${items[index]}`, command, prefix ? [prefix, items[index]] : [items[index]], `${id}-${index}`)
        if (!interrupted && seconds !== undefined) ran.set(items[index], seconds)
      }
    }
  }
  const shellWorker = pool(suites, 'bash', 'bash', null, 'shell'), nodeWorker = pool(tests, 'node', process.execPath, '--test', 'node')
  const total = suites.length + tests.length
  try {
    const results = await Promise.allSettled([
      ...Array.from({ length: Math.min(nodeJobs, tests.length) }, nodeWorker),
      ...Array.from({ length: Math.min(shellJobs, suites.length) }, shellWorker),
    ])
    for (const result of results) {
      if (result.status === 'rejected') { failed++; console.error(`Gate error: ${result.reason.message}`) }
    }
    if (cancellation) await cancellation
    if (file && !interrupted) writeTimes(file, [...suites, ...tests], times, ran)
    if (interrupted) console.log(`== gate interrupted: ${completed}/${total} jobs ==`)
    else if (completed !== total) console.log(`== gate incomplete: ${completed}/${total} jobs ==`)
    else console.log(`== gate complete: ${completed}/${total} jobs; ${failed} failed ==`)
    return interrupted || (failed || completed !== total ? 1 : 0)
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
