# Test-floor pattern threading — operator-declared `overrides.testPattern`, threaded to every floor invocation

## 1. Context — the gap / problem

`assert-test-in-diff.sh`'s default pattern set is deliberately pinned to the WAR **meta-repo's**
gate-discovery set (`skills/**/*.test.mjs`, `**/*.test.sh` — operator decision 2026-06-29, ADR 0006:
the floor mirrors the gate). The script's own header documents `--pattern` as the cross-repo escape
hatch — **but nothing threads it**. There is no config field, and all three invocation surfaces
compose the call bare:

1. the merge-task prompt (`workflow-template.js:648`),
2. the post-ADD_TEST retry prompt (`workflow-template.js:731`),
3. the refiner standing instruction (`agents/war-refiner.md:39`).

Consequence: in any repo whose tests are not `*.test.sh` / `skills/**/*.test.mjs` (Otto: vitest
`*.test.ts`), **every** `requiresTest` merge-task goes red → ADD_TEST fix-worker + full re-audit
sub-loop → the retry invocation is also pattern-less, so it reds again → `no-test:add-test-blocked`
→ HARD escalation. Rounds and escalations burned on every task, regardless of real test presence.

**Verified red/green** (Otto, run `2026-07-07-war-engine-port`, task 1.2, refine-time base
`f3f2b87`): diff contains `apps/engine/src/war/materializer.test.ts`; default pattern → exit 1
(false no-test); `--pattern '*.test.ts'` → exit 0.

```sh
S=…/work-audit-refine/skills/war/assets/assert-test-in-diff.sh
"$S" f3f2b87 war/2026-07-07-war-engine-port/p1-1.2                        # exit 1  (bug)
"$S" f3f2b87 war/2026-07-07-war-engine-port/p1-1.2 --pattern '*.test.ts' # exit 0  (control)
```

The sibling packaging floor (`assert-packaging-in-diff.sh`) is **unaffected** — it is
Dockerfile-analysis, repo-agnostic, and trivially exits 0 with no Dockerfile.

## 2. Pivotal constraints

- **Floor ⊆ gate invariant (ADR 0006).** The floor must never be satisfiable by a test the gate
  ignores. The 2026-06-29 operator decision (default == the meta-repo gate's discovery set,
  superseding the spec §3.1 broad union that red-team proved over-counts) stays closed. A per-repo
  override preserves the invariant **by operator declaration**, not by broadened defaults.
- **Two-surface sync.** The refiner's floor check exists both as a standing instruction
  (`agents/war-refiner.md`) and as dispatched merge-task prompt text (`workflow-template.js`);
  both must carry the override (memory: `standing-instruction-vs-dispatched-prompt-coverage-split`).
- **Prompt-embedded shell.** The pattern value is embedded into a composed command line inside a
  spawned agent's prompt — config-time validation must make injection impossible (charset guard).
- **Byte-identical when absent.** `testPattern: null` must leave every composed prompt
  byte-identical to today (the existing memory/intent absent-⇒-identical idiom); meta-repo runs are
  regression-guarded.
- **Exit-code contract untouched.** The 0/1/2 boundary (and exit-1-vs-2 correctness boundary) is
  not modified; the script needs **zero code changes** — its `--pattern` contract already exists
  and is tested (`assert-test-in-diff.test.sh` Case 6, incl. the noglob regression).
- **Pattern semantics are case-glob.** Matching is bash `case` (fnmatch without `FNM_PATHNAME`):
  `*` crosses `/`, so `*.test.ts` already means `**/*.test.ts` — and `**/*.test.ts` would **miss**
  a root-level test file. Suffix-shaped conventions (`*.test.ts`, `*_test.go`) are trivially
  depth-agnostic; **prefix-shaped conventions need two tokens** — pytest's `test_*.py` matches
  only root-level files and `*/test_*.py` only nested ones, so the correct set is
  `test_*.py */test_*.py` (never `*test_*.py`, which substring-over-matches, e.g.
  `latest_results.py`). The per-language suggestion table (§4, war-room) is the single place this
  dialect is encoded; operators confirm, they don't hand-author from scratch.
- **Sandbox mirror rule.** The Workflow sandbox cannot import `war-config.mjs`; `testPattern`
  needs no mirrored logic (a plain `args` read), so the mirror-inline burden does not grow.

## 3. Resolved design tree

| Decision | Resolution |
| --- | --- |
| Pattern source: auto-derive from gate / extend script defaults / config field | **Config field, threaded.** Auto-derivation is fragile inference (vitest include globs live in N per-package configs); extending defaults re-opens the closed over-count decision. |
| Field location & shape | **`overrides.testPattern: string \| null`** (default `null` = script default). Space-separated glob-set string — 1:1 with the script's `--pattern` contract, one representation end-to-end. Lives in `overrides` beside its conceptual sibling `gate` (the null-means-auto repo-fact family). |
| Validation | Charset guard at `validate()`: non-null ⇒ non-empty, tokens non-empty, chars limited to `A–Z a–z 0–9 * ? . / _ -` plus space (the separator). No quotes, `$`, backticks, `;`, `&`, `\|`, newlines. |
| Threading path | Config → Lead resolves → Workflow args as **`plan.testPattern`** (beside `plan.gate`) → prompt composition. |
| Prompt surfaces | **Three:** merge-task prompt and retry prompt append ` --pattern '<value>'` when set; the **ADD_TEST fixPrompt** gains a clause naming the active floor pattern so the fix-worker's added test satisfies the retry. Absent ⇒ byte-identical. |
| Standing instruction | `agents/war-refiner.md` step 4: run with the `--pattern` override **when the dispatched prompt carries one** (two-surface sync). |
| Populating the field | **war-room scout + confirm:** detect the repo's test convention (e.g. vitest/jest in `package.json` ⇒ suggest `*.test.ts *.test.tsx`), operator confirms/edits. Never preset-supplied (repo-specific). |
| Doomed-run preflight | **Decisive zero-match check** at run start when `testPattern` is null and the phase has ≥1 `requiresTest` task: if zero files in the repo match the default floor set (with its exclusions), the floor mathematically cannot pass. **Interactive: loud warning + suggested fix, operator may proceed. AFK: hard-stop before dispatch.** |
| Script changes | **None.** (Optional comment-only header pointer to `overrides.testPattern`.) |
| Live-run remediation | Brief note, §8 below. |

## 4. Mechanics

### war-config.mjs (schema + validation)
- `DEFAULTS.overrides.testPattern = null`.
- `validate()`: when non-null — must be a string; trimmed non-empty; every space-separated token
  non-empty; whole value matches `^[A-Za-z0-9*?./_ -]+$`. Presets untouched (repo-specific fact,
  never a preset knob).

### /war Lead (skills/war/SKILL.md)
- Threads the resolved `overrides.testPattern` into every phase Workflow's args as
  `plan.testPattern` (string | null).
- **Preflight (per run, before phase-1 dispatch):** if `plan.testPattern` is null and any task has
  `requiresTest !== false`, run the decisive check — one `find` mirroring the default set and its
  exclusions (`skills/**/*.test.mjs`; `**/*.test.sh` excluding `node_modules/`, `.git/`,
  `.claude/`). Zero matches ⇒ interactive: warn loudly with the suggested fix
  (`overrides.testPattern`), proceed only on operator say-so; afk: hard-stop before any dispatch.

### workflow-template.js (three prompt sites)
- args doc: `plan: { file, gate, testPattern? }`.
- Merge-task prompt (:648) and retry prompt (:731): when set, the composed instruction reads
  `run assert-test-in-diff.sh <integrationBranch> <task.branch> --pattern '<value>'` — the exact
  command line, single-quoted, so the refiner copies it verbatim. When null, prompts are
  byte-identical to today.
- ADD_TEST fixPrompt (:679): when set, append a clause: *"the floor pattern is `'<value>'` — the
  added test file's path must match it"*. (Without this, a fix-worker could add a valid test the
  retry still rejects.)

### agents/war-refiner.md (standing instruction)
- Step 4 gains: *"threading the `--pattern` override when the dispatched merge-task prompt carries
  one — never invent a pattern yourself"*. Keeps the two coverage surfaces in sync.

### /war-room (skills/war-room/SKILL.md)
- New interview step (scout + confirm): detect the repo's test runner/ecosystem and propose the
  matching suggestion set from the table below; the operator confirms or **trims it to what the
  repo's gate actually runs** (the floor-⊆-gate invariant is theirs to keep). No detection hit ⇒
  ask cold, offering the table. Echo the case-glob semantics note (§2). Write the confirmed value
  to `overrides.testPattern`.

**Per-language suggestion table** (authoritative content for the war-room step; every set is
expressed in the script's case-glob dialect — prefix conventions carry the root+nested pair):

| Detected ecosystem (signal) | Suggested `testPattern` set |
| --- | --- |
| vitest / jest (`package.json` scripts or devDeps) | `*.test.ts *.test.tsx *.test.js *.test.jsx *.spec.ts *.spec.tsx *.spec.js *.spec.jsx` — trim the spec/jsx tokens if the repo has none |
| node `--test` (`node:test` imports, `*.test.mjs`) | `*.test.mjs *.test.js` |
| pytest / unittest (`pyproject.toml`, `pytest.ini`, `conftest.py`) | `test_*.py */test_*.py *_test.py` |
| Go (`go.mod`) | `*_test.go` |
| Rust (`Cargo.toml`) | `tests/*.rs */tests/*.rs` — **filename-blind spot:** in-file `#[test]` unit tests are invisible to a filename floor; see the honest-limits note below |
| Ruby rspec / minitest (`Gemfile`) | `*_spec.rb *_test.rb test_*.rb */test_*.rb` |
| JVM — JUnit etc. (`pom.xml`, `build.gradle*`) | `*Test.java *Tests.java *IT.java *Test.kt *Spec.kt` |
| .NET xunit / nunit (`*.csproj`) | `*Test.cs *Tests.cs` |
| PHP phpunit (`composer.json`) | `*Test.php` |
| Elixir (`mix.exs`) | `*_test.exs` |
| Swift (`Package.swift`) | `*Tests.swift` |
| bash suites / bats | `*.test.sh *.bats` |

**Honest limit:** the floor is filename-shaped; conventions that put tests *inside* source files
(Rust unit tests, doctests) under-detect. war-room states this at confirm time — the operator may
accept integration-tests-only coverage, or set `requiresTest: false` deliberately per task; the
floor is never satisfied by a source-wide wildcard (`*.rs`), which would make it vacuous.

## 5. Surface changes

| File | Change |
| --- | --- |
| `skills/war/assets/war-config.mjs` | `DEFAULTS.overrides.testPattern: null`; `validate()` charset rule |
| `skills/war/assets/war-config.test.mjs` | validation cases: null ok; valid set ok; quote/`$`/backtick/empty rejected |
| `skills/war/assets/workflow-template.js` | args doc; 3 prompt sites (`:648`, `:731`, `:679`) |
| `skills/war/assets/workflow-template.test.mjs` | with `testPattern`: all 3 prompts carry it; null ⇒ byte-identical prompts |
| `agents/war-refiner.md` | step 4 threading clause |
| `skills/war/SKILL.md` | Lead threading + zero-match preflight (warn/stop) |
| `skills/war-room/SKILL.md` | scout + confirm interview step + the per-language suggestion table (§4) |
| `skills/war/references/schemas.md` | args schema: `plan.testPattern?` |
| `skills/war/assets/assert-test-in-diff.sh` | comment-only: header pointer to `overrides.testPattern` (optional) |
| `CONTEXT.md` | new term, §6 |
| `docs/adr/0019-…` | §7 |

## 6. New domain terms (CONTEXT.md)

- **Floor pattern** — the glob set the test floor matches a task diff against. Defaults to the
  meta-repo gate's discovery set; declared per-repo by the operator (`overrides.testPattern`) so
  the floor keeps mirroring that repo's actual gate. Never inferred at runtime.

## 7. Recommended ADRs

- **0019 — Test-floor pattern is operator-declared, never runtime-inferred.** Hard to reverse
  (public config schema), surprising later ("why doesn't WAR just detect the repo's tests?"), and a
  real trade-off: declaration preserves the floor-⊆-gate invariant (ADR 0006) at the cost of one
  war-room question; inference would silently weaken or falsely trip the floor when the guess is
  wrong.

## 8. Open risks / implementation notes

- **Live-run remediation (war-engine-port, the motivating incident):** land the plugin fix →
  refresh the plugin → add `"testPattern": "*.test.ts *.test.tsx"` to Otto's
  `.claude/war/config.json` `overrides` → resume; each phase launches a fresh Workflow from the
  template, so the next phase dispatch picks it up with no further surgery. Mid-phase merge-tasks
  at fix-time: the operator verifies manually with the exact red/green command from §1 before
  hand-merging or re-dispatching.
- The refiner is a model following prompt text; it could still run the bare command. Mitigation:
  the dispatched prompt contains the exact full command line (it already composes exact invocation
  text), and the standing instruction forbids inventing/dropping the pattern.
- The conservative charset rejects `[]` character classes. Acceptable — no known need; widen the
  charset later if a repo requires it.
- The zero-match preflight cost is one `find` per run — negligible.
- Plugin version bump + changelog per marketplace release conventions.

## 9. Non-goals / deferred

- **No auto-derivation** of the pattern from test-runner configs (fragile inference; closed by §3).
- **No broadening of the script's default set** (re-opens the red-team-closed over-count decision).
- **No per-task pattern overrides** (YAGNI — a repo has one gate, hence one floor pattern).
- **No packaging-floor changes** (verified unaffected, §1).
- **Not a workaround via `requiresTest: false`** — that skips the floor; this fix keeps it honest.

## 10. Validation criteria

1. **Repro flips.** With `overrides.testPattern: "*.test.ts *.test.tsx"` resolved into args, the
   composed merge-task prompt contains `--pattern '*.test.ts *.test.tsx'`; executing that exact
   command against Otto refs `f3f2b87…war/2026-07-07-war-engine-port/p1-1.2` exits 0. The bare
   command still exits 1 (control unchanged).
2. **Byte-identical null path.** `testPattern: null` ⇒ merge, retry, and ADD_TEST prompts are
   byte-identical to pre-change output (template test).
3. **Validation.** `validate()` accepts null and `"*.test.ts *.test.tsx"`; rejects `""`,
   `"a'b"`, `"$(rm -rf)"`, backtick-bearing, and newline-bearing values (config test).
4. **Preflight.** In a fixture repo with zero default-set matches and one `requiresTest` task:
   afk run refuses to dispatch; interactive run emits the warning text. In the meta-repo fixture:
   no warning.
5. **Three prompt sites.** With a pattern set, template test asserts all three prompts (merge,
   retry, ADD_TEST) carry it; the ADD_TEST clause names the pattern.
6. **Two-surface sync.** `agents/war-refiner.md` names the threaded `--pattern`; grep-checkable.
7. **Meta-repo suite green.** Existing `assert-test-in-diff.test.sh` passes byte-unchanged
   (script untouched).
8. **Suggestion-table dialect correctness.** For every row of the war-room table, a fixture check:
   each suggested set matches a representative nested test path AND a root-level test path for its
   convention via the script's own `--pattern` (e.g. `test_*.py */test_*.py` matches both
   `test_a.py` and `pkg/tests/test_a.py`), and does not match a known near-miss
   (`latest_results.py` for the pytest row).
