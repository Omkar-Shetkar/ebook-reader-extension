'use strict';

const BOOKMARKS_KEY   = 'bookmarks';
const ANNOTATIONS_KEY = 'annotations';

async function _getBookmarks() {
  const result = await browser.storage.local.get(BOOKMARKS_KEY);
  return result[BOOKMARKS_KEY] || {};
}

async function _saveBookmarks(data) {
  await browser.storage.local.set({ [BOOKMARKS_KEY]: data });
}

async function _getAnnotations() {
  const result = await browser.storage.local.get(ANNOTATIONS_KEY);
  return result[ANNOTATIONS_KEY] || {};
}

async function _saveAnnotations(data) {
  await browser.storage.local.set({ [ANNOTATIONS_KEY]: data });
}

async function getBookmarks(bookId) {
  const all = await _getBookmarks();
  return all[bookId] || [];
}

async function addBookmark(bookmark) {
  const all = await _getBookmarks();
  if (!all[bookmark.bookId]) all[bookmark.bookId] = [];
  all[bookmark.bookId].push(bookmark);
  await _saveBookmarks(all);
}

async function removeBookmark(bookId, bookmarkId) {
  const all = await _getBookmarks();
  if (!all[bookId]) return;
  all[bookId] = all[bookId].filter(b => b.bookmarkId !== bookmarkId);
  await _saveBookmarks(all);
}

async function checkBookmark(bookId, cfi) {
  const bookmarks = await getBookmarks(bookId);
  const found = bookmarks.find(b => b.cfi === cfi);
  return { exists: !!found, bookmarkId: found ? found.bookmarkId : null };
}

async function getAnnotations(bookId) {
  const all = await _getAnnotations();
  return all[bookId] || [];
}

async function addAnnotation(annotation) {
  const all = await _getAnnotations();
  if (!all[annotation.bookId]) all[annotation.bookId] = [];
  all[annotation.bookId].push(annotation);
  await _saveAnnotations(all);
}

async function updateAnnotation(bookId, annotationId, patch) {
  const all = await _getAnnotations();
  if (!all[bookId]) return;
  const idx = all[bookId].findIndex(a => a.annotationId === annotationId);
  if (idx === -1) return;
  all[bookId][idx] = Object.assign({}, all[bookId][idx], patch, {
    updatedAt: Date.now(),
  });
  await _saveAnnotations(all);
}

async function removeAnnotation(bookId, annotationId) {
  const all = await _getAnnotations();
  if (!all[bookId]) return;
  all[bookId] = all[bookId].filter(a => a.annotationId !== annotationId);
  await _saveAnnotations(all);
}

async function removeAllForBook(bookId) {
  const bm  = await _getBookmarks();
  const ann = await _getAnnotations();
  delete bm[bookId];
  delete ann[bookId];
  await _saveBookmarks(bm);
  await _saveAnnotations(ann);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getBookmarks, addBookmark, removeBookmark, checkBookmark, getAnnotations, addAnnotation, updateAnnotation, removeAnnotation, removeAllForBook };
}
