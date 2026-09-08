import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

function manifest(version) {
  assert.match(version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,'invalid planning manifest version')
  return {
    name:'work-audit-refine-planning',version,
    description:'Author WAR plans from an interview or existing draft; does not execute plans.',
    author:{name:'Ljferrer'},license:'MIT',skills:'./skills/',
    interface:{displayName:'WAR Planning',shortDescription:'Author and convert WAR plans',
      longDescription:'Interview and convert drafts into WAR plans without executing them.',
      developerName:'Ljferrer',category:'Developer Tools',capabilities:['Interactive','Read','Write'],
      defaultPrompt:['Use $work-audit-refine-planning:war-strategy to plan a change.']},
  }
}

const files=[
  ['adapters/codex/skills/war-strategy/SKILL.md','skills/war-strategy/SKILL.md'],
  ['adapters/codex/skills/war-strategy/agents/openai.yaml','skills/war-strategy/agents/openai.yaml'],
  ...['SKILL.md','references/plan-interview.md','references/strategy-verifier.md','assets/plan-literal-lint.mjs'].map(path=>[`skills/war-strategy/${path}`,`shared/skills/war-strategy/${path}`]),
  ['adapters/codex/skills/war-strategy/references/host.md','shared/skills/war-strategy/references/host.md'],
  ['docs/adr/0025-drift-guard-discipline.md','shared/docs/adr/0025-drift-guard-discipline.md'],
]
const expected=['.codex-plugin/plugin.json',...files.map(([,to])=>to)].sort()

function regularSource(root,path) {
  let current=root
  for(const part of path.split('/')) {
    current=join(current,part)
    const stat=lstatSync(current,{throwIfNoEntry:false})
    if(!stat || stat.isSymbolicLink())throw new Error(`missing or symlink source: ${path}`)
  }
  if(!lstatSync(current).isFile())throw new Error(`missing regular source: ${path}`)
  return current
}

// Only the background ADR's citations relocate. Operative doctrine stays byte-identical.
function backgroundADR(source,path) {
  let count=0
  const text=readFileSync(join(source,path),'utf8').replace(/\]\(([^)]+)\)/g,(match,href)=>{
    if(href.startsWith('https://') || href.startsWith('#'))return match
    const [file,anchor]=href.split('#')
    const target=relative(source,resolve(source,dirname(path),file)).split(sep).join('/')
    if(target.startsWith('../'))throw new Error(`unresolved background citation: ${href}`)
    regularSource(source,target)
    count++
    return `](https://github.com/Ljferrer/WorkAuditRefine/blob/codex-port/${target.split('/').map(encodeURIComponent).join('/')}${anchor ? '#'+anchor : ''})`
  })
  assert.equal(count,12,'background citation census changed; review package relocation')
  return text
}

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
  const config=JSON.parse(readFileSync(join(root,'.codex-plugin/plugin.json'),'utf8'))
  assert.deepEqual(config,manifest(config?.version),'invalid planning manifest')
  const skill=readFileSync(join(root,'skills/war-strategy/SKILL.md'),'utf8')
  const frontmatter=skill.match(/^---\n([\s\S]*?)\n---/)
  const names=[...(frontmatter?.[1] ?? '').matchAll(/^name: ([\w-]+)$/gm)]
  assert.equal(names.length,1,'invocation requires one skill name')
  const invocation=`$${config.name}:${names[0][1]}`
  const metadata=readFileSync(join(root,'skills/war-strategy/agents/openai.yaml'),'utf8')
  const prompts=[...metadata.matchAll(/^\s*default_prompt: (.+)$/gm)]
  assert.equal(prompts.length,1,'invocation requires one UI default prompt')
  let uiPrompt
  try { uiPrompt=JSON.parse(prompts[0][1]) } catch { throw new Error('invalid invocation prompt encoding') }
  for(const prompt of [...config.interface.defaultPrompt,uiPrompt]) {
    assert.equal(typeof prompt,'string','invocation prompt must be text')
    assert.deepEqual(prompt.match(/\$[\w:-]+/g),[invocation],'invocation differs across metadata')
  }
  return actual
}

export function buildPlanningPlugin({repoRoot,output}) {
  const source=resolve(repoRoot),destination=resolve(output)
  if(existsSync(destination))throw new Error(`output already exists: ${destination}`)
  if(!lstatSync(source).isDirectory())throw new Error('source root must be a real directory')
  for(const [from] of files) {
    regularSource(source,from)
  }
  const version=JSON.parse(readFileSync(regularSource(source,'.claude-plugin/plugin.json'),'utf8')).version
  const config=manifest(version)
  const adr=backgroundADR(source,'docs/adr/0025-drift-guard-discipline.md')
  mkdirSync(join(destination,'.codex-plugin'),{recursive:true})
  writeFileSync(join(destination,'.codex-plugin/plugin.json'),JSON.stringify(config,null,2)+'\n')
  for(const [from,to] of files) {
    mkdirSync(dirname(join(destination,to)),{recursive:true})
    if(from==='docs/adr/0025-drift-guard-discipline.md')writeFileSync(join(destination,to),adr)
    else copyFileSync(join(source,from),join(destination,to))
  }
  return verifyPlanningPlugin(destination)
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3)throw new Error('usage: node adapters/codex/package-planning.mjs OUTPUT')
  const repoRoot=fileURLToPath(new URL('../..',import.meta.url))
  console.log(JSON.stringify({files:buildPlanningPlugin({repoRoot,output:process.argv[2]})}))
}
