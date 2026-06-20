# Tech Stack

## Core
- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript 5 (strict mode), ES modules (`"type": "module"`)
- **Runtime:** Node.js runtime on the MCP route (not Edge) — required by the Neon serverless driver
- **Hosting:** Vercel serverless, region pinned to `sin1` (next to the Neon `ap-southeast-1` DB)

## Key libraries
- `mcp-handler` + `@modelcontextprotocol/sdk` — MCP server over Streamable HTTP
- `@neondatabase/serverless` — Neon Postgres driver (listed in `serverExternalPackages` in `next.config.mjs`)
- `zod` — input schema validation for every tool
- Postgres `pgvector` extension + full-text search (`tsvector`/`websearch_to_tsquery`)

## Conventions
- Use the `@/*` path alias (maps to repo root) for imports, e.g. `@/lib/db`.
- All tool inputs are validated with Zod schemas; every parameter has a `.describe(...)`.
- Tool descriptions are verbose and agent-facing — keep them precise and emphasize the required `stack` argument.
- The frontend (`app/page.tsx`) uses inline styles (no CSS framework despite README mentions); only `CodeBlock` is a client component (`"use client"`).
- `app/page.tsx` is `force-dynamic` because `DATABASE_URL` is read at request time, not build time.
- SQL uses parameterized queries (`sql.query(text, params)`); never interpolate user input into SQL strings.
- Never throw from tool handlers — return `errorResult(...)`.

## Environment variables
- `DATABASE_URL` (required) — Neon pooled connection string. Without it, tools return "DATABASE_URL is not set".
- `MCP_API_KEY` (optional) — if set, requests must send it via `Authorization: Bearer` or `x-api-key`.

## Common commands
```bash
npm install            # install dependencies
npm run dev            # local dev server -> http://localhost:3000/api/mcp
npm run build          # production build
npm run start          # serve production build
npm run lint           # next lint
npm run export:neon    # load knowledge/*.json into Neon (needs DATABASE_URL)
```

Inspect the MCP server locally with `npx @modelcontextprotocol/inspector` (Transport: Streamable HTTP, URL `http://localhost:3000/api/mcp`).

> Do not run `npm run dev` as a blocking command in automation — start it manually or as a background process.
