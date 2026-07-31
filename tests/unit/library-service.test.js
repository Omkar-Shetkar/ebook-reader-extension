'use strict';

global.DEFAULT_PREFERENCES = {
  theme: 'light', fontFamily: 'Georgia, serif', fontSize: 100,
  lineHeight: 1.6, marginPercent: 8, flow: 'paginated',
};

jest.resetModules();
const libService = require('../../shared/library-service.js');
const { getAllLibraryEntries, getLibraryEntry, addLibraryEntry, updateLibraryEntry, removeLibraryEntry, getSession, upsertSession, removeSession, getPreferences, updatePreferences } = libService;

beforeEach(() => {
  browser.storage.local._reset();
});

const makeEntry = (bookId = 'sha256-abc') => ({
  bookId, title: 'Test Book', author: 'Author', hasCover: false,
  addedAt: Date.now(), lastReadAt: null, isFinished: false,
});

describe('LibraryEntry CRUD', () => {
  test('addLibraryEntry then getAllLibraryEntries returns it', async () => {
    const entry = makeEntry();
    await addLibraryEntry(entry);
    const all = await getAllLibraryEntries();
    expect(all[entry.bookId]).toMatchObject({ title: 'Test Book', author: 'Author' });
  });

  test('getLibraryEntry returns null for unknown bookId', async () => {
    const result = await getLibraryEntry('no-such-id');
    expect(result).toBeNull();
  });

  test('updateLibraryEntry patches fields', async () => {
    const entry = makeEntry();
    await addLibraryEntry(entry);
    await updateLibraryEntry(entry.bookId, { isFinished: true, lastReadAt: 12345 });
    const updated = await getLibraryEntry(entry.bookId);
    expect(updated.isFinished).toBe(true);
    expect(updated.lastReadAt).toBe(12345);
    expect(updated.title).toBe('Test Book');
  });

  test('removeLibraryEntry deletes entry', async () => {
    const entry = makeEntry();
    await addLibraryEntry(entry);
    await removeLibraryEntry(entry.bookId);
    expect(await getLibraryEntry(entry.bookId)).toBeNull();
  });

  test('multiple entries coexist', async () => {
    await addLibraryEntry(makeEntry('id-1'));
    await addLibraryEntry(makeEntry('id-2'));
    const all = await getAllLibraryEntries();
    expect(Object.keys(all)).toHaveLength(2);
  });
});

describe('Session CRUD', () => {
  test('getSession returns null when no session exists', async () => {
    expect(await getSession('unknown')).toBeNull();
  });

  test('upsertSession creates and retrieves session', async () => {
    await upsertSession('book1', { currentCfi: 'epubcfi(/6/2!)', progressPercent: 25 });
    const s = await getSession('book1');
    expect(s.currentCfi).toBe('epubcfi(/6/2!)');
    expect(s.progressPercent).toBe(25);
  });

  test('upsertSession merges fields on update', async () => {
    await upsertSession('book1', { currentCfi: 'epubcfi(/6/2!)', progressPercent: 10 });
    await upsertSession('book1', { progressPercent: 50 });
    const s = await getSession('book1');
    expect(s.currentCfi).toBe('epubcfi(/6/2!)');
    expect(s.progressPercent).toBe(50);
  });

  test('removeSession deletes session', async () => {
    await upsertSession('book1', { currentCfi: 'epubcfi(/6/2!)' });
    await removeSession('book1');
    expect(await getSession('book1')).toBeNull();
  });
});

describe('Preferences', () => {
  test('getPreferences returns defaults when nothing stored', async () => {
    const p = await getPreferences();
    expect(p.theme).toBe('light');
    expect(p.fontSize).toBe(100);
  });

  test('updatePreferences persists and returns merged object', async () => {
    const updated = await updatePreferences({ theme: 'dark', fontSize: 120 });
    expect(updated.theme).toBe('dark');
    expect(updated.fontSize).toBe(120);
    expect(updated.fontFamily).toBe(DEFAULT_PREFERENCES.fontFamily);
  });
});
