---
name: guard-scan-scope-narrower-than-its-own-endstate-check-literal
description: "A standing regression guard added to satisfy a plan End-state can legitimately scan a NARROWER surface (e.g. a file's header region only) than that same End-state's own one-shot check literal (e.g. a whole-file grep) — the guard is plan-faithful (it matches the slice's literal wording) but a reintroduction relocated outside its scan scope passes the guard while the End-state's own check would still catch it; verify a guard's actual scan scope against its check literal's scope, not just against the slice's prose"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: guard-scan-scope-narrower-than-its-own-endstate-check-literal
  phase: "2026-08-06-references-pointer-integrity/phase-1 (tasks 1.1, gate-audit)"
  keywords: 
    - guard scan scope
    - header region only
    - whole-file grep
    - End-state check literal
    - suite regex of record
    - QUALIFIED_HEADERS
    - reference-link-integrity.test.mjs
    - RETIRED_NO_PATH_FORM_CLAIM
    - plan-faithful residual
    - relocated reintroduction blind spot
  tags: 
    - war
    - guard-architecture
    - test-coverage
    - plan-faithfulness
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T16:32:59.330Z
---

# A committed guard's scan scope can be narrower than the End-state check literal it backstops

**Found (code-verified via gate-audit fallback — landed tip
`d712424133e66952e780acba6dbd45c737a6afd5` on `dev/2026-08-06-references-pointer-integrity`; my
own checkout had no live worktree matching this plan's slug, so this is grounded on the pinned
`auditSha 44089b3f9dc70a14a7ad8a3e730c6c297026363d` gate-audit verdict, `gateEvidence: true`, whose
own ES9+ES13 attestation explicitly records the same residual):**
`skills/war/assets/reference-link-integrity.test.mjs`'s third retirement pattern
(`RETIRED_NO_PATH_FORM_CLAIM = /no\s+path\s+form\s+resolves/i`) is evaluated only inside the
`QUALIFIED_HEADERS` loop, over each file's **header region** (the text before its first `## `
heading) — five files. The plan's own End state 13 that this guard exists to backstop is checked
by a **whole-file** one-shot command:
`tr '\n' ' ' < skills/war/references/worker-servitor-edges.md | grep -io 'no path form *resolves' | wc -l`.

Both agree today (the retired claim currently lives in that file's header region), and the
implementation is **plan-faithful** — the task slice's own wording says the pattern is "scanned
over the same references/ headers". But the two surfaces do not have the same reach: a
reintroduction of the retired claim relocated into the **body** of a scanned file, or into any
`references/` file **outside** `QUALIFIED_HEADERS`, would pass the standing suite silently while
the End-state's own whole-file grep would still catch it (were it ever re-run).

## The durable rule

When a plan End-state's own `check:` literal states a scope (whole-file, whole-repo, a named
directory) and the standing guard added to make that check durable is implemented over a
**narrower** scope (a header region, a fixed enumerated file list, a specific directory subset),
the two are not interchangeable even when a comment calls the guard "the suite regex of record."
The guard being plan-faithful (it matches the task slice's literal wording) does not mean it is
**scope-equivalent** to the invariant it backstops. Before trusting a standing guard as the durable
substitute for a one-shot End-state check:
- Read the End-state's own `check:` command's scope, not just its regex/string literal.
- Compare it to the guard's actual scan boundary (which files, which region of each file).
- If the guard is narrower, record the gap as a residual (not a defect — the guard may be
  correctly scoped per the plan's own latitude) so a later author doesn't assume the standing
  suite alone proves the invariant holds repo-wide, forever.

**Contrast case in the same file:** the sibling pattern `RETIRED_REBASING_CAVEAT` scans the
**whole text** of every file in the `SCANNED` set — proof that whole-file scanning was available
and used elsewhere in the same suite, so the header-only scope on this pattern was a deliberate
narrower choice, not a technical necessity.

**Locate-cue (verify still present before acting):**
`skills/war/assets/reference-link-integrity.test.mjs`, the `QUALIFIED_HEADERS` loop where
`RETIRED_NO_PATH_FORM_CLAIM.test(header)` is evaluated, contrasted with `RETIRED_REBASING_CAVEAT`'s
whole-`SCANNED`-text loop in the same file.

Related: [[column-0-bound-regex-does-not-terminate-inside-an-indented-fenced-bullet-block]] (a
different guard-boundary miscalibration — regex termination, not scan-region scope).
