import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync, readFileSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

import { validateProvision, structuralFallback, readManifest, submodulePaths } from './provision.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, 'fixtures', 'provision')
// Inits only the uninitialized (`-`) submodules, so an initialized sibling keeps
// its own HEAD (operator ruling 2026-11-13). `xargs -r` runs nothing on empty input.
// GIT_LITERAL_PATHSPECS=1 keeps a `-` path such as `lib*` from matching `libx`.
const SUBMODULE_INIT = "git submodule status --recursive | awk '/^-/{print $2}' | GIT_LITERAL_PATHSPECS=1 xargs -r git submodule update --init --recursive --"
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

test('validateProvision: rejects a discard-exit tail', () => {
  // Each shape of the closed set (A26), with the operator-to-word whitespace varied.
  const cases = [
    ['pnpm install || true', '|| true'],
    ['pnpm install ||true  ', '|| true'],
    ['pnpm install ||  true', '|| true'],
    ['make setup || :', '|| :'],
    ['make setup||:', '|| :'],
    ['make setup ||  :', '|| :'],
    ['npm ci || exit 0', '|| exit 0'],
    ['npm ci ||exit   0', '|| exit 0'],
    ['npm ci ||  exit 0', '|| exit 0'],
    ['make deps; true', '; true'],
    ['make deps;true', '; true'],
    ['make deps ;  true', '; true'],
  ]
  for (const [entry, tail] of cases) {
    const r = validateProvision(['make setup', entry])
    assert.equal(r.ok, false, `expected ${JSON.stringify(entry)} to be refused`)
    assert.deepEqual(r.errors, [
      `provision[1] ends in a discard-exit tail ('${tail}'); a failed step must fail the Provision barrier (#2716)`,
    ])
  }
  // A mixed list reports one indexed error per offender.
  const mixed = validateProvision(['a || true', 'make setup', 'b || :', 'c || exit 0', 'd; true'])
  assert.equal(mixed.ok, false)
  assert.deepEqual(mixed.errors, [
    "provision[0] ends in a discard-exit tail ('|| true'); a failed step must fail the Provision barrier (#2716)",
    "provision[2] ends in a discard-exit tail ('|| :'); a failed step must fail the Provision barrier (#2716)",
    "provision[3] ends in a discard-exit tail ('|| exit 0'); a failed step must fail the Provision barrier (#2716)",
    "provision[4] ends in a discard-exit tail ('; true'); a failed step must fail the Provision barrier (#2716)",
  ])
})

test('validateProvision: accepts an or-fallback to a real command', () => {
  for (const entry of ['pnpm install --frozen-lockfile || npm ci', 'true', 'make setup || truecmd', 'make deps; trueish', 'make setup || : ; make verify', 'npm ci || exit 05', 'npm ci || exit0']) {
    assert.deepEqual(validateProvision([entry]), { ok: true, errors: [] }, `expected ${JSON.stringify(entry)} to pass`)
  }
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

// Run the real structuralFallback submodule step in a fixture clone whose
// submodule `a` is initialized but checked out off its recorded commit and whose
// submodule `b` is uninitialized, then again with an uninitialized `lib*` beside
// an initialized `libx` off its recorded commit. Local file-URL submodules only; the
// protocol.file.allow override rides the env, never the command text.
test('structuralFallback: the submodule step leaves an initialized sibling at its own HEAD and inits an uninitialized one', () => {
  const root = mkdtempSync(join(tmpdir(), 'provision-sm-'))
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.file.allow',
    GIT_CONFIG_VALUE_0: 'always',
    GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid',
    GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid',
  }
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    const sub = join(root, 'sub')
    git(root, 'init', '-q', sub)
    git(sub, 'commit', '-q', '--allow-empty', '-m', 'c1')
    const c1 = git(sub, 'rev-parse', 'HEAD')
    git(sub, 'commit', '-q', '--allow-empty', '-m', 'c2')
    const c2 = git(sub, 'rev-parse', 'HEAD')
    git(sub, 'checkout', '-q', c1)

    const sup = join(root, 'super')
    git(root, 'init', '-q', sup)
    git(sup, 'submodule', 'add', '-q', 'file://' + sub, 'a')
    git(sup, 'submodule', 'add', '-q', 'file://' + sub, 'b')
    git(sup, 'commit', '-q', '-m', 'add submodules')

    const wt = join(root, 'wt')
    git(root, 'clone', '-q', 'file://' + sup, wt)
    git(wt, 'submodule', 'update', '--init', '-q', '--', 'a')
    git(join(wt, 'a'), 'checkout', '-q', c2)

    const [step] = structuralFallback(wt)
    assert.equal(step, SUBMODULE_INIT)
    execFileSync('sh', ['-c', step], { cwd: wt, env, stdio: 'ignore' })
    assert.equal(git(join(wt, 'a'), 'rev-parse', 'HEAD'), c2, 'initialized sibling a was moved to its recorded commit')
    assert.equal(git(join(wt, 'b'), 'rev-parse', 'HEAD'), c1, 'uninitialized submodule b was not initialized')

    // All initialized: the step must run no update at all (GNU xargs without -r would run a bare one).
    execFileSync('sh', ['-c', step], { cwd: wt, env, stdio: 'ignore' })
    assert.equal(git(join(wt, 'a'), 'rev-parse', 'HEAD'), c2, 'a second run moved the initialized sibling')

    // A repo-controlled `-` path is a glob pathspec unless GIT_LITERAL_PATHSPECS=1:
    // uninitialized `lib*` must not match the initialized sibling `libx`.
    // Add `lib*` first: `submodule add` checks its path as a glob against the index.
    git(sup, 'submodule', 'add', '-q', 'file://' + sub, 'lib*')
    git(sup, 'submodule', 'add', '-q', 'file://' + sub, 'libx')
    git(sup, 'commit', '-q', '-m', 'add glob-named submodules')
    git(wt, 'pull', '-q', '--no-rebase', '--no-recurse-submodules')
    git(wt, 'submodule', 'update', '--init', '-q', '--', 'libx')
    git(join(wt, 'libx'), 'checkout', '-q', c2)
    execFileSync('sh', ['-c', step], { cwd: wt, env, stdio: 'ignore' })
    assert.equal(git(join(wt, 'libx'), 'rev-parse', 'HEAD'), c2, "uninitialized 'lib*' matched initialized sibling libx as a glob")
    assert.equal(git(join(wt, 'lib*'), 'rev-parse', 'HEAD'), c1, "uninitialized submodule 'lib*' was not initialized")

    // Fresh clone (the /red-team sandbox shape): every submodule is uninitialized, so
    // one xargs batch carries all the paths. Submodule `n` nests `inner`, which only
    // `update --init --recursive` reaches: `status --recursive` cannot list it yet.
    const outer = join(root, 'outer')
    git(root, 'init', '-q', outer)
    git(outer, 'submodule', 'add', '-q', 'file://' + sub, 'inner')
    git(outer, 'commit', '-q', '-m', 'add inner')
    git(sup, 'submodule', 'add', '-q', 'file://' + outer, 'n')
    git(sup, 'commit', '-q', '-m', 'add nested submodule')
    // realpath: macOS tmpdir is a /var -> /private/var symlink, and --show-toplevel resolves it.
    const fresh = join(realpathSync(root), 'fresh')
    git(root, 'clone', '-q', 'file://' + sup, fresh)
    const paths = ['a', 'b', 'lib*', 'libx', 'n']
    assert.deepEqual(
      git(fresh, 'submodule', 'status').split('\n').map((l) => l.trim().split(/\s+/)[1]).sort(),
      [...paths].sort(),
      'fresh clone lists a submodule set other than the one this test asserts',
    )
    execFileSync('sh', ['-c', step], { cwd: fresh, env, stdio: 'ignore' })
    for (const p of paths) {
      assert.equal(git(join(fresh, p), 'rev-parse', '--show-toplevel'), join(fresh, p), `fresh-clone submodule ${p} was not initialized`)
      if (p !== 'n') assert.equal(git(join(fresh, p), 'rev-parse', 'HEAD'), c1, `fresh-clone submodule ${p} is off its recorded commit`)
    }
    assert.equal(git(join(fresh, 'n', 'inner'), 'rev-parse', 'HEAD'), c1, 'nested submodule n/inner was not initialized (--recursive dropped?)')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// The scout card, the fixture doc, the engine's submodNote and refiner-recovery.md step 1
// hand-copy the step, so bind each copy to the constant (itself bound to structuralFallback
// above). Counts name every copy.
test('SUBMODULE_INIT: the scout card and EXPECTED.md carry the step byte for byte', () => {
  const repo = join(HERE, '..', '..')
  const copies = (text) => text.split(SUBMODULE_INIT).length - 1
  assert.equal(copies(readFileSync(join(repo, 'agents', 'war-setup-scout.md'), 'utf8')), 2, 'agents/war-setup-scout.md: fallback list and plan-step copies')
  assert.equal(copies(readFileSync(join(FIXTURES, 'EXPECTED.md'), 'utf8')), 1, 'skills/_shared/fixtures/provision/EXPECTED.md: expected-output copy')
  assert.equal(copies(readFileSync(join(repo, 'skills', 'war', 'assets', 'workflow-template.js'), 'utf8')), 1, 'skills/war/assets/workflow-template.js: submodNote copy')
  assert.equal(copies(readFileSync(join(repo, 'skills', 'war', 'references', 'refiner-recovery.md'), 'utf8')), 1, 'skills/war/references/refiner-recovery.md: step-1 copy')
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
      provision: [SUBMODULE_INIT, 'pnpm install --frozen-lockfile'],
      rationale: 'bootstrap the repo',
    }),
  })
  try {
    const r = readManifest(dir)
    assert.equal(r.found, true)
    assert.equal(r.ok, true)
    assert.deepEqual(r.provision, [SUBMODULE_INIT, 'pnpm install --frozen-lockfile'])
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

// ----------------------------------------------------------------------------
// submodulePaths — T1 (Increment 2)
// ----------------------------------------------------------------------------

test('submodulePaths: two-submodule fixture -> both paths in order', () => {
  const paths = submodulePaths(join(FIXTURES, 'two-submodule-repo'))
  assert.deepEqual(paths, ['libs/alpha', 'libs/beta'])
})

test('submodulePaths: no .gitmodules -> []', () => {
  const dir = makeRepo({ 'README.md': '# hi\n' })
  try {
    assert.deepEqual(submodulePaths(dir), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('submodulePaths: non-existent repoDir -> [] (never throws)', () => {
  const dir = join(tmpdir(), 'submod-paths-no-exist-' + Date.now())
  assert.deepEqual(submodulePaths(dir), [])
})

test('submodulePaths: malformed .gitmodules (no path lines) -> [] (defined, no throw)', () => {
  const dir = makeRepo({ '.gitmodules': '[submodule "x"]\n\turl = https://example.com/x.git\n' })
  try {
    const result = submodulePaths(dir)
    assert.ok(Array.isArray(result), 'result must be an array')
    assert.deepEqual(result, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('submodulePaths: empty string repoDir -> []', () => {
  assert.deepEqual(submodulePaths(''), [])
})
