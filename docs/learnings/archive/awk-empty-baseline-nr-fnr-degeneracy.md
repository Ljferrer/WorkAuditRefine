---
name: awk-empty-baseline-nr-fnr-degeneracy
description: "RESOLVED (escape-guard-exit-contract/1.1, #1263): A zero-byte first file in a two-file awk NR==FNR diff degenerates into reporting every live ref as 'removed:' — arg-parse validation must check -s, not just -e/-f/-r"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: awk-empty-baseline-nr-fnr-degeneracy
  phase: 2026-08-02-redteam-doctrine-and-guards/1.2
  keywords: 
    - awk
    - NR==FNR
    - two-file awk idiom
    - empty file
    - zero-byte file
    - ref-diff
    - baseline validation
    - arg-parse
    - infra-error vs escape
    - exit code collapse
    - assert-no-repo-escape.sh
    - join idiom
    - process substitution non-empty
    - zero-byte baseline outranks escape
    - resolved
  tags: 
    - bash
    - awk
    - shell-floor
    - gotcha
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-09-03T09:58:59.651Z
---

# A zero-byte "first file" defeats the classic awk `NR==FNR` two-file diff idiom

## The gotcha

The classic awk two-file idiom (`awk '... NR==FNR {load into array; next} {compare} END {...}' fileA fileB`)
relies on `NR==FNR` being true only while reading `fileA`. If `fileA` is a valid, existing, readable
file but has **zero records** (empty), `NR` never diverges from `FNR` during the whole run — because
`FNR` also resets to 0 for `fileB` and both counters advance together from record 1. The loader branch
therefore fires for **every line of fileB too**, the array meant to hold fileB's records is never
populated, and any `END` block comparing the two arrays reports every fileB record as if it were absent
from fileA (e.g. "removed" in a diff, "new" in a join) — the exact opposite of what the code intends,
with no error and a clean exit.

## Concrete instance (code-verified, live and unfixed at 2026-08-02-redteam-doctrine-and-guards land)

`skills/red-team/assets/assert-no-repo-escape.sh`'s `--baseline` ref-diff pipes
`git for-each-ref` output through `awk '... NR==FNR ...' "$baseline_file" -` (baseline file first,
live dump on stdin second). The arg-parse validation block (~line 186-192) checks `-e`/`-f`/`-r` on
`$baseline_file` but never `-s`. A baseline file that exists, is a regular file, and is readable — but
is zero bytes — passes validation, then the awk pass loads nothing into `base[]`, and the `END` block
prints `removed: <ref>` for **every** live `refs/heads/`/`refs/tags/` ref. Result: exit 1 (escape) with
a message claiming every ref vanished, instead of the mandated exit 2 (infra error, never a pass) the
surrounding comments and header explicitly require for a bad baseline file. This was raised twice
(task-level gate-audit and phase-close polish) as a Minor `disposition: follow-up` finding and remains
unfixed in the landed code — the `-s` check was never added.

Locate cue: verify still present before acting — found at
`skills/red-team/assets/assert-no-repo-escape.sh`, the `--baseline` arg-parse validation block
(checks `-e`/`-f`/`-r`, no `-s`) and the two-file `awk 'NR == FNR {...}'` ref-diff pass a few dozen
lines below it.

## The durable rule

Any two-file awk diff/join guarded by `NR==FNR` must validate the **first** operand is non-empty
(`[ -s "$file" ]`) alongside existence/readability, or must key the loader branch on
`FNR == NR && FILENAME == ARGV[1]` instead of bare `NR == FNR` — a bare `NR==FNR` guard silently
degenerates whenever the first file has zero records, and the failure mode is a **wrong-direction**
result (everything looks new/removed), not a crash, so it is easy to miss in review and easy for a
truncated-write infra fault (a failed snapshot write, a `mktemp` never populated) to trigger silently.

## Correction (2026-08-15, #1399)

The "Concrete instance" section's mechanism sentence ("the awk pass loads nothing into `base[]`")
states the degeneracy backwards. Corrected mechanism: with a zero-byte first operand, `NR` never
diverges from `FNR`, so every stdin record takes the loader branch — `base[]` fills from the live
dump and `live[]` stays empty — and the `END` block walks a fully populated `base[]`, reporting
every live ref as `removed:` (#1399's reproduction: `base=2, live=0`). The durable rule
above — including its `FNR == NR && FILENAME == ARGV[1]` alternative — is correct and unchanged.

## Confirmed present + hardened (code-verified, phase 3)

The `[ -s "$baseline_file" ]` check this rule prescribed is present at
`skills/red-team/assets/assert-no-repo-escape.sh`'s `--baseline` arg-parse block: `[ -s
"$baseline_file" ] || die "--baseline file is zero bytes (a truncated or failed snapshot write —
infra error, never a pass): $baseline_file" 2`. Verified at
`2e22e96d60d2c0e87ec0ae111470851634779944` on `dev/2026-08-25-authoring-doctrine-and-lint-coherence`
(via the `_refinery` worktree at
`.claude/war-worktrees/2026-08-25-authoring-doctrine-and-lint-coherence-2026-09-02-r5/_refinery`,
whose gitdir names this plan's slug and whose HEAD equals the landed tip exactly).
`2026-08-25-authoring-doctrine-and-lint-coherence`/phase-3 task 3.3 added a regression case (case
30 in `assert-no-repo-escape.test.sh`, "zero-byte --baseline outranks a live (b1) escape -> exit 2
naming the zero-byte baseline") proving this arg-parse-time check fires — and wins — even when a
live escape condition is present in the SAME invocation: infra validation runs and dies before the
escape-detection code path is ever reached, so exit 2 always outranks exit 1 by construction, not
by ordering luck. The script's newer ignored-FILE diff (a second `NR==FNR`-style awk pass, added in
the same task 3.3 for the gitignored-leak widening) faces a related but distinct empty-input case —
a baseline that legitimately recorded ZERO ignored files (not an error, just an empty set) — and
avoids the degeneracy two ways at once: it feeds the baseline operand through
`<(printf '%s\n' "$base_ignored") -` via process substitution, which always emits at least one line
(even if empty) so `NR` diverges from `FNR` on the second file's first record regardless; AND its
loader guards `NR == FNR { if ($0 != "") base[$0] = 1; next }`, so even that guaranteed blank line
is never mistaken for a real baseline entry.

> archived 2026-08-15: resolved — moved to archive
