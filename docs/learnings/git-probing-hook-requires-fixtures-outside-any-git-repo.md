---
name: git-probing-hook-requires-fixtures-outside-any-git-repo
description: "An unconditional git probe in a previously git-free hook makes every test fixture root need to live outside any git working tree"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - test hermeticity
    - mktemp fixture
    - git probe
    - ancestor repo
    - TMPDIR
    - git-common-dir
    - hook test coupling
    - fixture root outside repo
  provenance: code-verified
  slug: git-probing-hook-requires-fixtures-outside-any-git-repo
  phase: campaign-state-anchor/phase-1 (task 1.1)
  tags: 
    - war
    - testing
    - hermeticity
    - git
    - shell
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# A hook that starts probing git unconditionally needs its test fixtures pinned outside any git repo

`hooks/inject-campaign-state.test.sh` builds every fixture under a fresh
`mktemp -d` (never `TMPDIR` redirection — BSD `mktemp` ignores `TMPDIR`, see
`[[bsd-mktemp-ignores-tmpdir-gnu-only]]`). Before phase 1 of campaign-state-anchor,
`hooks/inject-campaign-state.sh` never invoked `git`, so a fixture's location
relative to any enclosing git checkout was irrelevant. Landing the main-checkout
anchor (`git -C "$root" rev-parse --path-format=absolute --git-common-dir`, see
`[[git-common-dir-anchor-idiom-fail-open-gotchas]]`) means the hook now runs `git`
against **every** fixture unconditionally — verify still present before acting
(found at `hooks/inject-campaign-state.sh`'s anchor line and
`hooks/inject-campaign-state.test.sh`'s hermeticity comment block @ phase 1;
verified via the phase's own landed `_refinery` task-worktree checkout, not this
servitor's own cwd — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]).

**The new coupling:** if a fixture's `mktemp -d` root happened to land *inside* an
existing git working tree (e.g. `TMPDIR` pointed under a checkout, or a future test
runner changes the temp-dir convention), the anchor would resolve to that
**ancestor repo's** main checkout instead of the fixture's own synthetic root —
silently re-rooting the scan away from the fixture and breaking injection-path
assertions. `mktemp -d` defaults to `/var/folders` (macOS) or `/tmp` (Linux CI) —
both outside any repo — so this is currently safe and the landed gate proved
54/54, but it is a **latent** coupling, not a structural guarantee: nothing in the
test asserts the fixture root is git-free.

**Durable rule:** the moment a previously git-free script/hook starts invoking
`git` unconditionally against a caller-supplied or environment-derived root, audit
every existing test fixture builder for that script and confirm (don't just
assume) the fixture root cannot land inside an ancestor git repo — either by
construction (a `mktemp` convention known to be outside any checkout) or by an
explicit assertion in the test harness. A prior test suite's "never touches git"
assumption becomes false the day a code change flips that history.

**Mechanized (#928, 2026-07-19):** this suite's latent coupling is now a structural
guarantee — `hooks/inject-campaign-state.test.sh` carries a fatal hermeticity guard
immediately after the `cd "$WORK"` line in the "Fresh hermetic workspace" setup block
(before case 1): it runs the hook's own two-step probe against `$WORK` and aborts if an
enclosing repo (working tree OR bare) is found, so a fixture root that ever lands inside
an ancestor checkout fails loudly at setup instead of far from the cause. The durable
rule above still binds the next hook that grows a git probe — this suite is now its
worked example, not the only place the rule matters.

## Related

[[git-common-dir-anchor-idiom-fail-open-gotchas]] — the anchor idiom that
introduced this coupling. [[bsd-mktemp-ignores-tmpdir-gnu-only]] — why this suite
uses bare `mktemp -d` rather than a `TMPDIR`-pinned one.
