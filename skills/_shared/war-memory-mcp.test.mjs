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
import { walkCorpus, renderPromptBlock } from './war-memory.mjs';

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
    // the byte budget (war-memory.mjs DEFAULT_BUDGET) cuts hits below topK; the schema says so
    assert.match(schema.properties.topK.description, /output is also capped near 4 KB/);
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
    // a relative root would resolve against the server cwd (PIN-2): refused for local and repo alike
    const relLocal = await s.call('tools/call', { name: 'memory_query', arguments: { query: 'x', local: 'x/.claude/projects/y/memory' } });
    assert.equal(relLocal.result.isError, true);
    assert.match(relLocal.result.content[0].text, /`local` must be an absolute path/);
    const relRepo = await s.call('tools/call', { name: 'memory_query', arguments: { query: 'x', repo: 'docs/learnings' } });
    assert.equal(relRepo.result.isError, true);
    assert.match(relRepo.result.content[0].text, /`repo` must be an absolute path/);
  } finally { await s.close(); }
});

test('protocol: after stdin closes with replies still queued, the process exits 0 on its own and every reply arrives', async () => {
  // Pipe repro of the async-stdout case: a burst of requests overfills the stdout pipe, then stdin
  // closes at once. With process.exit in the close handler, most of the queued replies are lost
  // (74 of 500 arrived on macOS); without it the process drains stdout and then exits by itself.
  const N = 500;
  const s = startServer();
  const replies = Promise.all(Array.from({ length: N }, () => s.call('tools/list', {})));
  const exit = await s.close();
  assert.equal(exit.code, 0, `exit ${JSON.stringify(exit)}\n${s.stderr()}`);
  const list = await replies;
  assert.equal(list.length, N);
  for (const r of list) assert.deepEqual(r.result.tools.map((t) => t.name), ['memory_query']);
});

// Line-shape binding: the server hand-copies the CLI's formatLessonLine shape (not exported). This
// row pins the two shapes together: a hit line is the CLI's prompt-block line, with ` (archived)`
// spliced between `)` and `:` when every copy is archived, plus ` · <file>`.
test('hit line shape: a server hit equals the CLI prompt-block line plus the (archived) tag and the file path', async () => {
  const local = tmpDir();
  lessonFile(local, 'shape-hot', {
    description: 'shape binding hot lesson',
    meta: { type: 'project', provenance: 'code-verified', phase: 3, keywords: ['shape', 'binding'] },
  });
  lessonFile(join(local, 'archive'), 'shape-cold', {
    description: 'shape binding archived lesson',
    meta: { type: 'project', provenance: 'agent-unverified', keywords: ['shape', 'binding'] },
  });
  const records = walkCorpus({ local });
  const cliLine = (slug) => {
    const rec = records.find((r) => r.slug === slug);
    return { line: renderPromptBlock([rec]).split('\n')[1], file: rec.file };
  };
  const s = startServer();
  try {
    await handshake(s);
    const { text } = await query(s, { query: 'shape binding', local });
    const lines = text.split('\n').filter((l) => l.startsWith('- ['));
    assert.equal(lines.length, 2, text);
    const hot = cliLine('shape-hot');
    assert.ok(lines.includes(`${hot.line} · ${hot.file}`), `hot hit = CLI line + file:\n${text}`);
    const cold = cliLine('shape-cold');
    assert.ok(cold.line.includes('): '), cold.line);
    const taggedCold = cold.line.replace('): ', ') (archived): ');
    assert.ok(lines.includes(`${taggedCold} · ${cold.file}`), `archived hit = CLI line + tag + file:\n${text}`);
  } finally { await s.close(); rmSync(local, { recursive: true, force: true }); }
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

// ES2-adjacent: the collapse judges every copy in the walked corpus, not only the copies the
// query matched. Twins drift apart (a tighten pass shortens one copy's text), so a copy can miss
// every query term while its twin matches. Slugs here carry no query term: name is indexed, so a
// slug sharing a term would make every copy match and the row could not reach the case.
test('collapse over drifted twins: an unmatched hot copy still beats a matched archived twin, an unmatched repo copy still beats a matched local copy, and a slug with no matched copy is no hit', async () => {
  const local = tmpDir();
  const repo = tmpDir();
  const hit = { type: 'project', provenance: 'code-verified', keywords: ['gitlink', 'bump'] };
  const miss = { type: 'project', provenance: 'code-verified', keywords: ['other'] };
  // local hot copy misses the query; repo archived twin matches → the hot file, no (archived)
  lessonFile(local, 'drifted-twin', { description: 'short hot text', meta: miss });
  lessonFile(join(repo, 'archive'), 'drifted-twin', { description: 'gitlink bump long archived text', meta: hit });
  // both hot: repo copy misses, local copy matches → the repo file still wins at the same state
  lessonFile(repo, 'drifted-roots', { description: 'short repo text', meta: miss });
  lessonFile(local, 'drifted-roots', { description: 'gitlink bump local text', meta: hit });
  // boundary: no copy matches → the slug never appears, whatever its copies' state
  lessonFile(local, 'never-matched', { description: 'short hot text', meta: miss });
  lessonFile(join(repo, 'archive'), 'never-matched', { description: 'short archived text', meta: miss });
  const s = startServer();
  try {
    await handshake(s);
    const { text } = await query(s, { query: 'gitlink bump', local, repo, topK: 20 });
    const lines = text.split('\n').filter((l) => l.startsWith('- ['));
    const only = (slug) => {
      const rows = lines.filter((l) => l.startsWith(`- [${slug}]`));
      assert.equal(rows.length, 1, `${slug}: one hit\n${text}`);
      return rows[0];
    };
    const twin = only('drifted-twin');
    assert.ok(!twin.includes('(archived)'), `an unmatched hot copy exists, so no (archived): ${twin}`);
    assert.ok(twin.includes(join(local, 'drifted-twin.md')), `the unmatched hot copy's file: ${twin}`);
    assert.ok(twin.includes('short hot text'), `the hot copy's own description: ${twin}`);
    const roots = only('drifted-roots');
    assert.ok(!roots.includes('(archived)'), roots);
    assert.ok(roots.includes(join(repo, 'drifted-roots.md')), `the unmatched repo copy's file: ${roots}`);
    assert.ok(!text.includes('[never-matched]'), `no matched copy → no hit:\n${text}`);
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
  // local sits under the server-side anchor */.claude/projects/*/memory so the append is allowed
  const localBase = tmpDir();
  const local = join(localBase, '.claude', 'projects', 'x', 'memory');
  mkdirSync(local, { recursive: true });
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
    // (c) local names a missing dir that passes the anchor → the stat-missing branch runs,
    // no directory is created (not the leaf, not its parent), the query still answers
    const missing = join(localBase, '.claude', 'projects', 'y', 'memory');
    const c = await query(s, { query: 'floor exit code', local: missing, repo });
    assert.match(c.text, /\[floor-exit-repo\]/);
    assert.ok(!existsSync(missing), 'a missing local dir is never created');
    assert.ok(!existsSync(join(localBase, '.claude', 'projects', 'y')), 'no parent dir is created either');
  } finally {
    await s.close();
    for (const d of [localBase, repo, cwd]) rmSync(d, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// RA1 — server-side local anchor: the append mirrors the hook's memory_fence
// ---------------------------------------------------------------------------

test('RA1: the server appends the query log only under */.claude/projects/*/memory with no .. segment; a refused append still returns hits', async () => {
  const meta = { type: 'project', provenance: 'code-verified', keywords: ['anchor', 'fence'] };
  // (a) an existing directory outside the anchor
  const outside = tmpDir();
  lessonFile(outside, 'anchor-outside', { description: 'anchor fence outside lesson', meta });
  // (b) a path with a `..` segment that resolves to a directory inside the anchor
  const base = tmpDir();
  const inside = join(base, '.claude', 'projects', 'x', 'memory');
  lessonFile(inside, 'anchor-inside', { description: 'anchor fence inside lesson', meta });
  const dotdot = `${inside}/../memory`;
  const s = startServer();
  try {
    await handshake(s);
    const a = await query(s, { query: 'anchor fence', local: outside });
    assert.match(a.text, /\[anchor-outside\]/, 'hits return though the append is refused');
    assert.ok(!existsSync(join(outside, QUERY_LOG)), 'no log outside the anchor');
    const b = await query(s, { query: 'anchor fence', local: dotdot });
    assert.match(b.text, /\[anchor-inside\]/, 'hits return though the append is refused');
    assert.ok(!existsSync(join(inside, QUERY_LOG)), 'no log through a .. segment');
    // (c) a directory inside the anchor gets one log line
    const c = await query(s, { query: 'anchor fence', local: inside });
    assert.match(c.text, /\[anchor-inside\]/);
    const lines = readFileSync(join(inside, QUERY_LOG), 'utf8').split('\n').filter(Boolean);
    assert.equal(lines.length, 1);
    // (d) one trailing `/` is tolerated, like the hook
    await query(s, { query: 'anchor fence', local: `${inside}/` });
    assert.equal(readFileSync(join(inside, QUERY_LOG), 'utf8').split('\n').filter(Boolean).length, 2);
  } finally {
    await s.close();
    for (const d of [outside, base]) rmSync(d, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// ES4 — node:sqlite forced unavailable: memory disabled, server stays up
// ---------------------------------------------------------------------------

test('ES4: with node:sqlite forced unavailable, memory_query returns a memory disabled result and the same process still answers tools/list', async () => {
  // `local` sits under the anchor, so the no-log assertion fails if the disabled path appends.
  const base = tmpDir();
  const local = join(base, '.claude', 'projects', 'x', 'memory');
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
  } finally { await s.close(); rmSync(base, { recursive: true, force: true }); }
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
