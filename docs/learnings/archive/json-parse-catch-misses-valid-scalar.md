---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [null destructure, TypeError, object guard, args normalization, primitive passthrough, try catch gap]
  slug: json-parse-catch-misses-valid-scalar
  phase: launch-fix/t1.1
  tags: 
    - args-normalization
    - json-parse
    - destructure
    - gotcha
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# JSON.parse catch does not guard against valid-but-non-object scalars

## Fact

A `try/catch` around `JSON.parse(args)` catches `SyntaxError` on malformed JSON, but lets valid JSON scalars — `'null'`, `'true'`, `'5'` — through. `JSON.parse('null')` returns `null` (no throw), and `const { a } = null` then throws a raw `TypeError`, bypassing any domain error guard downstream.

## Pattern that fails silently

```js
let A;
try {
  A = typeof args === 'string' ? JSON.parse(args) : (args ?? {});
} catch { A = {}; }
const { planFile } = A;  // TypeError if A is null/5/true
```

## Correct pattern

Add an object-type guard after parse:

```js
const parsed = typeof args === 'string' ? JSON.parse(args) : args;
A = (typeof parsed === 'object' && parsed !== null) ? parsed : {};
```

Or more concisely: `A = JSON.parse(args)` inside try, then `A = (A && typeof A === 'object') ? A : {}` before destructure.

## Context

Found in `skills/red-team/assets/workflow-scaffold.js` around the args normalize block (verify still present before acting). The realistic delivery path always sends a stringified object, so the bug is latent — but any caller that passes `args = 'null'` or `args = null` as a string hits it.

## Reuse signal

Whenever normalizing args with `JSON.parse` + try/catch, always add an `typeof result === 'object' && result !== null` guard. The catch block alone is not sufficient.

> archived 2026-07-15: resolved — moved to archive
