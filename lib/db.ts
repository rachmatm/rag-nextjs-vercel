import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Shape of a knowledge-base entry as returned to MCP clients.
 * Mirrors the columns of the `knowledge_base` table created by export-to-neon.mjs.
 */
export interface KnowledgeEntry {
  id: number;
  type: string;
  symptoms: string[];
  root_cause: string;
  fix: string[];
  tags: string[];
  severity: string;
  frequency: string;
  related_docs: string[];
  version: string | null;
  stack: string;
  /** Relevance score (full-text rank) when returned from a search. */
  score?: number;
  /** Number of overlapping tags when returned from find_similar. */
  shared_tags?: number;
}

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Lazily create (and reuse) the Neon serverless SQL client.
 * The connection string is read from the DATABASE_URL environment variable.
 */
function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in your environment (Vercel Project Settings or .env)."
    );
  }
  _sql = neon(url);
  return _sql;
}

const ENTRY_COLUMNS = `id, type, symptoms, root_cause, fix, tags, severity, frequency, related_docs, version, stack`;

/**
 * Tech stacks are kept STRICTLY ISOLATED: a search only ever returns entries
 * from a single stack, so Next.js/Vercel knowledge never leaks into React Native
 * work and vice versa. New stacks can be added to the data without code changes.
 */
export const KNOWN_STACKS = [
  "nextjs-vercel",
  "react-native",
  "google-oauth",
  "google-calendar",
  "google-sheets",
  "kubernetes",
  "transformers-js",
] as const;
export const DEFAULT_STACK = "nextjs-vercel";

export interface SearchParams {
  query: string;
  type?: string;
  severity?: string;
  tags?: string[];
  /** Required: results are always scoped to exactly one stack. */
  stack: string;
  limit?: number;
}

/**
 * Full-text search over the knowledge base with optional metadata filters.
 *
 * The `stack` is REQUIRED: results are always scoped to exactly one stack so
 * unrelated stacks never mix in the output.
 *
 * Strategy:
 *  1. Rank with `websearch_to_tsquery` (handles quotes, operators, stop words gracefully).
 *  2. If that yields nothing (e.g. exact error codes / identifiers), fall back to a
 *     substring (ILIKE) match so things like "ERR_MODULE_NOT_FOUND" still resolve.
 */
export async function searchKnowledge(params: SearchParams): Promise<KnowledgeEntry[]> {
  const sql = getSql();
  const limit = clampLimit(params.limit, 5);
  const type = nullIfEmpty(params.type);
  const severity = nullIfEmpty(params.severity);
  // The stack is required so knowledge domains never mix.
  const stack = nullIfEmpty(params.stack);
  if (!stack) {
    throw new Error(
      `The "stack" argument is required. Choose exactly one of: ${KNOWN_STACKS.join(", ")}. ` +
        `Call list_knowledge_filters (without a stack) to see all available stacks and their entry counts.`
    );
  }
  const tags = params.tags && params.tags.length > 0 ? params.tags : null;

  const ftsQuery = `
    SELECT ${ENTRY_COLUMNS},
      ts_rank(to_tsvector('english', searchable_text), websearch_to_tsquery('english', $1))::float AS score
    FROM knowledge_base
    WHERE to_tsvector('english', searchable_text) @@ websearch_to_tsquery('english', $1)
      AND ($2::varchar IS NULL OR type = $2)
      AND ($3::varchar IS NULL OR severity = $3)
      AND ($4::text[] IS NULL OR tags && $4)
      AND ($5::varchar IS NULL OR stack = $5)
    ORDER BY score DESC
    LIMIT $6
  `;
  const ftsParams = [params.query, type, severity, tags, stack, limit];
  const rows = (await sql.query(ftsQuery, ftsParams)) as KnowledgeEntry[];
  if (rows.length > 0) return rows;

  // Fallback: substring match for identifiers / error codes / partial tokens.
  const likeQuery = `
    SELECT ${ENTRY_COLUMNS}, 0::float AS score
    FROM knowledge_base
    WHERE searchable_text ILIKE '%' || $1 || '%'
      AND ($2::varchar IS NULL OR type = $2)
      AND ($3::varchar IS NULL OR severity = $3)
      AND ($4::text[] IS NULL OR tags && $4)
      AND ($5::varchar IS NULL OR stack = $5)
    ORDER BY length(searchable_text) ASC
    LIMIT $6
  `;
  return (await sql.query(likeQuery, ftsParams)) as KnowledgeEntry[];
}

/** Fetch a single entry by its numeric id. */
export async function getEntry(id: number): Promise<KnowledgeEntry | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${ENTRY_COLUMNS} FROM knowledge_base WHERE id = $1`,
    [id]
  )) as KnowledgeEntry[];
  return rows[0] ?? null;
}

/**
 * Find entries related to a given entry by tag overlap (and same type as a tie-breaker).
 * Results are restricted to the SAME stack as the reference entry, so related
 * suggestions never cross stack boundaries.
 */
export async function findSimilar(id: number, limit = 5): Promise<KnowledgeEntry[]> {
  const sql = getSql();
  const n = clampLimit(limit, 5);
  const query = `
    WITH target AS (
      SELECT tags, type, stack FROM knowledge_base WHERE id = $1
    )
    SELECT ${prefixColumns("kb")},
      cardinality(ARRAY(
        SELECT unnest(kb.tags) INTERSECT SELECT unnest(t.tags)
      )) AS shared_tags
    FROM knowledge_base kb, target t
    WHERE kb.id <> $1
      AND kb.stack = t.stack
      AND kb.tags && t.tags
    ORDER BY shared_tags DESC, (kb.type = t.type) DESC, kb.id ASC
    LIMIT $2
  `;
  return (await sql.query(query, [id, n])) as KnowledgeEntry[];
}

export interface FilterCounts {
  total: number;
  stack: string | null;
  types: { value: string; count: number }[];
  severities: { value: string; count: number }[];
  frequencies: { value: string; count: number }[];
  stacks: { value: string; count: number }[];
  top_tags: { value: string; count: number }[];
}

/** Return the distinct filter values (and counts) available, to guide query construction. */
export async function listFilters(stack?: string): Promise<FilterCounts> {
  const sql = getSql();
  const s = nullIfEmpty(stack);
  const whereStack = `($1::varchar IS NULL OR stack = $1)`;

  const [total, types, severities, frequencies, stacks, tags] = await Promise.all([
    sql.query(`SELECT COUNT(*)::int AS c FROM knowledge_base WHERE ${whereStack}`, [s]),
    sql.query(
      `SELECT type AS value, COUNT(*)::int AS count FROM knowledge_base WHERE ${whereStack} GROUP BY type ORDER BY count DESC`,
      [s]
    ),
    sql.query(
      `SELECT severity AS value, COUNT(*)::int AS count FROM knowledge_base WHERE ${whereStack} GROUP BY severity ORDER BY count DESC`,
      [s]
    ),
    sql.query(
      `SELECT frequency AS value, COUNT(*)::int AS count FROM knowledge_base WHERE ${whereStack} GROUP BY frequency ORDER BY count DESC`,
      [s]
    ),
    sql.query(
      `SELECT stack AS value, COUNT(*)::int AS count FROM knowledge_base GROUP BY stack ORDER BY count DESC`
    ),
    sql.query(
      `SELECT tag AS value, COUNT(*)::int AS count
       FROM knowledge_base, unnest(tags) AS tag
       WHERE ${whereStack}
       GROUP BY tag ORDER BY count DESC LIMIT 40`,
      [s]
    ),
  ]);

  return {
    total: (total as { c: number }[])[0]?.c ?? 0,
    stack: s,
    types: types as { value: string; count: number }[],
    severities: severities as { value: string; count: number }[],
    frequencies: frequencies as { value: string; count: number }[],
    stacks: stacks as { value: string; count: number }[],
    top_tags: tags as { value: string; count: number }[],
  };
}

function clampLimit(value: number | undefined, fallback: number): number {
  if (!value || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), 20);
}

function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function prefixColumns(alias: string): string {
  return ENTRY_COLUMNS.split(",")
    .map((c) => `${alias}.${c.trim()}`)
    .join(", ");
}
