---
name: gate-artifact-never-includes-war-memory-lint
description: "MITIGATED (#1081): lint was CI-only — every End state citing it read SOFT from gate evidence; the discovered wrapper war-memory-lint.test.sh now runs it inside every gate"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-artifact-never-includes-war-memory-lint
  phase: war-memory-hardening/phase-1 tasks 1.2 + phase-1-integrated-tip gate-audit (2026-07-22/23)
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
  relates: 
    - "[[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]]"
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T16:49:46.124Z
---

# `war-memory.mjs lint docs/learnings/` WAS CI-only — MITIGATED (#1081) by a gate-discovered wrapper

**MITIGATED (#1081, 2026-07-26) — read this first:** `skills/_shared/war-memory-lint.test.sh` now
runs the same lint over `docs/learnings/` as an ordinary discovered `*.test.sh` suite, so the gate's
own `-name '*.test.sh'` sweep executes it and the captured `.war/gate-<taskId>.log` carries its
`== gate(bash): … ==` banner. An End state citing the redaction lint is therefore CONFIRMABLE from
gate evidence on any tip carrying that wrapper — do NOT reach for the SOFT-note disposition below
without first checking whether the wrapper is present in the checked-out tree. The wrapper also
fails LOUD (exit 2) when its target directory is absent, so a moved or renamed `docs/learnings/`
cannot make the evidence vacuous. CI (`.github/workflows/memory-audit.yml`) stays the post-push
backstop for lessons that reach a PR without passing a WAR gate. Everything below is the
HISTORICAL record of the gap and why it mattered.

**What (code-verified at the time — confirmed at CLAUDE.md's Commands section):** the repo defined
exactly two check surfaces —
`node --test 'skills/**/*.test.mjs'` (plus discovered `*.test.sh` suites) is the **gate** every
refiner dispatch captures into `.war/gate-<taskId>.log`, and
`node skills/_shared/war-memory.mjs lint docs/learnings/` was documented as "exactly what CI runs —
the only thing CI runs" — a **separate**, CI-only invocation that never ran inside the gate
command and is still never composed into it by `resolveGate()` (the mitigation rode discovery, not
the composer; see
[[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]] for the sibling fact about
shell-suite discovery — this is a distinct, stronger gap: lint isn't even a `*.test.sh`/`*.test.mjs`
file `resolveGate` could ever discover).

**Consequence, observed twice in one phase's audit log (war-memory-hardening, 2026-07-22/23):** any
plan End state phrased as "`X && node skills/_shared/war-memory.mjs lint docs/learnings/ exits 0`"
was **structurally** a SOFT cannot-confirm from gate-audit evidence alone, every single time — not a
one-off gap in a particular gate run. Both the task-1.2 gate-audit and the phase-1-integrated-tip
gate-audit independently hit this exact pattern (End state 11's lint half) and both correctly
disposed it `note`/SOFT rather than a hold, verifying the redaction-relevant prose by direct
inspection (no home path/email/handle/credential shape) as the fallback.

**Why it still matters (the shape of the fix):** the gap was real but the remedy was neither a floor
step nor a composer change — both were considered and rejected. What closed it was a
**gate-discovered** `*.test.sh` beside the CLI: the gate already self-discovers those, so a lint the
gate could not see became gate evidence with **zero** engine change (`resolveGate` and its
hand-mirrored copies stayed byte-untouched). Generalise that, not the CI-only fact: when a check
must reach the captured artifact, first ask what the gate already discovers. A gate-auditor working
a tip that PREDATES the wrapper should still go straight to the SOFT-note disposition rather than
hunting for lint output in the captured log; on any later tip, grep the log for the wrapper's
`gate(bash)` banner instead.
