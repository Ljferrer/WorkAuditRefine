# Authoring-surface truth guards — D4/D5/D12 mirror equality, lacks_i positive controls, grill charter derive-then-apply

Converted by `/war-machine --afk` from [docs/specs/2026-08-06-war-strategy-mirror-guards-design.md](../specs/2026-08-06-war-strategy-mirror-guards-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason; spec citations are provenance-only — Part 1 alone carries every decision, constraint, and
mechanic). Issues addressed: #1307, #1308, #1309, and — folded 2026-08-15 by operator direction as
the Phase-2 amendment (an operator-reported latitude-doctrine gap landing squarely on this plan's
authoring-surface family) — #1431. Issue → task mapping: #1307 → Task 1.1 (two
doctrine-ward convergence edits + the doctrine-side presence pin + the five-atom mirror-equality block);
#1308 → Task 1.1 (the four both-ways `lacks_i` positive controls — same file as #1307's guards, so one
task by decomposition rule 1); #1309 → Task 1.2 (the §2 step-1 grill-charter reword); #1431 changes
1–3 → Task 2.1 (the authoring surfaces: template sub-bullets + Examples, the interview beat, the
war-machine drafter duty), change 4 → Task 2.2 (the runtime mirror: worker/auditor cards + dispatched
prompts + the ADR 0013 §3 amendment), change 5 deferred (Non-goals). `/war` files its
own epic + task issues regardless (war-execution-must-file-issues); closing the four source issues is
Lead checkpoint work at phase close (war-checkpoint-must-close-task-issues), never assumed from the
epic close.

## Context — the gap / problem

Three defects on the plan-authoring doctrine surfaces and their own structure test, all found by phase-1
audit seats of the 2026-08-04 interview-and-authoring-contract plan. All three are live at base `6fff2ee`
(2026-08-06); both structure suites exit 0 there (verified: `bash skills/war-strategy/war-strategy-structure.test.sh`
and `bash skills/war-machine/war-pipeline-structure.test.sh` executed at conversion, 2026-08-12, both
exit 0 — the session worktree's spec-batch and checkpoint commits are docs-only and touch none of these
surfaces). Snapshot base for every measured claim: `6fff2ee`; every count is a dated snapshot to
re-measure at the task's rebased base (D12).

1. **The D4/D5/D12 law is mirrored with no equality guard** (verified: issue #1307 (2026-08-06)). The
   evidence-tag syntax (D4, with the D11 issue-derived source form), the Done-when law (D5), the closed
   End-state tag set, and the D12 staleness sentence are each stated twice **as law-statement
   bullets**: in
   `skills/war-strategy/SKILL.md` §2's Template-law bullets and live-artifact convention block, and in
   `skills/war-strategy/references/plan-interview.md`'s section headed
   `## Evidence + slot law (shared with the template)` — a section that self-announces as a mirror
   (verified: both copies re-read side-by-side at `6fff2ee`, conversion 2026-08-12). *(Scope note,
   2026-08-17 /red-team: a THIRD D5 restatement lives inside the merged-template fence's End-state
   slot annotation in SKILL.md §2 — inside the Phase-1 byte-frozen template region, carrying the
   `permitted … elsewhere` connective. It is a known, deliberately unguarded third copy this plan's
   two-surface guard does not watch; converging or guarding it is its own follow-up issue, filed at
   red-team.)* ADR 0025's
   discipline is extraction + equality for any duplicated fact, and SKILL.md §3's own drift-guard block
   calls an unguarded mirror a plan defect (verified: the `unguarded mirror is a plan defect` sentence,
   §3 rule 5, live at `6fff2ee`).
2. **Survey-derived correction to #1307's premise, re-confirmed at conversion**: the issue says both
   copies carry presence pins so neither can be deleted silently. Half-true. The SKILL.md side is
   presence-pinned (`check_f` anchors on the Template-law bullet openers and both halves of the D12
   sentence), but the doctrine's `## Evidence + slot law (shared with the template)` section carries
   **zero** pins — a grep of `skills/war-strategy/war-strategy-structure.test.sh` for that heading,
   `D11`, or `D14` finds nothing, and the file's only `D12` token is a comment above a SKILL-side pin
   (verified: grep census re-run at conversion, 2026-08-12). The doctrine copy can be deleted outright
   with the suite green. The fix must add the doctrine-side presence pin as well as the equality guard.
3. **The two copies are not byte-identical today**, even modulo wrapping (verified: side-by-side read at
   `6fff2ee`, conversion re-read): the D5 sentence diverges in its connective ("permitted (not required)
   on any other task; otherwise" on the SKILL side vs "permitted (not required) elsewhere — otherwise"
   in the doctrine); the D4 sentence diverges after the tag triple ("issue-derived facts use" vs
   "issue-derived claims use the source form"); the closed tag set appears once as a template-fence slot
   with placeholder args and once as backticked prose; the D12 sentence is already convergent
   ("literals are dated snapshots at a stated base; re-measure at the task's rebased base" on both,
   modulo line wrap). A naive whole-sentence equality assert would be red at the tip; the design
   converges the divergent connectives doctrine-ward, then compares (D3/D4 below).
4. **The four `lacks_i` old-absent pins have no positive control** (verified: issue #1308 (2026-08-06)).
   In `skills/war-strategy/war-strategy-structure.test.sh` the four retired-wording absence patterns are
   assembled at the call site from split fragments (the `r1a`+`r1b` … `r4a`+`r4b` assembly block) so the
   suite never self-matches a repo sweep — correct per the coupling-comment lesson, but the assembled
   literal is thereby unfindable by any grep, so a one-character fragment typo yields a pattern matching
   nothing and all four pins stay silently green forever. Verified live at conversion: `lacks_i`
   hardcodes `$SKILL` as its haystack, and no positive-control or fixture block exists anywhere in the
   file. The ratified counter-pattern exists twice in-tree: `skills/war/assets/reference-link-integrity.test.mjs`
   arms 2–3 (the pattern must still FIRE; a negative-only assert stays green on a typo) and the
   committed both-ways `lacks_i` control in `skills/war-machine/war-pipeline-structure.test.sh`
   (verified: both blocks present at `6fff2ee`).
5. **war-machine step 1 spawns the grill in parallel with the drafter, but its charter is
   draft-dependent** (verified: issue #1309 (2026-08-06)). `skills/war-machine/SKILL.md` §2 step 1
   opens `**Spawn in parallel:**` and charters the adversarial grill agent to run plan-interview.md's
   falsifier probes + provenance scan "against the draft" — at spawn time no draft exists to probe
   (verified: the lead-in and the draft-dependent charter coexist in §2 step 1 at `6fff2ee`;
   `grep -Fc 'against the draft' skills/war-machine/SKILL.md` = 1, `Spawn` occurs exactly once, both
   re-measured at conversion). Step 2 ("The drafter answers the grill's questions") already names the
   exchange where draft-dependent work can land. The issue routes this as a design choice, not a
   mechanical fix (verified: issue #1309 (2026-08-06)); the source spec resolved it (D9 below).
6. **Stacking truth — what the declared `dependsOn: shell-pin-helpers` edge actually is** (conversion
   construct analysis, 2026-08-12; AI-declared): (a) `war-strategy-structure.test.sh` carries its **own
   complete helper family** (`check`/`check_f`/`check_x`/`check_n`/`doc_f`/`lacks_i`, single hardcoded
   `$SKILL` target, no `strip_prose`) — it shares **no helpers** with the pipeline suite (verified: full
   read of both suites at `6fff2ee`). (b) The committed plan 4
   (`docs/plans/2026-08-06-shell-pin-helpers.md`) touches only
   `skills/war-machine/war-pipeline-structure.test.sh`, one lesson file, and the release slots, and its
   Non-goals explicitly scope this plan's suite out (verified: plan 4's `- Files:` lines + Non-goals,
   read at conversion). **Zero file overlap with Phase 1** *(scoped 2026-08-17 /red-team: Phase 2's
   Task 2.1 adds one twin pin to the pipeline suite — sanctioned because plan 4 has landed)*. (c) The real dependency content: the
   pipeline suite holds pins over the very machine-SKILL region Task 1.2 rewords (`plan-interview.md`
   case-sensitive; `falsifier probes`, `provenance scan`, `in a throwaway sandbox` case-insensitive;
   two fragment-assembled retired-phrase absences, referenced here only by their variable pairs
   `retired_grill_a`/`retired_grill_b` and `retired_convert_a`/`retired_convert_b`) — and plan 4's
   refactor changes that suite's **helper plumbing without changing any of those pin literals** (its
   five-twin `has_i_stripped` migration includes the machine SKILL's `author the merged plan` twin, a
   literal Task 1.2 never touches; the machine SKILL carries no `## Status`/`## Changelog` heading, so
   prose-stripping is a no-op over it) (verified: plan 4 D6 + suite read at conversion). The reword
   therefore faces **identical pin substrings whether plan 4 lands before or after** — the edge is
   validation-order determinism (validate spec criterion 9 against the suite *as landed*, once), i.e. a
   **roadmap spine edge (lands-after), never an intra-phase `deps` edge**, exactly as plan 4's Note 5
   records from the other side.
7. **Extraction idiom census** (verified: full read of `war-strategy-structure.test.sh` at conversion):
   the suite today does only single-line greps — no multi-line extraction exists in it. The nearest
   in-tree bash-3.2-safe idiom is the pipeline suite's `frontmatter()` — an awk flag-range emitter —
   plus plain `tr`/`sed` normalization; the new equality block builds on that shape (D6).
8. **Reflexivity** (AI-declared; *scoped to Phase 1, 2026-08-17 /red-team*): this plan edits the
   very authoring-surface family whose §2 templates
   this conversion consumed. The templates stay byte-stable through **Phase 1's** edits: the only
   Phase-1 files that change are `references/plan-interview.md` (doctrine-ward convergence) and the
   structure
   test; `skills/war-strategy/SKILL.md` — the canonical side and the template home — is **expected
   byte-unchanged under Phase 1**, listed in Task 1.1's footprint for honesty only (spec §5).
   Phase 2's Task 2.1 carries the sanctioned additive-only exception (no existing template line
   moves). Every committed
   `check_f` anchor over §2 stays green by construction.

9. **The latitude ceiling is never authored above the floor** (*amendment 2026-08-15*; verified:
   issue #1431 (2026-08-15), operator report + construct census at the amendment base `9e1c613`).
   The **runtime** half of ADR 0013's latitude doctrine exists and is live: `agents/war-worker.md`'s
   intent block ("intent-consistent deviation is in-band — note it in your result", the ceiling/floor
   sentence), `agents/war-auditor.md`'s **Latitude rule** bullet ("only deviations that contradict
   the intent or the slice block"), and the dispatched twin (`workerIntentClause` in
   `workflow-template.js` mirrors the worker card's sentence — the both-surfaces pair is live).
   The **authoring** half does not: nothing in `skills/war-strategy/SKILL.md` §2 (template or
   Examples A/B), `references/plan-interview.md`, or `skills/war-machine/SKILL.md`'s drafter charter
   ever produces an intent *wider than the slices* — the interview pins concrete mechanisms into
   Method/End states, the ceiling sits flush on the floor, and a mid-implementation mechanism
   substitution then *contradicts the slice as written*, so the auditor's own rule blocks it and the
   run routes a follow-up issue instead of fixing the complication in-band (the operator-observed
   failure). Field-tested counter-shape (a hand-widened interview, 2026-08-15, private repo): a
   `Mechanism latitude:` clause enumerating implementer's-choice mechanisms with the sentence
   "substituting these while the End states and binding guardrails hold is not a plan deviation and
   warrants no issue", plus a short `Binding guardrails:` list as the real floor. **Zero-hit token
   census** (measured at `9e1c613`, all mechanical pins by construction): `mechanism latitude` (-i),
   `binding guardrails` (-i), and `warrants no issue` (-F) are each **0** in all six surfaces —
   `war-strategy/SKILL.md`, `plan-interview.md`, `war-machine/SKILL.md`, `war-worker.md`,
   `war-auditor.md`, `workflow-template.js`.

## Pivotal constraints

- **Structure-test lock-step**: every prose edit and the pin/guard that binds it land in the same task —
  the repo's ratified convention (the structure test's own header comment records it). Task 1.1 owns
  both the doctrine convergence edits and every new guard.
- **Convergence flows doctrine-ward only**: the SKILL-side Template-law bullets are anchored by committed
  `check_f` fragments (`Every End state carries one tag`, `carries an evidence tag`,
  `is required iff \`requiresTest: true\``, both halves of the D12 sentence); the doctrine's law section
  is unpinned today, so its wording moves to match the canonical side without breaking any committed
  anchor. **Reflexive corollary (AI-declared), scoped to Phase 1**: `skills/war-strategy/SKILL.md`
  is byte-unchanged by **Phase 1** — the merged-plan template regions this very conversion consumed
  (§2 fences, Template law, §3 rules) may not move under Phase 1's convergence work. A Phase-1
  worker who believes an extraction anchor requires a SKILL.md edit stop-and-reports (escalation),
  never exercises latitude: the rest of the batch's drafters consumed those same bytes.
  **Sanctioned Phase-2 exception** (*amendment 2026-08-15, #1431*): Task 2.1 edits SKILL.md §2
  **additively only** — new optional sub-bullets under the `## Commander's Intent` template block
  and new modeled lines in Examples A/B; no existing pinned region moves, so every committed
  `check_f` anchor and every Phase-1 mirror-equality/presence guard stays green by construction
  (the additions land AFTER Phase 1's guards, on the post-Phase-1 base, and the same task grows the
  structure test's pins for the new bullets — the lock-step convention).
- **Sibling-suite pins constrain the 1309 reword**: `skills/war-machine/war-pipeline-structure.test.sh`
  pins the grill charter by the exact substrings `plan-interview.md` (case-sensitive), `falsifier
  probes`, `provenance scan`, and `in a throwaway sandbox` (case-insensitive), and keeps two retired
  phrasings absent via fragment-assembled `lacks_i` patterns (the `retired_grill_*` and
  `retired_convert_*` pairs — never restated here). The reworded charter must preserve those four
  substrings byte-for-byte and reintroduce neither retired phrase, in any casing.
- **The sibling suite is read-only under Phase 1** *(rescoped 2026-08-17 by /red-team — the
  2026-08-15 amendment scoped the Non-goals twin of this rule but left this bullet absolute)*: it
  was owned by the shell-pin-helpers group at authoring time; Phase 1 runs it as validation only,
  never as an edit target. **Sanctioned Phase-2 exception**: plan 4 has landed (`_hit_i` ≥ 1 at the
  current base), so Task 2.1 adds the machine-SKILL latitude twin pin there per the lock-step
  convention. Any comment-currency fix it might need beyond that pin still routes to its owner as a
  follow-up issue, never lands here.
- **Equality must be default-deny**: an extraction that returns empty on both sides must red, never
  compare equal — the recorded fail-open class
  ([[enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed]],
  [[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]). Every per-surface extract is
  asserted non-empty, with a distinct not-ok naming surface + atom, before any comparison.
- **Sweep hygiene**: retired phrases stay fragment-split everywhere — in the pattern assembly, in every
  new fixture literal, and in this plan itself (which references them only by variable-pair names).
  Fixture literals are **independent restatements**, never derived from the pattern variables, or a
  fragment typo mutates pattern and fixture together and the control is vacuous.
- **bash-3.2-safe, no mktemp, plain grep/sed/awk/tr** — the structure test's own stated portability
  floor. Exit contract preserved: `set -u`, failures increment `fails`, `exit $fails`, never an early
  `exit`; new helpers pass patterns via `-e` + `--` per the file's own convention.
- **Platform law** (per the batch's refined wording): every committed check whose pattern is intended as
  a LITERAL — above all one carrying mid-pattern metacharacters (parentheses, backticks, `|`, `$`) —
  runs `grep -F`; BSD grep treats a mid-pattern `$` as an anchor. Anchors are not the trap: a deliberate
  regex stays a regex and cannot ride `-F`. Execute-your-literals discipline: run each check as written
  before committing it. (AI-declared)
- **Anchor by named construct** (the Template-law bullet openers, the `- **Evidence tags (D4):**` /
  `- **Done-when law (D5):**` / `- **Staleness (D12):**` / `- **AFK provenance (D14):**` doctrine
  bullets, the merged-template fence's `- End state: <numbered list` slot, the
  `### Example B — AFK-form (merged plan)` heading, the `r1a`…`r4b` assembly block, §2 step 1's
  grill parenthetical) — never line numbers, which rot across the serial merge queue.
- **Zero semantic change to the law**: D4/D5/D11/D12/D14 content, the closed End-state tag set, and the
  grill's duties are unchanged; this plan is prose-plumbing plus guards.
- **Mutation-proof protocol**: every new guard is shown RED once against a scratch mutation (atom
  reworded / section deleted / fragment typo), then green on restore, with the verbatim command +
  failing line recorded in the done report and the commit-body Red-proof block — soft evidence by the
  deliberately-uncommitted-probe rule, so the verbatim capture is mandatory.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | #1307: equality guard or pointer-collapse? | **Equality guard.** Both surfaces are read standalone (the doctrine mid-interview, the template at authoring); collapsing the doctrine's law section to a pointer costs a context switch at interview time. ADR 0025's extraction+equality shape fits | spec D-row (carried [assumed] → A1) |
| D2 | Which side is canonical? | **`skills/war-strategy/SKILL.md` §2** — the template home; the doctrine section's own heading says "shared with the template". Convergence edits flow doctrine-ward only (pin-safe; reflexive constraint above) | (verified: spec §3 + the doctrine heading at `6fff2ee`) |
| D3 | Guard shape for diverging copies | **Converge-then-compare for sentence atoms; keyword projection for the tag set.** The doctrine's D4 and D5 connectives are edited to the canonical wording, then the guard extracts each atom from both files, whitespace-normalizes (join wrapped lines, squeeze spaces), and asserts byte-equality. The closed tag set — template-fence slot vs backticked prose — is compared as its **encounter-ordered keyword sequence** (the colon-bearing forms `check:` → `gate:` → `HARD at audit_sha` → `backstop:`, word-boundary-safe so prose words like "checkable" never count — *tokens sharpened 2026-08-17 by /red-team*), sidestepping fence-vs-prose formatting | spec D-row (projection sufficiency carried → A2) |
| D4 | Atom registry | Five atoms: D4 tag triple + D11 source form (span: the `(user)` token through the `(D11)` close) · D5 Done-when sentence (span: the `Done when: <command>` token through the `None — <basis>` close) · closed-tag-set keyword sequence · D12 staleness sentence (span: `literals are dated snapshots` through `rebased base`; already convergent, no wording edit) · D14 per-row `AI-declared` marker fragment, whose SKILL-side twin lives in Example B's intro prose | spec D-row (D14 inclusion carried → A3) |
| D5 | Empty-extraction behavior | **Fail loud.** Each per-surface extract is asserted non-empty before comparison; a missing anchor or deleted section reds with a message naming the surface and atom — never `"" == ""` green. For the tag-set atom, "non-empty" means all four keywords found on that surface (default-deny — three of four is red); for D14 it means the marker fragment found on that surface | spec D-row; the fail-open lessons |
| D6 | Extraction idiom (AI-declared) | Per atom: an awk flag-range from the atom's opening construct to its terminator (the next `- **` bullet opener, blank line, fence close, or heading), piped through `tr '\n' ' ' \| tr -s ' '` normalization, then a sed span-trim to the atom's stated span. Modeled on the pipeline suite's `frontmatter()` awk-range shape (Context 7 — the suite itself has no multi-line extraction today). POSIX awk/sed only; exact idiom is worker latitude, the properties (anchored, bounded, normalized, non-empty-asserted, bash-3.2-safe) are not | conversion judgment, logged for /red-team |
| D7 | Doctrine-side presence | Add a `doc_f` pin on the exact heading `## Evidence + slot law (shared with the template)` (the Context-2 gap), independent of the equality block, so deletion reds twice: presence pin + non-empty extraction | spec D-row |
| D8 | #1308: haystack refactor or raw-composition control? | **Raw-composition control, no signature change** — four fixture literals piped through the same `grep -qiF` composition `lacks_i` wraps, without churning the helper or its call sites. Shortest working diff; the control's job under #1308 is proving the assembled pattern ALIVE, which it does regardless of helper plumbing. Honest scope note: this control proves the composition, not `lacks_i`'s body — the helper-binding class (#1310's, fixed sibling-side by plan 4) is out of #1308's scope here (Note 4) | spec D-row (carried [assumed] → A4) |
| D9 | #1309: sequence the pair, or move probe application to step 2? | **Keep `Spawn in parallel:`; split the charter into spawn-time derivation + step-2 application.** The grill derives plan-interview.md's falsifier probes + provenance scan from the spec + codebase at spawn (sandbox proofs of repo-behavior claims can start immediately — the parallelism is real work), and applies them against the draft in the step-2 exchange. Strictly sequencing the pair forfeits that overlap for nothing | spec D-row (carried [assumed] → A5) |
| D10 | Step 2 wording | Untouched — "The drafter answers the grill's questions" already names the exchange; the reworded charter points at it explicitly | spec D-row (carried [assumed] → A6) |
| D11 | Control coverage | All four patterns, both ways each: a re-cased independent fixture must FIRE `grep -qiF -e "$rNa$rNb"` (pattern alive — else `not ok - pattern N is dead`), and plain `grep -qF` on the same fixture must MISS (the `-i` is load-bearing, the recorded lacks-vs-has_i asymmetry class). Mirrors the committed both-ways control in the pipeline suite and the FIRE arms of `reference-link-integrity.test.mjs` | spec D-row |
| D12 | Banner + comment currency (AI-declared) | The suite's file-top banner comment is extended to name the new blocks (doctrine-section content guard via mirror equality; `lacks_i` positive controls) — the banner today enumerates what the suite locks, and a silent extension falsifies its enumeration (the banner-count lesson). After authoring, grep is the floor: sweep the edited file for every `Dn` law token and retired-fragment variable it now carries, then hand-scan banner and per-block comments end-to-end; list stragglers as survey-derived corrections | spec §4 sweep mandate, sharpened at conversion |
| D13 | Predecessor witness (AI-declared) | Task 1.2's worker records (never halts on) which sibling-suite shape it sees: `grep -c '_hit_i' skills/war-machine/war-pipeline-structure.test.sh` — ≥1 means plan 4 landed (0 at `6fff2ee`). Record-and-proceed, not halt-on-miss, because Context 6 proves the pin substrings identical in both worlds; the number goes in the done report and criterion 9 runs against whatever shape is live | conversion judgment (plan 10's witness protocol, downgraded with stated reason), logged for /red-team |
| D14 | Release phase (AI-declared) | A trailing release phase in the batch's directive form is added even though the spec says none is implied — every committed 2026-08-06 plan carries one, campaign stacking resolves the next free patch at land time, and omitting it here would make this the batch's sole slotless plan (predecessor-consistency). Deviation recorded in Note 6 | conversion judgment, logged for /red-team |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Guard over pointer-collapse (D1) | spec D-row (carried [assumed]): both surfaces read standalone | the doctrine's law section becomes a two-line pointer at SKILL.md §2 and only the presence pin lands (AI-declared) | ratify in /red-team |
| A2 | Keyword projection suffices for the tag set (D3) | spec D-row (carried [assumed]): the four keywords in order are the set's load-bearing content | a normalization that strips backticks and `<…>` placeholder args upgrades it to full-text compare (AI-declared) | ratify in /red-team |
| A3 | Include the D14 marker atom (D4) | spec D-row (carried [assumed]): shares the mirrored section; marginal cost one row. Honesty note: its equality arm is degenerate (both sides project onto the same fragment) — the teeth are the two default-deny non-empty arms, i.e. a paired presence pin (Note 5, AI-declared) | drop the row; the four named atoms stand alone | ratify in /red-team |
| A4 | Raw-composition control over the issue's file-arg refactor (D8) | spec D-row (carried [assumed]): precedent shape, shortest diff | `lacks_i` gains a haystack argument and the four call sites pass `$SKILL`; the control block is unchanged either way (AI-declared) | ratify in /red-team |
| A5 | Parallel-derive/step-2-apply over strict sequencing (D9) | spec D-row (carried [assumed]): the overlap is real work | step 1 splits into 1a (drafter) / 1b (grill, spawned on the drafter's return) and the charter needs no timing clause (AI-declared) | ratify in /red-team |
| A6 | No step-2 edit needed (D10) | spec D-row (carried [assumed]): step 2 already names the exchange | one clause naming the probe application is appended there (AI-declared) | ratify in /red-team |
| A7 | Landing order: after plan 4 (shell-pin-helpers), per the survey manifest's `dependsOn` hint | Context 6's construct analysis: the edge is validation-order determinism only — pin substrings identical in both worlds, zero file overlap | landed out of order the plan still holds: Task 1.2 validates against the pre-refactor suite (same literals) and D13's witness records the world; no correctness loss, one re-validation risk if plan 4 lands later in the same campaign (AI-declared) | D13 witness + roadmap spine edge |
| A8 | The base-state census holds at the rebased dispatch base | conversion measurements at `6fff2ee` (Context: suites exit 0; `against the draft` = 1 hit; doctrine-side pin census = 0; `_hit_i` = 0 hits); the ten committed predecessor plans' `- Files:` lines touch none of this plan's four surfaces (verified: footprint grep at conversion) | a changed count is stop-and-report per D12 staleness, never a silent adaptation (AI-declared) | each worker re-measures pre-edit; backstop row |

Retired spec assumption: none — the spec's §3 [assumed] rows are all carried above (A1–A6) with their
fallbacks intact; no spec assumption was upgraded or dropped at conversion. (AI-declared)

## Non-goals / deferred

- **No pointer-collapse** of the doctrine's Evidence + slot law section (rejected alternative, A1):
  both reading surfaces stay standalone.
- **No Phase-1 edit to `skills/war-machine/war-pipeline-structure.test.sh`** — sibling-owned at
  authoring time (shell-pin-helpers); Phase 1 only runs it as read-only validation. *(amendment
  2026-08-15)*: plan 4 has **landed**, so the file is no longer contended — Phase 2's Task 2.1 adds
  the machine-SKILL latitude twin pin there (the lock-step convention), the scoped exception to this
  bullet.
- **No Phase-1 edit to `skills/war-strategy/SKILL.md`** — canonical side, byte-unchanged under Phase
  1 (reflexive constraint, now scoped in Pivotal); listed in Task 1.1's footprint for honesty only.
  Phase 2's Task 2.1 carries the sanctioned additive exception.
- *(amendment 2026-08-15)* **#1431 change 5 (a `/red-team` probe for an over-wide latitude clause
  that swallows an End state) deferred** — the template text itself now carries the ADR 0017 bound
  (the clause never waives a check, gate, or backstop), and `/red-team`'s existing
  backstop-legitimacy + intent-vs-plan lenses already grade End-state sufficiency; a dedicated probe
  earns its slot only if a landed latitude clause is ever observed swallowing a check. Revisit on
  first observed instance.
- **No semantic change** to D4/D5/D11/D12/D14, the closed End-state tag set, or the grill's duties —
  wording plumbing and guards only.
- **No `lacks_i` haystack refactor** (A4's fallback; reversible by veto without touching the control
  design).
- **No helper-hardening of this suite's own `lacks_i` beyond the controls** — the sibling classes plan 4
  fixed pipeline-side (existence guard on a missing target; binding the `-i` inside the helper body) are
  real debts here too but sit outside all three cited issues; if confirmed, each is its own issue
  (mirrors plan 4's symmetric non-goal toward this suite). (AI-declared)
- **No new retired-wording pins**: the four existing patterns gain controls; retiring further wording is
  out of scope.
- **No doctrine-side pin expansion beyond the section heading** — the equality block, not presence
  pinning, is the drift mechanism for the section's content.

## New domain terms · Recommended ADRs

None. "Mirror atom" is plain description of ADR 0025's extraction+equality unit, not a glossary term
(spec §6). Governing doctrine exists — ADR 0025 and the structural-test hardening lessons; this plan
adds mechanisms under it, no triad-passing decision (spec §7).

## AI-Commander's Intent

- **Purpose:** the plan-authoring law can no longer drift silently between its two reading surfaces —
  a reword of the D4, D5, or D12 law sentence on either `skills/war-strategy/SKILL.md` §2's
  law-statement bullets or `references/plan-interview.md` reds a committed assertion naming the
  atom (the tag-set atom is guarded to keyword-sequence granularity and D14 to marker presence —
  the mechanism's stated teeth, narrowed 2026-08-17 by /red-team), deleting the doctrine's
  law section reds twice, a one-character typo in any retired-wording fragment reds its positive
  control, and war-machine's step-1 grill charter agrees with its own spawn ordering — with both
  structure suites green end-to-end and zero semantic change to the law; **and** (Phase 2, #1431)
  the authored intent ceiling can finally sit above the slice floor: every authoring surface offers
  the `Mechanism latitude:` + `Binding guardrails:` shape, both runtime seats read a threaded
  latitude clause as licensing in-band mechanism substitution, and the doctrine is recorded in ADR
  0013 — so a forced mechanism substitution is fixed in-band instead of routed as a follow-up
  issue. (AI-declared)
- **Method:** converge the doctrine's two divergent connectives (D4, D5) to the canonical SKILL.md §2
  bytes, then land the guards in the same task: a `doc_f` presence pin on the law-section heading, a
  five-atom mirror-equality block (construct-anchored awk/sed extraction, whitespace-normalized,
  per-surface non-empty default-deny, keyword projection for the tag set), and four both-ways
  `lacks_i` positive controls with independently-assembled re-cased fixtures; reword the machine
  SKILL's grill charter to derive-at-spawn / apply-at-step-2 while byte-preserving the four sibling
  pin substrings and the sandbox clause; prove every new guard red once against a scratch mutation
  with verbatim capture; then (Phase 2, #1431) land the latitude doctrine additively on the three
  authoring surfaces (template sub-bullets + Examples, interview beat, drafter-charter duty) with
  lock-step pins on all three, mirror the clause-reading arm onto both runtime seat surfaces
  (standing cards + dispatched twins, same commit) with intent-fixture-anchored suite rows, and
  append the ADR 0013 amendment; release rides its own trailing phase in directive form.
  (AI-declared)
- **Mechanism latitude** *(amendment 2026-08-17, #1431; items tightened same date by /red-team)*:
  the mechanisms Method names are reference
  realizations, implementer's choice — the mirror-equality block's extraction implementation
  (POSIX awk vs sed idiom choice, within the suite's plain-bash/bash-3.2 portability floor), the
  whitespace-normalization method, the keyword-projection
  mechanics for the tag set, the assembly method of the re-cased fixtures (independent restatement
  only — never derived from the `rN` variables), the scratch-mutation
  drill mechanics (the scratch-copy technique and which character within a chosen fragment/atom is
  mutated — never coverage: the backstop rows fix which atoms and fragments), where in each suite
  file the new
  blocks land, and — in Phase 2 — the exact wording of the template sub-bullets, interview beat,
  and seat-prompt clauses beyond the pinned fragments the End-state checks name. Substituting any
  of these mechanisms while the End states and binding guardrails hold is not a plan deviation and
  warrants no issue. This clause never waives a check, gate, or backstop (ADR 0017) — End states
  pin outcomes, and each stays checkable as written. (AI-declared)
- **Binding guardrails** *(amendment 2026-08-17, #1431; extended same date by /red-team)*: zero
  semantic change to the doctrine law
  text (D4/D5 converge to the canonical SKILL.md §2 bytes) · template edits additive-only and
  Phase-2-only — `skills/war-strategy/SKILL.md` is byte-frozen in Phase 1 and the sibling pipeline
  suite is read-only in Phase 1 · the four sibling pin substrings and the sandbox clause stay
  byte-preserved · fixture literals stay independent restatements · both-surfaces changes (standing
  card + dispatched prompt) land in the same
  commit · every new guard is demonstrated-RED once with verbatim capture · a clause-less intent
  produces the same adjudication outcome as today, and an intent-absent run produces byte-identical
  dispatched worker prompts. (AI-declared)
- **End state:** (spec §10 criteria 1–10 mapped 1:1 with their survey notes kept, plus 11–12 for
  gates and release)
  1. The war-strategy structure suite exits 0 at the integrated tip ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh; echo $?` → `0`. (AI-declared)
  2. Rewording the D4, D5, or D12 law sentence on **either** surface in a
     scratch copy reds the equality block with a message naming that atom; the tag-set atom is
     guarded to keyword-sequence granularity (a reword preserving `check:` → `gate:` →
     `HARD at audit_sha` → `backstop:` in order stays green by design) and D14 to marker presence
     on both surfaces *(narrowed 2026-08-17 by /red-team to the mechanism's stated teeth — D3's
     projection and Note 5's degenerate-equality concession)* ·
     backstop: rows 1–2 (scratch-mutation proof, one sentence atom per surface, verbatim capture). (AI-declared)
  3. Deleting the doctrine's `## Evidence + slot law (shared with the template)` section in a scratch
     copy reds **both** the presence pin and the non-empty extraction asserts — never green via
     empty-equals-empty ·
     backstop: row 3. (AI-declared)
  4. The D4 and D5 atoms extracted from both live surfaces post-convergence are byte-equal after
     normalization ·
     check: the suite's equality ok lines (same command as End state 1). (AI-declared)
  5. A one-character **substitution to a different letter** (not merely a case flip — the control
     composes `grep -qiF`, so re-casing is invisible by design) introduced into any one of the
     eight `rN` fragments in a
     scratch copy reds the matching positive control (`pattern N is dead`); an end-of-fragment
     deletion **in a trailing (`rNb`) fragment** leaves a still-alive prefix pattern — a live,
     broader absence pin — and stays green
     by design *(scoped 2026-08-17 by /red-team: the same deletion in an `rNa` fragment is
     mid-pattern of the concatenation and reds normally)* ·
     backstop: row 4 (all eight fragments, in turn). (AI-declared)
  6. Each re-cased fixture grepped with the plain case-sensitive composition MISSES, proving `-i`
     load-bearing (the control's second arm) ·
     check: the four second-arm ok lines (same command as End state 1). (AI-declared)
  7. The retired sentences stay absent from `skills/war-strategy/SKILL.md` — the four `lacks_i` pins
     green alongside their controls ·
     check: same command as End state 1. (AI-declared)
  8. §2 step 1 of `skills/war-machine/SKILL.md` carries no spawn-time draft-dependent duty; probe
     application is named in the step-2 exchange ·
     check *(hardened 2026-08-17 by /red-team: case-insensitive — a re-cased reintroduction must
     not evade it — and location-explicit)*: `grep -in 'against the draft'
     skills/war-machine/SKILL.md` — every hit sits inside step 1's derive-then-apply clause, in its
     step-2-application half ("applies them against the draft in the step-2 exchange"), with no hit
     in any spawn-time duty position (1 hit at base, dated snapshot); **grep is the floor** — hand-read §2
     end-to-end (steps 1–5 plus the directives above them) for any other spawn-time draft dependency
     or now-stale timing claim, listing each straggler as a survey-derived correction. (AI-declared)
  9. The sibling pipeline suite stays green after the 1309 reword — the grill-charter pins
     (`plan-interview.md`, `falsifier probes`, `provenance scan`, `in a throwaway sandbox`) and both
     fragment-assembled retired-phrase absences ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?` → `0`. (AI-declared)
  10. The mutation proofs for End states 2, 3, and 5 appear verbatim (command + failing line) in the
      done reports, and each of #1307/#1308 (Task 1.1) and #1309 (Task 1.2) is cited by at least one
      commit in the phase range `<phase-base>..<tip>` with the Task 1.1 commit body carrying the
      Red-proof block; **Phase-2 twin** *(added 2026-08-17 by /red-team)*: #1431 is cited by at
      least one commit in Phase 2's own `<phase-base>..<tip>` range, and the Phase-2 mutation
      proofs (Tasks 2.1/2.2) appear verbatim in their done reports, same judging rule ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat —
      done-report review at gate-audit per the spec's criterion 10). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)* (AI-declared)
  11. The full gates are green at the integrated tip ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop (both edited/validated
      structure suites are discovered members) exit 0. (AI-declared)
  12. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs`. (AI-declared)
  13. *(amendment 2026-08-15, #1431)* The merged-plan template's `## Commander's Intent` block offers
      the two optional sub-bullets, modeled in both Examples, and the template text itself states the
      ADR 0017 bound (the clause never waives a check, gate, or backstop) ·
      check: `grep -ci 'mechanism latitude' skills/war-strategy/SKILL.md` ≥ 3 (template + two
      Examples; 0 at the amendment base, Context 9) and
      `grep -Fc 'warrants no issue' skills/war-strategy/SKILL.md` ≥ 1 (0 at base) and
      `grep -Fc 'never waives a check, gate, or backstop' skills/war-strategy/SKILL.md` ≥ 1
      (0 at base — *pinned 2026-08-17 by /red-team so the bound sentence sits outside the Phase-2
      wording latitude by construction*);
      `bash skills/war-strategy/war-strategy-structure.test.sh` (the new pins).
  14. *(amendment 2026-08-15, #1431)* The interview carries the latitude beat as a decisive slot
      after End-state drafting, with the flush-ceiling plan smell named, and the war-machine drafter
      duty carries the same two sub-bullets ·
      check: `grep -ci 'mechanism latitude' skills/war-strategy/references/plan-interview.md` ≥ 1 and
      `grep -ci 'mechanism latitude' skills/war-machine/SKILL.md` ≥ 1 (both 0 at base);
      `bash skills/war-machine/war-pipeline-structure.test.sh` (the machine-SKILL twin pin).
  15. *(amendment 2026-08-15, #1431)* Both runtime seat surfaces read a threaded latitude clause as
      licensing in-band mechanism substitution — worker card + auditor Latitude rule, each mirrored
      into its dispatched prompt in the same commit — and *(restated 2026-08-17 by /red-team: the
      appended prose is unconditional text with conditional behavior)* a clause-less intent
      produces the same adjudication outcome as today while an intent-absent run produces
      byte-identical dispatched worker prompts ·
      check: `grep -ci 'mechanism latitude' <file>` ≥ 1 **run per file** for each of
      `agents/war-worker.md`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`
      (all 0 at base, Context 9) and
      `node --test skills/war/assets/workflow-template.test.mjs` (the new latitude registry row /
      intent-fixture anchors; the intent-absent byte-identity trace is the existing intent-absent
      test).
  16. *(amendment 2026-08-15, #1431)* ADR 0013 records the latitude-clause reading via a new
      `## Amendment (2026-08-17)` section per the file's amendment convention, clarifying Decision 3
      (pre-existing body byte-unchanged apart from the appended section and the
      Status line; *re-anchored 2026-08-17 by /red-team — the ADR has no "§3"*) ·
      check: `grep -ci 'mechanism latitude' docs/adr/0013-commanders-intent-and-disposition-routing.md`
      ≥ 1 (0 at base).

## Build order (for /war)

Phase 1 (Task 1.1 ∥ Task 1.2 — file-disjoint, both wave 1, no deps edges) → Phase 2 (amendment
2026-08-15, #1431 — latitude authoring + runtime mirror; wave 1 = Tasks 2.1, 2.2, file-disjoint) →
Phase 3 (release). Phase 2 is a phase, not more Phase-1 tasks, because Task 2.1 edits the two files
Task 1.1 owns (`plan-interview.md` + the structure test) and the SKILL.md file Phase 1 freezes — a
phase edge, never a same-file deps dodge; its base is the tip after Phase 1's guards land, so the
new pins are authored against the converged, guarded doctrine.

Rule 7 is not triggered: every guard Task 1.1 authors travels in the same task and file family as the
fact it guards (doctrine wording + suite guard, lock-step); Task 1.2 authors prose only, no guard — the
pins over its region are pre-existing and sibling-owned, not authored here. (AI-declared)
Phase 2 keeps the same discipline: Task 2.1's template additions and their structure-test pins are one
task; Task 2.2's runtime clauses and their `workflow-template.test.mjs` registry anchors are one task;
the two are file-disjoint (authoring surfaces vs runtime surfaces), so no deps edge and no guard split.

## Phase 1 — Mirror equality + positive controls + grill choreography

### Task 1.1: D4/D5 doctrine convergence + doctrine pin + mirror-equality block + lacks_i positive controls (#1307, #1308)

- Files: `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/war-strategy-structure.test.sh`, `skills/war-strategy/SKILL.md`
- Plan slice: `skills/war-strategy/SKILL.md` is a **read-anchor only — expected byte-unchanged**
  (canonical extraction source, listed for footprint honesty; a believed-necessary edit is a
  stop-and-report escalation, never latitude — reflexive constraint). **Pre-flight census (A8)** — at
  the rebased dispatch base re-run and record: both suites exit 0; the doctrine-side pin census is
  still zero; the two doctrine connectives still carry their divergent forms. Drift is stop-and-report.
  **Doctrine convergence (D2/D3)** — two wording edits inside
  `## Evidence + slot law (shared with the template)` in `references/plan-interview.md`, both
  converging to the canonical SKILL.md §2 bytes: (a) the D4 connective — "issue-derived claims use the
  source form" becomes the canonical "issue-derived facts use" phrasing, so the whole D4 atom (the
  `(user)` token through the `(D11)` close) normalizes byte-equal across surfaces; (b) the D5
  connective — "permitted (not required) elsewhere — otherwise" becomes the canonical "permitted (not
  required) on any other task; otherwise", so the full Done-when sentence normalizes byte-equal.
  Nothing else in the section moves; the "carries **exactly** one tag" sentence stays as-is (the tag
  set is compared by keyword projection, not sentence equality). **Doctrine presence pin (D7)** —
  `doc_f '## Evidence + slot law (shared with the template)'`. **Mirror-equality block (D3–D6)** —
  new, after the existing pins: per atom, extract from both surfaces via a construct-anchored awk
  flag-range (SKILL anchors: the `- **Every End state carries one tag**` Template-law bullet for D4;
  the `- **Done-when law (D5):**` bullet for D5; the merged-template fence's
  `- End state: <numbered list` slot for the tag set; the `- **Dated snapshots (D12 staleness rule)**`
  convention bullet for D12; the `### Example B — AFK-form (merged plan)` intro prose for D14.
  Doctrine anchors: the `- **Evidence tags (D4):**` / `- **Done-when law (D5):**` /
  `- **Staleness (D12):**` / `- **AFK provenance (D14):**` bullets and, for the tag set, the
  closed-set sentence inside the D5 bullet), bound each range at the next bullet opener / blank line /
  fence close / heading (never EOF), normalize (`tr '\n' ' ' | tr -s ' '`), sed-trim to the atom's
  span (D4: `(user)` → the `(D11)` close; D5: `Done when: <command>` → the `None — <basis>` close;
  D12: `literals are dated snapshots` → `rebased base`), assert **both extracts non-empty** (each
  failure a distinct not-ok naming surface + atom, incrementing `fails`), then assert equality
  (failure prints both normalized extracts). Tag-set atom: an encounter-ordered keyword projector
  (awk) emits the colon-bearing forms `check:` / `gate:` / `HARD at audit_sha` / `backstop:`
  (word-boundary-safe — "checkable" never counts) in the order found per surface;
  fewer than four found on a surface is that surface's non-empty failure; the two ordered sequences
  are then compared. D14 atom: project each surface's construct onto the `per-row \`AI-declared\`
  marker` fragment; both non-empty arms are the teeth (A3). POSIX awk/sed/tr, bash-3.2-safe, no
  mktemp; patterns via `-e` + `--`; `grep -F` for every literal check per the platform law.
  **`lacks_i` positive-control block (D8/D11)** — new, directly after the `r1a`…`r4b` assembly block:
  four fixture literals, each an independent re-cased restatement of one retired sentence, assembled
  from its **own** split fragments. Quoted constraint (spec §8, load-bearing): *fixture independence
  is the point — deriving a fixture from the `rN` variables makes the control tautological; a fragment
  typo must be able to desynchronize pattern and fixture.* Per pattern, both ways:
  `printf '%s\n' "$fixtureN" | grep -qiF -e "$rNa$rNb"` must FIRE (else
  `not ok - pattern N is dead`, `fails` incremented), and the same pipe through plain `grep -qF` must
  MISS (else the `-i` is decorative). **Banner + sweep (D12)** — extend the file-top banner to name
  the new blocks; then grep the edited file for every `Dn` law token and retired-fragment variable it
  now carries and hand-scan the banner and per-block comments end-to-end for count words or
  enumeration claims the new blocks falsify (the banner-count lesson) — list each straggler as a
  survey-derived correction in the diff. **Mutation proofs** — prove red once each, verbatim command +
  failing line in the done report and the commit-body Red-proof block: (1) one atom reworded per
  surface → the equality assert reds naming the atom; (2) the doctrine section deleted → presence pin
  + non-empty asserts red; (3) a one-character substitution in each of the eight `rN` fragments in
  turn → the matching control reds (substitutions only — an end-of-fragment deletion leaves a
  still-alive prefix pattern and correctly stays green). Commits cite #1307 and #1308.
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: war-machine §2 step-1 grill charter — derive at spawn, apply at step 2 (#1309)

- Files: `skills/war-machine/SKILL.md`
- Plan slice: **Witness (D13)** — first act after the standard rebase, record (never halt):
  `grep -c '_hit_i' skills/war-machine/war-pipeline-structure.test.sh` (≥1 ⇒ plan 4 landed; 0 at
  `6fff2ee`) and `bash skills/war-machine/war-pipeline-structure.test.sh; echo $?` (expect 0) — the
  done report states which sibling-suite shape criterion 9 was validated against. **Reword (D9/D10)**
  — §2 step 1's grill-charter parenthetical moves to the derive-then-apply shape: the grill
  **derives** plan-interview.md's falsifier probes + provenance scan from the spec + codebase at
  spawn, and **applies them against the draft in the step-2 exchange**; the sandbox clause ("any
  behavioral claim about the repo — what a function ingests, what a command emits — is proven by
  executing it in a throwaway sandbox, never by analysis alone") is byte-preserved. The
  `**Spawn in parallel:**` lead-in, the drafter's charter, and the `**Fresh context per spec**` tail
  are unchanged; step 2 is untouched (A6). The exact substrings `plan-interview.md` (the existing
  markdown link satisfies it), `falsifier probes`, `provenance scan`, `in a throwaway sandbox`
  survive byte-for-byte, and neither sibling-pinned retired phrasing (the `retired_grill_*` /
  `retired_convert_*` fragment pairs) is reintroduced in any casing. The edit is scoped to the grill
  parenthetical — every other §2 sentence stays byte-unchanged unless the sweep below finds a
  straggler. **Sweep (grep is the floor)** — grep the file for `draft` and `spawn`, then hand-read §2
  in full (steps 1–5 plus the directives above them) for any other sentence carrying a spawn-time
  draft dependency or now-stale timing claim; list each straggler as a survey-derived correction and
  fix it in this file only. **Read-only follow-through** — confirm the descriptive `Grill charter:`
  comment block in `skills/war-machine/war-pipeline-structure.test.sh` and the consumer sentence in
  `skills/war-strategy/references/plan-interview.md` ("runs this file's falsifier probes + provenance
  scan against a drafted conversion") remain true under the new wording — both describe the
  application, which still targets the drafted conversion, so no edit is expected (verified true of
  the planned shape at conversion); if the hand-read finds otherwise, stop-and-report — the sibling
  suite's comment routes to its owner (shell-pin-helpers) as a follow-up issue, and the doctrine file
  belongs to Task 1.1's footprint, never edited from here. **Validation** — End state 8's grep + End
  state 9's suite run. Commits cite #1309.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Latitude authoring + runtime mirror (amendment 2026-08-15: #1431)

The operator-reported gap (Context 9): the runtime latitude doctrine is live but the authoring
surfaces never produce an intent wider than the slices, so forced mechanism substitutions route out
as follow-up issues instead of being fixed in-band. Phase base: the tip after Phase 1 lands (the
converged, guarded doctrine). #1431's issue body carries the field-tested clause shapes; treat it as
extended Context.

### Task 2.1: Authoring surfaces — template sub-bullets, interview beat, drafter duty (#1431 changes 1–3)

- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/references/plan-interview.md`,
  `skills/war-strategy/war-strategy-structure.test.sh`, `skills/war-machine/SKILL.md`,
  `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: **Witness first** — after the standard rebase, verify Phase 1 landed:
  `bash skills/war-strategy/war-strategy-structure.test.sh` exits 0 AND the suite contains the
  Phase-1 mirror-equality block (grep the suite for its Task-1.1 banner); a miss ⇒ halt and report.
  **(a) template sub-bullets** (change 1): in `skills/war-strategy/SKILL.md` §2's merged-plan
  template, add two **optional-but-recommended** sub-bullets under the `## Commander's Intent` block
  — `Mechanism latitude:` (enumerate which mechanisms named in Method are implementer's choice,
  closing with the sentence *"substituting any of these mechanisms while the End states and binding
  guardrails hold is not a plan deviation and warrants no issue"*) and `Binding guardrails:` (the
  short list of things that genuinely must not change — contracts, repo boundaries, cost/safety
  invariants — **the real floor**). The template text itself states the ADR 0017 bound: *the
  latitude clause never waives a check, gate, or backstop — End states pin outcomes, never
  mechanisms, and each stays checkable via its D5 tag.* Model both sub-bullets in Example A, and in
  Example B with `AI-declared` markers (ADR 0014). **Additive only** — no existing template line
  moves (the Pivotal constraint's sanctioned exception). **(b) interview beat** (change 2): in
  `references/plan-interview.md`, add a decisive slot after the End states are drafted: *"Which
  mechanisms named in Method are implementer's choice? What is the actual floor?"* — default
  posture: mechanisms named in Method are reference realizations unless promoted into the
  guardrails list; and add the falsifier-probe arm: an intent whose ceiling sits flush on the slice
  floor is a plan smell the interviewer names. **(c) drafter duty** (change 3): in
  `skills/war-machine/SKILL.md` §2 **step 1's drafter-charter parenthetical** (the `a **drafter**
  agent (authors the merged-shape plan from the spec + codebase, per the `/war-strategy` §2 merged
  plan template …)` construct — *re-anchored 2026-08-17 by /red-team: the file carries no
  `## AI-Commander's Intent` authoring duty; that duty lives in `references/afk-conversion.md`,
  which stays untouched — the charter parenthetical is the drafter's live duty surface*), the
  drafter's charter gains the same two sub-bullet duties (AI-declared markers per ADR 0014). Pin
  safety: the sentence introduces
  none of the sibling-suite's pinned or retired fragments (the `retired_grill_*`/`retired_convert_*`
  families; state the check in the done report). **Structure-test pins, same task (lock-step):**
  `war-strategy-structure.test.sh` gains presence pins for both sub-bullet labels + the
  warrants-no-issue sentence + the ADR 0017 bound literal `never waives a check, gate, or backstop`
  on the SKILL side (all zero-at-base, Context 9's census), **and a presence pin on the interview
  beat's `Mechanism latitude` label in `references/plan-interview.md`** (three authoring surfaces,
  three pins — the lock-step convention covers all of (a)/(b)/(c), not the SKILL side alone);
  `war-pipeline-structure.test.sh` gains the machine-SKILL twin pin (`Mechanism latitude` present in
  the drafter charter region). **Banner currency (D12), both suites**: extend each edited suite's
  file-top banner/criteria enumeration to name its new latitude pins — a silent extension falsifies
  the banner's enumeration. **Mutation proofs (Phase-2 arm)**: in a scratch copy, delete or reword
  each newly pinned fragment in turn (the two sub-bullet labels, the warrants-no-issue sentence, the
  ADR 0017 bound, the interview-beat label, the machine-SKILL twin) → the matching pin reds each
  time; verbatim command + failing line in the done report and commit-body Red-proof block. Commits
  cite #1431.
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh && bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Runtime mirror — latitude-clause reading on both seat surfaces + ADR 0013 §3 (#1431 change 4)

- Files: `agents/war-worker.md`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: **(a) worker card** (`agents/war-worker.md`, the intent block at the "intent-consistent
  deviation is in-band" sentence): append the latitude-clause arm — *when the threaded intent
  carries an explicit `Mechanism latitude:` clause, a mechanism substitution that satisfies the
  binding guardrails and the End states is in-band work, not a deviation to note for adjudication
  and never a follow-up issue; note the substitution in your result like any other in-band call.*
  **(b) auditor card** (`agents/war-auditor.md`, the **Latitude rule** bullet): append — *when the
  threaded intent carries an explicit `Mechanism latitude:` clause, read "contradicts the slice"
  against the binding guardrails, not against every pinned mechanism literal in the slice: a
  substitution inside the enumerated latitude that holds the guardrails and End states is APPROVE,
  never a plan-faithfulness finding; a substitution that breaches a guardrail or an End state blocks
  exactly as before.* **(c) dispatched twins** (`workflow-template.js`, both-surfaces law, same
  commit): mirror (a) into `workerIntentClause` and (b) into the auditor prompt's intent threading —
  locate by construct, keep the `pt` tags. **(d) suite anchors** (`workflow-template.test.mjs`)
  *(reworded 2026-08-17 by /red-team: no existing D3 registry row anchors intent threading — the
  registry's worker surfaces are captured from an intent-LESS fixture, so `workerIntentClause` is
  `''` there and the new regexes could never fire on them)*: add a **new** D3 registry row for the
  latitude clause whose worker dispatched surface is captured from a **latitude-bearing-intent
  fixture run** (thread an `intent` carrying `Mechanism latitude:` + `Binding guardrails:` through
  the fixture args — registry precedent: the rows already capturing `mergeP`/`esSeatP` from
  dedicated fixture runs), asserting the new
  zero-at-base regexes (`/mechanism latitude/i`, `/binding guardrails/i`) on both surfaces (standing
  card + that dispatched prompt; the auditor arm may anchor the always-rendered auditor prompt),
  and bump the `REGISTRY.length` floor count + its enumerating message in the same commit (the
  floor comment forbids slack) — or, second arm, grow the existing standalone intent-present /
  latitude-rule tests with the same both-surface anchors; a new row with the floor count + enumerating message moved in
  this same task if no existing row fits (state which arm landed in the done report). **(e) ADR
  0013 amendment** *(re-anchored 2026-08-17 by /red-team: the ADR has no numbered sections — "§3"
  does not exist; the doctrine lives in its Decision 3, "the plan slice is the floor; the intent is
  the ceiling")*: append a new `## Amendment (2026-08-17): the latitude-clause reading` section per
  the file's existing amendment convention, clarifying Decision 3 (authored intent may enumerate
  implementer's-choice mechanisms; the guardrails list is the blocking floor; the clause never
  waives a check, gate, or backstop — ADR 0017) — amendment rule:
  pre-existing body byte-unchanged apart from the appended section and the Status currency line.
  **Fail-open discipline, stated exactly** *(reworded 2026-08-17 by /red-team — the appended card
  and prompt prose is unconditional text whose BEHAVIOR is conditional, so surface bytes do
  change)*: a clause-less intent produces the same adjudication outcome as today (the appended arms
  fire only on an explicit `Mechanism latitude:` clause), and an intent-absent run produces
  byte-identical dispatched worker prompts (`workerIntentClause` stays `''` — the existing
  intent-absent test's trace). **Mutation proof (delete-the-feature)**: in a scratch copy, strip
  the latitude arm from one surface (card or prompt literal) → the (d) anchors red naming that
  surface; verbatim capture in the done report and commit-body Red-proof block. **Budget
  pre-flight**: re-measure the `workflow-template.js` prompt-literal share against its hard budget
  line before and after the (c) mirror (dated snapshot at `96fc992`: 61,075 B against the 62,464 B
  hard line) — a projected crossing is stop-and-report, never a silent trim. Commits cite #1431.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap
  is non-authoritative). Expected integration base: the tip after the shell-pin-helpers plan and
  whichever other 2026-08-06 predecessors the roadmap sequences ahead of this plan (ADR 0011
  stack-and-plow; A7 — the shell-pin-helpers edge is validation-order only, so a different order is
  degraded-but-correct). Standalone fallback: run through plain `/war`, resolve the next free patch
  from the four slots themselves. The Status blurb names the doctrine-side presence pin, the
  five-atom mirror-equality guard on the authoring law, the four both-ways retired-wording positive
  controls, and the grill charter's derive-at-spawn/apply-at-step-2 reword — quoting only identifiers
  and headings that exist in the landed diff, count words matching its own enumeration, guard
  semantics stated no wider than the implementation (the equality guard binds two named files, not
  the repo), and **never restating a retired phrase** (the blurb describes them as "the four retired
  phrasings", unquoted — sweep hygiene). (AI-declared)
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Red-proof 1 (End state 2, #1307): reword one atom in a scratch copy of `SKILL.md`, run the suite
  against it → the equality assert reds naming that atom; restore, green · why deferred: a
  delete-and-trace mutation run is uncommittable by design; the committed non-empty + equality asserts
  are the standing guard · runner: Task 1.1's worker in a scratch copy, verbatim command + failing
  line in the done report and commit-body Red-proof block; gate-audit reads it SOFT, never a hold
  (deliberately-uncommitted-probe rule). (AI-declared)
- Red-proof 2 (End state 2, #1307): same protocol, one atom reworded in a scratch copy of
  `references/plan-interview.md` — proves the guard watches **both** surfaces. (AI-declared)
- Red-proof 3 (End state 3, #1307): delete the doctrine's law section in a scratch copy → the suite
  reds on the `doc_f` presence pin **and** the non-empty extraction asserts (two distinct not-ok
  lines) · same runner/evidence shape. (AI-declared)
- Red-proof 4 (End state 5, #1308): introduce a one-character **substitution** into each of the eight
  `rN` fragments in turn, in a scratch copy of the suite → the matching positive control reds
  (`pattern N is dead`) each time (an end-of-fragment deletion leaves a still-alive prefix pattern
  and correctly stays green — outside the proof's scope by End state 5's own wording) · same
  runner/evidence shape. (AI-declared)
- The mandatory manual same-scope surveys: Task 1.1's banner/comment enumeration hand-scan + `Dn`
  token and fragment-variable sweep of the edited suite; Task 1.2's §2 hand-read for residual
  spawn-time draft dependencies and its two read-only follow-through confirmations · why deferred: a
  hand-scan cannot be a mechanical gate member; done-report-only evidence, gate-audit reads SOFT ·
  runner: each task's worker (mandatory statement even at zero stragglers); the auditor re-runs the
  same-scope hand-scan at the pinned `audit_sha`; the Lead re-runs End states 1, 8, and 9's commands
  at phase close. (AI-declared)
- The A8 pre-flight census at each task's rebased dispatch base (suite exits, connective divergence
  still present, doctrine-pin census still zero, `against the draft` hit count, D13 witness) with
  stop-and-report on drift · why deferred: conversion-time counts are dated snapshots at `6fff2ee`;
  the binding measurement is at the task's real base · runner: the workers, pre-edit, recorded in the
  done reports. (AI-declared)
- *(added 2026-08-17 by /red-team)* Red-proof 5 (End states 13–14, #1431): delete or reword each
  Task-2.1 pinned fragment in turn (the two sub-bullet labels, the warrants-no-issue sentence, the
  ADR 0017 bound, the interview-beat label, the machine-SKILL twin) in a scratch copy → the
  matching pin reds each time · why deferred: scratch-mutation runs are uncommittable by design;
  the committed pins are the standing guard · runner: Task 2.1's worker, verbatim command + failing
  line in the done report and commit-body Red-proof block; gate-audit reads it SOFT. (AI-declared)
- *(added 2026-08-17 by /red-team)* Red-proof 6 (End state 15, #1431): strip the latitude arm from
  one runtime surface (card or prompt literal) in a scratch copy → the suite's latitude anchors red
  naming that surface (delete-the-feature) · same runner/evidence shape, Task 2.2's worker.
  (AI-declared)
- *(amendment 2026-08-15, #1431)* The latitude doctrine exercised end-to-end — a live run whose plan
  carries a `Mechanism latitude:` clause, a worker hitting a forced substitution inside it, and the
  audit approving it in-band with no follow-up issue filed · why deferred: uncommittable as a test —
  it requires a real plan authored through the amended interview and a real mid-implementation
  complication; the committed pins (End states 13–16) guard the doctrine text, not the behavior ·
  runner: the Lead of the first `/war` run whose plan carries the clause records the outcome (in-band
  substitution vs routed issue) in that run's phase report; a routed issue that the clause should
  have covered re-opens #1431. (AI-declared)

## Notes / conscious deviations

1. **Stacking truth (the declared `dependsOn` edge, honestly stated).** The spec and survey manifest
   declare this group lands after shell-pin-helpers. Conversion verified the construct reality
   (Context 6): the two suites share **no helpers**, plan 4's footprint has **zero overlap** with this
   plan's, and plan 4's refactor changes **none of the pin literals** that constrain Task 1.2 — so the
   edge is validation-order determinism (criterion 9 runs once, against the suite as landed), a
   **roadmap spine edge**, never an intra-phase `deps` edge, and landing out of order costs
   re-validation, not correctness (A7, D13's record-and-proceed witness — deliberately weaker than the
   halt-on-miss witness the batch uses where predecessor edits genuinely collide, with that reason).
   Downstream, `adr-doc-truth-sweep` declares it lands after this group (verified: its spec §2
   Ordering + §8 at conversion) — the roadmap must carry shell-pin-helpers → this plan →
   adr-doc-truth-sweep spine edges plus a shared-file contention row for
   `skills/war-machine/SKILL.md` (this plan, write) ↔ war-pipeline suite pins (shell-pin-helpers,
   read-side). (AI-declared)
2. **Reflexivity.** This conversion consumed `skills/war-strategy/SKILL.md` §2's merged-plan template
   and §3's decomposition rules — the very skill family this plan edits. The consumed template
   regions stay byte-stable through the plan's own edits by construction: SKILL.md is byte-unchanged
   (canonical side; footprint-honesty listing only), and the changed surfaces are the doctrine file's
   law section (two connectives, converging **toward** the template's bytes) and the structure test
   (guards only). No merged-plan template region moves. (AI-declared)
3. **Predecessor-consistency check** (afk-conversion doctrine): the ten committed plans' intent blocks
   were read at conversion — this block matches the batch's shape (a "the surface can no longer lie"
   purpose, a mechanism-enumerating method, tagged End states mapping the spec's §10 1:1, gates +
   release trailing). No divergence to record. The batch's standing constraints (platform law,
   construct anchoring, mutation-proof verbatim capture, dated-snapshot honesty) are carried above.
   (AI-declared)
4. **The #1308 control's honest scope.** The raw-composition control (D8) proves each assembled
   pattern ALIVE and the `-i` load-bearing **about the composition** — it does not bind `lacks_i`'s
   own body (this suite's `lacks_i` hardcodes `$SKILL` and cannot take a fixture without the A4
   fallback's signature change). That helper-binding gap is #1310's class, which plan 4 fixed in the
   sibling suite; here it sits outside all three cited issues and is recorded as a non-goal → its own
   issue if confirmed. #1308's own close condition — a deliberate typo in any of the four assembled
   patterns reds the suite — is fully met by the FIRE arms. (AI-declared)
5. **D14's degenerate equality arm.** Projecting both surfaces onto the same marker fragment makes the
   equality comparison trivially green whenever both arms are non-empty — the row's real teeth are the
   two default-deny non-empty arms (a paired presence pin, the doctrine side previously having none).
   Carried anyway per the spec's [assumed] row (A3): the marginal cost is one row, and dropping either
   surface's marker now reds. (AI-declared)
6. **Release phase added against the spec's "no release implied" note** (D14): every committed
   2026-08-06 plan carries the trailing directive-form release phase; the spec's note is read as
   "don't hardcode a version", which the directive form satisfies. The alternative (no release phase) would
   make this the batch's only slotless plan and push its slot bump into a sibling. (AI-declared)
7. **Grill choreography vs the operator's sanctioned parallel-pair waiver.** The local memory records
   an operator waiver of `/war-machine`'s strictly-serial per-spec rule (parallel drafter+grill
   *pairs* across specs, contention computed post-hoc). Task 1.2's reword governs the **intra-pair**
   choreography only and keeps the `Spawn in parallel:` lead-in — it forbids nothing: the
   derive-at-spawn/apply-at-step-2 charter is coherent under a truly parallel pair spawn, under the
   de-facto drafter-then-grill serial execution this very batch has run, and under the sanctioned
   cross-spec waiver alike. No new serial mandate is introduced anywhere. (AI-declared)
8. **Posterity survivors.** The source spec, the three issues' verbatim quotes, and prior red-team/
   plan artifacts keep the divergent connectives and the old charter wording — never retro-edited.
   Every OLD-absent concern here is scoped to the two live doctrine surfaces and the machine SKILL;
   this plan itself references retired phrases only by their fragment-variable pair names. (AI-declared)
9. **Triad self-adjudication (--afk).** No conversion question survived to operator level: the one
   genuine design choice (#1309's routing) was resolved by the ratified spec (D9); the conversion-time
   judgments (D6 extraction idiom, D12 banner currency, D13 witness downgrade, D14 release phase,
   A7/A8) are neither hard to reverse nor genuine trade-offs — all are logged above for `/red-team`
   ratification. (AI-declared)
10. **Amendment (2026-08-15, operator-directed): #1431 folded as Phase 2; release renumbered Phase 3.**
    An operator-reported latitude-doctrine gap (Context 9 carries the construct census at `9e1c613`).
    Design calls made here and logged for /red-team: (i) the whole issue lands in **one plan** —
    splitting authoring (this plan) from runtime (a `workflow-template.js`-owning sibling) would open
    a half-landed window in exactly the direction the issue warns about, and the runtime clauses are
    the both-surfaces mirror duty of the authoring change; (ii) **contention safety is spine order**:
    Task 2.2's files are owned by spine-earlier plans — `agents/war-auditor.md` (plan 6, Phase 2 —
    *attribution corrected 2026-08-17 by /red-team; previously miscited as plan 5*),
    `agents/war-worker.md` (plan 9 Task 1.1), `workflow-template.js` + suite (plans 9/10) — all of
    which land before this plan (position 11), so Task 2.2 authors against their landed shapes
    (stack-and-plow; the roadmap contention table gains the rows in the same amendment commit);
    (iii) the Phase-1 SKILL.md byte-freeze is **scoped, not repealed** — Phase 2's exception is
    additive-only with the committed anchors green by construction; (iv) #1431 change 5 is deferred
    with a named revisit trigger (Non-goals) — the ADR 0017 bound rides the template text instead;
    (v) all pins are the Context-9 zero-at-base tokens — no `escalate_reason`-class vacuity (the
    plan-5 red-team's dominant finding family). Amendment surfaces: header issue map, Context 9,
    the scoped Pivotal constraint, Phase 2 (Tasks 2.1/2.2), End states 13–16, build order, the two
    scoped Non-goals + the change-5 deferral, the live-run backstop row, this note, roadmap row +
    issue chain + contention table (same amendment commit). **A second operator-directed pass
    (2026-08-17, PR #1491, merged at master `41de08b`) added the Intent block's own
    `Mechanism latitude:` + `Binding guardrails:` bullets** — this plan dogfoods the shape it
    institutionalizes; those bullets and the Purpose/Method Phase-2 extensions are amendment
    surfaces too. A third pass the same day is the /red-team hardening round (see
    `docs/red-team/2026-08-06-war-strategy-mirror-guards.md` for the adjudication rows).

## Open decisions

None. The spec's design tree is fully resolved; its [assumed] rows are carried as A1–A6 with fallbacks
intact, and every conversion-time judgment is logged in the design tree and Notes for /red-team.
