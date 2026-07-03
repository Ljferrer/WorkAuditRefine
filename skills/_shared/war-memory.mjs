#!/usr/bin/env node
// war-memory — WAR compounding-memory CLI (spec docs/specs/2026-07-03-memory-sqlite-substrate-design.md §4).
//
// Files are canonical. The FTS5 index lives in :memory: for one invocation and is never persisted
// (§4.3) — every verb walks BOTH roots (hot + archive/), parses frontmatter, builds the index fresh.
// Zero new dependencies: node:sqlite + node:fs only. Node >= 24 (DatabaseSync + FTS5).
//
// Design notes (deviations recorded in the WorkerResult):
//   - The projection row summary is the top-level `description` (the servitor authors it as the
//     one-line summary — agents/war-servitor.md template). Files are canonical, so any hand-authored
//     MEMORY.md summary is normalised away at the next render (§4.4 renders are idempotent).
//   - FTS5 significant terms are each wrapped as a quoted phrase and OR-joined: a bare `foo-bar`
//     token makes FTS5 read `bar` as a column filter and throw ("no such column"). Quoting is the fix.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Node < 24 stub (criterion 9). node:sqlite lands in Node 24; on older runtimes
// the import throws ERR_UNKNOWN_BUILTIN_MODULE. Feature-detect once, up front.
// ---------------------------------------------------------------------------
const NODE_LT_24_MSG =
  'war-memory: requires node:sqlite (Node >= 24); memory features disabled';

let DatabaseSync;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  // Every verb exits non-zero with one clear line — no verb ever runs without sqlite.
  process.stderr.write(NODE_LT_24_MSG + '\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Constants (spec §4.4 / §4.5 / §4.6)
// ---------------------------------------------------------------------------
export const HARD_BYTES = 24_400; // read-cap axis; render refuses above this
export const HARD_LINES = 200;    // read-cap axis; render refuses above this
export const WARN_BYTES = 17_000; // advisory: succeed + loud warning + candidates
export const DEFAULT_TOP_K = 10;
export const DEFAULT_BUDGET = 4096; // ~4KB per query block; a CLI flag, not a config key
export const PROJECTION_FILE = 'MEMORY.md';
export const QUERY_LOG_FILE = 'war-memory-queries.jsonl';
export const ARCHIVE_DIR = 'archive';

// Provenance tier ranking (lower rank sorts first / ranks higher). Absent → agent-unverified (§4.4).
export const TIER_RANK = { 'user-confirmed': 0, 'code-verified': 1, 'agent-unverified': 2 };
export const DEFAULT_TIER = 'agent-unverified';
export function tierRank(t) {
  return TIER_RANK[t] ?? TIER_RANK[DEFAULT_TIER];
}

// Routing (§4.6): project → repo iff commitLearnings; user/feedback → local; absent/unknown → local.
export const REPO_TYPES = new Set(['project']);
// Recognized types (§4.6/§4.8): a type the servitor writes deliberately. user/feedback route
// local by design and are NOT "untyped" — only an absent or unrecognized type is untyped.
export const RECOGNIZED_TYPES = new Set(['project', 'user', 'feedback']);
export function routeRoot(type, commitLearnings, lintHit) {
  if (lintHit) return 'local'; // fail-closed: a lint-flagged lesson is demoted to local + reported
  if (REPO_TYPES.has(type) && commitLearnings) return 'repo';
  return 'local'; // user/feedback/absent/unrecognized all route local (fail-safe default)
}

// ---------------------------------------------------------------------------
// Redaction lint (§4.6). Hardcoded pattern array — extending it is editing this
// one array. Config knob deliberately cut (no consumer). The verb REPORTS; callers own fail-closed.
// ---------------------------------------------------------------------------
export const LINT_PATTERNS = [
  { name: 'home-path', re: /\/(?:Users|home)\/[A-Za-z0-9._-]+/g },
  { name: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  // account handles / @-mentions / git-host account-name patterns
  { name: 'handle', re: /(?:^|\s)@[A-Za-z0-9][A-Za-z0-9-]{2,}\b/g },
  { name: 'github-account-url', re: /(?:github\.com|gitlab\.com|bitbucket\.org)\/[A-Za-z0-9][A-Za-z0-9-]+/g },
  { name: 'github-token', re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: 'openai-key', re: /\bsk-[A-Za-z0-9-]{20,}\b/g },
  { name: 'aws-akid', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'pem-header', re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g },
];

// Returns [{ pattern, match }]. An email inside a handle etc. is fine — we report every class hit.
export function lint(text) {
  const hits = [];
  for (const { name, re } of LINT_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      hits.push({ pattern: name, match: m[0].trim() });
      if (m.index === re.lastIndex) re.lastIndex++; // guard zero-width
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Frontmatter parse (§4.2, criterion 1). A deliberately small YAML subset: exactly
// the shape the servitor writes (top-level name/description + a metadata: block with
// scalars, a tags: list, and an optional keywords: list, incl. nested provenance).
// Not a general YAML parser — YAGNI; the corpus is machine-authored to this shape.
// ---------------------------------------------------------------------------
export function parseFrontmatter(src) {
  if (!src.startsWith('---')) return { frontmatter: {}, body: src.trim() };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: {}, body: src.trim() };
  const fmText = src.slice(src.indexOf('\n') + 1, end);
  const body = src.slice(src.indexOf('\n', end + 1) + 1).trim();

  const fm = { metadata: {} };
  const lines = fmText.split('\n');
  let inMeta = false;
  let listKey = null; // when inside a "key:" list, subsequent "  - item" lines feed it
  let listOwner = null; // object the list attaches to (fm or fm.metadata)

  const unquote = (v) => {
    v = v.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    return v;
  };

  for (const raw of lines) {
    if (raw.trim() === '') continue;
    const listItem = raw.match(/^\s+-\s+(.*)$/);
    if (listItem && listKey) {
      listOwner[listKey].push(unquote(listItem[1]));
      continue;
    }
    listKey = null;
    const topLevel = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    const nested = raw.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
    if (topLevel && !raw.startsWith(' ')) {
      const [, key, rest] = topLevel;
      inMeta = key === 'metadata';
      if (inMeta) continue;
      if (rest === '') {
        // top-level list (e.g. an inline-less key) — rare; treat as list container
        fm[key] = [];
        listKey = key;
        listOwner = fm;
      } else {
        fm[key] = unquote(rest);
      }
    } else if (nested && inMeta) {
      const [, key, rest] = nested;
      if (rest === '') {
        fm.metadata[key] = [];
        listKey = key;
        listOwner = fm.metadata;
      } else if (rest.startsWith('[') && rest.endsWith(']')) {
        // inline list: [a, b, c]
        fm.metadata[key] = rest.slice(1, -1).split(',').map((s) => unquote(s)).filter(Boolean);
      } else {
        fm.metadata[key] = unquote(rest);
      }
    }
  }
  return { frontmatter: fm, body };
}

// Normalise one parsed lesson into the row/index shape the rest of the CLI uses.
export function lessonRecord({ frontmatter, body }, { root, temperature, slug, file }) {
  const md = frontmatter.metadata || {};
  const tags = Array.isArray(md.tags) ? md.tags : [];
  const keywords = Array.isArray(md.keywords) ? md.keywords : [];
  return {
    slug: md.slug || slug,
    name: frontmatter.name || md.slug || slug,
    description: frontmatter.description || md.title || '',
    title: md.title || '',
    phase: md.phase != null ? String(md.phase) : '',
    type: md.type || '', // absent → '' → routes local
    provenance: md.provenance || DEFAULT_TIER, // absent provenance ranks agent-unverified
    tags,
    keywords,
    date: md.date || '',
    body,
    root, // 'repo' | 'local'
    temperature, // 'hot' | 'cold'
    file, // absolute path
  };
}

// ---------------------------------------------------------------------------
// Corpus walk (§4.3). Both roots, hot + archive/. Non-existent roots are skipped
// (retrieval fails open — a missing repo root when commitLearnings is off is normal).
// ---------------------------------------------------------------------------
function readLessonsFromDir(dir, root, temperature, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // missing dir → nothing to add
  }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue;
    if (e.name === PROJECTION_FILE) continue; // the projection is not a lesson
    const file = path.join(dir, e.name);
    const slug = e.name.slice(0, -3);
    const parsed = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    out.push(lessonRecord(parsed, { root, temperature, slug, file }));
  }
}

// roots: { repo?: string, local: string }. Returns all lesson records (hot + cold).
export function walkCorpus(roots) {
  const out = [];
  for (const [rootName, base] of Object.entries(roots)) {
    if (!base) continue;
    readLessonsFromDir(base, rootName, 'hot', out);
    readLessonsFromDir(path.join(base, ARCHIVE_DIR), rootName, 'cold', out);
  }
  return out;
}

// ---------------------------------------------------------------------------
// In-memory FTS5 index (§4.3). Built fresh from records; never persisted.
// ---------------------------------------------------------------------------
export function buildIndex(records) {
  const db = new DatabaseSync(':memory:');
  db.exec(
    `CREATE VIRTUAL TABLE docs USING fts5(
       name, description, keywords, tags, body,
       rowid_ref UNINDEXED
     );`
  );
  const ins = db.prepare(
    `INSERT INTO docs (rowid, name, description, keywords, tags, body, rowid_ref)
     VALUES (?,?,?,?,?,?,?)`
  );
  records.forEach((r, i) => {
    ins.run(i, r.name, r.description, r.keywords.join(' '), r.tags.join(' '), r.body, i);
  });
  return db;
}

// text → FTS5 OR-query of significant terms (callers stay dumb). Each term is a
// quoted phrase (a bare `foo-bar` breaks the parser — see head comment). Terms < 2
// chars and pure stopwords dropped.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'is', 'it', 'for', 'with',
  'at', 'by', 'as', 'be', 'this', 'that', 'from', 'was', 'are', 'not', 'no',
]);
export function toFtsQuery(text) {
  const terms = String(text)
    .toLowerCase()
    .split(/[^a-z0-9:_.+-]+/)
    .map((t) => t.replace(/^[-.]+|[-.]+$/g, '')) // trim leading/trailing separators
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  const uniq = [...new Set(terms)];
  if (uniq.length === 0) return null;
  return uniq.map((t) => `"${t.replace(/"/g, '""')}"`).join(' OR ');
}

// Rank records for a query text. Returns records sorted by (BM25, provenance tier, recency).
// Field weights: name/description/keywords/tags >> body (§4.3).
export function rankRecords(db, records, text) {
  const query = toFtsQuery(text);
  if (!query) return [];
  const stmt = db.prepare(
    `SELECT rowid_ref AS ref, bm25(docs, 10.0, 8.0, 8.0, 5.0, 1.0) AS score
       FROM docs WHERE docs MATCH ? ORDER BY score`
  );
  let rows;
  try {
    rows = stmt.all(query);
  } catch {
    return []; // malformed query → fail open, no results
  }
  const scored = rows.map((row) => ({ rec: records[row.ref], score: row.score }));
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score; // lower bm25 = better match
    const tr = tierRank(a.rec.provenance) - tierRank(b.rec.provenance);
    if (tr !== 0) return tr;
    return String(b.rec.date).localeCompare(String(a.rec.date)); // newer first
  });
  return scored.map((s) => s.rec);
}

// ---------------------------------------------------------------------------
// Query prompt block (§4.5). The ONLY output format — no --format.
// ---------------------------------------------------------------------------

// Truncate to top-k then to byte budget. Byte budget counts the rendered block.
export function selectForBudget(records, { topK = DEFAULT_TOP_K, budget = DEFAULT_BUDGET } = {}) {
  const capped = records.slice(0, topK);
  const out = [];
  let bytes = 0;
  for (const r of capped) {
    const line = formatLessonLine(r);
    const size = Buffer.byteLength(line + '\n', 'utf8');
    if (out.length > 0 && bytes + size > budget) break; // always emit at least one
    out.push(r);
    bytes += size;
  }
  return out;
}

// One rendered lesson line for the prompt block (§4.5 format):
//   - [slug] (code-verified, phase 3): <description> — <how-to-apply if present>
function formatLessonLine(r) {
  const phase = r.phase ? `, phase ${r.phase}` : '';
  const desc = r.description || r.title || '';
  return `- [${r.slug}] (${r.provenance}${phase}): ${desc}`;
}

export function renderPromptBlock(records, { seat } = {}) {
  if (records.length === 0) return ''; // empty result ⇒ empty clause ⇒ byte-identical prompt
  const header = seat
    ? `PRIOR LESSONS (memory — trust per provenance tag) [${seat}]:`
    : 'PRIOR LESSONS (memory — trust per provenance tag):';
  return [header, ...records.map(formatLessonLine)].join('\n');
}

// ---------------------------------------------------------------------------
// Projection render (§4.4, criterion 4). Row = table row + tier marker; repo-root
// lessons additionally carry a trailing [repo] marker (the T1↔T3 contract, plan Note 1).
// ---------------------------------------------------------------------------
export function projectionRow(r) {
  const phase = r.phase || '';
  const desc = (r.description || r.title || '').replace(/\|/g, '\\|');
  const repoMark = r.root === 'repo' ? ' [repo]' : '';
  return `| [[${r.slug}]] | ${phase} | ${desc} [${r.provenance}]${repoMark} |`;
}

export const PROJECTION_HEADER = [
  '# Project Memory — WorkAuditRefine',
  '',
  'Index of durable learnings captured by the WAR servitor. (Generated by `war-memory render-index` — do not hand-edit.)',
  '',
  '| slug | phase | summary |',
  '|------|-------|---------|',
];

// Rank candidates for archiving: lowest provenance tier first, then oldest (§4.4).
export function archiveCandidates(hotRecords) {
  return [...hotRecords].sort((a, b) => {
    const tr = tierRank(b.provenance) - tierRank(a.provenance); // lowest tier (highest rank) first
    if (tr !== 0) return tr;
    return String(a.date).localeCompare(String(b.date)); // oldest first
  });
}

// Build the projection text + a budget verdict. Pure — no I/O, so tests can assert directly.
// Returns { text, bytes, lines, verdict: 'ok'|'warn'|'refuse', candidates: [slug...] }.
export function buildProjection(records) {
  const hot = records.filter((r) => r.temperature === 'hot');
  // Invariant hot ≡ indexed: every hot lesson gets exactly one row; cold lessons appear in none.
  const rows = hot.map(projectionRow);
  const text = [...PROJECTION_HEADER, ...rows, ''].join('\n');
  const bytes = Buffer.byteLength(text, 'utf8');
  const lines = text.split('\n').length;
  let verdict = 'ok';
  if (bytes > HARD_BYTES || lines > HARD_LINES) verdict = 'refuse';
  else if (bytes >= WARN_BYTES) verdict = 'warn';
  const candidates = verdict === 'refuse' || verdict === 'warn'
    ? archiveCandidates(hot).map((r) => r.slug)
    : [];
  return { text, bytes, lines, verdict, candidates };
}

// ---------------------------------------------------------------------------
// Consolidate (§4.3, criterion 8): flag near-duplicate pairs among changed lessons.
// Report only. `changedSlugs` is the set of lessons changed since the merge base.
// ---------------------------------------------------------------------------
// A pair is flagged when the other lesson ranks near the changed lesson's OWN self-match
// (self-match is the ceiling). Corpus-size-robust: bm25 absolutes shrink with corpus size,
// so we compare each candidate to the self-score ratio, not to a fixed absolute. The changed
// lesson's slug is excluded from the query (unique-by-construction tokens would skew the self hit).
export function findNearDupes(db, records, changedSlugs, { ratio = 0.6 } = {}) {
  const bySlug = new Map(records.map((r, i) => [r.slug, { rec: r, ref: i }]));
  const pairs = [];
  const seen = new Set();
  const stmt = db.prepare(
    `SELECT rowid_ref AS ref, bm25(docs, 10.0, 8.0, 8.0, 5.0, 1.0) AS score
       FROM docs WHERE docs MATCH ? ORDER BY score LIMIT 5`
  );
  for (const slug of changedSlugs) {
    const entry = bySlug.get(slug);
    if (!entry) continue;
    // content only — not name (== slug); slug tokens are unique and skew the self hit
    const q = toFtsQuery(`${entry.rec.description} ${entry.rec.keywords.join(' ')} ${entry.rec.body}`);
    if (!q) continue;
    let rows;
    try { rows = stmt.all(q); } catch { continue; }
    const selfRow = rows.find((r) => records[r.ref].slug === slug);
    if (!selfRow) continue;
    for (const row of rows) {
      const other = records[row.ref];
      if (other.slug === slug) continue;
      // scores are negative (lower = closer); a near-dupe scores within `ratio` of self.
      if (row.score > selfRow.score * ratio) continue;
      const key = [slug, other.slug].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a: slug, b: other.slug, score: row.score });
    }
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// Migration plan (§4.8, criterion 15). Pure planner: given records + config,
// returns the move/route plan. `--apply` (in the CLI dispatch) executes it.
// A lesson is an overflow/archive candidate if its body carries a [RESOLVED] marker.
// ---------------------------------------------------------------------------
export function migrationPlan(records, { commitLearnings = false } = {}) {
  const toRepo = [];
  const toLocal = [];
  const toArchive = [];
  const untyped = [];
  for (const r of records) {
    if (r.temperature === 'cold') continue; // already archived
    const hits = lint([r.name, r.description, r.title, r.body, r.tags.join(' ')].join('\n'));
    const dest = routeRoot(r.type, commitLearnings, hits.length > 0);
    if (!r.type || !RECOGNIZED_TYPES.has(r.type)) untyped.push(r.slug); // untyped = absent or unrecognized (user/feedback are recognized, route local by design)
    if (dest === 'repo') toRepo.push(r.slug);
    else toLocal.push({ slug: r.slug, demoted: hits.length > 0 });
    if (/\[RESOLVED\]/.test(r.body) || /\[RESOLVED\]/.test(r.description)) toArchive.push(r.slug);
  }
  return { toRepo, toLocal, toArchive, untyped };
}

// ===========================================================================
// CLI dispatch. Kept thin — all logic is in the pure functions above so the unit
// suite exercises behaviour without shelling out.
// ===========================================================================

function resolveRoots(argv) {
  // --local <dir> (required in practice; defaults to $CLAUDE_MEMORY_LOCAL or cwd/.memory for tests)
  // --repo <dir>  (optional; only used when commitLearnings)
  const local = argv.local || process.env.CLAUDE_MEMORY_LOCAL || path.join(process.cwd(), 'memory');
  const repo = argv.repo || process.env.CLAUDE_MEMORY_REPO || null;
  const roots = { local };
  if (repo) roots.repo = repo;
  return roots;
}

function parseArgv(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function appendQueryLog(localRoot, entry) {
  try {
    fs.mkdirSync(localRoot, { recursive: true });
    fs.appendFileSync(path.join(localRoot, QUERY_LOG_FILE), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // query-log append is best-effort; never blocks a query (fail open)
  }
}

function cmdQuery(argv) {
  const roots = resolveRoots(argv);
  const text = argv._.slice(1).join(' ');
  const topK = argv['top-k'] ? Number(argv['top-k']) : DEFAULT_TOP_K;
  const budget = argv.budget ? Number(argv.budget) : DEFAULT_BUDGET;
  const seat = argv.seat || null;
  const records = walkCorpus(roots);
  const db = buildIndex(records);
  const ranked = rankRecords(db, records, text);
  const selected = selectForBudget(ranked, { topK, budget });
  appendQueryLog(roots.local, {
    ts: new Date().toISOString(),
    query: text,
    seat,
    topSlugs: selected.map((r) => r.slug),
    scores: [],
  });
  process.stdout.write(renderPromptBlock(selected, { seat }) + '\n');
}

function cmdQueriesBatch(argv) {
  // --queries <file>: JSONL of { label, text, seat?, topK?, budget? } — one corpus walk, N blocks.
  const roots = resolveRoots(argv);
  const file = argv.queries;
  const records = walkCorpus(roots);
  const db = buildIndex(records);
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  const blocks = [];
  for (const line of lines) {
    const spec = JSON.parse(line);
    const ranked = rankRecords(db, records, spec.text);
    const selected = selectForBudget(ranked, {
      topK: spec.topK ?? DEFAULT_TOP_K,
      budget: spec.budget ?? DEFAULT_BUDGET,
    });
    appendQueryLog(roots.local, {
      ts: new Date().toISOString(),
      query: spec.text,
      seat: spec.seat ?? spec.label ?? null,
      topSlugs: selected.map((r) => r.slug),
      scores: [],
    });
    blocks.push(`### ${spec.label ?? spec.seat ?? 'query'}\n${renderPromptBlock(selected, { seat: spec.seat })}`);
  }
  process.stdout.write(blocks.join('\n\n') + '\n');
}

function cmdRenderIndex(argv) {
  const roots = resolveRoots(argv);
  const records = walkCorpus(roots);
  const { text, bytes, lines, verdict, candidates } = buildProjection(records);
  if (verdict === 'refuse') {
    process.stderr.write(
      `war-memory render-index: REFUSED — projection ${bytes}B / ${lines} lines exceeds a hard axis ` +
        `(${HARD_BYTES}B / ${HARD_LINES} lines). Archive candidates (run \`archive --candidates\`): ` +
        candidates.join(', ') + '\n'
    );
    process.exit(1);
  }
  const out = path.join(roots.local, PROJECTION_FILE);
  const tmp = out + '.tmp';
  fs.mkdirSync(roots.local, { recursive: true });
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, out); // atomic replace
  if (verdict === 'warn') {
    process.stderr.write(
      `war-memory render-index: WARNING — projection ${bytes}B >= ${WARN_BYTES}B advisory. ` +
        `Ranked archive candidates: ${candidates.join(', ')}\n`
    );
  }
  process.stdout.write(`rendered ${out} (${bytes}B, ${lines} lines)\n`);
}

function cmdLint(argv) {
  const paths = argv._.slice(1);
  const targets = paths.length ? paths : [resolveRoots(argv).local];
  let hitCount = 0;
  for (const t of targets) {
    let files = [];
    try {
      const st = fs.statSync(t);
      if (st.isDirectory()) {
        files = fs.readdirSync(t).filter((f) => f.endsWith('.md')).map((f) => path.join(t, f));
      } else {
        files = [t];
      }
    } catch {
      continue;
    }
    for (const f of files) {
      const hits = lint(fs.readFileSync(f, 'utf8'));
      for (const h of hits) {
        hitCount++;
        process.stdout.write(`${f}: ${h.pattern}: ${h.match}\n`);
      }
    }
  }
  if (hitCount > 0) process.exit(1); // fail-closed for CI (gate 3)
  process.stdout.write('lint: clean\n');
}

function cmdArchive(argv) {
  const roots = resolveRoots(argv);
  const records = walkCorpus(roots);
  let slugs;
  if (argv.candidates) {
    const { candidates } = buildProjection(records);
    slugs = candidates;
  } else {
    slugs = argv._.slice(1);
  }
  const bySlug = new Map(records.filter((r) => r.temperature === 'hot').map((r) => [r.slug, r]));
  const note = `\n> archived ${new Date().toISOString().slice(0, 10)}: resolved — moved to archive\n`;
  for (const slug of slugs) {
    const r = bySlug.get(slug);
    if (!r) {
      process.stderr.write(`archive: no hot lesson '${slug}'\n`);
      continue;
    }
    const rootBase = r.root === 'repo' ? roots.repo : roots.local;
    const dst = path.join(rootBase, ARCHIVE_DIR, path.basename(r.file));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.appendFileSync(r.file, note, 'utf8'); // append archive note before moving
    if (r.root === 'repo') {
      // git mv in the repo root (a git repo); fall back to rename if git unavailable
      const res = spawnSync('git', ['-C', rootBase, 'mv', r.file, dst], { encoding: 'utf8' });
      if (res.status !== 0) fs.renameSync(r.file, dst);
    } else {
      fs.renameSync(r.file, dst); // plain mv in the local root (not a git repo)
    }
    process.stdout.write(`archived ${slug} → ${dst}\n`);
  }
  // re-render
  cmdRenderIndex(argv);
}

function cmdConsolidate(argv) {
  const roots = resolveRoots(argv);
  const records = walkCorpus(roots);
  const db = buildIndex(records);
  // changed-since-merge-base: caller passes --changed a,b,c; default = all hot (report-only anyway)
  const changed = argv.changed
    ? String(argv.changed).split(',')
    : records.filter((r) => r.temperature === 'hot').map((r) => r.slug);
  const pairs = findNearDupes(db, records, changed);
  for (const p of pairs) {
    process.stdout.write(`near-dupe: [[${p.a}]] <-> [[${p.b}]] (score ${p.score.toFixed(3)})\n`);
  }
  if (pairs.length === 0) process.stdout.write('consolidate: no near-duplicates flagged\n');
  cmdRenderIndex(argv);
}

function cmdMigrate(argv) {
  const roots = resolveRoots(argv);
  const commitLearnings = !!argv['commit-learnings'];
  const records = walkCorpus(roots);
  const plan = migrationPlan(records, { commitLearnings });
  const apply = !!argv.apply;
  process.stdout.write(`migrate ${apply ? '(APPLY)' : '(dry-run)'}:\n`);
  process.stdout.write(`  → repo root: ${plan.toRepo.join(', ') || '(none)'}\n`);
  process.stdout.write(`  → local root: ${plan.toLocal.map((x) => x.slug + (x.demoted ? ' [demoted]' : '')).join(', ') || '(none)'}\n`);
  process.stdout.write(`  → archive: ${plan.toArchive.join(', ') || '(none)'}\n`);
  process.stdout.write(`  untyped (routed local, retype to commit): ${plan.untyped.join(', ') || '(none)'}\n`);
  if (apply) {
    // create archive/ and move [RESOLVED] candidates; then render
    const localArchive = path.join(roots.local, ARCHIVE_DIR);
    fs.mkdirSync(localArchive, { recursive: true });
    const bySlug = new Map(records.map((r) => [r.slug, r]));
    for (const slug of plan.toArchive) {
      const r = bySlug.get(slug);
      if (!r || r.temperature === 'cold') continue;
      const base = r.root === 'repo' ? roots.repo : roots.local;
      const dst = path.join(base, ARCHIVE_DIR, path.basename(r.file));
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(r.file, dst);
    }
    cmdRenderIndex(argv);
  }
}

const VERBS = {
  query: cmdQuery,
  'render-index': cmdRenderIndex,
  archive: cmdArchive,
  lint: cmdLint,
  consolidate: cmdConsolidate,
  migrate: cmdMigrate,
};

// Entry point — only when run directly, not when imported by the test suite.
function main() {
  const argv = parseArgv(process.argv.slice(2));
  const verb = argv._[0];
  if (argv.queries) return cmdQueriesBatch(argv);
  const fn = VERBS[verb];
  if (!fn) {
    process.stderr.write(
      `war-memory: unknown verb '${verb ?? ''}'. Verbs: ${Object.keys(VERBS).join(', ')}, --queries <file>\n`
    );
    process.exit(1);
  }
  fn(argv);
}

// import.meta.url === entrypoint → running as CLI (not when imported by the test suite)
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main();
}
