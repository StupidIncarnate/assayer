/**
 * Tests for the generator factory
 * 
 * Comprehensive test suite covering:
 * - Factory pattern implementation
 * - Constructor parameter handling
 * - Configuration management
 * - Interface compliance
 * - Error handling
 */

import { GeneratorFactory, createGenerator, createGeneratorWithDefaults } from './generator-factory';
import { Generator, GeneratorConfig } from '../types/generator';
import { JestTestStubGenerator } from './jest-test-stub-generator';
import { FunctionMetadata } from '../types/metadata';

describe('GeneratorFactory', () => {
  describe('create', () => {
    it('should create a Jest generator by default', () => {
      const generator = GeneratorFactory.create();
      expect(generator).toBeInstanceOf(JestTestStubGenerator);
      expect(generator).toHaveProperty('generateTestFile');
      expect(generator).toHaveProperty('generateTestStub');
      expect(generator).toHaveProperty('getTestFilePath');
      expect(generator).toHaveProperty('validateTestContent');
    });

    it('should create a Jest generator when explicitly requested', () => {
      const generator = GeneratorFactory.create('jest');
      expect(generator).toBeInstanceOf(JestTestStubGenerator);
    });

    it('should throw error for unsupported framework', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid framework
        GeneratorFactory.create('unknown');
      }).toThrow('Unsupported framework: unknown');
    });

    it('should create generator with configuration object', () => {
      const config: GeneratorConfig = {
        includeEdgeCases: false,
        testFilePattern: '.spec'
      };
      const generator = GeneratorFactory.create('jest', config);
      expect(generator).toBeInstanceOf(JestTestStubGenerator);
      
      // Test that config is applied
      const testPath = generator.getTestFilePath('src/test.ts');
      expect(testPath).toBe('src/test.spec.ts');
    });

    it('should create generator without config (parameterless)', () => {
      const generator = GeneratorFactory.create('jest');
      expect(generator).toBeInstanceOf(JestTestStubGenerator);
      
      // Should use default config
      const testPath = generator.getTestFilePath('src/test.ts');
      expect(testPath).toBe('src/test.test.ts');
    });

    it('should handle configuration errors gracefully', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid framework with config
        GeneratorFactory.create('unknown', { includeEdgeCases: true });
      }).toThrow('Unsupported framework: unknown');
    });

    it('should handle empty configuration object', () => {
      const generator = GeneratorFactory.create('jest', {});
      expect(generator).toBeInstanceOf(JestTestStubGenerator);
    });
  });

  describe('register', () => {
    // Mock generator for testing
    class MockGenerator implements Generator {
      private config?: GeneratorConfig;
      
      constructor(config?: GeneratorConfig) {
        this.config = config;
      }
      
      generateTestStub() { return 'mock stub'; }
      generateTestFile() { return 'mock file'; }
      getTestFilePath(path: string, options?: GeneratorConfig) { 
        const pattern = options?.testFilePattern || this.config?.testFilePattern || '.test';
        return path.replace(/\.(ts|tsx|js|jsx)$/, '') + pattern + '.ts'; 
      }
      validateTestContent() { return true; }
    }

    beforeEach(() => {
      // Reset to default state
      if (GeneratorFactory.isSupported('mocha')) {
        // @ts-expect-error - Accessing private property for testing
        GeneratorFactory.generators.delete('mocha');
      }
    });

    it('should register a new generator', () => {
      GeneratorFactory.register('mocha', MockGenerator);
      
      const generator = GeneratorFactory.create('mocha');
      expect(generator).toBeInstanceOf(MockGenerator);
    });

    it('should override existing generator', () => {
      GeneratorFactory.register('jest', MockGenerator);
      
      const generator = GeneratorFactory.create('jest');
      expect(generator).toBeInstanceOf(MockGenerator);

      // Restore original
      GeneratorFactory.register('jest', JestTestStubGenerator);
    });
  });

  describe('getSupportedFrameworks', () => {
    it('should return list of supported frameworks', () => {
      const frameworks = GeneratorFactory.getSupportedFrameworks();
      expect(frameworks).toEqual(['jest']);
      expect(frameworks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported frameworks', () => {
      expect(GeneratorFactory.isSupported('jest')).toBe(true);
    });

    it('should return false for unsupported frameworks', () => {
      expect(GeneratorFactory.isSupported('unknown')).toBe(false);
    });
  });
});

describe('createGenerator', () => {
  it('should create a generator using factory', () => {
    const generator = createGenerator();
    expect(generator).toBeInstanceOf(JestTestStubGenerator);
  });

  it('should pass framework parameter to factory', () => {
    const generator = createGenerator('jest');
    expect(generator).toBeInstanceOf(JestTestStubGenerator);
  });

  it('should create generator with configuration', () => {
    const config: GeneratorConfig = { testFilePattern: '.spec' };
    const generator = createGenerator('jest', config);
    expect(generator).toBeInstanceOf(JestTestStubGenerator);
    
    const testPath = generator.getTestFilePath('src/test.ts');
    expect(testPath).toBe('src/test.spec.ts');
  });

  it('should handle undefined configuration gracefully', () => {
    const generator = createGenerator('jest', undefined);
    expect(generator).toBeInstanceOf(JestTestStubGenerator);
  });
});

describe('createGeneratorWithDefaults', () => {
  const functionMeta: FunctionMetadata = {
    name: 'testFunc',
    params: [{ name: 'input', type: 'string' }],
    returnType: 'string'
  };

  it('should create generator with default options', () => {
    const generator = createGeneratorWithDefaults('jest', {
      includeEdgeCases: false,
      testFilePattern: '.spec'
    });

    const testPath = generator.getTestFilePath('src/test.ts');
    expect(testPath).toBe('src/test.spec.ts');
  });

  it('should merge provided options with defaults', () => {
    const generator = createGeneratorWithDefaults('jest', {
      testFilePattern: '.spec',
      includeEdgeCases: false
    });

    const testPath = generator.getTestFilePath('src/test.ts', {
      testFilePattern: '.test' // Override default
    });
    
    expect(testPath).toBe('src/test.test.ts');
  });

  it('should apply defaults to generateTestStub', () => {
    const generator = createGeneratorWithDefaults('jest', {
      includeEdgeCases: false
    });

    const stub = generator.generateTestStub(functionMeta, 'src/test.ts');
    
    // Should not include edge case tests
    expect(stub).not.toContain('empty string');
  });

  it('should apply defaults to generateTestFile', () => {
    const generator = createGeneratorWithDefaults('jest', {
      includeAsyncTests: false
    });

    const asyncFunc: FunctionMetadata = {
      name: 'asyncFunc',
      params: [],
      returnType: 'Promise<string>'
    };

    const file = generator.generateTestFile([asyncFunc], 'src/test.ts');
    
    // Should not include async tests
    expect(file).not.toContain('async operation');
  });

  it('should implement validateTestContent method', () => {
    const generator = createGeneratorWithDefaults('jest', {
      includeEdgeCases: true
    });

    const validContent = `
import { test } from './test';
describe('test', () => {
  it('works', () => {
    expect(test()).toBe(true);
  });
});`;

    expect(generator.validateTestContent).toBeDefined();
    expect(typeof generator.validateTestContent).toBe('function');
    expect(generator.validateTestContent(validContent)).toBe(true);
    expect(generator.validateTestContent('')).toBe(false);
  });

  it('should support getTestFilePath with optional config parameter', () => {
    const generator = createGeneratorWithDefaults('jest', {
      testFilePattern: '.spec'
    });

    // Test with default config from constructor
    expect(generator.getTestFilePath('src/test.ts')).toBe('src/test.spec.ts');
    
    // Test with override config parameter
    expect(generator.getTestFilePath('src/test.ts', { testFilePattern: '.unit' })).toBe('src/test.unit.ts');
  });

  it('should handle configuration merging correctly', () => {
    const defaultConfig: GeneratorConfig = {
      includeEdgeCases: false,
      testFilePattern: '.spec',
      includeAsyncTests: true
    };
    
    const generator = createGeneratorWithDefaults('jest', defaultConfig);
    
    // Test individual config items are applied
    const testPath = generator.getTestFilePath('test.ts');
    expect(testPath).toBe('test.spec.ts');
    
    // Test config override
    const overridePath = generator.getTestFilePath('test.ts', { testFilePattern: '.integration' });
    expect(overridePath).toBe('test.integration.ts');
  });

  it('should throw error for unsupported framework in createGeneratorWithDefaults', () => {
    expect(() => {
      // @ts-expect-error - Testing invalid framework
      createGeneratorWithDefaults('unknown', { includeEdgeCases: true });
    }).toThrow('Unsupported framework: unknown');
  });

  it('should handle edge cases in configuration', () => {
    // Test with minimal config
    const generator1 = createGeneratorWithDefaults('jest', {});
    expect(generator1).toBeInstanceOf(JestTestStubGenerator);
    
    // Test with null-like values
    const generator2 = createGeneratorWithDefaults('jest', { 
      testFilePattern: undefined,
      includeEdgeCases: undefined 
    });
    expect(generator2).toBeInstanceOf(JestTestStubGenerator);
  });

  it('should support direct JestTestStubGenerator instantiation with correct parameter order', () => {
    // Test constructor parameter order: config first, templates second
    const config: GeneratorConfig = { testFilePattern: '.direct' };
    const generator = new JestTestStubGenerator(config);
    
    expect(generator).toBeInstanceOf(JestTestStubGenerator);
    expect(generator.getTestFilePath('test.ts')).toBe('test.direct.ts');
    
    // Test with both config and templates
    const generator2 = new JestTestStubGenerator(config, undefined);
    expect(generator2.getTestFilePath('test.ts')).toBe('test.direct.ts');
  });

  it('should handle configuration precedence correctly', () => {
    // Constructor config vs method-level config precedence
    const constructorConfig: GeneratorConfig = { testFilePattern: '.constructor' };
    const generator = createGeneratorWithDefaults('jest', constructorConfig);
    
    // Constructor config should be used by default
    expect(generator.getTestFilePath('test.ts')).toBe('test.constructor.ts');
    
    // Method-level config should override constructor config
    const methodConfig: GeneratorConfig = { testFilePattern: '.method' };
    expect(generator.getTestFilePath('test.ts', methodConfig)).toBe('test.method.ts');
  });
});