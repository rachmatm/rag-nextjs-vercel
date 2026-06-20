# Implementation Plan: Knowledge-Base Miss Handling

## Overview

Append hardened lookup-protocol documentation to 4 existing markdown files (2 steering files, 2 POWER.md files). The nextjs-expert versions are the template; react-native versions are derived by `s/nextjs-vercel/react-native/g`. No code changes.

## Tasks

- [x] 1. Append new sections to the nextjs-expert steering file
  - [x] 1.1 Append the four new sections (Lookup protocol, Similar-entries pivot, Gap Capture, Fallback Label) to `kiro-powers/nextjs-expert/steering/nextjs-expert.md` after the existing `## Domain coverage` section
    - Use the exact literal text specified in the design document's "Exact final text — steering file new sections (nextjs version)" block
    - Do not modify any pre-existing content in the file
    - _Requirements: 1.1, 1.3, 1.5, 1.7, 1.9, 1.11, 2.1, 2.3, 2.5, 2.7, 3.1, 3.3, 3.5, 3.7, 3.9, 4.1, 4.3, 4.5, 4.7, 4.9, 4.10, 5.3, 5.5, 5.7_

- [x] 2. Append new sections to the react-native-expert steering file
  - [x] 2.1 Append the four new sections (Lookup protocol, Similar-entries pivot, Gap Capture, Fallback Label) to `kiro-powers/react-native-expert/steering/react-native-expert.md` after the existing `## Domain coverage` section
    - Derive content from the nextjs version by replacing all occurrences of `nextjs-vercel` with `react-native`
    - Do not modify any pre-existing content in the file
    - _Requirements: 1.2, 1.4, 1.6, 1.8, 1.10, 1.12, 2.2, 2.4, 2.6, 2.8, 3.2, 3.4, 3.6, 3.8, 3.10, 4.2, 4.4, 4.6, 4.8, 4.9, 4.10, 5.1, 5.2, 5.4, 5.6, 5.7, 5.8_

- [x] 3. Append new section to the nextjs-expert POWER.md
  - [x] 3.1 Append the `## Knowledge-base miss handling` section to `kiro-powers/nextjs-expert/POWER.md` after the existing `## Stack isolation` section
    - Use the exact literal text specified in the design document's "Exact final text — POWER.md addition (nextjs version)" block
    - Do not modify any pre-existing content in the file
    - _Requirements: 6.1, 6.3, 6.5, 6.7_

- [x] 4. Append new section to the react-native-expert POWER.md
  - [x] 4.1 Append the `## Knowledge-base miss handling` section to `kiro-powers/react-native-expert/POWER.md` after the existing `## Stack isolation` section
    - Derive content from the nextjs version by replacing all occurrences of `nextjs-vercel` with `react-native`
    - Do not modify any pre-existing content in the file
    - _Requirements: 6.2, 6.4, 6.6, 6.8_

- [x] 5. Checkpoint — Verify correctness properties
  - Ensure all tests pass, ask the user if questions arise.
  - Run the six-property verification script from the design document's Testing Strategy section
  - Confirm: P3 parity (sed | diff is empty), P4/P5 pre-existing content preserved, P6 scope containment (git status clean outside permitted paths)
  - _Requirements: 5.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

## Notes

- This is a documentation-only change — all tasks are markdown file appends
- The nextjs-expert file is the canonical template; the react-native file is always derived by global `s/nextjs-vercel/react-native/g`
- No files outside the 4 permitted paths may be modified (enforced by Property 6)
- Pre-existing content in all 4 files must remain byte-identical (enforced by Properties 4 and 5)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["2.1", "4.1"] }
  ]
}
```
