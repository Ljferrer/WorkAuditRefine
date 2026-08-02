# Resume & recovery (interruption)

Verbatim eviction from `skills/lessons-learned/SKILL.md` — the `## Resume & recovery (interruption)`
state table (the moved block is byte-identical to its pre-eviction SKILL.md text). `$MEM` and
`$STAGING` resolve exactly as in that file: [Locate the memory store](../SKILL.md#locate-the-memory-store)
and its Phase 1.

| State on restart | What happened | Fix |
|---|---|---|
| `$MEM/MEMORY.md` present, `$MEM.staging` present | died before commit | discard staging, restart: `rm -rf "$MEM.staging"` |
| `$MEM` missing, `$MEM.staging` present | died **between** the two swap `mv`s | `safe-swap.sh recover "$MEM"` restores staging → live |
| `$MEM` missing, no staging | catastrophic | `tar xzf <newest lessons-learned.bak.*.tgz> -C <parent>` |

`safe-swap.sh recover "$MEM"` diagnoses and repairs the first two automatically. The backup tarball is always the fallback.
