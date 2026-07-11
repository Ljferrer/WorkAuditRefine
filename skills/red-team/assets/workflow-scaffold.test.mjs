import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const scaffoldPath = join(__dirname, 'workflow-scaffold.js')
const src = readFileSync(scaffoldPath, 'utf8')

// Step 2: Compile the scaffold body as an async function with Workflow globals injected.
// The Workflow harness wraps the file body as an async function; the meta export is replaced
// with a const. This mirrors the exact check in the plan.
test('scaffold syntax OK — compiles as async function body with Workflow globals', () => {
  const body = src.replace(/^export const meta/m, 'const meta')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  // Must not throw
  new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', body)
})

// Step 3: All 6 spine lens names present + BESPOKE PROBES injection point + adversarial-confirm stage.
const SPINE_NAMES = [
  'claims-vs-reality',
  'executable-proof',
  'coverage-vs-source',
  'consistency-placeholders',
  'dependency-feasibility',
  'intent-vs-plan',
]

for (const name of SPINE_NAMES) {
  test(`scaffold structure OK — spine lens '${name}' present`, () => {
    assert.ok(src.includes(`name: '${name}'`), `Missing spine lens: ${name}`)
  })
}

test("scaffold structure OK — BESPOKE PROBES injection point present", () => {
  assert.ok(src.includes('BESPOKE PROBES'), 'Missing BESPOKE PROBES injection point')
})

test("scaffold structure OK — adversarial-confirm declared as named constant", () => {
  assert.ok(
    src.includes("ADVERSARIAL_CONFIRM = 'adversarial-confirm'"),
    "Missing named constant: ADVERSARIAL_CONFIRM = 'adversarial-confirm'"
  )
})

test("scaffold structure OK — adversarial-confirm survives comment stripping", () => {
  // Strip line comments (// to end of line) and block comments (/* ... */)
  const stripped = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(
    stripped.includes('adversarial-confirm'),
    "adversarial-confirm not present in non-comment source — must appear in executable code"
  )
})

// --- Behavioral harness: run the scaffold exactly as the Workflow runtime does --------------
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function compileScaffold() {
  const body = src.replace(/^export const meta/m, 'const meta')
  return new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', body)
}

// Faithful pipeline: each item flows through every stage independently; a throwing stage drops
// it to null (mirrors the Workflow tool's documented pipeline() semantics).
async function fakePipeline(items, ...stages) {
  return Promise.all(items.map(async (item, i) => {
    let v = item
    for (const stage of stages) {
      try { v = await stage(v, item, i) } catch { return null }
    }
    return v
  }))
}

// Run the scaffold with a mock `agent`. agentImpl(prompt, opts) returns the probe/confirm result
// (or null to simulate a dead probe). Captures every prompt + opts and every log line.
async function runScaffold(args, agentImpl) {
  const prompts = [], logs = []
  const fn = compileScaffold()
  const agent = async (prompt, opts = {}) => { prompts.push({ prompt, opts }); return agentImpl(prompt, opts) }
  const log = (m) => logs.push(m)
  const out = await fn(agent, () => {}, fakePipeline, log, () => {}, args, {})
  return { out, prompts, logs }
}

const FP = { absPath: '/abs/PLAN.md', titleLine: '# Land-path-agnostic Wrap-up', tokens: ['## A'] }
const anchorOf = (a) => ({ resolved_path: a.planFile, plan_title: a.fingerprint.titleLine })
const baseArgs = (over = {}) =>
  ({ planFile: '/abs/PLAN.md', repo: '/abs/REPO', sourceSpec: '/abs/SPEC.md', fingerprint: FP, probes: [], ...over })
// Default mock: every probe passes, attesting it read the right plan.
const passResult = (a) => (_, opts) =>
  ({ probe: opts.label, kind: 'spine', technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] })

test('scaffold return threads the fingerprint + expected + repo to the gate', async () => {
  const a = baseArgs()
  const { out } = await runScaffold(a, passResult(a))
  assert.deepEqual(out.fingerprint, FP, 'fingerprint is threaded through unchanged')
  assert.equal(out.repo, '/abs/REPO', 'repo is returned for the gate under-repo check')
  assert.equal(out.expected, 6, 'total probe slots attempted (6 spine, sourceSpec set)')
  assert.equal(out.plan, '/abs/PLAN.md')
})

test('scaffold aborts when no fingerprint is supplied (Lead pre-flight is mandatory)', async () => {
  await assert.rejects(
    runScaffold(baseArgs({ fingerprint: undefined }), () => ({ status: 'pass', findings: [] })),
    /fingerprint/i,
    'a missing fingerprint must fail loud, not run unanchored probes'
  )
})

test('scaffold structure OK — scopeLock is a declared, invoked constant (survives comment stripping)', () => {
  const stripped = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/scopeLock\s*=/.test(stripped), 'scopeLock must be a declared constant, not only a comment')
  assert.ok(/scopeLock\(/.test(stripped), 'scopeLock must be invoked in executable code')
})

test('every probe prompt is scope-locked to the absolute planFile + repo + fingerprint title', async () => {
  const a = baseArgs({ probes: [
    { name: 'b1', kind: 'bespoke', technique: 'executed', prompt: 'do b1' },
    { name: 'b2', kind: 'bespoke', technique: 'analyzed', prompt: 'do b2' },
  ] })
  const { prompts } = await runScaffold(a, passResult(a))
  const probePrompts = prompts.filter(p => p.opts.phase === 'Probe')
  assert.equal(probePrompts.length, 8, '6 spine (sourceSpec set keeps coverage-vs-source) + 2 bespoke')
  for (const { prompt } of probePrompts) {
    assert.match(prompt, /SCOPE-LOCK/, 'every probe prompt carries the SCOPE-LOCK preamble')
    assert.ok(prompt.includes('/abs/PLAN.md'), 'scope-lock names the absolute planFile')
    assert.ok(prompt.includes('/abs/REPO'), 'scope-lock names the absolute repo')
    assert.ok(prompt.includes('Land-path-agnostic Wrap-up'), 'scope-lock names the expected plan title')
    assert.match(prompt, /IGNORE the session cwd/, 'scope-lock disowns the ambient cwd')
  }
})

test('executed probes are told to work in a COPY of repo; analyzed probes are read-restricted', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  assert.match(byLabel['probe:executable-proof'], /cp -R|worktree add/, 'executed probe copies the repo')
  assert.match(byLabel['probe:executable-proof'], /git -C /, 'executed probe runs git via git -C <sandbox>, not a stateful cd')
  assert.match(byLabel['probe:claims-vs-reality'], /Restrict every Read/, 'analyzed probe is read-restricted to repo')
})

test('executable-proof extracts + runs plan-authored requiresTest:false grep guards and pins the sentence-case default', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  const ep = byLabel['probe:executable-proof']
  // The tightened gist must name the requiresTest:false verification-command class explicitly.
  assert.match(ep, /requiresTest:false/, 'executed probe must name requiresTest:false verification commands')
  // It must exercise the re-cased / re-positioned landing site (the sentence-case false-negative class).
  assert.match(ep, /re-cased|re-positioned/i, 'executed probe must re-run the guard against a re-cased/re-positioned site')
  assert.match(ep, /false-negate|false-negative/i, 'executed probe must flag a guard that false-negates on drift')
  // It must state the compliant default: case-insensitive grep anchored on a stable mid-sentence token.
  assert.match(ep, /grep -rin/, 'executed probe must state the case-insensitive grep -rin default')
  assert.match(ep, /mid-sentence token/, 'executed probe must require anchoring on a stable mid-sentence token')
})

test('FINDINGS schema requires read_anchor (Layer 3 attestation is mandatory)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  const required = probe.opts.schema.required
  assert.ok(required.includes('read_anchor'), 'read_anchor is a required FINDINGS field')
  assert.ok(probe.opts.schema.properties.read_anchor.required.includes('resolved_path'))
  assert.ok(probe.opts.schema.properties.read_anchor.required.includes('plan_title'))
})

test('a dropped probe is retried once, then emitted as a { probe, dropped:true } marker', async () => {
  const a = baseArgs()
  let calls = 0
  // claims-vs-reality dies on BOTH the initial run and the retry; everything else passes.
  const { out, logs } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:claims-vs-reality') { calls++; return null }
    return { probe: opts.label, technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.equal(calls, 2, 'the dead probe was attempted twice (initial + one retry)')
  const marker = out.probeResults.find(r => r && r.dropped === true)
  assert.ok(marker, 'a dropped marker is emitted, not a silent omission')
  assert.equal(marker.probe, 'claims-vs-reality')
  assert.equal(out.probeResults.length, out.expected, 'every probe slot yields a result or a marker')
  assert.ok(logs.some(l => /retry/i.test(l)), 'the retry is logged')
})

test('a probe that dies once then succeeds on retry yields a real result (no marker)', async () => {
  const a = baseArgs()
  let first = true
  const { out } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:dependency-feasibility' && first) { first = false; return null }
    return { probe: opts.label, technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.ok(!out.probeResults.some(r => r && r.dropped === true), 'retry succeeded — no dropped marker')
  assert.equal(out.probeResults.length, out.expected)
})

// --- Task 5 (#76): executed-probe provisioning via a Lead-supplied `provision` list -----------
// The scaffold itself runs no shell — the EXECUTED probe agent does, inside its throwaway sandbox.
// Threading `provision` therefore means injecting the pinned commands into the executed-probe
// SCOPE-LOCK with a hard directive: run them BEFORE the baseline, and a FAILING step is `warn`
// + an env-gap note, NEVER a red/fail verdict. Analyzed probes (read-only) never provision.
const PROVISION = ['git submodule update --init --recursive', 'pnpm install --frozen-lockfile']

// Grab the prompt of a representative executed / analyzed spine probe for a given args set.
async function promptsByLabel(over = {}) {
  const a = baseArgs(over)
  const { prompts } = await runScaffold(a, passResult(a))
  return Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
}

test('provision: an executed-probe scope-lock runs the provision list BEFORE the baseline', async () => {
  const byLabel = await promptsByLabel({ provision: PROVISION })
  const executed = byLabel['probe:executable-proof']
  // Every pinned command is injected verbatim into the executed-probe prompt.
  for (const cmd of PROVISION) {
    assert.ok(executed.includes(cmd), `executed-probe prompt must inject provision command: ${cmd}`)
  }
  // It must be ordered as a pre-step: provisioning is named as happening BEFORE the baseline / before running anything.
  assert.match(executed, /before .*baseline|before .*run|first.*provision|provision.*first/i,
    'executed-probe prompt must instruct provisioning BEFORE the baseline')
  // The provision block must sit ahead of the probe's own task text in the assembled prompt.
  const provisionIdx = executed.indexOf(PROVISION[0])
  const taskIdx = executed.indexOf('Extract every runnable artifact') // executable-proof's prompt gist
  assert.ok(provisionIdx !== -1 && taskIdx !== -1 && provisionIdx < taskIdx,
    'the provision step must appear ahead of the probe baseline task in the prompt')
})

test('provision: a failing provision step is directed to warn (NEVER red/fail)', async () => {
  const byLabel = await promptsByLabel({ provision: PROVISION })
  const executed = byLabel['probe:executable-proof']
  // Isolate the provision directive block so the assertion can't be satisfied by unrelated
  // pre-existing text (e.g. "NEVER mutate") elsewhere in the scope-lock.
  const provLine = executed.split('\n').find(l => /provision/i.test(l) && /warn/i.test(l))
  assert.ok(provLine, 'there must be a provision directive line that mentions warn')
  assert.match(provLine, /status\s+to\s+["']?warn|status[:=]\s*["']?warn|→\s*["']?warn|yields?\s+["']?warn/i,
    'a failed provision step must be directed to status:"warn"')
  assert.match(executed, /env[- ]?gap|environment gap/i, 'a failed provision step must carry an env-gap note')
  // The failure→warn directive must explicitly forbid a red/fail verdict (in the provision context).
  assert.ok(/never\s+(a\s+)?(red|fail)|not\s+(a\s+)?(red|fail)|never\s+red|not\s+red/i.test(executed),
    'a failed provision step must be told NOT to produce a red/fail verdict')
})

test('provision: analyzed (read-only) probes are NOT given provision commands', async () => {
  const byLabel = await promptsByLabel({ provision: PROVISION })
  const analyzed = byLabel['probe:claims-vs-reality']
  for (const cmd of PROVISION) {
    assert.ok(!analyzed.includes(cmd),
      `analyzed read-only probe must NOT receive provision command: ${cmd}`)
  }
})

test('provision: a warn result for an executed probe is NOT escalated to a blocker', async () => {
  // End-to-end: even when an executed probe self-reports status:"warn" with an env-gap finding,
  // the scaffold/confirm path must leave it a warn (no Critical/Major), so no red/blocked verdict.
  const a = baseArgs({ provision: PROVISION })
  // The real agent returns probe=<name> (no `probe:` prefix); mirror that contract.
  const nameOf = (label) => label.replace(/^probe:/, '')
  const { out } = await runScaffold(a, (_, opts) => {
    const base = { probe: nameOf(opts.label), technique: opts.label === 'probe:executable-proof' ? 'executed' : 'analyzed',
      read_anchor: anchorOf(a), status: 'pass', findings: [] }
    if (opts.phase === 'Probe' && opts.label === 'probe:executable-proof') {
      return { ...base, status: 'warn',
        findings: [{ severity: 'Minor', claim: 'provision', reality: 'env-gap: pnpm install failed', evidence: 'exit 1' }] }
    }
    return base
  })
  const ep = out.probeResults.find(r => r && r.probe === 'executable-proof')
  assert.ok(ep, 'the executable-proof probe yields a result')
  assert.equal(ep.status, 'warn', 'an env-gap provision failure stays warn')
  assert.ok(!(ep.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major'),
    'a provision env-gap must never carry a blocking (Critical/Major) severity')
})

// --- Task 1.1 (#49): parse-if-string normalization of args -----------------------------------
test('args as JSON string: run does not reject, fingerprint/repo/expected thread correctly', async () => {
  const a = baseArgs()
  const { out } = await runScaffold(JSON.stringify(a), passResult(a))
  assert.deepEqual(out.fingerprint, FP, 'fingerprint threads through when args is a JSON string')
  assert.equal(out.repo, '/abs/REPO', 'repo threads through when args is a JSON string')
  assert.equal(out.expected, 6, 'expected probe count is correct when args is a JSON string')
  assert.equal(out.plan, '/abs/PLAN.md')
})

test('malformed JSON string for args: still rejects with /fingerprint/i (guard intact)', async () => {
  await assert.rejects(
    runScaffold('{not valid json', () => ({ status: 'pass', findings: [] })),
    /fingerprint/i,
    'malformed JSON args must still fail with the fingerprint guard message, not a raw SyntaxError'
  )
})

// --- Task 1.1 (#49): non-null-object args guard (ADR 0034 ingest guard) -------------------------
// A scalar/array arg is normalized to {} — same posture as the catch — so the fingerprint refusal
// fires cleanly and uniformly. Delete-the-feature RED case is 'null' (the only scalar that threw a
// raw destructure TypeError pre-guard); 'true'/'5' already reached the refusal today (they
// destructure to all-undefined), so the guard's benefit for them is uniformity, not a crash fix.
for (const scalar of ["'null' (JSON scalar)", "'true' (JSON scalar)", "'5' (JSON scalar)"]) {
  const raw = scalar.split(' ')[0].replace(/'/g, '')
  test(`scalar args ${scalar}: normalized to {}, produces the clean titleLine refusal (not a raw TypeError)`, async () => {
    await assert.rejects(
      runScaffold(raw, () => ({ status: 'pass', findings: [] })),
      /fingerprint/i,
      `${raw} must normalize to {} and hit the fingerprint guard, not a raw TypeError/SyntaxError`
    )
  })
}

test('array args: normalized to {}, produces the clean titleLine refusal', async () => {
  await assert.rejects(
    runScaffold('[1,2,3]', () => ({ status: 'pass', findings: [] })),
    /fingerprint/i,
    'a JSON array must normalize to {} and hit the fingerprint guard'
  )
})

test('non-null-object args guard is present in the source (delete-the-feature anchor)', () => {
  // Reverting the guard makes 'null' throw a raw TypeError instead of the fingerprint refusal.
  assert.ok(
    /typeof\s+parsed\s*===\s*'object'\s*&&\s*parsed\s*!==\s*null\s*&&\s*!Array\.isArray\(parsed\)/.test(src),
    'the parse success path must normalize non-null-object results to {}'
  )
})

test('valid object args still validate as before (guard does not regress the happy path)', async () => {
  const a = baseArgs()
  const { out } = await runScaffold(a, passResult(a))
  assert.deepEqual(out.fingerprint, FP, 'a valid args object threads through unchanged')
  assert.equal(out.repo, '/abs/REPO')
})

// --- Task 3.1 (#50 probe side): FINDINGS-means-defect contract ---------------------------------
test("scaffold structure OK — runProbe prompt instructs 'do NOT record' a claim that checks out", async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  assert.ok(probe.prompt.includes('do NOT record'),
    "runProbe prompt must tell the agent NOT to record claims that check out")
})

test("scaffold structure OK — runProbe prompt says a clean probe returns status:'pass' with findings:[]", async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  assert.ok(probe.prompt.includes('findings:[]'),
    "runProbe prompt must say a clean probe returns findings:[]")
})

test("FINDINGS schema: findings array description includes 'defect'", async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  const desc = probe.opts.schema.properties.findings.description
  assert.ok(desc && desc.toLowerCase().includes('defect'),
    "FINDINGS.properties.findings.description must include the word 'defect'")
})

// --- #311 (probe-side): precondition-vs-deliverable rule reaches every ANALYZED probe ----------
// The futureWorkRule layer (mirrors scopeLock; ADR 0032 generalized it from the #311 preconditionRule)
// selects its analyzed presence-check variant here, prepended so spine claims-vs-reality/
// consistency-placeholders/coverage-vs-source AND any bespoke analyzed probe inherit it. The 1b
// assertion (the retained-findings carve-out) is the LOAD-BEARING non-blunting guard: blunting the
// rule to a bare "ignore proposed changes" strips this phrase and goes RED.
const ANALYZED_PROBES_311 = ['claims-vs-reality', 'consistency-placeholders', 'coverage-vs-source']

test('#311: every analyzed probe prompt carries the PRECONDITION vs DELIVERABLE rule + retained-findings carve-out', async () => {
  const a = baseArgs({ probes: [
    { name: 'bespoke-analyzed', kind: 'bespoke', technique: 'analyzed', prompt: 'do bespoke analyzed' },
  ] })
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  for (const name of [...ANALYZED_PROBES_311, 'bespoke-analyzed']) {
    const prompt = byLabel[`probe:${name}`]
    assert.ok(prompt, `analyzed probe ${name} must be present`)
    // 1a — stable rule token
    assert.match(prompt, /PRECONDITION vs DELIVERABLE/, `analyzed probe '${name}' must carry the precondition rule token`)
    // 1b — LOAD-BEARING non-blunting assertion: the retained-findings carve-out phrase.
    assert.match(prompt, /false claim about EXISTING code/, `analyzed probe '${name}' must retain the 'false claim about EXISTING code' carve-out (non-blunting guard)`)
  }
})

test('#311/ADR0032: executed probes get the executed FUTURE-WORK variant, NOT the analyzed PRECONDITION-vs-DELIVERABLE wording', async () => {
  const a = baseArgs({ probes: [
    { name: 'bespoke-executed', kind: 'bespoke', technique: 'executed', prompt: 'do bespoke executed' },
  ] })
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  for (const label of ['probe:executable-proof', 'probe:bespoke-executed']) {
    assert.ok(byLabel[label], label + ' must be present')
    // An executed probe RUNS artifacts in a sandbox — it gets the future-work-vs-defect framing,
    // never the analyzed presence-check PRECONDITION-vs-DELIVERABLE heading (technique-scoped variant).
    assert.ok(!/PRECONDITION vs DELIVERABLE/.test(byLabel[label]),
      label + ': executed probes must not carry the analyzed PRECONDITION-vs-DELIVERABLE heading')
    assert.match(byLabel[label], /FUTURE WORK vs DEFECT/,
      label + ': executed probes carry the executed future-work variant')
  }
})

// --- Task 3 (#443): intent-vs-plan spine lens — missing intent section is Minor, never Major ---
test("intent-vs-plan: missing Commander's Intent → pass + Minor note, never Major (criterion 9)", async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  const prompt = byLabel['probe:intent-vs-plan']
  assert.ok(prompt, 'intent-vs-plan spine probe must run')          // presence guard — negative asserts below are vacuous without it
  assert.match(prompt, /Commander's Intent/, 'lens prompt names the ## Commander\'s Intent section')
  assert.match(prompt, /Minor, never a Major/, 'a missing intent section is directed to Minor, never Major')
  assert.match(prompt, /status:"pass"/, 'a missing intent section still returns status:"pass"')
  assert.match(prompt, /intent interview/, 'the Minor note recommends the intent interview')
})

// --- Task 5 (#462): intent-vs-plan recognizes BOTH intent headings in BOTH branches (spec §4.4, criterion 4) ---
test('intent-vs-plan: both branches name both intent headings (criterion 4)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  const prompt = byLabel['probe:intent-vs-plan']
  assert.ok(prompt, 'intent-vs-plan spine probe must run')          // presence guard — asserts below are vacuous without it
  // positive branch fires on EITHER heading — must name both
  assert.match(prompt, /either a "## Commander's Intent" or an "## AI-Commander's Intent" section/,
    'positive branch fires on either heading, naming both')
  // negative branch fires only when NEITHER heading is present — must name both
  assert.match(prompt, /NEITHER a "## Commander's Intent" nor an "## AI-Commander's Intent" section/,
    'negative branch fires only when neither heading is present, naming both')
  // an AI-Commander's Intent block is intent-present, judged identically, + upgrade-path Minor note
  assert.match(prompt, /judged identically/,
    'an AI-Commander\'s Intent block is judged identically to operator intent')
  assert.match(prompt, /\/war-strategy /,
    'the Minor note recommends the /war-strategy human upgrade path')
})

test(`provision BACK-COMPAT: an empty provision list must not change prompts vs an absent one`, async () => {
  // The executed-probe and analyzed-probe prompts with NO provision list must be IDENTICAL to the
  // prompts produced when the key is entirely absent — i.e. provisioning adds zero bytes when unused.
  const absent = await promptsByLabel({})                 // baseArgs has no `provision`
  const emptyList = await promptsByLabel({ provision: [] })
  for (const label of Object.keys(absent)) {
    assert.equal(emptyList[label], absent[label],
      `back-compat: an empty provision list must not change probe '${label}' by a single byte`)
  }
  // And the executed-probe prompt must contain NONE of the provision scaffolding tokens.
  assert.ok(!/env[- ]?gap/i.test(absent['probe:executable-proof']),
    'back-compat: with no provision list the executed-probe prompt carries no env-gap provisioning text')
})

// --- Task 1.1 (ADR 0032): artifactKind + futureWorkRule + deliverableAbsence + scope-lock hardening ---

// End state 1 — args.artifactKind appears in every emitted probe prompt (spine + bespoke) and
// defaults to 'impl-plan' when absent. Delete the `(artifact kind: ${artifactKind})` interpolation
// from futureWorkRule and this goes RED.
test('artifactKind: threads into EVERY probe prompt (spine + bespoke) and defaults to impl-plan when absent', async () => {
  const bespoke = [
    { name: 'b-exec', kind: 'bespoke', technique: 'executed', prompt: 'do exec' },
    { name: 'b-an', kind: 'bespoke', technique: 'analyzed', prompt: 'do an' },
  ]
  // absent artifactKind → default 'impl-plan' in every probe
  const a = baseArgs({ probes: bespoke })
  const { prompts } = await runScaffold(a, passResult(a))
  const probePrompts = prompts.filter(p => p.opts.phase === 'Probe')
  assert.equal(probePrompts.length, 8, '6 spine + 2 bespoke')
  for (const { prompt, opts } of probePrompts) {
    assert.match(prompt, /impl-plan/, `default artifactKind 'impl-plan' absent from probe '${opts.label}'`)
  }
  // explicit artifactKind threads through to every probe
  const a2 = baseArgs({ artifactKind: 'design-doc', probes: bespoke })
  const { prompts: p2 } = await runScaffold(a2, passResult(a2))
  for (const { prompt, opts } of p2.filter(p => p.opts.phase === 'Probe')) {
    assert.match(prompt, /design-doc/, `explicit artifactKind 'design-doc' absent from probe '${opts.label}'`)
  }
})

// End state 2 — executed carries the future-work clause; for tdd-plan the executed clause states a
// pre-implementation red test is status:"pass"; the analyzed carve-out is still present (control).
test('futureWorkRule: executed carries the future-work clause; tdd-plan red-test is pass; analyzed keeps the carve-out', async () => {
  const ai = baseArgs()
  const { prompts: pi } = await runScaffold(ai, passResult(ai))
  const byI = Object.fromEntries(pi.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  // executed probe carries the future-work (deliverable-baseline) clause
  assert.match(byI['probe:executable-proof'], /FUTURE WORK vs DEFECT/, 'executed probe carries the future-work clause')
  assert.match(byI['probe:executable-proof'], /deliverable baseline/, 'executed future-work clause names the deliverable baseline')
  // analyzed carve-out control: the retained-findings phrase stays on analyzed probes
  assert.match(byI['probe:claims-vs-reality'], /false claim about EXISTING code/, 'analyzed probe keeps the retained-findings carve-out')
  // tdd-plan: the executed clause states a pre-implementation red test is status:"pass"
  const at = baseArgs({ artifactKind: 'tdd-plan' })
  const { prompts: pt } = await runScaffold(at, passResult(at))
  const byT = Object.fromEntries(pt.filter(p => p.opts.phase === 'Probe').map(p => [p.opts.label, p.prompt]))
  assert.match(byT['probe:executable-proof'], /runs RED before its implementation lands is status:"pass"/,
    'tdd-plan executed clause: a pre-implementation red test is status:"pass"')
  // and the analyzed tdd variant also states the red-test-is-pass baseline
  assert.match(byT['probe:claims-vs-reality'], /RED before its implementation lands is the EXPECTED baseline \(status:"pass"\)/,
    'tdd-plan analyzed variant: a red pre-implementation test is the expected baseline')
})

// End state 7 — the executed scope-lock emits the git -C <sandbox> directive and the explicit
// no-bare-`git push` / cwd-reset warning.
test('scope-lock (executed): emits git -C <sandbox> + the no-bare-git-push / cwd-reset warning (criterion 7)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  const ep = byLabel['probe:executable-proof']
  assert.match(ep, /git -C <abs-sandbox>/, 'executed scope-lock directs git -C <abs-sandbox> for every git call')
  assert.match(ep, /RESETS cwd between calls/, 'executed scope-lock warns the Bash tool resets cwd between calls')
  assert.match(ep, /NEVER run a bare `git push`/, 'executed scope-lock forbids a bare git push')
  assert.match(ep, /cwd-reset escape/, 'executed scope-lock cites the recorded cwd-reset escape')
})

// The optional deliverableAbsence flag is added to the FINDINGS schema here (Task 1.1); the gate
// (Task 1.2) is what demotes it. Deleting the schema property goes RED.
test('FINDINGS schema: findings items carry the optional deliverableAbsence boolean flag', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  const props = probe.opts.schema.properties.findings.items.properties
  assert.deepEqual(props.deliverableAbsence, { type: 'boolean' }, 'findings items carry deliverableAbsence:{type:"boolean"}')
  // the prompt instructs the probe to set the flag only for a coverage-vs-source-mapped deliverable
  assert.match(probe.prompt, /deliverableAbsence:true/, 'the probe prompt instructs setting deliverableAbsence:true')
  assert.match(probe.prompt, /coverage-vs-source/, 'the flag instruction scopes to a coverage-vs-source-mapped deliverable')
})
