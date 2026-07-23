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
export const WARN_BYTES = 17_000; // advisory: succeed + loud warning + candidates + `/lessons-learned tighten`
export const SUMMARY_CELL_BYTES = 160; // per-cell render cap for the 2-col projection summary (tighten spec §4)
export const TIGHTEN_SLACK_BYTES = 500; // tighten-plan cuts to target − this slack (spec §3 eviction policy)
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

// Effective date (tighten floor, red-team adjudication 2026-07-21; VALIDATED per #989): the
// newest **valid, non-future** ISO date (YYYY-MM-DD) among the four frontmatter date keys
// (created/updated/modified/date) AND any `20\d\d-\d\d-\d\d` match in the phase/description
// prose — recurrence stamps live ONLY in prose, invisible to a frontmatter-key reader. A
// date-SHAPED match is not a date: every token must survive two checks before it can win.
//   1. UTC round-trip — `Date.parse(token + 'T00:00:00Z')` must not be NaN. The engine's ISO
//      parse IS the month/day range check (`2026-13-45`/`2026-00-10`/`2026-12-00` are rejected);
//      `2026-02-31` rolls over to early March, a bounded residual accepted by design.
//   2. Future bound — the parse must not exceed `now + FUTURE_SKEW_MS`, so a stray forward-dated
//      token (the `2099-01-01` shape) can no longer protect a lesson from eviction forever.
// Returns the newest SURVIVING token, or null when none survives — no fallback to a rejected
// token: an undated lesson is PROTECTED by the caller (treated as within the young-window), so
// the fail-safe direction is preserved. `now` is injectable for deterministic tests.
export function effectiveDate(sources = [], { now = new Date() } = {}) {
  const ISO = /20\d\d-\d\d-\d\d/g;
  const horizon = now.getTime() + FUTURE_SKEW_MS;
  let newest = null;
  for (const src of sources) {
    if (src == null) continue;
    for (const token of String(src).match(ISO) || []) {
      const ms = Date.parse(token + 'T00:00:00Z');
      if (Number.isNaN(ms) || ms > horizon) continue;
      // zero-padded ISO ⇒ plain string comparison IS chronological; taken over SURVIVORS only
      if (newest === null || token > newest) newest = token;
    }
  }
  return newest;
}

// Normalise one parsed lesson into the row/index shape the rest of the CLI uses.
export function lessonRecord({ frontmatter, body }, { root, temperature, slug, file }) {
  const md = frontmatter.metadata || {};
  const tags = Array.isArray(md.tags) ? md.tags : [];
  const keywords = Array.isArray(md.keywords) ? md.keywords : [];
  const description = frontmatter.description || md.title || '';
  const phase = md.phase != null ? String(md.phase) : '';
  return {
    slug: md.slug || slug,
    name: frontmatter.name || md.slug || slug,
    description,
    title: md.title || '',
    phase,
    type: md.type || '', // absent → '' → routes local
    provenance: md.provenance || DEFAULT_TIER, // absent provenance ranks agent-unverified
    tags,
    keywords,
    date: md.date || '',
    // Newest VALID, non-future stamp anywhere (frontmatter date keys + prose recurrence dates);
    // null ⇒ undated (no token survived validation) ⇒ PROTECTED. Wall clock by design here.
    effectiveDate: effectiveDate([md.created, md.updated, md.modified, md.date, phase, description]),
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
// Projection render (§4.4, criterion 4). The projection is a bounded TWO-COLUMN view
// (ADR: "The index projection is a bounded two-column view"): `| [[slug]] | summary |`.
// The `phase` column is dropped from the PROJECTION only — frontmatter keeps the full
// recurrence trail, which stays the housekeeping graduation signal. The summary cell is
// the description text, then the provenance tag, then the optional trailing [repo] marker
// (repo-root lessons; the T1↔T3 contract, plan Note 1). buildProjection collapses
// cross-root slug twins to the single repo row before rendering (#821).
// ---------------------------------------------------------------------------

// Truncate `text` so its UTF-8 byte length ≤ maxBytes, appending a … ellipsis when it
// had to cut. Iterates by code point so a multibyte char is never split. Load-bearing
// for marker-safe rows: callers truncate the DESCRIPTION here, THEN append the
// [tier]/[repo] markers — so the markers are never inside the truncated span (the
// safe-swap repo-completeness gate + row classifiers key on the trailing markers).
export function truncateToBytes(text, maxBytes) {
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) return text;
  const ELLIPSIS = '…';
  const room = maxBytes - Buffer.byteLength(ELLIPSIS, 'utf8');
  let out = '';
  let bytes = 0;
  for (const ch of text) {
    const b = Buffer.byteLength(ch, 'utf8');
    if (bytes + b > room) break;
    out += ch;
    bytes += b;
  }
  return out + ELLIPSIS;
}

export function projectionRow(r) {
  // Truncate the raw description FIRST (marker-safe), THEN escape pipes so the cut never
  // lands mid-escape-sequence, THEN append the tags — the [tier]/[repo] markers are
  // appended after truncation and can never be severed.
  const desc = truncateToBytes(r.description || r.title || '', SUMMARY_CELL_BYTES).replace(/\|/g, '\\|');
  const repoMark = r.root === 'repo' ? ' [repo]' : '';
  return `| [[${r.slug}]] | ${desc} [${r.provenance}]${repoMark} |`;
}

export const PROJECTION_HEADER = [
  '# Project Memory — WorkAuditRefine',
  '',
  'Index of durable learnings captured by the WAR servitor. (Generated by `war-memory render-index` — do not hand-edit.)',
  '',
  '| slug | summary |',
  '|------|---------|',
];

// Rank candidates for archiving: lowest provenance tier first, then local-before-repo,
// then oldest (§4.4). Within a tier a local row is the cheaper archive (a repo row is
// human-reviewed committed corpus), so nominate locals before repos before falling to date.
export function archiveCandidates(hotRecords) {
  return [...hotRecords].sort((a, b) => {
    const tr = tierRank(b.provenance) - tierRank(a.provenance); // lowest tier (highest rank) first
    if (tr !== 0) return tr;
    if (a.root !== b.root) return a.root === 'repo' ? 1 : -1; // equal tier → local before repo
    return String(a.date).localeCompare(String(b.date)); // oldest first
  });
}

// Build the projection text + a budget verdict. Pure — no I/O, so tests can assert directly.
// Returns { text, bytes, lines, verdict: 'ok'|'warn'|'refuse', candidates: [slug...] }.
export function buildProjection(records) {
  const hot = records.filter((r) => r.temperature === 'hot');
  // Invariant hot ≡ indexed: every hot *fact* gets exactly one row; cold lessons appear in none.
  // A promoted lesson lives in both roots but is ONE fact — collapse the cross-root twin
  // to a single row here, keeping the repo copy and shadowing the local twin (dropped from
  // the projection input only; walkCorpus, query ranking, inboundCiters, and lint still see
  // BOTH copies — dedup lives in projection rendering, never promotion or indexing). The
  // dedup key is bare slug: a cross-root slug collision ⇒ same fact, because Gate-2 promotion
  // is the only cross-root copy path, so an unrelated same-slug pair cannot arise (#821).
  const repoSlugs = new Set(hot.filter((r) => r.root === 'repo').map((r) => r.slug));
  const deduped = hot.filter((r) => r.root === 'repo' || !repoSlugs.has(r.slug));
  const rows = deduped.map(projectionRow);
  const text = [...PROJECTION_HEADER, ...rows, ''].join('\n');
  const bytes = Buffer.byteLength(text, 'utf8');
  const lines = text.split('\n').length;
  let verdict = 'ok';
  if (bytes > HARD_BYTES || lines > HARD_LINES) verdict = 'refuse';
  else if (bytes >= WARN_BYTES) verdict = 'warn';
  const candidates = verdict === 'refuse' || verdict === 'warn'
    ? archiveCandidates(deduped).map((r) => r.slug) // deduped: a shadowed twin costs 0 bytes, nominating it recovers nothing
    : [];
  return { text, bytes, lines, verdict, candidates };
}

// Records (excluding the slug's own file) whose body cites [[slug]]. Pure — the
// mechanical inbound count that the Phase-3 hub-check prose grep becomes. hotOnly
// restricts to hot temperature (the archive hub-WARN counts only the hot index rows lost).
export function inboundCiters(records, slug, { hotOnly = false } = {}) {
  const needle = `[[${slug}]]`;
  return records.filter(
    (r) => r.slug !== slug && (!hotOnly || r.temperature === 'hot') && r.body.includes(needle)
  );
}

// ---------------------------------------------------------------------------
// tighten-plan (spec §4 / §3 eviction policy): a read-only, usage-scored eviction
// PLAN over the deduped projection rows. PURE — emits the ranked plan, never mutates.
// `hits` maps slug → per-entry-deduped query-log hit count (absent/empty log ⇒ all 0, so
// the order degrades to today's tier+age eviction order). `now` is injectable for
// deterministic tests. The returned `verdict` is NOT `buildProjection`'s own read: it is the
// STRICTER of that advisory read and the effective `--target` (#992) — see below.
// Floors (ineligible, never listed): user-confirmed tier; a hub with
// ≥ 2 distinct inbound citers; a lesson whose EFFECTIVE date is within TIGHTEN_YOUNG_DAYS —
// and an UNDATED lesson (no VALID, non-future date token anywhere) is PROTECTED, treated as
// within-window.
// ---------------------------------------------------------------------------
export const TIGHTEN_YOUNG_DAYS = 14;
const DAY_MS = 86_400_000;
// How far past `now` a date token may still be read as real (#989). 48 h — comfortably above the
// ≤ ~26 h worst-case UTC-midnight-vs-local-date skew, far below any abuse horizon. Module-private:
// the boundary is exercised through `effectiveDate`'s injectable `now`, so exporting it is
// speculative surface. Read at call time, never during module evaluation (no TDZ hazard).
const FUTURE_SKEW_MS = 48 * 60 * 60 * 1000;

export function tightenPlan(records, { hits = new Map(), target = WARN_BYTES, now = new Date() } = {}) {
  const { bytes: currentBytes, verdict: projectionVerdict } = buildProjection(records);
  // Target-aware severity (#992): `refuse` passes straight through; `warn` fires on the advisory
  // projection's own warn OR at `currentBytes >= target` — equivalently the effective trigger is
  // `currentBytes >= min(target, WARN_BYTES)`. So a sub-advisory `--target` binds the preflight at
  // that target, while a target ABOVE the advisory never suppresses the advisory warn (the two
  // surfaces must not fork). With the default `target = WARN_BYTES` this is byte-identical to the
  // projection verdict, so the default path is untouched. `buildProjection` itself is unchanged —
  // render-index and archive still read the pure advisory verdict.
  const verdict = projectionVerdict === 'refuse'
    ? 'refuse'
    : projectionVerdict === 'warn' || currentBytes >= target
      ? 'warn'
      : 'ok';
  const hot = records.filter((r) => r.temperature === 'hot');
  // Same cross-root dedup as buildProjection: a promoted twin collapses to the repo copy.
  const repoSlugs = new Set(hot.filter((r) => r.root === 'repo').map((r) => r.slug));
  const deduped = hot.filter((r) => r.root === 'repo' || !repoSlugs.has(r.slug));
  // A slug hot in BOTH roots is a cross-root dupe: archiving one copy frees 0 projection
  // bytes (the twin resurfaces), so eviction is a both-copies-or-nothing unit.
  const localSlugs = new Set(hot.filter((r) => r.root === 'local').map((r) => r.slug));
  const nowMs = now.getTime();

  const eligible = [];
  for (const r of deduped) {
    // Floor 1: user-confirmed is never evicted.
    if (tierRank(r.provenance) === TIER_RANK['user-confirmed']) continue;
    // Floor 2: a hub (≥ 2 distinct inbound citers, both roots) is never evicted.
    const inbound = new Set(inboundCiters(records, r.slug).map((c) => c.slug)).size;
    if (inbound >= 2) continue;
    // Floor 3: within the young window (or undated ⇒ protected) is never evicted.
    if (!r.effectiveDate) continue; // undated ⇒ PROTECTED (treated as within-window)
    const effMs = Date.parse(r.effectiveDate + 'T00:00:00Z');
    // Defense-in-depth backstop, NOT the validation itself — `effectiveDate` now rejects any token
    // that fails the UTC round-trip, so a corpus-walked record cannot reach here with an unparseable
    // stamp. Kept because `tightenPlan` is exported and takes caller-built records (tests inject
    // arbitrary `effectiveDate` strings): protected, never a NaN age.
    if (Number.isNaN(effMs)) continue;
    const ageDays = Math.floor((nowMs - effMs) / DAY_MS);
    if (ageDays < TIGHTEN_YOUNG_DAYS) continue;
    const entry = {
      slug: r.slug,
      hits: hits.get(r.slug) ?? 0,
      tier: r.provenance,
      ageDays,
      inbound,
      bytesFreed: Buffer.byteLength(projectionRow(r) + '\n', 'utf8'),
    };
    if (r.root === 'repo' && localSlugs.has(r.slug)) {
      // Both-copies-or-nothing: bytesFreed is the UNIT saving (the row is removed only when
      // BOTH copies are archived); a single copy frees 0. Never a single-copy claim.
      entry.dupe = true;
      entry.copies = ['local', 'repo'];
    }
    eligible.push(entry);
  }

  // Eviction order: ascending hits, ties by tier rank (lowest tier first) then age (oldest first).
  eligible.sort((a, b) => {
    if (a.hits !== b.hits) return a.hits - b.hits;
    const tr = tierRank(b.tier) - tierRank(a.tier); // lowest tier (highest rank #) evicted first
    if (tr !== 0) return tr;
    return b.ageDays - a.ageDays; // oldest (largest age) first
  });

  // Cumulative cut line: strike from the top until cumulative bytesFreed reaches the goal
  // (currentBytes down to target − slack). Running total annotated on every entry.
  const cutGoal = Math.max(0, currentBytes - (target - TIGHTEN_SLACK_BYTES));
  let running = 0;
  let cutIndex = 0;
  for (let i = 0; i < eligible.length; i++) {
    running += eligible[i].bytesFreed;
    eligible[i].cumulativeFreed = running;
    if (cutGoal > 0 && cutIndex === 0 && running >= cutGoal) cutIndex = i + 1;
  }
  const totalFreed = running;
  const reached = cutGoal === 0 || totalFreed >= cutGoal;
  if (cutGoal > 0 && !reached) cutIndex = eligible.length; // full list still short of the goal
  const struckFreed = eligible.slice(0, cutIndex).reduce((s, e) => s + e.bytesFreed, 0);

  return {
    target,
    slack: TIGHTEN_SLACK_BYTES,
    currentBytes,
    verdict,
    cutGoalBytes: cutGoal,
    cutIndex,
    projectedBytes: currentBytes - struckFreed,
    shortfallBytes: reached ? 0 : cutGoal - totalFreed,
    eligible,
  };
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
    if (!r.type || !REPO_TYPES.has(r.type)) untyped.push(r.slug);
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
  // --local <dir> (or $CLAUDE_MEMORY_LOCAL). NO cwd fallback: a guessed <cwd>/memory
  // silently materializes a stray dir at whatever repo root the caller ran from, and
  // queries walk that empty root instead of the project store. Read verbs treat an
  // absent local root as an empty corpus; write verbs must requireLocal() and fail loud.
  // --repo <dir>  (optional; only used when commitLearnings)
  const local = argv.local || process.env.CLAUDE_MEMORY_LOCAL || null;
  const repo = argv.repo || process.env.CLAUDE_MEMORY_REPO || null;
  const roots = {};
  if (local) roots.local = local;
  if (repo) roots.repo = repo;
  return roots;
}

function requireLocal(roots, verb) {
  if (!roots.local) {
    process.stderr.write(`war-memory ${verb}: --local <dir> required (or set CLAUDE_MEMORY_LOCAL)\n`);
    process.exit(1);
  }
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
  if (!localRoot) return; // no --local resolved → nothing to log (never guess a cwd root)
  try {
    fs.mkdirSync(localRoot, { recursive: true });
    fs.appendFileSync(path.join(localRoot, QUERY_LOG_FILE), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // query-log append is best-effort; never blocks a query (fail open)
  }
}

// Per-slug query-log hit counts for tighten-plan, best-effort / fail-open (mirrors the log
// writer). Reads QUERY_LOG_FILE in the local root; absent/unreadable ⇒ empty map ⇒ all 0.
// PER-ENTRY dedupe of topSlugs: a cross-root twin double-listed in ONE entry counts once for
// that entry; two entries count twice. Single pass, no index (tolerates a large log cheaply).
function readQueryHits(localRoot) {
  const hits = new Map();
  if (!localRoot) return hits;
  let text;
  try {
    text = fs.readFileSync(path.join(localRoot, QUERY_LOG_FILE), 'utf8');
  } catch {
    return hits; // absent log ⇒ all hits 0
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; } // skip a malformed line, keep going
    const slugs = Array.isArray(entry.topSlugs) ? entry.topSlugs : [];
    for (const slug of new Set(slugs)) hits.set(slug, (hits.get(slug) ?? 0) + 1);
  }
  return hits;
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
  requireLocal(roots, 'render-index'); // the projection is written INTO the local root
  const records = walkCorpus(roots);
  const { text, bytes, lines, verdict, candidates } = buildProjection(records);
  if (verdict === 'refuse') {
    process.stderr.write(
      `war-memory render-index: REFUSED — projection ${bytes}B / ${lines} lines exceeds a hard axis ` +
        `(${HARD_BYTES}B / ${HARD_LINES} lines). Ranked archive candidates (\`archive --candidates\` ` +
        `lists them non-destructively; add \`--apply\` to archive the whole set, or \`archive <slug>...\` ` +
        `to archive just the ones you pick): ` +
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
        `Run \`/lessons-learned tighten\` to shrink it (usage-scored eviction behind hard floors). ` +
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
  requireLocal(roots, 'archive'); // ends in a re-render into the local root
  const records = walkCorpus(roots);
  let slugs;
  if (argv.candidates) {
    const { candidates } = buildProjection(records);
    // Non-destructive default: `--candidates` alone LISTS the ranked set and mutates
    // nothing; mutation requires an explicit `--apply` (or an explicit slug list).
    if (!argv.apply) {
      process.stdout.write(
        `archive --candidates (dry-run — mutates nothing; add --apply to archive the whole set, ` +
          `or 'archive <slug>...' to pick): ${candidates.join(', ') || '(none)'}\n`
      );
      return;
    }
    slugs = candidates;
  } else {
    slugs = argv._.slice(1);
  }
  // Cross-root dupe (slug hot in BOTH roots): the LOCAL record wins, order-independently —
  // archiving must never mutate the committed repo copy, which only moves when it is the
  // slug's sole hot holder (a repo-only slug still git-mv's within the repo root).
  const bySlug = new Map();
  for (const r of records.filter((r) => r.temperature === 'hot')) {
    if (!bySlug.has(r.slug) || r.root === 'local') bySlug.set(r.slug, r);
  }
  const note = `\n> archived ${new Date().toISOString().slice(0, 10)}: resolved — moved to archive\n`;
  for (const slug of slugs) {
    const r = bySlug.get(slug);
    if (!r) {
      process.stderr.write(`archive: no hot lesson '${slug}'\n`);
      continue;
    }
    // Advisory concept-hub WARN: archiving is link-safe (cold links still resolve), but a
    // hub with ≥2 hot inbound refs loses its hot index row. Non-blocking — the keep-or-stub
    // call stays human. Counted from the pre-move snapshot.
    const hotInbound = inboundCiters(records, slug, { hotOnly: true });
    if (hotInbound.length >= 2) {
      process.stderr.write(
        `WARN: archiving concept hub '${slug}' (${hotInbound.length} inbound refs) — ` +
          `its index row disappears; consider keep-compress stub\n`
      );
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
  requireLocal(roots, 'consolidate'); // ends in a re-render into the local root
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
  requireLocal(roots, 'migrate'); // ends in a re-render into the local root
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
    // Cross-root dupe (slug hot in BOTH roots): the LOCAL record wins, order-independently —
    // migrate must never mutate the committed repo copy while a local holder exists (the repo
    // copy moves only when it is the slug's sole hot holder). Hot-filtered so a cold repo
    // (already-archived) record cannot shadow a hot local one into a silent skip.
    const bySlug = new Map();
    for (const r of records.filter((r) => r.temperature === 'hot')) {
      if (!bySlug.has(r.slug) || r.root === 'local') bySlug.set(r.slug, r);
    }
    // Set: migrationPlan pushes a dupe slug once per holding root — move it once.
    for (const slug of new Set(plan.toArchive)) {
      const r = bySlug.get(slug);
      if (!r) continue;
      const base = r.root === 'repo' ? roots.repo : roots.local;
      const dst = path.join(base, ARCHIVE_DIR, path.basename(r.file));
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      if (r.root === 'repo') {
        // git mv in the repo root (a git repo); fall back to rename if git unavailable
        const res = spawnSync('git', ['-C', base, 'mv', r.file, dst], { encoding: 'utf8' });
        if (res.status !== 0) fs.renameSync(r.file, dst);
      } else {
        fs.renameSync(r.file, dst); // plain mv in the local root (not a git repo)
      }
    }
    cmdRenderIndex(argv);
  }
}

// inbound <slug> [--repo <root>]: mechanical inbound [[slug]] count across both roots.
// Pure read — no requireLocal (an absent local root is just an empty corpus). The tool
// form of the Phase-3 hub check: agents call this instead of grepping by hand.
function cmdInbound(argv) {
  const slug = argv._[1];
  if (!slug) {
    process.stderr.write('war-memory inbound: <slug> required\n');
    process.exit(1);
  }
  const records = walkCorpus(resolveRoots(argv));
  const citing = [...new Set(inboundCiters(records, slug).map((r) => r.slug))].sort();
  process.stdout.write(
    `inbound ${slug}: ${citing.length}${citing.length ? ' — ' + citing.join(', ') : ''}\n`
  );
}

// tighten-plan [--local <dir>] [--repo <dir>] [--target <bytes>]: emit the usage-scored,
// floored eviction PLAN as JSON. Read-only — walks the corpus, reads the query log
// best-effort, and prints the ranked eligible list + cut line. Never mutates (the skill's
// gate is the sole destructive actor). Pure read: an absent local root is just an empty
// corpus (no requireLocal), matching query/inbound. `--target` sets both the cut goal AND the
// effective trigger: the printed `verdict` is the stricter of the advisory line and that target
// (#992), so a sub-advisory target makes the skill's preflight bind there rather than at 17,000 B.
function cmdTightenPlan(argv) {
  const roots = resolveRoots(argv);
  const target = argv.target ? Number(argv.target) : WARN_BYTES;
  const records = walkCorpus(roots);
  const hits = readQueryHits(roots.local);
  const plan = tightenPlan(records, { hits, target });
  process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
}

const VERBS = {
  query: cmdQuery,
  'render-index': cmdRenderIndex,
  archive: cmdArchive,
  inbound: cmdInbound,
  lint: cmdLint,
  consolidate: cmdConsolidate,
  migrate: cmdMigrate,
  'tighten-plan': cmdTightenPlan,
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
