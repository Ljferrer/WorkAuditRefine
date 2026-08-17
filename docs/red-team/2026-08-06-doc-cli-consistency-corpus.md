# Red-team report — docs/plans/2026-08-06-doc-cli-consistency-corpus.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-16 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** master `94ea0cb` (plans 1–7 + the #1459 citation sweep all merged; no stacking — the plan-1 shape). Pre-launch the Lead caught its own repeat of the plan-7 harness error: local master sat at `f10ed0f` pre-fetch; fast-forwarded to `94ea0cb` and re-took the escape snapshot **after** the ff so the ref move is not a false delta.
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0
- **ff-topology:** derived **vacuous** — no merge-commit anchors.

## Attack surface / Executed proof

15/15 probes on target, 0 dropped, 0 off-target: 6 spine + 9 bespoke (`partition-census-mutation`,
`speccitations-carveout-fix`, `verb-rule-probe-resolution`, `context-budget-headroom`,
`posterity-corpus-coverage`, `endstate-command-diff`, `default-flip-old-absent`,
`unguarded-new-mirror`, `guard-split-deps-edge`). 8 executed in `git clone --no-hardlinks` sandboxes,
7 analyzed. All three mandatory ADR-0025 spine probes ran; none vacuous. 24 agents, 0 errors.

Gate accounting: **19 blockers + 9 needsDecision + 13 minors → 20 distinct roots**, all patched.

## The Critical — the plan's premise is false, and it would author the falsehood into doctrine

The plan's D6/D7/Non-goals/Purpose all assert the Spec-truth-guard mechanism **"was never emitted"**,
and would write that claim into `CONTEXT.md`'s supersession note and ADR 0046's Relationship row.

**Lead-verified from source at the base:** `skill-doc-contracts.test.mjs:27` reads *"Spec-truth guards
(D15–D17) read the ratified design specs directly"*, and rows D15/D16/D17 are **live**, reading
`docs/specs/2026-06-25-…` and `2026-07-12-…` files. #1358 finding 4's `git log -S` verification was
pinned at `5c2e7b3` — **before** the #804/#887 prose-drift waves landed those rows. The claim was true
when verified and is false now; landing it would put a false code-fact on two doctrine surfaces in a
plan whose stated purpose is doctrine coherence.

**Adjudicated — arm (a), reword only.** The supersession note now states the truth: emitted as
D15–D17 (locking prose-drift-**corrected** spec sentences); **not extended going forward** — ADR
0046's posterity rule supersedes the entry's growth premise, and the existing rows stay green and
harmless (frozen specs cannot rot, so the locks cannot drift). Arm (b) — retiring the live rows —
would break the plan's own Non-goal (`skill-doc-contracts.test.mjs` untouched) and delete green
guards; not elected. A same-line wording duty pins "superseded" + "ADR 0046" onto one physical line
so End state 8's check cannot false-red on a soft-wrap (the plan-6 ES8 class).

## Check defects (all proven by execution, all patched)

- **ES9 OLD-absent**: the 6-word needle `hand-enumerated list could not see` false-passes on a
  re-cased **and** a re-wrapped survivor (proved 0/0 on both). Now the single stable token
  `hand-enumerated`, case-insensitive (proved 0/1/1). Also **exit-code inverted**: `grep -c … = 0`
  EXITS 1 in the *succeeding* state, so the artifact recorded success as red — now `! grep -qiF`.
- **ES9 NEW-present**: case-sensitive + unscoped — false-reds a lowercase house-spelling row,
  false-greens with no Relationship row at all. Now section-scoped `sed` + `-ci`.
- **ES9 coverage**: the coupled-corpus wording also lives in the suite's own header (`over the same
  doc corpus`) which the ADR-scoped grep cannot see — a suite-scoped OLD-absent half added.
- **ES8**: the `-A8` proximity window false-negated (re-cased anchor, re-positioned note) and
  false-passed (a note with none of the supersession semantics). Now the semantics ride the matched
  line itself: `grep -i 'supersed' CONTEXT.md | grep -ci '0046'` ≥ 1.
- **ES3**: the 8 → 10 count false-greens on two *comment* lines with the transform fully reverted,
  and its verbatim command exits 0 at base. Now the suite run + fixture presence, count kept as floor.
- **ES4**: a bare `git diff` in the clean tip worktree prints nothing and exits 0 no matter what
  landed. Now the suite run (a flipped fixture reds it) + range-diff judged at phase close.
- **ES6**: the grep cannot tell **which** list `plan-interview.md` landed in — the exclusion list also
  satisfies census+suite+grep while defeating #1306. Now a positive
  `EVICTION_DESTINATIONS.includes(…)` suite assert.
- **ES7**: a bare nonzero exit proves the *hardcoded verb-sanity* test fired, not the verb rule (the
  sanity list reds first on the rename). The evidence is now the failing assertion's output naming
  `plan-interview.md`.
- **ES1**: the census had no tip-runnable committed pin (the mutation probes are SOFT done-report
  evidence). Now `VERB_SCAN_EXCLUSIONS` + `deepEqual` presence pins ride the check.
- **ES8/9/10 two-command pairs** fused — the land-barrier dispatch captures exactly one command per row.

## Coverage & scope roots

- **Purpose overstated ADR 0046**: the ADR contains no sentence naming the four-category corpus; its
  Decision names "skill doctrine surfaces" + README. Agent cards are this plan's **reasoned
  widening** — now attributed as such, not to the ADR.
- **The four sentinels prove membership, not derivation**: a hardcoded array containing those four
  paths passes all of them. The SKILL.md and agent-card slices now `deepEqual` their own
  `readdirSync` results (the D2 census idiom extended to the other two families).
- **`VERB_SCAN_EXCLUSIONS` reasons become a checked property** (ADR 0025): per entry (schemas.md
  export-collision carve-out excepted), assert `claimedVerbs(text, m)` is empty — CLI prose added to
  an excluded file reds the census instead of rotting.
- **Doc prose names constructs, never restates mechanics** (new D14 row): Task 1.2's CONTEXT.md terms
  and Task 1.3's guard bullet cite `EVICTION_DESTINATIONS`/`VERB_SCAN_EXCLUSIONS`/the census by name
  with the suite as maintained home — the plan-7 `makePlanEntry` precedent. Identifier-copy hedge:
  the Lead re-greps landed names at the checkpoint before closing #1358.
- **`EVICTION_DESTINATIONS` must be hoisted**: it is a `const` *inside* `skillDocs()`; a sibling
  `test()` referencing it un-hoisted throws `ReferenceError`. Hoist duty added to Task 1.1.
- **Note 4's enumeration corrected** (adr-doc-truth-sweep's `Files:` names 0030/0033/0025/0008 —
  0044 is read-only reference there).

## CONTEXT.md budget (probe result, surfaced not patched)

111,309 B at base vs the 111,616 advisory — **307 B of headroom**; Task 1.2's additions will re-cross
the advisory line. The hard line (126,976) is not approachable and End state 8 says the re-cross is
warning-only, which the probe verified against the budget suite's real behavior (WARN, no failure).
Surfaced to the operator: plan 6's eviction margin is spent two plans later; the cold home exists if
a future plan wants another eviction pass.

## Adjudications

| # | Adjudicated value | Supersedes | Provenance |
|---|---|---|---|
| 1 | Supersession wording = "emitted as D15–D17, not extended going forward" | "never emitted" (false at base) | AI-declared (2026-08-16), Lead-verified from source; arm (b) not elected |
| 2 | ES9 = fused, section-scoped, case-insensitive, exit-honest, + suite-header half | case-sensitive pair with inverted exit | AI-declared (2026-08-16), proven 0/1/1 |
| 3 | ES8 = semantics-on-matched-line + same-line wording duty | `-A8` proximity window | AI-declared (2026-08-16) |
| 4 | ES3/ES4 = behavior pins (suite run + fixture presence / range-judged) | line count / bare `git diff` | AI-declared (2026-08-16) |
| 5 | ES5 gains readdir `deepEqual` derivation pins; ES6 a positive `.includes()` assert; ES1 a census pin; ES7 flag-output evidence | membership greps / bare exits | AI-declared (2026-08-16) |
| 6 | `VERB_SCAN_EXCLUSIONS` reasons mechanically bound; D14 mirror-discipline row; hoist duty | hand-copied reasons / mechanics-restating prose / un-hoisted const | AI-declared (2026-08-16), ADR 0025 |
| 7 | Purpose attributes the agent-card widening to this plan, not ADR 0046 | "every doctrine surface ADR 0046 names" | AI-declared (2026-08-16) |

## Residual risk (13 minors, auto-noted)

- The advisory re-cross above — acknowledged, warning-only, operator-surfaced.
- ES2's mutation probes remain SOFT done-report evidence by design (uncommittable); ES1's new
  committed pins are the standing floor.
- The D15–D17 rows' tension with ADR 0046 is *recorded*, not resolved: they lock corrected sentences
  in frozen specs, which is stable — but a future spec-correcting wave would need to revisit.

## Verdict

**ADJUDICATED** — gate-emitted at rounds 1 of 3, `routeUpstream: false`, coverage whole (15/15).
All 20 roots patched in place and stamped `adjudicated: true`; none probe-re-verified. Every
rewritten check was executed at the base — all seven discriminating.
