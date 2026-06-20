const TOOLS = [
  {
    name: "search_knowledge_base",
    desc: "Full-text search over the knowledge base. Filters: type, severity, tags, stack, limit.",
  },
  {
    name: "get_knowledge_entry",
    desc: "Fetch a single entry by its numeric id.",
  },
  {
    name: "find_similar_entries",
    desc: "Find entries related to a given id by shared tags.",
  },
  {
    name: "list_knowledge_filters",
    desc: "Discover valid filter values (types, severities, tags, stacks) and counts.",
  },
];

const card: React.CSSProperties = {
  background: "#15151c",
  border: "1px solid #26262f",
  borderRadius: 12,
  padding: "16px 18px",
  marginBottom: 12,
};

export default function Home() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 80px" }}>
      <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>RAG Next.js + Vercel — MCP Server</h1>
      <p style={{ color: "#9a9aa5", lineHeight: 1.6, marginTop: 0 }}>
        A Model Context Protocol (MCP) server that serves a curated knowledge base of Next.js
        (App Router) and Vercel issues, errors, configuration problems, best practices and code
        patterns. Backed by Neon Postgres and deployed as a Vercel serverless function.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Connect (Streamable HTTP)</h2>
      <pre
        style={{
          ...card,
          overflowX: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
        }}
      >
        {`{
  "mcpServers": {
    "rag-nextjs-vercel": {
      "url": "https://<your-deployment>.vercel.app/api/mcp"
    }
  }
}`}
      </pre>
      <p style={{ color: "#9a9aa5", fontSize: 14 }}>
        Endpoint: <code>/api/mcp</code> · Transport: Streamable HTTP · Works with Cursor, Claude
        Code/Desktop, Windsurf, Cline, VS Code and any MCP-compatible client.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Tools</h2>
      {TOOLS.map((t) => (
        <div key={t.name} style={card}>
          <div style={{ fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>{t.name}</div>
          <div style={{ color: "#9a9aa5", marginTop: 4, fontSize: 14 }}>{t.desc}</div>
        </div>
      ))}

      <p style={{ color: "#6c6c78", fontSize: 13, marginTop: 32 }}>
        This page is informational only. The MCP protocol is served from <code>/api/mcp</code>.
      </p>
    </main>
  );
}
