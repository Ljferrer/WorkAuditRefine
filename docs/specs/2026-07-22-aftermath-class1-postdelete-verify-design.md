# Aftermath Class-1 post-delete residual-set verification — survivors vs. hold set after the batched remote delete

Date: 2026-07-22
Status: draft (Survey Corps) — awaiting /war-machine conversion

## 1. Context — the gap / problem

Source issues: **#987**

The Class-1 (stray WAR branches) remote-cleanup procedure in `skills/aftermath/SKILL.md` deletes
gate-passing remote refs via a batched `git push origin --delete` (the "Two populations, two
routes" paragraph in the acknowledged-stranded bucket names this as the in-run route), but no
surface instructs verifying the surviving remote ref set afterward. The observed near-miss
(recorded in the code-verified repo lesson
`docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`, third body
paragraph): a shell exclusion filter matched inside a piped `while read … done` subshell can
silently no-op, letting refs meant to be **held** flow into the delete batch — the deletion
succeeds, git prints success, and nothing flags the loss. The lesson's other two gotchas (the
per-ref gate rule, the `git cherry` patch-equivalence probe) were encoded into the SKILL by
`docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md`; that same encoding pass
recorded, in the lesson's dated 2026-07-16 line, that this third gotcha "is not encoded anywhere
and stays this lesson's standing warning" — verified still true against the live tree (no
`residual`/`hold set` token anywhere in `skills/aftermath/SKILL.md`).

In this plugin, skill prose *is* the executable behavior — the Lead runs Class-1 by reading it.
Every other destructive verb in aftermath fails loudly or fail-closed (`-d` refuses, gates report
needs-human); the batched remote delete is the one place a construction bug converts directly
into silent remote data loss. The fix is a mandatory post-batch verification: re-list remote refs
and diff the survivors against the intended hold set before the run may report clean.

## 2. Pivotal constraints

- **ADR 0027 invariant C3 is byte-sacred**: the Class-1 deletion gate (tip-reachable +
  PR-merged, derived per exact ref) is unchanged — verification runs *after* the batch and adds
  no deletion path, no retry path, and no new license. The four-class table's gate cell stays
  byte-unchanged; the structure test's row-scoped keep-green pin
  (`git merge-base --is-ancestor` inside the `| 1. Stray WAR branches |` row) must stay green.
- **Fail-closed doctrine unchanged**: a verification discrepancy is reported loudly and blocks
  the clean verdict; it never triggers an autonomous second delete batch.
- **Probe hygiene** ([[aftermath-must-delete-its-own-probe-refs]], and the SKILL's own
  "objects-only, zero refs created" clause): the verification must add no local refs.
  `git ls-remote` creates none by construction — the verification is hygiene-clean for free.
- **Aftermath has no test asset family** (ADR 0027 named residual): the only mechanical drift
  protection for its prose is `skills/war-machine/war-pipeline-structure.test.sh`. The new
  ratified clauses need pins there — per #987, inside the **existing** Class-1 gate-evidence
  block (banner comment currently citing the 2026-07-16 spec), not a new block.
- **Grep-guard discipline** (the block's own recorded conventions): prose clauses pin via
  `has_i()` on mid-sentence anchors; an anchor token must be **discriminating** — `ls-remote`
  appears 6× in the SKILL and is banned as an anchor (the recorded `git branch -d`
  review-floor class: a whole-file pin on a multiply-occurring token discriminates nothing).
  Every new assertion is temp-break-proven per the file's header convention
  ([[weak-test-assertion-passes-without-feature-being-exercised]]).
- **Same-commit lesson amendment** (#987): once the gotcha is encoded, the lesson's 2026-07-16
  dated line's "not encoded anywhere" claim becomes false — it is amended in the same commit,
  and `node skills/_shared/war-memory.mjs lint docs/learnings/` (the only thing CI runs) must
  stay green. Projection budget: `description` frontmatter is untouched (descriptions drive
  MEMORY.md bytes).
- **No agent-prompt surface is touched**: aftermath is Lead-executed prose with no `agents/*.md`
  or `workflow-template.js` counterpart, so the both-prompt-surface split rule does not bind
  this group (checked, not assumed).
- `skills/aftermath/SKILL.md` frontmatter (`disable-model-invocation: true`) is untouched —
  structure-test criterion 2 must stay green.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where the verification lives | One new subsection in `skills/aftermath/SKILL.md`, `### Class-1 remote deletes — post-batch residual verification`, placed after the "Class-1 local branches — the stranded-upstream `-d` refusal" subsection and before "### Class-4 join rule" — chronologically last among the Class-1 subsections, matching when the batch actually fires. Considered and rejected: a clause in the Interaction model (class-agnostic surface; the Class-1 pins and vocabulary live with the other Class-1 material) and a gate-cell edit (C3 forbids it — the cell is byte-sacred). |
| What the hold set is | The set-complement, not a re-classification: the run already derives the Class-1 candidate set from a `git ls-remote` snapshot (ref → SHA). The delete list is the gate-passing refs; the **hold set is every other ref in the snapshot** — needs-human, acknowledged-stranded, active/out-of-scope, protected, and non-WAR refs alike. Complement-by-exact-`refs/heads/` name (never substring, per the existing allowlist-matching rule) is the simplest set that catches any construction bug, because it re-derives nothing. |
| The verification itself | After the batched `git push origin --delete`, one fresh `git ls-remote --heads origin`, then a two-sided diff: (a) every hold-set ref still present by exact name — a missing hold-set ref is a **data-loss row**; (b) every delete-list ref gone — a survivor is a **failed-delete row**, reported, never silently re-batched. Hold-set SHA drift (e.g. master advancing mid-run) is informational, not a failure — presence is the invariant, concurrent pushes are normal. |
| The clean verdict | The run may not report clean — interactively or under `--afk` — until the two-sided diff is empty or every discrepancy row is in the report. A non-empty diff makes the run's verdict *verification-failed*, never *clean-with-a-footnote*. |
| Loss remediation | A data-loss row prints the pre-batch snapshot SHA and the ready-to-run restore command `git push origin <snapshot-sha>:refs/heads/<ref>` (valid while the objects survive). Interactively the restore executes only behind an operator confirm; under `--afk` it is printed, never executed — an unattended sweep must not grow autonomous ref-*creation* authority to compensate for its own delete bug, and a concurrent deliberate human delete must not be resurrected unreviewed. Fail-closed in the reporting direction, exactly like every other gate in the skill. |
| Root-cause construction advisory | One sentence alongside the verification: derive the delete batch by explicit set-difference of the snapshot against the hold set (sorted lists, `comm`-style), never by an exclusion match inside a piped `while read` subshell — naming the observed silent-no-op mechanism. Advisory (the verification is the backstop that catches *any* construction bug); the specific idiom is not mandated. |
| Drift-guard shape | Extend the existing "Class-1 gate evidence" block in `war-pipeline-structure.test.sh`: append a sub-comment citing this spec (criterion-9b precedent — self-describing, no renumbering) plus two `has_i()` pins on mid-sentence prose anchors unique to the new subsection — one for the survivors-vs-hold-set diff rule (working anchor: `hold set`), one for the clean-verdict rule (working anchor: `before declaring the run clean`). Both tokens verified zero-hit in the current SKILL (red pre-fix, discriminating); final anchor wording chosen at implementation against the landed sentences, mid-sentence position required. No new `has()` command pins: the only new command literal is `ls-remote` variants, banned above. |
| Lesson amendment shape | Amend the trailing clause of the lesson's existing 2026-07-16 dated line in place: replace "…is not encoded anywhere and stays this lesson's standing warning" with a clause recording that the residual-set verification was encoded 2026-07-22 into `skills/aftermath/SKILL.md` Class-1, citing this spec's path. One line stays one line; the third body paragraph itself stands unmodified as the mechanism record. Optionally add `residual-set hold-set` to `metadata.keywords` (retrieval-only; zero projection cost). Considered and rejected: appending a second dated line (redundant with the in-place amendment) and a `description` rewrite (moves projection bytes for no retrieval gain). |
| Scope of verification | Class-1 remote batch only. Local deletes (`git branch -d`) are per-branch and refuse loudly — no silent-batch mechanism exists. Classes 2–4 have no batched destructive remote verb of this shape (worktree reaps are local path ops; issue closes are per-issue gh writes). Non-goals below. |
| ADR | None new, none amended — ADR 0027's decision is untouched; verification is post-hoc evidence, not a gate change. |
| Mechanization | None — Class-1 stays Lead-executed prose over live git state (the ADR 0027 named residual stands, as re-ratified by the 2026-07-16 spec). |

## 4. Mechanics

**`skills/aftermath/SKILL.md`** — one new subsection, no other prose touched:

`### Class-1 remote deletes — post-batch residual verification`, carrying, in the SKILL's
one-line-paragraph bold-lead style:

1. *Snapshot and partition*: the pre-batch `git ls-remote` snapshot (already the source of the
   candidate set) is retained as ref → SHA; the hold set is its exact-name complement of the
   delete list — everything not being deleted, with no re-classification.
2. *The construction advisory*: build the delete batch by explicit set-difference against the
   hold set, never by an exclusion filter inside a piped `while read` subshell — the observed
   silent-no-op that motivates this subsection (cite the lesson's mechanism in one clause).
3. *The two-sided diff*: post-batch, one fresh `git ls-remote --heads origin`; every hold-set
   ref must survive by exact `refs/heads/` name (SHA drift informational), every delete-list
   ref must be gone (a survivor reports as failed-delete, never silently re-batched).
4. *The clean-verdict rule*: the run does not report clean — under any flag, including
   `--afk` — until the diff is empty or every discrepancy is a report row.
5. *Loss remediation*: a missing hold-set ref reports with its snapshot SHA and the
   ready-to-run `git push origin <snapshot-sha>:refs/heads/<ref>` restore; executed only behind
   an interactive operator confirm, printed-only under `--afk`.
6. *Hygiene note*: `ls-remote` creates no local refs — the verification honors the
   objects-only/zero-refs probe discipline by construction.

**`skills/war-machine/war-pipeline-structure.test.sh`** — extend the existing Class-1
gate-evidence block: sub-comment citing this spec, two `has_i()` prose pins (design tree), each
temp-break-proven (revert the subsection, watch both fail, restore). The block's existing four
assertions and the row-scoped keep-green pin are byte-untouched.

**`docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`** — the
in-place amendment of the 2026-07-16 dated line's trailing clause (design tree), same commit as
the SKILL edit; optional `metadata.keywords` append; `war-memory lint` green.

**`CONTEXT.md`** — one glossary entry (§6).

**Stale-claim sweep (token sweep + mandatory survey):** after the encoding lands, run
`grep -rn 'not encoded' docs/ skills/` and adjudicate every match against the new subsection.
Grep is a floor, not a ceiling — after the grep, hand-scan the **same-scope siblings**: the
source lesson's full body, the 2026-07-16 spec's §1 Context band and §9, and the
aftermath-adjacent lessons in both memory roots, for same-meaning phrasings ("standing warning",
"stays unencoded", "this lesson's warning") that encode the claim in different words and survive
the sweep silently; list each straggler as a survey-derived correction. Known adjudications now:
the 2026-07-16 spec's Context band is **deliberately left uncorrected** (dated spec Context
bands record drift as of authoring time — the repo's recorded convention,
[[spec-context-band-statement-of-drift-survives-code-changes-uncorrected]]); the lesson's dated
line is corrected by this spec's own amendment.

**Anchor-uniqueness sweep (token sweep + mandatory survey):** before finalizing the two `has_i`
anchors, grep each candidate token against `skills/aftermath/SKILL.md` and the test file to
prove zero pre-existing hits; then hand-scan the same scope — the Class-1 prose and the test's
gate-evidence block comments — for same-meaning near-collisions ("surviving refs", "what
remains", "left behind") that a later benign edit could introduce and thereby dilute the pin;
list any found as survey-derived corrections (reword the anchor or the sibling).

## 5. Surface changes

- `skills/aftermath/SKILL.md` — one new Class-1 subsection (post-batch residual verification)
- `skills/war-machine/war-pipeline-structure.test.sh` — two `has_i()` pins + sub-comment inside
  the existing Class-1 gate-evidence block
- `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` — one dated
  line amended in place (same commit as the SKILL edit); optional keywords append
- `CONTEXT.md` — one glossary entry

## 6. New domain terms (CONTEXT.md)

- **residual-set verification** — the mandatory post-batch Class-1 check: after a batched
  `git push origin --delete`, re-list remote heads and two-sided-diff the survivors against the
  pre-batch snapshot's hold set (the exact-name complement of the delete list). A missing
  hold-set ref is a data-loss row reported with its snapshot SHA and restore command; a
  surviving delete-list ref is a failed-delete row; the run is not clean until the diff is
  empty or fully reported. _Avoid_: trusting the delete loop's own exclusion filter; declaring
  a sweep clean on push success alone; auto-retrying a failed delete into a second unverified
  batch.

## 7. Recommended ADRs

None. ADR 0027's decision (allowlist = acknowledgement; C3 deletion bar byte-unchanged) is
exactly preserved — this spec adds post-hoc verification and reporting, no gate or license
change. No other ADR is grazed.

## 8. Open risks / implementation notes

- **Concurrent remote activity can false-positive both diff sides**: a human deleting a branch
  mid-run makes a hold-set ref vanish; a human pushing a new branch is invisible (not in the
  snapshot, checked nowhere). The report wording must say "missing vs. pre-batch snapshot", and
  the `--afk` print-only restore posture is exactly why the restore is not automatic. Noise-only
  error direction; acceptable.
- **The snapshot must be the same one the candidate set was derived from** — re-snapshotting
  between classification and batch would let the window swallow a discrepancy. The prose says
  "retained", not "retaken".
- **Anchor casing/position**: both `has_i` anchors must be mid-sentence phrases no planned
  wording adaptation places at a sentence boundary (the recorded sentence-case class); final
  tokens chosen at implementation against the landed sentences.
- **Failed-delete survivors are plausible** (permissions, protected-branch rules): the row shape
  must read as routine reporting, not an alarm — only the hold-set side is a data-loss signal.
- The subsection sits adjacent to ratified ADR 0027 wording — reuse the existing vocabulary
  ("exact `refs/heads/<ref>` name — never substring", "`git ls-remote` truth") rather than
  paraphrasing, so the SKILL keeps one voice and the exact-name rule is stated once per surface.

## 9. Non-goals / deferred

- **No change to the deletion gate**, the four-class table, `docs/aftermath/known-stranded.tsv`,
  or ADR 0027 (C3 byte-sacred).
- **No local-side residual verification** — `git branch -d` is per-branch and refuses loudly;
  no silent-batch mechanism exists. Deferred until a batched local delete verb ever appears.
- **No Class-2/3/4 analogue** — no batched destructive remote verb of this shape exists there.
- **No mandated shell idiom** — the set-difference construction is advisory; the verification
  is the backstop for any construction bug.
- **No mechanization** (script/floor/hook): Class-1 stays Lead-executed prose; the ADR 0027
  named residual stands.
- **No `description` frontmatter edit** on the lesson (projection budget; the existing
  `ENCODED (aftermath-class1-gate-evidence)` prefix remains accurate for what it names).
- **The 2026-07-16 spec's Context band stays uncorrected** — deliberate, per the recorded
  dated-Context-band convention (see the stale-claim sweep's adjudication in §4).
- **No autonomous restore under `--afk`** — printed-only, by decision (design tree).

## 10. Validation criteria

1. **Drift guard live:** `bash skills/war-machine/war-pipeline-structure.test.sh` exits 0 with
   the two new pins present **inside the existing Class-1 gate-evidence block**; temporarily
   reverting the new SKILL subsection flips the run to a nonzero exit with *both* new
   assertions failing — temp-break proof per the test file's own header convention.
2. **Keep-green untouched:** the block's pre-existing assertions — `has` on `git cherry`, `has`
   on `--unset-upstream`, the row-scoped keep-green `git merge-base --is-ancestor` pin, and the
   row-scoped `exact ref being removed` pin — all still pass, and `git diff` over the change
   shows the `| 1. Stray WAR branches |` table row byte-unchanged (C3).
3. **Subsection complete:** the new `### Class-1 remote deletes — post-batch residual
   verification` subsection contains, verifiable by prose read at /red-team backed by the §10.1
   grep floor: snapshot retention + exact-name complement hold set; the subshell-exclusion
   construction advisory; the two-sided diff (hold-set survival, delete-list absence, SHA drift
   informational); the clean-verdict rule naming `--afk`; the snapshot-SHA restore command with
   its interactive-confirm-only / `--afk`-print-only posture; the zero-local-refs hygiene note.
4. **Anchor discrimination:** each final `has_i` anchor token greps to exactly one region of
   `skills/aftermath/SKILL.md` (the new subsection); `grep -icF 'ls-remote'` confirms no new
   pin anchors on multiply-occurring tokens.
5. **Lesson amendment landed, same commit:** `grep -F 'not encoded anywhere'
   docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` returns no
   hits; the amended 2026-07-16 line names
   `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md`; the commit touching
   the lesson is the commit touching `skills/aftermath/SKILL.md`;
   `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
6. **Stale-claim + anchor sweeps executed with their manual surveys** (§4): sweep results and
   any survey-derived corrections recorded in the task's done-report; the 2026-07-16 spec left
   uncorrected by adjudication, not omission.
7. **Frontmatter untouched:** structure-test criterion 2 (`disable-model-invocation` on
   aftermath only, both frontmatter forms) still passes.
8. **Throwaway-repo demonstration** (/red-team executable-proof, never committed): a scripted
   temp repo with a `file://` remote carrying refs H (hold) and D (delete); a deliberately
   buggy piped `while read` exclusion filter batches both into `git push origin --delete`; the
   post-batch `git ls-remote --heads` diff flags H missing from the survivors, and
   `git push origin <snapshot-sha>:refs/heads/H` restores it at the snapshot SHA.
9. **Full shell suite green:**
   `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`
   exits 0.
