/**
 * Bun test configuration for astro-gravatar package
 */

export default {
  // Test configuration
  test: {
    // Global test setup file
    preload: ['./src/__tests__/setup.ts'],

    // Test file patterns
    testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts', '**/*.spec.ts'],

    // Ignore patterns
    ignore: ['**/node_modules/**', '**/dist/**'],

    // Coverage configuration
    coverage: {
      // Include these files in coverage
      include: ['src/**/*.ts', 'src/**/*.astro'],

      // Exclude these files from coverage
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/__tests__/**'],

      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },

      // Coverage reporters
      reporters: ['text', 'html'],

      // Output directory for coverage reports
      outputDir: './coverage',
    },

    // Timeout for each test in milliseconds
    timeout: 10000,

    // Run tests in parallel
    concurrent: true,

    // Verbose output
    verbose: false,

    // Update snapshots automatically
    updateSnapshots: false,
  },
};
