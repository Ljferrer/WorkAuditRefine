---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation, absolute claim vs residual exception, ADR carve-out, fresh-env re-run, unconditional vs conditional emission, near-miss diagnostic, assert-test-in-diff.sh, stderr guard clause, umbrella clause, heterogeneous guard shapes, realpathSync, campaign-ledger, fileURLToPath, No behavior change label, bolded lead-in, colon-scoped enumeration, release headline contradiction, anti-overclaim device, appositive antecedent ambiguity, dangling modifier, itself unchanged, nearest-noun misattachment, D6 verbatim-capture contract, on every error path, seed-pack die try region, mkdtemp scratch leak scope, TOKEN-scoped absence lock, prose-only reintroduction, verifyTier cap exceeded, unconditional prose append, gating-premise mismatch, non-submodule byte identity claim, submodule floor gain, polish merge prompt, floor-retry prompt, submodLandNote, submodMergeNote, every existing non-submodule prompt, issue citation convention, origin issue vs task issue, ADR body vs header qualifier, byte-unchanged body qualifier dropped, ADR Status line amendment, expect_deny_teach pinning granularity, K5 combined substring stated as separate pins, test assertion granularity overclaim, authoring checklist self-violation, checklist item dropped in its own introducing paragraph, D25 cross-ADR mirror, two-site characterization, either-alone overclaim, guard scope word omission]
  provenance: code-verified
  promoted: dev/2026-07-24-memory-tooling-hardening@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +11 recurrences (war-campaign-resilience-roadmap/phase-2 Release task 2.1, 2026-07-22; test-floor-target-repo/phase-2 Release task 2.1, 2026-07-22; cli-main-guard-normalization/phase-2 Release task 2.1, 2026-07-23; runbook-and-standing-record-coherence/phase-2 Release task 2.1, 2026-07-24; recovery-re-merge-dispatch-coherence/phase-2 Release task 2.1, 2026-07-24; drift-guard-and-floor-diagnostic-hardening/phase-2 Release task 2.1, 2026-07-24/25; 2026-07-24-memory-tooling-hardening/phase-2 Release task 2.1, 2026-07-26; 2026-07-26-dispatch-args-and-floor-coverage/phase-3 Release task 3.1, 2026-07-26/27; 2026-07-26-auditor-guard-policy-and-mirror-truth/phase-2 Release task 2.1, 2026-07-27; 2026-07-26-standing-doc-and-remedy-truth-sweep/phase-2 Release task 2.1, 2026-07-27; 2026-07-28-audit-evidence-precedence/phase-2 Release task 2.1, 2026-07-28)"
  tags:
    - war
    - release
    - readme
    - status-section
    - guard
    - submodule
    - plan-repo-mismatch
    - prose-precision
  relates:
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[gitmodules-working-tree-read-vs-ref-snapshot]]"
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
  modified: 2026-07-28T21:01:11.727Z
---

# Release blurb prose overstates guard semantics

**Rule** — when drafting the `## Status` blurb for a guard task, describe the **trigger surface** (what property of the task's *diff* causes the refuse), not repo topology. "Refuse diffs that touch X" is almost always more precise than "refuse repos that contain X". Fail-closed template: "Changes that X are blocked; safe-to-ignore diffs are unaffected." Blurbs favor short concrete phrasing, so writers unconsciously upgrade the restriction from the mutation surface to the topology surface — a prose Nit, never a land-halt, but it accumulates as operator misinformation across releases.

Instance (submodule-inc1/T4, v0.7.8): the blurb said "agents refuse to process repos that contain git submodules", but the landed guard (`skills/war/assets/assert-no-submodule-mutation.sh`) refuses **diffs touching submodule entries** (paths in `.gitmodules` or gitlink entries) and is a no-op on a submodule-free repo. Auditor rated it a Nit; suggested "refuse to process changes that touch git submodules". The offending blurb is gone from the live README — `## Status` is a replace-in-place slot ([[release-status-is-replace-slot-not-empty-field]]).

See [[gitmodules-working-tree-read-vs-ref-snapshot]] for the companion reading-context hazard.

## Recurrences 1-6 (2026-07-22 → 2026-07-25) — compressed; canonical distillation now lives in README's `### Status-blurb authoring checklist` (items 1-6, item 7 cites this lesson)

Each was a `disposition: note` Nit on a phase-2 Release task 2.1 blurb; the per-recurrence
narratives are distilled into the README checklist, one item per mechanism:

1. (war-campaign-resilience-roadmap) Absolute proof-strength claim stated without the residual
   carve-out ADR 0040 records — hedge ("normally") whenever a named exception is on record.
2. (test-floor-target-repo) Unconditional-reading prose for a diagnostic behind its own runtime
   conditional — say "prints X **when** Y", never bare "prints X"; fixed at Gate-2 with the
   auditor's wording.
3. (cli-main-guard-normalization) One umbrella clause over three heterogeneous guard shapes — the
   ledger's guard never called `fileURLToPath`; same family as
   [[guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes]].
4. (runbook-and-standing-record-coherence) "Every `case` arm byte-unchanged" conflated arm
   *pattern* (true) with arm *body* (false for the corrected deny string) — state the
   pattern/outcome-level claim, not the arm-level one.
5. (recovery-re-merge-dispatch-coherence) Bolded **`No behavior change:`** label colon-scoped
   narrower than the paragraph's own headline behavior change — name what the label actually
   scopes; reserve the generic label for releases shipping none.
6. (drift-guard-and-floor-diagnostic-hardening) Dangling appositive "itself unchanged" binds by
   proximity to the just-hardened #1046 guard instead of the unchanged D6 contract — restate the
   subject explicitly.

Several of these were `code-verified` at the phase's `_refinery` worktree because the servitor's
own cwd was stale, per [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

## Recurrence 7 (2026-07-26, plan `2026-07-24-memory-tooling-hardening`, phase 2 "Release", task 2.1) — two independent overstate-scope Nits in the same paragraph, both "the guard's real reach is narrower than the summary clause"

An eighth and ninth instantiation, both flagged by the task auditor in the same `## Status`
paragraph (`README.md` line 340 at land, landed tip `e50e3ca47f42181fa5715251f08be099118516f9`
— worktree gitdir physical path containing this plan's slug:
`<repo-root>/.claude/worktrees/2026-07-24-memory-tooling-hardening-2026-07-26/_refinery/`, this
servitor's own cwd being a stale sibling worktree on a different plan/branch, per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]). `code-verified` — both findings
confirmed against `skills/lessons-learned/assets/seed-pack.mjs` and
`skills/lessons-learned/lessons-learned-doc-contract.test.mjs` at that tip.

**(a) "on every error path" for a fix scoped to three specific `try` regions.** The blurb says
`die()` "wrote to stderr and called `process.exit` from inside `cmdPack`'s, `verifyTier`'s, and
`cmdEvict`'s `try` regions; ... their `mkdtemp` scratch dirs leaked ... on every error path."
`verifyTier`'s two cap-exceeded `die()` calls (member cap, byte cap, `seed-pack.mjs` lines
357/361) fire **before** its `mkdtemp('seed-pack-verify-<tier>-')` at line 364 and **outside**
its `try` — that error path never creates, and so never leaks, a scratch dir. Same shape for
`cmdPack`'s seed-cap-exceeded `die()` (line 322, before the `mkdtemp` at 335) and `cmdEvict`'s two
archive-cap `die()`s (lines 455/458, before the `mkdtemp`s at 464-465). The claim is accurate for
every `die()` reachable *inside* the three named `try` regions (which "those" grammatically
scopes it to), but the bare "every error path" reads as every `die()` call site in the file,
several of which fire pre-`try`. Sharper form: when a blurb quantifies "every error path" right
after naming specific enclosing regions, the quantifier silently inherits the region's boundary in
the writer's head but not on the page — say "every error path that had already reached the scratch
phase" or name the pre-`try` refusal `die()`s as an explicit exception.

**(b) "a prose-only reintroduction is red too" for a lock whose own code comment disclaims that
exact generality.** The blurb says the new absence lock plus a whole-file token check means "a
prose-only reintroduction is red too." The lock's own comment in
`lessons-learned-doc-contract.test.mjs` states the opposite explicitly: "(ii) is TOKEN-scoped — a
set-then-thread revived under a different variable name, or the same expansion added to some OTHER
bash fence in this doc, passes both asserts." A prose reintroduction that never spells the literal
token `TIGHTEN_TARGET` (renamed variable, respelled fence) is **not** caught. The mechanism is
named immediately before the overstated claim, so a careful reader isn't misled, but the sentence
itself generalizes past what the cited guard proves — the same "state the true property, not the
adjacent stronger one the evidence doesn't cover" mistake as Recurrence 4's arm-pattern-vs-arm-body
conflation, here applied to a token-literal guard vs. a semantic/token-family guard.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not
absorb-eligible, `## Status` is a release slot. **Now 7 recurrences of the "on every error path" /
"X is Y too" absolute-overclaim shape alone**, on top of the 6 prior distinct sub-mechanisms above:
this family is the single most frequent recurring Nit class in this repo's release blurbs.
**Applies-to checklist for a blurb author:** before writing "every"/"all"/"X is Y too" about a
guard or cleanup's reach, ask (1) does the enclosing scope word ("those `try` regions", "that
lock") actually bound every instance the absolute covers, and (2) does the guard's own code
comment already disclaim a narrower scope than the blurb claims — if the guard's own comment says
"TOKEN-scoped" or similar, the blurb cannot say "X is red too" without repeating that same scope
word.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] (this phase's
other recurring finding, a different family — gate-audit artifact threading, not blurb prose).

## Recurrence 8 (2026-07-26/27, plan `2026-07-26-dispatch-args-and-floor-coverage`, phase 3
"Release", task 3.1) — a gating-premise sentence covers only 2 of 4 enumerated gains, the other 2
are unconditional and DID change every non-submodule prompt

A tenth instantiation, the sharpest yet of the "X is Y too" family: the `## Status` blurb
(`README.md` line 340 at land, landed tip `da7a5f37e145aaf246bb04fa0d2e235f8786d118` — `code-verified`,
read directly at the `_refinery` worktree whose `HEAD` equals the landed tip, gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-dispatch-args-and-floor-coverage-2026-07-27/_refinery/`)
closes its section (2) paragraph with: "Every gain is a prose append reusing in-scope constants,
and `submodLandNote`/`submodMergeNote` remain `''` off the submodule path — so every existing
non-submodule prompt is byte-unchanged." The paragraph enumerates **four** distinct gains (both
re-land prompts gaining `submodLandNote`, the polish-merge prompt gaining a bare
`assert-no-submodule-mutation.sh` invocation, the floor-retry re-merge prompt gaining the same
invocation with a `--declared` conditional suffix), but the `''`-off-the-submodule-path premise
only covers the first two (the note-gated ones). The polish and floor-retry gains are
**unconditional string concatenations** — not gated on `submodLandNote`/`submodMergeNote` at all —
so both of those prompts changed byte-for-byte on **every** phase, submodule or not. The blurb's
own two preceding sentences describe those unconditional gains explicitly ("it now carries the
invocation bare", "it now carries it with the gitlink-bump `--declared` conditional shape"), so the
closing clause visibly contradicts its own paragraph three sentences up — the same
"state-the-stronger-property-using-the-weaker-property's-evidence" shape as Recurrence 4 and both
halves of Recurrence 7. Two auditor seats (task-level + gate-audit lens) independently flagged the
identical defect (`disposition: follow-up`, Minor — one severity step above this family's usual
Nit, since the false claim sits in the same clause the plan's own End state 11 scopes correctly
to "no non-submodule prompt gains a submodule NOTE"). **Not fixed before land** (`fixRounds: 0`):
the edit lands in the README `## Status` release-slot paragraph, Lead/operator-owned — a phase-close
absorb-worktree edit there is the recorded #1083 stale-worktree-revert shape
([[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]), so it is correctly deferred
to a follow-up rather than absorbed.

**Sharper form of the Rule for this instance:** when a release blurb enumerates N gains and then
appends a single gating-premise clause ("X remains `''` off path P, so every non-P surface is
unchanged") to justify a byte-identity claim, verify the premise actually gates **every** enumerated
gain — not just the first ones named. An unconditional gain slipped into the same enumeration (a
floor invocation appended regardless of any note/flag) silently rides the closing claim's shadow
and produces a false byte-identity statement about a real, shipped, unconditional prompt change.
**Secondary, same paragraph:** a companion Nit in the same landed text — section (2) cites the WAR
task issue `#1160` where its sibling sections (1) and (4) cite origin defect issues (`#1134`,
`#1151`) matching the plan's own `Source spec: … (issues #1134, #1114, #1151)` line — is a distinct,
narrower mechanism (issue-citation convention, not a code-semantics overclaim) but the same family
of "a summary sentence quietly narrower/broader than its own paragraph's evidence"; worth a fast
gut-check on any future blurb citing an issue number in an enumerated list: confirm every item cites
the same tier (origin defect issue vs. execution/task sub-issue), since the two look identical to a
skimming reader.

Related: [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]] (why this Minor stays
a follow-up rather than a phase-close absorb).

## Recurrence 9 (2026-07-27, plan `2026-07-26-auditor-guard-policy-and-mirror-truth`, phase 2 "Release", task 2.1) — two independent overclaims in the same paragraph: a dropped qualifier from the cited source's own precise wording, and a combined test assertion described as separately pinned

An eleventh and twelfth instantiation, both flagged by the task auditor in the same `## Status`
paragraph (`README.md` line 332 at land, landed tip `a6c3c099dc9a95600894240b410c11df6ce6375e` —
`code-verified`, read directly at the `_refinery` worktree whose `HEAD` equals the landed tip,
gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-auditor-guard-policy-and-mirror-truth-2026-07-27/_refinery/`).

**(a) "every other pre-existing line stand byte-unchanged" drops the cited ADR's own "body" qualifier.**
The blurb says "ADR 0029 gains a dated, append-only amendment recording the re-ratification while its
Decision, its Considered options and every other pre-existing line stand byte-unchanged." The ADR's own
new `## Amendment (2026-07-26)` paragraph is more precise: "every other line of this ADR's pre-existing
**body** stand as originally ratified and are left byte-unchanged." The two differ on exactly one line —
`docs/adr/0029-capture-grounds-on-committed-tip.md`'s `**Status:**` header line was itself edited in the
same plan (`accepted; amended 2026-07-22` → `accepted; amended 2026-07-22, 2026-07-26`, an absorbed
phase-1 "ADR Status currency" finding), so "every other **line**" is false for that one line while "every
other line of the **body**" is true (a Status header field is not body prose). Same shape as Recurrence 4's
arm-pattern-vs-arm-body conflation and Recurrence 7(b)'s token-vs-family generalization: the blurb states
the broader, false property (every line) using the narrower, true property's evidence (every body line) —
and the source document it paraphrases had *already* stated the narrower, correct claim in its own words.
**Sharper form of the Rule:** when a blurb paraphrases a cited doc's own precision claim, carry every
scoping noun the source used ("body", "those try regions", "TOKEN-scoped") verbatim or the paraphrase
silently regresses to the broader claim the source deliberately avoided.

**(b) "pin the prefix, the residue echo, and each teach element separately" overstates test granularity —
never guard behavior.** Item (2) of the blurb defines the deny prefix as `` `command contains forbidden
character(s)` `` plus the `head -c 20` residue echo, then says the four `expect_deny_teach` cases "pin the
prefix, the residue echo, and each teach element separately" — enumerating 5 separately-pinned items across
4 cases. In the landed `hooks/validate-auditor-git.test.sh`, K5's single substring assertion
(`"forbidden character(s): &&"`) covers the prefix tail and the residue echo **together, in one pinned
string** — its own comment says so explicitly: "K5 pins the prefix tail ... plus the ... residue echo at
the front (the leading 'command contains' fragment rides along, unpinned by itself)." K6/K7/K8 each pin one
teach element separately, so 3 of the 4 named items are genuinely separately pinned and 2 (prefix tail +
residue echo) are pinned jointly by one assertion — a test-coverage-granularity overclaim, not a behavior
overclaim (the prefix is still byte-preserved and K5 still reds if the string changes). Distinct sub-mechanism
from (a): this is a claim about how finely a *test* verifies a property, not about how broadly a *code*
property holds — the closest sibling is describing what a guard's *code* enforces, only here it is what a
*test* separately asserts.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not absorb-eligible,
`## Status` is a release slot outside task 2.1's `Files:` list to touch incidentally, and the disposition
rule refuses `absorb` for anything touching a version/release slot.

**Applies-to checklist addendum:** when a blurb paraphrases another artifact's own precision language
(an ADR amendment, a test's own comment), diff the blurb's wording against that artifact's *exact* scoping
words before trusting the paraphrase — a paraphrase that drops one scoping noun ("body", "separately")
silently promotes a narrow true claim to a broad false one even when the cited artifact itself got it right.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] (unrelated family, same
phase-close audit-log-sourced-finding provenance discipline).

## Recurrence 10 (2026-07-27, plan `2026-07-26-standing-doc-and-remedy-truth-sweep`, phase 2 "Release",
task 2.1) — the paragraph that ships this lesson's own new authoring checklist violates the
checklist's own item 2, in the same sentence

A thirteenth instantiation, and the sharpest irony in the family so far: this release's `## Status`
paragraph (`README.md`, `## Status` section at the landed tip
`bb1b1c0877396838f5057dabc19c2281882c37b5` — `code-verified`, read directly at the `_refinery`
worktree whose `HEAD` equals the landed tip, gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-standing-doc-and-remedy-truth-sweep-2026-07-27/_refinery/`)
is the one that **introduces** `README.md`'s new `### Status-blurb authoring checklist` — item 2 of
which is "Repeat the guard's own scope word … Dropping it silently promotes a narrow true claim to a
broad false one" — and that checklist explicitly cites this very lesson
(`docs/learnings/release-blurb-overstates-guard-semantics.md`) as its provenance (item 7). The same
paragraph's `#1115` sub-clause then commits exactly the violation the checklist warns against: "the
new D25 row reads both ADRs and asserts the two-site characterization on each, so an edit to either
ADR alone reds." The D25 row's own code comment
(`skills/war/assets/skill-doc-contracts.test.mjs`, the `(D25) CROSS-ADR MIRROR` banner) states a
narrower reach: "This row reads BOTH files so a revert on EITHER surface reds" and "Keys are ORDERED
and per-surface, anchored on the ADRs' own tokens rather than either ADR's sentence bytes, so
sanctioned rewording latitude on either side does not false-red." A **sanctioned rewording** of
either ADR is "an edit to either ADR alone" and does **not** red — so the blurb's consequence clause
generalizes past the guard's own disclaimed scope, dropping the "revert"/"sanctioned rewording"
distinction the guard's comment is careful to draw. The paragraph's immediately preceding clause
("asserts the two-site characterization on each") does supply enough context that the sentence reads
as true in situ, which is why the task auditor rated it Nit and not a hold; not fixed before land
(`disposition: note`, non-blocking, `## Status` is a release slot outside task 2.1's `Files:` list to
touch incidentally, and the disposition rule refuses `absorb` for anything touching a version/release
slot).

**Why this recurrence is worth its own entry despite being "just another Nit":** authoring a checklist
distilled from this lesson family is not self-applying. The same drafting pass that writes "repeat the
guard's own scope word: revert vs. sanctioned rewording" as new standing guidance can, in the very
paragraph announcing that guidance, drop that exact distinction describing an unrelated guard two
sentences later — the checklist protects future blurbs only if the author re-reads their own paragraph
against it, not merely by virtue of having written it down in the same commit. **Applies-to checklist
addendum:** when a release blurb introduces a new anti-overclaim checklist/guard in the same paragraph
that also narrates unrelated guards, re-run each of that paragraph's *own* sentences through the new
checklist before treating the paragraph as compliant — the checklist's presence in the document is not
evidence its own introducing prose passes it.

Related: [[audit-log-finding-can-be-stale-by-land-time]] (this recurrence's finding-match check
confirmed the defect live at the landed tip rather than fixed-in-flight — both audit-log Nits on this
task's paragraph were verified present, not resolved, before this entry was written).

## Recurrence 11 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 2 "Release", task 2.1) — two independent overclaims in the same paragraph: a per-term guard's construct-level reach described as applying to both surfaces it only applies to one, and a token-anchored registry row's "any edit reds" overstating a guard that only reds on a reword away from its anchors

A fourteenth and fifteenth instantiation, both flagged across two auditor seats on the same `##
Status` paragraph (`README.md`, at the landed tip `5f018f183eefa225ee900afd7e33dca9c5dfb4e8` —
`code-verified`, read directly at the `_refinery` worktree whose `HEAD` equals the landed tip,
gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-07-28-audit-evidence-precedence-2026-07-28/_refinery/`).

**(a) "per-term extraction by construct... so a diff that rewords either surface... reds" claims a
symmetry the guard's own code doesn't have.** The blurb describes the new D26 row in
`skill-doc-contracts.test.mjs` as doing "per-term extraction by construct (bolded term to the next
bolded term or heading), token-anchored `\s+`-wrapped keys rather than sentence bytes, so a diff
that rewords either surface away from a doctrine clause reds." Read at the pin, the per-term
construct extraction applies only to the `CONTEXT.md` side; the ADR side matches each key against
the whole normalized file (`norm(adr0041)`), not a per-term extracted region. Two of the row's keys
even have two independent homes in ADR 0041 (`/never\s+evidence/i` matches both the floor-rule
bullet and the `history` rung-2 clause; `/naming\s+both\s+rungs/i` matches both the D3 table row and
the floor-rule bullet), so removing either clause alone from the ADR still greens the row — "either
surface... reds" is stronger than the guard actually is. Same family as Recurrence 9(b) (a claim
about how finely a *guard* discriminates, not about how broadly a code property holds), just applied
to extraction *symmetry* between two surfaces rather than test-assertion granularity within one.

**(b) "a diff editing any single one of the five copies one-sidedly reds" overstates a
token-anchored row to plain edit-sensitivity.** The row's own banner in
`workflow-template.test.mjs` states the narrower reach explicitly: "Token-anchored, case-tolerant —
never full-line bytes (the surfaces phrase the shared discipline differently)." A one-sided reword
that preserves the anchor tokens (`content-at-pin`, `never the top rung`, `never evidence`, `##
Evidence precedence`, the ordered four-shape chain) stays green by design — sanctioned rewording
latitude is the row's entire point — so "editing... reds" is broader than "rewording away from the
anchors reds." This is the exact shape Recurrence 10's `#1115` sub-clause already named for a
different (D25 cross-ADR) row in the *same drafting pass's own new checklist paragraph* — the
"repeat the guard's own scope word: revert/reword vs. sanctioned rewording" item continues to trip
even after being spelled out as standing guidance two prior recurrences ago.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not
absorb-eligible, `## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally.

**Now 15 recurrences across two overlapping sub-families** ("X is Y too" absolute-overclaim, and
"a guard's discrimination/reach described more broadly than its own code"): this paragraph alone
carried nine `disposition: note` findings across two auditor passes, the highest single-paragraph
count recorded in this family to date, entirely because a doctrine-heavy release (four ladders,
floor rules, precedent mapping, three new guard rows) gives a blurb author many more scope words to
drop than a typical mechanical-fix release does.

Related: [[canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet]]
(same paragraph, same phase — the third and most serious of this paragraph's overclaims, an
unqualified absolute the ADR's own Consequences bullet contradicts, recorded separately since it is
doctrine-mapping rather than guard-semantics). [[release-blurb-quoted-code-literal-can-diverge-from-actual-identifier]]
(same paragraph, a fourth overclaim family — a quoted code-font literal that doesn't exist verbatim).
