# Servitor provenance gate robustness — indent-agnostic extractor, accurate `|| true` comment, plan-prose verify-and-close Implementation Plan

**Goal:** a cohesive shell-gate sweep over [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh)
and its companion plan. Three nits, all in the same fail-closed-YAML-extraction root-cause family: **#247** the extractor
hard-codes 2-space indent (latent fail-closed lockout); **#248** the `|| true` comment over-claims a grep rescue the
awk|sed pipeline never had; **#249** a stale already-remediated plan-prose mismatch (verify-and-close, no re-implementation).
Smallest correct change per nit, no speculative scope.

**Source spec:** [`docs/specs/2026-06-30-servitor-provenance-gate-robustness-design.md`](../specs/2026-06-30-servitor-provenance-gate-robustness-design.md).
**Roadmap (authoritative version source):** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md).
**Memory slugs:** `yaml-extraction-indent-coupling-in-shell-gate`, `awk-sed-exit-zero-on-no-match-comment-trap`,
`plan-prose-top-level-vs-nested-key-impl-mismatch`, `verify-task-no-op-is-correct-when-already-covered`,
`frontmatter-tools-negation-check-single-line-only`, `task-prompt-suite-count-stale-after-stacking`,
`version-slots-no-cross-slot-consistency-test`, `stacked-per-branch-releases-make-main-lag-cumulative`.

## Coordination

- **Target version:** **v0.7.10** (LOW severity — latent-correctness + comment-accuracy + doc-fidelity).
- **landOrder:** 3 (third in the audit-remediation stack: v0.7.8 → v0.7.9 → **v0.7.10**).
- **Integration base:** the **landed tip of Spec 2 (v0.7.9)**, per the roadmap. War this plan on that tip, not on master.
- **Isolated file lane:** the only behavioral surface is `hooks/validate-servitor-provenance.sh` (+ its `.test.sh`).
  Per the roadmap surface map this file is touched by **Spec 3 only** — no cross-spec contention. The *single* coupling
  to the rest of the stack is the four shared version slots, which is why this lands serially (below).
- **Four-slot serial-land note:** a release bump **REPLACE-in-place**s the four canonical slots in lockstep (no badge):
  [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`;
  [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and**
  `plugins[0].version`; [`README.md`](../../README.md) `## Status` line **plus** its `Builds on vX` clause. Only one
  spec can hold a given number, so the stack **MUST land serially** (memory `stacked-per-branch-releases-make-main-lag-cumulative`).
  No cross-slot consistency test exists — verify all four slots + the `Builds on` clause **by hand** at the release
  commit (memory `version-slots-no-cross-slot-consistency-test`).
- **Standalone fallback:** if this plan is run off **current master (v0.7.7)** instead of the stack, re-baseline the
  release to the **next free patch by construct** (e.g. v0.7.8) and drop the prior-tip pin. The roadmap is the
  authoritative version source; resolve the real next number at land time, never hardcode a leap over an empty stack.

## Operator decisions — RESOLVED (bake exactly)

- **#247 — widen BOTH awk tokens, not one (CORRECTS the spec).** The spec's single-token wording is insufficient.
  The extractor's awk on `validate-servitor-provenance.sh:71` carries **two** indent-coupled tokens on the **same
  line**: the provenance pattern `/^  provenance:/` **and** the block-exit guard `found && /^[^ ]/{exit}`. With only the
  pattern widened, a **TAB-indented** `provenance:` line still fails closed: the guard `/^[^ ]/{exit}` treats a tab-led
  line as out-of-block (a tab is not a space) and aborts the awk *before* the provenance match. So widen both:
  `/^  provenance:/` → `/^[[:space:]]+provenance:/` **AND** `/^[^ ]/{exit}` → `/^[^[:space:]]/{exit}`. ACCEPT fixtures
  (all must pass): **2-space, 4-space, AND tab**; plus keep a **DENY** case (absent / mis-placed tag → exit 2). This is
  a two-token diff and makes the spec's own "accept any leading whitespace" non-goal literally true.
- **#248 — reword the comment to the real mechanism.** The `awk|sed` pipeline (frontmatter extract, then provenance
  extract) has **no grep** anywhere, and `get()` (line 20) already carries its own `|| true`. awk and sed exit **0** on
  no-match (unlike grep's exit 1), so a tag-less write yields an empty `$provenance` and is denied by the empty-string
  `*)` arm of the tier `case` (line 78-80) — *not* by a `|| true` rescue of a grep exit-1. Reword the comment block to
  name that; recast `|| true` as **cheap defense-in-depth** for a future grep stage. Keep `|| true` on both extraction
  stages. No code-line change.
- **#249 — VERIFY-AND-CLOSE, already remediated by `ea5e132`.** No re-implementation. Re-grep the plan for any residual
  top-level-asserting wording; the remaining mentions are disclaimers/test-case context (verified). Close with a note.
- **Stale runner gloss fix:** the spec's gate line says "12 = 6 hooks + 5 skills"; the real HEAD count is
  **12 `.test.sh` = 6 hooks/ + 6 skills/** (the sixth skill runner is `skills/red-team/manifest-provenance.test.sh`).
  This plan states the correct breakdown.

---

## Phase 1 — Extractor indent relaxation + comment reword (#247 + #248, one task, same file)

### Task 1 — `validate-servitor-provenance.sh`: accept any leading-whitespace indent + correct the `|| true` comment (#247, #248)

#247 (code + test) and #248 (comment) both edit `hooks/validate-servitor-provenance.sh`; they are **one task** so two
parallel WAR tasks never rebase-conflict on the same file (memory
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`). STRICT TDD: failing test FIRST.

**Files:**
- modify [`hooks/validate-servitor-provenance.test.sh`](../../hooks/validate-servitor-provenance.test.sh) — add
  non-2-space ACCEPT fixtures (4-space + tab) and assertions.
- modify [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) — widen the two awk
  tokens (#247); reword the comment block (#248).

**`requiresTest`: true** — the `.test.sh` is the hook's mapped test; the new ACCEPT cases make the relaxation load-bearing.

- [ ] **Step 1 — RED: add the non-2-space ACCEPT cases to `validate-servitor-provenance.test.sh`.** Next to the existing
  `content_with_tier()` helper (the one at L60-62 that emits `"  provenance: $1"`, 2 spaces), add two siblings:
  - `content_with_tier_4space()` emitting the `provenance:` line at **4 spaces**: `"    provenance: $1"` (and `metadata:`'s
    `type:` child at 4 spaces too, so the block is internally consistent).
  - `content_with_tier_tab()` emitting the `provenance:` line **tab-indented**: `"$(printf '\tprovenance: %s' "$1")"`
    — build the tab with `printf '\t'`, NOT a literal that an editor may convert to spaces (memory
    `tr-escape-single-quote-strips-literal-not-newline`: shell-quoting eats escapes; use `printf`).
  Then add two `expect` assertions, modeled on the existing Case 2 ACCEPT block (L93-100):
  - `expect "4-space metadata.provenance -> allow" 0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier_4space 'code-verified')")")"`
  - `expect "tab-indented metadata.provenance -> allow" 0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier_tab 'code-verified')")")"`
  Keep the existing 2-space ACCEPT (L93-100), no-metadata DENY (L83), provenance-absent DENY (L87), and bad-tier DENY
  (L105) cases as the regression floor. Payloads stay `jq -nc --arg` in the **nested** `metadata:`→`provenance:` shape
  (memory `printf-json-escaping-vacuous-test-case`).
- [ ] **Step 2 — Run `bash hooks/validate-servitor-provenance.test.sh` → RED.** Both new cases fail: the unchanged
  `/^  provenance:/` denies the 4-space line, and the unchanged `/^[^ ]/{exit}` guard aborts on the tab line → exit 2,
  expected 0. (If a worker sees the 4-space case *pass* pre-fix, the fixture is wrong — it must use literal **>2**
  leading spaces.)
- [ ] **Step 3 — GREEN (#247): widen BOTH awk tokens.** In the `provenance=$(...)` pipeline (the awk on **line 71**:
  `awk '/^metadata:/{found=1; next} found && /^  provenance:/{print; exit} found && /^[^ ]/{exit}'`), change:
  - `/^  provenance:/` → `/^[[:space:]]+provenance:/`
  - `found && /^[^ ]/{exit}` → `found && /^[^[:space:]]/{exit}`
  Re-run the test → GREEN (all of 2-space, 4-space, tab now ACCEPT; DENY cases still exit 2). **Load-bearing check:**
  reverting *either* token to its narrow form must re-fail a new case (revert the provenance token → 4-space + tab
  re-deny; revert only the guard → tab re-denies). State this in the commit body so a future re-tightening trips the test.
- [ ] **Step 4 — GREEN (#248): reword the comment block (no code-line change).** The comment block at **lines 57-62**
  (the `# Guard the extraction pipeline with || true so grep's no-match exit (1) ...` lines **57** and **60-62**,
  including the `# ponytail:` lines) currently attributes the deny path to a grep exit-1 rescue. Replace it with the
  real mechanism: `awk`/`sed` exit **0** on no-match (unlike grep's exit 1) → empty `$provenance` → denied by the
  empty-string `*)` arm of the tier `case` (lines 78-80); `get()` (line 20) already carries its own `|| true`; keep
  `|| true` on both extraction stages as **cheap defense-in-depth** for a future grep stage. Do **not** narrate the word
  "grep" in a way that re-asserts a live grep dependency — the reworded ponytail line may reference "unlike grep" as the
  *contrast* that explains why `|| true` is belt-and-suspenders here, since the pipeline is awk|sed. No production code
  line changes; the `.test.sh` stays byte-green.
- [ ] **Step 5 — Run the full gate → green** (the `node --test` glob + all 12 `.test.sh`; see ## Gate). Only
  `validate-servitor-provenance.test.sh` changed behavior; everything else stays green.
- [ ] **Step 6 — Commit** — `fix(war): provenance extractor accepts any leading-whitespace indent + correct the || true comment to the awk/sed-exit-0 deny mechanism (#247, #248)`
- **Closes:** #247 (indent-agnostic extractor + load-bearing 2/4-space/tab ACCEPT fixtures), #248 (comment names the
  real awk/sed-exit-0 deny path; `|| true` kept as defense-in-depth).

---

## Phase 2 — Verify-and-close #249 (no file edit)

### Task 2 — Confirm the plan-prose top-level-vs-nested mismatch is already remediated, then close #249

Already fixed by commit `ea5e132` (nested provenance extract). This is a **verify-and-close**, not a re-implementation
(memory `verify-task-no-op-is-correct-when-already-covered`). No `.md` edit; **no commit** (no file change).

**`requiresTest`: false** — no behavioral surface. The deliverable is the grep post-condition + the issue close.

- [ ] **Step 1 — Re-grep the plan for residual top-level-asserting wording.** Run
  `grep -n 'top-level' docs/plans/2026-06-29-memory-provenance.md`. At HEAD this returns exactly four hits — lines
  **75** ("**not** a top-level `^provenance:` line"), **90** ("never a top-level `provenance:` key"), **101**
  ("top-level `provenance:` key" inside the same negation clause), and **220** (a test-spec table row,
  "nested-value extract (not top-level)") — **all disclaimers/test-case context**, none
  *describing* the field as top-level. (Use the plain-`top-level` grep, not the spec's narrower criterion-3 regex which
  only matches a subset — memory note from the grill.) Confirm no hit asserts the field IS top-level.
- [ ] **Step 2 — Close #249** with `gh issue close 249` and a one-line note: resolved-by-`ea5e132`; the remaining
  `top-level` mentions in the plan are disclaimers, verified by re-grep. Use the **`Ljferrer`** gh account (memory
  `gh-account-must-be-ljferrer`).
- **Fallback (low-prob):** if a *describing* line surfaces (one that asserts the field is top-level), do the one-line
  nested-qualify reword in **this same task** per the spec's stated fallback, then close. The grep is expected to find
  only disclaimers.
- **Closes:** #249 (verify-and-close, resolved-by-`ea5e132`).

---

## Phase 3 — Release v0.7.10

### Task 3 — Version bump v0.7.10 + full gate green

Bump only after the v0.7.8 + v0.7.9 stack has landed and this plan is based on the v0.7.9 tip. **Standalone fallback:**
if run off master, resolve the next free patch by construct (not a hardcoded 0.7.10) and adjust the `Builds on` clause
to the real prior version.

**Files:** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version` (line 4);
[`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` (line 7) **and**
`plugins[0].version` (line 14); [`README.md`](../../README.md) `## Status` (REPLACE-in-place, line 224) — **including
its `Builds on vX` clause**.

- [ ] **Step 1 — Bump all four slots `0.7.9` → `0.7.10`** (REPLACE-in-place, no badge). In the README `## Status`
  paragraph, replace the leading version literal **and** update the trailing `Builds on v0.7.6` clause to `Builds on
  v0.7.9` (the prior landed tip in the stack). Status copy: servitor provenance gate robustness — indent-agnostic
  extractor (accepts any leading whitespace: 2-space / 4-space / tab) + corrected `|| true` deny-mechanism comment.
  (memory `release-bump-slots-canonical-no-badge`, `release-status-is-replace-slot-not-empty-field`.)
- [ ] **Step 2 — Verify all four slots + the `Builds on` clause by hand** — no cross-slot consistency test exists
  (memory `version-slots-no-cross-slot-consistency-test`). Run the full gate → green.
- [ ] **Step 3 — Commit** — `chore(release): v0.7.10 — servitor provenance gate robustness (indent-agnostic extractor + corrected || true comment)`

---

## Gate

Run at the release commit — the self-discovering multi-runner. Quote the `.mjs` glob (bash 3.2 under-covers it
unquoted):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- **6 `.test.mjs`** — `skills/_shared/provision.test.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`,
  `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/war/assets/land-decision.test.mjs`,
  `skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.test.mjs`.
- **12 `.test.sh` = 6 hooks/ + 6 skills/** (the spec's "6 + 5" gloss is stale — corrected here):
  - hooks/ (6): `clean-surface-hook-only-confinement`, `clean-surface-war-worktree`, `validate-auditor-git`,
    `validate-servitor-provenance`, `validate-worktree-scope`, `warn-bash-write-scope`.
  - skills/ (6): `red-team/manifest-provenance`, `war/assets/assert-test-in-diff`, `war/assets/provision-worktrees`,
    `war/assets/refinery-surface`, `war/assets/scout-manifest-surface`, `war/references/schemas-manifest`.

The only behavioral surface is `validate-servitor-provenance.test.sh`; it must stay green with the new 4-space + tab
ACCEPT cases. (memory `task-prompt-suite-count-stale-after-stacking`: the runner set is self-discovered, never a
hardcoded count — the breakdown above is documentation, the `find` is authoritative.)

**Stale-tip audit guard:** an auditor on a pre-impl worktree tip will see the new ACCEPT cases as "test unrun" / a
spurious land-halt. Verify the real tip and re-run the gate at the actual task commit before treating any "test unrun"
as blocking (memory `audit-worktree-pre-impl-tip-stale-verdict`).

## Coverage

| Issue | Task | Coverage |
|-------|------|----------|
| #247 | Phase 1 / Task 1 | full — widen BOTH awk tokens (`/^[[:space:]]+provenance:/` + `/^[^[:space:]]/{exit}`) + load-bearing 2-space/4-space/tab ACCEPT fixtures + DENY floor |
| #248 | Phase 1 / Task 1 | full — reword `|| true` comment to the awk/sed-exit-0 → `*)` deny mechanism; keep `|| true` as defense-in-depth (no code-line change) |
| #249 | Phase 2 / Task 2 | verify-and-close — re-grep `2026-06-29-memory-provenance.md` (3 disclaimer hits expected), close as resolved-by-`ea5e132`; no re-implementation |

## Deliberate simplifications (`ponytail:`)

- **#247 fix is a character-class swap, not a YAML parser.** No YAML dep in this bash-3.2 hook; the extractor's job is
  "find the nested provenance child" and `/^[[:space:]]+provenance:/` + the widened guard does exactly that. Upgrade
  path: a real parser only if the frontmatter shape grows beyond a single nested scalar (it won't here).
- **#248 keeps `|| true`** rather than deleting it: harmless, and it becomes load-bearing the day a future stage uses
  grep. Only the prose was wrong.
- **#249 closes with no durable artifact** — closure rests on a manual grep at land time. Acceptable per the roadmap
  (the code/doc is already correct; only the issue needs closing). If the grep ever finds a describing line, the
  one-line reword fallback runs in the same task.
- **Indent normalization is out of scope** — the gate accepts *any* leading whitespace; it does not enforce a canonical
  indent. The security model never cared about indent (spec non-goal).
