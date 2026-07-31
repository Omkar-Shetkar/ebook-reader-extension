# Tasks: Seamless Keyboard Shortcut Integration & Robust Appearance Functionality

**Input**: Design documents from `/specs/002-keyboard-appearance-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/keyboard-shortcuts.md

**Tests**: Unit tests are included as this is a quality-critical feature affecting core user interaction.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Browser extension structure:
- `reader/` - Reading interface files
- `shared/` - Shared constants and utilities
- `tests/unit/` - Unit tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare development environment and verify existing infrastructure

- [ ] T001 Verify Firefox 109+ installed and extension loaded via about:debugging
- [ ] T002 Verify at least one EPUB file available in library for testing
- [ ] T003 [P] Review existing keyboard event handler in reader/reader.js lines 649-701
- [ ] T004 [P] Review existing appearance controls in reader/reader.js lines 480-550
- [ ] T005 [P] Review shortcuts overlay structure in reader/reader.html lines 140-159

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create unit test file tests/unit/reader-keyboard.test.js with Jest setup
- [ ] T007 [P] Add helper function isTypingContext() to detect INPUT/TEXTAREA/SELECT focus in reader/reader.js
- [ ] T008 [P] Add helper function shouldHandleShortcut(event, context) for context-aware filtering in reader/reader.js
- [ ] T009 Refactor existing keydown event listener in reader/reader.js to use new helper functions
- [ ] T010 Add preventDefault() calls to all existing keyboard shortcuts in reader/reader.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Universal Keyboard Navigation (Priority: P1) 🎯 MVP

**Goal**: Enable complete keyboard-based navigation and feature access without requiring mouse interaction

**Independent Test**: Open any ebook and verify all navigation shortcuts (arrows, space, Ctrl+B/F/T/A, Escape) work correctly in various contexts (main view, with panels open, during text selection)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Unit test for isTypingContext() function in tests/unit/reader-keyboard.test.js
- [ ] T012 [P] [US1] Unit test for arrow key navigation (non-input context) in tests/unit/reader-keyboard.test.js
- [ ] T013 [P] [US1] Unit test for spacebar navigation (non-input context) in tests/unit/reader-keyboard.test.js
- [ ] T014 [P] [US1] Unit test for Ctrl/Cmd modifier detection in tests/unit/reader-keyboard.test.js
- [ ] T015 [P] [US1] Unit test for Escape key handling in tests/unit/reader-keyboard.test.js

### Implementation for User Story 1

- [ ] T016 [US1] Enhance arrow key handlers (Right/Left) to check typing context in reader/reader.js keydown listener
- [ ] T017 [US1] Enhance spacebar handler to check typing context and handle Shift+Space in reader/reader.js keydown listener
- [ ] T018 [US1] Verify Ctrl+B bookmark toggle works with both ctrlKey and metaKey in reader/reader.js keydown listener
- [ ] T019 [US1] Verify Ctrl+F search toggle works with both ctrlKey and metaKey in reader/reader.js keydown listener
- [ ] T020 [US1] Verify Ctrl+T TOC toggle works with both ctrlKey and metaKey in reader/reader.js keydown listener
- [ ] T021 [US1] Verify Ctrl+A annotations toggle works with both ctrlKey and metaKey in reader/reader.js keydown listener
- [ ] T022 [US1] Implement Escape key handler to close search bar in reader/reader.js keydown listener
- [ ] T023 [US1] Implement Escape key handler to close side panels (TOC, bookmarks, annotations, appearance) in reader/reader.js keydown listener
- [ ] T024 [US1] Add preventDefault() to all US1 shortcuts to prevent browser defaults in reader/reader.js keydown listener
- [ ] T025 [US1] Update button titles/tooltips to show keyboard shortcuts (e.g., "Bookmark (Ctrl+B)") in reader/reader.js button initialization

**Checkpoint**: At this point, User Story 1 should be fully functional - all navigation and feature access shortcuts work correctly with context-awareness

---

## Phase 4: User Story 2 - Appearance Customization via Keyboard (Priority: P1)

**Goal**: Enable quick appearance adjustments (theme, font size) via keyboard shortcuts without opening appearance panel

**Independent Test**: Open any ebook and use Ctrl+D to cycle through themes, Ctrl++ to increase font size, and Ctrl+- to decrease font size. Verify immediate visual feedback and persistence across sessions.

### Tests for User Story 2

- [ ] T026 [P] [US2] Unit test for theme cycling logic (light → dark → sepia → light) in tests/unit/reader-keyboard.test.js
- [ ] T027 [P] [US2] Unit test for font size clamping (50-200% bounds) in tests/unit/reader-keyboard.test.js
- [ ] T028 [P] [US2] Unit test for font size adjustment (+10%, -10%) in tests/unit/reader-keyboard.test.js

### Implementation for User Story 2

- [ ] T029 [US2] Implement Ctrl+D handler to call cycleTheme() function in reader/reader.js keydown listener
- [ ] T030 [US2] Verify cycleTheme() function cycles through themes in correct order in reader/reader.js
- [ ] T031 [US2] Ensure cycleTheme() updates active button visual state in appearance panel in reader/reader.js
- [ ] T032 [US2] Implement Ctrl++ and Ctrl+= handlers to call adjustFontSize(10) in reader/reader.js keydown listener
- [ ] T033 [US2] Implement Ctrl+- handler to call adjustFontSize(-10) in reader/reader.js keydown listener
- [ ] T034 [US2] Verify adjustFontSize() enforces 50-200% bounds in reader/reader.js
- [ ] T035 [US2] Ensure font size display updates synchronously with keyboard shortcuts in reader/reader.js
- [ ] T036 [US2] Verify all appearance changes persist via MessageType.PREFERENCES_UPDATE in reader/reader.js
- [ ] T037 [US2] Add preventDefault() to Ctrl+D, Ctrl++, Ctrl+- shortcuts in reader/reader.js keydown listener

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - full keyboard navigation plus appearance customization

---

## Phase 5: User Story 3 - Keyboard Shortcut Discovery (Priority: P2)

**Goal**: Provide easily accessible help overlay showing all available keyboard shortcuts

**Independent Test**: Press ? (question mark) to open shortcuts overlay, review displayed shortcuts, and press ? again or Escape to close it. Verify all shortcuts are documented clearly.

### Tests for User Story 3

- [ ] T038 [P] [US3] Unit test for ? key toggle behavior in tests/unit/reader-keyboard.test.js
- [ ] T039 [P] [US3] Unit test for shortcuts overlay visibility state in tests/unit/reader-keyboard.test.js

### Implementation for User Story 3

- [ ] T040 [US3] Verify ? key handler toggles shortcuts overlay visibility in reader/reader.js keydown listener
- [ ] T041 [US3] Ensure ? key works even when shortcuts overlay is already open (toggles closed) in reader/reader.js
- [ ] T042 [US3] Update shortcuts table in reader/reader.html lines 140-159 with all new shortcuts
- [ ] T043 [US3] Add Ctrl+D (Cycle theme) row to shortcuts table in reader/reader.html
- [ ] T044 [US3] Add Ctrl++ (Larger text) row to shortcuts table in reader/reader.html
- [ ] T045 [US3] Add Ctrl+- (Smaller text) row to shortcuts table in reader/reader.html
- [ ] T046 [US3] Verify Escape key closes shortcuts overlay in reader/reader.js
- [ ] T047 [US3] Verify clicking outside modal closes shortcuts overlay in reader/reader.js lines 645-647

**Checkpoint**: All P1 and P2 stories complete - users can navigate, customize appearance, and discover shortcuts

---

## Phase 6: User Story 4 - Robust Appearance Panel Functionality (Priority: P2)

**Goal**: Ensure all appearance panel controls work reliably with immediate visual feedback and preference persistence

**Independent Test**: Open appearance panel, adjust each control (theme buttons, font dropdown, size buttons, line height slider, margin slider), verify immediate visual changes and persistence across sessions.

### Tests for User Story 4

- [ ] T048 [P] [US4] Unit test for theme button click handling in tests/unit/reader-keyboard.test.js
- [ ] T049 [P] [US4] Unit test for font family validation against FONT_OPTIONS in tests/unit/reader-keyboard.test.js
- [ ] T050 [P] [US4] Unit test for line height slider bounds (1.0-2.5) in tests/unit/reader-keyboard.test.js
- [ ] T051 [P] [US4] Unit test for margin slider bounds (0-20) in tests/unit/reader-keyboard.test.js

### Implementation for User Story 4

- [ ] T052 [US4] Verify theme button click handlers update active button visual state in reader/reader.js lines 502-510
- [ ] T053 [US4] Ensure theme changes apply to both content and chrome immediately in reader/reader.js
- [ ] T054 [US4] Verify font family dropdown change handler applies font immediately in reader/reader.js lines 490-498
- [ ] T055 [US4] Ensure font size increase/decrease buttons update display and persist in reader/reader.js lines 514-515
- [ ] T056 [US4] Verify line height slider input handler applies changes in real-time in reader/reader.js lines 518-523
- [ ] T057 [US4] Verify margin slider input handler applies changes in real-time in reader/reader.js lines 526-532
- [ ] T058 [US4] Ensure all appearance controls call msg(MessageType.PREFERENCES_UPDATE) to persist changes in reader/reader.js
- [ ] T059 [US4] Verify appearance preferences restore correctly on book reopen in reader/reader.js init() function lines 87-88

**Checkpoint**: All appearance controls work reliably with immediate feedback and persistence

---

## Phase 7: User Story 5 - Context-Aware Keyboard Behavior (Priority: P3)

**Goal**: Prevent navigation shortcuts from triggering while typing in input fields

**Independent Test**: Open search bar, type text including spaces and arrow keys, verify no page navigation occurs. Close search bar and verify shortcuts work normally.

### Tests for User Story 5

- [ ] T060 [P] [US5] Unit test for typing detection with INPUT element focused in tests/unit/reader-keyboard.test.js
- [ ] T061 [P] [US5] Unit test for typing detection with TEXTAREA element focused in tests/unit/reader-keyboard.test.js
- [ ] T062 [P] [US5] Unit test for typing detection with SELECT element focused in tests/unit/reader-keyboard.test.js
- [ ] T063 [P] [US5] Unit test for modifier shortcuts working during text input in tests/unit/reader-keyboard.test.js

### Implementation for User Story 5

- [ ] T064 [US5] Ensure isTypingContext() checks for INPUT, TEXTAREA, and SELECT tagNames in reader/reader.js
- [ ] T065 [US5] Verify navigation shortcuts (arrows, spacebar) are disabled when isTypingContext() returns true in reader/reader.js
- [ ] T066 [US5] Ensure modifier shortcuts (Ctrl+B, Ctrl+F, etc.) still work during text input in reader/reader.js
- [ ] T067 [US5] Test spacebar in search input - verify space is entered, not page turn in reader/reader.js
- [ ] T068 [US5] Test arrow keys in bookmark label input - verify cursor moves, not page navigation in reader/reader.js
- [ ] T069 [US5] Test arrow keys in annotation note textarea - verify cursor moves, not page navigation in reader/reader.js
- [ ] T070 [US5] Verify shortcuts resume working after closing input fields in reader/reader.js

**Checkpoint**: All user stories complete - keyboard shortcuts work perfectly with context-awareness

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T071 [P] Run npm run lint to verify code quality
- [ ] T072 [P] Run npm test to execute all unit tests
- [ ] T073 Manually test all acceptance scenarios from spec.md User Story 1 (8 scenarios)
- [ ] T074 Manually test all acceptance scenarios from spec.md User Story 2 (6 scenarios)
- [ ] T075 Manually test all acceptance scenarios from spec.md User Story 3 (5 scenarios)
- [ ] T076 Manually test all acceptance scenarios from spec.md User Story 4 (7 scenarios)
- [ ] T077 Manually test all acceptance scenarios from spec.md User Story 5 (5 scenarios)
- [ ] T078 Validate all 10 success criteria from spec.md (SC-001 through SC-010)
- [ ] T079 Test edge cases: rapid Ctrl+D presses, font size bounds, shortcuts during page transitions
- [ ] T080 Verify performance: theme changes <200ms, shortcut response <1s, UI feedback <100ms
- [ ] T081 Test cross-platform: verify Ctrl (Windows/Linux) and Cmd (Mac) both work
- [ ] T082 Verify constitution compliance: no network requests, offline functionality, privacy maintained
- [ ] T083 Update README.md or feature documentation with keyboard shortcuts reference
- [ ] T084 Run full quickstart.md validation checklist
- [ ] T085 Final code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 (different shortcuts)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent (just updates help overlay)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent (appearance panel controls)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Uses helpers from Phase 2, independent of other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Helper functions before main implementation
- Core shortcuts before visual feedback enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004, T005)
- All Foundational tasks marked [P] can run in parallel (T007, T008)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Within Phase 8, tasks T071-T072 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T011: "Unit test for isTypingContext() function in tests/unit/reader-keyboard.test.js"
Task T012: "Unit test for arrow key navigation (non-input context) in tests/unit/reader-keyboard.test.js"
Task T013: "Unit test for spacebar navigation (non-input context) in tests/unit/reader-keyboard.test.js"
Task T014: "Unit test for Ctrl/Cmd modifier detection in tests/unit/reader-keyboard.test.js"
Task T015: "Unit test for Escape key handling in tests/unit/reader-keyboard.test.js"

# After tests fail, implement shortcuts (some can be parallel if different code sections):
# Most US1 implementation tasks modify the same keydown listener, so limited parallelism
```

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task T026: "Unit test for theme cycling logic (light → dark → sepia → light) in tests/unit/reader-keyboard.test.js"
Task T027: "Unit test for font size clamping (50-200% bounds) in tests/unit/reader-keyboard.test.js"
Task T028: "Unit test for font size adjustment (+10%, -10%) in tests/unit/reader-keyboard.test.js"

# Implementation tasks are sequential (same keydown listener and related functions)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Universal Keyboard Navigation)
4. Complete Phase 4: User Story 2 (Appearance Customization via Keyboard)
5. **STOP and VALIDATE**: Test both P1 stories independently
6. Deploy/demo if ready - this is a complete MVP with core keyboard functionality

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic navigation)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP with appearance!)
4. Add User Story 3 → Test independently → Deploy/Demo (Discoverability)
5. Add User Story 4 → Test independently → Deploy/Demo (Robust controls)
6. Add User Story 5 → Test independently → Deploy/Demo (Polish)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Navigation shortcuts)
   - Developer B: User Story 2 (Appearance shortcuts)
   - Developer C: User Story 3 (Help overlay)
3. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 85 tasks

**Task Count by User Story**:
- Setup (Phase 1): 5 tasks
- Foundational (Phase 2): 5 tasks
- User Story 1 (P1): 15 tasks (5 tests + 10 implementation)
- User Story 2 (P1): 12 tasks (3 tests + 9 implementation)
- User Story 3 (P2): 10 tasks (2 tests + 8 implementation)
- User Story 4 (P2): 12 tasks (4 tests + 8 implementation)
- User Story 5 (P3): 11 tasks (4 tests + 7 implementation)
- Polish (Phase 8): 15 tasks

**Parallel Opportunities**:
- 3 tasks in Setup phase can run in parallel
- 2 tasks in Foundational phase can run in parallel
- All 5 user stories can start in parallel after Foundational phase
- 18 test tasks marked [P] can run in parallel within their stories
- 2 tasks in Polish phase can run in parallel

**Independent Test Criteria**:
- US1: All navigation shortcuts work in various contexts
- US2: Theme cycling and font size adjustment work with persistence
- US3: Help overlay displays all shortcuts and is dismissible
- US4: All appearance panel controls work with immediate feedback
- US5: Navigation shortcuts disabled during text input, modifier shortcuts still work

**Suggested MVP Scope**: User Stories 1 & 2 (both P1) - Complete keyboard navigation and appearance customization

**Estimated Implementation Time**: 6-9 hours total
- Setup + Foundational: 1 hour
- User Story 1: 2-3 hours
- User Story 2: 2-3 hours
- User Story 3: 1 hour
- User Story 4: 1-2 hours
- User Story 5: 1 hour
- Polish: 1-2 hours

---

## Notes

- [P] tasks = different files or independent code sections, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Most tasks modify reader/reader.js - coordinate carefully to avoid conflicts
- Use feature branches per user story if working in parallel
