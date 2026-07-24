# Memory tooling hardening — loud `--target` refusal, dialect-safe flag threading, seed-mode `--repo` render coherence, seed-pack scratch-dir hygiene

Date: 2026-07-24
Status: draft (Survey Corps) — awaiting /war-machine conversion

Issues addressed: **#1059**, **#1088**, **#1079**, **#1086** (the complete `memory-tooling-hardening`
survey group; no sibling-spec ordering dependency — `dependsOn` is empty).

## 1. Context — the gap / problem

Four code-verified defects in the memory tooling family — the `war-memory` CLI, the
`/lessons-learned` skill prose, its seeding reference doc, and the seed-pack CLI. All were
re-verified against the live tree while authoring this spec.

**#1059 + #1088 — `tighten-plan --target` silently collapses to wrong defaults.** These two issues
describe the same argv boundary and are resolved together (#1088 subsumes #1059's bare-flag case
and adds two more paths). `cmdTightenPlan` in `skills/_shared/war-memory.mjs` resolves the target
with a truthy ternary (`argv.target ? Number(argv.target) : WARN_BYTES`). Since #992 made the
returned `verdict` the stricter of the advisory read and `currentBytes >= target`, that line is
load-bearing for the preflight stop condition, and it has three independent silent-degradation
paths, none of which raises a diagnostic:

1. **Non-numeric value** (`--target abc`) → `Number('abc')` is `NaN` → the target comparison is
   inert → verdict silently falls back to the 17,000 B advisory, as if the flag were never passed.
2. **Bare flag** (`--target` at argv end or followed by another `--flag`) → `parseArgv` maps it to
   boolean `true` → `Number(true) === 1` → verdict is always `warn` and `cutIndex` runs to the
   entire eligible set — the `/lessons-learned tighten` step-3 strike list pre-selects **every**
   eligible lesson (reproduced live in #1059: `target: 1, verdict: "warn", cutIndex: 3` on a
   3-lesson fixture).
3. **Shell dialect**, at the doc layer: the step-1 fence in `skills/lessons-learned/SKILL.md`
   threads the flag as `${TIGHTEN_TARGET:+--target "$TIGHTEN_TARGET"}`. Bash word-splits the `:+`
   replacement into two argv words; zsh (no `SH_WORD_SPLIT` by default) does not, so the whole
   replacement arrives as one `--`-prefixed token, `parseArgv` keys it as garbage, and the flag is
   dropped entirely — same silent outcome as never setting the variable.

Blast radius is bounded (the strike list is operator-gated; archiving is a move, never a deletion,
per ADR 0015) — but an operator typo produces a plausible-looking result at a bound they did not
ask for, in either direction.

**#1086 — seeding.md's Seed local-render block contradicts its own prose.** In the `## Seed`
section of `skills/lessons-learned/references/seeding.md`, the **Local destination** bullet's prose
mandates passing `--repo docs/learnings/` iff `$REPO_ROOT` is non-empty, but the code block
immediately below shows only the bare `render-index --local "$MEM"` invocation — no `--repo`, no
conditional branch. Copying the block literally renders local-only and silently drops every
`[repo]` row from `MEMORY.md` when the repo learnings dir exists — the exact known trap the
project doc records for other call sites, already recurrent per the mined lesson. The doc-contract
test file locks `--repo`-carrying render lines elsewhere (Phase 5 housekeeping, Phase 5 archive)
but has no assertion scoped to this seed-mode block.

**#1079 — seed-pack's `die()` skips `finally` cleanup, leaking scratch temp dirs.** The `die()`
helper in `skills/lessons-learned/assets/seed-pack.mjs` terminates via `process.exit(code)`, which
never unwinds the stack. Every `die()`-routed error raised inside a `try` whose `finally` removes
a `mkdtempSync` scratch dir therefore leaks that dir under the OS temp root: the pack staging dir
(`cmdPack`'s tar-create region), the per-tier verify extraction dir (`verifyTier`'s extraction
region — the densest die-site cluster), and the evict seed/archive tmp dirs (`cmdEvict`'s
move region). Output correctness and the exit-code contract are unaffected — this is temp-file
hygiene — but the die-into-exit shape is a leak trap if the file is ever reused in a long-running
or automated context, and the mined lesson flags exactly that reuse hazard.

## 2. Pivotal constraints

- **seed-pack's exit-code + stderr contract is ratified and test-asserted.** The seed design spec
  fixes the code map (1 = refusal/tar/fs, 3 = verify mismatch, 4 = pack cap with ranked proposal,
  5 = evict archive cap), and `skills/lessons-learned/assets/seed-pack.test.mjs` asserts subprocess
  `status` values and stderr fragments throughout. The `die()` rework must keep every exit code
  and every message byte-identical as observed from a subprocess.
- **The doc-contract fence lock must stay green.** The test
  `doc-contract: the step-1 tighten-plan invocation threads an operator-supplied --target` in
  `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` finds the **first** ```bash fence
  containing `tighten-plan` (helper `bashFenceWith`) and requires a line matching
  `tighten-plan…--target` inside it. The SKILL.md fence rewrite must keep a flag-carrying
  invocation line in that same fence.
- **The evict re-render is local-only by design.** Doc-contract test
  `evict re-render is local-only — NO --repo` locks the deliberate `--repo`-less render in the
  evict clause; `references/migration.md` carries two more deliberately local-only render lines
  (eviction drops `[repo]` markers on purpose). The #1086 fix and its new lock must be scoped to
  the seeding.md `## Seed` Local-destination block only — a whole-file or whole-corpus assertion
  would collide with those legitimate local-only sites.
- **`parseArgv` is shared by every war-memory verb.** Its bare-flag→`true` mapping is relied on
  elsewhere (e.g. `archive --candidates`). The #1059/#1088 guard binds at `cmdTightenPlan`'s argv
  boundary, never inside `parseArgv`.
- **`tightenPlan()`'s API and the #992 verdict semantics are frozen.** The library function keeps
  its `target = WARN_BYTES` default parameter and the stricter-of verdict logic byte-identical;
  only the CLI-side resolution of `argv.target` changes.
- **No new `${VAR:+…}` flag-threading site may be introduced.** The `:+` replacement-text
  word-splitting divergence between bash and zsh is the root cause of #1088's path 3; resolving
  #1086 with a `${REPO_ROOT:+--repo docs/learnings/}` one-liner would re-import the exact trap
  this spec retires. Both doc fixes use explicit per-branch commands instead.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Invalid supplied `--target` (bare, non-numeric, zero/negative): silently fall back to `WARN_BYTES` (the lesson's sketch) or refuse loud? | **Refuse loud** — stderr diagnostic naming the received token, exit 1. Silent fallback would preserve the exact complaint (plausible result at a bound the operator did not ask for) for the NaN path; `tighten-plan` is a read-only verb, so refusal costs nothing and the skill's preflight simply reruns with the corrected flag. Absent flag keeps the `WARN_BYTES` default unchanged. |
| D2 | Where the guard lives: `parseArgv` vs `cmdTightenPlan`? | **`cmdTightenPlan`'s argv boundary.** `parseArgv` is shared by every verb (pivotal constraint); a global bare-flag rework would widen blast radius for zero benefit. |
| D3 | SKILL.md step-1 fence: keep `${TIGHTEN_TARGET:+…}` with a zsh warning, switch to array threading, or drop the variable? | **Drop `$TIGHTEN_TARGET` entirely** — the fence shows two explicit invocation variants in one ```bash fence (target-named: `… --target <bytes>` with the literal byte figure substituted; no target: the bare command). No shell parameter tricks remain, so no dialect can misparse it; the prose already offered literal substitution as the escape hatch. |
| D4 | seeding.md Local-destination block: `${REPO_ROOT:+--repo docs/learnings/}` one-liner or explicit branches? | **Two explicit branch commands** in the block (repo learnings dir present → `render-index --local "$MEM" --repo docs/learnings/`; absent → the bare local render), each labeled with its condition, matching the prose exactly. A `:+` fence is ruled out per the pivotal constraint. |
| D5 | Doc-contract locks: new-present only, or present + absent? | **Both.** (a) A seed-block-scoped presence lock: the `## Seed` Local-destination fence carries a `--repo docs/learnings/`-bearing render variant. (b) An absence lock on the tighten fence: no `${…:+` flag-threading token remains (guards regression to the dialect-fragile form). Scoping keeps the evict-local-only lock and migration.md untouched. |
| D6 | seed-pack `die()` rework: register scratch dirs for deletion in an exit hook, or throw a tagged error with a single exit in `main()`? | **Throw a tagged error.** `die(code, msg)` throws an error carrying the exit code; `main()` wraps the verb dispatch, catches the tagged shape, writes the message to stderr with the existing newline logic, and calls `process.exit(code)` **once**, after every `finally` has unwound. An exit-hook registry was rejected: it keeps two termination idioms alive, depends on hook ordering, and leaves the in-`try` `process.exit` anti-pattern in place for the next editor to copy. |
| D7 | How to prove the leak is closed? | **TMPDIR-scoped subprocess test.** `os.tmpdir()` honors `TMPDIR` on POSIX; the regression test spawns a failing seed-pack run (e.g. a verify with a corrupted manifest sha) with `TMPDIR` pointed at a test-owned scratch dir and asserts exit 3 **and** zero `seed-pack-*` entries remain in that dir afterward. Deterministic, no sleeps, no platform sniffing. |

## 4. Mechanics

**`cmdTightenPlan` target resolution (`skills/_shared/war-memory.mjs`).** Replace the truthy
ternary with an explicit three-way resolution at the argv boundary:

- `argv.target === undefined` (flag never passed) → `target = WARN_BYTES` (byte-identical default
  path).
- Otherwise `const t = Number(argv.target)`; if `Number.isFinite(t) && t > 0` → `target = t`.
- Otherwise write a diagnostic to stderr naming the received token — shape mirrors the existing
  `requireLocal` refusal idiom (`war-memory tighten-plan: --target requires a positive byte count
  (got '<token>')`; a bare flag renders the token as `true`, which is fine and self-explanatory) —
  and exit 1.

Nothing else in the verb changes; `tightenPlan(records, { hits, target })` and the printed JSON
shape are untouched.

**Regression tests (`skills/_shared/war-memory.test.mjs`).** CLI-level, following the existing
spawn-the-CLI pattern already used by the tighten-plan read-only test: bare `--target`,
`--target abc`, `--target 0`, and a negative value each exit 1 with the diagnostic on stderr and
print no plan JSON; a valid sub-advisory `--target` still prints `target` echoed in the JSON; the
flagless invocation still resolves `target` to 17,000. The bare-flag case is the mandatory one
(it is the case both issues name); the others pin the same guard's remaining arms.

**`/lessons-learned` tighten preflight fence (`skills/lessons-learned/SKILL.md`).** Rewrite step
1's prose and fence: delete the `$TIGHTEN_TARGET` set-then-thread instruction; the prose now says
to run the flagged variant with the operator's literal byte figure substituted when a target was
named, and the bare variant otherwise. Both variants live in the **same** ```bash fence so
`bashFenceWith(skill, 'tighten-plan')` keeps resolving to a fence whose flagged line satisfies the
existing `tighten-plan…--target` lock. The parenthetical explanation below the fence (defaults,
stricter-of semantics) is untouched.

**Seed local-destination render block (`skills/lessons-learned/references/seeding.md`).** In the
`## Seed` section's **Local destination** bullet, replace the single bare-render code block with a
two-branch block matching the prose it sits under: one line for the repo-learnings-present case
carrying `--repo docs/learnings/`, one for the absent case, each introduced by a comment naming
its condition. Prose above the block is already correct and stays.

**Doc-contract locks (`skills/lessons-learned/lessons-learned-doc-contract.test.mjs`).** Two new
assertions, following the file's existing conventions (semantics not bytes, distinct needle per
lock, section-scoped extraction):

- *Seed-block `--repo` lock:* extract the `## Seed` section (the heading-slice helper pattern the
  file already uses for mode sections), locate the Local-destination fence, and assert it carries
  a `render-index --local "$MEM"` line with the `--repo docs/learnings/` variant present. Scoped
  so the evict-local-only lock and migration.md's deliberate local-only renders are unaffected.
- *No-`:+`-threading lock:* assert the tighten-plan fence (same `bashFenceWith` extraction the
  existing lock uses) contains no `${…:+` token, pinning D3 against regression.

**seed-pack termination rework (`skills/lessons-learned/assets/seed-pack.mjs`).** `die(code, msg)`
becomes a throw of a tagged error (a small subclass or a plain `Error` carrying an `exitCode`
property — the discriminator is the property, checked in one place). `main()` wraps the verb
lookup + `fn(argv)` dispatch in `try/catch`: on the tagged shape it writes the message to stderr
(preserving the existing ensure-trailing-newline logic) and calls `process.exit(exitCode)`; any
untagged error rethrows unchanged. Every `die()` call site keeps its code and message
byte-identical — the observable subprocess contract (status + stderr) does not move. The
CLI-entry guard and the module's exported functions (`rankEvictions` — which never dies) are
untouched; when the module is imported by tests rather than run, a stray `die()` now throws
instead of killing the test process, which is strictly safer.

**Hygiene regression test (`skills/lessons-learned/assets/seed-pack.test.mjs`).** One new test per
D7: pack a valid seed dir, corrupt one manifest `sha256`, run `verify` as a subprocess with
`TMPDIR` set to a fresh test-owned scratch dir, assert exit 3 with the existing sha-mismatch
message **and** that the scratch dir contains no `seed-pack-*` entries afterward. This fails
against the current `process.exit`-based `die()` (the verify extraction dir survives) and passes
after the rework — a genuinely discriminating red→green.

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/_shared/war-memory.mjs` | `cmdTightenPlan` target resolution: explicit absent/valid/invalid three-way; invalid supplied `--target` refuses loud (exit 1, stderr names the token). |
| `skills/_shared/war-memory.test.mjs` | CLI-level regression tests: bare / non-numeric / non-positive `--target` refuse; valid and absent flags unchanged. |
| `skills/lessons-learned/SKILL.md` | Tighten step-1: retire `$TIGHTEN_TARGET` + the `:+` fence; two explicit invocation variants in one fence, literal byte figure substituted. |
| `skills/lessons-learned/references/seeding.md` | `## Seed` Local-destination code block: two explicit branch commands matching the prose (repo-present carries `--repo docs/learnings/`). |
| `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` | Two new locks: seed-block-scoped `--repo` render presence; no `${…:+` threading in the tighten fence. |
| `skills/lessons-learned/assets/seed-pack.mjs` | `die()` throws a tagged error; `main()` catches, prints, exits once — `finally` cleanup always unwinds. Codes/messages byte-identical. |
| `skills/lessons-learned/assets/seed-pack.test.mjs` | TMPDIR-scoped scratch-dir hygiene regression test on a failing verify. |

## 6. New domain terms (CONTEXT.md)

None. No new construct rises to glossary level; every change hardens an existing named surface.

## 7. Recommended ADRs

None. D1's refuse-loud choice is a CLI argv-boundary convention already consistent with the
existing `requireLocal` refusal idiom; D6 is an implementation-hygiene rework with no
architectural consequence. Rationale lives in this spec and the code comments.

## 8. Open risks / implementation notes

- **Refuse-loud is a behavior change at the CLI edge.** Anything scripting `tighten-plan --target
  <garbage>` previously got advisory-bound output; it now gets exit 1. The only in-repo caller is
  the SKILL.md fence this spec rewrites; the risk is nil, but the release notes line should say
  "invalid `--target` now refuses" plainly.
- **Fence-lock coupling.** `bashFenceWith` returns the *first* fence containing `tighten-plan`.
  Keep both invocation variants in one fence (D3) — splitting them into two fences could make the
  lock land on a bare-variant fence and go red, or worse, pass against the wrong fence later.
- **Byte-identity of seed-pack stderr.** The existing test suite asserts stderr fragments across
  many die sites. The rework routes messages through one writer; keep the
  `msg.endsWith('\n') ? msg : msg + '\n'` logic so no message gains or loses a newline.
- **The unknown-verb refusal** in seed-pack's `main()` must route through the same catch (or sit
  before the try — either is fine; no scratch dir exists at that point). Pick one and keep the
  exit-1 + message contract identical.
- **`TMPDIR` scoping in the hygiene test** must point at a directory the test creates and removes
  itself, so a parallel `node --test` run never races another suite's temp entries; assert on the
  `seed-pack-` prefix only, not directory emptiness.
- **Token sweep (floor, not ceiling).** Implementation re-runs `grep -rn ':+--' skills/ hooks/`
  and handles every match (at spec time: exactly one — the SKILL.md tighten fence). **Mandatory
  survey note:** after the grep, hand-scan the same-scope prose and fences of
  `skills/lessons-learned/SKILL.md` (tighten mode) and
  `skills/lessons-learned/references/seeding.md` (`## Seed`) for flag-threading or render
  invocations the token grep cannot see. The spec-time survey found two stragglers the grep
  misses: the seeding.md bare-render block itself (#1086 — no `:+` token, same silent-drop
  outcome) and `references/migration.md`'s two `--repo`-less render lines, which the survey
  **cleared** as the deliberately local-only evict path (do not "fix" them). List any further
  stragglers found at implementation time as survey-derived corrections.
- **Sequencing within the group is free.** The four fixes touch disjoint constructs; the only
  same-file pairing is the two doc-contract locks (one test file) and the two SKILL/seeding doc
  edits feeding them — natural to land as one docs+locks unit and one CLI unit and one seed-pack
  unit, but nothing here forces an order.

## 9. Non-goals / deferred

- **No `parseArgv` change** — the bare-flag→`true` mapping is shared by every verb and relied on
  (e.g. `archive --candidates`); the guard binds per-verb.
- **No `tightenPlan()` API change** — the library default and #992's stricter-of verdict are
  frozen; this spec only hardens the CLI argv boundary above it.
- **No target validation for other verbs** — no other war-memory verb takes `--target`.
- **migration.md render lines untouched** — deliberately local-only (eviction drops `[repo]`
  markers by design; existing doc-contract lock).
- **No dedicated seed-pack exit code for tar/fs failures** — the seed design spec's code map
  stays as-is; this spec changes termination mechanics, not the contract.
- **Lesson-file updates** (RESOLVED stamps on the three mined lessons backing #1088/#1079/#1086)
  — deferred to the standard servitor/aftermath convention, not part of the code change.

## 10. Validation criteria

1. **Bare `--target` refuses:** `tighten-plan --local <fixture> --target` exits 1, prints no plan
   JSON, and stderr names `--target` and the received token; likewise `--target abc`,
   `--target 0`, and a negative value. (Red today: the bare flag currently exits 0 with
   `target: 1, verdict: "warn"` and a full pre-selected strike list.)
2. **Valid and absent flags unchanged:** `--target 2000` prints JSON echoing `target: 2000`; the
   flagless invocation echoes `target: 17000`. Existing #992 verdict tests and the cut-line test
   stay green untouched.
3. **Tighten fence is dialect-safe:** the doc-contract suite passes with the existing
   `--target`-threading lock green against the rewritten fence **and** the new absence lock
   proving no `${…:+` token remains in it.
4. **Seed-mode render coherence:** the new seed-block-scoped doc-contract lock proves the
   `## Seed` Local-destination fence carries the `--repo docs/learnings/` render variant; the
   evict-local-only lock stays green (its `--repo`-less render is untouched).
5. **Scratch-dir hygiene:** the new seed-pack test runs a failing `verify` with a test-owned
   `TMPDIR` and asserts exit 3 plus zero `seed-pack-*` entries remaining. (Red today: the verify
   extraction dir survives the `process.exit`.)
6. **seed-pack contract byte-stable:** the entire existing `seed-pack.test.mjs` suite passes
   unmodified — every exit status and stderr fragment identical under the throw-based `die()`.
7. **Sweep clean:** `grep -rn ':+--' skills/ hooks/` returns zero matches after the change, and
   the implementation's survey note (per §8) records each hand-scan straggler and its disposition.
8. **Whole suite green:** `node --test 'skills/**/*.test.mjs'` passes.
