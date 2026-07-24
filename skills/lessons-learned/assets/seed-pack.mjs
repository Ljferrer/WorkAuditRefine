#!/usr/bin/env node
// seed-pack — pack / verify / evict the portable-lesson seed corpus (docs/seed/).
// Spec: docs/specs/2026-07-22-lessons-learned-seed-design.md §4; plan task 1.1.
//
// The corpus ships as a gzip tarball (docs/seed/seed.tar.gz) whose committed mirror
// (seed-manifest.json) is the reviewable/dedupable projection. Equality is CONTENTS-level
// (member set + per-member bytes + sha256), NEVER gz-byte-level — gzip is nondeterministic and
// BSD/GNU tar diverge, so no verb and no test ever hashes the tarball blob. Hold that line.
//
// Node >= 24: this imports war-memory.mjs (lint / findNearDupes; effectiveDate via lessonRecord),
// which feature-detects node:sqlite and exits loud on older runtimes — so the seed mode fails at
// preflight on old Node, never partially seeds. seed-pack adds no dependency of its own: the
// system `tar` (portable -czf / -xzf / -C flags only, never --sort — BSD compat) does the
// archiving, and equality is always checked against unpacked contents.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  lint,
  findNearDupes,
  buildIndex,
  parseFrontmatter,
  lessonRecord,
} from '../../_shared/war-memory.mjs';

// ---------------------------------------------------------------------------
// Caps (spec §2 / §3). Bytes are decimal (1500 KB = 1_500_000 B; 100 MB = 100_000_000 B),
// matching the plan's literal 1,500,000-B seed cap. Dual-axis on BOTH tiers: overflow on
// EITHER count or bytes. Exported so the tests assert against the constant, not a magic number.
// ---------------------------------------------------------------------------
export const SEED_MAX_MEMBERS = 50;
export const SEED_MAX_BYTES = 1_500_000;
export const ARCHIVE_MAX_MEMBERS = 500;
export const ARCHIVE_MAX_BYTES = 100_000_000;

// Exit codes. 1 = refusal / bad args / tar|fs failure (no dedicated code for tar|fs — spec §4:
// "any tar or filesystem failure exits non-zero echoing the underlying error"); 3 = verify
// mismatch (any axis); 4 = pack seed-cap overflow (prints a ranked eviction proposal); 5 = evict
// archive-cap overflow.
const EXIT_REFUSE = 1;
const EXIT_VERIFY = 3;
const EXIT_CAP = 4;
const EXIT_ARCHIVE_CAP = 5;

const SEED_TARBALL = 'seed.tar.gz';
const MANIFEST_FILE = 'seed-manifest.json';
const ARCHIVE_DIR = 'archive';
const ARCHIVE_TARBALL = 'archive.tar.gz'; // lives at <seed-dir>/archive/archive.tar.gz
const PROJECTION_FILE = 'MEMORY.md'; // generated projection, never a lesson (mirrors war-memory)

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
function die(code, msg) {
  process.stderr.write(msg.endsWith('\n') ? msg : msg + '\n');
  process.exit(code);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function bySlug(a, b) {
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

// Minimal argv parser (war-memory's is not exported): `--k v` / bare `--flag` / positionals in _.
function parseArgv(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

// Shell out to system tar; any spawn error or non-zero status is fatal, echoing the underlying
// stderr. Portable flags only — never --sort (BSD tar lacks it), so archive BYTES are never
// deterministic and are never asserted; only unpacked contents are.
function runTar(args, what) {
  const r = spawnSync('tar', args, { encoding: 'utf8' });
  if (r.error) die(EXIT_REFUSE, `seed-pack: ${what} failed: ${r.error.message}`);
  if (r.status !== 0) {
    die(EXIT_REFUSE, `seed-pack: ${what} failed (tar exit ${r.status}): ${(r.stderr || '').trim()}`);
  }
}

function tarCreate(tarballPath, dir, what) {
  // -C dir . packs the directory CONTENTS (entries land flat on extract). No --sort (BSD compat).
  runTar(['-czf', tarballPath, '-C', dir, '.'], what);
}

function tarExtract(tarballPath, destDir, what) {
  fs.mkdirSync(destDir, { recursive: true });
  runTar(['-xzf', tarballPath, '-C', destDir], what);
}

// Recursively collect *.md files (extraction is flat, but a tar `./` prefix or stray nesting is
// tolerated defensively). Returns absolute paths.
function collectMd(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectMd(p));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Manifest I/O. Deterministic serialization (fixed key order, sorted arrays, 2-space indent) so
// that re-packing an unchanged corpus yields a BYTE-IDENTICAL manifest (the tarball blob may
// churn — accepted, never asserted).
// ---------------------------------------------------------------------------
function manifestRow(m) {
  return {
    slug: m.slug,
    bytes: m.bytes,
    sha256: m.sha256,
    description: m.description,
    type: m.type,
    provenance: m.provenance,
  };
}

function writeManifest(dir, manifest) {
  fs.writeFileSync(path.join(dir, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + '\n');
}

function readManifest(dir) {
  const p = path.join(dir, MANIFEST_FILE);
  let text;
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch (e) {
    die(EXIT_REFUSE, `seed-pack: cannot read manifest '${p}': ${e.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    die(EXIT_REFUSE, `seed-pack: manifest '${p}' is not valid JSON: ${e.message}`);
  }
}

function readManifestIfPresent(dir) {
  if (!fs.existsSync(path.join(dir, MANIFEST_FILE))) return null;
  return readManifest(dir);
}

// ---------------------------------------------------------------------------
// Member resolution (pack). Each top-level *.md member of the src dir passes fail-closed gates,
// then contributes a manifest row. Non-recursive and skips the generated MEMORY.md projection —
// mirrors war-memory's readLessonsFromDir (a seed corpus is a flat memory root; archive/ is a
// separate tier handled by evict).
// ---------------------------------------------------------------------------
function readMembers(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    die(EXIT_REFUSE, `seed-pack pack: cannot read src dir '${dir}': ${e.message}`);
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue;
    if (e.name === PROJECTION_FILE) continue;
    out.push({ name: e.name, content: fs.readFileSync(path.join(dir, e.name), 'utf8') });
  }
  return out;
}

// Resolve one raw member into a manifest-ready row (+ its content + a lessonRecord for ranking).
// Fail-closed gates, in order: redaction lint (criterion 3), wikilink rejection (criterion 4),
// empty description after the description -> metadata.title fallback (the manifest row is the
// design's sole review surface and the nomination issue title). Dies on any hit.
function resolveMember(name, content) {
  const hits = lint(content);
  if (hits.length > 0) {
    const h = hits[0];
    die(EXIT_REFUSE, `seed-pack pack: '${name}': redaction lint hit (${h.pattern}: ${h.match}) — seeds must be scrubbed`);
  }
  if (content.includes('[[')) {
    die(EXIT_REFUSE, `seed-pack pack: '${name}': contains a [[wikilink]] — seeds must be standalone`);
  }
  const rec = lessonRecord(parseFrontmatter(content), {
    root: 'seed',
    temperature: 'hot',
    slug: name.slice(0, -3), // filename slug; metadata.slug wins inside lessonRecord
    file: name,
  });
  if (!rec.description) {
    die(EXIT_REFUSE, `seed-pack pack: '${name}': description resolves empty (no 'description:' and no metadata.title) — the manifest row needs it`);
  }
  const buf = Buffer.from(content, 'utf8');
  return {
    slug: rec.slug,
    bytes: buf.byteLength,
    sha256: sha256(buf),
    description: rec.description,
    type: rec.type,
    provenance: rec.provenance,
    effectiveDate: rec.effectiveDate,
    _name: name,
    _content: content,
    _record: rec,
  };
}

// ---------------------------------------------------------------------------
// Eviction ranking (spec §3): near-dupe first (findNearDupes), then largest bytes, then oldest
// effectiveDate. Undated members sort LAST within their group (no age signal — do not
// preferentially evict them). Exported for a focused unit assertion.
// ---------------------------------------------------------------------------
export function rankEvictions(members) {
  const records = members.map((m) => m._record);
  const db = buildIndex(records);
  const dupeBest = new Map(); // slug -> closest (lowest, i.e. most-negative) near-dupe score
  try {
    for (const { a, b, score } of findNearDupes(db, records, records.map((r) => r.slug))) {
      if (!dupeBest.has(a) || score < dupeBest.get(a)) dupeBest.set(a, score);
      if (!dupeBest.has(b) || score < dupeBest.get(b)) dupeBest.set(b, score);
    }
  } finally {
    db.close();
  }
  return [...members].sort((x, y) => {
    const xd = dupeBest.has(x.slug);
    const yd = dupeBest.has(y.slug);
    if (xd !== yd) return xd ? -1 : 1; // near-dupes first
    if (xd && yd && dupeBest.get(x.slug) !== dupeBest.get(y.slug)) {
      return dupeBest.get(x.slug) - dupeBest.get(y.slug); // closer dupe first (lower score)
    }
    if (x.bytes !== y.bytes) return y.bytes - x.bytes; // largest bytes next
    if (x.effectiveDate && y.effectiveDate) {
      return x.effectiveDate < y.effectiveDate ? -1 : x.effectiveDate > y.effectiveDate ? 1 : 0; // oldest first
    }
    if (x.effectiveDate) return -1; // dated before undated
    if (y.effectiveDate) return 1;
    return bySlug(x, y); // stable tiebreak
  });
}

function seedTotals(members) {
  return { count: members.length, bytes: members.reduce((s, m) => s + m.bytes, 0) };
}

function seedOverflows({ count, bytes }) {
  return count > SEED_MAX_MEMBERS || bytes > SEED_MAX_BYTES;
}

// Minimal prefix of the eviction ranking that brings BOTH axes back under cap.
function proposeEvictions(members) {
  const ranked = rankEvictions(members);
  let { count, bytes } = seedTotals(members);
  const proposed = [];
  for (const m of ranked) {
    if (count <= SEED_MAX_MEMBERS && bytes <= SEED_MAX_BYTES) break;
    proposed.push(m);
    count -= 1;
    bytes -= m.bytes;
  }
  return { proposed, resultCount: count, resultBytes: bytes };
}

// ---------------------------------------------------------------------------
// pack <src-dir> --out <seed-dir>
// ---------------------------------------------------------------------------
function cmdPack(argv) {
  const src = argv._[1];
  const out = argv.out;
  if (!src) die(EXIT_REFUSE, 'seed-pack pack: <src-dir> required');
  if (!out || out === true) die(EXIT_REFUSE, 'seed-pack pack: --out <seed-dir> required');

  const raw = readMembers(src);
  if (raw.length === 0) {
    die(EXIT_REFUSE, `seed-pack pack: '${src}' has no *.md members — refusing to pack an empty seed set`);
  }

  const members = raw.map((m) => resolveMember(m.name, m.content));

  // Duplicate slug (metadata.slug already won over filename inside resolveMember).
  const seen = new Map();
  for (const m of members) {
    if (seen.has(m.slug)) {
      die(EXIT_REFUSE, `seed-pack pack: two members resolve to slug '${m.slug}' ('${seen.get(m.slug)}' and '${m._name}') — slug must be unique (metadata.slug wins over filename)`);
    }
    seen.set(m.slug, m._name);
  }

  // Seed caps — refuse a capped-out set with a ranked eviction proposal (never pack it).
  const totals = seedTotals(members);
  if (seedOverflows(totals)) {
    const { proposed, resultCount, resultBytes } = proposeEvictions(members);
    const lines = [
      `seed-pack pack: seed cap exceeded — ${totals.count} members / ${totals.bytes} B (caps: ${SEED_MAX_MEMBERS} members / ${SEED_MAX_BYTES} B).`,
      'Ranked eviction proposal (near-dupe -> largest bytes -> oldest date):',
    ];
    for (const m of proposed) lines.push(`  evict ${m.slug} (${m.bytes} B)`);
    lines.push(`  => after eviction: ${resultCount} members / ${resultBytes} B (under cap)`);
    die(EXIT_CAP, lines.join('\n'));
  }

  // Carry any existing archive tier forward UNCHANGED (absent -> []); never touch archive.tar.gz.
  const existing = readManifestIfPresent(out);
  const archive = existing && Array.isArray(existing.archive) ? existing.archive : [];

  // Stage each member as <slug>.md so the tarball member set == the manifest slug set, then tar.
  const staging = mkdtemp('seed-pack-stage-');
  try {
    for (const m of members) fs.writeFileSync(path.join(staging, `${m.slug}.md`), m._content);
    fs.mkdirSync(out, { recursive: true });
    tarCreate(path.join(out, SEED_TARBALL), staging, 'pack (tar create)');
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }

  writeManifest(out, {
    seed: members.map(manifestRow).sort(bySlug),
    archive: [...archive].sort(bySlug),
  });
  process.stdout.write(`seed-pack: packed ${totals.count} members / ${totals.bytes} B -> ${path.join(out, SEED_TARBALL)}\n`);
}

// ---------------------------------------------------------------------------
// verify <seed-dir> — manifest <-> tarball contents equality on both tiers, both cap axes,
// per-member lint + wikilink cleanliness. Any failure exits non-zero naming the axis.
// ---------------------------------------------------------------------------
function verifyTier(tarball, rows, tier, maxMembers, maxBytes) {
  if (rows.length > maxMembers) {
    die(EXIT_VERIFY, `seed-pack verify: ${tier} member cap exceeded — ${rows.length} > ${maxMembers}`);
  }
  const rowBytes = rows.reduce((s, r) => s + r.bytes, 0);
  if (rowBytes > maxBytes) {
    die(EXIT_VERIFY, `seed-pack verify: ${tier} byte cap exceeded — ${rowBytes} > ${maxBytes} B`);
  }

  const tmp = mkdtemp(`seed-pack-verify-${tier}-`);
  try {
    tarExtract(tarball, tmp, `verify (${tier} tar extract)`);
    const contentBySlug = new Map();
    for (const f of collectMd(tmp)) contentBySlug.set(path.basename(f).slice(0, -3), fs.readFileSync(f));

    // Member-set equality (both directions).
    const rowSlugs = new Set(rows.map((r) => r.slug));
    for (const s of rowSlugs) {
      if (!contentBySlug.has(s)) die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${s}' is in the manifest but missing from the tarball`);
    }
    for (const s of contentBySlug.keys()) {
      if (!rowSlugs.has(s)) die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${s}' is in the tarball but missing from the manifest`);
    }

    // Per-member bytes + sha256 + lint + wikilink.
    for (const r of rows) {
      const buf = contentBySlug.get(r.slug);
      if (buf.byteLength !== r.bytes) {
        die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${r.slug}' byte mismatch — manifest ${r.bytes}, tarball ${buf.byteLength}`);
      }
      const h = sha256(buf);
      if (h !== r.sha256) {
        die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${r.slug}' sha256 mismatch — manifest ${r.sha256}, tarball ${h}`);
      }
      const text = buf.toString('utf8');
      const lintHits = lint(text);
      if (lintHits.length > 0) {
        die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${r.slug}' fails redaction lint (${lintHits[0].pattern}: ${lintHits[0].match})`);
      }
      if (text.includes('[[')) {
        die(EXIT_VERIFY, `seed-pack verify: ${tier} member '${r.slug}' contains a [[wikilink]]`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function cmdVerify(argv) {
  const dir = argv._[1];
  if (!dir) die(EXIT_REFUSE, 'seed-pack verify: <seed-dir> required');
  const manifest = readManifest(dir);
  if (!Array.isArray(manifest.seed) || !Array.isArray(manifest.archive)) {
    die(EXIT_VERIFY, `seed-pack verify: manifest is missing its 'seed'/'archive' arrays`);
  }

  const seedTarball = path.join(dir, SEED_TARBALL);
  if (!fs.existsSync(seedTarball)) die(EXIT_VERIFY, `seed-pack verify: seed tarball ${seedTarball} is absent`);
  verifyTier(seedTarball, manifest.seed, 'seed', SEED_MAX_MEMBERS, SEED_MAX_BYTES);

  // Archive tier: an absent archive.tar.gz is a zero-member tier (git needs no empty dir).
  const archiveTarball = path.join(dir, ARCHIVE_DIR, ARCHIVE_TARBALL);
  if (fs.existsSync(archiveTarball)) {
    verifyTier(archiveTarball, manifest.archive, 'archive', ARCHIVE_MAX_MEMBERS, ARCHIVE_MAX_BYTES);
  } else if (manifest.archive.length > 0) {
    die(EXIT_VERIFY, `seed-pack verify: manifest lists ${manifest.archive.length} archive member(s) but ${archiveTarball} is absent`);
  }

  process.stdout.write(`seed-pack: verify OK — seed ${manifest.seed.length} members, archive ${manifest.archive.length} members\n`);
}

// ---------------------------------------------------------------------------
// evict --slugs <a,b,...> <seed-dir> — move members seed -> archive/archive.tar.gz, rewriting
// both manifest arrays. Never deletes. The archive-cap decision is PURE MANIFEST ARITHMETIC
// (manifest.archive + incoming rows) — the existing archive is never unpacked for cap math, so
// the exit-5 path fires from a fabricated manifest with no large real archive on disk. Only the
// success path (under cap) unpacks to physically move files.
// ---------------------------------------------------------------------------
function cmdEvict(argv) {
  const dir = argv._[1];
  if (!dir) die(EXIT_REFUSE, 'seed-pack evict: <seed-dir> required');
  if (!argv.slugs || argv.slugs === true) die(EXIT_REFUSE, 'seed-pack evict: --slugs <a,b,...> required');
  const slugs = String(argv.slugs).split(',').map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) die(EXIT_REFUSE, 'seed-pack evict: --slugs listed no slugs');

  const manifest = readManifest(dir);
  const seedBySlug = new Map((manifest.seed || []).map((r) => [r.slug, r]));
  const incoming = [];
  for (const s of slugs) {
    const row = seedBySlug.get(s);
    if (!row) die(EXIT_REFUSE, `seed-pack evict: slug '${s}' is not in the seed tier`);
    incoming.push(row);
  }

  // Cap arithmetic from the manifest only (never unpack the existing archive — verify owns
  // contents equality; the manifest is the single source for cap arithmetic).
  const archiveRows = manifest.archive || [];
  const newCount = archiveRows.length + incoming.length;
  const newBytes = archiveRows.reduce((s, r) => s + r.bytes, 0) + incoming.reduce((s, r) => s + r.bytes, 0);
  if (newCount > ARCHIVE_MAX_MEMBERS) {
    die(EXIT_ARCHIVE_CAP, `seed-pack evict: archive member cap would be exceeded — ${newCount} > ${ARCHIVE_MAX_MEMBERS}; prune the archive by hand (never auto-deleted)`);
  }
  if (newBytes > ARCHIVE_MAX_BYTES) {
    die(EXIT_ARCHIVE_CAP, `seed-pack evict: archive byte cap would be exceeded — ${newBytes} > ${ARCHIVE_MAX_BYTES} B; prune the archive by hand (never auto-deleted)`);
  }

  // Success path — physically move members (unpack allowed here; the cap decision above was
  // pure manifest math). seedTmp and archTmp are both under os.tmpdir() => same device => rename.
  const evictSet = new Set(slugs);
  const seedTmp = mkdtemp('seed-pack-evict-seed-');
  const archTmp = mkdtemp('seed-pack-evict-arch-');
  try {
    tarExtract(path.join(dir, SEED_TARBALL), seedTmp, 'evict (seed tar extract)');
    const archiveTarball = path.join(dir, ARCHIVE_DIR, ARCHIVE_TARBALL);
    if (fs.existsSync(archiveTarball)) tarExtract(archiveTarball, archTmp, 'evict (archive tar extract)');

    for (const s of slugs) {
      const found = collectMd(seedTmp).find((f) => path.basename(f) === `${s}.md`);
      if (!found) die(EXIT_REFUSE, `seed-pack evict: member '${s}.md' is in the manifest but missing from ${SEED_TARBALL}`);
      fs.renameSync(found, path.join(archTmp, `${s}.md`));
    }

    tarCreate(path.join(dir, SEED_TARBALL), seedTmp, 'evict (seed tar create)');
    fs.mkdirSync(path.join(dir, ARCHIVE_DIR), { recursive: true });
    tarCreate(archiveTarball, archTmp, 'evict (archive tar create)');
  } finally {
    fs.rmSync(seedTmp, { recursive: true, force: true });
    fs.rmSync(archTmp, { recursive: true, force: true });
  }

  writeManifest(dir, {
    seed: (manifest.seed || []).filter((r) => !evictSet.has(r.slug)).sort(bySlug),
    archive: [...archiveRows, ...incoming].sort(bySlug),
  });
  process.stdout.write(`seed-pack: evicted ${slugs.length} member(s) -> archive (${newCount} archived)\n`);
}

// ---------------------------------------------------------------------------
// CLI dispatch
// ---------------------------------------------------------------------------
const VERBS = { pack: cmdPack, verify: cmdVerify, evict: cmdEvict };

function main() {
  const argv = parseArgv(process.argv.slice(2));
  const verb = argv._[0];
  const fn = VERBS[verb];
  if (!fn) die(EXIT_REFUSE, `seed-pack: unknown verb '${verb ?? ''}'. Verbs: ${Object.keys(VERBS).join(', ')}`);
  fn(argv);
}

// Robust CLI-entry guard: fileURLToPath(import.meta.url) is absolute; process.argv[1] may be
// relative, so realpathSync it — comparing absolute vs as-given makes a relative `node
// seed-pack.mjs` invocation silently no-op (lesson:
// cli-main-guard-equality-check-silently-noops-under-relative-invocation).
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main();
}
