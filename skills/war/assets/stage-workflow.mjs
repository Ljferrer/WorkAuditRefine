#!/usr/bin/env node
// Stage a run-scoped, per-phase copy of workflow-template.js with operator-meaningful dispatch
// identity (ADR 0037). The harness renders the /workflows title from the dispatched script's
// BASENAME and the description from meta.description — so both are substituted HERE, pre-dispatch,
// as pure literals (the Workflow sandbox has no shell/fs; runtime values are deferred to agents,
// never computed by the template body). Node stdlib only (node:fs, node:path, node:url).
//
// CLI: node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId> [campaignOrdinal] [--force]
//   Writes <stagedDir>/war-[c<K>-]<planSlug>-p<N>.js, prints its ABSOLUTE path, exits 0.
//   Write-if-absent: an existing staged file IS the run's script — it may carry approved injected
//   stages, and a journal replay must see identical bytes even across a mid-run plugin upgrade — so
//   it is left byte-untouched, its path printed, exit 0. A deliberate restage passes --force (the
//   only path that overwrites an existing staged file, from a fresh substitution of the current
//   shipped template).
//   Fail-loud: a missing OR duplicated meta anchor exits NON-ZERO with a named error (never a
//   silent fork).

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

const USAGE = 'usage: node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId> [campaignOrdinal] [--force]'

function main(argv) {
  const rest = argv.slice(2)
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
  if (fs.existsSync(stagedPath) && !force) {
    process.stdout.write(stagedPath + '\n')
    process.exit(0)
  }

  const template = fs.readFileSync(templatePath, 'utf8')
  let staged
  try {
    staged = replaceExactlyOnce(template, NAME_ANCHOR, `name: '${deriveName(planSlug, phaseId, campaignOrdinal)}'`, 'name')
    staged = replaceExactlyOnce(staged, DESCRIPTION_ANCHOR, deriveDescription(planSlug, phaseId, campaignOrdinal), 'description')
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
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv)
}
