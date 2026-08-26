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
//   2 — tooling error: unreadable template, unreadable args file/stdin, unparseable args JSON, or
//       a readable template that yields ZERO fallback-free interpolations (wrong template source —
//       certifying against zero requirements would be a silent pass) — never reported as
//       "missing field" and never a floor pass.
//
// Extraction mechanics (A2 — mechanism latitude granted by the plan's Commander's Intent):
//   - Only pt-tagged template literals are scanned (the dispatched-prompt surface). Comments, error
//     messages, and derivation helpers are not prompt bytes and are excluded by construction.
//   - An interpolation qualifies when its expression is a PURE member chain (`a.b.c` — no `??`,
//     `||`, ternary, call, or optional chaining): any of those is a fallback/guard, so the site is
//     not fallback-free.
//   - Chains map to args fields by root: `ph.X` → phase.X; `plan.X` → plan.X; `task.X` / `t.X` /
//     `r.task.X` → tasks[].X; a bare identifier maps to a top-level args key only when the template
//     binds it as an unguarded `const <local> = A.<key>` read or a no-default destructure off `A`
//     (mechanically parsed from the source) — detection keys on the LOCAL name, but the emitted
//     field is the ARGS key (an aliased `{ phase: ph }` binding emits `phase`, never `ph`).
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

import { readFileSync, realpathSync } from 'node:fs'
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
      // Escaped pairs are DROPPED, not copied: an escaped `\${…}` is prompt PROSE (an
      // agent-resolved placeholder), and copying it would make the flat re-scan count it as a
      // real interpolation. Dropping still consumes both chars, so `\`` never terminates a span.
      if (c === '\\' && top === 'tpl') { i += 2; continue }
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

// Top-level args keys the template binds WITHOUT a guard/fallback: `const <name> = A.<key>` (the
// trailing comment tolerated), plus destructure bindings without defaults on the `= A` line.
// Returns a Map LOCAL binding name → ARGS key: detection of a bare `${…}` identifier keys on the
// local name, but the field the floor requires (and the missing-field message names) must be the
// args key — an aliased binding (`const { phase: ph } = A`) reads `A.phase`, not `A.ph`.
export function unguardedTopLevelKeys (source) {
  const keys = new Map()
  const re = /^const ([A-Za-z_$][\w$]*) = A\.([A-Za-z_$][\w$]*)\s*(?:\/\/.*)?$/gm
  let m
  while ((m = re.exec(source))) keys.set(m[1], m[2])
  const destructure = source.match(/^const \{ (.*) \} = A$/m)
  if (destructure) {
    for (const part of destructure[1].split(',')) {
      const p = part.trim()
      if (p.includes('=')) continue // has a default — guarded
      const alias = p.match(/^([\w$]+): ([\w$]+)$/)
      if (alias) keys.set(alias[2], alias[1]) // local → args key
      else keys.set(p, p)
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
    else if (parts.length === 1 && topLevel.has(root)) fields.add(topLevel.get(root)) // emit the ARGS key, not the local alias
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
      // lacks the explicit path — mirror the template's derivation-class gating. DEFENSIVE for the
      // shipped template: it never interpolates the trio bare into a pt span today, so this gate
      // fires only if a future template edit adds such a site (covered by a synthetic-template
      // fixture in assert-args-complete.test.mjs, not by the real-template census).
      if ((field === 'planSlug' || field === 'runId' || field === 'worktreeRoot') &&
          !tasks.some(t => !present(t && t.branch) || !present(t && t.worktree))) continue
      missing.push(`${field} is missing`)
    }
  }
  return [...new Set(missing)].sort()
}

// ---- CLI -----------------------------------------------------------------------------------
// Repo-canonical main-guard idiom (war-config.mjs / stage-workflow.mjs / war-memory.mjs): realpath
// the argv entry so a symlinked invocation still RUNS the floor — the retired file:// string-build
// made a symlinked invocation silently exit 0 having checked nothing (a fail-open floor).
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
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
  const fields = extractArgsFields(src)
  if (fields.length === 0) {
    // Vacuous-pass guard: a READABLE but wrong template source (empty file, non-template JS)
    // extracts zero fields, and certifying against zero requirements would be a silent floor
    // pass. That is a tooling error (exit 2), never a floor status.
    process.stderr.write(`assert-args-complete: template ${templatePath} yielded ZERO fallback-free interpolations — wrong template source? refusing to certify\n`)
    process.exit(2)
  }
  const missing = checkArgs(fields, parsed)
  if (missing.length) {
    process.stderr.write(`assert-args-complete: launch args are dispatch-INCOMPLETE (${missing.length} missing field(s)):\n`)
    for (const line of missing) process.stderr.write(`  - ${line}\n`)
    process.exit(1)
  }
  // Scope the claim to what was proven: the fallback-free prompt-interpolation surface only —
  // the template's own entry validation (fallback-guarded required fields like plan.file /
  // tasks[].planSlice) still applies at dispatch.
  process.stdout.write('assert-args-complete: launch args are dispatch-complete — every fallback-free prompt interpolation is supplied (template entry validation still applies)\n')
  process.exit(0)
}
