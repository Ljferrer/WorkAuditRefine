# Authoring doctrine and lint coherence — settle the ‡ duty/fence vocabulary, fix the advisory lint's grammar bugs, close the drift-guard gaps, and harden the red-team arm

Source issues: #1641, #1637, #1640, #1642, #1638, #1639, #1643, #1682, #1655, #1684, #1685, #1650, #1674, #1397, #1396.

## 1. Context — the gap / problem

The 0.19.0 authoring-side-verification campaign landed the pin-ledger law, the advisory
`plan-literal-lint.mjs`, and the strategy-verifier charter — and left a coherent family of
follow-up defects, all live at HEAD:

**The duty/fence vocabulary is dangling (the centerpiece).** The floored twice-read duty
(PIN-25) keys on "pins whose landing class is a duty or fence (marked ‡ in the design
tree)" — the clause appears verbatim in `skills/war-strategy/references/plan-interview.md`
(Stage-4 gate-1 paragraph) and in `skills/war-strategy/references/strategy-verifier.md`
("Duty-class twice-read rule") (verified: both files at HEAD). But the ratified
landing-class vocabulary is the closed six-class set — `CLASS_TOKEN =
/^(guardrail|slice|end-state|backstop|context|non-goal)s?\b/i` in
`skills/war-strategy/assets/plan-literal-lint.mjs` (verified: `CLASS_TOKEN` const at HEAD)
— which contains no `duty` and no `fence`, and the ‡ marker is defined and mandated
nowhere on any authoring surface (verified: issue #1641 (2026-08-25)). An author cannot
write a class that triggers the twice-read rule, so PIN-25 is inert as landed (verified:
issue #1637 (2026-08-25)).

**The template's own examples contradict the template law.** SKILL.md's Example A and B
render the design tree as `| # | Decision | Resolution | Source |` — no PIN ids, no
Landing-class column, no Evidence-consumed block — while the template law floors all three
and declares both examples "complete merged plans" (verified: issue #1640 (2026-08-25);
Example A table shape confirmed at `skills/war-strategy/SKILL.md` Example A section at
HEAD).

**Two floored doctrine clauses are silently deletable.** The WAIVE-row
right-delimited-id clause and the gate-1 scope clause in `plan-interview.md` sit between
pinned fragments; deleting either reds nothing in
`skills/war-strategy/war-strategy-structure.test.sh` (verified: issue #1642 (2026-08-25)).

**The advisory lint carries four confirmed grammar/scope bugs.**
(a) Bare-`slice` cells with no named task fan the citation demand out to every task via
`const ids = c.tasks?.length ? c.tasks : [...doc.taskMap.keys()]` — stricter than D1's
map and contrary to the rule's fail-open posture (verified: `plan-literal-lint.mjs`
pin-citation slice branch at HEAD; issue #1638 (2026-08-25)).
(b) The WAIVE-row detector right-delimits with a digit-only lookahead
(`WAIVE-\d+(?!\d)`) while the sibling pin grammar uses `(?!\w)`, so `WAIVE-1a` is
silently admitted (verified: issue #1682 (2026-08-25); regex confirmed at the rule-(d)
scan in `plan-literal-lint.mjs` at HEAD).
(c) `GUARDRAILS_MARK`/`END_STATE_MARK` resolve via document-wide `lines.findIndex`
first-match rather than within the tracked intent section — an earlier bold occurrence
anywhere in Part 1 silently redirects every guardrail/end-state citation target
(verified: issue #1682 (2026-08-25); `findIndex` call sites confirmed at HEAD).
(d) The `non-goal` skip arm (`c.cls === 'context' || c.cls === 'non-goal'`) has zero test
coverage — deleting `non-goal` from the condition reds nothing in
`plan-literal-lint.test.mjs` (verified: issue #1639 (2026-08-25)).

**Structure-test debt.** `ctl()`'s TAP strings hard-code "lacks_i pattern N" for the two
doctrine-scoped (`lacks_doc_i`) patterns 6 and 7 (verified: issue #1643 (2026-08-25);
`ctl()` printf strings confirmed at HEAD). `extract_range()`'s shared bound
`MEQ_BOUND='^- |^#|^```|^[[:space:]]*$'` is column-0-only, so the tag-set atom's
extraction (anchored on `- End state: <numbered list`) never terminates at the indented
bullets inside the merged-plan fence — any future indented additive edit is silently
swept into the mirror-equality window (verified: issue #1684 (2026-08-25)). And the
"rules 5–8" count literal in `plan-interview.md`'s decisive-slots row is unguarded: the
`retired_count_a`–`d` `lacks_i` arms in `skills/war-machine/war-pipeline-structure.test.sh`
scan only `$WAR_STRATEGY` (SKILL.md), and the row's own pin is deliberately count-blind —
a digits-only revert to "5–7" stays green in every suite (verified: issue #1685
(2026-08-25)).

**Evidence-duty asymmetry.** `skills/war-machine/SKILL.md`'s drafter clause ("when the
spec cites source issues, reads each cited issue's `## Evidence artifacts` section …
before drafting") is unqualified, while the two sibling surfaces carrying the same duty
(survey-corps SKILL.md, red-team `references/lenses.md`) both carry a
section-absent/issue-unreachable degraded arm (verified: issue #1655 (2026-08-25);
war-machine drafter clause confirmed at HEAD).

**Red-team arm.** (i) The scaffold's scope-lock for analyzed probes reads "open nothing
else on the machine", while the `coverage-vs-source` probe's own prompt directs a per-issue
`## Evidence artifacts` read via gh — the join executor's confinement contradicts its
duty, so the issue read may be systematically declined (verified:
`skills/red-team/assets/workflow-scaffold.js`, analyzed-branch scope-lock string and
`coverage-vs-source` prompt, at HEAD; issue #1650 (2026-08-25)). (ii) A merged plan
states one requirement on four surfaces — design-tree row, owning task's plan slice,
End-state condition text, `check:` literal — and /red-team patch doctrine nowhere requires
rewriting all four together; the one-surface rewrite failure mode occurred concretely and
was repaired by hand (verified: issue #1674 (2026-08-25); rule confirmed absent from
`skills/red-team/SKILL.md`, `references/loop-budget.md`, `references/lenses.md` per the
issue's own verification). (iii) `assert-no-repo-escape.sh`'s test suite stops at case 29;
case 28 (zero-byte baseline) uses a fixture that trips no escape check, so the claim that
infra-argument parsing outranks escape detection is unguarded on that path (verified:
issue #1397 (2026-08-25)), and the guard's residue check deliberately excludes gitignored
paths — recorded in the script's own header as the not-taken "gitignored-leak-paths
backstop" pending an allowlist and exit-routing ruling (verified:
`assert-no-repo-escape.sh` header ponytail item 3 at HEAD; issue #1396 (2026-08-25)).

## 2. Pivotal constraints

- The landing-class vocabulary stays the closed six-class set. `CLASS_TOKEN` gains no new
  tokens; `duty`/`fence` never become writable class cells (resolution D1 below).
- The advisory lint stays exit-0 report-only; the hard half of the pair remains gate 1's
  enumerate-aloud duty. Nothing here adds a `/war` gate (ADR 0017: no prose waivers — every
  validation lands in a check, a test pin, or the backstops section).
- Doctrine placement follows the hot/cold law (ADR 0042): new red-team patch doctrine goes
  in `references/loop-budget.md` with a `when <trigger>, read references/<file>` pointer on
  the operative surface, never inline tier-1.
- `MEQ_BOUND` stays column-0-scoped globally — other mirror atoms rely on it; the #1684 fix
  is a per-call-site tighter bound, not a global widen (verified: issue #1684 (2026-08-25),
  the lesson's own "tighten per option (a)" remedy).
- Standing-instruction vs dispatched-prompt split: the #1650 fix edits the string-built
  scaffold prompt; if any agents/*.md standing surface mirrors the scope-lock wording, both
  move in the same commit [assumed: no agents/*.md mirror exists for the red-team scaffold's
  scope-lock — if wrong: the drift lands silently; the implementing task greps agents/ for
  the scope-lock phrase before closing].
- Escape-guard exit contract is preserved: 0 clean · 1 escape · 2 infra, and infra always
  outranks escape (the property #1397 pins).

## 3. Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | What is "duty/fence"? | NOT a landing class. ‡ is an orthogonal row marker the operator applies at ratification to any pin whose content is a standing duty or a fence (regardless of its class cell); the twice-read rule keys on ‡, never on a class token. Both twice-read clauses are reworded to say "‡-marked pins" and drop "whose landing class is" | (verified: issue #1637 (2026-08-25) — its theme states exactly this rewording) |
| D2 | Where is ‡ defined/mandated? | Once, normatively, in `plan-interview.md`'s ratified-pin ledger section (grammar: `‡` appended to the pin id or class cell, operator-applied, twice-read consequence); SKILL.md template law gains one mirror sentence; strategy-verifier.md's rule cites the ledger definition | (verified: issue #1641 (2026-08-25)) |
| D3 | Lint alignment for ‡ | `CLASS_TOKEN` unchanged; the class-cell parser strips a leading/trailing `‡` before matching so a marked cell still parses, and an unparseable-class report never fires on the marker alone | [assumed: strip-not-extend is the minimal alignment satisfying #1641's "align CLASS_TOKEN" — if wrong (operator wants the lint to *report* ‡ rows), a report-only ‡ inventory rule is additive later] |
| D4 | Example A/B rewrite | Both examples gain PIN ids + a Landing-class column (`| # | Decision | Resolution | Source | PIN | Landing class |` or the pin→class-pair cell form), at least one ‡-marked row, and a minimal Evidence-consumed block, after D1/D2 settle the vocabulary | (verified: issue #1640 (2026-08-25) — its clusterHint defers examples until ‡/class is settled) |
| D5 | Bare-`slice` fallback | Task-less `slice` cells degrade to the anywhere-citation fallback (same arm class-less pins use), never fan out to all tasks; a task-less-slice fixture pins it | (verified: issues #1638, #1682 (2026-08-25)) |
| D6 | WAIVE id delimiter | `WAIVE-\d+(?!\d)` → `WAIVE-\d+(?!\w)`, matching the sibling pin grammar; fixture: `WAIVE-1a` row is refused as malformed | (verified: issue #1682 (2026-08-25)) |
| D7 | Mark resolution scope | `GUARDRAILS_MARK`/`END_STATE_MARK` resolve by `findIndex` scoped to the tracked intent section's line range, not document-wide; fixture: a decoy bold `**Binding guardrails:**` in Context must not redirect citation targets | (verified: issue #1682 (2026-08-25)) |
| D8 | non-goal arm test | Add a `non-goal`-class fixture to the pin-citation class-mapping test asserting definition-row sufficiency, so deleting the skip arm reds | (verified: issue #1639 (2026-08-25)) |
| D9 | Clause-level pins | `war-strategy-structure.test.sh` gains presence pins for the WAIVE right-delimited-id clause and the gate-1 scope clause in `plan-interview.md`, anchored on stable mid-clause tokens, plus the ‡ definition clause from D2 | (verified: issue #1642 (2026-08-25)) |
| D10 | ctl() messages | The two `lacks_doc_i` controls (patterns 6, 7) print `lacks_doc_i`, not `lacks_i` — parameterize the helper name or branch the printf | (verified: issue #1643 (2026-08-25)) |
| D11 | In-fence bound | Add an indentation-tolerant bound arm for the tag-set extraction call site only (e.g. a second bound var `MEQ_BOUND_INFENCE` including `^[[:space:]]+- `); `MEQ_BOUND` itself is byte-untouched | (verified: issue #1684 (2026-08-25)) |
| D12 | rules 5–8 guard | Extend the retired-count `lacks_i` sweep in `war-pipeline-structure.test.sh` to also scan `plan-interview.md` (assert "rules 5–7" absent), or add an equivalent count-bearing pin in `war-strategy-structure.test.sh`; the sweep-widen is preferred — one guard, both mirrors | (verified: issue #1685 (2026-08-25)) |
| D13 | Drafter degraded arm | war-machine's drafter evidence-read clause gains the same section-absent/issue-unreachable arm as its siblings: absent section = vacuous pass; unreachable issue = named note in the draft, fail-open under `--afk` | (verified: issue #1655 (2026-08-25)) |
| D14 | Scope-lock carve-out | The analyzed-branch scope-lock string gains one explicit exception: "…open nothing else on the machine, EXCEPT: reading a cited issue's `## Evidence artifacts` section via `gh issue view` when your probe prompt directs it (read-only, this repo's issues only)" | (verified: issue #1650 (2026-08-25)) |
| D15 | Four-surface rewrite rule | New patch-style rule in `references/loop-budget.md`: any End-state rewrite greps the plan for the old requirement's distinctive wording and fixes every hit (design-tree row, task slice, condition text, `check:` literal) in the same patch, then re-executes the new `check:` at base and confirms it red (prefer both-halves: new-present AND old-absent); `skills/red-team/SKILL.md` Step 5 gains the ADR-0042 trigger pointer | (verified: issue #1674 (2026-08-25)) |
| D16 | Case-28 ordering pin | New sibling case (case-27 shape: zero-byte baseline AND escape-tripping fixture) asserting exit 2 — pins that infra-argument validation outranks escape detection on the zero-byte path | (verified: issue #1397 (2026-08-25)) |
| D17 | Gitignored residue | Residue check widens to `git status --porcelain --ignored` behind an in-script allowlist array of legitimately-ignored path patterns; non-allowlisted ignored residue routes exit 1 (escape) like untracked residue; case 29's documented-ceiling pin is deliberately flipped to assert detection; header ponytail item 3 rewritten from "not taken" to the taken form | [assumed: escape routing (not advisory) — a sandbox leak into a gitignored path is still a leak; if wrong (false positives on legitimate ignored dirs dominate), demote to the case-19/20-style stderr advisory and keep exit 0 — /red-team ratifies this row] |

## 4. Mechanics

**Doctrine surfaces (war-strategy).** `plan-interview.md`: add the ‡ grammar + twice-read
consequence to the ratified-pin ledger section (D2); reword the Stage-4 gate-1 twice-read
sentence per D1. `strategy-verifier.md`: reword the "Duty-class twice-read rule" heading
paragraph per D1 (the motivating-instances prose stays). `SKILL.md`: one mirror sentence
in template law's design-tree-pin-columns bullet; Example A/B rewritten per D4.

**Lint (`plan-literal-lint.mjs` + `.test.mjs`).** Four surgical edits (D3, D5, D6, D7)
plus fixtures (D5, D6, D7, D8). Each fixture must red against the pre-fix code
(weak-test-assertion law: delete the fix mentally, the assert must fail).

**Structure tests.** `war-strategy-structure.test.sh`: D9 pins, D10 messages, D11
call-site bound. `war-pipeline-structure.test.sh`: D12 sweep widen. Note D9/D2 coupling:
the ‡ clause pin lands only after the doctrine wording is final, so these are ordered
behind the doctrine tasks. Every retirement/absence grep added here is a completeness
floor — after wiring each `lacks_i`/pin, the implementer hand-scans the target file's
same-scope prose, tests, and comments for restatements of the retired/pinned phrase
(sentence-case variants, code-comment mirrors) and lists each straggler as a
survey-derived correction in the task's done report.

**war-machine drafter clause (D13).** Append the degraded arm to the SKILL.md:82 clause,
copying the survey-corps/lenses.md arm's shape (fail-open under `--afk`, named-note on
unreachable). Survey-corps SKILL.md and lenses.md are read as reference shapes, not
edited [assumed: siblings already correct per #1655's framing — if wrong: the task widens
to normalize all three in one commit].

**Red-team scaffold (D14).** Edit the analyzed-branch scope-lock string; the sandbox-
technique branch is untouched. Same-commit duty: grep `agents/` for the scope-lock
phrase ("open nothing else on the machine") and mirror any standing-surface hit — and
because that grep is a floor, also hand-scan the scaffold's neighboring prompt strings
and comments for paraphrases of the lock that would still contradict the carve-out,
listing each as a survey-derived correction.

**Red-team patch doctrine (D15).** New rule text in `loop-budget.md`'s patch-style
section; Step-5 trigger pointer in SKILL.md (`when patching an End state, read
references/loop-budget.md` — pointer-with-trigger shape, ADR 0042). The rule's own
old-wording grep is stated as a floor inside the doctrine text: after the grep, hand-scan
the plan's design tree, task slices, and backstop rows for paraphrases of the old
requirement that the distinctive-wording grep cannot catch, and fix those in the same
patch.

**Escape guard (D16/D17).** `assert-no-repo-escape.sh`: `--ignored` widen + allowlist +
routing; header ponytail rewrite. `.test.sh`: new zero-byte-baseline+escape case (D16),
new gitignored-leak detection case, allowlist-control case (benign ignored path → clean),
case-29 pin flip (D17). `skills/red-team/SKILL.md` + `references/lenses.md`: only if
either surface restates the gitignored ceiling — grep both for "gitignored" /
"ignored paths" and update hits (floor: then hand-scan both files' residue-ceiling prose
for unworded restatements of the ceiling and list stragglers as survey-derived
corrections) (verified: issue #1396 (2026-08-25) names both files in scope).

## 5. Surface changes

- `skills/war-strategy/references/plan-interview.md` — ‡ definition, twice-read rewording, (D2, D1)
- `skills/war-strategy/references/strategy-verifier.md` — twice-read rewording (D1)
- `skills/war-strategy/SKILL.md` — template-law mirror sentence, Example A/B (D2, D4)
- `skills/war-strategy/assets/plan-literal-lint.mjs` — D3, D5, D6, D7
- `skills/war-strategy/assets/plan-literal-lint.test.mjs` — fixtures for D5–D8
- `skills/war-strategy/war-strategy-structure.test.sh` — D9, D10, D11
- `skills/war-machine/war-pipeline-structure.test.sh` — D12
- `skills/war-machine/SKILL.md` — D13
- `skills/red-team/assets/workflow-scaffold.js` — D14
- `skills/red-team/references/loop-budget.md`, `skills/red-team/SKILL.md` — D15 (+ D17 doc hits)
- `skills/red-team/references/lenses.md` — D17 doc hits only, if grep finds any
- `skills/red-team/assets/assert-no-repo-escape.sh`, `assert-no-repo-escape.test.sh` — D16, D17

**Decomposition sketch (code-boundary rules honored; /war-machine owns final carving):**

- **Phase 1 — vocabulary settlement (doctrine only).** Task 1: `plan-interview.md` (D1,
  D2). Task 2: `SKILL.md` (D2 mirror, D4 examples). Task 3: `strategy-verifier.md` (D1).
  File-disjoint, fully parallel.
- **Phase 2 — lint + guards (lands after the vocabulary is landed).** Task 1:
  `plan-literal-lint.mjs` (D3, D5–D7). Task 2: `plan-literal-lint.test.mjs` (D5–D8
  fixtures) — `deps: [Task 1]` wave edge (fixtures assert Task 1's new behavior). Task 3:
  `war-strategy-structure.test.sh` (D9–D11). Task 4: `war-pipeline-structure.test.sh`
  (D12). Task 5: `skills/war-machine/SKILL.md` (D13). All file-disjoint.
- **Phase 3 — red-team arm (file-disjoint from phases 1–2; sequenced as a phase, not for
  a landed-first need).** Task 1: `workflow-scaffold.js` (D14). Task 2:
  `assert-no-repo-escape.sh` + `.test.sh` (D16, D17 code). Task 3: `loop-budget.md` +
  red-team `SKILL.md` + `lenses.md` (D15 + D17 doc hits) — `deps: [Task 2]` wave edge:
  the doc half documents Task 2's settled exit routing, and SKILL.md/lenses.md would
  collide if D17's doc hits were split into Task 2.

Same-file collisions are resolved by task merging (SKILL.md edits for D15 and D17 live in
one task), never by deps-dodging.

## 6. New domain terms (CONTEXT.md)

- **‡ (twice-read marker)** — operator-applied design-tree row marker flagging a pin as a
  standing duty or fence; ‡-marked pins are read twice at echo-back reconciliation.
  Orthogonal to landing class; never a class token. (Candidate entry; adopt if CONTEXT.md
  glossarizes pin-ledger terms — note the CONTEXT.md drift-guard-row trap: a glossary
  mirror needs its skill-doc-contracts row.)

## 7. Recommended ADRs

- None strictly required [assumed: D1's ‡-is-not-a-class resolution is charter-level
  wording repair, not a new binding decision — if wrong (operator deems the twice-read
  selector architectural), a short ADR "‡ marker: twice-read selection is marker-keyed,
  not class-keyed" ratifies it].
- D17's escape-vs-advisory routing for gitignored residue is the one genuinely
  contestable call; if /red-team does not settle it, an ADR stub is the fallback.

## 8. Open risks / implementation notes

- **D17 routing is the largest open judgment** — the allowlist's contents and the
  escape-vs-advisory choice both carry `[assumed:]` tags above; /red-team must ratify or
  the task escalates rather than waiving in prose (ADR 0017).
- **D4's example rewrite is drift-guard-sensitive:** `war-strategy-structure.test.sh`
  pins template-law fragments; the implementer runs the full structure suite locally and
  treats any red as a coupling to update in the same commit, never a pin to loosen.
- **D9's pins must anchor on stable mid-clause tokens**, not line numbers (line refs rot
  across the serial merge queue) and not sentence-initial casing (use `-i` — the recorded
  sentence-case evasion class).
- **D7's section-scoped mark resolution must not regress the no-intent path:** plans with
  neither intent heading currently get `null` marks; the scoped search preserves that.
- **#1684's in-fence bound is call-site-scoped by design** — a global `MEQ_BOUND` widen
  breaks the other atoms' termination contract; the test suite must stay green with only
  the tag-set atom's window narrowed.
- Mirrored surfaces edited here (twice-read clause in two files; drafter arm mirroring
  siblings) are drift pairs: each task's done report names its mirror and confirms
  same-commit coverage.

## 9. Non-goals / deferred

- No new landing classes; no `CLASS_TOKEN` widening (D1).
- No lint promotion beyond exit-0 report-only; no new `/war` gates.
- No general `MEQ_BOUND` redesign — only the tag-set call site (D11).
- Snapshot-blind-spot items 1–2 of the escape guard's ponytail (pre-baseline junk refs,
  local-only origin scope) stay documented ceilings — #1396 covers item 3 only.
- No survey-corps/lenses.md rewording under D13 unless the sibling-shape read finds them
  divergent (then in-scope per the assumption's consequence).

## 10. Validation criteria

Every grep below is a completeness floor, not the proof: after each goes green, the
implementer hand-scans the named file's same-scope prose, tests, and comments for
re-cased or paraphrased stragglers of the target phrase and records each as a
survey-derived correction.

1. WHEN an author reads `plan-interview.md`'s pin-ledger section THE ‡ marker SHALL be
   defined with grammar and twice-read consequence · check: `grep -n '‡' skills/war-strategy/references/plan-interview.md` prints a definition-clause hit in the ledger section (manual same-scope scan follows).
2. WHEN either twice-read clause is read THE selector SHALL key on ‡-marked pins, never on
   a duty/fence landing class · check: `grep -rin 'landing class is a duty' skills/war-strategy/` prints nothing (old-absent half; new-present half via the ‡ clause pin in the structure test).
3. WHEN Example A/B design trees are read THEY SHALL carry PIN ids and a landing-class
   column · check: `grep -n 'Landing class' skills/war-strategy/SKILL.md` hits inside both example fences.
4. WHEN a plan has a bare-`slice` cell and no named task THE lint SHALL fall back to
   anywhere-citation, emitting at most one hit · check: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs` green with the D5 fixture present, red with the fix reverted.
5. WHEN a `WAIVE-1a` row is linted THE row-form rule SHALL refuse it · check: the D6 fixture in the same suite.
6. WHEN a decoy bold guardrails mark precedes the intent section THE citation targets
   SHALL still resolve inside the intent section · check: the D7 fixture in the same suite.
7. WHEN the `non-goal` skip arm is deleted THE test suite SHALL red · check: the D8 fixture in the same suite.
8. WHEN the WAIVE-id clause, the gate-1 scope clause, or the ‡ clause is deleted from
   `plan-interview.md` THE structure test SHALL red · check: `bash skills/war-strategy/war-strategy-structure.test.sh` plus a delete-and-trace of each clause.
9. WHEN controls 6–7 report THE TAP lines SHALL name `lacks_doc_i` · check: `bash skills/war-strategy/war-strategy-structure.test.sh | grep 'lacks_doc_i pattern'` prints both.
10. WHEN indented bullets are inserted after the tag-set anchor inside the merged-plan
    fence THE extraction SHALL terminate before them · check: the D11 bound at the call site; suite green.
11. WHEN `plan-interview.md`'s decisive-slots row reverts to "rules 5–7" THE pipeline
    structure test SHALL red · check: `bash skills/war-machine/war-pipeline-structure.test.sh` with the digits reverted.
12. WHEN a spec's cited issue lacks `## Evidence artifacts` or is unreachable THE drafter
    clause SHALL state the degraded arm · check: `grep -n 'absent\|unreachable' skills/war-machine/SKILL.md` hits inside the drafter clause (manual same-scope scan follows).
13. WHEN the analyzed scope-lock is read THE Evidence-artifacts gh-read exception SHALL be
    present · check: `grep -n 'Evidence artifacts' skills/red-team/assets/workflow-scaffold.js` hits in the scope-lock string, not only the probe prompt.
14. WHEN a /red-team patch rewrites an End state THE doctrine SHALL require the
    four-surface same-patch sweep and red-at-base re-execution · check: `grep -rin 'four surface\|design-tree row' skills/red-team/references/loop-budget.md` hits, plus the Step-5 trigger pointer in `skills/red-team/SKILL.md`.
15. WHEN a zero-byte baseline coincides with a live escape THE guard SHALL exit 2 · check: the D16 case in `bash skills/red-team/assets/assert-no-repo-escape.test.sh`.
16. WHEN sandbox residue lands on a non-allowlisted gitignored path THE guard SHALL detect
    it per the ratified routing · check: the D17 cases in the same suite, including the flipped case-29 pin and the allowlist control.
