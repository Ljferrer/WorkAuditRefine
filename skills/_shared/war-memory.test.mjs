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
  buildProjection,
  archiveCandidates,
  inboundCiters,
  findNearDupes,
  migrationPlan,
  routeRoot,
  lint,
  tierRank,
  LINT_PATTERNS,
  HARD_BYTES,
  HARD_LINES,
  WARN_BYTES,
  DEFAULT_TOP_K,
} from './war-memory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'war-memory.mjs');

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
  for (const verb of ['query', 'render-index', 'archive', 'lint', 'consolidate', 'migrate']) {
    const r = spawnSync('node', ['--import', shim, CLI, verb, 'x', '--local', dir], { encoding: 'utf8' });
    assert.notEqual(r.status, 0, `${verb} should exit non-zero without node:sqlite`);
    assert.match(r.stderr, EXPECT, `${verb} should print the one-line message`);
  }
  rmSync(dir, { recursive: true, force: true });
});
