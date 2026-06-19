# RAG Knowledge Base - Next.js on Vercel

A structured JSON knowledge base designed for Retrieval-Augmented Generation (RAG) systems, covering common issues, patterns, and solutions for **Next.js applications hosted on Vercel**.

## Schema

Each entry follows this structure:

```json
{
  "type": "bug_fix | error | log_pattern | config_issue | doc | code_pattern | fix_snippet | diagnostic_step | root_cause | performance_case",
  "symptoms": ["array of symptoms or search queries that match this entry"],
  "root_cause": "description of the underlying cause",
  "fix": ["array of fix steps or solutions"],
  "tags": ["array of tags for filtering and categorization"]
}
```

## Types

| Type | Description |
|------|-------------|
| `bug_fix` | Known bugs with confirmed fixes |
| `error` | Runtime errors and their resolutions |
| `log_pattern` | Warning/error log patterns and their meaning |
| `config_issue` | Configuration problems and corrections |
| `doc` | How-to documentation and setup guides |
| `code_pattern` | Best practice code patterns |
| `fix_snippet` | Ready-to-use code solutions |
| `diagnostic_step` | Step-by-step debugging procedures |
| `root_cause` | Deep-dive root cause analysis |
| `performance_case` | Performance optimization cases |

## Coverage

- **Routing & Deployment** - Dynamic routes, 404s, middleware
- **API Routes** - Timeouts, CORS, edge runtime
- **React/SSR** - Hydration, rendering, hooks
- **Authentication** - NextAuth, cookies, sessions
- **Performance** - Bundle size, cold starts, images, database
- **Configuration** - Environment variables, build settings, caching
- **Data Fetching** - Server components, ISR, revalidation

## Usage

Load `knowledge-base.json` into your RAG vector store. Each entry's `symptoms` array provides natural-language queries that should match the entry, while `tags` enable filtered retrieval.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Hosting:** Vercel
- **Runtime:** Node.js / Edge Runtime
