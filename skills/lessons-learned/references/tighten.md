# `tighten` mode — the five-step projection-shrink procedure

Verbatim eviction from `skills/lessons-learned/SKILL.md`'s ``## `tighten` mode`` section
(prompt-surface simplification, spec §4.3; the five steps below are byte-identical to the
pre-eviction SKILL.md text). `SKILL.md` owns dispatch (which mode runs when) and resolves `$MEM`
and `$REPO_ROOT` before loading this file; this file does not repeat the dispatch rule.
Positional references inside the moved steps ("the bare pass", "the Phase 1/5/6/7 subcommands",
"the numbered phases") refer to `SKILL.md`'s housekeeping phases, their original surroundings.

Trigger: the invocation arguments contain `tighten` (`/lessons-learned tighten`).

Five steps, strict order:

1. **Preflight** (read-only — nothing is staged or mutated yet). Run **exactly one** of the fence's
   two lines below — never the fence wholesale. When the invocation named a target
   (`/lessons-learned tighten --target <bytes>`, or a byte figure the operator gave in the ask), run
   the flagged line with the **literal byte figure substituted for the `<bytes>` placeholder**;
   otherwise run the bare line, so the default run is unchanged. If the flagged line exits 1 with the
   `--target` diagnostic, the byte figure was substituted wrong — correct it and rerun the preflight
   (the verb is read-only; nothing was staged or mutated).

   ```bash
   # a target was named — substitute the operator's literal byte figure for <bytes>
   node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" tighten-plan --local "$MEM" --repo "$REPO_ROOT" --target <bytes>
   # no target was named
   node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" tighten-plan --local "$MEM" --repo "$REPO_ROOT"
   ```

   (`--target` defaults to 17,000 = `WARN_BYTES`; a `--target <bytes>` below it binds the pass at that
   figure — the flag sets the cut goal **and** whether the pass triggers at all.)
   Read the printed JSON's `verdict` field — the **effective** read on the **current, live** corpus: the
   stricter of the advisory projection verdict and the `--target` bound (`ok` | `warn` | `refuse`).
   **`verdict: "ok"` — strictly under the effective target — means report
   "nothing to tighten" and stop; no later step runs.** Anything else (`warn` or `refuse`) proceeds —
   the verdict is the stricter of the advisory line (`bytes >= WARN_BYTES`) and the effective `--target`,
   so a `--target` below 17,000 B makes the preflight bind at that target, while a looser one never
   suppresses the advisory `warn`.

2. **Plan.** Reuse that same JSON — `tighten-plan` is the corpus authority; **never re-derive hits,
   floors, or ranking by hand.** Its `eligible` array is the ranked mutation set (ascending `hits`, ties
   by `tier` then `ageDays`), one entry per candidate: `slug`, `hits`, `tier`, `ageDays`, `inbound`,
   `bytesFreed`, a running `cumulativeFreed` — plus, on a cross-root dupe, `dupe: true` /
   `copies: ["local","repo"]`. The top-level `cutIndex` marks how many entries (from the top) the
   **default** proposal strikes to clear `cutGoalBytes` (`currentBytes` down to `target − slack`, `slack`
   = 500 B); `projectedBytes` is the file size if exactly that default set lands. Optionally fold in
   editorial description trims for cells the 160 B cap visibly cut mid-thought — polish only, never
   counted toward the byte math (eviction owns bytes; edits are cosmetic).

3. **Gate** (the single destructive phase — every mutation behind one ask, never a row-by-row
   negotiation). Present the full `eligible` list as a strike-list — slug · hits · tier · age · inbound ·
   bytes, the `cutIndex` entries pre-selected as the default — plus the projected post-run size
   (`currentBytes` minus the *approved* set's `bytesFreed` sum; recompute it if the operator strikes a
   different subset than the default). Collect the approved subset in this one ask.

4. **Execute**, in this order — a struck dupe only fully archives across both sub-steps below, so the
   order is load-bearing, not stylistic:
   - If the approved set touches any `[repo]`-marked slug, first
     `git -C "$REPO_ROOT" checkout -b dev/<YYYY-MM-DD>-memory-tighten` off the current HEAD, so every
     repo-root move below lands on the dedicated branch, never wherever `$REPO_ROOT` happened to be
     checked out.
   - **Local**, reusing the Phase 1/5/6/7 subcommands verbatim (no fan-out — this isn't the audit
     flow): `safe-swap.sh stage "$MEM"` for `$STAGING`, then the same Phase 5 `archive` /
     `render-index` invocations (both flags, `--repo "$REPO_ROOT"` included) against the approved
     local-side slugs in place of a retire/merge list (a struck dupe's **local** half moves now — the
     prefer-local rule wins while both copies are hot; a repo-only slug's sole copy also moves now,
     `git mv`d straight into the branch above) plus any approved editorial trims, then the same Phase 6
     `verify` and Phase 7 `commit` invocations. Take the same stale-staging guard as the bare pass — a
     `stage` refusal over a leftover `.staging` dir means `recover` first.
   - **Repo**, only after the local commit lands: a struck dupe's repo half is now its slug's *sole* hot
     copy, so `archive --local "$MEM" --repo "$REPO_ROOT" <struck-dupe-slugs>` now resolves to it and
     `git mv`s it inside `$REPO_ROOT` (repo-only slugs already moved above — a no-op for them here). Then
     `lint "$REPO_ROOT"` (fail-closed), `git -C "$REPO_ROOT" add -A && git commit` (one commit, covering
     every move this run made). **Before the push**, run
     `bash "${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh" Ljferrer` (the recorded gh-account
     gotcha — a stale active account on a multi-account machine silently drops the PR onto the wrong
     identity), then push and open the PR. Skip every bullet in this step when nothing `[repo]`-marked
     was struck.
   - **If either `archive` call exits 1** it refused at least one slug on an occupied `archive/`
     destination (#1924, the count is on stderr). Nothing was overwritten and nothing is half-written.
     Stop the pass at that point, reconcile each named pair by hand, then re-run the refused slugs.
     On the **repo** half specifically the local swap has already landed, so do not commit or push a
     partial move set: the report's before/after byte figures would contradict the strike list. A
     refused slug is not "struck" — drop it from the report's struck list, or re-run it and re-check.
   - *(Why local-then-repo: `archive`'s prefer-local rule — the fix for the recorded "archiving a dupe's
     local copy frees zero projection bytes" incident — always resolves a slug hot in both roots to its
     local copy; no flag forces the repo copy while a local hot copy survives. A struck `dupe: true`
     entry needs both passes, in this order, to actually drop its row.)*

5. **Report.** Before/after `MEMORY.md` lines + bytes + % full on both axes, the actioned buckets (slugs
   struck: local-only / repo-only / dupe-both), any editorial trims, the PR URL (or "no repo-side change"
   when nothing `[repo]`-marked was struck), and the local swap's backup + `.prev` paths. **When the
   approved subset still leaves the file at or above `target`** (fewer strikes than the default
   `cutIndex`, or the eligible list itself falls short) — **execute anyway, then report the shortfall
   loudly**: bytes still missing plus the next-best candidates (the same `eligible` array from `cutIndex`
   onward). Never silent, never a second automatic gate — the operator re-runs `tighten` by hand for
   another pass if they want to close the gap.
