# mcp-dev-knowledge

A curated, multi-stack RAG knowledge base for coding agents, shipped as:

1. **MCP Server** (`app/`) — a [Model Context Protocol](https://modelcontextprotocol.io) server on Vercel serverless, queryable over Streamable HTTP by any MCP-compatible client (Cursor, Claude Code, Windsurf, Cline, Kiro, VS Code, …).
2. **Kiro Powers** (`kiro-powers/`) — two installable Kiro extensions that wire up the MCP server and provide a KB-grounded expert persona.
3. **Claude Skills** (`claude-skills/`) — two Claude Code skills that mirror the Kiro Powers for Claude Code users.
4. **Raw JSON** (`knowledge/`) — the underlying dataset, one file per stack, plus `export-to-neon.mjs` to load them into Neon Postgres with `pgvector`.

---

## Project Structure

```
mcp-dev-knowledge/
├── app/                              # Next.js App Router
│   ├── api/[transport]/route.ts      # MCP server — 4 tools, auth, Streamable HTTP
│   ├── components/CodeBlock.tsx      # client component for landing page
│   ├── layout.tsx
│   └── page.tsx                      # informational landing page (force-dynamic)
├── lib/
│   └── db.ts                         # Neon client + all DB queries
├── knowledge/                        # Dataset — ONE JSON FILE PER STACK
│   ├── nextjs-vercel.json
│   └── react-native.json
├── kiro-powers/                      # Kiro Power extensions
│   ├── nextjs-expert/
│   │   ├── POWER.md
│   │   ├── power.json
│   │   └── steering/nextjs-expert.md
│   └── react-native-expert/
│       ├── POWER.md
│       ├── power.json
│       └── steering/react-native-expert.md
├── claude-skills/                    # Claude Code skill extensions
│   ├── nextjs-expert/
│   │   └── SKILL.md
│   └── react-native-expert/
│       └── SKILL.md
├── export-to-neon.mjs               # Loads knowledge/*.json into Neon + pgvector
├── next.config.mjs
├── vercel.json                       # Region (sin1) + 60s maxDuration
├── package.json
└── tsconfig.json
```

---

## MCP Server

The MCP server exposes the knowledge base (stored in Neon Postgres) through four tools. It is a Next.js App Router route served at **`/api/mcp`** using Streamable HTTP.

> **Live server:** `https://mcp-dev-knowledge.vercel.app/api/mcp`
> Landing page: <https://mcp-dev-knowledge.vercel.app>

### Stacks (strictly isolated)

Knowledge is partitioned by **tech stack**. Stacks never mix — a search returns results from exactly one stack.

| `stack` value | Domain |
|---------------|--------|
| `nextjs-vercel` | Next.js (App Router) + Vercel — routing, server components, caching, Prisma/Neon, Redis, deployment |
| `react-native` | React Native for web, Android, iOS — Expo/bare, Metro, navigation, native builds, EAS |

Adding a new stack is a **data-only change**: drop a `knowledge/<stack>.json` and re-run `npm run export:neon`.

### Tools

| Tool | Input | Returns |
|------|-------|---------|
| `search_knowledge_base` | `query` (required), `stack` (required), `type?`, `severity?`, `tags?`, `limit?` | Ranked entries with `root_cause` + `fix` steps |
| `get_knowledge_entry` | `id` | One full entry |
| `find_similar_entries` | `id`, `limit?` | Entries sharing tags (same stack only) |
| `list_knowledge_filters` | `stack?` | Valid filter values + counts |

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

If `MCP_API_KEY` is set on the server, add a header:

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

---

## Kiro Powers

Two installable Kiro extensions under `kiro-powers/`. Each power bundles a steering file that gives the agent a KB-grounded expert persona bound to one stack.

| Power | Stack | Description |
|-------|-------|-------------|
| `nextjs-expert` | `nextjs-vercel` | Senior Next.js (App Router) + Vercel engineer |
| `react-native-expert` | `react-native` | Senior React Native engineer (Expo + bare, web/Android/iOS) |

**Features:**
- Auto-verifies MCP server reachability on first activation (Install_Verify_Protocol)
- Offers guided install walk-through if the server is unavailable
- Enforces strict stack isolation — each power only queries its own stack
- Includes Lookup Protocol, Similar-entries pivot, Gap Capture, and Fallback Label behaviors

---

## Claude Skills

Two Claude Code skills under `claude-skills/`. Each SKILL.md mirrors its corresponding Kiro Power — same persona, same MCP tools, same stack isolation — adapted for the Claude Code host.

| Skill | Stack | Description |
|-------|-------|-------------|
| `nextjs-expert` | `nextjs-vercel` | Senior Next.js (App Router) + Vercel engineer |
| `react-native-expert` | `react-native` | Senior React Native engineer (Expo + bare, web/Android/iOS) |

**Install in Claude Code:**

```bash
claude mcp add --transport http dev-knowledge https://mcp-dev-knowledge.vercel.app/api/mcp \
  --header "Authorization: Bearer $MCP_API_KEY" \
  --scope user
```

Or manually in `~/.claude.json`:

```json
{
  "mcpServers": {
    "dev-knowledge": {
      "type": "http",
      "url": "https://mcp-dev-knowledge.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_API_KEY}"
      }
    }
  }
}
```

---

## Knowledge Data

The dataset lives in `knowledge/`, one JSON file per stack. Each entry:

```json
{
  "type": "bug_fix | error | config_issue | code_pattern | best_practice | fix_snippet | performance_case | doc | recipe | diagnostic_step | root_cause | anti_pattern | architecture | convention | checklist | log_pattern",
  "symptoms": ["array of symptoms or search queries"],
  "root_cause": "description of the underlying cause",
  "fix": ["ordered fix steps"],
  "tags": ["filtering tags"],
  "severity": "low | medium | high",
  "frequency": "rare | occasional | common | very-common",
  "related_docs": ["URLs to official docs"],
  "version": "package/runtime version"
}
```

### Adding/updating knowledge

1. Edit or add entries in `knowledge/<stack>.json`
2. Run `npm run export:neon` (requires `DATABASE_URL`)
3. Entries are loaded into Neon with pgvector embeddings and full-text search indexes

---

## Development

### Run locally

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npm run dev            # http://localhost:3000/api/mcp
```

Inspect with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP
# URL: http://localhost:3000/api/mcp
```

### Commands

```bash
npm install            # install dependencies
npm run dev            # local dev server
npm run build          # production build
npm run start          # serve production build
npm run lint           # next lint
npm run export:neon    # load knowledge/*.json into Neon
```

### Deploy to Vercel

1. Import the repo into Vercel
2. Add `DATABASE_URL` env var (Neon pooled connection string) — **required**
3. Optionally add `MCP_API_KEY` to require bearer auth
4. Deploy — region is pinned to `sin1` (Singapore, near Neon `ap-southeast-1`)

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Neon Postgres pooled connection string |
| `MCP_API_KEY` | no | If set, clients must send via `Authorization: Bearer` or `x-api-key` |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript 5 (strict mode, ES modules)
- **Runtime:** Node.js (required by Neon serverless driver)
- **Database:** Neon Postgres + pgvector + full-text search
- **MCP:** `mcp-handler` + `@modelcontextprotocol/sdk`
- **Validation:** Zod
- **Hosting:** Vercel serverless (sin1 region)
