// Shared Codex executable resolution and read-only model catalog discovery.
import { spawn } from 'node:child_process'
import { accessSync, constants, realpathSync, statSync } from 'node:fs'
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path'
import { processTreeCleanup, processGroup } from './snipe-process.mjs'

export function resolveCodexPath(explicit, env = process.env) {
  const override = explicit ?? env.SNIPE_CODEX_BIN
  const candidates = []
  if (override !== undefined) {
    if (typeof override === 'string' && isAbsolute(override)) candidates.push(override)
  } else {
    // Desktop supplies its Node runtime path even when it supplies no CLI PATH alias.
    // Only recognize the observed bundle layout; never guess a global app install path.
    const runtime = env.CODEX_MCP_NODE_PATH
    if (typeof runtime === 'string' && isAbsolute(runtime) && runtime.endsWith('/Contents/Resources/cua_node/bin/node')) {
      candidates.push(resolve(dirname(runtime), '../..', 'codex'))
    }
    for (const directory of (env.PATH ?? '').split(delimiter).filter(isAbsolute)) {
      candidates.push(join(directory, process.platform === 'win32' ? 'codex.exe' : 'codex'))
    }
  }
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK)
      if (statSync(candidate).isFile()) return realpathSync(candidate)
    } catch { /* Try the next runtime/PATH candidate, never another explicit override. */ }
  }
  throw Object.assign(new Error(`Codex executable unavailable. Attempted: ${candidates.join(', ') || String(override ?? '(no runtime hint or absolute PATH entries)')}. Supply --codex-path /absolute/path/to/codex or SNIPE_CODEX_BIN with an executable absolute path (also supported with --list-profiles).`), { code: 'CODEX_EXECUTABLE_UNAVAILABLE' })
}

// Read capabilities only: never create a thread or start a turn during discovery.
export function listSupportedProfiles({ codexPath, timeoutMs = 30_000, signal } = {}) {
  codexPath = resolveCodexPath(codexPath)
  return new Promise((resolve, reject) => {
    const child = spawn(codexPath, ['app-server', '--listen', 'stdio://', '-c', 'mcp_servers={}', '--disable', 'plugins', '--disable', 'hooks'], { stdio: ['pipe', 'pipe', 'pipe'], detached: processGroup })
    const profiles = Object.create(null)
    const killTree = processTreeCleanup(child)
    let buffer = '', bytes = 0, id = 0, done = false
    const cursors = new Set()
    let failure
    const finish = (error) => {
      if (done) return
      done = true
      clearTimeout(timer)
      failure = error
      killTree()
    }
    const timer = setTimeout(() => finish('Codex model/list timed out'), timeoutMs)
    const cancel = () => finish('Codex model/list cancelled')
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) cancel()
    const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`)
    child.on('error', error => finish(error.message))
    child.stdin.on('error', error => finish(error.message))
    killTree.settled.then(cleanup => {
      if (!done) {
        done = true
        clearTimeout(timer)
        failure = 'Codex model/list exited before returning a catalog'
      }
      signal?.removeEventListener('abort', cancel)
      if (failure || cleanup.cleanupError) reject(Object.assign(new Error(`${failure ?? 'Codex model/list cleanup failed'}${cleanup.cleanupError ? `; ${cleanup.cleanupError.code}: ${cleanup.cleanupError.message}; process group ${cleanup.processGroupId}, termination unconfirmed (operator cleanup required)` : ''} (Codex executable: ${codexPath}; override with --codex-path /absolute/path/to/codex)`), { code: 'PROFILE_DISCOVERY_FAILED', ...cleanup }))
      else resolve(profiles)
    })
    child.stderr.on('data', chunk => {
      if (done) return
      bytes += chunk.length
      if (bytes > 1024 * 1024) finish('Codex model/list output exceeded limit')
    })
    child.stdout.on('data', chunk => {
      if (done) return
      bytes += chunk.length
      if (bytes > 1024 * 1024) return finish('Codex model/list output exceeded limit')
      buffer += chunk.toString()
      let newline
      while (!done && (newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        try {
          const message = JSON.parse(line)
          if (message.id !== id) continue
          if (message.error) return finish(`Codex model/list failed: ${message.error.message}`)
          if (id === 0) {
            send({ method: 'initialized' })
          } else {
            const page = message.result
            if (!Array.isArray(page?.data)) return finish('Malformed Codex model/list catalog')
            for (const model of page.data) {
              const efforts = model.supportedReasoningEfforts?.map(item => item.reasoningEffort)
              if (typeof model.model !== 'string' || !Array.isArray(efforts) || !efforts.length || !efforts.every(item => typeof item === 'string')) return finish('Malformed Codex model capabilities')
              profiles[model.model] = efforts
            }
            if (page.nextCursor == null) return Object.keys(profiles).length ? finish() : finish('Codex returned no supported models')
            if (typeof page.nextCursor !== 'string' || cursors.has(page.nextCursor)) return finish('Invalid Codex model/list cursor')
            cursors.add(page.nextCursor)
          }
          const cursor = message.result?.nextCursor
          send({ id: ++id, method: 'model/list', params: { limit: 100, includeHidden: true, ...(cursor ? { cursor } : {}) } })
        } catch (error) { finish(`Invalid Codex model/list response: ${error.message}`) }
      }
    })
    send({ id: 0, method: 'initialize', params: { clientInfo: { name: 'war_snipe', version: '1' } } })
  })
}

