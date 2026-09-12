// backward-chain.test.mjs — the skeleton guard for the five backward-chain reference files
// (plan 2026-09-11-backward-chain-doctrine, Task 1.2, #2307).
//
// The five files are the doctrine homes for the worker, the plan author, the auditor, the fixer
// and the examples bank. Their skeletons are ratified (PIN-1 ‡, guardrail G1: no rule dropped,
// no rule added), so this guard pins the SKELETON, never the prose:
//
//   * each file's exact ordered H2 set;
//   * each numbered rule list and bullet list the Skeleton record enumerates: 1..N contiguous,
//     count pinned, and one construct key per position (a count alone would pass a swapped or
//     replaced rule, so every item also carries a key from the record's own enumeration);
//   * the examples bank's opening one-line-per-H2 index, in H2 order;
//   * the `## Entry shape` template fields, and every seed entry against them (plus the PIN-9
//     redaction shape on every external entry);
//   * the seed-entry slugs per section, exact and ordered (Skeleton record, entry E);
//   * the relation-tag vocabulary across the three file surfaces D15 names — the audit rules
//     block, the fixer's Round 2 table, the examples H2 set minus `convergence` — plus the two
//     in-file mirrors (the fixer's Worked-examples pointer list and the bank's preamble
//     enumeration); Task 2.1 adds the fourth surface, the engine regex;
//   * the round-5 disclosure sentence on both depth files (PIN-3), and the PIN-2 absence of
//     `run.roundLimit` / `run.absorbRounds` from every file.
//
// Every assertion carries a positive control: the five files are copied into a temp dir, ONE file
// is mutated, and the same check must go red on the copy with the message the control names. A
// no-op mutation is itself red, and a census pins that every assertion in CHECKS is reached by at
// least one control (ASSERTIONS below lists the message stems, count-locked to the assert sites).
//
// Growth (D16): a seed entry joins the bank by reviewed PR (or the Lead's Gate-2 commit), and
// the same change updates SEEDS below — the bank and its guard stay one reviewed change.
// Section prose is latitude; a reworded rule that keeps its construct key stays green.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

// Repo root from THIS file's location, never process.cwd() (the worker cwd resets between calls).
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

const FILES = {
  fix: 'skills/war/references/backward-chain-fix.md',
  audit: 'skills/war/references/backward-chain-audit.md',
  worker: 'skills/war/references/backward-chain-worker.md',
  examples: 'skills/war/references/backward-chain-examples.md',
  plan: 'skills/war-strategy/references/backward-chain-plan.md',
}

const readCorpus = (root) => Object.fromEntries(Object.entries(FILES).map(([k, rel]) => [k, readFileSync(join(root, rel), 'utf8')]))

// ---------------------------------------------------------------------------------------------
// The Skeleton record (plan `## Notes / conscious deviations`, PIN-1 ‡), as data.
// ---------------------------------------------------------------------------------------------

const TAGS = ['sibling', 'residue', 'oracle', 'consumer', 'upstream', 'premise', 'regression', 'off-path']
const BANK_H2S = [...TAGS, 'convergence']
const ROLES = ['worker', 'auditor', 'fixer', 'plan author']
// The `## Entry shape` fields in template order (the bold lesson line is keyed by its `**` opener).
const ENTRY_FIELDS = ['Source:', 'Roles:', '**', 'Questions to ask:', 'Closure:']

// Skeleton record, entry E: the seed slugs per section, in order.
const SEEDS = {
  sibling: ['eight-rounds-to-one-lookup', 'swept-the-four-warnings-the-function-had-five', 'handler-seam-fixed-for-one-caller', 'too-few-sibling-branches'],
  residue: ['three-rewords-against-the-byte-budget', 'substring-match-one-fixture-never-rejected'],
  oracle: ['count-equal-counterexample-forced-tree-equality', 'test-asserted-metadata-not-the-return', 'green-by-deletion-six-mutations'],
  consumer: ['recovery-skip-reader-missed', 'three-absorbs-inverted-for-reader-reasons', 'read-the-reader-before-widening-the-producer'],
  upstream: ['one-weaker-link-per-candidate', 'round-four-rule-undid-the-round-one-clock'],
  premise: ['smaller-poll-budget-orphans-the-job', 'the-seats-ranking-assumption', 'finding-contradicted-a-ruling', 'recommendation-cited-the-issue-and-contradicted-its-comments', 'correct-chain-toward-a-rule-that-did-not-exist'],
  regression: ['new-layer-broke-the-deploy', 'excise-the-culprit-never-revert-the-batch'],
  'off-path': ['one-sentence-nit-held-a-phase', 'round-zero-escalations-on-specified-majors', 'exclusion-set-demotes-every-round'],
  convergence: ['one-round-one-file', 'eight-file-disjoint-tasks', 'four-majors-one-root-one-round', 'extraction-moves-produced-unanimity', 'rounds-fell-as-the-discipline-moved-earlier'],
}

// Per file: the exact ordered H2 set, then the enumerated lists by heading. `numbered` lists are
// `1. ` items, `bullets` are `- ` items; each position carries the construct keys the Skeleton
// record enumerates for that rule (every key must match the item's line).
const SKELETON = {
  fix: {
    h2s: ['The rules', 'Round 1', 'Round 2', 'Round 3 and later', 'Round 5 and later', 'Build variants', 'Worked examples'],
    numbered: {
      'The rules': [
        [/Outcome:/, /End state number|`Done when:`/],
        [/Chain backward/],
        [/earliest unmet link/],
        [/Focusing Question/],
        [/premise/, /does not mention/],
        [/Ignore for now:/],
      ],
      'Round 3 and later': [[/common ancestor/], [/Re-lock/, /Commander's Intent/], [/Focusing Question/, /whole history/]],
      'Build variants': [
        [/^1\. FIX_NEEDED:/],
        [/^2\. ace subset:/],
        [/^3\. ace re-entry:/],
        [/^4\. ace advisory polish:/, /byte budget/],
        [/^5\. floor family \(add-test, make-pass, cite-budget, package-it\):/, /round is 1 by definition/],
        [/^6\. phase-close sweep:/, /round is 1 by definition/],
        [/^7\. terminal pass:/, /round is 1 by definition/],
      ],
    },
    bullets: {},
  },
  audit: {
    h2s: ['The rules', 'Round 2', 'Round 3 and later', 'Round 5 and later', 'Variants', 'Worked examples'],
    numbered: {
      'The rules': [
        [/Chain from the cited End state to the tip YOURSELF first/, /Outcome:/, /Chain:/, /Bottleneck:/, /Fix:/, /Ignore for now:/],
        [/outcome citation/, /severity/],
        [/`relation: <tag>`/, /LAST line/],
        [/bottleneck/, /sibling finding/],
        [/Thin evidence/, /at most Minor/],
        [/Off the chain lowers no Critical/, /Minor or Nit never holds a task/],
        [/`Ignore for now:` list/, /severity by consequence/],
        [/does to the thing it does not mention/],
      ],
    },
    bullets: { Variants: [[/^Delta-scaled re-audit:/], [/^Pin-content re-audit:/, /round 1 by definition/]] },
  },
  worker: {
    h2s: ['The rules', 'Chunk shape', 'Off-path discipline', 'Worked examples'],
    numbered: {
      'The rules': [
        [/`Done when:`/, /End state numbers/, /`PLAN-DEFECT:`/, /DEPS ALREADY MERGED/],
        [/Chain backward/],
        [/bottleneck is the earliest unmet link/],
        [/done test/, /printed-token duty/],
        [/`Critical path:`/, /`Ignore for now:`/, /`notes`/],
        [/red before green/],
        [/End states and the Commander's Intent/],
        [/`blocked`/, /no budget raise, no test-pattern edit, no installed tool, no weakened test/],
      ],
      'Off-path discipline': [[/sibling task's `Files:` path: never/], [/release slot file/, /never/], [/Any other path: in-band/]],
    },
    bullets: {},
  },
  examples: {
    h2s: ['Entry shape', ...BANK_H2S, 'Growth rules'],
    numbered: {},
    bullets: {
      'Growth rules': [
        [/reviewed PR/, /Gate-2 commit/, /servitor never writes this file/],
        [/redaction check/],
        [/`## Entry shape`/, /slug never encodes a private source/],
        [/One H2 per relation tag plus `## convergence`/, /engine change/],
        [/#2302 is the size watch/],
      ],
    },
  },
  plan: {
    h2s: ['The method', 'Where it lands', 'The reachability probe', 'Worked examples'],
    numbered: {
      'The method': [
        [/D5 tag/, /reachability probe/],
        [/ORDERS/, /CARVES/, /never one task per link/],
        [/bottleneck/, /Phase 1 wave 1/],
        [/Chunk by distance/, /done test/],
        [/Every task serves a named End state/],
        [/`## Non-goals \/ deferred`/, /`## Deferred validations \(backstops\)`/],
        [/Two independent chains/],
        [/\[assumed:/],
      ],
      'The reachability probe': [[/Name the check/], [/Name the owning task or row/], [/Test the check red at the base/], [/Test the check for reach/], [/Record the result/]],
    },
    bullets: {},
  },
}

// ---------------------------------------------------------------------------------------------
// Fence-aware markdown readers. A fenced line never opens a heading, a rule, a bullet, a table
// row or an entry (the bank's `## Entry shape` fence carries a `### <slug>` template line).
// ---------------------------------------------------------------------------------------------

const rowsOf = (md) => {
  let fence = false
  return md.split('\n').map((line) => {
    if (/^```/.test(line)) { fence = !fence; return [line, true] }
    return [line, fence]
  })
}
const h2s = (md) => rowsOf(md).filter(([l, f]) => !f && l.startsWith('## ')).map(([l]) => l.slice(3))
const sections = (md) => {
  const out = [{ heading: null, rows: [] }]
  for (const [line, fenced] of rowsOf(md)) {
    if (!fenced && line.startsWith('## ')) out.push({ heading: line.slice(3), rows: [] })
    else out.at(-1).rows.push([line, fenced])
  }
  return out
}
const section = (md, heading, label) => {
  const s = sections(md).find((x) => x.heading === heading)
  assert.ok(s, `${label}: section ## ${heading} present`)
  return s
}
const unfenced = (sec) => sec.rows.filter(([, f]) => !f).map(([l]) => l)
const numberedItems = (sec) => unfenced(sec).filter((l) => /^\d+\. /.test(l)).map((l) => ({ n: Number(l.match(/^(\d+)\. /)[1]), text: l }))
const bulletItems = (sec) => unfenced(sec).filter((l) => /^- /.test(l)).map((l) => l.slice(2))
const tableRows = (sec) => unfenced(sec).filter((l) => /^\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
const fencedBlocks = (sec) => {
  const out = []
  let cur = null
  for (const [line, fenced] of sec.rows) {
    if (/^```/.test(line)) { if (cur) { out.push(cur); cur = null } else cur = []; continue }
    if (fenced && cur) cur.push(line)
  }
  return out
}
// Entries: `### <slug>` blocks under one bank section; blank lines dropped.
const entriesOf = (sec) => {
  const out = []
  for (const line of unfenced(sec)) {
    if (line.startsWith('### ')) out.push({ slug: line.slice(4), lines: [] })
    else if (out.length && line.trim()) out.at(-1).lines.push(line)
  }
  return out
}
const sentenceCount = (text) => (text.match(/[.!?](?=\s|$)/g) || []).length

// ---------------------------------------------------------------------------------------------
// The checks. Each reads a corpus ({fix, audit, worker, examples, plan} → text) and throws on
// the first skeleton defect. The live corpus runs every check; the controls run one check over
// a mutated copy.
// ---------------------------------------------------------------------------------------------

const CHECKS = {
  'exact H2 set per file': (c) => {
    for (const [k, spec] of Object.entries(SKELETON)) {
      assert.deepEqual(h2s(c[k]), spec.h2s, `${FILES[k]}: exact ordered H2 set`)
    }
  },

  'rule counts and construct keys per enumerated list': (c) => {
    for (const [k, spec] of Object.entries(SKELETON)) {
      const lists = [
        ...Object.entries(spec.numbered).map(([h, items]) => [h, items, (sec) => numberedItems(sec)]),
        ...Object.entries(spec.bullets).map(([h, items]) => [h, items, (sec) => bulletItems(sec).map((text, i) => ({ n: i + 1, text }))]),
      ]
      for (const [heading, items, read] of lists) {
        const label = `${FILES[k]} ## ${heading}`
        const got = read(section(c[k], heading, FILES[k]))
        assert.deepEqual(got.map((i) => i.n), items.map((_, i) => i + 1), `${label}: ${items.length} items, numbered 1..${items.length} contiguous (no rule dropped, no rule added)`)
        items.forEach((keys, i) => {
          for (const re of keys) assert.match(got[i].text, re, `${label} item ${i + 1}: carries the record's construct key ${re}`)
        })
      }
    }
    // The ace advisory-polish variant clause says "byte budget", never "floor" or "cap" (Task 1.1 slice).
    const polish = numberedItems(section(c.fix, 'Build variants', FILES.fix))[3]?.text ?? ''
    assert.doesNotMatch(polish, /\b(floor|cap)\b/i, `${FILES.fix} ## Build variants item 4: names the byte budget, never a floor or a cap`)
  },

  'examples index: one line per H2, in H2 order, opening the file': (c) => {
    const md = c.examples
    const rows = rowsOf(md)
    const h1 = rows.findIndex(([l, f]) => !f && l.startsWith('# '))
    assert.ok(h1 >= 0, `${FILES.examples}: H1 present`)
    const firstBody = rows.slice(h1 + 1).find(([l]) => l.trim())
    assert.ok(firstBody && /^- `## .+`: /.test(firstBody[0]), `${FILES.examples}: opens with the index (the first line after the H1 is an index line)`)
    const index = []
    for (const [l] of rows.slice(h1 + 1)) {
      if (!l.trim()) { if (index.length) break; continue }
      const m = l.match(/^- `## (.+?)`: \S/)
      assert.ok(m, `${FILES.examples}: index line has the shape "- \`## <H2>\`: <one line>": ${JSON.stringify(l)}`)
      index.push(m[1])
    }
    assert.deepEqual(index, h2s(md), `${FILES.examples}: the index names every H2, one line each, in H2 order`)
  },

  'entry shape: template fields, every entry against them, PIN-9 redaction': (c) => {
    const md = c.examples
    const shape = section(md, 'Entry shape', FILES.examples)
    const blocks = fencedBlocks(shape)
    assert.equal(blocks.length, 1, `${FILES.examples} ## Entry shape: exactly one fenced template`)
    const [tmpl] = blocks
    assert.equal(tmpl[0], '### <slug>', `${FILES.examples} ## Entry shape: the template opens with "### <slug>"`)
    const marker = (l) => ENTRY_FIELDS.find((m) => l.startsWith(m))
    assert.deepEqual(tmpl.slice(1).map(marker).filter(Boolean), ENTRY_FIELDS, `${FILES.examples} ## Entry shape: the template carries the recorded fields in order`)
    const abstractPlaceholder = tmpl.slice(1).filter((l) => !marker(l))
    assert.equal(abstractPlaceholder.length, 1, `${FILES.examples} ## Entry shape: one abstracting-sentences placeholder between the lesson and the questions`)
    assert.match(abstractPlaceholder[0], /three to five sentences/, `${FILES.examples} ## Entry shape: the placeholder names three to five sentences`)

    const seen = new Set()
    for (const h of BANK_H2S) {
      for (const e of entriesOf(section(md, h, FILES.examples))) {
        const label = `${FILES.examples} ## ${h} entry ${e.slug}`
        assert.match(e.slug, /^[a-z0-9]+(-[a-z0-9]+)+$/, `${label}: slug is kebab-case`)
        assert.ok(!seen.has(e.slug), `${label}: slug is unique across the bank`)
        seen.add(e.slug)
        assert.deepEqual(e.lines.map(marker).filter(Boolean), ENTRY_FIELDS, `${label}: carries the template fields in template order`)
        assert.deepEqual([e.lines[0], e.lines[1], e.lines[2]].map(marker), ENTRY_FIELDS.slice(0, 3), `${label}: Source, Roles and the bold lesson are the first three lines`)
        assert.deepEqual([e.lines.at(-2), e.lines.at(-1)].map(marker), ENTRY_FIELDS.slice(3), `${label}: Questions to ask and Closure are the last two lines`)
        assert.match(e.lines[2], /^\*\*[^*]+\*\*$/, `${label}: the lesson is one bold sentence`)
        const abstract = e.lines.slice(3, -2)
        assert.ok(abstract.length >= 1, `${label}: abstracting sentences present between the lesson and the questions`)
        const n = sentenceCount(abstract.join(' '))
        assert.ok(n >= 3 && n <= 5, `${label}: three to five abstracting sentences (counted ${n})`)
        const roles = e.lines[1].slice('Roles: '.length).split(', ')
        assert.ok(roles.length >= 1 && roles.every((r) => ROLES.includes(r)) && new Set(roles).size === roles.length, `${label}: Roles names one or more of ${ROLES.join(' | ')}, each once (got ${JSON.stringify(roles)})`)
        const source = e.lines[0].slice('Source: '.length)
        const external = source === 'external (private), abstracted'
        assert.ok(external || /#\d+/.test(source) || /^https?:\/\//.test(source) || /^run history/.test(source), `${label}: Source is a WAR issue or PR (#n), "external (private), abstracted", a public URL, or run history (got ${JSON.stringify(source)})`)
        if (external) {
          assert.doesNotMatch(e.lines.join('\n'), /#\d+|https?:\/\//, `${label}: an external private entry carries no issue number, PR number or URL (PIN-9)`)
        }
      }
    }
  },

  'seed-entry slugs per section, exact and ordered': (c) => {
    for (const h of BANK_H2S) {
      const slugs = entriesOf(section(c.examples, h, FILES.examples)).map((e) => e.slug)
      assert.deepEqual(slugs, SEEDS[h], `${FILES.examples} ## ${h}: exactly the recorded seed slugs, in order (a growth PR updates SEEDS in the same change)`)
    }
  },

  'relation-tag vocabulary equal across the file surfaces': (c) => {
    // Surface 1: the audit rules block, rule 3's closed enumeration.
    const rule3 = numberedItems(section(c.audit, 'The rules', FILES.audit))[2]?.text ?? ''
    const m1 = rule3.match(/The tag is one of: ([a-z, -]+)\./)
    assert.ok(m1, `${FILES.audit} ## The rules item 3: enumerates the closed tag set as "The tag is one of: <a, b, ...>."`)
    assert.deepEqual(m1[1].split(', '), TAGS, `${FILES.audit} ## The rules item 3: tag list equals the vocabulary, in order`)
    // Surface 2: the fixer's Round 2 first-move table, one row per tag.
    const rows = tableRows(section(c.fix, 'Round 2', FILES.fix))
    assert.deepEqual(rows[0], ['relation', 'first move'], `${FILES.fix} ## Round 2: the table header is | relation | first move |`)
    assert.ok(rows[1] && rows[1].every((cell) => /^-+$/.test(cell)), `${FILES.fix} ## Round 2: the table has a separator row`)
    const data = rows.slice(2)
    assert.deepEqual(data.map((r) => r[0]), TAGS, `${FILES.fix} ## Round 2: table rows equal the vocabulary, one row per tag, in order`)
    for (const r of data) assert.ok(r.length === 2 && r[1].length > 0, `${FILES.fix} ## Round 2 row ${r[0]}: carries a first move`)
    // Surface 3: the examples H2 set between Entry shape and Growth rules, minus convergence.
    const bank = h2s(c.examples)
    const between = bank.slice(bank.indexOf('Entry shape') + 1, bank.indexOf('Growth rules'))
    assert.deepEqual(between, BANK_H2S, `${FILES.examples}: the H2s between Entry shape and Growth rules equal the vocabulary plus convergence`)
    // In-file mirrors: the bank's preamble enumeration and the fixer's Worked-examples pointer list.
    const preamble = unfenced(sections(c.examples)[0]).join('\n')
    const m2 = preamble.match(/vocabulary byte for byte \(([a-z, -]+)\) plus `## convergence`/)
    assert.ok(m2, `${FILES.examples} preamble: enumerates the vocabulary as "(a, b, ...) plus \`## convergence\`"`)
    assert.deepEqual(m2[1].split(', '), TAGS, `${FILES.examples} preamble: enumeration equals the vocabulary, in order`)
    const pointers = bulletItems(section(c.fix, 'Worked examples', FILES.fix)).map((b) => b.match(/^([a-z-]+): `## ([a-z-]+)` — /))
    assert.ok(pointers.every(Boolean), `${FILES.fix} ## Worked examples: every bullet has the shape "<tag>: \`## <tag>\` — ..."`)
    assert.deepEqual(pointers.map((m) => m[1]), BANK_H2S, `${FILES.fix} ## Worked examples: bullet tags equal the vocabulary plus convergence, in order`)
    assert.deepEqual(pointers.map((m) => m[2]), BANK_H2S, `${FILES.fix} ## Worked examples: bullet pointers name the bank H2s, in order`)
  },

  'bank pointers resolve: every Worked-examples H2 and slug reference exists in the bank': (c) => {
    const slugs = new Set(BANK_H2S.flatMap((h) => entriesOf(section(c.examples, h, FILES.examples)).map((e) => e.slug)))
    for (const k of ['fix', 'audit', 'worker', 'plan']) {
      const text = unfenced(section(c[k], 'Worked examples', FILES[k])).join('\n')
      for (const [, h] of text.matchAll(/`## ([^`]+)`/g)) assert.ok(BANK_H2S.includes(h), `${FILES[k]} ## Worked examples: \`## ${h}\` names a bank section`)
      for (const [, s] of text.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)) assert.ok(slugs.has(s), `${FILES[k]} ## Worked examples: \`${s}\` names a bank entry`)
    }
  },

  'round-5 tier disclosed only at corrective round 5 or later (PIN-3)': (c) => {
    for (const k of ['fix', 'audit']) {
      const first = unfenced(section(c[k], 'Round 5 and later', FILES[k])).find((l) => l.trim()) ?? ''
      assert.match(first, /^Disclosed only at corrective round 5 or later \(PIN-3\)\./, `${FILES[k]} ## Round 5 and later: opens with the PIN-3 disclosure sentence`)
    }
  },

  'no file names the round bound as an obstacle (PIN-2)': (c) => {
    for (const [k, text] of Object.entries(c)) {
      assert.doesNotMatch(text, /run\.roundLimit|run\.absorbRounds/, `${FILES[k]}: never names run.roundLimit or run.absorbRounds`)
    }
  },
}

// ---------------------------------------------------------------------------------------------
// Positive controls: copy the five files into a temp dir, mutate ONE, run ONE check, assert red
// with the named message. `mutate` must change the text (a no-op control proves nothing).
// ---------------------------------------------------------------------------------------------

const SWAP_MARK = '@@backward-chain-swap@@'
const swap = (text, a, b) => text.replace(a, SWAP_MARK).replace(b, a).replace(SWAP_MARK, b)

const CONTROLS = [
  // exact H2 set
  { check: 'exact H2 set per file', file: 'fix', name: 'fixer: rename ## Round 5 and later', mutate: (t) => t.replace('\n## Round 5 and later\n', '\n## Round five and later\n'), red: /backward-chain-fix\.md: exact ordered H2 set/ },
  { check: 'exact H2 set per file', file: 'audit', name: 'audit: demote ## Variants to an H3', mutate: (t) => t.replace('\n## Variants\n', '\n### Variants\n'), red: /backward-chain-audit\.md: exact ordered H2 set/ },
  { check: 'exact H2 set per file', file: 'worker', name: 'worker: add an H2 the record never agreed', mutate: (t) => t + '\n## Extra\n\nA section the record never agreed.\n', red: /backward-chain-worker\.md: exact ordered H2 set/ },
  { check: 'exact H2 set per file', file: 'examples', name: 'examples: re-case ## convergence', mutate: (t) => t.replace('\n## convergence\n', '\n## Convergence\n'), red: /backward-chain-examples\.md: exact ordered H2 set/ },
  { check: 'exact H2 set per file', file: 'plan', name: 'plan: swap two H2s', mutate: (t) => swap(t, '\n## Where it lands\n', '\n## The reachability probe\n'), red: /backward-chain-plan\.md: exact ordered H2 set/ },
  // rule counts and construct keys
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer rules: drop rule 6', mutate: (t) => t.replace(/\n6\. Write `Ignore for now:`[^\n]*\n/, '\n'), red: /backward-chain-fix\.md ## The rules: 6 items, numbered 1\.\.6 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer rules: add a seventh rule', mutate: (t) => t.replace(/\n6\. Write `Ignore for now:`[^\n]*\n/, (m) => m + '7. Re-run the gate.\n'), red: /backward-chain-fix\.md ## The rules: 6 items, numbered 1\.\.6 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer rules: swap the bodies of rules 1 and 2 (count intact)', mutate: (t) => t.replace(/\n1\. ([^\n]*)\n2\. ([^\n]*)\n/, '\n1. $2\n2. $1\n'), red: /backward-chain-fix\.md ## The rules item 1: carries the record's construct key \/Outcome:\// },
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer Build variants: clause 4 says byte cap, never byte budget', mutate: (t) => t.replace(/^4\. ace advisory polish:[^\n]*$/m, (l) => l.replaceAll('byte budget', 'byte cap')), red: /backward-chain-fix\.md ## Build variants item 4: carries the record's construct key \/byte budget\// },
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer Build variants: clause 4 adds the word floor', mutate: (t) => t.replace("the outcome is the surface's byte budget", "the outcome is the surface's byte budget floor"), red: /backward-chain-fix\.md ## Build variants item 4: names the byte budget, never a floor or a cap/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'fix', name: 'fixer Round 3: drop the third move', mutate: (t) => t.replace(/\n3\. Ask the Focusing Question over the whole history[^\n]*\n/, '\n'), red: /backward-chain-fix\.md ## Round 3 and later: 3 items, numbered 1\.\.3 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'audit', name: 'audit rules: drop rule 3 and renumber', mutate: (t) => t.replace(/\n3\. Write exactly one line `relation: <tag>`[^\n]*\n/, '\n').replace('\n4. Name the bottleneck.', '\n3. Name the bottleneck.').replace('\n5. Thin evidence', '\n4. Thin evidence').replace('\n6. Off the chain', '\n5. Off the chain').replace('\n7. Audit the', '\n6. Audit the').replace('\n8. State what', '\n7. State what'), red: /backward-chain-audit\.md ## The rules: 8 items, numbered 1\.\.8 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'audit', name: 'audit Variants: drop the pin-content bullet', mutate: (t) => t.replace(/\n- Pin-content re-audit:[^\n]*\n/, '\n'), red: /backward-chain-audit\.md ## Variants: 2 items, numbered 1\.\.2 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'worker', name: 'worker rules: drop rule 8', mutate: (t) => t.replace(/\n8\. A link you cannot make true[^\n]*\n/, '\n'), red: /backward-chain-worker\.md ## The rules: 8 items, numbered 1\.\.8 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'worker', name: 'worker rules: rule 1 loses the DEPS ALREADY MERGED sub-clause', mutate: (t) => t.replace(' When the prompt carries `DEPS ALREADY MERGED`, the rebase is still the first act, and the chain ends at the rebased tip.', ''), red: /backward-chain-worker\.md ## The rules item 1: carries the record's construct key \/DEPS ALREADY MERGED\// },
  { check: 'rule counts and construct keys per enumerated list', file: 'worker', name: 'worker Off-path discipline: drop class 3', mutate: (t) => t.replace(/\n3\. Any other path:[^\n]*\n/, '\n'), red: /backward-chain-worker\.md ## Off-path discipline: 3 items, numbered 1\.\.3 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'plan', name: 'plan method: drop step 8', mutate: (t) => t.replace(/\n8\. Thin evidence takes[^\n]*\n/, '\n'), red: /backward-chain-plan\.md ## The method: 8 items, numbered 1\.\.8 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'plan', name: 'plan probe: drop step 5', mutate: (t) => t.replace(/\n5\. Record the result[^\n]*\n/, '\n'), red: /backward-chain-plan\.md ## The reachability probe: 5 items, numbered 1\.\.5 contiguous/ },
  { check: 'rule counts and construct keys per enumerated list', file: 'examples', name: 'examples Growth rules: drop the size-watch bullet', mutate: (t) => t.replace(/\n- #2302 is the size watch[^\n]*\n/, '\n'), red: /backward-chain-examples\.md ## Growth rules: 5 items, numbered 1\.\.5 contiguous/ },
  // examples index
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: drop the oracle line', mutate: (t) => t.replace(/\n- `## oracle`:[^\n]*\n/, '\n'), red: /the index names every H2, one line each, in H2 order/ },
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: swap two lines', mutate: (t) => swap(t, '\n- `## sibling`:', '\n- `## residue`:'), red: /the index names every H2, one line each, in H2 order/ },
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: a paragraph before the index', mutate: (t) => t.replace('\n\n- `## Entry shape`:', '\n\nA preamble paragraph before the index.\n\n- `## Entry shape`:'), red: /opens with the index/ },
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: a line for an H2 that does not exist', mutate: (t) => t.replace('\n- `## Growth rules`:', '\n- `## Retired`: nothing here.\n- `## Growth rules`:'), red: /the index names every H2, one line each, in H2 order/ },
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: the H1 is deleted', mutate: (t) => t.replace('# Backward-chain examples bank\n\n', ''), red: /backward-chain-examples\.md: H1 present/ },
  { check: 'examples index: one line per H2, in H2 order, opening the file', file: 'examples', name: 'examples index: the oracle line separator is " - ", not ": "', mutate: (t) => t.replace('\n- `## oracle`: a test', '\n- `## oracle` - a test'), red: /backward-chain-examples\.md: index line has the shape/ },
  // entry shape
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: the template drops Closure:', mutate: (t) => t.replace('\nClosure: <the change that closed the class, in one sentence>\n', '\n'), red: /## Entry shape: the template carries the recorded fields in order/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a second fenced block under ## Entry shape', mutate: (t) => t.replace('Closure: <the change that closed the class, in one sentence>\n```\n', 'Closure: <the change that closed the class, in one sentence>\n```\n\n```\nA second template.\n```\n'), red: /## Entry shape: exactly one fenced template/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: the template opens with "### slug", no angle brackets', mutate: (t) => t.replace('```\n### <slug>\n', '```\n### slug\n'), red: /## Entry shape: the template opens with "### <slug>"/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: the template carries two placeholder lines', mutate: (t) => t.replace('<three to five sentences that abstract the instance: what was fixed, what re-opened, where the earliest unmet link was>\n', '<three to five sentences that abstract the instance: what was fixed, what re-opened, where the earliest unmet link was>\n<a second placeholder line>\n'), red: /## Entry shape: one abstracting-sentences placeholder between the lesson and the questions/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: the placeholder names two to four sentences', mutate: (t) => t.replace('<three to five sentences that abstract', '<two to four sentences that abstract'), red: /## Entry shape: the placeholder names three to five sentences/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: an entry drops Closure: (red at the fields-in-order assert)', mutate: (t) => t.replace('\nClosure: One shared lookup in the absorb tail, both sinks, before any push, `phaseClose:true` wins.\n', '\n'), red: /entry eight-rounds-to-one-lookup: carries the template fields in template order/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: Roles above Source (red at the fields-in-order assert)', mutate: (t) => t.replace('Source: #2097, §2 Thread B (the post-land loop on PR #2065)\nRoles: fixer, auditor\n', 'Roles: fixer, auditor\nSource: #2097, §2 Thread B (the post-land loop on PR #2065)\n'), red: /entry eight-rounds-to-one-lookup: carries the template fields in template order/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a stray line between Source and Roles', mutate: (t) => t.replace('Source: #2097, §2 Thread B (the post-land loop on PR #2065)\nRoles: fixer, auditor\n', 'Source: #2097, §2 Thread B (the post-land loop on PR #2065)\nA stray line.\nRoles: fixer, auditor\n'), red: /entry eight-rounds-to-one-lookup: Source, Roles and the bold lesson are the first three lines/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a stray line after Closure', mutate: (t) => t.replace('\nClosure: One shared lookup in the absorb tail, both sinks, before any push, `phaseClose:true` wins.\n', '\nClosure: One shared lookup in the absorb tail, both sinks, before any push, `phaseClose:true` wins.\nA stray line.\n'), red: /entry eight-rounds-to-one-lookup: Questions to ask and Closure are the last two lines/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: an unknown role', mutate: (t) => t.replace('\nRoles: fixer, auditor\n**A dedup rule', '\nRoles: fixer, operator\n**A dedup rule'), red: /entry eight-rounds-to-one-lookup: Roles names one or more of/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: an external entry leaks an issue number (PIN-9)', mutate: (t) => t.replace('The seat named four warnings; the fixer scrubbed exactly those four.', 'The seat (#4242) named four warnings; the fixer scrubbed exactly those four.'), red: /entry swept-the-four-warnings-the-function-had-five: an external private entry carries no issue number, PR number or URL \(PIN-9\)/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: an external Source loses ", abstracted"', mutate: (t) => t.replace('### too-few-sibling-branches\nSource: external (private), abstracted\n', '### too-few-sibling-branches\nSource: external (private)\n'), red: /entry too-few-sibling-branches: Source is a WAR issue or PR/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a two-sentence abstract', mutate: (t) => t.replace("A parser fix touched one module and its test file. The fixer stated the class, swept the module's own branches, and shipped eight regression fixtures, five of them red before the repair. Two rounds were budgeted; the second found only Nits. The chain had one link and the file boundary matched it.", 'A parser fix touched one module and its test file. The chain had one link and the file boundary matched it.'), red: /entry one-round-one-file: three to five abstracting sentences \(counted 2\)/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a slug that is not kebab-case', mutate: (t) => t.replace('### one-round-one-file', '### One_Round_One_File'), red: /entry One_Round_One_File: slug is kebab-case/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: a duplicate slug', mutate: (t) => t.replace('### eight-file-disjoint-tasks', '### one-round-one-file'), red: /## convergence entry one-round-one-file: slug is unique across the bank/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: the lesson line carries text after the bold sentence', mutate: (t) => t.replace('**A change confined to one file, with its fixtures beside it, converged in one round.**', '**A change confined to one file, with its fixtures beside it, converged in one round.** Extra.'), red: /entry one-round-one-file: the lesson is one bold sentence/ },
  { check: 'entry shape: template fields, every entry against them, PIN-9 redaction', file: 'examples', name: 'entry shape: an entry with no abstracting sentences', mutate: (t) => t.replace("A parser fix touched one module and its test file. The fixer stated the class, swept the module's own branches, and shipped eight regression fixtures, five of them red before the repair. Two rounds were budgeted; the second found only Nits. The chain had one link and the file boundary matched it.\n", ''), red: /entry one-round-one-file: abstracting sentences present between the lesson and the questions/ },
  // seed slugs
  { check: 'seed-entry slugs per section, exact and ordered', file: 'examples', name: 'seeds: rename a slug', mutate: (t) => t.replace('### too-few-sibling-branches', '### too-few-branches'), red: /## sibling: exactly the recorded seed slugs, in order/ },
  { check: 'seed-entry slugs per section, exact and ordered', file: 'examples', name: 'seeds: drop an entry', mutate: (t) => t.replace(/\n### the-seats-ranking-assumption\n[^]*?\nClosure:[^\n]*\n/, '\n'), red: /## premise: exactly the recorded seed slugs, in order/ },
  { check: 'seed-entry slugs per section, exact and ordered', file: 'examples', name: 'seeds: move an entry into another section', mutate: (t) => { const m = t.match(/\n### new-layer-broke-the-deploy\n[^]*?\nClosure:[^\n]*\n/); return t.replace(m[0], '\n').replace('\n## upstream\n', m[0] + '\n## upstream\n') }, red: /## consumer: exactly the recorded seed slugs, in order/ },
  { check: 'seed-entry slugs per section, exact and ordered', file: 'examples', name: 'seeds: add an entry the record never listed', mutate: (t) => t.replace('\n## Growth rules\n', '\n### a-new-convergence-story\nSource: run history\nRoles: fixer\n**A lesson.**\nOne. Two. Three.\nQuestions to ask: Any?\nClosure: None.\n\n## Growth rules\n'), red: /## convergence: exactly the recorded seed slugs, in order/ },
  // relation-tag vocabulary
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'audit', name: 'tags: audit rule 3 drops regression', mutate: (t) => t.replace('premise, regression, off-path. No other value', 'premise, off-path. No other value'), red: /backward-chain-audit\.md ## The rules item 3: tag list equals the vocabulary, in order/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Round 2 table drops the residue row', mutate: (t) => t.replace(/\n\| residue \|[^\n]*\n/, '\n'), red: /backward-chain-fix\.md ## Round 2: table rows equal the vocabulary, one row per tag, in order/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Round 2 table header renamed', mutate: (t) => t.replace('| relation | first move |', '| tag | first move |'), red: /backward-chain-fix\.md ## Round 2: the table header is \| relation \| first move \|/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'examples', name: 'tags: examples H2 off-path renamed', mutate: (t) => t.replace('\n## off-path\n', '\n## offpath\n'), red: /backward-chain-examples\.md: the H2s between Entry shape and Growth rules equal the vocabulary plus convergence/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'examples', name: 'tags: examples preamble enumeration drops premise', mutate: (t) => t.replace('upstream, premise, regression, off-path) plus', 'upstream, regression, off-path) plus'), red: /backward-chain-examples\.md preamble: enumeration equals the vocabulary, in order/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Worked examples drops the upstream pointer', mutate: (t) => t.replace(/\n- upstream: `## upstream`[^\n]*\n/, '\n'), red: /backward-chain-fix\.md ## Worked examples: bullet tags equal the vocabulary plus convergence, in order/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'audit', name: 'tags: audit rule 3 loses the "The tag is one of:" opener', mutate: (t) => t.replace('The tag is one of: sibling', 'The tag is among: sibling'), red: /backward-chain-audit\.md ## The rules item 3: enumerates the closed tag set as/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Round 2 separator row is |:--|:--|', mutate: (t) => t.replace('\n|---|---|\n', '\n|:--|:--|\n'), red: /backward-chain-fix\.md ## Round 2: the table has a separator row/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Round 2 residue row has an empty first move', mutate: (t) => t.replace(/^\| residue \|[^\n]*$/m, '| residue |  |'), red: /backward-chain-fix\.md ## Round 2 row residue: carries a first move/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'examples', name: 'tags: examples preamble loses the "byte for byte (" opener', mutate: (t) => t.replace('vocabulary byte for byte (sibling', 'vocabulary byte-for-byte (sibling'), red: /backward-chain-examples\.md preamble: enumerates the vocabulary as/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Worked examples sibling bullet loses its ": `## " shape', mutate: (t) => t.replace('\n- sibling: `## sibling` — ', '\n- sibling → `## sibling` — '), red: /backward-chain-fix\.md ## Worked examples: every bullet has the shape/ },
  { check: 'relation-tag vocabulary equal across the file surfaces', file: 'fix', name: 'tags: fixer Worked examples upstream bullet points at ## consumer', mutate: (t) => t.replace('\n- upstream: `## upstream` — ', '\n- upstream: `## consumer` — '), red: /backward-chain-fix\.md ## Worked examples: bullet pointers name the bank H2s, in order/ },
  // bank pointers
  { check: 'bank pointers resolve: every Worked-examples H2 and slug reference exists in the bank', file: 'audit', name: 'pointers: audit cites a section the bank lacks', mutate: (t) => t.replace('`## oracle`, `count-equal-counterexample-forced-tree-equality`', '`## sideways`, `count-equal-counterexample-forced-tree-equality`'), red: /backward-chain-audit\.md ## Worked examples: `## sideways` names a bank section/ },
  { check: 'bank pointers resolve: every Worked-examples H2 and slug reference exists in the bank', file: 'worker', name: 'pointers: worker cites an entry the bank lacks', mutate: (t) => t.replace('`test-asserted-metadata-not-the-return`', '`test-asserted-the-label`'), red: /backward-chain-worker\.md ## Worked examples: `test-asserted-the-label` names a bank entry/ },
  // PIN-3
  { check: 'round-5 tier disclosed only at corrective round 5 or later (PIN-3)', file: 'audit', name: 'PIN-3: audit Round 5 loses the disclosure sentence', mutate: (t) => t.replace('\n## Round 5 and later\n\nDisclosed only at corrective round 5 or later (PIN-3). ', '\n## Round 5 and later\n\n'), red: /backward-chain-audit\.md ## Round 5 and later: opens with the PIN-3 disclosure sentence/ },
  { check: 'round-5 tier disclosed only at corrective round 5 or later (PIN-3)', file: 'audit', name: 'PIN-3: audit ## Round 5 and later renamed (the section is missing)', mutate: (t) => t.replace('\n## Round 5 and later\n', '\n## Round five and later\n'), red: /backward-chain-audit\.md: section ## Round 5 and later present/ },
  { check: 'round-5 tier disclosed only at corrective round 5 or later (PIN-3)', file: 'fix', name: 'PIN-3: fixer Round 5 discloses at round 3', mutate: (t) => t.replace('\n## Round 5 and later\n\nDisclosed only at corrective round 5 or later (PIN-3).', '\n## Round 5 and later\n\nDisclosed only at corrective round 3 or later (PIN-3).'), red: /backward-chain-fix\.md ## Round 5 and later: opens with the PIN-3 disclosure sentence/ },
  // PIN-2
  { check: 'no file names the round bound as an obstacle (PIN-2)', file: 'fix', name: 'PIN-2: the fixer names run.roundLimit', mutate: (t) => t.replace('The bounded round count is a safety precaution', 'run.roundLimit is an obstacle'), red: /backward-chain-fix\.md: never names run\.roundLimit or run\.absorbRounds/ },
  { check: 'no file names the round bound as an obstacle (PIN-2)', file: 'plan', name: 'PIN-2: the plan file names run.absorbRounds', mutate: (t) => t + '\nRaise run.absorbRounds when a chain needs more rounds.\n', red: /backward-chain-plan\.md: never names run\.roundLimit or run\.absorbRounds/ },
]

// ---------------------------------------------------------------------------------------------
// The assertion census: one regex per distinct assertion message in CHECKS (plus the `section`
// helper's), the dynamic label prefix stripped. The census test runs every control, reads the
// message it goes red with, and requires each stem here to be hit by at least one control. The
// count guard pins this list to the assert call sites in the source, so a new assert cannot join
// unlisted, and each control must hit exactly one stem, so the stems stay distinguishing.
// ---------------------------------------------------------------------------------------------

const ASSERTIONS = [
  /: section ## .+ present$/,
  /: exact ordered H2 set$/,
  / items, numbered 1\.\.\d+ contiguous \(no rule dropped, no rule added\)$/,
  /: carries the record's construct key \//,
  /: names the byte budget, never a floor or a cap$/,
  /: H1 present$/,
  /: opens with the index \(the first line after the H1 is an index line\)$/,
  /: index line has the shape "- `## <H2>`: <one line>": /,
  /: the index names every H2, one line each, in H2 order$/,
  /## Entry shape: exactly one fenced template$/,
  /## Entry shape: the template opens with "### <slug>"$/,
  /## Entry shape: the template carries the recorded fields in order$/,
  /## Entry shape: one abstracting-sentences placeholder between the lesson and the questions$/,
  /## Entry shape: the placeholder names three to five sentences$/,
  /: slug is kebab-case$/,
  /: slug is unique across the bank$/,
  /: carries the template fields in template order$/,
  /: Source, Roles and the bold lesson are the first three lines$/,
  /: Questions to ask and Closure are the last two lines$/,
  /: the lesson is one bold sentence$/,
  /: abstracting sentences present between the lesson and the questions$/,
  /: three to five abstracting sentences \(counted \d+\)$/,
  /: Roles names one or more of /,
  /: Source is a WAR issue or PR \(#n\), /,
  /: an external private entry carries no issue number, PR number or URL \(PIN-9\)$/,
  /: exactly the recorded seed slugs, in order \(a growth PR updates SEEDS in the same change\)$/,
  /## The rules item 3: enumerates the closed tag set as "The tag is one of: <a, b, \.\.\.>\."$/,
  /## The rules item 3: tag list equals the vocabulary, in order$/,
  /## Round 2: the table header is \| relation \| first move \|$/,
  /## Round 2: the table has a separator row$/,
  /## Round 2: table rows equal the vocabulary, one row per tag, in order$/,
  /## Round 2 row .+: carries a first move$/,
  /: the H2s between Entry shape and Growth rules equal the vocabulary plus convergence$/,
  / preamble: enumerates the vocabulary as "\(a, b, \.\.\.\) plus `## convergence`"$/,
  / preamble: enumeration equals the vocabulary, in order$/,
  /## Worked examples: every bullet has the shape "<tag>: `## <tag>` — \.\.\."$/,
  /## Worked examples: bullet tags equal the vocabulary plus convergence, in order$/,
  /## Worked examples: bullet pointers name the bank H2s, in order$/,
  /## Worked examples: `## .+` names a bank section$/,
  /## Worked examples: `.+` names a bank entry$/,
  /## Round 5 and later: opens with the PIN-3 disclosure sentence$/,
  /: never names run\.roundLimit or run\.absorbRounds$/,
]

const live = readCorpus(repoRoot)

// Copy the five files into a temp dir (their relative paths kept), mutate one, and hand the copy
// to `fn` as a corpus read back from disk — the same read path the live checks use.
function withMutatedCopy(file, mutate, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'backward-chain-'))
  try {
    for (const [k, rel] of Object.entries(FILES)) {
      mkdirSync(join(dir, dirname(rel)), { recursive: true })
      writeFileSync(join(dir, rel), live[k])
    }
    const mutated = mutate(live[file])
    assert.notEqual(mutated, live[file], `${FILES[file]}: the control mutation changes the copy (a no-op mutation proves nothing)`)
    writeFileSync(join(dir, FILES[file]), mutated)
    return fn(readCorpus(dir))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// The message a control goes red with on its mutated copy (null when the copy stays green). Only
// the first line: a deepEqual failure appends its diff below the message.
const reachedBy = (ctl) => withMutatedCopy(ctl.file, ctl.mutate, (copy) => {
  try { CHECKS[ctl.check](copy) } catch (e) { return e.message.split('\n')[0] }
  return null
})

for (const [name, check] of Object.entries(CHECKS)) {
  test(`backward-chain skeleton: ${name}`, () => check(live))
}

test('backward-chain skeleton: an unmutated copy in a temp dir passes every check (harness control)', () => {
  withMutatedCopy('fix', (t) => t + '\n', (copy) => {
    // The trailing newline is the only difference; every check must still be green on the copy.
    for (const [name, check] of Object.entries(CHECKS)) assert.doesNotThrow(() => check(copy), `${name} stays green on a byte-equivalent copy`)
  })
})

test('backward-chain skeleton: a fenced heading never opens a section (fence awareness)', () => {
  withMutatedCopy('examples', (t) => t.replace('\n### <slug>\n', '\n## Bogus\n### <slug>\n'), (copy) => {
    assert.doesNotThrow(() => CHECKS['exact H2 set per file'](copy), 'a `## ` line inside the Entry shape fence is not an H2')
  })
})

for (const ctl of CONTROLS) {
  test(`backward-chain skeleton control: ${ctl.name}`, () => {
    const check = CHECKS[ctl.check]
    assert.equal(typeof check, 'function', `control names a real check: ${ctl.check}`)
    withMutatedCopy(ctl.file, ctl.mutate, (copy) => {
      assert.throws(() => check(copy), { message: ctl.red }, `the mutated copy goes red at the named assertion (${ctl.red})`)
    })
  })
}

test('backward-chain skeleton: every assertion has at least one positive control (census)', () => {
  const sites = [...Object.values(CHECKS), section].map(String).join('\n').match(/\bassert\.\w+\(/g) ?? []
  assert.equal(ASSERTIONS.length, sites.length, `ASSERTIONS lists one stem per assert call site in CHECKS and section() (${sites.length} sites)`)
  const reached = CONTROLS.map((ctl) => ({ ctl, message: reachedBy(ctl) }))
  for (const { ctl, message } of reached) {
    const hits = ASSERTIONS.filter((re) => message !== null && re.test(message))
    assert.equal(hits.length, 1, `control "${ctl.name}" reaches exactly one listed assertion (got ${JSON.stringify(message)})`)
  }
  const unreached = ASSERTIONS.filter((re) => !reached.some(({ message }) => message !== null && re.test(message)))
  assert.deepEqual(unreached.map(String), [], 'every assertion in CHECKS is reached by at least one control')
  const files = new Set(CONTROLS.map((c) => c.file))
  assert.deepEqual([...files].sort(), Object.keys(FILES).sort(), 'every one of the five files is mutated by at least one control')
})
