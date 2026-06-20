// Property tests for the six Google API persona artifacts.
// ponytail: lightweight self-check, no test framework. Run with `node tests/persona-artifacts.test.mjs`.
// Validates: Requirements 19.2, 19.3, 19.4.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// One row per artifact. activeStack is the persona's domain — both the Kiro and
// Claude variants of a persona share the same Active_Stack.
const ARTIFACTS = [
  {
    label: "kiro-powers/google-oauth-expert/steering/google-oauth-expert.md",
    activeStack: "google-oauth",
  },
  {
    label: "kiro-powers/google-calendar-expert/steering/google-calendar-expert.md",
    activeStack: "google-calendar",
  },
  {
    label: "kiro-powers/google-sheets-expert/steering/google-sheets-expert.md",
    activeStack: "google-sheets",
  },
  {
    label: "claude-skills/google-oauth-expert/SKILL.md",
    activeStack: "google-oauth",
  },
  {
    label: "claude-skills/google-calendar-expert/SKILL.md",
    activeStack: "google-calendar",
  },
  {
    label: "claude-skills/google-sheets-expert/SKILL.md",
    activeStack: "google-sheets",
  },
];

const FALLBACK_LABEL = "[ungrounded \u2014 general expertise]"; // U+2014 em dash, exact bytes.

/**
 * Locate a heading in `content`. Match is case-insensitive on the literal
 * heading line (e.g. `## Install_Verify_Protocol`). Returns the byte offset of
 * the match, or -1 if not present.
 */
function findHeading(content, heading) {
  const idx = content.toLowerCase().indexOf(heading.toLowerCase());
  return idx;
}

/**
 * Run all three properties against one artifact.
 * Returns { artifact, results: { p6, p7, p8 } } where each result is
 * { ok: boolean, reason?: string }.
 */
function checkArtifact(artifact) {
  const fullPath = join(ROOT, artifact.label);
  const content = readFileSync(fullPath, "utf8");

  // Property 6: `## Install_Verify_Protocol` precedes `## Lookup protocol`.
  const installIdx = findHeading(content, "## Install_Verify_Protocol");
  const lookupIdx = findHeading(content, "## Lookup protocol");
  let p6;
  if (installIdx === -1 && lookupIdx === -1) {
    p6 = { ok: false, reason: "neither `## Install_Verify_Protocol` nor `## Lookup protocol` heading found" };
  } else if (installIdx === -1) {
    p6 = { ok: false, reason: "`## Install_Verify_Protocol` heading not found" };
  } else if (lookupIdx === -1) {
    p6 = { ok: false, reason: "`## Lookup protocol` heading not found" };
  } else if (installIdx >= lookupIdx) {
    p6 = {
      ok: false,
      reason: `Install_Verify_Protocol at offset ${installIdx} is not strictly before Lookup protocol at offset ${lookupIdx}`,
    };
  } else {
    p6 = { ok: true };
  }

  // Property 7: contains `knowledge/<active-stack>.json` literal.
  const expectedRef = `knowledge/${artifact.activeStack}.json`;
  const p7 = content.includes(expectedRef)
    ? { ok: true }
    : { ok: false, reason: `expected literal \`${expectedRef}\` not found` };

  // Property 8: contains the Fallback Label verbatim (exact bytes, em dash U+2014).
  const p8 = content.includes(FALLBACK_LABEL)
    ? { ok: true }
    : { ok: false, reason: `expected literal \`${FALLBACK_LABEL}\` not found` };

  return { artifact, results: { p6, p7, p8 } };
}

function formatResult(label, result) {
  if (result.ok) return `    \u2713 ${label}`;
  return `    \u2717 ${label}\n        - ${result.reason}`;
}

console.log("Persona artifact property checks\n");

let totalFailures = 0;
const propertyTotals = { p6: 0, p7: 0, p8: 0 };

for (const artifact of ARTIFACTS) {
  const { results } = checkArtifact(artifact);
  const fileFailures = Object.values(results).filter((r) => !r.ok).length;
  totalFailures += fileFailures;
  for (const key of Object.keys(propertyTotals)) {
    if (!results[key].ok) propertyTotals[key] += 1;
  }
  const mark = fileFailures === 0 ? "\u2713" : "\u2717";
  console.log(`${mark} ${artifact.label}  (active-stack="${artifact.activeStack}")`);
  console.log(formatResult("Property 6: Install_Verify_Protocol precedes Lookup protocol", results.p6));
  console.log(formatResult("Property 7: Gap Capture references correct knowledge file", results.p7));
  console.log(formatResult("Property 8: Fallback Label literal consistency", results.p8));
  console.log("");
}

console.log("Summary by property:");
console.log(`    Property 6 failures: ${propertyTotals.p6}`);
console.log(`    Property 7 failures: ${propertyTotals.p7}`);
console.log(`    Property 8 failures: ${propertyTotals.p8}`);
console.log("");

if (totalFailures === 0) {
  console.log("All properties hold across all six persona artifacts.");
  process.exit(0);
} else {
  console.log(`FAILED: ${totalFailures} property violation${totalFailures === 1 ? "" : "s"}.`);
  process.exit(1);
}
