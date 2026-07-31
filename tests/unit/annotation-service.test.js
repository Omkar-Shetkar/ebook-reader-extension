'use strict';

const { getBookmarks, addBookmark, removeBookmark, checkBookmark, getAnnotations, addAnnotation, updateAnnotation, removeAnnotation, removeAllForBook } = require('../../shared/annotation-service.js');

beforeEach(() => {
  browser.storage.local._reset();
});

const BK_ID = 'sha256-testbook';

const makeBookmark = (id = 'bm-1') => ({
  bookmarkId: id, bookId: BK_ID, cfi: `epubcfi(/6/${id}!)`,
  chapterTitle: 'Chapter 1', excerpt: 'Some text', label: 'My mark', createdAt: Date.now(),
});

const makeAnnotation = (id = 'ann-1') => ({
  annotationId: id, bookId: BK_ID, cfiRange: `epubcfi(/6/${id}!/1:0,1:10)`,
  text: 'highlighted text', color: 'yellow', note: '', spineIndex: 0,
  chapterTitle: 'Chapter 1', createdAt: Date.now(), updatedAt: Date.now(),
});

describe('Bookmark operations', () => {
  test('getBookmarks returns [] for new book', async () => {
    expect(await getBookmarks(BK_ID)).toEqual([]);
  });

  test('addBookmark then getBookmarks includes it', async () => {
    await addBookmark(makeBookmark());
    const bms = await getBookmarks(BK_ID);
    expect(bms).toHaveLength(1);
    expect(bms[0].bookmarkId).toBe('bm-1');
  });

  test('removeBookmark removes by id', async () => {
    await addBookmark(makeBookmark('bm-1'));
    await addBookmark(makeBookmark('bm-2'));
    await removeBookmark(BK_ID, 'bm-1');
    const bms = await getBookmarks(BK_ID);
    expect(bms).toHaveLength(1);
    expect(bms[0].bookmarkId).toBe('bm-2');
  });

  test('checkBookmark returns exists:true when found', async () => {
    const bm = makeBookmark();
    await addBookmark(bm);
    const result = await checkBookmark(BK_ID, bm.cfi);
    expect(result.exists).toBe(true);
    expect(result.bookmarkId).toBe(bm.bookmarkId);
  });

  test('checkBookmark returns exists:false for unknown cfi', async () => {
    const result = await checkBookmark(BK_ID, 'epubcfi(/6/999!)');
    expect(result.exists).toBe(false);
    expect(result.bookmarkId).toBeNull();
  });
});

describe('Annotation operations', () => {
  test('getAnnotations returns [] for new book', async () => {
    expect(await getAnnotations(BK_ID)).toEqual([]);
  });

  test('addAnnotation then getAnnotations includes it', async () => {
    await addAnnotation(makeAnnotation());
    const anns = await getAnnotations(BK_ID);
    expect(anns).toHaveLength(1);
    expect(anns[0].color).toBe('yellow');
  });

  test('updateAnnotation patches note and color', async () => {
    await addAnnotation(makeAnnotation('ann-1'));
    await updateAnnotation(BK_ID, 'ann-1', { note: 'My note', color: 'blue' });
    const anns = await getAnnotations(BK_ID);
    expect(anns[0].note).toBe('My note');
    expect(anns[0].color).toBe('blue');
    expect(anns[0].updatedAt).toBeGreaterThan(0);
  });

  test('removeAnnotation removes by id', async () => {
    await addAnnotation(makeAnnotation('ann-1'));
    await addAnnotation(makeAnnotation('ann-2'));
    await removeAnnotation(BK_ID, 'ann-1');
    const anns = await getAnnotations(BK_ID);
    expect(anns).toHaveLength(1);
    expect(anns[0].annotationId).toBe('ann-2');
  });
});

describe('removeAllForBook', () => {
  test('deletes all bookmarks and annotations for a book', async () => {
    await addBookmark(makeBookmark('bm-1'));
    await addAnnotation(makeAnnotation('ann-1'));
    await removeAllForBook(BK_ID);
    expect(await getBookmarks(BK_ID)).toEqual([]);
    expect(await getAnnotations(BK_ID)).toEqual([]);
  });

  test('does not affect other books', async () => {
    await addBookmark(makeBookmark('bm-1'));
    await addAnnotation({ ...makeAnnotation('ann-1'), bookId: 'other-book' });
    await removeAllForBook(BK_ID);
    const other = await getAnnotations('other-book');
    expect(other).toHaveLength(1);
  });
});
