# Red-team gate CLI unknown-token refusal, loop-breaker boundary coverage, and Route-upstream template blank-line fix

Converted by `/war-machine` from [docs/specs/2026-08-06-red-team-gate-cli-design.md](../specs/2026-08-06-red-team-gate-cli-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated reason).
Issues addressed: #1378, #1347, #1366. Issue → task mapping: #1378 → Task 1.2; #1347 F1–F4 → Task 1.2;
#1366 → Task 1.1 (the blank lines) + Task 1.2 (the doc-guard rows). `/war` files its own epic + task issues
regardless (war-execution-must-file-issues); closing the three source issues is Lead checkpoint work at phase
close (war-checkpoint-must-close-task-issues), never assumed from the epic close.

## Context — the gap / problem

All three issues sit on the red-team loop-breaker path (ADR 0045): the gate CLI that computes
`routeUpstream`, the test suite that pins its arithmetic, and the Route-upstream report template the same
output feeds (verified: issues #1378, #1347, #1366 (2026-08-06), each re-verified in the live tree at
`6fff2ee`). Source spec: `docs/specs/2026-08-06-red-team-gate-cli-design.md`. Snapshot base for every
measured claim: the repo tip at `6fff2ee` (2026-08-06); conversion-time re-measurements below are at the
same base.

1. **`--stdin` mode silently drops a space-separated flag value that file mode refuses only by accident**
   (verified: issue #1378 (2026-08-06); re-verified in the live tree at `6fff2ee`). `main()` in
   `skills/red-team/assets/red-team-gate.mjs` parses flags only via the `flagValue` closure
   (`=`-attached forms). In file mode a space-separated typo (`--rounds 3`) is refused loudly only
   because the positional scan (`args.find(a => !a.startsWith('--'))`) grabs the bare token as the
   results path and the file read throws — **and even that holds only when the stray value token
   precedes the path.** In the order the CLI's own usage line documents
   (`red-team-gate.mjs (<results.json> | --stdin) [--rounds=<n>]`), `args.find` binds the REAL path,
   the trailing `3` is silently ignored, and the run exits **0** with empty stderr and no
   `routeUpstream` — i.e. file mode's "accidental" net is order-dependent and absent in the documented
   order (/red-team round 1, R9 — measured live at `8ac52d0`; this widens the gap the plan closes and
   is why D10's rewritten row must pin the refusal by the explicit check, not by token order). In
   `--stdin` mode there is no positional scan and no
   unknown-token check: the stray tokens are ignored, `rounds` resolves `undefined`, and the emission
   condition in `main()` (`rounds !== undefined || roundLimit !== undefined`) skips `routeUpstream`
   entirely — silently absent, indistinguishable from the flag never being passed. `--stdin` is the mode
   the skill's own re-pipe doctrine prescribes (`skills/red-team/SKILL.md` Steps 4–5; verified: live tree
   at `6fff2ee`), so the weaker net sits on the production path.
2. **Four demoted-absorb audit findings on the same file pair remain open** (verified: issue #1347
   (2026-08-06); each re-verified at `6fff2ee`): **F1 (Minor)** — the stdin-mode silent drop above, the
   exact silent `routeUpstream: false` the module's own CLI doc block forbids (duplicate ground with
   #1378; one fix closes both); **F2 (Nit)** — the doc block's parenthetical ("a typo'd flag must not let
   a chronic plan keep grinding") attributes the loud refusal to a typo'd flag NAME while
   `resolveRoundInput` enforces it only on the VALUE; **F3 (Minor)** — the suite never exercises
   `rounds: 0` (the fail-open seed `skills/red-team/SKILL.md` Step 1 assigns every legacy/first
   invocation) nor a rounds-only CLI invocation, so two falsiness regressions (`if (!key)` in
   `resolveRoundInput`'s key arm; dropping the first emission disjunct) would stay green; **F4 (Nit)** —
   arm 1 of `routeUpstream` keys on the `blockers`+`needsDecision` union, but no assertion discriminates
   the union below rounds 2 — mutating it to blockers-only leaves the whole suite green (every
   needsDecision fixture runs at rounds ≥ 2, where arm 2 masks arm 1).
3. **The Route-upstream template mis-nests its `**Re-entry:**` line into the agenda bullet** (verified:
   issue #1366 (2026-08-06); re-verified at `6fff2ee`). In both `skills/red-team/references/lenses.md`
   (the report template's `## Route upstream` section) and `skills/red-team/references/loop-budget.md`
   (the fenced block template), the bold `**Re-entry:**` line sits directly after the agenda bullet with
   no blank line, so CommonMark lazy continuation renders it inside that bullet. The two blocks are
   byte-identical **over their shared `**Regrill:**`→`**Re-entry:**` lines** — not over the whole
   section: `lenses.md`'s block additionally carries a guidance HTML comment directly under the heading
   that `loop-budget.md`'s does not, and `loop-budget.md`'s sits inside a ```` ```markdown ```` fence
   (/red-team round 1, R10; this is exactly the scope End state 9's sed range already measures, so the
   fix is unaffected). `/war-campaign`'s halt arm copies the section verbatim into CAMPAIGN-STATE.md,
   so the mis-nesting propagates to every operator-facing copy. No existing guard can catch it: of the
   **four** Task-5.5 doc-guard rows in `skills/red-team/assets/red-team-gate.test.mjs` — 5.5(a)
   lenses.md Verdict/Rounds adjacency, 5.5(b) lenses.md `## Route upstream` heading, 5.5(c) SKILL.md's
   ADR 0042 trigger pointer, 5.5(d) the retired per-blocker-only ROUNDS wording absent from SKILL.md —
   none inspects blank-line structure (/red-team round 1, R11 — the plan's earlier "only … heading and
   the Verdict/Rounds adjacency" undercounted the family at two; the *conclusion* is unchanged, and
   5.5(d) is the fail-closed extract-then-assert-absent precedent D8b now mirrors). Verified at
   `6fff2ee`, re-verified at `8ac52d0`.

## Pivotal constraints

- **`--stdin` is the production path.** Any fix must strengthen that path, not just file mode — scoping
  the doc claim down to file mode would leave the production path with the weaker net (rejected in D1).
- **The pure exports are correct and untouched.** `routeUpstream`, `verdict`, `classify`,
  `resolveRoundInput`'s validation arms, and the coverage layer change nothing (#1347 states the
  arithmetic is correct). The work is `main()`-side argument hygiene plus test/doc truth.
- **Refusal contract:** exit 1, diagnostic on stderr, no verdict on stdout — the existing
  `die`/`resolveRoundInput` shape. The zero-probe refusal, invalid-JSON exit, and usage exit remain
  distinct refusals.
- **Absent-input identity is pinned.** A rounds-less valid invocation's stdout stays byte-identical to
  the pre-rounds shape; the new check may not alter output for any currently-valid invocation.
- **Partial-input emission is pinned deliberate behavior.** The `--round-limit`-only row keeps asserting
  `roundLimit` echo + `routeUpstream: false` with `rounds` absent. F1's optional suggestion (require both
  inputs, or emit `rounds: null`) is superseded: the missing `rounds` key in the echo is the visible
  tell, and the bare-token refusal removes the only path by which the partial shape arose *silently*.
- **Comment truth travels with the mechanism.** The CLI doc block's "refused by construction" clause is
  rewritten in the same commit that changes the mechanism (source-comment-lags class), and the file-mode
  test row whose title names the positional-scan mechanism is renamed with it.
- **Template parity.** The Route-upstream blocks in `lenses.md` and `loop-budget.md` are duplicates; the
  fix inserts the same blank line in both so their shared lines stay byte-identical.
- **Guard-split deps edge (war-strategy §3 rule 7 / ADR 0025 amendment).** The blank-line doc-guard rows
  live in `red-team-gate.test.mjs` (the gate task's file); the blank lines land in the template task. The
  guard task carries `deps` on the template task — same wave is insufficient at the frozen phase base.
- **No new files.** Reuse the existing `runGate` harness and the doc-guard fs-read idiom (the module-level
  `LENSES`/`SKILL` reads beside the 5.5 rows); anchors in new doc-guard regexes are quote-free (the
  recorded anchor-fragility lesson).
- **Anchor by named construct** everywhere (`main()`, `flagValue`, `resolveRoundInput`, the emission
  condition, test titles) — never line numbers.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Fix shape for #1378/F1 | **Explicit default-deny unknown-token check, every mode** — narrowing the refused-loudly claim to file mode would document the hole instead of closing it | (verified: issue #1378 (2026-08-06)); spec §3 row 1 |
| D2 | What exactly is refused | Any `--`-prefixed token that is not `--stdin` and does not start with `--rounds=` or `--round-limit=` refuses loudly in **both** modes (catches both halves of a space-separated pair and any typo'd name). In `--stdin` mode any bare (non-`--`) token also refuses — stdin mode consumes no positionals (A1). File mode keeps its positional scan: the first non-`--` token is the results path, unchanged | spec §3 row 2; A1 |
| D3 | Check placement | Top of `main()`, immediately after `args` is derived, before mode selection and the stdin read — one refusal site, fail-fast without consuming the pipe, same exit-1/stderr/no-stdout contract as the existing `die`. **`die` is a `const` closure declared inside `main()` well BELOW the check's insertion point and passed INTO `resolveRoundInput` as its 4th parameter — it is not `resolveRoundInput`'s own** (/red-team round 1, R12; verified live at `8ac52d0`), so the new check either hoists/duplicates that one-line write-stderr-then-exit-1 contract at the top of `main()` or moves the `die` declaration above it — the worker picks, but must not assume `die` is already in scope where the check lands. Stderr names the offending token and the accepted forms (`--rounds=<n>` / `--round-limit=<n>`) | spec §3 row 3; /red-team round 1 |
| D4 | F2 (doc parenthetical: NAME vs VALUE) | **Make the claim true instead of narrowing it.** With D2 landed a typo'd name *and* a typo'd value both refuse, so the parenthetical stands; the "refused by construction" positional-scan attribution is rewritten to name the explicit check | (verified: issue #1347 (2026-08-06)) F2; spec §3 row 4 |
| D5 | F3 (zero boundary + first emission disjunct) | **Two rows, not one** (/red-team round 1, R2 — the spec's "one row closes both gaps" is retired as code-traceably false). Row (a) the auditor's verbatim-in-substance FLAG form: `--stdin --rounds=0` (rounds-only) → exit 0, `rounds: 0` echoed, `routeUpstream` emitted `false`, `roundLimit` absent — this closes the **first-emission-disjunct** gap only. Row (b) the input-KEY form: a `--stdin` payload carrying `rounds: 0` as a top-level key with **no** `--rounds=` flag → exit 0, `rounds: 0` echoed, `routeUpstream` emitted `false`. Row (b) is the **only** shape that reds under the `if (!key)` mutation: `resolveRoundInput` returns from its flag arm (`if (flagRaw !== undefined) { …; return Number(flagRaw) }`) **before** reaching the key arm (`if (key === undefined \|\| key === null) return undefined`), so the flag form never exercises the key arm at all (verified in the live module at `8ac52d0`) | (verified: issue #1347 (2026-08-06)) F3; spec §3 row 5; /red-team round 1 |
| D6 | F4 (arm-1 union mutation coverage) | The auditor's verbatim assertion in the existing arm-1 test: a needsDecision-only open set routes at rounds 1 / roundLimit 1 — reds under the blockers-only mutation, unreachable by arm 2 (rounds 1 < 2) | (verified: issue #1347 (2026-08-06)) F4; spec §3 row 6 |
| D7 | #1366 fix | One blank line before `**Re-entry:**` in the `## Route upstream` template in `lenses.md` and the fenced block in `loop-budget.md`; the two blocks remain byte-identical over shared lines. No `/war-campaign` change — the halt arm copies from the fixed source | (verified: issue #1366 (2026-08-06)); spec §3 row 7 |
| D8 | Guard the blank line? | Yes — two doc-guard rows in `red-team-gate.test.mjs` beside the existing 5.5 rows, each asserting the `**Re-entry:**` line is blank-line-preceded (a regex sees `\n\n` where a substring cannot); a new fs read of `loop-budget.md` beside the existing `LENSES` read (A2) | spec §3 row 8; A2 |
| D8b | Guard the **retired wording** too? | **Yes — one additional doc-guard row** (/red-team round 1, R4; the recorded old-absent-half-relies-on-an-unrecorded-hand-grep class). End state 6's OLD-absent half had no mechanical guard at all: an executed probe implemented the whole of Tasks 1.1+1.2, re-introduced `refused by construction` into the suite, and the task's own Done-when gate stayed **GREEN**. The row fs-reads **`red-team-gate.mjs` itself** (a new module-level read beside `LENSES`/`SKILL`/the new `loop-budget.md` read) plus the already-read suite source, and asserts **both** retired tokens absent from both files: the module's `refused by construction` clause and the suite's `positional scan picks it as the results path` row title. **Self-match hazard, mandatory mitigation:** a row spelling either phrase literally would itself be a hit in `red-team-gate.test.mjs` (the recorded coupling-comment-restating-the-grep-pattern class), so each needle is **constructed at runtime from split fragments** (e.g. `['refused by', 'construction'].join(' ')`) — the contiguous literal must appear nowhere in the suite source. Fail-closed shape, mirroring 5.5(d): assert a NEW-present anchor (the every-mode default-deny prose) **first**, so a failed extraction reds instead of vacuously passing, then assert each retired needle absent | /red-team round 1, R4 + R5; End state 6; ADR 0025 drift-guard discipline |
| D9 | Task decomposition | Two file-disjoint tasks, one phase — Task 1.1 templates, Task 1.2 gate + suite with `deps: [1.1]` (the guard rows read Task 1.1's files: §3 rule 7) — plus the standard trailing release phase | spec §3 row 9; war-strategy §3 rule 7 |
| D10 | Existing space-separated file-mode row | **Rewritten, not deleted**: same fixture, but title and assertions move from the accidental mechanism (ENOENT via the positional scan) to the explicit one (the D3 stderr substring, still exit ≠ 0, no verdict on stdout). No second row pinning the dead ENOENT shape | spec §3 row 10 + §8 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Default-deny over stdin-mode bare tokens is the right concretization of #1378's "unknown-bare-token check in every mode" | spec §3 row 2 (carried [assumed] row); **ratified /red-team round 1** | a stray token beside `--stdin` keeps being ignored silently — the #1378 shape half-open | **the DISCRIMINATING bare-token row — `--stdin` plus a bare token and NO unknown `--` token** (End state 1 clause (b)). /red-team round 1, R1: the originally-nominated `--stdin --rounds 3` row cannot discriminate this arm, because `--rounds` is itself a `--`-prefixed token outside the accepted set `{--stdin, --rounds=, --round-limit=}` and the `--`-token arm refuses it first — that row stays green even if the bare-token arm were omitted from `main()` entirely |
| A2 | The blank-line doc-guard rows are wanted — invention beyond #1366's literal ask | spec §3 row 8 (carried [assumed] row); #1366 itself names the guard gap ("substring-asserting drift-guard tests cannot catch a missing blank line") | guard rows dropped; the fix lands unguarded and the next template edit can silently regress it | End state 5; ratify in /red-team |
| A3 | File-mode surplus positionals (a second bare path token) stay silently ignored | spec §9 (carried [assumed] non-goal); no issue reports it | a doubled path argument keeps being ignored — today's behavior | non-goal; a field recurrence files an issue |
| A4 | No sibling plan must LAND first for this plan's work to be correct — but the footprint is **not** wholly owned across the 2026-08-06 campaign | conversion-time measurement at `6fff2ee` — this RETIRES the spec §8 claim "all four files in the footprint are wholly owned here": sibling specs `2026-08-06-escape-guard-exit-contract-design.md` (touches `lenses.md`, escape-guard bullet) and `2026-08-06-verdict-adjudication-integrity-design.md` (touches `red-team-gate.mjs`, header-comment rewrite) overlap two files. Direction is one-way: `verdict-adjudication-integrity` declares `dependsOn: red-team-gate-cli` and states its work lands AFTER this group (verified: its header + cross-group-ordering note at `6fff2ee`) — this plan is its upstream and must land before it; `escape-guard-exit-contract` declares no edge; nothing must land before this plan | serial-merge rebase conflicts across plans if landed unserialised — or, sequenced sibling-first, conflicting rewrites in `red-team-gate.mjs`'s comment block | ADR 0011 stack-and-plow serializes plans; the roadmap carries this plan → `verdict-adjudication-integrity` as an ordering edge in the dependency spine (not merely a contention row), and its `## Shared-file contention` table records the `lenses.md` overlap; /war-campaign's sweep contention check re-verifies |

## Non-goals / deferred

- **No change to the pure arithmetic** — `routeUpstream`, `verdict`, `classify`, `resolveRoundInput`'s
  validation arms, and the coverage layer are correct as landed.
- **No both-inputs-required emission change and no `rounds: null` echo** — the partial-input emission
  shape is pinned deliberate behavior; F1's optional suggestion is recorded as superseded, not adopted.
- **No file-mode surplus-positional refusal** (A3).
- **No unknown top-level input-KEY refusal** (/red-team round 1, R3). The module's own CLI doc block
  states that `rounds`/`roundLimit` "arrive as top-level input keys or as `=`-attached flags"
  (verified: `red-team-gate.mjs` CLI doc block; `main()` reads `parsed.rounds` / `parsed.roundLimit`
  through `resolveRoundInput`'s key arm with no unknown-key validation). D2/D3's default-deny check
  operates on `args` (argv) and cannot reach that channel, so a typo'd input KEY (`round`, `Rounds`)
  still resolves `undefined` and silently omits `routeUpstream`. Deliberately out of scope: the
  payload is the red-team Workflow's return object, whose top-level key space is open by construction
  (`plan`, `repo`, `fingerprint`, `provision`, `expected`, `probeResults`), so a default-deny over
  keys would be wrong, and a near-miss `round*`-shaped key diagnostic is new design beyond this plan's
  "`main()`-side argument hygiene" constraint. The Purpose is scoped to argv accordingly. A field
  recurrence files an issue.
- **No renderer-based Markdown validation harness** — the blank-line regex guard is the proportionate
  mechanism.
- **No `/war-campaign` or `skills/red-team/SKILL.md` edits** — propagation to CAMPAIGN-STATE.md is by
  copying the fixed source template; the skill steps already prescribe only `=`-attached forms.
- **No reopening** of the landed 2026-08-05 phase-4 plan, its red-team report, or the audit dispositions
  that produced #1347.

## New domain terms · Recommended ADRs

None. The change hardens existing constructs (the gate CLI's refusal contract, the Route-upstream block)
without a new concept; ADR 0045 documents the typed inputs and arithmetic, not the flag-parsing
mechanism, and stays accurate as written.

## Commander's Intent

- **Purpose:** a typo'd or malformed gate-CLI **argv** invocation can never silently suppress the
  loop-breaker output on any argv path — the refusal is loud in both modes, for flag names and values
  alike — and the operator-facing Route-upstream block renders as authored in every copy that reaches
  an operator. Scope is the **argv channel only**; the top-level input-key channel keeps today's
  behavior by decision (Non-goals; /red-team round 1, R3).
- **Method:** one default-deny argument check at the top of `main()` ahead of mode selection (the
  existing `die` contract), with the CLI doc block's mechanism claim rewritten in the same commit so the
  comment states only what the code holds; close #1347's four coverage gaps with the auditor's
  verbatim-in-substance rows; insert the blank line in both byte-identical Route-upstream templates and
  pin it with quote-free regex doc-guard rows that ride a `deps` edge onto the template task (§3 rule 7).
  Pure exports untouched; no currently-valid invocation changes output by a byte.
- **End state:**
  1. Two rows, both refusing loudly — exit 1, stderr diagnostic naming the offending token and the
     accepted `=`-attached forms, no verdict on stdout: **(a)** a stdin-mode space-separated flag value
     (`--stdin --rounds 3`) — the #1378/F1 production-path repro row; **(b)** the **discriminating
     bare-token row** — `--stdin` plus a bare token and **no** unknown `--` token (e.g.
     `['--stdin', 'results.json']`), which is the only shape that reds when the stdin bare-token arm is
     omitted from `main()` (in (a) the `--`-token arm refuses `--rounds` first and shadows it) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  2. A typo'd flag name (e.g. `--stdin --round=3`) refuses with the same contract in every mode — the
     default-deny check at the top of `main()` covers every `--` token outside the known set ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  3. Both zero-boundary forms are pinned (D5) — "0 is a supplied value, not not-supplied": **(a)** the
     FLAG form `--stdin --rounds=0` (rounds-only) exits 0 with `rounds: 0` echoed, `routeUpstream`
     emitted `false`, `roundLimit` absent — this closes the first-emission-disjunct gap; **(b)** the
     input-KEY form — a `--stdin` payload carrying top-level `rounds: 0` with **no** `--rounds=` flag —
     exits 0 with `rounds: 0` echoed and `routeUpstream` emitted `false`. Only (b) reds under the
     `if (!key)` mutation of `resolveRoundInput`'s key arm; (a) returns from the flag arm first and
     never reaches it ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  4. The existing arm-1 test carries the union assertion — a needsDecision-only open set routes at
     rounds 1 / roundLimit 1 (`routeUpstream(..., 1, 1) === true`) — which reds under the blockers-only
     mutation (`const open = blockers`); the mutation trace itself is worker done-report evidence
     (backstop row) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  5. Both Route-upstream templates carry a blank line before `**Re-entry:**`, and the two new doc-guard
     rows red when either file drops it (live shape:
     `grep -B1 '^\*\*Re-entry:' skills/red-team/references/lenses.md skills/red-team/references/loop-budget.md`
     — **read it correctly**: with two file operands grep prefixes EVERY line with the filename, so the
     blank context line renders as a bare `<file>-` and there is no visually blank line in the output;
     the passing shape is a `<file>-` context line with nothing after the separator, above each
     `<file>:**Re-entry:` match, with a `--` group separator between the two files (/red-team round 1,
     R13 — measured on a sandbox with Task 1.1 applied). Unambiguous alternative: run it once per file
     — with a single operand grep adds no prefix, so `grep -B1 '^\*\*Re-entry:' <file>` shows a truly
     blank first line) ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  6. The retired mechanism claim is gone from the module and suite — **both** retired tokens, over
     **both** files (/red-team round 1, R4+R5: the single-token check covered only the module, because
     `refused by construction` exists solely in `red-team-gate.mjs` while the suite's known straggler is
     worded differently) ·
     check: `grep -in 'refused by construction\|positional scan picks it as the results path' skills/red-team/assets/red-team-gate.mjs skills/red-team/assets/red-team-gate.test.mjs`
     — zero hits. **`-i` is mandatory, not stylistic** (/red-team round 1, R14): an executed probe
     reproduced the recorded sentence-case false-negative — a re-positioned clause written
     sentence-initially ("Refused by construction: …") passes the case-SENSITIVE form while the retired
     claim is live in the module. The D8b guard row's needles are likewise case-insensitive ·
     **and** gate: the D8b retired-wording doc-guard row in
     `skills/red-team/assets/red-team-gate.test.mjs` reds if either token returns, so the OLD-absent
     half is mechanically guarded after land and not only hand-grepped once
     (`node --test skills/red-team/assets/red-team-gate.test.mjs`).
     **Mandatory manual same-scope survey (the two-token grep is a floor):** hand-scan the module's CLI
     doc block and every test title/comment in the suite for prose still attributing space-separated
     refusal to the positional scan in wording **neither** token catches; list each straggler as a
     survey-derived correction. Survey at spec base `6fff2ee`, re-verified at `8ac52d0`: one straggler —
     the file-mode row title "the positional scan picks it as the results path", retired by D10 and now
     promoted into the mechanical check above.
  7. Every currently-valid invocation's output is byte-identical to today's: the absent-input identity
     row, the `--round-limit`-only emission-disjunct pin, the `=`-attached override row, and the
     reject-set rows are all green unmodified ·
     check: `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  8. The refusal-mechanism sweep over live red-team surfaces shows the only carriers are this group's
     files ·
     check: `grep -rin 'space-separated' skills/red-team/ docs/adr/` — hits only in
     `skills/red-team/assets/red-team-gate.mjs` and `skills/red-team/assets/red-team-gate.test.mjs`
     (new wording), dated snapshot re-measured at the task's rebased base. **`-i` is mandatory** for the
     same sentence-case reason as End state 6 (/red-team round 1, R14): the probe reproduced a
     sentence-initial "Space-separated flag values are refused by construction …" surviving the
     case-sensitive form on a sibling red-team surface. **Mandatory manual same-scope
     survey:** hand-scan `skills/red-team/SKILL.md` Steps 4–5, `references/loop-budget.md`,
     `references/lenses.md`, and ADR 0045 for refusal-mechanism prose the token misses; list stragglers
     as survey-derived corrections. Survey at `6fff2ee`: none — those surfaces prescribe only the
     `=`-attached forms and never state the mechanism. (Scope deliberately narrowed from the spec's
     `skills/` — see Notes.)
  9. The two Route-upstream blocks remain byte-identical over their shared lines (Regrill / Agenda /
     bullet / blank / Re-entry — the guidance comment is lenses-only by design) ·
     check: `diff <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/lenses.md) <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/loop-budget.md)`
     — empty.
  10. Each landing commit cites its issue(s) — #1366 for Task 1.1, and #1378 + #1347 + **#1366** for
      Task 1.2 (the #1347 close conditions require the citation; #1366 rides on Task 1.2 too because the
      blank-line doc-guard rows are #1366's own named guard gap — /red-team round 1, R7) ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
      **Why judged and not `check:`** (/red-team round 1, R6 — the judge-tag grading rule): the
      `<phase-base>..<tip>` range does not exist at any task's pre-merge gate, so no gate- or
      floor-runnable command can decide this condition at the moment a task is gated; the range first
      exists post-merge, which is exactly where the execution-evidence seat reads it. The seat's
      observable IS a `git log --grep` over that range — judged only because no *gate member* can run it.
  11. The redaction lint stays green ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`; the war-memory lint wrapper is a
      discovered member).
  12. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` — this proves **only** the two
      decidable halves: the four slots agree lock-step, and the monotonic floor holds. **Both** of the
      remaining halves are judged at audit_sha by the execution-evidence seat (/red-team round 1, R8 —
      the original parenthetical seated only the first): (i) that a bump landed **at all** (the suite
      passes on a wholly absent release — `cmpSemver(current, max) >= 0` is satisfied by an unchanged
      version), and (ii) that the landed version is the **next free patch** above the live integration
      base (any coherent higher version — a skipped patch, a minor — passes the suite just as well).

## Build order (for /war)

Phase 1 (templates + gate: wave 1 = Task 1.1; wave 2 = Task 1.2 `deps: [1.1]`) → Phase 2 (release).

The wave edge is a content dependency, never a collision dodge: the two file sets are disjoint, and
Task 1.2's doc-guard rows read Task 1.1's files — at the frozen phase base they would be red by
construction without the edge (§3 rule 7); Task 1.2's worker rebases onto the integration tip as its
first act.

## Phase 1 — Loud refusal in every mode; the template blank line and its guard

### Task 1.1: Route-upstream templates — the blank line

- Files: `skills/red-team/references/lenses.md`, `skills/red-team/references/loop-budget.md`
- Plan slice: insert one blank line between the agenda placeholder bullet and the `**Re-entry:**` line
  in the report template's `## Route upstream` section in `lenses.md`, and the same blank line at the
  same spot in the fenced `## Route upstream` block template in `loop-budget.md`, keeping the two
  blocks byte-identical over their shared lines (End state 9's sed/diff shape). Nothing else changes in
  either file: the existing doc-guard 5.5 regexes (Verdict/Rounds adjacency, `## Route upstream`
  heading, the ADR 0042 trigger pointer, the retired-wording absences) are unaffected. Commit cites
  #1366.
- Done when: None — template-only edit with no same-task mechanical guard by design (D8/A2 place the
  blank-line guard rows in Task 1.2's suite, reached by the `deps` edge); the worker's manual check is
  End state 5's `grep -B1` live shape and End state 9's diff.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Gate CLI default-deny check + test/doc truth + the blank-line guard rows

- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: **Module** — add the default-deny argument check at the top of `main()`, immediately
  after `args` is derived and before mode selection/the stdin read (D2/D3): any `--`-prefixed token
  that is not `--stdin` and does not start with `--rounds=` or `--round-limit=` refuses in both modes;
  in `--stdin` mode any bare (non-`--`) token also refuses; file mode keeps the unchanged positional
  scan (first non-`--` token = results path). Refusal: exit 1, stderr diagnostic naming the offending
  token and the accepted forms (`--rounds=<n>` / `--round-limit=<n>`), nothing on stdout — pick the
  stderr wording once and pin the same substring in every new refusal row, keeping it distinct from
  `not a non-negative integer` so the NAME and VALUE refusal channels stay separately greppable.
  Rewrite the CLI doc block in the same commit (D4): the clause attributing space-separated refusal to
  the positional scan ("refused by construction") is replaced by prose naming the explicit every-mode
  check; the positional scan is still described, but only as the path-picking mechanism; the "a typo'd
  flag must not let a chronic plan keep grinding" parenthetical stays — D2 makes it true for names and
  values alike. Pure exports, `resolveRoundInput`, `flagValue`, the emission condition, the zero-probe
  refusal, and the usage line untouched. **Suite** — rewrite the file-mode space-separated row (D10):
  same fixture, title and assertions moved to the explicit refusal (exit ≠ 0, the new stderr substring,
  no verdict on stdout); do not keep a second ENOENT-shape row (dead behavior). New rows:
  `--stdin --rounds 3` refuses with the new substring (End state 1(a), the #1378/F1 production-path
  repro); **the discriminating bare-token row — `--stdin` plus a bare token and NO unknown `--` token
  (e.g. `['--stdin', 'results.json']`) refuses with the same substring (End state 1(b)); this row, not
  the `--rounds 3` one, is what proves the stdin bare-token arm exists, since in that row the
  `--`-token arm refuses `--rounds` first and shadows the bare arm entirely** (/red-team round 1, R1);
  a typo'd flag name (e.g. `--stdin --round=3`) refuses (End state 2); **both** D5 zero forms
  (End state 3) — the FLAG form `--stdin --rounds=0` rounds-only, **and** the input-KEY form, a
  `--stdin` payload carrying top-level `rounds: 0` with no `--rounds=` flag, which is the only shape
  that reaches `resolveRoundInput`'s key arm and so the only one that reds under the `if (!key)`
  mutation (/red-team round 1, R2). New assertion in the existing arm-1 test per D6, with the auditor's
  message ("arm 1 keys on the blockers+needsDecision UNION…"); demonstrate the blockers-only mutation
  red locally and record it in the done report (backstop row). Two doc-guard rows per D8 beside the
  existing 5.5 rows: in each of `lenses.md` and `loop-budget.md`, the `**Re-entry:**` line is preceded
  by a blank line — quote-free regex anchors keyed on the `**Re-entry:**` token and a preceding empty
  line, tolerant of the line's tail text (doctrine may reword it); a new fs read of `loop-budget.md`
  beside the existing module-level `LENSES`/`SKILL` reads. **One further doc-guard row per D8b** — a
  new module-level fs read of `red-team-gate.mjs` itself beside those reads, asserting a NEW-present
  anchor (the every-mode default-deny prose) **first** so a failed extraction reds rather than
  vacuously passing, then asserting **both** retired needles absent from **both** the module and the
  suite source: `refused by construction` and `positional scan picks it as the results path`. **Each
  needle MUST be built at runtime from split fragments** (e.g. `['refused by', 'construction'].join(' ')`)
  so the guard does not self-match — the contiguous literal must appear nowhere in the suite source,
  and End state 6's own two-token grep must return zero hits over this file with the guard row present
  (/red-team round 1, R4+R5). Every pre-existing row stays green unmodified (End state 7). Run End
  state 6's two-token retirement grep + mandatory manual survey and End state 8's narrowed sweep +
  mandatory manual survey; record both outcomes in the done report even when zero stragglers. Commits
  cite #1378, #1347, and #1366 (the blank-line guard rows are #1366's own named guard gap — /red-team
  round 1, R7).
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the master tip when the campaign launches — this is
  the first plan of the 2026-08-06 campaign, with no predecessor plans (ADR 0011 stack-and-plow; the
  roadmap may reorder — the directive form is base-agnostic). Standalone fallback: run through plain
  `/war`, resolve the next free patch from the four slots themselves. The Status blurb names the gate
  CLI's every-mode default-deny refusal and the Route-upstream template fix — quoting only identifiers
  that exist in the landed diff (release-blurb lessons: count words match the enumeration; quoted
  literals byte-match landed identifiers; guard semantics stated no wider than the implementation).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 6 and 8, **narrowed to UNKNOWN stragglers only**
  (/red-team round 1, R5): the one straggler that was known at authoring time — the file-mode row title
  "the positional scan picks it as the results path" — has been **promoted out of the deferral** into
  End state 6's two-token grep **and** into the D8b mechanical guard row, so it is no longer deferred at
  all. What remains deferred is only prose that neither retired token catches · why deferred: a
  free-form hand-scan for unforeseen wording cannot be reduced to a mechanical gate member;
  done-report-only evidence, which gate-audit reads as SOFT and never a hold
  (deliberately-uncommitted-probe lesson class) · runner: Task 1.2's worker records both outcomes
  (mandatory statement even when "zero stragglers"); the Lead re-runs both greps at phase close.
- The arm-1 blockers-only mutation trace (End state 4's delete-and-trace) · why deferred: a mutation
  run is uncommittable by design — the committed union assertion is the standing guard · runner:
  Task 1.2's worker runs it locally and records the red in the done report; gate-audit reads it SOFT.

## Notes / conscious deviations

1. **End state 8's sweep scope is narrowed from the spec's `skills/` to `skills/red-team/`** (spec §10
   criterion 8). Measured at `6fff2ee`: the spec's stated check false-reds on 13 sanctioned, unrelated
   `space-separated`/`whitespace-separated` glob-set and list-format hits across `skills/war/`,
   `skills/war-room/`, and `skills/war-campaign/` (e.g. `war-config.mjs`'s testPattern prose,
   `assert-test-in-diff.sh`'s glob-set docs) that carry no refusal-mechanism claim (15 total hits at
   that base minus this group's 2; dated snapshot) — the
   backstop-retirement-grep-false-reds lesson class. The narrowed scope preserves the criterion's
   intent (the refusal-mechanism claim's live carriers are red-team surfaces + docs/adr), and the
   mandatory manual survey of the four named surfaces is unchanged. **Ratified at /red-team round 1**,
   with both counts re-measured at `8ac52d0` and **unchanged**: `grep -rn 'space-separated' skills/`
   = 15 hits, and the `-i` form now mandated by R14 yields the same 15 (no case-variant carriers exist
   today), of which 2 are this group's files and 13 are the sanctioned unrelated hits. The narrowed
   `grep -rin 'space-separated' skills/red-team/ docs/adr/` hits **exactly** the two group files at
   this base — so End state 8's post-fix expectation is reachable with no unscheduled edit.
2. **The spec §8 "wholly owned" footprint claim is retired** (A4): two sibling 2026-08-06 specs touch
   two of this plan's files (measured at conversion). Nothing must land before this plan — the spec's
   empty-upstream-list half is carried forward as true — but downstream the direction is real:
   `2026-08-06-verdict-adjudication-integrity-design.md` declares `dependsOn: red-team-gate-cli` and
   states its work lands AFTER this group, so this plan is its upstream and the roadmap must carry
   this plan → `verdict-adjudication-integrity` as an ordering edge in the dependency spine, not
   merely a contention row. The `## Shared-file contention` table additionally records the `lenses.md`
   overlap with `escape-guard-exit-contract` (no declared edge); cross-plan serialization is ADR
   0011's job.
3. **Posterity survivors.** Historical artifacts keep the retired wording and are never retro-edited
   (ADR 0046 posture): the landed 2026-08-05 plan's Task 4.1 slice (the positional-scan attribution
   this plan retires), red-team reports, and the `docs/learnings/` lesson bodies behind #1378/#1366.
   Every OLD-absent check here is scoped to the live module + suite (End state 6) and the narrowed live
   sweep (End state 8).
4. **The deps edge is content, not collision.** Task 1.1/1.2 file sets are disjoint; the edge exists
   because Task 1.2's doc-guard rows read Task 1.1's files (§3 rule 7). Merging the tasks was rejected
   (spec §8: the templates task must be independently green; the file sets are disjoint); deferring the
   guard rows a phase was rejected (the edge is available with no cycle, and rule 7 prefers it —
   a later phase would leave the fix unguarded across a phase boundary for no gain).
5. **The rewritten file-mode row changes what it proves.** After D2/D3 the accidental path (positional
   scan grabbing the bare value) is unreachable — the explicit check fires first; keeping an
   ENOENT-shape row would pin dead behavior (spec §8).
6. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from #1347's operator-dispositioned, auditor-verbatim findings and the
   code-verified lesson issues #1378/#1366; conversion-time judgments (Notes 1–2, A1–A2) are logged
   for /red-team ratification.

## Open decisions

None. The spec's design tree is fully resolved; every conversion-time judgment is logged above for
/red-team ratification.
