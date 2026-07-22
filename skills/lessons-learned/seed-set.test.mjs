import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Standing corpus contract: the committed docs/seed/ pair (seed.tar.gz + seed-manifest.json)
// must pass `seed-pack.mjs verify` — the drift guard for the manifest <-> tarball mirror,
// discovered by the repo's `node --test 'skills/**/*.test.mjs'` gate. Paths resolve off
// import.meta.url (the sibling doc-contract test's repo-root idiom), never process.cwd(), so the
// gate is location-independent (a relative-cwd invocation would silently mis-target — lesson
// cli-main-guard-equality-check-silently-noops-under-relative-invocation).
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO_ROOT, 'skills/lessons-learned/assets/seed-pack.mjs');
const SEED_DIR = join(REPO_ROOT, 'docs/seed');

const TEMPS = [];
after(() => {
  for (const d of TEMPS) rmSync(d, { recursive: true, force: true });
});

test('seed-set: committed docs/seed/ passes seed-pack verify (exit 0)', () => {
  const r = spawnSync('node', [CLI, 'verify', SEED_DIR], { encoding: 'utf8' });
  assert.equal(
    r.status,
    0,
    `seed-pack verify must exit 0 on the committed corpus — the manifest and tarball drifted.\n` +
      `stdout: ${r.stdout}\nstderr: ${r.stderr}`,
  );
});

// Temp-break proof: mutating ONE byte of the manifest (a single sha256 hex nibble) in a fixture
// copy makes verify fail — proves the green contract above is discriminating, not vacuous. Without
// this the passing test could not distinguish a correct corpus from a broken verify.
test('seed-set: a one-byte manifest mutation fails verify (guard is discriminating)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'seed-set-break-'));
  TEMPS.push(tmp);
  copyFileSync(join(SEED_DIR, 'seed.tar.gz'), join(tmp, 'seed.tar.gz'));

  const manifestText = readFileSync(join(SEED_DIR, 'seed-manifest.json'), 'utf8');
  const m = manifestText.match(/"sha256":\s*"([0-9a-f]{64})"/);
  assert.ok(m, 'manifest must carry at least one 64-hex sha256 to mutate');
  const orig = m[1];
  const last = orig.slice(-1);
  const flipped = orig.slice(0, -1) + (last === '0' ? '1' : '0'); // one-byte change, still valid hex
  const broken = manifestText.replace(orig, flipped);
  assert.notEqual(broken, manifestText, 'the mutation must actually change the manifest text');
  writeFileSync(join(tmp, 'seed-manifest.json'), broken);

  const r = spawnSync('node', [CLI, 'verify', tmp], { encoding: 'utf8' });
  assert.notEqual(r.status, 0, 'verify must reject a manifest whose sha256 no longer matches the tarball');
});
