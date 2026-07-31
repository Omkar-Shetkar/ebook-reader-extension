global.browser = {
  storage: {
    local: (() => {
      let store = {};
      return {
        get: jest.fn((keys) => {
          if (!keys) return Promise.resolve({ ...store });
          const result = {};
          const keyList = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys);
          keyList.forEach(k => { if (k in store) result[k] = store[k]; });
          return Promise.resolve(result);
        }),
        set: jest.fn((items) => {
          Object.assign(store, items);
          return Promise.resolve();
        }),
        remove: jest.fn((keys) => {
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach(k => delete store[k]);
          return Promise.resolve();
        }),
        _reset: () => { store = {}; },
      };
    })(),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    getURL: jest.fn(path => `moz-extension://test-id/${path}`),
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(() => Promise.resolve([])),
    update: jest.fn(),
  },
};
