# Drift-guard tightening — per-rule qualifier lock + floor/gate exclusion parity

Source spec: docs/specs/2026-07-11-drift-guard-tightening-design.md
Issues: #693, #732. Scope class: **test-only** — four `*.test.*` files modified; every
production surface (`agents/war-auditor.md`, `workflow-template.js`, `war-config.mjs`,
all floor `.sh` scripts) is read, never edited.

**Base requirement (hard precondition):** every construct this plan edits —
`CALIBRATION_RULE_ANCHORS` (`workflow-template.test.mjs`), the two-test Task-1.4 family,
Case 10a–10e (`assert-test-in-diff.test.sh`), and the two floors' `match_sh_suite`/
`match_default` copies — exists at `origin/master` tip (`bbaa68a`, post-#729/#730
merges) and does **not** exist at the current campaign worktree base (`f6da10c`).
The frozen phase base MUST descend from `bbaa68a`; a stacked predecessor tip qualifies
only if it carries those merges. Preflight is a listed backstop below.

## Commander's Intent

- Purpose: Two drift-guard tests assert weaker facts than the invariants they hold —
  an aggregate `>= 4` qualifier count that survives a single-rule silent widening
  (#693), and floor/gate exclusion parity that is enforced for only one of three
  gate-set-discovering floors, with nothing fail-closed catching the next unclassified
  floor (#732, 3 recorded recurrences of the underlying lesson). Tighten both to
  extraction + equality (ADR 0025) so the guarded facts cannot rot silently.
- Method: Test-only surgery per the spec's resolved design tree — the plan implements
  those decisions, it does not re-litigate them. (1) Replace the aggregate qualifier
  count with **anchor-bounded per-rule windows** over both surfaces — standing card
  windows terminated by the next `\n#` heading, dispatched windows computed over the
  **isolated single-paragraph calibration line** (end-of-text on that line only, so no
  trailing prompt clause or prefetched lesson can ever feed window 4) — plus a
  permanent delete-the-feature companion mutation test looped over every rule position
  on both surfaces, with window-scoped surgery and a complement assertion (the other
  three rules stay PRESENT). (2) Replicate the Case 10 parity idiom (gate side always
  extracted from `resolveGate`'s **emitted output** via the `--resolve-gate` CLI, floor
  side from executable `return 1 ;;` case arms in comment-stripped source, inline
  ~10-line helper copies — no shared lib) into the two unguarded gate-set discoverers'
  suites, each with its own 10e-style mutation case. (3) Add a fail-closed
  classification case enumerating every non-test `.sh` in `skills/war/assets/` against
  a hardcoded parity/exempt-with-reason list — with each `parity` row
  **content-verified** (its twin `.test.sh` must actually invoke `--resolve-gate`), so
  neither a missing row nor an honor-system tag stays green. Do NOT "fix" the
  deliberate 5-standing / 4-dispatched rule-count asymmetry, and do not add a
  qualifier to the fifth rule (qualifier-free by design).
- End state:
  1. `node --test skills/war/assets/workflow-template.test.mjs` passes at tip; within
     the two Task-1.4 test bodies (the qualifier test and its new companion mutation
     test) there is **no** `>= 4` literal and **no** aggregate `.match(`-count on the
     qualifier regex — assertions are per-window, per rule, on both surfaces (standing
     `war-auditor.md` text AND the dispatched `auditPrompt` captured from the existing
     `runPhase` auditor call). (Scope of this check is those two named tests — the
     window helper's own legitimate `.length` uses on anchor/window arrays are not
     aggregate qualifier counts and do not count against it.)
  2. RED proof, both surfaces: the permanent companion mutation test splices the
     qualifier out of exactly one rule's window (surgery strictly inside the helper's
     returned window offsets — the intro line's qualifier, which sits before anchor 1
     on both surfaces, is untouched by every arm) for **each** of the four rule
     positions on **each** surface, and asserts the helper reports that rule missing
     AND the other three rules still PRESENT — so a helper that reports everything
     missing cannot pass, window 4 provably cannot borrow a qualifier from trailing
     text, and the intro occurrence can never satisfy a rule.
  3. The sibling anchor test (`… war-auditor.md AND auditPrompt carry all four rule
     anchors`) is byte-unchanged and still passes.
  4. `bash skills/war/assets/gate-pin-status.test.sh` passes with new cases asserting:
     (a) resolveGate **emitted-output** exclusion set == `{.claude, .git,
     node_modules}`; (b) == `gate-pin-status.sh`'s `return 1 ;;`-arm set; (c) the
     `*.test.sh)` name-glob arm present in the comment-stripped floor source and
     `-name '*.test.sh'` present in gate output; (d) the structural mjs-mirror arms
     (`skills/*)` and `*.test.mjs)`) present as fixed strings (`grep -F`) in the
     comment-stripped body of `match_default` (shape-adapted 10d).
  5. RED proof, gate-pin-status: an in-test mutation (`grep -v` the `.claude` arm
     into a temp copy, re-extract) yields a set ≠ the gate set — the parity case is
     load-bearing, not vacuous.
  6. `bash skills/war/assets/assert-guard-specificity-in-diff.test.sh` passes with
     the equivalent parity + mutation cases against
     `assert-guard-specificity-in-diff.sh` (its own `match_default` shape asserted
     as found at implementation time, never a borrowed literal).
  7. `bash skills/war/assets/assert-test-in-diff.test.sh` passes including the new
     fail-closed classification case: every enumerated script matches a hardcoded
     row (`parity` or `exempt:<actual-mechanism>`); present-but-unclassified or
     classified-but-absent fails with an author-directing message; AND every
     `parity`-tagged row is content-verified — its twin `<name>.test.sh` contains a
     `--resolve-gate` invocation in comment-stripped text (tag honesty is checked,
     not trusted).
  8. The classification check is factored into a function taking its enumerated
     listing as input, and a **permanent in-test mutation arm** feeds it the listing
     plus a stub script name (e.g. `new-floor.sh`) and asserts RED — never a one-off
     dev run.
  9. The classification case's enumeration is not prefix-narrowed: the non-`assert-*`
     names `gate-pin-status.sh` and `provision-worktrees.sh` both appear in its
     evaluated set.
  10. Full suites green: `node --test 'skills/**/*.test.mjs'` and the anchored shell
      loop (`for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`).
  11. Task-diff footprint: the union of the four task diffs lists exactly the four
      files in the spec §5 Modified list (all `*.test.mjs` / `*.test.sh`). Scope is
      the task merges only — the working branch's normal /war bookkeeping (this plan
      document, ledger updates, the servitor's `docs(learnings)` commit) is expected
      and excluded from this check.

## Build order (for /war)

Single phase, two waves. All four tasks are file-disjoint (one test file each);
Tasks 1–3 are independently green off the frozen phase base. Task 4's classification
case content-verifies Tasks 2/3's parity suites (fingerprint check), so it carries
`deps` on both — a wave edge, not a phase edge; files remain disjoint so the
dispatch-rebase is conflict-free. No release phase: the spec's scope class is
test-only with **no release slot changes** (spec §Scope, §5); versioning for this
campaign rides other plans' release phases.

- Phase 1 — Tighten the four drift-guard suites
  - Wave 1: Tasks 1, 2, 3 (parallel)
  - Wave 2: Task 4 (deps: Tasks 2, 3)

## Phase 1 — Tighten the four drift-guard suites

### Task 1: Per-rule qualifier lock in workflow-template.test.mjs (#693)
- Files: skills/war/assets/workflow-template.test.mjs
- Plan slice: Implement spec §4A. Rework the existing test titled
  `stale-looking-but-correct calibration (Task 1.4): the "only when the live artifact
  confirms" qualifier survives per rule on BOTH surfaces` — keep the title byte-intact
  (the semantics finally match it).
  (1) Add a helper (e.g. `qualifierPerRuleWindows(text)`) that locates the four
  `CALIBRATION_RULE_ANCHORS` **sequentially** — each anchor searched from the previous
  match's end, so a rule reorder surfaces as a distinct `anchor-missing` status, never
  as mis-sliced windows or fake qualifier drift. Window *i* = [anchor *i* match start,
  anchor *i+1* match start); window 4 runs to the first `\n#` after anchor 4, else
  end-of-text. Per rule it returns `{ status: 'ok' | 'qualifier-missing' |
  'anchor-missing', start, end }` (window offsets exposed for the mutation test's
  splice surgery); the helper never throws — anchor presence remains the sibling
  test's job, and `anchor-missing` failure messages name the anchor.
  (2) Surface inputs: standing card = the full `auditorMd` text (window 4's `\n#`
  terminator stops before `## Verdict`, deliberately containing rule 5's
  qualifier-free line). Dispatched = the **isolated calibration paragraph**: from the
  captured `auditPrompt` (existing `runPhase` auditor-call pattern — the emitted
  prompt, never `workflow-template.js` source text), split on `\n` and take the single
  line matching `CALIBRATION_RULE_ANCHORS[0]`; run the helper on that line alone, so
  end-of-text is exactly the clause end. This resolves the spec §3-vs-§4.A window-4
  terminator ambiguity without any byte-literal anchor on the trailing
  CASCADING-IMPACT clause, and makes window 4 immune to future prompt clauses,
  clause reorders, and memory prefetch content. (Determinism note: the captured
  prompt is already deterministic under the suite's `defaultImpl` —
  `PROVISION_ARGS()` carries no `memory` key, so every memoryClause site is empty —
  but the line isolation makes the guard independent of that.)
  (3) Replace BOTH `>= 4` aggregate assertions with all-four-windows-`ok` assertions
  on both surfaces. No aggregate occurrence count remains in either Task-1.4 test.
  (4) Add the permanent companion mutation test (Case 10e idiom): for each rule
  position 1–4 and each surface input, splice out every qualifier occurrence strictly
  within [start, end) of that window (`text.slice(0,start) +
  window.replace(/only when the live artifact confirms/gi,'') + text.slice(end)`) and
  assert the helper reports **exactly that rule** `qualifier-missing` and the other
  three `ok` — the complement assertion is load-bearing (lesson
  `weak-test-assertion-passes-without-feature-being-exercised`). Because the intro
  qualifier sits before anchor 1 on both surfaces, window-scoped surgery never touches
  it, and the complement proves it never masks a rule.
  (5) Round scope: initial-round capture only — a deliberate cut, matching the sibling
  anchor test's scope; rebuttal-round base-prompt coverage of the calibration clause
  is already held by the existing `CALIBRATION_SHARED` rebuttal test (auditors: do not
  flag the asymmetry).
  (6) Ceiling comment (broadened from spec §8, naming the real ceiling): any
  **qualifier-free** rule insertion is invisible to this guard — rule 5 already
  demonstrated this by design; a **qualifier-bearing** rule inserted between anchors
  lands in the preceding rule's window and could mask that rule's drop. Both accepted;
  the tripwire for any anchored-rule change is the `CALIBRATION_RULE_ANCHORS` array
  and its sibling anchor test.
  The sibling anchor test is untouched. Do not reconcile the 5-standing / 4-dispatched
  asymmetry; do not add a qualifier to the fifth rule.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Floor/gate exclusion parity for gate-pin-status.sh (#732)
- Files: skills/war/assets/gate-pin-status.test.sh
- Plan slice: Implement spec §4B. Append a parity case block replicating the Case 10
  idiom from `assert-test-in-diff.test.sh` (cases 10a–10e), adapted, with the two
  extraction helpers copied **inline** into this suite (resolved: no shared sourced
  lib — a drifted inline copy extracting from live sources fails loud). `gate_excl`:
  run `node war-config.mjs --resolve-gate …` and extract the `-not -path '*/X/*'`
  tokens from the **emitted output** (verbatim Case 10 helper). `floor_excl`: extract
  exclusion tokens from `gate-pin-status.sh`'s `return 1 ;;` case arms only (today:
  exactly the three `match_sh_suite` exclusion arms; the bare `return 1` fallthroughs
  lack ` ;;` and are correctly out of scope). The inline copy MUST carry Case 10's
  scoping comment **plus the tripwire rationale**: extraction is deliberately scoped
  to executable `return 1 ;;` arms (header-comment `-not -path` prose excluded, or a
  doc edit could fake parity — spec §8), and any future `return 1 ;;` arm added for
  an unrelated purpose will widen the extracted set and turn this case RED **by
  design** — the author reconciles against the gate or updates the extraction
  contract; that loud failure is the point of inline copies.
  Assert: (a) gate output set == `{.claude, .git, node_modules}`; (b) floor set ==
  gate set; (c) `*.test.sh)` name-glob arm present in the **comment-stripped** floor
  source (`grep -v '^[[:space:]]*#'`) and `-name '*.test.sh'` present in gate output;
  (d) shape-adapted 10d — `gate-pin-status.sh` has no `pattern_mjs` literal, so
  assert the structural mjs-mirror arms `skills/*)` and `*.test.mjs)` present inside
  the `match_default` **function body** (extract with
  `sed -n '/^match_default()/,/^}/p'`, comment-strip, then `grep -F` the fixed-string
  arm tokens — never unescaped-glob grep; a header/inline comment describing the same
  pattern in prose can never satisfy it). Delete-the-feature mutation (10e analogue):
  `grep -v` the `.claude` arm into a temp copy, re-extract, assert the mutated set no
  longer equals the gate set. Bash-3.2-safe, cwd-independent, matching the suite's
  existing conventions.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: Floor/gate exclusion parity for assert-guard-specificity-in-diff.sh (#732, survey-derived)
- Files: skills/war/assets/assert-guard-specificity-in-diff.test.sh
- Plan slice: Implement spec §4C — the same parity + mutation case block as Task 2
  (inline helper copies carrying the same scoping + tripwire comment; gate side from
  `--resolve-gate` emitted output; floor side from
  `assert-guard-specificity-in-diff.sh`'s `return 1 ;;` case arms — today exactly the
  three `match_sh_suite` exclusion arms; assertions (a)–(c) identical, comment-stripped
  as in Task 2), pointed at `assert-guard-specificity-in-diff.sh`. Assertion (d)
  targets this script's **own** `match_default` shape as found at implementation time
  (verified at spec time: the same nested `skills/*)` + `*.test.mjs)` structural arms)
  — assert what the construct actually is via the same function-body extraction +
  `grep -F` mechanics, never a literal borrowed from Task 2 or Case 10d (lesson
  `curried-inline-mirror-needs-adapter-shim-in-registry-row`). This floor is a
  survey-derived correction outside issue #732's own file list — the spec's manual
  header-comment survey of every `skills/war/assets/` script caught it where the
  issue's grep did not (grep is a floor, not a ceiling).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: Fail-closed floor classification case in assert-test-in-diff.test.sh (#732)
- Files: skills/war/assets/assert-test-in-diff.test.sh
- Plan slice: Implement spec §4D, strengthened to content verification. Add a new
  case in the Case 10 family:
  (1) Enumerate `skills/war/assets/*.sh` excluding `*.test.sh` (cwd-independent via
  the suite's existing `$HERE`) and compare the sorted listing against a hardcoded
  classification list carrying every current script tagged either `parity`
  (`assert-test-in-diff.sh`, `gate-pin-status.sh`,
  `assert-guard-specificity-in-diff.sh`) or `exempt:<reason>` with the **actual**
  discovery mechanism as the reason, verified per spec §3's table — never a generic
  "different" (`assert-packaging-in-diff.sh`: Dockerfile-naming discovery via
  `git ls-tree`; `assert-no-submodule-mutation.sh`: `git diff --raw` gitlink-mode
  inspection, no file discovery; `assert-issues-filed.sh`: gh/ledger reconciliation,
  no file discovery; `provision-worktrees.sh`: lifecycle tool, not a merge-path
  floor). Any script present-but-unclassified or classified-but-absent fails with a
  message directing the author to add a parity case (idiom: this file's Case 10) or
  an exemption row with its non-gate-discovery reason. The enumeration MUST NOT be
  narrowed to a name prefix — an `assert-*.sh` glob would miss `gate-pin-status.sh`
  and `provision-worktrees.sh` (End state 9).
  (2) Content-verify each `parity` row — the tag is checked, not trusted: the row's
  twin `$HERE/<name minus .sh>.test.sh` must exist and contain a `--resolve-gate`
  invocation in comment-stripped text (the irreducible fingerprint of the parity
  idiom: the gate side extracted from emitted output). A future author who adds
  `newfloor.sh parity` without writing a real parity case goes RED — this closes the
  honor-system hole that let the lesson recur three times. This is why the task
  carries `deps` on Tasks 2 and 3: the fingerprint only exists in their suites after
  they merge; the dispatch-rebase onto the integration tip provides it (files stay
  disjoint — no conflict).
  (3) Factor the classification check into a function taking its enumerated listing
  (newline list) as input, and include a **permanent in-test mutation arm** (End
  state 8): feed the function the real listing plus a stub name (`new-floor.sh`) and
  assert RED — the delete-the-feature discipline per pivotal constraint 3; spec
  validation criterion 8's "or a documented one-off RED run" alternative is rejected
  (see Notes).
  No mirror-registry rows in `workflow-template.test.mjs` for this (resolved: floor/
  gate parity is shell-vs-mjs-output and lives in the shell suites).
- requiresTest: true
- requiresPackaging: false
- deps: [task-2, task-3]
- target repo: superproject

## Deferred validations (backstops)

- **Phase-base preflight (Base requirement):** before Provision, verify the frozen
  phase base carries the edited constructs — `git grep -c CALIBRATION_RULE_ANCHORS
  <base> -- skills/war/assets/workflow-template.test.mjs` ≥ 1 and `git grep -c 'case
  10e' <base> -- skills/war/assets/assert-test-in-diff.test.sh` ≥ 1 · why deferred:
  the base is chosen at campaign launch (operator-directed, ADR 0011), not by any
  task · runner: Lead at launch; a miss halts before any worker spawns.
- Task-diff footprint audit (End state 11): the union of the four task-merge diffs
  lists exactly the four Modified files from spec §5 — nothing outside `*.test.mjs` /
  `*.test.sh`; /war bookkeeping commits (plan doc, ledger, `docs(learnings)`) are out
  of scope · why deferred: a cross-task whole-phase property no single task's gate
  can see · runner: Lead at phase land (post-merge gate-audit, `execution-evidence`
  lens); re-provable by /red-team.
- Sibling-anchor-test byte-identity (End state 3): the test titled
  `… war-auditor.md AND auditPrompt carry all four rule anchors` is byte-unchanged
  by Task 1's diff · why deferred: "did NOT change" is a diff-level fact, not a
  green-suite fact · runner: Task 1's auditor (diff inspection at the pinned
  audit_sha), re-checked at phase land.
- Full-repo suites (End state 10): `node --test 'skills/**/*.test.mjs'` and the
  anchored shell-test loop over `hooks/` + `skills/` · why deferred: each task's gate
  runs its self-discovered suites; the whole-repo sweep is the cross-task
  interference check · runner: Lead at phase land, before push.
- Issue lifecycle: the phase-end PR body carries `Closes #693` and `Closes #732`,
  and #732 receives a comment recording that
  `assert-guard-specificity-in-diff.sh` was a survey-derived addition **outside** the
  issue's own file list (calibration rule 4: the plan carried the same-scope manual
  survey) · why deferred: land-time bookkeeping, not a task diff · runner: Lead at
  land.

## Notes / conscious deviations

- **Base pin (grill Q1):** the spec's facts were verified at `origin/master`
  (`bbaa68a`); the current campaign worktree base `f6da10c` predates them and cannot
  run this plan — every task's first grep would miss. The Base requirement block at
  the top is a hard precondition; base selection remains operator-directed per
  ADR 0011 / lesson `war-branch-base-off-latest-master-not-prior-tip`.
- **Window-4 terminator (grill Q2, spec §3 vs §4.A contradiction):** resolved — the
  dispatched surface is the isolated single-paragraph calibration line (split the
  captured prompt on `\n`, take the line matching anchor 1) with end-of-text on that
  line; the standing card uses the next `\n#` heading. One helper, no byte-literal
  anchor on the trailing CASCADING-IMPACT clause, window 4 immune to prompt-tail
  growth and memory prefetch.
- **Determinism (grill Q3):** verified — `PROVISION_ARGS()` sets no `memory` key, so
  the captured `auditPrompt` under `defaultImpl` carries empty memory clauses; the
  line isolation removes the dependence anyway.
- **Complement assertion (grill Q4):** every mutation arm asserts the other three
  rules still `ok` — an all-missing helper cannot pass; surgery is offset-spliced
  strictly inside the window, so the intro qualifier (pre-anchor-1 on both surfaces)
  is provably never the thing removed.
- **Initial-round-only capture (grill Q5):** deliberate scope cut, matching the
  sibling anchor test; rebuttal-round base-prompt coverage of the calibration clause
  is held by the existing `CALIBRATION_SHARED` rebuttal test. Auditors: not a gap.
- **Case D content verification (grill Q6):** upgraded from tag-honesty to a
  fingerprint check (`--resolve-gate` in the twin suite, comment-stripped) — the
  honor-system tag was the same silent-copy failure mode #732 exists to kill. Cost:
  Task 4 gains `deps: [task-2, task-3]` (wave edge, files disjoint).
- **Permanent mutation arm only (grill Q7):** spec validation criterion 8's
  "or a documented one-off RED run" contradicts pivotal constraint 3 and is rejected;
  the classification check is factored to take its listing as input so the stub-name
  mutation arm is a permanent in-test case.
- **Campaign contention (grill Q8):** verified — the batch's other plan
  (red-team-resilience) touches `skills/red-team/*`, `CONTEXT.md`, and the release
  slots; zero overlap with this plan's four files. No release phase here (test-only);
  versioning rides other plans' release phases; a standalone /war run ships
  unversioned by design.
- **`return 1 ;;` tripwire (grill Q9):** intended behavior — a future unrelated
  `return 1 ;;` arm turns the parity case RED and the author reconciles; each inline
  helper copy carries the scoping comment plus this rationale so the failure teaches
  the extraction contract instead of reproducing byte-copy-without-context.
- **Assertion (d) scoping (grill Q10):** function-body extraction
  (`sed -n '/^match_default()/,/^}/p'`) + comment-strip + `grep -F` fixed-string arm
  tokens — comment prose can never satisfy it, and the glob metacharacters are safe
  under bash 3.2.
- **Anchor-order fail-loud (grill Q11):** sequential-from-previous-match anchor
  search makes a rule reorder surface as `anchor-missing` (message names the anchor),
  never as mis-sliced windows misread as qualifier drift.
- **End state 1 mechanics (grill Q12):** the no-aggregate-count check is scoped to
  the two named Task-1.4 test bodies (auditor reads the named constructs); the window
  helper's `.length` uses on anchor/window arrays are out of scope by construction.
- **requiresTest (grill Q14):** `true` on all four — the diffs ARE tests, so the
  `assert-test-in-diff.sh` floor passes by construction; noted so auditors don't read
  the flag as vacuous. End state 11 is scoped to task diffs, excluding /war
  bookkeeping commits.
- **Rollback coupling (grill Q16):** Tasks 1–3 are revert-independent. Reverting
  Task 2 or 3 **after** Task 4 lands turns Task 4's fingerprint check RED — by
  design: a parity-tagged floor without a live parity case is exactly what the
  classification case exists to catch. The `deps` edge records the coupling; revert
  Task 4 first (or together) if unwinding.
- **Grep-as-floor:** the Task 4 classification list is survey-derived (directory
  listing + manual header-comment survey of every `skills/war/assets/` script), not
  grep-derived; any implementer re-verifying it must repeat the same-scope manual
  survey, not a name-prefix grep. `assert-guard-specificity-in-diff.sh` (Task 3) is
  itself the survey-derived straggler the issue's own file list missed.
- **ADR 0005 / enum discipline:** not triggered — no enum, no status value, no
  `HARD_ESCALATION_REASONS` surface is touched; the diff is four test files.
- **Prompt-surface split (agents/*.md + workflow-template.js same commit):** not
  triggered — both surfaces are read-only inputs here (spec §2.1); no task may edit
  them, including not "fixing" the deliberate five-rules-standing vs four-dispatched
  asymmetry.
- Anchors throughout are named constructs (test titles, `CALIBRATION_RULE_ANCHORS`,
  `match_sh_suite`, `match_default`, `resolveGate`, `return 1 ;;` case-arm shape) —
  never line numbers, never quote/backtick-bearing byte literals (lesson
  `shared-string-constant-quote-literal-byte-anchor-fragility`).
- Tasks 2 and 3 duplicate ~10 lines of extraction helper by resolved design (spec §3:
  inline copies fail loud; a shared sourced lib adds cwd machinery for no
  drift-safety gain) — auditors should not flag the duplication as a defect.

## Open decisions

None — the spec's design tree plus the grill reconciliation above resolve every fork.
