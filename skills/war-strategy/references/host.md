# Claude planning host

## Optional skill discovery

The Grill Me family is a recommended front door, never a requirement: the interview doctrine lives in-repo
at `references/plan-interview.md`, so the bare invoke runs it directly (§4). To see whether the family is
installed, run:

```sh
find -L ~/.claude/skills ~/.claude/plugins .claude/skills -maxdepth 6 -type d \
  \( -name grill-with-docs -o -name domain-modeling \) 2>/dev/null
```

`-L` because installed skills are routinely symlinks; `-maxdepth 6` because plugin-cache skills live at
`plugins/cache/<mkt>/<plugin>/<ver>/skills/<name>` (depth 6); `2>/dev/null` because missing roots (most repos
have no `.claude/skills`) error noisily. Judge emptiness on **stdout only — never the exit code**.

Non-empty stdout → offer the Grill Me route: the operator may prefer its interviewing voice, and the HANDOFF
DIRECTIVE (§4) binds it to the same merged deliverable. Empty stdout → no gap and no warning: run the
interview yourself per §4. (Installing the family stays a pro-tip — the README's
[Grill Me install](https://github.com/mattpocock/skills/tree/main#quickstart-30-second-setup) link covers
`grill-with-docs`, `grilling`, and `domain-modeling`.)


## Recon and memory

Run manifests are read from `.claude/war/runs/` in the target repository. Preserve
all four history classes and linked evidence from the shared interview.

For optional batched prefetch, mirror the Lead's flag discipline: `--local` always,
`--repo` when a repo root resolved, fail-open:

```sh
node skills/_shared/war-memory.mjs query --queries <file> --local <local root> --repo docs/learnings
```

Use the installed plugin's shared CLI when the target is not the WAR checkout.
The queries file is JSONL: one `{"label":…, "text":…}` object per interview area.
A missing CLI, Node < 24 or missing corpus does not block the interview. No local
root means no query-log write; never guess a root.

## Advisory lint

Run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>` from the plugin
checkout, or resolve the equivalent installed plugin asset. Preserve report-only
exit zero by default and enumerate findings at confirmation as the doctrine requires.

## Verifier

Dispatch one read-only verifier agent for an armed beat through the Claude host's
Agent facility, using the complete shared strategy-verifier charter. Preserve its
bounded re-arm and degraded stamps when the facility is unavailable.

## Closing offer

Optionally point at `/survey-corps` — the pipeline's memories + issues → specs step: it first mines
qualifying hot memory lessons into issues, then sweeps open issues, clusters them, and synthesizes
war-shaped specs into `docs/specs/`, optionally seeded by `ponytail-audit` or `ecc:repo-scan` as
*optional* seeds, never a hard dependency.
