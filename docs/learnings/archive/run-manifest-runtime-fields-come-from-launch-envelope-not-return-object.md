---
name: run-manifest-runtime-fields-come-from-launch-envelope-not-return-object
description: "workflowRunId/transcriptDir for the /war run manifest must be scraped from the Workflow LAUNCH envelope text (Run ID / Transcript dir lines), never read off the Workflow return object"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: run-manifest-runtime-fields-come-from-launch-envelope-not-return-object
  phase: manifest-and-skill/t1 (gate-audit T1.1, audit_sha 2c1b4e510f752bb10c0cd43302601079774dca7e)
  created: 2026-07-12
  keywords:
    - run manifest
    - workflowRunId
    - transcriptDir
    - Workflow launch envelope
    - Run ID line
    - Transcript dir line
    - telemetry capture
    - war-review
    - .claude/war/runs
  tags:
    - telemetry
    - workflow-tool
    - plan-code-mismatch-avoided
  related:
    []
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Run-manifest runtime fields must be scraped from the Workflow launch envelope, not the return object

**Pattern (agent-unverified — referent not re-Grepped this session; see absence-note below):**
per the phase's gate-audit rationale for T1.1 (`skills/war/SKILL.md` § Run manifest telemetry),
the per-phase `workflowRunId` and `transcriptDir` fields written into
`.claude/war/runs/<runId>.json` are captured from the **Workflow tool's LAUNCH envelope text**
(the "Run ID" / "Transcript dir" lines it prints at dispatch time) — **not** from the Workflow's
returned JS object, which the audit rationale states explicitly carries neither field. This was
called out as "per the red-team correction," i.e. an earlier draft of the plan/skill assumed the
return object carried this metadata and a red-team pass caught the gap before land.

**Why durable:** any future Lead-prose change that adds a new per-phase telemetry field sourced
from the `Workflow` tool should default-assume the return object is the *thin* contract
(`{ landed, escalated, minorsFiled, aced, notes, landResult, servitorResult, auditLog,
landDecision, handoff? }` per `skills/war/SKILL.md`'s documented return shape) and that any
run/transcript identity metadata needs a **separate scrape of the dispatch-time console/launch
text**, not an assumption that the tool return object grows to carry it.

**Absence-note (D3, worktree-lag caveat):** this servitor's session worktree
(`.claude/worktrees/sad-sutherland-141916` on `claude/war-campaign-1ecdd0`) is a documented
session-stable stale checkout for this exact session — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (now four consecutive phases of
100% referent-absence). `skills/war-review/` does not even exist in this checkout, and
`skills/war/SKILL.md` here has no "Run manifest" / "LAUNCH envelope" text at all. This fact is
therefore recorded from the **audit log's gate-audit rationale** (verdict `gate-audit:approve`,
`gateEvidence:true`, Nit/note, informational-confirmation only) rather than a direct Read/Grep —
verify still present before treating as `code-verified`: look for a "## Run manifest (telemetry)"
section in `skills/war/SKILL.md` naming a Workflow-launch "Run ID" / "Transcript dir" capture, on
a checkout actually fast-forwarded past `dev/2026-07-11-war-review-run-telemetry`.

> archived 2026-07-12: resolved — moved to archive
