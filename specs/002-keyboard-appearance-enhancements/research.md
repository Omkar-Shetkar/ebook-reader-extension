# Research: Keyboard Shortcut Integration & Appearance Functionality

**Feature**: 002-keyboard-appearance-enhancements  
**Date**: August 1, 2026  
**Status**: Complete

## Overview

This document consolidates research findings for implementing comprehensive keyboard shortcut support and robust appearance customization in the ebook reader extension. All technical context was clear from the existing codebase analysis; no external research was required.

## Research Tasks

### 1. Keyboard Event Handling in Browser Extensions

**Decision**: Use native browser KeyboardEvent API with event.preventDefault() for registered shortcuts

**Rationale**:
- Existing implementation in `reader.js` (lines 649-701) already uses this pattern successfully
- Native API has zero dependencies and works offline
- KeyboardEvent provides `key`, `ctrlKey`, `metaKey`, `shiftKey` properties for cross-platform support
- `preventDefault()` prevents browser default behavior (e.g., Ctrl+F opening browser search)

**Alternatives Considered**:
- **Mousetrap.js library**: Rejected because it violates Principle V (Simplicity). Native API is sufficient.
- **Hotkeys.js**: Rejected for same reason. No benefit over native API for this use case.
- **Custom event bus**: Rejected as over-engineering. Direct event listener is simpler.

**Implementation Pattern**:
```javascript
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  
  // Context-aware: disable shortcuts during text input
  if (typing && !e.ctrlKey && !e.metaKey) return;
  
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b': case 'B':
        e.preventDefault();
        // Handle bookmark toggle
        break;
      // ... other shortcuts
    }
  }
});
```

### 2. Cross-Platform Keyboard Modifier Support

**Decision**: Check both `e.ctrlKey` (Windows/Linux) and `e.metaKey` (Mac) for all modifier shortcuts

**Rationale**:
- Firefox KeyboardEvent API provides both properties
- Mac users expect Cmd key, Windows/Linux users expect Ctrl key
- Existing code already uses `e.ctrlKey || e.metaKey` pattern (line 658)
- No platform detection needed; check both modifiers in OR condition

**Alternatives Considered**:
- **Platform detection via navigator.platform**: Rejected as unnecessary. Checking both modifiers is simpler and more robust.
- **Separate keybindings per platform**: Rejected as over-engineering. Single check works for all platforms.

**Implementation Pattern**:
```javascript
if (e.ctrlKey || e.metaKey) {
  // Shortcut handling works on both Windows/Linux (Ctrl) and Mac (Cmd)
}
```

### 3. Appearance Preference Persistence

**Decision**: Use existing `browser.storage.local` via `msg(MessageType.PREFERENCES_UPDATE, {...})` pattern

**Rationale**:
- Already implemented and working in `reader.js` (lines 497, 509, 522, 531, 549)
- Preferences structure already defined in `constants.js` (DEFAULT_PREFERENCES)
- Background script handles storage via message passing (Manifest V2 architecture)
- No new storage mechanism needed

**Alternatives Considered**:
- **Direct browser.storage.local calls from reader.js**: Rejected because existing architecture uses background script for storage operations
- **localStorage**: Rejected because browser.storage.local is more reliable for extensions and already in use
- **IndexedDB**: Rejected as overkill for simple key-value preferences

**Existing Preferences Structure** (from constants.js):
```javascript
DEFAULT_PREFERENCES = {
  theme: 'light',
  fontFamily: 'inherit',
  fontSize: 100,
  lineHeight: 1.5,
  marginPercent: 5
}
```

### 4. Theme Application Performance

**Decision**: Use epub.js `rendition.themes.select()` and CSS custom properties for chrome styling

**Rationale**:
- Existing implementation already uses this pattern (lines 506-507, 537-542)
- epub.js theme switching is optimized and meets <200ms requirement
- CSS custom properties (`--bg`, `--text`, `--toolbar-bg`) enable instant chrome updates
- No additional optimization needed; existing approach meets spec SC-003

**Alternatives Considered**:
- **Full page reload**: Rejected as too slow and disruptive to reading experience
- **Manual DOM manipulation**: Rejected because epub.js theme API is more reliable
- **CSS class switching**: Rejected because custom properties provide finer control

**Implementation Pattern**:
```javascript
function applyTheme(theme) {
  rendition.themes.select(theme);  // Updates book content
  applyThemeToChrome(theme);        // Updates toolbar/panels via CSS custom properties
}
```

### 5. Context-Aware Shortcut Behavior

**Decision**: Check `document.activeElement.tagName` to detect text input focus and conditionally disable navigation shortcuts

**Rationale**:
- Existing implementation already uses this pattern (lines 650-651)
- Simple, reliable, and covers all input types (INPUT, TEXTAREA, SELECT)
- Modifier shortcuts (Ctrl+B, Ctrl+F) should still work during text input for accessibility
- Navigation shortcuts (arrows, spacebar) should be disabled during text input

**Alternatives Considered**:
- **contenteditable detection**: Not needed; extension doesn't use contenteditable
- **Event.target checking**: Rejected because activeElement is more reliable for focus state
- **Whitelist approach**: Rejected in favor of blacklist (simpler for this use case)

**Implementation Pattern**:
```javascript
const tag = document.activeElement.tagName;
const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

if (typing) {
  // Allow modifier shortcuts (Ctrl+F, Ctrl+B) to work
  if (!e.ctrlKey && !e.metaKey) return;
}
```

### 6. Escape Key Behavior for Panel Closing

**Decision**: Add Escape key handler that closes any open panel, search bar, or modal overlay

**Rationale**:
- Standard UX pattern; users expect Escape to dismiss overlays
- Existing close buttons use `closeAllPanels()` function (line 560)
- Shortcuts overlay already has Escape handler (lines 645-647)
- Consistent with FR-011 requirement

**Alternatives Considered**:
- **Per-panel Escape handlers**: Rejected as redundant. Single handler is simpler.
- **Focus trap management**: Not needed; panels are simple overlays without complex focus requirements

**Implementation Pattern**:
```javascript
if (e.key === 'Escape') {
  if (!searchBar.hidden) {
    searchBar.hidden = true;
    // Close search
  } else if (!shortcutsOverlay.hidden) {
    shortcutsOverlay.hidden = true;
  } else {
    closeAllPanels();  // Close any open side panel
  }
}
```

### 7. Font Size Bounds Enforcement

**Decision**: Use `Math.max(50, Math.min(200, newSize))` to clamp font size within 50-200% range

**Rationale**:
- Existing implementation already uses this pattern (line 546)
- Simple, efficient, and meets FR-021 requirement
- Prevents layout breaks from extreme font sizes
- No additional validation needed

**Alternatives Considered**:
- **User warning on bounds**: Rejected as unnecessary. Silent clamping is standard UX.
- **Disable buttons at bounds**: Rejected because keyboard shortcuts need consistent behavior

**Implementation Pattern**:
```javascript
function adjustFontSize(delta) {
  prefs.fontSize = Math.max(50, Math.min(200, (prefs.fontSize || 100) + delta));
  rendition.themes.fontSize(prefs.fontSize + '%');
  // Update display and persist
}
```

### 8. Keyboard Shortcuts Help Overlay

**Decision**: Use existing `#shortcuts-overlay` modal (reader.html lines 140-159) with table layout

**Rationale**:
- HTML structure already exists and styled
- Modal overlay pattern already implemented (lines 453-461 in CSS)
- Toggle via ? key already works (lines 653-656 in JS)
- No new UI components needed; just ensure all shortcuts are documented

**Alternatives Considered**:
- **Tooltip-based help**: Rejected as less discoverable and harder to scan
- **Separate help page**: Rejected because in-context overlay is more accessible
- **Contextual hints**: Rejected as too intrusive during reading

**Existing Structure**:
```html
<div id="shortcuts-overlay" class="shortcuts-overlay" hidden>
  <div class="shortcuts-modal">
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">
      <!-- Rows already defined for existing shortcuts -->
    </table>
  </div>
</div>
```

## Summary of Findings

All technical decisions are based on existing patterns in the codebase. No new libraries, frameworks, or architectural changes are required. The implementation will:

1. **Extend** the existing keyboard event handler in `reader.js` (lines 649-701)
2. **Enhance** context-aware behavior to properly disable navigation shortcuts during text input
3. **Add** Escape key handling for panel/overlay dismissal
4. **Ensure** all appearance controls work reliably with immediate feedback
5. **Document** all shortcuts in the existing help overlay
6. **Test** keyboard shortcut logic with new unit tests

**No unresolved clarifications remain.** All requirements can be implemented with existing technologies and patterns.
