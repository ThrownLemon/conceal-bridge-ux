# Context7 MCP Guide

This guide explains what Context7 is, when to use it, and how to use it effectively via MCP tools.

---

## What Context7 is

Context7 is an on-demand documentation retrieval system. It lets an agent pull **up-to-date** library/framework docs (APIs, guides, examples) at generation time, instead of relying on potentially stale model memory.

In practice, Context7 is best treated as your **source of truth** for:
- Library-specific API details (method signatures, options, edge cases)
- Current setup / configuration steps
- Version-specific behavior changes
- Canonical examples and recommended patterns

---

## When you should use Context7

Use Context7 when the task depends on **external library knowledge** that is likely to change over time, or where correctness depends on precise API details.

### Strong signals to invoke Context7

- You need to **generate code** using a third-party library/framework (SDKs, auth libs, cloud clients, UI frameworks).
- You need **setup steps** (installation, configuration, initialization).
- You need **exact API usage** (parameters, return values, error types, lifecycle).
- You’re unsure about the **current best practice** for a library feature.
- The prompt references “docs”, “API”, “latest”, “vX”, “deprecated”, or “migration”.

### When you can skip it

- Pure language questions (e.g., basic TypeScript/JavaScript syntax) that do not depend on an external library.
- Tasks that only involve modifying existing project code where you can infer behavior from local source.

### Default rule of thumb

If a correct solution requires *knowing* an external library’s current API surface, **use Context7 before you write code**.

---

## How Context7 MCP works (tooling mental model)

Context7 MCP typically has two steps:

1. **Resolve the library ID** (search/selection)
2. **Fetch documentation** for that resolved ID, optionally scoped by topic + pagination

If you already know the exact library ID (format: `/owner/repo` or `/owner/repo/version`), you can skip step 1.

---

## Core workflow (recommended)

### 1) Resolve a library ID (when you don’t have one)

Use the MCP tool named `resolve-library-id` to map a human name like “Next.js” to an exact Context7 library ID.

Selection guidance for an agent:
- Prefer exact name matches.
- Prefer results with more snippets / better coverage.
- Prefer higher-reputation sources when ambiguous.
- If multiple plausible matches exist, choose the best one and proceed (unless the user’s prompt indicates a very specific package).

### 2) Fetch docs from the resolved ID

Use the MCP tool named `get-library-docs` with:
- `context7CompatibleLibraryID` (required)
- `topic` (optional but recommended when you know what you need)
- `mode`:
  - `code` for API references and examples (default)
  - `info` for conceptual guides
- `page` for pagination (1–10)

---

## Decision Flow

Use this quick flow to decide when and how to invoke Context7:

- Need third-party library/framework setup, configuration, or exact API usage?
  - Yes → Use Context7
    - Do you already have an exact library ID (`/owner/repo` or `/owner/repo/version`)?
      - Yes → Fetch docs with `get-library-docs` (use a focused `topic` when possible)
      - No → Resolve with `resolve-library-id`, then fetch with `get-library-docs`
    - Still missing details → paginate (`page` 2–10) and/or refine `topic`
  - No → Proceed without Context7 (use local codebase + general language knowledge)

---

## Examples (agent prompting patterns)

### Resolve then fetch docs

Goal: implement a feature using a library but you don’t know the exact ID.

1) Resolve:
- libraryName: “Supabase”

2) Fetch:
- context7CompatibleLibraryID: “/supabase/supabase”
- topic: “authentication” (or “jwt”, “sessions”, etc.)
- mode: “code”

### Use a specific library ID (skip resolution)

If the user provides an ID (or you already know it), directly fetch docs:
- context7CompatibleLibraryID: “/vercel/next.js/v15.1.0”
- topic: “middleware”
- page: 1

Benefits:
- Faster (no search step)
- Less ambiguity
- Version-precise

---

## Topic + pagination strategy

When you ask for docs, do not fetch “everything”.

1. Start with a **narrow topic** (e.g., “routing”, “authentication”, “rate limiting”, “webhooks”).
2. Read page 1.
3. If the result indicates more context is needed, fetch page 2, page 3, etc. (up to page 10).
4. Stop when you have enough to implement correctly.

---

## Performance & cost hygiene (agent best practices)

- Prefer specific IDs like `/vercel/next.js` over vague “next docs”.
- Scope by `topic` to reduce irrelevant output.
- Use pagination only when needed.
- Cache what you learn for the duration of the task (and optionally in local notes for 6–24 hours).

---

## Security guidance

- Never hardcode or commit API keys.
- Use environment variables (e.g., `CONTEXT7_API_KEY`).
- Prefer local secrets via `.env` files and ensure they’re in `.gitignore`.
- Rotate keys on a schedule (e.g., every 90 days) and immediately if compromised.

---

## Networking / proxy configuration (locked-down environments)

If outbound networking requires a proxy, set environment variables (case-insensitive supported):

- `https_proxy`
- `HTTPS_PROXY`

Or configure the MCP server with proxy env vars in your MCP settings.

If connectivity is uncertain, validate outbound access before debugging the agent:
- `curl https://mcp.context7.com/mcp/ping`

---

## Working with private repositories (internal docs)

Context7 can ingest private repos (GitHub/GitLab/Bitbucket) on paid plans to make internal documentation available to the agent.

Use this when:
- Your organization maintains internal SDKs
- You need docs that don’t exist publicly
- You want “single source of truth” docs for proprietary APIs

Note: parsing private repos can incur additional costs (pay attention to token-based pricing).

---

## Recommended “auto-invoke” rule (for agent environments)

If your agent runtime supports persistent rules, add an instruction equivalent to:

> Always use Context7 when I need code generation, setup steps, or library documentation. Automatically use Context7 MCP tools without me having to ask.

Example rule locations (tooling-dependent):
- Cursor rules
- `.windsurfrules`
- `CLAUDE.md`

Customize the rule to your workflow, e.g.:
- “Auto-invoke only for Next.js questions”
- “Use Context7 when the prompt mentions API/docs/migration”

---

## Troubleshooting checklist

If Context7 results seem wrong or incomplete:

1. Confirm you used the right library ID (owner/repo and version if needed).
2. Narrow or change `topic` (too broad yields noise; too narrow can miss context).
3. Paginate (page 2–4 often contains the missing details).
4. If you suspect docs are out of date, refresh the library via Context7’s refresh flow (especially after major releases).
5. For network issues, verify proxy env vars and confirm `curl https://mcp.context7.com/mcp/ping` works.

---

## Reference: finding library IDs

To find an ID manually:
1. Visit https://context7.com
2. Search for your library
3. Copy the ID shown in the format `/owner/repository` (optionally with `/version`)

---