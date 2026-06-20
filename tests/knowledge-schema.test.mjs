// Property tests for knowledge JSON schema compliance.
// ponytail: lightweight self-check, no test framework. Run with `node tests/knowledge-schema.test.mjs`.
// Validates: Requirements 1.3, 1.5, 1.6, 2.3, 2.5, 2.6, 3.3, 3.5, 3.6.

import { readFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, "..", "knowledge");

const FILES = ["google-oauth.json", "google-calendar.json", "google-sheets.json"];

const VALID_SEVERITY = new Set(["low", "medium", "high"]);
const VALID_FREQUENCY = new Set(["rare", "occasional", "common", "very-common"]);

// Case-insensitive forbidden substrings for framework-agnostic content (Property 3).
const FORBIDDEN_SUBSTRINGS = [
  "next-auth",
  "nextauth",
  "prisma",
  "next.js",
  "next/",
  "getServerSideProps",
  "getStaticProps",
  "app router",
  "pages router",
  "vercel",
];

/**
 * Run all three properties against one knowledge file.
 * Returns { file, expectedStack, entryCount, failures: { stack[], schema[], framework[] } }.
 */
function checkFile(filePath) {
  const file = basename(filePath);
  const expectedStack = file.replace(/\.json$/, "");
  const raw = readFileSync(filePath, "utf8");
  const entries = JSON.parse(raw);

  const failures = { stack: [], schema: [], framework: [] };

  if (!Array.isArray(entries)) {
    failures.schema.push({ index: -1, reason: "file is not a JSON array" });
    return { file, expectedStack, entryCount: 0, failures };
  }

  entries.forEach((entry, i) => {
    // Property 1: stack field matches filename-derived id.
    if (entry?.stack !== expectedStack) {
      failures.stack.push({
        index: i,
        reason: `expected stack="${expectedStack}", got ${JSON.stringify(entry?.stack)}`,
      });
    }

    // Property 2: schema compliance.
    const schemaProblems = [];
    if (!Array.isArray(entry?.symptoms) || entry.symptoms.length === 0) {
      schemaProblems.push("symptoms must be a non-empty array");
    }
    if (!Array.isArray(entry?.fix) || entry.fix.length === 0) {
      schemaProblems.push("fix must be a non-empty array");
    }
    if (!Array.isArray(entry?.tags) || entry.tags.length === 0) {
      schemaProblems.push("tags must be a non-empty array");
    }
    if (!VALID_SEVERITY.has(entry?.severity)) {
      schemaProblems.push(
        `severity must be one of ${[...VALID_SEVERITY].join("|")}, got ${JSON.stringify(entry?.severity)}`,
      );
    }
    if (!VALID_FREQUENCY.has(entry?.frequency)) {
      schemaProblems.push(
        `frequency must be one of ${[...VALID_FREQUENCY].join("|")}, got ${JSON.stringify(entry?.frequency)}`,
      );
    }
    if (schemaProblems.length) {
      failures.schema.push({ index: i, reason: schemaProblems.join("; ") });
    }

    // Property 3: framework-agnostic content in fix + symptoms.
    const text = [
      ...(Array.isArray(entry?.symptoms) ? entry.symptoms : []),
      ...(Array.isArray(entry?.fix) ? entry.fix : []),
    ]
      .filter((s) => typeof s === "string")
      .join("\n")
      .toLowerCase();
    const hits = FORBIDDEN_SUBSTRINGS.filter((s) => text.includes(s.toLowerCase()));
    if (hits.length) {
      failures.framework.push({
        index: i,
        reason: `forbidden substrings found: ${hits.join(", ")}`,
      });
    }
  });

  return { file, expectedStack, entryCount: entries.length, failures };
}

function formatFailures(label, list) {
  if (list.length === 0) return `    ✓ ${label}`;
  const lines = [`    ✗ ${label} (${list.length} failure${list.length === 1 ? "" : "s"})`];
  for (const f of list) {
    lines.push(`        - entry[${f.index}]: ${f.reason}`);
  }
  return lines.join("\n");
}

let totalFailures = 0;
console.log("Knowledge JSON schema property checks\n");

for (const name of FILES) {
  const result = checkFile(join(KNOWLEDGE_DIR, name));
  const { file, expectedStack, entryCount, failures } = result;
  const fileFailureCount =
    failures.stack.length + failures.schema.length + failures.framework.length;
  totalFailures += fileFailureCount;
  const mark = fileFailureCount === 0 ? "✓" : "✗";
  console.log(`${mark} ${file}  (stack="${expectedStack}", ${entryCount} entries)`);
  console.log(formatFailures("Property 1: stack field matches filename", failures.stack));
  console.log(formatFailures("Property 2: schema compliance", failures.schema));
  console.log(formatFailures("Property 3: framework-agnostic content", failures.framework));
  console.log("");
}

if (totalFailures === 0) {
  console.log("All properties hold across all files.");
  process.exit(0);
} else {
  console.log(`FAILED: ${totalFailures} property violation${totalFailures === 1 ? "" : "s"}.`);
  process.exit(1);
}
