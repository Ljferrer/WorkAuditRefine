# WAR clean-handoff — commander's intent, disposition routing, dep-wave visibility, and the phase-close coherence sweep

**Status:** proposed — Commander's Intent confirmed by the operator (2026-07-02, per the ADR 0013
authorship doctrine). Companion ADRs:
[`0012`](../adr/0012-intra-phase-visibility-and-phase-close-sweep.md),
[`0013`](../adr/0013-commanders-intent-and-disposition-routing.md).

## Commander's Intent

- **Purpose:** every WAR phase must hand the next phase a tip whose quality debt is **zero or enumerated and
  intentional** — auditors exist to get gaps *addressed before proceeding*, not to file homework. Follow-up
  issues become affirmative, justified acts; mechanical polish is absorbed in-phase; agents get licensed
  judgment instead of plan literalism.
- **Method:** give every judgment point (worker, auditor, ace, gate-audit, servitor) the operator's intent as
  its ceiling and the plan slice as its floor; route findings by auditor-owned *disposition* instead of
  severity alone; make declared `deps` grant real code visibility at wave dispatch; add one fail-open
  phase-close polish pass at the *integrated* tip where per-task machinery structurally cannot reach.
  Keep every existing HARD gate (unanimous audit, Critical/Major block, serial merge queue, push-first CAS).
- **End state** (each condition individually checkable — §10 maps them to tests):
  1. A phase can land with **zero unrouted findings**: every Minor/Nit is absorbed (commit SHA), filed
     (issue # + why-not-absorbable), or noted (phase report) — nothing defaults into an issue.
  2. A task may declare `deps` on a sibling and its worker **sees the merged dep content** before writing.
  3. A README/doc absorb-class nit is **fixable in-phase** under `--ace` (routed, not refused).
  4. Intent-consistent work beyond the literal plan slice is **approve**, not `request_changes`.
  5. The phase checkpoint carries a machine-readable **handoff block** the next phase's decompose reads.
  6. The reference run's 9-nit litter class replays as ≤ 2 justified follow-up issues.

## 1. Context — the gap

The v0.9.0 companion-skills run (epics #416/#417) landed 5/5 tasks with zero escalations — and still
exported **9 residual Minor/Nit findings as issue-litter** (#422). Post-mortem
(2026-07-01, operator + 3-angle design panel over the live code) traced all of it to two structural gaps:

- **WAR is plan-faithful but purpose-blind.** No artifact encodes *why* the plan exists or what *done* looks
  like, so every layer defaults to literalism: an auditor correctly refused an obviously-good test widening
  because the plan-faithfulness lens gave it only the literal slice to judge against ("the plan did not
  authorize"); the ace path could not absorb a one-word README alignment because the orchestrator's only
  enforceable judgment is a filename regex (`aceEligible`, `workflow-template.js`) that refuses `README.md`
  wholesale; and severity is the only routing signal, so every non-blocking observation becomes a
  `war-followup` issue (`minorsOf → minorsFiled`, Minor/Nit → issue per `references/schemas.md`).
- **No moment judges the *integrated* phase.** All task worktrees are cut at ONE captured tip in the
  Provision barrier (`TIP="$(git rev-parse …)"`, template Provision step 3) and nothing re-pins at dispatch;
  merged sibling content is invisible until the next phase. T1 (`/war-help`) could not link to T4's README
  sections because T4 hadn't merged when T1 was written *and audited* — and no later pass existed to stitch
  the seam. Sequencing (deps/waves) exists but orders only *when* a worker runs, never *what base it sees*.

Throughout this spec, quoted mechanics — the three-file `aceEligible` regex, the landed code-boundary
rule's "dependency ⇒ phase edge", Minor/Nit → issue routing — describe the **current** code at v0.9.0;
everything in §4 is **proposed** change.

MCDP 1's definition is the fix's organizing idea: intent exists "to allow subordinates to exercise judgment
and initiative — to depart from the original plan when the unforeseen occurs — in a way that is consistent
with higher commanders' aims."

## 2. Pivotal constraints

- The Workflow orchestrator has **no filesystem access** — its checks are string-level only; all
  file-content judgment must live in an agent that reads code (the auditor).
- The Lead never edits code; auditors are read-only; the **refiner owns all merges**, serially.
- Never merge un-audited, never with an open Critical/Major; unanimous-on-one-SHA stands.
- **Ace never converts a mergeable task into a hold** (forward-revert); the sweep inherits this as
  discard-on-reject — polish may only improve the tip.
- **Never-reset-on-reuse** (provision-worktrees.sh): un-merged commits survive resume; no script-side branch
  resets.
- Frozen phase base stays **HARD for same-wave parallel tasks** (comparable audits, reproducible bases);
  visibility changes apply only to tasks that *declare* `deps`.
- Standing-instruction (.md) and dispatched-prompt surfaces are independent and both load-bearing — every
  auditor-behavior change edits **both in the same commit** (memory:
  `standing-instruction-vs-dispatched-prompt-coverage-split`).
- Phases land as one `--no-ff` commit via push-first CAS; the land path's shape is untouched.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where does intent live? | Required `## Commander's Intent` section **in the plan file** (Purpose / Method / End state); travels with the order, zero new discovery plumbing. |
| Who authors it? | **Staff may draft; the commander confirms.** Operator approval at the gate is what makes it authoritative (provenance `user-confirmed`), not operator keystrokes — see ADR 0013 for the combat-vs-SaaS rationale. |
| Missing intent? | Interactive: Lead asks at the approval gate and transcribes. `--afk`: run degrades to today's literal behavior (`intent = null`) — never Lead-invented. `/red-team` flags the absence as a Minor. |
| End-state form | Numbered conditions, each **individually checkable** (a grep/test/diff could confirm it). Uncheckable conditions are a red-team finding. |
| Ace filename backstop | Narrowed to the two pure version-slot JSONs: `/(?:plugin\.json\|marketplace\.json)$/`. The regex's meaning flips from *whether* a nit is fixed to *where*: README/shared-file absorb findings route to the **phase-close queue** instead of being refused. |
| Version-number safety | Three layers regardless of path: ace/sweep prompt slot-prohibition, mandatory panel re-audit at the new SHA, forward-revert/discard. Slot JSONs keep the hard string refusal on top. |
| Finding routing | New auditor-owned field `disposition ∈ absorb \| follow-up \| note`, orthogonal to severity. Defaults when omitted: **Minor → follow-up, Nit → note**; `absorb` is never a default. `follow-up` must state why it is not absorbable. Legacy `autoFixable:true` reads as `absorb` for one release. |
| Cross-task/shared-file absorbs | Auditor sets `phaseClose: true` on an absorb finding whose fix needs the integrated tip (dangling sibling reference) or touches a shared/slot-adjacent file; the orchestrator routes those (and regex-refused files) to `phaseCloseQueue`. |
| Dep visibility | **Dependency ⇒ wave edge** (doctrine change from "phase edge"). A `deps`-bearing task's worker prompt begins with `git -C <worktree> rebase <integrationBranch>` — worktrees share one repo's refs, the dep content is already merged locally, and a first-dispatch branch has zero commits so the rebase is a pure fast-forward. No script change; conflict on resume → `status:blocked` → existing escalation. |
| Referential seams | **Phase-close coherence sweep**, not sequencing: one `_polish` worktree cut at the *integrated* tip (existing `ensure-worktree`), one worker driven by `phaseCloseQueue` + intent, full panel re-audit at the polish SHA, refiner merges or **discards**. |
| End-state verification | Threaded into the existing post-merge gate-audit pass: a condition **provably unmet** by the landed content at the confirmed tip is HARD (holds the land, existing `escalated` path); anything short of provable is a SOFT note — mirrors the pass's provably-unrun/SOFT split. |
| Handoff contract | The Workflow return gains a `handoff` block; the checkpoint renders it; the next phase's decompose gate reads it (§4.6). |
| Red-team | New `intent-vs-plan` spine lens: conditions checkable, mapped to claiming phases, collectively sufficient for the Purpose; absent section → Minor note recommending the intent interview. |

## 4. Mechanics

### 4.1 Intent authoring and threading
`/war-strategy`'s plan template gains the required `## Commander's Intent` section (Purpose / Method /
numbered checkable End state) and an **interview beat**: the skill drafts *only from operator answers*,
echoes the block back, and requires explicit confirmation before the plan is complete — it may draft, it may
not invent silently. At `/war`'s decompose gate the **Lead extracts the section verbatim** (the Lead reads
files; the orchestrator cannot) and threads it as `args.intent` (string). Consumers: worker dispatch
("use it to resolve ambiguity in your slice; intent-consistent deviation is in-band — note it in your
result"), `auditPrompt`, the ace/sweep dispatches, the gate-audit pass, and the servitor wrap-up.

### 4.2 Auditor: intent ceiling + disposition
`auditPrompt()` (template) and `agents/war-auditor.md` (standing, same commit) gain:
- **Latitude rule:** "the plan slice is the floor, the Commander's Intent is the ceiling — work beyond the
  literal slice that serves the intent is APPROVE (judged on its own correctness), never a plan-faithfulness
  violation; only deviations that contradict the intent or the slice block."
- **Disposition rule:** every Minor/Nit carries `disposition`: `absorb` (mechanical, intent-consistent, safe
  to fix this phase; set `phaseClose:true` when the fix needs the integrated tip or a shared file),
  `follow-up` (substantive work beyond this phase — MUST state why it is neither absorbable nor a note),
  `note` (informational; report + servitor feed, never an issue).
- Schema: `AUDIT_VERDICT` findings gain `disposition`, `phaseClose`, and formalize `autoFixable`
  (deprecated alias for `disposition:'absorb'`, honored one release). Severity remains schema-required
  (a finding without severity is rejected at parse time); only `disposition` is optional, with the defaults
  above. Both auditor surfaces — `war-auditor.md` and the dispatched `auditPrompt()` — change in ONE task
  and ONE commit (§2 sync constraint).

### 4.3 Ace routing (per-task, unchanged scope for clean cases)
In the approve branch, the aceable filter becomes: absorb-disposition findings where
`!phaseClose && !/(?:plugin\.json|marketplace\.json)$/.test(f.file)` → per-task ace exactly as today
(single commit, re-audit, forward-revert). Absorb findings failing that test push to
`const phaseCloseQueue = []` (declared beside `aced`) instead of falling through to `minorsFiled`.
`minorsFiled` receives only `follow-up` findings; a new `notes` array receives `note` findings.

### 4.4 Dep-wave visibility
When `(task.deps || []).length > 0`, the worker dispatch prompt prepends: dependencies are already merged
into the integration branch; FIRST ACTION `git -C <worktree> rebase <integrationBranch>`; on conflict
(possible only on resume-with-commits) return `status:blocked` with the conflict files. Dep-less tasks are
untouched — they keep the frozen phase base. The audit three-dot diff and merge-time rebase are unaffected
(the merge-base simply sits nearer the tip). `/war-strategy`'s code-boundary rule consequence 2 is rewritten:
"add X" + "call X from Y" = one phase, two waves via `deps`; phase edges remain for what must be *landed*
first (cross-repo, release phases).

### 4.5 Phase-close coherence sweep
Inserted between the post-merge gate-audit pass and the Land block, **only when the phase would otherwise
land** (`landDecision === 'landed'` precondition) **and** `phaseCloseQueue.length > 0`:
1. Refiner dispatch: `ensure-worktree <worktreeRoot>/<runId>/_polish war/<slug>/p<N>-polish "$(git rev-parse
   <integrationBranch>)"` — existing subcommand, cut at the **post-merge integrated tip**.
2. One war-worker dispatch in `_polish`: the queue's findings verbatim + the intent + the merged tasks' plan
   slices; instructions — fix ONLY the queued findings, never touch version-number literals, ONE commit,
   gate green. **Discovery model (queue-only):** a *referential seam* — an anchor, heading, link target, or
   symbol that one merged task defines and another merged task references, dangling or wrong at the
   integrated tip — reaches the sweep **exclusively as an auditor-flagged finding**
   (`disposition:'absorb'`, `phaseClose:true`); audit-time discovery is the mechanism (the reference run's
   auditors flagged exactly this class: "linking now would dangle"). The sweep worker performs **no ad-hoc
   seam hunting** — the bounded, enumerated scope is what makes discard-on-reject a sufficient guard.
3. Full `auditRound` panel re-audit at the polish SHA (same unanimity rules).
4. Re-approved → refiner merges the polish branch into the integration branch (serial queue's tail) and the
   land proceeds on the polished tip. Anything else → the polish branch is **discarded** (never merged, no
   revert needed — it never entered the integration branch) and the pre-polish tip lands exactly as it would
   have. Queue findings from a discarded sweep downgrade to `follow-up` (filed) so they stay routed.
5. **Timing and accounting.** The post-merge gate-audit pass runs at the **pre-polish** tip and produces the
   would-land decision; the sweep follows immediately, with no re-gate in between (the polish merge-task
   re-runs the gate itself, and the land step re-runs it again, both as today). There is **no second land
   decision** — a merged polish only moves which tip the single land uses. The sweep is recorded in the run
   ledger as a task-grade entry (`p<N>-polish`, merge SHA) and its branch registered in the run's owned-refs
   ledger exactly like a task branch, so resume reconciliation (classes A/B/C) maps the polish commit to a
   known entry instead of class-C-halting on a foreign commit.

### 4.6 Handoff contract and block
A phase is a **clean handoff** iff: (1) every task accounted (landed/escalated/dep-blocked — existing
sweep); (2) zero open Critical/Major (existing); (3) every finding at a terminal disposition —
absorbed@SHA, issue#, or note (fail-safe: dispositionless → its severity default); (4) gate green at the
final tip with uncurated evidence (existing gate-audit); (5) no End-state condition claimed by this phase
provably unmet (HARD via existing `escalated`; softer = SOFT note); (6) sweep fail-open honored.
Return gains `handoff: { tipSha: string, polish: 'merged'|'discarded'|'skipped',
absorbed: [{ sha, findings: [title] }], followUps: [{ issue, reason }], notes: [{ task, title }],
endState: [{condition, status: 'met'|'unmet'|'deferred'|'out-of-scope'}], intentPresent: boolean }`
(canonical shapes live in `references/schemas.md`). The checkpoint renders it; the next phase's decompose
gate reads the ledger copy.

### 4.7 Red-team lens
`references/lenses.md` spine gains `intent-vs-plan` (analyzed): each End-state condition individually
checkable (else Major), mapped to ≥1 claiming phase (else Major), collectively sufficient for the Purpose
(else Major `needsDecision`); no `## Commander's Intent` section → lens passes with a Minor note.

### 4.8 Servitor
Wrap-up input gains the `notes` array and the handoff block — notes are explicitly *memory candidates,
not issues*.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | `aceEligible` narrowed; `phaseCloseQueue` + `notes`; disposition routing at the `minorsFiled` push site; dep-rebase clause in worker dispatch; sweep stage (§4.5); intent threading into 5 prompts; return shape + `handoff` block. |
| `skills/war/agents/war-auditor.md` | Latitude rule + disposition rule (same commit as the dispatched-prompt change). |
| `skills/war/SKILL.md` | Decompose-gate intent extraction/ask; disposition prose replacing "Minor/Nit → follow-up issues"; checkpoint handoff block; invariants addendum (sweep fail-open). |
| `skills/war/references/schemas.md` | Finding `disposition`/`phaseClose`; args `intent`; return `handoff`/`notes`. |
| `skills/war/references/design.md` | Frozen-base scope note (same-wave only); sweep + disposition sections. |
| `skills/war-strategy/SKILL.md` + structure test | Template `## Commander's Intent` section; interview beat; code-boundary rule consequence 2 rewrite + referential-coupling paragraph; test asserts the new headings. |
| `skills/red-team/references/lenses.md` | `intent-vs-plan` spine lens. |
| `docs/adr/0012-…`, `docs/adr/0013-…` | New ADRs (this spec §7). |
| `CONTEXT.md` | New terms (§6). |
| `skills/war/assets/workflow-template.test.mjs` (+ siblings) | §10 criteria tests. |

**Decomposition note (code-boundary):** all `workflow-template.js` changes land as **one task** — the
disposition routing, `phaseCloseQueue`, sweep stage, and `handoff` block are one coupled data flow, and
splitting them across parallel tasks would violate file-disjointness and create non-working intermediate
states. `war-auditor.md` + the dispatched `auditPrompt()` change ride that same task (single-commit sync,
§2). `war-strategy` (template + rule + structure test), the red-team lens, and the docs surfaces
(schemas.md/design.md/SKILL.md prose, ADRs, CONTEXT.md) are each their own file-disjoint task.

## 6. New domain terms (CONTEXT.md)

**Commander's Intent** (Purpose/Method/End state, staff-drafted commander-confirmed), **Disposition**
(absorb/follow-up/note), **Phase-close coherence sweep** (`_polish`), **Clean handoff**, **Dep-wave
visibility**, **Intent ceiling / plan floor**.

## 7. Recommended ADRs

- **0012 — Intra-phase visibility and the phase-close coherence sweep** (branching-topology semantics).
- **0013 — Commander's intent and disposition routing** (judgment routing; authorship doctrine).
Drafted alongside this spec; both `proposed` until the implementing plan lands.

## 8. Open risks / implementation notes

- **Intent quality is now load-bearing.** Vague Purpose or uncheckable End state makes gates mushier.
  Mitigations: checkability rule at authoring, red-team `intent-vs-plan` lens before any run, Method bounds
  on latitude, `intent = null` degrading to today's behavior.
- **Sweep over-reach**: bounded by queue-only prompt, panel re-audit, discard-on-reject; worst case is a
  wasted worker, never a bad land.
- **Note-default burying debt**: notes still surface in the phase report and servitor feed; Minor defaults
  to follow-up, so only Nits quiet down.
- **Dispatch-rebase on resume** can conflict earlier than today's merge-time conflict — strictly cheaper;
  worker must return `blocked`, never resolve.
- **Migration window**: `autoFixable` honored as `absorb` for one release, then removed from prompts and
  schema.
- The sweep commit is attributed like an ace commit (findings cited in the message, D3-style) — no new
  issue class.

## 9. Non-goals / deferred

- No `repin-worktree` script subcommand, no script-side resets (never-reset-on-reuse stands).
- No re-pin for dep-less tasks; the frozen base for same-wave parallelism is untouched.
- No campaign-level intent inheritance (`/war-campaign` plans each carry their own) — revisit after one
  live campaign under this design.
- No auto-merge of follow-up issues into future plans; `/war-strategy`'s closing offer already covers
  clustering open issues.
- No new agent roles; the sweep reuses war-worker/war-auditor/war-refiner.

## 10. Validation criteria (concrete, testable)

All criteria verify the **post-implementation** state — they are the implementing plan's proof
obligations, runnable at its gate. "Template unit test" = `skills/war/assets/workflow-template.test.mjs`.

| # | Criterion | Proof |
|---|---|---|
| 1 | `aceEligible` (or successor `aceNow`) refuses exactly `plugin.json`/`marketplace.json`; a `README.md` absorb finding is **not** refused — it routes to `phaseCloseQueue` | template unit test |
| 2 | An absorb finding with `phaseClose:true` or a slot-file path lands in `phaseCloseQueue`, not `minorsFiled` | template unit test |
| 3 | Disposition defaults: omitted+Minor → `minorsFiled`; omitted+Nit → `notes`; `absorb` never defaulted; legacy `autoFixable:true` → absorb | template unit test |
| 4 | Worker dispatch prompt contains the rebase-first clause iff `task.deps.length > 0` | template string test |
| 5 | Sweep dispatch occurs iff would-land ∧ queue non-empty; discarded polish → pre-polish tip lands, queue findings re-filed as follow-up | template unit test |
| 6 | Return `handoff` carries `polish ∈ merged\|discarded\|skipped`, `endState[]`, `absorbed:[{sha,findings}]`, `followUps:[{issue,reason}]`, `notes:[{task,title}]`, `intentPresent:boolean` (§4.6 shapes) | template unit test |
| 7 | war-strategy SKILL.md contains `## Commander's Intent` template section + interview beat; structure test goes RED when either heading is deleted | structure test + temp-break |
| 8 | `war-auditor.md` and `auditPrompt()` both contain the latitude rule and disposition rule (single-commit sync) | one gate-discovered test asserting both surfaces (new assertion in the template unit test file) |
| 9 | `lenses.md` spine includes `intent-vs-plan`; plans lacking the section yield Minor, never Major | lens text assert + red-team dry run |
| 10 | `args.intent` absent ⇒ prompts carry no intent block and behavior is byte-compatible with today | template unit test |
| 11 | Gate-audit end-state check, three cases: provably-unmet at the **confirmed** tip → HARD; tip-unconfirmable or condition-unverifiable → SOFT; condition owned by a later phase → `out-of-scope`, never a hold | template unit test (three cases) |
| 12 | Replay yardstick: each of Appendix A's 9 reference findings maps to exactly one disposition; totals = 3 absorbed + 2 noted + 4 findings collapsing to 2 follow-up issues | Appendix A (co-located, checkable at spec time) |

## Appendix A — replay of the v0.9.0 residuals (#422) under the new taxonomy

| # | Finding (task) | Sev | Disposition | Routed to |
|---|---|---|---|---|
| 1 | war-help rows lack links to sibling README sections (t1) | Nit | absorb + `phaseClose` (targets dangled until T4 merged) | sweep commit |
| 2 | roles deep-link points at stale design.md naming (t1) | Nit | absorb + `phaseClose` | sweep commit |
| 3 | structure test guards 3 of 5 sections (t2) | Nit | note (deliberate plan scope; under the intent ceiling the worker guards all 5 up front) | report + servitor |
| 4 | CLI `record` drops `stopPoint` (t3) | Minor | follow-up ("thin CLI wiring + new test — beyond phase scope") | issue, shared with #6 |
| 5 | temp-break-proof test is a tautology (t3) | Nit | follow-up (test deletion/rewrite is never absorb) | issue, shared with #7 |
| 6 | CLI `record` writes `undefined` pr / no `--stopPoint` (t3) | Nit | follow-up — same root cause as #4 | issue, shared with #4 |
| 7 | same tautology, second seat (t3) | Minor | follow-up — same defect as #5 | issue, shared with #5 |
| 8 | interrupt test simulates crash weakly (t3) | Nit | note (honestly commented; covers the invariant) | report + servitor |
| 9 | README `--afk` vs `--afk --ace` (t4) | Nit | absorb + `phaseClose` (README = shared, slot-adjacent file) | sweep commit |

Totals: **3 absorbed** (1, 2, 9) · **2 noted** (3, 8) · **4 follow-up findings → 2 issues** (4+6, 5+7).
Meets Commander's-Intent End state 6: ≤ 2 justified follow-up issues; ≥ 5 absorbed/noted.
