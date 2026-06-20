# Implementation Plan: Claude Skills + MCP Install-Verify Protocol

## Overview

Documentation-only feature creating two Claude Code SKILL.md files and adding an Install_Verify_Protocol section to two existing Kiro steering files (plus minor POWER.md updates). The Next.js variant is always authored first as the template; the React Native variant is derived by stack-token substitution plus domain-specific content.

## Tasks

- [x] 1. Create the Next.js Claude Skill
  - [x] 1.1 Create `claude-skills/nextjs-expert/SKILL.md`
    - Create the directory `claude-skills/nextjs-expert/`
    - Write `SKILL.md` with YAML frontmatter (`name: nextjs-expert`, `description:` paragraph identifying the persona as a senior Next.js App Router + Vercel engineer backed by `dev-knowledge` MCP server)
    - Body sections in order: persona intro, stack scoping (`nextjs-vercel`, forbid `react-native`), Install_Verify_Protocol (Claude Code variant with `claude mcp add` CLI and `~/.claude.json` manual fallback), How to use the MCP tools, Answering style (App Router preference, server components, etc.), Domain coverage (routing, server components, server actions, middleware, streaming, caching, Prisma/Neon, Drizzle/Turso, Supabase, Upstash Redis/QStash, Inngest, Vercel Blob, Google APIs, deployment, env config), Lookup protocol, Similar-entries pivot, Gap Capture, Fallback Label
    - Reference MCP_Server_URL `https://mcp-dev-knowledge.vercel.app/api/mcp` and optional auth header `Authorization: Bearer ${MCP_API_KEY}`
    - Install_Verify_Protocol uses `list_knowledge_filters` (no args) as the reachability probe; on transport error offer `claude mcp add --transport http` walk-through; on 401 guide user to set `MCP_API_KEY`; on Decline_Decision continue on general expertise, defer labeling to Fallback Label rule, skip re-prompting for the session
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 5.1, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 9.2, 9.3, 11.6_

- [x] 2. Create the React Native Claude Skill
  - [x] 2.1 Create `claude-skills/react-native-expert/SKILL.md`
    - Derive from the Next.js SKILL.md by substituting `nextjs-vercel` → `react-native`, `react-native` → `nextjs-vercel` (for Forbidden_Stack), and swapping domain coverage to React Native topics (Expo managed/bare, Metro, Watchman, react-navigation, expo-router, native builds, Hermes, New Architecture, react-native-web, reanimated, gesture-handler, FlatList/FlashList, AsyncStorage/MMKV/SecureStore, EAS build/update, permissions, platform-difference call-outs)
    - YAML frontmatter: `name: react-native-expert`, `description:` paragraph identifying as senior React Native engineer (Expo + bare, web/Android/iOS) backed by `dev-knowledge` MCP server
    - Install_Verify_Protocol section identical in structure to Next.js variant, differing only in Active_Stack (`react-native`), Forbidden_Stack (`nextjs-vercel`), and knowledge file path (`knowledge/react-native.json`)
    - Preserve platform-differences note from existing steering file
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 5.2, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.2, 7.3, 7.4, 8.2, 8.3, 8.4, 9.2, 9.3, 11.6_

- [x] 3. Add Install_Verify_Protocol to Kiro steering files
  - [x] 3.1 Add `## Install_Verify_Protocol` section to `kiro-powers/nextjs-expert/steering/nextjs-expert.md`
    - Insert after `## Stack scoping (critical)` and before `## How to use the MCP tools`
    - Kiro-host variant: references `~/.kiro/settings/mcp.json` (user-global) and `.kiro/settings/mcp.json` (workspace)
    - Include JSON snippet registering `dev-knowledge` server with `url` and optional `Authorization` header
    - On 401: guide user to set `MCP_API_KEY` env var and restart Kiro
    - On Decline_Decision: continue on general expertise, defer to Fallback Label, no re-prompting
    - Preserve existing YAML frontmatter (`inclusion: manual`) byte-for-byte
    - Preserve all existing sections, tool names, and prohibition on fabricating entry ids
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.3, 4.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 9.1, 9.2, 10.1, 10.4, 10.5_

  - [x] 3.2 Add `## Install_Verify_Protocol` section to `kiro-powers/react-native-expert/steering/react-native-expert.md`
    - Same structure as 3.1, differing only in Active_Stack (`react-native`), Forbidden_Stack (`nextjs-vercel`), and knowledge file path (`knowledge/react-native.json`)
    - Preserve existing YAML frontmatter (`inclusion: manual`) byte-for-byte
    - _Requirements: 3.2, 3.5, 3.6, 3.7, 3.8, 3.9, 4.2, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 7.2, 7.3, 8.1, 9.1, 9.2, 10.2, 10.4, 10.5_

- [x] 4. Update POWER.md files
  - [x] 4.1 Add verification note to `kiro-powers/nextjs-expert/POWER.md`
    - Add a brief note in the "How to use" section mentioning that the steering now verifies MCP server reachability on first activation and offers an install walk-through if unavailable
    - _Requirements: 11.1_

  - [x] 4.2 Add verification note to `kiro-powers/react-native-expert/POWER.md`
    - Same note as 4.1
    - _Requirements: 11.1_

- [x] 5. Final checkpoint
  - Ensure parity: diff the two SKILL.md files — delta should contain only stack-specific tokens (`nextjs-vercel` vs `react-native`, domain wording, knowledge file path). Same for the two Install_Verify_Protocol sections in steering files.
  - Verify `git status --porcelain` shows only permitted paths: `claude-skills/**`, `kiro-powers/nextjs-expert/steering/nextjs-expert.md`, `kiro-powers/react-native-expert/steering/react-native-expert.md`, `kiro-powers/nextjs-expert/POWER.md`, `kiro-powers/react-native-expert/POWER.md`
  - Confirm no changes to `power.json` files, `app/`, `lib/`, `knowledge/`, `export-to-neon.mjs`, or any config file
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is a documentation-only feature — no application code changes
- The Next.js variant is always authored first as the template; React Native is derived by token substitution
- Property-based tests are not applicable (no code logic to test)
- Each SKILL.md is self-contained: it carries the full persona body including Lookup Protocol, Similar-entries pivot, Gap Capture, and Fallback Label sections
- The Install_Verify_Protocol is duplicated (not shared as a file) across all four artifacts, varying only by host-specific install instructions and stack values

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2"] }
  ]
}
```
