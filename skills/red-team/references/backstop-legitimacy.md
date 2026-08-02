## Backstop-legitimacy check (when a `## Deferred validations (backstops)` section is present)

A backstop is a deliberately-deferred validation the plan promises an external runner will perform later (spec §D8/D9). It is an honesty layer, not an escape hatch — this check keeps it honest. It is an **analyzed** lens: it reads the declared section against the rest of the plan, emits nothing to run. Skip it entirely when the plan has no such section (a legacy pre-ratified-backstop plan) — its absence is the Lead's `null`-backstops concern, not this check's.

For **each** entry in the section (a literal `None` is a valid, complete declaration — pass it):
- **Deferral justified?** The `why deferred` names a concrete reason the check cannot run pre-merge here (e.g. "this repo has no Dockerfile"), not a bare "later" or "TODO". A missing or hand-waving justification → `needsDecision`.
- **No cheaper pre-merge proxy already covers it?** If a deterministic pre-merge gate or floor already exercises part of what is deferred, the deferral is over-broad and must narrow. The load-bearing example: `assert-packaging-in-diff.sh` already covers the **COPY-enumeration half** of a deferred `docker build`, so a plan deferring *all* packaging validation when only the daemon-dependent build actually needs deferring is over-declared → `needsDecision` (recommend narrowing the entry to the daemon-only remainder). Check the plan's own gate + floors before accepting.
- **Runner + timing named?** The entry names *who* runs it and *when* (the external `runner` — e.g. "the first `/war` run on a container-shipping target repo"). A backstop with no runner or no timing is unaccountable → `needsDecision`.

**AI-declared sections** (heading `## Deferred validations (backstops — AI-declared)`, per ADR 0014 provenance): every entry additionally gets one Minor note flagging it for **explicit operator attention** — an AI drafted this waiver and no human has ratified it (recommend the operator review it at the approval gate, or `/war-strategy <plan>` for the human upgrade path). This fires even when the entry is otherwise legitimate.

Findings route the **normal plan-patch loop** (Steps 4–5): `needsDecision` blocks and is grilled one at a time until the entry is justified/narrowed or removed; the AI-declared Minor is auto-noted.
