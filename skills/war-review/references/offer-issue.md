# Offer the issue (friction only)

Only when the verdict is **friction found**:

1. **Draft one issue** — title + body carrying the friction rows with their evidence, the `runId`,
   and the **plugin version** (`version` from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
   Root-cause claims stay hypothesis-labeled per § 4.
2. **Resolve the target repo** from the installed plugin's own metadata — the `repository` slot of
   `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. If that slot is missing or unparseable,
   **ask the operator for a repo — never guess**.
3. **Show the drafted issue and the resolved target**, then file **only on explicit confirmation**.
   No confirmation → nothing is filed.
4. **gh-preflight before the write.** Before filing, run
   `bash ${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh "<overrides.ghUser>"` (from the run
   config's `overrides.ghUser`; empty/unset ⇒ no-op exit 0).
