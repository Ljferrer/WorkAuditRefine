import assert from 'node:assert/strict'
import { lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const inventory=JSON.parse(readFileSync(new URL('./test-inventory.json',import.meta.url),'utf8'))
const skipPolicy=JSON.parse(readFileSync(new URL('./baseline-skips.json',import.meta.url),'utf8'))
const platforms=['darwin','linux']
const regular=path=>assert.ok(lstatSync(path).isFile(),`required regular artifact: ${path}`)

export function checkWarCI({sourceSha,needs,root}) {
  assert.ok(needs && !Array.isArray(needs) && needs.baseline?.result==='success', 'mandatory baseline job must succeed')
  assert.deepEqual(Object.keys(needs),['baseline'],'unexpected mandatory job set')
  assert.match(sourceSha,/^[a-f0-9]{40}$/,'tested source SHA required')
  assert.deepEqual(readdirSync(root).sort(),platforms.map(p=>`baseline-${p}`),'missing or extra platform artifact')
  for(const platform of platforms) {
    const directory=join(root,`baseline-${platform}`)
    assert.ok(lstatSync(directory).isDirectory(),'platform artifact must be a real directory')
    const path=join(directory,'report.json');regular(path)
    assert.ok(lstatSync(path).size<=4*1024*1024,'report exceeds bound')
    const report=JSON.parse(readFileSync(path,'utf8'))
    assert.equal(report?.schemaVersion,1,'baseline report version')
    assert.equal(report.evidenceLevel,'baseline','baseline evidence required, not parity certification')
    assert.equal(report.ok,true,'baseline report failed')
    assert.equal(report.sourceSha,sourceSha,'report tested revision differs')
    assert.equal(report.stability,'unchanged','source changed during baseline')
    assert.deepEqual(report.before,report.after,'source snapshots differ')
    assert.equal(report.before?.sourceSha,sourceSha,'snapshot revision differs')
    for(const field of ['trackedChanges','untrackedInputs'])assert.deepEqual(report.before[field],[],`dirty source: ${field}`)
    for(const field of ['indexDigest','contentDigest'])assert.match(report.before[field],/^[a-f0-9]{64}$/,`missing ${field}`)
    assert.equal(report.environment?.platform,platform,'report platform differs')
    assert.match(report.environment.node,/^v24\./,'Node 24 evidence required')
    for(const field of ['arch','osRelease','git','bash'])assert.ok(typeof report.environment[field]==='string' && report.environment[field],`missing environment ${field}`)
    assert.deepEqual(report.inventory,inventory,'reviewed test census differs')
    assert.ok(Array.isArray(report.suites),'suite results required')
    assert.deepEqual(report.suites.map(s=>s.path),inventory,'missing, duplicate or reordered suite results')
    for(const [index,suite] of report.suites.entries()) {
      assert.equal(suite.exitCode,0,`${suite.path}: exit failed`)
      assert.equal(suite.signal,null,`${suite.path}: terminated`)
      assert.equal(suite.failure,null,`${suite.path}: execution failure`)
      assert.equal(suite.cleanupError,null,`${suite.path}: cleanup failure`)
      assert.notEqual(suite.terminationConfirmed,false,`${suite.path}: unconfirmed cleanup`)
      const c=suite.counts
      for(const key of ['tests','pass','fail','skipped','cancelled','todo'])assert.ok(Number.isSafeInteger(c?.[key]) && c[key]>=0,`${suite.path}: invalid counts`)
      assert.ok(c.tests>0 && c.fail===0 && c.cancelled===0 && c.todo===0 && c.tests===c.pass+c.skipped,`${suite.path}: failed or empty cases`)
      assert.ok(Array.isArray(suite.skips) && suite.skips.length===c.skipped,`${suite.path}: skip accounting`)
      for(const skip of suite.skips) {
        const name=skip.line?.match(/^ok \d+ - (.*?) # SKIP(?:\s|$)/)?.[1]
        assert.ok(name && skip.channel==='stdout' && Object.hasOwn(skipPolicy[suite.path] ?? {},name) && skipPolicy[suite.path][name]===skip.reason,`${suite.path}: unapproved skip`)
      }
      assert.equal(suite.status,c.skipped ? 'allowed-skips' : 'passed',`${suite.path}: status differs`)
      const logs=join(directory,String(index));assert.ok(lstatSync(logs).isDirectory(),'log directory required')
      for(const file of ['stdout.log','stderr.log'])regular(join(logs,file))
    }
  }
  return {ok:true,evidenceLevel:'baseline',sourceSha,platforms}
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length,4,'usage: node scripts/ci/check-war-ci.mjs SOURCE_SHA REPORT_ROOT (WAR_CI_NEEDS must contain toJSON(needs))')
    console.log(JSON.stringify(checkWarCI({sourceSha:process.argv[2],root:process.argv[3],needs:JSON.parse(process.env.WAR_CI_NEEDS ?? 'null')})))
  } catch(error) { console.error(error.message);process.exitCode=1 }
}
