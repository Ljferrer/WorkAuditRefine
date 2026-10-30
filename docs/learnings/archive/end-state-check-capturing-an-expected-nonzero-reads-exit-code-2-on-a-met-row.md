---
name: end-state-check-capturing-an-expected-nonzero-reads-exit-code-2-on-a-met-row
description: "A check that captures an expected non-zero status reads exit_code 2 though the row is met"
metadata:
  type: project
  keywords: [end-state check, exit_code, cmd[i] exit, compound check, maximum rule, false unmet, expected non-zero, rc capture, gate-audit, NEWLINE_DENIED]
  provenance: code-verified
  slug: end-state-check-capturing-an-expected-nonzero-reads-exit-code-2-on-a-met-row
  phase: 2026-10-20-rea-artifact-evidence/phase-1
  tags: [war, plan-authoring, gate-audit, endstate-check]
  created: 2026-10-20
---

# An End-state check that captures an expected non-zero status makes the artifact read red on a met row

**What happened.** End state 16 of plan 2026-10-20-rea-artifact-evidence starts its check with `out=$(printf ... | bash hooks/validate-auditor-git.sh 2>&1); rc=$?; test "$rc" -eq 2 && ...`. The guard denies with exit 2. So the first statement exits 2 by design.

**Why the artifact reads red.** The engine records one `cmd[i] exit: <n>` line per `;` or newline statement. It sets the final `exit_code` to the maximum of them (#1782, operator ruling 2026-09-07). The End state 16 artifact read `cmd[0] exit: 2`, `cmd[1] exit: 0`, `NEWLINE_DENIED`, `cmd[2] exit: 0`, `exit_code: 2`. The condition held.

**Cost.** Every gate-audit seat that read that artifact had to explain it. Five filed a Nit note (tasks 1.1, 1.2, 1.4, 1.7 and the integrated-tip seat). Two more explained it inside the attestation. A seat that read only the last `exit_code:` line would attest unmet. An unmet row holds the land.

**Plan-author rule.** Write the capture so the statement exits 0. This form: `rc=0; out=$(...) || rc=$?; test "$rc" -eq 2 && ...`. An `||` list counts as one statement under the ruling, and its status is 0 when the `||` branch runs. Confirmed in bash (status 0, rc 2), but not run through the engine.

**Seat reading rule.** Read the per-statement lines. Judge the statement that carries the assertion, not the maximum.

**Locate-cue (verify still present before acting).**
- `skills/war/assets/workflow-template.js`, the `ENDSTATE_CHECK_RESULT` comment ("MAXIMUM of them (#1782)").
- `skills/war/assets/workflow-template.engine-1.test.mjs`, the test titled `endstate: compound check exit aggregation`.
- `docs/plans/2026-10-20-rea-artifact-evidence.md`, End state 16 (grep `NEWLINE_DENIED`).

Found at landed tip 4e33b6db, read in the run-scoped refinery worktree whose HEAD equals the tip.

**Related.** [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]] covers the same aggregation rule from the operator-enumeration side.

> archived 2026-10-30: resolved — moved to archive
