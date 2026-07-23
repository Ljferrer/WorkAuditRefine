import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  parseFrontmatter,
  lessonRecord,
  walkCorpus,
  buildIndex,
  toFtsQuery,
  rankRecords,
  selectForBudget,
  renderPromptBlock,
  projectionRow,
  truncateToBytes,
  effectiveDate,
  buildProjection,
  archiveCandidates,
  inboundCiters,
  tightenPlan,
  findNearDupes,
  migrationPlan,
  routeRoot,
  lint,
  tierRank,
  LINT_PATTERNS,
  HARD_BYTES,
  HARD_LINES,
  WARN_BYTES,
  SUMMARY_CELL_BYTES,
  TIGHTEN_YOUNG_DAYS,
  TIGHTEN_SLACK_BYTES,
  DEFAULT_TOP_K,
} from './war-memory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'war-memory.mjs');
const SAFE_SWAP = join(HERE, '..', 'lessons-learned', 'assets', 'safe-swap.sh');

// Write a lesson file with the given frontmatter + body. `meta` fills metadata.*.
function lessonFile(dir, slug, { name, description, meta = {}, body = 'body text' } = {}) {
  const md = { node_type: 'memory', slug, ...meta };
  const lines = ['---'];
  lines.push(`name: ${name ?? slug}`);
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
  const file = join(dir, `${slug}.md`);
  writeFileSync(file, lines.join('\n'));
  return file;
}

function tmpDir(prefix = 'war-memory-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

// ============================================================================
// (1) Frontmatter parse — round-trip incl. nested metadata.provenance, absent
//     keywords, absent type/provenance (defaulting per §4.6/§4.3).
// ============================================================================

test('parse: round-trips name/description + nested metadata incl. provenance, tags, keywords', () => {
  const src = [
    '---',
    'name: worktree-hang',
    'description: "loop hangs on relative path"',
    'metadata:',
    '  node_type: memory',
    '  type: project',
    '  slug: worktree-hang',
    '  phase: 1',
    '  provenance: code-verified',
    '  tags:',
    '    - war',
    '    - bash',
    '  keywords:',
    '    - ancestor-walk',
    '    - infinite-loop',
    '  date: 2026-07-03',
    '---',
    '',
    'Body about the ref desync.',
  ].join('\n');
  const { frontmatter, body } = parseFrontmatter(src);
  assert.equal(frontmatter.name, 'worktree-hang');
  assert.equal(frontmatter.description, 'loop hangs on relative path');
  assert.equal(frontmatter.metadata.type, 'project');
  assert.equal(frontmatter.metadata.provenance, 'code-verified'); // nested provenance
  assert.deepEqual(frontmatter.metadata.tags, ['war', 'bash']);
  assert.deepEqual(frontmatter.metadata.keywords, ['ancestor-walk', 'infinite-loop']);
  assert.equal(body, 'Body about the ref desync.');
});

test('parse: inline list form for tags is supported', () => {
  const src = ['---', 'name: x', 'metadata:', '  tags: [a, b, c]', '---', 'body'].join('\n');
  const { frontmatter } = parseFrontmatter(src);
  assert.deepEqual(frontmatter.metadata.tags, ['a', 'b', 'c']);
});

test('parse: absent keywords → record.keywords is [] (legacy lessons index fine)', () => {
  const src = ['---', 'name: legacy', 'metadata:', '  slug: legacy', '  type: project', '---', 'b'].join('\n');
  const rec = lessonRecord(parseFrontmatter(src), { root: 'local', temperature: 'hot', slug: 'legacy', file: 'x' });
  assert.deepEqual(rec.keywords, []);
});

test('parse: absent provenance → record ranks as agent-unverified (§4.4)', () => {
  const src = ['---', 'name: np', 'metadata:', '  slug: np', '---', 'b'].join('\n');
  const rec = lessonRecord(parseFrontmatter(src), { root: 'local', temperature: 'hot', slug: 'np', file: 'x' });
  assert.equal(rec.provenance, 'agent-unverified');
  // temp-break: this token is unique to the absent-provenance default, not a generic string
  assert.equal(tierRank(rec.provenance), 2);
});

test('parse: no frontmatter fence → empty frontmatter, whole text is body', () => {
  const { frontmatter, body } = parseFrontmatter('just a body, no fence');
  assert.deepEqual(frontmatter, {});
  assert.equal(body, 'just a body, no fence');
});

// ============================================================================
// (2) Routing table — type × commitLearnings × lint-hit ⇒ destination root,
//     incl. absent/unrecognized → local, and the demote-and-report path.
// ============================================================================

test('route: project + commitLearnings + clean → repo', () => {
  assert.equal(routeRoot('project', true, false), 'repo');
});

test('route: project + commitLearnings but lint-hit → local (demote-and-report)', () => {
  assert.equal(routeRoot('project', true, true), 'local');
});

test('route: project without commitLearnings → local', () => {
  assert.equal(routeRoot('project', false, false), 'local');
});

test('route: user/feedback → local regardless of commitLearnings', () => {
  assert.equal(routeRoot('user', true, false), 'local');
  assert.equal(routeRoot('feedback', true, false), 'local');
});

test('route: absent/unrecognized type → local (fail-safe default, load-bearing for 46/133 untyped)', () => {
  assert.equal(routeRoot('', true, false), 'local');
  assert.equal(routeRoot(undefined, true, false), 'local');
  assert.equal(routeRoot('speculative-kind', true, false), 'local');
});

// ============================================================================
// (3) Lint — each hardcoded pattern class caught; clean prose passes.
// ============================================================================

test('lint: catches home paths (both /Users and /home)', () => {
  const hits = lint('see /Users/somebody/x and /home/other/y');
  const pats = hits.map((h) => h.pattern);
  assert.ok(pats.includes('home-path'));
  assert.equal(hits.filter((h) => h.pattern === 'home-path').length, 2);
});

test('lint: catches emails', () => {
  assert.ok(lint('mail me at person@example.com please').some((h) => h.pattern === 'email'));
});

test('lint: catches @-handles and git-host account URLs', () => {
  assert.ok(lint('ping @someuser about it').some((h) => h.pattern === 'handle'));
  assert.ok(lint('at github.com/someaccount/repo').some((h) => h.pattern === 'github-account-url'));
});

test('lint: catches credential shapes (ghp_, github_pat_, sk-, AKIA, PEM)', () => {
  const creds = [
    ['ghp_' + 'a'.repeat(36), 'github-token'],
    ['github_pat_' + 'b'.repeat(40), 'github-pat'],
    ['sk-' + 'c'.repeat(40), 'openai-key'],
    ['AKIA' + 'ABCDEFGHIJKLMNOP', 'aws-akid'],
    ['-----BEGIN PRIVATE KEY-----', 'pem-header'],
    ['-----BEGIN RSA PRIVATE KEY-----', 'pem-header'],
  ];
  for (const [text, pat] of creds) {
    assert.ok(lint(text).some((h) => h.pattern === pat), `expected ${pat} for ${text.slice(0, 12)}...`);
  }
});

test('lint: clean engineering prose passes with zero hits', () => {
  assert.deepEqual(lint('The renderer refuses above either hard axis; archive is a file move.'), []);
});

test('lint: every declared pattern class has a name (no silent gap)', () => {
  // temp-break guard: if a pattern is removed from the array, this count drops.
  assert.equal(LINT_PATTERNS.length, 9);
});

// ============================================================================
// (6) Query — BM25 via keywords only (body lacks the term); provenance/recency
//     ordering incl. untagged-lowest; top-k + byte budget; prompt block shape.
// ============================================================================

test('query: BM25 hit via keywords only — body does not contain the term', () => {
  const dir = tmpDir();
  // The term 'flywheel' appears ONLY in keywords, never in the body.
  lessonFile(dir, 'kw-only', {
    description: 'a lesson about ordering',
    meta: { keywords: ['flywheel'], provenance: 'code-verified' },
    body: 'this body says nothing matching the search token',
  });
  lessonFile(dir, 'noise', { description: 'unrelated', body: 'totally different content' });
  const recs = walkCorpus({ local: dir });
  const db = buildIndex(recs);
  const ranked = rankRecords(db, recs, 'flywheel');
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].slug, 'kw-only'); // matched despite body lacking 'flywheel'
  rmSync(dir, { recursive: true, force: true });
});

test('query: ties broken by provenance tier then recency (untagged ranks lowest)', () => {
  const dir = tmpDir();
  // identical searchable text ⇒ identical bm25 ⇒ tie broken by tier then date
  const common = { description: 'zebra ordering token', body: 'zebra' };
  lessonFile(dir, 'low', { ...common, meta: {} }); // absent provenance → agent-unverified (rank 2)
  lessonFile(dir, 'mid', { ...common, meta: { provenance: 'code-verified', date: '2026-01-01' } });
  lessonFile(dir, 'top', { ...common, meta: { provenance: 'user-confirmed', date: '2026-01-01' } });
  const recs = walkCorpus({ local: dir });
  const ranked = rankRecords(buildIndex(recs), recs, 'zebra');
  assert.deepEqual(ranked.map((r) => r.slug), ['top', 'mid', 'low']);
  rmSync(dir, { recursive: true, force: true });
});

test('query: recency breaks a tier tie (newer first)', () => {
  const dir = tmpDir();
  const common = { description: 'quokka token', body: 'quokka', meta: { provenance: 'code-verified' } };
  lessonFile(dir, 'older', { ...common, meta: { ...common.meta, date: '2026-01-01' } });
  lessonFile(dir, 'newer', { ...common, meta: { ...common.meta, date: '2026-06-01' } });
  const recs = walkCorpus({ local: dir });
  const ranked = rankRecords(buildIndex(recs), recs, 'quokka');
  assert.deepEqual(ranked.map((r) => r.slug), ['newer', 'older']);
  rmSync(dir, { recursive: true, force: true });
});

test('toFtsQuery: hyphenated/colon terms are quoted so FTS5 does not read them as column filters', () => {
  // A bare `node:sqlite` makes FTS5 throw "no such column: sqlite" — quoting is the fix.
  const q = toFtsQuery('node:sqlite infinite-loop the a');
  assert.match(q, /"node:sqlite"/);
  assert.match(q, /"infinite-loop"/);
  assert.doesNotMatch(q, /\bthe\b/); // stopword dropped
  assert.match(q, / OR /);
});

test('toFtsQuery: all-stopword / empty text → null (no query)', () => {
  assert.equal(toFtsQuery('the a an of to'), null);
  assert.equal(toFtsQuery(''), null);
});

test('query: OR-query with a hyphenated term does not throw (regression on FTS5 tokenisation)', () => {
  const dir = tmpDir();
  lessonFile(dir, 'hy', { description: 'about relative-path handling', meta: { keywords: ['relative-path'] }, body: 'x' });
  const recs = walkCorpus({ local: dir });
  const ranked = rankRecords(buildIndex(recs), recs, 'relative-path');
  assert.equal(ranked[0].slug, 'hy');
  rmSync(dir, { recursive: true, force: true });
});

test('selectForBudget: top-k truncation', () => {
  const recs = Array.from({ length: 25 }, (_, i) => ({
    slug: `s${i}`, description: 'd', provenance: 'code-verified', phase: '', title: '',
  }));
  assert.equal(selectForBudget(recs, { topK: 10, budget: 1e9 }).length, 10);
  assert.equal(selectForBudget(recs).length, DEFAULT_TOP_K);
});

test('selectForBudget: byte budget caps below top-k but always emits at least one', () => {
  const recs = Array.from({ length: 10 }, (_, i) => ({
    slug: `slug-${i}`, description: 'x'.repeat(200), provenance: 'code-verified', phase: '1', title: '',
  }));
  const tiny = selectForBudget(recs, { topK: 10, budget: 50 });
  assert.equal(tiny.length, 1); // one line already exceeds 50B → still emit one
  const some = selectForBudget(recs, { topK: 10, budget: 600 });
  assert.ok(some.length >= 2 && some.length < 10);
});

test('renderPromptBlock: exact §4.5 line shape, and empty records → empty string', () => {
  assert.equal(renderPromptBlock([]), ''); // byte-identical-to-today invariant
  const block = renderPromptBlock(
    [{ slug: 'foo-bug', provenance: 'code-verified', phase: '3', description: 'a thing broke', title: '' }],
    { seat: 'worker' }
  );
  // tokens unique to the real §4.5 format — not a generic message
  assert.match(block, /^PRIOR LESSONS \(memory — trust per provenance tag\) \[worker\]:/);
  assert.match(block, /- \[foo-bug\] \(code-verified, phase 3\): a thing broke/);
});

// ============================================================================
// (4) Render — atomicity (tmp+rename), hot ≡ indexed (cross-root twin collapses to
//     the single repo row), union across both roots, ≥17KB warn + candidate ordering
//     (equal tier → local before repo), refusal on BOTH hard axes.
// ============================================================================

test('render: hot ≡ indexed — every hot fact gets one row, cold lessons no row', () => {
  const dir = tmpDir();
  lessonFile(dir, 'hot-a', { description: 'A' });
  lessonFile(dir, 'hot-b', { description: 'B' });
  lessonFile(join(dir, 'archive'), 'cold-c', { description: 'C' });
  const recs = walkCorpus({ local: dir });
  const { text } = buildProjection(recs);
  assert.match(text, /\[\[hot-a\]\]/);
  assert.match(text, /\[\[hot-b\]\]/);
  assert.doesNotMatch(text, /\[\[cold-c\]\]/); // cold appears in NO projection
  rmSync(dir, { recursive: true, force: true });
});

test('render: union across both roots; repo-root rows carry the trailing [repo] marker (T1↔T3)', () => {
  const local = tmpDir();
  const repo = tmpDir();
  lessonFile(local, 'local-one', { description: 'L', meta: { provenance: 'code-verified' } });
  lessonFile(repo, 'repo-one', { description: 'R', meta: { type: 'project', provenance: 'code-verified' } });
  const recs = walkCorpus({ local, repo });
  const { text } = buildProjection(recs);
  // repo row ends with [repo]; local row does NOT — the pinned interface for safe-swap
  assert.match(text, /\[\[repo-one\]\].*\[code-verified\] \[repo\] \|/);
  assert.match(text, /\[\[local-one\]\].*\[code-verified\] \|/);
  assert.doesNotMatch(text, /\[\[local-one\]\].*\[repo\]/);
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('render: cross-root promoted twin collapses to ONE row carrying [repo]; local-only control still renders (#821)', () => {
  const local = tmpDir();
  const repo = tmpDir();
  // same slug in both roots = one promoted fact (Gate-2 promotion copied it to the repo root)
  lessonFile(local, 'promoted', { description: 'twin fact', meta: { type: 'project', provenance: 'code-verified' } });
  lessonFile(repo, 'promoted', { description: 'twin fact', meta: { type: 'project', provenance: 'code-verified' } });
  // (b) a local-only control still renders — dedup only drops the shadowed twin
  lessonFile(local, 'local-solo', { description: 'control', meta: { provenance: 'code-verified' } });
  const { text } = buildProjection(walkCorpus({ local, repo }));
  const twinRows = text.split('\n').filter((l) => l.includes('[[promoted]]'));
  assert.equal(twinRows.length, 1, 'promoted twin must collapse to exactly one row'); // reds (2 rows) without dedup
  assert.match(twinRows[0], /\[repo\]/); // the surviving row is the repo copy, not the local twin
  assert.match(text, /\[\[local-solo\]\]/); // local-only control unaffected by dedup
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('projectionRow: tier marker present; escapes pipes in description', () => {
  const row = projectionRow({ slug: 's', phase: '2', description: 'a | b', provenance: 'user-confirmed', root: 'local', title: '' });
  assert.match(row, /\[user-confirmed\]/);
  assert.match(row, /a \\\| b/); // literal pipe escaped so it does not break the table
});

// ============================================================================
// (Task 1.1 / spec §10 criterion 1) 2-COLUMN format lock: the projection is a
// bounded two-column view — `| [[slug]] | <summary> [tier] [repo] |`. The `phase`
// column is dropped from the PROJECTION only (frontmatter untouched).
// ============================================================================

test('2-col format lock: header is 2 columns and the phase value is dropped from every row', () => {
  const dir = tmpDir();
  // A distinctive phase value: it must NOT survive into the projection (phase column dropped).
  lessonFile(dir, 'facty', {
    description: 'a durable fact',
    meta: { provenance: 'code-verified', phase: 'PHASE_MARKER_ZZZ_9' },
  });
  const { text } = buildProjection(walkCorpus({ local: dir }));
  // header row: exactly the 2-column shape (reds if a phase column is reintroduced)
  assert.match(text, /^\| slug \| summary \|$/m);
  assert.match(text, /^\|------\|---------\|$/m);
  const row = text.split('\n').find((l) => l.includes('[[facty]]'));
  // exactly two data columns: | [[slug]] | summary | → three '|' delimiters, two cells
  assert.equal((row.match(/\|/g) || []).length, 3, `expected a 2-col row, got: ${row}`);
  assert.equal(row, '| [[facty]] | a durable fact [code-verified] |');
  // the phase value is GONE from the projection (delete the phase-drop mentally ⇒ this reds)
  assert.doesNotMatch(text, /PHASE_MARKER_ZZZ_9/);
  rmSync(dir, { recursive: true, force: true });
});

test('render: verdict ok below advisory budget', () => {
  const dir = tmpDir();
  lessonFile(dir, 'small', { description: 'tiny' });
  const { verdict, candidates } = buildProjection(walkCorpus({ local: dir }));
  assert.equal(verdict, 'ok');
  assert.deepEqual(candidates, []);
  rmSync(dir, { recursive: true, force: true });
});

test('render: ≥17KB → warn + ranked archive candidates (lowest tier, then oldest)', () => {
  const dir = tmpDir();
  // rows sized so the projection clears 17KB but stays under BOTH hard axes (24.4KB / 200 lines)
  for (let i = 0; i < 150; i++) {
    lessonFile(dir, `bulk-${String(i).padStart(3, '0')}`, {
      description: 'a fairly long summary line used to pad the projection past the advisory byte budget threshold, kept under the hard cap',
      meta: { provenance: 'code-verified', date: '2026-05-01' },
    });
  }
  // one low-tier + oldest lesson should top the candidate list
  lessonFile(dir, 'sacrifice', { description: 'padding padding padding padding padding padding padding padding padding padding padding', meta: { date: '2020-01-01' } });
  const { verdict, candidates, bytes, lines } = buildProjection(walkCorpus({ local: dir }));
  assert.equal(verdict, 'warn', `expected warn at ${bytes}B / ${lines} lines`);
  assert.ok(bytes >= WARN_BYTES && bytes <= HARD_BYTES && lines <= HARD_LINES);
  assert.equal(candidates[0], 'sacrifice'); // absent-provenance (lowest tier) + oldest date
  rmSync(dir, { recursive: true, force: true });
});

test('render: promoted twin contributes ONE candidate slug — buildProjection feeds archiveCandidates the DEDUPED set (#821)', () => {
  const local = tmpDir();
  const repo = tmpDir();
  // pad past WARN_BYTES with the existing long-description idiom so candidates is non-empty
  for (let i = 0; i < 150; i++) {
    lessonFile(local, `bulk-${String(i).padStart(3, '0')}`, {
      description: 'a fairly long summary line used to pad the projection past the advisory byte budget threshold, kept under the hard cap',
      meta: { provenance: 'code-verified', date: '2026-05-01' },
    });
  }
  // the promoted twin: same slug in both roots
  lessonFile(local, 'promoted', { description: 'twin fact', meta: { type: 'project', provenance: 'code-verified', date: '2026-05-01' } });
  lessonFile(repo, 'promoted', { description: 'twin fact', meta: { type: 'project', provenance: 'code-verified', date: '2026-05-01' } });
  const { verdict, candidates } = buildProjection(walkCorpus({ local, repo }));
  assert.equal(verdict, 'warn', 'fixture must clear WARN_BYTES so candidates is populated'); // goes through buildProjection
  // the shadowed local twin is absent from the ranked candidates: the slug appears ONCE (the
  // repo copy), not twice — proving the deduped set (not raw `hot`) feeds archiveCandidates
  assert.equal(candidates.filter((s) => s === 'promoted').length, 1); // reds (===2) without the dedup
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('render: refuses above the BYTE hard axis', () => {
  const dir = tmpDir();
  for (let i = 0; i < 170; i++) {
    lessonFile(dir, `big-${String(i).padStart(3, '0')}`, {
      description: 'x'.repeat(140),
      meta: { provenance: 'code-verified' },
    });
  }
  const { verdict, bytes } = buildProjection(walkCorpus({ local: dir }));
  assert.equal(verdict, 'refuse', `expected refuse at ${bytes}B`);
  assert.ok(bytes > HARD_BYTES);
  rmSync(dir, { recursive: true, force: true });
});

test('render: refuses above the LINE hard axis even when bytes are small', () => {
  const dir = tmpDir();
  // 210 tiny lessons → > 200 lines but well under 24.4KB
  for (let i = 0; i < 210; i++) lessonFile(dir, `t${String(i).padStart(3, '0')}`, { description: 'x' });
  const { verdict, lines, bytes } = buildProjection(walkCorpus({ local: dir }));
  assert.equal(verdict, 'refuse', `expected refuse at ${lines} lines / ${bytes}B`);
  assert.ok(lines > HARD_LINES);
  assert.ok(bytes < HARD_BYTES); // proves the LINE axis (not bytes) triggered the refusal
  rmSync(dir, { recursive: true, force: true });
});

test('archiveCandidates: lowest tier first, then oldest', () => {
  const hot = [
    { slug: 'keep', provenance: 'user-confirmed', date: '2020-01-01' },
    { slug: 'old-verified', provenance: 'code-verified', date: '2021-01-01' },
    { slug: 'new-verified', provenance: 'code-verified', date: '2026-01-01' },
    { slug: 'unverified', provenance: 'agent-unverified', date: '2026-01-01' },
  ];
  assert.deepEqual(archiveCandidates(hot).map((r) => r.slug), ['unverified', 'old-verified', 'new-verified', 'keep']);
});

test('archiveCandidates: equal tier → local before repo, even when the local row is newer (#820)', () => {
  const hot = [
    { slug: 'repo-old', provenance: 'code-verified', date: '2020-01-01', root: 'repo' },
    { slug: 'local-new', provenance: 'code-verified', date: '2026-01-01', root: 'local' },
  ];
  // local is STRICTLY NEWER: without the root clause the oldest-first tiebreak would order repo first
  assert.deepEqual(archiveCandidates(hot).map((r) => r.slug), ['local-new', 'repo-old']);
});

// ============================================================================
// (7) Archive verb — file moved (mv in local root), note appended, re-rendered.
//     (git mv path exercised in the repo-root migrate/archive fixture below.)
// ============================================================================

test('archive: local-root lesson moved into archive/, note appended, projection re-rendered', () => {
  const local = tmpDir();
  lessonFile(local, 'to-archive', { description: 'stale lesson' });
  lessonFile(local, 'stays', { description: 'current lesson' });
  const r = spawnSync('node', [CLI, 'archive', 'to-archive', '--local', local], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!existsSync(join(local, 'to-archive.md')), 'source removed from hot dir');
  assert.ok(existsSync(join(local, 'archive', 'to-archive.md')), 'moved into archive/');
  const moved = readFileSync(join(local, 'archive', 'to-archive.md'), 'utf8');
  assert.match(moved, /> archived \d{4}-\d{2}-\d{2}: resolved/); // note line unique to archiving
  const proj = readFileSync(join(local, 'MEMORY.md'), 'utf8');
  assert.doesNotMatch(proj, /\[\[to-archive\]\]/); // archived → out of projection
  assert.match(proj, /\[\[stays\]\]/);
  rmSync(local, { recursive: true, force: true });
});

test('archive: cross-root dupe slug moves the LOCAL copy; committed repo copy untouched', () => {
  const local = tmpDir();
  const repo = tmpDir();
  lessonFile(local, 'dupe', { description: 'local copy' });
  lessonFile(repo, 'dupe', { description: 'repo copy' });
  const repoBytes = readFileSync(join(repo, 'dupe.md'), 'utf8');
  const r = spawnSync('node', [CLI, 'archive', 'dupe', '--local', local, '--repo', repo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(local, 'archive', 'dupe.md')), 'local copy archived');
  assert.ok(!existsSync(join(local, 'dupe.md')), 'local hot copy removed');
  assert.equal(readFileSync(join(repo, 'dupe.md'), 'utf8'), repoBytes, 'repo copy byte-identical');
  assert.ok(!existsSync(join(repo, 'archive')), 'nothing moved under the repo root');
  // trailing re-render still walks both roots: the surviving repo copy keeps the slug hot
  assert.match(readFileSync(join(local, 'MEMORY.md'), 'utf8'), /\[\[dupe\]\]/);
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

// ============================================================================
// (7b) Task 1.1 — non-destructive `--candidates`, `inbound`, concept-hub WARN.
// ============================================================================

// Count how many hot (top-level, non-archive) lesson files sit in a root.
function hotCount(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md').length;
}

test('inboundCiters: counts [[slug]] citers, excludes the slug\'s own self-reference', () => {
  const recs = [
    { slug: 'hub', temperature: 'hot', body: 'see [[hub]] self-ref should not count' },
    { slug: 'a', temperature: 'hot', body: 'builds on [[hub]] heavily' },
    { slug: 'b', temperature: 'hot', body: 'also cites [[hub]] here' },
    { slug: 'c', temperature: 'hot', body: 'unrelated, no citation' },
    { slug: 'd', temperature: 'cold', body: 'archived but still cites [[hub]]' },
  ];
  assert.deepEqual(inboundCiters(recs, 'hub').map((r) => r.slug).sort(), ['a', 'b', 'd']);
  // hotOnly drops the cold citer (the hub-WARN counts only lost hot index rows).
  assert.deepEqual(inboundCiters(recs, 'hub', { hotOnly: true }).map((r) => r.slug).sort(), ['a', 'b']);
  assert.deepEqual(inboundCiters(recs, 'c'), []); // zero inbound
});

test('inbound <slug>: CLI reports count + citing slugs across both roots, self-excluded (criterion 3)', () => {
  const local = tmpDir();
  lessonFile(local, 'hub', { description: 'a hub', body: 'mentions [[hub]] itself, ignored' });
  lessonFile(local, 'citer-a', { description: 'a', body: 'grew out of [[hub]]' });
  lessonFile(local, 'citer-b', { description: 'b', body: 'per [[hub]] rule' });
  lessonFile(local, 'lonely', { description: 'x', body: 'no links at all' });
  const r = spawnSync('node', [CLI, 'inbound', 'hub', '--local', local], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /inbound hub: 2 — citer-a, citer-b/);
  const z = spawnSync('node', [CLI, 'inbound', 'lonely', '--local', local], { encoding: 'utf8' });
  assert.equal(z.status, 0, z.stderr);
  assert.match(z.stdout, /inbound lonely: 0/);
  rmSync(local, { recursive: true, force: true });
});

test('archive --candidates without --apply archives ZERO + lists; --apply then archives the set; refuse msg no longer says "archives ALL of these" (criteria 1,2 + old-absent)', () => {
  const local = tmpDir();
  // 210 tiny lessons → LINE hard axis → refuse verdict → candidates = full ranked hot set.
  for (let i = 0; i < 210; i++) lessonFile(local, `c${String(i).padStart(3, '0')}`, { description: 'x' });

  // render-index refuse message: retired phrasing gone, new "lists" phrasing present.
  const render = spawnSync('node', [CLI, 'render-index', '--local', local], { encoding: 'utf8' });
  assert.equal(render.status, 1, 'refuse exits 1');
  assert.doesNotMatch(render.stderr, /archives ALL of these/, 'retired mutating-default phrasing must be gone');
  assert.match(render.stderr, /lists them non-destructively/);

  // dry-run: mutates nothing, prints the ranked list.
  const dry = spawnSync('node', [CLI, 'archive', '--candidates', '--local', local], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /archive --candidates \(dry-run/);
  assert.match(dry.stdout, /c000/); // the ranked list is printed
  assert.equal(hotCount(local), 210, 'dry-run moved zero files');
  assert.ok(!existsSync(join(local, 'archive')), 'dry-run created no archive dir');
  // walkCorpus after the dry-run still shows every candidate hot (end-state 1).
  assert.equal(walkCorpus({ local }).filter((r) => r.temperature === 'hot').length, 210);

  // --apply: archives the whole ranked set.
  const apply = spawnSync('node', [CLI, 'archive', '--candidates', '--apply', '--local', local], { encoding: 'utf8' });
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(hotCount(local), 0, '--apply archived every candidate');
  assert.equal(readdirSync(join(local, 'archive')).filter((f) => f.endsWith('.md')).length, 210);
  rmSync(local, { recursive: true, force: true });
});

test('archive <slug>: explicit-slug path is unchanged by the --candidates flip (criterion 2)', () => {
  const local = tmpDir();
  lessonFile(local, 'pick-me', { description: 'stale' });
  lessonFile(local, 'leave-me', { description: 'current' });
  const r = spawnSync('node', [CLI, 'archive', 'pick-me', '--local', local], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(local, 'archive', 'pick-me.md')), 'explicit slug archived');
  assert.ok(existsSync(join(local, 'leave-me.md')), 'unnamed slug untouched');
  rmSync(local, { recursive: true, force: true });
});

test('archive: concept-hub WARN on ≥2 hot inbound refs, still exits 0; <2 stays silent (criterion 4)', () => {
  const local = tmpDir();
  lessonFile(local, 'hub', { description: 'hub' });
  lessonFile(local, 'ref-a', { description: 'a', body: 'per [[hub]]' });
  lessonFile(local, 'ref-b', { description: 'b', body: 'see [[hub]]' });
  const r = spawnSync('node', [CLI, 'archive', 'hub', '--local', local], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); // advisory only — never blocks
  assert.match(r.stderr, /WARN: archiving concept hub 'hub' \(2 inbound refs\)/);
  assert.ok(existsSync(join(local, 'archive', 'hub.md')), 'archive still happened');

  // one inbound ref → below the ≥2 threshold → no hub WARN.
  const local2 = tmpDir();
  lessonFile(local2, 'solo', { description: 'solo' });
  lessonFile(local2, 'only-ref', { description: 'r', body: 'links [[solo]] once' });
  const r2 = spawnSync('node', [CLI, 'archive', 'solo', '--local', local2], { encoding: 'utf8' });
  assert.equal(r2.status, 0, r2.stderr);
  assert.doesNotMatch(r2.stderr, /concept hub/);
  rmSync(local, { recursive: true, force: true });
  rmSync(local2, { recursive: true, force: true });
});

// ============================================================================
// (8) Consolidate — near-dupe pair flagged, no auto-merge.
// ============================================================================

test('consolidate: flags a near-duplicate pair (report only, no merge)', () => {
  const dir = tmpDir();
  const shared = 'worktree scope guard hook agent type write path bash confinement residual';
  lessonFile(dir, 'dup-a', { description: shared, meta: { keywords: ['scope-guard', 'confinement'] }, body: shared });
  lessonFile(dir, 'dup-b', { description: shared + ' mirror', meta: { keywords: ['scope-guard', 'confinement'] }, body: shared });
  lessonFile(dir, 'unrelated', { description: 'completely different subject about release version bumps', body: 'versions' });
  const recs = walkCorpus({ local: dir });
  const pairs = findNearDupes(buildIndex(recs), recs, ['dup-a']);
  const flagged = pairs.map((p) => [p.a, p.b].sort().join('::'));
  assert.ok(flagged.includes('dup-a::dup-b'), `expected dup-a::dup-b in ${JSON.stringify(flagged)}`);
  assert.ok(!flagged.some((k) => k.includes('unrelated')));
  rmSync(dir, { recursive: true, force: true });
});

// ============================================================================
// (15) Migrate — dry-run reports move/route plan incl. untyped report; --apply
//      executes; two-clone disjoint add/archive merge with zero conflicts.
// ============================================================================

test('migrationPlan: routes typed→repo, untyped→local+reported, [RESOLVED]→archive, lint-hit→demoted', () => {
  const dir = tmpDir();
  lessonFile(dir, 'typed-clean', { description: 'good', meta: { type: 'project', provenance: 'code-verified' } });
  lessonFile(dir, 'untyped', { description: 'no type here', meta: {} });
  lessonFile(dir, 'typed-secret', { description: 'leak /Users/somebody/x', meta: { type: 'project' } });
  lessonFile(dir, 'resolved-one', { description: 'done', meta: { type: 'project' }, body: 'fixed [RESOLVED] now' });
  const recs = walkCorpus({ local: dir });
  const plan = migrationPlan(recs, { commitLearnings: true });
  assert.ok(plan.toRepo.includes('typed-clean'));
  assert.ok(plan.untyped.includes('untyped'));
  assert.ok(plan.toLocal.some((x) => x.slug === 'untyped'));
  assert.ok(plan.toLocal.some((x) => x.slug === 'typed-secret' && x.demoted === true)); // lint demote
  assert.ok(plan.toArchive.includes('resolved-one'));
  rmSync(dir, { recursive: true, force: true });
});

test('migrate --apply: dry-run text + [RESOLVED] moved to archive/, projection rendered', () => {
  const local = tmpDir();
  lessonFile(local, 'keep-me', { description: 'current' });
  lessonFile(local, 'done-me', { description: 'old', body: 'this was [RESOLVED] long ago' });
  const dry = spawnSync('node', [CLI, 'migrate', '--local', local], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /migrate \(dry-run\)/);
  assert.match(dry.stdout, /archive: done-me/);
  assert.ok(existsSync(join(local, 'done-me.md')), 'dry-run does not move files');

  const applied = spawnSync('node', [CLI, 'migrate', '--apply', '--local', local], { encoding: 'utf8' });
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /migrate \(APPLY\)/);
  assert.ok(existsSync(join(local, 'archive', 'done-me.md')), 'applied moves [RESOLVED] to archive/');
  assert.ok(existsSync(join(local, 'MEMORY.md')), 'projection rendered');
  rmSync(local, { recursive: true, force: true });
});

test('migrate --apply: cross-root dupe slug archives the LOCAL copy; committed repo copy untouched', () => {
  const local = tmpDir();
  const repo = tmpDir();
  lessonFile(local, 'dupe', { description: 'local copy', body: 'this was [RESOLVED] here' });
  lessonFile(repo, 'dupe', { description: 'repo copy', body: 'this was [RESOLVED] here' });
  const repoBytes = readFileSync(join(repo, 'dupe.md'), 'utf8');
  const r = spawnSync('node', [CLI, 'migrate', '--apply', '--local', local, '--repo', repo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(local, 'archive', 'dupe.md')), 'local copy archived');
  assert.ok(!existsSync(join(local, 'dupe.md')), 'local hot copy removed');
  assert.equal(readFileSync(join(repo, 'dupe.md'), 'utf8'), repoBytes, 'repo copy byte-identical');
  assert.ok(!existsSync(join(repo, 'archive')), 'nothing moved under the repo root');
  // trailing re-render still walks both roots: the surviving repo copy keeps the slug hot
  assert.match(readFileSync(join(local, 'MEMORY.md'), 'utf8'), /\[\[dupe\]\]/);
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('migrate --apply: slug hot in local but cold in repo still archives the hot local copy', () => {
  const local = tmpDir();
  const repo = tmpDir();
  lessonFile(local, 'gone', { description: 'hot local', body: 'this was [RESOLVED] here' });
  lessonFile(join(repo, 'archive'), 'gone', { description: 'cold repo' });
  const coldBytes = readFileSync(join(repo, 'archive', 'gone.md'), 'utf8');
  const r = spawnSync('node', [CLI, 'migrate', '--apply', '--local', local, '--repo', repo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(local, 'archive', 'gone.md')), 'hot local copy archived, not silently skipped');
  assert.ok(!existsSync(join(local, 'gone.md')), 'local hot copy removed');
  assert.equal(readFileSync(join(repo, 'archive', 'gone.md'), 'utf8'), coldBytes, 'repo cold copy untouched');
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('migrate fixture: two clones add/archive DIFFERENT lessons → git merge with ZERO conflicts (E8/criterion 15)', () => {
  // The repo root carries NO generated shared file (§4.4/E8), so disjoint per-file
  // changes in two clones merge cleanly. Prove it end to end with real git.
  const root = tmpDir('war-memory-git-');
  const learnings = join(root, 'docs', 'learnings');
  mkdirSync(learnings, { recursive: true });
  const git = (cwd, ...a) => {
    const r = spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
    return r.stdout;
  };
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  lessonFile(learnings, 'base', { description: 'shared base lesson', meta: { type: 'project' } });
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'base');

  // two clones
  const cloneA = tmpDir('war-memory-clone-a-');
  const cloneB = tmpDir('war-memory-clone-b-');
  rmSync(cloneA, { recursive: true, force: true });
  rmSync(cloneB, { recursive: true, force: true });
  spawnSync('git', ['clone', '-q', root, cloneA], { encoding: 'utf8' });
  spawnSync('git', ['clone', '-q', root, cloneB], { encoding: 'utf8' });
  for (const c of [cloneA, cloneB]) {
    git(c, 'config', 'user.email', 'test@example.invalid');
    git(c, 'config', 'user.name', 'Test');
  }

  // clone A adds a NEW lesson; clone B archives the base lesson (a move) — disjoint files
  lessonFile(join(cloneA, 'docs', 'learnings'), 'added-by-a', { description: 'A adds', meta: { type: 'project' } });
  git(cloneA, 'add', '-A');
  git(cloneA, 'commit', '-qm', 'A: add');
  git(cloneA, 'push', '-q', 'origin', 'HEAD:refs/heads/from-a');

  const bLearn = join(cloneB, 'docs', 'learnings');
  mkdirSync(join(bLearn, 'archive'), { recursive: true });
  git(cloneB, 'mv', join(bLearn, 'base.md'), join(bLearn, 'archive', 'base.md'));
  git(cloneB, 'commit', '-qm', 'B: archive base');

  // B merges A's branch — disjoint files, must be conflict-free
  git(cloneB, 'fetch', '-q', 'origin');
  const merge = spawnSync('git', ['-C', cloneB, 'merge', '--no-edit', 'origin/from-a'], { encoding: 'utf8' });
  assert.equal(merge.status, 0, `expected clean merge, got: ${merge.stdout}\n${merge.stderr}`);
  assert.doesNotMatch(merge.stdout + merge.stderr, /CONFLICT/);
  // both changes present: A's file exists, base moved to archive
  assert.ok(existsSync(join(bLearn, 'added-by-a.md')));
  assert.ok(existsSync(join(bLearn, 'archive', 'base.md')));
  assert.ok(!existsSync(join(bLearn, 'base.md')));

  for (const d of [root, cloneA, cloneB]) rmSync(d, { recursive: true, force: true });
});

// ============================================================================
// (5 + E3) Index-from-text-only — two invocations over the same corpus give
//     identical results; no on-disk artifact besides the query log.
// ============================================================================

test('index-from-text-only: two query invocations over the same corpus are byte-identical (criterion 5)', () => {
  const dir = tmpDir();
  lessonFile(dir, 'alpha', { description: 'ordering token alpha', meta: { provenance: 'code-verified' }, body: 'x' });
  lessonFile(dir, 'beta', { description: 'ordering token beta', meta: { provenance: 'code-verified' }, body: 'x' });
  const run = () => spawnSync('node', [CLI, 'query', 'ordering', '--local', dir], { encoding: 'utf8' });
  const a = run();
  const b = run();
  assert.equal(a.status, 0, a.stderr);
  assert.equal(a.stdout, b.stdout); // identical results — no persisted state changed ranking
  rmSync(dir, { recursive: true, force: true });
});

test('index-from-text-only: the ONLY on-disk artifact a query creates is the query log (E3)', () => {
  const dir = tmpDir();
  lessonFile(dir, 'solo', { description: 'lonely token', body: 'x' });
  const before = new Set(readdirSync(dir));
  spawnSync('node', [CLI, 'query', 'lonely', '--local', dir], { encoding: 'utf8' });
  const after = readdirSync(dir).filter((f) => !before.has(f));
  assert.deepEqual(after, ['war-memory-queries.jsonl']); // no DB file, no index file
  rmSync(dir, { recursive: true, force: true });
});

test('query: appends exactly one JSONL line per invocation to the local query log (criterion 6)', () => {
  const dir = tmpDir();
  lessonFile(dir, 'logme', { description: 'logging token', body: 'x' });
  spawnSync('node', [CLI, 'query', 'logging', '--seat', 'worker', '--local', dir], { encoding: 'utf8' });
  spawnSync('node', [CLI, 'query', 'logging', '--local', dir], { encoding: 'utf8' });
  const log = readFileSync(join(dir, 'war-memory-queries.jsonl'), 'utf8').trim().split('\n');
  assert.equal(log.length, 2);
  const first = JSON.parse(log[0]);
  assert.equal(first.seat, 'worker');
  assert.equal(first.query, 'logging');
  assert.ok(Array.isArray(first.topSlugs) && first.topSlugs.includes('logme'));
  assert.match(first.ts, /^\d{4}-\d{2}-\d{2}T/); // ISO ts — unique to the log line shape
  rmSync(dir, { recursive: true, force: true });
});

// ============================================================================
// --queries batch — N labeled blocks through one corpus walk (criterion 6).
// ============================================================================

test('--queries: one process yields one labeled block per entry (Lead per-phase prefetch)', () => {
  const dir = tmpDir();
  lessonFile(dir, 'hookfact', { description: 'hook scope guard lesson', meta: { keywords: ['hook', 'scope'] }, body: 'x' });
  lessonFile(dir, 'releasefact', { description: 'version bump slots lesson', meta: { keywords: ['version', 'bump'] }, body: 'x' });
  const qf = join(dir, 'queries.jsonl');
  writeFileSync(qf, [
    JSON.stringify({ label: 't1-worker', text: 'hook scope', seat: 'worker' }),
    JSON.stringify({ label: 't2-auditor', text: 'version bump slots', seat: 'auditor' }),
  ].join('\n'));
  const r = spawnSync('node', [CLI, '--queries', qf, '--local', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /### t1-worker/);
  assert.match(r.stdout, /### t2-auditor/);
  assert.match(r.stdout, /\[hookfact\]/);
  assert.match(r.stdout, /\[releasefact\]/);
  // one corpus walk, two labeled blocks: both headers precede their own lessons
  assert.ok(r.stdout.indexOf('### t1-worker') < r.stdout.indexOf('### t2-auditor'));
  rmSync(dir, { recursive: true, force: true });
});

// ============================================================================
// No-cwd-guess: an omitted --local (and no $CLAUDE_MEMORY_LOCAL) must never
// invent <cwd>/memory — on 2026-07-06 a WAR run's un-flagged invocations created
// a stray repo-root memory/ (header-only index + query log) and the prefetch
// walked that empty root, so the phase ran lesson-less. Read verbs treat an
// absent local root as empty; write verbs fail loud.
// ============================================================================

const NO_LOCAL_ENV = { ...process.env, CLAUDE_MEMORY_LOCAL: '' };

test('query without --local: walks --repo only, exits 0, creates NO <cwd>/memory', () => {
  const cwd = tmpDir();
  const repo = tmpDir();
  lessonFile(repo, 'repofact', { description: 'stray dir regression token', body: 'x' });
  const r = spawnSync('node', [CLI, 'query', 'stray dir regression', '--repo', repo], {
    encoding: 'utf8', cwd, env: NO_LOCAL_ENV,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\[repofact\]/); // the repo corpus is still queried
  assert.ok(!existsSync(join(cwd, 'memory')), 'no stray <cwd>/memory dir created');
  for (const d of [cwd, repo]) rmSync(d, { recursive: true, force: true });
});

test('render-index without --local: fails loud instead of writing <cwd>/memory/MEMORY.md', () => {
  const cwd = tmpDir();
  const r = spawnSync('node', [CLI, 'render-index'], { encoding: 'utf8', cwd, env: NO_LOCAL_ENV });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--local <dir> required/);
  assert.ok(!existsSync(join(cwd, 'memory')), 'no stray <cwd>/memory dir created');
  rmSync(cwd, { recursive: true, force: true });
});

// ============================================================================
// (9) Node < 24 stub — every verb exits non-zero with the one-line message.
//     We simulate an old runtime by making `node:sqlite` unimportable.
// ============================================================================

test('Node<24 stub: unavailable node:sqlite → non-zero exit + the one-line message, for every verb', () => {
  // Simulate a pre-24 runtime: a resolve hook makes `import('node:sqlite')` throw
  // ERR_UNKNOWN_BUILTIN_MODULE (exactly what Node < 24 does), exercising the CLI's real
  // top-level try/catch stub. Registered via module.register from an --import shim.
  const dir = tmpDir();
  const hook = join(dir, 'hook.mjs');
  writeFileSync(
    hook,
    [
      'export async function resolve(spec, ctx, next) {',
      "  if (spec === 'node:sqlite') { const e = new Error('mock: unavailable'); e.code = 'ERR_UNKNOWN_BUILTIN_MODULE'; throw e; }",
      '  return next(spec, ctx);',
      '}',
    ].join('\n')
  );
  const shim = join(dir, 'register.mjs');
  writeFileSync(
    shim,
    [
      "import { register } from 'node:module';",
      "import { pathToFileURL } from 'node:url';",
      `register('./hook.mjs', pathToFileURL(${JSON.stringify(dir + '/')}));`,
    ].join('\n')
  );
  const EXPECT = /war-memory: requires node:sqlite \(Node >= 24\); memory features disabled/;
  for (const verb of ['query', 'render-index', 'archive', 'lint', 'consolidate', 'migrate', 'tighten-plan']) {
    const r = spawnSync('node', ['--import', shim, CLI, verb, 'x', '--local', dir], { encoding: 'utf8' });
    assert.notEqual(r.status, 0, `${verb} should exit non-zero without node:sqlite`);
    assert.match(r.stderr, EXPECT, `${verb} should print the one-line message`);
  }
  rmSync(dir, { recursive: true, force: true });
});

// ============================================================================
// (Task 1.1 / spec §10 criterion 1) Marker-safe summary-cell cap. Truncation
// order is load-bearing: truncate the DESCRIPTION first, append the [tier]/[repo]
// markers second — the markers must never be cut. Both orders exercised; the
// WRONG order (cut after appending) severs the markers and must fail.
// ============================================================================

test('truncateToBytes: caps at the byte budget with a … ellipsis, no-op under budget, no multibyte split', () => {
  assert.equal(truncateToBytes('short', 100), 'short'); // under budget → unchanged
  const t = truncateToBytes('x'.repeat(300), SUMMARY_CELL_BYTES);
  assert.ok(Buffer.byteLength(t, 'utf8') <= SUMMARY_CELL_BYTES, 'never exceeds the cap');
  assert.ok(t.endsWith('…'), 'a truncated cell ends with the ellipsis');
  // multibyte safety: a 3-byte char must never be split into a partial code unit
  const multi = truncateToBytes('é'.repeat(200), SUMMARY_CELL_BYTES);
  assert.ok(Buffer.byteLength(multi, 'utf8') <= SUMMARY_CELL_BYTES);
  assert.doesNotMatch(multi, /�/); // no replacement char from a severed byte sequence
});

test('cap: a long summary row ends "… [tier] [repo] |" with the markers INTACT (description-first order)', () => {
  const longDesc = 'D'.repeat(400); // well over the 160B cell cap
  const row = projectionRow({ slug: 'big-one', description: longDesc, provenance: 'agent-unverified', root: 'repo', title: '' });
  // markers survive at the tail — safe-swap's classifiers key on these
  assert.ok(row.endsWith(' [agent-unverified] [repo] |'), `markers severed: ${row.slice(-40)}`);
  assert.match(row, /…\s\[agent-unverified\] \[repo\] \|$/); // ellipsis precedes the intact markers
  // the DESCRIPTION portion (between "| " and " [tier]") is capped to SUMMARY_CELL_BYTES
  const descCell = row.match(/^\| \[\[big-one\]\] \| (.*) \[agent-unverified\] \[repo\] \|$/)[1];
  assert.ok(Buffer.byteLength(descCell, 'utf8') <= SUMMARY_CELL_BYTES, `desc cell ${Buffer.byteLength(descCell)}B > cap`);

  // WRONG ORDER (regression guard): had truncation run AFTER appending the tags — i.e. cut the
  // whole "desc [tier] [repo]" string to the cap — the trailing markers would be severed. Prove
  // that naive order fails so the description-first order is genuinely load-bearing.
  const naiveWholeCell = truncateToBytes(`${longDesc} [agent-unverified] [repo]`, SUMMARY_CELL_BYTES);
  assert.ok(!naiveWholeCell.endsWith('[repo]'), 'wrong order must sever the [repo] marker');
  assert.doesNotMatch(naiveWholeCell, /\[agent-unverified\]/); // and the tier marker too
});

// ============================================================================
// (Task 1.1 / red-team adjudication) effectiveDate = newest ISO date among the
// four frontmatter date keys AND any 20\d\d-\d\d-\d\d in phase/description prose;
// null when nothing parses (undated ⇒ PROTECTED). lessonRecord surfaces it.
// ============================================================================

test('effectiveDate: newest stamp across frontmatter keys + prose; null when none parse', () => {
  assert.equal(effectiveDate(['2026-01-01', '2026-07-15', null, '', '', '']), '2026-07-15'); // newest key wins
  // a prose recurrence stamp (phase) is newer than any frontmatter key → it wins
  assert.equal(effectiveDate(['2026-01-01', null, null, null, 'housekeeping-2026-06-30 +2 recurrences 2026-07-19', '']), '2026-07-19');
  // a prose date in the description is honoured
  assert.equal(effectiveDate([null, null, null, null, '', 'fixed 2026-05-05 in prose']), '2026-05-05');
  assert.equal(effectiveDate([null, '', 'no date anywhere', undefined]), null); // undated ⇒ null
});

// Validation (#989): a matched token survives only if it round-trips through the engine's UTC
// ISO parse AND does not post-date now + FUTURE_SKEW_MS (48 h). `now` is injected so the future
// bound is deterministic; the constant itself stays module-private (the boundary is asserted here).
const SKEW_NOW = new Date('2026-07-21T00:00:00Z'); // ⇒ horizon 2026-07-23T00:00:00Z (+48 h)

test('effectiveDate: a well-formed-but-invalid token is discarded; an older VALID token wins', () => {
  // reds pre-fix: the lexicographic max picked 2026-13-45, which no calendar has
  assert.equal(effectiveDate(['2026-01-01', 'note 2026-13-45']), '2026-01-01');
  // every token invalid ⇒ null ⇒ the caller's undated-PROTECTED path (fail-safe direction)
  assert.equal(effectiveDate([null, null, null, null, '', 'both 2026-12-00 and 2026-00-10 are bogus']), null);
});

test('effectiveDate: a future token is discarded under injected now; only-future ⇒ null', () => {
  // the #989 shape: a stray 2099 stamp in prose no longer beats the real frontmatter date
  assert.equal(
    effectiveDate(['2026-01-01', null, null, null, '', 'ship by 2099-01-01'], { now: SKEW_NOW }),
    '2026-01-01'
  );
  assert.equal(effectiveDate([null, null, null, null, '', 'ship by 2099-01-01'], { now: SKEW_NOW }), null);
  // skew boundary, both sides: within FUTURE_SKEW_MS is kept (inclusive at exactly +48 h), beyond is dropped
  assert.equal(effectiveDate(['2026-07-22'], { now: SKEW_NOW }), '2026-07-22'); // +24 h ⇒ kept
  assert.equal(effectiveDate(['2026-07-23'], { now: SKEW_NOW }), '2026-07-23'); // exactly +48 h ⇒ kept
  assert.equal(effectiveDate(['2026-07-24'], { now: SKEW_NOW }), null); // +72 h ⇒ beyond the skew
});

test('lessonRecord: surfaces effectiveDate from frontmatter date keys and prose', () => {
  const withKey = lessonRecord(
    parseFrontmatter(['---', 'name: k', 'metadata:', '  slug: k', '  created: 2026-03-03', '---', 'b'].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'k', file: 'x' }
  );
  assert.equal(withKey.effectiveDate, '2026-03-03'); // reads metadata.created (not just .date)
  const prose = lessonRecord(
    parseFrontmatter(['---', 'name: p', 'description: "recurrence 2026-07-18 stamp"', 'metadata:', '  slug: p', '---', 'b'].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'p', file: 'x' }
  );
  assert.equal(prose.effectiveDate, '2026-07-18'); // prose-only date surfaced
  const undated = lessonRecord(
    parseFrontmatter(['---', 'name: u', 'description: "no date at all"', 'metadata:', '  slug: u', '---', 'b'].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'u', file: 'x' }
  );
  assert.equal(undated.effectiveDate, null); // undated ⇒ null (caller protects it)
});

// ============================================================================
// (Task 1.1 / spec §10 criterion 3) tighten-plan FLOORS — one fixture per floor,
// plus the effective-date branches (undated ⇒ protected; prose-only date honoured
// both ways). `now` is injected for determinism.
// ============================================================================

// Build a hot local record inline (pure tightenPlan input) — no filesystem needed.
function rec(slug, { provenance = 'code-verified', effectiveDate = '2026-01-01', root = 'local', description = 'd', body = 'b' } = {}) {
  return { slug, name: slug, description, title: '', phase: '', type: '', provenance, tags: [], keywords: [], date: '', effectiveDate, body, root, temperature: 'hot', file: `${slug}.md` };
}
const NOW = new Date('2026-07-21T00:00:00Z');
const evictedSlugs = (records, opts = {}) => tightenPlan(records, { now: NOW, ...opts }).eligible.map((e) => e.slug);

test('floor: a user-confirmed lesson is never eligible', () => {
  const recs = [rec('drop-me', { provenance: 'agent-unverified' }), rec('keep-user', { provenance: 'user-confirmed' })];
  const elig = evictedSlugs(recs);
  assert.ok(elig.includes('drop-me'));
  assert.ok(!elig.includes('keep-user'), 'user-confirmed is floored'); // reds if the tier floor is removed
});

test('floor: a hub with ≥2 distinct inbound citers is never eligible', () => {
  const recs = [
    rec('hub', { description: 'a hub' }),
    rec('citer-a', { body: 'builds on [[hub]]' }),
    rec('citer-b', { body: 'also cites [[hub]]' }),
    rec('lonely', { body: 'no links' }),
  ];
  const elig = evictedSlugs(recs);
  assert.ok(!elig.includes('hub'), 'a 2-inbound hub is floored'); // reds if the inbound floor is removed
  assert.ok(elig.includes('lonely'));
  // one inbound citer is below the ≥2 threshold → NOT floored
  const recs1 = [rec('semi-hub'), rec('only-ref', { body: 'links [[semi-hub]] once' })];
  assert.ok(evictedSlugs(recs1).includes('semi-hub'));
});

test('floor: a lesson within TIGHTEN_YOUNG_DAYS is never eligible; older is eligible', () => {
  const young = new Date(NOW.getTime() - (TIGHTEN_YOUNG_DAYS - 1) * 86400000).toISOString().slice(0, 10);
  const old = new Date(NOW.getTime() - (TIGHTEN_YOUNG_DAYS + 1) * 86400000).toISOString().slice(0, 10);
  const recs = [rec('too-young', { effectiveDate: young }), rec('old-enough', { effectiveDate: old })];
  const elig = evictedSlugs(recs);
  assert.ok(!elig.includes('too-young'), 'a <14-day lesson is floored'); // reds if the young floor is removed
  assert.ok(elig.includes('old-enough'));
});

test('floor: an UNDATED lesson (no parseable date anywhere) is PROTECTED (treated as within-window)', () => {
  const recs = [rec('undated', { effectiveDate: null }), rec('dated-old', { effectiveDate: '2026-01-01' })];
  const elig = evictedSlugs(recs);
  assert.ok(!elig.includes('undated'), 'undated ⇒ protected'); // reds if undated fell through as eligible
  assert.ok(elig.includes('dated-old'));
});

test('floor: a prose-only recurrence date is honoured both ways (old ⇒ eligible, recent ⇒ floored)', () => {
  // These records carry NO frontmatter date key — only a prose date drives effectiveDate.
  const oldProse = lessonRecord(
    parseFrontmatter(['---', 'name: op', 'description: "resolved 2026-01-05 long ago"', 'metadata:', '  slug: op', '  provenance: code-verified', '---', 'b'].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'op', file: 'op.md' }
  );
  const recentProse = lessonRecord(
    parseFrontmatter(['---', 'name: rp', 'description: "recurrence 2026-07-20 stamp"', 'metadata:', '  slug: rp', '  provenance: code-verified', '---', 'b'].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'rp', file: 'rp.md' }
  );
  const elig = evictedSlugs([oldProse, recentProse]);
  assert.ok(elig.includes('op'), 'old prose date ⇒ eligible (date honoured, not treated as undated)');
  assert.ok(!elig.includes('rp'), 'recent prose date ⇒ floored young (recurrence stamp read)');
});

test('#989 end-to-end: a stray FUTURE prose stamp no longer protects an old lesson from eviction', () => {
  // lessonRecord builds with the wall-clock default `now` (2099-01-01 is future against any real
  // clock); tightenPlan gets the injected NOW. Pre-fix the 2099 token won the lexicographic max,
  // so the lesson read as permanently young and never appeared in `eligible`.
  const stray = lessonRecord(
    parseFrontmatter([
      '---',
      'name: sf',
      'description: "rollout note citing 2099-01-01 that used to protect this row forever"',
      'metadata:',
      '  slug: sf',
      '  provenance: code-verified',
      '  created: 2026-01-01',
      '---',
      'b',
    ].join('\n')),
    { root: 'local', temperature: 'hot', slug: 'sf', file: 'sf.md' }
  );
  assert.equal(stray.effectiveDate, '2026-01-01', 'future token discarded; the real created stamp governs');
  assert.ok(evictedSlugs([stray]).includes('sf'), '#989: eligible for eviction, not permanently protected');
});

// ============================================================================
// (Task 1.1 / spec §10 criteria 4,5,6) tighten-plan ranking, hit dedupe,
// log-absent fallback, cross-root dupe both-or-nothing.
// ============================================================================

test('rank: eligible ordered by ascending query-log hits (least-used evicted first)', () => {
  const recs = [
    rec('hot-fact', { effectiveDate: '2026-02-01' }),
    rec('cool-fact', { effectiveDate: '2026-02-01' }),
    rec('cold-fact', { effectiveDate: '2026-02-01' }),
  ];
  const hits = new Map([['hot-fact', 9], ['cool-fact', 3], ['cold-fact', 0]]);
  assert.deepEqual(evictedSlugs(recs, { hits }), ['cold-fact', 'cool-fact', 'hot-fact']);
});

test('hits (criterion 4): a slug duplicated within ONE log entry counts once; two entries count twice', () => {
  const local = tmpDir();
  // three eligible facts (agent-unverified, old, zero inbound)
  for (const s of ['dup', 'solo', 'zero']) {
    lessonFile(local, s, { description: `${s} fact`, meta: { provenance: 'agent-unverified', date: '2026-01-01' } });
  }
  // entry 1 lists `dup` TWICE (cross-root-twin shape) + `solo` once; entry 2 lists `dup` once.
  writeFileSync(join(local, 'war-memory-queries.jsonl'), [
    JSON.stringify({ ts: '2026-07-01T00:00:00Z', topSlugs: ['dup', 'dup', 'solo'] }),
    JSON.stringify({ ts: '2026-07-02T00:00:00Z', topSlugs: ['dup'] }),
  ].join('\n') + '\n');
  const r = spawnSync('node', [CLI, 'tighten-plan', '--local', local], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const plan = JSON.parse(r.stdout);
  const hitsBySlug = Object.fromEntries(plan.eligible.map((e) => [e.slug, e.hits]));
  assert.equal(hitsBySlug.dup, 2, 'dup: once per entry (entry-1 dedupes the double-listing) → 2');
  assert.equal(hitsBySlug.solo, 1);
  assert.equal(hitsBySlug.zero, 0);
  rmSync(local, { recursive: true, force: true });
});

test('fallback (criterion 5): with the log absent, order equals the tier+age eviction order', () => {
  // all-local corpus → archiveCandidates' local-before-repo clause is inert, so it reduces to
  // exactly (tier, age) — the order the plan degrades to when every hit is 0.
  const recs = [
    rec('a-unv-old', { provenance: 'agent-unverified', effectiveDate: '2026-01-01' }),
    rec('b-unv-new', { provenance: 'agent-unverified', effectiveDate: '2026-05-01' }),
    rec('c-cv-old', { provenance: 'code-verified', effectiveDate: '2026-01-01' }),
    rec('d-cv-new', { provenance: 'code-verified', effectiveDate: '2026-06-01' }),
  ];
  const expected = archiveCandidates(recs).map((r) => r.slug); // tier then (all-local) age
  // no `hits` passed ⇒ empty map ⇒ all hits 0 (the log-absent degradation)
  assert.deepEqual(evictedSlugs(recs), expected);
});

test('dupe (criterion 6): a cross-root twin is ONE both-copies-or-nothing unit — never single-copy savings', () => {
  const local = tmpDir();
  const repo = tmpDir();
  // a promoted twin (same slug both roots) + a plain local control
  lessonFile(local, 'twin', { description: 'promoted fact', meta: { type: 'project', provenance: 'agent-unverified', date: '2026-01-01' } });
  lessonFile(repo, 'twin', { description: 'promoted fact', meta: { type: 'project', provenance: 'agent-unverified', date: '2026-01-01' } });
  lessonFile(local, 'solo', { description: 'plain fact', meta: { provenance: 'agent-unverified', date: '2026-01-01' } });
  const plan = tightenPlan(walkCorpus({ local, repo }), { now: NOW });
  const twinEntries = plan.eligible.filter((e) => e.slug === 'twin');
  assert.equal(twinEntries.length, 1, 'the twin collapses to ONE eligible unit, not two single-copy rows');
  const twin = twinEntries[0];
  assert.equal(twin.dupe, true, 'flagged as a cross-root dupe unit');
  assert.deepEqual(twin.copies, ['local', 'repo'], 'names BOTH copies — archiving one frees zero');
  assert.ok(twin.bytesFreed > 0, 'the UNIT (both copies) frees the row cost'); // unit value, not single-copy
  // no eligible entry ever claims single-copy savings for a dupe
  assert.ok(!plan.eligible.some((e) => e.slug === 'twin' && !e.dupe), 'never a bare single-copy twin entry');
  rmSync(local, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

test('cut line: eligible cumulative freed drives cutIndex to target − slack; a short list reports shortfall', () => {
  // pad a corpus well over a small --target so cutGoal > 0 and the cut line is meaningful
  const recs = [];
  for (let i = 0; i < 40; i++) recs.push(rec(`pad-${String(i).padStart(2, '0')}`, { description: 'x'.repeat(120), provenance: 'agent-unverified', effectiveDate: '2026-01-01' }));
  const target = 2000; // far below the rendered size ⇒ cutGoal is large
  const plan = tightenPlan(recs, { now: NOW, target });
  assert.equal(plan.slack, TIGHTEN_SLACK_BYTES);
  assert.equal(plan.cutGoalBytes, Math.max(0, plan.currentBytes - (target - TIGHTEN_SLACK_BYTES)));
  // the first `cutIndex` entries' cumulative freed reaches the goal (or the whole list falls short)
  const struck = plan.eligible.slice(0, plan.cutIndex).reduce((s, e) => s + e.bytesFreed, 0);
  if (plan.shortfallBytes === 0) {
    assert.ok(struck >= plan.cutGoalBytes, 'reached: cumulative crosses the goal');
  } else {
    assert.equal(plan.cutIndex, plan.eligible.length, 'short: the whole eligible list is struck');
    assert.equal(plan.shortfallBytes, plan.cutGoalBytes - struck);
  }
  assert.equal(plan.projectedBytes, plan.currentBytes - struck);
});

// ============================================================================
// (Task 1.1 / #992) tightenPlan's returned `verdict` is the STRICTER of the advisory
// projection read and the effective `--target`. buildProjection is byte-untouched, so
// the render-verdict tests above (which read ITS verdict) stay green unchanged.
// ============================================================================

test('verdict (#992): a sub-advisory --target binds the trigger; the default target is byte-identical to the projection read', () => {
  const recs = [rec('a'), rec('b')]; // tiny corpus ⇒ the projection itself renders `ok`
  assert.equal(buildProjection(recs).verdict, 'ok', 'fixture must render ok for this test to mean anything');
  const { currentBytes } = tightenPlan(recs, { now: NOW });
  // default target = WARN_BYTES ⇒ unchanged from the projection verdict (the byte-identical default path)
  assert.equal(tightenPlan(recs, { now: NOW }).verdict, 'ok');
  // a target BELOW currentBytes now binds — reds pre-fix, where the projection verdict passed straight through
  assert.equal(tightenPlan(recs, { now: NOW, target: Math.floor(currentBytes / 2) }).verdict, 'warn');
  // the `>=` boundary, both sides
  assert.equal(tightenPlan(recs, { now: NOW, target: currentBytes }).verdict, 'warn');
  assert.equal(tightenPlan(recs, { now: NOW, target: currentBytes + 1 }).verdict, 'ok');
});

test('verdict (#992): a target ABOVE the advisory never suppresses the projection warn', () => {
  const recs = [];
  for (let i = 0; i < 170; i++) {
    recs.push(rec(`bulk-${String(i).padStart(3, '0')}`, { description: 'x'.repeat(80), effectiveDate: '2026-01-01' }));
  }
  const { verdict: projection, bytes } = buildProjection(recs);
  assert.equal(projection, 'warn', `fixture must render warn, got ${projection} at ${bytes}B`);
  // the advisory line is a floor: a loose target cannot silence it (D7 — the two surfaces never fork)
  assert.equal(tightenPlan(recs, { now: NOW, target: HARD_BYTES }).verdict, 'warn');
});

// ============================================================================
// (Task 1.1 / spec §10 criterion 2) BOUND: a realistic ~98-fact corpus renders
// verdict `ok` (strictly under the advisory) under the 2-col cap — asserted via
// the verdict, never a byte literal for the rendered size.
// ============================================================================

test('bound (criterion 2): a realistic ~98-fact corpus renders verdict ok under the 2-col structural bound', () => {
  const dir = tmpDir();
  // 98 hot facts, each with a ~95-byte summary and a chunky phase cell (mimicking the recurrence
  // trail the 2-col view drops). The phase + description RAW content alone exceeds the advisory —
  // so a verdict of `ok` can only come from the structural bound (phase-column drop + 160B cap),
  // never from a trivially small corpus. Mentally restore the phase column ⇒ this must go warn.
  const summary = 'a durable engineering lesson summary of a realistic representative length that sits';
  const bigPhase = 'phase-with-a-long-recurrence-trail-and-a-few-2026-05-01-stamps-appended-over-time-more-and-more';
  for (let i = 0; i < 98; i++) {
    lessonFile(dir, `fact-${String(i).padStart(2, '0')}`, {
      description: `${summary} #${i}`,
      meta: { provenance: 'code-verified', phase: `${bigPhase}-${i}`, date: '2026-05-01' },
    });
  }
  const recs = walkCorpus({ local: dir });
  const rawContent = recs.reduce((s, r) => s + Buffer.byteLength(r.description + r.phase, 'utf8'), 0);
  assert.ok(rawContent > WARN_BYTES, `fixture must be non-trivial: raw content ${rawContent}B <= advisory`);
  const { verdict, bytes } = buildProjection(recs);
  assert.equal(verdict, 'ok', `expected ok, got ${verdict} at ${bytes}B`); // reds if the structural bound is removed
  rmSync(dir, { recursive: true, force: true });
});

// ============================================================================
// (Task 1.1 / spec §10 criterion 1, second clause) The rendered 2-col projection
// survives the real safe-swap.sh verify extractors (first [[slug]] per |-row;
// [repo]-marker detection) — the script is INVOKED read-only, never modified.
// PASS on the faithful render; FAIL once the [repo] markers are stripped while the
// repo root stays populated (the repo-completeness hard-fail arm).
// ============================================================================

test('safe-swap cross-check: buildProjection 2-col render PASSes verify; stripping [repo] markers FAILs it', () => {
  const staging = tmpDir('ll-staging-');
  const repo = tmpDir('ll-repo-');
  // local hot lessons live IN the staged dir (row<->file must resolve); repo lessons live in the repo root
  lessonFile(staging, 'local-a', { description: 'local lesson a', meta: { provenance: 'code-verified' } });
  lessonFile(staging, 'local-b', { description: 'a longer local lesson '.repeat(12), meta: { provenance: 'agent-unverified' } });
  lessonFile(repo, 'repo-a', { description: 'repo lesson a', meta: { type: 'project', provenance: 'code-verified' } });
  lessonFile(repo, 'repo-b', { description: 'repo lesson b '.repeat(20), meta: { type: 'project', provenance: 'code-verified' } });

  // render the real 2-col projection into the staged dir's MEMORY.md
  const { text } = buildProjection(walkCorpus({ local: staging, repo }));
  writeFileSync(join(staging, 'MEMORY.md'), text);
  assert.match(text, /\[repo\] \|$/m); // sanity: the render actually carries [repo] rows

  const env = { ...process.env, CLAUDE_MEMORY_REPO: repo };
  const pass = spawnSync('bash', [SAFE_SWAP, 'verify', staging], { encoding: 'utf8', env });
  assert.equal(pass.status, 0, `faithful render should PASS verify:\n${pass.stdout}\n${pass.stderr}`);
  assert.match(pass.stdout, /VERIFY: PASS/);

  // strip the [repo] markers (a faulty render) while the repo root stays populated → hard fail
  writeFileSync(join(staging, 'MEMORY.md'), text.replace(/ \[repo\]/g, ''));
  const fail = spawnSync('bash', [SAFE_SWAP, 'verify', staging], { encoding: 'utf8', env });
  assert.notEqual(fail.status, 0, 'stripping [repo] with a populated repo root must FAIL verify');
  assert.match(fail.stdout, /zero \[repo\] rows/); // the repo-completeness hard-fail arm fired
  assert.match(fail.stdout, /VERIFY: FAIL/);
  rmSync(staging, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});
