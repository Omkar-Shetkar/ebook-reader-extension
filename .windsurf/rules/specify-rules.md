# ebook-reader-extension Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-08-01

## Active Technologies
- JavaScript ES2022 (vanilla, no transpilation) + epub.js 0.3.93 (vendored), jszip (vendored) (002-keyboard-appearance-enhancements)
- browser.storage.local (preferences), IndexedDB (not used for this feature) (002-keyboard-appearance-enhancements)

- JavaScript (ES2022), HTML5, CSS3 — no transpilation required for Firefox + epub.js v0.3 (EPUB parsing and rendering), JSZip v3 (bundled within epub.js), web-ext v8 (dev/packaging toolchain) (001-firefox-ebook-reader)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

JavaScript (ES2022), HTML5, CSS3 — no transpilation required for Firefox: Follow standard conventions

## Recent Changes
- 002-keyboard-appearance-enhancements: Added JavaScript ES2022 (vanilla, no transpilation) + epub.js 0.3.93 (vendored), jszip (vendored)

- 001-firefox-ebook-reader: Added JavaScript (ES2022), HTML5, CSS3 — no transpilation required for Firefox + epub.js v0.3 (EPUB parsing and rendering), JSZip v3 (bundled within epub.js), web-ext v8 (dev/packaging toolchain)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
