# Red-team report — 2026-07-22-war-memory-hardening

**Verdict: CLEARED-WITH-NOTES** (four rounds: r1 BLOCKED on 2 root defects → r2 BLOCKED on the
patch's *own* defects → r3 BLOCKED on 5 more, incl. one neither prior round saw → r4 all spine
probes green, 1 residual Major patched and independently re-verified)

- **Plan:** `docs/plans/2026-07-22-war-memory-hardening.md`
- **Source spec:** `docs/specs/2026-07-22-war-memory-hardening-design.md`
- **artifactKind:** impl-plan
- **Baseline:** plan-6 base tip `c9bfad9` (stacked on test-floor-target-repo v0.14.53), read-only
  worktree
- **Runs:** r1 `wf_6cbb99f2-ada` (13 probes) → r2 `wf_4a7bc721-20d` (10) → r3 `wf_b2b3b6aa-85b` (9)
  → r4 `wf_0a1fb7cb-349` (9). Each round a **fresh launch**, never `resumeFromRunId`. Analyzed
  probes on `Explore`; model opus / effort high. Escape guard clean every round except r2/r3, where
  the sole delta was this red-team's own uncommitted plan patch — self-confound ruled out by
  action-provenance, never a probe escape.
- **`ff-topology`** not derived: no merge-topology anchors in the plan (token grep + hand-read).

## Attack surface

r1: 6 spine + 7 bespoke incl. both mandated drift guards — **`default-flip-old-absent` was
non-vacuous here** (this plan genuinely retires prose across enumerated surfaces), 13/13 on-target,
4 pass / 3 fail / 6 warn. r2: 10 probes, 3 pass. r3: 9 probes, 2 pass. r4: 9 probes, **all three
spine probes pass** (claims-vs-reality, executable-proof, coverage-vs-source), 1 Major residual.

## Findings and resolutions

### Round 1 — two root defects

1. **The plan froze the bug inside the fix (4 probes converged).** Task 1.2 ordered the Preflight
   stop instruction kept **verbatim** — but that frozen region carries two claims the change itself
   falsifies. `SKILL.md:62` attributes the printed `verdict` to `buildProjection`'s own read, false
   once `tightenPlan` overloads it, and false exactly where the operator is told how to read the
   field. `SKILL.md:63` glosses `verdict: "ok"` as "strictly under the advisory line" — with
   `--target 10000` and 12,000 B the corpus *is* under the advisory line while the verdict is
   `warn`, so the gloss misdescribes the stop condition precisely in the case the plan enables.
   Neither carries a sweep token, so the plan's own grep floor could never surface them.
   **Resolution:** "verbatim" re-scoped to the stop **contract**; both enumerated with OLD-absent
   locks.
2. **The Purpose was unreachable.** It claims a custom `--target` "now actually governs whether the
   preflight triggers" — but the Preflight invocation is hardcoded with no `--target`, which appears
   exactly once in the file, in a parenthetical. The plan delivered the CLI contract, not the flow.
   **Resolution:** live-flow threading requirement + a new checkable condition.

**r1 minors patched:** the RESOLVED-convention exemplar the plan told workers to imitate
**does not exist in the repo** (7 probes; it lives only in an untracked local memory root, so a
worker in a task worktree cannot read it) → repointed at the real in-repo exemplar; both token
sweeps were **case-sensitive** and returned zero hits against re-cased copies of their own landing
sites → `-in`/`-rin`; the byte-length rationale ignored the 160 B render cap; the `CONTEXT.md`
glossary — adjudicated keep-no-edit — asserts "there is no third threshold", the strongest form of
the exact claim being falsified → adjudication reversed, `CONTEXT.md` added to Task 1.2's Files.

### Rounds 2–3 — the patches' own defects

The r1 patch introduced its own: an enumeration claiming "eight surfaces in SKILL.md plus two in
CONTEXT.md" (ten by arithmetic) with only six enumerated and **labels 4–5 dangling**; a
**non-discriminating** check for the new condition (`--target` in the "step-1 region" already passes
today via the parenthetical); a false "no enumerated surface lacks a mechanical check" claim (the
doc-contract test never opens `CONTEXT.md`); and — with some irony — a `CONTEXT.md` citation quoting
a phrase that **wraps `:1071→:1072`**, the very vacuous-guard class the patch was written to fix.
`7b.` was also not a valid Markdown list marker and rendered glued into item 7.

r3 then found the r2 patch had **orphaned the fence lock** (End state 9 named a mechanism no task
claimed) and that the claim "surfaces 2 and 4 carry no crisp retired token" was **false** — `:61`
carries `only for a different bound`, `:146` carries `and the trigger for the \`tighten\` mode
below`, both crisp and single-line. NEW-present-only coverage there is exactly the default-flip
failure mode: append a target-aware sentence, leave the false clause standing, both locks pass.

**Resolution:** contiguous labels 1–8; End state renumbered 1–13 with valid markers; fence-scoped
lock moved into Task 1.2's deliverable list and scoped to the ```bash block (`:57`/`:58`/`:59`) so
it is red today and green only on a correct implementation; **all six** SKILL surfaces given
OLD-absent locks; `CONTEXT.md` loading made an explicit test requirement; needles chosen to stop
before line wraps; a NEW-present lock added on the surviving stop rule (absence locks cannot catch
an over-rewrite that deletes it).

### Round 3's independent find — cross-plan collision

`docs/plans/2026-07-22-lessons-learned-seed.md` edits **all three** of Task 1.2's files, and inserts
a `## seed mode` section directly adjacent to every surface this plan retires. Verified against the
campaign ledger: **seed is not one of the nine queued plans** — it sits on its own branch, so the
plan's "the campaign roadmap serializes landing" reassurance never covered it. Recorded with a
rebase-by-named-construct requirement.

### Round 4 — one residual Major, patched

Adding `CONTEXT.md` in r1 created **in-campaign** contention the Notes still denied: `CONTEXT.md` is
a Files-listed surface of five siblings (plans 2, 3, 4, 5, 7), and the campaign roadmap's row 6
omits it, so no serialization rationale exists for this plan's glossary edit. Patched with the real
contention and a glossary-scoped named-construct rule.

**Re-verified deterministically by the Lead** rather than by a fifth model round — every component
is a fact a command settles: which sibling plans list `CONTEXT.md` (grep over the nine plan files →
2, 3, 4, 5, 6, 7); the roadmap's row-6 omission and its "2, 3, 4, 5, 7" contention row; the anchors
`:1070`/`:1071`/`:1077` still correct **at this base** `c9bfad9` (plans 2–5 already landed, so their
glossary terms are present); and plan 7 landing *after* plan 6, making the drift one-directional —
plan 7 rebases around this plan, not the reverse.

## Backstop-legitimacy (2 AI-declared entries)

Both legitimate: the #992 end-to-end fix needs a live operator, a live corpus in the right byte
range and the interactive strike-list gate (CI covers the verdict contract on fixtures); the
`FUTURE_SKEW_MS` skew check needs a real local wall clock at a date boundary (tests inject `now`).
Each names a runner and timing; no cheaper pre-merge proxy is over-deferred. Both carry the ADR 0014
**AI-declared** marker.

## Residual risk / notes

- **Minor (auto-noted):** intent is `## AI-Commander's Intent` (AI-drafted under `--afk`, ADR 0014),
  not operator-confirmed. Well-formed — 13 checkable conditions, each mapped to a delivering task.
  Human upgrade path: `/war-strategy <plan>`.
- **Roadmap record gap (not a landing hazard):** the campaign roadmap's row 6 should list
  `CONTEXT.md` under Files owned and appear in its `CONTEXT.md` contention row. Worth a follow-up on
  the roadmap artifact; the plan itself now carries the rule.
- **Four rounds is itself the finding.** Every patch generation introduced a new defect that only an
  executed re-verification caught — a non-discriminating grep, an orphaned lock, a wrapped needle, a
  dangling label. A prose-retirement task with enumerated surfaces and OLD-absent locks is
  unusually error-prone to *specify*, independent of how easy it is to implement.

## Adjudications

Red-team rulings + ratified self-adjudications, threaded into the `/war` run as
`args.adjudications` so audit seats confirm rather than re-litigate:

| # | delta | ruling | route |
|---|-------|--------|-------|
| 1 | Task 1.2 ordered the Preflight stop instruction kept **verbatim**, freezing two OLD readings inside it. | "Verbatim" is re-scoped to the stop **contract**: the rule (`ok` ⇒ report "nothing to tighten" and stop; no later step runs) survives semantically; its advisory gloss and the `buildProjection`'s-own-read attribution are retired like any other OLD surface. Keeping the bytes would ship two live false statements. | red-team r1; patched |
| 2 | Purpose claims `--target` governs whether the preflight triggers; the live invocation passes no `--target`. | Task 1.2 must thread an operator-supplied target into the fenced step-1 command; End state 9 covers it, mechanically locked **fence-scoped** (a whole-region grep is non-discriminating — it passes today). | red-team r1+r2+r3; patched |
| 3 | Surfaces 2 (`:61`) and 4 (`:146`) were called "no crisp retired token" and given NEW-present-only locks. | **False** — both carry crisp single-line retired tokens (`only for a different bound`; `and the trigger for the \`tighten\` mode below`). All six SKILL surfaces get OLD-absent locks; NEW-present-only there is the default-flip failure mode. | red-team r3; patched |
| 4 | `CONTEXT.md`'s **Advisory line** / **Tighten pass** entries were adjudicated keep-no-edit. | **Reversed** — they assert "there is no third threshold" / "triggered at the advisory line", the same stale claim in stronger definitional form. `CONTEXT.md` joins Task 1.2's Files; the doc-contract test must **load** it (today it opens only SKILL.md + migration.md), locked on needles that stop before the `:1071→:1072` wrap. | red-team r1+r2; patched |
| 5 | Task 1.3's RESOLVED-convention exemplar. | The cited `war-memory-archive-cross-root-dupe-mutates-repo-root` **does not exist in this repo** (local-root-only; unreadable from a task worktree). Follow `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`. The MITIGATED exemplar is real and unchanged. | red-team r1; patched |
| 6 | Both token sweeps were case-sensitive. | `grep -in` / `grep -rin` — the case-sensitive form returned zero hits against re-cased copies of its own landing sites. Grep remains a floor; the mandatory manual survey still binds. | red-team r1; patched |
| 7 | Cross-plan contention. | `lessons-learned-seed` edits all three Task 1.2 files and is **not** campaign-serialized; in-campaign, `CONTEXT.md` is shared with plans 2/3/4/5/7 and the roadmap's row 6 omits it. Rebase by **named construct** — locate glossary entries by bolded heading, never by line number — and re-confirm the OLD-absent needles post-rebase. Anchors verified correct at base `c9bfad9`; drift is one-directional (plan 7 lands after). | red-team r3+r4; patched |
| 8 | Version literals in the plan (Task 2.1), incl. its named "expected integration base" branch. | Non-authoritative; `version-slots.test.mjs` is the arbiter — resolve the next free patch from the four slots at land time (campaign expectation: v0.14.54). The real base is the campaign stack tip. | plan Notes; ratified (standing) |
| 9 | `## AI-Commander's Intent` + AI-declared backstops heading (ADR 0014). | Standing AFK provenance — intent is the ceiling, plan slice the floor; backstop entries render their AI-declared marker at every land and in the campaign wrap-up. | auto-noted; ratified |
