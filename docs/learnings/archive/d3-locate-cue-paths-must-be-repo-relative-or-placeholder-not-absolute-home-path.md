---
name: d3-locate-cue-paths-must-be-repo-relative-or-placeholder-not-absolute-home-path
description: "D3 locate-cues, and any path an agent embeds in a redaction-scanned artifact, must be repo-relative, slug-only or a placeholder, never an absolute home/checkout path — it self-trips the fail-closed home-path redaction lint"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: d3-locate-cue-paths-must-be-repo-relative-or-placeholder-not-absolute-home-path
  phase: servitor-redaction-at-source/t1
  keywords: 
    - D3 verify-on-write
    - locate-cue
    - found at path
    - home-path redaction lint
    - Gate-2 promotion
    - repo-relative path
    - session-worktree placeholder
    - local-memory-root placeholder
    - absolute checkout path
    - war-servitor.md
    - workflow-template.js
    - files_written stays absolute
    - slug-only citation mandate
    - issue body citation
    - survey-corps mining
  tags: 
    - servitor
    - memory-protocol
    - redaction
    - prompt-surfaces
  created: 2026-07-11
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# D3 locate-cues: repo-relative or placeholder, never an absolute home path

**Rule (going forward, for this and every future servitor run):** when writing a D3
verify-on-write locate-cue ("found at `<path>` @ phase X") — or *any* path anywhere in a lesson
file (body, `description`, `metadata.keywords`, absence-notes) — the path must be either
repo-relative for a referent tracked in this repo, or one of three placeholders for an
out-of-tree location: `<repo-root>`, `<session-worktree>`, `<local-memory-root>`. Never the
absolute home/checkout shape (a path that starts at the user's home directory, which the fail-closed
`home-path` redaction lint pattern catches at Gate-2). The one documented exception:
`ServitorResult.files_written` stays **absolute** — that's a separate contract (the Lead's Gate-2
reconciliation is an absolute-prefix check on that field specifically), not a locate-cue.

**Why this exists:** the D3 directive as originally worded gave no format constraint on `<path>`,
so a servitor naming an inspected file would naturally write the real absolute checkout path —
which is exactly the shape `docs/learnings/`'s redaction lint demotes `type: project` lessons
over at Gate-2 (home paths, emails, handles, credential shapes → demoted to local, reported, never
dropped). Per the operator's Commander's Intent for this phase, this had already recurred three
times in the 2026-07-08 memory-frictions campaign, each time forcing a manual placeholder
substitution after the fact. Phase "Path-hygiene directive on both servitor prompt surfaces +
registry row" (t1, landed `dev/2026-07-11-servitor-redaction-at-source`) fixed the directive that
*produces* the paths (both `agents/war-servitor.md`'s D3 clause and the dispatched servitor
Wrap-up `pt` block in `skills/war/assets/workflow-template.js`) rather than adding any new lint,
hook, or gate — the redaction lint itself stays the unchanged net (end state 8 of the plan
hard-excludes `skills/_shared/war-memory.mjs`/`.test.mjs` from this task's diff).

**The same rule binds any path a directive tells an agent to embed in a redaction-scanned
artifact** (an issue body, PR text, a commit message bound for a redaction gate). Use slug-only or
repo-relative form, never a placeholder that resolves to the real absolute path. One home-path hit
withholds the whole otherwise-clean artifact. `skills/survey-corps/SKILL.md` Step-0 "Mine" now
mandates slug-only citation for local-root lessons: the `Lesson: <slug>` line alone, never a path.

**Adjacent pattern:** a guard's own prohibition text must describe the forbidden shape in words,
never embed a literal instance of it. See
[[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]].

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]],
[[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]],
[[standing-instruction-vs-dispatched-prompt-coverage-split]].

> archived 2026-07-12: resolved — moved to archive
