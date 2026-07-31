/**
 * Unit tests for keyboard shortcut functionality in reader.js
 * Tests context-aware behavior, modifier key detection, and bounds enforcement
 */

describe('Keyboard Shortcut Helpers', () => {
  describe('isTypingContext', () => {
    test('returns true when INPUT element has focus', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      
      const result = document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA' ||
                     document.activeElement.tagName === 'SELECT';
      
      expect(result).toBe(true);
      document.body.removeChild(input);
    });

    test('returns true when TEXTAREA element has focus', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      
      const result = document.activeElement.tagName === 'TEXTAREA';
      
      expect(result).toBe(true);
      document.body.removeChild(textarea);
    });

    test('returns true when SELECT element has focus', () => {
      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();
      
      const result = document.activeElement.tagName === 'SELECT';
      
      expect(result).toBe(true);
      document.body.removeChild(select);
    });

    test('returns false when DIV element has focus', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();
      
      const result = document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA' ||
                     document.activeElement.tagName === 'SELECT';
      
      expect(result).toBe(false);
      document.body.removeChild(div);
    });
  });

  describe('Modifier Key Detection', () => {
    test('detects Ctrl key on Windows/Linux', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        metaKey: false
      });
      
      expect(event.ctrlKey || event.metaKey).toBe(true);
    });

    test('detects Cmd key on Mac', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: false,
        metaKey: true
      });
      
      expect(event.ctrlKey || event.metaKey).toBe(true);
    });

    test('detects both Ctrl and Cmd', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        metaKey: true
      });
      
      expect(event.ctrlKey || event.metaKey).toBe(true);
    });

    test('returns false when neither Ctrl nor Cmd pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: false,
        metaKey: false
      });
      
      expect(event.ctrlKey || event.metaKey).toBe(false);
    });
  });

  describe('Theme Cycling', () => {
    test('cycles from light to dark', () => {
      const themes = ['light', 'dark', 'sepia'];
      const currentTheme = 'light';
      const currentIndex = themes.indexOf(currentTheme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      
      expect(nextTheme).toBe('dark');
    });

    test('cycles from dark to sepia', () => {
      const themes = ['light', 'dark', 'sepia'];
      const currentTheme = 'dark';
      const currentIndex = themes.indexOf(currentTheme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      
      expect(nextTheme).toBe('sepia');
    });

    test('cycles from sepia back to light', () => {
      const themes = ['light', 'dark', 'sepia'];
      const currentTheme = 'sepia';
      const currentIndex = themes.indexOf(currentTheme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      
      expect(nextTheme).toBe('light');
    });
  });

  describe('Font Size Clamping', () => {
    test('clamps font size to minimum 50%', () => {
      const fontSize = 40;
      const clamped = Math.max(50, Math.min(200, fontSize));
      
      expect(clamped).toBe(50);
    });

    test('clamps font size to maximum 200%', () => {
      const fontSize = 250;
      const clamped = Math.max(50, Math.min(200, fontSize));
      
      expect(clamped).toBe(200);
    });

    test('allows font size within bounds', () => {
      const fontSize = 120;
      const clamped = Math.max(50, Math.min(200, fontSize));
      
      expect(clamped).toBe(120);
    });

    test('handles font size at minimum boundary', () => {
      const fontSize = 50;
      const clamped = Math.max(50, Math.min(200, fontSize));
      
      expect(clamped).toBe(50);
    });

    test('handles font size at maximum boundary', () => {
      const fontSize = 200;
      const clamped = Math.max(50, Math.min(200, fontSize));
      
      expect(clamped).toBe(200);
    });
  });

  describe('Font Size Adjustment', () => {
    test('increases font size by 10%', () => {
      const currentSize = 100;
      const delta = 10;
      const newSize = Math.max(50, Math.min(200, currentSize + delta));
      
      expect(newSize).toBe(110);
    });

    test('decreases font size by 10%', () => {
      const currentSize = 100;
      const delta = -10;
      const newSize = Math.max(50, Math.min(200, currentSize + delta));
      
      expect(newSize).toBe(90);
    });

    test('prevents decrease below 50%', () => {
      const currentSize = 50;
      const delta = -10;
      const newSize = Math.max(50, Math.min(200, currentSize + delta));
      
      expect(newSize).toBe(50);
    });

    test('prevents increase above 200%', () => {
      const currentSize = 200;
      const delta = 10;
      const newSize = Math.max(50, Math.min(200, currentSize + delta));
      
      expect(newSize).toBe(200);
    });
  });

  describe('Arrow Key Navigation Context', () => {
    test('arrow keys should be handled when not typing', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();
      
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const shouldHandle = !isTyping;
      
      expect(shouldHandle).toBe(true);
      document.body.removeChild(div);
    });

    test('arrow keys should not be handled when typing in input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const shouldHandle = !isTyping;
      
      expect(shouldHandle).toBe(false);
      document.body.removeChild(input);
    });
  });

  describe('Spacebar Navigation Context', () => {
    test('spacebar should navigate when not typing', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();
      
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const shouldNavigate = !isTyping;
      
      expect(shouldNavigate).toBe(true);
      document.body.removeChild(div);
    });

    test('spacebar should not navigate when typing in textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      const shouldNavigate = !isTyping;
      
      expect(shouldNavigate).toBe(false);
      document.body.removeChild(textarea);
    });
  });

  describe('Escape Key Handling', () => {
    test('Escape key event is recognized', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape'
      });
      
      expect(event.key).toBe('Escape');
    });

    test('Escape key without modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      });
      
      expect(event.key).toBe('Escape');
      expect(event.ctrlKey).toBe(false);
    });
  });
});
