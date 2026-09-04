---
name: adr-0042-eviction-destination-creation-does-not-auto-register-in-qualified-headers
description: "An ADR 0042 eviction task that creates a new skills/war/references/ destination file does not auto-join reference-link-integrity.test.mjs's hand-maintained QUALIFIED_HEADERS list — registration is a separate edit, easy to skip, and recurred across two independent eviction destinations in one plan"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: adr-0042-eviction-destination-creation-does-not-auto-register-in-qualified-headers
  phase: 2026-09-03-in-band-absorb-default/phase-3 task 3.1 + polish
  keywords: 
    - QUALIFIED_HEADERS
    - ADR 0042
    - eviction destination
    - reference-link-integrity.test.mjs
    - header truth
    - at eviction time
    - headerRegion
    - byte-identity qualifier
    - gate-audit-checklist.md
    - gate-failure-classification.md
    - hand-maintained registry
    - registration gap
  tags: 
    - war
    - doc-guard
    - drift-guard
    - reference-link-integrity
    - eviction
  created: 2026-09-04
  originSessionId: e3ef9388-1e5c-44a1-a4d9-ddfc400eabeb
  modified: 2026-09-04T11:28:42.519Z
---

# A new ADR 0042 eviction destination does not auto-join QUALIFIED_HEADERS

**Code-verified** at landed tip `84bd08f414dd7f397260d8ca3cd262f89c75a0fe` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default` (plan slug
`2026-09-03-in-band-absorb-default`), read via the `_refinery45` worktree whose `gitdir` physical
path (`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`)
names this plan's slug and whose `HEAD` byte-equals the landed tip.

## What happened

`skills/war/assets/reference-link-integrity.test.mjs` maintains `QUALIFIED_HEADERS`, a hand-written
array of `skills/war/references/` files whose header must carry an "at eviction time"
byte-identity qualifier. The array's own header comment claims it is a UNION that "only ever grows:
a new eviction destination joins it on creation." In this phase, Task 3.1 created
`skills/war/references/gate-audit-checklist.md` (a fresh ADR 0042 eviction of the
`execution-evidence` gate-audit checklist body out of `agents/war-auditor.md`) but did **not** add
it to `QUALIFIED_HEADERS` — confirmed by direct read at Task 3.1's own commit and independently
raised as a Nit finding by three separate auditor seats across two audit rounds
(`correctness`/`0ff8470`, `correctness`/`613a533`). The same phase also carried a pre-existing,
already-landed sibling gap: `gate-failure-classification.md` (a Phase 2, D12 eviction) was likewise
never registered.

Neither gap was caught by any red test at the time — `QUALIFIED_HEADERS` is a hand list, not a
directory scan, so a missing entry fails open (the check simply never runs over that file) rather
than throwing. Both gaps were only closed in the phase-close polish pass (`p3-polish`), one task
later, as a single combined fix.

## The durable rule

Treat `QUALIFIED_HEADERS` registration as a **required, separate step** of every ADR 0042 eviction
task in this repo — not an automatic consequence of creating the destination file or of the file's
own header prose claiming byte-identity. Before closing an eviction task:

1. Grep the new destination's filename in
   `skills/war/assets/reference-link-integrity.test.mjs`'s `QUALIFIED_HEADERS` array.
2. If absent, add it, with a comment naming the owning task/ADR.
3. Confirm the destination file has a `## ` heading above the evicted section (`headerRegion()`
   fails closed on a heading-less document — see
   [[adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first]]) and
   that its header sentence carries the exact "at eviction time" qualifier the arm requires.

A plan's own End states rarely mandate this registration explicitly (it wasn't named in this
phase's End state 7), so it is easy to treat as out of scope — but leaving it undone means the
byte-identity guard silently never runs over the new file until some later task happens to notice
and fix it, which recurred here across two separate destinations in the same plan.

**Related failure mode, same root gap:** when the registration finally does land, the comment
explaining *why* a file joined can itself be wrong or internally incoherent (e.g. claiming a file
"joined on creation" when it in fact joined at a later polish touch) — see
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], the
`2026-09-03-in-band-absorb-default`/phase-3 p3-polish recurrence, for the case where that
comment-wording defect shipped unfixed because the fix landed in the phase's terminal polish round.

## Locate-cue (verify still present before acting)

`skills/war/assets/reference-link-integrity.test.mjs`, the `QUALIFIED_HEADERS` array (~line 315)
and its header comment (~line 309); `skills/war/references/gate-audit-checklist.md` and
`gate-failure-classification.md`, both now registered members as of this landed tip.

## Related

[[adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first]] — the
sibling `headerRegion()` mechanics gap for a file with no `## ` heading at all.
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the registration
comment's own wording defect, which shipped unfixed at this same landed tip.
