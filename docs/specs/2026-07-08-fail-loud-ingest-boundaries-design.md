# Fail-loud ingest boundaries — roadmap parsing in the campaign ledger, envelope input in the red-team gate

Source: `/survey-corps` 2026-07-08, issue group "silent ingest degradation". Not yet a plan —
convert with `/war-strategy`, then validate with `/red-team`.

**Issues addressed: #585 · #587.**

Neither ask has landed on master — both defects reproduce at the current tip (verified in this
survey pass). One defect class, two subsystems: a pipeline CLI receives an input shape it does not
expect and degrades **silently into a false success** instead of failing loud. For a queue-seeding
tool the false success is an empty campaign; for a verification gate it is a false `CLEARED` — the
fail-open direction, the worst possible failure mode for that tool.

## 1. Context — the gap / problem

1. **`campaign init --roadmap` silently yields 0 plans on every real roadmap (#585).**
   `resolveRoadmapPlans` in `skills/war-campaign/assets/campaign-ledger.mjs` matches only bare
   bulleted/numbered lines whose sole content is a `.md` path
   (`/^\s*(?:\d+[.)]|-)\s+(\S+\.md)\s*$/`). But the **ratified roadmap template**
   (`skills/war-strategy/SKILL.md` §2, locked by its structure test) expresses the plan index as a
   markdown **table** — `| 1 | [<slug>](../plans/<file>.md) | <file family> | v0.x.y | — |` — and
   every roadmap in `docs/roadmaps/` (all five) uses that table form. Table rows never match the
   regex, so `init()` resolves 0 plans, `assertOrderable([])` is vacuous (its loop body never runs),
   and a **valid ledger with `plans: []` is written at exit 0**. The operator believes the campaign
   seeded; the failure surfaces only when `next` returns nothing. The test fixture (`ROADMAP` const
   in `campaign-ledger.test.mjs`) codifies the wrong (bare-list) format, so the suite is green while
   the tool cannot parse its own house artifact. The parser's own docstring ("this reads a simple
   numbered/bulleted index list of paths") states the stale contract.
2. **`red-team-gate.mjs` returns a false `CLEARED` on the Workflow task-output envelope (#587).**
   The gate's `main()` reads `const results = Array.isArray(parsed) ? parsed : (parsed.probeResults
   || [])` and reads `fingerprint`/`repo`/`expected` from the top level. But the Workflow harness
   persists `workflow-scaffold.js`'s returned object (`{ plan, repo, fingerprint, provision,
   expected, probeResults }`) under a task-output **envelope's `.result`**. Piping that file
   as-documented reads all four fields absent: `results = []`, `coverage = null` (neither
   fingerprint nor an integer `expected`), `classify([])` is empty, and `verdict([], null)` prints
   **`CLEARED` with `probes: 0`** — reproduced at tip with an envelope containing a
   Critical-failing probe. `skills/red-team/SKILL.md` step 4's prose ("pipe the **entire returned
   object**") steers the operator directly into the trap: the in-conversation returned object works,
   the persisted artifact of that same object does not, and nothing distinguishes them at the gate.

Common shape: both CLIs have exactly one ingest boundary, both already own the machinery to do the
right thing (`campaign-ledger.mjs` has anchored extraction helpers; the gate has fail-closed
`INCOMPLETE` coverage accounting — which never engages because the empty parse precedes it), and
both exit 0 on the unexpected shape.

## 2. Pivotal constraints

- **The dangerous direction is fail-open.** Every remedy must turn the unexpected-shape path into a
  throw / non-zero exit, never a warning line beside a success payload. For the gate this is the
  ADR 0017 spirit applied to its own input: a verification that did not actually run may not report
  a pass.
- **The roadmap template is ratified; the parser adapts to it, never the reverse.** The plan-index
  table shape in `skills/war-strategy/SKILL.md` §2 is locked by the war-strategy structure test and
  used by all five committed roadmaps. #585 is a parser defect, not a template defect.
- **Precision hazard in table extraction.** Roadmap tables carry non-plan `.md` tokens — the
  "Files owned" column and the shared-file-contention table list backticked doc paths like
  `skills/war/SKILL.md` that exist on disk and would not even fail ENOENT if mis-ingested.
  Extraction must key on the **markdown-link syntax** the template reserves for plan references,
  never on any `.md`-suffixed token in a cell.
- **Back-compat for the bare-list form.** The list format is the documented legacy contract and the
  current fixture; existing external roadmaps in that form must keep parsing. Adding the table form
  is additive.
- **Gate semantics for real inputs are untouched.** `verdict`/`classify`/`classifyCoverage`/
  `isIncomplete` are pure exported functions with an existing test contract (including
  `verdict CLEARED on no findings` — findings, not probes); the envelope fix and the zero-probe
  refusal live at the CLI ingest boundary and must not change any exported function's behavior on a
  genuine probe set.
- **A legitimate zero-probe gate input does not exist.** `workflow-scaffold.js` always runs the six
  spine lenses and returns `expected: allProbes.length`; a dropped probe still yields a
  `{ probe, dropped: true }` marker. An input with zero probe results is therefore always a wrong
  shape, so an unconditional refusal is safe.
- **Merge adjacency, not dependency:** `docs/plans/2026-07-07-diagnosis-preflight-self-confound-gate.md`
  (merged to master, unexecuted) inserts a new section into `skills/red-team/SKILL.md` (between
  `## Backstop-legitimacy check` and `## Invariants (never violate)`) and appends one sentence to
  `workflow-scaffold.js`'s `confirmStage` string. This spec's red-team edits touch `## Steps` step 4
  and `red-team-gate.mjs` — a file that plan never touches. Disjoint constructs; whichever lands
  second rebases trivially. Record the adjacency in the campaign roadmap's shared-file-contention
  table if both are in flight; **no sibling-spec dependency**.
- **File-disjoint remedies.** The #585 surface (`skills/war-campaign/`) and the #587 surface
  (`skills/red-team/`) share no files — the future plan's tasks are parallelizable within a phase.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. #585 remedy shape** | **Both halves, not either**: extend `resolveRoadmapPlans` to parse the ratified table form **and** fail loud (throw) on a 0-plan parse. Extension alone leaves the next format drift silent; fail-loud alone leaves every canonical roadmap unusable (operators forced back to explicit `--plans`). |
| **B. Table-extraction precision** | Key on **markdown-link targets ending `.md` inside table rows** (lines starting `\|`, skipping header/separator rows): take the **first** such link target per row — the template's Plan column is the leftmost (and only) link; "Files owned" and contention-table cells use backticks, not links. Resolve targets against the roadmap's directory (existing `path.resolve(roadmapDir, …)` semantic; `../plans/<file>.md` resolves correctly). `isPathShaped` adds no discrimination for a `.md`-suffixed link target (any dot-suffixed token passes it) — the link syntax is the precision mechanism; do not extract bare/backticked tokens from cells. Queue order = document line order of matching lines (list lines and table rows through one pass). |
| **C. 0-plan failure locus** | **Inside `resolveRoadmapPlans`** — throw when the combined (list + table) parse yields 0 plans, message naming the roadmap path and both accepted forms. Covers every caller at the single choke point; `init` calls it **before** `mkdirSync`/`writeLedgerAtomic`, so no empty ledger or campaign dir is ever created; the CLI `init` case propagates the throw as a non-zero exit (same idiom as the existing mode-validation throw). `init` from an **explicit** plan list is untouched (an empty explicit list is a different question — deferred, §9). |
| **D. #587 envelope handling** | **Unwrap in the gate, not in prose.** A doc-only fix ("extract `.result` yourself") leaves the false pass one paste away. New exported helper (e.g. `unwrapEnvelope(parsed)`): if `parsed` is a non-array object **without** its own `probeResults` array whose `.result` is an object **with** a `probeResults` array → return `parsed.result`; otherwise return `parsed` unchanged. One level only (the harness nests exactly one `.result`); a direct top-level `probeResults` always wins (unwrap only when the direct read would find nothing). `main()` applies it right after `JSON.parse`, so `fingerprint`/`repo`/`expected` are read from the unwrapped payload and coverage accounting engages as designed. Exported for direct unit testing. |
| **E. #587 zero-probe floor** | **Refusal in `main()`, after unwrap**: if the probe-result set is empty, write a diagnostic to stderr (naming the zero-probe input and the task-output-envelope mistake as the likely cause) and **exit 1 with no verdict on stdout** — the existing invalid-JSON exit-1 idiom, a distinct message. Not in `verdict()` (it sees findings, not probes; changing its signature or its `[]` semantics breaks the pure-function contract) and not via coverage (with no `expected` and zero results, `ran < expected` is `0 < 0` — the INCOMPLETE path can never catch this shape). The floor catches the whole wrong-shape class beyond the known envelope: the wrong file, a truncated object, an object with no `probeResults` at all. |
| **F. Prose surfaces move with the code** | Same commit as each code change (source-comment-lags lesson): the `resolveRoadmapPlans` docstring and the gate CLI's usage comment (`results = [...] or { probeResults: [...] }`) restate the accepted shapes; `skills/red-team/SKILL.md` step 4 states that the gate accepts the returned object **or** the persisted task-output envelope (one `.result` level, unwrapped automatically) and refuses to emit a verdict on a zero-probe input. |
| **G. Fixture truth** | `campaign-ledger.test.mjs`'s `ROADMAP` fixture becomes the **canonical table form** (mirroring the template row shape, including a backticked `.md` doc path in the Files-owned cell as a precision decoy); the bare-list form is retained as a separate explicit back-compat fixture. The gate test gains envelope-shaped fixtures. Fixtures codifying a format the real artifacts never use are how #585 stayed green. |

## 4. Mechanics (per component)

### `skills/war-campaign/assets/campaign-ledger.mjs`
- `resolveRoadmapPlans(roadmapPath)`: single pass over lines. A line matching the existing bare
  list regex contributes its path (unchanged). A table row (starts with `|`, not a header/separator
  row) contributes the target of its **first** markdown link ending `.md`, if any. All targets
  resolved against `path.dirname(roadmapPath)`. If the pass ends with 0 plans → throw:
  `0 plans parsed from <roadmapPath> — expected a plan-index table ([slug](../plans/<file>.md) rows) or bulleted/numbered .md lines`.
- Docstring above the function rewritten to state both accepted forms and the fail-loud contract.
- No other export changes: `init`, `sweep`, `assertOrderable`, footprint extraction all untouched.
  A rotted link target (file moved/renamed) still fails loud downstream via
  `extractFilesFromPlanFile`'s ENOENT — the existing backstop, unchanged.

### `skills/war-campaign/assets/campaign-ledger.test.mjs`
- `ROADMAP` const → canonical table (with the precision decoy per G); the existing
  `init from a roadmap file` test now proves table ingestion in row order.
- New: bare-list back-compat fixture/test; 0-plan roadmap (prose-only file) → `init` throws and
  neither `ledger.json` nor the campaign dir exists afterward.

### `skills/red-team/assets/red-team-gate.mjs`
- New exported `unwrapEnvelope(parsed)` per D, placed with the other pure helpers.
- `main()`: `parsed = unwrapEnvelope(JSON.parse(raw))` (name illustrative — the construct is the
  post-parse unwrap), then the existing shape reads unchanged; after computing `results`, the
  zero-probe refusal per E fires before any classification. Usage comment in the CLI block updated
  per F. `verdict`/`classify`/`classifyCoverage`/`summarize`/`isOnTarget`/`dedupe` byte-untouched.

### `skills/red-team/assets/red-team-gate.test.mjs`
- Unit tests for `unwrapEnvelope` (envelope → payload; direct object → unchanged; array →
  unchanged; envelope with a top-level `probeResults` → top level wins).
- CLI-level tests (spawn `node red-team-gate.mjs --stdin`, the only layer where `main()`'s refusal
  is observable): the #587 repro inverted — an envelope wrapping a Critical-failing probe set now
  yields `BLOCKED`; a zero-probe input (`{}` and `{ "result": {} }`) exits non-zero with the
  refusal on stderr and no verdict on stdout.

### `skills/red-team/SKILL.md` (step 4 in `## Steps` only)
- Step 4 prose per F: both accepted input shapes, automatic one-level `.result` unwrap, and the
  zero-probe refusal named as fail-closed behavior. No other section touched (merge adjacency, §2).

## 5. Surface changes (files touched)

- `skills/war-campaign/assets/campaign-ledger.mjs` — table parsing + 0-plan throw + docstring.
- `skills/war-campaign/assets/campaign-ledger.test.mjs` — canonical-table fixture, back-compat
  fixture, 0-plan throw test.
- `skills/red-team/assets/red-team-gate.mjs` — `unwrapEnvelope` + zero-probe refusal + CLI comment.
- `skills/red-team/assets/red-team-gate.test.mjs` — unwrap unit tests + CLI spawn tests.
- `skills/red-team/SKILL.md` — step 4 prose (accepted shapes + refusal).

No changes to: `workflow-scaffold.js` (its return shape is already correct), `workflow-template.js`,
any hook or floor script, any enum (`HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` untouched),
`skills/war-campaign/SKILL.md` (it makes no roadmap-format claim), the roadmap template.

## 6. New domain terms (CONTEXT.md)

None. Both changes harden existing constructs (the campaign roadmap, the gate's input contract)
without introducing a new concept that other surfaces would need to name.

## 7. Recommended ADRs

None — below ADR scale. The direction (a verification/ingest boundary fails closed, never open) is
already doctrine in spirit (ADR 0017's never-waive rule; the gate's own `INCOMPLETE`-never-CLEARED
invariant); this spec extends that posture to the two CLIs' input parsing without a new binding
decision.

## 8. Open risks / implementation notes

- **First-link-per-row is a documented ceiling.** A future roadmap that puts a `.md` markdown link
  in a non-Plan column *before* the Plan column, or that uses links (not backticks) in the
  contention table, would mis-ingest. The ratified template makes the Plan column the only linked
  cell; the ceiling and its trigger belong in the `resolveRoadmapPlans` docstring. Note the 0-plan
  throw guards under-ingestion only — over-ingestion of an existing doc path would surface later
  via `assertOrderable`'s unparseable-footprint throw or a nonsense footprint, not at parse time.
- **Link-target edge shapes** (`<file>.md#anchor`, absolute URLs) are out of contract: the template
  emits plain relative `.md` targets; anything else simply doesn't match and, if nothing matches,
  the 0-plan throw names the file.
- **CLI spawn tests are new to `red-team-gate.test.mjs`** (existing tests import pure functions
  only). Spawn `process.execPath` with the script's absolute path (cwd-independent, per repo test
  conventions); the `invokedDirectly` realpath guard already supports direct invocation.
- **Delete-the-feature discipline** (weak-test-assertion lesson): the table fixture must contain no
  bare-list lines (so the test fails if the table extractor is removed), and the zero-probe CLI
  test must assert the non-zero exit (which reverts to exit-0 `CLEARED` if the refusal is removed).
- **Envelope detection is shape-keyed, not schema-keyed.** If the harness someday renames `.result`
  or nests deeper, the unwrap misses and the zero-probe floor catches it loudly — the two layers
  are deliberately independent (fix for the known shape; floor for the unknown class).
- **Rebase note (not a dependency):** if the diagnosis-preflight plan executes while this work is
  in flight, both touch `skills/red-team/SKILL.md` in disjoint sections — carry the file in the
  campaign roadmap's shared-file-contention table; the later land rebases trivially.

## 9. Non-goals / deferred

- **No roadmap-template change** — the parser meets the ratified shape.
- **No general markdown-table parser** — row-scoped link extraction only.
- **No multi-level envelope unwrap or task-output schema change** — one `.result` level is the
  observed harness contract; the floor covers everything else.
- **No guard on `init` with an explicit empty `--plans` list** — a different boundary with a
  conceivable legitimate flow (seed empty, `add`+`sweep` later); deferred until it bites.
- **No changes to `verdict`/`classify`/coverage semantics** — the `INCOMPLETE` machinery is
  correct; it was simply never reached.
- **No `workflow-scaffold.js` changes** — its returned object already carries every field the gate
  needs.

## 10. Validation criteria (concrete, testable)

1. **Table ingestion**: `campaign-ledger.test.mjs` — `init` from a canonical-template table roadmap
   (two `[slug](../plans/<file>.md)` rows) yields both plans, queued, in row order; the fixture
   contains no bare-list lines.
2. **Extraction precision**: a fixture row whose Files-owned cell carries a backticked existing
   `.md` doc path ingests only the Plan-column link target.
3. **Back-compat**: a bare numbered/bulleted list roadmap still parses to the same ledger shape.
4. **Fail-loud, no side effects**: `init` from a 0-plan roadmap (prose-only file) throws with the
   roadmap path in the message, and no `ledger.json` or campaign dir exists afterward.
5. **Envelope unwrap (unit)**: `unwrapEnvelope` returns `.result` for the harness envelope shape,
   the input unchanged for a direct object, an array, and an object with top-level `probeResults`
   (top level wins over `.result`).
6. **False-CLEARED repro inverted (CLI)**: piping an envelope wrapping a Critical-failing probe set
   through `red-team-gate.mjs --stdin` yields `BLOCKED` with that probe counted — the exact #587
   reproduction now caught.
7. **Zero-probe refusal (CLI)**: piping `{}` and `{ "result": {} }` exits non-zero with a stderr
   message naming the zero-probe input; stdout carries no verdict. This assertion fails (exit 0,
   `CLEARED`) if the refusal is removed.
8. **Preserved contracts**: the existing `campaign-ledger.test.mjs` and `red-team-gate.test.mjs`
   suites pass with only the fixture changes named in §4; `verdict CLEARED on no findings`
   (findings-level) is untouched; `workflow-scaffold.test.mjs` passes byte-untouched.
9. **Prose surfaces**: `skills/red-team/SKILL.md` step 4 and both code comments name the accepted
   shapes and the refusal (greppable, case-tolerant tokens — e.g. `task-output`, `.result`,
   `zero-probe` / `0 probe`).
10. **Operator-verifiable only (deferred-backstop material for the plan)**: (a) a live
    `campaign-ledger.mjs init --roadmap docs/roadmaps/2026-07-07-target-agnostic-and-diagnosis-roadmap.md`
    seeds exactly its two plans; (b) a live `/red-team` run whose Lead pipes the persisted
    task-output file gets a true verdict, not `CLEARED`/`probes:0`. Runner: the next live campaign /
    red-team invocation.
