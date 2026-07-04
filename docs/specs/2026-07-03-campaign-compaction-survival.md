# Campaign compaction survival — codify the write-ahead CAMPAIGN-STATE.md checkpoint + a post-compact re-injection hook

## 1. Context — the gap / problem

Overnight `/war-campaign` runs span multiple plans and dozens of notification turns; the Lead's context
window fills and auto-compaction fires at times nobody controls — including mid-phase, at the exact moment
the in-context nuance (in-flight tasks, adjudications, gotchas) is richest and least recoverable from the
ledger alone.

The design already takes the right stance — *"resume is the guarantee, compaction is best-effort"*
([companion-skills design §10](2026-07-01-war-companion-skills-design.md)) — but two gaps keep it from
being true in practice:

1. **The resume brief is uncodified.** The live 2026-07-02 campaign invented `CAMPAIGN-STATE.md` ad hoc
   (its header reads "Updated … *before a /compact*"; the ledger's own `stopPoint` says
   "(see CAMPAIGN-STATE.md)"). Neither [`skills/war-campaign/SKILL.md`](../../skills/war-campaign/SKILL.md)
   nor design §7 mentions the file — the contract knows only `ledger.json` + `inbox/`. Its freshness is
   convention, unstated and unenforced: nothing guarantees it was updated *before* a compaction runs.
2. **Nothing re-anchors the post-compact context.** After compaction the summary may or may not carry the
   pointer back to the campaign state; there is no deterministic mechanism.

Additionally, SKILL.md lifecycle step 6 over-claims: "this is a built-in `/compact`" — the harness exposes
no way for the model to compact its own window (see §2), so the compact half of "checkpoint-and-compact"
cannot execute. The prose predates verification (the documented-before-wired class).

## 2. Pivotal constraints

Platform facts, verified 2026-07-03 against code.claude.com/docs (hooks, statusline, commands, context-window
pages):

- **The model cannot trigger `/compact`.** No agent-side mechanism exists (the SlashCommand tool covers
  custom commands only). Compaction is user-invoked or threshold-automatic; the threshold is not
  configurable.
- **Context-window usage is not observable from inside the session.** Hook inputs carry no token counts;
  `context_window.used_percentage` exists only in statusline input, which is display-only. Any design
  predicated on "when context is 25–50% full, do X" is unimplementable.
- **`SessionStart` supports matcher `compact`** — fires immediately *after* a compaction — plus `resume` and
  `clear`, and can inject `hookSpecificOutput.additionalContext` into the fresh window. This is the
  deterministic re-entry channel (no dependence on the summarizer honoring a hint).
- **`PreCompact` can block** (exit 2 / `decision: block`), but blocking *auto*-compact rides the session
  into the hard context ceiling with no turns left to do the update being blocked for. Blocking is
  forbidden here.
- **Plugin hooks fire in every session of every repo that has the plugin installed.** The hook must
  self-gate (campaign-active check) and exit 0 silently otherwise; it must not assume the WAR repo layout
  beyond `.claude/campaigns/`.
- House conventions: every hook in `hooks/` ships a sibling `.test.sh`; JSON is emitted via
  `jq -nc --arg`, never `printf` interpolation (memory: printf-json-escaping-vacuous-test-case).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Freshness mechanism | **Write-ahead protocol**, not hook-time enforcement: the Lead rewrites `CAMPAIGN-STATE.md` *before* every long-wait dispatch and at every plan boundary, so the file is always current no matter when compaction fires |
| Re-entry mechanism | **`SessionStart` hook, matcher `compact\|clear\|resume`**, injecting the state file content inline via `additionalContext` |
| Injection payload | **Full file inline** (curated brief, ~8KB ≈ 2k tokens) + one-line ledger queue status; deterministic beats pointer-and-hope. Oversize fallback: >32KB → inject pointer line only |
| Proactive self-compaction at 25–50% + `--no-self-compaction` flag | **Rejected** — not implementable (no trigger, no sensor; §2) and unnecessary once write-ahead + re-injection make compaction timing irrelevant |
| `PreCompact` participation | **None.** No blocking (auto-compact deadlock risk); no summary-shaping hint (redundant with the deterministic SessionStart channel; one hook + one test fewer) |
| `startup` matcher | **Excluded** — would fire for every unrelated new session in a repo with a paused campaign; bare `/war-campaign` resume already reads state explicitly |
| Campaign-active gate | Ledger exists under `<project>/.claude/campaigns/<id>/ledger.json` and **not all plans have `status: "landed"`** (the helper only formally writes `queued`; live runs use open vocabulary like `hardening` — gate on the terminal value, not the open set) |
| Multiple active campaigns | Inject the **latest by ledger mtime**; name the others by id in one line |
| Session-binding | **Accepted looseness** — the hook cannot know whether this session is the campaign Lead; a false-positive injection costs ~2k tokens once per compaction, cheaper than building session-ownership plumbing |
| SKILL.md step 6 | Reword to what is real: checkpoint is mandatory and write-ahead; compaction stays with the harness; the hook guarantees re-entry |

## 4. Mechanics

### `skills/war-campaign/SKILL.md` — the checkpoint contract

New **Checkpoint (CAMPAIGN-STATE.md)** subsection under State & resume:

- Path: `.claude/campaigns/<id>/CAMPAIGN-STATE.md`, sibling of `ledger.json`. Uncommitted, single-writer
  (the Lead), plain markdown.
- **Write-ahead protocol** — rewrite the file *before* each of: launching `/red-team`, launching each `/war`
  phase, entering a `--wait-for-merge` wait, and at every plan boundary (lifecycle step 5→6). The invariant:
  *the file must always let a fresh context resume from NOW* — queue status, what is in flight (run/task
  ids), the continuation sequence, and gotchas. These dispatch points are exactly where the Lead is about to
  idle, so the write is free.
- Resume set becomes ledger + inbox + `CAMPAIGN-STATE.md`, still reconciled toward git (ADR 0008 discipline)
  — the state file is a brief, never the authority.
- Lifecycle step 6 reworded (drop "this is a built-in `/compact`"); add one line of Lead thrift guidance
  (offload verbose verification to subagents; terse notification handling) — the only real lever on window
  growth, since compaction cannot be steered from inside (§2).
- Honest boundary note: write-ahead is a prompt directive (not code-enforced — the red-team
  "warn-never-red" class); the code-enforced half of survival is the hook below.

### `hooks/inject-campaign-state.sh` — the re-injection hook (new)

- Registered in [`hooks/hooks.json`](../../hooks/hooks.json) under `SessionStart`, matcher
  `compact|clear|resume`.
- Reads the hook-input JSON from stdin (`cwd`); scans `<cwd>/.claude/campaigns/*/ledger.json` (also
  `$CLAUDE_PROJECT_DIR` when set). No campaigns dir, no ledger, unparsable ledger, or all plans `landed` →
  exit 0 with no output.
- Active campaign found → emit
  `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "<banner + CAMPAIGN-STATE.md content + ledger one-liner>"}}`
  via `jq -nc --arg`. Missing `CAMPAIGN-STATE.md` on an active campaign → inject the banner + ledger
  one-liner + an instruction to reconstruct the checkpoint before proceeding.
- Defensive throughout: any internal failure degrades to silent exit 0 — a broken hook must never wedge
  session start in unrelated repos.

### `hooks/inject-campaign-state.test.sh` — sibling test (new)

Fixture-driven (mktemp campaign dirs; note BSD mktemp/TMPDIR memory), covering at minimum: no campaigns
dir → silent 0; all-landed ledger → silent 0; active ledger + state file → output is valid JSON (`jq .`)
and `additionalContext` contains a fixture sentinel; active ledger, missing state file → reconstruct
instruction present; two active campaigns → latest-mtime file injected; >32KB state file → pointer fallback;
malformed ledger JSON → silent 0.

## 5. Surface changes

| File | Change |
|---|---|
| `hooks/inject-campaign-state.sh` | new |
| `hooks/inject-campaign-state.test.sh` | new |
| `hooks/hooks.json` | add `SessionStart` entry |
| `skills/war-campaign/SKILL.md` | checkpoint contract; reword step 6; resume set |
| `docs/specs/2026-07-01-war-companion-skills-design.md` | §7.1 step 6 + §7.2 resume set aligned; §10 self-compact risk row resolved with a pointer here |
| `docs/adr/0016-*.md` | new ADR (§7) |
| `CONTEXT.md` | `### Campaigns` terms (§6) |
| `README.md` | one line in the `/war-campaign` section (overnight survival), if any lifecycle prose there names step 6 |
| Release slots | trailing release phase: `plugin.json` + `marketplace.json` ×2 + README (canonical four) |

## 6. New domain terms (CONTEXT.md)

- **Write-ahead checkpoint** — the CAMPAIGN-STATE.md discipline: update the resume brief *before*
  dispatching the thing you will be waiting on, so its freshness never depends on compaction timing.
- **CAMPAIGN-STATE.md** — the Lead's curated, uncommitted resume brief at
  `.claude/campaigns/<id>/CAMPAIGN-STATE.md`; a brief toward git truth, never the authority.
- **Post-compact re-injection** — the `SessionStart(compact|clear|resume)` hook that deterministically
  restores the active campaign's state file into a fresh context window.

## 7. Recommended ADRs

**ADR 0016 — Compaction survival is write-ahead state + post-compact re-injection; self-compaction
rejected.** Clears the bar: the rejected alternative (agent-triggered boundary compaction) is the intuitive
proposal and *will* be re-proposed — the ADR records the platform facts that kill it (no trigger, no sensor,
blocking auto-compact = ceiling deadlock) and the trade-off accepted instead (session-binding looseness,
prompt-directive write-ahead).

## 8. Open risks / implementation notes

- **`SessionStart(compact)` behavior is documented but unexercised here** — the implementing task should
  hand-verify once (trigger a manual `/compact` in a fixture repo with an active ledger) before trusting the
  matcher name; the `.test.sh` can only prove the script's stdin→stdout contract, not the harness firing it.
- **Ledger status vocabulary is open** (`record` accepts any string; only `queued` and `landed` are
  load-bearing). The gate keys on the terminal value (`landed`); if a terminal `abandoned`/`skipped` status
  is ever introduced, the gate must learn it — note this beside the gate in the script.
- **Worktree vs main-checkout cwd**: campaigns live under the *session's* project dir (the live run's sat in
  its worktree). The hook uses the hook-input `cwd`/`$CLAUDE_PROJECT_DIR`, never a hardcoded repo path
  (memory: workflow-agents-cwd-is-main-repo-not-session-worktree).
- **Absence guard discipline** for the step-6 rewording: pair the "built-in `/compact`" absence check with a
  presence check for the new wording token (memory: weak-test-assertion-passes-without-feature).
- Injection size: state files are curated (~8KB today); the 32KB pointer-fallback keeps a runaway file from
  flooding a fresh window.

## 9. Non-goals / deferred

- Agent-triggered (`self-`) compaction, threshold sensing/config, `--no-self-compaction` — rejected (§3).
- `PreCompact` hooks of any kind (blocking or summary-shaping).
- Session-ownership binding for the hook (accepted looseness).
- A statusline surface for campaign/context status.
- Enforcing write-ahead in code (it is skill prose; the hook is the enforcement backstop).
- `startup`-matcher injection for paused campaigns (bare `/war-campaign` resume covers it).

## 10. Validation criteria

1. `bash hooks/inject-campaign-state.test.sh` green, covering every case enumerated in §4.
2. Piping a `SessionStart` input JSON (`source: "compact"`, fixture cwd with an active ledger + state file)
   into the hook yields `jq`-valid JSON whose `additionalContext` contains the fixture sentinel.
3. Same fixture with all plans `status: "landed"` → empty stdout, exit 0. No campaigns dir → same.
4. `jq .` parses `hooks/hooks.json`; it contains a `SessionStart` group with matcher `compact|clear|resume`
   pointing at the new script.
5. `grep -c "CAMPAIGN-STATE.md" skills/war-campaign/SKILL.md` ≥ 3 (contract, write-ahead protocol, resume
   set); `grep "built-in \`/compact\`" skills/war-campaign/SKILL.md` empty **and** the replacement wording
   token present.
6. Design spec §7.1/§7.2/§10 updated; §10 no longer lists programmatic self-compact as unmitigated.
7. ADR 0016 exists and is linked from the SKILL.md checkpoint section.
8. One manual smoke (documented in the PR): `/compact` in a fixture session with an active campaign →
   the post-compact context contains the injected banner.
