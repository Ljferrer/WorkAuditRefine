# Structural-test integrity for the workflow engine — narrow the corrupt block-comment strips, bound block comments by census, and widen the pt-tag coverage floor to a default-deny literal census

Date: 2026-07-16
Status: draft (memory-mined defects, every claim re-verified against the live tree 2026-07-16) — awaiting conversion

## 1. Context — the gap / problem

Source issues: #929, #931

Both issues attack the same weakness from two sides: `skills/war/assets/workflow-template.test.mjs`
asserts on the *source text* of `skills/war/assets/workflow-template.js`, and its text-preparation
idioms are blind to string literals that merely look like syntax. One idiom silently deletes real
code before asserting (#929); the other covers only one syntactic shape of the defect it guards
(#931). Any widening of the second must not step on the trap recorded by the first — that is why
they resolve in one design.

**#929 — block-comment-strip corruption.** Three structural tests strip comments with the two-step
idiom `src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')` before asserting on tokens:
the tests titled `Part B seam is now FILLED — run.provision is consumed and env-blocked is wired
(was the Part-A seam guard)` and `Task 4 — post-merge gate-audit is PARALLEL (runs over all merged
tasks, not one-by-one inline)`, and the `extractLandDecisionLiterals` helper feeding the
`landDecision known set` subset row of `MIRROR_REGISTRY`. The template's inline `resolveGate`
mirror (ADR 0036) carries find-exclusion glob literals — `'*/node_modules/*'`, `'*/.git/*'`,
`'*/.claude/*'` — whose embedded `/*` … `*/` sequences the block pass mis-reads as comment
delimiters. Measured at authoring (2026-07-16): the pass produces three fake spans totalling
42,840 bytes; the largest (42,804 bytes, ~37% of the line-stripped source) runs from the
`resolveGate` discovery clause to the file's **only** real block comment, the
`/* the single ace commit */` marker on the `aceSha` assignment — swallowing the engine's
refine-loop/fix-round/gate-audit core. Every asserted token happens to sit outside the deleted
spans today (empirically confirmed: `run.provision`, `env-blocked`, `execution-evidence`,
`parallel(`, the absent `setup-scout`, and all six emitted `landed`/`held:*` literals produce
identical results with and without the block pass), so the tests pass by luck of position. A
future code move into the deleted span flips a positive assertion to false-fail; worse, the
`extractLandDecisionLiterals` blindness means a new `held:*` literal assigned inside that span
would bypass the subset row — the drift guard for the hand-mirrored `KNOWN_LAND_DECISIONS` enum
(the "change both copies and the drift-guard test together" discipline, ADR 0025) — with no red
test. A fourth sibling, `Task 3 — succeeded set exists in template source and gates nextWave`,
was already narrowed to line-comment-only stripping for exactly this reason and carries the
explanatory comment; the three remaining sites need the same treatment. Lesson:
`docs/learnings/glob-literal-fools-block-comment-strip-regex-in-structural-tests.md`
(code-verified).

**#931 — pt-tag coverage-floor breadth.** The `pt` tagged-template guard in
`workflow-template.js` (ADR 0034 point 3, Option B — operator-ratified 2026-07-10) throws at
prompt-build time when any interpolated value is `=== undefined`. The discipline requires EVERY
prompt-rendering template literal to be tagged, but its structural floor — the test titled
`criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline template
literal` — is the single regex `assert.doesNotMatch(src, /\bagent\(\s*`/)`: it rejects only an
untagged backtick immediately after `agent(`. An untagged literal buried mid-concatenation,
assigned to a variable first, or produced by an untagged helper passes the floor, so a future
spawn site can silently reintroduce the undefined-interpolation leak. The issue body ratifies
this as an accepted residual being lifted, not a defect. Verified at authoring: discipline holds
at all 20 `agent(` call sites (226 `pt`-tagged heads; prompts arrive as inline `pt` literals,
`pt`-built helpers like `auditPrompt`, or pre-built variables) — but the uncovered shapes exist
in-source now: `auditPrompt` composes its prompt as a `+`-concatenation of individually tagged
operands (one untagged operand slipped in would leak), and at least five untagged map-row
literals feed prompt text today (the `adjudications.map` row builder using `adjRow`; the
`peers.map` row builder nested *inside* a `pt` interpolation in `auditPrompt`; the `evItems.map`
row builder in the evidence prompt; the acceptance-criteria `.map` row builder feeding the
auth-verdict prompt; the `mergedSlices` builder in the phase-close polish block) — an undefined
row field renders literal `undefined` into the prompt with the guard never consulted. Lesson:
`docs/learnings/pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan.md`
(code-verified), whose body records the current ceiling as a ratified deferred-validation.

**Survey-derived straggler (repo-wide sweep, 2026-07-16):** the same two-step strip idiom exists
in exactly one other file, `skills/red-team/assets/workflow-scaffold.test.mjs` (the tests titled
`scaffold structure OK — adversarial-confirm survives comment stripping` and `scaffold structure
OK — scopeLock is a declared, invoked constant (survives comment stripping)`). Its target,
`skills/red-team/assets/workflow-scaffold.js`, contains exactly two real block comments and no
`/*`-bearing string literals, so those strips are *correct today* — latently fragile, not broken.

## 2. Pivotal constraints

- **The glob literals are correct code and untouchable.** They are the `resolveGate` discovery
  clause of the engine-owned gate composition (ADR 0036), behaviorally bound to the canonical
  `war-config.mjs` export by the `resolveGate` mirror-registry row. Every fix here is test-side.
- **No npm dependencies, no AST parser.** The test files are Node-stdlib-only; a full JS lexer
  (regex-literal ambiguity and all) is the rejected ceiling. Any scanning must start from
  anchored, known-context positions and fail loud on desync — never guess silently.
- **Zero false positives is the ratified bar for the pt discipline** (ADR 0034: Option A's
  whole-prompt text scan was operator-rejected for false-positiving on legitimate "undefined"
  prose). A widened structural floor must not force-tag value-composition literals that
  deliberately render `|| '<placeholder>'` defaults instead of throwing — `GATE_DISCOVERY_TOKEN`,
  the `staleRemote` loop's `diagnostic` literal, the `refineryPath`/`refineryLandPath`/
  `phaseBaseCmd`/`polishBranch`/`polishWorktree` builders.
- **Line-only stripping changes what the tests can see:** block-comment *content* stays in the
  scanned text. The negative assertion (`setup-scout` absent) gains a false-fail mode and the
  positive assertions a false-pass mode against any *future* block comment carrying an asserted
  token. Today that surface is one 28-byte marker with no asserted token; the design must keep
  that fact mechanically true, not hope it stays true.
- **The `pt` runtime guard itself is untouched.** This is tripwire breadth plus completing the
  tagging discipline — but tagging a previously-untagged prompt-feeding literal is a runtime
  behavior change (undefined now throws to the wave-loop `verdict:'escalate'` path instead of
  rendering `undefined`), so each newly tagged interpolation needs the required-vs-optional
  audit (`?? '<unset>'` where absence is legal), per the existing discipline.
- Structural helpers must accept the source text as a parameter (defaulting to the live file) so
  every red path is provable with mutated-copy fixtures — the delete-the-feature rule
  (`weak-test-assertion-passes-without-feature-being-exercised`).
- Anchors in tests, comments, and this spec are named constructs, never line numbers.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Fix for the three corrupted strips (#929) | Narrow each to line-comment-only stripping (`src.replace(/\/\/[^\n]*/g, '')`), exactly the `Task 3 — succeeded set …` precedent, each with an inline comment stating why line-only is safe for *its* token set. A string-aware block strip is rejected: it needs the banned lexer and buys nothing — the file's sole real block comment contains no asserted token. |
| Making "provably safe" durable | A **block-comment census** test in `workflow-template.test.mjs`: over line-stripped source, enumerate every `/\/\*[\s\S]*?\*\//`-shaped span by owning construct (the fake spans originating in the `resolveGate` glob literals; the `/* the single ace commit */` marker) via stable head/tail substrings — never lengths or offsets. Any new span (a new block comment, or a new `/*`-bearing string literal) reds the census: the conscious-decision point the lesson could only ask for as manual process. |
| Scaffold straggler | Same census shape in `workflow-scaffold.test.mjs`, enumerating its two real block comments (`dead dispatch`, `both types dead`). Its two strip sites stay two-step — they are correct while the census holds, and the scaffold uses real block comments as a living idiom, so narrowing would be wrong there. |
| pt floor widening (#931) | A **default-deny residue census** test: blank line comments; blank every `pt`-tagged literal via an anchored, escape-aware, `${}`-nesting-aware scan that fails loud on desync; blank each enumerated value-composition exemption (anchored at its named construct's head); then assert **zero backticks remain**. Every template literal is therefore `pt`-tagged or a conscious exemption row — a new untagged literal anywhere (spawn site, helper operand, variable, nested inside an interpolation) is a red test naming the offending fragment. |
| `${}` interiors | The scan must track `${}` nesting anyway to find a literal's true closing backtick (nested literals exist live, e.g. the `peers.map` row inside `auditPrompt`); interiors are left in the residue, so nested untagged literals are censused, not invisible. |
| Rejected alternatives for #931 | Shape-enumerated regexes (`=\s*`` ` ``, `,\s*`` ` `` …) — false-positive inside multi-line prompt prose, the same string-blindness family as #929. Whole-file lexer / AST scanner — banned ceiling. Runtime rendered-text scan — Option A, already operator-rejected (ADR 0034). |
| Untagged prompt-feeding literals the census flags | Tag with `pt`, auditing each interpolation for required (bare — throw is correct) vs legitimately-absent (`?? '<unset>'`). Seed list from authoring: the five map-row builders named in §1; the census completes the enumeration mechanically at implementation. |
| Value-composition literals | Never tagged (they must render placeholders, not throw). Each becomes an exemption row keyed by a distinctive head substring at its named construct — the registry-grows-by-row pattern, mirroring `MIRROR_REGISTRY`. |
| Census coupling | The residue census ignores block comments entirely; its precondition — block comments stay bounded to the known backtick-free set — is exactly what the block-comment census enforces. The two tripwires are load-bearing for each other; their comments must say so. |
| Existing floor test | `criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline template literal` is kept byte-unchanged: its title is still true, and it is the zero-maintenance first tripwire if the census scanner ever regresses. The census is additive. |
| Helper parameterization | The census helpers and `extractLandDecisionLiterals` take the source text as an argument (default: the live `src`) so red-path criteria run on mutated copies. |
| Lesson bodies | Both cited lessons get dated notes: the glob-literal lesson a mitigation note (narrowed sites + census tripwires); the pt lesson an update to its "known ceiling" paragraph recording the lifted floor and the new, smaller ceiling. |

## 4. Mechanics

**`workflow-template.test.mjs` — strips.** Drop the block pass at the three named sites, keeping
line-comment stripping; add per-site comments in the `Task 3 — succeeded set …` style naming the
glob-literal trap and why the site's tokens never live in block comments. Update the
`extractLandDecisionLiterals` "ponytail:" ceiling comment to point at the census. Titles stay —
no assertion semantics weaken, so no retitle is due — but each site's comment is part of the diff
(`source-comment-lags-emitted-prompt-after-rewrite` discipline).

**`workflow-template.test.mjs` — block-comment census.** One new test near `MIRROR_REGISTRY`
(it protects that registry's extractor): a small `blockCommentSpans(text)` helper returns the
`/\/\*[\s\S]*?\*\//g` matches of line-stripped text; the test asserts the match set is exactly
the enumerated expectation (fake spans identified by their glob-fragment heads; the real marker
by its `the single ace commit` tail), failing with the offending span's head fragment on any
addition.

**`workflow-template.test.mjs` — residue census.** A `ptResidue(text)` helper: blank line
comments; from each `pt`-backtick head, scan to the literal's true close (backslash escapes,
`${}` depth; throw on EOF/desync — fail-closed), blanking literal text but leaving `${}`
interiors scannable; blank each exemption row's literal the same way from its anchored head.
The test asserts no backtick survives, reporting each survivor with its adjacent source
fragment. Exemption rows live in one enumerated array with a one-line rationale per row.

**`workflow-template.js` — complete the tagging discipline.** Tag the census-flagged
prompt-feeding literals (§3 seed list) with `pt`, adding `?? '<unset>'` only where a field is
legitimately absent (several already carry `|| …` defaults — audit, do not blanket-default).
Value-composition constructs are untouched.

**`workflow-scaffold.test.mjs` — census.** Same `blockCommentSpans` shape (duplicated locally —
a shared module for ~10 lines across skill boundaries is not warranted), enumerating the two
real block comments.

**`docs/learnings/` — the two dated notes** described in §3, routed through the redaction lint
as usual.

## 5. Surface changes

- `skills/war/assets/workflow-template.test.mjs` — three strip narrowings + comments; block-comment census; residue census + exemption rows; `extractLandDecisionLiterals` parameterization
- `skills/war/assets/workflow-template.js` — `pt`-tag the census-flagged prompt-feeding literals (five known seeds; census completes the list)
- `skills/red-team/assets/workflow-scaffold.test.mjs` — block-comment census
- `docs/learnings/glob-literal-fools-block-comment-strip-regex-in-structural-tests.md` — dated mitigation note
- `docs/learnings/pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan.md` — dated ceiling-update note

## 6. New domain terms (CONTEXT.md)

None — "census" here is test-local vocabulary in the existing drift-guard family (ADR 0025),
not pipeline language.

## 7. Recommended ADRs

None new, none amended. The work executes ADR 0025 (drift-guard discipline) and ADR 0031
(guard coverage by equivalence class), and shrinks — without changing — ADR 0034's recorded
Option B residual ("a future prompt literal added without the tag"); that sentence remains true
of the smaller post-change ceiling, so the ADR stands as written.

## 8. Open risks / implementation notes

- **Ordering:** this spec lands **after** `docs/specs/2026-07-16-land-failure-recovery-design.md`
  (shared `skills/war/assets/workflow-template.js` / `workflow-template.test.mjs` file family);
  the roadmap must sequence this spec's plan behind that one. All anchors here are named
  constructs, so the earlier landing shifting the file is harmless — but the residue census
  enumeration (exemption seed list, prompt-feeding literal list) must be re-run against the
  post-land tip at implementation, since that plan may add literals of either kind.
- **Runtime behavior change from new taggings:** an undefined interpolation in a newly tagged
  map-row literal now throws at prompt-build time and rides the wave-loop thunk catch to
  `verdict:'escalate'` instead of rendering `undefined` into a prompt. That is the guard's
  ratified purpose, but a mis-audited required-vs-optional call surfaces as a spurious
  escalation; the existing sparse-fixture behavioral tests in `workflow-template.test.mjs` are
  the backstop (§10.7).
- **Scanner desync is the census's own failure mode:** a `'//'` inside a string ahead of a
  backtick on the same line, or braces inside quoted strings inside `${}`, can desync the blank
  pass. The design is fail-closed — desync throws with the adjacent fragment, never silently
  narrows coverage — so the worst case is a loud false red demanding a scanner or source
  restructure, never a quiet gap.
- **New ceiling, recorded:** an exemption row added carelessly for a literal that actually feeds
  a prompt re-opens the gap consciously (row rationale + review is the mitigation); prose inside
  a *future* block comment can still shadow line-stripped tokens if the block-comment census
  expectation is updated without re-checking the narrowed sites' token sets — the census failure
  message should say to re-check them.
- The `landDecision known set` subset row's `>= 6` sanity floor and membership semantics are
  unchanged; only its extractor's text preparation narrows.

## 9. Non-goals / deferred

- No change to `pt`'s runtime definition, `resolveGate`, `GATE_DISCOVERY_TOKEN`, or any glob
  literal — the template's executable behavior changes only via the audited new taggings.
- No tagging of value-composition literals; no whole-prompt text scan in any form.
- No full JS lexer, no AST scanner, no npm dependency.
- No narrowing of the scaffold's two strip sites (correct while its census holds).
- No residue census for `workflow-scaffold.js` — the scaffold has no `pt` discipline to enforce;
  deferred until it grows one.
- No repo-wide retrofit of the census idiom beyond the two files named — the 2026-07-16 sweep
  found no other `*.test.mjs` using the block-strip idiom.

## 10. Validation criteria

1. **Strip-idiom sweep:** grep `workflow-template.test.mjs` for the block pass
   (`.replace(/\/\*[\s\S]*?\*\//g, '')`) — after the change it appears only inside the
   `blockCommentSpans` census helper; grep repo-wide across `*.test.mjs` confirms the only other
   carrier is `workflow-scaffold.test.mjs` (its two censused sites). The grep is a completeness
   floor, not a ceiling — after it, hand-scan both test files' same-scope tests and comments for
   differently-spelled equivalents (any regex deleting `/* … */` spans) and list each
   same-meaning straggler as a survey-derived correction.
2. **False-fail mode is dead:** unit fixture — a source string with a token placed between a
   `'*/node_modules/*'`-style glob literal and a later real block comment; the narrowed
   (line-only) preparation finds the token, and the same fixture through the old two-step strip
   provably loses it (asserted both ways in the test).
3. **Block-comment census (template):** green on the live source; red on a mutated copy with one
   added `/* new */` comment; red on a mutated copy with a new `/*`-bearing string literal.
4. **Block-comment census (scaffold):** green on live source enumerating exactly the
   `dead dispatch` and `both types dead` comments; red on a mutated copy adding a third.
5. **Residue census red paths**, each via a mutated-copy fixture: (a) a bare untagged
   `` agent(`…`) `` literal; (b) an untagged literal assigned to a variable then passed to
   `agent(`; (c) an untagged operand inserted into a `pt`-concatenation helper body; (d) an
   untagged literal nested inside a `pt` literal's `${}` interpolation; (e) an unterminated
   literal → the scanner throws (fail-closed), not passes.
6. **Residue census green path:** live source passes with every exemption row carrying a
   rationale; deleting any single exemption row makes the census red (proves each row is
   load-bearing, none stale).
7. **Behavioral regression:** `node --test skills/war/assets/workflow-template.test.mjs` fully
   green after the new taggings — the existing sparse-fixture `runPhase` tests exercise
   absent-field rendering, so an over-strict tagging (missing `?? '<unset>'`) surfaces here.
8. **Subset-row blindness closed:** feeding `extractLandDecisionLiterals` a mutated copy with
   `'held:bogus'` assigned between the `resolveGate` discovery clause and the
   `the single ace commit` marker now yields `held:bogus` in the extraction (and would fail the
   `landDecision known set` membership assert); the same probe against the old two-step
   preparation yields nothing — asserted both ways.
9. **Existing floor intact:** the `criterion 3 (coverage floor) …` test is byte-unchanged and
   still red-capable (fixture 5a trips it as well as the census).
10. **Lessons and lint:** both edited lesson files carry a dated (2026-07-16 or later) note —
    the glob lesson naming the narrowed sites and both censuses, the pt lesson recording the
    lifted floor and the new ceiling — and
    `node skills/_shared/war-memory.mjs lint docs/learnings/` passes.
