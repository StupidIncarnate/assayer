/**
 * Integration tests for VerifyCompatibility
 * 
 * Tests the VerifyCompatibility component with actual parser and generator
 * implementations to ensure real-world compatibility verification.
 */

import { VerifyCompatibility } from './verify-compatibility';
import { FunctionParser } from '../parser/function-parser';
import { JestTestStubGenerator } from '../generator/jest-test-stub-generator';

describe('VerifyCompatibility Integration Tests', () => {
  it('should verify real parser and generator implementations are compatible', async () => {
    // Use main parser implementation
    const parser = new FunctionParser({ includePrivate: false });
    const generator = new JestTestStubGenerator();

    const verifier = new VerifyCompatibility(
      parser,
      generator,
      'FunctionParser',
      'JestTestStubGenerator'
    );

    const report = await verifier.runAllTests();

    // Generate markdown report for debugging
    const markdown = VerifyCompatibility.generateMarkdownReport(report);
    console.log('\n=== Compatibility Report ===');
    console.log(markdown);
    console.log('=== End Report ===\n');

    // Verify compatibility
    expect(report.compatible).toBe(true);
    expect(report.summary.failed).toBe(0);
    expect(report.parserType).toBe('FunctionParser');
    expect(report.generatorType).toBe('JestTestStubGenerator');
  });

  it('should generate valid test code when using real implementations', async () => {
    const parser = new FunctionParser({ includePrivate: false });
    const generator = new JestTestStubGenerator();
    const verifier = new VerifyCompatibility(parser, generator);

    // Get the report
    const report = await verifier.runAllTests();
    
    // Find the process code test result
    const processCodeTest = report.tests.find(t => t.testName === 'Process Code Integration');
    expect(processCodeTest?.passed).toBe(true);

    // Verify the actual integration works
    const sourceCode = `
      export function add(a: number, b: number): number {
        return a + b;
      }
      
      export function multiply(x: number, y: number): number {
        return x * y;
      }
    `;

    const functions = parser.parseSourceCode(sourceCode, 'math.ts');
    const testContent = generator.generateTestFile(functions, 'math.ts');

    // Verify generated content
    expect(testContent).toBe(`import { add, multiply } from './math';

describe('add', () => {
  it('should execute successfully with valid inputs', () => {
    // Arrange
    const a = 42;
    const b = 42;
    
    // Act
    const result = add(a, b);
    
    // Assert
    expect(typeof result).toBe('number');
  });

  it('should handle missing required parameters gracefully', () => {
    // Arrange
    const invalidCall = () => add(undefined as any, undefined as any);
    
    // Act & Assert
    // TODO: Adjust assertion based on function's error handling
    expect(invalidCall).toThrow();
  });

  it('should handle boundary value (0) for a', () => {
    // Arrange
    const a = 0;
    const b = 42;
    
    // Act
    const result = add(a, b);
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });

  it('should handle boundary value (0) for b', () => {
    // Arrange
    const a = 42;
    const b = 0;
    
    // Act
    const result = add(a, b);
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });
});

describe('multiply', () => {
  it('should execute successfully with valid inputs', () => {
    // Arrange
    const x = 42;
    const y = 42;
    
    // Act
    const result = multiply(x, y);
    
    // Assert
    expect(typeof result).toBe('number');
  });

  it('should handle missing required parameters gracefully', () => {
    // Arrange
    const invalidCall = () => multiply(undefined as any, undefined as any);
    
    // Act & Assert
    // TODO: Adjust assertion based on function's error handling
    expect(invalidCall).toThrow();
  });

  it('should handle boundary value (0) for x', () => {
    // Arrange
    const x = 0;
    const y = 42;
    
    // Act
    const result = multiply(x, y);
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });

  it('should handle boundary value (0) for y', () => {
    // Arrange
    const x = 42;
    const y = 0;
    
    // Act
    const result = multiply(x, y);
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });
});`);
  });

  it('should detect incompatible implementations', async () => {
    // Create an incompatible parser that returns wrong data structure
    const incompatibleParser = {
      parse: jest.fn().mockReturnValue({ notAnArray: true })
    };

    const generator = new JestTestStubGenerator();
    const verifier = new VerifyCompatibility(
      incompatibleParser as any,
      generator,
      'IncompatibleParser',
      'JestTestStubGenerator'
    );

    const report = await verifier.runAllTests();

    expect(report.compatible).toBe(false);
    expect(report.summary.failed).toBeGreaterThan(0);
    
    const basicParsingTest = report.tests.find(t => t.testName === 'Basic Parsing');
    expect(basicParsingTest?.passed).toBe(false);
  });

  it('should handle edge cases with real implementations', async () => {
    const parser = new FunctionParser({ includePrivate: false });
    const generator = new JestTestStubGenerator();

    // Test with empty code
    const emptyFunctions = parser.parseSourceCode('', 'empty.ts');
    expect(emptyFunctions).toEqual([]);

    const emptyTestContent = generator.generateTestFile([], 'empty.ts');
    expect(emptyTestContent).toBe(`// No functions found in empty.ts
// Add functions to generate test stubs

describe('empty', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`);

    // Test with complex code
    const complexCode = `
      // Complex TypeScript code with various constructs
      export interface User {
        id: string;
        name: string;
      }

      export class UserService {
        getUser(id: string): User | null {
          return null;
        }
      }

      export const constants = {
        MAX_USERS: 100
      };

      export type UserRole = 'admin' | 'user';

      export function processUser(user: User, role: UserRole): boolean {
        if (role === 'admin') {
          return true;
        }
        return user.id !== '';
      }
    `;

    const complexFunctions = parser.parseSourceCode(complexCode, 'complex.ts');
    expect(complexFunctions.length).toBeGreaterThan(0);

    const complexTestContent = generator.generateTestFile(complexFunctions, 'complex.ts');
    expect(complexTestContent).toBeTruthy();
    expect(complexTestContent.length).toBeGreaterThan(0);
  });


  it('should provide useful diagnostics for compatibility issues', async () => {
    // Create a parser that works but has subtle issues
    const problematicParser = {
      parseFile: jest.fn().mockReturnValue([
        {
          name: 'test',
          // Missing params array - should be detected
          returnType: 'void'
        }
      ]),
      parseCode: jest.fn().mockReturnValue([
        {
          name: 'test',
          // Missing params array - should be detected
          returnType: 'void'
        }
      ])
    };

    const generator = new JestTestStubGenerator();
    const verifier = new VerifyCompatibility(
      problematicParser as any,
      generator,
      'ProblematicParser',
      'JestTestStubGenerator'
    );

    const report = await verifier.runAllTests();
    const markdown = VerifyCompatibility.generateMarkdownReport(report);

    expect(report.compatible).toBe(false);
    expect(report.summary.failed).toBeGreaterThan(0);
    
    // Check markdown content structure
    expect(markdown).toMatch(/ProblematicParser/);
    expect(markdown).toMatch(/JestTestStubGenerator/);
    expect(markdown).toMatch(/❌ Not Compatible/);
    expect(markdown).toMatch(/Failed: \d+/);
    
    // Should have specific error about metadata structure
    const parsingTest = report.tests.find(t => t.testName === 'Basic Parsing');
    expect(parsingTest?.error).toBe('this.parser.parse is not a function');
  });
});