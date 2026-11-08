# Shell floors, tests and lint — harden the merge-path floors and provisioning scripts, tighten the drift-guard tests, and run the engine suites staged in the repo gate

dependsOn: the sibling specs `docs/specs/2026-11-08-doc-truth-drift-and-adr-hygiene-design.md`, `docs/specs/2026-11-08-pipeline-skills-and-memory-tooling-design.md` and `docs/specs/2026-11-08-engine-comment-and-duplication-tidy-design.md` land first. The last one is the tail of the `skills/war/assets/workflow-template.js` chain, so this spec's single engine phase (Phase 4) rides after the whole engine chain (see §5).

Issues addressed (all 33): #1732, #1733, #1734, #1824, #1825, #1826, #1827, #1833, #1834, #1835, #1836, #1837, #1839, #1958, #2004, #2089, #2092, #2121, #2143, #2144, #2172, #2173, #2185, #2228, #2245, #2256, #2266, #2276, #2288, #2346, #2380, #2658, #2663.

Partly claimed (see §9): #1837 (items 2 and 3 only; item 1 landed in PR #2568), #2380 (the null-testPattern row only), #1836 and #2266 (the live remainder only).

## 1. Context — the gap / problem

This group is section G of the #2560 fix order plus newer test gaps (verified: issue #2560 (2026-11-01)). The unrun plan `docs/plans/2026-09-06-shell-floors-guards-and-provisioning.md` already designed part of it in rows D10, D13–D16, D19 and D20 (verified: that plan's `## Resolved design tree` at 35aa4144); its tasks 1.2, 1.3 and 5.1 are struck per #2560. This spec reuses those rows where they still fit. Five areas follow.

**A. Merge-path floors fail open on shapes nobody fixtured.**

- The budget-raise floor reads values with `sed -nE "s/.*${field}:[[:space:]]*([0-9]+).*/\1/p"`, which stops at the first non-digit. `100_000` reads as `100`, so a raise reads as a lowering and the floor exits 0 with no `Budget-Raise` trailer (verified: issue #1732 (2026-08-26); `classify_lines` in `skills/war/assets/assert-budget-raise-cited.sh` at 35aa4144).
- The floor diffs only a hardcoded `BUDGET_FILE` path and exits 0 when that diff is empty. Fixtures build their own file, so a real-tree rename goes unseen (verified: issue #1733 (2026-08-26); `BUDGET_FILE=` and `if [ -z "$touched" ]` at 35aa4144).
- A raise counts only for keys on both sides: "Only-in-new ... and only-in-old ... are not raises". A rename plus raise in one commit slips through (verified: issue #1734 (2026-08-26); the `Raise detection` header at 35aa4144).
- `assert-issues-filed.sh` retries an `unknown flag: --reason` close as `gh issue close "$_n" --comment ...`. A gh that old likely rejects `--comment` too, so the retry exits 2 and the epic stays open (verified: issue #1833 (2026-08-27); that arm at 35aa4144). `(led.phases || []).find(...)` throws on an object-keyed `phases` and exits 2 (verified: issue #1837 (2026-08-27) item 3; that line at 35aa4144).
- `assert-guard-specificity-in-diff.sh` records a die message's static prefix but still demands the ENTIRE prefix in a test line, so a unique partial assertion reads uncovered; the `\$` arm has no fixture (verified: issue #1834 (2026-08-27); the `extract_msg` header at 35aa4144). `die "$file not found"` appears only in comments (verified: issue #1835 (2026-08-27)). The script header still claims the case-28 precedent is honored (verified: issue #1836 (2026-08-27); the `case-28` header lines at 35aa4144); the other two comments were fixed in d3008ecd.
- `assert-done-when.sh` runs `bash "$cmd_file_abs"` with no gate preamble. A bare `pytest` exited 127 where the gate used a conda interpreter, and a green task went `held:escalation` (verified: issue #1837 (2026-08-27) item 2; that line at 35aa4144).
- In `campaign-ledger.mjs` `record`, a bare `--backstops` parses to `true` and is stamped; `aggregateBackstops` then skips the plan (`if (!Array.isArray(p.backstops)) continue`), so the wrap-up shows `None` (verified: issue #1827 (2026-08-27); `update.backstops = JSON.parse(args.backstops)` at 35aa4144).
- `assert-test-in-diff.sh` defaults to `pattern_mjs="skills/**/*.test.mjs"`, this plugin's layout (verified: at 35aa4144). On a fresh repo the `--afk` sanity floor rejects a correct proposal, which is re-checked only at the next phase launch. A one-phase plan held its first task after three approvals and a green `npm test` (verified: issue #2380 (2026-10-17); `skills/war/references/setup.md` § Per-phase pending-proposal re-check at 35aa4144).

**B. Provisioning has unfixtured arms and does not make submodules ready.**

- The four `env-error:*` branches are covered only by `grep -Fq 'detected "env-error:' "$SCRIPT"` (verified: issue #1824 (2026-08-27); `provision-worktrees.test.sh` at 35aa4144).
- The awk reject branch (`bad == "" { bad = $0 }`, `[ -z "$h_bad" ] || h_shape=0`) has no fixture, and a failed `\034` decode falls through to `git submodule update --init --force` (verified: issue #1825 (2026-08-27); `reuse_hygiene_one` at 35aa4144).
- `env-error:staged-del-read-rc=$h_rc` and three siblings carry a second `=`, against the header's "splits cleanly on key=value boundaries" (verified: issue #1826 (2026-08-27); `hygiene_marker` header at 35aa4144).
- In `cmd_ensure_refinery_worktree` the (c) re-attach `reuse_hygiene` call runs after the (d) `-uno` dirty probe, which dies first on a corrupted submodule. No test reaches (c) (verified: issue #1839 (2026-08-27); the (b)/(c)/(d) arms at 35aa4144).
- Worktrees come from plain `git worktree add`, so submodule dirs are empty and gates fail at collection; five recurrences (verified: issue #2346 (2026-09-29)). Neither `provision-worktrees.sh` nor `assert-done-when.sh` checks submodule readiness (verified: `grep -n submodule` at 35aa4144).

**C. Drift guards are vacuous, fail open, or bound the wrong region.**

- D43 binds three re-entry-boundary homes; ADR 0013 ratifies four, the fourth being the `schemas.md` `aced:` comment (verified: issue #1958 (2026-08-31); the D43 `HOMES` array in `skill-doc-contracts.test.mjs` at 35aa4144).
- `runManifestMd.match(/^## Relaunch[\s\S]*$/m)` runs to end of file; the sibling stops at the next `## `. Relaunch is the last H2 today (verified: issue #2121 (2026-09-07); at 35aa4144).
- The ADR 0013 Decision 4 assert slices from byte 0 to `## Considered options`. Its regex now keys on a Decision-4-only phrase, but the slice is still not by construct (verified: issue #2266 (2026-09-08); at 35aa4144).
- The roster pin's comment calls `design.md` §4 step 3 "the sole prose home" of the lens list; `README.md`'s Audits bullet and `design.md` row 16 also list it, unpinned (verified: issue #2276 (2026-09-08); at 35aa4144).
- The D20 `RELEASE_SLOT_FILES` key matches the blockquote's first line, so it passes if the "Release-slot eligibility by literal" sentence drops the token (verified: issue #2288 (2026-09-09); `skills/war/references/disposition-eligibility.md` at 35aa4144).
- `QUALIFIED_HEADERS` in `reference-link-integrity.test.mjs` is a hand list that "only ever grows" (verified: issue #2089 (2026-09-06); at 35aa4144). The owner's comment counts six fail-open hand lists and prefers "a single shared list of SKILL.md eviction destinations read by every union scan, or a D33-style directory-scan census per scan" (verified: issue #2089 operatorRuling (2026-11-06)). `EVICTION_DESTINATIONS` in `skills/_shared/doc-cli-consistency.test.mjs` already default-denies by `readdirSync` (verified: at 35aa4144).
- A comment says the refiner-recovery.md link census is "exact-four" and "must not grow"; the assert is 5 (verified: issue #2172 (2026-09-08); at 35aa4144).
- `EVICTED_2115` has four digest rows and none for `## Land-barrier endstate-check steps` (verified: issue #2173 (2026-09-08); `assert.equal(EVICTED_2115.length, 4` at 35aa4144).
- `ctl 8`'s label `lacks_doc_i/lacks_char_i` supersets `ctl 9`'s `lacks_char_i` (verified: issue #2092 (2026-09-06); `skills/war-strategy/war-strategy-structure.test.sh` at 35aa4144 — no `assets/` segment, unlike the group's primaryFiles entry).
- No guard checks a Status blurb's categorical claim ("every other change in the window is ..."), which has omitted file classes three times (verified: issue #2004 (2026-09-03)). The repo has no release tags and today's blurb has no categorical sentence (verified: the tag list and `README.md` `## Status` at 35aa4144).

**D. Engine test-file nits and a missing gate-site census.**

- `corroborators || []` admits an absent field `parkAsk` cannot produce (verified: issue #2143 (2026-09-07); `workflow-template.engine-1.test.mjs` at 35aa4144). A fixture comment credits `normalizeFinding` alone, though `parkAsk` also runs `aceRelPath` (verified: issue #2144 (2026-09-07)). A census title names `seats/merged` but the assert pins four keys (verified: issue #2245 (2026-09-08); at 35aa4144).
- Harness: "the four pt-built module consts" carries a count word (verified: issue #2185 (2026-09-08)); the `CITE_ARGS` comment has a 142-character line (verified: issue #2228 (2026-09-08)); `esSeatPromptFor` copies `esTransportPrompt`'s phase literal (verified: issue #2256 (2026-09-08); all three in `workflow-template.test-harness.mjs` at 35aa4144).
- Nothing enumerates the dispatches that run `plan.gate`, so a new site without `backgroundGateRule` passes every fixture (verified: issue #2658 (2026-11-08)). The engine has 21 non-comment `${plan.gate}` interpolations (verified: grep at 35aa4144).

**E. The gate never runs the engine suites staged.** The engine suites run the staged script only under `WAR_TEMPLATE_STRIPPED=1`, read only by the harness's `STAGED_RUN`; `repo-gate.mjs` never sets it (verified: issue #2663 (2026-11-08); `run('gate(node)', ...)` in `skills/war/assets/repo-gate.mjs` at 35aa4144). `stage-workflow.test.mjs` says every engine test already passes staged (verified: at 35aa4144).

## 2. Pivotal constraints

1. Floor exit contract: 0 pass, 1 the named route, 2 git or env error. Exit 2 never collapses into the floor status (verified: CLAUDE.md § Enum discipline at 35aa4144). A new submodule-not-ready signal in a floor is exit 2, never exit 1.
2. Floor discovery patterns mirror `resolveGate` in `war-config.mjs` (verified: CLAUDE.md § Guard architecture at 35aa4144). The `--pending-pattern` change in D12 leaves the default patterns unchanged.
3. Shell tests stay bash 3.2 safe and cwd-independent (verified: CLAUDE.md § Commands at 35aa4144).
4. One owner of `skills/war/assets/workflow-template.js` per phase. A dispatched refiner prompt change lands with `agents/war-refiner.md` in the same commit (verified: CLAUDE.md § Execution architecture at 35aa4144).
5. New workflow-template test code follows the harness header and `runForm` rules (verified: group contentionNotes; the harness header at 35aa4144). This spec adds no new `workflow-template.*.test.mjs` file (D17), so the harness file list is unchanged.
6. A new Lead-built pt field carries a `?? null` fallback [assumed: an undefined fallback-free field still dispatches zero workers, as a memory lesson says — if wrong: the fallback only adds safety].
7. Doctrine placement follows ADR 0042: new prose goes to `references/` with a `when <trigger>, read references/<file>` pointer. `skills/war/SKILL.md` is 64,911 B (verified: `wc -c` at 35aa4144).
8. Tests that pin engine prose land last, after the engine chain, so they pin final text (verified: group rationale).
9. OD-3 (ruled 2026-09-06) binds D5: a named constant `ANCHORED_PREFIX_MIN` = 16, a test row asserting 16, and lowering it cites #1834 (verified: D19 of `docs/plans/2026-09-06-shell-floors-guards-and-provisioning.md` at 35aa4144).
10. #2089 owner ruling: one shared destination list, or a directory-scan census per scan (verified: issue #2089 operatorRuling, 2026-11-06).
11. #1837 owner ruling: item 1 landed in PR #2568; items 2 and 3 stay open (verified: issue #1837 operatorRuling, 2026-11-02).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Budget-raise value shape (#1732) | Default-deny. Any `hard:`/`advisory:` value token that does not match `^[0-9]+$` makes its row UNKEYED and raise-suspect, so the floor demands a `Budget-Raise` trailer. Fixtures for `100_000`, `0x13880`, `1e5` (verified: D15 of the 2026-09-06 plan at 35aa4144) [assumed: rejecting is better than parsing JS literals in bash — if wrong: a full parser in awk, a bigger diff with the same fixtures]. |
| D2 | Budget file path binding (#1733) | A real-tree parity case in `assert-budget-raise-cited.test.sh`: it extracts the `BUDGET_FILE` literal from the script and asserts that `git ls-files --error-unmatch` finds it at the repo root. It follows `assert-test-in-diff.test.sh` case 10's idiom (verified: issue #1733 (2026-08-26)). |
| D3 | Rename plus raise (#1734) | When one diff has an only-in-new key and an only-in-old key in the same field, the floor treats the new key as raise-suspect if its value exceeds the largest deleted value (verified: D15 of the 2026-09-06 plan at 35aa4144). The `Raise detection` header is rewritten to say this. |
| D4 | Issues-filed robustness (#1833, #1837 item 3) | On `unknown flag: --comment` in the degraded retry, a second tier runs bare `gh issue close "$_n"` and then a separate `gh issue comment`. Each tier prints `gh-degraded`; a stub mode `GH_OLDER_CLOSE=1` rejects both flags. `phases` may be an array or an id-keyed object, the latter with a stderr deprecation note (verified: D14 of the 2026-09-06 plan at 35aa4144) [assumed: gh `issue comment` exists on any gh that lacks `--comment` on close — if wrong: the second tier closes without the comment and logs that it dropped it]. |
| D5 | Guard-specificity coverage (#1834, #1835, #1836) | OD-3 as ruled: a guard is covered when a test line holds the recorded static prefix OR a leading substring of it at least `ANCHORED_PREFIX_MIN` = 16 bytes long. New cases: 17f (a `\$`-ending prefix), 17g (`die "$file not found"`), and a long-prefix pair (a 16-byte leading substring covers, a 15-byte one does not), plus a row asserting the constant is 16. The header's case-28 ceiling comment is rewritten to state the real rule (verified: D19 of the 2026-09-06 plan at 35aa4144). |
| D6 | Campaign ledger `--backstops` (#1827) | `--backstops` joins the typeof-string refusal loop (one stderr line, exit 1 before `record()`), and the parsed value must be an array (verified: issue #1827 (2026-08-27); D16 of the 2026-09-06 plan at 35aa4144). The plan's `collectBlocks` half (#2090) is not in this group and is left out (§9). |
| D7 | Hygiene fixtures (#1824, #1825, #1826, #1839) | Behavioral rows replace the presence grep: (a) a mode-000 submodule index gives `env-error:*`, never `unrecognized-dirt` (`SKIP env-error fixture: running as root` at uid 0); (b) staged deletions plus a foreign untracked file give `detected unrecognized-dirt` and no `action=repaired`; (c) RG.4b: a refinery worktree clean under `-uno` on a prior branch with a differing gitlink re-attaches and emits `detected sha-mismatch`, so the (c) call is kept and reached. The `hygiene_marker` header says "splits on the FIRST `=` of each token"; emitted bytes stay the same (verified: D10 of the 2026-09-06 plan at 35aa4144) [assumed: RG.4b's shape is reachable as the plan's grill claimed — if wrong: delete the (c) `reuse_hygiene` call and its comment, the issue's other named fix]. |
| D8 | Submodule-ready worktrees (#2346) | New verb `provision-worktrees.sh assert-submodules-ready <worktree>`: a no-op without `.gitmodules`; otherwise any `-` line in `submodule status --recursive` prints `SUBMODULES_UNINITIALIZED <path>...` and exits a new `EX_SUBMODULES=9`. `cmd_ensure_worktree` and `cmd_ensure_refinery_worktree` init (`submodule update --init --recursive`) when a `-` line exists, then call the verb, so a failed init dies and the barrier routes env-blocked. `assert-done-when.sh` calls the verb first and exits 2 on failure, never 1 (verified: issue #2346 (2026-09-29)) [assumed: init at provision time, not assert alone — if wrong: drop the init and keep the fail-closed assert, so operators add a `run.provision` step]. [assumed: provisioning covers every gate site, so the engine's merge-gate and End-state prompts need no new call — if wrong: add the call to those prompts and to the refiner card in Phase 4's engine task]. |
| D9 | Done-when interpreter (#1837 item 2) | New `overrides.doneWhenPreamble` (string or null) in `war-config.mjs` `KNOWN_OVERRIDES`, defaults and validator. When set, the merge-task staging writes `<preamble>` newline `<cmd>` into the cmd file. When the floor exits 127 it names the knob in its diagnostic. With the knob absent, staged bytes are unchanged. The doctrine goes to `skills/war/references/setup.md`. `/war-room` asks for it the way it asks for `testPattern`. ADR 0044 gets one in-place sentence plus a Decision-log line (verified: D13 of the 2026-09-06 plan at 35aa4144) [assumed: the cmd file is staged by the refiner from a prompt line, so the preamble join needs the D12 engine task to thread it — if wrong: staging is floor-side and Phase 4 drops that clause]. |
| D10 | ctl label (#2092) | `ctl 8`'s label becomes `r8_doc_or_char`, and a guard comment beside `ctl 9` names the superset trap (verified: D20 of the 2026-09-06 plan at 35aa4144). |
| D11 | Hand-kept list censuses (#2089) | Of the two options in the owner's ruling, take the D33-style directory-scan census per scan. Each fail-open list (`QUALIFIED_HEADERS`; D13 and D14 in `skill-doc-contracts.test.mjs`; the three `war-config.test.mjs` lists the owner names) gets a census that reads `readdirSync('skills/war/references')` (or its own scan root), subtracts the list and an explicit exemption table with reasons, and fails on any remainder (verified: issue #2089 operatorRuling (2026-11-06)) [assumed: per-scan census over a shared module — a shared module is a new abstraction four files would import; if wrong: one exported list in a new `skills/war/assets/eviction-destinations.mjs` read by every scan]. |
| D12 | Null testPattern on a fresh repo (#2380) | Re-check the pending proposal at the merge floor. `assert-test-in-diff.sh` gains `--pending-pattern <set>`: when the active pattern matches no diff test file and the pending set matches one, the floor adopts it for that merge, exits 0, and prints `adopted-pending-pattern: <set>`. The engine folds `plan.testPatternPending` (`?? null`) into the existing `testPatternArg` const, so null keeps prompts byte-identical; the refiner card names the flag in the same commit; the Lead adopts the value for later phases; `setup.md` gains the merge-floor arm (verified: issue #2380 (2026-10-17), first fix direction) [assumed: adopt-at-floor, not a new `floor_route` member — if wrong: route the near-miss as a Lead pattern defect, which is an enum change in `land-decision.mjs`, its mirror and the drift guard]. |
| D13 | Drift-guard tightenings | #1958: a fourth `HOMES` row over the `schemas.md` `aced:` comment with its own tail marker; title and header say four; a both-ways scratch-flip proof recorded in the commit body. #2121: bound with `(?=\n## )`. #2266: extract Decision 4 by construct, from `\n4. **Findings route` to `\n5. **`; apply the same extraction to the D17 and Decision 5 asserts that use the byte-0 slice. #2276: widen the pin to `README.md`'s Audits bullet and `design.md` decision row 16, and fix the "sole prose home" comment. #2288: scope the `RELEASE_SLOT_FILES` key to the "Release-slot eligibility by literal" sentence (verified: issues #1958, #2121, #2266, #2276, #2288) [assumed: widening #2276's pin beats correcting only the comment — if wrong: the comment alone changes]. |
| D14 | Reference-link census fixes (#2172, #2173) | #2172: make the comment count-free and point at the assert by construct. #2173: add a fifth `EVICTED_2115` row for `## Land-barrier endstate-check steps` (section body, bytes, sha256) and bump the length assert to 5 (verified: issues #2172, #2173 (2026-09-08)). |
| D15 | Release categorical-scope guard (#2004) | A `version-slots.test.mjs` test. Window: previous version-bump commit to HEAD, via the existing first-parent slot-history reader (no release tags exist). Changed files (`--name-only --no-renames`) map to a closed class table: engine, scripts and floors, hooks, tests, skill prose, agent cards, docs, release slots. When the Status paragraph matches a closed phrase set ("every other change", "all other changes", "the rest of the window"), it must name each class in the window; otherwise the test prints `SKIP categorical-scope: no categorical sentence` (verified: issue #2004 (2026-09-03)) [assumed: that class table and phrase set — if wrong: the plan interview sets the taxonomy, as the issue leaves it open]. |
| D16 | Engine test nits (#2143, #2144, #2245, #2185, #2228, #2256) | Drop `\|\| []`. Name both normalizers in the comment. Retitle the census test with all four stripped keys. Drop the count word "four". Re-wrap the `CITE_ARGS` comment near 98 columns. Fold the two `es*` helpers into one run helper that returns both prompts, and have the compound fixture run the phase once (verified: issues #2143–#2256). |
| D17 | Gate-site census (#2658) | A default-deny static census in `workflow-template.late-defect-4.test.mjs`. It reads `workflow-template.js` as text, finds each non-comment `${plan.gate}` interpolation, and classifies its enclosing dispatch builder as carrying `backgroundGateRule` / `segmentedGateClause` / `aceBgRule`, or as exempt with a reason (polish, terminal, late-fix, `FIX_GATE_RULE` sites). An unclassified site fails the test. Two mutation proofs (drop the rule from one site; add a synthetic site) go in the commit body (verified: issue #2658 (2026-11-08)) [assumed: the census lives in the test file, not as tags in the engine — if wrong: in-engine `// gate-site:` tags, which make Phase 4's engine task own them]. |
| D18 | Staged gate pass (#2663) | `repo-gate.mjs` adds one job: `run('gate(node-staged)', process.execPath, ['--test', ..., 'skills/war/assets/workflow-template.*.test.mjs'], 'node-staged')` with `WAR_TEMPLATE_STRIPPED=1` added to that child's env. `run()` gains an optional env-overlay parameter. The job count becomes `suites.length + 2`; `repo-gate.test.mjs` gets a row; the harness stays the flag's only reader; the lesson gets a dated resolved note (verified: issue #2663 (2026-11-08)) [assumed: a parallel job in the existing pools is acceptable gate wall time — if wrong: run the staged pass after the main pool]. |
| D19 | Old plan supersession | `docs/plans/2026-09-06-shell-floors-guards-and-provisioning.md` gets one header line naming this spec as superseding its tasks for this group's issues [assumed: a note, not a deletion — if wrong: `/aftermath` retires the plan instead]. |
| D20 | Release | Own trailing phase: the four version slots move together (verified: CLAUDE.md § Releasing at 35aa4144). |

## 4. Mechanics

Phases 1–3 touch no engine file. Phase 4 holds the only `workflow-template.js` owner. Parallel tasks in a phase are file-disjoint.

### Phase 1 — Merge-path floors, ledger, ctl label, hygiene fixtures (no engine change)

- **T1.1 budget-raise floor (D1–D3).** Files: `skills/war/assets/assert-budget-raise-cited.sh`, `skills/war/assets/assert-budget-raise-cited.test.sh`. New fixtures: three numeric forms, a key rename plus raise, a key rename plus lowering (control, exit 0), and the real-tree path parity case. Prove each fixture red by reverting its arm.
- **T1.2 issues-filed (D4).** Files: `skills/war/assets/assert-issues-filed.sh`, `skills/war/assets/assert-issues-filed.test.sh`. New stub mode; fixtures for both degraded tiers and for an object-keyed `phases` ledger.
- **T1.3 guard-specificity (D5).** Files: `skills/war/assets/assert-guard-specificity-in-diff.sh`, `skills/war/assets/assert-guard-specificity-in-diff.test.sh`. Run `grep -n 'case-28' skills/war/assets/assert-guard-specificity-in-diff.sh skills/war/assets/assert-guard-specificity-in-diff.test.sh` and fix every match that claims the precedent is honored. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **T1.4 campaign ledger (D6).** Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`. Rows: a bare `--backstops` refuses, exit 1, and stamps nothing; a non-array JSON value refuses.
- **T1.5 ctl label (D10).** File: `skills/war-strategy/war-strategy-structure.test.sh`.
- **T1.6 hygiene fixtures (D7).** Files: `skills/war/assets/provision-worktrees.sh` (header comment only, or the (c) call deletion if the D7 fallback fires), `skills/war/assets/provision-worktrees.test.sh`. The presence grep row goes.
- **T1.7 old-plan note (D19).** File: `docs/plans/2026-09-06-shell-floors-guards-and-provisioning.md`.

### Phase 2 — Submodule-ready worktrees and the done-when preamble

- **T2.1 provisioning verb (D8).** Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`. Fixtures: no `.gitmodules` gives exit 0 and no output; an uninitialized submodule after `ensure-worktree` ends initialized; an init that cannot reach its URL dies with `EX_SUBMODULES` and the `SUBMODULES_UNINITIALIZED` marker; the refinery arm does the same. Fixtures use local file-URL submodules only.
- **T2.2 done-when floor and knob (D8 floor half, D9), `deps: [T2.1]`.** Files: `skills/war/assets/assert-done-when.sh`, `skills/war/assets/assert-done-when.test.sh`, `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war/references/setup.md`, `skills/war-room/SKILL.md`, `skills/war/SKILL.md` (one trigger pointer only: `when overrides.doneWhenPreamble is set, read references/setup.md`), `docs/adr/0044-authoring-contract-and-merged-artifact.md`. Fixtures: an uninitialized submodule makes the floor exit 2, never 1; exit 127 names `doneWhenPreamble`; a null knob leaves the cmd file byte-identical.

### Phase 3 — Drift-guard, census and gate tests (no engine change)

- **T3.1 doc-contract tests (D11 for D13/D14, D13).** File: `skills/war/assets/skill-doc-contracts.test.mjs`. Covers #1958, #2121, #2266, #2276, #2288, and the D13/D14 censuses of #2089. Run `grep -n "slice(0, " skills/war/assets/skill-doc-contracts.test.mjs` and convert every byte-0 ADR slice that an assert relies on to a by-construct extraction. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **T3.2 reference-link tests (D11 for QUALIFIED_HEADERS, D14).** File: `skills/war/assets/reference-link-integrity.test.mjs`. Run `grep -nE '\b(two|three|four|five|six)\b' skills/war/assets/reference-link-integrity.test.mjs` restricted to comment lines, and make each count word that a later diff can falsify count-free. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **T3.3 war-config list censuses (D11).** File: `skills/war/assets/war-config.test.mjs`. The three lists the owner's comment names (scope-hook-glob OLD-absent, docs/learnings servitor-target, retirement-sweep).
- **T3.4 release categorical guard (D15).** File: `skills/war/assets/version-slots.test.mjs`. A synthetic repo proves it red.
- **T3.5 staged gate pass (D18).** Files: `skills/war/assets/repo-gate.mjs`, `skills/war/assets/repo-gate.test.mjs`, `docs/learnings/the-staged-form-execution-run-is-not-in-the-repo-gate.md`.
- **T3.6 test floor pending pattern (D12 floor half).** Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`. Fixtures: null pattern plus a pending set matching the diff gives exit 0 and the `adopted-pending-pattern:` line; a pending set matching nothing keeps exit 1; no flag keeps today's output byte-for-byte.

### Phase 4 — Engine threading and engine-test tidy (single engine owner)

- **T4.1 engine plus card plus prose (D12 engine half, D9 staging if the D9 assumption holds).** Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/references/setup.md`, `skills/war/SKILL.md` (only if the pending-proposal bullet's "re-checked ... at each phase launch" wording must name the merge floor). Run `grep -n 'testPatternArg' skills/war/assets/workflow-template.js` and confirm every floor call site reads the widened const. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **T4.2 engine test tidy plus D12 fixture, `deps: [T4.1]`.** Files: `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`. Covers #2143, #2144, #2245, #2185, #2228, #2256, plus a fixture: a `testPatternPending` value reaches every merge-task floor line, and null leaves the prompt byte-identical. Run `grep -nE '\b(two|three|four|five|six)\b' skills/war/assets/workflow-template.test-harness.mjs` over comment lines and make each count word count-free where the members are listed. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
- **T4.3 gate-site census (D17), `deps: [T4.1]`.** File: `skills/war/assets/workflow-template.late-defect-4.test.mjs`. Run `grep -n '\${plan\.gate}' skills/war/assets/workflow-template.js` and classify every non-comment match in the census table. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.

### Phase 5 — Release

- **T5.1 version bump.** Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (both slots), `README.md` `## Status` (replace in place). Resolve the next free patch from the slots at land time. Run the README Status-blurb checklist; with D15 landed, the guard checks any categorical sentence.

## 5. Surface changes

Paths under `skills/war/assets/` are written as `assets/`.

**Phase 1:** `assets/assert-budget-raise-cited.sh` + `.test.sh`, `assets/assert-issues-filed.sh` + `.test.sh`, `assets/assert-guard-specificity-in-diff.sh` + `.test.sh`, `assets/provision-worktrees.sh` + `.test.sh`, `skills/war-campaign/assets/campaign-ledger.mjs` + `.test.mjs`, `skills/war-strategy/war-strategy-structure.test.sh`, `docs/plans/2026-09-06-shell-floors-guards-and-provisioning.md`.

**Phase 2:** `assets/provision-worktrees.sh` + `.test.sh`, `assets/assert-done-when.sh` + `.test.sh`, `assets/war-config.mjs` + `.test.mjs`, `skills/war/references/setup.md`, `skills/war-room/SKILL.md`, `skills/war/SKILL.md`, `docs/adr/0044-authoring-contract-and-merged-artifact.md`, `docs/adr/0021-run-lifecycle-provision-contract.md`, `GLOSSARY.md`.

**Phase 3:** `assets/skill-doc-contracts.test.mjs`, `assets/reference-link-integrity.test.mjs`, `assets/war-config.test.mjs`, `assets/version-slots.test.mjs`, `assets/repo-gate.mjs` + `.test.mjs`, `assets/assert-test-in-diff.sh` + `.test.sh`, `docs/learnings/the-staged-form-execution-run-is-not-in-the-repo-gate.md`.

**Phase 4:** `assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/references/setup.md`, `skills/war/SKILL.md` (conditional), `assets/workflow-template.engine-1.test.mjs`, `assets/workflow-template.test-harness.mjs`, `assets/workflow-template.late-defect-4.test.mjs`, `docs/adr/0006-deterministic-test-floor.md`.

**Phase 5:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`.

Read only: `assets/stage-workflow.test.mjs`, `assets/prompt-surface-budgets.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, and the reference docs and ADR that the Phase 3 tests extract from.

Contention with sibling specs:

| File | This spec's phase | Sibling spec that also edits it | Lands first |
|------|-------------------|---------------------------------|-------------|
| `skills/war/assets/skill-doc-contracts.test.mjs` | 3 | doc-truth-drift-and-adr-hygiene; pipeline-skills-and-memory-tooling | siblings (verified: group contentionNotes; pipeline spec §5 table at 35aa4144) |
| `skills/war/assets/reference-link-integrity.test.mjs` | 3 | doc-truth-drift-and-adr-hygiene; pipeline-skills-and-memory-tooling; model-routing-and-prompt-byte-budgets | siblings (verified: group contentionNotes; model-routing spec §5 table at 35aa4144) |
| `skills/war/assets/workflow-template.engine-1.test.mjs`, `workflow-template.test-harness.mjs` | 4 | engine-comment-and-duplication-tidy | sibling (verified: group contentionNotes; that spec's §5 table at 35aa4144) |
| `skills/war/assets/workflow-template.js` | 4 | the whole engine chain, tail engine-comment-and-duplication-tidy | siblings (verified: group contentionNotes) |
| `skills/war/assets/provision-worktrees.sh` | 1, 2 | engine-recovery-relaunch-and-land (read only) | either (verified: that spec's §5 table at 35aa4144) |
| `skills/war/SKILL.md` | 2, 4 | doc-truth-drift-and-adr-hygiene; pipeline-skills-and-memory-tooling; args-floor-and-launch-preflight | siblings; this spec is the last edit (verified: group contentionNotes; pipeline spec §5 table at 35aa4144) |
| `agents/war-refiner.md` | 4 | engine chain specs | siblings [assumed: at least one engine-chain spec edits the card — if wrong: no ordering cost] |

## 6. New domain terms (GLOSSARY.md)

- **assert-submodules-ready** — the `provision-worktrees.sh` verb that fails a worktree whose submodules are not initialized. It exits `EX_SUBMODULES` and prints `SUBMODULES_UNINITIALIZED`. It is a no-op without `.gitmodules`.
- **`overrides.doneWhenPreamble`** — an optional shell preamble staged before every Done-when command. Null keeps the cmd file byte-identical.
- **Pending test-floor pattern** — a rejected `--afk` test-floor proposal. The Lead re-checks it at each phase launch, and the merge floor can now adopt it through `--pending-pattern`.
- **`ANCHORED_PREFIX_MIN`** — the minimum leading-substring length, 16 bytes, that counts as covering a long-prefix die guard.
- **Staged gate pass** — the repo-gate job that runs the workflow-template suites with `WAR_TEMPLATE_STRIPPED=1`.

## 7. Recommended ADRs

No new ADR. Three in-place Decision-log lines:

- ADR 0044: the Done-when law gains the `doneWhenPreamble` sentence (D9).
- ADR 0021 (run-lifecycle provision contract): provisioned worktrees are submodule-ready or the barrier fails env-blocked (D8) [assumed: ADR 0021 owns the Provision barrier contract — if wrong: the line goes on ADR 0004].
- ADR 0006 (deterministic test floor): the floor may adopt a pending proposal that matches the diff (D12).

## 8. Open risks / implementation notes

- **D8 and the network.** Init in a fresh worktree may clone from the submodule URL. Offline, the task goes env-blocked instead of running and false-redding. Loud over silent is intended; the barrier diagnostic says so.
- **D8 late submodules.** A dep task that adds a `.gitmodules` entry after provisioning is not checked at the merge gate. The done-when floor still exits 2 on it.
- **D12 adoption.** The floor stops being a pure function of config. The stderr marker is the audit trail, and the Lead must copy it into the ledger or the next phase re-rejects the proposal.
- **D15 fragility.** New wording can dodge a phrase trigger. The guard backs up the checklist; it does not replace it.
- **D17 drift.** The engine chain moves gate sites before Phase 4, so the census keys on the enclosing builder name, never a line number or a count in a comment.
- **D18 gate time.** The staged pass reruns about 66 s of suites (verified: the harness header's split table at 35aa4144), inside the existing pool.
- **#2328 rows routed here.** The recovery spec's §9 routes #2328 row 2 (`assert-issues-filed.sh` followUps) and row 6 (`_refinery` path reused across repos) to this group (verified: `docs/specs/2026-11-08-engine-recovery-relaunch-and-land-design.md` at 35aa4144). #2328 is not in this group's list and was not read here, so those rows stay on #2328.
- **Readback retry unproven.** Per the #1837 owner ruling, the PR #2568 retry stays unproven against real lag until a live land.

## 9. Non-goals / deferred

- **#1837 item 1** (land-advance bare exit 3) landed in PR #2568 (verified: issue #1837 operatorRuling (2026-11-02); the `after 2 reads` die in `cmd_land_advance` at 35aa4144). It is not re-done.
- **#2380 rows 2–4.** Row 2 (auditor guard metacharacter denials) corroborates #2001 and #1915, which `auditor-and-worker-guard-habits` claims (verified: that spec's issue list at 35aa4144). Rows 3 and 4 (the host's auto-mode classifier refusing a sanctioned `--force-with-lease`, and the host worktree guard refusing a fix worker's write) are Claude Code host behavior, not plugin code. They stay on #2380, which is claimed here for row 1 only.
- **#1836** — only the script header's case-28 ceiling comment is live. The `extract_msg` and Case 17 comments were fixed in d3008ecd.
- **#2266** — the false green is closed. Only the by-construct extraction remains.
- **The 2026-09-06 plan's other tasks.** The guard tasks (1.1, 2.x, 3.x) belong to the auditor-guard work. The refinery hygiene capture (4.2, #1823) is claimed by `engine-recovery-relaunch-and-land`. The `ptSpans` work (6.2, #1775, #1760) is claimed by `args-floor-and-launch-preflight`. The provenance mirror (7.1) is not in this group. `collectBlocks` (#2090, half of 6.1) is not in this group (verified: sibling spec issue lists at 35aa4144).
- **A shared eviction-destination module** — not built (D11 picks the per-scan census).
- **Parsing JS numeric literals** in the budget floor — not built (D1 rejects them).

## 10. Validation criteria

`A/` below is `skills/war/assets/`. A suite "printing a row" means a passing (`ok`) row with that label and no `not ok` line in the run.

- WHEN a budget value is written as `100_000`, `0x13880` or `1e5` with no `Budget-Raise` trailer THE budget-raise floor SHALL exit 1 · check: `bash A/assert-budget-raise-cited.test.sh` printing three rows labelled `numeric-form`.
- WHEN a key is renamed and raised in one diff THE floor SHALL demand a citation · check: the same suite printing a row labelled `rename-plus-raise`.
- WHEN the `BUDGET_FILE` literal names a path not tracked in the real repo THE parity case SHALL fail · check: `grep -c 'ls-files --error-unmatch' A/assert-budget-raise-cited.test.sh` ≥ 1 and the suite printing `real-tree BUDGET_FILE parity`.
- WHEN gh rejects both `--reason` and `--comment` THE issues-filed floor SHALL close the epic through the second tier · check: `bash A/assert-issues-filed.test.sh` printing a row whose output shows `gh-degraded` twice for one close.
- WHEN the ledger's `phases` is an object keyed by id THE issues-filed floor SHALL read it and print a deprecation note · check: the same suite printing a row labelled `object phases`.
- WHEN a test line holds a 16-byte leading substring of a long die prefix THE guard-specificity floor SHALL count it covered, and a 15-byte one SHALL not · check: `bash A/assert-guard-specificity-in-diff.test.sh` printing rows `17f`, `17g`, the long-prefix pair, and `ANCHORED_PREFIX_MIN=16`.
- WHEN the guard-specificity script header is read THE case-28 ceiling comment SHALL state the anchored-prefix rule · check: `grep -c 'honestly covers it' A/assert-guard-specificity-in-diff.sh` = 0.
- WHEN `record` gets a bare `--backstops` THE ledger SHALL refuse with exit 1 and stamp nothing · check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs` printing a test titled `bare --backstops refuses`.
- WHEN the war-strategy structure output is grepped for `lacks_char_i pattern` THE count SHALL equal pattern 9's lines only · check: `bash skills/war-strategy/war-strategy-structure.test.sh | grep -c 'lacks_char_i pattern'` equal to the `ctl 9` row count, and `grep -c 'r8_doc_or_char' skills/war-strategy/war-strategy-structure.test.sh` ≥ 1.
- WHEN a submodule index is mode 000 THE hygiene arm SHALL emit `env-error:*`, never `unrecognized-dirt` · check: `bash A/provision-worktrees.test.sh` printing an `env-error` row or the line `SKIP env-error fixture: running as root`, and `grep -c "grep -Fq 'detected \"env-error:'" A/provision-worktrees.test.sh` = 0.
- WHEN staged deletions meet one foreign untracked file THE hygiene arm SHALL report `detected unrecognized-dirt` and repair nothing · check: the same suite printing a row containing `unrecognized-dirt`.
- WHEN the refinery worktree re-attaches over a differing gitlink THE (c) arm SHALL emit `detected sha-mismatch` · check: the same suite printing a row labelled `RG.4b`.
- WHEN a worktree with `.gitmodules` is ensured THE submodules SHALL be initialized, or the script SHALL exit 9 with `SUBMODULES_UNINITIALIZED` · check: the same suite printing rows containing `assert-submodules-ready`, and `grep -c 'EX_SUBMODULES=9' A/provision-worktrees.sh` = 1.
- WHEN a Done-when command runs over uninitialized submodules THE done-when floor SHALL exit 2, never 1 · check: `bash A/assert-done-when.test.sh` printing a row containing `SUBMODULES_UNINITIALIZED`.
- WHEN a Done-when command exits 127 THE floor diagnostic SHALL name `doneWhenPreamble` · check: the same suite printing a row containing `doneWhenPreamble`, and `node --test A/war-config.test.mjs` printing a test titled with `doneWhenPreamble`.
- WHEN the active test pattern misses and `--pending-pattern` matches a diff test file THE test floor SHALL exit 0 and print `adopted-pending-pattern:` · check: `bash A/assert-test-in-diff.test.sh` printing a row containing `adopted-pending-pattern`.
- WHEN `plan.testPatternPending` is null THE merge-task prompts SHALL be byte-identical to today's · check: `node --test A/workflow-template.engine-1.test.mjs` printing `testPatternPending null is byte-identical`, and `grep -c 'pending-pattern' agents/war-refiner.md` ≥ 1.
- WHEN the `schemas.md` `aced:` comment loses its fourth-source wording THE D43 guard SHALL fail · check: `node --test A/skill-doc-contracts.test.mjs` printing a title containing `all four living-doc homes`.
- WHEN a section is appended after `## Relaunch` THE T1.2 extraction SHALL stop at it · check: `grep -cF '## Relaunch[\s\S]*$' A/skill-doc-contracts.test.mjs` = 0.
- WHEN ADR 0013 Decision 4's body is deleted THE Decision 4 assert SHALL fail even though the Status block keeps its text · check: `grep -c "indexOf('## Considered options')" A/skill-doc-contracts.test.mjs` = 0.
- WHEN `DEFAULTS.audit.roster` changes THE roster pin SHALL fail on `README.md`'s Audits bullet and `design.md` row 16 as well as §4 step 3 · check: `grep -c 'sole prose home' A/skill-doc-contracts.test.mjs` = 0 and the pin test printing `ok`.
- WHEN the "Release-slot eligibility by literal" sentence drops `RELEASE_SLOT_FILES` THE D20 test SHALL fail · check: `node --test A/skill-doc-contracts.test.mjs` printing a title containing `Release-slot eligibility by literal`.
- WHEN a new file lands under `skills/war/references/` without joining a scan's list or exemption table THE scan's census SHALL fail · check: `node --test A/reference-link-integrity.test.mjs A/skill-doc-contracts.test.mjs A/war-config.test.mjs` printing titles containing `directory-scan census`.
- WHEN the endstate-check steps body in `refiner-recovery.md` is reworded THE eviction census SHALL fail · check: `grep -c 'EVICTED_2115.length, 5' A/reference-link-integrity.test.mjs` = 1 and `grep -c 'exact-four' A/reference-link-integrity.test.mjs` = 0.
- WHEN the Status paragraph carries a categorical sentence that omits a touched class THE version-slots test SHALL fail, and with no such sentence it SHALL print the SKIP token · check: `node --test A/version-slots.test.mjs` printing `SKIP categorical-scope: no categorical sentence` or a passing `categorical-scope` test.
- WHEN the engine test tidy lands THE weak asserts and count words SHALL be gone · check: `grep -c 'corroborators || \[\], \[\]' A/workflow-template.engine-1.test.mjs` = 0 and `grep -c 'the four pt-built' A/workflow-template.test-harness.mjs` = 0.
- WHEN a `${plan.gate}` dispatch site carries neither the background rule nor an exemption row THE gate-site census SHALL fail · check: `node --test A/workflow-template.late-defect-4.test.mjs` printing a title containing `gate-site census`, with both mutation proofs in the commit body.
- WHEN the repo gate runs THE workflow-template suites SHALL also run with `WAR_TEMPLATE_STRIPPED=1` · check: `node A/repo-gate.mjs` printing `gate(node-staged)` and `== gate complete:` with `0 failed`.
- WHEN the staged-pass lesson is updated THE redaction lint SHALL pass · check: `node skills/_shared/war-memory.mjs lint docs/learnings/` exiting 0 with no `FAIL` line.
- WHEN the release phase lands THE four version slots SHALL agree and not go down · check: `node --test A/version-slots.test.mjs` with no `not ok` line.
