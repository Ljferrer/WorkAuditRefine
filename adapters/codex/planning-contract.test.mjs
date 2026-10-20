import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractFiles } from '../../skills/war-campaign/assets/campaign-ledger.mjs'
import { lint, lintInfo, parsePlanShape } from '../../skills/war-strategy/assets/plan-literal-lint.mjs'

// Independent specimen, not generated from the production template. This checks
// parser compatibility, not whether a live interviewer earns the confirmations.
const plan=`# Cache rename repair
## Context
Renaming a widget should invalidate its cached title. (user)
**Evidence consumed**
- source draft · read
## Pivotal constraints
Keep the existing cache format. (user)
## Resolved design tree
| Decision | Resolution | Source | Landing class |
|---|---|---|---|
| Cache format | Preserve the cache format | PIN-1‡ (user) | guardrail |
## Assumptions ledger
None
## Non-goals / deferred
No schema migration. (user)
## New domain terms · Recommended ADRs
None
## Commander's Intent
- Purpose: renamed widgets display their new title. (user)
- Method: invalidate cached titles on rename. (user)
- Mechanism latitude: internal invalidation mechanics are implementer choice. (user)
- **Binding guardrails:** preserve the cache format (PIN-1). (user)
- **End state:**
  1. Renaming updates the visible title · check: node --test src/cache.test.mjs. (user)
## Build order (for /war)
Phase 1.
## Phase 1 — Rename invalidation
### Task 1: Invalidate on rename
- Files: \`src/cache.js\`, \`src/cache.test.mjs\`
- Plan slice: repair invalidation; consult \`docs/cache.md\` without changing it.
- Done when: node --test src/cache.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject
## Deferred validations (backstops)
None
## Notes / conscious deviations
None
## Open decisions
None
`

test('merged plan keeps real footprint, intent, pin and backstop extraction compatible',()=>{
  assert.deepEqual(extractFiles(plan),['src/cache.js','src/cache.test.mjs'])
  const shape=parsePlanShape(plan)
  assert.equal(shape.hasLedger,true)
  assert.equal(shape.taskBlocks.length,1)
  assert.equal(shape.endStateBullets.length,1)
  assert.match(shape.guardrailText,/PIN-1/)
  assert.match(shape.backstopText,/None/)
  assert.deepEqual(lint(plan),[])
  assert.equal(lintInfo(plan).length,1)
})

test('removing a confirmation artifact obligation is visible to the existing advisory checks',()=>{
  for(const [remove,pattern]of [
    ['## Assumptions ledger\nNone\n','missing-assumptions-ledger'],
    ['- Done when: node --test src/cache.test.mjs\n','requires-test-without-done-when'],
    [' (PIN-1)','pin-citation'],
  ]) {
    assert.ok(plan.includes(remove))
    assert.ok(lint(plan.replace(remove,'')).some(hit=>hit.pattern===pattern),pattern)
  }
})
