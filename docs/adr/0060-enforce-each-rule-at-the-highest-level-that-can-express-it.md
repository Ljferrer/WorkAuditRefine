# Enforce each rule at the highest level that can express it

**Status:** accepted (operator rulings of 2026-11-09 on issues #2782, #2783 and #2784)

## Context

WAR confines each seat (one dispatched agent) in several ways: the engine decides what runs, a
card's `tools:` line removes tools, a hook judges each tool call, Git refuses some outcomes, a
check blocks a merge, and a prompt gives an instruction. Until now no document ranked these ways.
[ADR 0002](0002-scope-by-agent-type.md) set capability-first confinement for seats, and
[ADR 0057](0057-tiny-read-only-git-dispatches-run-on-a-helper-card.md) applied it to two small
dispatches. Neither says which way wins when two can carry the same rule.

The 2026-11-09 investigation of #2784 measured what the lack of a ranking costs. The numbers are
first-turn context (input plus cache read plus cache write on the first model turn), from one
fixed small dispatch with one variable changed per run, on Claude Code 2.1.321.

| Seat and variant | First-turn context |
|---|---|
| `war-refiner`, no `tools:` line (as shipped) | 58,922 |
| `war-refiner` with `tools: Bash, Read, Edit, Write, Grep, Glob` | 37,763 |
| `war-refiner` with that line and a stub body | 20,952 |
| `war-helper` (`tools: Bash`, as shipped) | 19,919 |
| `war-worker`, no `tools:` line (as shipped) | 47,581 |
| `war-worker` with a `tools:` line that names no REA tool | 26,765 |
| `war-evidence-auditor`, 171 REA tools named, no `ToolSearch` (as shipped) | 341,316 |
| `war-evidence-auditor`, the same line plus `ToolSearch` | 26,296 |

Three facts follow from these runs.

- A card with no `tools:` line receives every session tool. In a real run
  (`wf_ff28b4e5-738`) that was 13 tool schemas (56,576 characters), the skills list (32,924
  characters) and 369 deferred tool names (27,628 characters).
- A tool named in a `tools:` line loads its whole schema, unless the line also names
  `ToolSearch`. With `ToolSearch` on the line, each named MCP tool stays deferred: the seat sees
  its name, and loads its schema only when it needs the tool.
- A `tools:` line is a hard fence. `ToolSearch` finds only the tools the line names.

The refiner is confined by its prompt alone. `validate-worktree-scope.sh` lets every refiner call
pass, and the refiner card says so. The same is true of a worker's Bash writes and of the Lead.

## Decision

**Enforce each rule at the highest level of the enforcement ladder that can express it.**

### The enforcement ladder

| Rank | Level | How it enforces | Can the seat bypass it? |
|---|---|---|---|
| 1 | Engine (`workflow-template.js`) | Code decides what is dispatched, to which seat, in what order. Replies are schema-typed and enum-checked. | No. An action the engine never dispatches does not happen. |
| 2 | Capability (the card's `tools:` line) | A tool that is absent does not exist for that seat. | No. |
| 3 | Hook (a PreToolUse guard keyed on `agent_type`) | A script judges each tool call and denies on doubt. | Only through a parse gap in the guard. |
| 4 | Git structure (worktrees, the frozen phase base, the push-first CAS) | The repository refuses or isolates the bad outcome. | Partly. A push CAS holds. A worktree boundary does not. |
| 5 | Check before merge (floors, the gate, auditors) | A check finds the defect and blocks the merge. | The act happens. The merge does not. |
| 6 | Prompt (the card body and the dispatched text) | The seat reads an instruction. | Yes. Nothing stops it. |

Levels 1 to 4 prevent. Level 5 detects. Level 6 asks. Inside level 5, a floor script or the gate
outranks an auditor, because a script is deterministic and an auditor is a model judgment.

### The law

1. Enforce each rule at the highest level that can express it.
2. A lower level may repeat the rule as guidance. It never stands alone for a write to shared
   state (a branch, a remote, an issue, or a file outside the seat's own worktree).
3. The prompt says what to do. Levels 1 to 4 decide what is possible.
4. Orchestration follows the same order. A decision that engine code can make does not go to the
   Lead, and a decision the Lead can make does not go to a seat.

### Least start, for context, tools and permission

Each seat starts with the least context, the fewest tools and the least permission its dispatch
needs. It gains more only at a named trigger.

- **Context.** [ADR 0042](0042-prompt-surface-budgets.md) holds this rule: tier-1 doctrine stays
  inline, and the rest sits behind `when <trigger>, read references/<file>`.
- **Tools.** Every `agents/*.md` card carries an explicit `tools:` line. A line that names more
  than a few MCP tools also names `ToolSearch`, so those tools stay deferred. `ToolSearch` is the
  trigger pointer for tools.
- **Permission.** A guard holds one policy arm per `agent_type`. A seat's arm admits the least
  that seat's dispatches need. A rule that one seat has outgrown changes in that seat's arm, and
  the other arms stay as they are.

### A guard changes before a new agent type is added

When a dispatch needs more than its seat's guard arm admits, first revise that arm. Add a new
agent type only when no arm can express the need. A new card adds a standing surface to keep
true, and a stale guard rule is cheaper to revise than a card is to maintain.

### Named exceptions

Four seats rely on level 6 on the day this ADR is accepted. Three of them write to shared state.

| Seat | Prompt-only surface | Standing? |
|---|---|---|
| `war-refiner` | Every tool call. `validate-worktree-scope.sh` fails open for it (ADR 0002), with `refinery-surface.test.sh` as a level 5 backstop. | No. Issue #2787 tracks the design work. |
| `war-worker` | Bash writes. `warn-bash-write-scope.sh` only warns. Write and Edit are hook-enforced. | No. Issue #2787 tracks the design work. |
| The setup-scout | Every tool call. `agents/war-setup-scout.md` is not on the `agents` list in `plugin.json`, so `/war-room` runs it as a general agent and its `tools: Read, Grep, Glob` line does nothing. | No. The doc-truth plan (Task 3.7) registers the card. |
| The Lead (the main session) | Every tool call. `skills/war/SKILL.md` is its only control inside WAR. | Yes. The operator supervises the Lead. |

No new seat, dispatch kind or guard arm may add to this table without an operator ruling
recorded in the Decision log below.

## Consequences

- Every card gains a `tools:` line, and a test binds that. `war-refiner` and `war-worker` are the
  two cards without one at `ed183b08`.
- The worker's line names `ToolSearch` and the server-level name `mcp__rea`. A worker on an
  evidence task loads the REA schemas it needs, and every other worker pays for the names only
  (30,502 tokens measured). No second worker card is needed. A server-level name is in order for
  a worker, which may write. An auditor card names each tool, never a server. The worker arm of
  `validate-evidence-auditor-mcp.sh` stays the fence on which REA tools a worker may call.
- `war-evidence-auditor` gains `ToolSearch` on its line. Its start falls from about 341K tokens
  to about 26K.
- The small Git relays (`git-snapshot`, `git-confirm`, `git-pin`, `git-pin-snapshot`,
  `tip-probe`) move to `war-helper`. Its arm in `validate-auditor-git.sh` widens to admit what
  those relays run: a pipe between two git commands, and the verbs `ls-remote`, `rev-list`,
  `patch-id` and `hash-object`. The two auditor arms do not change. This extends ADR 0057, whose
  "Snapshot and confirm dispatches also stay there" sentence is superseded when that change lands.
- A hook arm for a tool that a `tools:` line no longer names is unreachable. Such an arm stays as
  a level 3 backstop, and the docs say that it is one.
- A byte spent on a `tools:` line is paid back in tokens on every dispatch. ADR 0042's
  2026-11-09 amendment makes that a valid reason to raise a card budget.

## Decision log

- 2026-11-09 · ADR authored in the living form; ranks the six enforcement levels, states the law, extends least start from context to tools and permission, and names four prompt-only exceptions · issues #2782, #2783, #2784
