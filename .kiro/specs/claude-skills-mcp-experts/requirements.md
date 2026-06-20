# Requirements Document

## Introduction

The `mcp-dev-knowledge` repository ships two Kiro Powers — **Next.js / Vercel Expert** (`nextjs-vercel` stack) and **React Native Expert** (`react-native` stack) — each backed by the live `dev-knowledge` MCP server. Today these personas exist only as Kiro Powers, so users of Claude Code cannot adopt the same KB-grounded experts inside their host. In addition, none of the existing artifacts verify that the `dev-knowledge` MCP server is actually installed and reachable in the user's host before answering domain questions; when the server is missing, the agent silently degrades to general expertise without ever telling the user that the server could be installed.

This feature adds two Claude Code Skills that mirror the two existing Kiro Powers, and adds a shared **MCP install-and-verify** instruction set to all four persona artifacts (the two existing Kiro power steering files and the two new Claude skills). Each Claude skill is a self-contained folder under a new top-level `claude-skills/` directory containing the artifacts a Claude Code skill expects (a `SKILL.md` plus any supporting markdown). Each persona stays bound to exactly one stack: the Next.js variant queries only `nextjs-vercel`, the React Native variant queries only `react-native`. Each persona points at the live MCP server URL `https://mcp-dev-knowledge.vercel.app/api/mcp` (Streamable HTTP) with optional `Authorization: Bearer ${MCP_API_KEY}` auth.

The shared MCP install-and-verify instruction set tells the agent to first detect whether the `dev-knowledge` MCP server is installed and reachable in the current host, and, if not, walk the user through registering it for the appropriate host (Kiro or Claude Code). The user may decline installation; in that case the agent MUST be allowed to continue answering using general expertise, deferring to the fallback-labeling behavior already specified by the peer spec `knowledge-base-miss-handling` rather than re-specifying it here.

This feature is documentation/configuration content only. It does not modify code under `app/`, `lib/`, `knowledge/`, or `export-to-neon.mjs`, and it does not change any MCP tool schema. It also does not implement the broader knowledge-base miss-handling improvements (Lookup Protocol, Gap Capture, Fallback Label); those remain owned by the `knowledge-base-miss-handling` spec and are referenced here as a precondition that the four artifacts must remain compatible with.

## Glossary

- **MCP_Server**: The `dev-knowledge` MCP server deployed at the URL `https://mcp-dev-knowledge.vercel.app/api/mcp` over Streamable HTTP. Exposes the tools `search_knowledge_base`, `get_knowledge_entry`, `find_similar_entries`, and `list_knowledge_filters`. Optional shared-secret auth via `Authorization: Bearer ${MCP_API_KEY}`.
- **MCP_Server_URL**: The literal string `https://mcp-dev-knowledge.vercel.app/api/mcp`.
- **MCP_Auth_Header**: The literal string `Authorization: Bearer ${MCP_API_KEY}`.
- **Stack**: A strictly-isolated knowledge partition served by the MCP_Server. Valid values in this repository are `nextjs-vercel` and `react-native`.
- **Active_Stack**: The single Stack value a Persona_Artifact is bound to. The Next.js variants are bound to `nextjs-vercel`; the React Native variants are bound to `react-native`.
- **Forbidden_Stack**: For a given Persona_Artifact, the Stack value that is not the Active_Stack.
- **Host**: The runtime that loads a Persona_Artifact. The two Hosts in scope are **Kiro** and **Claude Code**.
- **Kiro_Power**: An installable Kiro extension under `kiro-powers/<name>/` containing `POWER.md`, `power.json`, and `steering/<name>.md`.
- **Claude_Skill**: An installable Claude Code extension under `claude-skills/<name>/` containing `SKILL.md` (with YAML frontmatter) and any supporting markdown files in the same folder.
- **Skill_File**: The `SKILL.md` file for a Claude_Skill, specifically `claude-skills/nextjs-expert/SKILL.md` or `claude-skills/react-native-expert/SKILL.md`.
- **Steering_File**: The Kiro_Power steering file with frontmatter `inclusion: manual`, specifically `kiro-powers/nextjs-expert/steering/nextjs-expert.md` or `kiro-powers/react-native-expert/steering/react-native-expert.md`.
- **Persona_Artifact**: Any one of the four agent-facing definitions in scope: the two Steering_Files plus the two Skill_Files.
- **Nextjs_Persona_Artifact**: Either `kiro-powers/nextjs-expert/steering/nextjs-expert.md` or `claude-skills/nextjs-expert/SKILL.md`.
- **ReactNative_Persona_Artifact**: Either `kiro-powers/react-native-expert/steering/react-native-expert.md` or `claude-skills/react-native-expert/SKILL.md`.
- **Agent**: The LLM that loads a Persona_Artifact's body as instructions.
- **Install_Verify_Protocol**: The shared instruction block, defined by this feature, that tells the Agent to (a) detect MCP_Server availability, (b) walk the user through installation when the server is unavailable, and (c) honor a user decision to decline installation by continuing on general expertise.
- **Server_Reachable**: The state in which a `dev-knowledge` MCP tool call from the current Host succeeds (no transport error, no HTTP 401, returns a structured result).
- **Server_Unavailable**: The state in which the `dev-knowledge` server is not registered with the current Host or a `dev-knowledge` MCP tool call from the current Host fails with a transport error or with HTTP 401.
- **Decline_Decision**: An explicit user choice, communicated in response to the install walk-through, to skip installation and continue with general-expertise answers for the current session.
- **Peer_Spec**: The separate spec `knowledge-base-miss-handling`, which defines the Lookup Protocol, Gap Capture, and Fallback Label behaviors that all four Persona_Artifacts must remain compatible with.

## Requirements

### Requirement 1: Create the Next.js Claude Skill

**User Story:** As a Claude Code user, I want a Next.js / Vercel expert skill that mirrors the existing Kiro power, so that I can use the same KB-grounded persona inside Claude Code.

#### Acceptance Criteria

1. THE Repository SHALL contain a Claude_Skill folder at `claude-skills/nextjs-expert/`.
2. THE Repository SHALL contain a Skill_File at `claude-skills/nextjs-expert/SKILL.md`.
3. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL begin with YAML frontmatter that contains the key `name` with value `nextjs-expert` and the key `description` with a single-paragraph summary identifying the persona as a senior Next.js (App Router) and Vercel engineer backed by the `dev-knowledge` MCP server.
4. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL state that the persona's Active_Stack is `nextjs-vercel` and SHALL instruct the Agent to pass `stack: "nextjs-vercel"` on every call to `search_knowledge_base` and `list_knowledge_filters` made by this persona.
5. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL prohibit the Agent from passing `stack: "react-native"` on any tool call made under this persona.
6. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL describe the same domain coverage and answering style as the Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md`, including App Router conventions, server components, server actions, middleware, streaming, caching, Prisma, Neon, Drizzle, Turso, Supabase, Upstash Redis, Upstash QStash, Inngest, Vercel Blob, Google APIs, deployment, and environment configuration.
7. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL reference the MCP_Server_URL `https://mcp-dev-knowledge.vercel.app/api/mcp` and the optional MCP_Auth_Header `Authorization: Bearer ${MCP_API_KEY}` when describing how the skill connects to the MCP_Server.

### Requirement 2: Create the React Native Claude Skill

**User Story:** As a Claude Code user, I want a React Native expert skill that mirrors the existing Kiro power, so that I can use the same KB-grounded persona inside Claude Code.

#### Acceptance Criteria

1. THE Repository SHALL contain a Claude_Skill folder at `claude-skills/react-native-expert/`.
2. THE Repository SHALL contain a Skill_File at `claude-skills/react-native-expert/SKILL.md`.
3. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL begin with YAML frontmatter that contains the key `name` with value `react-native-expert` and the key `description` with a single-paragraph summary identifying the persona as a senior React Native engineer (Expo and bare workflow, for web, Android, and iOS) backed by the `dev-knowledge` MCP server.
4. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL state that the persona's Active_Stack is `react-native` and SHALL instruct the Agent to pass `stack: "react-native"` on every call to `search_knowledge_base` and `list_knowledge_filters` made by this persona.
5. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL prohibit the Agent from passing `stack: "nextjs-vercel"` on any tool call made under this persona.
6. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL describe the same domain coverage and answering style as the Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md`, including Expo (managed and bare), Metro, Watchman, react-navigation, expo-router, native builds (Gradle, CocoaPods, Xcode), Hermes, the New Architecture (Fabric, TurboModules), react-native-web, reanimated, gesture-handler, FlatList, FlashList, AsyncStorage, MMKV, SecureStore, EAS build, EAS update, permissions, and explicit platform-difference call-outs (iOS vs Android vs web).
7. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL reference the MCP_Server_URL `https://mcp-dev-knowledge.vercel.app/api/mcp` and the optional MCP_Auth_Header `Authorization: Bearer ${MCP_API_KEY}` when describing how the skill connects to the MCP_Server.

### Requirement 3: Define a shared Install_Verify_Protocol present in all four Persona_Artifacts

**User Story:** As a developer activating any one of the four expert personas, I want the agent to first verify the `dev-knowledge` MCP server is installed and reachable in my host, so that I never silently get ungrounded answers because of a missing MCP server.

#### Acceptance Criteria

1. THE Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md` SHALL contain an Install_Verify_Protocol section.
2. THE Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md` SHALL contain an Install_Verify_Protocol section.
3. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL contain an Install_Verify_Protocol section.
4. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL contain an Install_Verify_Protocol section.
5. THE Install_Verify_Protocol SHALL instruct the Agent, on the first activation of the Persona_Artifact in a session, to verify reachability of the MCP_Server before composing the first substantive answer by attempting a `dev-knowledge` MCP tool call from the current Host.
6. WHERE the verification call has already succeeded earlier in the same session, THE Install_Verify_Protocol SHALL instruct the Agent to skip re-verification on subsequent questions in that session.
7. WHEN the verification call succeeds, THE Install_Verify_Protocol SHALL instruct the Agent to proceed with the user's substantive question without further user prompting.
8. IF the verification call indicates Server_Unavailable, THEN THE Install_Verify_Protocol SHALL instruct the Agent to surface the unavailability to the user and offer the Host-specific install walk-through defined in Requirement 4 or Requirement 5 (whichever matches the current Host).
9. THE Install_Verify_Protocol SHALL reference the MCP_Server_URL `https://mcp-dev-knowledge.vercel.app/api/mcp` and the optional MCP_Auth_Header `Authorization: Bearer ${MCP_API_KEY}` consistently across all four Persona_Artifacts.

### Requirement 4: Kiro-host installation walk-through inside the two Steering_Files

**User Story:** As a Kiro user activating one of the Kiro_Powers, I want the install walk-through to point me at Kiro's MCP configuration files, so that I can register the `dev-knowledge` server in the right place.

#### Acceptance Criteria

1. WHERE the current Host is Kiro, THE Install_Verify_Protocol section in the Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md` SHALL reference the user-global Kiro MCP configuration path `~/.kiro/settings/mcp.json` and the workspace-level path `.kiro/settings/mcp.json`.
2. WHERE the current Host is Kiro, THE Install_Verify_Protocol section in the Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md` SHALL reference the user-global Kiro MCP configuration path `~/.kiro/settings/mcp.json` and the workspace-level path `.kiro/settings/mcp.json`.
3. THE Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md` SHALL include, inside its Install_Verify_Protocol section, a JSON snippet registering the `dev-knowledge` server with `url` set to `https://mcp-dev-knowledge.vercel.app/api/mcp` and an optional header `Authorization: Bearer ${MCP_API_KEY}`.
4. THE Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md` SHALL include, inside its Install_Verify_Protocol section, a JSON snippet registering the `dev-knowledge` server with `url` set to `https://mcp-dev-knowledge.vercel.app/api/mcp` and an optional header `Authorization: Bearer ${MCP_API_KEY}`.
5. WHERE the verification call fails with HTTP 401, THE Install_Verify_Protocol section in each Steering_File SHALL instruct the Agent to inform the user that `MCP_API_KEY` is missing or invalid and to guide the user through setting the environment variable and restarting Kiro.

### Requirement 5: Claude-Code-host installation walk-through inside the two Skill_Files

**User Story:** As a Claude Code user activating one of the Claude_Skills, I want the install walk-through to point me at Claude Code's MCP configuration mechanism, so that I can register the `dev-knowledge` server in the right place.

#### Acceptance Criteria

1. WHERE the current Host is Claude Code, THE Install_Verify_Protocol section in the Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL reference Claude Code's MCP configuration mechanism under the user's `~/.claude/` configuration directory; THE exact file name and JSON shape SHALL be confirmed during the design phase of this feature and SHALL be consistent across both Skill_Files.
2. WHERE the current Host is Claude Code, THE Install_Verify_Protocol section in the Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL reference Claude Code's MCP configuration mechanism under the user's `~/.claude/` configuration directory; THE exact file name and JSON shape SHALL be confirmed during the design phase of this feature and SHALL be consistent across both Skill_Files.
3. THE Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL include, inside its Install_Verify_Protocol section, a registration snippet for the `dev-knowledge` server that sets the URL to `https://mcp-dev-knowledge.vercel.app/api/mcp` and includes the optional header `Authorization: Bearer ${MCP_API_KEY}`.
4. THE Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL include, inside its Install_Verify_Protocol section, a registration snippet for the `dev-knowledge` server that sets the URL to `https://mcp-dev-knowledge.vercel.app/api/mcp` and includes the optional header `Authorization: Bearer ${MCP_API_KEY}`.
5. WHERE the verification call fails with HTTP 401, THE Install_Verify_Protocol section in each Skill_File SHALL instruct the Agent to inform the user that `MCP_API_KEY` is missing or invalid and to guide the user through setting the environment variable and restarting Claude Code.

### Requirement 6: Non-blocking behavior on a Decline_Decision

**User Story:** As a user who does not want to install the MCP server right now, I want the agent to continue answering my question on general expertise, so that the install walk-through never holds my work hostage.

#### Acceptance Criteria

1. WHEN the user issues a Decline_Decision in response to the install walk-through, THE Install_Verify_Protocol section in each Persona_Artifact SHALL instruct the Agent to continue answering the user's substantive question on general expertise.
2. WHEN the Agent continues on general expertise after a Decline_Decision, THE Install_Verify_Protocol section in each Persona_Artifact SHALL defer the labeling of that answer to the Fallback Label behavior defined by the Peer_Spec `knowledge-base-miss-handling`, and SHALL NOT redefine that labeling inside the Persona_Artifact.
3. WHILE the Decline_Decision remains in effect for the current session, THE Install_Verify_Protocol section in each Persona_Artifact SHALL instruct the Agent to skip re-prompting the user about installation on subsequent questions in that session.
4. THE Install_Verify_Protocol section in each Persona_Artifact SHALL NOT instruct the Agent to refuse, defer, or block answering after a Decline_Decision.

### Requirement 7: Stack isolation across the Install_Verify_Protocol

**User Story:** As a maintainer of the four artifacts, I want stack isolation preserved even during installation verification, so that a Next.js persona never queries the React Native stack and vice versa.

#### Acceptance Criteria

1. THE Install_Verify_Protocol section in each Nextjs_Persona_Artifact SHALL pass `stack: "nextjs-vercel"` on any verification or follow-up `dev-knowledge` MCP tool call that requires a `stack` argument.
2. THE Install_Verify_Protocol section in each ReactNative_Persona_Artifact SHALL pass `stack: "react-native"` on any verification or follow-up `dev-knowledge` MCP tool call that requires a `stack` argument.
3. THE Install_Verify_Protocol section in each Persona_Artifact SHALL prohibit the Agent from passing the Forbidden_Stack value on any tool call.
4. WHERE the verification call uses `list_knowledge_filters` to probe MCP_Server reachability, THE Install_Verify_Protocol section MAY omit the optional `stack` argument on that probe call only, and SHALL still prohibit subsequent calls from using the Forbidden_Stack value.

### Requirement 8: Parity between the Next.js variant and the React Native variant of each artifact pair

**User Story:** As a maintainer of the four artifacts, I want the Next.js and React Native variants of each artifact to differ only by stack value and knowledge file path, so that future changes can be applied symmetrically and reviewed easily.

#### Acceptance Criteria

1. THE Install_Verify_Protocol section in `kiro-powers/nextjs-expert/steering/nextjs-expert.md` and the Install_Verify_Protocol section in `kiro-powers/react-native-expert/steering/react-native-expert.md` SHALL differ only in the literal Active_Stack value (`nextjs-vercel` vs `react-native`), the literal Forbidden_Stack value, and the literal knowledge file path (`knowledge/nextjs-vercel.json` vs `knowledge/react-native.json`).
2. THE Install_Verify_Protocol section in `claude-skills/nextjs-expert/SKILL.md` and the Install_Verify_Protocol section in `claude-skills/react-native-expert/SKILL.md` SHALL differ only in the literal Active_Stack value (`nextjs-vercel` vs `react-native`), the literal Forbidden_Stack value, and the literal knowledge file path (`knowledge/nextjs-vercel.json` vs `knowledge/react-native.json`).
3. THE persona body of `claude-skills/nextjs-expert/SKILL.md` and the persona body of `claude-skills/react-native-expert/SKILL.md` SHALL differ only in stack-specific values (Active_Stack, Forbidden_Stack, knowledge file path) and in the stack-specific domain wording inherited from the corresponding Steering_File.
4. WHERE the existing Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md` already contains stack-specific guidance such as the platform-differences note and the React Native domain-coverage list, THE corresponding Skill_File at `claude-skills/react-native-expert/SKILL.md` SHALL preserve that stack-specific guidance verbatim in substance.
5. WHERE the existing Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md` already contains stack-specific guidance such as the App Router preference note and the Next.js domain-coverage list, THE corresponding Skill_File at `claude-skills/nextjs-expert/SKILL.md` SHALL preserve that stack-specific guidance verbatim in substance.

### Requirement 9: Compatibility with the Peer_Spec `knowledge-base-miss-handling`

**User Story:** As a maintainer of the four artifacts, I want this feature to compose cleanly with the in-progress `knowledge-base-miss-handling` spec, so that the Lookup Protocol, Gap Capture, and Fallback Label behaviors continue to work after the Install_Verify_Protocol is added.

#### Acceptance Criteria

1. THE feature SHALL NOT define, redefine, or alter the Lookup Protocol, Gap Capture, or Fallback Label behaviors that are owned by the Peer_Spec.
2. THE Install_Verify_Protocol section in each Persona_Artifact SHALL precede, in document order, the section that documents the Peer_Spec's Lookup Protocol once that Peer_Spec is implemented; until then, THE Install_Verify_Protocol section MAY appear at the head of the persona body.
3. THE feature SHALL preserve the existing instruction in both Steering_Files to call `search_knowledge_base` first before attempting a fix or recommending a pattern, and SHALL carry the equivalent instruction over to both Skill_Files.
4. WHERE the Peer_Spec instructs the Agent to label ungrounded fallback answers, THE Install_Verify_Protocol section in each Persona_Artifact SHALL refer to that labeling rule rather than introducing a new label.

### Requirement 10: Preserve existing constraints of the Steering_Files and the `power.json` files

**User Story:** As a Kiro_Power maintainer, I want the existing power packaging untouched aside from the steering content additions, so that activation and tool registration behaviors do not regress.

#### Acceptance Criteria

1. THE updated Steering_File at `kiro-powers/nextjs-expert/steering/nextjs-expert.md` SHALL retain its existing YAML frontmatter `inclusion: manual` byte-for-byte.
2. THE updated Steering_File at `kiro-powers/react-native-expert/steering/react-native-expert.md` SHALL retain its existing YAML frontmatter `inclusion: manual` byte-for-byte.
3. THE feature SHALL NOT modify `kiro-powers/nextjs-expert/power.json` or `kiro-powers/react-native-expert/power.json`.
4. THE updated Steering_Files SHALL retain the existing tool list (`search_knowledge_base`, `get_knowledge_entry`, `find_similar_entries`, `list_knowledge_filters`) and SHALL NOT introduce or rename any MCP tool.
5. THE updated Steering_Files SHALL retain the existing prohibition on fabricating entry ids.

### Requirement 11: Scope containment

**User Story:** As the maintainer of this repository, I want this feature strictly contained to the four Persona_Artifacts and the new `claude-skills/` folder, so that no MCP server code, knowledge data, or build script is altered as a side effect.

#### Acceptance Criteria

1. THE feature SHALL restrict file modifications and additions to the following paths: `kiro-powers/nextjs-expert/steering/nextjs-expert.md`, `kiro-powers/react-native-expert/steering/react-native-expert.md`, `kiro-powers/nextjs-expert/POWER.md`, `kiro-powers/react-native-expert/POWER.md`, and any file under the new top-level directory `claude-skills/`.
2. THE feature SHALL NOT create, delete, rename, or modify any file under `app/`, `lib/`, `knowledge/`, or `node_modules/`, and SHALL NOT modify `export-to-neon.mjs`.
3. THE feature SHALL NOT create, delete, rename, or modify `package.json`, `package-lock.json`, `next.config.mjs`, `vercel.json`, `tsconfig.json`, `README.md`, `.env`, `.env.example`, or `.gitignore`.
4. THE feature SHALL NOT add a new MCP tool, remove an existing MCP tool, rename an existing MCP tool, change any field name in an existing tool's input schema, change the type of any existing input schema field, change the optional or required status of any existing input schema field, or change the `.describe(...)` text of any existing input schema field.
5. WHERE Requirement 4 mandates additions to a Steering_File, THE feature SHALL limit modifications of that Steering_File to those additions plus any wording changes that follow directly from the Install_Verify_Protocol additions.
6. WHERE Requirement 1 or Requirement 2 mandates the creation of a new Skill_File or supporting markdown file under `claude-skills/`, THE feature SHALL place every such file under `claude-skills/<persona-name>/` and SHALL NOT place any such file outside that directory.
7. IF any file outside the paths enumerated in criterion 1 is reported as added, modified, deleted, or renamed by `git status --porcelain` after the feature is applied, THEN the feature SHALL be considered failed and all modifications SHALL be reverted so that `git status --porcelain` reports no changes outside the permitted paths.
