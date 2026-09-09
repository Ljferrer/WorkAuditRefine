from pathlib import Path
import subprocess,json,hashlib,tarfile,gzip,io
repo=Path('/private/tmp/war-red-team-implementation')
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
parent=Path('/Users/ljf/.codex/visualizations/2026/09/09/01a08451-dab6-7ea1-9dcc-3a49f05b861b')/('red-team-phase2-'+sha[:12]);root=parent/'work-audit-refine-red-team'
x=json.loads(subprocess.check_output(['node','adapters/codex/package-red-team.mjs',str(root)],cwd=repo,text=True))
y=json.loads(subprocess.check_output(['node','adapters/codex/package-red-team.mjs','/private/tmp/red-team-repro-'+sha[:12]+'/work-audit-refine-red-team'],cwd=repo,text=True))
assert x['source']['dirty'] is False;assert x['artifactSha256']==y['artifactSha256']
p=subprocess.run(['/Users/ljf/miniconda3/envs/codex-snipe-port/bin/python','/Users/ljf/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py',str(root)],capture_output=True,text=True);Path('/private/tmp/red-team-final-validator.log').write_text(p.stdout+p.stderr);assert p.returncode==0
archive=parent/'work-audit-refine-red-team.tar.gz'
with archive.open('wb') as output,gzip.GzipFile(fileobj=output,mode='wb',filename='',mtime=0) as compressed,tarfile.open(fileobj=compressed,mode='w') as tar:
 for path in [root,*sorted(root.rglob('*'))]:
  info=tarfile.TarInfo(str(path.relative_to(root.parent)));info.mtime=0;info.mode=0o755 if path.is_dir() else 0o644;info.type=tarfile.DIRTYPE if path.is_dir() else tarfile.REGTYPE
  data=b'' if path.is_dir() else path.read_bytes();info.size=len(data);tar.addfile(info,io.BytesIO(data) if data else None)
x['archive']=str(archive);x['archiveSha256']=hashlib.sha256(archive.read_bytes()).hexdigest();Path('/private/tmp/red-team-final-identity.json').write_text(json.dumps(x,indent=2)+'\n')
print(json.dumps({k:x[k] for k in ['output','version','artifactSha256','archiveSha256']},indent=2))
