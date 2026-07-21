---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [jq --arg, invalid payload, silent parse failure, shell metacharacters, embedded quotes, string interpolation, hook exits zero]
  slug: printf-json-escaping-vacuous-test-case
  phase: 1c (F01 D4 worker Bash-write warn-hook)
  tags: 
    - test-design
    - json
    - escaping
    - bash
    - scope-enforcement
  related: 
    - - weak-test-assertion-passes-without-feature-being-exercised
    - - frontmatter-tools-negation-check-single-line-only
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# printf-interpolated JSON payloads make embedded-quote test cases vacuous

## What happened

The `warn-bash-write-scope.test.sh` helper `worker_cmd` builds a PreToolUse
JSON payload by raw printf interpolation:

```sh
printf '{"agent_type":"war-worker","tool_input":{"command":"%s"}}' "$1"
```

Test case C5 exercises the false-positive guard for shell comparisons that
contain a redirection-like token inside a quoted string — e.g.:

```sh
[ "$x" = ">" ]
```

When `worker_cmd` receives this string, it interpolates the literal
double-quotes into the JSON value field, producing **invalid JSON**:

```json
{"agent_type":"war-worker","tool_input":{"command":"[ "$x" = ">" ]"}}
```

The hook's payload parser calls `jq -r ... 2>/dev/null || true`, so jq fails
silently and `cmd` becomes empty. The hook then hits `[ -z "$cmd" ] && exit 0`
and returns 0 — not because the quoted-`>` false-positive guard fired, but
because the entire payload was unparseable.

The test only asserts exit 0, so it passes — but it has validated nothing about
the feature it documents.

## Why it's durable

This is a distinct failure mode from [[weak-test-assertion-passes-without-feature-being-exercised]].
There, the test assertion matched pre-existing content and never exercised the
new injection. Here, the assertion is correct but the *payload construction*
corrupts any input containing shell metacharacters (double-quotes, brackets),
causing the hook to bail before it even reaches the targeted code path.

The pattern recurs whenever:
1. A JSON payload is assembled via `printf '%s'`-interpolation of a raw string
2. That string can contain double-quote or backslash characters (shell syntax,
   file paths with spaces, regex patterns, etc.)
3. The consumer uses `jq` with error-suppression and a safe fallback

Every such test is silently vacuous for inputs in that character class.

## Fix / Pattern

Use `jq --arg` (or `jq -n --argjson`) to construct the payload so `jq` handles
all escaping internally:

```sh
worker_cmd() {
  jq -nc --arg c "$1" \
    '{"agent_type":"war-worker","tool_input":{"command":$c}}'
}
```

This produces well-formed JSON regardless of what shell metacharacters appear in
the command string, and ensures C5's quoted-`>` actually reaches the detection
branch.

Alternatively, assert from the other direction: check that the jq parse
succeeds before asserting the hook exit code, so a malformed payload fails
loudly at the test helper rather than silently masking the case.

## Gate implication

The functional warn-bash-write-scope.sh behaviour is correct — the hook never
false-positives at runtime because real PreToolUse payloads are serialised by
the harness (not printf). The gap is test-only: C5's false-positive guarantee is
asserted but not actually exercised by the current test infrastructure.

> archived 2026-07-21: resolved — moved to archive
