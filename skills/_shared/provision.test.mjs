import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateProvision, structuralFallback, readManifest } from './provision.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, 'fixtures', 'provision')
const SUBMODULE_INIT = 'git submodule update --init --recursive'
const PNPM_INSTALL = 'pnpm install --frozen-lockfile'

// Build a throwaway repo dir with the given files (name -> contents) for the
// combined / empty structuralFallback cases (kept out of the committed fixtures,
// which are exactly the two the plan names).
function makeRepo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'provision-fb-'))
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents)
  }
  return dir
}

// ----------------------------------------------------------------------------
// validateProvision
// ----------------------------------------------------------------------------

test('validateProvision: accepts an array of non-empty trimmed strings', () => {
  const r = validateProvision(['pnpm install --frozen-lockfile', 'make setup'])
  assert.deepEqual(r, { ok: true, errors: [] })
})

test('validateProvision: accepts an empty array (the default, no steps)', () => {
  const r = validateProvision([])
  assert.equal(r.ok, true)
  assert.deepEqual(r.errors, [])
})

test('validateProvision: rejects a non-array (string) with a clear error', () => {
  const r = validateProvision('pnpm install')
  assert.equal(r.ok, false)
  assert.equal(r.errors.length >= 1, true)
  assert.match(r.errors[0], /array/i)
})

test('validateProvision: rejects null and undefined (non-arrays)', () => {
  for (const bad of [null, undefined]) {
    const r = validateProvision(bad)
    assert.equal(r.ok, false, `expected ${String(bad)} to be rejected`)
    assert.match(r.errors[0], /array/i)
  }
})

test('validateProvision: rejects a plain object and a number (non-arrays)', () => {
  for (const bad of [{ 0: 'x' }, 42]) {
    const r = validateProvision(bad)
    assert.equal(r.ok, false)
    assert.match(r.errors[0], /array/i)
  }
})

test('validateProvision: rejects an empty-string entry with a clear, indexed error', () => {
  const r = validateProvision(['make setup', ''])
  assert.equal(r.ok, false)
  assert.equal(r.errors.length, 1)
  // message identifies the offending index
  assert.match(r.errors[0], /1/)
})

test('validateProvision: rejects a whitespace-only entry', () => {
  const r = validateProvision(['   '])
  assert.equal(r.ok, false)
  assert.equal(r.errors.length, 1)
  assert.match(r.errors[0], /empty|whitespace|blank/i)
})

test('validateProvision: rejects a tab/newline-only entry', () => {
  const r = validateProvision(['\t\n'])
  assert.equal(r.ok, false)
  assert.equal(r.errors.length, 1)
})

test('validateProvision: rejects non-string entries (number, null, object)', () => {
  const r = validateProvision([5, null, { cmd: 'x' }])
  assert.equal(r.ok, false)
  // one error per offending entry
  assert.equal(r.errors.length, 3)
  for (const e of r.errors) assert.match(e, /string/i)
})

test('validateProvision: reports one error per offending entry across a mixed list', () => {
  const r = validateProvision(['ok', '', 7])
  assert.equal(r.ok, false)
  assert.equal(r.errors.length, 2)
})

test('validateProvision: a valid entry with surrounding whitespace is still accepted', () => {
  // non-empty once trimmed -> valid (validate does not mutate the list)
  const r = validateProvision(['  make setup  '])
  assert.equal(r.ok, true)
})

// ----------------------------------------------------------------------------
// structuralFallback
// ----------------------------------------------------------------------------

test('structuralFallback: .gitmodules present -> submodule init only', () => {
  const out = structuralFallback(join(FIXTURES, 'submodule-repo'))
  assert.deepEqual(out, [SUBMODULE_INIT])
})

test('structuralFallback: pnpm-lock.yaml present -> frozen install only', () => {
  const out = structuralFallback(join(FIXTURES, 'pnpm-repo'))
  assert.deepEqual(out, [PNPM_INSTALL])
})

test('structuralFallback: both present -> [submodule-init, install] IN THAT ORDER', () => {
  const dir = makeRepo({
    '.gitmodules': '[submodule "x"]\n\tpath = x\n\turl = https://e.x/x.git\n',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
  })
  try {
    const out = structuralFallback(dir)
    assert.deepEqual(out, [SUBMODULE_INIT, PNPM_INSTALL])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('structuralFallback: neither present -> [] (tiny floor, no ecosystem guesswork)', () => {
  const dir = makeRepo({ 'README.md': '# hi\n', 'index.js': '' })
  try {
    assert.deepEqual(structuralFallback(dir), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('structuralFallback: a non-existent repoDir yields [] rather than throwing', () => {
  const dir = join(tmpdir(), 'provision-does-not-exist-' + Date.now())
  assert.deepEqual(structuralFallback(dir), [])
})

test('structuralFallback: an unknown lockfile is NOT matched (anti-goal: no ecosystem table)', () => {
  // package-lock.json / yarn.lock / Cargo.lock etc. are intentionally out of the
  // tiny floor — only pnpm-lock.yaml is recognized.
  const dir = makeRepo({
    'package-lock.json': '{}',
    'yarn.lock': '',
    'Cargo.lock': '',
    'requirements.txt': '',
  })
  try {
    assert.deepEqual(structuralFallback(dir), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ----------------------------------------------------------------------------
// readManifest — T1.1
// ----------------------------------------------------------------------------

test('readManifest: absent file -> {found:false}', () => {
  const dir = makeRepo({})
  try {
    const r = readManifest(dir)
    assert.deepEqual(r, { found: false })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readManifest: valid manifest with two steps and rationale -> found:true, ok:true', () => {
  const dir = makeRepo({
    '.war-provision.json': JSON.stringify({
      provision: ['git submodule update --init --recursive', 'pnpm install --frozen-lockfile'],
      rationale: 'bootstrap the repo',
    }),
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, true)
    assert.deepEqual(r.provision, ['git submodule update --init --recursive', 'pnpm install --frozen-lockfile'])
    assert.equal(r.rationale, 'bootstrap the repo')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readManifest: empty provision list -> found:true, ok:true', () => {
  const dir = makeRepo({
    '.war-provision.json': JSON.stringify({ provision: [] }),
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, true)
    assert.deepEqual(r.provision, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readManifest: malformed JSON -> found:true, ok:false, errors non-empty', () => {
  const dir = makeRepo({
    '.war-provision.json': '{not valid json',
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, false)
    assert.ok(r.errors.length >= 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readManifest: bad entry ["ok","  "] -> ok:false, error matches /provision[1].*non-empty/', () => {
  const dir = makeRepo({
    '.war-provision.json': JSON.stringify({ provision: ['ok', '  '] }),
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, false)
    const hasMatch = r.errors.some(e => /provision\[1\].*non-empty/i.test(e))
    assert.ok(hasMatch, `expected error matching /provision[1].*non-empty/ in: ${JSON.stringify(r.errors)}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readManifest: unknown top-level key -> ok:false, error names the key', () => {
  const dir = makeRepo({
    '.war-provision.json': JSON.stringify({ provision: [], bogus: 1 }),
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, false)
    const hasMatch = r.errors.some(e => e.includes('bogus'))
    assert.ok(hasMatch, `expected error naming 'bogus' in: ${JSON.stringify(r.errors)}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// RED-TEAM-ADDED (CRITICAL): non-object JSON must not crash — null/[]/string/number
// are valid JSON but are not objects; without a guard, Object.keys(parsed) throws.
for (const [label, raw] of [['null', 'null'], ['array', '[]'], ['string', '"x"'], ['number', '42']]) {
  test(`readManifest: non-object JSON (${label}) -> found:true, ok:false with object-guard error (no crash)`, () => {
    const dir = makeRepo({ '.war-provision.json': raw })
    try {
      const r = readManifest(dir)
      assert.equal(r.found, true)
      assert.equal(r.ok, false)
      assert.ok(r.errors.length >= 1)
      const hasMatch = r.errors.some(e => /object/i.test(e))
      assert.ok(hasMatch, `expected 'object' in error for ${label}: ${JSON.stringify(r.errors)}`)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
}

// ----------------------------------------------------------------------------
// readManifest — T1.2 golden fixture (manifest-repo)
// ----------------------------------------------------------------------------

test('readManifest: manifest-repo fixture -> found:true, ok:true, provision verbatim from manifest (not CI)', () => {
  const r = readManifest(join(FIXTURES, 'manifest-repo'))
  assert.equal(r.found, true)
  assert.equal(r.ok, true)
  // Assert on unique manifest command — NOT the CI-only command (pnpm install --frozen-lockfile)
  // This proves the reader returns the committed manifest VERBATIM, not the competing CI workflow.
  assert.ok(
    r.provision.includes('./scripts/bootstrap.sh'),
    `expected unique manifest command './scripts/bootstrap.sh' in provision: ${JSON.stringify(r.provision)}`,
  )
  assert.deepEqual(r.provision, ['./scripts/bootstrap.sh', 'cargo build --locked'])
})
