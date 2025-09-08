import '@testing-library/jest-dom';

// Mock Chrome APIs for testing
const mockChrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  },
  windows: {
    create: vi.fn().mockResolvedValue({ id: 1 }),
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: mockChrome,
  writable: true,
});