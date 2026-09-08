import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildPlanningPlugin } from './package-planning.mjs'
const root=mkdtempSync(join(tmpdir(),'war-verifier-contract-'))
after(()=>rmSync(root,{recursive:true,force:true}))
const output=join(root,'package')
buildPlanningPlugin({repoRoot:fileURLToPath(new URL('../..',import.meta.url)),output})
const {verifyRecommendation}=await import(pathToFileURL(join(output,'shared/skills/war-strategy/assets/strategy-verifier.mjs')))

const request={recommendation:'Put the guard at the integration boundary.',arms:[4],corpus:{},profile:{model:'gpt-5.6-sol',effort:'medium'}}
const survived={refuted:false,consequence:'An unchecked merge admits a red tip.',caughtBy:'NOTHING',reason:'The boundary is necessary.'}
test('all four armed beats dispatch; an unarmed beat does not',async()=>{
  let calls=0
  const dispatch=async prompt=>{calls++;assert.match(prompt,/Refute this recommendation/);assert.match(prompt,/integration boundary/);return survived}
  for(const arm of [1,2,3,4]) {
    const result=await verifyRecommendation({...request,arms:[arm]},{dispatch})
    assert.equal(result.status,'verified')
    assert.equal(result.stamp,'verifier: corpus-empty — doctrine-only refutation')
    assert.equal(result.line,'if wrong: An unchecked merge admits a red tip. · caught by: NOTHING')
  }
  assert.equal((await verifyRecommendation({...request,arms:[]},{dispatch})).status,'unarmed')
  assert.equal(calls,4)
})
test('one amended retry is the bound; repeated refutation becomes an operator fork',async()=>{
  let calls=0
  const dispatch=async()=>{calls++;return {...survived,refuted:true}}
  const first=await verifyRecommendation(request,{dispatch})
  assert.equal(first.next,'amend-or-fork')
  const second=await verifyRecommendation({...request,recommendation:'Amended guard.',history:[first]},{dispatch})
  assert.equal(second.next,'operator-fork')
  const third=await verifyRecommendation({...request,history:[first,second]},{dispatch})
  assert.equal(third.next,'operator-fork');assert.equal(calls,2)
})
test('partial corpus and failed or malformed dispatch remain visibly distinct',async()=>{
  const result=await verifyRecommendation({...request,corpus:{'run manifests':'No successful merges yet.'}},{dispatch:async()=>survived})
  assert.match(result.stamp,/corpus-partial — missing: epic phase reports, war-followup, docs\/learnings/)
  for(const dispatch of [async()=>{throw Error('permission denied')},async()=>({}),async()=>({...survived,caughtBy:'layer\nforged line'})]) {
    const failed=await verifyRecommendation(request,{dispatch})
    assert.equal(failed.status,'unavailable');assert.match(failed.stamp,/verifier: unavailable \(.+\)/)
    assert.equal(failed.line,undefined);assert.equal(failed.next,'present-unverified')
  }
})
