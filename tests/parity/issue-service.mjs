import { createServer } from 'node:http'
import { readFileSync, writeFileSync, renameSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

export async function startIssueService(t, root, {timeoutAfterSuccess=false} = {}) {
  const state = join(root, 'issues.json'), log = join(root, 'requests.jsonl')
  writeFileSync(state, '[]'); writeFileSync(log, '')
  const issues = () => JSON.parse(readFileSync(state, 'utf8'))
  const sockets = new Set()
  let dropped = false
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1')
    appendFileSync(log, `${JSON.stringify({method:request.method, path:url.pathname, correlation:url.searchParams.get('correlation')})}\n`)
    const reply = (status, body) => { response.writeHead(status, {'Content-Type':'application/json'}); response.end(JSON.stringify(body)) }
    if (url.pathname !== '/issues' || !url.searchParams.get('correlation')) return reply(400, {error:'unknown fixture request'})
    const correlation = url.searchParams.get('correlation')
    if (request.method === 'GET') return reply(200, issues().filter(issue => issue.correlation === correlation))
    if (request.method !== 'POST') return reply(405, {error:'unsupported method'})
    const rows = issues(), issue = {id:rows.length+1, correlation}
    rows.push(issue)
    writeFileSync(`${state}.tmp`, JSON.stringify(rows)); renameSync(`${state}.tmp`, state)
    // Intentionally no server-side dedup: the test must prove client reconciliation.
    if (timeoutAfterSuccess && !dropped) { dropped=true; return }
    reply(201, issue)
  })
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  t.after(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise(resolve => server.close(resolve))
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  return {url:`http://127.0.0.1:${server.address().port}`, issues,
    requests:() => readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(row => JSON.parse(row))}
}
