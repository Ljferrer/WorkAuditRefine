# F01 — Scope guard blind to the Bash write path — Design

**Status:** proposed — targets **v0.6.0** (agent tool-surface change). **Severity: HIGH.**
**Source:** agent-architecture-audit F1 · memory `scope-hook-blind-to-bash-write-path` · relates to
[ADR 0002](../adr/0002-scope-by-agent-type.md), `scope-hook-servitor-pattern-residuals`.

## Problem — "physically confined" is true only for structured-edit tools

The PreToolUse worktree-scope guard is registered on `matcher: "Write|Edit|NotebookEdit"`
([hooks/hooks.json:5](../../hooks/hooks.json)) and the worker / refiner / servitor agents carry **no
`tools:` allowlist**, so they hold full `Bash`. The hook itself concedes the gap:

> "A write with no file_path (e.g. a Bash tool that slipped through the matcher) is always allowed."
> — [validate-worktree-scope.sh:22-23](../../hooks/validate-worktree-scope.sh)

So the servitor's *"physically confines your writes to the learnings path"* ([war-servitor.md:11](../../agents/war-servitor.md),
ADR 0002) and the worker's *"stay inside your worktree"* are **prompt-deep on the Bash path** — `echo >`,
`sed -i`, `tee`, `cp`, `git -C`, `python -c "open(...)"` bypass the guard entirely. The **only** agent whose
confinement is real is the auditor, because it uses a capability allowlist (`tools: Read, Grep, Glob`,
[war-auditor.md:5](../../agents/war-auditor.md)) — not the hook. The fix is to make the servitor look like the auditor.

## Decisions

- **D1 — Servitor confinement becomes real via an allowlist.** Add `tools: Read, Write, Edit, Glob` to
  [war-servitor.md](../../agents/war-servitor.md) (drop Bash). The servitor writes memory files (Write/Edit),
  discovers the memory dir (Glob), reads `MEMORY.md` (Read); it **never commits, branches, or runs git** (ADR
  0002 / its own "Never" section). With Bash removed, hook + allowlist are jointly airtight — a Bash bypass is
  no longer in its capability set.
- **D2 — Worker Bash residual is accepted (consistent with ADR 0002).** The worker genuinely needs Bash (git
  commit/push), and exact per-worktree confinement was proven unattainable in this harness (probe E1). Keep the
  worker's Bash; **correct the docs** to stop claiming physical confinement and state the accepted
  sibling-/parent-write residual plainly, mitigated by absolute-path prompts + auditor review (already the ADR
  0002 posture — make the prose match).
- **D3 — Honest guarantee wording.** Reword the servitor description ([war-servitor.md:3](../../agents/war-servitor.md))
  and the relevant ADR 0002 line so "physically confines" is attributed to the **tool allowlist** (post-D1),
  not to the hook; and the worker's confinement is described as best-effort + reviewed, not physical.
- **D4 — (Open) Optional belt-and-suspenders Bash advisory for the worker.** A `PreToolUse: Bash` hook that
  *warns* (non-blocking) when a redirection / `-C` / `sed -i` target resolves outside a `.war-task` dir. This is
  best-effort only; ADR 0002 already ruled full bash-write parsing **unattainable**, so it must not be sold as a
  guarantee. Default: do not build unless cheap.

## Solution shape

Frontmatter change on one agent + documentation honesty. No change to the hook's logic is required for the
servitor (the allowlist does the work); the hook continues to gate the worker's Write/Edit and hard-deny the
auditor.

## Schema & contract changes

- `agents/war-servitor.md` frontmatter gains `tools: Read, Write, Edit, Glob` (narrows its surface).
- No JSON envelope schema changes.

## Affected files

`agents/war-servitor.md` (allowlist + reword) · `agents/war-worker.md` (residual prose) ·
[docs/adr/0002-scope-by-agent-type.md](../adr/0002-scope-by-agent-type.md) (attribute the guarantee correctly) ·
`hooks/validate-worktree-scope.sh` (comment only; optional D4) · `hooks/validate-worktree-scope.test.sh`
(note servitor-now-by-allowlist; optional D4 case) · `README.md` if it repeats the confinement claim.

## Alternatives considered

- **Bash-target-parsing PreToolUse hook for all writers** — rejected: ADR 0002 ratified exact confinement as
  unattainable; parsing arbitrary shell for write targets is brittle and gives a false guarantee.
- **Drop Bash from the worker** — rejected: the worker needs git.
- **Doc-only, no allowlist** — rejected for the servitor: its guarantee is stated as *absolute* ("physically
  confines"); only an allowlist makes that true.

## Validation criteria

- A servitor (post-D1) cannot invoke Bash — the harness denies the tool; an attempted `Bash echo >> src.py`
  fails as tool-unavailable, not as a hook denial.
- Existing hook unit tests stay green; the servitor case is now covered by capability, not the path-pattern.
- No live-surface claim of "physically confined" remains that the Bash path can falsify (clean-surface grep).

## Open decisions

1. **D4 advisory Bash hook** for the worker — build a best-effort warn, or accept the residual silently
   (recommend: accept; the auditor + absolute-path prompts already mitigate).
2. Whether to also narrow the **refiner** — **no**: the refiner legitimately owns full git.
