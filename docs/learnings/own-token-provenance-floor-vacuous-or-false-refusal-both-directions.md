---
name: own-token-provenance-floor-vacuous-or-false-refusal-both-directions
description: "workflow-template.js's #1413 own-token args-provenance floor (refuses a launch at entry, held:workflow-error, zero spawns, when intent/backstops/adjudications carry none of the run's plan-slug tokens) is mis-calibrated in both directions: JSON.stringify(row) exposes schema KEY names (\"check\",\"why\",\"source\":\"plan\") a foreign row can vacuously match, while a legitimate generic backstop/adjudication row or a foreign-plan CITATION can carry zero real slug tokens and be falsely refused — both landed, adjudicated, unfixed this phase (follow-up)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: own-token-provenance-floor-vacuous-or-false-refusal-both-directions
  phase: 2026-08-06-handoff-schemas-contract/2.1
  keywords: 
    - own-token floor
    - args provenance
    - held:workflow-error
    - backstops
    - adjudications
    - intent
    - JSON.stringify vacuity
    - false refusal
    - foreign docs/plans identifier
    - refuse not warn
    - workflow-template.js entry validation
  tags: 
    - war
    - engine
    - entry-validation
    - provenance
    - workflow-template
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T15:23:11.320Z
---

# The #1413 own-token args-provenance floor is mis-calibrated in both directions

**Code-verified via gate-audit evidence, pinned `auditSha`/`gateHeadSha`
`71ddc088fb558add6d92aab1ec4ec773b9881cd8` on `dev/2026-08-06-handoff-schemas-contract` phase 2
(`gateEvidence: true`), corroborated by the task-2.1 worker audit's own in-diff evidence (fixtures
had to be token-doped to keep passing).** `skills/war/assets/workflow-template.js`'s entry-validation
block (the "Args provenance floor (#1413)" the plan mandated) refuses a launch **before any agent
spawns** — `held:workflow-error`, terminal, never retried per `schemas.md` — when `intent` /
`backstops` / `adjudications` carry none of the run's own plan-slug tokens (a substring match of
each token against `JSON.stringify(row)` for object rows). Two independent failure classes were
recorded, both plan-faithful (the plan mandates refuse-not-warn) and both pre-adjudicated, so
neither blocked — but both are load-bearing operational-risk facts for anyone touching this floor
later:

**1) Vacuous pass (false accept).** `JSON.stringify(backstops)` / `JSON.stringify(adjudications)`
serializes schema KEY names and fixed VALUES that are not run provenance at all — `"check"`,
`"why"`, `"runner"`, `"source"`, and for every plan-declared entry the literal `"source":"plan"`.
A plan slug containing any of those words (this repo already has plausible ones — slugs built from
words like `plan`, `check`, `source`) yields an own token that a **foreign** backstops/adjudications
array satisfies with zero real overlap, silently neutering the half of #1413 the plan itself calls
"the worse half" (backstops/adjudications have no seat-side recovery path once inside a run).

**2) False refusal (false reject), demonstrated in-diff.** Two shapes reliably carry zero slug
tokens by construction: (a) a short, generic backstop/adjudication row — the landed diff itself had
to inject a synthetic token (e.g. `(wtprov)`) into **five** pre-existing, realistic fixtures (an
intent, a sweep intent, two backstop `why` strings, two adjudication rows — including one whose
original text was the entirely plausible `"no daemon at setup"` / `"daemon unavailable at setup"`)
purely to survive the floor — direct evidence ordinary honest args fail it; (b) an `intent` that
legitimately **cites** a predecessor plan path (`docs/plans/<other-slug>.md`), a routine shape in a
stacked campaign, which the floor's foreign-`docs/plans`-identifier arm refuses outright. Both land
in `held:workflow-error` — per `schemas.md`, "Terminal — HARD-halts regardless of `--afk`; never
retried" — so the cost of a false positive is a dead launch needing a human.

**Why neither is a defect to fix reflexively:** `/red-team` already recognised and carved out the
analogous hazard for `intent` alone (an intent-less run stays legal); the adjudicated plan scope
explicitly limits the own-token floor's non-vacuity concern and the false-refusal concern to
`backstops`/`adjudications` being non-null, not to a semantic-correctness guarantee. Narrowing the
floor is a design decision, not a mechanical fix — both classes were filed `disposition: follow-up`
(not `absorb`) and were still live, unfixed, at phase-2 land.

**Pattern to remember when next touching entry-validation floors that substring-match a slug token
against a serialized object:** `JSON.stringify` exposes the schema's own vocabulary as false
positive surface, and a token-matching floor over short/generic strings has a structural false-
negative rate visible only by trying to keep existing realistic fixtures green. Candidate fix
directions recorded by the auditor (not applied this phase): derive the probe text from row
VALUES only (`Object.values(row)` joined) rather than the serialized object, to close the vacuity
side; and/or scope the own-token arm to `intent` alone (where the #1413 incident was actually
observed and the signal-to-noise is high) to reduce the false-refusal side, leaving the precise
foreign-`docs/plans`-identifier check on all three args.

**Related:** [[dispatched-seat-intent-can-leak-from-a-different-concurrent-plan]] (the incident
class #1413 exists to catch); [[reproduce-a-gate-blocker-before-patching-or-escalating]] (same
discipline of measuring before changing a floor).
