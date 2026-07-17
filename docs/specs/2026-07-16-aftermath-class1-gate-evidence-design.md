# Aftermath Class-1 gate discipline — per-ref SHA probes, git-cherry patch-equivalence evidence, and the unset-upstream `-d` recovery

Date: 2026-07-16
Status: draft (Survey Corps) — awaiting /war-machine conversion

## 1. Context — the gap / problem

Source issues: #926, #932

Both are memory-mined doc gaps in the Class-1 (stray WAR branches) procedure of
`skills/aftermath/SKILL.md`. In this plugin, skill prose *is* the executable behavior — the Lead
runs Class-1 by reading it — so a missing rule is a wrong procedure, not a missing comment. The
two gaps share one root mechanism: the /war refiner rebases task branches locally in the serial
merge queue and **never force-pushes**, so every task branch's remote ref permanently keeps the
worker's pre-rebase SHA while the local ref advances to the rebased tip that actually landed.
"Stranded" is therefore a property of the **specific SHA probed**, not of the branch.

**#926 — the gate never states which SHA to probe, and no aftermath surface carries the
patch-equivalence probe.** The Class-1 evidence-gate cell (four-class table) says only "Tip
reachable from the working/landing branch (`git merge-base --is-ancestor` against
`git ls-remote` truth); `gh pr view` = `MERGED`". Under the rebase mechanism above, the same
branch reads STRANDED via its remote SHA and REACHABLE via its local SHA — the gate must be
derived against the **exact ref being removed** (remote deletion gated on the remote SHA, local
deletion on the local SHA, never mixed), and the prose never says so. Separately, no aftermath
surface mentions `git cherry` (verified: grep across `skills/`, `docs/adr/`, `hooks/` returns
zero hits) — the cheap probe that proves a gate-failing ref is patch-equivalent to the landing
branch (zero `+` lines ⇒ every patch already landed by patch-id), which is exactly the evidence
ADR 0027 wants behind a `docs/aftermath/known-stranded.tsv` row (`landed_pr` populated, or a
documented `note`) instead of a recurring bare needs-human row. The gate is fail-closed today
(unmatched failure ⇒ needs-human, never delete), so the cost is recurring adjudication noise
and SHA-mixing ambiguity, not data loss. Source lesson (repo root, code-verified):
`docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` — 11 refs in
one sweep stranded by remote SHA, all reachable via their local tips, all zero-unmerged via
`git cherry`.

**#932 — the documented procedure produces a wrong outcome on the *common* local-branch case.**
When a branch has an upstream, `git branch -d` requires merged-into-**upstream**, falling back
to merged-into-HEAD only when no upstream is set. Every WAR task branch tracks its stranded
pre-rebase remote tip (divergent history from the local rebased tip — neither is an ancestor of
the other), so a default-mode sweep hits `-d` refusals on branches whose content is provably in
master (reproduced on all 6 affected branches, 2026-07-14-survey-debt sweep, 2026-07-15). The
SKILL gives the Lead no correct route: it names only the `--scorched-earth` `git branch -D`
escalation, and `unset-upstream` appears nowhere in the tree (verified: grep across `skills/`,
`hooks/`, `docs/` returns zero hits). A Lead reading the refusal either strands merged branches
as needs-human every campaign, or escalates to `-D` — which discards git's own independent
merged check on a run that never authorized scorched-earth. The correct route removes the
confounder instead of lowering the bar: `git branch --unset-upstream <branch>`, then
`git branch -d <branch>` — with no upstream, `-d` re-verifies merged-into-HEAD, which is
precisely the Class-1 gate, independently re-checked by git itself. Source lesson (local memory
root, code-verified): slug `stranded-upstream-makes-safe-branch-d-refuse-a-merged-branch`.

## 2. Pivotal constraints

- **ADR 0027 invariant C3 is byte-sacred**: the tip-reachable + PR-merged deletion bar is
  unchanged. Everything added here is evidence-gathering or confounder-removal, never a new
  deletion path. The cherry probe justifies a tsv **row** (an acknowledgement); it never
  licenses a delete.
- **Fail-closed doctrine unchanged**: a gate-failing candidate matching no allowlist row still
  reports needs-human.
- **`-D` stays scorched-earth-only** — after this change the default-mode procedure explicitly
  never needs it.
- **The two stranded classes must stay clearly separated in prose**: a *remote ref* stranded at
  a pre-rebase SHA (acknowledged-stranded bucket, ADR 0027, cleared only by a deliberate manual
  `git push origin --delete` outside aftermath's gates) vs. a *local branch* whose stranded
  **upstream** confounds `-d` (unset-upstream recovery; deleted in-run by the safe verb). The
  same branch routinely presents both faces in one sweep.
- **Aftermath has no test asset family** (ADR 0027 named residual): the only mechanical drift
  protection for its prose is `skills/war-machine/war-pipeline-structure.test.sh`. New ratified
  clauses need assertions there.
- **Grep-guard casing discipline** (the `has()` / `has_i()` split already in that test):
  command/flag literals (`git cherry`, `--unset-upstream`) never re-case → `has()`; prose
  clauses → `has_i()` on a mid-sentence anchor
  ([[prompt-only-clause-grep-guard-must-tolerate-sentence-case]]). The `has()` helper already
  `--`-terminates option parsing, so a leading-dash token is a safe pattern.
- **Probe hygiene**: any object fetch a probe needs is objects-only (FETCH_HEAD), leaving no
  `refs/remotes/probe/*` (the recorded /aftermath scratch-state discipline,
  [[aftermath-must-delete-its-own-probe-refs]]).
- `skills/aftermath/SKILL.md` frontmatter (`disable-model-invocation: true`) is untouched —
  structure-test criterion 2 must stay green.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where the per-ref rule lives | Amend the Class-1 evidence-gate cell in the four-class table with one short clause: gate derived against the exact ref being removed — remote deletion gated on the remote (`ls-remote`) SHA, local deletion on the local ref's SHA, never mixed. The *why* (serial-merge rebase + never force-push ⇒ the two SHAs diverge permanently) goes in the "Class-1 acknowledged-stranded bucket" section prose, where the stranding mechanism is already introduced. |
| Cherry probe placement + framing | One paragraph in the "### Class-1 acknowledged-stranded bucket" section: `git cherry <landing-ref> <candidate-sha>` with zero `+` lines ⇒ every patch already in the landing branch by patch-id — the patch-equivalence evidence for adding a known-stranded.tsv row (it locates/confirms `landed_pr`, or substantiates the PR-less `note`). Any `+` line ⇒ not patch-equivalent ⇒ the candidate stays needs-human and gets no row. Framed explicitly under C3: evidence for an acknowledgement, never a deletion license. |
| Landing ref for the probe | Parameterized to the same working/landing branch the gate already targets (never hardcoded `origin/master`), and the local landing ref is freshened (fetch) before the probe so the comparison matches `git ls-remote` truth. |
| unset-upstream recovery placement | New short subsection under Class-1, after the acknowledged-stranded bucket: why `-d` refuses (merged-into-upstream rule + the WAR stranded-upstream confounder), the two-command recovery, and the explicit rule that a refusal *after* unset-upstream is a genuine unmerged signal ⇒ needs-human — never `-D` in default mode. Names `git branch -d` as the default-mode delete verb (today only implied by contrast with scorched-earth's `-D`), and cross-references Teardown ordering (the recovery happens at the branch-delete step, after the worktree reap). |
| Recovery sequencing bar | `--unset-upstream` fires only for a branch that already **passed** the Class-1 evidence gate on its local SHA — the gate authorizes the delete; `-d`-after-unset is git's independent merged-into-HEAD second check, kept precisely because `-D` would discard it. |
| Drift guard | One new named criterion appended to `war-pipeline-structure.test.sh` (follow the criterion-9b precedent: block comment cites this spec): `has()` on `git cherry` and on `--unset-upstream`; `has_i()` on one mid-sentence per-ref-rule anchor (e.g. `exact ref being removed` — final token chosen at implementation, mid-sentence position required). |
| Source-lesson lifecycle | Repo lesson `aftermath-remote-stranded-differs-from-local-tip-reachability` gets a RESOLVED note (description prefix + one body line naming this spec) after an inbound-wikilink check; the archive *move* is deferred to /lessons-learned housekeeping. The local-root lesson (#932's source) is uncommitted personal state — operator checklist item, not a plan surface. |
| ADR | None new, none amended — ADR 0027's decision is untouched; the SKILL carries the evidence recipe, and cherry output feeding a tsv row satisfies the ADR's existing row invariant as-is. |
| Mechanization | None — Class-1 stays Lead-executed prose over live git/gh state (the ADR 0027 named residual stands). |

## 4. Mechanics

**`skills/aftermath/SKILL.md`** — three edits, all within Class-1 material:

1. *Evidence-gate cell (four-class table, row 1):* append the per-ref clause. One clause only —
   a markdown table cell must not grow pipes, newlines, or multi-sentence prose.
2. *"### Class-1 acknowledged-stranded bucket" section:* add the stranding mechanism (the serial
   merge queue rebases locally and never force-pushes, so a task branch's remote ref is pinned
   at the pre-rebase SHA while its local tip landed — probe the exact ref you intend to remove)
   and the cherry-probe paragraph as the row-evidence recipe, restating C3 inline ("evidence for
   a row, never a deletion license"). Include the probe-hygiene clause: if the candidate SHA's
   objects aren't local, fetch objects-only (FETCH_HEAD), leave no probe refs; fetch the landing
   ref first so the comparison matches `ls-remote` truth.
3. *New subsection (working title: "Class-1 local branches — the stranded-upstream `-d`
   refusal"):* the merged-into-upstream rule, the WAR-specific confounder, the recovery
   (`git branch --unset-upstream <branch>` → `git branch -d <branch>`), refusal-after-unset ⇒
   needs-human, never `-D` in default mode, and the one-sweep asymmetry note (the local branch
   deletes via safe `-d` while the remote ref it tracked stays genuinely stranded — reported,
   allowlisted per ADR 0027, cleared only manually).

**`skills/war-machine/war-pipeline-structure.test.sh`** — one new criterion block per the design
tree. Every new assertion is temp-break-proven per the file's own header convention (revert the
target prose, watch the assertion fail, restore).

**`docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`** — RESOLVED
note. The `description` edit must shorten or hold projection size (descriptions drive the
MEMORY.md byte budget), and the redaction lint (`war-memory lint`) must stay green — it is the
only thing CI runs.

**`CONTEXT.md`** — two short glossary entries (§6).

## 5. Surface changes

- `skills/aftermath/SKILL.md` — gate-cell clause; acknowledged-stranded mechanism + cherry
  paragraph; new stranded-upstream recovery subsection
- `skills/war-machine/war-pipeline-structure.test.sh` — one new criterion (three assertions)
- `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md` — RESOLVED
  note
- `CONTEXT.md` — `patch-equivalence probe` and `stranded upstream` entries

## 6. New domain terms (CONTEXT.md)

- **patch-equivalence probe** — `git cherry <landing-ref> <sha>`; zero `+` lines ⇒ every patch
  already in the landing branch by patch-id. The evidence a tip-reachability gate cannot
  produce: distinguishes "landed under a rewritten SHA" (acknowledged-stranded; justifies a
  known-stranded.tsv row) from truly un-merged work (needs-human). Never a deletion license
  (ADR 0027 C3). _Avoid_: treating a zero-`+` result as permission to delete; probing against a
  stale local landing ref.
- **stranded upstream** — a local branch's tracking ref pinned at the worker's pre-rebase remote
  SHA (the refiner rebases locally and never force-pushes). Makes `git branch -d` check
  merged-into-upstream and refuse a branch whose content is in master; the recovery is
  `--unset-upstream` then `-d` (restoring git's merged-into-HEAD check), never `-D`. _Avoid_:
  reading the `-d` refusal as an unmerged-work signal; escalating to `-D` in a default-mode
  sweep.

## 7. Recommended ADRs

None. ADR 0027's decision (allowlist = acknowledgement; C3 deletion bar byte-unchanged) is
exactly preserved: this spec encodes the evidence-gathering and confounder-removal procedures
the ADR's contract already presumes, and the cherry probe feeds the existing row invariant
(`landed_pr` populated or a documented `note`) without amending it.

## 8. Open risks / implementation notes

- **Cherry needs local objects.** A stranded remote SHA is usually present locally (the worker
  pushed from a local worktree of this repo), but not guaranteed on a fresh clone: the recipe's
  fallback is an objects-only fetch of the SHA (FETCH_HEAD; no refs created), honoring the
  recorded probe-hygiene discipline.
- **The local landing ref can lag** (the recorded post-land refs-desync class): `git cherry`
  compares against a local ref, so the recipe says fetch first — otherwise freshly-landed
  patches read as `+` lines and a safe row candidate reads unsafe. That error direction is
  noise-only (fail-closed), but the prose forestalls it anyway.
- **Prose-anchor casing:** the `has_i()` anchor must be a mid-sentence phrase that no planned
  wording adaptation places at a sentence boundary; final anchor token chosen at implementation
  against the actual landed sentence.
- **`--unset-upstream` mutates config on a still-present branch.** Harmless: it drops tracking
  info on a branch whose content the gate already proved landed, and it is restorable with
  `git branch -u` if the subsequent `-d` refuses and the row routes to needs-human.
- **Structure-test header scope:** the file's top comment enumerates the original pipeline
  spec's criteria; the new block follows the criterion-9b precedent — a self-describing comment
  citing this spec, no renumbering of existing criteria.
- The SKILL edits sit adjacent to ratified ADR 0027 wording ("acknowledgement, never a deletion
  license", exact-ref-name matching) — reuse that vocabulary rather than paraphrasing it, so the
  glossary, the tsv header, and the SKILL keep one voice.

## 9. Non-goals / deferred

- No change to the deletion gate, `docs/aftermath/known-stranded.tsv` schema or rows, or
  ADR 0027.
- No mechanization: no script, floor, or hook. Class-1 stays Lead-executed prose; the ADR 0027
  named residual (validated by live runs + red-team prose reads, not a mechanical gate) stands.
- No committed behavioral test of git's own semantics (the `-d` upstream rule, cherry's patch-id
  math): git is the dependency, not the code under test. The throwaway-repo demonstration is a
  /red-team executable-proof probe (§10.6), not a repo test.
- No `--scorched-earth` semantics change; `-D` and its ⚠-flag reporting are untouched.
- No general probe-hygiene overhaul — the objects-only-fetch discipline is cited where used, not
  redesigned.
- The local-root lesson's RESOLVED note is an operator checklist item (uncommitted personal
  state; no plan task can land it).

## 10. Validation criteria

1. **Drift guard live:** `bash skills/war-machine/war-pipeline-structure.test.sh` exits 0 with
   the new criterion present; reverting any one of the three new SKILL clauses (per-ref gate
   clause, cherry paragraph, unset-upstream recovery) flips the run to a nonzero exit —
   temp-break proof per the test's own header convention.
2. **Token presence:** `grep -F 'git cherry' skills/aftermath/SKILL.md`,
   `grep -F -- '--unset-upstream' skills/aftermath/SKILL.md`, and
   `grep -F 'git branch -d' skills/aftermath/SKILL.md` each hit; a case-insensitive grep for the
   chosen per-ref anchor hits the Class-1 evidence-gate cell.
3. **Cherry framing complete:** the acknowledged-stranded section contains the zero-`+`-lines
   semantics, the row-evidence framing (feeds `landed_pr`/`note`), a C3 restatement in the
   "never a deletion license" family, the any-`+`-line ⇒ needs-human route, and the fetch-first
   + objects-only probe-hygiene clause. Verified by prose read at /red-team, backed by the §10.1
   grep floor.
4. **Recovery ordering explicit:** the recovery subsection states, in order — evidence gate
   passes on the local SHA → `git branch --unset-upstream` → `git branch -d`; that `-d`
   post-unset independently re-checks merged-into-HEAD; that a refusal after unset routes to
   needs-human; and that `-D` is never the default-mode answer.
5. **Class separation:** the one-sweep asymmetry (local branch deletable via safe `-d`; the
   remote ref it tracked stays acknowledged-stranded/needs-human on the remote side) appears in
   the recovery subsection, keeping the remote-allowlist path and the local-recovery path
   visibly distinct.
6. **Throwaway-repo demonstration** (/red-team executable-proof, never committed): a scripted
   temp repo with a landing branch and a task branch pushed to a file:// remote, then rebased
   locally onto an advanced landing branch and merged, proves (a) the remote SHA fails
   `git merge-base --is-ancestor` against the landing tip while the local SHA passes; (b)
   `git cherry <landing> <pre-rebase-tip>` emits zero `+` lines; (c) `git branch -d` refuses
   while the stranded upstream is set and succeeds after `git branch --unset-upstream`.
7. **Lesson lifecycle:** the repo lesson's `description` gains a RESOLVED prefix naming this
   spec's slug; before the edit, grep `docs/learnings/` (hot root **and** `archive/`) for
   inbound `[[aftermath-remote-stranded-differs-from-local-tip-reachability]]` links and
   adjudicate each — the grep is a completeness floor, not a ceiling: after it, hand-scan the
   aftermath-adjacent lessons for same-meaning unlinked references and list each straggler as a
   survey-derived correction. `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0
   after the edit.
8. **Frontmatter untouched:** structure-test criterion 2 (`disable-model-invocation` on
   aftermath only, both frontmatter forms) still passes.
9. **Full shell suite green:**
   `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done`
   exits 0.
