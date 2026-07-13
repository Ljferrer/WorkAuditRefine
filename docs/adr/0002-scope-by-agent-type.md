# Worker write-scope is enforced by `agent_type`, not a per-worktree env var

**Status:** accepted

The worktree-scope guard keys off the `agent_type` field in the PreToolUse hook payload, not the
`WAR_WORKTREE` environment variable. A runtime probe (2026-06-25, recorded in the worktree
provisioning design spec) proved the env-var mechanism is a NO-OP in the agent flow, and proved
that *exact* per-worktree confinement is unattainable in this harness — so we enforce a coarse
structural guard instead and explicitly drop exact confinement.

## Considered options

- **Per-worktree `WAR_WORKTREE` env var (status quo).** Rejected — proven ineffective:
  - The hook reads `WAR_WORKTREE` from its own process env; no `Agent`/`agent()` spawn-time env
    injection exists.
  - A worker's prose `export WAR_WORKTREE=…` dies with that Bash shell (`persist_check=UNSET` in
    the probe) and never reaches a later Write-hook process.
  - The only env a hook inherits is session-global — a single value that cannot differ across the
    parallel workers in a wave.

- **`agent_id` registry for exact confinement.** Rejected — infeasible:
  - `agent_id` is unique per subagent and present in the hook payload, but the worker **cannot read
    its own `agent_id`** (absent from its environment), so it cannot self-register
    `agent_id → worktree`.
  - The spawner only learns a worker's `agent_id` *after* the agent returns — too late to register
    before the worker's first write.

- **`agent_type` structural guard (chosen).** The hook reads `agent_type` (set by the spawner,
  always present for subagents) and confines writes by role: WAR workers → the WAR worktrees root;
  the servitor → the learnings target; auditors → no writes; refiner / main session → unrestricted.
  Enforced, with zero worker cooperation, zero registry, and no races.
  **Confinement layering:** the capability allowlist (no Bash for the servitor; read-only tools for
  the auditor) is the **primary confinement**. The `agent_type` hook and the `..`-traversal guard
  (which fires pre-`case`, covering ALL agent types) are **defense-in-depth** — they gate the
  residual Write/Edit paths that survive the allowlist check
  (`adr-policy-table-entry-vs-mechanism-attribution`, D4).

## Consequences

- The catastrophic case — a worker clobbering the main checkout or shared integration base — is
  blocked.
- **Accepted residual:** a worker could in principle write into a *sibling* worktree (both are
  `war-worker` writing under the worktrees root). Mitigated by absolute-path discipline in worker
  prompts and auditor diff review; not a hard guarantee.
- The guard depends on WAR's worktree **path convention** (so the hook can derive the worktrees
  root from the run's cwd) and on a small `agent_type → allowed-root` policy table.
- The hook is rewritten as part of the worktree-provisioning design; the old `WAR_WORKTREE` guard
  is retired.

## Addendum — 2026-07-12: confinement residual narrowing (#809, #810)

Two consciously-ratified residuals of the `agent_type` guard family were narrowed **without changing
the ratified posture**. Detection coverage and anchor precision moved; the fail-open refiner/main arm,
the warn hook's always-`exit 0` contract, and the deferred per-run memory-root anchoring all stayed
exactly as ratified above.

**Three narrowings.**

1. **Worker Bash-write detection widened** (`warn-bash-write-scope.sh`, #809). The advisory warn hook
   now resolves relative redirect targets (`> foo`, `a>b`) against the payload's `.cwd` instead of
   skipping them, and scans interpreter `-c`/`-e` payloads (`python`/`perl`/`ruby`/`node`) that carry a
   write-indicative token (`open(`, `write`, `writeFile`) for absolute-path tokens. Only the redirect
   extractor was widened to relative targets; every other extractor stays absolute-only (documented
   ceiling). Still **advisory only — always exits 0, never blocks** (re-ratification 1).
2. **Servitor write glob `$HOME`-anchored** (`validate-worktree-scope.sh`, #810). The servitor arm now
   allows only a path under `$HOME/.claude/projects/<project>/memory/` (`${HOME:-}` spelled throughout,
   so a `set -u` run with `HOME` unset does not kill the hook before the fallback; a trailing slash is
   normalized off with `${home%/}` so the pattern never forms a `//`). When `$HOME` is unset or empty
   the arm falls back to the pre-#810 unanchored shape glob — failing toward the ratified cross-project
   residual (re-ratification 2), never toward deny-all. That fallback branch and the content-gate
   classifier in `validate-servitor-provenance.sh` are the **only two sanctioned survivors** of the
   unanchored-glob sweep; the classifier is deliberately left unanchored because for a content gate
   broader capture means *more* provenance enforcement (fail-safe — the opposite direction from a
   deny/allow scope gate).
3. **All six agent-type arms suffix-anchored** (`*war-<role>`, not the former substring form) across
   `validate-worktree-scope.sh` (auditor / worker / servitor), `validate-auditor-git.sh`,
   `validate-servitor-provenance.sh`, and `warn-bash-write-scope.sh`. The dispatched type is
   `work-audit-refine:war-<role>` (source: `workflow-template.js`'s `NS` constant, default prefix
   `work-audit-refine:`), which a suffix anchor still captures while rejecting a trailing-junk
   decoration.

**Two re-ratifications (posture unchanged).**

- **Advisory-only posture retained.** `warn-bash-write-scope.sh` still carries zero `exit 2` / `deny`
  routes and a terminal `exit 0`; blocking mode stays deferred until the widened detector proves
  false-positive-free in the field.
- **Cross-project-under-`$HOME` residual retained.** A servitor write into another project's memory
  dir under the user's own `$HOME` is still allowed — per-run PROJECT-SLUG threading into a hook
  process is structurally unavailable (probe E1, #58). It is bounded at runtime by the servitor's
  no-Bash capability allowlist (the **primary** confinement) and the provenance hook's existing-target
  mutation guard.

**Suffix-anchoring capture consequence (spec §8).** Confinement is now **per known agent type**: a
future `<ns>:war-servitor-v2` would fall through to the fail-open default arm (capability-first — a new
role inherits no legacy confinement until its own arm is added). The inversion risk is real:
under-capture on a *deny-side* arm (auditor / servitor) fail-opens a read-only agent — strictly worse
than the over-capture it replaced. The exact-shape test cases (the exact `work-audit-refine:war-<role>`
still captures in every arm) are the guard against that inversion; a live-payload canary (plan
backstops) is the field proof.

**Symlinked-home residual.** The hook never `realpath`s — it compares the spelled `$HOME` prefix. The
Lead's `memoryLocalRoot` derives from the *same* `~` expansion as `$HOME`, so the servitor's
`file_path` normally shares that spelling. A realpath'd-vs-spelled mismatch (e.g. `/private/var` vs
`/Users`) surfaces as the named servitor deny, whose message states both the anchored expectation and
the fallback condition. **One-line rollback:** revert the servitor case pattern to the bare shape glob.
