# Confinement scope-hook narrowing — widen worker Bash-write detection, anchor the servitor write glob and agent-type arms

Issues addressed: #809, #810

## 1. Context — the gap / problem

ADR 0002 confines WAR agents capability-first by `agent_type`. Two consciously-ratified residuals in that
confinement surface have live, narrowable ceilings:

- **#809 (major)** — the worker's Bash write path is covered only by `hooks/warn-bash-write-scope.sh`,
  which detects a fixed shape list (`>`/`>>`, `tee`, `sed -i`, `perl -i`, `git -C`, `cp`, `mv`, `install`,
  `dd of=`), warns on stderr, and unconditionally exits 0. Its `warn_if_outside` helper **skips every
  relative path** outright, and opaque writes (interpreter `-c`/`-e` payloads, here-doc-fed pipelines
  ending in a relative target) escape detection entirely. The worker is the only agent whose Bash
  confinement is best-effort prose; servitor has no Bash and the auditor's Bash is fail-closed by
  `validate-auditor-git.sh`.
- **#810 (minor)** — the servitor arm of `hooks/validate-worktree-scope.sh` allows writes by the bare
  shape glob `*/.claude/projects/*/memory/*`: any path on disk matching that shape is allowed, not just
  a memory root under the user's home. Additionally, all agent-type case arms across the hooks match by
  **substring** glob (`*war-servitor*`, `*war-worker*`, `*war-auditor*`), so a hypothetical agent named
  `<ns>:war-servitor-helper` would be silently mis-confined (or, on the auditor arms, wrongly
  write-denied). Issue #58 closed with full per-run memory-root anchoring deferred for a structural
  reason (a hook process cannot receive per-run values); the residual was ratified but its narrowable
  slice was left untracked.

This spec narrows both residuals **without changing the ratified posture**: the warn hook stays
advisory (always exit 0), the scope hook stays fail-open for refiner/main, and per-run anchoring stays
deferred. What changes is detection coverage (#809) and anchor precision (#810).

## 2. Pivotal constraints

- **ADR 0002 is the governing decision.** These are accepted residuals being narrowed, not
  re-architected. The scope hook's fail-open default arm (war-refiner, main session, non-WAR agents)
  is by design and must not change.
- **Hook processes cannot receive per-run values** (probe E1; the #58 ratification recorded in
  `validate-worktree-scope.sh`'s servitor comment block). They *do* reliably see `$HOME`,
  `$CLAUDE_PROJECT_DIR` (already consumed by `hooks/inject-campaign-state.sh`), and the payload's
  `.cwd` / `.agent_type` / `.tool_input` fields. Every narrowing below uses only these channels.
- **Exact-string agent-type matching is impossible**: the dispatched agent type is
  `NS + 'war-<role>'` where `NS` is `const NS = A.agentPrefix ?? 'work-audit-refine:'` in
  `skills/war/assets/workflow-template.js` — the prefix is operator-configurable, so arms may anchor
  the suffix but never the whole string.
- **`warn-bash-write-scope.sh` must ALWAYS exit 0.** Its documented false-positive tolerance (e.g. a
  `>` inside a quoted string) is predicated on never blocking; widened detection inherits that
  contract.
- **The servitor arm is fail-closed but must not brick runs on env anomalies**: if `$HOME` is unset or
  empty in the hook environment, the arm must fall back to the current shape glob (fail toward the
  already-ratified residual, never toward denying all servitor writes — a wrong deny breaks every
  run's wrap-up).
- **macOS bash 3.2.57** — no globstar, no associative arrays, no `${var,,}`; payload read via `jq`.
- The all-agents `..`-traversal rejection (`case "$path" in ..|../*|*/../*|*/..`) is untouched and
  continues to run before every per-agent arm.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Add a blocking mode to the worker Bash-write hook? | **No.** Retain unconditional exit 0. The detector is heuristic; blocking converts detection false-positives into mid-run tool failures. Deferred (§9) — revisit only if the widened detector proves false-positive-free in the field. |
| How to stop skipping relative write targets? | Resolve them against the payload's `.cwd` (prepend, no realpath needed — `..` segments are the scope hook's concern, and a warn hook stays best-effort), then run the existing `has_war_task` ancestor walk. Delete the relative-path early-return in `warn_if_outside`. |
| Detect opaque interpreter writes? | Conservative token heuristic: when the command invokes `python`/`python3`/`perl`/`ruby`/`node` with a `-c` or `-e` payload AND the command string contains a write-indicative token (`open(`, `write`, `writeFile`), extract each absolute-path-shaped token from the command and `warn_if_outside` it. No payload parsing beyond token scan; misses remain (documented ceiling). |
| Separate here-doc detector? | **No.** The existing redirect/`tee` extraction already sees `> /abs` anywhere in the command; the genuine here-doc gap was the relative-target skip, which the `.cwd` resolution closes. |
| Anchor the servitor write glob to the run's memory root? | Per-run anchoring stays structurally out of reach (re-ratified). Narrow instead to a **`$HOME` prefix anchor**: `"$HOME"/.claude/projects/*/memory/*` (quoted expansion in the case pattern — literal, glob-safe). Cross-*project* writes under the user's own home remain an accepted residual, bounded as before by the servitor's no-Bash allowlist and the provenance hook's existing-target mutation guard. |
| Derive the project slug from `$CLAUDE_PROJECT_DIR` for full per-project anchoring? | **No.** Claude Code's path-slug algorithm is an implementation detail; a drift would make the fail-closed servitor arm deny every legitimate write and brick every run's wrap-up. Deferred (§9). |
| `$HOME` unset/empty in the hook env? | Fall back to the current unanchored shape glob for that invocation. Fail toward the ratified residual, never toward deny-all. |
| Agent-type arm precision? | Replace every substring arm `*war-<role>*` with the **suffix-anchored** form `*war-<role>` (drop the trailing `*`) in all six arms across the four hooks: `validate-worktree-scope.sh` (auditor, worker, servitor), `validate-auditor-git.sh` (auditor), `validate-servitor-provenance.sh` (servitor), `warn-bash-write-scope.sh` (worker). Suffix-anchoring is prefix-agnostic (survives any `agentPrefix`) yet stops trailing-junk mis-capture. |
| Touch the spawn path in `workflow-template.js`? | **No.** #810's threading option is rejected in favor of hook-side derivation; no engine file changes in this spec. |

## 4. Mechanics

### `hooks/warn-bash-write-scope.sh` (worker arm, #809)

1. Read `.cwd` from the payload alongside the existing `.agent_type` / `.tool_input.command`.
2. `warn_if_outside`: replace the relative-path early-return with resolution — a non-absolute,
   non-empty target becomes `"$cwd/$target"` when `.cwd` is a non-empty absolute path; if `.cwd` is
   absent/relative, keep the old skip (best-effort posture). The `has_war_task` walk is unchanged.
3. New detection section (after the existing `dd of=` section): interpreter-payload heuristic per the
   design tree — gate on the interpreter+flag shape and a write-indicative token, then extract
   absolute-path-shaped tokens (`/…` words, same character-class discipline as the redirect sed) and
   `warn_if_outside` each.
4. The header's LIMITATIONS block is rewritten to state the new coverage and the remaining ceiling
   (interpreter payloads that build paths dynamically; quoted-string false positives). The
   `ALWAYS exits 0` contract line is untouched.
5. Agent-type arm: `*war-worker*` → `*war-worker`.

### `hooks/validate-worktree-scope.sh` (servitor arm + arm precision, #810)

1. Servitor arm: when `HOME` is set and non-empty, match `"$HOME"/.claude/projects/*/memory/*`;
   otherwise fall back to `*/.claude/projects/*/memory/*`. The deny message names the anchored
   expectation (and must be updated together with the glob — it currently quotes the unanchored
   shape).
2. Arms `*war-auditor*` / `*war-worker*` / `*war-servitor*` → suffix-anchored equivalents.
3. The servitor comment block (the `#58 resolution` paragraph) gains one sentence recording the
   `$HOME` anchor and the re-ratified cross-project residual; its "cannot receive per-run values"
   rationale stands.

### `hooks/validate-auditor-git.sh`, `hooks/validate-servitor-provenance.sh`

Suffix-anchor the single agent-type arm in each (`*war-auditor*` → `*war-auditor`;
`*war-servitor*` → `*war-servitor`). Header comments that say "agent_type matching *war-auditor*"
reword to the suffix-anchored phrasing. No other behavior change.

### Tests (same-file siblings, same commit as their hook)

- `hooks/warn-bash-write-scope.test.sh`: relative redirect target + payload `cwd` outside any
  worktree → warning + exit 0; relative target + `cwd` inside a `.war-task` fixture → silent + exit 0;
  `python -c "open('/outside/x','w')"` → warning; interpreter payload with an absolute path but no
  write token → silent; every new case asserts exit 0.
- `hooks/validate-worktree-scope.test.sh` (pin `HOME` to a fixture dir per case, the way
  `inject-campaign-state.test.sh` pins `CLAUDE_PROJECT_DIR`, so cases stay hermetic): shape-matching
  path rooted outside the pinned `$HOME` → deny exit 2; path under the pinned
  `$HOME/.claude/projects/<other-project>/memory/` → allow (residual re-ratified, cited in the case
  title); `HOME` unset → fallback shape glob allows; agent_type `work-audit-refine:war-servitor-helper`
  → falls through to the default fail-open arm.
- `hooks/validate-auditor-git.test.sh` / `hooks/validate-servitor-provenance.test.sh`: one
  trailing-junk agent-type case each proving the arm no longer captures.

### Docs / decision records

- `docs/adr/0002-scope-by-agent-type.md`: an addendum (dated) recording the three narrowings and the
  two re-ratifications (advisory-only posture retained; cross-project-under-`$HOME` residual retained).
- `docs/learnings/scope-hook-blind-to-bash-write-path.md`: narrowing note (relative-path and
  interpreter-payload coverage added; advisory posture unchanged).
- Root `CLAUDE.md` guard-architecture paragraph stays accurate as written ("Bash writes only
  advisorily warned"; servitor "Write/Edit only into the local memory root") — no edit expected;
  verify rather than assume.

## 5. Surface changes

| File | Change |
|---|---|
| `hooks/warn-bash-write-scope.sh` | cwd-resolved relative targets; interpreter-payload detector; suffix-anchored arm; header rewrite |
| `hooks/warn-bash-write-scope.test.sh` | new cases per §4 |
| `hooks/validate-worktree-scope.sh` | `$HOME`-anchored servitor glob + fallback; suffix-anchored arms; deny message + comment updates |
| `hooks/validate-worktree-scope.test.sh` | new cases per §4 (HOME-pinned fixtures) |
| `hooks/validate-auditor-git.sh` | suffix-anchored arm + comment reword |
| `hooks/validate-auditor-git.test.sh` | trailing-junk case |
| `hooks/validate-servitor-provenance.sh` | suffix-anchored arm + comment reword |
| `hooks/validate-servitor-provenance.test.sh` | trailing-junk case |
| `docs/adr/0002-scope-by-agent-type.md` | addendum |
| `docs/learnings/scope-hook-blind-to-bash-write-path.md` | narrowing note |

No changes to `skills/war/assets/workflow-template.js`, agents' standing instructions, or hook wiring
(`hooks/hooks.json`).

## 6. New domain terms (CONTEXT.md)

None. "Suffix-anchored agent-type match" and "`$HOME`-anchored memory glob" are described where they
live (hook comments + ADR 0002 addendum); neither warrants a glossary entry.

## 7. Recommended ADRs

No new ADR. An addendum to **ADR 0002** (§4 above) is sufficient — the governing decision is
unchanged; only its recorded residual boundaries move.

## 8. Open risks / implementation notes

- **Relative-path resolution false positives**: a relative token following `>` inside a quoted string
  now resolves and may warn where it previously skipped. Acceptable under the always-exit-0 contract;
  the header documents it.
- **Suffix-anchoring narrows capture**: a future agent literally named `<ns>:war-servitor-v2` would
  fall to the fail-open default arm instead of servitor confinement. This matches the existing
  capability-first posture (confinement is per known agent type); the ADR addendum states it.
- **`guard-conventions.test.sh` and the clean-surface tests** run over `hooks/` — keep them green; if
  a convention assertion locks the old arm spelling, update it in the same commit as the hook.
- The deny/warn message strings are user-visible diagnostics; auditors should check they name the
  *new* expectation (anchored glob), not the old shape.
- Sequencing: the survey manifest orders this spec after
  `docs/specs/2026-07-12-audit-gate-evidence-fidelity-design.md`; there is no shared-file contention
  with it (this spec touches only `hooks/` + two docs), so the ordering is landing-order only.

## 9. Non-goals / deferred

- **Blocking mode** for worker Bash writes (opt-in exit 2) — deferred; heuristic detector
  false-positives would become run breakage. Revisit with field data on the widened detector.
- **Per-run memory-root threading** into the hook — structurally unavailable (probe E1, #58); stands
  deferred.
- **Slug derivation from `$CLAUDE_PROJECT_DIR`** for per-project servitor anchoring — rejected
  (fail-closed brick risk on slug-algorithm drift).
- **Guaranteed opaque-write coverage** — the warn hook remains a best-effort detector, never a
  guarantee; the guarantee-bearing layers stay the Write/Edit scope hook, the servitor's no-Bash
  allowlist, and the auditor git allowlist.
- Any change to refiner/main fail-open behavior.

## 10. Validation criteria

1. `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done` passes,
   including every new case in §4.
2. `hooks/warn-bash-write-scope.sh` still contains exactly one exit path for the end of detection
   (`exit 0`) and no `exit 2`/`deny` route — advisory posture provably unchanged.
3. Substring-arm sweep: `grep -n '\*war-[a-z-]*\*' hooks/*.sh` (excluding `*.test.sh`) returns zero
   matches — all six arms suffix-anchored. **Grep is a floor, not a ceiling**: after the grep,
   hand-scan each of the four hooks' header comments, their same-file case arms, and the titles/
   comments of all `hooks/*.test.sh` for prose still describing substring semantics (e.g.
   "agent_type matching \*war-worker\*"), and list each straggler as a survey-derived correction.
   Known stragglers from this spec's own survey that the grep alone will not flag: the SCOPE
   paragraph in `warn-bash-write-scope.sh`'s header, the purpose comment near the top of
   `validate-auditor-git.sh`, and ADR 0002's policy-table prose.
4. Unanchored-glob sweep: `grep -rn '\*/\.claude/projects/\*/memory/\*' hooks/ docs/adr/0002-scope-by-agent-type.md`
   — every remaining hit is either updated to the anchored form or sits inside the documented
   `HOME`-unset fallback branch (the only sanctioned survivor). **Grep is a floor, not a ceiling**:
   after the grep, hand-scan `validate-worktree-scope.sh`'s servitor deny-message string and comment
   block, and `validate-worktree-scope.test.sh` case titles, for the unanchored shape written in
   prose rather than as the literal glob token, and list each straggler as a survey-derived
   correction.
5. A servitor Write to a shape-matching path rooted outside the pinned `$HOME` fixture is denied
   (exit 2) by `validate-worktree-scope.sh`; the same path under the pinned `$HOME` is allowed —
   both proven by the new test cases.
6. A worker Bash command writing a relative path while `cwd` is outside any `.war-task` worktree
   produces a stderr warning and exit 0 — proven by the new warn-hook case.
7. ADR 0002 contains the addendum; `docs/learnings/scope-hook-blind-to-bash-write-path.md` carries
   the narrowing note; both land in the same change as the hooks they describe.
