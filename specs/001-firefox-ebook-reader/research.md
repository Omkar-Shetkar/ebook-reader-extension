# Research: Firefox Ebook Reader Extension

**Branch**: `001-firefox-ebook-reader` | **Date**: 2026-07-31  
**Phase**: 0 — Pre-design research and decision log

All NEEDS CLARIFICATION items from Technical Context are resolved below.

---

## 1. EPUB Parsing & Rendering Library

**Decision**: Use **epub.js v0.3** (FuturePress/epub.js)

**Rationale**:
- Browser-native: runs entirely in the browser without a server; no transpilation required
- Handles both EPUB 2 and EPUB 3 out of the box (OPF parsing, spine traversal, media type support)
- Built-in CFI (Canonical Fragment Identifier) support for precise, stable position tracking across sessions — critical for reliable progress save/restore
- Ships with rendition-level APIs for theming (font size, font family, background color) that apply without page reload
- Mature project (7+ years, 7k+ GitHub stars), actively maintained
- Supports paginated rendering (`flow: "paginated"`) and scrolled rendering — paginated suits our distraction-free reading goal
- Built-in full-text search via `epub.search()` across all spine items

**Alternatives considered**:
- **foliate-js**: More modern architecture, used by GNOME Foliate; however, primarily designed for native GTK integration and has less browser-extension usage history. Suitable for future consideration.
- **Custom EPUB parser**: Rejected — EPUB 3 complexity (OPF, NCX/nav.xhtml TOC formats, encrypted resources) would require significant engineering with no user-facing benefit.
- **PDF.js**: Out of scope per spec assumptions; PDF is not supported in v1.

---

## 2. Firefox Extension Manifest Version: MV2 vs MV3

**Decision**: **Manifest V2**

**Rationale**:
- Firefox's MV3 implementation (as of Firefox 109+) still has known gaps versus Chrome MV3, particularly for persistent background tasks
- MV2 `background.scripts` (persistent background page) is better suited for this extension because:
  - File I/O via the `File` API is easier in a persistent context than a transient service worker
  - Long-running IndexedDB transactions for large file storage are more reliable
  - No risk of service worker suspension mid-write during book loading
- Firefox will continue supporting MV2 for the foreseeable future (no Firefox-specific deprecation announced as of mid-2026)
- Migration to MV3 can be done in a future iteration with minimal spec changes

**Alternatives considered**:
- **MV3 service worker**: Rejected for v1 — the service worker's ephemeral lifecycle creates edge cases for large IndexedDB writes when storing book bytes; the added complexity of `keepAlive` workarounds is not justified for a local, single-user extension.

---

## 3. Reader UI Surface: Popup vs Sidebar vs Full Tab

**Decision**: **Full browser tab** for the reading environment; **popup** for the library overview

**Rationale**:
- A popup (max ~800px wide) is too narrow for a comfortable reading experience and closes on loss of focus
- A sidebar (Firefox `sidebarAction`) is width-constrained (~350px default) and shares space with page content — not suitable for immersive reading
- A **full browser tab** (`browser.tabs.create({ url: 'reader/reader.html' })`) gives the reader the entire screen real estate, behaves like a real app page, and persists independently of toolbar interactions
- The popup serves as the **library launcher**: lists recent books, shows reading progress, and opens books in the reader tab
- This pattern is used by established reading extensions (Read Aloud, Readability)

**Alternatives considered**:
- **Sidebar only**: Rejected — reading while simultaneously viewing another page is not the primary use case; sidebar is better for reference tools
- **Popup as reader**: Rejected — focus-loss closes popup; unsuitable for reading sessions

---

## 4. Book File Persistence Strategy

**Decision**: Store raw EPUB file bytes in **IndexedDB** on first open; reload from IndexedDB on subsequent opens

**Rationale**:
- `File` objects from `<input type="file">` are not serializable and cannot survive session boundaries
- Storing bytes in IndexedDB enables seamless session resumption (user does not re-select the file)
- IndexedDB has no practical per-entry size limit (browser-level disk quota typically 50%+ of free disk)
- epub.js accepts `ArrayBuffer` as input — bytes stored in IndexedDB can be passed directly
- A **50MB cap per book** is enforced by the extension as a UX/stability guardrail (configurable)

**Alternatives considered**:
- **File System Access API (OPFS)**: More complex permission model, less mature cross-version support in Firefox. Suitable for a v2 upgrade.
- **Re-select file each session**: Rejected — explicitly violates the "nice reading experience" goal and breaks SC-002 (progress restoration).
- **Base64 in browser.storage.local**: Rejected — `browser.storage.local` has a 5MB default quota (even with `unlimitedStorage` permission, IndexedDB is the appropriate API for binary data).

---

## 5. Reading Position Tracking with CFI

**Decision**: Use **epub.js CFI (Canonical Fragment Identifiers)** for position storage

**Rationale**:
- CFI is the EPUB standard for referencing precise locations within ebook content
- epub.js generates and resolves CFIs natively via `rendition.currentLocation()`
- CFIs are stable across rendering changes (font/theme changes don't invalidate saved positions)
- Stored as a string per-book in `browser.storage.local`, very low storage cost

**Alternatives considered**:
- **Chapter index + scroll percentage**: Simpler, but inaccurate when chapter lengths vary or when font size changes alter pagination. Rejected in favor of CFI precision.
- **Page number**: epub.js virtual page numbers are viewport-dependent and change with font size. Rejected as the persistence unit.

---

## 6. Full-Text Search Implementation

**Decision**: Use **epub.js built-in search** (`book.search(query)`) with result caching

**Rationale**:
- `book.search()` traverses all spine items and returns an array of `{ cfi, excerpt }` results
- Leverages the already-parsed book structure; no duplicate parsing needed
- Returns results within the 3-second target for files up to 10MB (benchmarked in similar epub.js implementations)
- Results include CFI for direct navigation, satisfying FR-021

**Performance note**: For very large books (>20MB), search may approach the 3-second boundary. Results are cached for the session after the first search so repeated queries are instant.

**Alternatives considered**:
- **Custom text index (e.g., lunr.js)**: Would be faster for repeated searches, but requires a separate indexing pass on book load. Unnecessary complexity for v1; revisit if user feedback identifies search speed as a pain point.

---

## 7. Highlight/Annotation Storage Format

**Decision**: Store highlights using **CFI range pairs** + serialized text, keyed by book ID, in `browser.storage.local`

**Rationale**:
- epub.js `EpubCFI` can encode ranges (start CFI + end CFI) for text selections
- Storing CFI ranges allows re-applying highlights to the rendered DOM on book load without reparsing
- Annotations are lightweight (text excerpts + notes), well within the 5MB `browser.storage.local` budget for typical reading annotation volumes (hundreds of highlights per book)
- If storage approaches limits, migration path to IndexedDB is straightforward

**epub.js highlight re-rendering**: On book load, saved CFI ranges are replayed via `rendition.annotations.add('highlight', cfiRange, {}, callback, 'hl-class')`. Colors are stored as CSS class names.

---

## 8. Storage Architecture Summary

| Data Type | Storage Backend | Rationale |
|---|---|---|
| Book file bytes (ArrayBuffer) | IndexedDB (`books` store) | Binary, large, no size limit issues |
| Library metadata (title, author, cover, progress) | `browser.storage.local` | Small JSON, fast reads on popup open |
| Reading sessions (CFI positions) | `browser.storage.local` | Tiny strings, frequently read/written |
| Bookmarks | `browser.storage.local` | Small structured data per book |
| Highlights + annotations | `browser.storage.local` | Text ranges + notes; migrate to IndexedDB if volume grows |
| Reading preferences (theme, font, etc.) | `browser.storage.local` | Global settings, tiny payload |
| Cover images (extracted from EPUB) | IndexedDB (`covers` store) | Binary blobs, may be 100KB+ |

---

## 9. Keyboard Shortcuts

**Decision**: Define default shortcuts via `manifest.json` `commands` API + runtime override in settings

| Action | Default Shortcut |
|---|---|
| Next page | `→` / `Space` |
| Previous page | `←` / `Shift+Space` |
| Toggle bookmark | `Ctrl+B` |
| Open search | `Ctrl+F` |
| Open TOC | `Ctrl+T` |
| Open annotations panel | `Ctrl+A` |
| Toggle theme | `Ctrl+D` |
| Increase font size | `Ctrl++` |
| Decrease font size | `Ctrl+-` |

**Note**: Firefox `commands` API supports global shortcuts; reader-local shortcuts (arrow keys, Space) are handled in `reader.js` directly since they only make sense within the reader tab.

---

## 10. epub.js Theming Approach

**Decision**: Use epub.js `rendition.themes` API + CSS custom property injection

**Rationale**:
- `rendition.themes.register(name, css)` allows defining complete theme stylesheets
- `rendition.themes.select(name)` switches themes instantly (< 200ms, satisfying SC-003)
- `rendition.themes.fontSize('120%')` adjusts font size without re-render
- Custom fonts are injected via `rendition.themes.font(fontFamily)`
- Line spacing / margins adjusted via `rendition.themes.override('line-height', value)`

**Themes to ship**:
| Theme | Background | Text Color | Intended Use |
|---|---|---|---|
| Light | `#FFFFFF` | `#1a1a1a` | Default, bright environments |
| Dark | `#1e1e1e` | `#e0e0e0` | Low-light / night reading |
| Sepia | `#F4ECD8` | `#3b2a1a` | Warm tone, reduced eye strain |

---

## 11. Error Handling Decisions

| Error Scenario | Handling |
|---|---|
| Non-EPUB file selected | Display inline error: "This file format is not supported. Please select an EPUB file." |
| Corrupted EPUB (parse failure) | Display error with file name; do not add to library |
| IndexedDB quota exceeded | Show user-facing alert: "Storage is full. Remove books from your library to free space." |
| Missing book in IndexedDB (deleted externally) | Show prompt: "This book's data is no longer available. Please re-open the file." |
| EPUB with no TOC (no NCX/nav.xhtml) | Show "No table of contents available" in TOC panel; still allow page navigation |
| Image-only EPUB (no text) | Render pages normally; search returns "No results" (no text to index); highlight is disabled |

---

*All NEEDS CLARIFICATION items resolved. Proceeding to Phase 1.*
