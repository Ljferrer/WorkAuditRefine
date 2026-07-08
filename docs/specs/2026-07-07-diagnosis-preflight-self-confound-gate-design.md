# Diagnosis pre-flight — a self-confound gate before attributing a failure to a systemic bug

**Issues addressed: #575**
**Builds on sibling spec:** [`docs/specs/2026-07-07-target-repo-agnostic-execution-design.md`](2026-07-07-target-repo-agnostic-execution-design.md) — that group makes WAR execution target-repo-agnostic (live validation against external mutable systems becomes routine, which is exactly where the incident behind #575 occurred), and it also edits `skills/war/SKILL.md`. This spec adds one line to that same file, so its plan carries a **landing-order edge** on the sibling's plan (land after it; see §8) rather than merging the groups — the mechanisms are disjoint (standing-instruction prose here, gate/floor/provision code there).

## 1. Context — the gap / problem

WAR institutionalizes adversarial verification of what agents **build**: auditors judge a pinned SHA under distinct lenses, `/red-team` proves plan claims in throwaway sandboxes ("a `fail` requires reproduced evidence"). Nothing applies the same rigor to what agents **conclude about failures**.

The incident behind #575 (agent-filed after a real self-induced misdiagnosis): operating as a Lead doing live validation, the agent's own manual bring-up plus a back-to-back automated pipeline bring-up tore down a cluster; the agent attributed the failure to a systemic coordination bug, **wrote a durable memory asserting it, and fanned out sub-agents drafting a fix plan** — before reading the raw logs that proved there was no bug. The agent had even flagged the real cause (its own double bring-up) as an early caveat, then overwrote that correct hypothesis with a more elaborate wrong one. The correct diagnosis emerged only by luck.

The generalizable failure mode, in the issue's terms: observer effect ignored (own mutating actions not ruled out first), premature hypothesis promotion (memory writes, fix plans, sub-agent fan-out before primary-evidence proof), confirmation fit (ambiguous evidence bent to the pet theory), and abandonment of a correct early hypothesis for a more interesting systemic story.

**Verified against the current tree (2026-07-07):** no observer-effect, self-confound, disconfirmation, or diagnosis-pre-flight language exists anywhere in `skills/`, `agents/`, `docs/adr/`, or `docs/learnings/`. `skills/red-team/SKILL.md`'s sections are Run / Steps / Backstop-legitimacy check / Invariants — its adversarial machinery points entirely **outward** at the plan under test. The only partial mitigation is the ADR 0007 provenance ladder, which ranks `agent-unverified` lessons lowest **at recall** — it bounds the blast radius of a wrong memory but gates neither the write itself nor the fix-plan fan-out.

The fix is a **self-confound gate**: the existing red-team refute discipline, aimed inward, as standing-instruction prose on the four surfaces where WAR agents diagnose failures.

## 2. Pivotal constraints

1. **Prose-only.** No gate, floor, hook, or Workflow-template code changes — that is the group boundary with the sibling target-repo-agnostic spec, whose mechanisms are code. The one enforcement artifact is a text-scan structure test (existing repo pattern: `skills/red-team/manifest-provenance.test.sh`, `skills/war-machine/war-pipeline-structure.test.sh`).
2. **Standing agent files are self-contained at runtime.** A worker never reads `skills/red-team/SKILL.md` mid-task; a cross-file "see the gate over there" reference carries nothing. Every surface's clause must stand alone.
3. **Never verbatim-mirror the gate across surfaces.** Lesson `verbatim-mirror-directive-context-mismatch-at-destination`: copied env-specific prose is wrong-context at the destination. Each surface gets a condensed clause tailored to what *that* role diagnoses, sharing only the ratified term "self-confound gate" as the greppable anchor.
4. **`skills/war/SKILL.md` is contended.** The sibling spec also edits it. Per the roadmap-scale shared-file-contention rule, the two plans take a strict landing order — never same-phase parallel tasks on that file. This spec's footprint there is deliberately **one bullet**.
5. **Prompt directives are not code-enforced.** Lesson `red-team-env-gap-warn-is-agent-directive-not-code-enforced`: a standing instruction constrains a well-behaved agent, nothing more. The structure test guards clause *presence*, not compliance — an accepted residual (§8).
6. **Existing text-scan tests grep the same files.** `manifest-provenance.test.sh` asserts strings in `skills/red-team/SKILL.md`; `war-pipeline-structure.test.sh` asserts strings in `skills/war/SKILL.md` and `skills/red-team/references/lenses.md`. Additions must not disturb the strings they assert.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|---|---|
| D1 | Canonical home of the full four-part gate | New `## Diagnosis pre-flight (self-confound gate)` section in `skills/red-team/SKILL.md`, between the Backstop-legitimacy check and the Invariants. Red-team already owns the adversarial-verification doctrine ("prove, don't assert"); the gate is that doctrine aimed inward. Rejected: a new standalone skill (nothing dispatches it; unreachable prose) and `references/lenses.md` as home (lenses are probe machinery, not Lead doctrine). |
| D2 | How the other three surfaces carry it | Condensed, context-tailored, self-contained clauses — each containing the literal term **"self-confound gate"** so a repo grep connects all four surfaces. Never a verbatim mirror (constraint 3). |
| D3 | What "hypothesis promotion" enumerates | Exactly the four WAR durable-artifact channels from the incident: a memory/lesson write, a `war-followup` issue, a fix plan or spec, a sub-agent fan-out. A closed list — vague "durable artifacts" invites prose-waiver drift. |
| D4 | Enforcement mechanism | Standing-instruction prose + **one** new text-scan test (`skills/red-team/diagnosis-preflight.test.sh`, bash-3.2-safe, cwd-independent, per repo convention) asserting the clause is present on all four surfaces. No hook/floor code (constraints 1, 5). |
| D5 | `skills/war/SKILL.md` footprint | Exactly one bullet appended to `## Invariants (never violate)` — the Lead's hard-rule list, and the smallest possible collision surface with the sibling spec. Rejected: a Checkpoint-section paragraph (bigger footprint, and the gate applies during live validation generally, not only between phases). |
| D6 | Worker surface placement | Extend the existing `## Stop and escalate instead of guessing` section in `agents/war-worker.md` (that section already governs the worker's blame-assignment moment). **No `workflow-template.js` dispatched-prompt mirror**: the clause is task-agnostic, and the standing agent file reaches every spawned worker — the standing/dispatched split (lesson `standing-instruction-vs-dispatched-prompt-coverage-split`) requires mirroring only for per-dispatch content. |
| D7 | `references/lenses.md` placement | One sentence extending the existing confirm-stage rule in `## Safety` ("A `fail` needs reproduced evidence; unreproduced findings are downgraded"): the adversarial confirm also asks the inward question — is this fail an artifact of the probe's own actions? The confirm stage is where a probe fail is already adjudicated, so the inward check rides existing machinery instead of adding a probe. |
| D8 | Mid-diagnosis persistence | A hypothesis that must survive compaction is recorded in the ledger / phase report as an explicitly-labeled **hypothesis**, never as a memory lesson — the memory write *is* the promotion the gate exists to block. (Complements, does not modify, the ADR 0007 ladder: a lesson the gate passes still enters at whatever provenance the servitor verifies.) |

## 4. Mechanics

**The four-part gate (canonical text lives in `skills/red-team/SKILL.md`; ~12 lines):**

1. **Action-provenance first.** Before attributing any failure — a red probe, a broken baseline, an unexpected sandbox or live-system state — to the plan, the repo, or a subsystem, enumerate your own and any concurrent actor's recent **mutating** actions against the state you observed, and explicitly rule each one out. "Did I cause this?" is question #1, not an afterthought.
2. **Single-path validation.** Never validate or reproduce against the same shared mutable state through two paths back-to-back (manual **and** automated) — interference between paths masquerades as a systemic defect. Pick one path; re-provision fresh state before switching.
3. **Hypothesis promotion is gated on primary evidence.** No durable artifact — a memory/lesson write, a `war-followup` issue, a fix plan or spec, a sub-agent fan-out — may encode a root-cause diagnosis until the mechanism is demonstrated from primary evidence (raw logs, a clean repro) **and** an inward refute pass has run: prove the cause is *not* your own action, step by step.
4. **State the falsifier.** Before acting on a diagnosis, state the observation that would falsify it and go check for it. Evidence merely *consistent with* the theory is not proof.

**Per role:**

- **Red-team Lead** (`skills/red-team/SKILL.md`): the new section is a standing rule for adjudicating any probe fail or unexpected result during Steps 3–5. It generalizes an incident this repo has already recorded — lesson `redteam-executed-probe-cwd-reset-hits-real-remote` is a self-confound (the probe's own cwd-reset, not the plan, produced the observed outward push).
- **Confirm-stage probe agents** (`skills/red-team/references/lenses.md`): the adversarial confirm gains the inward question — before a `fail` counts, rule out the probe's own provision commands, sandbox reuse, or an earlier probe's mutation as the cause. One sentence appended to the existing reproduced-evidence rule in `## Safety`.
- **WAR Lead** (`skills/war/SKILL.md`): one bullet in `## Invariants (never violate)`, condensed to the two load-bearing halves — enumerate-and-rule-out own/concurrent mutating actions before blaming a subsystem, and no hypothesis promotion (the D3 four-channel list, named) without primary evidence plus a stated falsifier. This covers the Lead's live-validation and phase-diagnosis moments (gate reds, `held:*` decisions, resume anomalies).
- **Worker** (`agents/war-worker.md`): two sentences in `## Stop and escalate instead of guessing` — before a `blocked_reason` blames the plan, the code, or the environment, run the self-confound gate on your own recent actions (edits, a rebase, a partially-run command), and name in the `blocked_reason` what you ruled out. This makes the escalation itself carry the evidence trail.
- **Test** (`skills/red-team/diagnosis-preflight.test.sh`, new): one text-scan suite asserting (a) the `## Diagnosis pre-flight` section heading and all four numbered parts exist in the red-team skill, and (b) each of the other three surfaces contains the term "self-confound gate" plus one short distinctive per-surface anchor. Anchors are case-tolerant, mid-sentence phrases (lesson `prompt-only-clause-grep-guard-must-tolerate-sentence-case`), never long literal sentences (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`).

## 5. Surface changes

| File | Change |
|---|---|
| `skills/red-team/SKILL.md` | New `## Diagnosis pre-flight (self-confound gate)` section (the canonical four-part gate, ~12 lines) between `## Backstop-legitimacy check` and `## Invariants (never violate)`. Frontmatter untouched. |
| `skills/red-team/references/lenses.md` | One sentence appended to the reproduced-evidence rule in `## Safety` (the inward confirm question). |
| `skills/war/SKILL.md` | Exactly one bullet appended to `## Invariants (never violate)` (the condensed Lead gate). |
| `agents/war-worker.md` | Two sentences appended to `## Stop and escalate instead of guessing`. |
| `skills/red-team/diagnosis-preflight.test.sh` | New text-scan structure test covering all four prose surfaces. |
| `CONTEXT.md` | New `### Diagnosis discipline` subsection under `## Language` with the two glossary terms (§6). |
| `docs/adr/` | One new ADR (§7). |

No other file changes. No `workflow-template.js`, no hooks, no floors, no `war-config.mjs`.

## 6. New domain terms (CONTEXT.md)

- **Self-confound gate**: the mandatory diagnosis pre-flight before an observed failure may be attributed to a systemic bug — enumerate and rule out your own (and concurrent actors') mutating actions, keep validation single-path over shared mutable state, gate hypothesis promotion on primary evidence plus an inward refute pass, and state the falsifying observation. Standing-instruction prose; not code-enforced. _Avoid_: "observer-effect check" as the code/test token (the ratified term is self-confound gate); treating the gate as a hook or floor.
- **Hypothesis promotion**: escalating a root-cause diagnosis into a durable artifact — a memory/lesson write, a `war-followup` issue, a fix plan or spec, or a sub-agent fan-out. Gated by the self-confound gate; a hypothesis that must survive compaction is a labeled ledger/phase-report note, never a memory lesson.

## 7. Recommended ADRs

One short ADR — **"Diagnosis discipline: the self-confound gate"** — recording (a) the four-part gate as standing doctrine on the four named surfaces, (b) the D3 closed list of hypothesis-promotion channels, and (c) the mirroring policy: tailored per-surface clauses sharing the literal term as anchor, presence-tested, deliberately never byte-identical. Number: next free at land time (0019 at authoring; `docs/adr/` currently ends at 0018 — resolve from the directory when landing, same discipline as version slots).

The ADR earns its slot because the mirroring policy is exactly the kind of decision that drifts silently without a record (three prior lessons in `docs/learnings/` are about mirror drift), and because the gate constrains future behavior across skill and agent surfaces owned by different plans.

## 8. Open risks / implementation notes

- **Landing order vs the sibling spec.** Both plans touch `skills/war/SKILL.md`. This plan lands **after** the target-repo-agnostic plan (stack-and-plow, ADR 0011); the single appended Invariants bullet rebases trivially over whatever the sibling does to that file. The roadmap's shared-file-contention table must carry this edge.
- **Compliance is not enforceable.** The gate can be ignored by a sufficiently confident agent — the incident's own early-caveat-overwritten pattern is precisely that. Accepted residual: each promotion channel retains a downstream human backstop (memory lint + `docs(learnings)` PR review, issue triage, `/red-team` on any fix plan), and the ADR 0007 ladder still bounds recall damage. The prose moves the check from "by luck" to "by standing instruction"; it does not make it mechanical.
- **Presence-only test misses wording drift** (lesson `gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity`). Accepted by construction: D2 makes the clauses deliberately non-identical, so byte-identity assertions are impossible; the shared anchor is the term itself plus one short per-surface phrase.
- **Do not disturb sibling text-scan assertions.** Before landing, re-run `skills/red-team/manifest-provenance.test.sh` and `skills/war-machine/war-pipeline-structure.test.sh` — both grep files this spec edits; all changes here are pure additions, so they must stay green untouched.
- **Plan shaping note:** the four prose edits are docs-only (`requiresTest:false` candidates); the task adding `diagnosis-preflight.test.sh` is the `requiresTest:true` task and can carry the four prose files with it if carved as one task — all five surfaces are file-disjoint from every other in-group change, so one-task-or-several is the planner's call, subject only to the sibling-plan ordering edge.
- The red-team `description:` frontmatter is deliberately untouched — changing it re-tunes when the skill auto-triggers, which is out of scope.

## 9. Non-goals / deferred

- **No code enforcement** — no PreToolUse hook blocking servitor/Lead memory writes mid-diagnosis, no gate/floor wiring, no `HARD_ESCALATION_REASONS` change. If prose proves insufficient, a write-side hook is the follow-up, not this change.
- **No new auditor lens and no `agents/war-auditor.md` change** — auditors judge implementations at a pinned SHA; the gate targets the roles that diagnose failures (red-team Lead, WAR Lead, workers). The auditor surface is not in #575's affected set.
- **No ADR 0007 / provenance-ladder changes** — the ladder's recall-side bounding stands as-is; this spec adds write-side discipline beside it.
- **No `workflow-template.js` changes** (D6) — the worker clause rides the standing surface.
- **No retroactive sweep** of existing `docs/learnings/` entries for diagnoses promoted without proof — `/lessons-learned` housekeeping territory.
- **Issue #574** (the concrete `--pattern` defect the incident also surfaced) — explicitly out of scope; different group.

## 10. Validation criteria

1. `grep -qi 'self-confound gate' skills/red-team/SKILL.md` passes, the `## Diagnosis pre-flight` heading exists, and the section contains all four parts (action-provenance, single-path, promotion-gated-on-primary-evidence, falsifier) — each individually greppable.
2. `grep -qi 'self-confound' skills/red-team/references/lenses.md` passes, and the clause sits in `## Safety` adjacent to the reproduced-evidence rule.
3. `skills/war/SKILL.md` `## Invariants (never violate)` contains exactly one new bullet carrying the term and naming all four hypothesis-promotion channels (memory write, `war-followup` issue, fix plan, sub-agent fan-out).
4. `agents/war-worker.md` `## Stop and escalate instead of guessing` carries the self-confound clause, including the "name what you ruled out in the `blocked_reason`" requirement.
5. `bash skills/red-team/diagnosis-preflight.test.sh` passes on the merged tree, and **fails** when any one of the four surface clauses is deleted (delete-the-feature check, lesson `weak-test-assertion-passes-without-feature-being-exercised`).
6. Pre-existing suites green and untouched: `bash skills/red-team/manifest-provenance.test.sh`, `bash skills/war-machine/war-pipeline-structure.test.sh`, `node --test 'skills/**/*.test.mjs'`, and the `hooks/`+`skills/` shell-test loop.
7. `CONTEXT.md` defines **self-confound gate** and **hypothesis promotion** under a `### Diagnosis discipline` heading.
8. The new ADR exists in `docs/adr/` at the next free number and records the doctrine + mirroring policy.
9. The diff touches only the seven surfaces in §5 — nothing under `hooks/`, `skills/war/assets/`, or `skills/_shared/`.
