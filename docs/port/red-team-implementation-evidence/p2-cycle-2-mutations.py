from pathlib import Path
import tempfile,shutil,subprocess,os,json
source=Path('/private/tmp/war-red-team-implementation');runner='adapters/codex/skills/red-team/assets/red-team-runner.mjs';test='adapters/codex/red-team-actual-host.test.mjs'
cases=[
 ('diagnostic-readonly','{...context,readOnly:true}','{...context,readOnly:false}','entrypoint: success'),
 ('fixture-snapshot','changed=JSON.stringify(before)!==JSON.stringify(after)','changed=false','entrypoint: tamper'),
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
Path('/private/tmp/red-team-p2c2-mutations.json').write_text(json.dumps(results,indent=2));assert all(r['assertionKilled'] for r in results)
