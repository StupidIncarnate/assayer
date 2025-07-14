/**
 * FunctionToTestIntegration - Generate working tests from simple functions
 * 
 * This component provides an end-to-end workflow for converting TypeScript functions
 * into executable Jest test files. It integrates the FunctionParser with
 * JestTestStubGenerator to create comprehensive test coverage.
 */

import { FunctionParser } from './parser/function-parser';
import { JestTestStubGenerator } from './generator/jest-test-stub-generator';
import { FunctionMetadata } from './types/metadata';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

/**
 * Result of the integration process
 */
export interface IntegrationResult {
  /** Path to the source file that was processed */
  sourcePath: string;
  /** Path to the generated test file */
  testPath: string;
  /** Array of function metadata that was extracted */
  functions: FunctionMetadata[];
  /** Generated test content */
  testContent: string;
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Options for configuring the integration process
 */
export interface IntegrationOptions {
  /** Custom output path for the test file */
  outputPath?: string;
  /** Whether to overwrite existing test files */
  overwrite?: boolean;
  /** Whether to include verbose logging */
  verbose?: boolean;
}

/**
 * Main integration class that orchestrates the parsing and test generation process
 */
export class FunctionToTestIntegration {
  private parser: FunctionParser;
  private generator: JestTestStubGenerator;

  constructor() {
    // Use FunctionParser with includePrivate=false to match SimpleFunctionParser behavior
    this.parser = new FunctionParser({ includePrivate: false });
    this.generator = new JestTestStubGenerator();
  }

  /**
   * Generates working Jest tests from a TypeScript source file
   * 
   * @param sourcePath - Path to the TypeScript source file
   * @param options - Configuration options
   * @returns Integration result with success status and generated content
   */
  async generateTests(sourcePath: string, options: IntegrationOptions = {}): Promise<IntegrationResult> {
    const result: IntegrationResult = {
      sourcePath,
      testPath: '',
      functions: [],
      testContent: '',
      success: false,
    };

    try {
      // Validate source file exists
      if (!existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      // Parse the source file
      if (options.verbose) {
        console.log(`Parsing ${sourcePath}...`);
      }

      const sourceFile = this.parser.createSourceFileFromPath(sourcePath);
      const functions = this.parser.parse(sourceFile);
      this.parser.getProject().removeSourceFile(sourceFile);
      result.functions = functions;

      if (functions.length === 0) {
        if (options.verbose) {
          console.log('No exported functions found in the file.');
        }
        // Still generate an empty test file
        result.testContent = this.generator.generateTestFile([], sourcePath);
      } else {
        if (options.verbose) {
          console.log(`Found ${functions.length} exported functions:`);
          functions.forEach((fn: FunctionMetadata) => {
            console.log(`  - ${fn.name}(${fn.params.map((p: any) => `${p.name}: ${p.type}`).join(', ')}): ${fn.returnType}`);
          });
        }

        // Generate test content
        result.testContent = this.generator.generateTestFile(functions, sourcePath);
      }

      // Determine output path
      result.testPath = options.outputPath || this.getDefaultTestPath(sourcePath);

      // Check if test file already exists and overwrite is false
      if (existsSync(result.testPath) && !options.overwrite) {
        throw new Error(`Test file already exists: ${result.testPath}. Use overwrite option to replace.`);
      }

      // Write the test file
      writeFileSync(result.testPath, result.testContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`Test file generated: ${result.testPath}`);
      }

      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.success = false;
      return result;
    }
  }

  /**
   * Generates tests from source code string (useful for testing)
   * 
   * @param sourceCode - TypeScript source code
   * @param fileName - Optional filename for better error messages
   * @returns Test content string
   */
  generateTestsFromCode(sourceCode: string, fileName: string = 'temp.ts'): string {
    const sourceFile = this.parser.createSourceFileFromCode(sourceCode, fileName);
    const functions = this.parser.parse(sourceFile);
    this.parser.getProject().removeSourceFile(sourceFile);
    return this.generator.generateTestFile(functions, fileName);
  }

  /**
   * Validates that the generated test file is syntactically correct
   * 
   * @param testPath - Path to the generated test file
   * @returns Validation result
   */
  validateGeneratedTest(testPath: string): { valid: boolean; error?: string } {
    try {
      if (!existsSync(testPath)) {
        return { valid: false, error: 'Test file does not exist' };
      }

      const testContent = readFileSync(testPath, 'utf-8');
      
      // Basic syntax validation - check for common issues
      if (!testContent.includes('describe(')) {
        return { valid: false, error: 'No test suites found (missing describe blocks)' };
      }

      if (!testContent.includes('it(')) {
        return { valid: false, error: 'No test cases found (missing it blocks)' };
      }

      if (!testContent.includes('expect(')) {
        return { valid: false, error: 'No assertions found (missing expect statements)' };
      }

      // Check for balanced parentheses and braces
      const parentheses = (testContent.match(/\(/g) || []).length - (testContent.match(/\)/g) || []).length;
      const braces = (testContent.match(/\{/g) || []).length - (testContent.match(/\}/g) || []).length;

      if (parentheses !== 0) {
        return { valid: false, error: 'Unbalanced parentheses in generated test' };
      }

      if (braces !== 0) {
        return { valid: false, error: 'Unbalanced braces in generated test' };
      }

      return { valid: true };

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Processes multiple source files in a directory
   * 
   * @param directoryPath - Path to directory containing TypeScript files
   * @param options - Configuration options
   * @returns Array of integration results
   */
  async generateTestsForDirectory(directoryPath: string, options: IntegrationOptions = {}): Promise<IntegrationResult[]> {
    const { readdirSync, statSync } = require('fs');
    const results: IntegrationResult[] = [];

    try {
      const entries = readdirSync(directoryPath);
      
      for (const entry of entries) {
        const fullPath = join(directoryPath, entry);
        const stats = statSync(fullPath);

        if (stats.isFile() && extname(entry) === '.ts' && !entry.endsWith('.test.ts')) {
          if (options.verbose) {
            console.log(`Processing ${fullPath}...`);
          }
          
          const result = await this.generateTests(fullPath, options);
          results.push(result);
        }
      }

      return results;

    } catch (error) {
      // Return a single failed result for directory processing
      return [{
        sourcePath: directoryPath,
        testPath: '',
        functions: [],
        testContent: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }];
    }
  }

  /**
   * Gets the default test file path for a source file
   * 
   * @param sourcePath - The source file path
   * @returns The test file path
   */
  private getDefaultTestPath(sourcePath: string): string {
    const dir = dirname(sourcePath);
    const filename = basename(sourcePath, '.ts');
    return join(dir, `${filename}.test.ts`);
  }

  /**
   * Utility method to get function metadata without generating tests
   * 
   * @param sourcePath - Path to the TypeScript source file
   * @returns Array of function metadata
   */
  extractFunctionMetadata(sourcePath: string): FunctionMetadata[] {
    const sourceFile = this.parser.createSourceFileFromPath(sourcePath);
    const functions = this.parser.parse(sourceFile);
    this.parser.getProject().removeSourceFile(sourceFile);
    return functions;
  }

  /**
   * Utility method to get function metadata from source code
   * 
   * @param sourceCode - TypeScript source code
   * @param fileName - Optional filename for better error messages
   * @returns Array of function metadata
   */
  extractFunctionMetadataFromCode(sourceCode: string, fileName: string = 'temp.ts'): FunctionMetadata[] {
    const sourceFile = this.parser.createSourceFileFromCode(sourceCode, fileName);
    const functions = this.parser.parse(sourceFile);
    this.parser.getProject().removeSourceFile(sourceFile);
    return functions;
  }
}

/**
 * Convenience function for quick test generation
 * 
 * @param sourcePath - Path to the TypeScript source file
 * @param outputPath - Optional output path for the test file
 * @returns Promise resolving to the integration result
 */
export async function generateTestsForFile(sourcePath: string, outputPath?: string): Promise<IntegrationResult> {
  const integration = new FunctionToTestIntegration();
  return integration.generateTests(sourcePath, { outputPath, verbose: true });
}

/**
 * Convenience function for generating tests from source code
 * 
 * @param sourceCode - TypeScript source code
 * @param fileName - Optional filename for better error messages
 * @returns Generated test content
 */
export function generateTestsFromCode(sourceCode: string, fileName?: string): string {
  const integration = new FunctionToTestIntegration();
  return integration.generateTestsFromCode(sourceCode, fileName);
}