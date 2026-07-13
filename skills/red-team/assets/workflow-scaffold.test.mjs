import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'

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
  // claims-vs-reality (analyzed) dies for EVERY agent type on both the initial run and the retry;
  // everything else passes. With the #727 analyzed-agent fallback, a dead analyzed dispatch fans out
  // to preferred (Explore) + fallback (general-purpose) — 2 dispatches per pipeline pass — and
  // Layer 4 retries the whole probe once, so the documented worst-case bound is 2 × 2 = 4 dispatches.
  const { out, logs } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:claims-vs-reality') { calls++; return null }
    return { probe: opts.label, technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.equal(calls, 4, 'the dead analyzed probe was dispatched 4× (preferred+fallback per pass × initial+one retry)')
  const marker = out.probeResults.find(r => r && r.dropped === true)
  assert.ok(marker, 'a dropped marker is emitted, not a silent omission')
  assert.equal(marker.probe, 'claims-vs-reality')
  assert.equal(out.probeResults.length, out.expected, 'every probe slot yields a result or a marker')
  assert.ok(logs.some(l => /retry/i.test(l)), 'the retry is logged')
})

test('a probe that dies once then succeeds on the Layer-4 retry yields a real result (no marker)', async () => {
  const a = baseArgs()
  let first = true
  // executable-proof is EXECUTED (agentType undefined) — it bypasses the analyzed-agent fallback, so
  // a single transient death is recovered by the Layer-4 retry alone (not the fallback). This keeps a
  // pure Layer-4 retry-recovery test for the bypass path; the fallback recovery path is covered by
  // the #727 cases below.
  const { out } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:executable-proof' && first) { first = false; return null }
    return { probe: opts.label, technique: opts.agentType === undefined ? 'executed' : 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.ok(!out.probeResults.some(r => r && r.dropped === true), 'the Layer-4 retry succeeded — no dropped marker')
  assert.equal(out.probeResults.length, out.expected)
})

// --- Task 5 (#76): executed-probe provisioning via a Lead-supplied `provision` list -----------
// The scaffold itself runs no shell — the EXECUTED probe agent does, inside its throwaway sandbox.
// Threading `provision` therefore means injecting the pinned commands into the executed-probe
// SCOPE-LOCK with a hard directive: run them BEFORE the baseline, and a FAILING step is `warn`
// + an env-gap note stamped `envGap: true` (the gate demotes it to a Minor), NEVER a red/fail
// verdict. Analyzed probes (read-only) never provision.
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

// Task 1.1 (#807): the envGap flag is added to the FINDINGS schema; the gate (red-team-gate.mjs
// classify()) is what demotes it. Deleting the schema property goes RED.
test('FINDINGS schema: findings items carry the optional envGap boolean flag (End state 2)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  const props = probe.opts.schema.properties.findings.items.properties
  assert.deepEqual(props.envGap, { type: 'boolean' }, 'findings items carry envGap:{type:"boolean"}')
})

// --- #727: analyzed-agent reactive fallback (Explore → general-purpose) --------------------------
// Behavioral cases on the mock-agent harness above. Agent-name literals ('Explore',
// 'general-purpose') are DELIBERATELY hardcoded here: the scaffold compiles as a function body
// (nothing importable), so a future default-agent change must LOUDLY break these tests, not ride
// through silently. Every case is a delete-the-feature check — each goes RED against the pre-change
// scaffold (stash the scaffold edits); recorded in the task done-report (End-state 12).
const GATE = join(__dirname, 'red-team-gate.mjs')

// A well-formed FINDINGS result for a probe dispatch, on-target for args `a`. `over` overrides
// status/findings (e.g. a blocking fail). Confirms return their own CONFIRM shape inline.
const okResult = (a, opts, over = {}) => ({
  probe: String(opts.label).replace(/^probe:/, '').replace(/^adversarial-confirm:/, ''),
  kind: 'spine', technique: opts.agentType === undefined ? 'executed' : 'analyzed',
  status: 'pass', read_anchor: anchorOf(a), findings: [], ...over })
const MAJOR = [{ severity: 'Major', claim: 'c', reality: 'r' }]

// End-state 1 + 2: a dead preferred (Explore) analyzed dispatch — whether it THROWS or returns
// NULL (both harness-version-dependent failure shapes) — recovers under the general-purpose
// fallback: real results for every analyzed probe, zero dropped markers, a captured fallback
// dispatch, and the stable diagnostic token.
for (const shape of ['throw', 'null']) {
  test(`#727 fallback recovery (${shape}): a dead Explore analyzed probe recovers under general-purpose, zero drops`, async () => {
    const a = baseArgs()
    const { out, prompts, logs } = await runScaffold(a, (_, opts) => {
      if (opts.agentType === 'Explore') { if (shape === 'throw') throw new Error("agent type 'Explore' not found"); return null }
      return okResult(a, opts)
    })
    assert.ok(!out.probeResults.some(r => r && r.dropped), 'no probe dropped — the fallback recovered every analyzed probe')
    assert.equal(out.probeResults.length, out.expected, 'every probe slot yields a result')
    assert.ok(prompts.some(p => p.opts.phase === 'Probe' && p.opts.agentType === 'general-purpose'),
      'an analyzed probe was re-dispatched with agentType general-purpose')
    const fallbackLogs = logs.filter(l => /analyzed-agent fallback engaged/.test(l))
    assert.ok(fallbackLogs.length > 0, 'the stable analyzed-agent fallback log token is emitted')
    assert.ok(fallbackLogs.every(l => !/retrying once/.test(l)), 'the fallback token is greppably distinct from the Layer-4 retry line')
  })
}

// End-state 3: with BOTH agent types dead for analyzed probes, each analyzed probe stays LOUD —
// a { probe, dropped:true } marker, `expected` intact, executed probes untouched — and the scaffold
// output piped through the real gate yields verdict INCOMPLETE (committed, not a manual claim).
test('#727 exhausted fallback stays loud: both types dead → dropped markers + gate INCOMPLETE (End-state 3)', async () => {
  const a = baseArgs()
  const { out, logs } = await runScaffold(a, (_, opts) => {
    if (opts.agentType !== undefined) return null   // both Explore AND general-purpose die (any analyzed dispatch)
    return okResult(a, opts)                          // executed probes (undefined agentType) answer normally
  })
  for (const name of ['claims-vs-reality', 'coverage-vs-source', 'consistency-placeholders', 'dependency-feasibility', 'intent-vs-plan']) {
    assert.ok(out.probeResults.some(r => r && r.dropped === true && r.probe === name), `analyzed probe ${name} emits a dropped marker`)
  }
  assert.equal(out.expected, 6, 'expected still equals the full probe count')
  const exec = out.probeResults.find(r => r && r.probe === 'executable-proof')
  assert.ok(exec && !exec.dropped, 'the executed probe is untouched by the analyzed-agent fallback')
  assert.ok(logs.some(l => /analyzed-agent fallback engaged/.test(l)), 'the fallback token fires even when exhausted (RED on the pre-change scaffold)')
  const gate = spawnSync(process.execPath, [GATE, '--stdin'], { input: JSON.stringify(out), encoding: 'utf8' })
  assert.equal(gate.status, 0, `gate must exit 0 on a classified verdict; stderr=${gate.stderr}`)
  const g = JSON.parse(gate.stdout)
  assert.equal(g.verdict, 'INCOMPLETE', 'a both-dead run gates to INCOMPLETE (dropped coverage is fail-closed)')
  assert.ok(g.summary.dropped.includes('claims-vs-reality'), 'the gate summary reports the dropped analyzed probes')
})

// End-state 3 (confirm site): a blocking analyzed probe whose CONFIRM dies for both agent types
// drops the whole slot — the exhausted dispatcher RETHROWS (never returns null), so the item is
// nulled and Layer-4 marks it dropped, rather than a null confirm falling through
// `if (c && c.reproduced === false)` and letting an unconfirmed fail stand as a blocker (the Notes
// deviation: on the pre-change scaffold this same mock leaves the fail STANDING → RED here).
test('#727 confirm-site both-dead: a blocking analyzed probe whose confirm exhausts both types → dropped, never a standing fail', async () => {
  const a = baseArgs()
  const { out, logs } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Confirm') return null   // the confirm dies for BOTH Explore and general-purpose
    if (opts.label === 'probe:claims-vs-reality') return okResult(a, opts, { status: 'fail', findings: MAJOR })
    return okResult(a, opts)
  })
  assert.ok(out.probeResults.some(r => r && r.dropped === true && r.probe === 'claims-vs-reality'),
    'the blocking probe drops once its confirm exhausts both agent types')
  assert.ok(!out.probeResults.some(r => r && r.probe === 'claims-vs-reality' && r.status === 'fail'),
    'no unconfirmed fail is left standing as a blocker (rethrow, not return-null)')
  assert.equal(out.expected, 6, 'expected still equals the full probe count')
  assert.ok(logs.some(l => /analyzed-agent fallback engaged/.test(l)), 'the confirm dispatch attempted the fallback before exhausting')
})

// End-state 4: executed probes (agentType undefined) BYPASS the wrapper — undefined agentType,
// exactly one dispatch each — while analyzed probes in the SAME dead-Explore run fall back to
// general-purpose (the contrast is what makes this RED on the pre-change scaffold).
test('#727 executed probes never wrapped: undefined agentType, one dispatch, while analyzed fall back (End-state 4)', async () => {
  const a = baseArgs({ probes: [{ name: 'b-exec', kind: 'bespoke', technique: 'executed', prompt: 'do b-exec' }] })
  const { out, prompts } = await runScaffold(a, (_, opts) => {
    if (opts.agentType === 'Explore') throw new Error("agent type 'Explore' not found")
    return okResult(a, opts)
  })
  for (const label of ['probe:executable-proof', 'probe:b-exec']) {
    const dispatches = prompts.filter(p => p.opts.label === label)
    assert.equal(dispatches.length, 1, `${label} dispatched exactly once — the fallback never touches the executed path`)
    assert.strictEqual(dispatches[0].opts.agentType, undefined, `${label} keeps agentType undefined`)
  }
  assert.ok(prompts.some(p => p.opts.phase === 'Probe' && p.opts.agentType === 'general-purpose'),
    'analyzed probes fell back to general-purpose (a fallback ran and left the executed path alone)')
  assert.ok(!out.probeResults.some(r => r && r.dropped), 'no drops — analyzed recovered, executed passed')
})

// End-state 5 (override): args.analyzedAgentType is the dispatched preferred type at BOTH the probe
// (runProbe) and the adversarial-confirm (confirmStage) sites.
test('#727 override honored: analyzedAgentType is the dispatched type at BOTH the probe and confirm sites (End-state 5)', async () => {
  const a = baseArgs({ analyzedAgentType: 'custom-agent' })
  const { prompts } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Confirm') return { reproduced: true }
    if (opts.label === 'probe:claims-vs-reality') return okResult(a, opts, { status: 'fail', findings: MAJOR })
    return okResult(a, opts)
  })
  const probe = prompts.find(p => p.opts.label === 'probe:claims-vs-reality')
  assert.equal(probe.opts.agentType, 'custom-agent', 'the probe site dispatches the overridden preferred type')
  const confirm = prompts.find(p => p.opts.label === 'adversarial-confirm:claims-vs-reality')
  assert.ok(confirm, 'the blocking probe ran its adversarial-confirm')
  assert.equal(confirm.opts.agentType, 'custom-agent', 'the confirm site dispatches the overridden preferred type')
})

// End-state 5 (preferred === fallback): overriding the preferred type to 'general-purpose' means a
// dead dispatch has no distinct fallback to try — the redundant-dispatch guard skips the identical
// re-dispatch and goes straight to the rethrow/Layer-4 path (one dispatch per pipeline pass, no
// fallback-engaged log).
test('#727 preferred===fallback: a dead general-purpose dispatch is attempted once per pass, no identical re-dispatch (End-state 5)', async () => {
  const a = baseArgs({ analyzedAgentType: 'general-purpose' })
  const { out, prompts, logs } = await runScaffold(a, (_, opts) => {
    if (opts.agentType === 'general-purpose') return null   // preferred IS the fallback, and it is dead
    return okResult(a, opts)                                  // executed (undefined agentType) answer normally
  })
  const dispatches = prompts.filter(p => p.opts.label === 'probe:claims-vs-reality')
  assert.equal(dispatches.length, 2, 'exactly one dispatch per pipeline pass (initial + one Layer-4 retry) — no identical re-dispatch')
  assert.ok(dispatches.every(d => d.opts.agentType === 'general-purpose'), 'both dispatches use the (preferred===fallback) type, never a third try')
  assert.ok(!logs.some(l => /analyzed-agent fallback engaged/.test(l)), 'the redundant-dispatch guard skips the fallback log (no identical second dispatch)')
  assert.ok(out.probeResults.some(r => r && r.dropped === true && r.probe === 'claims-vs-reality'), 'the probe still drops — fail-closed')
})

// End-state (spec §4 confirm parity): a blocking analyzed probe whose Explore confirm dies ONCE
// still gets a fallback-dispatched confirm on general-purpose.
test('#727 confirm-site parity: an Explore confirm that dies once recovers on the general-purpose fallback', async () => {
  const a = baseArgs()
  const { prompts, logs } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Confirm' && opts.agentType === 'Explore') throw new Error("agent type 'Explore' not found")
    if (opts.phase === 'Confirm') return { reproduced: true }
    if (opts.label === 'probe:claims-vs-reality') return okResult(a, opts, { status: 'fail', findings: MAJOR })
    return okResult(a, opts)
  })
  const confirmDispatches = prompts.filter(p => p.opts.label === 'adversarial-confirm:claims-vs-reality')
  assert.ok(confirmDispatches.some(d => d.opts.agentType === 'Explore'), 'the confirm first tried the preferred Explore type')
  assert.ok(confirmDispatches.some(d => d.opts.agentType === 'general-purpose'), 'the confirm recovered on the general-purpose fallback')
  assert.ok(logs.some(l => /analyzed-agent fallback engaged/.test(l)), 'the confirm-site fallback logged its diagnostic token')
})

// --- ff-topology prose presence-pair drift guard (spec §4; End-state 10) ------------------------
// Reads the two sibling prose surfaces (the same cross-file idiom as red-team-gate.test.mjs's D7
// guard) and pins BOTH the literal probe name AND its load-bearing clauses. Token presence alone is
// insufficient (the mirrored-clause-presence lesson: 'mandatory' can rot to 'recommended' while a
// token-only guard stays green), so each surface's ff-topology REGION must ALSO carry, mid-sentence
// and case-insensitively, 'mandatory' and '--fast'.
test('ff-topology prose presence pair: SKILL.md + lenses.md both carry the probe name and its mandatory/--fast clauses (End-state 10)', () => {
  const surfaces = {
    'SKILL.md': readFileSync(join(__dirname, '..', 'SKILL.md'), 'utf8'),
    'references/lenses.md': readFileSync(join(__dirname, '..', 'references', 'lenses.md'), 'utf8'),
  }
  // Concatenate a ±320-char window around every 'ff-topology' mention so the clause anchors are
  // scoped to the probe's region — not satisfied by an unrelated 'mandatory' elsewhere in the file.
  const region = (text) => {
    const lower = text.toLowerCase(), out = []
    for (let i = lower.indexOf('ff-topology'); i !== -1; i = lower.indexOf('ff-topology', i + 1)) {
      out.push(text.slice(Math.max(0, i - 320), i + 320))
    }
    return out.join('\n---\n')
  }
  for (const [name, text] of Object.entries(surfaces)) {
    assert.ok(text.includes('ff-topology'), `${name} must name the ff-topology probe`)
    const r = region(text)
    assert.match(r, /mandatory/i, `${name} ff-topology region must state the probe is mandatory (mid-sentence, case-insensitive)`)
    assert.match(r, /--fast/, `${name} ff-topology region must state the probe is --fast-proof`)
  }
})

// --- Task 1.1 (#807): envGap region-scoped presence-pair lock (End state 2) ---------------------
// Both-surfaces rule: the dispatched provisionDirective string and the standing lenses.md provision
// bullet must both carry the load-bearing envGap clauses in the SAME commit. Modeled on the
// ff-topology ±window pattern above — token presence alone rots (the mirrored-clause lesson), so each
// surface's envGap region must ALSO carry its clauses: the directive stamps `envGap: true` and keeps
// the `warn` status; the lenses bullet carries `envGap: true` and, mid-sentence and case-insensitively,
// `never` with `red/fail` (or `Critical/Major`).
test('envGap prose presence pair: provisionDirective + lenses.md both carry envGap:true and their load-bearing clauses (End state 2)', async () => {
  // (a) directive surface — the emitted executed-probe prompt's failure clause (line-scoped: the
  //     scaffold has several envGap mentions, so anchor on the directive's failure sentence).
  const byLabel = await promptsByLabel({ provision: PROVISION })
  const dirLine = byLabel['probe:executable-proof'].split('\n').find(l => /If a provision step FAILS/.test(l))
  assert.ok(dirLine, 'the provisionDirective failure clause must be emitted into the executed probe')
  assert.match(dirLine, /envGap: true/, 'the directive failure clause stamps envGap: true')
  assert.match(dirLine, /warn/, 'the directive failure clause keeps the warn status (extend, not rewrite)')
  // (b) lenses surface — ±320-char window around every envGap mention in lenses.md (the ff-topology idiom).
  const lenses = readFileSync(join(__dirname, '..', 'references', 'lenses.md'), 'utf8')
  const lower = lenses.toLowerCase(), regions = []
  for (let i = lower.indexOf('envgap'); i !== -1; i = lower.indexOf('envgap', i + 1)) {
    regions.push(lenses.slice(Math.max(0, i - 320), i + 320))
  }
  assert.ok(regions.length > 0, 'lenses.md must name the envGap flag')
  const r = regions.join('\n---\n')
  assert.match(r, /envGap: true/, 'lenses envGap region stamps envGap: true')
  assert.match(r, /never/i, 'lenses envGap region states the never-red rule (mid-sentence, case-insensitive)')
  assert.match(r, /red\/fail|Critical\/Major/i, 'lenses envGap region names red/fail (or Critical/Major)')
})

// --- Task 1.1 (#808): CONTRACTS "Gate side" reword standing lock (End state 3) ------------------
// A pass-probe Critical/Major is FILTERED from `blockers`, not "discarded as a non-defect" — it stays
// in allFindings() and downstream diagnostics. Lock the replacement wording (positive) and the retired
// phrase (negative) so the reword cannot silently rot back.
test('CONTRACTS Gate-side bullet: "filtered from blockers" + allFindings(), never "discarded as a non-defect" (End state 3)', () => {
  const start = src.indexOf('CONTRACTS:')
  assert.notEqual(start, -1, 'the CONTRACTS header comment must be present')
  const end = src.indexOf('SAFETY:', start)   // scope to the CONTRACTS block, before the SAFETY block
  assert.notEqual(end, -1, 'the SAFETY block terminating the CONTRACTS region must be present')
  const block = src.slice(start, end)
  assert.match(block, /filtered from `blockers`/, 'the Gate-side bullet names the blockers filter')
  assert.match(block, /allFindings\(\)/, 'the Gate-side bullet notes the finding stays in allFindings()')
  assert.doesNotMatch(block, /discarded as a non-defect/, 'the retired "discarded as a non-defect" wording must not rot back')
})

// --- Task 1.3 (#773): optional model/effort threaded into EVERY agent() dispatch ----------------
// /red-team reads the fail-open agents.redteam block and passes model/effort via args; the scaffold
// spreads modelOpts into every probe (runProbe) AND adversarial-confirm (confirmStage) dispatch, so
// the whole verification run spawns on the configured model. Both branches are asserted on the
// SPAWNED-OPTS SHAPE (the plan's mapped-test requirement): absent args → the opts carry NO
// model/effort key (inherit-session, byte-for-byte); present → every dispatch carries them. A
// blocking Major on claims-vs-reality forces its confirm to fire, so the confirm site's opts is
// captured alongside the probe sites; executable-proof (agentType undefined) covers the executed
// bypass path in dispatchAgent.
const blockingMock = (a) => (_, opts) => {
  if (opts.phase === 'Confirm') return { reproduced: true }
  if (opts.label === 'probe:claims-vs-reality') return okResult(a, opts, { status: 'fail', findings: MAJOR })
  return okResult(a, opts)
}
const dispatchOpts = (prompts) => prompts
  .filter(p => p.opts.phase === 'Probe' || p.opts.phase === 'Confirm')
  .map(p => p.opts)

test('model/effort threading: ABSENT args → every probe AND confirm dispatch carries no model/effort opt (inherit-session, byte-for-byte)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, blockingMock(a))
  const opts = dispatchOpts(prompts)
  assert.ok(opts.some(o => o.phase === 'Confirm'), 'a confirm dispatch fired (harness sanity — the both-sites assertion needs it)')
  assert.ok(opts.some(o => o.agentType === undefined), 'an executed probe dispatched (the agentType-undefined bypass path is exercised)')
  for (const o of opts) {
    // Byte-for-byte: the opts shape is exactly today's — no model/effort key is spread in. A
    // stray `model: undefined` (or any regression that adds the key) fails this exact-key anchor.
    assert.deepEqual(Object.keys(o).sort(), ['agentType', 'label', 'phase', 'schema'],
      `dispatch '${o.label}' opts shape must be byte-for-byte today's (no model/effort keys added)`)
  }
})

test('model/effort threading: PRESENT model+effort → every probe AND confirm dispatch (incl. executed + confirm) carries both (End state 3)', async () => {
  const a = baseArgs({ model: 'sonnet', effort: 'max' })
  const { prompts } = await runScaffold(a, blockingMock(a))
  const opts = dispatchOpts(prompts)
  assert.ok(opts.some(o => o.phase === 'Confirm'), 'a confirm dispatch fired')
  for (const o of opts) {
    assert.equal(o.model, 'sonnet', `dispatch '${o.label}' must carry the configured model`)
    assert.equal(o.effort, 'max', `dispatch '${o.label}' must carry the configured effort`)
  }
  // Nail the two sites the plan calls out by name: an executed probe and an adversarial confirm.
  const exec = opts.find(o => o.label === 'probe:executable-proof')
  assert.ok(exec && exec.agentType === undefined && exec.model === 'sonnet' && exec.effort === 'max',
    'the executed probe (agentType undefined — the dispatchAgent bypass path) still carries model/effort')
  const confirm = opts.find(o => o.label === 'adversarial-confirm:claims-vs-reality')
  assert.ok(confirm && confirm.model === 'sonnet' && confirm.effort === 'max',
    'the adversarial-confirm dispatch carries model/effort')
})

test("model/effort threading: effort 'default' is omitted (inherit), model still threaded (mirrors war-engine spawnOpts)", async () => {
  const a = baseArgs({ model: 'opus', effort: 'default' })
  const { prompts } = await runScaffold(a, blockingMock(a))
  const opts = dispatchOpts(prompts)
  assert.ok(opts.length > 0, 'dispatches were captured')
  for (const o of opts) {
    assert.equal(o.model, 'opus', `dispatch '${o.label}' threads the model`)
    assert.ok(!('effort' in o), `dispatch '${o.label}' omits a 'default' effort (adding the key would break byte-for-byte inherit)`)
  }
})

test('model/effort threading: model-only args (no effort) → only model threaded', async () => {
  const a = baseArgs({ model: 'haiku' })
  const { prompts } = await runScaffold(a, blockingMock(a))
  const opts = dispatchOpts(prompts)
  assert.ok(opts.length > 0, 'dispatches were captured')
  for (const o of opts) {
    assert.equal(o.model, 'haiku', `dispatch '${o.label}' threads the model`)
    assert.ok(!('effort' in o), `dispatch '${o.label}' carries no effort when args omit it`)
  }
})
