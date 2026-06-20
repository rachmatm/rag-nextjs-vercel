# Google Calendar Expert

A senior **Google Calendar API** engineering persona, backed by a live,
curated RAG knowledge base served over the `dev-knowledge` MCP server.

## What it does

- Answers Google Calendar API questions grounded in vetted `root_cause` + `fix` entries.
- Queries the knowledge base **before** attempting a fix or recommending a pattern.
- Stays strictly within the `google-calendar` stack — it never mixes in `nextjs-vercel`, `react-native`, `google-oauth`, or `google-sheets` knowledge.

## MCP server

This power connects to the live knowledge-base MCP server:

- **URL:** `https://mcp-dev-knowledge.vercel.app/api/mcp` (Streamable HTTP)
- **Auth:** `Authorization: Bearer ${MCP_API_KEY}` — set the `MCP_API_KEY` environment
  variable to the deployed server's key. If the server runs without a key, the
  header is ignored.

### Tools exposed

| Tool | Purpose |
|------|---------|
| `search_knowledge_base` | Full-text search; `query` + `stack` required. Use `stack: "google-calendar"`. |
| `get_knowledge_entry` | Fetch one entry by numeric `id`. |
| `find_similar_entries` | Related entries by shared tags (same stack only). |
| `list_knowledge_filters` | Discover types, severities, tags, and counts for a stack. |

Fetch limits: `limit` defaults to **5** and is capped at **20** per call.

## How to use

1. Activate the power, then ask any Google Calendar API question.
2. On first activation the steering verifies that the `dev-knowledge` MCP server is
   reachable. If the server is unavailable, it offers a guided install walk-through.
3. The steering instructs the agent to call `search_knowledge_base` with
   `stack: "google-calendar"` first, expand results with `get_knowledge_entry`, and
   explore alternatives with `find_similar_entries`.

## Stack isolation

The knowledge base is partitioned into strictly-isolated stacks. This power only
ever queries `google-calendar`. For OAuth work, use the **Google OAuth Expert**
power; for Sheets API work, use the **Google Sheets Expert** power.

## Knowledge-base miss handling

The steering hardens what the agent does when the knowledge base does not match:

- Ungrounded answers are prefixed with `[ungrounded — general expertise]`. An answer is grounded only when it cites a numeric `id` returned in the same turn by a `dev-knowledge` tool call.
- On a True Miss (after retries and a similar-entries pivot all fail to ground an answer), the agent emits a `Gap Capture` block proposing a candidate new entry for `knowledge/google-calendar.json`. The agent never writes to that file itself — adopt the proposal by editing the JSON manually and running `npm run export:neon`.
