// evidence-presence.test.mjs — the ADR 0025 extraction-plus-equality guard for the two
// operative docs of the REA evidence gate (plan 2026-10-20-rea-artifact-evidence Task 2.4;
// D4, D8, D20; PIN-1, PIN-6, PIN-17).
//
// Three restated facts, three machine sources:
//   1. The presence tool. skills/war-room/SKILL.md, skills/war/references/artifact-evidence-lead.md
//      and skills/war-room/references/rea-setup.md name it behind the fixed lead-in
//      `presence tool \`mcp__…\``. Each literal must be a member of the allowlist that
//      hooks/validate-evidence-auditor-mcp.sh OWNS (G4), and the docs must name the same tool.
//   2. The offered lens. war-room SKILL.md names it behind the lead-in `evidence lens \`…\``;
//      it must deepEqual EVIDENCE_LENS from war-config.mjs.
//   3. The threaded args. Every `args.<key>` token the lead file names must have an
//      `Optional \`<key>\`` row in schemas.md's args contract.
// Every extractor fails closed: a doc that drops its lead-in is a red test, never a vacuous pass.
//
// Repo root resolves from import.meta.url, never process.cwd() (a WAR subagent's cwd is the
// main checkout and resets between bash calls).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { EVIDENCE_LENS } from '../../war/assets/war-config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url)) // skills/war-room/assets
const REPO = resolve(HERE, '..', '..', '..')
const src = rel => readFileSync(join(REPO, rel), 'utf8')

const HOOK = 'hooks/validate-evidence-auditor-mcp.sh'
const WAR_ROOM = 'skills/war-room/SKILL.md'
const LEAD = 'skills/war/references/artifact-evidence-lead.md'
const SCHEMAS = 'skills/war/references/schemas.md'
const SETUP = 'skills/war-room/references/rea-setup.md'

// The hook's extraction contract: one full `mcp__rea__<tool>` name per line between the
// REA_ALLOWLIST quotes, nothing else on the line (the same read the shell test makes).
function hookAllowlist(text) {
  const m = /REA_ALLOWLIST='\n([\s\S]*?)\n'/.exec(text)
  assert.ok(m, `${HOOK}: REA_ALLOWLIST='…' block not found — the extractor fails closed`)
  const names = m[1].split('\n').filter(l => l.length > 0)
  assert.ok(names.length > 0, `${HOOK}: REA_ALLOWLIST is empty`)
  for (const n of names) assert.match(n, /^mcp__rea__[a-z0-9_]+$/, `${HOOK}: allowlist line is not a bare mcp__rea__<tool> name: ${JSON.stringify(n)}`)
  return new Set(names)
}

// `presence tool \`mcp__…\`` — every occurrence on the surface; at least one, or the doc
// has dropped the lead-in and the guard cannot see its literal.
function presenceTools(rel, text) {
  const hits = [...text.matchAll(/presence tool `(mcp__[A-Za-z0-9_-]+)`/g)].map(m => m[1])
  assert.ok(hits.length > 0, `${rel}: no \`presence tool \\\`mcp__…\\\`\` lead-in found — the extractor fails closed`)
  return hits
}

// `evidence lens \`…\`` on the war-room surface: exactly one distinct literal.
function offeredLens(rel, text) {
  const hits = [...new Set([...text.matchAll(/evidence lens `([^`]+)`/g)].map(m => m[1]))]
  assert.equal(hits.length, 1, `${rel}: expected exactly one distinct \`evidence lens \\\`…\\\`\` literal, found ${JSON.stringify(hits)}`)
  return hits[0]
}

// Every `args.<key>` token on the lead surface, backticked or bare, first segment only.
function argsKeys(rel, text) {
  const keys = [...new Set([...text.matchAll(/\bargs\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(m => m[1]))]
  assert.ok(keys.length > 0, `${rel}: no args.<key> token found — the Lead procedure must name the args it threads`)
  return keys
}

test('evidence presence: the doc-stated presence tool is a hook allowlist member, the offered lens equals EVIDENCE_LENS, and every args key the lead file names has an Optional row in schemas.md', () => {
  const allow = hookAllowlist(src(HOOK))
  const warRoom = src(WAR_ROOM)
  const lead = src(LEAD)
  const schemas = src(SCHEMAS)

  // 1. presence tool — a member on every doc, and the same tool on every doc.
  const fromWarRoom = presenceTools(WAR_ROOM, warRoom)
  const fromLead = presenceTools(LEAD, lead)
  const fromSetup = presenceTools(SETUP, src(SETUP))
  for (const [rel, tools] of [[WAR_ROOM, fromWarRoom], [LEAD, fromLead], [SETUP, fromSetup]])
    for (const t of tools) assert.ok(allow.has(t), `${rel}: presence tool ${t} is not on the ${HOOK} allowlist`)
  assert.deepEqual([...new Set(fromWarRoom)], [...new Set(fromLead)], 'war-room SKILL.md and the lead file name different presence tools')
  assert.deepEqual([...new Set(fromWarRoom)], [...new Set(fromSetup)], 'war-room SKILL.md and rea-setup.md name different presence tools')
  // Discrimination control: a non-member literal is refused by the same membership read.
  assert.ok(!allow.has('mcp__rea__not_a_real_tool'), 'control: the allowlist read does not vacuously accept a non-member')

  // 2. offered lens — equality with the export.
  assert.deepEqual(offeredLens(WAR_ROOM, warRoom), EVIDENCE_LENS, `${WAR_ROOM}: the offered lens literal differs from EVIDENCE_LENS`)

  // 3. args keys — each has an Optional row in the args contract.
  const keys = argsKeys(LEAD, lead)
  for (const k of keys) assert.ok(schemas.includes('Optional `' + k + '`'), `${LEAD} names args.${k} but ${SCHEMAS} carries no \`Optional \\\`${k}\\\`\` row`)
  for (const must of ['evidence', 'targetArtifacts'])
    assert.ok(keys.includes(must), `${LEAD}: the Lead procedure must thread args.${must} (D8/PIN-1)`)
  // Discrimination control: an unknown key is refused by the same row read.
  assert.ok(!schemas.includes('Optional `noSuchArgKey`'), 'control: the Optional-row read does not vacuously accept an unknown key')

  // Fail-closed controls on the extractors themselves (delete-the-feature: a surface that
  // drops its lead-in throws instead of returning an empty, vacuously-passing set).
  assert.throws(() => presenceTools('fixture', 'no lead-in here'), /fails closed/)
  assert.throws(() => offeredLens('fixture', 'evidence lens `a` and evidence lens `b`'), /exactly one distinct/)
  assert.throws(() => argsKeys('fixture', 'no args here'), /no args/)
  assert.throws(() => hookAllowlist('no block'), /not found/)
})
