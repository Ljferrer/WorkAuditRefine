import { RESERVED_LENSES } from '../../../../../skills/war/assets/war-config.mjs'

const SHA = /^[0-9a-f]{40}$/

export class SnipeResultError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SnipeResultError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SnipeResultError(code, message)
}

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_RESULT', `${path} must be an object`)
  return value
}

function exactKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail('UNKNOWN_FIELD', `${path}.${key} is not supported`)
  }
}

function nonempty(value, path) {
  if (typeof value !== 'string' || value.trim() === '') fail('INVALID_RESULT', `${path} must be a non-empty string`)
  return value
}

function alias(value, canonical, alternate, path) {
  if (value[canonical] !== undefined && value[alternate] !== undefined) {
    fail('AMBIGUOUS_ALIAS', `${path} cannot contain both ${canonical} and ${alternate}`)
  }
  return value[canonical] ?? value[alternate]
}

function normalizeFinding(input, index) {
  const path = `result.findings[${index}]`
  const finding = object(input, path)
  exactKeys(finding, ['severity', 'title', 'file', 'locator', 'line', 'rationale', 'evidence', 'suggested_fix', 'fix', 'plan_ref', 'disposition', 'barrier', 'ask'], path)
  if (!['Critical', 'Major', 'Minor', 'Nit'].includes(finding.severity)) fail('INVALID_FINDING', `${path}.severity is invalid`)
  const normalized = {
    severity: finding.severity,
    title: nonempty(finding.title, `${path}.title`),
  }
  for (const key of ['file', 'locator', 'plan_ref', 'barrier']) {
    if (finding[key] !== undefined) normalized[key] = nonempty(finding[key], `${path}.${key}`)
  }
  if (finding.line !== undefined) {
    if (!Number.isInteger(finding.line) || finding.line < 1) fail('INVALID_FINDING', `${path}.line must be a positive integer`)
    normalized.line = finding.line
  }
  normalized.rationale = nonempty(alias(finding, 'rationale', 'evidence', path), `${path}.rationale`)
  const suggestedFix = alias(finding, 'suggested_fix', 'fix', path)
  if (suggestedFix !== undefined) normalized.suggested_fix = nonempty(suggestedFix, `${path}.suggested_fix`)
  if (['Minor', 'Nit'].includes(finding.severity)) {
    if (!['absorb', 'follow-up', 'note', 'ask'].includes(finding.disposition)) {
      fail('INVALID_FINDING', `${path}.disposition is required for Minor/Nit findings`)
    }
    normalized.disposition = finding.disposition
  } else if (finding.disposition !== undefined) {
    fail('INVALID_FINDING', `${path}.disposition is only supported for Minor/Nit findings`)
  }
  if (finding.disposition === 'ask') {
    const ask = object(finding.ask, `${path}.ask`)
    exactKeys(ask, ['question', 'alternatives', 'fork'], `${path}.ask`)
    normalized.ask = {
      question: nonempty(ask.question, `${path}.ask.question`),
      alternatives: nonempty(alias(ask, 'alternatives', 'fork', `${path}.ask`), `${path}.ask.alternatives`),
    }
  } else if (finding.ask !== undefined) {
    fail('INVALID_FINDING', `${path}.ask requires disposition 'ask'`)
  }
  return normalized
}

export function validateSnipeVerdict(input, expected) {
  const value = object(input, 'result')
  exactKeys(value, ['schema_version', 'seat', 'lens', 'scope', 'audit_sha', 'verdict', 'confidence', 'findings', 'tests_verified', 'tests_inspected', 'widen', 'escalate_reason'], 'result')
  if (value.schema_version !== 1) fail('SCHEMA_VERSION', 'result.schema_version must be 1')
  const seat = typeof value.seat === 'string' && /^seat-[1-5]$/.test(value.seat)
    ? Number(value.seat.slice(5))
    : value.seat
  if (seat !== expected.seat) fail('SEAT_MISMATCH', `result.seat must be ${expected.seat}`)
  if (value.lens !== expected.lens) fail('LENS_MISMATCH', `result.lens must be '${expected.lens}'`)
  if (value.scope !== undefined && value.audit_sha !== undefined) fail('AMBIGUOUS_ALIAS', 'result cannot contain both scope and audit_sha')
  const scope = object(value.scope ?? { kind: 'committed', audit_sha: value.audit_sha }, 'result.scope')
  exactKeys(scope, ['kind', 'audit_sha', 'fingerprint', 'advisory'], 'result.scope')
  if (expected.scope.kind === 'committed') {
    if (scope.kind !== 'committed' || scope.fingerprint !== undefined || scope.advisory !== undefined || !SHA.test(scope.audit_sha ?? '') || scope.audit_sha !== expected.scope.headSha) {
      fail('SCOPE_MISMATCH', `result.scope.audit_sha must match ${expected.scope.headSha}`)
    }
  } else if (expected.scope.kind === 'dirty') {
    if (scope.kind !== 'dirty' || scope.audit_sha !== undefined || scope.advisory !== true || !/^[0-9a-f]{64}$/.test(scope.fingerprint ?? '') || scope.fingerprint !== expected.scope.fingerprint) {
      fail('SCOPE_MISMATCH', `result.scope must echo dirty fingerprint ${expected.scope.fingerprint} as advisory`)
    }
  } else {
    fail('SCOPE_MISMATCH', `unsupported expected scope kind '${expected.scope.kind}'`)
  }
  if (!['approve', 'request_changes', 'escalate'].includes(value.verdict)) fail('INVALID_RESULT', 'result.verdict is invalid')
  if (!['high', 'medium', 'low'].includes(value.confidence)) fail('INVALID_RESULT', 'result.confidence is invalid')
  if (!Array.isArray(value.findings)) fail('INVALID_RESULT', 'result.findings must be an array')
  const findings = value.findings.map(normalizeFinding)
  if (value.verdict === 'approve' && findings.some(finding => ['Critical', 'Major'].includes(finding.severity))) {
    fail('INCONSISTENT_VERDICT', 'approve cannot carry a Critical or Major finding')
  }
  if (value.verdict === 'escalate') nonempty(value.escalate_reason, 'result.escalate_reason')
  else if (value.escalate_reason !== undefined) fail('INCONSISTENT_VERDICT', 'escalate_reason is only valid for an escalate verdict')
  if (value.tests_verified !== undefined && value.tests_inspected !== undefined) {
    fail('AMBIGUOUS_ALIAS', 'result cannot contain both tests_verified and tests_inspected')
  }
  const tests = value.tests_inspected === undefined
    ? object(value.tests_verified, 'result.tests_verified')
    : { exist: true, inspected: value.tests_inspected }
  exactKeys(tests, ['exist', 'inspected'], 'result.tests_verified')
  if (tests.exist !== true || !Array.isArray(tests.inspected) || !tests.inspected.every(item => typeof item === 'string')) {
    fail('INVALID_RESULT', 'result.tests_verified must contain exist: true and inspected')
  }
  if (value.widen !== undefined && (!Array.isArray(value.widen) || value.widen.length === 0 || new Set(value.widen).size !== value.widen.length || !value.widen.every(item => typeof item === 'string' && item.trim() && !RESERVED_LENSES.includes(item)))) {
    fail('INVALID_RESULT', 'result.widen must be a non-empty array of distinct lens names')
  }
  nonempty(value.lens, 'result.lens')
  return {
    schema_version: 1,
    seat,
    lens: value.lens,
    scope: structuredClone(scope),
    verdict: value.verdict,
    confidence: value.confidence,
    findings,
    tests_verified: structuredClone(tests),
    ...(value.widen === undefined ? {} : { widen: [...value.widen] }),
    ...(value.escalate_reason === undefined ? {} : { escalate_reason: value.escalate_reason }),
  }
}

export function parseSnipeVerdict(response, expected) {
  if (typeof response !== 'string') fail('MALFORMED_JSON', 'seat response must be one complete JSON object')
  let value
  try {
    value = JSON.parse(response)
  } catch {
    fail('MALFORMED_JSON', 'seat response must be one complete JSON object with no prose wrapper')
  }
  return validateSnipeVerdict(value, expected)
}

const SEVERITY_ORDER = new Map([['Critical', 0], ['Major', 1], ['Minor', 2], ['Nit', 3]])

function inline(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function scopeLines(panel) {
  const { scope, profile } = panel.request
  const lines = []
  if (scope.kind === 'committed') {
    lines.push(`- Committed scope: ${inline(scope.description)}`)
    lines.push(`- Revision: \`${scope.headSha}\` (base \`${scope.baseSha}\`)`)
  } else {
    lines.push(`- Dirty advisory scope: ${inline(scope.description)}`)
    lines.push(`- Fingerprint before review: \`${scope.fingerprint}\``)
    lines.push(`- Included: ${(scope.included ?? []).join(', ') || 'none declared'}`)
    lines.push(`- Stability: ${panel.stability.stable ? 'unchanged' : 'changed during review or incompletely captured'}`)
  }
  if (scope.paths?.length) lines.push(`- Paths: ${scope.paths.map(path => `\`${inline(path)}\``).join(', ')}`)
  lines.push(`- Configured seat profile: \`${profile.model}\` / \`${profile.effort}\` (actual model identity not independently verified)`)
  return lines
}

function groupedFindings(seats) {
  const groups = new Map()
  for (const seat of seats) {
    for (const finding of seat.verdict?.findings ?? []) {
      const key = JSON.stringify(finding)
      const group = groups.get(key) ?? { finding, seats: [] }
      group.seats.push({ seat: seat.seat, lens: seat.lens })
      groups.set(key, group)
    }
  }
  return [...groups.values()].sort((left, right) => (
    SEVERITY_ORDER.get(left.finding.severity) - SEVERITY_ORDER.get(right.finding.severity)
      || left.finding.title.localeCompare(right.finding.title)
  ))
}

export function renderSnipeReport(panel) {
  const lines = ['# Snipe report', '', '## Scope', '', ...scopeLines(panel)]
  if (!panel.complete) lines.push('', '> INCOMPLETE — do not interpret this panel as clean.')

  lines.push('', '## Seat outcomes', '')
  for (const seat of panel.seats) {
    const validation = seat.validation?.status === 'valid' ? 'validated' : inline(seat.validation?.error ?? 'no validated result')
    const repair = seat.repair?.attempted ? `; repair ${seat.repair.succeeded ? 'succeeded' : 'failed'}` : ''
    const judgment = seat.verdict ? `; verdict ${seat.verdict.verdict}; confidence ${seat.verdict.confidence}` : ''
    lines.push(`- Seat ${seat.seat} · ${inline(seat.lens)}: ${seat.status} — ${validation}${repair}${judgment}`)
  }

  const limitations = []
  if (!panel.stability.stable) limitations.push('Scope changed during review or contains uncaptured content; no stable clean result is possible.')
  for (const change of panel.request.scope.submodules ?? []) {
    if (change.limitation) limitations.push(`${inline(change.path)}: ${inline(change.limitation)}`)
  }
  for (const seat of panel.seats) {
    if (seat.validation?.status !== 'valid') limitations.push(`Seat ${seat.seat} (${inline(seat.lens)}): ${inline(seat.validation?.error ?? seat.status)}`)
    if (seat.truncated) limitations.push(`Seat ${seat.seat} (${inline(seat.lens)}): output was truncated.`)
  }
  if (limitations.length) lines.push('', '## Limitations', '', ...limitations.map(item => `- ${item}`))

  lines.push('', '## Findings', '')
  const groups = groupedFindings(panel.seats)
  if (groups.length === 0) lines.push(panel.complete ? 'No validated findings.' : 'No validated findings were returned; the incomplete panel is not clean.')
  for (const { finding, seats } of groups) {
    const block = ['Critical', 'Major'].includes(finding.severity) ? ' — would block in a phase' : ''
    lines.push(`### ${finding.severity} · ${inline(finding.title)}${block}`, '')
    lines.push(`- Seats: ${seats.map(item => `${item.seat} (${inline(item.lens)})`).join(', ')}`)
    if (finding.file) lines.push(`- Location: \`${inline(finding.file)}${finding.line ? `:${finding.line}` : ''}\``)
    else if (finding.locator) lines.push(`- Locator: ${inline(finding.locator)}`)
    lines.push(`- Evidence: ${inline(finding.rationale)}`)
    if (finding.suggested_fix) lines.push(`- Proposed correction: ${inline(finding.suggested_fix)}`)
    if (finding.disposition) lines.push(`- Disposition: ${finding.disposition} (classification only)`)
  }

  const asks = groups.filter(group => group.finding.disposition === 'ask')
  if (asks.length) {
    lines.push('', '## Operator asks', '')
    for (const { finding } of asks) {
      lines.push(`- Question: ${inline(finding.ask.question)}`)
      lines.push(`  Alternatives: ${inline(finding.ask.alternatives)}`)
    }
  }
  const escalations = panel.seats.filter(seat => seat.verdict?.verdict === 'escalate')
  if (escalations.length) {
    lines.push('', '## Escalations', '')
    for (const seat of escalations) {
      lines.push(`- Seat ${seat.seat} (${inline(seat.lens)}) — Operator decision required: ${inline(seat.verdict.escalate_reason)}`)
    }
  }
  const widen = panel.seats.flatMap(seat => (seat.verdict?.widen ?? []).map(lens => ({ seat: seat.seat, lens })))
  if (widen.length) {
    lines.push('', '## Widen recommendations', '')
    lines.push(`- Report-only; no extra seats launched: ${widen.map(item => `seat ${item.seat} → ${inline(item.lens)}`).join(', ')}`)
  }
  lines.push('', 'No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.')
  return `${lines.join('\n')}\n`
}
