---
name: uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand
description: "'Shell out to X' idiom miscasts an export-only function as a CLI verb"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - shell out
    - export-only
    - CLI subcommand
    - aggregateBackstops
    - campaign-ledger
    - SKILL.md
    - doc-impl mismatch
    - severity split
    - Major vs Minor
  provenance: code-verified
  slug: uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand
  phase: container-packaging/phase-2-t9
  tags: 
    - docs
    - prose-drift
    - cli-vs-export
    - audit-escalation
    - severity-adjudication
    - war-campaign
  created: 2026-07-06
  originSessionId: 71cb0ac0-39bd-4083-9249-7ea9fc81b408
---

# A uniform "shell out to X" doc idiom mislabeled an export-only function as a CLI subcommand

## What happened

`skills/war-campaign/SKILL.md`'s "Campaign wrap-up — Unexecuted backstops" section described
the campaign report as computed by *shelling out to* `campaign-ledger.mjs aggregateBackstops` —
matching every other lifecycle step in the same file, which really do shell out to CLI
subcommands (`init`, `sweep`, `next`, `record`, ...). But `aggregateBackstops(campaignDir)` in
`skills/war-campaign/assets/campaign-ledger.mjs` is a plain `export function`, never wired to
the file's CLI dispatch table — there is no `aggregateBackstops` subcommand to shell out to. The
Lead's wrap-up render actually calls it in-process (imports the module, calls the function
directly).

T9's audit caught the mismatch and escalated; the Lead adjudicated it a **real but Minor**
finding (doc-only, no behavior bug — the report still renders correctly because the Lead does
call the function, just not via a shell-out) and fixed it in place by rewording to: "The Lead's
wrap-up render calls the module's `aggregateBackstops(campaignDir)` export (it is a module
export, not a CLI subcommand)."

## The pattern — why it's a trap, not just a typo

When every *other* step in a doc file uses a consistent idiom ("shell out to `X.mjs <verb>`"),
that idiom becomes the default template a writer reaches for when documenting one more call into
the same module — even when the new call is architecturally different (in-process import vs.
subprocess dispatch). The uniform phrasing primes both the author and the reviewer to skim past
the mismatch: it *reads* consistent with its neighbors, so nothing about the sentence looks
wrong in isolation. Only checking the referent (does this function appear in the file's CLI
dispatch/subcommand table?) surfaces the drift.

## How to apply

When a doc describes N calls into the same backing module using one repeated verb-phrase idiom
("shell out to", "invoke the CLI", "runs `X <subcommand>`"), verify **each** referenced function
individually against the module's actual dispatch mechanism (grep for a `case '<verb>':` /
subcommand table entry, not just the function's existence) before trusting the idiom carried
across correctly. An export that exists is not evidence it's dispatched the same way as its
siblings.

## Code-verified referent

Confirmed in the container-packaging phase-2 worktree: `aggregateBackstops` is declared as
`export function aggregateBackstops(campaignDir)` at
`skills/war-campaign/assets/campaign-ledger.mjs:270` with no corresponding CLI subcommand case;
the corrected `SKILL.md` wording ("it is a module export, not a CLI subcommand") lands at the
"Campaign wrap-up — Unexecuted backstops" section. Verify still present before acting — this was
observed pre-merge to master; re-grep `skills/war-campaign/SKILL.md` and
`skills/war-campaign/assets/campaign-ledger.mjs` for `aggregateBackstops` at the current tip.

## Relation

- [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]] —
  same family (prose asserts a code fact the code doesn't provide); that instance was a tour
  narrative claiming a specific array-divergence, this one is a lifecycle-doc idiom claiming a
  dispatch mechanism.
- [[wire-key-rename-misses-prose-placeholders]] — same family, different vector: a rename leaves
  stale placeholders in prose rather than an idiom over-generalizing to a new referent.
- [[held-escalation-lead-manual-completion]] — same phase mechanics (audit escalation →
  Lead adjudicates real-but-Minor → fixes in place rather than re-running); here the
  adjudication turned on **finding severity** (doc-only Minor, not a Major behavior bug),
  distinguishing it from that file's Major-escalation manual-completion path.
