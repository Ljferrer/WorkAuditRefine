# Sweep exclusion — the Lead's campaign contention set (`args.sweepExclude`)

The unbudgeted cold home (ADR 0042) for the Lead duty pointed at from `skills/war/SKILL.md`'s per-phase launch step (`when launching under a campaign, read references/sweep-exclusion.md`). Decision record: `docs/plans/2026-09-03-in-band-absorb-default.md` D6 (PIN-8). Engine contract: [schemas.md](schemas.md) § Workflow per-phase args contract, the `sweepExclude` row.

## Why

The phase-close sweep and the terminal pass fix absorb rows in this run. A file that another campaign plan still owns must not be touched here, or that plan rebase-conflicts at its serial merge. The engine builds the sweep-time exclusion set from three sources: this list, the `Files:` of every task not `merged` this phase, and `RELEASE_SLOT_FILES`. Only the first source is the Lead's to build. The engine keeps the owning `slug` for the demotion reason (`demote:exclusion-set`, naming the plan slug).

## When

At **every** per-phase Workflow launch of a run started under a campaign (`--campaign-ordinal <K>` present, or a campaign ledger lists this plan). The set is rebuilt at each launch because sibling plans land between phases. `/war` still never derives its ordinal from a ledger; it reads the ledger only for this contention set.

## The ledger

The campaign ledger is `$MAIN/.claude/campaigns/<id>/ledger.json` under the **main checkout** (the same `$MAIN` anchor the Run-manifest section documents). Resolve `<id>` as the campaign whose `plans[]` carries an entry with this run's `planSlug`. If more than one ledger qualifies, take the newest by mtime and log the choice. Entry shape: `makePlanEntry` in [`../../war-campaign/assets/campaign-ledger.mjs`](../../war-campaign/assets/campaign-ledger.mjs) (`{ slug, plan, status, files, … }`).

**Stored ledger `files` are the contention record, not this input.** Re-extract each entry's footprint from its plan file at launch with the exported `extractFilesFromPlanFile` (it unions every `- Files:` block). The ledger CLI's verb set is closed and stays so: import the function in a Node one-liner, do not add a verb.

## Build the list

One entry per ledger plan that is **not this plan** and whose `status` is **not `landed`** (`queued` today, and any other non-landed status a future lifecycle writes). Shape: `[{ slug, files[] }]`, `slug` the entry's `slug`, `files` the re-extracted footprint (repo-relative paths, as the plan writes them, no normalization; the engine `aceRelPath`-normalizes both sides).

```bash
# $CLAUDE_PLUGIN_ROOT = the plugin root; $LEDGER = the resolved ledger path; $SLUG = this run's planSlug.
CLAUDE_PLUGIN_ROOT="$CLAUDE_PLUGIN_ROOT" node --input-type=module -e '
  import { readFileSync } from "node:fs"
  import { pathToFileURL } from "node:url"
  const { extractFilesFromPlanFile } = await import(
    pathToFileURL(process.env.CLAUDE_PLUGIN_ROOT + "/skills/war-campaign/assets/campaign-ledger.mjs"))
  const [ledger, slug] = process.argv.slice(1)
  const { plans } = JSON.parse(readFileSync(ledger, "utf8"))
  const out = plans
    .filter((p) => p.slug !== slug && p.status !== "landed")
    .map((p) => ({ slug: p.slug, files: extractFilesFromPlanFile(p.plan) }))
  console.log(JSON.stringify(out))
' -- "$LEDGER" "$SLUG"
```

Thread the printed array **verbatim** as `args.sweepExclude` (through `--args <file>` when the phase args ride the staged script). The engine entry-validates each row (a missing `slug` or a non-string-array `files` refuses the launch, naming the entry index and field), so never hand-edit a row. A non-zero exit means a qualifying entry's plan file is unreadable (`extractFilesFromPlanFile` throws ENOENT). Repair the ledger entry and re-run; never omit the key (that reads as an absent ledger) and never thread an empty list (that reads as a genuinely empty contention set, silently disabling the campaign arm) on a failed run. The step stops with the node error before any output, so never thread a truncated or empty list as though the union were empty.

## Log lines (one each, at launch)

- Absent ledger (no campaign, or no ledger lists this plan): thread **no** `sweepExclude` key and log `no campaign contention set threaded`. The engine logs the same fact once per phase. The in-phase and release-slot arms of the exclusion set still run.
- Present ledger, every qualifying entry's footprint empty (or zero qualifying entries): still thread the list (possibly `[]`) and log `campaign contention set empty for <n> entries`, `<n>` the qualifying-entry count, so an empty set is never mistaken for an absent ledger.
- Present ledger, non-empty union: log `campaign contention set threaded: <n> entries, <m> files`.

## Run manifest rows (PIN-8)

Stamp per phase, in the launch stamp (fail-open, like every manifest write — [schemas.md](schemas.md) § Run manifest):

- `sweepExcludeCount`: the number of entries in the threaded `args.sweepExclude` (`0` for a threaded empty list, `null` when no list was threaded).
- `finalPhase`: the boolean threaded as `args.finalPhase` at this launch (`null` when absent; the engine then reads the phase as final).

`/war-review` renders `sweepExcludeCount`; `finalPhase` is manifest-only today. A `null` `finalPhase` on a non-last phase is a Lead threading defect worth a friction row.
