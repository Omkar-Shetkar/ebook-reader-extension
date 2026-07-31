# Implementation Plan: Firefox Ebook Reader Extension

**Branch**: `001-firefox-ebook-reader` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-firefox-ebook-reader/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a Firefox browser extension that lets users load local EPUB files and read them in a full-page, distraction-free reading environment directly within Firefox. The extension provides chapter navigation via table of contents, fully customizable reading appearance (themes, fonts, spacing), automatic reading progress persistence, bookmarks, text highlights with notes, full-text search, and a personal book library — all stored locally with zero network dependency. The technical approach uses epub.js for EPUB rendering, IndexedDB for book content caching, `browser.storage.local` for metadata/preferences, and a full-tab reader page as the reading environment.

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML5, CSS3 — no transpilation required for Firefox  
**Primary Dependencies**: epub.js v0.3 (EPUB parsing and rendering), JSZip v3 (bundled within epub.js), web-ext v8 (dev/packaging toolchain)  
**Storage**: IndexedDB (book file bytes + large structured data), `browser.storage.local` (library metadata, bookmarks, annotations, preferences — ~5MB ceiling, unlimited permission requested)  
**Testing**: Jest v29 + jsdom (unit tests for storage, models, search logic), web-ext lint (manifest/code validation), manual integration testing in Firefox  
**Target Platform**: Firefox for Desktop (v109+, supports Manifest V2 with full WebExtension API)  
**Project Type**: Browser extension (WebExtension / Firefox Add-on)  
**Performance Goals**: EPUB load and render < 5 s for files up to 50 MB; theme/font change applied < 200 ms; full-text search results < 3 s for files up to 10 MB  
**Constraints**: Fully offline (no network calls); all data stored locally; Manifest V2 (Firefox-native, avoids MV3 service-worker limitations for file I/O); IndexedDB stores book bytes to enable seamless session resumption without re-selecting files  
**Scale/Scope**: Single user, single Firefox profile; library of up to ~200 books; no backend, no cloud sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0 ratified 2026-07-31. Evaluating all five principles:

| Principle | Status | Evidence |
|---|---|---|
| **I. Privacy by Default** | ✅ PASS | No network requests anywhere in the design; all storage is IndexedDB + `browser.storage.local`; epub.js vendored locally; no telemetry |
| **II. Offline-First** | ✅ PASS | epub.js and all fonts/icons are vendored in `vendor/`; zero runtime CDN calls; extension works with no internet connection |
| **III. User Data Ownership** | ✅ PASS | `LIBRARY_REMOVE_BOOK` deletes all associated data (bytes, cover, session, bookmarks, annotations); `browser.storage.local` JSON is human-readable |
| **IV. Reading Experience First** | ✅ PASS | SESSION_SAVE is debounced 500ms; theme/font changes use epub.js themes API (< 200ms, no reload); side panels are dismissible; errors use non-modal pattern |
| **V. Simplicity Over Complexity** | ✅ PASS | Vanilla JS, no transpilation, no build pipeline; single epub.js dependency justified by EPUB 3 complexity; MV2 chosen for simplicity of file I/O |

**All gates pass. No violations to track in Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/001-firefox-ebook-reader/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── messages.md      # Background ↔ Reader message schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
manifest.json                  # Extension manifest (MV2)
icons/
├── icon-48.png
└── icon-96.png

background/
└── background.js              # Background script: library state, message routing

popup/
├── popup.html                 # Toolbar button click → library overview
├── popup.js
└── popup.css

reader/
├── reader.html                # Full-tab reading environment
├── reader.js                  # epub.js integration, UI orchestration
└── reader.css                 # Reader chrome, themes, side panels

shared/
├── storage.js                 # Unified storage abstraction (IndexedDB + browser.storage.local)
├── epub-service.js            # epub.js wrapper: load, paginate, search, CFI handling
├── library-service.js         # CRUD for library entries, reading sessions
├── annotation-service.js      # Highlights, notes, bookmarks
└── constants.js               # Shared enums, message types, defaults

vendor/
└── epub.js                    # epub.js bundle (self-contained, no CDN)

tests/
├── unit/
│   ├── storage.test.js
│   ├── library-service.test.js
│   ├── annotation-service.test.js
│   └── epub-service.test.js
└── integration/
    └── reader-flow.test.js
```

**Structure Decision**: Single-project Firefox extension layout. No backend or frontend split — the extension itself is the complete application. The reader runs as a dedicated browser tab (`reader/reader.html`) opened by the popup. The background script acts as a stateless message router and storage coordinator. All business logic lives in `shared/` services, keeping popup and reader thin.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations to track — constitution is not yet defined for this project.
