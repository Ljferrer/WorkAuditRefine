# Campaign compaction survival — write-ahead CAMPAIGN-STATE.md + post-compact re-injection hook

Spec: [docs/specs/2026-07-03-campaign-compaction-survival.md](../specs/2026-07-03-campaign-compaction-survival.md)
(resolved design tree in spec §3; platform facts in spec §2, verified 2026-07-03 against code.claude.com/docs).

## Commander's Intent

- **Purpose:** Long overnight campaigns must survive compaction without losing the thread — the resume brief
  (`CAMPAIGN-STATE.md`) must never be stale when compaction fires at a moment nobody controls, and the
  post-compact context must be re-anchored deterministically instead of by hope.

- **Method:** Make compaction timing *irrelevant* rather than trying to steer it. Codify `CAMPAIGN-STATE.md`
  as a **write-ahead checkpoint** — the Lead rewrites it *before* every long-wait dispatch (red-team launch,
  each `/war` phase, wait-for-merge) and at every plan boundary — and deterministically **re-inject** it
  after compaction via a campaign-gated `SessionStart(compact|clear|resume)` hook that inlines the full
  state file. Self-triggered compaction, threshold sensing, `--no-self-compaction`, and all `PreCompact`
  participation are **rejected** (no trigger, no sensor, blocking auto-compact = ceiling deadlock) — record
  the rejection in an ADR so it can't be re-proposed blind. Judgment guardrails: the state file is a brief
  toward git truth, never the authority; the hook must be silent and harmless in every session that isn't
  running a campaign.

- **End state:**
  1. `hooks/inject-campaign-state.sh` is registered in `hooks/hooks.json` under `SessionStart` matcher
     `compact|clear|resume`; it inlines the active campaign's `CAMPAIGN-STATE.md` into `additionalContext`
     (>32KB → pointer-only fallback; active campaign but missing file → reconstruct instruction), selects
     the latest campaign by ledger mtime when several are active, and is silent (exit 0, no output) when no
     campaign is active or on any internal failure — proven by a green sibling
     `inject-campaign-state.test.sh`.
  2. `skills/war-campaign/SKILL.md` codifies the `CAMPAIGN-STATE.md` contract and write-ahead protocol,
     adds the state file to the resume set, and lifecycle step 6 no longer claims a "built-in `/compact`"
     (replacement wording present — paired presence/absence check).
  3. ADR 0016 records the self-compaction rejection and its platform facts; companion design spec
     §7.1/§7.2/§10, `CONTEXT.md` `### Campaigns`, and the README `/war-campaign` section are aligned with
     the new contract.
  4. Version bumped **+0.0.1 over the land-time current version** — read from `.claude-plugin/plugin.json`
     at land time, no hard-coded target literal anywhere in this plan — across all four canonical slots
     (`plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; README
     `## Status` replace-in-place).

## Build order (for /war)

1. **Phase 1 — Hook + contract** — Task 1 ∥ Task 2 ∥ Task 3 (file-disjoint, no waves)
2. **Phase 2 — Release** — Task 4

## Phase 1 — Hook + contract

### Task 1: inject-campaign-state hook + sibling test + registration

- Files: `hooks/inject-campaign-state.sh`, `hooks/inject-campaign-state.test.sh`, `hooks/hooks.json`
- Plan slice:
  - **`hooks/inject-campaign-state.sh`** (new, executable bash; mirror the stdin-JSON idiom of the existing
    hooks in `hooks/`):
    - Read the SessionStart hook-input JSON from stdin; extract `cwd` with `jq`. Scan root:
      `$CLAUDE_PROJECT_DIR` when set, else the input `cwd`.
    - Campaign scan: `<root>/.claude/campaigns/*/ledger.json`. **Active** ⇔ the ledger parses as JSON AND
      `.plans` is a non-empty array AND at least one plan has `.status != "landed"`. Missing or empty
      `.plans` → inactive (gate on found-and-open, not array length alone).
    - Multiple active campaigns → pick the **latest by `ledger.json` mtime**, ordered portably via `ls -t`
      (no `stat -f`/`stat -c` — BSD/GNU flag divergence); name the passed-over campaign ids in one banner
      line.
    - Payload (`additionalContext`): banner line ("Active campaign `<id>` — post-compact re-injection; the
      state below is a brief, reconcile toward git before acting") + the full `CAMPAIGN-STATE.md` content +
      a one-line ledger digest (`slug:status` per plan). Variants: state file **missing** on an active
      campaign → banner + digest + instruction to reconstruct the checkpoint (per the write-ahead protocol
      in `skills/war-campaign/SKILL.md`) before proceeding; state file **> 32768 bytes** → pointer-only
      fallback (banner + file path + digest, no inline body).
    - Emit exactly one JSON object via `jq -nc --arg` (never printf-interpolated JSON):
      `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":<payload>}}`.
    - **Fail-open silence**: no campaigns dir / no ledger / unparsable ledger / `jq` missing / any internal
      error → exit 0 with empty stdout. Never exit nonzero; a broken hook must not wedge session start in
      unrelated repos. Comment the gate with: terminal status vocabulary is open — only `landed` is terminal
      today; a future terminal status (`abandoned`/`skipped`) must be added here.
  - **`hooks/hooks.json`**: add a `SessionStart` group —
    `{"matcher": "compact|clear|resume", "hooks": [{"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/inject-campaign-state.sh"}]}`
    — leaving the existing `PreToolUse` groups untouched.
  - **`hooks/inject-campaign-state.test.sh`** (new sibling, self-contained, hermetic — build all fixtures
    under a `mktemp -d` dir and `cd` into it first; do not rely on `TMPDIR` redirection, BSD `mktemp`
    ignores it). Fixture ledgers mirror the real shape with synthetic values, e.g.
    `{"campaign":"<id>","plans":[{"slug":"x","status":"queued"}]}`. Each case asserts **stdout content AND
    exit code**:
    1. no `.claude/campaigns` dir → empty stdout, exit 0
    2. ledger with all plans `status:"landed"` → empty stdout, exit 0
    3. ledger with empty `plans` array → empty stdout, exit 0
    4. malformed ledger JSON → empty stdout, exit 0
    5. active ledger + `CAMPAIGN-STATE.md` → stdout parses with `jq`;
       `.hookSpecificOutput.hookEventName == "SessionStart"`; `additionalContext` contains a fixture
       sentinel string AND the campaign id
    6. active ledger, missing `CAMPAIGN-STATE.md` → `additionalContext` contains the reconstruct-instruction
       token
    7. two active campaigns with distinct mtimes → `additionalContext` inlines the newer campaign's sentinel
       and names the older campaign's id (pair presence of the winner with absence of the loser's body
       sentinel)
    8. state file > 32KB → `additionalContext` contains the file path but NOT the body sentinel (paired
       presence/absence)
    9. registration sanity: `jq .` parses `hooks/hooks.json` and a `SessionStart` entry with matcher
       `compact|clear|resume` points at `inject-campaign-state.sh`
- requiresTest: true
- deps: []
- target repo: superproject

### Task 2: war-campaign SKILL.md contract + ADR

- Files: `skills/war-campaign/SKILL.md`, `docs/adr/0016-campaign-compaction-survival.md`
- Plan slice:
  - **SKILL.md — new `Checkpoint — CAMPAIGN-STATE.md` subsection** under the `## State & resume — spec §7.2`
    heading:
    path `.claude/campaigns/<id>/CAMPAIGN-STATE.md` (sibling of `ledger.json`; uncommitted; single-writer —
    the Lead; plain markdown). **Write-ahead protocol**: rewrite the file *before* each of — launching
    `/red-team`, launching each `/war` phase, entering a `--wait-for-merge` wait — and at every plan
    boundary. Invariant: *the file must always let a fresh context resume from NOW* — queue status,
    in-flight run/task ids, the continuation sequence, gotchas. Brief-not-authority: resume still reconciles
    toward git (the ADR 0008 discipline). Honest boundary: write-ahead is a prompt directive; the
    code-enforced re-entry half is `hooks/inject-campaign-state.sh`. Link the ADR from this subsection.
  - **Lifecycle step 6 reworded** (construct: the numbered `**Context hygiene.**` item under
    `## Lifecycle`): drop the claim "this is a built-in `/compact` — best-effort, not the guarantee". New
    floor: the write-ahead checkpoint is mandatory; compaction stays with the harness (user-invoked or
    auto — the model cannot trigger it); the `SessionStart(compact|clear|resume)` hook re-injects the
    checkpoint into the fresh window; plus one line of Lead thrift (offload verbose verification to
    subagents, keep notification handling terse — the only real lever on window growth).
  - **Resume bullet** under `## State & resume — spec §7.2`: the resume set becomes ledger + inbox +
    `CAMPAIGN-STATE.md`.
  - **Trailing HTML comment** (construct: the `<!-- bundled-routine note: ... -->` comment at the end of
    SKILL.md) still describes step 6 as "our own bundled built-in `/compact` step" — rewrite it to match the
    new step 6 or delete it (the comment-lags-rewrite class).
  - Self-check before commit (the phase gate's doc floor): `grep -c "CAMPAIGN-STATE.md"` on SKILL.md ≥ 3;
    the string ``built-in `/compact` `` absent AND the chosen replacement wording token present (paired
    presence/absence).
  - **ADR** (house format — mirror `docs/adr/0015-*.md`): title "Compaction survival: write-ahead checkpoint
    + post-compact re-injection (self-compaction rejected)". Records: the decision (write-ahead state +
    `SessionStart` re-injection); the rejected alternative with its 2026-07-03-verified platform facts (no
    agent-side `/compact` trigger; context-% unobservable to hooks/model — statusline-only; auto-compact
    threshold not configurable; blocking auto-compact rides into the hard context ceiling); accepted
    trade-offs (session-binding looseness ≈ one ~2k-token false-positive injection per compaction in
    non-Lead sessions; write-ahead is prompt-directive; the hook fires in any repo with the plugin and an
    active-looking ledger).
  - **ADR number rule**: expected `0016`; verify against `docs/adr/` on the dispatch base — if `0016-*`
    already exists, take the next free number and use it consistently within this task. (Task 3 applies the
    same rule off the same frozen dispatch base, so both tasks resolve the same number by construction.)
- requiresTest: false
- deps: []
- target repo: superproject

### Task 3: satellite docs alignment

- Files: `docs/specs/2026-07-01-war-companion-skills-design.md`, `CONTEXT.md`, `README.md`
- Plan slice:
  - **Design spec §7.1 step 6** (the `**Context hygiene.**` numbered item): align with the new semantics —
    write-ahead checkpoint + post-compact hook re-entry; no "built-in `/compact`" claim. Adapt to the spec's
    voice; do not paste SKILL.md prose verbatim (verbatim-mirror context-mismatch class).
  - **Design spec §7.2** resume bullet: the resume set includes `CAMPAIGN-STATE.md`; one added line naming
    the write-ahead checkpoint discipline.
  - **Design spec §10** first bullet ("Programmatic self-`/compact` may be limited"): mark it resolved —
    point to `docs/specs/2026-07-03-campaign-compaction-survival.md` and the ADR (same ADR-number rule as
    Task 2, resolved off the same dispatch base).
  - **CONTEXT.md `### Campaigns (multi-plan orchestration)`**: add three terms in the section's existing
    format (bold term, description, `_Avoid_:` line): **Write-ahead checkpoint** (update the resume brief
    *before* dispatching the thing you'll wait on; freshness never depends on compaction timing);
    **CAMPAIGN-STATE.md** (the Lead's curated uncommitted resume brief, sibling of the ledger; _Avoid_:
    treating it as the authority — it is a brief toward git truth, and it is not the ledger);
    **Post-compact re-injection** (the campaign-gated `SessionStart(compact|clear|resume)` hook restoring
    the state file into a fresh window; _Avoid_: `PreCompact` blocking or summary-shaping — rejected, see
    the ADR).
  - **README `### Run a campaign (`/war-campaign`)` section**: ONE added sentence on overnight survival —
    the write-ahead `CAMPAIGN-STATE.md` checkpoint plus the campaign-gated post-compact re-injection hook.
    Keep the claim modest (no "guarantee" language beyond what the hook does — the
    release-blurb-overstates class). Do **not** touch `## Status` or any version slot (Phase 2 owns those).
- requiresTest: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 4: version bump (+0.0.1 over land-time current)

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: read the **current** version from `.claude-plugin/plugin.json` on this task's dispatch base
  (the Phase-2 integration tip, i.e. with Phase 1 landed) — do NOT assume any literal from this plan or the
  spec. Bump the patch component by 1 (`X.Y.Z` → `X.Y.(Z+1)`). Write all four canonical slots:
  `plugin.json` `.version`; `marketplace.json` `.metadata.version` AND `.plugins[0].version`; README
  `## Status` — **replace-in-place** (replace the existing `**X.Y.Z** — …` line, never append) with the new
  version and a one-line modest blurb: campaign compaction survival — write-ahead `CAMPAIGN-STATE.md`
  checkpoint codified + post-compact `SessionStart` re-injection hook. Cross-check all four slots agree
  before committing — no cross-slot consistency test exists; verify by hand.
- requiresTest: false
- deps: []
- target repo: superproject

## Notes / conscious deviations

- **Spec validation criterion 8** (manual `/compact` smoke in a live session) is NOT a worker deliverable —
  workers cannot drive an interactive session. It goes into the PR body as an operator checklist item. The
  `.test.sh` proves the script's stdin→stdout contract; the harness-fires-the-matcher half is the manual
  smoke (spec §8 risk).
- **README.md appears in Task 3 (prose sentence) and Task 4 (Status slot)** — different phases, serial
  landing: deliberate, not a same-file collision.
- **ADR numbering** is resolved by the next-free rule off the frozen Phase-1 dispatch base (0014-collision
  precedent), expected 0016. Tasks 2 and 3 resolve it identically by construction; the spec's `0016-*`
  placeholder follows whatever lands.
- **No version literal appears in this plan** (operator directive 2026-07-03): the release target is
  defined as land-time current + 0.0.1, resolved by Task 4 at execution.
- **The write-ahead protocol is a prompt directive, not code-enforced** — conscious (spec §4 honest
  boundary); the hook is the code-enforced half of survival.

## Open decisions (resolved by /red-team)

- Exact replacement wording for SKILL.md step 6 and its presence-check token (floor: the paired
  presence/absence self-check in Task 2 must pass).
- Banner text / `additionalContext` layout of the injection payload (floor: banner + body-or-fallback +
  ledger digest, per End state 1).
- Ratify `resume` staying in the matcher set alongside `compact|clear` (spec §3 resolves yes — a resumed
  session re-enters with reduced context and benefits from the same re-anchor; drop to `compact|clear` if
  red-team finds it noisy).
