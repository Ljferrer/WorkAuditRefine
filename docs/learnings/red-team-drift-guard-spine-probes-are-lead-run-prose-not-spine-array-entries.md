---
name: red-team-drift-guard-spine-probes-are-lead-run-prose-not-spine-array-entries
description: "/red-team's two ADR-0025 drift-guard probes are Lead-run SKILL.md prose, not SPINE entries"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: red-team-drift-guard-spine-probes-are-lead-run-prose-not-spine-array-entries
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.7
  keywords: 
    - red-team
    - SPINE array
    - drift-guard probes
    - unguarded-new-mirror
    - default-flip-old-absent
    - workflow-scaffold
    - Lead-run probe
    - backstop-legitimacy check
    - ADR 0025
  tags: 
    - war
    - red-team
    - probe-architecture
    - adr-0025
  files: 
    - skills/red-team/SKILL.md
  relates: 
    - "[[mirror-registry-verification-mode-by-construct-kind]]"
    - "[[default-flip-must-audit-all-doc-surfaces]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# The two drift-guard spine probes are Lead-run doctrine prose, not entries in the scaffold's SPINE array

**Found (code-verified — `skills/red-team/SKILL.md`, "## Drift-guard spine probes (run every
red-team)" section, ~line 44; verify still present before acting):** ADR 0025 requires every
`/red-team` run to check a plan under test for two drift-guard failure modes:
`unguarded-new-mirror` (a new inline mirror lands without a matching mirror-registry row in the
same task) and `default-flip-old-absent` (a default-flip task's gate only asserts NEW-present,
never OLD-absent, across every enumerated doc surface). The SKILL.md text is explicit that
**neither probe is an entry in the scaffold's fixed six-lens `SPINE` array** (`assets/workflow-
scaffold.js`) — "that fixed six-lens engine is owned separately." They instead live "here in
prose," the same way the backstop-legitimacy check does, and the Lead runs them **directly**:
`unguarded-new-mirror` is **analyzed** (grep the plan text for an added-mirror task missing its
registry-row edit — nothing executes); `default-flip-old-absent` is **executed** but routed as "a
bespoke executed probe (add it to the scaffold's bespoke array or `args.probes`) — never by
editing the `SPINE` const."

**Why this matters — the gotcha this guards against:** a future engineer extending red-team's
drift-guard coverage might reflexively look for "the probe list" in `workflow-scaffold.js`'s
`SPINE` array and either fail to find these two probes there (concluding they don't exist) or try
to *add* a third drift-guard probe by editing `SPINE` (which is deliberately reserved for the six
universal lenses, "owned separately"). Both are wrong: the drift-guard doctrine layer is
**intentionally separate** from the SPINE array, mirroring how the backstop-legitimacy check is
also SKILL.md-prose-only and Lead-executed, never a scaffold array entry.

**How to apply:** when auditing or extending `/red-team`'s attack surface, distinguish two
registries: (1) the scaffold's `SPINE` array — the six universal lenses, code-owned, extended by
editing `workflow-scaffold.js`; (2) SKILL.md doctrine-prose probes (backstop-legitimacy,
drift-guard spine probes) — Lead-run-by-instruction, extended by editing `skills/red-team/
SKILL.md` prose, with an EXECUTED probe among them still ultimately routed through the scaffold's
bespoke array/`args.probes` at run time (not the `SPINE` const).
