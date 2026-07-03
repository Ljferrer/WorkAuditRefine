export const meta = {
  name: 'red-team-verify',
  description: 'Adversarially verify a plan: run spine lenses + bespoke probes (proving claims in throwaway sandboxes), then adversarially confirm each fail before it counts.',
  phases: [{ title: 'Probe' }, { title: 'Confirm' }],
}

// ---------------------------------------------------------------------------
// COPY this file to a scratch path, add the BESPOKE PROBES for the plan under test
// (edit the array below, or pass them via args.probes), then run with
//   Workflow({ scriptPath: <copy>, args })
// args (the Red Team Lead passes) — may be a plain object OR a JSON string (the
// scaffold normalizes both via parse-if-string so either form works):
//   { planFile, repo, sourceSpec,
//     probes: [ { name, kind:"bespoke", technique:"executed"|"analyzed", prompt } ] }
// CONTRACTS:
//   Probe side — a FINDINGS finding is a DEFECT (false claim, gap, or needsDecision
//   ambiguity), NOT a confirmation. A claim that checks out is NOT recorded. A
//   fully-clean probe returns status:"pass" with findings:[].
//   Gate side — a Critical/Major finding is a blocker only when its parent probe's
//   status is NOT "pass" (probeStatus !== "pass"). A pass probe's Critical/Major is
//   discarded as a non-defect. needsDecision:true always blocks regardless of probe
//   status. warn/fail/absent probe status still blocks (only literal "pass" demotes).
// SAFETY: execution probes work ONLY in throwaway temp dirs / git worktrees and NEVER
// mutate `repo`. Analysis probes are read-only (Explore agent). A fail is downgraded to
// warn unless an independent confirm agent reproduces it. Prove, don't assert.
// ---------------------------------------------------------------------------

const FINDINGS = { type: 'object', required: ['probe', 'kind', 'technique', 'status', 'findings', 'read_anchor'], properties: {
  probe: { type: 'string' }, kind: { enum: ['spine', 'bespoke'] }, technique: { enum: ['executed', 'analyzed'] },
  sandbox: { type: 'string' }, status: { enum: ['pass', 'fail', 'warn'] },
  // Layer 3 attestation: what the probe ACTUALLY read. The gate validates it against the fingerprint.
  read_anchor: { type: 'object', required: ['resolved_path', 'plan_title'], properties: {
    resolved_path: { type: 'string' }, plan_title: { type: 'string' } } },
  findings: { type: 'array',
    description: 'A DEFECT (false claim, gap, or needsDecision ambiguity) — NOT a confirmation. Omit claims that check out; a clean probe returns findings:[] with status:"pass".',
    items: { type: 'object', properties: {
    severity: { enum: ['Critical', 'Major', 'Minor'] }, needsDecision: { type: 'boolean' },
    claim: { type: 'string' }, reality: { type: 'string' }, evidence: { type: 'string' },
    fix: { type: 'string' }, planRef: { type: 'string' } } } } } }

const CONFIRM = { type: 'object', required: ['reproduced'], properties: {
  reproduced: { type: 'boolean' }, note: { type: 'string' } } }

// Confirm-stage identifier surfaced as an executable token so tests and tooling can anchor to it.
const ADVERSARIAL_CONFIRM = 'adversarial-confirm'

let A
try { A = typeof args === 'string' ? JSON.parse(args) : (args ?? {}) }
catch { A = {} }
const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint, provision = [] } = A

// Layer 1 — the fingerprint is the deterministic ground truth the gate validates every probe
// against. The Workflow sandbox has NO filesystem access, so the Lead computes it (Bash) from the
// absolute planFile and passes it in. Fail loud if it is missing — an unanchored run cannot detect
// wrong-target drift (see SKILL.md "Pre-flight").
if (!fingerprint || !fingerprint.titleLine) {
  throw new Error('red-team scaffold: args.fingerprint.titleLine is required (Lead pre-flight) — absPath and tokens are recommended but titleLine is strictly required — refusing to run unanchored.')
}

// Provisioning directive (Task #76). The Lead may pass a pinned `provision` command list (derived
// from the target repo's own declared setup — see provision.mjs / the setup-scout). An EXECUTED
// probe must run those commands in its throwaway sandbox BEFORE the baseline, so the gate-relevant
// work runs against a provisioned tree. Provisioning is environment setup, not the artifact under
// test: a FAILING provision step is an env-gap → status:"warn" + a note, and must NEVER become a
// red/fail verdict (that would mis-score a broken environment as a broken plan). Empty list ⇒ no
// directive at all (byte-for-byte back-compat). Analyzed/read-only probes never provision.
//
// PROVENANCE of args.provision — three valid sources (in descending authority):
//   1. Operator pin: the user passes an explicit list when invoking /red-team.
//   2. Committed manifest: the red-team Lead reads `<repo>/.war-provision.json` via the shared
//      readManifest() (skills/_shared/provision.mjs) and threads `result.provision` here — mirrors
//      exactly how /war pins run.provision upstream of the Workflow. A manifest-only repo therefore
//      provisions identically in both skills. (Task #51 / T3.1)
//   3. Structural fallback / setup-scout derivation (see structuralFallback in provision.mjs).
// The scaffold itself is UNCHANGED — it runs whatever list it is given; provision:[] is byte-for-
// byte back-compat. Only the Lead's pre-flight assembly step is different per source.
const provisionDirective = (technique) =>
  technique === 'executed' && provision.length
    ? '\n' + [
        'PROVISION FIRST — before the baseline. Inside that sandbox copy, and BEFORE you run any of the plan’s artifacts (the baseline), run these provisioning commands IN ORDER:',
        ...provision.map(c => `  - ${c}`),
        'These bring the sandbox to a gate-ready state (submodules, dependency install, etc.); they are environment setup, NOT the subject under test.',
        'If a provision step FAILS, set status to "warn", add a finding noting the env-gap (the failed command + its output), and do NOT run the baseline. A provision failure is an environment gap — it is NEVER a red/fail verdict and must not be reported as a Critical/Major plan defect.',
      ].join('\n')
    : ''
// Layer 2 — SCOPE-LOCK preamble. /red-team is routinely launched from project X's session to
// verify project Y's plan; a probe agent's ambient cwd + CLAUDE.md + memory otherwise OVERPOWER
// the explicit args and it red-teams the WRONG artifact. Prepended to EVERY probe (spine AND
// bespoke) and EVERY confirm. It also asks the agent to attest, in read_anchor, the plan it
// actually read — the gate validates that against the fingerprint (Layer 3). Prevention here;
// detection in the gate.
const scopeLock = (technique) => [
  'SCOPE-LOCK — READ THIS FIRST. IT OVERRIDES ANY AMBIENT PROJECT CONTEXT.',
  `You may be running inside an UNRELATED project's working directory. IGNORE the session cwd, its CLAUDE.md, and its memory.`,
  `The ONLY subject of this red-team is the plan file at ${planFile} (titled "${fingerprint.titleLine}")${sourceSpec !== 'none' ? `, its source spec ${sourceSpec},` : ','} and the repository rooted at ${repo}.`,
  `Do not read, reference, or reason about any file outside ${repo} (other than the plan/spec named above).`,
  technique === 'executed'
    ? `To inspect or run anything, first copy the repo into a throwaway sandbox (e.g. \`cp -R ${repo} <tmp>\` or \`git -C ${repo} worktree add <tmp>\`) and \`cd\` into that copy — run there only, never from the session cwd, and NEVER mutate ${repo}.${provisionDirective(technique)}`
    : `Restrict every Read / Grep / Glob to paths under ${repo} (plus the plan/spec named above); open nothing else on the machine.`,
  `If the plan you open is NOT titled "${fingerprint.titleLine}", or you find yourself reading another project's files, STOP — you are on the WRONG plan. Re-open ${planFile} and confine yourself to ${repo}.`,
  `In your FINDINGS result you MUST set read_anchor.resolved_path to the ABSOLUTE path of the plan file you actually read and read_anchor.plan_title to its first "# " heading line. This is checked against the expected plan; a mismatch discards your findings.`,
].join('\n')

// PRECONDITION-vs-DELIVERABLE preamble (#311). A plan PROPOSES changes; it hasn't run. Analyzed
// probes were filing the plan's own proposed output (new code/tests/comment edits/version bumps) as
// "missing" defects — backwards from the skill's purpose (verify the plan CAN be applied, not that it
// already was). This NARROW rule scopes analyzed probes to PRECONDITIONS while explicitly PRESERVING
// real findings (missing anchor, false claim about existing code, wrong signature, drifted line,
// contradiction) — the retained-findings clause is the non-blunting guard (asserted in the test). It
// is prepended alongside scopeLock to ANALYZED probes only (guarded at the composition site);
// `executed` probes run artifacts in a sandbox rather than presence-checking, so they never see it.
const preconditionRule = [
  'PRECONDITION vs DELIVERABLE — a plan PROPOSES changes; it has not run.',
  'Verify only that its PRECONDITIONS hold against the live repo:',
  '  • the anchor / insertion-point text each edit attaches to EXISTS (verbatim);',
  '  • assumed-existing files, symbols, and signatures are present;',
  '  • the described edits would apply and compose.',
  "The plan's PROPOSED new code, new tests, comment edits, and version bumps are its",
  'DELIVERABLE — they are EXPECTED to be absent from the current repo. NEVER report',
  'their absence as a finding. Only a missing or changed ANCHOR / PRECONDITION —',
  'something an edit needs in order to land — is a defect.',
  // Retained-findings carve-out — the non-blunting guard. The phrase 'false claim about EXISTING
  // code' is asserted verbatim (single line) by workflow-scaffold.test.mjs (#311 1b): blunting this
  // rule to a bare "ignore proposed changes" would strip it and turn the RED/GREEN test RED again.
  'A false claim about EXISTING code, a wrong signature, a drifted line number, or an internal contradiction remains a real finding.',
].join('\n')

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
  { name: 'intent-vs-plan', kind: 'spine', technique: 'analyzed',
    prompt: `Read the plan ${planFile}. If it has either a "## Commander's Intent" or an "## AI-Commander's Intent" section (Purpose / Method / End state), check: (1) each End-state condition is individually checkable — a concrete predicate you could verify true/false against ${repo} (a vague/unverifiable condition is a Major); (2) each End-state condition maps to at least one phase/task that claims to deliver it (an unclaimed condition is a Major); (3) the End-state conditions are collectively sufficient for the stated Purpose (a sufficiency gap is a Major with needsDecision:true — only the user can settle what the Purpose really requires). An "## AI-Commander's Intent" block IS intent-present and is judged identically to operator intent; additionally return one Minor note recommending the human upgrade path (run /war-strategy ${planFile}). If the plan has NEITHER a "## Commander's Intent" nor an "## AI-Commander's Intent" section, that is a Minor, never a Major: return status:"pass" with a single Minor note recommending the intent interview. Read-only.` },
]

// Drop spine lenses that don't apply: no source spec → skip coverage-vs-source; for a
// plan with NO runnable artifacts the Lead also removes 'executable-proof' here.
const spine = SPINE.filter(l => !(l.name === 'coverage-vs-source' && sourceSpec === 'none'))
// ---- BESPOKE PROBES: edit here (or pass via args.probes) for the plan under test ----
const allProbes = [...spine, ...probes]

log(`Red-teaming ${planFile}: ${allProbes.length} probe(s)`)

// Probe (stage 1) + adversarial-confirm (stage 2) as named stages so a dropped probe can be retried.
// preconditionRule rides alongside scopeLock but ONLY for analyzed probes (#311) — executed probes
// run the plan's artifacts in a sandbox, so a presence-check carve-out is inert/misleading for them.
const runProbe = (p) => agent(
  `${scopeLock(p.technique)}${p.technique === 'analyzed' ? `\n\n${preconditionRule}` : ''}\n\n${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle. Only record a finding for an actual problem — a false claim, a gap, or an ambiguity (needsDecision). If a claim checks out, do NOT record it. A fully-clean probe returns status:"pass" with findings:[].`,
  { label: `probe:${p.name}`, phase: 'Probe',
    agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: FINDINGS })

const confirmStage = async (res, p) => {               // adversarial-confirm: refute any reproducible blocker
  const blocking = res && (res.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major')
  if (!res || (res.status !== 'fail' && !blocking)) return res
  const c = await agent(
    `${scopeLock(p.technique)}\n\n`
    + `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
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
}

const results = await pipeline(allProbes, runProbe, confirmStage)

// Layer 4 — never silently drop a dead probe. A null = the agent died after the harness's own
// retries (or was skipped). Retry it ONCE; if it still dies, emit a { probe, dropped:true } marker
// so the gate counts the coverage gap and refuses to return CLEARED on a thinner run.
const probeResults = []
for (let i = 0; i < allProbes.length; i++) {
  let r = results[i]
  if (!r) {
    log(`Probe ${allProbes[i].name} returned no result — retrying once.`)
    const retried = await pipeline([allProbes[i]], runProbe, confirmStage)
    r = retried[0]
  }
  probeResults.push(r || { probe: allProbes[i].name, dropped: true })
}
const dropped = probeResults.filter(r => r && r.dropped).map(r => r.probe)
if (dropped.length) log(`⚠ coverage gap: ${dropped.length}/${allProbes.length} probe(s) dropped after retry — ${dropped.join(', ')}. The gate will return INCOMPLETE.`)

return { plan: planFile, repo, fingerprint, provision, expected: allProbes.length, probeResults }
