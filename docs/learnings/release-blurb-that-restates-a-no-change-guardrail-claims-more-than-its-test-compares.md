---
name: release-blurb-that-restates-a-no-change-guardrail-claims-more-than-its-test-compares
description: "A release blurb that restates a plan's no-change guardrail overclaims unless it names the test's comparator and the plan's intended changes"
metadata:
  node_type: memory
  type: project
  keywords:
    - release blurb
    - byte-identical guarantee
    - absent config key
    - no change for config
    - PIN-14 guardrail
    - CHANGELOG README Status twin
    - comparator scope
    - intended unconditional change
  provenance: agent-unverified
  slug: release-blurb-that-restates-a-no-change-guardrail-claims-more-than-its-test-compares
  phase: "2026-11-08-model-routing-and-prompt-byte-budgets/phase-6 (Release, task 6.1)"
  tags:
    - release
    - prose-precision
    - audit-finding
    - readme-status
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T07:14:46.706Z
---

# A blurb's "no change for an unset config" claim must match what the test compares

**Status.** The instance was fixed in three in-task audit rounds before land. This file records the pattern, not a live instance.

**Instance.** The 0.21.44 blurb said "a config that sets none of the new keys gets byte-identical prompts and spawn options". The plan's binding guardrail (PIN-14) covered only an absent `routing`, `agents.refiner.provision` or `agents.refiner.evidence` key. The guardrail's test compares rendered prompts with the old helpers swapped in, not against the prior release.

**Why it was false.** The same release made changes that reach every config. Examples: the fix-prompt byte cut, the relays moved to the helper, an unstamped all-`*.md` task now spawns the base worker, and the provision script now named by its plugin path. The plan itself listed some of these as intended changes.

**Why it took three rounds.** Each fix narrowed one clause and left a new overclaim. Round 2 named one helper (`spawn(<role>)`) where the test swaps three (`spawn`, `spawnWorker`, `spawnSeat`). Round 3 caught "every budget is proven" when only the file rows get the derivation check.

**Rules.**
1. Before a blurb restates a guardrail, read the guardrail's test and name its comparator in the blurb.
2. List every change the plan says applies with no config key set. A "nothing changes" sentence that skips them is false against the prior release.
3. Check absolute words ("every", "proven", "both") against each row or arm the test actually covers.

Topology note: the landed tip 94f59ec5 had no live worktree, and the servitor cwd was master at 37eb1b90. The blurb text was not read at the tip, so this lesson stays agent-unverified.

Related: [[release-blurb-that-restates-a-code-comment-inherits-its-overclaim]] (same family, the source is a code comment), [[release-blurb-overstates-guard-semantics]], [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (the bare "both" count sub-shape).
