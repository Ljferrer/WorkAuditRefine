// Late defects fixed in the run — the finding class (part 1)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 2.1 (D2/D7/D24, PIN-2/PIN-7/PIN-24): the seat sets
// `findingClass` on each Minor and Nit; a behavior note never stays a note (absorb with a fix on a
// named file, else a parked ask); a cosmetic or classless row keeps today's route.
import { test } from 'node:test'
import {
  assert,
  FINDING_CLASSES,
  src,
  auditorMd,
  findingClassMd,
  schemasMd,
  windowOf,
  grabSchema,
  registrySlice,
  runPhase,
  PROVISION_ARGS,
  defaultImpl,
  isAuditor,
  isAce,
  SWEEP_ARGS,
  floorImpl,
  minor,
  PROBE,
  p4Base,
  gaAbsorb,
  gaPromptOf,
  polishPromptOf,
  demotionOf,
} from './workflow-template.test-harness.mjs'

// The two sentences the class adds to the DISPOSITION RULE, in their rendered form.
const CLASS_SENTENCE = 'Set `findingClass` on each Minor/Nit to behavior or cosmetic: behavior when the change does the wrong thing when it runs or a doc teaches a wrong rule, cosmetic when only wording, layout or naming is off.'
const SLICE_PIN_SENTENCE = 'A behavior defect this task adds stays a finding even when the slice pins its mechanism, and routes absorb or ask, never note: a behavior note with a fix on a named file is applied, and any other behavior note parks as an ask.'
const isNote = (out, title) => (out.notes || []).some(n => n && n.title === title)
const isAsk = (out, title) => (out.asks || []).some(a => a && a.finding && a.finding.title === title)

test('late-defect: class — the AUDIT_VERDICT finding shape carries findingClass, its enum fed by the inline FINDING_CLASSES mirror', () => {
  const schema = grabSchema('AUDIT_VERDICT')
  const prop = schema.properties.findings.items.properties.findingClass
  assert.ok(prop, 'the finding items schema has a findingClass property')
  assert.deepEqual(prop.enum, FINDING_CLASSES, 'its enum is the canonical behavior/cosmetic pair')
  assert.ok(!schema.properties.findings.items.required.includes('findingClass'), 'findingClass is optional: a classless row keeps today\'s route')
  assert.ok(src.includes('findingClass: { enum: FINDING_CLASSES }'), 'the schema reads the inline mirror, never a hand-typed list')
})

test('late-defect: class — normalizeFinding keeps a member class and drops a non-member, so an unknown class reads classless', () => {
  const h = registrySlice()
  assert.equal(h.normalizeFinding({ severity: 'Nit', file: 'a.js', findingClass: 'behavior' }).findingClass, 'behavior', 'behavior survives intake')
  assert.equal(h.normalizeFinding({ severity: 'Nit', file: 'a.js', findingClass: 'cosmetic' }).findingClass, 'cosmetic', 'cosmetic survives intake')
  const forged = h.normalizeFinding({ severity: 'Nit', file: 'a.js', findingClass: 'Behavior' })
  assert.ok(!('findingClass' in forged), 'a non-member (wrong case) is dropped at intake')
  assert.ok(!('findingClass' in h.normalizeFinding({ severity: 'Nit', file: 'a.js', findingClass: null })), 'a null class is dropped too')
  assert.deepEqual(h.normalizeFinding({ severity: 'Nit', file: './a.js' }), { severity: 'Nit', file: 'a.js' }, 'a classless row gains no class key')
})

test('late-defect: class — intakeFloor: a behavior note with a fix reads absorb (in-diff bare, out-of-diff or probe-absent with phaseClose:true); one with no fix reads ask; cosmetic and classless notes keep today\'s route', () => {
  const h = registrySlice()
  const diff = new Set(['a.js'])
  const row = over => ({ severity: 'Nit', task: 't1', title: 'row', file: 'a.js', disposition: 'note', suggested_fix: 'fix it', ...over })
  const inDiff = row({ findingClass: 'behavior' })
  assert.equal(h.intakeFloor(inDiff, 'note', diff), 'absorb', 'in-diff behavior note with a fix → absorb')
  assert.notEqual(inDiff.phaseClose, true, 'in-diff: a bare absorb, it joins the task ace batch')
  const outDiff = row({ findingClass: 'behavior', file: 'b.js' })
  assert.equal(h.intakeFloor(outDiff, 'note', diff), 'absorb', 'out-of-diff behavior note with a fix → absorb')
  assert.equal(outDiff.phaseClose, true, 'out-of-diff: phaseClose:true, it rides the sweep')
  const noProbe = row({ findingClass: 'behavior' })
  assert.equal(h.intakeFloor(noProbe, 'note', null), 'absorb', 'probe absent: the behavior arm still holds')
  assert.equal(noProbe.phaseClose, true, 'probe absent: phaseClose:true')
  assert.equal(h.intakeFloor(row({ findingClass: 'behavior', suggested_fix: '  ' }), 'note', diff), 'ask', 'a blank fix → ask')
  assert.equal(h.intakeFloor(row({ findingClass: 'behavior', file: '' }), 'note', diff), 'ask', 'a fix with no named file → ask')
  assert.equal(h.intakeFloor(row({ findingClass: 'behavior', disposition: undefined, suggested_fix: undefined }), 'note', null), 'ask', 'a defaulted Nit note with no fix and no probe → ask')
  // today's route: cosmetic and classless rows are untouched by the arm
  assert.equal(h.intakeFloor(row({ findingClass: 'cosmetic', file: 'b.js' }), 'note', diff), 'note', 'an out-of-diff cosmetic note with a fix stays a note')
  assert.equal(h.intakeFloor(row({ file: 'b.js' }), 'note', diff), 'note', 'an out-of-diff classless note with a fix stays a note')
  assert.equal(h.intakeFloor(row({ findingClass: 'cosmetic', suggested_fix: '' }), 'note', diff), 'note', 'a fix-less cosmetic note stays a note')
  assert.equal(h.intakeFloor(row({ suggested_fix: '' }), 'note', diff), 'note', 'a fix-less classless note stays a note')
  assert.equal(h.intakeFloor(row({ findingClass: 'behavior', engineFiled: true }), 'note', diff), 'note', 'an engine demotion is never rerouted')
  assert.equal(h.intakeFloor(row({ findingClass: 'behavior', disposition: 'absorb' }), 'absorb', diff), 'absorb', 'a behavior absorb passes through')
  assert.ok(h.logs.some(l => typeof l === 'string' && l.includes('behavior note with a fix → absorb')), 'the absorb reroute is logged')
  assert.ok(h.logs.some(l => typeof l === 'string' && l.includes('behavior note with no fix on a named file → ask')), 'the ask reroute is logged')
})

test('late-defect: class — end to end: an in-diff behavior note joins the task ace batch, an out-of-diff one rides the sweep, a fix-less one parks as an ask, and none stays a note', async () => {
  const inFix = minor({ title: 'behavior in diff', severity: 'Nit', disposition: 'note', suggested_fix: 'fix it', findingClass: 'behavior' })
  const outFix = minor({ title: 'behavior out of diff', severity: 'Nit', file: 'docs/elsewhere.md', disposition: 'note', suggested_fix: 'fix it', findingClass: 'behavior' })
  const bare = minor({ title: 'behavior no fix', severity: 'Nit', disposition: 'note', findingClass: 'behavior' })
  const { out, calls } = await runPhase(SWEEP_ARGS(), floorImpl([inFix, outFix, bare]), PROBE)
  const ace = calls.find(isAce)
  assert.ok(ace && ace.prompt.includes('behavior in diff'), 'the in-diff behavior note joins the task ace batch')
  assert.ok(polishPromptOf(calls).includes('behavior out of diff'), 'the out-of-diff behavior note rides the sweep')
  assert.ok(isAsk(out, 'behavior no fix'), 'the fix-less behavior note parks as an ask')
  for (const t of ['behavior in diff', 'behavior out of diff', 'behavior no fix']) {
    assert.ok(!isNote(out, t), `"${t}" never stays a note`)
    assert.ok(!demotionOf(out, t), `"${t}" is never filed`)
  }
})

test('late-defect: class — end to end: a cosmetic note and a classless note keep today\'s route (an out-of-diff note with a fix and a fix-less note stay notes)', async () => {
  const cosOut = minor({ title: 'cosmetic out of diff', severity: 'Nit', file: 'docs/elsewhere.md', disposition: 'note', suggested_fix: 'fix it', findingClass: 'cosmetic' })
  const cosBare = minor({ title: 'cosmetic no fix', severity: 'Nit', disposition: 'note', findingClass: 'cosmetic' })
  const noneOut = minor({ title: 'classless out of diff', severity: 'Nit', file: 'docs/elsewhere.md', disposition: 'note', suggested_fix: 'fix it' })
  const noneBare = minor({ title: 'classless no fix', severity: 'Nit', disposition: 'note' })
  const forged = minor({ title: 'unknown class no fix', severity: 'Nit', disposition: 'note', findingClass: 'BEHAVIOR' })
  const { out, calls } = await runPhase(SWEEP_ARGS(), floorImpl([cosOut, cosBare, noneOut, noneBare, forged]), PROBE)
  for (const t of ['cosmetic out of diff', 'cosmetic no fix', 'classless out of diff', 'classless no fix', 'unknown class no fix']) {
    assert.ok(isNote(out, t), `"${t}" stays a note`)
    assert.ok(!isAsk(out, t), `"${t}" never parks`)
    assert.ok(!calls.some(c => isAce(c) && c.prompt.includes(t)), `"${t}" never joins an ace batch`)
  }
})

test('late-defect: class — the gate-audit floor pass: a behavior note with a fix rides the sweep even outside phase_diff_files, a fix-less one parks, and a cosmetic one keeps the old arm', async () => {
  const bFix = gaAbsorb({ title: 'ga behavior out of diff', disposition: 'note', file: 'docs/untouched.md', findingClass: 'behavior' })
  const bBare = gaAbsorb({ title: 'ga behavior no fix', disposition: 'note', suggested_fix: '', findingClass: 'behavior' })
  const cos = gaAbsorb({ title: 'ga cosmetic out of diff', disposition: 'note', file: 'docs/untouched.md', findingClass: 'cosmetic' })
  const evidence = { perTask: [], phase_diff_files: ['./docs/ga.md'] }
  const { out, calls, logs } = await runPhase(SWEEP_ARGS(), p4Base({ gate: [bFix, bBare, cos], evidence }))
  assert.ok(polishPromptOf(calls).includes('ga behavior out of diff'), 'the behavior note with a fix rides the sweep')
  assert.ok(isAsk(out, 'ga behavior no fix'), 'the fix-less behavior note parks')
  assert.ok(!isNote(out, 'ga behavior out of diff') && !isNote(out, 'ga behavior no fix'), 'neither behavior row stays a note')
  assert.ok(isNote(out, 'ga cosmetic out of diff'), 'the cosmetic out-of-phase-diff note stays a note')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('gate-audit floor pass REROUTED') && l.includes('behavior note with a fix')), 'the reroute is logged')
})

test('late-defect: class — the dispatched DISPOSITION RULE asks for the class and keeps a slice-pinned behavior defect a finding, byte-mirrored on the card, on the roster and gate-audit prompts', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isAuditor).prompt
  const rule = windowOf(p, 'DISPOSITION RULE:', '\n')
  assert.ok(rule.includes(CLASS_SENTENCE), 'the roster prompt asks for findingClass on each Minor/Nit')
  assert.ok(rule.includes(SLICE_PIN_SENTENCE), 'the roster prompt carries the slice-pin rule')
  assert.ok(rule.includes('to ' + FINDING_CLASSES.join(' or ') + ':'), 'the class pair renders from the mirror')
  const card = windowOf(auditorMd, '**Disposition rule:** ', '\n')
  assert.equal(rule.trim(), card.trim(), 'the card bullet byte-mirrors the dispatched sentence (standing card + dispatched prompt, one commit)')
  assert.ok(src.includes("each Minor/Nit to ${FINDING_CLASSES.join(' or ')}:"), 'the prompt literal interpolates the mirror, never a hand-typed pair')
  const perTask = await runPhase(SWEEP_ARGS(), p4Base())
  const esArgs = SWEEP_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ['condition A holds at the tip'] },
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false }],
  })
  const endState = await runPhase(esArgs, p4Base())
  for (const [label, run] of [['gate-audit:t1:execution-evidence', perTask], ['gate-audit:phase-3:end-state', endState]]) {
    const gp = gaPromptOf(run.calls, label)
    assert.ok(gp, 'presence guard: ' + label + ' convened')
    assert.ok(gp.includes(CLASS_SENTENCE) && gp.includes(SLICE_PIN_SENTENCE), label + ' carries both class sentences')
  }
})

test('late-defect: class — finding-class.md holds the class test and points at the export without listing the values; schemas.md documents findingClass by pointing at the export', () => {
  const section = windowOf(findingClassMd, '## Finding class\n', '\n## ')
  assert.ok(section.includes('`FINDING_CLASSES` export in `skills/war/assets/land-decision.mjs`'), 'the class doctrine points at the export')
  assert.ok(section.includes('stays a finding even when the slice pins its mechanism'), 'the slice-pin rule is stated')
  assert.ok(section.includes('A cosmetic row, or a row with no class, keeps today\'s route.'), 'the classless route is stated')
  const row = windowOf(schemasMd, 'findingClass?,', '\n')
  assert.ok(row.includes('one of FINDING_CLASSES (canonical: land-decision.mjs'), 'schemas.md points at the export')
  for (const v of FINDING_CLASSES) assert.ok(!row.includes('"' + v + '"'), 'schemas.md never lists the value ' + v)
})
