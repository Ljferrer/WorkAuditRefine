# Authoring-surface truth guards — D4/D5/D12 mirror equality, lacks_i positive controls, grill choreography

Issues: #1307, #1308, #1309

## 1. Context — the gap / problem

Three defects on the plan-authoring doctrine surfaces and their own structure test, all found by
phase-1 audit seats of the 2026-08-04 interview-and-authoring-contract plan. All three are live at
base `6fff2ee` (2026-08-06); both structure suites exit 0 there (verified:
`bash skills/war-strategy/war-strategy-structure.test.sh` and
`bash skills/war-machine/war-pipeline-structure.test.sh` at `6fff2ee`).

1. **The D4/D5/D12 law is mirrored with no equality guard** (verified: issue #1307 (2026-08-06)).
   The evidence-tag syntax (D4, with the D11 issue-derived source form), the Done-when law (D5),
   the closed End-state tag set, and the D12 staleness sentence are each stated twice: in
   `skills/war-strategy/SKILL.md` §2's Template-law bullets and live-artifact convention block,
   and in `skills/war-strategy/references/plan-interview.md`'s section headed
   `## Evidence + slot law (shared with the template)` — a section that self-announces as a
   mirror (verified: both copies present at `6fff2ee`). ADR 0025's discipline is extraction +
   equality for any duplicated fact, and SKILL.md §3's own drift-guard rule block calls an
   unguarded mirror a plan defect (verified: the "unguarded mirror is a plan defect" sentence,
   §3 rule 5, at `6fff2ee`).
   - **Survey-derived correction to the issue's premise**: the issue states both copies carry
     presence pins so "neither copy can be deleted silently". Half-true. The SKILL.md side is
     presence-pinned (`check_f` anchors on the Template-law bullet openers and both halves of the
     D12 sentence), but the doctrine's `## Evidence + slot law (shared with the template)`
     section carries **zero** `doc_f` pins — a grep of
     `skills/war-strategy/war-strategy-structure.test.sh` for that heading, `D11`, `D12`, `D14`,
     or the staleness sentence finds no doctrine-side pin (verified: grep at `6fff2ee`). The
     doctrine copy can today be deleted outright with the suite green. The fix must add the
     doctrine-side presence pin as well as the equality guard.
   - The two copies are **not byte-identical today** even modulo wrapping: the D5 sentence
     diverges in its connective ("permitted (not required) on any other task; otherwise" on the
     SKILL side vs "permitted (not required) elsewhere — otherwise" in the doctrine), the D4
     sentence diverges after the tag triple ("issue-derived facts use" vs "issue-derived claims
     use the source form"), and the closed tag set appears once as a template-fence slot with
     placeholder args and once as backticked prose (verified: side-by-side read of both files at
     `6fff2ee`). A naive whole-sentence equality assert would be red at the tip; the design must
     converge or project (§3).

2. **The four `lacks_i` old-absent pins have no positive control** (verified: issue #1308
   (2026-08-06)). In `skills/war-strategy/war-strategy-structure.test.sh` the four retired-wording
   absence patterns are assembled at the call site from split fragments (the `r1a`+`r1b` …
   `r4a`+`r4b` assembly block) so the suite never self-matches a repo sweep — correct per the
   [[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]] lesson, but the
   assembled literal is thereby unfindable by any grep, so a one-character fragment typo yields a
   pattern matching nothing and all four pins stay silently green forever. Verified live:
   `lacks_i` hardcodes `$SKILL` as its haystack and no positive-control or fixture block exists
   anywhere in the file (verified: full read at `6fff2ee`). The ratified counter-pattern exists
   twice in-tree: `skills/war/assets/reference-link-integrity.test.mjs` arms 2–3 ("the pattern
   must still FIRE … a negative-only assert would stay green on a typo") and
   `skills/war-machine/war-pipeline-structure.test.sh`'s committed both-ways `lacks_i` control (a
   re-cased fixture must fire the `-i` composition while plain case-sensitive grep misses it)
   (verified: both blocks present at `6fff2ee`).

3. **war-machine step 1 spawns the grill in parallel with the drafter, but its charter is
   draft-dependent** (verified: issue #1309 (2026-08-06)). `skills/war-machine/SKILL.md` §2
   step 1 opens "Spawn in parallel:" and charters the adversarial grill agent to run
   plan-interview.md's falsifier probes + provenance scan "against the draft" — at spawn time no
   draft exists to probe (verified: both the parallel-spawn lead-in and the draft-dependent
   charter coexist in §2 step 1 at `6fff2ee`). The retired draft-independent charter wording
   (kept absent by the pipeline suite's fragment-assembled `retired_grill` pattern — referenced
   here by its variable pair, never restated) made the parallel spawn coherent; the phase-1
   reword introduced the dependency without touching the spawn ordering. Step 2 ("The drafter
   answers the grill's questions") already names the exchange where draft-dependent work can
   land. The issue routes this as a design choice, not a mechanical fix (verified: issue #1309
   (2026-08-06)).

## 2. Pivotal constraints

- **Structure-test lock-step**: every prose edit and the pin/guard that binds it land in the same
  task — the repo's ratified convention (the structure test's own header comment records it).
- **SKILL.md-side pins constrain wording churn**: the Template-law bullets are anchored by
  `check_f` fragments ("Every End state carries one tag", "carries an evidence tag",
  "is required iff `requiresTest: true`", both halves of the D12 sentence). Convergence edits go
  **doctrine-ward** — the doctrine's law section is unpinned today, so its wording can move to
  match the canonical side without breaking any committed anchor.
- **Sibling-suite pins constrain the 1309 reword**: `skills/war-machine/war-pipeline-structure.test.sh`
  pins the grill charter by the exact substrings `plan-interview.md` (case-sensitive),
  `falsifier probes`, `provenance scan`, and `in a throwaway sandbox` (case-insensitive), and
  keeps two retired phrasings absent via fragment-assembled `lacks_i` patterns (verified: the
  "Grill charter:" pin block at `6fff2ee`). The reworded charter must preserve those exact
  substrings and reintroduce neither retired phrase.
- **That sibling suite is owned by the shell-pin-helpers group this campaign**: this spec lands
  **after** it (dependency noted in §8; the survey manifest carries the machine hint) and treats
  the suite as read-only validation, never an edit target.
- **Equality must be default-deny**: an extraction that returns empty on both sides must red,
  never compare equal — the recorded fail-open class
  ([[enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed]],
  [[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]).
- **Sweep hygiene**: retired phrases stay fragment-split everywhere, including in any new fixture
  literals and in this spec itself (which references them only by variable-pair names); fixture
  literals must be **independent restatements**, never derived from the pattern variables, or a
  fragment typo mutates pattern and fixture together and the control is vacuous.
- **Bash 3.2-safe, no mktemp** — the structure test's own stated portability floor.
- **Zero semantic change to the law**: D4/D5/D11/D12 content, the closed tag set, and the grill's
  duties are unchanged; this spec is prose-plumbing plus guards.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #1307: equality guard or pointer-collapse? | **Equality guard.** Both surfaces are read standalone (the doctrine mid-interview, the template at authoring); collapsing the doctrine's law section to a pointer costs a context switch at interview time. ADR 0025's extraction+equality shape fits. [assumed: guard over collapse — if wrong: the doctrine section becomes a two-line pointer at SKILL.md §2 and only the presence pin lands] |
| Which side is canonical? | **`skills/war-strategy/SKILL.md` §2** — the template home; the doctrine section's own heading says "shared with the template". Convergence edits flow doctrine-ward only (pin-safe, per §2 constraints). |
| Guard shape for diverging copies | **Converge-then-compare for sentence atoms; keyword projection for the tag set.** The doctrine's D4 and D5 connectives are edited to the canonical wording, then the guard extracts each atom from both files, whitespace-normalizes (join wrapped lines, squeeze spaces), and asserts byte-equality. The closed tag set — template-fence slot with placeholder args vs backticked prose — is compared as its **ordered keyword sequence** (check → gate → HARD at audit_sha → backstop) extracted from both, sidestepping fence-vs-prose formatting. [assumed: keyword projection suffices for the set — if wrong: a normalization that strips backticks and `<…>` args upgrades it to full-text compare] |
| Atom registry | Four atoms from the issue — D4 tag triple + D11 source form · D5 Done-when sentence · closed End-state tag set · D12 staleness sentence — plus a fifth: the D14 per-row `AI-declared` marker fragment, which lives in the same mirrored doctrine section with a SKILL-side twin in Example B's intro prose. [assumed: include D14 since it shares the section and the marginal cost is one row — if wrong: drop the row, the four named atoms stand alone] |
| Empty-extraction behavior | **Fail loud.** Each per-surface extract is asserted non-empty before comparison; a missing anchor or deleted section reds with a message naming the surface and atom — never `"" == ""` green. |
| Doctrine-side presence | Add a `doc_f` pin on the exact heading `## Evidence + slot law (shared with the template)` (the survey-derived gap in §1), independent of the equality block. |
| #1308: haystack refactor or raw-composition control? | **Raw-composition control, no signature change** — the committed precedent in `war-pipeline-structure.test.sh` pipes a fixture through the same `grep -qiF` composition `lacks_i` wraps, without churning the helper or its call sites. Shortest working diff. [assumed: precedent shape over the issue's file-arg refactor — if wrong: `lacks_i` gains a haystack argument and the four call sites pass `$SKILL`; the control block is unchanged either way] |
| Control coverage | **All four patterns, both ways each**: a re-cased independent fixture must FIRE `grep -qiF -e "$rNa$rNb"` (proving the assembled pattern is alive), and plain `grep -qF` must MISS the same fixture (proving `-i` is load-bearing, the recorded lacks-vs-has_i asymmetry class). |
| #1309: sequence the pair, or move probe application to step 2? | **Keep "Spawn in parallel:"; split the charter into spawn-time derivation + step-2 application.** The grill derives plan-interview.md's falsifier probes + provenance scan from the spec + codebase at spawn (sandbox proofs of repo-behavior claims can start immediately — the parallelism is real work, not idle), and applies them against the draft in the step-2 exchange. Strictly sequencing the pair forfeits that overlap for nothing. [assumed: parallel-derive/step-2-apply over strict sequencing — if wrong: step 1 splits into 1a (drafter) / 1b (grill, spawned on the drafter's return) and the charter needs no timing clause] |
| Step 2 wording | Untouched — "The drafter answers the grill's questions" already names the exchange; the reworded charter points at it explicitly. [assumed: no step-2 edit needed — if wrong: one clause naming the probe application is appended there] |

## 4. Mechanics

### `skills/war-strategy/references/plan-interview.md` (doctrine-side convergence)

Two wording edits inside `## Evidence + slot law (shared with the template)`, both converging to
the canonical SKILL.md §2 bytes:

- **D4 connective**: "issue-derived claims use the source form" → the canonical "issue-derived
  facts use" phrasing, so the whole D4 atom (from `(user)` through the `(D11)` close) normalizes
  byte-equal across surfaces.
- **D5 connective**: "permitted (not required) elsewhere — otherwise" → the canonical
  "permitted (not required) on any other task; otherwise", so the full Done-when sentence
  normalizes byte-equal.

Nothing else in the section moves; the "carries **exactly** one tag" sentence stays as-is (the
tag set is compared by keyword projection, not sentence equality).

### `skills/war-strategy/war-strategy-structure.test.sh` (the guards — one task with the above)

- **Doctrine presence pin**: `doc_f '## Evidence + slot law (shared with the template)'`.
- **Mirror-equality block** (new, after the existing pins): a small extraction helper per atom —
  sed/grep range anchored on the atom's opening construct (the Template-law bullet opener or
  convention-block bullet on the SKILL side; the `**<law name> (Dn):**` bullet opener on the
  doctrine side), piped through whitespace collapse (newlines to spaces, squeeze). Per atom:
  assert both extracts **non-empty** (each failure names surface + atom), then assert equality
  (failure prints both normalized extracts). Atoms: D4 tag triple + D11 form · D5 Done-when
  sentence · closed-tag-set keyword sequence (extract the four keywords in order from the
  template fence's End-state slot and from the doctrine's closed-set sentence; compare the joined
  sequence) · D12 staleness sentence · D14 per-row marker fragment. Extraction anchors are live
  wording (presence anchors), so no fragment-splitting is needed for them — only retired phrases
  demand assembly hygiene.
- **`lacks_i` positive-control block** (new, directly after the `r1a`…`r4b` assembly block): four
  fixture literals, each an **independent** re-cased restatement of one retired sentence,
  assembled from its own split fragments (never from the `rN` variables — see §2). Per pattern,
  both ways: `printf '%s\n' "$fixtureN" | grep -qiF -e "$rNa$rNb"` must FIRE (else
  "not ok — pattern N is dead"), and the same pipe through plain `grep -qF` must MISS (else the
  `-i` is decorative). Mirrors the committed both-ways control in
  `skills/war-machine/war-pipeline-structure.test.sh` and the FIRE arms of
  `skills/war/assets/reference-link-integrity.test.mjs`.
- After authoring, **grep is the floor**: sweep this test file for every `Dn` law token and
  retired-fragment variable it now carries, then hand-scan the file's banner and per-block
  comments end-to-end for count words or enumeration claims the new blocks falsify (the
  banner-count lesson) — list each straggler as a survey-derived correction in the diff.

### `skills/war-machine/SKILL.md` (grill choreography)

§2 step 1's grill-charter parenthetical is reworded to the derive-then-apply shape: the grill
**derives** plan-interview.md's falsifier probes + provenance scan from the spec + codebase at
spawn, and **applies them against the draft in the step-2 exchange**; the sandbox clause ("any
behavioral claim about the repo … is proven by executing it in a throwaway sandbox, never by
analysis alone") is byte-preserved. The "Spawn in parallel:" lead-in is unchanged. The exact
substrings `plan-interview.md`, `falsifier probes`, `provenance scan`, `in a throwaway sandbox`
survive byte-for-byte (§2 constraints). After the edit, **grep is the floor**: grep the file for
`draft` and `spawn`, then hand-read §2 in full — steps 1–5 plus the directives above them — for
any other sentence carrying a spawn-time draft dependency or now-stale timing claim, listing each
straggler as a survey-derived correction. Read-only follow-through: confirm the descriptive
"Grill charter:" comment block in `skills/war-machine/war-pipeline-structure.test.sh` and the
consumer sentence in `skills/war-strategy/references/plan-interview.md` ("runs this file's
falsifier probes + provenance scan against a drafted conversion") remain true under the new
wording — both describe the application, which still targets the drafted conversion, so no edit
is expected; if the hand-read finds otherwise, route the comment fix per §8's ownership note
rather than editing the sibling-owned suite here.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war-strategy/references/plan-interview.md` | Two convergence edits (D4 + D5 connectives) inside the Evidence + slot law section |
| `skills/war-strategy/war-strategy-structure.test.sh` | Doctrine-section presence pin; mirror-equality block (five atoms, non-empty default-deny); four both-ways `lacks_i` positive controls |
| `skills/war-strategy/SKILL.md` | Canonical extraction source — expected byte-unchanged (listed for footprint honesty; touched only if an extraction anchor needs stabilizing) |
| `skills/war-machine/SKILL.md` | §2 step-1 grill-charter reword: spawn-time derivation, step-2 application; lead-in and sandbox clause preserved |

Both edited suites are discovered by the merge gate via `resolveGate` (`war-config.mjs`) — no
gate wiring changes.

## 6. New domain terms (CONTEXT.md)

None. "Mirror atom" is used in this spec as plain description of ADR 0025's extraction+equality
unit, not proposed as a glossary term.

## 7. Recommended ADRs

None. Governing doctrine exists: ADR 0025 (drift-guard discipline — extraction + equality) and
the structural-test hardening lessons
([[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]],
[[weak-test-assertion-passes-without-feature-being-exercised]]). This spec adds mechanisms under
that doctrine.

## 8. Open risks / implementation notes

- **Ordering (for /war-machine): this spec depends on the shell-pin-helpers group's plan landing
  first.** That group owns `skills/war-machine/war-pipeline-structure.test.sh`, which pins
  war-machine SKILL.md phrasing; the 1309 reword must be validated against that suite **as
  landed**, and any comment-currency fix it needs belongs to that file's owner. The survey
  manifest carries the machine-readable `dependsOn` hint; the roadmap's shared-file-contention
  table must carry the edge.
- **Task carving (decomposition rule 1)**: #1307 and #1308 both edit
  `skills/war-strategy/war-strategy-structure.test.sh` — same file, **one task**, and that task
  also owns the doctrine convergence edits (guard and guarded wording land together, lock-step).
  #1309 touches only `skills/war-machine/SKILL.md` — file-disjoint, safe as a parallel task in
  the same phase.
- **The equality guard intentionally REDs on future rewording** of any atom on either surface —
  that is the designed friction: a deliberate law change edits both surfaces and, if the atom's
  bytes move, the guard's expectation, in one diff.
- **Anchor stability**: extraction anchors are named constructs (bullet openers, the fence's
  End-state slot), never line numbers — the plan derived from this spec must keep it that way
  (line refs rot across the serial merge queue).
- **Fixture independence is the load-bearing subtlety** of #1308: deriving a fixture from the
  `rN` variables makes the control tautological (§2). The plan should quote this constraint into
  the task's Plan slice so an implementing worker cannot miss it.
- **Mutation-proof protocol**: every new guard is shown RED once against a scratch mutation
  (atom reworded / section deleted / fragment typo), then green on restore, with the verbatim
  command + failing line recorded in the done report — soft evidence by the
  deliberately-uncommitted-probe rule, so the verbatim capture is mandatory.
- No release is implied by this spec; if the campaign batches one, the next free patch resolves
  from the four slots at land time.

## 9. Non-goals / deferred

- **No pointer-collapse** of the doctrine's Evidence + slot law section (rejected alternative,
  §3): both reading surfaces stay standalone.
- **No edit to `skills/war-machine/war-pipeline-structure.test.sh`** — sibling-owned
  (shell-pin-helpers); this spec only runs it as read-only validation.
- **No semantic change** to D4/D5/D11/D12/D14, the closed End-state tag set, or the grill's
  duties — wording plumbing and guards only.
- **No `lacks_i` haystack refactor** (rejected in §3's assumed row; reversible by veto without
  touching the control design).
- **No new retired-wording pins**: the four existing patterns gain controls; retiring further
  wording is out of scope.
- **No doctrine-side pin expansion beyond the section heading** — the equality block, not
  presence pinning, is the drift mechanism for the section's content.

## 10. Validation criteria

Mutation proofs follow §8's protocol: mutate a scratch copy, observe the named assert RED,
restore, observe green, record the verbatim command + failing line in the done report.

1. WHEN the phase lands THE war-strategy structure suite SHALL exit 0 at the integrated tip ·
   check: `bash skills/war-strategy/war-strategy-structure.test.sh`
2. WHEN any mirror atom (D4 · D5 · tag-set sequence · D12 · D14) is reworded on **either**
   surface in a scratch copy THE equality block SHALL exit non-zero naming that atom · check:
   scratch-mutate one atom per surface, then `bash skills/war-strategy/war-strategy-structure.test.sh`
3. WHEN the doctrine's `## Evidence + slot law (shared with the template)` section is deleted in
   a scratch copy THE suite SHALL red on both the presence pin and the non-empty extraction
   assert — never green via empty-equals-empty · check: scratch-delete the section, then
   `bash skills/war-strategy/war-strategy-structure.test.sh`
4. WHEN the D4 and D5 atoms are extracted from both live surfaces post-convergence THE normalized
   extracts SHALL be byte-equal · check: the suite's equality lines report ok (same command as 1)
5. WHEN a one-character typo is introduced into any one of the eight `rN` fragments in a scratch
   copy THE matching positive control SHALL red ("pattern N is dead") · check: scratch-mutate
   each fragment in turn, then `bash skills/war-strategy/war-strategy-structure.test.sh`
6. WHEN each re-cased fixture is grepped with the plain case-sensitive composition THE grep SHALL
   miss, proving `-i` load-bearing (the control's second arm) · check: the four second-arm control
   lines report ok (same command as 1)
7. WHEN the retired sentences stay absent from `skills/war-strategy/SKILL.md` THE four `lacks_i`
   pins SHALL stay green alongside their controls · check: same command as 1
8. WHEN §2 step 1 of `skills/war-machine/SKILL.md` is read THE spawn-time grill charter SHALL
   carry no draft-dependent duty, with probe application named in the step-2 exchange · check:
   `grep -n 'against the draft' skills/war-machine/SKILL.md` — every hit sits inside the
   step-2-exchange clause; **grep is the floor** — hand-read §2 end-to-end for any other
   spawn-time draft dependency and list each straggler as a survey-derived correction
9. WHEN the sibling pipeline suite runs after the 1309 reword THE grill-charter pins
   (`plan-interview.md`, `falsifier probes`, `provenance scan`, `in a throwaway sandbox`) and
   both retired-phrase absence pins SHALL stay green · check:
   `bash skills/war-machine/war-pipeline-structure.test.sh`
10. WHEN the done reports are filed THE mutation proofs for criteria 2, 3, and 5 SHALL appear
    verbatim (command + failing line) · check: done-report review at gate-audit
