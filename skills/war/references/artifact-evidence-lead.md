# Artifact evidence — the Lead procedure

The `/war` Lead's side of the REA evidence gate (plan `2026-10-20-rea-artifact-evidence` D4, D8;
G1, G3, G10). The doctrine home is
[artifact-evidence.md](../../war-strategy/references/artifact-evidence.md); the operator-facing
setup walkthrough is [rea-setup.md](../../war-room/references/rea-setup.md). This file restates
no grammar, no manifest path value and no `SEAT_AGENT_TYPES` or `EVIDENCE_LENS` member: it names
those exports. The presence tool literal is guarded against the hook allowlist by
`evidence-presence.test.mjs`.

## Run the parser at Decompose

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/target-artifacts.mjs <plan.md>` once at the
Decompose gate. It prints `{ rows, citingTasks }`: `rows` are the Target artifacts block rows
(the marker is `TARGET_ARTIFACTS_MARKER` in `target-artifacts.mjs`; path, sha256, provider),
`citingTasks` the task ids whose `Plan slice:` cites a `rea:` tag.
Exit 2 is a malformed block: stop and show it at the gate, never thread a partial list. The
engine never scans plan text; this output is the only block signal it gets.

## Resolve REA presence

Resolve presence before launch, the same two ways `/war-room` does (G1):

1. the tool registry carries the presence tool `mcp__rea__binary_session` (the client registered
   the `rea` MCP server), or
2. `zsh -c 'rea doctor --json'` or `bash -c 'rea doctor --json'`, a non-interactive shell on
   purpose, reports every provider the rows name as ok (the per-provider rows in
   rea-setup.md § Verify).

If `rea doctor --json` carries no adb row, a plan with an adb row resolves presence by the MCP
path (item 1) only; `"$REA_ADB_PATH" version` confirms the install, never presence.

`run.evidence` must be `true` in the resolved config as well. Both must hold; the engine never
probes. If `rea --version` differs from the version the evidence-auditor MCP hook's header records
(`Derived at rea-agents: `), print one loud line: re-derive the allowlist before relying on the
evidence seat.

When rows exist and both hold, run
`bash ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh ensure-exclude $MAIN`
(`$MAIN` the main checkout) before launch, so a bundle REA exports during the run lands under the
excluded `$MAIN/.claude/war/evidence/<plan-slug>/` and never in a diff (G2).

## Thread the args and the evidence seat rows

Thread into every per-phase Workflow (the args contract is in [schemas.md](schemas.md)):

- `args.evidence`: `true` only when `run.evidence` is on AND presence resolved. Otherwise leave
  it absent (absent is off; `null` is refused at entry).
- `args.targetArtifacts`: the parser's `rows`, verbatim, whenever the block exists, on or off.
  With `args.evidence` off the engine logs its own loud line and proceeds (G3).
- the evidence seat rows, in two moves. First strip the pool: `/war-room` never writes an
  evidence-type row (its `agentType` the evidence member of `SEAT_AGENT_TYPES`) into the config
  `audit.roster`, because `run.evidence` is the opt-in record, so any such row is hand-written and
  never a seat. Remove every such row from the pool before `rosterPolicy` seeds the
  per-task rosters (`all`, `solo` and `auto` all read the stripped pool), and thread the stripped
  pool as the `audit.roster` of the args, because the engine convenes that default roster for a
  lone seat's widen fallback and for the phase-close sweep panel. The strip holds on every arm,
  the skip arm included. Then, for each task id in `citingTasks`, and only those, and only when
  both preconditions hold, add one roster seat
  `{ lens: <EVIDENCE_LENS>, depth: 'deep', agentType: <the evidence member of SEAT_AGENT_TYPES> }`.
  Both are `war-config.mjs` exports; read the values from the export, never from a doc. That
  task's other seats cap at 4 (the five-seat ceiling, G10). `validateRoster` in both copies rejects
  the row while `run.evidence` is off, and `resolveWidenSource` never nominates the lens
  (`WIDEN_BARRED_LENSES`).

The worker commits one digest manifest per cited artifact at the path `MANIFEST_PATH_TEMPLATE`
names (an export in `target-artifacts.mjs`). The engine renders that path into the dispatched
clause and the seat prompt; thread nothing for it.

## Skip with one loud line

When either precondition fails (`run.evidence` off, or presence unresolved) and the parser
returned rows, skip the seat add, still strip every evidence-type row from the pool and from every
seeded task roster, and log exactly one line at the Decompose gate that names the failed
precondition:

`REA ARTIFACT EVIDENCE: evidence seat skipped — <run.evidence off | REA absent>; <n> declared target artifact(s) go unmeasured this run.`

Then still thread `args.targetArtifacts`, leave `args.evidence` absent, and launch. The run
proceeds, and every prompt is byte-identical to an evidence-less run (G3). With no rows there is
nothing to skip and nothing to log. The engine drops any stray evidence-type row at entry as a
backstop and counts the drops on its own loud line (ruling #2404), so this strip is the first
line, not the only one.
