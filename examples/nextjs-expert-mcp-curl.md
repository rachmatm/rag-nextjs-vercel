# Next.js Expert MCP Tools — curl Examples

These 20 examples show HTTP requests to call the MCP tools that the `nextjs-expert` Kiro Power and Claude Skill use. All requests go to `https://mcp-dev-knowledge.vercel.app/api/mcp` (or `http://localhost:3000/api/mcp` locally).

**Base URL:** `https://mcp-dev-knowledge.vercel.app/api/mcp`

**Note:** 
- If `MCP_API_KEY` is set on the server, set it as an environment variable and add `-H "Authorization: Bearer $MCP_API_KEY"` to each request, or omit the header if not required.
- The `Accept` header is required by the MCP protocol.

---

## 1. List all available stacks

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_knowledge_filters",
      "arguments": {}
    }
  }'
```

---

## 2. List filters for nextjs-vercel stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_knowledge_filters",
      "arguments": { "stack": "nextjs-vercel" }
    }
  }'
```

---

## 3. Search with simple query (default limit 5)

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "hydration mismatch",
        "stack": "nextjs-vercel"
      }
    }
  }'
```

---

## 4. Search with type filter

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "server component",
        "stack": "nextjs-vercel",
        "type": "bug_fix"
      }
    }
  }'
```

---

## 5. Search with severity filter

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "error",
        "stack": "nextjs-vercel",
        "severity": "high"
      }
    }
  }'
```

---

## 6. Search with tags filter

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "caching",
        "stack": "nextjs-vercel",
        "tags": ["redis", "cache"]
      }
    }
  }'
```

---

## 7. Search with custom limit

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "deployment",
        "stack": "nextjs-vercel",
        "limit": 10
      }
    }
  }'
```

---

## 8. Search with multiple filters combined

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "prisma",
        "stack": "nextjs-vercel",
        "type": "config_issue",
        "severity": "medium",
        "limit": 3
      }
    }
  }'
```

---

## 9. Search react-native stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 9,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "navigation",
        "stack": "react-native"
      }
    }
  }'
```

---

## 10. Search google-oauth stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 10,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "token refresh",
        "stack": "google-oauth"
      }
    }
  }'
```

---

## 11. Search google-calendar stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 11,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "webhook",
        "stack": "google-calendar"
      }
    }
  }'
```

---

## 12. Search google-sheets stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 12,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "batch operations",
        "stack": "google-sheets"
      }
    }
  }'
```

---

## 13. Search kubernetes stack

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 13,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "storage",
        "stack": "kubernetes"
      }
    }
  }'
```

---

## 14. Get knowledge entry by ID

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 14,
    "method": "tools/call",
    "params": {
      "name": "get_knowledge_entry",
      "arguments": { "id": 1 }
    }
  }'
```

---

## 15. Find similar entries (default limit 5)

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 15,
    "method": "tools/call",
    "params": {
      "name": "find_similar_entries",
      "arguments": { "id": 1 }
    }
  }'
```

---

## 16. Find similar entries with custom limit

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 16,
    "method": "tools/call",
    "params": {
      "name": "find_similar_entries",
      "arguments": { "id": 5, "limit": 10 }
    }
  }'
```

---

## 17. Real-world: hydration mismatch (Next.js)

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 17,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "hydration mismatch",
        "stack": "nextjs-vercel"
      }
    }
  }'
```

---

## 18. Real-world: Prisma connection pool exhausted on Vercel

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 18,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "prisma connection pool exhausted on vercel",
        "stack": "nextjs-vercel"
      }
    }
  }'
```

---

## 19. Real-world: Redis sliding window rate limit

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 19,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "redis sliding window rate limit",
        "stack": "nextjs-vercel"
      }
    }
  }'
```

---

## 20. Real-world: next/image domains not allowed

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 20,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {
        "query": "next/image domains not allowed",
        "stack": "nextjs-vercel"
      }
    }
  }'
```

---

## Using with Authorization (if MCP_API_KEY is set)

Add the header to any request:

```bash
curl -s -X POST "https://mcp-dev-knowledge.vercel.app/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_knowledge_filters",
      "arguments": {}
    }
  }'
```

---

## Local Development

Replace the base URL to test locally:

```bash
curl -s -X POST "http://localhost:3000/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_knowledge_filters",
      "arguments": {}
    }
  }'
```