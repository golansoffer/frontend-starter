import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const testing = process.env['VITEST'] === 'true'

export default defineConfig({
  plugins: [
    !testing && tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    !testing && tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        '**/.tools/**',
        '**/coverage/**',
        '**/playwright-report/**',
        '**/test-results/**',
      ],
    },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { sourcemap: false },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    allowOnly: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/routeTree.gen.ts',
        'src/components/ui/**',
        // Wiring is exercised against the production build by Playwright.
        'src/main.tsx',
        'src/app/router.tsx',
        'src/routes/__root.tsx',
        'src/routes/_examples.tsx',
        'src/routes/_examples.index.tsx',
        'src/routes/_examples.profile.tsx',
        'src/routes/about.tsx',
      ],
      thresholds: {
        perFile: true,
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
})
