# Project Structure

```
mcp-dev-knowledge/
├── app/                          # Next.js App Router
│   ├── api/[transport]/route.ts  # MCP server — registers all 4 tools, handles auth
│   ├── components/CodeBlock.tsx  # client component (copy-to-clipboard) for landing page
│   ├── layout.tsx                # root layout
│   └── page.tsx                  # informational landing page (force-dynamic, live stats)
├── lib/
│   └── db.ts                     # Neon client + all DB queries (search, get, similar, filters)
├── knowledge/                    # the dataset — ONE JSON FILE PER STACK
│   ├── nextjs-vercel.json
│   └── react-native.json
├── export-to-neon.mjs            # loads knowledge/*.json into Neon + pgvector (build-time/manual)
├── next.config.mjs               # serverExternalPackages for Neon driver
├── vercel.json                   # region (sin1) + 60s maxDuration for the MCP route
└── tsconfig.json                 # strict, @/* path alias, excludes export-to-neon.mjs
```

## Where things live
- **Add/change a tool:** `app/api/[transport]/route.ts`. Define the Zod `inputSchema`, call into `lib/db.ts`, and shape the result via `shapeEntry`.
- **Add/change a query:** `lib/db.ts`. Keep queries parameterized and always scope `search`/`findSimilar` to a single `stack`.
- **Add knowledge data:** add or edit files in `knowledge/`. Each file is named `<stack>.json` and contains an array of entries. Re-run `npm run export:neon` to load.
- **Add a new stack:** drop a new `knowledge/<stack>.json`, re-run the export, and add it to `KNOWN_STACKS` in `lib/db.ts` plus the descriptions in `route.ts` / `app/page.tsx`. No schema changes needed.

## Layering rules
- `route.ts` is the MCP/transport + auth layer; it should not contain SQL.
- `lib/db.ts` is the only place that talks to Postgres; it owns the `KnowledgeEntry` shape.
- `export-to-neon.mjs` is a standalone Node script (excluded from the TS build) responsible for schema creation, indexing, and seeding.

## Knowledge entry schema
Each entry: `type`, `symptoms[]`, `root_cause`, `fix[]`, `tags[]`, `severity` (low/medium/high), `frequency` (rare/occasional/common/very-common), `related_docs[]`, `version`, `stack`. The DB also derives `searchable_text` and an `embedding`.
