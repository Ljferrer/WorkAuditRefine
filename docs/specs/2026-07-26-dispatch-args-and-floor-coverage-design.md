# Workflow-engine dispatch args & floor coverage hardening — mechanize `--args` embedding in the stager, complete the submodule floor/note across the land/polish/floor-retry dispatch families, arbiter the `classificationClause` site list

**Source issues:** #1134 (per-phase Workflow args cannot ride the tool call at real size —
`stage-workflow.mjs` should embed them via `--args <file>`), #1114 (submodule scoping/floors
incomplete across three dispatch families: re-land, polish merge, floor-retry), #1151
(`classificationClause` header comment hand-enumerates consumer sites with no drift-guard arbiter).
All three verified live on the working tree at spec time (see per-claim grounding below); every
edit site is anchored by named construct, never by line number (CLAUDE.md known trap: line numbers
rot across the serial merge queue).

## 1. Context — the gap / problem

Three coherence gaps in the per-phase Workflow engine, one per layer: the staging tool, the
dispatched prompts, and a header comment.

- **Args delivery gap (#1134, `skills/war/assets/stage-workflow.mjs`).** At real campaign size the
  per-phase Workflow args payload — Lead-prefetched `args.memory` blocks + verbatim `planSlice`
  strings per task + the verbatim Commander's Intent — measured ~104.5 KB live and cannot be
  delivered inline through the Lead's context as the Workflow tool-call `args`. Phase 1 of the
  measuring campaign shipped via an operator-approved **hand edit** of the staged copy: an
  `EMBEDDED_ARGS` prelude plus a rewrite of the entry fallback so absent dispatch args fall back to
  the embedded object. Verified at tip: `stage-workflow.mjs` has no `--args`/`EMBEDDED_ARGS`
  handling of any kind; `EMBEDDED_ARGS` appears nowhere under `skills/`; `workflow-template.js`
  still carries the bare string-arm fallback `: (args || {})` (exactly one occurrence, the
  D8-guarded `const A =` ternary's object arm); neither `stage-workflow.test.mjs` nor
  `skills/war/SKILL.md` mentions `--args`. The same gap leaves a latent resume hazard the issue
  names: a `resumeFromRunId` resume that does not re-pass `args` reaches entry with a falsy `args`,
  falls back to `{}`, and dies at the entry validation (missing derivation trio) despite a healthy
  journal — the embedded fallback closes it.
- **Submodule coverage gap (#1114, `skills/war/assets/workflow-template.js`).** Phase 1 of
  `2026-07-24-recovery-re-merge-dispatch-coherence` closed the `submodMergeNote` gap at the three
  MERGE-side retry dispatches (its §9 explicitly deferred every land-phase prompt), leaving three
  sibling gaps in adjacent dispatch families, all verified at tip:
  - **(a) Re-land dispatches.** `submodLandNote` — the `SUBMODULE PHASE` paragraph threading
    `targetRepo`/`targetBase` and the 2A/2B submodule-land procedure — is appended **only** to the
    initial `land:phase-<id>` prompt. The `land:phase-<id>:environment-proceed` and
    `land:phase-<id>:baseline-proceed` re-land prompts (both defined inside the same
    `if (landDecision === 'landed')` block, so the const is in scope) omit it: `grep -c
    submodLandNote` on the file returns 2 (definition + the one initial-land use). A submodule
    phase whose first land gate-fails recoverable is re-dispatched land-blind.
  - **(b) Polish merge.** The class-exempt phase-close polish merge (`merge:p<id>-polish`)
    instructs skipping `assert-test-in-diff.sh` AND `assert-packaging-in-diff.sh` ("a coherence
    sweep has no task fields to consult") and names **no** submodule floor at all — while
    `agents/war-refiner.md` step 6 declares the submodule-mutation check runs "**always**,
    regardless of `requiresTest`". Whether the polish merge should carry it was an unresolved
    design question; this spec resolves it (§3 row 4).
  - **(c) Floor-retry re-merge.** The floor-retry re-merge prompt (label
    `merge:<taskId>:floor-retry:r<round>`) carries the `requiresTest`/`requiresPackaging` floor
    ternaries and `submodMergeNote` but **omits the `assert-no-submodule-mutation.sh` invocation**
    — while the two adjacent engine comments (above the `FLOOR_STATUSES` declaration and above the
    retry dispatch itself) both claim "re-instructs ALL floor invocations (test + packaging +
    submodule)", and war-refiner.md step 6 says "always". A floor fix-worker's gitlink mutation
    could ride the retry merge unchecked — the scope hook does not gate the Bash write path
    (recorded lesson), so the floor is the only line.
- **Comment-arbiter gap (#1151, `skills/war/assets/workflow-template.js`).** The
  `classificationClause` header comment hand-enumerates its consumer sites in prose ("mirrored
  (per-site base) into the initial merge-task prompt, the floor-retry re-merge prompt, THE LAND
  PROMPT, and agents/war-refiner.md") — the exact shape that rotted for sibling
  `gateCaptureClause` (#1034) — with no drift-guard test as arbiter. The enumeration is verified
  **accurate today** (three call sites: initial merge-task, floor-retry re-merge, land), which is
  precisely when the guard is cheapest to add. `gateCaptureClause`'s repaired comment + its
  `captureUses` guard in `workflow-template.test.mjs` are the in-repo precedent and target shape.

## 2. Pivotal constraints

- **The Workflow sandbox cannot import and has no shell/fs.** Everything the staged script needs
  at entry must be a literal in its own bytes — the `EMBEDDED_ARGS` mechanism is stage-time
  substitution, never runtime file reading. `stage-workflow.mjs` stays Node-stdlib-only.
- **ADR 0037 staged-copy contract preserved.** Write-if-absent stays authoritative: an existing
  staged file IS the run's script (approved injected stages, journal-replay byte stability) and is
  never clobbered without `--force` — `--args` participates only when a write actually occurs.
  Byte-identical no-flag behavior: without `--args` the staged output is byte-identical to today's.
- **Fail-loud anchor discipline.** Every stage-time substitution goes through the exactly-once
  anchor mechanism (`replaceExactlyOnce`); the anchor bytes live once as an exported constant in
  `stage-workflow.mjs`, the anchor-guard test imports it (never a second hardcoded copy), and any
  coupling comment near the template's fallback stays **referential**, never restating the anchor
  bytes (restating them trips the exactly-once count — the meta-anchor comment discipline).
- **Injection ordering is a correctness invariant.** At real size the args payload (memory blocks,
  plan slices) can legitimately **quote template bytes** — including the anchors themselves and
  `: (args || {})`. All anchor substitutions and the fallback rewrite must run **before** the
  payload is injected into the text, so payload bytes can never perturb an exactly-once count.
- **ADR 0034 args-guard parity.** Stage-time validation mirrors the template's entry guard: the
  `--args` file must parse to a non-null, non-array JSON object, else a named non-zero exit
  **before** any file is written — a bad file dies at stage time, never mid-run.
- **Enum discipline (ADR 0005).** No new `MergeResult` status, no `HARD_ESCALATION_REASONS` or
  `KNOWN_LAND_DECISIONS` member, `land-decision.mjs` untouched. The two survey-derived routing
  corrections in §4.2 reuse existing members only (`reason: 'escalate'`, `held:submodule-pr`).
- **Split prompt surfaces / both-surfaces rule.** Dispatched prompts live in
  `workflow-template.js`; standing refiner instructions in `agents/war-refiner.md`. Checked at
  spec time: the standing card already covers everything this spec threads — its
  submodule-as-repo section states "All merge-task and land-phase steps below run with
  `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout" (generic over retries), and
  its step 6 declares the submodule-mutation check "always". Every #1114 fix makes the dispatched
  surface **converge on the standing claim**, so **no `agents/war-refiner.md` edit is needed** —
  this rationale is recorded so an auditor does not hold the commit for a missing mirror.
- **Tests discriminate on dispatched-prompt content by label, not source shape** — the repo's
  agent-stub capture harness, dispatch-label-keyed (the #1032 sibling tests are the template);
  a source-regex occurrence count proves shape, not what the engine dispatched. The one deliberate
  exception is the #1151 drift guard, whose entire job is to count source call sites.
- **Comment fixes must be rot-proof**: state the invariant count-free and name the drift-guard
  arbiter (the `gateCaptureClause` treatment), never re-enumerate.
- **The `captureUses` drift guard pins exactly 3 `gateCaptureClause` call sites.** Nothing here
  adds or removes one; that guard must stay green at 3. Likewise the new `classificationClause`
  guard pins 3 — the #1114 prompt appends add no classification site (the polish merge is
  class-exempt by design; the re-lands instruct "classify afresh in `gate_failure_class`" without
  carrying the full clause, per ADR 0040's bounded-retry shape).

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | Args-embedding vehicle (#1134) | (a) optional `--args <file>` on `stage-workflow.mjs`, embedding at stage time; (b) harness-side chunked args; (c) template reads a file at entry | **(a)** — the issue's operator-approved shape, mechanized. (c) is impossible (sandbox has no fs); (b) rebuilds harness plumbing WAR does not own. The stager already owns exactly-once template substitution; this is one more substitution pair. |
| 2 | Embedded-args precedence | (a) dispatched args win, embedded is the **fallback** (`args \|\| EMBEDDED_ARGS`); (b) embedded wins | **(a)** — matches the shipped hand edit, keeps small-args launches and every existing test byte-identical, and closes the resume hazard (absent args on resume ⇒ embedded). Caveat documented in SKILL.md: a dispatched `{}` is truthy and beats the embedded object — a launch that staged with `--args` dispatches **no** args. |
| 3 | Fallback-rewrite mechanism | (a) new exported anchor constant (`ARGS_FALLBACK_ANCHOR`, bytes `: (args \|\| {})`) + `replaceExactlyOnce`, prelude injected **after** all substitutions; (b) regex the ternary | **(a)** — the existing fail-loud idiom; regexes coupled to expression shape rot (recorded lesson: drift-guard site-discovery regex coupled to ternary terminator shape). Injection-last neutralizes payloads that quote anchor bytes (§2). |
| 4 | Polish-merge submodule floor (#1114 b — the design ruling) | (a) add the bare `assert-no-submodule-mutation.sh` invocation to the `merge:p<id>-polish` prompt; (b) rule the polish exempt and document | **(a)**. The skip rationale the prompt states for the test/packaging floors ("no task fields to consult") does not apply: the submodule floor is unconditional per war-refiner.md step 6 ("always"), needs no task fields, and guards a defect class the polish path cannot otherwise catch (a sweep worker's errant gitlink mutation passes the gate and can pass the panel; the Bash write path is unhooked). Zero routing change: any non-`merged` polish result already routes the fail-open DISCARD arm — the pre-polish tip lands unchanged. Always bare, never `--declared` (a coherence sweep is never a declared gitlink bump). |
| 5 | Re-land + floor-retry submodule mechanism (#1114 a, c) | (a) prose appends reusing the in-scope consts, mirroring the sibling sites' placement; (b) new helpers | **(a)** — the issue's suggested fix and the #1032 precedent. `submodLandNote` appended trailing both re-land prompts (mirroring the initial land); the floor-retry re-merge gains the compact environment-proceed-form floor sentence **with the gitlink-bump `--declared` conditional**. Mirror-with-eyes-open: re-verify each donor sentence rather than byte-copying (recorded lesson: a mirrored prompt inherits its donor's latent omission). |
| 6 | Floor-retry `submodule-blocked` routing (survey-derived) | (a) let it fall to the generic `reason: floorMr.status` fallback; (b) explicit arm mapping to the existing `reason: 'escalate'` | **(b)**. `'submodule-blocked'` is **not** in `HARD_ESCALATION_REASONS`, so (a) routes it SOFT — exactly the hazard the primary, environment-proceed, and baseline-proceed arms each guard against with an explicit `reason: 'escalate'` arm ("a soft escalation must never let a submodule touch ride a land"). Without (b), the (c) prompt fix would mint a reachable soft path for the exact defect it polices. Existing enum member; no cascade. |
| 7 | Re-land `submodule-pr` routing (survey-derived) | (a) leave it — falls to the `held:land-failed` else; (b) mirror the initial land's `status:'submodule-pr'` direct-return arm (`held:submodule-pr` + escalated entry carrying `pr_number`/`pr_remote`) on both re-land results | **(b)**. Appending `submodLandNote` to the re-lands makes a 2B PR-and-hold return newly reachable from them; (a) would mislabel it `held:land-failed` and lose the PR ref the Lead's gh-resume reads. `held:submodule-pr` is an existing `KNOWN_LAND_DECISIONS` member; the arm is a copy of the initial land's guard. |
| 8 | `classificationClause` comment repair (#1151) | (a) keep the enumeration, add a guard pinning it; (b) rewrite count-free naming a new drift guard as arbiter, guard added same commit | **(b)** — the resolution #1034 ratified for the sibling clause (recorded lesson: header comment delegates site count to drift-guard test instead of enumerating). (a) rots again on the next site change. The comment's per-site-base statement and the both-surfaces/`agents/war-refiner.md` mirror sentence stay — they are accurate and count-free. |
| 9 | #1151 guard shape | (a) source count anchored on the call name — `classificationClause\(refinery(?:Path\|LandPath),` — asserted `=== 3` with a message naming the sites; (b) label-keyed dispatch capture per site | **(a)**, deliberately (the §2 exception): the guard's job is arbitering the **source site list** the comment delegates; the anchor is the call name + first argument, the most rot-resistant bytes available (never a ternary terminator or trailing-context shape). Behavioral coverage of the clause's *content* already exists (the t1.8 precondition-marker test asserts it in the captured merge AND land prompts). |
| 10 | One spec or three | (a) one spec, one theme; (b) split #1134 out | **(a)** — the group is one theme (the engine's dispatch surfaces tell the truth: args deliverable at size, floors complete, comments arbitered). Natural decompose seam recorded in §8: #1134 is file-disjoint from #1114/#1151. |

## 4. Mechanics

### 4.1 `--args <file>` embedding (`skills/war/assets/stage-workflow.mjs`)

CLI grows one optional value-attached flag (usage string + header-comment CLI line updated in the
same commit):

```
node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId> [campaignOrdinal] [--force] [--args <file>]
```

- **Parse:** peel `--args` and its value token from `rest` before the positional split (the
  existing `--force` peel is boolean-only; `--args` removes two tokens). `--args` with a missing
  value ⇒ the named usage error, non-zero.
- **Validate (before any write):** read the file, `JSON.parse`, and require a non-null, non-array
  object — the ADR 0034 predicate, mirrored. Read failure, parse failure, or a scalar/array/null
  result ⇒ one named `stage-workflow:`-prefixed error on stderr, exit non-zero, no staged file
  written.
- **New exported anchor:** `ARGS_FALLBACK_ANCHOR` with the bytes of the template's string-arm
  fallback tail `: (args || {})` (verified exactly-once in the shipped template). The anchor-guard
  test imports it like the two meta anchors. A referential coupling comment is added beside the
  fallback in `workflow-template.js` (naming the stager + the guard as arbiter, never restating
  the bytes) and beside the constant in the stager — both-surfaces coupling, same commit.
- **Substitution order (the §2 invariant):** (1) the two existing meta-anchor substitutions;
  (2) when `--args` is present, `replaceExactlyOnce(staged, ARGS_FALLBACK_ANCHOR,
  ': (args || EMBEDDED_ARGS)')`; (3) **last**, prepend the prelude — a one-line provenance comment
  plus `const EMBEDDED_ARGS = <JSON.stringify(parsed)>` — to the top of the staged text. Payload
  bytes are injected only after every exactly-once count has run, so a payload quoting any anchor
  cannot fork the stage. (`JSON.stringify` output is valid JS source under ES2019's JSON-superset
  grammar — Node ≥ 24 and the harness's JSC both qualify; no re-escaping pass.)
- **Write-if-absent unchanged:** an existing staged file short-circuits before any `--args`
  processing exactly as today (path printed, exit 0) — re-embedding changed args is a deliberate
  restage via `--force`.
- **No-flag byte identity:** without `--args`, steps (2)–(3) never run; output is byte-identical
  to today's stager.

### 4.2 Submodule floor/note completion (`skills/war/assets/workflow-template.js`)

All edits are prompt prose + two small routing arms reusing existing members; no schema change
(`'submodule-blocked'` and `'submodule-pr'` are already in the `MERGE_RESULT` status enum).

1. **(a) Re-lands:** append `+ submodLandNote` as the final prompt segment of the
   `land:phase-<id>:environment-proceed` and `land:phase-<id>:baseline-proceed` dispatches,
   mirroring the initial `land:phase-<id>` prompt's trailing placement (the const is in scope —
   all three dispatches live inside the `if (landDecision === 'landed')` block). `submodLandNote`
   is `''` for non-submodule phases, so every existing non-submodule prompt stays byte-identical.
2. **(a′, survey-derived — row 7):** on **both** re-land results, add the `status ===
   'submodule-pr'` arm before the generic routing: push the escalated entry carrying
   `pr_number`/`pr_remote` and set `landDecision = 'held:submodule-pr'`, byte-mirroring the
   initial land's direct-return guard.
3. **(b) Polish merge:** append one sentence to the `merge:p<id>-polish` prompt instructing —
   before the `_refinery` merge step — the **bare** invocation
   `assert-no-submodule-mutation.sh <integrationBranch> <polishBranch>` (never `--declared`);
   exit 1 → return `{ mode: 'merge-task', status: 'submodule-blocked' }`, do NOT merge; exit 2 →
   `status: 'error'`. The prompt's existing test/packaging skip sentence and class-exempt prose
   stay; its "skip" rationale sentence must not be left implying *all* floors are skipped —
   reword minimally so the submodule floor is named as the one that still runs. No routing edit:
   both non-`merged` statuses already hit the fail-open DISCARD arm (pre-polish tip lands, queue
   demotes to follow-up).
4. **(c) Floor-retry re-merge:** insert the compact floor sentence — mirroring the
   environment-proceed re-merge's form, **with** the `taskType === 'gitlink-bump' && declared ?
   ' --declared' : ''` conditional — into the `merge:<taskId>:floor-retry:r<round>` prompt,
   placed before the `requiresTest` ternary (the donor site's ordering): exit 1 →
   `submodule-blocked`, do NOT merge; exit 2 → `error`.
5. **(c′, survey-derived — row 6):** in the floor-retry sub-loop's post-loop routing, add an
   explicit `floorMr.status === 'submodule-blocked'` arm that escalates with the existing
   `reason: 'escalate'` (detail naming the task + the floor-retry surface) and logs the audit
   entry — mirroring the primary submodule-blocked arm — so the result can never reach the soft
   `reason: floorMr.status` fallback.
6. **Comments made true, not edited:** the two adjacent comments claiming the retry re-instructs
   "ALL floor invocations (test + packaging + submodule)" become accurate once (c) lands —
   verified at implementation time, no edit (§4.4 survey item 2).

### 4.3 `classificationClause` arbiter (#1151 — `workflow-template.js` + `workflow-template.test.mjs`)

- **Comment:** rewrite the header enumeration count-free, in the spirit of (final wording is the
  implementer's): "classificationClause: the gate-failure classification PROCEDURE, mirrored
  (per-site base) into every dispatched prompt that must classify a gate failure — never
  enumerate the sites here: the classification-site drift guard in `workflow-template.test.mjs`
  is the arbiter of the site list. `agents/war-refiner.md` is the standing mirror (both-surfaces
  rule, same commit). `baseDesc` names the per-site classification base."
- **Guard:** one new assertion in `workflow-template.test.mjs`, sibling of `captureUses`:
  count `classificationClause\(refinery(?:Path|LandPath),` matches in the source and assert
  `=== 3`, with a message naming the three sites (initial merge-task, floor-retry re-merge, the
  land prompt) — adding or removing a site goes deliberately RED until the count and message are
  updated together. The anchor cannot match the definition (`const classificationClause =
  (refineryP,` has no call-paren immediately after the name).

### 4.4 Token sweeps + mandatory same-scope survey

Every grep below is a completeness **floor, not a ceiling** — after running it, hand-scan the
target file's same-scope tests and comments and list each straggler as a survey-derived
correction. Anchor every grep to the named files, never repo-root (the `.claude/worktrees/`
stale-duplicate trap).

- `grep -n "submodLandNote" skills/war/assets/workflow-template.js` — expect exactly 4
  post-change (1 definition + 3 uses: initial land, environment-proceed re-land,
  baseline-proceed re-land); 2 pre-change.
- `grep -n "assert-no-submodule-mutation" skills/war/assets/workflow-template.js` — expect
  exactly 5 dispatched-prompt sites post-change (initial merge, floor-retry, environment-proceed,
  baseline-proceed, polish merge); 3 pre-change.
- `grep -n "submodule-pr\|submodule-blocked" skills/war/assets/workflow-template.js` — every
  routing arm for each status must map to a hard/held route, never the generic soft fallback;
  read each hit in context.
- `grep -n "EMBEDDED_ARGS\|ARGS_FALLBACK_ANCHOR" skills/war/assets/stage-workflow.mjs skills/war/assets/stage-workflow.test.mjs skills/war/assets/workflow-template.js skills/war/SKILL.md`
  — post-change: stager (constant + prelude builder), test (imported anchor + cases), template
  (referential coupling comment only — the comment must NOT restate the anchor bytes), SKILL.md
  (launch prose). Pre-change: zero hits.
- `grep -n "ALL floor invocations\|all three\|floor-retry" skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs`
  — hunting stale floor-set enumerations; the #1034 stale phrase wrapped a line break, so grep
  short tokens and read hits in context, never full sentences.

**Survey performed at spec time — stragglers found and their dispositions:**

1. Floor-retry `submodule-blocked` would route SOFT via the `reason: floorMr.status ?? 'merge_failed'`
   fallback (`'submodule-blocked'` ∉ `HARD_ESCALATION_REASONS`) — **corrected** by §4.2.5 (row 6).
2. The two "ALL floor invocations (test + packaging + submodule)" comments at the floor-retry
   sub-loop are stale-versus-code today and become **true** once §4.2.4 lands — no edit;
   re-verify at implementation time.
3. A re-land returning `submodule-pr` (newly reachable once `submodLandNote` rides the re-lands)
   would fall to the `held:land-failed` else — **corrected** by §4.2.2 (row 7).
4. `agents/war-refiner.md` — no edit needed: step 6's "always" and the submodule-as-repo
   section's "all merge-task and land-phase steps" already state the target behavior; the
   dispatched surfaces converge on the standing card (§2 rationale, recorded for the auditor).
5. The `#236` land-status comment ("land statuses are only landed/land_stale/gate_failed/error/
   submodule-pr") stays accurate — no new land status is introduced.
6. The `MERGE_RESULT` schema and war-refiner.md's Return enumeration already carry
   `submodule-blocked`/`submodule-pr` — contract-legal, no edit.
7. The `captureUses` guard message ("ALL THREE dispatched merge sites") stays accurate — no
   `gateCaptureClause` site is added (the polish merge's evidence contract differs by design;
   the baseline-proceed omission is ADR 0040's documented shape).
8. Stale copies under `.claude/worktrees/` — outside every anchored sweep by design; never edited.

### 4.5 Launch-prose documentation (`skills/war/SKILL.md`)

Extend the per-phase staging paragraph (the "Stage the per-phase script first (ADR 0037)" prose):

- When the assembled phase args cannot ride the tool call at real size (the measured ~104.5 KB
  class: `args.memory` + verbatim plan slices + intent), write the assembled args JSON to
  `$MAIN/.claude/war/runs/<runId>/args-p<phase.id>.json` (sibling of the staged script; untracked
  via the same existing `.claude/` ensure-exclude — no new ignore machinery) and pass
  `--args <that file>` to the stager; then dispatch the staged script with **no** Workflow `args`
  (a dispatched `{}` is truthy and would beat the embedded fallback).
- Dispatched args, when passed, always win — the embedded object is strictly the absent-args
  fallback, so small-payload launches are unchanged.
- Resume note: a `resumeFromRunId` resume of an `--args`-staged script needs no re-passed args —
  the embedded fallback satisfies entry validation (the write-if-absent reuse of the staged copy
  already guarantees the resume sees the same embedded bytes).
- Re-embedding changed args requires a deliberate `--force` restage (write-if-absent otherwise
  reuses the existing staged file byte-untouched, `--args` ignored).

## 5. Surface changes

- `skills/war/assets/stage-workflow.mjs` — `--args <file>` flag: parse, ADR-0034-parity
  validation, `ARGS_FALLBACK_ANCHOR` export, fallback rewrite + injection-last prelude, usage +
  header-comment update (§4.1)
- `skills/war/assets/stage-workflow.test.mjs` — anchor-guard extension + the three-case `--args`
  suite + the payload-quotes-anchor-bytes case (§10.1–10.4)
- `skills/war/assets/workflow-template.js` — referential coupling comment at the args fallback
  (§4.1); two `+ submodLandNote` appends + two re-land `submodule-pr` arms + polish-merge floor
  sentence + floor-retry floor sentence + floor-retry `submodule-blocked` hard arm (§4.2);
  `classificationClause` header rewrite (§4.3)
- `skills/war/assets/workflow-template.test.mjs` — label-keyed dispatch-capture tests for the
  four prompt gains + routing tests for the two new arms (§10.5–10.7); the `classificationClause`
  site-count drift guard (§4.3)
- `skills/war/SKILL.md` — `--args` launch/resume prose (§4.5)

No `agents/*.md` edit (§2 / §4.4 item 4 record why), no `hooks/` surface, no `land-decision.mjs`
byte.

## 6. New domain terms (CONTEXT.md)

None required. "Embedded args" is a mechanism of the existing *staged copy* concept (ADR 0037),
not a new pipeline construct; "submodule floor", "polish merge", "re-land" are existing
vocabulary. (If `/war-machine` finds the term load-bearing in review, "embedded args — the
stage-time absent-args fallback baked into a staged per-phase script by `stage-workflow.mjs
--args`" is the candidate entry.)

## 7. Recommended ADRs

No new ADR. §4.1 is a mechanization of ADR 0037's staged-copy substitution (the staged copy was
already the sanctioned home for approved per-run divergence from the shipped template); §4.2
completes coverage under the existing ADR 0002/0005/0040 decisions; §4.3 is comment/test hygiene.

## 8. Open risks / implementation notes

- **Natural decompose seam:** #1134 (`stage-workflow.*` + `SKILL.md`) is file-disjoint from
  #1114/#1151 (both entirely inside `workflow-template.js` + `workflow-template.test.mjs`) —
  carve plan tasks on that boundary; #1114 and #1151 must not be parallel same-phase tasks (same
  files).
- **Prelude placement latitude:** prepending the prelude above the template's opening COUPLING
  comment is legal module JS and keeps injection trivially last; any placement satisfying
  "injected after all exactly-once substitutions" is acceptable.
- **`{}`-is-truthy footgun** (row 2): the fallback is `||`, deliberately matching the shipped
  hand edit; the SKILL.md prose (§4.5) is the guard. Do not "fix" it to a deep-merge or
  emptiness check — that would diverge resume-replay behavior from the operator-approved phase-1
  bytes.
- **Non-submodule byte-identity:** `submodLandNote`/`submodMergeNote` are `''` off the submodule
  path — existing non-submodule prompt tests must pass unmodified; treat churn there as a defect
  in the change.
- **Polish reachability for submodule phases** is untraced here (how the polish worktree roots
  for a submodule phase is its own question); the bare floor invocation is harmless when the
  route is unreached and correct when reached — do not let a reachability debate shrink row 4.
- **Issue line numbers have drifted** (the issues cite :223/:1360/:1832–1839/:1894/:1928/:1958
  measured at their filing tips); every edit site above is anchored by construct/label name.
- **`--args` value parsing:** keep it two-token (`--args <file>`), not `--args=<file>` — one
  shape, named usage error otherwise; do not describe the flag set with a blanket adjective in
  errors or blurbs (recorded lesson: a deny-string's uniform "=-attached" claim mismatched its
  mixed flag shapes).

## 9. Non-goals / deferred

- No harness-side args chunking, compression, or size cap — file embedding removes the inline
  ceiling; measuring a new ceiling (staged-file size) is deferred until observed.
- No `gateCaptureClause` addition to the baseline-proceed re-merge or the polish/land prompts —
  evidence contracts differ by design (ADR 0040; §4.4 item 7).
- No `classificationClause` threading into the re-land or polish prompts — the re-lands
  deliberately carry the compact "classify afresh" instruction (bounded retry, ADR 0040) and the
  polish merge is class-exempt (fail-open discard); this spec arbiters the existing site list,
  it does not grow it.
- No retro-edit of the shipped template's args-entry logic — the D8 parse guard, the ADR 0034
  object guard, and the entry validation are untouched; only the staged copy's fallback differs,
  and only under `--args`.
- No scope-hook/Bash-write-path hardening for the polish worker — the floor is the pre-merge
  line (ADR 0002 capability-first confinement is a separate surface).

## 10. Validation criteria

1. **No-flag byte identity (#1134):** staging the shipped template without `--args` produces
   byte-identical output to the pre-change stager — proven by the existing restore-roundtrip
   tests passing unmodified.
2. **Valid `--args` (#1134):** staging with a valid JSON-object file yields a staged script whose
   text (i) starts with the `EMBEDDED_ARGS` prelude carrying the payload, (ii) contains
   `: (args || EMBEDDED_ARGS)` and not the original fallback bytes, and (iii) restores to the
   shipped template when the three substitutions (two meta anchors + fallback) are reversed and
   the prelude stripped.
3. **Invalid `--args` (#1134):** a malformed-JSON file, and each non-object parse (array, scalar,
   `null`), exits non-zero with a named `stage-workflow:` error and writes no staged file;
   `--args` missing its value token exits non-zero with the usage error.
4. **Injection-order invariant (#1134):** an args file whose payload string-quotes the
   `NAME_ANCHOR` bytes and the `: (args || {})` bytes still stages cleanly (exactly-once counts
   unperturbed) — the discriminating case for §2's ordering constraint.
5. **Re-land + polish + floor-retry prompt gains (#1114):** label-keyed dispatch-capture tests —
   for a submodule-phase fixture, the prompts captured at `land:phase-<id>:environment-proceed`
   and `land:phase-<id>:baseline-proceed` carry the `SUBMODULE PHASE:` marker (colon-pinned) and
   the fixture's `targetRepo`; the `merge:p<id>-polish` prompt and the
   `merge:<taskId>:floor-retry:r<n>` prompt each carry `assert-no-submodule-mutation.sh` (the
   floor-retry's with the `--declared` conditional shape, the polish's bare). Discrimination
   proof: each assertion goes RED with its append mentally deleted.
6. **Routing arms (#1114, survey-derived):** a floor-retry re-merge stubbed to return
   `submodule-blocked` escalates with `reason: 'escalate'` (HARD — the phase does not land minus
   the task silently); a re-land stubbed to return `submodule-pr` yields
   `landDecision === 'held:submodule-pr'` with `pr_number`/`pr_remote` on the escalated entry.
7. **Fail-open polish routing unchanged (#1114):** a polish merge returning `submodule-blocked`
   routes the existing DISCARD arm (polishStatus `'discarded'`, queue demoted to follow-up, land
   proceeds on the pre-polish tip) — no new hold.
8. **Arbiter in place (#1151):** the new drift guard asserts exactly 3 `classificationClause`
   call sites and goes RED when one is added or removed; the header comment contains no
   consumer-site enumeration and names the guard as arbiter — checked by reading the comment
   block, not a single-line grep (the wrap trap).
9. **Sweeps + survey:** every §4.4 grep lands on its expected post-change count, and the §4.4
   survey items are re-confirmed at implementation time (the survey is the floor's ceiling — a
   new straggler becomes a survey-derived correction in the implementing task, not a silent skip).
10. **Enum + guard stability:** `git diff` shows no `land-decision.mjs` edit, no `MERGE_RESULT`
    status addition, no `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS` member; the
    `captureUses` guard still counts 3.
11. **Whole-suite green:** `node --test 'skills/**/*.test.mjs'` passes; the shipped
    `workflow-template.js` still stages cleanly through the extended anchor guard (all three
    anchors exactly-once).
