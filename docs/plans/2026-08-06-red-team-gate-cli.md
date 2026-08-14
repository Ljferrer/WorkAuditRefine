# Red-team gate CLI unknown-token refusal, loop-breaker boundary coverage, and Route-upstream template blank-line fix

Converted by `/war-machine` from [docs/specs/2026-08-06-red-team-gate-cli-design.md](../specs/2026-08-06-red-team-gate-cli-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated reason).
Issues addressed: #1378, #1347, #1366. Issue → task mapping: #1378 → Task 1.2; #1347 F1–F4 → Task 1.2;
#1366 → Task 1.1 (the blank lines) + Task 1.2 (the doc-guard rows). `/war` files its own epic + task issues
regardless (war-execution-must-file-issues); closing the three source issues is Lead checkpoint work at phase
close (war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

All three issues sit on the red-team loop-breaker path (ADR 0045): the gate CLI that computes
`routeUpstream`, the test suite that pins its arithmetic, and the Route-upstream report template the same
output feeds (verified: issues #1378, #1347, #1366 (2026-08-06), each re-verified in the live tree at
`6fff2ee`). Source spec: `docs/specs/2026-08-06-red-team-gate-cli-design.md`. Snapshot base for every
measured claim: the repo tip at `6fff2ee` (2026-08-06); conversion-time re-measurements below are at the
same base.

1. **`--stdin` mode silently drops a space-separated flag value that file mode refuses only by accident**
   (verified: issue #1378 (2026-08-06); re-verified in the live tree at `6fff2ee`). `main()` in
   `skills/red-team/assets/red-team-gate.mjs` parses flags only via the `flagValue` closure
   (`=`-attached forms). In file mode a space-separated typo (`--rounds 3`) is refused loudly only
   because the positional scan (`args.find(a => !a.startsWith('--'))`) grabs the bare token as the
   results path and the file read throws. In `--stdin` mode there is no positional scan and no
   unknown-token check: the stray tokens are ignored, `rounds` resolves `undefined`, and the emission
   condition in `main()` (`rounds !== undefined || roundLimit !== undefined`) skips `routeUpstream`
   entirely — silently absent, indistinguishable from the flag never being passed. `--stdin` is the mode
   the skill's own re-pipe doctrine prescribes (`skills/red-team/SKILL.md` Steps 4–5; verified: live tree
   at `6fff2ee`), so the weaker net sits on the production path.
2. **Four demoted-absorb audit findings on the same file pair remain open** (verified: issue #1347
   (2026-08-06); each re-verified at `6fff2ee`): **F1 (Minor)** — the stdin-mode silent drop above, the
   exact silent `routeUpstream: false` the module's own CLI doc block forbids (duplicate ground with
   #1378; one fix closes both); **F2 (Nit)** — the doc block's parenthetical ("a typo'd flag must not let
   a chronic plan keep grinding") attributes the loud refusal to a typo'd flag NAME while
   `resolveRoundInput` enforces it only on the VALUE; **F3 (Minor)** — the suite never exercises
   `rounds: 0` (the fail-open seed `skills/red-team/SKILL.md` Step 1 assigns every legacy/first
   invocation) nor a rounds-only CLI invocation, so two falsiness regressions (`if (!key)` in
   `resolveRoundInput`'s key arm; dropping the first emission disjunct) would stay green; **F4 (Nit)** —
   arm 1 of `routeUpstream` keys on the `blockers`+`needsDecision` union, but no assertion discriminates
   the union below rounds 2 — mutating it to blockers-only leaves the whole suite green (every
   needsDecision fixture runs at rounds ≥ 2, where arm 2 masks arm 1).
3. **The Route-upstream template mis-nests its `**Re-entry:**` line into the agenda bullet** (verified:
   issue #1366 (2026-08-06); re-verified at `6fff2ee`). In both `skills/red-team/references/lenses.md`
   (the report template's `## Route upstream` section) and `skills/red-team/references/loop-budget.md`
   (the fenced block template), the bold `**Re-entry:**` line sits directly after the agenda bullet with
   no blank line, so CommonMark lazy continuation renders it inside that bullet. The two blocks are
   byte-for-byte duplicates, and `/war-campaign`'s halt arm copies the section verbatim into
   CAMPAIGN-STATE.md, so the mis-nesting propagates to every operator-facing copy. No existing guard can
   catch it: the doc-guard rows in `skills/red-team/assets/red-team-gate.test.mjs` assert only the
   `## Route upstream` heading and the Verdict/Rounds adjacency (verified at `6fff2ee`).

## Pivotal constraints

- **`--stdin` is the production path.** Any fix must strengthen that path, not just file mode — scoping
  the doc claim down to file mode would leave the production path with the weaker net (rejected in D1).
- **The pure exports are correct and untouched.** `routeUpstream`, `verdict`, `classify`,
  `resolveRoundInput`'s validation arms, and the coverage layer change nothing (#1347 states the
  arithmetic is correct). The work is `main()`-side argument hygiene plus test/doc truth.
- **Refusal contract:** exit 1, diagnostic on stderr, no verdict on stdout — the existing
  `die`/`resolveRoundInput` shape. The zero-probe refusal, invalid-JSON exit, and usage exit remain
  distinct refusals.
- **Absent-input identity is pinned.** A rounds-less valid invocation's stdout stays byte-identical to
  the pre-rounds shape; the new check may not alter output for any currently-valid invocation.
- **Partial-input emission is pinned deliberate behavior.** The `--round-limit`-only row keeps asserting
  `roundLimit` echo + `routeUpstream: false` with `rounds` absent. F1's optional suggestion (require both
  inputs, or emit `rounds: null`) is superseded: the missing `rounds` key in the echo is the visible
  tell, and the bare-token refusal removes the only path by which the partial shape arose *silently*.
- **Comment truth travels with the mechanism.** The CLI doc block's "refused by construction" clause is
  rewritten in the same commit that changes the mechanism (source-comment-lags class), and the file-mode
  test row whose title names the positional-scan mechanism is renamed with it.
- **Template parity.** The Route-upstream blocks in `lenses.md` and `loop-budget.md` are duplicates; the
  fix inserts the same blank line in both so their shared lines stay byte-identical.
- **Guard-split deps edge (war-strategy §3 rule 7 / ADR 0025 amendment).** The blank-line doc-guard rows
  live in `red-team-gate.test.mjs` (the gate task's file); the blank lines land in the template task. The
  guard task carries `deps` on the template task — same wave is insufficient at the frozen phase base.
- **No new files.** Reuse the existing `runGate` harness and the doc-guard fs-read idiom (the module-level
  `LENSES`/`SKILL` reads beside the 5.5 rows); anchors in new doc-guard regexes are quote-free (the
  recorded anchor-fragility lesson).
- **Anchor by named construct** everywhere (`main()`, `flagValue`, `resolveRoundInput`, the emission
  condition, test titles) — never line numbers.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Fix shape for #1378/F1 | **Explicit default-deny unknown-token check, every mode** — narrowing the refused-loudly claim to file mode would document the hole instead of closing it | (verified: issue #1378 (2026-08-06)); spec §3 row 1 |
| D2 | What exactly is refused | Any `--`-prefixed token that is not `--stdin` and does not start with `--rounds=` or `--round-limit=` refuses loudly in **both** modes (catches both halves of a space-separated pair and any typo'd name). In `--stdin` mode any bare (non-`--`) token also refuses — stdin mode consumes no positionals (A1). File mode keeps its positional scan: the first non-`--` token is the results path, unchanged | spec §3 row 2; A1 |
| D3 | Check placement | Top of `main()`, immediately after `args` is derived, before mode selection and the stdin read — one refusal site, fail-fast without consuming the pipe, same exit-1/stderr/no-stdout contract as `resolveRoundInput`'s `die`. Stderr names the offending token and the accepted forms (`--rounds=<n>` / `--round-limit=<n>`) | spec §3 row 3 |
| D4 | F2 (doc parenthetical: NAME vs VALUE) | **Make the claim true instead of narrowing it.** With D2 landed a typo'd name *and* a typo'd value both refuse, so the parenthetical stands; the "refused by construction" positional-scan attribution is rewritten to name the explicit check | (verified: issue #1347 (2026-08-06)) F2; spec §3 row 4 |
| D5 | F3 (zero boundary + first emission disjunct) | The auditor's verbatim-in-substance row: `--stdin --rounds=0` (rounds-only) → exit 0, `rounds: 0` echoed, `routeUpstream` emitted `false`, `roundLimit` absent — one row closes both gaps | (verified: issue #1347 (2026-08-06)) F3; spec §3 row 5 |
| D6 | F4 (arm-1 union mutation coverage) | The auditor's verbatim assertion in the existing arm-1 test: a needsDecision-only open set routes at rounds 1 / roundLimit 1 — reds under the blockers-only mutation, unreachable by arm 2 (rounds 1 < 2) | (verified: issue #1347 (2026-08-06)) F4; spec §3 row 6 |
| D7 | #1366 fix | One blank line before `**Re-entry:**` in the `## Route upstream` template in `lenses.md` and the fenced block in `loop-budget.md`; the two blocks remain byte-identical over shared lines. No `/war-campaign` change — the halt arm copies from the fixed source | (verified: issue #1366 (2026-08-06)); spec §3 row 7 |
| D8 | Guard the blank line? | Yes — two doc-guard rows in `red-team-gate.test.mjs` beside the existing 5.5 rows, each asserting the `**Re-entry:**` line is blank-line-preceded (a regex sees `\n\n` where a substring cannot); a new fs read of `loop-budget.md` beside the existing `LENSES` read (A2) | spec §3 row 8; A2 |
| D9 | Task decomposition | Two file-disjoint tasks, one phase — Task 1.1 templates, Task 1.2 gate + suite with `deps: [1.1]` (the guard rows read Task 1.1's files: §3 rule 7) — plus the standard trailing release phase | spec §3 row 9; war-strategy §3 rule 7 |
| D10 | Existing space-separated file-mode row | **Rewritten, not deleted**: same fixture, but title and assertions move from the accidental mechanism (ENOENT via the positional scan) to the explicit one (the D3 stderr substring, still exit ≠ 0, no verdict on stdout). No second row pinning the dead ENOENT shape | spec §3 row 10 + §8 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Default-deny over stdin-mode bare tokens is the right concretization of #1378's "unknown-bare-token check in every mode" | spec §3 row 2 (carried [assumed] row) | a stray token beside `--stdin` keeps being ignored silently — the #1378 shape half-open | the new stdin bare-token refusal row (End state 1); ratify in /red-team |
| A2 | The blank-line doc-guard rows are wanted — invention beyond #1366's literal ask | spec §3 row 8 (carried [assumed] row); #1366 itself names the guard gap ("substring-asserting drift-guard tests cannot catch a missing blank line") | guard rows dropped; the fix lands unguarded and the next template edit can silently regress it | End state 5; ratify in /red-team |
| A3 | File-mode surplus positionals (a second bare path token) stay silently ignored | spec §9 (carried [assumed] non-goal); no issue reports it | a doubled path argument keeps being ignored — today's behavior | non-goal; a field recurrence files an issue |
| A4 | No sibling plan must LAND first for this plan's work to be correct — but the footprint is **not** wholly owned across the 2026-08-06 campaign | conversion-time measurement at `6fff2ee` — this RETIRES the spec §8 claim "all four files in the footprint are wholly owned here": sibling specs `2026-08-06-escape-guard-exit-contract-design.md` (touches `lenses.md`, escape-guard bullet) and `2026-08-06-verdict-adjudication-integrity-design.md` (touches `red-team-gate.mjs`, header-comment rewrite) overlap two files. Direction is one-way: `verdict-adjudication-integrity` declares `dependsOn: red-team-gate-cli` and states its work lands AFTER this group (verified: its header + cross-group-ordering note at `6fff2ee`) — this plan is its upstream and must land before it; `escape-guard-exit-contract` declares no edge; nothing must land before this plan | serial-merge rebase conflicts across plans if landed unserialised — or, sequenced sibling-first, conflicting rewrites in `red-team-gate.mjs`'s comment block | ADR 0011 stack-and-plow serializes plans; the roadmap carries this plan → `verdict-adjudication-integrity` as an ordering edge in the dependency spine (not merely a contention row), and its `## Shared-file contention` table records the `lenses.md` overlap; /war-campaign's sweep contention check re-verifies |

## Non-goals / deferred

- **No change to the pure arithmetic** — `routeUpstream`, `verdict`, `classify`, `resolveRoundInput`'s
  validation arms, and the coverage layer are correct as landed.
- **No both-inputs-required emission change and no `rounds: null` echo** — the partial-input emission
  shape is pinned deliberate behavior; F1's optional suggestion is recorded as superseded, not adopted.
- **No file-mode surplus-positional refusal** (A3).
- **No renderer-based Markdown validation harness** — the blank-line regex guard is the proportionate
  mechanism.
- **No `/war-campaign` or `skills/red-team/SKILL.md` edits** — propagation to CAMPAIGN-STATE.md is by
  copying the fixed source template; the skill steps already prescribe only `=`-attached forms.
- **No reopening** of the landed 2026-08-05 phase-4 plan, its red-team report, or the audit dispositions
  that produced #1347.

## New domain terms · Recommended ADRs

None. The change hardens existing constructs (the gate CLI's refusal contract, the Route-upstream block)
without a new concept; ADR 0045 documents the typed inputs and arithmetic, not the flag-parsing
mechanism, and stays accurate as written.

## Commander's Intent

- **Purpose:** a typo'd or malformed gate-CLI invocation can never silently suppress the loop-breaker
  output on any path — the refusal is loud in both modes, for flag names and values alike — and the
  operator-facing Route-upstream block renders as authored in every copy that reaches an operator.
- **Method:** one default-deny argument check at the top of `main()` ahead of mode selection (the
  existing `die` contract), with the CLI doc block's mechanism claim rewritten in the same commit so the
  comment states only what the code holds; close #1347's four coverage gaps with the auditor's
  verbatim-in-substance rows; insert the blank line in both byte-identical Route-upstream templates and
  pin it with quote-free regex doc-guard rows that ride a `deps` edge onto the template task (§3 rule 7).
  Pure exports untouched; no currently-valid invocation changes output by a byte.
- **End state:**
  1. A stdin-mode space-separated flag value (`--stdin --rounds 3`) refuses loudly — exit 1, stderr
     diagnostic naming the token and the accepted `=`-attached forms, no verdict on stdout — the
     #1378/F1 production-path repro row ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  2. A typo'd flag name (e.g. `--stdin --round=3`) refuses with the same contract in every mode — the
     default-deny check at the top of `main()` covers every `--` token outside the known set ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  3. `--stdin --rounds=0` (rounds-only) exits 0 with `rounds: 0` echoed ("0 is a supplied value, not
     not-supplied"), `routeUpstream` emitted `false`, and `roundLimit` absent ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  4. The existing arm-1 test carries the union assertion — a needsDecision-only open set routes at
     rounds 1 / roundLimit 1 (`routeUpstream(..., 1, 1) === true`) — which reds under the blockers-only
     mutation (`const open = blockers`); the mutation trace itself is worker done-report evidence
     (backstop row) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  5. Both Route-upstream templates carry a blank line before `**Re-entry:**`, and the two new doc-guard
     rows red when either file drops it (live shape:
     `grep -B1 '^\*\*Re-entry:' skills/red-team/references/lenses.md skills/red-team/references/loop-budget.md`
     shows a blank preceding line in both) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  6. The retired mechanism claim is gone from the module and suite ·
     check: `grep -n 'refused by construction' skills/red-team/assets/red-team-gate.mjs skills/red-team/assets/red-team-gate.test.mjs`
     — zero hits. **Mandatory manual same-scope survey (grep is a floor):** hand-scan the module's CLI
     doc block and every test title/comment in the suite for prose still attributing space-separated
     refusal to the positional scan; list each straggler as a survey-derived correction. Survey at spec
     base `6fff2ee`: one straggler — the file-mode row title "the positional scan picks it as the
     results path", retired by D10.
  7. Every currently-valid invocation's output is byte-identical to today's: the absent-input identity
     row, the `--round-limit`-only emission-disjunct pin, the `=`-attached override row, and the
     reject-set rows are all green unmodified ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  8. The refusal-mechanism sweep over live red-team surfaces shows the only carriers are this group's
     files ·
     check: `grep -rn 'space-separated' skills/red-team/ docs/adr/` — hits only in
     `skills/red-team/assets/red-team-gate.mjs` and `skills/red-team/assets/red-team-gate.test.mjs`
     (new wording), dated snapshot re-measured at the task's rebased base. **Mandatory manual same-scope
     survey:** hand-scan `skills/red-team/SKILL.md` Steps 4–5, `references/loop-budget.md`,
     `references/lenses.md`, and ADR 0045 for refusal-mechanism prose the token misses; list stragglers
     as survey-derived corrections. Survey at `6fff2ee`: none — those surfaces prescribe only the
     `=`-attached forms and never state the mechanism. (Scope deliberately narrowed from the spec's
     `skills/` — see Notes.)
  9. The two Route-upstream blocks remain byte-identical over their shared lines (Regrill / Agenda /
     bullet / blank / Re-entry — the guidance comment is lenses-only by design) ·
     check: `diff <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/lenses.md) <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/loop-budget.md)`
     — empty.
  10. Each landing commit cites its issue(s) — #1366 for Task 1.1, #1378 + #1347 for Task 1.2 (the
      #1347 close conditions require the citation) ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
  11. The redaction lint stays green ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`; the war-memory lint wrapper is a
      discovered member).
  12. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).

## Build order (for /war)

Phase 1 (templates + gate: wave 1 = Task 1.1; wave 2 = Task 1.2 `deps: [1.1]`) → Phase 2 (release).

The wave edge is a content dependency, never a collision dodge: the two file sets are disjoint, and
Task 1.2's doc-guard rows read Task 1.1's files — at the frozen phase base they would be red by
construction without the edge (§3 rule 7); Task 1.2's worker rebases onto the integration tip as its
first act.

## Phase 1 — Loud refusal in every mode; the template blank line and its guard

### Task 1.1: Route-upstream templates — the blank line

- Files: `skills/red-team/references/lenses.md`, `skills/red-team/references/loop-budget.md`
- Plan slice: insert one blank line between the agenda placeholder bullet and the `**Re-entry:**` line
  in the report template's `## Route upstream` section in `lenses.md`, and the same blank line at the
  same spot in the fenced `## Route upstream` block template in `loop-budget.md`, keeping the two
  blocks byte-identical over their shared lines (End state 9's sed/diff shape). Nothing else changes in
  either file: the existing doc-guard 5.5 regexes (Verdict/Rounds adjacency, `## Route upstream`
  heading, the ADR 0042 trigger pointer, the retired-wording absences) are unaffected. Commit cites
  #1366.
- Done when: None — template-only edit with no same-task mechanical guard by design (D8/A2 place the
  blank-line guard rows in Task 1.2's suite, reached by the `deps` edge); the worker's manual check is
  End state 5's `grep -B1` live shape and End state 9's diff.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Gate CLI default-deny check + test/doc truth + the blank-line guard rows

- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: **Module** — add the default-deny argument check at the top of `main()`, immediately
  after `args` is derived and before mode selection/the stdin read (D2/D3): any `--`-prefixed token
  that is not `--stdin` and does not start with `--rounds=` or `--round-limit=` refuses in both modes;
  in `--stdin` mode any bare (non-`--`) token also refuses; file mode keeps the unchanged positional
  scan (first non-`--` token = results path). Refusal: exit 1, stderr diagnostic naming the offending
  token and the accepted forms (`--rounds=<n>` / `--round-limit=<n>`), nothing on stdout — pick the
  stderr wording once and pin the same substring in every new refusal row, keeping it distinct from
  `not a non-negative integer` so the NAME and VALUE refusal channels stay separately greppable.
  Rewrite the CLI doc block in the same commit (D4): the clause attributing space-separated refusal to
  the positional scan ("refused by construction") is replaced by prose naming the explicit every-mode
  check; the positional scan is still described, but only as the path-picking mechanism; the "a typo'd
  flag must not let a chronic plan keep grinding" parenthetical stays — D2 makes it true for names and
  values alike. Pure exports, `resolveRoundInput`, `flagValue`, the emission condition, the zero-probe
  refusal, and the usage line untouched. **Suite** — rewrite the file-mode space-separated row (D10):
  same fixture, title and assertions moved to the explicit refusal (exit ≠ 0, the new stderr substring,
  no verdict on stdout); do not keep a second ENOENT-shape row (dead behavior). New rows:
  `--stdin --rounds 3` refuses with the new substring (End state 1, the #1378/F1 production-path
  repro); a typo'd flag name (e.g. `--stdin --round=3`) refuses (End state 2); `--stdin --rounds=0`
  rounds-only per D5 (End state 3). New assertion in the existing arm-1 test per D6, with the auditor's
  message ("arm 1 keys on the blockers+needsDecision UNION…"); demonstrate the blockers-only mutation
  red locally and record it in the done report (backstop row). Two doc-guard rows per D8 beside the
  existing 5.5 rows: in each of `lenses.md` and `loop-budget.md`, the `**Re-entry:**` line is preceded
  by a blank line — quote-free regex anchors keyed on the `**Re-entry:**` token and a preceding empty
  line, tolerant of the line's tail text (doctrine may reword it); a new fs read of `loop-budget.md`
  beside the existing module-level `LENSES`/`SKILL` reads. Every pre-existing row stays green
  unmodified (End state 7). Run End state 6's retirement grep + mandatory manual survey and End
  state 8's narrowed sweep + mandatory manual survey; record both outcomes in the done report even when
  zero stragglers. Commits cite #1378 and #1347.
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the master tip when the campaign launches — this is
  the first plan of the 2026-08-06 campaign, with no predecessor plans (ADR 0011 stack-and-plow; the
  roadmap may reorder — the directive form is base-agnostic). Standalone fallback: run through plain
  `/war`, resolve the next free patch from the four slots themselves. The Status blurb names the gate
  CLI's every-mode default-deny refusal and the Route-upstream template fix — quoting only identifiers
  that exist in the landed diff (release-blurb lessons: count words match the enumeration; quoted
  literals byte-match landed identifiers; guard semantics stated no wider than the implementation).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 6 and 8 · why deferred: a hand-scan cannot be a
  mechanical gate member; done-report-only evidence, which gate-audit reads as SOFT and never a hold
  (deliberately-uncommitted-probe lesson class) · runner: Task 1.2's worker records both outcomes
  (mandatory statement even when "zero stragglers"); the Lead re-runs both greps at phase close.
- The arm-1 blockers-only mutation trace (End state 4's delete-and-trace) · why deferred: a mutation
  run is uncommittable by design — the committed union assertion is the standing guard · runner:
  Task 1.2's worker runs it locally and records the red in the done report; gate-audit reads it SOFT.

## Notes / conscious deviations

1. **End state 8's sweep scope is narrowed from the spec's `skills/` to `skills/red-team/`** (spec §10
   criterion 8). Measured at `6fff2ee`: the spec's stated check false-reds on 13 sanctioned, unrelated
   `space-separated`/`whitespace-separated` glob-set and list-format hits across `skills/war/`,
   `skills/war-room/`, and `skills/war-campaign/` (e.g. `war-config.mjs`'s testPattern prose,
   `assert-test-in-diff.sh`'s glob-set docs) that carry no refusal-mechanism claim (15 total hits at
   that base minus this group's 2; dated snapshot) — the
   backstop-retirement-grep-false-reds lesson class. The narrowed scope preserves the criterion's
   intent (the refusal-mechanism claim's live carriers are red-team surfaces + docs/adr), and the
   mandatory manual survey of the four named surfaces is unchanged. Logged for /red-team ratification.
2. **The spec §8 "wholly owned" footprint claim is retired** (A4): two sibling 2026-08-06 specs touch
   two of this plan's files (measured at conversion). Nothing must land before this plan — the spec's
   empty-upstream-list half is carried forward as true — but downstream the direction is real:
   `2026-08-06-verdict-adjudication-integrity-design.md` declares `dependsOn: red-team-gate-cli` and
   states its work lands AFTER this group, so this plan is its upstream and the roadmap must carry
   this plan → `verdict-adjudication-integrity` as an ordering edge in the dependency spine, not
   merely a contention row. The `## Shared-file contention` table additionally records the `lenses.md`
   overlap with `escape-guard-exit-contract` (no declared edge); cross-plan serialization is ADR
   0011's job.
3. **Posterity survivors.** Historical artifacts keep the retired wording and are never retro-edited
   (ADR 0046 posture): the landed 2026-08-05 plan's Task 4.1 slice (the positional-scan attribution
   this plan retires), red-team reports, and the `docs/learnings/` lesson bodies behind #1378/#1366.
   Every OLD-absent check here is scoped to the live module + suite (End state 6) and the narrowed live
   sweep (End state 8).
4. **The deps edge is content, not collision.** Task 1.1/1.2 file sets are disjoint; the edge exists
   because Task 1.2's doc-guard rows read Task 1.1's files (§3 rule 7). Merging the tasks was rejected
   (spec §8: the templates task must be independently green; the file sets are disjoint); deferring the
   guard rows a phase was rejected (the edge is available with no cycle, and rule 7 prefers it —
   a later phase would leave the fix unguarded across a phase boundary for no gain).
5. **The rewritten file-mode row changes what it proves.** After D2/D3 the accidental path (positional
   scan grabbing the bare value) is unreachable — the explicit check fires first; keeping an
   ENOENT-shape row would pin dead behavior (spec §8).
6. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from #1347's operator-dispositioned, auditor-verbatim findings and the
   code-verified lesson issues #1378/#1366; conversion-time judgments (Notes 1–2, A1–A2) are logged
   for /red-team ratification.

## Open decisions

None. The spec's design tree is fully resolved; every conversion-time judgment is logged above for
/red-team ratification.
