---
name: doc-promises-ledger-field-the-schema-contract-never-defines
description: "RESOLVED (adjudications key defined in schemas.md ledger contract, 2026-07): a doc paragraph promising 're-thread from the run-ledger record' named a field the ledger.json contract never defined"
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

**What happened (code-verified — audit-adjudication-threading/1.3, `disposition: follow-up`):**
`skills/war/references/schemas.md`'s args-contract paragraph for `adjudications` promised the set
is "re-threaded in full — from the run-ledger record", but the same file's `## ledger.json`
contract block (~160 lines away, the contract's only documented home) enumerated no `adjudications`
key at any level — a Lead following the runbook literally had no documented place to write the
rows, so the recovery re-thread was unmechanizable. The diff was 100% plan-faithful: promise
paragraph and contract block were owned by different task slices, and no task's `Files:` scope
covered the ledger block.

**The rule:** when a doc sentence promises data will live in or be read from an existing structured
contract (a ledger, a manifest, a schema block) elsewhere in the same file or repo, cross-check
that contract's own field enumeration for the referenced key before treating the promise as
mechanizable — the gap is invisible to both a same-paragraph proofread and a plan-faithfulness
check, even when promise and contract sit far apart in the same file.

**RESOLVED (2026-07):** schemas.md's `## ledger.json` block now defines the top-level
`adjudications` key and the args-contract paragraph cites it ("the `ledger.json` top-level
`adjudications` key above") — the suggested fix landed as written.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — a sibling "doc
promises an artifact the mechanism doesn't actually thread" gap. [[standing-instruction-vs-dispatched-prompt-coverage-split]]
(repo) — the closest existing doctrine on doc-surface completeness checks, though scoped to a
different pairing (standing `.md` vs dispatched prompt, not doc-promise vs schema-contract).

> archived 2026-07-27: resolved — moved to archive
