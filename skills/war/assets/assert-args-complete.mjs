#!/usr/bin/env node
// assert-args-complete.mjs — Lead-side launch-args preflight floor (D5 / A2, engine-reliability plan).
//
// A /war launch whose assembled args omit a field the workflow template interpolates FALLBACK-FREE
// into a dispatched prompt ships that prompt with the literal text "undefined" (or dies mid-build) —
// the vacuous-phase family of silent degradations (#1421 / the missing-plan-file incident). This
// floor runs BEFORE dispatch: it reads the template source, mechanically extracts the fallback-free
// `${…}` member-chain interpolations inside pt-tagged prompt spans, maps each to the launch-args
// field it reads, and checks the supplied args object for every mapped field. It then checks that
// each staged End state `check` and task `doneWhen` parses as shell (`bash -n`), that no `doneWhen`
// is the plan's `None — …` prose, that each staged `doneWhen` string equals its plan `Done when:`
// bullet byte for byte, and runs the template's own provenance floor (#1896) over the args.
//
// Usage:
//   node assert-args-complete.mjs [--template <path>] [--prior-manifest <path>] [<args-file.json>|-]
// The args object arrives as a JSON file path on argv, or on stdin when the positional is `-` or
// absent. --template overrides the template source path (default: workflow-template.js beside this
// script). --prior-manifest names the run manifest of the launch a sanctioned recovery relaunch
// recovers (#2495, D10): when `args.recovery.sanctioned === true`, the running plugin root (this
// script's realpath, three directories up) and its `.claude-plugin/plugin.json` version must equal
// that manifest's `pluginRoot` (realpath'd) and `pluginVersion`. Without the flag, or on any other
// launch, the manifest is never read. Unknown flags are refused loudly in BOTH input modes (the two-input-mode CLI trap —
// an argv guarantee must not hold in one mode by accident of positional handling).
//
// Exit contract (floor scripts exit 0/1/2; 2 never collapses into the floor status):
//   0 — every check passes; the launch is dispatch-complete. The stdout line names the two dispatch
//       shapes: the parsed object as the Workflow args, or no args over an --args staged script.
//   1 — the args fail a check, and stderr names each failure. Fix the assembled args (or the row at
//       its ledger source). The checks run in order and the first failing one exits: on a sanctioned
//       recovery with --prior-manifest, a plugin root or version that differs from the prior
//       manifest's (stderr prints both values and the `claude --plugin-dir <prior root>` form); a
//       missing required field; an End state `check` or task `doneWhen` that does not parse as shell, or a
//       `None — …` doneWhen; a staged doneWhen string that equals no plan `Done when:` bullet; a
//       provenance floor refusal, printed verbatim from the template plus one line telling the
//       Lead to fix the row at its ledger source, not the launch copy (provenanceRemedies names
//       the per-surface remedy: a planFile or planSlug stamp, the intent text, or a dropped
//       foreign row).
//   A boundary warning (#2545 part 3, boundaryWarnings below) goes to stderr and never changes the exit code.
//   So does the identity warning for a prior manifest whose `pluginRoot` or `pluginVersion` is absent
//   or null: that field is not compared.
//   2 — tooling error: unreadable template, unreadable args file/stdin, unparseable args JSON,
//       a --prior-manifest that is unreadable or not a JSON object on a sanctioned recovery, an
//       unreadable running `.claude-plugin/plugin.json`,
//       a readable template that yields ZERO fallback-free interpolations (wrong template source —
//       certifying against zero requirements would be a silent pass), a `bash` that cannot spawn,
//       an unreadable plan.file while a doneWhen string is staged, or a provenance mirror that
//       cannot run (missing floor markers, a missing FLOOR_BINDINGS line, an uncompilable slice,
//       or a throw from the slice that is not the floor's own refusal) — never reported as
//       "missing field" and never a floor pass.
//
// Extraction mechanics (A2 — mechanism latitude granted by the plan's Commander's Intent):
//   - Only pt-tagged template literals are scanned (the dispatched-prompt surface). Comments, error
//     messages, and derivation helpers are not prompt bytes. The seed scan skips `//` and `/* */`
//     comments, `'…'` / `"…"` strings and regex literals outside spans (#1775), so a pt` byte-run in
//     one of them (an args sibling script's JSON string included) opens no span; error messages and helpers
//     outside pt spans contribute nothing. The default-deny census in
//     workflow-template.engine-1.test.mjs still pins the extracted set.
//   - An interpolation qualifies when its expression is a PURE member chain (`a.b.c`, with
//     `[<digits>]` index segments admitted, #1760 — no `??`, `||`, ternary, call, or optional
//     chaining): any of those is a fallback/guard, so the site is not fallback-free.
//   - Chains map to args fields by root: `ph.X` → phase.X; `plan.X` → plan.X; `task.X` / `t.X` /
//     `r.task.X` / `tasks[N].X` → tasks[].X (any other indexed chain maps to no field); a bare
//     identifier maps to a top-level args key only when the template binds it as an unguarded `const <local> = A.<key>` read or a no-default destructure off `A`
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
// The default-deny census in workflow-template.engine-1.test.mjs pins the exact extracted set via this
// module's exports: any NEW fallback-free interpolation reds the census and forces an explicit
// classification (required here, or exempt with a reason).

import { readFileSync, realpathSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, isAbsolute, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { MODEL_RANK, DEFAULTS } from './war-config.mjs'

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
// Collect the raw text of every pt-tagged template literal. A mode STACK (walkPtSpan) tracks `${…}`
// expression nesting, plain-brace nesting inside expressions, and nested backtick templates (an inner pt`…`
// inside a ternary), so a span never terminates early — the outer span's text INCLUDES every
// nested span, and one flat re-scan over the collected text sees both. ptSpanRanges is the one
// scanner; it returns each span with its [start, end) source offsets (start at the pt` tag, end
// just past the closing backtick) and the [start, end) offsets of its top-level `${…}` bodies
// (`exprs`), so a caller can tell prompt prose from code inside a span by line as well as read it —
// stage-workflow.test.mjs's strip oracle does. A nested pt span (an inner pt`…` inside an outer
// span's `${…}` ternary) is part of the outer span's text and, by default, not a separate entry —
// `{ nested: true }` also emits each inner span (found by re-scanning every top-level expression
// body, offsets in the caller's source) after its outer span, so a prose-vs-code judgment can pick
// the innermost enclosing span. ptSpans is the text-only, top-level view of the same result.
const REGEX_AFTER_WORD = new Set(['return', 'case', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'yield', 'await', 'do', 'else', 'throw'])
const REGEX_AFTER_SIG = '(,=:[!&|?{};+-*%<>~^'
export function ptSpanRanges (source, { nested = false } = {}) {
  const spans = []
  const n = source.length
  // Seed scan (#1775, PIN-6): the code/template stack, comment, string and regex arms are adapted
  // from stripFullLineComments in stage-workflow.mjs. A `//` or `/* */` comment, a `'…'` or `"…"`
  // string (line-local, `\` escapes honoured) and a regex literal (a `/` after an operator, an opener
  // or a REGEX_AFTER_WORD keyword; `\` escapes and `[…]` classes honoured) are skipped, so a quote or
  // backtick inside one never desyncs the scan. A plain template literal is walked as text, and its
  // `${…}` bodies are code, so a pt span inside one still opens.
  const stack = [{ type: 'code' }]
  let lastSig = ''
  let prevSig = ''
  let lastWord = ''
  let wordProp = false
  let i = 0
  while (i < n) {
    const ctx = stack[stack.length - 1]
    const c = source[i]
    const c2 = source[i + 1]
    if (ctx.type === 'template') {
      if (c === '\\') { i += 2; continue }
      if (c === '`') { stack.pop(); prevSig = lastSig; lastSig = '`'; lastWord = ''; i++; continue }
      if (c === '$' && c2 === '{') { stack.push({ type: 'code', interp: true, depth: 0 }); prevSig = lastSig; lastSig = '{'; lastWord = ''; i += 2; continue }
      i++
      continue
    }
    if (c === '/' && c2 === '/') { const nl = source.indexOf('\n', i); i = nl === -1 ? n : nl; continue }
    if (c === '/' && c2 === '*') { const close = source.indexOf('*/', i + 2); i = close === -1 ? n : close + 2; continue }
    if (c === "'" || c === '"') {
      let j = i + 1
      while (j < n && source[j] !== c && source[j] !== '\n') { if (source[j] === '\\') j++; j++ }
      i = j < n && source[j] === '\n' ? j : j + 1
      lastSig = c; prevSig = ''; lastWord = ''
      continue
    }
    const postfix = (lastSig === '+' || lastSig === '-') && prevSig === lastSig
    if (c === '/' && (lastSig === '' || (REGEX_AFTER_SIG.includes(lastSig) && !postfix) || (REGEX_AFTER_WORD.has(lastWord) && !wordProp))) {
      let j = i + 1
      let inClass = false
      while (j < n && source[j] !== '\n') {
        const d = source[j]
        if (d === '\\') { j += source[j + 1] === '\n' ? 1 : 2; continue }
        if (inClass) { if (d === ']') inClass = false } else if (d === '[') inClass = true
        else if (d === '/') break
        j++
      }
      i = j < n && source[j] === '\n' ? j : j + 1
      while (i < n && /[a-z]/.test(source[i])) i++
      prevSig = lastSig; lastSig = '/'; lastWord = ''
      continue
    }
    if (c === 'p' && c2 === 't' && source[i + 2] === '`' && !/\w/.test(source[i - 1] ?? '')) {
      const span = walkPtSpan(source, i)
      spans.push(span)
      if (nested) {
        for (const [a, b] of span.exprs) {
          for (const inner of ptSpanRanges(source.slice(a, b), { nested: true })) {
            spans.push({ ...inner, start: inner.start + a, end: inner.end + a, exprs: inner.exprs.map(([x, y]) => [x + a, y + a]) })
          }
        }
      }
      i = span.end
      prevSig = lastSig; lastSig = '`'; lastWord = ''
      continue
    }
    if (c === '`') { stack.push({ type: 'template' }); i++; continue }
    if (ctx.interp) {
      if (c === '{') ctx.depth++
      else if (c === '}') {
        if (ctx.depth === 0) { stack.pop(); prevSig = lastSig; lastSig = '}'; lastWord = ''; i++; continue }
        ctx.depth--
      }
    }
    if (!/\s/.test(c)) {
      prevSig = lastSig
      lastSig = c
      if (/[\w$]/.test(c)) {
        const fresh = !/[\w$]/.test(source[i - 1] ?? '')
        if (fresh) wordProp = prevSig === '.'
        lastWord = fresh ? c : lastWord + c
      } else lastWord = ''
    }
    i++
  }
  return spans
}

// Walk one pt span from its tag at `start`; the span's own mode stack (unchanged by #1775).
function walkPtSpan (source, start) {
  let i = start + 3
  const stack = ['tpl'] // 'tpl' = template text, 'expr' = ${…} body, 'brace' = plain {…} inside an expr
  const exprs = []
  let exprStart = -1
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
      if (c === '$' && source[i + 1] === '{') { if (stack.length === 1) exprStart = i; stack.push('expr'); out += '${'; i += 2; continue }
    } else { // 'expr' or 'brace'
      if (c === '`') { stack.push('tpl'); out += c; i++; continue }
      if (c === '{') { stack.push('brace'); out += c; i++; continue }
      if (c === '}') { stack.pop(); if (stack.length === 1) exprs.push([exprStart, i + 1]); out += c; i++; continue }
    }
    out += c; i++
  }
  return { start, end: Math.min(i + 1, source.length), text: out, exprs }
}

export function ptSpans (source) {
  return ptSpanRanges(source).map((s) => s.text)
}

// Pure member chains interpolated fallback-free inside pt spans, with occurrence counts.
export function extractInterpolations (source) {
  const chains = new Map()
  for (const span of ptSpans(source)) {
    const re = /\$\{([^{}]*)\}/g
    let m
    while ((m = re.exec(span))) {
      const e = m[1].trim()
      if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(e)) continue
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
    // A bracket-indexed chain (#1760): `tasks[N].x` reads tasks[].x; any other indexed chain is
    // censused by extractInterpolations but maps to no args field.
    const indexed = expr.match(/^tasks\[\d+\]\.([A-Za-z_$][\w$]*)$/)
    if (indexed) { fields.add(`tasks[].${indexed[1]}`); continue }
    if (expr.includes('[')) continue
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
      // For path derivation, these inputs are consumed only when a task lacks the explicit path.
      // This interpolation floor does not validate gate identity; the engine entry guard requires
      // runId and phase.id on every launch independently of the extracted pt fields. DEFENSIVE for the
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

// ---- Boundary-seat warning (#2545 part 3, ADR 0056) -------------------------------------------
// A task carries a boundary signal when a seat has the security lens or a Files entry names a
// migration, auth or Git path. The task needs at least one seat that resolves to opus or above:
// the seat's own model, else its tier (agents.auditor.high for tier 'high', else agents.auditor.low,
// else the base auditor model, as spawnSeat resolves it, with a high tier below the base lifted to the base). A warning, never a refusal: the Lead's
// judgment sets the class. Returns one line per such task.
const BOUNDARY_PATH = /migrat|(^|[/._-])(un)?o?auth(?!or(s|ed|ing|ship)?([/._-]|$))|(^|[/._-])git([/._-]|modules|attributes|ignore|$)/
// CAMEL_AUTH and CAMEL_GIT read the original-case path, so userAuth.ts, MyOAuth.ts, GitService.ts and
// gitClient.js carry the signal too. GitHub names are not Git paths.
const CAMEL_AUTH = /[a-z0-9O]Auth(?!or(s|ed|ing|ship)?([^a-z]|$))/
const CAMEL_GIT = /(^|[^A-Za-z]|[a-z0-9])Git(?!Hub)([^a-z]|$)|(^|[^A-Za-z])git(?!Hub)[A-Z]/
export function boundaryWarnings (args) {
  const a = (args && args.agents && args.agents.auditor) || {}
  const rank = m => MODEL_RANK.indexOf(m)
  const base = a.model || DEFAULTS.agents.auditor.model, high = (a.high || {}).model || DEFAULTS.agents.auditor.high.model
  const seatModel = s => s.model || (s.tier === 'high' ? (rank(high) < rank(base) ? base : high) : (a.low || {}).model || base)
  const strong = m => rank(m) >= rank('opus')
  const out = []
  for (const t of (args && Array.isArray(args.tasks) ? args.tasks : [])) {
    const seats = (t && Array.isArray(t.roster) ? t.roster : []).filter(s => s && typeof s === 'object')
    const signals = [
      ...(seats.some(s => s.lens === 'security') ? ['a security seat'] : []),
      ...(t && Array.isArray(t.files) ? t.files : []).filter(p => typeof p === 'string' && (BOUNDARY_PATH.test(p.toLowerCase()) || CAMEL_AUTH.test(p) || CAMEL_GIT.test(p))),
    ]
    if (signals.length && !seats.some(s => strong(seatModel(s)))) {
      out.push(`task ${(t && t.id) ?? '?'} has a boundary signal (${signals.join(', ')}) and no seat resolves to opus or above — give a boundary-heavy seat tier 'high' (ADR 0056)`)
    }
  }
  return out
}

// A preflight tooling error (exit 2): the check could not run, so it is never a floor status.
export class PreflightToolingError extends Error {}

// ---- Provenance mirror (#1896, PIN-1, PIN-2) -------------------------------------------------
// The preflight runs the template's OWN provenance floor code, never a copy of its rules. The two
// D1 marker lines bound the slice; every line is matched with leading whitespace ignored, because
// the staged form strips the indent of every top-level code line. The slice runs in `new Function`
// with `A` (the parsed args) and `log` (a collector) after FLOOR_BINDINGS, the template's binding
// lines for the module-level names the slice reads.
export const FLOOR_MARKERS = ['const provenanceProblems = []', 'if (provenanceProblems.length) throw']
// One entry per physical line, leading whitespace stripped (PIN-12). A later plan that hoists a name
// the slice reads to module level adds that binding line here, in the same commit as the hoist.
export const FLOOR_BINDINGS = [
  'const { phase: ph, plan, tasks, learningsTarget, agents = {}, audit = {}, run = {} } = A',
  "const intent = (typeof A.intent === 'string' && A.intent) ? A.intent : null",
  'const backstops = Array.isArray(A.backstops) ? A.backstops : null',
  'const adjudications = Array.isArray(A.adjudications)',
  "? A.adjudications.filter(r => r && (typeof r === 'string' || typeof r === 'object')) : []",
  'const planSlug = A.planSlug',
]
// Returns { problems, logs }: the template's refusal messages (empty on pass) and its logged lines.
// The slice ends BEFORE the floor's throw line and returns provenanceProblems, so any throw that
// escapes it (a ReferenceError on an unbound name, a TypeError) is foreign, never the floor's own
// refusal. Missing markers, a missing binding line, an uncompilable slice, a foreign throw and a
// non-array slice result each throw PreflightToolingError naming the cause.
export function provenanceProblems (source, args) {
  const lines = String(source).split(/\r?\n/)
  const bare = lines.map(l => l.replace(/^[ \t]+/, ''))
  const from = bare.findIndex(l => l.trimEnd() === FLOOR_MARKERS[0])
  const to = from === -1 ? -1 : bare.findIndex((l, i) => i > from && l.startsWith(FLOOR_MARKERS[1]))
  if (from === -1 || to === -1) {
    throw new PreflightToolingError(`template has no provenance floor slice — marker line ${JSON.stringify(from === -1 ? FLOOR_MARKERS[0] : FLOOR_MARKERS[1])} not found`)
  }
  for (const b of FLOOR_BINDINGS) {
    if (!bare.includes(b)) throw new PreflightToolingError(`template binding line not found (FLOOR_BINDINGS drift): ${JSON.stringify(b)}`)
  }
  let fn
  try {
    fn = new Function('A', 'log', [...FLOOR_BINDINGS, ...lines.slice(from, to), 'return provenanceProblems'].join('\n'))
  } catch (err) {
    throw new PreflightToolingError(`provenance floor slice does not compile: ${err && err.name}: ${err && err.message}`)
  }
  const logs = []
  let problems
  try {
    problems = fn(args, m => { logs.push(String(m)) })
  } catch (err) {
    throw new PreflightToolingError(`provenance floor slice threw ${err && err.name}: ${err && err.message} — a name the slice reads is unbound (add its line to FLOOR_BINDINGS) or the slice changed shape`)
  }
  if (!Array.isArray(problems)) throw new PreflightToolingError('provenance floor slice did not yield its refusal list')
  return { problems: problems.map(String), logs }
}

// ---- Command shapes (#2674, #2675, PIN-16, PIN-17) --------------------------------------------
const NONE_ARM = /^\s*None\b/i
const isStr = v => typeof v === 'string' && v !== ''
// Each phase.endState object row's `check` and each string tasks[].doneWhen must parse as shell
// (`bash -n`, A21); a doneWhen in the plan's no-command arm (`None — <basis>`) must be staged null.
// Returns the problem lines; a bash spawn failure throws PreflightToolingError.
export function checkCommandShapes (args) {
  const a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
  const rows = (a.phase && typeof a.phase === 'object' && Array.isArray(a.phase.endState)) ? a.phase.endState : []
  const tasks = Array.isArray(a.tasks) ? a.tasks : []
  const out = []
  let dir = null
  let k = 0
  const parseError = cmd => {
    if (!dir) dir = mkdtempSync(join(tmpdir(), 'aac-shape-'))
    const f = join(dir, `cmd-${k++}.sh`)
    writeFileSync(f, cmd + '\n')
    const r = spawnSync('bash', ['-n', f], { encoding: 'utf8' })
    if (r.error) throw new PreflightToolingError(`cannot run bash -n: ${r.error.message}`)
    if (r.status === 0) return null
    const first = String(r.stderr || '').split('\n').find(l => l.trim()) || `bash -n exited ${r.status ?? r.signal}`
    return first.split(f + ': ').join('')
  }
  try {
    rows.forEach((row, n) => {
      if (!row || typeof row !== 'object' || !isStr(row.check)) return
      const e = parseError(row.check)
      if (e !== null) out.push(`phase.endState[${n + 1}].check does not parse as shell: ${e}`)
    })
    for (const t of tasks) {
      if (!t || !isStr(t.doneWhen)) continue
      const id = t.id ?? '?'
      if (NONE_ARM.test(t.doneWhen)) { out.push(`tasks[${id}].doneWhen is the plan's no-command arm (None — …) — stage doneWhen: null, never the prose`); continue }
      const e = parseError(t.doneWhen)
      if (e !== null) out.push(`tasks[${id}].doneWhen does not parse as shell: ${e}`)
    }
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
  return out
}

// ---- Done-when text compare (#2717, PIN-19) ---------------------------------------------------
// Every `- Done when:` bullet by the skills/war/SKILL.md intake rule: the text after the key, soft-
// wrapped physical lines joined with single spaces until the next `- ` bullet or a blank line, and,
// when the text opens with a backtick run, the body of that code span (a run of N backticks closes
// at the next run of exactly N, CommonMark's one padding space stripped from each end; prose after
// the span is dropped), else the whole text.
export function planDoneWhenBullets (planText) {
  const lines = String(planText).split(/\r?\n/)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*- Done when:(.*)$/)
    if (!m) continue
    let text = m[1].trim()
    for (let j = i + 1; j < lines.length && lines[j].trim() !== '' && !/^\s*- /.test(lines[j]); j++) text += ' ' + lines[j].trim()
    // A key line with nothing after the key leaves a leading join space, so trim before the span test.
    text = text.trim()
    const open = text.match(/^`+/)
    if (open) {
      const n = open[0].length
      const re = /`+/g
      re.lastIndex = n
      let close
      while ((close = re.exec(text)) && close[0].length !== n);
      if (close) {
        let body = text.slice(n, close.index)
        if (body.length > 1 && body.startsWith(' ') && body.endsWith(' ') && body.trim() !== '') body = body.slice(1, -1)
        text = body
      }
    }
    out.push(text)
  }
  return out
}

// Each string tasks[].doneWhen outside the None arm must equal one bullet byte for byte. Returns
// the problem lines; the nearest bullet is the one with the longest shared byte prefix.
export function checkDoneWhenText (args, bullets) {
  const a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
  const planFile = (a.plan && typeof a.plan === 'object' && a.plan.file) || '<plan.file>'
  const plan = (bullets || []).map(b => Buffer.from(b, 'utf8'))
  const out = []
  for (const t of (Array.isArray(a.tasks) ? a.tasks : [])) {
    if (!t || !isStr(t.doneWhen) || NONE_ARM.test(t.doneWhen)) continue
    const staged = Buffer.from(t.doneWhen, 'utf8')
    if (plan.some(b => b.equals(staged))) continue
    const head = `tasks[${t.id ?? '?'}].doneWhen equals no Done when bullet of ${planFile} byte for byte`
    const tail = 're-extract the command with its whitespace kept, never hand-edit the staged string'
    if (!plan.length) { out.push(`${head} — the plan has no Done when bullet; ${tail}`); continue }
    const shared = b => { let i = 0; while (i < b.length && i < staged.length && b[i] === staged[i]) i++; return i }
    let best = plan[0]
    for (const b of plan) if (shared(b) > shared(best)) best = b
    const at = shared(best)
    const cut = b => JSON.stringify(b.subarray(Math.max(0, at - 20), at + 20).toString('utf8'))
    out.push(`${head} — differs at byte ${at} from the nearest bullet (staged: ${cut(staged)}, plan: ${cut(best)}); ${tail}`)
  }
  return out
}

// One remedy clause per refused surface, keyed by the template's own refusal wording. A foreign
// stamp or a foreign docs/plans id is a cross-plan leak: the row is dropped, never restamped.
// An own-token miss is stamped by the surface's own field: planFile on backstops and
// adjudications, planSlug on ruledAsks, seededPhaseClose and seededTasks; intent has no row to
// stamp, so its text is fixed at its source.
const SLUG_STAMPED = new Set(['ruledAsks', 'seededPhaseClose', 'seededTasks'])
export function provenanceRemedies (problems, args) {
  const a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
  const file = (a.plan && typeof a.plan === 'object' && isStr(a.plan.file)) ? a.plan.file : '<plan.file>'
  // No planSlug: the template anchors planSlug stamps on the plan.file basename without .md.
  const slug = isStr(a.planSlug) ? a.planSlug
    : isStr(a.plan && a.plan.file) ? a.plan.file.replace(/^.*\//, '').replace(/\.md$/i, '') : 'the run plan slug'
  const out = []
  for (const p of problems || []) {
    const name = (/^workflow-template: args\.(\w+) /.exec(p) || [])[1] || '?'
    let clause
    if (/provenance stamp naming a foreign plan|foreign docs\/plans identifier/.test(p)) clause = `drop the foreign args.${name} row, never restamp it with this run's plan`
    else if (name === 'intent') clause = 'fix the args.intent text so it names this run\'s plan'
    else if (SLUG_STAMPED.has(name)) clause = `set each refused args.${name} row's planSlug field to ${slug}`
    else clause = `stamp each refused args.${name} row with planFile: ${file}`
    if (!out.includes(clause)) out.push(clause)
  }
  return out
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
  let priorManifest = null
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i]
    if (tok === '--template') {
      if (!argv[i + 1]) { process.stderr.write('assert-args-complete: --template needs a path\n'); process.exit(2) }
      templatePath = argv[++i]
    } else if (tok === '--prior-manifest') {
      if (!argv[i + 1]) { process.stderr.write('assert-args-complete: --prior-manifest needs a path\n'); process.exit(2) }
      priorManifest = argv[++i]
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
  // Plugin identity floor (#2495, D10): a sanctioned recovery relaunch runs from the plugin root and
  // version of the launch it recovers. The running root is this script's own location, never an
  // environment variable; the manifest is read only on a sanctioned recovery with the flag passed.
  if (priorManifest !== null && parsed.recovery && typeof parsed.recovery === 'object' && parsed.recovery.sanctioned === true) {
    const assetsDir = dirname(realpathSync(fileURLToPath(import.meta.url))) // <root>/skills/war/assets
    const root = dirname(dirname(dirname(assetsDir)))
    let version
    try {
      version = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version
    } catch (err) {
      process.stderr.write(`assert-args-complete: cannot read the running plugin version from ${join(root, '.claude-plugin', 'plugin.json')}: ${err.message}\n`); process.exit(2)
    }
    let manifest
    try {
      manifest = JSON.parse(readFileSync(priorManifest, 'utf8'))
    } catch (err) {
      process.stderr.write(`assert-args-complete: cannot read the prior manifest ${priorManifest}: ${err.message}\n`); process.exit(2)
    }
    if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
      process.stderr.write(`assert-args-complete: the prior manifest ${priorManifest} is not a JSON object\n`); process.exit(2)
    }
    const absent = v => v === undefined || v === null
    const mismatches = []
    if (absent(manifest.pluginRoot)) {
      process.stderr.write('assert-args-complete: warning: the prior manifest has no pluginRoot — the plugin root is not compared; the relaunch proceeds from the current root\n')
    } else {
      let prior = String(manifest.pluginRoot)
      // realpathSync('') resolves to the cwd, so an empty root skips it and compares as written.
      if (prior !== '') try { prior = realpathSync(prior) } catch { /* an unresolvable prior root compares as written, and so mismatches */ }
      if (prior !== root) mismatches.push(`plugin root: prior run ${prior}, this run ${root}`)
    }
    if (absent(manifest.pluginVersion)) {
      process.stderr.write('assert-args-complete: warning: the prior manifest has no pluginVersion — the plugin version is not compared; the relaunch proceeds from the current version\n')
    } else if (String(manifest.pluginVersion) !== String(version)) {
      mismatches.push(`plugin version: prior run ${manifest.pluginVersion}, this run ${version}`)
    }
    if (mismatches.length) {
      process.stderr.write(`assert-args-complete: a sanctioned recovery relaunch must run from the plugin root and version of the launch it recovers (${priorManifest}):\n`)
      for (const line of mismatches) process.stderr.write(`  - ${line}\n`)
      const priorRoot = absent(manifest.pluginRoot) ? root : String(manifest.pluginRoot)
      process.stderr.write(`assert-args-complete: relaunch from the prior plugin with claude --plugin-dir ${priorRoot}${absent(manifest.pluginVersion) ? '' : ` (it must carry version ${manifest.pluginVersion})`}, never recover an in-flight run on another engine\n`)
      process.exit(1)
    }
  }
  const fields = extractArgsFields(src)
  if (fields.length === 0) {
    // Vacuous-pass guard: a READABLE but wrong template source (empty file, non-template JS)
    // extracts zero fields, and certifying against zero requirements would be a silent floor
    // pass. That is a tooling error (exit 2), never a floor status.
    process.stderr.write(`assert-args-complete: template ${templatePath} yielded ZERO fallback-free interpolations — wrong template source? refusing to certify\n`)
    process.exit(2)
  }
  for (const line of boundaryWarnings(parsed)) process.stderr.write(`assert-args-complete: warning: ${line}\n`)
  const missing = checkArgs(fields, parsed)
  if (missing.length) {
    process.stderr.write(`assert-args-complete: launch args are dispatch-INCOMPLETE (${missing.length} missing field(s)):\n`)
    for (const line of missing) process.stderr.write(`  - ${line}\n`)
    process.exit(1)
  }
  const tooling = err => {
    process.stderr.write(`assert-args-complete: ${err instanceof PreflightToolingError ? '' : 'unexpected error: '}${(err && err.message) || err}\n`)
    process.exit(2)
  }
  let shapes
  try { shapes = checkCommandShapes(parsed) } catch (err) { tooling(err) }
  if (shapes.length) {
    process.stderr.write(`assert-args-complete: ${shapes.length} staged command(s) cannot run as staged:\n`)
    for (const line of shapes) process.stderr.write(`  - ${line}\n`)
    process.exit(1)
  }
  // The Done-when compare reads plan.file only when some task stages a command string.
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : []
  if (tasks.some(t => t && isStr(t.doneWhen) && !NONE_ARM.test(t.doneWhen))) {
    const file = parsed.plan && typeof parsed.plan === 'object' ? parsed.plan.file : undefined
    if (!isStr(file)) tooling(new PreflightToolingError('a task stages a doneWhen string but plan.file is absent — cannot read the plan Done when bullets'))
    const planPath = (isStr(parsed.mainCheckout) && isAbsolute(parsed.mainCheckout)) ? resolve(parsed.mainCheckout, file) : resolve(file)
    let planText
    try { planText = readFileSync(planPath, 'utf8') } catch (err) { tooling(new PreflightToolingError(`cannot read plan ${planPath} for the Done when compare: ${err.message}`)) }
    const drift = checkDoneWhenText(parsed, planDoneWhenBullets(planText))
    if (drift.length) {
      process.stderr.write(`assert-args-complete: ${drift.length} staged doneWhen string(s) differ from the plan:\n`)
      for (const line of drift) process.stderr.write(`  - ${line}\n`)
      process.exit(1)
    }
  }
  let prov
  try { prov = provenanceProblems(src, parsed) } catch (err) { tooling(err) }
  for (const line of prov.logs) process.stderr.write(`assert-args-complete: floor log: ${line}\n`)
  if (prov.problems.length) {
    process.stderr.write(`assert-args-complete: the template's provenance floor refuses these args (${prov.problems.length} refusal(s)):\n`)
    for (const line of prov.problems) process.stderr.write(`${line}\n`)
    process.stderr.write(`assert-args-complete: fix each refused row at its ledger source (the record the Lead assembles the args from), not the launch copy — ${provenanceRemedies(prov.problems, parsed).join('; ')} — a patched launch copy is lost at the next assembly\n`)
    process.exit(1)
  }
  // Scope the claim to what was proven: the fallback-free prompt interpolations, the command
  // shapes, the Done-when text and the provenance floor — the template's other entry validation
  // (fallback-guarded required fields like plan.file / tasks[].planSlice) still applies at dispatch.
  process.stdout.write('assert-args-complete: launch args are dispatch-complete — every fallback-free prompt interpolation is supplied, every staged check and doneWhen parses, each staged doneWhen string equals its plan bullet, and the provenance floor passes (template entry validation still applies); dispatch the parsed object as the Workflow args, or no args over an --args staged script, never a file path string (the template cannot read a file and refuses a non-JSON string at entry with 0 agents)\n')
  process.exit(0)
}
