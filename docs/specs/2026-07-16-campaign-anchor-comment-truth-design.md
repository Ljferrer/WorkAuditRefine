# Campaign anchor follow-through — true fail-open comments at the landed sites, and a git-free fixture-root guarantee in the hook suite

Date: 2026-07-16
Status: draft (memory-mined, claims re-verified against the live tree and a live bare-repo probe 2026-07-16) — awaiting conversion

## 1. Context — the gap / problem

Source issues: #927, #928

Phase 1 of campaign-state-anchor (landed 2026-07-15, ADR 0016 amendment) put the ratified
`git rev-parse --path-format=absolute --git-common-dir` main-checkout anchor into
`hooks/inject-campaign-state.sh` and `resolveCampaignDir` in
`skills/war-campaign/assets/campaign-ledger.mjs`. Two follow-through gaps were mined from that
phase's servitor lessons; both are confirmed live and both trace to the same verified fact
about the probe.

**Issue #927 — the fail-open comments lie about bare repos.** All four comment spots at the
three landed sites — the anchor comment block above the `common=` capture line in
`hooks/inject-campaign-state.sh`; `resolveCampaignDir`'s leading block comment *and* its
catch-arm comment in `skills/war-campaign/assets/campaign-ledger.mjs`; and the
"Amendment (2026-07-15)" decision paragraph of `docs/adr/0016-campaign-compaction-survival.md` —
enumerate "git absent / not a repo / bare" as the cases where the probe *fails* and the caller's
root is left untouched. Re-verified for this spec (2026-07-16, live probe): inside a bare repo
the probe **succeeds** (exit 0) and prints the bare repo's own git dir, so the anchor reassigns
the root to `dirname(bare-git-dir)` — the success arm runs; nothing falls through. Today's
consumers degrade harmlessly (no `.claude/campaigns` markers at that dir, so behavior is still
fail-open *one level down*), which is why this was graded a nit at land. But the comment states
the idiom's contract, and a future caller copying it into a context where a bare-dir resolution
*does* carry the expected marker inherits a real mis-anchor from the wrong contract. Lesson:
`docs/learnings/git-common-dir-anchor-idiom-fail-open-gotchas.md` §1 (code-verified).

**Issue #928 — the hook suite's hermeticity is an accident, not a guarantee.** Since the anchor
landed, the hook probes git unconditionally against every root it is handed, so every fixture in
`hooks/inject-campaign-state.test.sh` is now git-probed. The suite builds everything under one
bare `mktemp -d` (the "Fresh hermetic workspace" setup block), which lands outside any repo on
macOS (`/var/folders`) and Linux CI (`/tmp`) *today* — but nothing asserts that. If a temp-dir
convention change ever placed `WORK` inside an ancestor git working tree, the anchor would
silently re-root the scan to that repo's main checkout and the injection-path cases (5–8, 10–11,
15–18) would fail far from the cause. Verified live: no `is-inside-work-tree` or equivalent
check exists anywhere under `hooks/`. Lesson:
`docs/learnings/git-probing-hook-requires-fixtures-outside-any-git-repo.md` (code-verified).

The two issues are one group because one verified fact drives both resolutions: the probe
succeeds in more places than the landed comments claim (bare repos included), and the correct
hermeticity assertion is therefore "the hook's own probe finds nothing at the fixture root" —
which covers bare ancestors exactly where a `--is-inside-work-tree` check reports confusingly
(verified: it prints `false` but exits **0** inside a bare repo).

## 2. Pivotal constraints

- **Zero behavior change.** The probe line in the hook, `resolveCampaignDir`'s logic, the
  `is_active` predicate, and ADR 0016's decision are all untouched. #927 is comment/prose truth;
  #928 is test-harness-only. Every existing test case (1–18) must pass byte-unmodified in its
  assertions.
- **The fail-open discipline itself is ratified and unchanged** — only the *description* of
  which cases engage it changes. "Git absent" and "not a repo" remain correct probe-failure
  cases; "bare" moves from the failure enumeration to a stated probe-success-but-harmless case.
- **macOS bash 3.2** for the test file; the suite stays cwd-independent and plain-bash. The new
  assertion must not introduce an ambient env knob (recorded trap:
  `docs/learnings/shell-test-suite-must-sanitize-ambient-env-var-convention-before-fixture-cases.md`).
- **Git may be absent.** Cases 1–11 are the non-git fallback coverage and case 14 shims git off
  PATH. The hermeticity assertion must pass when git is unavailable — probe failure *is*
  hermeticity (the hook then fails open everywhere).
- **Sanctioned carriers of the old wording exist and must stay.** The lesson file quotes the
  false enumeration in order to correct it; `docs/specs/2026-07-15-campaign-state-anchor-design.md`
  (§3 "Hook scan root" row) and `docs/plans/2026-07-15-campaign-state-anchor.md` carry it as
  dated point-in-time records the repo convention leaves uncorrected. Any wording sweep must
  treat these as allowlisted, not stragglers (recorded trap:
  `docs/learnings/release-blurb-describing-a-rename-trips-the-renames-own-absence-guard.md`).
- **Wrapped enumerations defeat single-line greps** — the plan file's copy of the enumeration
  wraps across a line break, the exact pattern recorded in
  `docs/learnings/misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep.md`.
  Every grep in §10 is a completeness floor, never a ceiling.
- Lesson-file edits must pass the fail-closed redaction lint (`war-memory.mjs lint`) and must
  not grow `description` frontmatter (projection byte budget is description-driven).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Reword form at block-comment sites | State the true contract, don't just delete the word: probe-failure cases (git absent, not a repo) leave the root untouched; bare/exotic layouts are a probe **success** that resolves to a marker-less dir, so consumers still behave fail-open one level down. Applies to the hook's anchor comment block, `resolveCampaignDir`'s leading block comment, and the ADR 0016 amendment paragraph. |
| Reword form at the one-line catch comment | Drop "bare" from `resolveCampaignDir`'s catch-arm comment; the corrected block comment immediately above the function carries the full bare story. A one-liner cannot honestly compress "succeeds but harmless" and must not re-assert the false failure claim. |
| ADR 0016 handling | In-place correction of the amendment's parenthetical. It is a factual description of git behavior, not a decision; the decision (fail-open discipline, main-checkout anchoring) is untouched. A second amendment to correct a parenthetical is ceremony — rejected. |
| Standing drift guard for the wording | None. A banned-pairing grep is defeated by line wrap and needs an allowlist for the lesson/spec/plan carriers; the corrected comments still legitimately contain the token "bare", so token-absence tests are impossible. Land-time verification grep + hand-scan (§10) instead. |
| Hermeticity assertion form | Assert the hook's **own probe** finds nothing at the fixture root: two-step capture form, `git -C "$WORK" rev-parse --path-format=absolute --git-common-dir` must fail or return empty. Rejected: `--is-inside-work-tree` (exits 0 printing `false` inside a bare repo — verified — so its exit code conflates "bare ancestor" with "inside a work tree", and a bare ancestor *is* a mis-anchor case for the hook's probe). The hook-probe form asserts the exact coupling and auto-tolerates git-absent (probe failure = pass). |
| Assertion placement & semantics | Fatal setup guard in `hooks/inject-campaign-state.test.sh`, immediately after the `cd "$WORK"` line and before case 1: on probe success, print one message naming `$WORK` and the resolved common dir, `exit 1`. Mirrors the suite's existing jq presence guard (fail-fast setup, not a numbered `ok`/`no` case) — if it fires, every subsequent case is invalid, so aborting is the honest semantic. |
| Assertion coverage | One check on `$WORK` covers all per-case roots: R1–R18 are subdirectories of `WORK` containing no git dirs of their own except the deliberate case-12/13 fixtures (`GMAIN`, `GWT`), which are *children* — git discovery walks upward, so child repos cannot re-root sibling fixtures. |
| `GIT_CEILING_DIRECTORIES` alternative | Rejected. Exporting a ceiling would *mask* an enclosing repo instead of asserting its absence — silently changing the behavior under test and hiding the very violation the assertion exists to report loudly. |
| Lesson-file handling | Both cited lessons gain a body-only instance-resolution note (site corrected / assertion landed, dated); neither is archived — both carry durable rules for future callers and both have inbound `[[wikilinks]]` (hub discipline: `docs/learnings/retiring-a-resolved-memory-must-check-inbound-links-hubs-stay.md`). Descriptions unchanged (projection budget). |
| Other hooks | No action. Verified: among `hooks/`, only `inject-campaign-state.sh` executes git against a caller-supplied root (`validate-auditor-git.sh` parses git command *text* from hook JSON; `warn-bash-write-scope.sh` pattern-matches command text). The durable "audit fixtures when a hook grows a git probe" rule stays in the lesson. |

## 4. Mechanics

**Hook comment (`hooks/inject-campaign-state.sh`).** In the anchor comment block above the
`common=` capture line, replace the final `FAIL-OPEN: git absent / not a repo / bare → …`
sentence with prose to the effect of: FAIL-OPEN: git absent / not a repo → probe fails,
`$root` is left exactly as resolved above. A bare/exotic layout is NOT a failure: the probe
succeeds and resolves `$root` to the bare git dir's parent, which carries no
`.claude/campaigns` — still fail-open, one level down. No executable line changes.

**Ledger comments (`skills/war-campaign/assets/campaign-ledger.mjs`, `resolveCampaignDir`).**
The leading block comment's "The probe FAILS OPEN: on any failure (git absent, not a repo,
bare) …" sentence gets the same two-part truth as the hook. The catch-arm comment becomes
`// git absent / not a repo — today's cwd-relative behavior` (bare removed; it never reaches
the catch). No executable line changes — the diff to this file is comment-only.

**ADR (`docs/adr/0016-campaign-compaction-survival.md`).** In the "Amendment (2026-07-15)"
decision paragraph, correct the parenthetical "(git absent, not a repo, bare → the scan root is
left untouched)" to name only the true failure cases and state bare's actual resolution in a
subordinate clause. Decision text otherwise byte-identical.

**Test harness (`hooks/inject-campaign-state.test.sh`).** After the `cd "$WORK"` line in the
"Fresh hermetic workspace" setup block, add the fatal guard (sketch — final wording at
implementation):

```sh
# HERMETICITY GUARD: the hook now git-probes every root (main-checkout anchor).
# If WORK sits inside ANY enclosing repo — working tree OR bare — the anchor
# would re-root fixtures to that repo and cases fail far from the cause. Assert
# the hook's own probe finds nothing here. Probe failure (incl. git absent) IS
# hermeticity. Cases 12-13 build repos INSIDE WORK deliberately — children
# never affect upward discovery from WORK.
if common="$(git -C "$WORK" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" && [ -n "$common" ]; then
  echo "FATAL: fixture root $WORK is inside a git repo ($common) — suite not hermetic"; exit 1
fi
```

The two-step capture form is deliberate — it is the idiom's own mandated form (lesson §2; a
composed one-liner masks failure as `"."`). Update the suite's header `HERMETIC:` comment in the
same diff to state the guarantee is now asserted, not assumed (comments must track code:
`docs/learnings/source-comment-lags-emitted-prompt-after-rewrite.md` discipline).

**Lessons (`docs/learnings/`).** `git-common-dir-anchor-idiom-fail-open-gotchas.md` §1 gains a
dated note that the three landed sites' comments were corrected (gotcha stays — it binds every
*future* copy of the idiom). `git-probing-hook-requires-fixtures-outside-any-git-repo.md` gains
a dated note that the latent coupling is now a structural guarantee in this suite (durable rule
stays for the next hook that grows a probe). Body-only edits; frontmatter untouched.

## 5. Surface changes

- `hooks/inject-campaign-state.sh` — anchor comment block only
- `skills/war-campaign/assets/campaign-ledger.mjs` — `resolveCampaignDir` block + catch comments only
- `docs/adr/0016-campaign-compaction-survival.md` — amendment parenthetical only
- `hooks/inject-campaign-state.test.sh` — fatal hermeticity guard + header `HERMETIC:` comment
- `docs/learnings/git-common-dir-anchor-idiom-fail-open-gotchas.md` — body-only resolution note
- `docs/learnings/git-probing-hook-requires-fixtures-outside-any-git-repo.md` — body-only resolution note

## 6. New domain terms (CONTEXT.md)

None — "main checkout", the `--git-common-dir` anchor, "fail-open", and "hermetic" are already
established vocabulary (survey-corps / war-machine / war / the parent campaign-state-anchor spec).

## 7. Recommended ADRs

None new, and no new ADR 0016 amendment — the in-place parenthetical correction (§3) is a
factual fix inside the existing 2026-07-15 amendment, with the landing commit as its record.

## 8. Open risks / implementation notes

- **The corrected wording still contains "bare".** Any reviewer or future guard checking this
  work must target the *claim* (bare listed as a probe-failure case) — never the token. A
  token-absence check would false-fail the fix itself.
- **The fatal guard's RED path is not exercisable in CI** without forcing `WORK` inside a repo
  (BSD `mktemp` ignores `TMPDIR`, and an override knob is rejected per §2). It is RED-proved
  once at implementation time by temporarily pointing `WORK` at a dir inside a git working tree
  and observing the abort before case 1; the done report records that probe. Gate-audit treats
  such uncommitted probe evidence as soft, per
  `docs/learnings/deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold.md`.
- **Comment-only discipline is checkable:** for the hook, the ledger, and the ADR, the diff must
  contain no executable-line changes — reviewable by inspecting the diff hunks directly.
- The parent spec (`docs/specs/2026-07-15-campaign-state-anchor-design.md`) itself carries the
  false enumeration in its §3 design tree — left uncorrected by the same point-in-time-record
  convention that protects it (and `docs/learnings/spec-context-band-statement-of-drift-survives-code-changes-uncorrected.md`).
  This spec is the correcting record.

## 9. Non-goals / deferred

- No behavior change to the hook, the ledger CLI, `is_active`, or any probe. No new test cases
  beyond the setup guard; cases 1–18 keep their assertions byte-unmodified.
- No edits to `docs/specs/2026-07-15-campaign-state-anchor-design.md` or
  `docs/plans/2026-07-15-campaign-state-anchor.md` (dated point-in-time records).
- No edit to the `skills/war-campaign/SKILL.md` composed one-liner illustration — that is
  lesson gotcha §2's separate concern, correct in its always-in-repo Lead context, and outside
  both source issues' scope.
- No standing banned-wording test (§3), and no `GIT_CEILING_DIRECTORIES` export.
- No hermeticity guards added to other hook suites — no other hook executes git against a
  caller-supplied root today (§3); the durable rule lives in the lesson.
- Neither cited lesson is archived or retyped.

## 10. Validation criteria

1. **False-enumeration sweep (floor + hand-scan).** Across the three landed files
   (`hooks/inject-campaign-state.sh`, `skills/war-campaign/assets/campaign-ledger.mjs`,
   `docs/adr/0016-campaign-compaction-survival.md`), a case-insensitive grep for `bare` yields
   no line — and, because the enumeration is known to wrap lines elsewhere, no *sentence* —
   that lists bare among the probe-failure / left-untouched cases. This grep is a completeness
   floor, not a ceiling: after it, hand-scan each file's full anchor/`resolveCampaignDir`/
   amendment comment scope for same-meaning stragglers phrased without the token, and list each
   one found as a survey-derived correction.
2. **Truth stated, not just falsehood removed:** at each block-comment site (hook anchor block,
   `resolveCampaignDir` leading comment, ADR amendment paragraph) the corrected text states that
   the probe succeeds under a bare layout and resolves to a dir carrying no campaign markers
   (fail-open one level down). Checkable by reading the three named scopes.
3. **Comment-only diffs:** the hunks touching `hooks/inject-campaign-state.sh`,
   `campaign-ledger.mjs`, and the ADR contain no executable-line changes.
4. **Suites green, unmodified assertions:** `bash hooks/inject-campaign-state.test.sh` passes
   all cases; `node --test skills/war-campaign/assets/campaign-ledger.test.mjs` passes;
   `bash skills/war-machine/war-pipeline-structure.test.sh` passes (criteria 9/9b check only
   `--git-common-dir` token presence in SKILL files, so the reword cannot trip them — verified).
5. **Hermeticity guard present and correctly placed:** the guard sits after the `cd "$WORK"`
   line and before case 1, uses the two-step capture form of the hook's exact probe, and aborts
   with a message naming both `$WORK` and the resolved common dir.
6. **Guard REDs on violation (one-time implementation probe):** with `WORK` temporarily pointed
   at a directory inside a git working tree, the suite aborts before printing `ok 1`; restored,
   it passes. Recorded in the done report (soft evidence by design, §8).
7. **Guard tolerates git-absent:** with the suite's case-14 `fakebin` shim prepended to PATH for
   the guard's probe (manual one-liner probe at implementation), the probe fails and the guard
   passes — asserting probe-failure-is-hermeticity survives a gitless environment.
8. **Repo-wide carrier audit (floor + hand-scan):** a repo-wide grep for the enumeration
   pairing (e.g. `not a repo, bare` / `not a repo / bare`, case-insensitive) matches only the
   sanctioned carriers: the two lesson files, the 2026-07-15 spec, and the 2026-07-15 plan.
   Same floor-not-ceiling rule as criterion 1: hand-scan grep-adjacent wrapped lines in any new
   match's file before ruling it sanctioned or corrected.
9. **Lessons annotated and lint-clean:** both cited lessons carry the dated body-only notes;
   `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0; neither lesson's
   `description` frontmatter changed.
