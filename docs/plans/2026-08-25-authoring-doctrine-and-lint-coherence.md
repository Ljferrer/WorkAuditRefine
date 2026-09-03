# Authoring doctrine and lint coherence — settle ‡, fix the advisory lint's grammar, close the drift-guard gaps, harden the red-team arm

Converted by `/war-machine` from
`docs/specs/2026-08-25-authoring-doctrine-and-lint-coherence-design.md` (Part 1 is its
decision digest; every spec `[assumed:]` row carried forward or retired with a stated
reason, D19). Source issues: #1641, #1637, #1640, #1642, #1638, #1639, #1643, #1682,
#1655, #1684, #1685, #1650, #1674, #1397, #1396. No full interview was convened
(war-machine conversion); design-tree rows carry no `PIN-<n>` ids.

**Evidence consumed** — one row per linked artifact:
- issues #1641, #1637, #1640, #1638, #1639, #1643, #1682 · read via the spec's verbatim quotes, cross-checked against the named constructs at HEAD · read
- issues #1642, #1655, #1684, #1685 · `## Evidence artifacts` sections read via gh at drafting · read
- issues #1650, #1674, #1397, #1396 · read via the spec's quotes plus direct reads of `workflow-scaffold.js`, `loop-budget.md`, `assert-no-repo-escape.sh`/`.test.sh` at HEAD · read
- `docs/learnings/archive/column-0-bound-regex-does-not-terminate-inside-an-indented-fenced-bullet-block.md` (archived — a move, still queryable) · read (via issue #1684's restatement) · read
- `docs/learnings/archive/count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded.md` (archived) · unread — issue #1685's body restates it in full, and the claim was independently re-verified by reproduction at HEAD (see Context) · unread
- `docs/learnings/new-advisory-lint-rule-batch-can-ship-with-asymmetric-fallback-and-scope-bugs-across-all-four-rules.md` (#1682's listed lesson) · unread — issue #1682's body restates it; its four rule bugs are the Context's (a)–(d), each re-verified against the lint at HEAD · unread
- `docs/learnings/archive/red-team-endstate-rewrite-must-update-design-row-task-slice-and-the-check-literal-together.md` (#1674's listed lesson) · unread — issue #1674's body restates the four-surface rule the lesson records; D15 is its resolution · unread
- issue #1431 (#1684's cross-reference — the additive template edit expected inside the window) · unread — closed issue; the per-call-site bound (D11) terminates on any indented bullet regardless of which edit lands · unread
- `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md` (#1674's listed surfaces) · read — the four-surface rule confirmed absent at HEAD (Context, Red-team arm (ii)) · read
- `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/war-strategy-structure.test.sh`, `skills/war-machine/war-pipeline-structure.test.sh` (#1685's listed surfaces) · read — the r7 `lacks_doc_i` + `doc_f` pair reproduced at HEAD (Context, D12) · read

## Context — the gap / problem

The 0.19.0 authoring-side-verification campaign landed the pin-ledger law, the advisory
`plan-literal-lint.mjs`, and the strategy-verifier charter, and left a coherent family of
follow-up defects, all but one live at HEAD:

**The duty/fence vocabulary is dangling (the centerpiece).** The floored twice-read duty
keys on "pins whose landing class is a duty or fence (marked ‡ in the design tree)" — the
clause appears verbatim in `skills/war-strategy/references/plan-interview.md` (Stage-4
gate-1 paragraph) and in `skills/war-strategy/references/strategy-verifier.md` (the
"Duty-class twice-read rule" paragraph) (verified: both files at HEAD). But the ratified
landing-class vocabulary is the closed six-class set — `CLASS_TOKEN =
/^(guardrail|slice|end-state|backstop|context|non-goal)s?\b/i` in
`skills/war-strategy/assets/plan-literal-lint.mjs` (verified: `CLASS_TOKEN` const at HEAD)
— which contains no `duty` and no `fence`, and the ‡ marker is defined and mandated
nowhere on any authoring surface (verified: issue #1641 (2026-08-25)). An author cannot
write a class that triggers the twice-read rule, so the duty is inert as landed (verified:
issue #1637 (2026-08-25)).

**The template's own examples contradict the template law.** SKILL.md's Example A and B
render the design tree as `| # | Decision | Resolution | Source |` — no PIN ids, no
Landing-class column, no Evidence-consumed block — while the template law floors all three
and declares both examples "complete merged plans" (verified: issue #1640 (2026-08-25);
Example A table shape confirmed at `skills/war-strategy/SKILL.md` Example A section at
HEAD).

**Two floored doctrine clauses are silently deletable.** The WAIVE-row
right-delimited-id clause (`right-delimited id, inheriting the Evidence` /
`consumed block's placement latitude` — one clause wrapped across two lines in the file) and the gate-1 scope clause (`Every pin-rule gap and
Evidence-consumed gap the lint reports, and every WAIVE-<n> row — one-shot and standing
alike —`) in `plan-interview.md` each sit between pinned fragments; deleting either reds
nothing in `skills/war-strategy/war-strategy-structure.test.sh` (verified: issue #1642
(2026-08-25), which names both clauses and the bracketing pins).

**The advisory lint carries four confirmed grammar/scope bugs** (all verified against
`plan-literal-lint.mjs` at HEAD):
(a) bare-`slice` cells with no named task fan the citation demand out to every task via
`const ids = c.tasks?.length ? c.tasks : [...doc.taskMap.keys()]` — stricter than the
class→section map and contrary to the rule's fail-open posture (verified: issue #1638
(2026-08-25));
(b) the WAIVE-row detector right-delimits with a digit-only lookahead (`WAIVE-\d+(?!\d)`)
while the sibling pin grammar uses `(?!\w)`, so `WAIVE-1a` is silently admitted (verified:
issue #1682 (2026-08-25));
(c) `GUARDRAILS_MARK`/`END_STATE_MARK` resolve via document-wide `lines.findIndex`
first-match, so an earlier bold occurrence anywhere in Part 1 silently redirects every
guardrail/end-state citation target (verified: issue #1682 (2026-08-25));
(d) the `non-goal` skip arm (`c.cls === 'context' || c.cls === 'non-goal'`) has no dedicated
test — its only coverage is incidental: the dogfood anchor test over
`docs/plans/2026-08-24-authoring-side-verification.md` (three `non-goal` cells) reds with 19
hits when the arm is deleted, so any dogfood-plan change that drops those cells would leave
the arm unguarded (verified: issue #1639 (2026-08-25); reproduction at red-team 2026-09-02).

**Structure-test debt.** `ctl()`'s TAP strings hard-code "lacks_i pattern N" for the two
doctrine-scoped (`lacks_doc_i`) patterns 6 and 7 (verified: issue #1643 (2026-08-25);
`ctl()` printf strings confirmed at HEAD). `extract_range()`'s shared bound
`MEQ_BOUND='^- |^#|^```|^[[:space:]]*$'` is column-0-only, so the tag-set atom's
extraction (anchored on the merged-template fence's `- End state: <numbered list` line)
never terminates at indented bullets inside the fence — any future indented additive edit
is silently swept into the mirror-equality window (verified: issue #1684 (2026-08-25)).

**One spec item is already fixed at HEAD.** The spec's D12 ("rules 5–8" count literal in
`plan-interview.md`'s decisive-slots row unguarded, issue #1685) was re-verified by
reproduction at drafting: a digits-only revert of that row to "rules 5–7" reds
`war-strategy-structure.test.sh` twice (`not ok - doctrine UNEXPECTEDLY has :: rules 5–7`
and `not ok - doctrine missing: rules 5–8`) — the r7 `lacks_doc_i` + `doc_f 'rules 5–8'`
pair landed with commit `5c44fc8` (#1636, this same campaign) after the issue's lesson was
mined (verified: reproduction run at HEAD, 2026-08-25; `git log -S` attribution). D12 is
retired — see Notes / conscious deviations.

**Evidence-duty asymmetry.** `skills/war-machine/SKILL.md`'s drafter clause ("when the
spec cites source issues, reads each cited issue's `## Evidence artifacts` section …
before drafting") is unqualified, while the two sibling surfaces carrying the same duty
both carry a degraded arm — `skills/red-team/references/lenses.md`'s split absence arms
(section-absent ⇒ vacuous; unreachable ⇒ named unverified note) confirmed at HEAD, and
survey-corps' "a consumed issue lacking the section is a named gap the recon lane records
— never a blocker" (verified: issue #1655 (2026-08-25); lenses.md arm confirmed at HEAD).

**Red-team arm.** (i) The scaffold's scope-lock for analyzed probes reads "open nothing
else on the machine" (the `scopeLock` analyzed branch in
`skills/red-team/assets/workflow-scaffold.js`, confirmed at HEAD), while the
`coverage-vs-source` probe's own prompt directs a per-issue `## Evidence artifacts` read
via gh — the join executor's confinement contradicts its duty (verified: issue #1650
(2026-08-25)). A repo sweep at drafting found no `agents/*.md` mirror of the scope-lock
phrase — the only hit is the scaffold itself (verified: grep of `skills/` + `agents/` at
HEAD). (ii) A merged plan states one requirement on four surfaces — design-tree row,
owning task's plan slice, End-state condition text, `check:` literal — and /red-team
patch doctrine nowhere requires rewriting all four together; the one-surface rewrite
failure occurred concretely and was repaired by hand (verified: issue #1674 (2026-08-25);
rule confirmed absent from `skills/red-team/SKILL.md`, `references/loop-budget.md`,
`references/lenses.md` at HEAD). (iii) `assert-no-repo-escape.sh`'s test suite stops at
case 29; case 28 (zero-byte baseline) uses a fixture (a `rogue` branch, clean tree) that
trips no a/b1/b2 escape check, so the claim that infra-argument parsing outranks escape
detection is unguarded on the zero-byte path (verified: issue #1397 (2026-08-25); case-28
fixture confirmed at HEAD); and the guard's residue check deliberately excludes gitignored
paths — recorded in the script's own header as the not-taken "gitignored-leak-paths
backstop" (ponytail item 3), with case 29 pinning the blind spot as a documented false
negative whose flip is "the deliberate FIRST ACT" of the widening (verified:
`assert-no-repo-escape.sh` header + case 29 at HEAD; issue #1396 (2026-08-25)).

## Pivotal constraints

- The landing-class vocabulary stays the closed six-class set. `CLASS_TOKEN` gains no new
  tokens; `duty`/`fence` never become writable class cells (D1).
- The advisory lint stays exit-0 report-only; the hard half of the pair remains gate 1's
  enumerate-aloud duty. Nothing here adds a `/war` gate (ADR 0017: no prose waivers —
  every validation lands in a check, a test pin, or the backstops section).
- Doctrine placement follows the hot/cold law (ADR 0042): the new red-team patch doctrine
  goes in `references/loop-budget.md` with a `when <trigger>, read references/<file>`
  pointer on the operative surface, never inline tier-1.
- `MEQ_BOUND` stays column-0-scoped globally and byte-untouched — other mirror atoms rely
  on its termination contract; the #1684 fix is a per-call-site tighter bound (D11), never
  a global widen (verified: issue #1684 (2026-08-25), the lesson's own "tighten per
  option (a)" remedy).
- Standing-instruction vs dispatched-prompt split: the #1650 fix edits the string-built
  scaffold prompt; the drafting-time sweep found no `agents/*.md` mirror of the scope-lock
  wording (verified: repo grep at HEAD), and the implementing task re-greps `agents/`
  before closing (assumption A3 — the sweep is a floor, re-run at the task's rebased base).
- Escape-guard exit contract is preserved: 0 clean · 1 escape · 2 infra, and infra always
  outranks escape (the property #1397 pins). Floor-family law: exit 2 never collapses
  into 1 and is never a pass.
- Anchor every pin and check by named construct or stable mid-clause token, never line
  number; absence greps case-insensitive (the recorded sentence-case evasion class).

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | What is "duty/fence"? | NOT a landing class. ‡ is an orthogonal row marker the operator applies at ratification to any pin whose content is a standing duty or a fence (regardless of its class cell); the twice-read rule keys on ‡, never on a class token. Both twice-read clauses are reworded to "‡-marked pins" and drop "whose landing class is" | (verified: issue #1637 (2026-08-25) — its theme states exactly this rewording) |
| D2 | Where is ‡ defined/mandated? | Once, normatively, in `plan-interview.md`'s ratified-pin ledger section (grammar: `‡` appended to the pin id or the landing-class cell in the design-tree row; operator-applied at ratification; consequence: twice-read at echo-back reconciliation); SKILL.md template law gains one mirror sentence; strategy-verifier.md's rule cites the ledger definition | (verified: issue #1641 (2026-08-25)) |
| D3 | Lint alignment for ‡ | `CLASS_TOKEN` unchanged; the landing-cell parser strips `‡` from the whole cell BEFORE the arrow-pair (`PIN-<n>→<class>`) match and the class match — at base the arrow-pair form `PIN-7‡→guardrail` drops the pin entirely (proven at red-team 2026-09-02), the leading form `‡ guardrail` degrades to anywhere-citation, the trailing form `guardrail ‡` parses — so every marked form parses into its real class (and is then section-checked), and no error-shaped report ever fires on the marker alone — AND the lint gains a report-only ‡ INVENTORY rule: one advisory row per ‡-marked pin surfaced at conversion, emitted on a separate informational channel that is EXCLUDED from `anyHit` and from `lint()`'s returned hits, so `--strict` still exits 0 on a ‡-marked conforming plan (‡-marking is mandated authoring, never a defect) | operator-ratified (2026-08-25, interactive volley — OD-1 resolved to strip + inventory) |
| D4 | Example A/B rewrite | Both examples' design trees gain PIN ids + a Landing-class column (`| # | Decision | Resolution | Source | PIN | Landing class |` or the pin→class-pair cell form), at least one ‡-marked row, PIN citations in each pin's landing section, and a minimal Evidence-consumed block, after D1/D2 settle the vocabulary | (verified: issue #1640 (2026-08-25) — its clusterHint defers examples until ‡/class is settled) |
| D5 | Bare-`slice` fallback | Task-less `slice` cells degrade to the anywhere-citation fallback (the same arm class-less pins use), never fan out to all tasks; a task-less-slice fixture pins it | (verified: issues #1638, #1682 (2026-08-25)) |
| D6 | WAIVE id delimiter | `WAIVE-\d+(?!\d)` → `WAIVE-\d+(?!\w)` in the waive-row-form rule (sibling pin grammar), PLUS a malformed-id report arm — a row-initial `WAIVE-\d+\w` token is reported as "malformed WAIVE id — letter suffixes are illegal" (tightening the delimiter alone would make `WAIVE-1a` invisible to the rule, reducing advisory signal); fixture: a `WAIVE-1a` row yields the malformed-id hit | (verified: issue #1682 (2026-08-25); invisibility of the bare tighten proven by execution at grill) |
| D7 | Mark resolution scope | `GUARDRAILS_MARK`/`END_STATE_MARK` resolve by `findIndex` scoped to the tracked intent section's line range, not document-wide; a plan with neither intent heading yields `null` marks — a behavior CHANGE from today's document-wide first match, which returns a non-null region, so it is pinned red-at-base, not as a no-regress assert; fixture: a decoy bold `**Binding guardrails:**` in Context must not redirect citation targets | (verified: issue #1682 (2026-08-25)) |
| D8 | non-goal arm test | Add a NAMED dedicated `non-goal`-class fixture to the pin-citation class-mapping test asserting definition-row sufficiency, so deleting the skip arm reds that named test — today only the dogfood anchor test reds, incidentally (Context (d)) | (verified: issue #1639 (2026-08-25); incidental coverage reproduced at red-team 2026-09-02) |
| D9 | Clause-level pins | `war-strategy-structure.test.sh` gains presence pins for the WAIVE right-delimited-id clause and the gate-1 scope clause in `plan-interview.md`, anchored on stable mid-clause tokens, plus the ‡ definition clause from D2 — AND a charter-side new-present ‡ pin (`char_f`) on the reworded strategy-verifier.md rule, lock-step with the doctrine-side pin: without it, dropping ‡ from the charter's clause entirely stays green in the whole suite and passes End state 2's old-absent grep (proven in sandbox at grill) — PLUS the OLD-absent twins, because presence pins close only the drop-‡ direction (proven at red-team 2026-09-02: with every presence pin installed, re-introducing the retired phrase on either surface leaves the suite green): `lacks_doc_i 'landing class is a duty'` on plan-interview.md, and a new charter-scoped `lacks_char_i` helper (the `lacks_doc_i` shape against `$CHARTER`) with `lacks_char_i 'landing class is a duty'` and `lacks_char_i 'duty-class twice-read'` — PLUS a SKILL.md-side `check_f` pin on a stable mid-clause token of the template-law ‡ mirror sentence (Phase 1 Task 2), so the ‡ trio is lock-step (the pin-columns bullet is already pinned sentence-by-sentence; an unpinned mirror sentence is the same one-sided gap on a third surface). Every anchor is a single-line literal: `doc_f`/`char_f`/`check_f` are line-scoped `grep -qF`, so an anchor that spans the doctrine's wrap point (e.g. the WAIVE clause's `inheriting the Evidence` / `consumed block's` break) can never match | (verified: issue #1642 (2026-08-25); one-sided-pin gap proven at grill; old-survives gap and the third-surface gap proven at red-team 2026-09-02) |
| D10 | ctl() messages | The two `lacks_doc_i` controls (patterns 6, 7) print `lacks_doc_i`, not `lacks_i` — parameterize the helper name (bash-3.2-safe `${4:-lacks_i}` default) or branch the printf | (verified: issue #1643 (2026-08-25)) |
| D11 | In-fence bound | Add an indentation-tolerant bound var (`MEQ_BOUND_INFENCE`, adding an `^[[:space:]]+- ` arm) used ONLY at the tag-set atom's SKILL-side extraction call site; `MEQ_BOUND` itself is byte-untouched | (verified: issue #1684 (2026-08-25)) |
| D12 | rules 5–8 guard | RETIRED — already satisfied at HEAD by `war-strategy-structure.test.sh`'s r7 `lacks_doc_i 'rules 5–7'` + `doc_f 'rules 5–8'` pair (landed via #1636 after #1685's lesson was mined); the digits-only revert was reproduced red at drafting | (verified: reproduction at HEAD, 2026-08-25; see Notes) |
| D13 | Drafter degraded arm | war-machine's drafter evidence-read clause gains the same section-absent/issue-unreachable arm as its siblings: absent section = vacuous pass; unreachable issue = named note in the draft; fail-open under `--afk` — plus a presence pin in `war-pipeline-structure.test.sh`, same task | (verified: issue #1655 (2026-08-25)) |
| D14 | Scope-lock carve-out | The analyzed-branch scope-lock string gains one explicit exception: "…open nothing else on the machine, EXCEPT: reading a cited issue's `## Evidence artifacts` section via `gh issue view` when your probe prompt directs it (read-only, this repo's issues only)" — plus a workflow-scaffold.test.mjs assertion that analyzed prompts carry the carve-out | (verified: issue #1650 (2026-08-25)) |
| D15 | Four-surface rewrite rule | New patch-style rule in `references/loop-budget.md`: any End-state rewrite greps the plan for the old requirement's distinctive wording and fixes every hit (design-tree row, task slice, condition text, `check:` literal) in the same patch, then re-executes the new `check:` at base and confirms it red (prefer both halves: new-present AND old-absent); `skills/red-team/SKILL.md` Step 5 gains the ADR-0042 trigger pointer (`when patching an End state, read references/loop-budget.md`) | (verified: issue #1674 (2026-08-25)) |
| D16 | Zero-byte ordering pin | New sibling case (case-28 shape: zero-byte baseline AND an escape-tripping fixture — a `redteam-*` junk branch) asserting exit 2 — pins that infra-argument validation outranks live escape detection on the zero-byte path, which case 28's non-tripping fixture cannot | (verified: issue #1397 (2026-08-25); case-28 fixture confirmed at HEAD) |
| D17 | Gitignored residue | BASELINE-DIFF design (a static allowlist + pre-run refusal self-trips on this very repo — HEAD carries pre-existing `!!` entries including `.claude/red-team/` via machine-local `.git/info/exclude`, which no in-script list can enumerate, and every /red-team run writes its own scaffold to `.claude/red-team/<run>.js` mid-run; proven at grill). Snapshot mode records the ignored FILE set (`git ls-files --others --ignored --exclude-standard` — file-level, never `git status --porcelain --ignored`, whose `!!` lines collapse a pre-existing ignored directory to one entry and so hide a new file inside `node_modules/` or an already-baselined `.claude/red-team/` — proven at red-team 2026-09-02) alongside the ref set — NO refusal on pre-existing ignored residue. Check mode (with `--baseline`) flags only NEW non-allowlisted ignored files vs that baseline, including a new file inside a pre-existing ignored directory → exit 1 (escape); the in-script allowlist is reserved for run-authored legitimate paths (at minimum the run's own `.claude/red-team/` scaffold path). A baseline lacking the ignored section makes the ignored half vacuous (back-compat, fail-open). Case 29's documented-ceiling pin is deliberately flipped to assert detection; header ponytail item 3 rewritten from "not taken" to the taken form. Escape routing (exit 1, not advisory) for a NEW non-allowlisted ignored path | operator-ratified (2026-08-25, interactive volley — OD-2 resolved to escape routing) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | RESOLVED — the operator ratified strip + report-only ‡ inventory (the spec's `[assumed:]` strip-only default was NOT taken); the inventory rule is in-plan (D3, Phase 2 Task 1) | operator-ratified (2026-08-25, interactive volley — OD-1) | n/a — no longer an assumption | D3's fixtures; End state 7 |
| A2 | RESOLVED — escape routing (exit 1) for a NEW (post-snapshot) non-allowlisted gitignored path, run-authored allowlist starting at `.claude/red-team/`, pre-existing ignored residue baselined — operator-ratified; the residual judgment is only the allowlist's future contents | operator-ratified (2026-08-25, interactive volley — OD-2); baseline-diff redesign grill-proven | false-positive escapes on legitimately run-authored ignored paths stall /red-team runs | backstop row (allowlist recalibration) |
| A3 | No `agents/*.md` standing surface mirrors the scope-lock wording | drafting-time grep of `skills/` + `agents/` at HEAD found only the scaffold hit | a standing/dispatched drift lands silently | Task 3.1 re-greps at its rebased base before closing |
| A4 | The D13 sibling surfaces (survey-corps SKILL.md, red-team lenses.md) are already correct and are read as reference shapes only | issue #1655's own three-surface comparison; lenses.md arm re-verified at HEAD | the drafter arm normalizes against a wrong shape | Task 2.3 reads both siblings; if divergent, widens to normalize all three in one commit (spec consequence) |
| A5 | D1's ‡-is-not-a-class resolution is charter-level wording repair, not a new binding decision — no ADR required | spec §7 `[assumed:]` row carried forward (D19) | an undocumented architectural selector; a short ADR ("‡ twice-read selection is marker-keyed, not class-keyed") ratifies it later | operator may promote at the conversion volley; OD-2's ADR-stub fallback pattern applies |
| A6 | This plan's working branch is cut from `origin/master` at `d6cf3f8` (release 0.21.7, PR #1949 merged) — plans 1 and 2 of the campaign (0.20.1, 0.21.0) and the 0.21.x releases are already on master, so the live integration base at launch carries their `skills/red-team/SKILL.md` and release-slot edits and the landing branch is `master` | campaign stacking directive (operator-directed, ADR 0011); base re-verified 2026-09-02 | rebase churn in Phase 3/4; re-verify named constructs at the rebased base | Phase 1 Task 1 worker's first rebase; the release phase's next-free-patch resolution |
| A7 | The two `war-strategy-structure.test.sh` pins that quote the current twice-read wording (`doc_f` and `char_f` on `read **twice** at echo-back reconciliation`) survive the D1 rewording because both reworded clauses retain that fragment; the three neighbouring single-line `doc_f` fragments in the gate-1 paragraph (`Echo-back 1 is **gate 1**`, `lint stays exit-0 report-only ↔ …`, `fix-or-waive on the record before the confirm counts`) must each stay on one line through the re-wrap, because `doc_f` is line-scoped `grep -qF` | pin inventory re-read at red-team (2026-09-02) | Phase 1 tasks red the structure suite; the worker updates the pins lock-step in the same commit — never loosens them | each Phase-1 task's gate run |

## Non-goals / deferred

- No new landing classes; no `CLASS_TOKEN` widening (D1).
- No lint promotion beyond exit-0 report-only; no new `/war` gates.
- No general `MEQ_BOUND` redesign — only the tag-set call site narrows (D11).
- Snapshot-blind-spot items 1–2 of the escape guard's ponytail (origin-side invented-name
  refs, refs predating the first baselined run) stay documented ceilings — #1396 covers
  item 3 only.
- No survey-corps/lenses.md rewording under D13 unless the sibling-shape read finds them
  divergent (then in-scope per A4's consequence).
- No re-litigation of the "rules 5–8" guard (D12 retired — already landed via #1636).

## New domain terms · Recommended ADRs

- **‡ (twice-read marker)** — operator-applied design-tree row marker flagging a pin as a
  standing duty or fence; ‡-marked pins are read twice at echo-back reconciliation.
  Orthogonal to landing class; never a class token. Candidate CONTEXT.md entry — adopt
  only if CONTEXT.md glossarizes pin-ledger terms, and then with its
  skill-doc-contracts drift-guard row (the recorded CONTEXT.md mirror trap); not adopted
  by this plan (CONTEXT.md is untouched).
- ADRs: none required (A5). D17's routing was settled at OD-2 (exit-1 escape routing,
  operator-ratified 2026-08-25); no ADR stub is owed.

## Commander's Intent

- **Purpose:** the authoring-side-verification machinery is internally coherent — an
  author can actually trigger the twice-read rule, the template's examples obey the
  template law, the advisory lint parses the grammar the doctrine mandates, the structure
  suites guard the clauses they claim to, and the red-team arm's confinement, patch
  doctrine, and escape guard match their duties.
- **Method:** settle ‡ as an orthogonal operator-applied row marker (never a class) and
  reword both twice-read clauses to key on it; define it once in the pin-ledger doctrine
  with mirrors pinned; rewrite Example A/B to the floored shape; make four surgical lint
  fixes with red-at-base fixtures; add the missing clause pins, TAP labels, and the
  call-site in-fence bound; append the drafter's degraded arm; carve the Evidence-read
  exception into the analyzed scope-lock; land the four-surface End-state-rewrite rule as
  cold doctrine behind a Step-5 trigger pointer; pin zero-byte infra-vs-escape ordering
  and take the gitignored-leak widening behind an allowlist.
- **Mechanism latitude:** the exact wording of the ‡ definition clause and the reworded
  twice-read sentences (their pinned fragments are the floor); where the ‡ strip happens
  inside the lint's cell parsing; the D9/D13 pin anchor literals (stable mid-clause
  tokens, chosen against landed text); the `ctl()` parameterization shape; the
  `MEQ_BOUND_INFENCE` variable name; the allowlist's data structure and the exact
  stderr wording of the new escape message; Example A/B's PIN numbering and row content
  — substituting any of these mechanisms while the End states and binding guardrails
  hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** `CLASS_TOKEN` byte-unchanged · the lint stays exit-0
  report-only · `MEQ_BOUND` byte-untouched (call-site bound only) · escape-guard exit
  contract 0/1/2 preserved with infra (2) always outranking escape (1) · no existing
  structure-test pin loosened to get green — a red pin is a coupling to update lock-step
  · new doctrine placed per ADR 0042 (references/ file + trigger pointer) · every grep
  floor below is followed by the manual same-scope survey, stragglers recorded as
  survey-derived corrections in the done report.
- **End state:**
  1. `plan-interview.md`'s ratified-pin ledger section defines ‡ once, normatively —
     grammar (appended to the pin id or the landing-class cell), operator-applied at
     ratification, twice-read consequence ·
     check: grep -in 'landing-class cell' skills/war-strategy/references/plan-interview.md prints the definition-clause hit (case-insensitive, mid-clause token, so a re-wrap or re-casing of the latitude-granted wording cannot red it; a bare ‡ grep is green-at-base — the Stage-4 clause already carries the glyph; manual same-scope scan follows).
  2. Both twice-read clauses key on ‡-marked pins; the class-keyed phrase is gone ·
     check: ! grep -qi 'landing class is a duty' skills/war-strategy/references/plan-interview.md skills/war-strategy/references/strategy-verifier.md skills/war-strategy/SKILL.md && echo OLD-ABSENT exits 0 and prints OLD-ABSENT (nonzero on a surviving hit; scoped to the three doctrine files because the structure suite's own absence pins carry the literal; new-present halves via the doctrine-side, charter-side, and SKILL.md-side ‡ pins, End state 8).
  3. Example A and B design trees carry PIN ids and a Landing-class column, at least one
     ‡-marked row, and each example carries an Evidence-consumed block ·
     check: grep -ci '| *landing class *|' skills/war-strategy/SKILL.md prints 2 (0 at base — the two example header rows), grep -c '‡' skills/war-strategy/SKILL.md prints at least 3 (0 at base — the mirror sentence plus at least one marked row per example), and grep -ci 'Evidence consumed' skills/war-strategy/SKILL.md prints at least 3 (1 at base — one block per example).
  4. A bare-`slice` cell with no named task falls back to anywhere-citation — never a
     per-task fan-out ·
     check: node --test skills/war-strategy/assets/plan-literal-lint.test.mjs (D5 fixture; red with the fix reverted).
  5. A `WAIVE-1a` row is reported as malformed ("letter suffixes are illegal"), never
     silently admitted and never silently invisible ·
     check: node --test skills/war-strategy/assets/plan-literal-lint.test.mjs (D6 fixture).
  6. A decoy bold guardrails/end-state mark before the intent section does not redirect
     citation targets; the no-intent path still yields null marks ·
     check: node --test skills/war-strategy/assets/plan-literal-lint.test.mjs (D7 fixtures).
  7. Deleting the `non-goal` skip arm reds the NAMED dedicated `non-goal` fixture in the
     lint suite (not only the incidental dogfood anchor test); a ‡-marked cell — leading,
     trailing, and the arrow-pair `PIN-<n>‡→<class>` form — parses into its real class and
     is section-checked; the report-only ‡ inventory emits exactly one advisory row per
     ‡-marked pin (none on an unmarked tree), exit 0; and `--strict` still exits 0 on a
     ‡-marked plan with no other hits ·
     check: node --test skills/war-strategy/assets/plan-literal-lint.test.mjs (D8 + D3 + D3-inventory + `--strict` fixtures; delete-and-trace naming the failing test title in the done report).
  8. Deleting the WAIVE right-delimited-id clause, the gate-1 scope clause, or the ‡
     definition clause from `plan-interview.md` reds the structure suite; dropping ‡ from
     the charter's twice-read clause reds it (the charter-side new-present pin); dropping the
     ‡ mirror sentence from `SKILL.md`'s template law reds it (the SKILL.md-side pin); and
     re-introducing `landing class is a duty` on either doctrine surface reds it (the
     OLD-absent twins) ·
     check: bash skills/war-strategy/war-strategy-structure.test.sh (plus a delete-and-trace of each clause, all three surfaces, and a re-introduce-and-trace of the retired phrase, in the done report).
  9. The two doctrine-scoped positive controls report under their own helper name ·
     check: bash skills/war-strategy/war-strategy-structure.test.sh | grep -c 'lacks_doc_i pattern' prints 4.
  10. The tag-set atom's SKILL-side extraction terminates at an indented sibling bullet
      inside the merged-plan fence; every other atom's window is unchanged ·
      check: bash skills/war-strategy/war-strategy-structure.test.sh (green with the call-site bound; decoy-insertion trace in the done report).
  11. The war-machine drafter evidence clause carries the degraded arm (absent section =
      vacuous pass; unreachable issue = named note, fail-open under --afk), pinned in the
      pipeline structure suite ·
      check: bash skills/war-machine/war-pipeline-structure.test.sh (and grep -in 'unreachable' skills/war-machine/SKILL.md prints the drafter-clause hit).
  12. The analyzed scope-lock string carries the Evidence-artifacts gh-read exception ·
      check: grep -c 'Evidence artifacts' skills/red-team/assets/workflow-scaffold.js prints at least 2 (scope-lock string plus the probe prompt).
  13. `loop-budget.md`'s patch-style section carries the four-surface same-patch sweep +
      red-at-base re-execution rule ·
      check: grep -in 'design-tree row' skills/red-team/references/loop-budget.md prints the rule hit (and the rule is pinned by a doc-guard in `red-team-gate.test.mjs`, Phase 3 Task 3).
  14. `skills/red-team/SKILL.md` Step 5 carries the ADR-0042 trigger pointer for the rule ·
      check: grep -in 'patching an End state' skills/red-team/SKILL.md prints the pointer hit (pinned by a doc-guard in `red-team-gate.test.mjs`, the 5.5(c) shape).
  15. A zero-byte baseline coinciding with a live escape-tripping fixture exits 2 — infra
      never preempted by escape ·
      check: bash skills/red-team/assets/assert-no-repo-escape.test.sh (the D16 case).
  16. A NEW non-allowlisted gitignored FILE (vs the snapshot's recorded file-level ignored
      set) — including one inside a pre-existing ignored directory — is detected per the
      ratified routing (exit 1); pre-existing ignored residue and a new path under the
      run-authored allowlist stay clean; case 29's ceiling pin is flipped to assert
      detection ·
      check: bash skills/red-team/assets/assert-no-repo-escape.test.sh (the D17 cases, including the flipped case-29 pin, the inside-a-baselined-directory case, the pre-existing-residue control, and the allowlist control).

## Build order (for /war)

Phase 1 (vocabulary settlement — doctrine only) → Phase 2 (lint + structure tests +
drafter arm; pins reference Phase-1-landed wording) → Phase 3 (red-team arm) → Phase 4
(release). Phase 3 is file-disjoint from phases 1–2 and sequenced as a phase for
coherence, not for a landed-first need.

## Phase 1 — Vocabulary settlement (doctrine only)

Three file-disjoint tasks, fully parallel. Each task runs the full structure suite
locally and treats any red pin as a coupling to update in the same commit — never a pin
to loosen (A7: the `read **twice** at echo-back reconciliation` anchors must survive).

### Task 1: ‡ definition + gate-1 rewording (plan-interview.md)
- Files: `skills/war-strategy/references/plan-interview.md`
- Plan slice: (D2) add the ‡ grammar clause to the ratified-pin ledger section — one
  normative sentence family covering: the marker (`‡`), where it is written (appended to
  the pin id or the landing-class cell of the design-tree row), who applies it (the
  operator, at ratification, to any pin whose content is a standing duty or a fence —
  regardless of its class cell), its consequence (‡-marked pins are read **twice** at
  echo-back reconciliation), and its orthogonality (never a class token; the class
  vocabulary stays the closed six-class set). (D1) reword the Stage-4 gate-1 twice-read
  sentence from "Pins whose landing class is a duty or fence (marked ‡ in the design
  tree)" to "‡-marked pins", retaining the pinned fragment `read **twice** at echo-back
  reconciliation` byte-identical. Grep floor + survey: grep -i 'duty or fence' and
  'landing class is' over the file, handle every hit, then hand-scan the ledger and
  Stage-4 sections for paraphrased restatements; list stragglers as survey-derived
  corrections. Touched-doc treatment (rule 8): this doc is the CANONICAL source of the ‡
  grammar (nothing machine-readable to mirror — prose doctrine); its downstream guard is
  the D9 ‡-clause pin (Phase 2 Task 2, phase-later per rule 7's sanctioned alternative).
  This task's own gate does not assert the retired phrase absent — the OLD-absent pins
  (D9's `lacks_doc_i`/`lacks_char_i` twins) land in Phase 2 Task 2 as the phase-later
  guard; until then End state 2's check is the only old-absent floor. Keep the gate-1
  paragraph's three pinned neighbour fragments on one line each through the re-wrap (A7).
- Done when: bash skills/war-strategy/war-strategy-structure.test.sh
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Template-law mirror sentence + Example A/B rewrite (SKILL.md)
- Files: `skills/war-strategy/SKILL.md`
- Plan slice: (D2 mirror) one sentence in the template law's Design-tree pin-columns
  bullet: the operator may mark any pin ‡ (duty/fence content — orthogonal to class);
  ‡-marked pins are read twice at echo-back reconciliation, per the pin-ledger law in
  `references/plan-interview.md` (cite, don't restate the grammar — de-mirror posture);
  the sentence is pinned by Phase 2 Task 2's SKILL.md-side `check_f` (phase-later, D9),
  so choose a stable mid-clause token and keep the sentence on one line.
  (D4) rewrite BOTH example design trees to the floored shape: PIN ids + a Landing-class
  column (`| # | Decision | Resolution | Source | PIN | Landing class |` or pin→class
  pairs), at least one ‡-marked row per example written in the trailing class-cell form
  (`guardrail ‡`), which parses at base — the arrow-pair `PIN-<n>‡→<class>` form drops
  the pin at base until Phase 2 Task 1's strip lands and is exercised by that task's
  fixture, never by the examples — each pin cited inside its declared
  landing-class section (guardrail-class pins cited in `Binding guardrails:`, slice-class
  in the named task's `Plan slice:`), and a minimal Evidence-consumed block per example
  (placement latitude in Part 1; never a new required H2). Example B keeps its per-row
  `AI-declared` markers and its intro prose fragment `per-row \`AI-declared\` marker`
  (the D14 mirror atom projects onto it). Verification duty in-task: run
  `node skills/war-strategy/assets/plan-literal-lint.mjs` over each example fence
  extracted to a temp file — zero pin-citation hits (the examples are exemplars); run the
  full structure suite — the exact-line count pins (`check_n` = 3) and every `check_f`
  template pin must stay green, updated lock-step where the same commit legitimately
  moves a pinned line. Touched-doc treatment (rule 8): the mirror sentence points at the
  canonical ledger law (de-mirror); the examples restate no machine-readable in-repo
  fact.
- Done when: bash skills/war-strategy/war-strategy-structure.test.sh
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Twice-read rewording (strategy-verifier.md)
- Files: `skills/war-strategy/references/strategy-verifier.md`
- Plan slice: (D1) reword the "Duty-class twice-read rule" paragraph: the rule keys on
  ‡-marked pins (the operator-applied duty/fence row marker, defined in
  `plan-interview.md`'s ratified-pin ledger — cite it), dropping "whose landing class
  is a duty or fence"; the motivating-instances prose keeps its field-trial numbers but
  its "shipped four duty/fence-class pin leaks" sentence is reworded to non-class
  phrasing (e.g. "four pin leaks of duty/fence content") — it is the one clause every
  floor misses, so it is named here explicitly rather than left to the grep. Rename the
  rule label and the section heading's "duty-class twice-read
  rule" mention to the ‡-keyed form (latitude on exact label), retaining the pinned
  fragment `read **twice** at echo-back reconciliation` byte-identical. Grep floor +
  survey: grep -i 'duty-class' and 'landing class' over the file, handle every hit, then
  hand-scan for paraphrases (the sibling suite's comments referencing "duty-class" live
  in `war-strategy-structure.test.sh` and are Phase 2 Task 2's same-commit comment sweep
  — named here as this task's mirror, per the drift-pair duty). This task's own gate does
  not assert the retired phrase absent — the OLD-absent `lacks_char_i` pins land in Phase 2
  Task 2 (phase-later guard). Touched-doc treatment
  (rule 8): cites the canonical ledger definition (de-mirror); no machine-readable facts.
- Done when: bash skills/war-strategy/war-strategy-structure.test.sh
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Lint + structure tests + drafter arm

Phase edge from Phase 1: the D9 ‡-clause pin and the D3 fixture vocabulary anchor on
Phase-1-landed bytes (rule 7's guard-a-phase-later arm). Three file-disjoint tasks, fully
parallel: the lint fixes and their fixtures share one task, because the inventory rule
grows `SHAPE_RULES` and reds four count-coupled asserts in the test file, so the rule and
the fixtures can only land in one commit (a split task's gate is unsatisfiable at its base).

### Task 1: Four surgical lint fixes + red-at-base fixtures (plan-literal-lint.mjs + its suite)
- Files: `skills/war-strategy/assets/plan-literal-lint.mjs`, `skills/war-strategy/assets/plan-literal-lint.test.mjs`
- Plan slice: (D3) strip `‡` from the whole landing cell in `parseLandingCell` BEFORE the
  arrow-pair (`PIN-<n>→<class>`) match and before `parseClasses`'s class match, so every
  marked form — leading `‡ guardrail`, trailing `guardrail ‡`, pin-id-suffixed `PIN-3‡` in
  the Source cell, and the arrow-pair `PIN-3‡→guardrail` (which drops the pin entirely at
  base: the arrow regex's `(?!\w)\s*(?:→|->)` never matches across `‡`) — parses into its
  real class and pin map, and no error-shaped rule fires on the marker alone;
  `CLASS_TOKEN` byte-unchanged. (D3-inventory, operator-ratified OD-1) a new report-only
  SHAPE_RULES entry — the ‡ inventory: one advisory row per ‡-marked pin found in the
  design tree (e.g. "PIN-<n> is ‡-marked — twice-read at echo-back"), slot text naming the
  design-tree pin rows — emitted on a separate informational channel: EXCLUDED from the
  CLI's `anyHit` and from `lint()`'s returned hits (print it after the hits, or return it
  under its own key — shape latitude), so the exit contract is unchanged INCLUDING
  `--strict`, which must still exit 0 on a ‡-marked conforming plan (‡-marking is mandated
  authoring under D2/D4; an informational row must never read as a defect). (D5) in the
  pin-citation slice branch, a `slice` class with no named tasks degrades to the
  anywhere-citation fallback (the class-less arm), never `[...doc.taskMap.keys()]`. (D6)
  the waive-row-form row detector's `WAIVE-\d+(?!\d)` becomes `WAIVE-\d+(?!\w)` (sibling pin
  grammar) AND the rule gains a malformed-id report arm: a row-initial `WAIVE-\d+\w` token
  is reported as "malformed WAIVE id — letter suffixes are illegal" (the bare tighten alone
  would make a `WAIVE-1a` row invisible to the rule — less advisory signal, not more). (D7)
  `GUARDRAILS_MARK`/`END_STATE_MARK` resolution scopes to the tracked intent section's
  line range (the `INTENT_H2` span `parsePlanShape` already walks) instead of
  document-wide `lines.findIndex`; a plan with neither intent heading yields null marks —
  a behavior change from today's document-wide first match, which returns a non-null
  region. Comment sweep: update the header/rule comments that restate the old behaviors
  (the recorded comments-lag-rewritten-code class).
  Fixtures, same commit: D5 (task-less `slice` cell cited somewhere in the doc → at most
  the anywhere-fallback outcome, never N per-task hits), D6 (a `WAIVE-1a` row yields the
  malformed-id hit — genuinely red pre-fix, where the `(?!\d)` detector admitted the row
  and its 5 fields passed clean), D7 (decoy bold `**Binding guardrails:**` in Context;
  citation targets still resolve inside the intent section; plus the no-intent-heading
  null-marks assert, red-at-base), D8 (a NAMED dedicated `non-goal`-class fixture in the
  pin-citation class-mapping test: an uncited `non-goal` pin stays clean — definition row
  suffices — such that deleting the `non-goal` skip arm reds THAT test; the incidental
  dogfood red over `docs/plans/2026-08-24-authoring-side-verification.md` is not the
  proof), and D3 — two red-pre-fix fixtures: the LEADING-‡ class cell (`‡ guardrail`, which
  pre-fix fails `CLASS_TOKEN`'s `^` anchor and degrades to anywhere-citation: a leading-‡
  guardrail-class pin cited only outside `Binding guardrails:` yields the section-citation
  hit) and the ARROW-PAIR form (`PIN-3‡→guardrail`, which pre-fix yields zero design pins);
  the trailing-‡ (`guardrail ‡`) and Source-cell `PIN-3‡` forms already parse at base and
  land as no-regress asserts. Plus the D3-inventory fixtures (operator-ratified OD-1): a
  design tree carrying ‡-marked pins yields exactly one inventory row per marked pin, an
  unmarked tree yields none — red pre-fix by the rule's absence — and a ‡-marked plan with
  no other hits exits 0 under `--strict` (the channel-exclusion pin). Weak-test-assertion
  law: each red-at-base fixture proven red against the pre-fix code (delete the fix
  mentally; the temp-break runs recorded in the done report, naming the failing test
  title). The inventory rule grows SHAPE_RULES by one — update every count-coupled site
  lock-step: the rule-count/name assert (`SHAPE_RULES: nine named rules` → ten), its
  `slotAnchor` map entry for the inventory rule, and the merged-shape combined fixture's
  per-rule `countOf` loop plus its `hits.length` literal (9 → 10 — or, if the inventory
  channel is returned outside `hits`, the literal stays 9 and the loop skips the inventory
  rule; say which in the done report), where the `badPlan` fixture gains exactly one
  ‡-marked design-tree row and the `goodPlan` fixture stays ‡-free.
- Done when: node --test skills/war-strategy/assets/plan-literal-lint.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Clause pins, OLD-absent twins, TAP labels, in-fence bound (war-strategy-structure.test.sh)
- Files: `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: (D9) three new presence pins against `plan-interview.md`, anchored on
  stable mid-clause tokens, case-robust, never sentence-initial, and each on ONE live
  line — `doc_f`/`char_f`/`check_f` are line-scoped `grep -qF`, so an anchor spanning a
  wrap point can never match: the WAIVE right-delimited-id clause (e.g. `doc_f
  'right-delimited id, inheriting the Evidence'` — the clause wraps after `Evidence`, so
  the longer `… Evidence consumed block` literal is dead on arrival), the gate-1 scope
  clause (e.g. `doc_f 'pin-rule gap and Evidence-consumed gap the lint reports'` plus
  `doc_f 'one-shot and standing alike'`), and the Phase-1-landed ‡ definition clause
  (anchor literal chosen against the landed bytes; must include the ‡ character so End
  state 2's new-present half is mechanical) — PLUS the charter-side twin: a `char_f`
  new-present pin on strategy-verifier.md's reworded ‡ clause (e.g. `char_f '‡-marked
  pins'`, anchor chosen against Phase-1-landed bytes), lock-step with the doctrine-side
  pin, because a one-sided pin leaves the charter free to drop ‡ entirely while the suite
  and End state 2's old-absent grep both stay green (the grill-proven gap; the
  mirror-pair drift-pin convention) — PLUS the SKILL.md-side third: a `check_f` pin on a
  stable mid-clause token of Phase 1 Task 2's template-law ‡ mirror sentence, so the ‡
  trio is lock-step — PLUS the OLD-absent twins (the phase-later guard for Phase 1's
  flip; presence pins close only the drop-‡ direction): `lacks_doc_i 'landing class is a
  duty'`, a new charter-scoped `lacks_char_i` helper (the `lacks_doc_i` shape — fixed
  string, case-insensitive — against `$CHARTER`, with the same `ctl()`-style aliveness
  control the sibling helpers carry), and `lacks_char_i 'landing class is a duty'` plus
  `lacks_char_i 'duty-class twice-read'`; prove non-vacuity by re-introducing the retired
  phrase on each surface in a scratch copy and observing the red (done-report trace).
  (D10) `ctl()` prints the helper name it controls — parameterize (bash-3.2-safe, e.g. a
  fourth arg defaulting `lacks_i`) so patterns 6 and 7 report `lacks_doc_i pattern N` on
  both TAP lines. (D11) add `MEQ_BOUND_INFENCE` (the `MEQ_BOUND` arms plus an
  `^[[:space:]]+- ` arm) and use it ONLY at the tag-set atom's SKILL-side
  `extract_range` call (anchored `- End state: <numbered list`); `MEQ_BOUND` and every
  other call site byte-untouched; prove non-vacuity by inserting a decoy indented bullet
  into a scratch copy and observing termination (done-report trace). Same-commit comment
  sweep: retitle the suite's "duty-class twice-read rule" header/comment mentions to the
  ‡-keyed form (Phase 1 Task 3's named mirror).
- Done when: bash skills/war-strategy/war-strategy-structure.test.sh
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Drafter degraded arm + pin (war-machine SKILL.md + pipeline suite)
- Files: `skills/war-machine/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: (D13) append the degraded arm to the §2 step-1 drafter evidence clause,
  copying the sibling arms' shape: a cited issue whose `## Evidence artifacts` section is
  absent ⇒ the read is vacuously satisfied for that issue; an unreachable issue
  (gh/network/auth failure) ⇒ a named note in the drafted plan identifying that issue —
  never silent, never a stall; fail-open under `--afk`. Keep the existing pinned
  fragments (`reads each cited issue's`, the backticked `## Evidence artifacts`) intact,
  and keep the arm inside the step-1 drafter parenthetical region the pipeline suite's
  region extraction reads. Same task (guard travels with its fact): add a presence pin in
  `war-pipeline-structure.test.sh` beside the existing drafter evidence pins — a
  mid-clause `has_i` on the new arm (e.g. `named note` / `unreachable`). Sibling
  reference read (A4): read survey-corps SKILL.md's named-gap arm and lenses.md's split
  arms as shapes only; if either diverges from #1655's description, widen to normalize
  all three in this commit and say so in the done report. Touched-doc treatment
  (rule 8): prose duty; no machine-readable in-repo fact restated.
- Done when: bash skills/war-machine/war-pipeline-structure.test.sh
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Red-team arm

File-disjoint from phases 1–2; sequenced as a phase for coherence, not a landed-first
need. Task 3 is wave-edged on Task 2 (its doc half documents Task 2's settled routing,
and the SKILL.md/lenses.md edits for D15 and D17 share files by design — merged, never
deps-dodged).

### Task 1: Analyzed scope-lock carve-out (workflow-scaffold.js + its suite)
- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: (D14) extend the analyzed-branch scope-lock string ("Restrict every Read /
  Grep / Glob to paths under ${repo} …; open nothing else on the machine.") with the one
  explicit exception: "…, EXCEPT: reading a cited issue's `## Evidence artifacts` section
  via `gh issue view` when your probe prompt directs it (read-only, this repo's issues
  only)." The executed/sandbox-technique branch is untouched. Add a
  `workflow-scaffold.test.mjs` assertion that every analyzed probe prompt carries the
  carve-out (beside the existing scope-lock prompt asserts), proven red against the
  unedited string. Same-commit floor + survey (A3): re-grep `agents/` and `skills/` for
  the scope-lock phrase (`open nothing else`) at the rebased base and mirror any standing-
  surface hit in this commit; then hand-scan the scaffold's neighboring prompt strings
  and comments for paraphrases of the lock that would still contradict the carve-out
  (e.g. the wrong-plan STOP sentence), listing each straggler as a survey-derived
  correction.
- Done when: node --test skills/red-team/assets/workflow-scaffold.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Escape-guard widening + ordering pin (assert-no-repo-escape.sh + suite)
- Files: `skills/red-team/assets/assert-no-repo-escape.sh`, `skills/red-team/assets/assert-no-repo-escape.test.sh`
- Plan slice: (D17, per OD-2's ratified routing — BASELINE-DIFF, never a pre-run
  refusal: this repo itself carries pre-existing `!!` entries including `.claude/red-team/`
  via machine-local `.git/info/exclude`, and every /red-team run writes its own scaffold
  to `.claude/red-team/<run>.js` mid-run, so a static-allowlist + refusal design
  dead-locks the guard on its own home repo). Snapshot mode additionally records the
  ignored FILE set (`git ls-files --others --ignored --exclude-standard`, one path per
  line — never `git status --porcelain --ignored`, whose `!!` lines collapse a
  pre-existing ignored directory to one entry and so cannot see a new file inside
  `node_modules/` or an already-baselined `.claude/red-team/`; proven at red-team
  2026-09-02) alongside the ref set in the snapshot file (section/prefix format is
  latitude) — pre-existing ignored residue is baselined, never refused. Check mode, with
  `--baseline` only: diff the live ignored file set against the baseline's recorded set; a
  NEW non-allowlisted ignored file — including one inside a directory the baseline already
  listed files under — is residue → exit 1 (escape), same route as untracked residue; the in-script allowlist
  covers run-authored legitimate paths only (starter contents per A2: `.claude/red-team/`;
  bash-3.2-safe plain array + case/glob match). A baseline lacking the ignored section
  (an old-format snapshot) makes the ignored half vacuous — fail-open back-compat, noted
  in the header. Check (a)'s tracked/untracked behavior and the no-baseline path are
  byte-unchanged; a git failure anywhere stays exit 2 (floor-family law). Rewrite header
  ponytail item 3 from the not-taken form to the taken form (what is now detected, the
  baseline-diff mechanism, the run-authored allowlist and how to extend it), and re-audit
  the header's check-(a) exactness sentence and snapshot-mode description. (D16) new
  suite case in the case-28 shape but with an escape-tripping fixture (zero-byte baseline
  + a `refs/heads/redteam-*` junk branch) asserting exit 2 with the zero-byte die message
  — pins that arg-parse infra validation outranks check-(b1) escape detection, which
  case 28's `rogue`-branch fixture cannot. This case is a PIN, already green at HEAD
  (arg-parse precedes b1) — its non-vacuity is proven by delete-and-trace, case-27/28
  convention: move the validation block below (b1) in a scratch copy and the case flips
  2 → 1 (trace in the done report). (D17 cases) flip case 29's pin to assert detection
  (exit 1 naming the NEW ignored leak vs its snapshot); add an allowlist-control case (a
  new leak landing only under an allowlisted run-authored pattern → exit 0); add an
  inside-a-baselined-directory case (an ignored directory with one file at snapshot time
  gains a second file → exit 1 naming the new file); add a
  pre-existing-residue control (an ignored file present BEFORE the snapshot → snapshot
  succeeds, check stays exit 0); add an old-format-baseline back-compat control (no
  ignored section → ignored half vacuous, exit 0); update the header case list and case
  27/28's cross-referencing comments. Red-at-base duty scoped to the D17 cases (each
  proven red against the unwidened script; temp-break traces in the done report) — D16's
  proof is the delete-and-trace above, not red-at-base.
- Done when: bash skills/red-team/assets/assert-no-repo-escape.test.sh
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Patch doctrine + escape-semantics doc hits + their doc-guards (loop-budget.md, red-team SKILL.md, lenses.md, red-team-gate.test.mjs)
- Files: `skills/red-team/references/loop-budget.md`, `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: (D15) add the four-surface rewrite rule to `loop-budget.md`'s Patch style
  section: any patch that rewrites an End state greps the plan for the old requirement's
  distinctive wording and fixes every hit — design-tree row, owning task's plan slice,
  End-state condition text, and the `check:` literal — in the same patch, then re-executes
  the new `check:` at base and confirms it red before the patch counts (prefer both
  halves: new-present AND old-absent). State the grep-is-a-floor duty inside the rule:
  after the grep, hand-scan the plan's design tree, task slices, and backstop rows for
  paraphrases the distinctive-wording grep cannot catch, and fix those in the same patch.
  (D15 pointer) add the ADR-0042 trigger pointer to `skills/red-team/SKILL.md` Step 5:
  when patching an End state, read `references/loop-budget.md` (pointer-with-trigger
  shape). (D17 doc hits) the drafting-time grep for gitignored/ignored-paths restatements
  found zero hits in both files, but both restate exit-1 semantics as an enumeration ("a
  stray working-tree file, a junk sandbox ref, or any … ref …") — SKILL.md Step 4 and
  lenses.md's Pre/post ref-diff bullet: extend each enumeration with the arm Task 2
  landed (a NEW non-allowlisted gitignored path vs the snapshot's recorded ignored set),
  per its settled routing; then hand-scan both files'
  residue-ceiling prose for unworded restatements of the retired ceiling and list
  stragglers as survey-derived corrections. Touched-doc treatment (rule 8): the exit-code
  enumerations are prose restatements of script behavior (not a config default, manifest
  field, enum member, or version slot — outside rule 8's closed machine-readable scope);
  their arbiter is `assert-no-repo-escape.test.sh` (Task 2), named here as the mirror.
  Doc-guards, same task (the guard travels with its fact): the doc-guards that pin the
  prose this task rewrites live in `skills/red-team/assets/red-team-gate.test.mjs`, NOT in
  the pipeline suite (which reads only the scaffold and lenses.md from red-team) — 5.5(c)
  regex-pins SKILL.md's ADR-0042 loop-budget pointer, D8 pins loop-budget.md's layout, D11
  fail-closed pins BOTH SKILL.md's and lenses.md's exit-contract enumerations. Add a
  5.5(c)-shaped doc-guard for the D15 rule in loop-budget.md (a stable mid-clause token of
  the four-surface sweep) and one for the new Step-5 trigger pointer (trigger THEN read, one
  paired regex), and extend D11's enumeration asserts with the new ignored-file arm so the
  Task-2 mirror is guarded on both doc surfaces; run the suite green. Keep the pipeline
  suite's lenses.md pins green (the backticked `## Evidence artifacts` literal is
  untouched).
- Done when: node --test skills/red-team/assets/red-team-gate.test.mjs && bash skills/war-machine/war-pipeline-structure.test.sh
- requiresTest: true
- requiresPackaging: false
- deps: [Task 2]
- target repo: superproject

## Phase 4 — Release

### Task 1: Version bump (all four slots + CHANGELOG head)
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: DIRECTIVE form — bump all four slots together (`plugin.json` `version`,
  `marketplace.json` `metadata.version` AND `plugins[0].version`, the `README.md`
  `## Status` line replace-in-place, never a badge, never an empty field) to the next
  free patch above the live integration base at land time, and prepend the newest-first
  `CHANGELOG.md` head entry for that same version (`version-slots.test.mjs` asserts the
  head equals the bumped `plugin.json` version). Expected integration base (A6): `origin/master` at
  0.21.7 (PR #1949), so the expected result is 0.21.8 — resolve from the slots at land
  time, never from this paragraph. Standalone-fallback
  rule: a run of this plan through plain `/war` (outside the campaign stack) resolves the
  next free patch from the four slots themselves. Before landing, assert the resolved
  version differs from the launch-base version (the stacked-release lag class).
- Done when: node --test skills/war/assets/version-slots.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Run-authored allowlist recalibration for the gitignored baseline-diff (A2's starter
  content, `.claude/red-team/`, is a judgment call) · why deferred: needs field data from
  real /red-team runs on real repos · runner: the first post-land `/red-team` run plus
  `/war-review`'s friction pass; a false-positive escape files a war-followup naming the
  run-authored pattern to allowlist.
- Closing issue #1685 against the pre-existing #1636 guard (D12 retirement) · why
  deferred: issue lifecycle, not a code validation · runner: `/aftermath`'s swept-issue
  evidence chain, citing this plan's Context reproduction.

## Notes / conscious deviations

- **D12 retired (spec deviation, evidence-backed).** The spec's D12/validation-11
  (guard the "rules 5–8" digits in `plan-interview.md`) is already satisfied at HEAD:
  `war-strategy-structure.test.sh` carries `lacks_doc_i 'rules 5–7'` (r7 fragments) plus
  `doc_f 'rules 5–8'`, landed via #1636 in this same campaign after #1685's lesson was
  mined. Reproduced at drafting: a digits-only revert reds the suite twice. No task
  ships for it; the spec's validation criterion 11 is dropped; #1685 closes via the
  backstop row's evidence chain.
- **D3 fixtures added beyond the spec's fixture list.** Spec §4 names fixtures for D5–D8
  only; D3 fixtures (the leading-‡ cell and the arrow-pair `PIN-<n>‡→<class>` form, both
  red pre-fix) are added in Phase 2 Task 1 because without them the strip is exactly the
  kind of unexercised arm D8 exists to prevent (weak-test-assertion law).
- **Phase 2's lint task and fixture task merged at red-team (2026-09-02).** The
  inventory rule reds four count-coupled asserts in the test file, so a lint-only task
  could never pass its own gate at its base; one task owns both files.
- **D17 redesigned to baseline-diff (grill-driven deviation from the spec's
  allowlist-only sketch).** The spec's D17 named a static in-script allowlist over the
  full ignored set; grill proved that design self-trips on this very repo (pre-existing
  `!!` entries including machine-local `.git/info/exclude` ignores no static list can
  enumerate, plus the run's own mid-run `.claude/red-team/<run>.js` scaffold write). The
  taken form: snapshot mode records the ignored-path set; check mode flags only NEW
  non-allowlisted ignored paths vs that baseline; the allowlist is reserved for
  run-authored legitimate paths. Routing ratified at OD-2 (exit 1); the ignored set is
  enumerated file-level (`git ls-files --others --ignored --exclude-standard`), because the
  `!!` directory-collapsed form cannot see a new file inside a pre-existing ignored
  directory (proven at red-team 2026-09-02).
- **D14 gains a test pin beyond the spec.** The carve-out lands with a
  `workflow-scaffold.test.mjs` assertion (Phase 3 Task 1) — an unguarded prompt-string
  duty is the drift class this campaign exists to close.
- **Charter/section relabeling under D1.** The "duty-class twice-read rule" label (and
  the leak-shapes section heading's mention) is renamed to the ‡-keyed form as latitude;
  the floor is the pinned `read **twice** at echo-back reconciliation` fragment plus End
  state 2's old-absent phrase. Structure-suite comments referencing the old label are
  swept in Phase 2 Task 2.
- **Mirrored surfaces edited here are drift pairs** (twice-read clause in two files;
  drafter arm mirroring siblings; escape-semantics enumerations mirroring the guard):
  each task's done report names its mirror and confirms same-commit coverage.

## Open decisions

None — both forks were settled at the conversion volley:

- **OD-1 — RESOLVED, operator-ratified (2026-08-25, interactive volley):** strip +
  report-only ‡ inventory (the NON-default branch) — the lint strips ‡ for class parsing
  AND gains the report-only inventory rule surfacing every ‡-marked row at conversion
  (exit 0, advisory; `--strict` unaffected). In-plan: D3, Phase 2 Task 1, End state 7.
- **OD-2 — RESOLVED, operator-ratified (2026-08-25, interactive volley):** escape
  routing for a NEW non-allowlisted gitignored path detected by the baseline-diff
  (exit 1, snapshot-recorded ignored set, run-authored allowlist starting at
  `.claude/red-team/`); the static-allowlist + refusal form stays off the table
  (grill-proven to dead-lock on this repo). In-plan: D17, Phase 3 Task 2, End state 16.
