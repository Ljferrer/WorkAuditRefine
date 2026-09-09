from pathlib import Path
import tempfile,shutil,subprocess,os,json
source=Path('/private/tmp/war-red-team-implementation')
runner='adapters/codex/skills/red-team/assets/red-team-runner.mjs'
evidence='adapters/codex/skills/red-team/assets/red-team-evidence.mjs'
rtest='adapters/codex/skills/red-team/assets/red-team-runner.test.mjs'
etest='adapters/codex/skills/red-team/assets/red-team-evidence.test.mjs'
cases=[
 ('scope',runner,'repository:isolated.work,planFile:localPlan','repository:repository,planFile:localPlan',rtest,'operative scope'),
 ('confirmation-projection',runner,'findings:[finding]','findings:result.findings',rtest,'mixed findings'),
 ('candidate-identity',runner,'`${probe.name}#${index+1}`','`${probe.name}#same`',rtest,'mixed findings'),
 ('refutation-direction',runner,'if(!confirmed.reproduced)','if(confirmed.reproduced)',rtest,'mixed findings'),
 ('ignored-state',runner,'[...files,...ignored]','[...files]',rtest,'target guard detects ignored-content'),
 ('metadata-state',runner,'hash(JSON.stringify(metadataIdentity(common)))',"'constant'",rtest,'target guard detects config'),
 ('operator-authority',evidence,"classification: 'unclassified operator-authored evidence'","classification: 'binding ruling'",etest,'known operator measurement'),
 ('intake-total',evidence,'bytes + retainedBytes > maxTotalBytes','false',etest,'total intake bound'),
 ('marker-repipe',runner,'const diagnosticMarkers=gaps.map','const diagnosticMarkers=[].map',rtest,'source and environment gaps'),
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
Path('/private/tmp/red-team-p1-mutations.json').write_text(json.dumps(results,indent=2))
assert all(r['assertionKilled'] for r in results)
