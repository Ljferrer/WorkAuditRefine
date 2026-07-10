---
name: adr-citing-local-only-lesson-creates-dangling-repo-link
description: "An ADR References section citing a local-root-only [[slug]] dangles once the ADR lands in the repo"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - ADR references
    - dangling wikilink
    - local-root-only lesson
    - promotion gap
    - citation-time verification
    - docs/adr authoring
    - memory promotion
    - safe-swap blind spot
    - repo tag
  provenance: agent-unverified
  slug: adr-citing-local-only-lesson-creates-dangling-repo-link
  phase: memory-and-lessons-learned-hygiene/t1.5
  tags: 
    - memory
    - adr-authoring
    - dangling-link
    - promotion
  created: 2026-07-09
  relates: 
    - "[[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]]"
    - "[[dangling-link-verdict-must-check-archive-before-removal]]"
    - "[[war-memory-candidates-apply-default-flip-pending-verification]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Citing a still-local memory lesson in an ADR's References section creates a dangling link once the ADR lands

**Finding (t1.5 gate-audit, Nit):** ADRs 0028/0029's "Memory lessons (originating friction cluster)"
References sections cite six `[[lesson]]` wikilinks; two — `retiring-a-resolved-memory-must-check-inbound-links-hubs-stay`
and `verify-and-close-claim-can-trace-to-transient-uncommitted-edit` — resolve only in the local memory root,
never promoted (`[repo]` tag absent from `MEMORY.md`; independently confirmed by this servitor: both files
exist at `<local-memory-root>/<slug>.md`, but no
`docs/learnings/<slug>.md` counterpart). ADR 0025 (same authoring convention, immediately preceding) has all
12 of its cited lessons resolving in-repo — establishing an implicit convention that ADR-cited lessons are
promoted. **The two cited ADR files themselves (`docs/adr/0028-*`, `docs/adr/0029-*`) were not found in either
accessible checkout at servitor write time — highest ADR present was 0025 — so this fact's ADR-side half is
`agent-unverified`; absence-note: verify ADR 0028/0029 exist and still cite these two slugs before acting.**

**Why:** promotion (`type: project` → repo root via Gate 2) and ADR authoring are two independently-timed
acts — nothing forces a lesson to be promoted just because an ADR is about to cite it. No tool catches the
gap: `safe-swap.sh verify` scans the memory corpus for dangling `[[link]]`s, never `docs/adr/`.

**How to apply:** before landing an ADR whose References section cites `[[slug]]` memory lessons, check each
cited slug's `MEMORY.md` row for a `[repo]` tag. Untagged (local-only) → either promote the lesson in the same
task (mark `type: project`, let Gate 2 pick it up) or cite the design spec/plan section instead of the raw
lesson slug. This is a citation-*creation*-time check, the mirror image of
[[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]] (a *retirement*-time check) and
[[dangling-link-verdict-must-check-archive-before-removal]] (a *removal*-verdict-time check) — all three are
the same underlying invariant ("a `[[link]]` must resolve somewhere reachable by its reader") enforced at a
different point in the lesson's lifecycle.
