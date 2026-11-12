---
name: a-living-adr-fold-survey-misses-same-meaning-amendment-forms-that-the-census-regex-does-not-spell
description: "An ADR fold census regex misses same-meaning amendment forms, so survey by meaning"
metadata:
  node_type: memory
  type: project
  keywords:
    - living ADR
    - fold
    - Decision log
    - retired sha
    - amendment census
    - append-only exemption
    - git log -S
    - straggler
  provenance: agent-unverified
  slug: a-living-adr-fold-survey-misses-same-meaning-amendment-forms-that-the-census-regex-does-not-spell
  phase: "2026-11-08-doc-truth-drift-and-adr-hygiene/phase-2 (task 2.1, three audit rounds)"
  tags:
    - adr
    - living-adr
    - survey
    - drift-guard
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T08:31:55.753Z
---

The phase-2 corpus fold (Task 2.1) passed its heading and run-in census greps. Each audit round still found stragglers.

**Forms the census regex missed.**
- An italic inline parenthetical such as `*(Amended — <ruling>, <date>: …)*` inside a Decision item, plus a Status-line "amended per" clause. The fold rewrote it but logged no Decision-log line.
- A rewritten append-only bullet ("Historical ADRs are superseded, never edited"). It counts as a fold, so its log line needs a `retired:` sha.
- Test-comment exemptions worded without "append-only law", such as "a historical decision record, outside the pin sweep" or "decision records are excluded".
- A lowercase, undated "amendment" in a test header comment.
- An ADR that gained a Decision log of per-fold lines only, without the "adopted under the living-ADR law" line. The heading-only guard stays green.

**Rules worth repeating.**
- Take each `retired:` sha from the introducing commit: `git log --reverse -S'<literal>' --format=%h -- <file> | head -1`. One log line that covers two folds needs both shas.
- Scope an ADR absence guard to strip only `## Considered options` and `## Decision log`, the two record sections. A slice that stops at `## Considered options` also drops Consequences and References.
- An assert of the form `/^\*\*Status:\*\*[^\n]*…/m` reads one physical line, so it cannot see a wrapped Status paragraph. Slice the paragraph to the next blank line first. See [[weak-test-assertion-passes-without-feature-being-exercised]].

**Cross-rung note.** The plan slice said ADR-to-ADR citations of a folded heading become sha-pinned. The meta-ADR's Decision 6 reserves the sha-pin for retired text, and the worker followed the meta-ADR. Two seats judged that intent-consistent.

**Grounding note.** The landed tip was unrecorded, no live worktree's gitdir carried the plan slug, and the cwd was `master` (a3511c79). The meta-ADR (`docs/adr/*-living-adrs-git-is-the-archive.md`) is not on master, so no referent here is verified. Gate-audit fallback rung: these facts come from the pinned audit verdicts at 2e1a70b4, ae71a91b and 75775f7c. A later fix round may have resolved each named straggler, so this records the pattern, not live instances. Verify before acting.
