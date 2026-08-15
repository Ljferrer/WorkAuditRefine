# Red Team — 2026-08-06-shell-pin-helpers (2026-08-15)
**Verdict:** ADJUDICATED — every blocker patched in place; three Majors and two needsDecision are stamped `adjudicated: true` and remain listed (patched, not probe-re-verified), so the run terminates ADJUDICATED rather than a fake CLEARED.
**Rounds:** 1

Run under `/war-campaign --afk` (Lead self-adjudicating). Plan is its own source of truth (merged arm — Part 1 carries the decision record). `artifactKind: impl-plan`. Round limit 3 (`run.redteamRoundLimit`), `routeUpstream: false`.

## Attack surface

Spine: `claims-vs-reality`, `coverage-vs-source`, `intent-vs-plan`, `consistency-placeholders`, `dependency-feasibility`, `executable-proof`. Bespoke: `refactor-implementable-green`, `red-proof-missing-file-guard`, `red-proof-bound-i-control`, `red-proof-status-blurb-class`, `default-flip-old-absent`, `exit-contract-and-subshell-control`.

Executed in sandbox: 8 of 12 probes, each in a `git clone --no-hardlinks` sandbox — mandatory here because the Lead checkout is a **linked worktree** (`.git` is a file), where `cp -R` and bare `git worktree add` do not isolate. Coverage whole: **expected 12, onTarget 12, offTarget 0, dropped 0** — no `INCOMPLETE` arm. Fallback: none (`Explore` present; all analyzed probes dispatched on it).

Escape guard: pre-run snapshot 326 refs, post-run `--baseline` re-check **exit 0** — no probe-authored residue, no ref drift, no foreign deltas to triage.

Drift-guard spine probes (Lead-run): `unguarded-new-mirror` **vacuous** (file-local shell helpers; no inline mirror of a canonical export); `guard-split-deps-edge` **vacuous** (one task per phase; every guard travels in the task authoring its fact); `default-flip-old-absent` ran as an executed probe and **found blocker 3**. `ff-topology` **not triggered** — the plan anchors no merge-commit topology (its one `HARD at audit_sha` row is a commit-range read).

Backstop-legitimacy check: **passes.** All six entries name a concrete deferral reason plus runner and timing. End state 10's `HARD at audit_sha` form is justified, not box-ticking — the `<phase-base>..<tip>` range it needs does not exist at any task's own base (the recorded repo precedent for why per-commit citation cannot be a gate member). Section heading is not AI-declared, so no per-entry provenance Minor applies.

## Executed proof

- **The refactor is implementable exactly as written and lands green.** A full Part-1-only mock refactor in a sandbox: suite `exit 0`; ES2 census `strip_prose *[|<]` = 2; ES4 = 2/0; ES5 = 5; ES6 both = 0. All four backstop Red-proofs reproduced red as their rows claim.
- **`strip_prose` reads stdin** (bare `awk` with no file operand) — so the plan's core `_hit "$2" < "$1"` redirect-into-function mechanism is sound. Verified at the live base before any probe ran.
- **The #1362 vacuous-pass defect is real today**: `lacks`/`lacks_i` have no existence guard, and a renamed-away scanned surface yields a vacuous `ok - … lacks … (correct)`. The plan's guard converts it to a `MISSING FILE` not-ok with the exit-count contract intact.
- **The #1371 Status-blurb defect is real today**: a README carrying the literal only under `## Status` still satisfies the `has_i` pin; the migrated `has_i_stripped` pin correctly reds.
- **The `-i` control binds after the refactor**: `sed 's/grep -qiF/grep -qF/'` scoped to `_hit_i` reds a committed assertion. The plan's own mandated control line measures exactly 1 and 1.
- **D7 subshell isolation works on bash 3.2**: control (a)'s `fails` increment dies in the command substitution; a fully-passing suite still exits 0.
- **Live-base census (D11) re-measured by the Lead**: target file **byte-identical to the conversion base `6fff2ee`**; all five D6 twins have stripped-hit ≥ 1; retired count phrases 0/0; suite `exit 0`. The plan's green-by-construction claim holds — no stop-and-report condition.

## Findings

### Major
- **[Major] End state 6's retirement greps are case-sensitive** → both `check:` commands are case-SENSITIVE fixed-string greps over *prose comment* clauses — the exact sentence-case false-negative class this plan exists to fix inside the suite (D3 migrates the count asserts to `lacks_i` for precisely this reason). The plan applied the discipline to the suite's pins but not to its own checks. Evidence: a sentence-cased `Body mirrors lacks() …` scores **0** under `-Fc` and **1** under `-Fic`; a probe restored the retired wording re-cased *and* re-wrapped in a mock and both checks still reported the pass value while the suite exited 0 — a gate-audit seat would have attested End state 6 `met` on an unmet condition. Resolution: patched.
- **[Major] Purpose overclaims against its own Non-goals** → Purpose promised "a deleted pinned surface reds **every** absence pin against it", but `fm_lacks_key()` is a fourth absence pin on the same suite, reading through `frontmatter()` rather than `strip_prose()`, and stays vacuous after this plan lands — which the plan's own Context 8 and Non-goals concede. Purpose and Non-goals contradicted each other on the same scope. Evidence (Lead-reproduced with the live helper bodies): `fm_lacks_key /nonexistent/…` prints `ok - … frontmatter lacks … (correct)` with `fails=0`. Resolution: patched by narrowing Purpose, not by widening scope — see Resolutions.
- **[Major] End state 5's check is identity-blind** → a whole-file count of `has_i_stripped "` == 5 catches a SHORT migration (4/5) but not a SUBSTITUTION: migrating four D6 twins plus one non-D6 `has_i` pin holds the count at exactly 5 while leaving an enumerated twin un-migrated, and every mechanical check stays green. An old-absent `has_i "` count cannot discriminate either — measured 14 in both the correct and the substituted build. Resolution: patched.

### Minor
- **[Minor ×4, one defect]** D7 pins the control *helper* (`lacks_i`) but left control (b)'s real-file **target** as executor latitude, while End state 4 asserts a whole-file count of `lacks_i "$WAR_STRATEGY"` == 2. `$WAR_STRATEGY` is a live path var in the suite and a natural pick for a probe sitting beside the count-flip block — an executor choosing it makes End state 4 return 3 and red a *correct* refactor. Found independently by four probes (`claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`). Resolution: patched.
- **[Minor] End state 3's hedge pre-waived its own numbers** — "or the equivalent pipe-into-helper lines located by construct, if the worker's exact bytes differ" lets any byte deviation self-certify, so the row was not a mechanical gate. The probe measured the plan's own mandated line producing exactly 1 and 1, so the numbers were never the problem. Resolution: patched (hedge retired).
- **[Minor] No check discriminated the exit-count contract** — End states 1 and 7 both assert `exit 0`, which is identical whether `exit $fails` is preserved or replaced by a boolean `exit 0`/`exit 1`. Resolution: patched (structural pin added).
- **[Minor] End state 6 was OLD-absent only** — with no NEW-present twin, deleting the comment block outright passes green, violating the both-ways pairing this suite's own gospel-block comment mandates. Resolution: patched.
- **[Minor] Roadmap missing a mandated contention row** — A6/Note 5 claim the roadmap carries a `skills/war-machine/SKILL.md` read-side row against `war-strategy-mirror-guards`; only the test-suite row against `adr-doc-truth-sweep` existed. Resolution: patched (row added to the roadmap).

## Resolutions applied (grill decisions)

- **ES6 case-sensitivity** → both checks moved to `-Fic`, keeping the **full** phrases; a shortened anchor was rejected after measurement (`lacks_i wraps` scores 1 on a *correctly* rewritten banner = false-red; the full phrase scores 0). A **stated coverage ceiling** was added: no single-line fixed-string grep can catch a phrase re-wrapped at a different column, and since this task's deliverable *is* a comment rewrite, the mandatory manual survey is named the sole coverage for that vector → plan End state 6.
- **Purpose overclaim** → narrowed to "every **`strip_prose`-reading** absence pin (`lacks`, `lacks_i`, `has_i_stripped`)", naming `fm_lacks_key` as deliberately outside. Chosen over widening D2/ES1/Task 1.1 to guard `fm_lacks_key`: the plan made that a Non-goal with a stated reason (different read path, no recorded issue, loud `has()` pins on both its targets), so the defect was the ceiling's wording, not the scope → plan Commander's Intent → Purpose.
- **ES5 identity-blindness** → five identity-scoped greps added (each → 1), with the whole-file `== 5` retained as a no-extras cap. The `$MACHINE` pin is literal-qualified because that surface carries **6** `has_i` pins (measured) while the other four carry exactly 1. Validated: correct build → all five = 1 and cap = 5; the substitution attack → cap still 5 but the `$CONTEXT` identity check drops to **0 = caught** → plan End state 5.
- **D7 control (b) target** → real-file argument pinned to `"$AFTERMATH"`, a surface no exact-count End state greps; mirrored into both the D7 design-tree row and the Task 1.1 slice (both-surfaces law) → plan D7 + Task 1.1.
- **ES3 hedge** → retired; the numbers stand as written and a worker whose bytes differ must change the bytes, not the check → plan End state 3.
- **Exit-contract discrimination** → `grep -Fc -e 'exit $fails'` → 1 added to End state 7 (measured 1 at the base, line 493) → plan End state 7.
- **ES6 both-ways pairing** → NEW-present twin added as `grep -c '^#.*_hit_i'` ≥ 2 — **comment-anchored**, after a delete-the-feature trace showed the bare-token form passes vacuously (comments deleted → comment-line form 0 = reds; bare-token form 4 = passes). The weaker bare-token form was drafted first and corrected on that evidence → plan End state 6.
- **Roadmap row** → `skills/war-machine/SKILL.md` read-side contention row added (plans 4 ↔ 11, serialized by the 4 → 11 order-only spine edge) → `docs/roadmaps/2026-08-06-survey-batch-roadmap.md`.

## Adjudications

<!-- No authoritative value (version literal, release slot, or task instruction) was adjudicated this run. Every row below would carry its own provenance token; the block is intentionally empty and is a byte-identical no-op for the auditor prompts. -->

_None._ The version-slot literals in Phase 2 remain non-authoritative and resolve from the live slots at land time, unchanged by this run.

## Residual risk

- **The re-wrap vector on End state 6 is not mechanically closed.** A retired comment phrase restored at a different line-wrap column defeats any single-line fixed-string grep. The plan now states this explicitly and names the mandatory manual same-scope survey as its sole coverage — an honest ceiling, not a closed hole. The auditor re-runs that hand-scan at the pinned `audit_sha`.
- **`fm_lacks_key()` remains vacuous on a missing file** — now an accurately-scoped Non-goal rather than a contradiction. It is the natural seed of a follow-up issue if the class is confirmed as debt (the plan's own Non-goals bullet says exactly this).
- **A6's sibling-ordering claim is otherwise sound**: the spine edges (4 → 11, 4 → 14) and the test-suite contention row were verified present; only the read-side row was missing and is now added.
- Assumptions A1–A7 are self-adjudicated under `--afk` (no operator ratification this run). A1 (the symmetric `_hit` lands) and A5 (fixture routing) were exercised by the executed mock and hold; A3's five-twin scope is now enforced identity-wise by the patched End state 5.
- The four backstop Red-proofs stay deferred by design (mutation runs are uncommittable); the committed D7 controls plus the patched identity checks are the standing guards.
