---
name: war-memory-lint-reads-path-args-not-stdin-so-a-piped-body-lints-nothing
description: "war-memory.mjs lint reads file path args (default: the local root) and never stdin, so piping a drafted body into it reports false-clean"
metadata:
  type: project
  provenance: code-verified
  slug: war-memory-lint-reads-path-args-not-stdin-so-a-piped-body-lints-nothing
  phase: survey-corps-memory-mining/t1
  keywords:
    - war-memory lint
    - cmdLint
    - stdin
    - false clean
    - temp file
    - redaction lint
    - pipe
  tags:
    - war
    - memory
    - redaction-lint
  created: 2026-07-12
---

# `war-memory.mjs lint` reads path args, never stdin, so a piped body lints nothing

**Rule:** `cmdLint` takes paths, never stdin. To lint a draft, write it to a temp file and pass that path.

**Why:** in `skills/_shared/war-memory.mjs`, `function cmdLint` sets `paths = argv._.slice(1)` and `targets = paths.length ? paths : [resolveRoots(argv).local]`, then runs `fs.readFileSync(f, ...)` per file. There is no `process.stdin` read anywhere in the function. Piping a drafted body into `war-memory.mjs lint` never lints the body: with no path args it lints the default local root, so it reports false-clean on the body you meant to check.

**How to apply:** any doctrine or plan step that says "pipe the body through `war-memory.mjs lint`" describes a mechanism that does not work. Use the temp-file form: write the body to a file and run `node skills/_shared/war-memory.mjs lint <that-file>`.

> archived 2026-07-12: resolved — moved to archive
