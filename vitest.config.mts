import './src/tests/loadTestEnv'

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Mirrors the `paths` in tsconfig.json.
  resolve: {
    alias: {
      '@payload-config': path.resolve(import.meta.dirname, 'src/payload.config.ts'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    // next-intl's ESM build imports `next/server` without an extension, which Node cannot resolve.
    server: { deps: { inline: ['next-intl'] } },
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/tests/int/**/*.int.spec.ts', 'src/{i18n,lib,modules,payload}/**/*.spec.ts'],
    // Integration test files share one PostgreSQL database and apply migrations on start.
    fileParallelism: false,
    clearMocks: true,
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: process.env.CI
        ? ['text', 'text-summary', 'json-summary']
        : ['text', 'text-summary'],
      reportOnFailure: true,
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{js,jsx,ts,tsx}', 'src/modules/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/__tests__/**',
        'src/payload-types.ts',
        'src/app/(payload)/**',
      ],
    },
  },
})
