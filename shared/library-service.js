'use strict';

const LIBRARY_KEY  = 'library';
const SESSIONS_KEY = 'sessions';
const PREFS_KEY    = 'preferences';

async function getAllLibraryEntries() {
  const result = await browser.storage.local.get(LIBRARY_KEY);
  return result[LIBRARY_KEY] || {};
}

async function getLibraryEntry(bookId) {
  const lib = await getAllLibraryEntries();
  return lib[bookId] || null;
}

async function addLibraryEntry(entry) {
  const lib = await getAllLibraryEntries();
  lib[entry.bookId] = entry;
  await browser.storage.local.set({ [LIBRARY_KEY]: lib });
}

async function updateLibraryEntry(bookId, patch) {
  const lib = await getAllLibraryEntries();
  if (!lib[bookId]) return;
  lib[bookId] = Object.assign({}, lib[bookId], patch);
  await browser.storage.local.set({ [LIBRARY_KEY]: lib });
}

async function removeLibraryEntry(bookId) {
  const lib = await getAllLibraryEntries();
  delete lib[bookId];
  await browser.storage.local.set({ [LIBRARY_KEY]: lib });
}

async function getSession(bookId) {
  const result = await browser.storage.local.get(SESSIONS_KEY);
  const sessions = result[SESSIONS_KEY] || {};
  return sessions[bookId] || null;
}

async function upsertSession(bookId, sessionData) {
  const result = await browser.storage.local.get(SESSIONS_KEY);
  const sessions = result[SESSIONS_KEY] || {};
  sessions[bookId] = Object.assign({}, sessions[bookId], sessionData);
  await browser.storage.local.set({ [SESSIONS_KEY]: sessions });
}

async function removeSession(bookId) {
  const result = await browser.storage.local.get(SESSIONS_KEY);
  const sessions = result[SESSIONS_KEY] || {};
  delete sessions[bookId];
  await browser.storage.local.set({ [SESSIONS_KEY]: sessions });
}

async function getPreferences() {
  const result = await browser.storage.local.get(PREFS_KEY);
  return Object.assign({}, DEFAULT_PREFERENCES, result[PREFS_KEY] || {});
}

async function updatePreferences(patch) {
  const current = await getPreferences();
  const updated = Object.assign({}, current, patch);
  await browser.storage.local.set({ [PREFS_KEY]: updated });
  return updated;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAllLibraryEntries, getLibraryEntry, addLibraryEntry, updateLibraryEntry, removeLibraryEntry, getSession, upsertSession, removeSession, getPreferences, updatePreferences };
}
