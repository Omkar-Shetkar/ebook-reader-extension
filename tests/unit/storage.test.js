'use strict';

beforeAll(() => {
  global.DB_NAME    = 'ebook-reader-db';
  global.DB_VERSION = 1;
});

const { arrayBufferToBase64, base64ToArrayBuffer } = require('../../shared/storage.js');

describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
  test('round-trips an ArrayBuffer through base64', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]).buffer;
    const b64      = arrayBufferToBase64(original);
    const restored = base64ToArrayBuffer(b64);
    expect(new Uint8Array(restored)).toEqual(new Uint8Array(original));
  });

  test('handles empty buffer', () => {
    const buf = new Uint8Array(0).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(b64).toBe('');
    const restored = base64ToArrayBuffer(b64);
    expect(restored.byteLength).toBe(0);
  });

  test('handles large buffer (64k+)', () => {
    const large = new Uint8Array(70000).fill(42).buffer;
    const b64   = arrayBufferToBase64(large);
    const back  = base64ToArrayBuffer(b64);
    expect(new Uint8Array(back)).toEqual(new Uint8Array(large));
  });
});
