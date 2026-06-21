import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  searchKnowledge,
  getEntry,
  findSimilar,
  listFilters,
  type KnowledgeEntry,
} from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const STACK_DESCRIPTION =
  "REQUIRED. Which tech stack to scope this query to. Stacks are STRICTLY ISOLATED — a query " +
  "returns entries from exactly one stack and never mixes them, so you MUST choose one. " +
  "Valid values: 'nextjs-vercel' (Next.js App Router + Vercel), 'react-native' " +
  "(React Native for web/Android/iOS), 'google-oauth' (Google OAuth sign-in, scopes, token " +
  "refresh, redirect URIs), 'google-calendar' (Google Calendar API events, webhooks, sync, " +
  "recurring events), 'google-sheets' (Google Sheets API read/write, batch ops, " +
  "Sheets-as-CMS), 'kubernetes' (on-premise Kubernetes, Node.js, CloudNativePG, KEDA, " +
  "Cilium, Rook-Ceph, BullMQ, NATS, Vault, LGTM observability), and 'transformers-js' " +
  "(Hugging Face Transformers.js — browser-first ML on ONNX Runtime Web with WebGPU/WASM, Web " +
  "Workers, IndexedDB caches, including Vercel-hosted audio apps). Set it to match the project " +
  "you are working on. If unsure which stacks exist, call list_knowledge_filters (without a stack) FIRST to list them.";

/**
 * Return a tool result as both a readable JSON text block (consumed by every MCP
 * client today) and `structuredContent` (consumed by clients that support it).
 */
function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

/** Trim an entry to a stable, agent-friendly shape (drops internal columns). */
function shapeEntry(e: KnowledgeEntry) {
  return {
    id: e.id,
    type: e.type,
    symptoms: e.symptoms,
    root_cause: e.root_cause,
    fix: e.fix,
    tags: e.tags,
    severity: e.severity,
    frequency: e.frequency,
    related_docs: e.related_docs ?? [],
    version: e.version ?? null,
    stack: e.stack,
    ...(typeof e.score === "number" ? { score: Number(e.score.toFixed(4)) } : {}),
    ...(typeof e.shared_tags === "number" ? { shared_tags: e.shared_tags } : {}),
  };
}

const handler = createMcpHandler(
  (server) => {
    // ---- search_knowledge_base ------------------------------------------------
    server.registerTool(
      "search_knowledge_base",
      {
        title: "Search Dev Knowledge Base",
        description:
          "Search a curated, multi-stack RAG knowledge base of developer issues, errors, config " +
          "problems, best practices, code patterns and performance cases. " +
          "Seven ISOLATED stacks are available: 'nextjs-vercel' (Next.js App Router + Vercel), " +
          "'react-native' (React Native for web/Android/iOS), 'google-oauth' (Google OAuth " +
          "sign-in, scopes, token refresh, redirect URIs), 'google-calendar' (Google Calendar " +
          "API events, webhooks, sync, recurring events), 'google-sheets' (Google Sheets " +
          "API read/write, batch ops, Sheets-as-CMS), 'kubernetes' (on-premise Kubernetes, " +
          "Node.js, CloudNativePG, KEDA, Cilium, Rook-Ceph, BullMQ, NATS, Vault, LGTM), and " +
          "'transformers-js' (Hugging Face Transformers.js — browser-first ML on ONNX Runtime Web " +
          "with WebGPU/WASM, Web Workers, IndexedDB caches, including Vercel-hosted audio apps). " +
          "A query returns results from exactly " +
          "one stack — the `stack` argument is REQUIRED, so set it to match your project. If you do " +
          "not know which stacks exist, call list_knowledge_filters first. " +
          "Use this BEFORE attempting a fix when you hit an error, a confusing log, a config question, " +
          "or want a vetted pattern. Returns ranked entries, each with root_cause and concrete fix steps.",
        inputSchema: {
          query: z
            .string()
            .min(1)
            .describe(
              "Natural-language problem, error message, log line, symptom or topic. " +
                "Examples: 'hydration mismatch', 'prisma connection pool exhausted on vercel', " +
                "'redis sliding window rate limit', 'next/image domains not allowed'."
            ),
          type: z
            .string()
            .optional()
            .describe(
              "Optional filter by entry type. Common values: bug_fix, error, config_issue, " +
                "code_pattern, best_practice, fix_snippet, performance_case, doc, recipe, " +
                "diagnostic_step, root_cause, anti_pattern, architecture, convention, checklist, log_pattern. " +
                "Call list_knowledge_filters to see valid values."
            ),
          severity: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Optional filter by impact level."),
          tags: z
            .array(z.string())
            .optional()
            .describe(
              "Optional. Return only entries containing at least one of these tags, e.g. ['redis','rate-limiting']."
            ),
          stack: z.string().min(1).describe(STACK_DESCRIPTION),
          limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional()
            .describe("Max results to return (1-20, default 5)."),
        },
      },
      async ({ query, type, severity, tags, stack, limit }) => {
        try {
          const rows = await searchKnowledge({ query, type, severity, tags, stack, limit });
          return jsonResult({
            query,
            filters: { type: type ?? null, severity: severity ?? null, tags: tags ?? null, stack },
            count: rows.length,
            results: rows.map(shapeEntry),
          });
        } catch (err) {
          return errorResult(err instanceof Error ? err.message : String(err));
        }
      }
    );

    // ---- get_knowledge_entry --------------------------------------------------
    server.registerTool(
      "get_knowledge_entry",
      {
        title: "Get Knowledge Entry by ID",
        description:
          "Fetch the full content of a single knowledge-base entry by its numeric id " +
          "(ids are returned by search_knowledge_base and find_similar_entries).",
        inputSchema: {
          id: z.number().int().positive().describe("The numeric id of the entry to retrieve."),
        },
      },
      async ({ id }) => {
        try {
          const entry = await getEntry(id);
          if (!entry) return errorResult(`No knowledge-base entry found with id ${id}.`);
          return jsonResult({ entry: shapeEntry(entry) });
        } catch (err) {
          return errorResult(err instanceof Error ? err.message : String(err));
        }
      }
    );

    // ---- find_similar_entries -------------------------------------------------
    server.registerTool(
      "find_similar_entries",
      {
        title: "Find Similar Entries",
        description:
          "Given an entry id, return related entries that share tags (and type). " +
          "Results stay WITHIN THE SAME STACK as the reference entry, so suggestions never " +
          "cross stack boundaries. Useful for discovering adjacent issues, alternative fixes, or related patterns.",
        inputSchema: {
          id: z.number().int().positive().describe("The id of the reference entry."),
          limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional()
            .describe("Max related entries to return (1-20, default 5)."),
        },
      },
      async ({ id, limit }) => {
        try {
          const target = await getEntry(id);
          if (!target) return errorResult(`No knowledge-base entry found with id ${id}.`);
          const rows = await findSimilar(id, limit ?? 5);
          return jsonResult({ id, count: rows.length, results: rows.map(shapeEntry) });
        } catch (err) {
          return errorResult(err instanceof Error ? err.message : String(err));
        }
      }
    );

    // ---- list_knowledge_filters ----------------------------------------------
    server.registerTool(
      "list_knowledge_filters",
      {
        title: "List Available Filters",
        description:
          "Discover what can be searched: total entry count, and the valid values (with counts) for " +
          "type, severity, frequency, stack, plus the most common tags. " +
          "Omit `stack` to see ALL stacks and their entry counts (use this to discover which stacks " +
          "exist); pass a `stack` to see the filters available within that one stack. " +
          "Call this first if you are unsure which stack or filters to pass to search_knowledge_base.",
        inputSchema: {
          stack: z
            .string()
            .optional()
            .describe(
              "Optional here. Omit to list ALL stacks and their entry counts (use this to discover " +
                "which stacks exist before searching). Pass a stack (e.g. 'nextjs-vercel', " +
                "'react-native', 'google-oauth', 'google-calendar', 'google-sheets', 'kubernetes', " +
                "'transformers-js') to see the filter values available within just that stack."
            ),
        },
      },
      async ({ stack }) => {
        try {
          const filters = await listFilters(stack);
          return jsonResult(filters);
        } catch (err) {
          return errorResult(err instanceof Error ? err.message : String(err));
        }
      }
    );
  },
  {
    serverInfo: {
      name: "mcp-dev-knowledge",
      version: "2.0.0",
    },
    instructions:
      "Multi-stack knowledge base of developer issues, fixes, best practices and patterns. " +
      "It currently covers seven STRICTLY ISOLATED stacks: 'nextjs-vercel' (Next.js App Router + " +
      "Vercel), 'react-native' (React Native for web/Android/iOS), 'google-oauth' (Google OAuth " +
      "sign-in, scopes, token refresh, redirect URIs), 'google-calendar' (Google Calendar API " +
      "events, webhooks, sync, recurring events), 'google-sheets' (Google Sheets API " +
      "read/write, batch ops, Sheets-as-CMS), 'kubernetes' (on-premise Kubernetes, Node.js, " +
      "CloudNativePG, KEDA, Cilium, Rook-Ceph, BullMQ, NATS, Vault, LGTM observability), and " +
      "'transformers-js' (Hugging Face Transformers.js — browser-first ML on ONNX Runtime Web " +
      "with WebGPU/WASM, Web Workers, IndexedDB caches, including Vercel-hosted audio apps). " +
      "Each stack is kept separate — a search returns " +
      "results from exactly one stack and never mixes them. " +
      "Workflow: determine the project's stack first (call list_knowledge_filters to see available " +
      "stacks), then call search_knowledge_base with the error text or a short description AND the " +
      "matching `stack` — the `stack` argument is REQUIRED. Use get_knowledge_entry to expand a result and " +
      "find_similar_entries (same-stack only) to explore related solutions.",
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  }
);

/**
 * Optional shared-secret protection. If MCP_API_KEY is set, every request must
 * include it as `Authorization: Bearer <key>` or `x-api-key: <key>`.
 * If MCP_API_KEY is unset, the server is open (useful for local/dev).
 */
function authorize(req: Request): boolean {
  const key = process.env.MCP_API_KEY;
  if (!key) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth.replace(/^Bearer\s+/i, "").trim() === key) return true;
  if (req.headers.get("x-api-key")?.trim() === key) return true;
  return false;
}

function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized: missing or invalid API key." },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": 'Bearer realm="mcp"',
      },
    }
  );
}

async function guarded(req: Request): Promise<Response> {
  if (!authorize(req)) return unauthorized();
  return handler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
