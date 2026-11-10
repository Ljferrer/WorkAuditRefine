---
name: tighten-target-flag-has-three-independent-silent-degradation-paths
description: "RESOLVED (#1059, #1088, #1145): a numeric CLI flag read as `argv.x ? Number(argv.x) : DEFAULT` silently degrades on a bare flag or a bad value, so resolve it with a typeof-gated check at its own boundary that refuses loud (exit 1)"
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
    - WARN_BYTES fallback
    - silent default
    - RESOLVED
    - refuse loud
    - exit 1
    - cmdQuery
    - "--top-k"
    - "--budget"
    - preflight
    - verdict
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-28T01:04:10.806Z
---

# `tighten-plan --target` had three independent silent fallback-to-default paths — RESOLVED

**The rule:** a numeric CLI flag resolved as `argv.x ? Number(argv.x) : DEFAULT` degrades silently
on a bare flag or a bad value. Resolve it with a `typeof`-gated check at the command's own
boundary, and refuse loud (stderr diagnostic, exit 1) on anything that is not a positive number.

**History:** before #992, the `/lessons-learned tighten` preflight stop ignored `--target` and read
the fixed 17,000 B `WARN_BYTES`. #992 made `--target` govern the verdict trigger, so the parse line
became load-bearing.

**The three original failure modes** (all diagnostic-free and fail-safe in direction — never a false
"nothing to tighten"):
(1) non-numeric `--target abc` → `NaN` comparison always false → silent fall back to the 17,000 B
advisory; (2) bare `--target` → `parseArgv` yields boolean `true` → `Number(true) === 1` → verdict
always `'warn'`, silently pre-selecting the entire eligible strike-list (over-aggressive, the
opposite direction from 1); (3) a shell-dialect problem in `skills/lessons-learned/SKILL.md`'s
fence, where zsh fused flag and value into one argv word. The shell kernel of mode 3 now lives in
the zsh-colon-modifiers-and-unsplit-expansions-break-agent-run-shell lesson.

## RESOLVED (memory-tooling-hardening/1.1 + 1.2, #1059 + #1088, landed dev/2026-07-24-memory-tooling-hardening 2026-07-26)

**Modes 1+2 (code-verified at `skills/_shared/war-memory.mjs`, `cmdTightenPlan`):** the truthy
ternary is replaced with a three-way `typeof`-gated resolution at the argv boundary:

```js
let target = WARN_BYTES; // flag absent -> the advisory default (unchanged path)
if (argv.target !== undefined) {
  const t = typeof argv.target === 'string' ? Number(argv.target) : NaN;
  if (Number.isFinite(t) && t > 0) target = t;
  else { /* exit 1; stderr names the received token, mirroring the requireLocal refusal idiom */ }
}
```

The `typeof argv.target === 'string'` guard is the load-bearing piece: a bare flag's boolean
`true` is forced to `NaN`, so `Number(true) === 1` never reaches `isFinite && > 0` — a bare
`Number()` rewrite would NOT have closed mode 2. Non-numeric/zero/negative tokens refuse the
same loud way (exit 1). The fix is deliberately kept OUT of the shared `parseArgv` — its
bare-flag→`true` mapping stays load-bearing for `archive --candidates`.

**Mode 3 (code-verified):** the SKILL.md fence no longer threads `${TIGHTEN_TARGET:+...}`;
`TIGHTEN_TARGET` is retired doc-wide, with a doc-contract absence lock covering the broadened
`\$\{[^}]*:\+` shape, not just the narrower `:+--` literal.

**Residual, deliberately frozen:** `--target=2000` (`=`-attached) is still silently ignored —
`parseArgv` only recognizes space-separated values, so `argv.target` stays `undefined` and the
17,000 B default applies. This is a CLI-wide `parseArgv` property the plan's Method explicitly
froze as a shared blast-radius fence. If ever closed, do it at `cmdTightenPlan`'s own boundary
(e.g. refuse any argv key starting with `target=`), never by widening `parseArgv`.

**Extended to siblings (war-memory-cli-correctness/1.1, #1145):** `cmdQuery`'s `--top-k`/`--budget`
now carry the same three-way `typeof`-gated resolution described above for `--target` — a shape
copy at `cmdQuery`'s own boundary, not a shared helper (`parseArgv` stays frozen). Their failure
direction was the opposite of `--target`'s: a bare `--top-k` had silently selected ONE lesson, and
a `NaN` `--top-k` reached `selectForBudget`'s `slice(0, topK)` and silently emptied the seat
prefetch block, with no signal to the seat. Covered by the `refusal (#1145)` parameterized cases in
`war-memory.test.mjs` (bare, non-numeric, zero, negative, crossed with `--top-k`/`--budget`) plus
the no-query-log-on-refusal assertion. See
[[tighten-target-flag-has-three-independent-silent-degradation-paths]].

**How to apply:** when closing a silent-coercion flag, grep sibling flags in the same file for the
identical `arg ? Number(arg) : DEFAULT` shape before calling the class closed.

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (same phase, same
task family — process-evidence discipline this task also relied on).

> archived 2026-07-27: resolved — moved to archive
