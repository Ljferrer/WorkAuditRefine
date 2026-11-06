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
//      move never rewrite). Before that commit exists, HEAD's CONTEXT.md is the parent.
//
// Each checker runs on the live files and on planted faults, so a checker that
// stops detecting its fault goes red here.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
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

function git(args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
}

// Both sides of the move, read at the move itself: `before` is CONTEXT.md in the parent of the
// commit that added GLOSSARY.md, and `moved` is GLOSSARY.md in that commit. Later glossary edits
// change neither side. Before that commit exists, the sides are HEAD's CONTEXT.md and the
// working-tree GLOSSARY.md. null outside git.
function moveSides() {
  try {
    git(['rev-parse', '--git-dir'])
  } catch {
    return null
  }
  const added = git(['log', '--diff-filter=A', '--format=%H', '--', 'GLOSSARY.md']).trim().split('\n').filter(Boolean)
  if (added.length === 0) return { before: git(['show', 'HEAD:CONTEXT.md']), moved: read('GLOSSARY.md') }
  const at = added[added.length - 1]
  return { before: git(['show', `${at}^:CONTEXT.md`]), moved: git(['show', `${at}:GLOSSARY.md`]) }
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
  }
  for (const [want, text] of Object.entries(cases)) {
    const got = routerFaults(text, glossary, files)
    assert.ok(got.some((f) => f.startsWith(want)), `${want}: got ${JSON.stringify(got)}`)
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
    'broken contents link': glossary.replace(first[0], `${first[0]}\n- #no-such-heading`),
    'not a bare #slug list line': glossary.replace(first[0], `- [x](#${first[1]})`),
    'the second block must be ## Contents': glossary.replace('## Contents', '## Index'),
    'contents link is not a ### section: #language': glossary.replace(first[0], `${first[0]}\n- #language`),
    'the first line must be the # title': glossary.replace(/^# .*\n/, ''),
  }
  for (const [want, text] of Object.entries(cases)) {
    const got = contentsFaults(text)
    assert.ok(got.some((f) => f.startsWith(want)), `${want}: got ${JSON.stringify(got)}`)
  }
})

test('identity — the moved ## Language span equals the pre-move CONTEXT.md span byte for byte (ADR 0042 D3, #2636)', (t) => {
  const sides = moveSides()
  if (sides === null) return t.skip('no usable git context')
  assert.deepEqual(identityFaults(sides.before, sides.moved, router), [])
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
    assert.ok(got.some((f) => f.startsWith(want)), `${want}: got ${JSON.stringify(got)}`)
  }
})
