# Red-team report — 2026-07-16-aftermath-class1-gate-evidence

**Verdict: CLEARED** (CLEARED-WITH-NOTES after 2 grill→patch→re-verify rounds; 0 blockers,
0 needsDecision, all Minors auto-fixed).
Plan: `docs/plans/2026-07-16-aftermath-class1-gate-evidence.md`
Source spec: `docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md`
Artifact kind: `impl-plan`. Run: `--afk` (campaign 2026-07-16, plan 4/5).
**Base:** the STACKED base (plans 1+2+3 landed, tip `17f1eaa`) — required since CONTEXT.md is shared
with plans 1 and 3 at different named constructs.

## Attack surface

Round 0: 9 probes (6 spine + anchor-preconditions, baseline-repro, **git-semantics-proof**). The
git-semantics probe exists because the plan itself delegates that proof here: *"no committed test of
git's own semantics — the throwaway-repo proof is a /red-team probe."* Drift-guard spine probes:
`unguarded-new-mirror` vacuous; `default-flip-old-absent` covered by the plan's own red-pre-fix
criterion. Backstop-legitimacy: both entries legitimate (first-live-firing; dry-run stragglers).

## Executed proof (throwaway repos, git 2.50.1)

Confirmed **for** the plan: the `-d` refusal mechanism reproduces (a branch whose upstream is the
stranded pre-rebase SHA refuses `git branch -d` though its content is merged; `--unset-upstream` then
`-d` succeeds); `-d` post-unset re-verifies merged-into-HEAD and is refusal-noise/fail-closed from a
stale HEAD; `git cherry` emits all-`-` for a rebased-and-merged branch and `+` for a squash-merge
(proving the NOT-PROVEN asymmetry); baseline suites green (`war-pipeline-structure.test.sh`,
`version-slots.test.mjs`, lint 0); provably-red preconditions hold (`exact ref`/`git cherry`/
`--unset-upstream` = 0/0/0 in the aftermath SKILL; `merge-base --is-ancestor` present).

## Findings and resolutions applied

**Round 0 — BLOCKED (11 blockers / 3 needsDecision), 4 distinct defects, all patched:**

1. **The "row-scoped" drift check was not row-scoped (Major, proven false pass).** Both the
   co-location check and the keep-green pin keyed stage 1 on `merge-base --is-ancestor` — a token the
   plan's **own** Method item 2 mandates duplicating in the bucket comparator sentence. Because
   `skills/aftermath/SKILL.md` uses **unwrapped one-line paragraphs**, that sentence satisfies both
   greps on its own line: a fixture with a **byte-unamended gate cell** passed (exit 0). The
   whole-file keep-green pin was likewise unfalsifiable. **Fixed:** both now anchor stage 1 on the
   Class-1 table-row literal (unique, pre-existing, same physical line as the gate cell, never
   reintroduced by new prose). Re-verified: correctly RED on both fixtures.
2. **`git fetch origin <ref>` does not leave zero refs (Major, proven).** Since git 1.8.4 a normal
   clone's `+refs/heads/*:refs/remotes/origin/*` makes the command-line refspec trigger an
   **opportunistic remote-tracking update** — it creates `refs/remotes/origin/<ref>`. The plan's
   "updates only FETCH_HEAD, creates no refs" was false, and it violates the **user-confirmed**
   `aftermath-must-delete-its-own-probe-refs` objects-only discipline. **Fixed:** mandated form is now
   `git fetch --refmap= origin <ref>` (proven: FETCH_HEAD populated, **zero refs created**, sha usable
   by `git cherry`) at all 4 surfaces.
3. **Banned phrase misattributed + left live (Major, needsDecision — Lead-adjudicated).** The notice
   blamed the spec for "distinguishing it from truly un-merged work"; the phrase actually lives in the
   **lesson Task 1.3 edits**, which the plan would ENCODED-tag while leaving the banned claim in its
   body. Adjudicated to **(a)**: Task 1.3 gains edit **(c)** correcting that clause to the NOT-PROVEN
   asymmetry, made checkable in End state 7 (`grep -cF` = 0 post-fix, 1 pre-fix); notice attribution
   corrected. Rationale: the plan's own doctrine says *every* surface, the task already opens the
   file, and the point-in-time waiver covers specs — not a live hot `code-verified` lesson driving
   recall ranking.
4. **`has -- '<literal>'` call-shape drift (Minor).** The helper is `has(file, literal)`. **Fixed.**

**Round 1 — the Lead's own patch was incomplete (caught here, not shipped):** Method item 2 and End
state 2 were correct, but **Task 1.1's worker-facing Plan slice** and **Notes Q10** still *mandated*
the disproven bare fetch form — the exact "grep is a completeness floor, not a ceiling" failure.
**Fixed** at both, plus a Minor: the `_polish` guard was misattributed to the structure test (it lives
in `war-config.test.mjs`'s `sweptSurfaces`; the structure test has no `_polish` guard).

**Round 2 — CLEARED-WITH-NOTES (0 blockers). Six Minors, all auto-fixed:**
- **Invented git refusal string.** The taxonomy quoted `checked out at <path>` — git 2.50.1 emits
  `error: cannot delete branch 'X' used by worktree at '<path>'`; the quoted literal appears in **no**
  `git branch -d` refusal. Load-bearing because this plan's premise is *skill prose is the executable
  behavior*. Fixed at all 4 surfaces to git's real strings.
- **False review-floor rationale.** End state 3 claimed the `grep -F 'git branch -d'` floor "rides the
  `--unset-upstream`-pinned subsection", but the plan's own gate cell also carries that token, so the
  floor stays green with the whole recovery subsection reverted. Fixed: it is a **whole-file review
  floor only**; `--unset-upstream` is the sole mechanical pin (proven RED on a reverted fixture) —
  and the criterion's block comment must say so, or it ships a source-comment-overclaim.
- Method item 3's keep-green description row-scoped to match End state 5; End state 7 made the
  Task 1.3(c) correction checkable; remaining `has 'literal'` shorthand normalized. (The last three
  were internal inconsistencies introduced by the Lead's own round-0 patches.)

## Residual risk

The drift criterion locks tokens, not semantics (the doc-contract family's known ceiling, which the
plan concedes); backstop 2 (the /red-team prose read) is the semantic half.

## Adjudications

| Decision | Adjudicated value | Supersedes |
|---|---|---|
| Lesson negative-arm (needsDecision) | **(a)** — Task 1.3(c) corrects the lesson clause in-diff | the plan's "body otherwise untouched" + the spec-scoped point-in-time waiver |
| Probe-hygiene fetch form | **`git fetch --refmap= origin <ref>`** | the grill's Q10 bare `git fetch origin <ref>` (disproven) |
| Refusal-taxonomy string | **`used by worktree at '<path>'`** | the draft's `checked out at <path>` (emitted by no git refusal) |
| Row-scope anchor | the Class-1 table-row literal | `merge-base --is-ancestor` (proven false-pass) |
