/**
 * Tests to ensure JestTestStubGenerator properly implements Generator interface
 */

import { JestTestStubGenerator } from './jest-test-stub-generator';
import { Generator, GeneratorConfig } from '../types/generator';
import { FunctionMetadata } from '../types/metadata';

describe('JestTestStubGenerator Generator compliance', () => {
  let generator: Generator;

  beforeEach(() => {
    generator = new JestTestStubGenerator();
  });

  describe('interface implementation', () => {
    it('should implement all Generator methods', () => {
      // Verify methods exist and are functions
      expect(typeof generator.generateTestStub).toBe('function');
      expect(generator.generateTestStub.length).toBe(3); // function, path, options?
      
      expect(typeof generator.generateTestFile).toBe('function');
      expect(generator.generateTestFile.length).toBe(3); // functions[], path, options?
      
      expect(typeof generator.getTestFilePath).toBe('function');
      expect(generator.getTestFilePath.length).toBe(2); // path, options?
      
      expect(typeof generator.validateTestContent).toBe('function');
      expect(generator.validateTestContent.length).toBe(1); // content
    });

    it('should be assignable to Generator type', () => {
      const typedGenerator: Generator = generator;
      expect(typedGenerator).toBeInstanceOf(JestTestStubGenerator);
      expect(typedGenerator).toBe(generator); // Same reference
    });
  });

  describe('generateTestStub with options', () => {
    const functionMeta: FunctionMetadata = {
      name: 'testFunction',
      params: [
        { name: 'value', type: 'string' },
        { name: 'count', type: 'number' }
      ],
      returnType: 'Promise<string[]>'
    };

    it('should respect includeEdgeCases option', () => {
      const withEdgeCases = generator.generateTestStub(
        functionMeta,
        'src/test.ts',
        { includeEdgeCases: true }
      );

      const withoutEdgeCases = generator.generateTestStub(
        functionMeta,
        'src/test.ts',
        { includeEdgeCases: false }
      );

      // Edge case tests should be included/excluded based on option
      const withEdgeCaseTests = [...withEdgeCases.matchAll(/it\('should handle.*', \(\) => \{/g)];
      const withoutEdgeCaseTests = [...withoutEdgeCases.matchAll(/it\('should handle.*', \(\) => \{/g)];
      
      // With edge cases should have more tests
      expect(withEdgeCaseTests.length).toBeGreaterThan(1);
      expect(withoutEdgeCaseTests.length).toBe(1); // Only the error handling test
      
      // Verify specific edge case content
      expect(withEdgeCases).toMatch(/should handle empty string for value/);
      expect(withEdgeCases).toMatch(/should handle boundary value \(0\) for count/);
      expect(withoutEdgeCases).not.toMatch(/should handle empty string for value/);
      expect(withoutEdgeCases).not.toMatch(/should handle boundary value/);
    });

    it('should respect includeAsyncTests option', () => {
      const withAsync = generator.generateTestStub(
        functionMeta,
        'src/test.ts',
        { includeAsyncTests: true }
      );

      const withoutAsync = generator.generateTestStub(
        functionMeta,
        'src/test.ts',
        { includeAsyncTests: false }
      );

      // Async tests should be included/excluded based on option
      const withAsyncTest = withAsync.match(/it\('should handle async operation correctly', async \(\) => \{[\s\S]*?\}\);/m);
      const withoutAsyncTest = withoutAsync.match(/it\('should handle async operation correctly'/m);
      
      expect(withAsyncTest).toBeTruthy();
      expect(withoutAsyncTest).toBeFalsy();
      
      // Verify async syntax is used correctly
      expect(withAsync).toMatch(/async \(\) => \{/);
      expect(withAsync).toMatch(/await testFunction\(/);
      expect(withoutAsync.includes('async () => {')).toBe(false);
      expect(withoutAsync.includes('await')).toBe(false);
    });
  });

  describe('getTestFilePath', () => {
    it('should generate correct test file path with default pattern', () => {
      const result = generator.getTestFilePath('src/components/Button.ts');
      expect(result).toBe('src/components/Button.test.ts');
    });

    it('should handle custom test file patterns', () => {
      const options: GeneratorConfig = {
        testFilePattern: '.spec'
      };
      
      const result = generator.getTestFilePath('src/utils/helper.ts', options);
      expect(result).toBe('src/utils/helper.spec.ts');
    });

    it('should handle different file extensions', () => {
      expect(generator.getTestFilePath('src/App.tsx')).toBe('src/App.test.ts');
      expect(generator.getTestFilePath('src/index.js')).toBe('src/index.test.ts');
      expect(generator.getTestFilePath('src/config.jsx')).toBe('src/config.test.ts');
    });

    it('should handle files in root directory', () => {
      const result = generator.getTestFilePath('index.ts');
      expect(result).toBe('index.test.ts');
    });
  });

  describe('validateTestContent', () => {
    it('should validate valid Jest test content', () => {
      const validContent = `
import { testFunc } from './test';

describe('testFunc', () => {
  it('should work', () => {
    expect(testFunc()).toBe(true);
  });
});`;

      expect(generator.validateTestContent(validContent)).toBe(true);
    });

    it('should invalidate content without describe blocks', () => {
      const invalidContent = `
import { testFunc } from './test';

it('should work', () => {
  expect(testFunc()).toBe(true);
});`;

      expect(generator.validateTestContent(invalidContent)).toBe(false);
    });

    it('should invalidate content without test cases', () => {
      const invalidContent = `
import { testFunc } from './test';

describe('testFunc', () => {
  // No tests
});`;

      expect(generator.validateTestContent(invalidContent)).toBe(false);
    });

    it('should invalidate content with unbalanced braces', () => {
      const invalidContent = `
import { testFunc } from './test';

describe('testFunc', () => {
  it('should work', () => {
    expect(testFunc()).toBe(true);
  });
// Missing closing brace`;

      expect(generator.validateTestContent(invalidContent)).toBe(false);
    });

    it('should accept test() as alternative to it()', () => {
      const validContent = `
import { testFunc } from './test';

describe('testFunc', () => {
  test('should work', () => {
    expect(testFunc()).toBe(true);
  });
});`;

      expect(generator.validateTestContent(validContent)).toBe(true);
    });
  });

  describe('generateTestFile with options', () => {
    const functionsMetadata: FunctionMetadata[] = [
      {
        name: 'func1',
        params: [{ name: 'input', type: 'string' }],
        returnType: 'string'
      },
      {
        name: 'func2',
        params: [{ name: 'data', type: 'number[]' }],
        returnType: 'Promise<number>'
      }
    ];

    it('should generate test file respecting options', () => {
      const options: GeneratorConfig = {
        includeEdgeCases: false,
        includeAsyncTests: false
      };

      const result = generator.generateTestFile(
        functionsMetadata,
        'src/utils.ts',
        options
      );

      // Should have basic tests but not edge cases
      const func1Tests = result.match(/describe\('func1', \(\) => \{[\s\S]*?\}\);/m);
      const func2Tests = result.match(/describe\('func2', \(\) => \{[\s\S]*?\}\);/m);
      
      expect(func1Tests).toBeTruthy();
      expect(func2Tests).toBeTruthy();
      
      // Verify no edge case tests for func1 (string param)
      expect(func1Tests![0].includes('should handle empty string')).toBe(false);
      
      // Verify no edge case tests for func2 (array param)
      expect(func2Tests![0].includes('should handle empty array')).toBe(false);
      
      // Verify no async tests for func2 (returns Promise)
      expect(func2Tests![0].includes('should handle async operation')).toBe(false);
      
      // But should still have basic test
      expect(func1Tests![0].includes('should execute successfully with valid inputs')).toBe(true);
      expect(func2Tests![0].includes('should execute successfully with valid inputs')).toBe(true);
    });
  });

  describe('framework option support', () => {
    it('should accept framework option without error', () => {
      const functionMeta: FunctionMetadata = {
        name: 'test',
        params: [],
        returnType: 'void'
      };

      const options: GeneratorConfig = {
        framework: 'jest'
      };

      expect(() => {
        generator.generateTestStub(functionMeta, 'test.ts', options);
      }).not.toThrow();
    });
  });
});