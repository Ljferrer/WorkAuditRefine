# File-followups dispatch — filing procedure

Read when dispatched a `file-followups` run (pointer on `agents/war-refiner.md` § File-followups
dispatch). Evicted from that card under its prompt-surface byte budget (ADR 0042); per ADR 0047
adjudication O(1) this file is best-effort enrichment, never the sole carrier — the dispatched
prompt carries the same instructions verbatim, and the card keeps the never-decline rule and the
`FOLLOWUP_FILING_RESULT` return shape inline (§ Return).

**Preflight first** (ADR 0026): run the dispatched `gh-preflight.sh` line before any gh write; exit 2 or 3 ⇒ return what you have, file **nothing**. **Dedup first**: `gh issue list --label war-followup --state open` — a row matching an open issue (exact title, or same file + root cause) gets a **corroboration comment** there, never a new issue; reuse its number. Cluster remaining rows by file + root cause (rows carry file/line/`seats`); file one `war-followup` issue per **cluster** — members share one issue number. Return ONLY `{ filed: [{ n, issue }], clusters: [{ ordinals, issue }] }` — a fail-open evidence return (unmatched entries stay `issue: null`; the Checkpoint floor catches them; `clusters` covers every ordinal exactly once), never a `MergeResult`.
