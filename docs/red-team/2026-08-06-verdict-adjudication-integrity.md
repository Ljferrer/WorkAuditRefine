# Red-team report — docs/plans/2026-08-06-verdict-adjudication-integrity.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-16 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** campaign base `a489067` (master, after PR #1436 merged plan 5). Plan Part 1 measured at `6fff2ee`; both A5 predecessor witnesses verified at the live base — `grep -c 'done-unmet' CLAUDE.md` = 1 ≥ 1 (`done-when-floor-wiring` LANDED) and `grep -c 'refused by construction' skills/red-team/assets/red-team-gate.mjs` = 0 (`red-team-gate-cli` LANDED)
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0 — no probe residue, no ref deltas
- **ff-topology:** derived **vacuous** — the plan anchors no merge-commit topology (no `^1`, no `--first-parent`, no three-dot per-task floor base, no per-task "merge commit" prose). Probe correctly not added.

## Attack surface / Executed proof

15/15 probes on target, 0 dropped, 0 off-target: 6 spine lenses + 9 bespoke (`budget-math`,
`guard-extraction-feasibility`, `snippet-fidelity`, `endstate-command-diff`, `pin-census-recheck`,
`default-flip-old-absent`, `unguarded-new-mirror`, `guard-split-deps-edge`, `predecessor-drift`).
6 executed (sandboxed via `git clone --no-hardlinks` — the repo is a **linked worktree**, so neither
`cp -R` nor a bare `git worktree add` isolates it), 9 analyzed. All three mandatory ADR-0025
drift-guard spine probes ran; none was vacuous. Every Critical/Major adversarially confirmed by an
independent seat before counting.

Gate accounting: 15 probes → **13 blockers, 7 needsDecision, 26 minors**; 25 agents, 0 errors.

## Findings and resolutions applied (all patched in place, stamped `adjudicated: true`)

The 13 blockers + 7 needsDecision collapse to **5 roots**. Six independent probes converged on root 1.

### 1. The `CONTEXT.md` eviction arithmetic is wrong and the preferred arm cannot reach the target (Critical; 6 probes, confirmed)

A3 claimed the three named entries free "≈4.2 KB net against a ≈3.0 KB need". **Both halves were
wrong**, and the plan's own `Done when` (`wc -c CONTEXT.md ≤ 111616`) was unreachable.

The six probes reported *five different* byte figures (3,146 / 3,131 / 2,813 / 3,061 / 3,149), so
none was taken on trust — the Lead re-measured. The first Lead census was itself wrong (its entry
regex `^\*\*[^*]+\*\*` matched mid-body bold such as `**never** a force-push`, truncating bodies);
corrected to require the heading's trailing `:`, it yields 187 entries and agrees with the strongest
probe. **Measured at `a489067`** (all five entries byte-identical at `6fff2ee`, so this is an
authoring error, not drift):

| entry | span | net removable |
|---|---|---|
| Dead-agent land failure | 1,401 | 1,286 |
| Stale prior attempt | 1,052 | 941 |
| provision base divergence | 696 | 579 |
| Orphan adoption *(added)* | 987 | 860 |
| Near-miss diagnostic *(reserve → primary)* | 728 | 616 |

Original three = **2,806 B** net against a **3,563 B** need → **757 B OVER**. Pulling the reserve
still lands **116 B over**. **Root cause of the inflation, verified:** the conversion census's slice
ran past `**provision base divergence**`'s real terminator and swallowed the adjacent
`**Orphan adoption**` entry (695 + 987 ≈ the claimed 1,683), and truncated `**Stale prior attempt**`
early at a mid-body bold span.

**Patch:** A3 restated with measured spans; a new `A3-note` row records *why* the census was wrong so
it is not re-derived; D14's strike list widened to **five primaries** by adding **Orphan adoption**
and promoting the reserve — **4,290 B net against 3,563 B, 727 B margin**. **Orphan adoption** was
verified unpinned: the `record-as-owned` regex in `skill-doc-contracts` D28 reads
`references/resume-and-recovery.md`'s `### Recovery relaunch` section, never the CONTEXT.md entry.

This stays inside D14's **preferred** (eviction) arm, so the operator-gated fallback arm is *not*
elected — the AFK Lead does not take a gate reserved for the operator. If the rebased-base
re-measurement still falls short, the backstop veto row routes it to the operator as designed.

### 2. Context 4(i)'s "expected unchanged" premise is falsified (Major; 2 probes, confirmed)

The plan predicted `CONTEXT.md` = 114,449 B unchanged at its base, from a scan of "all four committed
2026-08-06 plans". `docs/plans/` carries **fourteen**, and the scan scoped "predecessor" to `dependsOn`
edges rather than to every plan sequenced ahead. The sibling `gate-audit-finding-routing` declares
`Files: CONTEXT.md`, runs ahead, and landed: **114,982 B, +533 B, overage 3,366 not 2,833** — the
figure root 1's need is sized off. **Patch:** premise retired and corrected in place, with the standing
rule stated for the rest of the campaign that the `Files:` scan covers every plan sequenced ahead.

### 3. End state 8's absence greps false-negate (Major; executed, confirmed)

`grep -cF "ADR 0043's Step 5"` is single-line, case-sensitive, absence-only. The live clause **already
straddles a line boundary** (`…the per-blocker bound` ends line 28; `ADR 0043's Step 5 already
imposed…` opens line 29) — and Task 1.2 rewrites exactly that clause, so any reflow moving the wrap
leaves the misattribution intact while the grep returns 0. **Patch:** both needles line-joined
(`tr '\n' ' '`) and case-insensitive (`-ciF`), plus a **NEW-present** half (`/red-team` ≥ 2) — an
absence-only pair also passes on a wholly deleted clause. ADR citation counts (7 space-form + 2
hyphenated `pre-ADR-0043`) were recounted and **match the plan as written**.

### 4. End states 1, 2 and 7 are vacuous (Major; executed, confirmed)

All three name `node --test skills/red-team/assets/workflow-scaffold.test.mjs` as their **only** check.
That suite is green at base (74/74) and every new pin is an *addition to it*, so no check distinguishes
"Task 1.6 landed" from "Task 1.6 skipped". ES2 is additionally near-tautological — the `FINDINGS`
literal already declares no `adjudicated` key. **Patch:** base-red floors added to each, every one
verified to read **0** at base: `adjudicated` ≥ 2 and `deliberate` ≥ 1 in `workflow-scaffold.js`;
`CONTEXT_PATH`, `CAMPAIGN_PATH`, `Precedence:`, `(a) Proceed`, `five surfaces` ≥ 1 each in the suite.

*(This is the same class the Lead's own ES16/17 defect hit in plan 5 — a file-level grep or suite run
satisfied by something other than the work it is meant to pin. It now gets a dedicated probe.)*

### 5. The evicted entries' pointer pairs carry no drift guard (Major, needsDecision; ADR 0025)

Each eviction mints a hand-copied cross-file fact — the residue's destination path plus the per-term
heading it promises — with no guard anywhere in the plan. The repo already has the exact idiom (D28).
**Patch:** new **D18** design row + **End state 16**; Task 1.1 gains
`skills/war/assets/skill-doc-contracts.test.mjs` and authors a **D30** row asserting both halves per
term. It rides in Task 1.1 — the *same task* that authors the fact — so no `deps` edge is needed and
rule 7 is satisfied by construction.

### Also corrected (census truth, no behaviour change)

- **Note 2's "full census" omitted the D29-pinned trio** `Surface budget` / `Prose temperature` /
  `Trigger pointer` (the `### Prompt-surface budgets` ADR-0042 mirror block, #1208). None was an
  eviction candidate, so nothing was at risk — but a *veto redirect* reaching for one would have red
  D29. Added to both Note 2 and D14's excluded list.
- **Note 2's "zero cross-file name references" half was false**: `stale prior attempt` is named on ~14
  lines under `skills/`, `near-miss diagnostic` on ~21 (including `schemas.md` prose, not "two code
  comments"). Conclusion unaffected — eviction keeps each heading + pointer, so every reference still
  resolves — but the census must not be read as asserting the names are unused.

## Adjudications

| # | Adjudicated value | Supersedes | Provenance |
|---|---|---|---|
| 1 | D14 strike list = **five primaries** (adds **Orphan adoption**, promotes **Near-miss diagnostic**) | the three-entry list + reserve | AI-declared (2026-08-16) — stays inside D14's preferred arm; the operator-gated fallback arm is **not** elected |
| 2 | A3 spans 1,401 / 1,052 / 696 / 987 / 728; net 4,290 B vs 3,563 B need | "≈1,412 + ≈1,377 + ≈1,683 … frees ≈4.2 KB against ≈3.0 KB" | AI-declared (2026-08-16), Lead-re-measured at `a489067` |
| 3 | `CONTEXT.md` base = 114,982 B, overage 3,366 B | 114,449 B / 2,833 B "expected unchanged" | AI-declared (2026-08-16) |
| 4 | ES8 greps line-joined + case-insensitive + NEW-present half | single-line `grep -cF` pair | AI-declared (2026-08-16) |
| 5 | ES1/2/7 gain base-red grep floors | suite-run-only checks | AI-declared (2026-08-16) |
| 6 | D18 / ES16 pointer-pair guard in Task 1.1 | no guard | AI-declared (2026-08-16), ADR 0025 |

## Residual risk (26 minors, auto-noted)

- The five-entry strike list leaves **727 B** of margin. Task 1.1 re-measures at its rebased base;
  a residual shortfall pulls a further unpinned cold entry before the operator-gated fallback arm.
- **New cross-plan contention:** D18 adds `skill-doc-contracts.test.mjs` to Task 1.1. Two plans
  sequenced *after* this one (`structural-pin-extractors`, `gate2-publication-guard`) also own it;
  both rebase onto the D30 row. No plan **ahead** touches it. The roadmap needs a contention row.
- D15's "re-anchor repo-root-relative links" instruction is near-vacuous: only **Dead-agent land
  failure** carries a markdown link (ADR 0005). Harmless as written.
- The manual same-scope survey halves of ES4/5/6/8/10 remain done-report-only evidence (gate-audit
  reads them SOFT) — unchanged by this pass, and legitimately declared in the backstops section.

## Verdict

**ADJUDICATED** — gate-emitted at rounds 1 of 3, `routeUpstream: false`, coverage whole (15/15 on
target, 0 dropped, 0 off-target). All 13 blockers patched in place and stamped `adjudicated: true`;
none was probe-re-verified, so the run terminates ADJUDICATED rather than CLEARED. Every patched
figure was re-measured by the Lead at `a489067` and every new base-red floor verified to read 0 at
base — but re-measurement is not a probe re-run, and the distinction is preserved deliberately.
