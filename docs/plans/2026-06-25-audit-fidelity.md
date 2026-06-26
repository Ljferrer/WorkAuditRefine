# Audit Fidelity Implementation Plan (F03 · F06)

**Goal:** make the audit see the *right change set* and apply the *advertised breadth*. Today the auditor is
pointed at the wrong baseline (the main checkout, which lags/diverges in parallel runs → false findings), and the
default config merges the happy path on a **single lens** despite the README's "independent, unanimous, multi-lens
panel." This is the final remediation plan (v0.6.5 — last of the stacked series).

**Scope (v0.6.5 — audit behavior change):**

> **Baseline-drift + ratification note (2026-06-25 red-team):** drafted at "v0.7.0"; this is the LAST of the stacked
> remediation plans (on v0.6.4), so the release is **v0.6.5** (per-plan +0.0.1). Other notes:
> (a) `auditPrompt`'s main-checkout/BASELINE lines are at **~154-158** (not the cited :150-151) — drifted post plans
> 1-4; extract by construct. (b) **F03 → narrow-git-Bash auditor (NOT spec D2's refiner DiffResult artifact)** and
> **F06 → full panel at `deep` always (NOT spec F06-D3's neighbors-default)** are RATIFIED operator overrides — the
> red-team confirms both as documented, intentional deviations (back-port the reversals into the F03/F06 specs); no
> `DiffResult` schema; three-dot diff. (c) The auditor read-only-git guard was PROVEN buildable (47-case prototype on
> bash 3.2.57) — see Task 2's hardened guidance.
- **F03** (HIGH) — pin the auditor's baseline to the **integration branch** (merge-base, three-dot), and let the
  **auditor compute the diff itself** via a narrow read-only git capability.
- **F06** (MED) — default audit = the **full 3-lens panel** (`correctness` + `cascading-impact` +
  `plan-faithfulness`), unanimous, at **`deep`** depth.

**Operator decisions (2026-06-25, grill-with-docs):**
- **F03 → auditor self-serves the diff via narrow git-Bash** (spec's recorded alternative, *not* D2). The auditor
  gains `Bash` limited to **read-only git** by a fail-closed `PreToolUse: Bash` guard; it runs
  `git diff ${integrationBranch}...${task.branch}` itself each round. **No `computeDiff` refiner spawn, no
  `DiffResult` artifact.** Trade-off accepted: cheaper / fewer spawns, but the auditor's read-only-ness is now
  partly **hook-enforced** (the git allowlist) rather than purely allowlist-by-construction — flagged for `/red-team`.
- **F06 → full panel at `deep` always.** `covenPolicy: 'auto' → 'all'`; every task is a 3-seat coven; depth stays
  coupled to coven, so every panel runs `deep` (the existing `task.coven ? 'deep' : 'neighbors'` rule needs **no
  change** — economy's solo seat stays `neighbors`). Maximum rigor on the happy path; cost note below.

**Audit-depth vocabulary** (the codebase defines exactly two — [war-auditor.md:15](../../agents/war-auditor.md)):
`neighbors` = the diff + one hop (what changed lines directly reference); `deep` = trace impact wherever the changed
symbols are used (transitive). F06 keeps every panel at `deep`.

**Architecture:** both findings touch the audit region of `workflow-template.js` (`auditPrompt`/`auditRound`) and
its agent/config surfaces. F03 changes the auditor's capability + prompt; F06 changes the default config + extends
the F07 drift guard (which **Plan 2 must land first**). The auditor stays read-only: files via the `Read/Grep/Glob`
allowlist + the existing worktree-scope hard-deny on `Write|Edit`, and now **git via a read-only Bash guard**.

**Dependency:** assumes **Plan 2 (F07/F12)** has landed — F06 D5 extends F07's behavioral drift guard, and the gate
uses F12's multi-runner resolution. Also composes with **Plan 1's F04** (auditor anti-cheat wording) — same
`auditPrompt`; Plan 1 lands first.

**Tech stack:** agent markdown; ESM `workflow-template.js` + `war-config.mjs` with `node --test`; POSIX `sh` hook on
macOS bash 3.2.57 (payload via `jq`) + `hooks/*.test.sh`.

**Gate (for `/war`):** full multi-runner (F12 lesson). Quote the node glob (unquoted under-covers on bash 3.2) and
**self-discover** the bash suites so the **new** `validate-auditor-git.test.sh` (added by T2) is picked up
automatically once it exists (the explicit enumeration would fail the gate before T2 creates it):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [F03](../specs/2026-06-25-F03-auditor-diff-artifact-design.md),
[F06](../specs/2026-06-25-F06-default-audit-breadth-design.md); roadmap [here](2026-06-25-audit-remediation-roadmap.md).
Memory: `audit-baseline-must-pin-integration-branch-not-main-checkout`, `auditor-cannot-execute-the-tests-it-must-verify-pass`.

## Build order (for `/war`)

- **Phase 1 — F03 auditor self-served diff:** T1 (auditor computes the diff; auditPrompt drops the main-checkout
  baseline) → T2 (fail-closed auditor read-only-git Bash guard).
- **Phase 2 — F06 full panel default:** T3 — flip `covenPolicy`, presets, drift guard, docs. Depends on T1 (shared
  `workflow-template.js`) + Plan 2's drift guard.
- **Phase 3 — Release:** T4 — v0.6.5.

---

## Phase 1 — F03 auditor self-served diff (pinned to the integration branch)

### Task 1: Auditor computes its own diff; drop the main-checkout baseline

**Files:** Modify `agents/war-auditor.md` (tools + inputs), `skills/war/assets/workflow-template.js` (`auditPrompt`),
`skills/war/references/schemas.md`; Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1: Write failing tests** (structural — assert the emitted `auditPrompt` text)
  - The prompt instructs the auditor to run `git diff ${ph.integrationBranch}...${task.branch}` (three-dot =
    merge-base..head = what the task added) as the authoritative change set.
  - The prompt **no longer** contains the "main repo checkout" / "compare against the baseline copies" prose (D4).
  - `war-auditor.md` frontmatter lists `Bash`; its inputs say the auditor **computes** the diff (not "path provided").
- [ ] **Step 2: Run gate → fail** (the auditPrompt main-checkout BASELINE lines — at **~154-158**, drifted from the
  cited :150-151; find by construct — still name the main checkout as baseline).
- [ ] **Step 3: Implement**
  - `auditPrompt`: replace the BASELINE/main-checkout lines with: "Run `git diff ${ph.integrationBranch}...${task.branch}`
    (three-dot — exactly what this task added since it branched) for the authoritative change set; re-run it each round
    (a fix-worker may have pushed). Then read candidate files under `${task.worktree}/` for neighbor/`deep` context."
    `ph.integrationBranch` and `task.branch` are both in template closure scope (no new auditPrompt parameter needed).
    **Steer the auditor to ALLOWLIST-SAFE git forms** (Task 2's fail-closed guard permits only chars `[A-Za-z0-9 ./_=:,@^-]`):
    prefer `--name-status`, `--stat`, `--format=oneline`, `A...B`, `HEAD^`; AVOID `%`-format strings (`--pretty=format:%H`)
    and `@{}` reflog syntax (those would be denied by the guard).
  - `war-auditor.md`: frontmatter `tools: Read, Grep, Glob, Bash`; reword the diff input from "path provided" to
    "compute it yourself with read-only git (`git diff <integrationBranch>...<task.branch>`); you may run **only**
    read-only git — a guard denies anything else."
  - `schemas.md`: clarify `AuditVerdict.tests_verified` (existence/integrity, not execution — alongside F04); remove
    any `DiffResult` artifact reference (the auditor self-serves; no artifact).
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): auditor computes its own integration-branch diff (three-dot), drop main-checkout baseline (F03)"`

### Task 2: Fail-closed auditor read-only-git Bash guard

**Files:** New `hooks/validate-auditor-git.sh` + `hooks/validate-auditor-git.test.sh`; Modify `hooks/hooks.json`
(register `PreToolUse: Bash`).

- [ ] **Step 1: Write failing tests** (new `.test.sh`)
  - `agent_type` = `*war-auditor*`, command `git diff main...feature` → **allow** (exit 0). Likewise `git log`,
    `git show`, `git merge-base`, `git rev-parse`, `git status`, `git ls-files`, `git cat-file`, `git blame`.
  - **Deny** (exit 2): a write/chaining/redirect — `git push`, `git commit …`, `git diff > /tmp/x`,
    `git log; rm -rf x`, `git diff && curl …`, `rm -rf /`, `python -c …`, any non-git command, any command with
    shell metacharacters (`; | & > < $` backtick).
  - Non-auditor `agent_type` (worker / refiner / main / absent) → **exit 0** (no-op; this guard is auditor-only).
- [ ] **Step 2: Run gate → fail** (hook absent).
- [ ] **Step 3: Implement** — `PreToolUse: Bash`; if `agent_type` ~ `*war-auditor*`: **allow iff** the command is a
  single `git <read-subcommand> …` from the allowlist with **no** shell metacharacters (fail-closed — deny on any
  doubt); else `deny` (exit 2). Other agent types → exit 0. macOS bash 3.2.57 constraints; payload via `jq`.
  **Register in `hooks.json` by APPENDING a SECOND `{matcher:"Bash"}` block (guard first), NOT overwriting plan 4's
  existing `warn-bash-write-scope.sh` Bash entry — the red-team verified two Bash matchers coexist (valid JSON; both
  fire; an auditor `git push` → guard exit 2 = DENIED; `git diff` → both exit 0 = allowed).**
  **Hardened implementation guidance (from the red-team's 47-case bash-3.2 prototype — adopt this shape):**
  - Use a **fail-closed CHARACTER ALLOWLIST**, not a metachar denylist: permit only `[A-Za-z0-9 ./_=:,@^-]` and deny
    on the first char outside it (e.g. `LC_ALL=C tr -d '<allowlist>'` residue check). A bracket-class `case` pattern
    mixing backtick + quotes throws `unexpected EOF` on bash 3.2 (the script crashes, exiting non-zero).
  - Do **NOT** rely on command substitution to materialize a bare newline for matching — bash 3.2 strips trailing
    newlines from `$(...)`, yielding an empty pattern that matches EVERY command (denies all legit cases).
  - **"Pager option" = GLOBAL pager controls only** (leading `-p`, `--paginate`, `--no-pager`, `--pager=`) — do NOT
    blanket-deny `-p`: the subcommand-local `-p` (`git cat-file -p`, `git show -p`, `git log -p`) is read-only and must
    be ALLOWED. Also deny global `-c` and `--output`/`-o`.
  - **Test-design (critical):** in the `.test.sh`, assert deny by a SPECIFIC deny message/marker on stderr, NOT merely
    `exit != 0` — a syntax-errored/crashed hook also exits non-zero and would false-PASS a deny case.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): fail-closed read-only-git Bash guard for the auditor (F03 confinement)"`

---

## Phase 2 — F06 full 3-lens panel default

### Task 3: Default `covenPolicy: 'all'` (full panel, deep); presets, drift guard, docs

**Files:** Modify `skills/war/assets/war-config.mjs` (DEFAULTS + PRESETS), `README.md`, `skills/war-room/SKILL.md`,
`docs/specs/2026-06-18-war-room-design.md`, `skills/war/references/schemas.md`; Test
`skills/war/assets/war-config.test.mjs` (+ confirm `workflow-template.js` default-coven path).

- [ ] **Step 1: Write failing tests**
  - **Default = full panel:** `fillDefaults({})` → `audit.covenPolicy === 'all'`; `covenSeats(DEFAULTS, {coven:true})`
    returns 3 seats (`correctness`, `cascading-impact`, `plan-faithfulness`).
  - **Presets:** `economy` stays `covenPolicy: 'solo'`; `thorough` stays `'all'`; `balanced` (= DEFAULTS) is now `'all'`.
  - **Depth unchanged:** `covenSeats`-driven coven task → template selects the full panel at `deep`; a `solo`
    (economy) task → single seat at `neighbors`.
  - **Drift (extends Plan 2 / F07):** the template's inline lens selection under a coven task `deepEqual`s
    `covenSeats(config{covenPolicy:'all'}, task)`.
- [ ] **Step 2: Run gate → fail** (`DEFAULTS.audit.covenPolicy === 'auto'`).
- [ ] **Step 3: Implement**
  - `war-config.mjs`: `DEFAULTS.audit.covenPolicy: 'auto' → 'all'` (line ~31; update the war-config.test.mjs default
    assertion ~line 47 from `'auto'` to `'all'`); confirm `economy` keeps its explicit `audit.covenPolicy: 'solo'`
    (deepMerge override — unaffected by the DEFAULT flip). **No depth-logic change** — `task.coven ? 'deep' : 'neighbors'`
    already yields `deep` for every (now-coven) task. **Mechanism (red-team-confirmed):** `covenSeats` does NOT branch
    on `covenPolicy`; it operates on the pre-seeded `task.coven` boolean. The flip takes effect because the **Lead**
    seeds `task.coven=true` from `covenPolicy:'all'` (existing SKILL.md seeding) — so no `covenSeats`/template logic
    change is needed; the F07 drift guard just gains assertion rows for the `covenPolicy:'all'` case (existing
    extract-and-deepEqual architecture covers it).
  - `README.md`: the "independent, unanimous, multi-lens panel" claim is now accurate (state it plainly).
  - `war-room` SKILL + design doc: default copy ("balanced = full 3-lens panel at deep; economy = solo").
  - `schemas.md`: document the new `covenPolicy` default + a **cost note** (balanced now spawns 3 deep auditor seats
    per task on the happy path; budget accordingly; `economy` for cost-sensitive runs).
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): default audit = full 3-lens panel at deep (covenPolicy all); economy stays solo (F06)"`

---

## Phase 3 — Release & verify

### Task 4: Version bump v0.6.5 + full multi-runner gate green

**Files:** the README-documented bump list.

- [ ] **Step 1:** Bump to **v0.6.5** (patch over the stacked v0.6.4) across the COMPLETE bump list:
  `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` AND `plugins[0].version`
  (do NOT omit — stale = silent-no-op release), README `## Status` (REPLACE-in-place; "Builds on v0.6.4" lineage ok).
  README has no version *badge* — bump only the slots that exist.
- [ ] **Step 2:** Run the **full** self-discovering gate (quoted node glob + ALL `*.test.sh` incl. the new
  `validate-auditor-git.test.sh` — should be 7 suites now) → green.
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.6.5 — audit fidelity (integration-branch diff, full 3-lens panel)"`

---

## Notes / conscious deviations (ratify in `/red-team`)

- **F03 chose the narrow-git-Bash auditor (not the refiner artifact, D2).** Cheaper (no per-round refiner spawn),
  but it **erodes read-only-BY-CONSTRUCTION**: the auditor's git read-only-ness is now enforced by the fail-closed
  Bash guard (heuristic, like F01's caution about Bash hooks) rather than a pure capability allowlist. Mitigations:
  the allowlist is *tiny* (read-only git only) so the guard is far more tractable than general write-detection, and
  Write/Edit stay hard-denied by the worktree-scope hook. **Back-port this reversal into the F03 spec.**
- **F06 chose `deep` always** (not neighbors-default). Achieved with **no depth-logic change** (coven⇒deep already);
  the cost is a tripled, deepest audit on every happy-path task — documented as a budget note; `economy` is the
  cost-sensitive escape.
- **No `DiffResult` schema** (the auditor self-serves) — supersedes F03 D2/D3's artifact contract.
- **Three-dot diff** (`A...B` = merge-base..B) per F03 open-decision #1.
- **Ordering:** depends on Plan 2's F07 drift guard (extended here) and composes with Plan 1's F04 auditPrompt reword.

## Open decisions — RESOLVED by `/red-team` (2026-06-25, `--afk` autonomous adjudication)

1. **Auditor Bash-guard robustness → fail-closed CHARACTER ALLOWLIST.** The guard permits ONLY `[A-Za-z0-9 ./_=:,@^-]`
   and denies on the first char outside it — structurally rejecting every chaining/redirect/substitution path
   (`; | & > < ` `$()` backtick newline). It also denies global `-c`, `--output`/`-o`, and global pager controls
   (leading `-p`, `--paginate`, `--no-pager`, `--pager=`) — but NOT the subcommand-local `-p` (cat-file/show/log
   patch view, read-only). Proven against the bypass set by the red-team's 47-case bash-3.2 prototype (all pass).
2. **`deep`-always cost → accept for `balanced`.** Maximum rigor on the happy path is the intent; `economy` (solo,
   neighbors) is the documented cost-sensitive escape. schemas.md carries the cost note. No extra guardrail.
3. **Release granularity → v0.6.5, standalone** (patch over the stacked v0.6.4; the final plan in the series).
