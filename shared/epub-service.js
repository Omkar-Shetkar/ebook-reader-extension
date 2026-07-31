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
    const results = await book.search(query.trim());
    return Array.isArray(results) ? results : [];
  } catch (e) {
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadBook, createRendition, registerThemes, applyPreferences, getToc, getCurrentCfi, goToCfi, searchBook };
}
