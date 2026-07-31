# Implementation Plan: Seamless Keyboard Shortcut Integration & Robust Appearance Functionality

**Branch**: `002-keyboard-appearance-enhancements` | **Date**: August 1, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-keyboard-appearance-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature enhances the ebook reader with comprehensive keyboard shortcut support and robust appearance customization. Users will be able to navigate through books, access all major features (bookmarks, search, TOC, annotations), and customize reading appearance (theme, font, spacing, margins) entirely via keyboard. The implementation extends the existing `reader.js` keyboard event handler and appearance panel controls, ensuring all shortcuts work context-aware (disabled during text input), provide immediate visual feedback (<200ms), and persist preferences to browser.storage.local.

## Technical Context

**Language/Version**: JavaScript ES2022 (vanilla, no transpilation)  
**Primary Dependencies**: epub.js 0.3.93 (vendored), jszip (vendored)  
**Storage**: browser.storage.local (preferences), IndexedDB (not used for this feature)  
**Testing**: Jest 29.0.0 + jsdom (unit tests), manual integration testing in Firefox 109+  
**Target Platform**: Firefox 109+ (Manifest V2)
**Project Type**: Browser extension (web-accessible reader page)  
**Performance Goals**: <200ms theme/font changes, <1s shortcut response, <100ms UI feedback  
**Constraints**: Offline-capable, no network requests, no external CDN, privacy-first (all data local)  
**Scale/Scope**: Single-user local extension, ~15 keyboard shortcuts, 5 appearance controls

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Privacy by Default ✅ PASS
- **Assessment**: This feature makes NO network requests. All keyboard shortcuts and appearance preferences are handled client-side in reader.js and stored in browser.storage.local. No analytics, telemetry, or external calls.
- **Compliance**: Full compliance. No violations.

### Principle II: Offline-First ✅ PASS
- **Assessment**: All functionality works offline. Keyboard event handling is native browser API. Appearance changes use epub.js theme API (already vendored). No fallback network paths.
- **Compliance**: Full compliance. No violations.

### Principle III: User Data Ownership ✅ PASS
- **Assessment**: Appearance preferences are stored in browser.storage.local with clear structure (theme, fontFamily, fontSize, lineHeight, marginPercent). Users can inspect via browser dev tools. No data retention beyond user-initiated removal.
- **Compliance**: Full compliance. Preferences are human-readable JSON.

### Principle IV: Reading Experience First ✅ PASS
- **Assessment**: 
  - Keyboard shortcuts enable hands-free reading (core experience enhancement)
  - Theme/font changes apply in <200ms (spec SC-003, constitution requirement)
  - Shortcuts are context-aware (disabled during text input) to prevent interruption
  - Help overlay (? key) is dismissible and non-blocking
- **Compliance**: Full compliance. Feature directly serves reading experience.

### Principle V: Simplicity Over Complexity ✅ PASS
- **Assessment**:
  - Implementation extends existing reader.js keydown handler (lines 649-701)
  - No new abstractions or frameworks required
  - Uses native browser KeyboardEvent API
  - Appearance controls already exist; this feature enhances their reliability
  - No build pipeline changes needed
- **Compliance**: Full compliance. Simplest implementation that satisfies requirements.

**GATE RESULT**: ✅ **PASSED** — All five principles satisfied. No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
reader/
├── reader.html          # Main reading interface (shortcuts overlay already exists)
├── reader.css           # Styling for reader UI and appearance controls
└── reader.js            # PRIMARY: Keyboard event handling, appearance controls logic

shared/
├── constants.js         # FONT_OPTIONS, THEMES, DEFAULT_PREFERENCES
├── storage.js           # browser.storage.local wrapper
└── [other services]     # Not modified by this feature

tests/
└── unit/
    └── reader-keyboard.test.js  # NEW: Unit tests for keyboard shortcut logic
```

**Structure Decision**: This is a browser extension with a single-project structure. The feature primarily modifies `reader/reader.js` (keyboard event handler at lines 649-701) and enhances existing appearance panel controls (lines 480-550). No new directories needed. The shortcuts overlay HTML already exists in `reader.html` (lines 140-159). Tests will be added to the existing `tests/unit/` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations.** All five constitution principles are satisfied. No complexity justification required.

---

## Phase 0: Research (Complete)

**Status**: ✅ Complete  
**Output**: [research.md](./research.md)

**Summary**: All technical decisions are based on existing patterns in the codebase. No new libraries, frameworks, or architectural changes required. All unknowns from Technical Context were resolved through codebase analysis.

**Key Findings**:
1. Native KeyboardEvent API sufficient for all shortcut handling
2. Cross-platform support via `ctrlKey || metaKey` check
3. Existing browser.storage.local pattern works for preference persistence
4. epub.js theme API meets <200ms performance requirement
5. Context-aware behavior via `document.activeElement.tagName` check
6. Shortcuts overlay HTML already exists in reader.html

---

## Phase 1: Design & Contracts (Complete)

**Status**: ✅ Complete  
**Outputs**: 
- [data-model.md](./data-model.md)
- [contracts/keyboard-shortcuts.md](./contracts/keyboard-shortcuts.md)
- [quickstart.md](./quickstart.md)
- Agent context updated (`.windsurf/rules/specify-rules.md`)

**Summary**: 
- **Data Model**: Documented existing AppearancePreferences structure and conceptual KeyboardShortcut model. No new persistent entities required.
- **Contracts**: Defined 15 keyboard shortcuts with behavior guarantees, performance requirements, and testing criteria.
- **Quickstart**: Created developer guide with 5-minute quick start, testing checklist, and troubleshooting tips.
- **Agent Context**: Updated Windsurf rules with JavaScript ES2022, epub.js, and browser.storage.local context.

---

## Constitution Check (Post-Design Re-evaluation)

*Re-checking compliance after Phase 1 design artifacts are complete.*

### Principle I: Privacy by Default ✅ PASS
- **Re-assessment**: Design confirms NO network requests. All keyboard shortcuts handled client-side. Preferences stored only in browser.storage.local. Contracts document explicitly prohibits external calls.
- **Compliance**: Full compliance maintained. No violations introduced by design.

### Principle II: Offline-First ✅ PASS
- **Re-assessment**: Design confirms all functionality works offline. KeyboardEvent API is native browser. epub.js already vendored. No fallback network paths in contracts.
- **Compliance**: Full compliance maintained. No violations introduced by design.

### Principle III: User Data Ownership ✅ PASS
- **Re-assessment**: Data model confirms preferences remain human-readable JSON in browser.storage.local. No new data retention. Users maintain full control.
- **Compliance**: Full compliance maintained. No violations introduced by design.

### Principle IV: Reading Experience First ✅ PASS
- **Re-assessment**: 
  - Contracts guarantee <200ms theme changes (constitution requirement met)
  - Context-aware shortcuts prevent interruption during text input
  - Help overlay is dismissible and non-blocking
  - Performance requirements documented and testable
- **Compliance**: Full compliance maintained. Design enhances reading experience.

### Principle V: Simplicity Over Complexity ✅ PASS
- **Re-assessment**:
  - Design extends existing reader.js keyboard handler (no new abstractions)
  - Uses native browser APIs exclusively
  - No new dependencies added
  - Quickstart confirms implementation is straightforward
- **Compliance**: Full compliance maintained. Simplest implementation chosen.

**GATE RESULT (Post-Design)**: ✅ **PASSED** — All five principles satisfied after design phase. No violations. Ready for Phase 2 (task generation via `/speckit.tasks`).
