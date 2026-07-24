# Drift-guard anchor and floor-diagnostic hardening — pair D18's routing anchors, re-anchor FLOOR_SITE_RE, true up the near-miss advisory and the guard-contract mirror claim

**Issues addressed:** #1040, #1049, #1050, #1080.
**Source lessons:** `docs/learnings/doc-prose-verbatim-claim-overstates-token-anchor-drift-guard.md` (#1080),
`docs/learnings/drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape.md` (#1050).
**Sibling ordering:** builds after `docs/specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md`
(surface contention only — see §2; no design dependency).

## 1. Context — the gap / problem

Four adjacent truth-of-the-guard defects, all verified live on the working tree, none changing any
runtime behavior:

1. **#1040 — D18's site-routing anchors are unpaired.** The D18 test in
   `skills/war/assets/skill-doc-contracts.test.mjs` extracts SKILL.md's `gate_failed`
   **`environment`** arm by construct, then its "Non-vacuous companion" loop asserts four tokens —
   `merge site`, `land site`, `held:escalation`, `held:land-failed` — each *independently present
   anywhere* in the bullet. A doc edit swapping the two exhaustion routes (merge site →
   `held:land-failed`, land site → `held:escalation`) leaves all four tokens present and the row
   green. Same non-discriminating-anchor class the red-team caught pre-execution in plan 4's D3 row.

2. **#1049 — the near-miss advisory blames the wrong cause for excluded-location files.** In
   `skills/war/assets/assert-test-in-diff.sh`, `near_miss()` deliberately carries no location
   exclusions (spec D5 of `docs/specs/2026-07-22-test-floor-target-repo-design.md`: a false positive
   costs one stderr line), while its sibling `match_sh_suite()` mirrors the gate's
   `node_modules/` / `.git/` / `.claude/` exclusion arms. For a diff whose only test-shaped file
   sits under an excluded prefix, the near-miss block fires and the closing advisory line asserts a
   specific wrong cause — "the pattern is wrong for this repo (`--pattern` /
   `overrides.testPattern`), not the diff" — when the real cause is the excluded **location**.
   Under D6 that stderr is carried verbatim into `MERGE_RESULT.floor_diagnostic` and on into the
   add-test fix-worker prompt, so the misattribution reaches a worker. The pre-existing
   excluded-prefix fixtures in `assert-test-in-diff.test.sh` (case 3f `node_modules/x/foo.test.sh`,
   case 3f2 `.claude/worktrees/x/foo.test.sh`) are exactly this shape but discard stderr.

3. **#1050 — FLOOR_SITE_RE's terminator is coupled to the ternary false-arm shape.** The #1046
   `floor_diagnostic` drift-guard in `skills/war/assets/workflow-template.test.mjs` discovers
   dispatched `assert-test-in-diff.sh` floor sites with a lazy capture that terminates on the
   `requiresTest:false` skip arm's line shape (newline + indent + `: pt` + backtick) rather than on
   any token of the invocation's own grammar. Both failure modes were reproduced by simulation
   against in-memory mutated copies: a 5th site written **inline** swallows forward to the next
   site's terminator (vacuous pass, and the swallowed neighbor is never independently checked); a
   5th site **appended after the last terminator** simply never matches. Either way the `>= 3`
   non-vacuity floor stays green and nothing cross-checks the discovered count against the raw
   invocation count (four at this base, in `workflow-template.js`'s initial merge, floor-retry
   re-merge, environment-proceed, and baseline-proceed prompts).

4. **#1080 — war-auditor.md overstates the guard-contract mirror as "verbatim".** The intro
   sentence of the `## Read-only git guard contract` section in `agents/war-auditor.md` claims the
   contract is "mirrored verbatim into your dispatched audit prompt", but the enforcing D3
   both-surfaces registry row in `workflow-template.test.mjs` asserts only four anchor regexes
   (`one bare git` / `no pipes` / `ls-tree` / `Grep tool`) on each surface independently — and the
   two surfaces are in fact deliberately different formats (a Markdown bullet list on the standing
   card, one flowed `pt` paragraph in `auditPrompt()`), so byte-identity is not just unguarded, it
   is false today. A future editor who trusts "verbatim" may skip the registry row and let the
   surfaces drift outside the anchors.

All four issues are open, `war-followup`/`memory-mined`, and nothing in any of them is stale or
overtaken.

## 2. Pivotal constraints

- **Guards must discriminate** (lessons `weak-test-assertion-passes-without-feature-being-exercised`,
  `non-discriminating-test-can-still-be-plan-faithful` for the converse): each hardened guard must
  be proven RED against the defect it polices — the swapped D18 routing, the SIM A/SIM B mutated
  template sources — with the red-then-green proof recorded in the commit body (D18-comment
  precedent in the same file).
- **No behavior changes.** All four fixes live in tests, one stderr diagnostic line, and one
  standing-doc sentence. Exit codes, routing enums, prompt bytes, and floor semantics are
  untouched; validation pins that `workflow-template.js` has no diff.
- **The `>= 3` non-vacuity floor is red-team-ratified** (adjudication in the merge-land-resilience
  campaign: never an exact hardcoded count — the site set grows under stacking). The #1050 fix may
  not replace it with a literal count; the cross-check must derive both sides from the source.
- **Floor ⊆ gate is load-bearing** in `assert-test-in-diff.sh`. The #1049 fix must not add
  exclusions to the custom-pattern branch and must not advise pattern workarounds — the issue
  documents why `--pattern '*.test.sh'` as a "remedy" would break the invariant.
- **The exit-1 stdout contract is byte-empty** (locked by the case-12 family in
  `assert-test-in-diff.test.sh`); the advisory edit is stderr-only.
- **Prompt-surface split rule scoped correctly:** none of these changes alters auditor/refiner
  *behavioral* instructions. The `agents/war-auditor.md` edit changes a meta-claim about how the
  mirror is enforced, not the contract content, and the dispatched prompt never carried the
  "verbatim" claim — so no `workflow-template.js` companion edit is required, and the D3 registry
  row's anchors must remain untouched and green.
- **Shell tests stay bash-3.2-safe and cwd-independent** (repo rule); the new stderr assertion
  follows the case-12 family's existing capture idiom.
- **Anchor by named construct, never line number** — both in this spec and in the edits it directs
  (line numbers rot across the serial merge queue).
- **Sibling ordering (surface contention, not design):** the
  `2026-07-24-recovery-re-merge-dispatch-coherence-design.md` spec (issues #1032/#1033/#1034)
  edits the same `workflow-template.test.mjs` and, for #1032, threads `submodMergeNote` into the
  very re-merge prompt templates FLOOR_SITE_RE scans. This spec's plan lands after it; at rebase,
  re-verify the discovered-count parity (the re-anchored regex is insensitive to added prose inside
  a template unless an inline backtick lands between the invocation head and the capture tokens —
  see §8).

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | #1040 pairing mechanism | (a) proximity-window regex (`merge site` … `held:escalation` within N chars); (b) first-following-route extraction: for each site token, capture the first `held:[a-z-]+` token after it and assert equality; (c) one ordered regex capturing both pairs | **(b).** Distance-free (survives prose growth where (a)'s window is fragile), reds on the swap by construction (in the swapped doc the first `held:` token after `merge site` is `held:land-failed` → equality fails), and yields one loud per-pair failure message. (c) couples the two pairs into one opaque match. |
| 2 | #1049 remedy | (a) add the three exclusion arms to `near_miss()`; (b) reword the closing advisory to name location as a second possible cause | **(b).** (a) reverses spec D5's ratified exclusion-free diagnostic set and *removes* the excluded file from the near-miss listing — exactly the signal the fix-worker needs ("a test exists, but in an excluded location"). (b) keeps the listing and fixes the one line that asserts a wrong cause; the D5 rationale covered the false match, never this wording. |
| 3 | #1049 advisory content | (a) enumerate the three excluded prefixes literally; (b) vague "or the file's location is excluded" pointer | **(a).** The advisory *is* the product — it rides `floor_diagnostic` into a fix-worker prompt, where a vague pointer is useless. The set is stable, mirrors the gate's find-exclusions (which must mirror `resolveGate` in `war-config.mjs` by standing discipline), and the new test case couples the stderr copy to the fixture's own prefix so drift reds. |
| 4 | #1050 terminator | (a) keep the ternary false-arm terminator, add only a count cross-check; (b) re-anchor the capture terminator on the enclosing `pt` template's closing backtick AND add the cross-check | **(b).** The closing backtick *is* the invocation's own grammar (end of the dispatched template literal): it kills SIM A's swallow-forward at the source instead of merely detecting it, and the skip arms stay excluded by construction (they carry no `${testPatternArg}` head). The cross-check remains the fail-closed backbone for SIM B and any future shape escape. |
| 5 | #1050 count bound | (a) exact hardcoded site count; (b) keep the ratified `>= 3` floor + assert discovered count `===` raw head-literal occurrence count, both derived from the source | **(b).** (a) re-breaks on the next stacked site and invites a stale-number fix (the exact anti-pattern the ratified floor exists to avoid); (b)'s equality has no literal to rot — both sides come from the same source string. |
| 6 | #1080 remedy | (a) soften the sentence: the contract is *mirrored* on both surfaces, with the D3 registry row in `workflow-template.test.mjs` named as the token-anchored arbiter; (b) upgrade the registry row to byte-identity | **(a).** The surfaces are deliberately different formats (bullet list vs flowed paragraph), so (b) means restructuring both; the Workflow sandbox cannot import a shared constant into `workflow-template.js`, and byte-identity anchors are quote-lint-fragile (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`). Per lesson `mirror-registry-verification-mode-by-construct-kind`, token-anchoring is the *correct* mode for cross-format prose — the defect is the prose overstating it, so fix the prose and make it point at the real arbiter. |
| 7 | Same-class `=`-attached straggler found in survey (§4.5) | (a) fix `war-auditor.md`'s and the dispatched prompt's "branch takes `=`-attached read flags only" mischaracterization here; (b) defer to the sibling spec owning #1085 | **(b).** That defect is #1085's (the `runbook-and-standing-record-coherence` group's) claim — the hook's deny string and its mirrors move together, and fixing one mirror here would create cross-group contention on the same sentence family. Recorded as a survey-derived observation, not claimed (§9). |

## 4. Mechanics

### 4.1 D18 pairing (`skills/war/assets/skill-doc-contracts.test.mjs`) — #1040

In the D18 test, replace the four-entry "Non-vacuous companion" presence loop with a paired
first-following-route check over the already-extracted environment bullet `b`:

```js
// Paired routing (…): each gate-site token's FIRST following held:* token must be ITS route —
// presence-anywhere anchors could not discriminate a swapped routing (#1040).
for (const [site, route, why] of [
  ['merge site', 'held:escalation', 'merge-site exhaustion must route held:escalation (the phase holds)'],
  ['land site', 'held:land-failed', 'land-site exhaustion must route held:land-failed'],
]) {
  const m = b.match(new RegExp(`${site}[^]*?(held:[a-z-]+)`, 'i'))
  assert.ok(m, `the environment arm must name the ${site} and route it to a held:* state`)
  assert.equal(m[1].toLowerCase(), route, why)
}
```

Site presence is subsumed (a missing site token fails the `assert.ok` loudly). Update the
companion-comment line above the loop in the same edit to describe the pairing, and extend the
D18 header comment's red-then-green note with the swap proof (source-comment-lag lesson: comments
move with the code they describe, same commit). Red proof: run the paired assertions against a
copy of the extracted bullet with the two `held:*` tokens swapped (in-memory string surgery — no
SKILL.md edit needed); both `assert.equal`s must fail. Record the proof in the commit body
(file-local precedent: D18's existing "Red-then-green PROVEN" note).

### 4.2 FLOOR_SITE_RE re-anchor + count cross-check (`skills/war/assets/workflow-template.test.mjs`) — #1050

In the #1046 `floor_diagnostic` drift-guard block:

- **Re-anchor the terminator** on the enclosing template literal's own closing backtick — the
  capture becomes "everything from the invocation head to the end of this `pt` template":

  ```js
  const FLOOR_SITE_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}([^`]*)`/g
  ```

  A negated-backtick character class cannot cross into a neighboring template, so an
  uninstrumented site can no longer
  inherit its neighbor's tokens (SIM A's swallow-forward), and a site appended after the former
  last terminator is still matched (SIM B). The `requiresTest:false` skip arms and the prose
  mentions stay excluded by construction — they carry no `${testPatternArg}` head.
- **Add the cross-check** inside the test, before the per-site loop: count raw occurrences of the
  invocation head literal (the same head, no capture/terminator) in `src` and assert
  `sites.length === rawCount`, with a message naming the escape mode ("a dispatched floor site
  escaped discovery — its capture instruction is unchecked"). Keep the existing `>= 3`
  non-vacuity floor and all per-site token asserts unchanged.
- **Update the FLOOR_SITE_RE header comment** in the same edit: it currently explains the ternary
  false-arm terminator; it must now state the closing-backtick anchor and the by-construction
  exclusion of skip arms, and note the fail-closed residual (§8).

Red proof: replay the issue's two simulations against the new guard — in-memory mutated copies of
the template source (nothing written to disk), one with a 5th inline site, one with a 5th site
appended at the end. Both must red (SIM A and SIM B each trip the count cross-check; SIM A's
swallow no longer occurs at all). At this base the cross-check reads 4 === 4 (initial merge,
floor-retry re-merge, environment-proceed, baseline-proceed); after the sibling spec's #1032
change threads `submodMergeNote` nearby, re-verify parity at rebase.

### 4.3 Near-miss advisory rewording (`skills/war/assets/assert-test-in-diff.sh` + suite) — #1049

Replace the closing advisory line of the near-miss diagnostic block (the final `printf` before the
unconditional `exit 1`) with a two-cause statement, e.g.:

```
if those ARE the mapped tests, either the pattern is wrong for this repo (--pattern / overrides.testPattern) or the file sits under an excluded location (node_modules/, .git/, .claude/ — mirrored from the gate's discovery) — not the diff.
```

stderr-only; stdout stays byte-empty on this path; `near_miss()`, both matchers, and every exit
code are untouched. In `skills/war/assets/assert-test-in-diff.test.sh`, add one case to the
existing case-12 near-miss stderr family: an excluded-prefix diff (reuse the case-3f
`node_modules/x/foo.test.sh` fixture shape), capture stderr, and assert (i) the near-miss block
lists the excluded file, (ii) the advisory names the location cause including the fixture's own
`node_modules/` prefix, and (iii) the advisory still names `--pattern` / `overrides.testPattern`.
Assertion (ii) is red against the current wording — that is the discrimination proof. Follow the
family's existing capture idiom (bash-3.2-safe, cwd-independent, `TMPFILES` cleanup).

No change to `agents/war-refiner.md` or any dispatched prompt: D6 already carries the stderr
verbatim, which is exactly why fixing the one line fixes every downstream consumer.

### 4.4 Guard-contract mirror claim (`agents/war-auditor.md`) — #1080

Rewrite the trailing clause of the intro sentence of the `## Read-only git guard contract`
section: drop "mirrored verbatim into your dispatched audit prompt (both surfaces, one commit)" in
favor of wording that states what is actually enforced and names the arbiter, e.g.:

> …this contract is carried on both surfaces — this standing card and your dispatched audit
> prompt, edited together in one commit; the both-surfaces registry row in
> `skills/war/assets/workflow-template.test.mjs` anchors the shared tokens and is the drift
> arbiter:

The sentence's opening (the guard name, "fail-closed denies", "read-only git command") is
load-bearing for other anchors and stays byte-identical. The D3 registry row itself is untouched
(its four anchors avoid this sentence entirely). No `workflow-template.js` edit: the dispatched
prompt never made the claim.

### 4.5 Token sweeps + mandatory same-scope surveys (grep is a floor, not a ceiling)

Each sweep below is anchored to `skills/`, `agents/`, `hooks/` (a repo-root grep picks up ~100
stale duplicates under `.claude/worktrees/`, a known trap). After each grep, hand-scan the target
file's same-scope tests and comments; every straggler found is listed with its disposition as a
survey-derived correction.

1. **Sweep `mirrored verbatim` (case-insensitive) across `agents/` and
   `skills/war/assets/workflow-template.js`; handle every match.** Expected matches at this base:
   the `agents/war-auditor.md` guard-contract sentence (fixed by §4.4) and several
   `workflow-template.js` **source comments** describing *other* mirrored constructs (the
   worker-result/force-with-lease sentences, the ADR 0013 latitude/disposition block, the
   stale-looking-but-correct calibration block). Survey disposition: each of those comments is
   coupled to its own drift test, and several of the described blocks *are* byte-shared
   sentence-for-sentence (the #811 cost-claim byte-coupling comment is explicit precedent) — they
   are not this group's claim; any overclaim among them is a separate finding. Only the construct
   #1080 names is edited.
2. **Survey of the guard-contract section itself (during §4.4):** straggler found — the
   `branch takes =-attached read flags only` bullet enumerates five bare flags in the same
   parenthetical, on the standing card *and* in the dispatched `READ-ONLY GIT GUARD CONTRACT`
   clause. Same self-contradiction class as the hook's deny string; deliberately **not** fixed
   here (§3 row 7) — it is #1085's claim in the sibling `runbook-and-standing-record-coherence`
   group, and whichever change corrects the hook message must move all three mirrors together.
3. **Sweep the retired advisory wording: grep `pattern is wrong` across `skills/` and `hooks/`.**
   At this base the only match is the advisory line itself (§4.3 replaces it). Survey: the script's
   header comment and `match_sh_suite`'s comment both state the exclusion set — they remain
   accurate and are the mirror the new stderr line cites; no doc elsewhere quotes the old advisory.
4. **Sweep for other terminator-coupled discovery regexes: grep the `: pt`-backtick sequence in
   `skills/war/assets/workflow-template.test.mjs`.** At this base FLOOR_SITE_RE is the only regex
   anchored on that shape. Survey of the same file's other discovery regexes found no second
   instance of the class; the D3/D18-style presence loops live in `skill-doc-contracts.test.mjs`,
   where the survey confirmed the D18 companion loop (§4.1) is the only multi-token presence loop —
   the file's other rows (D10–D17) assert single-construct anchors where pairing is not the
   invariant. No further corrections.

## 5. Surface changes

- `skills/war/assets/skill-doc-contracts.test.mjs` — D18 companion loop → paired
  first-following-route assertions + comment updates (#1040)
- `skills/war/assets/workflow-template.test.mjs` — FLOOR_SITE_RE re-anchor, raw-count cross-check,
  header-comment update (#1050)
- `skills/war/assets/assert-test-in-diff.sh` — one stderr advisory line reworded (#1049)
- `skills/war/assets/assert-test-in-diff.test.sh` — one new excluded-prefix stderr case in the
  case-12 family (#1049)
- `agents/war-auditor.md` — one sentence in the `## Read-only git guard contract` intro (#1080)

No `workflow-template.js`, `hooks/`, or `docs/learnings/` edits. Shared-surface contention:
`workflow-template.test.mjs` with the `recovery-re-merge-dispatch-coherence` sibling spec (this
spec lands after it) and with the downstream `gate-evidence-and-release-integrity` spec (which
declares its dependency on this one); `agents/war-auditor.md` likewise precedes that downstream
spec's edit.

## 6. New domain terms (CONTEXT.md)

None. "Paired anchors", "non-vacuity floor", and "near-miss diagnostic" are existing informal
vocabulary from the ratified specs and lessons; no glossary entry needed.

## 7. Recommended ADRs

None — four guard/diagnostic/prose truth fixes inside already-ratified architecture; no decision
crosses a boundary ADRs govern.

## 8. Open risks / implementation notes

- **FLOOR_SITE_RE residual (fail-closed, accepted):** a future floor arm embedding an inline
  backtick *before* its capture tokens truncates that site's capture, redding the per-site token
  asserts — a loud false red forcing a deliberate regex revisit, never a silent pass. The updated
  header comment must state this.
- **Advisory exclusion literals:** the reworded stderr line is a further statement of the excluded
  prefixes (after the script header and `match_sh_suite`'s comment). Accepted: the set mirrors the
  gate discovery that already moves in lock-step under the floor ⊆ gate discipline, and the new
  test couples the stderr copy to the `node_modules/` prefix so silent drift reds.
- **D18 pairing assumes site-before-route ordering** within each sentence (true of the live
  bullet, and inherent to the "first following `held:` token" semantics). A doc rewrite that
  reorders reds the guard and forces a deliberate re-anchor — desired behavior for a doc-contract.
- **Rebase-time check (ordering with the sibling spec):** after
  `recovery-re-merge-dispatch-coherence` lands #1032's `submodMergeNote` threading, re-run the
  count cross-check locally; if the note was threaded *inside* a floor-carrying template with an
  inline backtick, the fail-closed red in the first bullet fires and the regex is adjusted then.
- **The `agents/war-auditor.md` sentence is edited, not deleted:** its "one commit" both-surfaces
  discipline clause survives in the rewording — that discipline is real and test-backed; only the
  "verbatim" strength claim goes.

## 9. Non-goals / deferred

- **No `near_miss()` exclusion arms** (§3 row 2) — the exclusion-free diagnostic set is D5-ratified;
  near-miss set adequacy stays owned by the existing AI-declared backstop from the
  test-floor-target-repo plan.
- **No custom-pattern-branch exclusions** in `assert-test-in-diff.sh`: the latent floor ⊆ gate gap
  for a caller-supplied pattern matching an excluded path is real but unclaimed by any issue in
  this group; noted for a future sweep, and nothing here may advise pattern workarounds.
- **No byte-identity upgrade of the guard-contract registry row** (§3 row 6).
- **No fix for the `=`-attached bare-flag mischaracterization** on either auditor surface (§3
  row 7; §4.5 item 2) — #1085's claim, sibling group.
- **No edits to the other `mirrored VERBATIM` source comments** in `workflow-template.js`
  (§4.5 item 1) — different constructs, each with its own arbiter.

## 10. Validation criteria

1. **D18 discriminates:** with the two `held:*` tokens swapped in a copy of the extracted
   environment bullet, both paired assertions fail; against the live SKILL.md the D18 test passes.
   Red proof recorded in the commit body. `node --test skills/war/assets/skill-doc-contracts.test.mjs`
   green.
2. **FLOOR_SITE_RE hardened:** the new regex discovers a count equal to the raw invocation-head
   count (4 === 4 at this base) and the equality assertion plus the retained `>= 3` floor are both
   present; replaying SIM A (inline 5th site) and SIM B (appended 5th site) against in-memory
   mutated copies of the template source reds the guard in both cases. No hardcoded site count
   anywhere in the block.
3. **Advisory truth:** the new excluded-prefix stderr case fails against the pre-change advisory
   wording and passes after; stderr names both possible causes (pattern *and* excluded location,
   including `node_modules/`) plus `--pattern` / `overrides.testPattern`; stdout on the exit-1
   path remains byte-empty and every existing case-3/case-12 assertion still passes.
   `bash skills/war/assets/assert-test-in-diff.test.sh` green.
4. **Mirror claim trued:** grep finds no `mirrored verbatim` (case-insensitive) in
   `agents/war-auditor.md`; the reworded sentence names `workflow-template.test.mjs`'s registry
   row as the arbiter; the D3 both-surfaces registry row and both F03 tests pass untouched.
5. **No behavior drift:** `git diff` for the change shows no edit to
   `skills/war/assets/workflow-template.js`, no exit-code or matcher change in
   `assert-test-in-diff.sh` beyond the one `printf` line, and no enum/schema surface anywhere.
6. **Suites green:** `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over
   `hooks/` + `skills/` both pass.
