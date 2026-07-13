---
name: integrated-tip-authoritative-gate-audit-seat-has-no-gate-log-path-field
description: integratedTipGate schema lacks gate_log_path
metadata: 
  node_type: memory
  type: project
  keywords: 
    - gate_log_path
    - integratedTipGate
    - EVIDENCE_RESULT
    - authoritative seat
    - gate-audit
    - unsubstituted placeholder
    - artifact-capture
    - cannot-confirm
    - gate-phase log
    - evidence dispatch
    - execution-evidence
  provenance: code-verified
  slug: integrated-tip-authoritative-gate-audit-seat-has-no-gate-log-path-field
  phase: war-room-config-expansion/phase-1
  tags: 
    - war
    - auditor
    - gate-audit
    - prompt-architecture
    - workflow-template
    - coverage-gap
  created: 2026-07-11
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Integrated-tip authoritative gate-audit seat cannot honor the artifact-read directive — no path field exists

**What was observed:** the final `phase-1-integrated-tip` gate-audit (`authoritative:true`) reported
a SOFT cannot-confirm: its spawn prompt "carried the literal token 'gate_log_path' (unsubstituted),
so no artifact was readable." Not a hold — the tip was independently confirmed by other means — but
worth tracing to root cause, since `[[gate-output-curated-excerpt-obscures-mapped-test-evidence]]`
(archived) claims the artifact-capture mechanism already "closed" the curated-excerpt gap.

**Root cause (code-verified, `skills/war/assets/workflow-template.js` @ phase
war-room-config-expansion/phase-1 — verify still present before acting):**
- The per-task gate-audit path DOES support artifact capture: `MergeResult.gate_log_path` is a real
  field (`EVIDENCE_RESULT`/`MERGE_RESULT` schema, doc comment "gate_log_path (D5)"), threaded into
  each per-task prompt as `${artifactLine}` ("GATE LOG ARTIFACT: read the FULL captured gate log
  at...").
- The **integrated-tip authoritative seat is a separate code path** (the `INTRA-PHASE-DEP` branch of
  the evidence-dispatch prompt, D4 comment "authoritative integrated-tip seat"). The evidence-dispatch
  prompt DOES instruct the refiner to tee the re-run gate to
  `${refineryPath}/.war/gate-phase-${ph.id}.log` — but the `Return { ... integratedTipGate? }`
  contract only asks for `{ gate_output, tip_sha }`. The **file path itself is never returned**.
- The `integratedTipGate` object in `EVIDENCE_RESULT`'s schema (comment `// integratedTipGate is`)
  has `properties: { gate_output, tip_sha }` — **no `gate_log_path` field at all**.
- Consequently the authoritative-seat prompt (`INTEGRATED-TIP GATE-AUDIT for WAR phase...`) passes
  `integratedTip.gate_output` **inline** with no artifact path — despite `agents/war-auditor.md`'s
  standing instruction (universal, reaches every auditor spawn) unconditionally telling the seat to
  "Read the captured gate-log artifact at the threaded path... A missing artifact ⇒ SOFT
  cannot-confirm."

**The pattern:** this is exactly the residual risk the (now-archived, resolved-for-a-different-
directive) `[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]` predicted:
"a genuinely NEW directive still needs its own row" of enumeration across every inline gate-audit
prompt surface. The gate-log-artifact directive was added to `war-auditor.md` and the **per-task**
inline prompt, but never extended to the **integrated-tip authoritative** inline prompt (a fourth,
distinct call site) — so that one seat structurally cannot satisfy the standing instruction and
always falls to the (harmless, fail-open) SOFT cannot-confirm path, even on a tip the refiner DID
tee a full log for.

**Fix shape (not yet done, out of scope for this phase):** add `gate_log_path` (or `tip_log_path`) to
`EVIDENCE_RESULT.integratedTipGate`'s schema, have the evidence-dispatch prompt return the
`.war/gate-phase-${ph.id}.log` path it already tees to, and thread it into the authoritative-seat
prompt the same way `${artifactLine}` is threaded per-task.

**Locate cues (verify still present before acting):** `skills/war/assets/workflow-template.js` —
`EVIDENCE_RESULT` schema comment `// integratedTipGate is` (~line 96-106); evidence-dispatch prompt
`INTRA-PHASE-DEP phase` clause teeing to `.war/gate-phase-${ph.id}.log`; authoritative-seat prompt
literal `INTEGRATED-TIP GATE-AUDIT for WAR phase`; the per-task contrast is `const artifactLine =
gateLogPath || '(no gate-log artifact path recorded)'` a few hundred lines earlier in the same file.
`agents/war-auditor.md` — "Read the captured gate-log artifact at the threaded path" bullet.

Relates to [[gate-output-curated-excerpt-obscures-mapped-test-evidence]] (the general curated-
excerpt/artifact-capture history) and
[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]] (the both-surfaces
registry that closed a *different* directive's coverage gap on this same set of inline prompts —
this is a still-open instance of the pattern it named).

## RESOLVED — phase "Engine fidelity + evidence contract" (#818, 2026-07-12)

**Code-verified via the phase's own task worktree** (this servitor's own cwd was a stale,
unrelated checkout — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] —
so the referent was confirmed at `<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`,
the true landed task worktree, reached via `.git/worktrees/<task-id>/gitdir`):

- `EVIDENCE_RESULT.integratedTipGate`'s schema now reads
  `{ type: 'object', properties: { gate_output: { type: 'string' }, tip_sha: { type: 'string' }, gate_log_path: { type: 'string' } } }`
  — the `gate_log_path` field this lesson said was missing is now present.
- The authoritative-seat prompt now derives `const authArtifactLine = integratedTip.gate_log_path
  || '(no gate-log artifact path recorded)'` (mirroring the per-task `artifactLine` idiom this
  lesson named as the pattern to follow), threaded the same fail-open way: absent path ⇒ SOFT
  cannot-confirm, never an error.

The fix shape section above is exactly what shipped. This lesson stays as a record of the root
cause and the "fourth distinct call site needs its own row" pattern for the next genuinely-new
gate-audit directive.
