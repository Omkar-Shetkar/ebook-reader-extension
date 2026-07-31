# Data Model: Keyboard Shortcut Integration & Appearance Functionality

**Feature**: 002-keyboard-appearance-enhancements  
**Date**: August 1, 2026  
**Status**: Complete

## Overview

This feature primarily works with existing data structures. No new persistent entities are introduced. This document describes the data structures used for keyboard shortcut handling and appearance preferences.

## Entities

### 1. AppearancePreferences (Existing, Enhanced)

**Description**: User customization settings for reading appearance. Already exists in `browser.storage.local` under the `preferences` key. This feature enhances the reliability of persistence and ensures all controls properly update these preferences.

**Storage Location**: `browser.storage.local` (key: `preferences`)

**Structure**:
```javascript
{
  theme: String,           // 'light' | 'dark' | 'sepia'
  fontFamily: String,      // Font identifier or 'inherit'
  fontSize: Number,        // Percentage: 50-200
  lineHeight: Number,      // Multiplier: 1.0-2.5
  marginPercent: Number    // Percentage: 0-20
}
```

**Fields**:

| Field | Type | Range/Values | Default | Validation | Description |
|-------|------|--------------|---------|------------|-------------|
| `theme` | String | 'light', 'dark', 'sepia' | 'light' | Must be one of three values | Active color theme for reading view and chrome |
| `fontFamily` | String | 'inherit', 'serif', 'sans-serif', etc. | 'inherit' | Must match FONT_OPTIONS | Font family applied to book content |
| `fontSize` | Number | 50-200 | 100 | Clamped to range | Font size as percentage of base size |
| `lineHeight` | Number | 1.0-2.5 | 1.5 | Clamped to range | Line spacing multiplier |
| `marginPercent` | Number | 0-20 | 5 | Clamped to range | Left/right margin as percentage |

**State Transitions**: None (simple key-value updates)

**Relationships**: None (standalone preferences object)

**Access Pattern**:
- **Read**: On reader initialization via `MessageType.PREFERENCES_GET`
- **Write**: On any preference change via `MessageType.PREFERENCES_UPDATE`
- **Scope**: Global across all books (not per-book)

**Validation Rules**:
- `fontSize` must be clamped: `Math.max(50, Math.min(200, value))`
- `lineHeight` must be clamped: `Math.max(1.0, Math.min(2.5, value))`
- `marginPercent` must be clamped: `Math.max(0, Math.min(20, value))`
- `theme` must be validated against `['light', 'dark', 'sepia']`
- `fontFamily` must be validated against `FONT_OPTIONS` array

---

### 2. KeyboardShortcut (Conceptual, Not Persisted)

**Description**: Represents a keyboard shortcut mapping. This is a runtime concept, not a persisted entity. Shortcuts are defined in code and do not require storage.

**Storage Location**: N/A (defined in `reader.js` event handler)

**Structure** (conceptual):
```javascript
{
  key: String,              // Key identifier (e.g., 'b', 'ArrowRight', '?')
  modifiers: {
    ctrl: Boolean,          // Requires Ctrl (Windows/Linux) or Cmd (Mac)
    shift: Boolean,         // Requires Shift
    alt: Boolean            // Requires Alt
  },
  action: Function,         // Handler function to execute
  description: String,      // Human-readable description for help overlay
  context: String           // 'global' | 'non-input' (context-aware behavior)
}
```

**Shortcut Registry** (defined in code):

| Key | Modifiers | Action | Description | Context |
|-----|-----------|--------|-------------|---------|
| `ArrowRight` | None | `rendition.next()` | Next page | non-input |
| `ArrowLeft` | None | `rendition.prev()` | Previous page | non-input |
| `Space` | None | `rendition.next()` | Next page | non-input |
| `Space` | Shift | `rendition.prev()` | Previous page | non-input |
| `b` | Ctrl/Cmd | `btnBookmark.click()` | Toggle bookmark | global |
| `f` | Ctrl/Cmd | `btnSearch.click()` | Open search | global |
| `t` | Ctrl/Cmd | `btnToc.click()` | Toggle TOC | global |
| `a` | Ctrl/Cmd | `btnAnnotations.click()` | Toggle annotations | global |
| `d` | Ctrl/Cmd | `cycleTheme()` | Cycle theme | global |
| `+` or `=` | Ctrl/Cmd | `adjustFontSize(10)` | Increase font size | global |
| `-` | Ctrl/Cmd | `adjustFontSize(-10)` | Decrease font size | global |
| `?` | None | Toggle shortcuts overlay | Show keyboard help | global |
| `Escape` | None | Close panels/overlays | Dismiss UI elements | global |

**Context Definitions**:
- **global**: Works in all contexts, including when text inputs have focus
- **non-input**: Only works when text inputs (INPUT, TEXTAREA, SELECT) do NOT have focus

---

### 3. ThemeConfiguration (Existing, Not Modified)

**Description**: Visual styling configuration for each theme. Already defined in `constants.js` as `THEMES` object. Not modified by this feature, but used for theme cycling.

**Storage Location**: `shared/constants.js` (static configuration)

**Structure**:
```javascript
THEMES = {
  light: {
    background: '#ffffff',
    color: '#1a1a1a',
    toolbarBg: '#f5f5f5'
  },
  dark: {
    background: '#1a1a1a',
    color: '#e0e0e0',
    toolbarBg: '#2a2a2a'
  },
  sepia: {
    background: '#F4ECD8',
    color: '#3b2a1a',
    toolbarBg: '#E8DCC4'
  }
}
```

**Access Pattern**: Read-only, accessed during theme application

---

## Data Flow Diagrams

### Appearance Preference Update Flow

```
User Action (keyboard/UI)
    ↓
reader.js event handler
    ↓
Update local prefs object
    ↓
Apply change via epub.js API / CSS
    ↓
msg(MessageType.PREFERENCES_UPDATE, {...})
    ↓
background.js message handler
    ↓
browser.storage.local.set({ preferences: {...} })
    ↓
Persisted to disk
```

### Keyboard Shortcut Handling Flow

```
User presses key
    ↓
document.addEventListener('keydown')
    ↓
Check activeElement (typing detection)
    ↓
Context-aware filtering
    ↓
Match key + modifiers to shortcut registry
    ↓
e.preventDefault() (if matched)
    ↓
Execute action handler
    ↓
Visual feedback (panel open, theme change, etc.)
```

### Theme Cycling Flow

```
User presses Ctrl+D
    ↓
cycleTheme() function
    ↓
Determine next theme: light → dark → sepia → light
    ↓
Update prefs.theme
    ↓
rendition.themes.select(theme)
    ↓
applyThemeToChrome(theme)
    ↓
Update active button visual state
    ↓
Persist via PREFERENCES_UPDATE message
```

---

## Storage Schema

### browser.storage.local

```javascript
{
  "preferences": {
    "theme": "light",
    "fontFamily": "inherit",
    "fontSize": 100,
    "lineHeight": 1.5,
    "marginPercent": 5
  },
  // ... other keys (books, sessions, bookmarks, annotations) not modified by this feature
}
```

**Key**: `preferences`  
**Type**: Object  
**Size**: ~100 bytes  
**Access Frequency**: Read on init, write on every preference change  
**Retention**: Permanent (until user clears browser data or uninstalls extension)

---

## Validation & Constraints

### Runtime Validation

All preference updates must validate values before applying:

```javascript
function validatePreferences(prefs) {
  return {
    theme: ['light', 'dark', 'sepia'].includes(prefs.theme) ? prefs.theme : 'light',
    fontFamily: FONT_OPTIONS.some(opt => opt.value === prefs.fontFamily) ? prefs.fontFamily : 'inherit',
    fontSize: Math.max(50, Math.min(200, prefs.fontSize || 100)),
    lineHeight: Math.max(1.0, Math.min(2.5, prefs.lineHeight || 1.5)),
    marginPercent: Math.max(0, Math.min(20, prefs.marginPercent || 5))
  };
}
```

### Keyboard Event Validation

```javascript
function isTypingContext() {
  const tag = document.activeElement.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function shouldHandleShortcut(e, shortcutContext) {
  if (shortcutContext === 'global') return true;
  if (shortcutContext === 'non-input') return !isTypingContext();
  return false;
}
```

---

## Migration Notes

**No migration required.** The `preferences` object structure already exists and is compatible with this feature. Existing users will have their preferences preserved. New fields are not added; existing fields are enhanced with better validation and keyboard control.

---

## Summary

This feature works entirely with existing data structures:
- **AppearancePreferences**: Enhanced reliability and keyboard access
- **KeyboardShortcut**: Conceptual model for code organization (not persisted)
- **ThemeConfiguration**: Read-only reference data (not modified)

No new database schemas, migrations, or storage mechanisms are required. All data flows use existing message passing and browser.storage.local patterns.
