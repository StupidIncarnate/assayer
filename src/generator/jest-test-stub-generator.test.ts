/**
 * Tests for JestTestStubGenerator
 * 
 * Comprehensive test coverage for the Jest test stub generation functionality.
 */

import { JestTestStubGenerator } from './jest-test-stub-generator';
import { FunctionMetadata } from '../types/metadata';

describe('JestTestStubGenerator', () => {
  let generator: JestTestStubGenerator;

  beforeEach(() => {
    generator = new JestTestStubGenerator();
  });

  describe('generateTestStub', () => {
    it('should generate a basic test stub for a simple function', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'add',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' }
        ],
        returnType: 'number'
      };
      const modulePath = 'src/math/calculator.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain("import { add } from '../math/calculator';");
      expect(result).toContain("describe('add', () => {");
      expect(result).toContain('should execute successfully with valid inputs');
      expect(result).toContain('const a = 42;');
      expect(result).toContain('const b = 42;');
      expect(result).toContain('const result = add(a, b);');
      expect(result).toContain("expect(typeof result).toBe('number');");
    });

    it('should generate test stub for function with no parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'getCurrentTime',
        params: [],
        returnType: 'Date'
      };
      const modulePath = 'src/utils/time.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain("import { getCurrentTime } from '../utils/time';");
      expect(result).toContain('const result = getCurrentTime();');
      expect(result).toContain('// No parameters to arrange');
    });

    it('should generate test stub for void function', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'logMessage',
        params: [{ name: 'message', type: 'string' }],
        returnType: 'void'
      };
      const modulePath = 'src/logger.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('// Function returns void - verify no errors thrown');
      expect(result).toContain("const message = 'test-message';");
    });

    it('should generate test stub for async function', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'fetchUser',
        params: [{ name: 'id', type: 'string' }],
        returnType: 'Promise<User>'
      };
      const modulePath = 'src/api/users.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle async operation correctly');
      expect(result).toContain('async () => {');
      expect(result).toContain('const result = await fetchUser(');
    });

    it('should generate test stub for function returning array', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'getItems',
        params: [],
        returnType: 'string[]'
      };
      const modulePath = 'src/inventory.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should return an array');
      expect(result).toContain('expect(Array.isArray(result)).toBe(true);');
    });
  });

  describe('generateTestFile', () => {
    it('should generate test file for multiple functions', () => {
      // Arrange
      const functionsMetadata: FunctionMetadata[] = [
        {
          name: 'add',
          params: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' }
          ],
          returnType: 'number'
        },
        {
          name: 'subtract',
          params: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' }
          ],
          returnType: 'number'
        }
      ];
      const modulePath = 'src/math.ts';

      // Act
      const result = generator.generateTestFile(functionsMetadata, modulePath);

      // Assert
      expect(result).toContain("import { add, subtract } from '../math';");
      expect(result).toContain("describe('add', () => {");
      expect(result).toContain("describe('subtract', () => {");
    });

    it('should generate empty test file when no functions provided', () => {
      // Arrange
      const functionsMetadata: FunctionMetadata[] = [];
      const modulePath = 'src/empty.ts';

      // Act
      const result = generator.generateTestFile(functionsMetadata, modulePath);

      // Assert
      expect(result).toContain('No functions found in src/empty.ts');
      expect(result).toContain("describe('empty', () => {");
      expect(result).toContain('should have testable functions');
    });
  });

  describe('edge case handling', () => {
    it('should generate edge case tests for string parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'processText',
        params: [{ name: 'text', type: 'string' }],
        returnType: 'string'
      };
      const modulePath = 'src/text.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle empty string for text');
      expect(result).toContain("const text = '';");
    });

    it('should generate edge case tests for number parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'calculate',
        params: [{ name: 'value', type: 'number' }],
        returnType: 'number'
      };
      const modulePath = 'src/calc.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle boundary value (0) for value');
      expect(result).toContain('const value = 0;');
    });

    it('should generate edge case tests for array parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'processItems',
        params: [{ name: 'items', type: 'string[]' }],
        returnType: 'void'
      };
      const modulePath = 'src/processor.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle empty array for items');
      expect(result).toContain('const items = [];');
    });
  });

  describe('parameter type handling', () => {
    it('should handle nullable types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'maybeProcess',
        params: [{ name: 'data', type: 'string | null' }],
        returnType: 'void'
      };
      const modulePath = 'src/maybe.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle null value for data');
      expect(result).toContain('const data = null;');
    });

    it('should handle optional types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'configure',
        params: [{ name: 'options', type: 'Options | undefined' }],
        returnType: 'void'
      };
      const modulePath = 'src/config.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle null value for options');
    });

    it('should handle custom object types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'createUser',
        params: [{ name: 'userData', type: 'UserData' }],
        returnType: 'User'
      };
      const modulePath = 'src/users.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('const userData = {} as UserData;');
    });

    it('should handle boolean parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'toggle',
        params: [{ name: 'isActive', type: 'boolean' }],
        returnType: 'void'
      };
      const modulePath = 'src/toggle.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('const isActive = true;');
    });
  });

  describe('import path generation', () => {
    it('should handle nested module paths', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'deepFunction',
        params: [],
        returnType: 'void'
      };
      const modulePath = 'src/deep/nested/module.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain("import { deepFunction } from '../deep/nested/module';");
    });

    it('should handle root level files', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'rootFunction',
        params: [],
        returnType: 'void'
      };
      const modulePath = 'index.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain("import { rootFunction } from 'index';");
    });
  });

  describe('test structure', () => {
    it('should follow Arrange-Act-Assert pattern', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'testFunction',
        params: [{ name: 'input', type: 'string' }],
        returnType: 'string'
      };
      const modulePath = 'src/test.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('// Arrange');
      expect(result).toContain('// Act');
      expect(result).toContain('// Assert');
    });

    it('should generate descriptive test names', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'validateEmail',
        params: [{ name: 'email', type: 'string' }],
        returnType: 'boolean'
      };
      const modulePath = 'src/validators.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should execute successfully with valid inputs');
      expect(result).toContain('should handle empty string for email');
      expect(result).toContain('should handle missing required parameters gracefully');
    });
  });

  describe('complex return types', () => {
    it('should handle generic array types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'getUsers',
        params: [],
        returnType: 'Array<User>'
      };
      const modulePath = 'src/users.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should return an array');
      expect(result).toContain('expect(Array.isArray(result)).toBe(true);');
    });

    it('should handle union return types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'findItem',
        params: [{ name: 'id', type: 'string' }],
        returnType: 'Item | null'
      };
      const modulePath = 'src/items.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('expect(result).toBeDefined();');
    });

    it('should handle promise with complex types', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'fetchData',
        params: [],
        returnType: 'Promise<DataResponse[]>'
      };
      const modulePath = 'src/api.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle async operation correctly');
      expect(result).toContain('await fetchData()');
    });
  });

  describe('error handling tests', () => {
    it('should generate test for missing parameters', () => {
      // Arrange
      const functionMeta: FunctionMetadata = {
        name: 'requiresParams',
        params: [
          { name: 'required', type: 'string' },
          { name: 'alsoRequired', type: 'number' }
        ],
        returnType: 'void'
      };
      const modulePath = 'src/strict.ts';

      // Act
      const result = generator.generateTestStub(functionMeta, modulePath);

      // Assert
      expect(result).toContain('should handle missing required parameters gracefully');
      expect(result).toContain('const invalidCall = () => requiresParams(undefined as any, undefined as any);');
      expect(result).toContain('expect(invalidCall).toThrow();');
    });
  });
});