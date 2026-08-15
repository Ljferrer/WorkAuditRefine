# Escape-guard exit-contract hardening — zero-byte baseline dies infra, Step-4 triage gains its exit-2 arm, the gitignored ceiling is pinned as deferred

Converted by `/war-machine` from [docs/specs/2026-08-06-escape-guard-exit-contract-design.md](../specs/2026-08-06-escape-guard-exit-contract-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated reason).
Issues addressed: #1263, #1369, #1268. Issue → task mapping: #1263 → Task 1.1 (the `-s` fix + zero-byte case +
lesson stamp) and Task 1.2 (the contract-enumeration widenings); #1369 → Task 1.1 (the gitignored ceiling-pin
case + header ceiling note) + the deferred-backstop row — a documented ceiling, never a fix; #1268 → Task 1.2
(the Step-4 exit-2 arm) + Task 1.3 (the ADR 0043 Context correction). `/war` files its own epic + task issues
regardless (war-execution-must-file-issues); closing the three source issues is Lead checkpoint work at phase
close (war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

One subsystem, one exit contract. `skills/red-team/assets/assert-no-repo-escape.sh` is the /red-team
escape-detection authority with a load-bearing floor-family contract — 0 = clean, 1 = escape, 2 = git/infra
error, and 2 must never collapse into (or be preempted by) 1 (verified: the guard's exit-codes header block,
live tree at `6fff2ee`, 2026-08-06). Source spec: `docs/specs/2026-08-06-escape-guard-exit-contract-design.md`.
Snapshot base for every measured claim: the repo tip at `6fff2ee` (2026-08-06); conversion-time
re-measurements below are at the same base (the session worktree's two checkpoint commits are docs-only and
touch none of these surfaces). Three defects/decisions resolve against that single contract:

1. **A zero-byte `--baseline` collapses an infra fault into a false escape** (verified: issue #1263
   (2026-08-06); re-confirmed at `6fff2ee` in the arg-parse baseline validation block — it checks `-e`, `-f`,
   `-r`, never `-s` — and the two-file awk ref-diff pass below it). With an empty first file the `NR==FNR`
   loader degenerates: `NR` never diverges from `FNR`, every live-dump line is absorbed into `base[]` via
   `next`, `live[]` stays empty, and the `END` block prints `removed: <ref>` for every live
   `refs/heads/`/`refs/tags/` ref — exit 1 (escape, with an inverted message) instead of 2 (infra). This is
   the exact wrong implementation the suite's own case-26 banner names ("treat an absent baseline as an EMPTY
   one"), reached via an empty rather than missing file; case 26 covers only the missing-file path and the
   suite has no zero-byte case (dated snapshot 2026-08-06 at `6fff2ee`: 27 numbered cases; verified:
   `skills/red-team/assets/assert-no-repo-escape.test.sh` header enumeration). The lesson
   `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` records the gotcha and notes the `-s` check was
   raised twice as a Minor follow-up and never added (verified: the lesson body at `6fff2ee`).
2. **Step-4 triage has no exit-2 arm; ADR 0043 over-claims** (verified: issue #1268 (2026-08-06); both
   re-read at `6fff2ee`). `skills/red-team/SKILL.md` Step 4 enters the delta triage on its opening bold
   clause "On a nonzero exit, diagnose every delta by action-provenance FIRST", but the two arms that follow
   (probe-authored, foreign) handle only deltas — an exit 2 has no deltas and no stated resolution arm, so
   the prose routes an infra fault into a triage that cannot resolve it. Separately, ADR 0043's Context
   states "the *only* mechanic Step 5 offered for closing a blocker (the grill loop …)" — over-claiming,
   since Step 5 also offered a probe re-run, the very mechanic the ADR's own two-arm re-verify trigger
   (its Decision 3) depends on (verified: the sentence stands in
   `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md` at `6fff2ee`, sole `*only* mechanic` hit).
3. **Gitignored leak paths are a documented, deliberately-deferred detection ceiling** (verified: issue
   #1369 (2026-08-06); both porcelain call sites re-confirmed at `6fff2ee`). The snapshot-mode pre-run
   integrity refusal and check (a) both build on `git status --porcelain`, which never reports ignored
   paths — a probe leaking a write into a gitignored path is invisible to both checks and creates no ref for
   the baseline ref-diff to catch. The guard's own ponytail records this as its third detection ceiling,
   explicitly deferred: widening to `--ignored` needs its own back-compat pin plus a ruling on
   legitimately-ignored directories — "recorded as the gitignored-leak-paths backstop, not taken here". The
   lesson `docs/learnings/escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes.md` §3 mirrors the
   same ceiling (verified: issue #1369 (2026-08-06)).
4. **Survey-derived (beyond the issues' named files):** the escape-guard bullet in
   `skills/red-team/references/lenses.md` (named construct: the "Pre/post ref-diff escape guard (executed
   probes)" bullet) restates the exit contract ("2 = a git/infra error or unreadable baseline") and
   compresses Step 4's routing as "A nonzero result routes the verdict through the self-confound gate,
   action-provenance first" — the same two drifts in miniature (verified: live tree at `6fff2ee`,
   2026-08-06; conversion re-ran the sweep greps and confirmed the hit set). It moves in the same commit as
   the Step-4 fix or the surfaces fork.

## Pivotal constraints

- **The 1-vs-2 boundary is a floor-family contract.** Infra never collapses into escape and is never
  preempted by one — baseline validation runs at arg-parse time, ahead of every check (the guard's
  check-(c) header note; suite case 27 pins the ordering). The new check must live there too.
- **No-baseline byte-equivalence.** Without `--baseline`, check mode stays byte-equivalent to the
  pre-ref-diff script in exit codes, stdout, and checks (sole delta: one stderr advisory — suite cases
  19/20). The zero-byte check must sit inside the `--baseline`-only validation block, touching nothing else.
- **Every `die` call site passes an explicit code.** Suite case 10 is a standing negative call-site lock;
  the new die must carry an explicit trailing `2`. Case 10's stated detection ceiling (a digit after the
  message's closing double-quote; no embedded escaped `"`) binds the new message's shape — it carries no
  embedded double quotes.
- **Step-4 prose is anchor-pinned.** `skills/red-team/diagnosis-preflight.test.sh` asserts tolerant anchors
  in `skills/red-team/SKILL.md` (`self-confound`, `action-provenance`, `single-path`, `primary evidence`,
  `falsif`) and in `lenses.md` (`self-confound`, `sandbox reuse`); the doc-guard rows in
  `skills/red-team/assets/red-team-gate.test.mjs` additionally lock Step 4's pipe sentence (`task-output`,
  `.result`, zero-probe tokens) and `lenses.md`'s Verdict/Rounds adjacency + `## Route upstream` heading.
  The rewrite must keep every one present and green.
- **ADR 0043's decision is ratified, not re-litigated.** The ADR implements the 2026-07-28 operator
  directive. **Every pre-existing body byte stays unchanged — the Context sentence included** (D5 as
  reversed at /red-team round 1 R6: the correction is an APPENDED dated note, so nothing in the existing
  body is rewritten at all). The `**Status:**` currency line is the one sanctioned exception and may be
  updated — the recorded carve-out to a byte-unchanged-body mandate.
- **Ceiling-3 header text stays byte-identical.** The #1369 resolution is a ratified deferral, not a
  behavior change — the ponytail paragraph that documents it is not reworded.
- **Suite conventions.** macOS bash 3.2.57, cwd-independent, fresh mktemp fixtures via the existing
  `setup_repo`/`fresh_cwd`/`artifact_path`/`take_snapshot` harness, artifacts outside the repo tree; new
  cases extend the suite's numbered header enumeration in the same commit (the
  plan-mandated-banner-count trap: hand-scan banners for any count/enumeration prose the additions stale).
- **Posterity survivors are never retro-edited** (ADR 0046 posture): landed plans, specs, red-team
  reports, and lesson bodies keep whatever wording they shipped with — the measured `docs/` carriers of
  the retired wordings are the landed 2026-08-02 plan and this plan + its source spec (Note 2); every
  OLD-absent check here is scoped to live `skills/red-team/` surfaces.
- **Redaction lint.** Touching `docs/learnings/` requires the fail-closed lint to stay green (the
  war-memory lint wrapper is a discovered member of the self-discovery gate — `resolveGate` in
  `war-config.mjs`).

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Where the zero-byte check lives | Fourth check in the arg-parse baseline validation block (after `-e`/`-f`/`-r`): `[ -s "$baseline_file" ]` else `die … 2`. Arg-parse time, so an infra fault is never preempted by an escape conclusion (the case-27 rationale, extended) | spec §3 row 1 |
| D2 | Rekey the awk loader instead (`FNR==NR && FILENAME==ARGV[1]`)? | **Rejected.** It fixes the degeneracy's direction but silently *accepts* the empty baseline as "no refs at baseline", reporting every live ref `added:` — still exit 1. An empty baseline is always an infra artifact (D3), so acceptance is wrong in principle, not just in direction. The awk pass keeps its bare `NR==FNR` key — with `-s` guaranteeing a non-empty first file the idiom is safe, and layering a second fix would obscure which one is load-bearing | spec §3 row 2 + §8 |
| D3 | Can a legitimate baseline be zero bytes? | No. Snapshot mode writes via `printf '%s\n' "$snap_out"` — even an empty ref set yields a one-byte file (the trailing newline). `-s` rejects only files no snapshot-mode run can produce: truncated/failed writes or foreign artifacts | (verified: the snapshot-write construct in the guard, live tree at `6fff2ee`, 2026-08-06) |
| D4 | Step-4 triage shape | Enter the delta triage on **exit 1** specifically; add a one-line exit-2 arm adjacent to the two provenance arms: fix the named git/infra fault and re-run the guard — exit 2 is neither clean nor an escape, and the gate is never piped while the guard is unsettled. Quarantine-on-nonzero (the guard header's "never CLEARED until the state is clean") is unchanged: both nonzero codes forbid `CLEARED` until settled. The existing "Once the guard is settled (exit 0, or exit 1 …)" sentence stays as written — an exit 2 resolves by re-run into 0 or 1, never by settlement | spec §3 row 4; (verified: issue #1268 (2026-08-06)) |
| D5 | ADR 0043 correction shape | **REVERSED at /red-team round 1 (R6) — an APPENDED dated correction note, not an in-place edit.** The conversion-time argument was that the corpus reserves appended notes for decision changes and true-then-stale claims while repairing false-when-written claims in place. **A corpus survey falsifies that split**: `docs/adr/0016-campaign-compaction-survival.md`'s `## Amendment (2026-07-19): a bare layout is a probe success, not a fail-open case` opens "The Decision half of the 2026-07-15 amendment above is **corrected** here for the **bare** case" and states "This amendment changes only the *description* of which cases engage fail-open; no decision and no code change" — i.e. a description that was **wrong when written**, repaired by an APPENDED note. `docs/adr/0019` and `docs/adr/0023` carry the same shape. The corpus does not split the channel on when the claim became false; it appends. Resolution: append `## Correction (2026-08-15, #1268)` to ADR 0043 stating that Step 5 also offered a probe re-run, so "the *only* mechanic" over-claims and the ADR's own Decision 3 two-arm re-verify trigger depends on that second mechanic. **The Context sentence's bytes stay intact** — which also satisfies this plan's own pivotal constraint ("all other body text byte-unchanged") more conservatively than an in-place rewrite | spec §3 row 5; **/red-team round 1 R6, corpus-measured** |
| D6 | #1369 disposition | Ceiling ratified as **deferred** — no `--ignored` widening. Action taken: pin the current behavior with a new suite case (gitignored stray file, refs unchanged → exit 0), so any future widening must consciously flip a red case. This delivers the back-compat-pin half of the prerequisites the ceiling text names (A1) | spec §3 row 6 |
| D7 | Zero-byte suite case shape | Mirrors case 26's non-vacuity: the fixture carries a `rogue` branch so the degeneracy path would return 1; assert exit 2, explicitly `!= 1` | spec §3 row 7 |
| D8 | Lesson closure | `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` gets the repo's RESOLVED description-prefix stamp naming this plan's fixing task and #1263; body and keywords untouched per the stamp convention — the stamp deliberately freezes the body's present-tense defect description (A2) | spec §3 row 8 |
| D9 | Task decomposition | Three file-disjoint tasks in Phase 1 — Task 1.1 guard + suite + lesson stamp; Task 1.2 `SKILL.md` + `lenses.md` (same drift, same commit rationale) with `deps: [1.1]` (a content edge — see Notes 4–5); Task 1.3 the ADR — plus the standard trailing release phase. The lesson stamp travels with the fix rather than as a fourth prose task: the stamp is honest only once the `-s` check exists, and folding removes a deps edge with no parallelism lost | spec §5 carving hint; conversion judgment, logged for /red-team |
| D11 | Guard the retired wording mechanically? | **Yes — one fail-closed doc-guard row, added at /red-team round 1 (R3/R4).** An executed probe implemented Tasks 1.1+1.2, re-introduced `unreadable baseline` into the `lenses.md` bullet, and **all three** task gates stayed GREEN — the OLD-absent half had no mechanical enforcement anywhere (not in a Done-when, not in a discovered `*.test.sh`/`*.test.mjs`, not in a merge floor). The row lands in `skills/red-team/assets/red-team-gate.test.mjs` — **already run by End state 6, so no new runner** — mirroring the shape plan `2026-08-06-red-team-gate-cli` landed as its D8b (present in this plan's base at `1655b98`): assert the NEW-present anchors **first** (the widened `unreadable or zero-byte baseline`, and `On exit 1, diagnose`) so a failed extraction reds instead of vacuously passing, then assert each retired needle absent from `SKILL.md` and `lenses.md`. **Self-match hazard, mandatory mitigation:** the row lives under `skills/red-team/`, which is exactly End state 9's grep scope, so each needle is **built at runtime from split fragments** (e.g. `['unreadable', 'baseline'].join(' ')`, `['On a nonzero exit,', 'diagnose'].join(' ')`) — the contiguous literals must appear nowhere in the suite source. Matching is **case-insensitive** (R1). Ownership: Task 1.2, whose `deps: [1.1]` already covers the guard-header fact Task 1.1 authors | **/red-team round 1 R3+R4**; sibling D8b precedent |
| D10 | Sweep scoping | The spec's doc-consistency sweeps (`grep -rn 'unreadable baseline' skills/ docs/`; the full-phrase retired-opener grep) are kept as the handling floor, but the mechanical OLD-absent assertions are scoped to live `skills/red-team/` surfaces — the `docs/` hits are posterity survivors (the 2026-08-02 plan, this plan + its spec), enumerated and never retro-edited. An unscoped zero-hit assertion would false-red on this very plan document (backstop-retirement-grep-false-reds class) | spec §4 + §8; conversion measurement at `6fff2ee` |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Pin-not-widen is the right minimal claim for #1369's minor documented residual | spec §3 row 6 (carried [assumed] row); the ceiling text itself names the two prerequisites and this delivers only the pin half | the pin is one deletable case and `--ignored` widening becomes its own spec | End state 3's case; ratify in /red-team |
| A2 | The repo's standard RESOLVED description-prefix stamp convention applies to the lesson | spec §3 row 8 (carried [assumed] row); corpus precedent (e.g. the cmdQuery lesson's `RESOLVED (<plan>/<task>, #<issue>):` shape) | skip the stamp; the fix stands on its own | End state 10's grep + the redaction lint; ratify in /red-team |
| A3 | Spec + pinned suite case suffice as the #1369 deferral's decision record — no new ADR | spec §7 (carried [assumed] row); conversion affirms: below ADR weight, consistent with the corpus documenting detection ceilings in the guard header + suite, not ADRs | promote the deferral to a short ADR in a later pass | ratify in /red-team |
| A4 | No sibling plan must LAND first for this plan's work to be correct — but the footprint is **not** wholly owned across the 2026-08-06 campaign | conversion-time measurement at `6fff2ee`: `lenses.md` is shared with plan `2026-08-06-red-team-gate-cli` (its Task 1.1 edits the `## Route upstream` template and its Task 1.2's doc-guard rows read `lenses.md`) and with sibling spec `2026-08-06-verdict-adjudication-integrity-design.md` (the severity `- **Verdict:**` bullet + report-template comment; that spec declares `dependsOn: red-team-gate-cli` and `done-when-floor-wiring` — no edge onto this group). This spec declares **no** dependsOn (§8, verified against the spec text; the survey manifest itself is not present in this worktree — the spec's statement of its machine hint is the source). All three plans touch **disjoint constructs** of `lenses.md`; no content dependency runs in either direction | serial-merge rebase conflicts across plans if landed unserialised — ADR 0011 stack-and-plow serializes; wrong-order landing costs only a trivial rebase, never correctness | roadmap: a `## Shared-file contention` row for `lenses.md` (three plans), **no** dependency-spine edge; /war-campaign's sweep contention check re-verifies |
| A5 | ~~In-place Context correction (not a dated amendment note) is the right convention arm for ADR 0043~~ — **REFUTED at /red-team round 1 (R6)**; the blast-radius column below is exactly what happened | D5's false-when-written vs true-then-stale distinction; #1268's "one-to-two-line prose corrections" framing | *(realised)* /red-team converted it to an appended dated correction note — the corpus survey found ADR 0016's `## Amendment (2026-07-19)` correcting a description that was wrong when written, plus the same shape in 0019/0023, so the assumed split does not exist | **discharged — D5 now mandates the appended note; Task 1.3 and End state 7 rewritten to match** |

## Non-goals / deferred

- **No `--ignored` widening** (issue #1369's ceiling stands): deferred pending the remaining prerequisite —
  a ruling on legitimately-ignored directories; the back-compat-pin prerequisite is half-delivered by the
  new pinned suite case. The guard's ceiling-3 header text is untouched.
- **Ceilings 1 and 2 untouched:** the b2 origin-side ceiling and pre-baselined pattern-slipping refs remain
  as documented.
- **No re-litigation** of ADR 0043's decision or the 2026-07-28 adjudication directive.
- **No snapshot-format change:** the `printf '%s\n'` write stays; its one-byte floor is what makes `-s`
  sound (D3).
- **No awk rekey** (D2): the bare `NR==FNR` idiom stays, made safe by `-s`.
- **No edits to the Route-upstream template, the Verdict/Rounds region, or any other `lenses.md`
  construct** beyond the escape-guard bullet — those are sibling plans' surfaces (A4).

## New domain terms · Recommended ADRs

None. "Gitignored-leak-paths backstop" already exists as guard-header prose and stays as-is; the #1369
deferral's record is this plan + the pinned suite case, below ADR weight (A3).

## Commander's Intent

- **Purpose:** the escape guard's 1-vs-2 exit boundary holds on every input — a zero-byte baseline is an
  infra fault (2), never a false escape (1) — every live prose surface that restates the contract carries
  the same enumeration and routes each exit code to a stated resolution arm, and the gitignored detection
  ceiling stays a deliberately pinned, documented deferral rather than a silent blind spot.
- **Method:** one `-s` check inside the guard's `--baseline`-only arg-parse validation block (arg-parse
  placement so infra is never preempted; explicit trailing `2` per the call-site lock; no-baseline
  invocations byte-untouched), with the guard header's two contract lines widened in the same commit; two
  new suite cases — the zero-byte `NR==FNR` degeneracy red (paired with case 26) and the gitignored
  ceiling-3 pin (exit 0, the documented false negative) — plus the header enumeration and ceiling-note
  updates; scope Step 4's triage opener to exit 1 and add the one-line exit-2 arm, moving `lenses.md`'s
  escape-guard bullet in the same commit; surgically drop ADR 0043's Context over-claim in place; stamp the
  lesson RESOLVED. Ceiling-3 ponytail paragraph byte-identical; ADR decision text and Status line
  untouched; no `--ignored` widening.
- **End state:**
  1. A zero-byte `--baseline` file exits 2 (never 1), naming the empty baseline as an infra error, and the
     check is one `-s` test in the baseline validation block
     (`grep -nF -- '-s "$baseline_file"' skills/red-team/assets/assert-no-repo-escape.sh` — one hit; **`-F` is mandatory** — /red-team round 1 measured the unescaped `$` being treated as a mid-pattern anchor by the `grep` shim actually in scope in this environment, returning NO match against the correctly-landed line and reading End state 1 as unmet) ·
     check: `bash skills/red-team/assets/assert-no-repo-escape.test.sh`.
  2. The zero-byte fixture also carries an escape-worthy `rogue` branch and still exits 2 — infra is never
     preempted (the case-27 rule, extended); the case asserts `rc != 1` explicitly ·
     check: `bash skills/red-team/assets/assert-no-repo-escape.test.sh`.
  3. A probe write landing only in a gitignored path with no ref change exits 0 — the pinned ceiling-3
     false negative, whose banner states that flipping it red is the deliberate first act of any future
     `--ignored` widening ·
     check: `bash skills/red-team/assets/assert-no-repo-escape.test.sh`.
  4. The guard's ceiling-3 ponytail paragraph is byte-identical before and after ·
     check: `grep -c 'gitignored-leak-paths backstop, not taken here' skills/red-team/assets/assert-no-repo-escape.sh`
     returns 1.
  5. Step 4 scopes the delta triage to exit 1 and carries the exit-2 arm, **and `lenses.md`'s
     escape-guard bullet gets the same routing rescope** (/red-team round 1 R2 — the Purpose says *every*
     live prose surface routes each exit code, and `lenses.md` is one of this plan's own named carriers) ·
     check — **every retirement grep is case-INSENSITIVE**, mandatory, not stylistic (R1: an executed probe
     showed all three case-sensitive forms returning the PASS value on copies where the retired wording was
     merely re-cased mid-sentence):
     `grep -cin 'nonzero exit, diagnose' skills/red-team/SKILL.md` returns 0,
     `grep -cin 'exit 1, diagnose' skills/red-team/SKILL.md` returns 1,
     `grep -cin 'A nonzero result routes the verdict' skills/red-team/references/lenses.md` returns 0,
     and the bullet's replacement exit-1-scoped wording is present, and a
     `grep -n 'exit 2' skills/red-team/SKILL.md` hit lands inside Step 4's new arm (hand-verified location —
     Step 3's pre-existing lowercase `exit 2` hits are its unrelated snapshot-refusal prose and stay).
     **Mandatory manual same-scope survey (grep is a floor):** hand-scan `skills/red-team/SKILL.md` for
     same-meaning reworded siblings the greps miss; list each straggler as a survey-derived correction.
     Survey at `6fff2ee`: none beyond the named surfaces — Step 3's "a **nonzero exit** (missing file,
     invalid JSON …)" clause is about the war-config resolve, not this contract, and is NOT a sibling.
  6. The Step-4 and `lenses.md` rewrites break no standing doc lock — every diagnosis-preflight anchor and
     every `red-team-gate.test.mjs` doc-guard row (the Step-4 pipe-sentence lock; the `lenses.md`
     Verdict/Rounds adjacency and `## Route upstream` heading) stays green ·
     check: `bash skills/red-team/diagnosis-preflight.test.sh && node --test skills/red-team/assets/red-team-gate.test.mjs`.
  7. ADR 0043 carries an **appended dated correction note** that retires the Context exclusivity
     over-claim, with the Context paragraph's own bytes intact (D5, reversed at /red-team round 1 R6) ·
     check: `grep -c '^## Correction (2026-08-15, #1268)' docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`
     returns 1; the note names the **probe re-run** as the second mechanic
     (`grep -ci 'probe re-run' docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md` ≥ 1); and the
     original sentence is **still present, unedited** —
     `grep -ciF '*only* mechanic' docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md` returns **1**
     (NOT 0 — the appended-note arm deliberately preserves it; a 0 here means someone edited the Context
     in place against D5). `grep -ciF 'removes resolved findings' …` still returns 1.
     **Mandatory manual same-scope survey:** hand-scan the ADR for same-meaning reworded siblings the
     tokens miss; list stragglers as survey-derived corrections. Survey at `6fff2ee`, re-verified at
     `1655b98`: the `*only* mechanic` hit is unique in the file.
  8. Every live surface restating the baseline arm of the exit contract enumerates the zero-byte case ·
     check: `grep -rln 'zero-byte' skills/red-team/assets/assert-no-repo-escape.sh skills/red-team/SKILL.md skills/red-team/references/lenses.md`
     lists all three files. **Mandatory manual same-scope survey:** hand-scan the guard's full header
     comment, the suite's top-of-file banner and residual-ceilings block, Step 4's neighboring prose, and
     the `lenses.md` escape-guard bullet's surrounding lens list; list each straggler as a survey-derived
     correction (this spec's own authoring survey already produced one — the `lenses.md` bullet itself).
  9. The retired contract wording is gone from live red-team surfaces, **mechanically guarded, not only
     hand-grepped** (/red-team round 1 R3+R4) ·
     check: `grep -rin 'unreadable baseline' skills/red-team/` — zero hits (**`-i` mandatory**, R1: the
     case-sensitive form passes on a merely re-cased carrier; the widened form "unreadable or zero-byte
     baseline" does not contain the retired bigram), dated snapshot re-measured at the task's rebased base ·
     **and** gate: the new D11 retired-wording doc-guard row in
     `skills/red-team/assets/red-team-gate.test.mjs` reds if either retired wording returns to
     `SKILL.md` or `lenses.md` (`node --test skills/red-team/assets/red-team-gate.test.mjs`).
     **Line-wrap hazard, stated (R1):** the ADR is hard-wrapped at ~132 cols and the guard's header comment
     block at ~85 — and Task 1.1 *lengthens* two header lines, forcing a re-wrap. A phrase split across a
     newline defeats any line-based grep, `-i` included. For those two carriers the survey half additionally
     strips comment leaders (`#`), joins lines, and normalizes whitespace **before** matching (the recorded
     leader-strip-before-normalize-before-grep lesson).
     The spec's wider `skills/ docs/` sweep is the handling floor: every `docs/` hit is a
     posterity survivor (the landed 2026-08-02 plan, this plan + its source spec, and — new since the
     plan's base — plan 1's landed red-team report if it carries either token) —
     enumerated in the done report, never retro-edited (D10). **Mandatory manual same-scope survey:**
     hand-scan the four live carriers' enclosing scopes for reworded restatements the token misses.
  10. The lesson's frontmatter `description` opens with the RESOLVED prefix naming Task 1.1 and #1263;
      body and `metadata.keywords` byte-untouched ·
      check: `grep -n 'RESOLVED' docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md` hits the
      `description` line only.
  11. The redaction lint stays green ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`; the war-memory lint wrapper is a
      discovered member).
  12. Each landing commit cites its issue(s) — #1263 + #1369 for Task 1.1, #1268 (and #1263 for the
      cascade widenings) for Task 1.2, #1268 for Task 1.3 ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
      **Why judged and not `check:`** (/red-team round 1, R8): the `<phase-base>..<tip>` range does
      not exist at any task's pre-merge gate, so no gate- or floor-runnable command can decide this
      when a task is gated; the range first exists post-merge, which is exactly where the
      execution-evidence seat reads it. The seat's observable IS a `git log --grep` over that range.
  13. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` — this proves **only** the two
      decidable halves: the four slots agree lock-step, and the monotonic floor holds. **Both**
      remaining halves are judged at audit_sha by the execution-evidence seat (/red-team round 1, R9 —
      the original parenthetical seated only the first): (i) that a bump landed **at all** (the suite
      passes on a wholly absent release), and (ii) that the landed version is the **next free patch**
      above the live integration base (any coherent higher version — a skipped patch, a minor —
      passes the suite just as well).

## Build order (for /war)

Phase 1 (guard + prose: wave 1 = Tasks 1.1, 1.3; wave 2 = Task 1.2 `deps: [1.1]`) → Phase 2 (release).

The wave edge is a content dependency, never a collision dodge: Task 1.1/1.2 file sets are disjoint, and
Task 1.2's prose states the widened exit contract Task 1.1 authors — at the frozen phase base that prose
would be a false code-fact at audit through no fault of its own diff; Task 1.2's worker rebases onto the
integration tip as its first act (Notes 4–5). Task 1.3 is file-disjoint from both and dependency-free.

## Phase 1 — The `-s` floor, its two pin cases, and the exit-contract prose cascade

### Task 1.1: Guard `-s` check + suite cases + lesson stamp

- Files: `skills/red-team/assets/assert-no-repo-escape.sh`, `skills/red-team/assets/assert-no-repo-escape.test.sh`, `docs/learnings/awk-empty-baseline-nr-fnr-degeneracy.md`
- Plan slice: **Guard** — in the arg-parse baseline validation block (the `--baseline`-only block that
  checks `-e`/`-f`/`-r`), add the fourth check after `-r`:
  `[ -s "$baseline_file" ] || die "--baseline file is zero bytes (a truncated or failed snapshot write — infra error, never a pass): $baseline_file" 2`
  — explicit trailing `2` (the case-10 call-site lock covers it automatically; the message embeds no
  double quotes, per the lock's stated detection ceiling). Header, same commit: the check-(c) note
  "A missing or unreadable baseline file is 2" widens to "A missing, unreadable, or zero-byte baseline
  file is 2"; the exit-codes block's line for 2 widens "unreadable baseline" to "unreadable or zero-byte
  baseline". The ponytail ceiling-3 paragraph is byte-identical before and after (End state 4). No-baseline
  byte-equivalence holds by construction: the check sits inside the `[ -n "$baseline_file" ]` block, so
  no-baseline invocations are untouched (cases 19/20 keep pinning the advisory behavior). **Suite** — new
  zero-byte case: fixture repo with a `rogue` branch; create the baseline artifact as an empty (zero-byte)
  file via the `artifact_path` helper (outside the repo tree, per suite convention); run check mode with
  `--baseline`; assert exit 2 and explicitly not 1 (D7). Banner names the `NR==FNR` degeneracy, pairs the
  case with case 26 (the missing-file sibling), and records the delete-and-trace: drop the `-s` check and
  this case reds at exit 1 with the inverted removed-every-ref message. New gitignored ceiling-pin case:
  fixture commits a `.gitignore` naming a pattern **before** the snapshot (so the snapshot-mode pre-run
  refusal does not fire on the untracked `.gitignore` itself — the fixture-ordering trap), takes the
  snapshot via `take_snapshot`, then writes a file matching the ignored pattern; run check mode with
  `--baseline`; assert exit 0. Banner names ponytail ceiling 3 and states this case's role: a pinned,
  documented false negative — flipping it red is the deliberate first act of any future `--ignored`
  widening (#1369's back-compat-pin half, D6). Extend the suite's numbered header enumeration with both
  cases, and append a "pinned by the gitignored-ceiling case as a documented false negative" clause to the
  gitignored bullet of the header's residual-ceilings block; hand-scan the banners for any
  count/enumeration prose the additions stale (the banner-count trap). Both suites remain discovered by
  the merge gate via `resolveGate`'s patterns by name — no gate change. **Lesson** — prefix the
  frontmatter `description` with the RESOLVED stamp naming this task and the issue
  (`RESOLVED (escape-guard-exit-contract/1.1, #1263): …`); body and `metadata.keywords` untouched — the
  stamp deliberately freezes the body's present-tense defect description (D8/A2); the redaction lint must
  stay green. Commits cite #1263 and #1369.
- Done when: `bash skills/red-team/assets/assert-no-repo-escape.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Step-4 exit-1 scoping + exit-2 arm; the `lenses.md` bullet cascade

- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: **SKILL.md Step 4** — the opening bold clause becomes
  "**On exit 1, diagnose every delta by action-provenance FIRST**" (rest of the sentence unchanged). Add
  the one-line exit-2 arm adjacent to the two provenance arms: on exit 2 there is no delta to triage — fix
  the named git/infra fault and re-run the guard; exit 2 is neither clean nor an escape, and the gate is
  never piped while the guard is unsettled (D4). The existing "Once the guard is settled (exit 0, or
  exit 1 with every delta provenance-cleared as foreign and recorded)" sentence stays as written — an
  exit 2 resolves by re-run into 0 or 1, never by settlement. The Step-4 exit-contract parenthetical
  widens "a git/infra error or an unreadable baseline" to name "an unreadable or zero-byte baseline".
  Every `diagnosis-preflight.test.sh` anchor (`self-confound`, `action-provenance`, `single-path`,
  `primary evidence`, `falsif`) and the `red-team-gate.test.mjs` Step-4 pipe-sentence lock tokens
  (`task-output`, `.result`, the zero-probe wording) remain present. **lenses.md** — in the
  "Pre/post ref-diff escape guard (executed probes)" bullet only: widen "unreadable baseline" to
  "unreadable or zero-byte baseline", and scope the action-provenance routing clause to the exit-1 arm
  (an exit 2 is fixed and the guard re-run), keeping the quarantine framing code-agnostic — both nonzero
  codes forbid `CLEARED` until the guard is settled — and keeping the bullet's `self-confound` term (a
  diagnosis-preflight anchor). Touch nothing else in the file: the `## Route upstream` template, the
  Verdict/Rounds region, and every other construct are sibling plans' surfaces (A4). **red-team-gate.test.mjs
  (D11, added at /red-team round 1)** — add ONE fail-closed retired-wording doc-guard row beside the
  existing 5.5 family and plan 1's landed D8b row: assert the NEW-present anchors first (the widened
  `unreadable or zero-byte baseline`, and `On exit 1, diagnose`) so a failed extraction reds rather than
  vacuously passing, then assert both retired needles absent, **case-insensitively**, from `SKILL.md` and
  `lenses.md`. **Each needle MUST be built at runtime from split fragments** (e.g.
  `['unreadable', 'baseline'].join(' ')`) — the row sits inside End state 9's own grep scope, so a literal
  spelling would self-match and permanently false-red that check. Verify after writing it that End state 9's
  `grep -rin 'unreadable baseline' skills/red-team/` still returns **zero** with the row present. Run End
  state 9's sweep + mandatory manual survey and End state 5's grep set + survey; record outcomes in the done
  report even when zero stragglers. Commit cites #1268 and #1263.
- Done when: `bash skills/red-team/diagnosis-preflight.test.sh && node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: ADR 0043 Context over-claim correction

- Files: `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`
- Plan slice: **APPEND** a dated correction note — heading exactly
  `## Correction (2026-08-15, #1268)` — at the end of the ADR body, in the shape ADR 0016's
  `## Amendment (2026-07-19)` establishes. It states: the Context paragraph's "the *only* mechanic Step 5
  offered for closing a blocker (the grill loop …)" over-claims, because Step 5 also offered a **probe
  re-run** — the very mechanic this ADR's own Decision 3 two-arm re-verify trigger depends on; the
  paragraph's argument is otherwise unaffected (nothing stopped removal being applied to a merely-patched
  finding). **The Context sentence's own bytes are NOT edited** — every pre-existing body byte stays
  exactly as shipped, which honors this plan's pivotal "all other body text byte-unchanged" constraint
  more conservatively than the originally-planned in-place rewrite. The **`**Status:**` currency line MAY
  be updated** — the recorded exception to a byte-unchanged-body mandate. **This reverses D5/A5**: a
  /red-team round-1 corpus survey found the assumed in-place-for-false-when-written convention does not
  exist (ADR 0016's appended amendment corrects a description that was wrong when written; 0019 and 0023
  share the shape). Run End state 7's checks + mandatory manual survey; record the outcome in the done
  report. Commit cites #1268.
- Done when: None — prose-only ADR correction with no mechanical suite mapped; the worker's manual check
  is End state 7's check pair + survey.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place, never
  an empty field, no badge) — to the **next free patch above the live integration base at land time**;
  never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the tip after whichever 2026-08-06 campaign predecessors
  the roadmap sequences ahead of this plan (ADR 0011 stack-and-plow) — no predecessor **must** land first
  for this plan's correctness (A4: no declared dependsOn, no content dependency), so if this plan launches
  first the base is the master tip at campaign launch. Standalone fallback: run through plain `/war`,
  resolve the next free patch from the four slots themselves. The Status blurb names the zero-byte
  baseline infra hardening, Step 4's exit-2 arm, and the pinned gitignored ceiling — quoting only
  identifiers that exist in the landed diff (release-blurb lessons: count words match the enumeration;
  quoted literals byte-match landed identifiers; guard semantics stated no wider than the implementation —
  the pin case documents a false negative, it does not close one).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 5, 7, 8, and 9 — **narrowed at /red-team round 1 (R4)
  to wording the tokens cannot catch.** The mechanical OLD-absent half is no longer deferred: D11 puts it in
  `red-team-gate.test.mjs`, which End state 6 already runs, so a retired wording returning to `SKILL.md` or
  `lenses.md` now reds a committed test rather than relying on a hand-run grep · why deferred: a free-form
  hand-scan for *unforeseen rewordings* cannot be reduced to a mechanical gate member; done-report-only
  evidence, which gate-audit reads as SOFT and never a hold (deliberately-uncommitted-probe lesson class) ·
  runner: the owning task's worker records each outcome — mandatory statement even when "zero stragglers" —
  **1.2** for End states 5/9's `SKILL.md` + `lenses.md` scopes, **1.1** for End state 8's *and End state 9's*
  guard/suite scopes (**R7**: the guard header is a Task 1.1 file, and the previous map left its survey half
  with no runner — Task 1.2 cannot survey a file it does not open), **1.3** for End state 7. The Lead re-runs
  all four greps at phase close, in their case-insensitive forms, plus the leader-strip/normalize pass over
  the two hard-wrapped carriers.
- The zero-byte case's pre-fix demonstrated red (drop the `-s` check → the case reds at exit 1 with the
  inverted removed-every-ref message) · why deferred: a delete-and-trace mutation run is uncommittable by
  design — the committed case with its `rogue`-branch fixture is the standing non-vacuity guard (D7) ·
  runner: Task 1.1's worker runs it locally and records the red in the done report; gate-audit reads it
  SOFT.
- The gitignored-leak detection ceiling itself (issue #1369) · why deferred: a ratified deferral, not a
  validation this plan can run — the pinned suite case delivers the back-compat-pin half; the remaining
  prerequisite (a ruling on legitimately-ignored directories) is future-spec work, and any `--ignored`
  widening's first act is consciously flipping the pin case red · runner: **a successor issue, filed at
  phase close, is the accountable owner** (added at /red-team round 1, **R5**). This row is a deferred
  *feature*, not a deferred validation, so without a tracked handle it would be undischargeable — and
  closing #1369 at phase close, as this plan does, would otherwise **orphan** the ceiling with no successor
  artifact while still occupying the backstop ledger that every phase report, the final PR body and the
  campaign ledger render. **Duty:** at phase close the Lead files one `war-followup` issue covering the
  `--ignored` widening plus the legitimately-ignored-directories ruling, cross-referencing #1369 and the
  pinned suite case, **before** closing #1369; a demonstrated ignored-path escape reopens it. The guard
  header and suite banner remain the documentation of record.

## Notes / conscious deviations

1. **REVERSED at /red-team round 1 (R6): the ADR 0043 fix is an APPENDED dated correction note, not an
   in-place Context edit** (D5/A5). The conversion-time argument claimed the corpus splits by claim class —
   appended notes for decision changes and true-then-stale claims, in-place repair for claims that were
   false when written. **A corpus survey falsified that split.** `docs/adr/0016-campaign-compaction-survival.md`
   carries `## Amendment (2026-07-19): a bare layout is a probe success, not a fail-open case`, which opens
   "The Decision half of the 2026-07-15 amendment above is **corrected** here" and adds "This amendment
   changes only the *description* of which cases engage fail-open; no decision and no code change" — a
   description that was **wrong when written**, repaired by an appended note. `docs/adr/0019` and
   `docs/adr/0023` carry the same shape. The corpus appends regardless of when the claim became false.
   The appended arm is also strictly more conservative here: it leaves the Context paragraph byte-identical,
   which is what this plan's own pivotal constraint asks for. Issue #1268's "one-to-two-line prose
   corrections" framing describes the SIZE of the fix, not its channel.
2. **The OLD-absent checks are scoped to live `skills/red-team/` surfaces; the spec's `skills/ docs/`
   sweep scope survives as the handling floor** (D10). Measured at `6fff2ee`: the live carriers of
   `unreadable baseline` are the guard header (two sites), the Step-4 parenthetical, and the `lenses.md`
   bullet; the retired opener `On a nonzero exit, diagnose` appears once (Step 4). Every `docs/` hit —
   `docs/plans/2026-08-02-redteam-doctrine-and-guards.md`, this plan and its source spec — is a
   posterity survivor, enumerated and never retro-edited (ADR 0046 posture); `docs/learnings/` carries
   zero hits for either retired pattern at that base (the lessons record the defect mechanisms, never
   the contract wordings). An unscoped
   zero-hit assertion would false-red on this plan document itself, which necessarily quotes both retired
   phrases (backstop-retirement-grep-false-reds class).
3. **Contention honesty** (A4). `lenses.md` is a three-plan file this campaign: plan 1
   (`2026-08-06-red-team-gate-cli`, the `## Route upstream` template + doc-guard rows that read the file)
   and the `verdict-adjudication-integrity` group (the severity Verdict bullet + report-template comment)
   touch constructs disjoint from this plan's escape-guard bullet. No ordering edge is warranted in the
   roadmap's dependency spine — this spec declares no dependsOn and no content dependency exists in
   either direction — only a `## Shared-file contention` row; cross-plan serialization is ADR 0011's job.
   When this plan lands after plan 1, Task 1.2's rebase leaves the Route-upstream blank line and the
   doc-guard-read regions untouched by construction (disjoint constructs), and End state 6's
   `red-team-gate.test.mjs` run re-proves it at the rebased base.
4. **The lesson stamp is folded into Task 1.1** rather than carved as a fourth prose task (D9). The spec's
   carving hint lists the lesson among four file-disjoint prose surfaces; folding it into the fixing task
   keeps the RESOLVED stamp honest (it lands in the same commit family as the `-s` check it declares
   resolved, citing #1263 once) and removes a would-be deps edge with no parallelism lost.
5. **The 1.2 → 1.1 deps edge is a content edge, not rule 7's guard-split case** — no mechanical drift
   guard is split across tasks (the new suite cases ride with the guard in Task 1.1; the pre-existing
   doc locks live in files this plan does not create). The edge exists because Task 1.2's prose asserts
   the widened exit contract Task 1.1 authors: at the frozen phase base that prose would read as a false
   code-fact to its auditor. The template's "defined-but-not-yet-emitted; produced in Task 1.1"
   annotation was the considered alternative; the edge is available with no cycle, makes the prose true
   at Task 1.2's audit base, and matches the sibling gate2-publication-guard spec's G11 precedent
   (a lesson/doc task content-edged onto the task whose landed shape it describes). Logged for /red-team
   ratification.
6. **Posterity survivors.** Historical artifacts are never retro-edited (ADR 0046 posture): landed
   plans and specs, red-team reports, and the `docs/learnings/` lesson bodies (the RESOLVED stamp
   freezes, never rewrites — D8) keep whatever wording they shipped with; the measured carriers of the
   retired wordings, and every OLD-absent scope, are per Note 2.
7. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified lesson issues #1263/#1369 and the war-followup issue #1268;
   conversion-time judgments (D5, D9, D10, A4, A5, Notes 1–5) are logged for /red-team ratification.

## Open decisions

None. The spec's design tree is fully resolved; every conversion-time judgment is logged above for
/red-team ratification.
