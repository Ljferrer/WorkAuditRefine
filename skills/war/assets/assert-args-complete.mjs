#!/usr/bin/env node
// assert-args-complete.mjs — Lead-side launch-args preflight floor (D5 / A2, engine-reliability plan).
//
// A /war launch whose assembled args omit a field the workflow template interpolates FALLBACK-FREE
// into a dispatched prompt ships that prompt with the literal text "undefined" (or dies mid-build) —
// the vacuous-phase family of silent degradations (#1421 / the missing-plan-file incident). This
// floor runs BEFORE dispatch: it reads the template source, mechanically extracts the fallback-free
// `${…}` member-chain interpolations inside pt-tagged prompt spans, maps each to the launch-args
// field it reads, and checks the supplied args object for every mapped field.
//
// Usage:
//   node assert-args-complete.mjs [--template <path>] [<args-file.json>|-]
// The args object arrives as a JSON file path on argv, or on stdin when the positional is `-` or
// absent. --template overrides the template source path (default: workflow-template.js beside this
// script). Unknown flags are refused loudly in BOTH input modes (the two-input-mode CLI trap —
// an argv guarantee must not hold in one mode by accident of positional handling).
//
// Exit contract (floor scripts exit 0/1/2; 2 never collapses into the floor status):
//   0 — every required field is present; the launch is dispatch-complete.
//   1 — a required field is missing: stderr names each missing field. Fix the assembled args.
//   2 — read error: unreadable template, unreadable args file/stdin, or unparseable args JSON —
//       never reported as "missing field".
//
// Extraction mechanics (A2 — mechanism latitude granted by the plan's Commander's Intent):
//   - Only pt-tagged template literals are scanned (the dispatched-prompt surface). Comments, error
//     messages, and derivation helpers are not prompt bytes and are excluded by construction.
//   - An interpolation qualifies when its expression is a PURE member chain (`a.b.c` — no `??`,
//     `||`, ternary, call, or optional chaining): any of those is a fallback/guard, so the site is
//     not fallback-free.
//   - Chains map to args fields by root: `ph.X` → phase.X; `plan.X` → plan.X; `task.X` / `t.X` /
//     `r.task.X` → tasks[].X; a bare identifier maps to a top-level args key only when the template
//     binds it as an unguarded `const <name> = A.<name>` read (mechanically parsed from the source).
//     Locals and loop variables have no such binding and drop out.
//   - EXEMPT fields (documented below) are extracted but not required: each is either derived at
//     entry from other args, composed with a default at the template's own composition point, or
//     interpolated only inside a presence-gated ternary the flat `${…}` scan cannot see.
//
// Checking semantics mirror the template's entry classes:
//   - phase.* fields are unconditional (the PHASE-FIELD class).
//   - plan.* and tasks[].* checks are vacuous on a zero-task launch (the two ratified plan-less
//     zero-task shapes stay legal, #1430).
//   - tasks[].branch / tasks[].worktree are satisfied by an explicit per-task value OR by the
//     derivation inputs the template uses (branch: planSlug + phase.id; worktree: worktreeRoot +
//     runId + phase.id) — the missing-field message names both remedies.
//
// The default-deny census in workflow-template.test.mjs pins the exact extracted set via this
// module's exports: any NEW fallback-free interpolation reds the census and forces an explicit
// classification (required here, or exempt with a reason).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Fields extracted from pt spans but deliberately NOT required of the launch args. Keys are the
// mapped field names extractArgsFields() emits. Reasons are load-bearing documentation: an entry
// here is a claim that the interpolation site cannot see an absent value.
export const EXEMPT_FIELDS = new Map([
  ['plan.gate', 'composed at the template gate-composition point — resolveGate(null) yields the discovery-only clause'],
  ['tasks[].branch', 'entry-derived from planSlug + phase.id when absent (taskBranch); required via derivation inputs instead'],
  ['tasks[].worktree', 'entry-derived from worktreeRoot + runId + phase.id when absent (taskWorktree); required via derivation inputs instead'],
  ['tasks[].doneWhen', 'string|null contract — every site sits inside a task.doneWhen-presence ternary (doneWhenClause / the done-when floor block)'],
  ['tasks[].targetRepo', 'submodule tasks only — sites are gated by the targetRepo classification branch'],
  ['phase.epicIssue', 'optional — every site sits inside a ph.epicIssue-presence ternary or carries a || fallback'],
])

// ---- pt-span tokenizer ---------------------------------------------------------------------
// Collect the raw text of every pt-tagged template literal. A mode STACK tracks `${…}` expression
// nesting, plain-brace nesting inside expressions, and nested backtick templates (an inner pt`…`
// inside a ternary), so a span never terminates early — the outer span's text INCLUDES every
// nested span, and one flat re-scan over the collected text sees both.
export function ptSpans (source) {
  const spans = []
  const re = /\bpt`/g
  let m
  while ((m = re.exec(source))) {
    let i = m.index + m[0].length
    const stack = ['tpl'] // 'tpl' = template text, 'expr' = ${…} body, 'brace' = plain {…} inside an expr
    let out = ''
    while (i < source.length && stack.length) {
      const c = source[i]
      const top = stack[stack.length - 1]
      if (c === '\\' && top === 'tpl') { out += source.slice(i, i + 2); i += 2; continue }
      if (top === 'tpl') {
        if (c === '`') { stack.pop(); if (!stack.length) break; out += c; i++; continue }
        if (c === '$' && source[i + 1] === '{') { stack.push('expr'); out += '${'; i += 2; continue }
      } else { // 'expr' or 'brace'
        if (c === '`') { stack.push('tpl'); out += c; i++; continue }
        if (c === '{') { stack.push('brace'); out += c; i++; continue }
        if (c === '}') { stack.pop(); out += c; i++; continue }
      }
      out += c; i++
    }
    spans.push(out)
    re.lastIndex = i
  }
  return spans
}

// Pure member chains interpolated fallback-free inside pt spans, with occurrence counts.
export function extractInterpolations (source) {
  const chains = new Map()
  for (const span of ptSpans(source)) {
    const re = /\$\{([^{}]*)\}/g
    let m
    while ((m = re.exec(span))) {
      const e = m[1].trim()
      if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(e)) continue
      chains.set(e, (chains.get(e) || 0) + 1)
    }
  }
  return chains
}

// Top-level args keys the template binds WITHOUT a guard/fallback: `const <name> = A.<name>` (the
// trailing comment tolerated), plus destructure bindings without defaults on the `= A` line.
export function unguardedTopLevelKeys (source) {
  const keys = new Set()
  const re = /^const ([A-Za-z_$][\w$]*) = A\.([A-Za-z_$][\w$]*)\s*(?:\/\/.*)?$/gm
  let m
  while ((m = re.exec(source))) keys.add(m[1])
  const destructure = source.match(/^const \{ (.*) \} = A$/m)
  if (destructure) {
    for (const part of destructure[1].split(',')) {
      const p = part.trim()
      if (p.includes('=')) continue // has a default — guarded
      const alias = p.match(/^([\w$]+): ([\w$]+)$/)
      keys.add(alias ? alias[2] : p)
    }
  }
  return keys
}

// Map extracted chains to launch-args fields. Returns a sorted array of unique field names.
export function extractArgsFields (source) {
  const topLevel = unguardedTopLevelKeys(source)
  const fields = new Set()
  for (const expr of extractInterpolations(source).keys()) {
    const parts = expr.split('.')
    const root = parts[0]
    if (root === 'ph' && parts.length === 2) fields.add(`phase.${parts[1]}`)
    else if (root === 'plan' && parts.length === 2) fields.add(`plan.${parts[1]}`)
    else if ((root === 'task' || root === 't') && parts.length === 2) fields.add(`tasks[].${parts[1]}`)
    else if (root === 'r' && parts[1] === 'task' && parts.length === 3) fields.add(`tasks[].${parts[2]}`)
    else if (parts.length === 1 && topLevel.has(root)) fields.add(root)
  }
  return [...fields].sort()
}

const present = v => v !== undefined && v !== null && v !== ''

// Check a launch-args object against the extracted field set. Returns the sorted list of
// missing-field messages (empty = complete). Exported for the unit tests and the census suite.
export function checkArgs (fields, args) {
  const missing = []
  const a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
  const phase = (a.phase && typeof a.phase === 'object') ? a.phase : {}
  const plan = (a.plan && typeof a.plan === 'object') ? a.plan : {}
  const tasks = Array.isArray(a.tasks) ? a.tasks : []
  const canDeriveBranch = present(a.planSlug) && present(phase.id)
  const canDeriveWorktree = present(a.worktreeRoot) && present(a.runId) && present(phase.id)
  for (const field of fields) {
    if (EXEMPT_FIELDS.has(field) && field !== 'tasks[].branch' && field !== 'tasks[].worktree') continue
    if (field.startsWith('phase.')) {
      const k = field.slice('phase.'.length)
      if (!present(phase[k])) missing.push(`${field} is missing`)
    } else if (field.startsWith('plan.')) {
      if (tasks.length === 0) continue // ratified zero-task shapes need no plan
      const k = field.slice('plan.'.length)
      if (!present(plan[k])) missing.push(`${field} is missing (required on a tasks-bearing launch)`)
    } else if (field === 'tasks[].branch') {
      for (const t of tasks) {
        if (!present(t && t.branch) && !canDeriveBranch) {
          missing.push(`tasks[${(t && t.id) ?? '?'}].branch is missing and underivable — supply it explicitly or thread planSlug + phase.id`)
        }
      }
    } else if (field === 'tasks[].worktree') {
      for (const t of tasks) {
        if (!present(t && t.worktree) && !canDeriveWorktree) {
          missing.push(`tasks[${(t && t.id) ?? '?'}].worktree is missing and underivable — supply it explicitly or thread worktreeRoot + runId + phase.id`)
        }
      }
    } else if (field.startsWith('tasks[].')) {
      const k = field.slice('tasks[].'.length)
      for (const t of tasks) {
        if (!present(t && t[k])) missing.push(`tasks[${(t && t.id) ?? '?'}].${k} is missing`)
      }
    } else if (!present(a[field])) {
      // Top-level derivation inputs (planSlug/runId/worktreeRoot) are only consumed when a task
      // lacks the explicit path — mirror the template's derivation-class gating.
      if ((field === 'planSlug' || field === 'runId' || field === 'worktreeRoot') &&
          !tasks.some(t => !present(t && t.branch) || !present(t && t.worktree))) continue
      missing.push(`${field} is missing`)
    }
  }
  return [...new Set(missing)].sort()
}

// ---- CLI -----------------------------------------------------------------------------------
const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (invokedDirectly) {
  const here = dirname(fileURLToPath(import.meta.url))
  let templatePath = join(here, 'workflow-template.js')
  let argsSource = null
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i]
    if (tok === '--template') {
      if (!argv[i + 1]) { process.stderr.write('assert-args-complete: --template needs a path\n'); process.exit(2) }
      templatePath = argv[++i]
    } else if (tok.startsWith('--')) {
      // Default-deny: an unknown flag is refused in BOTH input modes, never silently dropped.
      process.stderr.write(`assert-args-complete: unknown flag ${tok}\n`); process.exit(2)
    } else if (argsSource === null) {
      argsSource = tok
    } else {
      process.stderr.write(`assert-args-complete: unexpected extra argument ${tok}\n`); process.exit(2)
    }
  }
  let src
  try {
    src = readFileSync(templatePath, 'utf8')
  } catch (err) {
    process.stderr.write(`assert-args-complete: cannot read template ${templatePath}: ${err.message}\n`); process.exit(2)
  }
  let raw
  try {
    raw = (argsSource === null || argsSource === '-') ? readFileSync(0, 'utf8') : readFileSync(argsSource, 'utf8')
  } catch (err) {
    process.stderr.write(`assert-args-complete: cannot read args ${argsSource === null || argsSource === '-' ? '<stdin>' : argsSource}: ${err.message}\n`); process.exit(2)
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    process.stderr.write(`assert-args-complete: args are not valid JSON: ${err.message}\n`); process.exit(2)
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    process.stderr.write(`assert-args-complete: args must be a JSON object, got ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}\n`); process.exit(2)
  }
  const missing = checkArgs(extractArgsFields(src), parsed)
  if (missing.length) {
    process.stderr.write(`assert-args-complete: launch args are dispatch-INCOMPLETE (${missing.length} missing field(s)):\n`)
    for (const line of missing) process.stderr.write(`  - ${line}\n`)
    process.exit(1)
  }
  process.stdout.write('assert-args-complete: launch args are dispatch-complete\n')
  process.exit(0)
}
