from pathlib import Path
import tempfile,shutil,subprocess,os,json
source=Path('/private/tmp/war-red-team-implementation')
runner='adapters/codex/skills/red-team/assets/red-team-runner.mjs'
evidence='adapters/codex/skills/red-team/assets/red-team-evidence.mjs'
rtest='adapters/codex/skills/red-team/assets/red-team-runner.test.mjs'
etest='adapters/codex/skills/red-team/assets/red-team-evidence.test.mjs'
cases=[
 ('fsmonitor-policy',runner,'...gitEvidenceEnvironment,','',rtest,'coordinator inspection'),
 ('prior-projection',runner,'prior:localPrior','prior:prior',rtest,'confirmation projection'),
 ('candidate-stamp',runner,'{...confirmed,candidateId:finding.candidateId}','{candidateId:finding.candidateId,...confirmed}',rtest,'confirmation projection'),
 ('filter-override',runner,"...gitOptions,...overrides,'-C'","...gitOptions,'-C'",rtest,'coordinator inspection'),
 ('global-config',runner,"GIT_CONFIG_GLOBAL:'/dev/null'","GIT_CONFIG_GLOBAL:process.env.HOME+'/.gitconfig'",rtest,'coordinator checkout'),
 ('projection-bound',runner,'JSON.stringify(projection)','JSON.stringify(issues)',rtest,'runner archives'),
 ('artifact-budget',evidence,'if(retainedBytes+artifactBytes>maxTotalBytes)','if((retainedBytes+=artifactBytes)>maxTotalBytes)',etest,'rejected oversized'),
]

results=[]
with tempfile.TemporaryDirectory(prefix='red-team-mutations-') as root:
 root=Path(root)
 for path in ['adapters/codex/skills/red-team','adapters/codex/skills/snipe/assets']:
  shutil.copytree(source/path,root/path)
 path='skills/red-team/assets/red-team-gate.mjs';(root/path).parent.mkdir(parents=True);shutil.copy(source/path,root/path)
 for name,path,old,new,test,pattern in cases:
  target=root/path;original=target.read_text();assert old in original,name
  target.write_text(original.replace(old,new))
  env=dict(os.environ);env.pop('NODE_TEST_CONTEXT',None)
  p=subprocess.run(['node','--test','--test-name-pattern='+pattern,test],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=40)
  target.write_text(original)
  assertion=p.returncode==1 and ('AssertionError' in p.stdout or 'ERR_ASSERTION' in p.stdout)
  results.append({'name':name,'exit':p.returncode,'assertionKilled':assertion,'output':p.stdout})
  print(name,assertion,flush=True)
Path('/private/tmp/red-team-p1c2-mutations.json').write_text(json.dumps(results,indent=2))
assert all(r['assertionKilled'] for r in results)
