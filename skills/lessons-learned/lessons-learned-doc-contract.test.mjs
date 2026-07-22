import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Prose-gate for /lessons-learned repo-awareness (plan 2026-07-06, Phase 1 Task 3).
// No such gate existed before — safe-swap.test.sh guards the shell script, not the doc prose.
// Pattern mirrors war-config.test.mjs `doc-contract:` tests (node --test, read files as text).
// REPO_ROOT is 2 levels up from skills/lessons-learned/.
const __dir = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dir, '..', '..')
const skill = readFileSync(join(REPO_ROOT, 'skills/lessons-learned/SKILL.md'), 'utf8')
const migration = readFileSync(join(REPO_ROOT, 'skills/lessons-learned/references/migration.md'), 'utf8')
// Task 2.2 (lessons-learned-seed): the seed mode reads three more surfaces.
const seeding = readFileSync(join(REPO_ROOT, 'skills/lessons-learned/references/seeding.md'), 'utf8')
const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8')
const warhelp = readFileSync(join(REPO_ROOT, 'skills/war-help/SKILL.md'), 'utf8')

// Grab a single line matching a substring (throws if absent — makes intent explicit).
const lineWith = (text, needle) => {
  const line = text.split('\n').find(l => l.includes(needle))
  assert.ok(line, `no line containing ${JSON.stringify(needle)}`)
  return line
}

// (1) Phase 5 housekeeping render-index passes --repo. If someone reverts the render
//     back to `--local "$STAGING"` alone, this line no longer matches and the test fails.
test('doc-contract: Phase 5 render-index passes --repo (repo-adopted store keeps [repo] rows)', () => {
  const render = lineWith(skill, 'render-index --local "$STAGING"')
  assert.match(render, /render-index --local "\$STAGING" --repo /,
    'Phase 5 render-index must pass --repo <repo root> or a repo-adopted store silently drops every [repo] row on re-render')
})

// (2) The evict re-render clause stays LOCAL-ONLY by design (no --repo). Eviction abandons
//     the repo root and must drop [repo] markers. Anchored on the evict-specific prose so it
//     does not accidentally match the migrate Step 5 render (which legitimately has --repo).
test('doc-contract: evict re-render is local-only — NO --repo (eviction drops [repo] markers)', () => {
  const evict = lineWith(migration, 'evicted rows lose their')
  assert.ok(evict.includes('render-index --local "$CLAUDE_MEMORY_LOCAL"'),
    'evict clause must render-index the local root')
  assert.ok(!evict.includes('--repo'),
    'the evict re-render must stay local-only (NO --repo) — eviction must drop [repo] markers by design')
})

// (3) The Common-mistakes bullet documenting the silent-drop failure mode exists.
//     Removing the bullet removes the "silently drops every `[repo]` row" phrase and this fails.
test('doc-contract: Common mistakes warns that dropping --repo silently drops [repo] rows', () => {
  assert.match(skill, /Common mistakes/,
    'SKILL.md must have a Common mistakes section')
  assert.match(skill, /silently drops every `\[repo\]` row/,
    'Common mistakes must warn that a --repo-less Phase 5 render silently drops every [repo] row')
})

// (4) migration.md Step 5 gains the CLAUDE.md pointer sub-step (append-if-absent, same PR).
//     Removing the sub-step removes this sentence and this fails.
test('doc-contract: migration Step 5 has the CLAUDE.md pointer sub-step (append-if-absent)', () => {
  assert.match(migration, /`CLAUDE\.md` carries the pointer line/,
    'migration.md Step 5 must ensure the target repo CLAUDE.md carries the ratified pointer line')
  assert.match(migration, /append-if-absent/,
    'the pointer sub-step must be append-if-absent (never rewrite existing operator content)')
})

// --- Criterion 6 (memory-store-hygiene plan, Task 1.3): verifier trichotomy + tool-driven hub check ---

// (5) The Phase-2 verifier prompt states the HOT/COLD/MISSING link trichotomy. Case-tolerant,
//     mid-sentence anchors (the three state tokens survive rewording of the surrounding prose).
test('doc-contract: verifier prompt carries the HOT/COLD/MISSING link trichotomy', () => {
  assert.match(skill, /\bhot\b/i, 'trichotomy must name the HOT state')
  assert.match(skill, /\bcold\b/i, 'trichotomy must name the COLD (archived) state')
  assert.match(skill, /\bmissing\b/i, 'trichotomy must name the MISSING state')
  assert.match(skill, /trichotomy/i, 'the link trichotomy must be stated as such')
})

// (6) Phase 3 counts inbound refs via `war-memory inbound`, not the retired prose grep.
//     If someone reverts to `grep -rl "\[\[<slug>\]\]"`, the inbound invocation disappears
//     and this fails. Anchored on the CLI verb + subcommand, case-tolerant on spacing.
test('doc-contract: Phase 3 hub check invokes war-memory inbound (not the prose grep)', () => {
  assert.match(skill, /war-memory\.mjs" inbound <slug>/,
    'Phase 3 must run `war-memory.mjs inbound <slug>` for the inbound count')
  assert.doesNotMatch(skill, /grep -rl "\\\[\\\[<slug>\\\]\\\]"/,
    'the retired Phase-3 prose grep must be gone — the count comes from `war-memory inbound`')
})

// (7) OLD-absent: no surviving instruction produces a removal/retire verdict from a hot-only
//     `ls`. Every line that mentions "hot-only" must also carry "never" — i.e. the only place
//     the hot-only listing appears is the forbiddance, never an affirmative removal verdict.
//     (Mirrors Task 1.1's `archives ALL of these` OLD-absent guard — ADR 0025 discipline.)
test('doc-contract: no hot-only-ls removal verdict survives (hot-only appears only as forbiddance)', () => {
  const offenders = skill.split('\n').filter(l => /hot-only/i.test(l) && !/never/i.test(l))
  assert.deepEqual(offenders, [],
    `every "hot-only" mention must be the forbiddance ("never ... from a hot-only ls"); offending lines: ${JSON.stringify(offenders)}`)
})

// --- Task 2.2 (war-room-config-expansion): migrate opt-in gate + opt-in-default rewording ---

// (8) migrate mode gains the opt-in pre-flight: it frames commitLearnings as off-by-default,
//     the accept path writes through the war-config validator, and the decline path aborts with
//     the exact "nothing migrated" message and nothing staged.
test('doc-contract: migrate mode gates on the commitLearnings opt-in (ask → validator-path accept / abort decline)', () => {
  assert.match(skill, /`migrate` mode/, 'migrate mode section must exist')
  assert.match(skill, /opt-in \/ off by default/i,
    'migrate pre-flight must frame commitLearnings as opt-in / off by default (retired: default `true`)')
  assert.match(skill, /--stdin --fill-defaults/,
    'accept path must write memory.commitLearnings: true through the war-config validator path')
  assert.match(skill, /nothing migrated — re-run after opting in/,
    'decline path must abort with the exact "nothing migrated — re-run after opting in" message')
})

// (9) The evict flip-back ask is unchanged, but its justification no longer cites the retired
//     default `true`; it now frames commitLearnings as opt-in / turned on.
test('doc-contract: evict flip-back ask survives, justified by opt-in (not the retired default `true`)', () => {
  const ask = lineWith(skill, 'whether to also set `memory.commitLearnings: false`')
  assert.match(ask, /opt-in \/ off by default/i,
    'evict ask justification must frame commitLearnings as opt-in / off by default')
})

// (10) migration.md's two operator-facing spots — the migrate Step-5 opt-in confirm and the
//      evict flip-back justification — are reworded to the opt-in default.
test('doc-contract: migration.md migrate-confirm + evict-justification reworded to opt-in default', () => {
  const confirm = lineWith(migration, 'Confirm committing is on for this repo')
  assert.match(confirm, /opt-in \/ off by default/i,
    'migration.md migrate opt-in confirm must frame commitLearnings as opt-in / off by default')
  assert.match(migration, /flipping it back off/i,
    'migration.md evict justification must reframe the flip as turning an opted-in flag back off (not the retired default `true`)')
})

// (11) OLD-absent (ADR 0025): no surface in either doc still claims the retired `true` default
//      or the economy-pins-false framing. A value assignment (`commitLearnings: true` on the accept
//      path) is NOT a default claim, so the guard anchors on "default … `true`" and "economy … pin … false".
test('doc-contract: no retired commitLearnings default-`true` / economy-pins-false claim survives', () => {
  for (const [name, doc] of [['SKILL.md', skill], ['migration.md', migration]]) {
    const defaultTrue = doc.split('\n').filter(l => /\bdefaults?\b[^`\n]{0,14}`true`/i.test(l))
    assert.deepEqual(defaultTrue, [],
      `${name}: retired "default … \`true\`" commitLearnings claim must be gone; offending: ${JSON.stringify(defaultTrue)}`)
    const economyPins = doc.split('\n').filter(l => /economy[^\n]*pin[^\n]*false/i.test(l))
    assert.deepEqual(economyPins, [],
      `${name}: retired "economy pins \`false\`" framing must be gone; offending: ${JSON.stringify(economyPins)}`)
  }
})

// --- Task 1.3 (memory-tooling-frictions): migrate pre-flight absent-config guard (#823) ---

// (12) The migrate pre-flight must guard the resolver on config-file existence. The resolver
//      exits non-zero on an absent config (war-config-fill-defaults-resolver-exits-nonzero-on-absent-config),
//      and an absent config is the common state (/war-room is opt-in), so the pre-flight has to
//      `test -f .claude/war/config.json` FIRST and treat an absent config as effective defaults
//      (commitLearnings: false) WITHOUT calling the resolver. Case-tolerant, mid-sentence anchors
//      (prompt-only-clause grep-guard lesson): grab the pre-flight branch line by its command token,
//      then assert the absent→skip semantics survive rewording of the surrounding prose. Binding the
//      absent/skip words to the SAME line as the command keeps this from passing on a stray `test -f`
//      elsewhere (check_f-locks-presence-anywhere lesson).
test('doc-contract: migrate pre-flight carries the `test -f .claude/war/config.json` absent-config branch', () => {
  const branch = lineWith(skill, 'test -f .claude/war/config.json')
  assert.match(branch, /absent/i,
    'the pre-flight `test -f` branch must name the absent-config case')
  assert.match(branch, /\bskip\b/i,
    'the absent-config case must skip the resolver call (it exits non-zero on an absent config)')
})

// --- Task 1.1 (repo-projection-integrity, #891): --repo on archive + CLAUDE_MEMORY_REPO threading ---
// Mirror the render-bullet precedent (test 1): #891 is the identical defect class on the archive
// bullet and the Phase 6/7 gate — the env prefixes are the wire without which the new shell check
// never fires in a real pass. Semantics not bytes; the worker owns phrasing. Anchor distinctness is
// binding: (13) grips the ARCHIVE line (not the render line test 1 owns), and (14)/(15) carry
// separate needles for the verify- vs commit-invocation lines (one lock on either lets the other rot).

// (13) Phase 5 archive command passes --repo (repo-adopted store keeps [repo] rows on the archive
//      re-render). Anchored on `archive --local "$STAGING"` so it matches the archive line, not the
//      render line (which is `render-index --local "$STAGING"` and stays owned by test 1).
test('doc-contract: Phase 5 archive passes --repo (archive re-render keeps [repo] rows)', () => {
  const archive = lineWith(skill, 'archive --local "$STAGING"')
  assert.match(archive, /archive --local "\$STAGING" --repo /,
    'Phase 5 archive must pass --repo <repo root> or its trailing re-render silently drops every [repo] row (#891)')
})

// (14) Phase 6 verify invocation carries the CLAUDE_MEMORY_REPO prefix — without it the new
//      repo-completeness gate never fires in a real pass. Separate needle from (15).
test('doc-contract: Phase 6 verify threads CLAUDE_MEMORY_REPO="$REPO_ROOT"', () => {
  const verify = lineWith(skill, 'safe-swap.sh" verify "$STAGING"')
  assert.match(verify, /CLAUDE_MEMORY_REPO="\$REPO_ROOT"/,
    'Phase 6 verify must be prefixed CLAUDE_MEMORY_REPO="$REPO_ROOT" so the repo-completeness check arms')
})

// (15) Phase 7 commit invocation carries the same prefix (commit re-verifies staging itself).
//      Separate needle from (14) — one lock passing on either block would let the other rot.
test('doc-contract: Phase 7 commit threads CLAUDE_MEMORY_REPO="$REPO_ROOT"', () => {
  const commit = lineWith(skill, 'safe-swap.sh" commit "$MEM"')
  assert.match(commit, /CLAUDE_MEMORY_REPO="\$REPO_ROOT"/,
    'Phase 7 commit must be prefixed CLAUDE_MEMORY_REPO="$REPO_ROOT" so the pre-swap re-verify arms the check')
})

// (16) Phase 6 "It checks:" names the repo-completeness hard fail as its own clause. Case-tolerant,
//      mid-sentence anchors on the clause's own tokens (never an ordinal — the sentence's check count
//      is not pinned). "populated repo root" + "zero ... [repo] ... rows" are new-clause-specific
//      (the pre-existing [repo]-skip clause says "rows carrying the trailing [repo] marker", no "zero").
test('doc-contract: Phase 6 It-checks names the repo-completeness hard fail', () => {
  const checks = lineWith(skill, 'It checks:')
  assert.match(checks, /populated repo root/i,
    'It-checks must name the populated-repo-root arming condition of the new hard fail')
  assert.match(checks, /zero[^\n]*\[repo\][^\n]*rows/i,
    'It-checks must name the zero-[repo]-rows wholesale-drop hard fail')
})

// --- Task 2.2 (lessons-learned-seed): `seed` mode wiring + seeding.md/README/war-help locks ---
// Maps spec §10 criterion 8 (doc contract) + prose locks for criteria 3(b)/5/6/7 (agent-mode
// behaviors that live only as skill prose — deferred as live validations, doc-contract-locked here).
// Convention as above: semantics not bytes, distinct needle per lock, whole-file presence for a
// reference-file directive (the plan says seeding.md "carries" these — presence, not a pinned line),
// mid-sentence anchors that survive rewording. Thresholds asserted as numbers, never layout literals.

// The mode-section placement is factored into a helper so the temp-break proof (18b) can drive the
// SAME predicate the green test (18a) asserts — deleting the heading must flip it. Em dash is byte-exact.
const SEED_HEADING = '## `seed` mode — warm-seed a repo from the portable corpus'
const SENTINEL = 'Any other argument text (or none) means a normal housekeeping pass.'
const seedSectionBetweenTightenAndSentinel = (doc) => {
  const iTighten = doc.indexOf('## `tighten` mode')
  const iSeed = doc.indexOf(SEED_HEADING)
  const iSentinel = doc.indexOf(SENTINEL)
  return iTighten !== -1 && iSeed !== -1 && iSentinel !== -1 && iTighten < iSeed && iSeed < iSentinel
}

// (17) Frontmatter description gains the seed-mode clause. Bound to the frontmatter block (first
//      `---`…`---`) so a body mention could not satisfy it — the clause must ship in the description.
test('doc-contract: SKILL.md frontmatter carries the seed-mode clause', () => {
  const frontmatter = skill.slice(0, skill.indexOf('\n---', 3))
  assert.match(frontmatter, /Invoked as \/lessons-learned seed, it instead warm-seeds/,
    'frontmatter description must gain the "Invoked as /lessons-learned seed, it instead warm-seeds…" clause')
})

// (18a) The mode section sits BETWEEN the `tighten` section and the "Any other argument text" sentinel.
test('doc-contract: `seed` mode section sits between the tighten section and the sentinel', () => {
  assert.ok(seedSectionBetweenTightenAndSentinel(skill),
    'the `seed` mode heading must appear after `## `tighten` mode` and before the housekeeping sentinel')
})

// (18b) Temp-break proof: deleting the mode-section heading from a fixture copy breaks (18a) — proves
//       the green contract is discriminating, not vacuous (mirrors seed-set.test.mjs's one-byte break).
test('doc-contract: deleting the `seed` mode heading breaks the placement contract (guard is discriminating)', () => {
  const broken = skill.replace(SEED_HEADING + '\n', '')
  assert.notEqual(broken, skill, 'the fixture mutation must actually remove the heading line')
  assert.ok(!seedSectionBetweenTightenAndSentinel(broken),
    'with the mode heading removed, the between-tighten-and-sentinel contract must fail')
})

// (19) The Phase-0 disambiguation contrasts the Setup seed render (projects existing) vs the `seed`
//      mode (imports new) — both sides bound to ONE line so a scattered half-mention cannot satisfy it.
test('doc-contract: Phase-0 disambiguation contrasts Setup seed render (projects) vs `seed` mode (imports)', () => {
  const note = lineWith(skill, 'names two mechanisms')
  assert.match(note, /Setup seed render/, 'the note must name the Setup seed render side')
  assert.match(note, /projects/i, 'the Setup-seed-render side must be described as projecting existing lessons')
  assert.match(note, /`seed` mode/, 'the note must name the `seed` mode side')
  assert.match(note, /imports/i, 'the `seed`-mode side must be described as importing new lessons')
})

// (20) The bare-pass phase list gains the nomination + ingest hook, delegating to seeding.md.
test('doc-contract: bare-pass phase list carries the nomination + ingest hook delegating to seeding.md', () => {
  assert.match(skill, /Nominate portable lessons \+ sweep contributions/,
    'the phase list must gain a nomination + ingest phase hook')
  const hook = lineWith(skill, 'this list entry is only the phase hook')
  assert.match(hook, /references\/seeding\.md/, 'the hook must delegate to references/seeding.md')
})

// (21) seeding.md carries all three mode-section headings.
test('doc-contract: seeding.md carries the ## Seed / ## Nominate / ## Ingest section headings', () => {
  assert.match(seeding, /^## Seed\b/m, 'seeding.md must have the ## Seed section')
  assert.match(seeding, /^## Nominate\b/m, 'seeding.md must have the ## Nominate section')
  assert.match(seeding, /^## Ingest\b/m, 'seeding.md must have the ## Ingest section')
})

// (22) Collision-skip rule (criterion 5): a colliding slug is skipped and never overwritten.
test('doc-contract: seeding.md ## Seed carries the collision-skip / never-clobber rule (criterion 5)', () => {
  assert.match(seeding, /skipped-collision/,
    'the collision scan must report a skip (`skipped-collision`)')
  assert.match(seeding, /never (over\w+|clobber)/i,
    'the collision rule must state the existing file is never overwritten / clobbered')
})

// (23) seededFrom stamp line (criterion 6 stamp): each placed member is stamped with the
//      work-audit-refine/docs/seed@<version> value.
test('doc-contract: seeding.md ## Seed stamps metadata.seededFrom (criterion 6 stamp)', () => {
  assert.match(seeding, /metadata\.seededFrom/,
    'the ## Seed placement must stamp metadata.seededFrom on each member')
  assert.match(seeding, /work-audit-refine\/docs\/seed@/,
    'the seededFrom stamp value must be work-audit-refine/docs/seed@<version>')
})

// (24) Nomination exclusions (criteria 6 exclude-stamped + 7 dedup): a seededFrom-stamped lesson,
//      a slug in either manifest tier, and a slug on an open/closed issue are all excluded. Distinct
//      needles, each matched within a single line (`[^\n]*`) so a two-line reflow cannot spoof the pair.
test('doc-contract: seeding.md ## Nominate rubric excludes stamped + both manifest tiers + open/closed issues (criteria 6, 7)', () => {
  assert.match(seeding, /carries `metadata\.seededFrom`/,
    'the rubric must exclude a lesson already carrying metadata.seededFrom (criterion 6)')
  assert.match(seeding, /`seed-manifest\.json` tier[^\n]*`seed`[^\n]*`archive`/,
    'the rubric must exclude a slug already in either seed-manifest.json tier — seed or archive (criterion 7)')
  assert.match(seeding, /open or closed[^\n]*`seed-candidate` issue/,
    'the rubric must exclude a slug already carried by an open or closed seed-candidate issue')
})

// (25) Lint-fail-closed placement rule (criterion 3b): a repo-root placement lints the whole dir and
//      a hit refuses the placement outright.
test('doc-contract: seeding.md ## Seed lint-gates the repo-root placement fail-closed (criterion 3b)', () => {
  assert.match(seeding, /lint the whole directory fail-closed/i,
    'repo-root placement must lint the whole directory fail-closed before render/commit/PR')
  assert.match(seeding, /refuses the whole repo-root placement/i,
    'a lint hit must refuse the whole repo-root placement — no render, no commit, no PR')
})

// (26) README documents the seed verb, behaviors, and BOTH caps as thresholds (never layout literals).
test('doc-contract: README documents the seed verb, warm-seed + contribution behaviors, and the ≤ 50 / ≤ 1,500,000 caps', () => {
  assert.match(readme, /\/lessons-learned seed/, 'README must mention the /lessons-learned seed verb')
  assert.match(readme, /warm-seed/i, 'README must describe the warm-seed behavior')
  assert.match(readme, /seed-candidate/, 'README must document the seed-candidate contribution flow')
  assert.match(readme, /50 members/, 'README must state the ≤ 50-member seed cap (threshold, not layout)')
  assert.match(readme, /1,500,000/, 'README must state the ≤ 1,500,000 B seed byte cap (threshold, not layout)')
})

// (27) war-help orientation card mentions the seed verb + its warm-seed/import behavior (a card, so
//      NO caps — asserting thresholds here would force a layout literal into a one-line orientation row).
test('doc-contract: war-help card mentions the seed verb + warm-seed behavior', () => {
  assert.match(warhelp, /\/lessons-learned seed/, 'war-help card must mention the /lessons-learned seed verb')
  assert.match(warhelp, /warm-seed|portable corpus/i,
    'war-help card must convey the warm-seed / portable-corpus behavior')
})
