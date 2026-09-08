---
name: war-help
description: Explain WAR's available Codex planning skills, optional Snipe auditing, and the boundary between authoring plans and executing them. Print orientation and stop.
---

# WAR orientation for Codex

Print a short orientation card using the capability map below, then stop. Do not
write files, dispatch an auditor/verifier, install anything, or run a campaign.
Help requires no clean Git state, GitHub authentication, or execution gate.

- WAR means Work·Audit·Refine. The maintained [project overview](https://github.com/Ljferrer/WorkAuditRefine/blob/codex-port/README.md)
  describes the wider system; its Claude commands are not proof of Codex availability.
- This planning package supplies `$work-audit-refine-planning:war-strategy` for an
  interview or draft conversion into a merged decision record and phased plan,
  plus `$work-audit-refine-planning:war-help` for this card. Strategy can write the
  requested plan; it does not execute it. See the [packaged strategy](../war-strategy/SKILL.md).
- `$work-audit-refine-snipe:snipe` is a separate optional read-only audit plugin,
  not included here. Offer its invocation only if the host exposes it as installed
  or the operator confirms it. Otherwise say it is separately available; absence
  is not a broken planning installation. Do not scan private caches to infer status.
- `war-room`, `red-team`, `war`, `war-campaign`, `war-machine`, `survey-corps`,
  `aftermath` and `lessons-learned` are not supplied as Codex commands by this
  package. Wider [roles and execution mechanics](https://github.com/Ljferrer/WorkAuditRefine/blob/codex-port/skills/war/references/design.md)
  are background, not an invocation path. Authoring a plan neither certifies the
  current engine nor grants authority to run it.

End with the planning invocation if the user wants to author a plan. Do not start
the interview as a side effect of asking for help.
