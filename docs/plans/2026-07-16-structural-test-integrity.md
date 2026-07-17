# Structural-test integrity — narrow the corrupt block-comment strips, bound block comments by census, and widen the pt-tag floor to a default-deny template-literal census

Plan file: `docs/plans/2026-07-16-structural-test-integrity.md`
Source spec: [docs/specs/2026-07-16-structural-test-integrity-design.md](../specs/2026-07-16-structural-test-integrity-design.md)
Issues addressed: #929, #931
Stacks on: `docs/plans/2026-07-16-land-failure-recovery.md` — **queue position 2** in its campaign; expected integration base is the **working tip after land-failure-recovery lands** (ADR 0011 stack-and-plow). Verified contention: that plan edits **both** `skills/war/assets/workflow-template.test.mjs` (two behavioral land tests — Land mock returning `null` / `status:'bogus'` — plus one **line-scoped** source-text pin on the token `landResult ? String(landResult.status || 'error') : 'error'`) and `skills/war/assets/workflow-template.js` (terminal else arm on the primary land routing chain; header + meta-adjacent coupling comments). This plan **rebases over those edits and must neither modify nor duplicate them**; both census enumerations are re-run at the dispatch base because that landing adds template literals and comments of both census classes (spec §8 ordering note). The sibling's anchor guard lives in **its** new `skills/war/assets/stage-workflow.test.mjs` (importing anchor constants from `stage-workflow.mjs`) — deliberately outside this plan's census footprint; both stager files are untouched here. No other 2026-07-16 sibling shares a file with this plan (`learnings-recipe-drift-sweep` edits a *different* `docs/learnings/` lesson; its read-only recipe grep over `docs/learnings/` is unaffected by this plan's two dated notes).

> **Spec deviation notice (measured 2026-07-16, adversarial-grill adjudication):** the spec's residue-census resolution (§3 "assert **zero backticks remain**" after ~7 exemption rows) is **factually unimplementable as written** — a string-aware scan of the live template measures **353 template literals: 224 `pt`-tagged, 129 untagged (120 distinct 44-char heads, 6 heads duplicated — one path-builder head ×5), plus 4 backticks inside ordinary quoted strings** (markdown code spans — not interpolation sites), and exactly **one** true block comment (`/* the single ace commit */`). The corrected design below (untagged-head registry census over a string-aware scanner; quoted-string backticks out of scope by construction) preserves the spec's ratified intent — *no untagged prompt-feeding literal without a conscious, reviewable decision* — at the real scale. The naive two-step strip's fake-span landscape is confirmed exactly as spec'd: 3 spans (two byte-identical 18-byte spans + one 42,804-byte span ending at the ace marker; 42,840 bytes total). See `## Notes / conscious deviations` for the full adjudication; the spec file stays uncorrected (point-in-time record — this plan plus the grill record is the authoritative correction, per the `redteam-adjudication-is-authoritative-version-source` lesson).

## Commander's Intent

- **Purpose:** `skills/war/assets/workflow-template.test.mjs` asserts on the *source text* of
  `skills/war/assets/workflow-template.js`, and two of its text-preparation idioms are blind to
  string literals that merely look like syntax. (1) The two-step comment strip
  (`.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')`) mis-reads the `/*` … `*/`
  sequences inside the `resolveGate` mirror's find-exclusion glob literals as comment delimiters,
  deleting three fake spans — measured live: 18 + 18 + 42,804 bytes, the giant span running from
  the discovery clause to the file's only real block comment, `/* the single ace commit */`,
  swallowing the refine-loop/fix-round/gate-audit core — so three tests/helpers pass today only by
  luck of token position, and a new `held:*` literal assigned inside the deleted span would bypass
  the `landDecision known set` drift guard for the hand-mirrored `KNOWN_LAND_DECISIONS` enum with
  no red test (#929). (2) The `pt` undefined-interpolation guard's structural floor rejects only a
  bare untagged backtick immediately after `agent(`; untagged literals mid-concatenation, behind
  variables, in helper bodies, or nested inside `pt` interpolations pass — the live file carries
  **129 untagged template literals**, several of which demonstrably feed prompt text (seed set
  verified: the `adjRow`/`adjudications.map` rows, the `peers.map` row in `auditPrompt`, the
  `evItems.map` row in the evidence dispatch, the acceptance-criteria `.map` row in the gate-audit
  verdict prompt, the `mergedSlices` builder in the phase-close polish block, plus untagged
  literals nested *inside* `pt` interpolations at `submodNote`, `pinStatusLine`, and `guardLine`)
  — an undefined row field renders literal `undefined` into a prompt with the guard never
  consulted (#931, a ratified accepted residual being lifted). Close both with one discipline:
  narrow the strips, then bound **both** blindness classes with default-deny censuses that go red
  on any new entrant.
- **Method:** Every #929 fix is test-side — the glob literals are correct engine code (ADR 0036)
  and untouchable. Narrow the three corrupted strip sites to line-comment-only, exactly the
  `Task 3 — succeeded set exists in template source and gates nextWave` precedent, each with a
  per-site comment naming the glob-literal trap, why *its* token set never lives in block
  comments, and the new sensitivity (block-comment prose is now visible to the site's asserts —
  in particular the Part B site's negative `setup-scout` assert — bounded by the census below).
  Make that safety durable with a **block-comment census**: `blockCommentSpans(text)` — the
  block-strip regex confined to this helper, which **deliberately reproduces the naive idiom**
  (the census's subject is the idiom's *behavior*, fake spans included; a string-aware scan would
  see none of them) — asserts the **ordered exact list** of `/\/\*[\s\S]*?\*\//`-shaped spans of
  line-stripped source equals the enumerated expectation as `{head, tail}` substring pairs
  (ordered list, because spans 0 and 1 are byte-identical; never lengths or offsets), red on
  **addition and removal/merger both**, failing with the offending span's head fragment and an
  instruction to re-check the narrowed sites' token sets. The same census shape (locally
  duplicated ~10-line helper) bounds `workflow-scaffold.test.mjs`'s target to its two real block
  comments; the scaffold's own two strip sites **stay two-step** because their *positive*
  "survives comment stripping" assertions **need** the block pass — line-only preparation would
  false-pass when a future block comment carries `adversarial-confirm`/`scopeLock` prose after
  the real declaration is deleted — and the census comment states exactly that. Lift the #931
  floor with a **default-deny template-literal census**: one string-aware scanner
  (`scanTemplateLiterals(text)`, ~40 lines, Node-stdlib-only — recognizes line/block comments
  *outside strings*, single/double-quoted strings that must close on their line (else **throw**),
  and template literals with backslash escapes and recursive `${}` interiors so nested literals
  are first-class entries; throws on EOF/desync — fail-closed, never a silent narrowing; not a JS
  lexer: the recorded ceiling is regex-literal ambiguity, caught loudly by the unclosed-string
  throw) yields (i) every template-literal occurrence with its head fragment and whether
  `pt`-tagged, and (ii) every true block comment. Assert: the **multiset of untagged
  literal heads (head fragment + occurrence count) equals the enumerated registry exactly** —
  a new untagged literal anywhere (spawn site, helper operand, variable, nested interior) is a
  red test naming the fragment, and a stale row is equally red (exact equality cuts both ways);
  and **every true block comment is backtick-free** — the precondition the block census's
  "line-only is safe" argument leans on, and the designed coupling that makes the two censuses
  mutually load-bearing (their comments must say so). Quoted-string backticks (4 live, markdown
  code spans) are **out of scope by construction** — a backtick inside a quoted string is not an
  interpolation site and cannot render `undefined`. The registry (~100–110 rows expected at the
  dispatch base) is machine-derived once via the scanner, grouped under **class rationales**
  (validation/error messages, log lines, label/branch/path builders, git-command builders, the
  `pt` guard's own throw message), and carries the grep-able header rule **"a literal that feeds
  agent() prompt text is NEVER registered here — tag it with `pt`"** for auditor enforcement.
  Complete the tagging discipline in `workflow-template.js`: classify each census-flagged literal
  prompt-feeding vs value-composition; tag the prompt-feeding set with `pt` — an explicit
  **runtime behavior change** (undefined now throws at prompt-build instead of rendering
  `undefined`) — with a per-interpolation **required-vs-optional audit that includes the throw
  path's catch owner**, verified live: prompts built in the work/audit wave loop (`auditPrompt`,
  `adjudicationClause` consumers) throw into the per-task thunk catch → bounded
  `verdict:'escalate'`; prompts built in the refine/gate-audit/polish stretch (`evItems`,
  acceptance-criteria rows, `pinStatusLine`/`guardLine` interiors, `mergedSlices`) or at
  args-ingestion time (`adjRow`) have **no local catch** — a throw rides the **top-level catch to
  `held:workflow-error`**, killing the phase *after* its merges. Policy (doctrine-resolved):
  top-level-catch-context interpolations stay absence-tolerant (`?? '<unset>'` or the site's
  existing `|| '(see plan file)'` convention) unless entry-validation/construction guarantees the
  field; thunk-catch-context interpolations may be bare where the dispatch schema guarantees the
  field; already-defaulted interpolations make tagging a behavioral no-op, done for census
  uniformity. The audit checks each field against its **producer's** schema/construction, not
  just local defaults. The `criterion 3 (coverage floor) …` test stays **byte-unchanged**; the
  `pt` runtime, `resolveGate`, and every glob literal are untouched; no AST parser, no npm
  dependency. Queue position 2: rebase over land-failure-recovery's edits to both
  workflow-template files without modifying or duplicating them; re-derive both census
  enumerations and the classification at the dispatch base.
- **End state:**
  1. **Strips narrowed, idiom confined:** the three named sites — the tests
     `Part B seam is now FILLED — run.provision is consumed and env-blocked is wired (was the Part-A seam guard)`
     and `Task 4 — post-merge gate-audit is PARALLEL (runs over all merged tasks, not one-by-one inline)`,
     and the `extractLandDecisionLiterals` helper — strip line comments only, each with a
     per-site trap comment that also states the new block-comment-prose sensitivity (the Part B
     site naming its negative `setup-scout` assert) and names the census as the bound; grep for
     the block pass (`.replace(/\/\*[\s\S]*?\*\//g, '')`) across `workflow-template.test.mjs`
     hits **only** the `blockCommentSpans` census helper, and a **path-anchored** repo grep
     (`grep -rn --include='*.test.mjs' … skills/ hooks/` — never a repo-root walk, which drags
     `.claude/worktrees/` strays) shows the only other carrier file is
     `workflow-scaffold.test.mjs` (its census helper + its two deliberately-kept strip sites),
     with the expected-hit list re-derived at the dispatch base (the sibling's new
     `stage-workflow.test.mjs` is expected **zero-hit** — its plan mandates line-scoped matching
     only). **Grep is a completeness floor, not a ceiling** — the mandatory manual same-scope
     survey (any differently-spelled `/* … */`-deleting preparation in either carrier file) is
     recorded as a `Survey:` block in the implementation commit body, together with the
     verification that **no existing assertion in the file depends on block-comment removal to
     pass** and the statement that `blockCommentSpans`/`scanTemplateLiterals` are the **only
     sanctioned text-preparation idioms** for future structural tests (also stated in the census
     header comments).
  2. **False-fail mode dead, asserted both ways:** a unit fixture placing a token between a
     `'*/node_modules/*'`-style glob literal and a later real block comment — the narrowed
     line-only preparation finds the token; the same fixture through the old two-step strip
     provably loses it.
  3. **Template block-comment census:** green on live source asserting the **ordered exact
     list** of naive spans as `{head, tail}` pairs (handles the byte-identical spans 0/1; a
     fourth find-exclusion glob re-shuffles every pairing → red → conscious re-derivation);
     red on a mutated copy **adding** a `/* new */` comment; red on a mutated copy adding a new
     `/*`-bearing string literal; red on a mutated copy **removing/merging** a span (the delete
     direction has its own fixture); the failure output names the offending span's head fragment
     and instructs re-checking the narrowed sites' token sets before updating the expectation.
  4. **Scaffold block-comment census:** green on live source enumerating exactly the
     `dead dispatch` and `both types dead` comments; red on a mutated copy adding a third; its
     comment records the load-bearing keep-two-step rationale (the positive assertions *need*
     block-stripping) and that the census is what keeps those two sites sound.
  5. **Template-literal census (the lifted #931 floor):** on live source, the scanner's untagged
     head multiset equals the registry exactly and every true block comment is backtick-free.
     Red paths, each via a mutated-copy fixture through the parameterized helpers (permanent
     in-suite fixtures): (a) a bare untagged `` agent(`…`) `` literal; (b) an untagged literal
     assigned to a variable then passed to `agent(`; (c) an untagged operand inserted into a
     `pt`-concatenation helper body (the `auditPrompt` shape); (d) an untagged literal nested
     inside a `pt` literal's `${}` interpolation (the `submodNote`/`pinStatusLine`/`guardLine`
     shape — nested literals are first-class census entries, so helper interiors can never be
     exempted by accident); (e) an unterminated literal / unclosed quoted string → the scanner
     **throws** (fail-closed), never passes; (f) a backtick edited into the
     `/* the single ace commit */` block comment → red via the backtick-free assertion (the
     designed census coupling, tested).
  6. **Registry hygiene:** rows are head-fragment + occurrence-count entries grouped under class
     rationales; the header carries the grep-able "prompt-feeding literals are never registered
     here — tag them" rule; stale-row protection is **structural** (exact multiset equality reds
     a removed/renamed literal whose row remains), proven by one representative
     row-without-literal fixture and one literal-without-row fixture — the spec's per-row
     deletion loop is subsumed by exact equality (refinement, see Notes).
  7. **Subset-row blindness closed, asserted both ways:** `extractLandDecisionLiterals`
     (parameterized, in `workflow-template.test.mjs` — **not** `land-decision.test.mjs`, which
     this plan never touches) fed a mutated copy with `'held:bogus'` assigned between the
     `resolveGate` discovery clause and the `the single ace commit` marker yields `held:bogus`
     under the narrowed preparation (and would fail the `landDecision known set` membership
     assert) and yields nothing under the old two-step preparation; the row's `>= 6` sanity
     floor and membership semantics are unchanged — only its text preparation narrows.
  8. **Tagging discipline complete, catch-owner-audited:** every literal the census classifies
     prompt-feeding is `pt`-tagged — verified seeds: the five map-row builders **plus** the
     nested `submodNote`/`pinStatusLine`/`guardLine` interiors; the full classification is the
     dispatch-base census output, recorded per literal in the commit body — and every newly
     tagged interpolation carries its required-vs-optional disposition **with catch owner**
     (thunk-catch context: bare allowed per producer-schema guarantee, e.g. `AUDIT_VERDICT` and
     `WorkerResult` shapes and entry-validated task fields; top-level-catch context —
     `evItems`/acceptance-criteria/`pinStatusLine`/`guardLine`/`mergedSlices`/`adjRow` —
     absence-tolerant defaults unless construction-guaranteed, keeping the polish block's
     fail-open contract and ADR 0034's zero-false-positive bar; already-defaulted interpolations
     recorded as no-op taggings), naming for each **bare** tagging the existing sparse-fixture
     test exercising its absent-field path or adding one minimal case;
     `node --test skills/war/assets/workflow-template.test.mjs` fully green.
  9. **Existing floor intact:** the
     `criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline template literal`
     test is byte-unchanged over live `src`; its red-capability is proven the checkable way —
     the census suite asserts the floor's pattern (re-declared beside fixture 5(a) with a
     cross-reference comment naming the floor test) **matches** that fixture.
  10. **Lessons and lint:**
      `docs/learnings/glob-literal-fools-block-comment-strip-regex-in-structural-tests.md`
      carries a dated (2026-07-16 or later) mitigation note naming the narrowed sites and both
      censuses; `docs/learnings/pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan.md`
      updates its known-ceiling paragraph recording the lifted floor (the untagged-head census at
      its measured scale) and the new, smaller ceiling (registry-row review);
      `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  11. **Sibling and neighbor surfaces intact:** land-failure-recovery's two behavioral land tests
      and its line-scoped source-text pin in `workflow-template.test.mjs`, and its terminal-else
      arm and header/meta-adjacent comments in `workflow-template.js`, appear **byte-unchanged**
      in this plan's diff (no modification, no duplication); each stager anchor literal still
      occurs exactly once in the template — no new comment **or registry row** restates either
      anchor's bytes (the anchor literals are plain quoted strings, so no registry row can
      legitimately quote them); `skills/war/assets/land-decision.test.mjs` has an **empty diff**
      and its full suite stays green after the taggings — its comment-anchored
      `workflowEmitted()` window spans the polish-block tagging sites but keys on
      `landDecision`-assignment patterns the taggings never touch (verified live), and the suite
      run is the proof.
  12. **Release** — all four version slots bump in lock-step to the next free patch above the
      live integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified):** this plan is queue position 2; its only sibling overlap is with
  land-failure-recovery at `skills/war/assets/workflow-template.js` and
  `skills/war/assets/workflow-template.test.mjs` — a **cross-plan, serial** overlap handled by
  rebasing onto the post-land tip, never a same-phase collision. Within this plan all Phase-1
  tasks are file-disjoint.
- **Why one content phase:** every surface can land together; there are no cross-task symbol
  dependencies (the lesson notes reference the censuses by their pinned helper names —
  `blockCommentSpans`, `scanTemplateLiterals` — annotated defined-but-not-yet-emitted), so
  Phase 1 runs as one wave, no `deps` edges. The census/tagging interdependence is *within*
  Task 1.1, which the same-file rule forces into one task anyway.

1. **Phase 1 — Strip narrowing, censuses, and tagging-discipline completion**
   (wave 1: Task 1.1 ∥ 1.2 ∥ 1.3, file-disjoint; no waves)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — Strip narrowing, censuses, and tagging-discipline completion

### Task 1.1: Template strips narrowed + block census + literal census + complete the pt tagging

- Files: `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/workflow-template.js`
- Plan slice: The core of the plan, one coupled task (both files interlock — see Notes).
  **First act: rebase onto the integration tip and re-derive both census enumerations there** —
  land-failure-recovery's edits are on that tip and contribute entrants (its terminal-else arm
  adds at least one value-composition escalation-label literal to the `` `phase-${ph.id}-land` ``
  family, already ×2+×2 at the survey base; its partition-note/header comments join the
  block-comment population **if** authored as block comments). The authoring-base measurements in
  this plan (353/224/129/120, 3 naive spans, 1 true block comment, 4 quoted-string backticks)
  are **non-authoritative snapshots** for exactly this reason. Then:
  - **Strip narrowing (`workflow-template.test.mjs`):** at the three named sites — the
    `Part B seam is now FILLED …` test, the `Task 4 — post-merge gate-audit is PARALLEL …` test,
    and `extractLandDecisionLiterals` — drop the block pass, keeping
    `src.replace(/\/\/[^\n]*/g, '')`, per the `Task 3 — succeeded set …` precedent; per-site
    comments name the glob-literal trap, the site's token-set safety argument, the new
    block-comment-prose sensitivity (Part B: a future block comment containing `setup-scout`
    false-fails the negative assert — the census failure message forces the re-check), and the
    census as the bound. Update the `extractLandDecisionLiterals` `// ponytail:` ceiling comment
    to point at the censuses (comments are part of the diff —
    `source-comment-lags-emitted-prompt-after-rewrite`). Titles stay: none of the three titles
    states text-preparation semantics, and the semantic change is a *strengthening* documented
    in-comment, so no retitle is due (the relaxed-assertion lesson is about weakened asserts).
  - **Parameterize** `extractLandDecisionLiterals` and every census helper over the source text
    (default: the live `src`) so red paths run on mutated-copy fixtures. Add the both-ways
    probes: End-state 2 (false-fail fixture) and End-state 7 (`held:bogus` subset-row probe).
  - **Block-comment census:** new test near `MIRROR_REGISTRY` (it protects that registry's
    extractor); `blockCommentSpans(text)` applies line-strip + the block regex — **deliberately
    the naive idiom**: the census's subject is that idiom's behavior, fake spans included (a
    header comment states this and that the helper is the idiom's only sanctioned home). Assert
    the **ordered exact list** of spans as `{head, tail}` substring pairs (duplicate spans
    ordered, never counted by unique head — spans 0/1 are byte-identical); red on addition AND
    removal/merger (fixtures both directions); failure message per End-state 3. Naive-strip
    string-blindness inside the census itself is bounded by exact equality: corruption either
    leaves the span list identical (harmless) or changes it (loud red) — stated in the comment.
  - **Template-literal census:** new test beside the existing criterion-3 pair.
    `scanTemplateLiterals(text)`: single pass recognizing `//` and `/* */` comments *outside
    strings*, `'`/`"` strings (backslash-aware; **throw** if unclosed at end-of-line), and
    template literals (backslash-aware, recursive `${}` interiors — nested literals and the
    tagged/untagged distinction of each are first-class; `pt`-tagged = the identifier `pt`
    immediately preceding the backtick); **throw** on EOF in any construct. Recorded ceiling in
    the helper comment: regex-literal ambiguity is not parsed — a regex literal containing an
    unbalanced quote/backtick desyncs *loudly* via the unclosed-string throw, never silently
    (`// ponytail:` note; upgrade path is a real lexer, the rejected ceiling). Assertions:
    (i) untagged-head multiset (head fragment + occurrence count; fragment length chosen for
    distinctiveness — 44 chars measured 120 distinct heads at authoring) `deepEqual` the
    **registry** — one enumerated array grouped under class rationales (validation/error
    messages; log/notes lines; label/branch/path builders — including the ×5
    `` `${worktreeRoot || '<worktreeRoot>'}/${runId…` `` family; git/shell command builders;
    the `pt` guard's own throw-message literal), header rule per End-state 6;
    (ii) every true block comment is **backtick-free** (the census coupling — comment says the
    two censuses are mutually load-bearing); quoted-string backticks are skipped by construction
    with the reason in the comment (not interpolation sites). Red-path fixtures (a)–(f) per
    End-state 5, plus the two registry-hygiene fixtures per End-state 6, all permanent in-suite.
    Fixture 5(a) is additionally asserted to **match the criterion-3 floor's pattern**
    (re-declared beside the fixture with a cross-reference comment) — End-state 9's checkable
    reading; the floor test itself stays byte-unchanged.
  - **Complete the tagging discipline (`workflow-template.js`):** classify every untagged census
    entry at the dispatch base: **prompt-feeding → tag with `pt`** (verified seeds: the
    `adjudications.map` row and `adjRow`, the `peers.map` row and its nested findings row in
    `auditPrompt`, the `evItems.map` row, the acceptance-criteria `.map` row, `mergedSlices`,
    and the untagged interiors nested in `pt` literals at `submodNote`, `pinStatusLine`,
    `guardLine`; expect the classification to find more — e.g. the intent-criteria and
    fix-findings row builders); **value-composition → registry row**. For each tagged literal,
    audit **each interpolation** with its catch owner (verified topology: the only catches are
    the per-task wave-loop thunk catch and the top-level catch at the template's tail —
    **nothing local in the refine/gate-audit/polish stretch**): thunk-catch context may stay
    bare where the producer schema/entry validation guarantees the field (check the
    **producer** — `AUDIT_VERDICT`, `WorkerResult`, `mergedTasksForGateAudit` construction,
    entry-validated task fields — not just local `||` defaults); top-level-catch context gets
    absence-tolerant defaults (`?? '<unset>'` or the site's existing `|| '(see plan file)'`
    convention) unless construction-guaranteed — a phase-killing `held:workflow-error` from a
    cosmetic row field would invert severity and violate the polish block's fail-open contract
    and ADR 0034's zero-false-positive bar; already-defaulted interpolations (e.g. every `adjRow`
    field, `${mergedSlices || '(none)'}`'s outer site) are tagged as **behavioral no-ops for
    census uniformity** and recorded as such. Record the full classification + per-interpolation
    audit as an `Audit:` table in the commit body; for every interpolation left bare, name the
    existing sparse-fixture test exercising its absent-field path or add one minimal case. Do
    **not** touch: the sibling's terminal-else arm and comments, either stager anchor literal
    (no new comment or row restating their bytes), the `export const meta` block, the `pt`
    definition, `resolveGate`/`GATE_DISCOVERY_TOKEN`, any glob literal.
  - **Sweep (End-state 1):** the path-anchored grep + mandatory manual same-scope survey + the
    no-assertion-depends-on-block-removal verification, all recorded as the commit-body
    `Survey:` block; stragglers outside this task's Files route to Lead-filed follow-ups
    (backstops).
- requiresTest: true (mapped evidence: the census tests, red-path fixtures, and both-ways probes
  in `workflow-template.test.mjs` in this diff, matched by the `skills/**/*.test.mjs` floor
  pattern)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Scaffold block-comment census

- Files: `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: Same `blockCommentSpans` census shape as Task 1.1, **duplicated locally**
  (spec-resolved: a shared module for ~10 lines across skill boundaries is not warranted),
  parameterized over source text: assert the ordered exact `{head, tail}` list of naive spans in
  `skills/red-team/assets/workflow-scaffold.js` is exactly its two real block comments — the
  `dead dispatch` fall-through and the `both types dead` fall-through — red on a mutated copy
  adding a third **and** on one removing/merging a span; verify both enumerated comments are
  backtick-free. The census comment carries the **load-bearing** keep-two-step rationale
  (upgraded per the grill): the file's two existing strip sites are *positive* "survives comment
  stripping" assertions that **need** the block pass — narrowing them to line-only would
  false-pass when a future block comment carries `adversarial-confirm`/`scopeLock` prose after
  the real declaration is deleted — and the census is what keeps that two-step preparation sound
  (the scaffold has no `/*`-bearing string literals while the census holds). Same-scope hand-scan
  of this file for differently-spelled strip equivalents, recorded in the commit-body `Survey:`
  block (grep floor rule). `workflow-scaffold.js` itself is untouched.
- requiresTest: true (mapped evidence: the census test in `workflow-scaffold.test.mjs` in this
  diff, matched by the `skills/**/*.test.mjs` floor pattern)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Lesson notes — mitigation + ceiling update

- Files: `docs/learnings/glob-literal-fools-block-comment-strip-regex-in-structural-tests.md`, `docs/learnings/pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan.md`
- Plan slice: Two dated (2026-07-16 or later) body notes, routed through the redaction lint as
  usual (End-state 10). The glob lesson gains a mitigation note: the three
  `workflow-template.test.mjs` sites are narrowed to line-comment-only, and the fake-span
  landscape is bounded by the `blockCommentSpans` censuses in `workflow-template.test.mjs` and
  `workflow-scaffold.test.mjs` (ordered exact span list — any new block comment or `/*`-bearing
  string literal is a red test, the conscious-decision point the lesson could previously only
  ask for as manual process). The pt lesson updates its known-ceiling paragraph: the criterion-3
  floor is lifted by the `scanTemplateLiterals` untagged-head census — noting the **measured
  scale** (≈129 untagged literals at adoption, most value-composition, enumerated in a
  class-grouped registry; the spec's original ~7-row zero-backtick residue design was corrected
  at conversion) — and the new, smaller ceiling: registry-row review (a careless row for a
  prompt-feeding literal re-opens the gap consciously; the header rule + auditor grep is the
  mitigation), plus the scanner's recorded regex-literal ambiguity ceiling (fails loud). Both
  notes reference the censuses by pinned helper names and owning files — *defined-but-not-yet-
  emitted; produced in Tasks 1.1/1.2 (same phase)* — never by test-title bytes or line numbers.
  Frontmatter `description`/`keywords` stay untouched (body notes only — no MEMORY.md projection
  impact). Check: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
- requiresTest: false — docs-tier (lesson bodies only); the fail-closed redaction lint is the
  guard (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes shipped engine behavior (`workflow-template.js` — newly tagged
  prompt rows now fail loud on undefined) and shipped test assets — users only receive it via a
  release. Bump all four release slots together to the **next free patch above the live
  integration base at land time** (never a resolved semver literal, per the /war-strategy §2
  next-free-patch convention): `plugin.json` `version`, `marketplace.json` `metadata.version`
  **and** `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never
  emptied, no badge). Expected integration base: the working tip after this plan's Phase 1 lands,
  which itself stacks on the tip left by land-failure-recovery **including its own release bump**
  (queue position 2) — so resolve from the **live slots**, never from any version literal in
  either plan (stacked-release lag lesson). Standalone fallback: a run of this plan through plain
  `/war` resolves the next free patch from the four slots itself.
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End-state 12).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live prompt-render observation (spec §8 runtime-change risk): the first `/war` phase run on the
  released plugin builds every dispatched prompt without an undefined-interpolation throw from a
  newly tagged row — a mis-audited required-vs-optional call would surface as a spurious
  per-task `verdict:'escalate'` (thunk-catch context) or a phase-level `held:workflow-error`
  (top-level-catch context) naming `undefined interpolation after …` · why deferred: only live
  dispatches exercise every prompt path with real run data; the automated proxy is End-state 8's
  fully-green sparse-fixture behavioral suite plus the catch-owner audit · runner: operator, at
  the next `/war` run on the released plugin.
- Out-of-footprint strip-idiom stragglers: any differently-spelled `/* … */`-deleting text
  preparation the End-state-1 manual survey finds outside this plan's two carrier test files ·
  why deferred: editing it in-task would break Phase-1 file-disjointness (spec §9 scopes the
  retrofit to the two named files; the 2026-07-16 sweep found no other carrier) · runner: the
  Lead files one follow-up issue per straggler at phase close, from the `Survey:` block (ADR
  0017 — named owner, never a prose waiver).

## Notes / conscious deviations

- **SPEC DEVIATION (grill Q10/Q11, measured and adjudicated 2026-07-16):** the spec's §3/§4
  residue-census design — blank `pt` literals + ~7 named exemption rows, then "assert zero
  backticks remain" — is factually unimplementable: the live template carries **129 untagged
  template literals (120 distinct heads)** and **4 backticks inside ordinary quoted strings**,
  so the literal assertion is unreachable and the row model is off by an order of magnitude.
  The corrected design (this plan): a string-aware `scanTemplateLiterals` scanner; **default-deny
  as exact multiset equality of untagged literal heads against an enumerated class-grouped
  registry**; quoted-string backticks out of scope by construction (not interpolation sites);
  block comments asserted backtick-free (preserving the spec's census-coupling decision). The
  spec's *intent* — no untagged prompt-feeding literal without a conscious reviewable decision —
  is preserved at true scale; the spec file stays uncorrected (point-in-time record; this plan +
  the grill adjudication is the authoritative correction). The registry's standing maintenance
  cost (any new untagged literal in future engine edits needs a row or a tag) is the price of
  default-deny — **ratified by the operator at the conversion volley (full-file registry,
  Option A)**.
- **Grill dispositions not covered elsewhere (2026-07-16):** Q1 — the census is the durable
  equivalence proof; a live-source both-ways assertion would be vacuous *by construction* today
  (every asserted token sits outside the fake spans — that is precisely the passing-by-luck
  defect), so the synthetic fixture (End-state 2) proves the mechanism and the census bounds the
  future: already-covered. Q4 — no retitle due: none of the three titles states
  text-preparation semantics; the change strengthens asserts and is documented in-comment.
  Q7/Q8 — the block census deliberately *is* the naive idiom (its subject is that idiom's
  behavior; a string-aware scan would see no fake spans); its own string-blindness is bounded by
  exact-list equality — corruption is harmless or loud, never silently wrong — and for the
  literal census the '//'-in-string subcase disappears entirely (the scanner recognizes comments
  only outside strings): stated in both helpers' comments. Q9/Q21 — Task 1.1's first act owns
  dispatch-base re-enumeration. Q14 — designed coupling, tested as fixture 5(f). Q16 — scanner
  recursion makes helper/nested interiors first-class census entries; an inner untagged literal
  can never ride an outer tag. Q19 — ratified: prompt-feeding literals with fully-defaulted
  interpolations are tagged as behavioral no-ops for uniformity. Q26 — resolved toward the
  checkable reading (floor pattern re-applied to fixture 5(a); floor test byte-unchanged).
  Q29 — `extractLandDecisionLiterals` work happens in `workflow-template.test.mjs` where it
  lives; `land-decision.test.mjs` is deliberately zero-diff and its green suite is the proof its
  comment-anchored window (which spans the polish-block tagging sites but keys on
  `landDecision`-assignment patterns) is unaffected. Q30 — Phase 2 below carries the bump the
  spec's §5 omitted.
- **Q17 severity-inversion, doctrine-resolved (verified topology):** the only catches are the
  wave-loop per-task thunk catch and the top-level catch; nothing local guards the
  refine/gate-audit/polish stretch, so a bare tagged interpolation there converts a
  formerly-cosmetic `undefined` render into a phase-killing `held:workflow-error` *after the
  phase's merges* — and the polish block is contractually **fail-open**. Resolution needs no new
  policy: ADR 0034's zero-false-positive bar plus the file's own convention at these exact sites
  (`|| '(see plan file)'`, `|| '(none)'`, `|| phaseBaseCmd`) already choose placeholder-over-
  throw in that stretch; the catch-owner column simply makes the existing required-vs-optional
  audit enforce it. Bare throws remain correct in thunk-catch contexts with schema-guaranteed
  fields — bounded per-task escalation is the guard's ratified purpose.
- **Task 1.1 is deliberately one coupled task (and the revert unit — grill Q31):** all test-side
  work shares `workflow-template.test.mjs` (same file → same task), and the literal census and
  the taggings are interlocked both ways — the census is red until the classification lands, and
  the taggings' safety is proven by that census plus the behavioral suite. The two files revert
  only **as a pair**: reverting the taggings alone reds the census, reverting the census alone
  strands the taggings unguarded. Its diff carries `*.test.mjs` evidence for the requiresTest
  floor by construction.
- **Both census enumerations are dispatch-base work:** every seed list and count in this plan
  (129/120, five+three tagging seeds, the span triple, the ×5 path-builder family, the sibling's
  `phase-${ph.id}-land` entrants) is an authoring-base snapshot, **non-authoritative** — the
  worker re-derives via the scanner at the rebased tip and classifies each entrant by the
  standing rules.
- **Sibling-preservation duties (End-state 11):** rebased over byte-unchanged; no second
  occurrence of either stager anchor literal in any new comment or registry row (the sibling's
  imported-constant anchor guard polices exactly that; the anchors are plain quoted strings, so
  no legitimate registry row can quote them).
- **Census helpers duplicated, not shared (spec-resolved):** `blockCommentSpans` appears in both
  test files rather than a cross-skill shared module — ~10 lines does not warrant a new shared
  surface. `scanTemplateLiterals` exists only in `workflow-template.test.mjs` (the scaffold has
  no `pt` discipline — spec §9).
- **Non-goals honored (spec §9):** no change to `pt`'s runtime definition, `resolveGate`, or any
  glob literal beyond the audited taggings; no whole-prompt rendered-text scan; no full JS lexer
  (the scanner's regex-literal ambiguity is a recorded loud-failure ceiling), no AST, no npm; no
  narrowing of the scaffold's two strip sites; no literal census for `workflow-scaffold.js`; no
  repo-wide census retrofit beyond the two named files.
- **No new domain terms, no ADRs (spec §6–7):** "census" is test-local vocabulary in the ADR
  0025 drift-guard family; the work executes ADR 0025/0031 and shrinks — without changing — ADR
  0034's recorded Option B residual, which stays true of the smaller post-change ceiling.
- **The `landDecision known set` row's `>= 6` sanity floor and membership semantics are
  unchanged** — only the extractor's text preparation narrows (spec §8).
- **requiresTest/tier routing:** Task 1.3 is an all-`.md` docs-tier task; Tasks 1.1/1.2 route the
  base worker tier with mapped `skills/**/*.test.mjs` evidence in-diff; requiresPackaging false
  everywhere (meta-repo, no Dockerfile in the footprint).
- **Anchors by named construct throughout** — test titles, `extractLandDecisionLiterals`,
  `MIRROR_REGISTRY`, `blockCommentSpans`/`scanTemplateLiterals`, `GATE_DISCOVERY_TOKEN`, the
  `the single ace commit` marker tail, `submodNote`/`pinStatusLine`/`guardLine` — never line
  numbers (they rot across the serial merge queue; this plan's line references and byte
  measurements are authoring-time evidence, never census expectations).

## Open decisions

- None — the census-scope survivor was ratified at the conversion volley: **full-file
  untagged-head registry (Option A)**. The sole cross-plan unknown (what land-failure-recovery's
  landing adds to the census populations) is mechanically absorbed by Task 1.1's dispatch-base
  enumeration duty.
