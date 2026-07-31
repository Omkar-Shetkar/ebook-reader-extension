'use strict';

function loadBook(arrayBuffer) {
  const book = ePub(arrayBuffer.slice(0));
  return book.ready.then(() => book);
}

function createRendition(book, element, prefs) {
  const rendition = book.renderTo(element, {
    flow:   prefs.flow || 'paginated',
    width:  '100%',
    height: '100%',
  });
  registerThemes(rendition);
  applyPreferences(rendition, prefs);
  return rendition;
}

function registerThemes(rendition) {
  rendition.themes.register('light', {
    body: {
      background: THEMES.light.background,
      color:      THEMES.light.color,
    },
    a: { color: '#1a6bb5' },
  });
  rendition.themes.register('dark', {
    body: {
      background: THEMES.dark.background,
      color:      THEMES.dark.color,
    },
    a: { color: '#7fb3e8' },
  });
  rendition.themes.register('sepia', {
    body: {
      background: THEMES.sepia.background,
      color:      THEMES.sepia.color,
    },
    a: { color: '#8b4513' },
  });

  rendition.themes.default({
    '.hl-yellow': { background: 'rgba(255, 215, 0, 0.45)  !important', 'border-radius': '2px' },
    '.hl-green':  { background: 'rgba(124, 252, 0, 0.45)  !important', 'border-radius': '2px' },
    '.hl-blue':   { background: 'rgba(135, 206, 235, 0.55) !important', 'border-radius': '2px' },
    '.hl-pink':   { background: 'rgba(255, 182, 193, 0.55) !important', 'border-radius': '2px' },
  });
}

function applyPreferences(rendition, prefs) {
  rendition.themes.select(prefs.theme || 'light');
  rendition.themes.fontSize((prefs.fontSize || 100) + '%');
  if (prefs.fontFamily && prefs.fontFamily !== 'inherit') {
    rendition.themes.font(prefs.fontFamily);
  }
  const lineHeight    = prefs.lineHeight    || 1.6;
  const marginPercent = prefs.marginPercent != null ? prefs.marginPercent : 8;
  rendition.themes.override('line-height', String(lineHeight));
  rendition.themes.override('padding-left',  marginPercent + '%');
  rendition.themes.override('padding-right', marginPercent + '%');
}

function getToc(book) {
  const navItems = book.navigation && book.navigation.toc ? book.navigation.toc : [];
  const flat = [];
  function walk(items, depth) {
    items.forEach(item => {
      flat.push({ id: item.id, label: (item.label || '').trim(), href: item.href, depth });
      if (item.subitems && item.subitems.length) walk(item.subitems, depth + 1);
    });
  }
  walk(navItems, 0);
  return flat;
}

function getCurrentCfi(rendition) {
  try {
    const loc = rendition.currentLocation();
    return loc && loc.start ? loc.start.cfi : null;
  } catch (e) {
    return null;
  }
}

async function goToCfi(rendition, cfi) {
  if (!cfi) return rendition.display();
  return rendition.display(cfi);
}

async function searchBook(book, query) {
  if (!query || !query.trim()) return [];
  try {
    if (!book || typeof book.spine === 'undefined') {
      console.error('[searchBook] Invalid book object');
      return [];
    }

    const results = [];
    const q = query.trim();

    for (const item of book.spine.spineItems) {
      try {
        await item.load(book.load.bind(book));
        const findings = await item.find(q);
        if (Array.isArray(findings)) {
          const remaining = 50 - results.length;
          findings.slice(0, remaining).forEach(f => results.push(f));
        }
        item.unload();
        if (results.length >= 50) break;
      } catch (e) {
        console.warn('[searchBook] Error searching item:', item.href, e);
      }
    }

    return results;
  } catch (e) {
    console.error('[searchBook] Search error:', e);
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadBook, createRendition, registerThemes, applyPreferences, getToc, getCurrentCfi, goToCfi, searchBook };
}
