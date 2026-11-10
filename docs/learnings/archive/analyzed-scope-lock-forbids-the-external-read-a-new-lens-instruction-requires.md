---
name: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
description: "A new probe instruction or doctrine pointer that needs a read outside the probe's scope-lock must also widen the scope-lock carve-out, not just the prompt body"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - scope-lock
    - analyzed probe
    - scopeLock override
    - PER-ISSUE EVIDENCE JOIN
    - coverage-vs-source
    - gh issue read
    - red-team lens
    - workflow-scaffold.js
    - fail-open capping
    - open nothing else on the machine
    - D14 carve-out
    - EXCEPT clause
    - gh issue view exception
    - doctrine home
    - doctrineClause
    - args.doctrineFile
    - artifact-evidence.md
    - foreign repo
    - lenses.md
  provenance: code-verified
  slug: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
  phase: "authoring-side-verification/phase-2 (Task 2.1 audit finding, D9/PIN-26); RESOLVED in 2026-08-25-authoring-doctrine-and-lint-coherence/phase-3 (Task 3.1, End state 12)"
  tags: 
    - red-team
    - prompt-authoring
    - guard-architecture
    - fail-open
  created: 2026-08-25
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-09-03T09:57:34.167Z
---

# A scope-locked probe's own preamble can forbid the exact external read a new instruction asks for

**Rule:** when a new dispatched-prompt instruction requires a red-team probe to read something
outside its confined repo/target set (a cited issue, a network resource, an external file), a
prompt-body addition alone is not enough if that probe's technique carries a scope-lock preamble.
The scope-lock is composed to override competing instructions in the same prompt (ADR 0033's
defense-in-depth layer). You must also widen the scope-lock's own carve-out clause to name the new
exception. Widening a scope-lock is a reviewed contract change, not a drive-by edit alongside the
new instruction.

**Why:** a probe that reads the lock conservatively declines the external read every time and emits
only the "unverified note" fallback arm, so the new mechanism's primary arm never fires even when
access is available. It fails open and loud (Minor, not a hold), but the deliverable loses its
efficacy.

**Fixed:** `scopeLock()` in `skills/red-team/assets/workflow-scaffold.js` now carries the D14
carve-out on its `analyzed` arm: "EXCEPT: reading a cited issue's `## Evidence artifacts` section
via `gh issue view` when your probe prompt directs it (read-only, this repo's issues only)". This
pairs with the PER-ISSUE EVIDENCE JOIN clause in the `coverage-vs-source` `SPINE` entry.

**Second instance: a doctrine pointer under the plugin root.** A plan made
`skills/war-strategy/references/artifact-evidence.md` the single home for the `rea:` tag grammar, and
the `rea-evidence` and `untrusted-content` rows in `skills/red-team/references/lenses.md` pointed at
it. On a foreign `--repo` that file sits under the plugin root, outside every probe's scope-lock, so
the pointer alone failed. Fixed (ruling #2397): the Lead threads the file's absolute path as
`args.doctrineFile`, and `scopeLock` admits that one file read-only on both techniques. A rejected or
absent path drops the clause, so the read stays forbidden. When a row points at a file under the
plugin root, check that the Lead threads it and the scope-lock admits it; add a new doctrine pointer
the same way, not with a bare row.

**Locate-cue:** `workflow-scaffold.js`: the `scopeLock()` function's `analyzed` arm under the
`D14 carve-out` comment, `doctrineClause`, and the `coverage-vs-source` entry in the `SPINE` array;
`skills/red-team/SKILL.md`, Step 2.

## Related

[[template-defers-runtime-values-to-agent-via-literal-placeholder]] is the same class: the
dispatched prompt is the only surface the probe agent ever reads.
[[agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo]]
covers the card-pointer side.

> archived 2026-10-27: resolved — moved to archive
