# Red-team report — 2026-07-26-auditor-guard-policy-and-mirror-truth

**Verdict: CLEARED** (after 4 blockers, 2 needsDecision, and 16 minors were patched into the
plan and re-verified; no residual open questions).

- **Plan:** `docs/plans/2026-07-26-auditor-guard-policy-and-mirror-truth.md`
- **Source spec:** `docs/specs/2026-07-26-auditor-guard-policy-and-mirror-truth-design.md`
- **Base:** `3885e9e` (`dev/2026-07-26-war-memory-cli-correctness` tip — plan 3 stacks per ADR 0011)
- **artifactKind:** impl-plan · **Run:** Workflow `wf_6e42ed29-278`, 15 agents, redteam config opus/high
- **Sandbox:** detached worktree at the base; escape guard clean (exit 0); post-run branch
  sweep clean (no probe-created refs).

## Attack surface / Executed proof

12 probes, 12 on-target, 0 dropped, 0 off-target: 6 spine lenses + 6 bespoke
(snippet-fidelity, baseline-repro, plus-widening-feasibility, d6-extraction-feasibility,
default-flip-old-absent, unguarded-new-mirror). 5 executed in throwaway sandboxes, 7 analyzed.
`ff-topology` not derived — the plan anchors no evidence on merge-commit topology (token grep
+ hand-read). Gate summary: 3 pass / 3 fail / 6 warn; every fail adversarially confirmed.

Key executed evidence:

- **Baseline green at base:** `bash hooks/validate-auditor-git.test.sh` and
  `node --test skills/war/assets/workflow-template.test.mjs` both green; no existing shell
  case payload sends `+`.
- **`+`-widening proven:** with the D1 one-character widening applied in a throwaway copy,
  `git blame -L 10,+5`, `git blame -L /deny/,+10`, and `git log -L 5,+3:<file>` all exit 0
  for `war-auditor` (the log/blame arms carry no per-flag policing; `-L` matches no
  post-subcommand deny pattern — code-traced); `git blame -L 1,+5; rm -rf .` still denies
  (chain denial unweakened); `git diff HEAD && git log` still denies with the byte-preserved
  forbidden-char prefix; the full existing suite passes with the widened set (no fixture flips).
- **D6 extraction proven implementable:** the two parenthesized groups parse to the expected
  15 tokens; the `(?<![\w-])<tok>(?![\w-])` boundary regex does the load-bearing
  discrimination (`-r` fails on a surface carrying only `--remotes`; `-v` rejects `-vv`),
  including on backtick-wrapped .md text.
- **Old-absent gate proven (drift-guard):** the planned backtick-tolerant absence regex REDs
  on a surface still carrying the retired sentence when only the other surface is rewritten,
  and matches both live byte variants.
- **Gate composes the shell suite (blocker evidence):** the ADR 0036 composition point
  (`resolveGate(plan.gate)` at `workflow-template.js:495`) appends the `*.test.sh` discovery
  loop; run in the sandbox it discovers and executes `./hooks/validate-auditor-git.test.sh`.

## Findings and resolutions applied (all patched in the plan)

1. **Major (×2 probes) — backstop premise false.** The plan deferred "shell suite green at
   land" on the claim that the refiner-dispatched gate artifact is JS-only, citing a lesson
   that is RESOLVED (#894) and archived. Reality: the composed gate runs the shell suite at
   every merge/land. **Resolution:** backstop bullet removed (the validation is
   gate-enforced, HARD); Notes **Gate** bullet rewritten to state the composition point, cite
   the lesson as archived history, and keep the worker in-worktree run as corroboration.
2. **Major + needsDecision (×2) — ADR 0029 vehicle self-contradicting and un-contracted.**
   The drafted in-place status note on the Considered-options entry contradicted the ADR's
   own appended-amendment precedent and its "superseded, never edited" convention, and no
   End state named the ADR edit. **Resolution:** vehicle re-adjudicated to an appended dated
   `## Amendment (2026-07-26)` section (Considered options byte-unchanged); Task 1.1(d),
   End state 4, and both Notes rows aligned; End state 4 now carries the acceptance clause.
3. **Minor (×3) — false uniqueness claim** ("the only deny site with no remediation hint";
   seven other hintless sites exist). Corrected at all four homes to measured-traffic scoping.
4. **Minor (×2) — D6 vacuous-pass hole** (locatable anchors + zero-token parse ⇒ silent
   green). End state 8 and Task 1.2(d) now mandate exactly-two-groups / non-empty-token-list
   assertions failing loudly.
5. **Minor (×3) — sweep enumeration wrong** (named match classes have zero base hits; the
   real sibling phrasing is inverted word order in an archived lesson). Tokens widened with
   the inverted forms; base hit-set enumeration corrected; archive/ path named.
6. **Minor (×3) — census miscount** ("three comment homes"; the fixed-string grep actually
   hits two comment homes + the live code line). Corrected; D1 still updates all three homes.
7. **Minor (×2) — J16 mis-attribution** (its `=-attached` reads the hook's stderr, not D4
   mirror wording). Intent Method and End state 11 corrected.
8. **Minor — Build-order under-enumeration** (Task 1.1's sanctioned coupling comment sits in
   the region called "byte-untouched"). Carve-out named; deny-string lines stay byte-untouched.
9. **Minor — D-letter namespace collision** (hook comments carry the 2026-07-22 spec's
   D-numbers). Coupling comment now qualified "2026-07-26 spec D6"; no renumbering.
10. **Minor — "only backtick differs" overclaim** (the full sentences differ in more ways).
    Scoped to the regex's matched span; fixtures must capture real surface bytes.

Re-verify pass (read-only) confirmed all ten resolutions against the patched plan plus the
live tree, and caught two straggler passages (the Notes ADR row still describing the old
vehicle; an unqualified uniqueness phrase in Purpose) — both fixed and re-checked.

## Backstop-legitimacy check

Section present. After patching, one entry remains — live-run denial-rate reduction:
deferral justified (unobservable pre-merge; no sandbox reproduces 30 seats' first-instinct
idioms), runner + timing named (`/war-review` on the next completed multi-seat run; Lead
files a `war-followup` issue at phase close). PASS. Heading is the operator-ratified plain
form — no AI-declared marker applies.

## Drift-guard spine probes

- `unguarded-new-mirror`: PASS (vacuous-true confirmed — the plan adds no new inline const
  mirror; D4 rewrites existing prompt prose in place and D6 itself is the drift guard).
- `default-flip-old-absent`: PASS executed — see Executed proof above.

## Residual risk

- The seven other hintless deny sites remain hintless by design (no measured traffic); if a
  future run shows turn-burn at one, that is a new spec, not a D3 gap.
- The `+` admission's live canary is this campaign's own subsequent audit seats (same
  accepted path as the 2026-07-22 widening).
- The plan's own body now contains the retired phrase in several correction passages — all
  under `docs/plans/`, outside End state 5's grep scope (`agents/`, `skills/`, `hooks/`).

## Adjudications

| # | Delta | Ruling | Route | Moment |
|---|-------|--------|-------|--------|
| 1 | Backstop "shell suite green at land" premised on a JS-only gate artifact | Premise false at base (ADR 0036 composition point; lesson #894 archived-resolved) — bullet removed; validation is gate-enforced HARD; worker in-worktree run kept as corroboration | Plan `## Deferred validations` + Notes **Gate** bullet | red-team grill, 2026-07-27 |
| 2 | ADR 0029 re-ratification vehicle: drafted in-place status note on the Considered-options entry (operator-ratified at the war-machine volley) | Vehicle re-adjudicated to an appended dated `## Amendment (2026-07-26)` section — preserves the ratified intent (dated ADR annotation) while honoring the ADR's appended-amendment precedent and "superseded, never edited" convention; Considered options byte-unchanged; End state 4 extended to contract it | Task 1.1(d) + End state 4 + Notes rows | red-team grill, 2026-07-27 |
| 3 | D6 fail-loud contract | Widened: exactly-two-groups + non-empty-token-list floor added (closes the locatable-but-zero-token vacuous pass) | End state 8 + Task 1.2(d) | red-team grill, 2026-07-27 |
| 4 | Retired-phrase sweep token set | Widened with inverted word order (`only =-attached read flag` family); base match-class enumeration corrected; archived-lesson path named | Task 1.2(e) | red-team grill, 2026-07-27 |
| 5 | "Only deny site with no remediation hint" | Corrected to measured-traffic scoping (seven other hintless, no-traffic sites exist) at all four homes | Header, Purpose, Task 1.1(b), End-state prose | red-team grill, 2026-07-27 |
