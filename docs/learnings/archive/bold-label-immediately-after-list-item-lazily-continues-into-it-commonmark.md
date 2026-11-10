---
name: bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark
description: "A bold-label line right under a list item with no blank line renders inside it per CommonMark lazy continuation"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark
  phase: "precision-chain-and-loop-breaker/4.2 (original); confirmed-instance fixed by red-team-gate-cli/1.1, landed dev/2026-08-06-red-team-gate-cli @ 765d00f378fc6a6bc04f23ec5b747ab11062aee7"
  keywords: 
    - commonmark
    - lazy continuation
    - markdown list
    - bold label
    - blank line
    - report template
    - rendering gotcha
    - re-entry
    - route upstream
    - README Status blurb
    - release notes paragraph
    - trailing sentence after bullet list
    - version-slots.test.mjs
  tags: 
    - war
    - markdown
    - doc-authoring
    - gotcha
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-27T19:38:30.360Z
---

# A bold label line right after a Markdown list item lazily continues into that item (CommonMark)

## The pattern

Per CommonMark's lazy-continuation rule, a line that immediately follows a list item with **no
blank line separating them** is treated as a continuation of that list item's paragraph, even if
the new line is itself formatted to look like its own standalone element (e.g. `**Label:**
text`). Visually, in raw source, the two lines look distinct; rendered, the second line nests
inside the preceding bullet instead of appearing as a sibling block.

Confirmed instance (historical — fixed as of red-team-gate-cli/1.1, see ## Update below; kept
verbatim for the pattern illustration): the `**Re-entry:** ...` line sat directly beneath the
`- <the unsettled decision...>` agenda bullet with no blank line, so it lazily continued into that
bullet rather than rendering as its own line, in `skills/red-team/references/lenses.md`'s `##
Route upstream` report-template block. The same shape was duplicated byte-for-byte in the fenced
template inside `skills/red-team/references/loop-budget.md`.

## Why it matters here specifically

This is not merely cosmetic when the block in question is a **handoff/report template** that
gets copied verbatim into a different document — here, `/war-campaign`'s halt arm copies the
`## Route upstream` section into `CAMPAIGN-STATE.md`. A substring-matching reader (grep, an
agent doing a text search) is unaffected either way, but any renderer (GitHub, a Markdown
preview) shows the mis-nested structure to a human operator reading the state file.

## How to apply

When authoring or reviewing a Markdown template that mixes list items with subsequent
"**Label:** value" lines meant to stand alone, always insert a blank line before the label line.
This is especially worth a deliberate check on any block that is a copy/paste template destined
for another document (report templates, handoff blocks, CAMPAIGN-STATE.md sections) — a rendering
defect there propagates to every future copy, and a repo's own drift-guard tests (which typically
assert presence/content substrings) will not catch missing blank lines.

## Update (red-team-gate-cli/1.1, #1366)

Verified at landed tip `765d00f378fc6a6bc04f23ec5b747ab11062aee7`: both
`skills/red-team/references/lenses.md` and `skills/red-team/references/loop-budget.md` now carry
a blank line before `**Re-entry:**` (the confirmed instance above is fixed), and two doc-guard
rows in `skills/red-team/assets/red-team-gate.test.mjs` (`assert.match(TEXT,
/\n[ \t]*\n\*\*re-entry:\*\*/i)`) red if either file's blank line is ever dropped again. The
general CommonMark lazy-continuation pattern documented above remains live guidance for any other
similarly-shaped list-item + bold-label template in this repo — see also
[[multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap]] for a related
caution: a whole-file presence-anywhere blank-line guard (as landed here) is non-vacuous only
while each file carries exactly one `**Re-entry:**` occurrence — verified true at this tip.

## Update 2 (in-run-finding-resolution/2.1, still LIVE — not a resolved instance)

A third, distinct, currently-**unfixed** instance: `README.md`'s `## Status` section, at landed
tip `2af20e5878f0364ac65a7791aa58b770fa909c74` (plan `2026-08-27-in-run-finding-resolution`,
branch `dev/2026-08-27-in-run-finding-resolution`). Line 369 (the last `## Status` bullet,
`- **Phase-2 hardening (#1879)** — …`) is immediately followed by line 370 (`Earlier release
notes live in [CHANGELOG.md](CHANGELOG.md).`) with **no blank line** between them — verified by
direct read of the landed worktree README.md at that tip. Per the same lazy-continuation rule,
the sentence renders nested inside the last bullet instead of as its own paragraph. This is a
different shape than the original confirmed instance (a plain trailing paragraph after a bullet
block, not a `**Label:**` line), so the pattern's trigger shape is broader than "bold label
specifically" — any non-block-starting line placed directly after a list item's paragraph
lazily continues, label or not.

Two things this recurrence adds to the general guidance:

1. **The release-blurb edit path is a recurring vector.** The `## Status` bullet list gets
   replaced in place on every release (see `## Releasing` checklist in README.md); an editor
   that swaps N old bullets for M new ones while preserving the trailing sentence is exactly the
   diff shape that drops the separating blank line (three-dot diff showed paragraph+blank+5
   bullets+blank+sentence in the base tree collapsing to paragraph+4 bullets+sentence with the
   blank consumed). Any future Status-blurb edit should explicitly re-check for the blank line
   after the last bullet, not just before the first.
2. **No test in this repo guards this shape.** `skills/war/assets/version-slots.test.mjs`
   (verify still present before acting — `skills/war/assets/version-slots.test.mjs`) only
   extracts/asserts the single leading bold semver token and the presence of the Status-blurb
   authoring checklist section; it has no paragraph/blank-line structural assertion, so this
   class of regression is invisible to the suite that otherwise locks the Status region tightly.

At audit time this was filed `Minor`/`follow-up` (not absorbable in-run — see
[[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]] for why a release-slot file's
own regression can't self-heal via this repo's ace/sweep machinery even when the fix is a single
character).

> archived 2026-08-17: resolved — moved to archive (general pattern remains live guidance; this
> Update 2 records a currently-unfixed recurrence, not a further resolution)
