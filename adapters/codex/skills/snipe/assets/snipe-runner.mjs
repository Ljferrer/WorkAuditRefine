// Bounded read-only Codex seat coordinator for /snipe.

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { prepareSnipeRequest, verifySnipeScope } from './snipe-request.mjs'
import { parseSnipeVerdict, renderSnipeReport } from './snipe-result.mjs'

const AUDITOR_ROLE = readFileSync(new URL('../references/codex-auditor.md', import.meta.url), 'utf8').trim()

// Read capabilities only: never create a thread or start a turn during discovery.
export function listSupportedProfiles({ codexPath = 'codex', timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(codexPath, ['app-server', '--listen', 'stdio://', '-c', 'mcp_servers={}', '--disable', 'plugins', '--disable', 'hooks'], { stdio: ['pipe', 'pipe', 'pipe'] })
    const profiles = Object.create(null)
    let buffer = '', bytes = 0, id = 0, done = false
    const cursors = new Set()
    const finish = (error) => {
      if (done) return
      done = true
      clearTimeout(timer)
      child.kill('SIGKILL')
      if (error) reject(Object.assign(new Error(error), { code: 'PROFILE_DISCOVERY_FAILED' }))
      else resolve(profiles)
    }
    const timer = setTimeout(() => finish('Codex model/list timed out'), timeoutMs)
    const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`)
    child.on('error', error => finish(error.message))
    child.stdin.on('error', error => finish(error.message))
    child.on('close', () => finish('Codex model/list exited before returning a catalog'))
    child.stderr.on('data', chunk => {
      bytes += chunk.length
      if (bytes > 1024 * 1024) finish('Codex model/list output exceeded limit')
    })
    child.stdout.on('data', chunk => {
      bytes += chunk.length
      if (bytes > 1024 * 1024) return finish('Codex model/list output exceeded limit')
      buffer += chunk.toString()
      let newline
      while (!done && (newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        try {
          const message = JSON.parse(line)
          if (message.id !== id) continue
          if (message.error) return finish(`Codex model/list failed: ${message.error.message}`)
          if (id === 0) {
            send({ method: 'initialized' })
          } else {
            const page = message.result
            if (!Array.isArray(page?.data)) return finish('Malformed Codex model/list catalog')
            for (const model of page.data) {
              const efforts = model.supportedReasoningEfforts?.map(item => item.reasoningEffort)
              if (typeof model.model !== 'string' || !Array.isArray(efforts) || !efforts.length || !efforts.every(item => typeof item === 'string')) return finish('Malformed Codex model capabilities')
              profiles[model.model] = efforts
            }
            if (page.nextCursor == null) return Object.keys(profiles).length ? finish() : finish('Codex returned no supported models')
            if (typeof page.nextCursor !== 'string' || cursors.has(page.nextCursor)) return finish('Invalid Codex model/list cursor')
            cursors.add(page.nextCursor)
          }
          const cursor = message.result?.nextCursor
          send({ id: ++id, method: 'model/list', params: { limit: 100, includeHidden: true, ...(cursor ? { cursor } : {}) } })
        } catch (error) { finish(`Invalid Codex model/list response: ${error.message}`) }
      }
    })
    send({ id: 0, method: 'initialize', params: { clientInfo: { name: 'war_snipe', version: '1' } } })
  })
}

const AUTO_LENSES = [
  ['correctness', 'baseline behavior and error-path review'],
  ['cascading-impact', 'downstream caller and mirror review'],
  ['test-fidelity', 'acceptance-test and anti-cheat review'],
  ['security', 'trust-boundary and injection review'],
  ['simplicity', 'minimal-design and maintenance review'],
]

function assignLenses(panel) {
  const assignments = panel.named.map(lens => ({ lens, rationale: 'operator-pinned lens' }))
  for (const [lens, rationale] of AUTO_LENSES) {
    if (assignments.length >= panel.seats) break
    if (!assignments.some(assignment => assignment.lens === lens)) assignments.push({ lens, rationale })
  }
  return assignments
}

function resultContract(request, seat, lens) {
  const scope = request.scope.kind === 'committed'
    ? { kind: 'committed', audit_sha: request.scope.headSha }
    : { kind: 'dirty', fingerprint: request.scope.fingerprint, advisory: true }
  return `Return exactly one JSON object with no Markdown or prose wrapper:
${JSON.stringify({
  schema_version: 1,
  seat,
  lens,
  scope,
  verdict: 'approve',
  confidence: 'high',
  findings: [],
  tests_verified: { exist: true, inspected: [] },
}, null, 2)}
Set tests_verified.exist to false when no tests exist; the example true value is not a requirement. Report only tests actually inspected and never invent test evidence to satisfy the schema.
Verdict is approve, request_changes, or escalate; confidence is high, medium, or low. Each finding requires severity (Critical, Major, Minor, or Nit), title, and rationale; file, locator, line, suggested_fix, and plan_ref are optional. Minor/Nit additionally require disposition (absorb, follow-up, note, or ask). An ask requires {"question":"...","alternatives":"..."}. Optional widen is a distinct nonempty lens array and is report-only. Escalate requires escalate_reason. Omit optional fields that do not apply. An approve verdict cannot carry Critical/Major findings. Echo the exact seat, lens, and scope identity shown above.`
}

function seatPrompt(request, seat, lens, rationale, concern) {
  return `AUDIT SEAT ${seat} — lens: ${lens}, depth: deep.
Lens rationale: ${rationale}.
Operator concern: ${concern || 'none — judge the declared scope on its own terms'}

Canonical scope (identical for every seat):
${JSON.stringify(request.scope, null, 2)}

Review only that scope through the assigned lens. For committed scope, ground file evidence in the pinned Git blobs, not mutable working-tree content. Dirty scope is advisory and must be identified by its fingerprint.

Role instructions:
${AUDITOR_ROLE}

${resultContract(request, seat, lens)}

Review independently. Do not widen the panel, dispatch another agent, run tests, install anything, modify files or Git state, file issues, or post comments. Do not use connectors or request escalation. Read-only shell and Git inspection are allowed. A requested write or unavailable evidence must be reported as a limitation, never worked around.`
}

function codexArgs(request, prompt) {
  return [
    'exec',
    '--ephemeral',
    '--ignore-user-config',
    '--ignore-rules',
    '--sandbox', 'read-only',
    '--json',
    '--strict-config',
    '--color', 'never',
    '--disable', 'multi_agent',
    '--disable', 'apps',
    '--disable', 'browser_use',
    '--disable', 'computer_use',
    '--disable', 'in_app_browser',
    '--disable', 'plugins',
    '--disable', 'hooks',
    '-C', request.scope.repository,
    '-m', request.profile.model,
    '-c', `model_reasoning_effort="${request.profile.effort}"`,
    '-c', 'approval_policy="never"',
    '-c', 'mcp_servers={}',
    '-c', 'shell_environment_policy.inherit="none"',
    prompt,
  ]
}

function finalResponse(stdout) {
  let response = null
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && typeof event.item.text === 'string') {
        response = event.item.text
      }
    } catch { /* S3 reports malformed output; S2 retains it below. */ }
  }
  return response
}

function runSeat(request, seat, assignment, concern, { codexPath, timeoutMs, maxOutputBytes, signal, prompt }) {
  return new Promise(resolve => {
    const { lens, rationale } = assignment
    const useProcessGroup = process.platform !== 'win32'
    const child = spawn(codexPath, codexArgs(request, prompt ?? seatPrompt(request, seat, lens, rationale, concern)), {
      cwd: request.scope.repository,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: useProcessGroup,
    })
    const stdoutChunks = []
    const stderrChunks = []
    let outputBytes = 0
    let truncated = false
    let terminalReason = null
    let spawnError = null
    let killTimer = null
    let timer = null
    const killTree = exitSignal => {
      try {
        if (useProcessGroup && child.pid) process.kill(-child.pid, exitSignal)
        else child.kill(exitSignal)
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
    const stop = reason => {
      if (terminalReason) return
      terminalReason = reason
      clearTimeout(timer)
      killTree('SIGTERM')
      killTimer = setTimeout(() => killTree('SIGKILL'), 1_000)
    }
    const collect = (chunks, chunk) => {
      const remaining = Math.max(0, maxOutputBytes - outputBytes)
      if (remaining) chunks.push(chunk.subarray(0, remaining))
      outputBytes += Math.min(chunk.length, remaining)
      if (chunk.length > remaining) {
        truncated = true
        stop('output_limit')
      }
    }
    child.stdout.on('data', chunk => collect(stdoutChunks, chunk))
    child.stderr.on('data', chunk => collect(stderrChunks, chunk))
    timer = setTimeout(() => stop('timed_out'), timeoutMs)
    const cancel = () => stop('cancelled')
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) cancel()
    child.once('error', error => {
      spawnError = error
    })
    child.once('close', (exitCode, exitSignal) => {
      clearTimeout(timer)
      clearTimeout(killTimer)
      signal?.removeEventListener('abort', cancel)
      const stdout = Buffer.concat(stdoutChunks).toString('utf8')
      const stderr = Buffer.concat(stderrChunks).toString('utf8')
      const response = finalResponse(stdout)
      const status = terminalReason ?? (exitCode === 0 && response !== null ? 'completed' : 'failed')
      resolve({ seat, lens, rationale, status, exitCode, signal: exitSignal, response, stdout, stderr, truncated, error: spawnError?.message })
    })
  })
}

function repairPrompt(request, seat, lens, response, error) {
  return `SCHEMA REPAIR for AUDIT SEAT ${seat} — lens: ${lens}, schema-only.
Canonical scope:
${JSON.stringify(request.scope, null, 2)}

Your previous response failed validation: ${error.code}: ${error.message}
Previous response:
${response ?? '(missing)'}

Return only one corrected Snipe result JSON object. Preserve the original review judgment and findings; correct only schema, aliases, seat/lens, and scope identity. Do not inspect files, run commands, use tools, widen the panel, request escalation, or perform any external action.`
}

async function runValidatedSeat(request, seat, assignment, concern, options) {
  const expected = { seat, lens: assignment.lens, scope: request.scope }
  const initial = await runSeat(request, seat, assignment, concern, options)
  if (initial.status !== 'completed') {
    return { ...initial, validation: { status: 'unavailable', error: `transport status: ${initial.status}` }, repair: { attempted: false, succeeded: false } }
  }
  try {
    const verdict = parseSnipeVerdict(initial.response, expected)
    return { ...initial, verdict, validation: { status: 'valid', error: null }, repair: { attempted: false, succeeded: false } }
  } catch (error) {
    const repaired = await runSeat(request, seat, assignment, concern, {
      ...options,
      prompt: repairPrompt(request, seat, assignment.lens, initial.response, error),
    })
    if (repaired.status === 'completed') {
      try {
        const verdict = parseSnipeVerdict(repaired.response, expected)
        return {
          ...repaired,
          verdict,
          validation: { status: 'valid', error: null },
          repair: { attempted: true, succeeded: true, initialError: { code: error.code, message: error.message }, initialResponse: initial.response },
        }
      } catch (repairError) {
        return {
          ...repaired,
          status: 'invalid_result',
          verdict: null,
          validation: { status: 'invalid', error: repairError.message, code: repairError.code },
          repair: { attempted: true, succeeded: false, initialError: { code: error.code, message: error.message }, initialResponse: initial.response },
        }
      }
    }
    return {
      ...repaired,
      verdict: null,
      validation: { status: 'unavailable', error: `repair transport status: ${repaired.status}` },
      repair: { attempted: true, succeeded: false, initialError: { code: error.code, message: error.message }, initialResponse: initial.response },
    }
  }
}

export async function runSnipePanel(input, options = {}) {
  const request = prepareSnipeRequest(input)
  const assignments = assignLenses(request.panel)
  const concern = input.concern ?? ''
  if (typeof concern !== 'string') throw new TypeError('concern must be a string')
  const codexPath = options.codexPath ?? 'codex'
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000
  const maxOutputBytes = options.maxOutputBytes ?? 4 * 1024 * 1024
  const capacity = options.capacity ?? assignments.length
  if (!Number.isInteger(capacity) || capacity < 1) throw new TypeError('capacity must be a positive integer')
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('timeoutMs must be a positive integer')
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1) throw new TypeError('maxOutputBytes must be a positive integer')

  const signal = options.signal
  const seats = Array(assignments.length)
  let nextSeat = 0
  async function worker() {
    while (nextSeat < assignments.length) {
      const index = nextSeat
      nextSeat += 1
      const seat = index + 1
      const assignment = assignments[index]
      const { lens, rationale } = assignment
      if (signal?.aborted) {
        seats[index] = { seat, lens, rationale, status: 'cancelled', exitCode: null, signal: null, response: null, stdout: '', stderr: '', truncated: false }
        continue
      }
      seats[index] = await runValidatedSeat(request, seat, assignment, concern, { codexPath, timeoutMs, maxOutputBytes, signal })
    }
  }
  await Promise.all(Array.from({ length: Math.min(capacity, assignments.length) }, () => worker()))
  const stability = verifySnipeScope(request.scope)
  const panel = {
    request,
    seats: Object.freeze(seats),
    stability: Object.freeze(stability),
    complete: stability.stable && seats.every(seat => seat.status === 'completed' && seat.validation.status === 'valid'),
  }
  return Object.freeze({ ...panel, report: renderSnipeReport(panel) })
}

function cliOptions(argv) {
  const values = {}
  const allowed = new Set(['--request', '--capacity', '--timeout-ms', '--max-output-bytes', '--codex-path'])
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    const value = argv[index + 1]
    if (!allowed.has(name) || value == null) throw new Error(`unknown or incomplete option '${name ?? ''}'`)
    values[name] = value
  }
  if (!values['--request']) throw new Error('usage: snipe-runner.mjs --request <absolute-json-file> [--capacity N]')
  return {
    requestPath: values['--request'],
    codexPath: values['--codex-path'],
    capacity: values['--capacity'] === undefined ? undefined : Number(values['--capacity']),
    timeoutMs: values['--timeout-ms'] === undefined ? undefined : Number(values['--timeout-ms']),
    maxOutputBytes: values['--max-output-bytes'] === undefined ? undefined : Number(values['--max-output-bytes']),
  }
}

async function main(argv) {
  if (argv[0] === '--list-profiles') {
    if (argv.length !== 1) throw new Error('usage: snipe-runner.mjs --list-profiles')
    process.stdout.write(`${JSON.stringify(await listSupportedProfiles(), null, 2)}\n`)
    return
  }
  const options = cliOptions(argv)
  const input = JSON.parse(readFileSync(options.requestPath, 'utf8'))
  if (input.supportedProfiles === undefined) input.supportedProfiles = await listSupportedProfiles({ codexPath: options.codexPath })
  const controller = new AbortController()
  const cancel = () => controller.abort()
  process.once('SIGINT', cancel)
  process.once('SIGTERM', cancel)
  try {
    const result = await runSnipePanel(input, { ...options, signal: controller.signal })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (!result.complete) process.exitCode = 1
  } finally {
    process.removeListener('SIGINT', cancel)
    process.removeListener('SIGTERM', cancel)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(`${JSON.stringify({ error: error.message, code: error.code ?? 'RUNNER_ERROR' })}\n`)
    process.exitCode = 2
  })
}
