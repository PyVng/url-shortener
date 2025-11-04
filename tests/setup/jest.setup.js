// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Mock console.error and console.warn during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random test data
  generateRandomString: (length = 8) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Helper to generate test URLs
  generateTestUrl: () => {
    return `https://example.com/test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
};
