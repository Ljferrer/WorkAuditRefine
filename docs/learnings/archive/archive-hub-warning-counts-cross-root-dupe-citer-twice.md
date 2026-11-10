---
name: archive-hub-warning-counts-cross-root-dupe-citer-twice
description: "war-memory archive's concept-hub warning counts a cross-root-dupe citer once per root (reports 2 inbound) while the inbound verb dedupes by slug (reports 1) — ground-truth a hub call with a slug-deduped citer grep before downgrading a retire to a stub"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - war-memory
    - archive
    - inbound
    - concept-hub
    - cross-root-dupe
    - lessons-learned
    - housekeeping
    - hub-downgrade
  originSessionId: 58803fc6-86a7-4d6f-8565-e61dd25efab2
  modified: 2026-07-27T05:57:12.123Z
---

During the 2026-07-27 `/lessons-learned` pass, `war-memory archive` warned
"archiving concept hub 'seeding-md-seed-local-render-block-omits-conditional-repo-flag'
(2 inbound refs)" while `war-memory inbound` for the same slug reported **1**. Ground truth
(grep across both hot roots + both archives): the two "refs" were the **local and repo copies of
the same citing lesson** — `seed-manifest-description-is-frontmatter-only-body-fix-needs-tarball-verify`
is a cross-root dupe, and the archive-time counter counts files, not slugs.

**Why:** the hub-downgrade rule (≥ 2 inbound ⇒ keep-compress stub, never archive) keys on *distinct
citing lessons*. A dupe pair is one lesson in two roots; treating it as two citers forces an
unnecessary stub and blocks a clean retire. The two counters disagree by design blind spot, not data
rot.

**How to apply:** when archive's hub warning and `inbound` disagree, adjudicate with a slug-deduped
grep across all four locations (local hot, local archive, repo hot, repo archive) before changing the
plan. Also remember the target's projection row can survive via a repo-hot twin — if the citing
lesson's `[[link]]` still resolves to a hot copy, archiving the local copy orphans nothing. Same
four-location discipline applies to `safe-swap verify`'s dangling-wikilink WARN, which only sees the
local root and lists every legal link to a repo-root lesson as "no target file".

Related: [[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]],
[[war-memory-archive-cross-root-dupe-mutates-repo-root]] (archived — cold link).

> archived 2026-08-15: resolved — moved to archive
