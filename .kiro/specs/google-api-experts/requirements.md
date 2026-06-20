# Requirements Document

## Introduction

The `mcp-dev-knowledge` repository currently ships two knowledge stacks (`nextjs-vercel`, `react-native`), two Kiro Powers, and two Claude Skills. The existing `nextjs-vercel` stack already contains Google API entries that are coupled to Next.js context (NextAuth, Prisma adapters, etc.). This feature adds three new strictly-isolated, framework-agnostic knowledge stacks — `google-oauth`, `google-calendar`, and `google-sheets` — each backed by its own knowledge JSON file, Kiro Power, and Claude Skill.

The new stacks make Google API knowledge reusable by any project (not just Next.js apps). Entries may overlap with what is already in `nextjs-vercel.json`; the existing knowledge files are never modified. The only code changes are updating `KNOWN_STACKS` in `lib/db.ts`, the `STACK_DESCRIPTION` in `route.ts`, and `STACK_INFO` in `app/page.tsx` so agents and the landing page discover the new stacks.

Each new persona artifact (three Kiro Powers and three Claude Skills) includes the `Install_Verify_Protocol`, stack isolation enforcement, the Lookup Protocol, Gap Capture, and Fallback Label sections consistent with the existing two personas and the peer spec `knowledge-base-miss-handling`.

## Glossary

- **MCP_Server**: The `dev-knowledge` MCP server at `https://mcp-dev-knowledge.vercel.app/api/mcp` (Streamable HTTP). Exposes `search_knowledge_base`, `get_knowledge_entry`, `find_similar_entries`, and `list_knowledge_filters`.
- **MCP_Server_URL**: The literal string `https://mcp-dev-knowledge.vercel.app/api/mcp`.
- **MCP_Auth_Header**: The literal string `Authorization: Bearer ${MCP_API_KEY}`.
- **Stack**: A strictly-isolated knowledge partition. After this feature, valid values are `nextjs-vercel`, `react-native`, `google-oauth`, `google-calendar`, and `google-sheets`.
- **New_Stack**: One of `google-oauth`, `google-calendar`, or `google-sheets`.
- **Active_Stack**: The single Stack a Persona_Artifact is bound to.
- **Forbidden_Stacks**: For a given Persona_Artifact, all Stack values that are not the Active_Stack.
- **Knowledge_File**: A JSON file under `knowledge/` containing an array of entries for one Stack. New files: `knowledge/google-oauth.json`, `knowledge/google-calendar.json`, `knowledge/google-sheets.json`.
- **Kiro_Power**: An installable Kiro extension under `kiro-powers/<name>/` containing `POWER.md`, `power.json`, and `steering/<name>.md`.
- **Claude_Skill**: An installable Claude Code extension under `claude-skills/<name>/` containing `SKILL.md`.
- **Persona_Artifact**: Any of the six new agent-facing definitions: three Steering_Files plus three Skill_Files.
- **Steering_File**: A Kiro_Power steering file with `inclusion: manual` frontmatter.
- **Skill_File**: The `SKILL.md` for a Claude_Skill.
- **Install_Verify_Protocol**: The instruction block that tells the Agent to detect MCP_Server availability, walk the user through installation when unavailable, and honor a Decline_Decision.
- **Decline_Decision**: An explicit user choice to skip installation and continue with general-expertise answers.
- **Peer_Spec**: The separate spec `knowledge-base-miss-handling`, which defines the Lookup Protocol, Gap Capture, and Fallback Label behaviors.
- **KNOWN_STACKS**: The TypeScript array constant in `lib/db.ts` listing all valid stack identifiers.
- **STACK_DESCRIPTION**: The Zod `.describe()` string on the `stack` parameter of `search_knowledge_base` in `route.ts`.
- **STACK_INFO**: The record in `app/page.tsx` mapping stack identifiers to `{ label, blurb }` for the landing page.

## Requirements

### Requirement 1: Create the Google OAuth knowledge file

**User Story:** As a developer using Google OAuth in any framework, I want a dedicated knowledge base of Google OAuth issues, so that I can get framework-agnostic guidance on consent screens, scopes, token refresh, and redirect URIs.

#### Acceptance Criteria

1. THE Repository SHALL contain a Knowledge_File at `knowledge/google-oauth.json`.
2. THE Knowledge_File at `knowledge/google-oauth.json` SHALL be a valid JSON array of entry objects.
3. WHEN an entry exists in `knowledge/google-oauth.json`, THE entry SHALL have its `stack` field set to the literal string `"google-oauth"`.
4. THE Knowledge_File at `knowledge/google-oauth.json` SHALL contain at least 8 entries covering consent-screen configuration, scope selection, token refresh flow, token persistence, redirect-URI debugging, and service-account setup.
5. THE entries in `knowledge/google-oauth.json` SHALL be framework-agnostic and SHALL NOT contain NextAuth-specific, Prisma-specific, or Next.js-specific code in the `fix` or `symptoms` fields.
6. WHEN an entry is present in `knowledge/google-oauth.json`, THE entry SHALL have non-empty `symptoms`, `fix`, and `tags` arrays, a `severity` value from the set {`low`, `medium`, `high`}, and a `frequency` value from the set {`rare`, `occasional`, `common`, `very-common`}.

### Requirement 2: Create the Google Calendar knowledge file

**User Story:** As a developer integrating Google Calendar API, I want a dedicated knowledge base of Calendar API issues, so that I can get guidance on events, webhooks, timezone handling, recurring events, and rate limiting.

#### Acceptance Criteria

1. THE Repository SHALL contain a Knowledge_File at `knowledge/google-calendar.json`.
2. THE Knowledge_File at `knowledge/google-calendar.json` SHALL be a valid JSON array of entry objects.
3. WHEN an entry exists in `knowledge/google-calendar.json`, THE entry SHALL have its `stack` field set to the literal string `"google-calendar"`.
4. THE Knowledge_File at `knowledge/google-calendar.json` SHALL contain at least 8 entries covering event CRUD, push notifications/webhooks, timezone handling, rate limiting/quotas, recurring events, and permissions debugging.
5. THE entries in `knowledge/google-calendar.json` SHALL be framework-agnostic and SHALL NOT contain Next.js-specific or Prisma-specific code in the `fix` or `symptoms` fields.
6. WHEN an entry is present in `knowledge/google-calendar.json`, THE entry SHALL have non-empty `symptoms`, `fix`, and `tags` arrays, a `severity` value from the set {`low`, `medium`, `high`}, and a `frequency` value from the set {`rare`, `occasional`, `common`, `very-common`}.

### Requirement 3: Create the Google Sheets knowledge file

**User Story:** As a developer integrating Google Sheets API, I want a dedicated knowledge base of Sheets API issues, so that I can get guidance on read/write operations, batch operations, service-account access, and Sheets-as-CMS patterns.

#### Acceptance Criteria

1. THE Repository SHALL contain a Knowledge_File at `knowledge/google-sheets.json`.
2. THE Knowledge_File at `knowledge/google-sheets.json` SHALL be a valid JSON array of entry objects.
3. WHEN an entry exists in `knowledge/google-sheets.json`, THE entry SHALL have its `stack` field set to the literal string `"google-sheets"`.
4. THE Knowledge_File at `knowledge/google-sheets.json` SHALL contain at least 8 entries covering values.get/batchGet, update/append/batchUpdate, batch operations, service-account server-side access, Sheets-as-CMS pattern, and permissions debugging.
5. THE entries in `knowledge/google-sheets.json` SHALL be framework-agnostic and SHALL NOT contain Next.js-specific or Prisma-specific code in the `fix` or `symptoms` fields.
6. WHEN an entry is present in `knowledge/google-sheets.json`, THE entry SHALL have non-empty `symptoms`, `fix`, and `tags` arrays, a `severity` value from the set {`low`, `medium`, `high`}, and a `frequency` value from the set {`rare`, `occasional`, `common`, `very-common`}.

### Requirement 4: Create the Google OAuth Kiro Power

**User Story:** As a Kiro user, I want a Google OAuth expert power that queries the `google-oauth` stack, so that I can get KB-grounded OAuth guidance scoped to my domain.

#### Acceptance Criteria

1. THE Repository SHALL contain a Kiro_Power folder at `kiro-powers/google-oauth-expert/`.
2. THE Repository SHALL contain a file at `kiro-powers/google-oauth-expert/power.json` with `name` set to `"google-oauth-expert"`, `displayName` set to `"Google OAuth Expert"`, keywords including `"google"`, `"oauth"`, `"consent-screen"`, `"token-refresh"`, `"redirect-uri"`, and `mcpServers.dev-knowledge.url` set to the MCP_Server_URL.
3. THE Repository SHALL contain a file at `kiro-powers/google-oauth-expert/POWER.md` describing the power's purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior.
4. THE Repository SHALL contain a Steering_File at `kiro-powers/google-oauth-expert/steering/google-oauth-expert.md` with `inclusion: manual` frontmatter.
5. THE Steering_File at `kiro-powers/google-oauth-expert/steering/google-oauth-expert.md` SHALL set Active_Stack to `"google-oauth"` and SHALL instruct the Agent to pass `stack: "google-oauth"` on every call to `search_knowledge_base`.
6. THE Steering_File at `kiro-powers/google-oauth-expert/steering/google-oauth-expert.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.

### Requirement 5: Create the Google Calendar Kiro Power

**User Story:** As a Kiro user, I want a Google Calendar expert power that queries the `google-calendar` stack, so that I can get KB-grounded Calendar API guidance scoped to my domain.

#### Acceptance Criteria

1. THE Repository SHALL contain a Kiro_Power folder at `kiro-powers/google-calendar-expert/`.
2. THE Repository SHALL contain a file at `kiro-powers/google-calendar-expert/power.json` with `name` set to `"google-calendar-expert"`, `displayName` set to `"Google Calendar Expert"`, keywords including `"google"`, `"calendar"`, `"events"`, `"webhooks"`, `"recurring"`, and `mcpServers.dev-knowledge.url` set to the MCP_Server_URL.
3. THE Repository SHALL contain a file at `kiro-powers/google-calendar-expert/POWER.md` describing the power's purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior.
4. THE Repository SHALL contain a Steering_File at `kiro-powers/google-calendar-expert/steering/google-calendar-expert.md` with `inclusion: manual` frontmatter.
5. THE Steering_File at `kiro-powers/google-calendar-expert/steering/google-calendar-expert.md` SHALL set Active_Stack to `"google-calendar"` and SHALL instruct the Agent to pass `stack: "google-calendar"` on every call to `search_knowledge_base`.
6. THE Steering_File at `kiro-powers/google-calendar-expert/steering/google-calendar-expert.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.

### Requirement 6: Create the Google Sheets Kiro Power

**User Story:** As a Kiro user, I want a Google Sheets expert power that queries the `google-sheets` stack, so that I can get KB-grounded Sheets API guidance scoped to my domain.

#### Acceptance Criteria

1. THE Repository SHALL contain a Kiro_Power folder at `kiro-powers/google-sheets-expert/`.
2. THE Repository SHALL contain a file at `kiro-powers/google-sheets-expert/power.json` with `name` set to `"google-sheets-expert"`, `displayName` set to `"Google Sheets Expert"`, keywords including `"google"`, `"sheets"`, `"spreadsheet"`, `"batch"`, `"csv"`, and `mcpServers.dev-knowledge.url` set to the MCP_Server_URL.
3. THE Repository SHALL contain a file at `kiro-powers/google-sheets-expert/POWER.md` describing the power's purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior.
4. THE Repository SHALL contain a Steering_File at `kiro-powers/google-sheets-expert/steering/google-sheets-expert.md` with `inclusion: manual` frontmatter.
5. THE Steering_File at `kiro-powers/google-sheets-expert/steering/google-sheets-expert.md` SHALL set Active_Stack to `"google-sheets"` and SHALL instruct the Agent to pass `stack: "google-sheets"` on every call to `search_knowledge_base`.
6. THE Steering_File at `kiro-powers/google-sheets-expert/steering/google-sheets-expert.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.

### Requirement 7: Create the Google OAuth Claude Skill

**User Story:** As a Claude Code user, I want a Google OAuth expert skill that mirrors the Kiro Power, so that I can use the same KB-grounded persona inside Claude Code.

#### Acceptance Criteria

1. THE Repository SHALL contain a Claude_Skill folder at `claude-skills/google-oauth-expert/`.
2. THE Repository SHALL contain a Skill_File at `claude-skills/google-oauth-expert/SKILL.md`.
3. THE Skill_File at `claude-skills/google-oauth-expert/SKILL.md` SHALL begin with YAML frontmatter containing `name: google-oauth-expert` and a `description` identifying the persona as a Google OAuth engineer backed by the `dev-knowledge` MCP server.
4. THE Skill_File at `claude-skills/google-oauth-expert/SKILL.md` SHALL set Active_Stack to `"google-oauth"` and SHALL instruct the Agent to pass `stack: "google-oauth"` on every call to `search_knowledge_base`.
5. THE Skill_File at `claude-skills/google-oauth-expert/SKILL.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.
6. THE Skill_File at `claude-skills/google-oauth-expert/SKILL.md` SHALL describe the same domain coverage as the corresponding Steering_File, including consent-screen configuration, scope selection, token refresh, token persistence, redirect-URI debugging, and service-account setup.
7. THE Skill_File at `claude-skills/google-oauth-expert/SKILL.md` SHALL reference the MCP_Server_URL and the optional MCP_Auth_Header.

### Requirement 8: Create the Google Calendar Claude Skill

**User Story:** As a Claude Code user, I want a Google Calendar expert skill that mirrors the Kiro Power, so that I can use the same KB-grounded persona inside Claude Code.

#### Acceptance Criteria

1. THE Repository SHALL contain a Claude_Skill folder at `claude-skills/google-calendar-expert/`.
2. THE Repository SHALL contain a Skill_File at `claude-skills/google-calendar-expert/SKILL.md`.
3. THE Skill_File at `claude-skills/google-calendar-expert/SKILL.md` SHALL begin with YAML frontmatter containing `name: google-calendar-expert` and a `description` identifying the persona as a Google Calendar API engineer backed by the `dev-knowledge` MCP server.
4. THE Skill_File at `claude-skills/google-calendar-expert/SKILL.md` SHALL set Active_Stack to `"google-calendar"` and SHALL instruct the Agent to pass `stack: "google-calendar"` on every call to `search_knowledge_base`.
5. THE Skill_File at `claude-skills/google-calendar-expert/SKILL.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.
6. THE Skill_File at `claude-skills/google-calendar-expert/SKILL.md` SHALL describe the same domain coverage as the corresponding Steering_File, including event CRUD, webhooks/push notifications, timezone handling, rate limiting, recurring events, and permissions.
7. THE Skill_File at `claude-skills/google-calendar-expert/SKILL.md` SHALL reference the MCP_Server_URL and the optional MCP_Auth_Header.

### Requirement 9: Create the Google Sheets Claude Skill

**User Story:** As a Claude Code user, I want a Google Sheets expert skill that mirrors the Kiro Power, so that I can use the same KB-grounded persona inside Claude Code.

#### Acceptance Criteria

1. THE Repository SHALL contain a Claude_Skill folder at `claude-skills/google-sheets-expert/`.
2. THE Repository SHALL contain a Skill_File at `claude-skills/google-sheets-expert/SKILL.md`.
3. THE Skill_File at `claude-skills/google-sheets-expert/SKILL.md` SHALL begin with YAML frontmatter containing `name: google-sheets-expert` and a `description` identifying the persona as a Google Sheets API engineer backed by the `dev-knowledge` MCP server.
4. THE Skill_File at `claude-skills/google-sheets-expert/SKILL.md` SHALL set Active_Stack to `"google-sheets"` and SHALL instruct the Agent to pass `stack: "google-sheets"` on every call to `search_knowledge_base`.
5. THE Skill_File at `claude-skills/google-sheets-expert/SKILL.md` SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.
6. THE Skill_File at `claude-skills/google-sheets-expert/SKILL.md` SHALL describe the same domain coverage as the corresponding Steering_File, including values.get/batchGet, update/append/batchUpdate, batch operations, service-account access, Sheets-as-CMS, and permissions.
7. THE Skill_File at `claude-skills/google-sheets-expert/SKILL.md` SHALL reference the MCP_Server_URL and the optional MCP_Auth_Header.

### Requirement 10: Install_Verify_Protocol in all six Persona_Artifacts

**User Story:** As a developer activating any Google API expert persona, I want the agent to verify the MCP server is installed and reachable before answering, so that I never silently get ungrounded answers due to a missing server.

#### Acceptance Criteria

1. THE Steering_File for each of the three Kiro Powers SHALL contain an Install_Verify_Protocol section.
2. THE Skill_File for each of the three Claude Skills SHALL contain an Install_Verify_Protocol section.
3. THE Install_Verify_Protocol SHALL instruct the Agent, on the first activation in a session, to verify MCP_Server reachability by calling `list_knowledge_filters` before composing the first substantive answer.
4. WHERE the verification call has already succeeded earlier in the same session, THE Install_Verify_Protocol SHALL instruct the Agent to skip re-verification.
5. WHEN the verification call succeeds, THE Install_Verify_Protocol SHALL instruct the Agent to proceed with the user's question without further prompting.
6. IF the verification call indicates the server is unavailable, THEN THE Install_Verify_Protocol SHALL instruct the Agent to surface the issue and offer the Host-specific install walk-through.
7. WHERE the current Host is Kiro, THE Install_Verify_Protocol in each Steering_File SHALL reference `~/.kiro/settings/mcp.json` (user-global) and `.kiro/settings/mcp.json` (workspace) and include a JSON snippet registering the `dev-knowledge` server with `url` set to the MCP_Server_URL and header set to the MCP_Auth_Header.
8. WHERE the current Host is Claude Code, THE Install_Verify_Protocol in each Skill_File SHALL reference Claude Code's `claude mcp add` command and include a registration snippet for the `dev-knowledge` server with the MCP_Server_URL and optional MCP_Auth_Header.
9. WHERE the verification call fails with HTTP 401, THE Install_Verify_Protocol in each Persona_Artifact SHALL instruct the Agent to inform the user that `MCP_API_KEY` is missing or invalid and guide them through setting the environment variable.

### Requirement 11: Non-blocking behavior on Decline_Decision

**User Story:** As a user who does not want to install the MCP server right now, I want the agent to continue answering on general expertise, so that the install walk-through never blocks my work.

#### Acceptance Criteria

1. WHEN the user issues a Decline_Decision, THE Install_Verify_Protocol in each Persona_Artifact SHALL instruct the Agent to continue answering on general expertise.
2. WHEN the Agent continues on general expertise after a Decline_Decision, THE Install_Verify_Protocol SHALL defer labeling to the Fallback Label behavior defined by the Peer_Spec and SHALL NOT redefine that labeling.
3. WHILE the Decline_Decision remains in effect for the current session, THE Install_Verify_Protocol SHALL instruct the Agent to skip re-prompting about installation.
4. THE Install_Verify_Protocol SHALL NOT instruct the Agent to refuse, defer, or block answering after a Decline_Decision.

### Requirement 12: Stack isolation enforcement

**User Story:** As a maintainer, I want each Google API persona to query only its own stack, so that knowledge from unrelated domains never leaks into answers.

#### Acceptance Criteria

1. THE Persona_Artifact for `google-oauth` SHALL pass `stack: "google-oauth"` on every `search_knowledge_base` and `list_knowledge_filters` (with stack arg) call.
2. THE Persona_Artifact for `google-calendar` SHALL pass `stack: "google-calendar"` on every `search_knowledge_base` and `list_knowledge_filters` (with stack arg) call.
3. THE Persona_Artifact for `google-sheets` SHALL pass `stack: "google-sheets"` on every `search_knowledge_base` and `list_knowledge_filters` (with stack arg) call.
4. THE Persona_Artifact for each New_Stack SHALL prohibit the Agent from passing any Forbidden_Stack value on any tool call.
5. WHERE the Install_Verify_Protocol uses `list_knowledge_filters` to probe reachability, THE Persona_Artifact MAY omit the `stack` argument on that probe call only, and SHALL prohibit Forbidden_Stack values on all subsequent calls.

### Requirement 13: Update KNOWN_STACKS in lib/db.ts

**User Story:** As a developer, I want the code to recognize the three new stacks, so that validation error messages list all valid stacks.

#### Acceptance Criteria

1. THE `KNOWN_STACKS` array in `lib/db.ts` SHALL contain the values `"google-oauth"`, `"google-calendar"`, and `"google-sheets"` in addition to the existing `"nextjs-vercel"` and `"react-native"`.
2. THE existing values `"nextjs-vercel"` and `"react-native"` in `KNOWN_STACKS` SHALL remain unchanged.
3. WHEN a caller passes an invalid stack to `searchKnowledge()`, THE error message SHALL list all five stacks.

### Requirement 14: Update STACK_DESCRIPTION in route.ts

**User Story:** As an AI agent, I want the `stack` parameter description to list all five stacks, so that I can discover and use the Google API stacks from the tool schema alone.

#### Acceptance Criteria

1. THE `STACK_DESCRIPTION` string in `route.ts` SHALL list `'google-oauth'`, `'google-calendar'`, and `'google-sheets'` as valid values with short parenthetical descriptions.
2. THE existing descriptions for `'nextjs-vercel'` and `'react-native'` in `STACK_DESCRIPTION` SHALL remain unchanged in substance.
3. THE `instructions` string in the `serverInfo` object in `route.ts` SHALL mention that the server covers five stacks and SHALL list the three new stacks alongside the two existing ones.

### Requirement 15: Update STACK_INFO in app/page.tsx

**User Story:** As a visitor to the landing page, I want to see the three new Google API stacks listed, so that I know they exist and what they cover.

#### Acceptance Criteria

1. THE `STACK_INFO` record in `app/page.tsx` SHALL contain entries for `"google-oauth"`, `"google-calendar"`, and `"google-sheets"` with a `label` and `blurb` for each.
2. THE existing entries for `"nextjs-vercel"` and `"react-native"` in `STACK_INFO` SHALL remain unchanged.
3. WHEN the landing page renders and the database is reachable, THE page SHALL display the three new stacks alongside the existing two in the stacks section.

### Requirement 16: Parity between Kiro and Claude variants of each Google API expert

**User Story:** As a maintainer, I want the Kiro Power and Claude Skill for each Google API domain to differ only by host-specific install instructions, so that future changes can be applied symmetrically.

#### Acceptance Criteria

1. THE Steering_File and corresponding Skill_File for `google-oauth-expert` SHALL have identical domain coverage, answering style, stack scoping, Lookup Protocol, Gap Capture template, and Fallback Label sections, differing only in host-specific installation instructions.
2. THE Steering_File and corresponding Skill_File for `google-calendar-expert` SHALL have identical domain coverage, answering style, stack scoping, Lookup Protocol, Gap Capture template, and Fallback Label sections, differing only in host-specific installation instructions.
3. THE Steering_File and corresponding Skill_File for `google-sheets-expert` SHALL have identical domain coverage, answering style, stack scoping, Lookup Protocol, Gap Capture template, and Fallback Label sections, differing only in host-specific installation instructions.

### Requirement 17: No modification to existing knowledge files

**User Story:** As the repository maintainer, I want existing knowledge files left untouched, so that no regression is introduced to the existing stacks.

#### Acceptance Criteria

1. THE feature SHALL NOT modify, delete, or rename `knowledge/nextjs-vercel.json`.
2. THE feature SHALL NOT modify, delete, or rename `knowledge/react-native.json`.
3. THE feature SHALL NOT modify any file under `kiro-powers/nextjs-expert/` or `kiro-powers/react-native-expert/`.
4. THE feature SHALL NOT modify any file under `claude-skills/nextjs-expert/` or `claude-skills/react-native-expert/`.

### Requirement 18: Scope containment of code changes

**User Story:** As the repository maintainer, I want code changes strictly limited to the three files that register stacks, so that no MCP tool schema or query logic is altered.

#### Acceptance Criteria

1. THE feature SHALL restrict code modifications to exactly: `lib/db.ts` (KNOWN_STACKS array only), `app/api/[transport]/route.ts` (STACK_DESCRIPTION string and `instructions` string only), and `app/page.tsx` (STACK_INFO record only).
2. THE feature SHALL NOT add a new MCP tool, remove an existing tool, rename a tool, or change any field name, type, or required/optional status in an existing tool's input schema.
3. THE feature SHALL NOT modify `export-to-neon.mjs`, `package.json`, `package-lock.json`, `next.config.mjs`, `vercel.json`, `tsconfig.json`, or `.gitignore`.
4. THE feature SHALL NOT modify the `searchKnowledge`, `getEntry`, `findSimilar`, or `listFilters` function signatures or logic in `lib/db.ts`.

### Requirement 19: Compatibility with Peer_Spec `knowledge-base-miss-handling`

**User Story:** As a maintainer, I want the new persona artifacts to compose cleanly with the Lookup Protocol, Gap Capture, and Fallback Label behaviors defined by the peer spec.

#### Acceptance Criteria

1. THE feature SHALL NOT define, redefine, or alter the Lookup Protocol, Gap Capture, or Fallback Label behaviors owned by the Peer_Spec; THE six new Persona_Artifacts SHALL include those sections with the same semantics as the existing `nextjs-expert` and `react-native-expert` artifacts.
2. THE Install_Verify_Protocol section in each Persona_Artifact SHALL precede, in document order, the Lookup Protocol section.
3. WHEN the Lookup Protocol terminates in a True Miss, THE Gap Capture block in each Persona_Artifact SHALL reference the correct Knowledge_File for its Active_Stack (e.g., `knowledge/google-oauth.json` for the OAuth persona).
4. THE Fallback Label in each Persona_Artifact SHALL use the literal string `[ungrounded — general expertise]` verbatim.
