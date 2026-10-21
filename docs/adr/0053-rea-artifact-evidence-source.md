# REA artifact evidence as an opt-in source class

**Status:** accepted (ratified by
[the plan](../plans/2026-10-20-rea-artifact-evidence.md), decisions D3, D5, D13 and D19, pins
PIN-3 and PIN-16; red-team report `docs/red-team/2026-10-20-rea-artifact-evidence.md`)

WAR's D4 evidence tag admitted two sources: the live repo and its issues. A shipped binary, app,
bundle or firmware image was not a source class, so a plan about reconstructed behavior carried
`[assumed:]` where a measurement existed. REA returns Evidence records that carry an id, the
target's SHA-256, the provider and its limitations, and it marks returned target content as
untrusted. Its MCP server reaches a dispatched agent only through the capability allowlist that
[ADR 0002](0002-scope-by-agent-type.md) makes the primary confinement. Admitting the records with no
rule would let target text into plans and prompts, and would hand every agent type a tool that can
mutate a target or a device. The decision passes the ADR triad: a tag grammar is hard to reverse
once plans cite it, the rule is surprising without context, and it trades confinement against
measurement.

## Decision

**A REA Evidence record is a `(verified:)` source bound to the target's digest, behind a plan-side
Target artifacts block (its marker is `TARGET_ARTIFACTS_MARKER` in `target-artifacts.mjs`) and the
run-side `run.evidence` knob. Target content is cited, never pasted. Proof that REA behaves is a
backstop, never a CI job. The MCP matrix is stated by agent type, and the evidence-auditor MCP hook
owns the allow and deny sets.** Five parts follow.

### 1. The source class

- One more source form of the D4 tag, no new kind. The tag grammar, the 64-hex digest rule, the
  staleness exemption and the cite-only rule live in
  [artifact-evidence.md](../../skills/war-strategy/references/artifact-evidence.md). Every other
  surface points there or carries a value a drift guard extracts and compares to its export. This
  ADR restates none of it.
- The base is the artifact digest, never a git SHA. A digest-bound measurement cannot go stale while
  the digest holds, so no run re-measures it (the plan-interview D12 exemption).
- A plan declares its targets with the Target artifacts block in Part 1: path, sha256 and provider
  per row, with placement latitude and never a new required H2
  ([ADR 0044](0044-authoring-contract-and-merged-artifact.md)). `target-artifacts.mjs` parses the
  rows and exports `TARGET_ARTIFACTS_MARKER`, `MANIFEST_PATH_TEMPLATE` and `MANIFEST_KEYS`. The
  Lead threads the parser's `rows` as `args.targetArtifacts`. The engine never scans plan text.
- Off by default. `run.evidence` absent is off, and every prompt is byte-identical when off. WAR
  never depends on REA: the Lead resolves presence before launch and threads it as an arg. With REA
  absent the run proceeds, logs one loud line and seats no evidence auditor.

### 2. Cite-only

- Target content never enters a plan, a prompt, a verdict, an issue body or a lesson. A plan cites
  the record and states the conclusion in its own words.
- Bundles live only under `$MAIN/.claude/war/evidence/<plan-slug>/`, written after
  `provision-worktrees.sh ensure-exclude $MAIN` has run. They are untracked, never committed.
- A worker whose task cites artifact evidence commits a payload-free digest manifest on the task
  branch, carrying only the keys `MANIFEST_KEYS` exports, at the path `MANIFEST_PATH_TEMPLATE`
  names.
- Enforcement is the advisory lint (`rea-source-base`, `target-content-paste`) plus the red-team
  `untrusted-content` probe. It is never a merge floor and never a hard `/war` gate.

### 3. Backstop-only proof (D13)

CI proves the wiring: the knob, the roster rules, the parser, the guards, the prompts and the
doc-token guards. It never proves that REA behaves, because no CI job installs REA. That proof is
the operator's smoke run before the release phase lands (backstop B1) and the first real run with a
cited artifact (backstop B2), each recorded in the plan's backstops section.

### 4. The MCP matrix (D3, PIN-11), by agent type

| Agent type | REA tools reachable |
|------------|---------------------|
| `war-auditor` | none |
| `war-servitor` | none |
| `war-refiner` | none |
| `war-evidence-auditor` | the allowlist only |
| `war-worker` | the allowlist only |

The allowlist holds the tools that pass the effect predicate: never `mutatesTarget`,
`executesForeignCode`, `mutatesDevice` or `destructive`, derived at the REA version measured at
land. The owner of the allow and deny sets is the evidence-auditor MCP hook, under the PreToolUse
matcher `hooks.json` registers for it. The hook holds the allowlist literal as full tool names,
strips any server prefix and compares the tool suffix, fails closed on anything unlisted, and
carries a live-name canary. The evidence-auditor card's `tools:` REA entries are guarded set-equal
to the hook's literal, and the presence-check tool is guarded as a member. This ADR names the hook
by role only, never by file path or matcher value, because the hook lands in a later phase of the
plan than this record.

### 5. The evidence seat

- A new agent type, the evidence member of `SEAT_AGENT_TYPES` (`war-config.mjs`). `runSeat`
  dispatches `seat.agentType` from that allowlist and refuses an unlisted type. `validateRoster`
  rejects an evidence-type row unless `run.evidence` is `true`, and caps non-evidence seats at 4
  beside an evidence seat. The five-seat ceiling holds everywhere else.
- Its lens is `EVIDENCE_LENS`, a `WIDEN_BARRED_LENSES` member. `resolveWidenSource` refuses it in
  both copies. Every doc surface states the widen refusal by export name, never as a closed pair
  (D19, PIN-16): a nomination is valid when it is never a `RESERVED_LENSES` or
  `WIDEN_BARRED_LENSES` member. `agents/war-auditor.md` lags by backstop B4. `README.md` and the
  `CONTEXT.md` lens-catalog note describe `RESERVED_LENSES` itself and stay untouched.
- The seat measures for itself. Under [ADR 0041](0041-audit-evidence-precedence.md)'s amendment
  row, the REA-reported subject sha256 matched against the digest manifest committed at
  `audit_sha` is rung 1. The seat HOLDs only on a mismatch. Every other REA finding is SOFT, and REA
  unreachable is `cannot-confirm`. A regular seat never re-measures a `rea:` claim and never holds
  on one: `agents/war-auditor.md` is byte-untouched, and regular seats receive one gated dispatched
  line that names `artifact-evidence.md` as its source.
- Both existing guards deny the new type what they deny `war-auditor`: every write, and every
  non-git command.

## Considered options

- **A new D4 kind (rejected).** A kind is a grammar fork on every lint rule and every reader. One
  kind with one more source form keeps the lint at one rule and the reader at one shape.
- **Committing full evidence bundles (deferred).** A bundle carries target content, which cite-only
  forbids in the repo. A later plan may add an operator-asked opt-in.
- **A hard cite-only gate (rejected).** A merge floor on a prose shape pays its false positives at
  every merge. The advisory lint plus the red-team probe catch the paste where it is cheap to fix.
- **Regular seats re-measure a `rea:` claim (rejected).** A digest-bound claim cannot go stale, and
  re-measurement would need REA on every seat, which the matrix forbids.
- **An allowlist keyed on the full registered name (rejected).** A server rename would deny every
  tool silently. The suffix key survives a rename, and the live-name canary catches a tool rename.

## Relationship to prior ADRs

- [ADR 0002](0002-scope-by-agent-type.md) — the matrix is scope-by-agent-type applied to MCP
  tools: the capability allowlist stays primary, and the hook is defense in depth.
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — REA settles facts, never Purpose, Method or
  End states.
- [ADR 0025](0025-drift-guard-discipline.md) — every restated machine fact is guarded by extraction
  plus equality (the doc-token guard, the card-vs-hook set equality, the F07 mirror rows) or
  de-mirrored to the export name.
- [ADR 0041](0041-audit-evidence-precedence.md) — the evidence seat's rung lives there as an
  amendment row.
- [ADR 0042](0042-prompt-surface-budgets.md) — `artifact-evidence.md` is the one cold home; the
  cards and SKILLs carry pointers, and every budgeted surface stays under its hard line.
- [ADR 0044](0044-authoring-contract-and-merged-artifact.md) — the Target artifacts block is
  Part 1 latitude, never a new extraction heading.

## Consequences

- A plan can rest on what a shipped artifact does, and the claim rides the same tag a repo claim
  rides.
- Four glossary terms join `CONTEXT.md` `### Audit`: Artifact evidence, Target artifacts block,
  Evidence seat and Digest manifest. Each points at its home or its export and restates nothing.
- A run with the knob off is byte-identical to a run before this ADR. A run with the knob on spends
  one roster slot on the evidence seat.
- **Sharp edge:** the lint is advisory, so a pasted decompiler header reaches the plan body until
  `/red-team`'s `untrusted-content` probe runs.
- **Sharp edge:** the allowlist is derived at one REA version. A REA upgrade that adds a tool leaves
  the new tool denied until the hook is re-derived, because the hook fails closed.

## Decision log

- 2026-10-20 · ADR authored: the source class, the cite-only rule, the backstop-only proof, the MCP
  matrix by agent type with the evidence-auditor MCP hook as the owner of the allow and deny sets,
  the evidence seat and the widen-refusal wording · plan 2026-10-20-rea-artifact-evidence
