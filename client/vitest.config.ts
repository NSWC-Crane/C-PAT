/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { default: angular } = await import('@analogjs/vite-plugin-angular');

  return {
    plugins: [angular()],
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['src/test-setup.ts'],
      include: ['src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist'],
      reporters: ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/app/**/*.ts'],
        exclude: ['src/app/**/*.spec.ts', 'src/app/**/*.module.ts', 'src/app/**/index.ts', 'src/main.ts', 'src/polyfills.ts', 'src/environments/**'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        }
      }
    }
  };
});
