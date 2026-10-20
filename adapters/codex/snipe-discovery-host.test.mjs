import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSnipePlugin } from './package-snipe.mjs'

const exec = promisify(execFile)
const codexPath = process.env.SNIPE_CODEX_BIN
const model = process.env.SNIPE_CODEX_MODEL
const effort = process.env.SNIPE_CODEX_EFFORT
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

// Opt-in: uses the installed Snipe plugin, real host discovery and inference.
// Never supplies a skill path or attaches instructions, and never launches auditors.
test('installed plugin resolves packaged default prompts in fresh host sessions without implicit audits', {
  skip: !codexPath || !model || !effort,
  timeout: 180000,
}, async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'snipe-discovery-host-'))
  const output = join(mkdtempSync(join(tmpdir(), 'snipe-discovery-package-')), 'plugin')
  buildSnipePlugin({ repoRoot, output })
  const manifest = JSON.parse(readFileSync(join(output, '.codex-plugin/plugin.json'), 'utf8'))
  const metadata = readFileSync(join(output, 'skills/snipe/agents/openai.yaml'), 'utf8')
  const skillPrompt = JSON.parse(metadata.split('\n').find(line => line.trimStart().startsWith('default_prompt:')).split('default_prompt:')[1].trim())

  async function invoke(prompt) {
    const pending = exec(codexPath, [
      'exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check',
      '-c', 'approval_policy="never"', '-c', 'mcp_servers={}',
      '--disable', 'hooks', '--disable', 'apps', '--disable', 'multi_agent',
      '--json', '-C', cwd, '-m', model, '-c', `model_reasoning_effort=${JSON.stringify(effort)}`,
      prompt,
    ], { timeout: 55000, maxBuffer: 1024 * 1024 })
    pending.child.stdin.end()
    const { stdout } = await pending
    const events = stdout.split('\n').filter(Boolean).map(line => JSON.parse(line))
    const messages = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message')
    assert.ok(messages.length, 'host must return a final response')
    assert.equal(events.some(event => event.type === 'error' || event.type === 'turn.failed'), false)
    const commands = events.filter(event => event.item?.type === 'command_execution').map(event => event.item.command)
    assert.equal(commands.some(command => /snipe-runner|codex exec/.test(command)), false, 'discovery must not launch auditors')
    return { answer: messages.at(-1).item.text, commands }
  }

  for (const prompt of [manifest.interface.defaultPrompt, skillPrompt]) {
    const { answer } = await invoke(`${prompt}\nFor this invocation only, stop after skill discovery. Do not run an audit, inspect the repository, launch seats, or change files. Use normal host skill resolution; no broad filesystem search or substitute review. Return only JSON: {"available":boolean,"runner":string|null,"auditorSandbox":string|null,"auditorApprovals":string|null}. Use the runner basename and Codex CLI sandbox/approval enum values. Derive values from the loaded skill; if unavailable return false and null fields.`)
    assert.deepEqual(JSON.parse(answer), {
      available: true, runner: 'snipe-runner.mjs', auditorSandbox: 'read-only', auditorApprovals: 'never',
    }, `packaged prompt did not load Snipe: ${prompt}`)
  }

  const negative = await invoke('Explain in one sentence what a read-only code review means. This is a conceptual question: do not inspect files, invoke a skill, or run a review.')
  assert.deepEqual(negative.commands, [], 'conceptual request must not inspect or audit files')
  assert.doesNotMatch(negative.answer, /Snipe report|Seat outcomes/)
})
