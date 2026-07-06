---
name: ""
metadata:
  node_type: memory
  slug: plan-prose-top-level-vs-nested-key-impl-mismatch
  phase: memory-provenance/p1-t1
  type: project
  keywords: [frontmatter grep, yaml nesting, metadata.provenance, dotted path, task instruction wins, gate always denies, spec priority]
  tags:
    - plan-drift
    - yaml
    - provenance
    - task-instruction-authority
  files:
    - hooks/validate-servitor-provenance.sh
  relates:
    - "[[yaml-extraction-indent-coupling-in-shell-gate]]"
    - "[[plan-affected-file-list-doc-completeness-vs-correctness]]"
    - "[[redteam-adjudication-is-authoritative-version-source]]"
  created: 2026-06-29
  originSessionId: memory-provenance-war-servitor
---

# Plan prose says "top-level key"; task instruction and implementation use nested metadata.provenance

## What happened

The plan's running prose described the provenance check as looking for a `provenance:`
key in frontmatter (implying a top-level YAML key). The authoritative task instruction
and the real memory file shape both require a NESTED key: `metadata.provenance` (i.e.,
`provenance:` as a child of `metadata:`).

The implementation in `hooks/validate-servitor-provenance.sh` (verify still present
before acting) correctly uses the nested shape and passes real files. No false deny
was introduced. The delta is plan prose only — not a code bug.

## Why it's durable

Priority chain for conflicting specs:
  task instruction > red-team adjudication > plan literal prose

See [[redteam-adjudication-is-authoritative-version-source]] for the version analogue.
The same priority applies to key-nesting: when the task instruction is explicit about
`metadata.provenance` (nested), a plan paragraph that says "provenance: key" is
superseded — the implementation should follow the task instruction, not the prose.

## Risk

A future worker reading only the plan prose (not the task instruction) would implement
a top-level `^provenance:` grep. That grep would NEVER match real memory files (which
use the nested shape), producing a gate that either always denies or always passes
depending on the fallback — both wrong.

## Pattern to follow

When a plan paragraph abbreviates a nested YAML path as a flat key name, the plan
is wrong; the authoritative shape lives in the task instruction and the existing file
corpus. Reconcile the plan prose to say `metadata.provenance` (dotted path) in the
same task that writes the gate, so a future reader of the plan is not misled.
