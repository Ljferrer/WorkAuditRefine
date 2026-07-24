---
name: tighten-target-flag-has-three-independent-silent-degradation-paths
description: "cmdTightenPlan's `argv.target ? Number(argv.target) : WARN_BYTES` plus a bash-only ${VAR:+...} fence give --target three distinct silent fallback-to-default paths, now load-bearing since #992 made target govern the verdict trigger"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: tighten-target-flag-has-three-independent-silent-degradation-paths
  phase: war-memory-hardening/phase-1 task 1.1 (landed dev/2026-07-22-war-memory-hardening)
  created: 2026-07-23
  tags: 
    - war-memory
    - tighten
    - cli-flags
    - argv-parsing
    - shell-portability
  keywords: 
    - tighten-plan
    - "--target"
    - cmdTightenPlan
    - argv.target
    - Number(true)
    - NaN target
    - bare flag
    - truthy ternary
    - TIGHTEN_TARGET
    - word splitting
    - zsh SH_WORD_SPLIT
    - bash fence
    - WARN_BYTES fallback
    - silent default
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T16:49:30.530Z
---

# `tighten-plan --target` has three independent ways to silently collapse back to the default

**What (code-verified — found at `skills/_shared/war-memory.mjs`, `cmdTightenPlan`, ~line 951; verify
still present before acting):** `const target = argv.target ? Number(argv.target) : WARN_BYTES;`.
Since #992 (this same phase) made `tightenPlan`'s returned `verdict` the stricter of the projection
advisory read and `currentBytes >= target`, this line is now load-bearing for the preflight's stop
condition, not just the cut-goal math — and it has three distinct silent-fallback failure modes,
none of which raise a diagnostic:

1. **Non-numeric value** (`--target abc`) → `Number('abc')` is `NaN` → `currentBytes >= NaN` is
   always `false` → verdict silently falls back to the pure advisory read (17,000 B), exactly as if
   `--target` had never been passed.
2. **Bare flag, no value** (`--target` at end of argv, or followed by another `--flag`) → the
   CLI's `parseArgv` maps a valueless flag to boolean `true` → `Number(true) === 1` →
   `currentBytes >= 1` is always `true` → verdict is **always** `'warn'`, which pre-selects the
   entire eligible list as the default strike-list in the SKILL's step-3 UI. This is the opposite
   failure direction from (1): silently *more* aggressive, not silently inert.
3. **Shell-dialect word-splitting**, at the doc layer: `skills/lessons-learned/SKILL.md`'s step-1
   fence threads the flag as `${TIGHTEN_TARGET:+--target "$TIGHTEN_TARGET"}` inside a ` ```bash `
   block. Bash splits the `:+` replacement text into two argv words as expected; **zsh does not**
   (no `SH_WORD_SPLIT` by default), so under zsh the same line collapses to one argv token and the
   flag is dropped entirely — same silent outcome as never setting `$TIGHTEN_TARGET`.

**Why this matters:** all three degrade toward one of two silent states (default 17,000 B advisory,
or the "verdict always warn" pre-select) with zero diagnostic — an operator who typos `--target`
gets a plausible-looking result that is not the bound they asked for. Failure direction is always
fail-safe (never a false "nothing to tighten" when the corpus genuinely needs work, since case 2's
failure mode over-triggers rather than under-triggers) — this is informational for hardening, not a
live incident.

**Fix if ever picked up (deliberately NOT done in this task — the plan slice froze `cmdTightenPlan`'s
code):** `const t = Number(argv.target); const target = Number.isFinite(t) && t > 0 ? t : WARN_BYTES;`
plus a test asserting a bare `--target` falls back to `WARN_BYTES` rather than `1`. The
`$TIGHTEN_TARGET` shell issue has a cheap escape already in the SKILL prose (substitute the literal
byte figure instead of relying on the variable).

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (same phase, same
task family — process-evidence discipline this task also relied on).
