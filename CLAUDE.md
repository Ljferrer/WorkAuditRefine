📚 **Durable engineering lessons live in `docs/learnings/`** — one fact per Markdown file, provenance-tagged frontmatter. Before changing a subsystem, read the lessons that name it (plain Read/Grep, or ranked retrieval via the `work-audit-refine` plugin's `war-memory` query).

In this repo the plugin ships at `skills/_shared/`, so that ranked query is `node skills/_shared/war-memory.mjs query '<terms>' --repo docs/learnings` (needs Node >= 24; plain Read/Grep works without it).
