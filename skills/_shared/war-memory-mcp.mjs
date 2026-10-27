#!/usr/bin/env node
// war-memory-mcp — the plugin's stdio MCP server with one read-only tool, `memory_query`
// (plan docs/plans/2026-10-27-memory-query-mcp-tool.md, Task 1.1; ADR 0002 amendment).
//
// Zero dependencies (PIN-6): newline-delimited JSON-RPC 2.0 over stdin/stdout, written by hand.
// Registered inline under `mcpServers` in .claude-plugin/plugin.json as server `war-memory` (PIN-9).
//
// Load order matters. war-memory.mjs imports node:sqlite at module load and calls process.exit(1)
// when that import fails, so importing it on Node < 24 would kill this server. The probe below
// imports node:sqlite in its own try/catch first and loads war-memory.mjs only after the probe
// succeeds. On a failed probe every memory_query call answers with a `memory disabled` text
// result and the server keeps serving initialize / tools/list / tools/call.
//
// Roots come ONLY from the call's `local` / `repo` arguments (PIN-2): no cwd guess, no env
// fallback. The query log is appended only when `local` names an existing directory, and this
// server never creates a directory (PIN-4). The hook (hooks/validate-evidence-auditor-mcp.sh)
// owns the `local` anchor check and the full tool-name literal; this file never restates them.

import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';

const SERVER_NAME = 'war-memory';
const SERVER_VERSION = '1.0.0';
const DEFAULT_PROTOCOL_VERSION = '2025-03-26';
const TOOL_NAME = 'memory_query';
const DISABLED_TEXT =
  'memory disabled: node:sqlite is unavailable on this runtime (Node >= 24 required); ' +
  'the server stays up, but memory_query returns no lessons';

// Test seam (plan latitude: "the test seam that forces the Node < 24 path"): the probe imports
// the module named here in place of node:sqlite, so a test can name a missing module and drive
// the disabled path on a Node that has sqlite. Unset or empty ⇒ the real `node:sqlite`.
const SQLITE_MODULE = process.env.WAR_MEMORY_MCP_SQLITE_MODULE || 'node:sqlite';

async function loadMemory() {
  try {
    await import(SQLITE_MODULE);
  } catch {
    process.stderr.write(`${SERVER_NAME}: ${SQLITE_MODULE} unavailable — ${TOOL_NAME} disabled\n`);
    return null;
  }
  try {
    return await import('./war-memory.mjs');
  } catch (err) {
    process.stderr.write(`${SERVER_NAME}: war-memory.mjs failed to load — ${err?.message ?? err}\n`);
    return null;
  }
}

const mem = await loadMemory();

const TOOL = {
  name: TOOL_NAME,
  description:
    'Search WAR lessons (hot and archived) in the local and repo memory roots by ranked full-text ' +
    'query. Read-only: the seat never writes; the server appends one query-log line only when `local` ' +
    'names an existing directory. Pass the roots the Lead threaded; the server never guesses one from cwd.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search terms (significant words are OR-joined).' },
      local: { type: 'string', description: 'Absolute path of the local memory root (optional).' },
      repo: { type: 'string', description: 'Absolute path of the repo memory root, e.g. <repo>/docs/learnings (optional).' },
      topK: { type: 'integer', minimum: 1, description: 'Max hits after collapsing copies (default 10).' },
    },
    required: ['query'],
    additionalProperties: false,
  },
};

// ---------------------------------------------------------------------------
// Collapse (D3 / PIN-3). Ranked records arrive one row per file copy; a slug present in both
// roots or in hot + archive/ appears several times. Keep one record per slug at its best rank
// position. Among the copies: a hot copy beats an archived copy; at the same temperature the
// repo copy beats the local copy. The hit is tagged (archived) only when every copy is archived.
// ---------------------------------------------------------------------------
const ROOT_RANK = { repo: 0, local: 1 };
function copyRank(r) {
  return (r.temperature === 'hot' ? 0 : 10) + (ROOT_RANK[r.root] ?? 5);
}

export function collapseBySlug(ranked) {
  const bySlug = new Map();
  const order = [];
  for (const r of ranked) {
    const g = bySlug.get(r.slug);
    if (!g) {
      bySlug.set(r.slug, { best: r, allArchived: r.temperature !== 'hot' });
      order.push(r.slug);
      continue;
    }
    if (copyRank(r) < copyRank(g.best)) g.best = r;
    if (r.temperature === 'hot') g.allArchived = false;
  }
  return order.map((slug) => {
    const g = bySlug.get(slug);
    return { ...g.best, archived: g.allArchived };
  });
}

// One rendered hit: the CLI's prompt-block line shape plus the (archived) tag and the file path,
// so a seat can open the full lesson.
export function formatHit(r) {
  const phase = r.phase ? `, phase ${r.phase}` : '';
  const archived = r.archived ? ' (archived)' : '';
  const desc = r.description || r.title || '';
  return `- [${r.slug}] (${r.provenance}${phase})${archived}: ${desc} · ${r.file}`;
}

// Query log (PIN-4): append one line only when `local` IS an existing directory. Never mkdir.
function appendQueryLogIfPresent(local, entry) {
  if (!local) return;
  let st;
  try {
    st = fs.statSync(local);
  } catch {
    return; // missing → nothing written, nothing created
  }
  if (!st.isDirectory()) return;
  try {
    fs.appendFileSync(path.join(local, mem.QUERY_LOG_FILE), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // best-effort, like the CLI: a failed log append never fails the query
  }
}

function textResult(text, isError = false) {
  const out = { content: [{ type: 'text', text }] };
  if (isError) out.isError = true;
  return out;
}

function optionalString(args, key) {
  const v = args[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw new Error(`\`${key}\` must be a string`);
  return v.length ? v : null;
}

function runMemoryQuery(args) {
  if (!args || typeof args !== 'object') return textResult('arguments must be an object', true);
  if (typeof args.query !== 'string' || !args.query.trim()) {
    return textResult('`query` is required and must be a non-empty string', true);
  }
  let local, repo;
  try {
    local = optionalString(args, 'local');
    repo = optionalString(args, 'repo');
  } catch (err) {
    return textResult(err.message, true);
  }
  let topK = mem ? mem.DEFAULT_TOP_K : 10;
  if (args.topK !== undefined) {
    if (!Number.isInteger(args.topK) || args.topK < 1) return textResult('`topK` must be a positive integer', true);
    topK = args.topK;
  }
  if (!mem) return textResult(DISABLED_TEXT);

  const roots = {};
  if (repo) roots.repo = repo; // repo first: ties in the index favor neither; collapse decides
  if (local) roots.local = local;
  if (Object.keys(roots).length === 0) {
    return textResult('no lessons matched: neither `local` nor `repo` was given (the server never guesses a root)');
  }
  const records = mem.walkCorpus(roots);
  const db = mem.buildIndex(records);
  const ranked = mem.rankRecords(db, records, args.query);
  const collapsed = collapseBySlug(ranked);
  const selected = mem.selectForBudget(collapsed, { topK });
  appendQueryLogIfPresent(local, {
    ts: new Date().toISOString(),
    query: args.query,
    seat: 'mcp',
    topSlugs: selected.map((r) => r.slug),
    scores: [],
  });
  if (selected.length === 0) return textResult('no lessons matched');
  const header = `PRIOR LESSONS (memory — trust per provenance tag) [${selected.length} hit(s), roots: ${Object.keys(roots).join('+')}]:`;
  return textResult([header, ...selected.map(formatHit)].join('\n'));
}

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 over newline-delimited stdio (MCP stdio transport).
// ---------------------------------------------------------------------------
function send(msg) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');
}

function rpcError(id, code, message) {
  send({ id, error: { code, message } });
}

function handle(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.method !== 'string') {
    if (msg && typeof msg === 'object' && !Array.isArray(msg) && msg.id !== undefined) {
      rpcError(msg.id, -32600, 'invalid request');
    }
    return;
  }
  const { id, method, params = {} } = msg;
  const isNotification = id === undefined;
  if (isNotification) return; // notifications/initialized, notifications/cancelled, ...: nothing to answer
  switch (method) {
    case 'initialize': {
      const requested = params && typeof params.protocolVersion === 'string' ? params.protocolVersion : null;
      send({
        id,
        result: {
          protocolVersion: requested ?? DEFAULT_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      });
      return;
    }
    case 'ping':
      send({ id, result: {} });
      return;
    case 'tools/list':
      send({ id, result: { tools: [TOOL] } });
      return;
    case 'tools/call': {
      const name = params?.name;
      if (name !== TOOL_NAME) {
        send({ id, result: textResult(`unknown tool: ${name}`, true) });
        return;
      }
      let result;
      try {
        result = runMemoryQuery(params.arguments ?? {});
      } catch (err) {
        result = textResult(`memory_query failed: ${err?.message ?? err}`, true);
      }
      send({ id, result });
      return;
    }
    default:
      rpcError(id, -32601, `method not found: ${method}`);
  }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    rpcError(null, -32700, 'parse error');
    return;
  }
  handle(msg);
});
rl.on('close', () => process.exit(0));
