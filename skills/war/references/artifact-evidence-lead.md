# Artifact evidence — the Lead procedure

The `/war` Lead's side of the REA evidence gate (plan `2026-10-20-rea-artifact-evidence` D4, D8;
G1, G3, G10). The doctrine home is
[artifact-evidence.md](../../war-strategy/references/artifact-evidence.md); the operator-facing
setup walkthrough is [rea-setup.md](../../war-room/references/rea-setup.md). This file restates
no grammar, no path value and no member literal: it names exports.

## Run the parser at Decompose

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/target-artifacts.mjs <plan.md>` once at the
Decompose gate. It prints `{ rows, citingTasks }`: `rows` are the `**Target artifacts**` block
rows (path, sha256, provider), `citingTasks` the task ids whose `Plan slice:` cites a `rea:` tag.
Exit 2 is a malformed block: stop and show it at the gate, never thread a partial list. The
engine never scans plan text; this output is the only block signal it gets.

## Resolve REA presence

Resolve presence before launch, the same two ways `/war-room` does (G1):

1. the tool registry carries the presence tool `mcp__rea__binary_session` (the client registered
   the `rea` MCP server), or
2. `zsh -c 'rea doctor --json'` or `bash -c 'rea doctor --json'`, a non-interactive shell on
   purpose, reports every provider the rows name as ok (the per-provider rows in
   rea-setup.md § Verify).

`run.evidence` must be `true` in the resolved config as well. Both must hold; the engine never
probes.

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
- the evidence seat rows: for each task id in `citingTasks`, and only those, add one roster seat
  `{ lens: <EVIDENCE_LENS>, depth: 'deep', agentType: <the evidence member of SEAT_AGENT_TYPES> }`.
  Both are `war-config.mjs` exports; read the values from the export, never from a doc. That
  task's other seats cap at 4 (the five-seat ceiling, G10). `validateRoster` in both copies rejects
  the row while `run.evidence` is off, and `resolveWidenSource` never nominates the lens
  (`WIDEN_BARRED_LENSES`).

The worker commits its digest manifest at the path `MANIFEST_PATH_TEMPLATE` names (an export in
`target-artifacts.mjs`). The engine renders that path into the dispatched clause and the seat
prompt; thread nothing for it.

## Skip with one loud line

When either precondition fails (`run.evidence` off, or presence unresolved) and the parser
returned rows, skip the seat add and log exactly one line at the Decompose gate that names the
failed precondition:

`REA ARTIFACT EVIDENCE: evidence seat skipped — <run.evidence off | REA absent>; <n> declared target artifact(s) go unmeasured this run.`

Then still thread `args.targetArtifacts`, leave `args.evidence` absent, and launch. The run
proceeds, and every prompt is byte-identical to an evidence-less run (G3). With no rows there is
nothing to skip and nothing to log.
