// workflow-template.test-harness.mjs — the shared definitions for the workflow-template test files.
//
// WHY THIS FILE EXISTS (2026-10-30, PR #2529): workflow-template.test.mjs grew to 23,012 lines and
// 196-264 s of serial run time, the single longest file in the gate. node --test runs FILES in parallel
// but the tests inside one file serially, so the one file was the gate's bottleneck. It was split
// mechanically into this harness plus the part files below. Every test block moved byte-for-byte,
// and each part keeps its blocks in their original file order.
//
// THE FILES
//   workflow-template.test-harness.mjs  every import and every top-level definition (fixtures,
//                                       builders, impls, constants), in original order, all exported.
//                                       Not a test file: its name does not match '*.test.mjs'.
//   workflow-template.<topic>-<n>.test.mjs  the test files, listed below. <n> numbers a topic's parts;
//                                       a one-part topic (recovery) has no number. The pre-split
//                                       workflow-template.test.mjs is engine-1, the fast majority.
//
// THE SPLIT AT CREATION (blocks = top-level test( or for-loop blocks; times from one serial run;
// 1,337 tests, 264 s serial, 66 s wall once split):
//   workflow-template.engine-1.test.mjs      807 blocks, ~18 s  Engine logic and prompt-contract tests (part 1 of 2)
//   workflow-template.engine-2.test.mjs        1 blocks, ~27 s  Engine logic and prompt-contract tests (part 2 of 2)
//   workflow-template.git-1.test.mjs           9 blocks, ~18 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 1 of 6)
//   workflow-template.git-2.test.mjs           7 blocks, ~18 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 2 of 6)
//   workflow-template.git-3.test.mjs           7 blocks, ~18 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 3 of 6)
//   workflow-template.git-4.test.mjs           6 blocks, ~19 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 4 of 6)
//   workflow-template.git-5.test.mjs           1 blocks, ~35 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 5 of 6)
//   workflow-template.git-6.test.mjs           1 blocks, ~23 s  Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 6 of 6)
//   workflow-template.recovery.test.mjs       47 blocks, ~21 s  Recovery, resume and relaunch tests
//   workflow-template.submodule-1.test.mjs    33 blocks, ~14 s  Submodule and gitlink tests (part 1 of 3)
//   workflow-template.submodule-2.test.mjs     3 blocks, ~15 s  Submodule and gitlink tests (part 2 of 3)
//   workflow-template.submodule-3.test.mjs     1 blocks, ~38 s  Submodule and gitlink tests (part 3 of 3)
//   A single for-loop block cannot be split without editing its case list, so the git-5,
//   engine-2 and submodule-3 files each hold one large loop. Splitting a loop case list is the next lever.
//
// WHERE A NEW TEST GOES
//   - A new fixture, builder or constant: here, then add its name to the export list at the bottom
//     AND to the import list of each part file that uses it. A part never declares a top-level binding.
//   - A new test: the part file whose topic it tests. A test that spawns real git (spawnSync('git'),
//     mkdtempSync repos, gitTaskMerge) goes in a git-* part; one about recovery, resume or relaunch in
//     the recovery part; one about submodules in a submodule part; everything else in
//     workflow-template.engine-1.test.mjs.
//   - A test name a plan's End-state check greps for (for example '2485/ES1 ') may now live in a part
//     file. A plan check that greps workflow-template.test.mjs (the pre-split name) for a test name
//     must grep 'skills/war/assets/workflow-template.*.test.mjs' instead.
//   - A new part file: name it workflow-template.<topic>-<n>.test.mjs and add it to the breadth list
//     in war-config.test.mjs ('node-test breadth'), so losing it later turns the gate red.
//   - A top-level let (chainFixCaptures) is assigned only inside functions defined here: an importer
//     cannot assign an imported binding.
//
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { HARD_ESCALATION_REASONS, KNOWN_LAND_DECISIONS, SOFT_ENV_REASONS, BARRIER_TOKENS, RELEASE_SLOT_FILES, DEMOTE_REASONS } from './land-decision.mjs'
import { spawnOpts, validateRoster, widenRoster, resolveWidenSource, resolveGate, ROLES, DEFAULTS, SEAT_AGENT_TYPES, EVIDENCE_LENS, WIDEN_BARRED_LENSES, MODELS, EFFORTS } from './war-config.mjs'
import { extractInterpolations, extractArgsFields, EXEMPT_FIELDS } from './assert-args-complete.mjs'
import { MANIFEST_PATH_TEMPLATE, MANIFEST_KEYS } from './target-artifacts.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const auditorMd = readFileSync(join(here, '../../../agents/war-auditor.md'), 'utf8')
// (auditor-evict, D16) the references home of the evicted `execution-evidence` gate-audit checklist —
// every assert that reads a checklist DUTY reads this file; heading + trigger pointer stay on the card.
const gateAuditChecklistMd = readFileSync(join(here, '../references/gate-audit-checklist.md'), 'utf8')
// UNION surface (prompt-surface simplification, adjudication I): Task 3.1 evicted the guard-contract
// teach prose from the card into this reference file — every OLD-absent key over the card scans it too.
const auditorTeachMd = readFileSync(join(here, '../references/auditor-teach.md'), 'utf8')
const refinerMd = readFileSync(join(here, '../../../agents/war-refiner.md'), 'utf8')
const schemasMdForAbsorb = readFileSync(join(here, '../references/schemas.md'), 'utf8')   // read surface for the absorb-budget both-surfaces fixture (#2027)
// Relocated surface (in-band-absorb-default D12, ADR 0042): Task 2.1 evicted `## Gate-failure
// classification` byte-identical from the card into this reference file (the card keeps the heading
// and the trigger pointer) — presence keys over the moved procedure relocate their read here.
const gateFailureMd = readFileSync(join(here, '../references/gate-failure-classification.md'), 'utf8')
// UNION/relocated surface (prompt-surface simplification, adjudications E+I): Task 4.1 evicted the
// submodule-as-repo provisioning recipe, the superproject reland discrimination (land step 3), and the
// 2A/2B submodule land arms from the card into this reference file — presence keys over the moved text
// relocate their read here; every OLD-absent key over the card scans it too.
const refinerRecoveryMd = readFileSync(join(here, '../references/refiner-recovery.md'), 'utf8')
const fileFollowupsMd = readFileSync(join(here, '../references/file-followups.md'), 'utf8')
// UNION surface (prompt-surface simplification, adjudication I): Task 5.1 evicted the worker/servitor
// tier>=2 blocks from the cards into this reference file — every OLD-absent key over the card scans it too.
const edgesMd = readFileSync(join(here, '../references/worker-servitor-edges.md'), 'utf8')
const src = readFileSync(join(here, 'workflow-template.js'), 'utf8').replace(/^export const meta/m, 'const meta')
// #2485 D16: the one trailer-layout sentence, read from its single engine home.
const TRAILER_BLOCK_RULE = src.match(/^const TRAILER_BLOCK_RULE = '([^']+)'$/m)[1]
// Execute the canonical read-only recipe; fixtures independently assert the actual Git contents.
const exactGitDiffRecipe = refinerRecoveryMd.match(/## Exact Git diff identity[^]*?```bash\n([^]*?)```/)[1]
const fixtureContentId = (repo, base, tip) => {
  const r = spawnSync('bash', ['-c', exactGitDiffRecipe, 'git-content-id', base, tip], { cwd: repo, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout.trim(), /^[0-9a-f]{40}$/)
  return r.stdout.trim()
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
// `source` defaults to the live template; a fixture passes a mutated copy for a delete-and-trace control.
const build = (source = src) => new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', source)

// --- Behavioral harness (mirrors red-team workflow-scaffold.test.mjs) ----------------------
// Run the template with a mock `agent` that records every { prompt, opts } in call order, plus a
// faithful `parallel` (run all thunks). We drive a happy-path phase (work→approve→merge→land→wrap)
// so the whole prompt surface — Provision barrier, worker, fix-worker, auditor — is exercised.
const fakeParallel = async (thunks) => Promise.all(thunks.map((t) => t()))

// agentImpl(prompt, opts) returns the role's result. Defaults: worker implemented, auditor approve,
// refiner merged/landed, servitor a result — so the in-flow land + wrap-up both fire.
// #1913 seat defaults. The wave-side ace tip's PIN-12 gate check (dispatchKind 'ace-gate') and the
// merge slot's pin-transfer probe (dispatchKind 'pin-transfer') are refiner seats with their OWN
// schemas, so the many fixtures that answer "any Refine-phase refiner" with a MergeResult would feed
// them a shape they cannot read. The harness normalizes ONLY non-conforming answers: a fixture that
// returns a conforming shape drives the seat exactly as it wrote it, and every other fixture gets the
// neutral default — a green ace gate, and a fail-open pin-transfer probe whose ordinary merge dispatch
// then runs unchanged.
const NEW_SEAT_DEFAULTS = {
  // A green gate at the ace tip, and a fail-open pin-transfer probe whose caller then runs the
  // ordinary merge dispatch unchanged — so every pre-#1913 fixture behaves exactly as it did.
  // #1951: the green arm now requires head_sha (schema if/then + engine isSha guard), so the
  // default echoes the dispatched tip parsed from the prompt — the shape a live validator-retried
  // refiner returns.
  'ace-gate': (prompt) => ({ gate_green: true, head_sha: (String(prompt).match(/at the ace tip ([0-9a-f]{7,40})/) || [])[1] }),
  'pin-transfer': { status: 'error' },
  'audit-pin': prompt => {
    const reported = fixturePinRequest(prompt)
    return reported.length && reported.every(x => typeof x === 'string' && /^[0-9a-f]{7,40}$/.test(x))
      ? fixtureGitProof(prompt, reported[0].padEnd(40, '0')) : {}
  },
  // #2485 D9: a task merge (context kind 'task') is a --no-ff merge commit — the neutral proof reports
  // parents [snapshot base, source tip], equal trees and the exact trailer; polish and terminal merges
  // keep the fast-forward shape and land keeps the phase commit.
  // The second parent is the gated tip the merge reply reported (world.merge), else the snapshot source.
  'merge-confirm': (prompt, opts, world) => {
    const ctx = JSON.parse(prompt.match(/Context: (\{.*?\})\. Immutable pre-dispatch snapshot:/)[1])
    const before = JSON.parse(prompt.match(/Immutable pre-dispatch snapshot: ([^\n]+?)\. Reported result:/)[1])
    const result = JSON.parse(prompt.match(/Reported result: ([^\n]+?)\.\n/)[1])
    const tip = typeof result.claimed === 'string' && /^[0-9a-f]{7,40}$/.test(result.claimed) ? result.claimed.padEnd(40, '0') : null
    const reply = world && opts && world.merge.get(String(opts.label || '').replace(/^git-confirm:/, ''))
    const gated = reply && isHexSha(reply.gate_sha) ? reply.gate_sha.padEnd(40, '0') : before.source_sha
    if (['merged', 'landed'].includes(result.status) && ctx.kind === 'task') return { local_sha: tip, remote_sha: tip, source_tip: gated, reported_sha: tip, patch_id: before.patch_id, content_id: before.content_id, base_is_ancestor: true,
      parents: [before.base_sha, gated], tree: { target: fixtureTree('merge:' + tip), source: fixtureTree('merge:' + tip) }, trailer: 'WAR-Task: ' + ctx.source + '\n' }
    return ['merged', 'landed'].includes(result.status)
      ? { local_sha: tip, remote_sha: tip, source_tip: result.status === 'landed' ? before.source_sha : tip, reported_sha: tip, patch_id: before.patch_id, content_id: before.content_id, base_is_ancestor: true, parents: [before.remote_sha, before.source_sha] }
      : { local_sha: before.base_sha, remote_sha: before.remote_sha, source_tip: before.source_sha, patch_id: before.patch_id, content_id: before.content_id }
  },
  // Neutral legacy fixtures describe a coherent synthetic Git world. Raw Git-boundary tests
  // replace these seats with independently measured refs/objects and never use this projection.
  'pin-confirm': prompt => {
    const before = JSON.parse(prompt.match(/Immutable BEFORE: (.+?)\. REPORTED PINS:/)[1])
    const pins = JSON.parse(prompt.match(/REPORTED PINS: ([^\n]+)/)[1]).map(x => typeof x === 'string' && /^[0-9a-f]{7,40}$/.test(x) ? x.padEnd(40, '0') : null)
    const probe = JSON.parse(prompt.match(/CLAIMED RESULT: ([^\n]+)/)[1])
    return { head_sha: pins[1] || before.source_sha, local_sha: before.base_sha, remote_sha: before.remote_sha,
      content_sha: before.source_sha, approved_tree: '3'.repeat(40), content_tree: '3'.repeat(40), head_tree: '3'.repeat(40),
      dispatch_base: pins[2] || '4'.repeat(40), pre_content_id: '5'.repeat(40), post_content_id: '5'.repeat(40), pre_patch_id: probe?.pre_rebase_patch_id ?? 'fixture-task-patch', post_patch_id: probe?.post_rebase_patch_id ?? 'fixture-task-patch',
      target_ancestor: true, post_empty: probe?.post_rebase_patch_id === '', task_count: Math.max(1, pins.length - 4), pins,
      cherry: pins.slice(4).map(sha => ({ sha, sign: '-' })) }
  },
  'pin-snapshot': { base_sha: '1'.repeat(40), source_sha: '2'.repeat(40), remote_sha: '1'.repeat(40), patch_id: 'fixture-task-patch', content_id: '5'.repeat(40) },
  'target-reconcile': { detail: 'no safe automatic correction in this fixture' },
  'merge-snapshot': { base_sha: '1'.repeat(40), source_sha: '2'.repeat(40), remote_sha: '1'.repeat(40), patch_id: 'fixture-task-patch', content_id: '5'.repeat(40) },
  'merge-reconcile': { source_tip: '2'.repeat(40), patch_id: 'fixture-task-patch', content_id: '5'.repeat(40), outcome: 'unmerged', base_sha: '1'.repeat(40), source_sha: '2'.repeat(40), local_sha: '1'.repeat(40), remote_sha: '1'.repeat(40) },

  // tip-probe (#2485 D2, PIN-2): the read-only refiner read of the branch tip after every ace
  // dispatch. The harness keeps a tiny Git world (see runPhase): an ace-family worker that returns
  // `implemented` with a usable head_sha moved its branch one commit to that sha, with the files it
  // reported in ace_diff_files; anything else (blocked, no sha, a death) left the tip unchanged. So
  // every pre-#2485 fixture keeps its old arm. A fixture that wants a moved tip behind a blocked
  // result answers this seat itself. Every builder reports pre_tree as the approved tree: in an honest
  // run the pre-dispatch tip (the approved tip, or the refiner revert) carries the approved tree.
  'tip-probe': (prompt, opts, world) => {
    const pre = (String(prompt).match(/PRE=(\S+) \(the pre-dispatch tip\)/) || [])[1]
    const approved = (String(prompt).match(/APPROVED=(\S+) \(the last approved tip\)/) || [])[1]
    const preSha = isHexSha(pre) ? pre : FIXTURE_REF_TIP   // a ref name (the terminal site's integration branch) resolves to one fixed tip
    const approvedSha = isHexSha(approved) ? approved : preSha
    const w = world && world.ace.get(branchOfPrompt(prompt))
    return w && w.status === 'implemented' && isHexSha(w.head_sha)
      ? { tip_sha: w.head_sha, tip_tree: fixtureTree('ace:' + w.head_sha), pre_sha: preSha, pre_tree: fixtureTree(approvedSha), approved_tree: fixtureTree(approvedSha), count: 1, pre_is_ancestor: true, files: Array.isArray(w.ace_diff_files) ? w.ace_diff_files : [] }
      : { tip_sha: preSha, tip_tree: fixtureTree(approvedSha), pre_sha: preSha, pre_tree: fixtureTree(approvedSha), approved_tree: fixtureTree(approvedSha), count: 0, pre_is_ancestor: true, files: [] }
  },
  // ace-revert (#2485 D17, PIN-17): the refiner range revert before a subset or re-entry worker. It
  // reports the revert commit, whose tree is the approved tree.
  'ace-revert': prompt => {
    const approved = (String(prompt).match(/APPROVED=(\S+) \(the last approved tip\)/) || [])[1]
    return { ok: true, tip_sha: createHash('sha1').update('revert:' + approved).digest('hex') }
  },
  // diff-probe (in-band-absorb-default D4): the per-task refiner probe between the worker's green
  // return and the seat convene. The neutral default is an ABSENT probe (no diff_files) — the
  // fail-open arm: dispositionOf keeps the old severity default and the intake floor skips, so
  // every pre-Phase-4 fixture routes exactly as it did. A fixture that wants the floor answers the
  // seat with { diff_files: [...] } through `seats`.
  'diff-probe': { detail: 'harness default — no probe' },
}
// runPhase(args, agentImpl, seats): `seats` drives the two #1913 refiner seats — a value, or a
// (prompt, opts) function. They are answered from `seats`, never from agentImpl, precisely because the
// existing fixtures answer "any Refine-phase refiner" with a MergeResult (several by COUNTING merge
// calls); routing the new seats through them would feed a shape they cannot read and consume their
// counters. The dispatches are still recorded in `calls`, so ordering and prompt assertions see them.
const answerNewSeat = (seats, prompt, opts, world) => {
  const o = seats[opts.dispatchKind]
  const r = o ?? NEW_SEAT_DEFAULTS[opts.dispatchKind]
  return typeof r === 'function' ? r(prompt, opts, world) : r
}
// The #2485 harness Git world: hex test, a deterministic fixture tree per name, the branch a prompt
// names, and the fixed tip a ref-named PRE resolves to.
const isHexSha = s => typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)
const fixtureTree = name => createHash('sha1').update('tree:' + name).digest('hex')
const branchOfPrompt = prompt => (String(prompt).match(/\(branch ([^,)\s]+)/) || [])[1] || null
const FIXTURE_REF_TIP = 'feed0000'.padEnd(40, '0')
const NEW_SEAT_KINDS = ['ace-gate', 'pin-transfer', 'diff-probe', 'pin-confirm', 'pin-snapshot', 'target-reconcile', 'merge-confirm', 'merge-snapshot', 'merge-reconcile', 'audit-pin', 'tip-probe', 'ace-revert']

// Scripted Git proof for neutral flow fixtures; real Git integrity tests supply their own
// independent resolver and raw responses. This helper never changes worker/auditor responses.
const fixturePinRequest = prompt => JSON.parse(String(prompt).match(/PIN REQUEST: ([^\n]+)/)[1])
const fixtureGitProof = (prompt, head_sha) => ({ head_sha, pins: fixturePinRequest(prompt).map(sha =>
  typeof sha === 'string' && /^[0-9a-f]{7,40}$/.test(sha) ? sha.padEnd(40, '0') : null) })
// Successful captured-artifact fixtures allocate within the engine's dispatched prefix.
// Malformed-path tests return raw values directly and do not use this constructor.
const stableGatePrompt = prompt => prompt.replace(/\.[a-z0-9]+-[a-z0-9]+-(\d+)\./g, '.epoch-$1.')
const fixtureGatePath = prompt => {
  const command = [...String(prompt).matchAll(/mktemp -d "([^"\n]+gate-[^"\n]+)XXXXXX"/g)].at(-1)
  return command ? command[1] + 'A1b2C3/gate.log' : undefined
}
const fixtureAuditPin = prompt => (String(prompt).match(/AUDIT PIN: the worker reports commit ([0-9a-f]{7,40})/) || [])[1]
// Neutral successful task-audit fixtures report the dispatched tree. Deliberate missing-field
// boundary cases pass rawTaskAuditPins:true; explicit audit_sha values (including undefined)
// always survive untouched. This is fixture construction, never production normalization.
const completeAuditFixture = (prompt, opts, result) => /^audit:/.test(opts.label || '') && result && typeof result === 'object' && !Object.hasOwn(result, 'audit_sha')
  ? { ...result, audit_sha: fixtureAuditPin(prompt) } : result

// A neutral merged fixture that names no gate_sha (#2485 D12) gated the tip it reports: gate_sha takes
// the reported integration_sha. The ES8 merge-commit fixtures name both shas and keep them distinct.
const completeMergeFixture = (opts, result) => {
  if (seatOf(opts) !== 'war-refiner' || !result || typeof result !== 'object' || !['merged', 'landed'].includes(result.status)) return result
  const field = result.status === 'landed' ? 'working_sha' : 'integration_sha'
  const filled = Object.hasOwn(result, field) ? result : { ...result, [field]: '2'.repeat(40) }
  return result.status === 'merged' && !Object.hasOwn(filled, 'gate_sha') ? { ...filled, gate_sha: filled.integration_sha } : filled
}

async function runPhase(args, agentImpl, seats = {}, source = src) {
  const calls = []
  const logs = []
  const fn = build(source)
  // world.ace: branch → the last ace-family worker result on it (reset BEFORE each such dispatch, so
  // a death leaves no stale entry). Keyed by branch because sibling tasks ace concurrently.
  // world.merge: base merge label → the (completed) merge-task reply. A segmentedMerge continuation
  // ('<label>:segment-N') replaces its first segment's error reply, so the neutral merge-confirm proof's
  // second parent is the gated tip the completed reply reported (an honest refiner's merge commit, #2485 D12).
  const world = { ace: new Map(), merge: new Map() }
  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts })
    if (NEW_SEAT_KINDS.includes(opts.dispatchKind)) return answerNewSeat(seats, prompt, opts, world)
    const aceWorker = seatOf(opts) === 'war-worker' && /^(ace|terminal):/.test(opts.label || '')
    if (aceWorker) world.ace.delete(branchOfPrompt(prompt))
    let result = await agentImpl(prompt, opts)
    if (aceWorker) world.ace.set(branchOfPrompt(prompt), result)
    if (!seats.rawMergeResults) result = completeMergeFixture(opts, result)
    if (seatOf(opts) === 'war-refiner' && result && typeof result === 'object' && result.mode === 'merge-task') world.merge.set(String(opts.label).replace(/:segment-\d+$/, ''), result)
    return seats.rawTaskAuditPins ? result : completeAuditFixture(prompt, opts, result)
  }
  const log = (m) => logs.push(m)
  const out = await fn(agent, fakeParallel, async () => [], log, () => {}, args, { total: null })
  // The Workflow API rejects top-level combinators before the agent can run (#2299).
  // Check outside the engine catch so failure-path fixtures cannot swallow incompatibility.
  for (const { opts } of calls) for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
    assert.ok(!Object.hasOwn(opts.schema || {}, keyword), `${opts.label}: unsupported top-level ${keyword}`)
  }
  return { out, calls, logs }
}

const seatOf = (opts) => (opts.agentType || '').split(':').pop()
const defaultImpl = (prompt, opts) => {
  if (opts.dispatchKind === 'pin-confirm' || opts.dispatchKind === 'pin-snapshot' || opts.dispatchKind === 'target-reconcile' || opts.dispatchKind === 'merge-confirm' || opts.dispatchKind === 'merge-snapshot' || opts.dispatchKind === 'merge-reconcile' || opts.dispatchKind === 'audit-pin' || opts.dispatchKind === 'tip-probe' || opts.dispatchKind === 'ace-revert') return answerNewSeat({}, prompt, opts)
  const seat = seatOf(opts)
  // Provision dispatches now return the ENV_OUTCOME shape: the git-topology barrier
  // (dispatchKind 'provision-barrier') AND the per-task provision-run (dispatchKind 'provision-run')
  // are both phase 'Provision', and the phase-close polish worktree (dispatchKind 'polish-worktree')
  // is phase 'Refine'. Default all three to { ok: true } so happy-path tests reach the worker / run the
  // sweep. Key on opts.dispatchKind — the stable discriminator, NOT a label-prefix regex (spec criterion 8).
  // (Tested BEFORE the generic refiner branch below.)
  if (seat === 'war-refiner' && (opts.dispatchKind === 'provision-barrier' || opts.dispatchKind === 'provision-run')) return { ok: true }
  if (seat === 'war-refiner' && opts.dispatchKind === 'polish-worktree') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
  // Every SEAT_AGENT_TYPES member answers as an auditor: an evidence seat dispatched under its own
  // agentType (End state 11) gets a verdict here, not {}.
  if (SEAT_AGENT_TYPES.includes(seat)) return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed', working_sha: '2'.repeat(40) }
      : { mode: 'merge-task', status: 'merged', integration_sha: '2'.repeat(40) }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// Two-task phase. branch/worktree are intentionally LEFT OFF the task objects: the template must
// derive them from planSlug + runId + worktreeRoot (assertion 4). integrationBranch is supplied by
// the Lead (plan-namespaced) and stays the single audit/merge target.
const PROVISION_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a' },
  plan: { file: 'docs/plans/wtprov-A.md', gate: 'make gate' },
  planSlug: 'wtprov-a',
  runId: 'run-2026',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  runDir: '/abs/repo/.claude/teams/run-2026',
  ownedFile: '/abs/repo/.claude/teams/run-2026/owned-refs',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
  ],
  learningsTarget: '/abs/learnings',
  memoryLocalRoot: '/abs/memory-local',
  ...over,
})

const idx = (calls, pred) => calls.findIndex(pred)
// isProvision keys on the stable dispatchKind discriminator (the phase git-topology BARRIER),
// never a label-prefix regex (spec criterion 8).
const isProvision = (c) => c.opts.dispatchKind === 'provision-barrier'
const isWorker = (c) => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Work'
const isFixWorker = (c) => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit'
const isAuditor = (c) => seatOf(c.opts) === 'war-auditor'
const isServitor = (c) => seatOf(c.opts) === 'war-servitor'

// --- Part B: per-task run.provision execution in the refiner barrier ------------------------
// A pinned run.provision list runs, IN ORDER, inside each task worktree AFTER the worktree exists
// and BEFORE the worker is spawned. On the first failing step the barrier emits an `env-blocked`
// task outcome ({ taskId, failedCommand, exitCode, stderrTail, provisionSource } — schemas.md) and
// the worker is NOT spawned and the worktree is KEPT. On success the worker runs as normal. The
// per-task provision step is a refiner seat in phase 'Provision' carrying dispatchKind 'provision-run'.
// Keys on the stable dispatchKind discriminator, never a label-prefix regex (spec criterion 8).
const isProvisionRun = (c) => c.opts.dispatchKind === 'provision-run'
const PROVISION_LIST = ['pnpm install --frozen-lockfile', 'git submodule update --init --recursive']
const withProvision = (over = {}) =>
  PROVISION_ARGS({ run: { provision: PROVISION_LIST, provisionSource: 'ci' }, ...over })

// ---------------------------------------------------------------------------
// Task 5: _refinery worktree wiring — barrier, merge-task, land, resync
// ---------------------------------------------------------------------------

// Helper: find the provision-topology (non provision-run) refiner seat.
const isProvisionTopology = (c) =>
  c.opts.phase === 'Provision' && seatOf(c.opts) === 'war-refiner' &&
  !/^provision-run:/.test(c.opts.label || '')
// A merge-task dispatch is a Refine-phase refiner seat that is NOT one of the phase's other
// Refine-phase refiner dispatches: the land-barrier endstate-check, the post-merge evidence seat, the
// phase-close polish worktree, the #1913 pin-transfer probe (which rebases and measures patch-ids
// but never merges), and the terminal-pass forward-revert (a Refine-phase refiner dispatch that
// reverts a regressed terminal commit but never merges). Keyed on dispatchKind, the stable
// discriminator, never a label-prefix regex.
// #1937: the exclusion list is a completeness claim, so the census test below derives the real set
// from the template source and fails when a new Refine-phase refiner dispatch is added without it.
const MERGE_TASK_EXCLUDES = ['pin-transfer', 'polish-worktree', 'evidence', 'endstate-check', 'terminal-revert', 'pin-confirm', 'pin-snapshot', 'target-reconcile', 'merge-confirm', 'merge-snapshot', 'merge-reconcile']
const isMergeTask = (c) =>
  seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Refine' &&
  !MERGE_TASK_EXCLUDES.includes(c.opts.dispatchKind)
const isPinTransfer = (c) => c.opts.dispatchKind === 'pin-transfer'
const isAceGate = (c) => c.opts.dispatchKind === 'ace-gate'
const isLand = (c) =>
  seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Land'

// ---------------------------------------------------------------------------
// Task 2 (Phase 2 — F11): Coven quorum integrity — retry dropped seats, never approve a shrunk panel
// ---------------------------------------------------------------------------

// Per-label call-sequence harness helper.
// Build an agentImpl that dispatches call-sequence overrides keyed by label, falling back to a base impl.
// seqMap: { '<label>': [result0, result1, ...] } — each call to that label pops the first entry.
// The call-sequence entries can be null (simulating a dropped seat) or a verdict object.
function buildSeqImpl(seqMap, fallback) {
  const queues = {}
  for (const [label, seq] of Object.entries(seqMap)) {
    queues[label] = [...seq]
  }
  return (prompt, opts) => {
    const label = opts.label || ''
    if (Object.prototype.hasOwnProperty.call(queues, label) && queues[label].length > 0) {
      return queues[label].shift()
    }
    return fallback(prompt, opts)
  }
}

// Single-task args for audit tests (no deps, three-seat roster pins the panel size).
const AUDIT_ARGS = (over = {}) => ({
  ...PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness' }, { lens: 'cascading-impact' }, { lens: 'plan-faithfulness' }] },
  ] }),
  ...over,
})

// A 3-seat roster so all 3 lenses convene; autoEscalate off (a multi-seat roster never widens anyway).
const COVEN_ARGS = (over = {}) => AUDIT_ARGS({
  ...over,
  tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness' }, { lens: 'cascading-impact' }, { lens: 'plan-faithfulness' }] },
  ],
  audit: { autoEscalate: false },
})

// ---------------------------------------------------------------------------
// Task 3 (Phase 3 — F02): Scheduler succeeded-gate
// A failed predecessor must block its true dependents; only a merged task succeeds.
// ---------------------------------------------------------------------------

// 3-task DAG: t2 depends on t1, t3 is independent.
// This is the canonical harness for Task 3 behavioral tests.
const DAG_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/aschi/phase-3', workingBranch: 'dev/aschi' },
  plan: { file: 'docs/plans/aschi.md', gate: 'make gate' },
  planSlug: 'aschi',
  runId: 'run-dag',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 't1', issue: 201, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 202, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
    { id: 't3', issue: 203, title: 'Task three', planSlice: 'slice 3', roster: [{ lens: 'correctness' }] },
  ],
  learningsTarget: null,
  ...over,
})

// Base impl for DAG tests: provision always ok, t1 defaults to escalate (worker returns blocked),
// t2/t3 default to implemented+approve+merged. The caller can override specific pieces.
const dagBaseImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') {
    // Force t1 to escalate (worker returns blocked)
    if (/task t1\b/i.test(prompt) || (opts.label || '').includes(':t1')) {
      return { task_id: 't1', status: 'blocked', blocked_reason: 'forced escalation for test' }
    }
    return { task_id: 'tx', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 3, integration: 1 } }
  }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed', working_sha: '2'.repeat(40) }
      : { mode: 'merge-task', status: 'merged', integration_sha: '2'.repeat(40) }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// ---------------------------------------------------------------------------
// Task 5 (Phase 3 — F05): servitor memory-admission checklist
// The Wrap-up prompt and war-servitor.md must instruct four disciplines:
//   D1 — DEDUP BEFORE WRITE: Glob memory dir + read MEMORY.md + read candidates → update existing covering file
//   D2 — TIER PRECEDENCE: a higher tier supersedes a lower; a user-confirmed fact outranks any agent write
//   D3 — VERIFY-ON-WRITE: verify the referent is still present before acting (facts naming a file/flag/line)
//   D4 — INDEX HYGIENE: update MEMORY.md row in place; [[slug]] cross-links
// ---------------------------------------------------------------------------

const servitorMd = readFileSync(join(here, '../../../agents/war-servitor.md'), 'utf8')

// ---------------------------------------------------------------------------
// Task 2 (#193): gate-audit seat pinned to _refinery integration tip + stale-tip SOFT-downgrade
// PROVISION_ARGS supplies worktreeRoot:'/abs/repo/.claude/worktrees' + runId:'run-2026'
// so the reconstructed _refinery path is '/abs/repo/.claude/worktrees/run-2026/_refinery'.
// ---------------------------------------------------------------------------

const gateAuditImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
  if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label?.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'abcd1234' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

const gateAuditCalls = (calls) => calls.filter(c =>
  seatOf(c.opts) === 'war-auditor' &&
  (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
)

// ---------------------------------------------------------------------------
// Task 1 (Phase 1 — #193): gate-HEAD sha (integration_sha) provenance
// Thread integration_sha from MergeResult through the post-merge gate-audit
// capture into the prompt and auditLog so the seat/Lead can confirm the gate
// ran at the integration tip.
// ---------------------------------------------------------------------------

const makeGateAuditImpl = (mergeOver = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
  if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label || 'correctness', verdict: 'approve', findings: [], confidence: 'high', tests_verified: { exist: true } }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', ...mergeOver }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// ---------------------------------------------------------------------------
// M2 — no-test REFINE sub-loop + HARD_ESCALATION_REASONS += no-test
// ---------------------------------------------------------------------------

// Single-task args for no-test tests (requiresTest:true by default)
const NO_TEST_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: true }],
  ...over,
})

// Helper: isAddTestWorker — fix-worker dispatched by the no-test sub-loop
const isAddTestWorker = (c) => seatOf(c.opts) === 'war-worker' && /add-test:/.test(c.opts.label || '')

// ---------------------------------------------------------------------------
// Phase 2 Task 1 (#574/#596) — thread the per-phase-resolved overrides.testPattern →
// assert-test-in-diff.sh --pattern at every dispatched merge-task floor invocation site (the site set
// grows under stacking — the #1046 drift-guard below DISCOVERS it; no count is asserted in prose)
// + Provision-prompt base-derivation prose + war-refiner.md mirror.
// Validation 2 (byte-identical when null) + the --pattern half of validation 6 (drift guard).
// ---------------------------------------------------------------------------

// Drive the no-test → add-test fix → re-audit(approve) → re-merge flow so BOTH the initial merge-task
// prompt AND the floor-retry re-merge prompt are dispatched (first Refine call = no-test, second = merged).
// firstMerge (optional) overrides the FIRST Refine result — the no-test MergeResult the floor-retry
// sub-loop consumes — so a test can ride extra advisory fields (e.g. floor_diagnostic) on it. Omitted ⇒
// today's bare { mode:'merge-task', status:'no-test' }, so every pre-existing caller is unchanged.
async function runNoTestLoop(over, firstMerge) {
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc0000', tests: {} }
    if (seat === 'war-worker' && opts.phase === 'Audit') return { task_id: 't1', status: 'implemented', head_sha: 'abc2000', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      return mergeCallCount === 1 ? (firstMerge || { mode: 'merge-task', status: 'no-test' }) : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  return runPhase(NO_TEST_ARGS(over), impl)
}
// The two merge-task prompts are disambiguated by label: the initial merge is `merge:t1`, the floor-retry
// re-merge is `merge:t1:floor-retry:r<n>` — the only Refine-phase 'floor-retry' seat in this flow.
const mergePromptsOf = (calls) => {
  const merges = calls.filter(isMergeTask)
  return {
    initial: merges.find(c => !/floor-retry/.test(c.opts.label || '')),
    floorRetry: merges.find(c => /floor-retry/.test(c.opts.label || '')),
  }
}

// ---------------------------------------------------------------------------
// #1046 — MERGE_RESULT.floor_diagnostic: the test floor's verbatim exit-1 stderr (the near-miss
// diagnostic), captured at every dispatched floor site, interpolated into the ADD_TEST fix prompt and
// the no-test exhaustion detail. Fail-open advisory — never routed on, no status enum change.
// ---------------------------------------------------------------------------

// The requiresTest-TRUE arm of each dispatched assert-test-in-diff.sh site, DISCOVERED from the template
// source: the invocation head (script + both ref interpolations + ${testPatternArg}) through to the
// ENCLOSING `pt` template literal's OWN CLOSING BACKTICK — a negated-backtick capture class, so a match
// can never cross into a neighbouring template and swallow it (#1050: the retired terminator anchored on
// the requiresTest:false skip arm's line shape instead of the invocation's own grammar, so a 5th site
// written inline was swallowed into its neighbour). The skip arms and the prose mentions (the ADD_TEST
// description, the polish-merge skip) stay excluded BY CONSTRUCTION — they carry no ${testPatternArg}.
//
// Paired below with a source-derived count cross-check (discovered === raw invocation heads). THREE
// residuals, all on the record for the next editor:
//   1. Inline-backtick truncation — FAIL-CLOSED. A future floor arm embedding an inline backtick BEFORE
//      its capture tokens truncates that site's capture and reds the per-site arms: a loud false red
//      forcing a deliberate re-anchor, never a silent pass.
//   2. Head-shape divergence — ACCEPTED silent escape. A site whose invocation head diverges from the
//      canonical `${ph.integrationBranch} ${r.task.branch}${testPatternArg}` interpolation escapes BOTH
//      sides of the equality, so the equality holds. Mitigation: that head IS the invocation grammar
//      every dispatched site copies (all sites at this base are byte-identical heads).
//   3. Mid-file unenclosed head — the regex has NO notion of enclosure: it scans from the head to the
//      NEXT backtick anywhere in the source, and 402 backticks follow the last floor site at this base.
//      An unenclosed head placed mid-file is therefore spuriously DISCOVERED with a junk capture, the
//      cross-check reads 5 === 5 and stays GREEN, and the red arrives from the per-site token arms
//      instead — a junk capture carries none of floor_diagnostic / stderr / verbatim. Fail-closed and
//      loud, never a silent pass, which is why the cross-check is a COMPANION to the per-site arms and
//      never a replacement for them. (Only past every remaining backtick — end of source — does the
//      equality itself red: discovered 4, raw 5.)
//
// Ratified-floor reconciliation: plan 3's End state 5 and the merge-land-resilience adjudication pin this
// guard as a `>= 3` non-vacuity floor plus per-site arms, "never harden it to an exact count". That floor
// is RETAINED below byte-unchanged, and the cross-check is not the prohibited hardening — both of its
// sides derive from the same `src` string, so a genuinely new dispatched site grows them together and no
// literal exists to rot.
const FLOOR_SITE_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}([^`]*)`/g
// The same invocation head with no capture and no terminator — the cross-check's raw side.
const FLOOR_HEAD_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}/g

// ---------------------------------------------------------------------------
// L3 T2 — blocked fix escalates early + initial-worker behavior preserved
// buildSeqImpl harness: fresh instance per test, label→results queue, .shift() per call.
// ---------------------------------------------------------------------------

// Single-task args for L3 tests (one lens, high roundLimit so early-break is observable)
const L3_ARGS = (over = {}) => PROVISION_ARGS({
  run: { roundLimit: 5 },
  tasks: [{ id: 't1', issue: 101, title: 'L3 task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})

// ---------------------------------------------------------------------------
// T4 #297 — Submodule support Increment 2: engine extensions
// buildSeqImpl harness: fresh instance per test (memory buildseqimpl-harness-for-multi-call-lens-tests).
// ---------------------------------------------------------------------------

// Args for a phase that has a submodule task and a gitlink-bump task.
// The submodule task has taskType:'submodule' and targetRepo (the submodule checkout path).
// The bump task has taskType:'gitlink-bump' and is declared (declared:true).
const SUBMOD_PHASE_ARGS = (over = {}) => ({
  phase: { id: 5, title: 'SubmodPhase', integrationBranch: 'integration/submod-test/phase-5', workingBranch: 'dev/submod-test' },
  plan: { file: 'docs/plans/submod-test.md', gate: 'node --test' },
  planSlug: 'submod-test',
  runId: 'run-submod-2026',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 'tsub', issue: 301, title: 'Submodule task', planSlice: 'submod slice',
      roster: [{ lens: 'correctness' }], taskType: 'submodule',
      targetRepo: '/abs/submodule-checkout', targetBase: 'main' },
    { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
      roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true, deps: ['tsub'] },
  ],
  learningsTarget: null,
  ...over,
})

// ---------------------------------------------------------------------------
// Task 3 (Phase 2 — ace-nit-autofix): the pre-merge --ace sub-loop
// STRICT TDD, CONTROL-FLOW-CRITICAL. One buildSeqImpl-driven case per criterion.
// The ace sub-loop sits at the TOP of the `if (r.verdict === 'approve')` branch, BEFORE the merge
// dispatch: the BATCH ace worker commits one fix, a fresh auditRound re-audits at the new sha (the
// happy path is byte-identical to the single-attempt era), and a re-audit regression enters the
// bounded aceBisect ladder (its own test section below) — never an escalation. `aced` is a return
// ATTRIBUTE — NO new MERGE_RESULT.status / HARD_ESCALATION_REASONS member (D6).
// ---------------------------------------------------------------------------

const isAce = (c) => seatOf(c.opts) === 'war-worker' && /^ace:/.test(c.opts.label || '')
// #2485 D17: the in-loop forward-revert is a refiner range revert dispatch (dispatchKind 'ace-revert')
// run BEFORE the next subset or re-entry worker. revertBetween: does one sit between calls a and b?
const isAceRevert = (c) => c.opts.dispatchKind === 'ace-revert'
const revertBetween = (calls, a, b) => calls.slice(calls.indexOf(a) + 1, calls.indexOf(b)).some(isAceRevert)
// The merge-slot range revert clause naming the pre-revert tip `tip` (the #2485 range spelling).
const mergeRangeRevert = tip => new RegExp('FORWARD-REVERT \\(--ace\\)[^\\n]*the pre-revert tip ' + tip + '\\)[^\\n]*-c core\\.hooksPath=/dev/null revert --no-commit [0-9a-f]{7,40}\\.\\.HEAD')
// #2485 D17 token contract: every revert site renders the one range revert script after "run exactly:".
// The tokens are extracted from the script itself (the source), and the consumer prose around it must
// name each one — a token the prose omits is an arm the refiner has no return mapping for.
const rangeRevertScriptOf = prompt => (String(prompt).match(/run exactly:\s*`([^`]+)`/) || [])[1]
const RANGE_REVERT_TOKENS = ['INDEX-DIRTY', 'NOT-DESCENDANT', 'RANGE-CLEAN', 'RANGE-REVERTED', 'TREE-MISMATCH']
const assertRangeRevertTokensMapped = (prompt, site) => {
  const script = rangeRevertScriptOf(prompt); assert.ok(script, site + ': the prompt carries the range revert script')
  const tokens = [...new Set([...script.matchAll(/echo ([A-Z-]+)/g)].map(m => m[1]))].sort()
  assert.deepEqual(tokens, RANGE_REVERT_TOKENS, site + ': the script prints exactly the named tokens')
  const prose = String(prompt).replace(script, '')
  for (const t of tokens) assert.ok(prose.includes(t), site + ': the consumer prose maps ' + t)
}
// A single-task phase (no deps) so the ace sub-loop path is the only thing under test.
const ACE_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  run: { ace: true },
  ...over,
})
// A Minor/Nit finding shape the auditor emits. autoFixable + file drive aceEligible.
const nit = (over = {}) => ({ severity: 'Nit', title: 'tidy import', file: 'skills/war/assets/x.js',
  rationale: 'unused import', autoFixable: true, ...over })
// Auditor verdict carrying the given findings (default: one auto-fixable nit).
const approveWith = (label, findings) => ({ seat: label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' })
// Base impl for ace tests: provision ok, worker implemented, refiner merged/landed, servitor a result.
// The AUDITOR is intentionally NOT defaulted here — each test drives it via buildSeqImpl per label so
// the first (work-wave) round and the second (ace re-audit) round can differ.
const aceBase = (findingsFirstRound = [nit()]) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-auditor') return approveWith(opts.label, findingsFirstRound)
  if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// ---------------------------------------------------------------------------
// Ace RE-ENTRY (in-run-finding-resolution Task 1.1, D1/D2/#1731): the ladder RE-OPENS for fresh
// absorbs born at a re-audit — budget-bounded (absorbRounds < run.absorbRounds, the absorb budget
// is the SOLE bound — in-band-absorb-default D5), same machinery (Ace-Subset trailer +
// tip-preflight idempotency, PIN-15), forward-revert posture preserved (a reverted finding never re-enters).
// ---------------------------------------------------------------------------

// Drives: round-1 absorb → batch ace → re-audit approves WITH a fresh absorb → ONE re-entry batch
// → its re-audit approves clean. (Also reused by the D6 gate-command sweep and Done-when sites.)
const reentryImpl = () => buildSeqImpl(
  { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'first', file: 'skills/first.js' })]),
                             approveWith('audit:t1:correctness', [nit({ title: 'second', file: 'skills/second.js' })]),
                             approveWith('audit:t1:correctness', [])] },
  aceBase([nit({ title: 'first', file: 'skills/first.js' })]))

// ---------------------------------------------------------------------------
// Ace bisection (realized-absorb-rate Task 1.1, D1–D4/D6): the regression-recovery
// ladder on a failed --ace batch. Culprit-first excision → blind halving only on
// ambiguous attribution → serial subsets at the tip, depth cap 2, same-file findings
// never split; batch = 1 absorbRounds slot, +1 per subset commit (fixRounds is never charged,
// D5), reverts uncharged, a spent absorb budget routes the still-queued remainder to the
// phase-close sweep by design; the loop owns in-loop forward-reverts
// and only a FINAL failed tip rides the merge dispatch's revert clause.
// ---------------------------------------------------------------------------

const bWorker = (sha) => ({ task_id: 't1', status: 'implemented', head_sha: sha, tests: { unit: 1 } })
// A regressing re-audit verdict whose Major names the given file (culprit attribution input).
const bRegress = (file) => ({ seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
  confidence: 'high', findings: [{ severity: 'Major', title: 'regressed', file, rationale: 'broke' }] })
const bApprove = (findings = []) => approveWith('audit:t1:correctness', findings)

// ---------------------------------------------------------------------------
// Variable audit roster (#434): per-task roster dispatch, per-seat depth,
// lone-seat auto-escalation widening (D4 auditor-nominated-or-default; D5 union), phase-start
// assertion (D8), and the gate-audit auto-skip on requiresTest:false (D7).
// ---------------------------------------------------------------------------

const ROSTER_TRIO = [
  { lens: 'correctness', depth: 'deep' },
  { lens: 'cascading-impact', depth: 'deep' },
  { lens: 'plan-faithfulness', depth: 'deep' },
]
const isRegularAudit = (c) => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:')

// ---------------------------------------------------------------------------
// Clean handoff (#441, ADR 0012/0013): disposition routing, phase-close sweep,
// dep-wave visibility, intent threading, end-state check, handoff block.
// ---------------------------------------------------------------------------

const workerMd = readFileSync(join(here, '../../../agents/war-worker.md'), 'utf8')
// A bare finding with NO autoFixable and NO disposition (severity default applies).
const bare = (over = {}) => ({ severity: 'Nit', title: 'bare', file: 'skills/war/assets/b.js', rationale: 'r', ...over })

// ---------------------------------------------------------------------------
// The ask channel (#1550, ADR 0013 amendment 2026-08-25 — End states 1+2):
// disposition:'ask' parks on asks[] at every dispositionOf site (ask arm preceding the absorb
// chain, default-deny order-census), demote() refuses an ask loudly, unruled asks are excluded
// from consolidation/filing, and the handoff carries the ninth (lossy) asks key.
// ---------------------------------------------------------------------------

// A well-formed ask finding (the schema-mandatory question+fork field present).
const askFinding = (over = {}) => ({ severity: 'Minor', title: 'mirror or point', file: 'docs/x.md',
  rationale: 'a policy call only the operator can make', disposition: 'ask',
  ask: { question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source'] }, ...over })

// The shared mid-sentence fragments are byte-identical across the two surfaces; only the heading
// case differs (CALIBRATION RULE / Calibration rule). Anchor on the shared body so the test is
// case-tolerant per the prompt-only-clause-grep lesson. Each assertion fails if EITHER surface
// drops the sentence.
const CALIBRATION_SHARED = 'judge on evidence only — never soften, downgrade, or drop a finding because peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in the current diff. The pull to soften peaks right after your own finding is challenged — that is the highest-risk moment.'
// #811 QUOTE-LINT ANCHOR: COST_CLAIM_SHARED is a quote-bearing byte literal COUPLED across THREE surfaces —
// (1) the COST-CLAIM RULE literal in auditPrompt() / workflow-template.js, (2) agents/war-auditor.md's
// Cost-claim rule line, (3) this test's own copy below. The presence tests below byte-compare all three, so
// any quote-style lint (straight↔curly, escaping) MUST run identically across ALL THREE in ONE commit or it
// silently breaks the byte-identity guard here (shared-string-constant-quote-literal lesson; a JS pointer
// comment mirrors this at the workflow-template.js literal; CALIBRATION_RULE_ANCHORS precedent).
const COST_CLAIM_SHARED = 'a finding justified by a cost — "too slow", "too expensive", "too complex" — must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost claim caps the finding at Minor.'

// Task 1.4 — Stale-looking-but-correct calibration (spec criterion 4/5, ADR 0030): the four rule
// bodies live in agents/war-auditor.md AND are mirrored into auditPrompt(). Anchor on ONE
// casing/position-stable MID-SENTENCE phrase per rule (never a quote/backtick-bearing byte literal —
// shared-string-constant-quote-literal-byte-anchor-fragility) and assert it on BOTH surfaces, so the
// test fails if EITHER surface drops a rule. Plus a floor-lock: each rule retains its
// "only when the live artifact confirms" qualifier (guards the amnesty floor against silent widening).
const CALIBRATION_RULE_ANCHORS = [
  /diverging from the candidate on a line range/i,          // rule 1 — literal-vs-candidate drift
  /a reference dangling at a task tip/i,                     // rule 2 — dangling cross-slice ref
  /naming a file the diff never touches/i,                  // rule 3 — untouched plan file-list entry
  /a grep sweep is a floor, not a ceiling/i,                // rule 4 — grep-sweep floor
]

// Per-rule qualifier lock (spec §4.A, #693). Locate the four CALIBRATION_RULE_ANCHORS SEQUENTIALLY —
// anchor i searched from anchor i-1's match end — so a rule REORDER surfaces as a distinct
// 'anchor-missing' status (the out-of-order anchor is not found searching forward), never as a
// mis-sliced window misread as qualifier drift. Window i = [anchor i start, anchor i+1 start); window
// 4 runs to the first `\n#` heading after anchor 4, else end-of-text — so on the standing card window 4
// deliberately spans rule 5's qualifier-free line (it stops before `## Verdict`), and on the isolated
// dispatched line (no `\n#`) it stops at the clause end. Per rule the helper returns { status: 'ok' |
// 'qualifier-missing' | 'anchor-missing', anchor, start, end }; the [start,end) offsets feed the
// companion mutation test's window-scoped splice surgery. It never throws — anchor PRESENCE is the
// sibling anchor test's job; a missing anchor yields 'anchor-missing' (its message names the anchor).
//
// Ceiling (broadened from spec §8, naming the real ceiling): this guard is blind to any QUALIFIER-FREE
// rule insertion — rule 5 (the deliberately-unwired marker) already demonstrates that by design. A
// QUALIFIER-BEARING rule inserted BETWEEN two anchors would land in the preceding rule's window and
// could mask that rule's drop. Both are accepted ceilings; the tripwire for any anchored-rule change is
// the CALIBRATION_RULE_ANCHORS array and its sibling anchor test above.
const CALIBRATION_QUALIFIER = /only when the live artifact confirms/i
function qualifierPerRuleWindows(text) {
  const starts = []
  let from = 0
  for (const re of CALIBRATION_RULE_ANCHORS) {
    const m = text.slice(from).match(re)          // non-global anchors: .match on a slice is safe
    if (m) { starts.push(from + m.index); from += m.index + m[0].length }
    else { starts.push(-1) }                       // leave `from` so a later anchor can still match forward
  }
  return CALIBRATION_RULE_ANCHORS.map((re, i) => {
    if (starts[i] < 0) return { status: 'anchor-missing', anchor: String(re), start: -1, end: -1 }
    const start = starts[i]
    let end
    if (i < CALIBRATION_RULE_ANCHORS.length - 1 && starts[i + 1] >= 0) {
      end = starts[i + 1]
    } else {
      const h = text.indexOf('\n#', start)
      end = h >= 0 ? h : text.length
    }
    const status = CALIBRATION_QUALIFIER.test(text.slice(start, end)) ? 'ok' : 'qualifier-missing'
    return { status, anchor: String(re), start, end }
  })
}

// Dispatched surface = the SINGLE calibration line isolated from the captured auditor prompt: split on
// `\n`, take the one line matching anchor 1. Running the window helper on that line ALONE puts window
// 4's end-of-text terminator exactly at the clause end, so no trailing prompt clause (CASCADING-IMPACT)
// or memory-prefetch text can ever feed window 4 (resolves the spec §3-vs-§4.A window-4 terminator
// ambiguity without any byte-literal anchor on the trailing clause).
function calibrationLine(prompt) {
  const line = prompt.split('\n').find((l) => CALIBRATION_RULE_ANCHORS[0].test(l))
  assert.ok(line, 'auditPrompt carries the calibration clause on a single line (isolation guard)')
  return line
}

async function capturedAuditPrompt() {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  return a.prompt
}

// --- args.memory prior-lessons threading (memory-sqlite-substrate T4, spec §4.5, criterion 10) ---
// The Lead prefetches per-seat lesson blocks and threads them as args.memory
// ({ byTask: {<id>: {worker, seats:{<lens>:block}}}, servitor }). The template concatenates a
// memoryClause at FIVE sites (worker, auditor, fix-worker, add-test, servitor) — following the
// intentClause pattern — and at NONE of ace/gate-audit/polish/refiner. Distinctive sentinels per
// site let each assertion target exactly the intended prompt.
const WORKER_MEM = 'PRIOR-LESSONS-WORKER-t1 [wm1] (code-verified): implementer pitfall block'
const AUDIT_MEM  = 'PRIOR-LESSONS-AUDITOR-t1-correctness [am1] (agent-unverified): lens lesson block'
const SERV_MEM   = 'PRIOR-LESSONS-SERVITOR [sm1] (code-verified): memory dedup capture block'
const MEMORY_MAP = { byTask: { t1: { worker: WORKER_MEM, seats: { correctness: AUDIT_MEM } } }, servitor: SERV_MEM }

// 2026-10-27-memory-query-mcp-tool D1 (PIN-1): the Bash self-query line is retired. Each seat prompt
// (worker, auditor, evidence auditor, servitor) carries ONE memory_query line naming the hook's
// MEMORY_TOOL literal with the threaded roots, emitted only when memoryLocalRoot is threaded.
// The literal is extracted from the hook (the canonical home, PIN-8), never restated here.
const MEMORY_TOOL_LITERAL = (() => {
  const hook = readFileSync(join(here, '../../../hooks/validate-evidence-auditor-mcp.sh'), 'utf8')
  const rows = hook.split('\n').map(l => /^MEMORY_TOOL='([^'$]+)'$/.exec(l)).filter(Boolean)
  assert.equal(rows.length, 1, 'the hook carries exactly one MEMORY_TOOL= line')
  return rows[0][1]
})()
const memoryQueryLineOf = (prompt) => String(prompt).split('\n').find(l => l.startsWith('MEMORY QUERY:'))
const isMemoryEvidenceSeat = c => seatOf(c.opts) === 'war-evidence-auditor'
const MQ_SEAT_TASKS = [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
  roster: [{ lens: 'correctness' }, { lens: EVIDENCE_LENS, agentType: 'war-evidence-auditor' }] }]

// --- Phase-close coherence sweep (criteria 2 + 5, ADR 0012) ---

// Sweep harness: run.ace on (absorb execution rides it) + a config default audit.roster (the
// sweep's mandatory full panel — Open decision 1). Single task t1 keeps the flow observable.
const SWEEP_ARGS = (over = {}) => ACE_ARGS({ audit: { roster: [{ lens: 'correctness' }] }, ...over })
// Base impl: the t1 work-round audit emits `queued`; gate-audit and the polish panel approve clean.
const sweepBase = (queued) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  // The phase-close polish worktree provisioning now returns the env-outcome shape.
  if (seat === 'war-refiner' && /^polish-worktree:/.test(opts.label || '')) return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented',
    head_sha: (opts.label || '').startsWith('polish:') ? 'b01a5a00' : 'deadbeef', tests: { unit: 1 } }
  if (SEAT_AGENT_TYPES.includes(seat)) {   // every seat type answers, the evidence seat included
    const label = opts.label || ''
    const f = label.includes(':t1:') && !label.startsWith('gate-audit:') ? queued : []
    return { seat: label, lens: 'correctness', verdict: 'approve', findings: f, confidence: 'high' }
  }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', working_sha: 'abcdef99' }
    : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const queuedAbsorb = () => nit({ title: 'dangling link', file: 'docs/x.md', disposition: 'absorb', phaseClose: true })

// --- End-state check (criterion 11) ---

const ES_CONDS = ['condition A: the wibble exists at the tip', 'condition B: later-phase thing']
const ES_ARGS = (over = {}) => PROVISION_ARGS({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ES_CONDS },
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
// Gate-audit seats return `findings`; everything else rides gateAuditImpl.
const esImpl = (findings) => (prompt, opts) => {
  if ((opts.label || '').startsWith('gate-audit:')) {
    const hard = findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
    return { seat: opts.label, lens: 'execution-evidence', verdict: hard ? 'request_changes' : 'approve', confidence: 'high', findings }
  }
  return gateAuditImpl(prompt, opts)
}

// ===========================================================================
// LAND-BARRIER ENDSTATE-CHECK & ARTIFACT-FIRST GATE-AUDIT (precision-chain Task 3.2 — D2/F5, D7, D8, A1)
// ---------------------------------------------------------------------------
// The widened phase.endState rows ({ condition, tag, check } — schemas.md; bare strings normalize to
// the judgment path, End state 9). check:-tagged rows are EXECUTED once per phase by the refiner's
// endstate-check dispatch at the integrated tip — after the serial merge queue's last merge, before any
// gate-audit seat spawns, UNCONDITIONALLY (the mergedTasksForGateAudit-empty arm included) — teeing one
// tip-SHA-stamped artifact per condition to _refinery/.war/endstate-<phaseId>-<n>.log. The gate-audit
// pass goes artifact-first: seats grep MergeResult.mappedTests against the captured gate log, read the
// per-condition artifacts, cross-check the worker-claimed End-state ids (A1), and return one
// endStateAttestations row per claimed condition; the handoff maps a condition with no attestation row
// from any seat to 'unverified', never 'met'.
const ES_CHECK_CMD = 'node --test skills/war/assets/wibble.acceptance.test.mjs'
const ES_ROWS = [
  { condition: 'condition A: the wibble suite is green', tag: 'check:', check: ES_CHECK_CMD },
  { condition: 'condition B: the gate covers the wobble', tag: 'gate:', check: null },
  'condition C: judged observable holds',   // legacy bare string mixed in — normalizes to the judgment path
]
const ES_ROW_ARGS = (over = {}) => PROVISION_ARGS({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ES_ROWS },
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
const isEndstateCheck = (c) => c.opts.dispatchKind === 'endstate-check'
const REFINERY = '/abs/repo/.claude/worktrees/run-2026/_refinery'

// Reordered fixture (absorb polish): the sole check:-tagged row is NOT first. The writer
// (endStateCheckRows: map-then-filter) and the reader (endStateBlock's row builder) derive the
// artifact number <n> from two INDEPENDENT expressions over the same full endStateRows list — here
// both must yield n=2. A renumbering refactor of either side (e.g. filter-then-map, which yields
// n=1 for the sole check row) reds the assertion pair below.
const ES_ROWS_CHECK_SECOND = [ES_ROWS[1], ES_ROWS[0], ES_ROWS[2]]   // [gate, check, bare]

// ===========================================================================
// QUOTING-AGNOSTIC .CMD TRANSPORT (endstate-artifact-fidelity Task 4.2 — A3, End state 6)
// ---------------------------------------------------------------------------
// The three mined shapes ride the dispatched prompt inside FENCED blocks the refiner copies
// byte-verbatim into the row's .cmd file — never re-quoted (the 'bad substitution' bug: a
// single-quoted ${...} plan literal re-emitted double-quoted dies in bash parameter expansion),
// never truncated at an inner backtick run (the fence length always exceeds the longest run inside
// the literal), and a multi-command check executes end-to-end with FULL stdout+stderr teed — plus
// the loud-failure contract: written .cmd bytes != the declared literal ⇒ a recorded
// cmd_bytes_mismatch contradiction on the artifact, never a silently "corrected" execution.
const ES_BT = '`'
// One check:-tagged row carrying the shape under test; the transport prompt is shape-driven, so each
// fixture threads its own literal through the same single-row phase.
const esTransportPrompt = async (check) => {
  const { calls } = await runPhase(ES_ROW_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
      endState: [{ condition: 'condition T: the transport shape survives', tag: 'check:', check }] },
  }), gateAuditImpl)
  const es = calls.find(isEndstateCheck)
  assert.ok(es, 'endstate-check dispatch present (presence guard)')
  return es.prompt
}
// The row builder's exact fenced rendering: fence line, literal bytes, fence line.
const esFenced = (fence, check) => `fenced below:\n${fence}\n${check}\n${fence}`

// Phase 10 Task 10.1 (D16, PIN-20, A6; #1781/#1782): the seat EXECUTES the .cmd file and attests, so
// the engine cannot test seat behavior — both fixtures are prompt-content asserts on the three
// surfaces (the runner's ENDSTATE-CHECK DISPATCH prompt, the seat-side END-STATE CHECK block, the
// auditor card), registry-bound by the two Task 10.1 rows below. Absence census at the task base
// (4cb505e): `cmd[i]` and `maximum` count 0 on the card and in the template; `intake_lint` counts 0
// on the card and appears in the template only in the runner prompt's record-only row and a source
// comment — never in the seat-side block. So a per-surface revert of either sentence reds its fixture.
// The seat-side prompt comes from the same claims-bearing single-row phase esTransportPrompt runs.
const esSeatPromptFor = async (check) => {
  const { calls } = await runPhase(ES_ROW_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
      endState: [{ condition: 'condition T: the transport shape survives', tag: 'check:', check }] },
  }), gateAuditImpl)
  const seat = gateAuditCalls(calls)[0]
  assert.ok(seat, 'gate-audit seat dispatch present (presence guard)')
  return seat.prompt
}

// Task 3.2's doc-claim row (Task 1.2's OLD-absent owner — the war-config.test.mjs schemas-guard
// pattern): schemas.md's handoff endState row was rewritten in place to the five-status set; the old
// four-status-only enumeration (unmet directly followed by deferred — no unverified) stays retired.
const OLD_FOUR_STATUS_ENUM = /"met"\s*\|\s*"unmet"\s*\|\s*"deferred"\s*\|\s*"out-of-scope"/i

// design.md (Task 3.2): the intent-threading + handoff bullet is artifact-first now; the old
// judgment-path description (the arrow-chain parenthetical) and the "Design notes: docs/specs/…"
// citation (spec-posterity rule, F7 / ADR 0046) are retired. Legacy docs/specs files keep the old
// wording as sanctioned posterity survivors — this guard scans the LIVE design.md only.
const RETIRED_JUDGMENT_PATH = /provably unmet\s*→\s*HARD;\s*unverifiable\s*→\s*SOFT/i

// --- Handoff block (criterion 6) ---

// Shared criterion-6 fixture impl: one landed task with a follow-up-routed Minor + a note Nit.
// filingResult drives the file-followups mock (keyed on the STABLE dispatchKind discriminator,
// never the label prefix — spec criterion 8): a { filed } shape stamps; null simulates a DEAD
// filing dispatch; the phase-'Land' fallback below answers it with a non-conforming MergeResult
// when no filingResult branch is given (the D18 fail-open path generic fixtures ride).
const handoffMinorF = { severity: 'Minor', title: 'needs new tests', rationale: 'thin wiring', file: 'x.js' }
const handoffImpl = (filingResult) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return filingResult
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve',
    findings: (opts.label || '').startsWith('gate-audit:') ? [] : [handoffMinorF, { severity: 'Nit', title: 'honest comment', rationale: 'covers invariant', file: 'y.js' }], confidence: 'high' }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', working_sha: 'abc1234def' }
    : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const HANDOFF_ARGS = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }] })

// ---------------------------------------------------------------------------
// Phase 5 Task 2 (#1785) — consolidation fixtures: collapse fidelity (End state 7),
// string seats (End state 8), :rebut lens carve-out (End state 21), requiresTest:false
// evidence sha (End state 22), and the ask channel's sha provenance + gate-audit-family
// routing + audit-sha validator (End state 23; #1691/#1692/#1693).
// ---------------------------------------------------------------------------

// Cross-task consolidation impl: t1 and t2 each raise ONE Minor on the same file, lines 100/105
// (in the ±10 window) — a CROSS-seat, CROSS-task collapse. Gate-audit seats stay finding-less.
const crossTaskImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-auditor') {
    if ((opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
    const f = (opts.label || '').startsWith('audit:t1')
      ? { severity: 'Minor', title: 'stale enum comment', rationale: 'lags the new arm', file: 'src/a.js', line: 100 }
      : { severity: 'Minor', title: 'comment misses the arm', rationale: 'same stale block', file: 'src/a.js', line: 105 }
    return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [f], confidence: 'high' }
  }
  if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups')
    return { filed: [{ n: 1, issue: 42 }], clusters: [{ ordinals: [1], issue: 42 }] }
  return handoffImpl(undefined)(prompt, opts)
}

// ---------------------------------------------------------------------------
// #990 — the LANDED-TIP ANCHOR is hoisted above the Wrap-up gate and THREADED into the servitor
// prompt. Same computation the handoff block used to own (the test above pins its semantics
// unchanged); these three pin the RENDERED value at each rung of its fallback chain:
// landed working_sha → lastLandedTip (the last task merge commit) → the named placeholder. The placeholder rung is the
// ADR 0034 proof: `pt` throws on undefined, so the null case must be pre-resolved BEFORE interpolation.
// ---------------------------------------------------------------------------
const TIP_PLACEHOLDER = /landed tip unrecorded — ground via the gate-audit auditSha entries in your audit-log input/
// One-task happy path with the land + merge results injected, so each rung is reachable.
const tipImpl = (land, merge) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && (opts.dispatchKind === 'provision-barrier' || opts.dispatchKind === 'provision-run')) return { ok: true }
  if (seat === 'war-refiner' && opts.dispatchKind === 'polish-worktree') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', ...land }
    : { mode: 'merge-task', status: 'merged', ...merge }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const servitorPromptAtTip = async (land, merge) => {
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }] })
  const { calls, out } = await runPhase(args, tipImpl(land, merge))
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed, so the Wrap-up gate opens')
  const p = (calls.find(isServitor) || {}).prompt
  assert.ok(p, 'presence guard: a servitor was dispatched')
  return { p, out }
}

// ---------------------------------------------------------------------------
// Container-packaging Task 2 (#527): packaging floor wiring + unpackaged enum +
// combined floor-retry sub-loop + polish skip + args.backstops pass-through.
// Spec §10.2–3. Each new assertion fails without its feature (delete-it-mentally).
// ---------------------------------------------------------------------------

// Single-task args, requiresPackaging left default (true) so the floor engages.
const PKG_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
const isPackageItWorker = (c) => seatOf(c.opts) === 'war-worker' && /package-it:/.test(c.opts.label || '')
// Explicit requiresPackaging:true — the ONLY shape that threads --advise-vacuous (#819). A defaulted
// (undefined) task runs the floor but withholds the advisory (advisePackagingVacuous === true only).
const PKG_TRUE_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresPackaging: true }],
  ...over,
})

// ---------------------------------------------------------------------------
// Phase 3 Task 1 (#598) — gate_failure_class: schema + classification procedure + class routing
// (both surfaces, same commit). Validation 5 (routing: three classes + absent fail-safe, each
// assertion fails if the classification branch is deleted) + validation 6 (drift guard + gate-audit
// debt line). The refiner is MOCKED, so the classification itself (base re-run/judgment) is exercised
// upstream; these tests pin the WORKFLOW routing that reads the returned gate_failure_class.
// ---------------------------------------------------------------------------
const schemasMd = readFileSync(join(here, '../references/schemas.md'), 'utf8')
const CLS_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3-cls', integrationBranch: 'integration/cls/phase-3', workingBranch: 'dev/cls' },
  plan: { file: 'docs/plans/cls.md', gate: 'make gate' },
  planSlug: 'cls', runId: 'run-cls', worktreeRoot: '/abs/repo/.claude/worktrees',
  runDir: '/abs/repo/.claude/teams/run-cls', ownedFile: '/abs/repo/.claude/teams/run-cls/owned-refs',
  mainCheckout: '/abs/repo',
  tasks: [{ id: 't1', issue: 301, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  learningsTarget: '/abs/learnings',
  // The servitor wrap-up gate keys on memoryLocalRoot (NOT learningsTarget) — a recovered-land test that
  // asserts the wrap-up dispatch fired needs it threaded, or the assertion reds on a correct implementation.
  memoryLocalRoot: '/abs/mem',
  ...over,
})
// A refiner impl parameterized by what the initial merge / land returns; the two bounded recovery
// re-dispatches (labels ending :baseline-proceed / :environment-proceed) return merged/landed by default
// so the phase can proceed. Pass mergeProceed/landProceed to drive the recovery dispatch's own result
// (the bound tests need a SECOND failure out of the environment-proceed re-run).
const clsImpl = ({ mergeResult, landResult, mergeProceed, landProceed } = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  const label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true } // barrier + provision-run: env-outcome
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc0000', tests: {} }
  if (seat === 'war-auditor') return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner' && opts.phase === 'Refine') {
    if (/:environment-proceed$/.test(label)) return mergeProceed ? mergeProceed(label) : { mode: 'merge-task', status: 'merged', integration_sha: 'beef1234beef' }
    if (/:baseline-proceed$/.test(label)) return { mode: 'merge-task', status: 'merged', integration_sha: 'beef1234beef' }
    return mergeResult ? mergeResult(label) : { mode: 'merge-task', status: 'merged' }
  }
  if (seat === 'war-refiner' && opts.phase === 'Land') {
    if (/:environment-proceed$/.test(label)) return landProceed ? landProceed(label) : { mode: 'land-phase', status: 'landed', working_sha: 'cafe5678cafe' }
    if (/:baseline-proceed$/.test(label)) return { mode: 'land-phase', status: 'landed', working_sha: 'cafe5678cafe' }
    return landResult ? landResult(label) : { mode: 'land-phase', status: 'landed' }
  }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
// The two environment-class first results that trigger the bounded environment-proceed dispatches.
const envMergeResult = () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky timeout at task tip; base green; not reproduced' })
const envLandResult = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky at land; base green; not reproduced' })

// ---------------------------------------------------------------------------
// #1032 (recovery-re-merge-dispatch-coherence Task 1.1) — the submodule scoping note rides EVERY
// merge-task dispatch for a taskType:'submodule' task, not just the initial merge: the floor-retry
// re-merge, the environment-proceed re-merge and the baseline-proceed re-merge each append the same
// in-scope submodMergeNote as their final prompt segment. An unscoped re-dispatch would rebase and
// gate in the SUPERPROJECT — the defect these pin.
//
// SIBLING tests by design (never an extension of the T4 #297 threading test, whose header enumeration
// of the four threaded prompts stays accurate untouched). Each drives ONE recovery route through the
// harness that already stubs it and reads the captured prompt BY DISPATCH LABEL — never a source
// occurrence count (a source-regex count proves shape, not what the engine actually dispatched).
// Load-bearing: remove one route's `+ submodMergeNote` and exactly that route's test REDs; the note
// is '' off the submodule path, so no existing non-submodule prompt test moves either way.
// ---------------------------------------------------------------------------
const SUBMOD_RETRY_REPO = '/abs/submodule-checkout'
// The T4 #297 fixture SHAPE (taskType + targetRepo + targetBase) carried on the task id both harnesses
// already stub (t1), so neither harness needs an edit. requiresTest:true mirrors the plan-pinned
// floor-retry fixture (in production the test floor is what returns no-test); inside this harness it
// shapes only the dispatched prompt's requiresTest ternary, never route reachability — the sub-loop is
// entered on ANY floor status (no-test, unpackaged, or done-unmet), and runNoTestLoop's first Refine
// call returns no-test unconditionally.
const submodRetryTask = (over = {}) => ({
  id: 't1', issue: 301, title: 'Submodule task', planSlice: 'submod slice',
  roster: [{ lens: 'correctness' }], taskType: 'submodule',
  targetRepo: SUBMOD_RETRY_REPO, targetBase: 'main', requiresTest: true, ...over,
})
// Marker asserted WITH its colon: the phase-level "SUBMODULE TASKS in this phase:" note (a different
// prompt) would satisfy a bare `SUBMODULE TASK` substring — the colon pins the per-task merge note.
const assertSubmodScoped = (call, where) => {
  assert.ok(call, `${where} must be dispatched for a submodule task whose first merge tripped this route`)
  assert.ok(call.prompt.includes('SUBMODULE TASK:'),
    `${where}: prompt must carry the SUBMODULE TASK marker — without it the refiner re-merges in the superproject`)
  assert.ok(call.prompt.includes(SUBMOD_RETRY_REPO),
    `${where}: prompt must name the task's targetRepo "${SUBMOD_RETRY_REPO}" so rebase+gate run cwd-scoped to the submodule checkout`)
}

// ---------------------------------------------------------------------------
// #1114 — submodule floor/note completion across the three remaining dispatch families (re-land, polish
// merge, floor-retry re-merge). SIBLINGS of the #1032 block above and bound by the same doctrine: each
// prompt test drives ONE route through the harness that already stubs it and reads the captured prompt BY
// DISPATCH LABEL (a source occurrence count proves shape, not what the engine dispatched); each routing
// test stubs the returned status and asserts the route the engine took.
// Load-bearing: delete an append/arm and exactly that route's test REDs — the notes are '' off the
// submodule path, so no existing non-submodule prompt test moves either way.
// ---------------------------------------------------------------------------

// The PHASE-level land note, asserted WITH its colon: the per-task merge note ("SUBMODULE TASK:") would
// satisfy a bare `SUBMODULE` substring — the colon + targetRepo pin the land note specifically.
const assertSubmodLandScoped = (call, where) => {
  assert.ok(call, `${where} must be dispatched for a submodule phase whose first land tripped this route`)
  assert.ok(call.prompt.includes('SUBMODULE PHASE:'),
    `${where}: prompt must carry the SUBMODULE PHASE marker — without it the phase is re-dispatched land-blind (no 2A CAS inside the submodule, no 2B PR-and-hold)`)
  assert.ok(call.prompt.includes(SUBMOD_RETRY_REPO),
    `${where}: prompt must name the phase's targetRepo "${SUBMOD_RETRY_REPO}" so the submodule land is scoped to the submodule checkout`)
}
const baselineLandFail = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' })

// t1.8 — hermetic-gate READER CONTRACT: a gate_failed bearing a recognized stderr precondition marker
// (REL_GUARD_PRECONDITION_FAILED) classifies 'environment', never 'introduced', carried uncurated in
// gate_output. Both-surfaces drift assert (token-anchored, case-tolerant): war-refiner.md AND the
// dispatched merge/land prompts (the classificationClause) must both carry the rule (spec §9 / criterion 9).
const markerEnvRe = /REL_GUARD_PRECONDITION_FAILED[\s\S]{0,320}environment|environment[\s\S]{0,320}REL_GUARD_PRECONDITION_FAILED/i

// ===========================================================================
// run-lifecycle robustness (#582/#583/#586) — entry validation, phase-scoped
// keying, provision evidence gate, barrier/polish env-outcome, both-surfaces.
// ===========================================================================

// A phase with one derivation-needing task but no explicit branch/worktree, parameterized by the
// top-level args under test. `runCounting` records how many agents were dispatched (zero-agents proof).
const NEEDS_DERIVATION_TASK = [{ id: 'tA', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] }]
async function runCounting(args) {
  let agentCalls = 0
  const fn = build()
  const agent = async () => { agentCalls++; return {} }
  const out = await fn(agent, fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  return { out, agentCalls }
}

// #740 — the UNCONDITIONAL phase-field entry class: ph.title / ph.workingBranch / ph.integrationBranch
// are interpolated fallback-free through the `pt` tag in the Provision-barrier / merge / land prompts
// REGARDLESS of whether tasks carry explicit paths, so a launch omitting any dies at ENTRY
// (held:workflow-error) — not opaquely deep inside prompt construction. The `(or supply explicit
// branch/worktree per task)` suffix is a LIE for this class (an explicit path cannot supply a missing
// ph.title) and must be ABSENT. EXPLICIT_TASK carries branch+worktree so the derivation class is silent.
const EXPLICIT_TASK = [{ id: 'tX', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }],
  branch: 'war/x/p1-tX', worktree: '/abs/repo/.claude/worktrees/run-x/p1-tX' }]

const SINGLE_PROV = (over = {}) => withProvision({ tasks: [{ id: 't1', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] }], ...over })

// ---------------------------------------------------------------------------
// Task 1.2 (#637) — reland-loop transient-vs-divergence discrimination, both surfaces.
// On the FINAL failed CAS attempt the land prompt runs `git rev-list --left-right --count
// <merge-sha>...origin/<working>` (the merge sha it tried to push vs. the freshly-fetched origin
// tip, NEVER the lagging local follower): a right count of 0 (contender-less transient) buys
// exactly ONE extra push-first attempt beyond roundLimit; a nonzero right count (real contender
// commits) is land_stale immediately. The discrimination is emitted in ALL THREE land prompts (in-flow,
// baseline-proceed re-land, environment-proceed re-land) via the shared relandDiscrimination helper, and
// grep-parallel with the standing copy in references/refiner-recovery.md (evicted from war-refiner.md
// §land-phase by Task 4.1; the card's land step 3 is a trigger pointer).
// The three plain-text anchors below appear VERBATIM in all four surfaces (mirror-drift guard, spec
// §8; memory: standing-instruction-vs-dispatched-prompt-coverage-split). They are markup-free in the
// .md source (no backtick/bold inside the span) so a raw-string includes() matches byte-for-byte.
// ---------------------------------------------------------------------------
const RELAND_DISC_CMD = 'git rev-list --left-right --count <merge-sha>...origin/'                     // A1: discrimination command core (working branch follows)
const RELAND_DISC_BUDGET = 'exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once' // A2: the explicit-+1 budget sentence
const RELAND_DISC_DIVERGE = 'nonzero right count'                                                     // A3: the real-divergence signal

// ---------------------------------------------------------------------------
// FILE-FOLLOWUPS PAIRED PINS (#1587) — the standing/dispatched coverage split made mechanical for
// this dispatch class, on the (h2) precedent of the refiner-recovery pair above.
// Two legs, pinned together so neither half can move alone:
//   (a) agents/war-refiner.md § File-followups dispatch keeps its ADR 0042 trigger pointer to
//       references/file-followups.md — plugin-root-anchored, count-pinned, never `../`-relative.
//       A dropped pointer orphans the destination; a presence-only assert would not see it.
//   (b) the DESTINATION BODY's procedure clauses appear VERBATIM in the dispatched file-followups
//       prompt built in workflow-template.js — preflight, dedup, cluster, and the return contract.
//       These are the decisive rules; per ADR 0047 adjudication O(1) the reference file is
//       best-effort enrichment, so the prompt is the carrier and the two must never drift.
// The five anchors below are markup-free plain-text byte-runs (no backtick or bold inside the span)
// so a raw includes() matches byte-for-byte on BOTH surfaces.
// ---------------------------------------------------------------------------
const FF_PREFLIGHT = 'exit 2 (tooling error) or exit 3 (account mismatch)'          // B1: the preflight abort condition
const FF_DEDUP_CMD = 'gh issue list --label war-followup --state open'              // B2: the dedup query
const FF_DEDUP_RULE = 'never a new issue'                                           // B3: dedup writes a corroboration comment
const FF_CLUSTER_KEY = 'by file + root cause'                                       // B4: the clustering key
const FF_RETURN = '{ filed: [{ n, issue }], clusters: [{ ordinals, issue }] }'      // B5: the return contract

// ---------------------------------------------------------------------------
// audit-gate-verdict-fidelity Task 1.3 — pin-equality gate (D2) + verdict-hard (D8)
// End-state criteria 3 (mismatch demotion) and 9 (finding-less escalate is HARD at both sites),
// plus the auditPrompt AUDIT-PIN-line presence/fail-open assert and the auditRound (work-wave)
// demotion enforcement. observedHead is absent in this phase (Task 2.1 stamps it), so the gate-audit
// seat's pin-equality expectation falls back to gateHeadSha — the live path until Phase 2 lands.
// ---------------------------------------------------------------------------

const ONE_TASK = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] }] })
// A gate-audit seat that returns a HARD (escalate + Critical) verdict pinned to `auditSha`; the refiner
// stamps a well-formed integration_sha '1111111111' so gateHeadSha is well-formed (pinMismatch can fire).
const gateAuditPinImpl = (auditSha) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5 } }
  if (seat === 'war-auditor') {
    if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
               findings: [{ severity: 'Critical', title: 'mapped test provably unrun', file: 'test/foo.test.js', rationale: 'absent at tip' }],
               confidence: 'high', audit_sha: auditSha }
    }
    return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: '1111111111' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// ===========================================================================
// Task 2.1 (#649) — evidence-pipeline wiring: post-merge evidence dispatch,
// artifact capture (D5), integrated-tip re-run + authoritative seat (D4),
// pin-status/guard token consumption (D1), release-baseline clause (D3),
// and the standing auditor/refiner duty mirrors (D6/D7).
// ===========================================================================

// Faithful evidence-dispatch mock: returns an EVIDENCE_RESULT for the evidence:phase-<id> dispatch
// (perTask tokens + integratedTipGate), CONFIRMED tips (observedHead == the merge integration_sha 'aaaa1111'
// so the seats' audit_sha matches the pin — no demotion, happy-path land). Merge returns a per-task
// gate_log_path AND integratedTipGate carries its own gate_log_path (#818) so both artifact-path threadings
// are observable.
const evidenceImpl = (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'aaaa1111', tests: { unit: 1 } }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return {
    perTask: [
      { taskId: 't1', pin_status: 'CONFIRMED', pin_evidence: 'tip == gate-HEAD', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
      { taskId: 't2', pin_status: 'BENIGN-ADVANCE', pin_evidence: 'intervening: docs/readme.md', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
    ],
    integratedTipGate: { gate_output: 'INTEGRATED TIP GATE: all suites passed', tip_sha: 'aaaa1111', gate_log_path: fixtureGatePath(prompt) },
  }
  if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: 'aaaa1111' }
  if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
  if (seat === 'war-refiner') {
    const m = /^merge:(t\d)/.exec(label)
    return { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'aaaa1111',
      gate_log_path: m ? fixtureGatePath(prompt) : undefined }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// #806 — the evidence-dispatch preMergeTip is the task's TRUE immediate predecessor tip in serial merge
// order (the stamped lastLandedTip), NOT the previous LIST entry's gateHeadSha (which over-counts across a
// requiresTest:false skip and can carry a sentinel). Reads the evItems lines the evidence dispatch renders.
const evPromptOf = (calls) => (calls.find(c => seatOf(c.opts) === 'war-refiner' && /^evidence:phase-/.test(c.opts.label || '')) || {}).prompt || ''
const evLineOf = (evPrompt, taskId) => evPrompt.split('\n').find(l => new RegExp(`- ${taskId} · gateHeadSha=`).test(l)) || ''
const preMergeTipOf = (evPrompt, taskId) => { const m = evLineOf(evPrompt, taskId).match(/ · preMergeTip=(.*?) · gateLogPath=/); return m ? m[1] : null }
const gateHeadShaOf = (evPrompt, taskId) => { const m = evLineOf(evPrompt, taskId).match(/gateHeadSha=(.*) · preMergeTip=/); return m ? m[1] : null }
// Three dep-free tasks (one wave, serial merge order t1→t2→t3). `shas` maps merge label → integration_sha
// (absent ⇒ omitted from the MergeResult, forcing the sentinel gateHeadSha). requiresTest:false lives on
// the TASK (set via THREE), not the refiner mock.
const skewImpl = (shas) => (prompt, o) => {
  const seat = seatOf(o), label = o.label || ''
  if (seat === 'war-refiner' && o.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return { perTask: [] }   // fail-open: no stamped tokens
  if (seat === 'war-refiner' && o.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
  if (seat === 'war-refiner') {
    const m = /^merge:(t\d)/.exec(label)
    const sha = m ? shas[m[1]] : undefined
    return { mode: 'merge-task', status: 'merged', gate_output: 'ok', ...(sha !== undefined ? { integration_sha: sha } : {}) }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}
const THREE = (noTest = new Set()) => PROVISION_ARGS({ tasks: [
  { id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
  { id: 't2', issue: 102, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }], ...(noTest.has('t2') ? { requiresTest: false } : {}) },
  { id: 't3', issue: 103, title: 'T3', planSlice: 's3', roster: [{ lens: 'correctness' }] },
] })

// ===========================================================================
// Task 1.2 (war-room-config-expansion) — tier-aware worker dispatch + task.files plumbing
// ---------------------------------------------------------------------------
// First-pass workers dispatch on the docs tier for an all-*.md task (task.files = the plan Files:
// list, NOT the worker's diff); fix-round and --ace (absent agents.worker.ace) dispatch on the fix tier when configured, else
// the base worker. End-to-end (captures the real spawn opts at each dispatch label) so the predicate
// AND the wiring are exercised together — a reverted tier arg fails these.
// ---------------------------------------------------------------------------

// Run a single-task happy-path phase and return the first-pass worker's captured spawn opts.
// files === undefined ⇒ NO files field on the task (the absent-list fail-safe case).
// Threads an EXPLICIT agents config with distinct base/docs models (opus/sonnet) so the tier
// predicate stays observable by model — the DEFAULTS tiers are both fable, which would make the
// docs-vs-base distinction vacuous here (the D2 registry row pins the defaults mirror itself).
const firstPassWorkOpts = async (files) => {
  const task = { id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }],
    ...(files !== undefined ? { files } : {}) }
  const agents = { worker: { model: 'opus', docs: { model: 'sonnet', effort: 'default' } } }
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [task], agents }), defaultImpl)
  return (calls.find(c => c.opts.label === 'work:t1') || {}).opts || {}
}

// Drive a Major → fix-round → approve+absorb-nit → --ace → clean re-audit flow so BOTH the fix-round
// worker (fix:t1:r1) and the --ace worker (ace:polish:t1:a1 — the absorb meter, not fixRounds) dispatch in one phase. Returns captured opts.
const runFixAndAce = async (agentsCfg) => {
  const blockingMajor = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes', confidence: 'high',
    findings: [{ severity: 'Major', title: 'fix me', suggested_fix: 'guard the missing value before reading it', file: 'a.js', rationale: 'because' }] }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [blockingMajor, approveWith('audit:t1:correctness', [nit()]), approveWith('audit:t1:correctness', [])] },
    aceBase([]))
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }],   // no files ⇒ base first-pass
    run: { ace: true },
    agents: agentsCfg,
  })
  const { calls } = await runPhase(args, impl)
  const optsOf = (label) => (calls.find(c => c.opts.label === label) || {}).opts || {}
  return { work: optsOf('work:t1'), fix: optsOf('fix:t1:r1'), ace: optsOf('ace:polish:t1:a1') }
}

// #817 — the add-test/package-it floor-retry dispatch is now tier-aware (spawnWorker('fix')), uniform with
// the fix:/ace: fix-follow-up classes. Drive a no-test → add-test fix → re-audit(approve) → re-merge(merged)
// chain and capture the add-test worker's spawn opts, with and without an agents.worker.fix override.
const runFloorRetry = async (agentsCfg) => {
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }                                                   // first attempt trips the floor
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }    // re-merge after the add-test fix
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }], agents: agentsCfg })
  const { calls } = await runPhase(args, impl)
  return (calls.find(c => /^add-test:t1/.test(c.opts.label || '')) || {}).opts || {}
}

// ===========================================================================
// D2 — MIRROR REGISTRY (drift-guards-for-mirrored-and-asserted-facts, ADR 0025)
// ---------------------------------------------------------------------------
// Every value/helper the Workflow sandbox mirrors inline in workflow-template.js (it cannot import) is
// bound here to its canonical export, one equality assertion per row. Const rows deepEqual/subset parsed
// literals; helper rows assert BEHAVIORAL equivalence on an enumerated fixture-input set — function
// mirrors legitimately differ in whitespace/comments, so behavior (not bytes) is what must not drift.
// The inline `spawn` is a CURRIED `role => …` closing over `agents` with a ROLE_MODEL fallback, so its
// canonical side adapts inputs to `spawnOpts(config, role)`.
// ponytail: this registry IS the deliberate ceiling — a new inline mirror lands its row here in the same
// task (the /war-strategy new-mirror authoring rule), never an AST scanner.

const parseInlineArray = (re) => {
  const m = src.match(re)
  assert.ok(m, `inline array literal not found for ${re}`)
  return JSON.parse(m[1].replace(/'/g, '"'))
}
// All distinct 'landed'/'held:*' string literals in the template's EXECUTABLE code (comments stripped so
// a prose example can't count). landDecision is assigned 6 of the 7 KNOWN values (never the Lead-only
// 'held:phase-incomplete'), with no single inline array to deepEqual — hence the subset check.
// Strip LINE comments ONLY (dropped the block pass, #929): the block-comment strip
// (/\/\*[\s\S]*?\*\//g) mis-reads the resolveGate discovery string's glob literals ('*/…/*' carry /*
// and */) as block-comment delimiters and cascades over the executable land-routing code — deleting
// the very 'held:*' literals scanned here (a 'held:bogus' assigned inside the deleted span would slip
// past the landDecision-known-set membership check with NO red test, #929). 'landed'/'held:*' literals
// live only in executable code, never a block comment, so line-only is sufficient. Parameterized over
// `text` (default: live src) so the End-state-7 subset probe below runs on a mutated copy.
// ponytail: whole-file literal scan is the ceiling; the string-aware scanTemplateLiterals census below
// is the sanctioned upgrade (it recognizes comments only OUTSIDE strings) — this extractor stays the
// narrow landDecision-membership check, bounded by the blockCommentSpans / scanTemplateLiterals censuses.
const extractLandDecisionLiterals = (text = src) => {
  const code = text.replace(/\/\/[^\n]*/g, '')
  return [...new Set([...code.matchAll(/'(landed|held:[a-z0-9-]+)'/g)].map(m => m[1]))]
}
// Eval the inline roster-helper mirror block (defined INSIDE the template fn body) in isolation, with an
// injected `agents` (the only free var the inline `spawn` closes over). Exposes the four inline helpers.
const inlineHelperBlock = (() => {
  const s = src.indexOf('const ROLE_MODEL =')
  const e = src.indexOf('const defaultRoster')
  return { ok: s !== -1 && e > s, block: s !== -1 && e > s ? src.slice(s, e) : '' }
})()
const inlineHelpers = (agents = {}) =>
  new Function('agents', inlineHelperBlock.block + '\nreturn { spawn, validateRoster, widenRoster, resolveWidenSource, WORKER_TIER_DEFAULTS, isDocsTask, resolveGate }')(agents)

const AGENTS_FIXTURES = [
  {},                                                                          // all omitted → ROLE_MODEL/DEFAULTS fallback
  { worker: { model: 'sonnet', effort: 'high' }, auditor: { model: 'fable', effort: 'default' },
    refiner: { model: 'opus' }, servitor: { model: 'haiku', effort: 'max' } }, // explicit mix
  { worker: { effort: 'low' } },                                               // effort only, model omitted
  { auditor: { model: 'sonnet', effort: 'default' } },                         // effort:'default' ⇒ omitted
]
const RTRIO = [
  { lens: 'correctness', depth: 'deep' },
  { lens: 'cascading-impact', depth: 'deep' },
  { lens: 'plan-faithfulness', depth: 'deep' },
]
// [roster, evidence] pairs — `evidence` is the run.evidence knob validateRoster takes beside the roster.
const EVIDENCE_SEAT = { lens: EVIDENCE_LENS, agentType: 'war-evidence-auditor' }
const PLAIN_SEATS = n => Array.from({ length: n }, (_, i) => ({ lens: `plain-${i}` }))
const VALIDATE_ROSTER_CASES = [
  [[{ lens: 'correctness' }], undefined],                                      // valid 1-seat
  [[{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }], undefined], // valid 2-seat
  [[], undefined],                                                             // too few
  [[{ lens: 'a' }, { lens: 'b' }, { lens: 'c' }, { lens: 'd' }, { lens: 'e' }, { lens: 'f' }], undefined], // too many (6)
  ['not-an-array', undefined],                                                 // non-array
  [[{ depth: 'deep' }], undefined],                                            // missing lens
  [[{ lens: 'x' }, { lens: 'x' }], undefined],                                 // duplicate lens
  [[{ lens: 'x', depth: 'sideways' }], undefined],                             // bad depth
  [[null], undefined],                                                         // null seat
  [[{ lens: '' }], undefined],                                                 // empty lens
  [[{ lens: 'correctness', agentType: 'war-auditor' }], undefined],            // valid plain agentType
  [[{ lens: 'correctness', agentType: 'bogus' }], true],                       // unknown agentType
  [[EVIDENCE_SEAT], true],                                                     // evidence seat, run.evidence on
  [[EVIDENCE_SEAT], false],                                                    // evidence seat, run.evidence off
  [[EVIDENCE_SEAT], undefined],                                                // evidence seat, knob absent
  [[...PLAIN_SEATS(4), EVIDENCE_SEAT], true],                                  // 4 + evidence = 5: valid
  [[...PLAIN_SEATS(5), EVIDENCE_SEAT], true],                                  // cap-4 beside an evidence seat
  [[{ lens: 'correctness', model: 'sonnet', effort: 'high' }], undefined],     // per-seat model + effort (#2519)
  [[{ lens: 'correctness', effort: 'default' }], undefined],                  // per-seat effort alone
  [[{ lens: 'correctness', model: 'gpt' }], undefined],                       // unknown seat model
  [[{ lens: 'correctness', model: 'opus', effort: 'turbo' }], undefined],     // unknown seat effort
]
const WIDEN_ROSTER_CASES = [
  [[{ lens: 'a' }], RTRIO],                                                     // union append
  [[{ lens: 'a' }, { lens: 'b' }, { lens: 'c' }, { lens: 'd' }, { lens: 'e' }], [{ lens: 'f' }]], // cap 5
  [[{ lens: 'correctness' }], RTRIO],                                          // dedup by lens
  [[{ lens: 'a' }], []],                                                       // empty default
  [[{ lens: 'a' }], undefined],                                                // undefined default
]
const RESOLVE_WIDEN_CASES = [
  [['security', 'cascading-impact'], RTRIO],                                   // valid nomination
  [['security', 'execution-evidence'], RTRIO],                                 // reserved lens → default
  [['security', EVIDENCE_LENS], RTRIO],                                        // artifact-evidence nomination (widen-barred) → default
  [['dup', 'dup'], RTRIO],                                                     // duplicate → default
  [[], RTRIO],                                                                 // empty → default
  ['nope', RTRIO],                                                             // non-array → default
  [null, RTRIO],                                                               // null → default
  [[''], RTRIO],                                                               // empty string → default
]
// resolveGate (ADR 0036) case set: null/empty (discovery-only), plain (composes), and a PRE-COMPOSED input
// built from the CANONICAL resolveGate output — so a partial detector-token move (inline copy only) makes the
// inline mirror recompose while canonical returns it unchanged, and the behavioral row diverges (idempotence).
const RESOLVE_GATE_CASES = [
  'node skills/war/assets/repo-gate.mjs',                // full repository gate → no duplicate shell pass
  null,                                                 // null → discovery clause alone
  '',                                                   // empty → discovery clause alone
  `node --test 'skills/**/*.test.mjs'`,                 // plain → composes declared && discovery
  resolveGate(`node --test 'skills/**/*.test.mjs'`),    // pre-composed FROM CANONICAL output → idempotent, unchanged
]

// (barrier-list) construct-scoped token extraction for the three prose surfaces: the distinct
// `barrier:<name>` tokens inside ONE bounded construct (a `windowOf()` window), so a token named
// elsewhere on the surface never leaks into the equality, and a dropped or misspelled member reds.
const eligibilityMd = readFileSync(join(here, '../references/disposition-eligibility.md'), 'utf8')
const barrierTokensIn = text => [...new Set((text || '').match(/barrier:[a-z-]+/g) || [])]
// windowOf: the text strictly between the first startTok and the next endTok after it ('' when either is absent).
const windowOf = (text, startTok, endTok) => {
  const a = text.indexOf(startTok); if (a === -1) return ''
  const b = text.indexOf(endTok, a + startTok.length); return b === -1 ? '' : text.slice(a + startTok.length, b)
}

// ===========================================================================
// #929 — block-comment census (protects the MIRROR_REGISTRY's extractLandDecisionLiterals + the two
// narrowed source-text sites above). The three sites strip LINE comments ONLY. blockCommentSpans
// DELIBERATELY reproduces the naive two-step idiom's SUBJECT — the spans a block strip would delete —
// via matchAll (enumerating, not stripping): line-strip THEN the block-comment regex. A string-aware
// scan (scanTemplateLiterals below) sees ZERO of these fake spans, because the '/* */' sequences are
// inside the resolveGate discovery string's glob literals ('*/node_modules/*' etc.). Asserting the
// ORDERED EXACT list of spans as {head, tail} substring pairs (spans 0/1 are byte-identical, so ordered
// not counted-by-head) bounds the blindness both ways: a new block comment OR a new '/*'-bearing string
// literal ADDS a span (red), a removed/merged one drops it (red). Naive-strip string-blindness INSIDE the
// census is itself bounded by this exact equality — corruption either leaves the list identical (harmless)
// or changes it (loud red), never silently wrong. blockCommentSpans + scanTemplateLiterals are the ONLY
// sanctioned text-preparation idioms for future structural tests over workflow-template.js.
const blockCommentSpans = (text = src) =>
  [...text.replace(/\/\/[^\n]*/g, '').matchAll(/\/\*[\s\S]*?\*\//g)].map(m => m[0])
// The pre-#929 corrupt idiom, retained in ONE named place as the census's negative reference: the
// End-state 2/7 both-ways probes run it to PROVE it loses tokens the narrowed line-only prep keeps.
// NEVER used by a real structural assert (the three sites above are line-only). It is the block-STRIP
// form; the enumerating census (blockCommentSpans, above) uses the matchAll form.
const naiveTwoStepStrip = (text) => text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
// Re-derived at THIS dispatch base (the live naive idiom yields exactly three spans: two byte-identical
// 18-byte fake spans from the discovery glob literals + one giant span ending at the file's only real
// block comment, /* the batch ace commit */). {head, tail} substring pairs, ORDERED. A fourth
// find-exclusion glob would re-shuffle the pairing → red → conscious re-derivation.
const EXPECTED_BLOCK_SPANS = [
  { head: "/*' -not -path '*/", tail: "/*' -not -path '*/" },
  { head: "/*' -not -path '*/", tail: "/*' -not -path '*/" },
  { head: "/*' | sort);", tail: "/* the batch ace commit */" },
]

// ===========================================================================
// GATE COMPOSITION POINT (ADR 0036) — enumerated exactly-once prompt evidence
// ---------------------------------------------------------------------------
// The engine normalizes plan.gate ONCE (`if (plan) plan.gate = resolveGate(plan.gate)`, immediately after
// entry validation), so every one of the SEVENTEEN gate-bearing dispatch sites interpolates the SAME composed
// gate. This enumerates all seventeen captures by label/dispatchKind — the count IS the anti-vacuity floor: a
// site an existing fixture cannot reach is added, never skipped, so deleting the composition line reds every
// arm. Anchors ONLY on the discovery-clause token; no assertion enumerates shell suites or states a count.
const GATE_TOKEN = `-name '*.test.sh'`   // a substring of resolveGate's find clause; absent from every fixed prompt prose
const PLAIN_FIXTURE_GATE = `node --test 'skills/**/*.test.mjs'`
const countOccurrences = (hay, needle) => hay.split(needle).length - 1
const planWith = (gate) => ({ file: 'docs/plans/wtprov-A.md', gate })
// A gate_failure_class:'baseline' first result routes the workflow to the baseline-proceed re-merge / re-land
// dispatch site (clsImpl returns merged/landed for the :baseline-proceed relabel, so the phase proceeds).
const baselineMergeResult = () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED same id — pre-existing' })
const baselineLandResult = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED same id — pre-existing' })
// no-test → add-test → re-audit(approve) → re-merge(merged): reaches the floor-retry re-merge site. Fresh
// closure per run so the FIRST merge of each run trips the floor (requiresTest defaults true — no field needed).
const floorRetryImpl = () => {
  let mergeCount = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
}
// unpackaged → package-it → re-audit(approve) → re-merge(merged): reaches the PACKAGE_IT floor-fix site.
// The packaging twin of floorRetryImpl (requiresPackaging defaults true — no field needed).
const pkgFloorRetryImpl = () => {
  let mergeCount = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'unpackaged' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
}
// request_changes once → FIX_NEEDED fix-worker → re-audit(approve): reaches the FIX_NEEDED site.
// Fresh closure per run so the FIRST audit round of each run blocks.
const fixNeededImpl = () => {
  let auditN = 0
  return (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return ++auditN <= 1
      ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Major', title: 'fix me', suggested_fix: 'guard the missing value before reading it', file: 'a.js', rationale: 'because' }] }
      : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    return defaultImpl(prompt, opts)
  }
}
const SINGLE_TASK = [{ id: 't1', issue: 101, title: 'T', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }]
// Reaches ONE ace bisection subset dispatch (ace:subset:t1:a2): batch ace → culprit regression (names ka) →
// the remainder [kb] re-applies as ONE subset. Fresh closure per run (buildSeqImpl queues pop).
const bisectSubsetImpl = () => buildSeqImpl({
  'audit:t1:correctness': [bApprove([nit({ title: 'ka', file: 'skills/ka.js' }), nit({ title: 'kb', file: 'skills/kb.js' })]),
                           bRegress('skills/ka.js'), bApprove()],
}, aceBase())
// The seventeen gate-bearing dispatch captures, enumerated by label/dispatchKind. Each drives the fixture that
// reaches its site with the given fixture gate and returns the captured prompt.
const GATE_SITE_CAPTURES = [
  { site: 'worker Gate: line (work:<task>)', find: (c) => c.find(isWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'merge:<task> rebase clause', find: (c) => c.find(x => /^merge:t\d+$/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'merge:<task>:floor-retry re-merge clause', find: (c) => c.find(x => /floor-retry/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), floorRetryImpl()) },
  { site: 'merge:<task>:baseline-proceed re-merge clause', find: (c) => c.find(x => /^merge:.*:baseline-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ mergeResult: baselineMergeResult })) },
  { site: 'evidence:phase-<id> intra-dep integrated-tip re-run', find: (c) => c.find(x => /^evidence:phase-/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'polish:phase-<id> keep-green clause', find: (c) => c.find(x => /^polish:phase-/.test(x.opts.label || '')),
    run: (gate) => runPhase(SWEEP_ARGS({ plan: planWith(gate) }), sweepBase([queuedAbsorb()])) },
  { site: 'merge:p<id>-polish re-merge clause', find: (c) => c.find(x => /^merge:p\d+-polish$/.test(x.opts.label || '')),
    run: (gate) => runPhase(SWEEP_ARGS({ plan: planWith(gate) }), sweepBase([queuedAbsorb()])) },
  { site: 'land:phase-<id> merge clause', find: (c) => c.find(x => /^land:phase-\d+$/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'land:phase-<id>:baseline-proceed re-land clause', find: (c) => c.find(x => /^land:phase-\d+:baseline-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ landResult: baselineLandResult })) },
  // The two bounded environment-proceed recovery dispatches (merge-land-resilience Task 1.1) are equally
  // gate-bearing — each interpolates ${plan.gate} for its must-go-fully-green fresh-env re-run — so they are
  // ADDED here, never skipped (this array's own doctrine).
  { site: 'merge:<task>:environment-proceed re-merge clause', find: (c) => c.find(x => /^merge:.*:environment-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ mergeResult: envMergeResult })) },
  { site: 'land:phase-<id>:environment-proceed re-land clause', find: (c) => c.find(x => /^land:phase-\d+:environment-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ landResult: envLandResult })) },
  // The four fix-family prompts (FIX_NEEDED, ADD_TEST, PACKAGE_IT, ace) became gate-bearing when
  // precision-chain Task 1.3 gave each a `Gate: ${plan.gate}` line (prompt truth, D6) — so they are
  // ADDED here, never skipped (this array's own doctrine).
  { site: 'FIX_NEEDED Gate: line (fix:<task>:r<n>)', find: (c) => c.find(x => /^fix:t1:/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), fixNeededImpl()) },
  { site: 'ADD_TEST Gate: line (add-test:<task>:r<n>)', find: (c) => c.find(isAddTestWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), floorRetryImpl()) },
  { site: 'PACKAGE_IT Gate: line (package-it:<task>:r<n>)', find: (c) => c.find(isPackageItWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), pkgFloorRetryImpl()) },
  { site: 'ace Gate: line (ace:polish:<task>:a<n>)', find: (c) => c.find(x => /^ace:polish:/.test(x.opts.label || '')),
    run: (gate) => runPhase(ACE_ARGS({ plan: planWith(gate) }), aceBase()) },
  // The ace bisection SUBSET dispatch (realized-absorb-rate Task 1.1) is the seventeenth gate-bearing
  // site — it interpolates the same plan.gate Gate: line as its fix-family siblings — so it is ADDED
  // here, never skipped (this array's own doctrine). bisectSubsetImpl (below) reaches it.
  { site: 'ace bisection subset Gate: line (ace:subset:<task>:a<n>, n>=2)', find: (c) => c.find(x => /^ace:subset:t1:a2$/.test(x.opts.label || '')),
    run: (gate) => runPhase(ACE_ARGS({ plan: planWith(gate) }), bisectSubsetImpl()) },
  // MAKE_DONE_PASS (precision-chain Task 2.3) is the fifth fix-family prompt and equally gate-bearing —
  // it interpolates the same plan.gate Gate: line as its floor-fix siblings — so it is ADDED here,
  // never skipped (this array's own doctrine). runDoneUnmetLoop is the fixture that reaches it.
  { site: 'MAKE_DONE_PASS Gate: line (make-pass:<task>:r<n>)', find: (c) => c.find(isMakePassWorker),
    run: (gate) => runDoneUnmetLoop({ plan: planWith(gate) }) },
]

// ===========================================================================
// DONE-WHEN THREADING (precision-chain Task 1.3) — prompt-registry rows
// ---------------------------------------------------------------------------
// task.doneWhen (the plan's per-task `Done when:` acceptance command) rides the seven worker-family
// prompt sites (MAKE_DONE_PASS joined via Task 2.3; the ace bisection subset via realized-absorb-rate
// Task 1.1) as a `Done when:` line beside Gate:. The rows pin
// the two contract halves the plan
// names: (1) any prompt that says keep-the-gate-green carries the gate command (the D6 prompt-truth
// sweep), and (2) the absent ⇒ '' set-minus identity — a doneWhen-less run's prompts are
// byte-identical to a doneWhen-bearing run's prompts minus the single inserted clause (legacy
// byte-identity, End state 9). Fresh task objects per run (dwTask) — never the shared SINGLE_TASK —
// because these tests byte-compare prompts ACROSS runs.
const DW_CMD = 'node --test skills/war/assets/task-one.acceptance.test.mjs'
const dwTask = (over = {}) => ({ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], ...over })
const DONE_WHEN_SITES = [
  { site: 'primary worker dispatch (work:<task>)', find: (c) => c.find(isWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), defaultImpl) },
  { site: 'FIX_NEEDED fix prompt (fix:<task>:r<n>)', find: (c) => c.find(x => /^fix:t1:/.test(x.opts.label || '')),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), fixNeededImpl()) },
  { site: 'ADD_TEST floor-fix prompt (add-test:<task>:r<n>)', find: (c) => c.find(isAddTestWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), floorRetryImpl()) },
  { site: 'PACKAGE_IT floor-fix prompt (package-it:<task>:r<n>)', find: (c) => c.find(isPackageItWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), pkgFloorRetryImpl()) },
  { site: 'ace advisory-polish prompt (ace:polish:<task>:a<n>)', find: (c) => c.find(x => /^ace:polish:/.test(x.opts.label || '')),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), aceBase()) },
  // The ace bisection SUBSET dispatch (realized-absorb-rate Task 1.1) is the seventh worker-family
  // site — doneWhenClause rides it beside its Gate: line like its siblings — ADDED, never skipped.
  { site: 'ace bisection subset prompt (ace:subset:<task>:a<n>, n>=2)', find: (c) => c.find(x => /^ace:subset:t1:a2$/.test(x.opts.label || '')),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), bisectSubsetImpl()) },
  // MAKE_DONE_PASS (Task 2.3) is the fifth fix-family prompt — doneWhenClause rides it like its
  // siblings, so its row is ADDED, never skipped. (Production only reaches it for a doneWhen-bearing
  // task — the floor never runs otherwise — but the mock drives the doneWhen-less arm too, proving
  // the set-minus identity holds even there.)
  { site: 'MAKE_DONE_PASS floor-fix prompt (make-pass:<task>:r<n>)', find: (c) => c.find(isMakePassWorker),
    run: (taskOver) => runDoneUnmetLoop({ taskOver }) },
  // The ace RE-ENTRY batch dispatch (in-run-finding-resolution Task 1.1) is the eighth
  // worker-family site — doneWhenClause rides it beside its Gate: line — ADDED, never skipped.
  { site: 'ace re-entry batch prompt (ace:reentry:<task>:a<n>, fresh re-audit absorb)',
    find: (c) => c.find(x => /^ace:reentry:t1:a2$/.test(x.opts.label || '') && (x.prompt || '').includes('ACE RE-ENTRY BATCH')),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), reentryImpl()) },
]

// A1 (D9) — the RETIRED plan-slice-criteria framing, asserted absent from the standing worker card
// case-insensitively (the dispatched-prompt half never carried it; the card rewrote it this task).
// The POSITIVE half — both surfaces carry the claimed-End-state-ids redefinition — is the D3
// both-surfaces registry's A1 row below.
const RETIRED_CRITERIA_FRAMING = [/acceptance criteria[\s\S]{0,8}you own/i, /mapped acceptance criteria/i]
// Unwired negative reference (both-ways proof): the pre-change sentences in the card's OWN real bytes,
// indexed to the guard each must trip. FIXTURES — never re-introduced into a live surface.
const RETIRED_CRITERIA_SAMPLES = [
  ['Inputs bullet (pre-change bytes)', 'the **plan file** and the specific build-order step / acceptance criteria *you own*', 0],
  ['Do step 2 (pre-change bytes)', 'Implement the task to satisfy its slice of the plan and its mapped acceptance criteria.', 1],
]

// ===========================================================================
// DONE-UNMET ROUTE (precision-chain Task 2.3) — the done-when floor, wired
// ---------------------------------------------------------------------------
// F2's two-slot precedent: 'done-unmet' joins the MergeResult status enum AND FLOOR_STATUSES (plus both
// HARD_ESCALATION_REASONS mirrors — the D2 registry row and war-config.test.mjs's inline-mirror guard
// arbitrate those appends). The tests here pin the WIRING this task adds: the refiner merge-task dispatch
// runs assert-done-when.sh after the gate (file-threaded --cmd-file, exit 1 ⇒ done-unmet, exit 2 ⇒ error,
// never a collapse), captures assert-test-in-diff.sh exit-0 stdout into MergeResult.mappedTests (D7), a
// floor exit 1 routes the bounded make-this-command-pass sub-loop sharing run.roundLimit (the no-test
// pattern), exhaustion escalates 'done-unmet', and a doneWhen-less legacy task dispatches byte-identical
// floor-less merge prompts (End state 9). done-when-floor-wiring Task 1.1 grew the section: the clause's
// evidence capture (tee target + exit-1 done_when_log_path + the D14 exit-status-preservation shape),
// the MAKE_DONE_PASS evidence-path set-minus pair (D5), the exhaustion-detail carry/omit pair (D6), and
// the baseline-proceed precedence fixture (D7 — a red done-when is never proceeded over as baseline debt).
const DU_CMD = 'node --test skills/war/assets/task-one.acceptance.test.mjs'
const isMakePassWorker = (c) => seatOf(c.opts) === 'war-worker' && /make-pass:/.test(c.opts.label || '')
// done-unmet → make-pass fix → full re-audit(approve) → re-merge. Fresh closure per run (the
// floorRetryImpl pattern): first Refine call returns done-unmet — every call does under alwaysUnmet,
// driving budget exhaustion — otherwise the re-merge returns merged. Also the reachability fixture
// for the MAKE_DONE_PASS rows in GATE_SITE_CAPTURES (via `plan`) and DONE_WHEN_SITES (via `taskOver`)
// — function declaration, hoisted above both registries.
function runDoneUnmetLoop({ alwaysUnmet = false, roundLimit, plan, taskOver = { doneWhen: DU_CMD }, doneWhenLogPath } = {}) {
  let merges = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc0000', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      merges++
      // doneWhenLogPath (Task 1.1): when set, every done-unmet result carries the teed evidence
      // artifact's path — the presence arm of the D5/D6 set-minus pairs; absent ⇒ the field is omitted.
      return (alwaysUnmet || merges === 1)
        ? { mode: 'merge-task', status: 'done-unmet', ...(doneWhenLogPath ? { done_when_log_path: doneWhenLogPath } : {}) }
        : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  return runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)], ...(plan ? { plan } : {}), ...(roundLimit ? { run: { roundLimit } } : {}) }), impl)
}

// The done-when evidence artifact path a doneWhenLogPath-bearing fixture threads (the presence arm of
// the D5/D6 set-minus pairs below) — shaped like the real _refinery-scoped teed path.
const DU_LOG = '/abs/repo/.claude/worktrees/run-1/_refinery/.war/done-when-t1.log'

// ===========================================================================
// D3 — BOTH-SURFACES DIRECTIVE REGISTRY (ADR 0025)
// ---------------------------------------------------------------------------
// Each correctness-critical directive duplicated across a standing agents/*.md card and its dispatched
// prompt(s). Token-anchored, case-tolerant — never full-line bytes (the surfaces phrase the shared
// discipline differently). Includes rows asserted against the INLINE gate-audit seat prompts
// (execution-evidence + integrated-tip + end-state) sliced from template src — those sit OUTSIDE
// auditPrompt(), so MOST base auditPrompt clauses never reach them; they inherit those shared
// directives only via the standing card. The exceptions are adjudicationClause (a module-level const
// concatenated onto both auditPrompt AND the three gate-audit-family seats directly) and the
// evidence-precedence skeleton (ADR 0041, inlined at auditPrompt AND all three seats), so those rules
// reach the seats without the card — the rows below still assert the card too.
// ponytail: this registry IS the deliberate ceiling — a new both-surfaces directive lands its row here in
// the same task (the /war-strategy new-mirror authoring rule), never an AST scanner.
const sliceSrc = (startTok, endTok) => {
  const s = src.indexOf(startTok)
  const e = src.indexOf(endTok, s)
  assert.ok(s !== -1 && e > s, `src slice "${startTok}" .. "${endTok}" is locatable`)
  return src.slice(s, e)
}

// #990 — the RETIRED asserting cwd-is-tip premise, as a whole-string (never line-scoped) regex. It fires on
// "<working tree|working directory|cwd> <is|are|reflects> … committed tip" and is EXEMPTED by an immediately
// following negation, so the replacement prose ("is NOT assumed to be the committed tip", with or without
// markdown emphasis around the tokens) passes while any re-assertion reds.
const CWD_IS_TIP_ASSERTING = /(?:working tree|working directory|working dir|cwd)[\s*_`]{0,6}(?:\w+\s+){0,2}(?:is|are|reflects)\b(?![\s*_`]{0,6}not\b)[\s\S]{0,80}?committed tip/i
// Unwired negative reference (both-ways proof): the two premise sentences this task retired, verbatim from
// the pre-change surfaces, plus the "reflects" phrasing a naive "is the committed tip" grep misses. They are
// FIXTURES — never re-introduced into a live surface.
const RETIRED_PREMISE_SAMPLES = [
  ['war-servitor.md', 'at the landed tip (your post-land working tree *is* the committed tip, so this needs no new capability).'],
  ['servitor Wrap-up prompt', 'at the landed tip (your post-land working tree IS the committed tip — no new capability needed).'],
  ['reflects phrasing', 'the servitor runs after the merge, so its working tree already reflects the committed tip'],
  ['line-break-wrapping pairing (why the guard is whole-string, never line-scoped)',
    'your post-land working tree IS\nthe committed tip'],
]

// Task 1.2 (D5, spec §5; #1085/#1124) — the RETIRED branch mischaracterization: "=-attached read flags
// only", a blanket claim its own parenthetical contradicted with five BARE flags. Both mirrors now carry
// the hook's two-arm form instead. Backtick-tolerant because the .md writes `=`-attached (a backtick
// between = and -attached) where the JS prompt writes the plain =-attached — within THIS regex's matched
// span that backtick is the sole difference, so one optional-backtick pattern covers both surfaces.
const BRANCH_READ_FLAGS_ONLY_RETIRED = /=`?-attached read flags only/i
// Unwired negative reference (both-ways proof): the pre-change sentence in each surface's OWN real bytes.
// The full sentences diverge well past that backtick — bold markers, a backticked `branch`, a `git branch`
// prefix inside the first flag, "any write flag" vs "write flag" — so a hand-normalized common form would
// prove nothing about what actually lived on either surface. FIXTURES: never re-introduced into a live
// surface, and the sanctioned deliberate deposit named by End state 5's carve-out for the repo-wide grep.
const BRANCH_READ_FLAGS_ONLY_SAMPLES = [
  ['war-auditor.md bullet (pre-change bytes)',
    '- **`branch` takes `=`-attached read flags only** (`git branch --contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`, `--list`, `-a`, `-r`, `--show-current`, `-v`); a bare name or any write flag denies.'],
  ['auditPrompt() sentence (pre-change bytes)',
    'branch takes =-attached read flags only (--contains=<rev>, --merged=<rev>, --points-at=<rev>, --list, -a, -r, --show-current, -v); a bare name or write flag denies.'],
]
// D21 retired-claim regexes (Task 6.1): the card bullet carried `git grep` in backticks, so a bare
// /git grep stays denied/ never matched the card form — the optional backticks make one regex
// cover the card, the dispatched literal and the eviction destination.
const GIT_GREP_STAYS_DENIED_RETIRED = /`?git grep`? stays denied/i
const GIT_GREP_NOT_AND_STAYS_DENIED_RETIRED = /is not and stays denied/i
const NEVER_SHELL_GREP_RETIRED = /never (?:with )?shell `?grep`?(?: or |\/)`?git grep`?/i
// Unwired negative reference (both-ways proof), same shape as BRANCH_READ_FLAGS_ONLY_SAMPLES: the
// pre-D21 bytes of each surface's OWN retired claim, each paired with the regex that must fire on it.
// FIXTURES: never re-introduced into a live surface.
const GIT_GREP_RETIRED_SAMPLES = [
  ['card bullet', '**`git grep` stays denied**', GIT_GREP_STAYS_DENIED_RETIRED],
  ['dispatched literal', 'git grep stays denied —', GIT_GREP_STAYS_DENIED_RETIRED],
  ['card committed-tree clause', '`git grep` is not and stays denied', GIT_GREP_NOT_AND_STAYS_DENIED_RETIRED],
  ['evidence card', 'never with shell `grep` or `git grep`', NEVER_SHELL_GREP_RETIRED],
]

// ---------------------------------------------------------------------------
// D6 (Task 1.2, spec §4) — EXTRACTION-EQUALITY drift lock for the branch flag enumeration.
// The hook's branch deny string is CANONICAL; both prompt mirrors are followers. This test reads the hook,
// extracts the flag tokens from the two parenthesized arms of that deny string, and asserts every one of
// them onto both mirror surfaces — so the next hook-side flag change REDs the mirrors instead of stranding
// them (the exact defect class #1124 records, which the D5 hand anchors alone could not catch).
// ---------------------------------------------------------------------------

// Token-boundary matcher: a naive substring check would pass VACUOUSLY for the short flags — `-a` is a
// substring of `--points-at=` and `--all`, `-r` of `--remotes`, `-v` of `--verbose` and `-vv` — so dropping
// one from a mirror would go unnoticed. Word/hyphen boundaries on both sides fix that, and admit the .md's
// backtick fencing (a backtick is neither \w nor -) without a markdown-specific special case.
const flagTokenRe = tok => new RegExp(`(?<![\\w-])${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)

// ===========================================================================
// #931 — template-literal census (lifts the criterion-3 coverage floor above from "no bare agent(`" to a
// DEFAULT-DENY multiset over EVERY untagged template literal in the template). The pt guard's structural
// floor rejects only a bare backtick right after `agent(`; an untagged literal mid-concatenation, behind a
// variable, in a helper body, or nested inside a pt interpolation slips undefined into a prompt with the
// guard never consulted. scanTemplateLiterals is a string-aware single pass: it recognizes // and /* */
// comments OUTSIDE strings, single/double-quoted strings (backslash-aware; a string that does not close on
// its line THROWS), and template literals (backslash-aware, recursive ${} interiors — nested literals and
// each one's tagged/untagged distinction are FIRST-CLASS entries). It THROWS on EOF in any construct —
// fail-closed, never a silent narrowing. It is NOT a JS lexer.
// ponytail: the recorded ceiling is regex-literal ambiguity — a regex literal carrying an unbalanced
// quote/backtick DESYNCS the scanner, but LOUDLY via the unclosed-string/EOF throw, never silently; the
// upgrade path (a real lexer) is the rejected ceiling. `pt`-tagged = the identifier `pt` immediately
// precedes the backtick (verified in-file: `pt\`` carries no space).
const HEAD_LEN = 44
const scanTemplateLiterals = (text = src) => {
  const n = text.length
  const literals = []      // { head, tagged } per template literal (nested interiors included)
  const blockComments = [] // raw text of each TRUE (string-aware) block comment
  const isIdent = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c)
  const ptTagged = (b) => text.slice(b - 2, b) === 'pt' && !isIdent(text[b - 3])
  const scanString = (quote, start) => {
    let j = start + 1
    while (j < n) {
      const c = text[j]
      if (c === '\\') { j += 2; continue }
      if (c === '\n') throw new Error(`scanTemplateLiterals: unclosed ${quote}-string at line-end near ${JSON.stringify(text.slice(start, start + 40))} (fail-closed)`)
      if (c === quote) return j + 1
      j++
    }
    throw new Error(`scanTemplateLiterals: EOF inside ${quote}-string (fail-closed)`)
  }
  const skipLine = (start) => { let j = start + 2; while (j < n && text[j] !== '\n') j++; return j }
  const skipBlock = (start) => {
    let j = start + 2
    while (j < n) { if (text[j] === '*' && text[j + 1] === '/') return j + 2; j++ }
    throw new Error('scanTemplateLiterals: EOF inside block comment (fail-closed)')
  }
  const scanTemplate = (start, tagged) => {
    literals.push({ head: text.slice(start + 1, start + 1 + HEAD_LEN), tagged })
    let j = start + 1
    while (j < n) {
      const c = text[j]
      if (c === '\\') { j += 2; continue }
      if (c === '`') return j + 1
      if (c === '$' && text[j + 1] === '{') { j = scanInterp(j + 2); continue }
      j++
    }
    throw new Error('scanTemplateLiterals: EOF inside template literal (fail-closed)')
  }
  const scanInterp = (start) => {
    let j = start, depth = 1
    while (j < n) {
      const c = text[j]
      if (c === "'" || c === '"') { j = scanString(c, j); continue }
      if (c === '`') { j = scanTemplate(j, ptTagged(j)); continue }   // nested literal — first-class
      if (c === '/' && text[j + 1] === '/') { j = skipLine(j); continue }
      if (c === '/' && text[j + 1] === '*') { j = skipBlock(j); continue }
      if (c === '{') { depth++; j++; continue }
      if (c === '}') { depth--; if (depth === 0) return j + 1; j++; continue }
      j++
    }
    throw new Error('scanTemplateLiterals: EOF inside ${} interpolation (fail-closed)')
  }
  let i = 0
  while (i < n) {
    const c = text[i]
    if (c === '/' && text[i + 1] === '/') { i = skipLine(i); continue }
    if (c === '/' && text[i + 1] === '*') { const e = skipBlock(i); blockComments.push(text.slice(i, e)); i = e; continue }
    if (c === "'" || c === '"') { i = scanString(c, i); continue }
    if (c === '`') { i = scanTemplate(i, ptTagged(i)); continue }
    i++
  }
  return { literals, blockComments }
}

// The DEFAULT-DENY registry: the enumerated multiset of UNTAGGED template-literal 44-char heads
// (head + occurrence count), machine-derived once via the scanner at this dispatch base. HEADER RULE
// (grep-able, for auditors): a literal that FEEDS agent() prompt text is NEVER registered here — tag it
// with `pt`. Every row is VALUE-COMPOSITION, grouped by class rationale:
//   • the pt guard's OWN throw-message literal;
//   • validation / error / refusal messages (throws + escalation detail strings);
//   • git/shell command & flag builders — spliced into an already-`pt`-tagged carrier that guards the
//     spliced VALUE; every interpolation here is ternary-guarded or derived-and-validated, so no
//     undefined can render (the `pt` carrier is the prompt-safety boundary) — e.g. testPatternArg,
//     the resolveGate discovery/composition mirror (ADR 0036, untouchable), memoryQueryRepoArg,
//     owned, the ensure-worktree list, the phaseBaseCmd merge-base;
//   • label / branch / worktree / path / verdict / reason builders — opts.label, t.branch, t.worktree,
//     the `${worktreeRoot || '<worktreeRoot>'}/…` path family (the merge loop's block-scoped
//     refineryPath, the phase-level refineryPath, refineryLandPath, the polishWorktree), escalation
//     task labels & reasons, gate-audit/land verdict tokens (consumed as VALUES by pt-tagged carriers
//     that guard them);
//   • log / note / detail lines (log() sinks, auditLog notes, escalation details, the end-state
//     `/out-of-scope/i.test()` title-or-rationale predicate).
// Entries are in source-appearance order (which tracks the file's phase structure). Exact multiset
// equality below is red BOTH ways — a new untagged literal (any spawn site, helper operand, variable,
// or nested interior) AND a stale row whose literal was removed/renamed.
const LITERAL_REGISTRY = [
  ["workflow-template prompt: undefined interpol"],
  ["workflow-template: args is a string but not "],
  ["workflow-template: args must be a JSON objec"],
  [" --pattern '${testPattern}'` : ''\n// Partial"],
  ["war/${planSlug}/p${ph.id}-${t.id}` : t.branc"],
  ["${worktreeRoot}/${runId}/p${ph.id}-${t.id}` "],
  ["roster must be an array of 1-5 seats (got ${", 2],
  ["roster carries ${roster.length - evidenceSea"],
  ["roster[${i}] must be an object { lens, depth"],
  ["roster[${i}].lens must be a non-empty string"],
  ["roster[${i}].lens \"${seat.lens}\" duplicates "],
  ["roster[${i}].depth must be \"neighbors\" or \"d"],
  ["roster[${i}].agentType must be one of ${SEAT"],
  ["roster[${i}].agentType \"war-evidence-auditor"],
  ["roster[${i}].${k} must be one of ${e.join('|"],
  ["-name '*.test.sh'`\nconst resolveGate = (decl"],
  ["for f in $(find . -type f ${GATE_DISCOVERY_T"],
  ["do printf '\\\\n== gate(bash): %s ==\\\\n' \"$f\" "],
  ["${declaredGate} && ${discovery}`\n}\n// audit."],
  ["workflow-template: requires top-level { plan"],
  ["phase.id is missing (derivation would produc"],
  ["workflow-template: requires phase { title, w"],
  ["${problems.join('; ')}${derivationProblem &&"],
  ["task ${t.id}: cannot derive branch/worktree "],
  ["task ${t.id}: invalid roster — ${rv.errors.j"],
  ["provision-run:${task.id}`, dispatchKind: 'pr"],
  ["task ${id}: the ${label} dispatch returned n"],   // provisionEvidence's evidence-gate throw (#2485 D19 — moved out of provisionStep)
  ["Disposition demotion: [${f.severity}] \"${f.t"],
  ["worker path-contract violation: reported fil", 2],
  ["Task ${taskId}: normalized main-checkout-roo"],
  [", repo: ${learningsTarget}` : ''\nconst MEMOR"],
  ["baseline gate debt: ${idset.join(', ') || '("],
  ["audit:${task.id}:${seat.lens}${peers ? ':reb"],
  ["Phase ${ph.id} \"${ph.title}\": ${tasks.length"],
  [" --owned-file ${ownedFile}` : ''\n  // --recl"],
  ["   provision-worktrees.sh ensure-worktree ${"],
  ["provision:phase-${ph.id}`, dispatchKind: 'pr"],
  ["phase ${ph.id}: the provision:phase-${ph.id}"],
  ["recovery: task ${id} is pre-merged on the ad"],
  ["stale prior attempt: the remote task branch "],
  ["Task ${id}: env-blocked — stale remote task "],
  ["No runnable tasks remain — the rest are bloc"],
  ["work:${task.id}`, schema: WORKER_RESULT, ..."],
  ["Task ${task.id}: lone-seat widening (Critica"],
  ["fix:${task.id}:r${round + 1}`, schema: WORKE"],
  ["engine error during work/audit: ${err.messag"],
  ["gate-audit: skipping ${task.id} (requiresTes"],
  ["${worktreeRoot || '<worktreeRoot>'}/${runId ", 4],
  ["packaging-floor: skipping ${r.task.id} (requ"],
  ["merge:${r.task.id}`, schema: MERGE_RESULT, ."],
  ["${r.task.id} touches a submodule; undeclared"],
  ["${isNoTest ? 'add-test' : isDoneUnmet ? 'mak"],
  ["${floorMr.status}: re-audit did not approve "],
  ["${floorMr.status}:re-audit-failed`, findings"],
  ["merge:${r.task.id}:floor-retry:r${r.task.fix"],
  ["${floorMr.status}:exhausted`, fixRounds: r.t"],
  ["merge:${r.task.id}:environment-proceed`, sch"],
  ["merge:${r.task.id}:baseline-proceed`, schema"],
  ["${r.task.id} touches a submodule (surfaced o", 3],
  ["Task ${r.task.id}: env-blocked — provision s"],
  ["endstate-check intake-lint: condition ${r.n}"],
  ["endstate-check: dispatching the land-barrier"],
  ["endstate-check:phase-${ph.id}`, dispatchKind"],
  ["$(git -C ${refineryPath} merge-base ${ph.int"],
  ["evidence:phase-${ph.id}`, dispatchKind: 'evi"],
  ["gate-audit:${taskId}:execution-evidence`, sc"],
  ["gate-audit:${gateAuditVerdict.verdict}`, fin"],
  ["gate-audit:phase-${ph.id}:integrated-tip`, s"],
  ["phase-${ph.id}-integrated-tip`, verdict: `ga"],
  ["gate-audit:${authVerdict.verdict}`, findings"],
  ["phase-${ph.id}-integrated-tip`, reason: 'gat"],
  ["gate-audit: mergedTasksForGateAudit is empty"],
  ["gate-audit:phase-${ph.id}:end-state`, schema"],
  ["phase-${ph.id}-end-state`, verdict: `gate-au"],
  ["gate-audit:${esVerdict.verdict}`, findings, "],
  ["phase-${ph.id}-end-state`, reason: 'gate-evi"],
  ["phase-close sweep: the phase is ${landDecisi"],
  ["phase-close sweep: the config default audit."],
  ["war/${planSlug || '<plan-slug>'}/p${ph.id}-p"],
  ["p${ph.id}-polish`, issue: ph.epicIssue || `<"],
  ["<phase-${ph.id}-epic>`,\n      title: `phase-"],
  ["phase-close coherence sweep (phase ${ph.id})"],
  ["drain the phase-close queue (${phaseCloseQue"],
  ["polish-worktree:phase-${ph.id}`, dispatchKin"],
  ["phase-close sweep: the polish worktree provi"],
  ["polish:phase-${ph.id}`, schema: WORKER_RESUL"],
  ["merge:p${ph.id}-polish`, schema: MERGE_RESUL"],
  ["phase-close sweep MERGED at ${polishSha} — t"],
  // terminal pass (in-band-absorb-default D3a): the three dispatch labels — worker, forward-revert, merge.
  ["terminal:phase-${ph.id}`, dispatchKind: 'ter"],
  ["terminal-revert:phase-${ph.id}`, dispatchKin"],
  ["merge:p${ph.id}-terminal`, schema: MERGE_RES"],
  ["phase-close sweep DISCARDED (${sweepWhy || ("],
  ["polish merge returned ${pmrStatus}` : 'the p"],
  ["land:phase-${ph.id}`, schema: MERGE_RESULT, "],
  ["phase-${ph.id}-land`, reason: 'submodule-pr'", 3],
  ["phase-${ph.id}-land`, reason: landResult.sta", 2],
  ["phase-${ph.id}-land`, reason: 'env-blocked',", 2],
  ["land:phase-${ph.id}:environment-proceed`, sc"],
  ["Phase ${ph.id} landed via environment-procee"],
  ["land:phase-${ph.id}:baseline-proceed`, schem"],
  ["Phase ${ph.id} landed via baseline-proceed r"],
  ["phase-${ph.id}-land`, reason: reLand.status,", 2],
  ["phase-${ph.id}-land`, reason: reLand ? reLan", 2],
  ["Phase ${ph.id} landed. Attempting opportunis"],
  ["phase-${ph.id}-land`, reason: landResult ? S"],
  ["Phase ${ph.id}: dead or unrouted land dispat"],
  ["Holding the land for phase ${ph.id}: ${escal"],
  ["Holding the land for phase ${ph.id}: no task"],
  ["wrap-up:phase-${ph.id}`, schema: SERVITOR_RE"],
  ["Phase ${ph.id} landed but no memoryLocalRoot"],
  ["${f.title || ''} ${f.rationale || ''}`)) ? '"],
]

const untaggedHeadMultiset = (text) => {
  const m = new Map()
  for (const l of scanTemplateLiterals(text).literals) if (!l.tagged) m.set(l.head, (m.get(l.head) || 0) + 1)
  return m
}
const registryMultiset = () => {
  const m = new Map()
  for (const row of LITERAL_REGISTRY) m.set(row[0], (m.get(row[0]) || 0) + (row[1] ?? 1))
  return m
}
const multisetsEqual = (a, b) => {
  if (a.size !== b.size) return false
  for (const [h, c] of a) if (b.get(h) !== c) return false
  return true
}
const sortedEntries = (m) => [...m.entries()].sort((x, y) => x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)

// ---------------------------------------------------------------------------
// Partial-phase recovery (spec §4.2/§4.3/§4.4): args.recovery derive-and-skip merged set,
// PLAN-DEFECT: sentinel → defectClass metadata, always-on STALE_REMOTE classification → env-blocked.
// ---------------------------------------------------------------------------

// A barrier mock keyed on the STABLE dispatchKind discriminator ('provision-barrier'), never the label
// prefix (lesson provision-phase-mocks-must-match-on-label-not-just-phase / spec criterion 8). Returns
// the given env-outcome for the barrier; everything else rides defaultImpl.
const barrierEnv = (env) => (prompt, opts) =>
  (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'provision-barrier') ? env : defaultImpl(prompt, opts)

// ===========================================================================
// D6 (Task 1.2, #1245) — RE-LAND ARM SYMMETRY
// ---------------------------------------------------------------------------
// The initial land holds this property BY CONSTRUCTION: its dispatch result IS the
// outer land result, so a 2B PR-and-hold there leaves the PR ref readable on the phase
// return. Each re-land arm instead dispatches into its OWN local receiver, so it must
// reassign the outer variable by hand inside its 2B guard branch — an arm that only
// records the escalation leaves the phase returning the stale earlier attempt while the
// escalation record says otherwise.
//
// The key is a COUNT over SHAPE-DISCOVERED arms, never over hardcoded labels: a third
// re-land flavor carries a third label, so an extraction keyed on today's two literals
// could not see it and would read 2 === 2 forever no matter how many unmirrored arms
// were added — structurally vacuous, with none of the non-vacuity this pin is sold on.
// The discovery keys on the ':<flavor>-proceed' suffix, which by construction excludes
// the initial land's suffix-less label. The guard's OWN patterns are fragment-built (the
// stem + phase-id + flavor constants below), so a future sweep for a label or for the
// policed assignment cannot self-match on the guard's patterns. The file's
// known contiguous label copies live elsewhere — the #931 LITERAL_REGISTRY's dispatch-site
// rows (the two re-land arm rows included) quote each site's label bytes as their literal
// heads (named by construct; no label byte is quoted here) — and a sweep must account for
// those rows, not for this guard.
// ---------------------------------------------------------------------------
const RELAND_LABEL_STEM = String.raw`land:phase-`
const RELAND_LABEL_PHID = String.raw`\$\{ph\.id\}`
// ANY '-proceed' flavor — the shape key that makes a mirrored third arm discoverable.
const RELAND_LABEL_FLAVOR = String.raw`:[a-z][a-z-]*-proceed`
const RELAND_LABEL_RE = new RegExp(RELAND_LABEL_STEM + RELAND_LABEL_PHID + RELAND_LABEL_FLAVOR, 'g')
// The arm's 2B guard opener, identifier-GENERIC: the backreference binds one receiver
// name to itself, so whatever local name a future arm picks is the name its reassignment
// is then checked against.
const SUBMOD_GUARD_RE = new RegExp(
  String.raw`if \(\s*(\w+)\s*&&\s*\1\.status\s*===\s*'submodule-pr'\s*\)\s*\{`)
const outerAssignRe = (receiver) => new RegExp(String.raw`landResult\s*=\s*` + receiver + String.raw`\b`)

// End of a guard branch = its matching close brace. Template-literal `${…}` spans are
// themselves brace-balanced, so a plain depth count is exact over these bodies.
const braceSpan = (text, open) => {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i + 1
  }
  return -1
}

// Region boundary (explicit): each arm's search region is right-bounded — it runs from its
// matched dispatch label to the next label match (end-of-text only for the last arm), so a
// guardless arm can never borrow a later sibling's guard (#1373/#1286 — the EOF-slice borrow).
// Within that bounded region, `region` ends at the arm's own 2B guard-branch close and
// `branch` is the guard branch alone — the body the reassignment duty is measured on.
// Parameterized over `text` (default: the live template) so the mutation probes below run
// the IDENTICAL extraction over a mutated copy.
const relandSubmodArms = (text = src) =>
  [...text.matchAll(RELAND_LABEL_RE)].map((m, i, all) => {
    const next = all[i + 1]
    const after = text.slice(m.index, next ? next.index : text.length)
    const g = after.match(SUBMOD_GUARD_RE)
    if (!g) return { label: m[0], guarded: false, region: null, branch: null, receiver: null, assigns: false }
    const open = g.index + g[0].length - 1
    const end = braceSpan(after, open)
    return {
      label: m[0],
      guarded: true,
      region: end === -1 ? null : after.slice(0, end),
      branch: end === -1 ? null : after.slice(g.index, end),
      receiver: g[1],
      assigns: end !== -1 && outerAssignRe(g[1]).test(after.slice(g.index, end)),
    }
  })

// ---------------------------------------------------------------------------
// Verdict-integrity D21 / PIN-25 (#1481) — every dispatch site is classified. A TAGGED post-spawn
// death at ANY site resolves at that site through dispatchSite's death arm: a wave audit-round seat
// death (persisting past the dropped-seat retries) classifies env-died SOFT before the shortfall
// check; an ace/re-audit seat death demotes the current subset with the existing abandon reason and
// falls through; a merge, floor-fix, endstate, gate-audit, wrap-up or filing death classifies
// env-died SOFT naming the site.
// A dead dispatch never reads as a content verdict — never audit-blocked, never done-unmet.
// ---------------------------------------------------------------------------
const twoIndependentTasks = () => PROVISION_ARGS({ tasks: [
  { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },
] })

// ---------------------------------------------------------------------------
// Task 1.1 (#1897) — the GLOBAL dispatch semaphore at the leaf agent seam (End states 1–2).
// Supersedes the retired per-site batched(thunks, n) throttle (#1722), which composed
// multiplicatively across nested fan-outs (wave × audit roster ⇒ ~N² agents in flight).
// ---------------------------------------------------------------------------

// Extract makeSemaphore + dispatch from src and bind them to a stub `agent`, so the tests drive the
// SHIPPED source, and can read the counter directly for the drain assertion (a leaked permit lowers
// the observed peak, so a peak ≤ N assertion alone cannot catch it).
const semBlock = (() => {
  const m = src.match(/function makeSemaphore\(n\) \{[\s\S]*?\n\}/)
  return m ? m[0] : null
})()
const dispatchBlock = (() => {
  const m = src.match(/async function dispatch\(prompt, opts\) \{[\s\S]*?\n\}/)
  return m ? m[0] : null
})()
const makeDispatch = (agent, maxParallel) => new Function('agent', 'maxParallel', `
  ${semBlock}
  const dispatchSemaphore = makeSemaphore(maxParallel)
  ${dispatchBlock}
  return { dispatch, dispatchSemaphore }
`)(agent, maxParallel)

// ---------------------------------------------------------------------------
// Phase 3 Task 2 (engine-reliability, #1747): bare-interpolation census + entry-belt,
// provenance-floor, vacuous-endstate, and preMerged-dialect fixtures.
// ---------------------------------------------------------------------------

// Default-deny census (D5): the EXACT set of fallback-free pure-member-chain interpolations inside
// the template's pt-tagged prompt spans, extracted by the same mechanics the assert-args-complete
// Lead preflight floor runs. Any NEW bare interpolation reds this census and forces an explicit
// classification: give the site a fallback/guard, or extend the floor's required/exempt sets (and
// this pin) in the same commit. Names only, not counts — a count pin would churn on every
// duplicate-site edit without changing the completeness contract.
//
// Hand-scan record (the census grep is a FLOOR, plan-mandated survey): the template's prompt-build
// regions were re-scanned case-insensitively for interpolations the purity pattern misses. Result:
// every rejected args-touching site carries an explicit ??/||/ternary fallback or rides the
// ternary-gated doneWhenClause helper — zero missed fallback-free sites, no survey-derived
// corrections. Known structural false-negative classes of the mechanical pattern (recorded, not
// silently absorbed): (a) bracket-indexed roots (`${tasks[0].id}`) are not admitted by the dotted
// chain regex — none exist in the template today; (b) an interpolation nested inside another
// expression's braces is seen only via the flat re-scan of the outer span text; (c) a task/phase
// object bound to a local outside the root whitelist (ph/plan/task/t/r.task) — e.g.
// `submodLandTask.targetRepo` — is censused but not mapped to an args field; harmless today
// (targetRepo is exempt and the site is ternary-gated), red-flagged here so a future non-exempt
// case is not silently unrequired; (d) an UNTAGGED template literal that feeds a pt span (#1777):
// ptSpans() walks pt-tagged literals only, so a fragment built in a plain backtick literal and
// interpolated into a pt span later is invisible to the extractor — the live instance is the
// Provision-barrier build's `const ensures = tasks.map(t => \`   provision-worktrees.sh
// ensure-worktree ${t.worktree} ${t.branch} …\`)`, whose fallback-free `t.worktree` / `t.branch`
// reads reach the dispatched prompt via `${ensures}` and are censused here only as the outer
// `ensures` entry; bounded today because both fields are extracted from other pt sites, but a
// FUTURE bare arg read added only inside such a helper would not red this census. Escaped `\${…}`
// pairs are prompt PROSE (agent-resolved placeholders) and are dropped by the tokenizer — e.g. the
// release-baseline rule's `\${integrationBranch}...\${task.branch}` mirror text is not a live site.
const BARE_INTERPOLATION_CENSUS = [
  'PLAN_DEFECT_SENTINEL', 'PREFLIGHT', 'SCRIPT', 'artifactLine', 'authArtifactLine', 'authCriteria',
  'baseDesc', 'batchSha', 'block', 'depSha', 'depth', 'doneWhenLog', 'e.preMergeTip', 'e.taskId',
  // ev.sha left this census (in-band-absorb-default 4.1 polish): the pinned-sha slot renders the
  // `pin` local (ev.sha, else the row's own sanitized sha for a gate-audit pseudo-task).
  'ensures', 'ev.round', 'f.file', 'f.severity', 'f.suggested_fix', 'gateHeadSha',
  'ghUser', 'guardEvidence', 'guardSpecificity', 'integratedTip.gate_output',
  'intent', 'landedTipAnchor', 'lens', 'm.file', 'm.line', 'm.taskId', 'memoryLocalRoot',
  'nearMissDiag', 'owned', 'ph.epicIssue', 'ph.id', 'ph.integrationBranch',
  'ph.title', 'ph.workingBranch', 'pin', 'pinEvidence', 'pinStatus', 'pinStatusLine', 'plan.gate',
  'polishBranch', 'polishWorktree', 'provisionSource', 'r.check', 'r.condition',
  'r.fence', 'r.n',
  // r.reentryBase (in-run-finding-resolution Task 1.1): ternary-gated at its single site (the
  // re-entry PREFLIGHT range falls back to HEAD~30..HEAD when absent) — construction-guaranteed.
  // reentryRange is that ternary's pt-built product (always a string).
  'r.reentryBase', 'reentryRange',
  // The #2485 range revert and tip probe (Task 1.1). revertWorktree / revertApproved / revertBranch are
  // rangeRevertScript's params (#1860 — named so the bare generic `worktree`/`branch` never sit in this
  // default-deny list): r.task.worktree / r.task.branch (entry-validated) or the polish worktree and
  // branch, and an approved sha gated isSha by rangeRevertOf, or the terminal's terminalApproved (the
  // probe's pre_sha, else ph.integrationBranch). revertSite is a literal at both aceRevertDispatch
  // callers and revertApproved its approvedShaOf local; revertWhy is a string at both terminalRevert
  // callers. revertRange.approved is gated by rangeRevertOf. The probe* names are tipProbe's
  // destructured params: literals, entry-validated task/phase fields, or approvedShaOf at both callers.
  // ev.pre is aceEvidence's copy of a usable probe's pre_sha (isSha-checked by usableTipProbe).
  // TRAILER_BLOCK_RULE is a plain-string module const (the NEVER_MOVE_LITERAL precedent).
  'revertWorktree', 'revertApproved', 'revertBranch', 'revertSite', 'revertWhy', 'revertRange.approved', 'terminalApproved',
  'probeId', 'probeSite', 'probeWorktree', 'probeBranch', 'probePre', 'probeApproved', 'ev.pre', 'TRAILER_BLOCK_RULE',
  // aceTipSha (#1860, same sweep): aceGateGreen's and aceScopeClause's param: the probed batch/subset/
  // re-entry tip (the tip probe's tip_sha, isSha-checked by usableTipProbe), construction-guaranteed
  // a string.
  'aceTipSha',
  // aceCharge (absorb-budget, D5): the `Ace-Charge: <task>:<n>` trailer value at the three ace-side
  // commit prompts — concatenation-built from r.task.id (entry-validated) and r.task.absorbRounds
  // (barrier-seeded, then integer-guarded at the wave thunk) — construction-guaranteed a string.
  'aceCharge',
  // phaseBaseCmd (in-band-absorb-default D15): the evidence dispatch's PHASE DIFF step interpolates
  // the same merge-base shell substitution const the evItems fallback uses — a template-built
  // string, always defined. tip (D4): the diff-probe prompt's task tip — a const with an explicit
  // 'HEAD' fallback when the worker returned no usable head_sha — construction-guaranteed a string.
  // probeBase (#2057): the diff-probe range base — ph.integrationBranch, or a submodule task's
  // targetBase with its own '<targetBase>' placeholder fallback — construction-guaranteed a string.
  'phaseBaseCmd', 'tip', 'probeBase',
  // terminalCharge / terminalSha (in-band-absorb-default D3a, terminal-pass): the `Ace-Charge:
  // p<N>-polish:<n>` trailer value (concatenation-built from the polish pseudo-task id and its
  // seeded integer counter) and the terminal tip probe's tip_sha (isSha-checked by usableTipProbe)
  // before the prompts that interpolate it are built — both construction-guaranteed strings.
  'terminalCharge', 'terminalSha',
  'r.supersedes', 'r.tag', 'r.task.branch', 'r.task.id', 'r.task.targetRepo',
  'r.task.worktree', 'r.unsupported', 'refineryLandPath', 'refineryP', 'refineryPath', 'roundLimit', 's.lens',
  's.seat', 's.verdict', 'submodLandTask.targetRepo', 'submodPath', 't.id', 'task.branch',
  'task.doneWhen', 'task.id', 'task.title', 'task.worktree', 'taskId', 'testPatternArg', 'trailer',
  'workerIntentClause', 'working',
  // MEMORY_TOOL / memoryQueryRepoArg (2026-10-27-memory-query-mcp-tool D1): the hook's tool-name literal
  // (a plain-string module const) and the `, repo: <root>` fragment (a ternary with an explicit '' arm) —
  // both construction-guaranteed strings; the enclosing MEMORY_QUERY_TOOL_LINE renders only when
  // memoryLocalRoot is threaded (its own ternary), so memoryLocalRoot's existing row covers that span.
  'MEMORY_TOOL', 'memoryQueryRepoArg',
  // Gate-log stamp + segmented gate (engine-and-audit-verdict-integrity Task 5.1, #2086/#2094): the four
  // pt-built module consts (GATE_LOG_STAMP / PARTIAL_LOG_RULE / GATE_LOG_READ_RULE / GATE_LOG_UNTHREADED)
  // are construction-guaranteed strings; `shape` is backgroundGateRule's param, a pt-built literal at
  // every call site; `e.gateLogPath` carries an explicit || conventional-path fallback at evItems;
  // `opts.label` is a segment continuation header's site label — every call site passes one.
  'GATE_LOG_READ_RULE', 'GATE_LOG_STAMP', 'GATE_LOG_UNTHREADED', 'PARTIAL_LOG_RULE', 'e.gateLogPath', 'opts.label', 'shape',
  // gateArtifactLine: kind is a literal at both callers; path is guarded by gateLogPathOf.
  'kind', 'path',
  // Dispatch-owned gate capture strings are constructed before their prompt carriers run.
  'prefix', 'evidenceCapture.clause',
  // reconcileMerge builds cause from a tagged death or a literal fallback.
  'cause',
  // c.row / c.rationale (engine-and-audit-verdict-integrity Task 7.1 ace, D6 citations): the `c` local is
  // citationOf's own return at citationStamp and citationSoundnessClause's map callback, gated truthy
  // before either span renders; `row` is the matched threaded row (non-empty by the membership check)
  // and `rationale` carries citationOf's explicit || fallback — both construction-guaranteed strings.
  'c.rationale', 'c.row',
  // m.demoteReason (engine-and-audit-verdict-integrity Task 9.1, D13 drain provenance, #1799): the
  // filing-prompt row's `engine demote reason:` cell — the span sits inside a
  // `typeof m.demoteReason === 'string' && m.demoteReason ? pt\`…\` : ''` conditional, so it only
  // renders a non-empty string (the guard is the site's own ternary, never a fallback in the span).
  'm.demoteReason',
  // dc.dispatch / dc.why (9.1 re-entry a6): the same filing row's `drain cause:` cell — `dc` is the
  // hoisted `drainCauseOf(m)` local, and the span sits inside a `dc ? pt\`…\` : ''` conditional;
  // drainCauseOf's shape guard returns null unless dispatch is a string, and String-coerces why.
  'dc.dispatch', 'dc.why',
  // NEVER_MOVE_LITERAL (verdict-integrity Task 12.1 ace): the by-literal sentence interpolated at the five
  // ace-family, sweep and terminal builds — a plain-string module const, construction-guaranteed.
  'NEVER_MOVE_LITERAL',
  // The pin-content comparison runs only after verifyPinTransfer proves these full Git SHAs.
  'pinProof.content_sha', 'pinProof.dispatch_base', 'pinProof.head_sha',
  // Backward-chain doctrine (2026-09-11-backward-chain-doctrine Task 2.1): correctiveRound is the
  // corrective-round helper's output (total: an integer >= 1 at every site); variant is a string literal at each of the seven fix-applying call
  // sites and variantClause its BACKWARD_CHAIN_VARIANTS lookup (an unknown name pt-throws loudly);
  // examplesPointer is chainExamplesPointer's string product; e.round is a recorded digest entry's
  // round, stamped from the same helper; file is chainDepthLine's reference pointer, a module-const
  // string at both callers (CHAIN_FIX_MD, CHAIN_AUDIT_MD) — all construction-guaranteed.
  'correctiveRound', 'e.round', 'examplesPointer', 'file', 'variant', 'variantClause',
  // #2485 Task 2.1: MERGE_FACTS_RULE and NEVER_MOVE_MERGED are plain-string module consts; neverMoveStep's
  // three params are r.task.worktree, r.task.branch and ph.integrationBranch at all four step (a) copies,
  // each entry-validated — all construction-guaranteed strings.
  'MERGE_FACTS_RULE', 'NEVER_MOVE_MERGED', 'nmBranch', 'nmTarget', 'nmWorktree',
]

// #1767 (D10): every slug word stoplisted or sub-length used to EMPTY ownTokens and silently switch the
// leak floor off for the whole run. With plan.file present the plan basename is the single anchor
// token, the fallback is logged, and a leak still refuses; the basename itself is the token that passes.
const STOPLIST_ARGS = (intent) => PROVISION_ARGS({
  planSlug: 'test-and-fix',
  plan: { file: 'docs/plans/test-and-fix.md', gate: 'make gate' },
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/test-and-fix/phase-3', workingBranch: 'dev/test-and-fix' },
  intent,
})

// ---- preMerged-dialect fixtures (fold #1704, End state 24) --------------------------------

const PRE_MERGED_ARGS = () => PROVISION_ARGS({
  recovery: { sanctioned: true },
  phase: { id: 2, title: 'P2', integrationBranch: 'integration/wtprov-a/phase-2', workingBranch: 'dev/wtprov-a' },
  tasks: [
    { id: '2.1', issue: 201, title: 'Task 2.1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: '2.2', issue: 202, title: 'Task 2.2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
    { id: '2.3', issue: 203, title: 'Task 2.3', planSlice: 's3', roster: [{ lens: 'correctness' }] },
    { id: '2.4', issue: 204, title: 'Task 2.4', planSlice: 's4', roster: [{ lens: 'correctness' }] },
  ],
})

const preMergedImpl = (preMerged) => (prompt, opts) => {
  if (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'provision-barrier') return { ok: true, preMerged }
  return defaultImpl(prompt, opts)
}

// ---------------------------------------------------------------------------
// in-run-finding-resolution Task 1.1 — the remaining End-state fixture families:
// reaudit-sweep (2), new-test-absorb (3), citation-resolve (4), citation-unsound (5),
// ask-content-key (6), ask-collision + lens-suffix (7), ace-group-path (8),
// disposition-prompt-widened (10), ruled-ask-absorb (12).
// ---------------------------------------------------------------------------

// Quiet gate-audit fallback: the gate-audit-family lanes return clean approvals so their sink
// lane never re-raises the roster findings under test (ask-resolution fixtures need asks[] exact).
const quietGate = (base) => (prompt, opts) => {
  if (seatOf(opts) === 'war-auditor' && (opts.label || '').startsWith('gate-audit:'))
    return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
  return base(prompt, opts)
}

// ---- auditor-evict (in-band-absorb-default D16, ADR 0042, PIN-18) ----
// The card's `### \`execution-evidence\` gate-audit checklist (reserved lens)` section (4,426 B, one
// contiguous block: heading, blank line, body, trailing blank line) moved byte-identical to
// skills/war/references/gate-audit-checklist.md. (a) extract by construct (the `###` heading → end of
// file, the section's only terminator there) and assert BYTE equality against the pinned SHA-256 of the
// pre-eviction card bytes (`git show 581a654:agents/war-auditor.md`, lines 63–74) — a reword, a
// dropped bullet, or a re-flow reds; a sanctioned later edit re-pins the digest in the same commit
// with its rationale. (b) the card keeps the heading over the fixed trigger pointer and no longer
// carries the body.
// Parallel repository gate: completed suites emit out of order. Require the final completion marker
// before treating an absent mapped path as HARD; all pre-existing checklist duties are retained.
const GATE_AUDIT_CHECKLIST_SHA256 = 'e1ff1f342a87d3c49c2c3d91f7c1b72ad69896fe096964e22c9eded678cfc9f2'

// A citation-resolved finding: the seat matched the parked ask's NAMED trade-off to a threaded
// standing adjudication row and returns disposition:'absorb' + citation (A2 — panel judgment),
// KEEPING the parked ask's `ask` field verbatim (the resolve contract, both prompt layers). The
// TITLE deliberately DIFFERS from ask.question so the fixture discriminates: a resolve keyed on
// the title alone would miss the parked record (whose key derives from the round-1 question).
const citationF = () => ({ severity: 'Minor', title: 'mirrored value rides docs/x.md', file: 'docs/x.md',
  rationale: 'ruled by standing row', disposition: 'absorb',
  ask: { question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source'] },
  citation: { row: 'ADJ-7: doc facts point at the source, never mirror', rationale: 'the row rules the mirror-vs-point trade-off this ask names' },
  suggested_fix: 'replace the mirrored value with a source pointer' })
// Args for the citation family: the row-existence floor admits only citations whose `row` matches
// a THREADED adjudication row (exact, or the threaded row contains the cited text at ≥ 24 characters — D11), so these fixtures thread the
// standing set (the row text carries the run's own 'wtprov' slug token for the provenance floor).
const CITED_ADJ = ['ADJ-7: doc facts point at the source, never mirror — ruled at the wtprov decompose gate']
const CITE_ARGS = (over = {}) => ACE_ARGS({ adjudications: CITED_ADJ, ...over })

// --- Registry-coverage fixes (attempt-1 audit Majors): remintKey re-key, queuedKeys, cross-seat merge ---
// Shared slice harness: dispositionOf → allApprove covers parkAsk/demote/the four registries/
// remintKey/remintBlock/corroborateSurvivor/routeToSweep/routeReauditMinors. minorsOf is defined
// ABOVE the slice, so a shape-faithful stub is injected (seat-stamped copies, Minor/Nit only).
const registrySlice = (runOverride = {}) => {
  const sliceStart = src.indexOf('const dispositionOf')
  const sliceEnd = src.indexOf('const allApprove')
  assert.ok(sliceStart !== -1 && sliceEnd > sliceStart, 'the dispositionOf→allApprove registry slice is locatable')
  // aceRelPath is declared inside the slice (file scope, below askContentKey); RELEASE_SLOT_FILES /
  // BARRIER_TOKENS / DEMOTE_REASONS are the module-top mirrors — injected as the canonical exports
  // (the D2 registry rows deepEqual them).
  const harness = new Function('log', 'notes', 'minorsFiled', 'asks', 'aced', 'phaseCloseQueue', 'carriedPhaseClose', 'minorsOf', 'run', 'RELEASE_SLOT_FILES', 'BARRIER_TOKENS', 'DEMOTE_REASONS',
    src.slice(sliceStart, sliceEnd)
    + '\nreturn { askContentKey, remintKey, remintBlock, parkAsk, fileFollowUp, recordAced, routeToSweep, routeReauditMinors, corroborateSurvivor, mergeSeat, seatsListOf, normalizeFinding, normalizeSeat, queuedKeys, liveTaskRecords, diffFilesByTask, dispositionOf, intakeFloor, demote }')
  const state = { logs: [], notes: [], minorsFiled: [], asks: [], aced: [], phaseCloseQueue: [], carriedPhaseClose: [] }
  const minorsOf = seats => seats.flatMap(s => (s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit').map(f => ({ seat: s.seat, sha: s.audit_sha ?? null, ...f })))
  const api = harness(m => state.logs.push(m), state.notes, state.minorsFiled, state.asks, state.aced, state.phaseCloseQueue, state.carriedPhaseClose, minorsOf, { ace: true, ...runOverride }, RELEASE_SLOT_FILES, BARRIER_TOKENS, DEMOTE_REASONS)
  return { ...state, ...api }
}

// ---------------------------------------------------------------------------
// #1913 — wave-side ace stage, delta-scaled re-audit, and pin transfer.
// The ace batch, its PIN-12 gate check, its re-audit and the bisection/re-entry
// ladders moved OUT of the serial merge queue into the wave thunk; the merge slot
// gained a mechanical pin-transfer probe. Covers End states 3, 4, 5, 6 and 9.
// ---------------------------------------------------------------------------

// Two-seat roster so a delta-scaled round can re-run ONE lens and transfer the other.
const PT_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
    roster: [{ lens: 'correctness' }, { lens: 'security' }] }],
  run: { ace: true },
  ...over,
})
// An approving seat carrying `findings`, echoing the pin it was dispatched at.
const seatAt = (label, lens, sha, findings = []) => ({ seat: label, lens, audit_sha: sha, verdict: 'approve', findings, confidence: 'high' })
// The two-seat impl: round 1 raises `first` from the correctness seat only; every later round approves
// clean. `aceResult` is what the ace worker returns (head_sha + the git-derived ace_diff_files).
const ptImpl = (first, aceResult, over = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-worker') return aceResult
  if (seat === 'war-auditor') {
    const lens = /security/.test(opts.label || '') ? 'security' : 'correctness'
    // #1942: a beef0001-pinned dispatch is the merge-slot MISMATCH re-audit — mark its seat name
    // so a pinTransfers row built from the FRESH panel is observably distinct from one built
    // from the stale pre-rebase r.seats (whose seat names carry no mark).
    if (/beef0001/.test(prompt)) {
      return { ...seatAt('reaudit:' + opts.label, lens, 'beef0001', []), ...(over.seatOver ? over.seatOver(lens, 'beef0001') : {}) }
    }
    const sha = (prompt.match(/AUDIT PIN: the worker reports commit ([0-9a-f]+)/) || [])[1] || (/ace00001/.test(prompt) ? 'ace00001' : 'deadbeef')
    const findings = (sha === 'deadbeef' && lens === 'correctness') ? first : []
    return { ...seatAt(opts.label, lens, sha, findings), ...(over.seatOver ? over.seatOver(lens, sha) : {}) }
  }
  if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}
const ACE_FILE = 'skills/war/assets/x.js'
const aceOk = (over = {}) => ({ task_id: 't1', status: 'implemented', head_sha: 'ace00001',
  ace_diff_files: [ACE_FILE], files_changed: [ACE_FILE], tests: { unit: 1 }, ...over })
const lensesOf = (calls, sha) => calls.filter(c => isAuditor(c) && c.prompt.includes(sha))
  .map(c => (c.opts.label || '').split(':').pop()).sort()

// The merge-slot MISMATCH re-audit is a re-audit like any other, so its OWN fresh Minor/Nits must
// walk the same disposition ladder the six wave-side ace-family call sites use. Before #1931 the
// mismatch arm called auditRound and never routed: every fresh Minor/Nit it raised was dropped on
// the floor. The absorb arm needs the noReentry opt — aceReentry is wave-side only, so the merge
// slot's r.reentryQueue has no drain left and a queued absorb would strand just as silently.
// Seats echo the pin they were dispatched at, so no finding is stripped by the pin-mismatch guard.
const ptMismatchImpl = (reFindings) => (prompt, opts) => {
  if (seatOf(opts) !== 'war-auditor') return ptImpl([], aceOk())(prompt, opts)
  const lens = /security/.test(opts.label || '') ? 'security' : 'correctness'
  const sha = /beef0001/.test(prompt) ? 'beef0001' : 'deadbeef'
  return seatAt(opts.label, lens, sha, (sha === 'beef0001' && lens === 'correctness') ? reFindings : [])
}

// ---- #1956: validator-semantics fixtures for the dispatch schemas' conditionals ----
// The #1951 arm-split was asserted only by a source-shape regex; nothing exercised validation
// semantics (runPhase's fake dispatch ignores `schema`). These fixtures evaluate the SHIPPED
// schema objects against a vendored draft-07-subset evaluator.
// HARNESS RULING (recorded): vendored, zero dependencies — the repo's no-package.json property
// is load-bearing, so no ajv. The evaluator implements EXACTLY the keyword union of the schemas
// it evaluates (enumerated 2026-08-31): type, properties, required, if, then, const, enum,
// items, minItems, minLength — a deliberate subset, grown only via the census below.
// SEMANTIC ANCHOR: live probe 2026-08-31, Claude Code 2.1.251 — a bare {"gate_green": true}
// reply was rejected with: root: must have required property 'head_sha', root: must match
// "then" schema — and the agent retried with the sha. These fixtures prove the vendored
// evaluator agrees with that observed behaviour on the same reply shapes.
// RESIDUAL: a future harness divergence from draft-07 conditionals is invisible to in-repo
// tests — re-probe live on harness upgrades.
const SCHEMA_KEYWORDS_SUPPORTED = new Set(['type', 'properties', 'required', 'if', 'then', 'const', 'enum', 'items', 'minItems', 'minLength'])
const evalSchema = (schema, v) => {
  if (!schema || typeof schema !== 'object') return true
  if ('const' in schema && v !== schema.const) return false
  if (schema.enum && !schema.enum.includes(v)) return false
  if (schema.type) {
    const t = schema.type
    if (t === 'object' && (typeof v !== 'object' || v === null || Array.isArray(v))) return false
    if (t === 'array' && !Array.isArray(v)) return false
    if ((t === 'string' || t === 'boolean' || t === 'number') && typeof v !== t) return false
  }
  if (schema.minLength !== undefined && typeof v === 'string' && v.length < schema.minLength) return false
  if (schema.minItems !== undefined && Array.isArray(v) && v.length < schema.minItems) return false
  if (schema.items && Array.isArray(v) && !v.every(x => evalSchema(schema.items, x))) return false
  // required applies to OBJECTS only (draft-07) — a non-object instance ignores it; rejecting it
  // here was a latent false RED for any future type-less subschema (snipe, absorb Minor).
  if (schema.required && typeof v === 'object' && v !== null && !Array.isArray(v) && !schema.required.every(k => k in v)) return false
  // properties bind ONLY when the field is present (draft-07) — pinned by its own case below.
  if (schema.properties && v && typeof v === 'object') {
    for (const [k, sub] of Object.entries(schema.properties)) if (k in v && !evalSchema(sub, v[k])) return false
  }
  // if/then: an instance failing the `if` subschema SKIPS `then` (draft-07) — pinned below.
  if (schema.if) { if (evalSchema(schema.if, v) && schema.then && !evalSchema(schema.then, v)) return false }
  return true
}
// Census scope = the schemas the evaluator evaluates. GROWTH RULE: evaluate a schema before
// listing it here — a listed-but-unevaluated schema is exactly the regex-only gap #1956 closed.
const EVALUATED_SCHEMAS = ['GATE_CHECK', 'AUDIT_VERDICT', 'MERGE_RESULT', 'PIN_TRANSFER']
const grabSchema = (name) => {
  const i = src.indexOf('const ' + name + ' = {')
  assert.ok(i >= 0, name + ' schema found in the template source')
  let d = 0
  const j = src.indexOf('{', i)
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++
    // The literal references the inline BARRIER_TOKENS mirror (barrier-list, D1) — bound here from the
    // canonical export (the D2 mirror registry deepEquals the two).
    if (src[k] === '}') { d--; if (d === 0) return new Function('BARRIER_TOKENS', 'return (' + src.slice(j, k + 1) + ')')(BARRIER_TOKENS) }
  }
  throw new Error('unbalanced ' + name)
}
// Walk ONLY schema-bearing positions: the bare schema, `properties` VALUES (never its keys),
// `items`, `if`, `then`.
const schemaKeywords = (node, out = new Set()) => {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return out
  for (const [k, v] of Object.entries(node)) {
    out.add(k)
    if (k === 'properties' && v && typeof v === 'object') for (const sub of Object.values(v)) schemaKeywords(sub, out)
    else if (['items', 'if', 'then'].includes(k)) schemaKeywords(v, out)
  }
  return out
}

// ---------------------------------------------------------------------------
// absorb-budget (in-band-absorb-default Phase 2 Task 1, D5 / PIN-7): the ace ladder's OWN round
// meter. r.task.absorbRounds is charged once per ace-side COMMIT (batch, re-entry, bisection
// subset), never by reverts, panels, or fix rounds; fixRounds counts blocking fix rounds and floor
// retries only. All three ace gates read `absorbRounds < run.absorbRounds`; a spent budget routes
// the rows to the phase-close sweep; open blockers HOLD the rows on r.task.pendingAbsorbs. Every
// ace-side commit carries `Ace-Charge: <task>:<n>`; the barrier's absorbCharges read seeds the
// counter on a relaunch. Each fixture is red with its engine arm deleted.
// ---------------------------------------------------------------------------

// Barrier impl: the git-topology barrier returns the given env-outcome; everything else falls back
// to the given base impl (aceBase / sweepBase / a buildSeqImpl).
const withBarrier = (env, base) => (prompt, opts) =>
  (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'provision-barrier') ? env : base(prompt, opts)

// Two seats raise one finding and DISAGREE on phaseClose; `pcLens` names the seat whose copy carries
// phaseClose:true, so the same impl drives both arrival orders (correctness convenes first).
const splitImpl = pcLens => (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-auditor' && label.includes(':t1:') && !label.startsWith('gate-audit:')) {
    const f = { severity: 'Nit', title: 'split across sinks', file: 'skills/war/assets/x.js', rationale: 'r', disposition: 'absorb' }
    if (label.endsWith(':' + pcLens)) f.phaseClose = true
    return { seat: label, lens: label.split(':').pop(), verdict: 'approve', confidence: 'high', findings: [f] }
  }
  return sweepBase([])(prompt, opts)
}
const SPLIT_ARGS = () => SWEEP_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }, { lens: 'simplicity' }] }] })

// Contradictory approve + Major reports must hold before entering the ace/merge path.
const approveBesideMajor = (findings) => ({ seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'approve', confidence: 'high',
  findings: [{ severity: 'Major', title: 'open blocker', file: 'skills/blk.js', rationale: 'still open' }, ...findings] })

// ===========================================================================
// in-band-absorb-default Phase 4 (Task 4.1): sweep exclusion set (D2), diff probe + intake filing
// floor (D4), demote-reason census (D13), ace-off routing (D14), gate-audit-family routing (D15).
// Fixture families: sweep-exclude, filing-floor, demote-census, ace-off-route, gate-audit-route.
// ===========================================================================

// Normalized whole-file scan (the terminal-pass fixture's idiom, Phase 5): strip line-comment
// prefixes, join lines, collapse whitespace, case-fold — so a retired literal cannot survive as a
// wrapped comment copy or a re-flowed string.
const normalizedSrc = () => src.split('\n').map(l => l.replace(/^\s*\/\/\s?/, '')).join(' ').replace(/\s+/g, ' ').toLowerCase()

// Sweep-family base (SWEEP_ARGS carries the config default roster, so the sweep convenes): the t1
// work-round seat raises `queued`; the per-task gate-audit seat raises `gate` (pin-equal audit_sha —
// the merge returns integration_sha 'beefcafe12', the evidence dispatch is answered with `evidence`);
// polish provisioning ok; the polish panel approves clean.
const p4Base = ({ queued = [], gate = [], evidence = null, worker = null, seatsOf = null } = {}) => (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-refiner' && /^polish-worktree:/.test(label)) return { ok: true }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return evidence ?? { perTask: [] }
  if (seat === 'war-worker') {
    const w = worker && worker(label)
    if (w) return w
    return { task_id: 't1', status: 'implemented', head_sha: label.startsWith('polish:') ? 'b01a5a00' : 'deadbeef', tests: { unit: 1 } }
  }
  if (seat === 'war-auditor') {
    const custom = seatsOf && seatsOf(label)
    if (custom) return custom
    if (label.startsWith('gate-audit:')) return { seat: label, lens: 'execution-evidence', verdict: 'approve', findings: gate, confidence: 'high', audit_sha: 'beefcafe12' }
    const f = label.includes(':t1:') ? queued : []
    return { seat: label, lens: 'correctness', verdict: 'approve', findings: f, confidence: 'high' }
  }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', working_sha: 'abcdef99' }
    : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const polishPromptOf = calls => (calls.find(c => (c.opts.label || '') === 'polish:phase-3') || {}).prompt || ''
const demotionOf = (out, title) => (out.minorsFiled || []).find(m => m && m.title === title)
const filingPromptOf = calls => (calls.find(c => c.opts.dispatchKind === 'file-followups') || {}).prompt || ''

// ---- filing-floor (D4, End state 10) ----------------------------------------------------------

const PROBE = { 'diff-probe': { diff_files: ['skills/war/assets/x.js', './docs/in.md'] } }
const minor = (over = {}) => ({ severity: 'Minor', title: 'plain minor', file: 'skills/war/assets/x.js', rationale: 'r', ...over })
// One work-round seat raising `first`, clean on every re-audit; the gate-audit seat clean.
const floorImpl = (first) => buildSeqImpl({ 'audit:t1:correctness': [approveWith('audit:t1:correctness', first)] }, p4Base())

// Default-deny census over every demote() call whose disposition argument can evaluate to
// 'follow-up' — the literal shape and the severity-ternary shape. Each site's reason argument must
// LEAD with a DEMOTE_REASONS member literal (the variable-head sites carry a literal prefix ahead
// of the variable). Pinned count = a dated snapshot at land; an unwired negative reference proves
// the matcher and the classifier see an unprefixed site.
const DEMOTE_SITE_RE = /demote\(\s*[^,()]+,\s*(?:'follow-up'|f\.severity === 'Minor' \? 'follow-up' : 'note'),\s*([^\n]*)/g
const demoteSites = text => {
  const sites = []
  const code = text.replace(/^\s*\/\/.*$/gm, '')
  for (const m of code.matchAll(DEMOTE_SITE_RE)) sites.push({ index: m.index, reason: m[1] })
  return sites
}
const reasonPrefixOf = reason => { const m = reason.match(/^['"](demote:[a-z-]+)/); return m ? m[1] : null }
// Unwired negative reference (never executed by the engine): a follow-up demote whose reason has no prefix.
const NEGATIVE_REF = "demote(f, 'follow-up', 'failed absorb — no prefix here at all')"

// ---- gate-audit-route (D15, End state 13) -----------------------------------------------------

const gaAbsorb = (over = {}) => ({ severity: 'Minor', title: 'gate-audit absorb', file: 'docs/ga.md', rationale: 'r', suggested_fix: 'fix it', disposition: 'absorb', ...over })

// PIN-17 / PIN-12: the shared DISPOSITION RULE clause (BARRIER_TOKENS-rendered) rides each of the
// three gate-audit dispatched prompts — asserted on the dispatched prompt by label, never on `src`
// (a `src` grep is satisfied by the roster auditPrompt literal alone).
const gaPromptOf = (calls, label) => (calls.find(c => (c.opts.label || '') === label) || {}).prompt || ''
const assertDispositionRuleOn = (prompt, label) => {
  assert.ok(prompt, 'presence guard: ' + label + ' convened')
  assert.ok(prompt.includes('DISPOSITION RULE: every Minor/Nit finding carries a disposition'), label + ' carries the DISPOSITION RULE clause')
  assert.ok(prompt.includes('follow-up is legal only with a barrier cited in the structured `barrier` field'), label + ' carries the `barrier` field instruction')
  for (const tok of ['barrier:release-slot', 'barrier:underspecified', 'barrier:rationale-comment', 'barrier:trade-off']) assert.ok(prompt.includes(tok), label + ' names ' + tok)
  assert.ok(prompt.includes('a note that names a fix in a touched file is applied'), label + ' carries the note clause')
}

// ===========================================================================
// in-band-absorb-default Phase 5 (Task 5.1): the terminal pass (D3a) and the held-phase carry (D3b).
// Fixture families: terminal-pass, held-carry.
// ===========================================================================

// Terminal-pass base: sweepBase with a merged sweep whose POLISH PANEL raises `polishFindings` on its
// first call (the terminal re-audit — the same seat label, second call — answers `terminalSeat`, an
// approve with `terminalFindings` by default); the terminal worker returns `terminalWorker`
// (head_sha '7e4a1a10'); the terminal merge returns `terminalMerge` (merged). `sweepWorker`
// overrides the polish worker's result (e.g. a files_changed report).
// #2485 D17: the terminal revert is the shared range revert of the polish branch above the post-polish
// tip (the harness resolves the integration-branch ref to FIXTURE_REF_TIP), naming the terminal sha.
const TERMINAL_RANGE_REVERT = new RegExp('FORWARD-REVERT the terminal-pass range[^\\n]*7e4a1a10[^\\n]*-c core\\.hooksPath=/dev/null revert --no-commit ' + FIXTURE_REF_TIP + '\\.\\.HEAD')
const terminalImpl = ({ queued = [queuedAbsorb()], polishFindings = [{ severity: 'Minor', title: 'polish-panel absorb', file: 'docs/y.md', rationale: 'introduced by the polish diff', disposition: 'absorb' }],
  terminalSeat = null, terminalFindings = [], terminalWorker = null, terminalMerge = null, sweepWorker = null, terminalRevert = null,
  terminalSeatDrop = false, terminalSeatThrow = null, terminalThrow = null } = {}) => {
  const base = sweepBase(queued)
  let polishAudits = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-auditor' && /^audit:p3-polish:/.test(label)) {
      polishAudits++
      if (polishAudits === 1) return { seat: label, lens: label.split(':').pop(), verdict: 'approve', findings: polishFindings, confidence: 'high' }
      if (terminalSeatDrop) return null   // a dropped seat dispatch — every terminal re-audit call (auditRound's two retries included) returns nothing
      if (terminalSeatThrow) throw terminalSeatThrow   // a dead seat dispatch (INFRA_DEATH_RE) — persists past auditRound's retries
      return terminalSeat || { seat: label, lens: label.split(':').pop(), verdict: 'approve', findings: terminalFindings, confidence: 'high' }
    }
    if (seat === 'war-worker' && label.startsWith('terminal:')) {
      if (terminalThrow) throw terminalThrow   // the infra-death arm (INFRA_DEATH_RE) — mirrors the sweepDeath fixture
      return terminalWorker || { task_id: 'p3-polish', status: 'implemented', head_sha: '7e4a1a10', tests: { unit: 1 } }
    }
    if (seat === 'war-worker' && label.startsWith('polish:') && sweepWorker) return sweepWorker
    if (seat === 'war-refiner' && label === 'merge:p3-terminal') return terminalMerge || { mode: 'merge-task', status: 'merged', integration_sha: '7e4a1a12' }
    if (seat === 'war-refiner' && label.startsWith('terminal-revert:')) return terminalRevert || { ok: true }
    return base(prompt, opts)
  }
}
const terminalCalls = calls => calls.filter(c => (c.opts.label || '') === 'terminal:phase-3')
const carriedOf = (out, title) => (out.carriedPhaseClose || []).find(f => f && f.title === title)

// ===========================================================================
// FIX-ROUND DOCTRINE (#2097, engine-and-audit-verdict-integrity Task 1.4, D24/PIN-27) — the
// `## The rules` section of skills/war/references/fix-round-doctrine.md is the canonical body; the
// enumerated fix-applying builds (FIX_NEEDED, ACE BISECTION SUBSET, ACE RE-ENTRY BATCH) interpolate ONE
// shared constant carrying it byte-equal. The batch ace ADVISORY POLISH (--ace) build, the
// phase-close sweep polish build and the TERMINAL PASS build are deliberately excluded under the
// plan scope (agents/war-worker.md's trigger pointer still reaches those workers). The first-pass worker prompt
// and the auditor prompts carry nothing.
// Controls: a delete-and-trace per build (drop that build's interpolation ⇒ its prompt loses the
// section while its siblings keep it) and a no-false-positive control (a reworded rule never
// appears in any prompt; the byte-sensitive pin is the includes(rules) equality itself).
// ---------------------------------------------------------------------------
const fixRoundDoctrineMd = readFileSync(join(here, '../references/fix-round-doctrine.md'), 'utf8')
const fixRoundRulesSection = () => {
  const after = fixRoundDoctrineMd.split('## The rules\n')[1]
  assert.ok(after, 'fix-round-doctrine.md carries a `## The rules` section')
  return after.split('\n## ')[0].trim()
}
// Each fix-applying build: the fixture that reaches it, the capture predicate, and the build's head
// string (the anchor the delete-and-trace control mutates after).
const FIX_APPLYING_BUILDS = [
  { site: 'FIX_NEEDED fix prompt', head: 'pt`FIX_NEEDED for WAR task',
    run: (source) => runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), fixNeededImpl(), {}, source),
    find: (c) => c.find(x => /^fix:t1:/.test(x.opts.label || '')) },
  { site: 'ACE BISECTION SUBSET prompt', head: 'pt`ACE BISECTION SUBSET for WAR task',
    run: (source) => runPhase(ACE_ARGS(), bisectSubsetImpl(), {}, source),
    find: (c) => c.find(x => /^ace:subset:t1:a2$/.test(x.opts.label || '') && (x.prompt || '').includes('ACE BISECTION SUBSET')) },
  { site: 'ACE RE-ENTRY BATCH prompt', head: 'pt`ACE RE-ENTRY BATCH for WAR task',
    run: (source) => runPhase(ACE_ARGS(), reentryImpl(), {}, source),
    find: (c) => c.find(x => /^ace:reentry:t1:a2$/.test(x.opts.label || '') && (x.prompt || '').includes('ACE RE-ENTRY BATCH')) },
]
// Drop the interpolation line at ONE build only: the first `+ FIX_ROUND_DOCTRINE_CLAUSE` after that
// build's head string. The census below proves the mutation targets exactly one site.
const dropDoctrineAt = (head) => {
  const at = src.indexOf(head)
  assert.ok(at >= 0, `build head present in the template: ${head}`)
  const re = /\n[ ]*\+ FIX_ROUND_DOCTRINE_CLAUSE(?=\n)/
  const tail = src.slice(at)
  assert.ok(re.test(tail), `an interpolation line follows the build head: ${head}`)
  return src.slice(0, at) + tail.replace(re, '')
}

// ===========================================================================
// BACKWARD-CHAIN DOCTRINE (plan 2026-09-11-backward-chain-doctrine, Task 2.1; D1–D16, PIN-1..PIN-11).
// Three `## The rules` blocks ride the dispatched prompts byte-equal from skills/war/references/
// backward-chain-{worker,fix,audit}.md: the worker block on the work: build ONLY; the fixer block on
// the seven fix-applying builds and nowhere else (no site carries both); the audit block on the
// roster-seat auditPrompt at corrective round >= 2 only (round 1 byte-identical to a round-omitted
// build, PIN-10; the three gate-audit-family seats carry nothing). Each fixture title below is the
// exact string an End state greps (`backward-chain: …`). Extraction follows the FIX_ROUND_RULES idiom
// above (src.indexOf → slice → assert.equal); reach fixtures reuse the existing per-site impls.
// ---------------------------------------------------------------------------
const chainRefMd = f => readFileSync(join(here, '../references/' + f), 'utf8')
const chainRulesSection = (md, file) => {
  const after = md.split('## The rules\n')[1]
  assert.ok(after, `${file} carries a \`## The rules\` section`)
  return after.split('\n## ')[0].trim()
}
const chainConst = (name) => {
  const head = 'const ' + name + ' = pt`'
  const at = src.indexOf(head)
  assert.ok(at >= 0, `${name} template literal present in the template`)
  const body = src.slice(at + head.length)
  const end = body.indexOf('`\n')
  assert.ok(end >= 0, `${name} template literal closes`)
  return body.slice(0, end).replace(/\\`/g, '`').trim()
}
const CHAIN_FIX_POINTER = '${CLAUDE_PLUGIN_ROOT}/skills/war/references/backward-chain-fix.md'
const CHAIN_WORKER_POINTER = '${CLAUDE_PLUGIN_ROOT}/skills/war/references/backward-chain-worker.md'
const CHAIN_AUDIT_POINTER = '${CLAUDE_PLUGIN_ROOT}/skills/war/references/backward-chain-audit.md'
const CHAIN_EXAMPLES_POINTER = '${CLAUDE_PLUGIN_ROOT}/skills/war/references/backward-chain-examples.md'
const CHAIN_DEPTHS = ['## Round 1', '## Round 2', '## Round 3 and later', '## Round 5 and later']
// The examples bank's H2 set between `## Entry shape` and `## Growth rules` (the D15 surface).
const chainExamplesH2s = () => {
  const md = chainRefMd('backward-chain-examples.md')
  const between = md.split('\n## Entry shape\n')[1].split('\n## Growth rules\n')[0]
  return [...between.matchAll(/^## (.+)$/gm)].map(m => m[1])
}
// `## Build variants` of the fixer file: [name, clause] per numbered entry.
const chainBuildVariants = () => {
  const section = chainRefMd('backward-chain-fix.md').split('\n## Build variants\n')[1].split('\n## ')[0]
  const rows = section.split('\n').filter(l => /^\d+\. /.test(l)).map(l => l.match(/^\d+\. ([^:]+): (.+)$/))
  assert.ok(rows.length && rows.every(Boolean), 'backward-chain-fix.md ## Build variants: numbered `<name>: <clause>` entries')
  return rows.map(m => [m[1], m[2]])
}
const chainCode = () => src.replace(/^\s*\/\/.*$/gm, '')   // comment-stripped source for reference censuses
// Reaches the batch ADVISORY POLISH ace (ace:polish:t1:a1): round-1 absorb, re-audit clean.
const polishAceImpl = () => buildSeqImpl(
  { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit()]), approveWith('audit:t1:correctness', [])] },
  aceBase([nit()]))
// The seven fix-applying builds: the head string the delete-and-trace control anchors on, the variant
// name the site passes, the fixture that reaches it, and the capture predicate (label-keyed).
const CHAIN_FIX_BUILDS = [
  { site: 'FIX_NEEDED', head: 'pt`FIX_NEEDED for WAR task', variant: 'FIX_NEEDED',
    run: (source) => runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), fixNeededImpl(), {}, source),
    find: c => c.find(x => /^fix:t1:/.test(x.opts.label || '')) },
  { site: 'ace subset', head: 'pt`ACE BISECTION SUBSET for WAR task', variant: 'ace subset',
    run: (source) => runPhase(ACE_ARGS(), bisectSubsetImpl(), {}, source),
    find: c => c.find(x => /^ace:subset:t1:/.test(x.opts.label || '')) },
  { site: 'ace re-entry', head: 'pt`ACE RE-ENTRY BATCH for WAR task', variant: 'ace re-entry',
    run: (source) => runPhase(ACE_ARGS(), reentryImpl(), {}, source),
    find: c => c.find(x => /^ace:reentry:t1:/.test(x.opts.label || '')) },
  { site: 'ace advisory polish', head: 'pt`ADVISORY POLISH (--ace) for WAR task', variant: 'ace advisory polish',
    run: (source) => runPhase(ACE_ARGS(), polishAceImpl(), {}, source),
    find: c => c.find(x => /^ace:polish:t1:/.test(x.opts.label || '')) },
  { site: 'floor family', head: 'const floorFix = await dispatchSite(', variant: 'floor family (add-test, make-pass, cite-budget, package-it)',
    run: (source) => runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), floorRetryImpl(), {}, source),
    find: c => c.find(x => /^add-test:t1:/.test(x.opts.label || '')) },
  { site: 'phase-close sweep', head: 'pt`PHASE-CLOSE COHERENCE SWEEP for WAR phase', variant: 'phase-close sweep',
    run: (source) => runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]), {}, source),
    find: c => c.find(x => (x.opts.label || '') === 'polish:phase-3') },
  { site: 'terminal pass', head: 'pt`TERMINAL PASS for WAR phase', variant: 'terminal pass',
    run: (source) => runPhase(SWEEP_ARGS(), terminalImpl(), {}, source),
    find: c => c.find(x => (x.opts.label || '') === 'terminal:phase-3') },
]
// Drop the fixer-block interpolation at ONE build only: the first `+ chainFixClause(` line after its head.
const dropChainFixAt = (head) => {
  const at = src.indexOf(head)
  assert.ok(at >= 0, `build head present in the template: ${head}`)
  const re = /\n[ ]*\+ chainFixClause\([^\n]*(?=\n)/
  const tail = src.slice(at)
  assert.ok(re.test(tail), `a chainFixClause interpolation line follows the build head: ${head}`)
  return src.slice(0, at) + tail.replace(re, '')
}
let chainFixCaptures = null   // memoized live captures of the seven fix prompts (tests run serially)
const chainFixPrompts = async () => {
  if (!chainFixCaptures) chainFixCaptures = await Promise.all(CHAIN_FIX_BUILDS.map(async b => {
    const live = b.find((await b.run(src)).calls)
    assert.ok(live && live.prompt, `${b.site}: dispatched (presence guard)`)
    return { ...b, prompt: live.prompt }
  }))
  return chainFixCaptures
}
// Two blocking rounds then approve, with marker-bearing notes and rationales: the digest fixture.
// audit r1 (corrective round 1) blocks on f1 → fix r1 → audit r2 (round 2) blocks on f2 → fix r2 →
// audit r3 (round 3) approves. Distinct title+file per round keeps the PIN-29 survival check quiet.
const CHAIN_F1 = { severity: 'Major', title: 'guard missed at the reader', file: 'skills/a.js', suggested_fix: 'add the guard at the reader',
  rationale: 'the reader dereferences the widened value\nupstream link: the producer widened the value one link earlier\nrelation: sibling' }
const CHAIN_F2 = { severity: 'Major', title: 'arm never proved red', file: 'skills/b.js', suggested_fix: 'prove the arm red by mutation',
  rationale: 'the new arm has no red control\nupstream link: the guard added at round 1 grew an arm\nrelation: residue' }
const CHAIN_WORKER_NOTES = 'Critical path:\n1. Done when: gate prints OK - done test: node --test prints ok\n2. guard the reader - done test: unit red then green   <- bottleneck\n3. tip deadbeef\nIgnore for now: the sibling task file - owned by t2'
// Round-2 multi-tag set (the examples-pointer join + dedup arm): two distinct tags plus a duplicate of one.
// Distinct title+file from every other fixture keeps the PIN-29 survival check quiet.
const CHAIN_F3 = { severity: 'Major', title: 'oracle shares the code under test', file: 'skills/c.js', suggested_fix: 'give the guard an independent oracle',
  rationale: 'the fixture reads the helper it tests\nupstream link: the guard added at round 1 has no oracle\nrelation: oracle' }
const CHAIN_F4 = { severity: 'Major', title: 'sibling site left unswept', file: 'skills/d.js', suggested_fix: 'apply the rule at the sibling site',
  rationale: 'the sibling push site keeps the old shape\nupstream link: the round-1 guard covered one push site\nrelation: sibling' }
const CHAIN_F5 = { severity: 'Major', title: 'second oracle shares the code under test', file: 'skills/e.js', suggested_fix: 'give the mirror fixture its own oracle',
  rationale: 'the mirror fixture reads the same helper\nupstream link: the mirror fixture copied the first\nrelation: oracle' }
// round3: the third audit's APPROVING findings (absorbs; [] ⇒ a clean approve) — an absorb here reaches the batch ace fixer.
const chainDigestImpl = (round2 = [CHAIN_F2], round3 = []) => {
  let auditN = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && label === 'work:t1') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 }, notes: CHAIN_WORKER_NOTES }
    if (seat === 'war-worker' && /^fix:t1:r(\d+)$/.test(label)) {
      const n = label.match(/r(\d+)$/)[1]
      return { task_id: 't1', status: 'implemented', head_sha: 'c0ffee' + n, tests: { unit: 1 },   // a hex sha, so the next round's pin repair passes
        notes: 'Outcome: End state 2\nChain: 2 <- reader <- tip\nBottleneck: the reader\nFix: round ' + n + ' guarded the reader and its sibling\nIgnore for now: the doc sentence - off every chain' }
    }
    if (seat === 'war-worker' && /^ace:polish:t1:/.test(label))
      return { task_id: 't1', status: 'implemented', head_sha: 'ace00002', tests: { unit: 1 }, notes: 'Fix: the ace absorbed the import nit\nIgnore for now: nothing - the absorb was the whole chain' }
    if (seat === 'war-auditor' && label.startsWith('audit:t1:')) {
      auditN++
      const findings = auditN === 1 ? [CHAIN_F1] : auditN === 2 ? round2 : null
      return findings ? { seat: label, lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings }
        : { seat: label, lens: 'correctness', verdict: 'approve', findings: auditN === 3 ? round3 : [], confidence: 'high' }
    }
    return defaultImpl(prompt, opts)
  }
}
const chainIndented = s => s.split('\n').join('\n      ')   // the digest indents a multi-line rationale's continuation lines
const chainAudits = calls => calls.filter(c => (c.opts.label || '') === 'audit:t1:correctness').map(c => c.prompt)
const chainFixes = calls => calls.filter(c => /^fix:t1:r\d+$/.test(c.opts.label || '')).map(c => c.prompt)

// ---------------------------------------------------------------------------
// Ask records carry their evidence (engine-and-audit-verdict-integrity D3, PIN-7, Task 3.1):
// the widened parkAsk corroborator entry (#1876) reaching the handoff (#1872), the side-Map key
// (#1878), the ruledAsks queuedKeys stamp (#1875), the queued-arm corroboration (#1874) and the
// coordinate-less ruled-ask refusal naming the coordinate (#1882).
// ---------------------------------------------------------------------------

// Two-seat roster: the SAME question raised by two seats on two files with two forks collides on
// askContentKey (task + question) — the second site and its option set must survive the merge.
const ASK_EVIDENCE_ARGS = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's',
  roster: [{ lens: 'correctness' }, { lens: 'security' }] }] })
const askEvidenceImpl = (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-auditor') {
    if (label.startsWith('gate-audit:')) return { seat: label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
    // audit_sha echoes the worker's head_sha (handoffImpl: deadbeef) — a mismatched pin would demote every row to a note.
    if (label === 'audit:t1:security') return { seat: label, lens: 'security', verdict: 'approve', confidence: 'high', audit_sha: 'deadbeef',
      findings: [askFinding({ title: 'mirror or point (y)', file: './docs/y.md',
        ask: { question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source', 'drop the value'] } })] }
    return { seat: label, lens: 'correctness', verdict: 'approve', confidence: 'high', audit_sha: 'deadbeef',
      findings: [askFinding(), askFinding({ title: 'lone question', ask: { question: 'keep or retire the contract?', fork: ['keep', 'retire'] } })] }
  }
  if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
  return handoffImpl(undefined)(prompt, opts)
}

// ===========================================================================
// Segmented gate, gate-log stamp and fallback (engine-and-audit-verdict-integrity Phase 5 Task 5.1;
// D7/D8, PIN-11/PIN-12, A4; #2086/#2094). The engine re-dispatches a merge-task `incomplete` under
// roundLimit (segmentedMerge — segmentedLand's shape, PIN-9's pair read); the refiner executes the
// partial-log read, so the D7 fallback is PROMPT CONTENT bound by its registry row — the engine
// never opens the log. The stamp (tip_sha: first, exit_code: last) is what makes the read decidable.
// ===========================================================================
// evalPt: evaluate a pt-tagged literal extracted from src (escaped backticks survive) — the exact
// bytes the dispatched prompt and the standing card must both carry.
const evalPt = (name) => {
  const m = src.match(new RegExp('const ' + name + ' = (pt`(?:[^`\\\\]|\\\\.)*`)'))
  assert.ok(m, name + ' pt-literal found in the template source')
  return new Function('pt', 'return ' + m[1])((strings, ...vals) => strings.reduce((o, s, i) => o + s + (i < vals.length ? vals[i] : ''), ''))
}
const isMergeT1 = (c) => /^merge:t1(:|$)/.test(c.opts.label || '') && seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Refine' && !c.opts.dispatchKind

// ---------------------------------------------------------------------------
// Phase 11 Task 11.1 (verdict-integrity D17/D18/D19, PIN-29/PIN-22/PIN-23; #1989, #1664, #1914):
// the post-rebuttal deadlock arm is replaced. Harness: a two-seat roster (correctness approves,
// security blocks) drives the split; `security` answers per audit round through a script so each
// fixture states the rebuttal outcome explicitly. Every auditor dispatch is counted by its position
// in `calls` relative to the fix dispatch, so "two audit rounds before the fix" is a real ordering
// assert, not a count that a second fix round could also satisfy.
// ---------------------------------------------------------------------------
const SPLIT_PANEL_TASKS = [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }, { lens: 'security' }] }]
// splitPanelImpl(script): `script` maps the security seat's dispatch ordinal (1 = round 0, 2 = the rebuttal,
// 3 = the post-fix re-audit, …) to the finding it stands on (null = approve). The correctness seat
// always approves with `peerFindings` (default none). The `findings` arrays are fresh per call.
const splitPanelImpl = (script = { 1: MAJOR_WITH_FIX, 2: MAJOR_WITH_FIX }, peerFindings = []) => {
  let securityN = 0
  return (prompt, opts) => {
    if (seatOf(opts) === 'war-auditor' && (opts.label || '').startsWith('audit:')) {   // roster seats only — the gate-audit family falls to defaultImpl
      if ((opts.label || '').includes('security')) {
        const f = script[++securityN] ?? null
        return f
          ? { seat: opts.label, lens: 'security', verdict: 'request_changes', confidence: 'high', audit_sha: 'deadbeef', findings: [{ ...f }] }
          : { seat: opts.label, lens: 'security', verdict: 'approve', confidence: 'high', audit_sha: 'deadbeef', findings: [] }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high', audit_sha: 'deadbeef', findings: peerFindings.map(g => ({ ...g })) }
    }
    return defaultImpl(prompt, opts)
  }
}
const MAJOR_WITH_FIX = { severity: 'Major', title: 'null deref on empty roster', file: 'a.js', line: 12, rationale: 'roster[0] is read before the length check', suggested_fix: 'guard with `if (!roster.length) return null` before the read' }
const MAJOR_NO_FIX = { severity: 'Major', title: 'retry policy undecided', file: 'a.js', rationale: 'the plan never decides whether a dropped seat retries or holds' }
const auditorIdx = calls => calls.map((c, i) => [c, i]).filter(([c]) => isAuditor(c)).map(([, i]) => i)

// ---------------------------------------------------------------------------
// Phase 12 — release-slot eligibility by literal, not file (engine-and-audit-verdict-integrity D20,
// PIN-24, A14, #2000). The engine's basename refusal (aceEligible / isReleaseSlotFile) is unchanged:
// README.md/CHANGELOG.md already pass aceEligible at ffb3ab6, so the behavior row below is a
// CHARACTERIZATION pin and the decisive row is the prompt row — the release-task ace prompt names
// version-slots.test.mjs as the merge guard and the twins-move-together rule. No engine
// version-literal detector exists: a literal-moving absorb is caught by version-slots.test.mjs in the
// gate (A14).
// ---------------------------------------------------------------------------

// A release task: its plan Files: list names both RELEASE_SLOT_FILES basenames plus the two prose twins.
const RELEASE_TASK = { id: 't1', issue: 101, title: 'Release 0.21.13', planSlice: 'bump the four slots', roster: [{ lens: 'correctness' }],
  files: ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md', 'CHANGELOG.md'] }
// A blurb Minor on the CHANGELOG head entry — prose only, fully specified, absorb.
const RELEASE_BLURB = { severity: 'Minor', title: 'blurb count', file: 'CHANGELOG.md', rationale: 'the head entry says two comment blocks; the diff touched three',
  suggested_fix: 'say three', disposition: 'absorb', autoFixable: true }
// Round 1 raises the given findings; the ace re-audit approves clean.
const releaseTaskImpl = (findings) => buildSeqImpl(
  { 'audit:t1:correctness': [approveWith('audit:t1:correctness', findings), approveWith('audit:t1:correctness', [])] },
  aceBase(findings))
const NEVER_MOVE = 'never move a version literal or the CHANGELOG head heading'

// #2485 D9: a recovered task merge is one merge commit '6'*40 over [snapshot base, source tip] with the
// exact trailer; gate_sha is the gated source tip.
const reconciliationProof = (prompt = '') => ({ outcome: 'merged', base_is_ancestor: true, base_sha: '1'.repeat(40), source_sha: '2'.repeat(40), local_sha: '6'.repeat(40), remote_sha: '6'.repeat(40), source_tip: '2'.repeat(40),
  parents: ['1'.repeat(40), '2'.repeat(40)], tree: { target: '7'.repeat(40), source: '7'.repeat(40) }, trailer: 'WAR-Task: ' + reconcileContextOf(prompt).source + '\n',
  patch_id: 'fixture-task-patch', content_id: '5'.repeat(40), result: { mode: 'merge-task', status: 'merged', integration_sha: '6'.repeat(40), gate_sha: '2'.repeat(40), gate_log_path: fixtureGatePath(prompt) } })

// Real-git seats, shared by the pin boundary cases below and the #2485 floor-retry fixture: one git
// world per fixture dir (branches `integration` and `task`, a bare `origin.git`), and seat answers that
// follow the dispatched prompt against that world, so the oracle is git's own patch-id and tree, never
// the engine's context builder.
const realGitTools = dir => {
  const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  const remote = () => git('--git-dir=' + join(dir, 'origin.git'), 'rev-parse', 'integration')
  const resolve = value => { if (typeof value !== 'string' || !/^[0-9a-f]{7,40}$/.test(value)) return null; const r = run('rev-parse', '--verify', '--end-of-options', value + '^{commit}'); return r.status === 0 ? r.stdout.trim() : null }
  const patch = (base, tip) => { const r = spawnSync('git', ['patch-id', '--stable'], { input: git('diff', base, tip) + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.trim().split(' ')[0] }
  return { run, git, remote, resolve, patch }
}
const pinBeforeOf = p => JSON.parse(String(p).match(/Immutable BEFORE: (.+?)\. REPORTED PINS:/)[1])
const snapshotContextOf = p => JSON.parse(String(p).match(/Context: (\{.*?\})\. Before any merge mutation/)[1])
// pin-confirm as the prompt asks: content is the approved pin when the context names revert_range and
// that pin is an ancestor of the pre-rebase source tip, else the source tip itself.
const realGitPinConfirm = (dir, p) => {
  const { run, git, remote, resolve, patch } = realGitTools(dir)
  const before = pinBeforeOf(p), pins = JSON.parse(p.match(/REPORTED PINS: ([^\n]+)/)[1]).map(resolve)
  const ctx = JSON.parse(p.match(/Context: (\{.*?\})\. Immutable BEFORE:/)[1])
  const approvedAncestor = ctx.revert_range && pins[0] ? run('merge-base', '--is-ancestor', pins[0], before.source_sha).status === 0 : undefined
  const content = ctx.revert_range && approvedAncestor ? pins[0] : before.source_sha
  const ownBase = git('merge-base', before.base_sha, content)
  const lines = git('cherry', before.base_sha, content)
  return { head_sha: git('rev-parse', 'task'), local_sha: git('rev-parse', 'integration'), remote_sha: remote(), content_sha: content, approved_ancestor: approvedAncestor,
    head_tree: git('rev-parse', 'task^{tree}'), approved_tree: pins[0] ? git('rev-parse', pins[0] + '^{tree}') : '', content_tree: git('rev-parse', content + '^{tree}'), dispatch_base: ownBase,
    pre_content_id: fixtureContentId(dir, ownBase, content), post_content_id: fixtureContentId(dir, 'integration', 'task'), pre_patch_id: patch(ownBase, content), post_patch_id: patch('integration', 'task'), target_ancestor: run('merge-base', '--is-ancestor', 'integration', 'task').status === 0,
    post_empty: run('diff', '--quiet', 'integration', 'task').status === 0, task_count: Number(git('rev-list', '--count', ownBase + '..' + content)), pins,
    cherry: lines ? lines.split('\n').map(line => ({ sign: line[0], sha: line.slice(2) })) : [] }
}
// #2485 D8/D10: the engine's two-step --no-ff task merge, spelled as the merge prompt spells it, with the
// exact WAR-Task trailer naming the engine's task branch. NEVER-MOVE (D11): a source already an
// ancestor of HEAD is merged — no second merge commit (the reconcile replay of an existing merge).
const gitTaskMerge = (run, source, branch) => {
  if (run('merge-base', '--is-ancestor', source, 'HEAD').status === 0) return
  for (const args of [['-c', 'core.hooksPath=/dev/null', 'merge', '--no-ff', '--no-commit', source],
    ['-c', 'core.hooksPath=/dev/null', 'commit', '--no-verify', '-q', '-m', 'Merge WAR task (' + branch + ')', '--trailer', 'WAR-Task: ' + branch]]) {
    const r = run(...args); assert.equal(r.status, 0, r.stderr)
  }
}
// The task-merge facts MERGE_FACTS_RULE asks for, read from real Git: base_is_ancestor reads the SOURCE.
const gitTaskFacts = (run, base, source, target) => {
  const out = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout }
  return { base_is_ancestor: run('merge-base', '--is-ancestor', base, source).status === 0, parents: out('show', '-s', '--format=%P', target).trim().split(' '),
    tree: { target: out('rev-parse', target + '^{tree}').trim(), source: out('rev-parse', source + '^{tree}').trim() }, trailer: out('show', '-s', '--format=%(trailers:key=WAR-Task)', target) }
}
const confirmContextOf = p => JSON.parse(String(p).match(/Context: (\{.*?\})\. Immutable pre-dispatch snapshot:/)[1])
const reconcileContextOf = p => JSON.parse((String(p).match(/Context: (\{.*?\})\. Immutable pre-dispatch Git snapshot:/) || [null, '{}'])[1])
// merge-confirm as the prompt asks: the merge-task patch over the snapshot base, read after the dispatch,
// plus the task-merge facts on a task merge context.
const realGitMergeConfirm = (dir, p) => {
  const { run, git, remote, resolve, patch } = realGitTools(dir)
  const before = JSON.parse(p.match(/Immutable pre-dispatch snapshot: (.+?)\. Reported result:/)[1]), result = JSON.parse(p.match(/Reported result: ([^\n]+?)\.\n/)[1])
  const own = git('merge-base', before.base_sha, 'task')   // the prompt's merge-base(snapshot base, current source)
  return { local_sha: git('rev-parse', 'integration'), remote_sha: remote(), source_tip: git('rev-parse', 'task'), reported_sha: resolve(result.claimed), base_is_ancestor: run('merge-base', '--is-ancestor', before.base_sha, 'integration').status === 0, patch_id: patch(own, 'task'), content_id: fixtureContentId(dir, own, 'task'),
    ...(confirmContextOf(p).kind === 'task' ? gitTaskFacts(run, before.base_sha, 'task', 'integration') : {}) }
}

// Workflow disallows nondeterministic globals even before the first dispatch (#2300).
// Shadow only the template's globals, leaving the test runner and agents untouched.
const deterministicWorkflow = `
const Date = new Proxy(globalThis.Date, {
  construct() { throw new Error('Workflow refuses new Date()') },
  apply() { throw new Error('Workflow refuses Date()') },
  get(target, key) { if (key === 'now') return () => { throw new Error('Workflow refuses Date.now()') }; return target[key] }
})
const Math = new Proxy(globalThis.Math, {
  get(target, key) { if (key === 'random') return () => { throw new Error('Workflow refuses Math.random()') }; return target[key] }
})
` + src

// ===========================================================================
// REA artifact evidence — Task 2.3 (plan 2026-10-20-rea-artifact-evidence; D3, D8, D9, D10, D18;
// PIN-3, PIN-6, PIN-7, PIN-15). The End-state 8, 11, 18, 22 and 23 titles sit below verbatim (the
// Done when awk-anchors each one), beside the Task 5.1 (D23) per-artifact manifest test. `args.evidence` is the Lead-resolved
// presence half of the evidence gate (run.evidence on AND REA present); `args.targetArtifacts` is
// the Lead-threaded target-artifacts.mjs output. Off ⇒ every prompt byte-identical (G3).
const REA_ROW = { path: 'build/hello', sha256: 'a'.repeat(64), provider: 'ghidra' }
const REA_ON = { evidence: true, targetArtifacts: [REA_ROW] }
const REA_HEAD = 'REA ARTIFACT EVIDENCE'
const evidenceCardMd = readFileSync(join(here, '../../../agents/war-evidence-auditor.md'), 'utf8')
const isEvidenceSeat = c => seatOf(c.opts) === 'war-evidence-auditor'
const reaLoudLines = logs => logs.filter(l => typeof l === 'string' && /^REA ARTIFACT EVIDENCE OFF \(loud\):/.test(l))
const promptsOf = calls => calls.map(c => stableGatePrompt(String(c.prompt)))
// The eight worker spawn sites: the primary work dispatch plus the seven fix-applying builds
// (the CHAIN_FIX_BUILDS fixtures, re-run here with the evidence args threaded). Each `impl` is a
// fresh closure per run — several fixtures count rounds internally.
// `resolved` names whether a task is in scope at the site: the clause then carries the resolved
// manifest path (REA_RESOLVED_PATH, PROVISION_ARGS planSlug + task t1); the sweep and terminal sites do not.
// `<sha12>` stays a placeholder in the resolved path (D23): the engine does not know which declared
// artifacts a task cites, so the worker cuts the key from each cited artifact's declared sha256.
const REA_RESOLVED_PATH = 'docs/plans/evidence/wtprov-a/t1.<sha12>.manifest.json'
const REA_WORKER_SITES = [
  { site: 'work', args: o => PROVISION_ARGS({ tasks: SINGLE_TASK, ...o }), impl: () => defaultImpl,
    find: c => c.find(isWorker), resolved: true },
  { site: 'FIX_NEEDED', args: o => PROVISION_ARGS({ tasks: SINGLE_TASK, ...o }), impl: () => fixNeededImpl(),
    find: c => c.find(x => /^fix:t1:/.test(x.opts.label || '')), resolved: true },
  { site: 'ace subset', args: o => ACE_ARGS(o), impl: () => bisectSubsetImpl(),
    find: c => c.find(x => /^ace:subset:t1:/.test(x.opts.label || '')), resolved: true },
  { site: 'ace re-entry', args: o => ACE_ARGS(o), impl: () => reentryImpl(),
    find: c => c.find(x => /^ace:reentry:t1:/.test(x.opts.label || '')), resolved: true },
  { site: 'ace advisory polish', args: o => ACE_ARGS(o), impl: () => polishAceImpl(),
    find: c => c.find(x => /^ace:polish:t1:/.test(x.opts.label || '')), resolved: true },
  { site: 'floor family (add-test)', args: o => PROVISION_ARGS({ tasks: SINGLE_TASK, ...o }), impl: () => floorRetryImpl(),
    find: c => c.find(x => /^add-test:t1:/.test(x.opts.label || '')), resolved: true },
  { site: 'phase-close sweep', args: o => SWEEP_ARGS(o), impl: () => sweepBase([queuedAbsorb()]),
    find: c => c.find(x => (x.opts.label || '') === 'polish:phase-3'), resolved: false },
  { site: 'terminal pass', args: o => SWEEP_ARGS(o), impl: () => terminalImpl(),
    find: c => c.find(x => (x.opts.label || '') === 'terminal:phase-3'), resolved: false },
]

// ---------------------------------------------------------------------------
// #2485 — blocked aces never reach the merge slot unjudged (plan 2026-10-28-blocked-ace-and-merge-provenance,
// Task 1.1). Every End-state fixture below is a flat top-level test whose literal name carries the exact
// `2485/ES<n> ` prefix: the End-state checks anchor on that prefix and count the names.
// ---------------------------------------------------------------------------

// The field shape (TRIAL-1, A5): the ace worker committed and pushed ACE_TIP, then returned blocked.
// The pin snapshot keys its source_sha on that tip and the pin-confirm trees key on the real
// commits, so the approved tree and the tip tree differ the way they do in Git.
const ACE_TIP = 'ace00001'.padEnd(40, '0')
const blockedWith = (head_sha, task_id = 't1') => ({ task_id, status: 'blocked', head_sha, blocked_reason: 'the trailer sits in a non-final paragraph' })
const INFRA = () => { throw new Error('socket hang up') }
// The ace-arm router: `result` is a thunk the ace worker dispatch calls (a blocked result at ACE_TIP by
// default, INFRA for a dead dispatch, an implemented result for a moved tip); every other seat takes aceBase.
const blockedAceImpl = (result = () => blockedWith(ACE_TIP)) => (prompt, opts) =>
  seatOf(opts) === 'war-worker' && /^ace:/.test(opts.label || '') ? result() : aceBase([nit()])(prompt, opts)
const keyedPinSeats = (over = {}) => ({
  'pin-snapshot': { ...NEW_SEAT_DEFAULTS['pin-snapshot'], source_sha: ACE_TIP },
  'pin-confirm': p => {
    const proof = NEW_SEAT_DEFAULTS['pin-confirm'](p)
    return { ...proof, approved_tree: fixtureTree(proof.pins[0]), content_tree: fixtureTree(proof.content_sha) }
  },
  ...over,
})
// A tip probe whose pre-dispatch tip is not an ancestor of the branch tip (a rewritten branch).
const nonDescendantProbe = p => {
  const approved = (String(p).match(/APPROVED=(\S+) \(the last approved tip\)/) || [])[1]
  return { tip_sha: ACE_TIP, tip_tree: fixtureTree(ACE_TIP), pre_sha: approved.padEnd(40, '0'), pre_tree: fixtureTree(approved.padEnd(40, '0')), approved_tree: fixtureTree(approved.padEnd(40, '0')), count: 0, pre_is_ancestor: false, files: [] }
}

// Probe builders: the engine names PRE and APPROVED in the probe prompt; a moved probe reports a
// descendant tip with `count` commits and a tree that differs from the approved tree.
const probeShas = p => {
  const full = x => isHexSha(x) ? x.padEnd(40, '0') : FIXTURE_REF_TIP
  return { pre: full((String(p).match(/PRE=(\S+) \(the pre-dispatch tip\)/) || [])[1]),
    approved: full((String(p).match(/APPROVED=(\S+) \(the last approved tip\)/) || [])[1]) }
}
const movedProbe = (tip, { files = [ACE_FILE], count = 1 } = {}) => p => {
  const { pre, approved } = probeShas(p)
  return { tip_sha: tip, tip_tree: fixtureTree(tip), pre_sha: pre, pre_tree: fixtureTree(approved), approved_tree: fixtureTree(approved), count, pre_is_ancestor: true, files }
}
// A tip whose tree equals the approved tree (a self-revert pair, or a range that is only a revert).
const approvedTreeProbe = (tip, count) => p => {
  const { pre, approved } = probeShas(p)
  return { tip_sha: tip, tip_tree: fixtureTree(approved), pre_sha: pre, pre_tree: fixtureTree(approved), approved_tree: fixtureTree(approved), count, pre_is_ancestor: true, files: [] }
}
const probeAt = (site, fn) => (p, o, w) => (o.label || '').startsWith('tip-probe:' + site + ':') ? fn(p, o, w) : NEW_SEAT_DEFAULTS['tip-probe'](p, o, w)
const labelIdx = (calls, label) => calls.findIndex(c => c.opts.label === label)
// A Git world that tracks the merge-slot revert: the pin-transfer probe that carries the range revert
// clause leaves the task head at the approved tree; without it the head keeps the moved tip's tree.
// pin-confirm reports the post-revert head_tree, so a test can assert it equals the approved tree.
const revertAwarePinSeats = (tip, over = {}) => {
  let reverted = false
  return {
    'pin-snapshot': { ...NEW_SEAT_DEFAULTS['pin-snapshot'], source_sha: tip },
    'pin-transfer': p => { reverted = /FORWARD-REVERT \(--ace\)/.test(p); return { status: 'error' } },
    'pin-confirm': p => {
      const proof = NEW_SEAT_DEFAULTS['pin-confirm'](p)
      const range = JSON.parse(p.match(/Context: (\{.*?\})\. Immutable BEFORE:/)[1]).revert_range
      const content = range ? proof.pins[0] : proof.content_sha
      return { ...proof, approved_ancestor: range ? true : undefined, content_sha: content,
        approved_tree: fixtureTree(proof.pins[0]), content_tree: fixtureTree(content), head_tree: fixtureTree(reverted ? proof.pins[0] : tip) }
    },
    ...over,
  }
}
// The deciding assertions for a reverted range: the task lands through git-confirmed:landed, never
// the D6 escalation, and the approved tree equals the post-revert tree pin-confirm read.
const assertLandedReverted = (out, label) => {
  assert.ok(out.landed.includes('t1'), label + ': t1 lands')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), label + ': never a hold')
  assert.ok((out.auditLog || []).some(e => e && e.verdict === 'git-confirmed:landed'), label + ': the land is git-confirmed')
  assert.ok(!(out.auditLog || []).some(e => e && e.verdict === 'pin-transfer:tree-mismatch'), label + ': never the D6 escalation')
  const proof = (out.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'pin-transfer:git-verified').after
  assert.equal(proof.approved_tree, proof.head_tree, label + ': the approved tree equals the post-revert tree')
}
const RANGE_TIP = 'ace00002'.padEnd(40, '0')
const SUB_TIP = 'cab00001'.padEnd(40, '0')
const RE_TIP = 'cab00002'.padEnd(40, '0')

// tipStranded: a refiner revert that reported ok over a tree that is not the approved tree, then a
// worker that made no commit. The probe reads count 0 with a stray tree, so the tip is 'unchanged',
// and the range must still register for the merge-slot revert at both non-moved arms.
const strayTreeAt = (label, seen) => (p, o, w) => {
  if (o.label !== label) return NEW_SEAT_DEFAULTS['tip-probe'](p, o, w)
  const { pre } = probeShas(p); seen.tip = pre
  return { ...approvedTreeProbe(pre, 0)(p), tip_tree: fixtureTree('stray') }
}

// #2485 ES12 real-git harness: a task repo whose root commit is the approved tip (x.js in the ace
// range, w.js never touched), and the one range revert script the engine renders for it, captured from
// the pin-transfer probe after a two-commit blocked ace with a red gate (the merge-slot revert path).
// The script bakes in the worktree and the approved sha, so every state a fixture builds runs the same
// text the refiner would run; `runScript(env)` is that run, bash -c in the task worktree.
const rangeRevertRepo = () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-range-revert-'))
  const git = (...a) => { const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  git('init', '-q', '-b', 'task'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  writeFileSync(join(dir, 'x.js'), 'approved'); writeFileSync(join(dir, 'w.js'), 'untouched'); git('add', 'x.js', 'w.js'); git('commit', '-q', '-m', 'approved task')
  const quiet = (...a) => git('-c', 'core.hooksPath=/dev/null', ...a)
  return { dir, git, quiet, approved: git('rev-parse', 'HEAD') }
}
const captureRangeRevertScript = async ({ dir, git, quiet, approved }) => {
  const scripts = []
  const { out } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { ace: true } }), (p, o) => {
    if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: approved }
    if (seatOf(o) === 'war-worker') {
      // Two ace commits, then blocked: the field shape on a multi-commit move.
      writeFileSync(join(dir, 'x.js'), 'ace one'); quiet('commit', '-q', '-am', 'ace one')
      writeFileSync(join(dir, 'y.js'), 'ace two'); quiet('add', 'y.js'); quiet('commit', '-q', '-m', 'ace two')
      return blockedWith(git('rev-parse', 'HEAD'))
    }
    if (o.label === 'audit:t1:correctness') return { seat: o.label, lens: 'correctness', verdict: 'approve', audit_sha: approved, findings: [nit({ file: 'x.js' })], confidence: 'high' }
    return defaultImpl(p, o)
  }, {
    'tip-probe': p => {
      const pre = p.match(/PRE=(\S+) \(the pre-dispatch tip\)/)[1], tip = git('rev-parse', 'task')
      return { tip_sha: tip, tip_tree: git('rev-parse', tip + '^{tree}'), pre_sha: git('rev-parse', pre), pre_tree: git('rev-parse', pre + '^{tree}'), approved_tree: git('rev-parse', approved + '^{tree}'),
        count: Number(git('rev-list', '--count', pre + '..' + tip)), pre_is_ancestor: true, files: git('diff', '--no-renames', '--name-only', pre, tip).split('\n') }
    },
    'ace-gate': { gate_green: false, gate_output: 'red' },
    'pin-transfer': p => { scripts.push(rangeRevertScriptOf(p)); return { status: 'error' } },
  })
  assert.equal(scripts.length, 1, 'the pin-transfer probe carried the range revert')
  const runScript = (env = {}) => spawnSync('bash', ['-c', scripts[0]], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env } })
  return { script: scripts[0], runScript, out }
}

// ---- #2485 Task 2.1 — merge-commit provenance (plan 2026-10-28-blocked-ace-and-merge-provenance, D8–D13) ----
// Every task merge is ONE --no-ff merge commit made by the two-step form under core.hooksPath=/dev/null,
// carrying the exact `WAR-Task: <task branch>` trailer; the task arm of the merge predicate accepts it only
// on parents [snapshot base, source tip], a rebased source, merge tree == source tree and the exact trailer.
const ES_MERGE_CMD = /run exactly `(git -c core\.hooksPath=\/dev\/null merge --no-ff --no-commit ([^ `]+) && git -c core\.hooksPath=\/dev\/null commit --no-verify -m "Merge WAR task t1 \(\2\)" --trailer "WAR-Task: \2")`/
const mergeCommandOf = p => { const m = String(p).match(ES_MERGE_CMD); assert.ok(m, 'the merge prompt carries the exact two-step --no-ff merge spelling'); return m[1] }
// The four task merge sites, each driven to dispatch once (the reconciliation-loop drivers).
const taskMergeSitePrompts = async () => {
  const prompts = {}
  for (const site of ['initial', 'floor-retry', 'environment-proceed', 'baseline-proceed']) {
    const label = site === 'initial' ? 'merge:t1' : site === 'floor-retry' ? 'merge:t1:floor-retry:r1' : 'merge:t1:' + site
    const { calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), (p, o) => {
      if (o.label === 'merge:t1' && site === 'floor-retry') return { mode: 'merge-task', status: 'no-test' }
      if (o.label === 'merge:t1' && /-proceed$/.test(site)) return { mode: 'merge-task', status: 'gate_failed', gate_failure_class: site.split('-')[0], gate_failing_ids: ['old-test'], gate_base_sha: '1'.repeat(40) }
      return defaultImpl(p, o)
    })
    const c = calls.find(x => x.opts.label === label)
    assert.ok(c, label + ' dispatched')
    prompts[site] = c.prompt
    if (site === 'initial') prompts.probe = calls.find(x => x.opts.dispatchKind === 'pin-transfer').prompt
  }
  return prompts
}
const NEVER_MOVE_SENTENCE = src.match(/const NEVER_MOVE_MERGED = '([^']+)'/)[1]

// A real repo: base on integration, a task commit, then a published sibling, so the merge needs the rebase.
const es6Repo = () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-es6-'))
  const tools = realGitTools(dir), { git } = tools
  git('init', '-q', '-b', 'integration'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-q', '-m', 'base'); git('branch', 'working')
  git('init', '-q', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', '-q', 'origin', 'integration', 'working')
  git('checkout', '-q', '-b', 'task'); writeFileSync(join(dir, 'deliverable.test.js'), 'approved'); git('add', 'deliverable.test.js'); git('commit', '-q', '-m', 'task')
  git('checkout', '-q', 'integration'); writeFileSync(join(dir, 'sibling'), 'published sibling'); git('add', 'sibling'); git('commit', '-q', '-m', 'sibling'); git('push', '-q', 'origin', 'integration')
  return { dir, ...tools }
}
const bash = (dir, cmd) => { const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r }
// One phase whose merge:t1 dispatch runs `doMerge(prompt)` in real Git; confirmation and reconciliation read
// real Git through the prompts' own fact rules. Options: `gateSha` overrides the reported gate_sha (merge
// reply and reconcile result); `throwAfterPush` loses the merge reply after the push, so the shared
// merge-reconcile handler decides.
const es6Phase = async (repo, doMerge, { gateSha, throwAfterPush } = {}) => {
  const { dir, git, remote, patch } = repo
  let base = null
  const snapshot = () => { const fork = git('merge-base', 'integration', 'task'); return { base_sha: git('rev-parse', 'integration'), source_sha: git('rev-parse', 'task'), remote_sha: remote(), patch_id: patch(fork, 'task'), content_id: fixtureContentId(dir, fork, 'task') } }
  const result = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { roundLimit: 2 } }), (p, o) => {
    if (o.label === 'merge:t1') {
      base = git('rev-parse', 'integration')
      doMerge(p)
      git('push', '-q', 'origin', 'integration')
      if (throwAfterPush) throw new Error('read ECONNRESET after push')
      return { mode: 'merge-task', status: 'merged', integration_sha: git('rev-parse', 'integration'), gate_sha: gateSha ?? git('rev-parse', 'task'), gate_output: 'ok' }
    }
    return defaultImpl(p, o)
  }, {
    'merge-snapshot': (p, o) => o.label === 'git-snapshot:t1' ? snapshot() : NEW_SEAT_DEFAULTS['merge-snapshot'],
    'merge-confirm': (p, o) => o.label === 'git-confirm:merge:t1' ? realGitMergeConfirm(dir, p) : NEW_SEAT_DEFAULTS['merge-confirm'](p),
    'merge-reconcile': p => {
      const before = JSON.parse(p.match(/Immutable pre-dispatch Git snapshot: (.+?)\. Prior response:/)[1])
      const local = git('rev-parse', 'integration'), own = git('merge-base', before.base_sha, 'task')
      return { outcome: 'merged', base_sha: before.base_sha, source_sha: before.source_sha, local_sha: local, remote_sha: remote(), source_tip: git('rev-parse', 'task'), patch_id: patch(own, 'task'), content_id: fixtureContentId(dir, own, 'task'),
        ...gitTaskFacts(repo.run, before.base_sha, 'task', 'integration'), result: { mode: 'merge-task', status: 'merged', integration_sha: local, gate_sha: gateSha ?? git('rev-parse', 'task'), gate_log_path: fixtureGatePath(p) } }
    },
  })
  return { ...result, base: () => base, facts: () => gitTaskFacts(repo.run, base, 'task', 'integration') }
}
const rebaseTask = repo => { repo.git('checkout', '-q', 'task'); repo.git('rebase', '-q', 'integration'); repo.git('checkout', '-q', 'integration') }
// runTrailerRead: run the MERGE_FACTS_RULE trailer read exactly as a dispatched prompt spells it, through
// bash, so a shell-quoting regression (an unquoted %(...) is a bash syntax error) fails the exit-0 assert.
const runTrailerRead = (repo, prompt) => {
  const read = (String(prompt).match(/git show -s --format=\S*trailers:key=WAR-Task\S* <local target>/) || [])[0]
  assert.ok(read, 'the prompt carries the trailer read')
  return bash(repo.dir, read.replace('<local target>', 'integration')).stdout.trim()
}
const assertRefused = (out, calls, why) => {
  assert.ok(!out.landed.includes('t1'), why + ': the task is never recorded merged')
  assert.ok(out.auditLog.some(r => r.verdict === 'git-confirmation:unresolved' && r.site === 'merge:t1'), why + ': confirmMerge refuses it')
  assert.ok(calls.some(c => c.opts.dispatchKind === 'merge-reconcile'), why + ': the uncertain merge enters reconciliation')
  assert.ok(!out.auditLog.some(r => r.verdict === 'git-reconciled:merged'), why + ': reconcileMerge refuses the same commit')
  assert.equal(out.landDecision, 'held:workflow-error', why + ': it holds before land')
}

// D13 default-deny reader census: every non-comment engine line that reads or writes integration_sha,
// gate_sha, lastLandedTip, landedShaByTask, gateHeadSha, preMergeTip, pinStatus, expectedPin or merge_sha is
// classified into exactly one named row, and every row matches its exact line count. A new reader reds
// the census until it is classified (and fixtured under the merge-commit shape, as the ES8 fixture above is).
const READER_TOKEN = /\b(integration_sha|gate_sha|lastLandedTip|landedShaByTask|gateHeadSha|preMergeTip|pinStatus|expectedPin|merge_sha)\b/
const READER_CENSUS = [
  ['MERGE_RESULT.integration_sha', /^\s+branch: \{ type: 'string' \}, integration_sha: \{ type: 'string' \}/, 1],
  ['MERGE_RESULT.gate_sha', /^\s+gate_sha: \{ type: 'string' \},$/, 1],
  ['mergedTasksForGateAudit entry shape', /^const mergedTasksForGateAudit = \[\]/, 1],
  ['lastLandedTip tracker', /^let lastLandedTip = null$/, 1],
  ['landedShaByTask retention', /^const landedShaByTask = new Map\(\)$/, 1],
  ['recovery predicate: confirmMerge claimed sha', /const claimed = result\[context\.land \? 'working_sha' : 'integration_sha'\]/, 1],
  ['recovery predicate prompt line: reconcileMerge task merges', /For task merges, return outcome merged ONLY with a complete normal MergeResult/, 1],
  ['recovery predicate: reconcileMerge result sha', /recovered\.result\[context\.land \? 'working_sha' : 'integration_sha'\] === recovered\.local_sha/, 1],
  ['task audit-pin mismatch row (a task-audit pin, not a merge sha)', /verdict: 'pin-mismatch:reconcile', pinMismatch: true, expectedPin: pin/, 1],
  ['pinOrSentinel', /'\(integration_sha unrecorded\/malformed\)'/, 1],
  ['gate_sha Git binding (gitBoundGateSha)', /const gated = result && result\.gate_sha, second = proof|const \{ gate_sha: dropped, \.\.\.rest \} = result$/, 2],
  ['landMerged: predTip from lastLandedTip', /const predTip = lastLandedTip$/, 1],
  ['landMerged: gateHeadSha from gate_sha, preMergeTip', /gateHeadSha: pinOrSentinel\(mr\.gate_sha\), gateLogPath: mr\.gate_log_path, preMergeTip: predTip/, 1],
  ['landMerged: lastLandedTip and landedShaByTask from integration_sha', /if \(isSha\(mr\.integration_sha\)\) \{ lastLandedTip = mr\.integration_sha; landedShaByTask\.set\(task\.id, mr\.integration_sha\) \}/, 1],
  ['already_upstream landMerged (pinProof.head_sha)', /landMerged\(r\.task, \{ mode: 'merge-task', status: 'merged', integration_sha: pinProof\.head_sha, gate_sha: pinProof\.head_sha \}\)/, 2],
  ['first-merge and floor-retry populate sentences', /pt`Populate integration_sha with the new merge commit and gate_sha with the rebased task tip the gate ran at/, 2],
  ['environment-proceed step (c)', /\(c\) On a fully green gate, MERGE in _refinery/, 1],
  ['baseline-proceed step (c)', /\(c\) If the ONLY failures are the pre-existing baseline set, MERGE in _refinery/, 1],
  ['gate-audit evidence dispatch', /taskId: m\.taskId, gateHeadSha: m\.gateHeadSha|preMergeTip: m\.preMergeTip \|\| phaseBaseCmd|For EACH merged task below \(taskId · gateHeadSha|evItems\.map\(e => pt`  - \$\{e\.taskId\} · gateHeadSha|1\. PIN STATUS — run: gate-pin-status\.sh <gateHeadSha>|The --mapped set is THIS task's OWN changed files|2\. GUARD SPECIFICITY — run: assert-guard-specificity-in-diff\.sh <preMergeTip>/, 7],
  ['evidence stamp: pinStatus on the gate-audit entry', /m\.pinStatus = p\.pin_status/, 1],
  ['gate-audit seat prompt', /await parallel\(mergedTasksForGateAudit\.map\(\(\{ taskId, gateOutput|const pinStatusLine = pinStatus$|\? pt`\$\{pinStatus\}|the gate ran at gate-HEAD sha \$\{gateHeadSha\}|Gate-HEAD sha \(the rebased task tip the gate ran at|PIN STATUS: \$\{pinStatusLine\}|it should equal the observed tip \$\{observedHead \|\| gateHeadSha\}|the expected gate-HEAD sha \$\{gateHeadSha\}/, 8],
  ['gate-audit entry: pin and expectedPin', /const pin = observedHead \|\| gateHeadSha$|\.\.\.\(mismatch \? \{ pinMismatch: true, expectedPin: pin \} : \{\}\), gateHeadSha, auditSha/, 2],
  ['handoff tipSha fallback (lastLandedTip)', /: \(isSha\(lastLandedTip\) \? lastLandedTip : null\)$/, 1],
  ["auditEvidenceOf's fallback (landedShaByTask)", /const g = auditLog\.find\(e => e && e\.task === t && e\.gateEvidence && typeof e\.gateHeadSha|sha: g \? g\.gateHeadSha : \(landedShaByTask\.get\(t\) \?\? 'unrecorded'\)/, 2],
]
const readerCensusOf = source => {
  const counts = new Map(READER_CENSUS.map(([name]) => [name, 0])), unclassified = [], ambiguous = []
  source.split('\n').forEach((line, i) => {
    if (/^\s*\/\//.test(line) || !READER_TOKEN.test(line)) return
    const rows = READER_CENSUS.filter(([, re]) => re.test(line))
    if (rows.length === 0) unclassified.push((i + 1) + ': ' + line.trim().slice(0, 120))
    else if (rows.length > 1) ambiguous.push((i + 1) + ': ' + rows.map(r => r[0]).join(' | '))
    else counts.set(rows[0][0], counts.get(rows[0][0]) + 1)
  })
  return { counts, unclassified, ambiguous }
}

// The MERGE_RESULT literal plus #2485 D19's provision pick (ENV_OUTCOME and the MERGE_PROVISION_KEYS
// assignment), evaluated together: the provision property is assigned after ENV_OUTCOME is declared.
const mergeResultSchema = () => {
  const literal = src.match(/const\s+MERGE_RESULT\s*=[^]*?(?=\n\n)/)[0]
  const envLit = src.match(/const ENV_OUTCOME = \{[^]*?absorbCharges: \{ type: 'object' \} \} \}\n/)[0]
  const pick = src.match(/const MERGE_PROVISION_KEYS = [^\n]*\nMERGE_RESULT\.properties\.provision = [^]*?\)\) \}\n/)[0]
  return new Function(literal + '\n' + envLit + pick + 'return { MERGE_RESULT, ENV_OUTCOME }')()
}

// ES17 (D18, PIN-18): the barrier's absorb-charge read runs the EXACT dispatched bash spelling against
// real Git. Once a task merges through its --no-ff merge commit, <integration>..<branch> is empty, so the
// seed must read M^1..M^2 of that merge commit; a charge naming another task id never counts.
const absorbReadOf = async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const prompt = calls.find(isProvision).prompt
  const cmd = prompt.match(/ABSORB-CHARGE READ[^\n]*?run this one bash command with its two angle-bracket placeholders filled: `([^`]+)`/)
  assert.ok(cmd, 'the barrier prompt spells the absorb-charge read as one bash command')
  return { prompt, cmd: cmd[1] }
}
const absorbFixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-absorb-seed-'))
  const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  const commit = (file, message) => { writeFileSync(join(dir, file), message); git('add', file); git('commit', '-m', message) }
  git('init', '-b', 'dev/wtprov-a'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  commit('base', 'base'); git('branch', 'integration/wtprov-a/phase-3')
  return { dir, run, git, commit }
}
const readCharges = (cmd, dir, branch) => {
  const filled = cmd.replace(`<that task's worktree>`, dir).replace(`<that task's branch>`, branch)
  const r = spawnSync('bash', ['-c', filled], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.split('\n').map(s => s.trim()).filter(Boolean)
}
// The prompt's rule: the bare task id segment must equal this task's id; take the HIGHEST n.
const highestFor = (values, id) => Math.max(0, ...values.map(v => v.match(/^(.+):(\d+)$/)).filter(m => m && m[1] === id).map(m => Number(m[2])))

// ---- #2485 Task 4.1 — tree-keyed re-provision before any gate (plan 2026-10-28-blocked-ace-and-merge-provenance, D15/D19) ----
// PROVISION_TREE_LINE is the one marker sentence (writer, file path, reader test); PROVISION_RERUN_CLAUSE is
// the one re-run sentence every refiner gate site interpolates. Both are read from their engine homes.
const evalTemplateConst = name => {
  const m = src.match(new RegExp('const ' + name + ' = pt`((?:\\\\[^]|[^`\\\\])*)`'))
  assert.ok(m, name + ' is one pt template with no interpolation')
  return new Function('return `' + m[1] + '`')()
}
const PROVISION_TREE_SENTENCE = evalTemplateConst('PROVISION_TREE_LINE')
const PROVISION_CLEAN_SENTENCE = evalTemplateConst('PROVISION_CLEAN_LINE')
const DEP_WAVE_PROVISION_SENTENCE = src.match(/^const DEP_WAVE_PROVISION_RULE = '([^']+)'$/m)[1]
// The marker's two shell spellings, cut from the sentence: the writer and the reader test (exit 0 = seen).
const markerWriterOf = text => { const m = String(text).match(/write it with `([^`]+)`/); assert.ok(m, 'the marker writer is spelled'); return m[1] }
const markerTestOf = text => { const m = String(text).match(/only when `(test [^`]+)` exits 0/); assert.ok(m, 'the marker test is spelled'); return m[1] }

// ES13 census (default-deny, exact named multiset): one row per interpolation site of either constant, named
// by its enclosing construct — the column-0 declaration that holds it, else the dispatch label that follows it.
const PROVISION_CONSTS = ['PROVISION_CLEAN_LINE', 'PROVISION_RERUN_CLAUSE', 'PROVISION_TREE_LINE']
const provisionConstructOf = (lines, i) => {
  for (let j = i; j >= 0; j--) {
    if (!/^\S/.test(lines[j]) || lines[j].startsWith('//')) continue
    const top = lines[j].match(/^(?:const|let|async function|function)\s+([A-Za-z_$][\w$]*)/)
    if (top) return top[1]
    break
  }
  for (let k = i; k < lines.length; k++) {
    const m = lines[k].match(/label: (?:`([^`]*)`|'([^']*)')/)
    if (m) return m[1] ?? m[2]
  }
  return '(unclassified)'
}
const provisionSiteCensus = text => {
  const lines = text.split('\n'), rows = []
  lines.forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return
    for (const name of PROVISION_CONSTS) {
      for (const m of line.matchAll(new RegExp('\\b' + name + '\\b', 'g'))) {
        if (m.index === 6 && line.startsWith('const ' + name + ' =')) continue   // the definition itself
        rows.push(name + ' @ ' + provisionConstructOf(lines, i))
      }
    }
  })
  return rows.sort()
}
const PROVISION_SITE_CENSUS = [
  // the cleanliness sentence: the re-run clause and the provision runs that may touch tracked files
  // (per-task and _refinery provision-run, the polish worktree provision); depClause and the end-state
  // install deliberately carry no row (see the PROVISION_CLEAN_LINE header comment)
  'PROVISION_CLEAN_LINE @ PROVISION_RERUN_CLAUSE',
  'PROVISION_CLEAN_LINE @ polish-worktree:phase-${ph.id}',
  'PROVISION_CLEAN_LINE @ provisionStep',
  // the twelve refiner gate sites (D15): four merge step (a) copies, the ace-gate check, the integrated-tip
  // re-run, the polish-sweep and terminal-pass merges, the three land gates and the _refinery base re-run
  'PROVISION_RERUN_CLAUSE @ ace-gate:',
  'PROVISION_RERUN_CLAUSE @ classificationClause',
  'PROVISION_RERUN_CLAUSE @ evidence:phase-${ph.id}',
  'PROVISION_RERUN_CLAUSE @ land:phase-${ph.id}',
  'PROVISION_RERUN_CLAUSE @ land:phase-${ph.id}:baseline-proceed',
  'PROVISION_RERUN_CLAUSE @ land:phase-${ph.id}:environment-proceed',
  'PROVISION_RERUN_CLAUSE @ merge:${r.task.id}',
  'PROVISION_RERUN_CLAUSE @ merge:${r.task.id}:baseline-proceed',
  'PROVISION_RERUN_CLAUSE @ merge:${r.task.id}:environment-proceed',
  'PROVISION_RERUN_CLAUSE @ merge:${r.task.id}:floor-retry:r${r.task.fixRounds}',
  'PROVISION_RERUN_CLAUSE @ merge:p${ph.id}-polish',
  'PROVISION_RERUN_CLAUSE @ merge:p${ph.id}-terminal',
  // the marker: readers (the re-run clause, the dep-wave worker clause) and writers (per-task and _refinery
  // provision-run, the polish worktree provision, the end-state check install)
  'PROVISION_TREE_LINE @ PROVISION_RERUN_CLAUSE',
  'PROVISION_TREE_LINE @ depClause',
  'PROVISION_TREE_LINE @ endstate-check:phase-${ph.id}',
  'PROVISION_TREE_LINE @ polish-worktree:phase-${ph.id}',
  'PROVISION_TREE_LINE @ provisionStep',
]

// ES16 (D19, PIN-19): a failed re-run step rides MergeResult.provision; provisionStep's evidence gate admits
// it as the soft env-blocked escalation, worktree kept; a paraphrased failedCommand throws held:workflow-error.
const provisionFailure = (failedCommand) => ({ mode: 'merge-task', status: 'error', provision: { ok: false, failedCommand, exitCode: 1, stderrTail: 'ERR_LOCKFILE', provisionSource: 'ci' } })

export {
  test,
  assert,
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readdirSync,
  fileURLToPath,
  dirname,
  join,
  resolvePath,
  tmpdir,
  spawnSync,
  createHash,
  HARD_ESCALATION_REASONS,
  KNOWN_LAND_DECISIONS,
  SOFT_ENV_REASONS,
  BARRIER_TOKENS,
  RELEASE_SLOT_FILES,
  DEMOTE_REASONS,
  spawnOpts,
  validateRoster,
  widenRoster,
  resolveWidenSource,
  resolveGate,
  ROLES,
  DEFAULTS,
  SEAT_AGENT_TYPES,
  MODELS,
  EFFORTS,
  EVIDENCE_LENS,
  WIDEN_BARRED_LENSES,
  extractInterpolations,
  extractArgsFields,
  EXEMPT_FIELDS,
  MANIFEST_PATH_TEMPLATE,
  MANIFEST_KEYS,
  here,
  auditorMd,
  gateAuditChecklistMd,
  auditorTeachMd,
  refinerMd,
  schemasMdForAbsorb,
  gateFailureMd,
  refinerRecoveryMd,
  fileFollowupsMd,
  edgesMd,
  src,
  TRAILER_BLOCK_RULE,
  exactGitDiffRecipe,
  fixtureContentId,
  AsyncFunction,
  build,
  fakeParallel,
  NEW_SEAT_DEFAULTS,
  answerNewSeat,
  isHexSha,
  fixtureTree,
  branchOfPrompt,
  FIXTURE_REF_TIP,
  NEW_SEAT_KINDS,
  fixturePinRequest,
  fixtureGitProof,
  stableGatePrompt,
  fixtureGatePath,
  fixtureAuditPin,
  completeAuditFixture,
  completeMergeFixture,
  runPhase,
  seatOf,
  defaultImpl,
  PROVISION_ARGS,
  idx,
  isProvision,
  isWorker,
  isFixWorker,
  isAuditor,
  isServitor,
  isProvisionRun,
  PROVISION_LIST,
  withProvision,
  isProvisionTopology,
  MERGE_TASK_EXCLUDES,
  isMergeTask,
  isPinTransfer,
  isAceGate,
  isLand,
  buildSeqImpl,
  AUDIT_ARGS,
  COVEN_ARGS,
  DAG_ARGS,
  dagBaseImpl,
  servitorMd,
  gateAuditImpl,
  gateAuditCalls,
  makeGateAuditImpl,
  NO_TEST_ARGS,
  isAddTestWorker,
  runNoTestLoop,
  mergePromptsOf,
  FLOOR_SITE_RE,
  FLOOR_HEAD_RE,
  L3_ARGS,
  SUBMOD_PHASE_ARGS,
  isAce,
  isAceRevert,
  revertBetween,
  mergeRangeRevert,
  rangeRevertScriptOf,
  RANGE_REVERT_TOKENS,
  assertRangeRevertTokensMapped,
  ACE_ARGS,
  nit,
  approveWith,
  aceBase,
  reentryImpl,
  bWorker,
  bRegress,
  bApprove,
  ROSTER_TRIO,
  isRegularAudit,
  workerMd,
  bare,
  askFinding,
  CALIBRATION_SHARED,
  COST_CLAIM_SHARED,
  CALIBRATION_RULE_ANCHORS,
  CALIBRATION_QUALIFIER,
  qualifierPerRuleWindows,
  calibrationLine,
  capturedAuditPrompt,
  WORKER_MEM,
  AUDIT_MEM,
  SERV_MEM,
  MEMORY_MAP,
  MEMORY_TOOL_LITERAL,
  memoryQueryLineOf,
  isMemoryEvidenceSeat,
  MQ_SEAT_TASKS,
  SWEEP_ARGS,
  sweepBase,
  queuedAbsorb,
  ES_CONDS,
  ES_ARGS,
  esImpl,
  ES_CHECK_CMD,
  ES_ROWS,
  ES_ROW_ARGS,
  isEndstateCheck,
  REFINERY,
  ES_ROWS_CHECK_SECOND,
  ES_BT,
  esTransportPrompt,
  esFenced,
  esSeatPromptFor,
  OLD_FOUR_STATUS_ENUM,
  RETIRED_JUDGMENT_PATH,
  handoffMinorF,
  handoffImpl,
  HANDOFF_ARGS,
  crossTaskImpl,
  TIP_PLACEHOLDER,
  tipImpl,
  servitorPromptAtTip,
  PKG_ARGS,
  isPackageItWorker,
  PKG_TRUE_ARGS,
  schemasMd,
  CLS_ARGS,
  clsImpl,
  envMergeResult,
  envLandResult,
  SUBMOD_RETRY_REPO,
  submodRetryTask,
  assertSubmodScoped,
  assertSubmodLandScoped,
  baselineLandFail,
  markerEnvRe,
  NEEDS_DERIVATION_TASK,
  runCounting,
  EXPLICIT_TASK,
  SINGLE_PROV,
  RELAND_DISC_CMD,
  RELAND_DISC_BUDGET,
  RELAND_DISC_DIVERGE,
  FF_PREFLIGHT,
  FF_DEDUP_CMD,
  FF_DEDUP_RULE,
  FF_CLUSTER_KEY,
  FF_RETURN,
  ONE_TASK,
  gateAuditPinImpl,
  evidenceImpl,
  evPromptOf,
  evLineOf,
  preMergeTipOf,
  gateHeadShaOf,
  skewImpl,
  THREE,
  firstPassWorkOpts,
  runFixAndAce,
  runFloorRetry,
  parseInlineArray,
  extractLandDecisionLiterals,
  inlineHelperBlock,
  inlineHelpers,
  AGENTS_FIXTURES,
  RTRIO,
  EVIDENCE_SEAT,
  PLAIN_SEATS,
  VALIDATE_ROSTER_CASES,
  WIDEN_ROSTER_CASES,
  RESOLVE_WIDEN_CASES,
  RESOLVE_GATE_CASES,
  eligibilityMd,
  barrierTokensIn,
  windowOf,
  blockCommentSpans,
  naiveTwoStepStrip,
  EXPECTED_BLOCK_SPANS,
  GATE_TOKEN,
  PLAIN_FIXTURE_GATE,
  countOccurrences,
  planWith,
  baselineMergeResult,
  baselineLandResult,
  floorRetryImpl,
  pkgFloorRetryImpl,
  fixNeededImpl,
  SINGLE_TASK,
  bisectSubsetImpl,
  GATE_SITE_CAPTURES,
  DW_CMD,
  dwTask,
  DONE_WHEN_SITES,
  RETIRED_CRITERIA_FRAMING,
  RETIRED_CRITERIA_SAMPLES,
  DU_CMD,
  isMakePassWorker,
  runDoneUnmetLoop,
  DU_LOG,
  sliceSrc,
  CWD_IS_TIP_ASSERTING,
  RETIRED_PREMISE_SAMPLES,
  BRANCH_READ_FLAGS_ONLY_RETIRED,
  BRANCH_READ_FLAGS_ONLY_SAMPLES,
  GIT_GREP_STAYS_DENIED_RETIRED,
  GIT_GREP_NOT_AND_STAYS_DENIED_RETIRED,
  NEVER_SHELL_GREP_RETIRED,
  GIT_GREP_RETIRED_SAMPLES,
  flagTokenRe,
  HEAD_LEN,
  scanTemplateLiterals,
  LITERAL_REGISTRY,
  untaggedHeadMultiset,
  registryMultiset,
  multisetsEqual,
  sortedEntries,
  barrierEnv,
  RELAND_LABEL_STEM,
  RELAND_LABEL_PHID,
  RELAND_LABEL_FLAVOR,
  RELAND_LABEL_RE,
  SUBMOD_GUARD_RE,
  outerAssignRe,
  braceSpan,
  relandSubmodArms,
  twoIndependentTasks,
  semBlock,
  dispatchBlock,
  makeDispatch,
  BARE_INTERPOLATION_CENSUS,
  STOPLIST_ARGS,
  PRE_MERGED_ARGS,
  preMergedImpl,
  quietGate,
  GATE_AUDIT_CHECKLIST_SHA256,
  citationF,
  CITED_ADJ,
  CITE_ARGS,
  registrySlice,
  PT_ARGS,
  seatAt,
  ptImpl,
  ACE_FILE,
  aceOk,
  lensesOf,
  ptMismatchImpl,
  SCHEMA_KEYWORDS_SUPPORTED,
  evalSchema,
  EVALUATED_SCHEMAS,
  grabSchema,
  schemaKeywords,
  withBarrier,
  splitImpl,
  SPLIT_ARGS,
  approveBesideMajor,
  normalizedSrc,
  p4Base,
  polishPromptOf,
  demotionOf,
  filingPromptOf,
  PROBE,
  minor,
  floorImpl,
  DEMOTE_SITE_RE,
  demoteSites,
  reasonPrefixOf,
  NEGATIVE_REF,
  gaAbsorb,
  gaPromptOf,
  assertDispositionRuleOn,
  TERMINAL_RANGE_REVERT,
  terminalImpl,
  terminalCalls,
  carriedOf,
  fixRoundDoctrineMd,
  fixRoundRulesSection,
  FIX_APPLYING_BUILDS,
  dropDoctrineAt,
  chainRefMd,
  chainRulesSection,
  chainConst,
  CHAIN_FIX_POINTER,
  CHAIN_WORKER_POINTER,
  CHAIN_AUDIT_POINTER,
  CHAIN_EXAMPLES_POINTER,
  CHAIN_DEPTHS,
  chainExamplesH2s,
  chainBuildVariants,
  chainCode,
  polishAceImpl,
  CHAIN_FIX_BUILDS,
  dropChainFixAt,
  chainFixCaptures,
  chainFixPrompts,
  CHAIN_F1,
  CHAIN_F2,
  CHAIN_WORKER_NOTES,
  CHAIN_F3,
  CHAIN_F4,
  CHAIN_F5,
  chainDigestImpl,
  chainIndented,
  chainAudits,
  chainFixes,
  ASK_EVIDENCE_ARGS,
  askEvidenceImpl,
  evalPt,
  isMergeT1,
  SPLIT_PANEL_TASKS,
  splitPanelImpl,
  MAJOR_WITH_FIX,
  MAJOR_NO_FIX,
  auditorIdx,
  RELEASE_TASK,
  RELEASE_BLURB,
  releaseTaskImpl,
  NEVER_MOVE,
  reconciliationProof,
  realGitTools,
  pinBeforeOf,
  snapshotContextOf,
  realGitPinConfirm,
  gitTaskMerge,
  gitTaskFacts,
  confirmContextOf,
  reconcileContextOf,
  realGitMergeConfirm,
  deterministicWorkflow,
  REA_ROW,
  REA_ON,
  REA_HEAD,
  evidenceCardMd,
  isEvidenceSeat,
  reaLoudLines,
  promptsOf,
  REA_RESOLVED_PATH,
  REA_WORKER_SITES,
  ACE_TIP,
  blockedWith,
  INFRA,
  blockedAceImpl,
  keyedPinSeats,
  nonDescendantProbe,
  probeShas,
  movedProbe,
  approvedTreeProbe,
  probeAt,
  labelIdx,
  revertAwarePinSeats,
  assertLandedReverted,
  RANGE_TIP,
  SUB_TIP,
  RE_TIP,
  strayTreeAt,
  rangeRevertRepo,
  captureRangeRevertScript,
  ES_MERGE_CMD,
  mergeCommandOf,
  taskMergeSitePrompts,
  NEVER_MOVE_SENTENCE,
  es6Repo,
  bash,
  es6Phase,
  rebaseTask,
  runTrailerRead,
  assertRefused,
  READER_TOKEN,
  READER_CENSUS,
  readerCensusOf,
  mergeResultSchema,
  absorbReadOf,
  absorbFixture,
  readCharges,
  highestFor,
  evalTemplateConst,
  PROVISION_TREE_SENTENCE,
  PROVISION_CLEAN_SENTENCE,
  DEP_WAVE_PROVISION_SENTENCE,
  markerWriterOf,
  markerTestOf,
  PROVISION_CONSTS,
  provisionConstructOf,
  provisionSiteCensus,
  PROVISION_SITE_CENSUS,
  provisionFailure,
}
