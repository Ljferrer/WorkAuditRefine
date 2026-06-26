# Servitor Confinement & Memory Implementation Plan (F01 · F05 + #58)

**Goal:** make WAR's confinement guarantees *true*, not prompt-deep, and give the servitor a real memory-admission
policy. Today the servitor's "physically confines your writes" is false on the Bash path (it holds full Bash that
bypasses the `Write|Edit|NotebookEdit` scope hook), and it writes persistent memory with no dedup/correction/verify
discipline.

**Scope (v0.6.4 — agent tool-surface change):**

> **Baseline-drift note (2026-06-25 red-team):** drafted at v0.5.1; STACKS on plans 1-3 (v0.6.1-v0.6.3), so the
> release is **v0.6.4** (per-plan +0.0.1; the original "v0.6.0 minor" framing predates the stack). Other drift:
> the Wrap-up servitor prompt in `workflow-template.js` is at **~420-426** (not the cited 310-317; the F05 spec's
> `:310-317` cite is likewise stale → back-port). T4's reword must cover MORE than war-servitor.md: the red-team
> found servitor-confinement-attributed-to-the-hook claims ALSO in `skills/war/SKILL.md` (×2), `references/schemas.md`,
> `references/design.md`, and `workflow-template.js:421` (the Wrap-up prompt) — make T4 grep-driven over the whole
> live surface, not a fixed file list.
- **F01** (HIGH) — servitor confinement becomes real via a `tools:` allowlist (drop Bash); worker keeps Bash but
  gets honest docs **and** a best-effort Bash-write **warn-hook** (operator chose to build it, F01 D4); reword the
  "physically confined" claims to attribute confinement to the allowlist, not the hook.
- **F05** (MED) — a servitor memory-admission checklist (dedup-before-write, correction priority, verify-cue, index
  hygiene), aligned to the main assistant's MEMORY.md protocol.
- **#58** — harden the worktree-scope hook's glob: **reject `..`** on the gated write paths (servitor *and* worker —
  the traversal hole is identical in both branches).

**Operator decision (2026-06-25, grill-with-docs):** **F01 D4 → BUILD** the worker Bash-write advisory. It is
**non-blocking and best-effort** — ADR 0002 ratified exact bash-write confinement as *unattainable* (probe E1), so
it must be documented as *advisory, not a guarantee*; it raises visibility of sibling/parent writes, the auditor's
review remains the real backstop.

**Issue provenance:** [#58](https://github.com/Ljferrer/WorkAuditRefine/issues/58) (servitor write-scope: anchor
+ reject `..`) folds in here per its disposition (orthogonal to F01: F01 closes the **Bash** path via allowlist,
#58 hardens the **Write/Edit** glob). Close #58 on land. Full memory-root *anchoring* (vs `..`-rejection) needs a
memory-root env threaded into the hook — **deferred** per #58's own "Part B candidate / and-or" framing.

**Architecture:** confinement is enforced two ways (ADR 0002): a **capability allowlist** (real — the harness can't
grant a tool not listed) and the **PreToolUse scope hook** (gates `Write|Edit|NotebookEdit` by `agent_type`). F01
moves the servitor from hook-only (leaky on Bash) to allowlist (airtight); #58 hardens the hook for the agents that
still flow through it (worker Write/Edit). The new warn-hook is a third, **advisory** layer on the worker's Bash.

**Tech stack:** agent markdown frontmatter; POSIX `sh` hooks on macOS bash 3.2.57 (no globstar/assoc-arrays/`${,,}`),
payload via `jq`; the existing `hooks/*.test.sh` harness; ESM `workflow-template.test.mjs` for the wrap-up prompt.

**Confirmed safe (read during grilling):** `agents/war-servitor.md` does **only** Read/Glob/Write/Edit (read
MEMORY.md, glob the memory dir, write files) — **no git, no Bash** — so dropping Bash cannot break it. Allowlist =
**`Read, Grep, Glob, Write, Edit`** (Grep added vs the spec's list — read-only, no confinement risk, materially aids
F05 dedup "find the covering file").

**Gate (for `/war`):** the full multi-runner command (F12 lesson). Quote the node glob (unquoted under-covers on
bash 3.2 — and `workflow-template.test.mjs` sits at depth 2) and **self-discover** the bash suites so the **new**
`warn-bash-write-scope.test.sh` (added by T3) is picked up automatically once it exists (the explicit enumeration
below would fail the gate *before* T3 creates that file):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [F01](../specs/2026-06-25-F01-bash-scope-gap-design.md),
[F05](../specs/2026-06-25-F05-servitor-memory-admission-design.md), [ADR 0002](../adr/0002-scope-by-agent-type.md);
roadmap [here](2026-06-25-audit-remediation-roadmap.md). Memory: `scope-hook-blind-to-bash-write-path`,
`scope-hook-servitor-pattern-residuals`, `auditor-cannot-execute-the-tests-it-must-verify-pass`.

## Build order (for `/war`)

- **Phase 1 — confinement (F01 core + #58):** T1 servitor allowlist → T2 hook `..`-rejection → T3 worker warn-hook.
- **Phase 2 — doc honesty (F01 D2/D3):** T4 — reword the "physically confined" claims + clean-surface grep.
- **Phase 3 — memory admission (F05):** T5 — admission checklist + wrap-up prompt + structural tests.
- **Phase 4 — release:** T6 — v0.6.4; close #58.

> war-servitor.md is edited by T1 (allowlist), T4 (reword), T5 (checklist) — all serial (same file).

---

## Phase 1 — Confinement (F01 core + #58)

### Task 1: F01 D1 — servitor capability allowlist (drop Bash)

**Files:** Modify `agents/war-servitor.md` (frontmatter); Test `hooks/validate-worktree-scope.test.sh` (note: servitor
now confined by capability) + a structural assertion.

- [ ] **Step 1: Write failing test** — a structural test asserting `war-servitor.md` frontmatter has
  `tools: Read, Grep, Glob, Write, Edit` and does **not** grant Bash. (Harness tool-denial itself isn't unit-testable;
  pin the contract in the doc.)
- [ ] **Step 2: Run gate → fail** (no `tools:` line today).
- [ ] **Step 3: Implement** — add `tools: Read, Grep, Glob, Write, Edit` to `war-servitor.md` frontmatter.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): servitor capability allowlist — drop Bash, confinement now real (F01 D1)"`

### Task 2: #58 — hook rejects `..` on gated write paths

**Files:** Modify `hooks/validate-worktree-scope.sh`; Test `hooks/validate-worktree-scope.test.sh`.

- [ ] **Step 1: Write failing tests**
  - **Servitor:** a learnings path containing `..` (e.g. `/x/docs/learnings/../../etc/foo`) → **deny** (exit 2),
    even though the bare glob matches.
  - **Worker:** a worktree path containing `..` that resolves outside the `.war-task` dir but whose literal dirname
    chain hits a `.war-task` ancestor → **deny**.
  - Regression: clean (no-`..`) servitor + worker paths still allowed.
- [ ] **Step 2: Run gate → fail** (no `..` guard today).
- [ ] **Step 3: Implement** — before the per-agent path checks (worker + servitor branches), if `path` contains a
  `..` segment → `deny` with a hint. (Self-contained; full memory-root anchoring deferred — see open decisions.)
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): worktree-scope hook rejects '..' traversal on servitor+worker write paths (#58)"`

### Task 3: F01 D4 — worker Bash-write advisory warn-hook (non-blocking)

**Files:** New `hooks/warn-bash-write-scope.sh` + `hooks/warn-bash-write-scope.test.sh`; Modify `hooks/hooks.json`
(register `PreToolUse: Bash`).

- [ ] **Step 1: Write failing tests** (new `.test.sh`)
  - `agent_type` = `*war-worker*`, command `sed -i … /outside/file` (no `.war-task` ancestor) → **warns** (stderr
    non-empty) and **exits 0** (never blocks).
  - A redirection `echo x > /outside/f`, `tee /outside/f`, `git -C /other/worktree …`, `cp … /outside/` → warns.
  - A write **inside** a `.war-task` dir → silent (no warning), exit 0.
  - A non-write command (`ls`, `git status`, `node --test`) → silent, exit 0.
  - Non-worker `agent_type` (refiner / main / absent) → silent, exit 0 (advisory is worker-only).
- [ ] **Step 2: Run gate → fail** (hook absent).
- [ ] **Step 3: Implement** — a conservative, **low-false-positive** detector over `.tool_input.command`: redirections
  (`>`,`>>`,`tee`), in-place edits (`sed -i`,`perl -i`), `git -C <dir>`, `cp`/`mv`/`install`/`dd of=`; resolve the
  obvious target(s) and warn if none of its ancestors holds `.war-task`. **Always exit 0** (emit the advisory via a
  PreToolUse `allow` decision + `systemMessage`, or stderr). Document it as **best-effort, not a guarantee** (opaque
  cases like `python -c "open(...)"` are accepted misses). Register in `hooks.json`.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): advisory PreToolUse:Bash warn-hook for worker out-of-worktree writes (F01 D4)"`

---

## Phase 2 — Doc honesty (F01 D2/D3)

### Task 4: Reword the confinement claims; clean-surface grep

**Files:** Modify (GREP-DRIVEN — the clean-surface grep is the source of truth, NOT a fixed list): `agents/war-servitor.md`
(description + body), `agents/war-worker.md` (residual prose), `docs/adr/0002-scope-by-agent-type.md`, `README.md`
(if it repeats the claim), `hooks/validate-worktree-scope.sh` (comment), **AND the additional servitor-confinement
sites the red-team found: `skills/war/SKILL.md` (×2 — manual-land spawn + invariants), `skills/war/references/schemas.md`,
`skills/war/references/design.md`, and `skills/war/assets/workflow-template.js:421` (the Wrap-up prompt's "the
worktree-scope hook confines you" line)**; Test `hooks/clean-surface-war-worktree.test.sh` (extend) or a new grep.
**Note:** workflow-template.js:421 is also touched by T5 (Wrap-up admission checklist) — serial, same file.

- [ ] **Step 1: Write failing test** — a clean-surface grep (exclude `*.test.*`, load-bearing) asserting **no**
  live-surface site claims the *hook ALONE* confines the **servitor** (esp. the overstated "physically confines"):
  post-F01 the servitor's confinement is the **capability allowlist** (it holds no Bash, so its only write path is
  Write/Edit, which the hook then gates) — every site must attribute it to the allowlist (with the hook gating the
  residual Write/Edit), not to the hook alone. Grep the WHOLE live surface (skills/ agents/ hooks/ README docs/adr),
  so the SKILL.md/schemas.md/design.md/workflow-template.js sites are caught too — reword **every** flagged site.
- [ ] **Step 2: Run gate → fail** (war-servitor.md:3,11 say "physically confines … the worktree-scope hook", and
  SKILL.md/schemas.md/design.md/workflow-template.js:421 attribute the servitor's confinement to the hook alone).
- [ ] **Step 3: Implement** — D3 reword: servitor description + body attribute confinement to the **tools allowlist**;
  worker prose states the accepted sibling-/parent-write residual (mitigated by absolute-path prompts + auditor review
  + the advisory warn-hook); ADR 0002 + README match; update the hook's "Bash slipped through … always allowed"
  comment to note the servitor no longer holds Bash.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "docs(war): attribute confinement to allowlist not hook; state worker residual honestly (F01 D2/D3)"`

---

## Phase 3 — Memory admission (F05)

### Task 5: Servitor memory-admission checklist

**Files:** Modify `agents/war-servitor.md` (admission checklist), `skills/war/assets/workflow-template.js` (Wrap-up
prompt, **~`:420-426`** — drifted from the cited `:310-317`; the F05 spec's `:310-317` cite at its line 10 is likewise
stale → back-port; find by construct: the `war-servitor` agent() call in the WRAP-UP section); Test
`skills/war/assets/workflow-template.test.mjs` (wrap-up prompt) + a doc structural test.

- [ ] **Step 1: Write failing tests** (structural — F05 is prompt-layer)
  - The Wrap-up prompt **and** `war-servitor.md` instruct: **dedup before write** (Glob memory dir + read MEMORY.md +
    read candidates → update an existing covering file, don't duplicate); **correction priority** (a contradicting
    fact supersedes the stale file; user corrections outrank agent assertions); **verify-cue** (a fact naming a
    file/flag/line is phrased as a durable learning with "verify still present before acting"); **index hygiene**
    (update the MEMORY.md row in place; `[[slug]]` cross-links).
  - The checklist **mirrors** the rules in the MEMORY.md header (D5 alignment).
- [ ] **Step 2: Run gate → fail** ("capture signal not noise" is the only discipline today).
- [ ] **Step 3: Implement** — add a "Memory admission" checklist to `war-servitor.md` and the matching short checklist
  to the Wrap-up prompt. (Inlined in `war-servitor.md` — no separate `servitor-memory.md` file, keeping it one place.)
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): servitor memory-admission discipline — dedup, correction priority, verify-cue, index hygiene (F05)"`

---

## Phase 4 — Release & verify

### Task 6: Version bump v0.6.4 + full multi-runner gate green

**Files:** the README-documented bump list.

- [ ] **Step 1:** Bump to **v0.6.4** (patch over the stacked v0.6.3) across the COMPLETE bump list:
  `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` AND `plugins[0].version`
  (do NOT omit — stale = silent-no-op release), README `## Status` (REPLACE-in-place; "Builds on v0.6.3" lineage ok).
  README has no version *badge* — bump only the slots that exist.
- [ ] **Step 2:** Run the **full** self-discovering gate (quoted node glob + ALL `*.test.sh` incl. the new
  `warn-bash-write-scope.test.sh`) → green.
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.6.4 — servitor confinement (allowlist), worker Bash advisory, memory admission, '..' hardening"`
- [ ] **Step 4:** Close issue #58 (residual landed) with a pointer to this plan's commits.

---

## Notes / conscious deviations (ratify in `/red-team`)

- **Allowlist adds Grep** vs the F01 spec's `Read, Write, Edit, Glob` — read-only, no confinement risk, aids F05
  dedup. Back-port into the F01 spec.
- **F01 D4 = BUILD** (operator) — but **advisory, non-blocking, best-effort**; never block a worker; documented as
  not-a-guarantee (ADR 0002). The auditor remains the real backstop.
- **#58 = `..`-rejection on both gated branches** (servitor + worker — identical hole); full memory-root *anchoring*
  deferred (needs a root env). `agent_type` substring match left as-is (over-match → more restriction = fail-safe).
- **F05 is prompt-layer** (no code-gate) — proportionate; the discipline is tested structurally (prompt/doc greps),
  not by scanning the live (out-of-repo) MEMORY.md.
- war-servitor.md serial edits across T1/T4/T5 — by design (same-file tasks serialize).

## Open decisions — RESOLVED by `/red-team` (2026-06-25, `--afk` autonomous adjudication)

1. **Warn-hook surfacing → stderr + exit 0** (proven feasible by the red-team prototype). Optionally also emit a
   PreToolUse `allow`-decision `systemMessage`; both are non-blocking. Keep it simple: stderr + always exit 0.
2. **Warn-hook false-positive budget → accept best-effort** (it's advisory; the auditor is the real backstop). Do
   avoid the obvious false-positives the prototype hit (a quoted `>` / `[ "$x" = ">" ]` comparison, `node --test`),
   but opaque writes (`python -c open(...)`) are accepted misses.
3. **#58 full anchoring → `..`-rejection only now** (defer memory-root anchoring to a later hardening pass; needs a
   root env threaded into the hook).
4. **F05 dedup lint for `docs/learnings/` → defer** (structural prompt tests suffice).
5. **Cross-plan (NEW): hooks.json PreToolUse:Bash is shared with plan 5 (audit-fidelity).** The red-team found plan 5
   also adds a `PreToolUse:Bash` hook. This plan's T3 adds the FIRST `PreToolUse:Bash` entry; plan 5 (stacked on this)
   must **append** to that array, not overwrite it. Flagged for plan 5's red-team.
