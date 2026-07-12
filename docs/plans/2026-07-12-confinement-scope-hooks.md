# Confinement scope-hook narrowing — widen worker Bash-write detection, anchor the servitor write glob and agent-type arms

Source spec: docs/specs/2026-07-12-confinement-scope-hooks-design.md
Issues addressed: #809, #810

## AI-Commander's Intent

- Purpose: Narrow two consciously-ratified confinement residuals (ADR 0002) without changing the ratified
  posture — the worker's advisory-only Bash-write detector gains relative-target and interpreter-payload
  coverage (#809), and the servitor write glob plus all six agent-type case arms gain anchor precision
  (#810). Detection coverage and anchor precision move; the fail-open refiner/main arm, the warn hook's
  always-exit-0 contract, and the deferred per-run anchoring all stay exactly as ratified.
- Method: Hook-side-only changes across the four `hooks/*.sh` guards and their same-file test siblings
  (same commit as their hook, bash-3.2-safe, cwd-independent). No engine changes — the spec rejects
  touching `skills/war/assets/workflow-template.js` or `hooks/hooks.json`; the sole agents-file edit is
  a one-string doc-accuracy update in `agents/war-servitor.md` (conscious deviation from spec §5 —
  verified to have no dispatched-prompt mirror). Every narrowing uses only the channels a hook process
  reliably sees: `$HOME` (always via `${HOME:-}`, trailing-slash-normalized), `$CLAUDE_PROJECT_DIR`,
  and the payload's `.cwd` / `.agent_type` / `.tool_input` fields. Relative-target capture is widened
  ONLY in the redirect extraction (the spec's motivating case); all other extractors stay
  absolute-only as a documented ceiling. Every anchoring narrowing pairs its trailing-junk
  no-longer-captures case with an exact-live-shape still-captures case (default dispatched string
  `work-audit-refine:war-<role>`, source-derived from `workflow-template.js`'s `NS` constant), and
  every silent test case names a firing twin on the same code path (delete-the-feature discipline).
  One-time grep sweeps are converted into standing conventions in `hooks/guard-conventions.test.sh`.
  Decision records (ADR 0002 addendum, learnings narrowing note) land in the same plan, final wave.
- End state:
  1. `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done` passes,
     including every new case added by this plan.
  2. `grep -cE 'exit 2|deny' hooks/warn-bash-write-scope.sh` reports 0 and the script's final line is
     still `exit 0` — advisory posture provably unchanged, owned as a STANDING grep case inside
     `hooks/warn-bash-write-scope.test.sh` (not a one-time hand check; the hook's three early
     `exit 0`s are fine — the assertion is zero deny-routes, not one exit statement).
  3. `grep -n '\*war-[a-z-]*\*' hooks/*.sh` (excluding `*.test.sh`) returns zero matches — all six
     agent-type arms suffix-anchored (`*war-<role>`); the same zero-match assertion is a STANDING
     convention case in `hooks/guard-conventions.test.sh` (offending literal assembled via printf in
     fixtures, never scannable in the lint file itself); the manual survey has also fixed the known
     prose stragglers (the SCOPE paragraph in `warn-bash-write-scope.sh`'s header, the purpose comment
     near the top of `validate-auditor-git.sh`, ADR 0002's policy-table prose) plus any further
     stragglers found in hook headers, same-file case arms, and `hooks/*.test.sh` titles/comments.
  4. `grep -rn '\*/\.claude/projects/\*/memory/\*' hooks/ docs/adr/0002-scope-by-agent-type.md` — every
     remaining hit is one of exactly TWO sanctioned survivors: (a) the documented `HOME`-unset/empty
     fallback branch in `validate-worktree-scope.sh`, and (b) the classifier glob in
     `validate-servitor-provenance.sh` (a content-gate classifier, deliberately left unanchored —
     broader capture means MORE provenance enforcement, fail-safe — with an in-file comment saying so).
     A STANDING convention case in `hooks/guard-conventions.test.sh` asserts the unanchored glob
     appears in no other `hooks/*.sh` file. The manual survey has also checked the servitor
     deny-message string, the `#58 resolution` comment block, and `hooks/validate-worktree-scope.test.sh`
     case titles for the unanchored shape written in prose.
  5. Servitor arm behavior, all proven by HOME-pinned cases in `hooks/validate-worktree-scope.test.sh`
     via a new `run_home` helper: shape-matching path rooted outside the pinned `$HOME` → deny exit 2;
     same path under the pinned `$HOME` → allow; `HOME` with a trailing slash → still allows under it
     (normalization proven); `HOME` unset (`env -u HOME`) → fallback shape glob allows; `HOME=''`
     (empty) → fallback shape glob allows (two separate cases — `set -u` must not kill the hook:
     `${HOME:-}` spelling throughout). The pre-existing `SERV_MEM` cases (4a, the two clean-memory
     regressions) are retrofitted to `run_home` in the same commit so they stay green.
  6. A worker Bash command writing a relative redirect target while payload `.cwd` is an absolute path
     outside any `.war-task` worktree produces a stderr warning and exit 0; the same with `.cwd`
     inside a `.war-task` fixture stays silent; `.cwd` absent → old skip behavior (silent);
     `cmd 2>&1` and `echo foo >&2` are pinned silent (fd-redirect false-positive class), with the
     relative-redirect warn case as their firing twin — all in `hooks/warn-bash-write-scope.test.sh`.
  7. A trailing-junk agent type (e.g. `work-audit-refine:war-servitor-helper`) falls through to the
     fail-open default arm of `hooks/validate-worktree-scope.sh`, and no longer captures in
     `hooks/validate-auditor-git.sh` / `hooks/validate-servitor-provenance.sh` /
     `hooks/warn-bash-write-scope.sh`; AND the exact default dispatched shape
     (`work-audit-refine:war-<role>`, nothing trailing) still captures in every arm — one
     trailing-junk + one exact-shape case per hook (under-capture on a deny-side arm fail-opens a
     read-only agent; the exact-shape cases are the guard against that inversion).
  8. `docs/adr/0002-scope-by-agent-type.md` carries a dated addendum recording the three narrowings,
     the two re-ratifications (advisory-only posture retained; cross-project-under-`$HOME` residual
     retained), the suffix-anchoring capture note from spec §8, the symlinked-home residual (no
     realpath in the hook; the Lead's memoryLocalRoot comes from the same `~` expansion), and the
     one-line rollback (revert the servitor case pattern to the shape glob);
     `docs/learnings/scope-hook-blind-to-bash-write-path.md` carries a BODY-ONLY narrowing note
     (frontmatter/description untouched — projection budget unaffected; no local-root absolute paths
     cited); `agents/war-servitor.md`'s quoted glob string reads the anchored form.
  9. All four release slots are bumped in lock-step to the next free patch above the live integration
     base at land time (`skills/war/assets/version-slots.test.mjs` green).

## Build order (for /war)

1. Phase 1 — Hook narrowing + decision records (Tasks 1.1, 1.2, 1.3 parallel, file-disjoint; Task 1.4
   in a second wave via `deps` so its prose describes the merged hooks, its standing conventions run
   against the integrated tip, and its sweeps close the phase).
2. Phase 2 — Release (version bump; must land last, touches shared slot files).

## Phase 1 — Hook narrowing + decision records

### Task 1.1: Widen the worker Bash-write detector (#809)

- Files: `hooks/warn-bash-write-scope.sh`, `hooks/warn-bash-write-scope.test.sh`
- Plan slice: Per spec §4 (`warn-bash-write-scope.sh` mechanics), with the capture-pattern gap closed:
  1. Read `.cwd` from the payload alongside the existing `.agent_type` / `.tool_input.command` reads
     (the `get()` helper already exists; `.cwd` is a documented hook-payload field already consumed
     in-repo by `hooks/inject-campaign-state.sh`).
  2. In `warn_if_outside`, replace the relative-path early-return (`*) return ;;` arm) with
     resolution: a non-empty, non-absolute target becomes `"$cwd/$target"` when `.cwd` is a non-empty
     absolute path; if `.cwd` is absent or relative, keep the old skip (best-effort posture). Plain
     prepend — no realpath; `..` segments are the scope hook's concern. `has_war_task` unchanged.
  3. **Widen the section-1 redirect extraction ONLY** (the existing seds capture only `/`-prefixed
     tokens, so relative targets never reach `warn_if_outside` — the promised relative-redirect case
     cannot fire without this): alongside each absolute-capture sed, a relative-capture sed whose
     first-char class excludes `/` (absolute — other sed), `&` (fd duplication: `2>&1`, `>&2`),
     whitespace, `>|;<`, and `$`/`~` (unresolvable variable/tilde targets — skip, not guess). All
     other extractors (tee, `sed -i`, `perl -i`, `git -C`, cp/mv/install awk, `dd of=`) stay
     absolute-only — documented ceiling, stated in the LIMITATIONS rewrite.
  4. New detection section after the existing section 9 (`dd of=PATH`): interpreter-payload heuristic —
     when the command invokes `python`/`python3`/`perl`/`ruby`/`node` with a `-c` or `-e` payload AND
     the command string contains a write-indicative token (`open(`, `write`, `writeFile`), extract each
     absolute-path-shaped token (same character-class discipline as the redirect sed) and
     `warn_if_outside` each. No payload parsing beyond token scan; misses are a documented ceiling.
     `sh -c`/`bash -c`/`zsh -c` are deliberately NOT in the interpreter list: a shell `-c` payload's
     redirect/cp/tee tokens sit in the same command string and are already scanned by the existing
     extractors — the LIMITATIONS rewrite states this reasoning, and a test proves it.
  5. Rewrite the header's LIMITATIONS block: new coverage; remaining ceilings (interpreter payloads
     that build paths dynamically; non-redirect extractors absolute-only; quoted-string false
     positives — a relative token after `>` inside a quoted string now resolves and may warn);
     shell `-c` handled via string-level rescan. Reword the SCOPE paragraph's "agent_type matching
     *war-worker*" prose to suffix-anchored phrasing. The `ALWAYS exits 0` contract line is untouched.
  6. Agent-type arm: `*war-worker*` → `*war-worker` (suffix-anchored, prefix-agnostic).
  Test cases (same commit; payload builder gains a `cwd` field — kept LOCAL to this suite, no shared
  helper extracted; every silent case names its firing twin in a comment):
  relative redirect target + `cwd` outside any worktree → warning + exit 0; relative target + `cwd`
  inside a `.war-task` fixture → silent; relative target + `cwd` ABSENT from payload → silent (old
  skip pinned); `cmd 2>&1` and `echo foo >&2` with outside `cwd` → silent (fd-redirect class; twin:
  the relative-redirect warn case); `echo a>b` (no space) with outside `cwd` → warning;
  `echo x > $F` → silent (`$`-leading token skipped); `python -c "open('/outside/x','w')"` → warning;
  interpreter payload with an absolute path but no write-indicative token → silent (twin: the
  preceding case); `bash -c "echo x > /outside/y"` → warning (string-level rescan proof); exact-shape
  `work-audit-refine:war-worker` → still warns on an outside write; trailing-junk
  `work-audit-refine:war-worker-helper` → silent; every case asserts exit 0. STANDING case: grep the
  hook for zero `exit 2`/`deny` occurrences and a terminal `exit 0` (End state 2). Also survey
  existing test titles/comments for substring-arm prose and fix stragglers.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Anchor the servitor glob + arm precision in the scope hook (#810)

- Files: `hooks/validate-worktree-scope.sh`, `hooks/validate-worktree-scope.test.sh`
- Plan slice: Per spec §4 (`validate-worktree-scope.sh` mechanics), HOME-anomaly-hardened:
  1. Servitor arm: normalize first — `home="${HOME:-}"; home="${home%/}"` (the `${HOME:-}` spelling is
     mandatory: a bare `$HOME` under `set -u` with HOME unset kills the hook before the fallback; the
     trailing-slash strip prevents a `//` in the pattern matching nothing and bricking every wrap-up).
     When `$home` is non-empty, match `"$home"/.claude/projects/*/memory/*` (quoted expansion inside
     the case pattern — literal, glob-safe); otherwise fall back to the current shape glob
     `*/.claude/projects/*/memory/*` (fail toward the ratified residual, never toward deny-all).
     Update the deny message in the same edit: it must name the anchored expectation AND the fallback
     condition (so an operator hit by a HOME anomaly can self-diagnose; rollback is the one-line
     revert of the case pattern to the shape glob).
  2. All three arms `*war-auditor*` / `*war-worker*` / `*war-servitor*` → suffix-anchored equivalents.
  3. The servitor comment block (the `#58 resolution` paragraph in the header, and the pre-case `..`
     comment's #58 sentence if it repeats the shape) gains one sentence recording the `$HOME` anchor
     and the re-ratified cross-project residual; the "cannot receive per-run values" rationale stands.
  4. The all-agents `..`-traversal rejection and the fail-open default arm are untouched.
  Test cases (same commit): add a `run_home` helper (`printf '%s' "$2" | HOME="$1" bash "$HOOK"`) —
  per-case env pinning, no global export, no helper shared with the sibling suite. RETROFIT the
  pre-existing `SERV_MEM` cases that flip under anchoring (case 4a "war-servitor memory path allowed"
  and the two clean-memory regression cases) to `run_home "$WT/repo"` so `SERV_MEM` sits under the
  pinned HOME — same commit as the hook change or the suite goes red. New cases: shape-matching path
  rooted outside the pinned `$HOME` → deny exit 2 (assert the deny message names the anchored
  expectation); path under the pinned `$HOME/.claude/projects/<other-project>/memory/` → allow (cite
  the re-ratified residual in the case title); pinned HOME WITH a trailing slash → same allow
  (normalization proven); `HOME` unset via `env -u HOME` → fallback shape glob allows; `HOME=''` →
  fallback shape glob allows (two separate cases); exact-shape `work-audit-refine:war-servitor` →
  still confined to the anchored glob; trailing-junk `work-audit-refine:war-servitor-helper` → falls
  through to the default fail-open arm; exact-shape `work-audit-refine:war-auditor` → still
  write-denied (deny-side under-capture guard). Survey existing case titles for the unanchored shape
  written in prose and fix stragglers. Keep bash-3.2/cwd-independence conventions
  (guard-conventions search-root lint runs over this file).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Suffix-anchor the auditor-git and servitor-provenance arms (#810)

- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`,
  `hooks/validate-servitor-provenance.sh`, `hooks/validate-servitor-provenance.test.sh`
- Plan slice: Mechanically identical narrowing in both hooks (one cohesive unit, per spec §4): the
  single agent-type arm in each becomes suffix-anchored (`*war-auditor*` → `*war-auditor` in the
  "Only gate war-auditor agents" case of `validate-auditor-git.sh`; `*war-servitor*` → `*war-servitor`
  in `validate-servitor-provenance.sh`). Reword header comments that say "agent_type matching
  *war-auditor*" (the PURPOSE comment at the top of `validate-auditor-git.sh` is a known straggler).
  In `validate-servitor-provenance.sh`, add an in-file comment on the memory-glob classifier line
  (`*/.claude/projects/*/memory/*|*/docs/learnings/*`) recording that it is DELIBERATELY left
  unanchored — it is a content-gate classifier, not an allow gate; broader capture means more
  provenance enforcement, fail-safe — and is the second sanctioned survivor of the End-state-4 sweep.
  No other behavior change — the auditor verb allowlist is not widened, `fetch` stays excluded.
  Test cases (same commit): per hook, one trailing-junk case proving the arm no longer captures
  (`work-audit-refine:war-auditor-helper` passes the git guard un-gated;
  `…:war-servitor-helper` is not held to the provenance requirement) PAIRED with one exact-shape case
  proving the default dispatched string still captures (`work-audit-refine:war-auditor` still
  verb-gated; `work-audit-refine:war-servitor` still provenance-gated) — the exact-shape pair is the
  guard against deny-side fail-open inversion. Survey both hooks' headers and both test files'
  titles/comments for substring-arm prose; fix stragglers.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Decision records + standing conventions + integrated-tip sweeps

- Files: `docs/adr/0002-scope-by-agent-type.md`, `docs/learnings/scope-hook-blind-to-bash-write-path.md`,
  `agents/war-servitor.md`, `hooks/guard-conventions.test.sh`
- Plan slice: Four pieces, all against the integrated tip (Tasks 1.1–1.3 merged beneath this wave):
  1. Dated addendum to ADR 0002 recording the three narrowings (worker Bash-write detection widened
     to cwd-resolved relative redirect targets + interpreter-payload heuristic; servitor glob
     `$HOME`-anchored with normalization and the `HOME`-unset/empty fallback; all six agent-type arms
     suffix-anchored) and the two re-ratifications (advisory-only posture retained — the warn hook
     never blocks; cross-project-under-`$HOME` residual retained, bounded by the servitor's no-Bash
     allowlist and the provenance hook's existing-target mutation guard). State: the suffix-anchoring
     capture consequence from spec §8 (a future `<ns>:war-servitor-v2` falls to the fail-open default
     arm — capability-first confinement is per known agent type) AND its inversion risk (under-capture
     on a deny-side arm fail-opens; the exact-shape test cases pin the live default string); the
     symlinked-home residual (the hook never realpaths — the Lead's memoryLocalRoot derives from the
     same `~` expansion as `$HOME`, and a realpath'd-vs-spelled mismatch surfaces as the named deny
     with a documented one-line rollback: revert the servitor case pattern to the shape glob). Update
     ADR 0002's policy-table prose where it still describes substring semantics (known straggler).
  2. BODY-ONLY narrowing note in the learnings file (relative-path and interpreter-payload coverage
     added; advisory posture unchanged) — frontmatter and `description` line untouched (the MEMORY.md
     projection budget is description-driven; no change to it), and the note cites no local-root
     absolute path (redaction-lint self-trip lesson). The CI redaction lint is the covering floor
     (named in backstops).
  3. One-string update in `agents/war-servitor.md`: the quoted path-pattern
     `*/.claude/projects/*/memory/*` becomes the anchored form as the hook now enforces it (conscious
     deviation from spec §5's "no standing-instruction changes" — this is descriptive prose about the
     hook, and `skills/war/assets/workflow-template.js` carries NO occurrence of the glob (verified),
     so no dispatched-prompt mirror obligation is tripped; no behavioral text changes).
  4. Two STANDING convention cases appended to `hooks/guard-conventions.test.sh` (following its
     printf-assembled-fixture rule so no offending literal is scannable in the lint file): (a) zero
     `*war-[a-z-]*\*` trailing-star arms in non-test `hooks/*.sh`; (b) the unanchored memory glob
     appears in no `hooks/*.sh` file other than the two sanctioned survivors
     (`validate-worktree-scope.sh` fallback branch, `validate-servitor-provenance.sh` classifier).
     These convert End states 3–4 from one-time sweeps into regression guards.
  Then run both End-state-3/4 sweeps (grep + manual survey) against the integrated tip and fix any
  straggler the earlier tasks missed IN THESE FOUR FILES ONLY — a straggler inside a hook file is
  reported as a finding for the owning task, not edited here (file-disjointness holds). Verify — not
  assume — that the root `CLAUDE.md` guard-architecture paragraph stays accurate as written ("Bash
  writes only advisorily warned"; servitor "Write/Edit only into the local memory root"); no edit
  expected.
- requiresTest: true (mapped evidence: the `hooks/guard-conventions.test.sh` standing cases in this diff)
- requiresPackaging: false
- deps: [1.1, 1.2, 1.3]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump (four slots, lock-step)

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land time
  (the /war-strategy §2 next-free-patch convention — never a resolved semver literal in this plan):
  `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` and
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never emptied, no
  badge). `skills/war/assets/version-slots.test.mjs` is the arbiter — a partial bump is a red test.
  Expected integration base: this plan stacks FOURTH in the campaign spine, after
  `floor-script-correctness` (which stacks on `audit-gate-evidence-fidelity` on
  `war-launch-entry-validation`) — three prior release bumps precede this one, so the next free patch
  must be resolved from the slots as they stand at land time, not from any literal in this or the
  prior plans. Standalone fallback: a run of this plan through plain `/war` resolves the next free
  patch from the four slots itself.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Field false-positive rate of the widened detector (relative-redirect resolution + interpreter-payload
  heuristic) · why deferred: only observable across real runs; blocking mode is explicitly deferred
  until the widened detector proves false-positive-free in the field (spec §9) · runner: operator
  review of stderr advisories in subsequent /war runs; revisit blocking mode with that data.
- Live dispatched agent-type shape (exactly `<ns>war-<role>`, nothing trailing) · why deferred: the
  exact-shape test cases pin the SOURCE-derived default (`workflow-template.js` `NS` constant), but no
  captured live payload proves Claude Code never decorates the type; under-capture on a deny-side arm
  would fail-open a read-only agent · runner: the first post-land /war run is a CANARY — verify in its
  logs that an auditor write was denied and the servitor wrap-up write succeeded before treating the
  anchoring as field-proven; a miss is a one-line rollback per the ADR addendum.
- Symlinked/realpath'd HOME divergence (e.g. /private/var vs /Users spelling reaching the servitor's
  file_path with a different prefix than the hook's `$HOME`) · why deferred: the Lead threads
  memoryLocalRoot from the same `~` expansion, so divergence requires an out-of-band realpath; not
  reproducible hermetically · runner: same first-run canary; the rewritten deny message names the
  anchored expectation and fallback condition so the operator can self-diagnose, and rollback is the
  documented one-line case-pattern revert.
- Cross-project writes under the user's own `$HOME` remain allowed by the servitor arm (re-ratified
  residual) · why deferred: per-run memory-root threading into a hook process is structurally
  unavailable (probe E1, #58); slug derivation from `$CLAUDE_PROJECT_DIR` is rejected as a fail-closed
  brick risk · runner: none — bounded at runtime by the servitor's no-Bash capability allowlist and
  the provenance hook's existing-target mutation guard, recorded in the ADR 0002 addendum.
- Opaque interpreter writes that build paths dynamically, and relative targets of the non-redirect
  extractors (tee/sed/perl/cp/mv/install/dd stay absolute-only) · why deferred: the warn hook is a
  best-effort detector by ratified posture; the guarantee-bearing layers are the Write/Edit scope
  hook, the servitor's no-Bash allowlist, and the auditor git allowlist · runner: none — documented
  ceiling in the rewritten LIMITATIONS header.
- Learnings-file edit safety · why deferred: not a test-floor surface · runner:
  `node skills/_shared/war-memory.mjs lint docs/learnings/` — exactly what CI runs — is the covering
  floor for Task 1.4's body-only note (requiresTest on 1.4 is carried by the guard-conventions
  standing cases, not the docs edit).

## Notes / conscious deviations

- **Q1 (capture patterns)**: the spec's relative-redirect test case could never fire — every
  extraction sed captures only `/`-prefixed tokens. Resolved: widen ONLY the section-1 redirect
  extraction (relative-capture sed excluding `&`-leading fd-dup tokens and `$`/`~`-leading
  unresolvable tokens); all other extractors stay absolute-only as a documented ceiling. The
  fd-redirect false-positive class (`2>&1`, `>&2`) and the `$var` skip are pinned silent with the
  relative-redirect warn case as firing twin; `echo a>b` (no space) is pinned firing.
- **Q2 (payload `.cwd`)**: `.cwd` is already consumed from a hook payload in this repo
  (`hooks/inject-campaign-state.sh`) and is a documented hook-payload field. Workers are spawned with
  cwd inside their worktree, so cd-prefixed relative writes resolve inside `.war-task` → silent;
  `.cwd` absent/relative keeps the old skip (pinned by a test). Noise budget accepted for an advisory
  layer.
- **Q3 (fixture flip)**: anchoring flips three pre-existing `SERV_MEM` cases (4a + two regressions)
  red — Task 1.2 explicitly owns retrofitting them via the new `run_home` per-case env-pinning helper
  (no global HOME export, no shared helper with the sibling suite).
- **Q4 (`set -u`)**: `${HOME:-}` spelling mandated throughout; `env -u HOME` (unset) and `HOME=''`
  (empty) are two separate fallback test cases. (A crashed hook exits non-2, which Claude Code treats
  as a non-blocking error — fail-open, not deny — but the plan does not rely on that.)
- **Q5 (HOME anomalies)**: trailing slash normalized (`${home%/}`) with a dedicated test case;
  symlinked-home divergence accepted as a canary-monitored residual (no realpath in the hook; deny
  message + one-line rollback documented in the ADR addendum; first-run canary in backstops).
- **Q6 (stale standing instruction)**: conscious deviation from spec §5 — `agents/war-servitor.md`'s
  quoted glob joins Task 1.4 as a one-string doc-accuracy update; grep-verified that
  `workflow-template.js` carries no occurrence of the glob, so the standing/dispatched mirror rule is
  not tripped.
- **Q7 (census + standing guards)**: six-arm census re-verified by grep across `hooks/*.sh`,
  `hooks/hooks.json` (tool-name matchers only), `workflow-template.js`, and `agents/*.md` — exactly
  six case arms. The criterion-4 grep also hits `validate-servitor-provenance.sh`'s classifier glob,
  which the spec did not count: resolved as a second sanctioned survivor, deliberately unanchored
  (fail-safe direction for a content gate), commented in-file (Task 1.3) and named in End state 4.
  End states 3–4 become STANDING conventions in `guard-conventions.test.sh` (Task 1.4) so a future
  hook edit cannot silently regress them.
- **Q8 (under-capture inversion)**: every trailing-junk case is paired with an exact-live-shape case
  pinning the source-derived default `work-audit-refine:war-<role>`; live-payload proof is a
  first-run canary backstop (deny-side under-capture is strictly worse than the over-capture it
  replaces, so it gets both a test pair and a canary).
- **Q9 (`sh -c` exclusion)**: reasoned, not an oversight — shell `-c` payload tokens are re-scanned
  at string level by the same extractors; LIMITATIONS states it and a
  `bash -c "echo x > /outside/y"` warn case proves it.
- **Q10 (vacuous silents)**: every silent case names a firing twin on the same code path in a comment
  (delete-the-feature discipline), enumerated in Task 1.1's case list.
- **Q11 (End state 2 as written was un-greppable)**: rewritten machine-checkable — zero
  `exit 2`/`deny` occurrences + terminal `exit 0`, owned as a standing case in
  `warn-bash-write-scope.test.sh` (the three early `exit 0`s are irrelevant to the assertion).
- **Q12 (decomposition)**: spec criterion 7's "same change" is consciously relaxed to same-PHASE
  landing via Task 1.4's deps wave — nothing must be *landed* first, the docs only need the merged
  hooks visible on the integration tip. Task 1.3 stays ONE task (single mechanical narrowing across
  two file-disjoint hook pairs; splitting manufactures two near-empty tasks).
- **Q13 (learnings edit)**: body-only note — `description`/frontmatter untouched, so the 24.4KB
  projection budget is unaffected; no local-root absolute paths cited; the CI redaction lint is the
  named covering floor in backstops.
- **Q15 (rollback)**: the deny message must name both the anchored expectation and the fallback
  condition; rollback is the one-line case-pattern revert, recorded in the ADR addendum; first
  post-land run is a servitor-write canary (backstops).
- **Q16 (test helpers)**: the two suites' payload builders evolve independently — extracting a shared
  helper would create a same-file coupling between otherwise file-disjoint Tasks 1.1/1.2 and is
  explicitly prohibited; both suites keep bash-3.2/cwd-independence (guard-conventions search-root
  lint enforces the convention).
- **Contention with the three prior plans this run**: `hooks/` files, the two doc files,
  `agents/war-servitor.md`, and `guard-conventions.test.sh` are fully disjoint from
  `war-launch-entry-validation`, `audit-gate-evidence-fidelity`, and `floor-script-correctness`. The
  only shared files are the four release slots, which all four plans bump; this plan lands FOURTH per
  the manifest spine, and Task 2.1 carries the next-free-patch directive rather than a literal.
- **requiresPackaging: false on every task**: this repo has no Dockerfile/packaging surface; the
  packaging floor is a no-op here (recorded learning
  `packaging-floor-is-a-noop-without-a-dockerfile-and-ignores-modified-paths`).
- **Predecessor-consistency**: two of the three predecessor plans in this campaign use
  `## Commander's Intent`, one uses `## AI-Commander's Intent`; this plan keeps the
  `## AI-Commander's Intent` heading per the ADR 0014 --afk rule (any heading-extraction surface must
  recognize both, so the mix is tolerated downstream). Tone, per-task field shape, release-phase
  directive form, and backstops structure match the predecessors.

## Open decisions

None — every grill fork is self-adjudicated above; /red-team validates, never converts.
