import { listFilters, type FilterCounts } from "@/lib/db";
import { CodeBlock } from "./components/CodeBlock";

// Fetch live stats at request time (DATABASE_URL is read at runtime, not build).
export const dynamic = "force-dynamic";

const BASE_URL = "https://mcp-dev-knowledge.vercel.app";
const MCP_URL = `${BASE_URL}/api/mcp`;

const TOOLS: { name: string; desc: string; params: string }[] = [
  {
    name: "search_knowledge_base",
    desc: "Full-text search with an ILIKE fallback. Returns ranked entries, each with root_cause and concrete fix steps.",
    params: "query (required), stack (required), type?, severity?, tags?, limit?",
  },
  {
    name: "get_knowledge_entry",
    desc: "Fetch the full content of a single entry by its numeric id.",
    params: "id (required)",
  },
  {
    name: "find_similar_entries",
    desc: "Find entries related to a given id, ranked by shared tags (then type).",
    params: "id (required), limit?",
  },
  {
    name: "list_knowledge_filters",
    desc: "Discover valid filter values (types, severities, frequencies, stacks, top tags) and counts.",
    params: "stack?",
  },
];

const card: React.CSSProperties = {
  background: "#15151c",
  border: "1px solid #26262f",
  borderRadius: 12,
  padding: "16px 18px",
  marginBottom: 12,
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const STACK_INFO: Record<string, { label: string; blurb: string }> = {
  "nextjs-vercel": {
    label: "Next.js + Vercel",
    blurb:
      "Next.js (App Router), server components, routing, caching, Prisma/Neon, Redis, and Vercel deployment.",
  },
  "react-native": {
    label: "React Native",
    blurb:
      "React Native for web, Android and iOS — Expo/bare, Metro, navigation, native builds, react-native-web, EAS.",
  },
  "google-oauth": {
    label: "Google OAuth",
    blurb:
      "Google OAuth 2.0 — consent screen, scopes, token refresh, redirect URIs, service accounts, PKCE, and ID token validation.",
  },
  "google-calendar": {
    label: "Google Calendar API",
    blurb:
      "Google Calendar API — event CRUD, push notifications/webhooks, timezone handling, recurring events, sync tokens, and quotas.",
  },
  "google-sheets": {
    label: "Google Sheets API",
    blurb:
      "Google Sheets API — values.get/append/batchUpdate, batch operations, service-account access, and the Sheets-as-CMS pattern.",
  },
  "kubernetes": {
    label: "Kubernetes (On-Premise)",
    blurb:
      "On-premise Kubernetes with Node.js, CloudNativePG, BullMQ, KEDA, Cilium, Rook-Ceph, NATS JetStream, Vault, and the LGTM observability stack.",
  },
};

const CONNECT_JSON = `{
  "mcpServers": {
    "dev-knowledge": {
      "url": "${MCP_URL}"
    }
  }
}`;

const CONNECT_AUTH_JSON = `{
  "mcpServers": {
    "dev-knowledge": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer YOUR_MCP_API_KEY" }
    }
  }
}`;

const REMOTE_JSON = `{
  "mcpServers": {
    "dev-knowledge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}",
               "--header", "Authorization: Bearer YOUR_MCP_API_KEY"]
    }
  }
}`;

const EXAMPLE_CALL = `// tools/call -> search_knowledge_base
{
  "query": "prisma connection pool exhausted on vercel",
  "stack": "nextjs-vercel",
  "severity": "high",
  "limit": 3
}`;

const EXAMPLE_RESULT = `{
  "query": "prisma connection pool exhausted on vercel",
  "filters": { "type": null, "severity": "high", "tags": null, "stack": "nextjs-vercel" },
  "count": 1,
  "results": [
    {
      "id": 123,
      "type": "bug_fix",
      "symptoms": ["..."],
      "root_cause": "...",
      "fix": ["step 1", "step 2"],
      "tags": ["prisma", "database", "serverless"],
      "severity": "high",
      "frequency": "common",
      "related_docs": ["https://..."],
      "version": "prisma@5+",
      "stack": "nextjs-vercel",
      "score": 0.8123
    }
  ]
}`;

async function getStats(): Promise<FilterCounts | null> {
  try {
    return await listFilters();
  } catch {
    return null;
  }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ ...card, marginBottom: 0, flex: "1 1 130px", textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#9a9aa5", fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default async function Home() {
  const stats = await getStats();
  const online = stats !== null;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 96px" }}>
      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12,
            color: online ? "#7ee2a8" : "#e2a87e",
            background: online ? "#11271b" : "#2a1f13",
            border: `1px solid ${online ? "#1f6f43" : "#6f4a1f"}`,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: online ? "#3ddc84" : "#dc9a3d",
              display: "inline-block",
            }}
          />
          {online ? "Live" : "Database unreachable"}
        </span>
        <span style={{ fontFamily: mono, fontSize: 12, color: "#6c6c78" }}>mcp-dev-knowledge</span>
      </div>

      <h1 style={{ fontSize: 34, margin: "0 0 10px", letterSpacing: -0.5 }}>
        Dev Knowledge — MCP Server
      </h1>
      <p style={{ color: "#9a9aa5", lineHeight: 1.65, marginTop: 0, fontSize: 15 }}>
        A Model Context Protocol server serving <strong style={{ color: "#cfcfd6" }}>multi-stack
        developer knowledge</strong> to any coding agent. Each tech stack is a separate, isolated
        knowledge base — one of them is a knowledge base of <strong style={{ color: "#cfcfd6" }}>
        Next.js (App Router) and Vercel</strong> issues, errors, config problems, best practices
        and code patterns. Because the stacks never mix, you must <strong style={{ color: "#cfcfd6" }}>
        choose a stack first</strong> (the <code>stack</code> argument is required when searching).
        Backed by Neon Postgres and served from a Vercel serverless function in <code>sin1</code>.
      </p>

      {/* Live stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
        <Stat label="entries indexed" value={online ? stats!.total : "—"} />
        <Stat label="entry types" value={online ? stats!.types.length : "—"} />
        <Stat label="severity levels" value={online ? stats!.severities.length : "—"} />
        <Stat label="tech stacks" value={online ? stats!.stacks.length : "—"} />
      </div>
      {online && stats!.top_tags.length > 0 ? (
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {stats!.top_tags.slice(0, 12).map((t) => (
            <span
              key={t.value}
              style={{
                fontFamily: mono,
                fontSize: 12,
                color: "#b9b9c4",
                background: "#15151c",
                border: "1px solid #26262f",
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {t.value} <span style={{ color: "#6c6c78" }}>{t.count}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* Stacks — strictly isolated knowledge domains */}
      <h2 style={{ fontSize: 19, marginTop: 40 }}>Available stacks — pick one (required)</h2>
      <p style={{ color: "#9a9aa5", fontSize: 14, marginTop: 4 }}>
        Knowledge is partitioned by stack and never crosses boundaries, so{" "}
        <code>search_knowledge_base</code> <strong style={{ color: "#cfcfd6" }}>requires</strong> a{" "}
        <code>stack</code> argument. Call <code>list_knowledge_filters</code> (no stack) to discover
        what exists, then pass one of the values below.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {(online ? stats!.stacks : []).map((s) => {
          const info = STACK_INFO[s.value] ?? { label: s.value, blurb: "" };
          return (
            <div key={s.value} style={{ ...card, flex: "1 1 240px", marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <code style={{ fontFamily: mono, color: "#cfcfd6" }}>{s.value}</code>
                <span style={{ color: "#6c6c78", fontSize: 12 }}>{s.count} entries</span>
              </div>
              <div style={{ color: "#9a9aa5", marginTop: 6, fontSize: 13 }}>{info.blurb}</div>
            </div>
          );
        })}
      </div>

      {/* Connect */}
      <h2 style={{ fontSize: 19, marginTop: 40 }}>Connect (Streamable HTTP)</h2>
      <p style={{ color: "#9a9aa5", fontSize: 14, marginTop: 4 }}>
        Add this to your MCP client config. Endpoint:{" "}
        <code style={{ fontFamily: mono }}>{MCP_URL}</code>
      </p>
      <CodeBlock label="mcp.json (no auth)" code={CONNECT_JSON} />
      <p style={{ color: "#9a9aa5", fontSize: 14 }}>
        If the server has <code>MCP_API_KEY</code> set, send it as a bearer token:
      </p>
      <CodeBlock label="mcp.json (with API key)" code={CONNECT_AUTH_JSON} />
      <p style={{ color: "#9a9aa5", fontSize: 14 }}>
        For stdio-only clients, bridge with{" "}
        <a href="https://www.npmjs.com/package/mcp-remote" style={{ color: "#7eb6ff" }}>
          mcp-remote
        </a>
        :
      </p>
      <CodeBlock label="mcp.json (stdio bridge)" code={REMOTE_JSON} />
      <p style={{ color: "#6c6c78", fontSize: 13 }}>
        Compatible with Cursor, Claude Code / Desktop, Windsurf, Cline, VS Code, and any
        MCP-compliant client.
      </p>

      {/* Tools */}
      <h2 style={{ fontSize: 19, marginTop: 40 }}>Tools</h2>
      {TOOLS.map((t) => (
        <div key={t.name} style={card}>
          <div style={{ fontWeight: 600, fontFamily: mono }}>{t.name}</div>
          <div style={{ color: "#9a9aa5", marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
            {t.desc}
          </div>
          <div style={{ color: "#6c6c78", marginTop: 8, fontSize: 12, fontFamily: mono }}>
            params: {t.params}
          </div>
        </div>
      ))}

      {/* Example */}
      <h2 style={{ fontSize: 19, marginTop: 40 }}>Example</h2>
      <p style={{ color: "#9a9aa5", fontSize: 14, marginTop: 4 }}>
        Tool arguments are typed; <code>search_knowledge_base</code> requires both{" "}
        <code>query</code> and <code>stack</code>. Results come back as a JSON text block{" "}
        <em>and</em> as <code>structuredContent</code>, with errors returned as{" "}
        <code>{`{ "error": ... }`}</code> (never thrown).
      </p>
      <CodeBlock label="request" code={EXAMPLE_CALL} />
      <CodeBlock label="response" code={EXAMPLE_RESULT} />

      <p style={{ color: "#6c6c78", fontSize: 13, marginTop: 40 }}>
        This page is informational. The protocol is served from{" "}
        <code style={{ fontFamily: mono }}>/api/mcp</code> · source on{" "}
        <a href="https://github.com/rachmatm/mcp-dev-knowledge" style={{ color: "#7eb6ff" }}>
          GitHub
        </a>
        .
      </p>
    </main>
  );
}
