# Structural-pin extractor hardening — bound the D6 arm regions, floor and pin the done-when threading, harden the D31 key family

Converted by `/war-machine --afk` from [docs/specs/2026-08-06-structural-pin-extractors-design.md](../specs/2026-08-06-structural-pin-extractors-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a
stated reason; spec citations are provenance-only — Part 1 alone carries every decision, constraint,
and mechanic). Issues addressed: #1373, #1286, #1334, #1375, #1332, #1252. Issue → task mapping:
#1373 + #1286 (the same D6 defect, filed independently) → Task 1.1 items (a)–(d) + the lesson stamp
(i); #1334 finding 1 → Task 1.1 (f), findings 2/3 → Task 1.1 (e), finding 4 → Task 1.1 (g),
finding 5 → Task 1.1 (h); #1375 → Task 1.2 (a); #1332 finding 1 → Task 1.2 (c) (the SKILL.md clause
+ its key), findings 2/3 → Task 1.2 (b) (the two live-clause keys + the block-comment currency);
#1252 → Task 1.2 (d) (AI-declared). `/war` files its own epic + task issues regardless
(war-execution-must-file-issues); closing the six source issues is Lead checkpoint work at phase
close (war-checkpoint-must-close-task-issues) — #1334's and #1332's per-finding close conditions
require each correcting commit to cite the issue (End state 14).

## Context — the gap / problem

Six issues, one class: pin extractors and pin coverage inside the two big JS structural suites whose
own claims outrun what they mechanically prove. Snapshot base for every measured claim: the repo tip
at `6fff2ee` (2026-08-06) — the session worktree's spec-batch and checkpoint commits are docs-only
and touch none of these surfaces; every live-byte claim below was re-verified at conversion
(2026-08-12). **This plan stacks on two committed predecessors that rewrite regions of
`skills/war/assets/workflow-template.test.mjs`:** `docs/plans/2026-08-06-done-when-floor-wiring.md`
(plan 3) and `docs/plans/2026-08-06-gate-audit-finding-routing.md` (plan 6, itself stacked on
plan 3) (verified: the spec's § Open risks binding ordering declaration + both committed plans'
Task 1.1 slices, read at conversion). Committed plan 9 (`2026-08-06-handoff-schemas-contract`) also
edits that file and `skills/war/SKILL.md` — construct-disjoint, contention only, no edge (A5).
Every measured claim in the shared file is tagged measured-at-base + expected-post-predecessor; the
construct-level collision census is Note 1.

1. **The D6 re-land guard search is unbounded on the right** (verified: issue #1373 (2026-08-06);
   verified: issue #1286 (2026-08-06) — the same defect, filed from a lesson and from three auditor
   seats with a Lead reproduction). In `skills/war/assets/workflow-template.test.mjs`,
   `relandSubmodArms` slices from each matched re-land dispatch label to end-of-text
   (`const after = text.slice(m.index)` — a single-argument slice, 1 hit at `6fff2ee`) and binds
   the **first** `SUBMOD_GUARD_RE` match anywhere downstream as that arm's own 2B guard
   (re-verified: live read at conversion, anchored by the `relandSubmodArms` arrow). A future
   re-land arm with no `submodule-pr` guard branch, inserted before a guarded sibling, borrows the
   sibling's guard and scores `guarded: true, assigns: true` — the pin's own `unguarded` assertion
   cannot detect the condition its message names for any non-final arm (verified: issue #1286
   (2026-08-06), reproduced at 2 pass / 0 fail). The "Region boundary (explicit)" comment directly
   above the extractor claims the opposite ("each region runs from its matched dispatch label to
   the end of that arm's 2B guard branch"), and the existing both-ways fixture covers only a
   guarded-but-unassigning mirrored arm — appended at end-of-text, where the EOF slice is
   accidentally correct — never a guardless arm before a guarded sibling (re-verified: both D6
   tests read at conversion).
2. **The D6 header comment's whole-file claim is code-traceably false** (verified: issue #1286
   (2026-08-06), second item; re-verified at conversion). The header states "this file holds no
   contiguous copy of a dispatch label or of the assignment it polices" — but the
   `LITERAL_REGISTRY` census rows hold contiguous copies of both re-land label heads
   (the `environment-proceed` and `baseline-proceed` rows), which `RELAND_LABEL_RE` itself matches.
   The extractor only ever scans the template source (`text = src` default), so the tests are
   unaffected — a false asserted fact in a comment, the ADR 0025 class.
3. **Five demoted findings on the Done-when threading pins** (verified: issue #1334 (2026-08-06);
   all five re-verified unlanded at conversion), same file: (i) `DONE_WHEN_SITES` has **no length
   floor** while its own presence-guard message asserts one ("six sites is the floor") — deleting a
   row silently narrows both threading tests (findings 2/3; the sibling `GATE_SITE_CAPTURES` array
   carries the ratified `assert.equal(<array>.length, …)` anti-vacuity idiom this lacks;
   `DONE_WHEN_SITES.length` has 0 hits at `6fff2ee` — the floor pin is non-vacuous by
   construction); (ii) the set-minus test's trailing comment claims "The `''` arm pins the
   typeof/empty-string guard", but deleting the `typeof task.doneWhen === 'string' &&` conjunct
   from `doneWhenClause` in `skills/war/assets/workflow-template.js` leaves the suite green — no
   non-string value is exercised anywhere (finding 1; conjunct re-verified live at the
   `doneWhenClause` const); (iii) the D6 prompt-truth sweep is titled "every dispatched prompt that
   says keep-the-gate-green carries the gate command" but proves it only over fixture-reachable
   prompts — no source-side census forces a future keep-green prompt into the sweep (finding 4);
   (iv) the Gate:/Done when: **adjacency** message ("rides directly after the Gate: line") is
   backed only by an index-precedence assert — the clause moved to the prompt tail would still
   pass (finding 5). Conversion re-verification of the composition: all six worker-family sites
   render `Gate: ${plan.gate}${doneWhenClause(task)}` — the clause (`\nDone when: …`) IS directly
   concatenated, so the concatenation assert is true at every site today.
4. **D31 paired bounded-gap keys green on a cross-key trigger-token collision** (verified: issue
   #1375 (2026-08-06); re-verified at conversion). In
   `skills/war/assets/skill-doc-contracts.test.mjs`, `D31_INTERACTIVE_ARM`
   (`/interactive[\s\S]{0,80}approval\s+gate/i`) and `D31_AFK_ARM`
   (`/--afk[\s\S]{0,120}refuses\s+dispatch/i`) guard the intake sub-bullet's two-arm routing, and
   the committed `D31_ARMS_SWAPPED` negative reference covers only the swap where each behavior
   keeps its own aside. A compound reword placing the other arm's trigger token inside one key's
   gap (afk routed through "interactive-style review to the approval gate" while interactive runs
   get the refusal) satisfies **both** keys with the routing inverted; the block comment still
   claims "Neither key alone catches every swap shape — the PAIR does". Conversion trace (D15):
   the spec's example gap-negation alone is insufficient for the interactive key — a collided
   fixture's second `interactive` token occurrence ("interactive-style") re-triggers it; the live
   lead-in line's own trigger context is `interactive runs` (1 hit in `skills/war/SKILL.md`), so
   anchoring the trigger to that live token form closes the gap while still matching the line.
5. **Three demoted findings on the done-when intake pins** (verified: issue #1332 (2026-08-06);
   all three re-verified live at conversion): the `**Done-when intake` sub-bullet in
   `skills/war/SKILL.md` (Decompose step 3's sub-bullet) fixes the value boundary ("the bullet's
   text AFTER the `Done when:` key") but is silent on stripping the command's code-span
   backticks — read literally it stages backticks that the verbatim `--cmd-file` execution turns
   into shell command substitution (`backticks` = 0 hits in the file at `6fff2ee`); and the D31
   key array pins **neither** of the two clauses the `--ace` polish commit added — no key matches
   the value-boundary clause or the legacy-arm "intake-defect rule does not fire" precedence
   clause (both clauses live in the lead-in line today — the two new keys match it unmodified),
   against the file's own same-commit maintenance rule. The D31 block comment's rule (b) also
   still states the intake-defect rule unqualified, without the now-live legacy gating.
6. **Reflow orphan** (verified: issue #1252 (2026-08-06); re-verified at conversion — the orphan
   sits at the Task 2.1 doc-cascade banner, `grep -c 'of any kind\. They are$'` = 1): the banner
   strands `They are` on its own line above `// PER-MEDIUM, not uniform: …` — cosmetic,
   comment-only.
7. **Survey-derived corrections carried from the spec (§1.1), re-confirmed at conversion:**
   #1334's "five sites"/"five occurrences" literals are stale — the live tree has **six**
   `DONE_WHEN_SITES` rows and the presence-guard message already reads "six sites is the floor";
   the six space-form `keep the gate` occurrences in `skills/war/assets/workflow-template.js` are
   the FIX_NEEDED, ace, ADD_TEST, MAKE_DONE_PASS, and PACKAGE_IT prompts plus the phase-close
   sweep's parenthetical form (`grep -ioc` = 6), and the three hyphenated `keep-the-gate-green`
   mentions are comments — the only near-misses; the live D31 array holds **17** keys (counted at
   conversion); #1252's line-614 citation is stale — anchored here by construct only. Conversion
   addition: the `GATE_SITE_CAPTURES` floor now reads a higher count than #1334's quoted "15" —
   the issues' count literals are dated snapshots; this plan restates none of them beyond its own
   pinned censuses (AI-declared).
8. **Zero-hit / witness token census** (conversion measurement; the docs-only session commits
   cannot move them): `DONE_WHEN_SITES.length` — 0 hits in `workflow-template.test.mjs`;
   `backticks` — 0 hits in `skills/war/SKILL.md`; `D31_ARMS_COLLIDED` — 0 hits in
   `skill-doc-contracts.test.mjs` — every new-token pin is non-vacuous by construction. OLD-absent
   pins measured 1 at base (non-vacuous): `slice(m.index)` (grep -F), `no contiguous copy of a
   dispatch label`, `of any kind\. They are$`. Predecessor witnesses: `done_when_log_path` = 0
   hits in `workflow-template.js` at the base, ≥ 1 after plan 3 (its End state 4);
   `strictly stronger` = 1 hit in `workflow-template.test.mjs` at the base, 0 after plan 3 (its
   End state 9 — it rewrites the very set-minus test this plan also edits); `ABORTED` = 0 hits in
   `workflow-template.js` at the base, ≥ 1 after plan 6 (its End state 4) — all non-vacuous
   (AI-declared).
9. **Census-scope verification** (the plan-9 LITERAL_REGISTRY question, resolved by live read):
   the #931 template-literal census and its backtick-free-block-comment coupling both scan `src` —
   `workflow-template.js` — never the test file (`untaggedHeadMultiset(src)` at the census test).
   Test-file fixture/comment additions carry **no** census duty, and this plan's D6 fixtures build
   their labels at runtime from live arms (the existing `-probe-proceed` fixture's idiom), adding
   no new contiguous label copy to the file's bytes (AI-declared).
10. **Downstream spine + sibling contention** (verified: spec texts + committed plan `- Files:`
    lines, read at conversion). The unconverted
    `docs/specs/2026-08-06-gate2-publication-guard-design.md` § Open risks declares it lands
    **after** this group and `handoff-schemas-contract` — "all three touch `skills/war/SKILL.md`,
    `skills/war/assets/skill-doc-contracts.test.mjs`" (verbatim) — a real declared edge with this
    plan as upstream. Region check at conversion: gate2's D22 family (the Gate-2 ordered-span
    block) sits well above the Task 2.1 doc-cascade banner this plan rewraps and far above the
    D31 block at the file tail — region-disjoint, though the banner is adjacent to the D22 block's
    end; gate2 re-measures at its own conversion regardless. `skills/war/SKILL.md` is shared with
    committed plan 9 (its Task 1.3 regions: Setup step 2, Decompose step 1, § Run manifest,
    § Per phase, § Checkpoint) — this plan's region is Decompose step 3's Done-when intake
    sub-bullet: region-disjoint (A5). `workflow-template.test.mjs` is shared with plans 3, 6, and
    9 (Note 1's construct census). No committed plan touches `skill-doc-contracts.test.mjs`
    (verified: the nine committed plans' `- Files:` lines). The trailing release-slot overlap with
    every sibling is the sanctioned stacked-release pattern, not contention.
11. **Lesson-stamp check** (verified at conversion): the survey mined both companion lessons into
    this group's issues — issue #1373 carries the `Lesson:` line naming
    `docs/learnings/archive/label-to-guard-region-extraction-must-bound-at-next-label-not-eof.md`
    (unstamped; its description and keywords name the exact `relandSubmodArms` defect this plan
    fixes) and issue #1375 carries the `Lesson:` line naming
    `docs/learnings/archive/multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap.md`
    (a standing test-authoring class rule, cited as a live `[[wikilink]]` by the D31 block comment
    itself). D14: the first is RESOLVED-stamped in the fixing task; the second is deliberately NOT
    stamped (A6). The `reland-submodule-pr-arm-leaves-stale-landresult…` lesson is already
    RESOLVED-stamped (#1245) — no stamp belongs to this plan (AI-declared).

## Pivotal constraints

- **Zero production-behavior diff.** Every change is test-file or doc prose;
  `skills/war/assets/workflow-template.js` is untouched — the typeof pin exercises the live guard
  through the existing mock harness, and the new census only reads the source.
- **Stacking (binding)**: predecessor plans 3 and 6 land first — both rewrite
  `workflow-template.test.mjs` regions (construct-disjoint from this plan's except the shared
  set-minus test, Note 1, statement-disjoint there). Task 1.1 is authored against the
  **post-predecessor** shapes and runs D12 witnesses as its first post-rebase act; a missed
  witness ⇒ **halt and report the missing predecessor, never improvise**.
- **Both D6 tests stay green over the live template at every step** — the bounding change is
  behavior-preserving over today's two guarded arms (verified: both live arms carry their guard
  within their own region at `6fff2ee` — each 2B guard branch closes before the next label; the
  worker re-proves this by suite run at the rebased base).
- **Both-ways discipline**: every new or tightened guard lands with a negative reference (or a
  demonstrated-RED scratch mutation recorded verbatim in the done report), per the
  weak-test-assertion lesson. Fixtures are in-memory text only — never wired into a live surface,
  never written to disk.
- **D31 keys are token-anchored `\s+`-tolerant forms, never sentence bytes**; correct a key to a
  new truth, never drop it to make a reword pass. Any tightened arm key must still match the live
  lead-in line unmodified (verified feasible at conversion: each arm's trigger sits within its own
  aside, no cross-arm token inside either gap, and the interactive arm's live token context is
  `interactive runs` — D15).
- **Guarded-claim lock-step (ADR 0025 + the D31 file's own header rule)**: the `skills/war/SKILL.md`
  backtick-stripping clause extension and its new D31 key land in the **same commit**; the two
  other new keys pin clauses already live (both match the lead-in line today — Context 5).
- **The census must not self-match**: it scans the template source only (never the test file) and
  keys on the space form — the engine's comments use the hyphenated form exclusively (three
  hyphenated comment mentions, the known non-hits; Context 7). The #931 census's converse holds
  too: the test file is not censused, so the new fixtures/comments there carry no registry duty
  (Context 9).
- **Anchor by named construct** (`relandSubmodArms`, the "Region boundary (explicit)" comment,
  `DONE_WHEN_SITES`, `LITERAL_REGISTRY`, `doneWhenClause`, the `**Done-when intake` lead-in, the
  D31 key array, the Task 2.1 doc-cascade banner) — line numbers rot across the serial merge
  queue; the issues' line refs are dated snapshots.
- **Every measured count is a dated snapshot at `6fff2ee` (2026-08-06)** — six `DONE_WHEN_SITES`
  rows, six space-form occurrences, 17 D31 keys, two live re-land arms. The predecessor groups
  land in this file family first, so each count is re-measured at task dispatch (A2); a stale
  pinned count asserts red on landing and the fix is a re-measure, never a guard removal.
- **Platform law**: every committed check whose pattern is intended as a LITERAL — above all one
  carrying MID-pattern metacharacters (`$`, `"`, backslashes, `%`) — runs `grep -F`; BSD grep
  treats a mid-pattern `$` as an anchor (this conversion reproduced the false-red live: a
  `land:phase-${ph.id}:` label grep returned 0 via regex and 2 via `-F`). Anchors are not the
  trap: a deliberate trailing `$` (End state 11's orphan check) is a regex and cannot ride `-F`.
  Execute-your-literals discipline: run each check as written before committing it. (AI-declared)
- **Fixture-flavor hygiene** (D6): the guardless fixture's label must use a `-proceed` flavor
  distinct from both live arms and from the existing mirrored fixture's `-probe-proceed`, derived
  at runtime from a live arm's label — the two fixtures never shadow each other, and no contiguous
  label literal enters the file (Context 9).
- **Doc-corpus pin safety**: the Task 1.2 SKILL.md delta introduces no `ensure-origin` token (the
  gate2 sibling's census) and phrases no CLI verb for the four `doc-cli-consistency.test.mjs`
  modules; `skills/war/SKILL.md` sits under a warning-only advisory byte budget — keep the added
  clause tight and re-measure `wc -c` at the rebased base (AI-declared).
- **Release discipline**: the version bump is its own trailing phase; version literals in this
  plan and the source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | D6 bounding shape | Collect `[...text.matchAll(RELAND_LABEL_RE)]` once; each arm's region is `text.slice(m.index, next ? next.index : text.length)` — right-bounded at the next label match, EOF only for the last arm (#1286's prescribed shape). All downstream offsets (`braceSpan`, receiver capture, `assigns`) already operate on the per-arm `after` text and need no change beyond the bound. The "Region boundary (explicit)" comment is corrected to the now-true bound. | spec §3 "D6 bounding shape"; (verified: issue #1286 (2026-08-06)) |
| D2 | D6 guardless-arm negative reference | New fixture: a labelled re-land arm with **no** guard branch, spliced **before** the first live arm in an in-memory copy; assert exactly that arm reads `guarded: false` through the same live extractor and every live arm unchanged (`guarded: true`, `assigns: true`). The existing mirrored-arm (guarded-but-unassigning) fixture is retained — the two cover different failure shapes. Demonstrated-RED: reverting the bound to an EOF slice in a scratch copy flips the fixture arm to `guarded: true` (the borrow). | spec §3 "D6 guardless-arm negative reference" |
| D3 | D6 header whole-file claim | **Scope, never delete**: reword to claim only that the guard's own patterns are fragment-built, naming the `LITERAL_REGISTRY` census rows (by construct, never quoting label bytes — a quoted label would be a new contiguous copy) as the file's known contiguous label copies. [assumed: scoping over deletion, to keep the self-match rationale readable — if wrong, deletion is strictly safer and loses only prose → A1] | spec §3 "D6 header whole-file claim" (carried [assumed] row) |
| D4 | `DONE_WHEN_SITES` length floor | `assert.equal(DONE_WHEN_SITES.length, 6, …)` as the first statement of the first Done-when threading test, mirroring the `GATE_SITE_CAPTURES` anti-vacuity idiom — six, not the issues' five (Context 7); message naming the purpose ("a site is ADDED, never skipped"). | spec §3 "DONE_WHEN_SITES length floor"; (verified: issue #1334 (2026-08-06)) |
| D5 | typeof half of `doneWhenClause` | Add a non-string arm beside the null/absent/`''` asserts: `DONE_WHEN_SITES[0].run({ doneWhen: 5 })` dispatches the byte-identical legacy prompt — reds if the `typeof` conjunct is deleted. Narrow the comment: the `''` arm pins the truthiness half, the non-string arm pins the typeof half. | spec §3 "typeof half"; (verified: issue #1334 finding 1 (2026-08-06)) |
| D6 | Keep-green universality census | Default-deny space-form count over the template source in the same sweep test: case-insensitive occurrences of `keep the gate` in `src` equal the pinned count (6 @ `6fff2ee`; re-measured at task time), message directing a new keep-green prompt into the D6 sweep. Scans `src` only; the space/hyphen split keeps the engine's comments out. | spec §3 "Keep-green universality census"; (verified: issue #1334 finding 4 (2026-08-06)) |
| D7 | Gate:/Done when: adjacency | Replace the index-precedence assert with a concatenation assert — the prompt contains the `Gate:` line composed via `resolveGate` (already imported in this file) directly followed by `\nDone when: ` + the command — making the "rides directly after" message true. True at every site today: all six sites render `Gate: ${plan.gate}${doneWhenClause(task)}` (Context 3). | spec §3 "Gate:/Done when: adjacency"; (verified: issue #1334 finding 5 (2026-08-06)) |
| D8 | D31 collision hardening | Tighten both arm keys to negated-scan gaps that refuse to cross the other arm's trigger token, add a `D31_ARMS_COLLIDED` inverted-routing negative reference under `doesNotMatch` beside the retained `D31_ARMS_SWAPPED` in the existing both-ways loop, and correct the block comment's "catches every swap shape" claim to enumerate what the pair provably rejects (the two fixture shapes) and the negated-gap mechanism. A fixture alone cannot land first — it is matched by the untightened keys by construction (the demonstrated-RED, recorded in the done report). Binding observables per D15. | spec §3 "D31 collision hardening"; (verified: issue #1375 (2026-08-06)) |
| D9 | D31 new keys | Append three keys: the value-boundary clause (`` /text\s+AFTER\s+the\s+`?Done when:`?\s+key/i ``) and the legacy precedence clause (`/intake-defect\s+rule\s+does\s+not\s+fire/i`) — both match the live lead-in line today (Context 5) — and the backtick-stripping clause key, landing with its SKILL.md clause in the same commit (D10). Update the block comment's rule (b) to carry the legacy gating. | spec §3 "D31 new keys"; (verified: issue #1332 (2026-08-06)) |
| D10 | SKILL.md backtick clause | Extend the existing value-boundary clause in place on the `**Done-when intake` lead-in line: the staged command is the text inside its code span — backticks are markup, stripped exactly as the `Files:` list's are (#1332 finding 1's shape). Purely additive; the insertion sits between two keyed clauses and inside no bounded gap (verified feasible at conversion) — every existing D31 key must still match, proven by the before/after suite run. | spec §3 "SKILL.md backtick clause" |
| D11 | Task 2.1 banner orphan | Comment-only rewrap so the sentence reads continuously into `PER-MEDIUM, not uniform: …`; hand-scan the same banner block for any other reflow orphan (nothing mechanical reads this banner — the survey is the only check). | spec §3 "Task 2.1 banner orphan"; (verified: issue #1252 (2026-08-06)) |
| D12 | Predecessor witness protocol | Task 1.1's worker, first act after the standard rebase: `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 AND `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` = 0 (plan 3's End states 4/9; the second is 1 at `6fff2ee`, so it cannot pass at the un-landed base — and it proves the rewrite of the very set-minus test this task edits) AND `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (plan 6's End state 4; 0 at the base). Any miss ⇒ halt and report, never improvise. Task 1.2 needs no witness — its file family is untouched by the binding predecessors (Context 10). (AI-declared) | conversion judgment (plan 6's D10 / plan 9's D16 witness shape), logged for /red-team |
| D13 | Task decomposition | Two file-disjoint tasks in Phase 1, both wave 1, no deps — Task 1.1 unit A (`workflow-template.test.mjs` + the lesson stamp rider; #1373/#1286/#1334) and Task 1.2 unit B (`skill-doc-contracts.test.mjs` + `skills/war/SKILL.md`; #1375/#1332/#1252 — one task despite two files: the SKILL.md clause and its D31 key are same-commit lock-step, and the D31 edits collide in one file) — plus the standard trailing release phase. No drift guard is split from its fact (rule 7 not in play — each task's guards travel with the text they pin). (AI-declared) | spec §8 task-carving hint + conversion judgment, logged for /red-team; war-strategy §3 |
| D14 | Lesson stamps | The `label-to-guard-region-extraction-must-bound-at-next-label-not-eof` lesson is stamped in Task 1.1: prefix its `description` with `RESOLVED (structural-pin-extractors, #1373/#1286, <land date>)`, body/keywords otherwise untouched (the repo's lesson-stamp convention; the stamped body legitimately keeps present-tense defect prose). The `multi-token-presence-loop…` lesson is NOT stamped — it records a standing test-authoring class rule, cited as a live wikilink by the D31 block comment this plan edits; #1375's fix applies the rule, it does not retire it (A6). The redaction lint gates the edit (a discovered gate member). (AI-declared) | conversion judgment (batch fold-into-fixing-task precedent), logged for /red-team |
| D15 | D31 tightening refinement (binding observables) | The tightened keys and the collided fixture are co-designed under three hard observables: (1) both keys still match the live lead-in line unmodified; (2) both keys sit under `doesNotMatch` for BOTH negative references (`D31_ARMS_SWAPPED` retained + `D31_ARMS_COLLIDED` new); (3) against the untightened keys the collided fixture is matched (the demonstrated-RED proving the tightening is load-bearing). Conversion trace: the bare negated gap (`(?:(?!--afk)[\s\S]){0,80}`) leaves the interactive key matching a collided fixture at its second `interactive` token occurrence — anchor the interactive trigger to its live token form (`interactive\s+runs`, 1 hit in the live line) in addition to the negated gap; the afk key's negated gap (`(?:(?!interactive)[\s\S]){0,120}`) suffices for its side. Exact regexes are worker latitude bounded by the three observables. (AI-declared) | conversion trace over the live line + the #1375 lesson's prescribed fix, logged for /red-team |
| D16 | Check sharpening | End state 2 pins the bounding mechanically as OLD-absent: `grep -Fc 'slice(m.index)'` returns 0 (the bounded form `slice(m.index, …)` does not contain the substring; 1 hit at the base — non-vacuous), replacing the spec's hand-judged "shows no single-argument slice" form; `-F` per platform law (the pattern carries parentheses and dots). (AI-declared) | conversion judgment, logged for /red-team |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Scoping (not deleting) the D6 header claim is the wanted resolution | spec §3 (carried [assumed] row); scoping keeps the self-match rationale readable | deletion is strictly safer and loses only prose — a two-line edit | ratify in /red-team |
| A2 | The four dated counts (six sites, six keep-green occurrences, 17 D31 keys, two re-land arms) hold at the post-predecessor base | spec §2 (carried [assumed] row); conversion re-verified all four at `6fff2ee`, and the committed predecessor slices (plans 3/6/9) add none of the counted constructs — no new `DONE_WHEN_SITES` row, no new space-form keep-green prompt, no D31 or re-land-arm edit (read at conversion) | a stale pinned count asserts red on landing; the fix is a re-measure, never a guard removal | re-measure at task dispatch; the floors' own messages name the update duty |
| A3 | The tightened D31 gaps' false-red friction on future sanctioned rewords is acceptable | spec §8 (carried [assumed] row); the guard's own maintenance rule (correct the key in the same commit, never drop it) is the designed relief valve | fallback: fixture-only coverage — leaves gap-collision shapes other than the pinned one green | ratify in /red-team; backstop row |
| A4 | Predecessor plans 3 and 6 have LANDED before any Task 1.1 dispatch | the spec's § Open risks binding ordering + plan 3's committed Note 6 and plan 6's committed Note 7 (both name this group downstream); no 2026-08-06 survey manifest exists in this worktree — the spec and the committed plans are the source; the roadmap sequences them ahead (ADR 0011) (AI-declared) | Task 1.1 edits collide with predecessor rewrites of the same file — most acutely the shared set-minus test — or land against stale shapes | D12 witnesses at the rebased base; miss ⇒ halt-and-report (backstop row) |
| A5 | No edge onto committed plan 9 — same-file contention only | conversion census (Context 10, Note 1): plan 9's `workflow-template.test.mjs` regions (the handoff criterion-6 test + new filing tests + its trio-comment survey) and its `skills/war/SKILL.md` regions (Setup 2, Decompose 1, manifest, per-phase, Checkpoint) are construct-disjoint from this plan's regions; plan 9's own committed Note 5 records the same disjointness and "no declared edge onto this group" (AI-declared) | a rebase conflict at the campaign's serial plan order — the roadmap's contention rows + ADR 0011 serialization absorb it; no content dangles either way | roadmap contention table; both tasks re-read their files at the rebased base |
| A6 | The multi-token lesson stays unstamped | D14's basis: the lesson is a standing class rule, cited by the live D31 block comment as a `[[wikilink]]`; a RESOLVED stamp would misread the rule as retired while this very plan applies it (AI-declared) | a wanted stamp is a one-line follow-up edit, never a plan defect | ratify in /red-team |
| A7 | The tightened keys + collided fixture are co-designable under D15's three observables | conversion trace against the live lead-in line: the `interactive\s+runs`-anchored key with a negated gap matches the live line and rejects the traced collided shape; the mirrored afk key rejects it via its negated gap; the untightened pair matches it (the #1375 false green, reproduced on paper) (AI-declared) | fall back to A3's fixture-only arm for the shapes the keys cannot separate | End state 8's suite run + the recorded demonstrated-RED; ratify in /red-team |

## Non-goals / deferred

- **No change to the done-when floor** (`assert-done-when.sh`), the `done-unmet` route, or any
  merge/land behavior — the `done-when-floor-wiring` group owns that file family (landed
  upstream).
- **No fix for the `GATE_SITE_CAPTURES` fixture-reachability blind spot** — its enumeration is an
  acknowledged ceiling (verified: issue #1334 finding 4 names it as accepted); this plan closes
  only the claim/evidence mismatch in the sweep whose title says "every".
- **No scanner**: the mirror registry and site arrays grow by row, never by AST scan (the rejected
  ceiling recorded in the suite's own `// ponytail:` comments); `LITERAL_REGISTRY` itself is
  byte-untouched (Context 9 — the census never reads the test file).
- **No SKILL.md rewording beyond the single additive clause**; the intake sub-bullet's routing
  prose is untouched (the D31 hardening is key-side).
- **No retro-conversion of grandfathered spec/plan pairs.**
- **No new CONTEXT.md term, no ADR** (spec §6/§7): "negated-scan gap" and "collision fixture" are
  descriptive, not ratified; governing doctrine exists — ADR 0025 and the three recorded lessons
  the issues cite.
- **Spec §9's "no version bump" is consciously retired** — the batch's release directive ships
  every group as its own trailing release phase (Note 2's deviation record).

## New domain terms · Recommended ADRs

None (see Non-goals — existing terms and ADR 0025 cover the rest).

## AI-Commander's Intent

- **Purpose:** the two big structural suites stop claiming more than they prove — a guardless
  re-land arm can no longer borrow its sibling's guard (the D6 extractor is right-bounded and a
  guardless-arm negative reference proves it), the D6 comments state only whole-file facts that
  are true, the done-when threading pins carry a real length floor, a real typeof pin, a real
  source-side keep-green census, and an adjacency assert that proves the adjacency its message
  claims; the D31 pair can no longer green on an inverted routing hidden by a cross-key token
  collision, the two load-bearing intake clauses the polish commit added are mechanically pinned,
  the backtick-stripping boundary is stated in prose and pinned by a same-commit key, and the
  stranded banner sentence reads continuously — with zero production-behavior diff. (AI-declared)
- **Method:** bound `relandSubmodArms` at the next label match (EOF only for the last arm) and
  correct both D6 comments (scoping, never deleting, the whole-file claim); splice a runtime-built
  guardless fixture before the first live arm and keep the mirrored fixture; floor
  `DONE_WHEN_SITES` at six, add the non-string arm beside the null/absent/`''` asserts, append the
  default-deny space-form census over the template source, and replace the index-precedence assert
  with the `resolveGate`-composed concatenation; tighten the D31 arm keys (live-token-anchored
  triggers + negated-scan gaps) with the `D31_ARMS_COLLIDED` fixture under `doesNotMatch` beside
  the retained swap fixture, append the three keys (two pinning live clauses, one landing with its
  SKILL.md backtick clause in the same commit), refresh the block comment's rule (b) and
  every-swap-shape claim, and rewrap the Task 2.1 banner; author the shared-file work against the
  post-predecessor shapes with halt-on-miss witnesses; every scratch mutation demonstrated-RED and
  recorded; stamp the label-to-guard lesson, leave the multi-token class rule live. (AI-declared)
- **End state:**
  1. When a guardless `-proceed`-flavored re-land arm is spliced before a guarded sibling in an
     in-memory copy of the template source, the D6 extractor reports exactly that arm
     `guarded: false` — never borrowing the sibling's guard — and every live arm unchanged ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` (the new negative
     reference green; the EOF-revert scratch red recorded in the done report). (AI-declared)
  2. `relandSubmodArms`' per-arm guard search is right-bounded at the next label match (EOF only
     for the last arm) and no unbounded slice remains ·
     check: `grep -Fc 'slice(m.index)' skills/war/assets/workflow-template.test.mjs` returns 0
     (1 at the base — D16); then hand-scan the extractor and its region/header comment block for
     prose restating the EOF shape and list each straggler as a survey-derived correction.
     (AI-declared)
  3. The D6 header's self-match claim is scoped to the guard's fragment-built patterns, naming
     the `LITERAL_REGISTRY` rows (by construct) as the file's contiguous label copies ·
     check: `grep -c 'no contiguous copy of a dispatch label'
     skills/war/assets/workflow-template.test.mjs` returns 0 (1 at the base); same-scope
     hand-scan per End state 2's note. (AI-declared)
  4. Deleting a `DONE_WHEN_SITES` row fails the first Done-when threading test on its length
     floor before any per-site assert runs ·
     check: `grep -n 'DONE_WHEN_SITES.length' skills/war/assets/workflow-template.test.mjs`
     shows the `assert.equal(…, 6, …)` floor (0 hits at the base); the scratch row-delete red
     recorded in the done report. (AI-declared)
  5. Scratch-deleting the `typeof task.doneWhen === 'string'` conjunct from `doneWhenClause` in
     the template source fails the suite on the non-string arm ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` green at the tip; the
     scratch-mutation red recorded in the done report. (AI-declared)
  6. A keep-the-gate-green prompt added to `skills/war/assets/workflow-template.js` at a dispatch
     site no sweep fixture reaches fails the census, directing the author into the D6 sweep ·
     check: `grep -ioc 'keep the gate' skills/war/assets/workflow-template.js` equals the pinned
     count (6 @ `6fff2ee`; re-measured at task time); then hand-scan the template source's
     comments for space-form stragglers (the three hyphenated mentions are the known non-hits)
     and list any as a survey-derived correction. (AI-declared)
  7. At every worker-family site the `Done when:` clause is directly concatenated after the
     `Gate:` line — the threading test composes the expected bytes via `resolveGate` and asserts
     the concatenation ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`; the
     scratch-move-the-clause red recorded in the done report. (AI-declared)
  8. A reword that swallows the other arm's trigger token inside one D31 key's gap with the
     routing inverted is rejected by the pair: `D31_ARMS_COLLIDED` and `D31_ARMS_SWAPPED` both
     sit under `doesNotMatch` for both keys, and both keys still match the live lead-in line ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`; the
     untightened-keys-match-the-collided-fixture demonstrated-RED recorded in the done report
     (D15 observable 3). (AI-declared)
  9. Dropping the value-boundary, legacy-precedence, or backtick-stripping clause from the
     `**Done-when intake` sub-bullet fails the D31 row on that clause's key ·
     check: the D31 key array carries the three new keys (grep each pattern in
     `skills/war/assets/skill-doc-contracts.test.mjs`); each scratch clause-delete red recorded
     in the done report. (AI-declared)
  10. Decompose stages a backticked `Done when:` command as the text inside its code span —
      backticks stripped, stated on the lead-in line, its key landing in the same commit ·
      check: `grep -n 'backticks' skills/war/SKILL.md` hits the Done-when intake lead-in line
      (0 hits file-wide at the base — a non-vacuous pin); the clause+key same-commit property is
      judged at audit_sha (`git log --name-only` on the commit shows both unit-B files).
      (AI-declared)
  11. The Task 2.1 banner reads continuously into `PER-MEDIUM, not uniform: …` ·
      check: `grep -c 'of any kind\. They are$'
      skills/war/assets/skill-doc-contracts.test.mjs` returns 0 (1 at the base); hand-scan the
      same banner block for other reflow orphans and list each as a survey-derived correction.
      (AI-declared)
  12. The full gates are green at the integrated tip with zero production diff — the landed
      Phase-1 diff touches only `skills/war/assets/workflow-template.test.mjs`,
      `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/SKILL.md`, and the stamped
      lesson file ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0; the
      footprint judged at audit_sha. (AI-declared)
  13. The label-to-guard-region lesson is stamped RESOLVED with this plan's slug and issues, body
      otherwise untouched; the multi-token lesson is untouched ·
      check: `grep -l 'RESOLVED (structural-pin-extractors'
      docs/learnings/archive/label-to-guard-region-extraction-must-bound-at-next-label-not-eof.md` lists
      the file. (AI-declared)
  14. Every plan-tracked issue is cited by at least one commit in the phase range `<phase-base>..<tip>` — #1373 + #1286 for Task 1.1's D6 items, #1334 for
      Task 1.1's threading items, #1375 + #1332 for Task 1.2's D31/SKILL.md items, #1252 for the
      banner rewrap (the per-finding close conditions require the citation) ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)*
      (AI-declared)
  15. The redaction lint stays green over the lesson stamp ·
      gate: the self-discovery gate (the war-memory lint wrapper is a discovered member).
      (AI-declared)
  16. Release: all four version slots move lock-step to the next free patch above the live
      integration base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic
      floor; the bump's presence is judged at audit_sha). (AI-declared)

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.2 — file-disjoint, no deps) → Phase 2 (release).

No wave edges: the two units share no file and no content (Task 1.2's D31 work references nothing
Task 1.1 authors, and vice versa); rule 7 is not in play — every guard travels with the fact it
pins inside its own task. The binding cross-PLAN ordering (this plan after plans 3 and 6) is
enforced by Task 1.1's D12 witnesses, not by intra-plan structure.

## Phase 1 — Extractor bounding, threading pins, D31 family

### Task 1.1: Engine-suite unit — D6 bounding + comments + fixture, done-when floor/typeof/census/adjacency, lesson stamp

- Files: `skills/war/assets/workflow-template.test.mjs`, `docs/learnings/archive/label-to-guard-region-extraction-must-bound-at-next-label-not-eof.md`
- Plan slice: **Witness first (D12/A4)** — after the standard rebase onto the integration tip,
  verify `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 AND
  `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` = 0 (plan 3's End
  states 4/9 — the second is 1 at `6fff2ee`, so it cannot pass at the un-landed base, and it
  proves plan 3's rewrite of the set-minus test this task also edits) AND
  `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (plan 6's End state 4). A miss
  means a predecessor has not landed: **halt and report, never improvise.** Then re-measure the
  dated counts (A2): `DONE_WHEN_SITES` row count, the space-form keep-green count, the re-land
  arm count — a moved count is re-pinned, never guard-dropped.
  **D6 block** — (a) bounding (D1, #1373/#1286): single `matchAll` pass over `RELAND_LABEL_RE`;
  each arm's `after` is `text.slice(m.index, next ? next.index : text.length)`; downstream logic
  (`SUBMOD_GUARD_RE` match, `braceSpan`, receiver, `assigns`) unchanged. Run the suite before and
  after — both D6 tests stay green over the live template (both live arms carry their guard
  within their own region; the mirrored `-probe-proceed` fixture, appended at end-of-text,
  retains its guard in its own region — never assume, re-prove at the rebased base). (b) region
  comment correction: the "Region boundary (explicit)" comment restates the now-true bound (label
  → next label, EOF for the last arm) instead of the guard-branch-end claim the code never
  implemented. (c) guardless-arm negative reference (D2): a new test (or a new arm of the
  both-ways test) splices a fixture arm — a discoverable `-proceed` flavor distinct from both
  live arms and from `-probe-proceed`, its label derived at runtime from a live arm's label
  (fixture-flavor hygiene; no contiguous label literal enters the file, Context 9) with **no**
  guard branch — **before** the first live arm in an in-memory copy; assert the extractor reports
  exactly that arm `guarded: false` and every live arm unchanged. Demonstrated-RED: in a scratch
  copy, revert the bound to the EOF slice → the fixture arm flips to `guarded: true` (the
  borrow) → red; record the trace in the done report and the test banner. (d) header-comment
  scoping (D3/A1): reword the whole-file self-match sentence to claim only that the guard's own
  patterns are fragment-built, naming the `LITERAL_REGISTRY` rows by construct (never quoting a
  label byte) as the file's known contiguous label copies. Straggler sweep: grep
  `no contiguous copy of a dispatch label` in this file (→ 0) — then hand-scan the full D6
  header/region comment block for any other sentence restating the whole-file claim in different
  bytes; list each as a survey-derived correction (End states 2/3's ceiling).
  **Done-when threading block** — (e) `DONE_WHEN_SITES` floor (D4, #1334-2/3):
  `assert.equal(DONE_WHEN_SITES.length, 6, 'exactly six worker-family Done-when sites are
  enumerated (anti-vacuity floor — a site is ADDED, never skipped)')` as the first statement of
  the first threading test (the `GATE_SITE_CAPTURES` idiom); scratch row-delete → suite red →
  restore (done report). (f) non-string typeof arm (D5, #1334-1): beside the null/absent/`''`
  asserts, `DONE_WHEN_SITES[0].run({ doneWhen: 5 })` dispatches the byte-identical legacy
  prompt; narrow the trailing comment — the `''` arm pins the truthiness half, the non-string
  arm pins the typeof half (the comment sits directly below the region plan 3 rewrote — verify
  the post-plan-3 comment bytes before editing, statement-disjoint by construction, Note 1).
  Demonstrated-RED: scratch-delete the `typeof` conjunct from `doneWhenClause` in a template
  copy → suite red → restore (done report). (g) keep-green census (D6, #1334-4): appended inside
  the D6 prompt-truth sweep test — case-insensitive space-form count of `keep the gate` over
  `src` equals the re-measured pin (6 at `6fff2ee`), message: "a new keep-the-gate-green prompt
  must join the D6 sweep above". Authoring note: the count was measured by grep then confirmed
  by the same-scope manual survey (the three hyphenated comment mentions are the only
  near-misses) — repeat both steps when re-pinning at task time. (h) adjacency (D7, #1334-5): in
  the first threading test, replace the index-precedence pair with the concatenation assert —
  compose the expected bytes via `resolveGate` (imported at the top of this file) and assert
  `c.prompt.includes('Gate: ' + resolveGate(<the fixture gate>) + '\nDone when: ' + DW_CMD)`;
  keep the "rides directly after" message wording it finally makes true; scratch-move the clause
  in a template copy → red → restore (done report; run the scratch move at a site with real
  trailing bytes after the clause — FIX_NEEDED et al., whose prompts continue past
  `${doneWhenClause(…)}` — never the primary worker site, where an intent-less fixture renders
  `${workerIntentClause}` empty so a move-to-tail is byte-neutral and green both sides —
  AI-declared).
  **Lesson stamp (D14)** — (i) prefix the label-to-guard lesson's `description` with
  `RESOLVED (structural-pin-extractors, #1373/#1286, <land date>)`, body/keywords otherwise
  untouched; the multi-token lesson is NOT touched (A6). Census safety: this task adds no
  `workflow-template.js` byte, so the #931 census and the keep-green census cannot move
  (Context 9). Commits cite #1373 + #1286 (items a–d, i) and #1334 (items e–h) — End state 14.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: D31 key family — collision hardening, three new keys, backtick clause, banner rewrap

- Files: `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/SKILL.md`
- Plan slice: base-resident constructs — no committed 2026-08-06 plan touches
  `skill-doc-contracts.test.mjs`, and the `skills/war/SKILL.md` region (Decompose step 3's
  `**Done-when intake` sub-bullet) is disjoint from committed plan 9's regions (A5); no witness
  needed, but re-read both files at the rebased base before editing.
  **D31 hardening (`skill-doc-contracts.test.mjs`)** — (a) collision hardening (D8/D15, #1375):
  tighten `D31_INTERACTIVE_ARM` and `D31_AFK_ARM` to negated-scan gaps that refuse to cross the
  other arm's trigger token, anchoring the interactive trigger to its live token form
  (`interactive\s+runs` — D15's conversion trace; the bare negated gap alone leaves the key
  matching a collided fixture at a second `interactive` token occurrence); add the
  `D31_ARMS_COLLIDED` negative reference — an inverted-routing reword placing the other arm's
  trigger token inside one key's gap (the #1375 shape: afk routed through interactive-style
  review to the approval gate while interactive runs get the refusal) — asserted `doesNotMatch`
  by both keys in the existing both-ways loop, `D31_ARMS_SWAPPED` retained beside it. Binding
  observables (D15): both keys match the live lead-in line unmodified; both keys reject both
  fixtures; the untightened keys match the collided fixture (demonstrated-RED in the done
  report — proves fixture and tightening land together). Correct the block comment: no "catches
  every swap shape" claim survives — it names the two provably-rejected shapes and the
  negated-gap + live-token-anchor mechanism. (b) three new keys + rule (b) currency (D9,
  #1332-2/3): append to the D31 key array — the value-boundary key
  (`` /text\s+AFTER\s+the\s+`?Done when:`?\s+key/i ``) and the legacy-precedence key
  (`/intake-defect\s+rule\s+does\s+not\s+fire/i`), both matching the live line today (run the
  suite to prove it before any SKILL.md edit), plus the backtick-stripping key (a
  token-anchored `\s+`-tolerant form over the new clause's tokens, e.g. matching
  "backticks are markup, stripped") landing in the **same commit** as its clause (c); update the
  block comment's rule (b) sentence to carry the now-live legacy gating ("Legacy arm (checked
  first): … the intake-defect rule does not fire"). **SKILL.md clause (D10, #1332-1)** — (c)
  extend the value-boundary clause in place on the `**Done-when intake` lead-in line: "— the
  bullet's text AFTER the `Done when:` key, never the key itself, and the command inside its
  code span (backticks are markup, stripped exactly as the `Files:` list's are)". Purely
  additive; the insertion sits between two keyed clauses and inside no bounded gap. Run the D31
  suite before and after: all 17 pre-existing keys (re-measured at the rebased base, A2) match
  both the pre- and post-extension line — record both runs in the done report. Pin safety: the
  delta introduces no `ensure-origin` token, no CLI-verb phrasing for the four
  doc-cli-consistency modules, and stays tight under the file's warning-only advisory budget
  (re-measure `wc -c skills/war/SKILL.md` at the rebased base, record it). **Banner rewrap
  (D11, #1252)** — (d) comment-only rewrap of the Task 2.1 doc-cascade banner so the sentence
  reads continuously into `PER-MEDIUM, not uniform: …`; then hand-scan the same banner block
  for any other reflow orphan (a line ending mid-clause) — nothing mechanical reads this
  banner, so the survey is the only check; list each as a survey-derived correction. Region
  discipline: the D22 ordered-span block directly above the banner is byte-untouched (the
  unconverted gate2 sibling's declared region — Context 10). Commits cite #1375 (a), #1332
  (b–c), #1252 (d) — End state 14.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
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
  plan or the campaign roadmap is non-authoritative). Expected integration base: the tip after
  predecessors `2026-08-06-done-when-floor-wiring` and `2026-08-06-gate-audit-finding-routing`
  (this plan's declared upstream chain) plus whichever other 2026-08-06 campaign predecessors the
  roadmap sequences ahead — `2026-08-06-handoff-schemas-contract` completes the
  `workflow-template.test.mjs` chain (plans 3/6/9) by checkpoint order, contention-only (A5)
  (ADR 0011 stack-and-plow). Standalone fallback: this plan does not run before plans 3 and 6 —
  the D12 witnesses halt-and-report a missing predecessor (never a downshift); on a witnessed
  plain-`/war` run, resolve the next free patch from the four slots themselves. The Status blurb
  names: the D6 re-land extractor right-bounded with a guardless-arm negative reference, the
  done-when threading pins floored and completed (length floor, typeof arm, keep-green source
  census, adjacency concatenation), and the D31 intake guard hardened (collision-rejecting arm
  keys, three new clause keys, the backtick-stripping boundary) — quoting only identifiers that
  exist in the landed diff (release-blurb lessons: count words match the enumeration; quoted
  literals byte-match landed identifiers; guard semantics stated no wider than the
  implementation — these are test-and-doc guards, zero production-behavior change).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- The manual same-scope survey halves of End states 2, 3, 6, and 11 · why deferred: a hand-scan
  cannot be a mechanical gate member; done-report-only evidence, which gate-audit reads as SOFT
  and never a hold · runner: the owning task's worker (1.1 for End states 2/3/6, 1.2 for End
  state 11) records each outcome — mandatory statement even when "zero stragglers"; the Lead
  re-runs the paired greps at phase close.
- The predecessor witnesses (D12/A4) on a standalone run · why deferred: a campaign run
  discharges them by spine order; only a plain-`/war` run can encounter the missing-predecessor
  state · runner: Task 1.1 runs the three greps as its first post-rebase act and halt-and-reports
  on a miss — the standalone fallback is halt, never improvisation.
- The five demonstrated-RED scratch mutations (End state 1's EOF-revert, End state 4's
  row-delete, End state 5's typeof-delete, End state 7's clause-move, End state 8's
  untightened-keys-vs-collided-fixture) · why deferred: delete-and-trace mutation runs are
  uncommittable by design — the committed fixtures/floors/asserts are the standing non-vacuity
  guards · runner: each owning task's worker runs them locally and records the reds verbatim in
  the done report; gate-audit reads them SOFT.
- Task 1.2's before/after D31 key-match runs (all pre-existing keys match the lead-in line before
  and after the clause extension) · why deferred: the "before" half is a pre-change suite run,
  uncommittable · runner: Task 1.2's worker runs the suite both sides of the SKILL.md edit and
  records both in the done report; the committed suite run is the standing guard.
- The A3 friction valve (a future sanctioned intake reword that legitimately mentions the other
  arm's token inside an aside false-reds a tightened key) · why deferred: not a validation this
  plan can run — a designed maintenance property; the guard's own header rule (correct the key in
  the same commit, never drop it) is the relief · runner: the future rewording commit; a false-red
  that cannot be resolved by a key correction files an issue citing #1375.
- The census re-pin duty (a sibling plan adding a keep-green prompt or a `DONE_WHEN_SITES` row
  moves a pinned count) · why deferred: future-plan behavior, unverifiable here; the floors' own
  messages name the update duty so the red routes to a deliberate re-pin, never a guard delete ·
  runner: the census/floor assertion messages + the future task's worker.

## Notes / conscious deviations

1. **Construct-level collision census vs plans 3, 6, and 9** (the stacking honesty; verified:
   the three committed Task 1.1 slices, read at conversion). In `workflow-template.test.mjs` —
   plan 3 edits: the set-minus test's per-site residue-guard region (restoring the line-anchored
   assert, deleting "strictly stronger" from the block comment), the 'done-when floor threading
   (Task 2.3)' test, the D3 registry done-when row anchors, new baseline-proceed/capture
   fixtures; plan 6 edits: the 'mechanical mapped-tests grep' registry row anchors, the
   'reporter-format premise' and 'authMappedLine twin' tests, a new sweep-routing test, consumer
   banner coupling in the per-task D7 threading test; plan 9 edits: the 'handoff block
   (criterion 6)' null-pin test, new filing-coverage tests, a fixture sweep keyed on
   `dispatchKind`, and a trio-comment survey over both engine files. This plan edits: the D6
   re-land block (`relandSubmodArms` + its two tests + header/region comments), the
   `DONE_WHEN_SITES` block (the first threading test's floor + adjacency; the set-minus test's
   null/absent/`''` tail + trailing comment; the D6 prompt-truth sweep's census). **The one
   shared construct is the set-minus test** ("Done when threading — absent ⇒ '' (set-minus)"):
   plan 3 rewrites its per-site loop's residue guard and block comment; this plan adds the
   non-string arm and narrows the *trailing* comment beside the null/absent/`''` asserts —
   statement-disjoint edits to one test function, ordered by the D12 `strictly stronger` = 0
   witness (which cannot pass until plan 3's rewrite of exactly that region has landed). Every
   other pair is construct-disjoint; this plan touches no D3 registry row, no `LITERAL_REGISTRY`
   row, and no handoff/mapped-tests/premise construct. Merge order (3 → 6 → 9 → this plan) is
   enforced by witnesses and the roadmap spine, not by luck. (AI-declared)
2. **Release phase despite spec §9** — the spec's "no version bump (test + doc changes only)"
   line is consciously retired: the batch's binding release directive ships every converted group
   with the standard trailing release phase (stack-and-plow cadence, ADR 0011), and every
   committed 2026-08-06 plan carries it. A knowing deviation from the source spec, logged for
   /red-team. (AI-declared)
3. **Lesson-stamp split (D14/A6)** — the label-to-guard lesson is stamped (its description names
   the exact defect this plan fixes; the fold-into-fixing-task precedent); the multi-token lesson
   is deliberately left unstamped: it records a standing test-authoring class rule that the live
   D31 block comment cites as a wikilink and that this very plan applies — a RESOLVED prefix
   would misread the rule as retired. Self-adjudicated under --afk; /red-team re-verifies.
   (AI-declared)
4. **D15 is a refinement beyond the spec's example** — the spec's illustrative negated-gap
   (`(?:(?!--afk)[\s\S]){0,80}`) alone does not make the interactive key reject a collided
   fixture carrying a second `interactive` token occurrence ("interactive-style"); the
   conversion trace adds the live-token trigger anchor (`interactive\s+runs`, 1 hit in the live
   line) and demotes the exact regexes to worker latitude bounded by three hard observables
   (live-line match; both fixtures rejected by both keys; untightened keys match the collided
   fixture). Self-adjudicated; /red-team re-verifies the trace. (AI-declared)
5. **No edge onto plan 9, and the downstream gate2 record** (A5, Context 10). Plan 9 shares both
   Task 1.1's file and Task 1.2's SKILL.md — construct-disjoint everywhere (plan 9's own
   committed Note 5 records the same, including that gate2's spec **overstates** plan 9's
   footprint). The unconverted `gate2-publication-guard` declares itself downstream of THIS group
   (verified quote, Context 10) — the roadmap must carry plans 3 and 6 → this plan and this
   plan → gate2 as dependency-spine edges, plus `## Shared-file contention` rows for
   `workflow-template.test.mjs` (plans 3/6/9 + this), `skills/war/SKILL.md` (plan 9 + this +
   gate2), and `skill-doc-contracts.test.mjs` (this + gate2 — the D22 vs D31/banner region
   split). The trailing release-slot overlap with every sibling is the sanctioned
   stacked-release pattern, not contention. (AI-declared)
6. **Posterity survivors.** Historical artifacts keep the retired wordings and are never
   retro-edited (ADR 0046 posture): the six source issues' verbatim quotes, the source spec, the
   two lesson bodies (the stamped lesson keeps its present-tense defect prose by the stamp
   convention), and the landed 2026-08-05 precision-chain artifacts all carry the EOF-slice
   description, the whole-file claim, the "every swap shape" claim, and the stranded-banner
   bytes. Every OLD-absent check here is scoped to the single live surface its End state names —
   `workflow-template.test.mjs` (End states 2/3), `skill-doc-contracts.test.mjs` (End state 11).
   (AI-declared)
7. **Fixture hygiene keeps the scoped header claim true** — both D6 fixtures build their labels
   at runtime from live arms (Context 9), so after D3's reword the file's only contiguous label
   copies remain the named `LITERAL_REGISTRY` rows; the reworded header must name them by
   construct, never quote them, or the reword would mint the very copy it documents. (AI-declared)
8. **Intent provenance + AFK conversion record (AI-declared).** The pipeline runs `--afk` (no
   operator volley ratifies this plan), so it carries `## AI-Commander's Intent` and the
   AI-declared backstops heading (ADR 0014), and every row this conversion authored without
   operator ratification carries an inline AI-declared marker. Part 1 and the intent block are
   distilled from the ratified source spec — itself synthesized from the code-verified lesson
   issues #1373/#1375, the war-followup issues #1334/#1332, the auditor-reproduced #1286, and
   the cosmetic #1252; the spec's flagged [assumed] rows are carried as A1–A3 with fallbacks
   intact; conversion-time judgments (D12–D16, A4–A7, Notes 1–7) are logged for /red-team
   re-verification. **Predecessor-consistency check** (afk-conversion doctrine): committed plans
   1–8 carry the operator-form intent heading; plan 9 is the batch's first AI-form block and
   this plan is the second — tone, scope discipline, and the standing constraints (fail-closed
   guards with both-ways proof, halt-on-miss witnesses, anchor-by-construct, release-trailing,
   zero-production-diff honesty) continue the predecessors' shape unchanged; no divergence
   beyond the ADR 0014 heading pair itself. Recorded here, never silently shipped.
9. **Check sharpenings vs the spec (D16)** — knowing deviations, all tightenings: (a) End
   state 2 replaces the spec's hand-judged "shows no single-argument slice" with the mechanical
   OLD-absent `grep -Fc 'slice(m.index)'` = 0 (1 at base, non-vacuous; `-F` per platform law);
   (b) End state 10 adds the explicit 0-at-base non-vacuity note for the `backticks` pin and
   routes the same-commit half to audit_sha judgment instead of a worker-run `git log` grep;
   (c) End states 4/8 carry their zero-hit-at-base tokens (`DONE_WHEN_SITES.length`,
   `D31_ARMS_COLLIDED`) measured at conversion. (AI-declared)

## Open decisions

None. The spec's design tree is fully resolved; the spec-flagged veto points (A1 scope-not-delete,
A2 dated counts, A3 tightened-gap friction) and every conversion-time and self-adjudicated
judgment (D12–D16, A4–A7, Notes 1–9) are logged above for /red-team — the sole downstream
ratifier under `--afk`.
