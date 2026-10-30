---
name: jq-empty-fallback-folds-false-null-and-empty-so-a-presence-gate-needs-has-and-a-type-check
description: "A hook that reads a key with jq // empty and gates on non-empty lets a present empty, null, false or array value pass"
metadata:
  node_type: memory
  type: project
  keywords:
    - jq // empty
    - present but empty
    - presence versus value
    - jq has
    - non-string tool_input
    - array embeds path segment
    - hook input guard
    - fail-closed hook
    - output_directory
    - jq -r prints JSON text
  provenance: code-verified
  slug: jq-empty-fallback-folds-false-null-and-empty-so-a-presence-gate-needs-has-and-a-type-check
  phase: 2026-10-20-rea-artifact-evidence/phase-3 task 3.1 (ruling
  tags:
    - war
    - hooks
    - shell
    - input-validation
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-22T15:48:47.947Z
---

# Gate a hook input check on key presence and value type, not on a non-empty value

**The shape.** Ruling #2402 said: when `output_directory` or `destination` is present, deny unless the value carries the segment `/.claude/war/evidence/`. The first landed hook read each key with `jq -r ".tool_input.$key // empty"` and tested `[ -n "$val" ]`. The `//` operator folds `""`, `null` and `false` into "absent". So a present key with an empty, null or false value skipped the check and the hook exited 0. If a tool resolves an empty path against its own working directory, the write lands outside the evidence dir. Three audit seats (security, correctness, test-fidelity) raised it as Minor at the same pin.

**A second hole in the same line.** `jq -r` prints an array or object as JSON text. An array such as `["/x/.claude/war/evidence/a","/tmp/evil"]` prints text that contains the segment and no `..` segment, so the substring test passes.

**The fix that landed.** Test presence with `jq -e --arg k "$key" '(.tool_input|type)=="object" and (.tool_input|has($k))'`. Then read the value's `type` and require `string` and non-empty, else deny. Deny a `tool_input` that is neither absent nor an object before the loop. The header says "An absent key passes". Test rows pin the empty-string, non-string and non-object cases.

**Rule.** A "when present" rule needs a presence test (`has`), a type test and then the value test. Never infer presence from the value. A fail-closed hook must not lean on the tool's own schema to reject odd types.

**Status.** Audit finding resolved in a fix round before land, recorded as pattern, not live instance. See [[evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass]] for the hook's accepted residuals.

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the output-path check block before `exit 0`: search `has($k)` and `ti_type`. The fix is present there. `hooks/validate-evidence-auditor-mcp.test.sh`, the Group B2 rows. Found at the phase-3 integration tip f94b8783, read through the run's `_refinery` worktree. That commit is the second parent of landed tip 6e655d6e, and the landed merge's other parent is an ancestor of it, so the two trees match by ancestry (tree not read directly).

> archived 2026-10-30: resolved — moved to archive
