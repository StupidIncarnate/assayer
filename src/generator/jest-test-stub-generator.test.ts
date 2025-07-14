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
      // Verify import statement
      expect(result).toMatch(/^import \{ add \} from '\.\.\/math\/calculator';/m);
      
      // Verify complete test structure with exact format
      const expectedStructure = `import { add } from '../math/calculator';

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
});`;
      
      expect(result).toEqual(expectedStructure);
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
      // Verify import statement
      expect(result).toMatch(/^import \{ getCurrentTime \} from '\.\.\/utils\/time';/m);
      
      // Parse the test structure to verify it programmatically
      const lines = result.split('\n');
      const describeLineIndex = lines.findIndex(line => line.includes("describe('getCurrentTime'"));
      const itLineIndex = lines.findIndex(line => line.includes("it('should execute successfully"));
      
      expect(describeLineIndex).toBeGreaterThan(0);
      expect(itLineIndex).toBeGreaterThan(describeLineIndex);
      
      // Verify the test contains expected comments and function call
      const testBody = lines.slice(itLineIndex).join('\n');
      expect(testBody).toMatch(/\/\/ No parameters to arrange/);
      expect(testBody).toMatch(/const result = getCurrentTime\(\);/);
      expect(testBody).toMatch(/expect\(result\)\.toBeDefined\(\);/);
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
      // Use snapshot for full structure verification
      expect(result).toMatchSnapshot();
      
      // Additional specific verifications
      expect(result).toMatch(/\/\/ Function returns void - verify no errors thrown/);
      expect(result).toMatch(/const message = 'test-message';/);
      expect(result).toMatch(/logMessage\(message\);/);
      
      // Verify edge case for empty string using exact pattern
      const emptyStringTestRegex = /it\('should handle empty string for message', \(\) => \{\s*\/\/ Arrange\s*const message = '';/m;
      expect(result).toMatch(emptyStringTestRegex);
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
      // Verify async function structure using regex patterns
      const asyncTestPattern = /it\('should handle async operation correctly', async \(\) => \{[\s\S]*?const result = await fetchUser\(id\);[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(asyncTestPattern);
      
      // Verify the async test has proper structure
      const asyncTestMatch = result.match(/it\('should handle async operation correctly'[\s\S]*?\}\);/m);
      expect(asyncTestMatch).toBeTruthy();
      
      const asyncTestContent = asyncTestMatch![0];
      // Count async keywords - there should be two: one in the main test and one in the async test
      const fullResultAsyncCount = (result.match(/\basync\b/g) || []).length;
      const awaitKeywordCount = (asyncTestContent.match(/await/g) || []).length;
      
      expect(fullResultAsyncCount).toBe(2);
      expect(awaitKeywordCount).toBe(1);
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
      // Verify array test structure with relaxed pattern matching for formatting
      const arrayTestPattern = /it\('should return an array', \(\) => \{[\s\S]*?const result = getItems\(\);[\s\S]*?expect\(Array\.isArray\(result\)\)\.toBe\(true\);[\s\S]*?\/\/ TODO: Add assertions for array contents[\s\S]*?\}\);/m;
      expect(result).toMatch(arrayTestPattern);
      
      // Parse and verify test structure
      const testBlocks = result.match(/it\([^)]+\)[^{]*\{[\s\S]*?\}\);/gm) || [];
      const arrayTest = testBlocks.find(block => block.includes('should return an array'));
      
      expect(arrayTest).toBeDefined();
      expect(arrayTest).toMatch(/const result = getItems\(\);/);
      expect(arrayTest).toMatch(/expect\(Array\.isArray\(result\)\)\.toBe\(true\);/);
      expect(arrayTest).toMatch(/\/\/ TODO: Add assertions for array contents/);
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
      // Verify combined import statement
      expect(result).toMatch(/^import \{ add, subtract \} from '\.\.\/math';/m);
      
      // Verify both function test suites are generated with proper structure
      const addTestPattern = /describe\('add', \(\) => \{[\s\S]*?it\('should execute successfully with valid inputs', \(\) => \{[\s\S]*?\}\);[\s\S]*?\}\);/m;
      const subtractTestPattern = /describe\('subtract', \(\) => \{[\s\S]*?it\('should execute successfully with valid inputs', \(\) => \{[\s\S]*?\}\);[\s\S]*?\}\);/m;
      
      expect(result).toMatch(addTestPattern);
      expect(result).toMatch(subtractTestPattern);
      
      // Verify the order: add comes before subtract
      const addIndex = result.indexOf("describe('add'");
      const subtractIndex = result.indexOf("describe('subtract'");
      expect(addIndex).toBeLessThan(subtractIndex);
      expect(addIndex).toBeGreaterThan(0);
    });

    it('should generate empty test file when no functions provided', () => {
      // Arrange
      const functionsMetadata: FunctionMetadata[] = [];
      const modulePath = 'src/empty.ts';

      // Act
      const result = generator.generateTestFile(functionsMetadata, modulePath);

      // Assert
      // Verify exact structure for empty file
      expect(result).toEqual(`// No functions found in src/empty.ts
// Add functions to generate test stubs

describe('empty', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`);
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
      // Verify complete edge case test structure
      const emptyStringTestPattern = /it\('should handle empty string for text', \(\) => \{\s*\/\/ Arrange[\s\S]*?const text = '';[\s\S]*?\/\/ Act[\s\S]*?const result = processText\(text\);[\s\S]*?\/\/ Assert[\s\S]*?\/\/ TODO: Verify expected behavior with empty string[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(emptyStringTestPattern);
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
      // Use exact matching for boundary value test
      const boundaryTestPattern = /it\('should handle boundary value \(0\) for value', \(\) => \{\s*\/\/ Arrange[\s\S]*?const value = 0;[\s\S]*?\/\/ Act[\s\S]*?const result = calculate\(value\);[\s\S]*?\/\/ Assert[\s\S]*?\/\/ TODO: Verify expected behavior with boundary value[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(boundaryTestPattern);
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
      // Verify empty array edge case with exact structure
      const emptyArrayTestPattern = /it\('should handle empty array for items', \(\) => \{\s*\/\/ Arrange[\s\S]*?const items = \[\];[\s\S]*?\/\/ Act[\s\S]*?const result = processItems\(items\);[\s\S]*?\/\/ Assert[\s\S]*?\/\/ TODO: Verify expected behavior with empty array[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(emptyArrayTestPattern);
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
      // Verify null handling test structure
      const nullTestPattern = /it\('should handle null value for data', \(\) => \{\s*\/\/ Arrange[\s\S]*?const data = null;[\s\S]*?\/\/ Act[\s\S]*?const result = maybeProcess\(data\);[\s\S]*?\/\/ Assert[\s\S]*?\/\/ TODO: Verify expected behavior with null data[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(nullTestPattern);
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
      // Verify null handling for optional/undefined types
      const nullTestPattern = /it\('should handle null value for options', \(\) => \{[\s\S]*?const options = null;[\s\S]*?\}\);/m;
      expect(result).toMatch(nullTestPattern);
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
      // Verify custom object type initialization with relaxed pattern
      const mainTestPattern = /it\('should execute successfully with valid inputs', \(\) => \{[\s\S]*?const userData = \{\} as UserData;[\s\S]*?const result = createUser\(userData\);[\s\S]*?expect\(result\)\.toBeDefined\(\);[\s\S]*?\}\);/m;
      expect(result).toMatch(mainTestPattern);
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
      // Verify boolean parameter initialization - check for the specific test
      const mainTest = result.match(/it\('should execute successfully with valid inputs'[\s\S]*?\}\);/m);
      expect(mainTest).toBeTruthy();
      expect(mainTest![0]).toMatch(/const isActive = true;/);
      expect(mainTest![0]).toMatch(/toggle\(isActive\);/);
      expect(mainTest![0]).toMatch(/\/\/ Function returns void - verify no errors thrown/);
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
      // Verify correct relative import path generation
      expect(result).toMatch(/^import \{ deepFunction \} from '\.\.\/deep\/nested\/module';/m);
      
      // Verify the import is at the beginning of the file
      const lines = result.split('\n');
      expect(lines[0]).toBe("import { deepFunction } from '../deep/nested/module';");
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
      // Verify root level import with relative path
      expect(result).toMatch(/^import \{ rootFunction \} from '\.\/index';/m);
      
      // Ensure relative path is used for root files
      expect(result).toMatch(/from ['"]\.\/index['"]/);
      expect(result).not.toMatch(/from ['"]\.\.\/index['"]/);
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
      // Verify Arrange-Act-Assert pattern is properly structured
      const mainTest = result.match(/it\('should execute successfully with valid inputs'[\s\S]*?\}\);/m);
      expect(mainTest).toBeTruthy();
      
      const testContent = mainTest![0];
      const arrangeIndex = testContent.indexOf('// Arrange');
      const actIndex = testContent.indexOf('// Act');
      const assertIndex = testContent.indexOf('// Assert');
      
      // Verify order
      expect(arrangeIndex).toBeGreaterThan(0);
      expect(actIndex).toBeGreaterThan(arrangeIndex);
      expect(assertIndex).toBeGreaterThan(actIndex);
      
      // Verify each section has specific content using exact patterns
      const arrangeSection = testContent.substring(arrangeIndex, actIndex);
      const actSection = testContent.substring(actIndex, assertIndex);
      const assertSection = testContent.substring(assertIndex);
      
      expect(arrangeSection).toMatch(/const input = 'test-input';/);
      expect(actSection).toMatch(/const result = testFunction\(input\);/);
      expect(assertSection).toMatch(/expect\(typeof result\)\.toBe\('string'\);/);
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
      // Verify descriptive test names are generated
      const testNames = [...result.matchAll(/it\('([^']+)'/g)].map(m => m[1]);
      
      expect(testNames).toEqual([
        'should execute successfully with valid inputs',
        'should handle missing required parameters gracefully',
        'should handle empty string for email'
      ]);
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
      // Verify generic array type handling - look for the test in the result
      const arrayTest = result.match(/it\('should return an array'[\s\S]*?\}\);/m);
      expect(arrayTest).toBeTruthy();
      expect(arrayTest![0]).toMatch(/const result = getUsers\(\);/);
      expect(arrayTest![0]).toMatch(/expect\(Array\.isArray\(result\)\)\.toBe\(true\);/);
      expect(arrayTest![0]).toMatch(/\/\/ TODO: Add assertions for array contents/);
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
      // Verify union return type handling with structured verification
      const mainTest = result.match(/it\('should execute successfully with valid inputs'[\s\S]*?\}\);/m);
      expect(mainTest).toBeTruthy();
      expect(mainTest![0]).toMatch(/const id = 'test-id';/);
      expect(mainTest![0]).toMatch(/const result = findItem\(id\);/);
      expect(mainTest![0]).toMatch(/expect\(result\)\.toBeDefined\(\);/);
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
      // Verify Promise with complex return type - look for the async test
      const asyncTest = result.match(/it\('should handle async operation correctly', async \(\) => \{[\s\S]*?\}\);/m);
      expect(asyncTest).toBeTruthy();
      expect(asyncTest![0]).toMatch(/const result = await fetchData\(\);/);
      expect(asyncTest![0]).toMatch(/expect\(result\)\.toBeDefined\(\);/);
      expect(asyncTest![0]).toMatch(/\/\/ TODO: Add specific assertions for the resolved value/);
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
      // Verify error handling test generation - look for the specific test
      const errorTest = result.match(/it\('should handle missing required parameters gracefully'[\s\S]*?\}\);/m);
      expect(errorTest).toBeTruthy();
      expect(errorTest![0]).toMatch(/const invalidCall = \(\) => requiresParams\(undefined as any, undefined as any\);/);
      expect(errorTest![0]).toMatch(/expect\(invalidCall\)\.toThrow\(\);/);
      
      // Verify it's testing both parameters as undefined
      const undefinedMatches = result.match(/undefined as any/g);
      expect(undefinedMatches).toHaveLength(2);
    });
  });
});