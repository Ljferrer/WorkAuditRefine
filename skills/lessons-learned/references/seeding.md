# Seeding — warm-seed a repo, nominate lessons, ingest contributions

Mechanics for the three seed-corpus mechanisms `/lessons-learned` hosts, per
`docs/specs/2026-07-22-lessons-learned-seed-design.md` §4: **`## Seed`** (the `seed` mode —
warm-seed the current repo's memory from the plugin-shipped portable corpus at
`docs/seed/`), **`## Nominate`** (an extension of the bare housekeeping pass — propose portable
lessons back into the corpus), and **`## Ingest`** (WAR-repo-only — sweep contributed
`seed-candidate` issues into the corpus). `SKILL.md` owns dispatch (which mode runs when) and
links here for the mechanics; this file does not repeat the dispatch rule.

Shared vocabulary: `$MEM` is the local memory root, resolved exactly as
[`SKILL.md`'s "Locate the memory store"](../SKILL.md#locate-the-memory-store) resolves it;
`$REPO_ROOT` is `docs/learnings/` in the **target** repo (the repo `/lessons-learned` is running
in — never `WorkAuditRefine` itself unless that happens to be the target), resolved exactly as
[`SKILL.md`'s Phase 0](../SKILL.md#0--inventory--budget-read-only-except-the-one-idempotent-seed-render-below)
resolves `$REPO_ROOT`. The **seed corpus** always means `${CLAUDE_PLUGIN_ROOT}/docs/seed/` — the
plugin-shipped, version-pinned pair (`seed.tar.gz` + `seed-manifest.json`); it is never fetched
from GitHub and never confused with a *target's* `$REPO_ROOT`.

## Seed — warm-seed the current repo

1. **Preflight.** Resolve the shipped corpus and verify it before touching anything else:

   ```bash
   SEED_DIR="${CLAUDE_PLUGIN_ROOT}/docs/seed"
   node "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/seed-pack.mjs" verify "$SEED_DIR"
   ```

   A non-zero exit **aborts the mode outright** — treat it as a corrupt or tampered plugin
   install, never attempt to fix or re-pack it yourself from here.

2. **Destination ask (one ask).** First check whether the current directory sits inside a git
   working tree (`git rev-parse --is-inside-work-tree`) — a **non-git target collapses the ask
   itself**: only the local root is offered, no `docs/learnings/` option is even presented (there
   is no repo to commit a repo-root placement into). Otherwise, ask once: `docs/learnings/`
   (**default**) vs the local memory root `$MEM`, and in the **same ask** offer to name slugs to
   exclude from placement (the operator opts specific seed members out).

3. **Unpack to temp; collision scan.**

   ```bash
   TMP=$(mktemp -d)
   tar -xzf "$SEED_DIR/seed.tar.gz" -C "$TMP"
   ```

   For every `<slug>.md` surviving the exclusion list, check for an existing `<slug>.md` in
   **both** roots — `$REPO_ROOT` (if it exists) **and** `$MEM` — regardless of which one this run's
   chosen destination is. A hit in **either** root **skips** that slug: report it
   `skipped-collision` and never overwrite the existing file (the same never-clobber discipline
   the `evict` mode's collision check and [`migration.md`'s Evict step 3](migration.md) already
   use).

4. **Stamp.** Read the plugin's own version and stamp every surviving member before it is
   written:

   ```bash
   VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).version)" \
     "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json")
   ```

   Add (or overwrite) a **nested** `metadata.seededFrom: work-audit-refine/docs/seed@$VERSION`
   line in each surviving member's frontmatter — nested under `metadata:`, same convention as
   `metadata.keywords`/`metadata.provenance`; a top-level `seededFrom:` does not count for
   anything that reads `metadata.*`. This stamp is lint-safe (no account/URL shape) and is what
   the `## Nominate` rubric below excludes on sight — a seeded lesson is never re-nominated back
   into the set it came from.

5. **Place.**

   - **Repo-root destination:** create `docs/learnings/` if it does not yet exist, write every
     surviving stamped member in as `<slug>.md`, then **lint the whole directory fail-closed**:

     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" lint docs/learnings/
     ```

     A lint hit **refuses the whole repo-root placement** — no render, no commit, no PR (this
     should essentially never fire, since every seed member is lint-verified at pack time and
     re-verified at this mode's own Step 1 preflight, but the gate stays fail-closed regardless —
     no auto-scrub, ever). On a clean lint:

     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM" --repo docs/learnings/
     git checkout -b dev/<YYYY-MM-DD>-memory-seed
     git add docs/learnings
     git commit -m "docs(learnings): warm-seed from work-audit-refine/docs/seed@$VERSION"
     ```

     Before pushing, run the same gh-preflight every other gh write in this repo carries
     (ADR 0026): `bash "${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh" "<overrides.ghUser>"`
     (quoted, possibly empty — empty is a no-op). Then check `git remote`: non-empty pushes the
     branch and opens a PR (`gh pr create`, base = the target's default branch); empty leaves the
     commit local on the `dev/...` branch and the report says so plainly — never an error.
   - **Local destination:** write every surviving stamped member into `$MEM` (created if it does
     not yet exist — nothing here mkdirs by hand), then render, passing `--repo docs/learnings/`
     **iff** `$REPO_ROOT` is non-empty:

     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM"
     ```

     No git at all for this branch. `render-index` itself creates `$MEM` recursively if the
     target never had a memory root before — an absent local root is **never** a reason to abort.

6. **Report.** Placed (count + slugs) / skipped-collision (slugs) / lint outcome / projection
   bytes+verdict — surface `render-index`'s own advisory-warning text **verbatim** whenever it
   prints one (the `WARN_BYTES` = 17,000 B line; 29 seeds add roughly 5–7 KB of `[repo]` rows, so
   a warmly-seeded store presses it more often than an organic one), never paraphrased.

## Nominate — propose portable lessons back into the corpus

During the bare pass's per-memory review (the housekeeping pass's Phase 2, over lessons from
**either** root), each surviving lesson is **also** judged against the portability rubric below —
this runs as a normal extension of that review, not a separate invocation.

**The rubric.** Would the kernel of this lesson help an *unrelated* repo — git/`gh`/shell/bash
gotchas, test-authoring wisdom, language footguns, CI/build/deployment patterns,
filesystem/path/regex edge cases? A candidate is excluded outright (no nomination) if **any** of:
it is engine-internal (a WAR orchestration contract — meaningless outside this plugin), it is
product-internal (the target's own product code, not a portable engineering pattern), it already
carries `metadata.seededFrom` (it *came from* the seed set — nominating it back is circular), its
slug already appears in **either** `seed-manifest.json` tier (`seed` or `archive`), or its slug is
already carried by an **open or closed** `seed-candidate` issue on `Ljferrer/WorkAuditRefine`.

### Inside `WorkAuditRefine`

One operator gate, then a direct re-pack:

1. Present the approved candidate(s) for a single operator gate.
2. For each: unpack the *current* `docs/seed/seed.tar.gz` to a staging dir, copy the candidate's
   file in as `<slug>.md`, then re-pack the union:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/skills/lessons-learned/assets/seed-pack.mjs" pack <staging-dir> --out "${CLAUDE_PLUGIN_ROOT}/docs/seed"
   ```

3. **Cap overflow (exit 4)** prints a ranked eviction proposal — present it as a strike-list ask
   (mirrors the `tighten` mode's Gate step). `evict` only removes members already committed at
   `docs/seed/`, so on approval run it against the **current, pre-add** corpus —
   `evict --slugs <chosen> "${CLAUDE_PLUGIN_ROOT}/docs/seed"` — then re-stage (unpack the now
   smaller tarball, re-add the candidate) and re-pack.
4. The updated `seed.tar.gz` + `seed-manifest.json` are staged and committed together with
   whatever else this `/lessons-learned` run is committing — no separate PR per candidate
   (contrast the foreign-repo path below, which always opens a discrete issue).

### Everywhere else — a `seed-candidate` issue

One drafted issue per candidate, filed on `Ljferrer/WorkAuditRefine` (the target repo here
**always** means the WAR repo itself, never the repo actually being audited or seeded). This
mirrors `/survey-corps`'s `memory-mined` filing discipline:

1. **Draft.** Title = the candidate's `description`. Body = the fixed, greppable line
   `Seed-candidate: <slug>`, the lesson's provenance tier, and the **full** lesson markdown
   (frontmatter + body) inside one fenced code block.
2. **Dedup BEFORE drafting further** — search issues in **both** open and closed state on
   `Ljferrer/WorkAuditRefine` for the fixed `Seed-candidate: <slug>` line (cite it verbatim; `gh`
   search is substring-fragile). A hit in either state → do not draft → report
   `previously-filed (#N)`. Also re-check both manifest tiers → a hit → report `already-in-seed`
   (belt-and-suspenders in case the rubric's own exclusion was bypassed).
3. **Redaction lint, fail-closed.** `war-memory.mjs lint` reads files/directories only — never
   stdin — so write the drafted title + body to a temp `.md` file and lint *that*:
   `node .../war-memory.mjs lint <tmpfile>`. A hit → do **not** file → report
   `withheld: redaction`. No auto-scrub, ever.
4. **One batch filing gate.** Present every surviving draft together; file only the
   operator-approved ones.
5. **gh-preflight before the filing batch:**
   `bash "${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh" "<overrides.ghUser>"` — quoted,
   possibly empty (empty ⇒ no-op).
6. **Every `gh` read and write in this path carries `-R Ljferrer/WorkAuditRefine` explicitly** —
   the Step 2 dedup search, the label ensure (next), and the issue create. Never rely on an
   ambient `gh` repo context.
7. **Label.** Create `seed-candidate` on `Ljferrer/WorkAuditRefine` if absent, then attach it.
   Label creation or attach is **best-effort** — GitHub silently drops label-setting for
   non-collaborators, which is the *normal* case for a foreign contributor. On any such failure:
   file the issue anyway, without the label, and note `label-missing` in that candidate's report
   row — the fixed `Seed-candidate: <slug>` body line stays the authoritative marker regardless
   of label state (the `## Ingest` sweep's union search exists precisely for this).
8. **A failed issue create never aborts the batch** — move on to the remaining approved drafts
   and report `failed (gh: <first stderr line>)` for that one. Re-running later is safe: the
   Step 2 dedup marks anything that *did* succeed as `previously-filed (#N)`, so nothing
   double-files.
9. **Report rows, one per candidate, exhaustive:** `filed #N` / `withheld: redaction` /
   `already-in-seed` / `previously-filed (#N)` / `rejected (operator)` /
   `failed (gh: <first stderr line>)`.

## Ingest — sweep contributed `seed-candidate` issues

**WAR repo only** — this section runs only when the bare pass is executing inside
`WorkAuditRefine` itself (the same repo the corpus and the `seed-candidate` issues live on); a
foreign repo's bare pass never runs this sweep.

**The sweep is the UNION of two searches**, not the label alone:

```bash
gh issue list -R Ljferrer/WorkAuditRefine --label seed-candidate --state open
```

plus a body-line search for `Seed-candidate:` over open issues on the same repo (`gh` search is
substring-fragile — treat a hit as a first-pass filter, then confirm by reading the body for the
exact line). A body-line hit that is **missing the label** gets the label **added right now**
(this run has permission, being the WAR repo's own bare pass) — so the label converges to a
browsing convenience over time and is **never** the ingestion gate; the body line is always the
authoritative marker.

**Per issue, in order:**

1. Extract the **first** fenced code block in the body; ignore any later ones.
2. Temp-file lint the extraction — the same `lint <tmpfile>` discipline as `## Nominate`.
3. **Manifest dedup** — check the extracted slug against **both** `seed-manifest.json` tiers
   (`seed` and `archive`).
4. **Malformed check** — any of: no fence at all; the fence does not parse to a lesson
   (frontmatter present with a non-empty **nested** `metadata.slug` — there is no filename to
   fall back on for an issue-body extraction, unlike `seed-pack.mjs`'s own directory read); or
   the fenced lesson's slug disagrees with the issue's own `Seed-candidate: <slug>` line. Any hit
   → report `malformed (no extractable lesson)`.
5. **One batch gate** — present every swept issue together (its extraction/lint/dedup/malformed
   outcome already known) and let the operator approve or reject each genuine candidate in that
   single ask.
6. **Accepted** → stage the **same extraction that was linted in step 2** (never re-fetch the
   issue body after the gate — an author edit landing between gate-time and commit-time must
   never bypass the lint that already ran), unpack the current `seed.tar.gz`, add the member in,
   re-pack (cap/evict gates apply exactly as the in-WAR `## Nominate` path), one commit, then
   close the issue with a comment citing the commit.
7. **Rejected** → comment naming the reason, then close.
8. **Malformed** → rides the **same** batch gate to a comment-and-close outcome — never a guessed
   repair of a malformed submission.
9. **Report rows otherwise mirror `## Nominate`:** `withheld: redaction` / `already-in-seed` /
   `rejected (operator)` / the ingest-specific `malformed (no extractable lesson)` / and an
   accepted row citing the commit (`accepted (<sha>)`).
