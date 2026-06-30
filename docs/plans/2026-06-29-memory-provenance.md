# Memory provenance — stop unverified agent monologue from calcifying as fact Implementation Plan (audit finding M3)

**Goal:** the servitor distills LLM-authored auditor rationale + escalation text (`JSON.stringify(auditLog)` +
`JSON.stringify(escalated)`) into durable memory files with **no write-time verification**, and those files
auto-inject into every future session as recalled "fact." The D1–D4 admission checklist is **100% prompt-enforced**;
the scope hook gates the write *path*, never *content*. M3 is **not** about verifying truth (semantic truth isn't
code-gateable — the servitor can't run the gate). It is about **provenance**: making each fact's (un)verified-ness
**legible and consequential** for recall-weighting and correction, via a single 3-tier ladder
(`agent-unverified` < `code-verified` < `user-confirmed`) plus a **structural** PreToolUse gate that proves a
provenance tag is *present* (never that it is *honest*).

**Source spec:** [`docs/specs/2026-06-29-memory-provenance-design.md`](../specs/2026-06-29-memory-provenance-design.md).
**ADR:** [`0007-memory-provenance.md`](../adr/0007-memory-provenance.md) (**already written + accepted**).
**CONTEXT.md** terms (Memory provenance / Verify-on-write) are **already landed** — not in scope.

**The ladder is the spine:** it is simultaneously the recall-weight order, the correction-precedence order
(higher tier supersedes lower), and the verify-on-write outcome. One vocabulary, three jobs.

**Position in the stack:** M3 is **third** (after M2, on M2's tip), owns **v0.7.5** off the v0.7.4 baseline. T3 touches
`workflow-template.js` (the wrap-up prompt string), so M3 re-anchors on M2's tip by named construct (memory
`plan-line-number-refs-stale-use-construct-locator`).

## Build order (for `/war`)

- **Phase 1 — the structural gate:** T1 (the PreToolUse hook + test + wiring — independent, `hooks/` only).
- **Phase 2 — standing prompt discipline:** T2 (`war-servitor.md`).
- **Phase 3 — dispatched prompt discipline:** T3 (the `workflow-template.js` wrap-up restatement). **deps T2 — T3
  mirrors T2's directives** (directive-parallel; closes the coverage-split footgun the 3-way split reopens; see DP1).
  **Run SERIAL — Phase 3 starts only after Phase 2 lands:** T3 reads T2's *landed* `war-servitor.md`; the cross-phase
  dep is satisfied by Phase 3's integration base (which already contains T2), so T2/T3 are NEVER parallel tasks in one
  phase (one task per phase — memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).
- **Phase 4 — release:** T4 (v0.7.5).

T1 is disjoint from T2/T3 (hooks/ vs `.md`/`.js`); T3 is the only `workflow-template.js` touch, so no intra-plan
contention (memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

## Operator decisions — RESOLVED (2026-06-29, grill-with-docs)

- **DP1 — Decomposition: three tasks (hook / war-servitor.md / workflow-template.js wrap-up).** The operator chose to
  split the two prompt surfaces into separate tasks (over a combined prompt-discipline task) for independent audits.
  **This reopens the `standing-instruction-vs-dispatched-prompt-coverage-split` footgun** — the standing `war-servitor.md`
  and the dispatched `workflow-template.js` wrap-up restatement are **independent surfaces that must carry the SAME
  directives, or one silently lags.** The plan closes it deliberately: **T3 depends on T2 and mirrors its directives**,
  and the plan mandates a **parity check** at T3's audit. **"byte-parallel" / "byte-mirror" = directive-parallel**: the
  SAME directives (provenance-tagging + verify-on-write + absence-note + tier-precedence), **adapted to each surface's
  form** — standing prose in `war-servitor.md` vs a condensed dispatched restatement in the `workflow-template.js`
  template string — **NOT a byte-identical copy** (a verbatim copy of standing-prompt prose into a template string is a
  context mismatch — memory `verbatim-mirror-directive-context-mismatch-at-destination`). The parity check verifies
  **directive/semantic equivalence**, not byte-identity. *Rejected:* two tasks (one combined prompt-discipline task —
  the operator preferred granular audits);
  one task (mixes the testable hook with untestable prose).
- **DP2 — Test floor: T1 hook is code-tested (criteria #1-4); criteria #5-6 are prompt-level, prose/fixture-verified.**
  The hook's present/absent/tier/exempt/pass-through behavior is deterministic (`validate-servitor-provenance.test.sh`).
  Verify-on-write tiers (#5) and correction precedence (#6) are **servitor prompt discipline** — no deterministic gate
  (the gate is structural, not semantic; §5 risk). T1 `requiresTest=true`; T2/T3 `requiresTest=false`.
- **DP3 — Release: +0.0.1 → v0.7.5, implemented in order** (after M2's v0.7.4). Next free patch by construct if the
  stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — The structural provenance gate

### Task 1 — `validate-servitor-provenance.sh` PreToolUse hook + test + wiring (M3, hook)

**Files:**
- new `hooks/validate-servitor-provenance.sh` (§2.2) — a PreToolUse hook wired into the **existing**
  `Write|Edit|NotebookEdit` matcher (there is **no** standalone `Write` matcher in `hooks.json`). The hook
  **short-circuits to allow** unless `tool_name == "Write"` — so `Edit`/`NotebookEdit` pass through untouched (an
  `Edit` payload carries `old_string`/`new_string`, **not** `tool_input.content`; gating it would deny every servitor
  dedup-in-place `Edit` and `MEMORY.md` row-update). On a `Write` it is scoped to `agent_type` matching
  `*war-servitor*` **and** a `file_path` whose **exact basename** is not `MEMORY.md`
  (`[[ "$(basename "$fp")" == "MEMORY.md" ]]` — never a substring/glob, so `MEMORY.md.bak` or a `…/MEMORY.md/x`
  directory component is **not** exempted) **and** under the memory/learnings target. It parses `tool_input.content`
  frontmatter and extracts the **nested** `metadata.provenance` value (indented under `metadata:` — the real file
  shape, **not** a top-level `^provenance:` line); if that nested value is absent or ∉
  `{agent-unverified, code-verified, user-confirmed}` → **deny (exit 2)** naming the required field + the three tiers.
  **Exit-code discipline (load-bearing):** guard the extraction pipeline against `grep`'s no-match exit
  (`… | grep … || true`, or extract before re-asserting `set -e`) so a **tag-less** write reaches the deny arm and
  exits **2** — the only code that BLOCKS in the PreToolUse contract. A bare `set -euo pipefail` pipeline aborts at
  **exit 1** (non-blocking) and **fails OPEN** on the exact case the gate exists for (memory
  `floor-script-exit-codes-1-vs-2-route-differently`). `MEMORY.md` and any non-fact path are **exempt**; macOS bash
  3.2.57-compatible. **Gates `Write` only** (full content available); `Edit`/`NotebookEdit` are out of scope **by the
  `tool_name` guard, not by matcher choice** (a structural gate can't see an `Edit`'s merged result) — **documented,
  not silently skipped**.
- new `hooks/validate-servitor-provenance.test.sh` — cases (spec §3 surface-changes table for the test cases; spec §6
  for the criteria they satisfy): missing nested `metadata.provenance` → **deny, asserting the exact exit code 2**
  (not merely non-zero — memory `floor-script-exit-codes-1-vs-2-route-differently`); valid tier → allow; bad tier →
  deny(2); `MEMORY.md` index (exact basename) → allow; `tool_name: Edit` of a fact file → **pass-through (allow)**
  (the `tool_name` guard); non-`war-servitor` agent_type → pass-through; no-path → allow. Payloads built with
  `jq -nc --arg` in the **real nested shape** (`metadata:` → `provenance:`), never a top-level `provenance:` key
  (memory `printf-json-escaping-vacuous-test-case`, `frontmatter-tools-negation-check-single-line-only`).
- modify `hooks/hooks.json` — add the new hook to the **existing** `Write|Edit|NotebookEdit` PreToolUse matcher (no
  standalone `Write` matcher exists; the hook's internal `tool_name == "Write"` guard makes this safe — `Edit`/
  `NotebookEdit` short-circuit to allow).

**`requiresTest`: true** — the `.test.sh` is the hook's mapped test; covers criteria #1-4.

- [ ] **Step 1 — Write `validate-servitor-provenance.test.sh` (failing first).** Construct PreToolUse payloads with
  `jq -nc --arg` (memory `printf-json-escaping-vacuous-test-case` — never `printf '%s'` a JSON payload, double-quotes
  in content break it and the test goes vacuous) in the **real nested shape** (`metadata:` → `provenance:`), never a
  top-level `provenance:` key. Cover all cases above — including the **`tool_name: Edit` pass-through** and the
  **exact-exit-2 assertion** on the tag-less case (assert `== 2`, not merely non-zero — memory
  `floor-script-exit-codes-1-vs-2-route-differently`). Extract the **nested `metadata.provenance` value** from the
  full frontmatter block (indented under `metadata:`), not a single `grep '^provenance:'` line (memory
  `frontmatter-tools-negation-check-single-line-only`). Match `agent_type` as the documented servitor pattern.
- [ ] **Step 2 — Run `bash validate-servitor-provenance.test.sh` → fail** (hook absent).
- [ ] **Step 3 — Implement the hook** (bash 3.2), in order: (1) short-circuit **allow** unless `tool_name == "Write"`;
  (2) exempt if `agent_type` ≠ `*war-servitor*`, no `file_path`, **exact-basename** `MEMORY.md`, or path outside the
  target; (3) extract the **nested** `metadata.provenance` value, **guarding the pipeline against grep's no-match exit**
  (`… || true`, so a tag-less write does not abort at exit 1 under `set -euo pipefail`); (4) tier-membership check on
  the extracted value → **exit 2** on absent/out-of-tier with a field+tiers message. `// ponytail:` comment naming the
  structural-not-semantic ceiling (the gate proves the tag is *present*, never *honest* — §5), the `Edit`
  out-of-scope (handled by the `tool_name` guard), and the **load-bearing `|| true`** (exit-2-must-block — memory
  `floor-script-exit-codes-1-vs-2-route-differently`).
- [ ] **Step 4 — Wire `hooks.json`** — add the hook to the **existing** `Write|Edit|NotebookEdit` matcher (no
  standalone `Write` matcher; the internal `tool_name == "Write"` guard makes `Edit`/`NotebookEdit` pass through).
- [ ] **Step 5 — Run the full self-discovering gate → green.**
- [ ] **Step 6 — Commit** — `feat(war): structural validate-servitor-provenance.sh gate — deny tag-less servitor fact writes (M3)`
- **Closes:** the structural gate (§2.2; criteria #1-4). The prompt that makes the servitor populate the tag is T2/T3.

---

## Phase 2 — Standing prompt discipline

### Task 2 — `war-servitor.md` provenance tagging + verify-on-write + tier precedence (M3, standing prose)

**Files:**
- modify `agents/war-servitor.md` (§2.3) — (a) **tag provenance** on every write (default `agent-unverified` — the
  input *is* monologue) using **only** the three canonical tiers; **retire the legacy `agent-observed` value** — treat
  it as `agent-unverified` (same tier: agent-asserted, not code/user-confirmed) and never emit it going forward (the
  gate's allowed set is exactly the three tiers; legacy values are remapped at write time, **not** widened into the
  set — preserving the clean ladder); (b) **verify-on-write** (extends D3): before recording a fact naming a file/flag/symbol,
  Read/Grep to confirm it exists — found → `code-verified` + cue, absent → keep `agent-unverified` + an
  **absence-note** ("referent not found @ phase X — verify before acting"); (c) **correction (reframe D2)** as **tier
  precedence** — never overwrite a higher-tier fact with a lower-tier one; `user-confirmed` outranks any agent write;
  (d) **document the `metadata.provenance` frontmatter field** in the frontmatter-format section (it sits under
  `metadata:` next to `type:`; do **not** assume a literal `metadata.type` anchor already exists in `war-servitor.md` —
  introduce the `metadata:` example if absent); (e) a **tier marker in the `MEMORY.md` index row** the servitor writes
  (recall-weighting is advisory, §2.4 — `MEMORY.md` is exempt from the hook, so this is prompt-only).

**`requiresTest`: false** — standing prose; criteria #5-6 are prompt-level (no deterministic gate). The servitor
already holds Read/Grep/Glob — **no new capability**.

- [ ] **Step 1 — (no behavioral test — prose.)** Optional fixture: a memory-file example at each tier (#5
  illustration). The structural floor is T1's gate; semantic honesty is prompt-layer (§5).
- [ ] **Step 2 — Implement (prose).** Add (a)-(e) to `war-servitor.md`, anchored by named construct (the D1-D4
  checklist, the frontmatter-format section). State the precedence as the **tier order**, not "user input wins"
  (the autonomous path has no user input — decision 4): **replace** the existing D2 wording ("User corrections outrank
  agent assertions") with the tier-order frame ("a higher tier supersedes a lower; a `user-confirmed` fact outranks any
  agent write; never overwrite a higher-tier fact with a lower-tier one"). T3 mirrors this exact frame.
- [ ] **Step 3 — Run the full self-discovering gate → green** (no executable surface; the hook's `.test.sh` from T1
  stays green).
- [ ] **Step 4 — Commit** — `docs(war): war-servitor.md provenance tagging + verify-on-write + tier-precedence correction (M3)`
- **Closes:** the standing-surface prompt discipline (criteria #5-6). **T3 mirrors this into the dispatched prompt.**

---

## Phase 3 — Dispatched prompt discipline (mirrors T2)

### Task 3 — `workflow-template.js` wrap-up restatement mirrors the provenance discipline (M3, dispatched prose)

**Files:**
- modify `skills/war/assets/workflow-template.js` (§2.3, the wrap-up prompt's D1–D4 restatement — locate by the
  **named construct** (the wrap-up prompt string's D1-D4 list), not a line number; it sits ~`:548-551` post-M1/M2 but
  WILL have drifted) — the restatement gains provenance tagging + verify-on-write + the absent-note rule + tier-precedence,
  **directive-parallel to (semantically equivalent to, not a byte copy of) the directives T2 landed in
  `war-servitor.md`** (see DP1).

**`requiresTest`: false** — dispatched prose embedded in the `.js` (a template string; no control-flow change, no new
behavior). **deps:** T2.

- [ ] **Step 1 — (no behavioral test — prose.)** Anchor by named construct (the wrap-up prompt's D1-D4 restatement);
  it sits ~`:548-551` post-M1/M2 but WILL drift — find it by the construct, not the line number.
- [ ] **Step 2 — Implement (prose).** **Restate** T2's landed provenance directives in the wrap-up — adapted to the
  dispatched template-string form (**directive-parallel, not a byte-identical copy** of `war-servitor.md`'s standing
  prose; see DP1). **PARITY CHECK (DP1 / coverage-split):** the provenance-tagging + verify-on-write + absence-note +
  tier-precedence **directives** here must be **semantically equivalent** to what `war-servitor.md` carries — the two
  surfaces are independent and either lagging silently re-opens M3. The audit for this task explicitly confirms
  directive parity against the T2-landed `war-servitor.md` (semantic equivalence, not byte-identity).
  **Audit parity checklist** (concrete manual check — **not** a code test; per DP2, criteria #5-6 are prompt-level
  with no deterministic gate): the auditor confirms BOTH surfaces carry each of — (1) **tag provenance** on every write
  (default `agent-unverified`); (2) **verify-on-write** (Read/Grep the referent → `code-verified` + cue, else
  `agent-unverified` + absence-note); (3) **tier-precedence correction** (higher supersedes lower; `user-confirmed`
  outranks any agent write); (4) the **three tier names verbatim** (`agent-unverified`, `code-verified`,
  `user-confirmed`). Any directive present in one surface but absent in the other → parity fail.
- [ ] **Step 3 — Run the full self-discovering gate → green** (the wrap-up is a template string; no test asserts on
  it, but the whole node suite must stay green since it's inside `workflow-template.js`).
- [ ] **Step 4 — Commit** — `docs(war): mirror provenance tagging + verify-on-write into the workflow-template wrap-up restatement (M3)`
- **Closes:** the dispatched-surface prompt discipline + the coverage-split parity (both surfaces now carry the
  discipline).

---

## Phase 4 — Release

### Task 4 — Version bump v0.7.5 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.7.4"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.4` → `0.7.5`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four
  by hand). Next free patch by construct if the stack order shifts. Status copy: memory provenance — 3-tier ladder +
  structural `validate-servitor-provenance.sh` gate + verify-on-write servitor discipline.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.5 — memory provenance ladder + structural gate (M3)`

---

## Test plan

**Gate** = the self-discovering multi-runner:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `validate-servitor-provenance.test.sh` | missing nested `metadata.provenance`→**deny, assert exact exit 2**; valid tier→allow; bad tier→deny(2); `MEMORY.md` (exact basename)→allow; `tool_name:Edit`→pass-through; non-servitor→pass; no-path→allow | `jq -nc --arg` payloads in the **nested** `metadata:`→`provenance:` shape; nested-value extract (not top-level), `\|\| true` exit-2 guard |
| T2 | (no test — prose) | full gate green; optional tier fixture | criteria #5-6 prompt-level |
| T3 | (no test — prose) | full gate green; **parity vs T2's war-servitor.md** | coverage-split close |

**Validation criteria (spec §6):** #1 tag-less write denied (T1) · #2 valid passes / bad denied (T1) · #3 index
exempt (T1) · #4 non-servitor pass-through (T1) · #5 verify-on-write tiers, prompt-level/fixture (T2+T3 prose) · #6
correction precedence, higher tier supersedes (T2+T3 prose).

**Regression guard:** the existing `*.test.sh` runners + the node suite stay green — T1 is a new hook (additive
`hooks.json` wiring), T2/T3 touch no executable behavior (prose + a template string).

## Recommended ADRs

**None new.** [`ADR-0007 — memory provenance`](../adr/0007-memory-provenance.md) is **already written + accepted**,
ratifying decisions 1/2/3 (structural-gate posture, 3-tier ladder, admit-with-note on absent). This plan implements
it.

## Out of scope / Deferred

- **`Edit` of an existing fact file** — the structural gate covers `Write` only (full content available); an `Edit`
  can't see the merged result, so D1 dedup-in-place is covered by prompt discipline + the file already carrying
  provenance. Documented, not silently skipped (§2.2).
- **Recall-weighting is advisory** — the harness injects `MEMORY.md` + fact files; we cannot make it rank by tier.
  M3 only makes the tier **visible** (frontmatter + index marker); the reading assistant weights it (§2.4). Accepted
  ceiling.
- **Gate is structural, not semantic** — it proves a tag is *present*, never *honest* (a servitor could stamp
  `code-verified` without checking). That residual is prompt-layer; the gate stops the silent *erosion* (a tag-less
  write), the realistic failure mode (§5).
- **~87 existing memory files are grandfathered** — untagged, or carrying the **legacy `agent-observed` value** (e.g.
  `land-local-follower-…`). The gate fires only on new `Write`s and `Edit` is out of scope (the `tool_name` guard), so
  existing files are **not** re-gated; remapping legacy values to the three tiers is a `consolidate-memory` job, not
  this plan. T2 retires `agent-observed` going forward (treated as `agent-unverified`).
- **Post-landing prose-parity drift** (`war-servitor.md` ↔ the `workflow-template.js` wrap-up restatement) is guarded
  by the T3 audit's **manual directive-parity check, not an executable test** — consistent with the project's other
  prose-parity cases (memory `standing-instruction-vs-dispatched-prompt-coverage-split`); a dedicated sync task
  backfills if drift is later observed. Accepted ceiling.
- **No truth-verification harness, no eviction / index cap, no extending the gate to the main assistant's own memory
  writes** (no `agent_type`) — all non-goals (§5).
- **Same-file serialization** — only T3 touches `workflow-template.js`; M3 re-anchors on M2's tip by named construct.
- **No GitHub issue filed** — plan-docs only; finding id is the audit's **M3**.

## Coverage

| Finding | Coverage |
|---|---|
| **M3** | **full** — structural `validate-servitor-provenance.sh` gate denying tag-less servitor fact writes (T1, tested #1-4) + provenance tagging / verify-on-write / tier-precedence correction in the standing `war-servitor.md` (T2) and the dispatched `workflow-template.js` wrap-up restatement (T3, byte-mirrored, parity-checked) covering #5-6. ADR-0007 + CONTEXT terms already landed. Recall-weighting advisory by design (§2.4). |
