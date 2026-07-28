# Auditor guard policy & mirror truth — admit `+`, micro-teach the forbidden-char deny, third-ratify no-`git grep`, two-arm branch clause on both mirrors + extraction-equality lock

Source spec: `docs/specs/2026-07-26-auditor-guard-policy-and-mirror-truth-design.md` (issues
#1138, #1025, #1124 — all re-verified live on the working tree at plan time: the `tr -d` set in
`hooks/validate-auditor-git.sh` is `'A-Za-z0-9 ./_=:,@^~%-'` with no `+`; the forbidden-char
`deny` is the deny site the measured runs actually trip that names no compliant form (seven
other low-traffic deny sites are also hintless — red-team corrected the earlier "only" claim;
D3's scope, one suffix on the forbidden-char message, is unchanged); the hook's branch deny string already
carries the two-arm form while **both** prompt mirrors still teach the contradictory
`` `=`-attached read flags only `` claim with the seven-flag under-enumeration; the D3 registry
guard-contract row anchors only `/one bare git/i`, `/no pipes/i`, `/ls-tree/i`, `/Grep tool/i`;
ADR 0029's rejected-option record for the `grep` verb exists and stands).

## Commander's Intent

- **Purpose:** stop the auditor guard's residual denial-retry turn-burn and its standing prose
  lie, without moving the fail-closed posture one inch. Two measured runs (#1025: 244 denials /
  14 seats; #1138: 52 denials / 29 of 31 seats, *after* the contract reached both prompt
  surfaces) prove prompt front-loading is necessary but not sufficient — the residue is three
  families: `blame -L …,+N` tripping the char allowlist before its allowlisted verb is ever
  consulted (admit `+` — provably inert in the remaining denied composition space), `git grep`
  (keep denied — third ratification; the Grep tool is the sweep channel and `-O` is an execution
  hole), and `&&`-chains dying at the deny site the measured runs actually trip that names no
  compliant form (micro-teach it). Independently, both prompt mirrors still teach the #1085 branch-clause
  self-contradiction ("`=`-attached read flags only" followed by five bare flags) that the
  hook's own deny string shed on 2026-07-24, and omit seven flags the hook admits — rewrite
  both mirrors to the hook's two-arm characterization and drift-lock them so the next hook-side
  flag change REDs the mirrors instead of straggling them (the exact defect class #1124
  records).
- **Method:** one content phase of two file-disjoint parallel tasks, then the release. Task
  1.1 owns the hook + its shell test (they move together, fail-closed posture untouched: exit
  codes, `WAR:` marker, bash-3.2 `tr -d` residue method, every case arm all unchanged — D1
  widens the char *set* by exactly one character with all three same-file comment homes updated
  in the same edit; D3 appends a bounded teach suffix after the byte-preserved
  `command contains forbidden character(s): <residue>` prefix; D2 lands as one G6 comment line,
  the case itself stays `expect_deny` byte-identical). Task 1.2 owns the two prompt mirrors +
  the JS drift guards (D4 rewrites the branch clause on `agents/war-auditor.md` **and** the
  `auditPrompt()` clause in `workflow-template.js` in the same commit per the
  standing-instruction/dispatched-prompt split doctrine; D5 re-anchors the **existing** D3
  registry guard-contract row — row-count floor unmoved — plus a backtick-tolerant
  retired-phrase negative with the pre-change sentence kept as an unwired negative-reference
  fixture; D6 adds the extraction-equality test that reads the hook's branch deny string and
  asserts every extracted flag token onto both mirror surfaces — token-boundary matched, never
  naive substring — failing loudly if the deny string is unlocatable). The D4 wording keeps every pre-existing anchor token (`one bare git`,
  `no pipes`, `Grep tool`, `ls-tree`, `=-attached`) so F03 and the registry pass without
  weakening (J16 is anchored on the hook's stderr — its `=-attached` comes from the
  byte-untouched deny string and stays green independently of D4's mirror wording). Every spec §4 grep is a floor, not a ceiling — run it, then hand-scan the named
  same-scope comments and adjudicate each match as a survey-derived correction or an explicit
  confirm-correct; dated decision records and lesson bodies are provenance-dated history,
  confirm-correct, never rewritten.
- **End state:**
  1. The `tr -d` residue set in `hooks/validate-auditor-git.sh` is
     `'A-Za-z0-9 ./_=:,@^~%+-'` — the diff to that set adds exactly the one character `+`
     (inserted before the final `-`, which stays last so it never forms a range), and all
     three same-file comment homes (the header `FAIL-CLOSED CHARACTER ALLOWLIST` block's
     "Permitted chars:" line, the "Permit only: …" block above the residue check, and the
     "At this point, the command contains only […]" post-check comment) name `+`.
  2. `bash hooks/validate-auditor-git.test.sh` is green including new allow cases:
     `git blame -L 10,+5 <file>` and `git blame -L /deny/,+10 <file>` exit 0 for agent type
     `war-auditor`, plus the `git log -L 5,+3:<file>` form (required, not optional — the
     log/blame case arms carry no per-flag policing and `-L` matches no post-subcommand deny
     pattern, code-traced at plan time), plus one new composition deny case
     `git blame -L 1,+5; rm -rf .` (`expect_deny` — pins that admitting `+` did not weaken
     chain denial). Every pre-existing case is byte-unmodified (injection groups C, E, H5
     named as the load-bearing floor); the only shell-test diff is the enumerated additions.
  3. `git diff HEAD && git log` denies exit-2 with stderr carrying the `WAR:` marker, the
     byte-preserved `command contains forbidden character(s)` prefix with its `head -c 20`
     residue echo, **and** the D3 teach substring (`one bare git command per Bash call`,
     split-the-chain, Read/Grep/Glob) — asserted by **two** new `expect_deny_teach`
     invocations on that payload: one pinning `forbidden character(s): &&` (the prefix tail
     plus the residue echo at the front) and one pinning
     `one bare git command per Bash call` (the teach). The teach span is byte-frozen by its
     test; wording latitude applies only to the suffix prose around it.
  4. `git grep <token>` still denies: the G6 case stays `expect_deny` with a byte-identical
     payload, and its comment gains one line citing this spec's D2 third ratification (after
     ADR 0029's rejected-option record and the 2026-07-22 spec's D3); **and**
     `docs/adr/0029-capture-grounds-on-committed-tip.md` ends with an appended dated
     `## Amendment (2026-07-26)` section recording the D2 third ratification (naming the `-O`
     pager execution-hole argument), with the Considered-options entry and all pre-existing
     body text byte-unchanged.
  5. Both mirror surfaces — the branch bullet in `## Read-only git guard contract` of
     `agents/war-auditor.md` and the branch sentence in the `READ-ONLY GIT GUARD CONTRACT`
     clause of `auditPrompt()` in `skills/war/assets/workflow-template.js` — carry the D4
     two-arm characterization with the full flag enumeration (value-carrying flags
     `=`-attached: `--contains=`, `--no-contains=`, `--merged=`, `--no-merged=`,
     `--points-at=`, `--sort=`; bare read flags: `--list`, `--all`, `-a`, `--remotes`, `-r`,
     `--show-current`, `--verbose`, `-v`, `-vv`; bare name / space-form value / write flag
     denies), and a repo-wide backtick-tolerant grep for the retired
     `=-attached read flags only` claim over live surfaces (`agents/`, `skills/`, `hooks/`)
     returns zero hits **outside the one sanctioned exception**: the negative-reference
     fixture Task 1.2 deposits in `workflow-template.test.mjs` (the recorded
     backstop-retirement-grep lesson — the fixture is the deliberate carve-out, named here so
     it can never read as a straggler or a false-red).
  6. The D3 registry guard-contract row in `workflow-template.test.mjs` is green with the
     added `/value-carrying/i` + `/bare read flags/i` anchors on both surfaces, and the
     registry row-count floor assertion is byte-unmoved (re-anchor, not a new row).
  7. The retired-phrase negative exists: the pre-change sentence is kept as
     negative-reference fixture samples in **both byte variants** (the .md's
     `` `=`-attached read flags only `` and the JS's `=-attached read flags only`), each
     asserted to MATCH the absence regex (non-vacuity — the `RETIRED_PREMISE_SAMPLES`
     precedent; "unwired" means not a live surface, never unasserted), and the
     backtick-tolerant absence regex holds the retired claim absent from both surfaces.
  8. The D6 extraction-equality test is green: it reads `hooks/validate-auditor-git.sh` via
     the test file's established `join(here, '../../../hooks/...')` idiom (cwd-independent;
     run worktrees and the shipped plugin are full checkouts with `hooks/` at that offset),
     extracts the flag tokens from the two parenthesized groups inside the branch deny
     string, and asserts each token present on both mirror surfaces with **token-boundary
     matching** (a `(?<![\w-])<escaped>(?![\w-])`-shaped per-token regex, never naive
     substring — `-a`/`-r`/`-v` are substrings of `--all`/`--points-at=`/`--remotes`/
     `--verbose`/`-vv` and a dropped short flag would pass a substring check vacuously); an
     unlocatable deny string fails loudly with a message directing "re-point the extractor at
     the reshaped deny string", **and** the extractor asserts it found exactly two
     parenthesized groups each yielding a non-empty token list (a locatable-but-zero-token
     parse — reflowed enumeration, emptied group — fails loudly too; red-team closed this
     vacuous-pass hole) — never a silent empty pass.
  9. Delete-the-feature probes (worker-run in-worktree, reverted before commit, evidence in
     the done report — the recorded deliberately-uncommitted-probe lesson makes the resulting
     cannot-confirm SOFT at gate-audit, never a hold): reverting either surface's branch
     clause alone REDs the re-anchored registry row; pasting the pre-change sentence back
     onto either surface REDs the absence regex; removing one flag token from one mirror REDs
     the D6 test — probe with the substring-nested `-r` (shadowed by `--remotes`; proves
     token-boundary matching, the hard direction) and with `--no-contains=<rev>`; garbling
     the hook's deny string makes the extractor fail loudly.
  10. The mandatory manual same-scope surveys have run and are recorded in the done reports:
      the shell test's group comments adjudicated for char-set claims stated in other words
      (the H5 comment's `[ ] $ ( ) "` enumeration expected still-true), and the full
      guard-contract section/clause/registry-comment/F03-comment/J-group-comment scan for
      same-meaning siblings of the retired claim — every straggler listed as a survey-derived
      correction or an explicit confirm-correct.
  11. `node --test 'skills/**/*.test.mjs'` green; every pre-existing anchor token (`one bare
      git`, `no pipes`, `Grep tool`, `ls-tree`, `=-attached`) survives on the mirror surfaces
      (J16's own `=-attached` assertion reads the hook's stderr — the byte-untouched deny
      string — and is proven by the shell suite, not this JS gate).
  12. **Release:** all four version slots bumped in lock-step to the next free patch above the
      live integration base at land time; `version-slots.test.mjs` green.

## Build order (for /war)

- Phase 1 — Guard policy + mirror truth (#1138, #1025, #1124): two parallel tasks, one wave,
  file-disjoint (Task 1.1: the hook pair; Task 1.2: the two mirrors + JS guards). Task 1.2's
  D6 test *reads* `hooks/validate-auditor-git.sh` but does not modify it, and its extraction
  target — the branch deny string's two parenthesized groups — is byte-untouched by Task 1.1
  (D1/D3 touch only the char set, its comments, the forbidden-char deny message, **plus the
  one sanctioned coupling comment in the comment block above the branch per-token loop** —
  the deny-string lines themselves stay byte-untouched), so this
  is a read of an unmodified construct, not a footprint collision and not a deps edge.
- Phase 2 — Release (its own trailing phase per the decomposition rule).

## Phase 1 — Guard policy + mirror truth

### Task 1.1: Hook char-set widening + forbidden-char micro-teach + shell-test cases (D1, D2, D3)

- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`, `docs/adr/0029-capture-grounds-on-committed-tip.md`
- Plan slice: spec §4 hook + shell-test mechanics.
  **(a) D1 char set:** widen the `tr -d` set in the residue check from
  `'A-Za-z0-9 ./_=:,@^~%-'` to `'A-Za-z0-9 ./_=:,@^~%+-'` — `+` inserted before the final `-`
  so `-` stays last and never forms a range. Update all three same-file comment homes in the
  same edit: the header `FAIL-CLOSED CHARACTER ALLOWLIST` block's "Permitted chars:" line
  (its `~`/`%` rationale parenthetical gains `+` — admits `blame -L <start>,+<n>` /
  `-L /re/,+<n>`; no metacharacter semantics in the remaining denied space), the
  "Permit only: A-Za-z0-9 SPACE . / _ = : , @ ^ ~ % -" block above the residue check, and the
  "At this point, the command contains only [A-Za-z0-9 ./_=:,@^~%-]" post-check comment.
  Nothing else in the hook moves: every case arm, the branch per-token loop and its
  (already-correct) deny string, the global-flag block, the `-C` peel, the post-subcommand
  `--output`/`-o` scan, all exit codes, the `WAR:` marker — with **one sanctioned
  exception**: add a one-line coupling comment in the comment block above the branch
  per-token loop ("the deny string's two parenthesized flag groups are parsed by the
  extraction-equality test (2026-07-26 spec D6) in
  skills/war/assets/workflow-template.test.mjs — reshape both together"), per the #811
  shared-string coupling-comment precedent. **D-letter namespace caution (red-team):** the
  hook's existing comments already use a PRIOR spec's D-numbers (e.g. line ~164
  `READ-FORM branch enforcement (D4)` is the 2026-07-22 spec's D4, not this plan's) — the
  new comment must carry the `2026-07-26 spec` qualifier and no existing D-numbered comment
  is renumbered. The deny-string lines
  themselves are byte-untouched and must not be reflowed — they are D6's extraction target
  and Task 1.2 merges against them.
  **(b) D3 micro-teach:** the forbidden-char `deny()` message — the deny site the measured
  runs actually trip that names no sanctioned alternative (seven other hintless deny sites
  exist but carry no measured traffic; they are out of scope) — gains a bounded suffix after
  the byte-preserved prefix and
  `head -c 20` residue echo. Wording latitude is allowed; the contract is the prefix intact at
  the front plus the three teach elements: run **one bare git command per Bash call**; split
  `&&` / `;` chains and continuations into separate calls; filter and search output with the
  Read/Grep/Glob tools. The span `one bare git command per Bash call` is **byte-frozen** — the
  new deny-teach case pins it, so polish only the prose around it (a worker polishing the
  frozen span reds its own test, by design). Suggested shape (spec §4): `command contains forbidden character(s):
  <residue> — the guard admits one bare git command per Bash call: split && / ; chains and
  continuations into separate calls; filter and search output with the Read/Grep/Glob tools`.
  **(c) Shell-test cases:** new allow cases `git blame -L 10,+5 hooks/validate-auditor-git.sh`
  and `git blame -L /deny/,+10 hooks/validate-auditor-git.sh` (numeric + regex `-L` forms) and
  `git log -L 5,+3:hooks/validate-auditor-git.sh` (required — the log/blame case arms carry no
  per-flag policing and `-L` matches no post-subcommand deny pattern; code-traced at plan
  time, worker re-confirms at its base); one new composition deny case
  `git blame -L 1,+5; rm -rf .` (`expect_deny` — the widening must not weaken chain denial);
  and **two** `expect_deny_teach` invocations on `git diff HEAD && git log`: one asserting
  `forbidden character(s): &&` (byte-preserved prefix + residue echo at the front) and one
  asserting `one bare git command per Bash call`, each alongside the `WAR:` marker. The teach
  case is site-pinned by routing, not merely by substring: the char check is the first check
  after the empty-command guard, so this payload can only exit at the forbidden-char deny
  site — a future teach-vocabulary overlap at another deny site cannot make it pass vacuously.
  **(d) D2 citation:** one comment line added to the G6 case citing this spec's D2 third
  ratification of the `git grep` denial (after ADR 0029's "widen the auditor allowlist to add
  a `grep` verb — rejected, deferred" record and the 2026-07-22 spec's D3); the G6 case itself
  stays `expect_deny`, payload byte-identical. **Additionally (operator-ratified at the
  war-machine volley, superseding spec §7's comment-only vehicle; vehicle re-adjudicated at
  red-team):** append a new dated section at the **end** of
  `docs/adr/0029-capture-grounds-on-committed-tip.md` — heading
  `## Amendment (2026-07-26): D2 third ratification of the grep-verb rejection`, one short
  paragraph recording that the auditor-guard-policy-and-mirror-truth spec D2 re-ratified the
  `grep`-verb rejection and added the `-O` pager execution-hole argument. The Considered-options
  entry and ALL pre-existing body text stay byte-unchanged — this matches the ADR's real
  precedent (the appended `## Amendment (2026-07-22)` section, whose closing sentence states
  the Considered options were left byte-unchanged) and its "superseded, never edited"
  convention; an in-place entry edit would have falsified both (red-team finding). Injection
  groups C, E, H5 and all existing
  cases untouched and green — no existing case sends a `+` (verified at tip), so no fixture
  flips.
  **(e) Mandatory same-file comment survey (spec §10 criterion 9):** after the mechanical
  edits, hand-scan the shell test's group comments for char-set claims stated in other words
  ("no shell metacharacters", "char allowlist still forbids …") — the H5 comment enumerates
  `[ ] $ ( ) "` which stays true — and record every such comment in the done report as a
  survey-derived correction or an explicit confirm-correct.
  **In-worktree probes (End state 9, evidence in done report):** temporarily drop `+` from the
  new set and confirm the new allow cases go red (widening is load-bearing); revert.
  **Worker preflight (the plan's live-verification header is plan-time-dated — re-verify at
  the frozen phase base before editing):** the `tr -d` set is still the pre-change literal, no
  existing shell case sends `+` (grep the test file), and the branch deny string still carries
  the two parenthesized groups this plan quotes; a drifted base halts to the Lead, never a
  silent adaptation.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Two-arm branch clause on both mirrors + D5 re-anchor + retired-phrase negative + D6 extraction lock (D4, D5, D6)

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`
- Plan slice: spec §4 mirror + drift-guard mechanics; both mirror surfaces move in this one
  task (one commit) per the standing-instruction/dispatched-prompt split doctrine.
  **(a) D4 — `agents/war-auditor.md`:** rewrite the `` `branch` takes `=`-attached read flags
  only `` bullet in `## Read-only git guard contract` to the two-arm form of the hook's
  canonical deny string, fully enumerated: value-carrying flags `=`-attached
  (`--contains=<rev>`, `--no-contains=<rev>`, `--merged=<rev>`, `--no-merged=<rev>`,
  `--points-at=<rev>`, `--sort=<key>`), bare read flags enumerated (`--list`, `--all`, `-a`,
  `--remotes`, `-r`, `--show-current`, `--verbose`, `-v`, `-vv`); a bare name, space-form
  value, or write flag denies. No other section moves; the committed-tree-grounding
  paragraph's "git grep … stays denied" sentence remains true under D2 and stays. Wording may
  polish, but the token `=-attached` must survive and the retired claim
  "read flags only" in its `=`-attached-qualified form must not.
  **(b) D4 — `workflow-template.js`:** rewrite the branch sentence inside the
  `READ-ONLY GIT GUARD CONTRACT` clause of `auditPrompt()` to the same two-arm form, same
  commit. Re-read the provenance comment block above the clause during the edit: its existing
  claims stay true; it gains a pointer to the D6 extraction guard as the branch-flag arbiter
  (the hook string is canonical; the mirrors are followers).
  **(c) D5 — `workflow-template.test.mjs`:** the existing
  `read-only git guard contract (D5): …` registry row gains the `/value-carrying/i` and
  `/bare read flags/i` anchors (both surfaces), with its explanatory comment updated in the
  same edit (comment-lag duty). The registry row-count floor assertion and its message are
  byte-unmoved — this is a re-anchor of an existing row, never a new row. The retired-phrase
  negative lands beside the existing `RETIRED_PREMISE_SAMPLES` negative-reference precedent:
  the pre-change sentence kept as fixture samples in **both byte variants** (the .md's
  `` `=`-attached read flags only `` — backtick between `=` and `-attached` — and the JS's
  plain `=-attached read flags only`; **within the regex's matched span** that backtick is
  the only difference, which is exactly what the regex's optional backtick tolerates — the
  full surrounding sentences differ more widely (bold markers, backticked `branch`, flag
  lists), so the fixture samples must capture each surface's real bytes for the matched
  span, not a hand-normalized common form; red-team corrected the earlier only-difference
  claim — validated against
  both surfaces' real bytes at plan time), the backtick-tolerant absence regex (e.g.
  ``/=`?-attached read flags only/i``) asserted absent on both surfaces, and each fixture
  sample asserted to MATCH the regex (non-vacuity, the precedent's both-ways proof —
  "unwired" means not a live surface, never unasserted).
  **(d) D6 — `workflow-template.test.mjs`:** a new test reads `hooks/validate-auditor-git.sh`
  via the file's established `join(here, '../../../hooks/validate-auditor-git.sh')` idiom
  (`here` derives from `import.meta.url`, so it is cwd-independent under `node --test` from
  anywhere; run worktrees and the shipped plugin are full checkouts with `hooks/` at that
  offset), extracts the flag tokens from the two parenthesized lists inside the branch deny
  string (the `value-carrying flags =-attached (…)` and `bare read flags (…)` groups — split
  on commas, strip `<…>` value placeholders), and asserts every extracted token appears in
  both `auditorMd` and the dispatched `auditP` prompt with **token-boundary matching** — a
  per-token regex shaped `(?<![\w-])<escaped>(?![\w-])`, tolerant of the .md's backticks —
  never naive substring presence (`-a`, `-r`, `-v` are substrings of `--all`/`--points-at=`,
  `--remotes`, and `--verbose`/`-vv`; a dropped short flag would pass a substring check
  vacuously). An unlocatable deny string fails loudly with a
  message saying "re-point the extractor at the reshaped deny string", and the extraction
  itself asserts exactly two parenthesized groups each yielding a non-empty token list — a
  locatable anchor whose groups parse to zero tokens fails loudly with the same re-point
  message, never a vacuous green (End state 8) — never a silent skip
  and never an implication that the mirrors drifted. D5's hand anchors remain as the presence
  floor beneath it. The F03 prompt test needs no anchor change (all its fragments survive the
  D4 wording), but re-read its comment for lagging claims during the edit.
  **(e) Retired-phrase token sweep (floor) + mandatory survey:** grep the repo for the retired
  claim — tokens `read flags only` and `=-attached read flags only`, backtick-tolerant, **plus
  the inverted word order `only =-attached read flag` / `=-attached read flag (`** (red-team:
  the known sibling phrasing lives in the archived lesson
  `docs/learnings/archive/guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes.md`,
  which writes "takes only =-attached read flags" — the straight tokens never fire on it) —
  and handle every match: the two mirror surfaces are the rewrites; this task's own
  negative-reference fixture in `workflow-template.test.mjs` is the one sanctioned deliberate
  deposit (End state 5's named carve-out); at base the straight tokens hit **only** the two
  mirrors plus dated plans/specs (this plan/spec pair and the 2026-07-22
  auditor-guard-ergonomics pair — zero hits under `docs/red-team/` or `docs/learnings/`
  proper; red-team corrected the earlier match-class enumeration), and matches inside dated
  decision records, red-team reports, or lesson bodies (hot or `archive/`) are
  provenance-dated history — confirm-correct, never rewrite. Then the mandatory manual
  same-scope survey (the
  grep is a completeness floor, not a ceiling): hand-scan the full `## Read-only git guard
  contract` section of `agents/war-auditor.md`, the whole `READ-ONLY GIT GUARD CONTRACT`
  clause and its provenance comment in `workflow-template.js`, the D3 registry row comment and
  F03 test comment in `workflow-template.test.mjs`, and the `expect_deny_teach` helper comment
  plus J-group comments in `validate-auditor-git.test.sh` (its "the =-attached branch
  read-flag form" phrasing describes the micro-teach substring and is expected
  still-accurate — adjudicate, don't assume; this is a read-only scan of Task 1.1's file, no
  edit) — same-meaning siblings encode the claim in different words and survive the token
  sweep silently. List each straggler in the done report as a survey-derived correction or an
  explicit confirm-correct. A straggler adjudicated stale inside Task 1.1's files routes
  through the Lead — a Task 1.1 fix round while the wave is open, else the phase-close
  coherence sweep — never a cross-file edit by this task.
  **In-worktree probes (End state 9, evidence in done report, all reverted before commit):**
  revert one surface's branch clause → registry row REDs; paste the pre-change sentence back
  onto one surface → absence regex REDs; delete the substring-nested `-r` from one mirror →
  D6 REDs (proves token-boundary matching — naive substring would stay green via
  `--remotes`); delete `--no-contains=<rev>` from one mirror → D6 REDs; garble the hook deny
  string in the worktree copy → D6 fails loudly with the re-point message. The garble probe
  temp-writes Task 1.1's file in this task's own worktree and is reverted pre-commit (zero
  diff — no footprint collision); D6 re-proves itself against the landed hook automatically
  when the refiner gate re-runs at the serial merge.
  **Worker preflight (re-verify at the frozen phase base before editing):** both mirrors
  still carry the pre-change sentence; the guard-contract registry row still anchors
  `/one bare git/i`, `/no pipes/i`, `/ls-tree/i`, `/Grep tool/i` with both `auditorMd` and
  `auditP` in its surfaces array (verified live at plan time); the hook's branch deny string
  parses into the two expected groups. A drifted base halts to the Lead.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: this plan changes plugin-shipped surfaces (`hooks/validate-auditor-git.sh` and
  its test, `agents/war-auditor.md`, `skills/war/assets/workflow-template.js` and its test) —
  users receive them only via a release. Bump all four release slots together to the **next
  free patch above the live integration base at land time** (never a resolved semver literal,
  per the /war-strategy §2 next-free-patch convention; version literals in plans are
  non-authoritative): `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never emptied,
  no badge). `skills/war/assets/version-slots.test.mjs` is the lock-step + monotonic-floor
  arbiter — a partial bump or a downgrade is a red test. Expected integration base: **this
  plan stacks on the `2026-07-26-dispatch-args-and-floor-coverage` plan's landed tip** (base
  before that: master `738cf6a`) — resolve the next free patch from the four slots **as they
  stand at land time**, after every stacked predecessor including its own release bump, never
  from any plan literal, so stacked-release lag is absorbed by construction. Standalone
  fallback: a run through plain `/war` (outside the campaign) resolves the next free patch
  from the four slots itself. An intervening external release landing between provision and
  land surfaces as a rebase conflict on the slot lines; the re-resolution recomputes the next
  free patch from the **rebased** tip — never resolved toward the worktree's stale copy (the
  recorded gate2-stale-verify-worktree revert shape) — with the monotonic floor as backstop.
  Release blurb describes the change additively and precisely: the char allowlist admits `+`
  (unblocking `blame -L …,+N` / `log -L` range reads), the forbidden-character deny now names
  the compliant form (one bare git per call, split chains, Read/Grep/Glob), the branch clause
  on both auditor prompt surfaces now matches the hook's two-arm deny string with the full
  flag enumeration, and a new extraction-equality guard binds the mirror flag lists to the
  hook — **never** a claim that any verb was added (`git grep` stays denied — D2 third
  ratification), that any posture/exit-code/deny-site changed beyond the one message suffix,
  or a headline count its own enumeration does not match (recorded blurb lessons). Blurb homes
  (the release commit / PR body and the README `## Status` line) all sit outside End state
  5's grep scope (`agents/`, `skills/`, `hooks/`) and outside the D5 absence surfaces (the
  two mirrors); still, describe the retirement without quoting the retired phrase verbatim
  (the recorded rename-absence-guard lesson).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live-run denial-rate reduction · why deferred: D1 + D3 claim to cut the measured
  denial-retry turn-burn (#1025: 244, #1138: 52), but the actual reduction is observable only
  in a future real audit phase — no sandbox reproduces 30 opus seats' first-instinct idioms ·
  runner: `/war-review` on the next completed multi-seat `/war` run — compare auditor
  guard-denial counts (especially `+`-range and chain families) against the #1138 baseline;
  at phase close the Lead files a `war-followup` issue naming this comparison so it is
  tracked, not remembered.

## Notes / conscious deviations

- **Cross-plan ordering (spec constraint 5, ADR 0011 stack-and-plow):**
  `skills/war/assets/workflow-template.js` and `workflow-template.test.mjs` are also in the
  `2026-07-26-dispatch-args-and-floor-coverage` plan's footprint; that plan lands **first**
  and this plan's worktrees are cut from its landed tip. Task 1.2's anchors are named
  constructs (the branch sentence in the `READ-ONLY GIT GUARD CONTRACT` clause of
  `auditPrompt()`; the `read-only git guard contract (D5)` registry row), which are disjoint
  from that plan's constructs (land/polish/floor-retry dispatch prompts, stager anchors) —
  the stack rebases clean by construction. The `2026-07-26-war-memory-cli-correctness` sibling
  overlaps only on the release-slot files, which every plan's trailing release phase resolves
  at land time by design.
- **Task 1.2 reads Task 1.1's file without touching it:** the D6 extraction test and the §4
  same-scope survey both read `hooks/validate-auditor-git.sh` / `.test.sh`; neither writes
  them. The extraction target (the branch deny string) is byte-untouched by Task 1.1, so the
  tasks stay file-disjoint and parallel — no deps edge, no phase edge.
- **No new registry row, no floor bump (spec constraint 3):** D5 re-anchors the existing
  guard-contract row; the `REGISTRY.length` floor assertion and its enumeration message are
  byte-unmoved.
- **No CONTEXT.md, no new ADR (spec §6/§7):** "micro-teach" and "both-surfaces registry" are
  established terms; no new ADR is authored. The operator ratified one amendment to spec §7 at
  the war-machine volley: ADR 0029 gains an appended dated `## Amendment (2026-07-26)` section
  recording the D2 third ratification (Task 1.1(d)) alongside the G6 comment-line citation —
  the Considered-options entry itself stays byte-unchanged (vehicle corrected at red-team).
- **Gate (red-team corrected, prior premise false):** the resolved gate (`resolveGate` in
  `war-config.mjs`, engine-normalized at the ADR 0036 gate composition point in
  `workflow-template.js`) composes the `*.test.sh` discovery loop, so
  `bash hooks/validate-auditor-git.test.sh` runs inside the refiner's gate at every merge and
  land — the D1/D3 shell evidence is HARD gate-log evidence, not a deferred backstop. (The
  earlier draft cited the `refiner-dispatched-gate-…-shell-suite-blind` lesson; that lesson is
  RESOLVED #894 and archived — a gate log missing the shell section is a fresh regression,
  never a known SOFT.) The Task 1.1 worker's in-worktree suite run stays as pre-merge
  corroboration threaded into the done report.

### Resolve-round decisions (adversarial grill, self-decided)

- **`+` per-verb inertness (git-argument semantics, not just shell):** force-`+` refspec
  semantics exist only on push/fetch/pull/remote — all outside the verb allowlist. On the
  eleven allowlisted verbs `+` occurs only as revision-range text (`-L <start>,+<n>`), literal
  pathspec bytes, or a `--pretty=format:%+x` padding directive (output formatting, no
  execution); in the branch per-token loop a stray `+`-bearing token hits the default-deny arm
  (spec §8). No case arm keys on `+`.
- **log/blame `-L` pass-through code-traced:** those case arms carry no per-flag policing and
  `-L` matches neither the global-flag block nor the post-subcommand `--output`/`-o` patterns —
  the spec's "optionally `log -L`" is promoted to a required allow case on that evidence.
- **D5 registry row verified live:** its `surfaces` array asserts both `auditorMd` and the
  dispatched `auditP` per anchor — a one-surface revert REDs the row; End states 6/9 are
  achievable as written.
- **No code↔comment byte pin for the char set:** the "exactly one character" widening proof is
  checked mechanically by audit seats on the pinned diff (End state 1 states the property);
  the three comment homes move in the same edit and drift is the standing comment-lag duty's
  jurisdiction. No new self-referential test added.
- **Old-char-set prose census ran at plan time (hit-set corrected at red-team):**
  `grep -rF 'A-Za-z0-9 ./_=:,@^~%-'` hits, inside the hook, the header comment, the live
  `tr -d` **code line**, and the post-check comment — two comment homes plus code; the third
  comment home (the "Permit only: A-Za-z0-9 SPACE . / _ = : , @ ^ ~ % -" block) spells the
  set space-separated and is NOT hit by the fixed-string grep, yet D1 must still update it
  (Task 1.1(a) enumerates all three homes independently of this census). Outside the hook the
  literal appears only in dated plans/specs (provenance history) — CLAUDE.md, the tour,
  war-help, and ADR 0029 carry no char-set literal. Worker re-runs it at base.
- **ADR 0029 status note (operator-ratified, superseding the drafted spec-§7-only form;
  vehicle corrected at red-team):** the triad survivor was raised at the war-machine volley
  and the operator chose the dated status-note option — Task 1.1(d) carries it, as an
  **appended dated amendment section** (never an in-place edit of the Considered-options
  entry: the ADR's 2026-07-22 amendment precedent explicitly left the Considered options
  byte-unchanged, and the ADR records the "superseded, never edited" convention — an in-place
  note would have contradicted both). The "rejected — deferred" record itself stays
  byte-accurate; the appended section is purely additive.
- **D4 full enumeration over a pointer-to-hook shape is load-bearing:** D6 asserts every hook
  token present on both mirrors, and the mirrors exist to front-load the flag list at the
  seat's decision point; ~15 tokens/seat is the accepted cost (spec §8).
- **D3 teach wording is contract-consistent:** "filter and search output with the
  Read/Grep/Glob tools" repeats the ratified guard-contract clause's own wording; pinned-tree
  grounding (`git show <audit_sha>:<path>`) is separately taught by the committed-tree
  clause — no steering conflict.
- **Downstream stderr consumers safe:** /war-review counts guard denials by hook-denial
  observation in transcripts (the `WAR:` marker); the historical prefix survives byte-for-byte
  at the front, and `&&`/`;` in stderr are JSON-escaped transcript text — nothing parses the
  message tail.
- **Sibling disjointness verified against the DRAFTED plans, not specs:**
  dispatch-args-and-floor-coverage touches land/polish/floor-retry dispatch prompts,
  `classificationClause`, and `LITERAL_REGISTRY` — not `auditPrompt()`'s guard-contract
  clause, the D3 both-surfaces `REGISTRY` row, F03, or the row-count floor;
  war-memory-cli-correctness overlaps on release slots only; standing-doc-and-remedy-truth-
  sweep touches `agents/war-worker.md`, never `war-auditor.md`.
- **Standalone fallback:** if the dispatch-args sibling is held, this plan lands directly off
  master (constructs disjoint at both draft tips); the re-base call is operator-directed at
  campaign time (ADR 0011 + the recorded stacked-base lesson).
- **Release-slot races:** serialized by the campaign stack order (the roadmap pins release
  ordering); an external race surfaces as a slot-line rebase conflict re-resolved from the
  rebased tip with the monotonic floor as backstop. `memory.commitLearnings` is ON for this
  campaign — the Gate-2 stale-worktree revert shape is guarded by the recorded lesson
  (prefetched) plus the monotonic floor test.
- **Phase-2 floors:** `version-slots.test.mjs` sits under `skills/**` so the JS gate covers
  it; Task 2.1's `requiresTest: false` waives the assert-test-in-diff `no-test` route — the
  established release-task shape.
- **Live-hook exposure accepted:** this repo's own subsequent runs consume the tip hook
  immediately (no release gate). The change is additive-permissive plus one message suffix;
  the failure direction is fail-closed (extra denials, never a new allow), the bash-3.2 suite
  runs pre-merge, and this campaign's own later audit seats are the live canary — the same
  accepted path as the 2026-07-22 widening.

## Open decisions

None — D1 through D6 are resolved in the spec; the only latitude left to workers is bounded
wording polish (D3 suffix, D4 clause) inside stated token contracts.
