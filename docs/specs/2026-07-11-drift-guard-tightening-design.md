# Drift-guard tightening: per-rule qualifier lock + floor/gate exclusion parity

**Issues addressed:** #693, #732
**Date:** 2026-07-11 · **Author:** /survey-corps (Survey Corps spec pass)
**Scope class:** test-only — no behavior surface, no prompt surface, no enum, no release slot changes.

## 1. Context — the gap / problem

Two drift-guard tests assert weaker facts than the invariants they exist to hold.

**#693 — one-occurrence slack in the qualifier floor.** The `workflow-template.test.mjs`
test titled `stale-looking-but-correct calibration (Task 1.4): the "only when the live
artifact confirms" qualifier survives per rule on BOTH surfaces` asserts the qualifier
occurs `>= 4` times on each mirrored surface (`agents/war-auditor.md` and the built
`auditPrompt()`). Both surfaces actually carry **5** occurrences — a subsection intro
line ("Each rule demotes only when the live artifact confirms …") pads the count on top
of the one-per-rule occurrences. Silently dropping the qualifier from exactly **one**
rule (widening that rule to unconditional amnesty) leaves 4 ≥ 4 and the test stays
green; the sibling anchor test also stays green because its anchors are mid-sentence
rule descriptors, not the qualifier. This is precisely the single-rule silent widening
the lock was authored to catch. A further wrinkle verified at tip: the standing card now
carries a **fifth** calibration rule ("Deliberately-unwired marker") that intentionally
has *no* qualifier and is intentionally *not* mirrored into the dispatched clause
(standing card says "Five authoring patterns", dispatched clause says "four") — so raw
occurrence counts are surface-asymmetric by design and will keep drifting as rules are
added. Aggregate counting is the wrong shape; the fact to guard is **per rule**.

**#732 — floor/gate exclusion parity is prose-only for two of three discoverers.**
CLAUDE.md states the invariant that merge-path floor scripts' discovery patterns must
mirror `resolveGate` in `war-config.mjs` (find exclusions: `node_modules`, `.git`,
`.claude`), and the lesson `floor-script-discovery-set-must-mirror-gate-exclusions` has
**3 recorded recurrences**. Since the issue was filed, `assert-test-in-diff.test.sh`
Case 10a–10e landed the enforcement idiom: extract the exclusion set from resolveGate's
**emitted output** (`node war-config.mjs --resolve-gate …`), extract the floor's set
from its executable `return 1 ;;` case arms, assert equality, and prove the check is
load-bearing with a delete-the-feature mutation (10e). But the idiom covers only that
one floor. Verified at tip:

- `gate-pin-status.sh` byte-copies `match_sh_suite`/`match_default` ("copied verbatim"
  per its own comment, citing the lesson) and `gate-pin-status.test.sh` has **zero**
  parity assertions.
- `assert-guard-specificity-in-diff.sh` **also** byte-copies the same pair (same three
  exclusion arms) and its test also has zero parity assertions — a straggler outside
  the issue's own file list, caught by the manual floor survey this spec performed
  (grep is a floor, not a ceiling).
- Nothing fail-closed catches the *next* floor script that ships a discovery copy
  without a parity case — which is exactly how the lesson recurred three times.

## 2. Pivotal constraints

1. **Test-only.** `agents/war-auditor.md`, `workflow-template.js`, `war-config.mjs`,
   and every floor `.sh` script are **read, never edited**. The prompt-surface split
   rule (agents/*.md + workflow-template.js change together) is therefore not
   triggered — and this group must not "fix" the deliberate 5-standing / 4-dispatched
   rule-count asymmetry.
2. **Extraction + equality against live output, never source text** (ADR 0025
   drift-guard discipline; Case 10's recorded idiom). The gate side is always read from
   `resolveGate`'s emitted string via the `--resolve-gate` CLI, so a benign refactor of
   `war-config.mjs` cannot break the guard — only a real discovery-set drift does.
3. **Delete-the-feature RED cases are permanent in-test mutations**, not one-off
   dev-time checks (lesson `weak-test-assertion-passes-without-feature-being-exercised`,
   9 recurrences; precedent: Case 10e).
4. **Shell tests stay bash-3.2-safe and cwd-independent**, matching every existing
   `*.test.sh` in `skills/war/assets/`.
5. **Anchor by named construct** — test titles, function names (`match_sh_suite`,
   `resolveGate`), case-arm shapes — never line numbers, and never quote/backtick-bearing
   byte literals (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`).
6. **Parity scope is discovery-set identity, not floor-ness.** Only floors that
   reimplement the gate's test-discovery set owe parity; floors with their own discovery
   domain (Dockerfile naming, gitlink diff modes, gh/ledger reconciliation) are exempt —
   conflating the two is the recorded failure in lesson
   `docker-signature-list-scope-conflated-with-gate-classifier`.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #693: raise threshold to `>= 5` vs assert per rule | **Per rule.** A raw count rots on every rule addition (the fifth rule already made counts surface-asymmetric and qualifier-free by design); pairing each of the four `CALIBRATION_RULE_ANCHORS` with its trailing qualifier guards the actual fact. |
| Per-rule matching shape: lazy cross-text regex (`anchor[\s\S]*?qualifier`) vs anchor-bounded windows | **Anchor-bounded windows.** The lazy regex false-passes: a rule that lost its qualifier matches into the *next* rule's qualifier. Split each surface at the four anchor matches; window *i* = text from anchor *i* to anchor *i+1* (window 4 bounded by the next markdown heading on the standing card / end of the calibration clause on the dispatched prompt); assert the qualifier inside each window. |
| RED-case encoding for #693 | **Permanent companion mutation test** (Case 10e idiom): factor the per-window check into a helper, then strip the qualifier from exactly one rule's window in a string copy — looped over **each of the four rule positions** on both surfaces — and assert the helper reports that rule missing. Covers the window-4 boundary case (rule 5's qualifier-free text lives inside window 4 on the standing card). |
| #732: which floors owe parity | **The gate-set discoverers only**: `assert-test-in-diff.sh` (Case 10, already enforced), `gate-pin-status.sh` (new), and `assert-guard-specificity-in-diff.sh` (new — survey-derived correction, outside the issue's file list). Exempt with reasons: `assert-packaging-in-diff.sh` (Dockerfile-naming discovery via `git ls-tree`, deliberately not the gate set), `assert-no-submodule-mutation.sh` (`git diff --raw` gitlink-mode inspection — no file discovery), `assert-issues-filed.sh` (gh/ledger reconciliation — no file discovery), `provision-worktrees.sh` (lifecycle tool, not a merge-path floor). |
| Parity-helper reuse: shared sourced helper file vs inline copies of `gate_excl`/`floor_excl` | **Inline copies** in each floor's own `.test.sh`. The helpers are ~10 lines each and extract from *live* sources on both sides, so a drifted helper copy fails loud, never silent; a shared sourced lib adds a file plus cwd-resolution machinery for no drift-safety gain. |
| Case 10d analogue for `gate-pin-status.sh` | **Adapt to the construct's shape** (lesson `curried-inline-mirror-needs-adapter-shim-in-registry-row`): `gate-pin-status.sh` has no `pattern_mjs="skills/**/*.test.mjs"` literal — its mjs mirror is the nested case arms `skills/*)` + `*.test.mjs)` inside `match_default`. Assert those structural arms present instead of literal-matching Case 10d. |
| Fail-closed piece: prose audit note vs classification case | **Fail-closed classification case** (new Case in `assert-test-in-diff.test.sh`, home of the parity idiom): enumerate every non-test `.sh` in `skills/war/assets/` and assert each appears in a hardcoded classification list — parity-checked or exempt-with-reason. A new floor script without a row turns the case RED, forcing its author to classify. Three recurrences prove the prose-only invariant does not hold. |
| New mirror-registry rows in `workflow-template.test.mjs` for #732 | **No.** The D2/D3 registry guards inline JS mirrors inside the Workflow sandbox; floor/gate parity is shell-vs-mjs-output and lives in the shell suites where the idiom already exists. `workflow-template.test.mjs` is touched only for #693. |

## 4. Mechanics

### A. Per-rule qualifier lock (`skills/war/assets/workflow-template.test.mjs`, #693)

Rework the existing test titled `… the "only when the live artifact confirms" qualifier
survives per rule on BOTH surfaces` (keep the title; it stays accurate — the semantics
finally match it):

1. Add a helper (e.g. `qualifierPerRuleWindows(text)`) that locates each of the four
   `CALIBRATION_RULE_ANCHORS` matches in order, slices window *i* = [anchor *i* match
   start, anchor *i+1* match start) with window 4 running to the next `\n#` heading or
   end-of-text, and returns, per rule, whether `/only when the live artifact confirms/i`
   occurs inside the window. Missing anchor ⇒ that rule reports failed (the helper never
   throws past the existing anchor-presence test).
2. The main test asserts all four windows carry the qualifier on **both** surfaces:
   `auditorMd` (standing card) and the dispatched `auditPrompt` captured from a
   `runPhase` auditor call — replacing both `>= 4` aggregate assertions. No aggregate
   occurrence count remains anywhere in the test.
3. A companion mutation test (permanent RED case): for each rule position 1–4 and each
   surface, produce a copy with that window's qualifier phrase removed (string surgery
   inside the window only) and assert the helper reports exactly that rule missing.
   This proves per-rule discrimination — including that window 4 cannot borrow a
   qualifier from trailing text — and that the intro line's qualifier (outside all
   windows) can never satisfy a rule.

The sibling anchor test (`… war-auditor.md AND auditPrompt carry all four rule anchors`)
is untouched; it remains the gross whole-rule-removal guard.

### B. Floor/gate exclusion parity for `gate-pin-status.sh` (`skills/war/assets/gate-pin-status.test.sh`, #732)

Append a parity case block replicating the Case 10 idiom, adapted:

- `gate_excl`: run `node war-config.mjs --resolve-gate …` and extract the
  `-not -path '*/X/*'` tokens from the **emitted output** (verbatim Case 10 helper).
- `floor_excl`: extract exclusion tokens from `gate-pin-status.sh`'s `return 1 ;;`
  case arms (verbatim Case 10 helper; verified at tip the script's only `return 1 ;;`
  lines are the three exclusion arms of `match_sh_suite`).
- Assert: (a) gate output set == `{.claude, .git, node_modules}`; (b) floor set ==
  gate set (the parity claim); (c) the `*.test.sh)` name-glob arm present in the floor
  and `-name '*.test.sh'` present in gate output; (d) the structural mjs-mirror arms
  (`skills/*)` and `*.test.mjs)`) present in `match_default` — the shape-adapted 10d.
- Delete-the-feature mutation (10e analogue): `grep -v` the `.claude` arm into a temp
  copy, re-extract, assert the mutated set no longer equals the gate set.

### C. Floor/gate exclusion parity for `assert-guard-specificity-in-diff.sh` (`skills/war/assets/assert-guard-specificity-in-diff.test.sh`, #732 survey-derived)

Same case block as B, pointed at `assert-guard-specificity-in-diff.sh` (its
`match_sh_suite` carries the identical three exclusion arms; structural-arm assertion
(d) targets its own `match_default` shape as found at implementation time — assert
what the construct actually is, never a borrowed literal).

### D. Fail-closed floor classification (`skills/war/assets/assert-test-in-diff.test.sh`, #732)

New case in the Case 10 family: list `skills/war/assets/*.sh` excluding `*.test.sh`
(cwd-independent via the suite's existing `$HERE`), and compare the sorted listing
against a hardcoded classification list carrying every current script tagged either
`parity` (assert-test-in-diff.sh, gate-pin-status.sh,
assert-guard-specificity-in-diff.sh) or `exempt:<reason>` (assert-packaging-in-diff.sh,
assert-no-submodule-mutation.sh, assert-issues-filed.sh, provision-worktrees.sh). Any
script present-but-unclassified, or classified-but-absent, fails the case with a message
directing the author to either add a parity case (idiom: this file's Case 10) or an
exemption row with its non-gate-discovery reason.

Authoring note (grep is a floor, not a ceiling): the classification list above was
built from a directory listing **plus** a manual header-comment survey of every script
in `skills/war/assets/` — a prefix glob like `assert-*.sh` alone would have missed
`gate-pin-status.sh`, and the issue's own file list missed
`assert-guard-specificity-in-diff.sh`; both are listed here as survey-derived rows.
The implementation must not narrow the enumeration to a name prefix.

## 5. Surface changes

Modified (test-only):

- `skills/war/assets/workflow-template.test.mjs` — rework the per-rule qualifier test
  (helper + both-surface per-window assertions) + companion mutation test (A).
- `skills/war/assets/gate-pin-status.test.sh` — parity case block + mutation case (B).
- `skills/war/assets/assert-guard-specificity-in-diff.test.sh` — parity case block +
  mutation case (C).
- `skills/war/assets/assert-test-in-diff.test.sh` — fail-closed floor classification
  case (D).

Read-only inputs (never edited by this change): `agents/war-auditor.md`,
`skills/war/assets/workflow-template.js`, `skills/war/assets/war-config.mjs`
(`resolveGate`), `skills/war/assets/gate-pin-status.sh`,
`skills/war/assets/assert-guard-specificity-in-diff.sh`,
`skills/war/assets/assert-packaging-in-diff.sh`,
`skills/war/assets/assert-no-submodule-mutation.sh`,
`skills/war/assets/assert-issues-filed.sh`.

## 6. New domain terms (CONTEXT.md)

None. ("Floor/gate parity" and the delete-the-feature idiom are already established by
Case 10 and the lessons corpus; the classification case is an instance of the ADR 0025
drift-guard discipline, not a new concept.)

## 7. Recommended ADRs

None. This extends the existing ADR 0025 drift-guard discipline (extraction + equality,
fail-closed registries) to two already-recorded facts; no new binding decision is made.

## 8. Open risks / implementation notes

- **Future rule insertion between anchors (#693).** A hypothetical rule 6 inserted
  *between* two existing rules would land inside the preceding rule's window; if it
  carried its own qualifier it could mask a drop in that preceding rule. Accepted
  ceiling: the companion mutation test locks today's four-rule shape, and any rule
  addition already obligates a `CALIBRATION_RULE_ANCHORS` update (the anchor test is
  the tripwire). Note the ceiling in a test comment.
- **`floor_excl` extraction scope.** The helper counts only `return 1 ;;` case arms,
  deliberately excluding the header comments' identical `-not -path` prose (Case 10's
  recorded scoping); implementers must preserve that scoping when copying it, or a
  doc-comment edit could fake parity.
- **Dispatched-surface capture (#693).** The dispatched surface is the auditor prompt
  captured from a `runPhase` call (existing pattern in the current test), not
  `workflow-template.js` source text — keep it that way so the guard tests the emitted
  prompt.
- The exemption reasons in the classification list (D) must state the *actual* discovery
  mechanism (verified in §3's table), not a generic "different" — a wrong reason is the
  docker-signature-list conflation recurring in miniature.

## 9. Non-goals / deferred

- No change to any prompt surface, floor script, or `resolveGate` — including no
  reconciliation of the deliberate 5-rule standing card vs 4-rule dispatched clause
  asymmetry, and no qualifier added to the fifth rule (its confirmation is the marker
  itself, by design).
- No guard on the calibration *intro* line's qualifier occurrence in isolation (the
  four rule-level qualifiers are the load-bearing amnesty gates; the intro is framing).
- No parity enforcement for the exempt floors' own discovery sets (e.g. locking the
  Dockerfile-naming exclusions to anything) — their discovery domains have no canonical
  counterpart in `resolveGate`.
- No AST-based or scanner-based registry (`// ponytail:` — rejected ceiling per the
  mirror-registry precedent); the classification list grows by row.
- No new `workflow-template.test.mjs` mirror-registry rows for #732.

## 10. Validation criteria

1. `node --test skills/war/assets/workflow-template.test.mjs` passes at tip, and the
   per-rule qualifier test contains **no** aggregate occurrence-count assertion
   (grep the test body for `>= 4` / a `.length` count on the qualifier regex → zero
   matches; assertions are per-window, per rule, on both surfaces).
2. RED proof, standing card: removing the qualifier phrase from exactly one rule's
   window in a mutated copy of the `war-auditor.md` text makes the helper report that
   rule (and only that rule) missing — asserted by the permanent companion test for
   **each** of the four rule positions.
3. RED proof, dispatched prompt: same per-position mutation loop against the captured
   `auditPrompt` text — including rule 4, proving the window cannot borrow a qualifier
   from trailing text.
4. The sibling anchor test (`… carry all four rule anchors`) is byte-unchanged and
   still passes.
5. `bash skills/war/assets/gate-pin-status.test.sh` passes with new cases asserting:
   resolveGate **emitted-output** exclusion set == `{.claude, .git, node_modules}` ==
   `gate-pin-status.sh`'s `return 1 ;;`-arm set, plus the `*.test.sh` glob and the
   structural `skills/*)`/`*.test.mjs)` mjs-mirror arms present.
6. RED proof, gate-pin-status: the in-test mutation (`.claude` arm removed from a temp
   copy) yields a set ≠ the gate set — the parity case is load-bearing, not vacuous.
7. `bash skills/war/assets/assert-guard-specificity-in-diff.test.sh` passes with the
   equivalent parity + mutation cases against `assert-guard-specificity-in-diff.sh`.
8. `bash skills/war/assets/assert-test-in-diff.test.sh` passes including the new
   classification case; deleting any row from the hardcoded classification list, or
   dropping a stub `.sh` into a copy of the assets dir enumeration, turns the case RED
   (verified by the case's own mutation arm or a documented one-off RED run).
9. The classification case's enumeration is not prefix-narrowed: `gate-pin-status.sh`
   and `provision-worktrees.sh` (non-`assert-*` names) both appear in its evaluated set.
10. Full suites green: `node --test 'skills/**/*.test.mjs'` and the anchored shell-test
    loop (`for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`)
    both pass.
11. Test-only diff: `git diff --name-only` for the change lists only the four files in
    §5's Modified list (all `*.test.mjs` / `*.test.sh`).
