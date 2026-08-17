---
name: cli-parseargs-valueless-flag-coerces-to-number-true-is-one
description: "RESOLVED (redteam-rounds-config-telemetry Task 1.1, #1367): A hand-rolled CLI parseArgs that maps a trailing valueless flag to boolean `true` silently produces `Number(true) === 1` when a numeric-flag consumer wraps the raw value in `Number(...)` with no shape validation — a plausible-looking wrong value instead of a loud refusal; the repo already has a ratified stronger pattern (three-way typeof-gated refusal, war-memory.mjs) that new numeric CLI flags should copy instead of mirroring the older bare-Number() precedent"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cli-parseargs-valueless-flag-coerces-to-number-true-is-one
  phase: "precision-chain-and-loop-breaker/5.1 (gate-audit follow-up finding, confirmed live at p5-polish landed tip)"
  keywords: 
    - parseArgs
    - valueless flag
    - bare flag boolean true
    - Number(true) === 1
    - NaN JSON.stringify null
    - campaign-ledger.mjs
    - redteamRounds
    - CLI numeric flag validation
    - silent fabrication
    - fail-loud refusal
    - war-memory.mjs three-way typeof gate
    - resolveRoundInput precedent
  tags: 
    - cli
    - gotcha
    - validation
    - war-campaign
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-07T00:16:57.005Z
---

# A bare CLI numeric flag silently records `1`, not an error, on a missing value

## The fact

`skills/war-campaign/assets/campaign-ledger.mjs`'s hand-rolled `parseArgs` (verify still present
before acting — found at `skills/war-campaign/assets/campaign-ledger.mjs` around `function
parseArgs(argv)`, confirmed live at the `2026-08-05-precision-chain-and-loop-breaker` phase-5
landed tip via the `p5-polish` task worktree) maps a trailing flag with no following value (or one
immediately followed by another `--flag`) to boolean `true`:

```js
const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
```

The `record` CLI case then does `update.redteamRounds = Number(args.redteamRounds)` with no shape
check. So `campaign-ledger.mjs record --plan <p> --redteamRounds` (value omitted, e.g. mistakenly
placed last, or immediately followed by another flag) silently stamps `redteamRounds: 1` — a
plausible-looking wrong round count, not a refusal. This value then flows uncorrected into
`/war-campaign`'s wrap-up hardening row and `/war-review`'s per-plan rounds telemetry, both of
which carry an explicit "never fabricate a number" invariant that this coercion quietly violates.
The sibling case — a non-numeric value (`--redteamRounds abc`) — is comparatively benign: it
produces `NaN`, which `JSON.stringify` serializes as `null`, correctly rendering `n/a` downstream.
Only the *missing-value* case fabricates a plausible wrong number.

This exactly mirrors a pre-existing sibling flag one line above it (`--pr`), so the new flag is
precedent-consistent, not a novel regression — but the repo has since ratified a *stronger*
pattern for exactly this shape in a different CLI: `skills/_shared/war-memory.mjs`'s `--target` /
`--top-k` / `--budget` flags (#1059/#1145) use a three-way `typeof`-gated refusal whose first
listed refusal case is verbatim "bare (parseArgv maps a valueless flag to boolean true)" — i.e.
the maintainers of that CLI already named and closed this exact failure mode.

## The durable rule

Any hand-rolled `parseArgs` that maps a valueless trailing flag to boolean `true` will silently
coerce that `true` into `1` wherever a downstream consumer does bare `Number(rawValue)` on a flag
meant to be numeric. When adding a new numeric CLI flag to a module with this `parseArgs` shape,
do not copy an existing bare-`Number()` precedent by proximity — check whether the repo has since
ratified a stricter refusal pattern for the same class of flag (grep sibling CLIs for
`typeof`-gated numeric-flag validation) and copy that instead. A fail-loud refusal (exit non-zero,
name the flag and the offending token) is strictly better than a value that degrades to `n/a` on
one malformed shape (`NaN`) but fabricates a real-looking number on another (bare flag).

## When auditing

Grep the module's `parseArgs` for the `: true` fallback shape, then grep every consumer of a flag
declared numeric for a bare `Number(args.<flag>)` with no `/^\d+$/`-or-equivalent guard before it.
Flag it Minor/follow-up (not a hold) when the flag is display-only telemetry with a downstream
n/a-never-fabricated honesty invariant already in place — the fabricated value is wrong but bounded
to a diagnostic row, not a control-flow decision.

> archived 2026-08-15: resolved — moved to archive
