# Feature Specification: Firefox Ebook Reader Extension

**Feature Branch**: `001-firefox-ebook-reader`  
**Created**: 2026-07-31  
**Status**: Draft  
**Input**: User description: "Build a ebook reader firefox extension. This should have necessary features which make ebook reading a nice experience."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load and Read an Ebook (Priority: P1)

A user has a local EPUB file and wants to read it inside Firefox without leaving the browser. They click the extension icon, select their ebook file from their device, and the extension opens a clean, paginated reading view. The user can turn pages and read comfortably.

**Why this priority**: This is the core value proposition. Without being able to load and display a book, nothing else matters. Every other story depends on this one working.

**Independent Test**: Can be fully tested by loading any EPUB file and reading through several pages. Delivers a complete, usable reading experience as a standalone MVP.

**Acceptance Scenarios**:

1. **Given** the extension is installed and the user clicks the extension icon, **When** the user selects a valid EPUB file from their device, **Then** the book opens in a dedicated reading view displaying the first page with readable text and any embedded images.
2. **Given** the user is reading a book, **When** the user clicks the next/previous page button or uses arrow keys, **Then** the view advances or retreats one page smoothly without flicker or layout shift.
3. **Given** the user selects a malformed or unsupported file format, **When** the extension attempts to open it, **Then** the extension displays a clear error message indicating the file is not supported and does not crash.
4. **Given** a multi-chapter EPUB, **When** the book is loaded, **Then** all chapters are accessible and chapter boundaries are handled seamlessly during pagination.

---

### User Story 2 - Navigate via Table of Contents (Priority: P2)

A user wants to jump directly to a specific chapter rather than paging through the whole book. They open the table of contents panel, see a list of all chapters and sections, click the desired chapter, and are taken directly there.

**Why this priority**: Long ebooks are impractical to navigate page-by-page. Chapter navigation is essential for any non-trivial reading session and dramatically improves usability.

**Independent Test**: Can be tested independently by loading an EPUB with multiple chapters, opening the TOC panel, and verifying that clicking each entry navigates to the correct location.

**Acceptance Scenarios**:

1. **Given** a book is open, **When** the user opens the table of contents panel, **Then** a hierarchical list of all chapters and sections is displayed, matching the book's internal TOC.
2. **Given** the TOC panel is open, **When** the user clicks a chapter entry, **Then** the reading view jumps to that chapter's first page and the TOC panel closes (or stays open, based on user preference).
3. **Given** the reading view is at a chapter, **When** the TOC is opened, **Then** the current chapter is visually highlighted in the list.

---

### User Story 3 - Customize Reading Appearance (Priority: P3)

A user wants to adjust the reading environment to reduce eye strain and match their personal preferences. They open the appearance settings and change the font size, font family, line spacing, and switch to a dark or sepia reading theme.

**Why this priority**: Customization is a defining quality-of-life feature that differentiates a good ebook reader from a raw file viewer. It directly impacts comfort during long reading sessions.

**Independent Test**: Can be tested independently by opening any book, accessing the appearance panel, and verifying that each setting change (font size, theme, font family, line spacing) is applied immediately to the reading view.

**Acceptance Scenarios**:

1. **Given** a book is open and the user opens the appearance settings panel, **When** the user increases or decreases the font size, **Then** the text in the reading view rescales immediately without a page reload.
2. **Given** the appearance settings panel is open, **When** the user selects the dark theme, **Then** the reading area background switches to a dark color and text color adjusts to remain readable.
3. **Given** the user has customized appearance settings, **When** the user closes and reopens the extension, **Then** the previously chosen settings are restored automatically.
4. **Given** the appearance panel is open, **When** the user changes the font family, **Then** the reading view immediately reflects the new font across all visible text.

---

### User Story 4 - Save and Restore Reading Progress (Priority: P4)

A user reads partway through a book, closes the browser, and later reopens the extension. The extension automatically resumes from the exact page where they stopped reading, without any manual action required.

**Why this priority**: Automatic progress saving is a fundamental expectation of any ebook reader. Without it, users must manually find their place each time, which is frustrating and unusable for long books.

**Independent Test**: Can be tested independently by opening a book, navigating to a specific page, closing and reopening the extension, and verifying the book reopens at the same position.

**Acceptance Scenarios**:

1. **Given** a user is reading a book and has navigated to page 47, **When** the user closes the browser tab or the extension popup, **Then** the reading position is saved automatically without any user action.
2. **Given** a user previously read a book to a certain position, **When** the user opens the same book again, **Then** the extension resumes from the last saved page and displays a visual progress indicator (e.g., "Page 47 of 210, 22%").
3. **Given** multiple books have been opened previously, **When** the user opens the extension library view, **Then** each book displays its last-read position and reading percentage.

---

### User Story 5 - Bookmark Pages (Priority: P5)

A user wants to mark a specific page for later reference. They click the bookmark button while reading, optionally add a label, and the bookmark is saved. Later, they open the bookmarks panel to jump back to any saved bookmark.

**Why this priority**: Bookmarks allow users to save meaningful passages or return points, supporting non-linear reading and reference use cases.

**Independent Test**: Can be tested independently by bookmarking a few pages, navigating away, opening the bookmarks panel, and verifying navigation back to each bookmarked page.

**Acceptance Scenarios**:

1. **Given** a user is on a specific page, **When** the user clicks the bookmark icon, **Then** the page is bookmarked and the icon changes to indicate an active bookmark on this page.
2. **Given** a page is already bookmarked, **When** the user clicks the bookmark icon again, **Then** the bookmark is removed (toggle behavior).
3. **Given** bookmarks have been saved, **When** the user opens the bookmarks panel, **Then** all bookmarks are listed with their label (if any), page number, and a preview of surrounding text.
4. **Given** the bookmarks panel is open, **When** the user clicks a bookmark entry, **Then** the reading view navigates directly to that bookmarked page.

---

### User Story 6 - Highlight Text and Add Annotations (Priority: P6)

A user wants to highlight an important passage and add a personal note to it. They select text with their mouse, choose a highlight color from a popup, optionally type a note, and the highlight is saved. They can review all highlights and notes in a dedicated panel.

**Why this priority**: Annotation is the key feature that turns a reader into an active study or research tool, adding significant value for students and researchers.

**Independent Test**: Can be tested independently by highlighting several text passages across chapters, adding notes, then opening the annotations panel and verifying all highlights and notes are listed and clickable.

**Acceptance Scenarios**:

1. **Given** a user selects a text passage with their mouse, **When** the selection toolbar appears and the user chooses a highlight color, **Then** the selected text is highlighted in that color and the highlight is saved.
2. **Given** a text passage is highlighted, **When** the user clicks on the highlight and chooses "Add Note," **Then** a text input appears allowing the user to type and save an annotation linked to that highlight.
3. **Given** multiple highlights and annotations exist, **When** the user opens the annotations panel, **Then** all highlights are listed with their text excerpt, note (if any), color, and a link to navigate to the location in the book.
4. **Given** the user wants to remove a highlight, **When** the user clicks on it and selects "Remove," **Then** the highlight and its associated note are permanently deleted.

---

### User Story 7 - Search Within a Book (Priority: P7)

A user wants to find every occurrence of a specific word or phrase in the book they are currently reading. They open the search bar, type their query, and a list of matching results with surrounding context is shown. Clicking a result jumps to that location.

**Why this priority**: Search is particularly valuable for reference books and academic texts. It enables rapid information retrieval without manual browsing.

**Independent Test**: Can be tested independently by searching for a known word in an open book and verifying that results are accurate, clickable, and navigate to the correct location.

**Acceptance Scenarios**:

1. **Given** a book is open, **When** the user opens the in-book search bar and types a query, **Then** a list of results appears showing each occurrence with a short surrounding text excerpt.
2. **Given** search results are displayed, **When** the user clicks a result, **Then** the reading view navigates to that page and the matching text is visually highlighted.
3. **Given** a search query with no matches, **When** the search is submitted, **Then** the extension displays a "No results found" message clearly.
4. **Given** a large book (up to 10MB), **When** a search is submitted, **Then** results are returned within 3 seconds.

---

### User Story 8 - Manage Personal Ebook Library (Priority: P8)

A user wants to keep track of all the ebooks they have opened with the extension. The extension maintains a library showing book covers, titles, authors, and reading progress. The user can quickly reopen a recent book without re-selecting the file, remove books from the library, and see which books they have finished.

**Why this priority**: A library view transforms the extension from a one-book-at-a-time reader into a personal reading hub, improving long-term usability and user retention.

**Independent Test**: Can be tested independently by opening several books at various stages of completion, then navigating to the library view to verify accurate metadata and progress display.

**Acceptance Scenarios**:

1. **Given** the user has opened books previously, **When** the user opens the extension to its library view, **Then** all previously opened books are listed with their cover image (if available), title, author, and reading progress percentage.
2. **Given** a book is listed in the library, **When** the user clicks on it, **Then** the book opens and resumes from the last saved reading position.
3. **Given** the library view is displayed, **When** the user chooses to remove a book, **Then** the book entry (along with its bookmarks and annotations) is removed after a confirmation prompt.
4. **Given** a book has been read to 100% completion, **When** it appears in the library, **Then** it is visually marked as "Finished."

---

### Edge Cases

- What happens when an EPUB file is larger than 50MB — does loading time remain acceptable, and is the user informed of progress?
- How does the extension handle EPUB files with missing or malformed metadata (no title, no author, no cover image)?
- What happens if the user's browser storage is full and a new reading position or annotation cannot be saved?
- How are books with right-to-left (RTL) text direction (e.g., Arabic, Hebrew) rendered?
- What happens if the user renames or deletes the source EPUB file after it has been added to the library?
- How does the extension handle EPUBs that contain only images (e.g., comic books or scanned books) with no selectable text?
- What happens when the user attempts to open the same book file twice simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST allow users to select and load local EPUB files (EPUB 2 and EPUB 3) from their device.
- **FR-002**: The extension MUST render ebook content (text, images, basic formatting) in a clean, paginated reading view.
- **FR-003**: The extension MUST support page-by-page navigation (next, previous) and direct chapter navigation via the table of contents.
- **FR-004**: The extension MUST parse and display the ebook's table of contents, reflecting its internal hierarchy.
- **FR-005**: The extension MUST highlight the current chapter in the table of contents panel based on the reading position.
- **FR-006**: The extension MUST allow users to adjust font size across a defined range (e.g., small to extra-large).
- **FR-007**: The extension MUST allow users to switch between at least three reading themes: Light, Dark, and Sepia.
- **FR-008**: The extension MUST allow users to change the font family from a curated list of readable typefaces.
- **FR-009**: The extension MUST allow users to adjust line spacing and page margin width.
- **FR-010**: The extension MUST automatically save the current reading position (chapter and scroll/page offset) whenever the user navigates away or closes the reader.
- **FR-011**: The extension MUST restore the last saved reading position when a previously opened book is re-launched.
- **FR-012**: The extension MUST display reading progress as a percentage and/or page count.
- **FR-013**: The extension MUST allow users to create bookmarks on any page, with an optional text label.
- **FR-014**: The extension MUST allow users to view all bookmarks for the current book in a panel and navigate to any bookmark.
- **FR-015**: The extension MUST allow users to delete individual bookmarks.
- **FR-016**: The extension MUST allow users to highlight selected text in at least three colors.
- **FR-017**: The extension MUST allow users to attach a text note to any highlight.
- **FR-018**: The extension MUST display all highlights and annotations for the current book in a panel, with navigation to each location.
- **FR-019**: The extension MUST allow users to delete individual highlights and their associated notes.
- **FR-020**: The extension MUST provide a full-text search bar that returns a list of results with surrounding context for any query within the currently open book.
- **FR-021**: The extension MUST navigate to and visually highlight the matching text when a search result is selected.
- **FR-022**: The extension MUST maintain a personal library of all previously opened books, storing metadata (title, author, cover, progress).
- **FR-023**: The extension MUST allow users to remove a book from the library via a confirmation-protected action.
- **FR-024**: The extension MUST support keyboard shortcuts for common actions: next page, previous page, toggle bookmark, open search, open TOC.
- **FR-025**: All user data (library, bookmarks, annotations, preferences) MUST be stored locally on the user's device with no data transmitted externally.
- **FR-026**: The extension MUST display a meaningful error message when an unsupported or corrupted file is selected.

### Key Entities

- **Book**: Represents a loaded ebook. Attributes: title, author, cover image, file reference/identifier, format (EPUB 2/3), total chapter count, metadata (publisher, language, description).
- **Reading Session**: Tracks the user's position in a book. Attributes: book identifier, current chapter index, page/scroll offset within chapter, reading progress percentage, last-read timestamp.
- **Bookmark**: A saved location in a book. Attributes: book identifier, chapter index, page offset, user-provided label, creation timestamp.
- **Annotation**: A highlighted text passage with an optional note. Attributes: book identifier, chapter index, start/end character offsets, highlighted text snippet, user note content, highlight color, creation timestamp.
- **Reading Preferences**: User's appearance settings. Attributes: font size, font family, theme (light/dark/sepia), line spacing, margin width.
- **Library Entry**: A book's entry in the user's library. Attributes: book identifier, metadata snapshot, reading progress, finished status, date first opened, date last read.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open and begin reading a valid EPUB file within 5 seconds of selecting it on a standard consumer device.
- **SC-002**: Reading position is saved and restored with 100% accuracy across browser restarts for all books in the library.
- **SC-003**: Reading theme and font size changes are applied to the reading view in under 200 milliseconds, with no page reload required.
- **SC-004**: Users can navigate to any chapter in a book within 3 interactions (click TOC icon → select chapter).
- **SC-005**: Full-text search returns results within 3 seconds for EPUB files up to 10MB in size.
- **SC-006**: 90% of users can successfully bookmark a page without consulting any documentation, on their first attempt.
- **SC-007**: 90% of users can highlight text and attach a note without consulting any documentation, on their first attempt.
- **SC-008**: The extension functions correctly for EPUB files between 1MB and 50MB without memory errors or crashes.
- **SC-009**: All user data (progress, bookmarks, annotations) persists correctly after browser restart with no data loss.
- **SC-010**: Keyboard shortcuts for all primary actions (page turn, bookmark, TOC, search) are discoverable via a help overlay and functional at all times during active reading.

## Assumptions

- The primary supported ebook format is EPUB (EPUB 2 and EPUB 3); PDF support is out of scope for v1.
- DRM-protected ebook files are out of scope; only unencrypted EPUB files are supported.
- All user data (library, bookmarks, annotations, preferences) is stored locally in browser storage; cloud synchronization is out of scope for v1.
- The extension targets desktop Firefox only; Firefox for Android is out of scope for v1.
- Users already have EPUB files on their local device; the extension does not provide ebook discovery, purchasing, or downloading functionality.
- The extension operates entirely offline; no network requests are made for core reading functionality.
- Basic HTML/CSS formatting within EPUB files is supported; advanced scripted interactivity inside EPUB files (EPUB 3 scripting) is treated as best-effort.
- Right-to-left (RTL) language support (Arabic, Hebrew, etc.) is a stretch goal; v1 prioritizes left-to-right reading layouts.
- The extension does not support cross-device sync or multi-profile support; data is tied to the Firefox profile in use.

## Implementation Notes

### Architecture Decisions

**Direct IndexedDB Access**: Book binary data is stored in and read directly from IndexedDB by all contexts (popup, background, reader). This eliminates `runtime.sendMessage` size limits that caused infinite loading issues with large EPUB files (>4MB).

**File Picker in Tab Mode**: Firefox extension popups close when native file dialogs open. The popup opens itself as a full tab (`?mode=tab`) when the user clicks "Open Book", allowing reliable file selection without popup closure.

**JSZip Dependency**: epub.js requires JSZip as a global. Both `jszip.min.js` and `epub.min.js` are vendored and loaded in correct order in all contexts (background scripts, reader page).

**CSS `[hidden]` Override**: Elements using `display: flex` or `display: grid` require explicit `[hidden] { display: none; }` rules, as CSS specificity overrides the HTML `hidden` attribute's default styling.

**Location Generation**: epub.js requires `book.locations.generate()` to be called for progress percentage calculation. This runs asynchronously after book load (1024 characters per location).

**Annotation Data Sync**: epub.js annotations store custom data objects. When updating annotations (note/color changes), the annotation must be removed and re-added with updated data to ensure `markClicked` events receive current information.

**Metadata Extraction Timeout**: epub.js `book.ready` and `book.coverUrl()` can hang indefinitely on malformed EPUBs. All epub.js operations in background script are wrapped with 5-10 second timeouts and graceful fallbacks.

### Known Limitations

- Progress percentage shows 0% until location generation completes (a few seconds for large books)
- Highlight removal via `rendition.annotations.remove()` is unreliable; manual DOM manipulation is used as fallback
- Very large EPUBs (>50MB) may cause storage quota errors depending on available browser storage
