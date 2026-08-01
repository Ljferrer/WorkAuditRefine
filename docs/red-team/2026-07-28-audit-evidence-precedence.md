# Red-team report — 2026-07-28-audit-evidence-precedence

**Verdict: BLOCKED at gate → OPERATOR-ADJUDICATED CLEAR (ratified, not AI-declared — ADR 0014
provenance; restamped 2026-07-28 under the operator directive that makes a fully-patched BLOCKED
advisory to the Lead).** The gate returned BLOCKED
(24 blockers, 25 needsDecision, 14 minors — collapsing to ~10 roots, because eleven independent
probes converged on the same defects). Every root was self-adjudicated under AFK and patched into
the plan in this pass. **The affected probes were NOT re-run** — under the ratified directive a
re-run is owed only where an EXECUTED probe proved the finding by running something AND the patch
changes what that same probe would measure; no root here meets both arms. Two roots (K, and the
two Minors listed under Residual risk) are Lead-reversible and flagged as such.

- **Plan:** `docs/plans/2026-07-28-audit-evidence-precedence.md` (patched in place)
- **Source spec:** `docs/specs/2026-07-28-audit-evidence-precedence-design.md`
- **Base:** `9347f47` (`dev/2026-07-28-audit-evidence-precedence` tip, campaign plan 1)
- **artifactKind:** impl-plan · **Mode:** `--afk`, Lead self-adjudicated
- **Non-authoritative literals re-verified at this base:** highest live ADR is **0040** (so 0041 is
  genuinely next-free) and the four release slots read **0.14.67** (so 0.14.68 is genuinely
  next-free). Both left unchanged in the plan.

## Attack surface / Executed proof

13 probes, **13 on-target, 0 off-target, 0 dropped**. 4 executed in throwaway sandboxes, 9
analyzed. Gate: **1 pass / 10 fail / 2 warn**. Spine lenses: `claims-vs-reality`,
`executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`,
`intent-vs-plan`, plus the drift-guard spine (`unguarded-new-mirror`, `default-flip-old-absent`).
Bespoke: `endstate8-measurability`, `existing-proto-ladder-collision`, `spec-criteria-homes`,
`endstate-4-5-splice-safety`, `done-report-rung-placement`.

- **`ff-topology` correctly NOT derived.** The plan carries no `^1`, no `--first-parent`, no
  three-dot floor base, and no per-task merge-commit claim — token grep plus hand-read. Deriving it
  would have been off-target.
- **`default-flip-old-absent` was VACUOUS.** No task flips a default, narrows a scope, or retires
  wording: all four tasks are purely additive (a new ADR, three new glossary terms, one new card
  section, four skeleton appends, three new guard rows, one version bump). The probe ran and found
  nothing to check — recorded as a clean vacuity, not as a pass.

## Findings and resolutions applied

Ten roots. The raw-item counts below are the number of gate findings each root absorbed across
buckets; the probe names show which lenses converged independently.

**A. Three gate-audit seats, not one — 11 raw items** (`claims-vs-reality`, `executable-proof`,
`coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`,
`existing-proto-ladder-collision`, `unguarded-new-mirror`). The plan said "the gate-audit seat
prompt" (singular, definite article). `workflow-template.js` builds **three** gate-audit-family
seat prompts — `POST-MERGE GATE-AUDIT`, `INTEGRATED-TIP GATE-AUDIT` (the AUTHORITATIVE one) and
`END-STATE-ONLY GATE-AUDIT` — each its own `pt`-literal, all built **outside** `auditPrompt()` as
`endStateBlock + intentClause + adjudicationClause` and inheriting nothing from it. Appending to
`auditPrompt()` reaches none of them; the file's own comment names the set in the plural.
**Resolution:** D5 ratified "widest scope" and a seat judging without the ladder is the gap this
plan exists to close, so the skeleton goes to `auditPrompt()` **and all three seats**. End state 2
and Task 1.2's slice now name all four by their source labels; the registry row binds **five**
surfaces (card + four). Task 1.2's `Files:` list is unchanged.

**B. End state 8 was unsatisfiable as written — 8 raw items** (`executable-proof`,
`consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`, `endstate8-measurability`
(the single **Critical**), `existing-proto-ladder-collision`, `unguarded-new-mirror`). It demanded
an absolute "shape-name occurrences on the dispatched prompt surface ≤ the skeleton block". At base
`workflow-template.js` already carries `execution` ×21 (8 of them the reserved `execution-evidence`
lens token) and `history` ×1, none ladder-related; `content-at-pin` and `authority` measure 0. An
absolute count reds by construction and the only way a worker greens it is deleting unrelated
pre-existing prose. **Resolution:** restated as a two-part check — **(i)** a *delta* measurement
(added shape-name occurrences ≤ the skeleton block) and **(ii)** absence of the discriminating
rung-body tokens (`Pinned blob`, `Gate-evidence artifact`, `advisory corroboration`, `a claim to
verify, never evidence`, all 0 at base). The plan now records which tokens are safe anchors
(`content-at-pin`, `never the top rung`, `never evidence`) and which are not (`execution`,
`history`). Applied to End state 8 and to Task 1.2's in-task check.

**C. Registry-row anchors + the no-slack floor — 5 raw items** (`claims-vs-reality`,
`dependency-feasibility`, `unguarded-new-mirror`). Two problems in one root. (i) Three of the six
§4.4 skeleton tokens are non-discriminating at base — `execution` 6 on the card / 21 in the
template, `history` 1 / 1 — so a one-sided edit that drops just those rungs stays green; the suite's
own rows document exactly this trap ("`/fresh TMPDIR/i` is NOT usable — it already appears at base
on BOTH surfaces"). (ii) `workflow-template.test.mjs` asserts `REGISTRY.length >= 13` with the
message "floor equals the true row count, **no slack (#693)**", and the live registry holds exactly
13 rows — a 14th leaves one row of slack, silently reopening what #693 closed, while the assert
still passes. **Resolution:** Task 1.2 now specifies anchors built from the three base-absent tokens
plus multi-token rung pairings, matched case-insensitively mid-sentence, with the base-occurrence
measurement recorded as the row's anchor-precondition comment per the suite's idiom; and mandates
the floor bump plus the enumeration-message extension in the same commit.

**D. Spec §10.2 and §10.3 had no home at all — 4 raw items** (`coverage-vs-source`,
`spec-criteria-homes`). Both are ratified validation criteria that lived in neither the gate, a
floor, an End state, an in-task check, nor the backstops section — the silent third option ADR 0017
forbids. §10.2's three precedent lessons (`audit-worktree-pre-impl-tip-stale-verdict`,
`audit-log-finding-can-be-stale-by-land-time`,
`auditor-grep-tool-unrestricted-by-git-verb-bash-guard`) appear in **no ladder and nowhere in the
plan** — copying §4.1's inline citations does not establish the mapping, because §4.1 cites two
*different* slugs. **Resolution:** §10.2 folded into **Task 1.1** as required ADR content (a
subsection mapping each lesson to one shape and the surface that shape's ladder forbids, cited by
slug so the criterion is greppable) and reflected in **End state 6**; the finding's own doubt about
`auditor-grep-tool-unrestricted-by-git-verb-bash-guard` (the `history` ladder prescribes verbs
rather than forbidding a surface) is carried into the slice as a named escape hatch — defend the
mapping in Consequences, never silently drop a lesson. §10.3 added as a **third
`## Deferred validations (backstops)` entry**: it genuinely cannot run pre-merge (the 2026-07-26
campaign's audit records live outside this diff), with runner `/war-review` over that campaign's
archived run manifests and timing "before the next multi-seat campaign close". Heading kept as the
plain operator form — this is Lead-adjudicated, not AI-declared.

**E. Run-config Notes vs the committed file — 2 raw items** (`dependency-feasibility`). The Notes
describe `.claude/war/config.json` carrying the default profile plus all worker tiers fable/high.
The committed config on master does not match — it still reads worker opus/max, docs sonnet/max,
fix fable/xhigh; commit `496d777` rewrote only the plan/spec/roadmap prose. **Resolution:** the
directed tier values are unchanged; the Notes bullet now records that the campaign Lead applies them
**on disk, uncommitted, at launch**, that the committed file still carries the old tiers, and that a
reader must not "correct" the plan to agree with the stale committed file.

**F. Purpose overclaim — 2 raw items** (`intent-vs-plan`). Purpose claimed "**every**
evidence-handling role in WAR". D5's ratified set is auditor seats (incl. reserved passes), the
Lead's phase-close/Gate-2 duties, and the servitor; spec §4.3 lists no instantiation for workers or
refiners. **Resolution:** Purpose scoped to D5's enumerated set with workers and refiners named as
explicitly out of scope. The H1 title is left byte-unchanged (roadmap and campaign surfaces
reference it) and the Purpose now says in-line that the title phrase is shorthand for exactly this
set.

**G. Task 1.3's unnamed anchor bullets — 2 raw items** (`consistency-placeholders`,
`dependency-feasibility`). The slice said "find the anchor bullets by their named constructs, not
line numbers" and then never named them. **Resolution:** read `skills/war/SKILL.md` at base and
named both — the phase-close anchor is `**Retired-token sweep (every landed phase; #930).**` (which
already carries binding (1)'s instantiation: "read **at the just-landed tip** … never the
possibly-lagging session checkout") and the Gate-2 anchor is
`**Post-servitor publication (Gate 2, spec §4.6; skipped when memory was disabled at Setup).**`.
Both are bolded lead-ins and adjacent siblings inside `## Per phase (in DAG order)`.

**H. The flagged Open decision — done-report rung placement: CONFIRMED, description corrected —
3 raw items** (`done-report-rung-placement` ×2, `intent-vs-plan`). The ranking stands. But the
plan's summary of it ("below all mechanical evidence in every ladder, above nothing") is imprecise
in a way that matters, because Task 1.1's ADR and Task 1.2's card are authored *from* it: the
done-report is a bottom rung in `content-at-pin`, is rung 3 of 4 in `execution` (**not** above
nothing — the absent-evidence arm is below it, and the rung above it is itself an agent report), is
**absent** from `authority`, and in `history` falls under rung 2 ("a claim to verify, never
evidence") — *stricter* than a bottom rung. Separately, the spec's "the one rung not forced by a
recorded lesson" is **false**, in the safe direction: §4.1 cites the forcing lesson inline on that
very rung. **Resolution:** `## Open decisions` rewritten to CLOSED/CONFIRMED with the precise
ladder-by-ladder placement, the universal statement relocated to spec §4.2's "never the top rung of
any ladder", and four lesson citations — `deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold`
(cited in-spec on the rung itself), `worker-self-report-count-can-overstate-diff-additions` (a
measured case: done report claimed 10, diff had 5), `closure-rationale-infeasibility-claim-needs-code-trace-not-assertion`,
and `plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false`. No lesson anywhere in
`docs/learnings/` ranks an agent self-report above a mechanical surface. The one residual sharp edge
is recorded as ADR material, not a re-rank: §4.3 Lead binding (3) means a done-report claim threaded
into a dispatch prompt arrives as `authority` rung 1 — the grounding duty is the mitigation, and the
ADR must state it as a named consequence of the floor placement.

**I. New unguarded mirror: the three CONTEXT.md glossary terms — 2 raw items**
(`unguarded-new-mirror`, `existing-proto-ladder-collision`). The terms are not pointers: **rule +
record** restates the D3 conflict rule and **evidence rung** restates the lessons floor rule, both
of which the ADR (same task) and the auditor card (Task 1.2) also carry — a third copy, so ADR 0025
binds. The repo already guards exactly this class of CONTEXT.md doctrine clause.
**Resolution:** Task 1.1 ships a same-task guard row in `skills/war/assets/skill-doc-contracts.test.mjs`
(the correct suite — it is the CONTEXT.md glossary-term guard, D19 and D24 are the idiom: bolded-term
→ next-bolded-term block extraction, case- and wrap-tolerant), pinning the three term names and each
`_Avoid_` line's doctrine clause. That file is added to Task 1.1's `Files:` list and Task 1.1's
`requiresTest` flipped **false → true** so the floor actually enforces the guard. Task 1.3 also edits
that file; a Notes bullet now states explicitly that this is legal and deliberate — 1.1 and 1.3 are
in *different waves* (1.1 alone, then 1.2 ∥ 1.3), so the two edits reach the suite through the serial
merge queue in order, and the parallel pair 1.2 ∥ 1.3 stays fully file-disjoint. Also folded in from
the same probe family: `claim shape` is **not** a new token — it already reads "pick the verb per
claim shape" on both mirrored COMMITTED-TREE GROUNDING surfaces, so the glossary entry must name that
pre-existing open usage as the first instance rather than land asserting closure over it.

**J. End state 4's one-line servitor diff — 2 raw items** (`endstate-4-5-splice-safety`, both
`warn`). The probe **proved a safe append point**: both End state 4 and End state 5 were physically
spliced into a sandbox copy and the full suite sweep stayed byte-identically green against a
pristine baseline (994/994 JS tests, 27/27 shell suites rc=0), with an extraction-region census
showing no pinned region spans `### Audit` and no assertion pins `agents/war-servitor.md`'s line
count, section count or any to-EOF span. **Resolution per the adjudication: End state 4 left
byte-unchanged**, and the proven insertion point added to Task 1.1's slice — append at EOF after
`## Return` with the idiomatic blank separator. See Residual risk for the one edge this leaves.

**Minors folded in without a separate root** (from `claims-vs-reality`, `executable-proof`,
`consistency-placeholders`, `unguarded-new-mirror`): End state 1 undercounted spec §4.2's floor
rules as "both floor clauses" when §4.2 defines **four** (the D3 conflict rule and the D2 default
arm carry no greppable token, so an end-state seat reading it literally could green a card missing
the entire conflict semantics `rule + record` depends on) — reworded to "all four, of which exactly
two are token-greppable"; guard anchors mandated case-insensitive on a mid-sentence substring
(a sentence-initial "Never the top rung:" would otherwise false-negate a case-sensitive anchor);
Task 1.3 given Task 1.1's pre-write extraction-region check, since `SKILL.md` is the most heavily
pinned file in the repo and **D22's region is exactly the Gate-2 flow Task 1.3 edits**; Task 2.1's
"two new guard rows" corrected to three and marked count-at-tip.

## Additional root not covered by the A–J adjudication set

**K. COEXIST, do not supersede — 1 raw blocker** (`existing-proto-ladder-collision`). Both Task 1.2
target surfaces already carry a *proto* version of two ladders: the mirrored COMMITTED-TREE
GROUNDING block states `content-at-pin` rungs 1–2 and `history` rung 1 (the verb-per-claim-shape
clause), and the plan was silent about it — grepping the plan for
`committed-tree|grounding|reconcile|supersede|dedupe|duplicat` returned zero hits. Follow the plan
literally and the card ends up with two differently-scoped statements of the same doctrine; try to
dedupe instead and you red an existing registry row the plan never names. The finding deliberately
declined to choose. **Resolution — Lead-reversible:** recorded as **COEXIST**. That is the only arm
compatible with Task 1.2's `Files:` list and with the plan's own Method clause ("pre-existing role
disciplines are cited as instantiations, never restated"); SUPERSEDE would additionally require
rewriting the existing row's anchors and re-establishing the card/prompt verbatim mirror, neither of
which is in scope. If the Lead prefers SUPERSEDE, Task 1.2's slice and its `Files:` list both need
amending.

## Backstop-legitimacy check

Three entries, all PASS. (1) Seats practicing **rule + record** — judgment guidance, prompt-enforced
and deliberately schema-free (spec §9); runner `/war-review` over the next multi-seat run. (2) Lead
phase-close bindings as behavior — the refiner/main scope hook fail-opens, so only the text is
guardable; runner the next campaign close / Gate-2 pass. (3) **New:** the 2026-07-26 retrospective
replay — concrete why-deferred (the input records live outside this diff and outside any pre-merge
surface), named runner (`/war-review` over that campaign's archived run manifests under
`.claude/war/runs/`), named timing (before the next multi-seat campaign close). Heading is the plain
operator-ratified form; no AI-declared marker applies.

## Drift-guard spine probes

- `unguarded-new-mirror`: **FOUND FOUR** — roots A (three seats unguarded and unreachable), C (the
  anchors cannot discriminate, and the no-slack floor), I (the glossary mirror), plus the Task 1.3
  row that could not discriminate a dropped Lead binding. All four now ship guards or corrected
  anchors in the same task as their mirror.
- `default-flip-old-absent`: **VACUOUS** — no task flips a default or narrows a scope; all four are
  additive. Nothing to check, recorded rather than silently skipped.
- `ff-topology`: **NOT DERIVED** — the plan carries no merge-topology anchor of any kind (no `^1`,
  no `--first-parent`, no three-dot floor base, no per-task merge-commit claim).

## Residual risk

- **End state 4 stays literally ambiguous.** The proven-safe append (blank separator + one
  cross-reference line at EOF) measures `2 0` in `git diff --numstat`, so an end-state seat reading
  "exactly one added line" against numstat can red correct work. The adjudication directed leaving
  End state 4 alone, so the disambiguation lives in Task 1.1's slice instead ("End state 4 counts
  cross-reference *content* lines, not numstat"). **The Lead may prefer to reword End state 4
  itself** — the probe's own `fix` offered that as resolution (a). The alternative arm (keep the
  literal +1, glue the line into `## Return` with no separator) is semantically wrong placement and
  was rejected.
- **ADR-number citation is unguarded** (Minor, `unguarded-new-mirror`). Nothing mechanically checks
  that the number Tasks 1.2/1.3 cite matches the ADR that actually landed — no suite resolves ADR
  references, and a concurrent campaign could take 0041. A worker citing 0041 when 1.1 landed 0042
  leaves three dangling pointers, all green. The probe's suggested fix (have Task 1.3's row
  `readFileSync` the ADR named by the number it extracts from SKILL.md) was **not applied** —
  it widens Task 1.3's row beyond its brief. Accepted as residual; the dep rebase plus "read the
  resolved number from the rebased tip" is the mitigation in force.
- **The §10.2 mapping may not be clean for all three lessons.** The probe specifically doubted
  `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` — the `history` ladder's rung 1 prescribes
  verbs rather than forbidding a surface, so "the surface that shape's ladder forbids" may not have
  an answer for it. The slice instructs the worker to record a defensible mapping plus a
  Consequences note rather than drop the lesson; if no mapping survives contact, that is a genuine
  signal about D1's coverage and should escalate rather than be prosed over.
- **Root K is Lead-reversible** (see above).

## Residual open questions

None blocking. The three items above are the whole residue; every blocker and needsDecision in the
gate is either patched or explicitly accepted here. No finding was left silently waived.

## Adjudications

| # | Delta (plan-body literal superseded) | Adjudicated value | Route | Moment |
|---|--------------------------------------|-------------------|-------|--------|
| A | "the gate-audit seat prompt" (singular) — one surface | Skeleton goes to `auditPrompt()` **and all three** gate-audit-family seats (`POST-MERGE GATE-AUDIT`, `INTEGRATED-TIP GATE-AUDIT` — the AUTHORITATIVE one — and `END-STATE-ONLY GATE-AUDIT`); the seats sit outside `auditPrompt()` and inherit nothing. One registry row binds **five** surfaces (card + four). Task 1.2 `Files:` unchanged | End state 2 · Task 1.2 slice · Task 1.2 heading | red-team, 2026-07-28 |
| B | End state 8: absolute "shape-name occurrences there ≤ the skeleton block" | Two-part check: **(i)** *delta* — added shape-name occurrences ≤ the skeleton block (absolute reds by construction: `execution` ×21, `history` ×1 at base, none ladder-related); **(ii)** rung-**body** tokens (`Pinned blob`, `Gate-evidence artifact`, `advisory corroboration`, `a claim to verify, never evidence`) absent from the dispatched surfaces. Safe anchors are `content-at-pin` / `never the top rung` / `never evidence` (all 0 at base); `execution` and `history` are not | End state 8 · Task 1.2 in-task check | red-team, 2026-07-28 |
| C | "token-anchored … follow the existing registry-row idiom" (unspecified anchors; floor unmentioned) | Anchors = the three base-absent tokens + multi-token pairings for the `execution`/`history`/`authority` rungs, case-insensitive mid-sentence, with the base-occurrence measurement recorded as the row's anchor-precondition comment. **And** bump `REGISTRY.length >= 13` to the new true count and extend its enumeration message, same commit (#693 no-slack invariant) | Task 1.2 slice | red-team, 2026-07-28 |
| D | Spec §10.2 and §10.3 had no home (ADR 0017 violation) | §10.2 → required ADR subsection in **Task 1.1** mapping each of the three §1 precedent lessons to one shape + the surface its ladder forbids, cited by slug; reflected in End state 6. §10.3 → **third backstop entry**, runner `/war-review` over the 2026-07-26 campaign's archived run manifests, timing before the next multi-seat campaign close. Plain heading, not the AI-declared variant | End state 6 · Task 1.1 slice · Backstops | red-team, 2026-07-28 |
| E | Notes describe a config the committed file does not carry | Directed tier values unchanged; Notes now record that the Lead applies them **uncommitted at launch**, that the committed file still reads worker opus/max · docs sonnet/max · fix fable/xhigh (`496d777` touched prose only), and that a reader must NOT "correct" the plan to the stale file | Notes | red-team, 2026-07-28 |
| F | Purpose: "**every** evidence-handling role in WAR" | Scoped to D5's enumerated set — auditor seats incl. reserved passes, the Lead's phase-close/Gate-2 duties, the servitor. Workers and refiners explicitly NOT bound. H1 title left byte-unchanged, with the Purpose stating it is shorthand for this set | Commander's Intent — Purpose | red-team, 2026-07-28 |
| G | "the existing phase-close and Gate-2 bullets" (constructs never named) | Phase-close anchor = `**Retired-token sweep (every landed phase; #930).**`; Gate-2 anchor = `**Post-servitor publication (Gate 2, spec §4.6; skipped when memory was disabled at Setup).**` — adjacent bolded siblings in `## Per phase (in DAG order)` | Task 1.3 slice | red-team, 2026-07-28 |
| H | "Done-report placement (below all mechanical evidence in every ladder, above nothing) … the one rung not forced by a recorded lesson" — left OPEN | **CLOSED / CONFIRMED, no re-rank.** Bottom rung in `content-at-pin`; rung 3 of 4 in `execution` (not above nothing); **absent** from `authority`; in `history` it falls under rung 2 "a claim to verify, never evidence" (stricter than a bottom rung). Universal statement = spec §4.2 "never the top rung of any ladder". "Not forced by a lesson" is FALSE — four lessons force it (listed in the plan). §4.3 binding (3) recorded as a named ADR consequence, not a re-rank | `## Open decisions` (rewritten) | red-team, 2026-07-28 |
| I | Task 1.1 adds three CONTEXT.md doctrine terms with no guard (ADR 0025) | Task 1.1 ships a same-task `skill-doc-contracts.test.mjs` row pinning the three term names + each `_Avoid_` doctrine clause (D19/D24 idiom); that file added to Task 1.1 `Files:`; `requiresTest` **false → true**. Task 1.3 also edits it — **legal, different waves**, stated explicitly in Notes. Glossary must name the pre-existing open `claim shape` usage rather than assert closure over it | End state 5 · Task 1.1 `Files:`/slice/`requiresTest` · Notes | red-team, 2026-07-28 |
| J | End state 4 "the diff to that file is one added line" | **End state 4 left byte-unchanged** (probe proved a safe append point, not a suite red). Proven insertion point added to Task 1.1: EOF after `## Return`, idiomatic blank separator — 994/994 JS + 27/27 shell green in a spliced sandbox vs pristine baseline. Slice states End state 4 counts cross-reference *content* lines, not `numstat` (which reads `2 0` for correct work). Lead may prefer to reword the End state instead — see Residual risk | Task 1.1 slice | red-team, 2026-07-28 |
| K | Plan silent on the pre-existing COMMITTED-TREE GROUNDING proto-ladders on both Task 1.2 surfaces | **COEXIST** — leave that block byte-unchanged, keep its registry row green, have the new ladder text cross-reference it rather than restate the git verbs. SUPERSEDE rejected: it would require rewriting that row's anchors and re-establishing the card/prompt mirror, neither in Task 1.2's `Files:` list. **Lead-reversible** | Task 1.2 slice | red-team, 2026-07-28 |
