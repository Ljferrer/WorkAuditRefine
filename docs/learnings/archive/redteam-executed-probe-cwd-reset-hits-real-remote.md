---
name: redteam-executed-probe-cwd-reset-hits-real-remote
description: "Bash cwd reset → sandbox probe pushed real remote"
metadata: 
  node_type: memory
  type: project
  keywords: [sandbox escape, git -C, stray push, cd does not persist, ls-remote, junk ref, prompt-enforced scope]
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

During /red-team of the concurrent-run-land-isolation plan (2026-06-25), the `git-mechanics-cas`
executed probe self-disclosed that one stray git command escaped its sandbox: it relied on cwd
persistence (`cd <sandbox>` in one Bash call, a bare `git push` in a later one) plus a shell var that
resolved EMPTY, and the Bash tool **resets cwd to the session default between calls**, so the push
ran against the session repo's real remote — `git push origin :refs/heads/working` actually reached
`github.com:Ljferrer/WorkAuditRefine` and created+deleted a junk `working` ref, dropping
`pp_out.txt`/`pp_err.txt` litter in the working tree.

**Verified impact was zero** (real remote held only `master` + legit `claude/*` branches; the
`working` ref was a sandbox placeholder, net-zero; litter removed), but the scaffold's SCOPE-LOCK
"work only in a throwaway copy, never mutate repo" is **prompt-enforced, not sandboxed** — same
enforcement-by-directive caveat as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]
and [[scope-hook-blind-to-bash-write-path]].

**Why:** the Bash tool does not persist cwd across calls; a probe that `cd`s once and assumes it
sticks will silently run later commands from the session repo (whose `origin` is the real remote).
**How to apply:** when authoring or reviewing red-team executed probes, require **absolute sandbox
paths + `git -C <sandbox>` for every git call** (never a bare `cd` + later relative command), and
after any red-team run with executed git probes, check `git ls-remote --heads origin` + the working
tree for stray refs/files before trusting the verdict. A deterministic execution harness for executed
probes (already noted as deferred in lenses.md) would remove this class of escape.

> archived 2026-07-15: resolved — moved to archive
