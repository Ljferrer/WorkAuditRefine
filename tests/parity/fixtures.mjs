// Positive observations authored separately from catalog expectations. These are
// controlled records, not model calls or proof that either production adapter ran.
const facts = {
  P01: { approvals: 2, blockingFindings: [], integrationCount: 1, gateExit: 0, expectedRevision: 'b'.repeat(40), gateRevision: 'b'.repeat(40), audits: [{seat:1,lens:'correctness',revision:'b'.repeat(40)}, {seat:2,lens:'security',revision:'b'.repeat(40)}] },
  P02: { blockedIntegrationCount: 0, freshApprovals: 2, integrationCount: 1, fixAttempts: 1, expectedRevision: 'b'.repeat(40), previousRevision: 'c'.repeat(40), audits: [{seat:1,lens:'correctness',revision:'b'.repeat(40)}, {seat:2,lens:'security',revision:'b'.repeat(40)}] },
  P03: { expectedRevision: 'b'.repeat(40), observedRevision: 'c'.repeat(40), approvalAccepted: false, integrationCount: 0 },
  P04: { result: 'invalid-result', retryCount: 0, integrationCount: 0 },
  P05: { frozenBasePreserved: true, dependencyObserved: true, tasksCompleted: ['a', 'b', 'c'], baseRevision: 'e'.repeat(40), dependencyRevision: 'b'.repeat(40) },
  P06: { peakDispatches: 2, leakedPermits: 0, pendingDispatches: 0, drain: 'completed' },
  P07: { gateExit: 1, integrationCount: 0, result: 'gate-failed', expectedRevision: 'b'.repeat(40), gateRevision: 'b'.repeat(40) },
  P08: { requirementResult: 'requirement-failed', gitErrorResult: 'git-error', integrationCount: 0 },
  P09: { result: 'missing-floor', integrationCount: 0, exemption: null },
  P10: { oldApprovalTransferred: false, freshAuditRequired: true, integrationCount: 0, expectedRevision: 'b'.repeat(40), approvedRevision: 'c'.repeat(40) },
  P11: { result: 'land-stale', forcePushes: 0, foreignCommitRetained: true },
  P12: { workerCommitRetained: true, destructiveResets: 0, duplicateWork: 0 },
  P13: { reconciledFrom: 'git', duplicateLandings: 0, ledgerRepaired: true, remoteCommitRetained: true },
  P14: { ledgerAhead: 'repair-records', gitAhead: 'repair-records', unexplained: 'halt', destructiveResets: 0 },
  P15: { createdIssues: 1, correlationRecovered: true, duplicateIssues: 0 },
  P16: { dispositions: ['absorb', 'follow-up', 'note', 'ask'], lostFindings: [], operatorDecisionRequired: true },
  P17: { workerDispatches: 0, result: 'env-blocked', provisionExit: 1 },
  P18: { attempted: true, denied: true, changedPaths: [], createdRefs: [] },
  P19: { ownWrite: 'allowed', siblingWrite: 'denied', mainWrite: 'denied', traversalWrite: 'denied', symlinkWrite: 'denied' },
  P20: { checkedForms: ['add', 'update', 'delete', 'rename-source', 'rename-destination'], forbiddenDestination: 'denied', mutationCount: 0 },
  P21: { invalidProvenance: 'denied', protectedLesson: 'denied', validLesson: 'allowed', redactionApplied: true },
  P22: { dispatchesAfterCancel: 0, liveDescendants: 0, result: 'incomplete' },
  P23: { ownershipPreserved: true, submoduleBeforeSuperproject: true, matchingArtifact: true },
  P24: { ownedLanded: 'removed', foreign: 'retained', dirty: 'retained', unexplained: 'retained' },
  P25: { clientExit: 0, compatible: false, result: 'package-invalid' },
  P26: { profileChanged: false, result: 'unavailable', successfulAudits: 0 },
}
const evidence = {
  P01: ['audit-result', 'gate', 'git-state'], P02: ['audit-result', 'git-state'], P03: ['audit-result'],
  P04: ['transport'], P05: ['dispatch', 'git-state'], P06: ['dispatch'], P07: ['gate'], P08: ['floor'], P09: ['floor'],
  P10: ['audit-result', 'git-state'], P11: ['git-state'], P12: ['process', 'git-state'], P13: ['process', 'git-state', 'ledger'],
  P14: ['git-state', 'ledger'], P15: ['service-log'], P16: ['ledger'], P17: ['provision', 'dispatch'], P18: ['denial', 'git-state'],
  P19: ['denial', 'git-state'], P20: ['denial'], P21: ['denial', 'memory'], P22: ['process', 'dispatch'], P23: ['git-state'],
  P24: ['git-state', 'cleanup'], P25: ['package'], P26: ['transport'],
}
export function fixtureContext(caseId) {
  return { caseId, sourceSha: 'a'.repeat(40), tempRoot: '/fixture', commits: {
    base: { sha: 'e'.repeat(40), tree: '0'.repeat(40), parents: [] },
    candidate: { sha: 'b'.repeat(40), tree: '1'.repeat(40), parents: ['base'] },
    old: { sha: 'c'.repeat(40), tree: '2'.repeat(40), parents: ['base'] },
  } }
}
export function observation(caseId, runtime) {
  const record = { caseId, runtime, sourceSha: 'a'.repeat(40), contractVersion: 1, fixtureVersion: 1,
    evidenceLevel: 'contract-simulation', facts: structuredClone(facts[caseId]),
    artifacts: evidence[caseId].map(kind => ({ kind, digest: 'd'.repeat(64) })) }
  if (caseId === 'P05') record.events = [
    {id:'a-start',task:'a',kind:'dispatch',after:[],revision:'e'.repeat(40)},
    {id:'b-start',task:'b',kind:'dispatch',after:[],revision:'e'.repeat(40)},
    {id:'a-merge',task:'a',kind:'integrate',after:['a-start'],revision:'b'.repeat(40)},
    {id:'a-done',task:'a',kind:'complete',after:['a-merge']},
    {id:'b-done',task:'b',kind:'complete',after:['b-start']},
    {id:'c-start',task:'c',kind:'dispatch',after:['a-merge'],revision:'b'.repeat(40)},
    {id:'c-done',task:'c',kind:'complete',after:['c-start']},
  ]
  if (caseId === 'P06') record.events = [
    {id:'a-start',task:'a',kind:'dispatch',after:[]},
    {id:'b-start',task:'b',kind:'dispatch',after:[]},
    {id:'a-error',task:'a',kind:'error',after:['a-start']},
    {id:'c-start',task:'c',kind:'dispatch',after:['a-error']},
    {id:'b-done',task:'b',kind:'complete',after:['b-start']},
    {id:'c-done',task:'c',kind:'complete',after:['c-start']},
  ]
  return record
}
