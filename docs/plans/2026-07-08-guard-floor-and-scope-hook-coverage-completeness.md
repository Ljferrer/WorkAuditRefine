# Guard, floor, and scope-hook coverage completeness — implementation plan

**Source spec:** `docs/specs/2026-07-08-guard-floor-and-scope-hook-coverage-completeness-design.md`
**Slug:** `guard-floor-and-scope-hook-coverage-completeness` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** no hard dependency — lands anywhere in the serial order; heavy shared-file contention with the sibling plans noted below (roadmap serializes).

## Commander's Intent

**Purpose.** Every confinement guard, merge floor, and guard test covers its full equivalence class and is enforced by standing meta-guards — the recorded defect shape (a hand-fixed instance whose class recurs on the next verb/key/root) stops recurring because the class, not the instance, is what's guarded.

**Method.** Widen the `..`-traversal reject in `validate-worktree-scope.sh` to the full four-shape class (`..|../*|*/../*|*/..`), kept pre-`case` so it binds every agent type (ADR 0002 D5). A new hooks meta-guard test enforces two authoring conventions with synthetic RED fixtures: frontmatter *negation* checks extract the full fenced block (never a bare `^key:` header), and guard-test search roots anchor to the narrowest subtree or exclude `.claude/`. The enumerating verb-class reference comment (`checkout | switch`) is added atop `refinery-surface.test.sh`'s git-surface absence block — both the `checkout origin/` (ABSENCE CHECK 2) and `switch origin/` (ABSENCE CHECK 3) scans already exist and pass; the comment makes the equivalence class explicit (red-team-corrected: the spec's ABSENCE CHECK 2+3 claim was accurate against the tree). The rename absence guard in `war-pipeline-structure.test.sh` excludes the README-Status/changelog prose region. `war-config.mjs` `validate()` rejects `**/` and substring-prone `testPattern` tokens at config time. A parity test makes floor⊆gate (ADR 0006) tested instead of trusted, asserting against `resolveGate`'s *output*. The packaging floor's A/R/C-only scope is ratified in its header + an ADR 0017 addendum — a recorded decision, not a silent no-op. The stderr **precondition-marker** reader contract (a `gate_failed` carrying `REL_GUARD_PRECONDITION_FAILED` — a real emitted marker, verified — classifies `environment`, never `introduced`) lands on both refiner surfaces; the workflow **path contract** (inject the worktree root, assert every returned path contains the `.claude/worktrees/<name>/` segment) covers unconfined workflow agents. Everything bash-3.2-safe, cwd-independent, byte-identical on the clean path. ADR 0031 ratifies the conventions.

**End state** (each individually checkable):
1. `validate-worktree-scope.sh` denies (exit 2) `../etc/foo` and bare `..` for `war-worker`, `war-servitor`, `war-refiner`, and a no-`agent_type` session; still denies `/a/../b`, `/a/..`, `a/../b`; still allows a clean absolute path; the new test cases are RED against the old `*/../*|*/..` pattern and GREEN after. (spec criterion 1)
2. The negation meta-guard FAILS against a synthetic guard grepping a bare `^tools:` header for a forbidden token and PASSES against the current block-walk extractor and `extract_provenance`; deleting the block walk from the tools-block extractor makes the servitor-Bash negation case pass a block-style `- Bash` (delete-the-feature). (spec criterion 2)
3. `refinery-surface.test.sh` scans **both** `checkout origin/` and `switch origin/` (non-detached — both already present and green) and, added by Task 1.3, carries the enumerating verb-class maintenance comment (`checkout | switch`). (spec criterion 3)
4. The search-root lint FAILS against a synthetic `*.test.sh` doing a repo-root `grep -r` without a `.claude` exclusion and PASSES against `provision-worktrees.test.sh` (`SKILLS_ROOT` anchor), `refinery-surface.test.sh` (named files), and any `.claude`-excluded scan; the guard suite yields the same verdict inside a `.war-task` worktree and in the main checkout. (spec criterion 4)
5. Adding a README `## Status`/changelog line that *describes* a renamed-away token does NOT turn the rename absence guard in `war-pipeline-structure.test.sh` RED; a real structural reintroduction still does. (spec criterion 5)
6. `war-config.mjs validate()` rejects `overrides.testPattern` values `"**/*.test.ts"`, `"*test_*.py"`, and `""`; accepts `null`, `"*.test.ts *.test.tsx"`, and `"test_*.py */test_*.py"`; `war-config.test.mjs` covers each. (spec criterion 6)
7. The parity test asserts the floor's `*.test.sh` exclusion set equals `resolveGate`'s (`node_modules`, `.git`, `.claude`) and the node glob equals `skills/**/*.test.mjs`; mutating either side turns it RED. (spec criterion 7)
8. `assert-packaging-in-diff.sh`'s header states A/R/C-only is intentional with a pointer to the ADR 0017 addendum, which exists; a purely-Modified fixture diff still exits 0, now documented as intended. (spec criterion 8)
9. Both `workflow-template.js`'s gate-failure classification prompt and `agents/war-refiner.md` instruct: a `gate_failed` bearing a stderr precondition marker (e.g. `REL_GUARD_PRECONDITION_FAILED`) classifies `environment`, never `introduced`, carried uncurated in `gate_output` — grep-checkable on both surfaces, pinned by a both-surfaces drift assert. (spec criterion 9)
10. The workflow template injects the absolute worktree root and its done-reporting asserts each returned file path contains the `.claude/worktrees/<name>/` segment, failing loud otherwise (fixture check); the `war-worker` main-root write denial stays regression-guarded (already true). (spec criterion 10)
11. All suites green **byte-unchanged for pre-existing cases**: `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, `war-memory.mjs lint docs/learnings/`. (spec criterion 11)
12. `docs/adr/0031-*.md` records the equivalence-class + meta-guard conventions; the ADR 0017 addendum ratifies the packaging-floor scope; `CONTEXT.md` carries the five new terms.
13. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Class widening, meta-guards, parity, reader contracts

Nine file-disjoint tasks, no intra-phase deps — run in parallel.

**Task 1.1 — `..` traversal class + test cases**
- Files: `hooks/validate-worktree-scope.sh`, `hooks/validate-worktree-scope.test.sh`
- Plan slice: Replace the single reject arm (the pre-`case "$atype"` block currently matching `*/../*|*/..`) with the full class `..|../*|*/../*|*/..`, deny message unchanged in spirit ("contains a '..' traversal segment; use an absolute canonical path"). The arm STAYS pre-`case` — ADR 0002 D5, it binds all agent types including refiner and main session; do not move it into a per-agent branch. Update the header comment that documents only the two old shapes. Test: add leading-relative (`../etc/foo`) and bare (`..`) cases expecting exit 2, for at least one confined role AND the all-agents path (refiner + no-`agent_type`); keep every existing case green byte-unchanged. Also tag the existing tools-block `awk` extractor in this test file with a comment naming it the **block-extraction reference implementation** (the negation-convention anchor Task 1.2's meta-guard points to).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — Guard-authoring meta-guards (new test)**
- Files: `hooks/guard-conventions.test.sh` (new)
- Plan slice: One new bash-3.2-safe, cwd-independent test file with two arms. **(negation-block lint)** Scan `hooks/` guard scripts/tests for a frontmatter *negation* grep anchored to a bare `^tools:`/`^<key>:` header with no following block walk; FAIL on a hit. Synthetic RED fixture (a here-doc guard snippet grepping `^tools:` only) proves the lint fires; the current block-walk extractor (Task 1.1's reference) and `validate-servitor-provenance.sh`'s `extract_provenance` are the PASS references. Positive capability grants stay exempt (a line-scoped miss fails safe — the lint targets negation only). **(search-root lint)** Walk `hooks/` and `skills/` `*.test.sh` and flag any `find`/`grep -r`/`grep -rn` whose root is the repo root without a `.claude` exclusion; synthetic RED fixture proves it; `provision-worktrees.test.sh` (`SKILLS_ROOT` subtree anchor) and `refinery-surface.test.sh` (named files) are PASS references. Carry an allowlist comment convention for deliberate exceptions (spec §8) — an inline `# guard-conventions: allow <reason>` tag suppresses a hit, and the lint prints suppressed hits for the record.
- requiresTest: true (the diff is the test)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.3 — Switch-verb scan in the refinery surface guard**
- Files: `skills/war/assets/refinery-surface.test.sh`
- Plan slice: **Red-team-corrected (was an inverted delta).** The `switch origin/` scan ALREADY EXISTS as a live, green ABSENCE CHECK 3 (`refinery-surface.test.sh` ~lines 210-234, `grep -n 'switch origin/' … | grep -v '--detach'`, fail arm "BARE SWITCH DETECTED"), mirroring ABSENCE CHECK 2 (`checkout origin/`) exactly — the spec's "ABSENCE CHECK 2 + 3 closed" statement was accurate. **Do NOT re-add the scan** (a second ABSENCE CHECK 3 would duplicate/collide). The one genuinely-absent piece is the **enumerating verb-class maintenance comment** atop the git-surface absence block: state that the equivalence class is `checkout | switch` (both re-attach a branch), that every listed verb is scanned, and that a new equivalent verb must be added to BOTH the comment and the scan. This becomes the standing reference pattern the CONTEXT.md "Verb equivalence class (absence guard)" term (Task 1.9) points to. Keep every existing case green byte-unchanged (comment-only edit).
- requiresTest: false (comment-only; scans + behavior byte-unchanged, all existing cases stay green)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Rename-blurb prose exclusion**
- Files: `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: **Delta: target pinned** — this is the file actually carrying the renamed-away-token guard (the `war-survey-corps` structural check; the spec said "e.g."). Scope its absence grep to exclude the prose region before scanning: strip the README `## Status` line and any `CHANGELOG`/`## Changelog` section from the grep input, and/or match the structural token form (`:: <skill-id>`) rather than the bare word — so a release blurb *describing* the rename can never re-trip the guard (the recorded rename/p2-release incident), while a real structural reintroduction still fails. Keep every existing case green.
- requiresTest: true (the diff is the test)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — `testPattern` token validation**
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: Extend `validate()` for `overrides.testPattern` after the existing charset guard: per space-separated token, **reject** any token containing `**/` (mis-globs under `case`-fnmatch — the depth-agnostic form is a bare `*.ext` suffix; prefix conventions use the `pre_* */pre_*` root+nested pair, per the recorded lesson) and **reject** `*<word>*` shapes where `<word>` is not bounded by `.`/`/` (substring over-match: `*test_*` → `latest_results.py`). Keep the charset guard and the null default. Error messages name the correct form. Tests: end state 6's exact accept/reject matrix, delete-and-trace each rejection. **Cross-plan note:** plans 3 (preset matrix) and 4 (`ghUser`) also edit this file pair — roadmap serializes; rebase onto landed content, touch only the testPattern validation region.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — Floor⊆gate parity test**
- Files: `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: Add a parity arm to the floor's existing test: extract the discovery predicates from `resolveGate`'s **output string** (run `node -e` against `war-config.mjs` and capture the emitted `find … -not -path` clause — output, not source text, so a benign `resolveGate` refactor that preserves semantics cannot break it; spec §8) and assert the floor's `match_sh_suite`/default arms carry exactly the same exclusion set (`node_modules`, `.git`, `.claude`) and the same name globs (`*.test.sh`; node glob `skills/**/*.test.mjs`). Mutating either side (fixture copy with `.claude` dropped) turns it RED — the header's "floor EXACTLY equals gate discovery set" claim becomes enforced, the recorded drift-guard idiom applied to shell↔mjs parity.
- requiresTest: true (the diff is the test)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.7 — Packaging-floor scope ratification (header only)**
- Files: `skills/war/assets/assert-packaging-in-diff.sh`
- Plan slice: Extend the header block (which already notes deletions/pure modifications never flag) with an explicit ratification: **Added/Renamed/Copied-only is the intended scope** — a Modified/Deleted packaging artifact that breaks the image is the opt-in docker gate / CI's concern (build failure), not the enumerated-COPY-drift this floor exists to catch; pointer to the ADR 0017 addendum (Task 1.9). The diff-collection arm (`A*`/`R*|C*`/`continue`) is byte-unchanged — comment-only diff.
- requiresTest: false (header comment only; behavior byte-unchanged)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.8 — Hermetic-gate reader contract + workflow path contract (both surfaces)**
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **(reader contract)** In the dispatched gate-failure classification prompt (the environment-vs-introduced construct) and `agents/war-refiner.md` (same commit — two-surface sync): a `gate_failed` whose stderr carries a recognized precondition marker — `REL_GUARD_PRECONDITION_FAILED` is the live example, emitted by `validate-worktree-scope.test.sh`'s rel-guard preflight — classifies `environment`, never `introduced`; the marker is carried in `gate_output` uncurated; the reader consults stderr markers, not just TAP stdout. The `TMPDIR=$(cd / && mktemp -d)` pin stays byte-unchanged at all gate-run sites (already asserted by `refinery-surface.test.sh` PRESENCE CHECK 4 — do not disturb its `TMPDIR=` greps). **(path contract)** The template injects the absolute worktree root into workflow args where general (unconfined) workflow agents are dispatched, and the done-reporting step asserts every returned file path contains the `.claude/worktrees/<name>/` segment (or the operator-declared worktree root), failing loud otherwise — an authoring convention backed by one assertion, not a new hook (these agents are unconfined by design; the confined `war-worker` case is already mechanically denied by the scope hook, recorded as resolved). Tests: both-surfaces drift assert for the marker rule (token-anchored, case-tolerant mid-sentence phrase), a fixture check for the path-contract assertion (a returned path outside the worktree root fails loud), and PRESENCE CHECK 4 stays green.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.9 — Doctrine docs: ADR 0031 + ADR 0017 addendum + CONTEXT.md**
- Files: `docs/adr/0031-guard-coverage-by-equivalence-class.md` (new), `docs/adr/0017-packaging-floor-docker-gate-ratified-backstops.md`, `CONTEXT.md`
- Plan slice: ADR 0031 (renumbered from the spec's "00NN" — plans 1–6 claim 0023–0030; re-resolve against `docs/adr/` at land time): guard coverage is enumerated by equivalence class and enforced by standing meta-guards — records the five conventions (`..` traversal shapes, git verb classes, YAML negation blocks, subtree search roots, rename prose exclusion) and why per-incident hand-fixing provably fails (the recurrence record). ADR 0017 **addendum** (append a dated addendum section to the existing file — never rewrite the ratified body): the packaging floor is Added/Renamed/Copied-only by design; Modified/Deleted packaging breakage belongs to the docker-build gate. CONTEXT.md: the five terms verbatim from spec §6 — **Traversal equivalence class**, **Verb equivalence class (absence guard)**, **Subtree-anchored search root**, **Floor⊆gate parity**, **Precondition marker**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1.

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). The Status blurb must phrase the rename-guard change **by effect** — Task 1.4's guard now ignores prose regions, but quoting a guarded token in the blurb would test that exclusion in production; keep it plain (the recorded release-blurb trap this very plan fixes).
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Stderr-marker rule is prompt-layer** (a model can still misclassify a `gate_failed`) · why deferred: the rule is defense-in-depth behind the `TMPDIR` pin, not a mechanical gate — spec §8 · runner: the first live `/war` run with a gate failure (phase report shows the classification + marker carried uncurated) + `/red-team`.
- **Path contract is a convention for unconfined agents** · why deferred: general workflow agents are unconfined by design — one assertion, not a hook; spec §9 declines a new hook · runner: the done-reporting fixture check each run; the confined-worker denial stays the mechanically-enforced case.
- **Meta-guard allowlist discipline** (a `# guard-conventions: allow` tag could be abused to suppress a real hit) · why deferred: deliberate-exception ergonomics require human review by design · runner: the lint prints suppressed hits every run; `/red-team` reviews allow-tags when this plan is red-teamed.
- **Guard-suite hermeticity across environments** (criterion 4's same-verdict-in-worktree-and-main check) · why deferred: proving it needs both environments live; the lint prevents the class, the dual run proves the instance · runner: `/red-team` sandbox (runs the suite from both roots) + the next `/war` run's gate.

## Notes / conscious deviations

- **Four operator-ratified conversion deltas (2026-07-08 volley):** (1) **RED-TEAM CORRECTION (`wf_5beb4a06-14b`):** the original delta claimed the spec's "ABSENCE CHECK 2 + 3 closed" was false against the tree and that Task 1.3 must add the `switch origin/` scan — this was itself inverted. The tree already carries a live, green ABSENCE CHECK 3 scanning `switch origin/` (mirroring ABSENCE CHECK 2); the spec was accurate. Task 1.3 is reduced to its only genuinely-absent residual: the enumerating verb-class maintenance comment (`checkout | switch`); the scan is NOT re-added; (2) the new ADR renumbers to **0031** (plans 1–6 claim 0023–0030); the ADR 0017 addendum targets the existing `0017-packaging-floor-docker-gate-ratified-backstops.md`; (3) the rename-blurb guard target is **pinned to `skills/war-machine/war-pipeline-structure.test.sh`** — the file verified to carry the `war-survey-corps` token guard (the spec hedged "e.g."); (4) `REL_GUARD_PRECONDITION_FAILED` is a **real emitted marker** (verified in `validate-worktree-scope.test.sh`), so the reader contract cites it as the live example rather than a hypothetical.
- **Cross-plan contention (for the roadmap table):** `workflow-template.js` + `workflow-template.test.mjs` shared with plans 1, 2, 3, 5, 6 (the campaign's hottest pair); `agents/war-refiner.md` with plans 1, 2; `war-config.mjs` + `war-config.test.mjs` with plans 3, 4; `CONTEXT.md`, `docs/adr/`, release slots with all. Unique to this plan: both `hooks/validate-worktree-scope.*`, the new `hooks/guard-conventions.test.sh`, `refinery-surface.test.sh`, `war-pipeline-structure.test.sh`, `assert-test-in-diff.test.sh`, `assert-packaging-in-diff.sh`. Roadmap serializes; every task rebases onto landed content.
- **No shared helper library** (spec §9): one live negation site and two absence-guard consumers — the convention + meta-guard is the enforcement; a helper waits for a third distinct consumer.
- **The `..` widening deliberately does NOT touch the floors or the advisory Bash hook** — verified adequate in the spec (`*..*` on refs; relative targets advisorily skipped); scope is `validate-worktree-scope.sh` only.
- **Packaging floor's diff-collection arm is byte-unchanged** — the Modified-only no-op is ratified, not fixed; the decision is recorded where it executes (header) and where it's governed (ADR 0017 addendum).
- **Parity test reads `resolveGate` output, not source** — a semantics-preserving refactor of `resolveGate` must not break it (spec §8).
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all four deltas approved as-is.
