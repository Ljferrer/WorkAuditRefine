---
name: enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed
description: "RESOLVED (doc-cli-consistency-corpus/1.1, #1368): existsSync-guarding an explicitly enumerated (not directory-scanned) list of doc destination files makes a rename/delete silently narrow a UNION scan instead of reding it — throw instead, matching sibling suites that read the same files unguarded"
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
    - membership assert
    - spec posterity
    - corpusPaths
    - default-deny census
  tags: 
    - war
    - test-authoring
    - guard-design
    - prompt-surface
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-08-07T01:36:45.936Z
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

---

## RECURRENCE — same file, a NEW enumerated guard added on top (phase 6,
## `2026-08-05-precision-chain-and-loop-breaker`, 2026-08-06, recorded as open residual)

**Code-verified at landed tip `3d3b7913239e6a62e9ee2e485e1d7a9dcd2cf0e4` on
`dev/2026-08-05-precision-chain-and-loop-breaker`**, read via the run-scoped `_refinery`
worktree (`<repo-root>/.claude/war-worktrees/2026-08-05-precision-chain-and-loop-breaker-2026-08-05/_refinery/`),
`skills/_shared/doc-cli-consistency.test.mjs` lines 231-234: a later task (5.4, "spec posterity",
End state 15) added a *second*, narrower guard on the same `skillDocs()`-built corpus —
`const corpusPaths = specRuleCorpus().map(d => d.path)` then
`for (const rel of ['README.md', 'skills/lessons-learned/references/seeding.md', 'skills/war/references/design.md']) assert.ok(corpusPaths.includes(rel), ...)`.
That membership loop pins only **3 of the 14** `EVICTION_DESTINATIONS` entries this lesson's
original finding named. Deleting the FILE at one of the pinned 3 still fails closed (the
unguarded `readFileSync` this lesson's fix already applies throws), but silently **dropping one
of the other 11 `EVICTION_DESTINATIONS` array entries from the in-file list** narrows both scans
(the spec-posterity guard and the original UNION scan) with the suite staying green — the exact
narrowing class this lesson exists to catch, reintroduced by a new assert layered on the same
corpus rather than by re-touching the original `existsSync` guard.

A phase-6 audit finding on this exact construct was filed `disposition: follow-up` (not
`absorb`) — explicitly **not** phase-close-fixable, because closing it means redesigning the
guard's semantics (3-path membership loop → default-deny multiset over the full
`EVICTION_DESTINATIONS` array), a substantive change to an already-merged, shared test, not a
mechanical polish fix. Recorded here as an open, known residual rather than a fixed instance —
verify still present before treating it as live: `skills/_shared/doc-cli-consistency.test.mjs`,
search for `corpusPaths.includes`.

**Refined pattern:** when a SECOND enumerated-membership assert is layered on top of an existing
UNION-scanned corpus, its own coverage claim needs auditing independently of the corpus-build
guard underneath it — "the corpus build fails closed" does not imply "every membership assert
over that corpus covers the whole corpus." The fix this lesson's earlier recurrence prescribes
(a dedicated presence check per enumerated member, or read-unguarded) generalizes to: assert
membership over the **full** known-list, not a convenience subset, or the assert only proves
narrower than its own prose claims.

> archived 2026-08-15: resolved — moved to archive
