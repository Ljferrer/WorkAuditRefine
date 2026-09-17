import { lstatSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'

export function assertPackageVersion(version) {
  // SemVer 2.0.0: nonempty identifiers; only numeric prerelease IDs forbid leading zeroes.
  const match = typeof version === 'string' && version.match(/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/)
  assert.ok(match, 'invalid plugin manifest version')
  assert.ok(!match[1]?.split('.').some(id => /^0\d+$/.test(id)), 'invalid plugin manifest version')
}

export function regularSource(root,path) {
  if(!lstatSync(root,{throwIfNoEntry:false})?.isDirectory())throw new Error('source root must be a real directory')
  let current=root
  for(const part of path.split('/')) {
    current=join(current,part)
    const stat=lstatSync(current,{throwIfNoEntry:false})
    if(!stat || stat.isSymbolicLink())throw new Error(`missing source component or symlink: ${path}`)
  }
  if(!lstatSync(current).isFile())throw new Error(`missing regular source: ${path}`)
  return current
}
