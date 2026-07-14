---
name: doc-truth-sweep-must-check-presets-not-just-defaults
description: "Doc-truth sweep: check PRESETS not just DEFAULTS"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - PRESETS
    - DEFAULTS
    - war-config.mjs
    - preset drift
    - doc-truth sweep
    - thorough preset
    - model literal
    - effort literal
    - stale prose
    - config defaults
  provenance: code-verified
  slug: doc-truth-sweep-must-check-presets-not-just-defaults
  phase: doc-rot-remediation/phase-1-t1
  tags: 
    - doc-rot
    - war-config
    - drift
  created: 2026-07-06
  originSessionId: 07592cb8-18cb-48ae-ba5f-dc73f910f768
---

# A "current defaults" doc-truth sweep must check both `DEFAULTS` and `PRESETS.<name>`

**Rule:** `skills/war/assets/war-config.mjs` has two independent sources of role-model truth: the `DEFAULTS.agents` block and each `PRESETS[name].agents` partial (deep-merged over `DEFAULTS` by `presetConfig()`). A doc-truth pass that only re-verifies `DEFAULTS` prose can leave preset-specific literals stale — they drift on their own schedule.

**Caught instance (doc-rot-remediation phase-1 t1, design.md §8):** prose claimed the `thorough` preset runs "opus/`max` workers". Actual code (verified at `skills/war/assets/war-config.mjs`, `PRESETS.thorough.agents.worker`):

```js
thorough: {
  profile: 'thorough',
  agents: {
    worker:   { model: 'fable', effort: 'max' },
    auditor:  { model: 'opus',  effort: 'max' },
    servitor: { model: 'opus',  effort: 'default' },
  },
  ...
}
```

`worker` is `fable`/`max`, not `opus`/`max` — `opus` only appears on `thorough.auditor` and `thorough.servitor`. The doc's End-state #1 target was the `DEFAULTS` role-model prose (which was correct); the `PRESETS.thorough` literal drifted independently and was missed by that same sweep.

**How to apply:** when a plan/task says "verify current defaults" or "doc-truth sweep the config prose," grep BOTH `export const DEFAULTS` and `export const PRESETS` in `war-config.mjs` and diff every named preset's `agents.<role>.{model,effort}` against the prose claim — do not assume `DEFAULTS` coverage implies preset coverage.

Related: [[default-flip-must-audit-all-doc-surfaces]], [[stacked-release-plan-version-literal-lags-operator-target]], [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]]
