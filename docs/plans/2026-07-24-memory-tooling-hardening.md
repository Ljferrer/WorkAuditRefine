# Memory tooling hardening — loud `--target` refusal, dialect-safe flag threading, seed-mode `--repo` render coherence, seed-pack scratch-dir hygiene

Source spec: `docs/specs/2026-07-24-memory-tooling-hardening-design.md` (survey 2026-07-24,
group `memory-tooling-hardening`, issues #1059 #1088 #1079 #1086 — #1088 subsumes #1059's
bare-flag case; every defect re-verified against the live tree at spec time and re-checked
against the working tree at drafting: the `cmdTightenPlan` truthy ternary, the SKILL.md
`${TIGHTEN_TARGET:+…}` fence, the seeding.md bare-render block, and seed-pack's
`process.exit`-based `die()` are all live as described).

## Commander's Intent

- **Purpose:** four code-verified defects in the memory tooling family produce plausible
  results at bounds the operator never asked for, or leak state. `tighten-plan`'s
  `--target` resolution has three independent silent-degradation paths — a non-numeric
  value collapses to the 17,000 B advisory as if the flag were never passed, a bare flag
  becomes `Number(true) === 1` and pre-selects **every** eligible lesson onto the
  `/lessons-learned tighten` strike list, and the SKILL.md fence's `${TIGHTEN_TARGET:+…}`
  threading drops the flag entirely under zsh (#1059 + #1088). seeding.md's `## Seed`
  Local-destination code block contradicts its own prose — copied literally it renders
  local-only and silently drops every `[repo]` row, the exact recorded known trap (#1086).
  And seed-pack's `die()` terminates via `process.exit` inside `try` regions, so `finally`
  cleanup never unwinds and scratch temp dirs leak under the OS temp root (#1079). Close
  all four with the smallest guards that make the failures loud or the cleanup certain.
- **Method:** bind each fix at its own boundary, never a shared one. #1059/#1088's guard
  lives at `cmdTightenPlan`'s argv boundary **only** — `parseArgv` is shared by every verb
  and its bare-flag→`true` mapping is relied on elsewhere (`archive --candidates`);
  `tightenPlan()`'s API, its `target = WARN_BYTES` default, and the #992 stricter-of
  verdict are frozen; invalid supplied `--target` refuses loud (exit 1, stderr names the
  received token, mirroring the existing `requireLocal` refusal idiom), absent flag keeps
  the default byte-identical. Both doc fixes use explicit per-branch commands — **no new
  `${VAR:+…}` flag-threading site anywhere** (the `:+` word-splitting divergence between
  bash and zsh is the root cause being retired; a `${REPO_ROOT:+…}` one-liner for #1086
  would re-import it). Doc-contract locks land present **and** absent: a seed-block-scoped
  `--repo` presence lock and a no-`:+`-threading absence lock on the tighten fence — both
  scoped so the evict-local-only lock and migration.md's two deliberately local-only
  renders stay untouched. #1079 replaces die-into-exit with a tagged throw and a **single**
  `process.exit` in `main()` after every `finally` has unwound — every exit code and every
  stderr byte identical as observed from a subprocess (the seed design spec's code map and
  `seed-pack.test.mjs`'s status + stderr-fragment assertions are the arbiter); the leak
  closure is proven by a TMPDIR-scoped subprocess test, red against today's `die()`.
  `cmdLint` behavior is untouched (the campaign's plan-5 gate wrapper spawns it from the
  same file); the realpath-normalized CLI-entry guards are untouched. Every edit site
  anchors by named construct, never line number; every grep sweep is a completeness floor
  backed by the spec's §8 hand-survey, whose dispositions are re-confirmed at
  implementation time.
- **End state:**
  1. **Invalid `--target` refuses loud:** `tighten-plan --local <fixture> --target` (bare),
     `--target abc`, `--target 0`, and a negative value each exit 1 with **asserted-empty
     stdout** (the mapped tests assert `stdout` is empty, not merely JSON-free) and a stderr
     diagnostic naming `--target` and the received token (the bare flag renders its token as
     `true`). Red today: the bare flag exits 0 with `target: 1, verdict: "warn"` and a full
     pre-selected strike list.
  2. **Valid and absent flags unchanged:** `--target 2000` prints JSON echoing
     `target: 2000`; the flagless invocation echoes `target: 17000`. The existing #992
     verdict tests, the cut-line test, and every other `tighten-plan` test stay green
     byte-untouched; `tightenPlan()`'s exported signature and `parseArgv` are untouched.
  3. **Tighten fence is dialect-safe:** the doc-contract suite passes with the existing
     `the step-1 tighten-plan invocation threads an operator-supplied --target` lock green
     against the rewritten fence **and** a new absence lock proving no `${…:+`-shaped token
     (the `\$\{[^}]*:\+` pattern, not the narrower `:+--` literal) remains in that fence
     **and** that the `TIGHTEN_TARGET` token is absent from the whole of SKILL.md (the
     set-then-thread prose is retired with the fence — a prose-only reintroduction is also
     a red); the rewritten step-1 fence carries both invocation variants (flagged with a
     literal byte figure, and bare) in **one** ```bash fence, with prose directing the
     agent to run exactly one of the two lines.
  4. **Seed-mode render coherence:** a new doc-contract lock, scoped to the `## Seed`
     Local-destination block (never whole-file — seeding.md has two
     `render-index --local "$MEM"` fences and the first is the repo-destination one),
     proves that block's fence carries the `--repo docs/learnings/` render variant; the
     `evict re-render is local-only — NO --repo` lock and migration.md's two deliberate
     local-only render lines stay green untouched.
  5. **Scratch-dir hygiene proven:** a new seed-pack test packs a valid seed dir, corrupts
     one manifest `sha256`, runs `verify` as a subprocess with `TMPDIR` pointed at a fresh
     test-owned scratch dir, and asserts exit 3 with the existing sha-mismatch stderr
     fragment **and** zero `seed-pack-*` entries remaining in that dir. Red today (the
     verify extraction dir survives the `process.exit`); green after the rework.
  6. **seed-pack contract byte-stable:** the entire existing `seed-pack.test.mjs` suite
     passes **unmodified** — every subprocess exit status (1/3/4/5 per the ratified code
     map) and every stderr fragment identical under the throw-based `die()`; `rankEvictions`
     and the realpath-normalized CLI-entry guard are byte-untouched.
  7. **Sweep clean:** the spec's `grep -rn ':+--' skills/ hooks/` returns zero matches on
     the task's tree after the change, **and** the broadened shape sweep
     `grep -rEn '\$\{[^}]*:\+' skills/ hooks/` (which also catches respellings like
     `${V:+ --target $V}` or `${V:+"--target=$V"}` that the `:+--` literal misses) returns
     only dispositioned hits; the done reports record every disposition — at drafting: the
     SKILL.md tighten fence (**fixed** by Task 1.2), the seeding.md bare-render block
     (#1086, invisible to any token grep — **fixed** by Task 1.2), migration.md's two
     `--repo`-less render lines (**cleared as deliberate** — evict path; do not "fix"),
     and `skills/war/assets/assert-issues-filed.sh`'s `${_phase_label:+…}` (**cleared** —
     a shebang-pinned bash script, never an operator-shell copy-paste fence; the dialect
     trap binds only prose fences executed in the operator's own shell).
  8. **Whole-surface green, no collateral drift:** `node --test 'skills/**/*.test.mjs'`
     passes; the Phase-1 diff touches no version slot, not `parseArgv`, not `tightenPlan()`,
     not `cmdLint`, no status enum, and no hook.
  9. **Release lands last:** all four version slots bump in lock-step to the next free
     patch above the live integration base at land time; `version-slots.test.mjs` (as it
     stands at land — the campaign's plan 5 extends it) is green.

## Build order (for /war)

1. **Phase 1 — Loud refusal + dialect-safe docs + scratch hygiene** (wave 1:
   1.1 ∥ 1.2 ∥ 1.3 — three file-disjoint tasks, no deps edges)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Loud refusal + dialect-safe docs + scratch hygiene

### Task 1.1: `tighten-plan --target` refuses invalid values loud (#1059 + #1088, CLI arm)

- Files: `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`
- Plan slice: **Guard (spec §4, design rows D1/D2):** in `cmdTightenPlan` in
  `skills/_shared/war-memory.mjs`, replace the truthy ternary
  (`const target = argv.target ? Number(argv.target) : WARN_BYTES;`) with an explicit
  three-way resolution at the argv boundary:
  - `argv.target === undefined` (flag never passed) → `target = WARN_BYTES` — the default
    path stays byte-identical in behavior.
  - Otherwise `const t = Number(argv.target)`; `Number.isFinite(t) && t > 0` →
    `target = t`.
  - Otherwise write a stderr diagnostic naming the flag and the received token — shape
    mirrors the existing `requireLocal` refusal idiom in the same file, in the spirit of
    `war-memory tighten-plan: --target requires a positive byte count (got '<token>')`
    (a bare flag renders the token as `true`, which is self-explanatory; the pinned tokens
    are `tighten-plan`, `--target`, and the received token) — and `process.exit(1)`.
    The refusal stays **inline** in `cmdTightenPlan` (an in-place `process.stderr.write` +
    `process.exit(1)`, exactly the `requireLocal` shape) — **never** Task 1.3's tagged-throw
    pattern imported or copied across files: `war-memory.mjs`'s `main()` has no catch, so a
    thrown refusal would surface as an uncaught exception with a stack trace instead of the
    clean diagnostic.
  Nothing else in the verb changes: `tightenPlan(records, { hits, target })`, the printed
  JSON shape, and the verb's header comment's #992 semantics all stay; extend that header
  comment with one line noting invalid supplied values refuse loud. **Blast-radius
  fences:** `parseArgv` is byte-untouched (shared by every verb; `archive --candidates`
  relies on bare-flag→`true` — spec §2); `tightenPlan()`'s exported signature and its
  `target = WARN_BYTES` default parameter are byte-untouched (#992 verdict semantics
  frozen); `cmdLint` and the `VERBS` dispatch table are byte-untouched — the campaign's
  plan-5 `war-memory-lint.test.sh` wrapper spawns `lint` against this same file, and the
  fail-closed redaction-lint exit contract is load-bearing.
  **Regression tests in `skills/_shared/war-memory.test.mjs`,** following the file's
  existing spawn-the-CLI idiom (the `spawnSync('node', [CLI, 'tighten-plan', …])` shape
  the hits-dedupe test already uses). **Rebase discipline (in-task, not just a roadmap
  note):** the campaign's plan 5 lands its lint-wrapper meta-tests in this same file
  first — after the worker's first-act rebase onto the integration tip, append the new
  cases as their own banner-commented block **immediately after the existing tighten-plan
  CLI test family, located by the existing test names** (the `hits (criterion 4)` and
  `cut line:` tests), never by file position or line number. The cases: four refusal
  cases — bare `--target` (the **mandatory** case; both issues name it), `--target abc`,
  `--target 0`, and a negative value — each asserting exit 1, **stdout asserted empty**
  (`assert.equal(r.stdout, '')` — no plan JSON means no bytes, not merely unparseable),
  and the stderr diagnostic naming `--target` and the received token; plus two
  unchanged-path cases — `--target 2000` exits 0 echoing `target: 2000` in the parsed
  JSON, and the flagless invocation exits 0 echoing `target: 17000`. Each case uses a
  small temp-dir fixture corpus per the file's `tmpDir()`/`lessonFile()` helpers. The
  refusal cases are red against today's ternary (the bare flag currently exits 0 with
  `target: 1`); the unchanged-path cases pin the guard's absent/valid arms.
- requiresTest: true — the four refusal cases and two unchanged-path cases land in
  `war-memory.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Dialect-safe fences + doc-contract locks (#1088 doc arm + #1086)

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/references/seeding.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: **Tighten step-1 fence rewrite (spec §4, design row D3):** in the `tighten`
  mode section of `skills/lessons-learned/SKILL.md`, rewrite step 1's prose and fence.
  Delete the `$TIGHTEN_TARGET` set-then-thread instruction entirely (the prose currently
  directing "set `$TIGHTEN_TARGET` … leave it unset …" — after this rewrite the
  `TIGHTEN_TARGET` token appears nowhere in SKILL.md; the new absence lock asserts that
  whole-file); the prose now says: run **exactly one** of the fence's two lines, never the
  fence wholesale — when the invocation or the operator's ask named a target, the flagged
  line with the **literal byte figure substituted for the placeholder**; otherwise the
  bare line. Add one sentence for the refusal path: if the flagged run exits 1 with the
  `--target` diagnostic (Task 1.1's guard), the byte figure was substituted wrong —
  correct it and rerun the preflight (the verb is read-only; nothing was staged or
  mutated). The fence shows two explicit invocation variants in **one** ```bash fence
  (the fence-lock coupling, spec §8: the doc-contract helper `bashFenceWith` resolves the
  **first** fence containing `tighten-plan` — splitting the variants into two fences
  could land the existing `--target` lock on a bare-variant fence): a target-named line
  `node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" tighten-plan --local "$MEM" --repo "$REPO_ROOT" --target <bytes>`
  (with a comment naming its condition; `<bytes>` is the operator's literal figure — the
  placeholder-deferred-to-agent pattern the repo already records as ratified
  ([[template-defers-runtime-values-to-agent-via-literal-placeholder]]); a fence line
  carrying a placeholder is acceptable to the doc-contract conventions because the locks
  pin tokens, never runnability, and the prose's run-exactly-one-line direction makes the
  placeholder line never-run-verbatim) and the bare line without `--target`. No shell
  parameter expansion tricks of any kind remain in the fence. The parenthetical
  explanation below the fence (defaults, stricter-of #992 semantics) is untouched, and
  both variants keep `--local "$MEM" --repo "$REPO_ROOT"` so every other lock on this
  fence stays green. **Post-rewrite verification duty:** confirm the rewritten step-1
  fence is still the *first* ```bash fence in SKILL.md containing `tighten-plan` (at
  drafting it is the only one — the other `tighten-plan` mentions are prose and
  frontmatter), so both the existing `--target` lock and the new absence lock adjudicate
  the intended fence.
  **Seed Local-destination block (spec §4, design row D4):** in the `## Seed` section of
  `skills/lessons-learned/references/seeding.md`, **Local destination** bullet, replace
  the single bare-render code block with a two-branch block matching the prose directly
  above it (which is already correct and stays): one line for the
  repo-learnings-dir-present case —
  `node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM" --repo docs/learnings/`
  — and one for the absent case (the existing bare render line), each introduced by a
  comment naming its condition. **No `${REPO_ROOT:+…}` one-liner** — that would re-import
  the exact dialect trap this plan retires (pivotal constraint, spec §2). The
  repo-destination bullet's fence above (which already carries `--repo docs/learnings/`)
  is byte-untouched.
  **Two new doc-contract locks in
  `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`** (design row D5),
  following the file's conventions (semantics not bytes, distinct needle per lock, a
  header comment naming the guarded construct). Placement: append under a **new task
  banner** naming this plan and its issues (the file's existing
  `// --- Task N.N (<plan-slug>, #issue): … ---` convention), continuing the file's
  `(N)` lock numbering at the **next free numbers resolved at implementation time** —
  never pinned here or in any count literal (the recorded banner-count trap). No other
  campaign plan touches this file.
  - *Seed-block `--repo` presence lock:* **the slicer is authored by this task** — the
    file's existing helpers are `lineWith`, `bashFenceWith`, and the seed-mode
    section-placement helper only; the spec's D5(a) "heading-slice helper the file
    already uses" citation names a construct that does not exist (the recorded
    plan-can-name-a-nonexistent-construct class; survey-derived correction, see Notes).
    Mechanism, fully specified: slice the loaded `seeding` text from the
    `**Local destination:**` bullet lead-in
    (`seeding.slice(seeding.indexOf('**Local destination:**'))` — assert the lead-in was
    found), then apply the existing `bashFenceWith(slice, 'render-index')`: the first
    render-bearing fence **after** the lead-in is the Local-destination fence by
    construction, since the repo-destination fence sits above the lead-in — no end-of-
    scope terminator needed. Assert that fence carries a `render-index --local "$MEM"`
    line bearing `--repo docs/learnings/`. **Red-today proof:** today that fence holds
    only the bare render, so the lock fails against the unfixed seeding.md and goes green
    with the two-branch block — a discriminating lock. **Never a whole-file
    `bashFenceWith(seeding, 'render-index')`** — seeding.md has two
    `render-index --local "$MEM"` fences and the first is the repo-destination one
    (which already carries `--repo docs/learnings/`), so an unscoped lock would pass
    vacuously against the wrong fence today and guard nothing. Scoped this way, the
    `evict re-render is local-only — NO --repo` lock (anchored in migration.md) and
    migration.md's two deliberate local-only renders are unaffected.
  - *No-`:+`-threading absence lock (two asserts, one lock):* (i) using the same
    `bashFenceWith(skill, 'tighten-plan')` extraction the existing `--target` lock uses —
    the two locks **co-target the same extraction**, so they can never silently diverge
    onto different fences — assert the fence matches no `${…:+` **shape**
    (`/\$\{[^}]*:\+/` failing the match — the shape, not the `:+--` literal, so respelled
    threading like `${V:+ --target $V}` or `${V:+"--target=$V"}` is equally red); and
    (ii) assert the whole `skill` text contains no `TIGHTEN_TARGET` token — the variable
    is retired entirely (D3), and this half also locks the **prose** against a
    reintroduced set-then-thread instruction that a fence-scoped assert cannot see.
    Both-ways proof: both asserts are red against today's SKILL.md (fence carries
    `${TIGHTEN_TARGET:+…}`, prose carries `$TIGHTEN_TARGET` at the step-1 instruction)
    and green after the rewrite; the existing `tighten-plan…--target` presence lock is
    green on both sides, proving the rewrite kept a flag-carrying line.
  **Sweep (spec §8 token sweep, this task's share — broadened):** run **both** greps and
  handle every match: the spec's `grep -rn ':+--' skills/ hooks/` (its floor; at
  drafting: exactly one hit, the SKILL.md tighten fence this task rewrites) **and** the
  broadened shape sweep `grep -rEn '\$\{[^}]*:\+' skills/ hooks/`, which catches
  respelled threading (`${V:+ --target $V}`, `${V:+"--target=$V"}`) the `:+--` literal
  misses. Broadened-sweep hits at drafting, dispositions to re-confirm: the SKILL.md
  tighten fence (**fixed** here) and `skills/war/assets/assert-issues-filed.sh`'s
  `${_phase_label:+…}` (**cleared** — a shebang-pinned bash script whose dialect can
  never vary; the trap this plan retires binds only prose fences an agent copies into
  the operator's own shell — do **not** "fix" it). **Mandatory hand-scan survey** (the
  greps are a floor, not a ceiling): re-scan the tighten-mode prose/fences of
  `skills/lessons-learned/SKILL.md` and the `## Seed` section of
  `skills/lessons-learned/references/seeding.md` for flag-threading or render invocations
  no token grep can see. Spec-time dispositions to re-confirm (record in the done
  report): the seeding.md bare-render block itself (#1086 — no `:+` token, same
  silent-drop outcome; **fixed by this task**), and `references/migration.md`'s two
  `--repo`-less render lines (**cleared** — the deliberately local-only evict path,
  guarded by the existing evict lock; do **not** "fix"). List any further stragglers as
  survey-derived corrections.
- requiresTest: true — both locks land in `lessons-learned-doc-contract.test.mjs`,
  satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: seed-pack tagged-throw termination + TMPDIR hygiene proof (#1079)

- Files: `skills/lessons-learned/assets/seed-pack.mjs`, `skills/lessons-learned/assets/seed-pack.test.mjs`
- Plan slice: **Termination rework (spec §4, design row D6):** in
  `skills/lessons-learned/assets/seed-pack.mjs`, `die(code, msg)` becomes a **throw** of a
  tagged error — a plain `Error` (or small subclass) carrying an `exitCode` property; the
  discriminator is the property, checked in **one** place. `main()` wraps the verb
  lookup + `fn(argv)` dispatch in `try/catch`: on the tagged shape it writes the message
  to stderr **preserving the existing ensure-trailing-newline logic**
  (`msg.endsWith('\n') ? msg : msg + '\n'` — no message may gain or lose a newline, spec
  §8) and calls `process.exit(exitCode)` **once**, after every `finally` has unwound; any
  untagged error rethrows unchanged (an engine bug must never masquerade as a contract
  exit). The unknown-verb refusal in `main()` routes through the same catch or sits
  before the `try` — either (no scratch dir exists at that point), keeping its exit-1 +
  message contract identical. **Termination mechanics ONLY — nothing else "improves":**
  the rework changes *how* a die-routed error reaches `process.exit`, never *what* the
  verbs do on the way there — no rollback semantics, no operation reordering, no new
  cleanup beyond what the existing `finally` blocks already do. In particular,
  `cmdEvict`'s pre-existing partial-write window (the seed tarball is rewritten before
  the archive `tarCreate` could still fail) is **out of scope and stays** — a worker
  adding rollback there would move observable behavior and break End state 6's
  byte-stability proof. **Every `die()` call site keeps its code and message
  byte-identical** — the observable subprocess contract (status + stderr) does not move:
  the ratified code map (1 = refusal/tar/fs via `EXIT_REFUSE`, 3 = verify mismatch via
  `EXIT_VERIFY`, 4 = pack cap via `EXIT_CAP`, 5 = evict archive cap via
  `EXIT_ARCHIVE_CAP`) and `seed-pack.test.mjs`'s subprocess `status` + stderr-fragment
  assertions are the arbiter. The three `finally`-cleaned scratch regions now actually
  unwind on a die-routed error: `cmdPack`'s tar-create staging dir, `verifyTier`'s
  per-tier extraction dir (the densest die-site cluster), and `cmdEvict`'s seed/archive
  tmp dirs. **Untouched surfaces:** the exported `rankEvictions` (which never dies), the
  `runTar` call sites' codes/messages, and the realpath-normalized CLI-entry guard (the
  `fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])` comparison — the
  RESOLVED cli-main-guard lesson; do not regress it). Side benefit to note in the commit
  body: when the module is imported by tests rather than run, a stray `die()` now throws
  instead of killing the test process — strictly safer.
  **Hygiene regression test in `skills/lessons-learned/assets/seed-pack.test.mjs`**
  (design row D7): one new test mirroring the existing
  `verify fails non-zero naming the member when a manifest sha256 is altered` case's
  fixture shape and the file's `run(args, opts)` spawn helper: pack a valid seed dir,
  corrupt one manifest `sha256`, then run `verify` as a subprocess with
  `env: { ...process.env, TMPDIR: <scratch> }` — the spread is load-bearing: a bare
  `env: { TMPDIR: … }` strips `PATH`, the system `tar` spawn fails, and the run exits 1
  via `runTar`'s refusal instead of the asserted 3 — where `<scratch>` is a **fresh
  test-owned scratch dir** (created and removed by the test itself, so a parallel
  `node --test` run never races another suite's temp entries — spec §8); assert exit 3
  with the existing sha-mismatch stderr fragment
  **and** that the scratch dir afterward contains zero entries with the `seed-pack-`
  prefix — **prefix-scoped, never directory-emptiness** (`os.tmpdir()` honors `TMPDIR` on
  POSIX, so the child's `mkdtemp('seed-pack-…')` lands inside the test-owned dir). This
  fails against today's `process.exit`-based `die()` (the `verifyTier` extraction dir
  survives) and passes after the rework — a genuinely discriminating red→green. The rest
  of the suite is byte-untouched (End state 6 runs it unmodified as the byte-stability
  proof).
- requiresTest: true — the deliverable includes the TMPDIR hygiene test in
  `seed-pack.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes shipped plugin assets (`war-memory.mjs` and
  `seed-pack.mjs` are shipped CLIs; `skills/lessons-learned/SKILL.md` and
  `references/seeding.md` are shipped skill prose) — users receive the fixes only via a
  release. Bump all four release slots together to the **next free patch above the live
  integration base at land time** (never a resolved semver literal — version literals in
  plans are non-authoritative): `plugin.json` `version`, `marketplace.json`
  `metadata.version` **and** `plugins[0].version`, and the `README.md` `## Status` line
  (replace-in-place, never emptied, no badge). The `version-slots.test.mjs` suite — as it
  stands at land, including whatever the campaign's plan 5 added to it — is the arbiter;
  a partial bump is a red lock-step test. Expected integration base: the campaign working
  branch tip after this plan's Phase 1 lands — this is plan 6 of 6, **last in the
  stack**, after land-advance-exit-contract-truth, runbook-and-standing-record-coherence,
  recovery-re-merge-dispatch-coherence, drift-guard-and-floor-diagnostic-hardening, and
  gate-evidence-and-release-integrity, each carrying its own trailing release bump, so
  the slot baseline at land time reflects however many of those releases have landed
  (stacked releases lag cumulatively — resolve the next free patch from the four slots
  **as they stand at land**, never from any plan's literal). Standalone fallback: a run
  through plain `/war` outside the campaign resolves the next free patch from the four
  slots itself. Release blurb describes the change precisely — **"invalid `--target` now
  refuses"** stated plainly (spec §8: the refusal is a behavior change at the CLI edge;
  anything scripting `tighten-plan --target <garbage>` previously got advisory-bound
  output and now gets exit 1 — the only in-repo caller is the SKILL.md fence this plan
  rewrites), plus: the tighten and seed doc fences are dialect-safe with no `${…:+`
  threading, the seed-mode local render keeps `[repo]` rows when the repo learnings dir
  exists, and seed-pack's error exits now unwind scratch-dir cleanup — **never** a claim
  that `parseArgv`, `tightenPlan()`'s API, `cmdLint`, the redaction-lint exit contract,
  or the seed-pack exit-code map changed.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- RESOLVED/MITIGATED stamps on the mined lessons backing #1088/#1079/#1086 · why
  deferred: spec §9 explicitly defers lesson-file updates to the standard
  servitor/aftermath convention — they are not part of the code change, and the backing
  lessons live in the local memory root, which task worktrees cannot see · runner: the
  servitor post-land (standing convention), backstopped by `/aftermath`'s evidence-gated
  cleanup.
- Shipped-seed verify under the reworked CLI — `node
  skills/lessons-learned/assets/seed-pack.mjs verify docs/seed` exits 0 on the landed
  tip · why deferred: the campaign's plan 1 re-packs `docs/seed/` and lands **before**
  this plan, so the meaningful check is the reworked verifier against the final shipped
  artifacts on the integrated tip, not a task-base snapshot · runner: the Lead at
  Phase-1 land (one command, read-only).
- Integrated-tip sweep re-check — re-run `grep -rn ':+--' skills/ hooks/` on the landed
  Phase-1 tip and re-confirm the two spec-time hand-scan dispositions · why deferred:
  Task 1.2 adjudicates at its own frozen base; a zero-matches claim (End state 7) is a
  property of the integrated tip after the serial merge queue, and an audit-time finding
  can be stale by land time · runner: the Lead at Phase-1 land, before dispatching
  Phase 2.

## Notes / conscious deviations

- **Decomposition:** the four issues decompose into three file-disjoint tasks — the spec's
  §8 sequencing note ("one CLI unit, one docs+locks unit, one seed-pack unit; nothing
  forces an order") maps exactly onto wave-1 parallel tasks. The only same-file pairings
  are internal to Task 1.2 (the two doc edits and the two locks that read them — one
  cohesive unit, per the rule that the guard travels with the fact it guards). No task
  consumes another's merged symbols → no deps edges. Release is its own trailing phase
  per the rule.
- **Campaign contention (for the roadmap table):** this is plan 6 of 6, **landing last**
  (ADR 0011 stack-and-plow; the later lander — this plan — owns rebase-by-named-anchor).
  Manifest `dependsOn`: empty (the spec records no sibling-spec ordering dependency); the
  campaign's strict landing spine still serializes all six plans, so every row below
  resolves by campaign order regardless.
  - `skills/_shared/war-memory.test.mjs` — **shared with plan 5**
    (`gate-evidence-and-release-integrity` Task 1.1 adds the lint-wrapper meta-tests to
    this file). This plan lands after plan 5; Task 1.1's worker's first act is a rebase
    onto the integration tip carrying those meta-tests, and its additions are new test
    cases **beside the existing tighten-plan CLI test family, anchored by the existing
    test names** (the hits-dedupe and cut-line tests), never by file position — disjoint
    test blocks, rebase-by-named-anchor, never a conflict of substance.
  - `skills/_shared/war-memory.mjs` — behavioral adjacency with plan 5 (its
    `war-memory-lint.test.sh` wrapper spawns this file's `lint` verb in every discovered
    gate — including the gates this plan's own tasks run under once plan 5 has landed).
    Task 1.1's diff is confined to `cmdTightenPlan` and its header comment; `cmdLint`,
    `parseArgv`, `resolveRoots`, and the `VERBS` table are byte-untouched, so the
    wrapper's evidence contract cannot move.
  - `skills/lessons-learned/assets/seed-pack.mjs` — behavioral adjacency with plan 1
    (`land-advance-exit-contract-truth` **runs** seed-pack for its seed-pair re-pack of
    `docs/seed/seed-manifest.json` + `seed.tar.gz`; it does not edit the CLI). **No
    ordering dependency in either direction — the roadmap's contention table should say
    so explicitly, so `/war-campaign` neither infers a false `dependsOn` edge from the
    run-vs-edit adjacency nor reorders into one.** Direction A (plan 1 first, the
    campaign order): plan 1 re-packs with the pre-rework binary; Task 1.3 changes
    termination mechanics only — the pack path's staging/tar/manifest output is
    byte-stable, and manifest content derives from the seed *members* (which plan 1
    edits), never from the CLI's internals — so plan 1's shipped artifacts stay valid
    and **no re-pack is owed**. Direction B (this plan first, e.g. standalone `/war`):
    plan 1's later re-pack simply runs the reworked binary — same output contract
    (manifest JSON shape unchanged; tarball bytes are never asserted, per the CLI's own
    BSD-tar note). The deferred shipped-seed verify backstop confirms the final pairing
    on the integrated tip.
  - `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, `SKILL.md`,
    `references/seeding.md`, `seed-pack.test.mjs` — touched by **no other campaign plan**
    (plans 2/4/5 touch `skill-doc-contracts.test.mjs`, a different file).
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` — shared
    with every campaign plan's trailing release phase; this plan is the **final** lander
    and re-resolves the next free patch from the slots at land.
- **No lesson edits in this plan — deliberate divergence from sibling campaign plans:**
  plans 1–5 stamp their mined `docs/learnings/` lessons in-task; this plan's backing
  lessons are deferred by its own spec (§9, "deferred to the standard servitor/aftermath
  convention") and live in the local memory root, so the plan carries no
  `docs/learnings/` files at all. The backstop row owns the follow-through.
- **Refuse-loud is a behavior change at the CLI edge (D1, ratified):** silent fallback
  was rejected because it preserves the exact complaint (a plausible result at a bound
  the operator did not ask for) for the NaN path. `tighten-plan` is a read-only verb —
  refusal costs nothing; the skill's preflight simply reruns with the corrected flag.
  The release blurb states it plainly (Task 2.1).
- **Guard placement (D2):** at `cmdTightenPlan`'s argv boundary, never `parseArgv` — the
  bare-flag→`true` mapping is shared by every verb and relied on (`archive
  --candidates`); a global rework would widen blast radius for zero benefit. No other
  war-memory verb takes `--target` (spec §9), so no other verb needs the guard.
- **Fence-lock coupling (D3, spec §8) and the first-fence rule (grill Q9):**
  `bashFenceWith` returns the *first* fence containing `tighten-plan`; both invocation
  variants stay in one fence so the existing `--target` presence lock and the new
  absence lock adjudicate the same fence — and because both locks consume the **same
  helper call on the same needle**, they co-target by construction and can never
  silently diverge onto different fences. The residual risk — a *future* edit inserting
  an earlier `tighten-plan`-bearing fence and retargeting both locks together — is the
  pre-existing fragility of every `bashFenceWith` lock in the file, not introduced or
  widened here; Task 1.2 carries the post-rewrite first-fence verification duty (at
  drafting the step-1 fence is the only `tighten-plan`-bearing fence in SKILL.md), and
  re-scoping the *existing* lock structurally is declined as outside this plan's
  footprint. The new seed-block lock is Local-destination-scoped for the mirror-image
  reason: an unscoped fence search would land on seeding.md's repo-destination fence
  (which already carries `--repo docs/learnings/`) and pass vacuously today — a lock
  that never goes red guards nothing.
- **Tagged throw over exit-hook registry (D6, ratified):** an exit-hook registry keeps
  two termination idioms alive, depends on hook ordering, and leaves the in-`try`
  `process.exit` anti-pattern in place for the next editor to copy. One throw shape, one
  catch, one exit. `die()`'s call-site codes and messages are byte-frozen; the
  ensure-trailing-newline logic moves into the single writer unchanged.
- **Exit-1 collision between `EXIT_REFUSE` and an untagged crash — pre-existing,
  accepted, unchanged (grill Q12):** Node's uncaught-exception exit is also 1, so a
  rethrown untagged error is numerically indistinguishable from a refusal by code
  alone — exactly as true today, where any non-`die` throw already crashes with exit 1.
  The catch distinguishes by the tagged `exitCode` property, and the *stderr* channels
  differ (clean contract message vs stack trace — a crash must look like a crash). No
  test asserts the collision in either direction; it is out of the ratified code map's
  contract and this plan deliberately does not touch it.
- **TMPDIR proof determinism (D7):** `os.tmpdir()` honors `TMPDIR` on POSIX; the test is
  deterministic — no sleeps, no platform sniffing, prefix-scoped assertion
  (`seed-pack-*` only, never directory emptiness) against a dir the test owns end-to-end.
- **Hand-mirror rule satisfied vacuously:** nothing here touches
  `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, `land-decision.mjs`,
  `workflow-template.js`, any status enum, or any hook — no inline mirror lands, so no
  mirror-registry row is owed.
- **No ADRs, no CONTEXT.md terms (spec §6/§7):** D1 extends an existing CLI refusal
  idiom; D6 is implementation hygiene. Rationale lives in the spec and code comments.
- **Release phase is a spec-omission correction (grill Q4):** spec §5's surface-changes
  table carries no version-slot row, but every §5 file is a shipped plugin asset — the
  trailing release phase is owed by the repo's own convention (release = its own
  trailing phase; a bump must move all four slots or it is a silent no-op). Phase 2
  corrects the omission; up to five stacked releases from plans 1–5 may be unlanded when
  this plan is drafted or dispatched, so the slot baseline lags cumulatively and Phase 2
  resolves the next free patch from the slots as they stand at land, never from any
  plan's literal.
- **Survey-derived correction to spec D5(a) (grill Q2):** the spec grounds the seed-block
  lock in "the heading-slice helper pattern the file already uses for mode sections", but
  `lessons-learned-doc-contract.test.mjs` has only `lineWith`, `bashFenceWith`, and the
  seed-mode section-placement helper — no reusable heading-slicer (the recorded
  plans-can-name-nonexistent-constructs class; reconcile toward the real catalog). Task
  1.2 therefore authors the slicer itself: `indexOf` on the `**Local destination:**`
  lead-in + the existing `bashFenceWith` over the slice — first render-bearing fence
  after the lead-in is the target by construction, red today, no new helper family.
- **Both new locks are discriminating today (red-today ledger):** the seed-block `--repo`
  lock fails against the current bare-render block; both halves of the absence lock fail
  against the current `${TIGHTEN_TARGET:+…}` fence and its set-then-thread prose. Locks
  that cannot go red at drafting guard nothing — these can, and Task 1.2's red→green
  ordering is the proof.
- **Anchors:** every edit site is named by construct — `cmdTightenPlan` and its truthy
  ternary, the `requireLocal` idiom, the tighten step-1 fence (located by
  `bashFenceWith`'s own needle), the `## Seed` section's **Local destination** bullet,
  `die()` / `main()` / `verifyTier` / `cmdPack` / `cmdEvict`, and existing test names —
  never line numbers (they rot across the serial merge queue).
- **Wording latitude is bounded by checkable floors:** the exact bytes of the refusal
  diagnostic (within its pinned tokens), the rewritten step-1 prose, the two branch-
  comment lines, the tagged-error shape (plain `Error` + `exitCode` property vs subclass),
  and all test names are the worker's — within each task's pinned tokens and End states.
  The spec's §4 command shapes are reference shapes, not byte mandates, except where a
  doc-contract lock pins the token (`--target`, `--repo docs/learnings/`, no `${…:+`).
- **Redaction:** no absolute home paths, emails, or handles in this plan, the rewritten
  fences, the test fixtures (temp-dir corpora built at runtime), or the release blurb.

## Open decisions

None — the spec's design tree resolved all seven rows (D1–D7); remaining latitude (exact
diagnostic wording within the pinned shape, the tagged-error class shape, branch-comment
wording, test names) is the worker's within the checkable floors stated per task.
