# Audit-Fidelity Doc-Drift & Test-Polish Sweep (F03–F12 residual nits)

**One-liner:** A single drift-sweep WAR run that retires every residual nit/minor left behind by the F03–F12 audit-remediation wave — tightening loose test assertions to structural forms, deleting dead code/unused imports, closing the few remaining coverage gaps, correcting stale comments/titles/attribution, and reconciling doc-drift from the F03 (auditor baseline) and F06 (`covenPolicy` default) flips — keeping every gate runner green and shipping one patch bump (v0.6.5 → **v0.6.6**).

**Closes:** #117, #125, #127, #136, #151, #160.

**Status:** proposed — targets **v0.6.6** (single patch over the shipped v0.6.5).

**Scope class:** *quality-only sweep.* No behavior change to any shipped runtime path. Every sub-item is one of: (a) tighten a loose/weak assertion; (b) delete dead code / unused import; (c) add a missing test case; (d) fix a stale comment/title/attribution; (e) correct doc-drift; (f) thread one unwired flag; (g) cosmetic shell/hook fix. This repo is strict TDD — each code change pairs with a failing→green test; each pure-doc/comment change pairs with the gate staying green and (where a test can assert the text) a structural assertion.

**Tech stack:** ESM `*.mjs` under `node --test`; POSIX `sh` assets + `hooks/*.test.sh` on macOS bash 3.2.57 (`jq` payloads); agent/ADR/spec markdown.

**Gate (for `/war`):** the F12 multi-runner — quoted node glob + self-discovering bash-suite loop. Run the FULL gate post-merge (the F12 lesson: a cross-branch merge can add `*.test.sh` runners that a single `node --test` pass misses):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Memory anchors that apply:** `allowlist-catch-all-token-defeats-meta-guard` (#127 DATA_MIRROR_ALLOWLIST), `node-breadth-assertion-test-js-overclaims` (#125), `weak-test-assertion-passes-without-feature-being-exercised` (#117 L796), `teardown-phase-force-flag-unwired` (#136 --force), `printf-json-escaping-vacuous-test-case` (#151 C5), `tr-escape-single-quote-strips-literal-not-newline` (#160 tr), `frontmatter-tools-negation-check-single-line-only` (#151 T1), `dotdot-guard-applies-to-all-agent-types` (#151 T2), `default-flip-must-audit-all-doc-surfaces` (#160 covenPolicy), `adr-policy-table-entry-vs-mechanism-attribution` (#151 T4).

---

## 1. Problem statement (per issue / sub-item, with verified anchors)

All anchors below were re-read at HEAD (v0.6.5) and confirmed. Where the inspection report and the live file disagree, the live file wins and the discrepancy is called out.

### #117 — F04 gate-audit test/comment polish (2 of 3 open)

- **L796 loose assertion.** `skills/war/assets/workflow-template.test.mjs:795-797` asserts the worker-tests summary is threaded into the audit prompt with `/unit|integration|tests/i.test(auditPromptText)`. **Root cause:** the word `tests` (and frequently `unit`/`integration`) appears in the base `auditPrompt` boilerplate regardless of threading, so the assertion passes even if the `{unit:5,integration:2}` summary were never threaded — it does not *exercise* the feature.
- **L333 comment misattribution.** `skills/war/assets/war-config.test.mjs:333` reads `// Task 5 wired land_stale + dep-failed into the template inline (6 items after Task 4).` **Root cause:** factually wrong provenance — per `land-decision.mjs:8` the canonical array is `['escalate','audit-blocked','conflict','land_stale','dep-failed','gate-evidence']`; `dep-failed` was the Task 1 (F02) foundation, `land_stale` pre-existed, and Task 4 (F04/R3) added only `gate-evidence`. The misattribution misleads future drift-guard maintainers.
- **(Optional) execution-evidence lens doc.** The inline comment already added at `workflow-template.js:354-357` documents the hard/soft coupling, but `agents/war-auditor.md` still has no section for the `execution-evidence` lens where the other lenses are documented. The issue marks this **(Optional)**.

### #125 — F12 node-breadth assertion overclaims for `.test.js` + polish (still-valid)

- **L399-413 overclaim.** `war-config.test.mjs:399-413` walks for `name.endsWith('.test.mjs') || name.endsWith('.test.js')` (L403) but asserts only `skills/` containment, while the **declared gate glob is `node --test 'skills/**/*.test.mjs'`** which matches `.test.mjs` only. **Root cause:** a future `.test.js` *inside* `skills/` would satisfy the assertion yet be silently orphaned by the glob — the test over-claims breadth it does not actually guarantee.
- **L3 unused import.** `war-config.test.mjs:3` imports `statSync` from `node:fs`; it is never used.
- **L294 weak assertion.** `war-config.test.mjs:294` asserts `result.includes('node_modules')` — a bare substring that survives refactors of the `-not -path '*/node_modules/*'` flag (the strong form already exists at L392).
- **L299 weak assertion.** `war-config.test.mjs:299` asserts `result.includes('.git')` — same weakness; strong form exists at L393.

### #127 — F07 meta-guard / drift-test hardening (still-valid)

- **L879 catch-all allowlist.** `war-config.test.mjs:879` — `DATA_MIRROR_ALLOWLIST` contains a bare `'MIRROR of'` entry. **Root cause:** any future marker line containing the substring `MIRROR of` is silently allowlisted without a field-specific check, defeating the meta-guard (the `allowlist-catch-all-token-defeats-meta-guard` memory).
- **Two decideLand combos missing.** `war-config.test.mjs:784-836` covers empty×empty (L784), non-empty-landed×empty (L796), non-empty-landed×HARD (L804), **empty-landed×SOFT (L817)**. **Verified-correction to the issue text:** the report says "missing empty-landed×HARD and non-empty-landed×SOFT" — the live file already has empty-landed×SOFT (L817) and non-empty-landed×HARD (L804). The genuinely-missing cells are **empty-landed × HARD → `held:escalation`** and **non-empty-landed × SOFT → `landed`**. Per `decideLand` (`land-decision.mjs:13-17`): `hard` short-circuits to `held:escalation` even with nothing landed; a SOFT reason with landed tasks yields `landed`. These two cells of the 8-cell matrix are untested.
- **L17 prune list.** `war-config.test.mjs:17` — `walkFiles(root, predicate, pruned = ['node_modules', '.git'])`. **Root cause:** missing `.claude/worktrees`; running the meta-test from a main checkout with nested WAR worktrees double-counts `.test.*` files and false-fails.
- **L3 unused import.** Same `statSync` import as #125 (shared file). De-duplicated into one task below.
- **L738 misleading title.** `war-config.test.mjs:738` — `drift-guard(F07): inline covenSeats uses DEFAULTS.audit.lenses as fallback (DEFAULTS injection equivalence)`. **Root cause:** "injection equivalence" reads as if it tests injection; the body (L749-754) validates the **no-lenses fallback** to `DEFAULTS.audit.lenses`.
- **L950-954 dead `/gi` markerPattern.** `war-config.test.mjs:950-954` builds a stateful `/gi` regex (`markerPattern`), filters with it, then resets `lastIndex` at L953 — but the actual count at L955 uses a fresh non-global `/i` regex. **Root cause:** L950-954 are dead (the `/gi` filter result is discarded); they exist only as a hazard re-introducing the stateful-regex bug `#126` fixed.

### #136 — provisioning-lifecycle phase-1 test/wiring polish (#69 minors, 2 of 4 open)

- **--force unwired.** `provision-worktrees.sh:462,466` parse `--force` (`force=0` init at L462; `case "--force": force=1` at L466) but `cmd_teardown_phase`'s integration-branch delete at **L565** (`git branch -D "$int_branch"`) never consults `force`. **Root cause:** dead flag — parsed, documented in the usage string (L481), never read.
- **SI.1 non-discriminating assertion.** `provision-worktrees.test.sh:1437` greps `'invalid|not a valid|ZZZZZ|failed.*create|bad.*object'`. **Root cause:** the `die` message at `provision-worktrees.sh:190` interpolates the bad base ref (`ZZZZZ`) and the literal prefix `failed to create branch`, so both tokens match the generic message even if git's stderr were dropped — the test does not prove stderr is surfaced.
- **Stderr-capture comment drift.** `provision-worktrees.sh:186-187` describes a `2>&1 >/dev/null` redirect ordering, but the code at L188-191 uses a **temp-file** capture (`_tmp_err="$(mktemp …)"`, `git branch … 2>"$_tmp_err"`, `cat`/`rm`). **Root cause:** comment describes a superseded approach.
- **T3c/T3d fail-loud verification.** `provision-worktrees.test.sh` T3c/T3d carry `--owned-file` ledgers and should reach the fail-loud integration-branch-delete path. **Verified likely-correct** per inspection — a verification task, no code change expected.

### #151 — servitor-confinement-memory test/doc polish (F01/F05 nits, still-valid)

- **T1 frontmatter scan too narrow.** `hooks/validate-worktree-scope.test.sh:209-216` runs `grep -qv 'Bash'` against a single `tools_line` extracted by a `^tools:` pattern. **Root cause:** a YAML block-style `tools:` with `- Bash` on a following line would be missed (the `frontmatter-tools-negation-check-single-line-only` memory).
- **T2 `..` guard now constrains all agents.** `hooks/validate-worktree-scope.sh:44-48` places the `*/../*|*/..` deny **before** the `case "$atype"` at L50, so refiner/main-session writes (previously fail-open) are now `..`-denied. **Root cause:** behavior is correct and intentional (`dotdot-guard-applies-to-all-agent-types`), but there is no back-compat test or header note documenting that this is deliberate; a future reader may "fix" it back to fail-open.
- **T3 C5 payload + dead `warned`.** **Verified-correction:** the live `validate-worktree-scope.test.sh` has no `C5` label and no `warned` variable (already cleaned). The residual is the payload helper `mk()` at L23 using `printf '{"agent_type":%s,"tool_input":{"file_path":"%s"}}'` interpolation, which malforms if a path/type contains a double-quote (the `printf-json-escaping-vacuous-test-case` memory). Scope this task as: harden any `printf`-interpolated JSON payloads to `jq -nc --arg`, and assert no dead `warned` variable remains (confirmation, not removal).
- **T4 doc completeness + ADR attribution.** `agents/war-worker.md` lacks servitor-confinement context prose (no false claim — a completeness gap). `docs/adr/0002-scope-by-agent-type.md:28-30` frames the confinement mechanism as "the hook … confines writes by role" without the allowlist-primary framing (capability allowlist is primary; the hook is defense-in-depth). **Root cause:** under-attribution (`adr-policy-table-entry-vs-mechanism-attribution`).

### #160 — audit-fidelity doc-drift polish (F03/F06 nits, partially-fixed)

- **T1 `workflow-template.js:26` stale comment.** Reads `// auditors receive the absolute worktree path and compare candidate files there against baseline at the main repo checkout.` **Root cause:** F03 changed the auditor to self-serve the diff via `git diff ${integrationBranch}...${task.branch}`; the comment still names the main-checkout baseline.
- **T2a `validate-auditor-git.sh:74` `tr` bug.** `[ -n "$residue" ] && deny "… $(printf '%s' "$residue" | LC_ALL=C tr -d '\n' | head -c 20)"` — the `'\n'` is single-quoted, so `tr` strips literal `\` and `n`, not newlines (`tr-escape-single-quote-strips-literal-not-newline`). **Cosmetic** (deny-message cleanup only).
- **T2b hooks.json ordering.** `hooks/hooks.json:10-21` registers `warn-bash-write-scope.sh` (L13) before `validate-auditor-git.sh` (L19). **Root cause:** plan noted "guard first"; functionally irrelevant (disjoint agent types, block-on-any-exit-2). **Optional.**
- **T3a war-room-design.md JSON example.** `docs/specs/2026-06-18-war-room-design.md:63` shows `"covenPolicy": "auto"`. **Root cause:** F06 flipped the default to `all`; the illustrative JSON still shows `auto`.
- **T3b war-room-design.md field-ref.** Same file L83-87: the `auto` bullet is captioned **"today's behavior"** (L84-85), still presenting `auto` as the default.
- **T3c SKILL.md default.** `skills/war/SKILL.md:27` describes coven seeding with `auto (default)`. **Root cause:** stale default label per F06 (`default-flip-must-audit-all-doc-surfaces`).

> Note on `skills/war-room/SKILL.md`: the inspection points at `skills/war/SKILL.md:27` for the `auto (default)` prose; the F06 plan also touched `skills/war-room/SKILL.md`. The task below greps **both** SKILL surfaces for a stale `auto`/`(default)` pairing and fixes whichever still asserts it, so no surface is missed.

---

## 2. Design / approach (chosen fix per item, rationale, rejected alternatives)

### Wave A — `war-config.test.mjs` (all of #125, #127; #117 L333) — SERIAL

All five touch one file; serialize as one phase of small TDD tasks to avoid rebase conflict (`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks` — one task per logical change, stacked on the same branch).

- **#117 L333 comment.** Rewrite to: `// dep-failed was the Task 1 (F02) foundation; land_stale pre-existed; Task 4 (F04/R3) added gate-evidence (6 items total).` Pure comment; the existing drift-guard at L330-345 already asserts the array contents, so correctness is gate-covered. Add no new test — but the change must keep `node --test` green.
- **#125 / #127 L3 `statSync`.** Delete `statSync` from the L3 import. The full test-file run is the proof (an unused import is harmless at runtime but the lint-by-test convention here is "the file parses and runs"). No new test; gate stays green.
- **#125 L294/L299 weak asserts.** Replace `result.includes('node_modules')` with `result.includes("-not -path '*/node_modules/*'")` and `result.includes('.git')` with `result.includes("-not -path '*/.git/*'")` — mirror the strong form already at L392-393 (`prune-assertion-substring-token-drift`). The assertion still passes against the current `resolveGate` output; it now fails if the flag is refactored.
- **#125 L399-413 overclaim.** **Chosen:** narrow the breadth walk to `.test.mjs` only (drop `|| name.endsWith('.test.js')` at L403, and at L417). Rationale: the declared glob is `.test.mjs`-only, so the assertion should claim exactly what the gate guarantees — no more. **Rejected alternative** (from the issue): adding a separate `.test.js` coverage assertion — that would assert a breadth the gate does not actually run, re-introducing a different overclaim. Narrowing is the faithful fix (`node-breadth-assertion-test-js-overclaims`).
- **#127 L879 catch-all.** Remove the bare `'MIRROR of'` entry from `DATA_MIRROR_ALLOWLIST`; keep the field-specific `'run.provision/run.provisionSource'` (L876) and `'provisionSource reads'` (L878). Rationale: the marker at `workflow-template.js:69` already contains `run.provision/run.provisionSource`, so the field-specific entries still classify it; the catch-all only widened the hole (`allowlist-catch-all-token-defeats-meta-guard`).
- **#127 two decideLand cells.** Add `empty-landed × HARD → 'held:escalation'` and `non-empty-landed × SOFT → 'landed'`, mirroring the `buildInlineDecideLand()` extract-and-execute harness already used at L784-826 (so both canonical and inline are asserted equal, and the literal verdict is pinned).
- **#127 L17 prune list.** Add `.claude/worktrees` to the `pruned` default: `pruned = ['node_modules', '.git', '.claude/worktrees']`. Rationale: prevents nested-worktree double-count false-fails when the meta-test runs from a main checkout (sibling concern to the #160-era nested-worktree status noise).
- **#127 L738 title.** Rename to `drift-guard(F07): inline covenSeats falls back to DEFAULTS.audit.lenses when task has no lenses`. Pure rename; the meta-guard at L912-944 verifies registered drift-test *name prefixes* (`'drift-guard(F07): inline covenSeats'`) still match — confirm the prefix is preserved (it is) so the registry assertion stays green.
- **#127 L950-954 dead `/gi`.** Delete L950-953 (the `markerPattern` `/gi` build, the `.filter`, the `lastIndex` reset); keep L955's inline non-global `/i` count. Rationale: eliminates the stateful-regex hazard `#126` fixed.

### Wave B — distinct files, parallel-eligible

- **B1 · #136 provisioning.** `provision-worktrees.{sh,test.sh}`.
  - **--force:** **Chosen:** **drop** `--force` from `cmd_teardown_phase` — remove the `force=0` init (L462), the `case "--force"` arm (L466), and `[--force]` from the usage string (L481). Rationale: the integration-branch delete is an *owned, gated, run-scoped* teardown (ownership ledger at L498-510 already gates it); a force-override would weaken the F09 ownership safety for no current caller. **Rejected alternative** (issue's option 1): thread `force` into the `git branch -D` at L565 — rejected because there is no caller that needs to bypass the fail-loud "still checked out" guard, and adding the wire grows surface that invites misuse. Removing the dead flag is the safer, smaller fix (`teardown-phase-force-flag-unwired`). Pair with a test asserting `teardown-phase --force …` now errors with `unknown flag` (the L477 `-*) die` arm), proving the flag is gone.
  - **SI.1 assertion:** tighten the grep to git-only tokens that do **not** appear in the generic die prefix: `grep -qiE 'not a valid object|invalid object|fatal'`. Rationale: `not a valid object name` / `invalid object name` / `fatal:` come only from git's stderr, never from `provision-worktrees.sh:190`'s template; the test now discriminates. TDD: temporarily stub the capture to confirm the assertion goes red when stderr is dropped, then restore.
  - **Stderr comment:** rewrite L186-187 to describe the temp-file capture actually used at L188-191.
  - **T3c/T3d:** verification-only (per inspection, already correct). If a no-op, document it in the task (`verify-task-no-op-is-correct-when-already-covered`).
- **B2 · #151 confinement.** `hooks/validate-worktree-scope.{sh,test.sh}`, `agents/war-worker.md`, `docs/adr/0002-scope-by-agent-type.md`.
  - **T1:** extend the negation test to scan the **whole frontmatter block** for a forbidden `Bash` token (inline `tools:` *and* block-style `- Bash`), not just the single `tools_line` (`frontmatter-tools-negation-check-single-line-only`).
  - **T2:** add a back-compat test asserting a refiner/main-session (`agent_type` absent or `*war-refiner*`) write to a `..`-bearing path is denied (exit 2), plus a header comment at `validate-worktree-scope.sh:37` noting the deny is intentionally pre-`case` and applies to ALL agents (`dotdot-guard-applies-to-all-agent-types`). Also add a back-compat assertion that a *clean* refiner/main path still allows (fail-open preserved for the non-`..` case).
  - **T3:** convert the `mk()` payload helper (L23) and any other `printf`-interpolated JSON in the suite to `jq -nc --arg` (`printf-json-escaping-vacuous-test-case`); assert (by grep in the task's own verification, not a runtime test) that no `warned` dead variable remains.
  - **T4:** add a short servitor-confinement paragraph to `agents/war-worker.md`; reword `0002:30` to "the **capability allowlist is the primary** confinement (workers get no write tool outside their grant); the `agent_type` hook is **defense-in-depth**, denying writes outside the role's path." (`adr-policy-table-entry-vs-mechanism-attribution`).
- **B3 · #160 doc-drift + shell.** `skills/war/assets/workflow-template.js` (L26), `hooks/validate-auditor-git.sh` (L74), `hooks/hooks.json`, `docs/specs/2026-06-18-war-room-design.md` (L63, L83-87), `skills/war/SKILL.md` (L27) (+ grep `skills/war-room/SKILL.md`).
  - **T1:** reword `workflow-template.js:26` to: `// auditors receive the absolute worktree path and self-serve the change set via read-only git (git diff <integrationBranch>...<task.branch>, three-dot); no main-checkout baseline.`
  - **T2a:** `validate-auditor-git.sh:74` — change `tr -d '\n'` to `tr -d $'\n'` (ANSI-C quoting yields the real control char; `tr-escape-single-quote-strips-literal-not-newline`).
  - **T2b (optional):** reorder `hooks.json` so the `validate-auditor-git.sh` block precedes `warn-bash-write-scope.sh`. Functionally neutral; do it for plan-fidelity only, and only if it keeps `hooks.json` valid JSON (assert with `jq . hooks.json`).
  - **T3a/T3b/T3c:** flip `auto → all` in the JSON example (L63) and reword the field-ref (L83-87) so the `all` bullet carries "the default", and fix `SKILL.md:27` (+ `war-room/SKILL.md` if it asserts the same).
- **B4 · #117 workflow-template.** `skills/war/assets/workflow-template.test.mjs` (L796) + optional `agents/war-auditor.md`.
  - **L796:** replace `/unit|integration|tests/i` with a **structural** assertion that the *threaded summary* is present — e.g. assert the prompt contains the worker's reported counts in a structural form, `/"?unit"?\s*[:=]\s*5/` AND `/"?integration"?\s*[:=]\s*2/` (the mock worker returns `{unit:5,integration:2}` at L808 of `workflow-template.test.mjs`). Whichever exact serialization the template emits, the test must key on the *threaded values*, not boilerplate (`weak-test-assertion-passes-without-feature-being-exercised`). The implementing task reads the live `auditPrompt` emission to pin the exact form before writing the assertion (`plan-line-number-refs-stale-use-construct-locator`).
  - **(Optional) war-auditor.md:** add an `execution-evidence` lens subsection alongside the existing lens docs. Low-priority; include only if it does not expand the wave.

### Release

Single patch bump **v0.6.5 → v0.6.6** across the canonical slots (`release-bump-slots-canonical-no-badge`): `.claude-plugin/plugin.json:version`, `.claude-plugin/marketplace.json` `metadata.version` (L7) AND `plugins[0].version` (L14), and `README.md ## Status` (replace-in-place, L169-171; "Builds on v0.6.5" lineage OK). No README badge.

---

## 3. Decision record

- **D1 — Quality-only, zero behavior change.** No shipped runtime path changes semantics. `--force` removal (#136) is the only flag-surface change and it removes a *dead, never-wired* flag, so no caller is affected. Back-compat guarantee: every existing gate runner stays green at every task boundary.
- **D2 — Faithful, not maximal, breadth (#125).** Narrow the node-breadth walk to `.test.mjs` rather than add `.test.js` coverage. The test must claim exactly what the gate glob guarantees; asserting more is the overclaim being fixed.
- **D3 — Remove `--force`, do not wire it (#136).** Preserve the F09 fail-loud ownership/checkout safety on integration-branch delete. A force-override is a footgun with no current caller; the smaller, safer fix is deletion.
- **D4 — Defense-in-depth framing in ADR 0002 (#151 T4).** The capability allowlist is the **primary** confinement; the `agent_type` hook (and the `..` guard) are **defense-in-depth**. ADR 0002:30 is reworded to attribute primacy correctly without claiming the hook is the sole mechanism.
- **D5 — `..` guard stays pre-`case`, deliberately (#151 T2).** The traversal deny intentionally applies to ALL agents (refiner/main included). This is ratified as fail-safe-by-default; a back-compat test + header comment lock it so it is not "fixed" back to fail-open.
- **D6 — Verified-corrections to issue text are authoritative.** (a) #127's two missing decideLand cells are empty-landed×HARD and non-empty-landed×SOFT (the issue swapped the labels; the live file already covers the other two). (b) #151 T3's `warned` variable and `C5` label are already gone; the residual is the `printf`-interpolated `mk()` payload. (c) #117 L796 currently passes vacuously on base boilerplate. Tasks act on the verified live state, not the issue prose.
- **D7 — Optional items are explicitly deferrable.** #117 war-auditor.md lens doc and #160 T2b hooks.json reorder are optional; include only if they do not grow the wave. If deferred, note in the PR and leave the issue open-with-note rather than silently closing the sub-item.
- **D8 — Serialize same-file tasks (Wave A).** All `war-config.test.mjs` changes stack as serial tasks on one branch to avoid same-file rebase conflict (`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).
- **D9 — Single patch bump.** One v0.6.6 release for the whole sweep; no per-task bump.

---

## 4. Phase → task decomposition

Strict TDD: each task is (failing test/assertion → change → green). Phase 1 is serial (shared file). Phase 2 is parallel-eligible (disjoint files). Phase 3 is release.

### Phase 1 — `war-config.test.mjs` sweep (SERIAL, one branch)

**T1.1 — Fix L333 comment + drop `statSync` (#117 L333, #125 L3, #127 L3).**
- Files: `skills/war/assets/war-config.test.mjs`.
- Change: rewrite the L333 attribution comment; delete `statSync` from the L3 import.
- Test: no new test; `node --test 'skills/**/*.test.mjs'` stays green (the L330-345 drift-guard already asserts the array). Verify the file still parses/runs.

**T1.2 — Strengthen L294/L299 prune asserts (#125 L294, L299).**
- Files: `war-config.test.mjs`.
- Test (red→green): change L294 to `result.includes("-not -path '*/node_modules/*'")` and L299 to `result.includes("-not -path '*/.git/*'")`; confirm they pass against current `resolveGate` and would fail if the flag string changed (mirror L392-393).

**T1.3 — Narrow node-breadth walk to `.test.mjs` (#125 L399-413).**
- Files: `war-config.test.mjs`.
- Test: drop `|| name.endsWith('.test.js')` at L403 and L417; the breadth test now asserts only what `skills/**/*.test.mjs` guarantees. Green run; assertion still finds the 4 known `.test.mjs` suites.

**T1.4 — Add `.claude/worktrees` to prune list (#127 L17).**
- Files: `war-config.test.mjs`.
- Test: a unit assertion that `walkFiles` skips a synthesized `.claude/worktrees/...` nested path (or assert the default `pruned` array includes `.claude/worktrees`); change L17 default to `['node_modules', '.git', '.claude/worktrees']`.

**T1.5 — Add two decideLand cells (#127).**
- Files: `war-config.test.mjs`.
- Test (red→green): add `empty-landed × HARD → 'held:escalation'` and `non-empty-landed × SOFT → 'landed'` using the existing `buildInlineDecideLand()` harness (L764-782), asserting both `inlineDecideLand(args) === decideLand(args)` and the literal verdict. These exercise `land-decision.mjs:15-16` branches not previously hit.

**T1.6 — Tighten DATA_MIRROR_ALLOWLIST (#127 L879).**
- Files: `war-config.test.mjs`.
- Test (red→green): remove `'MIRROR of'` (L879); the meta-guard at L848-910 must stay green (the `workflow-template.js:69` marker is still classified by the field-specific entries). Add an assertion that `DATA_MIRROR_ALLOWLIST` does not contain a bare `'MIRROR of'` catch-all (count/anchor form, per `allowlist-catch-all-token-defeats-meta-guard`).

**T1.7 — Rename L738 title + delete dead `/gi` (#127 L738, L950-954).**
- Files: `war-config.test.mjs`.
- Test: rename the L738 test title (preserving the `'drift-guard(F07): inline covenSeats'` prefix the registry at L864 checks); delete L950-953. Green run; the meta-guard's name-existence assertion (L912-944) and the marker-count assertion (L947-960, now using only the `/i` count at L955) both stay green.

### Phase 2 — distinct-file fixes (PARALLEL-eligible)

**T2.1 — `#136` provisioning (`provision-worktrees.{sh,test.sh}`).**
- Drop `--force` (remove L462 init, L466 case-arm, `[--force]` from L481 usage).
- Test (red→green): add a case asserting `teardown-phase --force …` exits non-zero with `unknown flag` (the L477 arm) — proves the flag is gone.
- Tighten SI.1 (`provision-worktrees.test.sh:1437`) to `grep -qiE 'not a valid object|invalid object|fatal'`; confirm it goes red if stderr capture is removed, green with it.
- Rewrite the L186-187 stderr-capture comment to match the temp-file impl (L188-191).
- Verify T3c/T3d reach fail-loud (no-op expected; document if so).

**T2.2 — `#151` confinement (`validate-worktree-scope.{sh,test.sh}`, `war-worker.md`, ADR 0002).**
- T1: extend the frontmatter Bash-negation test (L209-216) to scan the whole frontmatter block.
- T2: add a `..`-deny back-compat test for refiner/main `agent_type` + a header comment at `validate-worktree-scope.sh:37`; add a clean-path allow assertion preserving fail-open for non-`..`.
- T3: convert `mk()` (L23) + any `printf`-interpolated JSON payloads to `jq -nc --arg`; assert no `warned` dead var.
- T4: add servitor-confinement prose to `war-worker.md`; reword `0002:30` to allowlist-primary + hook defense-in-depth.

**T2.3 — `#160` doc-drift + shell (`workflow-template.js`, `validate-auditor-git.sh`, `hooks.json`, `war-room-design.md`, `SKILL.md`).**
- T1: reword `workflow-template.js:26`.
- T2a: `validate-auditor-git.sh:74` `tr -d '\n'` → `tr -d $'\n'`.
- T2b (optional): reorder `hooks.json` (auditor-git guard first); assert `jq . hooks.json` valid.
- T3a/T3b: `war-room-design.md:63` JSON `auto→all`; reword L83-87 field-ref so `all` is "the default".
- T3c: `skills/war/SKILL.md:27` `auto (default)` → `all (default)`; grep `skills/war-room/SKILL.md` for the same stale pairing and fix if present.
- Test: `validate-auditor-git.test.sh` stays green; add/keep an assertion that the deny-message path runs cleanly. Doc changes proven by the gate staying green + a grep assertion (in the task) that no surface still says `covenPolicy … auto … default`.

**T2.4 — `#117` workflow-template test + optional auditor lens doc (`workflow-template.test.mjs`, optional `war-auditor.md`).**
- Test (red→green): replace `workflow-template.test.mjs:796` `/unit|integration|tests/i` with a structural assertion keyed on the threaded `{unit:5,integration:2}` values (read the live `auditPrompt` emission to pin the exact serialization first). Confirm the assertion fails against a prompt with the summary stripped.
- Optional: add an `execution-evidence` lens subsection to `agents/war-auditor.md`.

### Phase 3 — Release & verify

**T3.1 — Bump v0.6.6 + full multi-runner gate green.**
- Bump `.claude-plugin/plugin.json:version`, `.claude-plugin/marketplace.json` L7 + L14, `README.md ## Status` (L169-171, replace-in-place).
- Run the FULL self-discovering gate (node glob + ALL `*.test.sh`) **post-merge** per the F12 lesson (`gate-under-covers-after-cross-branch-merge-new-runner`) — confirm every runner green after all Phase-1/2 branches converge.

---

## 5. Test plan

**Gate command (run after every task and once more post-merge):**
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Specific assertions / prior-art mirrored:**

| Item | New/changed assertion | Mirrors prior-art |
|---|---|---|
| #117 L796 | `/"?unit"?\s*[:=]\s*5/` AND `/"?integration"?\s*[:=]\s*2/` on `auditPromptText` | the `{unit:5,integration:2}` mock at `workflow-template.test.mjs:808` |
| #117 L333 | (comment) drift-guard at `war-config.test.mjs:330-345` already pins the array | — |
| #125 L294/L299 | `includes("-not -path '*/node_modules/*'")` / `'*/.git/*'` | `war-config.test.mjs:392-393` |
| #125 L399-413 | breadth walk asserts `.test.mjs` only | the declared glob `skills/**/*.test.mjs` |
| #127 decideLand ×2 | `inline === decideLand` + literal verdict for empty×HARD and non-empty×SOFT | `buildInlineDecideLand()` harness L764-826 |
| #127 L879 | no bare `'MIRROR of'`; marker still classified by field-specific entries | meta-guard L848-910 |
| #127 L17 | `walkFiles` prunes `.claude/worktrees` | existing prune semantics |
| #127 L738/L950 | renamed title (prefix preserved); `/gi` block gone | registry name-check L912-944; count L955 |
| #136 --force | `teardown-phase --force` → non-zero `unknown flag` | `-*) die` arm L477 |
| #136 SI.1 | `grep -qiE 'not a valid object|invalid object|fatal'` | git stderr tokens absent from `provision-worktrees.sh:190` |
| #151 T1 | whole-frontmatter-block Bash scan | `validate-worktree-scope.test.sh:200-216` |
| #151 T2 | refiner/main `..`-path → exit 2; clean path → allow | the `..`-deny cases L226-229 |
| #151 T3 | `jq -nc --arg` payloads; no `warned` var | `printf-json-escaping-vacuous-test-case` |
| #160 T2a | `tr -d $'\n'` strips real newlines in deny message | `validate-auditor-git.sh:73` (allowlist `tr`) |
| #160 T2b | `jq . hooks.json` valid after reorder | — |
| #160 docs | grep: no surface asserts `covenPolicy … auto … default` | `default-flip-must-audit-all-doc-surfaces` |

---

## 6. Out of scope + open questions

**Out of scope:**
- Any behavior change to the audit/coven/land/provision runtime paths (F03/F06/F07/F12 semantics are shipped and ratified; this is polish only).
- The deferred memory-root anchoring for the `..` guard (`validate-worktree-scope.sh:41` references #58) — explicitly deferred there.
- New lens implementations; only the **optional** `execution-evidence` lens *documentation* is in scope (#117 item 3).
- The deterministic auditor-git harness mentioned in the `red-team-env-gap-warn-is-agent-directive-not-code-enforced` memory — unrelated.

**Open questions:**
1. **#117 L796 exact serialization.** The structural regex must match however `auditPrompt` actually serializes `{unit:5,integration:2}` (JSON `"unit":5` vs prose `unit: 5`). The implementing task reads the live emission first; if the template stringifies the whole object, key the assertion on the object substring. *(Resolvable at implementation; no design risk.)*
2. **#160 T2b hooks.json reorder — include or defer?** Functionally neutral (disjoint agent types, block-on-any-exit-2). Recommend including it for plan-fidelity since it is a one-line JSON move with a `jq` validity check, but it is safely droppable.
3. **#117 / war-auditor.md lens doc — include or defer?** Marked Optional in the issue. Recommend deferring if it would meaningfully expand T2.4; if deferred, leave issue #117 open-with-note rather than closing item 3.
4. **`skills/war-room/SKILL.md` covenPolicy surface.** The inspection cites `skills/war/SKILL.md:27`; the F06 plan also touched `war-room/SKILL.md`. T2.3 greps both — confirm during implementation whether `war-room/SKILL.md` still asserts `auto (default)` (if not, it is a no-op for that file, which is correct per `verify-task-no-op-is-correct-when-already-covered`).

---

## 7. Coverage table (issue # / sub-item → task)

| Issue | Sub-item | Task |
|---|---|---|
| #117 | L796 worker-tests-threading assertion → structural | T2.4 |
| #117 | L333 drift-guard comment misattribution | T1.1 |
| #117 | (opt) execution-evidence lens doc in war-auditor.md | T2.4 (optional) |
| #125 | Narrow node-breadth walk to `.test.mjs` | T1.3 |
| #125 | Remove unused `statSync` import (L3) | T1.1 |
| #125 | L294 weak `node_modules` assert → full pattern | T1.2 |
| #125 | L299 weak `.git` assert → full pattern | T1.2 |
| #127 | Tighten DATA_MIRROR_ALLOWLIST (drop bare 'MIRROR of') | T1.6 |
| #127 | decideLand empty-landed × HARD → 'held:escalation' | T1.5 |
| #127 | decideLand non-empty-landed × SOFT → 'landed' | T1.5 |
| #127 | Add '.claude/worktrees' to walkFiles prune (L17) | T1.4 |
| #127 | Remove unused `statSync` import (L3) | T1.1 |
| #127 | Rename misleading covenSeats title (L738) | T1.7 |
| #127 | Remove dead `/gi` markerPattern (L950-954) | T1.7 |
| #136 | --force parsed-but-unwired → drop from teardown-phase | T2.1 |
| #136 | Tighten SI.1 to git-only error tokens | T2.1 |
| #136 | Fix stderr-capture comment (L186-187) | T2.1 |
| #136 | Verify T3c/T3d fail-loud paths | T2.1 |
| #151 | T1 frontmatter-block Bash-negation scan | T2.2 |
| #151 | T2 `..` guard back-compat test + header comment | T2.2 |
| #151 | T3 `jq -nc --arg` C5 payload; no dead `warned` | T2.2 |
| #151 | T4 war-worker.md prose + ADR 0002:30 allowlist-primary | T2.2 |
| #160 | T1 workflow-template.js:26 comment reword | T2.3 |
| #160 | T2a validate-auditor-git.sh:74 `tr` → `$'\n'` | T2.3 |
| #160 | T2b hooks.json reorder (optional) | T2.3 (optional) |
| #160 | T3a war-room-design.md:63 JSON `auto→all` | T2.3 |
| #160 | T3b war-room-design.md:83-87 field-ref default | T2.3 |
| #160 | T3c SKILL.md:27 covenPolicy default `auto→all` | T2.3 |
| (all) | Single patch bump v0.6.5 → v0.6.6 + full gate green | T3.1 |
