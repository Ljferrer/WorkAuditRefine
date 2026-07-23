---
name: doc-promises-ledger-field-the-schema-contract-never-defines
description: "A doc paragraph promising 're-thread from the run-ledger record' can name a field the ledger.json contract never defines"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: doc-promises-ledger-field-the-schema-contract-never-defines
  phase: audit-adjudication-threading/1.3
  created: 2026-07-22
  tags: 
    - schemas
    - ledger.json
    - doc-drift
    - contract-completeness
    - SKILL.md
  keywords: 
    - ledger.json missing field
    - doc promise unmechanizable
    - run-ledger record
    - args.adjudications
    - schema contract gap
    - re-threaded from the ledger record
    - follow-up disposition
    - recovery relaunch
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T00:45:35.019Z
---

# A doc paragraph can promise a ledger field the schema contract never defines

**What happened (code-verified — `skills/war/references/schemas.md`, audit-adjudication-threading
phase 1 task 1.3, `disposition: follow-up`):** the args-contract paragraph for `adjudications`
states the accumulated set is "**re-threaded in full** — from the run-ledger record, alongside
`args.recovery`" (schemas.md, the `Optional adjudications` paragraph), and `SKILL.md`'s
held-partial-phase runbook (landed the same phase, task 1.2) instructs the Lead to "record each row
in the run ledger" (step 1) and re-thread "from the ledger record" (step 4). But the same
schemas.md file's `## ledger.json — run state at .claude/teams/<run-id>/` block — the ledger
contract's **only** documented home — enumerates exactly `{ run_id, plan_file, working_branch,
landing_branch, gate, created_at, phases[], pr_url? }`. No `adjudications` key exists at any level.
A Lead following the runbook literally has no documented place to *write* the rows in the first
place, so the recovery re-thread — the incident this phase exists to close — is unmechanizable from
the contract as written.

**Why it slipped through:** the paragraph making the promise and the block defining the contract
sit ~160 lines apart in the *same file*, but each was edited by a different task in the phase
(1.3 wrote the promise paragraph per its plan slice; no task in this phase touched the ledger
block itself, since it wasn't in any task's `Files:`/plan-slice scope). A same-file self-consistency
check that only greps for the paragraph's own literal wording would miss this — it requires cross-
referencing the promise against a *structurally distant* contract block in the same doc.

**Not a worker deviation:** the promised sentence is exactly what the plan slice specified (Task 1.3
plan slice — schemas.md, spec D8 "Ledger + issue trail, no new artifact"); the gap is inherited from
the plan/spec not budgeting a task to extend the ledger schema itself, not a fidelity defect in the
diff that landed it.

**The rule:** when a plan/task adds a doc sentence that promises data will live in or be read from an
existing structured contract (a ledger, a manifest, a schema block) elsewhere in the *same* file or
repo, cross-check that contract's own field enumeration for the referenced key before treating the
promise as mechanizable — a doc-internal cross-reference gap is invisible to both a same-paragraph
proofread and a plan-faithfulness check (the diff can be 100% plan-faithful and still leave the
promise unactionable).

**Fix (suggested, not yet applied — follow-up, out of Task 1.3's slice):** add the documented key to
the ledger.json contract block, e.g. a top-level `adjudications: ["<preformatted row>"]` — the
run-long accumulated set (spec D8) the recovery relaunch re-threads from — and cite it from the
args-contract paragraph.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — a sibling "doc
promises an artifact the mechanism doesn't actually thread" gap. [[standing-instruction-vs-dispatched-prompt-coverage-split]]
(repo) — the closest existing doctrine on doc-surface completeness checks, though scoped to a
different pairing (standing `.md` vs dispatched prompt, not doc-promise vs schema-contract).
