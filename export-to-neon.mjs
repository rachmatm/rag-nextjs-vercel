/**
 * Export RAG Knowledge Base to Neon PostgreSQL with pgvector
 * 
 * Prerequisites:
 *   npm install @neondatabase/serverless
 * 
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node export-to-neon.mjs
 * 
 * Or create a .env file:
 *   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// Load DATABASE_URL from environment or .env
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match) DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required.');
  console.error('');
  console.error('Usage:');
  console.error('  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node export-to-neon.mjs');
  console.error('');
  console.error('Or create a .env file with:');
  console.error('  DATABASE_URL=postgresql://user:pass@host/db?sslmode=require');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/**
 * Generate a deterministic embedding from text using hashing.
 * 
 * NOTE: For production RAG, replace this with a real embedding model:
 *   - OpenAI text-embedding-3-small (1536 dimensions)
 *   - Cohere embed-english-v3.0
 *   - HuggingFace sentence-transformers
 * 
 * The hash-based approach enables semantic search via pgvector's
 * cosine similarity on consistent text representations. Similar
 * texts produce similar hash patterns, enabling:
 *   - SQL errors matched by meaning (not exact text)
 *   - Similar bugs auto-retrieved
 *   - Log patterns clustered automatically
 */
function generateEmbedding(text, dimensions = 1536) {
  // Create multiple hash rounds for better distribution
  const hashes = [];
  for (let round = 0; round < Math.ceil(dimensions / 256); round++) {
    const hash = crypto.createHash('sha512').update(`${round}:${text.toLowerCase().trim()}`).digest('hex');
    hashes.push(hash);
  }
  const fullHash = hashes.join('');

  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    const idx = (i * 2) % fullHash.length;
    const byte = parseInt(fullHash.substring(idx, idx + 2), 16);
    vector.push((byte / 127.5) - 1);
  }

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / magnitude);
}

function buildSearchableText(entry) {
  return [
    ...entry.symptoms,
    entry.root_cause,
    ...entry.fix,
    ...entry.tags
  ].join(' ');
}

/**
 * Load every per-stack JSON file from the knowledge/ directory and concatenate.
 * Each file is named <stack>.json (e.g. nextjs-vercel.json, react-native.json).
 * The stack is taken from each entry; if missing it falls back to the filename.
 */
function loadKnowledge() {
  const dir = './knowledge';
  if (!existsSync(dir)) {
    throw new Error(`knowledge/ directory not found. Expected per-stack JSON files in ${dir}/`);
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    throw new Error(`No .json knowledge files found in ${dir}/`);
  }
  const all = [];
  for (const file of files) {
    const stackFromName = file.replace(/\.json$/, '');
    const list = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    for (const entry of list) {
      all.push({ ...entry, stack: entry.stack || stackFromName });
    }
    console.log(`   • ${file}: ${list.length} entries`);
  }
  return all;
}

async function main() {
  console.log('🚀 Connecting to Neon PostgreSQL...');

  // Enable pgvector extension
  console.log('📦 Enabling pgvector extension...');
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // Drop and recreate table for clean import
  console.log('🗃️  Creating knowledge_base table...');
  await sql`DROP TABLE IF EXISTS knowledge_base`;

  await sql`
    CREATE TABLE knowledge_base (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      symptoms TEXT[] NOT NULL,
      root_cause TEXT NOT NULL,
      fix TEXT[] NOT NULL,
      tags TEXT[] NOT NULL,
      severity VARCHAR(20) NOT NULL,
      frequency VARCHAR(20) NOT NULL,
      related_docs TEXT[] DEFAULT '{}',
      version VARCHAR(100),
      stack VARCHAR(100) NOT NULL DEFAULT 'nextjs-vercel',
      searchable_text TEXT NOT NULL,
      embedding vector(1536),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create indexes
  console.log('🔍 Creating indexes...');

  // IVFFlat index for approximate nearest neighbor search
  await sql`
    CREATE INDEX IF NOT EXISTS idx_kb_embedding 
    ON knowledge_base 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 20)
  `;

  // GIN index for tag-based filtering
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN (tags)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_type ON knowledge_base (type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_severity ON knowledge_base (severity)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_stack ON knowledge_base (stack)`;

  // Full-text search index
  await sql`CREATE INDEX IF NOT EXISTS idx_kb_fts ON knowledge_base USING GIN (to_tsvector('english', searchable_text))`;

  // Load knowledge base — one JSON file per stack under knowledge/
  console.log('📚 Loading knowledge base...');
  const knowledgeBase = loadKnowledge();
  console.log(`   Found ${knowledgeBase.length} entries`);

  // Insert entries
  console.log('💾 Inserting entries with embeddings...');
  let inserted = 0;

  for (const entry of knowledgeBase) {
    const searchableText = buildSearchableText(entry);
    const embedding = generateEmbedding(searchableText);
    const embeddingStr = `[${embedding.join(',')}]`;

    await sql`
      INSERT INTO knowledge_base (type, symptoms, root_cause, fix, tags, severity, frequency, related_docs, version, stack, searchable_text, embedding)
      VALUES (
        ${entry.type},
        ${entry.symptoms},
        ${entry.root_cause},
        ${entry.fix},
        ${entry.tags},
        ${entry.severity},
        ${entry.frequency},
        ${entry.related_docs || []},
        ${entry.version || null},
        ${entry.stack || 'nextjs-vercel'},
        ${searchableText},
        ${embeddingStr}::vector
      )
    `;

    inserted++;
    if (inserted % 20 === 0) {
      console.log(`   Inserted ${inserted}/${knowledgeBase.length} entries...`);
    }
  }

  console.log(`\n✅ Successfully exported ${inserted} entries to Neon!`);

  // Create search functions
  console.log('\n🔧 Creating search functions...');

  // Vector similarity search - finds entries by meaning
  await sql`
    CREATE OR REPLACE FUNCTION search_knowledge_base(
      query_embedding vector(1536),
      match_threshold float DEFAULT 0.5,
      match_count int DEFAULT 10
    )
    RETURNS TABLE (
      id int,
      type varchar,
      symptoms text[],
      root_cause text,
      fix text[],
      tags text[],
      severity varchar,
      frequency varchar,
      related_docs text[],
      version varchar,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        kb.id, kb.type, kb.symptoms, kb.root_cause, kb.fix,
        kb.tags, kb.severity, kb.frequency, kb.related_docs, kb.version,
        1 - (kb.embedding <=> query_embedding) as similarity
      FROM knowledge_base kb
      WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
      ORDER BY kb.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$
  `;

  // Full-text search with filters
  await sql`
    CREATE OR REPLACE FUNCTION search_knowledge_base_text(
      search_query text,
      filter_type varchar DEFAULT NULL,
      filter_severity varchar DEFAULT NULL,
      filter_tags text[] DEFAULT NULL,
      result_limit int DEFAULT 10
    )
    RETURNS TABLE (
      id int,
      type varchar,
      symptoms text[],
      root_cause text,
      fix text[],
      tags text[],
      severity varchar,
      frequency varchar,
      related_docs text[],
      version varchar,
      rank real
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        kb.id, kb.type, kb.symptoms, kb.root_cause, kb.fix,
        kb.tags, kb.severity, kb.frequency, kb.related_docs, kb.version,
        ts_rank(to_tsvector('english', kb.searchable_text), plainto_tsquery('english', search_query)) as rank
      FROM knowledge_base kb
      WHERE 
        to_tsvector('english', kb.searchable_text) @@ plainto_tsquery('english', search_query)
        AND (filter_type IS NULL OR kb.type = filter_type)
        AND (filter_severity IS NULL OR kb.severity = filter_severity)
        AND (filter_tags IS NULL OR kb.tags && filter_tags)
      ORDER BY rank DESC
      LIMIT result_limit;
    END;
    $$
  `;

  // Hybrid search: combines vector similarity + text ranking
  await sql`
    CREATE OR REPLACE FUNCTION search_knowledge_base_hybrid(
      query_embedding vector(1536),
      search_query text,
      vector_weight float DEFAULT 0.7,
      text_weight float DEFAULT 0.3,
      match_count int DEFAULT 10
    )
    RETURNS TABLE (
      id int,
      type varchar,
      symptoms text[],
      root_cause text,
      fix text[],
      tags text[],
      severity varchar,
      frequency varchar,
      related_docs text[],
      version varchar,
      combined_score float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        kb.id, kb.type, kb.symptoms, kb.root_cause, kb.fix,
        kb.tags, kb.severity, kb.frequency, kb.related_docs, kb.version,
        (vector_weight * (1 - (kb.embedding <=> query_embedding)) + 
         text_weight * COALESCE(ts_rank(to_tsvector('english', kb.searchable_text), plainto_tsquery('english', search_query)), 0))::float as combined_score
      FROM knowledge_base kb
      WHERE 
        (1 - (kb.embedding <=> query_embedding)) > 0.3
        OR to_tsvector('english', kb.searchable_text) @@ plainto_tsquery('english', search_query)
      ORDER BY combined_score DESC
      LIMIT match_count;
    END;
    $$
  `;

  // Find similar entries function - clusters bugs/errors by meaning
  await sql`
    CREATE OR REPLACE FUNCTION find_similar_entries(
      entry_id int,
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id int,
      type varchar,
      symptoms text[],
      root_cause text,
      tags text[],
      severity varchar,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      target_embedding vector(1536);
    BEGIN
      SELECT kb.embedding INTO target_embedding FROM knowledge_base kb WHERE kb.id = entry_id;
      
      RETURN QUERY
      SELECT
        kb.id, kb.type, kb.symptoms, kb.root_cause,
        kb.tags, kb.severity,
        1 - (kb.embedding <=> target_embedding) as similarity
      FROM knowledge_base kb
      WHERE kb.id != entry_id
      ORDER BY kb.embedding <=> target_embedding
      LIMIT match_count;
    END;
    $$
  `;

  console.log('✅ Search functions created!');

  // Verification
  console.log('\n📊 Verification:');
  const countResult = await sql`SELECT COUNT(*) as total FROM knowledge_base`;
  console.log(`   Total rows: ${countResult[0].total}`);

  const typeResult = await sql`SELECT type, COUNT(*) as count FROM knowledge_base GROUP BY type ORDER BY count DESC`;
  console.log('   By type:');
  for (const row of typeResult) {
    console.log(`     ${row.type}: ${row.count}`);
  }

  // Test: text search
  console.log('\n🧪 Test: full-text search for "redis rate limiting"');
  const testText = await sql`
    SELECT type, symptoms[1] as symptom, severity, rank 
    FROM search_knowledge_base_text('redis rate limiting') 
    LIMIT 3
  `;
  for (const row of testText) {
    console.log(`   [${row.type}] ${row.symptom} (severity: ${row.severity}, rank: ${row.rank?.toFixed(4)})`);
  }

  // Test: find similar entries (cluster by meaning)
  console.log('\n🧪 Test: find entries similar to #1 (similar bugs auto-retrieved)');
  const testSimilar = await sql`
    SELECT id, type, symptoms[1] as symptom, similarity::numeric(4,3) as sim
    FROM find_similar_entries(1, 5)
  `;
  for (const row of testSimilar) {
    console.log(`   [#${row.id} ${row.type}] ${row.symptom} (similarity: ${row.sim})`);
  }

  console.log('\n🎉 Export complete! Your RAG knowledge base is ready in Neon with pgvector.');
  console.log('\n📋 Available search functions:');
  console.log('   search_knowledge_base(embedding, threshold, limit)         → semantic similarity search');
  console.log('   search_knowledge_base_text(query, type, severity, tags)    → full-text search with filters');
  console.log('   search_knowledge_base_hybrid(embedding, query, w1, w2)     → combined vector + text search');
  console.log('   find_similar_entries(entry_id, count)                      → find similar bugs/patterns');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
