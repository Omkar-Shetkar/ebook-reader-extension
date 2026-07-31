'use strict';

const params = new URLSearchParams(location.search);
const bookId = params.get('bookId');

let rendition  = null;
let book       = null;
let tocItems   = [];
let prefs      = Object.assign({}, DEFAULT_PREFERENCES);
let saveTimer  = null;
let currentCfi = null;
let activeAnnotationData = null;

const $ = id => document.getElementById(id);

const loadingOverlay   = $('loading-overlay');
const readerArea       = $('reader-area');
const errorState       = $('error-state');
const errorMessage     = $('error-message');
const bookTitle        = $('book-title');
const progressDisplay  = $('progress-display');
const btnToc           = $('btn-toc');
const btnBookmark      = $('btn-bookmark');
const btnAnnotations   = $('btn-annotations');
const btnSearch        = $('btn-search');
const btnAppearance    = $('btn-appearance');
const btnPrev          = $('btn-prev');
const btnNext          = $('btn-next');
const tocPanel         = $('toc-panel');
const tocList          = $('toc-list');
const tocEmpty         = $('toc-empty');
const bookmarksPanel   = $('bookmarks-panel');
const bookmarksList    = $('bookmarks-list');
const bookmarksEmpty   = $('bookmarks-empty');
const bkmLabelWrap     = $('bookmark-label-input');
const bkmLabel         = $('bookmark-label');
const bkmSave          = $('bookmark-save');
const bkmCancel        = $('bookmark-cancel');
const annotationsPanel = $('annotations-panel');
const annotationsList  = $('annotations-list');
const annotationsEmpty = $('annotations-empty');
const appearancePanel  = $('appearance-panel');
const searchBar        = $('search-bar');
const searchForm       = $('search-form');
const searchInput      = $('search-input');
const searchClose      = $('search-close');
const searchResults    = $('search-results');
const selectionToolbar = $('selection-toolbar');
const annotationPopup  = $('annotation-popup');
const annotationNote   = $('annotation-note');
const annotationSave   = $('annotation-save');
const annotationRemove = $('annotation-remove');
const annotationCancel = $('annotation-cancel');
const shortcutsOverlay = $('shortcuts-overlay');
const toastContainer   = createToastContainer();

function createToastContainer() {
  const el = document.createElement('div');
  el.className = 'toast-container';
  document.body.appendChild(el);
  return el;
}

function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' toast--' + type : '');
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

async function msg(type, payload) {
  return browser.runtime.sendMessage({ type, payload });
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function init() {
  try {
    if (!bookId) { showError('No book specified.'); return; }

    const prefsResp = await msg(MessageType.PREFERENCES_GET, null);
    if (prefsResp.success) prefs = prefsResp.data;

    let arrayBuffer;
    try {
      arrayBuffer = await getBook(bookId);
    } catch (e) {
      arrayBuffer = null;
    }

    if (!arrayBuffer) {
      showError('Book data not found. Please re-open from the library.');
      return;
    }

    try {
      book = await loadBook(arrayBuffer);
    } catch (e) {
      showError('Failed to parse EPUB file: ' + (e && e.message ? e.message : String(e)));
      return;
    }

    const meta = book.packaging && book.packaging.metadata ? book.packaging.metadata : {};
    const title = (meta.title || '').trim() || 'Untitled';
    bookTitle.textContent = title;
    document.title        = title + ' — Ebook Reader';

    rendition = createRendition(book, readerArea, prefs);
    setupRenditionEvents();

    const sessionResp = await msg(MessageType.SESSION_GET, { bookId });
    const savedCfi = sessionResp && sessionResp.success && sessionResp.data && sessionResp.data.currentCfi;

    try {
      await (savedCfi ? rendition.display(savedCfi) : rendition.display());
    } catch (e) {
      await rendition.display();
    }

    book.locations.generate(1024).then(() => {
      console.log('[reader] locations generated, total:', book.locations.total);
    }).catch(e => {
      console.warn('[reader] locations generation failed:', e);
    });

    loadingOverlay.hidden = true;

    populateFontSelect();
    syncAppearanceControls();
    buildToc();
    await replayAnnotations();
  } catch (e) {
    console.error('[reader] init error:', e);
    showError('Failed to open book: ' + (e && e.message ? e.message : String(e)));
  }
}

function showError(errMsg) {
  loadingOverlay.hidden = true;
  errorState.hidden     = false;
  readerArea.hidden     = true;
  errorMessage.textContent = errMsg;
  $('btn-go-library').addEventListener('click', () => window.close());
}

function setupRenditionEvents() {
  rendition.on('relocated', location => {
    if (!location || !location.start) return;
    currentCfi = location.start.cfi;
    const pct  = Math.round((location.start.percentage || 0) * 100);
    console.log('[reader] relocated, percentage:', location.start.percentage, 'pct:', pct);
    progressDisplay.textContent = pct + '%';

    updateBookmarkIcon();
    updateActiveTocItem(location.start.href);

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      msg(MessageType.SESSION_SAVE, {
        bookId,
        currentCfi,
        progressPercent:  pct,
        currentSpineIndex: location.start.index || 0,
      });
    }, 500);
  });

  rendition.on('selected', (cfiRange, contents) => {
    const selection = contents && contents.window && contents.window.getSelection();
    if (!selection || selection.isCollapsed) { selectionToolbar.hidden = true; return; }
    const text = selection.toString().trim();
    if (!text) { selectionToolbar.hidden = true; return; }
    positionSelectionToolbar(selection, cfiRange);
  });

  rendition.on('markClicked', (cfiRange, data) => {
    openAnnotationPopup(cfiRange, data);
  });
}

function positionSelectionToolbar(selection, cfiRange) {
  let rect = null;
  try {
    const range = selection.getRangeAt(0);
    rect = range.getBoundingClientRect();
  } catch (_) { return; }

  selectionToolbar.hidden        = false;
  selectionToolbar.dataset.cfi   = cfiRange;
  selectionToolbar.dataset.text  = selection.toString().trim();

  const top  = readerArea.offsetTop + rect.top - selectionToolbar.offsetHeight - 8;
  const left = readerArea.offsetLeft + rect.left + (rect.width / 2) - (selectionToolbar.offsetWidth / 2);
  selectionToolbar.style.top  = Math.max(readerArea.offsetTop + 4, top)  + 'px';
  selectionToolbar.style.left = Math.max(4, Math.min(window.innerWidth - 160, left)) + 'px';
}

document.addEventListener('click', e => {
  if (!selectionToolbar.contains(e.target)) selectionToolbar.hidden = true;
  if (!annotationPopup.contains(e.target))  hideAnnotationPopup();
});

selectionToolbar.querySelectorAll('.hl-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const cfiRange   = selectionToolbar.dataset.cfi;
    const text       = selectionToolbar.dataset.text;
    const color      = btn.dataset.color;
    const annotationId = crypto.randomUUID();

    const annotation = {
      annotationId,
      bookId,
      cfiRange,
      text:         text.substring(0, 300),
      color,
      note:         '',
      spineIndex:   0,
      chapterTitle: getCurrentChapterTitle(),
      createdAt:    Date.now(),
      updatedAt:    Date.now(),
    };

    const resp = await msg(MessageType.ANNOTATION_ADD, annotation);
    if (resp.success) {
      rendition.annotations.add('highlight', cfiRange, { annotationId }, null, 'hl-' + color);
    } else {
      showToast('Could not save highlight.', 'error');
    }
    selectionToolbar.hidden = true;
  });
});

function openAnnotationPopup(cfiRange, data) {
  activeAnnotationData = { cfiRange, annotationId: data && data.annotationId };
  annotationNote.value     = (data && data.note) || '';
  annotationPopup.hidden   = false;

  const panelRect = readerArea.getBoundingClientRect();
  annotationPopup.style.top  = (panelRect.top + panelRect.height / 2 - 90) + 'px';
  annotationPopup.style.left = (panelRect.left + panelRect.width / 2 - 130) + 'px';

  annotationPopup.querySelectorAll('.hl-btn--sm').forEach(btn => {
    btn.style.outline = btn.dataset.color === (data && data.color) ? '2px solid #333' : '';
  });
}

function hideAnnotationPopup() {
  console.log('[reader] hideAnnotationPopup called, setting hidden=true');
  annotationPopup.hidden = true;
  activeAnnotationData   = null;
  console.log('[reader] annotationPopup.hidden is now:', annotationPopup.hidden);
}

annotationPopup.querySelectorAll('.hl-btn--sm').forEach(btn => {
  btn.addEventListener('click', () => {
    annotationPopup.querySelectorAll('.hl-btn--sm').forEach(b => b.style.outline = '');
    btn.style.outline = '2px solid #333';
  });
});

annotationSave.addEventListener('click', async () => {
  console.log('[reader] annotationSave clicked, activeAnnotationData:', activeAnnotationData);
  if (!activeAnnotationData) return;
  const note  = annotationNote.value.trim();
  const color = [...annotationPopup.querySelectorAll('.hl-btn--sm')]
    .find(b => b.style.outline)?.dataset.color || null;
  console.log('[reader] saving annotation, note:', note, 'color:', color);
  await msg(MessageType.ANNOTATION_UPDATE, {
    bookId,
    annotationId: activeAnnotationData.annotationId,
    note,
    color,
  });
  
  rendition.annotations.remove(activeAnnotationData.cfiRange);
  rendition.annotations.add('highlight', activeAnnotationData.cfiRange, { 
    annotationId: activeAnnotationData.annotationId, 
    note, 
    color 
  }, null, 'hl-' + (color || 'yellow'));
  
  console.log('[reader] calling hideAnnotationPopup');
  hideAnnotationPopup();
  refreshAnnotationsPanel();
});

annotationRemove.addEventListener('click', async () => {
  console.log('[reader] annotationRemove clicked, cfiRange:', activeAnnotationData.cfiRange);
  if (!activeAnnotationData) return;
  const resp = await msg(MessageType.ANNOTATION_REMOVE, {
    bookId,
    annotationId: activeAnnotationData.annotationId,
  });
  console.log('[reader] ANNOTATION_REMOVE response:', resp);
  
  try {
    rendition.annotations.remove(activeAnnotationData.cfiRange, 'highlight');
    console.log('[reader] called rendition.annotations.remove with type');
  } catch (e) {
    console.warn('[reader] rendition.annotations.remove failed:', e);
  }
  
  const iframe = readerArea.querySelector('iframe');
  if (iframe && iframe.contentDocument) {
    const highlights = iframe.contentDocument.querySelectorAll(`[data-epubcfi*="${activeAnnotationData.annotationId}"]`);
    console.log('[reader] found', highlights.length, 'highlight elements to remove');
    highlights.forEach(el => el.outerHTML = el.textContent);
  }
  
  console.log('[reader] calling hideAnnotationPopup');
  hideAnnotationPopup();
  refreshAnnotationsPanel();
});

annotationCancel.addEventListener('click', () => {
  console.log('[reader] annotationCancel clicked');
  hideAnnotationPopup();
});

async function replayAnnotations() {
  const resp = await msg(MessageType.ANNOTATION_GET_ALL, { bookId });
  if (!resp.success) return;
  resp.data.annotations.forEach(ann => {
    rendition.annotations.add('highlight', ann.cfiRange, { annotationId: ann.annotationId, note: ann.note, color: ann.color }, null, 'hl-' + ann.color);
  });
}

function buildToc() {
  tocItems = getToc(book);
  tocList.innerHTML = '';
  if (!tocItems.length) { tocEmpty.hidden = false; return; }
  tocItems.forEach(item => {
    const li = document.createElement('li');
    li.textContent          = item.label || '(untitled)';
    li.style.paddingLeft    = (14 + item.depth * 16) + 'px';
    li.dataset.href         = item.href;
    li.addEventListener('click', () => {
      rendition.display(item.href);
      closeAllPanels();
    });
    tocList.appendChild(li);
  });
}

function updateActiveTocItem(currentHref) {
  if (!currentHref) return;
  tocList.querySelectorAll('li').forEach(li => {
    const href = li.dataset.href || '';
    const match = href === currentHref || href.split('#')[0] === currentHref.split('#')[0];
    li.classList.toggle('toc-active', match);
  });
}

function getCurrentChapterTitle() {
  const active = tocList.querySelector('.toc-active');
  return active ? active.textContent : '';
}

async function updateBookmarkIcon() {
  if (!currentCfi) return;
  const resp = await msg(MessageType.BOOKMARK_CHECK, { bookId, cfi: currentCfi });
  if (resp.success) {
    btnBookmark.classList.toggle('active', resp.data.exists);
    btnBookmark.title = resp.data.exists ? 'Remove bookmark (Ctrl+B)' : 'Bookmark (Ctrl+B)';
  }
}

btnBookmark.addEventListener('click', async () => {
  if (!currentCfi) return;
  const check = await msg(MessageType.BOOKMARK_CHECK, { bookId, cfi: currentCfi });
  if (check.success && check.data.exists) {
    await msg(MessageType.BOOKMARK_REMOVE, { bookId, bookmarkId: check.data.bookmarkId });
    btnBookmark.classList.remove('active');
    refreshBookmarksPanel();
    return;
  }
  bkmLabelWrap.hidden = false;
  if (!bookmarksPanel.hidden) return;
  openPanel(bookmarksPanel);
});

bkmSave.addEventListener('click', async () => {
  const label = bkmLabel.value.trim();
  bkmLabel.value = '';
  bkmLabelWrap.hidden = true;
  const bookmark = {
    bookmarkId:   crypto.randomUUID(),
    bookId,
    cfi:          currentCfi,
    spineIndex:   0,
    chapterTitle: getCurrentChapterTitle(),
    excerpt:      '',
    label:        label || null,
    createdAt:    Date.now(),
  };
  await msg(MessageType.BOOKMARK_ADD, bookmark);
  btnBookmark.classList.add('active');
  refreshBookmarksPanel();
});

bkmCancel.addEventListener('click', () => {
  bkmLabelWrap.hidden = true;
  bkmLabel.value = '';
});

async function refreshBookmarksPanel() {
  const resp = await msg(MessageType.BOOKMARK_GET_ALL, { bookId });
  if (!resp.success) return;
  const bookmarks = resp.data.bookmarks;
  bookmarksList.innerHTML = '';
  bookmarksEmpty.hidden   = bookmarks.length > 0;

  bookmarks.forEach(bm => {
    const li = document.createElement('li');
    li.className = 'panel-item';
    li.innerHTML = `
      <div class="panel-item__body">
        <div class="panel-item__chapter">${esc(bm.chapterTitle || '')}</div>
        <div class="panel-item__label">${esc(bm.label || 'Bookmark')}</div>
      </div>
      <button class="panel-item__delete" title="Remove">&times;</button>`;
    li.querySelector('.panel-item__body').addEventListener('click', () => rendition.display(bm.cfi));
    li.querySelector('.panel-item__delete').addEventListener('click', async e => {
      e.stopPropagation();
      await msg(MessageType.BOOKMARK_REMOVE, { bookId, bookmarkId: bm.bookmarkId });
      li.remove();
      if (!bookmarksList.children.length) bookmarksEmpty.hidden = false;
      updateBookmarkIcon();
    });
    bookmarksList.appendChild(li);
  });
}

async function refreshAnnotationsPanel() {
  const resp = await msg(MessageType.ANNOTATION_GET_ALL, { bookId });
  if (!resp.success) return;
  const annotations = resp.data.annotations;
  annotationsList.innerHTML = '';
  annotationsEmpty.hidden   = annotations.length > 0;

  const colorMap = { yellow: '#FFD700', green: '#7CFC00', blue: '#87CEEB', pink: '#FFB6C1' };
  annotations.forEach(ann => {
    const li = document.createElement('li');
    li.className = 'panel-item';
    li.innerHTML = `
      <div class="color-dot" style="background:${colorMap[ann.color] || '#ccc'}"></div>
      <div class="panel-item__body">
        <div class="panel-item__chapter">${esc(ann.chapterTitle || '')}</div>
        <div class="panel-item__excerpt">${esc(ann.text || '')}</div>
        ${ann.note ? `<div class="panel-item__note">${esc(ann.note)}</div>` : ''}
      </div>
      <button class="panel-item__delete" title="Remove">&times;</button>`;
    li.querySelector('.panel-item__body').addEventListener('click', () => rendition.display(ann.cfiRange));
    li.querySelector('.panel-item__delete').addEventListener('click', async e => {
      e.stopPropagation();
      await msg(MessageType.ANNOTATION_REMOVE, { bookId, annotationId: ann.annotationId });
      try {
        rendition.annotations.remove(ann.cfiRange, 'highlight');
      } catch (err) {
        console.warn('[reader] panel delete: rendition.annotations.remove failed:', err);
      }
      const iframe = readerArea.querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        const highlights = iframe.contentDocument.querySelectorAll(`[data-epubcfi*="${ann.annotationId}"]`);
        highlights.forEach(el => el.outerHTML = el.textContent);
      }
      li.remove();
      if (!annotationsList.children.length) annotationsEmpty.hidden = false;
    });
    annotationsList.appendChild(li);
  });
}

function populateFontSelect() {
  const sel = $('font-select');
  sel.innerHTML = '';
  FONT_OPTIONS.forEach(opt => {
    const o = document.createElement('option');
    o.value       = opt.value;
    o.textContent = opt.label;
    o.selected    = opt.value === prefs.fontFamily;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    prefs.fontFamily = sel.value;
    if (prefs.fontFamily === 'inherit') {
      rendition.themes.override('font-family', '');
    } else {
      rendition.themes.font(prefs.fontFamily);
    }
    msg(MessageType.PREFERENCES_UPDATE, { fontFamily: prefs.fontFamily });
  });
}

function syncAppearanceControls() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === prefs.theme);
    btn.addEventListener('click', () => {
      prefs.theme = btn.dataset.theme;
      rendition.themes.select(prefs.theme);
      applyThemeToChrome(prefs.theme);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === prefs.theme));
      msg(MessageType.PREFERENCES_UPDATE, { theme: prefs.theme });
    });
  });

  $('font-size-display').textContent = prefs.fontSize + '%';
  $('font-decrease').addEventListener('click', () => adjustFontSize(-10));
  $('font-increase').addEventListener('click', () => adjustFontSize(10));

  const lhSlider = $('line-height-slider');
  lhSlider.value = prefs.lineHeight;
  lhSlider.addEventListener('input', () => {
    prefs.lineHeight = parseFloat(lhSlider.value);
    rendition.themes.override('line-height', String(prefs.lineHeight));
    msg(MessageType.PREFERENCES_UPDATE, { lineHeight: prefs.lineHeight });
  });

  const mgSlider = $('margin-slider');
  mgSlider.value = prefs.marginPercent;
  mgSlider.addEventListener('input', () => {
    prefs.marginPercent = parseInt(mgSlider.value, 10);
    rendition.themes.override('padding-left',  prefs.marginPercent + '%');
    rendition.themes.override('padding-right', prefs.marginPercent + '%');
    msg(MessageType.PREFERENCES_UPDATE, { marginPercent: prefs.marginPercent });
  });

  applyThemeToChrome(prefs.theme);
}

function applyThemeToChrome(theme) {
  const t = THEMES[theme] || THEMES.light;
  document.documentElement.style.setProperty('--bg',         t.background);
  document.documentElement.style.setProperty('--text',       t.color);
  document.documentElement.style.setProperty('--toolbar-bg', t.toolbarBg);
  document.body.style.background = t.background;
}

function adjustFontSize(delta) {
  prefs.fontSize = Math.max(50, Math.min(200, (prefs.fontSize || 100) + delta));
  rendition.themes.fontSize(prefs.fontSize + '%');
  $('font-size-display').textContent = prefs.fontSize + '%';
  msg(MessageType.PREFERENCES_UPDATE, { fontSize: prefs.fontSize });
}

btnPrev.addEventListener('click', () => rendition.prev());
btnNext.addEventListener('click', () => rendition.next());

function openPanel(panel) {
  closeAllPanels();
  panel.hidden = false;
}

function closeAllPanels() {
  [tocPanel, bookmarksPanel, annotationsPanel, appearancePanel].forEach(p => p.hidden = true);
  [btnToc, btnBookmark, btnAnnotations, btnAppearance].forEach(b => b.classList.remove('active'));
}

btnToc.addEventListener('click', () => {
  if (!tocPanel.hidden) { closeAllPanels(); return; }
  openPanel(tocPanel);
  btnToc.classList.add('active');
});

btnBookmark.addEventListener('click', () => {
  if (!bookmarksPanel.hidden) { closeAllPanels(); return; }
  openPanel(bookmarksPanel);
  btnBookmark.classList.add('active');
  refreshBookmarksPanel();
});

btnAnnotations.addEventListener('click', () => {
  if (!annotationsPanel.hidden) { closeAllPanels(); return; }
  openPanel(annotationsPanel);
  btnAnnotations.classList.add('active');
  refreshAnnotationsPanel();
});

btnAppearance.addEventListener('click', () => {
  if (!appearancePanel.hidden) { closeAllPanels(); return; }
  openPanel(appearancePanel);
  btnAppearance.classList.add('active');
});

btnSearch.addEventListener('click', () => {
  const isOpen = !searchBar.hidden;
  searchBar.hidden = isOpen;
  if (!isOpen) { searchInput.focus(); btnSearch.classList.add('active'); readerArea.classList.add('search-open'); }
  else { btnSearch.classList.remove('active'); readerArea.classList.remove('search-open'); }
});

searchClose.addEventListener('click', () => {
  searchBar.hidden = true;
  searchResults.hidden = true;
  btnSearch.classList.remove('active');
  readerArea.classList.remove('search-open');
});

let cachedSearchResults = [];

searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  searchResults.innerHTML = '<div class="search-no-results">Searching…</div>';
  searchResults.hidden = false;

  const results = await searchBook(book, q);
  cachedSearchResults = results;

  searchResults.innerHTML = '';
  if (!results.length) {
    searchResults.innerHTML = '<div class="search-no-results">No results found.</div>';
    return;
  }
  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    const escaped  = esc(r.excerpt || '');
    const escapedQ = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    div.innerHTML = escaped.replace(new RegExp(escapedQ, 'gi'), m => `<mark>${m}</mark>`);
    div.addEventListener('click', () => rendition.display(r.cfi));
    searchResults.appendChild(div);
  });
});

document.querySelectorAll('.side-panel__close').forEach(btn => {
  btn.addEventListener('click', () => {
    const panelId = btn.dataset.closes;
    const panel   = $(panelId);
    if (panel) panel.hidden = true;
    closeAllPanels();
  });
});

$('shortcuts-overlay').querySelector('.shortcuts-close').addEventListener('click', () => {
  shortcutsOverlay.hidden = true;
});
shortcutsOverlay.addEventListener('click', e => {
  if (e.target === shortcutsOverlay) shortcutsOverlay.hidden = true;
});

function isTypingContext() {
  const tag = document.activeElement.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function shouldHandleShortcut(event, context) {
  if (context === 'global') return true;
  if (context === 'non-input') return !isTypingContext();
  return false;
}

document.addEventListener('keydown', e => {
  const typing = isTypingContext();

  if (e.key === '?' && !typing) {
    shortcutsOverlay.hidden = !shortcutsOverlay.hidden;
    return;
  }

  if (e.key === 'Escape') {
    if (!searchBar.hidden) {
      searchBar.hidden = true;
      searchResults.hidden = true;
      btnSearch.classList.remove('active');
      readerArea.classList.remove('search-open');
      return;
    }
    if (!shortcutsOverlay.hidden) {
      shortcutsOverlay.hidden = true;
      return;
    }
    closeAllPanels();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b': case 'B':
        e.preventDefault();
        btnBookmark.click();
        break;
      case 'f': case 'F':
        e.preventDefault();
        btnSearch.click();
        break;
      case 't': case 'T':
        e.preventDefault();
        btnToc.click();
        break;
      case 'a': case 'A':
        e.preventDefault();
        btnAnnotations.click();
        break;
      case 'd': case 'D':
        e.preventDefault();
        cycleTheme();
        break;
      case '=': case '+':
        e.preventDefault();
        adjustFontSize(10);
        break;
      case '-': case '_':
        e.preventDefault();
        adjustFontSize(-10);
        break;
    }
    return;
  }

  if (typing) return;

  if (e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) {
    e.preventDefault();
    rendition && rendition.next();
  } else if (e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) {
    e.preventDefault();
    rendition && rendition.prev();
  }
});

function cycleTheme() {
  const order = ['light', 'dark', 'sepia'];
  const idx   = order.indexOf(prefs.theme);
  prefs.theme = order[(idx + 1) % order.length];
  rendition.themes.select(prefs.theme);
  applyThemeToChrome(prefs.theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === prefs.theme));
  msg(MessageType.PREFERENCES_UPDATE, { theme: prefs.theme });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
