from pathlib import Path
import tempfile,shutil,subprocess,os,json
source=Path('/private/tmp/war-red-team-implementation');runner='adapters/codex/skills/red-team/assets/red-team-runner.mjs';test='adapters/codex/red-team-actual-host.test.mjs'
cases=[
 ('command-allowlist','commands.includes(e.item.command)','true','echo-'),
 ('seeded-blocker',"!classify(allFindings(gateInput.probeResults.filter(r=>r.probe===probe.name))).blockers.some(f=>matchesFacts(f.evidence))",'false','entrypoint: unrelated'),
 ('confirmation-facts',"(raw?.result?.reproduced!==true || !matchesFacts(raw.result.evidence))",'false','entrypoint: bad-confirmation'),
 ('expected-value','facts.expected===4','true','entrypoint: wrong-expected'),
 ('actual-value','facts.actual===actual','true','entrypoint: wrong-actual'),
 ('role-marker','facts.marker===marker','true','entrypoint: wrong-marker'),
 ('separate-nonce','proofNonce=randomUUID()','proofNonce=nonce','entrypoint: success'),
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
Path('/private/tmp/red-team-p2c1-mutations.json').write_text(json.dumps(results,indent=2));assert all(r['assertionKilled'] for r in results)
