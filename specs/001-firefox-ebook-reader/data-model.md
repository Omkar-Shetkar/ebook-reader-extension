# Data Model: Firefox Ebook Reader Extension

**Branch**: `001-firefox-ebook-reader` | **Date**: 2026-07-31  
**Phase**: 1 — Design

---

## Storage Backends

| Backend | Used for |
|---|---|
| **IndexedDB** (`ebook-reader-db`) | Book file bytes (ArrayBuffer), cover image blobs |
| **`browser.storage.local`** | Library metadata, reading sessions, bookmarks, annotations, preferences |

---

## IndexedDB Schema

**Database name**: `ebook-reader-db`  
**Version**: 1

### Object Store: `books`

Stores raw EPUB file bytes, enabling session resumption without re-selecting files.

| Field | Type | Description |
|---|---|---|
| `bookId` | `string` (PK) | Stable identifier — SHA-256 hash of file bytes (first 64KB sample for speed). Key path: `bookId` |
| `data` | `ArrayBuffer` | Raw EPUB file bytes |
| `sizeBytes` | `number` | File size in bytes |
| `storedAt` | `number` | Unix timestamp (ms) of when the file was stored |

**Index**: `storedAt` (for cleanup of old unused books)

### Object Store: `covers`

Stores extracted cover images as Blob URLs.

| Field | Type | Description |
|---|---|---|
| `bookId` | `string` (PK) | Matches `books.bookId` |
| `blob` | `Blob` | Cover image blob (JPEG/PNG extracted from EPUB) |
| `mimeType` | `string` | e.g., `"image/jpeg"` |

---

## browser.storage.local Schema

All data is namespaced under a top-level key structure. Total expected payload for a typical library (50 books, 200 highlights) is well under 1MB.

### `library` — Map of library entries

```jsonc
{
  "library": {
    "<bookId>": { /* LibraryEntry */ },
    "<bookId>": { /* LibraryEntry */ }
  }
}
```

#### LibraryEntry

```jsonc
{
  "bookId": "sha256-abc123",          // string — stable identifier
  "title": "The Great Gatsby",        // string
  "author": "F. Scott Fitzgerald",    // string | null
  "publisher": "Scribner",            // string | null
  "language": "en",                   // string | null — BCP 47 language tag
  "description": "A novel about...",  // string | null
  "format": "epub3",                  // "epub2" | "epub3"
  "sizeBytes": 524288,                // number
  "totalSpineItems": 12,              // number — chapter count from EPUB spine
  "hasCover": true,                   // boolean — whether cover was extracted
  "addedAt": 1753977600000,           // number — Unix ms timestamp
  "lastReadAt": 1753977700000,        // number | null — Unix ms timestamp
  "isFinished": false                 // boolean
}
```

### `sessions` — Reading progress per book

```jsonc
{
  "sessions": {
    "<bookId>": { /* ReadingSession */ }
  }
}
```

#### ReadingSession

```jsonc
{
  "bookId": "sha256-abc123",
  "currentCfi": "epubcfi(/6/4!/4/2/1:0)",  // string — epub.js CFI for current position
  "progressPercent": 22.4,                  // number — 0–100
  "currentSpineIndex": 3,                   // number — current chapter index in spine
  "totalSpineItems": 12,                    // number — cached for progress display
  "savedAt": 1753977700000                  // number — Unix ms timestamp
}
```

### `bookmarks` — Bookmarks per book

```jsonc
{
  "bookmarks": {
    "<bookId>": [ /* Bookmark[] */ ]
  }
}
```

#### Bookmark

```jsonc
{
  "bookmarkId": "bm-uuid-v4",           // string — UUID v4
  "bookId": "sha256-abc123",            // string
  "cfi": "epubcfi(/6/4!/4/2/1:0)",     // string — position CFI
  "spineIndex": 3,                      // number — chapter index (for display)
  "chapterTitle": "Chapter 3",          // string | null — from TOC
  "label": "Key scene",                 // string | null — user-provided label
  "excerpt": "It was the best of...",   // string — ~100 char text excerpt around position
  "createdAt": 1753977700000            // number — Unix ms timestamp
}
```

### `annotations` — Highlights and notes per book

```jsonc
{
  "annotations": {
    "<bookId>": [ /* Annotation[] */ ]
  }
}
```

#### Annotation

```jsonc
{
  "annotationId": "an-uuid-v4",             // string — UUID v4
  "bookId": "sha256-abc123",                // string
  "cfiRange": "epubcfi(/6/4!/4/2/1:5,/4/2/1:50)", // string — epub.js CFI range for selection
  "highlightedText": "To be or not to be", // string — selected text (max 500 chars)
  "color": "yellow",                        // "yellow" | "green" | "blue" | "pink"
  "note": "Hamlet's famous soliloquy",      // string | null — user note
  "spineIndex": 3,                          // number — chapter index (for sorting/display)
  "chapterTitle": "Act III, Scene I",       // string | null
  "createdAt": 1753977700000,               // number — Unix ms timestamp
  "updatedAt": 1753977800000                // number — Unix ms timestamp
}
```

### `preferences` — Global reading preferences

```jsonc
{
  "preferences": {
    "theme": "light",          // "light" | "dark" | "sepia"
    "fontFamily": "Georgia",   // string — one of the curated font options
    "fontSize": 100,           // number — percentage (80–200, step 10)
    "lineHeight": 1.6,         // number — CSS line-height value (1.0–2.5, step 0.1)
    "marginPercent": 8,        // number — horizontal margin % of reader width (0–20, step 2)
    "flow": "paginated"        // "paginated" | "scrolled"
  }
}
```

---

## Entity Relationships

```text
LibraryEntry (1) ──── (1) ReadingSession     [one active session per book]
LibraryEntry (1) ──── (N) Bookmark           [many bookmarks per book]
LibraryEntry (1) ──── (N) Annotation         [many annotations per book]
LibraryEntry (1) ──── (0..1) books (IDB)     [book bytes, keyed by bookId]
LibraryEntry (1) ──── (0..1) covers (IDB)    [cover blob, keyed by bookId]
```

---

## State Transitions

### Book lifecycle

```text
[File Selected] 
    → parse EPUB metadata (epub.js)
    → store bytes in IndexedDB
    → extract + store cover in IndexedDB  
    → create LibraryEntry in browser.storage.local
    → create initial ReadingSession (progressPercent: 0, cfi: null)
    → open reader tab

[Book Opened from Library]
    → fetch bytes from IndexedDB
    → pass to epub.js
    → restore position from ReadingSession.currentCfi

[Reading in Progress]
    → on every page turn: update ReadingSession (debounced, 500ms delay)

[Book Finished]
    → ReadingSession.progressPercent = 100
    → LibraryEntry.isFinished = true

[Book Removed from Library]
    → delete LibraryEntry
    → delete ReadingSession
    → delete all Bookmarks for book
    → delete all Annotations for book
    → delete from IndexedDB books store
    → delete from IndexedDB covers store
```

---

## Validation Rules

| Entity | Field | Rule |
|---|---|---|
| LibraryEntry | `bookId` | Non-empty string, unique in library map |
| LibraryEntry | `title` | Fallback to filename if EPUB metadata is missing |
| LibraryEntry | `sizeBytes` | Must be > 0 and ≤ 52,428,800 (50MB); reject files exceeding limit |
| ReadingSession | `progressPercent` | Clamped to [0, 100] |
| Bookmark | `bookmarkId` | UUID v4 format |
| Annotation | `color` | Must be one of: `"yellow"`, `"green"`, `"blue"`, `"pink"` |
| Annotation | `highlightedText` | Truncated to 500 characters |
| Annotation | `cfiRange` | Must be a valid epub.js CFI range string |
| Preferences | `fontSize` | Integer, clamped to [80, 200] |
| Preferences | `lineHeight` | Float, clamped to [1.0, 2.5] |
| Preferences | `marginPercent` | Integer, clamped to [0, 20] |

---

## Book ID Generation

```text
bookId = "sha256-" + hex(SHA256(first 65536 bytes of file ArrayBuffer))
```

Using only the first 64KB makes ID generation fast even for 50MB files. Collision probability is negligible for personal ebook libraries. If the full-file hash is desired in future, it can be computed asynchronously after the book is stored.

---

## Curated Font Options

| Display Name | CSS Value |
|---|---|
| Georgia | `"Georgia, serif"` |
| Palatino | `"Palatino Linotype, Palatino, serif"` |
| Arial | `"Arial, sans-serif"` |
| Verdana | `"Verdana, sans-serif"` |
| OpenDyslexic | `"OpenDyslexic, sans-serif"` (bundled font) |
| System Default | `"inherit"` (uses EPUB's own CSS) |
