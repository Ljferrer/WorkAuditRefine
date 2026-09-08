# Snipe repair-discipline handoff

The Codex-only Snipe adapter operationalizes the repair discipline in
[WAR #2097](https://github.com/Ljferrer/WorkAuditRefine/issues/2097) at two distinct
handoffs. Memory indexes and issue links alone do not ensure the relevant agent
reads the discipline when deciding how to review or repair a change.

## Delivery contract

- Every auditor seat prompt includes the complete packaged
  `references/auditing-fixes.md`. It asks the read-only reviewer to trace the
  repaired invariant through siblings, new branches and downstream contracts,
  distinguish discriminating evidence from test count, and report actionable
  causes without manufacturing more rounds. It does not authorize execution or
  repairs and does not change the verdict schema.
- Every consolidated panel return includes `coordinatorGuidance`, independently
  of seat success, findings, approval or cancellation. Its `source` is the fixed
  package-relative `references/post-audit-fixes.md`; its `text` is that file's
  complete, unabridged content. This field precedes potentially large seat output.
  Neither request fields nor auditor verdicts supply or override it.
- The main skill requires reading that guidance after the panel returns. If
  output is clipped, only the rendered report is available, or an older runner
  omits the field, it reads the fixed packaged file directly. Prelaunch errors
  do not fabricate a panel return. A later authorized repair rereads the file if
  the text has left context. Delegated fixers receive the complete discipline and
  relevant evidence, not merely a link or the auditors' proposed edits.

This is explicit instruction delivery through ordinary tool-result context,
not a system-prompt modification, a hidden follow-up message, or a guarantee of
permanent model retention. The renderer includes a short repair-handoff reminder;
the main task need not reproduce the full doctrine in the user-facing report.
Reading it never authorizes fixes, another squad, commits, filing or merging.
The audit still reports and stops; the user separately authorizes repair.

## Verification and limits

Runner tests assert exact reference delivery to every captured seat prompt and
exact fixer-reference bytes in both the programmatic and CLI returns. They cover
approved, blocking, invalid, failed and cancelled panels, reject request/seat
guidance substitution, and keep fixer instructions out of auditor prompts.
Packaging tests verify both files ship byte-for-byte in the standalone plugin.

Behavioral acceptance uses a disposable repository and an actual runner return
from a synthetic auditor transport. The report names one finite-number validation
defect; the independent fixer sees the returned discipline and repository, not an
answer key. Its repair is inspected for sibling/consumer coverage and genuinely
discriminating regression evidence. This complements delivery tests; one exercise
cannot guarantee all future agents follow the discipline or establish installed
Desktop acceptance. The installed plugin remains unchanged until separately
updated after PR review.
