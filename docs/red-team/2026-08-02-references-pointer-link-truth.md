# Red Team — 2026-08-02-references-pointer-link-truth (2026-08-03)

**Verdict:** BLOCKED (advisory) — every root finding is patched in the plan and carries an adjudication row; the campaign proceeds per the ratified operator directive (`redteam-blocked-is-advisory-once-patched-and-adjudicated`). **Single round by explicit operator instruction** ("stop red-teaming after this round") — the bounded ≤2-round re-verify loop was deliberately not run; the patches are Lead-verified against live measurements rather than re-probed.

Source spec: [2026-08-02-references-pointer-link-truth-design](../specs/2026-08-02-references-pointer-link-truth-design.md).
Plan authored by `/war-machine --afk` (ADR 0014) — its `## AI-Commander's Intent` and AI-declared backstops had no operator ratification entering this pass.

## Attack surface

Spine (all six): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`.

Bespoke (4): `anchor-check-live-links`, `sweep-test-non-vacuity`, `deps-edge-and-red-by-construction`, `revert-doctrine-and-backstops`.

`ff-topology` not run — zero merge-topology anchors in the plan (token grep plus a hand-read of the evidence prose). `unguarded-new-mirror` vacuous — the plan introduces no inline mirror of a canonical export. `default-flip-old-absent` was folded into the bespoke set: the plan's header change *is* a default flip, and it is the source of finding 1.

Coverage: 10/10 on-target, zero off-target, zero dropped. 17 agents, 0 errors. Run `wf_814607bb-9c1`.

## Executed proof

- **Link census at the phase base** (the finding that drives half the report): `auditor-teach.md` **0** markdown links · `worker-servitor-edges.md` 1 link, 1 dead · `resume-and-recovery.md` 13 links, **8 dead** · `submodule-flows.md` 1 link, **0 dead**. All four carry a byte-identity claim in their header. `at eviction time` currently appears **0** times anywhere under `skills/war/references/`.
- Header default-flip: a lowercase mid-sentence reintroduction of the retired caveat left the plan-mandated guard **green** while the retired doctrine was live; the case-insensitive mid-sentence anchor catches it. The mirror-image also holds — retitling the NEW token to `**At eviction time**,` false-REDs a case-sensitive form.
- Retired-citation arm: reversing the two tokens inside the parenthetical passes a single-order guard green (control: the recorded order is caught, so the arm is order-bound, not vacuous).
- Task 1.3 sweep, built to spec and run: passes with the plan's edits applied; the pre-existing suites stay green.

## Findings

### Major

- [Major] **The header qualification clause is false for half the files it names.** End state 4 and Task 1.2 mandate one blanket clause — byte-identical at eviction time *"with link targets since rewritten (this pass)"* — across all four files. Measured: `auditor-teach.md` has **zero** links and `submodule-flows.md`'s single link already resolves, so nothing in either is rewritten. The plan would mint a **new false doc claim** in the very pass whose Purpose is to retire false doc claims. The plan even concedes it one bullet earlier for `submodule-flows.md`. Found independently by five probes. **Resolution:** per-file reasons — the full form only for `resume-and-recovery.md` and `worker-servitor-edges.md`; `auditor-teach.md` names the step-4 citation repair as its cause; `submodule-flows.md` gets the bare qualification.
- [Major] **The OLD-absent anchor is sentence-case brittle** — keyed on a sentence-initial capitalised fragment with no `/i`. Reproduced: the retired caveat comes back as a lowercase mid-sentence clause and the guard never fires. This is the same asymmetry class this campaign published one plan earlier (`lacks-case-sensitive-vs-has-i-presence-pin-asymmetry`), recurring immediately. **Resolution:** case-insensitive, mid-sentence-stable substrings for both halves; grep floor `grep -rin`.
- [Major] **The header-truth arm has no header-region extraction**, so a plan-conformant implementation is a whole-file substring check — green whenever the phrase appears anywhere, including body prose. Not hypothetical: this plan appends a new trailing section to `resume-and-recovery.md`, the same file the arm polices, whose mandated wording carries the phrase. A self-inflicted false green. **Resolution:** scope to the text preceding the first `## `, matching the extraction the sibling revert-doctrine arm already gets.
- [Major] **Two of the four reference files get no end-to-end hand-scan in any task**, and spec §10.3's specific duty (scan `auditor-teach.md` for further citations naming `SKILL.md` as a doctrine home) had **no plan home at all** — while backstop row 3 claimed the in-task hand-scans were this phase's coverage. **Resolution:** Task 1.1's straggler protocol extended to both files plus the §10.3 duty, with a mandatory done-report statement.
- [Major] **End state 7 — the plan's only `[SOFT by design]` condition and the only non-vacuity evidence for both new guards — had no backstop row**, while the End-state header claims SOFT conditions are "sanctioned via the backstops". That is the prose-waiver class ADR 0017 forbids. **Resolution:** fifth backstop bullet added with a named runner and a Lead spot-reproduce duty at phase close.

### Minor (auto-fixed in the plan)

The retired-citation arm is order-bound and the mirrored-order arm was left to "worker's judgment" in `## Open decisions` — two non-equivalent landed guards decided by a coin flip; **closed** as mandatory (case-insensitive alternation, parenthetical-scoped). Deviation 12's enumeration of which `../` links a scan-wide shape assert would RED is wrong in both directions (it names two links, only one of which matches the plan's own pattern, and omits `war-servitor.md`/`war-refiner.md` under the generic reading) — the conclusion (don't widen) is unaffected.

## Resolutions applied (grill decisions)

`--afk`: no operator; every decision is Lead-self-adjudicated per ADR 0014.

| Finding | Decision | Plan ref patched |
|---|---|---|
| Blanket header clause false for 2 of 4 files | per-file reasons, measured | End state 4, Task 1.1, Task 1.2 |
| OLD-absent anchor sentence-case brittle | case-insensitive mid-sentence anchors, both halves | End state 6(d) |
| Header-truth arm unscoped | header-region extraction (pre-first-`## `) | End state 6(d) |
| Hand-scan coverage gap + orphaned §10.3 duty | extend Task 1.1's straggler protocol | Task 1.1 |
| End state 7 SOFT with no backstop | fifth backstop row + Lead spot-reproduce | Deferred validations |
| Retired-citation order-bound | mandate both orders | `## Open decisions` (closed) |

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->

1. The header default-flip's OLD-absent assert keys on `/link paths inside the moved blocks/i` — **case-insensitive, mid-sentence-stable**, never the sentence-initial capitalised fragment; the NEW-present half is `/at eviction time/i`. Grep floor is `grep -rin`, never `grep -rn`.
2. Task 1.1's straggler protocol hand-scans `auditor-teach.md` and `worker-servitor-edges.md` **end-to-end** in addition to the two agent cards, and discharges spec §10.3's duty (further `SKILL.md`-as-doctrine-home citations in `auditor-teach.md`). Both outcomes are mandatory done-report statements even at zero stragglers.
3. The header byte-identity qualification is stated **per file**, never as one blanket clause: full form (rewritten link targets) only for `resume-and-recovery.md` and `worker-servitor-edges.md`; `auditor-teach.md` names the step-4 citation repair (it has **0** links); `submodule-flows.md` gets the bare at-eviction-time qualification (its single link already resolves and nothing in it is rewritten). Measured at the phase base.
4. The header-truth arm's `at eviction time` assert is scoped to each file's **header region** — the text preceding its first `## ` heading — never a whole-file substring check.
5. End state 7's demonstrated-RED evidence is covered by a **ratified backstop row** with a named runner; the Lead spot-reproduces one proof per guard at phase close before recording the phase landed.
6. The retired-citation arm guards **both token orders** in one case-insensitive parenthetical-scoped alternation. This is mandatory — `## Open decisions` bullet 2 is closed, not worker judgment.

## Residual risk

- **Single round by operator instruction.** The patches above were verified by the Lead against live measurements (the link census, the case-sensitivity reproductions, the header-region collision) but were **not** re-probed by a second adversarial round. Prior plans in this campaign each had 2–3 defects introduced *by* their round-1 patches; that class is unscreened here.
- Backstops are **AI-declared** (ADR 0014). Row 3's coverage claim was corrected this pass; the new row 5 is Lead-authored at red-team time.
- Backticked prose path citations (non-link) still have no mechanical guard — deliberately deferred (backstop row 3), now with honest coverage wording.

## Safety

- **A probe escaped its sandbox and it was caught by the guard.** The post-run escape guard exited **1** with six modified files and a moved `HEAD`. Diagnosed through the action-provenance gate: **probe-authored**, not foreign — the spine `executable-proof` probe applied the plan's edits and then *committed* them (`6e6256b`, author `RT <rt@probe>`, subject `sim: tasks 1.1/1.2/1.3`) onto the red-team worktree's detached HEAD.
- **Root cause is the hazard this campaign published one plan earlier.** `cp-r-and-bare-worktree-add-do-not-isolate-a-sandbox-from-a-linked-worktree-target`: the target is a linked worktree whose `.git` is a *file*, so a `cp -R` sandbox shares the real gitdir and any `git` command reaches back into the real worktree. The probe itself noticed mid-run ("`.git` link severed after discovering it resolved back to the protected worktree") — too late. I had warned the two bespoke probes about this explicitly; the **scaffold-generated spine probe got no such warning**, which is the gap. Plan 2's End state 18 fixes exactly this in the scaffold preamble, and it has landed but was not yet in the plugin-cache copy this run used.
- **Blast radius: zero.** `6e6256b` is an orphan — `git for-each-ref --contains` returns nothing, all four campaign branches sit at their correct SHAs, and `origin` was untouched (`master` `b4d2467`, plan 1 `71b4d70`, plan 2 `8eb6d1a`). The one `probe`-matching ref in the repo is the pre-existing `refs/heads/docs/aftermath-no-probe-residue`, not residue.
- **Contained and re-verified:** `git reset --hard 8eb6d1a` + `git clean -fd`, then the guard re-run to **exit 0** — containment is complete only when the guard re-runs clean, per the doctrine plan 2 just landed.
