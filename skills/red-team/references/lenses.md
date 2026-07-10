# Red Team — lenses, probes, schemas, report

## Spine lenses (always run)
The six universal lenses live in [`../assets/workflow-scaffold.js`](../assets/workflow-scaffold.js) (`SPINE`):
- **claims-vs-reality** — every concrete claim (file/symbol/signature/line/"before" snippet) checked against the live repo.
- **executable-proof** — every test/command/edit the plan ships is run in a sandbox; assert it matches the stated "Expected".
- **coverage-vs-source** — every requirement in the source spec/issue maps to a plan step; unmapped = Major gap.
- **consistency-placeholders** — TBD/TODO/vague steps, name/signature drift, contradictions.
- **dependency-feasibility** — assumed interfaces/deps/tools exist; ordering is sound.
- **intent-vs-plan** — fires on either intent heading (`## Commander's Intent` or `## AI-Commander's Intent`): each End-state condition individually checkable (else Major) and mapped to ≥1 claiming phase (else Major); collectively sufficient for the Purpose (else Major `needsDecision`). An `## AI-Commander's Intent` block is intent-present and judged identically, plus one Minor note recommending the human upgrade path (`/war-strategy <plan>`); a plan with **neither** heading passes with a Minor note recommending the intent interview — never Major.

## Drift-guard spine probes (run every red-team)
Two universal doctrine probes the Lead runs on every plan (vacuous when the plan has no matching feature), enforcing ADR 0025's drift-guard discipline. **Not** members of the `SPINE` array — Lead-run like the backstop-legitimacy check (see the section of the same name in [../SKILL.md](../SKILL.md)):
- **`unguarded-new-mirror`** — analyzed. Every new inline mirror of a canonical export a plan adds (a `const` in `workflow-template.js` re-declaring `HARD_ESCALATION_REASONS` / a `landDecision` set / a roster helper) must ship a matching **mirror-registry** row in `workflow-template.test.mjs` in the same task; a mirror with no row is a plan defect (`needsDecision`). Prove by grepping the plan's file list — an added `const` with no registry-row edit in the same task is the fail.
- **`default-flip-old-absent`** — executed. Every default-flip / scope-narrow task's gate must assert the OLD value **absent** across every enumerated surface, not just NEW-present. Prove in a sandbox: leave one stale surface carrying the old value and run the gate; a still-green gate is the defect (`NEW-present` alone is the recorded failure mode).

## Bespoke probe catalog (derive from the plan's features)
Add one probe per matching feature (edit the scaffold's array or pass `args.probes`):

| Plan feature | Probe `name` | `technique` | Prompt gist |
|---|---|---|---|
| before/after edit snippet | `snippet-fidelity` | analyzed | "Confirm each **anchor/'before'** snippet (the text an edit attaches to) appears VERBATIM in the live file; report drift + the actual text. The plan's proposed **after**-state is its deliverable — EXPECTED absent, **never** report it." |
| code block + test block | `tests-run` | executed | "Extract the module + test to a temp dir, run the test runner, report the pass/fail counts." |
| shell command + expected output | `command-diff` | executed | "Run the command in a sandbox; diff actual vs the stated Expected." |
| cited line numbers | `anchor-check` | analyzed | "Confirm each cited line number points where the plan says." |
| "no X → today's behavior" baseline | `baseline-repro` | executed | "Reproduce the baseline in a sandbox and confirm the claimed equivalence." |
| new dependency / tool | `dep-resolves` | executed | "Confirm the dep/tool resolves or installs in a sandbox." |
| multi-file edit ordering | `edits-compose` | executed | "Apply all edits to a scratch copy in order; confirm they compose and the result builds." |

For a plan with **no runnable artifacts** (a design doc/PRD), drop the executed probes; coverage, consistency, feasibility, and ambiguity (`needsDecision`) carry the verification.

## Scope-lock, attestation & coverage (foreign-cwd defense)
`/red-team` is routinely launched from project X's session to verify project Y's plan (`--repo` ≠ cwd). A probe agent's ambient cwd + CLAUDE.md + memory **overpower** explicit path args, so prevention alone is insufficient (drift survived absolute paths in the 2026-06-19 incident). The hardening is defense-in-depth:
- **Scope-lock preamble** — the scaffold prepends a hard preamble to **every** probe (spine *and* bespoke) and confirm: ignore the session cwd, the only subject is the fingerprinted plan + `repo`, executed probes work in a throwaway *copy* of `repo`, analyzed probes restrict reads to `repo`, and STOP if the opened plan's title differs. **Bespoke probe authors:** you get this for free, but still write your gist to name the absolute `repo`/`planFile`.
- **Provision step (executed probes)** — when the Lead passes a `provision` list (the pinned, repo-derived setup commands — see Part B's `provision.mjs` / setup-scout), the scope-lock additionally directs every **executed** probe to run those commands **in the sandbox copy, before the baseline**, bringing the tree to a gate-ready state (submodules, dependency install, …). Provisioning is environment setup, not the artifact under test: a **failing** provision step is an env-gap → `status:"warn"` + a note, and is **never** a red/fail verdict (a broken environment must not be mis-scored as a broken plan). An empty/absent list adds nothing (back-compat); analyzed read-only probes never provision.
- **Anchor attestation** — every probe must report `read_anchor` (what it read); the gate discards off-target results. This is the layer that catches drift even when the preamble fails.
- **`INCOMPLETE` verdict** — the gate returns `CLEARED | CLEARED-WITH-NOTES | BLOCKED | INCOMPLETE`. `INCOMPLETE` whenever a probe was off-target, dropped, or never ran; the gate **never** returns `CLEARED` on incomplete coverage. The Lead re-runs the off-target/dropped probes before any other verdict can settle.
- **Post-run escape guard (executed probes)** — after the Workflow returns and before the gate, the Lead runs [`../assets/assert-no-repo-escape.sh`](../assets/assert-no-repo-escape.sh) `--repo <repo>` (0 = clean; 1 = a stray working-tree file or junk sandbox ref leaked past a probe's throwaway copy; 2 = git error). A nonzero result routes the verdict through the self-confound gate — never `CLEARED` — so a probe that escaped its sandbox (the recorded cwd-reset / bare-push shape) is caught by **detection** even when the SCOPE-LOCK **prevention** preamble failed. This is the ratified replacement for the previously-deferred execution harness (ADR 0033); a full probe-confinement jail was a rejected non-goal — the post-run guard closes the trust gap without one.

## Schemas
`FINDINGS` (per probe) and `CONFIRM` (per adversarial-confirm) are defined in the scaffold. `FINDINGS` has a **required** `read_anchor: { resolved_path, plan_title }` — what the probe ACTUALLY read; the gate validates it against the run's **fingerprint** (`{ absPath, titleLine, tokens }`, computed by the Lead from the absolute `planFile` and passed in `args.fingerprint`). A probe whose `read_anchor` does not match the fingerprint is **off-target**: its findings are discarded and it counts as a coverage failure. Shape of a finding:
```jsonc
{ severity: "Critical" | "Major" | "Minor",
  needsDecision: false,          // true = a hole to grill the user on
  deliverableAbsence: false,     // true ONLY when the 'absent' symbol is mapped by coverage-vs-source to a plan task — the gate never blocks on it
  claim: "what the plan asserts",
  reality: "what red-team found",
  evidence: "reproduced proof — error output, diff, transcript",
  fix: "suggested resolution",
  planRef: "Task/Step/line" }
```

**Precondition vs deliverable (analyzed probes — shared `preconditionRule` in the scaffold).** A plan *proposes* changes; it has not run. Analyzed probes verify only that the plan's **preconditions** hold against the live repo (the anchor/insertion-point text each edit attaches to exists verbatim, assumed-existing files/symbols/signatures are present, the edits would apply and compose). The plan's proposed new code, new tests, comment edits, and version bumps are its **deliverable** — expected absent, so their finding-shape splits two ways:
- **precondition-missing → a real finding** (a missing/renamed anchor, a false claim about *existing* code, a wrong signature, a drifted line number, an internal contradiction, edits that would not compose).
- **after-state-not-yet-present → NEVER a finding** ("the proposed line/version/test isn't in the repo yet" — that is the expected pre-execution baseline, not a defect).

**Artifact-kind grading (all probes — `futureWorkRule` in the scaffold, ADR 0032).** The precondition/deliverable split above generalizes across probe modes by **`artifactKind`** (`impl-plan` / `tdd-plan` / `design-doc` / `prd`; the Lead classifies it in the pre-flight and threads it in `args.artifactKind` — see [../SKILL.md](../SKILL.md) Step 2; absent ⇒ `impl-plan`, the suppression-safe default). For an `impl-plan` or `tdd-plan`, a claimed-but-unbuilt symbol / test / file is the expected deliverable baseline — **never a finding** — on **executed** probes too, not just analyzed ones; for a `tdd-plan` specifically, a shipped test running **red pre-implementation is `status:"pass"`**, not a defect. The retained-findings carve-out is unchanged: a false claim about *existing* code, a missing anchor, a wrong signature, a drifted line, or an internal contradiction still blocks.

**Deliverable-absence flag (`deliverableAbsence` on a finding).** A probe sets `deliverableAbsence: true` **only** when the 'absent' symbol it flags is mapped by `coverage-vs-source` to a plan task (the plan promises to add it). The gate never counts a `deliverableAbsence:true` finding as a blocker, regardless of severity or probe status — it keys on the typed flag alone, doing no `reality`-string parsing (the gate stays pure). This kills the recorded 16-false-findings `BLOCKED` misfire at the gate layer.

## Severity & gate (enforced by [`../assets/red-team-gate.mjs`](../assets/red-team-gate.mjs))
- **Critical** — provably false in a way that breaks execution (test fails, edit won't apply, file/symbol absent). Blocks **only when the parent probe's `status` is not `"pass"`** (i.e. `warn`, `fail`, or absent). A Critical from a `status:"pass"` probe is a confirmation artifact, not a defect — it does not block.
- **Major** — real defect or coverage gap → wrong/incomplete results. Same status-aware rule: blocks only when probe `status !== "pass"`.
- **Minor** — cosmetic/robustness. Auto-note; auto-fix when unambiguous. Not affected by probe status.
- **`needsDecision`** — an underspecified hole (an ambiguity with >1 non-equivalent resolution) → grill the user, at any severity. **Always blocks, regardless of probe `status`.** Probe agents set `needsDecision:true` on any such finding.
- **Verdict:** `CLEARED` (no blockers/holes/minors) · `CLEARED-WITH-NOTES` (minors only) · `BLOCKED` (open blocker/hole) · `INCOMPLETE` (coverage gap — an off-target, dropped, or never-ran probe; re-run before any other verdict).

> **Two-contract summary.** (1) *Probe side* — a finding is a DEFECT only; claims that check out are NOT recorded; a clean probe returns `status:"pass"` with `findings:[]`. (2) *Gate side* — `probeStatus !== "pass"` (warn/fail/absent) still blocks for Critical/Major; `needsDecision` always blocks; only literal `"pass"` demotes a Critical/Major to non-blocker.
>
> _Pinned by the **D7 drift-guard** in [`../assets/red-team-gate.test.mjs`](../assets/red-team-gate.test.mjs): it asserts this two-contract sentence is present in both this file and the CONTRACTS comment in [`../assets/workflow-scaffold.js`](../assets/workflow-scaffold.js), and that `'pass'` is the **only** status demoting a Critical/Major — removing either surface, or widening the demoting set, turns the guard red._

## Report template → `docs/red-team/YYYY-MM-DD-<plan-slug>.md`
```markdown
# Red Team — <plan> (<date>)
**Verdict:** CLEARED | CLEARED-WITH-NOTES | BLOCKED — <one line>

## Attack surface
Spine: <6 lenses>. Bespoke: <probes run>. Executed in sandbox: <which>.

## Executed proof
- <what ran> → <result, e.g. "tests 20/20 green on Node v26"; "10/10 edits apply">

## Findings
### Critical / Major / Minor
- [<severity>] <claim> → <reality>. Evidence: <…>. Resolution: <patch applied / accepted>.

## Resolutions applied (grill decisions)
- <finding> → <decision> → <plan ref patched>

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into auditPrompt(). Version precedence: task instruction > red-team adjudication > plan body literal. Leave empty (or omit) when no authoritative value was adjudicated — an empty block is byte-identical no-op for the auditor. -->
- <adjudicated literal> supersedes <plan-body literal it replaces> — <plan ref / reason>

## Residual risk
- <minor notes / accepted assumptions>
```

## Safety
- Never mutate the repo's source or run the plan against the real repo — sandboxes only, cleaned up.
- A `fail` needs reproduced evidence; unreproduced findings are downgraded. When you (the Lead) adjudicate a confirmed `fail` at Steps 4–5, apply the **self-confound gate** first — rule out the probe's own provision commands, sandbox reuse, or an earlier probe's mutation as the cause before the finding stands.
- Never "execute" an irreversible/outward-facing plan step (push/deploy/send) — analyze it.
