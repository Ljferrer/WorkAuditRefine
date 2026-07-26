---
name: seed-manifest-description-is-frontmatter-only-body-fix-needs-tarball-verify
description: "docs/seed/seed-manifest.json's per-member description column regenerates from the packed member's frontmatter description key alone — a manifest-only grep for a stale contract string can pass clean even when the packed member's non-frontmatter BODY prose (e.g. an 'Exit contract:' line) still carries the old text; verify a seed-corpus content fix against the actual tarball member, not just the manifest projection"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: seed-manifest-description-is-frontmatter-only-body-fix-needs-tarball-verify
  phase: "land-advance-exit-contract-truth/Phase 1, Task 1.1"
  keywords: 
    - seed-manifest.json
    - seed-pack.mjs
    - resolveMember
    - manifestRow
    - tarball verify
    - tar -xzO
    - seed corpus
    - portability-stripped twin
    - frontmatter description
    - lessonRecord
    - manifest projection
  tags: 
    - war
    - lessons-learned
    - seed-corpus
    - doc-truth-sweep
    - calibration
  created: 2026-07-24
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-24T20:54:09.591Z
---

# A seed-manifest.json content fix must be verified against the tarball member, not the manifest alone

**What's true (code-verified — `skills/lessons-learned/assets/seed-pack.mjs`, confirmed via the
`p1-1.1` task worktree, gitdir physical path `<repo-root>/.git/worktrees/p1-1.1` containing this
plan's slug):** `resolveMember()` builds each manifest row from `lessonRecord(parseFrontmatter(content), ...)`,
and `manifestRow()` copies `m.description` straight through — `docs/seed/seed-manifest.json`'s
per-member `description` field is regenerated **only** from the packed member's YAML frontmatter
`description:` key. The member's Markdown **body** (the non-frontmatter prose — e.g. a lesson's own
`**Exit contract:**` / `**How to apply:**` lines) is never read into the manifest at all; equality
between pack runs is checked at the unpacked-**contents** level (member set + per-member bytes +
sha256), never by hashing the gzip tarball blob (gzip is nondeterministic, BSD/GNU tar diverge).

**Why this matters for a doc-truth sweep:** fixing a stale contract string (e.g. a lesson's exit-code
enumeration) requires editing it in **two** places for a seeded lesson — the repo-root lesson file
*and* the seed corpus's portability-stripped twin, re-packed via `seed-pack.mjs pack`. A completeness
check that only greps `seed-manifest.json`'s `description` column for the stale string will read
clean the moment the frontmatter `description` is corrected, **even if the twin member's body still
carries the old text** — the manifest is a projection of frontmatter only and structurally cannot
witness a body-only omission. The only way to verify the packed member's body is corrected is to
extract the actual tarball member and grep that: `tar -xzOf docs/seed/seed.tar.gz <slug>.md | grep
'<stale-string>'`.

**How to apply:** when correcting a lesson that has a seed-corpus twin, verify the fix twice — once
on the repo-root lesson file directly, and once by extracting the packed member from
`docs/seed/seed.tar.gz` and grepping its body (never trust a `seed-manifest.json` grep as proof of a
body-level fix). `node skills/lessons-learned/assets/seed-pack.mjs verify docs/seed` confirms
pack/manifest coherence (member set + bytes + sha256) but does **not** independently prove any
particular *content* claim about a member's body — that still needs a direct tarball-extraction grep.

**Anchors (verify still present before acting):** `resolveMember()` / `manifestRow()` in
`skills/lessons-learned/assets/seed-pack.mjs` (the frontmatter-only description path);
`docs/seed/seed-manifest.json` (the reviewable projection); `docs/seed/seed.tar.gz` (the actual
packed contents, opaque to a manifest-only grep).

Related: [[seeding-md-seed-local-render-block-omits-conditional-repo-flag]] (a different seed/local
projection gap in the same subsystem family — both are instances of "the projection is not the
source of truth, verify against the underlying artifact").
