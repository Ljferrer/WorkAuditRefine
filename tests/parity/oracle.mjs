import assert from 'node:assert/strict'
import { scenarios } from './catalog.mjs'

function commitGraph(fixture) {
  assert.ok(fixture?.commits && Object.keys(fixture.commits).length, 'fixture commit graph required')
  const seen = new Set(), visiting = new Set(), shas = new Set()
  const visit = role => {
    assert.ok(!visiting.has(role), 'fixture ancestry cycle')
    if (seen.has(role)) return
    const commit = fixture.commits[role]
    assert.ok(commit, `fixture unknown ancestor ${role}`)
    assert.match(commit.sha, /^[a-f0-9]{40}$/, 'fixture commit SHA required')
    assert.match(commit.tree, /^[a-f0-9]{40}$/, 'fixture tree required')
    assert.ok(!shas.has(commit.sha), 'fixture commit identities must be distinct')
    shas.add(commit.sha)
    assert.ok(Array.isArray(commit.parents) && new Set(commit.parents).size === commit.parents.length, 'fixture parents required')
    visiting.add(role)
    for (const parent of commit.parents) visit(parent)
    visiting.delete(role)
    seen.add(role)
  }
  for (const role of Object.keys(fixture.commits)) visit(role)
  return Object.fromEntries(Object.entries(fixture.commits).map(([role, commit]) => [role, {tree:commit.tree, parents:commit.parents}]))
}

function revisionRole(revision, fixture) {
  const entry = Object.entries(fixture.commits).find(([, commit]) => commit.sha === revision)
  assert.ok(entry, 'revision absent from independent fixture graph')
  return entry[0]
}

function normalizedFacts(record, fixture) {
  const facts = structuredClone(record.facts)
  if (record.caseId === 'P05' && Array.isArray(facts.tasksCompleted)) facts.tasksCompleted.sort()
  if (fixture) {
    for (const key of Object.keys(facts).filter(key => key.endsWith('Revision'))) facts[key] = revisionRole(facts[key], fixture)
    if (facts.audits) facts.audits = facts.audits.map(a => ({...a, revision:revisionRole(a.revision, fixture)})).sort((a,b) => a.seat - b.seat)
    if (facts.blockedAudit) facts.blockedAudit.revision = revisionRole(facts.blockedAudit.revision, fixture)
  }
  return facts
}

function assertTrace(record, label) {
  if (!['P01', 'P02', 'P05', 'P06'].includes(record.caseId) && record.events === undefined) return
  assert.ok(Array.isArray(record.events) && record.events.length, `${label}: event trace required`)
  const seen = new Map()
  for (const event of record.events) {
    assert.ok(typeof event.id === 'string' && event.id && !seen.has(event.id), `${label}: unique event identity required`)
    assert.ok(typeof event.task === 'string' && event.task, `${label}: task identity required`)
    assert.ok(['dispatch', 'integrate', 'complete', 'error', 'commit', 'audit', 'gate'].includes(event.kind), `${label}: unknown event decision ${event.kind}`)
    assert.ok(Array.isArray(event.after) && new Set(event.after).size === event.after.length, `${label}: causal predecessors required`)
    const ancestors = new Set()
    for (const predecessor of event.after) {
      assert.ok(seen.has(predecessor), `${label}: missing, cyclic or out-of-order predecessor ${predecessor}`)
      ancestors.add(predecessor)
      for (const ancestor of seen.get(predecessor)) ancestors.add(ancestor)
    }
    if (event.revision !== undefined) assert.match(event.revision, /^[a-f0-9]{40}$/, `${label}: invalid event revision`)
    seen.set(event.id, ancestors)
  }
  if (['P01','P02'].includes(record.caseId)) {
    assert.equal(record.events.length, record.caseId==='P01' ? 5 : 6, `${label}: missing or extra approval events`)
    const one = (kind, predicate=()=>true) => {
      const matches=record.events.filter(e=>e.kind===kind && predicate(e))
      assert.equal(matches.length,1,`${label}: ${kind} must occur exactly once`)
      assert.equal(matches[0].task,'a',`${label}: unexpected task`)
      return matches[0]
    }
    const candidate=one('commit'), gate=one('gate'), land=one('integrate')
    for (const event of [candidate,gate,land]) assert.equal(event.revision,record.facts.expectedRevision,`${label}: event candidate pin mismatch`)
    assert.ok(seen.get(gate.id).has(candidate.id),`${label}: gate must test committed candidate`)
    for (const audit of record.facts.audits) {
      const event=one('audit',e=>e.seat===audit.seat && e.revision===audit.revision)
      assert.ok(seen.get(event.id).has(candidate.id),`${label}: audit must follow candidate`)
      assert.ok(seen.get(land.id).has(event.id),`${label}: integration must follow each approval`)
    }
    assert.ok(seen.get(land.id).has(gate.id),`${label}: integration must follow gate`)
    if (record.caseId==='P02') {
      const blocked=one('audit',e=>e.revision===record.facts.previousRevision)
      assert.equal(blocked.seat,record.facts.blockedAudit.seat,`${label}: blocking seat mismatch`)
      assert.ok(seen.get(candidate.id).has(blocked.id),`${label}: repair must follow blocking audit`)
    }
  }
  if (record.caseId === 'P05') {
    assert.equal(record.events.length, 7, `${label}: unexpected or missing fixture events`)
    const one = (task, kind) => {
      const matches = record.events.filter(e => e.task === task && e.kind === kind)
      assert.equal(matches.length, 1, `${label}: ${task}/${kind} must occur exactly once`)
      return matches[0]
    }
    for (const task of ['a', 'b']) assert.equal(one(task, 'dispatch').revision, record.facts.baseRevision, `${label}: frozen base mismatch`)
    const merge = one('a', 'integrate'), dependent = one('c', 'dispatch')
    assert.ok(seen.get(merge.id).has(one('a', 'dispatch').id), `${label}: integration precedes work`)
    assert.ok(seen.get(dependent.id).has(merge.id), `${label}: dependency integration must precede dependent dispatch`)
    assert.equal(merge.revision, record.facts.dependencyRevision, `${label}: integrated dependency mismatch`)
    assert.equal(dependent.revision, merge.revision, `${label}: dependent did not observe integrated predecessor`)
    for (const task of ['a', 'b', 'c']) assert.ok(seen.get(one(task, 'complete').id).has(one(task, 'dispatch').id), `${label}: completion lacks dispatch predecessor`)
  }
  if (record.caseId === 'P06') {
    const active = new Map(), finished = [], failures = []
    let peak = 0
    for (const event of record.events) {
      if (event.kind === 'dispatch') {
        assert.ok(!active.has(event.task) && !finished.includes(event.task), `${label}: duplicate dispatch`)
        active.set(event.task, event.id)
        peak = Math.max(peak, active.size)
      } else {
        assert.ok(['complete', 'error'].includes(event.kind) && active.has(event.task), `${label}: unexpected completion`)
        assert.ok(seen.get(event.id).has(active.get(event.task)), `${label}: completion must follow its dispatch`)
        active.delete(event.task)
        finished.push(event.task)
        if (event.kind === 'error') failures.push(event.task)
      }
    }
    assert.equal(peak, record.facts.peakDispatches, `${label}: observed peak dispatch bound differs`)
    assert.equal(active.size, 0, `${label}: leaked permit`)
    assert.deepEqual(finished.sort(), ['a', 'b', 'c'], `${label}: missing dispatched work`)
    assert.equal(failures.length, 1, `${label}: fixture must exercise thrown dispatch`)
  }
}

export function assertScenario(record, fixture) {
  const scenario = scenarios.find(s => s.id === record.caseId)
  assert.ok(scenario, `unsupported scenario ${record.caseId}`)
  const label = `${record.runtime}/${record.caseId}`
  const fields = ['caseId', 'runtime', 'sourceSha', 'contractVersion', 'fixtureVersion', 'evidenceLevel', 'facts', 'artifacts', 'events']
  assert.ok(Object.keys(record).every(key => fields.includes(key)), `${label}: unknown record field`)
  assert.ok(fixture && fixture.caseId === record.caseId, `${label}: independent fixture required`)
  assert.equal(record.sourceSha, fixture.sourceSha, `${label}: fixture source revision mismatch`)
  for (const [key, role] of Object.entries({ expectedRevision: 'candidate', baseRevision: 'base', dependencyRevision: 'candidate', previousRevision: 'old', approvedRevision: 'old', observedRevision: 'old' })) {
    if (record.facts?.[key] !== undefined) {
      assert.match(fixture.commits?.[role]?.sha ?? '', /^[a-f0-9]{40}$/, `${label}: fixture ${role} revision required`)
      assert.equal(record.facts[key], fixture.commits[role].sha, `${label}: fixture ${role} pin mismatch`)
    }
  }
  assert.ok(record.facts && typeof record.facts === 'object' && !Array.isArray(record.facts), `${label}: facts object required`)
  const additional = {
    P01: ['expectedRevision', 'gateRevision', 'audits'],
    P02: ['expectedRevision', 'previousRevision', 'audits', 'blockedAudit'],
    P03: ['expectedRevision', 'observedRevision'],
    P05: ['baseRevision', 'dependencyRevision'],
    P07: ['expectedRevision', 'gateRevision'],
    P10: ['expectedRevision', 'approvedRevision'],
  }[scenario.id] ?? []
  assert.deepEqual(Object.keys(record.facts).sort(), [...Object.keys(scenario.expected), ...additional].sort(), `${label}: missing or unknown decision fields`)
  assert.ok(scenario.runtimes.includes(record.runtime), `${label}: unsupported runtime`)
  assert.equal(record.contractVersion, 1, `${label}: unsupported contract version`)
  assert.equal(record.fixtureVersion, scenario.fixtureVersion, `${label}: unsupported fixture version`)
  assert.match(record.sourceSha, /^[a-f0-9]{40}$/, `${label}: source SHA required`)
  assert.equal(record.evidenceLevel, 'contract-simulation', `${label}: T2 validates contract-simulation records, not real-host certification`)
  assert.ok(Array.isArray(record.artifacts), `${label}: artifacts required`)
  for (const artifact of record.artifacts) assert.match(artifact.digest,/^[a-f0-9]{64}$/,`${label}: artifact digest required`)
  assert.deepEqual(record.artifacts.map(a=>a.kind).sort(), [...scenario.evidence].sort(), `${label}: duplicate or unknown artifact evidence`)
  if (['P01','P02','P07'].includes(record.caseId)) {
    const gate=record.artifacts.find(a=>a.kind==='gate')
    assert.deepEqual(gate.command,fixture.gateCommand,`${label}: gate command mismatch`)
    assert.ok(Array.isArray(fixture.gateCommand) && fixture.gateCommand.length && fixture.gateCommand.every(s=>typeof s==='string' && s),`${label}: fixture gate command required`)
    assert.equal(gate.revision,record.facts.expectedRevision,`${label}: gate artifact pin mismatch`)
    assert.equal(gate.exit,record.caseId==='P07' ? 1 : 0,`${label}: gate artifact exit mismatch`)
  }
  for (const [key, expected] of Object.entries(scenario.expected)) {
    assert.deepEqual(normalizedFacts(record)[key], expected, `${label}: ${key} violates independent fixture expectation`)
  }
  for (const key of additional.filter(k => k.endsWith('Revision'))) assert.match(record.facts[key], /^[a-f0-9]{40}$/, `${label}: ${key} required`)
  if (additional.includes('audits')) {
    const audits = record.facts.audits
    assert.ok(Array.isArray(audits) && audits.length === 2, `${label}: two independent audits required`)
    assert.deepEqual(audits.map(a => a.seat).sort(), [1, 2], `${label}: distinct audit seats required`)
    assert.equal(new Set(audits.map(a => a.lens)).size, 2, `${label}: distinct lenses required`)
    for (const audit of audits) {
      assert.ok(typeof audit.lens === 'string' && audit.lens.trim(), `${label}: lens required`)
      assert.equal(audit.revision, record.facts.expectedRevision, `${label}: audit pin mismatch`)
      assert.equal(audit.verdict,'approve',`${label}: approving verdict required`)
      assert.deepEqual(audit.findings,[],`${label}: unresolved findings block fixture integration`)
    }
  }
  if (scenario.id==='P02') {
    assert.deepEqual(record.facts.blockedAudit,{seat:1,lens:'correctness',revision:record.facts.previousRevision,verdict:'request_changes',findings:[{id:'major-1',severity:'Major',disposition:'absorb'}]},`${label}: initial Major finding must be preserved`)
  }
  if (additional.includes('gateRevision')) assert.equal(record.facts.gateRevision, record.facts.expectedRevision, `${label}: gate pin mismatch`)
  if (scenario.id === 'P02') assert.notEqual(record.facts.previousRevision, record.facts.expectedRevision, `${label}: repair must change revision`)
  if (scenario.id === 'P10') assert.notEqual(record.facts.approvedRevision, record.facts.expectedRevision, `${label}: rebase must change revision`)
  if (scenario.id === 'P03') {
    assert.match(record.facts.expectedRevision, /^[a-f0-9]{40}$/, `${label}: expectedRevision required`)
    assert.match(record.facts.observedRevision, /^[a-f0-9]{40}$/, `${label}: observedRevision required`)
    assert.notEqual(record.facts.expectedRevision, record.facts.observedRevision, `${label}: fixture must exercise a stale approval`)
  }
  assertTrace(record, label)
  return scenario
}

export function compareObservations(left, right, fixtures) {
  assert.deepEqual([left.runtime, right.runtime].sort(), ['claude', 'codex'], 'comparison requires distinct Claude and Codex records')
  assert.equal(left.sourceSha, right.sourceSha, 'source revisions differ')
  assert.equal(left.caseId, right.caseId, 'scenario IDs differ')
  assertScenario(left, fixtures?.left)
  assertScenario(right, fixtures?.right)
  assert.deepEqual(commitGraph(fixtures.left), commitGraph(fixtures.right), 'fixture trees or ancestry differ')
  assert.deepEqual(normalizedFacts(left, fixtures.left), normalizedFacts(right, fixtures.right), 'runtime observations differ')
  const events = (record, fixture) => (record.events ?? []).map(e => ({...e, ...(e.revision === undefined ? {} : {revision:revisionRole(e.revision, fixture)}), after:[...e.after].sort()})).sort((a,b)=>a.id.localeCompare(b.id))
  assert.deepEqual(events(left, fixtures.left), events(right, fixtures.right), 'causal observations differ')
  const artifacts=(record,fixture)=>record.artifacts.map(a=>({...a,...(a.revision===undefined ? {} : {revision:revisionRole(a.revision,fixture)})})).sort((a,b)=>a.kind.localeCompare(b.kind))
  assert.deepEqual(artifacts(left,fixtures.left),artifacts(right,fixtures.right),'artifact evidence differs')
  return { equivalent: true, evidenceLevel: 'contract-simulation', runtimeCompatibility: 'not-established' }
}
