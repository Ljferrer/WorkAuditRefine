import { readFileSync } from 'node:fs'

const policy = JSON.parse(readFileSync(new URL('./baseline-skips.json', import.meta.url), 'utf8'))

export function isSkipLine(line) {
  return /^\s*SKIP\b/i.test(line) || /^\s*(?:ok|not ok)(?: \d+)? .*# (?:SKIP|TODO)\b/i.test(line)
}

// Detection is deliberately broader than approval: unknown, TODO, failing and stderr rows fail closed.
export function approvedSkipReason(path, line, channel) {
  const name = typeof line === 'string' ? line.match(/^\s*ok \d+ - (.*?) # SKIP(?:\s|$)/)?.[1] : undefined
  const names = policy[path] ?? {}
  return channel === 'stdout' && Object.hasOwn(names, name) ? names[name] : null
}
