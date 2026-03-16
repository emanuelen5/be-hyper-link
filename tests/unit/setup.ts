import '@testing-library/jest-dom';

// Stub the browser global for unit tests (matches webextension-polyfill API)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).browser = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    },
  },
  runtime: {
    sendMessage: () => Promise.resolve(),
    onMessage: { addListener: () => {} },
  },
  tabs: {
    query: () => Promise.resolve([]),
    sendMessage: () => Promise.resolve(),
  },
};
