---
name: tighten-target-flag-has-three-independent-silent-degradation-paths
description: "RESOLVED (memory-tooling-hardening/1.1+1.2, #1059 + #1088) at Phase-1 land: --target's two CLI silent-fallback paths now refuse loud (task 1.1) and the bash-only ${VAR:+...} fence is rewritten dialect-safe (task 1.2); cmdTightenPlan's `argv.target ? Number(argv.target) : WARN_BYTES` ternary plus that fence gave --target three distinct silent fallback-to-default paths, load-bearing since #992 made target govern the verdict trigger"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: tighten-target-flag-has-three-independent-silent-degradation-paths
  phase: "war-memory-hardening/phase-1 task 1.1 (landed dev/2026-07-22-war-memory-hardening); RESOLVED memory-tooling-hardening/phase-1 tasks 1.1+1.2 (landed dev/2026-07-24-memory-tooling-hardening, 2026-07-26)"
  created: 2026-07-23
  updated: 2026-07-26
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
    - RESOLVED
    - refuse loud
    - exit 1
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-27T03:51:36.467Z
  promoted: dev/2026-07-22-war-memory-hardening@phase-1
---

**Local recurrence copy** of the repo-root lesson at
`docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md` (same slug) —
the repo copy is not directly editable by a servitor (D1), so this file carries the original content
plus the `## RESOLVED` section below; a future Gate-2 promotion of this file overwrites the same-slug
repo file.

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

**Historical "fix if ever picked up" paragraph — SUPERSEDED, see `## RESOLVED` below.** (Originally:
"deliberately NOT done in this task ... `const t = Number(argv.target); const target =
Number.isFinite(t) && t > 0 ? t : WARN_BYTES;` plus a test asserting a bare `--target` falls back to
`WARN_BYTES`." That prescription is exactly the bare-`Number()` shape the real fix avoids —
`Number(true) === 1` still passes `isFinite && t > 0`, so it would NOT have closed failure mode 2. Do
not follow it.)

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (same phase, same
task family — process-evidence discipline this task also relied on).

## RESOLVED (memory-tooling-hardening/1.1 + 1.2, #1059 + #1088, landed dev/2026-07-24-memory-tooling-hardening 2026-07-26)

**Failure modes 1+2 (code-verified — found at `skills/_shared/war-memory.mjs`, `cmdTightenPlan`,
lines 952-971; verify still present before acting):** the ternary is replaced with a three-way
`typeof`-gated resolution at the argv boundary, deliberately kept OUT of the shared `parseArgv` (its
bare-flag→`true` mapping stays load-bearing for `archive --candidates`):

```js
let target = WARN_BYTES; // flag absent -> the advisory default (unchanged path)
if (argv.target !== undefined) {
  const t = typeof argv.target === 'string' ? Number(argv.target) : NaN;
  if (Number.isFinite(t) && t > 0) {
    target = t;
  } else {
    process.stderr.write(`war-memory tighten-plan: --target requires a positive byte count (got '${argv.target}')\n`);
    process.exit(1);
  }
}
```

The `typeof argv.target === 'string'` guard is the load-bearing piece: a bare flag makes `parseArgv`
hand back boolean `true`, and `typeof true === 'string'` is false, so `t` is forced to `NaN` and the
refusal branch fires — `Number(true) === 1` never gets a chance to pass `isFinite && > 0`. A supplied
non-numeric/zero/negative token refuses the same way (exit 1, stderr names the received token,
mirroring the existing `requireLocal` refusal idiom). Absent flag still takes `WARN_BYTES`
byte-identically.

**Failure mode 3 (shell dialect) — code-verified:** `skills/lessons-learned/SKILL.md`'s step-1 fence
no longer threads `${TIGHTEN_TARGET:+...}` at all; `TIGHTEN_TARGET` is retired doc-wide. The
rewritten fence carries both invocation variants (a flagged `--target <bytes>` line with a
substitution instruction, and a bare line) with prose directing the agent to run exactly one line —
no `${VAR:+...}`-shaped token remains anywhere in the file (doc-contract absence lock covers the
broadened `\$\{[^}]*:\+` shape, not just the narrower `:+--` literal that motivated the fix).

**Residual, deliberately not closed:** `--target=2000` (`=`-attached) is still silently ignored —
`parseArgv` only recognizes space-separated flag values, so `--target=2000` becomes the key
`target=2000` with value `true` and `argv.target` stays `undefined`, silently taking the 17,000 B
default. This is a CLI-wide `parseArgv` property (`--local=/x` behaves the same) that the plan's
Method explicitly froze as a shared blast-radius fence — not reopened by this fix. If ever closed, do
it at `cmdTightenPlan`'s own boundary (e.g. also refuse when any argv key starts with `target=`),
never by widening `parseArgv`.

**Not yet extended to siblings:** `cmdQuery`'s `--top-k`/`--budget` resolve via the identical
pre-fix truthy-ternary shape (`argv['top-k'] ? Number(...) : DEFAULT_TOP_K`, same for `budget`) at
`skills/_shared/war-memory.mjs` lines 703-704 — this task's Method deliberately bound the fix to
`cmdTightenPlan`'s boundary only ("bind each fix at its own boundary, never a shared one") and did
not extend it to `cmdQuery`. See [[cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape]]
for the standalone gotcha and its failure-direction difference (NaN `--top-k` empties the seat
prefetch instead of over-selecting).
