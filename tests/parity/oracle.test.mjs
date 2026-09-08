import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { compareObservations as compareRecords } from './oracle.mjs'
import { scenarios } from './catalog.mjs'
import { observation, fixtureContext } from './fixtures.mjs'

const compareObservations = (left, right, fixtures = { left: fixtureContext(left.caseId), right: fixtureContext(right.caseId) }) => compareRecords(left, right, fixtures)

// Independently authored fixture: no values are read from the oracle/catalog.
function staleApproval(runtime) {
  return {
    caseId: 'P03', runtime, sourceSha: 'a'.repeat(40), contractVersion: 1, fixtureVersion: 1,
    evidenceLevel: 'contract-simulation',
    facts: { expectedRevision: 'b'.repeat(40), observedRevision: 'c'.repeat(40), approvalAccepted: false, integrationCount: 0 },
    artifacts: [{ kind: 'audit-result', digest: 'd'.repeat(64) }],
  }
}

test('both runtimes must satisfy the independent stale-approval rule before comparison', () => {
  const left = staleApproval('claude'), right = staleApproval('codex')
  assert.equal(compareObservations(left, right).equivalent, true)
  left.facts.approvalAccepted = right.facts.approvalAccepted = true
  assert.throws(() => compareObservations(left, right), /P03.*approvalAccepted/)
})

test('every catalog fixture passes separately authored observations and rejects corrupted facts and missing evidence', () => {
  assert.deepEqual(scenarios.map(s => s.id), Array.from({length:26}, (_, i) => `P${String(i + 1).padStart(2, '0')}`))
  for (const scenario of scenarios) {
    const left = observation(scenario.id, 'claude'), right = observation(scenario.id, 'codex')
    assert.equal(compareObservations(left, right).equivalent, true, scenario.id)
    for (const key of Object.keys(scenario.expected)) {
      const a = structuredClone(left), b = structuredClone(right)
      a.facts[key] = b.facts[key] = 'corrupted-shared-decision'
      assert.throws(() => compareObservations(a, b), undefined, `${scenario.id}/${key}`)
    }
    for (const artifact of scenario.evidence) {
      const incomplete = structuredClone(right)
      incomplete.artifacts = incomplete.artifacts.filter(a => a.kind !== artifact)
      assert.throws(() => compareObservations(left, incomplete), undefined, `${scenario.id}/${artifact}`)
    }
  }
})

test('parallel completion order is incidental but duplicate/missing task identity is not', () => {
  const left = observation('P05', 'claude'), right = observation('P05', 'codex')
  right.facts.tasksCompleted = ['b', 'c', 'a']
  assert.equal(compareObservations(left, right).equivalent, true)
  right.facts.tasksCompleted = ['a', 'a', 'c']
  assert.throws(() => compareObservations(left, right))
})

test('unknown decisions and unsupported record versions fail instead of vanishing', () => {
  for (const change of [r => { r.facts.routing = 'silently-approved' }, r => { r.fixtureVersion = 99 }, r => { r.caseId = 'P99' }, r => { r.evidenceLevel = 'actual-runtime' }]) {
    const left = observation('P03', 'claude'), right = observation('P03', 'codex')
    change(left); change(right)
    assert.throws(() => compareObservations(left, right))
  }
})

test('approval and gate evidence must bind the candidate, not just have the right count', () => {
  for (const id of ['P01', 'P02', 'P07', 'P10']) {
    const left = observation(id, 'claude'), right = observation(id, 'codex')
    assert.equal(compareObservations(left, right).equivalent, true)
    if (right.facts.audits) right.facts.audits[1].revision = 'c'.repeat(40)
    else if (id === 'P07') right.facts.gateRevision = 'c'.repeat(40)
    else right.facts.approvedRevision = right.facts.expectedRevision
    left.facts = structuredClone(right.facts)
    assert.throws(() => compareObservations(left, right))
  }
  const left = observation('P01', 'claude'), right = observation('P01', 'codex')
  right.facts.audits[1] = {...right.facts.audits[0]}
  left.facts = structuredClone(right.facts)
  assert.throws(() => compareObservations(left, right))
})

test('causal dependency and capacity must follow the trace, not claimed boolean summaries', () => {
  for (const id of ['P05', 'P06']) {
    const left = observation(id, 'claude'), right = observation(id, 'codex')
    assert.equal(compareObservations(left, right).equivalent, true)
    if (id === 'P05') right.events.find(e => e.id === 'c-start').after = []
    else {
      right.events[3].after = [];
      [right.events[2], right.events[3]] = [right.events[3], right.events[2]]
    }
    left.events = structuredClone(right.events)
    assert.throws(() => compareObservations(left, right))
  }
})

test('runtime cannot redefine the intended candidate even when both sides agree', () => {
  const left = observation('P01', 'claude'), right = observation('P01', 'codex')
  for (const record of [left, right]) {
    record.facts.expectedRevision = record.facts.gateRevision = 'c'.repeat(40)
    for (const audit of record.facts.audits) audit.revision = 'c'.repeat(40)
  }
  assert.throws(() => compareObservations(left, right), /fixture.*candidate/)
})

test('independent Git identities and parallel event order normalize without losing trees or ancestry', () => {
  const left = observation('P05', 'claude'), right = observation('P05', 'codex')
  const fixtures = { left: fixtureContext('P05'), right: fixtureContext('P05') }
  for (const [role, hex] of [['base', '3'], ['candidate', '4'], ['old', '5']]) {
    const old = fixtures.right.commits[role].sha, replacement = hex.repeat(40)
    fixtures.right.commits[role].sha = replacement
    for (const key of ['baseRevision', 'dependencyRevision']) if (right.facts[key] === old) right.facts[key] = replacement
    for (const event of right.events) if (event.revision === old) event.revision = replacement
  }
  const completed = right.events.splice(4, 1)[0]
  right.events.push(completed)
  assert.equal(compareObservations(left, right, fixtures).equivalent, true)
  fixtures.right.commits.candidate.tree = '9'.repeat(40)
  assert.throws(() => compareObservations(left, right, fixtures), /trees or ancestry/)
  fixtures.right.commits.candidate.tree = fixtures.left.commits.candidate.tree
  fixtures.right.commits.candidate.parents = ['old']
  assert.throws(() => compareObservations(left, right, fixtures), /trees or ancestry/)
})

test('missing evidence, unknown versions and identical runtime labels cannot claim parity', () => {
  for (const change of [r => { r.artifacts = [] }, r => { r.contractVersion = 2 }, r => { r.runtime = 'claude' }, r => { delete r.facts.expectedRevision }]) {
    const right = staleApproval('codex')
    change(right)
    assert.throws(() => compareObservations(staleApproval('claude'), right))
  }
})

test('unknown top-level decisions and extra or cyclic events cannot pass on both sides', () => {
  for (const change of [
    r => { r.permissionDecision = 'allow' },
    r => { r.events.push({id:'extra', task:'foreign', kind:'dispatch', after:[]}) },
    r => { r.events[0].after = ['c-done'] },
  ]) {
    const left = observation('P05', 'claude'), right = observation('P05', 'codex')
    change(left); change(right)
    assert.throws(() => compareObservations(left, right))
  }
})

test('shared rejecting audits or early integration cannot hide behind correct outcome summaries', () => {
  for (const id of ['P01', 'P02']) {
    for (const change of [
      r => { r.facts.audits[0].verdict = 'request_changes' },
      r => { r.facts.audits[0].findings = [{id:'unfixed', severity:'Major', disposition:'absorb'}] },
      r => { r.events = [{id:'early', task:'a', kind:'integrate', after:[], revision:r.facts.expectedRevision}] },
    ]) {
      const left=observation(id,'claude'), right=observation(id,'codex')
      change(left); change(right)
      assert.throws(() => compareObservations(left,right))
    }
  }
})

test('artifact evidence participates in comparison and binds gate command, revision and exit', () => {
  const left=observation('P07','claude'), right=observation('P07','codex')
  right.artifacts[0].digest='f'.repeat(64)
  assert.throws(() => compareObservations(left,right), /artifact/)
  for (const digest of ['', 'bad', 'f'.repeat(63)]) {
    const a=observation('P07','claude'), b=observation('P07','codex')
    a.artifacts[0].digest=b.artifacts[0].digest=digest
    assert.throws(() => compareObservations(a,b), /digest/)
  }
  for (const [key,value] of [['command',['false']], ['revision','c'.repeat(40)], ['exit',0]]) {
    const a=observation('P07','claude'), b=observation('P07','codex')
    a.artifacts[0][key]=b.artifacts[0][key]=value
    assert.throws(() => compareObservations(a,b), /gate/)
  }
})

test('approval causal edge mirrors reject shared defects with unchanged event counts and facts', () => {
  for (const id of ['P01','P02']) {
    const edges=[['audit-1','candidate'],['audit-2','candidate'],['gate','candidate'],['land','audit-1'],['land','audit-2'],['land','gate']]
    if (id==='P02') edges.push(['candidate','blocked'])
    for (const [eventId, predecessor] of edges) {
      const a=observation(id,'claude'), b=observation(id,'codex')
      for (const record of [a,b]) {
        const event=record.events.find(e=>e.id===eventId)
        event.after=event.after.filter(p=>p!==predecessor)
      }
      assert.throws(()=>compareObservations(a,b),undefined,`${id}/${eventId}/${predecessor}`)
    }
  }
  const a=observation('P02','claude'), b=observation('P02','codex')
  a.facts.blockedAudit.findings=b.facts.blockedAudit.findings=[]
  assert.throws(()=>compareObservations(a,b),/initial Major/)
})

test('causal event pin and identity mirrors preserve all summary and artifact evidence', () => {
  for (const id of ['P01','P02']) {
    for (const kind of ['commit','gate','integrate']) {
      const a=observation(id,'claude'), b=observation(id,'codex')
      for (const record of [a,b]) record.events.find(e=>e.kind===kind).revision='c'.repeat(40)
      assert.throws(()=>compareObservations(a,b),/event candidate pin/,`${id}/${kind}`)
    }
    for (const change of [
      r=>{r.events.find(e=>e.id==='audit-1').revision='c'.repeat(40)},
      r=>{r.events.find(e=>e.id==='audit-2').seat=1},
      r=>{r.events.find(e=>e.id==='land').task='foreign'},
      r=>{r.events.find(e=>e.id==='land').id='audit-1'},
      r=>{r.events.find(e=>e.id==='land').after.push('audit-1')},
      r=>{r.events.push({id:'extra',task:'a',kind:'error',after:[]})},
    ]) {
      const a=observation(id,'claude'), b=observation(id,'codex')
      change(a); change(b)
      assert.throws(()=>compareObservations(a,b))
    }
  }
  const a=observation('P02','claude'), b=observation('P02','codex')
  a.events[0].seat=b.events[0].seat=2
  assert.throws(()=>compareObservations(a,b),/blocking seat/)
})

test('oracle guard mutations fail assertions rather than merely failing to initialize', () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-oracle-mutations-'))
  try {
    for (const file of ['catalog.mjs', 'fixtures.mjs', 'oracle.test.mjs']) copyFileSync(new URL(file, import.meta.url), join(dir, file))
    const source = readFileSync(new URL('oracle.mjs', import.meta.url), 'utf8')
    const mutations = [
      ['expected rule', '    assert.deepEqual(normalizedFacts(record)[key], expected,', 'both runtimes must'],
      ['candidate binding', '      assert.equal(record.facts[key], fixture.commits[role].sha,', 'runtime cannot'],
      ['artifact digest', '  for (const artifact of record.artifacts) assert.match(', 'artifact evidence participates'],
      ['graph equivalence', '  assert.deepEqual(commitGraph(fixtures.left),', 'independent Git'],
      ['unknown fields', '  assert.ok(Object.keys(record).every(', 'unknown top-level'],
      ['trace dependency', '    assert.ok(seen.get(dependent.id).has(merge.id),', 'causal dependency'],
      ['audit verdict','      assert.equal(audit.verdict,','shared rejecting'],
      ['blocking findings','      assert.deepEqual(audit.findings,','shared rejecting'],
      ['approval before integration','      assert.ok(seen.get(land.id).has(event.id),','approval causal edge'],
      ['gate before integration','    assert.ok(seen.get(land.id).has(gate.id),','approval causal edge'],
      ['repair after blocking','      assert.ok(seen.get(candidate.id).has(blocked.id),','approval causal edge'],
      ['initial finding','    assert.deepEqual(record.facts.blockedAudit,','approval causal edge'],
      ['gate command','    assert.deepEqual(gate.command,','artifact evidence participates'],
      ['gate artifact revision','    assert.equal(gate.revision,','artifact evidence participates'],
      ['gate artifact exit','    assert.equal(gate.exit,','artifact evidence participates'],
      ['artifact comparison','  assert.deepEqual(artifacts(left,','artifact evidence participates'],
      ['event candidate pin',"    for (const event of [candidate,gate,land]) assert.equal(",'causal event pin'],
      ['audit after candidate','      assert.ok(seen.get(event.id).has(candidate.id),','approval causal edge'],
      ['gate after candidate','    assert.ok(seen.get(gate.id).has(candidate.id),','approval causal edge'],
      ['event task identity',"      assert.equal(matches[0].task,",'causal event pin'],
      ['blocking seat',"      assert.equal(blocked.seat,",'causal event pin'],
      ['unique event ID',"    assert.ok(typeof event.id ===",'causal event pin'],
      ['unique predecessors',"    assert.ok(Array.isArray(event.after)",'causal event pin'],
      ['extra approval events',"    assert.equal(record.events.length, record.caseId===",'causal event pin'],
    ]
    for (const [name, prefix, pattern] of mutations) {
      const lines = source.split('\n'), found = lines.filter(line => line.startsWith(prefix))
      assert.equal(found.length, 1, name)
      writeFileSync(join(dir, 'oracle.mjs'), lines.filter(line => !line.startsWith(prefix)).join('\n'))
      const env = {...process.env}
      delete env.NODE_TEST_CONTEXT
      const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, join(dir, 'oracle.test.mjs')], {env, encoding:'utf8', timeout:10000})
      assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stdout, /not ok/, name)
      assert.match(result.stdout, /AssertionError/, name)
    }
  } finally { rmSync(dir, {recursive:true, force:true}) }
})
