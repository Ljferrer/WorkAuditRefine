# Gate evidence and release integrity — the redaction lint rides the discovered gate, End-state ownership spans deps siblings, and the version guard gains a monotonic floor

Source spec: `docs/specs/2026-07-24-gate-evidence-and-release-integrity-design.md` (survey
2026-07-24, group `gate-evidence-and-release-integrity`, issues #1081 #1082 #1083 — all
`memory-mined` from code-verified lessons `gate-artifact-never-includes-war-memory-lint`,
`gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream`, and
`gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump`; every claim re-verified
live at spec time and re-checked against the working tree at drafting).

## Commander's Intent

- **Purpose:** three verified holes let a false "all green" survive the exact checkpoint built
  to catch it. The redaction lint runs only in post-push CI, so a plan End state citing it is a
  structurally SOFT cannot-confirm at every gate-audit — no captured gate artifact can ever
  carry the evidence (#1081). The gate-audit `endStateBlock`'s only ownership exemption is "a
  LATER phase", so a condition owned by a not-yet-landed `deps`-chained sibling task in the same
  phase reads as provably-UNMET-HARD against an upstream task that fully met its own slice — the
  recorded incident dodged the false hold only through auditor judgment (#1082). And the version
  guard is lock-step-only — a coherent all-four-slots revert passes every guard, which is
  exactly how a Gate-2 `docs(learnings)` commit staged from a stale publication worktree
  silently reverted a landed release (#1083). Close all three with the smallest wiring that
  makes the evidence real.
- **Method:** ride existing mechanisms, never extend composers or enums. #1081 becomes a thin
  gate-discovered `*.test.sh` wrapper beside the CLI — the gate's existing `-name '*.test.sh'`
  self-discovery picks it up with **zero engine change**; `resolveGate` and its
  `GATE_DISCOVERY_TOKEN` pairing (both hand-mirrored copies) stay byte-untouched, and CI keeps
  its triggers, steps, and permissions (header comment only). #1082 extends the existing case
  (3) ownership exemption to name both owners — later phase AND deps-chained sibling task —
  on **both prompt surfaces in one commit** (dispatched `endStateBlock` in
  `workflow-template.js`; standing `agents/war-auditor.md`), reusing the `out-of-scope` finding
  title token so the handoff `endState` status derivation and every downstream route are
  unchanged. #1083 lands three layers: a monotonic-floor test in `version-slots.test.mjs`
  (bounded first-parent window; fail-open ONLY on an unusable git context or a genuinely empty
  window — a non-empty log that parses to zero versions is RED, never a vacuous pass; the
  existing lock-step and prose-guard tests are load-bearing and not weakened), a Gate-2
  pre-push staged-file-list check in `skills/war/SKILL.md` (the commit's `--name-only` diff
  may contain only the promotion destination's subtree plus optionally `CLAUDE.md` — the
  root-cause check that catches EVERY stale-staged tracked file, not just the four slots)
  locked by a paired-anchor doc-contract row, and a behavior-(b) dirty-reuse refusal in
  `cmd_ensure_publication_worktree` that only ever refuses loudly (never reset, never destroy
  work; exits the EXISTING catalogued `$EX_WRONG_BRANCH` — the catalogue's own text classifies
  "a dirty tree we refuse to switch/remove" there; no new ADR 0034 constant, no bare numeric
  literal). Every new pin is a paired or ordered anchor tied to the clause it polices, never
  an independent presence-anywhere check; every edit site anchors by named construct, never
  line number; every grep sweep is a completeness floor backed by the spec's §4.4 hand-survey,
  whose six spec-time dispositions are re-confirmed at implementation time. Shell edits stay
  bash-3.2-safe and cwd-independent.
- **End state:**
  1. **Lint is gate-discoverable and green:** from the repo root, the gate's discovery clause
     (`find . -type f -name '*.test.sh'` with the `node_modules`/`.git`/`.claude` exclusions)
     lists `./skills/_shared/war-memory-lint.test.sh`, and
     `bash skills/_shared/war-memory-lint.test.sh` prints `lint: clean` and exits 0 on the live
     tree — so a refiner-captured gate log carries the `== gate(bash): … war-memory-lint … ==`
     banner and an End state citing the lint is CONFIRMABLE from the artifact.
  2. **Lint red path proven, wrapper never vacuous:** new meta-tests in
     `skills/_shared/war-memory.test.mjs` spawn the wrapper against (i) a fixture dir with one
     violating lesson → exit 1 AND the offending filename + pattern on stdout, (ii) a clean
     fixture dir → exit 0 and `lint: clean`, and (iii) a nonexistent target dir → non-zero
     exit with a message naming the missing path (the wrapper fails LOUD when its resolved
     target does not exist — a moved/renamed `docs/learnings/` must never print `lint: clean`
     forever); deleting the wrapper's CLI invocation (delete-and-trace) fails (i) RED.
  3. **Carve-out pinned on both surfaces, paired AND case-bounded:** `node --test
     skills/war/assets/workflow-template.test.mjs` green with ONE ordered regex per surface,
     each bounded inside the construct it polices — the prompt pin anchored from the literal
     case marker `(3)` through its own `NEVER a hold` terminal (never a whole-prompt
     `[\s\S]*` span), the `agents/war-auditor.md` pin anchored from the new bullet's
     `End-state ownership mapping` lead-in through its terminal hold clause — tying the
     deps-chained-sibling clause between the `LATER phase` owner and the never-a-hold clause;
     temp-break proof: removing the sibling clause from either surface alone fails exactly
     that surface's pin RED.
  4. **Carve-out behavior, both directions:** a new gate-audit case — a Nit finding titled
     with `out-of-scope` and owned-by-deps-chained-sibling rationale, `plan_ref` set to a
     claimed condition — yields handoff `endState` status `out-of-scope` and
     `landDecision: 'landed'`; a companion NEGATIVE case pins the derivation's arm order — a
     Critical finding whose rationale merely MENTIONS `out-of-scope` still derives status
     `unmet` and holds the land (severity is checked before the token); the existing
     later-phase out-of-scope case stays green unmodified, and cases (1)/(2) of
     `endStateBlock` are byte-untouched.
  5. **Monotonic floor:** the new `version-slots.test.mjs` test asserts the working tree's
     `plugin.json#version` is `>=` the max version observed in a bounded first-parent window of
     slot-touching history; green on the live tree; RED proven in a scratch fixture repo (a
     lock-step-coherent all-slots downgrade passes the lock-step test and fails the monotonic
     test naming both versions); fail-open boundary proven BOTH ways — the suite passes
     against a non-git directory copy (unusable context) AND a non-empty git log whose parse
     yields zero versions is RED, never a pass (a broken parse must not masquerade as an
     empty window); the existing extraction, lock-step, and README-prose tests are
     byte-untouched.
  6. **Gate-2 duty locked:** the `skills/war/SKILL.md` Gate-2 promotion flow carries the
     pre-push staged-file-list check — the committed docs commit's `--name-only` diff may
     contain only paths under the resolved promotion destination (default `docs/learnings/`)
     plus optionally `CLAUDE.md` (the pointer duty); ANY other path means stale tracked files
     were staged — with the do-not-push + remove-then-re-provision clause, positioned after
     the `docs(learnings): phase N` commit step and before the `ensure-origin` push step; a
     new `skill-doc-contracts.test.mjs` row locks it with ONE ordered paired anchor (the
     name-only probe token + the do-not-push clause in one match) that fails RED when either
     half is removed (temp-edit proof).
  7. **Publication-worktree refusal:** `cmd_ensure_publication_worktree` behavior (b)
     (registered + present + HEAD on the working branch) now runs the same
     `status --porcelain -uno` probe behaviors (c)/(d) use and FAILS LOUD on a non-empty
     result via the EXISTING catalogued `$EX_WRONG_BRANCH`, the message naming the
     stale-staging hazard and the `remove-publication-worktree` + re-provision remedy; a new
     P-family case in `provision-worktrees.test.sh` proves the refusal pinning the SPECIFIC
     exit code (6, `$EX_WRONG_BRANCH` — never merely non-zero; a crashed script also exits
     non-zero) AND the stderr hazard + remedy content; the existing clean-reuse case
     (untracked files never count) and fresh-create cases stay green; the ADR 0034
     exit-catalogue test stays green (no new constant, no bare numeric literal).
  8. **Records true:** the three origin lessons under `docs/learnings/` carry
     `MITIGATED (#1081):` / `RESOLVED (#1082):` / `MITIGATED (#1083):` description prefixes
     (compressed — the projection-budget impact is re-checked at the named deferred backstop,
     never gate-checked) and body notes naming the closing mechanisms; the
     `memory-audit.yml` header comment states CI is the post-push backstop and the discovered
     gate suite is the pre-merge enforcement (steps/triggers/permissions byte-identical);
     CLAUDE.md's Releasing sentence on `version-slots.test.mjs` also names the monotonic floor;
     the `schemas.md` `intent`-paragraph parenthetical and the two `workflow-template.js`
     header comments restating the single-owner exemption carry the sibling-task clause.
  9. **Sweeps swept:** every §4.4 grep (file-anchored, never repo-root) returns only
     post-change-accurate hits, and the six spec-time survey dispositions are re-confirmed
     with dispositions in the done reports.
  10. **Whole-surface green, no collateral drift:** `node --test 'skills/**/*.test.mjs'` and
      the anchored shell loop (`find hooks skills -name '*.test.sh'`) pass;
      `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0 over the edited
      lessons; the Phase-1 diff touches no version slot, neither `resolveGate` mirror, no
      status enum, and neither `HARD_ESCALATION_REASONS` nor `KNOWN_LAND_DECISIONS`.
  11. **Release lands last:** all four version slots bump in lock-step to the next free patch
      above the live integration base at land time; the full `version-slots.test.mjs` suite —
      now including the monotonic floor — is green.

## Build order (for /war)

1. **Phase 1 — Evidence wiring + ownership carve-out + release floor** (wave 1:
   1.1 ∥ 1.2 ∥ 1.3 ∥ 1.4 — four file-disjoint tasks, no deps edges)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Evidence wiring + ownership carve-out + release floor

### Task 1.1: Redaction lint becomes gate evidence — discovered wrapper + meta-tests + record truth (#1081)

- Files: `skills/_shared/war-memory-lint.test.sh`, `skills/_shared/war-memory.test.mjs`, `.github/workflows/memory-audit.yml`, `docs/learnings/gate-artifact-never-includes-war-memory-lint.md`
- Plan slice: **Baseline probe first (spec §8):** run
  `node skills/_shared/war-memory.mjs lint docs/learnings/` once at task start and confirm a
  clean baseline — a pre-existing violation would red every gate the moment the wrapper lands
  (that surfacing is the point; the remedy is the lint's own demote-to-local flow, but it must
  be a deliberate finding, not a surprise).
  **New wrapper `skills/_shared/war-memory-lint.test.sh` (spec §4.1, design row 1):**
  bash-3.2-safe, cwd-independent — resolve the repo root two directories up from the script's
  own location (the `skills/_shared/gh-preflight.test.sh` idiom: `cd "$(dirname "$0")" && pwd`,
  then up). Run `node <repo-root>/skills/_shared/war-memory.mjs lint <target>` where `<target>`
  is `$1` if given, else `<repo-root>/docs/learnings/`. The explicit target is load-bearing:
  bare `lint` falls back to the LOCAL memory root (`cmdLint`'s
  `const targets = paths.length ? paths : [resolveRoots(argv).local]`), which is never the
  intent here. **Existence guard (anti-vacuity — conscious deviation from spec §4.1's
  "no logic beyond path resolution", Notes):** the wrapper checks its resolved target
  directory exists and fails LOUD (non-zero, message naming the missing path) when it does
  not — `cmdLint`'s `catch { continue }` prints `lint: clean` exit 0 on an unreadable/absent
  target, so a moved/renamed `docs/learnings/` would otherwise make the gate evidence
  silently vacuous forever. On an existing target the exit code propagates untouched — the
  CLI is fail-closed on hits (exit 1, hits on stdout naming file + pattern). The optional
  target-dir override arg exists purely so the meta-tests can drive the red and missing-dir
  paths against fixtures (design row 3 — no absurd `*.test.test.sh` companion, no second
  gate-discovered file). Because the file matches the gate's discovery clause (`-name '*.test.sh'`, not under
  `node_modules`/`.git`/`.claude`), it runs in every refiner-dispatched gate (captured into
  `.war/gate-<taskId>.log` under a `== gate(bash): … ==` banner) and in the documented
  repo-wide shell loop (`find hooks skills -name '*.test.sh'`) — verify the discovery pickup
  with the End-state-1 find from the repo root. **No `resolveGate`/composer change and no
  floor-script vehicle** — `skills/war/assets/war-config.mjs` and both hand-mirrored copies
  stay byte-untouched (#1081's affected-files list named them; completeness ≠ correctness,
  spec §9).
  **Meta-tests in `skills/_shared/war-memory.test.mjs` (design row 3):** using the file's
  existing `spawnSync` + temp-fixture idiom, spawn the wrapper (via `bash`, absolute path)
  against (i) a fixture dir containing one violating lesson — a home-directory-shaped
  absolute path in the body — asserting exit 1 AND the offending filename + pattern on
  stdout; (ii) a clean fixture dir — exit 0 and `lint: clean` on stdout; (iii) a nonexistent
  target path — non-zero exit, message names the missing path (pins the existence guard).
  Fixture hygiene (redaction-safe by construction): every fixture dir lives under the test's
  own temp dir (`mkdtemp`), NEVER under `docs/learnings/`; the violating home-path shape is
  assembled at runtime inside the test (string construction, never a committed `.md` fixture
  file) so it can never trip CI or a future repo-wide sweep. All three discriminate: deleting
  the wrapper's CLI invocation fails (i) RED (End state 2's delete-and-trace); deleting the
  existence guard fails (iii) RED.
  **Record updates (same task):** reword the `.github/workflows/memory-audit.yml` header
  comment — "the only automated check on a hand-committed lesson…" now undersells coverage;
  state that CI is the post-push backstop and the discovered gate suite
  (`skills/_shared/war-memory-lint.test.sh`) is the pre-merge enforcement. Workflow `name`,
  `on`, `permissions`, and every step stay byte-identical (diff shows comment lines only).
  Prefix the `description` of `docs/learnings/gate-artifact-never-includes-war-memory-lint.md`
  with `MITIGATED (#1081):` and compress the remainder (descriptions, not bodies, drive
  projection bytes); add a short body note naming the wrapper file — the "CI-only" framing is
  now historical. The lesson edit must itself pass the very lint this task wires in.
  **Sweep (§4.4, this task's share):**
  `grep -n "CI-only\|only thing CI runs\|only automated check\|never appears in a captured gate" CLAUDE.md .github/workflows/memory-audit.yml docs/learnings/gate-artifact-never-includes-war-memory-lint.md skills/war/references/schemas.md`
  — no surface may still assert the lint cannot appear in gate evidence. Known survivor
  (spec-time disposition, re-confirm only, NO edit): CLAUDE.md's Commands comment "(exactly
  what CI runs — the only thing CI runs)" remains a true statement *about CI* — and CLAUDE.md
  is Task 1.3's file, never edited here. Hand-scan the swept files' same-scope comments for
  stragglers; dispositions in the done report.
- requiresTest: true — the deliverable IS a discovered test plus its meta-tests; the diff
  touches `war-memory-lint.test.sh` and `war-memory.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Within-phase End-state ownership carve-out — both prompt surfaces, one commit (#1082)

- Files: `skills/war/assets/workflow-template.js`, `agents/war-auditor.md`, `skills/war/references/schemas.md`, `skills/war/assets/workflow-template.test.mjs`, `docs/learnings/gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream.md`
- Plan slice: **Dispatched surface (spec §4.2, design row 4):** in the `endStateBlock` const of
  `skills/war/assets/workflow-template.js`, extend case (3) — currently
  `(3) a condition owned by a LATER phase is out-of-scope — record a Nit finding whose title contains "out-of-scope", NEVER a hold.`
  — so the ownership exemption names BOTH owners. Spirit (final wording is the worker's; the
  pinned tokens are `LATER phase`, the deps-chained-sibling clause, `out-of-scope`, and
  `NEVER a hold`, in that order):
  > (3) a condition owned by a LATER phase — or by a deps-chained sibling task of THIS phase
  > not yet landed at your audit's scope (map each numbered condition to the task slice that
  > owns it before scoring — read the plan at ${plan.file} in the checked-out tree for the
  > per-task Plan slice and deps edges) — is out-of-scope for THIS audit — record a Nit
  > finding whose title contains "out-of-scope", NEVER a hold.
  **Executability threading (self-decided, Notes):** the gate-audit prompt threads
  `acceptanceCriteria` but NOT the plan path today — the mapping instruction is only
  executable because the seat runs against the `_refinery` worktree where the plan file is
  checked out; interpolate the existing `plan.file` value (the `${plan.file}` idiom already
  used at the worker dispatch sites) into the case-(3) parenthetical so the seat needn't
  guess the path. `endStateBlock` has `plan` in scope; the criterion-11 tests build prompts
  through `runPhase` args that already carry `plan.file`, so the pins stay buildable.
  Cases (1) and (2) are byte-untouched; the `out-of-scope` title token keeps the handoff
  `endState` status derivation (the `rel.some(f => /out-of-scope/i.test(…))` arm) working with
  ZERO routing changes — do not touch it. It is ONE rule with two owners — extend case (3),
  never add a case (4) (design row 4: keeps the case count, the title token, the status
  derivation, and the existing pins' anchor order intact).
  **Standing surface, same commit (the split-surface discipline):** append one bullet to the
  `### \`execution-evidence\` gate-audit checklist (reserved lens)` section of
  `agents/war-auditor.md`, in the spirit of:
  > **End-state ownership mapping:** when the phase's End-state list spans `deps`-chained
  > tasks, map each numbered condition to the plan slice that owns it before scoring. A
  > condition owned by a later phase — or by a sibling task in this phase whose slice has not
  > yet landed at the pinned tip — is out-of-scope for the current task's audit: a Nit whose
  > title contains "out-of-scope", never a Critical/Major hold.
  **Comment/record sweep (same commit, spec §4.4 survey items 1–2):** the two
  `workflow-template.js` source comments restating the old single-owner exemption — the
  args-contract header comment's `phase.endState` annotation ("later-phase conditions are
  out-of-scope there, never a hold") and the `endStateClaims` const's header comment — plus
  the identical parenthetical in the `intent` args-contract paragraph of
  `skills/war/references/schemas.md`, all gain the sibling-task clause. Prefix the
  `description` of
  `docs/learnings/gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream.md`
  with `RESOLVED (#1082):` (compressed, budget-safe) and add a body note naming both edited
  surfaces.
  **Tests in `skills/war/assets/workflow-template.test.mjs`:** (a) extend the existing
  criterion-11 wording pin — the `case 3:` assertion inside the
  `end-state check rides the gate-audit prompt` test, currently
  `/LATER phase[\s\S]*out-of-scope[\s\S]*NEVER a hold/` — into ONE ordered regex that is
  **case-bounded**: anchored at the literal `(3)` case marker, lazy spans (`[^]*?`), and
  terminating on case (3)'s own `NEVER a hold` clause, requiring the deps-chained-sibling
  clause in between (a whole-prompt `[\s\S]*` span would let the tokens co-occur across
  unrelated prompt regions — the non-discriminating-anchor class this very spec polices;
  never two independent presence checks — dropping either owner must break the single pin);
  (b) add the same-shape bounded ordered pin against `agents/war-auditor.md` (`auditorMd` is
  already loaded at the top of the suite), anchored from the new bullet's
  `End-state ownership mapping` lead-in through its terminal hold clause — both surfaces,
  one drift guard each; (c) add one behavioral case beside the existing
  `end-state out-of-scope case (criterion 11)` test, mirroring its shape: a gate-audit finding
  titled `out-of-scope — owned by deps-chained sibling task` with `plan_ref` set to a claimed
  condition ⇒ handoff `endState` status `out-of-scope` and `landDecision: 'landed'` (never a
  hold); (d) add the NEGATIVE derivation case (End state 4): a Critical finding whose
  rationale merely mentions `out-of-scope` ⇒ status `unmet` and the land held — pinning the
  handoff derivation's arm order (the `severity === 'Critical' || 'Major'` arm is evaluated
  BEFORE the `/out-of-scope/i` title-or-rationale arm; a hold-severity finding must never
  silently derive `out-of-scope`). The existing later-phase fixture title stays accurate for
  its own case — add beside, never edit over (spec-time survey disposition 4).
  **Sweep (§4.4, this task's share):**
  `grep -n "later-phase\|LATER phase\|later phase" skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs agents/war-auditor.md skills/war/references/schemas.md skills/war/SKILL.md`
  — every hit either carries the sibling-task clause post-change or is verified
  out-of-scope-accurate as-is (file-anchored, never repo-root — the `.claude/worktrees/`
  stale-duplicate trap). Known survivors (spec-time dispositions, re-confirm only): ADR 0013
  decision point 6 needs NO edit — "provably unmet → HARD" stays accurate under the carve-out
  (an unlanded sibling's condition is not provably unmet by this task's landed content; design
  row 8 — no ADR edits anywhere); `skills/war/SKILL.md` hits are Task 1.4's file — report,
  never edit here. Dispositions in the done report.
- requiresTest: true — the paired pins and the behavioral case land in
  `workflow-template.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Monotonic version floor — lock-step ≠ monotonic (#1083, mechanical layer)

- Files: `skills/war/assets/version-slots.test.mjs`, `CLAUDE.md`
- Plan slice: **New test in `skills/war/assets/version-slots.test.mjs`** (name in the spirit
  of `version slots: the tip never moves backwards (lock-step ≠ monotonic)`), beside the
  existing three tests, which stay byte-untouched (they are load-bearing — extraction
  fail-closed, lock-step, and the README Releasing prose guard; spec §2). Mechanics
  (implementation latitude within these floors, spec §4.3): ONE bounded git invocation from
  the suite's existing `repoRoot` (e.g.
  `git log --first-parent -n 50 -p -- .claude-plugin/plugin.json` parsed for
  introduced/`+`-side `"version"` values, or an equivalent `rev-list` + `git show` walk capped
  at ≈50 slot-touching commits — never walk unbounded history, never spawn per-commit).
  Assert `readSlots()`'s canonical `plugin.json#version` (the working tree — same source as
  the lock-step test) is `>=` the maximum version observed in the window under numeric
  three-component semver comparison (a small local helper; no dependency). **Fail-open
  boundary (sharp, both ways — End state 5):** fail-open ONLY on an unusable git context —
  spawn failure, non-zero git exit, or EMPTY log output (no slot-touching commits in the
  window: shallow clone, fresh history) — each passing with a logged note; a git log that
  succeeded WITH non-empty output but whose parse yields zero `"version"` values is RED,
  naming the parse (a broken parse must never masquerade as an empty window — the vacuity
  hole the fail-open would otherwise open). Prove the open half by running the suite against
  a non-git directory copy. The assertion message names the incident class, the remedy, and
  the remedy OWNER: a Gate-2 commit staged from a stale verify worktree can revert a landed
  release while lock-step stays green — the Lead/operator restores the release-value slot
  files in a dedicated commit on the affected branch tip (never a parallel task-branch edit;
  slot files are release-class shared files), and the test stays red until that restore lands
  (detection with a built-in nag, design row 5). RED proof (End state 5): in a scratch
  fixture repo, commit a higher version then commit a coherent all-four-slots downgrade —
  the lock-step test passes, the monotonic test fails naming both versions; record the proof
  in the commit body (uncommitted probe evidence — gate-audit treats a resulting
  cannot-confirm as SOFT, recorded doctrine).
  **CLAUDE.md (same task):** extend the Releasing-paragraph sentence describing
  `version-slots.test.mjs` ("locks the four slots in lock-step…") to also name the monotonic
  floor (fail-open outside a usable git context), keeping the standing doc truthful.
  **Sweep (§4.4, this task's share):**
  `grep -n "lock-step" CLAUDE.md README.md skills/war/assets/version-slots.test.mjs docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
  — every characterization of the version guard must acknowledge the monotonic floor or
  remain true without it. Known survivor (re-confirm, NO edit): the README `## Status`
  blurb's "keeps all four version slots in lock-step" is release prose about the prior
  release — true without the floor, replaced wholesale by Phase 2's blurb anyway (and the
  recorded release-blurb-absence-guard trap says never let a status blurb trip a guard). The
  gate2 lesson file is Task 1.4's — report, never edit here.
- requiresTest: true — the deliverable IS the monotonic-floor test; the diff touches
  `version-slots.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Gate-2 pre-push re-read duty + publication-worktree dirty-reuse refusal (#1083, procedural + provisioning layers)

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`, `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
- Plan slice: **Procedural duty (spec §4.3 design row 7, probe strengthened — conscious
  deviation, Notes):** in the `skills/war/SKILL.md` post-servitor publication flow (Gate 2),
  insert ONE detection sentence positioned after the "Commit `docs(learnings): phase N` in
  the publication worktree" step and before the "Push via … `ensure-origin`" step (anchor by
  those step texts, never numbering), in the spirit of:
  > Before pushing, list the docs commit's staged file set in the publication worktree —
  > `git show --name-only --format= HEAD` — and confirm every path is under the resolved
  > promotion destination (default `docs/learnings/`) or is `CLAUDE.md` (the pointer duty):
  > ANY other path means stale tracked files were staged from a stale checkout (the recorded
  > incident staged stale version slots and silently reverted a landed release while
  > lock-step stayed green) — do **not** push; run `remove-publication-worktree`,
  > re-provision, and re-commit.
  The staged-file-list check is the root-cause probe: the incident mechanism is a bulk
  `git add` sweeping stale tracked files, so the check catches EVERY stale-staged file (a
  stale skill, hook, or slot alike), not just the four version slots — the spec's
  slot-re-read sentence detects only the slot instance of the class (Notes). The duty lives
  at the exact step that produced the incident — never a new standalone runbook section
  (design row 7).
  **Doc-contract lock:** add a new row to `skills/war/assets/skill-doc-contracts.test.mjs`
  (next free D-number at rebase time — plan 2 of this campaign adds rows to this file first;
  never hardcode the number in prose or assertion messages) whose anchor is PAIRED: one
  ordered match capturing the `show --name-only` probe token and the do-not-push clause
  together — never two independent presence checks; removing either half fails RED
  (temp-edit proof, End state 6). Follow the file's D-row conventions (header comment naming
  the guarded construct and issue, construct-anchored extraction).
  **Provisioning hardening (spec §4.3, design row 6):** in `cmd_ensure_publication_worktree`
  in `skills/war/assets/provision-worktrees.sh`, behavior (b) — registered + present + HEAD
  already on the working branch, currently "reuse untouched" with NO dirty check — gains the
  same `status --porcelain -uno` probe behaviors (c)/(d) already use; a non-empty result now
  FAILS LOUD via `die … "$EX_WRONG_BRANCH"` (conscious deviation from spec §2's
  default-generic-exit sentence, Notes: the catalogue's own EX_WRONG_BRANCH text already
  classifies "a dirty tree we refuse to switch/remove … the worktree is not in the state the
  operation requires", behaviors (d) and `remove-publication-worktree` dirty already exit 6
  for the same class, and the catalogue's SURFACING CONTRACT documents that no caller
  branches per-site — any non-zero is a HALT; still no NEW constant and no bare numeric
  literal, so the E-family census is untouched), the message naming the stale-staging hazard
  (tracked-file modifications in a reused publication worktree — a ref that advanced
  underneath, or leftover edits) and the remedy (`remove-publication-worktree`, then
  re-provision). Untracked files (the `.war-task` marker) still never count (`-uno`). Only
  refuse — never reset, clean, or switch away state (never-destroy-work; matching behaviors
  (d)/(f)'s posture). **Header comment amendments (same edit):** the "Structurally
  byte-for-byte mirrors cmd_ensure_refinery_worktree's six behaviors" sentence and the
  "staleness is the CAS retry's job, never this subcommand's" claim are both amended to
  record the deliberate divergence — ref-staleness remains the CAS's job; *working-tree*
  staleness is now this subcommand's refusal, publication verb only (the refinery counterpart
  is a recorded non-goal, spec §9 — `cmd_ensure_refinery_worktree` keeps today's six behaviors
  byte-untouched); update the behavior-list line for (b) accordingly. Note the header's
  existing "A dirty tree (tracked-file modifications) always FAILS LOUD" sentence was
  over-broad at this base (behavior (b) never checked) — this change makes it true; keep it.
  **New test case:** add a case to the P-family of
  `skills/war/assets/provision-worktrees.test.sh` (the
  `ensure-publication-worktree`/`remove-publication-worktree` block): a registered
  publication worktree on the working branch + one tracked-file modification ⇒ exit code
  pinned to the SPECIFIC `$EX_WRONG_BRANCH` value (6) — never merely non-zero (a crashed
  script also exits non-zero; the P.4 precedent's nonzero-only assert is the weaker form,
  the gh-preflight/validate-auditor-git CRITICAL ASSERTION DESIGN is the discipline) — AND
  stderr naming the hazard and the remove-then-re-provision remedy, AND the tracked
  modification still present afterward (nothing destroyed, the P.4 idiom). The existing
  reuse-on-branch case (which writes an UNTRACKED sentinel and must still exit 0) and the
  fresh-create case stay green, proving untracked-never-counts survives; the E-family ADR
  0034 catalogue assertions stay green (a catalogued constant, no bare numeric literal).
  **Record update:** prefix the `description` of
  `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` with
  `MITIGATED (#1083):` (compressed, budget-safe) and add a body note naming the three layers —
  the monotonic-floor test (defined-but-not-yet-emitted from this task's base; produced in
  Task 1.3, same phase — cross-link, not a dangling ref), the Gate-2 pre-push re-read duty,
  and the behavior-(b) refusal (both this task's own edits).
  **Sweep (§4.4, this task's share):**
  `grep -n "AS-IS AT THE LOCAL TIP\|staleness is the CAS\|byte-for-byte" skills/war/assets/provision-worktrees.sh skills/war/SKILL.md`
  — the publication-verb doctrine sentences must match the amended behavior (b); read each
  hit in full context (wrapped phrases — never trust a single-line grep of a full sentence).
  At drafting, `skills/war/SKILL.md` carries none of these tokens — expect hits only in
  `provision-worktrees.sh`; re-confirm at implementation. Also re-verify (spec §8) that the
  SKILL.md crash-heal pre-flight wording (`remove-publication-worktree` on a leftover
  `p*-publication`) still reads correctly now that a crashed Gate-2 leaving a DIRTY
  publication worktree refuses reuse where it previously reused silently — the heal path is
  the standing remedy and needs no change; confirm, don't edit.
- requiresTest: true — the deliverable includes the paired doc-contract row and the P-family
  refusal case; the diff touches `skill-doc-contracts.test.mjs` and
  `provision-worktrees.test.sh`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes shipped plugin assets (the gate-discovered lint wrapper and
  the hardened suites ship with the plugin; `workflow-template.js` and `agents/war-auditor.md`
  are shipped prompt surfaces; `provision-worktrees.sh` runs refiner-side in user installs;
  `skills/war/SKILL.md` is the shipped runbook) — users receive the fixes only via a release.
  Bump all four release slots together to the **next free patch above the live integration
  base at land time** (never a resolved semver literal — version literals in plans are
  non-authoritative): `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never emptied,
  no badge). The `version-slots.test.mjs` suite is the arbiter — a partial bump is a red
  lock-step test, and this bump is the FIRST to also pass under the new monotonic floor
  (ascending by construction; End state 11). Expected integration base: the campaign working
  branch tip after this plan's Phase 1 lands — this is plan 5 of the campaign, stacking after
  the land-advance-exit-contract-truth, runbook-and-standing-record-coherence,
  recovery-re-merge-dispatch-coherence, and drift-guard-and-floor-diagnostic-hardening plans,
  each carrying its own trailing release bump, so the slot baseline at land time reflects
  however many of those releases have landed (stacked releases lag cumulatively — resolve the
  next free patch from the four slots **as they stand at land**, never from any plan's
  literal). Standalone fallback: a run through plain `/war` outside the campaign resolves the
  next free patch from the four slots itself. Release blurb describes the change precisely:
  the redaction lint now rides the gate's existing `*.test.sh` self-discovery as a thin
  wrapper (pre-merge, captured in the gate log; CI unchanged), the gate-audit End-state
  ownership exemption names deps-chained sibling tasks on both prompt surfaces, and the
  version guard gains a monotonic floor plus a Gate-2 pre-push staged-file-list check and a
  publication-worktree dirty-reuse refusal — never a claim that `resolveGate`, any enum, any
  floor exit code, or CI behavior changed.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Captured-gate-banner confirmation — the full form of End state 1 ("a refiner-captured gate
  log carries the `== gate(bash): … war-memory-lint … ==` banner") is only observable in a
  real refiner-dispatched gate; the in-task proxy is the discovery `find` + a direct wrapper
  run · why deferred: Task 1.1's own audit precedes any gate that discovers the merged
  wrapper · runner: the Lead at Phase-1 land reads the phase's captured `.war/gate-<taskId>.log`
  from the serial merge queue (the wrapper is discovered from the first post-merge gate after
  Task 1.1 lands) and confirms the banner; mechanically re-confirmed by every subsequent gate.
- MEMORY.md projection budget re-check — after the three lesson `description` edits land,
  re-render and confirm the projection stays under the advisory byte budget · why deferred:
  `render-index` composes repo rows WITH the operator's local root (`--local` + `--repo`),
  which task worktrees and gates cannot see; descriptions were compressed, so the expected
  direction is shrinkage · runner: the Lead at the first Gate-2 promotion after land (the
  standing render-index step), or the operator via `/lessons-learned`.
- Integrated-tip sweep re-check — re-run the four §4.4 greps (as split across Tasks 1.1–1.4)
  on the landed Phase-1 tip and re-confirm the six spec-time survey dispositions · why
  deferred: the four tasks adjudicate at their own frozen bases; absence/accuracy claims (End
  state 9) are properties of the integrated tip after the serial merge queue, and an
  audit-time finding can be stale by land time · runner: the Lead at Phase-1 land, before
  dispatching Phase 2.

## Notes / conscious deviations

- **Decomposition:** the three issues decompose into four file-disjoint tasks — #1081 is one
  cohesive unit (wrapper + meta-tests + CI comment + its lesson), #1082 is indivisible (the
  both-surfaces-one-commit discipline binds `workflow-template.js`, `agents/war-auditor.md`,
  `schemas.md`, and the pins into one task), and #1083 splits along its file boundary into
  the mechanical layer (Task 1.3: `version-slots.test.mjs` + CLAUDE.md) and the
  procedural/provisioning layers (Task 1.4: SKILL.md + doc-contract row +
  `provision-worktrees.sh`/`.test.sh` + its lesson). All four are wave-1 parallel — no task
  consumes another's merged symbols, so no deps edges (the only cross-slice reference is
  prose: the gate2 lesson's body note names the monotonic test, annotated
  defined-but-not-yet-emitted / produced-in-Task-1.3 so the auditor cross-links rather than
  flagging a dangling ref). Release is its own trailing phase per the rule.
- **The wrapper vehicle is ratified — no engine change (design row 1):** the gate already
  self-discovers `*.test.sh` (ADR 0036); `resolveGate` in `war-config.mjs` and its hand-mirror
  in `workflow-template.js` (with the shared `GATE_DISCOVERY_TOKEN`) change for no one. Task
  1.1 verifies the discovery pickup rather than assuming it (the discovery loop IS the
  mechanism #1081 rides). A floor-script vehicle was rejected: a lint hit is a defect, not a
  routable omission — no fix-worker route wanted, and floor exit contracts (0/1/2) stay
  closed. Lint scope is directory-wide over `docs/learnings/`, matching CI's own rationale
  (simpler than diff-scoped and strictly stronger; design row 2). **Existence guard —
  conscious deviation from spec §4.1 (grill Q6):** the spec said the wrapper "adds no logic
  beyond path resolution" and inherits the CLI's fail-open on an absent directory; but
  `cmdLint`'s `catch { continue }` makes a moved/renamed `docs/learnings/` print
  `lint: clean` exit 0 forever — silently vacuous gate evidence, the exact failure mode
  #1081 exists to kill. The wrapper therefore fails loud on a nonexistent resolved target
  (three lines, pinned by meta-test (iii)); the CLI itself is untouched.
- **Case-3 extension, never case (4) (design row 4):** one rule — "a condition owned by
  someone else's not-yet-landed slice is out-of-scope for this audit" — with two owners.
  Extending case (3) keeps the case count, the `out-of-scope` title token, the handoff status
  derivation, and the existing pins' anchor order intact; zero downstream routing changes
  (the `met | unmet | deferred | out-of-scope` status enum in `schemas.md` is untouched).
- **No ADRs, no CONTEXT.md terms (spec §6/§7, design row 8):** #1081 is a new consumer of ADR
  0036's existing contract; #1082 refines the interpretation of ADR 0013's decision point 6
  without changing its provably-unmet standard (an unlanded sibling's condition is not
  provably unmet by the audited task's landed content — the ADR text survives unedited);
  #1083 is guard hardening plus a runbook duty. "Monotonic floor" stays a test-local phrase.
- **Monotonic window over parent-check (design row 5):** a tip-vs-`HEAD^` check goes green
  the moment any commit lands on top of the downgrade — the incident buried itself
  immediately (the successor stack was cut from the bad tip). The bounded-window max stays
  red until a restore commit returns the tip to the window max: detection-then-repair, one
  bounded git spawn, fail-open. Spec-time premise (re-verify at implementation): the live
  first-parent slot history is already monotonic, so the guard lands green. A deliberate
  version rollback (never yet done here; versions only ascend) would red the test until the
  slots are restored or the window slides — accepted friction; the assertion message says
  what to do. One canonical slot feeds the floor — the lock-step test already ties the other
  three to `plugin.json#version` (no per-slot monotonicity; spec §9).
- **Behavior-(b) refusal posture (design row 6):** refuse-only, never auto-reset (phantom
  "modifications" from a ref that advanced under the worktree are indistinguishable from real
  uncommitted edits without judgment — never-destroy-work). The refinery counterpart is a
  recorded non-goal (spec §9): extending the refusal to `cmd_ensure_refinery_worktree`
  interacts with the serial merge queue's legitimate in-flight state and deserves its own
  issue.
- **Behavior-(b) exit code — conscious deviation from spec §2 (grill Q13):** the spec said
  "die's default generic failure exit"; the plan uses the EXISTING `$EX_WRONG_BRANCH`
  instead, with a code trace: the catalogue's own EX_WRONG_BRANCH entry reads "a dirty tree
  we refuse to switch/remove (never destroy work) … Overloaded — halt-semantics identical:
  the worktree is not in the state the operation requires" — behavior (d) and
  `remove-publication-worktree`'s dirty refusal already exit 6 for exactly this class, so a
  generic 1 would split one class across two codes for no consumer (the catalogue's
  SURFACING CONTRACT: the refiner treats ANY non-zero as HALT; codes document dominant
  meaning, never a per-site branch — verified no caller branches on
  ensure-publication-worktree's code). Still satisfies the spec's real constraint: no NEW
  catalogue constant, no bare numeric literal, E-family census green. Bonus: the new
  P-family case can pin exit 6 specifically, which a crashed script cannot fake (exit 1
  can be).
- **Gate-2 duty probe — conscious deviation from spec §4.3's sentence (grill Q3):** the spec
  prescribed re-reading the committed tip's version slot; the plan's duty asserts the docs
  commit's `--name-only` file list instead (promotion-destination subtree + optional
  `CLAUDE.md` only). Strictly stronger at identical cost and position: the incident
  mechanism is a bulk `git add` sweeping stale tracked files from a stale checkout — the
  slot re-read detects only the slot instance of that class, the file-list check detects
  every instance (a stale skill or hook file staged the same way would silently revert code
  with no version tell at all). Self-contained too — no pre-commit value to remember. The
  design-row-7 decision (WHERE the duty lives, one sentence, paired-anchor lock) is honored
  unchanged; only the probe is upgraded (the plan-literal latitude rule: resolve toward the
  strongest checkable form). The doc-contract row anchors move to the `show --name-only`
  token accordingly.
- **Behavior-(b) dirty-reuse is reachable in the documented flow (grill Q2):** the Setup
  crash-heal pre-flight scans for leftover `p*-publication` worktrees only at a FRESH `/war`
  entry; within a run, Gate-2's push-failure path deliberately leaves the worktree in place
  for inspection ("retry once, then escalate"), and an in-session retry or
  escalation-resolution re-runs `ensure-publication-worktree` on the SAME path — behavior
  (b) reuse. That reuse surface is exactly the incident shape: the working branch advanced
  under the checked-out publication worktree (land-advance moves the follower ref), the
  stale working tree reads as phantom tracked-file modifications, and a bulk `git add` there
  stages old content. The `-uno` probe turns precisely that state into a refusal. The
  SKILL.md crash-heal wording needs no change (re-verified in the Task 1.4 sweep).
- **Directory-wide lint blast radius and the fix owner (grill Q1):** a `docs/learnings/`
  violation reds the gate of EVERY task merging after it exists — by design (the surfacing
  is the point). The fix is NEVER a per-task fix-worker edit (parallel task branches editing
  one shared lesson file is the same-file collision the decomposition rule forbids): the
  remedy owner is the Lead/operator, running the lint's own demote-to-local flow (or
  redaction) as ONE change on the integration branch, then resuming the queue — the same
  shared-file discipline as release slots. Within THIS plan's Phase 1 the exposure is
  bounded: the wrapper first enters gates at the serial merge after Task 1.1 lands, and Task
  1.1's baseline probe plus the drafting-time check (CI green on the default branch) make a
  pre-existing violation a deliberate, pre-dispatch finding.
- **Monotonic-red incident remedy is Lead-level (grill Q8):** if a future campaign is cut
  from a downgraded tip, the monotonic test reds every gate while no task may touch a slot
  file — the sanctioned remedy is the Lead/operator's dedicated restore commit on the
  affected branch tip BEFORE dispatching (or resuming) workers, exactly what the assertion
  message directs; fix rounds are never burned on it. Same shared-file remedy class as the
  lint bullet above.
- **Gate-audit mapping data (grill Q4):** the ownership-mapping instruction is executable
  because the gate-audit seat runs against the `_refinery` worktree (plan file checked out,
  read-only git available for landed-sibling probes) AND Task 1.2 interpolates the existing
  `plan.file` value into the case-(3) parenthetical so the path is threaded, not guessed —
  a prompt-text addition inside the same `endStateBlock` const the spec already edits, using
  the `${plan.file}` idiom the worker dispatch sites already use; no engine/schema change.
- **Campaign contention (for the roadmap table):** this is plan 5 of 6, stacking after plans
  1–4 (ADR 0011 stack-and-plow; the later lander owns rebase-by-named-anchor). Manifest
  `dependsOn`: plans 2, 3, 4.
  - `skills/war/assets/workflow-template.js` — shared with plan 3
    (`recovery-re-merge-dispatch-coherence`: three `submodMergeNote` appends at the retry
    re-merge dispatches + the `gateCaptureClause` comment rewrite). This plan's Task 1.2
    edits only the `endStateBlock` const and the two header comments named above — disjoint
    constructs; rebase-by-named-anchor, never a conflict of substance.
  - `skills/war/assets/workflow-template.test.mjs` — shared with plan 3 (dispatch-capture
    tests) and plan 4 (`FLOOR_SITE_RE` re-anchor + the `mirrored verbatim` absence lock).
    Task 1.2's edits are confined to the criterion-11 End-state block and one new behavioral
    case beside it — disjoint test blocks; the worker's first act is a rebase onto the
    integration tip carrying both plans' edits.
  - `agents/war-auditor.md` — shared with plan 4 (guard-contract intro sentence rework, and
    plan 4's new absence lock reads this file). **Plan 4 dropped spec-§4.4 byte-identity on
    that intro sentence (operator-ratified)** — Task 1.2's edit assumes nothing about those
    bytes: confirmed against plan 4's final Task-1.4 text, it appends one bullet to the
    `execution-evidence` gate-audit checklist — a different section entirely, and a
    different sentence family from plan 4's `## Read-only git guard contract` rework — and
    contains no `mirrored verbatim` text (so plan 4's
    `assert.doesNotMatch(auditorMd, /mirrored verbatim/i)` lock stays green). Pin shape
    (grill Q9): plan 4's auditorMd contribution is an ABSENCE assert, not a reusable
    presence-row shape; Task 1.2's pins use the suite's own native idiom for standing-card
    presence (`assert.match(auditorMd, …)` with ordered bounded regexes, the idiom the file
    already carries at its version-precedence and calibration blocks) — the D3-style
    both-surfaces registry row is for byte-shared token sets, which these two
    deliberately-different-format surfaces are not.
  - `skills/war/SKILL.md` — shared with plan 2 (`runbook-and-standing-record-coherence`).
    Task 1.4's insertion anchors on the Gate-2 promotion-step texts, never numbering;
    rebase-by-named-anchor over plan 2's landed edits.
  - `skills/war/assets/skill-doc-contracts.test.mjs` — shared with plan 2 (two new locks)
    and plan 4 (D18 rework). Task 1.4 appends one new row at the next free D-number resolved
    at rebase time — never hardcoded at drafting.
  - `skills/war/references/schemas.md` — shared with plan 2. Task 1.2 edits one parenthetical
    in the `intent` args-contract paragraph; rebase-by-named-anchor.
  - `skills/war/assets/provision-worktrees.sh` / `provision-worktrees.test.sh` — also touched
    by plan 1 (`land-advance-exit-contract-truth`, `provision-worktrees.test.sh`). No
    `dependsOn` edge (content-independent — different subcommand families, same files); the
    serialization owner is the roadmap's strict landing spine (all six plans land in
    campaign order, so plan 1 precedes this plan regardless), made visible by the
    contention-table row spec §2 mandates. Outside the campaign (standalone `/war`), ADR
    0011 still governs: the later lander — this plan — owns rebase-by-named-anchor, and
    Task 1.4's P-family addition anchors on case names, never positions.
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` — shared
    with every campaign plan's trailing release phase; each later lander re-resolves the next
    free patch from the slots at land.
- **Hand-mirror rule satisfied vacuously:** nothing here touches `HARD_ESCALATION_REASONS`,
  `KNOWN_LAND_DECISIONS`, `land-decision.mjs`, or any status enum — the
  canonical-plus-inline-mirror pair and its drift guard are untouched. No new inline mirror
  of a canonical export lands anywhere, so no mirror-registry row is owed (the §3 rule
  triggers on mirrors, not on prompt-text edits).
- **Version literals:** the spec's incident versions are historical data; this plan carries
  none, and Phase 2 states next-free-patch-at-land only.
- **Red/RED proofs are commit-body evidence where uncommitted:** Task 1.3's scratch-repo
  downgrade proof and non-git fail-open proof are in-memory/scratch probes recorded in the
  commit body (gate-audit treats a resulting cannot-confirm as SOFT, never a hold — recorded
  doctrine); Task 1.1's red path and Task 1.4's refusal case are different in kind — they ARE
  committed tests, red-by-construction against the pre-change behavior. Task 1.2's temp-break
  proof (remove the sibling clause from one surface, watch exactly that surface's pin red) is
  a commit-body-recorded temp edit.
- **Wording latitude is bounded by checkable floors:** the exact bytes of the case-(3)
  extension, the standing-card bullet, the Gate-2 duty sentence, the refusal message, the
  header-comment amendments, the CI header comment, the CLAUDE.md sentence, and all assertion
  messages are the worker's — within each task's pinned tokens, ordered-anchor pins, and End
  states. The spec's §4.2/§4.3 block quotes are reference shapes, not byte mandates.
- **Anchors:** every edit site is named by construct — const name (`endStateBlock`,
  `endStateClaims`), subcommand and behavior letter (`cmd_ensure_publication_worktree` (b)),
  section heading (the `execution-evidence` gate-audit checklist), step text (the Gate-2
  commit and push steps), test name (the criterion-11 family), and comment lead-in — never
  line numbers (they rot across the serial merge queue).
- **Redaction:** no absolute home paths, emails, or handles in this plan, the wrapper, the
  fixtures (the violating fixture constructs its home-path SHAPE inside the test), the lesson
  edits, or the release blurb; the edited lessons must pass the very lint Task 1.1 wires into
  the gate (End state 10).

## Open decisions

None — the spec's design tree resolved all eight rows; remaining latitude (exact wording of
the case-(3) extension, standing bullet, Gate-2 sentence, refusal message, comment
amendments, and assertion messages; the monotonic test's parse mechanics within the
one-bounded-spawn/fail-open floors) is the worker's within the checkable floors stated per
task.
