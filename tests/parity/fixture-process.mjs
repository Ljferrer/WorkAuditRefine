// A fixture driver, NOT the WAR recovery algorithm. T3 establishes the physical
// checkpoint/persistence observation; production recovery is bound in T5–T7.
import { readFileSync, writeFileSync, appendFileSync, renameSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { fixtureGit } from './git-fixture.mjs'

const [root, operation, pauseAt] = process.argv.slice(2)
const {base, candidate} = JSON.parse(readFileSync(join(root, 'fixture.json'), 'utf8'))
const work = join(root, 'work'), remote = join(root, 'remote.git')
async function checkpoint(name) {
  if (pauseAt !== name) return
  console.log(`checkpoint:${name}`)
  await new Promise(() => { setInterval(() => {}, 1000) })
}
if (operation === 'hang') {
  setInterval(() => {}, 1000)
} else if (operation === 'flood') {
  setInterval(() => process.stdout.write('x'.repeat(65536)), 1)
} else if (operation === 'descendant') {
  const heartbeat = join(root, 'heartbeat')
  const child = spawn(process.execPath, ['-e', `const fs=require('node:fs');const beat=()=>fs.writeFileSync(${JSON.stringify(heartbeat)},'alive');beat();setInterval(beat,10);process.send('ready')`], {stdio:['ignore','inherit','inherit','ipc']})
  await new Promise((resolve, reject) => { child.once('error', reject); child.once('message', resolve) })
  // Ensure the descendant really wrote before the parent exits, then detach its
  // IPC handle; inherited stdout/stderr deliberately remain open in that child.
  child.disconnect(); child.unref()
} else if (operation === 'issue') {
  const {url, correlation} = JSON.parse(readFileSync(join(root, 'service.json'), 'utf8'))
  const target = new URL(`/issues?correlation=${encodeURIComponent(correlation)}`, url)
  if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1' || target.username || target.password) throw new Error('fixture service must be loopback HTTP')
  const request = async method => {
    const response = await fetch(target, {method, redirect:'error', signal:AbortSignal.timeout(300)})
    if (!response.ok) throw new Error(`fixture service HTTP ${response.status}`)
    return response.json()
  }
  const matches = await request('GET')
  if (!Array.isArray(matches) || matches.length > 1) throw new Error('ambiguous issue correlation')
  const issue = matches[0] ?? await request('POST')
  writeFileSync(join(root, 'issue-result.json'), JSON.stringify(issue))
} else if (operation === 'land') {
const ledgerPath = join(root, 'ledger.json')
if (existsSync(ledgerPath)) {
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  if (Object.keys(ledger ?? {}).sort().join(',') !== 'landed,reconciledFrom') throw new Error('invalid persisted ledger shape')
  if (![base, candidate].includes(ledger.landed)) throw new Error('unexplained persisted ledger revision')
  if (ledger.reconciledFrom !== 'git') throw new Error('invalid persisted ledger provenance')
}
const tip = fixtureGit(root, remote, ['rev-parse', 'refs/heads/main'])
if (tip === base) {
  appendFileSync(join(root, 'pushes.log'), `${candidate}\n`)
  fixtureGit(root, work, ['push', remote, `${candidate}:refs/heads/main`])
  await checkpoint('after-push')
} else if (tip !== candidate) throw new Error('unexplained remote tip; refusing to land or repair ledger')
writeFileSync(join(root, 'ledger.tmp'), JSON.stringify({landed:candidate, reconciledFrom:'git'}))
renameSync(join(root, 'ledger.tmp'), join(root, 'ledger.json'))
} else throw new Error(`unsupported fixture operation: ${operation}`)
