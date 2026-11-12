## Backstop-legitimacy check (when a `## Deferred validations (backstops)` section is present)

A backstop is a deliberately-deferred validation the plan promises an external runner will perform later (spec §D8/D9). It is an honesty layer, not an escape hatch, and this check keeps it honest. It is an **analyzed** lens. It reads the declared section against the rest of the plan and emits nothing to run. Skip it entirely when the plan has no such section (a legacy pre-ratified-backstop plan). Its absence is the Lead's `null`-backstops concern, not this check's.

For **each** entry in the section (a literal `None` is a valid, complete declaration — pass it):
- **Deferral justified?** The `why deferred` names a concrete reason the check cannot run pre-merge here, for example "this repo has no Dockerfile". A bare "later" or "TODO" is not a reason. A missing or hand-waving justification → `needsDecision`.
- **No cheaper pre-merge proxy already covers it?** If a deterministic pre-merge gate or floor already exercises part of what is deferred, the deferral is over-broad and must narrow. The load-bearing example: `assert-packaging-in-diff.sh` already covers the **COPY-enumeration half** of a deferred `docker build`. Only the daemon-dependent build actually needs deferring. So a plan that defers *all* packaging validation is over-declared → `needsDecision` (recommend narrowing the entry to the daemon-only remainder). Check the plan's own gate + floors before accepting.
- **Runner + timing named?** The entry names *who* runs it and *when*. That is the external `runner`, for example "the first `/war` run on a container-shipping target repo". A backstop with no runner or no timing is unaccountable → `needsDecision`.

**AI-declared sections** (heading `## Deferred validations (backstops — AI-declared)`, per ADR 0014 provenance): every entry also gets one Minor note flagging it for **explicit operator attention**. An AI drafted this waiver and no human has ratified it. Recommend the operator review it at the approval gate, or `/war-strategy <plan>` for the human upgrade path. This fires even when the entry is otherwise legitimate.

Findings route the **normal plan-patch loop** (Steps 4–5). `needsDecision` blocks and is grilled one at a time until the entry is justified/narrowed or removed. The AI-declared Minor is auto-noted.

## `judge:`-tag grading rule (the spec-§8 box-ticking mitigation)

A merged plan's tagged End states (and backstop entries) close with one of three tags. It may be a `check:` command that proves the condition, or a `gate:` or `backstop:` tag. It may also be a `judge:` / `HARD at audit_sha` tag: a named seat judges an observable instead of a command proving it. The judged form is legitimate only when no command can decide the condition. For **each** End state or backstop entry carrying a `judge:` or `HARD at audit_sha` tag, grade: **could this have been a `check:` command?** — a deterministic command, test, or grep a gate/floor could run.

- **Commandable-but-judged → `needsDecision`**: recommend converting the entry to a `check:` command. The exception is a plan that names a concrete reason no command can decide it. For example, the evidence is deliberately-uncommitted done-report evidence, or the observable is a sandbox probe no committed command reproduces.
- A justified judged entry passes. The grading exists to catch box-ticking (a tag pasted on to skip authoring the command), never to outlaw judgment.

This rule runs whenever the tags appear. That includes a backstops section that is a literal `None`, or absent entirely, since the tags live in the End states too. Findings route the normal plan-patch loop (Steps 4–5), like the checks above.
