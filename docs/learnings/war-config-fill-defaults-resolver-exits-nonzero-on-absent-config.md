---
name: war-config-fill-defaults-resolver-exits-nonzero-on-absent-config
description: war-config --fill-defaults exits 1 if no config
metadata: 
  node_type: memory
  type: project
  keywords: 
    - war-config.mjs
    - fill-defaults
    - readFileSync
    - exit 1
    - pre-flight resolver
    - absent config
    - first-run
    - migrate
    - commitLearnings
    - cannot read
    - test -f absent-config branch
    - lessons-learned migrate pre-flight
  provenance: code-verified
  slug: war-config-fill-defaults-resolver-exits-nonzero-on-absent-config
  phase: skill-and-doc-prose/t2 + closed-at-callsite projection-dedup-citation-hygiene-preflight-guard-headroom-remediation/1.3 (2026-07-13)
  updated: 2026-07-13
  tags: 
    - war-config
    - cli
    - pre-flight
    - doc-prose
  created: 2026-07-11
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# `war-config.mjs <path> --fill-defaults` is not a graceful resolver on an absent config file

**Verified in `main()` of `skills/war/assets/war-config.mjs`:** the config path is read via
`readFileSync`; on an absent file the catch prints `cannot read <path>: ENOENT...` and the process
exits **1**. There is no absent-file → defaults-object fallback in the CLI (its contract is
"validate a file"; `--stdin` is the no-file path). A fresh clone that never wrote
`.claude/war/config.json` — the most common state — therefore sees a failure exit where the
intended semantics are "defaults apply."

**How to apply:** any skill step that resolves a config value via this CLI must branch on
`test -f .claude/war/config.json` (absent → effective defaults, resolver call skipped) *before*
invoking `--fill-defaults` — prose alone ("an absent config file means defaults") does not make the
exit code graceful. Grade a bare mismatch Nit/note, not a blocking defect, since an agent executor
with judgment can still read the adjacent prose correctly — but flag it for the doc author to close.

**Closed at the `/lessons-learned migrate` call site** (projection-dedup-citation-hygiene-preflight-guard-headroom-remediation/1.3): `skills/lessons-learned/SKILL.md`'s `migrate` pre-flight branches on `test -f .claude/war/config.json` before invoking `--fill-defaults` — verified at master 2026-07-13. `war-config.mjs` itself is unchanged (still exits 1 on ENOENT), so the rule still binds for every other call site.

Related: [[report-nothing-to-commit-never-implement-unprompted]].
