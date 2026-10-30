---
name: scope-locked-probe-cannot-read-the-plugin-doctrine-home-its-row-points-at
description: A scope-locked probe is pointed at a plugin-root doctrine file its lock forbids on a foreign repo
metadata:
  node_type: memory
  type: project
  keywords:
    - scope-lock
    - red-team probe
    - doctrine home
    - artifact-evidence.md
    - single home
    - foreign repo
    - lenses.md
    - untrusted-content
    - rea-evidence
    - EXCEPT clause
    - ask finding
  provenance: code-verified
  slug: scope-locked-probe-cannot-read-the-plugin-doctrine-home-its-row-points-at
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.6
  tags:
    - war
    - red-team
    - prompt-authoring
    - scope-lock
    - open-ask
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T07:00:16.690Z
---

# A scope-locked red-team probe cannot read the plugin doctrine file its catalog row points at

**Rule.** A plan may make a doctrine file the single home and tell a scope-locked probe to read it. In the same task, widen that probe's carve-out. Or inline the text with a guard. A pointer alone fails on a foreign repo.

**Why:** Plan guardrail G9 put the `rea:` tag grammar in `skills/war-strategy/references/artifact-evidence.md` only, and the `rea-evidence` and `untrusted-content` rows in `skills/red-team/references/lenses.md` pointed at it. On a foreign `--repo` that file sits under the plugin root, outside every probe's scope-lock.

**Fixed (ruling #2397, closed by PR #2411, commit 12f06d0c).** The Lead threads the file's absolute path as `args.doctrineFile`, and `scopeLock` admits that one file read-only on both techniques. Both rows are now pointers to "the evidence doctrine file the scope-lock names". A rejected or absent path drops the clause, so the read stays forbidden.

**How to apply:** When a row points at a file under the plugin root, check that the Lead threads it and the scope-lock admits it. Add a new doctrine pointer the same way, not with a bare row.

**Locate-cue (verify still present before acting).** `skills/red-team/assets/workflow-scaffold.js`, `doctrineClause` and `scopeLock`; `skills/red-team/SKILL.md`, Step 2; `skills/red-team/references/lenses.md`, the `rea-evidence` and `untrusted-content` rows.

**Related.** [[analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires]] is the same class, resolved there with an EXCEPT clause. [[agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo]] covers the card-pointer side.

> archived 2026-10-30: resolved — moved to archive
