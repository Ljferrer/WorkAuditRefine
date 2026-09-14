from pathlib import Path
import tempfile,shutil,subprocess,os,json
source=Path('/private/tmp/war-red-team-implementation');runner='adapters/codex/skills/red-team/assets/red-team-runner.mjs';test='adapters/codex/skills/red-team/assets/red-team-runner.test.mjs'
cases=[
 ('root-control',"[join(repository,'.git'),...fileIdentity(join(repository,'.git'))]",'[]','linked worktree control'),
 ('control-symlink',"fileIdentity(join(repository,'.git'))","fileIdentity(realpathSync(join(repository,'.git')))",'root Git control'),
 ('per-worktree-metadata',':treeHash(gitDirectory)',':metadataSha256','separately located'),
 ('git-directory-path','gitDirectory,commonDirectory:common','gitDirectory:null,commonDirectory:common','root Git control'),
 ('common-directory-path','gitDirectory,commonDirectory:common','gitDirectory,commonDirectory:null','root Git control'),
]

results=[]
with tempfile.TemporaryDirectory(prefix='red-team-p2-mutations-') as root:
 root=Path(root)
 for path in ['adapters/codex/skills/red-team','adapters/codex/skills/snipe/assets']:shutil.copytree(source/path,root/path)
 for path in ['adapters/codex/package-red-team.mjs',test,'skills/red-team/assets/red-team-gate.mjs']:
  (root/path).parent.mkdir(parents=True,exist_ok=True);shutil.copy(source/path,root/path)
 for name,old,new,pattern in cases:
  target=root/runner;original=target.read_text();assert old in original,name;target.write_text(original.replace(old,new))
  env=dict(os.environ);env.pop('NODE_TEST_CONTEXT',None)
  p=subprocess.run(['node','--test','--test-name-pattern='+pattern,test],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=40)
  target.write_text(original)
  killed=p.returncode==1 and ('AssertionError' in p.stdout or 'ERR_ASSERTION' in p.stdout)
  results.append({'name':name,'exit':p.returncode,'assertionKilled':killed,'output':p.stdout});print(name,killed,flush=True)
Path('/private/tmp/red-team-reserve-mutations.json').write_text(json.dumps(results,indent=2));assert all(r['assertionKilled'] for r in results)
