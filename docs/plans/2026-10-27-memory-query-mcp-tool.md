# Memory query MCP tool — four WAR seats can search hot and archived lessons

**Evidence consumed** — one row per linked artifact:
- `skills/_shared/war-memory.mjs` (`walkCorpus`, `buildIndex`, `rankRecords`, `selectForBudget`, `renderPromptBlock`, `appendQueryLog`, the module-level `node:sqlite` import) at `0ea0b774` · read
- `hooks/validate-evidence-auditor-mcp.sh` header, role branches and output-path loop, and `hooks/hooks.json` at `0ea0b774` · read
- `agents/war-auditor.md`, `agents/war-servitor.md`, `agents/war-evidence-auditor.md`, `agents/war-worker.md` frontmatter, sizes and the worker's Prior-lessons sentence at `0ea0b774` · read
- `skills/war/assets/prompt-surface-budgets.test.mjs` card budgets at `0ea0b774` · read
- `skills/war/assets/assert-budget-raise-cited.sh` (`TRAILER_RE`) at `0ea0b774` · read
- `skills/war/assets/workflow-template.js` (`WORKER_MEMORY_SELF_QUERY_LINE`, `memoryLocalRoot`, `learningsTarget`) and the worker self-query tests in `workflow-template.test.mjs` at `0ea0b774` · read
- `.claude/war/runs/` args files (1,799 recorded prefetch blocks) · read, sizes only
- `docs/adr/0002-scope-by-agent-type.md` · unread — the amendment appends to it; Task 1.4 reads it in full
- `docs/adr/0048` (budget-maintenance authority) · unread — its in-run no-raise rule reached the plan through the red-team report; Task 1.3 cites it

**Trials run**
- escape-guard: clean (no trial ran)
- None — the one fact fork (the plugin MCP tool name, A1) needs a live plugin-loaded session, which the sandbox form cannot host; it is default-and-tagged and settled by Task 1.1's live check before any task copies the name.

## Context — the gap / problem

Archived lessons are searchable only through `war-memory.mjs query`, which walks hot and `archive/` lessons in both roots with no penalty (verified: `walkCorpus` and `rankRecords` in `skills/_shared/war-memory.mjs` at `0ea0b774`). Only the worker can run it mid-task (verified: `agents/war-worker.md` Prior-lessons sentence at `0ea0b774`). The auditor's Bash is fail-closed to read-only git verbs (verified: `hooks/validate-auditor-git.sh` at `0ea0b774`), and the servitor has no Bash (verified: `agents/war-servitor.md` `tools:` line at `0ea0b774`). The MCP hook denies every MCP tool for `war-auditor`, `war-servitor` and `war-refiner`, and allows only the REA allowlist for `war-evidence-auditor` and `war-worker` (verified: `hooks/validate-evidence-auditor-mcp.sh` header at `0ea0b774`). A seat that needs a lesson beyond its ~1,000-token prefetch block has no way to look (verified: 1,799 blocks, median ~3.6 KB, in `.claude/war/runs/` args files at `0ea0b774`).

The CLI's output has two quirks: an archived lesson carries no marker, and a lesson archived in both roots appears twice (verified: `query 'semaphore leaked permit drain'` run on 2026-10-27 at `0ea0b774`).

## Pivotal constraints

- The repo has no `package.json`, so no npm dependency is available (verified: `CLAUDE.md` Commands section at `0ea0b774`). The server speaks MCP's stdio JSON-RPC by hand.
- `war-memory.mjs` imports `node:sqlite` at module load and calls `process.exit(1)` when the import fails, so importing it at all on Node < 24 kills the importing process (verified: the module-level `try { await import('node:sqlite') }` block in `skills/_shared/war-memory.mjs` at `0ea0b774`).
- The auditor card is 28,629 B against a 28,672 B hard line, and the worker card is 12,080 B against 12,288 B (verified: `wc -c` and `prompt-surface-budgets.test.mjs` at `0ea0b774`). `CONTEXT.md` has 720 B under its hard line (verified: same, at `0ea0b774`).
- An in-run budget-ceiling raise passes the merge floor only with the trailer `Budget-Raise: ADR-0042 <surface> +<bytes>` (verified: `TRAILER_RE` in `skills/war/assets/assert-budget-raise-cited.sh` at `0ea0b774`).
- Standing instructions (`agents/*.md`) and dispatched prompts (`workflow-template.js`) must change in the same commit (verified: `CLAUDE.md` Execution architecture at `0ea0b774`). The worker's self-query line is pinned on both surfaces by `workflow-template.test.mjs` (verified: test 'memory: worker self-query line present in dispatched prompt AND mirrored in war-worker.md (both surfaces)' at `0ea0b774`).
- `workflow-template.js` growth is capped by the staged-copy headroom floor in `stage-workflow.test.mjs`, not by file size alone (verified: `SCRIPT_BYTE_CAP` in `stage-workflow.mjs` at `0ea0b774`).
- `node --test` given a test file that does not exist exits 0, and it counts the file itself as one passing test even when a name pattern matches nothing, so every check on a new test proves the named test's own TAP `ok` line, after a `test -f` (verified: red-team report `docs/red-team/2026-10-27-memory-query-mcp-tool.md`).

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Which seats get the tool | worker, auditor, evidence auditor and servitor; the worker's dispatched line and its card's Prior-lessons sentence both move from the Bash self-query to the tool | PIN-1 · (user) Q1, red-team grill | PIN-1→slice (T1.3) |
| D2 | Root resolution (the tool contract) | `memory_query({query, local, repo})`; the Lead's existing `memoryLocalRoot` / `learningsTarget` args thread into each seat prompt; the server never guesses a root from cwd | PIN-2 · (user) Q2 | PIN-2→guardrail ‡ |
| D3 | Output shape and dupe collapse | collapse by slug across roots and archive state: a hot copy beats an archived copy, the repo copy beats the local copy at the same state, and a hit is tagged `(archived)` only when every copy is archived | PIN-3 · (user) Q3, red-team grill | PIN-3→end-state |
| D4 | Query log and its fence | the server (never the seat) appends one line to the query log only when `local` names an existing directory, and never creates a directory; the hook denies a `memory_query` call whose `local` is not under `*/.claude/projects/*/memory` or carries a `..` segment | PIN-4 · (user) Q4, red-team grill | PIN-4→guardrail ‡ |
| D5 | Auditor card headroom | evict one auditor-card block byte-identical into a references file with a clear `when <trigger>, read references/<file>` pointer; the operator's Q6 answer is the ADR 0048 operator gate for a raise of the auditor hard line by at most 1,024 B, committed with the exact `Budget-Raise:` trailer | PIN-5 · (user) Q6, red-team grill | PIN-5→slice (T1.3) |
| D6 | Dependencies | zero npm dependencies; hand-rolled stdio JSON-RPC | PIN-6 · (verified: no `package.json` at `0ea0b774`) | PIN-6→guardrail |
| D7 | Refiner | stays denied every MCP tool | PIN-7 · (user) red-team grill | PIN-7→guardrail |
| D8 | Canonical tool-name home | the hook owns the full tool-name literal (`MEMORY_TOOL`), like the REA allowlist; cards and the template are guarded against it | PIN-8 · [assumed: mirrors the REA allowlist pattern — if wrong: a second home drifts] | PIN-8→slice (T1.2) |
| D9 | Server registration | inline `mcpServers` in `.claude-plugin/plugin.json`, never a root `.mcp.json` (a root file would also load as this repo's project MCP config, where `${CLAUDE_PLUGIN_ROOT}` is unset) | PIN-9 · [assumed: plugin.json `mcpServers` is honored — if wrong: move to a plugin-root `.mcp.json`] | PIN-9→slice (T1.1) |
| D10 | REA access for the evidence auditor and worker | unchanged; `memory_query` is added beside the REA allowlist for those two roles, and is the only MCP tool for the auditor and servitor | PIN-10 · (verified: hook role branches at `0ea0b774`) | PIN-10→end-state |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The tool's full name is `mcp__plugin_work-audit-refine_war-memory__memory_query` | Claude Code's plugin MCP naming as remembered, not verified | the hook and cards never match; seats see no tool | Task 1.1's live listing, before Task 1.2 copies the name |
| A2 | Plugin `mcpServers` in `plugin.json` expands `${CLAUDE_PLUGIN_ROOT}` | the `ecc` plugin ships `mcpServers` in its `plugin.json` (verified: its manifest on disk at 2026-10-27), expansion unverified | the server fails to start | Task 1.1's live listing |
| A3 | A subagent whose card lists the tool on `tools:` can call a plugin MCP tool | the evidence auditor already calls REA MCP tools this way (verified: `agents/war-evidence-auditor.md` at `0ea0b774`) | seats cannot reach the tool | backstop row 1 |
| A4 | The worker card (no `tools:` line) inherits plugin MCP tools | the hook header states the worker inherits the MCP channel (verified: `hooks/validate-evidence-auditor-mcp.sh` at `0ea0b774`) | the worker needs a `tools:` line | backstop row 1 |

## Non-goals / deferred

- The refiner, the setup scout and the Lead get no new channel.
- The CLI's own output stays unchanged unless the implementer moves the marker and collapse logic into `war-memory.mjs` (latitude).
- Raising `DEFAULT_TOP_K` or `DEFAULT_BUDGET` for prefetch.
- The index-shrink thresholds discussed on 2026-10-27 (hub floor, cell cap) belong to a separate plan.

## New domain terms · Recommended ADRs

- **Memory query tool** — the plugin-shipped MCP tool `memory_query` that searches hot and archived lessons in both roots. Add to `CONTEXT.md`.
- ADR 0002 amendment: the MCP channel admits `memory_query` as the only MCP tool for the auditor and servitor, and beside the unchanged REA allowlist for the evidence auditor and worker.

## Commander's Intent

- **Purpose:** the worker, auditor, evidence auditor and servitor can each search hot and archived lessons in both roots on their own, mid-task.
- **Method:** the plugin ships a zero-dependency stdio MCP server with one read-only tool, `memory_query({query, local, repo})`; the Lead threads the resolved roots into each seat prompt; the MCP hook admits the tool for the four seats (the only MCP tool for the auditor and servitor, beside REA for the evidence auditor and worker); ADR 0002 records the change.
- **Mechanism latitude:** where the archived-marker and collapse code lives (the server or a new export in `war-memory.mjs`), the JSON-RPC framing details, the test seam that forces the Node < 24 path, and which auditor-card block is evicted are implementer's choice; substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** no npm dependencies (PIN-6) · the seat itself never writes, the server appends the query log only into an existing directory under `*/.claude/projects/*/memory` and never creates one (PIN-4) · the server never guesses a root from cwd (PIN-2) · the refiner stays denied every MCP tool (PIN-7) · below Node 24 the tool fails open with a `memory disabled` result and the server stays up · the auditor card's hard line rises by at most 1,024 B, only with the exact `Budget-Raise:` trailer (PIN-5).
- **End state:**
  1. A `memory_query` call over a fixture corpus returns an archived lesson, tagged `(archived)` (PIN-3) · check: `test -f skills/_shared/war-memory-mcp.test.mjs && bash -o pipefail -c "node --test --test-reporter=tap --test-name-pattern='^ES1:' skills/_shared/war-memory-mcp.test.mjs | grep -E '^[[:space:]]*ok [0-9]+ - ES1:'"`.
  2. One slug with several copies yields one hit: a hot copy beats an archived copy, the repo copy beats the local copy at the same state, and `(archived)` appears only when every copy is archived · check: `test -f skills/_shared/war-memory-mcp.test.mjs && bash -o pipefail -c "node --test --test-reporter=tap --test-name-pattern='^ES2:' skills/_shared/war-memory-mcp.test.mjs | grep -E '^[[:space:]]*ok [0-9]+ - ES2:'"`.
  3. With `local` naming an existing memory directory, one query-log line is appended; with `local` absent, nothing is written; with `local` naming a missing directory, no directory is created · check: `test -f skills/_shared/war-memory-mcp.test.mjs && bash -o pipefail -c "node --test --test-reporter=tap --test-name-pattern='^ES3:' skills/_shared/war-memory-mcp.test.mjs | grep -E '^[[:space:]]*ok [0-9]+ - ES3:'"`.
  4. With `node:sqlite` forced unavailable, the tool returns a `memory disabled` result and the same server process answers a following `tools/list` request · check: `test -f skills/_shared/war-memory-mcp.test.mjs && bash -o pipefail -c "node --test --test-reporter=tap --test-name-pattern='^ES4:' skills/_shared/war-memory-mcp.test.mjs | grep -E '^[[:space:]]*ok [0-9]+ - ES4:'"`.
  5. The hook allows `memory_query` for `war-auditor`, `war-evidence-auditor`, `war-servitor` and `war-worker`; denies every other MCP tool for `war-auditor` and `war-servitor`; still allows REA allowlist calls for `war-evidence-auditor` and `war-worker`; denies every MCP tool for `war-refiner`; and denies a `memory_query` call whose `local` is outside `*/.claude/projects/*/memory` or carries `..` (PIN-10) · check: `grep -q '^MEMORY_TOOL=' hooks/validate-evidence-auditor-mcp.sh && bash hooks/validate-evidence-auditor-mcp.test.sh && echo HOOK_MEMORY_OK`.
  6. The hook's `MEMORY_TOOL` literal appears on the `tools:` line of the auditor, evidence auditor and servitor cards, in the worker card's Prior-lessons sentence, and in `workflow-template.js`; the worker card and the template no longer carry the `war-memory.mjs query` self-query sentence · check: `test -f skills/war/assets/memory-tool-name.test.mjs && node --test skills/war/assets/memory-tool-name.test.mjs`.
  7. ADR 0002 carries the memory-query amendment · check: `grep -c '^## Amendment (2026-10-27): the memory query tool' docs/adr/0002-scope-by-agent-type.md` prints `1`.
  8. `.claude-plugin/plugin.json` registers server `war-memory` pointing at `skills/_shared/war-memory-mcp.mjs` · check: `node -e "const s=(require('./.claude-plugin/plugin.json').mcpServers||{})['war-memory'];if(!s||!JSON.stringify(s).includes('skills/_shared/war-memory-mcp.mjs'))process.exit(1);console.log('REGISTERED')"` prints `REGISTERED`.
  9. Each of the four seat prompts names `memory_query` with the threaded `local` and `repo` values when `memoryLocalRoot` is threaded, and omits the line when it is not · check: `bash -o pipefail -c "node --test --test-reporter=tap --test-name-pattern='memory_query seat line' skills/war/assets/workflow-template.test.mjs | grep -E '^[[:space:]]*ok [0-9]+ - .*memory_query seat line'"`.
  10. The four release slots carry the same new version · gate: `node --test skills/war/assets/version-slots.test.mjs`.

## Build order (for /war)

Phase 1 (server; then hook; then cards and prompts, and docs) → Phase 2 (release).

## Phase 1 — Server, hook, seat wiring and docs

### Task 1.1: The MCP server
- Files: `skills/_shared/war-memory-mcp.mjs`, `skills/_shared/war-memory-mcp.test.mjs`, `.claude-plugin/plugin.json`
- Plan slice: write a zero-dependency stdio JSON-RPC MCP server (PIN-6) answering `initialize`, `tools/list` and `tools/call` for one tool, `memory_query({query, local?, repo?, topK?})` (PIN-2). It probes `await import('node:sqlite')` in its own try/catch first and imports `war-memory.mjs` dynamically only after that probe succeeds, because `war-memory.mjs` exits the process at load when sqlite is missing; on a failed probe every `memory_query` call returns a `memory disabled` tool result and the server keeps serving. It reuses `walkCorpus`, `buildIndex`, `rankRecords` and `selectForBudget`, collapses copies of one slug per D3 and tags `(archived)` per D3 (PIN-3). It appends one query-log line only when `local` names an existing directory, and never creates a directory (PIN-4). Register it inline under `mcpServers` in `.claude-plugin/plugin.json` as server `war-memory` (PIN-9), leaving `version` untouched. The test spawns the server and drives it over stdio; prefix each End-state test title with `ES1:` to `ES4:`. Before finishing, confirm A1 and A2 with a live `claude --plugin-dir .` session listing the tool; record the observed full tool name in the task report, and if it differs from A1, write the observed name into the report as the name Task 1.2 must use.
- Done when: `test -f skills/_shared/war-memory-mcp.test.mjs && node --test skills/_shared/war-memory-mcp.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: The MCP hook admits the tool
- Files: `hooks/validate-evidence-auditor-mcp.sh`, `hooks/validate-evidence-auditor-mcp.test.sh`
- Plan slice: add a `MEMORY_TOOL=` literal holding the full tool name Task 1.1 observed, owned by this file (PIN-8). For `war-auditor` and `war-servitor`, allow exactly that tool and deny every other MCP tool. For `war-evidence-auditor` and `war-worker`, allow it beside the unchanged REA allowlist (PIN-10). Keep `war-refiner` denied everything (PIN-7). For a `memory_query` call, deny when `tool_input.local` is present and is not under `*/.claude/projects/*/memory` or carries a `..` segment (PIN-4). Update the header's role table. In the test, add allow and deny rows for each role, an REA-still-allowed row for the evidence auditor and worker, and the `local` deny rows. The existing card set-equality check already filters to `^mcp__rea__` names, so it needs no change.
- Done when: `grep -q '^MEMORY_TOOL=' hooks/validate-evidence-auditor-mcp.sh && bash hooks/validate-evidence-auditor-mcp.test.sh && echo HOOK_MEMORY_OK`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: Seat cards and dispatched prompts
- Files: `agents/war-auditor.md`, `agents/war-evidence-auditor.md`, `agents/war-servitor.md`, `agents/war-worker.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/memory-tool-name.test.mjs`, `skills/war/assets/prompt-surface-budgets.test.mjs`, `skills/war/references/auditor-card-evicted.md`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: add the hook's `MEMORY_TOOL` name to the `tools:` line of the auditor, evidence auditor and servitor cards. Rewrite the worker card's Prior-lessons sentence to name the tool instead of the Bash `war-memory.mjs query` line, keeping the card under its hard line. In `workflow-template.js`, replace `WORKER_MEMORY_SELF_QUERY_LINE` and give the worker, auditor, evidence auditor and servitor prompts one line naming the tool with the threaded `local` (from `memoryLocalRoot`) and `repo` (from `learningsTarget`) values, emitted only when `memoryLocalRoot` is threaded (PIN-1). In `workflow-template.test.mjs`, rewrite the tests 'memory: worker self-query line present in dispatched prompt AND mirrored in war-worker.md (both surfaces)' and 'memory: worker self-query line carries --repo <resolved root> when a repo root is threaded (T1)' to the tool line, and add rows titled with `memory_query seat line` covering End state 9. Fit the auditor card per PIN-5: move one block byte-identical into `skills/war/references/auditor-card-evicted.md` (rename to fit the block's topic) and leave a pointer of the fixed shape `when <trigger>, read references/<file>`, whose trigger names the situations the block covers in plain words. Raise the auditor hard line in `prompt-surface-budgets.test.mjs` only if still needed, by at most 1,024 B; the commit carries the trailer `Budget-Raise: ADR-0042 agents/war-auditor.md +<bytes>` and cites the operator's Q6 answer as the ADR 0048 operator gate in its body. Keep every other card under its current hard line. Register the new references file in `doc-cli-consistency.test.mjs`'s placement census and `reference-link-integrity.test.mjs`. Add `memory-tool-name.test.mjs`, which extracts the hook's `MEMORY_TOOL` literal and asserts End state 6 (three `tools:` lines, the worker card body, the template, and the old self-query sentence absent from the worker card and template); prove it red by mutating one card.
- Done when: `test -f skills/war/assets/memory-tool-name.test.mjs && node --test skills/war/assets/memory-tool-name.test.mjs skills/war/assets/workflow-template.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs skills/war/assets/stage-workflow.test.mjs skills/_shared/doc-cli-consistency.test.mjs skills/war/assets/reference-link-integrity.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

### Task 1.4: ADR, glossary and guard docs
- Files: `docs/adr/0002-scope-by-agent-type.md`, `CONTEXT.md`, `CLAUDE.md`
- Plan slice: append `## Amendment (2026-10-27): the memory query tool` to ADR 0002, stating that the MCP channel admits `memory_query` as the only MCP tool for the auditor and servitor and beside the unchanged REA allowlist for the evidence auditor and worker, the no-seat-write rule, the `local` anchor, and the refiner exclusion. Add the **Memory query tool** term to `CONTEXT.md` within its 720 B headroom. In `CLAUDE.md`'s Guard architecture paragraph, add one clause per affected role. Name the tool by pointing at the hook's `MEMORY_TOOL` literal (de-mirror), never by restating the full name.
- Done when: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump to the next free patch above the live base in all four slots together, replace the `## Status` line in place, and prepend a newest-first `## <version> — <date>` entry to `CHANGELOG.md` whose body matches the new `## Status` block, as `version-slots.test.mjs` requires.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- A live `/war` phase shows an auditor and a servitor calling `memory_query` and getting results, which confirms A3 and A4 · why deferred: subagent tool reach needs a real run with the released plugin; Task 1.1's live listing already covers A1 and A2 · runner: the Lead reads the first post-release run's transcripts via `/war-review`.

## Notes / conscious deviations

- The interview batched its questions (Q1–Q4, then Q5–Q6) instead of one per turn, at the operator's preference for short exchanges.
- The operator's Q6 answer ("you can slightly raise the hard cap by 1KiB") is the ADR 0048 operator gate for Task 1.3's auditor-card raise.

## Open decisions

None.
