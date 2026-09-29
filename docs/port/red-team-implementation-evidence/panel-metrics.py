from pathlib import Path
import gzip,json
root=Path('/private/tmp/war-red-team-implementation/docs/port/red-team-implementation-evidence');rows=[];totals={}
for path in sorted(root.glob('*-raw.json.gz')):
 p=json.load(gzip.open(path));seats=[]
 for s in p['seats']:
  usages=[]
  for line in s.get('stdout','').splitlines():
   try:event=json.loads(line)
   except:continue
   if event.get('type')=='turn.completed' and 'usage' in event:
    usage=event['usage'];usages.append(usage)
    for k,v in usage.items():
     if isinstance(v,(int,float)):totals[k]=totals.get(k,0)+v
  seats.append({'seat':s['seat'],'lens':s['lens'],'reportedUsageEvents':usages,'status':s['status'],'verdict':s.get('verdict',{}).get('verdict')})
 rows.append({'panel':path.name,'complete':p['complete'],'coverage':p['coverage'],'stability':p['stability'],'seats':seats})
assert len(rows)==7
result={'configuredProfile':{'model':'gpt-5.6-sol','effort':'medium'},'independentlyObservedModelIdentity':None,'billedCost':None,'panelWallTime':None,'reportedUsageTotals':totals,'panels':rows}
Path('/private/tmp/red-team-panel-metrics.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(totals));print('panels',len(rows),'seats',sum(len(r['seats']) for r in rows))
