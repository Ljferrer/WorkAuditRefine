# References/pointer integrity — plugin-root-anchored agent-card pointers, link-guard hardening, and pointer debt

Issues: #1364, #1278, #1279, #1277, #1275, #1276
Source spec: `docs/specs/2026-08-06-references-pointer-integrity-design.md` (converted by `/war-machine --afk`; conversion base: checkpoint `ef22556` — every measured live surface below is byte-identical to `6fff2ee`, the batch's spec base, because the fifteen intervening checkpoint commits touch only `docs/plans/` + `docs/specs/`).

## Context — the gap / problem

1. **Agent-card references/ pointers are repo-relative and unresolvable from a foreign target
   repo** (verified: issue #1364 (2026-08-06)). The prompt-surface eviction pattern left the five
   agent cards routing to `skills/war/references/` (and `skills/_shared/`) files via
   repo-root-relative or `../`-prefixed markdown links; a dispatched seat's cwd is the target
   repo's task worktree, so on any repo other than the plugin itself the pointer fails to
   resolve, and the auditor's fail-closed read-only-git Bash guard denies expanding an
   environment variable to locate the real install root. Decisive blocking rules stay inline, so
   the loss is the anti-false-block enrichment — biasing dispatched auditors toward wrongly
   blocking legitimate work on non-plugin repos. Census at the conversion base (verified: live
   tree at conversion, `grep -nE '\]\((\.\./)*skills/' agents/*.md` → 13 line-hits):
   `war-auditor.md` 4 targets (→ `auditor-teach.md`), `war-worker.md` 3 (→
   `worker-servitor-edges.md`), `war-refiner.md` 3 (→ `refiner-recovery.md`), `war-servitor.md`
   1 (→ `worker-servitor-edges.md`), `war-setup-scout.md` 2 `../`-prefixed
   (`../skills/_shared/provision.mjs`, `../skills/war/references/schemas.md` — issue #1278's
   deferred backstop debt); zero `${CLAUDE_PLUGIN_ROOT}` occurrences anywhere under `agents/`.
2. **The mined lesson's precedent attribution is stale.** The lesson names "the
   plugin-root-anchored path form already used in hook error output"; no hook script emits that
   form — the live precedents are `hooks/hooks.json` (every hook command is
   `${CLAUDE_PLUGIN_ROOT}/hooks/<script>`) and the `SCRIPT` const in
   `skills/war/assets/workflow-template.js` (the provision-barrier dispatch literal
   `'${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh'`), whose expansion by the
   refiner seat's own shell is how every landed Provision barrier has run (verified: live tree at
   conversion — `hooks/hooks.json` command strings; `const SCRIPT` in `workflow-template.js`).
   [assumed: the variable is exported to Bash-capable dispatched seats generally, inferred from
   landed Provision barriers — if wrong: the anchored pointer degrades to unresolvable
   enrichment for that seat, decisive rules stay inline, nothing new blocks.]
3. **The pointer-shape guard family deliberately excludes `war-setup-scout.md`** — the Task 5.1
   worker/servitor-card-evictions test's exclusion comment ends "Add it here once they are
   repaired" (verified: live tree at conversion, `workflow-template.test.mjs`; 1 hit). The
   family today: the Task 1.2 grep-parity test's `refinerMd` count-pin (3) + `../`-absence pair,
   and the Task 5.1 test's worker (3) / auditor (4) count-pins, servitor presence
   `assert.match` (a match, not a count-pin), and worker/servitor/auditor `../`-absence asserts —
   eight shape asserts plus the D5-sanctioned duplicated `refinerMd` `../`-absence, all keyed to
   the bare owner-relative form, with 8
   `owner-relative` token hits and two "walks OUT of the repo" rationale sentences (verified:
   live tree at conversion, grep + read of both test regions).
4. **skills/war/SKILL.md owes an ADR 0042 trigger pointer** (verified: issue #1279 (2026-08-06)).
   The phase-close-revert doctrine landed as `## Phase-close polish reverts — never
   self-justifying` in `skills/war/references/resume-and-recovery.md` (verified: live tree at
   conversion, heading present), but the trigger pointer was deliberately not landed (cross-group
   file-collision avoidance); SKILL.md's three pointers into that file (at conversion) name only
   the Resume-reconciliation pre-flight, Resume-vs-recovery-relaunch (the staged-copy Workflow
   paragraph's pointer), and Checkpoint-outcome-handling sections, and `grep -Fc 'Phase-close
   polish reverts' skills/war/SKILL.md` → 0 (verified: live tree at conversion). ADR 0042: a
   references/ block without a trigger pointer is a defect.
5. **The auditor-teach step-4 citation has no presence guard** (verified: issue #1277
   (2026-08-06)). `auditor-teach.md` step 4 cites `` `submodule-flows.md` ``, section "Resume —
   submodule remote as co-source-of-truth" as a backticked filename + quoted section name (a
   non-link citation by resolved decision), and the file's header names the same filename;
   `reference-link-integrity.test.mjs` carries four tests (dead-link sweep, retired-citation
   absence, header truth, revert-doctrine construct — suite run at conversion: 4 pass / 0 fail)
   and none pairs that citation to the real heading, so a heading rename silently re-orphans it.
6. **The OLD-absent caveat pattern is whitespace-brittle** (verified: issue #1275 (2026-08-06),
   reproduced by the prior Lead at `44c28c8`). `RETIRED_REBASING_CAVEAT` is `/link paths inside
   the moved blocks/i`; a normal markdown line-wrap inside the phrase reintroduces the retired
   doctrine while the suite stays green and the plan-mandated grep floor reads 0 hits. Secondary,
   same file: `headerRegion` returns the whole file when a scanned file has no `## ` heading — an
   unintended fail-open documented in its own docstring ("the whole file when it has none", 1 hit
   at the conversion base). The NEW-present half `/at eviction time/i` shares the single-space
   brittleness (verified: live tree at conversion, both constructs read).
7. **A polish comment mints a false doc claim in the pointer-guard family** (verified: issue
   #1276 (2026-08-06)). The comment above the appended `refinerMd` assert claims the refiner card
   "must be held by an assert too — otherwise 606b72b can silently regress" (1 hit at the
   conversion base), but the file already carried the Task 1.2 count-pin + any-depth
   `../`-absence pair for that card — the appended assert is harmless duplication and the comment
   is false. Secondary cosmetic: `worker-servitor-edges.md`'s header reflow strands the
   backticked `skills/war/assets/workflow-template.js` path alone on a short line (verified: live
   tree at conversion, file header).
8. **Doc-truth cascade the fix itself creates** (survey-derived, verified: live tree at
   conversion — 1 hit of `no path form resolves` under `skills/war/references/`).
   `worker-servitor-edges.md`'s header asserts "On a foreign target repo no path form resolves
   this file at all"; once the anchored form lands, that sentence is false for Bash-capable
   seats. The prior campaign ratified adjudication O(3) — "no plugin-root anchor is introduced" —
   as a scoped decision of plan `2026-08-02-references-pointer-link-truth`; this plan supersedes
   the anchor half while keeping O(1) (pointer = best-effort enrichment, decisive rules inline)
   intact, recorded as an ADR, never silent drift.

## Pivotal constraints

- **O(1) survives untouched:** a references/ pointer is best-effort enrichment, never the sole
  carrier of a blocking rule. Every decisive-rules-inline digest on every card stays byte-intact.
- **The anchor supersession is explicit, never silent:** changing the family shape lands its own
  decision record (the new ADR) and an OLD-shape-absent gate (default-flip discipline,
  war-strategy authoring rule 6).
- **The guard travels with the fact (ADR 0025):** every pointer edit and every re-pinned shape
  assert land in the same diff — one task owns all five cards AND `workflow-template.test.mjs`;
  the setup-scout family extension lands in the same diff as its link repair (issue #1278's ask).
- **Auditor guard discipline untouched:** no verb widening in `hooks/validate-auditor-git.sh`, no
  hook edits at all; `fetch` stays excluded.
- **No `workflow-template.js` edits:** all guard work lands in `workflow-template.test.mjs` and
  `reference-link-integrity.test.mjs`; the template's block-span census and the negative
  `!setup-scout` barrier assert scan the template, not the test file, so the family extension
  cannot trip them (verified: live tree at conversion — the barrier-wiring asserts and
  `EXPECTED_BLOCK_SPANS` census read the `code`/`src` template string).
- **Line-based grep cannot see a line wrap:** every hand grep for a multi-word phrase is a
  completeness floor, never the authority; the suite's whitespace-tolerant regex is the check of
  record, and every sweep carries the mandatory manual same-scope survey.
- **Serial-merge doc truth:** the gate runs at every serial merge, so no intermediate integration
  state may red the suites — the deps edges below (resolver before cards; header re-truth after
  cards) exist for exactly this.
- **Platform law (plan 10's refined wording):** literals and mid-pattern metacharacters →
  `grep -F`; anchors are regex.
- **Budget law (ADR 0042):** every agent card and `skills/war/SKILL.md`/`CONTEXT.md` are
  budgeted surfaces (`prompt-surface-budgets.test.mjs`); over-hard is a red test. Measured at
  conversion: `war-refiner.md` 32,368 B (advisory 30,720 — already over; hard 34,816 — ~2.4 KB
  headroom, LESS after plans 3 and 9 add card prose); `war-auditor.md` 24,624 B (48 B over its
  24,576 advisory; hard 28,672); `war-worker.md` 9,761 B (advisory 10,240 — plan 9's addition
  plus this plan's may trip it); `skills/war/SKILL.md` 63,197 B (advisory 64,512 — plans 9, 10,
  12 add before this plan); `CONTEXT.md` 114,449 B (already over its 111,616 advisory; hard
  126,976 — a pre-plan-5-shrink snapshot: plan 5's D14 retargets it ≤ 111,616 B at its land, see
  Task 1.5). Advisory trips are warning-class: cite ADR 0042's justification rule in the commit
  body; never thin guarded prose to compensate.
- **Anchor by named construct, never line number** — every edit site below is named by test
  title, const name, function name, or heading.
- **All touched prose stays redaction-lint clean** (no home paths, emails, handles, credentials).

## Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Agent-card pointer anchor form | `${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>.md` (and `${CLAUDE_PLUGIN_ROOT}/skills/_shared/<file>` for the setup-scout provision link) as the single family shape on all five agent cards |
| D2 | Scope of normalization | Markdown link targets pointing into `skills/` only; backticked non-link `references/schemas.md` citations and the refiner card's `../docs/adr/` link are out of scope (Non-goals) |
| D3 | Unexpanded-placeholder fallback | One standing resolution line per card: when the placeholder arrives unexpanded and the repo under review is the plugin itself, strip the `${CLAUDE_PLUGIN_ROOT}/` prefix and resolve repo-relative [assumed: default, self-adjudicated — if vetoed by /red-team: drop the line and record the accepted residual explicitly (ADR 0017), never a prose waiver] |
| D4 | Pointer-shape guard family | Re-pin all eight existing shape asserts to the anchored form; add an OLD-shape-absent assert (no bare `](skills/` link target in any card); extend the family to `war-setup-scout.md` (count-pin of 2 + `../`-absence); retire the deliberate-exclusion comment |
| D5 | #1276 duplicate assert | Keep the duplicated `refinerMd` assert (family locality); correct the false comment to state consolidation alongside the pre-existing Task 1.2 count-pin + `../`-absence guards, keeping the ADR 0025/0031 equivalence-class rationale |
| D6 | Link-resolution sweep vs the new form | `reference-link-integrity.test.mjs` Arm 1 maps a leading `${CLAUDE_PLUGIN_ROOT}/` to the repo root (plugin root ≡ repo root in this repo); its skeleton/exclusion comments are re-truthed |
| D7 | Whitespace-brittle patterns | `RETIRED_REBASING_CAVEAT` → `/link\s+paths\s+inside\s+the\s+moved\s+blocks/i`; NEW-present half → `/at\s+eviction\s+time/i`; each positive control gains a wrapped (embedded-newline) literal so the wrap axis is non-vacuously proven |
| D8 | `headerRegion` fail-open | Fail closed: a scanned file with no `## ` heading is an assertion failure at the call site naming the file, never a silent whole-file check; the docstring's fallback sentence goes with it |
| D9 | #1277 presence guard | New arm: extract the backticked filename + quoted section name from `auditor-teach.md` step 4 (fail closed on a parse miss), assert the file exists under `skills/war/references/` and carries a `## ` heading containing that section name; also assert `auditor-teach.md`'s header region names the same filename |
| D10 | #1279 trigger pointer | One pointer on `skills/war/SKILL.md` in the fixed `when <trigger>, read references/<file>` shape, naming the landed heading verbatim, placed beside either phase-close sweep bullet — the `**Sweeps (phase-close, ADR 0012)**` bullet or the `**The phase-close sweep is fail-open**` bullet (worker's choice, exactly one pointer); SKILL.md keeps its own bare `references/<file>` owner-relative skeleton |
| D11 | worker-servitor-edges.md header | Re-truth the "no path form resolves this file at all" sentence to name the anchored pointer + the auditor residual (O(1) still standing), and unstrand the lone backticked template path in the same edit |
| C1 | Task carve (conversion) | Spec §4.1/§4.2 name separate workers for cards vs guard file; this plan merges them into ONE task — the pivotal constraint (guard travels with the fact) plus rule 1 (counts + cards flip atomically w.r.t. the serial-merge gate) bind them; no guard-split remains, so rule 7 is not in play |
| C2 | Deps edges (conversion) | Content edges only: cards task after the resolver task (Arm 1 must accept the anchored form before any card carries it — otherwise the dead-link sweep reds at the cards task's merge gate); header re-truth after the cards task (its re-truthed sentence is false until the anchored pointers land). Neither dodges a same-file collision |
| C3 | Arm-1 comment wording (conversion) | Worded against resolver tolerance (file-relative, repo-root-relative, and anchored all resolve; shape enforcement is per-card in `workflow-template.test.mjs`) so the comment is true at every intermediate serial-merge state — a tightening of the spec's "re-truth" |
| C4 | Lesson stamp (conversion) | #1364's mined lesson `docs/learnings/archive/agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo.md` is stamped `RESOLVED (references-pointer-integrity, #1364, <land date>)` in the fixing task, body/keywords untouched (batch precedent, plan 10 D14) |
| C5 | ADR number (conversion) | `0047` at conversion (head is `0046`); resolve the next free number at land time — the number literal is non-authoritative, same law as version literals. Wave-1 in-suite comment citations reference the ADR by slug/title (`agent-card-pointer-skeleton-plugin-root-anchored`), never by number — Task 1.1 shares the frozen base with Task 1.5, where no number is knowable (AI-declared) |
| C6 | D3 line pin (conversion) | The resolution line's wording latitude is bounded: it must contain the literal fragment `strip the ${CLAUDE_PLUGIN_ROOT}/ prefix`, state both guard conditions (placeholder unexpanded AND repo under review is the plugin itself), and carry no `](skills/` byte sequence |

## Assumptions ledger

- **A1 — `${CLAUDE_PLUGIN_ROOT}` is exported to Bash-capable dispatched seats** · basis: every
  landed Provision barrier runs the `SCRIPT` const via seat-shell expansion · blast radius: if
  wrong, the anchored pointer degrades to unresolvable enrichment for that seat; decisive rules
  stay inline; nothing new blocks · check: the landed provision runs; the backstop probe.
- **A2 — harness substitution of the placeholder in agent-card body text is unverified from the
  tree** · basis: none available in-tree · blast radius: if absent, resolution rides seat-shell
  expansion only and the auditor rests on the D3 fallback line; behavior on foreign repos is
  never worse than today's unresolvable bare form · check: the red-team-provable probe (backstop
  row 1) — dispatch a throwaway auditor-type probe whose card carries the placeholder and observe
  whether the text arrives substituted, before ratification.
- **A3 — D3 adopted as the default (AI-declared self-adjudication)** · basis: the spec supplies
  the default and the veto fallback · blast radius: if /red-team vetoes, the line is dropped and
  the plan records the accepted residual explicitly (WAR-on-itself auditors lose deterministic
  resolution, fall back to model inference) — an ADR 0017 residual record, never a prose waiver ·
  check: the red-team round.
- **A4 — no committed predecessor adds a `skills/`-targeting link to any agent card** · basis:
  plans 3, 6, and 9's card slices mandate prose/enumeration additions, no links (verified against
  their committed `- Files:` slices at conversion) · blast radius: if wrong, the 4/3/3/1/2 census
  and the family count-pins move · check: Task 1.2 re-measures every count at the rebased base —
  a moved count is re-pinned, never guard-dropped.
- **A5 — all four `QUALIFIED_HEADERS` files carry a `## ` heading at the dispatch base** ·
  basis: verified at conversion (heading lists read for all four) · blast radius: if a
  predecessor removed one, the D8 fail-closed flip would red at land · check: Task 1.1 runs the
  suite before and after its edits.

## Non-goals / deferred

- **Backticked non-link `references/schemas.md` citations** on the auditor/worker/refiner Return
  lines — pre-existing house idiom, same foreign-repo exposure, deferred to keep this pass to
  markdown link targets (a follow-up may normalize them under the new ADR).
- **The refiner card's `../docs/adr/` link** — resolves file-relative from `agents/` and carries
  no `skills/` segment; the family patterns deliberately do not flag it.
- **Hook edits, verb-allowlist widening, or threading a resolved root through
  `workflow-template.js` dispatched prompts** — no template or hook changes in this plan.
- **Renaming or restructuring `submodule-flows.md`'s co-source-of-truth heading** — the #1277
  guard pins it; renames become a deliberate same-diff update.
- **SKILL.md's own owner-relative `references/<file>` pointer skeleton** — the anchor
  supersession applies to agent cards (dispatched seats); skill surfaces are read in-plugin.
- **Re-opening adjudication O(1)** — pointer-as-enrichment and decisive-rules-inline stand; only
  the anchor half of O(2)/O(3) is superseded, via the new ADR.
- **Files owned by sibling groups** — this plan touches no file region a committed 2026-08-06
  predecessor still owns (Notes 1); `docs/learnings/` bodies other than the C4 stamp are
  untouched.

## New domain terms · Recommended ADRs

- **Plugin-root-anchored pointer** (CONTEXT.md) — the `${CLAUDE_PLUGIN_ROOT}/`-prefixed
  agent-card link form that resolves against the plugin install root regardless of the dispatched
  seat's cwd; supersedes the owner-relative agent-card skeleton, remains best-effort enrichment
  under adjudication O(1).
- **ADR: Agent-card pointer skeleton is plugin-root-anchored** (next free number at land; 0047 at
  conversion) — records the supersession of the references-pointer-link-truth adjudication
  O(2)/O(3) anchor half, the seat-capability matrix, the corrected precedent attribution
  (Context 2), and the OLD-shape-absent gate discipline.

## AI-Commander's Intent

- **Purpose:** a dispatched seat on ANY target repo can resolve every agent-card references/
  pointer — the five cards carry one family shape, plugin-root-anchored, with the old shape
  mechanically extinct and the whole family (setup-scout included) count-pinned and
  OLD-shape-guarded; the reference sweep that polices those pointers can no longer be evaded by a
  line wrap, a heading-less file, or a heading rename; the phase-close revert doctrine is
  discoverable from its operative surface; and every doc claim this change makes stale — the
  false unguarded-card comment, the no-path-form header sentence — is re-truthed in the same
  campaign, with the supersession of the prior anchor decision recorded as an ADR, never as
  drift. (AI-declared)
- **Method:** teach the link-resolution arm the anchored form first, then flip all thirteen card
  link targets and the eight shape asserts in one diff (guard travels with the fact), adding the
  OLD-shape-absent assert, the setup-scout count-pins, the D3 fallback line per card, and the
  #1276 comment correction; harden `reference-link-integrity.test.mjs` with whitespace-tolerant
  retirement patterns proven by wrapped positive controls, a fail-closed `headerRegion`, and a
  fail-closed step-4 citation presence arm; add the single ADR 0042 trigger pointer beside the
  phase-close sweep bullets; re-truth the `worker-servitor-edges.md` header behind a deps edge so
  no intermediate serial-merge state is false; author every shared-file edit against the
  post-predecessor shapes with halt-on-miss witnesses; record every mutation drill; keep every
  budgeted surface under its hard line and cite ADR 0042 on any advisory trip. (AI-declared)
- **Mechanism latitude** *(amendment 2026-08-17, #1431)*: the mechanisms Method names are reference
  realizations, implementer's choice — the whitespace-tolerant retirement patterns' construction
  (the `\s+` shapes and their composition), `headerRegion`'s fail-closed implementation internals,
  the mutation-probe mechanics (throwaway-copy technique and mutation sites), the wording of the
  per-card D3 resolution line and the CONTEXT.md term entry beyond the pinned fragments the
  End-state checks name, where in each suite file the new arms land, and the new ADR's number
  (resolved as next-free at land, per the plan's own rule). Substituting any of these mechanisms
  while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
  This clause never waives a check, gate, or backstop (ADR 0017) — End states pin outcomes, and
  each stays checkable as written. (AI-declared)
- **Binding guardrails** *(amendment 2026-08-17, #1431)*: the anchored family is count-complete per
  card and the OLD shape mechanically extinct (End states 1–2, 5) · guard travels with the fact —
  the card flip and its shape asserts land in one diff · no budgeted surface crosses its hard
  line, and any advisory trip cites ADR 0042 in the commit body · the `worker-servitor-edges.md`
  re-truth stays behind its `deps` content edge so no intermediate serial-merge state is false ·
  every mutation drill is demonstrated-RED and recorded. (AI-declared)
- **End state:**
  1. The five agent cards carry no bare or `../`-prefixed `skills/`-targeting link target ·
     check: `grep -nE '\]\((\.\./)*skills/' agents/*.md` → 0 hits (13 at the conversion base) —
     then the mandatory manual same-scope survey of each card's prose for non-link path
     citations, each straggler listed as a survey-derived correction. (AI-declared)
  2. The anchored family is count-complete per card · check:
     `grep -Fc '](${CLAUDE_PLUGIN_ROOT}/skills/' agents/war-auditor.md agents/war-worker.md
     agents/war-refiner.md agents/war-servitor.md agents/war-setup-scout.md` → 4/3/3/1/2 (all 0
     at the conversion base; re-baselined at the dispatch base if a predecessor moved a pointer —
     A4 says none does). (AI-declared)
  3. Each card carries the D3 resolution line · check:
     `grep -Fc 'strip the ${CLAUDE_PLUGIN_ROOT}/ prefix' <card>` = 1 for each of the five cards
     (0 at base); dropped entirely if /red-team vetoes D3 (A3's residual record then replaces
     this row). (AI-declared)
  4. Both guard suites are green at the tip · gate:
     `node --test skills/war/assets/workflow-template.test.mjs` and
     `node --test skills/war/assets/reference-link-integrity.test.mjs` → 0 fail (the second was
     4 pass / 0 fail at the conversion base — it must end ≥ 5 pass with the new arm).
     (AI-declared)
  5. A reintroduced bare `](skills/` link target on any card reds the OLD-shape-absent assert ·
     check: mutation probe in a throwaway copy of `agents/war-worker.md` — add one bare pointer,
     run the workflow-template suite, expect a failure naming the OLD shape; the red recorded
     verbatim in the done report. (AI-declared)
  6. The setup-scout family extension is live and the deliberate-exclusion comment is gone ·
     check: `grep -Fc 'Add it here once they are repaired'
     skills/war/assets/workflow-template.test.mjs` → 0 (1 at base) AND
     `grep -Fc 'setupScoutMd' skills/war/assets/workflow-template.test.mjs` ≥ 2 (0 at base — the
     read plus at least one assert). (AI-declared)
  7. The #1276 false comment is corrected · check:
     `grep -Fc 'must be held by an assert too' skills/war/assets/workflow-template.test.mjs` → 0
     (1 at base); `grep -Fc 'consolidat' skills/war/assets/workflow-template.test.mjs` ≥ 1 (0 at
     base), the hit inside the Task 5.1 family block. (AI-declared)
  8. A line-wrapped reintroduction of the retired caveat reds the header-truth arm — and the
     single-line variant still reds · check: mutation probes in a throwaway copy of
     `skills/war/references/submodule-flows.md` (two-line wrapped phrase, then single-line), run
     the link-integrity suite, expect a failure each time; both reds recorded in the done report.
     The standing locks are the `\s+` patterns plus their wrapped positive controls.
     (AI-declared)
  9. The retirement grep floor reads clean and is stated as a floor ·
     check: `grep -rinF 'link paths inside the moved blocks' skills/war/references/` → 0 hits,
     the arm's comment states the grep-floor duty (line-based, cannot see wraps; the suite regex
     is the authority) — then the mandatory manual same-scope survey of the scanned roots'
     headers and the suite's own comments for paraphrased reintroductions, stragglers listed as
     survey-derived corrections. (AI-declared)
  10. `headerRegion` fails closed · check:
      `grep -Fc 'the whole file when it has none'
      skills/war/assets/reference-link-integrity.test.mjs` → 0 (1 at base — the docstring's
      fallback sentence); mutation probe — strip every `## ` heading from a throwaway copy of a
      `QUALIFIED_HEADERS` file, run the suite, expect an assertion naming the file; the red
      recorded in the done report. (AI-declared)
  11. Renaming `submodule-flows.md`'s co-source-of-truth heading reds the #1277 presence arm ·
      check: `grep -Fc 'step-4 citation'
      skills/war/assets/reference-link-integrity.test.mjs` ≥ 1 (0 at base — the new arm's title
      names it); mutation probe — rename the heading in a throwaway copy, run the suite, expect
      a failure citing the step-4 citation; the red recorded in the done report. (AI-declared)
  12. The #1279 trigger pointer exists in the fixed ADR 0042 shape naming the landed heading ·
      check: `grep -Fn 'Phase-close polish reverts' skills/war/SKILL.md` → ≥ 1 hit (0 at base)
      on a line that also routes to `references/resume-and-recovery.md`. (AI-declared)
  13. The stale cross-repo header claim is gone and the stranded path line is reflowed · check:
      `grep -Fc 'no path form resolves' skills/war/references/worker-servitor-edges.md` → 0 (1
      at base); the header region still matches `/at eviction time/i` (the Arm-3 NEW-present
      lock);
      then the mandatory manual survey of the remaining `references/` headers for sibling copies
      of the retired claim, stragglers listed as survey-derived corrections. (AI-declared)
  14. The supersession ADR and the CONTEXT.md term are landed · check: a new
      `docs/adr/00NN-agent-card-pointer-skeleton-plugin-root-anchored.md` exists at the next
      free number (0047 at conversion) with Status Accepted AND
      `grep -Fc 'Plugin-root-anchored' CONTEXT.md` ≥ 1 (0 at base). (AI-declared)
  15. The mined lesson is stamped RESOLVED, body/keywords otherwise untouched, and the redaction
      lint stays green · check: `grep -Fc 'RESOLVED (references-pointer-integrity'
      docs/learnings/archive/agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo.md`
      = 1 (0 at base) · gate: the self-discovery gate (the war-memory lint wrapper is a
      discovered member). (AI-declared)
  16. No budgeted surface crosses its hard line; every touched budgeted surface's size is
      re-measured at the rebased base and recorded · gate:
      `node --test skills/war/assets/prompt-surface-budgets.test.mjs`; advisory trips cite
      ADR 0042's justification rule in the commit body (the refiner arithmetic in Pivotal
      constraints is the watch item). (AI-declared)
  17. The full gates are green at the integrated tip with zero production-behavior diff — the
      landed Phase-1 diff touches only the five agent cards, the two guard suites,
      `skills/war/SKILL.md`, `skills/war/references/worker-servitor-edges.md`, the new ADR,
      `CONTEXT.md`, and the stamped lesson · gate: the self-discovery gate (`resolveGate` in
      `war-config.mjs`) — `node --test 'skills/**/*.test.mjs'` and the documented hooks/skills
      shell-test loop both exit 0; the footprint judged at audit_sha. (AI-declared)
  18. Every plan-tracked issue is cited by at least one commit in the phase range `<phase-base>..<tip>` — #1364 + #1278 for the card flip and family
      extension, #1276 for the comment correction and header re-truth, #1275 + #1277 for the
      sweep hardening, #1279 for the trigger pointer · HARD at audit_sha (git log between the
      phase base and the tip; execution-evidence seat). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)* (AI-declared)
  19. Release: all four version slots move lock-step to the next free patch above the live
      integration base at land time · check:
      `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence judged at audit_sha). (AI-declared)

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.3, 1.5 — file-disjoint, no deps; wave 2 = Task 1.2, `deps: [1.1]`;
wave 3 = Task 1.4, `deps: [1.2]`) → Phase 2 (release).

The deps edges are content edges (C2), not guard-splits: Task 1.2's re-pinned family travels with
the cards it pins inside one task (C1 — rule 7 dissolved by same-task ownership); 1.2 needs 1.1's
resolver so the dead-link sweep is green at 1.2's serial merge; 1.4 needs 1.2 so its re-truthed
header sentence is never false at an intermediate integration state. The binding cross-PLAN
ordering (this plan after plans 3, 6, 9, 10, and 12 on shared files) is enforced by the tasks'
halt-on-miss witnesses, not by intra-plan structure.

## Phase 1 — Anchored pointer family, sweep hardening, pointer debt, doc truth

### Task 1.1: reference-link-integrity.test.mjs hardening — anchored-form resolution, whitespace-tolerant patterns, fail-closed extraction, #1277 presence arm

- Files: `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: base-resident constructs — no committed 2026-08-06 plan touches this file,
  `skills/war/references/auditor-teach.md`, or `skills/war/references/submodule-flows.md`
  (verified against all twelve committed plans' `- Files:` lines at conversion); no witness
  needed, but re-read the file at the rebased base before editing.
  **(a) Arm 1 — anchored-form resolution (D6):** in the dead-link test, a link target beginning
  with the literal `${CLAUDE_PLUGIN_ROOT}/` resolves its remainder against `REPO_ROOT` (plugin
  root ≡ repo root in this repo), for both scan dirs. The matcher literal must be spelled so JS
  never interpolates it — a plain single-quoted string or an escaped form, never inside a JS
  template literal (the template-placeholder family: here the placeholder is data). Comment
  re-truth per C3: rewrite the RESOLUTION-ONLY comment block (the "deliberately
  repo-root-anchored … (adjudication O(2))" sentence) and the "Link SHAPE stays per-card"
  paragraph to state resolver TOLERANCE — file-relative, repo-root-relative, and
  plugin-root-anchored targets all resolve; the ratified card family shape is the anchored form
  (cite the supersession ADR by slug/title — `agent-card-pointer-skeleton-plugin-root-anchored` —
  never by number: this seat is wave 1, cut from the same frozen base as Task 1.5, so no ADR is
  landed there and any number literal is a guess a predecessor's own new-ADR work can shift;
  C5 — AI-declared); shape enforcement stays per-card in
  `workflow-template.test.mjs` — and delete the setup-scout deferred-links parenthetical (its
  scan-wide-assert rationale is unchanged; the two named links are repaired by Task 1.2, and
  deleting the parenthetical early is safe — it explains an assert this arm still does not
  have).
  **(b) Arm 3 — whitespace-tolerant patterns (D7, #1275):** `RETIRED_REBASING_CAVEAT` →
  `/link\s+paths\s+inside\s+the\s+moved\s+blocks/i`; the NEW-present pattern →
  `/at\s+eviction\s+time/i`; add one wrapped positive control per pattern — a literal carrying an
  embedded newline inside the phrase — beside the existing single-line controls (both axes
  non-vacuous); extend the arm's grep-floor comment with the duty: the hand grep (`grep -rinF`)
  is line-based and cannot see wraps — it remains a completeness floor only, the suite regex is
  the authority.
  **(c) `headerRegion` fail-closed (D8, #1275 secondary):** return `null` when the text has no
  `## ` heading; every call site asserts non-null naming the file; delete the docstring's
  fallback sentence ("the whole file when it has none" — End state 10's OLD-absent pin). All
  four `QUALIFIED_HEADERS` files carry headings at the conversion base (A5), so the flip cannot
  red at land.
  **(d) #1277 presence arm (D9):** a new test whose title names the **step-4 citation** —
  extract the backticked filename + quoted section name from `auditor-teach.md`'s step 4 (the
  live shape: `` `submodule-flows.md` ``, section "Resume — submodule remote as
  co-source-of-truth"); FAIL CLOSED if the citation shape parses to nothing (the
  enumerated-destination existsSync fail-open lesson — an absent citation is an assertion, never
  a skip); assert the named file exists under `skills/war/references/`, carries a `## ` heading
  containing the quoted section name, and that `auditor-teach.md`'s own header region mentions
  the same filename. No edit to `auditor-teach.md` planned; if the extraction needs a firmer
  citation shape, the same-diff edit is sanctioned (spec §5).
  **(e) Mutation drills, recorded verbatim in the done report:** the wrapped two-line
  reintroduction red + the single-line red (End state 8); the headings-stripped copy red naming
  the file (End state 10); the heading-rename red citing the step-4 citation (End state 11).
  Run each against a throwaway copy, never the live file (the red-team sandbox-residue lesson).
  **(f) Sweep:** `grep -rinF 'link paths inside the moved blocks' skills/war/references/` → 0
  hits — then, mandatorily, hand-scan the scanned roots' headers and this suite's own comments
  for paraphrased reintroductions the literal grep misses; list each straggler as a
  survey-derived correction; record the outcome even at zero. (Self-match safety: this file's
  pattern literals live in a `.mjs` outside the `*.md` scan set — the standing self-match note
  atop the file.) Commits cite #1275 and #1277 — End state 18.
- Done when: `node --test skills/war/assets/reference-link-integrity.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Card normalization + pointer-shape guard family — one atomic diff (#1364 + #1278 + #1276-comment + lesson stamp)

- Files: `agents/war-auditor.md`, `agents/war-worker.md`, `agents/war-refiner.md`, `agents/war-servitor.md`, `agents/war-setup-scout.md`, `skills/war/assets/workflow-template.test.mjs`, `docs/learnings/archive/agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo.md`
- Plan slice: **Witness first (halt-on-miss)** — after the standard rebase onto the integration
  tip (which carries Task 1.1 via the deps edge), verify
  `grep -c 'done_when_log_path' agents/war-refiner.md` ≥ 1 (plan 3's Return row) AND
  `grep -c 'file-followups' agents/war-refiner.md` ≥ 1 (plan 9's card sections) AND
  `grep -Fc 'ABORTED' agents/war-auditor.md` ≥ 1 (plan 6's truncation clause) AND
  `grep -c 'file-followups' skills/war/assets/workflow-template.test.mjs` ≥ 1 (plan 9's suite
  coverage) AND `grep -Fc 'slice(m.index)' skills/war/assets/workflow-template.test.mjs` = 0
  (plan 10's D6 bounding — 1 at the conversion base, so it cannot pass at the un-landed base;
  every other witness token is 0 at base, none vacuous). A miss means a predecessor has not
  landed: **halt and report, never improvise.** Then re-measure the dated counts (A4): the
  `grep -nE '\]\((\.\./)*skills/' agents/*.md` census (13 line-hits / 4-3-3-1-2 per card at
  conversion), the `owner-relative` token count (8 at conversion, all in the pointer family),
  and `wc -c` on all five cards — a moved count is re-pinned, never guard-dropped.
  **(a) Card normalization (D1/D2, #1364 + #1278):** rewrite every `skills/`-targeting markdown
  link target on the five cards to the anchored form — link text unchanged, surrounding prose
  unchanged except (b). Snapshot at conversion: auditor 4 (`auditor-teach.md`), worker 3
  (`worker-servitor-edges.md`), refiner 3 (`refiner-recovery.md`), servitor 1
  (`worker-servitor-edges.md`), setup-scout 2 (`../skills/_shared/provision.mjs` →
  `${CLAUDE_PLUGIN_ROOT}/skills/_shared/provision.mjs`; `../skills/war/references/schemas.md` →
  `${CLAUDE_PLUGIN_ROOT}/skills/war/references/schemas.md`). The refiner card's `../docs/adr/`
  link and every backticked non-link citation stay byte-untouched (Non-goals).
  **(b) D3 resolution line, one per card (C6):** a single tight standing sentence stating: when
  the placeholder arrives unexpanded AND the repo under review is the plugin itself, strip the
  `${CLAUDE_PLUGIN_ROOT}/` prefix and resolve repo-relative. Bounded latitude: the line must
  contain the literal fragment `strip the ${CLAUDE_PLUGIN_ROOT}/ prefix` (End state 3's pin) and
  must not contain the byte sequence `](skills/` (the OLD-shape-absent assert scans whole
  cards). Keep it to one sentence per card — five budgeted surfaces (Pivotal constraints).
  **(c) Guard family re-pin (D4):** in `workflow-template.test.mjs` — re-key the eight shape
  asserts to the anchored form: the **Task 1.2 grep-parity** test's `refinerMd` count-pin (3) +
  any-depth `../`-absence pair, and the **Task 5.1 worker/servitor card evictions** test's
  worker (3) / auditor (4) count-pins, the servitor presence `assert.match` (re-keyed as the
  match it is — upgrading it to a count-pin is worker latitude, not a mandate; AI-declared), and
  the worker/servitor/auditor (plus D5-duplicated refiner) `../`-absence asserts. Every assert
  message and O(2)-citing comment is rewritten in the same edit — the `owner-relative` token (8
  hits at conversion) and BOTH "walks OUT of the repo" rationale sentences (the token sweep's
  known stragglers, one in each family block) become false bytes after the flip; the rewritten
  comments cite the new ADR and note adjudication O(1) still standing. The `../`-absence asserts
  stay (the anchored form carries no `../`).
  **(d) OLD-shape-absent assert (D4):** no card may carry a bare `](skills/` link target — scan
  all five card strings (add the `setupScoutMd` readFileSync; the file reads only four cards at
  conversion). A count-pin on the new form alone stays green when a stale bare pointer is ADDED
  beside the pinned ones — this assert is the default-flip OLD-absent gate (authoring rule 6).
  **(e) Setup-scout family extension (D4, #1278):** count-pin its two anchored links + the
  any-depth `../`-absence pattern; replace the deliberate-exclusion comment (the one ending "Add
  it here once they are repaired") with the coverage row. The guard lands in the same diff as
  the link repair (issue #1278's own ask; ADR 0025).
  **(f) #1276 comment correction (D5):** keep the duplicated `refinerMd` assert (family
  locality); rewrite the false comment — the assert consolidates the pointer-shape family
  alongside the pre-existing Task 1.2 count-pin + `../`-absence guards; keep the ADR 0025/0031
  equivalence-class rationale; the "must be held by an assert too — otherwise 606b72b can
  silently regress" claim is gone (End state 7).
  **(g) Lesson stamp (C4):** prefix the mined lesson's frontmatter `description` with
  `RESOLVED (references-pointer-integrity, #1364, <land date>)`; body/keywords otherwise
  byte-untouched — the body's stale "hook error output" precedent attribution stays per the
  stamp convention; the ADR (Task 1.5) records the corrected precedent, so the correction is not
  lost. The redaction lint gates the edit (a discovered gate member).
  **(h) Budget duty (ADR 0042):** re-measure `wc -c` on all five cards at the rebased base and
  record each in the done report; run
  `node --test skills/war/assets/prompt-surface-budgets.test.mjs` (over-hard is red). The
  arithmetic to watch: `war-refiner.md` 32,368 B at conversion + plans 3/9's additions against
  its 34,816 B hard line — this task adds ~66 B of anchor prefixes + one D3 sentence there;
  `war-auditor.md` is already 48 B over its advisory (warning-class); `war-worker.md` may trip
  its 10,240 B advisory after plan 9's sentence plus this task's. Advisory trips cite ADR 0042's
  justification rule in the commit body; never thin guarded prose to compensate.
  **(i) Mutation drill (End state 5):** throwaway copy of `agents/war-worker.md` + one bare
  `](skills/war/references/` pointer → workflow-template suite red naming the OLD shape;
  recorded verbatim in the done report.
  **(j) Sweep:** `grep -n 'owner-relative' skills/war/assets/workflow-template.test.mjs` → 0
  after the rewrite (8 at conversion, all family-descriptive) — then, mandatorily, hand-scan the
  family blocks' test titles, comments, and assert messages for shape descriptions the token
  sweep misses (the two "walks OUT of the repo" sentences are the pre-identified stragglers) —
  and the End-state-1 card survey: hand-scan each card's same-scope prose for non-link path
  citations (known finds at conversion: the backticked `references/schemas.md` Return-line
  citations, deferred per Non-goals) and list every other straggler as a survey-derived
  correction; record all outcomes even at zero. Adjacency caution: plan 10's D6 re-land-arm
  block sits directly below the Task 5.1 family block — re-read the post-rebase file before
  editing; touch nothing below the family's closing brace. Commits cite #1364 + #1278 (a, b, c,
  d, e, g) and #1276 (f) — End state 18.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs && node --test skills/war/assets/reference-link-integrity.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: skills/war/SKILL.md — the ADR 0042 trigger pointer (#1279)

- Files: `skills/war/SKILL.md`
- Plan slice: **Witness first (halt-on-miss)** — after the standard rebase, verify
  `grep -c 'clock read' skills/war/SKILL.md` ≥ 1 (plan 9's Task 1.3 landed) AND
  `grep -c 'backticks' skills/war/SKILL.md` ≥ 1 (plan 10's Task 1.2 landed) AND
  `grep -Fc 'This reverts commit' skills/war/assets/skill-doc-contracts.test.mjs` ≥ 1 (plan 12's
  Task 1.1 landed — its SKILL.md Gate-2 prose lands in the same commit as that key; all three
  tokens are 0 at the conversion base, none vacuous). A miss ⇒ **halt and report.**
  **The pointer (D10):** one bullet beside either phase-close sweep bullet — the
  `**Sweeps (phase-close, ADR 0012)**` bullet or the `**The phase-close sweep is fail-open**`
  bullet, worker's choice, exactly one pointer — in the fixed ADR 0042 shape: when judging or authoring a revert of a phase-close
  polish commit, read
  `[references/resume-and-recovery.md](references/resume-and-recovery.md)`
  (§ Phase-close polish reverts — never self-justifying). The heading is named verbatim (it
  exists at the conversion base); the link keeps SKILL.md's own bare owner-relative
  `references/<file>` skeleton (Non-goals — the anchor supersession is agent-cards-only). No
  edit to `resume-and-recovery.md` itself.
  **Region + pin safety:** the insertion is construct-disjoint from every committed
  predecessor's SKILL.md region (plan 9: Decompose step 1 / Run-manifest stamps / Per-phase
  ghUser / Checkpoint floor / Setup step 2; plan 10: the Decompose step-3 `**Done-when intake`
  lead-in; plan 12: the Gate-2 `**Pre-push staged-file check` bullet) — re-read the post-rebase
  file before editing. The delta introduces no `ensure-origin` token, no CLI-verb phrasing for
  the four doc-cli-consistency modules, and sits inside no bounded extraction region — run
  `node --test skills/war/assets/skill-doc-contracts.test.mjs` before and after; both green.
  **Budget:** 63,197 B at conversion against the 64,512 B advisory, and plans 9/10/12 add ahead
  of this task — re-measure `wc -c skills/war/SKILL.md` at the rebased base, record it; on an
  advisory trip cite ADR 0042's justification rule in the commit body (hard 73,728 B is not
  approachable). Commit cites #1279 — End state 18.
- Done when: None — prose-only doc edit; the mechanical pins are End state 12's grep plus the
  discovered gate (skill-doc-contracts + the doc suites read this file).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: worker-servitor-edges.md header re-truth + reflow (#1276 secondary + D11)

- Files: `skills/war/references/worker-servitor-edges.md`
- Plan slice: **first act after the deps-edge rebase:** re-read the landed cards at the
  integration tip — the sentence must describe the pointer form Task 1.2 actually landed, never
  this plan's paraphrase of it. One edit to the file's header region (the text before
  `## Submodule task mechanics`): re-truth the "On a foreign target repo no path form resolves
  this file at all" sentence — the plugin-root-anchored pointer now resolves for Bash-capable
  seats; the auditor residual (resolution resting on harness substitution or the D3 fallback)
  and the dispatched-prompt carriers remain the operative mitigation; adjudication O(1)
  (pointer = enrichment, decisive rules inline) still standing — and reflow the stranded
  backticked `skills/war/assets/workflow-template.js` line into its sentence in the same edit.
  **Constraints:** the header region must still match `/at\s+eviction\s+time/i` (Task 1.1's
  NEW-present lock re-scans this file) and must not carry the retired caveat phrase in any
  wrapped form (the whitespace-tolerant retirement arm is live by this wave). Run
  `node --test skills/war/assets/reference-link-integrity.test.mjs` after the edit.
  **Sweep:** `grep -Fc 'no path form resolves' skills/war/references/worker-servitor-edges.md`
  → 0 (1 at conversion, the repo's only hit) — then, mandatorily, hand-scan the remaining
  `references/` file headers for sibling copies of the retired cross-repo claim; list each
  straggler as a survey-derived correction; record even at zero. Commit cites #1276 — End
  state 18.
- Done when: None — prose-only doc edit; the mechanical pins are End state 13's greps plus the
  link-integrity suite (a discovered gate member) re-scanning this file's header.
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

### Task 1.5: The supersession ADR + the CONTEXT.md term

- Files: `docs/adr/0047-agent-card-pointer-skeleton-plugin-root-anchored.md`, `CONTEXT.md`
- Plan slice: **ADR (C5 — number resolved to the next free at land; 0047 at conversion, head
  0046):** Status Accepted; records (a) the supersession of plan
  `2026-08-02-references-pointer-link-truth`'s adjudication O(2)/O(3) anchor half — the
  agent-card pointer skeleton is now `${CLAUDE_PLUGIN_ROOT}/`-anchored — while adjudication O(1)
  (pointer = best-effort enrichment, decisive rules inline) remains the invariant mitigation;
  (b) the seat-capability matrix — Bash-capable seats expand the placeholder in their own shell
  (the landed Provision-barrier precedent: `hooks/hooks.json` commands and the
  `workflow-template.js` `SCRIPT` const); the auditor's resolution rests on harness substitution
  (A2, probe-verified or recorded unverified) or the D3 fallback line; (c) the corrected
  precedent attribution — no hook script emits the form in error output; the mined lesson's
  attribution is stale and stays per the stamp convention, this ADR being the corrected record;
  (d) the OLD-shape-absent gate discipline (a family flip lands with a mechanical
  OLD-shape-absent assert, never a new-present count alone). Cite ADR 0042 (pointer doctrine),
  ADR 0025 (guard travels with the fact), ADR 0017 (no prose waivers — the D3-veto residual
  path).
  **CONTEXT.md:** add the **Plugin-root-anchored pointer** glossary entry (the New-domain-terms
  wording), placed with the pointer/reference-family terms; region-disjoint from committed plans
  5/6/8's CONTEXT.md edits — re-read at the rebased base; serial plan order absorbs the
  contention. Budget (measured against plan 5's post-shrink base — AI-declared): the 114,449 B
  conversion snapshot is pre-shrink; committed plan 5's D14 eviction retargets `CONTEXT.md` to
  ≤ 111,616 B including its own additions, so at the rebased base the file may sit UNDER the
  advisory and this entry could itself be the advisory-crossing event — if it is, the crossing
  carries its own ADR 0042 justification in the commit body. Keep the entry tight, re-measure
  `wc -c CONTEXT.md` at the rebased base before and after the edit, record both; hard 126,976 B
  is red (`prompt-surface-budgets.test.mjs`). Commits cite #1364 — End
  state 18.
- Done when: None — doc records; the mechanical pins are End state 14's checks plus the
  discovered gate.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb
  (replace-in-place, never an empty field, no badge) — to the **next free patch above the live
  integration base at land time**; never a resolved version literal (any version literal in this
  plan or the campaign roadmap is non-authoritative; 0.17.0 was the conversion-base slot value).
  Expected integration base: the tip after predecessors `2026-08-06-structural-pin-extractors`
  and `2026-08-06-gate2-publication-guard` (this plan's declared upstream edges) plus whichever
  other 2026-08-06 campaign predecessors the roadmap sequences ahead (ADR 0011 stack-and-plow).
  Standalone fallback: this plan does not run before plans 3, 6, 9, 10, and 12 — the Task
  1.2/1.3 witnesses halt-and-report a missing predecessor (never a downshift); on a witnessed
  plain-`/war` run, resolve the next free patch from the four slots themselves. The Status blurb
  names: agent-card references/ pointers normalized to the plugin-root-anchored
  `${CLAUDE_PLUGIN_ROOT}` form (resolving from any target repo, with the unexpanded-placeholder
  fallback line), the pointer-shape guard family extended (OLD-shape-absent assert +
  `war-setup-scout.md` coverage), the reference sweep hardened (whitespace-tolerant retirement
  patterns, fail-closed header extraction, a step-4 citation presence arm), and the phase-close
  revert doctrine's ADR 0042 trigger pointer landed — quoting only identifiers that exist in the
  landed diff (release-blurb lessons: count words match the enumeration; quoted literals
  byte-match landed identifiers; guard semantics stated no wider than the implementation — zero
  production-behavior change, all guards test-side and prose-side).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- The harness-substitution probe (A2): dispatch a throwaway auditor-type probe whose card text
  carries the placeholder and observe whether it arrives substituted · why deferred: unprovable
  from the tree — needs a live dispatch · runner: `/red-team`, before ratification (the spec
  names it red-team-provable); the outcome is recorded in the red-team report and threaded into
  the ADR's seat-capability matrix; a non-substituting harness downgrades nothing (A2's
  fallback). (AI-declared)
- The mutation drills of End states 5, 8, 10, and 11 (bare-pointer reintroduction; wrapped +
  single-line caveat reintroduction; headings-stripped copy; heading rename) · why deferred:
  delete-and-trace mutation runs are uncommittable by design — the committed asserts, wrapped
  positive controls, and fail-closed extractions are the standing locks · runner: the owning
  tasks' workers (1.1 and 1.2) run each against throwaway copies and record the reds verbatim in
  the done reports; gate-audit reads them SOFT, never a hold. (AI-declared)
- The manual survey halves of End states 1, 9, and 13 plus Task 1.2's family-block hand-scan ·
  why deferred: a hand-scan cannot be a mechanical gate member; done-report-only evidence ·
  runner: the owning task's worker — mandatory statement even at zero stragglers; the Lead
  re-runs the paired greps at phase close. (AI-declared)
- The predecessor witnesses on a standalone run · why deferred: a campaign run discharges them by
  spine order; only a plain-`/war` run can encounter the missing-predecessor state · runner:
  Tasks 1.2 and 1.3 run their greps as the first post-rebase act and halt-and-report on a miss —
  the standalone fallback is halt, never improvisation. (AI-declared)
- The budget valves (the refiner hard-headroom arithmetic; the SKILL.md / worker-card / CONTEXT.md
  advisory trips) · why deferred: measurable only at the rebased base, after plans 3/6/9/10/12's
  additions · runner: each owning worker re-measures `wc -c`, records it, and on an advisory trip
  cites ADR 0042's justification rule in the commit body; over-hard is the red
  `prompt-surface-budgets.test.mjs`. (AI-declared)
- Field evidence that a dispatched seat on a foreign target repo actually resolves an anchored
  reference (the whole point of D1) · why deferred: needs a live cross-repo campaign · runner:
  the next non-plugin-repo `/war` run's phase reports / `/war-review` friction review.
  (AI-declared)

## Notes / conscious deviations

1. **Stacking honesty — the full predecessor construct map (AI-declared).** This plan's files
   intersect five committed predecessors; every touch is enumerated and construct-disjoint, with
   witnesses pinning exactly the predecessor tasks that share the files:
   `agents/war-refiner.md` — plan 3 (the `## Return` `done_when_log_path` row) and plan 9 (the
   dispatch-flavor enumeration, the file-followups section, the `## Return` sentence, the D20
   provision carve-out) vs this plan's three link targets (the submodule-provisioning trigger,
   land step 3, the 2A/2B trigger) + one D3 sentence — different constructs;
   `agents/war-worker.md` — plan 9 (the `acceptance_criteria_covered` reporting line) vs the
   three worker-servitor-edges links + D3 line — different constructs;
   `agents/war-auditor.md` — plan 6 (the truncation clause appended to the D7 mapped-tests-grep
   bullet in the execution-evidence checklist) vs the four auditor-teach links (three submodule
   pre-flight bullets + the lens paragraph) + D3 line — different bullets, proximate in the lens
   region, so the worker re-reads the post-rebase card before editing;
   `skills/war/assets/workflow-template.test.mjs` — plans 3, 6, 9 (done-when/truncation/filing
   suites) and plan 10 (the D6 re-land-arm block + done-when threading pins) vs this plan's two
   pointer-family blocks — construct-disjoint but ADJACENT to plan 10's D6 block (directly below
   the Task 5.1 family test), hence the re-read duty and the `slice(m.index)` = 0 witness;
   `skills/war/SKILL.md` — plans 9, 10, 12 (regions named in Task 1.3) vs one new bullet beside
   the phase-close sweep bullets; `CONTEXT.md` — plans 5, 6, 8 vs one new glossary entry.
   Release-slot overlap with every predecessor is sanctioned (batch standard). Downstream:
   `adr-doc-truth-sweep` declares dependsOn `war-strategy-mirror-guards` +
   `gate2-publication-guard` + `shell-pin-helpers` — NOT this group (verified: its spec's
   Ordering rows); no downstream edge expected, and its surface list touches none of this
   plan's files. (AI-declared)
2. **Task carve deviation from the spec (C1).** Spec §4.1/§4.2 sketch separate workers for the
   cards and the guard file; this plan binds them into Task 1.2 because the spec's own pivotal
   constraint ("every pointer edit and every re-pinned shape assert land in the same diff", ADR
   0025) plus the serial-merge gate make a split red-by-construction in one order and
   unguarded-in-flight in the other. Rule 7 is thereby dissolved — no guard-split survives to
   need an edge. (AI-declared)
3. **Deps edges are content edges (C2).** 1.2→1.1: at 1.2's serial merge the gate runs
   `reference-link-integrity.test.mjs` against the flipped cards — without 1.1's resolver
   mapping every anchored target is a dead link. 1.4→1.2: the re-truthed header sentence ("the
   anchored pointer now resolves…") would be false at any integration state preceding the card
   flip. Neither edge dodges a same-file collision (all task file sets are disjoint).
   (AI-declared)
4. **D3 self-adjudicated as adopted (A3).** The spec marks D3 `[assumed: default — if
   wrong/vetoed…]`; `--afk` has no operator volley, so the default is adopted with the veto
   path routed to `/red-team`. A veto converts End state 3 into an explicit accepted-residual
   record (ADR 0017 — never a prose waiver). This is a judgment call, not a genuine
   operator-decision blocker: the spec supplies both the default and the fallback, so no SKIP
   was warranted. (AI-declared)
5. **Arm-1 comment truth across intermediate states (C3).** The spec says the Arm-1 skeleton
   comment "is re-truthed"; this plan words it as resolver TOLERANCE (all three target forms
   resolve; shape enforcement per-card) so the sentence is true both before and after Task 1.2's
   merge — a knowing tightening to avoid a one-merge window where the suite's own comment
   asserts a card shape the cards do not yet carry (the source-comment-lags class).
   (AI-declared)
6. **Intent provenance + AFK conversion record (AI-declared).** The pipeline runs `--afk` (no
   operator volley ratifies this plan), so it carries `## AI-Commander's Intent` and the
   AI-declared backstops heading (ADR 0014), with per-item inline markers.
   **Predecessor-consistency check** (afk-conversion doctrine): committed plans 1–8 carry the
   operator-form intent heading; plans 9–12 are the batch's AI-form blocks and this plan is the
   fifth — tone, scope discipline, and the standing constraints (halt-on-miss witnesses,
   anchor-by-construct, dated-snapshot re-measure duty, mutation drills recorded, budget valves,
   release-trailing) continue the predecessors' shape unchanged; no divergence beyond the ADR
   0014 heading pair itself. Part 1 and the intent block are distilled from the ratified source
   spec — itself synthesized from the memory-mined #1364 and the phase-close follow-ups
   #1275–#1279; the spec's flagged [assumed] rows are carried as A1–A3 with fallbacks intact;
   conversion-time judgments (C1–C6, Notes 1–8) are logged for `/red-team` re-verification.
7. **Check sharpenings vs the spec — knowing deviations, all tightenings (AI-declared).**
   (a) End state 10 adds a mechanical OLD-absent pin on the `headerRegion` docstring's fallback
   sentence (1 at base) beside the spec's mutation-probe-only check; (b) End state 11 pins the
   new arm's test title on the fragment `step-4 citation` (0 at base) so the arm's existence is
   grep-checkable; (c) End state 6 pins `setupScoutMd` ≥ 2 (0 at base) as the extension's
   mechanical evidence; (d) End state 3 pins the D3 line by a literal fragment (C6) — the spec's
   D3 had no validation row; (e) the `owner-relative` sweep carries a dated count (8 at
   conversion, expected 0 after); (f) End states 15–19 are the batch-standard lesson-stamp,
   budget, gate-footprint, issue-citation, and release criteria the spec leaves to conversion;
   (g) the metacharacter-free literal greps of End states 7, 9, 11, and 13 carry `-F` for
   internal platform-law consistency (grill N16), and wave-1 suite comments cite the ADR by
   slug, never number (grill P1). (AI-declared)
   Spec §10 mapping: §10.1→1, §10.2→2, §10.3→4, §10.4→5, §10.5→6, §10.6→7, §10.7→8, §10.8→9,
   §10.9→10, §10.10→11, §10.11→12, §10.12→13 — every mandatory-survey note kept on its row.
   (AI-declared)
8. **Posterity survivors (ADR 0046 posture).** The source issues' verbatim quotes, the source
   spec, the 2026-08-02 plan + red-team report (adjudications O(1)–O(3) and rows 1–6), and the
   stamped lesson's body all legitimately keep the superseded owner-relative wording and the
   stale hook-error-output attribution; every OLD-absent check here is scoped to the live
   surfaces its End state names (the five cards, the two suites, the one header). (AI-declared)

## Open decisions

- **D3 veto or ratification** — resolved by `/red-team` (A3; Note 4). A veto drops the line and
  converts End state 3 into the accepted-residual record.
- **A2 harness-substitution probe outcome** — resolved by `/red-team` (backstop row 1); the
  result adjusts the ADR's seat-capability matrix wording (substituted vs shell-expanded vs
  fallback-only), never the family shape.
