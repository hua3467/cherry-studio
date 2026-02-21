# Changelog

## [Unreleased]

### Fixed

- **Pre-commit hooks** (2025-02-21): `biome-format-js` (and related hooks) no longer fail with "No such file or directory" when committing from environments where `pnpm` is not in PATH (e.g. some GUI Git clients). Hooks now call `./node_modules/.bin/biome` and `./node_modules/.bin/eslint` directly.

### Added

- **Assistant folders** (2025-02-20): Group assistants in folders in the sidebar.
  - New Redux slice `folders` stores assistant folders and topic folders (no changes to `Assistant` or `Topic` types).
  - New view mode "Folder View" in the Assistants list (via assistant context menu: List View / Tag View / Folder View).
  - Add folder, rename, delete, collapse; move assistants via "Move to folder" in the assistant context menu.
- **Topic folders** (2025-02-20): Group topics under each assistant in folders.
  - "Add folder" button in the Topics tab header to create topic folders for the current assistant.
  - "Move to folder" in the topic context menu to assign a topic to a folder or Uncategorized.
  - Folder assignment is persisted in the `folders` slice; topic list remains flat for now (grouped display can be added later).

### Technical

- New files: `src/renderer/src/types/folders.ts`, `src/renderer/src/store/folders.ts`, `src/renderer/src/hooks/useFolders.ts`, `src/renderer/src/pages/home/Tabs/components/AssistantFolderTree.tsx`.
- Store version bumped to 199; migration 199 added for the new `folders` slice.
- `folders/` added to store sync list for multi-window consistency.
