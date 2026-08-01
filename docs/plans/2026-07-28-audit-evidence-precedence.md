# Audit evidence precedence — per-claim-shape ladders for every evidence-handling role

Source spec: [docs/specs/2026-07-28-audit-evidence-precedence-design.md](../specs/2026-07-28-audit-evidence-precedence-design.md)
(ratified via `/grill-with-docs` 2026-07-28; design tree D1–D5 resolved there — this plan carries no
re-litigation of those decisions). The spec must be committed on the working branch before `/war`
runs: task workers cite its sections by number.

## Commander's Intent

- **Purpose:** the evidence-handling roles D5 enumerates — auditor seats **including the reserved
  passes** (`execution-evidence` gate-audit, `pin-validity` pre-flight), the **Lead's phase-close /
  Gate-2 evidence duties**, and the **servitor** — judge claims against one ratified precedence
  doctrine, so verdicts stand on the right surface and cross-rung contradictions surface as
  recorded signal, never silence. Workers and refiners are deliberately **not** bound: spec §4.3
  lists no instantiation for either, and this plan adds none (red-team adjudication F — the title's
  "every evidence-handling role" is headline shorthand for exactly this D5 set, not a wider claim).
- **Method:** four closed claim-shape ladders (`content-at-pin`, `execution`, `history`,
  `authority`) plus universal floor rules; full ladders on the auditor card, token skeletons on the
  dispatched-prompt and Lead/servitor surfaces (progressive disclosure); token-anchored drift
  guards land in the same task as their mirrors; pre-existing role disciplines (ADR 0007, 0008)
  are cited as instantiations, never restated. Docs-tier workers run fable/high for this
  implementation (run config, not plan structure — see Notes).
- **End state:**
  1. `agents/war-auditor.md` carries an `## Evidence precedence` section with all four ladders and
     **all four** spec §4.2 floor rules (working-tree/done-report demotion; lessons-are-not-evidence;
     the D3 conflict rule; the D2 default arm) — of which exactly two are token-greppable
     (`never the top rung`, `never evidence`), matched case-insensitively; the other two (conflict
     rule, default arm) are verified by reading, not by grep.
  2. All **four** dispatched surfaces carry the skeleton — `auditPrompt()` plus each of the three
     gate-audit-family seats named in the source: `POST-MERGE GATE-AUDIT`
     (`gate-audit:${taskId}:execution-evidence`), `INTEGRATED-TIP GATE-AUDIT`
     (`gate-audit:phase-${ph.id}:integrated-tip`, the AUTHORITATIVE seat), and
     `END-STATE-ONLY GATE-AUDIT` (`gate-audit:phase-${ph.id}:end-state`). One registry row binds
     **five** surfaces (the standing card + those four) and reds on a one-sided edit of the card or
     of any one of the four prompt surfaces.
  3. `skills/war/SKILL.md`'s phase-close and Gate-2 bullets carry the three Lead bindings +
     skeleton; a `skill-doc-contracts.test.mjs` row pins the skeleton tokens **and one distinctive
     anchor pair per binding**, so deleting any single binding reds the row.
  4. The `agents/war-servitor.md` diff is exactly one added cross-reference line.
  5. `CONTEXT.md` `### Audit` gains **claim shape**, **evidence rung**, **rule + record**, each
     with an `_Avoid_` line; a `skill-doc-contracts.test.mjs` row pins the three term names and
     their `_Avoid_` doctrine clauses against the ADR (ADR 0025 same-task mirror guard).
  6. A new ADR at the next free number records D1–D5, the ladders, the two rejected alternatives,
     **and a subsection mapping each of the three precedent lessons named in spec §1 to exactly one
     claim shape and to the surface that shape's ladder forbids** (spec §10.2, greppable by the
     three slugs), cross-referencing ADR 0007/0008/0025.
  7. The AuditVerdict schema is byte-unchanged.
  8. The dispatched prompt surfaces carry no full ladder, measured two ways — **(i) delta:** the
     four shape names appear on those surfaces only inside the skeleton block(s) this change adds,
     i.e. *added* shape-name occurrences ≤ the skeleton block (never an absolute count: `execution`
     already measures 21 and `history` 1 in `workflow-template.js` at the base, none ladder-related,
     8 of the `execution` hits being the reserved `execution-evidence` lens token — an absolute
     check reds by construction and could only be greened by deleting unrelated pre-existing prose);
     **(ii) body-absence:** the discriminating ladder rung-body tokens from spec §4.1 —
     `Pinned blob`, `Gate-evidence artifact`, `advisory corroboration`, `a claim to verify, never
     evidence` — measure 0 on the dispatched prompt surfaces. `content-at-pin`, `never the top rung`
     and `never evidence` measure 0 on **both** card and prompt at the base and are therefore the
     safe anchors; `execution` and `history` are not.
  9. All four release slots bumped in lock-step to the next free patch above the live base;
     `version-slots.test.mjs` green.

## Build order (for /war)

Phase 1 — doctrine + guards (one phase, two waves: 1.1 alone, then 1.2 ∥ 1.3).
Phase 2 — release (trailing, own phase per the decomposition rule).

## Phase 1 — Doctrine and guards

### Task 1.1: Doctrine record — ADR, glossary, servitor cross-reference

- Files: `docs/adr/0041-audit-evidence-precedence.md`, `CONTEXT.md`, `agents/war-servitor.md`,
  `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: Author the ADR per spec §7 — resolve the number as the **next free** in the live
  `docs/adr/` listing at the task base (0041 as measured 2026-07-28; the `Files:` name above
  follows the resolved number — non-authoritative literal) — recording D1–D5 (spec §3), the four
  ladders and floor rules (spec §4.1–4.2), and the two rejected alternatives (total order; runtime
  schema field), with Status/Context/Decision/Consequences in the house ADR style and
  cross-references to ADR 0007, 0008, 0025. **The ADR must also carry a dedicated subsection giving
  the spec §10.2 mapping** — each of the three precedent lessons named in spec §1
  (`audit-worktree-pre-impl-tip-stale-verdict`, `audit-log-finding-can-be-stale-by-land-time`,
  `auditor-grep-tool-unrestricted-by-git-verb-bash-guard`) mapped to exactly one claim shape and to
  the surface that shape's ladder forbids; cite each lesson by slug so the criterion is greppable.
  This is the ratified proof that the D1 four-shape split covers the incidents that motivated it —
  it has no other home, and reproducing §4.1's own inline lesson citations does **not** establish it
  (§4.1 cites two different slugs). If a lesson resists a clean single-shape mapping — the red team
  flagged `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` as the doubtful one, since the
  `history` ladder's rung 1 prescribes verbs rather than forbidding a surface — record the mapping
  you can defend plus a one-line Consequences note; do not silently drop a lesson. Add the three
  glossary terms to `CONTEXT.md`'s `### Audit` section per spec §6 — **claim shape**,
  **evidence rung**, **rule + record** — each with its `_Avoid_:` line (including the
  `execution`-shape vs `execution-evidence`-lens disambiguation). `claim shape` is **not** a new
  token on these surfaces: it already reads "pick the verb per claim shape" in the mirrored
  COMMITTED-TREE GROUNDING clause on both `agents/war-auditor.md` and `workflow-template.js`, used
  loosely for *what kind of question is being asked*. Have the glossary entry name that pre-existing
  usage as the first (open) instance and state that this ADR closes the set; do **not** reword the
  two mirrored occurrences (they are byte-mirrored and guarded — see Task 1.2's COEXIST rule).
  Ship in the same task a `skill-doc-contracts.test.mjs` row (next free row number in that suite —
  D26 as measured 2026-07-28; resolve at the task base) pinning the three term names and the
  doctrine clause of each `_Avoid_` line against the ADR, following that suite's D19/D24 idiom
  (bolded-term → next-bolded-term block extraction, case- and wrap-tolerant `/…/i` anchors, never
  byte-pinned). This is the ADR 0025 same-task guard for a new mirror: the terms restate D3 conflict
  semantics and the lessons floor rule that the ADR and the auditor card also carry. Append exactly
  one cross-reference line to `agents/war-servitor.md` naming verify-on-write (ADR 0007) as the
  servitor's instantiation of the evidence floor rules, citing the new ADR by its resolved number
  (End state 4: the diff to that file is one added **cross-reference line**). **Proven insertion
  point** (red-team, reproduced in a throwaway repo + full suite sweep): append at EOF, after the
  `## Return` section, with the idiomatic blank separator line — every JS suite (994/994) and all 27
  shell suites stay green, and no assertion pins the file's line count, section count, or any
  to-EOF span (the only bounded region is the frontmatter `awk`, which terminates at line 9).
  End state 4 counts **cross-reference content lines**, not `numstat`: the idiomatic blank separator
  makes `git diff --numstat` read `2 0`, which is correct work, not a violation.
  Before writing, grep the existing doc-contract suites for assertions that read `CONTEXT.md` or
  `agents/war-servitor.md` and confirm the additions land outside every pinned extraction region
  (a spliced insertion that orphans an existing comment/anchor is the recorded `#1034`-class rot).
  Red-team already ran this census clean for both files at this base — re-verify at the task base
  rather than re-deriving it: no pinned region spans `### Audit`, and `skill-doc-contracts`'s D19
  and D24 regions both sit outside it.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Auditor card + all four dispatched prompts + five-surface registry row

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Add the `## Evidence precedence` section to `agents/war-auditor.md` — the full four
  ladders and universal floor rules, spec §4.1–4.2 verbatim in substance (rung order, the SOFT/HARD
  anchors, the lesson citations), citing the ADR landed by Task 1.1 by its resolved number (read it
  from the rebased tip — first action is the dep rebase). Append the compact token skeleton (spec
  §4.4: four shape names + `never the top rung` + `never evidence` + a pointer to the standing
  card) to **four** dispatched surfaces in `workflow-template.js`, all of them, in this one commit:
  the string-built `auditPrompt()` **and each of the three gate-audit-family seat prompts** —
  `POST-MERGE GATE-AUDIT` (`gate-audit:${taskId}:execution-evidence`), `INTEGRATED-TIP GATE-AUDIT`
  (`gate-audit:phase-${ph.id}:integrated-tip`, the AUTHORITATIVE seat) and `END-STATE-ONLY
  GATE-AUDIT` (`gate-audit:phase-${ph.id}:end-state`). The three seats are built **outside**
  `auditPrompt()` (`endStateBlock + intentClause + adjudicationClause` only) and inherit nothing
  from it — the file's own comment names the set — so appending to `auditPrompt()` alone reaches
  none of them; D5's ratified scope is "widest", and the AUTHORITATIVE seat judging without the
  ladder is precisely the gap this plan exists to close. Locate the seats by label, never by line
  number. Add **one** registry row to `workflow-template.test.mjs` whose `surfaces` array lists
  **five** entries — the standing card plus those four prompt slices (use the suite's existing
  `sliceSrc(...)` idiom for the seat slices, as the sibling three-surface gate-audit row does) — so
  a one-sided edit of any single surface reds it. Anchors: build them from the three **base-absent**
  tokens `content-at-pin`, `never the top rung`, `never evidence` (each measures 0 on card and on
  `workflow-template.js` today) plus **multi-token pairings** for the `execution` / `history` /
  `authority` rungs — a bare `execution` or `history` key cannot discriminate a revert, since both
  already occur on both surfaces at base (`execution` 6 on the card / 21 in the template;
  `history` 1 / 1); pair them with a rung-body fragment instead (e.g. `execution` with
  `Gate-evidence artifact`, `history` with `a claim to verify, never evidence`). Match
  case-insensitively (`/…/i`, the suite's case-tolerant idiom) on a mid-sentence substring, so a
  sentence-initial or reflowed floor clause cannot slip past. Record the base-occurrence measurement
  as the row's **anchor-precondition comment**, per that suite's existing idiom ("`X` is NOT usable —
  it already appears at base on BOTH surfaces … every token below was verified ABSENT"). Token-
  anchored, never byte-pinned — sanctioned rewording latitude on either side must not false-red; do
  not mirror any sibling row's shape without re-verifying each copied assertion against all five
  surfaces (the recorded donor-omission trap). **Bump the registry's no-slack floor in the same
  commit:** the suite asserts `REGISTRY.length >= 13` with a message ending "floor equals the true
  row count, no slack (#693)" and the live registry holds exactly 13 rows — leaving the floor at 13
  after adding a 14th silently reopens the slack #693 closed. Raise it to the new true count and
  extend that message's row enumeration to name the evidence-precedence row.
  **COEXIST, do not supersede (red-team adjudication K).** Both target surfaces already carry a
  proto version of two ladders: the mirrored `COMMITTED-TREE GROUNDING` block states
  `content-at-pin` rungs 1–2 and `history` rung 1 (the verb-per-claim-shape clause), verbatim-
  mirrored between `auditPrompt()` and `agents/war-auditor.md` and pinned by an existing registry
  row (anchors `/committed-tree grounding/i`, `/git show <audit_sha>:<path>/i`, `/advisory only/i`,
  …). Leave that block **byte-unchanged** and keep its row green; the new ladder text names it as
  the pre-existing narrow (no-op-claim) instantiation of `content-at-pin`/`history` and
  cross-references it rather than restating the git verbs. Folding it into the ladders would require
  rewriting that row's anchors and re-establishing the card/prompt mirror — out of scope here and
  invisible in this task's `Files:` list. End state 8 check in-task, two parts: **(i)** the four
  shape names appear on the four prompt surfaces only inside the skeleton block(s) you add — measure
  the *delta* (base count vs post count per name), never an absolute `grep -c`, which reds by
  construction on the pre-existing `execution` ×21 / `history` ×1; **(ii)** the spec §4.1 rung-body
  tokens `Pinned blob`, `Gate-evidence artifact`, `advisory corroboration`, `a claim to verify,
  never evidence` measure 0 across the dispatched prompt surfaces. Report both measurements in the
  done report. The AuditVerdict schema and every enum are untouched (End state 7).
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: Lead bindings + doc-contract row

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: Add the three Lead bindings (spec §4.3) to `skills/war/SKILL.md` — (1) close-out
  evidence gathered at the plan's branch tip in a dedicated worktree, never the main checkout;
  (2) remote truth via `ls-remote`, citing ADR 0008 rather than restating it; (3) a claim the Lead
  threads into a dispatch prompt becomes rung 1 of `authority` for the receiving agent, so the Lead
  grounds it at `content-at-pin`/`execution` first or marks it unverified — as skeleton + pointer
  to the ADR landed by Task 1.1 (resolved number from the rebased tip). **The two anchor bullets,
  by named construct** (verified present at this base; locate them by these constructs, never by
  line number — both are bolded lead-ins inside `## Per phase (in DAG order)`, adjacent siblings):
  the phase-close anchor is **`**Retired-token sweep (every landed phase; #930).**`** — already the
  home of binding (1)'s instantiation ("read **at the just-landed tip** … never the possibly-lagging
  session checkout") — and the Gate-2 anchor is **`**Post-servitor publication (Gate 2, spec §4.6;
  skipped when memory was disabled at Setup).**`**. Add one row to `skill-doc-contracts.test.mjs`
  (next free row number in that suite — resolve at the rebased tip, since Task 1.1 also adds one)
  following that suite's extraction-region idiom (marker-to-heading, markup- and case-tolerant
  `/…/i`, never byte-pinned). The row pins the spec §4.4 skeleton tokens **and one distinctive
  anchor pair per binding** — the skeleton alone cannot discriminate: delete any single binding and
  all six skeleton tokens survive, so the row would stay green on exactly the loss that matters.
  Per-binding anchors, following the suite's own per-claim-anchor idiom (D19 pins a distinctive
  clause, D21 pins both named arms, D22 pins an ordered span): binding (1) → `/dedicated worktree/i`
  + `/never the main checkout/i`; binding (2) → `/ls-remote/i` + `/0008/`; binding (3) →
  `/rung 1[\s\S]{0,40}authority/i` + `/unverified/i`. **Before writing, run the same pre-write
  extraction-region check Task 1.1 carries** — `SKILL.md` is the most heavily pinned file in the
  repo: `skill-doc-contracts.test.mjs` extracts SKILL.md regions in D10, D13, D14, D16, D18, D21 and
  **D22, whose region is exactly the Gate-2 post-servitor publication flow this task edits** (an
  ordered five-arm span key), and `land-decision.test.mjs` extracts overlapping bullets. Confirm the
  inserted bindings land outside every such region, or update the affected rows in this same commit.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four release slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four version slots in lock-step to the **next free patch above the live
  integration base at land time** (never a plan literal; re-read the slots at the rebased tip).
  Replace the README `## Status` paragraph in place, authored against the
  `### Status-blurb authoring checklist` in `## Releasing` and answering each item in the done
  report. `version-slots.test.mjs` is the arbiter (lock-step, monotonic floor, undersell guard,
  checklist presence lock). Describe: the four claim-shape ladders, which surfaces carry full text
  vs skeleton, the **three** new guard rows (Task 1.1's CONTEXT.md glossary row, Task 1.2's
  five-surface registry row, Task 1.3's SKILL.md Lead-bindings row — count them at the rebased tip
  rather than trusting this literal), and the fact that no engine code path or schema moved —
  scoping that label per checklist item 5.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Seats actually practicing **rule + record** (cross-rung contradictions filed as
  `disposition: note` findings naming both rungs) · why deferred: the ladder is judgment guidance —
  prompt-enforced, deliberately schema-free (spec §9), so no pre-merge check can prove live seat
  behavior · runner: `/war-review` over the next completed multi-seat `/war` run (pairs naturally
  with the #1179 denial-rate comparison, same run).
- Lead phase-close bindings exercised as behavior (not just text) · why deferred: the refiner/main
  scope hook fail-opens — Lead doctrine is prompt-enforced and only its text is guarded (spec §8)
  · runner: the next campaign close / Gate-2 pass, self-audited against the three bindings.
- **Retrospective replay against the 2026-07-26 campaign (spec §10.3 / D3 criterion)** — that the
  ladder yields `disposition: note` findings (not holds, not silence) for that campaign's plan-3
  stale ADR-Status finding and its servitor discrepancy, and **changes no verdict that was actually
  issued** · why deferred: the input is that campaign's already-closed audit records — its archived
  run manifests and per-seat audit logs live outside this diff and outside any surface a pre-merge
  gate or floor can read, and no verdict this plan lands can be replayed against them at merge time
  · runner: `/war-review` over the 2026-07-26 campaign's archived run manifests under
  `.claude/war/runs/`, replaying the recorded findings against the four ladders as a desk exercise ·
  timing: **before the next multi-seat campaign close**, so a destructive-to-past-verdicts result is
  caught before the ladder has adjudicated a second campaign. This is the only proposed check that
  the ladder is non-destructive against verdicts already issued; backstop 1 above cannot cover it
  (a future run has no already-issued verdicts to preserve).

## Notes / conscious deviations

- **Run config (operator-directed, 2026-07-28): default profile, all worker tiers fable/high.**
  Launch with `.claude/war/config.json` on the default (`balanced`) profile plus the operator's
  worker override — `agents.worker: { model: 'fable', effort: 'high', docs: { model: 'fable',
  effort: 'high' }, fix: { model: 'fable', effort: 'high' } }` — so every worker spawn (base,
  docs-tier, and fix/ace rounds) runs fable/high. Auditor, servitor, and red-team stay at the
  profile defaults (`DEFAULTS` in `war-config.mjs` is the arbiter). With all three tiers pinned
  identically, the docs-vs-base mechanical classification (Task 1.1 all-`*.md`; Tasks 1.2/1.3
  mixed) no longer changes model or effort anywhere — it remains dispatch bookkeeping only.
  **The committed `.claude/war/config.json` does not match this bullet and must not be "corrected"
  to it:** on master that file still reads worker opus/max, docs sonnet/max, fix fable/xhigh —
  commit `496d777` rewrote only the plan/spec/roadmap prose, never the config. The campaign Lead
  applies the directed tiers **on disk, uncommitted, at launch**; a reader who edits this plan to
  agree with the stale committed file is undoing the operator's directive, not fixing a drift.
  (Note that Task 1.1 is no longer all-`*.md` — it now ships a `skill-doc-contracts.test.mjs` guard
  row — which changes nothing here precisely because all three tiers are pinned identically.)
- **Tasks 1.1 and 1.3 both edit `skills/war/assets/skill-doc-contracts.test.mjs`, and that is
  deliberate, not a same-file parallel collision.** The decomposition rule forbids file overlap
  between tasks that run *in parallel*; 1.1 and 1.3 do not — the phase runs 1.1 alone in wave 1,
  then 1.2 ∥ 1.3 in wave 2, so 1.3's worktree is cut after 1.1 has landed and the two edits reach
  the suite through the serial merge queue in order. Each adds its own row (1.1 the CONTEXT.md
  glossary guard, 1.3 the SKILL.md Lead-bindings guard); 1.3 resolves its row number at the rebased
  tip rather than assuming one. The parallel pair 1.2 ∥ 1.3 remains fully file-disjoint.
- **The `deps: [1.1]` edges are content dependencies, not collision dodges** — the parallel-wave
  file sets are disjoint. 1.2 and 1.3 cite the new ADR by its resolved number, which 1.1 authors;
  per the 2026-07-27 execution-outcome correction on the standing-doc sweep's red-team report, a
  task citing a sibling-authored artifact takes a real wave edge (same-wave "lands together" is not
  "builds together" — every worktree is cut from the frozen phase base).
- Spec §8 flags the `execution` shape name's one-token distance from the reserved
  `execution-evidence` lens; the CONTEXT.md `_Avoid_` line (Task 1.1) is the ratified mitigation.

## Open decisions

None open. The one item routed here is closed:

- **Done-report placement — CLOSED / CONFIRMED by red-team, 2026-07-28. No re-rank.** The spec's
  ranking stands, but two things about the way this plan described it were wrong and are corrected
  here, because Task 1.1's ADR and Task 1.2's card are authored *from* this description.
  - **Corrected description.** "Below all mechanical evidence in every ladder, above nothing" is
    imprecise. Ladder by ladder against spec §4.1: the done-report is a **bottom rung in
    `content-at-pin`** (rung 3 of 3) and a rung in **`execution`** (rung 3 of 4 — *not* above
    nothing: the absent-evidence arm sits below it, and the rung above it, refiner-reported inline
    gate result, is itself an agent report rather than mechanical evidence); it is **absent from
    `authority`** entirely; and in **`history`** a done-report claim falls under rung 2, "prose
    claiming history — a claim to verify, never evidence", which is **stricter** than a bottom rung.
    The accurate universal statement is spec §4.2's own floor clause: the working tree and the
    worker done-report are **never the top rung of any ladder**. Workers copying §4.1–§4.2 must
    generalize from that clause, never from the old parenthetical.
  - **Corrected provenance.** The spec's "the one rung not forced by a recorded lesson" is false —
    in the safe direction (it understates the support), but it left a settled question marked open.
    Spec §4.1 cites the forcing lesson inline on the very rung in question:
    `deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold` ("the probe is corroborating
    color, not the proof"; record as SOFT `note`, never a HARD hold). Three more force it
    independently: `worker-self-report-count-can-overstate-diff-additions` (a measured case where
    the done report claimed 10 and the diff had 5 — "a **claim to verify**, not a fact to record";
    archived, still queryable), `closure-rationale-infeasibility-claim-needs-code-trace-not-assertion`
    (an agent-authored "can't" overturned by a code trace), and
    `plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false` (mandated prose false
    against live code; correct disposition `note`, not `absorb`). No lesson anywhere in
    `docs/learnings/` ranks an agent self-report above a mechanical surface. Task 1.1's ADR should
    cite at least the first three in Consequences.
  - **Residual sharp edge, ADR material not a re-rank.** Spec §4.3 Lead binding (3) means a
    done-report claim the Lead threads into a dispatch prompt arrives as **`authority` rung 1** for
    the receiving agent — the inverse of the floor placement. The grounding duty in binding (3) is
    the mitigation; the ADR must state it as a **named consequence of the done-report's floor
    placement**, not as an unrelated Lead rule.
  - Spec §8's "one judgment call not forced by a recorded lesson" is left byte-unchanged (the spec
    is ratified); this plan carries the correction, and the ADR carries the citations.
