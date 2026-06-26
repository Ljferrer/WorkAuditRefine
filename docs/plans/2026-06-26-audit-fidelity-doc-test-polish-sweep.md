# Audit-Fidelity Doc-Drift & Test-Polish Sweep Implementation Plan (#117 · #125 · #127 · #136 · #151 · #160)

**Goal:** retire every residual nit/minor left behind by the F03–F12 audit-remediation wave — tighten loose test
assertions to structural forms, delete dead code/unused imports, close the few remaining coverage cells, correct
stale comments/titles/attribution, and reconcile doc-drift from the F03 (auditor baseline) and F06 (`covenPolicy`
default) flips. **Quality-only:** no shipped runtime path changes semantics; every gate runner stays green at every
task boundary.

**Closes:** #117, #125, #127, #136, #151, #160 (the six WAR follow-up bundles).

**Scope (v0.6.9 — quality-only sweep; PLAN 4 of the [open-issue remediation stack](2026-06-26-open-issue-remediation-roadmap.md)):**
each sub-item is one of: tighten a weak assertion · delete dead code/unused import · add a missing test cell · fix a
stale comment/title/attribution · correct doc-drift · drop one unwired dead flag · cosmetic shell fix. Strict TDD —
each code change pairs a failing→green test; each pure-doc/comment change pairs with a green gate and (where a test
can assert the text) a structural assertion. **Full per-item anchors live in the
[spec](../specs/2026-06-26-audit-fidelity-doc-test-polish-sweep.md) §1 (re-read at HEAD and confirmed); this plan
carries the task decomposition + decisions.**

**Operator decisions (2026-06-26, grill-with-docs):**
The spec's four open questions are micro-scope, none architectural — resolved here:
- **OQ2 — hooks.json reorder (#160 T2b) → INCLUDE.** A one-line JSON move (auditor-git guard before
  `warn-bash-write-scope`) with a `jq . hooks.json` validity check; functionally neutral (disjoint agent types,
  block-on-any-exit-2) but cheap and plan-faithful.
- **OQ3 — `war-auditor.md` execution-evidence lens doc (#117 item 3) → DEFER.** Marked Optional in the issue; it
  would expand the T2.4 wave for a pure doc add. Defer it and **leave #117 open-with-note on that one sub-item**
  rather than silently closing it (D7).
- **OQ1 — #117 L796 exact serialization → resolve at implementation.** The structural regex must match however
  `auditPrompt` actually serializes `{unit:5,integration:2}`; the implementing task reads the live emission first,
  then keys the assertion on the threaded values (`plan-line-number-refs-stale-use-construct-locator`).
- **OQ4 — `skills/war-room/SKILL.md` covenPolicy surface → grep both.** Fix whichever SKILL surface still asserts
  `auto (default)`; a no-op for a surface already clean is correct (`verify-task-no-op-is-correct-when-already-covered`).
- **Verified-corrections to issue text are authoritative (D6):** (a) #127's genuinely-missing decideLand cells are
  **empty-landed×HARD** and **non-empty-landed×SOFT** (the issue swapped the labels; the live file already covers the
  other two); (b) #151 T3's `warned` var and `C5` label are already gone — the residual is the `printf`-interpolated
  `mk()` payload; (c) #117 L796 passes vacuously on base boilerplate today.

**Architecture:** three clusters — (A) all `war-config.test.mjs` changes (#125, #127, #117 L333) share one file →
serialized; (B) distinct-file fixes (#136 provisioning, #151 confinement, #160 doc-drift, #117 workflow-template
test) → parallel-eligible; (C) one release.

**Dependency / ordering:** **plan 4 in the stack — land AFTER plan 2.** It rewords `workflow-template.js:26` (a
header comment, disjoint from plan 2's loop/LAND edits) — same file, so plan 2 lands first to avoid a needless
rebase. No other cross-plan overlap except the four version slots. Lands on plan 3's tip → **v0.6.9**.

**Tech stack:** ESM `*.mjs` under `node --test`; POSIX `sh` assets + `hooks/*.test.sh` on macOS bash 3.2.57 (`jq`
payloads); agent/ADR/spec markdown.

**Gate (for `/war`):** the F12 multi-runner — run the FULL gate **post-merge** (a cross-branch merge can add
`*.test.sh` runners a single `node --test` pass misses, `gate-under-covers-after-cross-branch-merge-new-runner`):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [spec](../specs/2026-06-26-audit-fidelity-doc-test-polish-sweep.md) §1 (verified anchors), §3
(decision record D1–D9). Memory anchors: `allowlist-catch-all-token-defeats-meta-guard` (#127),
`node-breadth-assertion-test-js-overclaims` (#125), `weak-test-assertion-passes-without-feature-being-exercised`
(#117), `teardown-phase-force-flag-unwired` (#136), `printf-json-escaping-vacuous-test-case` (#151),
`tr-escape-single-quote-strips-literal-not-newline` (#160), `default-flip-must-audit-all-doc-surfaces` (#160),
`adr-policy-table-entry-vs-mechanism-attribution` (#151).

## Build order (for `/war`)

- **Phase 1 — `war-config.test.mjs` sweep (SERIAL, one branch):** T1.1 → T1.7 (shared file; stack to avoid same-file
  rebase conflict, `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).
- **Phase 2 — distinct-file fixes (PARALLEL-eligible):** T2.1 (#136), T2.2 (#151), T2.3 (#160), T2.4 (#117).
- **Phase 3 — release:** T3.1 (v0.6.9), full multi-runner gate green post-merge.

---

## Phase 1 — `war-config.test.mjs` sweep (SERIAL)

Each task: change → `node --test 'skills/**/*.test.mjs'` green (the L330-345 drift-guard already pins the array, so
comment/import changes are gate-covered). Anchors per spec §1 (#125, #127, #117 L333).

- **T1.1 — Fix L333 comment + drop `statSync` (#117 L333; #125/#127 L3).** Rewrite the misattribution comment to
  `// dep-failed was the Task 1 (F02) foundation; land_stale pre-existed; Task 4 (F04/R3) added gate-evidence (6 items total).`;
  delete the unused `statSync` from the L3 import. No new test; gate stays green.
- **T1.2 — Strengthen L294/L299 prune asserts (#125).** `result.includes("-not -path '*/node_modules/*'")` and
  `result.includes("-not -path '*/.git/*'")` (mirror the strong form at L392-393); red→green against `resolveGate`.
- **T1.3 — Narrow node-breadth walk to `.test.mjs` (#125 L399-413).** Drop `|| name.endsWith('.test.js')` (L403,
  L417) so the breadth test claims exactly what `skills/**/*.test.mjs` guarantees. **Rejected:** adding a `.test.js`
  coverage assertion (would over-claim breadth the gate doesn't run). Green; still finds the 4 `.test.mjs` suites.
- **T1.4 — Add `.claude/worktrees` to the prune list (#127 L17).** `pruned = ['node_modules', '.git', '.claude/worktrees']`;
  unit assertion that `walkFiles` skips a synthesized `.claude/worktrees/...` path (prevents nested-worktree
  double-count false-fails from a main checkout).
- **T1.5 — Add two decideLand cells (#127).** Red→green via the existing `buildInlineDecideLand()` harness
  (L764-826): **empty-landed × HARD → `held:escalation`** and **non-empty-landed × SOFT → `landed`** — assert both
  `inlineDecideLand(args) === decideLand(args)` and the literal verdict (exercises `land-decision.mjs:15-16`).
- **T1.6 — Tighten `DATA_MIRROR_ALLOWLIST` (#127 L879).** Remove the bare `'MIRROR of'` catch-all; keep the
  field-specific entries (the `workflow-template.js:69` marker is still classified by them). Add an
  anchor/count assertion that no bare `'MIRROR of'` remains (`allowlist-catch-all-token-defeats-meta-guard`);
  meta-guard L848-910 stays green.
- **T1.7 — Rename L738 title + delete dead `/gi` (#127).** Rename to
  `drift-guard(F07): inline covenSeats falls back to DEFAULTS.audit.lenses when task has no lenses` (preserve the
  `'drift-guard(F07): inline covenSeats'` prefix the registry at L912-944 checks); delete the dead `markerPattern`
  `/gi` block (L950-953), keeping the `/i` count at L955.

---

## Phase 2 — distinct-file fixes (PARALLEL-eligible)

**T2.1 — #136 provisioning (`provision-worktrees.{sh,test.sh}`).**
- **Drop `--force`** from `cmd_teardown_phase`: remove the `force=0` init (L462), the `case "--force"` arm (L466),
  and `[--force]` from the usage string (L481). **Rejected:** wiring `force` into the `git branch -D` (L565) — no
  caller needs to bypass the F09 fail-loud ownership/checkout guard; deletion is the smaller, safer fix
  (`teardown-phase-force-flag-unwired`). Test (red→green): `teardown-phase --force …` now exits non-zero with
  `unknown flag` (the L477 `-*) die` arm).
- **Tighten SI.1** (`provision-worktrees.test.sh:1437`) to `grep -qiE 'not a valid object|invalid object|fatal'`
  (git-stderr-only tokens absent from `provision-worktrees.sh:190`'s template); confirm it goes red if the stderr
  capture is dropped, green with it.
- **Rewrite the L186-187 stderr-capture comment** to describe the temp-file capture actually used at L188-191.
- **Verify T3c/T3d** reach the fail-loud integration-branch-delete path (no-op expected; document if so,
  `verify-task-no-op-is-correct-when-already-covered`).

**T2.2 — #151 confinement (`validate-worktree-scope.{sh,test.sh}`, `war-worker.md`, ADR 0002).**
- **T1:** extend the frontmatter Bash-negation test (`validate-worktree-scope.test.sh:209-216`) to scan the **whole
  frontmatter block** (inline `tools:` AND block-style `- Bash`), not just a single `tools_line`.
- **T2:** add a back-compat test that a refiner/main-session (`agent_type` absent or `*war-refiner*`) write to a
  `..`-bearing path is **denied** (exit 2), plus a clean-path **allow** assertion (fail-open preserved for non-`..`),
  plus a header comment at `validate-worktree-scope.sh:37` noting the `..`-deny is intentionally pre-`case` and
  applies to ALL agents (`dotdot-guard-applies-to-all-agent-types`, ratified D5).
- **T3:** convert the `mk()` payload helper (L23) + any `printf`-interpolated JSON to `jq -nc --arg`
  (`printf-json-escaping-vacuous-test-case`); assert (grep in the task's verification) no dead `warned` var remains.
- **T4:** add a short servitor-confinement paragraph to `agents/war-worker.md`; reword `docs/adr/0002-scope-by-agent-type.md:28-30`
  to **allowlist-primary** — "the capability allowlist is the primary confinement; the `agent_type` hook (and the
  `..` guard) are defense-in-depth" (`adr-policy-table-entry-vs-mechanism-attribution`, D4).

**T2.3 — #160 doc-drift + shell (`workflow-template.js`, `validate-auditor-git.sh`, `hooks.json`, `war-room-design.md`, SKILL surfaces).**
- **T1:** reword `workflow-template.js:26` to:
  `// auditors receive the absolute worktree path and self-serve the change set via read-only git (git diff <integrationBranch>...<task.branch>, three-dot); no main-checkout baseline.`
- **T2a:** `validate-auditor-git.sh:74` `tr -d '\n'` → `tr -d $'\n'` (ANSI-C quoting strips the real newline;
  `tr-escape-single-quote-strips-literal-not-newline`). Cosmetic (deny-message only).
- **T2b (INCLUDED, OQ2):** reorder `hooks.json` so the `validate-auditor-git.sh` block precedes
  `warn-bash-write-scope.sh`; assert `jq . hooks.json` stays valid.
- **T3a/T3b:** `docs/specs/2026-06-18-war-room-design.md:63` JSON `"covenPolicy":"auto"` → `"all"`; reword the
  L83-87 field-ref so the `all` bullet carries "the default".
- **T3c (OQ4):** `skills/war/SKILL.md:27` `auto (default)` → `all (default)`; **grep `skills/war-room/SKILL.md`** for
  the same stale pairing and fix if present (no-op if clean). Verify by a grep assertion that **no** surface still
  says `covenPolicy … auto … default` (`default-flip-must-audit-all-doc-surfaces`).
- Test: `validate-auditor-git.test.sh` stays green; doc changes proven by the gate staying green + the grep assertion.

**T2.4 — #117 workflow-template test (`workflow-template.test.mjs`; war-auditor.md lens doc DEFERRED per OQ3).**
- Replace the loose `workflow-template.test.mjs:796` `/unit|integration|tests/i` with a **structural** assertion
  keyed on the threaded `{unit:5,integration:2}` values (e.g. `/"?unit"?\s*[:=]\s*5/` AND `/"?integration"?\s*[:=]\s*2/`).
  **Read the live `auditPrompt` emission first** to pin the exact serialization (OQ1), then assert on the threaded
  values; confirm it fails against a prompt with the summary stripped
  (`weak-test-assertion-passes-without-feature-being-exercised`).
- The optional `execution-evidence` lens doc in `agents/war-auditor.md` is **deferred** (OQ3) — leave #117
  open-with-note on that sub-item.

---

## Phase 3 — Release & verify

**T3.1 — Bump v0.6.9 + full multi-runner gate green (post-merge).**
- Bump `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` (L7) AND
  `plugins[0].version` (L14); `README.md ## Status` (replace-in-place; "Builds on v0.6.8" lineage ok). No badge.
  **Roadmap-assigned v0.6.9** (plan 4); take the next free patch if the stack order shifts.
- Run the FULL self-discovering gate (node glob + ALL `*.test.sh`) **after all Phase-1/2 branches converge** (F12
  lesson) → every runner green.
- Commit — `chore(release): v0.6.9 — audit-fidelity doc-drift & test-polish sweep (#117 #125 #127 #136 #151 #160)`

---

## Test plan

**Gate** = the multi-runner above; run after every task and once more post-merge. Specific assertions / prior-art per
spec §5 (the table maps each sub-item to its new/changed assertion and the prior-art it mirrors). Highlights:
- #117 L796 → `/"?unit"?\s*[:=]\s*5/` AND `/"?integration"?\s*[:=]\s*2/` (mock `{unit:5,integration:2}` at `:808`).
- #127 decideLand ×2 → `inline === decideLand` + literal verdict for empty×HARD and non-empty×SOFT.
- #136 `--force` → `teardown-phase --force` exits non-zero `unknown flag`; SI.1 → git-only stderr tokens.
- #151 T1/T2/T3 → whole-frontmatter Bash scan; refiner/main `..`→exit 2 + clean→allow; `jq -nc --arg` payloads.
- #160 docs → grep proves no surface asserts `covenPolicy … auto … default`; `jq . hooks.json` valid after reorder.

**Regression guard:** the whole existing suite stays green at every task boundary and post-merge (the sweep changes
no runtime semantics).

## Out of scope
- Any behavior change to the audit/coven/land/provision runtime paths (F03/F06/F07/F12 are shipped + ratified).
- The deferred memory-root anchoring for the `..` guard (`validate-worktree-scope.sh:41`, #58).
- New lens *implementations* (only the optional `execution-evidence` lens *doc* was in scope — and it's deferred, OQ3).

## Notes / conscious deviations (ratify in `/red-team`)
- **Two optional sub-items handled explicitly:** hooks.json reorder INCLUDED (OQ2); war-auditor.md lens doc DEFERRED
  with #117 left open-with-note (OQ3). Neither silently dropped.
- **`--force` removed, not wired (#136, D3)** — preserves the F09 fail-loud ownership safety; a force-override is a
  footgun with no caller.
- **Issue-text corrections (D6)** drive the tasks (decideLand cells, `mk()` payload, vacuous L796) — act on verified
  live state, not the issue prose.

## Open decisions — RESOLVED (grill-with-docs, 2026-06-26)
1. **hooks.json reorder → INCLUDE** (OQ2).
2. **war-auditor.md lens doc → DEFER**, #117 sub-item open-with-note (OQ3).
3. **#117 L796 serialization → resolve at implementation** by reading the live `auditPrompt` emission (OQ1).
4. **`war-room/SKILL.md` covenPolicy → grep both surfaces**, fix whichever still asserts `auto (default)` (OQ4).
5. **Version** roadmap-assigned v0.6.9 (plan 4); Release task takes the next free patch if the order shifts.
