---
name: tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop
description: "RESOLVED (#992): tightenPlan verdict is now target-aware; warns when currentBytes >= --target too"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop
  phase: lessons-learned-tighten/phase-1 task 1.2 (landed dev/2026-07-21-lessons-learned-tighten)
  created: 2026-07-21
  tags: 
    - memory-system
    - war-memory
    - tighten
    - cli-flags
    - gotcha
  keywords: 
    - tighten-plan
    - "--target"
    - WARN_BYTES
    - preflight
    - verdict
    - buildProjection
    - lessons-learned SKILL
    - advisory line
    - cutGoalBytes
  originSessionId: 7b990932-4f7c-45ba-a050-29d95817432e
  modified: 2026-07-21T21:01:05.485Z
---

# RESOLVED — `tighten-plan --target` never moves the preflight stop condition — only the plan step

**What (as shipped 2026-07-21, superseded by #992 — see below):** `buildProjection`'s `verdict` (`ok`/`warn`/`refuse`, line ~416-418) is computed purely
against the module-level constants `WARN_BYTES` (17,000 B, line 41) and `HARD_BYTES` — it has no
knowledge of `tightenPlan`'s `target` parameter (also defaulted to `WARN_BYTES`, but overridable
via the CLI's `--target` flag, e.g. `skills/_shared/war-memory.mjs` argv handling around line 914).
`/lessons-learned tighten`'s **preflight** step (documented in
`skills/lessons-learned/SKILL.md`, "Preflight") stops the whole pass early on `verdict: "ok"` —
i.e. it stops **exactly** when the live corpus is under the fixed 17,000 B advisory, regardless of
what `--target` was passed.

**The gotcha (as shipped 2026-07-21, superseded by #992 — see below):** pass a custom `--target` *below* 17,000 (e.g. to force a tighter bound), and if the
live corpus sits between that custom target and 17,000 B, the preflight still reads `verdict: "ok"`
and reports "nothing to tighten" — the pass never reaches the **plan** step where `--target` would
actually take effect (shifting `cutGoalBytes`/`cutIndex`/`projectedBytes`). `--target` only changes
*how much* the plan step would strike once triggered, never *whether* the preflight triggers at
all.

**Status:** the SKILL.md prose already partially flags this ("never a `≤ target` reading — the two
diverge at exactly 17,000 B, where render already warns") but does not spell out the
below-17,000-custom-target case explicitly. Adjudicated as out-of-scope/informational at land
(2026-07-21) — the default path (`--target` unset, == `WARN_BYTES`) is fully correct, and a fix
would live in `war-memory.mjs`'s `buildProjection`, not the SKILL doc. Record this before adding
any future feature (a stricter local operator policy, a CI budget check) that assumes `--target`
governs the preflight stop — it doesn't.

*(The paragraph above is left as a provenance-dated historical record of the 2026-07-21
out-of-scope adjudication and the SKILL.md sentence it quotes — see the superseding RESOLVED note
below.)*

## RESOLVED — `tightenPlan` verdict is now target-aware (#992, 2026-07-23)

**Code-verified in this task's rebased worktree** (Task 1.1 landed into the phase-1 integration
tip before this task ran; confirmed at `skills/_shared/war-memory.mjs`, `tightenPlan()`): the gap
this lesson records is closed. `tightenPlan`'s returned `verdict` is no longer `buildProjection`'s
own advisory read passed straight through — it is now the STRICTER of that advisory read and the
effective `--target`: `refuse` passes through unchanged; `warn` now also fires at
`currentBytes >= target` (equivalently, the effective trigger is
`currentBytes >= min(target, WARN_BYTES)`); otherwise `ok`. A custom `--target` below the fixed
17,000 B advisory now actually binds the `/lessons-learned tighten` preflight's stop condition —
the exact gap this lesson names. The default path (`--target` unset ⇒ `WARN_BYTES`) is
byte-identical to the prior behavior, and a target ABOVE the advisory can never suppress the
advisory's own `warn` (the two surfaces never fork, per the spec's D7). `buildProjection` itself is
byte-untouched; `render-index` and `archive --candidates` still read the pure advisory verdict.
(`skills/_shared/war-memory.test.mjs`: `verdict (#992): a sub-advisory --target binds the
trigger; the default target is byte-identical to the projection read`, `verdict (#992): a target
ABOVE the advisory never suppresses the projection warn`.)
