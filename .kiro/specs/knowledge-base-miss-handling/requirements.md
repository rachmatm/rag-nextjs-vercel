# Requirements Document

## Introduction

The two existing Kiro powers — **Next.js / Vercel Expert** (`nextjs-vercel` stack) and **React Native Expert** (`react-native` stack) — currently instruct their agent to call `search_knowledge_base` first and, on a miss, "fall back to general expertise". This single-shot fallback is too eager. It treats one empty search as proof that the knowledge base has nothing relevant, even when a paraphrase, a tag drop, a vocabulary check, or a similar-entry pivot would surface a real grounded answer. It also leaves the user unable to distinguish a vetted, KB-grounded answer from a general-knowledge guess, and never captures the fact that a useful entry is missing from `knowledge/<stack>.json`.

This feature hardens the knowledge-base lookup protocol in both steering files so that the agent: (1) retries before giving up, (2) pivots through similar entries on partial hits, (3) explicitly flags ungrounded answers, and (4) surfaces missing topics as candidate new entries for the operator to add. The two steering files must receive equivalent enhancements parameterized only by their stack value (`nextjs-vercel` vs `react-native`); the matching `POWER.md` files must be updated only where user-facing behavior described there changes.

This is a documentation-only change. No code under `app/`, `lib/`, `knowledge/`, or `export-to-neon.mjs` is modified.

## Glossary

- **Steering File**: A markdown file under `kiro-powers/<power-name>/steering/` with `inclusion: manual` front-matter. The Kiro runtime injects its body as instructions into the agent when the power is activated.
- **Power File**: The `POWER.md` user-facing description under `kiro-powers/<power-name>/`. Documents what the power does and how to use it.
- **Nextjs_Steering_File**: The file at `kiro-powers/nextjs-expert/steering/nextjs-expert.md`.
- **ReactNative_Steering_File**: The file at `kiro-powers/react-native-expert/steering/react-native-expert.md`.
- **Nextjs_Power_File**: The file at `kiro-powers/nextjs-expert/POWER.md`.
- **ReactNative_Power_File**: The file at `kiro-powers/react-native-expert/POWER.md`.
- **Stack**: The strictly-isolated knowledge partition the power operates on. Either `nextjs-vercel` or `react-native`. Stacks never mix.
- **MCP Tools**: The four tools exposed by the `dev-knowledge` MCP server: `search_knowledge_base`, `get_knowledge_entry`, `find_similar_entries`, `list_knowledge_filters`.
- **Empty Result**: A `search_knowledge_base` response whose results array length is 0 or whose `structuredContent.count` is 0.
- **Low_Relevance Result**: A `search_knowledge_base` response that returns one or more ranked entries where the top entry satisfies at least one of: (a) the top entry's `root_cause` and `fix` do not address the symptoms in the user's question, or (b) the top entry's tags overlap the question by no more than one tag.
- **True Miss**: The state reached only after all permitted retries up to the retry cap have returned Empty Results, or after the similar-entries pivot has been exhausted without finding a grounded answer. Triggers the gap-capture and fallback-labeling behaviors.
- **Lookup Protocol**: The end-to-end sequence of MCP calls the agent performs to attempt a grounded answer, including the broaden-and-retry steps, the similar-entries pivot, and the termination condition.
- **Gap Capture**: A short, structured message the agent presents to the user when a True Miss occurs, proposing a candidate new entry to add to `knowledge/<stack>.json`.
- **Fallback Label**: An explicit prefix on any answer not grounded in a knowledge-base entry, telling the user the answer comes from general expertise rather than a vetted entry.
- **Grounded Answer**: An answer that cites at least one numeric `id` returned verbatim by a `dev-knowledge` MCP tool call made in the same turn.

## Requirements

### Requirement 1: Hardened lookup protocol in both steering files

**User Story:** As a developer using one of the experts, I want the agent to try harder before giving up on the knowledge base, so that paraphrasable questions and over-filtered queries still find vetted answers.

#### Acceptance Criteria

1. THE Nextjs_Steering_File SHALL contain a markdown heading with the exact text "Lookup protocol" followed by an ordered numbered list that defines the sequence the agent follows on every Next.js / Vercel question that could be grounded in the knowledge base.
2. THE ReactNative_Steering_File SHALL contain a markdown heading with the exact text "Lookup protocol" followed by an ordered numbered list that defines the sequence the agent follows on every React Native question that could be grounded in the knowledge base.
3. THE Nextjs_Steering_File SHALL instruct the agent, as step 1 of the numbered list under the "Lookup protocol" heading, to call `search_knowledge_base` with `stack: "nextjs-vercel"`.
4. THE ReactNative_Steering_File SHALL instruct the agent, as step 1 of the numbered list under the "Lookup protocol" heading, to call `search_knowledge_base` with `stack: "react-native"`.
5. WHEN a `search_knowledge_base` call returns an Empty Result, THE Nextjs_Steering_File SHALL instruct the agent to retry at least once before declaring a True Miss, using at least one of: a paraphrased `query`, dropping `type` and `tags` filters, or calling `list_knowledge_filters` with `stack: "nextjs-vercel"` to discover the correct vocabulary and re-querying with adjusted filters.
6. WHEN a `search_knowledge_base` call returns an Empty Result, THE ReactNative_Steering_File SHALL instruct the agent to retry at least once before declaring a True Miss, using at least one of: a paraphrased `query`, dropping `type` and `tags` filters, or calling `list_knowledge_filters` with `stack: "react-native"` to discover the correct vocabulary and re-querying with adjusted filters.
7. THE Nextjs_Steering_File SHALL cap retry attempts at no more than 3 additional `search_knowledge_base` calls (4 total including the initial call) and SHALL define a True Miss inline as the state reached only after all permitted retries up to that cap have returned Empty Results.
8. THE ReactNative_Steering_File SHALL cap retry attempts at no more than 3 additional `search_knowledge_base` calls (4 total including the initial call) and SHALL define a True Miss inline as the state reached only after all permitted retries up to that cap have returned Empty Results.
9. THE Nextjs_Steering_File SHALL preserve the existing stack-isolation rule that forbids querying any stack other than `nextjs-vercel` and SHALL extend that rule to apply to every retry attempt within the Lookup Protocol.
10. THE ReactNative_Steering_File SHALL preserve the existing stack-isolation rule that forbids querying any stack other than `react-native` and SHALL extend that rule to apply to every retry attempt within the Lookup Protocol.
11. IF a True Miss is declared, THEN THE Nextjs_Steering_File SHALL instruct the agent to notify the user that no vetted answer was found in the `nextjs-vercel` knowledge base, fall back to general knowledge to answer, and never query any stack other than `nextjs-vercel`.
12. IF a True Miss is declared, THEN THE ReactNative_Steering_File SHALL instruct the agent to notify the user that no vetted answer was found in the `react-native` knowledge base, fall back to general knowledge to answer, and never query any stack other than `react-native`.

### Requirement 2: Similar-entries pivot on partial hits

**User Story:** As a developer using one of the experts, I want the agent to pivot through `find_similar_entries` when the top search result is only loosely related, so that I get the actual relevant fix rather than a near-miss.

#### Acceptance Criteria

1. THE Nextjs_Steering_File SHALL define the Low_Relevance classification for a `search_knowledge_base` result as the top entry satisfying at least one of the following two clauses: (a) the top entry's `root_cause` and `fix` do not address the symptoms in the user's question, or (b) the top entry's tags overlap the question by no more than one tag.
2. THE ReactNative_Steering_File SHALL define the Low_Relevance classification for a `search_knowledge_base` result using the same two-clause heuristic as the Nextjs_Steering_File: (a) the top entry's `root_cause` and `fix` do not address the symptoms in the user's question, or (b) the top entry's tags overlap the question by no more than one tag.
3. WHEN `search_knowledge_base` returns at least one result AND the top entry is classified as Low_Relevance per criterion 1, THE Nextjs_Steering_File SHALL instruct the agent to call `find_similar_entries` exactly once, using the `id` of the top returned entry, before declaring a True Miss.
4. WHEN `search_knowledge_base` returns at least one result AND the top entry is classified as Low_Relevance per criterion 2, THE ReactNative_Steering_File SHALL instruct the agent to call `find_similar_entries` exactly once, using the `id` of the top returned entry, before declaring a True Miss.
5. WHEN `find_similar_entries` returns one or more entries, THE Nextjs_Steering_File SHALL instruct the agent to expand each returned entry by calling `get_knowledge_entry` with that entry's `id` before grounding an answer in it.
6. WHEN `find_similar_entries` returns one or more entries, THE ReactNative_Steering_File SHALL instruct the agent to expand each returned entry by calling `get_knowledge_entry` with that entry's `id` before grounding an answer in it.
7. IF `find_similar_entries` returns zero entries, THEN THE Nextjs_Steering_File SHALL instruct the agent to declare a True Miss without invoking `get_knowledge_entry` and without fabricating an entry `id`.
8. IF `find_similar_entries` returns zero entries, THEN THE ReactNative_Steering_File SHALL instruct the agent to declare a True Miss without invoking `get_knowledge_entry` and without fabricating an entry `id`.

### Requirement 3: Capturing the gap on a True Miss

**User Story:** As the operator of `mcp-dev-knowledge`, I want the agent to surface every True Miss as a candidate new entry, so that the knowledge base steadily improves and gaps don't stay invisible.

#### Acceptance Criteria

1. WHEN the Lookup Protocol terminates in a True Miss, THE Nextjs_Steering_File SHALL instruct the agent to emit, in the same response that announces the True Miss, a single contiguous block labeled exactly "Gap Capture" proposing a candidate new entry for `knowledge/nextjs-vercel.json`.
2. WHEN the Lookup Protocol terminates in a True Miss, THE ReactNative_Steering_File SHALL instruct the agent to emit, in the same response that announces the True Miss, a single contiguous block labeled exactly "Gap Capture" proposing a candidate new entry for `knowledge/react-native.json`.
3. THE Nextjs_Steering_File SHALL require the Gap Capture block to contain at minimum these labeled fields from the knowledge entry schema: `type`, `symptoms`, `root_cause`, `fix`, `tags`, `severity` (value restricted to one of `low`, `medium`, `high`), `frequency` (value restricted to one of `rare`, `occasional`, `common`, `very-common`), and `stack`.
4. THE ReactNative_Steering_File SHALL require the Gap Capture block to contain at minimum these labeled fields from the knowledge entry schema: `type`, `symptoms`, `root_cause`, `fix`, `tags`, `severity` (value restricted to one of `low`, `medium`, `high`), `frequency` (value restricted to one of `rare`, `occasional`, `common`, `very-common`), and `stack`.
5. THE Nextjs_Steering_File SHALL instruct the agent to set the candidate entry's `stack` field to the literal string `"nextjs-vercel"`.
6. THE ReactNative_Steering_File SHALL instruct the agent to set the candidate entry's `stack` field to the literal string `"react-native"`.
7. THE Nextjs_Steering_File SHALL instruct the agent to reference `knowledge/nextjs-vercel.json` as the file the user must edit to adopt the candidate entry and `npm run export:neon` as the command the user must run after editing, while explicitly forbidding the agent from creating, writing to, or modifying `knowledge/nextjs-vercel.json` itself.
8. THE ReactNative_Steering_File SHALL instruct the agent to reference `knowledge/react-native.json` as the file the user must edit to adopt the candidate entry and `npm run export:neon` as the command the user must run after editing, while explicitly forbidding the agent from creating, writing to, or modifying `knowledge/react-native.json` itself.
9. IF the agent lacks the information needed to propose a concrete value for any required field of the candidate entry, THEN THE Nextjs_Steering_File SHALL instruct the agent to mark that field in the Gap Capture block as requiring user input rather than fabricating a value.
10. IF the agent lacks the information needed to propose a concrete value for any required field of the candidate entry, THEN THE ReactNative_Steering_File SHALL instruct the agent to mark that field in the Gap Capture block as requiring user input rather than fabricating a value.

### Requirement 4: Labeling ungrounded answers

**User Story:** As a developer using one of the experts, I want answers that are not backed by a knowledge-base entry to be visibly marked, so that I can tell vetted guidance apart from general-expertise guesses.

#### Acceptance Criteria

1. WHEN the agent produces an answer that does not cite at least one numeric `id` returned verbatim by a `dev-knowledge` MCP tool call made in the same turn, THE Nextjs_Steering_File SHALL instruct the agent to treat the answer as ungrounded and prepend the Fallback Label as the first characters of the response with no preceding whitespace, markdown, or other formatting.
2. WHEN the agent produces an answer that does not cite at least one numeric `id` returned verbatim by a `dev-knowledge` MCP tool call made in the same turn, THE ReactNative_Steering_File SHALL instruct the agent to treat the answer as ungrounded and prepend the Fallback Label as the first characters of the response with no preceding whitespace, markdown, or other formatting.
3. THE Nextjs_Steering_File SHALL define the exact wording of the Fallback Label as a single non-empty literal string enclosed in backticks, to be used by the agent verbatim with no translation, paraphrase, casing change, or whitespace change.
4. THE ReactNative_Steering_File SHALL define the exact wording of the Fallback Label as a single non-empty literal string enclosed in backticks, to be used by the agent verbatim with no translation, paraphrase, casing change, or whitespace change.
5. IF the answer cites at least one numeric `id` returned verbatim by a `dev-knowledge` MCP tool call made in the same turn, THEN THE Nextjs_Steering_File SHALL instruct the agent NOT to prepend the Fallback Label.
6. IF the answer cites at least one numeric `id` returned verbatim by a `dev-knowledge` MCP tool call made in the same turn, THEN THE ReactNative_Steering_File SHALL instruct the agent NOT to prepend the Fallback Label.
7. THE Nextjs_Steering_File SHALL preserve and reinforce the rule that forbids the agent from citing any `id` that was not returned verbatim by a `dev-knowledge` MCP tool call in the same turn.
8. THE ReactNative_Steering_File SHALL preserve and reinforce the rule that forbids the agent from citing any `id` that was not returned verbatim by a `dev-knowledge` MCP tool call in the same turn.
9. IF a `dev-knowledge` MCP tool call in the current turn returns an empty result set, THEN THE Nextjs_Steering_File AND THE ReactNative_Steering_File SHALL instruct the agent to treat the answer as ungrounded, prepend the Fallback Label as the first characters of the response, and cite no `id`.
10. IF a `dev-knowledge` MCP tool call in the current turn fails or returns an error, THEN THE Nextjs_Steering_File AND THE ReactNative_Steering_File SHALL instruct the agent to treat the answer as ungrounded, prepend the Fallback Label as the first characters of the response, and cite no `id`.

### Requirement 5: Parity between the two steering files

**User Story:** As the maintainer of the powers, I want both steering files to receive the same enhancements parameterized only by stack, so that the two experts behave consistently and the steering stays easy to maintain.

#### Acceptance Criteria

1. THE Nextjs_Steering_File and the ReactNative_Steering_File SHALL contain the same set of new sections covering the Lookup Protocol, the similar-entries pivot, the Gap Capture behavior, and the Fallback Label, where "same set" means identical section heading text, identical relative ordering of those headings, and byte-for-byte identical body text within each new section except for two enumerated token pairs: (a) the stack identifier `nextjs-vercel` ↔ `react-native`, and (b) the knowledge file path `knowledge/nextjs-vercel.json` ↔ `knowledge/react-native.json`.
2. THE Nextjs_Steering_File and the ReactNative_Steering_File SHALL differ inside the new sections only in the two enumerated token pairs defined in criterion 1, and pre-existing stack-specific content already in each file (for example the React Native file's platform-difference guidance and domain-coverage list) SHALL remain verbatim outside the new sections with no insertions, deletions, or reordering.
3. THE Nextjs_Steering_File SHALL retain its existing `inclusion: manual` front-matter verbatim, with no insertions, deletions, or reordering of front-matter keys or values.
4. THE ReactNative_Steering_File SHALL retain its existing `inclusion: manual` front-matter verbatim, with no insertions, deletions, or reordering of front-matter keys or values.
5. THE Nextjs_Steering_File SHALL retain its existing "Domain coverage" section verbatim, with no insertions, deletions, or reordering of its content.
6. THE ReactNative_Steering_File SHALL retain its existing "Domain coverage" section and platform-differences guidance verbatim, with no insertions, deletions, or reordering of their content.
7. WHEN the new sections are added to each steering file, THE Nextjs_Steering_File and the ReactNative_Steering_File SHALL place all new sections after all pre-existing content, preserving the original order of pre-existing sections and without inserting, deleting, or reordering any pre-existing section.
8. IF a textual diff between the Nextjs_Steering_File and the ReactNative_Steering_File, computed after substituting `react-native` for `nextjs-vercel` and `knowledge/react-native.json` for `knowledge/nextjs-vercel.json` in the Nextjs_Steering_File, reports any difference inside the new sections, THEN THE parity check SHALL fail and the two files SHALL be reported as non-parity with an indication of the first differing line within the new sections.

### Requirement 6: Power file updates only when user-facing behavior changes

**User Story:** As a developer reading the power's user-facing documentation, I want `POWER.md` to describe the new behavior only where it is actually visible to me, so that the documentation stays accurate without drifting into internal agent instructions.

#### Acceptance Criteria

1. WHEN the Nextjs_Steering_File is updated to introduce the Fallback Label on ungrounded answers or the Gap Capture block on a True Miss, THE Nextjs_Power_File SHALL be updated in the same change set to describe these two user-visible behaviors, and SHALL NOT describe any other behavior not present in the Nextjs_Steering_File.
2. WHEN the ReactNative_Steering_File is updated to introduce the Fallback Label on ungrounded answers or the Gap Capture block on a True Miss, THE ReactNative_Power_File SHALL be updated in the same change set to describe these two user-visible behaviors, and SHALL NOT describe any other behavior not present in the ReactNative_Steering_File.
3. THE Nextjs_Power_File SHALL keep the existing "MCP server", "Tools exposed", and "Stack isolation" sections byte-identical in heading text, ordering, and listed tool names and described behaviors, except for additions explicitly mandated by criterion 1.
4. THE ReactNative_Power_File SHALL keep the existing "MCP server", "Tools exposed", and "Stack isolation" sections byte-identical in heading text, ordering, and listed tool names and described behaviors, except for additions explicitly mandated by criterion 2.
5. IF a section of the Nextjs_Power_File already describes a behavior in a way that matches the Nextjs_Steering_File, THEN THE Nextjs_Power_File SHALL remain byte-identical in that section, and edits SHALL be permitted only where an existing description contradicts or omits a behavior present in the Nextjs_Steering_File.
6. IF a section of the ReactNative_Power_File already describes a behavior in a way that matches the ReactNative_Steering_File, THEN THE ReactNative_Power_File SHALL remain byte-identical in that section, and edits SHALL be permitted only where an existing description contradicts or omits a behavior present in the ReactNative_Steering_File.
7. IF the Nextjs_Steering_File is updated with new user-visible behavior covered by criterion 1 and the corresponding update to the Nextjs_Power_File is not included in the same change set, THEN the change set SHALL be considered incomplete and rejected.
8. IF the ReactNative_Steering_File is updated with new user-visible behavior covered by criterion 2 and the corresponding update to the ReactNative_Power_File is not included in the same change set, THEN the change set SHALL be considered incomplete and rejected.

### Requirement 7: Scope containment

**User Story:** As the maintainer of the repository, I want this change strictly contained to the steering and (optionally) power markdown files, so that no MCP server code, knowledge data, or build script is altered as a side effect.

#### Acceptance Criteria

1. THE feature SHALL restrict modifications to files under `kiro-powers/nextjs-expert/steering/`, `kiro-powers/react-native-expert/steering/`, `kiro-powers/nextjs-expert/POWER.md`, and `kiro-powers/react-native-expert/POWER.md`, such that every other file in the repository is byte-for-byte identical to its pre-change state when compared via SHA-256 hash or `git diff --exit-code`.
2. THE feature SHALL NOT create, delete, rename, or modify any file under `app/`, `lib/`, `knowledge/`, `.kiro/`, `node_modules/`, or any subdirectory thereof, and SHALL NOT modify `export-to-neon.mjs`.
3. THE feature SHALL NOT create, delete, rename, or modify `package.json`, `package-lock.json`, `next.config.mjs`, `vercel.json`, `tsconfig.json`, `README.md`, `.env`, `.env.example`, or `.gitignore`.
4. THE feature SHALL NOT add a new MCP tool, remove an existing MCP tool, rename an existing MCP tool, change any field name in an existing tool's input schema, change the type of any existing input schema field, change the optional/required status of any existing input schema field, or change the `.describe(...)` text of any existing input schema field.
5. THE feature SHALL preserve the exact `inclusion` value present in the YAML front matter of `kiro-powers/nextjs-expert/steering/nextjs-expert.md` and `kiro-powers/react-native-expert/steering/react-native-expert.md` such that the front-matter `inclusion` line in each file is byte-for-byte identical to its pre-change value.
6. WHERE Requirement 6 mandates an update to a `POWER.md` file in `kiro-powers/nextjs-expert/` or `kiro-powers/react-native-expert/`, THE feature SHALL limit modifications of that `POWER.md` to the changes Requirement 6 prescribes; IF Requirement 6 does not mandate a change to a given `POWER.md`, THEN THE feature SHALL leave that `POWER.md` byte-for-byte identical to its pre-change state.
7. IF any file outside `kiro-powers/nextjs-expert/steering/`, `kiro-powers/react-native-expert/steering/`, `kiro-powers/nextjs-expert/POWER.md`, or `kiro-powers/react-native-expert/POWER.md` is reported as added, modified, deleted, or renamed by `git status --porcelain` after the change is applied, THEN the feature SHALL be considered failed and all modifications SHALL be reverted so that `git status --porcelain` reports no changes outside the permitted paths.
