---
name: allowlist-catch-all-token-defeats-meta-guard
description: "Anchor a default-deny allowlist entry to the exact marker text or a call-site-specific name, never a generic token, and back it with a count==N assertion [RESOLVED, test-pinned]"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: allowlist-catch-all-token-defeats-meta-guard
  phase: f07/p2-t3
  keywords: 
    - allowlist
    - catch-all token
    - meta-guard
    - DATA_MIRROR_ALLOWLIST
    - count backstop
    - BARE_INTERPOLATION_CENSUS
    - default-deny
    - generic parameter name
    - census erosion
    - wildcard exemption
  tags: 
    - meta-guard
    - drift-guard
    - allowlist
    - classifier
  related: 
    - - drift-guard-pin-for-task-split-intermediate-state
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Allowlist catch-all token silently defeats a meta-guard classifier

**Rule:** allowlist classifiers must anchor to the **exact marker content**, not a generic
substring — a bare catch-all (`'MIRROR of'`) classifies any future comment phrased that way as
exempt, silently defeating the meta-guard. Pair the anchored entry with a **count==N sanity
assertion** so any new marker flips the gate and forces a deliberate registry edit.

Fixed in audit-fidelity/p1 T1.6: `DATA_MIRROR_ALLOWLIST` in `war-config.test.mjs` now anchors on
`'This is a MIRROR of'`, with exact-membership assertions (must NOT include the bare catch-all)
plus a marker-count backstop.

**Second instance (2026-09-11-backward-chain-doctrine, phase 2):** admitting a generic name
(`'file'`, `'n'`) to the default-deny `BARE_INTERPOLATION_CENSUS` exempts every future `${file}`
span in the template, not just the one call site the finding was about. When fixing a
bare-interpolation-census finding, rename the local to a call-site-specific name instead. The
`'file'` entry landed anyway; its removal was forward-reverted and filed as follow-up #1860.

**Why:** the count is the hard backstop even after the token is tightened.
**How to apply:** when adding an allowlist entry, quote the full marker lead-in (or use a
specific name) and bump the count assertion in the same edit. Related:
[[drift-guard-pin-for-task-split-intermediate-state]].

> archived 2026-07-04: resolved — moved to archive
