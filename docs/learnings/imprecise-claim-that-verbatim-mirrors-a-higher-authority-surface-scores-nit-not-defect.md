---
name: imprecise-claim-that-verbatim-mirrors-a-higher-authority-surface-scores-nit-not-defect
description: "A doc claim that looks imprecise can be a verbatim mirror of a higher-authority landed surface…"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - plan-faithfulness seat
    - verbatim mirror
    - "Commander's Intent Purpose"
    - worker-servitor-edges.md
    - D3 card
    - foreign target repo
    - harness substitution
    - per-card fallback line
    - disposition note
    - disposition follow-up
    - upstream fix
    - doctrine mirror precision
    - audit seat disagreement
    - Nit vs Minor
  provenance: code-verified
  slug: imprecise-claim-that-verbatim-mirrors-a-higher-authority-surface-scores-nit-not-defect
  phase: 2026-08-06-references-pointer-integrity/phase-2
  tags: 
    - war
    - audit
    - doctrine
    - disposition
    - plan-faithfulness
    - mirror
  relates: 
    - "[[redteam-adjudication-is-authoritative-version-source]]"
    - "[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:30:40.448Z
---

# An imprecise-looking claim can be a verbatim mirror of a higher-authority landed surface

**What happened (`2026-08-06-references-pointer-integrity`, phase 2, task #1544, epic #1529):**
two audit seats independently flagged `worker-servitor-edges.md`'s residuals bullet — "the
auditor's resolution rests on harness substitution or the per-card fallback line" — as imprecise
on a foreign target repo, because the landed D3 card resolution line is explicitly conditioned on
"the repo under review is the plugin itself." `code-verified`: both the exact D3-card conditional
and the residuals-bullet's "resolution rests on harness substitution ... or the D3 fallback line"
wording are plan-mandated — present verbatim in `docs/plans/2026-08-06-references-pointer-integrity.md`
(the D3 design-tree row and its `assumed:` bracket, and the residuals-bullet instruction in the
task slice directing "one edit to the file's header region" of `worker-servitor-edges.md`) and in
`docs/specs/2026-08-06-references-pointer-integrity-design.md`'s equivalent D3 row and open-risks
entry — both files already merged to `master` ahead of this phase. On a foreign target repo the
D3 condition fails, so the claim resolves nothing there — the audit finding's correctness premise
is real.

A third, plan-faithfulness-lens auditor seat established the phrasing is **verbatim-mirrored from
two landed authority surfaces**: the threaded Commander's Intent Purpose for this phase, and phase
1's own `worker-servitor-edges.md` header paragraph. That seat graded the finding Nit /
`disposition: note` (a faithful mirror of upstream doctrine, not a defect of this diff), while the
correctness-lens seat graded the identical text Minor / `disposition: follow-up`.

## Durable rule

When a doc claim looks imprecise, check whether it verbatim-mirrors a higher-authority landed
surface (Commander's Intent, a doctrine header, an ADR clause the plan quotes) before scoring it
as a defect of the artifact carrying it. If it is a mirror, the fix belongs **upstream** — at the
authority surface and its downstream mirrors together — not as a point-fix in the one artifact an
auditor happened to read first. Two auditor seats reasonably disagreed on severity for the
identical text (Nit vs Minor) precisely because "is this text wrong" and "is this text a correct
copy of something else that's imprecise" are different questions — resolve which one you're
answering before disposing.

**Verification caveat:** the plan/spec referents above are confirmed present on `master` (already
merged ahead of this phase). The *landed* `worker-servitor-edges.md` text itself (the phase-2
edit that actually carries the residuals bullet) could not be independently re-read by this
servitor: `dev/2026-08-06-references-pointer-integrity` has no live worktree and no ref in this
checkout — landed-tip-grounding rungs 1-3 all fail (see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] for the general shape). The
audit-seat grading itself (which seat said Nit vs Minor) is reported by the Lead, not
independently re-derived from a raw audit log.

Related: [[redteam-adjudication-is-authoritative-version-source]] (nearest precedent: a claim's
correctness is judged against an authoritative upstream source, not the artifact's own literal
wording); [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (why this servitor could
not directly read the landed file).
