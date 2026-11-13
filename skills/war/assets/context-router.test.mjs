// context-router.test.mjs — CONTEXT.md is the Layer 1 router and GLOSSARY.md is the
// Layer 2 glossary (#2636, operator ruling 2026-11-05, 2-hop option b).
//
// Three contracts:
//   1. Router: every CONTEXT.md entry is `- when <trigger>, read <target>`, every target
//      resolves, each role has an entry, and one entry sends the reader to the
//      GLOSSARY.md contents list. No entry links a glossary `###` section: routing is
//      2 hops (router -> contents list -> section).
//   2. Contents list: above `## Language`, GLOSSARY.md holds only a title and a
//      `## Contents` list of bare `#<heading-slug>` lines, one per `###` heading.
//   3. Identity: the `## Language` span of GLOSSARY.md equals the same span of
//      CONTEXT.md in the parent of the commit that added GLOSSARY.md (ADR 0042 D3,
//      move never rewrite). Before that commit exists, HEAD's CONTEXT.md is the parent, unless a
//      staged merge's MERGE_HEAD holds that commit: then the sides are read at it (#2719).
//
// Each checker runs on the live files and on planted faults, so a checker that
// stops detecting its fault goes red here.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8')

const ROLES = ['Lead', 'worker', 'auditor', 'refiner', 'servitor']
const LANGUAGE = '## Language\n'
const ENTRY = /^- (Lead|worker|auditor|refiner|servitor)?:? ?when (.+), read (\S+)$/

// GitHub's heading anchor rule: lowercase, drop every char that is not a letter,
// digit, space, `-` or `_`, then turn each space into `-`. Repeats get `-1`, `-2`.
export function slug(text) {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-')
}

export function anchors(md) {
  const seen = new Map()
  const out = new Set()
  for (const m of md.matchAll(/^#{1,6} (.+)$/gm)) {
    const base = slug(m[1])
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.add(n === 0 ? base : `${base}-${n}`)
  }
  return out
}

// Resolve `path` or `path#slug` against the repo, or against `files` when given.
function resolves(target, files) {
  const [path, frag] = target.split('#')
  const text = files ? files[path] : existsSync(join(repoRoot, path)) ? read(path) : undefined
  if (text === undefined) return false
  return frag === undefined || anchors(text).has(frag)
}

// Contract 1. Returns a list of faults; empty means the router holds.
export function routerFaults(router, glossary, files) {
  const faults = []
  const sectionSlugs = new Set([...glossary.matchAll(/^### (.+)$/gm)].map((m) => slug(m[1])))
  const entries = []
  for (const line of router.split('\n')) {
    if (!line.startsWith('- ')) continue
    const m = line.match(ENTRY)
    if (!m) { faults.push(`not a when/read entry: ${line}`); continue }
    entries.push({ role: m[1], target: m[3] })
    if (!resolves(m[3], files)) faults.push(`broken link: ${m[3]}`)
  }
  // Prose lines count too: a Markdown link anywhere must resolve, and no GLOSSARY.md#<section>
  // reference anywhere in the router may skip the contents list.
  for (const m of router.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (!resolves(m[1], files)) faults.push(`broken link: ${m[1]}`)
  }
  for (const m of router.matchAll(/GLOSSARY\.md#([a-z0-9_-]+)/g)) {
    if (sectionSlugs.has(m[1])) faults.push(`router links a glossary section directly (2-hop rule): ${m[0]}`)
  }
  for (const role of ROLES) {
    if (!entries.some((e) => e.role === role)) faults.push(`no entry for role ${role}`)
  }
  if (entries.filter((e) => e.target === 'GLOSSARY.md#contents').length !== 1) {
    faults.push('exactly one entry must read GLOSSARY.md#contents')
  }
  return faults
}

// Contract 2. Returns a list of faults; empty means the contents list holds.
export function contentsFaults(glossary) {
  const faults = []
  const at = glossary.indexOf(`\n${LANGUAGE}`)
  if (at === -1) return ['GLOSSARY.md has no ## Language line']
  const prefix = glossary.slice(0, at + 1).split('\n').filter((l) => l !== '')
  if (!/^# \S/.test(prefix[0] ?? '')) faults.push('the first line must be the # title')
  if (prefix[1] !== '## Contents') faults.push('the second block must be ## Contents')
  const listed = []
  for (const line of prefix.slice(2)) {
    const m = line.match(/^- #([a-z0-9_-]+)$/)
    if (!m) { faults.push(`not a bare #slug list line: ${line}`); continue }
    listed.push(m[1])
  }
  const all = anchors(glossary)
  const sections = new Set([...glossary.matchAll(/^### (.+)$/gm)].map((m) => slug(m[1])))
  for (const s of listed) {
    if (!all.has(s)) faults.push(`broken contents link: #${s}`)
    else if (!sections.has(s)) faults.push(`contents link is not a ### section: #${s}`)
  }
  for (const m of glossary.matchAll(/^### (.+)$/gm)) {
    const n = listed.filter((s) => s === slug(m[1])).length
    if (n !== 1) faults.push(`contents list names #${slug(m[1])} ${n} times, want 1`)
  }
  return faults
}

// The text from the `## Language` line to EOF, or null when the file has none.
export function languageSpan(md) {
  if (md.startsWith(LANGUAGE)) return md
  const at = md.indexOf(`\n${LANGUAGE}`)
  return at === -1 ? null : md.slice(at + 1)
}

const sameBytes = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0

// Contract 3. `before` is CONTEXT.md before the move, `moved` is GLOSSARY.md as the move wrote
// it, and `router` is the live CONTEXT.md. Returns a list of faults; empty means the move holds.
export function identityFaults(before, moved, router) {
  const faults = []
  const want = languageSpan(before)
  const got = languageSpan(moved)
  if (want === null) faults.push('the pre-move CONTEXT.md has no ## Language line')
  else if (got === null) faults.push('the moved GLOSSARY.md has no ## Language line')
  else if (!sameBytes(got, want)) faults.push('the moved ## Language span differs from the pre-move CONTEXT.md')
  if (languageSpan(router) !== null) faults.push('CONTEXT.md still holds a ## Language section')
  return faults
}

function git(args, root = repoRoot) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
}

// Both sides of the move, read at the move itself: `before` is CONTEXT.md in the parent of the
// commit that added GLOSSARY.md, and `moved` is GLOSSARY.md in that commit. Later glossary edits
// change neither side. If HEAD lacks that commit but a staged merge's MERGE_HEAD has it, both
// sides are read at that commit (#2719). Otherwise the sides are HEAD's CONTEXT.md and the
// working-tree GLOSSARY.md. `root` defaults to repoRoot. null outside git, or in a shallow clone where git cannot read a
// side (the clone can cut at the adding commit, so its parent is missing). In a full clone an
// unreadable side throws, so a broken read fails the test instead of skipping it.
// `-c log.follow=false`: a user-level log.follow=true turns a one-path log into --follow, which
// reads the move as a copy of CONTEXT.md and names CONTEXT.md's own first commit as the add.
function moveSides(root = repoRoot) {
  const g = (args) => git(args, root)
  try {
    g(['rev-parse', '--git-dir'])
  } catch {
    return null
  }
  const addCommit = (rev) => {
    const added = g(['-c', 'log.follow=false', 'log', '--diff-filter=A', '--format=%H', rev, '--', 'GLOSSARY.md'])
      .trim().split('\n').filter(Boolean)
    return added[added.length - 1]
  }
  // `./` makes each blob path resolve from root, as the log pathspec above does.
  let at = addCommit('HEAD')
  if (!at) {
    let mergeHead = false
    try {
      g(['rev-parse', '-q', '--verify', 'MERGE_HEAD'])
      mergeHead = true
    } catch {}
    if (mergeHead) at = addCommit('MERGE_HEAD')
  }
  try {
    if (!at) return { before: g(['show', 'HEAD:./CONTEXT.md']), moved: readFileSync(join(root, 'GLOSSARY.md'), 'utf8') }
    return { before: g(['show', `${at}^:./CONTEXT.md`]), moved: g(['show', `${at}:./GLOSSARY.md`]) }
  } catch (err) {
    return unreadableSide(err, () => g(['rev-parse', '--is-shallow-repository']).trim() === 'true')
  }
}

// The skip-or-fail choice when git cannot read a side of the move: null (skip) only if
// isShallow() says the clone is shallow. Otherwise it rethrows err. If isShallow() itself
// throws, err is rethrown, so the read error stays the one the test reports.
export function unreadableSide(err, isShallow) {
  let shallow
  try {
    shallow = isShallow()
  } catch {
    throw err
  }
  if (shallow === true) return null
  throw err
}

const router = read('CONTEXT.md')
const glossary = read('GLOSSARY.md')

test('router — every CONTEXT.md entry is when/read, resolves, covers each role, and routes terms in 2 hops (#2636)', () => {
  assert.deepEqual(routerFaults(router, glossary), [])
})

test('router — planted faults go red (#2636)', () => {
  const files = { 'GLOSSARY.md': glossary, 'a.md': '# A\n' }
  const good = [...ROLES.map((r) => `- ${r}: when x, read a.md`), '- when you need a term, read GLOSSARY.md#contents'].join('\n')
  assert.deepEqual(routerFaults(good, glossary, files), [])
  const cases = {
    'broken link: b.md': good.replace('read a.md', 'read b.md'),
    'broken link: a.md#nope': good.replace('read a.md', 'read a.md#nope'),
    'not a when/read entry': `${good}\n- see a.md`,
    'no entry for role servitor': good.replace(/^- servitor:.*$/m, ''),
    'exactly one entry must read GLOSSARY.md#contents': good.replace('#contents', ''),
    'router links a glossary section directly': `${good}\n- when you land, read GLOSSARY.md#landing`,
    'router links a glossary section directly (2-hop rule): GLOSSARY.md#audit': `Prose: see GLOSSARY.md#audit.\n${good}`,
    'broken link: c.md': `See [c](c.md).\n${good}`,
    'exactly one entry must read GLOSSARY.md#contents (duplicate)': `${good}\n- when you need a term, read GLOSSARY.md#contents`,
  }
  for (const [want, text] of Object.entries(cases)) {
    const got = routerFaults(text, glossary, files)
    assert.ok(got.some((f) => f.startsWith(want.replace(/ \(duplicate\)$/, ''))), `${want}: got ${JSON.stringify(got)}`)
  }
})

test('contents — GLOSSARY.md holds a title and one bare #slug line per ### heading above ## Language (#2636)', () => {
  assert.deepEqual(contentsFaults(glossary), [])
  assert.ok(/^### /m.test(glossary), 'non-vacuity: GLOSSARY.md has no ### section')
})

test('contents — planted faults go red (#2636)', () => {
  const first = glossary.match(/^- #(\S+)$/m)
  assert.ok(first, 'the contents list has no lines')
  const cases = {
    'contents list names': glossary.replace(`${first[0]}\n`, ''),
    'contents list names (duplicate)': glossary.replace(first[0], `${first[0]}\n${first[0]}`),
    'broken contents link': glossary.replace(first[0], `${first[0]}\n- #no-such-heading`),
    'not a bare #slug list line': glossary.replace(first[0], `- [x](#${first[1]})`),
    'the second block must be ## Contents': glossary.replace('## Contents', '## Index'),
    'contents link is not a ### section: #language': glossary.replace(first[0], `${first[0]}\n- #language`),
    'the first line must be the # title': glossary.replace(/^# .*\n/, ''),
  }
  for (const [want, text] of Object.entries(cases)) {
    const got = contentsFaults(text)
    assert.ok(got.some((f) => f.startsWith(want.replace(/ \(duplicate\)$/, ''))), `${want}: got ${JSON.stringify(got)}`)
  }
})

test('identity — the moved ## Language span equals the pre-move CONTEXT.md span byte for byte (ADR 0042 D3, #2636)', (t) => {
  const sides = moveSides()
  if (sides === null) return t.skip('no usable git context, or a shallow clone without the move commit parent')
  assert.deepEqual(identityFaults(sides.before, sides.moved, router), [])
})

test('identity — a staged merge that brings the move reads the sides at the move commit (#2719)', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'context-router-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  // A user-level log.follow, signing key or missing identity must not change the result.
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
    GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
  }
  const sh = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] })
  const put = (rel, text) => writeFileSync(join(dir, rel), text)
  const language = '## Language\n\n### A\n\nterm body\n'
  sh('init', '-q', '-b', 'main')
  put('CONTEXT.md', `# Context\n\nintro\n\n${language}`)
  sh('add', '-A'); sh('commit', '-q', '-m', 'context')
  sh('checkout', '-q', '-b', 'move')
  put('CONTEXT.md', '# Context\n\nintro\n')
  put('GLOSSARY.md', `# Glossary\n\n## Contents\n\n- #a\n\n${language}`)
  sh('add', '-A'); sh('commit', '-q', '-m', 'move')
  put('GLOSSARY.md', `# Glossary\n\n## Contents\n\n- #a\n\n${language}\nanother glossary line\n`)
  sh('add', '-A'); sh('commit', '-q', '-m', 'edit')
  sh('checkout', '-q', 'main')
  sh('merge', '-q', '--no-commit', '--no-ff', 'move')
  sh('rev-parse', '-q', '--verify', 'MERGE_HEAD')
  const sides = moveSides(dir)
  assert.ok(sides, 'moveSides read no sides in the scratch repo')
  assert.deepEqual(identityFaults(sides.before, sides.moved, readFileSync(join(dir, 'CONTEXT.md'), 'utf8')), [])
})

test('identity — planted faults go red (#2636)', () => {
  const before = `# WAR — Context\n\nintro\n\n## Language\n\n### A\n\nterm body\n`
  const moved = `# WAR — Glossary\n\n## Contents\n\n- #a\n\n## Language\n\n### A\n\nterm body\n`
  const routerText = '# WAR — Context\n\n- when x, read a.md\n'
  assert.deepEqual(identityFaults(before, moved, routerText), [])
  const cases = {
    'the moved ## Language span differs': [before, moved.replace('term body', 'term bodx'), routerText],
    'the moved GLOSSARY.md has no ## Language line': [before, moved.replace('## Language', '## Lang'), routerText],
    'the pre-move CONTEXT.md has no ## Language line': [before.replace('## Language', '## Lang'), moved, routerText],
    'CONTEXT.md still holds a ## Language section': [before, moved, `${routerText}\n## Language\n`],
  }
  for (const [want, args] of Object.entries(cases)) {
    const got = identityFaults(...args)
    assert.ok(got.some((f) => f.startsWith(want.replace(/ \(duplicate\)$/, ''))), `${want}: got ${JSON.stringify(got)}`)
  }
})

test('identity — an unreadable side skips only in a shallow clone, else the read error fails the test (#2636)', () => {
  const err = new Error('fatal: invalid object name')
  assert.equal(unreadableSide(err, () => true), null, 'shallow clone: skip')
  assert.throws(() => unreadableSide(err, () => false), (e) => e === err, 'full clone: the read error fails the test')
  const probeErr = () => {
    throw new Error('unknown option --is-shallow-repository')
  }
  assert.throws(() => unreadableSide(err, probeErr), (e) => e === err, 'failed probe: the read error, not the probe error')
})
