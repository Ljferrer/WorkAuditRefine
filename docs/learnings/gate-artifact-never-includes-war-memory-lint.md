---
name: gate-artifact-never-includes-war-memory-lint
description: "node skills/_shared/war-memory.mjs lint docs/learnings/ is CI-only and never appears in a captured gate log — a plan End state citing it is structurally SOFT cannot-confirm from gate evidence, every time"
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
  relates: 
    - "[[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]]"
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T16:49:46.124Z
---

# `war-memory.mjs lint docs/learnings/` is CI-only — no gate-audit pass can confirm it from the captured artifact

**What (code-verified — confirmed at CLAUDE.md's Commands section, verify still present before
acting):** the repo defines exactly two check surfaces —
`node --test 'skills/**/*.test.mjs'` (plus discovered `*.test.sh` suites) is the **gate** every
refiner dispatch captures into `.war/gate-<taskId>.log`, and
`node skills/_shared/war-memory.mjs lint docs/learnings/` is documented as "exactly what CI runs —
the only thing CI runs" — a **separate**, CI-only invocation that never runs inside the gate
command and is never composed into it by `resolveGate()` (see
[[refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind]] for the sibling fact about
shell-suite discovery — this is a distinct, stronger gap: lint isn't even a `*.test.sh`/`*.test.mjs`
file `resolveGate` could ever discover).

**Consequence, observed twice in one phase's audit log (war-memory-hardening, 2026-07-22/23):** any
plan End state phrased as "`X && node skills/_shared/war-memory.mjs lint docs/learnings/ exits 0`"
is **structurally** a SOFT cannot-confirm from gate-audit evidence alone, every single time —not a
one-off gap in a particular gate run. Both the task-1.2 gate-audit and the phase-1-integrated-tip
gate-audit independently hit this exact pattern (End state 11's lint half) and both correctly
disposed it `note`/SOFT rather than a hold, verifying the redaction-relevant prose by direct
inspection (no home path/email/handle/credential shape) as the fallback.

**Why record it:** a plan author who wants lint enforcement to be **gate-checkable** (not just
CI-checkable) needs to either add it as a floor step or accept every such End state condition will
be routinely SOFT at gate-audit time — this is not something a future implementation can "just fix"
without a deliberate floor/gate wiring change. A future gate-auditor hitting this should go straight
to the SOFT-note disposition rather than spending a round trying to locate lint output in the
captured log.
