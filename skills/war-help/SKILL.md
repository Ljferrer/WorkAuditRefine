---
name: war-help
description: Print the WAR orientation card — what WAR is, the command set (/war-strategy → /war-room → /red-team → /war → /war-campaign, the /war-survey-corps → /war-machine → /war-campaign → /war-aftermath pipeline, plus /lessons-learned), the five roles, how a run flows, and prerequisites — with links into the full docs. Use when the user is new to WAR, seems confused about it, or asks "what is WAR" / "how do I run WAR" / "how does this work".
---

# /war-help — the orientation card

You print a short orientation card, then stop. You never decompose a plan, spawn agents, or write files — that's every other WAR skill. This card is a map into the real docs, not a restatement of them: every factual claim below is a link, not a summary. Full detail lives in [`../../README.md`](../../README.md) and [`../war/references/design.md`](../war/references/design.md).

## The card

**1. One-liner.** WAR = **W**ork·**A**udit·**R**efine — a phase-gated, multi-agent executor for a multi-phase implementation plan. See [`../../README.md`](../../README.md#what-it-does).

**2. Commands.**

| Command | Does |
|---|---|
| `/war-strategy` | author a WAR-shaped spec/plan/roadmap ([`../../README.md`](../../README.md#author-a-plan-war-strategy)) |
| `/war-room` | configure a run ([`../../README.md`](../../README.md#configure-a-run-war-room)) |
| `/red-team` | harden a plan before execution ([`../../README.md`](../../README.md#harden-a-plan-red-team)) |
| `/war` | execute a plan ([`../../README.md`](../../README.md#go-to-war-war)) |
| `/war-survey-corps` | sweep open issues into war-shaped specs ([`../../README.md`](../../README.md#turn-issues-into-specs-war-survey-corps)) |
| `/war-machine` | convert specs to plans + a roadmap, hand off to the campaign ([`../../README.md`](../../README.md#turn-specs-into-plans-war-machine)) |
| `/war-campaign` | run a queue of plans unattended — **never auto-invokes** ([`../../README.md`](../../README.md#run-a-campaign-war-campaign)) |
| `/war-aftermath` | evidence-gated post-campaign cleanup — **never auto-invokes** ([`../../README.md`](../../README.md#clean-up-war-aftermath)) |
| `/lessons-learned` | tidy captured memory ([`../../README.md`](../../README.md#tidy-the-memory-lessons-learned)) |
| `/war-help` | this card |

**3. Roles** — one line each, detail in [`../../README.md`](../../README.md#roles--gas-town-lineage): **Lead** (decomposes, dispatches, adjudicates) · **Worker** (implements one task in its own worktree) · **Auditor** (reads-only, votes on a task) · **Refiner** (serial merge queue, lands each phase) · **Servitor** (write-scoped, captures learnings).

**4. How a run flows** — 5 beats: decompose+approve → work → audit → refine+land per phase → one PR. See [`../../README.md`](../../README.md#go-to-war-war).

**5. Prerequisites** — a clean working tree, `gh` authenticated, and a gate command WAR can detect or you can supply. See [`../../README.md`](../../README.md#install).

**6. Go deeper.**
- "How does auditing work in detail?" → [`../war/references/design.md`](../war/references/design.md).
- "How do I run a hopper of plans in one chat?" → `/war-campaign`.
- "What do the roles hand off to each other?" → [`../war/references/design.md`](../war/references/design.md).

Ready to write a plan? Run `/war-strategy`.
