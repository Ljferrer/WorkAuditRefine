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

**The conflict.** Plan guardrail G9 puts the `rea:` tag grammar in `skills/war-strategy/references/artifact-evidence.md` only. Other surfaces point at it. The `rea-evidence` and `untrusted-content` rows in `skills/red-team/references/lenses.md` do that. The `untrusted-content` row says the grammar is "never restated here".

**The lock.** Every probe opens with a scope-lock. The analyzed arm limits reads to paths under `${repo}` plus the plan and spec. The executed arm says not to read any file outside `${repo}`. Task 1.6 added exactly two carve-outs: `gh issue view` (analyzed, older) and the declared target artifact path (`artifactCarveOut`, both arms).

**The gap (inferred, not run).** When `--repo` is a foreign repo, the doctrine home sits under the plugin root, outside the lock. The probe cannot open the grammar it was told to use. It judges tag shape from the plan and from text inlined in the row. That inlined list partly restates the doctrine home's cite-only rule, with no guard. It has already drifted from the home's wording.

**Status at land.** Two seats raised it as an `ask` at two pins (barrier trade-off). The phase landed with the shape unchanged. The phase-1 audit log holds no ruling. Check the Checkpoint outcome and the current row text before acting. The two options named:
- The Lead threads the plugin file's absolute path, the scope-lock gains an EXCEPT clause for it, and the inlined list shrinks to a pointer.
- Accept it. The advisory lint rule carries the strict grammar check (G5), so the loss is one sub-check.

**Rule.** A plan may make a doctrine file the single home and tell a scope-locked probe to read it. In the same task, widen that probe's carve-out. Or inline the text with a guard. A pointer alone fails on a foreign repo.

**Locate-cue (verify still present before acting).** `skills/red-team/references/lenses.md`, the `rea-evidence` and `untrusted-content` rows; `skills/red-team/assets/workflow-scaffold.js`, `scopeLock` and `artifactCarveOut`. Found at landed tip 4e33b6db.

**Related.** [[analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires]] is the same class, resolved there with an EXCEPT clause. [[agent-card-reference-pointer-is-repo-relative-and-wont-resolve-against-a-foreign-target-repo]] covers the card-pointer side.
