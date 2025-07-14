/**
 * Integration tests for JestTemplates
 * 
 * Verifies that JestTemplates integrates correctly with the test generation system
 */

import { JestTemplates } from './jest-templates';

describe('JestTemplates Integration', () => {
  it('should generate a complete test file using templates', () => {
    const templates = new JestTemplates();

    // Generate import
    const importStmt = templates.getImportTemplate('calculateDiscount', '../utils/pricing');
    
    // Generate test cases
    const basicTest = templates.getBasicTestTemplate({
      arrangeSection: '    const price = 100;\n    const percentage = 20;',
      callExpression: 'calculateDiscount(price, percentage)',
      assertSection: '    expect(result).toBe(80);'
    });
    
    const boundaryTest = templates.getBoundaryValueTestTemplate({
      paramName: 'percentage',
      arrangeSection: '    const price = 100;\n    const percentage = 0;',
      callExpression: 'calculateDiscount(price, percentage)'
    });
    
    const testCases = [basicTest, boundaryTest].join('\n\n');
    
    // Generate complete test suite
    const testSuite = templates.getDescribeTemplate('calculateDiscount', testCases);
    
    // Assemble complete file
    const completeTestFile = `${importStmt}\n\n${testSuite}`;
    
    // Verify structure
    expect(completeTestFile).toBe("import { calculateDiscount } from '../utils/pricing';\n\ndescribe('calculateDiscount', () => {\n  it('should execute successfully with valid inputs', () => {\n    // Arrange\n    const price = 100;\n    const percentage = 20;\n    \n    // Act\n    const result = calculateDiscount(price, percentage);\n    \n    // Assert\n    expect(result).toBe(80);\n  });\n\n  it('should handle boundary value (0) for percentage', () => {\n    // Arrange\n    const price = 100;\n    const percentage = 0;\n    \n    // Act\n    const result = calculateDiscount(price, percentage);\n    \n    // Assert\n    // TODO: Verify expected behavior with boundary value\n    expect(result).toBeDefined();\n  });\n});");
    // All assertions now covered by the single toBe check above
  });

  it('should support custom templates for different test frameworks', () => {
    // Mocha-style templates
    const mochaTemplates = new JestTemplates({
      importTemplate: `const { {{functionNames}} } = require('{{importPath}}');\nconst { expect } = require('chai');`,
      describeTemplate: `context('{{functionName}}', function() {\n{{testCases}}\n});`,
      basicTestTemplate: `  it('{{testName}}', function() {\n    // Setup\n{{arrangeSection}}\n    \n    // Execute\n    const result = {{callExpression}};\n    \n    // Verify\n{{assertSection}}\n  });`
    });

    const importStmt = mochaTemplates.getImportTemplate('processData', './processor');
    const testCase = mochaTemplates.getBasicTestTemplate({
      arrangeSection: '    const data = [1, 2, 3];',
      callExpression: 'processData(data)',
      assertSection: '    expect(result).to.deep.equal([2, 4, 6]);'
    });
    const suite = mochaTemplates.getDescribeTemplate('processData', testCase);

    expect(importStmt).toBe("const { processData } = require('./processor');\nconst { expect } = require('chai');");
    // Already covered by the assertion above
    expect(suite).toBe("context('processData', function() {\n  it('{{testName}}', function() {\n    // Setup\n    const data = [1, 2, 3];\n    \n    // Execute\n    const result = processData(data);\n    \n    // Verify\n    expect(result).to.deep.equal([2, 4, 6]);\n  });\n});");
    // Already covered by the assertion above
  });

  it('should handle complex test scenarios with multiple edge cases', () => {
    const templates = new JestTemplates();

    // Generate various edge case tests
    const tests = [
      templates.getBasicTestTemplate({
        arrangeSection: '    const configString = \'{"key": "value"}\';\n    const options = { strict: true };',
        callExpression: 'parseConfig(configString, options)',
        assertSection: '    expect(result).toEqual({ key: \'value\' });'
      }),
      templates.getEmptyStringTestTemplate({
        paramName: 'configString',
        arrangeSection: '    const configString = \'\';\n    const options = {};',
        callExpression: 'parseConfig(configString, options)'
      }),
      templates.getNullParameterTestTemplate({
        paramName: 'options',
        arrangeSection: '    const configString = \'{"key": "value"}\';\n    const options = null;',
        callExpression: 'parseConfig(configString, options)'
      })
    ];

    const testSuite = templates.getDescribeTemplate('parseConfig', tests.join('\n\n'));

    // Verify all edge cases are included
    expect(testSuite).toBe("describe('parseConfig', () => {\n  it('should execute successfully with valid inputs', () => {\n    // Arrange\n    const configString = '{\"key\": \"value\"}';\n    const options = { strict: true };\n    \n    // Act\n    const result = parseConfig(configString, options);\n    \n    // Assert\n    expect(result).toEqual({ key: 'value' });\n  });\n\n  it('should handle empty string for configString', () => {\n    // Arrange\n    const configString = '';\n    const options = {};\n    \n    // Act\n    const result = parseConfig(configString, options);\n    \n    // Assert\n    // TODO: Verify expected behavior with empty string\n    expect(result).toBeDefined();\n  });\n\n  it('should handle null value for options', () => {\n    // Arrange\n    const configString = '{\"key\": \"value\"}';\n    const options = null;\n    \n    // Act\n    const result = parseConfig(configString, options);\n    \n    // Assert\n    // TODO: Verify expected behavior with null options\n    expect(result).toBeDefined();\n  });\n});");
    // All assertions now covered by the single toBe check above
    expect(testSuite.match(/it\(/g)?.length).toBe(3);
  });

  it('should maintain template consistency across different methods', () => {
    const templates = new JestTemplates();
    
    // All test templates should follow the same structure
    const basicTest = templates.getBasicTestTemplate({
      arrangeSection: '    const x = 1;',
      callExpression: 'func(x)',
      assertSection: '    expect(result).toBe(1);'
    });
    
    const asyncTest = templates.getAsyncTestTemplate({
      arrangeSection: '    const x = 1;',
      callExpression: 'func(x)'
    });
    
    const arrayTest = templates.getArrayTestTemplate({
      arrangeSection: '    const x = 1;',
      callExpression: 'func(x)'
    });
    
    // All should have the AAA pattern
    expect(basicTest).toBe("  it('should execute successfully with valid inputs', () => {\n    // Arrange\n    const x = 1;\n    \n    // Act\n    const result = func(x);\n    \n    // Assert\n    expect(result).toBe(1);\n  });");
    
    expect(asyncTest).toBe("  it('should handle async operation correctly', async () => {\n    // Arrange\n    const x = 1;\n    \n    // Act\n    const result = await func(x);\n    \n    // Assert\n    expect(result).toBeDefined();\n    // TODO: Add specific assertions for the resolved value\n  });");
    
    expect(arrayTest).toBe("  it('should return an array', () => {\n    // Arrange\n    const x = 1;\n    \n    // Act\n    const result = func(x);\n    \n    // Assert\n    expect(Array.isArray(result)).toBe(true);\n    // TODO: Add assertions for array contents\n  });");
    
    // All should use 'it' blocks
    [basicTest, asyncTest, arrayTest].forEach(test => {
      expect(test).toMatch(/^\s*it\(/);
    });
  });
});