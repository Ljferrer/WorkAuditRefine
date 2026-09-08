import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const host=readFileSync(new URL('../../skills/war-strategy/references/host.md',import.meta.url),'utf8')
const doctrine=readFileSync(new URL('../../skills/war-strategy/SKILL.md',import.meta.url),'utf8')
// Snapshot of the pre-extraction source, not generated from today's host reference.
const original=JSON.parse(readFileSync(new URL('./fixtures/claude-planning-extraction.json',import.meta.url),'utf8'))
const section=(text,title)=>{
  const start=text.indexOf(`## ${title}\n`);assert.ok(start>=0,title)
  const body=text.slice(start+title.length+4)
  return body.split(/\n## /)[0].trim()
}
function preservesExtractedBehavior(text) {
  assert.equal(section(text,'Optional skill discovery'),original.discovery,'complete discovery behavior changed')
  assert.equal(section(text,'Closing offer'),original.closing,'complete closing offer changed')
  for(const [title,clauses]of [
    ['Recon and memory',[
      /`\.claude\/war\/runs\/` in the target repository/,
      /`--local` always,\s*`--repo` when a repo root resolved, fail-open/,
      /node skills\/_shared\/war-memory\.mjs query --queries <file> --local <local root> --repo docs\/learnings/,
      /queries file is JSONL: one `\{"label":…, "text":…\}` object per interview area/,
      /missing CLI, Node < 24 or missing corpus does not block the interview/,
      /No local\s*root means no query-log write; never guess a root/,
    ]],
    ['Advisory lint',[/equivalent installed plugin asset/,/Preserve report-only\s*exit zero by default and enumerate findings at confirmation/]],
    ['Verifier',[/Dispatch one read-only verifier agent for an armed beat/,/complete shared strategy-verifier charter/,/bounded re-arm and degraded stamps when the facility is unavailable/]],
  ])for(const pattern of clauses)assert.match(section(text,title),pattern,`${title}: ${pattern}`)
}

test('Claude extraction preserves complete old blocks and every host-specific duty',()=>{
  preservesExtractedBehavior(host)
  for(const [from,to]of [
    ['stdout only — never the exit code','exit code only'],
    ['No local\nroot means no query-log write; never guess a root','Guess a local root'],
    ['queries file is JSONL','queries file is plain text'],
    ['Preserve report-only\nexit zero by default','Use strict exit by default'],
    ['bounded re-arm and degraded stamps','unlimited silent retries'],
    ['Optionally point at','Automatically invoke'],
    ['read-only verifier','writable verifier'],
  ]) {
    assert.ok(host.includes(from),from)
    assert.throws(()=>preservesExtractedBehavior(host.replace(from,to)),from)
  }
})

test('shared doctrine routes mechanics to its host and forbids automatic closing actions',()=>{
  assert.match(doctrine,/read \[references\/host.md\]\(references\/host.md\)/)
  assert.match(doctrine,/never automatic invocation or authority to execute, install or publish/)
  assert.equal(doctrine.includes('`skills/war-strategy/assets/`'),false)
})
