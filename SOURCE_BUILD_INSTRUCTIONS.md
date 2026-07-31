# Source Code Build Instructions

## Overview
This extension uses two third-party npm packages for EPUB processing:
- `jszip@3.x` → compiled to `vendor/jszip.min.js`
- `epubjs@0.3.93` → compiled to `vendor/epub.min.js`

All other source files are unminified and included in the extension package.

## Build Steps

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Vendor files are automatically copied:**
   The `postinstall` script in `package.json` automatically copies the minified vendor files:
   - `node_modules/jszip/dist/jszip.min.js` → `vendor/jszip.min.js`
   - `node_modules/epubjs/dist/epub.min.js` → `vendor/epub.min.js`

3. **Build the extension (optional):**
   ```bash
   npm run build
   ```
   This creates a packaged `.zip` file in the `dist/` directory using `web-ext`.

4. **Lint the extension (optional):**
   ```bash
   npm run lint
   ```

## Verification

To verify the vendor files match the npm packages:

1. After running `npm install`, compare:
   - `vendor/jszip.min.js` with `node_modules/jszip/dist/jszip.min.js`
   - `vendor/epub.min.js` with `node_modules/epubjs/dist/epub.min.js`

2. Both files should be byte-identical to their npm package sources.

## Source File Structure

```
ebook-reader-extension/
├── background/          # Background script (unminified)
├── icons/              # SVG icons
├── popup/              # Library popup UI (unminified)
├── reader/             # EPUB reader UI (unminified)
├── shared/             # Shared utilities (unminified)
├── tests/              # Unit tests
├── vendor/             # Third-party minified libraries (from npm)
├── manifest.json       # Extension manifest
├── package.json        # npm dependencies and build scripts
└── package-lock.json   # Locked dependency versions
```

## Third-Party Libraries

### jszip (MIT License)
- **Version:** 3.x (see package.json for exact version)
- **Purpose:** EPUB files are ZIP archives; jszip extracts their contents
- **Source:** https://github.com/Stuk/jszip
- **npm:** https://www.npmjs.com/package/jszip

### epubjs (FreeBSD License)
- **Version:** 0.3.93
- **Purpose:** Parses and renders EPUB content
- **Source:** https://github.com/futurepress/epub.js
- **npm:** https://www.npmjs.com/package/epubjs

Both libraries are used as-is without modification.

## Notes for Reviewers

- The `eval` and `Function` constructor warnings in the linter are from the minified vendor files (jszip and epubjs). These are standard npm packages used by thousands of extensions.
- All application code (background/, popup/, reader/, shared/) is unminified and readable.
- The extension does not collect or transmit any user data. All book data is stored locally in IndexedDB.
