# Red Team — lenses, probes, schemas, report

## Spine lenses (always run)
The six universal lenses live in [`../assets/workflow-scaffold.js`](../assets/workflow-scaffold.js) (`SPINE`):
- **claims-vs-reality** — every concrete claim (file/symbol/signature/line/"before" snippet) checked against the live repo.
- **executable-proof** — every test/command/edit the plan ships is run in a sandbox; assert it matches the stated "Expected".
- **coverage-vs-source** — every requirement in the source spec/issue maps to a plan step; unmapped = Major gap. Merged arm: when the source IS the plan itself (Part 1 carries the decision record — the plan is its own source of truth; `--spec` defaults to the plan), the lens reads Part-1→Part-2 coverage: every Part-1 requirement/decision maps to a Part-2 phase/task.
- **consistency-placeholders** — TBD/TODO/vague steps, name/signature drift, contradictions.
- **dependency-feasibility** — assumed interfaces/deps/tools exist; ordering is sound.
- **intent-vs-plan** — fires on either intent heading (`## Commander's Intent` or `## AI-Commander's Intent`): each End-state condition individually checkable (else Major) and mapped to ≥1 claiming phase (else Major); collectively sufficient for the Purpose (else Major `needsDecision`). An `## AI-Commander's Intent` block is intent-present and judged identically, plus one Minor note recommending the human upgrade path (`/war-strategy <plan>`); a plan with **neither** heading passes with a Minor note recommending the intent interview — never Major.

## Drift-guard spine probes (run every red-team)
Three universal doctrine probes the Lead runs on every plan (vacuous when the plan has no matching feature; none skipped under `--fast`), enforcing ADR 0025's drift-guard discipline. **Not** members of the `SPINE` array — Lead-run like the backstop-legitimacy check (see [backstop-legitimacy.md](backstop-legitimacy.md)):
- **`unguarded-new-mirror`** — analyzed. Every new inline mirror of a canonical export a plan adds (a `const` in `workflow-template.js` re-declaring `HARD_ESCALATION_REASONS` / a `landDecision` set / a roster helper) must ship a matching **mirror-registry** row in `workflow-template.test.mjs` in the same task; a mirror with no row is a plan defect (`needsDecision`). Prove by grepping the plan's file list — an added `const` with no registry-row edit in the same task is the fail.
- **`default-flip-old-absent`** — executed. Every default-flip / scope-narrow task's gate must assert the OLD value **absent** across every enumerated surface, not just NEW-present. Prove in a sandbox: leave one stale surface carrying the old value and run the gate; a still-green gate is the defect (`NEW-present` alone is the recorded failure mode).
- **`guard-split-deps-edge`** — analyzed. Every drift guard a plan authors must ride in the **same task** as the fact it guards, or — when split into a different task of the same phase — carry a `deps` edge onto the task authoring that fact; **same wave is insufficient**, because every task worktree is cut from one frozen phase base, so the split guard is red by construction at its own base. Scope is wider than `unguarded-new-mirror`: *any* split drift guard counts — prose mirrors and doc-guard tests included, not only inline `const` mirrors. Prove by reading the plan's per-task `Files:`/`deps:` lists — a guard task with no `deps` edge onto the fact-authoring task is the fail (`needsDecision`), grilled until the plan adds the edge, merges the two tasks, or moves the guard a phase later. Vacuous when the plan splits no guard away from its fact; not skipped under `--fast` (ADR 0025 Consequences).

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
| per-task merge-commit anchor (`<merge>^1`, `--first-parent` per-task diff, post-merge three-dot floor base) | `ff-topology` | executed | "In a **fresh `git init` synthetic repo** (never a copy of `repo` — nothing in `repo` is read or run), build WAR's real integration topology: base commit → integration branch → ≥2 'task' integrations done as **fast-forward** merges (a linear single-parent chain — NO per-task merge commit) → one final `--no-ff` phase-land merge. Then evaluate EVERY plan clause that anchors per-task evidence on merge topology against that fixture: a clause that errors, resolves the wrong commit (`^1` on a single-parent tip walks to the previous commit, under-populating the changed-file set), or degenerates to an empty diff (post-merge `<integration>...<task>` is always empty once the task tip is an ancestor) is **topology-void** → Major, with the fixture output as evidence. **Provision-exempt:** build and evaluate the fixture even if repo provisioning failed or was skipped — this probe never touches the repo copy, so a provision failure never converts it to warn-and-skip. **Vacuous pass:** if on reading the plan no clause actually anchors per-task evidence on merge topology (a false-positive token trigger — e.g. `^1` inside an unrelated code block), return `status:\"pass\"` with `findings:[]` — never invent a clause to evaluate." |

For a plan with **no runnable artifacts** (a design doc/PRD), drop the executed probes; coverage, consistency, feasibility, and ambiguity (`needsDecision`) carry the verification.
The **`ff-topology`** row is **mandatory when triggered** and **`--fast`-proof** (it mirrors the SKILL.md Step 2 rule; the presence-pair guard in [`../assets/workflow-scaffold.test.mjs`](../assets/workflow-scaffold.test.mjs) pins the pair). It takes **precedence over** the no-runnable-artifacts executed-drop above: its fixture is a self-contained synthetic repo, so a `design-doc`/`prd` that anchors on per-task merge topology still runs it.

## Scope-lock, attestation & coverage (foreign-cwd defense)
`/red-team` is routinely launched from project X's session to verify project Y's plan (`--repo` ≠ cwd). A probe agent's ambient cwd + CLAUDE.md + memory **overpower** explicit path args, so prevention alone is insufficient (drift survived absolute paths in the 2026-06-19 incident). The hardening is defense-in-depth:
- **Scope-lock preamble** — the scaffold prepends a hard preamble to **every** probe (spine *and* bespoke) and confirm: ignore the session cwd, the only subject is the fingerprinted plan + `repo`, executed probes work in a throwaway *copy* of `repo`, analyzed probes restrict reads to `repo`, and STOP if the opened plan's title differs. **Bespoke probe authors:** you get this for free, but still write your gist to name the absolute `repo`/`planFile`.
- **Provision step (executed probes)** — when the Lead passes a `provision` list (the pinned, repo-derived setup commands — see Part B's `provision.mjs` / setup-scout), the scope-lock additionally directs every **executed** probe to run those commands **in the sandbox copy, before the baseline**, bringing the tree to a gate-ready state (submodules, dependency install, …). Provisioning is environment setup, not the artifact under test: a **failing** provision step is an env-gap → `status:"warn"` + a note, and is **never** a red/fail verdict (a broken environment must not be mis-scored as a broken plan). Stamp the note finding `envGap: true`; the gate demotes it to a Minor note (`../assets/red-team-gate.mjs` `classify()`), so the enforcement is gate-side and typed, not prompt-trust alone. An empty/absent list adds nothing (back-compat); analyzed read-only probes never provision.
- **Anchor attestation** — every probe must report `read_anchor` (what it read); the gate discards off-target results. This is the layer that catches drift even when the preamble fails.
- **`INCOMPLETE` verdict** — the gate returns `CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED | INCOMPLETE`. `INCOMPLETE` whenever a probe was off-target, dropped, or never ran; the gate **never** returns `CLEARED` on incomplete coverage, and `INCOMPLETE` outranks every other arm including `ADJUDICATED`. The Lead re-runs the off-target/dropped probes before any other verdict can settle.
- **Pre/post ref-diff escape guard (executed probes)** — the Lead runs [`../assets/assert-no-repo-escape.sh`](../assets/assert-no-repo-escape.sh) twice: `--repo <repo> --snapshot <abs-file>` immediately before launching the Workflow (an absolute path outside the target's tree; exit 1 there means residue or dirt **predates** this run and must be resolved, never baselined over), and `--repo <repo> --baseline <that file>` after it returns and before the gate (0 = clean; 1 = an escape — a stray working-tree file, a junk sandbox ref, or any `refs/heads/`/`refs/tags/` ref added, removed, or SHA-moved since the snapshot; 2 = a git/infra error or unreadable baseline, never a pass). Without `--baseline` the ref half is only the junk-**name** heuristic that a probe-invented name slips. A nonzero result routes the verdict through the self-confound gate, **action-provenance first** ([../SKILL.md](../SKILL.md) Step 4): a probe-authored or unresolved delta is a real escape and forbids `CLEARED` until containment re-runs the guard clean *with* `--baseline`, while a delta cleared as foreign — another session's or worktree's ref in a shared ref store — is recorded and does not block `CLEARED`. So a probe that escaped its sandbox (the recorded cwd-reset / bare-push shape) is caught by **detection** even when the SCOPE-LOCK **prevention** preamble failed. This is the ratified replacement for the previously-deferred execution harness (ADR 0033); a full probe-confinement jail was a rejected non-goal — the post-run guard closes the trust gap without one.

## Schemas
`FINDINGS` (per probe) and `CONFIRM` (per adversarial-confirm) are defined in the scaffold. `FINDINGS` has a **required** `read_anchor: { resolved_path, plan_title }` — what the probe ACTUALLY read; the gate validates it against the run's **fingerprint** (`{ absPath, titleLine, tokens }`, computed by the Lead from the absolute `planFile` and passed in `args.fingerprint`). A probe whose `read_anchor` does not match the fingerprint is **off-target**: its findings are discarded and it counts as a coverage failure. Shape of a finding:
```jsonc
{ severity: "Critical" | "Major" | "Minor",
  needsDecision: false,          // true = a hole to grill the user on
  deliverableAbsence: false,     // true ONLY when the 'absent' symbol is mapped by coverage-vs-source to a plan task — the gate never blocks on it
  adjudicated: false,            // Lead-stamped at grill time (never probe-set): this blocker/needsDecision is patched but not re-verified. Typed, strict === true; scanned only over the blockers+needsDecision union, so an unstamped Minor never holds the verdict
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
- **Verdict:** `CLEARED` (no blockers/holes/minors) · `CLEARED-WITH-NOTES` (minors only) · `ADJUDICATED` (every open blocker/hole is patched and Lead-stamped, at least one of them; distinct from a clear — no probe re-proof was run) · `BLOCKED` (an open blocker/hole carrying no stamp) · `INCOMPLETE` (coverage gap — an off-target, dropped, or never-ran probe; re-run before any other verdict).

> **Two-contract summary.** (1) *Probe side* — a finding is a DEFECT only; claims that check out are NOT recorded; a clean probe returns `status:"pass"` with `findings:[]`. (2) *Gate side* — `probeStatus !== "pass"` (warn/fail/absent) still blocks for Critical/Major; `needsDecision` always blocks; only literal `"pass"` demotes a Critical/Major to non-blocker.
>
> _Pinned by the **D7 drift-guard** in [`../assets/red-team-gate.test.mjs`](../assets/red-team-gate.test.mjs): it asserts this two-contract sentence is present in both this file and the CONTRACTS comment in [`../assets/workflow-scaffold.js`](../assets/workflow-scaffold.js), and that `'pass'` is the **only** status demoting a Critical/Major — removing either surface, or widening the demoting set, turns the guard red._

## Report template → `docs/red-team/YYYY-MM-DD-<plan-slug>.md`
```markdown
# Red Team — <plan> (<date>)
**Verdict:** CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED | INCOMPLETE — <one line>

## Attack surface
Spine: <6 lenses>. Bespoke: <probes run>. Executed in sandbox: <which>.
Fallback: <none | analyzed-agent fallback engaged (sticky pin); probes run on general-purpose: names from the dispatchedOn/fallbackEngaged result stamps>.

## Executed proof
- <what ran> → <result, e.g. "tests 20/20 green on Node v26"; "10/10 edits apply">

## Findings
### Critical / Major / Minor
- [<severity>] <claim> → <reality>. Evidence: <…>. Resolution: <patch applied / accepted>.

## Resolutions applied (grill decisions)
- <finding> → <decision> → <plan ref patched>

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. Leave empty (or omit) when no authoritative value was adjudicated — an empty block is byte-identical no-op for the auditor.
     Every row carries its OWN provenance token — `operator-ratified (<date>)` or `AI-declared` — never a block-level marker: one run can mix operator rulings with Lead self-adjudication (--afk) in the same report (ADR 0014's heading-level provenance, taken to per-row grain; ADR 0043 Decision 5).
     Carve-out granularity, when a row excludes a registry/both-surfaces-pinned span from a shrink: THE EXTRACTION'S READ IS THE CARVE-OUT — it covers exactly the bytes that row's drift-guard extraction actually reads. Ordered/positional-key regions are atomic; unread residue stays shrink-eligible; the rationale is bounded to runtime prompt strings and never transfers to a standing-doc card span. See docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md § Carve-out granularity. -->
- <adjudicated literal> supersedes <plan-body literal it replaces> — <plan ref / reason> — <operator-ratified (<date>) | AI-declared>

## Residual risk
- <minor notes / accepted assumptions>
```

## Safety
- Never mutate the repo's source or run the plan against the real repo — sandboxes only, cleaned up.
- A `fail` needs reproduced evidence; unreproduced findings are downgraded. When you (the Lead) adjudicate a confirmed `fail` at Steps 4–5, apply the **self-confound gate** first — rule out the probe's own provision commands, sandbox reuse, or an earlier probe's mutation as the cause before the finding stands.
- Never "execute" an irreversible/outward-facing plan step (push/deploy/send) — analyze it.
