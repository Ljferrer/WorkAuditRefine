# Aftermath Class-1 gate discipline — per-ref SHA probes, git-cherry row evidence, and the unset-upstream `-d` recovery

Plan file: `docs/plans/2026-07-16-aftermath-class1-gate-evidence.md`
Source spec: [docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md](../specs/2026-07-16-aftermath-class1-gate-evidence-design.md)
Issues addressed: #926, #932
Stacks on: `docs/plans/2026-07-16-learnings-recipe-drift-sweep.md` — **queue position 4** in its campaign; expected integration base is the **working tip after learnings-recipe-drift-sweep lands, including its release bump** (ADR 0011 stack-and-plow), itself stacked on `2026-07-16-structural-test-integrity` (2) on `2026-07-16-land-failure-recovery` (1). Contention verified 2026-07-16, all three predecessor plans read in full:

- `skills/aftermath/SKILL.md` — **no predecessor names it** in any `Files:` list (plan 1 owns `skills/war/`+`skills/war-campaign/` prose and the stager/engine files; plan 2 owns the two workflow test files + `workflow-scaffold.test.mjs`; plan 3 owns `skills/war/SKILL.md` + `war-config.test.mjs`). Independent lane.
- `skills/war-machine/war-pipeline-structure.test.sh` — **untouched by all three predecessors** (verified by Files-list sweep; plan 2's census work lives entirely in `workflow-template.test.mjs`/`workflow-scaffold.test.mjs`). Independent lane.
- `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` — **file-disjoint from both lesson-touching predecessors**: plan 2 edits `glob-literal-fools-…` and `pt-tagged-…`; plan 3 edits only `process-recipe-lesson-body-…`. Plan 3's worked-example dry run **reads** this lesson (one of its six `ls-remote`-token hits, adjudicated exempt) — read-only, at plan 3's own dispatch tree, before this plan edits it; no interaction.
- `CONTEXT.md` — **shared, cross-plan serial**: plan 1 Task 1.5 adds two entries (**Staged phase script**, **Dead-agent land failure**), plan 3 Task 1.2 adds one (**Retired-token sweep**, after the **Phase-close coherence sweep** entry). This plan adds two entries at a **different named construct** (immediately after the **acknowledged-stranded** entry) and must **rebase over both predecessors' landed entries, neither modifying nor duplicating them**. **Roadmap-author note:** the campaign roadmap's shared-file contention table must carry `CONTEXT.md → plans 1 + 3 + 4` (plan 3's header already flags the 1+3 under-listing; this plan extends it — recorded here because a plan cannot edit sibling plans).
- Release slots — all four campaign plans bump the four slots, **serial by stack order**, each resolved from the **live slots** at land time (never a plan literal).

> **Adversarial-grill adjudication notice (2026-07-16; attribution corrected by /red-team, 2026-07-16):** two details are refined by this plan, reality winning. (1) The cherry framing **overstates the probe's negative arm**. **Attribution (corrected):** the verbatim phrase "distinguishing it from truly un-merged work" lives in the **source lesson** `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` (the spec §6 carries only a differently-worded variant, "distinguishes … from truly un-merged work") — and that lesson is in **this plan's own diff** via Task 1.3, so Task 1.3(c) now corrects the clause rather than leaving the point-in-time waiver (which covers specs, not a live hot `code-verified` lesson that drives recall ranking) to excuse it. The overstatement: a `+` line means patch-equivalence **not proven** — squash merges, conflict-resolved rebases, and split/joined commits legitimately change patch-ids — never "proven unmerged"; every surface below states the asymmetry (zero `+` ⇒ proven equivalent; any `+` ⇒ not proven ⇒ needs-human). (2) The spec's "one new criterion (three assertions)" grows to **four checks**: a keep-green pin on the pre-existing gate token (`git merge-base --is-ancestor`) so the amendment can never silently drop the old bar, and the per-ref prose anchor is **row-scoped** to the gate-cell line (a whole-file `has_i()` would prove presence-anywhere, the recorded `structure-test-check-f` mislocation class). The spec file stays uncorrected (point-in-time record; this plan + the grill record is the authoritative correction, per `redteam-adjudication-is-authoritative-version-source`).

## Commander's Intent

- **Purpose:** Both #926 and #932 are memory-mined doc gaps in the Class-1 (stray WAR branches)
  procedure of `skills/aftermath/SKILL.md` — and in this plugin, skill prose *is* the executable
  behavior: the Lead runs Class-1 by reading it, so a missing rule is a wrong procedure. Both gaps
  share one root mechanism: the /war refiner rebases task branches locally in the serial merge
  queue and **never force-pushes**, so a task branch's remote ref permanently keeps the worker's
  pre-rebase SHA while the local ref advances to the rebased tip that landed — "stranded" is a
  property of the **specific SHA probed**, not of the branch. (#926) The Class-1 evidence-gate cell
  never says which SHA to probe — the same branch reads STRANDED via its remote SHA and REACHABLE
  via its local SHA — and no aftermath surface carries `git cherry`, the cheap patch-equivalence
  probe that proves a gate-failing ref landed under a rewritten SHA, which is exactly the evidence
  ADR 0027 wants behind a `known-stranded.tsv` row instead of a recurring bare needs-human row.
  (#932) The documented procedure produces a wrong outcome on the *common* local-branch case: with
  an upstream set, `git branch -d` requires merged-into-**upstream**; every WAR task branch tracks
  its stranded pre-rebase remote tip, so a default-mode sweep hits `-d` refusals on branches
  provably in master (reproduced on all 6 affected branches, 2026-07-15) and the SKILL names only
  the `--scorched-earth` `-D` escalation — no correct route exists in prose. Close all three gaps
  with **prose-only encodings that keep ADR 0027's C3 deletion bar byte-unchanged**: nothing added
  here is a new deletion path — the cherry probe is evidence for an *acknowledgement*, and the
  unset-upstream recovery is *confounder-removal* that restores git's own merged-into-HEAD check.
- **Method:** Three edits, all within Class-1 material of `skills/aftermath/SKILL.md`. (1) The
  Class-1 evidence-gate cell (four-class table, row 1) gains **one appended clause** naming the
  per-ref rule **and the verb per action** — drafted cell (worker latitude within End state 1):
  current text + `; the gate is derived against the **exact ref being removed** — a remote delete
  (`git push origin --delete`) gates on the remote (`ls-remote`) SHA, a local delete
  (`git branch -d`) on the local SHA, never mixed`; one clause, no pipes/newlines, scoped to
  Class-1 **ref** deletions by construction (Class-2 reaps *paths*, not refs — its row is
  untouched). (2) The `### Class-1 acknowledged-stranded bucket` section gains the *why* (the
  serial-merge rebase + never-force-push stranding mechanism), the **population split** that keeps
  the SKILL's two existing remote-delete sentences from reading contradictory (gate-**passing**
  remote refs are deleted in-run by `git push origin --delete` — the scorched-earth section's
  "remote deletion stays in the default evidence-gated scope" refers to exactly this; gate-
  **failing** acknowledged-stranded refs are cleared only by the C3 manual push-delete outside the
  gates), the **comparator rule** (the freshly-fetched `origin/<working|landing>` ref is always the
  `merge-base --is-ancestor` comparator; the candidate side is the exact ref being removed), and
  the **cherry-probe paragraph** in mandated sentence order: mechanism → probe
  (`git cherry <landing-ref> <candidate-sha>` — **landing/upstream ref first, candidate second**;
  healthy output on a gate-failing ref is **non-empty, every line `-`-prefixed**; zero `+` among
  ≥1 `-` lines ⇒ every patch already in the landing branch by patch-id; **empty output is a
  suspect result** — re-check argument order / ref resolution, never a PASS) → **C3 restatement in
  the ratified vocabulary** ("evidence for a row, never a deletion license"; the existing C3
  paragraph stays byte-unchanged below, so probe prose never chains into a delete verb) →
  row-evidence convention (the probe locates/confirms `landed_pr` or substantiates the PR-less
  `note`, matching the tsv's existing commented reference-row shapes — e.g. "0-unmerged via git
  cherry vs <landing>, <date>"; **adding the row is a reviewed operator commit, never an in-run
  Lead write**; the tsv header/schema is byte-unchanged) → the negative arm: **any `+` line ⇒
  patch-equivalence NOT PROVEN** (squashes and conflict-resolved rebases change patch-ids — never
  read as proven-unmerged) ⇒ candidate stays needs-human, no row. Probe hygiene inline: fetch the
  landing ref first so the comparison matches `ls-remote` truth; if the candidate SHA's objects
  aren't local, **`git fetch --refmap= origin <ref>`** (the `--refmap=` empty-refmap form is
  **load-bearing, red-team-proven on git 2.50.1**: a bare `git fetch origin <ref>` in a normal
  clone performs an **opportunistic remote-tracking update** — since git 1.8.4 the command-line
  refspec is matched against `remote.origin.fetch`, and a full clone's `+refs/heads/*:refs/remotes/origin/*`
  matches every branch — so it **does create `refs/remotes/origin/<ref>`**; only `--refmap=`
  suppresses that and leaves FETCH_HEAD-only with **zero refs created**; fetching a raw SHA is
  server-config-dependent), leaving no new refs at all — not merely no
  `refs/remotes/probe/*` (the user-confirmed `aftermath-must-delete-its-own-probe-refs` lesson asks
  for objects-only, which the bare form does not deliver). Plus a one-sentence **pointer** to the recovery subsection (the same
  branch's local ref usually passes the gate — pointer, not a restatement). (3) A **new
  subsection** between the bucket and `### Class-4 join rule` (working title `### Class-1 local
  branches — the stranded-upstream -d refusal`): the merged-into-upstream rule and the WAR
  confounder; the recovery **sequencing bar in order** — evidence gate passes **on the local SHA**
  first (for a task/integration branch with no per-branch PR, the PR-merged half is evidenced by
  the **plan's landing PR** — campaign ledger PR#, or `gh pr list --search` per the Class-4
  fallback; tip-reachability on the exact ref stays the load-bearing per-ref half) →
  `git branch --unset-upstream <branch>` → `git branch -d <branch>`, run **from a checkout whose
  HEAD carries the landing content** (fetch first; the main checkout on the up-to-date default
  branch is the normal home — with a stale HEAD the failure mode is refusal-noise, fail-closed,
  never a wrong delete) — `-d` post-unset independently re-verifies merged-into-HEAD, **git's own
  second opinion, kept precisely because `-D` would discard it**. **Refusal taxonomy after
  unset:** a `error: the branch '<b>' is not fully merged` refusal is the genuine unmerged signal ⇒
  needs-human; a **`error: cannot delete branch '<b>' used by worktree at '<path>'`** refusal
  (**git's real string, red-team-verified on git 2.50.1 — the plan draft's invented "checked out at
  <path>" wording is emitted by no `git branch -d` refusal; classify on the string git actually
  prints**; note the same string also fires when the candidate is the sweep checkout's own HEAD
  branch, which under the stated checkout precondition cannot be a task branch, so the
  worktree-ordering reading holds) is a **worktree-ordering signal**, not an unmerged one (Teardown ordering
  normally reaps worktrees before branch deletes; a surviving needs-human worktree is the gap) ⇒
  branch + worktree report as one needs-human row; **never `-D` in default mode** for either. On
  every needs-human route after an unset, **restore tracking** (`git branch -u origin/<ref>
  <branch>`) — the sweep must not leave mutated config on rows it reports-never-touches.
  `git branch -d` is named as the **default-mode delete verb**; the **one-sweep asymmetry is
  stated once, here**. Drift protection reuses `skills/war-machine/war-pipeline-structure.test.sh`
  (aftermath has no test asset family — the ADR 0027 named residual): **one new named criterion,
  four checks** per the criterion-9b precedent — `has()` on `git cherry` and `--unset-upstream`
  (red pre-fix), a **row-scoped keep-green** pin on the gate cell's `git merge-base --is-ancestor`
  (the pre-existing bar can never silently drop), and a **row-scoped** case-insensitive co-location
  check piping the gate-cell row through the per-ref anchor (red pre-fix). **Both row-scoped checks
  pipe stage 1 from the Class-1 table-row literal `| 1. Stray WAR branches |`, never from
  `merge-base --is-ancestor`** — this plan's own comparator sentence duplicates that token on
  another line, and in this file's unwrapped one-line-paragraph style keying on it makes the
  co-location check pass with a byte-unamended gate cell and the keep-green pin unfalsifiable (both
  red-team-proven, 2026-07-16; see End state 5). No new ADR, no mechanization, no
  committed test of git's own semantics — the throwaway-repo proof is a /red-team probe. Lesson
  lifecycle: keep-hot **ENCODED-style** note (operator-ratified at the volley — the lesson's third
  paragraph, the shell-exclusion-filter/batched-push-delete gotcha, is *not* resolved by this
  plan, and plan 3's Mechanized precedent one queue slot earlier avoids `[RESOLVED]` archive
  candidacy for exactly this reason); description holds-or-shrinks. **#932's local-root lesson**
  cannot be a plan task — operator checklist item (its slug is already public: the committed spec
  names it).
- **End state:**
  1. **Per-ref gate clause live, verbs named** — the Class-1 evidence-gate cell carries the
     appended clause per the drafted cell text (exact ref being removed; remote delete
     `git push origin --delete` on the remote SHA, local delete `git branch -d` on the local SHA,
     never mixed), still one markdown cell (no new pipes/newlines), pre-existing cell text intact.
     Fallback if the refiner judges the row unreadable: the verb parentheticals may compress into
     the mechanism paragraph, but the anchor phrase and the never-mixed rule **stay in the cell**
     (the row-scoped check pins location). Proof: the row-scoped co-location check (red pre-fix —
     `exact ref` has zero hits at the authoring base) + the keep-green old-bar pin + temp-break
     runs.
  2. **Cherry recipe complete, asymmetry honest** — the bucket section carries: mechanism +
     population split (in-run delete of gate-passing refs vs C3 manual clear of gate-failing
     refs); comparator rule (freshly-fetched landing ref is always the `--is-ancestor`
     comparator); the probe with argument order stated (landing first, candidate second), healthy
     output shape (non-empty, all `-`), the **empty-output-is-suspect** rule; C3 restated in the
     ratified "evidence for a row, never a deletion license" vocabulary, existing C3 paragraph
     byte-unchanged; row-evidence convention with **operator-adds-the-row** ownership and tsv
     header untouched; the negative arm as **NOT PROVEN** (never proven-unmerged) ⇒ needs-human,
     no row; fetch-landing-ref-first + the `git fetch --refmap= origin <ref>` objects-only form
     (FETCH_HEAD only, **zero refs created** — the bare `git fetch origin <ref>` form is
     red-team-disproven: a normal clone's wildcard refspec makes it opportunistically create
     `refs/remotes/origin/<ref>`); the one-sentence pointer to the recovery
     subsection. Proof: `has "$AFTERMATH" 'git cherry'` mechanically (red pre-fix — zero hits across `skills/`
     `hooks/` `docs/adr/` today); semantics by the /red-team prose read (backstop 2).
  3. **Recovery ordering explicit, taxonomy complete** — the new subsection states in order: gate
     passes on the **local SHA** (with the task-branch PR-half meaning: the plan's landing PR) →
     unset-upstream → `-d` from a checkout whose HEAD carries the landing content (stale-HEAD
     failure mode = refusal noise, fail-closed); `-d` post-unset as git's independent
     merged-into-HEAD second opinion; the two-class refusal taxonomy keyed on **git's real strings**
     (`is not fully merged` ⇒ genuine unmerged ⇒ needs-human; **`used by worktree at`** — not the
     draft's invented "checked out at", which git never emits ⇒ worktree-ordering, one combined needs-human row,
     Teardown-ordering cross-reference); **mandatory tracking restore** (`git branch -u`) on every
     needs-human route after an unset; `-D` never the default-mode answer; `git branch -d` named
     as the default-mode delete verb. Proof: `has "$AFTERMATH" '--unset-upstream'` mechanically (red
     pre-fix); ordering/taxonomy by the /red-team prose read (backstop 2); `grep -F
     'git branch -d' skills/aftermath/SKILL.md` hits — a **whole-file review floor ONLY**
     (red-team-corrected 2026-07-16): the `git branch -d` token deliberately appears in **both** the
     Class-1 gate cell (End state 1's drafted verb parenthetical) **and** the recovery subsection, so
     this grep proves only that the verb is **named somewhere** — it stays green with the entire
     recovery subsection reverted and therefore **cannot** discriminate it. `has "$AFTERMATH"
     '--unset-upstream'` is the **sole mechanical pin** for the subsection (proven red on a
     subsection-reverted fixture). The criterion's block comment must state exactly this — a comment
     claiming the `-d` floor "rides the `--unset-upstream`-pinned subsection" would ship a false
     rationale (the recorded source-comment-overclaims class).
  4. **One-sweep asymmetry stated once, in the recovery subsection** — the local branch deletes
     via safe `-d` while the remote ref it tracked stays acknowledged-stranded/needs-human on the
     remote side (allowlisted per ADR 0027, cleared only manually); the bucket section carries
     only the one-sentence **pointer**, never a restatement. Proof: /red-team prose read
     (backstop 2).
  5. **Drift guard live, additive, temp-break-proven** —
     `bash skills/war-machine/war-pipeline-structure.test.sh` exits 0 with the new criterion
     (self-describing block comment citing this spec's slug — **no bare criterion number** that
     could collide with the original pipeline spec's numbering; header comment not renumbered).
     Four checks, exact bash-3.2-safe shapes: `has "$AFTERMATH" 'git cherry'`;
     `has "$AFTERMATH" '--unset-upstream'` (the helper's `grep -qF -e "$2" -- "$1"` form makes the
     leading-dash pattern safe — verified); the **row-scoped keep-green pin**
     `grep -F -e '| 1. Stray WAR branches |' -- "$AFTERMATH" | grep -qF -e 'git merge-base --is-ancestor'`
     (**deliberately not red pre-fix** — it locks the pre-existing bar in the **gate cell** against a
     silent drop); and the **row-scoped co-location block**:
     `grep -iF -e '| 1. Stray WAR branches |' -- "$AFTERMATH" | grep -qiF -e 'exact ref being removed'`
     (ok/not-ok + `fails` increment in the file's house style — red pre-fix, and red if the clause
     ever migrates off the gate-cell row; final anchor token chosen at implementation against the
     landed sentence, mid-sentence position required).
     **Both row-scoped checks MUST anchor stage 1 on the Class-1 table-row literal
     `| 1. Stray WAR branches |`, never on `merge-base --is-ancestor` (red-team-proven, 2026-07-16):**
     `skills/aftermath/SKILL.md` uses **unwrapped one-line paragraphs**, and this plan's own Method
     item 2 mandates a *second* line carrying `merge-base --is-ancestor` (the bucket comparator
     sentence, whose drafted wording also carries `exact ref being removed`). Keying stage 1 on that
     token would therefore (a) make the co-location check pass with a **byte-unamended gate cell**
     (a proven false pass — the comparator sentence satisfies both greps on its own line), and
     (b) make a whole-file keep-green pin unfalsifiable (deleting the cell's token leaves the
     comparator's copy). The table-row literal is unique to the gate row (verified: it and the
     is-ancestor token are the same physical line today) and is never reintroduced by the new prose.
     Reverting each of the three new SKILL
     clauses flips its check red; deleting the old bar token **from the cell** flips the row-scoped
     keep-green pin red — all four temp-break runs pasted as a `Red-proof:` block in the commit body
     per the file's header convention. Every existing criterion passes **unmodified**: verified at
     authoring that no existing assertion pins any byte of the current gate cell (grep for
     `merge-base`/`ls-remote`/`Tip reachable` across the test: zero hits), and the criteria that
     do read the aftermath SKILL — criterion 2 (frontmatter), criterion 3 (`dangerously
     destructive`, `--afk --scorched-earth`), the rename presence/absence pair — touch tokens
     these body-only edits neither move nor introduce.
  6. **Frontmatter untouched** — structure-test criterion 2 (`disable-model-invocation` on
     aftermath only, both frontmatter forms) still passes; all three SKILL edits are body-only.
  7. **Lesson lifecycle** —
     `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`'s
     `description` gains an `ENCODED (aftermath-class1-gate-evidence, 2026-07-16): ` prefix
     (operator-ratified; deliberately **not** a `[RESOLVED]` literal — the third paragraph's
     shell-exclusion-filter/batched-push-delete gotcha stays unresolved and the lesson stays out
     of `/lessons-learned migrate` archive candidacy, per plan 3's Mechanized precedent) with the
     remainder compressed so **post-edit description byte length ≤ pre-edit** (hold-or-shrink —
     descriptions drive the MEMORY.md projection budget); the body gains one dated line naming
     this spec and noting the third paragraph's gotcha as the live residual. **(c) Negative-arm
     correction (checkable — red-team adjudication 2026-07-16):** the lesson's second paragraph no
     longer reads `distinguishing it from truly un-merged work`; that clause now states the ratified
     asymmetry (zero `+` ⇒ patch-equivalence **proven**; any `+` ⇒ **NOT PROVEN** ⇒ needs-human,
     never "proven unmerged"). Proof: `grep -cF 'distinguishing it from truly un-merged work'
     docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` = **0**
     post-fix (it is **1** at the dispatch base — provably red pre-fix), and the Notes-Q8
     "corrected everywhere" claim is then true across this plan's own diff. Everything else in the
     body and all outbound wikilinks stay untouched. Inbound-wikilink
     check before the edit (hot root **and** `archive/`): **zero inbound verified at authoring,
     re-verify at dispatch**; **grep is a completeness floor** — hand-scan with named surfaces and
     adjudications: the `aftermath-*`/`stranded-*` lesson family (hot + archive) are the real
     straggler candidates; ADR 0027's citation of `[[aftermath-2026-07-03-stranded-remote-set]]`
     is a *different* lesson (not a straggler); MEMORY.md rows are a generated projection (never a
     straggler — regenerated, not hand-edited); plan 3's committed dry-run reference to this
     lesson is a point-in-time plan record (never corrected, corpus rule). MEMORY.md re-render is
     **operator-side**: `node skills/_shared/war-memory.mjs render-index --local
     "$CLAUDE_MEMORY_LOCAL" --repo docs/learnings` (`--repo` mandatory while `docs/learnings/`
     exists — the branch/PR row-drop trap), runner: operator at the next /lessons-learned or
     manual re-render. `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  8. **Glossary entries, asymmetry-correct** — `CONTEXT.md` carries **patch-equivalence probe**
     and **stranded upstream** in the house entry style, anchored immediately after the
     **acknowledged-stranded** entry; the probe entry states zero `+` ⇒ proven patch-equivalent
     (justifies a known-stranded.tsv row) vs any `+` ⇒ equivalence **not proven** ⇒ needs-human
     (**never** "proven unmerged" — patch-ids legitimately change under squashes and
     conflict-resolved rebases), never a deletion license (ADR 0027 C3); `_Avoid_` lines per Task
     1.2.
  9. **Full shell suite green** —
     `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`
     exits 0 (anchored to `hooks/` + `skills/`, never a repo-root find).
  10. **Release** — all four version slots bump in lock-step to the next free patch above the live
      integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified):** queue position 4 — the only shared file is `CONTEXT.md` (plans 1 and
  3, different named constructs; cross-plan serial overlap handled by rebasing onto the post-land
  tip, never a same-phase collision). `skills/aftermath/SKILL.md`,
  `skills/war-machine/war-pipeline-structure.test.sh`, and this plan's lesson file are untouched
  by every predecessor. Within this plan all Phase-1 tasks are file-disjoint.
- **Why one content phase:** every surface can land together; there are no cross-task symbol
  dependencies (Tasks 1.2/1.3 reference the new SKILL prose by named construct, annotated
  defined-but-not-yet-emitted), so Phase 1 runs as one wave, no `deps` edges. The SKILL edits and
  their drift guard interlock and are forced into one task (Task 1.1) — the guard travels with the
  fact it guards, same commit.

1. **Phase 1 — Class-1 per-ref gate, cherry row evidence, unset-upstream recovery, glossary,
   lesson note** (wave 1: Task 1.1 ∥ 1.2 ∥ 1.3, file-disjoint; no waves)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — Class-1 per-ref gate, cherry row evidence, unset-upstream recovery, glossary, lesson note

### Task 1.1: The three Class-1 SKILL edits + the structure-test criterion (coupled task)

- Files: `skills/aftermath/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: **First act: rebase onto the integration tip** (three predecessors' landings are on
  it; neither file in this task is touched by any of them — expected clean, re-verify at
  dispatch). Then, all edits within Class-1 material, per the Method's drafted wordings (worker
  latitude within the End-state checks):
  - **Evidence-gate cell (four-class table, row 1):** append the drafted per-ref clause (End
    state 1) to the cell whose current text is `Tip reachable from the working/landing branch
    (`git merge-base --is-ancestor` against `git ls-remote` truth); `gh pr view` = `MERGED``. One
    clause; the cell stays a single markdown cell; the pre-existing text (including
    `git merge-base --is-ancestor`) is byte-preserved — the keep-green pin polices this. The
    clause is scoped to Class-1 ref deletions by living in Class-1's row; Class-2 (worktree
    reaps — paths, not refs) is untouched.
  - **`### Class-1 acknowledged-stranded bucket` section:** the mechanism, population split,
    comparator rule, cherry paragraph in the mandated sentence order (mechanism → probe with
    argument order + healthy shape + empty-output-is-suspect → C3 restatement → row-evidence
    convention with operator-adds ownership → NOT-PROVEN negative arm → probe hygiene with the
    **`git fetch --refmap= origin <ref>`** FETCH_HEAD-only form (**the `--refmap=` is mandatory and
    load-bearing** — the bare `git fetch origin <ref>` is red-team-disproven on git 2.50.1: a normal
    clone's wildcard refspec makes it opportunistically create `refs/remotes/origin/<ref>`, which
    violates the objects-only discipline the `aftermath-must-delete-its-own-probe-refs` lesson
    requires; see Method item 2 and End state 2), and the one-sentence pointer to the recovery
    subsection — all per Method item 2 and End state 2. The existing C3 paragraph ("The allowlist
    is an acknowledgement, never a deletion license (C3)…") is **byte-unchanged**; the tsv is
    untouched.
  - **New subsection** between the bucket and `### Class-4 join rule` (heading level `###`;
    working title `### Class-1 local branches — the stranded-upstream -d refusal`): per Method
    item 3 and End state 3 — confounder, gate-first sequencing with the task-branch PR-half
    meaning, checkout precondition (HEAD carries the landing content; stale HEAD ⇒ refusal noise,
    fail-closed), the two-command recovery, the refusal taxonomy keyed on git's REAL strings
    (`is not fully merged` / **`used by worktree at`** — never the draft's invented "checked out at",
    which no `git branch -d` refusal emits; red-team-verified on git 2.50.1) with the worktree-ordering
    carve-out and Teardown-ordering cross-reference (that section itself untouched), the
    mandatory `git branch -u origin/<ref> <branch>` restore on every needs-human route after an
    unset, `-D` never in default mode, `git branch -d` named as the default-mode verb, and the
    one-sweep asymmetry stated once. One sentence notes `--unset-upstream`'s config mutation is
    harmless and restorable — the restore step is the mandated form of that restorability.
  - **The drift guard (`skills/war-machine/war-pipeline-structure.test.sh`):** one new criterion
    block appended after the rename prose-exclusion block, before the summary `printf`/`exit` —
    criterion-9b precedent: a **self-describing block comment citing
    `docs/specs/2026-07-16-aftermath-class1-gate-evidence-design.md`** (no bare number colliding
    with the original spec's criterion numbering; the top header comment is not rewritten),
    stating the casing rationale (`has()` for never-re-cased command/flag literals; the
    case-insensitive row-scoped pipe for the prose anchor), the keep-green status of the old-bar
    pin, and that `git branch -d` presence is a review-floor check riding the
    `--unset-upstream`-pinned subsection. The four checks exactly as End state 5 shapes them.
    **Red-proof duty:** the three red-pre-fix tokens verified absent at the authoring base
    (2026-07-16: `git cherry` / `--unset-upstream` / `exact ref` — zero hits in the SKILL; the
    first two zero repo-wide across `skills/` `hooks/` `docs/adr/`) — **re-verify at the dispatch
    base** (no predecessor introduces them), then temp-break-prove all four checks (three clause
    reverts + one old-bar-token deletion) and paste the runs as the commit-body `Red-proof:`
    block. **Grep-is-a-floor note:** the token-absence grep is a floor — follow with a manual
    read of the Class-1 region confirming no same-meaning per-ref/cherry/unset-upstream prose
    already exists under different tokens (verified none at authoring; record in the commit-body
    `Survey:` block). Also verified 2026-07-16 (record, no action): **zero deep links** to
    `skills/aftermath/SKILL.md#<anchor>` fragments exist repo-wide — the new heading is additive
    and can break no link.
- requiresTest: true (mapped evidence: the `war-pipeline-structure.test.sh` edit in this diff —
  matched by the test floor's unconditional `**/*.test.sh` arm, verified in
  `skills/war/assets/assert-test-in-diff.sh`)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: CONTEXT.md — the two glossary entries

- Files: `CONTEXT.md`
- Plan slice: Add two entries in the existing entry style (bold term + colon, short body,
  `_Avoid_:` line), anchored **immediately after the acknowledged-stranded entry** (named
  construct, never a line number):
  - **patch-equivalence probe** — `git cherry <landing-ref> <sha>` (landing ref first); zero `+`
    lines among ≥1 `-` lines ⇒ every patch already in the landing branch by patch-id — **proven
    equivalent**, the evidence a tip-reachability gate cannot produce, justifying a
    known-stranded.tsv row. Any `+` line ⇒ equivalence **not proven** (squashes and
    conflict-resolved rebases change patch-ids) ⇒ needs-human. Never a deletion license
    (ADR 0027 C3). _Avoid_: treating a zero-`+` result as permission to delete; reading a `+`
    line as proof of unmerged work; probing against a stale local landing ref; trusting an empty
    result (suspect — check argument order).
  - **stranded upstream** — a local branch's tracking ref pinned at the worker's pre-rebase
    remote SHA (the refiner rebases locally and never force-pushes). Makes `git branch -d` check
    merged-into-upstream and refuse a branch whose content is in master; the recovery — only
    after the Class-1 gate passes on the local SHA — is `--unset-upstream` then `-d` (restoring
    git's merged-into-HEAD check), never `-D`; a needs-human outcome restores tracking. _Avoid_:
    reading the `-d` refusal as an unmerged-work signal; escalating to `-D` in a default-mode
    sweep.
  Both entries reference SKILL prose produced in Task 1.1 — *defined-but-not-yet-emitted;
  produced in Task 1.1 (same phase)*. Adds no `_polish` token (guarded by
  `skills/war/assets/war-config.test.mjs`'s `sweptSurfaces` assertion, which scans CONTEXT.md —
  **not** the structure test, which carries no `_polish` guard at all; attribution corrected by
  /red-team 2026-07-16) and no `war-survey-corps`/`war-aftermath` token (those `lacks` guards **are**
  the structure test's, and they do scan CONTEXT.md).
  **Rebase note:** plan 1's two entries and plan 3's one entry land elsewhere in this file —
  rebase over them untouched; on any context collision, re-apply by the named anchor (the
  **acknowledged-stranded** entry), never by offset.
- requiresTest: false — prose-only glossary entries (docs tier); End state 8's review read is the
  guard (no-test route recorded here for the floor; glossary entries are broadly unguarded
  repo-wide — the same accepted residual plan 3's Q18 records)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Source-lesson keep-hot ENCODED note

- Files: `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`
- Plan slice: Per End state 7. **Pre-edit check:** grep `docs/learnings/` (hot root **and**
  `archive/`) for inbound `[[aftermath-remote-stranded-differs-from-local-tip-reachability]]`
  wikilinks and adjudicate each — **zero inbound verified at authoring (2026-07-16); re-verify at
  dispatch**; **grep is a completeness floor** — hand-scan the named surfaces with the End-state-7
  adjudications (the `aftermath-*`/`stranded-*` lesson family = straggler candidates; ADR 0027's
  `[[aftermath-2026-07-03-stranded-remote-set]]` citation = different lesson, not a straggler;
  MEMORY.md = generated projection, not a straggler; plan 3's committed dry-run reference =
  point-in-time record, never corrected), listing any straggler as a survey-derived correction in
  the commit body. Then two edits: (a) the frontmatter `description` gains the
  `ENCODED (aftermath-class1-gate-evidence, 2026-07-16): ` prefix (the operator-ratified
  wording — deliberately not `[RESOLVED]`, keeping the lesson hot and out of migrate archive
  candidacy while its third-paragraph gotcha lives) with the remainder compressed so **post-edit
  description byte length ≤ pre-edit**; (b) one dated body line naming this spec — the per-ref
  rule, cherry row-evidence recipe, and unset-upstream recovery are now encoded in
  `skills/aftermath/SKILL.md` Class-1 (named construct, *defined-but-not-yet-emitted; produced in
  Task 1.1, same phase*) — and naming the **live residual**: the third paragraph's
  shell-exclusion-filter / batched `git push origin --delete` verification gotcha is not encoded
  anywhere and stays the lesson's standing warning. **(c) NEW — the negative-arm correction
  (red-team adjudication, 2026-07-16; resolves the `needsDecision`):** this lesson's own body
  carries the exact framing this plan's doctrine bans on *every* surface — the second paragraph's
  trailing clause `…is safe, distinguishing it from truly un-merged work` (the phrase the
  adjudication notice misattributes to the spec: it is **this lesson's** wording, and this task
  puts the file in the plan's diff). Re-word **that clause only** to the ratified asymmetry —
  zero `+` ⇒ patch-equivalence **proven**; any `+` ⇒ **NOT PROVEN** (squashes and
  conflict-resolved rebases legitimately change patch-ids) ⇒ needs-human, never
  "proven unmerged". This keeps the Notes-Q8 "corrected everywhere" claim true across the plan's
  own diff and stops the ENCODED tag from blessing a lesson that still teaches the banned
  reading. Everything else in the body and all outbound wikilinks stay
  untouched; `metadata.keywords` stays nested and untouched. The file stays **hot and in place**;
  any archive move is /lessons-learned housekeeping. MEMORY.md re-render is operator-side (End
  state 7's command and runner). Check: `node skills/_shared/war-memory.mjs lint docs/learnings/`
  exits 0.
- requiresTest: false — docs-tier (lesson frontmatter + body lines); the fail-closed redaction
  lint is the guard (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan rewrites shipped skill prose (`skills/aftermath/SKILL.md`) and a shipped
  test asset (`war-pipeline-structure.test.sh`) — users only receive it via a release. Bump all
  four release slots together to the **next free patch above the live integration base at land
  time** (never a resolved semver literal, per the /war-strategy §2 next-free-patch convention):
  `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`, and
  the `README.md` `## Status` line (replace-in-place, never emptied, no badge). Expected
  integration base: the working tip after this plan's Phase 1 lands, which stacks on the tip left
  by learnings-recipe-drift-sweep **including its own release bump** (queue position 4) — resolve
  from the **live slots**, never from any version literal in any plan of this campaign
  (stacked-release lag lesson). Standalone fallback: a run of this plan through plain `/war`
  resolves the next free patch from the four slots itself.
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 10).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Throwaway-repo git-semantics demonstration** (spec §10.6): a scripted temp repo proving the
  full divergent-upstream topology — init a landing branch with a `file://` remote; branch a task
  off it, commit, **`git push -u`** (upstream set, remote ref = pre-rebase tip); advance the
  landing branch; **rebase the task locally, never force-push** (the upstream now diverges —
  neither tip an ancestor of the other); merge the task into landing. Then prove (a) the remote
  SHA fails `git merge-base --is-ancestor` against the landing tip while the local SHA passes;
  (b) `git cherry <landing> <pre-rebase-tip>` emits ≥1 lines, all `-`, zero `+`; (c) from a
  checkout whose HEAD is the merged landing tip, `git branch -d` **refuses while the stranded
  upstream is set** and succeeds after `git branch --unset-upstream` — the divergent upstream is
  mandatory setup, so the probe can never "prove" only the trivial no-upstream case · why
  deferred: git is the dependency, not the code under test — a committed behavioral test of git's
  own semantics is a spec §9 non-goal · runner: **/red-team, as an executable-proof probe in this
  plan's verification pass** (never committed).
- **Prose truth beyond the four checks** (End states 2–4): the structure test locks tokens and the
  gate-cell row, not semantics — cherry-framing completeness (argument order, healthy shape,
  suspect-empty, NOT-PROVEN asymmetry, C3 restatement, operator row ownership), the recovery's
  ordering/taxonomy/restore step, and the once-only asymmetry are prose facts · why deferred: the
  known ceiling of the grep-guard family (`structure-test-check-f-locks-presence-anywhere`) ·
  runner: the /red-team prose read of spec §10.3–10.5 + the landing-PR review.
- **First live Class-1 execution**: the next `/aftermath` run on the released plugin derives the
  gate per-ref, produces cherry evidence for any tsv-row candidate, and clears stranded-upstream
  local branches via unset-upstream + `-d` with zero default-mode `-D` escalations and no leftover
  probe refs or mutated tracking on needs-human rows · why deferred: the ADR 0027 named residual
  stands — Class-1 is Lead-executed prose over live git/gh state with no test asset family ·
  runner: operator, at the next `/aftermath` invocation.
- **Local-root lesson update** (#932's source,
  `stranded-upstream-makes-safe-branch-d-refuse-a-merged-branch` — the slug is already public: the
  committed spec §1 and issue #932 both name it; naming it here and in the phase report is
  therefore fine, while lesson **body content and local paths** stay off gh-mirrored surfaces):
  its keep-hot note cannot be a plan task — the lesson is uncommitted personal state in the local
  memory root, outside any repo diff (ADR 0015) · why deferred: no committable surface exists ·
  runner: **the operator, at the next /lessons-learned pass** — the checklist artifact is this
  backstop row plus the verbatim line the Lead writes into this plan's phase report at phase close
  (ADR 0017 — named owner, never a prose waiver).

## Notes / conscious deviations

- **Grill dispositions (2026-07-16).** Already-covered by the draft and verified: gate-cell
  lock-safety (no existing structure-test assertion pins any gate-cell byte — grep zero), zero
  inbound wikilinks, CONTEXT.md cross-plan contention + roadmap note, local-root lesson as a
  backstop with named runner, release-phase form, criterion naming without a bare number (Q26),
  requiresTest routing via the floor's `**/*.test.sh` arm (Q31). Changed by the grill: Q8
  (NOT-PROVEN asymmetry on every probe surface — the draft's glossary entry had the
  "distinguishes from truly un-merged" defect; corrected everywhere), Q1/Q2 (delete verbs
  enumerated per action; the SKILL's two remote-delete sentences adjudicated as two populations —
  gate-passing in-run deletes vs C3 manual clears — **not** a contradiction, so no operator call
  needed), Q3 (clause scoped to Class-1 refs; Class-2 reaps paths), Q4 (comparator named), Q9
  (healthy shape + empty-is-suspect + argument-order hazard), Q10 (**superseded by the /red-team
  round-0 proof, 2026-07-16** — the grill's `git fetch origin <ref>` FETCH_HEAD form is
  **disproven**: in a normal clone it opportunistically creates `refs/remotes/origin/<ref>`; the
  mandated form everywhere in this plan is now `git fetch --refmap= origin <ref>`, which is
  FETCH_HEAD-only with zero refs created; raw-SHA fetch remains server-dependent), Q15 (checkout precondition; stale-HEAD
  mode is refusal-noise, fail-closed), Q16 (task-branch PR half = the plan's landing PR;
  tip-reachability stays load-bearing — an interpretation that lowers nothing, C3-consistent),
  Q17 (worktree-ordering refusal carve-out — keyed on git's real `used by worktree at` string, the
  draft's "checked out at" wording being red-team-disproven; Teardown ordering as the usual guarantee, surviving
  needs-human worktrees as the gap), Q18 (mandatory tracking restore on needs-human routes), Q5
  (keep-green old-bar pin), Q6 (row-scoped co-location check — presence-anywhere rejected), Q7
  (cell drafted; fallback keeps anchor + never-mixed rule in the cell), Q12 (SKILL prose carries
  the row-content convention; tsv header byte-unchanged), Q13 (row-adding is a reviewed operator
  commit), Q14 (sentence order mandated; C3 paragraph stays below, probe prose never chains into
  a delete verb), Q20 (pointer in, restatement out), Q21 (zero deep-anchor links verified), Q22
  (hand-scan surfaces named with adjudications), Q23 (render-index command + operator runner),
  Q27 (four checks; `-d`'s review-floor status in the block comment), Q28 (exact bash-3.2-safe
  shapes), Q33 (probe topology mandates the divergent upstream). Q25 resolved from verified
  reality: the local slug is already public in the committed spec and #932 — nameable in
  plan/report; body content and paths stay forbidden (plan 3's counts-only rule governs
  *not-yet-public* local content and is unchanged). Q24 was the sole operator survivor — ratified
  **ENCODED keep-hot** at the conversion volley (see `## Open decisions`).
- **Four checks, not the spec's three (adjudication-notice deviation):** three red-pre-fix checks
  map 1:1 to the three SKILL clauses; the fourth is the keep-green old-bar pin (Q5) so the
  amendment can never silently drop `git merge-base --is-ancestor` from the cell — C3's
  byte-unchanged claim becomes mechanically checked instead of review-only. The row-scoped
  co-location check (Q6) subsumes plain presence for the prose anchor and reds if the clause
  migrates off the gate-cell row.
- **NOT-PROVEN asymmetry is doctrine, not caution (Q8):** `git cherry` compares patch-ids; a
  squash merge, conflict-resolved rebase, or split/joined commit changes the patch-id of landed
  content — a `+` line therefore proves nothing about unmerged work. The fail-closed consequence
  (needs-human, no row) is unchanged; only the *claim* is corrected. No surface in this plan may
  render the negative arm as "proven unmerged".
- **Task 1.1 is deliberately one coupled task (and the revert unit):** the three SKILL edits share
  `skills/aftermath/SKILL.md` (same file → same task), and the drift guard travels with the facts
  it guards — splitting the criterion into a later task would ship the clauses a phase naked and
  make the red-proof unrunnable against its own base. The two files revert only as a pair.
- **C3 quoted, byte-unchanged (the spec's sacred invariant):** ADR 0027 §C — "The remote-deletion
  gate (tip-reachable + PR-merged) is unchanged (**C3**)… an allowlist row is an acknowledgement,
  not a license" — and the SKILL's existing sentence "The allowlist is an acknowledgement, never a
  deletion license (C3). The deletion gate (tip-reachable + PR-merged) is byte-unchanged; a row
  never lowers the bar." are the ratified vocabulary the cherry paragraph **reuses rather than
  paraphrases**; the existing C3 paragraph itself is byte-untouched. Everything this plan adds is
  evidence-gathering or confounder-removal — the cherry probe justifies a tsv **row**; the
  unset-upstream recovery deletes only what the **unamended gate already passed** on the local
  SHA, with `-d` as git's independent re-check under the stated checkout precondition. No new
  deletion path exists anywhere in the diff.
- **Fail-closed doctrine unchanged:** a gate-failing candidate matching no allowlist row still
  reports needs-human; a probe with any `+` line files no row; an empty probe result is suspect,
  never a pass; a `-d` refusal after unset routes needs-human (with tracking restored); a stale
  sweep checkout produces refusal noise, never a wrong delete. Every error direction in the new
  prose is noise-only.
- **The two stranded classes stay separated; asymmetry once:** the *remote ref* class lives in the
  acknowledged-stranded bucket (ADR 0027; cleared only manually); the *local branch* class lives
  in the new recovery subsection (deleted in-run by the safe verb); the asymmetry sentence appears
  **only** in the recovery subsection; the bucket carries a one-sentence pointer (Q20), not a
  restatement.
- **No new ADR, no mechanization (spec §7, §9):** ADR 0027 untouched; cherry output feeds the
  existing row invariant as-is; `known-stranded.tsv` schema and rows untouched; Class-1 stays
  Lead-executed prose; no script, floor, or hook; `--scorched-earth`, `-D`, and its ⚠-flag
  reporting untouched; probe-hygiene discipline cited where used, not redesigned.
- **`has_i`-class anchor is implementation-final:** `exact ref being removed` is the suggested
  anchor, non-authoritative — the worker fixes the final mid-sentence token against the landed
  cell sentence, then temp-break-proves it; bold markers around the phrase don't affect the
  fixed-string match.
- **requiresTest/tier routing:** Tasks 1.2/1.3 are docs-tier; Task 1.1 routes the base worker tier
  with mapped `**/*.test.sh` evidence in-diff; requiresPackaging false everywhere (meta-repo, no
  Dockerfile in the footprint).
- **Anchors by named construct throughout** — the four-class table's Class-1 evidence-gate cell,
  `### Class-1 acknowledged-stranded bucket`, `### Class-4 join rule`, `## Teardown ordering`, the
  criterion-9b block, the **acknowledged-stranded** CONTEXT.md entry — never line numbers; this
  plan's grep results and zero-hit verifications are authoring-base snapshots, re-verified at
  dispatch.

## Open decisions

- None — the Commander's Intent was ratified by the operator at the conversion volley
  (2026-07-16), and the single operator survivor (source-lesson note wording) was ratified at the
  same volley: **`ENCODED (aftermath-class1-gate-evidence, 2026-07-16):` keep-hot prefix**,
  deliberately not a `[RESOLVED]` literal — the third-paragraph gotcha stays a live hot-set
  warning, per plan 3's Mechanized precedent. Every other grill question is dispositioned in the
  Notes; the subsection title and the prose anchor's final token are worker latitude within the
  End-state checks.
