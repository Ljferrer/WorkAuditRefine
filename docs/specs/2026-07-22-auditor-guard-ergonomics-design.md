# Auditor guard ergonomics — widen the read-only git grammar, teach the guard contract on both prompt surfaces, and make `held:workflow-error` self-diagnosing

**Status:** proposed. **Severity:** medium (pure friction — no verdict was ever lost; the cost is latency + tokens on opus/xhigh audit seats, every phase, every run). **Enforcement target:** mechanical where deterministic (hook grammar + shell test cases + JS drift tests), prompt-taught where behavioral (the guard contract), with the teaching drift-locked by the D3 both-surfaces registry.

**Addresses (source issues):** **#980** (bare args-parse error + wrong `resumeFromRunId` hint on `held:workflow-error`; auditor git-guard burns ~5 turns/seat on shell composition) and **#982** (auditor git guard denies the auditor's own idiomatic read-only toolkit — ~831 denials in one run). Both issues are one friction source — the fail-closed auditor git guard's grammar is narrower than the auditor's idiomatic read-only toolkit, and neither prompt surface teaches the guard's contract — so they resolve as one spec. #980's second half (entry-parse diagnostics + recovery note) rides along; it touches a `workflow-template.js` construct disjoint from every other group's regions.

**Related lessons:** `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` (docs/learnings — the Grep tool is the sanctioned sweep channel), `never-follow-resumefromrunid-hint-after-a-land-failure` (docs/learnings — the sibling `resumeFromRunId` trap), `workflow-error-at-args-parse-means-lead-side-args-not-a-phase-failure` (local root — the exact #980 incident class).

---

## 1. Context — the gap / problem

Two measured runs establish the same mechanism at different scales:

- **#982** (`war-game-benchmark-harness-2026-07-21`): **831 PreToolUse denials** from `hooks/validate-auditor-git.sh` across ~66 auditor seats — 608 forbidden-character (led by `~` in `HEAD~1` and `%` in `--format=%h`, plus pipes/quotes), 115 not-a-git-command, 61 `ls-tree`, 31 `grep`, 16 `branch`. Every denial is a wasted retry round-trip inside an audit seat.
- **#980** (`lessons-learned-tighten-2026-07-21`): **71 denials across 14/14 seats** (mean ≈ 5/seat), 83 % of them ordinary shell composition (`git diff … | head`, `cmd && cmd`) against the single-verb guard.

Fail-closed confinement is the right posture (F03, ADR 0002) — the defect is the *cost of discovery*. Verified against the live tree:

1. The character allowlist in `validate-auditor-git.sh` (`[A-Za-z0-9 ./_=:,@^-]`, enforced by `LC_ALL=C tr -d` residue extraction) permits `^` but not `~` — so `git diff HEAD~1`, the single most idiomatic read-only revision form, denies — and not `%`, so every `git log --format=%H` denies.
2. The read-only subcommand allowlist (`diff/log/show/merge-base/rev-parse/status/ls-files/cat-file/blame`) omits `ls-tree` (a pure read) and every read form of `branch`; auditors reach for both constantly.
3. **Nothing teaches the grammar.** `agents/war-auditor.md` says only "a guard denies anything else"; the dispatched `auditPrompt()` carries a two-sentence partial teach (`Use allowlist-safe git forms … Avoid %-format strings … and @{} reflog syntax`) that exists on **one** surface only and will become half-false the moment `%` is admitted. Each seat re-learns the contract by denial, every phase, every run.
4. **#980's ride-along:** the template's entry parse (`const A = typeof args === 'string' ? JSON.parse(args) : (args || {})` in `workflow-template.js`) surfaces a bare engine message (`JSON Parse error: Unable to parse JSON string` — no offset, no payload length) on a ~17 KB payload, and the harness's completion notification then prints the generic `resumeFromRunId` hint — which for the `held:workflow-error` class is exactly the wrong recovery (`skills/war/SKILL.md` routes it to a fresh Recovery relaunch; the journal would replay the cached error).

## 2. Pivotal constraints

1. **Fail-closed posture is untouchable (F03 / ADR 0002).** This spec widens the *grammar* the guard accepts, never the posture: default-deny stays; deny is exit 2 with the `WAR:` stderr marker; the character check stays the bash-3.2-safe `LC_ALL=C tr -d` residue method; the hook stays macOS bash-3.2.57-compatible (no associative arrays, no `${,,}`).
2. **Both-prompt-surface split rule.** Any auditor behavior change edits `agents/war-auditor.md` **and** the string-built prompt in `workflow-template.js` in the same commit. The D3 both-surfaces directive registry in `workflow-template.test.mjs` has an **exact no-slack row-count floor** (#693): a new both-surfaces directive lands its registry row *and* the floor bump in the same task. This group heads the serialization chain for that registry (auditor-guard-ergonomics → audit-adjudication-threading → servitor-wrapup-landed-tip); its registry edits land first.
3. **Ratified decision at stake — `git grep`.** The G6 case in `hooks/validate-auditor-git.test.sh` mechanically records the non-widening of the allowlist for `grep`; ADR 0029 lists "widen the auditor allowlist to add a `grep` verb" as **rejected — deferred**; the committed-tree-grounding clause (mirrored verbatim on both prompt surfaces, anchored by the D3 registry row `auditor committed-tree grounding …` including `/git grep/i`) states "git grep is not and stays denied"; and the lesson `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` records the Grep tool as the sanctioned sweep channel. Admitting `git grep` reverses all four at once — this spec must decide explicitly (resolved as D3 below), and if it went ahead it would have to flip G6, rewrite the clause on both surfaces + its registry anchors, and amend ADR 0029.
4. **ADR 0005.** `held:workflow-error` routes through the existing top-level catch and **never** enters `HARD_ESCALATION_REASONS`. This spec adds diagnostics *inside* that path; it touches neither `land-decision.mjs` nor the hand-mirrored enum copies nor their drift guard.
5. **The Workflow sandbox cannot import.** The entry-parse diagnostics are pure inline JS in `workflow-template.js`, thrown as a named `Error` that the existing catch renders — no new `landDecision` member, no new return route.
6. **The auditor's non-Bash tools are the sanctioned file channel.** Read/Grep/Glob are unrestricted by the git-verb Bash guard (recorded lesson, constraint 3). Teaching must direct composition/filtering *to* those tools, never invite loosening the Bash grammar to serve them.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|-----------|
| D1 | Widen the character allowlist with `~` and `%`? | **Yes — both.** New set `[A-Za-z0-9 ./_=:,@^~%-]`. Neither character carries shell metacharacter semantics in the denied-composition space that remains: `~` mid-word (`HEAD~1`) never expands, and a leading-word tilde expands only to a path — a read; `%` is inert in non-interactive bash. Quotes, globs, braces (`@{…}` reflog), `$`, `!`, parens, pipes, redirects, `;`, `&` all stay denied — every injection-class case (test groups C, E, H5) is unaffected. |
| D2 | Admit `ls-tree`? | **Yes.** A pure read verb (lists tree objects), 61 denials/run. It gains a subcommand arm exactly like `ls-files`; the existing post-subcommand `--output`/`-o` scan already covers it. No flags of concern exist for it. |
| D3 | Admit `git grep`? | **No — denial re-ratified** (the constraint-3 reversal is declined). Every `git grep` use case is already served: repo-wide sweeps via the unrestricted **Grep tool**, pinned-tree blob reads via `git show <audit_sha>:<path>`, history questions via `git log -S/-G` (all ratified in the committed-tree-grounding clause / ADR 0029). The 31 grep denials are a teaching gap, not a capability gap — D5's contract block names the Grep tool at the exact decision point. G6 stays `expect_deny`; ADR 0029's rejected-option record stays accurate; no clause rewrite, no registry-anchor churn. |
| D4 | Admit read-form `branch`? | **Yes, fail-closed by token shape.** A bare `git branch` (no arguments) allows. With arguments, **every** post-subcommand token must match an enumerated read-flag allowlist with `=`-attached values — `--contains=<rev>`, `--no-contains=<rev>`, `--merged=<rev>`, `--no-merged=<rev>`, `--points-at=<rev>`, `--list`, `--all`/`-a`, `--remotes`/`-r`, `--show-current`, `-v`/`-vv`/`--verbose`, `--sort=<key>` — anything else (any bare non-flag token, any unlisted flag) denies. This default-deny shape blocks the flagless creation form (`git branch <name>`) and every write flag (`-d/-D/-m/-M/-c/-C/-f/-u/--track/--set-upstream-to/…`) **without enumerating them**. Space-separated flag values (`--contains <rev>`) deny — the `=` form is required and taught (D5, D6). Rationale over the alternative (skip `branch`, teach `merge-base --is-ancestor`): containment/orientation reads are a recurring audit need (16 denials/run) and the per-token loop is ~10 lines of bash-3.2-safe case matching, consistent with the guard's existing post-subcommand-scan precedent. |
| D5 | Where and how is the guard contract taught? | **A guard-contract block on both prompt surfaces.** A new `## Read-only git guard contract` section in `agents/war-auditor.md`, and in `auditPrompt()` a rewritten grammar clause **replacing** the current `Use allowlist-safe git forms … Avoid %-format strings …` sentences (which become half-false once `%` admits). Shared content: **one bare git command per Bash call** from the verb allowlist (enumerated, including the new `ls-tree` and read-form `branch`); **no pipes, chaining, redirects, quotes, globs, braces, or substitution — compose nothing; filter and search with the Read/Grep/Glob tools instead**; non-git shell reads (`ls`, `cat`, `wc`, …) always deny — use Read/Glob or `git ls-files`/`ls-tree`; `@{}` reflog stays denied (braces) — use `git log -g`; `branch` takes `=`-attached read flags only; `git grep` stays denied — the Grep tool is the sweep channel. The inline gate-audit seats (outside `auditPrompt()`) inherit the contract via the standing card, per the registry's established idiom. |
| D6 | Deny-message micro-teaching | **Yes.** The denial string is the only surface guaranteed to reach a seat mid-retry, so each deny names its sanctioned alternative: the not-a-git-command deny appends "auditors use the Read/Grep/Glob tools for file access"; the unlisted-verb deny (which already enumerates the allowlist) appends "for repo-wide search use the Grep tool"; the new `branch` bare-token/space-form deny names the `=`-attached read-flag form. Pure string edits inside `deny()` call sites — posture unchanged. |
| D7 | Drift coupling for the new teaching | **One new D3 registry row** in `workflow-template.test.mjs` — surfaces `['war-auditor.md', auditorMd]` + `['auditPrompt()', auditP]`, token-anchored (per the registry's case-tolerant convention) on the contract's distinctive fragments, including at least one widened-verb token (`/ls-tree/i`) and the composition ban (e.g. `/one bare git/i`, `/no pipes/i`, `/Grep tool/i`) so both the verb-set and the contract are drift-coupled to both surfaces. The `REGISTRY.length` floor and its assertion message are bumped to the new exact row count (#693 — floor equals true count, no slack). |
| D8 | Entry-parse diagnostics shape (#980) | **A dedicated try/catch around the string arm of the entry parse** in `workflow-template.js`, throwing a named `Error` that carries: the payload length in characters, the engine's own parse message (position included when the engine provides one — position is engine-dependent and never fabricated), and a bounded head snippet (~first 60 chars) sufficient to distinguish hand-retyped inline args from generated file bytes. The object-arm and the existing non-null-object guard (ADR 0034) are untouched; the named error routes to `held:workflow-error` via the existing catch (constraint 4/5). |
| D9 | Recovery-note placement | **Universal, at the catch.** The top-level catch's returned `workflowError` gains an additive `recovery` field stating: `held:workflow-error` is Lead/infra-side — retry via a fresh Recovery relaunch (new runId), **never** `resumeFromRunId` (the journal replays the cached error). This pre-empts the harness's generic `resumeFromRunId` hint at the source for the *whole* class, not just parse failures, and matches the already-ratified prose in `skills/war/SKILL.md`. Additive field: existing consumers read `workflowError.message`/`stack` and are unaffected. |

## 4. Mechanics (per component/role)

### `hooks/validate-auditor-git.sh`
- **Character allowlist:** the `tr -d` set widens from `'A-Za-z0-9 ./_=:,@^-'` to `'A-Za-z0-9 ./_=:,@^~%-'` (D1; `-` stays last). The header comment's char-set line updates in the same edit.
- **Verb arms:** new `ls-tree` arm beside `ls-files` (D2). New `branch` arm (D4) that peels `branch` and runs the per-token read-flag loop: empty rest → allow; each token matched against the D4 flag set via `case`; first non-matching token → deny with the D6 micro-teach message. Bash-3.2-safe: unquoted `for tok in $rest` word-splitting is safe here because the char allowlist already excludes quotes and glob characters.
- **Deny messages:** the unlisted-verb deny's enumeration updates to include `ls-tree`/`branch`; D6 micro-teach suffixes added at the named `deny()` call sites.
- **Unchanged:** the suffix-anchored agent-type arm, the global-flag block, the single `-C` peel, the post-subcommand `--output`/`-o` scan (which now also covers `ls-tree`/`branch`), and every exit code.

### `hooks/validate-auditor-git.test.sh`
- **New allow cases:** `git diff HEAD~1`; `git log --pretty=format:%H`; `git ls-tree -r HEAD`; `git ls-tree HEAD skills/`; `git branch`; `git branch -a -v`; `git branch --contains=abc123`; `git branch --show-current`.
- **New deny cases:** `git branch -d x`; `git branch -D x`; `git branch -m a b`; `git branch newname` (flagless creation); `git branch --contains abc123` (space form — asserts the `=`-form micro-teach string on stderr); `git branch -f x HEAD`; `git branch --set-upstream-to=origin/x`.
- **Micro-teach assertions (D6):** the new deny cases for non-git and unlisted-verb paths assert their sanctioned-alternative substrings on stderr (the harness's `stderr_of` helper already exists; `expect_deny` continues to assert the `WAR:` marker).
- **G6 stays `expect_deny`, byte-load-bearing** — its comment gains one line citing this spec's D3 re-ratification. **All C-group (injection), E-group (global/output flags), and H5 (bracket/`$()`) cases stay unchanged and green** — the widening proof is that exactly `~` and `%` were added and nothing else moved.
- Header prose ("single git read-subcommand (…)") updates to the new verb list.

### `skills/war/assets/workflow-template.js`
- **`auditPrompt()`:** the `Use allowlist-safe git forms … Avoid %-format strings … @{} reflog …` sentences are replaced by the D5 guard-contract clause (mirrored in `agents/war-auditor.md`, same commit). The clause keeps `@{}` in avoidance context (the existing F03 prompt test requires this).
- **Entry parse:** the string arm of `const A = …` gains the D8 try/catch with the named diagnostic error. The ADR 0034 non-null-object guard below it is untouched.
- **Top-level catch:** the returned `workflowError` object gains the D9 `recovery` field. `landDecision: 'held:workflow-error'` and the no-handoff rule are untouched.

### `skills/war/assets/workflow-template.test.mjs`
- **D3 registry:** the new guard-contract row (D7) + exact floor bump + updated floor message.
- **F03 prompt test** (`F03 — auditPrompt: steers auditor to allowlist-safe git forms …`): retitled and re-anchored to the new contract clause — its current comment ("Task-2 guard denies those chars", meaning `%`) goes stale under D1 and is corrected in the same commit (comment-lag duty).
- **New tests:** (a) a malformed JSON *string* args (e.g. `'{oops'`) returns `held:workflow-error` whose `workflowError.message` carries the payload char length and head snippet, dispatches zero agents, and renders `phase: null` (sibling of the existing scalar-args criterion-2 test); (b) the catch-path return carries `workflowError.recovery` matching both a fresh-relaunch phrase and a never-`resumeFromRunId` phrase; (c) delete-the-feature direction per D7 row — reverting either surface's contract block alone REDs the registry row.

### `agents/war-auditor.md`
- New `## Read-only git guard contract` section carrying the D5 content. The existing committed-tree-grounding paragraph is **untouched** (its "git grep … stays denied" sentence remains true under D3).

### Stale-grammar token sweep (with mandatory survey)
Grep the repo for the retired grammar claims — `%-format`, `reflog syntax`, and the old verb enumeration `ls-files/cat-file/blame` — and handle every match (update or confirm-correct each).
**Mandatory manual same-scope survey (grep is a floor, not a ceiling):** after the grep, hand-scan the target files' same-scope tests and comments — the hook's PURPOSE/header comment block, every case-group comment in `validate-auditor-git.test.sh` (A/C/E/G/H prose), the F03 test's title and comment in `workflow-template.test.mjs`, and `agents/war-auditor.md` prose — because same-meaning siblings encode the concept in different words ("Task-2 guard denies those chars", "single git read-subcommand", "no shell metacharacters", "those are denied by the read-only guard") and survive the token sweep silently. List each straggler found as a survey-derived correction. Known stragglers identified at spec time: the test-file header's parenthesized verb list; the hook header's `READ-ONLY SUBCOMMAND ALLOWLIST` comment; the F03 test comment. Deliberately excluded: lesson bodies under `docs/learnings/` (provenance-dated records; see §9).

## 5. Surface changes (files touched)

- `hooks/validate-auditor-git.sh` — char-set widening, `ls-tree` + read-form `branch` arms, deny-message micro-teach, header comments.
- `hooks/validate-auditor-git.test.sh` — new allow/deny cases, micro-teach stderr assertions, G6 comment line, header prose.
- `skills/war/assets/workflow-template.js` — `auditPrompt()` contract clause, entry-parse try/catch, catch `recovery` field.
- `skills/war/assets/workflow-template.test.mjs` — D3 registry row + exact floor bump, F03 test re-anchor, entry-diagnostics + recovery-field tests.
- `agents/war-auditor.md` — guard-contract section.

**Explicitly untouched:** `skills/war/assets/land-decision.mjs` and both hand-mirrored enum copies + their drift guard (constraint 4); `skills/war/SKILL.md` (its `resumeFromRunId` prose is already correct and D9 conforms to it); `docs/adr/*` (D3 conserves ADR 0029; nothing amends ADR 0002/0005); `docs/learnings/*`.

## 6. New domain terms (CONTEXT.md)

None. "Guard contract" is used descriptively; no CONTEXT.md entry is warranted for a teaching block.

## 7. Recommended ADRs

None. D1/D2/D4 adjust grammar breadth inside ADR 0002's capability-first confinement without changing posture; D3 declines the only reversal that would have amended ADR 0029; D8/D9 operate inside ADR 0005's existing routing. The decision record is this spec plus the updated hook header.

## 8. Open risks / implementation notes

- **`tr` set edit is the single highest-risk line.** The residue method is order-sensitive only for `-` (must stay last); `~` and `%` are literal in `tr`. The C/E/H5 regression cases are the proof harness — they must be green before and after.
- **`branch` `=`-form friction.** Seats will type `--contains <rev>` (space form) first; the D6 micro-teach in that exact deny message is the mitigation. If a later `/war-review` still shows `branch` space-form denials dominating, the follow-up is a one-token lookahead for `--contains`/`--merged` values — deferred (§9).
- **`%` admission does not admit `--format=%(…)`** — parens stay denied, so `for-each-ref`-style field syntax (and `git branch --format=`) remains unusable; the D4 flag set deliberately omits `--format`.
- **Engine-dependent parse position (D8):** JavaScriptCore's `JSON Parse error` carries no offset; V8's does. The diagnostic embeds whatever the engine message provides plus length + snippet — never a fabricated position.
- **Registry serialization:** this spec's D7 row + floor bump must land before the other groups' registry edits (the dependsOn chain exists solely to serialize `workflow-template.test.mjs` registry/drift-test edits).
- **Same-commit discipline:** D5's two surface edits, D7's registry row, and the F03 re-anchor are one atomic change — a partial land leaves either a false teach (`%-format … denied` after `%` admits) or a red drift test.

## 9. Non-goals / deferred

- **Admitting `git grep`** — declined, re-ratified (D3); revisit only with evidence the Grep tool + `git show`/`log -S/-G` triad fails a real audit need.
- **Admitting `fetch`** — out of scope, unchanged (H3a lock, #310 precedent; `fetch` is network write-adjacent by ratified decision).
- **`branch` space-form value lookahead** — deferred until a post-land `/war-review` shows the `=`-form teach insufficient (§8).
- **Widening braces/quotes/globs or any composition character** — never; composition belongs to Read/Grep/Glob.
- **Correcting `docs/learnings/` lesson bodies that enumerate the old verb list** (e.g. `auditor-grep-tool-unrestricted-by-git-verb-bash-guard`) — deliberate: lesson bodies are provenance-dated records scoped to their origin incident and are not drift-guarded (recorded lesson `process-recipe-lesson-body-is-not-drift-guarded-by-any-test`); their verify-before-acting cues are the designed mitigation.
- **Changing the harness's generic `resumeFromRunId` completion hint itself** — out of reach (harness-owned, not plugin-owned); D9 pre-empts it at the result payload instead.
- **Auto-retry/self-healing on denials** — the guard stays a pure gate; recovery intelligence lives in the taught contract.

## 10. Validation criteria (concrete, testable)

1. `bash hooks/validate-auditor-git.test.sh` is green and includes: `git diff HEAD~1` → allow; `git log --pretty=format:%H` → allow; `git ls-tree -r HEAD` → allow; `git branch` and `git branch --contains=abc123` → allow; `git branch newname`, `git branch -d x`, `git branch --contains abc123` (space form), `git branch -f x HEAD` → deny with the `WAR:` marker.
2. **G6 remains `expect_deny`** (`git grep token` → denied) — the mechanical record of D3's re-ratification; the committed-tree-grounding clause on both surfaces still contains "git grep" in denial context (existing D3-registry row `auditor committed-tree grounding …` stays green, anchors unchanged).
3. Every pre-existing injection/posture case in `validate-auditor-git.test.sh` — groups C (metacharacters), E (global/output flags), H3/H3a/H5 (`-C` non-widening, `fetch`, bracket/`$()`) and I (suffix-anchored arm) — passes unmodified.
4. The new deny messages carry their micro-teach substrings: the not-a-git deny names Read/Grep/Glob, the unlisted-verb deny names the Grep tool, and the `branch` space-form deny names the `=`-attached form (asserted via stderr content in the new test cases).
5. `node --test skills/war/assets/workflow-template.test.mjs` is green with: the D3 both-surfaces registry containing the new guard-contract row (surfaces `war-auditor.md` + `auditPrompt()`; anchors include `/ls-tree/i` and the composition-ban tokens), and the `REGISTRY.length` floor equal to the new exact row count with an updated message (#693 no-slack).
6. Reverting the `agents/war-auditor.md` guard-contract section alone REDs the new registry row; reverting the `auditPrompt()` contract clause alone REDs it too (delete-the-feature, per surface).
7. `grep -rn '%-format' skills/war/assets/workflow-template.js agents/war-auditor.md` returns zero matches (the stale teach is fully replaced); the retitled F03 prompt test passes with `@{}` still confined to avoidance context.
8. A malformed JSON **string** args value (e.g. `'{oops'`) run through the built workflow returns `landDecision: 'held:workflow-error'` with `workflowError.message` matching the payload char length and a head snippet, **zero agents dispatched**, and `phase: null`; the existing scalar-args criterion-2 test stays green unmodified.
9. Every catch-path return carries `workflowError.recovery` matching both a fresh-relaunch phrase and a `never resumeFromRunId` phrase; `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` (canonical in `land-decision.mjs`, mirrored in `workflow-template.js`) are byte-untouched and their drift-guard test is green (ADR 0005).
10. `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over `hooks/` + `skills/` are green end-to-end.
