# /war-campaign add — add-resolution protocol

Verbatim eviction from `skills/war-campaign/SKILL.md` Invocation (prompt-surface simplification;
the block below is byte-identical to the pre-eviction SKILL.md text). Positional references inside
the moved block ("the materialize step", "the Lead's sweep") refer to the SKILL's Lifecycle step 1.

Trigger: invoked as `/war-campaign add`.

**Add-resolution protocol** — `add` may run from any chat, in any directory, so resolve carefully:

0. **Anchor to the repo toplevel, never the add-chat cwd.** Resolve the argument to a single repo-relative token `rel` = the argument made relative to `git rev-parse --show-toplevel`, and use `rel` for every git call below. The drop's line-1 absolute is `toplevel/rel`. This closes the foreign-cwd hole: a `path.resolve` against a stray cwd could store a path that never maps onto the ref, whereas `rel` is the one `<repo-relative-path>` token reused verbatim by the materialize step (`git show <ref>:<rel>`).
1. **Local path exists** → drop as today (`campaign-ledger.mjs add --campaign <dir>`, no `--ref`; line-1 absolute `toplevel/rel`, byte-identical legacy single-line shape). Local always wins; the fallback never fires over a present file.
2. **Local path missing** → `git fetch origin <branch>` then probe `git cat-file -e <ref>:<rel>`. Present → `campaign-ledger.mjs add --campaign <dir> --ref <ref>` (the two-line drop records the ref as provenance). Absent → **fail loudly at add time**, naming both locations tried (`<toplevel/rel>` on disk and `<ref>:<rel>`) — not at 3am in the Lead's sweep.

The user-facing invocation is *positional* (`add <plan> [<ref>]`); the Lead translates the positional `[<ref>]` into the helper's `--ref <ref>` flag when it shells out to `campaign-ledger.mjs add`. Same ref, two layers.
