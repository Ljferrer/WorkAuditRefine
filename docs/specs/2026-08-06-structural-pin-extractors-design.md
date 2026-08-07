# Structural-pin extractor hardening — D6 arm bounding, done-when threading pins, D31 key family

Issues: #1373, #1286, #1334, #1375, #1332, #1252

## 1. Context — the gap / problem

Six issues, one class: **pin extractors and pin coverage inside the two big JS structural suites
whose own claims outrun what they mechanically prove.** All claims below re-verified against the
live tree at `6fff2ee` (2026-08-06); several issue literals were corrected by that survey (§1.1).

1. **D6 re-land guard search is unbounded on the right** (verified: issue #1373 (2026-08-06);
   verified: issue #1286 (2026-08-06) — the same defect, filed independently from a lesson and
   from three auditor seats with a Lead reproduction). In
   `skills/war/assets/workflow-template.test.mjs`, `relandSubmodArms` slices from each matched
   re-land dispatch label to end-of-text (`text.slice(m.index)`, no second argument) and binds
   the **first** `SUBMOD_GUARD_RE` match anywhere downstream as that arm's own 2B guard
   (verified: live tree @ `6fff2ee` (2026-08-06), `relandSubmodArms`). A future re-land arm with
   no `submodule-pr` guard branch, inserted before a guarded sibling, borrows the sibling's guard
   and scores `guarded: true, assigns: true` — the pin's own `unguarded` assertion cannot detect
   the condition its message names for any non-final arm (verified: issue #1286 (2026-08-06),
   reproduced at 2 pass / 0 fail). The region comment directly above the extractor says the
   opposite ("each region runs from its matched dispatch label to the end of that arm's 2B guard
   branch"), and the existing both-ways fixture covers only a guarded-but-unassigning mirrored
   arm, never a guardless one (verified: live tree @ `6fff2ee` (2026-08-06), the two D6 tests).
2. **The D6 header comment's whole-file claim is code-traceably false** (verified: issue #1286
   (2026-08-06), second item). The header states "this file holds no contiguous copy of a
   dispatch label or of the assignment it polices, and a future sweep for either cannot
   self-match on the guard" — but the `LITERAL_REGISTRY` census rows hold contiguous copies of
   both re-land labels (`land:phase-${ph.id}:environment-proceed`,
   `land:phase-${ph.id}:baseline-proceed` heads) that `RELAND_LABEL_RE` itself matches
   (verified: live tree @ `6fff2ee` (2026-08-06), `LITERAL_REGISTRY`). The extractor only ever
   scans the template source, so the tests are unaffected — this is a false asserted fact in a
   comment, the ADR 0025 class.
3. **Five demoted findings on the Done-when threading pins** (verified: issue #1334
   (2026-08-06); all five re-verified unlanded at `6fff2ee`), same file:
   - `DONE_WHEN_SITES` has **no length floor** while its own presence-guard message asserts one
     ("six sites is the floor") — deleting a row silently narrows both threading tests
     (findings 2/3; the sibling `GATE_SITE_CAPTURES` array carries the ratified
     `assert.equal(length, …)` anti-vacuity idiom this lacks).
   - The `''` arm's comment claims it "pins the typeof/empty-string guard", but deleting the
     `typeof task.doneWhen === 'string' &&` conjunct from `doneWhenClause` in
     `skills/war/assets/workflow-template.js` leaves the suite green — no non-string value is
     exercised anywhere (finding 1; verified: live tree @ `6fff2ee` (2026-08-06),
     `doneWhenClause`).
   - The D6 prompt-truth sweep is titled "every dispatched prompt that says keep-the-gate-green
     carries the gate command" but proves it only over fixture-reachable prompts; no source-side
     census forces a future keep-green prompt into the sweep (finding 4).
   - The Gate:/Done when: **adjacency** message ("rides directly after the Gate: line") is backed
     only by an index-precedence assert — the clause moved to the end of the prompt would still
     pass (finding 5).
4. **D31 paired bounded-gap keys green on a cross-key trigger-token collision** (verified: issue
   #1375 (2026-08-06)). In `skills/war/assets/skill-doc-contracts.test.mjs`, `D31_INTERACTIVE_ARM`
   (`/interactive[\s\S]{0,80}approval\s+gate/i`) and `D31_AFK_ARM`
   (`/--afk[\s\S]{0,120}refuses\s+dispatch/i`) guard the intake sub-bullet's two-arm routing, and
   the committed `D31_ARMS_SWAPPED` negative reference only covers the swap where each behavior
   keeps its own aside. A compound reword placing the other arm's trigger token inside one key's
   gap (afk routed through "interactive-style review to the approval gate" while interactive runs
   get the refusal) satisfies **both** keys with the routing inverted; the guard's header comment
   still claims "Neither key alone catches every swap shape — the PAIR does" (verified: live
   tree @ `6fff2ee` (2026-08-06), the D31 block comment).
5. **Three demoted findings on the done-when intake pins** (verified: issue #1332 (2026-08-06);
   all three re-verified live at `6fff2ee`): the `**Done-when intake` sub-bullet in
   `skills/war/SKILL.md` fixes the value boundary ("text AFTER the `Done when:` key") but is
   silent on stripping the command's code-span backticks — read literally it stages backticks
   that the verbatim `--cmd-file` execution turns into shell command substitution; and the D31
   key array pins **neither** of the two clauses the `--ace` polish commit added — no key
   matches the value-boundary clause or the legacy-arm "intake-defect rule does not fire"
   precedence clause, against the file's own same-commit maintenance rule. The D31 block
   comment's rule (b) also still states the intake-defect rule unqualified, without the
   now-live legacy gating (verified: issue #1332 (2026-08-06), finding 3).
6. **Reflow orphan** (verified: issue #1252 (2026-08-06)): the Task 2.1 banner in
   `skills/war/assets/skill-doc-contracts.test.mjs` strands `They are` on its own line
   (`// of any kind. They are` / `// PER-MEDIUM, not uniform: …`) — cosmetic, comment-only
   (verified: live tree @ `6fff2ee` (2026-08-06), the Task 2.1 doc-cascade banner).

### 1.1 Survey-derived corrections to the issue literals

The issues' greps were treated as a floor; a manual same-scope survey of the named constructs at
`6fff2ee` (2026-08-06) corrects:

- #1334 says **five** `DONE_WHEN_SITES` rows / five keep-green occurrences; the live tree has
  **six** of each — `MAKE_DONE_PASS` joined via Task 2.3, and the presence-guard message already
  reads "six sites is the floor". Every count in this spec pins six.
- #1334 finding 4 cites occurrences by line number (`:1141` etc.); all six live space-form
  `keep the gate` occurrences in `skills/war/assets/workflow-template.js` are the FIX_NEEDED,
  ace, ADD_TEST, MAKE_DONE_PASS, and PACKAGE_IT prompts plus the phase-close sweep's
  parenthetical form; the three hyphenated `keep-the-gate-green` mentions are comments and are
  not hits.
- #1252 cites line 614; the orphan now sits at line 696 — anchored here by construct (the
  Task 2.1 doc-cascade banner), never by line number.
- #1332 says "17-key array" in one finding and "all 18 keys" in another; the live D31 array
  holds **17** keys at `6fff2ee` (2026-08-06).

## 2. Pivotal constraints

- **Zero production-behavior diff.** Every change is test-file or doc prose;
  `skills/war/assets/workflow-template.js` is untouched (the typeof pin exercises the live guard
  through the existing mock harness, and the census only reads the source).
- **Both D6 tests stay green over the live template at every step** — the bounding change is
  behavior-preserving over today's two guarded arms (verified: both live arms carry their guard
  within their own region at `6fff2ee`).
- **Both-ways discipline**: every new or tightened guard lands with a negative reference (or a
  demonstrated-RED scratch mutation recorded verbatim in the done report), per the repo's
  weak-test-assertion lesson. Fixtures are in-memory text only — never wired into a live
  surface, never written to disk.
- **D31 keys are token-anchored `\s+`-tolerant forms, never sentence bytes**; correct a key to a
  new truth, never drop it to make a reword pass. Any tightened arm key must still match the
  live lead-in line unmodified (verified feasible: in the live prose each arm's trigger token
  sits within its own aside, with no cross-arm token inside either gap at `6fff2ee`).
- **Guarded-claim lock-step (ADR 0025 + the D31 file's own header rule)**: the `skills/war/SKILL.md`
  backtick-stripping clause extension and its new D31 key land in the **same commit**; the two
  other new keys pin clauses already live.
- **The census must not self-match**: it scans the template source only (never the test file),
  and keys on the space form — the engine's comments use the hyphenated form exclusively
  (verified: live tree @ `6fff2ee` (2026-08-06), three hyphenated comment mentions).
- **Anchor by named construct** (`relandSubmodArms`, `DONE_WHEN_SITES`, `LITERAL_REGISTRY`, the
  `**Done-when intake` lead-in, the Task 2.1 doc-cascade banner) — line numbers rot across the
  serial merge queue.
- **Every measured count is a dated snapshot at `6fff2ee` (2026-08-06)** — six sites, six
  space-form occurrences, 17 D31 keys, two live re-land arms. Sibling groups land in this file
  family first (§8), so each count is re-measured at conversion and again at task time
  [assumed: the sibling groups may shift these counts — if a stale count is pinned, the new
  floor asserts red on landing and the fix is a re-measure, not a guard removal].

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| D6 bounding shape | Collect `[...text.matchAll(RELAND_LABEL_RE)]` once; each arm's region is `text.slice(m.index, next ? next.index : text.length)` — right-bounded at the next label, EOF only for the last arm (#1286's prescribed shape). The region comment is corrected to match. |
| D6 guardless-arm negative reference | New fixture: a labelled re-land arm with **no** guard branch, spliced **before** the first live arm in an in-memory copy; assert exactly that arm reads `guarded: false` through the same live extractor. The existing mirrored-arm (guarded-but-unassigning) fixture is retained — the two cover different failure shapes. |
| D6 header whole-file claim | **Scope, never delete**: reword to claim only that the guard's own patterns are fragment-built, naming the `LITERAL_REGISTRY` rows as the file's known contiguous label copies. [assumed: scoping over deletion, to keep the self-match rationale readable — if wrong, deletion is strictly safer and loses only prose] |
| `DONE_WHEN_SITES` length floor | `assert.equal(DONE_WHEN_SITES.length, 6, …)` as the first statement of the first threading test, mirroring the `GATE_SITE_CAPTURES` anti-vacuity idiom — six, not the issues' five (§1.1). |
| typeof half of `doneWhenClause` | Add a non-string arm beside the null/absent/`''` asserts: `DONE_WHEN_SITES[0].run({ doneWhen: 5 })` dispatches the byte-identical legacy prompt — reds if the `typeof` conjunct is deleted. Narrow the comment: the `''` arm pins the truthiness half, the non-string arm pins the typeof half. |
| Keep-green universality census | Default-deny space-form count over the template source in the same test: occurrences of `keep the gate` (case-insensitive) equal the pinned count (6 @ `6fff2ee`, 2026-08-06), message directing a new keep-green prompt into the sweep. Scans `src` only; the space/hyphen split keeps comments out. |
| Gate:/Done when: adjacency | Replace the index-precedence assert with a concatenation assert — the prompt contains the `Gate:` line composed via `resolveGate` directly followed by `\nDone when: ` + the command — making the "rides directly after" message true. |
| D31 collision hardening | Tighten both arm keys to negated-scan gaps that refuse to cross the other arm's trigger token (e.g. `(?:(?!--afk)[\s\S]){0,80}` in the interactive key, the mirror in the afk key), add a `D31_ARMS_COLLIDED` inverted-routing negative reference under `doesNotMatch` beside the retained `D31_ARMS_SWAPPED`, and correct the header comment's "catches every swap shape" claim to enumerate what the pair provably rejects. A fixture alone cannot land first — it fails against the untightened keys by construction. |
| D31 new keys | Append three keys: the value-boundary clause (`` /text\s+AFTER\s+the\s+`?Done when:`?\s+key/i ``), the legacy precedence clause (`/intake-defect\s+rule\s+does\s+not\s+fire/i`) — both match the live line today (verified: issue #1332 (2026-08-06), finding 3) — and the backtick-stripping clause key, landing with its SKILL.md clause in the same commit. Update the block comment's rule (b) to carry the legacy gating. |
| SKILL.md backtick clause | Extend the existing value-boundary clause in place: the staged command is the text inside its code span — backticks are markup, stripped exactly as the `Files:` list's are (#1332 finding 1's shape). Purely additive; every existing D31 key must still match. |
| Task 2.1 banner orphan | Comment-only rewrap so the sentence reads continuously into `PER-MEDIUM, not uniform: …`. |

## 4. Mechanics

### `skills/war/assets/workflow-template.test.mjs`

- **`relandSubmodArms` bounding**: single `matchAll` pass; per-arm slice right-bounded at the
  next label's index (design tree "D6 bounding shape" row). All downstream offsets (`braceSpan`, receiver capture,
  `assigns`) already operate on the per-arm `after` text and need no change beyond the bound.
- **Region comment correction**: the "Region boundary (explicit)" comment restates the now-true
  bound (label → next label, EOF for the last arm) instead of the guard-branch-end claim the
  code never implemented.
- **Guardless-arm negative reference** (new test or new arm of the both-ways test): splice a
  fixture arm (a discoverable `-proceed`-flavored label with no guard branch) before the first
  live arm in an in-memory copy; assert the extractor reports exactly that arm
  `guarded: false` and the live arms unchanged. Demonstrated-RED: reverting the bound to an EOF
  slice in a scratch copy flips the fixture arm to `guarded: true` (the borrow) and the test red.
- **Header-comment scoping**: reword the whole-file self-match sentence per the design tree "D6 header whole-file claim" row.
  After the reword, sweep this file for the retired unscoped wording (`no contiguous copy of a
  dispatch label`) — and, grep being a floor, hand-scan the full D6 header/region comment block
  for any other sentence restating the whole-file claim in different bytes; list each straggler
  as a survey-derived correction.
- **`DONE_WHEN_SITES` floor**: the `assert.equal(…, 6, …)` first statement (design tree "DONE_WHEN_SITES length floor" row),
  message naming the anti-vacuity purpose ("a site is ADDED, never skipped").
- **Non-string arm + comment narrowing** (design tree "typeof half" row), in the set-minus test beside the
  existing null/absent/`''` asserts.
- **Census** (design tree "Keep-green universality census" row), appended inside the keep-green sweep test. Authoring note:
  the count was measured by case-insensitive occurrence grep over the template source, then the
  same-scope manual survey confirmed the three hyphenated comment mentions are the only
  near-misses (§1.1) — repeat both steps (grep, then hand-scan titles/comments for space-form
  stragglers) when re-pinning the count at task time.
- **Adjacency assert** (design tree "Gate:/Done when: adjacency" row): compose the expected bytes via `resolveGate` (already
  imported in this file) and assert `c.prompt.includes(…)`; drop the weaker index-precedence
  form; keep the message wording it finally makes true.

### `skills/war/assets/skill-doc-contracts.test.mjs`

- **D31 arm-key tightening + collision fixture** (design tree "D31 collision hardening" row): negated-scan gaps in
  `D31_INTERACTIVE_ARM` / `D31_AFK_ARM`; new `D31_ARMS_COLLIDED` fixture (inverted routing, the
  other arm's trigger token inside one gap) asserted `doesNotMatch` by both keys in the existing
  both-ways loop; `D31_ARMS_SWAPPED` retained. Header comment corrected (no "every swap shape"
  claim survives; it names the two rejected shapes and the negated-gap mechanism).
- **Three appended D31 keys + block-comment currency** (design tree "D31 new keys" row). The
  rule (b) description in the block comment gains the legacy-arm gating so the comment matches
  the prose it guards.
- **Task 2.1 banner rewrap** (design tree "Task 2.1 banner orphan" row): comment-only; after the rewrap, hand-scan the
  same banner block for any other reflow orphan (a line ending mid-clause) and list each as a
  survey-derived correction — nothing mechanical reads this banner, so the survey is the only
  check.

### `skills/war/SKILL.md`

- **Backtick-stripping clause** extended in place on the `**Done-when intake` lead-in line
  (design tree "SKILL.md backtick clause" row), same commit as its D31 key. Run the D31
  suite before and after: all 17 pre-existing keys must match both the pre- and post-extension
  line (the insertion sits between two keyed clauses and inside no bounded gap — verified
  feasible at `6fff2ee`).

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.test.mjs` | `relandSubmodArms` right-bounded; region + header comments corrected; guardless-arm negative reference; `DONE_WHEN_SITES` length floor; non-string typeof arm + comment narrowing; keep-green source census; adjacency concatenation assert |
| `skills/war/assets/skill-doc-contracts.test.mjs` | D31 arm keys tightened (negated-scan gaps); `D31_ARMS_COLLIDED` negative reference; header + block comments corrected; three D31 keys appended; Task 2.1 banner rewrap |
| `skills/war/SKILL.md` | Done-when intake sub-bullet: backtick-stripping clause extension (additive, one line) |

No production `.js`/`.mjs`/hook changes. `skills/war/assets/workflow-template.js` is read by the
new census but never edited (#1334 lists it as affected; every fix is test-side).

## 6. New domain terms (CONTEXT.md)

None. "Negated-scan gap" and "collision fixture" are used descriptively here, not ratified;
existing terms (bounded-gap key, negative reference, anti-vacuity floor) cover the rest.

## 7. Recommended ADRs

None. Governing doctrine exists: ADR 0025 (drift-guard discipline, asserted-fact class, same-commit
lock-step) and the recorded lessons this group's issues cite
(`label-to-guard-region-extraction-must-bound-at-next-label-not-eof`,
`multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap`,
`structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census`).

## 8. Open risks / implementation notes

- **Ordering (binding)**: this group lands **after** the sibling groups `done-when-floor-wiring`
  and `gate-audit-finding-routing` — they share `skills/war/assets/workflow-template.test.mjs`
  (and the SKILL.md family), and same-file parallel tasks rebase-conflict at the serial merge.
  The survey manifest carries the machine hint; re-measure every §2 dated snapshot at plan
  conversion and at task dispatch.
- **Task carving hint for `/war-machine`**: two file-disjoint units — (A)
  `skills/war/assets/workflow-template.test.mjs` (#1373, #1286, #1334); (B)
  `skills/war/assets/skill-doc-contracts.test.mjs` + `skills/war/SKILL.md` (#1375, #1332, #1252).
  Unit B is one task despite two files: the SKILL.md clause and its D31 key are same-commit
  lock-step, and the D31 edits collide in one file.
- **Tightened D31 gaps vs future rewordings**: a negated-scan gap false-reds a sanctioned reword
  that legitimately mentions the other arm's token inside an aside. Accepted: the guard's own
  maintenance rule (correct the key in the same commit, never drop it) is the designed relief
  valve [assumed: acceptable friction — if wrong, the fallback is fixture-only coverage, which
  leaves gap-collision shapes other than the pinned one green].
- **Census brittleness**: any sibling plan adding a keep-green prompt moves the count from 6;
  the census message must name the update duty ("a new keep-the-gate-green prompt must join the
  D6 sweep above") so the red routes to a deliberate re-pin, not a guard delete.
- **Fixture flavor hygiene** (D6): the guardless fixture's label must use a `-proceed` flavor
  distinct from both live arms and from the existing mirrored fixture's `-probe-proceed`, so the
  two fixtures never shadow each other when both tests run over mutated copies.

## 9. Non-goals / deferred

- No change to the done-when **floor** (`assert-done-when.sh`), the `done-unmet` route, or any
  merge/land behavior — the sibling `done-when-floor-wiring` group owns that file family.
- No fix for the `GATE_SITE_CAPTURES` fixture-reachability blind spot — its enumeration is an
  acknowledged ceiling (verified: issue #1334 (2026-08-06), finding 4 names it as accepted);
  this spec closes only the claim/evidence mismatch in the sweep whose title says "every".
- No scanner: the mirror registry and site arrays grow by row, never by AST scan (the rejected
  ceiling recorded in the suite's own `// ponytail:` comments).
- No SKILL.md rewording beyond the single additive clause; the intake sub-bullet's routing prose
  is untouched (the D31 hardening is key-side).
- No retro-conversion of grandfathered spec/plan pairs; no version bump (test + doc changes
  only).

## 10. Validation criteria

1. WHEN a guardless `-proceed`-flavored re-land arm is spliced before a guarded sibling in an
   in-memory copy of the template source THE D6 extractor SHALL report exactly that arm
   `guarded: false`, never borrowing the sibling's guard · check:
   `node --test skills/war/assets/workflow-template.test.mjs` (new negative reference green;
   scratch-reverting the bound to an EOF slice reds it — demonstrated-RED recorded in the done
   report).
2. WHEN `relandSubmodArms` extracts arm regions THE per-arm guard search SHALL be right-bounded
   at the next label match (EOF only for the last arm) · check:
   `grep -n 'slice(m.index)' skills/war/assets/workflow-template.test.mjs` shows no
   single-argument (unbounded) slice inside `relandSubmodArms`; then hand-scan the extractor and
   its region/header comment block for prose restating the EOF shape and list each straggler as
   a survey-derived correction.
3. WHEN the D6 header comment states its self-match claim THE claim SHALL be scoped to the
   guard's fragment-built patterns, naming `LITERAL_REGISTRY` as the file's contiguous label
   copies · check: `grep -c 'no contiguous copy of a dispatch label' skills/war/assets/workflow-template.test.mjs`
   returns 0 (retired unscoped wording absent; same-scope hand-scan per criterion 2's note).
4. WHEN a `DONE_WHEN_SITES` row is deleted THE first Done-when threading test SHALL fail on its
   length floor before any per-site assert runs · check:
   `grep -n 'DONE_WHEN_SITES.length' skills/war/assets/workflow-template.test.mjs` shows the
   `assert.equal(…, 6, …)` floor; scratch row-delete → `node --test` non-zero → restore.
5. WHEN the `typeof task.doneWhen === 'string'` conjunct is scratch-deleted from
   `doneWhenClause` in the template source THE suite SHALL fail on the non-string arm · check:
   scratch mutation + `node --test skills/war/assets/workflow-template.test.mjs` non-zero →
   restore (demonstrated-RED in the done report).
6. WHEN a keep-the-gate-green prompt is added to `skills/war/assets/workflow-template.js` at a
   dispatch site no sweep fixture reaches THE census SHALL fail, directing the author into the
   D6 sweep · check: `grep -io 'keep the gate' skills/war/assets/workflow-template.js | wc -l`
   equals the pinned count (6 @ `6fff2ee`, 2026-08-06; re-measured at task time); after the
   grep, hand-scan the template source's comments for space-form stragglers (the three
   hyphenated mentions are the known non-hits) and list any as a survey-derived correction.
7. WHEN a worker-family prompt carries a `Done when:` clause THE `Gate:` line and the clause
   SHALL be directly concatenated (the clause immediately follows the gate command's line) ·
   check: the threading test composes the expected bytes via `resolveGate` and asserts
   `c.prompt.includes(…)`; scratch-moving the clause to the prompt tail reds it.
8. WHEN the intake sub-bullet is reworded so one arm's gap swallows the other arm's trigger
   token with the routing inverted THE D31 paired keys SHALL reject it · check:
   `node --test skills/war/assets/skill-doc-contracts.test.mjs` — `D31_ARMS_COLLIDED` and
   `D31_ARMS_SWAPPED` both sit under `doesNotMatch` for both keys, and both keys still match the
   live lead-in line.
9. WHEN the value-boundary, legacy-precedence, or backtick-stripping clause is dropped from the
   `**Done-when intake` sub-bullet THE D31 row SHALL fail on that clause's key · check: the D31
   key array carries the three new keys (grep each pattern in
   `skills/war/assets/skill-doc-contracts.test.mjs`); scratch-delete each clause from a SKILL.md
   copy → suite red → restore.
10. WHEN Decompose stages a backticked `Done when:` command THE staged `doneWhen` SHALL be the
    command inside its code span, backticks stripped · check:
    `grep -n 'backticks' skills/war/SKILL.md` hits the Done-when intake lead-in line's stripping
    clause, and its D31 key landed in the same commit (`git log -1 --name-only` on that commit
    shows both files).
11. WHEN the Task 2.1 banner is read THE stranded sentence SHALL read continuously into
    `PER-MEDIUM, not uniform: …` · check:
    `grep -c 'of any kind\. They are$' skills/war/assets/skill-doc-contracts.test.mjs` returns
    0; hand-scan the same banner block for other reflow orphans and list each as a
    survey-derived correction.
12. WHEN all changes land THE full JS suite SHALL be green with no production diff · check:
    `node --test 'skills/**/*.test.mjs'` green and
    `git diff --stat` touches only the three §5 files.
