// war-memory-mcp.test.mjs — spawns the stdio MCP server and drives it over JSON-RPC
// (plan 2026-10-27-memory-query-mcp-tool Task 1.1). Each End-state test title carries
// its `ES<n>:` prefix so the plan's per-condition `--test-name-pattern` checks find it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, 'war-memory-mcp.mjs');
const QUERY_LOG = 'war-memory-queries.jsonl';

// Same fixture writer shape as war-memory.test.mjs: frontmatter + body, metadata.* from `meta`.
function lessonFile(dir, slug, { description, meta = {}, body = 'body text' } = {}) {
  const md = { node_type: 'memory', slug, ...meta };
  const lines = ['---', `name: ${slug}`];
  if (description !== undefined) lines.push(`description: "${description}"`);
  lines.push('metadata:');
  for (const [k, v] of Object.entries(md)) {
    if (Array.isArray(v)) {
      lines.push(`  ${k}:`);
      for (const item of v) lines.push(`    - ${item}`);
    } else {
      lines.push(`  ${k}: ${v}`);
    }
  }
  lines.push('---', '', body, '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${slug}.md`), lines.join('\n'));
}

function tmpDir() {
  return mkdtempSync(join(tmpdir(), 'war-memory-mcp-'));
}

// Spawn one server process. `call` sends a request and resolves on the reply with the
// same id. Replies are matched by id, so ordering is not assumed.
function startServer({ env = {}, cwd } = {}) {
  const child = spawn(process.execPath, [SERVER], {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const pending = new Map();
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += String(d); });
  const rl = createInterface({ input: child.stdout });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); p(msg); }
  });
  let nextId = 1;
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return {
    child,
    call(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, resolve);
        const t = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}\n${stderr}`)); }, 15_000);
        pending.set(id, (msg) => { clearTimeout(t); resolve(msg); });
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });
    },
    notify(method, params) {
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
    },
    raw(text) { child.stdin.write(text + '\n'); },
    async close() {
      child.stdin.end();
      const r = await Promise.race([exited, new Promise((res) => setTimeout(() => res({ code: 'hung' }), 5000))]);
      if (r.code === 'hung') child.kill('SIGKILL');
      return r;
    },
    stderr: () => stderr,
  };
}

async function handshake(s) {
  const init = await s.call('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'test', version: '0' },
  });
  s.notify('notifications/initialized', {});
  return init;
}

async function query(s, args) {
  const r = await s.call('tools/call', { name: 'memory_query', arguments: args });
  assert.equal(r.error, undefined, `tools/call returned a JSON-RPC error: ${JSON.stringify(r.error)}`);
  const text = (r.result.content || []).map((c) => c.text).join('\n');
  return { result: r.result, text };
}

// ---------------------------------------------------------------------------
// Protocol shape
// ---------------------------------------------------------------------------

test('protocol: initialize answers with serverInfo and a tools capability; tools/list names memory_query', async () => {
  const s = startServer();
  try {
    const init = await handshake(s);
    assert.equal(init.jsonrpc, '2.0');
    assert.equal(typeof init.result.protocolVersion, 'string');
    assert.ok(init.result.capabilities.tools, 'tools capability advertised');
    assert.equal(init.result.serverInfo.name, 'war-memory');
    const list = await s.call('tools/list', {});
    assert.deepEqual(list.result.tools.map((t) => t.name), ['memory_query']);
    const schema = list.result.tools[0].inputSchema;
    assert.deepEqual(schema.required, ['query']);
    assert.deepEqual(Object.keys(schema.properties).sort(), ['local', 'query', 'repo', 'topK']);
  } finally { await s.close(); }
});

test('protocol: unknown method is -32601, malformed JSON is -32700, unknown tool and bad arguments are isError results', async () => {
  const s = startServer();
  try {
    await handshake(s);
    const unknown = await s.call('resources/list', {});
    assert.equal(unknown.error.code, -32601);
    const ping = await s.call('ping', {});
    assert.deepEqual(ping.result, {});
    // malformed line: the reply carries id null; the next real call still answers
    s.raw('{this is not json');
    const after = await s.call('ping', {});
    assert.deepEqual(after.result, {});
    const noTool = await s.call('tools/call', { name: 'nope', arguments: {} });
    assert.equal(noTool.result.isError, true);
    const noQuery = await s.call('tools/call', { name: 'memory_query', arguments: {} });
    assert.equal(noQuery.result.isError, true);
    assert.match(noQuery.result.content[0].text, /query/);
    const badTopK = await s.call('tools/call', { name: 'memory_query', arguments: { query: 'x', topK: 0 } });
    assert.equal(badTopK.result.isError, true);
    assert.match(badTopK.result.content[0].text, /topK/);
  } finally { await s.close(); }
});

// ---------------------------------------------------------------------------
// ES1 — an archived lesson is returned, tagged (archived)
// ---------------------------------------------------------------------------

test('ES1: memory_query over a fixture corpus returns an archived lesson tagged (archived)', async () => {
  const local = tmpDir();
  lessonFile(join(local, 'archive'), 'semaphore-permit-leak', {
    description: 'a leaked semaphore permit needs a drain assertion',
    meta: { type: 'project', provenance: 'code-verified', keywords: ['semaphore', 'permit', 'drain'] },
  });
  lessonFile(local, 'unrelated-hot-lesson', {
    description: 'worktree paths rot across the merge queue',
    meta: { type: 'project', provenance: 'agent-unverified', keywords: ['worktree'] },
  });
  const s = startServer();
  try {
    await handshake(s);
    const { result, text } = await query(s, { query: 'semaphore permit drain', local });
    assert.notEqual(result.isError, true, text);
    assert.match(text, /\[semaphore-permit-leak\] \(code-verified\) \(archived\):/);
    assert.ok(!text.includes('[unrelated-hot-lesson]'), 'the unrelated hot lesson does not match');
  } finally { await s.close(); rmSync(local, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------
// ES2 — one slug with several copies collapses to one hit per D3
// ---------------------------------------------------------------------------

test('ES2: one slug with several copies yields one hit: hot beats archived, repo beats local at the same state, (archived) only when every copy is archived', async () => {
  const local = tmpDir();
  const repo = tmpDir();
  const meta = { type: 'project', provenance: 'code-verified', keywords: ['gitlink', 'bump'] };
  // hot-vs-archived: local hot + repo archived → the local hot copy wins, no (archived)
  lessonFile(local, 'gitlink-hot-vs-cold', { description: 'gitlink bump hot local copy', meta });
  lessonFile(join(repo, 'archive'), 'gitlink-hot-vs-cold', { description: 'gitlink bump archived repo copy', meta });
  // same state, both hot: repo beats local
  lessonFile(local, 'gitlink-both-hot', { description: 'gitlink bump local copy', meta });
  lessonFile(repo, 'gitlink-both-hot', { description: 'gitlink bump repo copy', meta });
  // same state, both archived: repo beats local and the hit is (archived)
  lessonFile(join(local, 'archive'), 'gitlink-both-cold', { description: 'gitlink bump archived local copy', meta });
  lessonFile(join(repo, 'archive'), 'gitlink-both-cold', { description: 'gitlink bump archived repo copy', meta });
  const s = startServer();
  try {
    await handshake(s);
    const { text } = await query(s, { query: 'gitlink bump', local, repo, topK: 20 });
    const lines = text.split('\n').filter((l) => l.startsWith('- ['));
    const count = (slug) => lines.filter((l) => l.startsWith(`- [${slug}]`)).length;
    assert.equal(count('gitlink-hot-vs-cold'), 1, text);
    assert.equal(count('gitlink-both-hot'), 1, text);
    assert.equal(count('gitlink-both-cold'), 1, text);
    const line = (slug) => lines.find((l) => l.startsWith(`- [${slug}]`));
    const hotVsCold = line('gitlink-hot-vs-cold');
    assert.ok(!hotVsCold.includes('(archived)'), `a hot copy exists, so no (archived): ${hotVsCold}`);
    assert.ok(hotVsCold.includes(join(local, 'gitlink-hot-vs-cold.md')), `the hot local copy wins: ${hotVsCold}`);
    const bothHot = line('gitlink-both-hot');
    assert.ok(!bothHot.includes('(archived)'), bothHot);
    assert.ok(bothHot.includes(join(repo, 'gitlink-both-hot.md')), `the repo copy wins at the same state: ${bothHot}`);
    const bothCold = line('gitlink-both-cold');
    assert.ok(bothCold.includes('(archived)'), `every copy archived → (archived): ${bothCold}`);
    assert.ok(bothCold.includes(join(repo, 'archive', 'gitlink-both-cold.md')), `the repo copy wins at the same state: ${bothCold}`);
  } finally {
    await s.close();
    rmSync(local, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// ES3 — query log: only into an existing `local`; never a cwd root; never mkdir
// ---------------------------------------------------------------------------

test('ES3: query log appends one line into an existing local dir; absent local writes nothing and walks no cwd root; a missing local dir is never created', async () => {
  const local = tmpDir();
  const repo = tmpDir();
  const cwd = tmpDir();
  const meta = { type: 'project', provenance: 'code-verified', keywords: ['floor', 'exit', 'code'] };
  lessonFile(local, 'floor-exit-codes', { description: 'floor scripts exit zero one two', meta });
  lessonFile(repo, 'floor-exit-repo', { description: 'floor exit code repo lesson', meta });
  // cwd bait: a `memory/` dir under the server's cwd that must never be walked or written
  lessonFile(join(cwd, 'memory'), 'cwd-bait-floor', { description: 'floor exit code cwd bait', meta });
  const cwdBefore = readdirSync(cwd, { recursive: true }).sort();
  const s = startServer({ cwd, env: { CLAUDE_MEMORY_LOCAL: join(cwd, 'memory'), CLAUDE_MEMORY_REPO: join(cwd, 'memory') } });
  try {
    await handshake(s);
    // (a) local names an existing dir → exactly one log line
    const a = await query(s, { query: 'floor exit code', local });
    assert.match(a.text, /\[floor-exit-codes\]/);
    const logFile = join(local, QUERY_LOG);
    assert.ok(existsSync(logFile), 'query log created inside the existing local dir');
    const logLines = readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    assert.equal(logLines.length, 1);
    const entry = JSON.parse(logLines[0]);
    assert.equal(entry.query, 'floor exit code');
    assert.deepEqual(entry.topSlugs, ['floor-exit-codes']);
    // (b) local absent → nothing written anywhere, the cwd bait root is not walked
    const b = await query(s, { query: 'floor exit code', repo });
    assert.match(b.text, /\[floor-exit-repo\]/);
    assert.ok(!b.text.includes('cwd-bait-floor'), `no cwd-derived root walked: ${b.text}`);
    assert.ok(!b.text.includes('floor-exit-codes'), 'the earlier local root is not remembered across calls');
    assert.deepEqual(readdirSync(cwd, { recursive: true }).sort(), cwdBefore, 'nothing written under cwd');
    assert.ok(!existsSync(join(repo, QUERY_LOG)), 'no log in the repo root');
    assert.equal(readFileSync(logFile, 'utf8').split('\n').filter(Boolean).length, 1, 'the local log did not grow');
    // (c) local names a missing dir → no directory created, the query still answers
    const missing = join(local, 'no-such-dir');
    const c = await query(s, { query: 'floor exit code', local: missing, repo });
    assert.match(c.text, /\[floor-exit-repo\]/);
    assert.ok(!existsSync(missing), 'a missing local dir is never created');
  } finally {
    await s.close();
    for (const d of [local, repo, cwd]) rmSync(d, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// ES4 — node:sqlite forced unavailable: memory disabled, server stays up
// ---------------------------------------------------------------------------

test('ES4: with node:sqlite forced unavailable, memory_query returns a memory disabled result and the same process still answers tools/list', async () => {
  const local = tmpDir();
  lessonFile(local, 'any-lesson', { description: 'any lesson text', meta: { keywords: ['any'] } });
  // Test seam: the server probes the module named by this env var in place of node:sqlite.
  const s = startServer({ env: { WAR_MEMORY_MCP_SQLITE_MODULE: 'node:no-such-builtin-for-this-test' } });
  try {
    await handshake(s);
    const { result, text } = await query(s, { query: 'any lesson', local });
    assert.match(text, /memory disabled/);
    assert.notEqual(result.isError, true, 'fails open: a result, not an error');
    assert.equal(s.child.exitCode, null, 'the server process is still alive');
    const list = await s.call('tools/list', {});
    assert.deepEqual(list.result.tools.map((t) => t.name), ['memory_query']);
    assert.ok(!existsSync(join(local, QUERY_LOG)), 'no query log when memory is disabled');
  } finally { await s.close(); rmSync(local, { recursive: true, force: true }); }
});

test('sqlite seam: with the env var unset the server loads the real node:sqlite and answers a query', async () => {
  const local = tmpDir();
  lessonFile(local, 'real-sqlite-lesson', { description: 'real sqlite path', meta: { keywords: ['sqlite'] } });
  const s = startServer({ env: { WAR_MEMORY_MCP_SQLITE_MODULE: '' } });
  try {
    await handshake(s);
    const { text } = await query(s, { query: 'sqlite', local });
    assert.match(text, /\[real-sqlite-lesson\]/);
  } finally { await s.close(); rmSync(local, { recursive: true, force: true }); }
});
