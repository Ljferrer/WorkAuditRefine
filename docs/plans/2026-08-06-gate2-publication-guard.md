# Gate-2 publication guard — range-probe freshness, D22 key repair, and probe-description currency

Converted by `/war-machine --afk` from [docs/specs/2026-08-06-gate2-publication-guard-design.md](../specs/2026-08-06-gate2-publication-guard-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a
stated reason; spec citations are provenance-only — Part 1 alone carries every decision, constraint,
and mechanic). Issues addressed: #1288, #1287, #1293. Issue → task mapping: #1288 → Task 1.1 (the
G1/G3 fetch-refresh prose + its G4 D22 arm); #1287 → Task 1.1 (the G5 exemption arm, the G6
terminal-arm re-anchor, the G7 recorded-residual closure, the G8 census/banner/title currency);
#1293 → Task 1.2 (the G9 lesson-bullet rewrite, routed per G10). `/war` files its own epic + task
issues regardless (war-execution-must-file-issues); closing the three source issues is Lead
checkpoint work at phase close (war-checkpoint-must-close-task-issues) — every source issue is cited by at
least one commit in the phase range (End state 11, range-level not per commit).

## Context — the gap / problem

One flow, three defects — the Gate-2 post-servitor publication flow in `skills/war/SKILL.md`, the
D22 ordered key that guards it in `skills/war/assets/skill-doc-contracts.test.mjs`, and the
incident record that describes it. Snapshot base for every measured claim: `6fff2ee` (2026-08-06);
the session worktree's spec-batch and checkpoint commits are docs-only and touch none of these
surfaces — every live-byte claim below was re-verified or re-reproduced at conversion (2026-08-12).
**This plan stacks on two committed predecessors:** `docs/plans/2026-08-06-handoff-schemas-contract.md`
(plan 9) and `docs/plans/2026-08-06-structural-pin-extractors.md` (plan 10) (verified: the spec's
§8 binding ordering declaration + both committed plans' texts, read at conversion) — the
construct-level collision census is Context 6 and Note 1; the witness protocol is G12.

1. **The unrefreshed left boundary (#1288).** The Gate-2 pre-push staged-file check enumerates
   every unpushed commit via `git log --name-only --format='commit %H' '@{upstream}'..HEAD`, with
   one deterministic fallback to `origin/<working>..HEAD` when the transient publication worktree
   has no upstream (verified: issue #1288 (2026-08-06); re-verified in the
   `**Post-servitor publication (Gate 2` flow's `**Pre-push staged-file check (never skip).**`
   bullet, read at conversion). Both left boundaries are remote-tracking refs, only as fresh as the
   last fetch. No fetch precedes the probe anywhere in the Gate-2 flow — the file's only
   `git fetch` is the retired-token sweep's conditional `git fetch origin <working>` (outside the
   Gate-2 region; an incidental freshener, never a guarantee), and the region's own sole `fetch`
   token is the post-push-failure "fetch and replay" sentence, which runs only *after* a failed
   push (verified: grep of `skills/war/SKILL.md` for `fetch`, re-run at conversion). In a
   publication worktree provisioned without a preceding fetch, `origin/<working>` can lag the real
   remote tip, the probed range then includes already-pushed commits, and any of them carrying a
   non-promotion path is condemned — routing the undo's revert arm onto published history, the
   exact outcome the routing's own never-rewind-published-history principle exists to prevent
   (verified: issue #1288 (2026-08-06)).
2. **The D22 key's two holes (#1287).**
   - (a) End state 18 of plan `2026-08-02-war-engine-and-standing-doc-truth` landed the
     neutralized-pair exemption (`**Neutralized-pair exemption:**`, the `This reverts commit
     <sha>.` body-token link) and the re-probe termination sentence (`**The undo pass terminates`)
     in the Gate-2 flow, but the D22 ordered key does not cover them:
     `skill-doc-contracts.test.mjs` carries zero `This reverts commit` / `neutralized` /
     `exemption` tokens (verified: issue #1287 (2026-08-06); all three grep counts re-confirmed 0
     at conversion). Deleting the exemption leaves D22 green — the ADR 0025
     guard-travels-with-the-fact duty broken on that plan's own headline fix.
   - (b) `D22_ORDERED_SPAN` terminates on bare `/ensure-origin/`, and the same diff that added the
     exemption prose added two in-region `ensure-origin` prose mentions ahead of the push step —
     "the fork point against the `ensure-origin` push target" (fallback sentence) and "proceeds to
     the `ensure-origin` push below" (termination sentence). **Reproduced mechanically at
     conversion** (the spec's probe, re-run live 2026-08-12): the extracted Gate-2 region
     (marker → next `##` heading, 8,478 chars) carries three `ensure-origin` tokens at offsets
     2771 / 5557 / 6069; the live key's match against the live region ends at offset 5570 — inside
     the termination sentence's decoy — while the `provision-worktrees.sh ensure-origin` push
     invocation sits at offset 6046, outside the match. The terminal arm no longer pins what it
     names (verified: issue #1287 (2026-08-06); conversion reproduction — offsets are a dated
     snapshot at the base). Survey-derived correction: the issue body places the decoy "in the
     range-probe sentence" — the reproduction shows the ordered match ends in the **termination**
     sentence's mention, the first `ensure-origin` after the `git revert` arm (the fallback
     sentence's mention precedes that arm and cannot be reached). Same brittleness family as
     #1275, and the same label-to-guard-region class plan 10 just fixed in the D6 sibling
     (verified: issue #1287; plan 10's Task 1.1).
3. **The stale incident record (#1293).** The lesson
   `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` describes,
   in present tense, the Gate-2 pre-push check as listing "the docs commit's staged file set
   (`git show --name-only --format= HEAD`)" — the retired HEAD-only probe (verified: issue #1293
   (2026-08-06); re-confirmed at conversion — the retired literal greps exactly once, in the
   `## Mitigation (#1083) — three layers, all landed in one phase` section's layer-2 bullet).
   Survey-derived correction carried from the spec: the issue body cites the bullet as sitting
   "under **Remedies landed**" — the live heading is the Mitigation heading above; anchor by that
   heading's layer-2 bullet, never the issue's heading name. Red-team round 1 of plan
   `2026-08-02-war-engine-and-standing-doc-truth` found the bullet as a third live carrier of the
   retired probe and adjudicated it to a follow-up (an in-task repo-root write by that plan's
   worker contradicted the two-root split the plan itself asserts); it is a recorded sanctioned
   survivor of that plan's retirement grep (verified: issue #1293 (2026-08-06)). Its correct final
   wording depends on the probe shape #1288 lands — hence one plan, with a content edge (G11).
4. **Token-sweep + survey census (conversion re-measurement; all dated snapshots at the base).**
   `skills/war/SKILL.md` carries four `ensure-origin` tokens — Setup step 2, the two in-region
   prose mentions, the push invocation. The D22 block comment's extraction rationale claims "ONE
   token each in the two reference files" — **survey-derived corrections carried from the spec,
   both re-confirmed live:** (i) `skills/war/references/resume-and-recovery.md` carries **two**
   `ensure-origin` tokens (both in its Checkpoint absent-origin-baseline arm), not one;
   (ii) the comment's in-region accounting predates the two prose mentions entirely — both are
   sanctioned in-region survivors the G6 invocation anchor is designed to skip.
   `skills/war/references/setup.md` carries zero `ensure-origin` and one
   `remove-publication-worktree`, matching the comment. The implementing task re-runs this census
   and the hand-scan at its rebased base — counts are snapshots, not ceilings.
5. **Zero-hit / OLD-present witness census** (conversion measurement): `This reverts commit` — 0
   hits in `skill-doc-contracts.test.mjs`; `fetch origin` — 0 hits in the same file; `@{upstream}`
   — 0 hits in the lesson file — every new-token pin is non-vacuous by construction. OLD-absent
   pins, measured at base (non-vacuous): the retired `git show --name-only --format= HEAD`
   literal in the lesson (1); `RESIDUAL, recorded rather than waived` (1) and `three near-miss`
   (1) in the test file; `THREE negative` — **2** in the test file (the banner AND the RESIDUAL
   paragraph's own "All THREE negatives below" sentence — the second carrier rides out with End
   state 5's RESIDUAL retirement, which is why End state 7's post-state 0 holds). Predecessor
   witnesses (G12): `clock read` — 0 hits in
   `skills/war/SKILL.md` at base, ≥ 1 after plan 9's Task 1.3 (its End state 8 pin); `backticks` —
   0 hits in `skills/war/SKILL.md` at base, ≥ 1 after plan 10's Task 1.2 (its End state 10);
   `D31_ARMS_COLLIDED` — 0 hits in `skill-doc-contracts.test.mjs` at base, ≥ 1 after plan 10's
   Task 1.2 (its End state 8) — all non-vacuous. (AI-declared)
6. **Stacking census — the spec's §8 ordering claim, corrected** (survey-derived correction;
   verified: the eleven committed 2026-08-06 plans' `- Files:` lines, read at conversion). The
   spec declares this group lands after `structural-pin-extractors` (plan 10) and
   `handoff-schemas-contract` (plan 9) because "all three touch `skills/war/SKILL.md`,
   `skills/war/assets/skill-doc-contracts.test.mjs`" — **the second half is false for plan 9**:
   plan 9 never edits `skill-doc-contracts.test.mjs` (its own committed Context 11/Note 5 records
   the same overstatement). The corrected construct map: `skill-doc-contracts.test.mjs` is shared
   with **plan 10 only** (its Task 1.2: the D31 block at the file tail + the Task 2.1 doc-cascade
   banner directly *below* the D22 test block — construct-disjoint from this plan's D22 block,
   though adjacent at the banner boundary); `skills/war/SKILL.md` is shared with plan 9 (Task 1.3
   regions: Setup step 2, Decompose step 1, § Run manifest, § Per phase Workflow-args
   parenthetical, § Checkpoint) and plan 10 (Task 1.2: Decompose step 3's Done-when intake
   sub-bullet) — **all outside the Gate-2 extraction region** (the `**Post-servitor publication
   (Gate 2` marker to the next `##` heading; plan 9's § Per phase edit sits before the marker,
   its § Checkpoint edit after the region's closing heading — verified against the live heading
   map at conversion). Both edges are therefore **order-only with witnesses** (G12), not content
   edges; no committed plan touches the lesson file; plan 9's Task 1.2 edits
   `references/resume-and-recovery.md` (a Worktree-hygiene bullet) but introduces no
   `ensure-origin` token, and both plan 9's and plan 10's SKILL.md pin-safety clauses explicitly
   introduce no `ensure-origin` token — the Context 4 census is expected stable, and re-measured
   regardless. Downstream: `docs/specs/2026-08-06-references-pointer-integrity-design.md`
   declares "this group lands after the sibling groups `structural-pin-extractors` and
   `gate2-publication-guard`" (verified: its § Open risks ordering bullet, read at conversion) —
   a spine edge for the roadmap. No 2026-08-06 survey manifest exists in this worktree (latest
   `.claude/aot/` entry is 2026-08-02) — the ordering source is the spec §8 declaration plus the
   committed plans, the same resolution plan 10's A4 recorded. (AI-declared)

## Pivotal constraints

- **ADR 0025 (guard travels with the fact):** every Gate-2 prose change lands with its D22 arm in
  the same task and the same commit; a new arm without a proven-red negative reference is a blind
  spot, not a lock (the recorded
  `structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census` class).
  The D22 block comment itself instructs: "A future edit to this key should add those references
  rather than assume the arms are proven" — this plan's edit is that future edit.
- **Never relax a negative reference to make the key pass** — the D22 test's own assertion message
  is binding; tightening the key is the only sanctioned direction.
- **One ordered key, markup-tolerant:** D22 stays a single ordered regex (the `[\s*`]{0,4}`
  emphasis-tolerance idiom), never independent presence checks; arm order mirrors the live prose
  order.
- **Bounded-region discipline (the label-to-guard-region class):** every arm anchors inside the
  bounded extracted region (marker → next `##` heading — the extraction's own non-vacuity assert
  reds a truncated region), and the terminal arm anchors the push **invocation** construct, never
  the first bare token after a preceding arm — the exact anti-decoy fix, stated explicitly so this
  key repair cannot reintroduce the EOF-scan/first-token-after class plan 10 just retired in the
  D6 sibling.
- **Never rewind published history:** the #1288 fix makes the probe's condemnation sound (bounded
  to unpushed commits) rather than adding guardrails downstream of an unsound probe.
- **Stacking (binding):** predecessor plans 9 and 10 land first — order-only edges with
  halt-on-miss witnesses (G12); Task 1.1 is authored against the post-predecessor shapes and runs
  the witnesses as its first post-rebase act; a missed witness ⇒ **halt and report the missing
  predecessor, never improvise**.
- **ADR 0042 budget pressure:** `skills/war/SKILL.md` measures 63,197 B at conversion against a
  64,512 B advisory / 73,728 B hard budget (~1.3 KB advisory headroom), and plans 9 and 10 both
  add sentences to it first. The freshness step is one tight sentence-pair; re-measure `wc -c` at
  the rebased base; if the advisory line trips, the commit body cites ADR 0042's justification
  rule — never compensate by rewording guarded sentences.
- **Two-root discipline:** the lesson edit is maintenance of an already-published, committed repo
  doc — never framed as a servitor lesson write or a Gate-2 promotion (G10).
- **Redaction lint:** the edited lesson keeps `node skills/_shared/war-memory.mjs lint
  docs/learnings/` green (the discovered wrapper runs it in the gate).
- **Auditor guard unchanged:** the new fetch runs Lead-side inside the Gate-2 flow (the flow is
  the Lead's own publication work — "the Lead is the **sole repo-root writer**"; verified: the
  flow's lead-in sentence, read at conversion); `hooks/validate-auditor-git.sh`'s verb allowlist
  (diff/log/show/merge-base/rev-parse/status/ls-files/ls-tree/cat-file/blame/branch — `fetch`
  deliberately excluded, the guard-c-peel context) is untouched (verified: the allowlist deny
  message, read at conversion).
- **Anchor by named construct** (`D22_ORDERED_SPAN`, `D22_REGION_HEAD_ONLY_PROBE`,
  `D22_REGION_WITHOUT_UNDO`, `D22_REGION_WITHOUT_RANGE`, the D22 test block, the
  `**Pre-push staged-file check (never skip).**` bullet, the `## Mitigation (#1083)` layer-2
  bullet) — line numbers and offsets rot across the serial merge queue; every measured
  offset/count here is a dated snapshot at `6fff2ee`, re-measured at the task's rebased base.
- **Release discipline:** the version bump is its own trailing phase; version literals in this
  plan and the source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| G1 | Freshness mechanism (#1288) | Refresh-before-probe: `git fetch origin <working>` in the publication worktree, immediately before the range probe — the same idiom the retired-token sweep already uses; it updates `origin/<working>` (and thereby `@{upstream}` when configured, since the fallback names the same counterpart) | (verified: issue #1288 (2026-08-06), first fix option; idiom precedent verified in the retired-token sweep paragraph of `skills/war/SKILL.md`) |
| G2 | Rejected alternative | Fork-point SHA recorded at provisioning — rejected: adds state plumbing to `cmd_ensure_publication_worktree` in `skills/war/assets/provision-worktrees.sh` (a third code surface plus a threading path), where the fetch is one idempotent command on an existing surface | AI-declared [assumed: minimal-diff preference — if wrong: the fork-point variant is the follow-up, not a patch to this one] (A1) |
| G3 | Fetch-failure posture | Fail-closed: a non-zero fetch exit stops the pass — escalate, leave the worktree in place (the flow's standing posture) — never probe against a stale boundary | AI-declared [assumed: condemnation against a stale boundary is unsound and the revert arm makes unsoundness destructive — if wrong (operator prefers fail-open + warn), one sentence changes] (A2) |
| G4 | Freshness guard (#1288 pair) | New D22 fetch arm — the `git fetch origin` **adjacent form** (markup-tolerant), ordered between the docs-commit arm and the range-probe command-form arm — plus a new negative reference (the command dropped, the freshness prose retained in position, G13) asserted red. Pinned on the adjacent form, never bare `fetch`: a mutation that strips the command but keeps the freshness sentence's own explanatory prose would green a bare key (G13) | (verified: issue #1288 (2026-08-06), "Worth pairing with a D22 arm so the refresh duty is guarded rather than prose-only"); adjacency pinning: G13 (verified: grill-pair both-ways execution (2026-08-12)) |
| G5 | Exemption arm (#1287a) | New D22 arm keyed on the mid-sentence `This reverts commit` adjacent form (markup-tolerant), ordered between the do-not-push arm and the `reset --hard HEAD~1` arm — mirroring live prose order — plus a new negative reference (exemption absent) asserted red | (verified: issue #1287 (2026-08-06); the token occurs exactly once in the live region — conversion census) |
| G6 | Terminal arm re-anchor (#1287b) | Anchor on the push **invocation** shape — `provision-worktrees.sh` adjacent to `ensure-origin` — never the bare token; the two in-region prose mentions become recorded sanctioned survivors in the D22 block comment's census | (verified: issue #1287 (2026-08-06); decoy reproduced mechanically at conversion — Context 2b) |
| G7 | Recorded-residual closure | Close the D22 comment's two recorded both-ways gaps in the same key edit: reference (d) range token present / command form absent, and reference (e) revert routing absent (range probe and undo arm present), both asserted red; the RESIDUAL paragraph is then retired | (verified: the D22 block comment's RESIDUAL note, re-read at conversion — it instructs exactly this) |
| G8 | Census + banner currency | Update the D22 block comment's token census (Context 4's corrected counts, incl. the two-token resume-and-recovery correction and the two in-region sanctioned survivors), replace the "THREE negative references" / "three near-miss" count words with the new reference count, and append #1288/#1287 to the D22 test title's and header comment's issue lists, all in the same diff (the recorded banner-undercount class) | AI-declared [assumed: comment-currency duty follows the key it documents — if wrong: drop the census sentence, keep the count words] (A3); (verified: `three near-miss` greps 1 and `THREE negative` greps 2 at base — Context 5's coupling) |
| G9 | Lesson wording (#1293) | Rewrite the `## Mitigation (#1083)` layer-2 bullet to describe the landed shape in present tense — a freshly-fetched range (`git fetch origin <working>` first), the range probe (`git log --name-only --format='commit %H' '@{upstream}'..HEAD`), the deterministic `origin/<working>..HEAD` fallback — dated as a snapshot ("as of" + this plan's slug/date), retaining the bullet's closing lock sentence updated to name the D22 ordered key; the retired `git show --name-only --format= HEAD` literal must not survive in the bullet; frontmatter, keywords, and every other body section byte-untouched | (verified: issue #1293 (2026-08-06), first fix option, sharpened to include the shape this plan lands) |
| G10 | Lesson edit vehicle | A normal worker task editing a committed repo doc through the standard worktree/merge path — not a servitor write, not a Gate-2 promotion; the two-root split governs lesson *capture* routing, not planned maintenance of a published record | AI-declared [assumed: the #1293 adjudication rejected an *in-flight, unplanned* worker write within that plan, and named the next sweep as owner — if wrong: route the edit as a Lead/operator commit outside /war and drop Task 1.2] (A4) |
| G11 | Sequencing | Task 1.2 depends on Task 1.1 (`deps: [1.1]`, same phase, wave edge): the bullet's wording describes the landed probe shape including G1's fetch step — a **content** edge under decomposition rule 2; the files are disjoint, so this is never a collision dodge, and no drift guard is split from its fact (rule 7 not in play — every D22 arm travels with its prose inside Task 1.1) | (verified: decomposition rules 2 and 7, `skills/war-strategy/SKILL.md` §3) |
| G12 | Predecessor witness protocol | Task 1.1's worker, first act after the standard rebase: `grep -c 'clock read' skills/war/SKILL.md` ≥ 1 (plan 9's Task 1.3, its End state 8 pin; 0 at base) AND `grep -c 'backticks' skills/war/SKILL.md` ≥ 1 (plan 10's Task 1.2, its End state 10; 0 at base) AND `grep -c 'D31_ARMS_COLLIDED' skills/war/assets/skill-doc-contracts.test.mjs` ≥ 1 (plan 10's Task 1.2, its End state 8; 0 at base) — the witnessed tasks are exactly the predecessor tasks that share this plan's files. Any miss ⇒ halt and report, never improvise. Task 1.2 needs no witness — no committed plan touches the lesson file (Context 6). (AI-declared) | conversion judgment (plan 9's D16 / plan 10's D12 witness shape), logged for /red-team |
| G13 | Fetch-arm pinning refinement | The G4 arm is keyed on the `git fetch origin`-adjacent fragment, deliberately NOT bare `fetch` — but not because of the push-failure "fetch and replay" sentence: every replay fetch token sits **after** the probe arm's last token, so ordering alone kills a bare key against a fetch-pair-deleted region (executed both ways — red under both key forms). The live decoy is the freshness sentence-pair's **own explanatory words** ("only as fresh as the last fetch", "non-zero fetch exit"): stripping only the command while keeping that prose greens a bare key and reds the adjacent key. The fetch-absent negative reference is therefore command-dropped / prose-retained — the exact analogue of negative (b)'s bare `reset --hard` doctrine mention, the same pinning rationale the block comment records for `reset --hard HEAD~1` and `git revert` | (verified: grill-pair both-ways execution (2026-08-12); ordering fact re-confirmed at conversion — region fetch offsets all follow the probe offset), logged for /red-team (AI-declared) |
| G14 | Reference-count arithmetic | Three updated + four new = seven negative references at this plan's shape (a dated derivation, never authoritative prose): (a) tip-only probe, (b) undo absent, (c) range token absent — each updated to carry the fetch step and the exemption sentence (their push lines are already invocation-shaped, verified at conversion) so each still differs from the live shape at exactly its designated point — plus fetch-absent (G4), exemption-absent (G5), (d) command-form gap, (e) revert-routing gap (G7). The banner count words equal the landed count (End state 7's check is count-equals-enumeration, not a literal) | conversion derivation from the live negatives, logged for /red-team (AI-declared) |
| G15 | Task decomposition | Two tasks in Phase 1 — Task 1.1 (both guard-coupled files: the SKILL.md fetch prose and every test-side change; #1288's arm and #1287's repairs collide in `skill-doc-contracts.test.mjs`, and key-vs-prose lockstep binds the two files into one task) and Task 1.2 (the lesson, file-disjoint, `deps: [1.1]` per G11) — plus the standard trailing release phase | spec §8 task-carving hint ("do not split #1287 from #1288") + war-strategy §3 rules 1/2/7 (AI-declared) |
| G16 | Check sharpenings | OLD-absent/NEW-present mechanical pins replace hand-judged forms where possible: End state 3 pins `This reverts commit` nonzero in the test file (0 at base); End state 5 pins the RESIDUAL paragraph's retirement by its own lead token (1 at base → 0); End state 7 pins both count-word literals absent (`THREE negative` 2 at base — coupled to End state 5's retirement, Context 5 — and `three near-miss` 1 at base, → 0 each); End state 8 pins the lesson by retired-literal-absent (1 → 0) AND `@{upstream}`-present (0 → nonzero). Platform law (plan 10's refined wording): every committed check whose pattern is intended as a LITERAL — above all one carrying MID-pattern metacharacters — runs `grep -F`; anchors are not the trap: a deliberate regex stays a regex and cannot ride `-F`. The retired-lesson-literal grep and the `@{upstream}` grep carry metacharacters — both run `-F`. Execute-your-literals discipline: run each check as written before committing it | conversion judgment, logged for /red-team (AI-declared) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The one-command fetch idiom (not fork-point-at-provisioning state) is the wanted mechanism | spec §3 G2 (carried [assumed] row); minimal-diff on an existing surface | the fork-point variant is a follow-up plan, never a patch to this one | ratify in /red-team |
| A2 | Fail-closed on fetch failure is the wanted posture | spec §3 G3 (carried [assumed] row); condemnation against a stale boundary is unsound and the revert arm makes unsoundness destructive; the escalate-leave-in-place arm is the flow's standing posture | operator prefers fail-open + warn — a one-sentence change to the prose and no key change (the arm keys on the fetch command, not the failure sentence) | ratify in /red-team |
| A3 | Comment-currency duty (census + count words + title) follows the key it documents | spec §3 G8 (carried [assumed] row); the banner-undercount lesson class | drop the census sentence, keep the count words — a two-line narrowing | ratify in /red-team |
| A4 | A /war worker may edit `docs/learnings/` as planned maintenance of a committed repo doc | spec §3 G10 (carried [assumed] row); the #1293 adjudication rejected an *unplanned in-flight* write, and worker writes are scope-hook-gated to the task worktree, not path-blocked from repo docs; precedent: committed plans 2, 6, and 10 each carry a `docs/learnings/` file in a worker task footprint (verified: their `- Files:` lines, re-checked at conversion) | Task 1.2 drops from the plan and the edit routes as a Lead/operator commit outside /war; Task 1.1 is unaffected | ratify in /red-team |
| A5 | Predecessor plans 9 and 10 have LANDED before any Task 1.1 dispatch | the spec's §8 binding ordering + plan 9's committed Context 11/Note 5 and plan 10's committed Context 10/Note 5 (both name this group downstream); no 2026-08-06 survey manifest exists — the spec and committed plans are the ordering source; the roadmap sequences them ahead (ADR 0011) (AI-declared) | Task 1.1 edits collide with plan 10's edits in `skill-doc-contracts.test.mjs` (adjacent constructs) or land against stale SKILL.md bytes | G12 witnesses at the rebased base; miss ⇒ halt-and-report (backstop row) |
| A6 | The dated censuses and offsets (four `ensure-origin` in SKILL.md, three in-region, the 2771/5557/6046/6069 offsets, the two-token resume-and-recovery count, 63,197 B) hold at the post-predecessor base | Context 6: plan 9's and plan 10's SKILL.md regions are Gate-2-region-disjoint and both carry explicit no-`ensure-origin` pin-safety clauses; plan 9's resume-and-recovery bullet carries none; plan 10's test-file regions are construct-disjoint from the D22 block (AI-declared) | a moved count/offset false-anchors an arm or the census — the fix is a re-measure, never a guard removal | re-measure census, offsets, and `wc -c` at the rebased base (Task 1.1's slice mandates it) |
| A7 | The fetch sentence-pair fits without structural budget conflict (AI-declared) | ~1.3 KB advisory headroom at conversion minus plans 9/10's tight-kept additions; the budget is warning-only (advisory), hard 73,728 B not approachable | the commit body cites ADR 0042's justification rule; never reword guarded sentences to compensate | `wc -c skills/war/SKILL.md` re-measured at the rebased base, recorded in the done report |

## Non-goals / deferred

- **No fork-point-at-provisioning state** in `skills/war/assets/provision-worktrees.sh` (G2's
  rejected alternative; revisit only if the fetch idiom proves insufficient in the field).
- **No redesign of the condemnation/exemption/undo semantics** — #1288 bounds the range; the
  routing logic, the shield, and both bounded escalation arms are byte-untouched.
- **No auditor-guard widening:** `fetch` stays excluded from `hooks/validate-auditor-git.sh`'s
  verb allowlist — the new fetch is Lead-side.
- **No re-fetch before the post-undo re-probe:** the worktree is held across the pass and the
  boundary was freshened at entry; a second fetch is redundant and out of scope.
- **No `/lessons-learned` housekeeping beyond the one bullet** — the lesson's description,
  keywords, archive status, and every other section are out of scope (the MITIGATED description
  stays; the projection cannot move — description-driven).
- **No other Gate-2 prose rewording:** the probe commands, fallback, condemnation, exemption,
  undo routing, termination, and push sentences stay byte-untouched except the inserted freshness
  sentence-pair — the D22 key must keep matching the surviving prose; #1287's fixes are
  test-side.
- **No edits to the plan or red-team report of `2026-08-02-war-engine-and-standing-doc-truth`** —
  historical artifacts stay as adjudicated (ADR 0046 posture).
- **No new CONTEXT.md term, no ADR** (spec §6/§7): every construct named here already has its
  home; G1/G3 apply existing doctrine (ADR 0022 publication integrity, ADR 0025 drift guards, the
  standing escalate posture) to a missed step — the one judgment call worth a paper trail (G3) is
  recorded in this plan's design tree and the flow's own prose.

## New domain terms · Recommended ADRs

None (see Non-goals).

## AI-Commander's Intent

- **Purpose:** the Gate-2 pre-push probe's condemnation is sound — bounded to commits origin has
  genuinely never seen, because the left boundary is freshened by a fail-closed fetch immediately
  before the probe — and the D22 ordered key once again pins everything it names: the fetch duty,
  the neutralized-pair exemption, and a terminal arm that matches the real push invocation instead
  of a prose decoy, with every load-bearing fragment carrying a both-ways proof and the incident
  record describing the landed probe shape in the present tense. (AI-declared)
- **Method:** insert one tight fetch-refresh sentence-pair (refresh + fail-closed escalate arm)
  before the range probe in the Gate-2 flow, and land its D22 fetch arm in the same commit; extend
  the ordered key with the exemption arm and re-anchor the terminal arm on the
  `provision-worktrees.sh`-adjacent invocation shape under explicit bounded-region discipline;
  close the two recorded residual gaps with references (d) and (e), update the three existing
  negatives to carry the new arms, and bring the block comment's census, count words, and issue
  lists to currency; then rewrite the lesson's Mitigation layer-2 bullet to the landed probe shape
  as a dated snapshot, through a normal worker task with a `deps` content edge; author everything
  against the post-predecessor shapes with halt-on-miss witnesses; every negative reference and
  scratch mutation demonstrated-RED and recorded. (AI-declared)
- **Mechanism latitude** *(amendment 2026-08-17, #1431)*: the mechanisms Method names are reference
  realizations, implementer's choice — the regex-arm internals of the extended `D22_ORDERED_SPAN`
  (arm construction and quantifier bounds), the construction internals of the new and updated
  negative references (how each fixture is assembled so it differs at exactly its designated
  point), the one-shot offset-probe mechanics behind End state 4's development drill, and the
  wording of the fetch-refresh sentence-pair and the lesson's rewritten bullet beyond the pinned
  needles the End-state checks name. Substituting any of these mechanisms while the End states and
  binding guardrails hold is not a plan deviation and warrants no issue. This clause never waives a
  check, gate, or backstop (ADR 0017) — End states pin outcomes, and each stays checkable as
  written. (AI-declared)
- **Binding guardrails** *(amendment 2026-08-17, #1431)*: the fetch refresh is ordered strictly
  before the range probe and carries a fail-closed non-zero-exit arm (no probe, no push, escalate)
  · the neutralized-pair exemption semantics (`This reverts commit` body token) are preserved ·
  the terminal arm anchors on the real push invocation under bounded-region discipline, never a
  prose mention · the lesson file changes only in its Mitigation layer-2 bullet — frontmatter,
  keywords, and every other section byte-untouched · every negative reference is demonstrated-RED
  and recorded. (AI-declared)
- **End state:**
  1. The Gate-2 pre-push staged-file check orders a `git fetch origin <working>` refresh — with a
     fail-closed non-zero-exit arm (do not probe, do not push; escalate, worktree left in place) —
     before the `git log --name-only` range probe, and the extended `D22_ORDERED_SPAN` places the
     fetch arm between the docs-commit arm and the range-probe arm ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`. (AI-declared)
  2. Deleting the fetch-refresh command from the Gate-2 region fails D22 — the fetch-absent
     negative reference (the command dropped, the freshness prose's in-position bare-fetch words
     retained, G13) is asserted red through the live key ·
     check: the same suite green at tip; the mutated-region scratch red recorded in the done
     report. (AI-declared)
  3. Deleting the neutralized-pair exemption prose fails D22 — the exemption arm exists and the
     exemption-absent negative reference is asserted red ·
     check: `grep -c 'This reverts commit' skills/war/assets/skill-doc-contracts.test.mjs`
     returns nonzero (0 at base — non-vacuous); the scratch red recorded in the done report.
     (AI-declared)
  4. `D22_ORDERED_SPAN`'s match against the live Gate-2 region terminates at the
     `provision-worktrees.sh`-adjacent `ensure-origin` push invocation, never at either in-region
     prose mention ·
     check: a one-shot `node -e` probe comparing the match's end offset against the region's
     push-invocation offset (the development drill; base state recorded at conversion: match end
     5570 < invocation 6046 — the decoy). The standing lock is the invocation-anchored terminal
     arm plus the updated negatives. (AI-declared)
  5. References (d) (range token present / command form absent) and (e) (revert routing absent)
     exist and are asserted red, and the RESIDUAL paragraph is retired — every load-bearing
     fragment of the key has a both-ways proof ·
     check: `grep -c 'RESIDUAL, recorded rather than waived'
     skills/war/assets/skill-doc-contracts.test.mjs` returns 0 (1 at base); the suite green.
     (AI-declared)
  6. The three pre-existing negative references each still differ from the live shape at exactly
     their designated point — each now carries the fetch step and the exemption sentence, and each
     is re-proven red at its designated arm ·
     check: the suite green; one mutated-copy drill per reference recorded in the done report
     (the update hazard: an unproven update silently converts a proof into a decoration).
     (AI-declared)
  7. The D22 banner's reference count words equal the actual reference count, the census reflects
     Context 4's corrected token map (incl. the two-token `resume-and-recovery.md` correction and
     the two sanctioned in-region survivors), and the test title and header comment carry
     #1288/#1287 ·
     check: `grep -c 'THREE negative' skills/war/assets/skill-doc-contracts.test.mjs` returns 0
     (2 at base — the banner plus the RESIDUAL paragraph's "All THREE negatives below" carrier,
     which End state 5's retirement removes) AND `grep -c 'three near-miss'
     skills/war/assets/skill-doc-contracts.test.mjs` returns 0 (1 at base);
     count-equals-enumeration judged against the landed reference list; census re-measured at the
     rebased base first. (AI-declared)
  8. The lesson's Mitigation layer-2 bullet describes the fetched range probe (fetch first, range
     probe, deterministic fallback) as a dated snapshot naming this plan, retains the closing lock
     sentence naming the D22 ordered key, and the retired HEAD-only literal is gone ·
     check: `grep -Fc 'git show --name-only --format= HEAD'
     docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
     returns 0 (1 at base) AND `grep -Fc '@{upstream}'` on the same file returns nonzero (0 at
     base) — then the mandatory hand-scan of the full lesson body for same-meaning
     tip-only-probe prose, stragglers listed as survey-derived corrections (the `Detection` and
     `Prevention` sections are incident-era narration — exempt, never rewritten). (AI-declared)
  9. Frontmatter, keywords, and every lesson section other than the Mitigation layer-2 bullet are
     byte-untouched, and the redaction lint stays green ·
     gate: the self-discovery gate (the war-memory lint wrapper is a discovered member); the
     byte-scope judged at audit_sha (the task diff touches only the one bullet). (AI-declared)
  10. The full gates are green at the integrated tip with zero production-behavior diff beyond
      the two Gate-2 sentences — the landed Phase-1 diff touches only `skills/war/SKILL.md`,
      `skills/war/assets/skill-doc-contracts.test.mjs`, and the lesson file ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0; the
      footprint judged at audit_sha. (AI-declared)
  11. Every plan-tracked issue is cited by at least one commit in the phase range `<phase-base>..<tip>` — #1288 for the fetch prose + arm, #1287 for the
      exemption/terminal/residual/census work, #1293 for the lesson bullet ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)*
      (AI-declared)
  12. Release: all four version slots move lock-step to the next free patch above the live
      integration base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor;
      the bump's presence judged at audit_sha). (AI-declared)

## Build order (for /war)

Phase 1 (wave 1 = Task 1.1; wave 2 = Task 1.2, `deps: [1.1]` — the G11 content edge) → Phase 2
(release).

The binding cross-PLAN ordering (this plan after plans 9 and 10) is enforced by Task 1.1's G12
witnesses and the roadmap spine, not by intra-plan structure.

## Phase 1 — Probe freshness + D22 key repair, then the incident record

### Task 1.1: Gate-2 fetch-refresh prose + the full D22 key repair (one guard-coupled unit)

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **Witness first (G12/A5)** — after the standard rebase onto the integration tip,
  verify `grep -c 'clock read' skills/war/SKILL.md` ≥ 1 (plan 9's Task 1.3 landed) AND
  `grep -c 'backticks' skills/war/SKILL.md` ≥ 1 AND
  `grep -c 'D31_ARMS_COLLIDED' skills/war/assets/skill-doc-contracts.test.mjs` ≥ 1 (plan 10's
  Task 1.2 landed — the predecessor task sharing both of this task's files; all three tokens are
  0 at `6fff2ee`, so none can pass at the un-landed base). A miss means a predecessor has not
  landed: **halt and report, never improvise.** Then re-measure the dated snapshots (A6): the
  `ensure-origin` census (file-wide and in-region), the region's `ensure-origin`/push-invocation
  offsets, the two-token `resume-and-recovery.md` count, `wc -c skills/war/SKILL.md` (A7) — a
  moved count is re-pinned, never guard-dropped.
  **SKILL.md prose (G1/G3, #1288)** — in the `**Pre-push staged-file check (never skip).**`
  bullet, insert the freshness step immediately before the `git log --name-only` probe, kept to
  roughly two sentences (A7): (i) refresh first — `git fetch origin <working>` in the publication
  worktree; remote-tracking refs are only as fresh as the last fetch, and an unrefreshed left
  boundary would condemn (and revert) commits origin already has; (ii) on non-zero fetch exit —
  do not probe, do not push; escalate, leaving the worktree in place for inspection (the flow's
  standing posture). Exact wording is worker latitude bounded by: the G4 arm must match it, the
  budget note (A7), and **no new `ensure-origin` token** (the census). Every other Gate-2
  sentence is byte-untouched (Non-goals).
  **D22 key repair (`skill-doc-contracts.test.mjs` — all against the named constructs
  `D22_ORDERED_SPAN`, `D22_REGION_HEAD_ONLY_PROBE`, `D22_REGION_WITHOUT_UNDO`,
  `D22_REGION_WITHOUT_RANGE`, and the D22 test block):**
  (a) **Extend the ordered key** (arm order mirrors live prose order): docs-commit arm → **fetch
  arm (G4/G13 — the `git fetch origin` adjacent form, never bare `fetch`)** → range-probe
  command-form arm → range-token arm → do-not-push arm → **exemption arm (G5 — the
  `This reverts commit` mid-sentence adjacent form)** → `reset --hard HEAD~1` arm → `git revert`
  arm → **re-anchored terminal arm (G6 — `provision-worktrees.sh` adjacent to `ensure-origin`,
  the invocation shape)**. Keep the single-regex markup-tolerant idiom; every arm anchors inside
  the bounded extracted region (the bounded-region constraint — no arm may rely on
  first-token-after scanning, the label-to-guard-region class).
  (b) **Update the three existing negative references** (G14): each gains the fetch step and the
  exemption sentence (their push lines are already invocation-shaped) so each still differs from
  the live shape at exactly its designated point; re-prove each red at exactly its designated arm
  via the mutated-copy drill (End state 6 — the update hazard).
  (c) **Add four new negative references, each asserted red through the same live key:** fetch
  absent — the `git fetch origin` command dropped while the freshness sentence's bare-fetch
  explanatory prose stays in position, proving the adjacency pinning (G13; the analogue of
  negative (b)'s bare `reset --hard` doctrine mention); exemption absent; (d) range token present
  / command form absent; (e) revert routing absent (G7). Retire the RESIDUAL paragraph (End
  state 5).
  (d) **Comment + title currency (G8):** rewrite the census sentence to Context 4's corrected
  map — `references/setup.md` zero `ensure-origin` / one `remove-publication-worktree`,
  `references/resume-and-recovery.md` **two** `ensure-origin` tokens (both in its Checkpoint
  absent-origin-baseline arm), Setup step 2 one, and the two in-region prose mentions recorded as
  sanctioned survivors the invocation-anchored terminal arm is designed to skip (re-measured at
  the rebased base first; counts stated as dated snapshots) — replace the "THREE negative
  references" / "three near-miss" count words with the landed count (seven references at this
  plan's shape — G14; count-equals-enumeration, the banner-undercount class), and append
  #1288/#1287 to the D22 test title and the header comment's issue list.
  (e) **Development drills, recorded verbatim in the done report:** the End state 4 offset probe
  (one-shot `node -e`: the live key's match end vs the region's push-invocation offset — after
  the re-anchor the match must terminate at the invocation); the End state 2/3 scratch
  region-mutations; the per-reference red drills of (b)/(c). Key-vs-prose lockstep: the fetch
  sentence and the full key repair land in the **same commit** (a prose-first split ships the
  flow unguarded — the exact #1287a failure class). Run the suite before and after every step.
  Commits cite #1288 (prose + fetch arm) and #1287 (everything else) — End state 11.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Incident-record currency — the Mitigation layer-2 bullet

- Files: `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
- Plan slice: **first act after the deps-edge rebase (G11):** re-read the landed Gate-2 flow at
  the integration tip — the bullet must describe the probe shape Task 1.1 actually landed, never
  this plan's paraphrase of it. Rewrite **only** the `## Mitigation (#1083)` section's layer-2
  bullet (anchor by that heading — the issue's "Remedies landed" heading name is stale, Context
  3): the pre-push check enumerates every unpushed commit and its file set over a freshly-fetched
  range (`git fetch origin <working>` first — fail-closed — then
  `git log --name-only --format='commit %H' '@{upstream}'..HEAD` with the deterministic
  `origin/<working>..HEAD` fallback), condemning any commit whose file set escapes the promotion
  destination — stated as a dated snapshot naming this plan's slug and land date, and retaining
  the bullet's closing sentence that the flow is locked by
  `skills/war/assets/skill-doc-contracts.test.mjs`, updated to name the D22 ordered key. The
  retired `git show --name-only --format= HEAD` literal must not survive in the bullet.
  Frontmatter, keywords, and every other body section stay byte-untouched (End state 9's
  audit_sha scope). **Grep floor + manual survey (End state 8):** after the two mechanical greps
  (retired literal → 0, `@{upstream}` → nonzero, both `-F`), hand-scan the whole lesson body for
  same-meaning prose describing a tip-only/staged-file-list probe and list each straggler as a
  survey-derived correction — the `Detection` and `Prevention` sections describe the incident era
  and are narration-position: exempt, never rewritten; record the outcome even when zero
  stragglers. The redaction lint gates the edit (a discovered gate member). Commit cites #1293 —
  End state 11.
- Done when: None — prose-only committed-doc edit; the mechanical pins are End state 8's greps
  plus the lint gate member (End state 9); no suite reads this file's body.
- requiresTest: false
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb
  (replace-in-place, never an empty field, no badge) — to the **next free patch above the live
  integration base at land time**; never a resolved version literal (any version literal in this
  plan or the campaign roadmap is non-authoritative). Expected integration base: the tip after
  predecessors `2026-08-06-handoff-schemas-contract` and `2026-08-06-structural-pin-extractors`
  (this plan's declared upstream edges) plus whichever other 2026-08-06 campaign predecessors the
  roadmap sequences ahead (ADR 0011 stack-and-plow). Standalone fallback: this plan does not run
  before plans 9 and 10 — the G12 witnesses halt-and-report a missing predecessor (never a
  downshift); on a witnessed plain-`/war` run, resolve the next free patch from the four slots
  themselves. The Status blurb names: the Gate-2 range probe's left boundary freshened by a
  fail-closed `git fetch origin <working>` before every probe, and the D22 ordered key repaired
  and extended — the fetch and neutralized-pair-exemption arms added, the terminal arm re-anchored
  on the push invocation, and every load-bearing fragment now carrying a both-ways negative
  reference — quoting only identifiers that exist in the landed diff (release-blurb lessons:
  count words match the enumeration; quoted literals byte-match landed identifiers; guard
  semantics stated no wider than the implementation — the fetch is the only production-behavior
  change, procedural and Lead-side).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Field evidence that a stale-boundary condemnation no longer occurs — a Gate-2 pass in a real
  campaign whose publication worktree was provisioned fetch-less · why deferred: needs a live
  campaign pass · runner: the next campaign's phase reports / `/war-review`. (AI-declared)
- The development drills of End states 2, 3, 4, and 6 (scratch region-mutations, the terminal-arm
  offset probe, the per-reference red drills) · why deferred: delete-and-trace mutation runs and
  one-shot offset probes are uncommittable by design — the committed key, references, and the
  extraction's non-vacuity assert are the standing locks · runner: Task 1.1's worker runs each
  locally and records the reds/offsets verbatim in the done report; gate-audit reads them SOFT,
  never a hold. (AI-declared)
- The predecessor witnesses (G12/A5) on a standalone run · why deferred: a campaign run
  discharges them by spine order; only a plain-`/war` run can encounter the missing-predecessor
  state · runner: Task 1.1 runs the three greps as its first post-rebase act and halt-and-reports
  on a miss — the standalone fallback is halt, never improvisation. (AI-declared)
- The manual survey halves of End states 7 and 8 (the `ensure-origin` census hand-scan at the
  rebased base; the lesson-body same-meaning-prose hand-scan) · why deferred: a hand-scan cannot
  be a mechanical gate member; done-report-only evidence · runner: the owning task's worker (1.1
  for the census, 1.2 for the lesson) records each outcome — mandatory statement even when zero
  stragglers; the Lead re-runs the paired greps at phase close. (AI-declared)
- The A7 budget valve (the fetch sentence-pair plus plans 9/10's additions tripping the 64,512 B
  advisory line) · why deferred: measurable only at the rebased base · runner: Task 1.1's worker
  re-measures `wc -c`, records it, and on a trip cites ADR 0042's justification rule in the
  commit body — never rewords guarded sentences to compensate. (AI-declared)

## Notes / conscious deviations

1. **Stacking honesty — the corrected construct map (Context 6).** The spec's §8 sentence "all
   three touch `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`" is
   corrected in this plan: plan 9 never edits `skill-doc-contracts.test.mjs` (verified against
   its committed `- Files:` lines; its own Note 5 records the same overstatement). Both upstream
   edges survive as **order-only** edges: plan 9 on `skills/war/SKILL.md` contention
   (region-disjoint from the Gate-2 extraction region — its § Per phase edit sits before the
   `**Post-servitor publication (Gate 2` marker, its § Checkpoint edit after the region's closing
   heading), plan 10 on both files (D31 block + doc-cascade banner vs the D22 block —
   construct-disjoint but **adjacent**: plan 10's banner rewrap touches the bytes directly below
   the D22 test block, so Task 1.1 re-reads the post-rebase file before editing and the serial
   plan order absorbs the adjacency). The G12 witnesses pin exactly the predecessor tasks that
   share this plan's files. (AI-declared)
2. **The G13 fetch-arm pinning is a refinement beyond the spec, corrected by execution** — the
   spec's G4 says "`git`-adjacent `fetch origin` fragment"; the conversion's first-pass rationale
   (the push-failure "fetch and replay" sentence as the bare-key decoy) was **mechanically
   false** — every replay fetch token sits after the probe arm's last token, so ordering alone
   kills a bare key against a fetch-pair-deleted region (executed both ways: that region is red
   under both key forms). The real decoy is the freshness pair's own explanatory words ("only as
   fresh as the last fetch", "non-zero fetch exit"): stripping only the command while keeping
   that prose greens a bare key and reds the adjacent key. The fetch-absent negative reference is
   therefore designed command-dropped / prose-retained — the exact analogue of negative (b)'s
   bare `reset --hard` doctrine mention. Executed, never assumed; /red-team re-verifies.
   (AI-declared)
3. **Bounded-region discipline stated as a constraint, not left implicit** — the D22 key is the
   canonical example of the label-to-guard-region lesson family, and plan 10 just stamped that
   lesson RESOLVED for the D6 sibling it fixed. This plan's terminal-arm re-anchor is the same
   class applied to D22: anchor on the real construct (the push invocation), never
   first-token-after; every arm in-region; the extraction's non-vacuity assert stands
   byte-untouched. No EOF-scan shape is introduced anywhere in the repair. (AI-declared)
4. **No lesson stamp belongs to this plan.** #1293's subject lesson gets a body-bullet rewrite
   (G9), not a RESOLVED stamp — its description already reads `MITIGATED (#1083)` for a different,
   genuinely-landed mitigation, and this plan neither resolves nor retires the lesson's class
   fact. Neither #1288 nor #1287 carries a `Lesson:` line naming a companion lesson (verified:
   both issue bodies, read at conversion). (AI-declared)
5. **Posterity survivors.** Historical artifacts keep the retired wordings and are never
   retro-edited (ADR 0046 posture): the three source issues' verbatim quotes, the source spec,
   the plan and red-team report of `2026-08-02-war-engine-and-standing-doc-truth`, and the
   lesson's exempt `Detection`/`Prevention` sections all legitimately carry the retired
   HEAD-only-probe description or the pre-repair key shape. Every OLD-absent check here is scoped
   to the single live surface its End state names — the test file (End states 5/7) and the
   lesson's Mitigation bullet (End state 8). (AI-declared)
6. **Intent provenance + AFK conversion record (AI-declared).** The pipeline runs `--afk` (no
   operator volley ratifies this plan), so it carries `## AI-Commander's Intent` and the
   AI-declared backstops heading (ADR 0014), and every row this conversion authored without
   operator ratification carries an inline AI-declared marker. Part 1 and the intent block are
   distilled from the ratified source spec — itself synthesized from the auditor-found #1288 and
   #1287 (the second Lead-verified) and the red-team-adjudicated follow-up #1293; the spec's
   flagged [assumed] rows are carried as A1–A4 with fallbacks intact; conversion-time judgments
   (G12–G16, A5–A7, Notes 1–5) are logged for /red-team re-verification.
   **Predecessor-consistency check** (afk-conversion doctrine): committed plans 1–8 carry the
   operator-form intent heading; plans 9, 10, and 11 are the batch's AI-form blocks and this plan
   is the fourth — tone, scope discipline, and the standing constraints (fail-closed guards with
   both-ways proof, halt-on-miss witnesses, anchor-by-construct, release-trailing,
   dated-snapshot re-measure duty) continue the predecessors' shape unchanged; no divergence
   beyond the ADR 0014 heading pair itself. Recorded here, never silently shipped.
7. **Check sharpenings vs the spec (G16)** — knowing deviations, all tightenings: (a) End
   state 5 replaces the spec's prose-form "retire the RESIDUAL paragraph accordingly" with the
   mechanical OLD-absent pin on the paragraph's own lead token (1 at base, non-vacuous); (b) End
   state 7 adds the two count-word OLD-absent pins (2 and 1 at base — Context 5) beside the spec's
   count-equals-enumeration form; (c) End state 8 runs both lesson greps `-F` (the retired
   literal and `@{upstream}` carry metacharacters — platform law); (d) the conversion re-ran the
   spec's §1287b mechanical probe live and pinned the base offsets (5570 / 6046) into End state 4
   as the recorded before-state. The spec's V-numbering maps: V1→1, V2→2, V3→3, V4→4, V5→5/6/7,
   V6→8, V7→9, V8→10; End states 11 and 12 are the batch-standard issue-citation and release
   criteria the spec leaves to conversion. (AI-declared)

## Open decisions

None. The spec's design tree is fully resolved; the spec-flagged veto points (A1 mechanism, A2
fail-closed posture, A3 comment currency, A4 worker-edits-committed-lesson) and every
conversion-time self-adjudicated judgment (G12–G16, A5–A7, Notes 1–7) are logged above for
/red-team — the sole downstream ratifier under `--afk`.
