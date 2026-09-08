import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const files=[
  ['adapters/codex/skills/war-strategy/SKILL.md','skills/war-strategy/SKILL.md'],
  ['adapters/codex/skills/war-strategy/agents/openai.yaml','skills/war-strategy/agents/openai.yaml'],
  ...['SKILL.md','references/plan-interview.md','references/strategy-verifier.md','assets/plan-literal-lint.mjs'].map(path=>[`skills/war-strategy/${path}`,`shared/skills/war-strategy/${path}`]),
  ['adapters/codex/skills/war-strategy/references/host.md','shared/skills/war-strategy/references/host.md'],
  ['docs/adr/0025-drift-guard-discipline.md','shared/docs/adr/0025-drift-guard-discipline.md'],
]
const expected=['.codex-plugin/plugin.json',...files.map(([,to])=>to)].sort()

function inventory(root,directory=root) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=join(directory,entry.name)
    const stat=lstatSync(path)
    if(stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))throw new Error(`unsupported package entry: ${path}`)
    return stat.isDirectory() ? inventory(root,path) : [relative(root,path).split(sep).join('/')]
  }).sort()
}

export function verifyPlanningPlugin(root) {
  if(!lstatSync(root).isDirectory())throw new Error('package root must be a real directory')
  const actual=inventory(root)
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('unexpected or missing planning component')
  const manifest=JSON.parse(readFileSync(join(root,'.codex-plugin/plugin.json'),'utf8'))
  if(manifest.name!=='work-audit-refine-planning' || manifest.skills!=='./skills/' || 'hooks' in manifest)throw new Error('invalid planning manifest')
  return actual
}

export function buildPlanningPlugin({repoRoot,output}) {
  const source=resolve(repoRoot),destination=resolve(output)
  if(existsSync(destination))throw new Error(`output already exists: ${destination}`)
  for(const [from] of files) {
    if(!lstatSync(join(source,from),{throwIfNoEntry:false})?.isFile())throw new Error(`missing regular source: ${from}`)
  }
  const version=JSON.parse(readFileSync(join(source,'.claude-plugin/plugin.json'),'utf8')).version
  mkdirSync(join(destination,'.codex-plugin'),{recursive:true})
  writeFileSync(join(destination,'.codex-plugin/plugin.json'),JSON.stringify({
    name:'work-audit-refine-planning',version,
    description:'Author WAR plans from an interview or existing draft; does not execute plans.',
    author:{name:'Ljferrer'},license:'MIT',skills:'./skills/',
    interface:{displayName:'WAR Planning',shortDescription:'Author and convert WAR plans',
      defaultPrompt:'Use $work-audit-refine-planning:war-strategy to plan a change.'},
  },null,2)+'\n')
  for(const [from,to] of files) {
    mkdirSync(dirname(join(destination,to)),{recursive:true})
    copyFileSync(join(source,from),join(destination,to))
  }
  return verifyPlanningPlugin(destination)
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3)throw new Error('usage: node adapters/codex/package-planning.mjs OUTPUT')
  const repoRoot=fileURLToPath(new URL('../..',import.meta.url))
  console.log(JSON.stringify({files:buildPlanningPlugin({repoRoot,output:process.argv[2]})}))
}
