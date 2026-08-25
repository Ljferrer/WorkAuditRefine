---
name: war-strategy
description: Two modes. Bare invoke runs the WAR plan-authoring interview itself, per the in-repo doctrine references/plan-interview.md — one interview to completion, producing one merged plan (Part 1 decision record + Part 2 decomposed phases in a single artifact); the Grill Me family (grill-with-docs, grilling, domain-modeling) is a recommended front door, never required. Invoked with an existing draft (spec, plan, roadmap, design doc) it reviews the artifact for war-shape gaps and converts it into the merged shape — war-strategy converts; /red-team validates and never converts. Use when the user is about to author a plan for WAR, asks how a war-shaped plan should be structured, or brings an existing draft to review or convert.
---

# /war-strategy — the authoring interview & converter

Two modes, keyed on whether the invocation brings an artifact:

- **Bare invoke — run the interview**: run the plan-authoring interview yourself per
  [references/plan-interview.md](references/plan-interview.md) (§4) — one interview to completion,
  one merged plan.
- **With-artifact invoke** (the user brings a draft spec/plan/roadmap/design doc) — **review & convert**:
  run the war-shape gap review and convert the artifact into the merged shape (§4).

Self-sufficient entry: WAR owns its interview doctrine in-repo — bare `/war-strategy` proceeds with no
other skill installed. The Grill Me family (`grill-with-docs`, `grilling`, `domain-modeling`) is a
recommended front door (§1), bound to the same merged deliverable via the HANDOFF DIRECTIVE (§4) when
present.

## 1. Recommended front door (Grill Me)

The Grill Me family is a recommended front door, never a requirement: the interview doctrine lives in-repo
at `references/plan-interview.md`, so the bare invoke runs it directly (§4). To see whether the family is
installed, run:

```sh
find -L ~/.claude/skills ~/.claude/plugins .claude/skills -maxdepth 6 -type d \
  \( -name grill-with-docs -o -name domain-modeling \) 2>/dev/null
```

`-L` because installed skills are routinely symlinks; `-maxdepth 6` because plugin-cache skills live at
`plugins/cache/<mkt>/<plugin>/<ver>/skills/<name>` (depth 6); `2>/dev/null` because missing roots (most repos
have no `.claude/skills`) error noisily. Judge emptiness on **stdout only — never the exit code**.

Non-empty stdout → offer the Grill Me route: the operator may prefer its interviewing voice, and the HANDOFF
DIRECTIVE (§4) binds it to the same merged deliverable. Empty stdout → no gap and no warning: run the
interview yourself per §4. (Installing the family stays a pro-tip — the README's
[Grill Me install](https://github.com/mattpocock/skills/tree/main#quickstart-30-second-setup) link covers
`grill-with-docs`, `grilling`, and `domain-modeling`.)

## 2. The three templates

The **merged plan** is the pipeline's one execution artifact — Part 1 the ratified decision record, Part 2
the decomposed phases, one file. The **spec** is an input shape only (D17): `/survey-corps`' AFK synthesis
intermediate and externally-brought drafts arrive in it, and §4 converts them into the merged plan — the
pipeline never executes a spec. The **roadmap** scales the merged plan to N-plan campaigns.

### Merged plan template

One interview ([references/plan-interview.md](references/plan-interview.md)) fills every slot. Part 1 /
Part 2 is prose framing, never heading nesting — flat H2s throughout, and Part 2 carries today's exact
extraction headings unchanged (`/war` decompose, intent extraction, backstop surfacing, and the campaign
ledger's `extractFiles` all run unmodified against it).

```
# <Title — the change in one line>
## Context — the gap / problem            ← Part 1 · every claim of fact tagged (evidence tags, D4)
## Pivotal constraints
## Resolved design tree                   ← table: decision → resolution → source · pin ids (PIN-<n>) · landing class
## Assumptions ledger                     ← required; assumption · basis · blast radius · check   (or exactly: None)
## Non-goals / deferred
## New domain terms · Recommended ADRs
## Commander's Intent              ← operator-authored; intent ceiling, plan floor
  - Purpose: <why — the operator's goal in one breath>
  - Method: <how — the approach and its judgment guardrails>
  - Mechanism latitude: <optional-but-recommended — enumerate which mechanisms named in Method are
    implementer's choice, closing with: "substituting any of these mechanisms while the End states
    and binding guardrails hold is not a plan deviation and warrants no issue">
  - Binding guardrails: <optional-but-recommended — the short list of what genuinely must not
    change: contracts, repo boundaries, cost/safety invariants — the real floor. The latitude
    clause never waives a check, gate, or backstop (ADR 0017) — End states pin outcomes, never
    mechanisms, and each stays checkable via its D5 tag>
  - End state: <numbered list — each condition individually checkable, each tagged from the
    closed set: check: <command> | gate: <suite> | HARD at audit_sha (observable + judge seat)
    | backstop: row — the unified validation criteria (D18)>
## Build order (for /war)          ← the phase list, in DAG order
## Phase 1 — <name>
### Task 1: <name>
- Files: `<path/one>`, `<path/two>`   ← every path backticked & comma-separated; the campaign ledger's `extractFiles` reads backticked tokens
- Plan slice: <what to implement>
- Done when: <command>   ← required iff requiresTest: true; permitted (not required) on any other task (else: None — <basis>)
- requiresTest: true|false
- requiresPackaging: true|false  ← default true; Lead may set false at decompose to skip the packaging floor
- deps: [<task ids>]             ← wave edge: the worker rebases onto the merged dep (see the rule)
- target repo: <superproject|submodule-path>
### Task 2: <name>  …
## Phase 2 — <name>  …
## Deferred validations (backstops)   ← required; ratify in /red-team; surfaced at every land
  - <check> · why deferred: <reason> · runner: <what executes it, when>   (or exactly: None)
## Notes / conscious deviations   (ratify in /red-team)
## Open decisions                 (resolved by /red-team)
```

**Template law (ratified — the structure test pins each item):**

- **Per-task fields are SEPARATE `- ` bullets** — template law AND an extraction requirement:
  `extractFiles` ingests ONLY the separate-bullet form (the plain-bullet break scopes the `Files:` block to
  its own bullet). A compact one-line rendering bleeds the neighboring fields into the block: Plan-slice
  paths over-widen the footprint; with bare (unbackticked) Files paths it either yields `[]` → the
  fail-loud `unparseable footprint` throw (when no path-shaped backtick sits in the bled-in block), or —
  worse, because nothing throws — any path-shaped backtick in the bled-in prose **silently replaces** the
  footprint (any backtick disables the bare-path fallback).
- **The tail stays TWO separate H2s** — `## Notes / conscious deviations` and `## Open decisions`, never
  collapsed into one heading.
- **Required sections take an explicit `None`** (ADR 0017): `## Assumptions ledger` and
  `## Deferred validations (backstops)` are required; a literal `None` is a valid, complete declaration — a
  missing section is not, and a prose waiver is not.
- **Every End state carries one tag** from the closed set above (D5), and every claim of fact in Part 1
  carries an evidence tag — `(user)` · `(verified: <source> at <base>)` ·
  `[assumed: <default> — if wrong: <consequence>]`; issue-derived facts use `(verified: issue #N (<date>))`
  (D11). Memory/training is never a `(verified:)` source.
- **Done-when law (D5):** `Done when: <command>` is required iff `requiresTest: true`, and permitted (not
  required) on any other task; otherwise `None — <basis>`.
- **Oracle duality (#1628):** a `check:` / `Done when:` command whose exit code can go green vacuously
  (a bare `grep -q`, a `test -f`) proves success by a
  **decisive printed token in addition to exit status**; the advisory lint's
  single-signal-oracle rule flags the bare form.
- **Design-tree pin columns (the ratified-pin ledger):** rows carry the interview's ratified `PIN-<n>`
  ids and a per-pin landing class (pin→class pairs; a single-class cell covers all row pins) — token
  grammar digits-only and right-delimited (`PIN-1` never matches inside `PIN-13`); amendment pins mint
  fresh numbers, letter suffixes are illegal. The
  landing-class column is floored; where the id sits within a row is latitude. The class→section map,
  the gate-1 pair duty, and the `WAIVE-<n>` channel live in the pin-ledger law
  (`references/plan-interview.md`).
- **Evidence consumed block:** a plan authored under the interview carries an **Evidence consumed**
  block — one row per linked evidence artifact, read or unread-with-reason — with placement latitude
  anywhere in Part 1 and **never a new required H2** (the extraction surfaces stay untouched).

**Backstop heading:** the operator-ratified form is `## Deferred validations (backstops)`. A plan authored
by `/war-machine --afk` has no operator to ratify, so its drafter uses the AI-declared variant
`## Deferred validations (backstops — AI-declared)` (ADR 0014 provenance rule) — the marker survives
extraction and every land-time surfacing renders it, never as operator-ratified.

### Example A — operator-form (merged plan)

Both examples are complete merged plans; every `/war` extraction surface (intent, phases, tasks, `Files:`,
backstops) finds its target in each. This one carries the operator-ratified headings.

```
# Widget cache — invalidate on rename

## Context — the gap / problem

Renaming a widget leaves its cache row keyed by the old slug (verified: `src/cache.js`
`cacheKey()` at `abc1234`); users see stale titles until TTL expiry (user).

## Pivotal constraints

Cache schema untouched · the TTL default stays 300s.

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Invalidation point | on the rename write path, not on read | (user) · PIN-1 | end-state |
| D2 | Key shape | keep slug keys; drop-and-refill on rename | [assumed: cheapest — if wrong: dual-key window] · PIN-2 | slice |

**Evidence consumed**

- `src/cache.js` `cacheKey()` at `abc1234` — read

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | every rename passes through `renameWidget()` | grep at `abc1234` | a missed invalidation path | End state 2's test |

## Non-goals / deferred

Cross-region cache fan-out.

## New domain terms · Recommended ADRs

None.

## Commander's Intent

- **Purpose:** a renamed widget is never served under its old title.
- **Method:** invalidate at the rename write path; test the miss; no schema change.
- **Mechanism latitude:** the drop-call's placement inside the transaction and the miss-test's
  fixture shape are implementer's choice; substituting any of these mechanisms while the End
  states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** cache schema untouched · the TTL default stays 300s.
- **End state:**
  1. `renameWidget()` drops the old-slug row in the same transaction ·
     check: `node --test src/cache.test.mjs`.
  2. A rename followed by a read misses the cache exactly once ·
     check: `node --test src/cache.test.mjs`.

## Build order (for /war)

Phase 1 (fix + test).

## Phase 1 — Invalidate on rename

### Task 1: Drop the old-slug row
- Files: `src/cache.js`, `src/cache.test.mjs`
- Plan slice: call `dropKey(oldSlug)` inside `renameWidget()`'s transaction; add the
  rename-then-read miss test.
- Done when: `node --test src/cache.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

None.

## Notes / conscious deviations

None.

## Open decisions

None.
```

### Example B — AFK-form (merged plan)

The same shape emitted by `/war-machine --afk` conversion: the ADR 0014 heading pair swaps in
(`## AI-Commander's Intent`, `## Deferred validations (backstops — AI-declared)`) and AI-authored rows
carry per-row `AI-declared` markers (D14). Part 1 is the decision digest citing the source spec.

```
# Import throttling — burst cap

Converted by `/war-machine --afk` from `docs/specs/2026-05-01-import-throttling-design.md`
(Part 1 is its decision digest; ledger rows carried forward or retired with stated reason).

## Context — the gap / problem

Bulk imports saturate the queue (verified: issue #88 (2026-04-30)); interactive traffic
p99 doubles during a bulk window (verified: spec §1 at `def5678`).

## Pivotal constraints

Queue schema untouched · the enqueue seam is the only choke point.

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Mechanism | fixed burst cap of 50 per 60s window | (verified: spec §3 at `def5678`) · PIN-1 | end-state |
| D2 | Overflow behavior | reject with retry-after, never queue-jump | AI-declared [assumed: simplest — if wrong: token bucket] · PIN-2 | slice |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | 50/60s clears the p99 backlog (AI-declared) | spec §8 simulation | cap re-tune | backstop row 1 |

## Non-goals / deferred

Per-tenant caps.

## New domain terms · Recommended ADRs

None.

## AI-Commander's Intent

- **Purpose:** imports never starve interactive traffic. (AI-declared)
- **Method:** cap import bursts at the enqueue seam; keep the queue schema. (AI-declared)
- **Mechanism latitude:** the window-counter data structure and the retry-after arithmetic are
  implementer's choice; substituting any of these mechanisms while the End states and binding
  guardrails hold is not a plan deviation and warrants no issue. (AI-declared)
- **Binding guardrails:** queue schema untouched · the enqueue seam stays the only choke
  point. (AI-declared)
- **End state:**
  1. `enqueueImport()` rejects the 51st import inside a 60s window ·
     check: `node --test src/throttle.test.mjs`. (AI-declared)

## Build order (for /war)

Phase 1 (cap + test).

## Phase 1 — Burst cap

### Task 1: Cap at the enqueue seam
- Files: `src/throttle.js`, `src/throttle.test.mjs`
- Plan slice: add the 50-per-60s window check in `enqueueImport()`; test the 51st rejection
  and the retry-after value.
- Done when: `node --test src/throttle.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- p99 interactive latency stays flat through a bulk window · why deferred: needs field
  data · runner: ops dashboard review at the next release.

## Notes / conscious deviations

None.

## Open decisions

None.
```

### Reference the live artifact, never a stack-fragile literal

> **Mechanics (why):** a plan is drafted against a base that keeps advancing as earlier stacked tasks land
> into the integration tip. Any literal a plan or task prompt pins to that base rots the instant the base
> moves, and the resulting plan↔candidate divergence reads as scope creep to an auditor who re-adjudicates
> it from scratch every pass. Author each field to point at the **live artifact**, not a snapshot of it.

- **`Files:` / locators** — **back-tick every path and comma-separate them** so the campaign ledger's
  `extractFiles` reads them (a bare path silently narrows the ingested footprint); within a file,
  name the enclosing symbol or comment header, not a `:N-M` range; reserve line ranges for flat config
  files and qualify them as approximate against a named base (`approx., measured at base <sha>`).
- **Dated snapshots (D12 staleness rule)** — for the measured literal you cannot avoid (a count, a pairing
  figure, a census): literals are dated snapshots at a stated base; re-measure at the task's rebased base.
- **Gate directives** — reference the self-discovery gate (`resolveGate` in `war-config.mjs`) by name; never
  enumerate `*.test.sh` suites or state a suite count.
- **Mirrored constants** — say "append to the canonical export in `land-decision.mjs`; the drift guard in
  `land-decision.test.mjs` is the arbiter"; never restate the final array literal.
- **Nested keys** — use the dotted path (`metadata.provenance`), never a flat abbreviation.
- **Release tasks** — state "next free patch above the live base", never a hardcoded `v<semver>`.
- **Defined-but-not-yet-emitted** — for any cross-slice mirrored constant/schema/prose-ref, annotate
  "defined-but-not-yet-emitted; produced in Task N" so the auditor cross-links the producing task rather
  than flagging a dangling ref.
- **Grep as floor** — "grep X, handle every match" requires a manual same-scope title/comment survey;
  list stragglers as survey-derived corrections.

The advisory `plan-literal-lint.mjs` (`skills/war-strategy/assets/`) mechanically flags the cheap literals —
line ranges, `*.test.sh` gate lists, suite counts, release-task version literals — at conversion; it is
report-only (exit 0 by default, `--strict` opt-in), never a `/war` gate. `/war-strategy` runs it on every
plan it authors (§4).

### Spec template — the input shape

A spec is a standalone decision record, valid as **input only** (D17): `/survey-corps` synthesizes specs as
its AFK ratification intermediate, and external drafts arrive in this shape; §4 converts either into the
merged plan. Sections unchanged from the historical form, plus the evidence-tag and check-form duties so
AFK-authored specs arrive tagged:

```
# <Title — the change in one line>
## 1. Context — the gap / problem     ← every claim of fact tagged (evidence tags, D4)
## 2. Pivotal constraints
## 3. Resolved design tree        (table: decision → resolution)
## 4. Mechanics                   (per component/role)
## 5. Surface changes             (files touched)
## 6. New domain terms (CONTEXT.md)
## 7. Recommended ADRs
## 8. Open risks / implementation notes
## 9. Non-goals / deferred
## 10. Validation criteria        ← check form: WHEN <trigger> THE <subject> SHALL <result> · check: <command|grep>
```

### Roadmap template

```
# <Title> — <N> plans
| # | Plan | Files owned | Ver | Depends on |
| 1 | [<slug>](../plans/<file>.md) | <file family> | v0.x.y | — |
## Dependency spine (strict landing order)   ← ASCII: 1 → 2 → 5 → …
## Shared-file contention                     ← table: file → plans → risk
```

**Rev 1 note:** the roadmap is authoring input + an on-demand committable snapshot of a campaign — it is
**never** the live queue. The live queue is the campaign ledger (`/war-campaign`'s
`assets/campaign-ledger.mjs`), which is uncommitted and multi-writer-safe via an `inbox/` drop-dir.

## 3. The code-boundary decomposition rule

> **Mechanics (why):** at phase start the refiner cuts every task worktree off one **frozen** integration tip;
> workers run concurrently; the refiner rebases each approved task onto the **advancing** tip and merges
> serially. Two consequences bind how you carve work.

1. **Parallel ⇒ file-disjoint.** Tasks in one phase must touch **disjoint file sets** — two tasks editing the
   same file rebase-conflict at the serial merge. One file / cohesive unit → one task.
2. **Dependency ⇒ wave edge.** If B imports/extends/calls A's new symbols, declare `deps: [A]` — B dispatches
   in a later **wave** of the **same phase**, and its worker's first action is a rebase onto the integration
   tip, so A's merged code is visible. Phase edges remain for what must be **landed** first — cross-repo
   (submodule content before its gitlink bump) and release. Every task still reaches a green gate
   **independently**, off its own dispatch base.
3. **One task = one repo.** A submodule content change + its superproject gitlink-bump are **two tasks in two
   phases** (`repo-per-phase`).
4. **Release = its own trailing phase.** The version bump touches shared slot files and must land last.

Heuristics: grep each task's file set — any overlap → merge the tasks or split across phases; *"add X"* +
*"call X from Y"* = **one phase, two waves** (declare `deps`); a cross-cutting rename touching N files =
**one task**, not N. Intra-phase `deps`/waves order *when* a worker runs **and** what base it sees — the
dep-wave worker rebases onto the integration tip and sees the merged dep's code; never use them to dodge a
same-file collision (same file → same task, waved or not). The same rule scales up: phases within a plan,
and plans within a roadmap (the shared-file-contention table is this rule applied across plans).

### Drift-guard coverage — four authoring rules

> **Mechanics (why):** a fact WAR duplicates across surfaces, or asserts in prose about a canonical code
> construct, rots silently unless a mechanical guard binds it to its canonical source by **extraction +
> equality** (the drift-guard discipline, ADR 0025). Carving work so the guard travels with the fact it
> guards is a plan-authoring duty, same footing as file-disjointness above.

5. **New mirror ⇒ its registry row, same task.** A task that lands a **new inline mirror** of a canonical
   export (a constant or helper hand-copied into `workflow-template.js` because the Workflow sandbox can't
   `import`) MUST also land its **mirror-registry row** in `workflow-template.test.mjs` in the **same task** —
   one row asserting the inline copy equals its canonical source. An **unguarded mirror is a plan defect**,
   never a follow-up: split the row into a later task and the mirror ships a phase naked. The registry grows
   by row, never by scanner (`// ponytail:` — the AST scanner is the rejected ceiling).
6. **Default-flip ⇒ enumerate every surface, assert OLD absent.** A task that flips a default or narrows a
   scope MUST **enumerate every doc surface** carrying the old value in its `Files:`, and its gate MUST assert
   the **OLD value absent** across all of them — asserting only the new value present is the recorded failure
   ([[default-flip-must-audit-all-doc-surfaces]]): a stale surface the new-present check never reads sails
   through green.
7. **Guard-split deps-edge ⇒ the guard task carries a `deps` edge onto the fact.** When file-disjointness
   (rule 1) forces a drift guard into a **different task** from the one authoring the fact it guards, that
   guard task MUST carry `deps: [<the fact-authoring task>]` — **same wave is insufficient**, because every
   task worktree is cut from one **frozen** phase base: a guard that merely shares a wave with its fact is
   implemented and audited against a base that lacks it, red by construction through no fault of its own
   diff. The edge encodes a **content** dependency the downstream worker discharges by rebasing onto the
   integration tip as its first act — *not* the `deps`-to-dodge-a-same-file-collision the heuristics above
   forbid, because the two tasks are genuinely file-disjoint. Cannot be edged (a cycle) ⇒ merge the tasks or
   move the guard a phase later; **never ship it unedged**. Canonical record: the 2026-08-02 amendment to
   [ADR 0025](../../docs/adr/0025-drift-guard-discipline.md); downstream, `/red-team`'s
   `guard-split-deps-edge` spine probe flags an unedged split as a plan defect (`needsDecision`). Binds every
   plan authored or converted here, and `/war-machine`'s drafter consumes this subsection by reference.
8. **Touched-doc fact ⇒ guard, de-mirror, or explicitly defer — never silence.** A task whose slice
   rewrites a doc **owns the factual accuracy** of what it renders authoritative: for every fact in that
   doc derivable from a **machine-readable in-repo source** (a config default, a manifest field, an enum
   member, a version slot — never prose claims generally), the plan picks exactly one of three —
   **guard** (a drift test binding the doc value to its source by extraction + equality; exemplars:
   `version-slots.test.mjs`, `war-config.test.mjs`'s frontmatter guard), **de-mirror** (rewrite the doc to
   point at the canonical source instead of restating its value), or **explicitly defer** (a
   legitimacy-complete row in `## Deferred validations (backstops)` naming the runner and the timing —
   ADR 0017's vehicle, never a prose waiver). Restating such a fact with none of the three is a plan
   defect, never a follow-up. Canonical record: the 2026-08-19 touched-doc amendment to
   [ADR 0025](../../docs/adr/0025-drift-guard-discipline.md); downstream, `/red-team`'s
   `touched-doc-fact-coverage` spine probe flags a silent restatement as a plan defect (`needsDecision`),
   and `/war`'s decompose step carries the pointer to `skills/war/references/touched-doc-accuracy.md`.
   Binds every plan authored or converted here, and `/war-machine`'s drafter consumes this rule by
   reference like the rest of the subsection.

## 4. Interview, handoff & convert

**Pipeline doctrine:** war-strategy **converts**; `/red-team` **validates** plans and never converts — route
conversion here, ratification there.
When authoring a plan from scratch, read [references/plan-interview.md](references/plan-interview.md) — the
interview doctrine (stages 0–5, the question contract, the WAR falsifier list, the decisive-slots table, the
two closing gates).

### Bare invoke — run the interview

Run the plan interview yourself, per `references/plan-interview.md`: one interview to completion,
terminating only on one merged plan at `docs/plans/YYYY-MM-DD-<slug>.md` (§2's merged template). When §1
finds the Grill Me family installed and the operator prefers that front door, route the interview through
it and ship this **HANDOFF DIRECTIVE** with the route — the authoring skill executes it:

> **Intent interview:** draft the plan's `## Commander's Intent` block **only from the operator's answers**
> (Purpose / Method / numbered checkable End state — never invented), ask **the latitude beat** — which
> mechanisms named in Method are implementer's choice, and what is the actual floor —
> so the optional `Mechanism latitude:` / `Binding guardrails:` sub-bullets land from answers, not
> inference, then echo the drafted block back, and get an
> **explicit confirm** before moving on. **Author into the merged template:** the deliverable is one merged
> plan per war-strategy §2 — Part 1 decision record (every claim evidence-tagged, one `## Assumptions
> ledger`) + Part 2 decomposed phases — at `docs/plans/YYYY-MM-DD-<slug>.md`, never a spec + plan pair.

### With-artifact invoke — review & convert

The conversion target is always the merged shape: an external draft, an input-shape spec, or a legacy
spec + plan pair converts into ONE merged plan (legacy artifacts are grandfathered in place — conversion
upgrades on request, never retroactively).

1. **Gap review** against the templates + the rule (§2, §3): missing sections, same-file collisions,
   phase-edge violations, one-task-one-repo violations, release placement, **unguarded new mirrors,
   default-flips lacking an OLD-absent gate, drift guards split from their fact without a `deps` edge,
   and touched-doc facts left silent (no guard, no de-mirror, no explicit defer)**
   (the four drift-guard rules in §3); the merged-shape rows — **untagged factual claims (D4), a missing
   or implicit `## Assumptions ledger`, untagged End states (D5's closed tag set), and `requiresTest: true`
   without `Done when:`** — and, at roadmap scale, plan count and landing order.
2. **Gap-driven interview** — bound by the same question contract as the from-scratch interview (D9;
   `references/plan-interview.md`): one question at a time, **recommendation first** ("I recommend X because
   Y — accept?").
3. **Structural fixes** applied with the operator's confirmation.
4. **Given a SPEC (the input shape):** author the merged plan into `docs/plans/` yourself — Part 1 the
   decision digest distilled from the source spec (citing it), Part 2 the decomposed phases — running the
   intent echo-back **inline** (draft `## Commander's Intent` from the operator's answers, echo it back,
   explicit confirm) instead of shipping the directive.
5. **Lint the authored plan:** run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>` on every
   plan you author and surface its hits in the conversion report (advisory — report-only, never blocks). Each
   hit names a stack-fragile literal to rewrite per the "Reference the live artifact" conventions (§2).

## 5. Closing offer

Optionally point at `/survey-corps` — the pipeline's memories + issues → specs step: it first mines
qualifying hot memory lessons into issues, then sweeps open issues, clusters them, and synthesizes
war-shaped specs into `docs/specs/`, optionally seeded by `ponytail-audit` or `ecc:repo-scan` as
*optional* seeds, never a hard dependency.
