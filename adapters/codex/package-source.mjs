import { lstatSync } from 'node:fs'
import { join } from 'node:path'

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

