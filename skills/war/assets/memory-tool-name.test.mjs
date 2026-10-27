// memory-tool-name.test.mjs — End state 6 of plan 2026-10-27-memory-query-mcp-tool (PIN-8).
//
// The hook (hooks/validate-evidence-auditor-mcp.sh) owns the full memory-query tool-name literal on
// its one `MEMORY_TOOL='…'` line. Every other surface is a COPY guarded against that literal, never a
// second home: the `tools:` line of the auditor, evidence auditor and servitor cards, the worker
// card's Prior-lessons sentence (the worker card carries no `tools:` line — it inherits plugin MCP
// tools, assumption A4), and the workflow-template.js dispatched-prompt const. The retired Bash
// self-query sentence (`war-memory.mjs query`) must be gone from the worker card and the template.
//
// Proven red at authoring by mutating one card's `tools:` entry (see the task notes).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, '../../..')
const read = (rel) => readFileSync(join(REPO, rel), 'utf8')

const HOOK = 'hooks/validate-evidence-auditor-mcp.sh'
const TOOLS_LINE_CARDS = ['agents/war-auditor.md', 'agents/war-evidence-auditor.md', 'agents/war-servitor.md']
const WORKER_CARD = 'agents/war-worker.md'
const TEMPLATE = 'skills/war/assets/workflow-template.js'
const RETIRED_SELF_QUERY = 'war-memory.mjs query'

// Extract the literal from the hook: exactly one `MEMORY_TOOL='<name>'` line, single-quoted, no
// interpolation. Fail-closed — zero or two lines red here, never a silent fallback name.
const memoryToolLiteral = () => {
  const rows = read(HOOK).split('\n').map(l => /^MEMORY_TOOL='([^'$]+)'$/.exec(l)).filter(Boolean)
  assert.equal(rows.length, 1, `${HOOK} must carry exactly one MEMORY_TOOL='…' line (got ${rows.length})`)
  return rows[0][1]
}

// The frontmatter `tools:` line of a card, split on the comma separator into exact entries.
const toolsEntries = (cardText) => {
  const fm = cardText.split('\n---\n')[0]
  const line = fm.split('\n').find(l => l.startsWith('tools:'))
  assert.ok(line, 'the card frontmatter carries a tools: line')
  return line.slice('tools:'.length).split(',').map(s => s.trim()).filter(Boolean)
}

// Region of a card from `## <heading>` through the next `## ` heading (or EOF).
const sectionOf = (text, heading) => {
  const start = text.indexOf(`\n${heading}`)
  assert.ok(start >= 0, `card carries the "${heading}" heading`)
  return text.slice(start + 1).split('\n## ')[0]
}

test('ES6: the hook carries exactly one MEMORY_TOOL literal and it names memory_query', () => {
  const name = memoryToolLiteral()
  assert.match(name, /^mcp__[A-Za-z0-9_-]+__memory_query$/, 'the literal is a full MCP tool name ending in __memory_query')
})

test('ES6: the auditor, evidence auditor and servitor cards carry the hook MEMORY_TOOL literal as an exact tools: entry', () => {
  const name = memoryToolLiteral()
  for (const card of TOOLS_LINE_CARDS) {
    const entries = toolsEntries(read(card))
    assert.ok(entries.includes(name), `${card}: tools: line carries the exact entry ${name} (entries: ${entries.length})`)
    assert.equal(entries.filter(e => e === name).length, 1, `${card}: the entry appears exactly once`)
  }
})

test('ES6: the worker card Prior-lessons sentence names the hook MEMORY_TOOL literal and the Bash self-query sentence is gone', () => {
  const name = memoryToolLiteral()
  const card = read(WORKER_CARD)
  assert.ok(sectionOf(card, '## Prior lessons').includes(name), `${WORKER_CARD}: the Prior-lessons section names ${name}`)
  assert.ok(!card.includes(RETIRED_SELF_QUERY), `${WORKER_CARD}: the retired "${RETIRED_SELF_QUERY}" self-query sentence is absent`)
})

test('ES6: workflow-template.js carries the hook MEMORY_TOOL literal as its const and the Bash self-query sentence is gone', () => {
  const name = memoryToolLiteral()
  const src = read(TEMPLATE)
  assert.ok(src.includes(`const MEMORY_TOOL = '${name}'`), `${TEMPLATE}: const MEMORY_TOOL carries the hook literal exactly`)
  assert.ok(!src.includes(RETIRED_SELF_QUERY), `${TEMPLATE}: the retired "${RETIRED_SELF_QUERY}" self-query sentence is absent`)
})

test('ES6 negative control: the retired-sentence check matches the old worker-card sentence', () => {
  const old = "You MAY run `node <plugin>/skills/_shared/war-memory.mjs query '<terms>' --repo <repo root>` mid-task"
  assert.ok(old.includes(RETIRED_SELF_QUERY), 'the retired token still matches the pre-change sentence (the absence checks above are not vacuous)')
})
