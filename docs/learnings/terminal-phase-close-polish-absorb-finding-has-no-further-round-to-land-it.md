---
name: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
description: "RESOLVED (2026-09-04): a last-round polish absorb once had no pass to drain it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-08-06-handoff-schemas-contract@phase-2
  slug: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
  phase: 2026-08-05-precision-chain-and-loop-breaker/6.1
  keywords: 
    - phase-close
    - polish
    - absorb
    - phaseClose true
    - unresolved finding
    - release phase
    - CLAUDE.md drift
    - done-unmet
    - queue drain
    - last round
    - autoFixable not applied
    - recurring finding not fixed
    - escape guard header
    - assert-no-repo-escape.sh
    - disposition follow-up not absorb
    - mitigation confirmed
    - terminal polish disposition routing
    - mitigation not applied
    - polish-rejected
    - polish-discarded
    - env-died schemas.md gap
    - Homes list
    - Status blurb
    - note disposition
    - mitigation not learned
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-17T17:06:54.300Z
---

# A terminal phase-close polish task's own absorb finding can ship unfixed

**RESOLVED (2026-09-04 terminal pass, ADR 0012 cross-reference).** After the polish merge, a one-hop terminal pass now lands the polish panel's absorbs as one `Ace-Charge` commit plus one re-audit seat. On the final phase, an absorb it cannot land demotes as `demote:terminal-pass`. See the "Terminal pass" entry in `GLOSSARY.md` and the Sweeps bullet in `skills/war/SKILL.md`. The cited live instances (the `CLAUDE.md` floor-route list and the `assert-no-repo-escape.sh` header) are fixed at master.

**The old gap.** A polish task's gate-audit can raise fresh findings against the polish diff itself. If that polish round was the phase's last, an `absorb, phaseClose: true` finding had no further round to land it. It shipped unfixed even when tagged `autoFixable: true` and raised by several seats.

**Instances (2026-08).** Four runs hit it. In one, the same `assert-no-repo-escape.sh` header finding was raised three times and still shipped unfixed. Seats that cited this lesson routed the finding `follow-up` or `note`; others did not, so the mitigation held per seat, not per run.

**Two more shapes.** A polish round can fix the headline file while sibling glossary, schema or ADR surfaces stating the same rule ship stale, even with `verdict: approve`. In a multi-round polish task, each round can raise findings against the prior round's diff, and only the last round's own findings had no rescue.

**Why:** a disposition tag is a routing intent, not proof of a fix.

**How to apply:** verify each `phaseClose: true` finding by reading the file at the landed tip, never by its disposition tag. If a finding lands as `demote:terminal-pass`, treat it as an open follow-up.

Related: [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]], [[readme-status-blurb-homes-list-is-editorial-not-exhaustive]].
