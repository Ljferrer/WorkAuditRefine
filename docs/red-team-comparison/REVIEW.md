# Claude independent red-team review

**Step 0 — ready immediately.** The operator can run the installed Claude red-team now, before the Codex migration finishes. Invoke `/red-team docs/plans/2026-09-08-codex-red-team-migration.md` in a fresh Claude task rooted on this branch. Do not wait for the Codex package.

- Target branch: `codex/red-team-review-claude`.
- Frozen repository baseline: `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5` from `codex-port`.
- Plan: `docs/plans/2026-09-08-codex-red-team-migration.md`.
- Original plan SHA-256: `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`.
- PR destination: `codex/red-team-comparison`.

These starting commits add only the plan and this instruction file. Existing Codex code is inherited from the baseline; the proposed red-team migration is implemented elsewhere. Review the plan against this target repository. Do not merge/rebase migration code or peer review commits into this branch before the initial review.

Use a fresh review context without the implementation ledger, implementation repair history, or the other reviewer’s findings. Read the plan and relevant target sources and perform the installed red-team’s review process. Record actual model/effort, tool/package identity, target commit, original plan hash, evidence paths and coverage gaps. Preserve raw attempts and the initial report/gate result before any plan patches or adjudication; keep later outcomes separately. Review artifacts and plan patches belong on this host’s branch. Retain the original plan blob through its starting commit. Report access failures and missing evidence honestly; do not invent execution or a successful outcome.

After the independent Codex first attempt at the Phase-2 checkpoint has been retained, Post-Implementation Phase 3 may reveal both initial reviews and the detailed implementation ledger, compile findings, and adapt the implementation. Do not expose Claude findings to the initial Codex reviewer even if Claude finishes first. Preserve each host’s report separately so matching report filenames cannot overwrite one another. If any prior findings/history were disclosed, record that limitation.

The operator controls review execution and later comparison. Do not implement the migration in this review task, launch the peer reviewer, or merge either comparison PR. Save review results for the operator; pushing new review commits is a separate operator-directed action.
