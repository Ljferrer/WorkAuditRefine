---
name: version-slots-no-cross-slot-consistency-test
description: "RESOLVED: version-slots.test.mjs now locks all four release slots in lock-step, fail-closed"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: version-slots-no-cross-slot-consistency-test
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.1
  keywords: 
    - partial bump
    - silent release
    - manifest mismatch
    - plugin.json
    - marketplace.json
    - version drift
    - version-slots.test.mjs
    - heading anchor
    - regex extraction
    - README Status
  tags: 
    - release
    - version-bump
    - invariant
    - hardening
    - resolved
  files: 
    - skills/war/assets/version-slots.test.mjs
    - README.md
  relates: 
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[readme-undersell-guard-couples-doc-prose-to-true-slot-count]]"
  created: 2026-07-09
  promoted: version-slots-no-cross-slot-consistency-test
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# RESOLVED: the four version slots are now locked in lock-step by a dedicated fail-closed test

**Supersedes the prior "durable, pre-existing gap"** (originally recorded at `red-team-verdict-
integrity/t4.2` + 7 recurrences through `resume-prec/p2-t4`; repo copy at
`docs/learnings/version-slots-no-cross-slot-consistency-test.md` uses the older frontmatter shape
— `metadata.node_type: memory`, no nested `metadata.provenance` field at all — so per the
recurrence-on-a-repo-lesson rule this is a NEW same-slug local write, not an in-place edit).

**What changed (code-verified — `skills/war/assets/version-slots.test.mjs`; verify still present
before acting):** the gap is closed. `readSlots()` extracts all four slots
(`plugin.json#version`, `marketplace.json#metadata.version`, `marketplace.json#plugins[0].version`,
the README `## Status` bold semver token) and asserts each is a well-formed semver (fail-closed:
`assert.ok(value != null, …)` before the format check, so two independently-`undefined`
extractions can't pass vacuously against each other). Root is resolved from `import.meta.url`
(never `process.cwd()` — the WAR subagent cwd is the main repo, not this worktree, and resets
between Bash calls).

**A live gotcha this test's own fix round hit (worth recording on its own):** the README `## Status`
extraction originally anchored on `readme.indexOf('## Status')` — the **first** occurrence of that
substring in the file, which is actually the backtick-quoted reference to the heading inside the
`## Releasing` table (`` | `README.md` | the `## Status` line/paragraph | ``), not the heading
itself. This was benign today only because no bold semver token sits between the table reference
and the real heading, so extraction still landed on the right value — but it deviated from the
plan's "extract by construct" instruction and would have silently mis-extracted the moment the
Releasing prose itself grew a bold semver token before the real heading. **The fix, now in place:**
anchor on `readme.indexOf('\n## Status')` — the real heading is always newline-prefixed, while
the table's backtick reference never is. **General pattern:** when a heading name is *also*
referenced in prose elsewhere in the same doc (a table row describing what the heading contains),
`indexOf('## Heading')` binds to whichever occurs first in the file, not necessarily the heading —
require a leading `\n` (or a start-of-line regex, `/^## Heading/m`) to bind to the construct
itself.

Also fixed in the same task: the README `## Releasing` prose was updated from "three
version-of-truth files" to "all four version slots across three files" so the test's own subject
matter (the undersell phrase) doesn't itself go stale — see
[[readme-undersell-guard-couples-doc-prose-to-true-slot-count]].

**First-real-use confirmation (code-verified, gh-issue-lifecycle-and-run-bookkeeping-mechanization
phase-2/t2.1, 2026-07-08 landed branch):** the very next trailing release-bump task after this
guard landed exercised it for real — plan-authored baseline was the stale `0.14.14`, live tip
before the bump was `0.14.17` (commit `034b280`), and the task correctly resolved to `0.14.18`
across all four slots (verified directly: `.claude-plugin/plugin.json` reads `0.14.18` at worktree
`.claude/worktrees/2026-07-09-gh-lifecycle/p2-t2.1`). Gate-audit verdict `approve`, zero findings
beyond an informational Nit confirming alignment. This closes out the long
[[stacked-release-plan-version-literal-lags-operator-target]] recurrence chain (8 recurrences prior
to the guard) as no longer worth flagging per-phase — the mechanical test now catches what the
audit used to have to eyeball.

> archived 2026-07-12: resolved — moved to archive
