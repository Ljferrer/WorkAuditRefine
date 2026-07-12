---
name: mechanical-tag-sweep-can-corrupt-backtick-quoted-comment-tokens
description: "Mechanical tag sweep can corrupt backtick tokens in // comments"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: mechanical-tag-sweep-can-corrupt-backtick-quoted-comment-tokens
  phase: war-engine-harden-r3/t1.2
  keywords: 
    - find/replace sweep
    - mechanical tagging
    - comment corruption
    - backtick-quoted identifier
    - sed global replace
    - pt tag sweep
    - comment drift
    - inert but corrupted prose
  tags: 
    - gotcha
    - comment-drift
    - mechanical-sweep
  created: 2026-07-10
  promoted: true
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A "tag every X" mechanical sweep can hit lookalike tokens inside comments — the fix is harmless (comments are inert) but the corruption is real

**Pattern (not a live instance — resolved before land).** During the phase's `pt`-tag sweep
(tagging every prompt-rendering template literal in `workflow-template.js`, e.g. `` agent(`...`) ``
→ `` agent(pt`...`) ``), three independent audit seats flagged the same defect: the mechanical
replace also matched a backtick-quoted identifier living inside a `//` comment — a prose sentence
like `` from `planSlug` + `runId` here `` became `` from `planSlug` + pt`runId` here ``. The fix
round absorbed all three findings (disposition `absorb`, autoFixable) before land; re-checked at
the landed tip (`skills/war/assets/workflow-template.js`, the worktree-topology comment near
`from \`planSlug\` + \`runId\` here`) and the stray `pt` is **gone** — confirmed resolved, not a
live defect.

**Why it's worth keeping as a pattern (not the specific instance):** this repo does frequent
"tag/rewrite every occurrence of construct X" sweeps (pt-tagging, EX_* exit-code catalogues,
dispatchKind discriminators, rename passes). A regex/sed-style global replace targeting a code
pattern (e.g. `` `literal` `` immediately after a function call) has no syntactic awareness of
comments or strings — it will happily match the same textual shape wherever it appears, including
inside a `//` comment discussing the exact construct being swept. The corruption is typically
inert (comments have zero runtime effect) but is real prose drift that a mechanical diff review
can miss if the reviewer only checks executable-code correctness.

**How to apply:** after any global find/replace sweep intended to touch only executable-code
sites, grep the diff for the same token pattern occurring inside `//` or `#` comment lines (or any
prose file) and hand-verify each hit is either (a) a legitimate executable-site match, or (b) a
comment/string collision that needs reverting. Don't rely solely on "tests still pass" as
confirmation — comment corruption is invisible to test suites by definition.

Related: [[source-comment-lags-emitted-prompt-after-rewrite]] (a different comment-drift axis —
staleness after a logic rewrite, not a mechanical-sweep collision), [[audit-log-finding-can-be-stale-by-land-time]]
(the general finding-match discipline this lesson followed to confirm the instance was resolved
before recording).
