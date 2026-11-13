---
name: a-doctrine-change-leaves-glossary-mirrors-stale-and-phase-close-absorbs-may-not-fix-them
description: A doctrine change stales GLOSSARY.md and glossary-cold.md. Put both in the task Files
metadata:
  node_type: memory
  type: project
  keywords:
    - glossary drift
    - GLOSSARY.md
    - glossary-cold.md
    - mirror entry
    - phaseClose absorb
    - straggler
    - same-meaning survey
    - stale definition
  provenance: code-verified
  slug: a-doctrine-change-leaves-glossary-mirrors-stale-and-phase-close-absorbs-may-not-fix-them
  phase: 2026-11-08-pipeline-skills-and-memory-tooling/phase-1
  tags:
    - glossary
    - doc-drift
    - planning
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T04:26:48.118Z
---

**Fact.** Phase 1 changed red-team round law (task 1.1) and the Trials header (task 1.3).
Neither task listed `GLOSSARY.md` or `skills/war/references/glossary-cold.md` in its Files.
Auditors raised the glossary stragglers as `phaseClose` absorb findings.
The late-fix pass fixed only the glossary-cold Route-upstream entry.
At the landed tip two mirrors stay stale:
- the `GLOSSARY.md` Loop budget entry still defines a round with no routed-run exception;
- the glossary-cold `## Trials run block` entry still omits the `budget-check:` header line.
Why those two absorbs did not drain is unknown. That is a hypothesis gap, not a diagnosis.

**How to apply.**
- When a plan changes a defined term, put its `GLOSSARY.md` and glossary-cold entries in that task's Files.
- Do not rely on a phase-close absorb to fix a glossary mirror. Check the tip after land.
- Before acting on the two instances above, re-read both entries. A later phase may have fixed them.

**Locate-cue.** Verify still present before acting: the Loop budget entry in `GLOSSARY.md` and `## Trials run block` in `skills/war/references/glossary-cold.md`. Found @ phase 1, tip 759b2c9e.

Related: [[retired-claim-scan-missed-the-glossary-surface-and-a-backticked-spelling-after-an-adr-amendment]] (archived), [[default-flip-must-audit-all-doc-surfaces]].
