---
name: ""
metadata:
  node_type: memory
  slug: legacy-provenance-value-retire-not-widen
  phase: memory-provenance/p2-t2
  type: project
  keywords: [enum allowlist, remap directive, grandfathering, tier precedence, agent-observed, vacuous gate, write-time remap]
  provenance: code-verified
  tags:
    - memory-provenance
    - enum-gate
    - prompt-discipline
    - war-servitor
    - d2-correction
  files:
    - agents/war-servitor.md
    - hooks/validate-servitor-provenance.sh
  relates:
    - "[[frontmatter-tools-negation-check-single-line-only]]"
    - "[[awk-sed-exit-zero-on-no-match-comment-trap]]"
    - "[[yaml-extraction-indent-coupling-in-shell-gate]]"
  created: 2026-06-29
  originSessionId: memory-provenance-war-servitor-p2
---

# When introducing a strict enum gate, retire legacy values by remapping — never widen the allowlist

**Durable rule** — when a strict enum gate lands on a field with legacy out-of-set values in existing files:

1. Never add legacy values to the allowlist to avoid breakage — that defeats the gate.
2. Remap each legacy value to the nearest canonical tier (a downgrade is always safe; an upgrade requires evidence); document the mapping in prose.
3. Grandfather existing files: the gate fires only on new `Write`s; legacy files get remapped at their next `Write`.
4. The remap is a write-time agent instruction, not gate logic — the gate can't know intent.

**In the repo (re-verified v0.14.6):** `hooks/validate-servitor-provenance.sh` allowlists exactly `agent-unverified | code-verified | user-confirmed`, never widened; `agents/war-servitor.md` carries the "Retire `agent-observed` — remap to `agent-unverified` at write time" directive.

**D2 reframe — tier precedence over "user corrections outrank":** the enforceable form is tier order: a higher-tier fact supersedes a lower-tier one; never overwrite higher with lower. This works with no user present, and the one tier order is simultaneously the recall-weight order, the correction-precedence order, and the verify-on-write outcome (design decision 2, `docs/adr/0007-memory-provenance.md`).

**Why:** widening an enum to accommodate past slop silently makes the gate vacuous.
**How to apply:** before shipping any enum gate, grep for existing out-of-set values and put the remap directive in the writing agent's prompt, not in the gate.

See also [[awk-sed-exit-zero-on-no-match-comment-trap]] and
[[yaml-extraction-indent-coupling-in-shell-gate]] for the T1 gate implementation gotchas
that gate the same `metadata.provenance` field.
