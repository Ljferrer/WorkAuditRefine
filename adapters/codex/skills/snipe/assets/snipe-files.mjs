import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'

// Nonblocking/no-follow open prevents FIFO and final-component symlink races.
// Stream a bounded number of bytes, and reject a concurrently modified file.
export function consumeRegularFile(path, limit, consume, deadline = Date.now() + 5_000) {
  if (Date.now() > deadline) throw new Error('file capture deadline exceeded')
  const fd = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (!before.isFile()) throw new Error('scope input must be a regular file')
    const buffer = Buffer.alloc(64 * 1024)
    let total = 0
    while (true) {
      if (Date.now() > deadline) throw new Error('file capture deadline exceeded')
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, limit - total + 1), null)
      if (!count) break
      total += count
      if (total > limit) throw new Error('file capture byte limit exceeded')
      consume(buffer.subarray(0, count))
    }
    const after = fstatSync(fd)
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new Error('scope input changed during capture')
    return total
  } finally { closeSync(fd) }
}

export function readRegularFile(path, limit) {
  const chunks = []
  consumeRegularFile(path, limit, chunk => chunks.push(Buffer.from(chunk)))
  return Buffer.concat(chunks)
}
