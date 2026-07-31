# Quickstart: Firefox Ebook Reader Extension

**Branch**: `001-firefox-ebook-reader` | **Date**: 2026-07-31  
**Phase**: 1 — Design

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Firefox | 109+ | Target runtime for the extension |
| Node.js | 18+ | Toolchain (web-ext, Jest) |
| npm | 9+ | Package manager |
| git | any | Version control |

---

## Project Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ebook-reader-extension
npm install
```

### 2. Project dependency overview (`package.json`)

```json
{
  "name": "ebook-reader-firefox-extension",
  "version": "0.1.0",
  "scripts": {
    "dev":   "web-ext run --source-dir . --firefox-profile dev-profile",
    "lint":  "web-ext lint --source-dir .",
    "build": "web-ext build --source-dir . --artifacts-dir dist/",
    "test":  "jest"
  },
  "devDependencies": {
    "web-ext": "^8.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

### 3. Acquire epub.js

epub.js is vendored locally (no CDN) to ensure offline operation and version stability:

```bash
# Download the epub.js v0.3 standalone bundle
curl -L https://cdn.jsdelivr.net/npm/epubjs@0.3/dist/epub.min.js -o vendor/epub.min.js
```

> If the file already exists in `vendor/`, skip this step.

---

## Running the Extension in Firefox (Development)

### Option A — Automatic reload with web-ext

```bash
npm run dev
```

This command:
1. Opens a new Firefox instance with the extension loaded
2. Watches for file changes and reloads the extension automatically
3. Opens the browser console in devtools for the background script

### Option B — Manual load in Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"** in the left sidebar
3. Click **"Load Temporary Add-on..."**
4. Select `manifest.json` from the project root
5. The extension icon will appear in the toolbar

> **Note**: Temporary add-ons are removed when Firefox closes. Use `npm run dev` for iterative development.

---

## Running Tests

```bash
npm test
```

Runs all unit tests in `tests/unit/` with Jest + jsdom.

To run a specific test file:
```bash
npx jest tests/unit/storage.test.js
```

To run tests in watch mode:
```bash
npx jest --watch
```

---

## Linting the Extension

```bash
npm run lint
```

Validates `manifest.json`, checks for deprecated APIs, and scans for common extension issues using `web-ext lint`.

---

## Building a Distributable Package

```bash
npm run build
```

Outputs a signed `.zip` package to `dist/`. This `.zip` can be:
- Submitted to [addons.mozilla.org](https://addons.mozilla.org) for review
- Sideloaded in Firefox via `about:addons` → "Install Add-on From File"

---

## Key Files Quick Reference

| File | Description |
|---|---|
| `manifest.json` | Extension manifest (MV2); declares permissions, background, popup, icons |
| `background/background.js` | Message router; handles all `browser.runtime.onMessage` events; coordinates storage services |
| `popup/popup.html` | Library UI (book grid, "Open File" button, reading progress) |
| `popup/popup.js` | Sends `LIBRARY_GET_ALL`, `LIBRARY_ADD_BOOK`, `LIBRARY_OPEN_BOOK` messages |
| `reader/reader.html` | Full-tab reading environment |
| `reader/reader.js` | Initializes epub.js rendition; handles pagination, themes, TOC, search, annotation replay |
| `shared/storage.js` | IndexedDB wrapper (`openDB`, `saveBook`, `getBook`, `deleteBook`, `getCover`, `saveCover`) |
| `shared/epub-service.js` | epub.js facade: `loadBook(arrayBuffer)`, `search(query)`, `getCfi()`, `goToCfi(cfi)` |
| `shared/library-service.js` | `browser.storage.local` CRUD for library entries and reading sessions |
| `shared/annotation-service.js` | `browser.storage.local` CRUD for bookmarks and annotations |
| `shared/constants.js` | `MessageType` enum, default preferences, highlight color options |
| `vendor/epub.min.js` | Vendored epub.js v0.3 bundle |

---

## Extension Permissions (manifest.json)

```json
{
  "permissions": [
    "storage",
    "unlimitedStorage",
    "tabs"
  ]
}
```

| Permission | Why needed |
|---|---|
| `storage` | Access to `browser.storage.local` for metadata and preferences |
| `unlimitedStorage` | Removes the default 5MB quota from `browser.storage.local`; also affects IndexedDB quota |
| `tabs` | `browser.tabs.create()` to open the reader in a new tab |

> No `<all_urls>` or `host_permissions` are needed — the extension only accesses local files via `<input type="file">` and makes no network requests.

---

## Common Development Workflows

### Adding a new message type

1. Add the constant to `shared/constants.js` → `MessageType`
2. Add a handler in `background/background.js` → `browser.runtime.onMessage` switch
3. Call `browser.runtime.sendMessage({ type: MessageType.NEW_TYPE, payload: {...} })` from popup or reader
4. Add a unit test in `tests/unit/`

### Changing the data model

1. Update `data-model.md` (spec artifact)
2. Update the relevant service in `shared/`
3. If IndexedDB schema changes, increment `DB_VERSION` in `shared/storage.js` and add an `onupgradeneeded` migration handler
4. Update affected unit tests

### Debugging the background script

- In Firefox: `about:debugging` → click **"Inspect"** next to the extension → opens a dedicated devtools for the background page
- `console.log` in `background.js` appears in this dedicated console

### Debugging the reader tab

- Open the reader tab normally, then press `F12` — standard Firefox devtools apply
- epub.js logs can be enabled via `window.EPUBJS_VERSION` and epub.js debug flags

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Extension icon missing after load | Manifest error | Run `npm run lint` and check console in `about:debugging` |
| Book fails to open | ArrayBuffer base64 encoding mismatch | Check `LIBRARY_ADD_BOOK` handler — ensure `atob`/`btoa` decode is symmetric |
| Reading position not restored | `SESSION_GET` returns null | Verify `SESSION_SAVE` is being called; check `browser.storage.local` in storage inspector |
| Highlights not re-applied on reload | CFI range stored incorrectly | Log `annotation.cfiRange` and test with `rendition.annotations.add()` directly in reader devtools |
| epub.js `undefined` error | vendor bundle not loaded | Confirm `vendor/epub.min.js` is listed in `reader.html` before `reader.js` |
