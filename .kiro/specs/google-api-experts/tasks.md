# Implementation Plan: Google API Experts

## Overview

Add three framework-agnostic Google API knowledge stacks (`google-oauth`, `google-calendar`, `google-sheets`), each with its own knowledge JSON file, Kiro Power, and Claude Skill. The only code changes are registering the new stacks in `lib/db.ts`, `route.ts`, and `app/page.tsx`. Existing knowledge files and persona artifacts are never modified.

## Tasks

- [x] 1. Create knowledge JSON files
  - [x] 1.1 Create `knowledge/google-oauth.json`
    - Create a JSON array with at least 8 entries covering: consent-screen configuration, scope selection, token refresh flow, token persistence, redirect-URI debugging, and service-account setup
    - Every entry must have `"stack": "google-oauth"` and be framework-agnostic (no NextAuth, Prisma, or Next.js references in `fix` or `symptoms`)
    - Each entry must have non-empty `symptoms`, `fix`, and `tags` arrays, valid `severity` and `frequency` values
    - Use existing `nextjs-vercel.json` entries as structural reference but adapt content to be framework-agnostic
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 17.1, 17.2_

  - [x] 1.2 Create `knowledge/google-calendar.json`
    - Create a JSON array with at least 8 entries covering: event CRUD, push notifications/webhooks, timezone handling, rate limiting/quotas, recurring events, and permissions debugging
    - Every entry must have `"stack": "google-calendar"` and be framework-agnostic
    - Each entry must have non-empty `symptoms`, `fix`, and `tags` arrays, valid `severity` and `frequency` values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 17.1, 17.2_

  - [x] 1.3 Create `knowledge/google-sheets.json`
    - Create a JSON array with at least 8 entries covering: values.get/batchGet, update/append/batchUpdate, batch operations, service-account server-side access, Sheets-as-CMS pattern, and permissions debugging
    - Every entry must have `"stack": "google-sheets"` and be framework-agnostic
    - Each entry must have non-empty `symptoms`, `fix`, and `tags` arrays, valid `severity` and `frequency` values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 17.1, 17.2_

  - [x] 1.4 Write property tests for knowledge JSON schema compliance
    - **Property 1: Stack field matches filename** — for each file, verify all entries have `stack` equal to the filename-derived identifier
    - **Property 2: Schema compliance** — verify non-empty `symptoms`, `fix`, `tags`; valid `severity` and `frequency` values
    - **Property 3: Framework-agnostic content** — verify no NextAuth/Prisma/Next.js terms in `fix` or `symptoms`
    - **Validates: Requirements 1.3, 1.5, 1.6, 2.3, 2.5, 2.6, 3.3, 3.5, 3.6**

- [x] 2. Checkpoint - Verify knowledge files
  - Ensure all three JSON files parse without error and conform to the entry schema. Ask the user if questions arise.

- [x] 3. Create Google OAuth Kiro Power
  - [x] 3.1 Create `kiro-powers/google-oauth-expert/power.json`
    - Set `name: "google-oauth-expert"`, `displayName: "Google OAuth Expert"`, `version: "1.0.0"`
    - Include keywords: `"google"`, `"oauth"`, `"consent-screen"`, `"token-refresh"`, `"redirect-uri"`
    - Set `mcpServers.dev-knowledge.url` to `https://mcp-dev-knowledge.vercel.app/api/mcp`
    - Include `steering: ["steering/google-oauth-expert.md"]`
    - Use existing `kiro-powers/nextjs-expert/power.json` as the structural template
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Create `kiro-powers/google-oauth-expert/POWER.md`
    - Describe power purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior
    - Use existing `kiro-powers/nextjs-expert/POWER.md` as template, adapting for google-oauth domain
    - _Requirements: 4.3_

  - [x] 3.3 Create `kiro-powers/google-oauth-expert/steering/google-oauth-expert.md`
    - Include `inclusion: manual` YAML frontmatter
    - Set Active_Stack to `"google-oauth"`, list Forbidden_Stacks as all other stacks
    - Include Install_Verify_Protocol (Kiro variant with `~/.kiro/settings/mcp.json` references)
    - Include Lookup Protocol, Gap Capture (referencing `knowledge/google-oauth.json`), and Fallback Label (`[ungrounded — general expertise]`)
    - Domain coverage: consent-screen, scope selection, token refresh, token persistence, redirect-URI debugging, service-account setup
    - _Requirements: 4.4, 4.5, 4.6, 10.1, 10.3, 10.4, 10.5, 10.6, 10.7, 10.9, 11.1, 11.2, 11.3, 11.4, 12.1, 12.4, 12.5, 19.1, 19.2, 19.3, 19.4_

- [x] 4. Create Google Calendar Kiro Power
  - [x] 4.1 Create `kiro-powers/google-calendar-expert/power.json`
    - Set `name: "google-calendar-expert"`, `displayName: "Google Calendar Expert"`, `version: "1.0.0"`
    - Include keywords: `"google"`, `"calendar"`, `"events"`, `"webhooks"`, `"recurring"`
    - Set `mcpServers.dev-knowledge.url` to `https://mcp-dev-knowledge.vercel.app/api/mcp`
    - Include `steering: ["steering/google-calendar-expert.md"]`
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Create `kiro-powers/google-calendar-expert/POWER.md`
    - Describe power purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior
    - _Requirements: 5.3_

  - [x] 4.3 Create `kiro-powers/google-calendar-expert/steering/google-calendar-expert.md`
    - Include `inclusion: manual` YAML frontmatter
    - Set Active_Stack to `"google-calendar"`, list Forbidden_Stacks as all other stacks
    - Include Install_Verify_Protocol (Kiro variant), Lookup Protocol, Gap Capture (referencing `knowledge/google-calendar.json`), Fallback Label
    - Domain coverage: event CRUD, webhooks/push notifications, timezone handling, rate limiting, recurring events, permissions
    - _Requirements: 5.4, 5.5, 5.6, 10.1, 10.3, 10.4, 10.5, 10.6, 10.7, 10.9, 11.1, 11.2, 11.3, 11.4, 12.2, 12.4, 12.5, 19.1, 19.2, 19.3, 19.4_

- [x] 5. Create Google Sheets Kiro Power
  - [x] 5.1 Create `kiro-powers/google-sheets-expert/power.json`
    - Set `name: "google-sheets-expert"`, `displayName: "Google Sheets Expert"`, `version: "1.0.0"`
    - Include keywords: `"google"`, `"sheets"`, `"spreadsheet"`, `"batch"`, `"csv"`
    - Set `mcpServers.dev-knowledge.url` to `https://mcp-dev-knowledge.vercel.app/api/mcp`
    - Include `steering: ["steering/google-sheets-expert.md"]`
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Create `kiro-powers/google-sheets-expert/POWER.md`
    - Describe power purpose, MCP server details, tools exposed, stack isolation rule, and miss-handling behavior
    - _Requirements: 6.3_

  - [x] 5.3 Create `kiro-powers/google-sheets-expert/steering/google-sheets-expert.md`
    - Include `inclusion: manual` YAML frontmatter
    - Set Active_Stack to `"google-sheets"`, list Forbidden_Stacks as all other stacks
    - Include Install_Verify_Protocol (Kiro variant), Lookup Protocol, Gap Capture (referencing `knowledge/google-sheets.json`), Fallback Label
    - Domain coverage: values.get/batchGet, update/append/batchUpdate, batch operations, service-account access, Sheets-as-CMS, permissions
    - _Requirements: 6.4, 6.5, 6.6, 10.1, 10.3, 10.4, 10.5, 10.6, 10.7, 10.9, 11.1, 11.2, 11.3, 11.4, 12.3, 12.4, 12.5, 19.1, 19.2, 19.3, 19.4_

- [x] 6. Create Google OAuth Claude Skill
  - [x] 6.1 Create `claude-skills/google-oauth-expert/SKILL.md`
    - YAML frontmatter: `name: google-oauth-expert`, `description:` identifying persona as a Google OAuth engineer backed by `dev-knowledge` MCP server
    - Set Active_Stack to `"google-oauth"`, Forbidden_Stacks as all others
    - Include Install_Verify_Protocol (Claude Code variant with `claude mcp add` CLI)
    - Include Lookup Protocol, Gap Capture (referencing `knowledge/google-oauth.json`), Fallback Label (`[ungrounded — general expertise]`)
    - Reference MCP_Server_URL and optional MCP_Auth_Header
    - Same domain coverage as the corresponding steering file (consent-screen, scopes, token refresh, etc.)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9, 11.1, 11.2, 11.3, 11.4, 12.1, 12.4, 12.5, 16.1, 19.1, 19.2, 19.3, 19.4_

- [x] 7. Create Google Calendar Claude Skill
  - [x] 7.1 Create `claude-skills/google-calendar-expert/SKILL.md`
    - YAML frontmatter: `name: google-calendar-expert`, `description:` identifying persona as a Google Calendar API engineer backed by `dev-knowledge` MCP server
    - Set Active_Stack to `"google-calendar"`, Forbidden_Stacks as all others
    - Include Install_Verify_Protocol (Claude Code variant), Lookup Protocol, Gap Capture (referencing `knowledge/google-calendar.json`), Fallback Label
    - Reference MCP_Server_URL and optional MCP_Auth_Header
    - Same domain coverage as the corresponding steering file (events, webhooks, timezone, etc.)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9, 11.1, 11.2, 11.3, 11.4, 12.2, 12.4, 12.5, 16.2, 19.1, 19.2, 19.3, 19.4_

- [x] 8. Create Google Sheets Claude Skill
  - [x] 8.1 Create `claude-skills/google-sheets-expert/SKILL.md`
    - YAML frontmatter: `name: google-sheets-expert`, `description:` identifying persona as a Google Sheets API engineer backed by `dev-knowledge` MCP server
    - Set Active_Stack to `"google-sheets"`, Forbidden_Stacks as all others
    - Include Install_Verify_Protocol (Claude Code variant), Lookup Protocol, Gap Capture (referencing `knowledge/google-sheets.json`), Fallback Label
    - Reference MCP_Server_URL and optional MCP_Auth_Header
    - Same domain coverage as the corresponding steering file (read/write, batch ops, Sheets-as-CMS, etc.)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9, 11.1, 11.2, 11.3, 11.4, 12.3, 12.4, 12.5, 16.3, 19.1, 19.2, 19.3, 19.4_

- [x] 9. Checkpoint - Verify persona artifacts
  - Verify parity between each Kiro steering file and its corresponding Claude SKILL.md (delta should be host-specific install instructions only)
  - Verify each steering file has `Install_Verify_Protocol` before `Lookup protocol` in document order
  - Verify each Gap Capture references the correct `knowledge/<stack>.json`
  - Verify each artifact contains the literal `[ungrounded — general expertise]` Fallback Label
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update code to register new stacks
  - [x] 10.1 Update `KNOWN_STACKS` in `lib/db.ts`
    - Add `"google-oauth"`, `"google-calendar"`, `"google-sheets"` to the `KNOWN_STACKS` array
    - Existing `"nextjs-vercel"` and `"react-native"` values remain unchanged
    - _Requirements: 13.1, 13.2, 13.3, 18.1, 18.4_

  - [x] 10.2 Update `STACK_DESCRIPTION` and `instructions` in `app/api/[transport]/route.ts`
    - Add `'google-oauth'`, `'google-calendar'`, `'google-sheets'` to the `STACK_DESCRIPTION` string with short parenthetical descriptions
    - Update the `search_knowledge_base` tool description to mention five stacks
    - Update the `instructions` string in `serverInfo` to mention five stacks and list all three new ones
    - Existing `nextjs-vercel` and `react-native` descriptions remain unchanged in substance
    - _Requirements: 14.1, 14.2, 14.3, 18.1, 18.2_

  - [x] 10.3 Update `STACK_INFO` in `app/page.tsx`
    - Add entries for `"google-oauth"`, `"google-calendar"`, and `"google-sheets"` with appropriate `label` and `blurb`
    - Existing entries for `"nextjs-vercel"` and `"react-native"` remain unchanged
    - _Requirements: 15.1, 15.2, 15.3, 18.1_

- [x] 11. Write property tests for persona artifacts
  - [x] 11.1 Write property test for Install_Verify_Protocol ordering
    - **Property 6: Install_Verify_Protocol precedes Lookup Protocol** — verify section ordering in all six persona artifacts
    - **Validates: Requirements 19.2**

  - [x] 11.2 Write property test for Gap Capture file references
    - **Property 7: Gap Capture references correct knowledge file** — verify each persona's Gap Capture references `knowledge/<active-stack>.json`
    - **Validates: Requirements 19.3**

  - [x] 11.3 Write property test for Fallback Label consistency
    - **Property 8: Fallback Label literal consistency** — verify all six artifacts contain `[ungrounded — general expertise]` verbatim
    - **Validates: Requirements 19.4**

- [x] 12. Final checkpoint
  - Verify `git status --porcelain` shows only permitted paths: `knowledge/google-*.json`, `kiro-powers/google-*-expert/**`, `claude-skills/google-*-expert/**`, `lib/db.ts`, `app/api/[transport]/route.ts`, `app/page.tsx`
  - Confirm no changes to existing knowledge files (`nextjs-vercel.json`, `react-native.json`), existing powers, existing skills, `export-to-neon.mjs`, `package.json`, `next.config.mjs`, `vercel.json`, or `tsconfig.json`
  - Run `npm run build` to verify no TypeScript errors introduced
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Existing knowledge files are NEVER modified — new stacks are additive only
- The Next.js expert power/skill pattern is used as the template for all three new Google API experts
- `export-to-neon.mjs` already reads all `knowledge/*.json` files — no changes needed
- No new npm packages, no schema changes to the database
- Property-based tests validate the static JSON knowledge files and persona artifact structure
- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "3.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.2", "4.3", "5.2", "5.3"] },
    { "id": 3, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 4, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 5, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
