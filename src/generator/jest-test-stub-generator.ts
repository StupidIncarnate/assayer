/**
 * Jest Test Stub Generator
 * 
 * Generates Jest test stubs from function metadata following DAMP principles.
 * Creates comprehensive test structures with proper setup, action, and assertion phases.
 * Refactored to use extracted JestTemplates for improved maintainability and customization.
 */

import { FunctionMetadata } from '../types/metadata';
import { Generator, GeneratorConfig } from '../types/generator';
import { JestTemplates } from '../templates/jest-templates';

export class JestTestStubGenerator implements Generator {
  private templates: JestTemplates;
  private config?: GeneratorConfig;

  constructor(config?: GeneratorConfig, templates?: JestTemplates) {
    this.config = config;
    this.templates = templates || new JestTemplates();
  }

  /**
   * Generate a single test stub for a function
   * @param func Function metadata
   * @param modulePath Path to the module being tested
   * @param options Optional configuration for test generation
   * @returns Generated test stub
   */
  generateTestStub(func: FunctionMetadata, modulePath: string, options?: GeneratorConfig): string {
    const effectiveConfig = options || this.config;
    const testContent = this.buildTestContent(func, modulePath, effectiveConfig);
    return testContent;
  }

  /**
   * Generate a test file from function metadata
   * @param functions Array of function metadata
   * @param modulePath Path to the module being tested
   * @param options Optional configuration for test generation
   * @returns Generated test file content
   */
  generateTestFile(functions: FunctionMetadata[], modulePath: string, options?: GeneratorConfig): string {
    if (functions.length === 0) {
      return this.generateEmptyTestFile(modulePath);
    }

    const effectiveConfig = options || this.config;
    const imports = this.generateImports(functions, modulePath);
    const testSuites = functions
      .map(func => this.generateTestSuite(func, effectiveConfig))
      .join('\n\n');

    return `${imports}\n\n${testSuites}`;
  }

  /**
   * Get the output path for a test file
   * @param sourcePath Path to the source file
   * @param options Optional configuration for test generation
   * @returns Path where the test file should be written
   */
  getTestFilePath(sourcePath: string, options?: GeneratorConfig): string {
    const effectiveConfig = options || this.config;
    const pattern = effectiveConfig?.testFilePattern || '.test';
    const lastSlashIndex = sourcePath.lastIndexOf('/');
    
    if (lastSlashIndex === -1) {
      // Handle root level files (no directory)
      const baseFileName = sourcePath.replace(/\.(ts|tsx|js|jsx)$/, '');
      return `${baseFileName}${pattern}.ts`;
    }
    
    const directory = sourcePath.substring(0, lastSlashIndex);
    const fileName = sourcePath.substring(lastSlashIndex + 1);
    const baseFileName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
    
    return `${directory}/${baseFileName}${pattern}.ts`;
  }

  /**
   * Validate that generated test content is syntactically correct
   * @param testContent The test content to validate
   * @returns True if the test content is valid
   */
  validateTestContent(testContent: string): boolean {
    // Check for required elements
    const hasImports = testContent.includes('import');
    const hasDescribe = testContent.includes('describe(');
    const hasTests = testContent.includes('it(') || testContent.includes('test(');
    
    // Check for balanced braces
    const openBraces = (testContent.match(/\{/g) || []).length;
    const closeBraces = (testContent.match(/\}/g) || []).length;
    
    return hasImports && hasDescribe && hasTests && 
           openBraces === closeBraces;
  }

  /**
   * Builds the complete test content for a single function
   */
  private buildTestContent(functionMeta: FunctionMetadata, modulePath: string, options?: GeneratorConfig): string {
    const imports = this.generateImports([functionMeta], modulePath);
    const testSuite = this.generateTestSuite(functionMeta, options);
    
    return `${imports}\n\n${testSuite}`;
  }

  /**
   * Generates import statements for the test file
   */
  private generateImports(functions: FunctionMetadata[], modulePath: string): string {
    const functionNames = functions.map(f => f.name).join(', ');
    const importPath = this.getImportPath(modulePath);
    
    return this.templates.getImportTemplate(functionNames, importPath);
  }

  /**
   * Converts module path to appropriate import path for tests
   */
  private getImportPath(modulePath: string): string {
    // Remove .ts extension and adjust path for test file location
    const pathWithoutExt = modulePath.replace(/\.ts$/, '');
    
    // If it's just a filename without path, return it with './'
    if (!pathWithoutExt.includes('/')) {
      return './' + pathWithoutExt;
    }
    
    // If the path starts with src/, replace with relative path
    if (pathWithoutExt.startsWith('src/')) {
      return '../' + pathWithoutExt.substring(4);
    }
    
    // For other paths, determine relative path based on directory depth
    const lastSlashIndex = pathWithoutExt.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      // Get just the filename
      const filename = pathWithoutExt.substring(lastSlashIndex + 1);
      return './' + filename;
    }
    
    return './' + pathWithoutExt;
  }

  /**
   * Generates a complete test suite for a function
   */
  private generateTestSuite(functionMeta: FunctionMetadata, options?: GeneratorConfig): string {
    const { name } = functionMeta;
    
    const testCases = [
      this.generateBasicTest(functionMeta),
      ...this.generateParameterTests(functionMeta),
      ...(options?.includeAsyncTests !== false ? this.generateReturnTypeTests(functionMeta) : []),
      ...(options?.includeEdgeCases !== false ? this.generateEdgeCaseTests(functionMeta) : [])
    ].filter(Boolean);

    const testCasesContent = testCases.join('\n\n');
    return this.templates.getDescribeTemplate(name, testCasesContent);
  }

  /**
   * Generates a basic test case for the function
   */
  private generateBasicTest(functionMeta: FunctionMetadata): string {
    const { name, params, returnType } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);
    
    return this.templates.getBasicTestTemplate({
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression,
      assertSection: this.generateAssertSection(returnType)
    });
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

    const invalidCall = `${name}(${params.map(() => 'undefined as any').join(', ')})`;
    
    return this.templates.getRequiredParameterTestTemplate({
      functionName: name,
      invalidCall
    });
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

    return this.templates.getNullParameterTestTemplate({
      paramName: param.name,
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
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

    return this.templates.getAsyncTestTemplate({
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
  }

  /**
   * Generates test for array return types
   */
  private generateArrayReturnTest(functionMeta: FunctionMetadata): string {
    const { name, params } = functionMeta;
    const paramValues = this.generateMockValues(params);
    const paramNames = params.map(p => p.name);
    const callExpression = this.generateFunctionCall(name, paramNames);

    return this.templates.getArrayTestTemplate({
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
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

    return this.templates.getEmptyStringTestTemplate({
      paramName,
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
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

    return this.templates.getBoundaryValueTestTemplate({
      paramName,
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
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

    return this.templates.getEmptyArrayTestTemplate({
      paramName,
      arrangeSection: this.generateArrangeSection(params, paramValues),
      callExpression
    });
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
    return this.templates.getEmptyTestFileTemplate({
      modulePath,
      moduleName: this.extractModuleName(modulePath)
    });
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