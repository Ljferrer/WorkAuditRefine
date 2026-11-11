---
name: a-new-config-key-the-engine-reads-from-args-does-nothing-unless-every-lead-args-list-names-it
description: A new config key the engine reads from args stays silently off unless every Lead args list names it
metadata:
  node_type: memory
  type: project
  keywords:
    - args threading
    - config key
    - routing
    - silently ignored
    - Lead args assembly
    - SKILL.md Setup
    - fill-defaults
    - resume rebuild
  provenance: code-verified
  slug: a-new-config-key-the-engine-reads-from-args-does-nothing-unless-every-lead-args-list-names-it
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-4
  tags:
    - config
    - args
    - doc-drift
    - workflow-template
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T03:15:13.927Z
---

The Workflow engine reads config only from its args, so a new config section needs a Lead-side threading rule.

Phase 4 added `routing`, which the engine reads as `A.routing` and the args floor reads as `args.routing.opusFloor`.

The Lead-facing args lists named only `agents`, `audit` and `run`, so a Lead that followed the prose never set `args.routing`.

The failure is silent: an absent key is the byte-identical fallback (PIN-14), so the operator's switch just does nothing.

Three seats raised the gap across tasks 4.1, 4.2 and the late-fix pass, each at a different surface.

The late fix added `routing` to `skills/war/references/schemas.md` and to relaunch check (a) in `skills/war/references/resume-and-recovery.md`.

The thread rule also lives as the first bullet of `skills/war/references/model-routing.md`.

`skills/war/SKILL.md` `## Setup` step 1 still lists only `agents`, `audit`, `run` and `overrides` at the landed tip, because the plan fenced SKILL.md to one pointer.

That pointer fires only when the Lead stamps a class or worker tier, so a config with only `routing.sampleOpusReview` or `routing.opusFloor` may stay unrouted.

Rule for the next new args-read config section: in the same task, name the key in every args-assembly surface. These are SKILL.md Setup, the per-phase launch paragraph, schemas.md and the resume args rebuild.

`fillDefaults` in `skills/war/assets/war-config.mjs` passes a set key through, so no engine change is needed for the threading itself.

Related: [[default-flip-must-audit-all-doc-surfaces]], [[fill-defaults-output-cannot-show-whether-a-config-section-was-set-read-the-raw-file]].

Locate-cue: verify still present before acting. Found at `skills/war/SKILL.md` (Setup step 1, "resolved config supplies") and `skills/war/references/model-routing.md` @ phase 4 landed tip 7dfb8b69, read via the run-scoped `_refinery` worktree at that HEAD.
