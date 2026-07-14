---
name: redaction-lint-self-trips-on-cited-local-root-lesson-path
description: Cited local-root path trips lint, withholds issue
metadata:
  type: project
  provenance: agent-unverified
  slug: redaction-lint-self-trips-on-cited-local-root-lesson-path
  phase: survey-corps-memory-mining/t1
  keywords:
    - redaction lint
    - LINT_PATTERNS
    - home-path
    - withheld redaction
    - local-root path
    - war-memory.mjs lint
    - survey-corps mining
    - issue body citation
    - Lesson slug dedup line
    - slug-only citation mandate
    - fix landed task 1.2
  updated: 2026-07-13
  tags:
    - war
    - memory-protocol
    - redaction
    - survey-corps
  created: 2026-07-12
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Citing a lesson's real local-root path in a filed artifact self-trips the lint that would catch a real leak

**RESOLVED** (fix verified live at master, 2026-07-13): `skills/survey-corps/SKILL.md` Step-0 "Mine"
now mandates **slug-only** citation for local-root lessons — the greppable `Lesson: <slug>` line
alone, never a path — and names the `home-path` `LINT_PATTERNS` entry in
`skills/_shared/war-memory.mjs` that a resolved home path would trip, withholding the whole
otherwise-clean issue.

**The transferable rule:** any directive that tells an agent to embed a memory-root path *inside a
downstream redaction-scanned artifact* (issue body, PR description, commit message bound for a
redaction gate) must specify a **lint-safe citation form** — slug-only, or repo-relative — never
leave `<local-root>` to resolve to the real absolute path. Anywhere a directive says "cite the
source path," check what lint/gate that citation will later pass through and specify the form that
survives it. Mirror image of
[[d3-locate-cue-paths-must-be-repo-relative-or-placeholder-not-absolute-home-path]] (the servitor's
*own* lesson-file writes), applied to survey-corps' mining drafter.

Related: [[d3-locate-cue-paths-must-be-repo-relative-or-placeholder-not-absolute-home-path]],
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].
