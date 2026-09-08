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
      /Use the installed plugin's shared CLI when the target is not the WAR checkout/,
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
    ["Use the installed plugin's shared CLI when the target is not the WAR checkout.",''],
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
  const interview=readFileSync(new URL('../../skills/war-strategy/references/plan-interview.md',import.meta.url),'utf8')
  const noCheckoutLocator=text=>assert.doesNotMatch(text,/(?:\.\/)?skills\/war-strategy\/assets(?:\/|\b)/)
  for(const text of [doctrine,interview]) {
    noCheckoutLocator(text)
    for(const locator of ['`skills/war-strategy/assets/`','node skills/war-strategy/assets/plan-literal-lint.mjs','./skills/war-strategy/assets/','skills/war-strategy/assets']) {
      assert.throws(()=>noCheckoutLocator(`${text}\n${locator}`))
    }
  }
})

test('question budget preserves stop and consent duties without reviving a slash total',()=>{
  const interview=readFileSync(new URL('../../skills/war-strategy/references/plan-interview.md',import.meta.url),'utf8').replace(/\s+/g,' ')
  const review=readFileSync(new URL('../../skills/war-review/SKILL.md',import.meta.url),'utf8')
  const noRetiredNotation=text=>assert.doesNotMatch(text,/Q(?:k|X|\d+)\s*\/\s*(?:14|<budget>)/)
  for(const text of [interview,review]) {
    noRetiredNotation(text)
    for(const old of ['Qk/14','Qk/<budget>','Q3/14'])assert.throws(()=>noRetiredNotation(`${text} ${old}`))
  }
  const obligations=[
    'Stop asking when the completion bar is met, even far below the cap',
    "Research cannot answer for the operator's intent or silently ratify a choice",
    'disclose them and ask whether to raise the budget or stop',
    'do not manufacture questions merely to reach the nominal midpoint',
    'Echo-backs and their confirmations do not consume question slots',
    'Other non-question turns do not advance Q either',
    'including falsifier and checkpoint questions',
    'use host temporary storage outside the target working tree',
    'Do not leave an extra draft beside the operator\'s source or publish the final plan before the closing gates are satisfied',
  ]
  const complete=text=>{for(const clause of obligations)assert.ok(text.includes(clause),clause)}
  complete(interview)
  for(const clause of obligations)assert.throws(()=>complete(interview.replace(clause,'')),{name:'AssertionError'},clause)
  assert.match(review,/actual interview questions only, excluding echo-backs and other non-question turns/)
})
