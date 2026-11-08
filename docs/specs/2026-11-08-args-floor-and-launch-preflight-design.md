# Args floor and launch preflight — mirror the #1413 floor, fix the pt scanner, guard `--force`

dependsOn: none. Heads the `skills/war/assets/workflow-template.js` chain; edits `assert-args-complete.mjs` and `skills/war/SKILL.md` before its siblings (see §5).

Issues addressed (all 8): #1760, #1763, #1775, #1778, #1896, #2345, #2377, #2551.

## 1. Context — the gap / problem

**A. The preflight does not mirror the provenance floor (#1896, #2377 row 1).** The template refuses at entry when `intent`, `backstops` or `adjudications` carry none of the run's plan-slug tokens, or name a foreign `docs/plans/<x>.md` id (verified: the `Args provenance floor (#1413 …` block, `ownTokens` / `foreignIds` / `rowText` at 35aa4144). The preflight has no such check (verified: `assert-args-complete.mjs` read whole at 35aa4144). So it exits 0 and the entry floor refuses with 0 agents; four recurrences, the latest in v0.21.35 (verified: issue #1896 (2026-08-27)). The usual cause is a red-team `## Adjudications` row, a prose string `<adjudicated literal> supersedes <plan-body literal> — <ref> — <provenance>` with no slug token (verified: `skills/red-team/references/lenses.md` `## Adjudications` at 35aa4144); a non-value string row is own-token scanned (verified: `isValueRow` and the `rowText` string arm at 35aa4144). A consumer run hit the same refusal on its own `source:'plan'` backstops (verified: issue #2377 (2026-10-17)). `skills/war/SKILL.md` never tells the Lead to stamp `planFile` (verified: `grep -n planFile skills/war/SKILL.md` empty at 35aa4144). Patching only the launch copy leaves ledger rows token-less, so the next phase is refused again (verified: issue #1896 (2026-08-27), comment 1). Operator ruling: owner comments widen scope to the producer side (stamp at authoring time) as well as the preflight mirror, with no pick between them (verified: issue #1896 (2026-08-27)).

**B. `when` passes the own-token match (#2551).** `when` is not in `PROVENANCE_TOKEN_STOPLIST` (verified: `PROVENANCE_TOKEN_STOPLIST` at 35aa4144). Done-when: a red-first fixture, or an operator ruling that the limit is fine (verified: issue #2551 (2026-10-31)).

**C. The `source:'auto'` exemption (#1763).** It records a blast radius, not a defect (verified: issue #1763 (2026-08-26)). The foreign-id half is fixed: every backstops/adjudications row is now foreign-id scanned, and a foreign `planFile` stamp refuses before the `source:'auto'` check (verified: the D10 / #1749 clause, `rowText` ordering, and test `provenance floor: exempt row foreign id refuses` at 35aa4144). The own-token vouching half is the #1666 behavior, pinned by `provenance floor: own-token from an exempt row still launches (#1666 control)` (verified: `workflow-template.engine-1.test.mjs` at 35aa4144). Operator ruling: narrowing needs a plan decision; no direction ruled (verified: issue #1763 (2026-08-26)).

**D. The pt scanner is comment- and string-blind (#1775).** `ptSpanRanges` seeds on `/\bpt`/g` over raw source (verified: `ptSpanRanges` at 35aa4144). `staged-script.md` tells the Lead to re-run the preflight with `--template <staged path>` after an injected stage (verified: its Args-complete preflight section at 35aa4144). A `--args` staged copy carries `const EMBEDDED_ARGS = ${JSON.stringify(embedded)}`, and JSON does not escape backticks (verified: `insertArgsPrelude` at 35aa4144). A phantom span gives a false exit 1, or swallows real spans for a false exit 0; the zero-field guard catches only total collapse (verified: issue #1775 (2026-08-26); the `fields.length === 0` guard at 35aa4144).

**E. Census false-negative classes (#1760).** `extractInterpolations` matches `/\$\{([^{}]*)\}/g` and admits only a pure dotted chain, so a bracket chain (`${tasks[0].id}`) and a chain inside a brace-containing expression escape (verified: issue #1760 (2026-08-26); `extractInterpolations` at 35aa4144). The hand-scan record above `BARE_INTERPOLATION_CENSUS` now states its result ("zero missed fallback-free sites") and lists both classes as recorded gaps (verified: `workflow-template.test-harness.mjs` at 35aa4144). The one bracket site in the template is guarded (`submodTasks[0] && submodTasks[0].targetRepo || '<targetRepo>'`) (verified: grep of `workflow-template.js` at 35aa4144).

**F. Unsafe quoting in the preflight prose (#1778).** The clause says "feed stdin via a quoted heredoc (`<<'JSON'`), **never** a single-quoted shell literal", citing apostrophe breakage (verified: `skills/war/SKILL.md` Args-complete preflight at 35aa4144). It does not forbid a double-quoted literal or an unquoted `<<JSON`, both of which run `$(` and backticks in AI-authored prose in the Lead's shell (verified: issue #1778 (2026-08-26)).

**G. `--force` silently drops injected stages (#2345).** With `--force`, `main()` skips the existing-file block and writes a fresh copy with no comparison (verified: the `fs.existsSync(stagedPath) && !force` block and `fs.writeFileSync(stagedPath, staged)` at 35aa4144); no digest exists (verified: no `createHash` in `stage-workflow.mjs` at 35aa4144). A pure-submodule phase can lose its forced PR-and-hold land stage and push to the submodule main (verified: issue #2345 (2026-09-29)). Arm `(g) --force overwrites a pre-existing different-content staged file` pins the overwrite (verified: `stage-workflow.test.mjs` at 35aa4144).

**H. `scriptPath` outside a linked worktree (#2377 row 3).** The stager writes under `$MAIN/.claude/war/runs/<runId>/`; a linked-worktree session's Workflow tool refused that path, and the workaround was copying the script into the worktree (verified: issue #2377 (2026-10-17)). No doc mentions it (verified: `grep -i 'linked worktree'` on `staged-script.md` and `SKILL.md` empty at 35aa4144). Row 2 of #2377 is fixed: `normRef` strips the ` · check:` tail and `[check:]` marker (verified: `const normRef` at 35aa4144).

## 2. Pivotal constraints

1. The Workflow sandbox cannot import, so the floor cannot be a shared module (verified: CLAUDE.md at 35aa4144).
2. Floor scripts exit 0/1/2; 2 is a tooling error, never a floor status (verified: `assert-args-complete.mjs` header at 35aa4144).
3. No dispatched prompt string changes, so the both-surfaces rule does not trigger [assumed: no task touches a pt prompt — if wrong: that task adds its `agents/*.md` card to the same commit and file overlap is re-checked].
4. `skills/war/SKILL.md` is 64,911 B, over its 64,512 B advisory line (verified: `wc -c` and `prompt-surface-budgets.test.mjs` at 35aa4144). SKILL.md edits are net-zero or smaller.
5. #1666 exempt-row vouching stands unless the operator rules otherwise (verified: the `scanText` / `evidenceText` comment at 35aa4144).
6. The repo gate never runs the stripped staged form, so preflight reads of a staged copy need their own test [assumed: per the repo lesson on the staged-form run — if wrong: one redundant test].

## 3. Resolved design tree

| ID | Decision | Resolution |
|----|----------|------------|
| D1 | How the preflight mirrors the floor (#1896) | Slice the template source from `const provenanceProblems = []` to `if (provenanceProblems.length) throw` and run it in `new Function` with `A`, `plan`, `planSlug`, `intent`, `backstops`, `adjudications`, `log`, bound by copies of the template's one-line reads. One source of truth [assumed: extract-and-evaluate over a hand mirror — if wrong: a hand mirror plus a drift-guard test on the stoplist and helpers]. |
| D2 | Diagnostics (#1896 comment 1) | Exit 1, print each template refusal verbatim (they name `args.<arg>` and the token list), plus one line: stamp the row at its ledger source, not the launch copy. Missing markers or an uncompilable slice exit 2 [assumed: exit 2 — if wrong: a refactor silently disables the mirror]. |
| D3 | `when` (#2551) | Add `when` to the stoplist with a red-first fixture. No broader rule [assumed: one word — if wrong: the next generic word needs another issue]. |
| D4 | Producer stamp (#1896, #2377 row 1) | Decompose step 5: stamp at first ledger record. Object rows get `planFile: <plan.file>`; red-team string rows get ` (source: docs/red-team/<plan-slug>.md)` appended (slug words, not a `docs/plans/` id). Red-team format unchanged [assumed: stamp on the `/war` side — if wrong: `skills/red-team` joins the spec]. Never wrap a string row as `{ adjudicated: <string>, planFile }`: the object arm has no citation strip, so a `supersedes docs/plans/<x>.md` citation would refuse as foreign (verified: `rowText` object arm and `stripSupersedes` at 35aa4144). |
| D5 | `source:'auto'` (#1763) | Do not narrow. Close with a pointer to #2190 and the #1666 control test [assumed: keep as is — if wrong: an operator ruling flips the #1666 control in task 1.2]. |
| D6 | Tokenizer (#1775) | The seed loop skips `//` and `/* */` comments and `'…'` / `"…"` strings outside spans before matching. `EMBEDDED_ARGS` JSON is a double-quoted literal, so it is skipped. Port the approach of `extractTopLevelTemplateLiterals` in `prompt-surface-budgets.test.mjs` [assumed: context skip, not an `EMBEDDED_ARGS` line filter — if wrong: the filter is simpler but leaves the blindness for the next injected stage]. |
| D7 | Class (a) bracket chains (#1760) | Admit `[<digits>]` segments; map `tasks[N].x` to `tasks[].x`. [assumed: widen — if wrong: class stays recorded-only]. |
| D8 | Class (b) brace expressions (#1760) | Do not parse. Pin the exact list of top-level expression bodies (from `ptSpanRanges` `exprs`) holding a nested `${` outside a nested pt span; a new one reds [assumed: pin, not parse — if wrong: full expression parsing is needed]. |
| D9 | Safe quoting (#1778) | Rewrite in place: prefer the file route; if piping, only `<<'JSON'`; forbid single-quoted, double-quoted and unquoted `<<JSON` forms because of command substitution. |
| D10 | `--force` guard (#2345) | Each write also writes `<staged>.sha256`. `--force` over an existing file: digest matches ⇒ overwrite; differs or no sidecar ⇒ exit 1 naming `--discard-injections`, file untouched. `--discard-injections` implies `--force`. No `--reapply` [assumed: sidecar, refuse on missing — if wrong: older staged files need the flag once]. |
| D11 | Linked worktree (#2377 row 3) | Doc only in `staged-script.md`: copy the printed script under the session cwd and dispatch the copy [assumed: doc, not a new stage dir — if wrong: the stager needs a `--stage-dir` flag]. |

## 4. Mechanics

**Phase 1 — four parallel, file-disjoint tasks.**

- **Task 1.1 — preflight** (owns `skills/war/assets/assert-args-complete.mjs`, `assert-args-complete.test.mjs`). #1896 (D1, D2), #1775 (D6), #1760 (D7, D8). Export `provenanceProblems(source, args)`; the CLI calls it after `checkArgs`. Update the header exit contract and the "excluded only incidentally" sentence. Tests: `provenance mirror: token-less adjudication string row exits 1 naming args.adjudications`, `provenance mirror: planFile-stamped row exits 0`, `provenance mirror: missing floor markers exit 2`, `provenance mirror: runs on the stripped staged form`, `provenance mirror: copied bindings are byte-equal to the template`, `ptSpanRanges: a pt backtick inside a string or comment opens no span`, `CLI --template: EMBEDDED_ARGS prose leaves the field set unchanged`, `extractInterpolations: bracket-indexed chain is censused`.
  - Sweep: `grep -n 'interpolation surface\|dispatch-complete' skills/war/assets/assert-args-complete.mjs`; reword each message that claims only the interpolation surface. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **Task 1.2 — template floor** (owns `skills/war/assets/workflow-template.js`, `workflow-template.engine-1.test.mjs`, `workflow-template.test-harness.mjs`). deps: 1.1, because the census pins import 1.1's exports. #2551 (D3): add `when`; add the fixture beside `provenance floor: stoplist fallback logs and still fires`. #1760: re-run the `bare-interpolation census` pins; update the harness hand-scan record (class (a) closed, class (b) pinned, dated). Keep the two D1 marker lines byte-unchanged.
  - Sweep: `grep -n "'release', 'follow'" skills/war/assets/*.js skills/war/assets/*.mjs` for any copied stoplist. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **Task 1.3 — stager** (owns `skills/war/assets/stage-workflow.mjs`, `stage-workflow.test.mjs`, `skills/war/references/staged-script.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md`). #2345 (D10), #2377 row 3 (D11). Write the sidecar after `fs.writeFileSync(stagedPath, staged)`; peel `--discard-injections` beside the `--force` filter. Flip arm (g) to seed a valid sidecar; add arms `(t) --force over a hand-edited file exits 1 naming --discard-injections`, `(t) --force with no sidecar exits 1`, `(t) --discard-injections overwrites`, `(t) every write leaves a matching sidecar`. Amend ADR 0037 decision 3 (dated line). In `staged-script.md`: reword the Reuse-floor `--force` loss sentence, widen the preflight exit-1 sentence to cover a provenance refusal, add the linked-worktree note.
  - Sweep: `grep -n -- '--force' skills/war/references/staged-script.md docs/adr/0037-run-scoped-staged-phase-scripts.md skills/war/assets/stage-workflow.mjs`; fix each sentence that says `--force` always overwrites. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **Task 1.4 — Lead doctrine** (owns `skills/war/SKILL.md`, `skills/war/references/schemas.md`). #1778 (D9) in the Args-complete preflight paragraph. #1896 / #2377 row 1 (D4): one clause in Decompose step 5 with the pointer `when stamping a row's provenance, read references/schemas.md`. The `schemas.md` provenance-floor row gains the D4 stamp forms, the no-wrap warning, and one sentence that the preflight runs the same floor.

**Phase 2 — release bump.** One task bumps the four slots (`plugin.json`, `marketplace.json` twice, `README.md` `## Status`) plus CHANGELOG; next free patch resolved at land time (verified: CLAUDE.md Releasing at 35aa4144).

## 5. Surface changes

Phase 1: `skills/war/assets/assert-args-complete.mjs`, `assert-args-complete.test.mjs` (1.1); `skills/war/assets/workflow-template.js`, `workflow-template.engine-1.test.mjs`, `workflow-template.test-harness.mjs` (1.2); `skills/war/assets/stage-workflow.mjs`, `stage-workflow.test.mjs`, `skills/war/references/staged-script.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md` (1.3); `skills/war/SKILL.md`, `skills/war/references/schemas.md` (1.4).
Phase 2: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`.

| File | This spec's phase | Sibling spec that also edits it | Lands first |
|------|-------------------|---------------------------------|-------------|
| `skills/war/assets/workflow-template.js` | P1 (1.2) | auditor-and-worker-guard-habits, engine-recovery-relaunch-and-land, engine-findings-ace-and-late-fix, model-routing-and-prompt-byte-budgets, engine-comment-and-duplication-tidy (in that order) | this spec |
| `skills/war/assets/assert-args-complete.mjs` | P1 (1.1) | engine-recovery-relaunch-and-land (#2495) | this spec |
| `skills/war/SKILL.md` | P1 (1.4) | guard, recovery, doc-truth, tests and pipeline groups | this spec |

## 6. New domain terms (GLOSSARY.md)

- **Staged-script sidecar** — `<staged>.sha256`, read by `--force` to detect injected stages.
- **Provenance stamp** — the D4 `planFile` field or appended report path that makes a row pass the #1413 own-token floor.

## 7. Recommended ADRs

- Amend ADR 0037 decision 3: `--force` refuses on a differing or missing sidecar; `--discard-injections` is the explicit loss path.
- No new ADR for D1 [assumed: it implements the existing belt-and-suspenders preflight contract — if wrong: the marker coupling deserves its own ADR].

## 8. Open risks / implementation notes

- D1 couples the preflight to two template code lines. Siblings must keep them.
- D1's copied bindings can drift; the byte-equality test catches it.
- D6: a quote or backtick inside a regex literal can fool a string-skipper. Fixtures must include one, and the real-template census must be unchanged.
- D10 flips arm (g) and any other fixture that runs `--force` over a sidecar-less file; check every `'--force'` call site in `stage-workflow.test.mjs`.
- D3 may fire the #1767 basename fallback for a slug like `done-when-*` whose other words are stoplisted. That is the intended stricter result.

## 9. Non-goals / deferred

- #1763: claimed, no code (D5); closes with pointers.
- #1760 "no recorded hand-scan result": already fixed by the harness record; only classes (a) and (b) are in scope.
- #2377 row 2: fixed by `normRef` (#452, #2329).
- #2345's `--reapply`, the red-team row format (D4), and narrowing #1666 vouching: deferred.

## 10. Validation criteria

1. WHEN args hold one token-less prose adjudication string row THE preflight SHALL exit 1 naming `args.adjudications` and the token list · check: `node --test --test-name-pattern='provenance mirror' skills/war/assets/assert-args-complete.test.mjs` prints `# pass 5` and `# fail 0`.
2. WHEN that row carries a D4 stamp THE preflight SHALL exit 0 · check: same run lists `ok` for `provenance mirror: planFile-stamped row exits 0`.
3. WHEN the floor markers are absent THE preflight SHALL exit 2 · check: same run lists `ok` for `provenance mirror: missing floor markers exit 2`.
4. WHEN a `--args` staged copy embeds prose with pt backticks THE field set SHALL equal the shipped template's · check: `node --test --test-name-pattern='EMBEDDED_ARGS prose' skills/war/assets/assert-args-complete.test.mjs` prints `# pass 1` and `# fail 0`.
5. WHEN pt plus a backtick sits in a string or comment THE tokenizer SHALL open no span · check: `node --test --test-name-pattern='opens no span' skills/war/assets/assert-args-complete.test.mjs` prints `# pass 1`.
6. WHEN a fixture interpolates `${tasks[0].id}` fallback-free THE extractor SHALL map it to `tasks[].id` · check: `node --test --test-name-pattern='bracket-indexed' skills/war/assets/assert-args-complete.test.mjs` prints `# pass 1`.
7. WHEN the real template is censused THE census pins SHALL pass · check: `node --test --test-name-pattern='bare-interpolation census' skills/war/assets/workflow-template.engine-1.test.mjs` prints `# pass 2` and `# fail 0`.
8. WHEN a slug's only non-stoplisted word is `when` THE floor SHALL not accept `when` as provenance · check: `node --test --test-name-pattern='provenance floor' skills/war/assets/workflow-template.engine-1.test.mjs` prints `# fail 0` and lists the new `when` fixture as `ok`.
9. WHEN `--force` meets a file whose bytes differ from its sidecar THE stager SHALL exit 1 naming `--discard-injections`, file untouched · check: `node --test --test-name-pattern='\(t\)' skills/war/assets/stage-workflow.test.mjs` prints `# pass 4` and `# fail 0`.
10. WHEN a Lead reads the safe-invocation clause THE clause SHALL forbid double-quoted and unquoted-heredoc forms · check: `grep -n 'double-quoted' skills/war/SKILL.md` prints the Args-complete preflight line, and `grep -c 'unquoted' skills/war/SKILL.md` prints at least `1`.
11. WHEN a Lead reads Decompose step 5 THE step SHALL name the stamp · check: `grep -n 'planFile' skills/war/SKILL.md` prints a Decompose step 5 line.
12. WHEN SKILL.md is edited THE file SHALL not grow · check: `wc -c < skills/war/SKILL.md` prints at most `64911`.
13. WHEN a Lead reads `staged-script.md` THE doc SHALL cover the linked-worktree copy and the refusal · check: `grep -c 'linked worktree\|--discard-injections' skills/war/references/staged-script.md` prints at least `2`.
14. WHEN Phase 1 lands THE repository gate SHALL be green · check: `node skills/war/assets/repo-gate.mjs` exits 0 and its summary prints zero failed suites.
