# Prose-drift corrections — bash-not-node invocation snippets, docker-bullet classifier scope, land-isolation §5.3 push contract

Issues addressed: #741, #799, #804

Doc-only decision record: three prose surfaces state a mechanism differently from the landed code.
No behavior changes anywhere in this spec — every fix is a prose correction plus, where a
doc-contract test already covers the surface, a paired contract guard.

## 1. Context — the gap / problem

Three independent prose surfaces have drifted from the code they describe:

- **#741 (interpreter drift).** `skills/war/SKILL.md` prefixes every `provision-worktrees.sh`
  invocation with `node` (15 occurrences at survey time, 2026-07-12 — across Setup step 2, Gate-2
  steps 0/2, Checkpoint recovery recipes (a)/(b), the escalation-completion land, the
  recovery-relaunch runbook, and §4.4 bullet 6). The script is bash (`#!/usr/bin/env bash`); a Lead
  following the prose verbatim gets `SyntaxError: Invalid or unexpected token` on every Setup,
  Gate-2, and manual-land call. Loud and self-healing, but the riskiest exposure is the
  Checkpoint/escalation land recipes: a SyntaxError on `land-advance` tempts a Lead into the raw
  `git push` deviation those recipes exist to prevent. The `.mjs` helpers (`war-config.mjs`,
  `war-memory.mjs`) correctly use `node`; the other `.sh` assets (`gh-preflight.sh`,
  `assert-issues-filed.sh`) already correctly use `bash` — only `provision-worktrees.sh` is
  mislabeled today, but the defect class is "any `.sh` invoked with `node`".
- **#799 (mechanism misattribution).** The Setup step-3 "Daemon reachable" docker bullet in
  `skills/war/SKILL.md` ends with "This same signature list is what the gate-time classifier keys
  on". The platform-signature list (`EBADPLATFORM` / `no matching manifest for <platform>` /
  `exec format error`) governs only Setup-time per-image probe-build deferral. The actual
  gate-time `gate_failure_class` classifier (`classOf` plus the classification-base re-run prompt
  and the KNOWN BASELINE GATE DEBT path in `skills/war/assets/workflow-template.js`) keys on
  re-running the failing gate at the classification base and comparing failing identifiers — no
  gate-time code references the docker signature strings. The two mechanisms share only the
  `'introduced'` fallthrough, so the sentence is right on outcome, wrong on attribution. The
  originally-planned same-phase-close softening never landed.
- **#804 (superseded contract in a ratified spec).** §5.3 of
  `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` still shows the superseded CAS
  land mechanics: a bare-SHA push (`git push origin <merge-sha>:refs/heads/<working>`) and
  classifying a rejected push by the literal `non-fast-forward` string. The authoritative
  implementation, `cmd_land_advance` in `skills/war/assets/provision-worktrees.sh` (its header
  comment is the contract of record), pushes the named-source form `HEAD:refs/heads/<working>`
  and classifies solely on the `[rejected]` token with a 0/2/3 exit contract — red-teaming proved
  `non-fast-forward` is not reliably emitted for this push form. An agent wiring a caller off
  §5.3 would key on the unreliable token and misroute CAS losses between reland and escalate.

## 2. Pivotal constraints

1. **Doc-only — zero behavior change.** No shell script, engine, or hook logic moves. New test
   guards are validation additions, not behavior.
2. **Pair prose fixes with contract guards where the contract test exists.**
   `skills/war/assets/skill-doc-contracts.test.mjs` already guards `skills/war/SKILL.md` prose —
   both SKILL.md fixes (#741, #799) get a paired assert-OLD-absent guard there. No doc-contract
   test covers `docs/specs/`, so #804 is prose + pointer only.
3. **The CLAUDE.md pointer line is ratified byte-identical across surfaces — never reword it.**
   No sweep in this spec may touch CLAUDE.md.
4. **Historical records are not fix targets.** `docs/learnings/` files quote the #799 sentence
   and the #804 mechanics as provenance-bearing history; sweeps exclude `docs/learnings/`.
5. **Assert OLD absent, not only NEW present** (the default-flip authoring rule): each guard keys
   on the *stale* token's absence, because a presence-only check on the corrected wording misses
   future re-drift.
6. **Guard regexes tolerate sentence case and anchor mid-sentence** (the recorded
   prompt-only-clause-grep-guard lesson): case-insensitive, anchored on a clause fragment no
   legitimate rewording reproduces.
7. **Anchor by named construct, never line number** — line numbers in this spec are
   approximate, measured at the survey base (2026-07-12).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #741 fix scope | Replace the `node` prefix with `bash` on `.sh` invocations only; `.mjs` helpers keep `node`. Pure text substitution, no command semantics change. |
| #741 guard shape | One generic contract guard: no `node`-prefixed path ending `.sh` anywhere in `skills/war/SKILL.md` — covers `provision-worktrees.sh` today and any future `.sh` asset, instead of a script-name-specific check. |
| #799 fix shape | One-sentence in-place reword: scope the signature list to Setup-time probe-build deferral only, and state the gate-time classifier's real key (gate re-run at the classification base, failing-identifier comparison). Keep the shared-`'introduced'`-fallthrough fail-safe clause. |
| #799 guard shape | Assert the misattribution clause absent (`signature list is what the gate-time classifier keys on`, case-insensitive) — NOT absence of the term "gate-time classifier", which the corrected sentence legitimately still uses to deny the coupling. |
| #799 retained-clause truth | The reworded bullet may keep "the list lives here as prose with no structure test" only if it stays true — the new guard locks the *misattribution's absence*, not the signature list's contents, so the clause remains accurate; the reword must not claim the list is test-locked. |
| #804 fix shape | Rewrite §5.3's pseudocode annotations in place to the landed contract AND add a supersession pointer naming the `cmd_land_advance` header comment in `skills/war/assets/provision-worktrees.sh` as the contract of record (rewrite alone re-rots; pointer alone leaves live-looking wrong pseudocode — do both, pointer names the arbiter). |
| #804 non-ff mentions elsewhere in that spec | The design-rationale mentions of "non-ff rejection" (decision table, §3b prose, invariants) describe git's rejection *mechanism* — true and untouched. Only *classification-token* claims (key on the `non-fast-forward` string) are stale; the §4 survey adjudicates each match into one of these two classes. |
| Grouping | One phase-sized doc-precision pass; the three fixes touch disjoint files/sections and share validation machinery. |

## 4. Mechanics

### 4.1 `skills/war/SKILL.md` — interpreter sweep (#741)

Token sweep: grep `skills/war/SKILL.md` for `node` immediately invoking a path ending `.sh` (both
the `${CLAUDE_PLUGIN_ROOT}/…/provision-worktrees.sh` form and the `…/provision-worktrees.sh`
elided form — 15 matches at survey time), and replace the `node` prefix with `bash` on every
match. **Grep is a floor, not a ceiling: after the grep, hand-scan the full SKILL.md — every
section's prose, recipes, and inline code spans — for any other `.sh` asset invoked with `node`,
any prose *describing* a node invocation of a bash script, and any nearby comment/title that
restates the wrong interpreter; list each straggler found as a survey-derived correction in the
same change.** (Survey at spec time found `gh-preflight.sh` and `assert-issues-filed.sh` already
`bash`-prefixed and no prose stragglers, but the executing task re-surveys against its own base.)

### 4.2 `skills/war/SKILL.md` — docker-bullet reword (#799)

In the Setup step-3 "Daemon reachable" bullet (locate by the `EBADPLATFORM` construct, never by
line), replace the sentence "This same signature list is what the gate-time classifier keys on"
with a correctly-scoped statement: the signature list governs **only Setup-time per-image
probe-build deferral**; the gate-time `gate_failure_class` classifier (`classOf` in
`workflow-template.js`) keys on re-running the failing gate at the classification base and
comparing failing identifiers; the two share only the `'introduced'` fallthrough (retain the
existing fail-safe-fallthrough clause and its meaning). Token sweep: grep `skills/war/SKILL.md`
for `signature list` and `gate-time classifier` and handle every match — confirm no *other*
sentence couples the list to gate-time classification. **Grep is a floor, not a ceiling: after
the grep, hand-scan the whole Setup step-3 bullet list and the Checkpoint `gate_failed` routing
prose for any sibling sentence or comment restating the misattribution in different words, and
list each straggler as a survey-derived correction.** `docs/learnings/` quotes of the old
sentence are historical records — out of scope (constraint 4).

### 4.3 `skills/war/assets/skill-doc-contracts.test.mjs` — two paired guards

Add two tests beside the existing D-series doc-contract guards (same construct-anchored,
extraction-based style; no AST parser):

- **Interpreter guard (#741):** assert `skills/war/SKILL.md` contains no match of a
  `node`-prefixed `.sh` invocation (a regex over the whole file matching `node ` followed by a
  non-whitespace path token ending `.sh`). Assert-OLD-absent; `.mjs` invocations are untouched by
  construction.
- **Misattribution guard (#799):** assert the clause `signature list is what the gate-time
  classifier keys on` (case-insensitive, mid-sentence anchor) is absent from the whole file, AND
  that the "Daemon reachable" bullet (located via the `EBADPLATFORM` construct) still names the
  three platform signatures — so the guard fails loudly if the bullet is deleted outright rather
  than corrected (a vacuous-absence pass).

Each guard must be proven red before the prose fix lands in the same change (delete-the-feature
check: run the guard against the pre-fix SKILL.md text and observe failure), per the recorded
weak-test-assertion lesson.

### 4.4 `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` — §5.3 rewrite (#804)

Rewrite the §5.3 pseudocode block's `land-advance` annotations to the landed contract:

- push is the named-source form `git push origin HEAD:refs/heads/<working>` (HEAD *is* the merge
  SHA in the detached `_refinery`), never a bare-SHA refspec, never `--force`;
- classification is solely on the `[rejected]` token: exit `0` = accepted (or already-landed),
  `2` = CAS loss → reland loop, `3` = any other push error or readback mismatch → escalate —
  never key on the `non-fast-forward` literal (red-team-proved unreliable for this push form);
- the local follower `update-ref` advances only after push success plus the `ls-remote` readback.

Directly above or below the block, add a supersession pointer: "authoritative contract: the
header comment of `cmd_land_advance` in `skills/war/assets/provision-worktrees.sh`". Token
sweep: grep the spec for `non-fast-forward` and `<merge-sha>:refs/heads` and handle every match —
classify each as (a) stale classification-token/push-form claim → correct it, or (b) accurate
description of git's non-ff rejection mechanism → leave it (per the §3 resolution). **Grep is a
floor, not a ceiling: after the grep, hand-scan the spec's §3b, §5.3–§5.5, the invariants list,
and the red-team findings appendix for any other sentence, table row, or comment restating the
superseded bare-SHA push or token-classification mechanics, and list each straggler as a
survey-derived correction.**

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/SKILL.md` | `node`→`bash` on every `.sh` invocation (§4.1); docker-bullet sentence reword (§4.2) |
| `skills/war/assets/skill-doc-contracts.test.mjs` | Two new assert-OLD-absent guards (§4.3) |
| `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` | §5.3 pseudocode rewrite + supersession pointer (§4.4) |

Nothing else. No hook, engine, shell, or memory file changes. CLAUDE.md untouched.

## 6. New domain terms (CONTEXT.md)

None.

## 7. Recommended ADRs

None — no decision here changes architecture; #804 re-states an already-ratified contract
(`cmd_land_advance`'s push-first CAS) in the spec that originally proposed it.

## 8. Open risks / implementation notes

- **Guard false-trip surface.** The corrected #799 sentence still legitimately contains
  "gate-time classifier" (to *deny* the coupling); the guard must anchor the misattribution
  clause shape, not the bare term. Likewise the interpreter guard must match `node <path>.sh`
  invocations, not the words "node" and ".sh" merely co-occurring in prose.
- **The #799 reword must keep the retained fail-safe clause true** (see §3): after this change
  the signature list is still prose-only — the new guard locks the misattribution's absence, not
  the list contents.
- **Elided-path form.** Several SKILL.md recipes use `node …/provision-worktrees.sh` (ellipsis
  character); the sweep regex and the contract guard must both match that form, not only the
  `${CLAUDE_PLUGIN_ROOT}` form.
- **#804's spec is a historical decision record** — the rewrite corrects only the mechanics that
  a reader would wire a caller from (§5.3 + stragglers); the red-team findings appendix recording
  the *original* (superseded) design remains as history, adjudicated by the §4.4 survey.
- Line references in this spec are approximate at the 2026-07-12 base; every fix locates its
  target by named construct (§2 constraint 7).

## 9. Non-goals / deferred

- No change to `provision-worktrees.sh`, `workflow-template.js`, or any executable surface
  (sibling issues #801/#814/#815 own those and are out of this group).
- No structure-test lock on the docker signature list itself (the `'introduced'` fallthrough
  remains the guard, as the bullet states).
- No rewording of `docs/learnings/` historical quotes of either stale sentence.
- No sweep of other specs for superseded mechanics — #804 names one spec; a general spec-truth
  sweep is separate work.

## 10. Validation criteria

1. `node --test skills/war/assets/skill-doc-contracts.test.mjs` is green, and each of the two new
   guards was demonstrated **red** against the pre-fix prose (temporarily reintroduce one stale
   token per guard; observe the named failure; revert).
2. Re-running the §4.1 sweep (grep **plus its mandatory manual same-scope survey**) over
   `skills/war/SKILL.md` finds zero `node`-prefixed `.sh` invocations and zero surveyed
   stragglers; every `.mjs` invocation still uses `node`.
3. Re-running the §4.2 sweep (grep **plus its mandatory manual same-scope survey**) finds the
   misattribution clause absent; the "Daemon reachable" bullet still names all three platform
   signatures and now scopes the list to Setup-time deferral.
4. Re-running the §4.4 sweep (grep **plus its mandatory manual same-scope survey**) over the
   land-isolation spec finds §5.3 showing `HEAD:refs/heads/<working>`, `[rejected]`-token
   classification, the 0/2/3 exit contract, and the `cmd_land_advance` supersession pointer; no
   remaining instruction to classify on the `non-fast-forward` literal; class-(b) mechanism
   descriptions intact.
5. `node --test 'skills/**/*.test.mjs'` remains green (no behavior touched) and
   `node skills/_shared/war-memory.mjs lint docs/learnings/` is unaffected.
6. `git diff` for the change shows no edits to CLAUDE.md (pointer line byte-identical) and no
   edits under `docs/learnings/`.
