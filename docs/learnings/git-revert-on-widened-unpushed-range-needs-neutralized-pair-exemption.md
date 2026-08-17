---
name: git-revert-on-widened-unpushed-range-needs-neutralized-pair-exemption
description: "Range-scoped condemnation + naive git revert loops forever; exempt revert/reverted pairs via the 'This reverts commit' body token"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: git-revert-on-widened-unpushed-range-needs-neutralized-pair-exemption
  phase: 2026-08-02-war-engine-and-standing-doc-truth/1.4
  keywords: 
    - git revert
    - neutralized pair
    - This reverts commit
    - unpushed range
    - Gate-2
    - undo routing
    - bounded retry
    - non-termination
    - revert body token
  tags: 
    - git
    - land-path
    - gate-2
    - design-pattern
    - undo-loop
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T16:55:03.081Z
---

# Range-scoped condemnation + naive `git revert` undo = infinite escalation loop

**The trap (code-verified at `skills/war/SKILL.md`'s Gate-2 undo routing, landed tip
`8f0d1009d1727e020d830f98debe91df09cd205d`; verify still present before acting):** once a pre-push
safety probe is widened from "inspect HEAD" to "inspect the whole unpushed range" (see
[[prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only]]), the standing "undo a
condemned commit with `git revert`, then re-probe" routine stops converging. `git revert` does not
remove the condemned commit from `@{upstream}..HEAD` — it **appends** a new commit that touches the
same escaping paths (by construction, since it undoes exactly those changes). The next re-probe
finds **both** the original and its revert still in range, condemns both, and the flow's own
bounded-retry escalation sentence ("condemned again → do not loop; escalate") fires — the one
re-entry shape the whole fix exists to handle deterministically ends in escalation instead of a
successful push. Red-team round 1 rated this a Major, and it was reproducible by tracing the range
contents directly, not merely asserted.

**The fix (adjudicated over "push the revert first," which was rejected for sending a
poisoned-then-reverted pair to origin — the exact outcome the probe exists to prevent):** an
explicit **neutralized-pair exemption** — a commit is not condemned when a *later* commit in the
same range reverts it, the two linked by git's own `This reverts commit <sha>.` line in the revert
commit's **body** (not its subject, and not visible through a `--format` that suppresses bodies —
reading the link costs one extra `git log --format='%H%n%b'` pass over the range). The reverting
commit is exempt too, by construction (its file set is the same escaping paths). This is
mechanically checkable from git's own metadata, deterministic, and converges in one pass.

**Pattern to reuse:** any automated remediation that reacts to a range-scoped policy violation by
reverting the offending commit, then re-scanning the same range for the same violation, must treat
a revert/reverted pair as neutralized — otherwise the revert's own diff re-triggers the same
detector forever (or until a bounded-retry ceiling fires and escalates). Key the exemption off the
VCS's own "this undoes that" linkage (a revert commit's body token in git) rather than re-deriving
diff equivalence by hand.

**Cross-link:** [[prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only]] — the
range-widening that creates this trap in the first place.
