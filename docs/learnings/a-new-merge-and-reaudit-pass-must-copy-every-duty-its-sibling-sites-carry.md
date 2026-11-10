---
name: a-new-merge-and-reaudit-pass-must-copy-every-duty-its-sibling-sites-carry
description: "A new engine pass that re-audits and merges must copy each duty the polish, terminal and merge-slot sites already carry"
metadata:
  node_type: memory
  type: project
  keywords:
    - new pass
    - lateFixPass
    - routeReauditMinors
    - sibling site duties
    - re-audit routing
    - auditLog record not route
    - lastLandedTip
    - ff-only
    - checklist
    - escalate stop
    - lfEscStop
    - at-tip re-audit arm
  provenance: code-verified
  slug: a-new-merge-and-reaudit-pass-must-copy-every-duty-its-sibling-sites-carry
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1)
  tags:
    - workflow-template
    - audit-routing
    - merge-site
    - checklist
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-10T05:34:18.887Z
---

# A new merge-and-re-audit pass must copy every duty its sibling sites carry

Task 3.1 added `lateFixPass` in `skills/war/assets/workflow-template.js`.
It needed six ace rounds, mostly to add duties the older sites already had.
Each item below was a real audit finding, and each is fixed at the landed tip.

Use this list when you add any new pass that dispatches a worker, re-audits, and merges:

1. Route the re-audit's Minor/Nit rows through `routeReauditMinors` on BOTH the approve and the reject arm.
   An `auditLog.push({ findings })` is a record, not a route (PIN-1, ADR 0013).
   Round 1 shipped with auditLog only, so asks, follow-ups and absorbs dropped silently. Three seats raised it, one as Major.
   Pass `noReentry` when the wave side is closed, so absorbs go to the sweep.
2. Route rows under the real task id, never the pass's pseudo id (`p<N>-latefix-<k>`).
3. Advance `lastLandedTip` from `mr.integration_sha` on the merged arm. Before this fix, only `landMerged` wrote it.
4. Say `git merge --ff-only` in the merge prompt. A plain "(fast-forward merge)" can make a merge commit.
5. Check the trailer a recovery read depends on before the merge (here the `Late-Fix:` trailer).
6. Stop the item on a worker death or re-audit death. Without a stop, a dead API burns the whole `fixRounds` budget.
7. Point an evidence seat at the manifest the worker writes (`manifestTask: origin`, read by `manifestPathOf(task.manifestTask || task)`).
8. Dedup a queue fed by several seats. Key choice matters: blanking the task id is right only when a file is present (`lateKeyOf` plus the `blankText(f.file) ? null` guard in `queueLateFix`).
9. Update every count and exclusivity claim the new site breaks: "six merge-task sites", "three provision flavors", "the ONE git read allowed".
   At the landed tip, the comment above `absorbChargesClause` still says "the ONE git read allowed", though the prompt text was fixed.

10. Copy each stop into every re-audit arm of the SAME pass, not only into sibling passes.
   Plan 2026-11-08 phase 4 (task 4.1, D42) added an at-tip re-audit arm to `lateFixPass`.
   That arm checked only `allApprove` and skipped the D15 escalate stop, so an escalate seat burned rounds to the cap and lost its reason.
   Four seats raised it, three as Major. The fix moved the stop into one helper, `lfEscStop`, that both arms call.
   Prefer one shared helper over a second inline copy when a pass grows a new arm.

Also see [[dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer]], [[gate-audit-family-seat-disposition-ask-silently-dropped]] and [[standing-instruction-vs-dispatched-prompt-coverage-split]].

Locate-cue: verify still present before acting — `lateFixPass`, `routeReauditMinors(lfRecord`, `queueLateFix` and `lateKeyOf` found in `skills/war/assets/workflow-template.js` @ phase 3 landed tip c271332. Item 10: `const lfEscStop` and its two callers (`const tEsc = lfEscStop(`, `const lfEsc = lfEscStop(`) found @ plan 2026-11-08 phase 4 landed tip 0b53a8ac.
