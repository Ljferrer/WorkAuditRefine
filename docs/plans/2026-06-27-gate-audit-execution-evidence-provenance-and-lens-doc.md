# Gate-audit Execution-Evidence: sha Provenance + Worktree-Pin + Lens Doc Implementation Plan (#193 · #117)

**Goal:** close the recurring stale-tip gate-audit false-negative (`audit-worktree-pre-impl-tip-stale-verdict`,
#193's exact fingerprint) at the source. Two coupled mechanisms: (1) **thread the gate-HEAD sha** (`MERGE_RESULT.integration_sha`)
through the post-merge gate-audit capture into both the dispatched prompt **and** the `auditLog` so the seat/Lead can
SEE whether the executed `gate_output` ran at the integration tip; (2) **pin the gate-audit seat's worktree to the
integration tip** — point it at the existing `_refinery` worktree (already checked out on `ph.integrationBranch` after
the serial merge queue), have it confirm `git rev-parse HEAD == gateHeadSha`, and only then read the mapped test
**present at that tip** — recording a HARD finding ONLY when the test is genuinely absent at the confirmed tip, a SOFT
note when it cannot confirm the pin. Plus document the `execution-evidence` lens (severity-keyed hard/soft coupling +
the worktree-pin + the stale-tip SOFT-downgrade) in the auditor's standing instruction file (#117). Three sequential
tasks: Task 1 = sha provenance (prompt + auditLog + schemas.md + refiner populates the field); Task 2 = the gate-audit
worktree-pin; Task 3 = the lens doc (depends on 1–2 so the prose reflects the FINAL mechanism). All on ONE surface (the
post-merge gate-audit path in `skills/war/assets/workflow-template.js`) plus `war-auditor.md`, each TDD-paired.

**Closes:**
- **#193** (Major, behavioral) — the post-merge gate-audit pass records `{ taskId, gateOutput, acceptanceCriteria }`
  with **no sha** and reviews `mr.gate_output` as a **text string** with no worktree, so a `gate_output` captured at a
  stale / pre-rebase tip (a mapped runner added by the task commit reported as *unrun* because the evidence predates
  that commit) becomes a **false land-halt** through the live `isHardGateEvidence` severity-keying. `MergeResult.integration_sha`
  (the post-rebase tip the gate ran at) is dropped at the capture and never shown to the seat. **Fully closed** here —
  sha provenance into prompt+auditLog AND a worktree-pin (point the seat at `_refinery`, confirm `HEAD == gateHeadSha`,
  read the mapped test at the confirmed tip) AND the stale-tip SOFT-downgrade rule. **No deferral.**
- **#117** (Nit, doc-only) — `agents/war-auditor.md` `## Review through your lens` enumerates only
  `correctness` / `cascading-impact` / `plan-faithfulness` / `domain` — **no execution-evidence entry**, and no
  mention that gate-evidence escalation keys on finding **severity** not the seat verdict, nor that the seat is pinned
  to the integration tip.

**Scope (v0.7.1 — gate-audit sha provenance + worktree-pin + lens doc):** Task 1 is three additive JS edits +
one `schemas.md` doc line + new tests (read an already-computed optional field, thread it into the prompt **and** the
`auditLog.push`, extend the merge-task dispatch clause). Task 2 reconstructs the integration-tip worktree path at the
gate-audit pass (the loop-scoped `refineryPath` is out of scope there) and rewrites the gate-audit prompt from
"you cannot run commands" into a **pinned read-only auditor** (confirm `git -C ${refineryPath} rev-parse HEAD ==
gateHeadSha`, then read the mapped test at that tip). Task 3 is one markdown bullet in `war-auditor.md`. **No** change
to `isHardGateEvidence`, `HARD_ESCALATION_REASONS`, `land-decision.mjs`, the land-decision membership assertions, or
any schema field — `integration_sha` and `audit_sha` already exist; the `_refinery` worktree already exists (D1/D5).
The happy-path land flow is unchanged; the only behavior change is what the gate-audit seat SEES and reads, and a
strictly-scoped SOFT-downgrade when it **cannot confirm** its worktree HEAD == gate-HEAD sha.

> **Baseline-drift note (2026-06-27):** every cited line was **re-anchored by NAMED CONSTRUCT confirmed at HEAD**, not
> by literal line number — lines will shift as G1 lands. Confirmed live: `MERGE_RESULT` with `integration_sha?` /
> `working_sha?` optional (`workflow-template.js:44-48`); `AUDIT_VERDICT` with `audit_sha?` (`:36-42`); the loop-scoped
> `refineryPath` declared inside `for (const r of results.filter(Boolean))` (`:308`), with the post-loop
> `refineryLandPath = \`${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery\`` reconstruction as
> precedent (`:392`); the `mergedTasksForGateAudit.push({ taskId: r.task.id, gateOutput: mr.gate_output,
> acceptanceCriteria: r.task.planSlice })` capture (`:321`); the header comment listing
> `{taskId, gateOutput, acceptanceCriteria}` (`:108`); the `parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput,
> acceptanceCriteria }) => …))` destructure (`:342`); the `POST-MERGE GATE-AUDIT … lens: execution-evidence` prompt
> template with its literal **"you cannot run commands"** clause (`:343-351`); the merge-task `agent()` dispatch's
> `merge:${r.task.id}` call and its **"populate gate_output"** sentence (`:316-317`); `isHardGateEvidence = findings.some(f
> => f.severity === 'Critical' || f.severity === 'Major')` (`:360`); the `auditLog.push({ task: taskId, verdict:
> \`gate-audit:…\`, findings, gateEvidence: true, hard: isHardGateEvidence })` (`:362`); the `escalated.push({ task:
> taskId, reason: 'gate-evidence', detail: gateAuditVerdict })` (`:365`); `HARD_ESCALATION_REASONS` 7-member array literal
> (`:387`); `schemas.md` MergeResult jsonc `{ … integration_sha?, working_sha? … }` (`:49`) + AuditVerdict `audit_sha`
> (`:36`); `war-auditor.md` `## Review through your lens` (`:18`), the lens enum (`:12`), `tools: Read, Grep, Glob, Bash`
> (`:5`) + "you may run **only** read-only git" (`:14`), and the live line-24 text **"EXIST and are not weakened or
> skipped"** (the forbidden literal `EXIST and PASS` does **not** appear and must stay absent — `workflow-template.test.mjs:802`).
> Test harness: `runPhase` / `buildSeqImpl` / `new AsyncFunction` sandbox (`:11-29`), `isAuditor` (`:73`), `PROVISION_ARGS`
> (`:52`, `t2 deps t1`, both merge → two gate-audit seats), `seatOf` (`:31`). Baseline node suite **green at HEAD: 260
> pass, 0 fail.** Every task re-anchors by **named construct**, never by literal line number.

**Operator decisions (2026-06-27, grill-with-docs):**
The grill resolved nine decision points; the operator has now ruled on the three that were escalated. All nine are
folded in below with their evidence.

- **DP1 (operator-ratified 2026-06-27) — Reuse `MERGE_RESULT.integration_sha`; do NOT add a `gate_head_sha` schema
  field.** *Operator's ratified choice.* `integration_sha` is already an **optional** `MERGE_RESULT` field
  (`workflow-template.js:47`, `schemas.md:49`), already returned on a merge per `war-refiner.md` (its merge-task return
  names "the new integration SHA"), and **no consumer reads it structurally** — the Lead/auditor read the sha as **TEXT**
  (from the prompt and the `auditLog`). A new typed field would be speculative serialized surface with a schema-mirror
  cost (schemas.md + the inline `MERGE_RESULT` object + the war-config mirror). Ride the existing optional field; one
  `schemas.md` doc line names it as the gate-HEAD provenance. (Same reuse principle applies to `AUDIT_VERDICT.audit_sha`
  in Task 2 — the seat returns its reviewed sha through the existing field, no new field.)
- **DP5 (operator-ratified 2026-06-27) — ALSO PIN the gate-audit seat's worktree to the integration tip NOW (full close
  of #193, not deferred).** *Operator's ratified choice.* The text-only sha-record (Task 1) lets the Lead SEE a mismatch,
  but the operator chose to close the false-negative at the source: pin the seat to the integration tip so a "test
  unrun" finding can only be raised when the test is genuinely absent **at the confirmed tip**. **Ponytail-minimal — reuse
  the `_refinery` worktree, create no new worktree:** at the gate-audit pass the loop-scoped `refineryPath` (`:308`) is
  out of scope, so reconstruct it (`const refineryPath = \`${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery\``,
  the exact precedent at `:392`). `_refinery` is checked out on `ph.integrationBranch` and sits **at the integration tip
  AFTER the serial merge queue and BEFORE Land/teardown**, so it is the correct pin for confirming a merged task's mapped
  test is present at the tip. The seat already has **read-only git Bash** (`war-auditor.md:5` `tools: Read, Grep, Glob,
  Bash`; `:14` "you may run **only** read-only git"), so lifting "you cannot run commands" → "read-only git in the pinned
  worktree" is **within the seat's existing capability — no tool/allowlist change.** Task 2 below.
- **DP9 (operator-ratified 2026-06-27 — corrected) — Serial landing G1(0.7.1) → G2(0.7.2) over the shared merge-task
  dispatch template literal is MANDATORY.** **Correction to both specs:** the regions are **NOT "disjoint."** G1 Task 1
  step (c) appends an `integration_sha` instruction to the **"populate `gate_output`"** sentence (`workflow-template.js:317`);
  the sibling spec **G2** (`docs/plans/2026-06-27-dispatched-gate-run-tmpdir-pin-parity.md`, #184, v0.7.2) appends a
  TMPDIR clause to the **adjacent** "Run the gate … after the rebase in the task worktree" sentence (`:316`). These are
  **ADJACENT lines in ONE template literal** (the `merge:${r.task.id}` `agent()` call) — not disjoint regions. **Land G1
  first; G2's worker re-anchors on the named construct** (the `merge:${r.task.id}` agent call + the specific sentence)
  because G1 will have shifted lines and added an adjacent clause (memory: `plan-line-number-refs-stale-use-construct-locator`).
  Keep the four-version-slot serialization note (each Release task replaces all four canonical version slots in place, so
  G1 then G2 land in order, never concurrently). For G1 itself there is no contention (G2 lands later).
- **DP2 (routine) — what does the absent-sha case interpolate?** → **a literal sentinel string, NOT `mr.working_sha`.**
  The spec step (a) said "fall back to `mr.working_sha`", but `working_sha` is set **only** on the land-phase
  (`war-refiner.md` land return names the new working SHA), never on the merge-task `MergeResult` this capture reads
  (its merge-task return names the integration SHA + `gate_output`). So `mr.integration_sha ?? mr.working_sha` collapses
  to `mr.integration_sha ?? undefined` on this path — the fallback is a **dead branch**. Use `gateHeadSha:
  mr.integration_sha ?? '(integration_sha unrecorded)'` so the directive's "cannot confirm" branch reads cleanly (an
  explicit marker, never the literal string `undefined`). The spec's regression test #3 ("when `working_sha` is set,
  assert the prompt carries it") tests an unreachable production scenario and is **replaced** by a sentinel-on-absent
  test (Task 1 test 3).
- **DP3 (routine) — does step (c) also edit `war-refiner.md`?** → **no — edit only the dispatched prompt
  (`workflow-template.js`).** This is the `standing-instruction-vs-dispatched-prompt-coverage-split` pattern: the
  standing `.md` and the dispatched merge-task prompt are **independent surfaces**; hardening one does NOT propagate to
  the other. `war-refiner.md` already instructs returning "the new integration SHA" and names the field at its MergeResult
  return line — so the `.md` already covers it in practice and is **not** the gap. The gap is the dispatched prompt clause
  (`workflow-template.js:316-317`), which says only "populate `gate_output`" and never asks for `integration_sha`. Scope
  Task 1 step (c) to the dispatched prompt only; leave `war-refiner.md` (byte-parity of the literal token is
  deferred-with-note only if a reviewer wants it).
- **DP4 (routine) — unique assertion tokens.** → Threading test: stub a **unique synthetic** `integration_sha`
  (`'sha-abc123unique'`) on the merged `MergeResult` and assert the captured gate-audit prompt `.includes` that exact
  token. Directive test: assert a unique substring of the NEW directive (`'corresponds to the current integration tip'`)
  **verified ABSENT** from the prompt at HEAD (grep-confirmed before implementing, so the test genuinely goes RED first).
  auditLog test: assert the returned `auditLog` gate-evidence entry carries `gateHeadSha` equal to the unique token.
  Pattern on the existing `Task 4 — post-merge gate-audit prompt references the executed gate output` test
  (`workflow-template.test.mjs:877-902`), which stubs `GATE_OUT` and asserts `.includes` via `runPhase`. Evidence:
  memory `weak-test-assertion-passes-without-feature-being-exercised`.
- **DP6 (routine) — does the additive prompt injection break the existing soft/hard gate-audit tests?** → **no.** The
  existing tests (`workflow-template.test.mjs:904-1001`) stub `{ mode:'merge-task', status:'merged', gate_output }` with
  **no `integration_sha`** and assert only on `landDecision` + `escalated[]`/`auditLog` (verdict-driven), plus one
  `.includes(GATE_OUT)`. They never pin prompt structure and never assert the prompt EXCLUDES a sha/directive substring
  (**grep-confirmed: no negative assertion on the gate-audit prompt exists**). So `gateHeadSha` is the sentinel (DP2) in
  those stubs and every assertion still passes. Task 1 test 4 + Task 2's pin tests re-run these explicitly.
- **DP7 (routine) — exact wiring sites for the sha.** → **three** sites: (1) the capture (`mergedTasksForGateAudit.push`)
  — add `gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)'`; (2) the destructure in the
  `parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria }) => …))` — add `gateHeadSha`, then
  interpolate into the prompt template; (3) the `auditLog.push` (`:362`) — add `gateHeadSha` + `auditSha:
  gateAuditVerdict.audit_sha`. **All load-bearing:** miss the destructure and the field is captured but silently DROPPED;
  miss the auditLog and the Lead's held:escalation adjudication surface (returned at the per-phase return) has no sha
  (the reviewer's MAJOR finding — the spec D1 says the sha rides "into the prompt + auditLog").
- **DP8 (routine) — Task 3 term + the forbidden-token trap.** → Use the literal term **`execution-evidence`**
  (byte-consistent with the prompt label at `workflow-template.js:344` and the lens-detection in the tests). The bullet
  goes under `## Review through your lens` (`war-auditor.md:18`) as ~2-5 markdown lines; do NOT add a top-level heading
  or restructure. **HARD CONSTRAINT:** do **not** introduce the literal substring `EXIST and PASS`
  (`workflow-template.test.mjs:802` asserts `war-auditor.md` does NOT contain it). Note: **line 24 today reads "EXIST and
  are not weakened or skipped"** — that is the *live* anti-cheat wording and is fine; the **forbidden token is the exact
  string `EXIST and PASS`**, which does not currently appear. Phrase the hard-case as "a mapped acceptance-criteria test
  is **provably unrun at the confirmed integration tip** (present in the worktree at that sha but absent/0-count in the
  gate output), recorded at **Critical/Major**" — never "tests must EXIST and PASS". All other `war-auditor.md`
  assertions are substring presence/absence checks an additive bullet cannot break.

**Architecture:** all change sites are on the **post-merge gate-audit pass** in `workflow-template.js` (the
`if (mergedTasksForGateAudit.length > 0)` block) plus the merge-task `agent()` dispatch prompt immediately above it.
The file is executed in a sandbox via `new AsyncFunction('agent','parallel','pipeline','log','phase','args','budget',
src)` (`workflow-template.test.mjs:11` `build()`); tests drive it through the behavioral harness `runPhase(args,
agentImpl)` (`:21`) with `PROVISION_ARGS()` (`:52` — `t2 deps t1`, both merge → two gate-audit seats), `seatOf`
(`:31`), `isAuditor` (`:73`), and a recording mock `agent`, asserting on the captured `calls` (prompt text) and the
returned `{ landDecision, escalated, auditLog }`. **No import surface and no new schema:** `gateHeadSha` is a local
capture var; `refineryPath` at the gate-audit pass is reconstructed from `worktreeRoot`/`runId` (the `:392` precedent);
the seat reuses the already-checked-out `_refinery` worktree and its own existing read-only git Bash. The only
serialized contract touched is the **doc line** in `schemas.md` (`integration_sha?` already exists). `war-auditor.md`
is read by `workflow-template.test.mjs` only (`readFileSync` at `:8`, presence/absence substring asserts).

**Dependency / ordering:** Task 1 → Task 2 → Task 3. Task 2 builds the worktree-pin **on top of** Task 1's threaded
`gateHeadSha` (it confirms `HEAD == gateHeadSha`, so the sha must already be in scope at the destructure). Task 3
(doc) mirrors the **final** mechanism (sha provenance + worktree-pin + SOFT-downgrade) so `war-auditor.md` matches the
prompt as shipped. **Position in the stack:** this is **G1**, owning the `0.7.1` slot. The sibling spec **G2**
(`dispatched-gate-run-tmpdir-pin-parity`, `0.7.2`, builds on v0.7.1) edits the **SAME merge-task dispatch prompt
string** — see DP9. **Serial landing G1(0.7.1) → G2(0.7.2) is MANDATORY**; G2's worker re-anchors on the named
construct because G1 will have shifted lines. For G1 itself there is no contention (G2 lands later).

**Tech stack:** ESM `workflow-template.js`; `node --test` over `skills/**/*.test.mjs` (quoted glob — bash 3.2
under-covers unquoted, F12 lesson); plus every `*.test.sh` runner discovered by `find` (the self-discovering
multi-runner gate). Task 3 is pure markdown (no executable surface — no `*.test.sh` reads `war-auditor.md`).

## Build order (for `/war`)

One base branch; three serialized content tasks, then release:
- **Phase 1 — sha provenance + worktree-pin + lens doc:** T1 (#193, sha provenance) → T2 (#193, worktree-pin, builds on
  T1's `gateHeadSha`) → T3 (#117, doc-only, mirrors the FINAL mechanism).
- **Phase 2 — release:** T4 (v0.7.1).

All content tasks touch the gate-audit surface; serialize (memory:
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks` → one-task-per-phase semantics within the shared
template literal). T2 depends on T1's threaded `gateHeadSha`; T3 depends on T1+T2's final directive text.

---

## Phase 1 — Gate-audit sha provenance, worktree-pin, and lens documentation

### Task 1 — Thread the gate-HEAD sha (integration_sha) into the gate-audit prompt + auditLog + refiner populates it (#193)

**Files:**
- modify `skills/war/assets/workflow-template.js` — (a) `mergedTasksForGateAudit.push` capture (add `gateHeadSha`) +
  the header comment at `:108`; (b) the `parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria })
  => …))` **destructure** (add `gateHeadSha`) + interpolate the sha into the `POST-MERGE GATE-AUDIT … lens:
  execution-evidence` prompt template + the strictly-conditioned SOFT-on-cannot-confirm directive; (b′) the
  `auditLog.push` (`:362`) — add `gateHeadSha` + `auditSha: gateAuditVerdict.audit_sha`; (c) the merge-task `agent()`
  dispatch prompt's "populate `gate_output`" clause (also instruct populating `integration_sha`). **No** change to
  `isHardGateEvidence` or `HARD_ESCALATION_REASONS`.
- modify `skills/war/references/schemas.md` — one line under the `## MergeResult — war-refiner` section naming
  `integration_sha` as the gate-HEAD provenance the gate-audit pass reads.
- test `skills/war/assets/workflow-template.test.mjs` — new assertions beside the `Task 4 — post-merge gate-audit`
  tests, on the `runPhase`/`PROVISION_ARGS`/`seatOf`/`isAuditor` harness.

- [ ] **Step 1 — Write failing tests (behavioral, via `runPhase`; assert on UNIQUE tokens).** Mirror `Task 4 —
  post-merge gate-audit prompt references the executed gate output` (`:877-902`): stub the merge `MergeResult` with the
  `mode:'merge-task', status:'merged'` branch carrying a **unique synthetic** `integration_sha` (DP4).
  - *Test 1 — sha threading (RED→GREEN).* Stub `{ mode:'merge-task', status:'merged', gate_output: GATE_OUT,
    integration_sha: 'sha-abc123unique' }`; capture the gate-audit prompt (filter `calls` by `isAuditor` && prompt-or-label
    `.includes('execution-evidence')`); assert the prompt `.includes('sha-abc123unique')`. Assert on the unique sha, NOT
    pre-existing content.
    - **Destructure-trap coverage (F9):** Test 1 **transitively proves the destructure pulled `gateHeadSha`** — the prompt
      interpolates the destructured variable, so if the `parallel(...map({ … gateHeadSha }))` destructure omits
      `gateHeadSha` the token never reaches the prompt and Test 1 goes RED. The "captured but silently DROPPED at the
      destructure" trap (DP7) is therefore covered by Test 1; **no separate destructure test is needed.**
  - *Test 2 — defusing directive present (RED→GREEN).* Assert the same prompt `.includes('corresponds to the current
    integration tip')` (a unique substring of the new directive, **verified absent at HEAD**).
  - *Test 3 — sentinel on absent sha (regression, replaces spec test #3).* Stub a merged result with **no**
    `integration_sha` (the existing stub shape); assert the prompt `.includes('(integration_sha unrecorded)')` — proves
    the absent-sha case interpolates the sentinel, never the literal `undefined` (DP2). (Drops the spec's unreachable
    `working_sha` fallback test.)
  - *Test 4 — sha rides into the auditLog (RED→GREEN; reviewer MAJOR finding).* Reuse the HARD-case impl (gate-audit seat
    returns a **Critical** finding with `integration_sha: 'sha-abc123unique'` stubbed, and `audit_sha: 'auditsha-xyz789'`);
    drive via `runPhase`; assert `out.auditLog.find(e => e && e.gateEvidence).gateHeadSha === 'sha-abc123unique'` and
    `… .auditSha === 'auditsha-xyz789'`. Proves the sha reaches the Lead's held:escalation adjudication surface, not just
    the prompt.
  - *Test 5 — hardness preserved (regression).* Re-assert the existing HARD case: a gate-audit seat returning a
    **Critical** finding **with** a present-and-matching `integration_sha` → `landDecision === 'held:escalation'` and
    `escalated[]` carries `{ reason:'gate-evidence' }`. Mirror `Task 4 — post-merge gate-audit HARD case` (`:934-971`).
- [ ] **Step 2 — Run gate → fail.** Tests 1-2 fail today: the sha is dropped at the capture (`mergedTasksForGateAudit.
  push` records no sha) so `'sha-abc123unique'` never reaches the prompt, and the directive substring `'corresponds to
  the current integration tip'` does not exist (grep-confirmed absent at HEAD). Test 3 fails (no sentinel). Test 4 fails
  (`auditLog.push` at `:362` has no `gateHeadSha`/`auditSha` keys — grep-confirmed). Test 5 already passes (guard green).
- [ ] **Step 3 — Implement (minimal, additive).**
  - **(a)** at the `mergedTasksForGateAudit.push` capture (`:321`), add the field, and update the header comment at
    `:108` so it does not go stale (memory `source-comment-lags-emitted-prompt-after-rewrite`):
    ```js
    // collect {taskId, gateOutput, acceptanceCriteria, gateHeadSha} for post-merge gate-audit pass (F04 R3)
    ```
    ```js
    mergedTasksForGateAudit.push({ taskId: r.task.id, gateOutput: mr.gate_output,
      acceptanceCriteria: r.task.planSlice,
      gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)' })
    ```
    `// ponytail: sentinel, not mr.working_sha — working_sha is land-only (war-refiner.md), dead on a merge result`
  - **(b)** add `gateHeadSha` to the `parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria,
    gateHeadSha }) => …))` destructure, then in the `POST-MERGE GATE-AUDIT` prompt template add the sha line + the
    strictly-conditioned directive (beside the existing `Default: SOFT. Hard only when provably unrun.` instruction):
    ```
    Gate-HEAD sha (the rebased integration tip the gate ran at): ${gateHeadSha}.
    If you cannot confirm the executed gate output corresponds to the current integration tip
    (gate-HEAD sha above vs the phase integration tip), record a SOFT note, never a HARD finding —
    a stale gate output (gate-HEAD sha != integration tip) cannot be a provably-unrun land-halt.
    This SOFT-downgrade applies ONLY to the cannot-confirm case; a mapped test provably unrun AT the
    confirmed gate-HEAD sha stays HARD.
    ```
    (D2 — the downgrade is conditioned STRICTLY on "cannot confirm sha == integration tip"; the provably-unrun-at-the-
    confirmed-sha path stays HARD so a true positive cannot slip to SOFT. Task 2 makes "confirm" mechanical.)
  - **(b′)** extend the `auditLog.push` at `:362` so the threaded sha + the seat's reviewed sha reach the Lead's
    adjudication surface (the per-phase `auditLog` return):
    ```js
    auditLog.push({ task: taskId, verdict: `gate-audit:${gateAuditVerdict.verdict}`, findings,
      gateEvidence: true, hard: isHardGateEvidence, gateHeadSha, auditSha: gateAuditVerdict.audit_sha })
    ```
    (Reviewer MAJOR finding — D1 says the sha rides "into the prompt **and** auditLog"; `auditSha` reuses the existing
    `AUDIT_VERDICT.audit_sha` field — no new field.)
  - **(c)** in the merge-task `agent()` dispatch prompt, extend the "populate `gate_output` …" clause (`:317`) to also
    ask for the sha: append `Also populate integration_sha with the rebased integration tip the gate ran against, so the
    gate-audit pass can confirm the gate ran at the integration tip.` (D3 — dispatched-prompt surface only; the
    standing `war-refiner.md` already covers it.)
  - **(d)** `schemas.md` — this is a **PROSE ANNOTATION to the existing `integration_sha?` field** (which already exists,
    undocumented), **not a new field**. Add this exact line under `## MergeResult — war-refiner`:
    > `integration_sha` — the post-rebase integration tip the gate ran at; the post-merge gate-audit pass reads it as
    > gate-HEAD provenance to confirm the executed `gate_output` corresponds to the integration tip (it does not add a
    > field; `integration_sha?` already exists).
- [ ] **Step 4 — Run gate → pass.** Tests 1-4 now green; Test 5 + the existing `Task 4 — post-merge gate-audit` suite
  (`:850-1001`: lens-spawn, GATE_OUT inclusion, SOFT-default `landed`, HARD Critical/Major `held:escalation`, PARALLEL
  structural) all stay green (DP6 — additive injection, presence-only assertions). Whole node suite (260 baseline)
  stays green.
- [ ] **Step 5 — Commit** — `fix(war): thread gate-HEAD sha (integration_sha) into the post-merge gate-audit prompt + auditLog + refiner populates it (#193)`
- **Closes:** advances #193 (sha provenance into prompt + auditLog + refiner populates the field + schemas.md doc line).
  Task 2 adds the worktree-pin that fully closes it.

### Task 2 — Pin the gate-audit seat's worktree to the integration tip + stale-tip defusing rule (#193)

**Files:**
- modify `skills/war/assets/workflow-template.js` — (a) reconstruct the integration-tip worktree path at the gate-audit
  pass (the loop-scoped `refineryPath` at `:308` is OUT OF SCOPE there); (b) rewrite the `POST-MERGE GATE-AUDIT` prompt
  (`:343-351`) from "you cannot run commands" into a **pinned read-only auditor** that confirms `git -C ${refineryPath}
  rev-parse HEAD == ${gateHeadSha}` then reads the mapped test at that tip, with the HARD-only-at-confirmed-tip /
  SOFT-on-cannot-confirm rule made mechanical. **No** change to `isHardGateEvidence`, `HARD_ESCALATION_REASONS`, the
  seat's tool allowlist, or any schema. **deps:** Task 1 (`gateHeadSha` must already be threaded into the destructure).
- test `skills/war/assets/workflow-template.test.mjs` — new assertions beside Task 1's, same harness.

- [ ] **Step 1 — Write failing tests (behavioral, via `runPhase`; assert on UNIQUE tokens).**
  - *Test 1 — pinned worktree path interpolated (RED→GREEN).* `PROVISION_ARGS()` supplies `worktreeRoot:'/abs/repo/.claude/worktrees'`
    + `runId:'run-2026'`, so the reconstructed path is `'/abs/repo/.claude/worktrees/run-2026/_refinery'`. Capture the
    gate-audit prompt and assert `.includes('/abs/repo/.claude/worktrees/run-2026/_refinery')` (a unique path token built
    from the args, **verified absent from the gate-audit prompt at HEAD** — the loop-scoped `refineryPath` never reaches
    this pass today).
  - *Test 2 — HEAD-confirm instruction present (RED→GREEN).* Assert the prompt `.includes('rev-parse HEAD')` AND a unique
    substring of the mechanical bracket comparison tying it to the sha gate, e.g. `.includes('[ "$(git -C')` (the exact
    `[ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]` test from step 3(b)), verified absent at HEAD.
  - *Test 3 — "cannot run commands" is GONE (RED→GREEN).* Assert the gate-audit prompt does **NOT** include the literal
    `'you cannot run commands'` (present at HEAD `:345`; this test goes RED until the rewrite removes it).
  - *Test 4 — read-the-test-at-the-tip instruction present (RED→GREEN).* Assert a unique substring instructing the seat to
    read the mapped acceptance-criteria test **in the pinned worktree at the confirmed tip** (e.g. `.includes('present in
    the files at that tip')`), not merely infer it from `gate_output` text.
  - *Test 5 — hardness preserved (regression).* Re-run the existing HARD case (`Task 4 … HARD case`, `:934-971`): a
    Critical gate-evidence finding still yields `landDecision === 'held:escalation'` + `escalated[]` with
    `reason:'gate-evidence'`. The prompt rewrite must not change the escalation wiring (still `:360`/`:363-365`).
  - *Test 6 — SOFT-default preserved (regression).* Re-run `Task 4 — … does NOT block the land (soft by default)`
    (`:904-932`): a Minor gate-audit finding still yields `landDecision === 'landed'`.
- [ ] **Step 2 — Run gate → fail.** Tests 1-4 fail today: there is no `refineryPath` in scope at the gate-audit pass
  (`:308` is loop-scoped, the for-loop has closed), the prompt says "you cannot run commands" with no `rev-parse`/path/
  read-at-tip instruction (grep-confirmed). Tests 5-6 already pass (guard green).
- [ ] **Step 3 — Implement (minimal, reuse `_refinery`).**
  - **(a)** immediately inside the `if (mergedTasksForGateAudit.length > 0)` block (before the `parallel(...)`),
    reconstruct the integration-tip worktree path — the `:392` `refineryLandPath` precedent, byte-identical shape:
    ```js
    const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
    ```
    `// ponytail: reuse the _refinery worktree — already checked out on ph.integrationBranch at the integration tip`
    `//           after the serial merge queue and before Land/teardown; loop-scoped :308 refineryPath is out of scope here`
  - **(b)** rewrite the `POST-MERGE GATE-AUDIT` prompt (`:343-351`) — replace the "you cannot run commands" sentence with
    a pinned read-only auditor directive (the sha line from Task 1 step (b) stays):
    ```
    You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at
    ${refineryPath} (the _refinery worktree) and the gate ran at gate-HEAD sha ${gateHeadSha}.
    First confirm your evidence is pinned to the integration tip by running EXACTLY this bracket test:
        [ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]
    Exit 0 ⇒ pin CONFIRMED (your worktree is at the integration tip). Non-zero exit — including git
    unavailable or rev-parse failing — ⇒ you CANNOT confirm the pin.
    If CONFIRMED, then confirm the mapped acceptance-criteria test is PRESENT in the files at that tip
    (read-only git / Read in ${refineryPath}), not merely inferred from the gate output text; record a
    HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE CONFIRMED INTEGRATION TIP.
    If you CANNOT confirm (the bracket test is non-zero or the command cannot run), record a SOFT note,
    never a HARD finding (the stale-tip defusing rule). The SOFT note MUST state: the observed HEAD sha
    (or "rev-parse failed"), the expected gate-HEAD sha ${gateHeadSha}, and the reason — "gate-audit
    worktree not at the integration tip — execution evidence unreliable, downgraded to SOFT, not a land-halt".
    Return your reviewed audit_sha so the Lead can compare it to the gate-HEAD sha.
    ```
    This makes the Task 1 "cannot confirm" SOFT-downgrade **mechanical**: "confirm" is the exact bracket test
    `[ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]` (exit 0 ⇒ confirmed), and "cannot confirm" is
    operationally **that bracket test exiting non-zero OR the command being unable to run** — not a guess. It closes the
    recurring `audit-worktree-pre-impl-tip-stale-verdict` false-negative at the source: a "test unrun" finding can only be
    HARD when the test is genuinely absent at the confirmed tip. The seat already has read-only git Bash
    (`war-auditor.md:5`,`:14`) — no tool/allowlist change. `audit_sha` reuses the existing `AUDIT_VERDICT` field (already
    threaded into the auditLog by Task 1 step (b′)).
- [ ] **Step 4 — Run gate → pass.** Tests 1-4 now green; Tests 5-6 + the full `Task 4 — post-merge gate-audit` suite
  (`:850-1001`) stay green (the escalation wiring at `:360`/`:363-365` and the `auditLog`/`escalated` shapes are
  untouched — only the prompt text and a new local `refineryPath` const change). Whole node suite stays green.
- [ ] **Step 5 — Commit** — `fix(war): pin the post-merge gate-audit seat to the _refinery integration tip + stale-tip SOFT-downgrade rule (#193)`
- **Closes:** **fully closes #193** (sha provenance from Task 1 + this worktree-pin + the mechanical stale-tip defusing
  rule). No deferral — the worktree-pin is implemented here, not deferred-with-note.

### Task 3 — Document the `execution-evidence` lens in war-auditor.md (#117)

**Files:** modify `agents/war-auditor.md` — one bullet under `## Review through your lens` (`:18`), beside the
existing `correctness` / `cascading-impact` / `plan-faithfulness` / `domain` entries. **deps:** Tasks 1+2 (mirrors the
FINAL mechanism — sha provenance AND the worktree-pin AND the SOFT-downgrade).

- [ ] **Step 1 — (no behavioral test — ponytail: YAGNI on tests for prose.)** Markdown has no runnable surface; no
  `*.test.sh` reads `war-auditor.md`, and the only reader (`workflow-template.test.mjs`) does substring presence/absence
  checks an additive bullet cannot break. The regression guard is the full self-discovering gate (Step 4) — confirm
  the bullet does **not** introduce the forbidden literal `EXIST and PASS` (`workflow-template.test.mjs:802`). (The live
  line-24 text "EXIST and are not weakened or skipped" is the existing anti-cheat wording and is untouched.)
- [ ] **Step 2 — (n/a — no new test to go red).**
- [ ] **Step 3 — Implement (doc prose, ~2-5 lines).** Add under `## Review through your lens`:
  > - **execution-evidence** — the **post-merge gate-audit pass** runs this lens over the refiner's executed
  >   `gate_output`, **pinned to the integration tip**: the phase integration branch is checked out in the `_refinery`
  >   worktree and you confirm `git rev-parse HEAD` equals the gate-HEAD sha (`integration_sha`) **before** judging, then
  >   confirm the mapped acceptance-criteria test is present in the files at that tip. Findings are **SOFT by default**
  >   and do **not** hold the land; a finding is **HARD only** when a mapped test is **provably unrun at the confirmed
  >   integration tip** (present in the worktree at that sha but absent / 0-count in the gate output), recorded at
  >   **Critical/Major**. Escalation keys on finding **SEVERITY, not the seat verdict** — a finding-less `escalate` is
  >   intentionally SOFT. If you **cannot confirm** your worktree HEAD equals the gate-HEAD sha, downgrade to a SOFT note,
  >   never a hard land-halt (the stale-tip defusing rule).
  Use the literal term `execution-evidence` (DP8). Do NOT restructure the section or add a top-level heading. Do NOT
  write "EXIST and PASS".
- [ ] **Step 4 — Run gate → pass.** The full self-discovering gate stays green; `Task 4 — war-auditor.md does NOT
  contain "EXIST and PASS"` (`:799`), `… states the refiner runs the gate` (`:806`), `… verify test existence +
  integrity` (`:812`) all stay green (additive bullet, no forbidden token; "refiner" + "exist"/"integrity"/"weaken"
  wording in line 24 is preserved).
- [ ] **Step 5 — Commit** — `docs(war): document the execution-evidence lens (worktree-pin + severity-keyed hard/soft + stale-tip SOFT-downgrade) in war-auditor.md (#117)`
- **Closes:** #117 (resolves Open decision #1 — the severity-keyed hard/soft boundary AND the worktree-pin are now
  documented for the seat that runs the lens).

---

## Phase 2 — Release

### Task 4 — Version bump v0.7.1 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` AND
`plugins[0].version` — both; stale = silent no-op release); `README.md` `## Status` (REPLACE-in-place the `0.7.0`
block; "Builds on v0.7.0"). No badge.

- [ ] **Step 1 — Bump all four slots to `0.7.1`** (memory: `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`; `version-slots-no-cross-slot-consistency-test` — no automated
  cross-slot check, verify all four by hand). **G1 owns 0.7.1**; G2 (`dispatched-gate-run-tmpdir-pin-parity`) takes
  0.7.2 on this tip — **take the next free patch by construct if the stack order shifts** (memory:
  `stacked-per-branch-releases-make-main-lag-cumulative`), do not assume 0.7.1 if G2 landed first. Status copy: gate-HEAD
  sha provenance threaded via `integration_sha` (prompt + auditLog) + gate-audit seat pinned to the `_refinery`
  integration tip + stale-tip SOFT-downgrade + execution-evidence lens documented.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.1 — gate-audit execution-evidence sha provenance + worktree-pin + lens doc (#193 #117)`

---

## Test plan

**Gate** = the self-discovering multi-runner (quote the node glob; discover bash suites). Run at every Step 2/4, final
green required:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Harness:** all new tests use the existing `runPhase(args, agentImpl)` behavioral harness in
`workflow-template.test.mjs` (builds the template via `new AsyncFunction(...)`, drives a recording mock `agent` +
faithful `parallel`); reuse `PROVISION_ARGS()` / `seatOf` / `isAuditor` and the merged-stub shape from `:854-866`.

| Task | New/strengthened test | Key assertion (UNIQUE token) | Prior-art mirrored |
|---|---|---|---|
| T1 sha → prompt | sha reaches the gate-audit prompt | prompt `.includes('sha-abc123unique')` (stubbed on `integration_sha`) | "Task 4 — gate-audit prompt references the executed gate output" (`:877`) |
| T1 directive | SOFT-on-cannot-confirm directive present | prompt `.includes('corresponds to the current integration tip')` (verified ABSENT at HEAD) | same |
| T1 sentinel | absent sha → sentinel, not `undefined` | prompt `.includes('(integration_sha unrecorded)')` when no `integration_sha` | same |
| T1 sha → auditLog | sha rides into the auditLog (reviewer MAJOR) | `auditLog.find(e=>e.gateEvidence).gateHeadSha === 'sha-abc123unique'`; `.auditSha === 'auditsha-xyz789'` | "Task 4 — gate-audit HARD case" (`:934`) |
| T1 hardness | Critical finding WITH matching sha still holds | `landDecision === 'held:escalation'`; `escalated[]` has `reason:'gate-evidence'` | same |
| T2 pinned path | `_refinery` integration-tip path interpolated | prompt `.includes('/abs/repo/.claude/worktrees/run-2026/_refinery')` (built from `PROVISION_ARGS`, ABSENT at HEAD) | "Task 4 — gate-audit prompt references the executed gate output" (`:877`) |
| T2 HEAD-confirm | mechanical `rev-parse HEAD == gateHeadSha` bracket test present | prompt `.includes('rev-parse HEAD')` && `.includes('[ "$(git -C')` (the exact bracket comparison) | same |
| T2 no-cannot-run | "you cannot run commands" removed | prompt does **NOT** include `'you cannot run commands'` (present at HEAD) | same |
| T2 read-at-tip | seat reads the mapped test at the tip | prompt `.includes('present in the files at that tip')` | same |
| T2 hardness / soft | escalation wiring unchanged by the rewrite | HARD: `held:escalation`; SOFT: `landed` | "Task 4 — HARD case" (`:934`) + "soft by default" (`:904`) |
| T3 lens doc | (no behavioral test — prose) | full gate green; no `EXIST and PASS` introduced | n/a (regression guard = full gate) |

**Regression guard:** the full existing `Task 4 — post-merge gate-audit` suite (`:850-1001`) — lens-spawn, GATE_OUT
inclusion, SOFT-default `landed`, HARD Critical/Major `held:escalation`, PARALLEL structural — plus the
`war-auditor.md` substring asserts (`:799-828`) must stay green. None asserts the gate-audit prompt EXCLUDES a
sha/directive/path substring (grep-confirmed), and the escalation wiring (`isHardGateEvidence` `:360`, `escalated.push`
`:365`) is untouched, so the additive injection + prompt rewrite are safe (DP6).

## Operator decisions — RESOLVED

All three previously-escalated decision points have been ruled on by the operator (2026-06-27) and are folded into the
**Operator decisions** list above (DP1, DP5, DP9):
- **DP1 → Reuse `MERGE_RESULT.integration_sha`** as the gate-HEAD provenance (and `AUDIT_VERDICT.audit_sha` for the
  seat's reviewed sha). No new schema field. *Operator-ratified.*
- **DP5 → ALSO pin the gate-audit seat's worktree to the integration tip NOW** (full close of #193). Reuse the
  `_refinery` worktree; confirm `HEAD == gateHeadSha`; HARD only at the confirmed tip. *Operator-ratified.* Task 2.
- **DP9 → Serial landing G1(0.7.1) → G2(0.7.2) over the SHARED (adjacent, not disjoint) merge-task dispatch template
  literal is MANDATORY**; G2's worker re-anchors by named construct. Four-version-slot serialization preserved.
  *Operator-ratified, with the "disjoint regions" error in both specs corrected.*

## Recommended ADRs

**None.** The two ADR candidates the grill surfaced (DP1 reuse-`integration_sha`; DP5 worktree-pin) both **fail** the
3-part test (hard-to-reverse + surprising + real-tradeoff). DP1 is not hard-to-reverse (promoting to a typed field later
is equally cheap and additive) and not surprising (reusing an already-returned sha is the obvious default). DP5's
worktree-pin reuses the existing `_refinery` worktree and the seat's existing read-only git — not surprising, and
reversible (revert the prompt rewrite). The D1/D2 prose + the in-code `ponytail:` comments are sufficient durable
rationale. Do **not** write an ADR file.

## Out of scope / Deferred

- **No change to `isHardGateEvidence`, `HARD_ESCALATION_REASONS`, `land-decision.mjs`, or the land-decision membership
  assertions** (D5). `gate-evidence` stays hard; the inline `HARD_ESCALATION_REASONS` deliberately diverges from
  `land-decision.mjs` by carrying the extra `unrunnable-deps` member, and `land-decision.test.mjs` uses per-member
  `.includes()` (no `deepEqual`), so there is no drift to repair.
- **No new schema field** (`MERGE_RESULT` / `AUDIT_VERDICT` unchanged beyond the `schemas.md` doc line) — DP1.
  `integration_sha` and `audit_sha` already exist; both are reused.
- **No new worktree** — DP5. The gate-audit seat is pinned to the **existing** `_refinery` worktree (already checked out
  on `ph.integrationBranch` at the integration tip after the serial merge queue), reconstructed from `worktreeRoot`/`runId`
  via the `:392` precedent. No worker self-create, no `WAR_WORKTREE` export.
- **`war-refiner.md` is NOT edited** (DP3) — its merge-task return already names "the new integration SHA" and the field
  `integration_sha?`; the gap is the **dispatched** prompt only. Byte-parity (the literal token `integration_sha` in the
  `.md`) is deferred-with-note, not in this plan's scope.
- **Cross-spec serial landing (G2):** G1 Task 1 step (c) edits the "populate `gate_output`" sentence
  (`workflow-template.js:317`), **adjacent** to G2's gate-RUN TMPDIR edit (`:316`) in the SAME template literal — these
  are consecutive lines, **NOT disjoint** (DP9, correcting both specs). Serial landing **G1(0.7.1) → G2(0.7.2)** is
  mandatory; the later worker re-anchors by construct. Neither side may assume textual independence.
- **Spec ↔ plan alignment (2026-06-27):** the companion SPEC
  (`docs/specs/2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md`) has now been **aligned to this
  ratified plan**: the worktree-pin is **promoted from deferred to in-scope** (new decision D6), the absent-sha fallback
  is the literal sentinel `(integration_sha unrecorded)` (not `working_sha`), and the cross-spec "disjoint" wording is
  corrected to "adjacent lines in one template literal". Spec and plan are now consistent.

## Coverage

| Issue | Coverage |
|---|---|
| #193 | **full** — sha provenance threaded via `integration_sha` into the prompt **and** the `auditLog` (Task 1) + the gate-audit seat **pinned to the `_refinery` integration tip** with a mechanical `rev-parse HEAD == gateHeadSha` confirm and HARD-only-at-confirmed-tip + stale-tip SOFT-downgrade (Task 2) + refiner populates the field + schemas.md doc line. **No deferral** — the worktree-pin is implemented. |
| #117 | **full** — execution-evidence lens bullet added to `war-auditor.md`, documenting the worktree-pin, the severity-keyed hard/soft coupling, and the stale-tip SOFT-downgrade. |
