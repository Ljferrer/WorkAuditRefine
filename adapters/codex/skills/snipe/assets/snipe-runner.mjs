// Bounded read-only Codex seat coordinator for /snipe.

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { prepareSnipeRequest, verifySnipeScope } from './snipe-request.mjs'
import { parseSnipeVerdict, renderSnipeReport } from './snipe-result.mjs'
import { prepareSnipeSubmodules } from './snipe-submodules.mjs'
import { processTreeCleanup, processGroup } from './snipe-process.mjs'
import { gitEvidenceEnvironment } from './snipe-git-policy.mjs'

const AUDITOR_ROLE = readFileSync(new URL('../references/codex-auditor.md', import.meta.url), 'utf8').trim()
const AUDITOR_FIX_REVIEW = readFileSync(new URL('../references/auditing-fixes.md', import.meta.url), 'utf8')
const COORDINATOR_GUIDANCE = Object.freeze({
  source: 'references/post-audit-fixes.md',
  text: readFileSync(new URL('../references/post-audit-fixes.md', import.meta.url), 'utf8'),
})

import { resolveCodexPath, listSupportedProfiles } from './codex-models.mjs'
export { resolveCodexPath, listSupportedProfiles }
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

${AUDITOR_FIX_REVIEW}

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
    ...Object.entries(gitEvidenceEnvironment).flatMap(([key, value]) => ['-c', `shell_environment_policy.set.${key}=${JSON.stringify(value)}`]),
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
    const child = spawn(codexPath, codexArgs(request, prompt ?? seatPrompt(request, seat, lens, rationale, concern)), {
      cwd: request.scope.repository,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: processGroup,
    })
    const stdoutChunks = []
    const killTree = processTreeCleanup(child)
    const stderrChunks = []
    let outputBytes = 0
    let truncated = false
    let terminalReason = null
    let spawnError = null
    let timer = null
    let settled = false
    const stop = reason => {
      if (terminalReason) return
      terminalReason = reason
      clearTimeout(timer)
      killTree()
    }
    const collect = (chunks, chunk) => {
      if (settled) return
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
    killTree.settled.then(cleanup => {
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      const stdout = Buffer.concat(stdoutChunks).toString('utf8')
      const stderr = Buffer.concat(stderrChunks).toString('utf8')
      const response = finalResponse(stdout)
      const status = terminalReason ?? (!cleanup.cleanupError && child.exitCode === 0 && response !== null ? 'completed' : 'failed')
      resolve({ seat, lens, rationale, status, exitCode: child.exitCode, signal: child.signalCode, response, stdout, stderr, truncated, error: spawnError?.message, ...cleanup })
    })
  })
}

async function runValidatedSeat(request, seat, assignment, concern, options) {
  const expected = { seat, lens: assignment.lens, scope: request.scope }
  const initial = await runSeat(request, seat, assignment, concern, options)
  if (initial.status !== 'completed') {
    return { ...initial, validation: { status: 'unavailable', error: `transport status: ${initial.status}${initial.cleanupError ? `; cleanup ${initial.cleanupError.code}: ${initial.cleanupError.message}; process group ${initial.processGroupId}, termination unconfirmed (operator cleanup required)` : ''}` }, repair: { attempted: false, succeeded: false } }
  }
  try {
    const verdict = parseSnipeVerdict(initial.response, expected)
    return { ...initial, verdict, validation: { status: 'valid', error: null }, repair: { attempted: false, succeeded: false } }
  } catch (error) {
    // A fresh model response cannot prove preservation of an invalid judgment.
    // Keep the original evidence; only the parser's deterministic aliases normalize it.
    return {
      ...initial,
      status: 'invalid_result',
      verdict: null,
      validation: { status: 'invalid', error: error.message, code: error.code },
      repair: { attempted: false, succeeded: false },
    }
  }
}

export async function runSnipePanel(input, options = {}) {
  let request = prepareSnipeRequest(input)
  const assignments = assignLenses(request.panel)
  const concern = input.concern ?? ''
  if (typeof concern !== 'string') throw new TypeError('concern must be a string')
  const codexPath = resolveCodexPath(options.codexPath)
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000
  const maxOutputBytes = options.maxOutputBytes ?? 4 * 1024 * 1024
  const capacity = options.capacity ?? assignments.length
  if (!Number.isInteger(capacity) || capacity < 1) throw new TypeError('capacity must be a positive integer')
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('timeoutMs must be a positive integer')
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1) throw new TypeError('maxOutputBytes must be a positive integer')

  const signal = options.signal
  const preparation = await prepareSnipeSubmodules(request.scope, { remotes: input.submoduleRemotes, signal })
  request = Object.freeze({ ...request, scope: preparation.scope })
  // Only release object stores once every launched reader has settled safely.
  let retainPreparation = true
  try {
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
    retainPreparation = seats.some(seat => seat.cleanupError)
    const stability = verifySnipeScope(request.scope)
    const unavailablePaths = Object.freeze([...new Set((request.scope.submodules ?? [])
      .filter(change => !change.contentsAvailable).map(change => change.path))])
    const coverage = Object.freeze({ complete: unavailablePaths.length === 0, unavailablePaths })
    const panel = {
      request,
      seats: Object.freeze(seats),
      stability: Object.freeze(stability),
      coverage,
      retainedRoot: retainPreparation ? preparation.root ?? null : null,
      complete: coverage.complete && stability.stable && seats.every(seat => seat.status === 'completed' && seat.validation.status === 'valid'),
    }
    return Object.freeze({ coordinatorGuidance: COORDINATOR_GUIDANCE, ...panel, report: renderSnipeReport(panel) })
  } catch (error) {
    if (retainPreparation && preparation.root) {
      error.retainedRoot = preparation.root
      error.message += `; operator cleanup required, review objects retained at ${preparation.root}`
    }
    throw error
  } finally { if (!retainPreparation) preparation.dispose() }
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

async function execute(argv, signal) {
  if (argv[0] === '--list-profiles') {
    if (argv.length !== 1 && !(argv.length === 3 && argv[1] === '--codex-path')) throw new Error('usage: snipe-runner.mjs --list-profiles [--codex-path /absolute/path/to/codex]')
    process.stdout.write(`${JSON.stringify(await listSupportedProfiles({ codexPath: argv[2], signal }), null, 2)}\n`)
    return
  }
  const options = cliOptions(argv)
  options.codexPath = resolveCodexPath(options.codexPath)
  const input = JSON.parse(readFileSync(options.requestPath, 'utf8'))
  if (input.supportedProfiles === undefined) input.supportedProfiles = await listSupportedProfiles({ codexPath: options.codexPath, signal })
  const result = await runSnipePanel(input, { ...options, signal })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (!result.complete) process.exitCode = 1
}

async function main(argv) {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  process.once('SIGINT', cancel)
  process.once('SIGTERM', cancel)
  try {
    await execute(argv, controller.signal)
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
