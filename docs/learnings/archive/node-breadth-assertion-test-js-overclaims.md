---
name: node-breadth-assertion-test-js-overclaims
description: "Breadth walk exts must match gate glob (.test.mjs)"
metadata: 
  node_type: memory
  type: project
  keywords: [false green, orphaned suite, extension filter, gate glob, coverage walk, walkFiles, silent skip]
  slug: node-breadth-assertion-test-js-overclaims
  phase: f12/p1-t2
  tags: 
    - test-design
    - gate
    - coverage
  related: 
    - - gate-under-covers-after-cross-branch-merge-new-runner
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Node-breadth assertion overclaims coverage for `.test.js` files

**Rule:** a breadth/coverage walk must include ONLY the extensions the declared gate glob can run. The gate is `node --test skills/**/*.test.mjs`; a walk that also collects `.test.js` lets a future `skills/foo.test.js` satisfy the "under skills/" assertion while being silently orphaned by the runner — false green.

Fixed in audit-fidelity/p1 T1.3: the node-breadth `walkFiles(REPO_ROOT, ...)` callers in `war-config.test.mjs` filter `name.endsWith('.test.mjs')` only; `EXPECTED_MJES` pins the canonical suites.

**Why:** a coverage assertion broader than the runner certifies files the gate never executes.
**How to apply:** derive the walk's extension filter from the gate glob itself, not from "looks like a test file".
Related: [[gate-under-covers-after-cross-branch-merge-new-runner]]

> archived 2026-07-15: resolved — moved to archive
