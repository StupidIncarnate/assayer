/**
 * Tests for the generator interface types
 */

import { Generator, GeneratorConfig } from './generator';
import { FunctionMetadata } from './metadata';

describe('Generator interface', () => {
  // Mock implementation for testing the interface contract
  class MockGenerator implements Generator {
    generateTestStub(
      functionMeta: FunctionMetadata,
      _modulePath: string,
      _options?: GeneratorConfig
    ): string {
      return `// Test stub for ${functionMeta.name}`;
    }

    generateTestFile(
      functionsMetadata: FunctionMetadata[],
      modulePath: string,
      options?: GeneratorConfig
    ): string {
      return functionsMetadata
        .map(fn => this.generateTestStub(fn, modulePath, options))
        .join('\n\n');
    }

    getTestFilePath(
      sourceFilePath: string,
      options?: GeneratorConfig
    ): string {
      const pattern = options?.testFilePattern || '.test';
      return sourceFilePath.replace(/\.ts$/, `${pattern}.ts`);
    }

    validateTestContent(testContent: string): boolean {
      return testContent.length > 0;
    }
  }

  let generator: Generator;

  beforeEach(() => {
    generator = new MockGenerator();
  });

  describe('generateTestStub', () => {
    it('should generate a test stub for a single function', () => {
      const functionMeta: FunctionMetadata = {
        name: 'testFunction',
        params: [],
        returnType: 'void'
      };

      const result = generator.generateTestStub(functionMeta, 'src/test.ts');

      // Verify exact output of mock implementation
      expect(result).toBe('// Test stub for testFunction');
      expect(result).toMatch(/^\/\/ Test stub for testFunction$/);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept optional generator options', () => {
      const functionMeta: FunctionMetadata = {
        name: 'testFunction',
        params: [],
        returnType: 'void'
      };

      const options: GeneratorConfig = {
        framework: 'jest',
        includeEdgeCases: true
      };

      const result = generator.generateTestStub(functionMeta, 'src/test.ts', options);

      // Verify it returns a string even with options
      expect(typeof result).toBe('string');
      expect(result).toBe('// Test stub for testFunction');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateTestFile', () => {
    it('should generate a test file for multiple functions', () => {
      const functionsMetadata: FunctionMetadata[] = [
        { name: 'func1', params: [], returnType: 'void' },
        { name: 'func2', params: [], returnType: 'string' }
      ];

      const result = generator.generateTestFile(functionsMetadata, 'src/test.ts');

      // Verify exact format of combined output
      expect(result).toBe('// Test stub for func1\n\n// Test stub for func2');
      
      // Verify both functions are included
      const lines = result.split('\n\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('// Test stub for func1');
      expect(lines[1]).toBe('// Test stub for func2');
    });

    it('should handle empty function array', () => {
      const result = generator.generateTestFile([], 'src/test.ts');

      // Verify empty array produces empty string
      expect(result).toBe('');
      expect(result.length).toBe(0);
      expect(typeof result).toBe('string');
    });
  });

  describe('getTestFilePath', () => {
    it('should generate test file path with default pattern', () => {
      const result = generator.getTestFilePath('src/components/Button.ts');

      // Verify exact path transformation
      expect(result).toBe('src/components/Button.test.ts');
      expect(result).toMatch(/\.test\.ts$/);
      expect(result.startsWith('src/components/')).toBe(true);
    });

    it('should use custom test file pattern from options', () => {
      const options: GeneratorConfig = {
        testFilePattern: '.spec'
      };

      const result = generator.getTestFilePath('src/components/Button.ts', options);

      // Verify custom pattern is applied
      expect(result).toBe('src/components/Button.spec.ts');
      expect(result).toMatch(/\.spec\.ts$/);
      expect(result).not.toMatch(/\.test\.ts$/);
    });
  });

  describe('validateTestContent', () => {
    it('should validate non-empty test content', () => {
      const validContent = 'describe("test", () => {});';

      const result = generator.validateTestContent(validContent);

      // Verify validation returns boolean
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
      expect(result).not.toBe(false);
    });

    it('should invalidate empty test content', () => {
      const result = generator.validateTestContent('');

      // Verify empty content is invalid
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
      expect(result).not.toBe(true);
    });
  });
});

describe('GeneratorConfig', () => {
  it('should support framework configuration', () => {
    const options: GeneratorConfig = {
      framework: 'jest'
    };

    // Verify exact property value
    expect(options.framework).toBe('jest');
    expect(typeof options.framework).toBe('string');
    expect(options.framework).not.toBe('vitest');
  });

  it('should support edge case configuration', () => {
    const options: GeneratorConfig = {
      includeEdgeCases: true
    };

    // Verify boolean configuration
    expect(options.includeEdgeCases).toBe(true);
    expect(typeof options.includeEdgeCases).toBe('boolean');
    expect(options.includeEdgeCases).not.toBe(false);
  });

  it('should support async test configuration', () => {
    const options: GeneratorConfig = {
      includeAsyncTests: false
    };

    // Verify boolean configuration set to false
    expect(options.includeAsyncTests).toBe(false);
    expect(typeof options.includeAsyncTests).toBe('boolean');
    expect(options.includeAsyncTests).not.toBe(true);
  });

  it('should support custom test file pattern', () => {
    const options: GeneratorConfig = {
      testFilePattern: '.spec'
    };

    // Verify string configuration
    expect(options.testFilePattern).toBe('.spec');
    expect(typeof options.testFilePattern).toBe('string');
    expect(options.testFilePattern!.startsWith('.')).toBe(true);
  });

  it('should allow all options to be optional', () => {
    const options: GeneratorConfig = {};

    // Verify empty config is valid
    expect(options).toEqual({});
    expect(Object.keys(options)).toHaveLength(0);
    expect(options.framework).toBeUndefined();
    expect(options.includeEdgeCases).toBeUndefined();
    expect(options.includeAsyncTests).toBeUndefined();
    expect(options.testFilePattern).toBeUndefined();
  });
});