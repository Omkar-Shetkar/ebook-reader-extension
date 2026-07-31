# Message Contracts: Firefox Ebook Reader Extension

**Branch**: `001-firefox-ebook-reader` | **Date**: 2026-07-31  
**Phase**: 1 — Design

All communication between extension contexts (popup ↔ background ↔ reader tab) uses `browser.runtime.sendMessage()` / `browser.tabs.sendMessage()` with a structured message schema. All messages are JSON-serializable objects.

---

## Message Schema

Every message follows this envelope:

```jsonc
{
  "type": "ACTION_NAME",   // string — identifies the action (see catalog below)
  "payload": { /* ... */ } // object | null — action-specific data
}
```

Every response follows:

```jsonc
{
  "success": true,         // boolean
  "data": { /* ... */ },   // object | null — response payload (present on success)
  "error": null            // string | null — human-readable error (present on failure)
}
```

---

## Message Catalog

### Library Management (Popup → Background)

#### `LIBRARY_GET_ALL`

Retrieve the full library for display in the popup.

**Request**:
```jsonc
{ "type": "LIBRARY_GET_ALL", "payload": null }
```

**Response `data`**:
```jsonc
{
  "entries": [
    {
      "bookId": "sha256-abc123",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "hasCover": true,
      "progressPercent": 22.4,
      "isFinished": false,
      "lastReadAt": 1753977700000
    }
  ]
}
```

---

#### `LIBRARY_OPEN_BOOK`

Open an existing book from the library in the reader tab.

**Request**:
```jsonc
{
  "type": "LIBRARY_OPEN_BOOK",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{ "tabId": 42 }  // ID of the opened or focused reader tab
```

---

#### `LIBRARY_ADD_BOOK`

Called by the popup after the user selects a file via `<input type="file">`. The popup reads the ArrayBuffer and sends it to the background for storage.

**Request**:
```jsonc
{
  "type": "LIBRARY_ADD_BOOK",
  "payload": {
    "fileName": "gatsby.epub",
    "data": "<ArrayBuffer — serialized as base64 string in message>"
  }
}
```

> **Note**: `ArrayBuffer` cannot be sent directly via `sendMessage`. The popup encodes it as a base64 string; the background decodes it back to `ArrayBuffer` before storing in IndexedDB.

**Response `data`**:
```jsonc
{
  "bookId": "sha256-abc123",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isNew": true   // false if book was already in library (same bookId)
}
```

**Error cases**:
- `"FILE_TOO_LARGE"` — file exceeds 50MB limit
- `"UNSUPPORTED_FORMAT"` — file is not a valid EPUB (parse failure)
- `"STORAGE_FULL"` — IndexedDB quota exceeded

---

#### `LIBRARY_REMOVE_BOOK`

Remove a book and all its associated data.

**Request**:
```jsonc
{
  "type": "LIBRARY_REMOVE_BOOK",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**: `null`

---

#### `LIBRARY_GET_COVER`

Retrieve a cover image blob URL for display in the library grid.

**Request**:
```jsonc
{
  "type": "LIBRARY_GET_COVER",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{ "objectUrl": "blob:moz-extension://..." }  // null if no cover
```

---

### Reading Session (Reader Tab → Background)

#### `SESSION_SAVE`

Save the current reading position. Called on every page turn (debounced 500ms).

**Request**:
```jsonc
{
  "type": "SESSION_SAVE",
  "payload": {
    "bookId": "sha256-abc123",
    "currentCfi": "epubcfi(/6/4!/4/2/1:0)",
    "progressPercent": 22.4,
    "currentSpineIndex": 3
  }
}
```

**Response `data`**: `null`

---

#### `SESSION_GET`

Retrieve the saved session for a book when the reader tab initializes.

**Request**:
```jsonc
{
  "type": "SESSION_GET",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{
  "currentCfi": "epubcfi(/6/4!/4/2/1:0)",  // null if no session saved
  "progressPercent": 22.4,
  "currentSpineIndex": 3
}
```

---

#### `BOOK_GET_DATA`

Retrieve the raw EPUB bytes from IndexedDB for rendering. Called by the reader tab on init.

**Request**:
```jsonc
{
  "type": "BOOK_GET_DATA",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{
  "data": "<base64-encoded ArrayBuffer>",  // null if not found
  "sizeBytes": 524288
}
```

---

### Bookmarks (Reader Tab ↔ Background)

#### `BOOKMARK_ADD`

**Request**:
```jsonc
{
  "type": "BOOKMARK_ADD",
  "payload": {
    "bookId": "sha256-abc123",
    "cfi": "epubcfi(/6/4!/4/2/1:0)",
    "spineIndex": 3,
    "chapterTitle": "Chapter 3",
    "label": "Key scene",
    "excerpt": "It was the best of times..."
  }
}
```

**Response `data`**:
```jsonc
{ "bookmarkId": "bm-uuid-v4" }
```

---

#### `BOOKMARK_REMOVE`

**Request**:
```jsonc
{
  "type": "BOOKMARK_REMOVE",
  "payload": { "bookId": "sha256-abc123", "bookmarkId": "bm-uuid-v4" }
}
```

**Response `data`**: `null`

---

#### `BOOKMARK_GET_ALL`

**Request**:
```jsonc
{
  "type": "BOOKMARK_GET_ALL",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{
  "bookmarks": [ /* Bookmark[] — see data-model.md */ ]
}
```

---

#### `BOOKMARK_CHECK`

Check if the current page has a bookmark (for toggling the bookmark icon state).

**Request**:
```jsonc
{
  "type": "BOOKMARK_CHECK",
  "payload": { "bookId": "sha256-abc123", "cfi": "epubcfi(/6/4!/4/2/1:0)" }
}
```

**Response `data`**:
```jsonc
{ "exists": true, "bookmarkId": "bm-uuid-v4" }
```

---

### Annotations (Reader Tab ↔ Background)

#### `ANNOTATION_ADD`

**Request**:
```jsonc
{
  "type": "ANNOTATION_ADD",
  "payload": {
    "bookId": "sha256-abc123",
    "cfiRange": "epubcfi(/6/4!/4/2/1:5,/4/2/1:50)",
    "highlightedText": "To be or not to be",
    "color": "yellow",
    "note": null,
    "spineIndex": 3,
    "chapterTitle": "Act III, Scene I"
  }
}
```

**Response `data`**:
```jsonc
{ "annotationId": "an-uuid-v4" }
```

---

#### `ANNOTATION_UPDATE`

Update the note or color of an existing annotation.

**Request**:
```jsonc
{
  "type": "ANNOTATION_UPDATE",
  "payload": {
    "bookId": "sha256-abc123",
    "annotationId": "an-uuid-v4",
    "note": "Updated note text",
    "color": "green"
  }
}
```

**Response `data`**: `null`

---

#### `ANNOTATION_REMOVE`

**Request**:
```jsonc
{
  "type": "ANNOTATION_REMOVE",
  "payload": { "bookId": "sha256-abc123", "annotationId": "an-uuid-v4" }
}
```

**Response `data`**: `null`

---

#### `ANNOTATION_GET_ALL`

**Request**:
```jsonc
{
  "type": "ANNOTATION_GET_ALL",
  "payload": { "bookId": "sha256-abc123" }
}
```

**Response `data`**:
```jsonc
{
  "annotations": [ /* Annotation[] — see data-model.md */ ]
}
```

---

### Preferences (Reader/Popup ↔ Background)

#### `PREFERENCES_GET`

**Request**:
```jsonc
{ "type": "PREFERENCES_GET", "payload": null }
```

**Response `data`**:
```jsonc
{
  "theme": "light",
  "fontFamily": "Georgia",
  "fontSize": 100,
  "lineHeight": 1.6,
  "marginPercent": 8,
  "flow": "paginated"
}
```

---

#### `PREFERENCES_UPDATE`

Partial update — only specified fields are changed.

**Request**:
```jsonc
{
  "type": "PREFERENCES_UPDATE",
  "payload": {
    "theme": "dark",
    "fontSize": 120
  }
}
```

**Response `data`**: `null`

---

## Message Type Constants (for `shared/constants.js`)

```javascript
const MessageType = {
  LIBRARY_GET_ALL:     'LIBRARY_GET_ALL',
  LIBRARY_OPEN_BOOK:   'LIBRARY_OPEN_BOOK',
  LIBRARY_ADD_BOOK:    'LIBRARY_ADD_BOOK',
  LIBRARY_REMOVE_BOOK: 'LIBRARY_REMOVE_BOOK',
  LIBRARY_GET_COVER:   'LIBRARY_GET_COVER',

  SESSION_SAVE:        'SESSION_SAVE',
  SESSION_GET:         'SESSION_GET',

  BOOK_GET_DATA:       'BOOK_GET_DATA',

  BOOKMARK_ADD:        'BOOKMARK_ADD',
  BOOKMARK_REMOVE:     'BOOKMARK_REMOVE',
  BOOKMARK_GET_ALL:    'BOOKMARK_GET_ALL',
  BOOKMARK_CHECK:      'BOOKMARK_CHECK',

  ANNOTATION_ADD:      'ANNOTATION_ADD',
  ANNOTATION_UPDATE:   'ANNOTATION_UPDATE',
  ANNOTATION_REMOVE:   'ANNOTATION_REMOVE',
  ANNOTATION_GET_ALL:  'ANNOTATION_GET_ALL',

  PREFERENCES_GET:     'PREFERENCES_GET',
  PREFERENCES_UPDATE:  'PREFERENCES_UPDATE',
};
```

---

## Error Codes

| Code | Description |
|---|---|
| `FILE_TOO_LARGE` | Selected EPUB exceeds 50MB limit |
| `UNSUPPORTED_FORMAT` | File is not a valid EPUB archive |
| `PARSE_ERROR` | EPUB content could not be parsed (corrupted) |
| `STORAGE_FULL` | IndexedDB write failed due to quota |
| `BOOK_NOT_FOUND` | Requested bookId not found in IndexedDB |
| `ANNOTATION_NOT_FOUND` | Requested annotationId not found |
| `BOOKMARK_NOT_FOUND` | Requested bookmarkId not found |
| `INVALID_CFI` | Provided CFI string is not valid |
