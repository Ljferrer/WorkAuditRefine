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
// mutate `repo`. Analysis probes are read-only: they run on the preferred `Explore` agent when the
// harness provides it, falling back to `general-purpose` when it does not (analyzed-agent fallback,
// #727). The fallback widens raw capability (`general-purpose` can write where `Explore` cannot), so
// its confinement rides the scope-lock preamble (prevention) + assert-no-repo-escape.sh (detection,
// ADR 0033) — both already applied to every probe/confirm unconditionally. A fail is downgraded to
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
    // deliverableAbsence (ADR 0032): set true ONLY when the "absent" symbol is a plan DELIVERABLE
    // (mapped by coverage-vs-source to a plan task), not a missing precondition. The gate never
    // counts a deliverableAbsence finding as a blocker (red-team-gate.mjs classify()).
    deliverableAbsence: { type: 'boolean' },
    claim: { type: 'string' }, reality: { type: 'string' }, evidence: { type: 'string' },
    fix: { type: 'string' }, planRef: { type: 'string' } } } } } }

const CONFIRM = { type: 'object', required: ['reproduced'], properties: {
  reproduced: { type: 'boolean' }, note: { type: 'string' } } }

// Confirm-stage identifier surfaced as an executable token so tests and tooling can anchor to it.
const ADVERSARIAL_CONFIRM = 'adversarial-confirm'

let A
try {
  const parsed = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
  // Non-null-object guard: a valid scalar ('null'/'true'/'5') or array parses without throwing but
  // is not a usable args object — normalize it to {}, the same posture as the catch, so the
  // titleLine refusal below fires cleanly and uniformly instead of a raw destructure TypeError
  // (only 'null' actually crashed pre-guard; 'true'/'5' destructured to all-undefined). Mirrored by
  // the workflow-template.js throw-side guard, pinned by a both-sites drift test (ADR 0034).
  A = (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {}
}
catch { A = {} }
const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint, provision = [], artifactKind = 'impl-plan', analyzedAgentType, model, effort } = A

// Analyzed-agent dispatch types (#727). Analyzed probes/confirms need a read-only agent; the
// preferred one is `Explore` (overridable via args.analyzedAgentType — the issue's configurability
// ask), and this constant is the ONLY place the bare Explore string literal survives. The fallback is
// 'general-purpose' — present in every observed harness and verified recovering a full analyzed
// workload in the 2026-07-10 missing-Explore incident. These sit AFTER the args destructure on
// purpose: ANALYZED_AGENT reads the destructured `analyzedAgentType`, so declaring them beside
// ADVERSARIAL_CONFIRM (which precedes `A`'s initialization) would be a reference-before-init crash.
const ANALYZED_AGENT = analyzedAgentType ?? 'Explore'
const ANALYZED_AGENT_FALLBACK = 'general-purpose'

// Optional model/effort threading (Task 1.3, #773). /red-team reads the fail-open agents.redteam
// block and passes model/effort here via args; the scaffold spreads modelOpts into EVERY agent()
// dispatch — both the probe (runProbe) and the adversarial-confirm (confirmStage) sites below — so
// the whole verification run spawns on the configured model. Absent model AND (non-default) effort
// → {} → the agent() calls carry NO model/effort opts, today's inherit-session behavior byte-for-
// byte (exactly the provision:[] back-compat posture). effort is omitted when 'default' — mirrors
// war-config.mjs / workflow-template.js spawnOpts, where effort rides only when non-default (a
// 'default' effort means inherit the session, so adding the key would break byte-for-byte parity).
const modelOpts = {
  ...(model ? { model } : {}),
  ...(effort && effort !== 'default' ? { effort } : {}),
}

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
    ? `To inspect or run anything, first copy the repo into a throwaway sandbox (e.g. \`cp -R ${repo} <tmp>\` or \`git -C ${repo} worktree add <tmp>\`). The Bash tool RESETS cwd between calls, so NEVER rely on a prior \`cd\` into that copy: use \`git -C <abs-sandbox>\` for every git call and absolute paths throughout, run there only, never from the session cwd, and NEVER mutate ${repo}. NEVER run a bare \`git push\` — a cwd reset can land it against the REAL remote (the recorded cwd-reset escape).${provisionDirective(technique)}`
    : `Restrict every Read / Grep / Glob to paths under ${repo} (plus the plan/spec named above); open nothing else on the machine.`,
  `If the plan you open is NOT titled "${fingerprint.titleLine}", or you find yourself reading another project's files, STOP — you are on the WRONG plan. Re-open ${planFile} and confine yourself to ${repo}.`,
  `In your FINDINGS result you MUST set read_anchor.resolved_path to the ABSOLUTE path of the plan file you actually read and read_anchor.plan_title to its first "# " heading line. This is checked against the expected plan; a mismatch discards your findings.`,
].join('\n')

// FUTURE-WORK RULE (#311, generalized by ADR 0032). A plan PROPOSES changes; it hasn't run. Probes
// were filing the plan's own proposed output (new code/tests/comment edits/version bumps) as "missing"
// defects — backwards from the skill's purpose (verify the plan CAN be applied, not that it already
// was). This artifact-kind-aware rule is prepended alongside scopeLock to EVERY probe (analyzed AND
// executed) at the runProbe composition site. Two wording variants:
//   • analyzed — the #311 PRECONDITION-vs-DELIVERABLE presence-check framing (an analyzed probe
//     inspects, it does not run);
//   • executed — a FUTURE-WORK-vs-DEFECT framing (an executed probe RUNS artifacts in a sandbox
//     rather than presence-checking; a claimed-but-unbuilt symbol/test/file is the expected baseline).
// For a `tdd-plan`, a shipped test that runs RED before its implementation lands is status:"pass",
// never a defect. Both variants PRESERVE the retained-findings carve-out (missing anchor, false claim
// about EXISTING code, wrong signature, drifted line, contradiction still block) — the non-blunting
// guard asserted verbatim by workflow-scaffold.test.mjs (#311 1b + ADR 0032). The artifactKind value
// is interpolated so it appears in every emitted probe prompt (spec criterion 1). absent kind ⇒
// 'impl-plan' (the suppression-safe default).
const futureWorkRule = (technique, artifactKind) => {
  const tdd = artifactKind === 'tdd-plan'
  const carveOut =
    'A false claim about EXISTING code, a wrong signature, a drifted line number, or an internal contradiction remains a real finding.'
  // deliverableAbsence self-tag: the gate honors this flag to demote an expected-absence finding.
  const absenceFlag =
    'If you nonetheless surface an expected-absence finding (the "absent" symbol is a plan DELIVERABLE mapped by the coverage-vs-source lens to a plan task), set that finding\'s deliverableAbsence:true so the gate scores it as expected work, never a blocker.'
  if (technique === 'analyzed') {
    return [
      `PRECONDITION vs DELIVERABLE (artifact kind: ${artifactKind}) — a plan PROPOSES changes; it has not run.`,
      'Verify only that its PRECONDITIONS hold against the live repo:',
      '  • the anchor / insertion-point text each edit attaches to EXISTS (verbatim);',
      '  • assumed-existing files, symbols, and signatures are present;',
      '  • the described edits would apply and compose.',
      "The plan's PROPOSED new code, new tests, comment edits, and version bumps are its",
      'DELIVERABLE — they are EXPECTED to be absent from the current repo. NEVER report',
      'their absence as a finding. Only a missing or changed ANCHOR / PRECONDITION —',
      'something an edit needs in order to land — is a defect.',
      tdd
        ? 'For a tdd-plan, a shipped test that is RED before its implementation lands is the EXPECTED baseline (status:"pass"), never a defect.'
        : '',
      carveOut,
      absenceFlag,
    ].filter(Boolean).join('\n')
  }
  // executed variant — the probe RUNS artifacts in a throwaway sandbox.
  return [
    `FUTURE WORK vs DEFECT (artifact kind: ${artifactKind}) — a plan PROPOSES changes; it has not run.`,
    'For an impl-plan or tdd-plan, a claimed-but-unbuilt symbol, test, or file is the EXPECTED',
    'deliverable baseline — never a finding merely because it is not yet present in the sandbox.',
    tdd
      ? 'For a tdd-plan, a shipped test that runs RED before its implementation lands is status:"pass", not a defect.'
      : '',
    carveOut,
    absenceFlag,
  ].filter(Boolean).join('\n')
}

const SPINE = [
  { name: 'claims-vs-reality', kind: 'spine', technique: 'analyzed',
    prompt: `Read the plan ${planFile}. For every CONCRETE claim it makes about ${repo} (a file/symbol exists, a function signature, a cited line number, a "before" snippet), check it against the LIVE repo. Report each false claim with the plan's version vs the file's actual content. Read-only.` },
  { name: 'executable-proof', kind: 'spine', technique: 'executed',
    prompt: `Read the plan ${planFile}. Extract every runnable artifact it ships (code blocks, test blocks, shell commands with a stated "Expected") into a THROWAWAY temp dir and RUN them. Assert each behaves as the plan claims. This EXPLICITLY includes plan-authored requiresTest:false verification commands — the self-authored grep guards a task ships in lieu of a test: extract each and RUN it against the plan's own stated landing site, then re-run it against a re-cased and re-positioned copy of that site (move the target token to a different line, flip its casing mid-sentence). A guard that passes on the verbatim site but false-negates on the re-cased/re-positioned copy is the recorded sentence-case false-negative class — flag it. The compliant default such a guard must meet: a prose-clause grep guard is case-insensitive (grep -rin, not grep -r) and anchored on a stable mid-sentence token, so casing and line-position drift can't slip a regression past it. NEVER touch ${repo}. Report any mismatch with the real command output as evidence.` },
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

// Shared analyzed-agent dispatch with a reactive fallback (#727 — the missing-`Explore` incident).
// The Workflow sandbox cannot introspect the harness, so a dropped agent type is observable ONLY as
// a dead dispatch — a throw OR a nullish result (the shape is harness-version-dependent; treated
// uniformly). Executed probes (agentType undefined) BYPASS the wrapper entirely — plain agent(),
// never re-dispatched. For an analyzed probe/confirm: try the preferred type; on a first death log
// the stable 'analyzed-agent fallback engaged:' token (greppably distinct from Layer 4's 'retrying
// once') and re-dispatch once with ANALYZED_AGENT_FALLBACK. Redundant-dispatch guard: when the
// preferred type ALREADY is the fallback (operator override to general-purpose), a first death skips
// the identical re-dispatch. Exhausted path — RETHROW, never return null: a second death (or the
// redundant-guard death) throws a descriptive Error, so the Workflow pipeline() nulls the whole item
// and BOTH sites (probe AND confirm) converge on the existing Layer-4 retry → { probe, dropped:true }
// marker → gate INCOMPLETE path. Returning null here would let a null confirm fall through
// `if (c && c.reproduced === false)` below and silently stand an unconfirmed fail as a blocker (see
// the plan's Notes / conscious deviations). Bound: worst case per analyzed probe is 2 dispatches ×
// (initial + one Layer-4 retry) = 4, plus the same on a confirm — bounded, composes with Layer 4,
// never multiplies it.
const dispatchAgent = async (prompt, opts = {}) => {
  if (opts.agentType === undefined) return agent(prompt, opts)   // executed probes — never wrapped
  const label = opts.label || 'analyzed probe'
  try {
    const r = await agent(prompt, opts)
    if (r != null) return r                                       // preferred type answered
  } catch { /* dead dispatch — fall through to the fallback */ }
  if (opts.agentType === ANALYZED_AGENT_FALLBACK) {               // redundant-dispatch guard
    throw new Error(`red-team: analyzed dispatch for ${label} died on ${opts.agentType} (already the ${ANALYZED_AGENT_FALLBACK} fallback) — dropping the probe (gate → INCOMPLETE).`)
  }
  log(`analyzed-agent fallback engaged: ${label} — ${opts.agentType} dispatch died; re-dispatching with ${ANALYZED_AGENT_FALLBACK}.`)
  try {
    const r2 = await agent(prompt, { ...opts, agentType: ANALYZED_AGENT_FALLBACK })
    if (r2 != null) return r2                                     // fallback recovered the probe
  } catch { /* both types dead — fall through to the loud rethrow */ }
  throw new Error(`red-team: analyzed dispatch for ${label} died on both ${opts.agentType} and ${ANALYZED_AGENT_FALLBACK} — dropping the probe (gate → INCOMPLETE).`)
}

// Probe (stage 1) + adversarial-confirm (stage 2) as named stages so a dropped probe can be retried.
// futureWorkRule rides alongside scopeLock on EVERY probe (analyzed AND executed) — the technique
// argument selects the presence-check (analyzed) vs future-work-vs-defect (executed) wording variant.
const runProbe = (p) => dispatchAgent(
  `${scopeLock(p.technique)}\n\n${futureWorkRule(p.technique, artifactKind)}\n\n${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle. Only record a finding for an actual problem — a false claim, a gap, or an ambiguity (needsDecision). If a claim checks out, do NOT record it. A fully-clean probe returns status:"pass" with findings:[].`,
  { ...modelOpts, label: `probe:${p.name}`, phase: 'Probe',
    agentType: p.technique === 'analyzed' ? ANALYZED_AGENT : undefined, schema: FINDINGS })

const confirmStage = async (res, p) => {               // adversarial-confirm: refute any reproducible blocker
  const blocking = res && (res.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major')
  if (!res || (res.status !== 'fail' && !blocking)) return res
  const c = await dispatchAgent(
    `${scopeLock(p.technique)}\n\n`
    + `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
    + `Apply the self-confound gate to the probe itself: rule out the probe's own provision commands, sandbox reuse, or an earlier probe's mutation as the cause before the fail stands. `
    + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
    + `Findings: ${JSON.stringify(res.findings)}`,
    { ...modelOpts, label: `${ADVERSARIAL_CONFIRM}:${p.name}`, phase: 'Confirm',
      agentType: p.technique === 'analyzed' ? ANALYZED_AGENT : undefined, schema: CONFIRM })
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
