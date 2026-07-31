'use strict';

global.THEMES = {
  light: { background: '#ffffff', color: '#1a1a1a', toolbarBg: '#f5f5f5' },
  dark:  { background: '#1e1e1e', color: '#e0e0e0', toolbarBg: '#2a2a2a' },
  sepia: { background: '#F4ECD8', color: '#3b2a1a', toolbarBg: '#e8dcc4' },
};

global.DEFAULT_PREFERENCES = {
  theme: 'light', fontFamily: 'Georgia, serif', fontSize: 100,
  lineHeight: 1.6, marginPercent: 8, flow: 'paginated',
};

global.ePub = jest.fn();

const { getToc, applyPreferences, searchBook, getCurrentCfi } = require('../../shared/epub-service.js');

describe('getToc', () => {
  test('returns [] when book has no navigation', () => {
    const book = { navigation: null };
    expect(getToc(book)).toEqual([]);
  });

  test('returns [] when toc is empty', () => {
    const book = { navigation: { toc: [] } };
    expect(getToc(book)).toEqual([]);
  });

  test('flattens a flat list', () => {
    const book = {
      navigation: {
        toc: [
          { id: '1', label: 'Chapter 1', href: 'ch1.html', subitems: [] },
          { id: '2', label: 'Chapter 2', href: 'ch2.html', subitems: [] },
        ],
      },
    };
    const result = getToc(book);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: '1', label: 'Chapter 1', depth: 0 });
    expect(result[1]).toMatchObject({ id: '2', label: 'Chapter 2', depth: 0 });
  });

  test('flattens a nested hierarchy with correct depth', () => {
    const book = {
      navigation: {
        toc: [
          {
            id: '1', label: 'Part 1', href: 'part1.html',
            subitems: [
              { id: '1.1', label: 'Chapter 1', href: 'ch1.html', subitems: [] },
              { id: '1.2', label: 'Chapter 2', href: 'ch2.html', subitems: [
                { id: '1.2.1', label: 'Section', href: 'sec.html', subitems: [] },
              ]},
            ],
          },
        ],
      },
    };
    const result = getToc(book);
    expect(result).toHaveLength(4);
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(1);
    expect(result[2].depth).toBe(1);
    expect(result[3].depth).toBe(2);
    expect(result[3].label).toBe('Section');
  });

  test('trims whitespace from labels', () => {
    const book = {
      navigation: { toc: [{ id: '1', label: '  Chapter 1  ', href: 'ch1.html', subitems: [] }] },
    };
    const result = getToc(book);
    expect(result[0].label).toBe('Chapter 1');
  });
});

describe('applyPreferences', () => {
  let rendition;
  beforeEach(() => {
    rendition = {
      themes: {
        select:   jest.fn(),
        fontSize: jest.fn(),
        font:     jest.fn(),
        override: jest.fn(),
        register: jest.fn(),
      },
    };
  });

  test('calls themes.select with the correct theme', () => {
    applyPreferences(rendition, { ...DEFAULT_PREFERENCES, theme: 'dark' });
    expect(rendition.themes.select).toHaveBeenCalledWith('dark');
  });

  test('calls themes.fontSize with percentage string', () => {
    applyPreferences(rendition, { ...DEFAULT_PREFERENCES, fontSize: 120 });
    expect(rendition.themes.fontSize).toHaveBeenCalledWith('120%');
  });

  test('calls themes.font when fontFamily is not inherit', () => {
    applyPreferences(rendition, { ...DEFAULT_PREFERENCES, fontFamily: 'Arial, sans-serif' });
    expect(rendition.themes.font).toHaveBeenCalledWith('Arial, sans-serif');
  });

  test('does not call themes.font when fontFamily is inherit', () => {
    applyPreferences(rendition, { ...DEFAULT_PREFERENCES, fontFamily: 'inherit' });
    expect(rendition.themes.font).not.toHaveBeenCalled();
  });

  test('calls themes.override for line-height and padding', () => {
    applyPreferences(rendition, { ...DEFAULT_PREFERENCES, lineHeight: 1.8, marginPercent: 10 });
    expect(rendition.themes.override).toHaveBeenCalledWith('line-height', '1.8');
    expect(rendition.themes.override).toHaveBeenCalledWith('padding-left', '10%');
    expect(rendition.themes.override).toHaveBeenCalledWith('padding-right', '10%');
  });
});

describe('searchBook', () => {
  test('returns [] for empty query', async () => {
    const book = { search: jest.fn() };
    const result = await searchBook(book, '');
    expect(result).toEqual([]);
    expect(book.search).not.toHaveBeenCalled();
  });

  test('returns results from book.search', async () => {
    const results = [{ cfi: 'epubcfi(/6/2!)', excerpt: 'hello world' }];
    const book = { search: jest.fn().mockResolvedValue(results) };
    const r = await searchBook(book, 'hello');
    expect(r).toEqual(results);
  });

  test('returns [] when book.search throws', async () => {
    const book = { search: jest.fn().mockRejectedValue(new Error('search failed')) };
    const r = await searchBook(book, 'query');
    expect(r).toEqual([]);
  });
});

describe('getCurrentCfi', () => {
  test('returns cfi from rendition.currentLocation()', () => {
    const rendition = {
      currentLocation: () => ({ start: { cfi: 'epubcfi(/6/4!)' } }),
    };
    expect(getCurrentCfi(rendition)).toBe('epubcfi(/6/4!)');
  });

  test('returns null when currentLocation throws', () => {
    const rendition = { currentLocation: () => { throw new Error(); } };
    expect(getCurrentCfi(rendition)).toBeNull();
  });

  test('returns null when start is missing', () => {
    const rendition = { currentLocation: () => ({}) };
    expect(getCurrentCfi(rendition)).toBeNull();
  });
});
