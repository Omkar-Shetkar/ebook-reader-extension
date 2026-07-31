'use strict';

function ok(data)  { return { success: true,  data,  error: null }; }
function err(code) { return { success: false, data: null, error: code }; }

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[background] received message:', message.type);
  handleMessage(message).then(result => {
    console.log('[background] responding to', message.type, ':', result && result.success);
    sendResponse(result);
  }).catch(e => {
    console.error('[background] unhandled error for', message.type, ':', e);
    sendResponse(err('INTERNAL_ERROR'));
  });
  return true;
});

async function handleMessage({ type, payload }) {
  switch (type) {
    case MessageType.LIBRARY_GET_ALL:      return handleLibraryGetAll();
    case MessageType.LIBRARY_OPEN_BOOK:    return handleLibraryOpenBook(payload);
    case MessageType.LIBRARY_ADD_BOOK:     return handleLibraryAddBook(payload);
    case MessageType.LIBRARY_REMOVE_BOOK:  return handleLibraryRemoveBook(payload);
    case MessageType.LIBRARY_GET_COVER:    return handleLibraryGetCover(payload);
    case MessageType.SESSION_SAVE:         return handleSessionSave(payload);
    case MessageType.SESSION_GET:          return handleSessionGet(payload);
    case MessageType.BOOK_GET_DATA:        return handleBookGetData(payload);
    case MessageType.BOOKMARK_ADD:         return handleBookmarkAdd(payload);
    case MessageType.BOOKMARK_REMOVE:      return handleBookmarkRemove(payload);
    case MessageType.BOOKMARK_GET_ALL:     return handleBookmarkGetAll(payload);
    case MessageType.BOOKMARK_CHECK:       return handleBookmarkCheck(payload);
    case MessageType.ANNOTATION_ADD:       return handleAnnotationAdd(payload);
    case MessageType.ANNOTATION_UPDATE:    return handleAnnotationUpdate(payload);
    case MessageType.ANNOTATION_REMOVE:    return handleAnnotationRemove(payload);
    case MessageType.ANNOTATION_GET_ALL:   return handleAnnotationGetAll(payload);
    case MessageType.PREFERENCES_GET:      return handlePreferencesGet();
    case MessageType.PREFERENCES_UPDATE:   return handlePreferencesUpdate(payload);
    default:
      return err('UNKNOWN_MESSAGE_TYPE');
  }
}

async function handleLibraryGetAll() {
  const lib      = await getAllLibraryEntries();
  const sessions = (await browser.storage.local.get('sessions'))['sessions'] || {};
  const entries  = Object.values(lib).map(entry => ({
    bookId:          entry.bookId,
    title:           entry.title,
    author:          entry.author,
    hasCover:        entry.hasCover,
    progressPercent: sessions[entry.bookId] ? sessions[entry.bookId].progressPercent : 0,
    isFinished:      entry.isFinished || false,
    lastReadAt:      entry.lastReadAt  || null,
    addedAt:         entry.addedAt,
  }));
  entries.sort((a, b) => (b.lastReadAt || b.addedAt) - (a.lastReadAt || a.addedAt));
  return ok({ entries });
}

async function handleLibraryOpenBook({ bookId }) {
  const readerUrl = browser.runtime.getURL('reader/reader.html') + '?bookId=' + encodeURIComponent(bookId);
  const existing  = await browser.tabs.query({ url: readerUrl });
  if (existing && existing.length > 0) {
    await browser.tabs.update(existing[0].id, { active: true });
    return ok({ tabId: existing[0].id });
  }
  const tab = await browser.tabs.create({ url: readerUrl });
  return ok({ tabId: tab.id });
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function getBookWithRetry(bookId, retries = 3, delay = 300) {
  for (let i = 0; i < retries; i++) {
    const data = await getBook(bookId);
    if (data) return data;
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return null;
}

async function handleLibraryAddBook({ fileName, bookId, sizeBytes }) {
  const existing = await getLibraryEntry(bookId);
  if (existing) {
    return ok({ bookId, title: existing.title, author: existing.author, isNew: false });
  }

  const arrayBuffer = await getBookWithRetry(bookId);
  if (!arrayBuffer) return err(ErrorCode.BOOK_NOT_FOUND);

  let meta = {}, hasCover = false, totalSpineItems = 0;
  let epubBook;
  try {
    epubBook = ePub(arrayBuffer.slice(0));
    await withTimeout(epubBook.ready, 10000);
    meta             = (epubBook.packaging && epubBook.packaging.metadata) || {};
    totalSpineItems  = epubBook.spine ? epubBook.spine.items.length : 0;
  } catch (e) {
    console.warn('[background] epub.js metadata extraction failed:', e);
    epubBook = null;
  }

  if (epubBook) {
    try {
      const coverUrl = await withTimeout(epubBook.coverUrl(), 5000);
      if (coverUrl) {
        const resp  = await fetch(coverUrl);
        const blob  = await resp.blob();
        await saveCover(bookId, blob, blob.type || 'image/jpeg');
        hasCover = true;
      }
    } catch (_) {}
  }

  const title  = (meta.title   || '').trim() || (fileName || 'Unknown').replace(/\.epub$/i, '');
  const author = (meta.creator || '').trim() || 'Unknown Author';

  const entry = {
    bookId,
    title,
    author,
    publisher:      (meta.publisher || '').trim() || null,
    language:       (meta.language  || '').trim() || null,
    description:    null,
    format:         'epub',
    sizeBytes:      sizeBytes || arrayBuffer.byteLength,
    totalSpineItems,
    hasCover,
    addedAt:        Date.now(),
    lastReadAt:     null,
    isFinished:     false,
  };

  await addLibraryEntry(entry);
  await upsertSession(bookId, {
    bookId, currentCfi: null, progressPercent: 0, currentSpineIndex: 0, savedAt: Date.now(),
  });

  return ok({ bookId, title, author, isNew: true });
}

async function handleLibraryRemoveBook({ bookId }) {
  await removeLibraryEntry(bookId);
  await removeSession(bookId);
  await removeAllForBook(bookId);
  await deleteBookData(bookId);
  return ok(null);
}

async function handleLibraryGetCover({ bookId }) {
  try {
    const record = await getCoverRecord(bookId);
    if (!record || !record.blob) return ok({ dataUrl: null });
    const dataUrl = await blobToBase64(record.blob);
    return ok({ dataUrl });
  } catch (_) {
    return ok({ dataUrl: null });
  }
}

async function handleSessionSave({ bookId, currentCfi, progressPercent, currentSpineIndex }) {
  await upsertSession(bookId, { bookId, currentCfi, progressPercent, currentSpineIndex, savedAt: Date.now() });
  await updateLibraryEntry(bookId, {
    lastReadAt: Date.now(),
    isFinished: progressPercent >= 99.5,
  });
  return ok(null);
}

async function handleSessionGet({ bookId }) {
  const session = await getSession(bookId);
  if (!session) return ok({ currentCfi: null, progressPercent: 0, currentSpineIndex: 0 });
  return ok({
    currentCfi:       session.currentCfi       || null,
    progressPercent:  session.progressPercent  || 0,
    currentSpineIndex: session.currentSpineIndex || 0,
  });
}

async function handleBookGetData({ bookId }) {
  const buffer = await getBook(bookId);
  if (!buffer) return ok({ data: null });
  return ok({ data: arrayBufferToBase64(buffer) });
}

async function handleBookmarkAdd(payload) {
  const bookmark = Object.assign({ createdAt: Date.now() }, payload);
  await addBookmark(bookmark);
  return ok({ bookmarkId: bookmark.bookmarkId });
}

async function handleBookmarkRemove({ bookId, bookmarkId }) {
  await removeBookmark(bookId, bookmarkId);
  return ok(null);
}

async function handleBookmarkGetAll({ bookId }) {
  const bookmarks = await getBookmarks(bookId);
  return ok({ bookmarks });
}

async function handleBookmarkCheck({ bookId, cfi }) {
  const result = await checkBookmark(bookId, cfi);
  return ok(result);
}

async function handleAnnotationAdd(payload) {
  const annotation = Object.assign({ createdAt: Date.now(), updatedAt: Date.now() }, payload);
  await addAnnotation(annotation);
  return ok({ annotationId: annotation.annotationId });
}

async function handleAnnotationUpdate({ bookId, annotationId, note, color }) {
  const patch = {};
  if (note  !== undefined) patch.note  = note;
  if (color !== undefined) patch.color = color;
  await updateAnnotation(bookId, annotationId, patch);
  return ok(null);
}

async function handleAnnotationRemove({ bookId, annotationId }) {
  await removeAnnotation(bookId, annotationId);
  return ok(null);
}

async function handleAnnotationGetAll({ bookId }) {
  const annotations = await getAnnotations(bookId);
  return ok({ annotations });
}

async function handlePreferencesGet() {
  const prefs = await getPreferences();
  return ok(prefs);
}

async function handlePreferencesUpdate(patch) {
  const updated = await updatePreferences(patch);
  return ok(updated);
}

async function generateBookId(arrayBuffer) {
  const first64k = arrayBuffer.slice(0, 65536);
  const hashBuf  = await crypto.subtle.digest('SHA-256', first64k);
  const hashArr  = Array.from(new Uint8Array(hashBuf));
  const hex      = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
  return 'sha256-' + hex;
}
