export const meta = {
  name: 'red-team-verify',
  description: 'Adversarially verify a plan: run spine lenses + bespoke probes (proving claims in throwaway sandboxes), then adversarially confirm each fail before it counts.',
  phases: [{ title: 'Probe' }, { title: 'Confirm' }],
}

// ---------------------------------------------------------------------------
// COPY this file to a scratch path, add the BESPOKE PROBES for the plan under test
// (edit the array below, or pass them via args.probes), then run with
//   Workflow({ scriptPath: <copy>, args })
// args (the Red Team Lead passes):
//   { planFile, repo, sourceSpec,
//     probes: [ { name, kind:"bespoke", technique:"executed"|"analyzed", prompt } ] }
// SAFETY: execution probes work ONLY in throwaway temp dirs / git worktrees and NEVER
// mutate `repo`. Analysis probes are read-only (Explore agent). A fail is downgraded to
// warn unless an independent confirm agent reproduces it. Prove, don't assert.
// ---------------------------------------------------------------------------

const FINDINGS = { type: 'object', required: ['probe', 'kind', 'technique', 'status', 'findings'], properties: {
  probe: { type: 'string' }, kind: { enum: ['spine', 'bespoke'] }, technique: { enum: ['executed', 'analyzed'] },
  sandbox: { type: 'string' }, status: { enum: ['pass', 'fail', 'warn'] },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { enum: ['Critical', 'Major', 'Minor'] }, needsDecision: { type: 'boolean' },
    claim: { type: 'string' }, reality: { type: 'string' }, evidence: { type: 'string' },
    fix: { type: 'string' }, planRef: { type: 'string' } } } } } }

const CONFIRM = { type: 'object', required: ['reproduced'], properties: {
  reproduced: { type: 'boolean' }, note: { type: 'string' } } }

// Confirm-stage identifier surfaced as an executable token so tests and tooling can anchor to it.
const ADVERSARIAL_CONFIRM = 'adversarial-confirm'

const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint } = args

// Layer 1 — the fingerprint is the deterministic ground truth the gate validates every probe
// against. The Workflow sandbox has NO filesystem access, so the Lead computes it (Bash) from the
// absolute planFile and passes it in. Fail loud if it is missing — an unanchored run cannot detect
// wrong-target drift (see SKILL.md "Pre-flight").
if (!fingerprint || !fingerprint.titleLine) {
  throw new Error('red-team scaffold: args.fingerprint { absPath, titleLine, tokens } is required (Lead pre-flight) — refusing to run unanchored.')
}

const SPINE = [
  { name: 'claims-vs-reality', kind: 'spine', technique: 'analyzed',
    prompt: `Read the plan ${planFile}. For every CONCRETE claim it makes about ${repo} (a file/symbol exists, a function signature, a cited line number, a "before" snippet), check it against the LIVE repo. Report each false claim with the plan's version vs the file's actual content. Read-only.` },
  { name: 'executable-proof', kind: 'spine', technique: 'executed',
    prompt: `Read the plan ${planFile}. Extract every runnable artifact it ships (code blocks, test blocks, shell commands with a stated "Expected") into a THROWAWAY temp dir and RUN them. Assert each behaves as the plan claims. NEVER touch ${repo}. Report any mismatch with the real command output as evidence.` },
  { name: 'coverage-vs-source', kind: 'spine', technique: 'analyzed',
    prompt: `Read the source of truth (${sourceSpec}) and the plan ${planFile}. Confirm every requirement/section in the source maps to a plan task or step. Report unmapped requirements as Major gaps. Read-only.` },
  { name: 'consistency-placeholders', kind: 'spine', technique: 'analyzed',
    prompt: `Read the plan ${planFile}. Flag TBD/TODO/vague steps, name/signature drift between steps (a symbol called one thing in Task N and another in Task M), and any step that contradicts another. Read-only.` },
  { name: 'dependency-feasibility', kind: 'spine', technique: 'analyzed',
    prompt: `Read the plan ${planFile}. Check that assumed interfaces/deps/tools exist and are usable, and that step ordering is sound (no step consumes a later step's output). Flag infeasible or out-of-order steps. Read-only.` },
]

// Drop spine lenses that don't apply: no source spec → skip coverage-vs-source; for a
// plan with NO runnable artifacts the Lead also removes 'executable-proof' here.
const spine = SPINE.filter(l => !(l.name === 'coverage-vs-source' && sourceSpec === 'none'))
// ---- BESPOKE PROBES: edit here (or pass via args.probes) for the plan under test ----
const allProbes = [...spine, ...probes]

log(`Red-teaming ${planFile}: ${allProbes.length} probe(s)`)

const results = await pipeline(
  allProbes,
  p => agent(
    `${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle.`,
    { label: `probe:${p.name}`, phase: 'Probe',
      agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: FINDINGS }),
  async (res, p) => {                                   // adversarial-confirm: refute any reproducible blocker
    const blocking = res && (res.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major')
    if (!res || (res.status !== 'fail' && !blocking)) return res
    const c = await agent(
      `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
      + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
      + `Findings: ${JSON.stringify(res.findings)}`,
      { label: `${ADVERSARIAL_CONFIRM}:${p.name}`, phase: 'Confirm',
        agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: CONFIRM })
    if (c && c.reproduced === false) {
      return { ...res, status: 'warn',
        findings: (res.findings || []).map(f => ({ ...f, severity: 'Minor',
          reality: `${f.reality || ''} [unreproduced — downgraded by ${ADVERSARIAL_CONFIRM}: ${c.note || ''}]` })) }
    }
    return res
  })

return { plan: planFile, repo, fingerprint, expected: allProbes.length, probeResults: results.filter(Boolean) }
