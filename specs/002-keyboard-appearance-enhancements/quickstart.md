# Quickstart: Keyboard Shortcut Integration & Appearance Functionality

**Feature**: 002-keyboard-appearance-enhancements  
**Branch**: `002-keyboard-appearance-enhancements`  
**Date**: August 1, 2026

## Overview

This guide helps developers quickly understand, implement, test, and validate the keyboard shortcut and appearance functionality enhancements for the ebook reader extension.

## Prerequisites

- Firefox 109+ installed
- Node.js and npm installed (for running tests)
- Extension loaded in Firefox via `about:debugging`
- At least one EPUB file added to library for testing

## Quick Start (5 minutes)

### 1. Load the Extension

```bash
cd c:\practice\ebook-reader-extension
npm install
npm run dev
```

This opens Firefox with the extension loaded.

### 2. Open a Book

1. Click the extension icon in Firefox toolbar
2. Click "Add Book" and select an EPUB file
3. Click the book cover to open the reader

### 3. Test Keyboard Shortcuts

**Navigation** (try these first):
- Press `→` or `Space` to go to next page
- Press `←` or `Shift+Space` to go to previous page

**Features**:
- Press `Ctrl+B` to bookmark current page
- Press `Ctrl+F` to open search
- Press `Ctrl+T` to open table of contents
- Press `Ctrl+A` to open annotations panel

**Appearance**:
- Press `Ctrl+D` to cycle through themes (light/dark/sepia)
- Press `Ctrl++` to increase font size
- Press `Ctrl+-` to decrease font size

**Help**:
- Press `?` to see all shortcuts
- Press `Escape` to close any panel or overlay

### 4. Verify Persistence

1. Change theme to dark (`Ctrl+D`)
2. Increase font size (`Ctrl++` twice)
3. Close the book tab
4. Reopen the same book
5. Verify theme is still dark and font size is larger

✅ If all shortcuts work and preferences persist, the feature is working correctly.

---

## Development Workflow

### File Locations

**Primary Implementation**:
- `reader/reader.js` - Lines 649-701 (keyboard event handler)
- `reader/reader.js` - Lines 480-550 (appearance controls)
- `reader/reader.html` - Lines 140-159 (shortcuts overlay)
- `reader/reader.css` - Lines 453-496 (shortcuts overlay styling)

**Supporting Files**:
- `shared/constants.js` - THEMES, FONT_OPTIONS, DEFAULT_PREFERENCES
- `shared/storage.js` - browser.storage.local wrapper
- `background/background.js` - Message handlers for preference updates

**Tests**:
- `tests/unit/reader-keyboard.test.js` - NEW: Keyboard shortcut unit tests

### Making Changes

1. **Modify keyboard handler** in `reader/reader.js`:
   ```javascript
   document.addEventListener('keydown', e => {
     // Your changes here
   });
   ```

2. **Test in browser**:
   - Save file
   - Reload extension in `about:debugging`
   - Reopen book and test shortcuts

3. **Run unit tests**:
   ```bash
   npm test
   ```

4. **Lint code**:
   ```bash
   npm run lint
   ```

### Common Tasks

#### Add a New Keyboard Shortcut

1. Add case to keyboard event handler in `reader.js`:
   ```javascript
   if (e.ctrlKey || e.metaKey) {
     switch (e.key) {
       case 'n': case 'N':  // New shortcut: Ctrl+N
         e.preventDefault();
         // Your action here
         break;
     }
   }
   ```

2. Update shortcuts overlay in `reader.html`:
   ```html
   <tr><td>Your action</td><td><kbd>Ctrl+N</kbd></td></tr>
   ```

3. Add test case in `tests/unit/reader-keyboard.test.js`

#### Modify Appearance Control

1. Find the control in `reader.js` (lines 480-550)
2. Modify the event listener or update logic
3. Ensure preference is persisted via `msg(MessageType.PREFERENCES_UPDATE, {...})`
4. Test in browser and verify persistence

#### Debug Keyboard Shortcuts

1. Open Firefox DevTools (F12)
2. Go to Console tab
3. Add debug logging:
   ```javascript
   document.addEventListener('keydown', e => {
     console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
     // Rest of handler
   });
   ```
4. Press shortcuts and observe console output

---

## Testing Checklist

### Unit Tests (Automated)

Run: `npm test`

Expected coverage:
- [ ] Context detection (isTyping logic)
- [ ] Modifier key detection (ctrlKey || metaKey)
- [ ] Font size clamping (50-200%)
- [ ] Theme cycling order (light → dark → sepia → light)
- [ ] Key matching (case-insensitive)

### Integration Tests (Manual)

#### User Story 1: Universal Keyboard Navigation (P1)

- [ ] **AS-1.1**: Press `→`, verify next page loads
- [ ] **AS-1.2**: Press `←`, verify previous page loads
- [ ] **AS-1.3**: Press `Ctrl+B`, verify bookmark added (icon changes)
- [ ] **AS-1.4**: Press `Ctrl+F`, verify search bar opens and receives focus
- [ ] **AS-1.5**: Press `Ctrl+T`, verify TOC panel opens
- [ ] **AS-1.6**: Press `Ctrl+A`, verify annotations panel opens
- [ ] **AS-1.7**: With search open, press `Escape`, verify search closes
- [ ] **AS-1.8**: With panel open, press `Escape`, verify panel closes

#### User Story 2: Appearance Customization via Keyboard (P1)

- [ ] **AS-2.1**: With light theme, press `Ctrl+D`, verify dark theme applies
- [ ] **AS-2.2**: With dark theme, press `Ctrl+D`, verify sepia theme applies
- [ ] **AS-2.3**: With sepia theme, press `Ctrl+D`, verify light theme applies
- [ ] **AS-2.4**: Press `Ctrl++`, verify font size increases and display updates
- [ ] **AS-2.5**: Press `Ctrl+-`, verify font size decreases and display updates
- [ ] **AS-2.6**: Change theme and font size, close book, reopen, verify persistence

#### User Story 3: Keyboard Shortcut Discovery (P2)

- [ ] **AS-3.1**: Press `?`, verify shortcuts overlay appears
- [ ] **AS-3.2**: With overlay open, press `?`, verify overlay closes
- [ ] **AS-3.3**: Open overlay, press `Escape`, verify overlay closes
- [ ] **AS-3.4**: Open overlay, click outside modal, verify overlay closes
- [ ] **AS-3.5**: Review overlay content, verify all shortcuts documented

#### User Story 4: Robust Appearance Panel Functionality (P2)

- [ ] **AS-4.1**: Click theme button, verify theme changes and button shows active
- [ ] **AS-4.2**: Select font from dropdown, verify font applies immediately
- [ ] **AS-4.3**: Click A+ button, verify font size increases and display updates
- [ ] **AS-4.4**: Click A- button, verify font size decreases and display updates
- [ ] **AS-4.5**: Drag line height slider, verify spacing changes in real-time
- [ ] **AS-4.6**: Drag margin slider, verify margins change in real-time
- [ ] **AS-4.7**: Customize all settings, close book, reopen, verify all persist

#### User Story 5: Context-Aware Keyboard Behavior (P3)

- [ ] **AS-5.1**: Focus search input, type text with spaces, verify no page turn
- [ ] **AS-5.2**: Focus search input, press arrow keys, verify cursor moves (no page turn)
- [ ] **AS-5.3**: Focus bookmark label input, press space, verify space entered
- [ ] **AS-5.4**: Focus annotation note, press arrows, verify cursor moves
- [ ] **AS-5.5**: Close input, press space/arrows, verify shortcuts work again

### Performance Validation

Use Firefox DevTools Performance profiler:

- [ ] **SC-003**: Theme change completes in <200ms
- [ ] **SC-002**: Shortcut response time <1 second
- [ ] **SC-009**: UI feedback appears in <100ms

### Edge Cases

- [ ] Press `Ctrl+D` rapidly 10 times, verify no errors and theme cycles correctly
- [ ] Press `Ctrl++` until 200%, verify size stops at 200%
- [ ] Press `Ctrl+-` until 50%, verify size stops at 50%
- [ ] Press arrow key at last page, verify no error (silent no-op)
- [ ] Press arrow key at first page, verify no error (silent no-op)
- [ ] With shortcuts overlay open, press `Ctrl+B`, verify bookmark still works

---

## Validation Criteria

### Success Criteria from Spec

- [ ] **SC-001**: Can navigate entire book using only keyboard
- [ ] **SC-002**: All features accessible via shortcuts in <1s
- [ ] **SC-003**: Appearance changes apply in <200ms
- [ ] **SC-004**: 100% preference persistence across sessions
- [ ] **SC-005**: Can discover shortcuts in <5s (press `?`)
- [ ] **SC-006**: Zero shortcut conflicts during text input
- [ ] **SC-007**: Font size stays within 50-200% bounds
- [ ] **SC-008**: Theme cycle completes in <3s
- [ ] **SC-009**: UI controls provide feedback in <100ms
- [ ] **SC-010**: Users can customize reading appearance as needed

### Constitution Compliance

- [ ] **Privacy**: No network requests made (check Network tab in DevTools)
- [ ] **Offline**: All shortcuts work with network disabled
- [ ] **Data Ownership**: Preferences visible in `browser.storage.local` (inspect in DevTools)
- [ ] **Reading Experience**: Theme changes in <200ms, shortcuts don't interrupt reading
- [ ] **Simplicity**: No new dependencies added, extends existing code

---

## Troubleshooting

### Shortcuts Not Working

**Problem**: Pressing shortcuts does nothing

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify `reader.js` loaded correctly (check Sources tab in DevTools)
3. Ensure no other extension is intercepting shortcuts
4. Try in a fresh Firefox profile

### Preferences Not Persisting

**Problem**: Theme/font size resets after reopening book

**Solutions**:
1. Check browser console for storage errors
2. Verify `background.js` message handler is working
3. Inspect `browser.storage.local` in DevTools → Storage → Extension Storage
4. Check if storage quota is exceeded (unlikely with small preferences)

### Theme Not Applying

**Problem**: Press `Ctrl+D` but theme doesn't change

**Solutions**:
1. Check if epub.js loaded correctly (`window.ePub` should exist)
2. Verify `rendition.themes.select()` is being called (add console.log)
3. Check CSS custom properties are defined in `reader.css`
4. Ensure book has finished loading before changing theme

### Context-Aware Behavior Not Working

**Problem**: Shortcuts trigger while typing in input fields

**Solutions**:
1. Verify `document.activeElement.tagName` check is present
2. Add console.log to see what element has focus
3. Ensure input fields have proper `tagName` (INPUT, TEXTAREA, SELECT)
4. Check if `typing` variable is correctly evaluated

---

## Performance Optimization Tips

### Debouncing Preference Saves

Current implementation saves preferences immediately. If performance issues occur:

```javascript
let saveTimer = null;
function debouncedSave(prefs) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    msg(MessageType.PREFERENCES_UPDATE, prefs);
  }, 300);
}
```

### Throttling Theme Changes

If rapid `Ctrl+D` presses cause issues:

```javascript
let themeChangeInProgress = false;
function cycleTheme() {
  if (themeChangeInProgress) return;
  themeChangeInProgress = true;
  // ... theme change logic
  setTimeout(() => themeChangeInProgress = false, 200);
}
```

---

## Next Steps

After completing this feature:

1. **Run `/speckit.tasks`** to generate task breakdown
2. **Implement tasks** in priority order (P1 → P2 → P3)
3. **Test each user story** independently before moving to next
4. **Update shortcuts overlay** in `reader.html` with any new shortcuts
5. **Document any deviations** from spec in implementation notes

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contracts**: [contracts/keyboard-shortcuts.md](./contracts/keyboard-shortcuts.md)

- **MDN KeyboardEvent**: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
- **epub.js Themes**: https://github.com/futurepress/epub.js/wiki/Themes
- **browser.storage API**: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage

---

## Support

For questions or issues:
1. Check browser console for errors
2. Review existing keyboard handler code in `reader.js` lines 649-701
3. Refer to constitution principles in `.specify/memory/constitution.md`
4. Test in a clean Firefox profile to rule out conflicts

**Estimated Time to Implement**: 4-6 hours for P1 stories, 2-3 hours for P2/P3 stories
