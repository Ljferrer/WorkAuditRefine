# Memory query MCP tool — every seat can search hot and archived lessons

**Evidence consumed** — one row per linked artifact:
- `skills/_shared/war-memory.mjs` (`walkCorpus`, `buildIndex`, `rankRecords`, `selectForBudget`, `renderPromptBlock`, the query-log append in `cmdQuery`) at `0ea0b774` · read
- `hooks/validate-evidence-auditor-mcp.sh` header and `hooks/hooks.json` at `0ea0b774` · read
- `agents/war-auditor.md`, `agents/war-servitor.md`, `agents/war-evidence-auditor.md`, `agents/war-worker.md` frontmatter and sizes at `0ea0b774` · read
- `skills/war/assets/prompt-surface-budgets.test.mjs` card budgets at `0ea0b774` · read
- `skills/war/assets/workflow-template.js` (`WORKER_MEMORY_SELF_QUERY_LINE`, `memoryLocalRoot`, `learningsTarget`) at `0ea0b774` · read
- `.claude/war/runs/` args files (1,799 recorded prefetch blocks) · read, sizes only
- `docs/adr/0002-scope-by-agent-type.md` · unread — the amendment appends to it; Task 1.4 reads it in full

**Trials run**
- escape-guard: clean (no trial ran)
- None — the one fact fork (the plugin MCP tool name, A1) needs a live plugin-loaded session, which the sandbox form cannot host; it is default-and-tagged and checked in Task 1.1's plan slice and the backstop.

## Context — the gap / problem

Archived lessons are searchable only through `war-memory.mjs query`, which walks hot and `archive/` lessons in both roots with no penalty (verified: `walkCorpus` and `rankRecords` in `skills/_shared/war-memory.mjs` at `0ea0b774`). Only the worker can run it mid-task (verified: `agents/war-worker.md` self-query line at `0ea0b774`). The auditor's Bash is fail-closed to read-only git verbs (verified: `hooks/validate-auditor-git.sh` at `0ea0b774`), and the servitor has no Bash (verified: `agents/war-servitor.md` `tools:` line at `0ea0b774`). The MCP hook denies every MCP tool for `war-auditor`, `war-servitor` and `war-refiner` (verified: `hooks/validate-evidence-auditor-mcp.sh` header at `0ea0b774`). A seat that needs a lesson beyond its ~1,000-token prefetch block has no way to look (verified: 1,799 blocks, median ~3.6 KB, in `.claude/war/runs/` args files at `0ea0b774`).

The CLI's output has two quirks: an archived lesson carries no marker, and a lesson archived in both roots appears twice (verified: `query 'semaphore leaked permit drain'` run on 2026-10-27 at `0ea0b774`).

## Pivotal constraints

- The repo has no `package.json`, so no npm dependency is available (verified: `CLAUDE.md` Commands section at `0ea0b774`). The server speaks MCP's stdio JSON-RPC by hand.
- The auditor card is 28,629 B against a 28,672 B hard line (verified: `wc -c` and `prompt-surface-budgets.test.mjs` at `0ea0b774`). The worker card is 12,080 B against 12,288 B.
- Standing instructions (`agents/*.md`) and dispatched prompts (`workflow-template.js`) must change in the same commit (verified: `CLAUDE.md` Execution architecture at `0ea0b774`).
- `workflow-template.js` growth is capped by the staged-copy headroom floor in `stage-workflow.test.mjs`, not by file size alone (verified: `SCRIPT_BYTE_CAP` in `stage-workflow.mjs` at `0ea0b774`).
- The evidence auditor's card is guarded set-equal to the hook's REA allowlist (verified: `hooks/validate-evidence-auditor-mcp.test.sh` at `0ea0b774`).

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Which seats get the tool | auditor, evidence auditor, servitor and worker; the worker's dispatched prompt moves from the Bash self-query line to the tool | PIN-1 · (user) Q1 | PIN-1→slice (T1.3) |
| D2 | Root resolution (the tool contract) | `memory_query({query, local, repo})`; the Lead's existing `memoryLocalRoot` / `learningsTarget` args thread into each seat prompt; the server never guesses a root from cwd | PIN-2 · (user) Q2 | PIN-2→guardrail ‡ |
| D3 | Output shape | archived hits tagged `(archived)`; a lesson present in both roots appears once | PIN-3 · (user) Q3 | PIN-3→end-state |
| D4 | Query log | the server (never the seat) appends one line to the local root's query log when `local` is set; nothing is written without it | PIN-4 · (user) Q4 | PIN-4→guardrail ‡ |
| D5 | Auditor card headroom | evict one auditor-card block byte-identical into a references file with a clear `when <trigger>, read references/<file>` pointer; the auditor card's hard line may rise by at most 1,024 B | PIN-5 · (user) Q6 | PIN-5→slice (T1.3) |
| D6 | Dependencies | zero npm dependencies; hand-rolled stdio JSON-RPC | PIN-6 · (verified: no `package.json` at `0ea0b774`) | PIN-6→guardrail |
| D7 | Refiner | stays denied every MCP tool | PIN-7 · [assumed: the refiner consumes no lessons — if wrong: a later plan adds it] | PIN-7→guardrail |
| D8 | Canonical tool-name home | the hook owns the full tool-name literal, like the REA allowlist; cards and the template are guarded against it | PIN-8 · [assumed: mirrors the REA allowlist pattern — if wrong: a second home drifts] | PIN-8→slice (T1.2) |
| D9 | Server registration | inline `mcpServers` in `.claude-plugin/plugin.json`, never a root `.mcp.json` (a root file would also load as this repo's project MCP config, where `${CLAUDE_PLUGIN_ROOT}` is unset) | PIN-9 · [assumed: plugin.json `mcpServers` is honored — if wrong: move to a plugin-root `.mcp.json`] | PIN-9→slice (T1.1) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The tool's full name is `mcp__plugin_work-audit-refine_war-memory__memory_query` | Claude Code's plugin MCP naming as remembered, not verified | the hook and cards never match; seats see no tool | Task 1.1 plan slice step (live listing); backstop row 1 |
| A2 | Plugin `mcpServers` in `plugin.json` expands `${CLAUDE_PLUGIN_ROOT}` | the `ecc` plugin ships `mcpServers` in its `plugin.json` (verified: its manifest on disk at 2026-10-27), expansion unverified | the server fails to start | Task 1.1 plan slice step; backstop row 1 |
| A3 | A subagent whose card lists the tool on `tools:` can call a plugin MCP tool | the evidence auditor already calls REA MCP tools this way (verified: `agents/war-evidence-auditor.md` at `0ea0b774`) | seats cannot reach the tool | backstop row 1 |
| A4 | The worker card (no `tools:` line) inherits plugin MCP tools | the hook header states the worker inherits the MCP channel (verified: `hooks/validate-evidence-auditor-mcp.sh` at `0ea0b774`) | the worker needs a `tools:` line | backstop row 1 |

## Non-goals / deferred

- The refiner and the Lead get no new channel.
- The CLI's own output stays unchanged unless the implementer moves the marker and dupe logic into `war-memory.mjs` (latitude).
- Raising `DEFAULT_TOP_K` or `DEFAULT_BUDGET` for prefetch.
- The index-shrink thresholds discussed on 2026-10-27 (hub floor, cell cap) belong to a separate plan.

## New domain terms · Recommended ADRs

- **Memory query tool** — the plugin-shipped MCP tool `memory_query` that searches hot and archived lessons in both roots. Add to `CONTEXT.md`.
- ADR 0002 amendment: the MCP channel admits exactly one read-only tool for the auditor, evidence auditor, servitor and worker.

## Commander's Intent

- **Purpose:** every WAR seat can search hot and archived lessons in both roots on its own, mid-task.
- **Method:** the plugin ships a zero-dependency stdio MCP server with one read-only tool, `memory_query({query, local, repo})`; the Lead threads the resolved roots into each seat prompt; the MCP hook admits only this tool for the auditor, evidence auditor, servitor and worker; ADR 0002 records the change.
- **Mechanism latitude:** where the archived-marker and dupe-collapse code lives (the server or a new export in `war-memory.mjs`), the JSON-RPC framing details, the test seam that forces the Node < 24 path, and which auditor-card block is evicted are implementer's choice; substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** no npm dependencies (PIN-6) · the seat itself never writes, and the server appends the query log only when `local` is set (PIN-4) · the server never guesses a root from cwd (PIN-2) · the refiner stays denied every MCP tool (PIN-7) · below Node 24 the tool fails open with a `memory disabled` result · the auditor card's hard line rises by at most 1,024 B (PIN-5).
- **End state:**
  1. A `memory_query` call over a fixture corpus returns an archived lesson, tagged `(archived)` (PIN-3) · check: `node --test skills/_shared/war-memory-mcp.test.mjs`.
  2. A fixture lesson present in both roots appears exactly once in the result · check: `node --test skills/_shared/war-memory-mcp.test.mjs`.
  3. With `local` set, one query-log line is appended to that root; with `local` absent, no file is written · check: `node --test skills/_shared/war-memory-mcp.test.mjs`.
  4. With `node:sqlite` forced unavailable, the tool returns a `memory disabled` result and the server stays up · check: `node --test skills/_shared/war-memory-mcp.test.mjs`.
  5. The hook allows `memory_query` for `war-auditor`, `war-evidence-auditor`, `war-servitor` and `war-worker`, still denies every other MCP tool for `war-auditor` and `war-servitor`, and denies every MCP tool for `war-refiner` · check: `bash hooks/validate-evidence-auditor-mcp.test.sh`.
  6. The tool-name literal in the four cards and in `workflow-template.js` equals the hook's literal · check: `node --test skills/war/assets/memory-tool-name.test.mjs`.
  7. ADR 0002 carries the memory-query amendment · check: `grep -c '^## Amendment (2026-10-27): the memory query tool' docs/adr/0002-scope-by-agent-type.md` prints `1`.
  8. The four release slots carry the same new version · gate: `node --test skills/war/assets/version-slots.test.mjs`.

## Build order (for /war)

Phase 1 (server, hook, cards and prompts, docs) → Phase 2 (release).

## Phase 1 — Server, hook, seat wiring and docs

### Task 1.1: The MCP server
- Files: `skills/_shared/war-memory-mcp.mjs`, `skills/_shared/war-memory-mcp.test.mjs`, `.claude-plugin/plugin.json`
- Plan slice: write a zero-dependency stdio JSON-RPC MCP server (PIN-6) answering `initialize`, `tools/list` and `tools/call` for one tool, `memory_query({query, local?, repo?, topK?})` (PIN-2). It reuses `walkCorpus`, `buildIndex`, `rankRecords` and `selectForBudget` from `war-memory.mjs`, tags archived hits `(archived)`, and collapses a slug present in both roots to one entry (PIN-3). It appends one query-log line only when `local` is set (PIN-4). It loads `node:sqlite` lazily and returns a `memory disabled` tool result when it is missing, never exiting. Register it inline under `mcpServers` in `.claude-plugin/plugin.json` as server `war-memory` (PIN-9), leaving `version` untouched. Before finishing, confirm A1 and A2 with a live `claude --plugin-dir .` session listing the tool name; record the observed name in the task report, and if it differs from A1, stop and escalate. The test spawns the server and drives it over stdio.
- Done when: `node --test skills/_shared/war-memory-mcp.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: The MCP hook admits the one tool
- Files: `hooks/validate-evidence-auditor-mcp.sh`, `hooks/validate-evidence-auditor-mcp.test.sh`
- Plan slice: add a `MEMORY_TOOL` literal (the A1 name) owned by this file (PIN-8). Allow exactly that tool for `war-auditor`, `war-evidence-auditor`, `war-servitor` and `war-worker`; keep every other MCP tool denied for `war-auditor` and `war-servitor`, and keep `war-refiner` denied everything (PIN-7). Update the header's role table. In the test, add allow and deny rows for each role, and exempt `MEMORY_TOOL` from the evidence card's REA set-equality check so that check passes before and after Task 1.3.
- Done when: `bash hooks/validate-evidence-auditor-mcp.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Seat cards and dispatched prompts
- Files: `agents/war-auditor.md`, `agents/war-evidence-auditor.md`, `agents/war-servitor.md`, `agents/war-worker.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/memory-tool-name.test.mjs`, `skills/war/assets/prompt-surface-budgets.test.mjs`, `skills/war/references/auditor-card-evicted.md`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`
- Plan slice: add the tool to the `tools:` line of the auditor, evidence auditor and servitor cards. In `workflow-template.js`, give the worker, auditor, evidence auditor and servitor prompts one line naming the tool with the threaded `local` (from `memoryLocalRoot`) and `repo` (from `learningsTarget`) values, emitted only when `memoryLocalRoot` is threaded; the worker line replaces `WORKER_MEMORY_SELF_QUERY_LINE` (PIN-1). Fit the auditor card per PIN-5: move one block byte-identical into `skills/war/references/auditor-card-evicted.md` (rename to fit the block's topic) and leave a pointer of the fixed shape `when <trigger>, read references/<file>`, whose trigger names the situations the block covers in plain words; raise the auditor hard line in `prompt-surface-budgets.test.mjs` only if still needed, by at most 1,024 B, citing ADR 0042's justification rule in the commit body. Keep every other card under its current hard line. Register the new references file in `doc-cli-consistency.test.mjs`'s placement census and `reference-link-integrity.test.mjs`. Add `memory-tool-name.test.mjs`, which extracts the hook's `MEMORY_TOOL` literal and asserts each card's `tools:` line (worker excepted) and the template carry it; prove it red by mutating one card.
- Done when: `node --test skills/war/assets/memory-tool-name.test.mjs skills/war/assets/workflow-template.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs skills/war/assets/stage-workflow.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

### Task 1.4: ADR, glossary and guard docs
- Files: `docs/adr/0002-scope-by-agent-type.md`, `CONTEXT.md`, `CLAUDE.md`
- Plan slice: append `## Amendment (2026-10-27): the memory query tool` to ADR 0002, stating the one-tool MCP admission per role, the no-seat-write rule and the refiner exclusion. Add the **Memory query tool** term to `CONTEXT.md`. In `CLAUDE.md`'s Guard architecture paragraph, add one clause per affected role. Name the tool by pointing at the hook's `MEMORY_TOOL` literal (de-mirror), never by restating the full name.
- Done when: None — doc-only; End state 7's check covers the ADR
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump to the next free patch above the live base in all four slots together, and replace the `## Status` line in place.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- A live `/war` phase shows an auditor and a servitor calling `memory_query` and getting results, which confirms A1 to A4 end to end · why deferred: needs a real run with the released plugin · runner: the Lead reads the first post-release run's transcripts via `/war-review`.

## Notes / conscious deviations

- The interview batched its questions (Q1–Q4, then Q5–Q6) instead of one per turn, at the operator's preference for short exchanges.

## Open decisions

None.
