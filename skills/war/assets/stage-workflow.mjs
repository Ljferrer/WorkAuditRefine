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
//   existing staged file, from a fresh substitution of the current shipped template) — that is also
//   how changed args are re-embedded.
//   Fail-loud: a missing OR duplicated anchor exits NON-ZERO with a named error (never a silent
//   fork).

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
// payload instead of an empty object. Same mirror discipline as the two meta anchors above: this is
// the single authoritative copy, workflow-template.js carries the matching REFERENTIAL coupling
// comment beside the ternary (naming this constant, never restating these bytes), and the
// imported-constant anchor guard in stage-workflow.test.mjs is the arbiter of the pair.
export const ARGS_FALLBACK_ANCHOR = ': (args || {})'

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
// zero ⇒ the template lost the anchor; ≥2 ⇒ an ambiguous fork (e.g. a careless coupling comment
// restated the anchor bytes). split/join (not String.prototype.replace) so a `$` in `replacement`
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
  try {
    staged = replaceExactlyOnce(template, NAME_ANCHOR, `name: '${deriveName(planSlug, phaseId, campaignOrdinal)}'`, 'name')
    staged = replaceExactlyOnce(staged, DESCRIPTION_ANCHOR, deriveDescription(planSlug, phaseId, campaignOrdinal), 'description')
    // Steps (2)+(3), --args only: rewrite the fallback tail, THEN inject the payload. Without the
    // flag neither runs and the output is byte-identical to a stage predating this flag.
    if (embedded !== null) {
      staged = replaceExactlyOnce(staged, ARGS_FALLBACK_ANCHOR, ': (args || EMBEDDED_ARGS)', 'args fallback')
      staged = insertArgsPrelude(staged, embedded)
    }
  } catch (err) {
    process.stderr.write((err && err.message ? err.message : String(err)) + '\n')
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
