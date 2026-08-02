# Scavenge — pre-manifest runs

`--scavenge [<plan-slug>]` reconstructs a run that predates the manifest. There is no manifest to
read, so mine the transcript artifacts directly:

- Glob the harness transcript artifacts (the same kind of dir a manifest `transcriptDir` points
  into) for `journal.jsonl` / `agent-*.jsonl`, grouped by plan slug + date. With no `<plan-slug>`,
  reconstruct the most recent group; with one, that plan's runs.
- Reconstruct **at minimum the phase count and wall-clock** from artifact timestamps; tokens and
  tool calls where the transcripts still carry them. Everything unreconstructable → **`n/a`**.
- Label the **whole report** *scavenged (best-effort, pre-manifest reconstruction)* — attribution is
  fuzzy by design and the reader must know it. Save it to `$RUNS/<runId>-review.md` like any review.
