/**
 * Jest Test Stub Generator
 * 
 * Generates Jest test stubs from function metadata following DAMP principles.
 * Creates comprehensive test structures with proper setup, action, and assertion phases.
 */

import { FunctionMetadata } from '../types/metadata';

export class JestTestStubGenerator {
  /**
   * Generates a complete Jest test stub for a given function
   * @param functionMeta - The function metadata to generate tests for
   * @param modulePath - The path to the module containing the function
   * @returns The generated test stub as a string
   */
  generateTestStub(functionMeta: FunctionMetadata, modulePath: string): string {
    const testContent = this.buildTestContent(functionMeta, modulePath);
    return testContent;
  }

  /**
   * Generates multiple test stubs for an array of functions
   * @param functionsMetadata - Array of function metadata
   * @param modulePath - The path to the module containing the functions
   * @returns The complete test file content
   */
  generateTestFile(functionsMetadata: FunctionMetadata[], modulePath: string): string {
    if (functionsMetadata.length === 0) {
      return this.generateEmptyTestFile(modulePath);
    }

    const imports = this.generateImports(functionsMetadata, modulePath);
    const testSuites = functionsMetadata
      .map(func => this.generateTestSuite(func))
      .join('\n\n');

    return `${imports}\n\n${testSuites}`;
  }

  /**
   * Builds the complete test content for a single function
   */
  private buildTestContent(functionMeta: FunctionMetadata, modulePath: string): string {
    const imports = this.generateImports([functionMeta], modulePath);
    const testSuite = this.generateTestSuite(functionMeta);
    
    return `${imports}\n\n${testSuite}`;
  }

  /**
   * Generates import statements for the test file
   */
  private generateImports(functions: FunctionMetadata[], modulePath: string): string {
    const functionNames = functions.map(f => f.name).join(', ');
    const importPath = this.getImportPath(modulePath);
    
    return `import { ${functionNames} } from '${importPath}';`;
  }

  /**
   * Converts module path to appropriate import path for tests
   */
  private getImportPath(modulePath: string): string {
    // Remove .ts extension and adjust path for test file location
    const pathWithoutExt = modulePath.replace(/\.ts$/, '');
    
    // If the path starts with src/, replace with relative path
    if (pathWithoutExt.startsWith('src/')) {
      return '../' + pathWithoutExt.substring(4);
    }
    
    return pathWithoutExt;
  }

  /**
   * Generates a complete test suite for a function
   */
  private generateTestSuite(functionMeta: FunctionMetadata): string {
    const { name } = functionMeta;
    
    const testCases = [
      this.generateBasicTest(functionMeta),
      ...this.generateParameterTests(functionMeta),
      ...this.generateReturnTypeTests(functionMeta),
      ...this.generateEdgeCaseTests(functionMeta)
    ].filter(Boolean);

    return `describe('${name}', () => {
${testCases.join('\n\n')}
});`;
  }

  /**
   * Generates a basic test case for the function
   */
  private generateBasicTest(functionMeta: FunctionMetadata): string {
    const { name, params, returnType } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);
    
    return `  it('should execute successfully with valid inputs', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
${this.generateAssertSection(returnType)}
  });`;
  }

  /**
   * Generates test cases for different parameter scenarios
   */
  private generateParameterTests(functionMeta: FunctionMetadata): string[] {
    const tests: string[] = [];
    const { params } = functionMeta;

    // Test for required parameters
    if (params.length > 0) {
      tests.push(this.generateRequiredParameterTest(functionMeta));
    }

    // Test for nullable/optional parameters
    params.forEach((param, index) => {
      if (this.isNullableType(param.type) || this.isOptionalType(param.type)) {
        tests.push(this.generateNullParameterTest(functionMeta, index));
      }
    });

    return tests;
  }

  /**
   * Generates test for required parameters
   */
  private generateRequiredParameterTest(functionMeta: FunctionMetadata): string {
    const { name, params } = functionMeta;
    
    if (params.length === 0) return '';

    return `  it('should handle missing required parameters gracefully', () => {
    // Arrange
    const invalidCall = () => ${name}(${params.map(() => 'undefined as any').join(', ')});
    
    // Act & Assert
    // TODO: Adjust assertion based on function's error handling
    expect(invalidCall).toThrow();
  });`;
  }

  /**
   * Generates test for null parameter handling
   */
  private generateNullParameterTest(functionMeta: FunctionMetadata, paramIndex: number): string {
    const { name, params } = functionMeta;
    const param = params[paramIndex];
    const paramValues = this.generateMockValues(params);
    paramValues[paramIndex] = 'null';
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should handle null value for ${param.name}', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
    // TODO: Verify expected behavior with null ${param.name}
    expect(result).toBeDefined();
  });`;
  }

  /**
   * Generates tests for different return type scenarios
   */
  private generateReturnTypeTests(functionMeta: FunctionMetadata): string[] {
    const tests: string[] = [];
    const { returnType } = functionMeta;

    if (this.isPromiseType(returnType)) {
      tests.push(this.generateAsyncTest(functionMeta));
    }

    if (this.isArrayType(returnType)) {
      tests.push(this.generateArrayReturnTest(functionMeta));
    }

    return tests;
  }

  /**
   * Generates test for async functions
   */
  private generateAsyncTest(functionMeta: FunctionMetadata): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should handle async operation correctly', async () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = await ${callExpression};
    
    // Assert
    expect(result).toBeDefined();
    // TODO: Add specific assertions for the resolved value
  });`;
  }

  /**
   * Generates test for array return types
   */
  private generateArrayReturnTest(functionMeta: FunctionMetadata): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should return an array', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
    expect(Array.isArray(result)).toBe(true);
    // TODO: Add assertions for array contents
  });`;
  }

  /**
   * Generates edge case tests
   */
  private generateEdgeCaseTests(functionMeta: FunctionMetadata): string[] {
    const tests: string[] = [];
    const { params } = functionMeta;

    // Add edge cases based on parameter types
    params.forEach((param) => {
      if (param.type === 'string') {
        tests.push(this.generateEmptyStringTest(functionMeta, param.name));
      } else if (param.type === 'number') {
        tests.push(this.generateBoundaryValueTest(functionMeta, param.name));
      } else if (this.isArrayType(param.type)) {
        tests.push(this.generateEmptyArrayTest(functionMeta, param.name));
      }
    });

    return tests;
  }

  /**
   * Generates test for empty string edge case
   */
  private generateEmptyStringTest(functionMeta: FunctionMetadata, paramName: string): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramIndex = params.findIndex(p => p.name === paramName);
    if (paramIndex !== -1) {
      paramValues[paramIndex] = "''";
    }
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should handle empty string for ${paramName}', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
    // TODO: Verify expected behavior with empty string
    expect(result).toBeDefined();
  });`;
  }

  /**
   * Generates test for numeric boundary values
   */
  private generateBoundaryValueTest(functionMeta: FunctionMetadata, paramName: string): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramIndex = params.findIndex(p => p.name === paramName);
    if (paramIndex !== -1) {
      paramValues[paramIndex] = '0';
    }
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should handle boundary value (0) for ${paramName}', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });`;
  }

  /**
   * Generates test for empty array edge case
   */
  private generateEmptyArrayTest(functionMeta: FunctionMetadata, paramName: string): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramIndex = params.findIndex(p => p.name === paramName);
    if (paramIndex !== -1) {
      paramValues[paramIndex] = '[]';
    }
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return `  it('should handle empty array for ${paramName}', () => {
    // Arrange
${this.generateArrangeSection(params, paramValues)}
    
    // Act
    const result = ${callExpression};
    
    // Assert
    // TODO: Verify expected behavior with empty array
    expect(result).toBeDefined();
  });`;
  }

  /**
   * Generates mock values for function parameters
   */
  private generateMockValues(params: FunctionMetadata['params']): string[] {
    return params.map(param => this.generateMockValue(param.type, param.name));
  }

  /**
   * Generates a mock value based on type
   */
  private generateMockValue(type: string, name: string): string {
    // Handle basic types
    if (type === 'string') return `'test-${name}'`;
    if (type === 'number') return '42';
    if (type === 'boolean') return 'true';
    if (type === 'null') return 'null';
    if (type === 'undefined') return 'undefined';
    
    // Handle arrays
    if (this.isArrayType(type)) {
      const elementType = this.extractArrayElementType(type);
      return `[${this.generateMockValue(elementType, 'element')}]`;
    }
    
    // Handle promises
    if (this.isPromiseType(type)) {
      const resolvedType = this.extractPromiseResolvedType(type);
      return `Promise.resolve(${this.generateMockValue(resolvedType, 'resolved')})`;
    }
    
    // Handle objects and custom types
    return `{} as ${type}`;
  }

  /**
   * Generates the arrange section of a test
   */
  private generateArrangeSection(params: FunctionMetadata['params'], values: string[]): string {
    if (params.length === 0) return '    // No parameters to arrange';
    
    return params
      .map((param, index) => `    const ${param.name} = ${values[index]};`)
      .join('\n');
  }

  /**
   * Generates a function call expression
   */
  private generateFunctionCall(functionName: string, paramValues: string[]): string {
    if (paramValues.length === 0) {
      return `${functionName}()`;
    }
    
    return `${functionName}(${paramValues.join(', ')})`;
  }

  /**
   * Generates the assert section based on return type
   */
  private generateAssertSection(returnType: string): string {
    if (returnType === 'void') {
      return '    // Function returns void - verify no errors thrown';
    }
    
    if (returnType === 'boolean') {
      return '    expect(typeof result).toBe(\'boolean\');';
    }
    
    if (returnType === 'string') {
      return '    expect(typeof result).toBe(\'string\');';
    }
    
    if (returnType === 'number') {
      return '    expect(typeof result).toBe(\'number\');';
    }
    
    if (this.isArrayType(returnType)) {
      return '    expect(Array.isArray(result)).toBe(true);';
    }
    
    return '    expect(result).toBeDefined();';
  }

  /**
   * Generates an empty test file when no functions are found
   */
  private generateEmptyTestFile(modulePath: string): string {
    return `// No functions found in ${modulePath}
// Add functions to generate test stubs

describe('${this.extractModuleName(modulePath)}', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`;
  }

  /**
   * Extracts module name from path
   */
  private extractModuleName(modulePath: string): string {
    const parts = modulePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|js)$/, '');
  }

  /**
   * Type checking utilities
   */
  private isNullableType(type: string): boolean {
    return type.includes('null') || type.includes('undefined');
  }

  private isOptionalType(type: string): boolean {
    return type.includes('?') || type.includes('undefined');
  }

  private isPromiseType(type: string): boolean {
    return type.startsWith('Promise<') || type === 'Promise';
  }

  private isArrayType(type: string): boolean {
    return type.endsWith('[]') || type.startsWith('Array<');
  }

  private extractArrayElementType(type: string): string {
    if (type.endsWith('[]')) {
      return type.slice(0, -2);
    }
    if (type.startsWith('Array<')) {
      return type.slice(6, -1);
    }
    return 'any';
  }

  private extractPromiseResolvedType(type: string): string {
    if (type.startsWith('Promise<')) {
      return type.slice(8, -1);
    }
    return 'any';
  }
}