import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/tests/unit/**/*.test.{js,jsx}'],
    globals: true,
    // критически важно для моков:
    env: { REACT_APP_API_URL: 'http://test-api' },
    deps: { inline: ['web-ifc-viewer', 'three'] },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});