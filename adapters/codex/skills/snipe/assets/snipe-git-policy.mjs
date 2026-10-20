// Evidence identity must be identical in coordinator Git and auditor shells.
export const gitEvidenceEnvironment = Object.freeze({
  GIT_NO_REPLACE_OBJECTS: '1',
  GIT_NO_LAZY_FETCH: '1',
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
  GIT_CONFIG_COUNT: '4',
  GIT_CONFIG_KEY_0: 'core.hooksPath', GIT_CONFIG_VALUE_0: '/dev/null',
  GIT_CONFIG_KEY_1: 'core.fsmonitor', GIT_CONFIG_VALUE_1: 'false',
  GIT_CONFIG_KEY_2: 'diff.ignoreSubmodules', GIT_CONFIG_VALUE_2: 'none',
  GIT_CONFIG_KEY_3: 'submodule.recurse', GIT_CONFIG_VALUE_3: 'false',
})
