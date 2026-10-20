import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Node canonicalizes module URLs but preserves argv's filesystem alias. Keep the
// entrypoint rule shared by the two builders and both packaged coordinators.
export function isMain(url) {
  if(!process.argv[1])return false
  try{return realpathSync(process.argv[1])===fileURLToPath(url)}catch{return false}
}

// Every owned subprocess starts a process group on POSIX. The direct child's
// exit also triggers cleanup: its descendants may still hold inherited pipes.
export const processGroup = process.platform !== 'win32'

export function processTreeCleanup(child) {
  // Callable one-shot stop plus a never-rejecting completion observation. All
  // consumers must inspect cleanupError before promoting their result to success.
  let stopped = false, settled = false, timer, cleanupError = null
  let resolve
  const completion = new Promise(done => { resolve = done })
  const finish = () => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    if (cleanupError) {
      child.stdin?.destroy(); child.stdout?.destroy(); child.stderr?.destroy()
      child.unref()
    }
    resolve({ cleanupError, processGroupId: child.pid ?? null,
      ...(cleanupError ? { terminationConfirmed: false } : {}) })
  }
  const stop = () => {
    if (stopped || settled) return
    stopped = true
    try {
      if (processGroup && child.pid) process.kill(-child.pid, 'SIGKILL')
      else if (child.pid && child.exitCode === null && child.signalCode === null && !child.kill('SIGKILL')) throw Object.assign(new Error('Cleanup signal was not delivered'), { code: 'SIGNAL_NOT_DELIVERED' })
    } catch (error) {
      if (error.code !== 'ESRCH') {
        cleanupError = { code: error.code ?? 'CLEANUP_FAILED', message: error.message }
        finish()
        return
      }
    }
    // A successful signal is not proof that inherited pipes will close.
    timer = setTimeout(() => {
      cleanupError = { code: 'CLEANUP_CLOSE_TIMEOUT', message: 'Process close not observed within cleanup drain deadline' }
      finish()
    }, 250)
  }
  child.once('exit', stop)
  child.once('close', finish)
  return Object.assign(stop, { settled: completion })
}
