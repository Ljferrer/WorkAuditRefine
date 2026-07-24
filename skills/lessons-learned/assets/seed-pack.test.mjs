import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  rankEvictions,
  SEED_MAX_MEMBERS,
  ARCHIVE_MAX_MEMBERS,
  ARCHIVE_MAX_BYTES,
} from './seed-pack.mjs';
import { parseFrontmatter, lessonRecord } from '../../_shared/war-memory.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'seed-pack.mjs');

// ---- temp-dir bookkeeping (cleaned up once, after the whole file) -----------
const TEMPS = [];
function tmp(prefix = 'seed-pack-test-') {
  const d = mkdtempSync(join(tmpdir(), prefix));
  TEMPS.push(d);
  return d;
}
after(() => {
  for (const d of TEMPS) rmSync(d, { recursive: true, force: true });
});

// ---- fixtures ---------------------------------------------------------------
// Build a lesson file body. Only the keys passed are emitted, so a caller can omit
// `description`/`title` to exercise the description-less refusal.
function lesson({ slug, name, description, title, type, provenance, keywords, date, body } = {}) {
  const lines = ['---'];
  lines.push(`name: ${name ?? slug ?? 'lesson'}`);
  if (description !== undefined) lines.push(`description: "${description}"`);
  lines.push('metadata:');
  if (slug !== undefined) lines.push(`  slug: ${slug}`);
  if (type !== undefined) lines.push(`  type: ${type}`);
  if (provenance !== undefined) lines.push(`  provenance: ${provenance}`);
  if (title !== undefined) lines.push(`  title: "${title}"`);
  if (date !== undefined) lines.push(`  date: ${date}`);
  if (keywords) {
    lines.push('  keywords:');
    for (const k of keywords) lines.push(`    - ${k}`);
  }
  lines.push('---', '', body ?? 'A standalone portable lesson body with enough prose to index.', '');
  return lines.join('\n');
}

function writeLesson(dir, filename, opts) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), lesson(opts));
}

// A small, valid, lint-clean corpus keyed by slug -> opts.
function goodCorpus() {
  const src = tmp('seed-pack-src-');
  writeLesson(src, 'git-detached-head.md', { slug: 'git-detached-head', description: 'Detached HEAD is a state, not an error', keywords: ['git', 'head'], body: 'Checking out a commit detaches HEAD; commit lands on no branch.' });
  writeLesson(src, 'shell-quoting.md', { slug: 'shell-quoting', description: 'Quote every shell expansion', keywords: ['shell', 'bash'], body: 'Unquoted $VAR word-splits on IFS and glob-expands.' });
  writeLesson(src, 'regex-anchors.md', { slug: 'regex-anchors', description: 'Anchor regexes or they match anywhere', keywords: ['regex'], body: 'A bare pattern matches a substring; anchor with caret and dollar.' });
  return src;
}

function run(args, opts = {}) {
  return spawnSync('node', [CLI, ...args], { encoding: 'utf8', ...opts });
}
function out(r) {
  return (r.stdout || '') + (r.stderr || '');
}

// =============================================================================
// pack + verify happy path (criterion 1: manifest equality, round-trip)
// =============================================================================
test('pack then verify round-trips green; manifest mirrors tarball contents', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');

  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 0, out(p));
  assert.ok(existsSync(join(dest, 'seed.tar.gz')));
  assert.ok(existsSync(join(dest, 'seed-manifest.json')));

  const manifest = JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8'));
  assert.equal(manifest.seed.length, 3);
  assert.deepEqual(manifest.seed.map((r) => r.slug), ['git-detached-head', 'regex-anchors', 'shell-quoting']); // sorted by slug
  assert.deepEqual(manifest.archive, []);
  for (const row of manifest.seed) {
    assert.equal(typeof row.bytes, 'number');
    assert.match(row.sha256, /^[0-9a-f]{64}$/);
    assert.ok(row.description.length > 0);
  }

  const v = run(['verify', dest]);
  assert.equal(v.status, 0, out(v));
});

// =============================================================================
// verify catches a tampered member (criterion 1: altered member fails, named)
// =============================================================================
test('verify fails non-zero naming the member when a manifest sha256 is altered', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);

  const manifestPath = join(dest, 'seed-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const victim = manifest.seed.find((r) => r.slug === 'shell-quoting');
  victim.sha256 = victim.sha256.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')); // flip first hex nibble
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const v = run(['verify', dest]);
  assert.notEqual(v.status, 0);
  assert.match(out(v), /shell-quoting/);
  assert.match(out(v), /sha256|mismatch/i);
});

// =============================================================================
// caps: pack exits 4 with a ranked proposal (criterion 2)
// =============================================================================
test('pack exits 4 with a ranked eviction proposal past the member cap', () => {
  const src = tmp('seed-pack-src-');
  for (let i = 0; i < SEED_MAX_MEMBERS + 1; i++) {
    const slug = `member-${String(i).padStart(3, '0')}`;
    writeLesson(src, `${slug}.md`, { slug, description: `Portable lesson number ${i}`, body: `Body for lesson ${i}.` });
  }
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 4, out(p));
  assert.match(out(p), /cap exceeded/i);
  assert.match(out(p), /evict member-\d{3}/); // names at least one candidate
  assert.ok(!existsSync(join(dest, 'seed.tar.gz')), 'a capped-out set is never packed');
});

test('pack exits 4 past the uncompressed byte cap', () => {
  const src = tmp('seed-pack-src-');
  // Spaced prose, not a solid char run: a long run of characters in the lint email pattern's
  // class makes its greedy `+@` backtrack at O(n^2). Real seeds are small spaced prose; keep the
  // fixture representative. 3 x ~630 KB > 1,500,000 B with count 3 <= 50 -> byte axis only.
  const big = 'portable lesson filler prose token '.repeat(18_000);
  for (let i = 0; i < 3; i++) {
    const slug = `bulky-${i}`;
    writeLesson(src, `${slug}.md`, { slug, description: `Bulky lesson ${i}`, body: big });
  }
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 4, out(p).slice(0, 400));
  assert.match(out(p), /cap exceeded/i);
});

// =============================================================================
// lint + wikilink gates (criteria 3 & 4)
// =============================================================================
test('pack exits 1 naming the member and pattern on a home-path lint hit', () => {
  const src = tmp('seed-pack-src-');
  writeLesson(src, 'leaky.md', { slug: 'leaky', description: 'Leaks a home path', body: 'See /Users/someone/secret/notes.md for context.' });
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 1, out(p));
  assert.match(out(p), /leaky\.md/);
  assert.match(out(p), /home-path/);
});

test('pack exits non-zero on a [[wikilink]] member', () => {
  const src = tmp('seed-pack-src-');
  writeLesson(src, 'linky.md', { slug: 'linky', description: 'Has a wikilink', body: 'This references [[another-lesson]] which seeds must not.' });
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.notEqual(p.status, 0);
  assert.match(out(p), /linky\.md/);
  assert.match(out(p), /wikilink/i);
});

// =============================================================================
// refusal set: empty / duplicate slug / description-less (each exit 1, named)
// =============================================================================
test('pack exits 1 on an empty member set', () => {
  const src = tmp('seed-pack-src-'); // no *.md written
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 1, out(p));
  assert.match(out(p), /empty seed set|no \*\.md/i);
});

test('pack exits 1 naming the slug when two members resolve to the same slug', () => {
  const src = tmp('seed-pack-src-');
  // Two different filenames, same metadata.slug (metadata wins over filename).
  writeLesson(src, 'first.md', { slug: 'collide', description: 'First' });
  writeLesson(src, 'second.md', { slug: 'collide', description: 'Second' });
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 1, out(p));
  assert.match(out(p), /collide/);
  assert.match(out(p), /slug/i);
});

test('pack exits 1 naming the member when a description resolves empty', () => {
  const src = tmp('seed-pack-src-');
  writeLesson(src, 'nodesc.md', { slug: 'nodesc' }); // no description, no metadata.title
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 1, out(p));
  assert.match(out(p), /nodesc\.md/);
  assert.match(out(p), /description/i);
});

test('description falls back to metadata.title when description: is absent', () => {
  const src = tmp('seed-pack-src-');
  writeLesson(src, 'titled.md', { slug: 'titled', title: 'Title becomes the row', body: 'ok' });
  const dest = tmp('seed-pack-out-');
  const p = run(['pack', src, '--out', dest]);
  assert.equal(p.status, 0, out(p));
  const manifest = JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8'));
  assert.equal(manifest.seed[0].description, 'Title becomes the row');
});

// =============================================================================
// determinism: re-pack over an unchanged corpus -> byte-identical manifest
// =============================================================================
test('re-pack over an unchanged corpus yields a byte-identical seed-manifest.json', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);
  const first = readFileSync(join(dest, 'seed-manifest.json'));
  assert.equal(run(['pack', src, '--out', dest]).status, 0);
  const second = readFileSync(join(dest, 'seed-manifest.json'));
  assert.ok(first.equals(second), 'manifest bytes must be identical across re-packs');
});

// =============================================================================
// evict happy path + archive carry-forward on re-pack
// =============================================================================
test('evict moves a member to the archive tier and verify stays green', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);

  const e = run(['evict', '--slugs', 'shell-quoting', dest]);
  assert.equal(e.status, 0, out(e));

  const manifest = JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8'));
  assert.deepEqual(manifest.seed.map((r) => r.slug), ['git-detached-head', 'regex-anchors']);
  assert.deepEqual(manifest.archive.map((r) => r.slug), ['shell-quoting']);
  assert.ok(existsSync(join(dest, 'archive', 'archive.tar.gz')));

  assert.equal(run(['verify', dest]).status, 0);
});

test('a second evict appends to the existing archive tier (both members archived, verify green)', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);
  assert.equal(run(['evict', '--slugs', 'git-detached-head', dest]).status, 0);
  assert.equal(run(['evict', '--slugs', 'shell-quoting', dest]).status, 0); // onto a populated archive

  const manifest = JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8'));
  assert.deepEqual(manifest.seed.map((r) => r.slug), ['regex-anchors']);
  assert.deepEqual(manifest.archive.map((r) => r.slug), ['git-detached-head', 'shell-quoting']); // both preserved, sorted
  assert.equal(run(['verify', dest]).status, 0);
});

test('re-pack into a seed-dir with a non-empty archive tier leaves the archive array identical and verify green', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);
  assert.equal(run(['evict', '--slugs', 'regex-anchors', dest]).status, 0);

  const archiveBefore = JSON.stringify(JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8')).archive);

  // Operator drops the evicted member from src before re-packing (tiers stay disjoint).
  unlinkSync(join(src, 'regex-anchors.md'));
  assert.equal(run(['pack', src, '--out', dest]).status, 0);

  const manifest = JSON.parse(readFileSync(join(dest, 'seed-manifest.json'), 'utf8'));
  assert.equal(JSON.stringify(manifest.archive), archiveBefore, 'archive array carried forward unchanged');
  assert.equal(run(['verify', dest]).status, 0);
});

// =============================================================================
// evict archive-cap overflow -> exit 5 (criterion 2), from a fabricated manifest
// (no large real archive on disk — cap arithmetic reads the manifest only)
// =============================================================================
test('evict exits 5 when the archive would exceed the member cap', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);

  // Fabricate an archive tier already AT the member cap; no archive.tar.gz needed.
  const manifestPath = join(dest, 'seed-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.archive = Array.from({ length: ARCHIVE_MAX_MEMBERS }, (_, i) => ({
    slug: `arch-${i}`, bytes: 10, sha256: '0'.repeat(64), description: 'x', type: '', provenance: 'agent-unverified',
  }));
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const e = run(['evict', '--slugs', 'git-detached-head', dest]);
  assert.equal(e.status, 5, out(e));
  assert.match(out(e), /member cap/i);
});

test('evict exits 5 when the archive would exceed the byte cap', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);

  const manifestPath = join(dest, 'seed-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.archive = [
    { slug: 'arch-big', bytes: ARCHIVE_MAX_BYTES, sha256: '0'.repeat(64), description: 'x', type: '', provenance: 'agent-unverified' },
  ]; // count 1 (<=500), bytes AT the cap -> any real incoming member overflows the byte axis
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const e = run(['evict', '--slugs', 'git-detached-head', dest]);
  assert.equal(e.status, 5, out(e));
  assert.match(out(e), /byte cap/i);
});

test('evict exits 1 when a slug is not in the seed tier', () => {
  const src = goodCorpus();
  const dest = tmp('seed-pack-out-');
  assert.equal(run(['pack', src, '--out', dest]).status, 0);
  const e = run(['evict', '--slugs', 'not-a-member', dest]);
  assert.equal(e.status, 1, out(e));
  assert.match(out(e), /not-a-member/);
});

// =============================================================================
// eviction ranking: near-dupe outranks a larger unique member (spec §3 order)
// =============================================================================
test('rankEvictions puts near-dupes ahead of a larger unique member', () => {
  const dupBody = 'Retrying a flaky network upstream call needs exponential backoff with jitter to avoid a thundering-herd stampede during an outage window.';
  const mkRec = (slug, body) => lessonRecord(parseFrontmatter(lesson({ slug, description: 'x', keywords: ['backoff', 'jitter', 'retry'], body })), { root: 'seed', temperature: 'hot', slug, file: `${slug}.md` });

  const members = [
    { slug: 'dupe-a', bytes: 100, effectiveDate: '2026-01-01', _record: mkRec('dupe-a', dupBody) },
    { slug: 'dupe-b', bytes: 100, effectiveDate: '2026-01-01', _record: mkRec('dupe-b', dupBody) },
    { slug: 'unique-large', bytes: 999_999, effectiveDate: '2020-01-01', _record: mkRec('unique-large', 'YAML frontmatter indentation must be spaces; a tab throws a parser error every single time.') },
  ];
  const ranked = rankEvictions(members).map((m) => m.slug);
  assert.deepEqual(new Set([ranked[0], ranked[1]]), new Set(['dupe-a', 'dupe-b']), `near-dupes first, got ${ranked}`);
  assert.equal(ranked[2], 'unique-large', 'the larger unique member ranks last (near-dupe beats bytes)');
});
