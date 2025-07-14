/**
 * Generator interface for creating test stubs from metadata.
 * Defines the contract that all test generators must implement for consistent behavior.
 */

import { FunctionMetadata } from './metadata';

/**
 * Generator configuration options
 */
export interface GeneratorConfig {
  /** Test framework to use (jest, vitest, etc.) */
  framework?: 'jest' | 'vitest' | 'mocha';
  /** Whether to include async tests */
  includeAsyncTests?: boolean;
  /** Whether to include edge case tests */
  includeEdgeCases?: boolean;
  /** Custom test file pattern */
  testFilePattern?: string;
  /** Whether to use TypeScript */
  useTypeScript?: boolean;
}

/**
 * Standard generator interface for Assayer.
 * All test generators must implement these methods to ensure consistent generation behavior.
 */
export interface Generator {
  /**
   * Generate a test file from function metadata
   * @param functions Array of function metadata
   * @param modulePath Path to the module being tested
   * @param options Optional configuration for test generation
   * @returns Generated test file content
   */
  generateTestFile(functions: FunctionMetadata[], modulePath: string, options?: GeneratorConfig): string;

  /**
   * Generate a single test stub for a function
   * @param func Function metadata
   * @param modulePath Path to the module being tested
   * @param options Optional configuration for test generation
   * @returns Generated test stub
   */
  generateTestStub(func: FunctionMetadata, modulePath: string, options?: GeneratorConfig): string;

  /**
   * Get the output path for a test file
   * @param sourcePath Path to the source file
   * @param options Optional configuration for test generation
   * @returns Path where the test file should be written
   */
  getTestFilePath(sourcePath: string, options?: GeneratorConfig): string;

  /**
   * Validate that generated test content is syntactically correct
   * @param testContent The test content to validate
   * @returns True if the test content is valid
   */
  validateTestContent(testContent: string): boolean;
}