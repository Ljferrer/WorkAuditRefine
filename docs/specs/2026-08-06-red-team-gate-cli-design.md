# Red-team gate CLI unknown-token refusal, loop-breaker boundary coverage, and Route-upstream template blank-line fix

Issues: #1378, #1347, #1366

## 1. Context — the gap / problem

All three issues sit on the red-team loop-breaker path (ADR 0045): the gate CLI that computes
`routeUpstream`, the test suite that pins its arithmetic, and the Route-upstream report template
that the same output feeds. Snapshot base for every measured claim below: the repo tip at
`6fff2ee` (2026-08-06).

1. **`--stdin` mode silently drops a space-separated flag value that file mode refuses only by
   accident** (verified: issue #1378 (2026-08-06); re-verified in the live tree at `6fff2ee`).
   `main()` in `skills/red-team/assets/red-team-gate.mjs` parses flags only via the `flagValue`
   closure, which matches `=`-attached forms (`--rounds=3`). In file mode a space-separated typo
   (`--rounds 3`) is refused loudly only because the positional scan
   (`args.find(a => !a.startsWith('--'))`) grabs the bare token as the results path and the file
   read throws. In `--stdin` mode there is no positional scan and no unknown-token check, so the
   stray tokens are ignored, `rounds` resolves `undefined`, and the emission condition in `main()`
   (`rounds !== undefined || roundLimit !== undefined`) skips `routeUpstream` entirely — the
   loop-breaker output is silently absent, indistinguishable from the flag never being passed.
   Since `--stdin` is the mode the skill's own re-pipe doctrine prescribes
   (`skills/red-team/SKILL.md` Steps 4–5 thread `--stdin --rounds=<n> --round-limit=<resolved>`
   into every gate computation; verified: live tree at `6fff2ee`), the weaker net sits on the
   production path.
2. **Four demoted-absorb audit findings on the same file pair remain open** (verified: issue
   #1347 (2026-08-06); each re-verified in the live tree at `6fff2ee`):
   - **F1 (Minor):** the stdin-mode silent drop above — the exact silent `routeUpstream: false`
     the module's own CLI doc block forbids. Duplicate ground with #1378; one fix closes both.
   - **F2 (Nit):** the CLI doc block's parenthetical — "a typo'd flag must not let a chronic plan
     keep grinding" — attributes the loud refusal to a typo'd flag NAME, while
     `resolveRoundInput` enforces it only on the VALUE; a typo'd name is today silently ignored.
     The comment over-claims what the mechanism holds (verified: the parenthetical is unchanged
     in the live CLI doc block at `6fff2ee`).
   - **F3 (Minor):** the suite never exercises `rounds: 0` — the fail-open seed
     `skills/red-team/SKILL.md` Step 1 assigns every legacy/first invocation — nor a rounds-only
     CLI invocation. Verified at `6fff2ee`: the suite's rounds values are 1, 2, 3, 4, 5, 9,
     `undefined`, `null` plus the reject set; no `--rounds=0` row exists, and the only
     single-input emission pin is the `--round-limit`-only row. Two falsiness regressions
     (`if (!key)` in `resolveRoundInput`'s key arm; dropping the first emission disjunct) would
     stay green.
   - **F4 (Nit):** arm 1 of `routeUpstream`'s formula keys on the `blockers`+`needsDecision`
     union, but no assertion discriminates the union below rounds 2 — mutating the union to
     blockers-only leaves the whole suite green, because every needsDecision fixture runs at
     rounds ≥ 2 where arm 2 masks arm 1 (verified at `6fff2ee`: the arm-1 test uses a Critical
     only; all needsDecision rows sit at rounds ≥ 2).
3. **The Route-upstream template mis-nests its `**Re-entry:**` line into the agenda bullet**
   (verified: issue #1366 (2026-08-06); re-verified at `6fff2ee`). In both
   `skills/red-team/references/lenses.md` (the report template's `## Route upstream` section) and
   `skills/red-team/references/loop-budget.md` (the fenced block template), the bold
   `**Re-entry:**` line sits directly after the agenda list bullet with no blank line, so
   CommonMark lazy continuation renders it inside that bullet. The two blocks are byte-for-byte
   duplicates, and `/war-campaign`'s halt arm copies the section verbatim into CAMPAIGN-STATE.md
   (verified: the halt-arm prose in `skills/war-campaign/SKILL.md` names the report's
   `## Route upstream` agenda as the handoff block), so the mis-nesting propagates to every
   operator-facing copy. No existing guard can catch it: the doc-guard rows in
   `skills/red-team/assets/red-team-gate.test.mjs` assert only the `## Route upstream` heading
   and the Verdict/Rounds adjacency, and `/war-campaign`'s ledger suite asserts only the heading
   substring (verified at `6fff2ee`).

## 2. Pivotal constraints

- **`--stdin` is the production path.** `skills/red-team/SKILL.md` Steps 4–5 prescribe
  `--stdin --rounds=<n> --round-limit=<resolved>` for every gate computation of a run. Any fix
  must strengthen that path, not just file mode — scoping the doc claim down to file mode would
  leave the production path with the weaker net (#1378's fallback option, rejected in §3).
- **The pure exports are correct and untouched.** #1347 states the arithmetic itself is correct;
  `routeUpstream`, `verdict`, `classify`, `resolveRoundInput`'s validation arms, and the
  coverage layer change nothing. The work is `main()`-side argument hygiene plus test/doc truth.
- **Refusal contract:** exit 1, diagnostic on stderr, no verdict on stdout — the existing
  `die`/`resolveRoundInput` shape. The zero-probe refusal, invalid-JSON exit, and usage exit
  remain distinct refusals.
- **Absent-input identity is pinned.** A rounds-less valid invocation's stdout stays
  byte-identical to the pre-rounds shape (the existing absent-input identity test row). The new
  check may not alter output for any currently-valid invocation.
- **Partial-input emission is pinned deliberate behavior.** The `--round-limit`-only row asserts
  `roundLimit` echo + `routeUpstream: false` with `rounds` absent (the emission-disjunct pin at
  `6fff2ee`). F1's optional suggestion (require both inputs, or emit `rounds: null`) is
  superseded: the missing `rounds` key in the echo is the visible tell, and the bare-token
  refusal removes the only path by which the partial shape arose *silently*.
- **Comment truth travels with the mechanism.** The CLI doc block's "refused by construction"
  clause (the positional-scan attribution) must be rewritten in the same commit that changes the
  mechanism (lesson class `source-comment-lags-emitted-prompt-after-rewrite`), and the file-mode
  test row whose title names the positional-scan mechanism must be renamed with it.
- **Template parity.** The Route-upstream block in `skills/red-team/references/lenses.md` and
  the fenced template in `skills/red-team/references/loop-budget.md` are duplicates; the fix
  inserts the same blank line in both so they stay byte-identical.
- **Guard-split deps edge (war-strategy §3 rule 7).** The blank-line doc-guard rows live in
  `skills/red-team/assets/red-team-gate.test.mjs`, which the gate task owns; the blank lines
  land in the template task. The guard task must carry `deps` on the template task — same wave
  is insufficient, the guard would be red at the frozen phase base by construction.
- **No new files.** The existing `runGate` harness and doc-guard fs-read idiom in the test file
  are reused; anchors in new doc-guard regexes are quote-free (the recorded anchor-fragility
  lesson).
- **Anchor by named construct** everywhere (`main()`, `flagValue`, `resolveRoundInput`, the
  emission condition, test titles) — never line numbers.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Fix shape for #1378/F1: explicit unknown-token check in every mode, or scope the refused-loudly claim to file mode? | **Explicit check, every mode.** `--stdin` is the production path (constraint 1); narrowing the claim would document the hole instead of closing it. The check is default-deny over the known argument set. |
| 2 | What exactly is refused | Any `--`-prefixed token that is not `--stdin` and does not start with `--rounds=` or `--round-limit=` refuses loudly in **both** modes (this catches both halves of a space-separated pair's flag token and any typo'd flag name). In `--stdin` mode any bare (non-`--`) token also refuses — stdin mode consumes no positionals [assumed: default-deny over stdin positionals is the issue's "unknown-bare-token check in every mode" made concrete — if wrong: a stray token beside `--stdin` keeps being ignored silently, the #1378 shape half-open]. File mode keeps its positional scan: the first non-`--` token is the results path, unchanged. |
| 3 | Check placement | Top of `main()`, immediately after `args` is derived and before mode selection/stdin read — one refusal site for both modes, fast-fail, using the same exit-1/stderr/no-stdout contract as `resolveRoundInput`'s `die`. Stderr names the offending token and the accepted forms (`--rounds=<n>` / `--round-limit=<n>`). |
| 4 | F2 (doc parenthetical: NAME vs VALUE) | **Make the claim true instead of narrowing it.** With decision 2 landed, a typo'd flag name *and* a typo'd value both refuse loudly, so the parenthetical stands; the sentence's "refused by construction" positional-scan attribution is rewritten to name the explicit check. The auditor's fallback reword ("a typo'd VALUE") applies only if decision 1 had gone the other way. |
| 5 | F3 (zero boundary + first emission disjunct) | Add the auditor's verbatim-in-substance CLI row: `--stdin --rounds=0` (rounds-only) → exit 0, `rounds: 0` echoed, `routeUpstream` emitted `false`, `roundLimit` absent. One row closes both the `rounds: 0` falsiness gap and the first-disjunct emission gap. |
| 6 | F4 (arm-1 union mutation coverage) | Add the auditor's verbatim assertion to the existing arm-1 test: a needsDecision-only open set routes at rounds 1 / roundLimit 1 (`routeUpstream(..., 1, 1) === true`) — reds under the blockers-only mutation, unreachable by arm 2 (rounds 1 < 2). |
| 7 | #1366 fix | Insert one blank line before `**Re-entry:**` in the `## Route upstream` template in `skills/red-team/references/lenses.md` and in the fenced block in `skills/red-team/references/loop-budget.md`; the two blocks remain byte-identical duplicates. No `/war-campaign` change — the halt arm copies from the fixed source. |
| 8 | Guard the blank line? | Yes — two doc-guard rows in `skills/red-team/assets/red-team-gate.test.mjs` (beside the existing 5.5 rows) asserting the `**Re-entry:**` line is blank-line-preceded in each file; a regex sees `\n\n` where a substring assertion cannot [assumed: adding this guard is invention beyond #1366's literal ask — if wrong (guard unwanted), the fix lands unguarded and the next template edit can silently regress it]. Requires an fs read of `loop-budget.md` beside the existing `LENSES` read. |
| 9 | Task decomposition | Two file-disjoint tasks, one phase: **T1** templates (`lenses.md`, `loop-budget.md`; #1366); **T2** gate module + test suite (`red-team-gate.mjs`, `red-team-gate.test.mjs`; #1378 + all four #1347 findings + the row-8 guard rows), with `deps: [T1]` — the deps edge exists because T2's guard rows read T1's files (constraint: guard-split rule 7); T2's worker rebases onto the integration tip as its first act. |
| 10 | Existing space-separated file-mode row | Rewritten, not deleted: same fixture, but the title and assertions move from the accidental mechanism (ENOENT via positional scan) to the explicit one (the decision-3 stderr substring, still exit ≠ 0 and no verdict on stdout). |

## 4. Mechanics

### `skills/red-team/assets/red-team-gate.mjs`

- New default-deny argument check at the top of `main()` per design rows 2–3. Known set:
  `--stdin`, `--rounds=`-prefixed, `--round-limit=`-prefixed; file mode additionally consumes
  the first non-`--` token as the results path (unchanged `args.find` scan). Everything else
  refuses: exit 1, stderr diagnostic naming the token and the `=`-attached forms, nothing on
  stdout. The check runs before the stdin read, so a bad invocation fails fast without consuming
  the pipe.
- CLI doc block rewrite (same commit, constraint 6): the clause "the file-mode positional scan
  picks the first non-`--` token as the results path, so space-separated flag values are refused
  by construction" is replaced by prose naming the explicit every-mode check; the positional
  scan is still described, but only as the path-picking mechanism. The "loud refusal"
  parenthetical ("a typo'd flag must not let a chronic plan keep grinding") stays — decision 4
  makes it true for names and values alike.
- Pure exports, `resolveRoundInput`, `flagValue`, the emission condition, the zero-probe
  refusal, and the usage line are untouched.

### `skills/red-team/assets/red-team-gate.test.mjs`

- **Rewritten row** (design row 10): the file-mode space-separated row asserts the explicit
  refusal — exit ≠ 0, the new stderr substring, no verdict on stdout; title updated.
- **New rows:**
  - `--stdin --rounds 3` refuses with the new stderr substring — the #1378/F1 production-path
    repro, the row the suite lacks today.
  - A typo'd flag name (e.g. `--stdin --round=3`) refuses — pins the NAME half of the
    parenthetical decision 4 makes true.
  - `--stdin --rounds=0` rounds-only per design row 5: exit 0; `out.rounds === 0` ("0 is a
    supplied value, not not-supplied"); `routeUpstream` emitted `false`; `roundLimit` absent.
  - Two doc-guard rows per design row 8: in each of `lenses.md` and `loop-budget.md`, the
    `**Re-entry:**` line is preceded by a blank line (quote-free regex anchors; a new fs read
    of `loop-budget.md` beside the existing `LENSES`/`SKILL` reads).
- **New assertion** in the existing arm-1 test per design row 6:
  `routeUpstream(openFindings(F('Minor', { needsDecision: true })), 1, 1)` is `true`, with the
  auditor's message ("arm 1 keys on the blockers+needsDecision UNION…").
- Existing rows stay green unmodified — in particular the absent-input identity row, the
  `--round-limit`-only emission-disjunct pin, the `=`-attached override row, and the
  reject-set rows (all their invocations use only known tokens).

### `skills/red-team/references/lenses.md`

- One blank line inserted between the agenda placeholder bullet and the `**Re-entry:**` line in
  the report template's `## Route upstream` section. Nothing else changes; the doc-guard 5.5
  regexes (Verdict/Rounds adjacency, `## Route upstream` heading) are unaffected.

### `skills/red-team/references/loop-budget.md`

- The same blank line inserted at the same spot in the fenced `## Route upstream` block
  template, keeping the two copies byte-identical.

## 5. Surface changes

- `skills/red-team/assets/red-team-gate.mjs` — `main()` default-deny argument check; CLI doc
  block mechanism rewrite.
- `skills/red-team/assets/red-team-gate.test.mjs` — rewritten file-mode row; new stdin-mode,
  typo'd-name, and rounds-only-zero rows; arm-1 union assertion; two blank-line doc-guard rows.
- `skills/red-team/references/lenses.md` — one blank line in the Route-upstream template.
- `skills/red-team/references/loop-budget.md` — one blank line in the fenced template.

No other surface. `skills/red-team/SKILL.md`, ADR 0045, and `skills/war-campaign/SKILL.md`
carry no claim about the refusal mechanism or the template's line spacing (verified by the §10
sweep at `6fff2ee`) and are untouched.

## 6. New domain terms (CONTEXT.md)

None. The change hardens existing constructs (the gate CLI's refusal contract, the
Route-upstream block) without introducing a new concept worth a glossary entry.

## 7. Recommended ADRs

None. ADR 0045 (loop budget / route upstream) documents the typed inputs and arithmetic, not
the flag-parsing mechanism, so it stays accurate as written; the refusal-mechanism claim lives
only in the module's own doc block, which this spec rewrites. No amendment, no new ADR.

## 8. Open risks / implementation notes

- **No sibling-group ordering dependency.** This group depends on no other survey group landing
  first — the survey manifest carries an empty upstream list for it, and all four files in the
  footprint are wholly owned here. The only ordering constraint is *internal*: T2 (gate +
  tests, including the blank-line guard rows) carries `deps: [T1]` (templates) per design
  row 9 — never same-wave, and never merged into one task (the two file sets are disjoint and
  the templates task must be independently green).
- **Stderr wording is a test-pinned literal.** Pick the refusal diagnostic once and pin the
  same substring in every new refusal row; keep it distinct from `not a non-negative integer`
  (the value-refusal substring) so the NAME and VALUE refusal channels stay separately
  greppable.
- **The rewritten file-mode row changes what it proves.** Its old title/assertion documented the
  accidental mechanism; after the rewrite the accidental path (positional scan grabbing the bare
  value) is unreachable — the explicit check fires first. Do not keep a second row asserting the
  ENOENT shape; it would pin dead behavior.
- **`runGate` harness compatibility.** Every existing fixture invokes only known tokens, so the
  default-deny check changes no existing row's outcome — re-run the full suite before and after
  to prove the identity (§10 criterion 7).
- **Doc-guard fragility.** The blank-line regexes must anchor on the `**Re-entry:**` token and
  a preceding empty line, not on surrounding prose bytes (anchor-fragility lesson); keep them
  tolerant of the line's tail text, which doctrine may reword.
- **Retirement-grep scope.** §10's retired-wording grep targets the exact phrase
  `refused by construction` — the replacement prose legitimately still mentions the positional
  scan (as the path-picking mechanism), so a wider token would false-red on sanctioned wording
  (lesson class `backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring`).
- **Close-condition citations.** #1347 requires each correcting change to cite the issue;
  commits for T1/T2 must reference #1366 and #1378/#1347 respectively.

## 9. Non-goals / deferred

- **No change to the pure arithmetic** — `routeUpstream`, `verdict`, `classify`,
  `resolveRoundInput`'s validation arms, and the coverage layer are correct as landed.
- **No both-inputs-required emission change and no `rounds: null` echo** — the partial-input
  emission shape is pinned deliberate behavior (constraint 5); F1's optional suggestion is
  recorded as superseded, not adopted.
- **No file-mode surplus-positional refusal** — a second bare path token after the first
  remains silently ignored [assumed: out of scope, no issue reports it — if wrong: a doubled
  path argument keeps being ignored, today's behavior].
- **No renderer-based Markdown validation harness** — the blank-line regex guard is the
  proportionate mechanism.
- **No `/war-campaign` or SKILL.md edits** — propagation to CAMPAIGN-STATE.md is by copying the
  fixed source template; the skill steps already prescribe only `=`-attached forms.
- **No reopening** of the landed phase-4 plan, its red-team report, or the audit dispositions
  that produced #1347.

## 10. Validation criteria

1. WHEN the gate is invoked in stdin mode with a space-separated flag value THE CLI SHALL
   refuse loudly (exit 1, stderr diagnostic, no verdict on stdout) · check:
   `printf '{"probeResults":[{"probe":"x","status":"fail","findings":[{"severity":"Critical","claim":"c"}]}]}' | node skills/red-team/assets/red-team-gate.mjs --stdin --rounds 3; echo exit=$?` — nonzero, stdout empty.
2. WHEN the gate is invoked in any mode with a typo'd flag name THE CLI SHALL refuse loudly
   with the same contract · check: `node --test skills/red-team/assets/red-team-gate.test.mjs`
   green including the new typo'd-name row.
3. WHEN the gate is invoked `--stdin --rounds=0` with no round-limit THE output SHALL carry
   `rounds: 0` and `routeUpstream: false` with `roundLimit` absent · check:
   `node --test skills/red-team/assets/red-team-gate.test.mjs` green including the rounds-only
   zero row.
4. WHEN `routeUpstream`'s open union is mutated to blockers-only (`const open = blockers`) THE
   suite SHALL go red · check: the arm-1 union assertion at rounds 1 / roundLimit 1 fails under
   the mutation (delete-and-trace, run locally; the committed assertion is the guard).
5. WHEN either Route-upstream template drops the blank line before `**Re-entry:**` THE
   doc-guard SHALL go red · check: `node --test skills/red-team/assets/red-team-gate.test.mjs`
   carries both blank-line rows; live shape:
   `grep -B1 '^\*\*Re-entry:' skills/red-team/references/lenses.md skills/red-team/references/loop-budget.md`
   shows a blank preceding line in both files.
6. WHEN the retired mechanism claim is swept THE module and suite SHALL show zero hits ·
   check: `grep -n 'refused by construction' skills/red-team/assets/red-team-gate.mjs skills/red-team/assets/red-team-gate.test.mjs`
   — zero hits. **Mandatory manual same-scope survey (grep is a floor):** after the grep,
   hand-scan the module's CLI doc block and every test title/comment in
   `skills/red-team/assets/red-team-gate.test.mjs` for prose still attributing space-separated
   refusal to the positional scan, and list each straggler as a survey-derived correction.
   Survey at spec time (`6fff2ee`): one straggler — the file-mode row title "the positional
   scan picks it as the results path", retired by design row 10.
7. WHEN a currently-valid invocation runs THE output SHALL be byte-identical to today's ·
   check: `node --test skills/red-team/assets/red-team-gate.test.mjs` — every pre-existing row
   (absent-input identity, round-limit-only pin, override row, reject set) green unmodified.
8. WHEN the refusal-mechanism claim is swept repo-wide THE only carriers SHALL be this group's
   files · check: `grep -rn 'space-separated' skills/ docs/adr/` — hits only in
   `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
   (new wording), and historical plans/reports. **Mandatory manual same-scope survey:**
   hand-scan `skills/red-team/SKILL.md` Steps 4–5, `skills/red-team/references/loop-budget.md`,
   `skills/red-team/references/lenses.md`, and ADR 0045 for refusal-mechanism prose the token
   misses; list stragglers as survey-derived corrections. Survey at spec time (`6fff2ee`):
   none — those surfaces prescribe only the `=`-attached forms and never state the mechanism.
9. WHEN the templates are compared THE two Route-upstream blocks SHALL remain byte-identical
   over their shared lines (Regrill / Agenda / bullet / blank / Re-entry — the guidance comment
   is lenses-only by design) · check:
   `diff <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/lenses.md) <(sed -n '/^\*\*Regrill:/,/^\*\*Re-entry:/p' skills/red-team/references/loop-budget.md)`
   — empty.
10. WHEN the correcting changes land THE commits SHALL cite their issues (#1378, #1347, #1366
    per task) and the redaction lint SHALL stay green · check:
    `node skills/_shared/war-memory.mjs lint docs/learnings/` — unaffected; this spec body
    carries no home paths, emails, or handles.
