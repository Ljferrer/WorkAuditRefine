# Red Team — lenses, probes, schemas, report

## Spine lenses (always run)
The five universal lenses live in [`../assets/workflow-scaffold.js`](../assets/workflow-scaffold.js) (`SPINE`):
- **claims-vs-reality** — every concrete claim (file/symbol/signature/line/"before" snippet) checked against the live repo.
- **executable-proof** — every test/command/edit the plan ships is run in a sandbox; assert it matches the stated "Expected".
- **coverage-vs-source** — every requirement in the source spec/issue maps to a plan step; unmapped = Major gap.
- **consistency-placeholders** — TBD/TODO/vague steps, name/signature drift, contradictions.
- **dependency-feasibility** — assumed interfaces/deps/tools exist; ordering is sound.

## Bespoke probe catalog (derive from the plan's features)
Add one probe per matching feature (edit the scaffold's array or pass `args.probes`):

| Plan feature | Probe `name` | `technique` | Prompt gist |
|---|---|---|---|
| before/after edit snippet | `snippet-fidelity` | analyzed | "Confirm each 'before' snippet appears VERBATIM in the live file; report drift + the actual text." |
| code block + test block | `tests-run` | executed | "Extract the module + test to a temp dir, run the test runner, report the pass/fail counts." |
| shell command + expected output | `command-diff` | executed | "Run the command in a sandbox; diff actual vs the stated Expected." |
| cited line numbers | `anchor-check` | analyzed | "Confirm each cited line number points where the plan says." |
| "no X → today's behavior" baseline | `baseline-repro` | executed | "Reproduce the baseline in a sandbox and confirm the claimed equivalence." |
| new dependency / tool | `dep-resolves` | executed | "Confirm the dep/tool resolves or installs in a sandbox." |
| multi-file edit ordering | `edits-compose` | executed | "Apply all edits to a scratch copy in order; confirm they compose and the result builds." |

For a plan with **no runnable artifacts** (a design doc/PRD), drop the executed probes; coverage, consistency, feasibility, and ambiguity (`needsDecision`) carry the verification.

## Schemas
`FINDINGS` (per probe) and `CONFIRM` (per adversarial-confirm) are defined in the scaffold. Shape of a finding:
```jsonc
{ severity: "Critical" | "Major" | "Minor",
  needsDecision: false,          // true = a hole to grill the user on
  claim: "what the plan asserts",
  reality: "what red-team found",
  evidence: "reproduced proof — error output, diff, transcript",
  fix: "suggested resolution",
  planRef: "Task/Step/line" }
```

## Severity & gate (enforced by [`../assets/red-team-gate.mjs`](../assets/red-team-gate.mjs))
- **Critical** — provably false in a way that breaks execution (test fails, edit won't apply, file/symbol absent). Blocks.
- **Major** — real defect or coverage gap → wrong/incomplete results. Blocks.
- **Minor** — cosmetic/robustness. Auto-note; auto-fix when unambiguous.
- **`needsDecision`** — an underspecified hole (an ambiguity with >1 non-equivalent resolution) → grill the user, at any severity. Probe agents set `needsDecision:true` on any such finding.
- **Verdict:** `CLEARED` (no blockers/holes/minors) · `CLEARED-WITH-NOTES` (minors only) · `BLOCKED` (open blocker/hole).

## Report template → `docs/red-team/YYYY-MM-DD-<plan-slug>.md`
```markdown
# Red Team — <plan> (<date>)
**Verdict:** CLEARED | CLEARED-WITH-NOTES | BLOCKED — <one line>

## Attack surface
Spine: <5 lenses>. Bespoke: <probes run>. Executed in sandbox: <which>.

## Executed proof
- <what ran> → <result, e.g. "tests 20/20 green on Node v26"; "10/10 edits apply">

## Findings
### Critical / Major / Minor
- [<severity>] <claim> → <reality>. Evidence: <…>. Resolution: <patch applied / accepted>.

## Resolutions applied (grill decisions)
- <finding> → <decision> → <plan ref patched>

## Residual risk
- <minor notes / accepted assumptions>
```

## Safety
- Never mutate the repo's source or run the plan against the real repo — sandboxes only, cleaned up.
- A `fail` needs reproduced evidence; unreproduced findings are downgraded.
- Never "execute" an irreversible/outward-facing plan step (push/deploy/send) — analyze it.
