# RAG Knowledge Base - Next.js on Vercel

A structured JSON knowledge base designed for Retrieval-Augmented Generation (RAG) systems, covering common issues, patterns, and solutions for **Next.js applications hosted on Vercel**.

It ships with two ways to consume the data:

1. **MCP Server** (`app/`) — a [Model Context Protocol](https://modelcontextprotocol.io) server deployed as a Vercel serverless function, so any coding agent (Cursor, Claude Code, Windsurf, Cline, VS Code, …) can query the knowledge base over Streamable HTTP.
2. **Raw JSON** (`knowledge/*.json`) — the underlying dataset, **one file per stack** (e.g. `knowledge/nextjs-vercel.json`, `knowledge/react-native.json`), plus `export-to-neon.mjs` to load them all into Neon Postgres with `pgvector`.

---

## MCP Server

The MCP server exposes the knowledge base (stored in Neon Postgres) through four tools. It is a Next.js App Router route at `app/api/[transport]/route.ts`, served at **`/api/mcp`** using the Streamable HTTP transport.

> **Live server:** `https://mcp-dev-knowledge.vercel.app/api/mcp`
> Landing page: <https://mcp-dev-knowledge.vercel.app>

### Stacks (strictly isolated)

The knowledge base is partitioned by **tech stack**, and the stacks are kept **completely separate** — a search returns results from exactly one stack and never mixes them. Next.js work and React Native work do not bleed into each other.

| `stack` value | Domain |
|---------------|--------|
| `nextjs-vercel` | Next.js (App Router) + Vercel — routing, server components, caching, Prisma/Neon, Redis, deployment |
| `react-native` | React Native for **web, Android, iOS** — Expo/bare, Metro, navigation, native builds, `react-native-web`, EAS |

How isolation is enforced:

- `search_knowledge_base` **requires** a `stack` and always scopes to that single stack. Set `stack: "nextjs-vercel"` or `stack: "react-native"` to match your project — there is no cross-stack search.
- `find_similar_entries` only returns entries from the **same stack** as the reference entry.
- `list_knowledge_filters` (called with no `stack`) lists every stack and its entry count so an agent can discover what exists before searching; pass a `stack` to see filters within just that stack.

Adding a future stack is a data-only change (drop a new `knowledge/<stack>.json` file and re-run the export) — no code changes required.

### Tools

| Tool | Input | Returns |
|------|-------|---------|
| `search_knowledge_base` | `query` (required), **`stack` (required)**, `type?`, `severity?`, `tags?`, `limit?` | Ranked matching entries with `root_cause` + `fix` steps |
| `get_knowledge_entry` | `id` | One full entry |
| `find_similar_entries` | `id`, `limit?` | Entries sharing tags with the given entry (same stack only) |
| `list_knowledge_filters` | `stack?` | Valid filter values (types, severities, frequencies, stacks, top tags) + counts |

### Input / Output contract

**Input** — every tool takes a small, typed (Zod) argument set. `search_knowledge_base` requires a natural-language `query` **and** a `stack` (the stacks are isolated, so you must pick one); the remaining filters are optional and self-describing. Call `list_knowledge_filters` (no `stack`) first to discover the available stacks:

```json
{ "name": "search_knowledge_base", "arguments": { "query": "prisma connection pool exhausted on vercel", "stack": "nextjs-vercel", "limit": 3 } }
```

**Output** — results are returned **both** as a JSON text block (consumed by every MCP client today) and as `structuredContent` (for clients that support typed output). Each result is a stable, flat object:

```json
{
  "query": "prisma connection pool exhausted on vercel",
  "filters": { "type": null, "severity": null, "tags": null, "stack": "nextjs-vercel" },
  "count": 1,
  "results": [
    {
      "id": 123,
      "type": "bug_fix",
      "symptoms": ["..."],
      "root_cause": "...",
      "fix": ["...", "..."],
      "tags": ["prisma", "database", "serverless"],
      "severity": "high",
      "frequency": "common",
      "related_docs": ["https://..."],
      "version": "prisma@5+",
      "stack": "nextjs-vercel",
      "score": 0.8123
    }
  ]
}
```

This shape is intentionally agent-friendly: top-level `count`/`results`, one object per entry, `fix` as an ordered array of steps, and a `score` for ranking. Errors are returned as `{ "error": "..." }` with `isError: true` rather than throwing.

### Run locally

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL
npm run dev                  # http://localhost:3000/api/mcp
```

Inspect it with the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP
# Local URL: http://localhost:3000/api/mcp
# Live URL:  https://mcp-dev-knowledge.vercel.app/api/mcp
```

### Deploy to Vercel

The server is deployed at **<https://mcp-dev-knowledge.vercel.app>**. To deploy your own:

1. Import the repo into Vercel.
2. Add the `DATABASE_URL` environment variable (Neon pooled connection string) — **required**; without it the tools return `DATABASE_URL is not set`.
3. (Optional) Add `MCP_API_KEY` to require a bearer token.
4. Deploy. The region is pinned to `sin1` (Singapore) in `vercel.json` to sit next to the Neon `ap-southeast-1` database.
5. After adding or changing environment variables, **redeploy** for them to take effect.

### Connect a client

```json
{
  "mcpServers": {
    "dev-knowledge": {
      "url": "https://mcp-dev-knowledge.vercel.app/api/mcp"
    }
  }
}
```

If `MCP_API_KEY` is set, add a header (client config varies):

```json
{
  "mcpServers": {
    "dev-knowledge": {
      "url": "https://mcp-dev-knowledge.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer <your-key>" }
    }
  }
}
```

For stdio-only clients, bridge with [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "dev-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp-dev-knowledge.vercel.app/api/mcp"]
    }
  }
}
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Neon Postgres pooled connection string |
| `MCP_API_KEY` | no | If set, clients must send it via `Authorization: Bearer` or `x-api-key` |

---

## Schema

Each entry follows this structure:

```json
{
  "type": "bug_fix | error | log_pattern | config_issue | doc | code_pattern | fix_snippet | diagnostic_step | root_cause | performance_case",
  "symptoms": ["array of symptoms or search queries that match this entry"],
  "root_cause": "description of the underlying cause",
  "fix": ["array of fix steps or solutions"],
  "tags": ["array of tags for filtering and categorization"],
  "severity": "low | medium | high",
  "frequency": "rare | occasional | common | very-common",
  "related_docs": ["array of URLs to official documentation"],
  "version": "package version or runtime version this applies to"
}
```

## Entry Types

| Type | Count | Description |
|------|-------|-------------|
| `fix_snippet` | 40 | Ready-to-use code solutions and implementation patterns |
| `code_pattern` | 35 | Best practice code patterns and architectural guidance |
| `bug_fix` | 26 | Known bugs with confirmed fixes |
| `doc` | 19 | How-to documentation and setup guides |
| `config_issue` | 14 | Configuration problems and corrections |
| `performance_case` | 13 | Performance optimization cases |
| `error` | 8 | Runtime errors and their resolutions |
| `diagnostic_step` | 8 | Step-by-step debugging procedures |
| `root_cause` | 6 | Deep-dive root cause analysis |
| `log_pattern` | 3 | Warning/error log patterns and their meaning |

**Total: 172 entries**

## Metadata Fields

| Field | Values | Purpose |
|-------|--------|---------|
| `severity` | `low`, `medium`, `high` | Impact level of the issue on application functionality |
| `frequency` | `rare`, `occasional`, `common`, `very-common` | How often this issue is encountered in practice |
| `related_docs` | Array of URLs | Links to official documentation for further reading |
| `version` | String | Package/runtime version this entry applies to (e.g., `next@13+`, `prisma@5+`) |

## Tech Stack Coverage

### Core Framework
- **Next.js** (App Router) — routing, server components, server actions, middleware, streaming
- **TypeScript** — strict mode, type safety, path aliases, generics, type guards
- **Tailwind CSS** — configuration, dark mode, responsive design, CVA variants, animations

### Databases
- **SQLite + Turso** — local development with libSQL, Drizzle ORM, FTS5 search, embedded replicas
- **PostgreSQL + Neon** — Prisma ORM, connection pooling, branching, migrations, serverless driver
- **PostgreSQL + Supabase** — realtime subscriptions, RLS, presence, storage, auth, type generation

### Event Processing & Background Jobs
- **Upstash QStash** — message queues, delayed delivery, retries, dead letter queue, signature verification
- **Inngest** — durable functions, multi-step workflows, throttling, cron, fan-out patterns

### Redis (Upstash)
- **Deduplication cache** — prevent duplicate event/webhook/request processing
- **Rate limiting** — sliding window, token bucket, fixed window implementations
- **Embedding cache** — cache vector embeddings to reduce AI API costs
- **Retrieval cache** — cache RAG query results and LLM responses
- **Session storage** — serverless session management with cookies
- **Temporary event buffer** — buffer events for batch processing
- **Retry state tracking** — track attempts, backoff, and failure metadata
- **General patterns** — cache-aside, invalidation, distributed locks, leaderboards, feature flags, pipelines

### File Storage
- **Local Filesystem** — development file storage, /tmp usage, serve local uploads
- **Vercel Blob** — production file storage, client/server uploads, storage abstraction pattern

### Google APIs
- **Google OAuth** — sign-in, scopes, token refresh, consent screen, database token persistence
- **Google Calendar API** — list/create/update events, webhooks, timezone handling, rate limits
- **Google Sheets API** — read/write data, batch operations, service accounts, Sheets-as-CMS pattern

### Deployment & Infrastructure
- **Vercel** — deployment, serverless functions, edge runtime, regions, caching, cron jobs, environment variables

## Tag Distribution (Top 25)

| Tag | Count |
|-----|-------|
| vercel | 27 |
| redis | 24 |
| performance | 22 |
| googleapis | 21 |
| serverless | 18 |
| typescript | 18 |
| supabase | 15 |
| configuration | 15 |
| tailwind | 14 |
| patterns | 14 |
| local-dev | 13 |
| google-api | 12 |
| database | 12 |
| inngest | 11 |
| debugging | 11 |
| storage | 8 |
| google-calendar | 7 |
| google-sheets | 7 |
| google-oauth | 6 |
| sqlite | 10 |
| prisma | 10 |
| upstash | 9 |
| postgresql | 9 |
| authentication | 9 |
| security | 8 |

## Usage

### Loading into a Vector Store

Load the per-stack files from `knowledge/` into your RAG vector store. Each entry's `symptoms` array provides natural-language queries that should match the entry, while `tags` enable filtered retrieval. Keep entries scoped by stack so retrieval never mixes stacks.

```typescript
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

// Load every per-stack file (knowledge/nextjs-vercel.json, knowledge/react-native.json, ...)
const dir = "./knowledge";
const knowledgeBase = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => {
    const stack = f.replace(/\.json$/, "");
    return JSON.parse(readFileSync(join(dir, f), "utf-8")).map((e) => ({ ...e, stack: e.stack || stack }));
  });

// Index each entry with symptoms as searchable text
for (const entry of knowledgeBase) {
  const searchableText = [
    ...entry.symptoms,
    entry.root_cause,
    entry.tags.join(' ')
  ].join(' ');

  await vectorStore.upsert({
    id: generateId(entry),
    text: searchableText,
    metadata: {
      type: entry.type,
      severity: entry.severity,
      frequency: entry.frequency,
      tags: entry.tags,
      version: entry.version,
      stack: entry.stack
    },
    document: entry
  });
}
```

### Filtering by Metadata

Use metadata fields for filtered retrieval:

```typescript
// Only high-severity issues
const critical = knowledgeBase.filter(e => e.severity === 'high');

// Redis-specific entries
const redisEntries = knowledgeBase.filter(e => e.tags.includes('redis'));

// Entries for a specific version
const nextEntries = knowledgeBase.filter(e => e.version.includes('next@'));
```

## Tech Stack

- **Framework:** Next.js 13+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Hosting:** Vercel (Serverless + Edge)
- **Databases:** SQLite/Turso, PostgreSQL/Neon, Supabase
- **Storage:** Local Filesystem (dev), Vercel Blob (prod)
- **Cache/Queue:** Upstash Redis, Upstash QStash
- **Orchestration:** Inngest
- **ORM:** Prisma, Drizzle
- **Google APIs:** OAuth, Calendar, Sheets (googleapis)
