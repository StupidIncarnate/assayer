/**
 * GeneratedTestValidator - Validates that generated tests actually execute and pass
 * 
 * This component addresses the critical gap of verifying that generated test files
 * are not only syntactically correct but also executable and pass when run.
 * It provides comprehensive test execution validation for the Assayer project.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { FunctionToTestIntegration, IntegrationResult } from '../function-to-test-integration';

/**
 * Result of test execution validation
 */
export interface ValidationResult {
  /** Path to the test file that was executed */
  testPath: string;
  /** Whether the test execution was successful */
  success: boolean;
  /** Number of test cases that passed */
  passingTests: number;
  /** Number of test cases that failed */
  failingTests: number;
  /** Number of test suites that ran */
  testSuites: number;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Raw output from Jest execution */
  output: string;
  /** Error output if execution failed */
  error?: string;
  /** Whether the test file exists and is readable */
  fileExists: boolean;
  /** Whether the test file has valid syntax */
  syntaxValid: boolean;
  /** Coverage information if available */
  coverage?: CoverageInfo;
}

/**
 * Coverage information from test execution
 */
export interface CoverageInfo {
  /** Statement coverage percentage */
  statements: number;
  /** Branch coverage percentage */
  branches: number;
  /** Function coverage percentage */
  functions: number;
  /** Line coverage percentage */
  lines: number;
}

/**
 * Options for configuring test validation
 */
export interface ValidationOptions {
  /** Timeout for test execution in milliseconds */
  timeout?: number;
  /** Whether to collect coverage information */
  collectCoverage?: boolean;
  /** Whether to run tests in silent mode */
  silent?: boolean;
  /** Custom Jest configuration path */
  jestConfig?: string;
  /** Environment variables to pass to Jest */
  env?: Record<string, string>;
  /** Whether to bail on first test failure */
  bail?: boolean;
  /** Maximum number of worker processes */
  maxWorkers?: number;
}

/**
 * Comprehensive validation result for end-to-end testing
 */
export interface EndToEndValidationResult {
  /** Source file that was processed */
  sourcePath: string;
  /** Generated test file path */
  testPath: string;
  /** Integration result from test generation */
  integrationResult: IntegrationResult;
  /** Validation result from test execution */
  validationResult: ValidationResult;
  /** Whether the entire end-to-end process succeeded */
  success: boolean;
  /** Total time for generation and execution */
  totalTime: number;
  /** Summary of the validation process */
  summary: string;
}

/**
 * Main validator class that executes and validates generated tests
 */
export class GeneratedTestValidator {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly jestCommand = 'npx jest';

  /**
   * Validates that a generated test file executes successfully
   * 
   * @param testPath - Path to the generated test file
   * @param options - Configuration options
   * @returns Promise resolving to validation result
   */
  async validateGeneratedTest(testPath: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    const result: ValidationResult = {
      testPath: resolve(testPath),
      success: false,
      passingTests: 0,
      failingTests: 0,
      testSuites: 0,
      executionTime: 0,
      output: '',
      fileExists: false,
      syntaxValid: false,
    };

    const startTime = Date.now();

    try {
      // Check if test file exists
      result.fileExists = existsSync(testPath);
      if (!result.fileExists) {
        result.error = `Test file does not exist: ${testPath}`;
        return result;
      }

      // Validate syntax
      const syntaxValidation = this.validateSyntax(testPath);
      result.syntaxValid = syntaxValidation.valid;
      if (!result.syntaxValid) {
        result.error = `Syntax validation failed: ${syntaxValidation.error}`;
        return result;
      }

      // Execute the test
      const executionResult = await this.executeTest(testPath, options);
      result.output = executionResult.output;
      result.error = executionResult.error;
      result.success = executionResult.success;
      result.executionTime = Date.now() - startTime;

      // Parse Jest output for test statistics
      this.parseJestOutput(executionResult.output, result);

      // Extract coverage information if available
      if (options.collectCoverage && executionResult.success) {
        result.coverage = this.extractCoverageInfo(executionResult.output);
      }

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.executionTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Validates multiple test files in batch
   * 
   * @param testPaths - Array of test file paths
   * @param options - Configuration options
   * @returns Promise resolving to array of validation results
   */
  async validateMultipleTests(testPaths: string[], options: ValidationOptions = {}): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const testPath of testPaths) {
      const result = await this.validateGeneratedTest(testPath, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Performs end-to-end validation: generates test and validates execution
   * 
   * @param sourcePath - Path to the source file to generate tests for
   * @param options - Configuration options
   * @returns Promise resolving to comprehensive validation result
   */
  async validateEndToEnd(sourcePath: string, options: ValidationOptions = {}): Promise<EndToEndValidationResult> {
    const startTime = Date.now();
    const integration = new FunctionToTestIntegration();

    // Generate the test
    const integrationResult = await integration.generateTests(sourcePath, {
      overwrite: true,
      verbose: !options.silent,
    });

    // Validate the generated test
    let validationResult: ValidationResult;
    if (integrationResult.success) {
      validationResult = await this.validateGeneratedTest(integrationResult.testPath, options);
    } else {
      // Create a failed validation result
      validationResult = {
        testPath: integrationResult.testPath,
        success: false,
        passingTests: 0,
        failingTests: 0,
        testSuites: 0,
        executionTime: 0,
        output: '',
        fileExists: false,
        syntaxValid: false,
        error: `Test generation failed: ${integrationResult.error}`,
      };
    }

    const totalTime = Date.now() - startTime;
    const success = integrationResult.success && validationResult.success;

    return {
      sourcePath,
      testPath: integrationResult.testPath,
      integrationResult,
      validationResult,
      success,
      totalTime,
      summary: this.generateSummary(integrationResult, validationResult, success),
    };
  }

  /**
   * Validates syntax of a test file
   * 
   * @param testPath - Path to the test file
   * @returns Validation result
   */
  private validateSyntax(testPath: string): { valid: boolean; error?: string } {
    try {
      const content = readFileSync(testPath, 'utf-8');
      
      // Basic syntax checks
      if (!content.includes('describe(')) {
        return { valid: false, error: 'No test suites found (missing describe blocks)' };
      }

      if (!content.includes('it(') && !content.includes('test(')) {
        return { valid: false, error: 'No test cases found (missing it/test blocks)' };
      }

      // Check for balanced parentheses and braces
      const parentheses = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;
      const braces = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
      const brackets = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;

      if (parentheses !== 0) {
        return { valid: false, error: 'Unbalanced parentheses in test file' };
      }

      if (braces !== 0) {
        return { valid: false, error: 'Unbalanced braces in test file' };
      }

      if (brackets !== 0) {
        return { valid: false, error: 'Unbalanced brackets in test file' };
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
   * Executes a test file using Jest
   * 
   * @param testPath - Path to the test file
   * @param options - Configuration options
   * @returns Promise resolving to execution result
   */
  private async executeTest(testPath: string, options: ValidationOptions = {}): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const args = [
        'jest',
        testPath,
        '--no-cache',
        '--verbose',
      ];

      // Add optional flags
      if (options.collectCoverage) {
        args.push('--coverage');
      }

      if (options.silent) {
        args.push('--silent');
      }

      if (options.bail) {
        args.push('--bail');
      }

      if (options.maxWorkers) {
        args.push(`--maxWorkers=${options.maxWorkers}`);
      }

      if (options.jestConfig) {
        args.push(`--config=${options.jestConfig}`);
      }

      const childProcess = spawn('npx', args, {
        cwd: dirname(testPath),
        env: { ...process.env, ...options.env },
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        childProcess.kill('SIGTERM');
        resolve({
          success: false,
          output: stdout,
          error: `Test execution timed out after ${options.timeout || this.defaultTimeout}ms`,
        });
      }, options.timeout || this.defaultTimeout);

      childProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        const output = stdout + stderr;
        const success = code === 0;
        
        resolve({
          success,
          output,
          error: success ? undefined : `Test execution failed with exit code ${code}`,
        });
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          output: stdout,
          error: `Failed to execute test: ${error.message}`,
        });
      });
    });
  }

  /**
   * Parses Jest output to extract test statistics
   * 
   * @param output - Raw Jest output
   * @param result - Validation result to populate
   */
  private parseJestOutput(output: string, result: ValidationResult): void {
    // Parse test results
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const suiteMatch = output.match(/Test Suites: .*?(\d+) passed/);
    const timeMatch = output.match(/Time:\s+(\d+(?:\.\d+)?)\s*s/);

    result.passingTests = passMatch ? parseInt(passMatch[1], 10) : 0;
    result.failingTests = failMatch ? parseInt(failMatch[1], 10) : 0;
    result.testSuites = suiteMatch ? parseInt(suiteMatch[1], 10) : 0;
    
    if (timeMatch) {
      result.executionTime = parseFloat(timeMatch[1]) * 1000; // Convert to milliseconds
    }
  }

  /**
   * Extracts coverage information from Jest output
   * 
   * @param output - Raw Jest output
   * @returns Coverage information or undefined
   */
  private extractCoverageInfo(output: string): CoverageInfo | undefined {
    // Look for coverage table in output
    const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)/);
    
    if (coverageMatch) {
      return {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4]),
      };
    }

    return undefined;
  }

  /**
   * Generates a summary of the validation process
   * 
   * @param integrationResult - Result from test generation
   * @param validationResult - Result from test execution
   * @param success - Overall success status
   * @returns Summary string
   */
  private generateSummary(
    integrationResult: IntegrationResult,
    validationResult: ValidationResult,
    success: boolean
  ): string {
    if (!success) {
      if (!integrationResult.success) {
        return `Test generation failed: ${integrationResult.error}`;
      }
      return `Test execution failed: ${validationResult.error}`;
    }

    const { passingTests, failingTests, testSuites, executionTime } = validationResult;
    const totalTests = passingTests + failingTests;
    
    return `✅ End-to-end validation successful: Generated ${totalTests} tests in ${testSuites} suites, ` +
           `${passingTests} passed, ${failingTests} failed, executed in ${executionTime}ms`;
  }

  /**
   * Utility method to validate a test file without execution
   * 
   * @param testPath - Path to the test file
   * @returns Basic validation result
   */
  validateTestFileStructure(testPath: string): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];
    
    try {
      if (!existsSync(testPath)) {
        return { valid: false, error: `Test file does not exist: ${testPath}` };
      }

      const content = readFileSync(testPath, 'utf-8');
      const syntaxResult = this.validateSyntax(testPath);
      
      if (!syntaxResult.valid) {
        return { valid: false, error: syntaxResult.error };
      }

      // Check for best practices
      if (!content.includes('expect(')) {
        warnings.push('No assertions found - tests may not be verifying behavior');
      }

      if (content.includes('TODO:')) {
        warnings.push('TODO comments found - tests may need completion');
      }

      if (!content.includes('// Arrange') && !content.includes('// Act') && !content.includes('// Assert')) {
        warnings.push('AAA pattern comments not found - consider adding for clarity');
      }

      return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

/**
 * Convenience function for quick test validation
 * 
 * @param testPath - Path to the test file to validate
 * @param options - Configuration options
 * @returns Promise resolving to validation result
 */
export async function validateTest(testPath: string, options?: ValidationOptions): Promise<ValidationResult> {
  const validator = new GeneratedTestValidator();
  return validator.validateGeneratedTest(testPath, options);
}

/**
 * Convenience function for end-to-end validation
 * 
 * @param sourcePath - Path to the source file
 * @param options - Configuration options
 * @returns Promise resolving to comprehensive validation result
 */
export async function validateEndToEnd(sourcePath: string, options?: ValidationOptions): Promise<EndToEndValidationResult> {
  const validator = new GeneratedTestValidator();
  return validator.validateEndToEnd(sourcePath, options);
}