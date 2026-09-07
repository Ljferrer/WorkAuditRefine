#!/usr/bin/env node
// Stage a run-scoped, per-phase copy of workflow-template.js with operator-meaningful dispatch
// identity (ADR 0037). The harness renders the /workflows title from the dispatched script's
// BASENAME and the description from meta.description — so both are substituted HERE, pre-dispatch,
// as pure literals (the Workflow sandbox has no shell/fs; runtime values are deferred to agents,
// never computed by the template body). Node stdlib only (node:fs, node:path, node:url).
//
// CLI: node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId> [campaignOrdinal] [--force] [--args <file>]
//   Writes <stagedDir>/war-[c<K>-]<planSlug>-p<N>.js, prints its ABSOLUTE path, exits 0.
//   --force is a bare boolean flag. --args takes its value as a SEPARATE following token
//   (--args <file>), never attached (--args=<file>): the file is read, JSON-parsed and required to be
//   a non-null, non-array object BEFORE any write, then embedded in the staged copy as the
//   absent-args fallback, so an assembled phase-args payload too large to ride the Workflow tool
//   call can travel with the script instead. Dispatched args, when passed, always win.
//   Write-if-absent: an existing staged file IS the run's script — it may carry approved injected
//   stages, and a journal replay must see identical bytes even across a mid-run plugin upgrade — so
//   it is left byte-untouched, its path printed, exit 0 (with --args, one stderr warning that the
//   flag was ignored). A deliberate restage passes --force (the only path that overwrites an
//   existing staged file, from a fresh comment-stripped substitution of the current shipped
//   template) — that is also how changed args are re-embedded. An existing file over the scriptPath
//   cap is the one reuse refused: it cannot dispatch, so the stager exits non-zero naming --force.
//   Fail-loud: a missing OR duplicated anchor exits NON-ZERO with a named error (never a silent
//   fork).
//   Comment strip (#2099): step (0) of every stage blanks the shipped template's full-line code
//   comments out of the staged copy (contract and mechanics: stripFullLineComments below). The
//   Workflow tool refuses a scriptPath over SCRIPT_BYTE_CAP bytes, and the shipped template alone
//   crossed it at 0.21.11 (measured 525,209 bytes on 2026-09-06) — so a staged copy that would still
//   exceed the cap after the strip exits NON-ZERO with a named error and writes nothing.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The two meta anchors substituted per phase. THIS is the single authoritative copy — the
// anchor-guard test in stage-workflow.test.mjs imports these constants (never a second hardcoded
// set) and asserts each occurs exactly once in the shipped template. Canonical source of the bytes:
// the `export const meta` block at the top of workflow-template.js (meta.name / meta.description).
// Change a byte in that block and you must change it here in lock-step, or the imported-constant
// anchor guard goes red (it is the arbiter).
export const NAME_ANCHOR = "name: 'war-phase'"
export const DESCRIPTION_ANCHOR = 'WAR per-phase execution: Work, Audit, Refine, Land, then Wrap-up learnings for one phase.'

// The template's string-arm args fallback tail — the object arm of the D8-guarded `const A =` ternary
// in workflow-template.js. Substituted ONLY under --args, so a staged copy falls back to its embedded
// payload instead of an empty object. Canonical source of the bytes: the `const A =` ternary's
// args-fallback tail in workflow-template.js; this constant is the hand-maintained mirror site that
// the imported-constant anchor guard in stage-workflow.test.mjs arbitrates (per ADR 0037's
// Correction (2026-08-02, #1240) note). Same mirror discipline as the two meta anchors above: this
// is the single authoritative copy ONLY in the in-suite sense — the one anchor constant the test
// imports (never a second hardcoded set), not a claim of canonicality over the template's tail.
// workflow-template.js carries the matching REFERENTIAL coupling comment beside the ternary (naming
// this constant, never restating these bytes).
export const ARGS_FALLBACK_ANCHOR = ': (args || {})'

// The Workflow tool's scriptPath cap ("Workflow script file … exceeds 524288 bytes"), measured live
// 2026-09-06 (#2099). A staged copy at or under it dispatches; over it, the tool refuses before entry
// validation runs.
export const SCRIPT_BYTE_CAP = 524288

// Blank out every full-line `//` comment that sits in CODE state — a line whose first non-blank bytes
// are `//` and that is not inside a string, a template literal (any `${…}` nesting), a regex literal
// or a block comment. Each stripped line becomes an empty line, so the staged copy keeps the shipped
// template's line count (an --args stage then adds its two prelude lines after `meta`). Nothing else
// moves: trailing comments, block comments and every non-comment byte pass through verbatim, and the
// strip is idempotent. The scanner is adapted from the comment/string-skipping loop of
// extractTopLevelTemplateLiterals in prompt-surface-budgets.test.mjs, with three deliberate
// divergences: (1) the line-comment arm records a drop range instead of consuming the line; (2) the
// string arm also stops at a newline, so a stray quote can never swallow the rest of the file; (3) a
// regex-literal arm — a `/` that opens an expression (after `(`, `,`, `=`, `:`, `[`, `!`, `&`, `|`,
// `?`, `{`, `}`, `;`, an operator, or one of the REGEX_AFTER_WORD keywords such as `return`) reads to
// its closing `/`, honouring `\` escapes and `[…]` classes; a `/` after an operand — an identifier,
// a number, a closing `)`/`]`, or a postfix `++`/`--` (the operator set is checked against the char
// BEFORE lastSig for those two) — is division and passes through. Every string, regex and comment arm
// is line-local: it stops at the newline and never consumes it. One misread is known: a `/` after a
// closing `}` is read as a regex (an object literal divided is not real code). A misread of that shape
// skips the rest of its line, so a template opener on that same line is missed and a `//`-led line
// inside that template can be blanked; the nesting throw below catches the desync only when the
// residual backtick count is odd. stage-workflow.test.mjs arm (p) is the arbiter — one fixture line
// per arm, each proven red under that arm's deletion, and a prompt-byte oracle over the shipped
// template's pt spans.
const REGEX_AFTER_WORD = new Set(['return', 'case', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'yield', 'await', 'do', 'else', 'throw'])
const REGEX_AFTER_SIG = '(,=:[!&|?{};+-*%<>~^'
export function stripFullLineComments(src) {
  const n = src.length
  const stack = [{ type: 'code' }] // 'code' | 'template'; a code frame with interp:true is a ${…} body
  const drop = [] // [start, end) byte ranges of the comment text to blank
  let lastSig = '' // last significant (non-blank, non-comment) code char — the regex/division tie-break
  let prevSig = '' // the significant char before lastSig — tells a postfix `x++` from a binary `a +`
  let lastWord = '' // the identifier or keyword those chars spell, '' after any non-word char
  let i = 0
  while (i < n) {
    const ctx = stack[stack.length - 1]
    const c = src[i]
    const c2 = src[i + 1]
    if (ctx.type === 'code') {
      if (c === '/' && c2 === '/') {
        const nl = src.indexOf('\n', i)
        const end = nl === -1 ? n : nl
        const ls = src.lastIndexOf('\n', i - 1) + 1
        if (src.slice(ls, i).trim() === '') drop.push([ls, end])
        i = end
        continue
      }
      if (c === '/' && c2 === '*') {
        const close = src.indexOf('*/', i + 2)
        i = close === -1 ? n : close + 2
        continue
      }
      if (c === "'" || c === '"') {
        let j = i + 1
        while (j < n && src[j] !== c && src[j] !== '\n') {
          if (src[j] === '\\') j++
          j++
        }
        i = j < n && src[j] === '\n' ? j : j + 1 // line-local: an unterminated string stops AT the newline
        lastSig = c
        prevSig = ''
        lastWord = ''
        continue
      }
      const postfix = (lastSig === '+' || lastSig === '-') && prevSig === lastSig
      if (c === '/' && (lastSig === '' || (REGEX_AFTER_SIG.includes(lastSig) && !postfix) || REGEX_AFTER_WORD.has(lastWord))) {
        let j = i + 1
        let inClass = false
        while (j < n && src[j] !== '\n') {
          const d = src[j]
          if (d === '\\') { j += 2; continue }
          if (inClass) { if (d === ']') inClass = false } else if (d === '[') inClass = true
          else if (d === '/') break
          j++
        }
        i = j < n && src[j] === '\n' ? j : j + 1 // line-local: an unterminated regex stops AT the newline
        while (i < n && /[a-z]/.test(src[i])) i++ // flags
        prevSig = lastSig
        lastSig = '/'
        lastWord = ''
        continue
      }
      if (c === '`') {
        stack.push({ type: 'template' })
        i++
        continue
      }
      if (ctx.interp) {
        if (c === '{') ctx.depth++
        else if (c === '}') {
          if (ctx.depth === 0) {
            stack.pop()
            i++
            continue
          }
          ctx.depth--
        }
      }
      if (!/\s/.test(c)) {
        prevSig = lastSig
        lastSig = c
        lastWord = /[\w$]/.test(c) ? lastWord + c : ''
      }
      i++
      continue
    }
    // template context
    if (c === '\\') { i += 2; continue }
    if (c === '`') { stack.pop(); prevSig = lastSig; lastSig = '`'; lastWord = ''; i++; continue }
    if (c === '$' && c2 === '{') {
      stack.push({ type: 'code', interp: true, depth: 0 })
      prevSig = lastSig
      lastSig = '{'
      lastWord = ''
      i += 2
      continue
    }
    i++
  }
  if (stack.length !== 1) {
    throw new Error('stage-workflow: comment strip lost track of a string/template nesting — refusing to stage')
  }
  let out = ''
  let at = 0
  for (const [s, e] of drop) { out += src.slice(at, s); at = e }
  return out + src.slice(at)
}

// war-[c<K>-]<planSlug>-p<N>. planSlug passes through VERBATIM (long dated basenames accepted — UI
// truncation beats lossy shortening; it is the same token branch names derive from). The staged
// basename is this + '.js'; meta.name is this exactly. The title format lives ONLY in this function
// and deriveDescription — nowhere else.
export function deriveName(planSlug, phaseId, campaignOrdinal) {
  const c = campaignOrdinal == null || campaignOrdinal === '' ? '' : `c${campaignOrdinal}-`
  return `war-${c}${planSlug}-p${phaseId}`
}

// WAR phase <N> of <planSlug>[ (campaign plan <K>)]: Work, Audit, Refine, Land, then Wrap-up learnings.
export function deriveDescription(planSlug, phaseId, campaignOrdinal) {
  const c = campaignOrdinal == null || campaignOrdinal === '' ? '' : ` (campaign plan ${campaignOrdinal})`
  return `WAR phase ${phaseId} of ${planSlug}${c}: Work, Audit, Refine, Land, then Wrap-up learnings.`
}

// Replace the single occurrence of `anchor` with `replacement`. Exactly-once or throw (fail-loud):
// zero ⇒ the template lost the anchor; ≥2 ⇒ an ambiguous fork (e.g. a careless trailing or block
// coupling comment restated the anchor bytes — a full-line `//` comment is stripped in step (0)
// before this count runs, so the raw-source arbiter for that case is test (f) in
// stage-workflow.test.mjs). split/join (not String.prototype.replace) so a `$` in `replacement`
// stays inert.
function replaceExactlyOnce(text, anchor, replacement, label) {
  const parts = text.split(anchor)
  const count = parts.length - 1
  if (count !== 1) {
    throw new Error(`stage-workflow: expected exactly one ${label} anchor in template, found ${count}`)
  }
  return parts.join(replacement)
}

// The `export const meta = { … }` statement, terminated at the first column-0 `}` line that closes it.
// The payload prelude is inserted immediately AFTER this statement — NEVER prepended: the Workflow
// tool refuses a script whose first STATEMENT is not `export const meta` ("Invalid workflow script:
// … must be the FIRST statement in the script"), dying before any agent is dispatched. A leading
// *comment* is fine (the shipped template already opens with one); a leading `const` is not.
// Reproduced live 2026-07-27 while hand-embedding args into a staged copy.
// ponytail: line-anchored, string-blind by construction — meta is a fixed { name, description,
// phases } shape with no column-0 `}` inside it; no match throws a named error (fail-loud), never a
// silent mis-insertion.
const META_STATEMENT = /^export const meta\s*=\s*\{[\s\S]*?^\}$/m

// Step (3) of the substitution order: inject the payload LAST, after every exactly-once count has
// already run, so an args payload that quotes any anchor's bytes cannot fork the stage. JSON.stringify
// output is valid JS source as-is (ES2019's JSON-superset grammar admits raw U+2028/U+2029 in string
// literals) — no re-escaping pass, and it never contains a literal newline, which keeps the prelude
// exactly two lines for the restore-roundtrip test.
function insertArgsPrelude(text, embedded) {
  const m = text.match(META_STATEMENT)
  if (!m) {
    throw new Error('stage-workflow: could not locate the `export const meta = { … }` statement to insert the embedded-args prelude after')
  }
  const at = m.index + m[0].length
  const prelude = '\n// Embedded phase args (stage-workflow.mjs --args) — the absent-args fallback; dispatched args always win.\n'
    + `const EMBEDDED_ARGS = ${JSON.stringify(embedded)}\n`
  return text.slice(0, at) + prelude + text.slice(at)
}

const USAGE = 'usage: node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId> [campaignOrdinal] [--force] [--args <file>]'

function main(argv) {
  const raw = argv.slice(2)
  // Peel `--args` AND its value out of the raw list BEFORE the `--force` filter and the positional
  // split: `--force` is bare (its peel drops one token), this one drops two. The value is the
  // immediately-following token VERBATIM, never re-interpreted — so `--args --force` takes `--force`
  // as the filename and dies loud at the named read error below rather than quietly staging
  // args-less. A missing value token, a repeated `--args`, or the attached `--args=<file>` form each
  // exit non-zero with the usage error BEFORE any write; without the attached-form guard that token
  // is not a flag to this parser at all — it survives the `--force` filter and binds to the 5th
  // positional (campaignOrdinal), staging an args-LESS script at exit 0 (the #1134 incident shape).
  // ACCEPTED RESIDUAL: an unrelated typo'd flag is still absorbed into campaignOrdinal — a general
  // unknown-flag guard is deliberately out of scope here.
  const at = raw.indexOf('--args')
  const argsFile = at === -1 ? null : raw[at + 1]
  const rest = at === -1 ? raw : raw.slice(0, at).concat(raw.slice(at + 2))
  const flagError = at !== -1 && argsFile === undefined ? '--args requires a following <file> token'
    : rest.includes('--args') ? 'repeated --args'
    : rest.some((a) => a.startsWith('--args=')) ? '--args takes its value as a separate following token (--args <file>), not attached'
    : null
  if (flagError) {
    process.stderr.write(`stage-workflow: ${flagError}\n` + USAGE + '\n')
    process.exit(1)
  }
  const force = rest.includes('--force')
  const positional = rest.filter((a) => a !== '--force')
  const [templatePath, stagedDir, planSlug, phaseId, campaignOrdinal] = positional
  if (!templatePath || !stagedDir || !planSlug || phaseId == null || phaseId === '') {
    process.stderr.write('stage-workflow: missing required argument\n' + USAGE + '\n')
    process.exit(1)
  }

  const basename = deriveName(planSlug, phaseId, campaignOrdinal) + '.js'
  const stagedPath = path.resolve(stagedDir, basename)

  // Write-if-absent: an existing staged file is the run's script — never clobber it without --force.
  // It short-circuits BEFORE any --args processing, exactly as before; the only addition is one
  // stderr warning so an operator who believes they just re-embedded is told otherwise. Exit code and
  // stdout stay byte-unchanged — a resume re-running the same stage command sees an accurate,
  // harmless warning, never an error.
  if (fs.existsSync(stagedPath) && !force) {
    // An existing file over the cap (a pre-#2099 stage, or a hand-inflated copy) can never dispatch,
    // so reusing it would only move the failure to the Workflow tool's own error. Refuse, naming the
    // remedy; the file stays byte-untouched — losing its injected stages, and byte identity with any
    // journal recorded against it, is the operator's call. A stat failure between existsSync and
    // here is a named error too (fail-closed), never a raw stack trace or a silent reuse.
    let existingBytes
    try {
      existingBytes = fs.statSync(stagedPath).size
    } catch (err) {
      process.stderr.write(`stage-workflow: cannot stat existing staged file ${stagedPath}: ${(err && err.message) || err}\n`)
      process.exit(1)
    }
    if (existingBytes > SCRIPT_BYTE_CAP) {
      process.stderr.write(`stage-workflow: existing staged file ${stagedPath} is ${existingBytes} bytes, over the Workflow tool's ${SCRIPT_BYTE_CAP}-byte scriptPath cap — it cannot dispatch; restage it with --force (a fresh, comment-stripped substitution: any injected stage in the old file is lost and must be re-applied, and a resumeFromRunId journal recorded against the old bytes no longer matches)\n`)
      process.exit(1)
    }
    if (argsFile !== null) {
      process.stderr.write('stage-workflow: existing staged file reused — --args ignored (pass --force to re-embed)\n')
    }
    process.stdout.write(stagedPath + '\n')
    process.exit(0)
  }

  // Validate BEFORE any write — the ADR 0034 predicate mirrored from the template's own entry guard
  // (a non-null, non-array object). A read failure, a parse failure, or a scalar/array/null result is
  // one named error on stderr and a non-zero exit with no staged file written.
  let embedded = null
  if (argsFile !== null) {
    const named = `--args file ${JSON.stringify(argsFile)}`
    let text
    try {
      text = fs.readFileSync(argsFile, 'utf8')
    } catch (err) {
      process.stderr.write(`stage-workflow: cannot read ${named}: ${(err && err.message) || err}\n`)
      process.exit(1)
    }
    try {
      embedded = JSON.parse(text)
    } catch (err) {
      process.stderr.write(`stage-workflow: ${named} is not valid JSON: ${(err && err.message) || err}\n`)
      process.exit(1)
    }
    if (typeof embedded !== 'object' || embedded === null || Array.isArray(embedded)) {
      const got = embedded === null ? 'null' : Array.isArray(embedded) ? 'array' : typeof embedded
      process.stderr.write(`stage-workflow: ${named} must contain a JSON object, got ${got}\n`)
      process.exit(1)
    }
  }

  const template = fs.readFileSync(templatePath, 'utf8')
  let staged
  let strippedBytes = 0
  try {
    // Step (0): strip the full-line code comments FIRST, so the prelude's own comment line (step 3)
    // and every substituted literal survive untouched.
    staged = stripFullLineComments(template)
    strippedBytes = Buffer.byteLength(staged, 'utf8')
    staged = replaceExactlyOnce(staged, NAME_ANCHOR, `name: '${deriveName(planSlug, phaseId, campaignOrdinal)}'`, 'name')
    staged = replaceExactlyOnce(staged, DESCRIPTION_ANCHOR, deriveDescription(planSlug, phaseId, campaignOrdinal), 'description')
    // Steps (2)+(3), --args only: rewrite the fallback tail, THEN inject the payload. Without the
    // flag neither runs: the staged copy is the comment-stripped substitution with no prelude and
    // no fallback rewrite.
    if (embedded !== null) {
      staged = replaceExactlyOnce(staged, ARGS_FALLBACK_ANCHOR, ': (args || EMBEDDED_ARGS)', 'args fallback')
      staged = insertArgsPrelude(staged, embedded)
    }
  } catch (err) {
    process.stderr.write((err && err.message ? err.message : String(err)) + '\n')
    process.exit(1)
  }

  // Size floor (#2099): the Workflow tool refuses a scriptPath over SCRIPT_BYTE_CAP bytes, before
  // entry validation — so refuse HERE, with the two contributing sizes named as what they are (the
  // stripped template measured before substitution; the args payload alone — the remainder is the
  // substitution and prelude overhead), and write nothing. `bytes` is the UTF-8 length, which is what
  // writeFileSync writes, statSync reports on reuse, and the tool measures off disk.
  const bytes = Buffer.byteLength(staged, 'utf8')
  if (bytes > SCRIPT_BYTE_CAP) {
    const argsBytes = embedded === null ? 0 : Buffer.byteLength(JSON.stringify(embedded), 'utf8')
    process.stderr.write(`stage-workflow: staged script would be ${bytes} bytes, over the Workflow tool's ${SCRIPT_BYTE_CAP}-byte scriptPath cap (comment-stripped template ${strippedBytes} bytes; embedded args ${argsBytes} bytes; the rest is substitution and prelude overhead) — nothing written; slim the --args payload, or the template's code\n`)
    process.exit(1)
  }

  fs.mkdirSync(stagedDir, { recursive: true })
  fs.writeFileSync(stagedPath, staged)
  process.stdout.write(stagedPath + '\n')
  process.exit(0)
}

// Run as CLI only when invoked directly (not when imported by the test).
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main(process.argv)
}
