# Audit calibration & lesson graduation — adopting the CODING-AGENT-RULES gap set

## 1. Context — the gap / problem

The operator brought `CODING-AGENT-RULES.md` (32 numbered rules + an irreversible-action gate,
re-domained from a marketing-agency operator-agent CLAUDE.md) for review against WAR. A four-way
coverage analysis (Karpathy guidelines skill, Ponytail plugin, WAR `agents/*.md` + hooks, WAR
`skills/*/SKILL.md`) established:

- The two auxiliary skills cover **1 of 33** items between them — they are code-shape and
  minimalism disciplines; the rules file is epistemics (verification, calibration, irreversibility).
  Karpathy is invoke-only and reaches **no** WAR agent (auditor/servitor carry no Skill tool);
  Ponytail reaches **every** subagent via its SubagentStart hook, globally.
- WAR already covers most of the file, usually with **stronger** mechanisms than the prose asks
  for (red-team sandboxed proof > "find 3 flaws"; aftermath's `disable-model-invocation` +
  protected core > PREVIEW→CONFIRM→ACT; resume precedence ADR 0008 > "docs record intent";
  unanimous pinned-SHA audits > "fact-check subagent output"; floors/guards machine-enforce the
  verification cluster).
- Three genuine gaps remain, each with a specific bite point. This spec adopts exactly those
  three. Everything else was evaluated and consciously not adopted (§9).

## 2. Pivotal constraints

1. **Adopt only where a gap bites.** WAR's existing mechanisms outrank the prose rules wherever
   they overlap; no wholesale import, no standing rules document in the repo.
2. **Both-surfaces discipline.** Auditor behavior lives in two places — the dispatched prompt
   built by `auditPrompt()` in `skills/war/assets/workflow-template.js` and the standing
   instructions in `agents/war-auditor.md`. Both must change in the same commit, locked by a
   shared-sentence test (pattern: the existing auditor latitude/disposition both-surfaces test
   block in `skills/war/assets/workflow-template.test.mjs` — the worker self-query both-surfaces
   test is the same shape).
3. **Auditor seats are fresh agents every round.** The rebuttal round and the post-fix re-audit
   both re-dispatch `auditPrompt()` (the re-audit with `peers=null`). A calibration clause must
   therefore live in the **always-present base prompt** — one clause mechanically covers the
   initial audit, the rebuttal round, and every fix re-audit.
4. **Fail-open, no new stalls.** Nothing here may add an interactive confirmation, auto-file an
   issue, or block a land on its own; the graduation check flags, the severity cap demotes.
5. **Ponytail is accepted as a standing layer (recorded, not fought).** The operator's Ponytail
   plugin injects its minimalism ruleset into every spawned subagent (SubagentStart hook, global
   flag file, all repos, including `--afk` runs). Decision: accept as-is — it aligns with the
   `simplicity` lens and the intent-ceiling/plan-floor doctrine, its never-simplify floor protects
   mapped tests, and the operator has observed net benefit. No defensive decoupling prose in
   `agents/*.md`. Reversible at any time with `/ponytail off`.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Anti-softening (rule 20) placement | One CALIBRATION RULE line in the base `auditPrompt()`, mirrored in `agents/war-auditor.md`, locked by a both-surfaces shared-sentence test |
| D2 | Clause scope | Single clause covering both re-judgment moments (peer rebuttal + fix re-audit) via the base prompt — no per-round bespoke clauses |
| D3 | Cost-claim discipline (rule 4) | COST-CLAIM RULE in the auditor finding contract: a cost justification must name a magnitude; unquantifiable ⇒ finding capped at **Minor** (fail-open: the smell still surfaces, it just can't block a merge) |
| D4 | Graduation trigger (rule 31) | `/lessons-learned` housekeeping pass: lessons with ≥2 recurrences describing a machine-checkable invariant are flagged as graduation candidates with a proposed enforcement shape. Flag-only; operator decides; nothing auto-files |
| D5 | Rules 9/14/21 + Lead-side 20 (generic conduct) | Operator-global `~/.claude/CLAUDE.md` conduct block — outside this repo entirely |
| D6 | Rules 7/8 (identity frames, operator depth) | Skipped — already practiced / moot |
| D7 | Three-tier merge model, LESSONS.md, interactive ask-channels, rule-25 prose output | Rejected — each conflicts with WAR's design (autonomous serial merge queue + `held:*`; two-root one-fact-per-file memory, ADRs 0007/0015; `blocked`/`escalate` enums; JSON return contracts) |
| D8 | `CODING-AGENT-RULES.md` disposition | Parked at `~/.claude/CODING-AGENT-RULES.md` (only coding-domain rendition; zero context cost), removed from repo root — never committed |
| D9 | Ponytail↔WAR interaction | Accept-and-record (constraint 5); no ADR — fully reversible |

## 4. Mechanics

### 4.1 Calibration rule (anti-softening)

Canonical sentence, appended to the LATITUDE/DISPOSITION rules block in `auditPrompt()` and
mirrored (sentence-case heading, same shared sentences) in `agents/war-auditor.md`:

> CALIBRATION RULE: judge on evidence only — never soften, downgrade, or drop a finding because
> peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in
> the current diff. The pull to soften peaks right after your own finding is challenged — that is
> the highest-risk moment.

Because the base prompt is rebuilt for every seat dispatch, the clause is present in the initial
round, the REBUTTAL ROUND branch, and the post-fix re-audit without further wiring.

**Deliberate scope note — gate-audit seats:** the two gate-audit dispatches (`execution-evidence`,
`end-state`) build their prompts inline, not via `auditPrompt()`; they receive these rules through
the `agents/war-auditor.md` standing surface only (they spawn as the same agent type). This is
accepted: gate-audit is SOFT-by-default evidence review, not severity-graded diff judgment, and the
inline prompts stay untouched.

### 4.2 Cost-claim rule (severity cap)

Canonical sentence, same two surfaces — appended to the same rules block in `auditPrompt()`
(alongside LATITUDE/DISPOSITION/CALIBRATION), and in `agents/war-auditor.md` adjacent to the
severity/finding contract (`Critical | Major | Minor | Nit`; the dispatched prompt carries no
severity-enum prose, so adjacency applies to the standing surface only):

> COST-CLAIM RULE: a finding justified by a cost — "too slow", "too expensive", "too complex" —
> must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost
> claim caps the finding at Minor.

A complexity class (e.g. O(n²) on an unbounded input) **counts** as a magnitude — the cap targets
vibes, not analysis.

### 4.3 Graduation check (`/lessons-learned`)

In `skills/lessons-learned/SKILL.md`:

- **Phase 2 (Investigate staleness)**: investigators additionally record each lesson's recurrence
  trail (the `phase` field's recurrence annotations, e.g. "+ N recurrences").
- **Phase 3 (Plan)**: a new **Graduation candidates** subsection — any lesson with ≥2 recorded
  re-triggers whose content describes a machine-checkable invariant (greppable pattern, diff
  property, enum mirror, string presence) is listed with: lesson slug, recurrence count, and a
  one-line proposed enforcement shape (hook / floor / drift-guard test / lint).
- **Phase 7 (final report)**: the candidates list is surfaced verbatim. Flag-only — the operator
  decides whether anything is filed or built; the housekeeping pass never implements enforcement.

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/war/assets/workflow-template.js` | CALIBRATION RULE + COST-CLAIM RULE lines in `auditPrompt()` |
| `agents/war-auditor.md` | Sentence-case mirrors of both rules (same shared sentences, same commit) |
| `skills/war/assets/workflow-template.test.mjs` | Two new both-surfaces tests (shared-sentence assertion on dispatched prompt AND standing file), following the existing worker self-query both-surfaces test pattern |
| `skills/lessons-learned/SKILL.md` | Graduation check: Phase 2 recording, Phase 3 candidates subsection, Phase 7 report line |
| `CONTEXT.md` | New term: **Graduation candidate** (done alongside this spec) |

Out-of-repo (operator-side, already executed with this spec): conduct block in
`~/.claude/CLAUDE.md`; `CODING-AGENT-RULES.md` parked at `~/.claude/` and removed from the repo
root.

## 6. New domain terms (CONTEXT.md)

**Graduation candidate** — a durable lesson whose recurrence trail shows ≥2 re-triggers and whose
content describes a machine-checkable invariant, flagged by `/lessons-learned` for promotion from
prose to machine enforcement (hook, floor, drift-guard test, or lint). Flag-only: the operator
decides; nothing auto-files or auto-implements.

## 7. Recommended ADRs

None. All three changes are easily reversible prose/prompt edits; the Ponytail acceptance (D9) is
recorded here and reversible with `/ponytail off`. Nothing meets the hard-to-reverse bar.

## 8. Open risks / implementation notes

- **Sentence-case mirrors:** the standing file uses sentence case ("Latitude rule:") where the
  dispatched prompt uses caps ("LATITUDE RULE:"). The new tests must assert on shared mid-sentence
  fragments (case-tolerant or the identical shared sentence), per the existing lesson on
  prompt-only clause grep guards.
- **Severity-cap misuse:** an auditor could over-apply the Minor cap to a genuinely blocking but
  hard-to-quantify problem. Mitigation is in the wording: complexity class counts as a magnitude,
  and the cap applies only when the *justification is the cost claim itself*.
- **Recurrence-trail heterogeneity:** lesson recurrence annotations are free-text today
  ("+ 28 recurrences", "recurred …/T5"). The Phase 2 recording step reads them as prose;
  no schema change is required or proposed.
- The clause wording deliberately avoids quoting any retired/guarded token so it cannot trip
  existing absence guards.

## 9. Non-goals / deferred

- **No wholesale adoption** of CODING-AGENT-RULES.md; no `@import`; the file is not committed.
- **No worker-file conduct rules** — workers keep their current prompt surface; Karpathy's
  surgical-diff content stays un-adopted (Ponytail already injects the overlapping minimalism).
- **No changes for rules WAR already covers** (the covered/partial sets: framing challenges,
  ground-truth-over-proxy, docs-vs-as-built, subagent distrust, artifact-constrained dispatch,
  structured returns, irreversible git actions, memory+template same-commit discipline, …).
- **No defensive Ponytail decoupling**; no ADR for it (D9).
- **Rules 9/14/21 + Lead-side 20** live in the operator's global CLAUDE.md, not in any repo
  surface; rules 7/8 are dropped entirely.
- **No auto-filing** of graduation candidates as issues; no auto-built enforcement.

## 10. Validation criteria

1. A built audit prompt (any seat, any round) contains the CALIBRATION RULE and COST-CLAIM RULE
   sentences; asserted by test against `auditPrompt()` output for (a) an initial round and (b) a
   rebuttal-round dispatch.
2. The shared sentences appear in `agents/war-auditor.md`; the two new both-surfaces tests fail if
   either surface drifts (case-tolerant, mid-sentence anchors).
3. `skills/lessons-learned/SKILL.md` contains the graduation check in Phase 3 and the report
   surface in Phase 7; the flag-only constraint ("never implements", "operator decides") is
   stated in the same section.
4. `CONTEXT.md` defines **Graduation candidate** under the Memory section.
5. `CODING-AGENT-RULES.md` is absent from the repo root (`git status` clean of it; parked copy
   exists at `~/.claude/`).
6. Full JS suite green: `node --test 'skills/**/*.test.mjs'`.

---

*Source document: `CODING-AGENT-RULES.md` (untracked, now parked at `~/.claude/`). Coverage
analysis: four parallel agent reports, 2026-07-06 grilling session. Pipeline: this spec →
`/war-strategy` (convert) → `/red-team` (validate) → `/war` (execute).*
