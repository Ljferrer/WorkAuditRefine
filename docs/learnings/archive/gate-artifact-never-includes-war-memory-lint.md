---
name: gate-artifact-never-includes-war-memory-lint
description: "MITIGATED (#1081): to get a check into the captured gate artifact, ask what the gate already discovers; a discovered war-memory-lint.test.sh wrapper now runs the CI-only lint inside every gate"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-artifact-never-includes-war-memory-lint
  phase: "war-memory-hardening/phase-1 tasks 1.2 + phase-1-integrated-tip gate-audit (2026-07-22/23); MITIGATED gate-evidence-and-release-integrity/phase-1 task 1.1 (#1081, landed dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26)"
  created: 2026-07-23
  tags:
    - gate-audit
    - gate-evidence
    - war-memory
    - lint
    - evidence-standard
  keywords:
    - war-memory.mjs lint
    - docs/learnings lint
    - CI-only command
    - gate log
    - node --test
    - SOFT cannot-confirm
    - redaction lint
    - captured gate artifact
    - End state unverifiable
    - war-memory-lint.test.sh
    - gate-discovered wrapper
    - zero engine change
    - resolveGate untouched
  relates:
    - "[[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]]"
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-26T22:55:03.475Z
---

# `war-memory.mjs lint docs/learnings/` WAS CI-only — MITIGATED (#1081) by a gate-discovered wrapper

**Rule:** when a check must reach the captured gate artifact, first ask what the gate already
discovers. A `*.test.sh` wrapper beside a CLI turns it into gate evidence with zero engine change.

**MITIGATED (#1081, 2026-07-26) — read this first:** `skills/_shared/war-memory-lint.test.sh` now
runs the same lint over `docs/learnings/` as an ordinary discovered `*.test.sh` suite, so the gate's
own `-name '*.test.sh'` sweep executes it and the captured `.war/gate-<taskId>.log` carries its
`== gate(bash): … ==` banner. An End state citing the redaction lint is therefore CONFIRMABLE from
gate evidence on any tip carrying that wrapper. The wrapper also fails LOUD (exit 2) when its target
directory is absent or unreadable, so a moved or renamed `docs/learnings/` cannot make the evidence
vacuous. CI (`.github/workflows/memory-audit.yml`) stays the post-push backstop for lessons that
reach a PR without passing a WAR gate.

**History, in short:** `node skills/_shared/war-memory.mjs lint docs/learnings/` was documented as
"exactly what CI runs — the only thing CI runs", a separate invocation outside the gate command.
`resolveGate()` never composes it and could never discover it (it is not a `*.test.sh`/`*.test.mjs`
file; compare [[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]]). So any End
state phrased as "`X && node skills/_shared/war-memory.mjs lint docs/learnings/ exits 0`" was
structurally a SOFT cannot-confirm from gate-audit evidence. Two gate-audits in one phase hit it and
correctly disposed it `note`/SOFT, checking the redaction-relevant prose by direct inspection.
A floor step and a composer change were both considered and rejected; the discovered wrapper closed
it while `resolveGate` and its hand-mirrored copies stayed byte-untouched.

**How to apply:** on a tip that PREDATES the wrapper, a gate-auditor goes straight to the SOFT-note
disposition rather than hunting for lint output in the captured log. On any later tip, grep the log
for the wrapper's `gate(bash)` banner instead.

**Residual, recorded not fixed:** the wrapper's default `TARGET` is absolute, so a lint hit's
file/pattern line renders with a home path in the captured gate log rather than the CI's
repo-relative form — see
[[d3-locate-cue-paths-must-be-repo-relative-or-placeholder-not-absolute-home-path]] for the general
rule this collides with. (A former second residual — `cmdLint` non-recursive, `docs/learnings/archive/`
out of scope — was closed by #1135: the lint walk is now recursive.)

> archived 2026-08-30: resolved — moved to archive
