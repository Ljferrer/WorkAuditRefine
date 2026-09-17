// Shared by the baseline collector and physical fixtures, not production Snipe.
// Callers supply a detached POSIX child with piped output and a positive timeout.
// A denied kill cannot guarantee termination: detach pipes, settle failure and
// retain the group identity instead of waiting forever for a descendant's close.
export function ownProcess(child, {timeoutMs, onData}) {
  let done=false, failure=null, cleanupError=null, drainTimer
  let resolveResult
  const result=new Promise(resolve=>{resolveResult=resolve})
  function finish(closed=false) {
    if(done) return
    done=true
    clearTimeout(timer);clearTimeout(drainTimer)
    child.stdout?.destroy();child.stderr?.destroy();child.stdin?.destroy()
    child.unref()
    resolveResult({exitCode:child.exitCode,signal:child.signalCode,failure,cleanupError,
      processGroupId:child.pid ?? null, ...(!closed || cleanupError ? {terminationConfirmed:false} : {})})
  }
  function kill() {
    if(done) return
    try { if(child.pid) process.kill(-child.pid,'SIGKILL') }
    catch(error) {
      if(error.code!=='ESRCH') {
        cleanupError=error.message
        finish()
        return
      }
    }
    // Normal close retains final exit/signal and buffered logs. This independent
    // drain deadline also handles a successful kill that never produces close.
    drainTimer ??= setTimeout(()=>{failure ??= 'process-close-timeout';finish()},250)
  }
  function stop(reason) {
    if(done || failure) return
    failure=reason
    kill()
  }
  const timer=setTimeout(()=>stop('timeout'),timeoutMs)
  for(const [channel,stream] of [['stdout',child.stdout],['stderr',child.stderr]]) {
    stream?.on('data',chunk=>{
      if(done) return
      try {onData(channel,chunk)} catch(error) {stop(`output capture failed: ${error.message}`)}
    })
    stream?.on('error',error=>stop(`output stream failed: ${error.message}`))
  }
  child.on('error',error=>stop(error.message))
  child.once('exit',kill)
  child.once('close',()=>finish(true))
  return {result,kill,stop}
}
