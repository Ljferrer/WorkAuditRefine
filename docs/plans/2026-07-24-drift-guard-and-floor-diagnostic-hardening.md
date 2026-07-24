# Drift-guard and floor-diagnostic hardening — pair D18's routing anchors, re-anchor FLOOR_SITE_RE with a source-derived count cross-check, true up the near-miss advisory and the guard-contract mirror claim

Source spec: `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md` (survey
2026-07-24, group `drift-guard-and-floor-diagnostic-hardening`, issues #1040 #1049 #1050 #1080 —
all open `war-followup`/`memory-mined` findings; source lessons
`doc-prose-verbatim-claim-overstates-token-anchor-drift-guard` and
`drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape`).

## Commander's Intent

- **Purpose:** four adjacent truth-of-the-guard defects, all verified live, none touching runtime
  behavior — D18's four presence-anywhere routing anchors cannot see the two exhaustion routes
  swapped (#1040); the #1046 floor-site discovery regex terminates on the `requiresTest:false`
  skip arm's `: pt`-backtick line shape instead of the invocation's own grammar, so a 5th site
  written inline is swallowed into its neighbor and a 5th site appended after the last terminator
  is never discovered, both under a still-green `>= 3` floor (#1050); the test-floor near-miss
  advisory asserts one specific wrong cause ("the pattern is wrong") for excluded-location files,
  and D6 carries that misattribution verbatim into `floor_diagnostic` and the add-test fix-worker
  prompt (#1049); and `agents/war-auditor.md` claims the read-only git guard contract is "mirrored
  verbatim" into the dispatched audit prompt when the enforcing D3 registry row anchors four
  tokens per surface and the two surfaces are deliberately different formats — the claim is false
  today (#1080). Make each guard discriminate the defect it polices, and each prose claim state
  exactly what is enforced.
- **Method:** tests, one stderr diagnostic line, and one standing-doc sentence only — exit codes,
  routing enums, prompt bytes, matcher logic, and floor semantics are untouched, and
  `skills/war/assets/workflow-template.js` shows no diff. Every hardened guard is proven RED
  against the defect it polices before landing green — the swapped D18 routing via in-memory
  string surgery on the extracted bullet, the two #1050 simulations via in-memory mutated copies
  of the template source, the #1049 advisory via a committed excluded-prefix stderr case that
  fails against the pre-change wording — with red-then-green proofs recorded in the commit body
  (the file-local D18 "Red-then-green PROVEN" precedent). Ratified floors stay ratified: the
  `>= 3` non-vacuity floor survives (never an exact hardcoded count — the new cross-check is an
  equality whose both sides derive from the same source string, no literal to rot); the
  D5-ratified exclusion-free `near_miss()` set is not touched (the fix is the one advisory line
  that asserts the wrong cause, never new exclusion arms or pattern workarounds — floor ⊆ gate is
  load-bearing); token-anchoring stays the correct mirror mode for cross-format prose (the #1080
  fix trues the claim to the mechanism, never upgrades to quote-lint-fragile byte-identity).
  Shell edits stay bash-3.2-safe and cwd-independent; every grep is a completeness floor backed by
  the spec's §4.5 hand-surveys; every edit site anchors by named construct, never line number.
- **End state:**
  1. **D18 discriminates:** the D18 test's four-entry "Non-vacuous companion" presence loop in
     `skills/war/assets/skill-doc-contracts.test.mjs` is replaced by paired first-following-route
     assertions — for each of `merge site` → `held:escalation` and `land site` →
     `held:land-failed`, the FIRST `held:[a-z-]+` token after the site token in the extracted
     environment bullet must equal that site's route. Against a copy of the extracted bullet with
     the two `held:*` tokens swapped (in-memory string surgery, no SKILL.md edit), both paired
     equality assertions fail; against the live SKILL.md the test passes, and the commit body
     records, per pair, the matched site occurrence and the captured `held:*` token at the
     pre-change base — the green half, proving each capture hits the intended token despite the
     bullet's interleaved markup (the born-vacuous-anchor precedent) — alongside the swap red.
     `node --test skills/war/assets/skill-doc-contracts.test.mjs` green.
  2. **FLOOR_SITE_RE hardened:** the #1046 drift-guard's capture terminator is re-anchored on the
     enclosing `pt` template literal's own closing backtick (a negated-backtick class that cannot
     cross into a neighboring template), and a new cross-check asserts the discovered site count
     `===` the raw invocation-head literal count, both derived from `src` — no hardcoded site
     count in any **assertion** (the test's descriptive "(four at this base: …)" prose
     enumeration survives, self-scoped by "at this base"), and the ratified `>= 3` non-vacuity
     floor plus every per-site token assert are retained unchanged. The two mutation replays
     against in-memory copies each red via the count cross-check, pinned to the shapes that
     exercise it: SIM A — a 5th invocation head inserted **inside an existing site's template
     literal**, sharing its closing backtick (discovered 4, raw 5); SIM B — a bare 5th head
     appended **after the final template's closing backtick, enclosed in no template**
     (discovered 4, raw 5). A well-formed 5th site in its own template is discovered and
     adjudicated by the per-site arms — the fix's success mode, not a red case. At this base the
     equality reads 4 === 4 (initial merge, floor-retry re-merge, environment-proceed,
     baseline-proceed). The rewritten header comment states the closing-backtick anchor, the
     by-construction skip-arm exclusion, BOTH residuals — the fail-closed inline-backtick
     truncation (loud false red) and the accepted head-shape residual (a site whose invocation
     head diverges from the canonical interpolation escapes both sides of the equality) — and the
     plan-3 reconciliation (the `>= 3` floor retained; the equality is source-derived on both
     sides, never an exact-count hardening). Red proof recorded in the commit body.
  3. **Advisory truth:** the closing advisory line of the near-miss block in
     `skills/war/assets/assert-test-in-diff.sh` names BOTH possible causes — the pattern
     (`--pattern` / `overrides.testPattern`) and the excluded location, enumerating the three
     excluded prefixes literally (`node_modules/`, `.git/`, `.claude/`) as the gate-discovery
     mirror — and a new excluded-prefix stderr case in the case-12 family of
     `skills/war/assets/assert-test-in-diff.test.sh`, on a fresh `setup_repo` git-repo fixture,
     (i) lists the excluded file in the near-miss listing, (ii) asserts the advisory names the
     location cause pinning ALL THREE prefixes (`node_modules/`, `.git/`, `.claude/`) — RED
     against the pre-change wording, the discrimination proof — and (iii) asserts the advisory
     still names `--pattern` / `overrides.testPattern`. stdout on the exit-1 path stays
     byte-empty (asserted on this case's own fixture), every existing case-3/case-12 assertion
     still passes, and `bash skills/war/assets/assert-test-in-diff.test.sh` is green.
  4. **Mirror claim trued and locked:** case-insensitive grep finds no `mirrored verbatim` in
     `agents/war-auditor.md`, AND the retirement is locked by a committed absence assertion —
     `assert.doesNotMatch(auditorMd, /mirrored verbatim/i)` in
     `skills/war/assets/workflow-template.test.mjs` (the file already loads `auditorMd` and
     carries the retired-fragment absence idiom; landed by Task 1.2, deps-ordered after Task
     1.4). The reworded guard-contract intro sentence keeps its opening clause **in substance** —
     the guard name `hooks/validate-auditor-git.sh`, the fail-closed denial, the read-only-git
     scope; byte-identity is NOT required (no test pins those bytes — the F03 doc test's
     `/guard|read.?only/i` is the only mechanical pin on this sentence, and the D3 anchors avoid
     it entirely) — keeps the both-surfaces one-commit discipline clause and the trailing colon,
     and names the both-surfaces registry row in `skills/war/assets/workflow-template.test.mjs`
     as the token-anchored drift arbiter. The D3 registry row's four anchors (`one bare git` /
     `no pipes` / `ls-tree` / `Grep tool`) and all F03 war-auditor.md doc tests pass untouched.
  5. **No behavior drift:** the phase diff shows no edit to
     `skills/war/assets/workflow-template.js`; the `assert-test-in-diff.sh` diff is exactly the
     one advisory `printf` line (no matcher, exit-code, `near_miss()`, or custom-pattern-branch
     change — the exit-1 stdout contract stays byte-empty per the case-12 locks); and no enum,
     schema, routing, or prompt surface changes anywhere.
  6. **Sweeps swept, dispositions recorded:** the four §4.5 sweeps ran file-anchored (never
     repo-root — the `.claude/worktrees/` stale-duplicate trap) with every match handled and the
     disposition in the done reports: the `workflow-template.js` `mirrored VERBATIM` source
     comments survive untouched (other constructs, each with its own arbiter); the `=`-attached
     bare-flag straggler on both auditor surfaces is #1085's claim (sibling
     `runbook-and-standing-record-coherence` group) — deferred here, with the orphaned-mirror
     follow-up filed by the Lead at Phase-1 close (Notes); `pattern is wrong` matches only the
     advisory line being replaced; `FLOOR_SITE_RE` is the only terminator-coupled discovery regex
     in its file, and the D18 companion loop was the only multi-token presence loop in its file.
  7. **Suites green:** `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over
     `hooks/` + `skills/` both pass.
  8. **Release lands last:** all four version slots bump in lock-step to the next free patch
     above the live integration base at land time; `version-slots.test.mjs` green.

## Build order (for /war)

1. **Phase 1 — Guard discrimination + diagnostic truth** (wave 1: 1.1 ∥ 1.3 ∥ 1.4 —
   file-disjoint; wave 2: 1.2 with `deps: [1.4]` — its absence lock consumes Task 1.4's merged
   doc state, a genuine content dependency, never a same-file dodge)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Guard discrimination + diagnostic truth

### Task 1.1: D18 paired first-following-route assertions — a swapped routing must red (#1040)

- Files: `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **Pairing (spec §4.1).** In the D18 test, replace the four-entry "Non-vacuous
  companion" presence loop (the `for (const [anchor, why] of [...])` block over `merge site` /
  `land site` / `held:escalation` / `held:land-failed`) with the paired first-following-route
  check over the already-extracted environment bullet `b`: for each pair
  `['merge site', 'held:escalation']` and `['land site', 'held:land-failed']`, match
  `` new RegExp(`${site}[^]*?(held:[a-z-]+)`, 'i') `` against `b`, `assert.ok` the match (a
  missing site token fails loudly — site presence is subsumed), and `assert.equal` the captured
  first-following `held:*` token (lowercased) to the pair's route, one loud per-pair message each
  (spec §4.1 carries the reference implementation; exact message text is worker latitude within
  End state 1). The bullet-extraction regex, both absence keys, and the four presence anchors
  above the loop are untouched.
  **Comments move with the code (same edit):** update the "Non-vacuous companion" comment line to
  describe the pairing (presence-anywhere anchors could not discriminate a swapped routing,
  #1040), extend the D18 header comment's red-then-green note with the swap proof, and record the
  guard's TWO fail-closed residuals in the same comment (symmetric with FLOOR_SITE_RE's residual
  mandate): (a) the pairing assumes site-before-route ordering within each sentence; (b) a later
  doc edit that adds an early JOINT mention ("at either the merge site or land site …") before
  the real routing sentences makes the first-following grab capture from the joint sentence — a
  loud false red forcing a deliberate re-anchor, never a silent pass.
  **Red-then-green proof (commit body):** the red half — run the paired assertions against a copy
  of the extracted bullet with the two `held:*` tokens swapped (in-memory string surgery, no
  SKILL.md edit); both `assert.equal`s must fail. The green half — at the pre-change base, record
  per pair the matched site occurrence (offset or surrounding fragment) and the captured `held:*`
  token, proving each capture hits the intended token despite the bullet's interleaved
  `**`/backtick markup (the D18 absence keys' born-vacuous precedent). Both halves in the commit
  body (the file-local "Red-then-green PROVEN" D18 precedent). SKILL.md itself is never edited —
  the live bullet already orders site-before-route (spec §8).
  **Same-scope survey (spec §4.5 item 4 — this file's share):** confirm at implementation time
  that the D18 companion loop is the file's only multi-token presence loop — the other rows
  (D10–D17) assert single-construct anchors where pairing is not the invariant; no further
  corrections expected. Any new straggler: fix here only if inside this file and stale for exactly
  this change's reason; otherwise a named `war-followup` in the done report.
  **Rebase duty (campaign stacking):** plan 2 of this campaign
  (`runbook-and-standing-record-coherence`) lands two new locks in this same file before this
  plan; the worker's first act is a rebase onto the integration tip carrying them. The D18 edit is
  confined to the D18 test block — reconcile any textual adjacency at rebase, never touch the two
  new locks.
- requiresTest: true — the deliverable IS the hardened test; the diff touches
  `skill-doc-contracts.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: FLOOR_SITE_RE re-anchor on the template's closing backtick + source-derived count cross-check + retired-claim absence lock (#1050, lock for #1080)

- Files: `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **Re-anchor (spec §4.2, design rows 4–5).** In the #1046 `floor_diagnostic`
  drift-guard block, replace the `FLOOR_SITE_RE` terminator — currently the lazy
  `([^]*?)\n\s*: pt\`` capture ending on the `requiresTest:false` skip arm's line shape — with
  the enclosing `pt` template literal's own closing backtick:
  ```js
  const FLOOR_SITE_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}([^`]*)`/g
  ```
  The negated-backtick class cannot cross into a neighboring template (kills the swallow-forward
  at the source), a site appended in its own later template still matches, and the skip arms and
  prose mentions stay excluded by construction — they carry no `${testPatternArg}` head.
  **Count cross-check (fail-closed backbone).** Inside the test, before the per-site loop: count
  raw occurrences of the invocation-head literal (the same head — script name + both ref
  interpolations + `${testPatternArg}` — with no capture or terminator) in `src`, and
  `assert.equal(sites.length, rawCount, ...)` with a message naming the escape mode ("a
  dispatched floor site escaped discovery — its capture instruction is unchecked"). Keep the
  existing `>= 3` non-vacuity floor and all per-site token asserts (`floor_diagnostic`, `stderr`,
  `verbatim`, exit-1 scoping) byte-unchanged. **Never a hardcoded site count in any assertion**
  (the descriptive "(four at this base: …)" prose comment survives, self-scoped) — the `>= 3`
  floor is red-team-ratified and plan 3's End state 5 records it; the equality is not an
  exact-count hardening in that prohibited sense: both sides derive from the same source string,
  there is no literal to rot (design row 5).
  **Header comment rewrite (same edit):** the FLOOR_SITE_RE comment currently explains the
  ternary false-arm terminator; it must now state (a) the closing-backtick anchor and the
  by-construction exclusion of skip arms and prose mentions; (b) BOTH residuals — the fail-closed
  inline-backtick residual (a future floor arm embedding an inline backtick *before* its capture
  tokens truncates that site's capture and reds the per-site asserts — loud false red, never a
  silent pass; spec §8) and the accepted head-shape residual (a site whose invocation head
  diverges from the canonical `${ph.integrationBranch} ${r.task.branch}${testPatternArg}`
  interpolation escapes BOTH the discovery regex and the raw count — equality holds, silent
  escape; mitigation: the canonical head is the invocation grammar every dispatched site copies,
  so a new site is authored by copying an existing one); and (c) the ratified-floor
  reconciliation — the `>= 3` floor is retained and the equality is source-derived on both
  sides, never the prohibited exact-count hardening — so a later gate-audit reading the block
  cannot misadjudicate it against the sibling plan's pin.
  **Retired-claim absence lock (End state 4's committed half — the deps edge).** Add one
  `assert.doesNotMatch(auditorMd, /mirrored verbatim/i, ...)` beside the file's existing
  retired-fragment absence asserts (the `%-format` / `reflog syntax` idiom in the D5 block), so
  the #1080 overclaim cannot silently return. `auditorMd` is already loaded at the top of the
  file. This lock consumes Task 1.4's merged edit — hence `deps: [1.4]`; the wave-2 worker's
  first act is a rebase onto the integration tip carrying it, and the lock is born green there
  (on the frozen phase base it would be born RED — the ordering is load-bearing).
  **Red proof (commit body):** replay the issue's two mutations against in-memory mutated copies
  of the template source (nothing written to disk), pinned to the shapes that exercise the
  cross-check (grill-corrected): SIM A — insert a 5th invocation head INSIDE an existing site's
  template literal, sharing its closing backtick → discovered 4, raw 5, equality reds; SIM B —
  append a bare 5th head after the final template's closing backtick, enclosed in no template →
  discovered 4, raw 5, equality reds. Note in the proof that a well-formed 5th site in its own
  template is discovered and adjudicated by the per-site arms — the success mode, not a red
  case. At this base the live cross-check reads 4 === 4.
  **Same-scope survey (spec §4.5 item 4 — this file's share):** grep the `: pt`-backtick
  terminator sequence across this file — at this base FLOOR_SITE_RE is the only discovery regex
  anchored on that shape; hand-scan the file's other discovery regexes for a second instance of
  the class (none expected). Dispositions in the done report.
  **Rebase duty (campaign stacking — the manifest's Depends-on edge):** this plan stacks after
  plan 3 (`recovery-re-merge-dispatch-coherence`), which lands `submodMergeNote` appends at the
  three retry re-merge dispatches and new dispatch-capture tests in this same file. The appends
  are `+ submodMergeNote` segments *outside* each template literal's closing backtick, so both
  the re-anchored match set and the raw head count are insensitive to them — expected parity
  stays 4 === 4 after rebase. Re-run the block post-rebase; if a rebased-in change threaded prose
  with an inline backtick between an invocation head and its capture tokens, the fail-closed red
  fires and the regex is adjusted then, deliberately (spec §8).
- requiresTest: true — the deliverable IS the hardened drift-guard; the diff touches
  `workflow-template.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: [1.4]
- target repo: superproject

### Task 1.3: Near-miss advisory two-cause rewording + excluded-prefix stderr case (#1049)

- Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: **Advisory rewording (spec §4.3, design rows 2–3).** Replace the closing advisory
  line of the near-miss diagnostic block — the final `printf` before the unconditional `exit 1`,
  the line currently asserting "the pattern is wrong for this repo (`--pattern` /
  `overrides.testPattern`), not the diff" — with a two-cause statement in the spirit of (exact
  bytes are worker latitude within End state 3's checkable floors):
  ```
  if those ARE the mapped tests, either the pattern is wrong for this repo (--pattern / overrides.testPattern) or the file sits under an excluded location (node_modules/, .git/, .claude/ — mirrored from the gate's discovery) — not the diff.
  ```
  The three excluded prefixes are enumerated literally (design row 3: the advisory IS the product
  — it rides `floor_diagnostic` into a fix-worker prompt where a vague pointer is useless; the
  set mirrors the gate's find-exclusions, which move in lock-step with `resolveGate` under the
  floor ⊆ gate discipline, and the new test pins all three literals so silent drift in the
  advisory reds). The line stays an unconditional disjunction — one printf, no location logic in
  the diagnostic block (Notes record the rejected conditional variant). stderr-only: the exit-1
  stdout contract stays byte-empty, and `near_miss()`, `match_sh_suite()`, `match_default()`, the
  custom-pattern branch, and every exit code are untouched — **no exclusion arms are added
  anywhere** (D5-ratified exclusion-free diagnostic set; adding them would remove the excluded
  file from the very listing the fix-worker needs) **and no pattern workaround is advised** (a
  `--pattern` "remedy" would break floor ⊆ gate — spec §2).
  **New test case (the discrimination proof).** In `assert-test-in-diff.test.sh`, add one case to
  the existing case-12 near-miss stderr family, on a **fresh `setup_repo` git-repo fixture** —
  this floor probes real refs, so the fixture must be a repository (the hook-suite
  fixtures-outside-git idiom does NOT apply here) — reusing the case-3f diff shape:
  `node_modules/x/foo.test.sh` committed on a task branch (`near_miss()`'s `*.test.*` arm catches
  it while `match_sh_suite` refuses it). Follow the family's existing capture idiom exactly — two
  invocations of the same fixture so stdout and stderr are captured separately, `TMPFILES`
  cleanup, bash-3.2-safe, cwd-independent. Assert: exit 1; **stdout byte-empty on this case's own
  fixture**; (i) the near-miss block lists `node_modules/x/foo.test.sh`; (ii) the advisory names
  the location cause pinning ALL THREE excluded prefixes — `grep -qF` each of `node_modules/`,
  `.git/`, `.claude/` — **RED against the current wording**, record it as the discrimination
  proof; (iii) the advisory still names `--pattern` and `overrides.testPattern`.
  **No prompt or standing-doc companion edit:** D6 already carries the stderr verbatim into
  `MERGE_RESULT.floor_diagnostic` and the add-test fix prompt — fixing the one line fixes every
  downstream consumer; `agents/war-refiner.md` and the dispatched prompts are untouched (spec
  §4.3).
  **Same-scope survey (spec §4.5 item 3 — this task's share):** grep `pattern is wrong` across
  `skills/` and `hooks/` — at this base the only match is the advisory line being replaced.
  Hand-scan the script's header comment and `match_sh_suite`'s comment: both state the exclusion
  set, remain accurate, and are the mirror the new stderr line cites — no edit; no doc elsewhere
  quotes the old advisory. Dispositions in the done report.
- requiresTest: true — the deliverable includes the new excluded-prefix stderr case; the diff
  touches `assert-test-in-diff.test.sh`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Guard-contract mirror claim trued — token-anchored, arbiter named (#1080)

- Files: `agents/war-auditor.md`
- Plan slice: **Sentence rewrite (spec §4.4, design row 6).** In the
  `## Read-only git guard contract` section's intro sentence, rewrite ONLY the trailing clause —
  drop "mirrored verbatim into your dispatched audit prompt (both surfaces, one commit)" in favor
  of wording that states what is actually enforced and names the arbiter, in the spirit of (exact
  bytes are worker latitude within End state 4's checkable floors):
  > …this contract is carried on both surfaces — this standing card and your dispatched audit
  > prompt, edited together in one commit; the both-surfaces registry row in
  > `skills/war/assets/workflow-template.test.mjs` anchors the shared tokens and is the drift
  > arbiter:
  The sentence's opening keeps its SUBSTANCE — the guard name `hooks/validate-auditor-git.sh`,
  the fail-closed denial, the read-only-git scope — but byte-identity is NOT required: no test
  pins those bytes (grill-verified — the F03 doc test's `/guard|read.?only/i` is the only
  mechanical pin on this sentence, and the D3 row's four anchors avoid it entirely); mandating
  byte-identity would be a closure rationale without a code trace, falsely constraining worker
  latitude (Notes). The trailing colon survives (the sentence introduces the bullet list), the
  one-commit both-surfaces discipline clause survives in the rewording — that discipline is real
  and test-backed; only the "verbatim" strength claim goes (spec §8) — and the contract bullets
  below the sentence are untouched.
  **No companion edits:** the dispatched prompt never carried the "verbatim" claim, so no
  `workflow-template.js` edit exists to mirror (the standing-vs-dispatched same-commit rule is
  satisfied vacuously — this is a meta-claim about enforcement, not a behavioral instruction;
  spec §2), and the D3 registry row and all F03 war-auditor.md doc tests must stay green
  untouched. The committed regression lock for the retired claim lands in Task 1.2 (the
  `workflow-template.test.mjs` owner), deps-ordered after this task.
  **Same-scope survey (spec §4.5 items 1–2 — this task's share):** sweep `mirrored verbatim`
  case-insensitive across `agents/` and `skills/war/assets/workflow-template.js` and handle every
  match. Expected at this base: this sentence (fixed here) and several `workflow-template.js`
  source comments describing OTHER mirrored constructs (worker-result/force-with-lease, the ADR
  0013 latitude/disposition block, the calibration block) — each coupled to its own drift test,
  several genuinely byte-shared (#811 precedent); survivors, no edit (spec §9). During the edit,
  re-confirm the known straggler: the `branch takes =-attached read flags only` bullet
  enumerates five bare flags in the same parenthetical on both auditor surfaces — #1085's claim
  in the sibling `runbook-and-standing-record-coherence` group; deliberately NOT fixed here
  (design row 7), disposition in the done report, orphan closed by the Lead-filed follow-up at
  Phase-1 close (Notes). Any new straggler: named `war-followup`, never edited.
- requiresTest: false — docs-tier (one standing-card sentence; the existing D3 registry row and
  F03 locks arbiter the surviving content, and the new absence lock ships in Task 1.2 — no test
  surface in this task's own diff)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes shipped plugin assets (`assert-test-in-diff.sh` runs refiner-side
  in user installs; `agents/war-auditor.md` is a shipped standing card; the hardened suites ship
  with the plugin) — users receive the fixes only via a release. Bump all four release slots
  together to the **next free patch above the live integration base at land time** (never a
  resolved semver literal; version literals in plans are non-authoritative): `plugin.json`
  `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`, and the
  `README.md` `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 8). Expected integration base: the campaign working branch tip after this
  plan's Phase 1 lands — this is plan 4 of the campaign, stacking after the
  land-advance-exit-contract-truth, runbook-and-standing-record-coherence, and
  recovery-re-merge-dispatch-coherence plans, each carrying its own trailing release bump, so the
  slot baseline at land time reflects however many of those releases have landed (stacked
  releases lag cumulatively — resolve the next free patch from the four slots **as they stand at
  land**, never from any plan's literal). Standalone fallback: a run through plain `/war` outside
  the campaign resolves the next free patch from the four slots itself. Release blurb describes
  the change precisely: two drift guards now discriminate their defects (D18's gate-site routing
  is pair-checked; the floor-site discovery regex anchors on the template's own grammar with a
  source-derived count cross-check), the test-floor near-miss advisory names excluded locations
  as a second possible cause, and the auditor card states the guard contract's token-anchored
  arbiter — never a claim that any floor exit code, matcher, routing enum, prompt byte, or guard
  verb set changed.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Post-stack discovered-count parity — after Task 1.2's worker rebases onto the integration tip
  carrying plan 3's `submodMergeNote` appends and new dispatch-capture tests (plus this phase's
  wave-1 merges), the `sites.length === rawCount` equality executes live in the merge gate; the
  Lead re-confirms at Phase-1 land that the #1046 block is green on the landed tip, with parity
  still 4 === 4 (or both sides grown together by a genuinely new dispatched site) · why
  deferred: parity against the sibling plan's changes is a property of the advancing integration
  tip, not of this plan's frozen dispatch base · runner: the merge gate at Task 1.2's serial
  merge (mechanical), re-confirmed by the Lead at Phase-1 land.
- Integrated-tip sweep re-check — re-run the §4.5 greps on the landed Phase-1 tip:
  case-insensitive `mirrored verbatim` over `agents/` + `skills/war/assets/workflow-template.js`
  (expect zero hits in `agents/war-auditor.md` — now also locked by Task 1.2's committed absence
  assertion — and the surviving source comments elsewhere); `pattern is wrong` over `skills/` +
  `hooks/` (expect zero hits — the advisory line is replaced); the `: pt`-backtick terminator
  hunt in `skills/war/assets/workflow-template.test.mjs` (expect FLOOR_SITE_RE's old shape gone,
  no new instance of the class) · why deferred: the four tasks adjudicate at their own frozen
  bases; the absence claims (End state 6) are properties of the integrated tip after the serial
  merge queue, and an audit-time finding can be stale by land time · runner: the Lead at Phase-1
  land, before dispatching Phase 2.

## Notes / conscious deviations

- **Decomposition:** the four defects live in four disjoint file sets — one task each; wave 1
  runs 1.1 ∥ 1.3 ∥ 1.4, and 1.2 runs in wave 2 with `deps: [1.4]` (below). #1049's script and
  its suite move together in Task 1.3 (the discrimination test travels with the change —
  splitting them would ship the reworded advisory a wave naked). Release is its own trailing
  phase per the rule. **Release answer recorded (grill Q4): this plan carries its OWN trailing
  bump (Phase 2), never riding a sibling plan's release.**
- **Absence-lock placement and the deps edge (grill Q10/Q11, self-decided):** the committed
  `assert.doesNotMatch(auditorMd, /mirrored verbatim/i)` lock replaces a one-time land grep as
  the durable half of End state 4 — the retired-claim absence idiom already exists in
  `workflow-template.test.mjs` (the `%-format` / `reflog syntax` asserts) and the file already
  loads `auditorMd`. It lives in Task 1.2 because that task owns the file (file-disjointness
  preserved — Task 1.4 stays `agents/war-auditor.md`-only and requiresTest:false docs-tier);
  `deps: [1.4]` is a genuine content dependency (the lock asserts a property of 1.4's merged
  output and would be born RED on the frozen phase base), never a same-file dodge. #1040/#1050
  carry requiresTest:true satisfied by their own `.test.mjs` edits being the test-in-diff.
- **The count cross-check is NOT the prohibited exact-count hardening.** Plan 3's End state 5 and
  the merge-land-resilience red-team adjudication pin the #1046 guard as a `>= 3` non-vacuity
  floor plus per-site arms, "never harden it to an exact count" — that prohibition targets a
  hardcoded literal that rots on the next stacked site. This plan keeps the `>= 3` floor and all
  per-site arms byte-unchanged and adds an equality whose both sides derive from the same source
  string (design row 5): a new site grows both counts together; no literal exists to rot. The
  reconciliation is ALSO written into the rewritten header comment (grill Q5) so a later
  gate-audit reading the block cannot misadjudicate the equality against the sibling pin. Plan
  3's Notes carry a "traced at drafting" description of FLOOR_SITE_RE's OLD lazy-span terminator
  — a plan-document snapshot of plan 3's drafting base, not a live-code contract; this plan's
  re-anchor post-dates it, and every invariant plan 3 actually pinned (all four sites discovered,
  per-site arms green, `>= 3` floor, no exact count) holds under the new anchor.
- **SIM shapes pinned (grill Q6 — truth correction to spec §4.2's replay wording):** under the
  closing-backtick terminator, the cross-check's discrimination is exercised only by SIM A's
  same-template inline head (a 5th head inside an existing site's template — discovered 4, raw
  5) and SIM B's unenclosed appended head (after the final closing backtick, in no template —
  discovered 4, raw 5). A well-formed 5th site in its own template is DISCOVERED and adjudicated
  by the per-site arms — the fix working, not a red case. The issue's original SIM B was defined
  against the old regex; the replay uses the unenclosed shape so the equality is what reds.
- **Head-shape residual accepted and documented (grill Q2):** a future site whose invocation
  head diverges from the canonical `${ph.integrationBranch} ${r.task.branch}${testPatternArg}`
  interpolation escapes both the discovery regex and the raw count — equality holds, silent
  escape. Accepted: the canonical head IS the invocation grammar every dispatched site copies
  (all four live sites are byte-identical heads), and the rewritten header comment names this
  residual beside the fail-closed backtick residual so the escape mode is on the record where the
  next editor works.
- **Byte-identity claim corrected (grill Q7 — conscious deviation from spec §4.4):** the spec
  says the sentence's opening "is load-bearing for other anchors and stays byte-identical", but
  no test anywhere pins "fail-closed denies" or "read-only git command" as bytes (grill-verified;
  the F03 doc test pins only `/guard|read.?only/i`, and the D3 anchors avoid the sentence). The
  plan pins the opening's SUBSTANCE and leaves bytes to worker latitude — mandating byte-identity
  would be a closure rationale without a code trace (the recorded lesson class).
- **Advisory stays an unconditional disjunction (grill Q8, self-decided):** a conditional
  location clause (printed only when a listed near-miss sits under an excluded prefix) would be
  sharper but (i) re-introduces exclusion-aware logic into the diagnostic block whose cheap
  exclusion-free ceiling is D5-ratified, (ii) breaks End state 5's exactly-one-printf-line diff
  pin, and (iii) the disjunction is never false — it names two possible causes where the old
  line asserted one specific wrong one; the fix-worker also receives the near-miss listing
  itself, prefix visible. Three-prefix pinning in the new case (grill Q9) couples all three
  advisory literals to the suite — advisory drift reds; matcher-set drift stays governed by the
  existing floor ⊆ gate lock-step with `resolveGate` (header + `match_sh_suite` comment already
  state the set; the advisory is deliberately a further statement WITH a test pin, not another
  unpinned one).
- **#1085 straggler deferred WITH a named vehicle (grill Q1):** plan 2's hook task is
  `hooks/`-only and reports-never-edits `agents/*.md` stragglers, so after both groups land the
  standing-card bullet AND the dispatched `READ-ONLY GIT GUARD CONTRACT` clause in
  `workflow-template.js` still carry the `=`-attached mischaracterization. This plan does NOT
  claim those two mirrors (design row 7 is spec-ratified: the hook deny string and both mirrors
  must move together, and this group owns neither the hook nor that sentence family — and End
  state 5 pins no `workflow-template.js` edit). So the deferral cannot vanish: at Phase-1 close
  the **Lead files ONE `war-followup` issue** naming both surviving mirror surfaces
  (`agents/war-auditor.md`'s `=`-attached bullet; the dispatched guard-contract clause in
  `skills/war/assets/workflow-template.js`), citing #1085, plan 2's hooks-only footprint, and
  this plan — the same phase-close filing route plan 3 uses.
- **Campaign contention (for the roadmap table):** this is plan 4 of 6, stacking after plans 1–3
  (ADR 0011 stack-and-plow; the later lander owns rebase-by-named-anchor).
  - `skills/war/assets/workflow-template.test.mjs` — shared with plan 3
    (`recovery-re-merge-dispatch-coherence`: three `submodMergeNote` appends in
    `workflow-template.js` plus new dispatch-capture tests in this test file). This plan's
    manifest `dependsOn` already names plan 3's spec; the roadmap MUST encode the edge as a
    Depends-on on this plan's row. Task 1.2 owns the rebase and the post-rebase parity re-run
    (the appends sit outside every template literal's closing backtick, so the re-anchored
    capture and the raw head count are both insensitive to them).
  - `skills/war/assets/skill-doc-contracts.test.mjs` — shared with plan 2
    (`runbook-and-standing-record-coherence`: two new locks). Land order: plan 2 before this
    plan (campaign serial order); Task 1.1's worker rebases over the two locks — the D18 edit is
    confined to the D18 block, textual adjacency at worst, the new locks never touched. The
    roadmap contention table must carry this row too (grill Q3).
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` — shared with
    every campaign plan's trailing release phase; each later lander re-resolves the next free
    patch from the slots at land.
  - `agents/war-auditor.md` — not in plans 1–3's declared footprints (plan 2 fixes the hook's
    deny string at its declared `hooks/`-only footprint). The downstream
    `gate-evidence-and-release-integrity` spec declares its edit to this file dependent on this
    plan — this plan precedes it (spec §5). If #1085's eventual fix grows into this card before
    this plan lands, the two edits touch different sentence families of the same section — a
    rebase-by-named-anchor, not a conflict of substance.
- **No behavior change, checkable as absence (End state 5):** no `workflow-template.js` edit, no
  floor semantics, exit codes, matcher logic, enum members, schema fields, or prompt bytes.
  Nothing nears `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS`, so the hand-mirrored-pair
  rule is satisfied vacuously.
- **Red proofs are commit-body evidence** (the file-local D18 "Red-then-green PROVEN" precedent):
  the D18 swap probe with its per-pair green-half capture record (Task 1.1) and the SIM A/SIM B
  replays (Task 1.2) are deliberately uncommitted in-memory probes whose outcomes are recorded in
  the commit body; gate-audit treats any resulting cannot-confirm as SOFT, never a hold (recorded
  doctrine). Task 1.3's discrimination proof is different in kind — it IS the committed test
  case, red against the pre-change wording by construction.
- **Advisory literals accepted (spec §8):** the reworded stderr line is a further statement of
  the excluded prefixes (after the script header and `match_sh_suite`'s comment). The set mirrors
  the gate discovery that already moves in lock-step under floor ⊆ gate, and Task 1.3's new case
  pins all three prefixes so silent drift reds.
- **D18 ordering assumption is deliberate and documented (spec §8 + grill Q14):** the pairing
  assumes site-before-route within each sentence — true of the live bullet and inherent to
  first-following-token semantics — and the extended D18 comment records both this and the
  early-joint-mention shape as fail-closed false-red residuals: a doc rewrite that reorders or
  prepends a joint site mention reds the guard and forces a deliberate re-anchor, desired for a
  doc-contract.
- **Wording latitude is bounded by checkable floors:** the exact bytes of the advisory line
  (End state 3's assertions), the auditor-card sentence (End state 4's grep-absence + committed
  lock + arbiter-naming + surviving discipline clause + opening substance), the two header
  comments, and assertion messages are the worker's; the spec's §4.1/§4.3/§4.4 texts are
  reference shapes, not byte mandates.
- **No CONTEXT.md terms, no ADRs** (spec §6, §7): guard/diagnostic/prose truth fixes inside
  already-ratified architecture.
- **Anchors:** every edit site is named by construct — test name, comment lead-in, function
  name, the final `printf` before the unconditional `exit 1`, the section heading and sentence
  opening — never line numbers (they rot across the serial merge queue).
- **Redaction:** no absolute home paths, emails, or handles in this plan, the new test case, the
  reworded advisory, the card sentence, or the release blurb.

## Open decisions

None — the spec's design tree resolved all seven rows, and the grill round resolved the shapes
it questioned (SIM pinning, absence-lock placement and its deps edge, byte-identity relaxation,
three-prefix pinning, the #1085 follow-up vehicle, both residual disclosures). Remaining latitude
(exact wording of the advisory line, the card clause, the two header comments, and assertion
messages) is the worker's within the checkable floors stated per task.
