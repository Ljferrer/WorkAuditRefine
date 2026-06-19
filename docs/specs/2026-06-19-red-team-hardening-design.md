# /red-team Hardening — Design

**Status:** proposed (targets **v0.4.2**, after the v0.4.1 wrap-up fix). Spec of record for making `/red-team` robust against verifying the **wrong plan** and against **silent coverage loss**.

Affected surface: the editable engine [`skills/red-team/assets/workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js), the gate [`skills/red-team/assets/red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs), the runbook [`skills/red-team/SKILL.md`](../../skills/red-team/SKILL.md), and the catalog [`skills/red-team/references/lenses.md`](../../skills/red-team/references/lenses.md).

## 1. Problem — three failure modes (observed 2026-06-19)

Running `/red-team` on a plan that lived in *this* repo, but from a session whose cwd was an **unrelated project** (an OmniEMR worktree), exposed three independent failures (full evidence: [`docs/red-team/2026-06-19-land-path-agnostic-wrap-up.md`](../../docs/red-team/2026-06-19-land-path-agnostic-wrap-up.md)):

- **F1 — wrong-target drift.** Probe agents red-teamed the *OmniEMR* plan in the session cwd instead of the plan at the absolute `planFile` they were given. The agents inherit the session's cwd + CLAUDE.md + memory; "the plan"/"the repo" resolved against that ambient context, beating the explicit args.
- **F2 — silent coverage loss.** 3 of 7 probes returned `null` (died). The scaffold's `results.filter(Boolean)` dropped them, so the gate scored only the survivors and could have returned CLEARED on partial coverage.
- **F3 — no self-check.** Nothing in the machinery noticed F1 or F2; a human caught it by reading the findings. There is no machine assertion that a probe read the right artifact, or that every probe ran.

**The hard constraint that shapes the whole design:** a subagent's injected CLAUDE.md + memory are **session-level and cannot be suppressed from inside the Workflow**. Therefore *prevention alone is never sufficient* — the system must **detect** drift and **refuse to pass** on incomplete coverage. Robustness comes from verification (fail loud, fail closed), not just better instructions.

## 2. Goal / Non-goals

**Goal.** `/red-team` either verifies the correct plan with complete probe coverage, or returns a non-passing verdict that says exactly what went wrong — **never a silently-wrong CLEARED**. A mis-targeted or dropped probe must be impossible to mistake for a passing one.

**Non-goals.**
- Changing the probe taxonomy (spine lenses, bespoke probe kinds) or the adversarial-confirm stage.
- Suppressing the ambient CLAUDE.md/memory injection (infeasible from inside the Workflow — see §6).
- Changing the grill/patch/re-verify loop semantics, beyond adding `INCOMPLETE` handling.

## 3. Design — defense in depth (5 layers + 1 optional)

Decision logic lives in the **testable gate module** (`red-team-gate.mjs`, which has `*.test.mjs`); the un-testable Workflow scaffold stays thin and merely produces well-formed raw data. This mirrors the repo's `land-decision.mjs`-style split.

### Layer 1 — Pre-flight scope assertion + plan fingerprint (deterministic, zero agent cost)
Before any probe launches, the scaffold:
- asserts `planFile` exists and resolves **under** `repo`, and `repo` is a directory (ideally a git repo); aborts with a clear error otherwise (kills the trivial F1 cases for free);
- computes a **plan fingerprint**: `{ absPath, titleLine, tokens }` where `titleLine` is the plan's first `^# ` heading and `tokens` is a short set of distinctive headings/strings. The fingerprint is threaded to the gate and used by Layer 3.

### Layer 2 — Scope-lock preamble on every prompt
A constant preamble is prepended to **every** spine and bespoke prompt:
> "You may be running inside an unrelated project's directory. **IGNORE the session working directory entirely.** The ONLY subject of this red-team is the plan file at `<planFile>` and the repository rooted at `<repo>` (both absolute). Do not read, reference, or reason about any file outside `<repo>`. If a file you are reading does not match the plan's declared repo, STOP — you are on the wrong plan."

All paths passed to probes are absolute. (Reduces F1; cheap. Insufficient alone — drift already survived absolute paths, which is why Layers 3–4 exist.)

### Layer 3 — 🔑 Anchor attestation (detects drift even if 1–2 fail)
The `FINDINGS` schema gains a **required** field:
```jsonc
read_anchor: { resolved_path: string, plan_title: string }   // what the probe ACTUALLY read
```
Because it is required, the StructuredOutput tool forces every probe to report the absolute path and title-line of the plan it read. The **gate** then validates each result:
- `read_anchor.plan_title` matches the fingerprint's `titleLine` (normalized), **and**
- `read_anchor.resolved_path` is absolute and under `repo`.

A mismatch ⇒ the probe is **off-target**: its findings are **discarded** (they describe the wrong artifact) and it is counted as a coverage failure, never as a pass. This converts drift from "silently produces wrong findings" into "deterministically rejected." *This is the layer that would have auto-caught the 2026-06-19 incident.*

### Layer 4 — 🔑 Coverage accounting, retry, and a fail-closed gate (no silent pass)
- The scaffold **stops** silently `filter(Boolean)`-ing results. It tracks `expected = allProbes.length` and emits, for every probe slot, a result or a `dropped` marker (probe name + null). It **retries a dropped probe once** with a hardened prompt before giving up.
- The scaffold's return becomes `{ plan, fingerprint, expected, probeResults }` (probeResults includes dropped markers).
- The gate classifies coverage from `expected` + `probeResults` + fingerprint: `{ onTarget, offTarget: [names], dropped: [names] }`, discards off-target findings, and adds a terminal verdict **`INCOMPLETE`**: returned whenever `offTarget.length || dropped.length || ran < expected`. The gate **never returns CLEARED on incomplete coverage**. Its `summary` reports `expected` vs `onTarget`.
- SKILL.md step 4/6 handles `INCOMPLETE` by re-running the off-target/dropped probes (bounded, ≤ the existing 2 rounds) before the verdict can settle; a persistent `INCOMPLETE` is surfaced to the user, not silently downgraded.

### Layer 5 — Foreign-cwd handling in the runbook
SKILL.md (Setup / step 2) makes the Lead:
- resolve `repo` to an absolute path; detect when `repo` ≠ cwd (or `planFile` is not under cwd) and **warn**;
- run the probes against a **clean git worktree/checkout of `repo`** passed as the absolute `repo` arg (the manual workaround used in the incident), so even "reading around" lands in the right project;
- document that `--repo` *routinely* differs from cwd; the `--repo = cwd` default holds only when verifying the current project.

### Optional deeper layer — deterministic execution harness for `executed` probes
Today an `executed` probe both *decides* and *runs*, so a mechanical claim's pass/fail depends on agent judgment. Optionally, split it: the probe agent **extracts** the plan's runnable artifacts (code blocks, test blocks, commands + stated "Expected") into a throwaway dir and returns a **manifest**; the scaffold (deterministic) **runs** them and compares output to expected. This removes agent judgment from mechanical verification — it is exactly the by-hand proof the incident fell back to (string-match snippet-fidelity, `node --test`, syntax check). Larger change; specified here, sequenced last.

## 4. Schema & contract changes
- **`FINDINGS`** (scaffold): add required `read_anchor: { resolved_path, plan_title }`.
- **Scaffold return**: `{ plan, fingerprint: { absPath, titleLine, tokens }, expected: number, probeResults: [...] }` — dropped probes appear as `{ probe, dropped: true }` markers, not omitted.
- **Gate input**: accepts `{ fingerprint, expected, probeResults }` (back-compatible: if `fingerprint`/`expected` are absent, behave as today so existing callers/tests don't break).
- **Gate verdict enum**: `CLEARED | CLEARED-WITH-NOTES | BLOCKED | INCOMPLETE`. `summary` gains `expected`, `onTarget`, `offTarget`, `dropped`.

## 5. Affected files
- `skills/red-team/assets/workflow-scaffold.js` — fingerprint pre-flight; scope-lock preamble; required `read_anchor`; no silent filter; retry-dropped-once; new return shape.
- `skills/red-team/assets/red-team-gate.mjs` — anchor validation; coverage classification; off-target discard; `INCOMPLETE` verdict; extended `summary`. (Decision logic lives here — it is the tested module.)
- `skills/red-team/assets/red-team-gate.test.mjs` — new tests (see §7).
- `skills/red-team/SKILL.md` — Layer 5 foreign-cwd handling; pipe the new shape to the gate; handle `INCOMPLETE`; an invariant requiring anchor attestation + complete coverage before any non-`INCOMPLETE` verdict.
- `skills/red-team/references/lenses.md` — document `read_anchor`, the scope-lock preamble, the `INCOMPLETE` verdict, and the optional deterministic-execution harness.
- `.claude-plugin/plugin.json` + `README.md` (`## Status`) — version bump (v0.4.2).
- *(optional deeper layer)* `workflow-scaffold.js` extract-then-run mechanism + a small manifest schema.

## 6. Alternatives considered
- **Suppress the probe agents' CLAUDE.md/memory.** Not possible from inside the Workflow — the injection is session-level. Rejected (infeasible); it is the very constraint that forces a detection-based design.
- **Run `/red-team` as a separate Claude process** with cwd / `--add-dir` scoped to the target repo (true context isolation). Most thorough, but outside the Workflow tool's model and heavy. Deferred; Layer 5's worktree-as-`repo` is the practical approximation.
- **Prevention only (scope-lock + better paths).** Insufficient — drift survived explicit absolute paths in the incident. Detection (Layers 3–4) is mandatory, not optional.

## 7. Validation criteria
Proven primarily by tests on the gate module (and the incident replay):
- A probe whose `read_anchor.plan_title` ≠ the fingerprint is classified **off-target**, its findings discarded, and the verdict is `INCOMPLETE` (never `CLEARED`). *(gate test — the direct F1/F3 regression.)*
- A `dropped` (null) probe is surfaced in `summary` and forces `INCOMPLETE`; the gate never returns `CLEARED` when `ran < expected`. *(gate test — the F2 regression.)*
- Full on-target coverage with no findings → `CLEARED` (preserves today's behavior). *(gate test.)*
- Off-target + on-target mix: off-target findings do not leak into the report; verdict is `INCOMPLETE`. *(gate test.)*
- The scope-lock preamble is present on every emitted probe prompt. *(scaffold inspection / string assertion.)*
- The scaffold still passes the AsyncFunction syntax-check; `red-team-gate.test.mjs` (existing + new) is green.
- **Incident replay:** verifying a foreign-repo plan from a different cwd now yields either correct on-target findings or an `INCOMPLETE` verdict that forces a re-run — never a silently-wrong `CLEARED`.

## 8. Open decisions
1. **Version label** — recommend **v0.4.2** (sequenced after the pending v0.4.1 wrap-up fix). The two are independent; confirm landing order / whether to combine.
2. **Verdict naming** — recommend a distinct **`INCOMPLETE`** state (coverage problem) rather than overloading `BLOCKED` (real problems found). Confirm.
3. **Retry budget** — recommend retrying each dropped/off-target probe **once**; confirm vs more.
4. **Where anchor validation runs** — recommend the **gate is canonical** (testable); the scaffold may optionally do an inline early-abort after the first off-target result (mirrored logic) as a cost optimization. Confirm whether the early-abort is in scope.
