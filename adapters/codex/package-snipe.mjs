import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const FILES = [
  ['adapters/codex/skills/snipe/SKILL.md', 'skills/snipe/SKILL.md'],
  ['adapters/codex/skills/snipe/agents/openai.yaml', 'skills/snipe/agents/openai.yaml'],
  ['adapters/codex/skills/snipe/assets/snipe-request.mjs', 'skills/snipe/assets/snipe-request.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-result.mjs', 'skills/snipe/assets/snipe-result.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-runner.mjs', 'skills/snipe/assets/snipe-runner.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-submodules.mjs', 'skills/snipe/assets/snipe-submodules.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-process.mjs', 'skills/snipe/assets/snipe-process.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-files.mjs', 'skills/snipe/assets/snipe-files.mjs'],
  ['adapters/codex/skills/snipe/assets/snipe-git-policy.mjs', 'skills/snipe/assets/snipe-git-policy.mjs'],
  ['adapters/codex/skills/snipe/references/codex-auditor.md', 'skills/snipe/references/codex-auditor.md'],
  ['adapters/codex/skills/snipe/references/auditing-fixes.md', 'skills/snipe/references/auditing-fixes.md'],
  ['adapters/codex/skills/snipe/references/post-audit-fixes.md', 'skills/snipe/references/post-audit-fixes.md'],
  ['adapters/codex/skills/snipe/references/submodules.md', 'skills/snipe/references/submodules.md'],
  ['skills/snipe/assets/snipe-args.mjs', 'skills/snipe/assets/shared/skills/snipe/assets/snipe-args.mjs'],
  ['skills/war/assets/war-config.mjs', 'skills/snipe/assets/shared/skills/war/assets/war-config.mjs'],
  ['skills/_shared/provision.mjs', 'skills/snipe/assets/shared/skills/_shared/provision.mjs'],
]

const IMPORT_REWRITES = new Map([
  ['../../../../../skills/snipe/assets/snipe-args.mjs', './shared/skills/snipe/assets/snipe-args.mjs'],
  ['../../../../../skills/war/assets/war-config.mjs', './shared/skills/war/assets/war-config.mjs'],
])

function manifest(version) {
  return {
    name: 'work-audit-refine-snipe',
    version,
    description: 'Run an explicit, one-shot, read-only WAR-style audit through independent Codex lenses.',
    author: { name: 'Ljferrer', url: 'https://github.com/Ljferrer' },
    homepage: 'https://github.com/Ljferrer/WorkAuditRefine',
    repository: 'https://github.com/Ljferrer/WorkAuditRefine',
    license: 'MIT',
    keywords: ['code-review', 'audit', 'read-only', 'snipe'],
    skills: './skills/',
    interface: {
      displayName: 'WAR Snipe',
      shortDescription: 'Run independent read-only code audits',
      longDescription: 'Audit one pinned diff through one to five independent Codex lenses and return an informational report without changing code or external systems.',
      developerName: 'Ljferrer',
      category: 'Developer Tools',
      capabilities: ['Interactive', 'Read'],
      websiteURL: 'https://github.com/Ljferrer/WorkAuditRefine',
      defaultPrompt: 'Run $work-audit-refine-snipe:snipe to audit the current diff through independent read-only lenses.',
    },
  }
}

function inventory(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`package must not contain symlinks: ${relative(root, path)}`)
    return entry.isDirectory() ? inventory(root, path) : [relative(root, path).split(sep).join('/')]
  }).sort()
}

function requiredPaths() {
  return ['.codex-plugin/plugin.json', ...FILES.map(([, target]) => target)].sort()
}

export function verifySnipePlugin(root) {
  const packageRoot = resolve(root)
  const manifestPath = join(packageRoot, '.codex-plugin/plugin.json')
  if (!existsSync(manifestPath)) throw new Error('missing required package file: .codex-plugin/plugin.json')
  const config = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (config.skills !== './skills/') throw new Error("plugin skills must be './skills/'")
  if ('hooks' in config) throw new Error('Snipe plugin must not select hooks')
  for (const path of requiredPaths()) {
    const absolute = join(packageRoot, path)
    if (!existsSync(absolute) || !lstatSync(absolute).isFile()) throw new Error(`missing required package file: ${path}`)
  }
  const actual = inventory(packageRoot)
  const expected = requiredPaths()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('package contains an unexpected or missing component')
  return actual
}

export function buildSnipePlugin({ repoRoot, output }) {
  const sourceRoot = resolve(repoRoot)
  const packageRoot = resolve(output)
  if (existsSync(packageRoot)) throw new Error(`output already exists: ${packageRoot}`)
  for (const [source] of FILES) {
    const sourcePath = join(sourceRoot, source)
    if (!existsSync(sourcePath) || !lstatSync(sourcePath).isFile()) throw new Error(`missing source component: ${source}`)
  }
  const sourceVersion = JSON.parse(readFileSync(join(sourceRoot, '.claude-plugin/plugin.json'), 'utf8')).version
  mkdirSync(join(packageRoot, '.codex-plugin'), { recursive: true })
  writeFileSync(join(packageRoot, '.codex-plugin/plugin.json'), `${JSON.stringify(manifest(sourceVersion), null, 2)}\n`)

  for (const [source, target] of FILES) {
    const sourcePath = join(sourceRoot, source)
    const targetPath = join(packageRoot, target)
    mkdirSync(dirname(targetPath), { recursive: true })
    if (!source.startsWith('adapters/codex/skills/snipe/assets/')) {
      copyFileSync(sourcePath, targetPath)
      continue
    }
    let contents = readFileSync(sourcePath, 'utf8')
    for (const [from, to] of IMPORT_REWRITES) contents = contents.replaceAll(from, to)
    writeFileSync(targetPath, contents)
  }
  return verifySnipePlugin(packageRoot)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const output = process.argv[2]
  if (!output) throw new Error('usage: node adapters/codex/package-snipe.mjs <output-directory>')
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  console.log(JSON.stringify({ output: resolve(output), files: buildSnipePlugin({ repoRoot, output }) }, null, 2))
}
