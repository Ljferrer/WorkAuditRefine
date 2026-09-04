---
name: weak-test-assertion-passes-without-feature-being-exercised
description: "Delete feature mentally; assert must fail w/o it"
metadata:
  node_type: memory
  type: project
  keywords: [vacuous test, false green, contains substring match, shared exit code, delete and trace, dead regex branch, negative match on undefined, temp-break RED proof, aggregate threshold count, inflated count, padding intro line, single-item removal slack, qualifier lock, anchor-derived region, region includes anchor substring, self-satisfying token, sliced-from-anchor window, hardcoded empty field, inert tiebreak, coincidental fixture ordering, localeCompare no-op, N-of-M emission sites, multi-site coverage gap, count assertion, source-level count, pkg 819 idiom, one-of-three seat coverage, emission site RED-ability, presence-only filename regex, run vs skip discrimination, floor-retry prompt pin, pkg 4.2 retry-merge, tautological length assertion, match length always groupcount plus one, capture group count, non-global match, extraction-equality test, D6 arms length, closed-set header sentence, ordered chain anchor, rung-body coverage gap, five-surface registry row, authority ladder, predicate wiring gap, shared inner predicate, flag-delta vs composition, caller-side substitution, byte-triplicated existence guard, guard bound by one call path only, _hit vs _hit_i, lacks_i wiring unasserted, delete-the-feature mutation, String.replace doesNotMatch, tautological mutation test, self-referential strip-and-assert, both-surfaces D20 idiom, non-vacuity proof, self-referential probe constant, anchoredProbe, construct-then-parse round trip, PLUGIN_ROOT_PREFIX typo, CHANGELOG ordering test, fixture-driven negative control, cmpSemver, only-tests-the-live-file, version-slots.test.mjs, self-citing fixture, non-goal skip arm, incidental substring citation, first sub-case does not discriminate, flattened whole-surface positive detector, pre-existing phrase satisfies key, old-default-absent, DISPOSITION WIDENINGS, unanchored substring key]
  provenance: code-verified
  slug: weak-test-assertion-passes-without-feature-being-exercised
  phase: "audit-scheduler-integrity/t4 +19 recurrences (latest 2026-09-03-in-band-absorb-default/phase-3 task 3.2 — old-default-absent (b) vacuous pass on a pre-existing phrase)"
  date: 2026-07-21
  tags:
    - testing
    - assertion-strength
    - threading
    - workflow-template
    - guard-test
  promoted: dev/2026-08-06-handoff-schemas-contract@phase-1
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
  modified: 2026-09-04T11:28:18.279Z
---

**Local recurrence copy** of the repo-root lesson at
`docs/learnings/weak-test-assertion-passes-without-feature-being-exercised.md` (same slug) — the
repo copy carries a nested `metadata.provenance` (agent-unverified) so it is not user-authored, but
it is not directly editable by a servitor outside its own local root (D1); this file carries the
original content plus the new bullet below (closed-set header sentence / authority-ladder gap). A
future Gate-2 promotion of this file overwrites the same-slug repo file.

# Weak assertions pass without the feature being exercised

**Rule:** before trusting a green test, mentally delete the guard/feature and trace whether every assertion still passes. If it does, the test proves "no crash," not "feature works." Failure shapes (11 instances across 11 phases, all fixed or recorded in-repo; this slug is cited by test headers, e.g. `war-pipeline-structure.test.sh`):

- **Contains-assertion** matching text already in the base string → assert a token unique to the threaded value (a serialized key/number, a clause heading).
- **Shared exit code:** guard-fired and fallback path (e.g. empty diff) both exit 1 → build a fixture where only the guard produces that exit.
- **Multi-step guard:** a case satisfied by step N masks all steps >N → add a case only the target step can satisfy; a fixture detail inert for the pass-path can still be load-bearing for the temp-break RED proof — judge against both.
- **Dead regex alternate:** a branch embedding a literal `${...}` placeholder never matches rendered output → drop it or test the template pre-render.
- **Negative match on a keyed lookup:** `/x/.test(undefined)` returns false → add an `assert.ok(x)` presence guard before any negative match.
- **Substring-of-old-form:** after a reword, a positive `includes` on a substring of the removed form is vacuous alone → pair with a negative absence assert on the superset form.
- **Wrong loop-exit path:** a test titled for a guard term may exit via a different branch entirely; trace end-to-end — unreachability may mean the guard is defensive-dead, not that the fixture is wrong.
- **Stale audit prose:** a finding's rationale can narrate a pre-fix draft — re-Read the file at HEAD before recording a "gap" (see [[audit-log-finding-can-be-stale-by-land-time]]).
- **Aggregate-threshold count inflated by a padding line (plan-and-prompt-literal-brittleness-and-auditor-calibration/t1.4):** a test meant to lock "N distinct items each retain property P" (e.g. "each of the 4 calibration rules keeps its confirmation qualifier") is written as a single occurrence-count assertion (`count >= N`) against the whole surface. If the surface also carries an unrelated line that legitimately repeats the same phrase (a section-intro sentence restating the qualifier before the enumerated rules), the true occurrence count is N+1. A regression that silently drops the property from exactly *one* of the N items still leaves the count at N — at or above the threshold — so the assertion stays green while the specific defect it was written to catch (single-item silent widening) slips through undetected. The test's own comment can misstate this as "one occurrence per rule (N)," miscounting the intro line. **Fix:** either raise the threshold to the true total (N+intro), or — stronger — assert the property is present *within each item's own anchored span* (pair each item's anchor regex with a trailing property-match on the same slice) rather than a single whole-surface count.
- **Anchor-derived region self-satisfies a substring of its own anchor literal (new, learnings-recipe-drift-sweep/1.1 gate-audit, 2026-07-16, disposition `note` — not a hold, worker implemented the plan's literal token list verbatim):** a doc-contract drift-guard test builds its check region as `text.slice(text.indexOf(ANCHOR_PHRASE), end)` — i.e. the region is defined to *always begin with* `ANCHOR_PHRASE` — then separately asserts `region.includes(t)` for a family of "trigger" tokens meant to lock a nearby sentence. If any token `t` is a plain substring of `ANCHOR_PHRASE` itself (e.g. asserting `'retire'` when the anchor is `'retired-token sweep'`), that assertion **cannot fail while the anchor's own presence-assert already passed** — it contributes zero discriminating power, masked behind an unrelated earlier `assert.ok`. A delete-and-trace "RED proof" that deletes the *whole* trigger sentence (including the anchor) still goes red correctly via the surviving discriminating tokens, hiding that some individual tokens in the family are inert; a **partial** reword (dropping only the non-discriminating tokens) passes silently. A second variant of the same trap: a trigger token satisfied by *unrelated* prose elsewhere in the same sliced region (e.g. a routing sentence's own use of "consolidated" satisfying a trigger-family check for `'consolidate'`) is equally non-discriminating, for a different reason (over-broad region, not anchor-overlap). **Fix:** scope trigger-token assertions to the trigger *sentence* (slice from the anchor to the first sentence-terminator), not the whole swept region; or assert an anchored multi-word phrase instead of independent single-word substrings; drop any trigger token that is itself a substring of the anchor phrase — the anchor's own `assert.ok` already covers it.

- **Hardcoded-empty fixture field makes a comparison function's own tiebreak inert, so a
  two-function equivalence assertion passes for a coincidental reason, not a forced one**
  (lessons-learned-tighten/phase-1 task 1.1, 2026-07-21, `disposition: note`, three separate
  auditor findings converged on the same construct — code-verified at the landed tip,
  `skills/_shared/war-memory.test.mjs`'s `rec()` fixture helper, `evictedSlugs`/`archiveCandidates`
  comparison around the "fallback (criterion 5)" test): a test asserts
  `tightenPlan(...).eligible` order equals `archiveCandidates(...)` order as a way to lock the
  fallback (no query-log) eviction ordering. `tightenPlan`'s age axis is a distinct field
  (`effectiveDate`, varied per fixture row); `archiveCandidates`'s age tiebreak reads a *different*
  field (`.date`, `localeCompare`) which the shared `rec()` helper hardcodes to `''` for every
  fixture row — so `archiveCandidates`'s own age comparison is a no-op (stable sort by tier only)
  and the two orders coincide only because the fixture's within-tier input order was **already**
  hand-arranged oldest-first. The test is not fully vacuous — it still catches a broken/removed
  tier sort — but it does **not** discriminate a broken/removed age tiebreak in either function,
  because one side of the equivalence never exercises age at all. **Fix:** give the fixture helper
  a distinct non-empty `date` per row (ideally matching the intended `effectiveDate`) so the
  compared function's own age axis is actually live, or add a dedicated fixture (equal
  hits/tier, divergent age, input order reversed from expected) that only an age-aware sort can
  pass.

- **N-of-M emission-site coverage: a mapped test proves the construct at one call site, silently leaving the other sites' RED-ability unowned** (audit-adjudication-threading/phase-1, 2026-07-22, `disposition: follow-up`/`note`, two independent gate-audit findings — code-verified at the landed tip via the plan's own task worktrees, `p1-1.2`'s `skills/war/assets/workflow-template.js` lines 1548/1617/1643 and `p1-1.2`'s `workflow-template.test.mjs` `esSeatP` helper at line 5602): a plan adds one construct (`+ adjudicationClause`) at **three** near-identical concatenation sites (per-task post-merge gate-audit, integrated-tip gate-audit, end-state-only gate-audit prompts) and the plan's own mapped test explicitly sanctions covering only **one** named seat (`gate-audit:phase-<id>:end-state`) as sufficient evidence, per the plan's own End-state wording ("e.g. the seat labeled ..."). Mentally deleting the concatenation at either of the other two sites leaves the suite green — real RED-able coverage exists for exactly one of the three sites, and nothing in the test file references the other two seats' prompts at all. This is **not a hold**: the plan-literal criterion is fully met, and the gap is a residual ceiling the plan's own author sanctioned as worker/tester latitude (an "any of the three labeled seats" open decision), not an unmet condition — record it as `note`/`follow-up`, never escalate. The repo already carries the cheap fix precedent for exactly this shape: `pkg #819`'s source-level `count === 3` assertion over three dispatched packaging-floor invocations (`workflow-template.test.mjs`, comment: "a two-of-three thread or a static collapse is RED") — a single assertion counting occurrences of the construct-adding literal across the whole source file, rather than one prompt-content test per site. **Fix:** when a plan adds the same construct at N emission/call sites and only one is going to get a per-site behavioral test, add one source-level `grep`/`count===N` companion assertion over the raw template source (the #819 idiom) so a two-of-N thread or a static collapse is RED even without per-site prompt fixtures for every site.

- **Presence-only filename regex pin cannot discriminate "run" from "skip" phrasing for a
  conditionally-dispatched floor** (`2026-07-26-dispatch-args-and-floor-coverage/1.1` + its
  `p1-polish` sibling task, 2026-07-26/27, `disposition: absorb`/`follow-up`, code-verified —
  confirmed present at landed tip `0250694ea5c69e77e2fa2f0543f81c6ccf111978`,
  `skills/war/assets/workflow-template.test.mjs`, test `'pkg §4.2 — retry-merge prompt
  re-instructs ALL floor invocations'`, lines 4646-4648): the floor-retry re-merge prompt gates
  both the test and packaging floors on a ternary whose **both** arms carry the filename byte-run
  — e.g. `run assert-test-in-diff.sh …` vs `requiresTest:false — skip the
  assert-test-in-diff.sh check.` The test asserts only `assert.match(retry.prompt,
  /assert-test-in-diff\.sh/, …)` / `/assert-packaging-in-diff\.sh/` — bare filename presence — so
  it passes identically whether the prompt actually says "run" or "skip." A future reword flipping
  either clause from run to skip would not RED this test, the precise vacuity the campaign that
  found it exists to close (the sibling `#1114` polish-merge test made exactly this mistake and
  was fixed one screen away in the same diff, but this pkg §4.2 sibling — itself edited in the
  same commit to add the submodule assertion — was left with the pre-existing weak pin,
  recorded `follow-up` rather than fixed since it predates the campaign). **Fix:** tighten the
  predicate to the run-arm's distinguishing wording (e.g. `/run assert-test-in-diff\.sh/`) or pin
  the two branch refs alongside the flag as the sibling submodule assertion does.

- **`assert.equal(match.length, N)` right after `assert.ok(match, ...)` is tautological when the extraction regex has a fixed capture-group count** (`auditor-guard-policy-and-mirror-truth/phase-1 task 1.2`, 2026-07-26/27, gate-audit `disposition: note`, `phaseClose: false` — deliberately left, not a hold): a D6-style extraction-equality test does `const arms = hookSh.match(/.../.../.../)` with a **non-global** match against a regex carrying exactly two capture groups, then asserts `arms` is truthy (correctly catches an unlocatable/reshaped source) followed by `assert.equal(arms.length, 3, 'expected exactly two parenthesized flag groups, got ...')`. `String.prototype.match`'s non-global return is always `[fullMatch, group1, group2, ...]`, so `arms.length` is structurally `1 + capture-group-count` — here always exactly `3` — on **every** non-null match; a null match is already caught by the preceding `assert.ok`. The assertion cannot fire under any input the regex's own shape allows, so it pins the *extractor regex's own group count* rather than anything about the thing being extracted. The load-bearing half of the same construct (`groups.forEach(g => assert.ok(g.length > 0, ...))`, catching a locatable-but-empty-token parse) is genuinely non-vacuous and was the real fix target — only the group-count line is dead weight. Real residual: if the extracted source ever grows a **third** labeled arm, the fixed two-group regex still matches only the first two, the tautological count assertion stays green (still exactly 3), and the third arm's data silently never reaches the downstream check — the exact stranding-class defect this kind of test exists to prevent. **Fix:** either drop the tautological length line, or make it real by counting the source span's own delimiter occurrences independently of the extractor regex (e.g. count `(` within the located span and assert it equals the extractor's own capture-group count) so a genuine third-arm addition trips it. **Provenance note:** sourced from that phase's own `gate-audit:approve` finding (`gateEvidence:true`, pinned `auditSha: 4e15632bc2313ee9e3c1965c3d952006fb9bf4f3`); I could not independently Read/Grep-confirm the referent myself this round — my session cwd is a different concurrent plan's worktree/checkout (`work-audit-specs-plans-4304cd`) and no live task worktree under `.git/worktrees/*` matched this plan's slug (the candidates named `p1-1.1`/`p1-polish` resolved to a different plan, `2026-07-26-dispatch-args-and-floor-coverage`, per their `gitdir` targets) — so this bullet stays `agent-unverified` despite the strong gate-audit evidence trail (same caveat pattern as the 2026-07-16 bullet above). Referent to re-check before citing as a live instance: `skills/war/assets/workflow-template.test.mjs`, the D6 branch-flag extraction-equality test block (`arms = hookSh.match(...)`).

- **A closed-set header sentence alone satisfies an ordered "presence in order" chain anchor, so deleting an entire named member's body still passes when only N-1 of N members get a rung-body supplementary assert** (`2026-07-28-audit-evidence-precedence/phase-1 task 1.2` gate-audit, `severity: Minor`, `disposition: absorb`, `phaseClose: true` — queued for absorption but **still live at land**: code-verified present at the landed tip `731d46e88b502009745bfbb07e9655fdd027cd0a` via the `_refinery` worktree, `skills/war/assets/workflow-template.test.mjs` lines 7074-7096, and `agents/war-auditor.md` `## Evidence precedence` section, lines 80-105): a five-surface registry row (the auditor card + four dispatched-prompt surfaces) locking a four-shape closed set (`content-at-pin`/`execution`/`history`/`authority`) uses one ordered chain anchor `/content-at-pin[\s\S]{0,200}\bexecution\b[\s\S]{0,200}\bhistory\b[\s\S]{0,200}\bauthority\b/i` — chosen specifically because per-shape rung-body pairing (the plan's own suggested idiom) is infeasible on the dispatched-prompt surfaces (a separate End-state condition in the same plan forbade those tokens there). The chain anchor is fully satisfied by the card's own **closed-set header sentence alone** ("Four claim shapes (closed set): `content-at-pin`, `execution`, `history`, `authority`"), so deleting the **entire body** of any one ladder (all four `authority` rungs, e.g.) leaves the row green — the header sentence never disappears just because a ladder's rungs do. A card-only supplementary assert loop was correctly added beside the row to cover the three shapes whose rung-body tokens are safe to grep (`Pinned blob` for `content-at-pin`, `Gate-evidence artifact` for `execution`, `advisory corroboration` for `content-at-pin`'s rung 2, `a claim to verify, never evidence` for `history`) — but no rung-body token was ever added for the fourth shape, `authority` (its rung-4 body reads `Roadmap/spec literals`, verified absent from every dispatched-prompt surface's occurrence history — `git log -S` empty — so it would be a safe addition). **Fix:** when a header sentence enumerates a closed set by name and an ordered chain anchor is the only cross-surface guard for that set, do not assume set-membership proves body-content coverage — for N members, either give all N a rung-body supplementary assert (not N-1), or add an explicit comment flagging the uncovered member as a known residual so a future reader doesn't mistake the row's presence for completeness.

- **A committed mutation control that binds a shared predicate's flag-delta doesn't also bind which predicate the caller routes through — a caller-side substitution swap passes silently, and a shared existence-guard block byte-triplicated across N helper functions is bound by a committed assertion only through whichever ONE helper's call path a control happens to exercise** (`2026-08-06-shell-pin-helpers/1.1`, 2026-08-15, auditor `disposition: note` x2 across the task audit and the gate-audit — Nit, never a hold; `code-verified` at the landed tip `44acfe217621a1aa06583d2f83c3ee26d735bfc7`, read via the `_refinery` worktree matching that SHA, gitdir physical path `<repo-root>/.claude/war-worktrees/2026-08-06-shell-pin-helpers-2026-08-15/2026-08-06-shell-pin-helpers-2026-08-15/_refinery/`): `skills/war-machine/war-pipeline-structure.test.sh` factors a stripped-scan into two inner predicates, `_hit()` (case-sensitive) and `_hit_i()` (case-insensitive), and three outer helpers — `lacks()`, `lacks_i()`, `has_i_stripped()` — each compose one of the two. A committed control (lines ~481-492) pipes a re-cased fixture into `_hit_i` directly and asserts it fires, and into `_hit` directly and asserts it misses — this genuinely proves the `-i` flag inside `_hit_i`'s own body is load-bearing (deleting it reds the control). What it does **not** prove: that `lacks_i()` (line 124) actually *calls* `_hit_i` rather than `_hit` — every live `lacks_i` target in the suite is an *absence* check, so a caller-side edit swapping `lacks_i`'s body from `! _hit_i "$2" < "$1"` to `! _hit "$2" < "$1"` leaves the whole suite green (an absence check passes either way when the target genuinely isn't present under either casing). The same task also byte-triplicates a `[ ! -f "$1" ]` existence-guard block across all three outer helpers (`lacks`/`lacks_i`/`has_i_stripped`, each ~5 lines, otherwise identical); the two committed guard controls both invoke `lacks_i` specifically (a plan-deliberate choice, to avoid perturbing an unrelated exact-count End-state pin elsewhere in the file), so only `lacks_i`'s copy of the guard is bound by a live assertion — a later edit dropping the `return` from `lacks()`'s copy, or mistyping the `MISSING FILE` marker in `has_i_stripped()`'s copy, reds nothing committed. Both residuals were judged plan-faithful (the plan deliberately scoped the committed controls this way to avoid perturbing other exact-count pins) and recorded `note`, not a defect against the task. **Fix, if ever pursued:** a control proving a shared inner predicate's flag matters is not the same control as one proving which predicate each caller composes — add a caller-scoped control (route a distinguishing fixture through the OUTER helper, not the inner predicate directly) if the wiring itself needs to be pinned; and if a guard/existence-check block is copy-pasted across N call sites, either factor it into one shared function (so one committed control covers all N) or add one committed control per call site, not just the one a pre-existing control happens to exercise.

- **A "delete-the-feature" mutation proof built as `text.replace(pattern, 'X')` followed by
  `assert.doesNotMatch(mutated, pattern)` is tautological for ANY input — `String.replace`
  already guarantees the pattern is gone, so the assertion cannot fail regardless of whether
  the surface ever carried the phrase** (`2026-08-06-handoff-schemas-contract/phase-1 task
  1.1`, 2026-08-17, gate-audit `disposition: note` ×4 converging across the task audit, the
  gate-audit, and the phase-close polish review — Nit, never a hold; code-verified at
  `gateHeadSha 28f26105081267f70ef80788c2bbdb8837abaa93` via the task worktree whose `gitdir`
  physical path names the plan slug, `skills/war/assets/workflow-template.test.mjs` lines
  8907-8913, test `'both-surfaces (D20, #1381): the WORKTREE_HYGIENE capture is on
  agents/war-refiner.md AND the dispatched barrier prompt; delete-the-feature per surface'`):
  the test correctly asserts four real presence anchors (`assert.match(text, re, ...)` for
  each of `WORKTREE_HYGIENE`, `worktreeHygiene`, the `"repaired"|"detected"` value-set token,
  and a distinctive shared phrase) — that half genuinely reds on a per-surface revert and
  carries the test's real non-vacuity. But the trailing "delete-the-feature" step —
  `const mutated = text.replace(/markers ride a zero exit/gi, 'REMOVED'); assert.doesNotMatch(mutated, /markers ride a zero exit/i, ...)`
  — is a property of `String.prototype.replace` with the global flag, not evidence about
  either surface: a global replace always removes every match of its own pattern, so the
  `doesNotMatch` on the very same pattern against the very same mutated string is true
  *by construction*, on every possible input, including a surface that never carried the
  phrase in the first place. The comment directly above it overclaims: "a delete-the-feature
  per surface proves the anchors non-vacuous" — it proves nothing; the genuine non-vacuity
  lives entirely in the preceding `assert.match` loop. This is a byte-faithful copy of a
  pre-existing sibling idiom in the same file (the `STALE_REMOTE` both-surfaces test, ~14
  lines above), which the plan's own slice explicitly directed the worker to "model on" — so
  this is a **house idiom that recurred four times inside one phase's audit log**, not a
  fresh regression introduced by judgment; it survived unabsorbed because every occurrence
  was independently routed `note` (harmless: the real anchors carry the weight) rather than
  `absorb`. **Fix, if ever pursued:** either drop the two `replace`/`doesNotMatch` lines
  entirely (the `assert.match` loop is the real proof) or make the strip a genuine both-ways
  proof in the `RETIRED_PREMISE_SAMPLES` style — assert an unwired *negative-reference*
  sample (a surface hand-written WITHOUT the clause) fails the anchor loop, which is a
  property of the anchor regex against real alternative content, not of `String.replace`
  against its own output. **Recognize the shape fast:** any test whose "kill the mutant"
  step derives the mutated text from the SAME regex/literal the following assertion checks
  for absence of is tautological — the mutation step must be independent of the assertion
  it's meant to falsify (a hand-authored fixture, a different code path, a real edit) for the
  delete-and-trace proof to mean anything.

- **A positive control that CONSTRUCTS its probe target from the same constant it then PARSES
  cannot catch a typo in that constant** (`2026-08-06-references-pointer-integrity/phase-1 task
  1.1`, 2026-08-18, worker-audit `disposition: absorb, phaseClose: true` — Minor, never a hold;
  not independently Read/Grep-confirmed by me this round — my checkout had no live worktree
  matching this plan's slug, so this bullet stays `agent-unverified` per the landed-tip-grounding
  gate-audit fallback, despite the auditor's own `Re-grounded at the pin` claim): an
  `anchoredProbe` control inside `skills/war/assets/reference-link-integrity.test.mjs`'s Arm-1
  resolution test builds its probe target as `PLUGIN_ROOT_PREFIX + 'skills/war/assets/reference-link-integrity.test.mjs'`
  and then asserts `resolutionRoots()` stripped exactly that same prefix back off. Because the one
  constant is used to both *construct* and later *parse* the target,
  `target.startsWith(PLUGIN_ROOT_PREFIX)` is true by construction for **any** value the constant
  holds, and the sliced remainder is always just the literal tail that was appended — so a typo in
  the constant itself (a dropped `{`, a wrong env-var name) leaves both the `deepEqual` and a
  companion `existsSync` check green. The control's own comment claims the opposite effect ("a
  broken prefix literal would otherwise first surface as a confusing dead-link red at [a
  downstream task's] merge") — what the control actually proves is that `resolutionRoots()` routes
  an anchored-looking target to the right root and slices *a* prefix off it, not that the
  constant's own bytes are correct. **Fix:** spell the probe target as its own independent
  single-quoted literal (not built from the constant under test), or add a separate
  `assert.equal(PLUGIN_ROOT_PREFIX, '<expected literal>')` line — either way the constant's bytes
  need a check that doesn't route through the constant itself. **Recognize the shape fast:** any
  test where the same named constant appears on both sides of a round-trip (build the fixture with
  it, then assert the code-under-test recovers it) is checking the round-trip mechanism, not the
  constant's value — the exact same self-referential-strip-and-assert trap as the
  `String.replace`/`doesNotMatch` bullet above, one level up (a shared *literal* rather than a
  shared *regex*).

- **A fail-closed positive-only ordering assertion has no fixture-driven negative control proving
  it actually fires on a real violation** (`2026-08-25-ask-disposition/phase-3 task 3.1`
  gate-audit, `disposition: note`, Nit, never a hold — `code-verified` at the audited pin
  `a3f7b8b282bd1a993e5a3c56bdf4347395d89ee7`, `skills/war/assets/version-slots.test.mjs` lines
  207-217, test `'CHANGELOG.md entries are strictly descending by version (no dupes, no
  out-of-order insert)'`): the test parses every `## X.Y.Z — date` heading out of the **live**
  `CHANGELOG.md` and asserts `cmpSemver(versions[i], versions[i-1]) < 0` pairwise, plus a
  `versions.length >= 2` fail-closed guard. This genuinely isn't vacuous in the always-passes
  sense — the length guard reds on a stripped file, and an inverted `cmpSemver` would immediately
  red against the file's own current descending ladder — but nothing in the suite proves the
  **loop and comparator together** actually catch a real out-of-order insert or a duplicate
  version heading, because the only fixture ever exercised is the live file, which is (by
  construction, since it's release history) already correctly ordered. The house convention this
  same file already establishes for exactly this shape — "checklist lock is non-vacuous: a
  subsection-absent reference fails the same path" — pairs the positive assertion with a fixture
  that must fail; this new test has no sibling fixture-driven negative control. **Fix:** add a
  synthetic CHANGELOG body (a small in-memory string, not the live file) carrying a deliberately
  out-of-order heading pair and a duplicated version heading, and assert the same loop throws
  against it — mirroring the existing "checklist lock is non-vacuous" pattern in the same suite.

- **A dedicated skip-arm fixture's FIRST sub-case can incidentally self-cite the very pin it means to test, leaving only its SECOND sub-case discriminating** (`2026-08-25-authoring-doctrine-and-lint-coherence/phase-2 task 2.1`, 2026-08-25, plan-faithfulness `disposition: note`, Nit, never a hold — code-verified at the landed tip `abb1f1515977b54fe9153ec178b21153ec04ff4a` on `dev/2026-08-25-authoring-doctrine-and-lint-coherence`, read via the `_refinery39` worktree, gitdir physical path `<repo-root>/.claude/war-worktrees/2026-08-25-authoring-doctrine-and-lint-coherence-2026-09-02-r3/_refinery/`, `HEAD` byte-equal to the landed tip, `skills/war-strategy/assets/plan-literal-lint.test.mjs` lines 396-413, test `'pin-citation: a `non-goal` pin needs no citation — the definition row suffices'`): the test builds a `doc` fixture whose own `## Notes` line reads "nothing cites PIN-11 anywhere, and that is conforming" — that Notes line's prose literally contains the substring `PIN-11`, so even with the `non-goal` class-skip arm deleted, the anywhere-citation fallback would find that substring and the assertion would still pass, for the wrong reason. Only the fixture's second (`uncited`) sub-case, whose Notes line reads "no citation at all" (no `PIN-11` substring), genuinely reds when the skip arm is removed. The test AS A WHOLE still correctly reds on deletion (the `uncited` assertion catches it), so the End-state condition it backs is met — but the first sub-case's own inline comment ("the class skip is the only thing keeping this clean") is false for that specific sub-case; the comment describes the pair's collective intent, not sub-case one's individual discriminating power. **Fix, if ever pursued:** reword the first sub-case's Notes line to avoid the substring entirely (e.g. "this pin needs no mention at all"), or drop the inline comment's implication that sub-case one alone proves the skip arm's necessity.

- **A normalized whole-surface "new sentence present" detector can be vacuously satisfied by an
  unrelated PRE-EXISTING phrase on one surface, so it cannot detect a revert of the actual flip
  sentence there** (`2026-09-03-in-band-absorb-default/phase-3 task 3.2`, 2026-09-04, `disposition:
  note` (final verdict) — Nit, never a hold; code-verified at the landed tip
  `84bd08f414dd7f397260d8ca3cd262f89c75a0fe` on `dev/2026-09-03-2026-09-03-in-band-absorb-default`,
  read via the `_refinery45` worktree whose `gitdir` physical path names this plan's slug,
  `skills/war/assets/skill-doc-contracts.test.mjs`, the `old-default-absent (b)` test, ~line 3756):
  row (b) asserts each of eight living surfaces, flattened to one string (backticks/quotes stripped,
  whitespace collapsed, case-folded), matches `/defaults to absorb/`, meant to prove the NEW
  default-flip sentence landed on every surface. On `skills/war/assets/workflow-template.js`
  specifically, a DIFFERENT, older sentence in the same file's `DISPOSITION WIDENINGS` block
  (confirmed present at the landed tip, line 1652: "a mechanical, fully-specified finding born at a
  re-audit DEFAULTS to absorb") case-folds to the same key phrase and already existed BEFORE the
  task that added the real flip sentence (line 1647: "A fully specified Minor/Nit defaults to
  absorb..."). Because the row does a flat substring match rather than anchoring to the specific
  flip sentence, a hypothetical revert of line 1647 alone — while leaving the older, unrelated line
  1652 phrase intact — would leave `old-default-absent (b)` green on this one surface, even though
  the fact it means to lock (the flip landed HERE) would be false. The audit routed this `note`
  (beyond the plan's End-state-8 scope, which requires only the absence half, not a NEW-present row)
  rather than a defect to fix. **Fix, if ever pursued:** anchor the positive key to the specific flip
  sentence's own distinguishing clause (e.g. `/A fully specified Minor\/Nit defaults to absorb/`) on
  surfaces where a different pre-existing sentence can share the flattened key phrase, rather than a
  bare `/defaults to absorb/` whole-file scan. **Recognize the shape fast:** before trusting a
  flattened whole-surface positive-presence detector as proof a SPECIFIC new sentence landed, grep
  the target surface's PRE-diff base for the same normalized key — if it was already true, the
  detector cannot discriminate the sentence you actually care about from whatever already satisfied
  it.

**Why:** green no-op tests survive feature deletion and rot silently. **How to apply:** run the delete-and-trace check on every new guard/threading assertion; pair positives with negatives and negatives with presence guards; for "each of N items has property P" assertions, count every legitimate occurrence of P's phrase on the surface (including intro/summary lines) before picking a threshold, or switch to a per-item anchored check; for an anchor-sliced region, check whether any locked token is itself a substring of the anchor literal or satisfiable by unrelated prose already in-region before trusting a whole-sentence delete-and-trace RED proof as evidence every individual token discriminates; when a construct is threaded to N near-identical emission sites, verify whether the mapped test proves all N or just one — a plan can legitimately sanction one-of-N as a latitude call, but if it doesn't, add a source-level count assertion (the `pkg #819` idiom) to close the residual N-1 sites cheaply; when an extraction test does `assert.ok(match)` then `assert.equal(match.length, N)`, check whether `N` is just `1 + the regex's own fixed capture-group count` — if so the length assertion can never fail and only a structurally-independent count (of the source's own delimiters) proves anything about a future third occurrence; when a closed-set header sentence backs an ordered chain anchor, count whether every enumerated member also has its own body-content assert — a header sentence naming N things is not proof any one thing's *content* survives deletion.

**Verification note (discharged 2026-07-12):** the t1.4 referent is now directly verified at the live tip — the aggregate `>= 4` occurrence count was **retired** and replaced by the stronger fix from the bullet above: per-rule window checks (`qualifierPerRuleWindows` in `workflow-template.test.mjs`, whose comment cites the one-occurrence slack) plus a delete-the-feature companion mutation test that cites this lesson by slug. The tracked gap (#693) is closed COMPLETED; the bullet stands as the durable pattern.

**Verification note (2026-07-16, learnings-recipe-drift-sweep bullet):** sourced from that phase's own `gate-audit:approve` finding (`gateEvidence:true`, pinned `auditSha: c247088d`, Minor/`note`) reading the anchor-slice logic and trigger-token list directly in `skills/war/assets/war-config.test.mjs`. I could not independently Read/Grep-confirm the referent myself — my checkout lags the landed branch (see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]], Recurrence 9) — so this stays `agent-unverified` despite the strong gate-audit evidence trail.

Related: [[gitmodules-working-tree-read-vs-ref-snapshot]], [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]], [[shared-string-constant-quote-literal-byte-anchor-fragility]], [[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]], [[process-recipe-lesson-body-is-not-drift-guarded-by-any-test]], [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

> archived 2026-07-21: resolved — moved to archive

> archived 2026-08-17: resolved — moved to archive
