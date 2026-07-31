# Keyboard Shortcuts Contract

**Feature**: 002-keyboard-appearance-enhancements  
**Contract Type**: User Interface Behavior  
**Date**: August 1, 2026  
**Status**: Stable

## Purpose

This contract defines the keyboard shortcut behavior that users can rely on when interacting with the ebook reader. All shortcuts must work consistently across Firefox versions 109+ and across platforms (Windows, Linux, macOS).

## Shortcut Registry

### Navigation Shortcuts (Context: Non-Input Only)

These shortcuts are **disabled** when text input fields (INPUT, TEXTAREA, SELECT) have focus.

| Shortcut | Action | Expected Behavior |
|----------|--------|-------------------|
| `→` (Right Arrow) | Next Page | Advances to the next page in the book. Visual page transition occurs. |
| `←` (Left Arrow) | Previous Page | Goes back to the previous page in the book. Visual page transition occurs. |
| `Space` | Next Page | Same as Right Arrow. Advances to next page. |
| `Shift + Space` | Previous Page | Same as Left Arrow. Goes back to previous page. |

**Behavior Contract**:
- Page transitions must complete within 500ms (epub.js default)
- Current reading position is saved after transition (debounced 500ms)
- If at first/last page, no action occurs (no error, no wrap-around)

---

### Feature Access Shortcuts (Context: Global)

These shortcuts work **in all contexts**, including when text inputs have focus.

| Shortcut | Action | Expected Behavior |
|----------|--------|-------------------|
| `Ctrl+B` (Win/Linux)<br>`Cmd+B` (Mac) | Toggle Bookmark | If bookmark exists at current location, removes it. Otherwise, adds bookmark. Bookmark panel may open for label input. Visual feedback via button state change. |
| `Ctrl+F` (Win/Linux)<br>`Cmd+F` (Mac) | Open Search | Opens search bar at top of reader. Search input receives focus. If already open, focuses the input. |
| `Ctrl+T` (Win/Linux)<br>`Cmd+T` (Mac) | Toggle TOC | Opens Table of Contents panel if closed. Closes it if open. Button visual state updates. |
| `Ctrl+A` (Win/Linux)<br>`Cmd+A` (Mac) | Toggle Annotations | Opens Annotations panel if closed. Closes it if open. Button visual state updates. **Note**: Overrides browser's "Select All" behavior. |

**Behavior Contract**:
- All shortcuts must call `e.preventDefault()` to prevent browser default behavior
- Visual feedback (panel opening, button state) must occur within 100ms
- Shortcuts work regardless of which panel is currently open
- Opening a panel closes any other open panel (only one panel open at a time)

---

### Appearance Shortcuts (Context: Global)

These shortcuts work **in all contexts** and provide immediate visual feedback.

| Shortcut | Action | Expected Behavior |
|----------|--------|-------------------|
| `Ctrl+D` (Win/Linux)<br>`Cmd+D` (Mac) | Cycle Theme | Cycles through themes in order: Light → Dark → Sepia → Light. Theme applies immediately to both book content and chrome (toolbar, panels). Preference is persisted. |
| `Ctrl++` or `Ctrl+=` (Win/Linux)<br>`Cmd++` or `Cmd+=` (Mac) | Increase Font Size | Increases font size by 10%. Clamped at 200% maximum. Display updates to show new percentage. Change applies immediately. |
| `Ctrl+-` (Win/Linux)<br>`Cmd+-` (Mac) | Decrease Font Size | Decreases font size by 10%. Clamped at 50% minimum. Display updates to show new percentage. Change applies immediately. |

**Behavior Contract**:
- Theme changes must complete within 200ms (SC-003 requirement)
- Font size changes must be visible within 200ms
- Font size display must update synchronously with the change
- All appearance changes must persist to `browser.storage.local`
- Changes apply globally (affect all books, not just current book)

---

### Utility Shortcuts (Context: Global)

| Shortcut | Action | Expected Behavior |
|----------|--------|-------------------|
| `?` | Toggle Shortcuts Help | Opens keyboard shortcuts overlay modal if closed. Closes it if open. Modal displays all shortcuts in organized table format. |
| `Escape` | Dismiss UI | Closes any open panel, search bar, or modal overlay. Priority order: search bar → shortcuts overlay → side panels. Returns focus to reading area. |

**Behavior Contract**:
- `?` key must work even when shortcuts overlay is already open (toggles closed)
- `Escape` must close only the topmost UI element (not all at once)
- After dismissal, focus should return to reading area (not remain on closed element)
- Clicking outside modal overlays should also dismiss them (same as Escape)

---

## Context-Aware Behavior

### Typing Detection

**Rule**: Navigation shortcuts (arrows, spacebar) are disabled when the user is typing in an input field.

**Implementation Contract**:
```javascript
const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
```

**Behavior**:
- If `isTyping === true` and shortcut is navigation (non-input context):
  - Shortcut is **not handled**
  - Browser default behavior occurs (cursor moves, space is entered)
- If `isTyping === true` and shortcut is global (Ctrl+B, Ctrl+F, etc.):
  - Shortcut **is handled** normally
  - Allows users to bookmark, search, etc. while typing

**Edge Cases**:
- `contenteditable` elements: Not used in this extension; no special handling needed
- Focus on buttons/links: Shortcuts still work (not considered "typing")
- Focus on reading iframe: Shortcuts work normally

---

## Platform Compatibility

### Modifier Key Handling

**Contract**: All `Ctrl` shortcuts must also work with `Cmd` on macOS.

**Implementation**:
```javascript
if (e.ctrlKey || e.metaKey) {
  // Handle shortcut
}
```

**Guarantees**:
- Windows/Linux: `Ctrl+B` works, `Cmd+B` does nothing (no Cmd key)
- macOS: `Cmd+B` works, `Ctrl+B` does nothing (Ctrl has different meaning on Mac)
- Both modifiers checked in OR condition for maximum compatibility

### Key Code Handling

**Contract**: Use `e.key` property (not deprecated `e.keyCode`).

**Supported Values**:
- Letter keys: `'a'`, `'b'`, `'f'`, `'t'`, `'d'` (case-insensitive)
- Special keys: `'ArrowRight'`, `'ArrowLeft'`, `'Escape'`, `' '` (space), `'?'`
- Symbols: `'+'`, `'='`, `'-'`

**Case Handling**:
- Letter shortcuts must handle both uppercase and lowercase: `e.key === 'b' || e.key === 'B'`
- Special keys are case-insensitive by nature

---

## Performance Guarantees

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Shortcut Response Time | < 1 second | Time from keydown to action completion |
| Theme Change Visual Feedback | < 200ms | Time from Ctrl+D to visible theme change |
| Font Size Change Visual Feedback | < 200ms | Time from Ctrl+/- to visible size change |
| Panel Open/Close | < 100ms | Time from shortcut to panel visibility change |
| Preference Persistence | < 500ms | Time from change to storage write (async, non-blocking) |

**Measurement Method**: Manual testing with Firefox DevTools Performance profiler.

---

## Error Handling

### Invalid State Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Press Ctrl+B when no book is loaded | No action. Shortcut is ignored. |
| Press arrow key at first/last page | No action. No error message. Silent no-op. |
| Press Ctrl+D rapidly (theme cycling) | Each press cycles theme. No race conditions. Last press wins. |
| Press Ctrl++ at 200% font size | No change. Size remains at 200%. No error message. |
| Press Ctrl+- at 50% font size | No change. Size remains at 50%. No error message. |
| Storage write fails | User sees change immediately (optimistic UI). Background error logged to console. No user-visible error. |

### Browser Compatibility

**Minimum Version**: Firefox 109+

**Unsupported Browsers**: This is a Firefox-only extension. Chrome/Edge/Safari are not supported.

**Fallback Behavior**: None. Extension requires Firefox 109+ as specified in manifest.json.

---

## Testing Contract

### Unit Test Coverage

Required test cases for keyboard shortcut logic:

1. **Context detection**: Verify `isTyping` correctly identifies INPUT/TEXTAREA/SELECT focus
2. **Modifier detection**: Verify both `ctrlKey` and `metaKey` are checked
3. **Key matching**: Verify case-insensitive letter key matching
4. **preventDefault**: Verify all handled shortcuts call `preventDefault()`
5. **Font size clamping**: Verify 50-200% bounds enforcement
6. **Theme cycling**: Verify light → dark → sepia → light order

### Integration Test Checklist

Manual testing required for each user story:

- [ ] Open book, press all navigation shortcuts, verify page turns
- [ ] Open book, press Ctrl+B, verify bookmark added/removed
- [ ] Open book, press Ctrl+F, verify search bar opens and receives focus
- [ ] Open book, press Ctrl+T, verify TOC panel toggles
- [ ] Open book, press Ctrl+A, verify annotations panel toggles
- [ ] Open book, press Ctrl+D three times, verify theme cycles through all three
- [ ] Open book, press Ctrl++ five times, verify font size increases to 150%
- [ ] Open book, press Ctrl+- five times, verify font size decreases to 50%
- [ ] Open book, press ?, verify shortcuts overlay appears
- [ ] With panel open, press Escape, verify panel closes
- [ ] Focus search input, press spacebar, verify space is entered (not page turn)
- [ ] Focus search input, press Ctrl+B, verify bookmark toggle works
- [ ] Close and reopen book, verify theme and font size persist

---

## Versioning & Stability

**Contract Version**: 1.0.0  
**Stability**: Stable (breaking changes require major version bump)

**Breaking Changes** (would require v2.0.0):
- Changing shortcut key assignments
- Removing shortcuts
- Changing context-aware behavior rules

**Non-Breaking Changes** (minor/patch):
- Adding new shortcuts
- Improving performance
- Bug fixes in existing shortcut handling

---

## Summary

This contract guarantees:
1. **15 keyboard shortcuts** covering navigation, features, appearance, and utilities
2. **Context-aware behavior** that respects text input focus
3. **Cross-platform compatibility** (Windows, Linux, macOS)
4. **Performance requirements** (<200ms visual feedback, <1s response)
5. **Consistent error handling** (silent no-ops, no user-visible errors)
6. **Persistence** of all appearance preferences across sessions

Users can rely on these shortcuts working consistently across all Firefox 109+ installations.
