# Audit evidence precedence — per-claim-shape ladders for every evidence-handling role

Ratified via `/grill-with-docs`, 2026-07-28. Five decisions grilled one at a time; design tree resolved below.

## 1. Context — the gap / problem

WAR has precedence rules for resume state (ADR 0008: git > labels > ledger) and for version
literals (task instruction > red-team adjudication > plan body literal), but **none for audit
evidence**. A seat judging a claim chooses among the pinned blob, the mutable working tree, the
gate-evidence artifact, the worker's done-report, git history verbs, threaded run context, and
prefetched lessons — with the rules scattered as prose across `agents/war-auditor.md` and never
stated as a ladder. Three recorded lessons exist because a seat trusted the wrong surface
(`audit-worktree-pre-impl-tip-stale-verdict`, `audit-log-finding-can-be-stale-by-land-time`,
`auditor-grep-tool-unrestricted-by-git-verb-bash-guard`), #1138 measured 52 guard denials across
29 of 31 seats, and the 2026-07-27 campaign close produced two **Lead**-side evidence errors (a
Gate-2 candidate sweep run against the wrong tree; a dispatch prompt asserting a `deps` fix that
was never applied — caught only by the servitor's verify-on-write). The gap is not missing
tactics; it is a missing **decision** about which surface outranks which, per kind of claim.

## 2. Pivotal constraints

- **Rank inverts by claim.** For "is X present at the pin" the pinned blob outranks the gate log;
  for "did the mapped test run" the gate log outranks the blob (the existing HARD/SOFT rule). Any
  single total order is therefore wrong somewhere and would be gamed at its top rung.
- **Enum discipline.** Everything precedence-shaped in this repo is a closed set
  (`HARD_ESCALATION_REASONS`, disposition, land decisions). A mintable precedence rule can be bent
  toward whatever evidence a seat has on hand — the exact failure the ladder exists to stop.
- **ADR 0025.** The ladder is mirrored prose (standing card + dispatched prompt); a mirrored fact
  must ship a mechanical drift guard in the same plan.
- **Progressive disclosure.** Dispatched prompts pay per-seat token cost every round; the full
  ladders belong on the reference surface, only a skeleton in the hot path.
- **Existing role disciplines stand.** The servitor's verify-on-write (ADR 0007) and the Lead's
  resume precedence (ADR 0008) are instantiations to cite, never text to duplicate.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | One total order vs per-claim-shape | **Per-claim-shape ladders** — four shapes, each with its own short ladder, plus universal floor rules |
| D2 | Shape set open or closed | **Closed + default arm** — unmatched claims are judged under `content-at-pin` (strictest); if unworkable, a SOFT `cannot-confirm`, never a new shape |
| D3 | Conflict semantics | **Rule + record** — the higher rung rules the verdict; a cross-rung contradiction is mandatorily recorded as a `disposition: note` finding naming both rungs |
| D4 | Enforcement | **Token guard, tiered copies** — full ladders on `agents/war-auditor.md`; compact skeleton in the dispatched prompt; token-anchored both-surfaces registry row; AuditVerdict schema untouched |
| D5 | Who is bound | **Widest scope (operator-chosen over the narrower recommendation): all auditor seats incl. reserved passes, the Lead's phase-close/Gate-2 evidence duties, and the servitor** — each pre-existing role discipline cited as that role's instantiation, not restated |

## 4. Mechanics

### 4.1 The four claim shapes (closed set)

Shape names are deliberately distinct from lens names — `execution` the shape classifies a claim;
`execution-evidence` the reserved lens judges gate output through it.

**`content-at-pin`** — "is X present / absent / worded-thus at the judged state."
1. Pinned blob: `git show <audit_sha>:<path>` (or the pinned three-dot diff, recomputed per round).
2. Working-tree Read/Grep — **advisory corroboration only**, never the sole basis (tree may carry
   uncommitted edits; existing doctrine, now ranked).
3. Worker done-report claims about content.

**`execution`** — "did it run / did it pass."
1. Gate-evidence artifact (`_refinery/.war/gate-<taskId>.log`) — the **sole** basis for a HARD
   provably-unrun finding (existing rule, now rung 1).
2. Refiner-reported inline gate result — SOFT (possibly curated).
3. Worker done-report / in-task probe evidence — SOFT, **never a hold**
   (`deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold`).
4. Absent evidence ⇒ SOFT `cannot-confirm`, never a hold.

**`history`** — "when did this change / was it ever removed."
1. Pinned history verbs, verb-per-claim-shape: `git log -S` for occurrence-count change, `-G` for
   content-pattern change, `git show` (not `-S`) for presence-at-tip; `git blame` at the pin.
2. Prose or comments *claiming* history ("measured 50 of 50 at the implementation base") — a claim
   to verify, never evidence
   (`bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands`).

**`authority`** — "what was decided / what version / what is in scope."
1. Task instruction (the dispatched prompt, incl. the threaded adjudication set).
2. Red-team report `## Adjudications` rows.
3. Plan body literal.
4. Roadmap/spec literals (non-authoritative at land time — existing doctrine).
This generalizes the existing version chain; the version chain is its `authority` instance.

### 4.2 Universal floor rules (all shapes, all roles)

- The working tree and the worker done-report are **never the top rung** of any ladder.
- Prefetched lessons are **never evidence**. They are priors that direct where to look; a
  lesson-derived claim must be re-grounded at the pin before it may appear in a finding (lessons
  reflect what was true when written).
- Conflict rule (D3): higher rung rules; the contradiction is recorded as `disposition: note`
  naming both rungs. Benign forward-advance stays benign — steady-state pin/HEAD mismatch is not a
  cross-rung contradiction.
- Default arm (D2): unmatched claim → `content-at-pin`; unworkable → SOFT `cannot-confirm`.

### 4.3 Role instantiations (D5)

- **Auditor seats (incl. reserved passes)** — the operative audience. Full ladders on the standing
  card; skeleton in every dispatched audit prompt. `execution-evidence` gate-audit and
  `pin-validity` pre-flight are already rung-1-conformant; the ladder names them as instances.
- **Lead (phase-close / Gate-2)** — three bindings, each a 2026-07-27 incident generalized:
  (1) evidence for close-out claims is gathered **at the plan's branch tip in a dedicated
  worktree**, never the main checkout (wrong-tree Gate-2 sweep); (2) remote truth via `ls-remote`
  per ADR 0008 (cited, not restated); (3) **a claim the Lead threads into a dispatch prompt
  becomes rung 1 of `authority` for the receiving agent** — so the Lead must ground it at
  `content-at-pin`/`execution` first, or mark it unverified. This is the false-`deps`-claim
  incident stated as a rule.
- **Servitor** — verify-on-write (ADR 0007) **is** its instantiation of the floor rules: referent
  found → `code-verified`; absent → `agent-unverified` + absence note; an ungroundable
  Lead-asserted specific claim is refused and the discrepancy flagged. One cross-reference line on
  `agents/war-servitor.md`; no behavioral change.

### 4.4 Token skeleton (the guard's shared anchors)

The four shape names (`content-at-pin`, `execution`, `history`, `authority`) + the floor clause
token (`never the top rung`) + the lessons clause token (`never evidence`). Guards pin these
tokens, not sentence bytes — sanctioned rewording latitude on either surface does not false-red.

## 5. Surface changes

| File | Change |
|------|--------|
| `agents/war-auditor.md` | New `## Evidence precedence` section: full four ladders + floor rules (§4.1–4.2) |
| `skills/war/assets/workflow-template.js` | Skeleton block appended to `auditPrompt()` and the gate-audit seat prompt (same commit as the card — standing/dispatched split) |
| `skills/war/assets/workflow-template.test.mjs` | One both-surfaces registry row: token skeleton on card + prompt |
| `skills/war/SKILL.md` | Lead bindings (§4.3) added to the phase-close and Gate-2 bullets — skeleton + ADR pointer only |
| `skills/war/assets/skill-doc-contracts.test.mjs` | One row pinning the SKILL.md skeleton tokens |
| `agents/war-servitor.md` | One cross-reference line (ADR 0007 as instantiation) |
| `CONTEXT.md` | Glossary entries (§6) in `### Audit` |
| `docs/adr/<next-free>-audit-evidence-precedence.md` | The ADR (§7) — number resolved from the live `docs/adr/` listing at land time (0041 as of 2026-07-28; non-authoritative) |

## 6. New domain terms (CONTEXT.md)

- **Claim shape** — which of the four closed evidence categories a claim falls into; determines the
  ladder. _Avoid_: mintable shapes; conflating the `execution` shape with the `execution-evidence`
  lens; treating shape as a finding field (it is judgment guidance, not schema).
- **Evidence rung** — a surface's rank within one shape's ladder. _Avoid_: a global rank across
  shapes; treating a lesson as a rung (lessons are priors, not evidence).
- **Rule + record** — the conflict discipline: higher rung rules the verdict, contradiction is
  recorded as `disposition: note`. _Avoid_: silent-win; escalation-on-contradiction; recording
  benign forward-advance as a contradiction.

## 7. Recommended ADRs

- **ADR `<next-free>` — Audit evidence precedence: per-claim-shape ladders.** Number resolved from
  the live `docs/adr/` listing at land time (0041 as of 2026-07-28; the literal is
  non-authoritative). Records D1–D5, the four ladders, the floor rules, and the two rejected
  alternatives (total order; runtime schema field). Cross-references ADR 0007, 0008, 0025.

## 8. Open risks / implementation notes

- The `execution` shape name sits one token from the reserved `execution-evidence` lens; the
  CONTEXT.md `_Avoid_` line is the mitigation. If it confuses in practice, renaming the shape is a
  one-plan token sweep (the guards are token-anchored, so the sweep is mechanical).
- The Lead bindings in `skills/war/SKILL.md` are prompt-enforced only (refiner/main scope hook
  fail-opens); the doc-contract row guards the text, nothing guards the behavior. Accepted — same
  posture as all existing Lead doctrine.
- Done-report placement (below all mechanical evidence, above nothing) is the one judgment call
  not forced by a recorded lesson; flagged for red-team attention.
- **Run config (operator-directed, 2026-07-28): docs-tier workers run on `fable` at `high` effort
  for this implementation** — set `agents.worker.docs: { model: 'fable', effort: 'high' }` in the
  run's `.claude/war/config.json` (via `/war-room` or hand-edit) before launch. Most of this
  plan's tasks are all-`*.md` (`Files:` entirely markdown ⇒ mechanically classified to the docs
  tier at dispatch), so the default sonnet docs tier would carry the doctrine-bearing prose; the
  ladder text is precision-critical enough to warrant the stronger tier. Code-bearing tasks
  (`workflow-template.js` + test suites) stay on the base worker tier — this note does not touch
  `agents.worker` or `agents.worker.fix`.

## 9. Non-goals / deferred

- **No AuditVerdict schema change** (D4 rejected arm) — a per-finding evidence-rung field waits
  for a consumer to exist.
- **No subsumption of ADR 0008** — resume precedence stays its own doctrine; the ladder cites it.
- **No red-team probe binding** — probes have their own grading discipline (ADR 0032/0033).
- **No rewrite of servitor discipline** — ADR 0007 already is the instantiation.

## 10. Validation criteria

1. Editing the skeleton on any one surface alone (card, `auditPrompt()`, SKILL.md) reds the
   corresponding suite (`workflow-template.test.mjs` / `skill-doc-contracts.test.mjs`).
2. Each of the three precedent lessons maps to exactly one shape whose ladder forbids the surface
   the seat wrongly trusted (D1 criterion).
3. Replayed against the 2026-07-26 campaign: the rule yields `note` findings (not holds, not
   silence) for the plan-3 stale ADR-Status finding and the servitor discrepancy, and changes no
   verdict that was actually issued (D3 criterion).
4. `grep -c` of the four shape names on the dispatched prompt surface ≤ the skeleton block — the
   prompt carries no full ladder (D4 tiering criterion).
5. AuditVerdict schema byte-unchanged across the whole diff (D4/§9 criterion).
6. The servitor card diff is exactly one added cross-reference line (D5 no-duplication criterion).
