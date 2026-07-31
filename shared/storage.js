'use strict';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('books')) {
        const books = db.createObjectStore('books', { keyPath: 'bookId' });
        books.createIndex('storedAt', 'storedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('covers')) {
        db.createObjectStore('covers', { keyPath: 'bookId' });
      }
    };
    req.onsuccess = e => {
      _db = e.target.result;
      _db.onclose      = () => { _db = null; };
      _db.onversionchange = () => { _db.close(); _db = null; };
      resolve(_db);
    };
    req.onerror   = e => reject(e.target.error);
  });
}

function idbTx(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  }));
}

async function saveBook(bookId, arrayBuffer, sizeBytes) {
  return idbTx('books', 'readwrite', store =>
    store.put({ bookId, data: arrayBuffer, sizeBytes, storedAt: Date.now() })
  );
}

async function getBook(bookId) {
  const record = await idbTx('books', 'readonly', store => store.get(bookId));
  return record ? record.data : null;
}

async function deleteBook(bookId) {
  return idbTx('books', 'readwrite', store => store.delete(bookId));
}

async function saveCover(bookId, blob, mimeType) {
  return idbTx('covers', 'readwrite', store =>
    store.put({ bookId, blob, mimeType })
  );
}

async function getCoverRecord(bookId) {
  return idbTx('covers', 'readonly', store => store.get(bookId));
}

async function deleteCover(bookId) {
  return idbTx('covers', 'readwrite', store => store.delete(bookId));
}

async function deleteBookData(bookId) {
  await deleteBook(bookId);
  await deleteCover(bookId);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { openDB, saveBook, getBook, deleteBook, saveCover, getCoverRecord, deleteCover, deleteBookData, arrayBufferToBase64, base64ToArrayBuffer, blobToBase64 };
}
