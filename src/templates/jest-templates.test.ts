/**
 * Tests for JestTemplates
 */

import { JestTemplates, JestTemplateConfig } from './jest-templates';

describe('JestTemplates', () => {
  describe('constructor', () => {
    it('should create instance with default templates', () => {
      const templates = new JestTemplates();
      expect(templates).toBeDefined();
    });

    it('should create instance with custom templates', () => {
      const customConfig: JestTemplateConfig = {
        importTemplate: `const { {{functionNames}} } = require('{{importPath}}');`
      };
      const templates = new JestTemplates(customConfig);
      expect(templates).toBeDefined();
    });
  });

  describe('getImportTemplate', () => {
    it('should generate import statement with function names and path', () => {
      const templates = new JestTemplates();
      const result = templates.getImportTemplate('func1, func2', './module');
      
      expect(result).toBe(`import { func1, func2 } from './module';`);
    });

    it('should use custom import template when provided', () => {
      const customConfig: JestTemplateConfig = {
        importTemplate: `const { {{functionNames}} } = require('{{importPath}}');`
      };
      const templates = new JestTemplates(customConfig);
      const result = templates.getImportTemplate('func1', './module');
      
      expect(result).toBe(`const { func1 } = require('./module');`);
    });
  });

  describe('getDescribeTemplate', () => {
    it('should generate describe block with function name and test cases', () => {
      const templates = new JestTemplates();
      const testCases = `  it('test1', () => {});`;
      const result = templates.getDescribeTemplate('myFunction', testCases);
      
      expect(result).toBe(`describe('myFunction', () => {
${testCases}
});`);
    });
  });

  describe('getBasicTestTemplate', () => {
    it('should generate basic test with arrange, act, assert sections', () => {
      const templates = new JestTemplates();
      const params = {
        arrangeSection: '    const value = 42;',
        callExpression: 'myFunction(value)',
        assertSection: '    expect(result).toBe(42);'
      };
      
      const result = templates.getBasicTestTemplate(params);
      
      const expectedResult = `  it('should execute successfully with valid inputs', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
${params.assertSection}
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getAsyncTestTemplate', () => {
    it('should generate async test with await keyword', () => {
      const templates = new JestTemplates();
      const params = {
        arrangeSection: '    const value = 42;',
        callExpression: 'myAsyncFunction(value)'
      };
      
      const result = templates.getAsyncTestTemplate(params);
      
      const expectedResult = `  it('should handle async operation correctly', async () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = await ${params.callExpression};
    
    // Assert
    expect(result).toBeDefined();
    // TODO: Add specific assertions for the resolved value
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getArrayTestTemplate', () => {
    it('should generate array test with array assertion', () => {
      const templates = new JestTemplates();
      const params = {
        arrangeSection: '    const value = 42;',
        callExpression: 'getArray(value)'
      };
      
      const result = templates.getArrayTestTemplate(params);
      
      const expectedResult = `  it('should return an array', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
    expect(Array.isArray(result)).toBe(true);
    // TODO: Add assertions for array contents
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getNullParameterTestTemplate', () => {
    it('should generate null parameter test', () => {
      const templates = new JestTemplates();
      const params = {
        paramName: 'input',
        arrangeSection: '    const input = null;',
        callExpression: 'myFunction(input)'
      };
      
      const result = templates.getNullParameterTestTemplate(params);
      
      const expectedResult = `  it('should handle null value for input', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
    // TODO: Verify expected behavior with null input
    expect(result).toBeDefined();
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getRequiredParameterTestTemplate', () => {
    it('should generate required parameter test', () => {
      const templates = new JestTemplates();
      const params = {
        functionName: 'myFunction',
        invalidCall: 'myFunction(undefined as any)'
      };
      
      const result = templates.getRequiredParameterTestTemplate(params);
      
      const expectedResult = `  it('should handle missing required parameters gracefully', () => {
    // Arrange
    const invalidCall = () => ${params.invalidCall};
    
    // Act & Assert
    // TODO: Adjust assertion based on function's error handling
    expect(invalidCall).toThrow();
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getEmptyStringTestTemplate', () => {
    it('should generate empty string test', () => {
      const templates = new JestTemplates();
      const params = {
        paramName: 'name',
        arrangeSection: `    const name = '';`,
        callExpression: 'processName(name)'
      };
      
      const result = templates.getEmptyStringTestTemplate(params);
      
      const expectedResult = `  it('should handle empty string for name', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
    // TODO: Verify expected behavior with empty string
    expect(result).toBeDefined();
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getBoundaryValueTestTemplate', () => {
    it('should generate boundary value test', () => {
      const templates = new JestTemplates();
      const params = {
        paramName: 'count',
        arrangeSection: '    const count = 0;',
        callExpression: 'processCount(count)'
      };
      
      const result = templates.getBoundaryValueTestTemplate(params);
      
      const expectedResult = `  it('should handle boundary value (0) for count', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getEmptyArrayTestTemplate', () => {
    it('should generate empty array test', () => {
      const templates = new JestTemplates();
      const params = {
        paramName: 'items',
        arrangeSection: '    const items = [];',
        callExpression: 'processItems(items)'
      };
      
      const result = templates.getEmptyArrayTestTemplate(params);
      
      const expectedResult = `  it('should handle empty array for items', () => {
    // Arrange
${params.arrangeSection}
    
    // Act
    const result = ${params.callExpression};
    
    // Assert
    // TODO: Verify expected behavior with empty array
    expect(result).toBeDefined();
  });`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('getEmptyTestFileTemplate', () => {
    it('should generate empty test file template', () => {
      const templates = new JestTemplates();
      const params = {
        modulePath: 'src/utils/helper.ts',
        moduleName: 'helper'
      };
      
      const result = templates.getEmptyTestFileTemplate(params);
      
      const expectedResult = `// No functions found in ${params.modulePath}
// Add functions to generate test stubs

describe('${params.moduleName}', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`;
      expect(result).toBe(expectedResult);
    });
  });

  describe('template interpolation', () => {
    it('should handle missing variables gracefully', () => {
      const templates = new JestTemplates();
      // Using import template but only providing one variable
      const result = templates.getImportTemplate('func1', undefined as any);
      
      expect(result.includes('func1')).toBe(true);
      expect(result.includes('{{importPath}}')).toBe(true); // Should keep placeholder if variable missing
    });

    it('should handle special characters in variables', () => {
      const templates = new JestTemplates();
      const result = templates.getImportTemplate('func<T>', '../path/with-dashes');
      
      expect(result).toBe(`import { func<T> } from '../path/with-dashes';`);
    });
  });

  describe('custom template configuration', () => {
    it('should merge custom config with defaults', () => {
      const customConfig: JestTemplateConfig = {
        basicTestTemplate: `test('{{testName}}', () => { /* custom */ });`,
        asyncTestTemplate: `test('async {{testName}}', async () => { /* custom async */ });`
      };
      
      const templates = new JestTemplates(customConfig);
      
      // Custom templates should be used
      const basicResult = templates.getBasicTestTemplate({
        arrangeSection: '',
        callExpression: 'func()',
        assertSection: ''
      });
      expect(basicResult.includes('/* custom */')).toBe(true);
      
      // Default templates should still work for non-overridden templates
      const importResult = templates.getImportTemplate('func', './module');
      expect(importResult).toBe(`import { func } from './module';`);
    });
  });
});