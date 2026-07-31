'use strict';

const MessageType = Object.freeze({
  LIBRARY_GET_ALL:     'LIBRARY_GET_ALL',
  LIBRARY_OPEN_BOOK:   'LIBRARY_OPEN_BOOK',
  LIBRARY_ADD_BOOK:    'LIBRARY_ADD_BOOK',
  LIBRARY_REMOVE_BOOK: 'LIBRARY_REMOVE_BOOK',
  LIBRARY_GET_COVER:   'LIBRARY_GET_COVER',

  SESSION_SAVE:        'SESSION_SAVE',
  SESSION_GET:         'SESSION_GET',

  BOOK_GET_DATA:       'BOOK_GET_DATA',

  BOOKMARK_ADD:        'BOOKMARK_ADD',
  BOOKMARK_REMOVE:     'BOOKMARK_REMOVE',
  BOOKMARK_GET_ALL:    'BOOKMARK_GET_ALL',
  BOOKMARK_CHECK:      'BOOKMARK_CHECK',

  ANNOTATION_ADD:      'ANNOTATION_ADD',
  ANNOTATION_UPDATE:   'ANNOTATION_UPDATE',
  ANNOTATION_REMOVE:   'ANNOTATION_REMOVE',
  ANNOTATION_GET_ALL:  'ANNOTATION_GET_ALL',

  PREFERENCES_GET:     'PREFERENCES_GET',
  PREFERENCES_UPDATE:  'PREFERENCES_UPDATE',
});

const ErrorCode = Object.freeze({
  FILE_TOO_LARGE:       'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT:   'UNSUPPORTED_FORMAT',
  PARSE_ERROR:          'PARSE_ERROR',
  STORAGE_FULL:         'STORAGE_FULL',
  BOOK_NOT_FOUND:       'BOOK_NOT_FOUND',
  ANNOTATION_NOT_FOUND: 'ANNOTATION_NOT_FOUND',
  BOOKMARK_NOT_FOUND:   'BOOKMARK_NOT_FOUND',
  INVALID_CFI:          'INVALID_CFI',
});

const DEFAULT_PREFERENCES = Object.freeze({
  theme:         'light',
  fontFamily:    'Georgia, serif',
  fontSize:      100,
  lineHeight:    1.6,
  marginPercent: 8,
  flow:          'paginated',
});

const HIGHLIGHT_COLORS = Object.freeze(['yellow', 'green', 'blue', 'pink']);

const MAX_BOOK_SIZE_BYTES = 52_428_800;

const DB_NAME    = 'ebook-reader-db';
const DB_VERSION = 1;

const FONT_OPTIONS = Object.freeze([
  { label: 'Georgia',        value: 'Georgia, serif' },
  { label: 'Palatino',       value: '"Palatino Linotype", Palatino, serif' },
  { label: 'Arial',          value: 'Arial, sans-serif' },
  { label: 'Verdana',        value: 'Verdana, sans-serif' },
  { label: 'System Default', value: 'inherit' },
]);

const THEMES = Object.freeze({
  light: { background: '#ffffff', color: '#1a1a1a', toolbarBg: '#f5f5f5' },
  dark:  { background: '#1e1e1e', color: '#e0e0e0', toolbarBg: '#2a2a2a' },
  sepia: { background: '#F4ECD8', color: '#3b2a1a', toolbarBg: '#e8dcc4' },
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MessageType, ErrorCode, DEFAULT_PREFERENCES, HIGHLIGHT_COLORS, MAX_BOOK_SIZE_BYTES, DB_NAME, DB_VERSION, FONT_OPTIONS, THEMES };
}
