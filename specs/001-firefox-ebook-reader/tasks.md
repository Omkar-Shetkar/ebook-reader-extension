---

description: "Task list for Firefox Ebook Reader Extension"
---

# Tasks: Firefox Ebook Reader Extension

**Input**: Design documents from `/specs/001-firefox-ebook-reader/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All tasks include exact file paths

---

## Phase 1: Setup (Project Scaffolding)

**Purpose**: Create the extension skeleton so every subsequent task has a real home.

- [x] T001 Create directory structure: `background/`, `popup/`, `reader/`, `shared/`, `vendor/`, `icons/`, `tests/unit/`, `tests/integration/` at repository root
- [x] T002 Create `manifest.json` with `manifest_version: 2`, `name`, `version: "0.1.0"`, `permissions: ["storage","unlimitedStorage","tabs"]`, `background.scripts: ["background/background.js"]`, `browser_action` pointing to `popup/popup.html` with `icon-48.png`, and `web_accessible_resources: ["reader/reader.html"]`
- [x] T003 [P] Create `package.json` with `devDependencies: { "web-ext": "^8.0.0", "jest": "^29.0.0", "jest-environment-jsdom": "^29.0.0" }` and scripts: `dev`, `lint`, `build`, `test` as defined in `quickstart.md`
- [x] T004 [P] Create `jest.config.js` setting `testEnvironment: "jsdom"` and `testMatch: ["**/tests/**/*.test.js"]`
- [x] T005 [P] Download epub.js v0.3 standalone bundle and save to `vendor/epub.min.js` (run: `npm install && npx curl-install-vendor` or manual download per `quickstart.md`)
- [x] T006 [P] Add placeholder `icons/icon-48.png` and `icons/icon-96.png` (48×48 and 96×96 grey SVG/PNG; replace with real assets before release)

---

## Phase 2: Foundational (Shared Infrastructure — Blocks All User Stories)

**Purpose**: Core services that every user story depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete and verify all T007–T013 before starting Phase 3.

- [x] T007 Create `shared/constants.js` exporting: `MessageType` enum (all 20 types from `contracts/messages.md`), `DEFAULT_PREFERENCES` object (`theme:"light"`, `fontFamily:"Georgia"`, `fontSize:100`, `lineHeight:1.6`, `marginPercent:8`, `flow:"paginated"`), `HIGHLIGHT_COLORS` array (`["yellow","green","blue","pink"]`), `ErrorCode` enum (all codes from `contracts/messages.md`), `MAX_BOOK_SIZE_BYTES: 52428800`
- [x] T008 Create `shared/storage.js` implementing IndexedDB abstraction: `openDB()` opens `ebook-reader-db` v1 with object stores `books` (keyPath:`bookId`) and `covers` (keyPath:`bookId`); `saveBook(bookId, arrayBuffer, sizeBytes)`, `getBook(bookId)` → ArrayBuffer, `deleteBook(bookId)`, `saveCover(bookId, blob, mimeType)`, `getCover(bookId)` → `{blob, mimeType}`, `deleteBookData(bookId)` (deletes from both stores). All functions return Promises.
- [x] T009 [P] Create `shared/library-service.js` implementing `browser.storage.local` CRUD for LibraryEntry and ReadingSession schemas from `data-model.md`: `getAllLibraryEntries()`, `getLibraryEntry(bookId)`, `addLibraryEntry(entry)`, `updateLibraryEntry(bookId, patch)`, `removeLibraryEntry(bookId)`, `getSession(bookId)`, `upsertSession(bookId, sessionData)`, `removeSession(bookId)`
- [x] T010 [P] Create `shared/annotation-service.js` implementing `browser.storage.local` CRUD for Bookmark and Annotation schemas from `data-model.md`: `getBookmarks(bookId)`, `addBookmark(bookmark)`, `removeBookmark(bookId, bookmarkId)`, `checkBookmark(bookId, cfi)` → `{exists, bookmarkId}`, `getAnnotations(bookId)`, `addAnnotation(annotation)`, `updateAnnotation(bookId, annotationId, patch)`, `removeAnnotation(bookId, annotationId)`, `removeAllForBook(bookId)`. Use `crypto.randomUUID()` for ID generation.
- [x] T011 Create `shared/epub-service.js` with functions: `loadBook(arrayBuffer)` → returns epub.js `Book` instance; `createRendition(book, element, preferences)` → applies theme/font/size to a new `Rendition`; `getToc(book)` → flat array of `{id, label, href, depth}`; `getCurrentCfi(rendition)` → CFI string; `goToCfi(rendition, cfi)`; `searchBook(book, query)` → Promise resolving to `[{cfi, excerpt}]`. Import from `../vendor/epub.min.js`.
- [x] T012 [P] Create `shared/epub-service.js` theme definitions: `registerThemes(rendition)` registers `light`, `dark`, `sepia` themes using `rendition.themes.register()` with full CSS (background, color, link color) per the color values in `research.md` Section 10; expose `applyPreferences(rendition, prefs)` that calls `themes.select()`, `themes.fontSize()`, `themes.font()`, and `themes.override()` for line-height and margin.
- [x] T013 Create `background/background.js` with `browser.runtime.onMessage.addListener()` switch dispatcher routing all `MessageType` constants to stub handler functions (each stub returns `{success:true, data:null}` until implemented per story). Import `storage.js`, `library-service.js`, `annotation-service.js`, `constants.js` via relative paths.

**Checkpoint**: All shared services exist and are importable. `web-ext lint` passes.

---

## Phase 3: User Story 1 — Load and Read an Ebook (Priority: P1) 🎯 MVP

**Goal**: User selects a local EPUB file; it opens in a full-tab reader with paginated content and page-turn navigation.

**Independent Test**: Install extension → click toolbar icon → click "Open Book" → select any `.epub` file → reader tab opens → verify first page renders → press → and ← to page through. All four acceptance scenarios in spec.md US1 must pass.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `popup/popup.html`: full-width layout with a header bar, an "Open Book" button that triggers a hidden `<input type="file" accept=".epub" id="file-input">`, a `#library-grid` div for future book cards, and a `#error-banner` div (hidden by default). Link `popup.css` and `popup.js`.
- [x] T015 [P] [US1] Create `popup/popup.css`: set popup width to 480px, style the header, "Open Book" button (primary CTA), `#error-banner` (red background, dismissible), and an empty-state message for `#library-grid` when no books exist yet.
- [x] T016 [US1] Create `popup/popup.js`: wire `#file-input` change event → read `File` as `ArrayBuffer` → encode to base64 string → send `MessageType.LIBRARY_ADD_BOOK` message with `{fileName, data}` → on success send `MessageType.LIBRARY_OPEN_BOOK` with returned `bookId` → on error display message in `#error-banner`.
- [x] T017 [US1] Implement `LIBRARY_ADD_BOOK` handler in `background/background.js`: decode base64 → generate `bookId` using a fast hash of the first 65536 bytes (XOR-fold SHA-256 substitute using `SubtleCrypto.digest('SHA-256', first64k)` prefixed with `"sha256-"`); check `sizeBytes > MAX_BOOK_SIZE_BYTES` → return `ErrorCode.FILE_TOO_LARGE`; attempt `storage.saveBook()` → catch quota error → return `ErrorCode.STORAGE_FULL`; parse EPUB metadata via epub.js `Book` object (title, author, publisher, language, format, spine count) → return `ErrorCode.UNSUPPORTED_FORMAT` on parse failure; call `library-service.addLibraryEntry()` with full `LibraryEntry` shape; return `{bookId, title, author, isNew}`.
- [x] T018 [US1] Implement `LIBRARY_OPEN_BOOK` handler in `background/background.js`: call `browser.tabs.create({ url: browser.runtime.getURL('reader/reader.html') + '?bookId=' + bookId })` → return `{tabId}`. If a reader tab for this bookId is already open, focus it instead of creating a new one (check `browser.tabs.query`).
- [x] T019 [P] [US1] Create `reader/reader.html`: full-viewport layout with a top toolbar (`#toolbar`) containing: book title span, progress display (`#progress-display`), and icon buttons (TOC, bookmark toggle, annotations, search, appearance — all disabled/hidden until later phases); a `#reader-area` div that fills the remaining viewport height (epub.js renders here); a `#loading-overlay` shown during book load. Link `../vendor/epub.min.js`, `../shared/constants.js`, `../shared/epub-service.js`, `reader.css`, `reader.js` in order.
- [x] T020 [P] [US1] Create `reader/reader.css`: CSS reset for the reader page; `#reader-area` fills viewport below toolbar; `#loading-overlay` is a fixed full-screen spinner; toolbar is fixed at top with correct z-index; define CSS variables for all three themes (`--bg`, `--text`, `--toolbar-bg`) with `light` values as defaults.
- [x] T021 [US1] Create `reader/reader.js` core init: on `DOMContentLoaded`, parse `bookId` from `new URLSearchParams(location.search)`; send `MessageType.BOOK_GET_DATA` → decode base64 response to `ArrayBuffer`; call `epub-service.loadBook(arrayBuffer)` → call `epub-service.createRendition(book, document.getElementById('reader-area'), DEFAULT_PREFERENCES)`; call `rendition.display()` to render first page; hide `#loading-overlay`; set `document.title` to book title.
- [x] T022 [US1] Implement `BOOK_GET_DATA` handler in `background/background.js`: call `storage.getBook(bookId)` → if null return `{data:null}`; base64-encode ArrayBuffer → return `{data: base64string, sizeBytes}`.
- [x] T023 [US1] Implement page navigation in `reader/reader.js`: add click handlers on next/previous buttons calling `rendition.next()` / `rendition.prev()`; add `keydown` listener on `document` for `ArrowRight`, `Space` → next page and `ArrowLeft`, `Shift+Space` → previous page; suppress default scroll behavior for Space key.
- [x] T024 [US1] Implement error display in `reader/reader.js`: if `BOOK_GET_DATA` returns `data:null`, replace `#reader-area` content with a user-friendly "Book data not found — please re-open the file from the library" message with a "Go to Library" button that closes the tab.

**Checkpoint**: US1 independently functional. Install extension, open any EPUB, read through pages with keyboard/buttons. Verify error message on bad file.

---

## Phase 4: User Story 2 — Navigate via Table of Contents (Priority: P2)

**Goal**: User can open a TOC side panel, see all chapters hierarchically, click to jump, and see current chapter highlighted.

**Independent Test**: Open a multi-chapter EPUB → click TOC icon → verify chapter list matches book's TOC → click a chapter → verify navigation → verify current chapter is highlighted on return to panel.

### Implementation for User Story 2

- [x] T025 [US2] Implement `getToc(book)` in `shared/epub-service.js`: call `book.navigation.toc` (returns epub.js NavItem tree) → flatten recursively to `[{id, label, href, depth}]` preserving hierarchy depth for indentation display; handle missing NCX/nav.xhtml gracefully (return `[]`).
- [x] T026 [P] [US2] Add TOC panel to `reader/reader.html`: a `#toc-panel` aside element (initially `hidden`) with a `#toc-list` `<ul>` inside; add close button; enable the TOC toolbar icon button.
- [x] T027 [P] [US2] Add TOC panel styles to `reader/reader.css`: `#toc-panel` slides in from left over `#reader-area` (CSS transform + transition, 280px wide); `#toc-list li` items indented by `depth * 1rem`; `.toc-active` class adds left border highlight; close button positioned top-right of panel.
- [x] T028 [US2] Implement TOC panel logic in `reader/reader.js`: after book loads, call `epub-service.getToc(book)` and populate `#toc-list` with `<li>` items (label text, data-href attribute); wire TOC toolbar button to toggle `#toc-panel` hidden state; wire each `<li>` click to call `rendition.display(href)` and close panel; listen to `rendition.on('relocated', location => ...)` to find matching TOC item by comparing `location.start.href` to each item's `href` and toggle `.toc-active` class; show "No table of contents available" message in panel when `getToc()` returns `[]`.

**Checkpoint**: US2 independently functional. TOC opens, chapters are clickable, current chapter is highlighted.

---

## Phase 5: User Story 3 — Customize Reading Appearance (Priority: P3)

**Goal**: User can change theme (light/dark/sepia), font family, font size, line spacing, and margin; all changes apply instantly and persist across sessions.

**Independent Test**: Open any EPUB → open appearance panel → change each setting one at a time → verify immediate visual change → close browser → reopen extension → open same book → verify settings are restored.

### Implementation for User Story 3

- [x] T029 [US3] Implement `PREFERENCES_GET` handler in `background/background.js`: retrieve `preferences` key from `browser.storage.local`; merge with `DEFAULT_PREFERENCES` for any missing fields; return merged object.
- [x] T030 [US3] Implement `PREFERENCES_UPDATE` handler in `background/background.js`: read current preferences, shallow-merge payload fields, write back to `browser.storage.local`; return `{success:true}`.
- [x] T031 [P] [US3] Add appearance panel to `reader/reader.html`: a `#appearance-panel` aside (initially hidden) with: theme buttons (Light / Dark / Sepia), font family `<select>` with options from `data-model.md` curated list, font size `<button>` decrement and increment with current size display, line height `<input type="range" min="1.0" max="2.5" step="0.1">`, margin `<input type="range" min="0" max="20" step="2">`; enable the appearance toolbar icon button.
- [x] T032 [P] [US3] Add appearance panel styles to `reader/reader.css`: panel slides in from right (same pattern as TOC panel); control rows spaced with labels; active theme button gets a distinct outline; range inputs styled for visibility.
- [x] T033 [US3] Implement appearance panel logic in `reader/reader.js`: on book open, send `PREFERENCES_GET` → call `epub-service.applyPreferences(rendition, prefs)` before first render; wire appearance toolbar button to toggle panel; wire each control's change event to immediately call the matching `epub-service` function AND send `PREFERENCES_UPDATE` with the changed field only; update CSS variables (`--bg`, `--text`) on theme change to keep toolbar consistent with reader theme.

**Checkpoint**: US3 independently functional. All five appearance controls change the reading view instantly; reopening the book restores the previous settings.

---

## Phase 6: User Story 4 — Save and Restore Reading Progress (Priority: P4)

**Goal**: Reading position is saved automatically on every page turn (debounced) and restored exactly when the book is reopened.

**Independent Test**: Open a book → navigate to page ~50 → close the reader tab → reopen from popup → verify same page is shown → verify progress percentage matches.

### Implementation for User Story 4

- [x] T034 [US4] Implement `SESSION_SAVE` handler in `background/background.js`: call `library-service.upsertSession(bookId, {currentCfi, progressPercent, currentSpineIndex, savedAt:Date.now()})`; also call `library-service.updateLibraryEntry(bookId, {lastReadAt:Date.now(), isFinished: progressPercent >= 99.5})`; return `{success:true}`.
- [x] T035 [US4] Implement `SESSION_GET` handler in `background/background.js`: call `library-service.getSession(bookId)` → return `{currentCfi, progressPercent, currentSpineIndex}` (all null if no session).
- [x] T036 [US4] Implement auto-save in `reader/reader.js`: after rendition is initialized, add `rendition.on('relocated', location => { ... })` listener; inside handler extract `location.start.cfi`, compute `progressPercent` from `location.start.percentage * 100`; debounce 500ms using a module-level `let saveTimer`; on debounce fire, send `MessageType.SESSION_SAVE` with `{bookId, currentCfi, progressPercent, currentSpineIndex: location.start.index}`.
- [x] T037 [US4] Implement session restore in `reader/reader.js`: after `loadBook()` succeeds and before `rendition.display()`, send `SESSION_GET`; if `currentCfi` is non-null call `rendition.display(currentCfi)`, else call `rendition.display()` (start from beginning).
- [x] T038 [P] [US4] Add progress display to `reader/reader.html` toolbar: `<span id="progress-display">` already present from T019; update `reader/reader.js` to set its `textContent` to `"${Math.round(progressPercent)}%"` on each 'relocated' event.

**Checkpoint**: US4 independently functional. Progress saves on every page turn, restores on reopen with correct page and percentage.

---

## Phase 7: User Story 5 — Bookmark Pages (Priority: P5)

**Goal**: User can toggle a bookmark on any page, optionally label it, view all bookmarks in a side panel, and navigate to any saved bookmark.

**Independent Test**: Open a book → navigate to page 10 → click bookmark icon → verify icon fills → navigate away → open bookmarks panel → verify bookmark listed with excerpt → click bookmark → verify navigation back to page 10 → click bookmark icon again → verify removal.

### Implementation for User Story 5

- [x] T039 [US5] Implement `BOOKMARK_ADD`, `BOOKMARK_REMOVE`, `BOOKMARK_GET_ALL`, and `BOOKMARK_CHECK` handlers in `background/background.js` using `annotation-service.js`. `BOOKMARK_ADD` uses `crypto.randomUUID()` for `bookmarkId` and sets `createdAt: Date.now()`. `BOOKMARK_CHECK` searches bookmarks array for CFI equality match.
- [x] T040 [P] [US5] Add bookmark button and panel to `reader/reader.html`: enable the bookmark toolbar icon button (outline bookmark SVG when not bookmarked, filled when bookmarked); add `#bookmarks-panel` aside (initially hidden) with `#bookmarks-list` and a close button.
- [x] T041 [P] [US5] Add bookmarks panel styles to `reader/reader.css`: panel slides in from right (same pattern as appearance); list items show chapter title, excerpt (truncated), and optional label in a readable card layout; delete button per item.
- [x] T042 [US5] Implement bookmark logic in `reader/reader.js`: on each 'relocated' event, send `BOOKMARK_CHECK` with current CFI → update bookmark icon fill state; on bookmark icon click, if bookmark exists send `BOOKMARK_REMOVE`, else show an inline label input (small tooltip below toolbar) with "Save" button → on save send `BOOKMARK_ADD` with current CFI, spineIndex, chapterTitle from TOC lookup, excerpt (first 100 chars of visible text via `rendition.getContents()`), and label; wire bookmarks panel button to toggle panel visibility and call `BOOKMARK_GET_ALL` to refresh list; wire each list item click to `rendition.display(bookmark.cfi)`; wire each list item delete button to send `BOOKMARK_REMOVE` and remove the item from the DOM.

**Checkpoint**: US5 independently functional. Bookmark toggle works, panel lists all bookmarks, navigation works, deletion works.

---

## Phase 8: User Story 6 — Highlight Text and Add Annotations (Priority: P6)

**Goal**: User selects text, picks a highlight color, optionally adds a note; highlights persist and are re-applied on book reopen; all annotations are viewable in a panel.

**Independent Test**: Open a book → select a text passage → pick yellow highlight → verify text is highlighted → click highlight → add a note → save → open annotations panel → verify entry listed with color, excerpt, note → navigate to it → verify in-book navigation → remove highlight → verify gone.

### Implementation for User Story 6

- [x] T043 [US6] Implement `ANNOTATION_ADD`, `ANNOTATION_UPDATE`, `ANNOTATION_REMOVE`, and `ANNOTATION_GET_ALL` handlers in `background/background.js` using `annotation-service.js`. `ANNOTATION_ADD` uses `crypto.randomUUID()` for `annotationId`, sets `createdAt` and `updatedAt`. `ANNOTATION_UPDATE` patches `note`, `color`, and sets `updatedAt`.
- [x] T044 [P] [US6] Add highlight selection toolbar to `reader/reader.html`: a `#selection-toolbar` floating `div` (fixed position, initially hidden) containing four colored circle buttons (yellow, green, blue, pink). Add CSS to `reader/reader.css` for positioning above selection, `border-radius: 50%` swatches, and a fade-in transition.
- [x] T045 [US6] Implement text selection listener in `reader/reader.js`: listen to `rendition.on('selected', (cfiRange, contents) => {...})`; on selection, position `#selection-toolbar` near the selection (use `contents.window.getSelection().getRangeAt(0).getBoundingClientRect()`); show toolbar; wire each color button click to: extract `cfiRange` and selected text, send `ANNOTATION_ADD`, call `rendition.annotations.add('highlight', cfiRange, {annotationId}, null, 'hl-' + color)`, hide toolbar.
- [x] T046 [P] [US6] Add CSS highlight color classes to `reader/reader.css`: `.hl-yellow { fill: rgba(255,255,0,0.4) }`, `.hl-green`, `.hl-blue`, `.hl-pink` — using SVG `fill` property which epub.js applies to highlight rectangles in the rendition iframe.
- [x] T047 [US6] Implement highlight click handler in `reader/reader.js`: listen to `rendition.on('markClicked', (cfiRange, data) => {...})`; show a small tooltip with "Add / Edit Note" textarea, color selector, and "Remove" button; on "Save Note" send `ANNOTATION_UPDATE`; on "Remove" send `ANNOTATION_REMOVE` and call `rendition.annotations.remove(cfiRange)`.
- [x] T048 [US6] Implement highlight replay on book open in `reader/reader.js`: after rendition is displayed and session is restored, send `ANNOTATION_GET_ALL`; for each annotation call `rendition.annotations.add('highlight', annotation.cfiRange, {annotationId: annotation.annotationId}, null, 'hl-' + annotation.color)`.
- [x] T049 [P] [US6] Add annotations panel to `reader/reader.html` and styles to `reader/reader.css`: `#annotations-panel` aside (same slide-in pattern); `#annotations-list` renders cards grouped by chapter showing: color dot, highlighted text excerpt, note preview (truncated), chapter title, navigate link.
- [x] T050 [US6] Implement annotations panel logic in `reader/reader.js`: wire annotations toolbar button to toggle panel and send `ANNOTATION_GET_ALL` to refresh; render annotation cards sorted by `spineIndex` then `createdAt`; wire card click to `rendition.display(annotation.cfiRange)`; wire card delete to send `ANNOTATION_REMOVE` + `rendition.annotations.remove()` + remove card from DOM.

**Checkpoint**: US6 independently functional. Text highlights with 4 colors, notes, replay on reopen, panel with navigation and deletion.

---

## Phase 9: User Story 7 — Search Within a Book (Priority: P7)

**Goal**: User searches for a word/phrase within the current book and can navigate to any result.

**Independent Test**: Open a book → press Ctrl+F → type a word you know appears → verify results list with excerpts → click a result → verify navigation to that location with text highlighted → search for a non-existent term → verify "No results found".

### Implementation for User Story 7

- [x] T051 [P] [US7] Add search UI to `reader/reader.html`: a `#search-bar` container in the toolbar (collapsible, initially hidden) with `<input type="text" id="search-input" placeholder="Search in book...">`, a submit button, and a `#search-results` dropdown panel below the toolbar. Enable the search toolbar icon button.
- [x] T052 [P] [US7] Add search styles to `reader/reader.css`: `#search-bar` slides down from toolbar; `#search-results` is an absolutely-positioned scrollable list (max 300px height) with result cards showing excerpt text with the match term `<mark>`-wrapped; "No results found" empty state.
- [x] T053 [US7] Implement search logic in `reader/reader.js`: wire search toolbar button to toggle `#search-bar` visibility and focus `#search-input`; on form submit (or Enter key), call `epub-service.searchBook(book, query)` → render results in `#search-results` (each result: excerpt with `<mark>` around match, chapter label if available); cache results in a module-level variable for the session; on result click call `rendition.display(result.cfi)`; show "No results found" message when results array is empty; implement `searchBook()` in `shared/epub-service.js` as `book.search(query)` wrapped in a Promise.

**Checkpoint**: US7 independently functional. Search returns results within 3 s for typical books, results are navigable, empty state is clear.

---

## Phase 10: User Story 8 — Manage Personal Ebook Library (Priority: P8)

**Goal**: The popup displays all previously opened books with cover, title, author, progress, and finished status; user can reopen or remove any book.

**Independent Test**: Open 3+ EPUB files to various progress levels → close browser → reopen Firefox → click extension icon → verify all books shown with correct covers, titles, progress percentages → click a book → verify it opens to last position → remove a book → verify it's gone from list along with all its data.

### Implementation for User Story 8

- [x] T054 [US8] Extract and store cover image in `LIBRARY_ADD_BOOK` handler (`background/background.js`): after book bytes are stored, load book via epub.js, get `book.cover` (returns cover URL within EPUB zip), read cover blob via `book.archive.getBlob(coverPath)` → call `storage.saveCover(bookId, blob, mimeType)`; if no cover, skip silently (hasCover=false).
- [x] T055 [US8] Implement `LIBRARY_GET_ALL` handler in `background/background.js`: call `library-service.getAllLibraryEntries()` → for each entry, merge in `progressPercent` and `isFinished` from the corresponding session (call `library-service.getSession(bookId)`); return sorted by `lastReadAt` descending.
- [x] T056 [US8] Implement `LIBRARY_REMOVE_BOOK` handler in `background/background.js`: call `library-service.removeLibraryEntry(bookId)`, `library-service.removeSession(bookId)`, `annotation-service.removeAllForBook(bookId)`, `storage.deleteBookData(bookId)` — all in sequence; return `{success:true}`.
- [x] T057 [US8] Implement `LIBRARY_GET_COVER` handler in `background/background.js`: call `storage.getCover(bookId)` → if found, create an `objectURL` via `URL.createObjectURL(blob)` — **note**: objectURLs only live in the background page context; instead, base64-encode the blob and return as a data URL; return `{dataUrl}` or `{dataUrl:null}` if no cover.
- [x] T058 [US8] Build library grid in `popup/popup.js`: on popup open, send `LIBRARY_GET_ALL` → if entries exist render book cards in `#library-grid`; for each entry send `LIBRARY_GET_COVER` and set card `<img>` src to returned dataUrl (or a placeholder book icon SVG if null); wire card click to send `LIBRARY_OPEN_BOOK`; show empty-state message ("No books yet — click Open Book to add one") when library is empty.
- [x] T059 [US8] Add remove button to each library card in `popup/popup.js` and `popup/popup.html`: on click show a `window.confirm("Remove this book and all its data?")` prompt → on confirm send `LIBRARY_REMOVE_BOOK` → remove card from DOM.
- [x] T060 [P] [US8] Style library grid in `popup/popup.css`: CSS grid with 2-column book cards; each card has a cover image (120×160px, object-fit:cover, fallback grey placeholder), title (bold, 2-line clamp), author (muted, 1-line clamp), progress bar (`<progress>` element styled as thin colored bar), "Finished" badge (green pill) when `isFinished` is true; remove button appears on card hover.

**Checkpoint**: US8 independently functional. All books shown with covers and progress; reopen and remove both work correctly.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that span multiple user stories, testing coverage, and hardening.

- [x] T061 Implement keyboard shortcuts in `reader/reader.js`: `Ctrl+B` → toggle bookmark, `Ctrl+F` → open search bar, `Ctrl+T` → toggle TOC panel, `Ctrl+A` → toggle annotations panel, `Ctrl+D` → cycle themes (light → dark → sepia → light), `Ctrl++` → increase font size by 10, `Ctrl+-` → decrease font size by 10, `?` → toggle shortcuts help overlay. Prevent default browser behavior where needed.
- [x] T062 Add keyboard shortcuts help overlay to `reader/reader.html` and `reader/reader.css`: a modal `#shortcuts-overlay` (hidden by default, `?` toggles) with a two-column table listing all shortcuts; dismissible by pressing `?` again or clicking outside.
- [x] T063 [P] Add loading progress bar to `reader/reader.html` and `reader/reader.js`: show `#loading-overlay` with an indeterminate spinner while `BOOK_GET_DATA` is in flight and while epub.js `book.ready` Promise resolves; hide overlay only after `rendition.display()` resolves.
- [x] T064 Implement non-modal error notification component in `reader/reader.js`: a fixed `#toast-container` at the bottom of the viewport; `showToast(message, type)` function creates a dismissible toast element (auto-dismisses after 5 s); use for storage-full errors, parse errors, and annotation save failures — never block the reading view.
- [x] T065 Add same non-modal toast to `popup/popup.js` for errors other than the already-handled `#error-banner` (e.g., unexpected network errors during tab creation, though these should never occur by constitution Principle I).
- [x] T066 Implement duplicate-book guard in `LIBRARY_ADD_BOOK` handler (`background/background.js`): if `bookId` already exists in library, skip storage write, set `isNew:false` in response, and still return success so the popup opens the reader.
- [x] T067 Implement "open same book twice" guard in `LIBRARY_OPEN_BOOK` handler (`background/background.js`): query `browser.tabs.query({url: browser.runtime.getURL('reader/reader.html') + '?bookId=' + bookId})` → if tab found, call `browser.tabs.update(tabId, {active:true})` instead of creating a new tab.
- [x] T068 [P] Write unit tests for `shared/storage.js` in `tests/unit/storage.test.js`: mock `indexedDB` with `fake-indexeddb` or jsdom's built-in; test `saveBook/getBook/deleteBook` round-trips, `getCover/saveCover`, and error handling for missing keys.
- [x] T069 [P] Write unit tests for `shared/library-service.js` in `tests/unit/library-service.test.js`: mock `browser.storage.local` via a simple in-memory object; test all CRUD functions with valid and invalid inputs; test session upsert idempotency.
- [x] T070 [P] Write unit tests for `shared/annotation-service.js` in `tests/unit/annotation-service.test.js`: mock `browser.storage.local`; test bookmark add/remove/check, annotation CRUD, `removeAllForBook` cascade.
- [x] T071 [P] Write unit tests for `shared/epub-service.js` in `tests/unit/epub-service.test.js`: mock epub.js `Book` and `Rendition` objects; test `getToc` flattening (including empty case), `applyPreferences` calls correct epub.js APIs, `searchBook` resolves correctly.
- [x] T072 Run `npm run lint` (`web-ext lint`) and fix all reported issues in `manifest.json` and source files.
- [x] T073 Validate the 50MB file size limit: test with a >50MB EPUB file and verify `FILE_TOO_LARGE` error is displayed in popup without crash.
- [x] T074 Validate missing metadata edge case: test with an EPUB that has no title, no author, and no cover → verify library card shows filename as title, "Unknown Author" fallback, and placeholder cover icon.
- [x] T075 Run manual end-to-end validation per `quickstart.md` checklist in Firefox: open 3 books, test all user story flows in sequence, verify no console errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Stories (Phases 3–10)**: All depend on Phase 2 completion; can proceed in priority order
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational — no story dependencies. All other stories depend on US1 being complete (they all require a book to be open in the reader).
- **US2 (P2)**: Depends on US1 (needs epub.js book loaded in reader). Adds TOC panel.
- **US3 (P3)**: Depends on US1 (needs rendition in reader). Can be developed in parallel with US2 on different files.
- **US4 (P4)**: Depends on US1 (needs rendition 'relocated' events). Can be developed in parallel with US2/US3.
- **US5 (P5)**: Depends on US1 + US4 (needs CFI from session), US2 (needs chapterTitle from TOC).
- **US6 (P6)**: Depends on US1 (needs rendition). Standalone annotation storage, no dependency on US5.
- **US7 (P7)**: Depends on US1 (needs `book` object). Fully independent of US2–US6.
- **US8 (P8)**: Depends on US1 (LIBRARY_ADD_BOOK must be complete) + US4 (progress data). Cover extraction (T054) depends on T017.

### Within Each User Story

- UI HTML tasks [P] can run in parallel with service/handler tasks
- CSS tasks [P] can run in parallel with JS logic tasks
- Handler implementations in `background.js` can be developed in parallel with corresponding reader/popup logic
- Always implement the handler before wiring the caller (background before popup/reader)

---

## Parallel Execution Examples

### US1 Parallel Opportunities

```
Parallel batch 1 (no dependencies):
  Task: "Create popup/popup.html (T014)"
  Task: "Create popup/popup.css (T015)"
  Task: "Create reader/reader.html (T019)"
  Task: "Create reader/reader.css (T020)"

Sequential after batch 1:
  Task: "Create popup/popup.js (T016)" — depends on T014
  Task: "Implement LIBRARY_ADD_BOOK handler (T017)" — depends on T013 (background scaffold)
  Task: "Implement LIBRARY_OPEN_BOOK handler (T018)" — depends on T017
  Task: "Create reader/reader.js core init (T021)" — depends on T019, T018
  Task: "Implement BOOK_GET_DATA handler (T022)" — depends on T013
  Task: "Implement page navigation (T023)" — depends on T021
```

### US2 Parallel Opportunities

```
Parallel batch:
  Task: "Add TOC panel HTML (T026)"
  Task: "Add TOC panel CSS (T027)"

Sequential after:
  Task: "Implement getToc() (T025)" — depends on shared/epub-service.js (T011)
  Task: "Implement TOC panel JS logic (T028)" — depends on T025, T026, T027
```

### US3–US7 Parallel Opportunities

US3, US4, and US7 can all be started in parallel once US1 is complete, as they touch different files within `reader/reader.js` (different event listeners and panel logic) and separate `background.js` handlers.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open any EPUB, page through it, verify error handling
5. Ship/demo — this is a working ebook reader

### Incremental Delivery

1. Setup + Foundational → skeleton ready
2. US1 → Open and read EPUBs → **MVP**
3. US2 → Add chapter navigation → Better reading UX
4. US3 → Add appearance customization → Comfortable reading
5. US4 → Add progress save/restore → Reliable sessions
6. US5 → Add bookmarks → Reference use cases
7. US6 → Add highlights + notes → Study/research use cases
8. US7 → Add in-book search → Power users
9. US8 → Add full library UI → Complete app experience
10. Polish → Testing + shortcuts + hardening → Production ready

---

## Notes

- All `[P]` tasks modify different files and have no intra-batch dependencies
- Each user story phase has a Checkpoint — validate the story independently before moving to the next
- `background/background.js` has concurrent handler implementations across phases; coordinate by implementing the full handler for one story before moving to the next
- `reader/reader.js` accumulates logic across phases; use clearly named functions and group by feature area with section comments
- Commit after each Checkpoint (one commit per user story completion)
- Constitution Principle IV: every `rendition.on('relocated')` handler MUST be debounced; never make it synchronous/blocking
- Constitution Principle I: verify via `web-ext lint` and browser network tab that zero network requests are made at any point during extension operation
