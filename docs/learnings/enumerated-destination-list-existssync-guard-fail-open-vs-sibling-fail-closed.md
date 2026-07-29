---
name: enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed
description: "existsSync-guarding an explicitly enumerated (not directory-scanned) list of doc destination files makes a rename/delete silently narrow a UNION scan instead of reding it — throw instead, matching sibling suites that read the same files unguarded"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-28-prompt-surface-simplification@phase-2
  provenance: code-verified
  slug: enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed
  phase: prompt-surface-simplification/2.1
  keywords: 
    - existsSync guard
    - fail-open
    - fail-closed
    - UNION scan
    - enumerated destination list
    - doc-cli-consistency
    - test guard design
    - eviction destinations
  tags: 
    - war
    - test-authoring
    - guard-design
    - prompt-surface
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-29T16:18:03.289Z
---

# An existsSync guard is the right shape for a directory scan, wrong for an enumerated list

**Found (code-verified — verified at landed tip `d845fa834f65c7a21b260c329f7532e20fdbdad4`,
`skills/_shared/doc-cli-consistency.test.mjs` `skillDocs()`, lines 103-129): the function first
scans `skills/*/SKILL.md` via a directory walk — `existsSync` there is legitimate, since not every
`skills/<dir>` has a `SKILL.md`. It then appends a **hardcoded `EVICTION_DESTINATIONS` array**
(the 4 references/ files Task 2.1 evicted content into) using the exact same
`if (existsSync(p)) docs.push(...)` pattern, copy-pasted from the scan loop above it. For an
explicitly enumerated list this is the wrong shape: a rename or deletion of one of those 4 files
silently **drops it from the UNION scan** rather than reding the suite — a guard-narrowing
disguised as a guard.

**Why it's low-severity in practice, not why it's correct:** two sibling suites read the same 4
files unguarded — `skill-doc-contracts.test.mjs` module-scope `readFileSync`s all four (throws
immediately on a rename) and `war-config.test.mjs`'s UNION rows call `readDoc()` per destination.
Either throws first, so `doc-cli-consistency.test.mjs`'s guard cannot actually go silent without
another same-diff suite going red. That's a lucky redundancy, not a designed one.

**Pattern to apply:** when a test enumerates a **fixed, known list** of files (not a directory
scan whose membership legitimately varies), read them unguarded (let a missing file throw) or add
an explicit `assert.ok(docs.some(d => d.path === rel))` per enumerated entry — reserve
`existsSync`-skip for genuine directory/glob scans where absence is an expected, valid state.

**Confirmed correctly applied, phase 4.1 (code-verified — landed tip
`cce668634ff6d566d1370e9502c08d317fea4e3c`, via the `_refinery` worktree at
`.claude/war-worktrees/2026-07-28-prompt-surface-simplification-2026-07-28/_refinery/`,
`skills/war/assets/refinery-surface.test.sh` lines 111-119):** Task 4.1 added a new UNION-scanned
eviction destination (`skills/war/references/refiner-recovery.md`) to a *shell* absence-scan
suite's enumerated `LIVE_SURFACE_FILES` list. The first-round diff repeated exactly this lesson's
shape (member guarded only by the loop's `[ -f ]` skip, no dedicated existence assertion); the
audit finding named it, and the fix round added a fail-loud `PRESENCE CHECK 5` immediately before
`LIVE_SURFACE_FILES` is built — verified present at the landed tip. Confirms the prescribed fix
(a dedicated presence check per enumerated member) is the concrete pattern to reach for, in shell
suites as well as `*.test.mjs` ones.
