---
name: fill-defaults-output-cannot-show-whether-a-config-section-was-set-read-the-raw-file
description: "Once DEFAULTS holds a section, war-config --fill-defaults always prints it, so only the raw file shows presence"
metadata:
  node_type: memory
  type: project
  keywords:
    - fill-defaults
    - fillDefaults
    - deepMerge
    - section absent
    - section present
    - config provenance
    - interview section
    - agents.trial
    - war-config.mjs
    - raw config file
  provenance: code-verified
  slug: fill-defaults-output-cannot-show-whether-a-config-section-was-set-read-the-raw-file
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (tasks 1.1, 1.3)"
  tags:
    - war
    - war-config
    - fork-trials
    - provenance
    - config
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:34:46.947Z
---

# `--fill-defaults` output cannot tell a set config section from an absent one

**The mechanism.** `fillDefaults(partial)` in `skills/war/assets/war-config.mjs` returns
`deepMerge(DEFAULTS, partial)`. The CLI prints that result under `--fill-defaults`. Task 1.3 added
`DEFAULTS.interview` and `DEFAULTS.agents.trial`. After that, every zero-exit output carries both blocks,
whatever the config file holds.

**The defect the audit found.** The first `## Bounds` text in
`skills/war-strategy/references/fork-trials.md` keyed the header case `config: <path> (section present |
absent | unreadable)` on whether the output "carries an `interview` section". The `absent` case could
never fire. The per-key fallback was vacuous. The `agents.trial` tag `(config, or default)` had the same
blind spot. Three seats raised it in round 1 (Minor). Values stayed correct. Only the provenance label
was wrong.

**The fixed rule.** Take the values from the `--fill-defaults` output. Take `present` or `absent` from
the raw file's top-level key. A nonzero exit is `unreadable`. A key that is null in the raw section falls
back per key, because `deepMerge` copies an explicit null through.

**Why it matters.** ADR 0044 accepts a residual: `validate()` has no top-level unknown-key loop. A
misspelled `interview` section passes and the interview falls back to defaults in silence. The header's
`config: (section absent)` is the only tell, and it works only because the raw file is read.

**How to apply.** Any new reader that must know "did the operator set this?" reads the raw file, never
the filled output. The same holds for every future `DEFAULTS` block.

**Locate-cue (verify still present before acting).** `skills/war/assets/war-config.mjs`, search
`export function fillDefaults`. `skills/war-strategy/references/fork-trials.md`, search
`**The live read, fail-open.**`. The audit finding was resolved in a fix round before land, so this
records the pattern, not a live defect. Grounded at the phase-1 integration tip via the `_refinery`
worktree (rung 2).

Related: [[war-config-fill-defaults-resolver-exits-nonzero-on-absent-config]] (the other face: an
absent file exits 1),
[[new-run-config-knob-needs-war-room-whitelist-touch]].
