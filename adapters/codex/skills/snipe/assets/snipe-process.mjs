// Every owned subprocess starts a process group on POSIX. Cleanup also runs on
// parent exit: descendants may keep running even after closing inherited pipes.
export const processGroup = process.platform !== 'win32'

export function processTreeCleanup(child) {
  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    try {
      if (processGroup && child.pid) process.kill(-child.pid, 'SIGKILL')
      else child.kill('SIGKILL')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
}
