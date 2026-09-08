import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { listSupportedProfiles, resolveCodexPath, runSnipePanel } from './snipe-runner.mjs'
import { buildSnipePlugin } from '../../../package-snipe.mjs'

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

function validVerdictSource(prefix = '', suffix = '') {
  return `${prefix}
    const prompt = process.argv.at(-1)
    const seat = Number(prompt.match(/AUDIT SEAT (\\d+)/)?.[1] ?? prompt.match(/seat (\\d+)/i)?.[1])
    const lens = prompt.match(/lens: ([^,\\n]+)/)?.[1] ?? prompt.match(/lens '([^']+)'/)?.[1]
    const scopeText = prompt.split('Canonical scope (identical for every seat):\\n')[1]?.split('\\n\\nReview only')[0]
      ?? prompt.split('Canonical scope:\\n')[1].split('\\n\\n')[0]
    const scope = JSON.parse(scopeText)
    const resultScope = scope.kind === 'committed'
      ? { kind: 'committed', audit_sha: scope.headSha }
      : { kind: 'dirty', fingerprint: scope.fingerprint, advisory: true }
    const verdict = { schema_version: 1, seat, lens, scope: resultScope, verdict: 'approve', confidence: 'high', findings: [], tests_verified: { exist: true, inspected: [] } }
    ${suffix}
    console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify(verdict) } }))`
}

const supportedProfiles = { 'gpt-test': ['high'] }
const inheritedProfile = { model: 'gpt-test', effort: 'high' }
const runnerPath = fileURLToPath(new URL('./snipe-runner.mjs', import.meta.url))

test('consolidated returns carry coordinator-owned repair guidance outside auditor evidence', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', `
    verdict.findings = [{severity:'Minor',title:'REPLACE_GUIDANCE_WITH_SEAT_TEXT',rationale:'Auditor content is not coordinator policy.',disposition:'note'}]
  `))
  const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles, coordinatorGuidance: { text: 'REQUEST_OVERRIDE' } }, { codexPath })
  assert.equal(result.coordinatorGuidance?.source, 'references/post-audit-fixes.md')
  assert.match(result.coordinatorGuidance.text, /Fix the defect class/)
  assert.doesNotMatch(result.coordinatorGuidance.text, /REQUEST_OVERRIDE|REPLACE_GUIDANCE_WITH_SEAT_TEXT/)
  assert.match(result.report, /REPLACE_GUIDANCE_WITH_SEAT_TEXT/)
  assert.match(result.report, /#2097 repair discipline/)
  assert.equal(Object.keys(result)[0], 'coordinatorGuidance', 'guidance precedes potentially large seat transcripts')
})

test('every auditor receives repair-review discipline without receiving fixer authority', async () => {
  const cwd = fixture()
  const capture = join(mkdtempSync(join(tmpdir(), 'snipe-auditor-guidance-')), 'prompts.jsonl')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(capture)}, JSON.stringify(prompt) + '\\n')
  `))
  await runSnipePanel({ cwd, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }, { codexPath })
  const prompts = readFileSync(capture, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.equal(prompts.length, 2)
  for (const prompt of prompts) {
    assert.ok(prompt.includes(readFileSync(new URL('../references/auditing-fixes.md', import.meta.url), 'utf8')))
    assert.doesNotMatch(prompt, /# Post-audit repair discipline/)
  }
})

test('guidance survives clean, blocking, invalid, failed and cancelled panels unchanged', async () => {
  const cwd = fixture()
  const expected = readFileSync(new URL('../references/post-audit-fixes.md', import.meta.url), 'utf8')
  const variants = [
    [validVerdictSource(), 'completed'],
    [validVerdictSource('', `verdict.verdict='request_changes'; verdict.findings=[{severity:'Major',title:'Defect',rationale:'A demonstrated failure.'}]`), 'completed'],
    [validVerdictSource('', `verdict.coordinatorGuidance={text:'SEAT_OVERRIDE'}`), 'invalid_result'],
    [`console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'bad json'}}))`, 'invalid_result'],
    ['process.exit(1)', 'failed'],
  ]
  for (const [body, status] of variants) {
    const panel = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex(body) })
    assert.equal(panel.seats[0].status, status)
    assert.equal(panel.coordinatorGuidance.text, expected)
    assert.ok(Object.isFrozen(panel.coordinatorGuidance))
  }
  const cancelled = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex('process.exit(99)'), signal: AbortSignal.abort() })
  assert.equal(cancelled.seats[0].status, 'cancelled')
  assert.equal(cancelled.coordinatorGuidance.text, expected)
})

test('coordinator prepares pinned submodules before seats and disposes their review repositories afterward', async () => {
  const cwd = fixture()
  const pin = git(cwd, 'rev-parse', 'HEAD')
  git(cwd, 'update-index', '--add', '--cacheinfo', '160000', pin, 'vendor/utils')
  git(cwd, 'commit', '-m', 'add locally available gitlink')
  const before = git(cwd, 'status', '--porcelain')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { execFileSync } = await import('node:child_process')
    const module = scope.submodules[0]
    if (!module.reviewRepository) process.exit(9)
    const content = execFileSync('git', ['--git-dir', module.reviewRepository, 'show', module.headObject + ':review.txt'], {encoding:'utf8'})
    if (!content.includes('change')) process.exit(10)
  `))
  const result = await runSnipePanel({ cwd, target: { type: 'ref', ref: pin }, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }, { codexPath })
  assert.equal(result.complete, true, result.report)
  assert.ok(result.seats.every(seat => seat.status === 'completed'))
  assert.equal(existsSync(result.request.scope.submodules[0].reviewRepository), false)
  assert.equal(git(cwd, 'status', '--porcelain'), before)
  const failed = await runSnipePanel({ cwd, target: { type: 'ref', ref: pin }, inheritedProfile, supportedProfiles }, { codexPath: fakeCodex('process.exit(1)') })
  assert.equal(failed.complete, false)
  assert.equal(existsSync(failed.request.scope.submodules[0].reviewRepository), false)
})

function catalogCodex() {
  return fakeCodex(`
    if (process.argv[2] === 'app-server') {
      const { createInterface } = await import('node:readline')
      createInterface({ input: process.stdin }).on('line', line => {
        const request = JSON.parse(line)
        if (request.method === 'initialized') return
        if (!['initialize', 'model/list'].includes(request.method)) process.exit(9)
        const result = request.method === 'initialize' ? {} : request.params.cursor
          ? { data: [{model:'gpt-other', supportedReasoningEfforts:[{reasoningEffort:'low'}]}], nextCursor:null }
          : { data: [{model:'gpt-test', supportedReasoningEfforts:[{reasoningEffort:'high'}]}], nextCursor:'page2' }
        console.log(JSON.stringify({id:request.id, result}))
      })
    } else {
      ${validVerdictSource()}
    }
  `)
}

test('host catalog discovery initializes and consumes every model page without starting a turn', async () => {
  assert.deepEqual({ ...await listSupportedProfiles({ codexPath: catalogCodex() }) }, { 'gpt-test': ['high'], 'gpt-other': ['low'] })
})

test('Desktop runtime resolves Codex without a PATH alias; explicit overrides fail closed', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'snipe-desktop-')))
  const resources = join(root, 'Test App.app', 'Contents', 'Resources')
  mkdirSync(resources, { recursive: true })
  const binary = join(resources, 'codex')
  copyFileSync(catalogCodex(), binary)
  chmodSync(binary, 0o755)
  const env = { PATH: '', CODEX_MCP_NODE_PATH: join(resources, 'cua_node/bin/node') }
  assert.equal(resolveCodexPath(undefined, env), binary)
  assert.equal(resolveCodexPath(undefined, { PATH: resources }), binary)
  assert.equal(resolveCodexPath(undefined, { PATH: '', SNIPE_CODEX_BIN: binary }), binary)
  assert.throws(() => resolveCodexPath('/missing/codex', env), error => error.code === 'CODEX_EXECUTABLE_UNAVAILABLE' && /\/missing\/codex.*--codex-path/.test(error.message))
  assert.throws(() => resolveCodexPath(undefined, { PATH: '' }), /CODEX|Codex executable unavailable/)

  // Absolute shebang removes even Node's PATH dependency from the fake host.
  writeFileSync(binary, readFileSync(binary, 'utf8').replace('#!/usr/bin/env node', `#!${process.execPath}`))
  const profiles = JSON.parse(execFileSync(process.execPath, [runnerPath, '--list-profiles', '--codex-path', binary], { env: { ...process.env, PATH: '' }, encoding: 'utf8' }))
  assert.deepEqual(profiles['gpt-test'], ['high'])
  const cwd = fixture()
  const requestPath = join(root, 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'high' } }))
  // Git is available, but neither system directory contains a Codex executable.
  const result = JSON.parse(execFileSync(process.execPath, [runnerPath, '--request', requestPath], {
    env: { ...process.env, PATH: '/usr/bin:/bin', SNIPE_CODEX_BIN: undefined, CODEX_MCP_NODE_PATH: env.CODEX_MCP_NODE_PATH }, encoding: 'utf8',
  }))
  assert.equal(result.complete, true)
})

test('CLI accepts explicit profile without task metadata or a supplied profile map', () => {
  const cwd = fixture()
  const requestPath = join(mkdtempSync(join(tmpdir(), 'snipe-explicit-')), 'request.json')
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'high' } }))
  const result = JSON.parse(execFileSync(process.execPath, [runnerPath, '--request', requestPath, '--codex-path', catalogCodex()], { encoding: 'utf8' }))
  assert.equal(result.complete, true)
  assert.deepEqual(result.request.profile, { model: 'gpt-test', effort: 'high' })
  writeFileSync(requestPath, JSON.stringify({ cwd, profile: { model: 'gpt-test', effort: 'unsupported' } }))
  assert.throws(() => execFileSync(process.execPath, [runnerPath, '--request', requestPath, '--codex-path', catalogCodex()], { stdio: 'pipe' }), error => /UNSUPPORTED_PROFILE/.test(error.stderr.toString()))
})

test('catalog errors, malformed output, early exit and timeout fail visibly', async () => {
  for (const body of [
    `console.log(JSON.stringify({id:0,error:{message:'unavailable'}}))`,
    `console.log('not JSON')`,
    `process.exit(1)`,
    `setInterval(() => {}, 1000)`,
  ]) {
    await assert.rejects(listSupportedProfiles({ codexPath: fakeCodex(body), timeoutMs: 200 }), error => error.code === 'PROFILE_DISCOVERY_FAILED')
  }
})

test('catalog completion and failures terminate inherited descendant processes', async () => {
  for (const mode of ['success', 'malformed', 'timeout', 'output', 'exit', 'cancel', 'error']) {
    const pidPath = join(mkdtempSync(join(tmpdir(), 'snipe-descendant-')), 'pid')
    const codexPath = fakeCodex(`
      const { spawn } = await import('node:child_process')
      const { writeFileSync } = await import('node:fs')
      const descendant = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'inherit'})
      writeFileSync(${JSON.stringify(pidPath)}, String(descendant.pid))
      if (${JSON.stringify(mode)} === 'success') {
        console.log(JSON.stringify({id:0,result:{}}))
        console.log(JSON.stringify({id:1,result:{data:[{model:'gpt-test',supportedReasoningEfforts:[{reasoningEffort:'high'}]}]}}))
      } else if (${JSON.stringify(mode)} === 'malformed') console.log('bad JSON')
      else if (${JSON.stringify(mode)} === 'output') console.log('x'.repeat(1024*1024+1))
      else if (${JSON.stringify(mode)} === 'exit') process.exit(1)
      else if (${JSON.stringify(mode)} === 'error') console.log(JSON.stringify({id:0,error:{message:'catalog unavailable'}}))
      setInterval(() => {}, 1000)
    `)
    let pid
    const controller = new AbortController()
    const cancelTimer = mode === 'cancel' ? setTimeout(() => controller.abort(), 400) : null
    try {
      const pending = listSupportedProfiles({ codexPath, timeoutMs: 800, signal: controller.signal })
      if (mode === 'success') await pending
      else await assert.rejects(pending, { code: 'PROFILE_DISCOVERY_FAILED' })
      pid = Number(readFileSync(pidPath, 'utf8'))
      await new Promise(resolve => setTimeout(resolve, 50))
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, mode)
    } finally {
      clearTimeout(cancelTimer)
      pid ??= existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8')) : null
      if (pid) { try { process.kill(pid, 'SIGKILL') } catch {} }
    }
  }
})

test('successful auditor exit kills descendants even when they close inherited pipes', async () => {
  const cwd = fixture()
  const pidPath = join(mkdtempSync(join(tmpdir(), 'snipe-seat-descendant-')), 'pid')
  const codexPath = fakeCodex(validVerdictSource(`
    const { spawn } = await import('node:child_process')
    const { writeFileSync } = await import('node:fs')
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore'})
    child.unref()
    writeFileSync(${JSON.stringify(pidPath)}, String(child.pid))
  `))
  let pid
  try {
    const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath })
    assert.equal(result.complete, true)
    pid = Number(readFileSync(pidPath, 'utf8'))
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  } finally {
    pid ??= existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8')) : null
    if (pid) { try { process.kill(pid, 'SIGKILL') } catch {} }
  }
})

test('one seat runs through a fresh read-only Codex process with the canonical scope', async () => {
  const cwd = fixture()
  const capturePath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-capture-')), 'capture.json')
  const codexPath = fakeCodex(validVerdictSource('', `
    const argv = process.argv.slice(2)
    const { writeFileSync } = await import('node:fs')
    writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify({ argv: argv.slice(0, -1), prompt }))
  `))

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
  const response = JSON.parse(readFileSync(capturePath, 'utf8'))
  assert.deepEqual(response.argv.slice(0, 7), [
    'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--sandbox', 'read-only', '--json',
  ])
  assert.ok(response.argv.includes('approval_policy="never"'))
  assert.ok(response.argv.includes('mcp_servers={}'))
  assert.ok(response.argv.includes('shell_environment_policy.inherit="none"'))
  assert.ok(response.argv.includes('shell_environment_policy.set.GIT_NO_REPLACE_OBJECTS="1"'))
  assert.ok(response.argv.includes('shell_environment_policy.set.GIT_NO_LAZY_FETCH="1"'))
  for (const capability of ['multi_agent', 'apps', 'browser_use', 'computer_use', 'in_app_browser', 'plugins', 'hooks']) {
    assert.ok(response.argv.some((value, index) => value === '--disable' && response.argv[index + 1] === capability))
  }
  assert.match(response.prompt, new RegExp(result.request.scope.headSha))
  assert.match(response.prompt, /AUDIT SEAT 1 — lens: correctness/)
  assert.match(response.prompt, /Operator concern: Focus on cancellation semantics\./)
  assert.match(response.prompt, /"schema_version": 1/)
  assert.match(response.prompt, new RegExp(`"audit_sha": "${result.request.scope.headSha}"`))
  assert.match(response.prompt, /Return exactly one JSON object with no Markdown or prose wrapper/)
  assert.match(response.prompt, /Do not widen the panel/)
  assert.match(response.prompt, /Do not use connectors or request escalation/)
})

test('auditor policy preserves original blobs and removing its injection breaks the evidence oracle', async () => {
  const cwd = fixture()
  git(cwd, 'replace', git(cwd, 'rev-parse', 'HEAD:review.txt'), git(cwd, 'rev-parse', 'refs/remotes/origin/main:review.txt'))
  assert.equal(git(cwd, 'show', 'HEAD:review.txt'), 'base')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { execFileSync } = await import('node:child_process')
    const env = {PATH:'/usr/bin:/bin'}
    for (const arg of process.argv) {
      const match = arg.match(/^shell_environment_policy\\.set\\.([^=]+)=(.*)$/)
      if (match) env[match[1]] = JSON.parse(match[2])
    }
    const actual = execFileSync('/usr/bin/git', ['show', scope.headSha + ':review.txt'], {cwd:scope.repository,env,encoding:'utf8'})
    if (actual !== 'base\\nchange\\n') process.exit(61)
  `))
  const input = { cwd, inheritedProfile, supportedProfiles }
  assert.equal((await runSnipePanel(input, { codexPath })).complete, true)
  const output = join(mkdtempSync(join(tmpdir(), 'snipe-policy-mutant-')), 'plugin')
  buildSnipePlugin({ repoRoot: fileURLToPath(new URL('../../../../../', import.meta.url)), output })
  const file = join(output, 'skills/snipe/assets/snipe-runner.mjs')
  const original = readFileSync(file, 'utf8')
  const mutant = original.replace(/^.*Object.entries\(gitEvidenceEnvironment\).*\n/m, '')
  assert.notEqual(mutant, original)
  writeFileSync(file, mutant)
  const runner = await import(pathToFileURL(file))
  const result = await runner.runSnipePanel(input, { codexPath })
  assert.equal(result.complete, false)
  assert.equal(result.seats[0].exitCode, 61)
})

test('five independent seats are capacity-bounded, distinct, and receive identical scope', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-concurrency-')), 'events.log')
  const codexPath = fakeCodex(validVerdictSource(`
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, 'start ' + process.pid + '\\n')
    await new Promise(resolve => setTimeout(resolve, 120))
  `, `appendFileSync(${JSON.stringify(logPath)}, 'end ' + process.pid + ' ' + Buffer.from(JSON.stringify(scope)).toString('base64') + '\\n')`))

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
  let active = 0
  let maximum = 0
  const events = readFileSync(logPath, 'utf8').trim().split('\n')
  for (const event of events) {
    active += event.startsWith('start ') ? 1 : -1
    maximum = Math.max(maximum, active)
  }
  assert.equal(active, 0)
  assert.equal(maximum, 2)
  assert.equal(new Set(events.filter(event => event.startsWith('start ')).map(event => event.split(' ')[1])).size, 5, 'each seat has a fresh process')
  assert.equal(new Set(events.filter(event => event.startsWith('end ')).map(event => event.split(' ')[2])).size, 1, 'scope is byte-identical')
})

test('a nonzero seat is retained without losing a successful peer', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource(`
    if (process.argv.at(-1).includes('lens: security')) {
      console.error('seat transport failed')
      process.exit(7)
    }
  `))

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

test('stable parent scope and approving seats cannot hide missing changed gitlink contents', async () => {
  const cwd = fixture()
  git(cwd, 'update-index', '--add', '--cacheinfo', '160000', 'a'.repeat(40), 'vendor/utils')
  git(cwd, 'commit', '-m', 'consume unavailable submodule')
  const codexPath = fakeCodex(validVerdictSource())
  const input = { cwd, rawArgs: 'correctness,security', inheritedProfile, supportedProfiles }
  const result = await runSnipePanel(input, { codexPath })
  assert.equal(result.stability.stable, true)
  assert.ok(result.seats.every(seat => seat.status === 'completed' && seat.verdict.verdict === 'approve'))
  assert.equal(result.complete, false)
  assert.deepEqual(result.coverage.unavailablePaths, ['vendor/utils'])
  assert.match(result.report, /INCOMPLETE/)
  assert.match(result.report, /Review coverage: incomplete/)
  assert.match(result.report, /vendor\/utils/)
  const request = join(mkdtempSync(join(tmpdir(), 'snipe-coverage-')), 'request.json')
  writeFileSync(request, JSON.stringify(input))
  assert.throws(() => execFileSync(process.execPath, [runnerPath, '--request', request, '--codex-path', codexPath], { stdio: 'pipe' }), error => error.status === 1 && JSON.parse(error.stdout).complete === false)
})

test('a seat reporting absent tests completes without a repair that invents evidence', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', 'verdict.tests_verified = { exist: false, inspected: [] }'))
  const result = await runSnipePanel({ cwd, inheritedProfile, supportedProfiles }, { codexPath, timeoutMs: 2_000 })
  assert.equal(result.complete, true)
  assert.equal(result.seats[0].repair.attempted, false)
  assert.deepEqual(result.seats[0].verdict.tests_verified, { exist: false, inspected: [] })
})

test('malformed judgment is preserved without launching a replacement review', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-repair-')), 'attempts.log')
  const codexPath = fakeCodex(validVerdictSource(`
    const { appendFileSync, readFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, 'attempt\\n')
    if (readFileSync(${JSON.stringify(logPath)}, 'utf8').trim().split('\\n').length === 1) {
      console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"verdict":' } }))
      process.exit(0)
    }
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(readFileSync(logPath, 'utf8').trim().split('\n').length, 1)
  assert.equal(result.complete, false)
  assert.equal(result.seats[0].status, 'invalid_result')
  assert.equal(result.seats[0].validation.status, 'invalid')
  assert.equal(result.seats[0].repair.attempted, false)
  assert.equal(result.seats[0].verdict, null)
  assert.equal(result.seats[0].response, '{"verdict":')
})

test('a persistently invalid seat is incomplete while a valid peer finding survives', async () => {
  const cwd = fixture()
  const logPath = join(mkdtempSync(join(tmpdir(), 'codex-snipe-invalid-')), 'attempts.log')
  const codexPath = fakeCodex(validVerdictSource('', `
    const { appendFileSync } = await import('node:fs')
    appendFileSync(${JSON.stringify(logPath)}, lens + '\\n')
    if (lens === 'security') {
      console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"verdict":' } }))
      process.exit(0)
    }
    verdict.verdict = 'request_changes'
    verdict.findings = [{ severity: 'Major', title: 'Input bypasses validation', file: 'review.txt', rationale: 'The changed path accepts NaN.' }]
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness,security',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 2, timeoutMs: 2_000 })

  assert.equal(result.complete, false)
  assert.equal(result.seats[0].validation.status, 'valid')
  assert.equal(result.seats[0].verdict.findings[0].title, 'Input bypasses validation')
  assert.equal(result.seats[1].status, 'invalid_result')
  assert.equal(result.seats[1].repair.attempted, false)
  assert.equal(result.seats[1].repair.succeeded, false)
  assert.deepEqual(readFileSync(logPath, 'utf8').trim().split('\n').sort(), ['correctness', 'security'])
  assert.match(result.report, /INCOMPLETE — do not interpret this panel as clean/)
  assert.match(result.report, /Input bypasses validation/)
  assert.match(result.report, /Seat 2 · security: invalid_result/)
})

test('widen and disposition fields remain report-only without launching actions or seats', async () => {
  const cwd = fixture()
  const codexPath = fakeCodex(validVerdictSource('', `
    verdict.widen = ['security', 'cascading-impact']
    verdict.findings = [
      { severity: 'Minor', title: 'Mechanical correction', rationale: 'The edit is fully specified.', disposition: 'absorb' },
      { severity: 'Nit', title: 'Later migration', rationale: 'The release slot is separate.', disposition: 'follow-up', barrier: 'barrier:release-slot' },
    ]
  `))

  const result = await runSnipePanel({
    cwd,
    rawArgs: 'correctness',
    inheritedProfile,
    supportedProfiles,
  }, { codexPath, capacity: 1, timeoutMs: 2_000 })

  assert.equal(result.seats.length, 1)
  assert.equal(result.complete, true)
  assert.deepEqual(result.seats[0].verdict.widen, ['security', 'cascading-impact'])
  assert.match(result.report, /no extra seats launched/i)
  assert.match(result.report, /Disposition: absorb \(classification only\)/)
  assert.match(result.report, /Disposition: follow-up \(classification only\)/)
})

test('dirty scope changed during a seat is reported unstable and cannot complete cleanly', async () => {
  const cwd = fixture()
  writeFileSync(join(cwd, 'initial-untracked.txt'), 'before\n')
  const codexPath = fakeCodex(validVerdictSource(`
    const { writeFileSync } = await import('node:fs')
    writeFileSync('concurrent-change.txt', 'changed during review\\n')
  `))

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
  const codexPath = fakeCodex(validVerdictSource())
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
  assert.equal(result.coordinatorGuidance.source, 'references/post-audit-fixes.md')
  assert.equal(result.coordinatorGuidance.text, readFileSync(new URL('../references/post-audit-fixes.md', import.meta.url), 'utf8'))
  assert.deepEqual(result.seats.map(seat => [seat.seat, seat.lens, seat.status]), [[1, 'correctness', 'completed']])
})
