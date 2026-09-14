import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isMain } from './skills/snipe/assets/snipe-process.mjs'
import { gitEvidenceEnvironment } from './skills/snipe/assets/snipe-git-policy.mjs'

const NAME='work-audit-refine-red-team',SKILL='skills/red-team',INFO='build-info.json'
const FILES=[
  ...['SKILL.md','agents/openai.yaml','assets/red-team-runner.mjs','assets/red-team-evidence.mjs','references/probing.md','references/host.md','references/plan-repair.md'].map(path=>[`adapters/codex/${SKILL}/${path}`,`${SKILL}/${path}`]),
  ...['codex-models.mjs','snipe-process.mjs','snipe-git-policy.mjs'].map(path=>[`adapters/codex/skills/snipe/assets/${path}`,`${SKILL}/assets/${path}`]),
  ['skills/red-team/assets/red-team-gate.mjs',`${SKILL}/assets/red-team-gate.mjs`],
]
const REWRITES=[
  ...['codex-models.mjs','snipe-process.mjs','snipe-git-policy.mjs'].map(path=>[`../../snipe/assets/${path}`,`./${path}`]),
  ['../../../../../skills/red-team/assets/red-team-gate.mjs','./red-team-gate.mjs'],
]
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const json=value=>`${JSON.stringify(value,null,2)}\n`
const required=()=>['.codex-plugin/plugin.json',INFO,...FILES.map(([,target])=>target)].sort()
const inside=(root,path)=>{const rel=relative(root,path);return rel!== '..'&&!rel.startsWith(`..${sep}`)&&!isAbsolute(rel)}

function regularFile(root,path,label) {
  const target=resolve(root,path)
  if(!inside(root,target))throw Error(`${label} escapes package: ${path}`)
  let current=root
  for(const part of relative(root,target).split(sep)) {
    current=join(current,part)
    if(!existsSync(current))throw Error(`missing ${label}: ${path}`)
    if(lstatSync(current).isSymbolicLink())throw Error(`${label} must not use symlinks: ${path}`)
  }
  if(!lstatSync(target).isFile())throw Error(`missing ${label}: ${path}`)
  return target
}
function inventory(root,directory=root) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=join(directory,entry.name)
    if(entry.isSymbolicLink())throw Error(`package must not contain symlinks: ${relative(root,path)}`)
    if(entry.isDirectory())return inventory(root,path)
    if(!entry.isFile())throw Error(`package component is not a regular file: ${path}`)
    return [relative(root,path).split(sep).join('/')]
  }).sort()
}
function sourceIdentity(root,contents) {
  let revision=null,dirty=null,status='unavailable'
  const fileHashes=Object.fromEntries([...contents].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([path,bytes])=>[path,hash(bytes)]))
  try {
    const options={stdio:['ignore','pipe','pipe'],timeout:30_000,env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_'))),...gitEvidenceEnvironment}}
    const git=args=>execFileSync('git',['-C',root,...args],{...options,encoding:'utf8'}).trim()
    if(realpathSync(git(['rev-parse','--show-toplevel']))!==root)throw Error('source is not repository root')
    revision=git(['rev-parse','HEAD']);dirty=false;status='identified'
    for(const [path,bytes] of contents) {
      try { if(hash(execFileSync('git',['-C',root,'show',`${revision}:${path}`],options))!==hash(bytes))dirty=true }
      catch {dirty=true}
    }
    if(git(['rev-parse','HEAD'])!==revision)throw Error('Source revision changed while building')
  } catch(error) {
    if(revision)throw error
  }
  return {revision,dirty,status,fileHashes,sha256:hash(JSON.stringify(fileHashes))}
}
function version(source) { return `0.1.0+codex.${source.revision?.slice(0,12)??'unversioned'}.${source.sha256.slice(0,12)}` }
function manifest(source) {
  return {name:NAME,version:version(source),description:'Experimental local adversarial plan review with isolated probes and preserved evidence.',
    author:{name:'Ljferrer'},license:'MIT',skills:'./skills/',
    interface:{displayName:'WAR Red Team',shortDescription:'Adversarial plan review with preserved evidence',
      longDescription:'Review a plan using isolated probes, independent confirmation, truthful coverage, and operator-led repair.',
      developerName:'Ljferrer',category:'Developer Tools',capabilities:['Interactive','Read','Write'],
      defaultPrompt:`Run $${NAME}:red-team to review the selected plan.`}}
}

function verifyClosure(root,files) {
  for(const path of files) {
    if(!/\.(?:mjs|md|yaml)$/.test(path))continue
    const text=readFileSync(join(root,path),'utf8')
    if(text.includes('adapters/codex/') || REWRITES.some(([from])=>text.includes(from)))throw Error(`development-checkout reference in ${path}`)
    if(path.endsWith('.mjs')) {
      // All static/dynamic imports, plus literal resource paths used by codeIdentity.
      const imports=[...text.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)].map(match=>match[1])
      for(const specifier of imports) {
        if(specifier.startsWith('node:'))continue
        if(!specifier.startsWith('./')&&!specifier.startsWith('../'))throw Error(`nonlocal runtime import in ${path}: ${specifier}`)
        regularFile(root,relative(root,resolve(dirname(join(root,path)),specifier)),'runtime import')
      }
      for(const match of text.matchAll(/['"]((?:\.\.?\/)[^'"\n]+\.(?:mjs|md))['"]/g)) {
        regularFile(root,relative(root,resolve(dirname(join(root,path)),match[1])),'runtime resource')
      }
    } else {
      for(const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
        const ref=match[1].split('#')[0]
        if(!ref || /^https?:\/\//.test(ref))continue
        regularFile(root,relative(root,resolve(dirname(join(root,path)),ref)),'reference')
      }
      for(const match of text.matchAll(/\b((?:assets|references)\/[\w./-]+\.(?:mjs|md))\b/g))regularFile(root,`${SKILL}/${match[1]}`,'skill resource')
    }
  }
}

export function verifyRedTeamPlugin(root) {
  const packageRoot=resolve(root)
  if(lstatSync(packageRoot).isSymbolicLink())throw Error('package root must not be a symlink')
  if(basename(packageRoot)!==NAME)throw Error(`package directory must be named ${NAME}`)
  for(const path of required())regularFile(packageRoot,path,'required package file')
  const files=inventory(packageRoot)
  if(JSON.stringify(files)!==JSON.stringify(required()))throw Error('unexpected or missing package component')
  const config=JSON.parse(readFileSync(join(packageRoot,'.codex-plugin/plugin.json'),'utf8'))
  if(config.name!==NAME || config.skills!=='./skills/' || ['hooks','apps','mcpServers'].some(k=>k in config))throw Error('invalid standalone plugin identity or components')
  const skill=readFileSync(join(packageRoot,`${SKILL}/SKILL.md`),'utf8')
  const yaml=readFileSync(join(packageRoot,`${SKILL}/agents/openai.yaml`),'utf8')
  if(!/^name: red-team$/m.test(skill) || !/^\s*allow_implicit_invocation: false$/m.test(yaml))throw Error('invalid explicit skill identity')
  const expected=`$${NAME}:red-team`
  for(const [label,text] of [['manifest',JSON.stringify(config.interface?.defaultPrompt)],['SKILL',skill],['YAML',yaml]]) {
    const invocations=text?.match(/\$[\w-]+(?::[\w-]+)?/g)??[]
    if(!invocations.length||invocations.some(value=>value!==expected))throw Error(`qualified invocation mismatch in ${label}`)
  }
  verifyClosure(packageRoot,files)
  const info=JSON.parse(readFileSync(join(packageRoot,INFO),'utf8'))
  const fileHashes=Object.fromEntries(files.filter(path=>path!==INFO).map(path=>[path,hash(readFileSync(join(packageRoot,path)))]))
  if(info.format!==1 || !info.source || !['identified','unavailable'].includes(info.source.status) || ![true,false,null].includes(info.source.dirty)
    || (info.source.status==='identified' ? !/^[a-f0-9]{40,64}$/.test(info.source.revision)||typeof info.source.dirty!=='boolean' : info.source.revision!==null||info.source.dirty!==null)
    || info.source.sha256!==hash(JSON.stringify(info.source.fileHashes)))throw Error('invalid source identity')
  if(config.version!==version(info.source))throw Error('source/artifact version mismatch')
  if(JSON.stringify(info.files)!==JSON.stringify(fileHashes))throw Error('artifact file hash mismatch')
  const artifactSha256=hash(JSON.stringify({source:info.source,files:fileHashes}))
  if(info.artifactSha256!==artifactSha256)throw Error('artifact digest mismatch')
  return {files,source:info.source,version:config.version,artifactSha256}
}

export function buildRedTeamPlugin({repoRoot,output}) {
  const sourceRoot=realpathSync(resolve(repoRoot)),packageRoot=resolve(output)
  if(basename(packageRoot)!==NAME)throw Error(`package directory must be named ${NAME}`)
  if(existsSync(packageRoot))throw Error(`output already exists: ${packageRoot}`)
  const contents=new Map(FILES.map(([source])=>[source,readFileSync(regularFile(sourceRoot,source,'source component'))]))
  const builder='adapters/codex/package-red-team.mjs'
  contents.set(builder,readFileSync(regularFile(sourceRoot,builder,'source component')))
  const source=sourceIdentity(sourceRoot,contents)
  // Source bytes are captured once. Receipt hashes describe exactly those bytes,
  // including dirty inputs; the revision is never advertised as a clean build alone.
  mkdirSync(join(packageRoot,'.codex-plugin'),{recursive:true})
  writeFileSync(join(packageRoot,'.codex-plugin/plugin.json'),json(manifest(source)))
  for(const [from,to] of FILES) {
    let bytes=contents.get(from).toString('utf8')
    if(to.endsWith('.mjs'))for(const [original,replacement] of REWRITES)bytes=bytes.replaceAll(original,replacement)
    mkdirSync(dirname(join(packageRoot,to)),{recursive:true});writeFileSync(join(packageRoot,to),bytes)
  }
  const files=Object.fromEntries(inventory(packageRoot).map(path=>[path,hash(readFileSync(join(packageRoot,path)))]))
  writeFileSync(join(packageRoot,INFO),json({format:1,source,files,artifactSha256:hash(JSON.stringify({source,files}))}))
  return verifyRedTeamPlugin(packageRoot)
}

if(isMain(import.meta.url)) {
  const args=process.argv.slice(2)
  if(args.length!==1||args[0].startsWith('--'))throw Error(`usage: node adapters/codex/package-red-team.mjs <directory>/${NAME}`)
  console.log(json({output:resolve(args[0]),...buildRedTeamPlugin({repoRoot:resolve(dirname(fileURLToPath(import.meta.url)),'../..'),output:args[0]})}))
}
