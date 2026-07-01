# Reconcile doc/spec prose with the authoritative contract and code — Design

**Status:** proposed — hygiene patch, targets **v0.8.12** (current is v0.8.11; operator confirms final version). **Severity:** low.
**Source:** GitHub #368, #385, #392.

## Problem — human-facing prose lagging behind an already-correct authority

Three prose-only drifts. In each, the code / canonical schema / sibling spec section is already correct;
only a summary sentence or bullet is stale. No code, test, or schema surface is touched.

- **#368 — SKILL.md return-shape bullet omits `aced`.** `skills/war/SKILL.md`'s Per-phase Refines bullet lists the
  Workflow per-phase return as `{ landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }`,
  dropping `aced`. The canonical contract in `references/schemas.md` ("Workflow per-phase return") **includes** `aced`,
  `assets/workflow-template.js` **returns** `aced` from both exit points, and the same SKILL.md `--ace` paragraph already
  cites "the `aced` list in the phase report". The summary bullet is the lone straggler.

- **#385 — submodule-support-design §5.6 contradicts §5.4.** §5.6 (`held:submodule-pr` lifecycle) ends: *"The
  pin-validity lens (§5.4) independently re-checks reachability — defense in depth against a wrong/forged fallback SHA."*
  §5.4 was reworded post-#310: the lens does **not** re-verify remote-reachability (reachability is "established upstream
  … not re-verified by an auditor `git fetch` (the read-only guard denies it)"); the lens only enforces the ledger
  SHA-match. §5.6 asserts a re-check the lens no longer performs — and, per §5.4, cannot. Sibling-section drift.

- **#392 — hygiene-sweep plan "existing 8 cases" quote is stale (still_valid:false).** An auditor Nit quoted a plan
  CONSTRAINTS string, *"Keep the existing 8 cases green"*, and asked to bump `8`→`9`. **That string does not exist at
  HEAD** — `docs/plans/2026-07-01-submodule-servitor-hygiene-sweep.md` has no CONSTRAINTS section and no case-count claim
  (`grep` → no match; plan committed once at 75d4d72, never edited). A second, optional Nit asked to note that
  `assert-no-submodule-mutation.test.sh` case 11 drops `.gitmodules` for the temp-break RED proof — but lines 424-427
  already document that removal's isolation intent. Both sub-nits are non-defects; the spec's job is to record the
  close-as-clean decision, not to edit anything.

## Decisions

- **D1 — #368: append `aced` to the SKILL.md return bullet.** In `skills/war/SKILL.md`, edit the Refines "returns `{ … }`"
  bullet (currently line 49): insert `aced` after `minorsFiled` to mirror `schemas.md` field order and the code returns —
  `returns \`{ landed, escalated, minorsFiled, aced, landResult, servitorResult, auditLog, landDecision }\``. One-token
  append; nothing else on the line changes. **Recommended** (no alternative — the contract and code are the authority).

- **D2 — #385: reattribute reachability in §5.6.** In `docs/specs/2026-06-29-submodule-support-design.md`, replace the
  false closing sentence of §5.6 — *"The pin-validity lens (§5.4) independently re-checks reachability — defense in depth
  against a wrong/forged fallback SHA."* — with a reattribution to the parties that actually own the check:

  > Reachability of the resulting SHA is guarded upstream — the Lead resume-time reconciliation (§6/L2) re-verifies it is
  > reachable on the submodule remote, and the refiner refuses an unreachable pin at land (§5.5); the §5.4 lens only
  > enforces the ledger SHA-match. Defense in depth against a wrong/forged fallback SHA thus comes from the reconciliation
  > + refiner checks, not the auditor lens.

  One-sentence swap. §5.4 is already correct; the §7 surface-change row for `war-auditor` makes no reachability claim, so
  nothing else moves. **Recommended.** Anchor the edit on the quoted sentence, not a line number — the section has churned
  and the finding's `:173` is already off by two in the worktree copy.

- **D3 — #392: close as not-a-defect, no edit.** The quoted plan prose ("existing 8 cases") is absent at HEAD, so there is
  nothing to bump from `8` to `9`; the auditor graded a string the committed plan never contained. The case-11 comment note
  is already covered by `assert-no-submodule-mutation.test.sh:424-427`. Close #392 with a note that (a) the quoted plan
  string does not exist at the committed tip and (b) the test comment already documents the `.gitmodules`-drop rationale.
  No file changes. **Recommended** — per ponytail, do not add belt-and-suspenders plan prose to a LOW dead nit.

## Affected files

- `skills/war/SKILL.md` — D1 (one-token append).
- `docs/specs/2026-06-29-submodule-support-design.md` — D2 (one-sentence swap in §5.6).
- *(#392 / D3: no file changed — close-as-clean.)*

## Alternatives considered

- **#368 — leave the bullet incomplete** — rejected: it silently disagrees with the canonical `schemas.md` return and the
  code, and its own `--ace` paragraph already references the omitted field.
- **#385 — delete the §5.6 sentence outright** instead of reattributing — rejected: the reader loses the (correct)
  defense-in-depth story; reattribution keeps the intent and points at the real owners.
- **#385 — instead reword §5.4 to match §5.6** — rejected: §5.4 is the authority (post-#310, guard-enforced); §5.6 is wrong.
- **#392 — edit the plan to add a "12 cases (9+3)" note** — rejected: no false claim exists to correct; adding redundancy
  to a landed plan for a dead LOW nit is make-work.

## Validation criteria

- **D1 (#368):** `grep -n 'returns \`{' skills/war/SKILL.md` shows `aced` between `minorsFiled` and `landResult`;
  the token order matches `grep -n 'aced' skills/war/references/schemas.md` (line 206) and both
  `return { … aced … }` sites in `assets/workflow-template.js`.
- **D2 (#385):** `grep -n 'independently re-checks reachability' docs/specs/2026-06-29-submodule-support-design.md` returns
  nothing; the §5.6 text now names the reconciliation (§6/L2) + refiner (§5.5) as the reachability owners, and no longer
  contradicts the §5.4 "read-only guard denies it" wording.
- **D3 (#392):** `grep -rn 'existing 8 cases' docs/plans/2026-07-01-submodule-servitor-hygiene-sweep.md` returns nothing
  (premise confirmed stale) — issue closed as not-a-defect, no diff.
