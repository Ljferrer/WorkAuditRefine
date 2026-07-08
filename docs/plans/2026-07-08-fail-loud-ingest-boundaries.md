# Fail-loud ingest boundaries — roadmap table parsing + 0-plan throw in the campaign ledger, envelope unwrap + zero-probe refusal in the red-team gate

Source spec: [2026-07-08-fail-loud-ingest-boundaries-design.md](../specs/2026-07-08-fail-loud-ingest-boundaries-design.md)
Issues: #585 (`campaign init --roadmap` silently parses a table-form roadmap to 0 plans, exit 0) · #587 (red-team gate false-CLEAREDs on the Workflow task-output envelope, `probes: 0`).

## Commander's Intent

- **Purpose:** two pipeline CLIs must fail loud, not falsely succeed, when handed an input shape they
  do not expect. `campaign init --roadmap` must parse the ratified roadmap table (every committed
  roadmap uses it) and must never write an empty ledger at exit 0 (#585); the red-team gate must
  accept the persisted Workflow task-output envelope and must never emit any verdict on a zero-probe
  input — a verification that did not run may not report a pass, the ADR 0017 spirit applied to the
  gate's own input (#587).
- **Method:** convert the spec's resolved tree A–G without re-litigating it, with the operator's two
  ratifications folded in (bulleted-link rows stay out of contract but the miss is made
  self-explaining; legacy spec-index roadmaps are accepted as out-of-contract and documented, with
  **no** path or `-design.md` suffix heuristic — target-repo-agnostic code must not carry this
  repo's naming conventions). #585 gets **both halves**: `resolveRoadmapPlans` learns the table
  form — the **first markdown-link target ending `.md` per table row** (link syntax is the
  precision mechanism; backticked doc paths in the Files-owned / contention cells are never
  extracted; bare-list form kept for back-compat, one pass, document line order) — **and** throws
  on a 0-plan parse inside `resolveRoadmapPlans` itself (the single choke point; `init` already
  calls it before `mkdirSync`/`writeLedgerAtomic`, so no empty ledger or campaign dir is ever
  created; the CLI propagates the throw as a non-zero exit, same idiom as the mode-validation
  throw). #587 gets an exported **`unwrapEnvelope(parsed)`** (one `.result` level only; a top-level
  `probeResults` always wins) applied in `main()` right after `JSON.parse`, **and** an
  unconditional zero-probe refusal in `main()` after `results` is computed (stderr diagnostic
  naming the task-output-envelope mistake, exit 1, **no verdict on stdout**) — safe because a
  legitimate zero-probe input does not exist: `workflow-scaffold.js` returns at least one probe
  result or `dropped` marker per expected probe (≥ 4 spine probes even after the
  `sourceSpec: 'none'` filter drops `coverage-vs-source` and a non-runnable plan drops
  `executable-proof`), so an empty probe set is always a wrong shape. The pure exported functions
  (`verdict`/`classify`/`classifyCoverage`/`isIncomplete`/`summarize`/`isOnTarget`/`dedupe`/
  `allFindings`) stay byte-untouched. Prose moves with the code in the same commit: the
  `resolveRoadmapPlans` docstring, the gate's CLI usage comment, and `skills/red-team/SKILL.md`
  step 4 (that step's "pipe the **entire returned object**" wording is what steers operators into
  the trap). Fixtures become truth: the test `ROADMAP` const becomes the canonical table form (the
  bare-list form it currently codifies is exactly how #585 stayed green); the gate test gains
  envelope-shaped CLI fixtures. The two fixes are file-disjoint tasks in one phase —
  parallelizable by design.
- **End state:**
  1. **Table ingestion:** `campaign-ledger.test.mjs` — `init` from a canonical-template table
     roadmap (two `[slug](../plans/<file>.md)` rows, roadmap under a `roadmaps/` fixture subdir so
     the `../plans/` targets exercise the real resolution) yields both plans, queued, in row order;
     the fixture contains **no bare-list lines** (delete-the-feature: removing the table extractor
     turns this test into the 0-plan throw).
  2. **Extraction precision:** a fixture row whose Files-owned cell carries a backticked `.md` doc
     path that **exists on disk in the fixture tree** (so mis-ingestion would not even ENOENT)
     ingests only the Plan-column link target — exactly 2 plans, neither the decoy.
  3. **Back-compat:** the current bare numbered-list roadmap fixture still parses to the same ledger
     shape, as its own named test.
  4. **Fail-loud, no side effects:** `init` from a prose-only roadmap throws with the roadmap path,
     both accepted forms, **and the bulleted-markdown-link form named as unaccepted** in the
     message, and afterward **neither `ledger.json` nor the campaign dir exists**; a roadmap whose
     only plan references are bulleted markdown links (`- [slug](../plans/x.md)`) also throws the
     same 0-plan error; the CLI `init --roadmap` path exits non-zero on the same inputs.
  5. **Envelope unwrap (unit):** exported `unwrapEnvelope` returns `.result` for the harness
     envelope shape; returns the input unchanged for a direct object, an array, an object with
     top-level `probeResults` (top level wins over `.result`), and an envelope whose `.result` is
     not an object-with-`probeResults` (falls through to the floor).
  6. **False-CLEARED repro inverted (CLI):** piping an envelope wrapping the full scaffold return
     shape (`{ result: { plan, repo, fingerprint, provision, expected, probeResults } }`) with one
     `status: "fail"` Critical probe whose `read_anchor` matches the fingerprint and with
     `expected` matching the probe count through `red-team-gate.mjs --stdin` yields verdict
     `BLOCKED` with that probe counted (`summary.probes` ≥ 1) — the fixture fidelity is
     load-bearing: a missing/invalid anchor or `ran < expected` yields `INCOMPLETE`, not `BLOCKED`.
     A second named case proves the coverage-null back-compat path: a fingerprint-less,
     `expected`-less envelope carrying the same failing probe is still `BLOCKED`.
  7. **Zero-probe refusal (CLI):** piping `{}`, `{ "result": {} }`, and `[]` via `--stdin` each
     exits non-zero with a stderr message naming the zero-probe input and the
     task-output-envelope mistake; stdout carries no verdict; one additional case feeds a
     zero-probe input via the **file argument** (not `--stdin`), proving the refusal is
     input-mode-independent. These assertions fail (exit 0, `CLEARED`) if the refusal is removed.
  8. **Preserved contracts:** both existing suites pass with only the fixture/test changes named
     here; `verdict CLEARED on no findings` (findings-level) untouched; every currently-exported
     gate function byte-untouched; `workflow-scaffold.js` + `workflow-scaffold.test.mjs`
     byte-untouched and green; pre-fix ledgers already on disk with `plans: []` remain fully
     functional (the throw is init-time only).
  9. **Prose surfaces:** `skills/red-team/SKILL.md` step 4 names both accepted input shapes, the
     automatic one-level `.result` unwrap, and the zero-probe refusal — locked by a token-anchored,
     case-tolerant test (`task-output`, `.result`, `zero-probe`/`0 probe`); the `resolveRoadmapPlans`
     docstring states both forms, the fail-loud contract, and the documented ceilings
     (first-link-per-row; bulleted-link rows unaccepted; legacy spec-index roadmaps out of
     contract); the gate CLI usage comment states the three accepted shapes + the exit-1 refusal.
  10. All four release slots carry the same new version; full gate green at the landing tip.

## Build order (for /war)

Phase 1 (two parallel, file-disjoint tasks — one per issue, one wave) → Phase 2 (release).

## Phase 1 — Fail-loud ingest boundaries

### Task 1: campaign ledger — roadmap table parsing + 0-plan throw (#585)

- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: spec §4 (campaign-ledger halves), decisions A/B/C/F/G, operator ratifications 2–3.
  - **`resolveRoadmapPlans(roadmapPath)` — single pass over lines, two matchers, document line
    order:** (1) the existing bare-list regex `/^\s*(?:\d+[.)]|-)\s+(\S+\.md)\s*$/`, unchanged;
    (2) a **table row** — a line matching `/^\s*\|/` (leading-whitespace-tolerant) — contributes
    the target of its **first** markdown link whose target ends `.md` **immediately before the
    closing paren** (`[text](<target>.md)`, target whitespace-free — so `<file>.md#anchor` and
    non-`.md` targets simply don't match, per spec §8), if any. Header and separator rows need no
    dedicated skip — they carry no links, so the link requirement is the structural/defensive
    filter; tests lock the behavior, not the prose. Both matchers resolve against
    `path.dirname(roadmapPath)` (the existing `path.resolve(roadmapDir, …)` — `../plans/<file>.md`
    resolves correctly). **Never** extract bare or backticked tokens from cells; `isPathShaped`
    adds no discrimination here (any dot-suffixed token passes it) — the link syntax is the whole
    precision mechanism (spec B). A bulleted markdown link (`- [slug](../plans/x.md)`) matches
    **neither** matcher — out of contract by operator ratification; the throw and docstring make
    the miss self-explaining.
  - **0-plan throw (spec C + ratification 2):** at the end of the pass, if 0 plans were parsed,
    throw with a message naming `roadmapPath`, both accepted forms, **and the
    bulleted-markdown-link form as unaccepted** (illustrative shape: `0 plans parsed from
    <roadmapPath> — expected a plan-index table ([slug](../plans/<file>.md) rows) or bare
    bulleted/numbered .md path lines; bulleted markdown links (- [slug](file.md)) are not an
    accepted form`; the token contract is `0 plans` + the path + both accepted forms + the
    unaccepted bulleted-link form; bytes are free). The locus inside `resolveRoadmapPlans` covers
    its only caller (`init`) at the choke point; **no code motion needed** — `init` already calls
    it before `mkdirSync`/`writeLedgerAtomic` (verified at tip), so the throw precedes any write,
    and the CLI `init` case propagates it as an uncaught non-zero exit exactly like the existing
    mode-validation throw.
  - **Docstring** above `resolveRoadmapPlans` rewritten (same commit — lesson
    `source-comment-lags-emitted-prompt-after-rewrite`): both accepted forms, the fail-loud
    contract, and three **documented ceilings with triggers**: (a) first-link-per-row — a future
    `.md` link in a non-Plan column *before* the Plan column, or links instead of backticks in the
    contention table, would mis-ingest (the ratified template makes the Plan column the only
    linked cell); (b) bulleted-markdown-link lines are not an accepted form (operator-ratified);
    (c) **legacy spec-index roadmaps are out of contract** — the 2026-06-26 / 2026-06-30 style
    roadmaps whose Plan column links `../specs/*.md` would seed a campaign of spec files; the
    contract is *"the Plan column links plans"*, and deliberately **no** path or `-design.md`
    suffix heuristic discriminates (target-repo-agnostic code must not carry this repo's naming
    conventions) — such over-ingestion surfaces via the existing backstops
    (`assertOrderable`'s unparseable-footprint throw, since specs carry no `Files:` block, or
    `extractFilesFromPlanFile`'s ENOENT). The stale "this reads a simple numbered/bulleted index
    list of paths" sentence is gone.
  - **No other export changes:** `init`, `sweep`, `assertOrderable`, `extractFiles`,
    `isPathShaped`, all CLI cases untouched. A rotted link target still fails loud downstream via
    `extractFilesFromPlanFile`'s ENOENT — existing backstop, unchanged.
  - **Tests (End-state 1–4):** the `ROADMAP` const becomes the canonical table (template row shape
    `| n | [slug](../plans/<file>.md) | <cells> | v0.x.y | — |` with header + separator rows;
    roadmap written under `<tmp>/roadmaps/`, plans under `<tmp>/plans/`; one Files-owned cell
    carries a backticked decoy `.md` path **created on disk** in the fixture tree; zero bare-list
    lines). The existing `init from a roadmap file produces the same ledger shape` test is
    repointed to it and **retitled** (lesson `relaxed-assertion-test-title-must-update-together`),
    asserting 2 plans, row order, resolved paths. New tests: extraction-precision (decoy never
    ingested — exactly 2 plans); bare-list back-compat (current `ROADMAP` body renamed
    `ROADMAP_BARE_LIST`, its own test); mixed-form roadmap (one table row + one stray bare-list
    line → both ingested, document line order — locks the one-pass/line-order claim);
    bulleted-link-only roadmap (`- [slug](../plans/a.md)` lines only) → the 0-plan throw
    (behaviorally locks ratification 2); 0-plan prose-only roadmap → `assert.throws`
    message-matched on `/0 plans/` **and** the roadmap path (a bare `assert.throws` is vacuous
    here — `assertOrderable` also throws), then `fs.existsSync(campaignDir) === false`; CLI
    `init --roadmap <prose-only>` (via the existing `cli()`/`execFileSync` idiom, catching the
    non-zero exit) → exits non-zero, no campaign dir.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: red-team gate — envelope unwrap + zero-probe refusal + step-4 prose (#587)

- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`, `skills/red-team/SKILL.md`
- Plan slice: spec §4 (red-team halves), decisions D/E/F, plus the step-4 prose per F.
  - **`unwrapEnvelope(parsed)` (spec D), new exported pure helper** placed with the other pure
    helpers (beside `allFindings`/`normalizeTitle`): return `parsed.result` **iff** `parsed` is a
    non-null, non-array object **without** its own `probeResults` array whose `.result` is a
    non-null, non-array object **with** a `probeResults` array; otherwise return `parsed`
    unchanged. **One level only** (the harness nests exactly one `.result`); a direct top-level
    `probeResults` always wins (unwrap only when the direct read would find nothing); a `.result`
    that is an array or lacks `probeResults` does not unwrap — it falls to the zero-probe floor.
    Detection is shape-keyed, not schema-keyed: if the harness ever renames `.result` or nests
    deeper, the unwrap misses and the floor catches it loudly — the two layers are deliberately
    independent.
  - **`main()`:** apply the unwrap immediately after the `JSON.parse` try/catch
    (`parsed = unwrapEnvelope(parsed)`); the four existing shape reads (`results`/`fingerprint`/
    `repo`/`expected`) then run unchanged against the unwrapped payload, so coverage accounting
    engages as designed. **Zero-probe refusal (spec E):** directly after `const results = …`, if
    `results.length === 0` → write a stderr diagnostic (distinct message from the invalid-JSON
    exit; tokens: zero probe results / refusing to emit a verdict / the task-output envelope's
    `.result` named as the likely cause, noting the gate already unwraps one level) and
    `process.exit(1)` with **nothing on stdout**. Not in `verdict()` (it sees findings, not
    probes — its `[]` semantics are a pure-function contract) and not via coverage (`0 < 0` can
    never trip INCOMPLETE). The refusal is unconditional and mode-independent (it sits below both
    the `--stdin` and file-argument reads) — it also catches the empty top-level array, the wrong
    file, a truncated object, an object with no `probeResults` at all. It is safe because a
    legitimate zero-probe input does not exist: the scaffold returns at least one probe result or
    `dropped` marker per expected probe (≥ 4 spine probes after the `sourceSpec: 'none'`
    `coverage-vs-source` filter and the non-runnable-plan `executable-proof` removal).
  - **CLI usage comment** (the `--- CLI ---` block) updated in the same commit: accepted shapes are
    `[...probeResults]`, `{ probeResults: [...] , ... }`, or a task-output envelope
    `{ result: { probeResults: [...] } }` (one level, auto-unwrapped); zero probes → exit 1, no
    verdict.
  - **Byte-untouched:** `verdict`/`classify`/`classifyCoverage`/`isIncomplete`/`summarize`/
    `isOnTarget`/`dedupe`/`allFindings`/`normalizeTitle`, `BLOCKER_SEVERITIES`, the
    `invokedDirectly` guard. `workflow-scaffold.js` untouched (its return shape is already
    correct).
  - **`skills/red-team/SKILL.md` — step 4 in `## Steps` only:** rewrite the opening "Pipe the
    **entire returned object** …" sentence to state the gate accepts **either** the Workflow's
    returned object **or** the persisted task-output file (the envelope: payload under one
    `.result` level, unwrapped automatically; a top-level `probeResults` wins) **and** refuses to
    emit a verdict on a zero-probe input (exit 1, stderr diagnostic — fail-closed). The rest of
    step 4 (INCOMPLETE semantics, status-aware classification) and every other section untouched —
    merge adjacency with the diagnosis-preflight plan, see Notes.
  - **Tests (End-state 5–9):** unit tests for `unwrapEnvelope` per End-state 5 (five cases). New
    CLI-level tests — the only layer where `main()`'s refusal is observable — via
    `spawnSync(process.execPath, [<abs gate path from import.meta.url>, …], { input, encoding:
    'utf8' })`, cwd-independent per repo test conventions (the `invokedDirectly` realpath guard
    already supports direct invocation): (a) the #587 repro inverted at **full fixture fidelity**
    — an envelope wrapping the complete scaffold return shape with `fingerprint`, `expected`
    matching the probe count, and one `status: "fail"` Critical probe whose `read_anchor` matches
    the fingerprint → exit 0, stdout verdict `BLOCKED`, `summary.probes` ≥ 1 (fidelity is
    load-bearing: an invalid anchor or `ran < expected` yields `INCOMPLETE`, not `BLOCKED`; the
    case fails if the unwrap is removed, since the refusal's exit 1 breaks the `BLOCKED`
    assertion); (b) the **coverage-null back-compat variant** — the same failing probe in an
    envelope whose payload carries neither `fingerprint` nor an integer `expected` → still
    `BLOCKED`; (c)–(e) `{}`, `{ "result": {} }`, `[]` via `--stdin` → non-zero exit, stderr
    matches the zero-probe token, stdout contains no `"verdict"` (each reverts to exit-0 `CLEARED`
    if the refusal is removed); (f) one zero-probe input fed via the **file argument** instead of
    `--stdin` → same refusal (mode-independence). **Step-4 doc lock** in the same test file,
    following `campaign-ledger.test.mjs`'s existing read-the-SKILL.md-from-repoRoot idiom:
    SKILL.md carries case-tolerant, mid-sentence-anchored tokens `task-output`, `.result`, and
    `/zero[- ]probe|0 probes?/i` (lesson `prompt-only-clause-grep-guard-must-tolerate-sentence-case`;
    never full-line bytes — `shared-string-constant-quote-literal-byte-anchor-fragility`). All
    existing pure-function tests byte-untouched.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 1: version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, README `## Status` (replace-in-place, no badge) — all four slots, one
  version, **resolved as the next free patch from the slots at land time** (0.14.10 at authoring;
  any literal is non-authoritative — sibling campaign plans bump the same slots first if they land
  first). Blurb: fail-loud ingest boundaries — `campaign init --roadmap` now parses the ratified
  plan-index table (markdown-link targets; bare-list kept for back-compat) and throws on a 0-plan
  parse before any write, so a mis-parsed roadmap can no longer seed an empty campaign at exit 0;
  the red-team gate auto-unwraps the Workflow task-output envelope (one `.result` level) and
  refuses to emit any verdict on a zero-probe input, closing the false-CLEARED/`probes: 0`
  fail-open. Phrase without quoting retired literals (lesson
  `release-blurb-describing-a-rename-trips-the-renames-own-absence-guard` — no token retirements
  here, but keep the blurb free of the old docstring sentence).
- requiresTest: false — version-slot edit, no logic surface
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live roadmap seed (spec §10.10a): `campaign-ledger.mjs init --roadmap
  docs/roadmaps/2026-07-07-target-agnostic-and-diagnosis-roadmap.md` seeds exactly its two plans,
  queued in row order · why deferred: binding a unit test to a specific committed roadmap doc rots
  when that doc is archived; the tmp fixtures mirror its exact row shape instead · runner: the next
  live `/war-campaign` invocation that seeds from a roadmap, operator-observed.
- Live persisted-envelope gate (spec §10.10b, extended): a live `/red-team` run whose Lead pipes
  the persisted task-output file through the gate gets a true verdict, never
  `CLEARED`/`probes: 0` — **including capturing one real persisted task-output file and confirming
  the unwrap fires on it** (the in-repo envelope fixtures are synthesized against the
  issue-#587-attested shape; no persisted task-output file exists in-repo to fixture from) · why
  deferred: requires the real Workflow harness's task-output persistence — the CLI fixtures
  reproduce the envelope shape, not the harness writing it · runner: the next live `/red-team`
  invocation.

## Notes / conscious deviations

- **Re-anchored against post-#602 master (v0.14.10):** the spec was authored pre-PR-#602; every
  quoted construct was re-verified at the current tip — `resolveRoadmapPlans`'s regex and its
  parse-before-write position in `init`, `main()`'s `Array.isArray(parsed) ? parsed :
  (parsed.probeResults || [])` read, step 4's "entire returned object" sentence — all present,
  unchanged. No drift affects the spec.
- **Spec's "≥ 6 spine probes" corrected (false code-fact — do not propagate):** at master,
  `workflow-scaffold.js` filters `coverage-vs-source` when `sourceSpec` is `'none'` and directs
  removing `executable-proof` for a plan with no runnable artifacts, so the spine floor is **4**,
  not 6. The zero-probe refusal's safety argument is restated accordingly: the scaffold always
  returns ≥ 1 probe result or `dropped` marker (≥ 4 spine probes after filtering) — a zero-probe
  input remains always-wrong-shape; the refusal's justification survives the correction intact.
- **Merge adjacency, not dependency (spec §2):**
  `docs/plans/2026-07-07-diagnosis-preflight-self-confound-gate.md` (merged to master,
  **unexecuted**) inserts a new `## Diagnosis pre-flight` section into `skills/red-team/SKILL.md`
  between `## Backstop-legitimacy check` and `## Invariants (never violate)`, and appends one
  sentence to `workflow-scaffold.js`'s `confirmStage` string. This plan touches step 4 in
  `## Steps` and `red-team-gate.mjs` — files/constructs that plan never touches (verified: it
  never edits `red-team-gate.mjs`). Disjoint constructs; whichever executes second rebases
  trivially. **No ordering edge.**
- **Roadmap contention (for the campaign roadmap this plan rides in):** this plan is
  **version-serialized only** against its two survey siblings
  (`2026-07-08-war-run-lifecycle-robustness`, `2026-07-08-servitor-learnings-write-path`) — no
  content edge, queue position free. Contention rows the roadmap will carry: the three release-slot
  files × all three plans (strict serial at land, version resolved from the slots each time), and
  `skills/red-team/SKILL.md` vs the **unexecuted** diagnosis-preflight campaign (adjacency only,
  no edge). This plan's subsystems (`skills/war-campaign/`, `skills/red-team/`) are otherwise
  disjoint from both siblings; it adds **no ADR** and **no CLAUDE.md/CONTEXT.md edit** (spec
  §6/§7: none needed — the fail-closed posture is already doctrine in spirit), so it does not
  contend on the floating ADR number.
- **Bulleted-link rows stay out of contract (operator decision 2):** `- [slug](../plans/x.md)`
  matches neither matcher — the bare-list regex requires the line's sole content to be a path, and
  the line is not a table row. Rather than widen the contract, the 0-plan throw message and the
  docstring ceiling name the form as unaccepted, so the miss is loud and self-explaining; a
  bulleted-link-only fixture locks the behavior.
- **Legacy spec-index roadmaps: accept + document (operator decision 3):** the
  2026-06-26 / 2026-06-30 roadmaps link `../specs/*.md` in their Plan column (verified at tip); a
  campaign seeded from one would ingest spec files. The contract is "the Plan column links plans";
  those roadmaps are out of contract, documented in the docstring ceiling. Deliberately **no**
  path or `-design.md` suffix heuristic — target-repo-agnostic code must not carry this repo's
  naming conventions. Over-ingestion surfaces via the existing backstops: a spec has no `Files:`
  block, so `assertOrderable` throws unparseable-footprint (or `extractFilesFromPlanFile` ENOENTs
  on a rotted target).
- **Pre-fix empty ledgers stay functional; the explicit-empty-`--plans` deferral is load-bearing
  (spec §9):** ledgers already on disk with `plans: []` keep working — `next` returns `null`,
  `sweep`/`add` operate normally; the new throw fires only at roadmap-parse time inside `init`, so
  no migration or warning path is needed. `init` from an explicit empty `--plans` list still
  succeeds by design: it has a conceivable legitimate flow (seed empty, `add`+`sweep` later) **and**
  the existing suite uses `init(campaignDir, { plans: [], mode: 'stack' })` as a fixture idiom in
  roughly eight tests — throwing there would break them for no defect. Kept deferred; say why is
  here.
- **Envelope fixtures are synthesized evidence:** no persisted task-output file exists in-repo;
  the fixtures mirror the envelope shape attested in issue #587 (the scaffold's return object
  under one `.result` level). The extended live-gate backstop captures a real persisted file and
  confirms the unwrap fires on it.
- **`skills/war-campaign/SKILL.md` untouched (verified):** it names the roadmap as an ingestible
  input but makes no format claim anywhere — nothing to update.
- **`[]` added as a zero-probe CLI case** — spec §10.7 names `{}` and `{ "result": {} }`; the
  refusal is unconditional (spec E: "the probe-result set is empty"), so the empty top-level array
  is the same class. One extra assertion.
- **Mixed-form roadmap test added** — spec B says "list lines and table rows through one pass" with
  queue order = document line order; a test locks that claim rather than leaving it implicit.
- **Step-4 doc lock lives in `red-team-gate.test.mjs`, not a new shell test** — the
  read-repo-docs-from-a-`.test.mjs` idiom is precedented in `campaign-ledger.test.mjs` (its
  SKILL.md frontmatter scan), and colocating the lock with the code whose prose it guards keeps
  Task 2 self-locking and the task file-disjoint from Task 1. The existing
  `manifest-provenance.test.sh` locks step-3 provision tokens only (verified) — no collision.
- **Throw/stderr message bytes are illustrative; tokens are the contract** — `0 plans` + roadmap
  path + both accepted forms + the unaccepted bulleted-link form (ledger); zero-probe +
  `.result`/task-output hint (gate). Tests match tokens, never full-line bytes.
- **Over-ingestion is out of scope by design (spec §8):** the 0-plan throw guards under-ingestion
  only; a mis-ingested existing doc path would surface downstream via `assertOrderable`'s
  unparseable-footprint throw or ENOENT — existing backstops. The precision decoy test plus the
  docstring ceilings are the guards this plan adds.
- Anchor everything by named construct (`resolveRoadmapPlans`, `ROADMAP`/`ROADMAP_BARE_LIST`,
  `unwrapEnvelope`, `main`, the `--- CLI ---` comment block, step 4 in `## Steps`) — never line
  numbers.
- Version literal non-authoritative; resolve the next free patch from the four slots at land time.

## Open decisions

None — the operator ratifications (intent confirmed; bulleted-link rows out of contract with a
self-explaining miss; legacy spec-index roadmaps accepted + documented with no suffix heuristic)
and the grill folds (spine-floor correction to ≥ 4, full-fidelity BLOCKED fixture + coverage-null
variant, synthesized-evidence labeling + extended live backstop, the file-arg mode-independence
case, pinned row/link predicates with the header-skip marked structural, the empty-plans
back-compat rationale, and the roadmap contention note) are all folded above; see Notes.
