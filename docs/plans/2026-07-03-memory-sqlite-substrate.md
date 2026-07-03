# WAR compounding memory — in-memory FTS5 index, two-root store, per-seat JIT retrieval

**Source spec:** [`docs/specs/2026-07-03-memory-sqlite-substrate-design.md`](../specs/2026-07-03-memory-sqlite-substrate-design.md)
(operator-ratified + adversarially verified 2026-07-03, 42 findings absorbed — spec §11; companion ADR
[`0015`](../adr/0015-files-canonical-memory-with-derived-index.md)). The spec, ADR, and CONTEXT.md terms
ride [PR #470](https://github.com/Ljferrer/WorkAuditRefine/pull/470) — see *Open decisions* for the
stacking choice. Code references below are anchored by **construct name**; any `:N` hints WILL drift —
re-locate by construct ([[plan-line-number-refs-stale-use-construct-locator]]).

Memory hooks: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (T4 edits standing .md +
dispatched prompt in ONE commit), [[weak-test-assertion-passes-without-feature-being-exercised]]
(temp-break proofs on every new clause test), [[default-flip-must-audit-all-doc-surfaces]] (T5 sweeps
every prose surface for the learningsTarget fallback retirement),
[[release-bump-slots-canonical-no-badge]] + [[version-slots-no-cross-slot-consistency-test]] (T8),
[[gate-under-covers-after-cross-branch-merge-new-runner]] (new `safe-swap.test.sh` runner — run ALL
suites post-merge, count self-discovered), [[dont-leave-work-on-the-table]] (collateral fixes absorbed
by the file's owning task).

**Ratify with `/red-team` before `/war`.** The conscious deviations under *Notes* are
operator-resolved — ratify, don't re-open.

## Commander's Intent

- **Purpose:** the memory corpus compounds without bound and travels through git — the flat-index
  failure (race, byte ceiling, knowledge deletion) becomes structurally impossible, and every WAR agent
  gets the right prior lessons pushed into its prompt.
- **Method:** implement the ratified spec as the floor — files canonical, in-memory FTS5 index, two
  roots, Lead-prefetched per-seat retrieval. Judgment guardrails: zero new dependencies and zero
  widening of servitor/auditor confinement; retrieval fails open, publication fails closed; commit text
  only — no binary or generated file enters the repo; knowledge is archived, never deleted.
- **End state:** the spec's eight numbered conditions (E1–E8; spec §10 maps them to tests) hold at
  land: generated-only projection (E1), unbounded corpus with retrievable archive (E2), no derived
  state outlives a process (E3), per-seat memory blocks under budget (E4), fail-open retrieval (E5),
  lint-gated publication (E6), byte-identical confinement (E7), conflict-free multi-user merges (E8).

## Build order (for /war)

- **Topology:** 3 phases. Phase 1 = four parallel, file-disjoint code tasks (no intra-phase `deps` —
  nothing imports T1's code; the workflow template only concatenates strings the Lead builds).
  Phase 2 = three parallel doc/CI tasks — a **phase edge**, not more phase-1 parallelism, because the
  mirrors must describe post-phase-1 behavior and the CI workflow invokes the landed CLI. Phase 3 =
  release.
- **Integration base:** PR #470's branch (stack-and-plow) or fresh `origin/master` if #470 has merged —
  see *Open decisions*. Version = **+0.1.0 over the land-time base**; the operator is the version
  authority — no literal in this file is.
- **File-disjointness map (Phase 1):** T1 → `skills/_shared/war-memory.mjs` + `.test.mjs`. T2 →
  `skills/war/assets/war-config.mjs` + `.test.mjs`. T3 → `skills/lessons-learned/assets/safe-swap.sh`
  + new `safe-swap.test.sh`. T4 → `skills/war/assets/workflow-template.js` + `.test.mjs`,
  `agents/war-servitor.md`, `agents/war-worker.md`. No overlaps. Phase 2: T5 → `skills/war/SKILL.md`,
  `skills/war/references/schemas.md`, `skills/war-room/SKILL.md`, `README.md`,
  `skills/war-help/SKILL.md`. T6 → `skills/lessons-learned/SKILL.md`,
  `skills/lessons-learned/references/migration.md` (NEW). T7 → `.github/workflows/memory-audit.yml`
  (NEW). Phase 3: T8 alone touches the version slots (README again — cross-phase, intentional).
- **Gate:** the full self-discovering gate before every commit — `node --test 'skills/**/*.test.mjs'`
  + the `find … '*.test.sh'` sweep. **No gate edits needed**: `war-memory.test.mjs` rides the existing
  node glob; `safe-swap.test.sh` rides the find sweep. Run **all** suites post-merge; count
  self-discovered, never a literal.
- **Coverage — spec §10 criteria → tasks:** 1–9, 15 → T1. 12 → T2. 13 → T3. 10, 11 → T4. 14 (both
  servitor hook suites pass **unchanged** — the no-widening proof) → asserted by every merge's full
  gate run; cite in T4's PR notes. Gate 3 is enforced-by-CI, deliberately no unit criterion (T7).

---

## Phase 1 — foundation code (4 parallel, file-disjoint tasks)

### Task 1 — `war-memory.mjs`: the CLI (the big one)

**Files:** `skills/_shared/war-memory.mjs` (NEW), `skills/_shared/war-memory.test.mjs` (NEW).
**requiresTest:** true · **roster:** default (full distinct-lens panel — highest blast radius) ·
**deps:** none · **target repo:** superproject.

Zero-dependency Node ≥ 24 (`node:sqlite`, `node:fs`). Every invocation walks both roots
(hot + `archive/`), parses frontmatter, builds the FTS5 index **in `:memory:`** — each row carrying
source root (repo/local) and temperature (hot/cold). No persistent index, no fingerprint, no schema
versioning (spec §4.3). Plan slice (TDD; every verb gets unit tests + a temp-break proof):

- [ ] **Frontmatter parse** — round-trip incl. nested `metadata.provenance`, absent `keywords`,
  absent `type`/`provenance` (absent provenance ranks as `agent-unverified`; absent/unrecognized type
  routes local — spec §4.6, load-bearing: 46/133 live lessons are untyped).
- [ ] **`query <text> [--seat] [--top-k N] [--budget BYTES]`** — text → FTS5 OR-query of significant
  terms; `bm25()` weighted name/description/keywords/tags ≫ body; order (BM25, provenance tier,
  recency); truncate to top-k (default 10) and byte budget (default ~4KB — a CLI flag, NOT a config
  key); append one query-log line (`war-memory-queries.jsonl` in the local root); print the
  ready-to-inject prompt block (spec §4.5 format) — the ONLY output format, no `--format`.
- [ ] **`--queries <file>`** — batch N labeled queries through one process (one corpus walk, N labeled
  blocks) — the Lead's per-phase prefetch is one invocation.
- [ ] **`render-index`** — regenerate the **local union** projection atomically (`MEMORY.md.tmp` +
  rename). Row = today's table row + tier marker; repo-root lessons additionally carry a trailing
  **`[repo]`** marker (the T3 contract — see *Notes*). Hot ≡ indexed. Budget: ≥17KB → succeed + loud
  warning + ranked archive candidates (lowest tier, then oldest); above **either** hard axis (24.4KB
  bytes / 200 lines) → **refuse**. No repo-root projection is ever written.
- [ ] **`archive <slug>...|--candidates`** — `git mv` in repo root / plain `mv` in local root; append
  the archive note line; re-render.
- [ ] **`lint [<paths>]`** — hardcoded pattern array: absolute home paths, emails, account handles /
  @-mentions / git-host account names, credential shapes (`ghp_…`, `github_pat_…`, `sk-…`, `AKIA…`,
  PEM headers). Fail-closed semantics live in callers (demote-to-local + report); the verb reports.
- [ ] **`consolidate`** — re-render; FTS near-dupe flagging for lessons changed since merge base;
  report only, never auto-merge.
- [ ] **`migrate [--apply]`** — dry-run default: detect legacy layout, route split (`type` + lint;
  untyped files reported and routed local), create `archive/`, move `[RESOLVED]`-marked + overflow
  candidates, render. Fixture test incl. a two-clone disjoint add/archive merge with zero conflicts
  (criterion 15).
- [ ] **Node < 24 stub** — every verb exits non-zero with the one-line message (criterion 9).
- [ ] **Index-from-text-only proof** — two invocations over the same corpus give identical results; no
  on-disk artifact created besides the query log (criterion 5, E3).

### Task 2 — `war-config.mjs`: the `memory` block

**Files:** `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`.
**requiresTest:** true · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] DEFAULTS gains `memory: { retrieval: true, topK: 10, commitLearnings: false }`.
- [ ] `validate()` gains the checks (`retrieval`/`commitLearnings` boolean, `topK` integer ≥ 1) — the
  module's doctrine is "no accepted-but-ignored keys".
- [ ] Tests: block validated; old configs without it fill defaults clean (criterion 12).

### Task 3 — `safe-swap.sh`: two verify rules

**Files:** `skills/lessons-learned/assets/safe-swap.sh`, `skills/lessons-learned/assets/safe-swap.test.sh` (NEW).
**requiresTest:** true · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] **Archive-aware wikilinks:** a `[[slug]]` resolving to `archive/<slug>.md` is NOT dangling.
- [ ] **Root-aware rows:** the index-row↔file hard-fail skips rows carrying the trailing `[repo]`
  marker (their files live in the repo root, not the staged local dir — spec §4.8; without this no
  swap completes once `commitLearnings` is on). Budget hard-fail unchanged.
- [ ] Fixture test: staged corpus with an archived lesson + a `[repo]` row passes verify; a genuinely
  missing local row still hard-fails (criterion 13 + temp-break).

### Task 4 — workflow template + both agent standing files

**Files:** `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
`agents/war-servitor.md`, `agents/war-worker.md`.
**requiresTest:** true · **roster:** default (full panel) · **deps:** none · **target repo:** superproject.

- [ ] **`args.memory` threading** — `{ byTask: {<id>: {worker, seats: {<lens>: block}}}, servitor }`;
  `memoryClause` concatenated at the worker, auditor, **fix-worker (FIX_NEEDED)**, **add-test**, and
  servitor spawn sites — the fix/add-test sites are NEW injection points (they carry no intentClause
  today); ace / gate-audit / polish-sweep get none (spec §4.5). Empty map ⇒ byte-identical prompts.
- [ ] **Worker self-query line** — dispatched worker prompt gains the may-run-CLI line; mirror one
  line in `agents/war-worker.md` (standing/dispatched in one commit — see *Notes*).
- [ ] **D4 deleted everywhere it lives** — the wrap-up prompt's D4 line in the template; the D4
  discipline AND the separate Inputs-section append-pointer instruction in `agents/war-servitor.md`;
  `memory_index_updated` dropped from the ServitorResult schema in the template. Servitor standing
  file gains: `keywords:` duty (3–8 aliases), the §4.6 routing rule (typed + fail-safe default),
  archive-update rule (may edit archived lessons; never moves temperature), updated Return block.
- [ ] **Tests** — memoryClause present at the five sites, absent at refiner/ace/gate-audit/polish
  (criterion 10, temp-break); existing D4-presence assertions **inverted** to assert absence in both
  surfaces; ServitorResult schema no longer carries `memory_index_updated` (criterion 11).

## Phase 2 — doc mirrors + CI (3 parallel, file-disjoint tasks)

### Task 5 — war-family prose

**Files:** `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war-room/SKILL.md`,
`README.md`, `skills/war-help/SKILL.md`.
**requiresTest:** false · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] `war/SKILL.md`: Setup — two-root resolution replaces the either/or fallback (**behavior
  change**: repo root written iff `commitLearnings`; `learningsTarget` override = repo-root path,
  must still match the scope-hook glob); Node ≥ 24 probe (fail-open); per-phase batched prefetch step
  after JIT decompose (skipped when `memory.retrieval: false`); post-servitor step — `render-index`,
  `lint` repo root, commit `docs(learnings): phase N`.
- [ ] `schemas.md` (all three edits, one task): `memory` block documented; `memory_index_updated`
  retired from ServitorResult; **whole run-config jsonc literal refreshed** (add
  `run.ace/provision/provisionSource/provisionAuto` alongside `memory`).
- [ ] `war-room/SKILL.md`: two asks — `topK`; `commitLearnings` with the pitch (default stays false
  unconfigured) — plus frontmatter description naming the memory asks.
- [ ] README + war-help: memory feature + Node ≥ 24 note; sweep all prose for the retired
  learningsTarget fallback ([[default-flip-must-audit-all-doc-surfaces]]).

### Task 6 — lessons-learned family

**Files:** `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/references/migration.md` (NEW).
**requiresTest:** false · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] SKILL.md: `retire`/`merge` **recommendations** route through `war-memory archive` (hub-link
  downgrade still applies first); merge-source archived with `merged into [[target]]` note; pipeline
  gains final `render-index` step; staged query-log rides inertly.
- [ ] `migration.md`: the adoption playbook — `migrate` dry-run → retype untyped files → `--apply` →
  keywords-backfill fan-out → reviewed learnings PR (gate 2's first use).

### Task 7 — CI memory audit (WAR repo only)

**Files:** `.github/workflows/memory-audit.yml` (NEW — the repo's first Actions workflow).
**requiresTest:** false · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] On PR: run `node skills/_shared/war-memory.mjs lint docs/learnings/` (directory-wide), fail on
  any hit. Not plugin code; enforced-by-CI, deliberately no unit criterion. Worker smoke-runs the
  command locally against a fixture path before committing.

## Phase 3 — release

### Task 8 — bump the four canonical version slots

**Files:** `plugin.json`, both `marketplace.json` slots, `README.md`.
**requiresTest:** false · **roster:** default · **deps:** none · **target repo:** superproject.

- [ ] +0.1.0 over the land-time base ([[release-bump-slots-canonical-no-badge]]); verify all four
  slots by hand ([[version-slots-no-cross-slot-consistency-test]]).

---

## Notes / conscious deviations (ratify in /red-team)

1. **`[repo]` row-marker contract (plan-level pin, not in the spec):** union-projection rows for
   repo-root lessons end with a `[repo]` marker; safe-swap's row↔file check skips `[repo]` rows.
   Chosen over teaching safe-swap the repo-root path (keeps it hermetic) — this is the T1↔T3
   interface, pinned here so the tasks parallelize.
2. **`agents/war-worker.md` mirror line** — the spec's surface table omits it; absorbed into T4 per
   [[standing-instruction-vs-dispatched-prompt-coverage-split]].
3. **Migration execution is post-land ops, not a task:** run the playbook against the operator's live
   corpus (133 lessons) after this plan lands — `migrate` dry-run, retype/confirm untyped files,
   `--apply`, keywords backfill, then the first `docs/learnings/` PR with `commitLearnings` enabled
   for the WAR repo via `/war-room`.
4. **README is touched by T5 and T8** — cross-phase same-file, intentional (phase edge, no collision).
5. **T7's workflow YAML cannot be exercised by the gate** — CI proves itself on this plan's own PR.

## Open decisions — RESOLVED by /red-team (2026-07-03, run `wf_cc60e078-76b`)

1. **Stacking → fresh `origin/master`.** PR #470 merged 2026-07-03; the spec/ADR 0014/CONTEXT terms are
   on master. This branch was cut off fresh master (`a9c0241`), not #470's branch.
2. **Version literal → +0.1.0.** Land-time base 0.13.0 (plan 3 shipped) → target **0.14.0**; operator is
   the version authority at land ([[stacked-release-plan-version-literal-lags-operator-target]]).
3. **`safe-swap.test.sh` placement → OK.** The `testsh-gate-discovery` probe confirmed the gate's
   `find … -name '*.test.sh'` sweep has no `-maxdepth`/path exclusion; a new test under
   `skills/lessons-learned/assets/` is discovered and run — no house convention violated.
