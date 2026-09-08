import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const skill = readFileSync(new URL('./SKILL.md', import.meta.url), 'utf8')
const policy = readFileSync(new URL('./agents/openai.yaml', import.meta.url), 'utf8')
const auditor = readFileSync(new URL('./references/codex-auditor.md', import.meta.url), 'utf8')
const context = readFileSync(new URL('../../../../CONTEXT.md', import.meta.url), 'utf8')
const resultModule = readFileSync(new URL('./assets/snipe-result.mjs', import.meta.url), 'utf8')

test('Snipe is explicit-only and routes execution through the owned coordinator', () => {
  assert.match(skill, /^---\nname: snipe\n/)
  assert.match(skill, /Run only when the user explicitly invokes `\$snipe`/)
  assert.match(skill, /assets\/snipe-runner\.mjs --request/)
  assert.match(skill, /Present the runner's `report` field as the Snipe result/)
  assert.match(skill, /single schema-only repair attempt/)
  assert.match(policy, /allow_implicit_invocation:\s*false/)
})

test('Codex auditor role carries review doctrine but excludes phase authority and side effects', () => {
  assert.match(auditor, /shared WAR auditor's lens vocabulary, evidence precedence/)
  assert.match(auditor, /There is no task issue, phase plan, merge gate/)
  assert.match(auditor, /Do not apply the phase-only hard refusal for an unclassified gitlink/)
  assert.match(auditor, /Do not run tests, formatters, installers, hooks/)
  assert.match(auditor, /Do not launch seats, make changes, file issues, post comments/)
  assert.match(auditor, /versioned Snipe result JSON object/)
  for (const disposition of ['absorb', 'follow-up', 'note', 'ask']) {
    assert.match(auditor, new RegExp('- `' + disposition + '`:'))
  }
})

test('canonical Snipe vocabulary distinguishes Claude and Codex profile resolution', () => {
  assert.match(context, /Claude seats spawn at the\nconfig tier ladder/)
  assert.match(context, /Codex seats instead\ninherit the invoking session's exact model\/effort/)
})

test('result validation and reporting have no action-capable dependencies', () => {
  assert.doesNotMatch(resultModule, /node:(?:child_process|fs|net|http)/)
  assert.doesNotMatch(resultModule, /\b(?:spawn|exec|writeFile|gh)\s*\(/)
  assert.match(resultModule, /No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed/)
})
