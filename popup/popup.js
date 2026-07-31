'use strict';

const isTabMode       = new URLSearchParams(location.search).get('mode') === 'tab';
const fileInput       = document.getElementById('file-input');
const errorBanner     = document.getElementById('error-banner');
const errorText       = document.getElementById('error-text');
const errorDismiss    = document.getElementById('error-dismiss');
const loadingIndicator = document.getElementById('loading-indicator');
const libraryGrid     = document.getElementById('library-grid');
const emptyState      = document.getElementById('empty-state');

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.hidden = false;
}
function hideError() { errorBanner.hidden = true; }

errorDismiss.addEventListener('click', hideError);

document.getElementById('open-book-btn').addEventListener('click', () => {
  console.log('[popup] open-book-btn clicked, isTabMode?', isTabMode);
  if (isTabMode) {
    fileInput.click();
  } else {
    const popupUrl = browser.runtime.getURL('popup/popup.html') + '?mode=tab';
    browser.tabs.create({ url: popupUrl });
    window.close();
  }
});

function setLoading(on) {
  loadingIndicator.hidden = !on;
  document.querySelector('.btn--primary').style.pointerEvents = on ? 'none' : '';
  document.querySelector('.btn--primary').style.opacity = on ? '0.6' : '';
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;

  hideError();
  setLoading(true);
  console.log('[popup] file selected:', file.name, file.size);

  try {
    if (file.size > MAX_BOOK_SIZE_BYTES) {
      showError('File is too large (max 50 MB).');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const bookId      = await generateBookId(arrayBuffer);

    console.log('[popup] bookId:', bookId, 'saving to IndexedDB...');
    try {
      await saveBook(bookId, arrayBuffer, file.size);
      console.log('[popup] saved to IndexedDB');
    } catch (e) {
      if (e && e.name === 'QuotaExceededError') {
        showError('Storage is full. Remove books to free space.');
      } else {
        showError('Failed to save book.');
        console.error(e);
      }
      return;
    }

    console.log('[popup] sending LIBRARY_ADD_BOOK to background');
    const resp = await browser.runtime.sendMessage({
      type:    MessageType.LIBRARY_ADD_BOOK,
      payload: { fileName: file.name, bookId, sizeBytes: file.size },
    });
    console.log('[popup] LIBRARY_ADD_BOOK response:', resp);

    if (resp && !resp.success) {
      const msgs = {
        [ErrorCode.STORAGE_FULL]:       'Storage is full. Remove books to free space.',
        [ErrorCode.UNSUPPORTED_FORMAT]: 'This file is not a supported EPUB.',
      };
      showError(msgs[resp.error] || 'Failed to open book.');
      return;
    }

    await browser.runtime.sendMessage({
      type: MessageType.LIBRARY_OPEN_BOOK, payload: { bookId },
    });
    refreshLibrary();
  } catch (e) {
    showError('An unexpected error occurred.');
    console.error(e);
  } finally {
    setLoading(false);
  }
});

async function generateBookId(arrayBuffer) {
  const slice  = arrayBuffer.slice(0, 65536);
  const hash   = await crypto.subtle.digest('SHA-256', slice);
  const hex    = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return 'sha256-' + hex;
}

async function refreshLibrary() {
  try {
    console.log('[popup] refreshLibrary: sending LIBRARY_GET_ALL');
    const resp = await browser.runtime.sendMessage({
      type: MessageType.LIBRARY_GET_ALL, payload: null,
    });
    console.log('[popup] refreshLibrary: got response', resp);
    if (!resp || !resp.success) {
      console.error('[popup] Failed to get library:', resp);
      return;
    }

    const { entries } = resp.data;
    const cards = libraryGrid.querySelectorAll('.book-card');
    cards.forEach(c => c.remove());

    if (!entries || entries.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    for (const entry of entries) {
      const card = createBookCard(entry);
      libraryGrid.appendChild(card);
      loadCoverAsync(card, entry.bookId);
    }
  } catch (e) {
    console.error('[popup] refreshLibrary error:', e);
  }
}

function createBookCard(entry) {
  const card = document.createElement('div');
  card.className   = 'book-card';
  card.dataset.bookId = entry.bookId;

  const coverWrap = document.createElement('div');
  coverWrap.className = 'book-card__cover';

  const placeholder = document.createElement('div');
  placeholder.className = 'book-card__cover-placeholder';
  placeholder.innerHTML = `<svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="4" width="28" height="38" rx="3" fill="rgba(255,255,255,0.5)"/>
    <rect x="6" y="4" width="6" height="38" rx="2" fill="rgba(255,255,255,0.3)"/>
  </svg>`;
  coverWrap.appendChild(placeholder);

  const info = document.createElement('div');
  info.className = 'book-card__info';
  info.innerHTML = `
    <div class="book-card__title">${esc(entry.title)}</div>
    <div class="book-card__author">${esc(entry.author || 'Unknown Author')}</div>
    <div class="book-card__progress">
      <div class="book-card__progress-bar" style="width:${entry.progressPercent || 0}%"></div>
    </div>`;

  if (entry.isFinished) {
    const badge = document.createElement('span');
    badge.className   = 'book-card__badge';
    badge.textContent = 'Finished';
    card.appendChild(badge);
  }

  const removeBtn = document.createElement('button');
  removeBtn.className   = 'book-card__remove';
  removeBtn.title       = 'Remove book';
  removeBtn.innerHTML   = '&times;';
  removeBtn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm(`Remove "${entry.title}" and all its data?`)) return;
    await browser.runtime.sendMessage({
      type: MessageType.LIBRARY_REMOVE_BOOK, payload: { bookId: entry.bookId },
    });
    card.remove();
    if (!libraryGrid.querySelector('.book-card')) emptyState.hidden = false;
  });

  card.appendChild(coverWrap);
  card.appendChild(info);
  card.appendChild(removeBtn);

  card.addEventListener('click', () => {
    browser.runtime.sendMessage({
      type:    MessageType.LIBRARY_OPEN_BOOK,
      payload: { bookId: entry.bookId },
    });
  });

  return card;
}

async function loadCoverAsync(card, bookId) {
  const resp = await browser.runtime.sendMessage({
    type: MessageType.LIBRARY_GET_COVER, payload: { bookId },
  });
  if (!resp.success || !resp.data.dataUrl) return;
  const coverWrap = card.querySelector('.book-card__cover');
  coverWrap.innerHTML = '';
  const img = document.createElement('img');
  img.src = resp.data.dataUrl;
  img.alt = 'Cover';
  coverWrap.appendChild(img);
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function init() {
  console.log('[popup] init start, loading hidden?', loadingIndicator.hidden, 'tabMode?', isTabMode);
  setLoading(false);

  if (isTabMode) {
    document.body.style.width = '100%';
    document.body.style.maxWidth = '600px';
    document.body.style.margin = '40px auto';
    document.body.style.maxHeight = 'none';
    document.body.style.minHeight = '400px';
    document.body.style.borderRadius = '8px';
    document.body.style.boxShadow = '0 2px 16px rgba(0,0,0,0.1)';
  }

  try {
    await refreshLibrary();
    console.log('[popup] init refreshLibrary done');
  } catch (e) {
    console.error('[popup] init error:', e);
  } finally {
    setLoading(false);
    console.log('[popup] init complete');
  }

}

init();
