# Standing-doc, release-prose & remedy-path truth sweep — make seven live doc/comment surfaces tell the truth their own code already enforces

**Issues addressed:** #1153, #1115, #1146, #1152, #1107, #1136, #1096.

## 1. Context — the gap / problem

Seven live surfaces state something the adjacent code, ADR, or procedure contradicts. All were
re-verified against the tree at this spec's authoring base; every claim below was re-read, not
inherited from the issue text.

- **#1153 (release prose, minor).** The live `README.md` `## Status` blurb (0.14.63) carries two
  overstate-scope claims, the 7th recurrence of the release-blurb overclaim family recorded in
  `docs/learnings/release-blurb-overstates-guard-semantics.md`: (a) "their `mkdtemp` scratch dirs
  leaked … on every error path" — false; `skills/lessons-learned/assets/seed-pack.mjs`'s cap-refusal
  `die()`s (cmdPack ~327, verifyTier 357/361, cmdEvict 455/458) fire **before** their `mkdtemp`
  calls (335, 364, 464), so those error paths never created a scratch dir; (b) "a prose-only
  reintroduction is red too" — the lock's own comment in
  `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` says the opposite: "(ii) is
  TOKEN-scoped — a set-then-thread revived under a different variable name … passes both asserts."
  The family has 7 recurrences and **no authoring-time guard surface**.
- **#1115 (ADR truth, minor).** `docs/adr/0019-target-derived-execution-values.md`'s Amendment
  no-chaining clause says a `baseline-proceed` re-dispatch that then fails `environment` "keeps this
  ADR's original soft `env-blocked` routing" — the one-site form. ADR 0040 §B (the authority it
  cites) splits by site: "(soft `env-blocked` / `held:land-failed`)" — merge site soft, land site a
  phase hold. The sibling surface (`skills/war/SKILL.md`'s `held:land-failed` bullet) already names
  both arms and is D21-locked; the ADR lags it.
- **#1146 (test-comment truth, nit).** The Task-1.2 banner comment in
  `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` (the "`(N)` numbering here is
  banner-scoped, as it is throughout this file (it restarts per banner …)" parenthetical) teaches a
  file convention that does not exist: numbering is file-global-monotonic (1)→(27) across every
  banner **except** the lessons-learned-seed banner — the sole restart and sole source of the 17–21
  collision the comment cites as evidence. The restart choice itself is plan-sanctioned; only the
  comment's generalization is false.
- **#1152 (test-comment truth, nit).** `skills/war/assets/provision-worktrees.test.sh`'s T2.9
  census comment still claims "route identity rests on (b)+(c)+(d) TOGETHER". Its own corrected
  premise (two **silent** exit-3 routes: the bare push-error branch and the post-push
  origin-readback mismatch) breaks that inference — (b)/(d) only exclude the *loud* and rc-guard
  routes. The real discriminators between the two silent routes go unnamed: (c)'s
  pre-receive-declined push probe (the push is rejected, so no post-push readback ever ran) and
  (e)'s origin-tip-unchanged assertion (a readback-mismatch route requires an advanced origin).
  Twice auditor-flagged, deferred to this pass.
- **#1107 (war-review doc gap, minor).** `skills/war-review/SKILL.md` §2 bans cross-summing a
  transcript-mined split against an envelope total (~20× apart on tool calls) but is silent on the
  **run total** when some phases carry a manifest `envelope` and others fall back to mined
  transcripts — realistic under the null-tolerated posture. §3's preamble mandates run totals and
  its two total rows read "manifest `phases[].envelope`, else mined" per phase, so a naive per-phase
  sum silently mixes sources and renders unlabeled. Zero hits for "mixed"/"every phase" in the file.
- **#1136 (remedy path, major — the one non-prose defect).** `skills/war/SKILL.md`'s Gate-2
  pre-push staged-file check detects a stale-staged docs commit and refuses to push, but its remedy
  ("do **not** push; run `remove-publication-worktree`, re-provision, and re-commit") never touches
  the branch ref. The poisoned commit is already on the working branch (the publication worktree
  holds that checkout, so committing there advanced it); re-provision cuts a fresh worktree that
  still carries it; the re-check probes only `HEAD` and passes on the new commit; the
  release-reverting content sits one `ensure-origin` from origin. Three auditor seats filed this
  independently. The D22 lock (`skills/war/assets/skill-doc-contracts.test.mjs`) pins only
  commit → `--name-only` probe → do-not-push → `ensure-origin`, so the remedy can regress to
  detect-only without a red test.
- **#1096 (escalation-signal residual, minor).** The incident (null `testPattern` on a pytest repo
  → floor rejects valid diffs → worker escalates `PLAN-DEFECT:` → two held cycles framed as a plan
  defect) is largely fixed at tip: Setup's test-floor-pattern proposal + `--afk` sanity floor +
  per-phase pending-proposal re-check exist in `skills/war/SKILL.md`, and the floor's near-miss
  stderr diagnostic (#1045/#1120) is threaded verbatim as `floor_diagnostic` by
  `workflow-template.js`. The residual: `agents/war-worker.md`'s escalation guidance offers exactly
  one classification token (`PLAN-DEFECT:`) and no config-mismatch alternative, so the next worker
  facing a pattern/config mismatch is still steered toward the wrong class.

## 2. Pivotal constraints

1. **Ordering: this spec builds on the sibling spec**
   `docs/specs/2026-07-26-dispatch-args-and-floor-coverage-design.md`. Shared files —
   `agents/war-worker.md`, `skills/war/SKILL.md`, and anything in the
   `workflow-template.js`/test-floor family — land there first; this spec's edits to those files
   must be authored against the sibling's landed state, and its plan must sequence after that
   plan in the campaign spine.
2. **Zero runtime behavior change.** Every change here is standing-doc prose, a source comment, or
   a doc-contract test regex. No engine code path, exit code, enum, prompt byte, or floor changes.
   (#1136's fix changes what the *operatorless Lead is instructed to do*, not any script.)
3. **Release-slot discipline (#1153):** `## Status` is a replace-in-place slot; the correction
   edits blurb prose only — the `0.14.63` version token and all four version slots stay
   byte-identical, and `skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor +
   README-undersell guard) must stay green throughout.
4. **ADR convention (#1115):** the superseded original Decision text in ADR 0019 is never
   retro-edited; only the Amendment's live-routing sentence is corrected, additively, mirroring
   ADR 0040 §B's own "(soft `env-blocked` / `held:land-failed`)" site split.
5. **Doc-contract idiom (#1136):** the D22 extension keeps the ONE-ordered-match key (never
   independent presence checks), the by-construct extraction (marker → next `##` heading), and
   markup tolerance on emphasis spans — per the existing D18/D21/D22 comments.
6. **Shared-branch doctrine carve-out (#1136):** `skills/war/SKILL.md` forbids
   `reset --hard` on shared branches. The undo target is an **unpushed** commit — the pre-push
   check just proved origin never saw it — in a transient Lead-owned worktree; the remedy prose
   must state this scope explicitly so an auditor doesn't flag a doctrine conflict.
7. **Every token sweep below is a completeness FLOOR** (war-strategy §2 rule): after each grep,
   hand-scan the target file's same-scope tests/comments and list each straggler as a
   survey-derived correction.
8. **Anchor by named construct, never line number** — line numbers rot across the serial merge
   queue; every locator below names a heading, banner, or sentence fragment.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #1153: fix now or at next Status replacement? | **In place now.** Prose-only edit of the live blurb; the family lesson records precedent (Recurrence 2 was corrected in place at Gate-2). Waiting for the next release re-opens the window for an 8th recurrence. |
| #1153: authoring guard — lint or checklist? | **Checklist, test-locked for presence.** Overclaims are semantic; no mechanical lint can judge them. A compact Status-blurb authoring checklist (distilled from the lesson's 7 recurrences) goes in `README.md` `## Releasing` — the section every Release task already reads — with a light presence lock in `version-slots.test.mjs`. |
| #1153(a) replacement wording | The lesson's own sharper form: scope the quantifier — "on every error path **that had already reached the scratch phase**" (or equivalent naming the pre-`try` cap refusals as the exception). |
| #1153(b) replacement wording | Repeat the lock's own scope word: the reintroduction claim is **token-scoped** — e.g. "a reintroduction that spells the retired token — even in prose — is red too"; never the unqualified "prose-only reintroduction is red". |
| #1115: fix shape | **Single additive phrase** in the Amendment's no-chaining sentence naming both sites, mirroring ADR 0040 §B: "keeps its pre-retry routing at that site — soft `env-blocked` at the merge site, `held:land-failed` at the land site". No new lock (ADR text is not currently test-pinned; the D21 lock on the SKILL.md sibling already guards the doctrine's operative surface). |
| #1146: fix shape | Mechanical reword of the one banner parenthetical: numbering is file-global-monotonic; the lessons-learned-seed banner is the sole (plan-sanctioned) restart and the source of the 17–21 collision; this banner also restarts at (1) per its own plan. No test — comments are not drift-guarded here, accepted residual. |
| #1152: fix shape | Reword the census inference: (b)+(d) exclude the rc-guard and loud-die routes; identity **between the two silent exit-3 routes** rests on (c) (the push is pre-receive-declined, so the post-push readback never ran) **plus** (e) (origin tip unchanged — the readback-mismatch route requires an advanced origin). No assertion changes — (b)–(e) already prove this; only the prose lied. |
| #1107: mixed-run rendering — labelled sum or `n/a`? | **`n/a (mixed-source)`.** A mixed per-phase sum *is* the cross-sum §2 already bans (~20× skew makes it disinformation, not approximation). Rule: the run-total cell for tool calls and tokens is envelope-sourced only when **every** phase carries an envelope; any mix renders `n/a (mixed-source)`. Per-phase cells keep their per-phase sourcing unchanged. |
| #1107: where the clause lives | One sentence extending §2's existing "never cross-summable against an envelope total" sentence, plus a source-note on §3's two total rows — anchored by those constructs, not line numbers. |
| #1136: undo verb | **`git reset --hard HEAD~1` in the publication worktree**, run *before* `remove-publication-worktree`, when `HEAD` is the just-authored poisoned docs commit (the normal case — the check fires immediately after the commit). If the working branch has advanced past the docs commit (crash-then-reentry shapes), `git revert` the docs commit instead — never rewind published or built-upon history. |
| #1136: lock extension | Extend D22's single ordered regex by one arm: commit → `--name-only` probe → do-not-push → **undo clause (reset/revert)** → `ensure-origin`. One regex, same extraction, markup-tolerant. Temp-break proof required (delete the undo clause from a fixture copy → red). |
| #1136: other surfaces | None to edit: the Checkpoint manual-land path delegates ("exactly as on the auto-landed path") to the same Gate-2 flow, so one edit site covers both. The sweep in §10 confirms no other surface restates the remedy. |
| #1096: fix shape | **One standing-doc paragraph** in `agents/war-worker.md`, adjacent to the existing `PLAN-DEFECT:` paragraph: when the observed failure is a floor/tooling **config mismatch** — e.g. a threaded `floor_diagnostic` naming the active test-pattern set and suggesting `--pattern` / `overrides.testPattern` — the root cause is run configuration, not the plan: return `status: "blocked"` quoting the diagnostic verbatim in `blocked_reason`, **without** the `PLAN-DEFECT:` prefix, so it routes to a Lead config check instead of a `/red-team` plan amendment. |
| #1096: dispatched-prompt mirror? | **Deliberately standing-doc-only.** The standing/dispatched split rule requires mirroring when a *behavior* must reach both surfaces; here the dispatched fix-round prompt already threads `floor_diagnostic` verbatim (#1045/#1120) — the prompt carries the evidence, the standing doc carries the classification rule. Record this asymmetry in the plan so an auditor sees it as chosen, not missed. |

## 4. Mechanics

### 4.1 README Status blurb + authoring checklist (#1153)

- In the live `**0.14.63**` paragraph (item **(4)**), apply the two scoped rewordings from §3.
  No other byte of the blurb changes; the leading `**0.14.63**` token is untouched.
- Insert a `### Status-blurb authoring checklist` subsection inside `## Releasing`, before
  `## Status`, distilling the lesson family (~6 bullets): (1) before "every/all/never/X-is-Y-too",
  confirm the enclosing scope word bounds every instance the absolute covers; (2) if the guard's
  own comment declares a narrower scope (e.g. "TOKEN-scoped"), the blurb repeats that scope word;
  (3) describe a guard's trigger surface (the diff property), never repo topology; (4) a
  conditional side effect is "prints X **when** Y", never bare "prints X"; (5) "No behavior
  change:" only when literally none shipped — otherwise name the scope ("No routing or enum
  change:"); (6) a trailing appositive ("…, itself unchanged") restates its subject. Cite the
  lesson slug as the running provenance.
- `version-slots.test.mjs` gains one presence lock: the `## Releasing` section (extracted by
  construct: heading → next `##`) contains the checklist heading and at least one distinctive
  anchor token. It must not disturb the existing undersell guard's extraction.

### 4.2 ADR 0019 Amendment (#1115)

Replace the clause "keeps this ADR's original soft `env-blocked` routing" (inside the
"**Live routing.**" paragraph's no-chaining sentence) with the two-site form resolved in §3. The
following "Exhaustion routes by site" sentence already models the wording; keep the amendment's
no-retro-edit convention — the change is confined to the Amendment section.

### 4.3 Comment rewords (#1146, #1152)

Pure comment edits per §3; zero assertion, fixture, or expected-value changes in either file.
Both suites must pass byte-identically in behavior (`node --test` for the `.mjs`,
`bash provision-worktrees.test.sh` for the shell suite).

### 4.4 war-review run-total rule (#1107)

- §2: extend the sentence ending "never cross-summable against an envelope total" with the
  run-total clause: a run total for tool calls/tokens is envelope-sourced only when every phase
  carries an envelope; any envelope/mined mix renders `n/a (mixed-source)`, never a silent sum.
- §3: annotate the "total tool calls" and "total tokens" rows' Source cells (or the table's
  preamble) with the same rule by reference, so the render instruction and the ban cannot drift
  apart.

### 4.5 Gate-2 undo step + D22 (#1136)

- In the Gate-2 flow's pre-push staged-file bullet, after "do **not** push", insert the undo
  step: in the publication worktree, `git reset --hard HEAD~1` (the poisoned, provably-unpushed
  docs commit — the probe just listed it and origin has never seen it; this is the sanctioned
  exception to the no-`reset --hard` doctrine, scoped to an unpushed commit in the transient
  Lead-owned publication worktree), or `git revert` it if the branch has advanced past it; then
  `remove-publication-worktree`, re-provision, and re-commit as today.
- Extend D22's ordered regex with the undo arm between the do-not-push clause and
  `ensure-origin`; update the D22 banner comment's ordered-span enumeration in the same commit
  (the comment currently enumerates four arms; see the release-blurb checklist item 1 before
  writing "five" anywhere).

### 4.6 Worker config-mismatch escalation (#1096)

Add the paragraph resolved in §3 to `agents/war-worker.md`, immediately after the `PLAN-DEFECT:`
paragraph (under "## Stop and escalate instead of guessing"). Also extend that section's
self-confound framing only if the new paragraph needs it — no other line of the file changes.

## 5. Surface changes

| File | Change |
|---|---|
| `README.md` | Two blurb rewordings in the live `## Status` paragraph; new `### Status-blurb authoring checklist` under `## Releasing` |
| `skills/war/assets/version-slots.test.mjs` | New checklist presence lock |
| `docs/adr/0019-target-derived-execution-values.md` | Amendment no-chaining clause → two-site form |
| `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` | Banner-comment numbering reword (comment-only) |
| `skills/war/assets/provision-worktrees.test.sh` | T2.9 census-comment reword (comment-only) |
| `skills/war-review/SKILL.md` | §2 run-total clause + §3 total-row source notes |
| `skills/war/SKILL.md` | Gate-2 pre-push remedy gains the undo step |
| `skills/war/assets/skill-doc-contracts.test.mjs` | D22 ordered regex + banner gain the undo arm |
| `agents/war-worker.md` | Config-mismatch escalation paragraph |

Untouched by design: `docs/learnings/release-blurb-overstates-guard-semantics.md` (memory files
are servitor/Gate-2 territory), all engine `.js`/`.sh` code paths, all four version slots.

## 6. New domain terms (CONTEXT.md)

None. ("Mixed-source run total" stays a local war-review rendering rule, not a glossary term.)

## 7. Recommended ADRs

None — #1115 corrects an existing amendment to match the ADR it cites; no new decision is made.

## 8. Open risks / implementation notes

- **#1136 residual — probe depth.** The pre-push check inspects only `HEAD`. A crash between a
  poisoned commit and its push, followed by a re-entry that commits again, leaves the poisoned
  commit at `HEAD~1` where the probe cannot see it. The undo step shrinks this window (the normal
  same-pass detection now rewinds instead of stranding) but does not close the crash shape;
  deepening the probe to every unpushed docs commit is deferred (§9).
- **D22 regex fragility.** The new undo arm must tolerate both verbs (`reset --hard HEAD~1` /
  `revert`) and emphasis reshuffles; pin on a stable token (e.g. `reset --hard` or an "undo" verb
  phrase) rather than the full sentence.
- **Checklist lock scope.** Keep the version-slots lock light (heading + one token). A heavy
  byte-pin would make every future checklist wording tweak a two-file change for no defect
  coverage.
- **#1146/#1152 are comment-only**: reviewers should verify the diffs contain no assertion
  changes (`git diff` hunks all inside comment lines).
- The sibling-spec ordering (constraint 1) means this spec's `skills/war/SKILL.md` and
  `agents/war-worker.md` hunks may need trivial rebasing over the sibling's landed edits; author
  them as construct-anchored insertions, not context-heavy patches.

## 9. Non-goals / deferred

- No mechanical lint for release-blurb prose (semantic judgments; the checklist is the guard).
- No deepening of the Gate-2 pre-push probe beyond `HEAD` (crash-window residual above).
- No edits to memory-root lesson files; the servitor records this sweep's outcome in its own pass.
- No worker-prompt (dispatched-surface) change for #1096 — deliberate, see §3.
- No renumbering of `lessons-learned-doc-contract.test.mjs` checks — the collision is
  plan-sanctioned; only the false convention claim is corrected.
- No change to ADR 0040 (it is already correct; ADR 0019 converges toward it).

## 10. Validation criteria

Each grep below is a completeness **floor**: after running it, hand-scan the target file's
same-scope tests/comments and list every straggler as a survey-derived correction.

1. **#1153(a):** `grep -c 'on every error path' README.md` returns 0, or every remaining hit
   carries the scratch-phase qualifier in the same sentence. Floor note: hand-scan the full
   `## Status` paragraph for other unscoped absolutes ("every", "all", "is red too") and list each.
2. **#1153(b):** `grep -c 'prose-only reintroduction is red' README.md` returns 0; the replacement
   sentence contains a token-scope word. Same hand-scan as (1).
3. **#1153 slots:** `node --test skills/war/assets/version-slots.test.mjs` green; the README
   version token is byte-unchanged (`0.14.63` at authoring base — re-resolve at land if a release
   has landed since); the new checklist lock goes red on a fixture copy with the checklist heading
   deleted (temp-break proof).
4. **#1115:** one sentence in ADR 0019's Amendment names both `env-blocked` and `held:land-failed`
   with their sites; `grep -n 'keeps this ADR.s original soft' docs/adr/0019-*.md` returns 0.
   Floor note: hand-scan the Amendment section for any other single-site restatement.
5. **#1146:** `grep -c 'restarts per banner' skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
   returns 0; the reworded comment states file-global-monotonic + sole-seed-banner-restart;
   `node --test` on the file green with zero assertion-line changes in the diff. Floor note:
   hand-scan every banner comment in the file for numbering-convention claims and list stragglers.
6. **#1152:** `grep -c 'TOGETHER' skills/war/assets/provision-worktrees.test.sh` returns 0 within
   the T2.9 census comment; the reword names the pre-receive-declined push probe and the
   origin-tip-unchanged check as the silent-route discriminators; `bash` run green with zero
   `expect`-line changes. Floor note: hand-scan T2.3/T2.6/T2.9's comments for other route-identity
   claims and list stragglers.
7. **#1107:** `grep -c 'mixed-source' skills/war-review/SKILL.md` ≥ 2 (§2 clause + §3 note);
   §2's clause contains "every phase". Floor note: hand-scan §3's full metric table for any other
   row whose run total could mix sources (e.g. wall-clock does not — manifest-only) and list any
   that need the same annotation.
8. **#1136:** the Gate-2 pre-push bullet contains the undo step between the do-not-push clause and
   the `ensure-origin` push; extended D22 green; D22 red on a fixture copy with the undo clause
   deleted (temp-break proof). Floor note: `grep -n 'remove-publication-worktree' skills/war/SKILL.md`,
   then hand-scan each hit's surrounding procedure (Setup step-2 crash-heal, Gate-2 step 0, the
   remedy itself, the Checkpoint delegation) for any restated remedy lacking the undo step; list
   stragglers.
9. **#1096:** `agents/war-worker.md` contains a config-mismatch paragraph that (a) names
   `floor_diagnostic` or the pattern-mismatch shape, (b) directs a plain `blocked_reason` without
   the `PLAN-DEFECT:` prefix; the existing `PLAN-DEFECT:` paragraph is byte-unchanged. Floor note:
   hand-scan the "Stop and escalate" section for any other sentence steering all blocks toward
   `PLAN-DEFECT:` and list stragglers.
10. **Whole-sweep regression:** `node --test 'skills/**/*.test.mjs'` and the anchored shell-test
    loop both green; `git diff` over the nine files shows no hunk outside the surfaces named in §5.
