---
name: byte-convergence-plan-can-mandate-per-file-import-style-variant
description: "A byte-convergence plan's one canonical literal expression can still direct a different import style per file (named vs qualified) — not a rogue variant"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-1
  slug: byte-convergence-plan-can-mandate-per-file-import-style-variant
  phase: "cli-main-guard-normalization/phase-1 task 1.1 (landed dev/2026-07-22-cli-main-guard-normalization, 2026-07-23)"
  keywords: 
    - byte-converge
    - canonical idiom
    - import style variant
    - named import vs qualified access
    - rogue variant false positive
    - normalization plan per-file directive
    - realpathSync
    - fs.realpathSync
    - guard convergence
    - auditor false flag
    - plan slice per-file wording
  tags: 
    - plan-fidelity
    - audit-false-positive
    - node
    - refactor
  created: 2026-07-23
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T20:42:23.090Z
---

# A "byte-converge on one canonical idiom" plan can still mandate a different import style per file

**What happened (code-verified — found at `skills/war/assets/war-config.mjs` line ~424-426, the
task worktree's landed `_refinery` copy):** the phase's Method literal named one exact canonical
expression — `fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])` — as the target
for three files' CLI main-guards. At land, `war-config.mjs` reads:

```js
import { realpathSync } from 'node:fs'
...
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
```

— a **bare** `realpathSync(...)` via a new named import, not the qualified `fs.realpathSync(...)`
the Method literal spells out. The other two files (`stage-workflow.mjs`,
`skills/war-campaign/assets/campaign-ledger.mjs`) DO use the qualified `fs.realpathSync(...)` form,
matching their pre-existing `import fs from 'node:fs'` style. This is not drift: the plan's task
1.1 slice + End state 3 explicitly directed the bare/named-import form for `war-config.mjs` alone
("named-import style, matching that file's guard-side imports" — `war-config.mjs` already imported
other `node:fs`/`node:url` symbols by name, so the new import matches the file's own existing
convention rather than the Method literal's generic prose).

**The pattern:** a "converge on one canonical form" plan is usually read as demanding byte-identical
text across every touched site. When the plan's own per-file End-state wording instead says "match
each file's existing import convention," a qualifier-only difference (`fs.realpathSync` vs bare
`realpathSync`) across sites is **deliberate and plan-faithful**, not a rogue variant — the
behavioral contract (what the guard does) is identical; only the import/call-site spelling differs.

**Why it matters for audit:** an auditor (or a peer audit seat) checking purely against the Method
literal's exact string will misread the qualifier difference as an inconsistency needing a fix.
Before flagging any "doesn't match the plan's exact expression" finding in a multi-file
normalization/convergence task, re-check the **per-file** slice/End-state wording — it may
explicitly carve out per-file style latitude the top-level Method prose doesn't spell out. This
mirrors [[non-discriminating-test-can-still-be-plan-faithful]]'s general shape: a literal-text
mismatch against a Method/spec string is not automatically a deviation once the more specific,
file-scoped directive is read.

## Related

[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — Recurrence 19 confirmed this
exact three-file guard state at the true landed tip. [[non-discriminating-test-can-still-be-plan-faithful]]
— same "read the specific directive before flagging" discipline, different subsystem.
