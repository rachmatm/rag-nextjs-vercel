# Product

**mcp-dev-knowledge** is a Model Context Protocol (MCP) server that serves a curated, multi-stack RAG knowledge base of developer issues, fixes, best practices, and code patterns to any MCP-compatible coding agent (Cursor, Claude Code, Windsurf, Cline, VS Code, etc.).

It is deployed as a Vercel serverless function and backed by Neon Postgres with `pgvector`. The live endpoint is served over Streamable HTTP at `/api/mcp`.

## Core concept: strictly isolated stacks

Knowledge is partitioned by **tech stack**, and stacks never mix. A search returns results from exactly one stack.

- `nextjs-vercel` — Next.js (App Router) + Vercel
- `react-native` — React Native for web, Android, iOS

Adding a new stack is a **data-only change**: drop a new `knowledge/<stack>.json` file and re-run the export. No code changes required. Preserve this property when making changes.

## MCP tools exposed

- `search_knowledge_base` — full-text search (with ILIKE fallback); `query` and `stack` are both required.
- `get_knowledge_entry` — fetch one entry by numeric id.
- `find_similar_entries` — related entries by shared tags, same stack only.
- `list_knowledge_filters` — discover stacks, types, severities, frequencies, and top tags.

## Output contract

Every tool returns results as both a JSON text block and `structuredContent`. Errors are returned as `{ "error": "..." }` with `isError: true` rather than thrown. Keep this dual-output, never-throw contract intact.
