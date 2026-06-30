# Auditor git-guard read-only `git -C <path>` + reworded gate-audit pin Implementation Plan (#222)

**Goal:** the post-merge gate-audit prompt orders the read-only auditor to confirm its worktree is pinned to the
integration tip by running `[ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]` — but the auditor runs
under `hooks/validate-auditor-git.sh`, a fail-closed read-only Bash guard that denies that command on **two** grounds:
the char allowlist forbids `$ ( ) [ ] "`, and `-C` has no arm in the global-flag block or the subcommand extractor (so
`rest` beginning `-C …` falls to `*)` default deny). The pin test therefore **always** exits non-zero, which the
prompt's stale-tip fallback reads as "cannot confirm the pin" → every gate-audit force-downgrades a would-be HARD
execution-evidence finding to a SOFT note (memory `gate-audit-pin-bracket-test-blocked-by-git-guard`). This plan
**teaches the guard the read-only `-C <path>` global flag** (peel a leading `-C <path>` token, then re-enter the
existing subcommand allowlist unchanged) and **rewords the prompt** to a bare `git -C … rev-parse HEAD`
print-and-compare the guard now permits. It explicitly does **NOT** permit the bracket/`$()` form — that reopens the
C5 command-substitution injection vector the char allowlist exists to close; the deny-test for `$()[]` stays green.

**Source spec:** [`docs/specs/2026-06-30-auditor-git-guard-readonly-c-flag-design.md`](../specs/2026-06-30-auditor-git-guard-readonly-c-flag-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the authoritative version source.

This is a **convenience/determinism upgrade, not a correctness blocker** (spec Decision 4): the existing
`git show <sha>:<path>` object-store workaround stays valid; this removes the *forced* SOFT-downgrade so a genuinely
provably-unrun mapped test can land as HARD.

## Coordination

- **Target version:** **v0.7.11**. **landOrder 4** (severity **MED**). **Closes:** issue **#222**.
- **Integration base:** the **landed tip of Spec 3 (v0.7.10)** — the prior plan in the serial stack
  (`docs/specs/2026-06-30-servitor-provenance-gate-robustness-design.md`). This is an **isolated lane**: the roadmap's
  shared-file table marks `hooks/validate-auditor-git.sh` as **"4 only" 🟢**, and the gate-audit pin region in
  `skills/war/assets/workflow-template.js` (~L451-452) is disjoint from Spec 1's land block (~L515-518) and Spec 2's
  no-test loop (~L329-422). No intra-stack file contention.
- **Four-slot serial land (replace-in-place, no badge):** the release bumps the four canonical version slots in one
  commit — `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` **and**
  `plugins[0].version` (two slots); `README.md` `## Status` line (REPLACE-in-place, **not** append; update the
  `Builds on vX` clause too). There is **no cross-slot consistency test** — verify all four by hand at the release
  commit (memory `version-slots-no-cross-slot-consistency-test`).
- **Standalone fallback:** if this is run off current `master` (live HEAD is **v0.7.7**) instead of on the Spec-1→3
  stack, **re-baseline the release to the next free patch off the live tip** and drop the prior-tip pin — do NOT
  hardcode 0.7.11 over an empty stack (memory `stacked-per-branch-releases-make-main-lag-cumulative`). The version
  literal is never authoritative; the operator directive + the actual landed baseline are.

## Build order (for `/war`)

- **Phase 1 — guard + test** (`hooks/validate-auditor-git.sh` + `.test.sh`, one task, `requiresTest: true`). The code
  and its test **land together** — the new GROUP H asserts the peel, so they are one commit.
- **Phase 2 — prompt reword** (`skills/war/assets/workflow-template.js`, one task, `requiresTest: false`). Disjoint
  file; no dep on Phase 1's behavior, but ordered after it so the prompt that exercises the new guard ships on a tip
  where the guard already allows it.
- **Phase 3 — release v0.7.11** (four version slots).

Phase 1 touches only `hooks/`; Phase 2 is the only `workflow-template.js` touch — no intra-plan contention
(memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

---

## Phase 1 — Teach the guard the read-only `git -C <path>` global flag (#222, guard + test)

### Task 1 — `validate-auditor-git.sh` `-C <path>` peel + GROUP H tests

**Files:** `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`. **`requiresTest`: true** — the
`.test.sh` GROUP H is the peel's mapped test.

**Anchors (confirmed at HEAD):** the global-flag deny block is the `case "$rest" in … esac` ending at the
`-p \*|-p) deny … ;; esac` (the global `esac`); immediately below it is the comment
`# Extract the subcommand (first word of $rest).` then `subcmd=""` then the subcommand extractor `case "$rest" in`.
The peel goes **between the global-flag `esac` and that comment** — anchor by the
`# Extract the subcommand` comment, **not** a line number (memory `plan-line-number-refs-stale-use-construct-locator`).
GROUP H appends after GROUP G (the file ends with the summary block after G5).

- [ ] **Step 1 — Write GROUP H (failing first).** Append a `CASE GROUP H: read-only global -C <path>` block to
  `hooks/validate-auditor-git.test.sh` after GROUP G (G5 `git fetch`), using the existing `expect_allow` /
  `expect_deny` / `auditor_cmd` helpers (which already assert **exit 2 + `WAR:` on stderr** for denies — no new
  harness):
  - **H1 (allow):** `expect_allow "H1: git -C /abs/path/_refinery rev-parse HEAD → allowed"` — `git -C /abs/path/_refinery rev-parse HEAD` exits **0**.
  - **H2 (allow):** `expect_allow "H2: git -C /abs/path show HEAD:file.txt → allowed"` — `git -C /abs/path show HEAD:file.txt` exits **0** (proves `-C` works for the other read verb the auditor uses).
  - **H3 (deny — verb allowlist NOT widened):** `expect_deny "H3: git -C /abs/path commit -m x → denied (-C does not widen the verb allowlist)"` — `git -C /abs/path commit -m x` exits **2 + `WAR:`**. **Load-bearing** — proves a write subcommand after `-C` still hits the read-only allowlist's `*)` default deny.
  - **H4 (deny — bare `-C`):** `expect_deny "H4: git -C → denied (global -C with no path/subcommand)"` — `git -C` exits **2 + `WAR:`**.
  - **H5 (deny — bracket/`$()` injection parity):** `expect_deny "H5: [ \"\$(git -C <path> rev-parse HEAD)\" = \"<sha>\" ] → denied (C5 subst parity)"` — the literal old bracket form `[ "$(git -C /abs/path rev-parse HEAD)" = "abc123" ]` exits **2 + `WAR:`** (the char allowlist still forbids `[ ] $ ( ) "`). This proves the reword in Phase 2 does **not** relax injection defense.
  - **Do NOT** add a `git -C -C rev-parse` deny case: the spec's "second `-C` → `*)` default deny" rationale is **wrong** (verified — after peeling the first `-C <path>`, `rest` = `rev-parse HEAD` → ALLOW, harmlessly). Do not assert it denies; omit it.
  - **Keep C5 unchanged** (`git log $(evil) → denied (subst)`) — it is the canonical injection-defense case the peel must not weaken.
- [ ] **Step 2 — Run `bash hooks/validate-auditor-git.test.sh` → RED.** H1/H2 currently **deny** (`rest` begins `-C …`
  → hits the subcommand extractor's `*)` default deny → exit 2), so the `expect_allow` cases FAIL. H3/H4/H5 already
  pass against pre-fix code — that is fine; **H1/H2 going red is the load-bearing proof** the peel is exercised.
- [ ] **Step 3 — Implement the peel** in `hooks/validate-auditor-git.sh`, inserted **after the global-flag `esac`** and
  **before** the `# Extract the subcommand (first word of $rest).` comment:
  ```sh
  # Read-only global -C <path>: relocate cwd, then validate the subcommand normally.
  # -C only changes which repo git runs in; it does NOT add a write verb. The peeled
  # $rest re-enters the read-only subcommand allowlist below, so a write subcommand
  # after -C still denies (see H3). Single path assumed: the char allowlist already
  # forbids spaces inside a path token, so a space-containing path cannot reach here.
  # ponytail: one -C peeled. `git -C -C rev-parse HEAD` peels the first -C then leaves
  # `rev-parse HEAD` → ALLOW (harmless read in ambient cwd) — NOT a default-deny.
  case "$rest" in
    -C\ *)
      rest="${rest#-C }"     # drop "-C "
      rest="${rest#* }"      # drop the <path> token
      ;;
    -C)
      deny "global -C with no path/subcommand" ;;
  esac
  ```
  Note the `// ponytail:` comment **corrects the spec's bogus `git -C -C` rationale** (memory
  `source-comment-lags-emitted-prompt-after-rewrite` — keep the comment true to behavior).
- [ ] **Step 4 — Run the full self-discovering gate → green.** H1/H2 now allow; H3/H4/H5 + C5 still deny; A–G
  unchanged.
- [ ] **Step 5 — Commit** — `feat(war): teach auditor git-guard the read-only -C <path> global flag (#222)`
- **Closes:** the guard half of #222 (spec Validation #1, #2, #3) — the pin command is now runnable, `-C` does not
  widen the verb allowlist, and the bracket/`$()` injection form stays denied.

---

## Phase 2 — Reword the gate-audit pin prompt off the bracket form (#222, dispatched prose)

### Task 2 — `workflow-template.js` gate-audit pin → bare `git -C … rev-parse HEAD` print-and-compare

**Files:** `skills/war/assets/workflow-template.js`. **`requiresTest`: false** — dispatched prose in a template string;
no control-flow change, no new behavior. **deps:** Task 1 (the guard must allow the reworded command before the prompt
that emits it ships).

**Anchor (confirmed at HEAD, ~L451-452, WILL drift — locate by construct):** inside the `mergedTasksForGateAudit`
gate-audit `agent(...)` prompt, the two concatenated lines
`First confirm your evidence is pinned to the integration tip by running EXACTLY this bracket test:\n` +
`    [ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]\n`. Find them by the substring
`EXACTLY this bracket test` and the `[ "$(git -C` line — **not** a line number
(memory `plan-line-number-refs-stale-use-construct-locator`).

- [ ] **Step 1 — (no behavioral test — dispatched prose.)** No `.test.mjs` asserts on this string today. The
  load-bearing post-condition is a substring check (Step 3): the emitted prompt must no longer contain `[ "$(git -C`
  and must contain the bare `git -C ${refineryPath} rev-parse HEAD`.
- [ ] **Step 2 — Implement the reword.** Replace the two bracket-test lines (L451-452) with a bare print-and-compare
  the guard permits (spec Mechanics):
  ```js
  + `First confirm your evidence is pinned to the integration tip. Run (read-only git, permitted):\n`
  + `    git -C ${refineryPath} rev-parse HEAD\n`
  + `and compare the printed sha against the gate-HEAD sha ${gateHeadSha}. Equal ⇒ pin CONFIRMED. `
  + `Different, or the command cannot run (git unavailable / rev-parse fails) ⇒ you CANNOT confirm the pin.\n`
  ```
  Leave the downstream **CONFIRMED / cannot-confirm SOFT-downgrade branches (L453-461) semantically unchanged** — only
  the confirmation *mechanism* changes from a guard-denied bracket test to a guard-permitted print-and-compare. The
  stale-tip SOFT-downgrade *policy* (when a cannot-confirm becomes SOFT) and the required SOFT-note contents stay
  exactly as-is (spec Non-goal). Adjust the L453-454 wording that says "Exit 0 ⇒ pin CONFIRMED … Non-zero exit" only as
  needed so it reads against "compare the printed sha" rather than a bracket exit code — keep the CONFIRMED /
  CANNOT-confirm outcomes identical.
- [ ] **Step 3 — Run the full self-discovering gate → green.** No test asserts on the prompt, but the whole node suite
  must stay green since it parses `workflow-template.js`. **Manual post-condition:**
  `grep -F '[ "$(git -C' skills/war/assets/workflow-template.js` returns **nothing** in the gate-audit prompt, and
  `grep -F 'git -C ${refineryPath} rev-parse HEAD' skills/war/assets/workflow-template.js` hits the new bare command
  (spec Validation #4).
- [ ] **Step 4 — Commit** — `docs(war): reword gate-audit pin to bare git -C rev-parse print-and-compare (#222)`
- **Closes:** the prompt half of #222 (spec Validation #4) — the in-seat pin now uses a guard-permitted command, so a
  genuine provably-unrun mapped test can land HARD instead of being force-downgraded to SOFT.

---

## Phase 3 — Release v0.7.11

### Task 3 — Version bump v0.7.11 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; update the `Builds on vX` clause). **No badge.**
**`requiresTest`: false.**

- [ ] **Step 1 — Bump all four slots to `0.7.11`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four +
  the `Builds on` clause by hand). The prior landed tip (Spec 3) sets the four slots to `0.7.10` and the `## Status`
  `Builds on` clause to `v0.7.9` — bump those to `0.7.11` / `Builds on v0.7.10`. **Standalone fallback:** if run off
  live `master` (slots read `0.7.7`), take the **next free patch off the live tip** (e.g. `0.7.8`) and set
  `Builds on` to the live prior — do NOT hardcode `0.7.11` over an empty stack
  (memory `stacked-per-branch-releases-make-main-lag-cumulative`). Status copy: auditor git-guard now permits the
  read-only `git -C <path>` global flag, and the gate-audit pin uses a bare print-and-compare instead of the
  guard-denied bracket test — a genuinely provably-unrun mapped test can land HARD instead of being force-downgraded
  to SOFT.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.11 — auditor git-guard read-only -C + reworded gate-audit pin (#222)`

---

## Gate

The self-discovering multi-runner — run the **full** gate (every runner), not a `--test-name-pattern` subset, before
each commit. A cross-branch merge can add `*.test.sh` runners the bare `node --test` glob misses
(memory `gate-under-covers-after-cross-branch-merge-new-runner`):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Quote the `.mjs` glob** — bash 3.2 under-covers it unquoted. **6 `.test.mjs`** + **12 `.test.sh`** runners at HEAD
(6 `hooks/` + 6 `skills/`), including the modified `hooks/validate-auditor-git.test.sh`. **Never assert a literal `12`**
in any test — the gate self-discovers via `find` (memory `floor-script-discovery-set-must-mirror-gate-exclusions`); a
runner added by Specs 1–3 ahead of this in the stack is auto-found.

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `validate-auditor-git.test.sh` GROUP H | H1/H2 allow (`git -C … rev-parse HEAD` / `show HEAD:file.txt` → exit 0); **H3 deny** (`git -C … commit` → exit 2 + `WAR:`, verb allowlist NOT widened); H4 deny (bare `-C`); **H5 deny** (bracket/`$()` form, C5 parity); C5 stays | Existing `expect_allow`/`expect_deny` helpers (exit-2 + `WAR:` already asserted). **Red first:** H1/H2 must deny pre-peel. No `git -C -C` deny case (it allows). |
| T2 | (no test — dispatched prose) | full gate green; **manual:** no `[ "$(git -C` substring; bare `git -C … rev-parse HEAD` present | SOFT-downgrade branches (L453-461) semantically unchanged |
| T3 | (no test — release) | full gate green at the release commit; four slots + `Builds on` hand-verified | no cross-slot test |

## Coverage

| Issue | Tasks | Validation |
|-------|-------|------------|
| **#222** | T1 (guard + GROUP H test), T2 (prompt reword), T3 (release) | spec V#1 (H1/H2 allow), V#2 (H3/H4 deny — no verb widening), V#3 (C5 + H5 deny — injection still closed), V#4 (prompt reworded, no `[ "$(git -C`) |

## Deliberate simplifications / non-goals

- **One `-C` peel only.** `git -C -C rev-parse HEAD` peels the first `-C` and allows the harmless read; the pin test
  uses exactly one `-C`. The char allowlist guarantees no space-containing path reaches the peel, so the single
  space-free-path assumption holds. Documented inline as a `ponytail:` ceiling.
- **No char-allowlist change.** The bracket/`$()` form stays denied (H5 + C5 prove it) — `-C` is the correct and
  sufficient half of the issue's suggestion; permitting `$()[]"` reopens the C5 injection vector (spec Alternatives).
- **No SOFT-downgrade policy change.** Only the pin-confirmation *mechanism* changes; the stale-tip defusing rule and
  SOFT-note contents (L453-461) are unchanged (spec Non-goal).
- **The `auditor-cannot-execute-the-tests-it-must-verify-pass` structural gap is out of scope** — this fixes only the
  pin-confirmation read path, not the auditor's inability to run the tests it verifies (spec Non-goal).
- **No GitHub issue filed by this plan** — #222 is the existing issue; the release commit closes it.
