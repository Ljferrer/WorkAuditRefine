# Auditor git-guard ergonomics & prompt-mirror truth — admit `+`, re-ratify no-`git grep`, teach the split at the deny site, and fix the branch-clause self-contradiction on both mirrors

**Status:** proposed. **Severity:** minor (pure friction + prose truth — no audit was ever blocked; the cost is denial-retry turn-burn on opus audit seats plus a standing self-contradiction both prompt surfaces teach every seat). **Enforcement target:** mechanical where deterministic (hook char set + shell test cases + JS drift guards), prompt-taught where behavioral (the corrected branch clause), drift-locked by the D3 both-surfaces registry plus a new extraction-equality guard against the hook's canonical deny string.

**Addresses (source issues):** **#1138** (52 auditor git-guard denials across 29/31 seats in one 0.14.61 phase — `git grep`, shell `grep`, and `blame -L/re/,+N` tripping the char allowlist; its two undecided maintainer options — admit `grep`, admit `+` — are the policy calls this spec resolves), **#1025** (244 forbidden-character denials across 14 seats in one pre-#1002 phase; its residual ask — make the forbidden-char denial name the compliant form — is the one deny site still without a micro-teach), **#1124** (the #1085 "=-attached read flags only" bare-flag mischaracterization survives on BOTH auditor prompt mirrors while the hook's own deny string already carries the corrected two-arm form; no test pins the mirror prose).

**Related lessons:** `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` (docs/learnings — the Grep tool is the sanctioned sweep channel), `guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes` (docs/learnings — the #1085 incident this spec's mirror fix completes), `standing-instruction-vs-dispatched-prompt-coverage-split` (docs/learnings — mirror into both surfaces, same commit).

**Prior art:** `docs/specs/2026-07-22-auditor-guard-ergonomics-design.md` (widened `~`/`%`/`ls-tree`/read-form `branch`, authored the both-surfaces guard contract, re-ratified no-`git grep` as its D3) and `docs/specs/2026-07-24-runbook-and-standing-record-coherence-design.md` (recharacterized the hook's branch deny string to the two-arm form — hook only; the prompt mirrors were out of its scope, which is exactly the residue #1124 records).

---

## 1. Context — the gap / problem

Two measured runs bracket the prompt-teaching fix and prove it necessary but not sufficient:

- **#1025** (v0.14.48, pre-#1002): 244 forbidden-character denials across all 14 auditor seats in one otherwise-clean 2-task phase — `&&` chains and backslash continuations against the single-command rule, discovered by denial-retry loop. Its primary ask (teach the single-command discipline up front) landed in fa86aa9 (2026-07-22): the READ-ONLY GIT GUARD CONTRACT now sits on both surfaces.
- **#1138** (v0.14.61, post-#1002 — the contract was already on both surfaces): still 52 denials across 29/31 seats in one phase. Prompt front-loading demonstrably does not eliminate first-instinct idioms; the residual burn concentrates in three families.

Verified against the live tree, the three families at tip:

1. **`git blame -L /re/,+N` / `-L <start>,+<n>`** — `blame` IS in the verb allowlist (the `blame` case arm in `hooks/validate-auditor-git.sh`), but the character allowlist (`LC_ALL=C tr -d 'A-Za-z0-9 ./_=:,@^~%-'` in the residue check) has no `+`, so the char check fires first and denies a pure read idiom. This answers #1138's open question: the verb never gets a chance.
2. **`git grep` / shell `grep`** — both deny sites already micro-teach the sanctioned alternative (the unlisted-verb deny ends "for repo-wide search use the Grep tool"; the not-a-git deny ends "auditors use the Read/Grep/Glob tools for file access"). These are working as designed; the open item is the *policy question* #1138 raises — should `grep` join the verb allowlist? (Resolved D2: no, third ratification.)
3. **`&&` chains / continuations** — the forbidden-character deny is the **only deny site with no remediation hint**: it emits `command contains forbidden character(s): <residue>` and stops. A seat that composed `git diff … && git log …` learns *what* was rejected but not *the compliant form* (#1025's residual ask).

Independently, the **mirror-truth defect** (#1124): both prompt surfaces still teach

> `branch` takes `=`-attached read flags only (`--contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`, `--list`, `-a`, `-r`, `--show-current`, `-v`)

— the "`=`-attached … only" claim contradicted by five bare flags in its own parenthetical (`` `branch` takes `=`-attached read flags only`` bullet in `agents/war-auditor.md` §"Read-only git guard contract"; the byte-sibling sentence inside the `READ-ONLY GIT GUARD CONTRACT` clause of `auditPrompt()` in `skills/war/assets/workflow-template.js`). The hook's own deny string (the `branch` per-token loop's deny in `validate-auditor-git.sh`) was already corrected by the 2026-07-24 spec to the two-arm form — "value-carrying flags =-attached (…), bare read flags (…)" — and it also enumerates flags the mirrors omit entirely (`--no-contains=`, `--no-merged=`, `--sort=`, `--all`, `--remotes`, `--verbose`, `-vv`). No test pins the mirror prose: the D3 registry row for the guard contract anchors only `/one bare git/i`, `/no pipes/i`, `/ls-tree/i`, `/Grep tool/i`, and the F03 prompt test anchors the same fragments — the branch clause can rot (and did) with every guard green.

## 2. Pivotal constraints

1. **Fail-closed posture is untouchable (F03 / ADR 0002).** Default-deny stays; deny is exit 2 with the `WAR:` stderr marker; the char check stays the bash-3.2-safe `LC_ALL=C tr -d` residue method; macOS bash 3.2.57 compatibility holds (no associative arrays, no `${,,}`). This spec widens the char *set* by one character and lengthens two strings — never the posture.
2. **The `git grep` denial is triple-anchored.** The G6 case in `hooks/validate-auditor-git.test.sh` is `expect_deny` and byte-load-bearing; ADR 0029 records "widen the auditor allowlist to add a `grep` verb" as **rejected — deferred**; the committed-tree-grounding clause and the guard contract ("`git grep` stays denied — the Grep tool is the sweep channel") are mirrored on both prompt surfaces and anchored by the D3 registry. Admitting `grep` reverses all of these at once *and* opens a real hole: `git grep -O<cmd>` executes an arbitrary pager command, and the char allowlist alone cannot distinguish it. Any yes here would be a spec-level reversal with flag policing of its own — this spec instead re-ratifies the no (D2).
3. **Both-prompt-surface split rule.** Any auditor-facing wording change edits `agents/war-auditor.md` **and** the string-built clause in `workflow-template.js` in the same commit; the D3 both-surfaces directive registry in `workflow-template.test.mjs` has an exact no-slack row-count floor (#693). This spec **re-anchors an existing row** (the guard-contract row) rather than adding one — the floor count does not move.
4. **Existing test anchors must survive.** The F03 prompt test (`F03 — auditPrompt: teaches the read-only git guard contract …`) and the D3 guard-contract row anchor `/one bare git/i`, `/no pipes/i`, `/Grep tool/i`, `/ls-tree/i`; J16 in the shell suite pins the literal `=-attached` in the hook's branch deny stderr. The corrected mirror wording keeps every one of these tokens present (the two-arm form retains "=-attached" for the value-carrying arm).
5. **Ordering: the sibling spec owns shared files first.** This group builds on `docs/specs/2026-07-26-dispatch-args-and-floor-coverage-design.md`; any file both groups touch — notably `skills/war/assets/workflow-template.js` and `workflow-template.test.mjs` — lands there first, and this spec's plan bases its edits on that landed tip (stack-and-plow, ADR 0011). The hook and its shell test are expected disjoint.
6. **`+` must be provably inert.** In the composition space that remains after the char check (quotes, globs, braces, `$`, parens, pipes, redirects, `;`, `&`, backslash, newline all still denied), `+` carries no shell metacharacter semantics — no expansion, no glob, no control operator. Same admission bar `~` and `%` cleared in the 2026-07-22 spec's D1.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|-----------|
| D1 | Admit `+` to the character allowlist (#1138 option 3)? | **Yes.** The `tr -d` set widens from `'A-Za-z0-9 ./_=:,@^~%-'` to `'A-Za-z0-9 ./_=:,@^~%+-'` (`+` inserted before the final `-`, which stays last so it never forms a range). Unblocks `git blame -L <start>,+<n>`, `git blame -L /re/,+<n>`, and `git log -L` range forms — pure reads on an already-allowlisted verb. Constraint 6 gives the safety argument; injection test groups C/E/H5 are untouched and must stay green (the widening proof: exactly one character added, nothing else moved). All three same-file char-set comment homes update in the same edit (§4). |
| D2 | Admit `git grep` to the verb allowlist (#1138 option 2)? | **No — third ratification of the denial** (after ADR 0029 and the 2026-07-22 spec's D3). Every use case is served: repo-wide sweeps via the unrestricted Grep tool, pinned-tree blob reads via `git show <audit_sha>:<path>`, history via `git log -S/-G`. The deny message already routes to the Grep tool at the exact decision point, so the residual cost is one denied call per discovering seat — a teaching tax, not a capability gap — while admitting the verb would require policing `-O`/`--open-files-in-pager` (constraint 2's execution hole). No surface changes; the G6 case's comment gains one line citing this spec's D2 so the decision trail stays greppable. |
| D3 | Micro-teach at the forbidden-character deny (#1025 residual)? | **Yes.** The forbidden-char `deny()` message — the only deny site without a sanctioned-alternative hint — gains a bounded suffix naming the compliant form: run **one bare git command per Bash call**; split `&&`/`;` chains and continuations into separate calls; filter and search output with the Read/Grep/Glob tools. The existing prefix `command contains forbidden character(s): <residue>` survives byte-for-byte at the front (greppability of the historical message; the residue echo with its `head -c 20` bound is unchanged). Pure string edit — posture, exit code, and `WAR:` marker unchanged. |
| D4 | Fix the branch-clause mirror claim (#1124)? | **Yes — both mirrors adopt the hook's two-arm characterization, fully enumerated.** The bullet in `agents/war-auditor.md` and the sentence in the `READ-ONLY GIT GUARD CONTRACT` clause of `auditPrompt()` are rewritten together (one commit) to the shape of the hook's canonical deny string: value-carrying flags `=`-attached (`--contains=<rev>`, `--no-contains=<rev>`, `--merged=<rev>`, `--no-merged=<rev>`, `--points-at=<rev>`, `--sort=<key>`), bare read flags enumerated (`--list`, `--all`, `-a`, `--remotes`, `-r`, `--show-current`, `--verbose`, `-v`, `-vv`); a bare name, space-form value, or write flag denies. This fixes the self-contradiction AND the under-enumeration (the mirrors currently omit seven flags the hook admits). Wording may polish, but the token `=-attached` must survive on both surfaces (constraint 4) and the retired claim "read flags only" in its `=`-attached-qualified form must not. |
| D5 | Drift-lock the corrected wording? | **Re-anchor the existing D3 guard-contract registry row + a retired-phrase negative.** The row (`read-only git guard contract (D5): …` in `workflow-template.test.mjs`) gains two-arm anchors — `/value-carrying/i` and `/bare read flags/i` — on both surfaces, so reverting either surface's branch clause alone REDs the row (delete-the-feature proof). A negative assertion holds the retired claim absent from both surfaces: a backtick-tolerant regex (the .md writes `` `=`-attached ``, the JS writes `=-attached` — e.g. ``/=`?-attached read flags only/i``) with the pre-change sentence kept as an unwired negative-reference fixture (both-ways proof, per the structural-test-integrity discipline). Row **count** unchanged — no floor bump (constraint 3). |
| D6 | Bind the mirror flag enumeration to the hook mechanically? | **Yes — extraction + equality (ADR 0025), scoped to the branch clause.** A new test in `workflow-template.test.mjs` reads `hooks/validate-auditor-git.sh`, extracts the flag tokens from the two parenthesized lists inside the branch deny string (the `value-carrying flags =-attached (…)` and `bare read flags (…)` groups), and asserts every extracted token appears in **both** mirror surfaces (per-token substring presence, tolerant of the .md's backticks). This makes the next hook-side flag change red both mirrors instead of straggling them — the exact defect class #1124 records. The hook string stays canonical; the mirrors are followers. D5's hand anchors remain as the presence floor beneath it. |

## 4. Mechanics (per component/role)

### `hooks/validate-auditor-git.sh`
- **Character allowlist (D1):** the `tr -d` set in the residue check becomes `'A-Za-z0-9 ./_=:,@^~%+-'`. Three same-file comment homes update in the same edit: the header `FAIL-CLOSED CHARACTER ALLOWLIST` block's "Permitted chars:" line (its `~`/`%` rationale parenthetical gains `+` — admits `blame -L <start>,+<n>` / `-L /re/,+<n>`; no metacharacter semantics in the remaining denied space), the comment block above the residue check ("Permit only: …"), and the post-check comment ("At this point, the command contains only […]").
- **Forbidden-char deny (D3):** the deny message gains the micro-teach suffix after the existing prefix + residue echo. Suggested shape (plan may polish; the prefix and the three teach elements — one-bare-git, split-the-chain, Read/Grep/Glob — are the contract): `command contains forbidden character(s): <residue> — the guard admits one bare git command per Bash call: split && / ; chains and continuations into separate calls; filter and search output with the Read/Grep/Glob tools`.
- **Unchanged:** every case arm, the branch per-token loop and its (already-correct) deny string, the global-flag block, the `-C` peel, the post-subcommand `--output`/`-o` scan, all exit codes.

### `hooks/validate-auditor-git.test.sh`
- **New allow cases (D1):** `git blame -L 10,+5 hooks/validate-auditor-git.sh` and `git blame -L /deny/,+10 hooks/validate-auditor-git.sh` (numeric and regex `-L` forms); optionally `git log -L 5,+3:hooks/validate-auditor-git.sh`.
- **New deny-teach case (D3):** `git diff HEAD && git log` via the existing `expect_deny_teach` helper, asserting a distinctive teach substring (e.g. `one bare git command per Bash call`) on stderr alongside the `WAR:` marker.
- **G6 comment (D2):** one added line citing this spec's D2 third ratification; the case itself stays `expect_deny`, byte-identical.
- **Injection groups C, E, H5 and all existing cases: untouched and green.** No existing case sends a `+` (verified at tip), so no fixture flips.
- **Same-file comment survey (mandatory, §10 criterion 9):** after the mechanical edits, hand-scan this file's group comments for char-set claims stated in other words ("no shell metacharacters", "char allowlist still forbids …") — the H5 comment enumerates `[ ] $ ( ) "` which stays true, but list every such comment adjudicated as a survey-derived correction or an explicit confirm-correct.

### `agents/war-auditor.md`
- The `` `branch` takes `=`-attached read flags only`` bullet in `## Read-only git guard contract` is rewritten to the D4 two-arm form with the full flag enumeration. No other section moves; the committed-tree-grounding paragraph's "git grep … stays denied" sentence remains true under D2.

### `skills/war/assets/workflow-template.js`
- The branch sentence inside the `READ-ONLY GIT GUARD CONTRACT` clause of `auditPrompt()` is rewritten to the same D4 two-arm form, same commit as the .md edit. The JS comment block above the clause (the "mirrored as …" provenance comment) is re-read during the edit; its existing claims ("the verb list mirrors the hook's unlisted-verb deny enumeration") stay true and it gains a pointer to the D6 extraction guard as the branch-flag arbiter.

### `skills/war/assets/workflow-template.test.mjs`
- **D5:** the guard-contract registry row gains the `/value-carrying/i` + `/bare read flags/i` anchors; its explanatory comment updates in the same edit (comment-lag duty). The retired-phrase negative lands beside the registry's existing negative-reference precedent (`RETIRED_PREMISE_SAMPLES`-style): the pre-change sentence as an unwired fixture, and a backtick-tolerant absence regex asserted against both surfaces.
- **D6:** a new test extracts the two parenthesized flag lists from the hook's branch deny string (read the hook file relative to the repo root, split on commas, strip `<…>` value placeholders) and asserts each token's presence in `auditorMd` and in the dispatched `auditP` prompt. If the deny string is unlocatable the test fails loudly (fail-closed extraction — never a silent skip).
- The F03 prompt test needs no anchor change (its fragments all survive), but its comment is re-read for lagging claims during the edit.

### Retired-phrase token sweep (floor, with mandatory survey)
Grep the repo for the retired claim — the tokens `read flags only` and `=-attached read flags only` (backtick-tolerant) — and handle every match: the two mirror surfaces are rewritten; matches inside dated decision records (`docs/specs/2026-07-24-runbook-and-standing-record-coherence-design.md`, red-team reports, lesson bodies under `docs/learnings/` such as `guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes`) are provenance-dated history — confirm-correct, never rewrite.
**Mandatory manual same-scope survey (the grep is a completeness floor, not a ceiling):** after the grep, hand-scan the target files' same-scope tests and comments — the full `## Read-only git guard contract` section of `agents/war-auditor.md`, the whole `READ-ONLY GIT GUARD CONTRACT` clause and its provenance comment in `workflow-template.js`, the D3 registry row comment and F03 test comment in `workflow-template.test.mjs`, and the `expect_deny_teach` helper comment plus J-group comments in `validate-auditor-git.test.sh` (its "the =-attached branch read-flag form" phrasing describes the micro-teach substring and is expected still-accurate — adjudicate, don't assume) — because same-meaning siblings encode the claim in different words and survive the token sweep silently. List each straggler found as a survey-derived correction.

## 5. Surface changes (files touched)

| File | Change |
|------|--------|
| `hooks/validate-auditor-git.sh` | D1 char set (+ three comment homes), D3 deny-message suffix |
| `hooks/validate-auditor-git.test.sh` | D1 allow cases, D3 deny-teach case, D2 G6 comment line, survey-derived comment corrections |
| `agents/war-auditor.md` | D4 branch-clause rewrite (two-arm, full enumeration) |
| `skills/war/assets/workflow-template.js` | D4 branch-sentence rewrite in `auditPrompt()` + provenance-comment touch — **lands after the sibling dispatch-args-and-floor-coverage spec** (constraint 5) |
| `skills/war/assets/workflow-template.test.mjs` | D5 row re-anchor + retired-phrase negative, D6 extraction-equality test — **lands after the sibling spec** (constraint 5) |

## 6. New domain terms (CONTEXT.md)

None. "Micro-teach" and "both-surfaces registry" are already established by the 2026-07-22 spec and the D3 registry.

## 7. Recommended ADRs

None new. ADR 0029's rejected-option record ("widen the auditor allowlist to add a `grep` verb — rejected, deferred") remains accurate under D2 and needs no amendment; the G6 comment line is the lightweight citation vehicle.

## 8. Open risks / implementation notes

- **`+` interaction with existing arms:** a stray `+` token reaching the branch per-token loop hits the default-deny arm; a `+` in a path or rev on other verbs is inert. No arm keys on `+`.
- **Prompt length:** the fully-enumerated branch sentence lengthens the dispatched clause by ~15 tokens per seat — negligible against an opus audit seat's budget.
- **D6 extraction brittleness:** the extraction anchors on the deny string's two parenthesized groups; if a future edit reshapes that string, the test fails loudly (fail-closed) rather than passing empty — the failure message must say "re-point the extractor at the reshaped deny string", not imply the mirrors drifted.
- **#1138 option 1 is already landed and is not re-claimed:** the both-surfaces contract predates the 52-denial run; this spec claims only the residuals (D1, D2-as-decision, D3). Likewise #1025's primary ask landed in fa86aa9 — only the deny-message residual is claimed.
- Version literals are non-authoritative; any release bump resolves the next free patch from the four slots at land time.

## 9. Non-goals / deferred

- **No `git grep` verb** (D2 — third ratification) and no `fetch` (deliberately excluded, unchanged).
- **No hook-side branch-logic change** — the per-token loop and its deny string are already correct (#1085's fix); this spec touches only the prose followers.
- **No new deny sites, no exit-code changes, no posture change.**
- **No further char-set widening** beyond `+` — quotes, globs, braces, `$`, parens, pipes, redirects, `;`, `&`, backslash, newline all stay denied; every injection-class test stays load-bearing.
- **Lesson bodies and dated spec/report prose stay untouched** (provenance-dated records; confirm-correct in the sweep).

## 10. Validation criteria (concrete, testable)

1. `bash hooks/validate-auditor-git.test.sh` green, including new allow cases: `git blame -L 10,+5 <file>` and `git blame -L /deny/,+10 <file>` exit 0 for a `war-auditor` agent type.
2. The diff to the `tr -d` set adds exactly the one character `+` (widening proof); injection groups C, E, H5 pass unmodified.
3. `git diff HEAD && git log` denies exit-2 with stderr carrying the `WAR:` marker, the `command contains forbidden character(s)` prefix, **and** the D3 teach substring (`one bare git command per Bash call`).
4. `git grep token` still denies (G6 unmodified, `expect_deny`), with its comment citing this spec's D2.
5. Both mirror surfaces carry the two-arm branch characterization; a repo-wide backtick-tolerant grep for the retired `=-attached read flags only` claim over live surfaces (`agents/`, `skills/`, `hooks/`) returns zero hits — **and the §4 mandatory manual same-scope survey has run, with every straggler listed as a survey-derived correction or an explicit confirm-correct** (the grep alone is the floor, never the evidence).
6. The D3 registry guard-contract row is green with the added `/value-carrying/i` + `/bare read flags/i` anchors, and reverting **either** surface's branch clause alone REDs the row (delete-the-feature proof); the registry row-count floor is unchanged.
7. The retired-phrase negative fixture exists (unwired) and its absence regex REDs when the pre-change sentence is pasted back onto either surface (both-ways proof).
8. The D6 extraction test is green; removing any one flag token (e.g. `--no-contains=<rev>`) from one mirror REDs it; garbling the hook's deny string makes the extractor fail loudly, not pass empty.
9. All three char-set comment homes in `validate-auditor-git.sh` name `+`, and the same-file comment survey of `validate-auditor-git.test.sh` is recorded (criterion 5's survey discipline, applied to the char-set sweep).
10. `node --test 'skills/**/*.test.mjs'` green; the D4 wording keeps every pre-existing anchor token (`one bare git`, `no pipes`, `Grep tool`, `ls-tree`, `=-attached`) present so F03, the registry, and J16 pass without weakening.
