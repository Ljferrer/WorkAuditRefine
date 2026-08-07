# Gate-2 publication guard — range-probe freshness, D22 key repair, and probe-description currency

Issues: #1288, #1287, #1293

One flow, three defects. The Gate-2 pre-push staged-file check in `skills/war/SKILL.md` probes an
unpushed range whose left boundary is an unrefreshed remote-tracking ref, so condemnation — and the
revert arm behind it — is not bounded to this pass's commits (#1288). The D22 ordered key in
`skills/war/assets/skill-doc-contracts.test.mjs` that guards this flow has two holes: the
neutralized-pair exemption is unpinned, and the terminal `ensure-origin` arm now matches a prose
decoy instead of the push invocation (#1287). And the incident record
`docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` still
describes the retired HEAD-only probe in the present tense (#1293). This spec adds a guarded
freshness step before the probe, repairs and extends the D22 key with proven-red negative
references, and brings the lesson's remedy bullet up to the probe shape this spec lands.

## 1. Context — the gap / problem

**The unrefreshed left boundary (#1288).** The Gate-2 pre-push staged-file check enumerates every
unpushed commit via `git log --name-only --format='commit %H' '@{upstream}'..HEAD`, with one
deterministic fallback to `origin/<working>..HEAD` when the transient publication worktree has no
upstream (verified: issue #1288 (2026-08-06); confirmed in the `**Post-servitor publication
(Gate 2` flow of `skills/war/SKILL.md`, read 2026-08-06 at `6fff2ee`). Both left boundaries are
remote-tracking refs, only as fresh as the last fetch. No fetch precedes the probe anywhere in the
Gate-2 flow — the file's only fetches are the retired-token sweep's `git fetch origin <working>`
(conditional: it runs only when that sweep triggers, so it is an incidental freshener, never a
guarantee) and the post-push-failure replay (verified: grep of `skills/war/SKILL.md` for `fetch`,
2026-08-06 at `6fff2ee`). In a publication worktree provisioned without a preceding fetch,
`origin/<working>` can lag the real remote tip, the probed range then includes already-pushed
commits, and any of them carrying a non-promotion path is condemned — routing the undo's revert arm
onto published history, the exact outcome the routing's own never-rewind-published-history principle
exists to prevent (verified: issue #1288 (2026-08-06)).

**The D22 key's two holes (#1287).**

- (a) End state 18's neutralized-pair exemption and the re-probe termination sentence landed in the
  Gate-2 flow (the `**Neutralized-pair exemption:**` and `**The undo pass terminates` spans), but
  the D22 ordered key does not cover them: `skills/war/assets/skill-doc-contracts.test.mjs` carries
  zero `neutralized` / `exemption` / `This reverts` tokens (verified: issue #1287 (2026-08-06);
  grep count 0 confirmed 2026-08-06 at `6fff2ee`). Deleting the exemption leaves D22 green,
  breaking the ADR 0025 guard-travels-with-the-fact duty on the headline fix of plan
  `2026-08-02-war-engine-and-standing-doc-truth` (its End state 18 explicitly requires "the D22
  key's revert-routing arm covers it" — verified: that plan's End state 18, read 2026-08-06).
- (b) `D22_ORDERED_SPAN` terminates on bare `/ensure-origin/`, and the same diff that added the
  exemption prose added two in-region `ensure-origin` mentions ahead of the push step — `the fork
  point against the `ensure-origin` push target` (in the fallback sentence) and `proceeds to the
  `ensure-origin` push below` (in the termination sentence). The extracted Gate-2 region now
  carries three `ensure-origin` tokens; a mechanical probe of the live key against the live region
  shows the ordered match ending inside the termination sentence's decoy, with the
  `provision-worktrees.sh ensure-origin` push invocation sitting later in the region, outside the
  match (verified: issue #1287 (2026-08-06); reproduced by executing `D22_ORDERED_SPAN` against
  the extracted region, 2026-08-06 at `6fff2ee` — match end precedes the push-invocation offset).
  The terminal arm no longer pins what it names. Same brittleness family as #1275 (verified: issue
  #1287 (2026-08-06)).

**The stale incident record (#1293).** The lesson
`docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` describes, in
present tense, the Gate-2 pre-push check as listing "the docs commit's staged file set (`git show
--name-only --format= HEAD`)" — the retired HEAD-only probe (verified: issue #1293 (2026-08-06);
confirmed under the lesson's `## Mitigation (#1083)` section, layer-2 bullet, read 2026-08-06 at
`6fff2ee`). Survey-derived correction: the issue body cites the bullet as sitting "under **Remedies
landed**" — the live heading is `## Mitigation (#1083) — three layers, all landed in one phase`;
anchor by that heading's layer-2 bullet, not the issue's heading name. Red-team round 1 of plan
`2026-08-02-war-engine-and-standing-doc-truth` found the bullet as a third live carrier of the
retired probe and adjudicated it to a follow-up (an in-task repo-root `docs/learnings/` write by a
worker of that plan contradicted the two-root split that plan itself asserts, and widening its End
state 15 diff census was the wrong trade); it is a recorded sanctioned survivor of that plan's
retirement grep (verified: issue #1293 (2026-08-06)). Its correct final wording depends on the
probe shape #1288 lands — hence one spec.

## 2. Pivotal constraints

- **ADR 0025 (guard travels with the fact):** every Gate-2 prose change lands with its D22 arm in
  the same task; a new arm without a proven-red negative reference is a blind spot, not a lock (the
  recorded `structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census`
  class). The D22 block comment itself instructs: "A future edit to this key should add those
  references rather than assume the arms are proven" — this spec's edit is that future edit.
- **Never relax a negative reference to make the key pass** — the D22 test's own assertion message
  is binding; tightening the key is the only sanctioned direction.
- **One ordered key, markup-tolerant:** D22 stays a single ordered regex (the `[\s*`]{0,4}`
  emphasis-tolerance idiom), never independent presence checks; arm order mirrors the live prose
  order.
- **Never rewind published history:** the #1288 fix must make the probe's condemnation sound
  (bounded to unpushed commits) rather than adding guardrails downstream of an unsound probe.
- **ADR 0042 budget pressure:** `skills/war/SKILL.md` measures 63,197 B against a 64,512 B
  advisory / 73,728 B hard budget (snapshot 2026-08-06 at `6fff2ee`) — ~1.3 KB of advisory
  headroom. The freshness step must be one tight sentence-pair; if the advisory line trips, the
  commit body cites ADR 0042's justification rule.
- **Two-root discipline:** the lesson edit is maintenance of an already-published, committed repo
  doc — it must not be framed as a servitor lesson write or a Gate-2 promotion.
- **Redaction lint:** the edited lesson must keep `node skills/_shared/war-memory.mjs lint
  docs/learnings/` green (the only thing CI runs).
- **Auditor guard unchanged:** the new fetch runs Lead-side inside the Gate-2 flow;
  `hooks/validate-auditor-git.sh`'s deliberate exclusion of `fetch` from the auditor verb allowlist
  is untouched.

## 3. Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| G1 | Freshness mechanism (#1288) | Refresh-before-probe: `git fetch origin <working>` in the publication worktree, immediately before the range probe — the same idiom the retired-token sweep already uses; it updates `origin/<working>` (and thereby `@{upstream}` when configured, since the fallback names the same counterpart) | (verified: issue #1288 (2026-08-06), first fix option; idiom precedent verified in the retired-token sweep paragraph of `skills/war/SKILL.md`) |
| G2 | Rejected alternative | Fork-point SHA recorded at provisioning — rejected: adds state plumbing to `cmd_ensure_publication_worktree` in `skills/war/assets/provision-worktrees.sh` (a third code surface plus a threading path), where the fetch is one idempotent command on an existing surface | [assumed: minimal-diff preference — if wrong: the fork-point variant is the follow-up, not a patch to this one] |
| G3 | Fetch-failure posture | Fail-closed: a non-zero fetch exit stops the pass — escalate, leave the worktree in place (the flow's standing posture) — never probe against a stale boundary | [assumed: condemnation against a stale boundary is unsound and the revert arm makes unsoundness destructive — if wrong (operator prefers fail-open + warn), one sentence changes] |
| G4 | Freshness guard (#1288 pair) | New D22 fetch arm — `git`-adjacent `fetch origin` fragment ordered between the docs-commit arm and the range-probe arm — plus a new negative reference (fetch absent, all else live) asserted red | (verified: issue #1288 (2026-08-06), "paired with a D22 arm so the refresh duty is guarded rather than prose-only") |
| G5 | Exemption arm (#1287a) | New D22 arm keyed on the mid-sentence `This reverts commit` adjacent form (markup-tolerant), ordered between the do-not-push arm and the `reset --hard HEAD~1` arm — mirroring live prose order — plus a new negative reference (exemption absent) asserted red | (verified: issue #1287 (2026-08-06)) |
| G6 | Terminal arm re-anchor (#1287b) | Anchor on the push **invocation** shape — `provision-worktrees.sh` adjacent to `ensure-origin` — never the bare token; the two in-region prose mentions become recorded sanctioned survivors in the D22 block comment's census | (verified: issue #1287 (2026-08-06)) |
| G7 | Recorded-residual closure | Close the D22 comment's two recorded both-ways gaps in the same key edit: reference (d) range token present / command form absent, and reference (e) revert routing absent, both asserted red | (verified: the D22 block comment's RESIDUAL note, read 2026-08-06 at `6fff2ee` — it instructs exactly this) |
| G8 | Census + banner currency | Update the D22 block comment's token census and the "THREE negative references" / "three near-miss" count words to the new reference count in the same diff (the recorded banner-undercount class); append #1288/#1287 to the D22 test title's issue list | [assumed: comment-currency duty follows the key it documents — if wrong: drop the census sentence, keep the count words] |
| G9 | Lesson wording (#1293) | Rewrite the `## Mitigation (#1083)` layer-2 bullet to describe the landed shape in present tense — range probe (`git log --name-only --format='commit %H' '@{upstream}'..HEAD`), deterministic `origin/<working>..HEAD` fallback, and the G1 pre-probe fetch — dated as a snapshot ("as of" + plan/date); everything else in the body byte-untouched | (verified: issue #1293 (2026-08-06), first fix option, sharpened to include the shape this spec lands) |
| G10 | Lesson edit vehicle | A normal worker task editing a committed repo doc through the standard worktree/merge path — not a servitor write, not a Gate-2 promotion; the two-root split governs lesson *capture* routing, not planned maintenance of a published record | [assumed: the #1293 adjudication rejected an *in-flight, unplanned* worker write within that plan, and named the next sweep as owner — if wrong: route the edit as a Lead/operator commit outside /war] |
| G11 | Sequencing | The lesson task depends on the SKILL.md task (its wording describes the landed probe): same phase, `deps` wave edge — the files are disjoint, so this is a content edge, never a collision dodge | (verified: decomposition rules 2 and 7, `skills/war-strategy/SKILL.md` §3) |

## 4. Mechanics

### a. `skills/war/SKILL.md` — the Gate-2 flow (one surface, two issues' prose)

In the `**Post-servitor publication (Gate 2` flow, inside the `**Pre-push staged-file check (never
skip).**` bullet, insert the freshness step immediately before the `git log --name-only` probe
(G1/G3), kept to roughly two sentences to respect the budget headroom:

- Refresh first: `git fetch origin <working>` in the publication worktree — remote-tracking refs
  are only as fresh as the last fetch, and an unrefreshed left boundary would condemn (and revert)
  commits origin already has.
- On non-zero fetch exit: do not probe, do not push — escalate, leaving the worktree in place for
  inspection (the flow's standing posture).

No other rewording of the flow: the probe commands, fallback, condemnation, exemption, undo
routing, termination, and push sentences stay byte-untouched (the D22 key must keep matching the
surviving prose; #1287's fixes are test-side).

### b. `skills/war/assets/skill-doc-contracts.test.mjs` — the D22 key repair

All against the named constructs `D22_ORDERED_SPAN`, `D22_REGION_HEAD_ONLY_PROBE`,
`D22_REGION_WITHOUT_UNDO`, `D22_REGION_WITHOUT_RANGE`, and the D22 test block:

1. **Extend the ordered key** (arm order mirrors live prose order): docs-commit arm → **fetch arm
   (G4)** → range-probe command-form arm → range-token arm → do-not-push arm → **exemption arm
   (G5,** `This reverts commit` **adjacent form)** → `reset --hard HEAD~1` arm → `git revert` arm →
   **re-anchored terminal arm (G6,** `provision-worktrees.sh` **adjacent to** `ensure-origin`**)**.
   Keep the single-regex, markup-tolerant idiom.
2. **Update the three existing negative references** so each still differs from the live shape at
   exactly its designated point (each must now carry the fetch step, the exemption sentence, and
   the invocation-shaped push line, or it would go red at the wrong arm and stop proving its own).
3. **Add new negative references, each asserted red through the same live key:** fetch absent (G4);
   exemption absent (G5); range token present / command form absent (G7 ref d); revert routing
   absent (G7 ref e). With (a)/(b)/(c) updated, every load-bearing fragment of the key then has a
   both-ways proof — retire the RESIDUAL paragraph in the block comment accordingly.
4. **Comment + title currency (G8):** update the census sentence (see survey findings below),
   replace the "THREE negative references" / "three near-miss" count words with the new count, and
   append #1288/#1287 to the D22 test title and header comment's issue list.

**Token-sweep duty discharged (grep floor + manual survey).** The grep census of `ensure-origin`
at `6fff2ee` (2026-08-06): `skills/war/SKILL.md` carries four tokens — Setup step 2, two in-region
prose mentions, the push invocation. The mandatory hand-scan of the same-scope comments and sibling
files found two stragglers the existing D22 comment census misses, listed here as survey-derived
corrections for the G8 rewrite: (i) `skills/war/references/resume-and-recovery.md` carries **two**
`ensure-origin` tokens (both in its absent-origin-baseline arm), where the comment claims one;
(ii) the comment's in-region accounting predates the two prose mentions entirely — record both as
sanctioned in-region survivors that the terminal arm's invocation anchor is designed to skip.
`skills/war/references/setup.md` carries zero `ensure-origin` tokens and one
`remove-publication-worktree`, matching the comment. Any implementing task must re-run this census
at its rebased base and hand-scan again — the counts above are a dated snapshot, not a ceiling.

### c. `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`

Rewrite only the `## Mitigation (#1083)` section's layer-2 bullet (G9): the pre-push check
enumerates every unpushed commit and its file set over a freshly-fetched range
(`git fetch origin <working>`, then `git log --name-only --format='commit %H' '@{upstream}'..HEAD`
with the deterministic `origin/<working>..HEAD` fallback), condemning any commit whose file set
escapes the promotion destination — stated as a dated snapshot naming this spec's plan, and
retaining the bullet's closing sentence that the flow is locked by
`skills/war/assets/skill-doc-contracts.test.mjs` (now the D22 ordered key). The retired
`git show --name-only --format= HEAD` literal must not survive in the bullet. Frontmatter,
keywords, and every other body section stay byte-untouched; the lint must stay green.

Grep floor + manual survey for the retirement: after grepping the lesson for the retired literal,
hand-scan the whole lesson body for same-meaning prose describing a tip-only/staged-file-list
probe and list each straggler as a survey-derived correction (the `Detection` and `Prevention`
sections describe the incident era and are narration-position — exempt, do not rewrite them).

## 5. Surface changes

- `skills/war/SKILL.md` — Gate-2 pre-push bullet: fetch-refresh sentence pair (only prose change)
- `skills/war/assets/skill-doc-contracts.test.mjs` — `D22_ORDERED_SPAN` + three updated and four
  new negative references + comment census/banner/title currency
- `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` —
  Mitigation layer-2 bullet only
- Release: four version slots, own trailing phase (repo law)

## 6. New domain terms (CONTEXT.md)

None — every construct named here (Gate-2 promotion, publication worktree, D22, neutralized pair,
sanctioned survivor) already has its home.

## 7. Recommended ADRs

None. G1/G3 apply existing doctrine (ADR 0022 publication integrity, ADR 0025 drift guards, the
standing escalate posture) to a missed step; nothing here is hard-to-reverse or
surprising-without-context on its own. The one judgment call worth a paper trail (G3's fail-closed
fetch) is recorded in this spec's design tree and the flow's own prose.

## 8. Open risks / implementation notes

- **Ordering (machine hint mirrored in the survey manifest):** this group lands **after** the
  sibling groups `structural-pin-extractors` and `handoff-schemas-contract` — all three touch
  `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`. Every measured literal
  in this spec (byte sizes, token counts, match offsets, the D22 arm inventory) is a snapshot at
  `6fff2ee` (2026-08-06) and MUST be re-measured at the implementing task's rebased base — the
  sibling groups may move the very constructs this spec edits.
- **One task owns both guard-coupled files:** the SKILL.md prose edit and every test-side change
  (#1288's arm and #1287's repairs) share `skills/war/assets/skill-doc-contracts.test.mjs`
  — same-file ⇒ same task (decomposition rule 1); do not split #1287 from #1288 into parallel
  tasks. The #1293 lesson task is file-disjoint and takes a `deps` edge onto it (G11).
- **Negative-reference update hazard:** updating (a)/(b)/(c) to carry the new arms changes
  hand-written fixtures — each must be re-proven red at exactly its designated arm during
  development (run the mutated-copy drill once per reference), or the update silently converts a
  proof into a decoration.
- **Key-vs-prose lockstep:** the fetch sentence and its D22 arm land in the same commit; a
  prose-first split ships the flow unguarded for a phase (the exact #1287a failure class).
- **Budget:** if the SKILL.md addition trips the 64,512 B advisory line, cite ADR 0042's
  justification rule in the commit body; do not compensate by rewording guarded sentences.
- **G10 assumption is vetoable:** if the operator holds that no worker may touch
  `docs/learnings/`, the lesson edit routes as a Lead/operator commit and the task drops from the
  plan — the spec's other two surfaces are unaffected.

## 9. Non-goals / deferred

- No fork-point-at-provisioning state in `skills/war/assets/provision-worktrees.sh` (G2 rejected
  alternative; revisit only if the fetch idiom proves insufficient in the field).
- No redesign of the condemnation/exemption/undo semantics — #1288 bounds the range; the routing
  logic is untouched.
- No auditor-guard widening: `fetch` stays excluded from `hooks/validate-auditor-git.sh`'s verb
  allowlist.
- No `/lessons-learned` housekeeping beyond the one bullet — description, keywords, archive
  status, and the lesson's other sections are out of scope.
- No re-fetch before the post-undo re-probe: the worktree is held across the pass and the
  boundary was freshened at entry; a second fetch is redundant and out of scope.
- No edits to the plan or red-team report of `2026-08-02-war-engine-and-standing-doc-truth` —
  historical artifacts stay as adjudicated.

## 10. Validation criteria

- V1 WHEN the Gate-2 flow reaches the pre-push staged-file check THE `skills/war/SKILL.md` prose
  SHALL order a `git fetch origin <working>` refresh (with the fail-closed escalate arm) before the
  `git log --name-only` range probe · check: `node --test
  skills/war/assets/skill-doc-contracts.test.mjs` — the extended `D22_ORDERED_SPAN` places the
  fetch arm before the probe arm.
- V2 WHEN the fetch-refresh sentence is deleted from the Gate-2 region THE D22 test SHALL fail ·
  check: the fetch-absent negative reference is asserted red through the live key in the same test
  (proven once against a mutated region copy during development).
- V3 WHEN the neutralized-pair exemption prose is deleted from the Gate-2 region THE D22 test SHALL
  fail · check: the exemption-absent negative reference asserted red; plus
  `grep -c 'This reverts commit' skills/war/assets/skill-doc-contracts.test.mjs` returns nonzero
  (the arm exists — snapshot count 0 at `6fff2ee` is the before state).
- V4 WHEN `D22_ORDERED_SPAN` matches the live Gate-2 region THE match SHALL terminate at the
  `provision-worktrees.sh`-adjacent `ensure-origin` push invocation, never at either in-region
  prose mention · check: a one-shot `node -e` probe comparing the match's end offset against the
  region's push-invocation offset (the development drill; the standing lock is the invocation-
  anchored terminal arm plus its updated negatives).
- V5 WHEN any of the D22 negative references (a)–(e plus the fetch reference) is run through the
  live key THE match SHALL fail, each at its designated arm · check: `node --test
  skills/war/assets/skill-doc-contracts.test.mjs` green, with the reference count word in the D22
  banner equal to the actual reference count.
- V6 WHEN the lesson's Mitigation layer-2 bullet is read THE bullet SHALL describe the fetched
  range probe and SHALL NOT carry the retired HEAD-only literal · check: `grep -c 'git show
  --name-only --format= HEAD'
  docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` returns 0
  AND a grep for `@{upstream}` in the same file returns nonzero — followed by the mandatory
  hand-scan of the full lesson body for same-meaning tip-only-probe prose, stragglers listed as
  survey-derived corrections.
- V7 WHEN the redaction lint runs over the edited lesson THE lint SHALL pass · check:
  `node skills/_shared/war-memory.mjs lint docs/learnings/`.
- V8 WHEN the full contracts suite runs at the landed tip THE suite SHALL be green · check:
  `node --test skills/war/assets/skill-doc-contracts.test.mjs` (baseline: green at `6fff2ee`,
  2026-08-06).

**Deferred-validation candidates:** field evidence that a stale-boundary condemnation no longer
occurs (a Gate-2 pass in a real campaign whose publication worktree was provisioned fetch-less) ·
why deferrable: needs a live campaign pass · runner: the next campaign's phase reports /
`/war-review`.
