/**
 * Jest Test Templates
 * 
 * Configurable templates for Jest test generation.
 * Extracted from JestTestStubGenerator to allow customization and reusability.
 */

export interface TestTemplate {
  template: string;
  variables: Record<string, any>;
}

export interface JestTemplateConfig {
  importTemplate?: string;
  describeTemplate?: string;
  basicTestTemplate?: string;
  asyncTestTemplate?: string;
  arrayTestTemplate?: string;
  nullParameterTestTemplate?: string;
  requiredParameterTestTemplate?: string;
  emptyStringTestTemplate?: string;
  boundaryValueTestTemplate?: string;
  emptyArrayTestTemplate?: string;
  emptyTestFileTemplate?: string;
}

export class JestTemplates {
  private config: JestTemplateConfig;

  constructor(config?: JestTemplateConfig) {
    this.config = {
      ...this.getDefaultTemplates(),
      ...config
    };
  }

  /**
   * Get the import statement template
   */
  getImportTemplate(functionNames: string, importPath: string): string {
    const template = this.config.importTemplate || this.getDefaultTemplates().importTemplate;
    return this.interpolate(template!, { functionNames, importPath });
  }

  /**
   * Get the describe block template
   */
  getDescribeTemplate(functionName: string, testCases: string): string {
    const template = this.config.describeTemplate || this.getDefaultTemplates().describeTemplate;
    return this.interpolate(template!, { functionName, testCases });
  }

  /**
   * Get the basic test case template
   */
  getBasicTestTemplate(params: {
    arrangeSection: string;
    callExpression: string;
    assertSection: string;
  }): string {
    const template = this.config.basicTestTemplate || this.getDefaultTemplates().basicTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the async test template
   */
  getAsyncTestTemplate(params: {
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.asyncTestTemplate || this.getDefaultTemplates().asyncTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the array return test template
   */
  getArrayTestTemplate(params: {
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.arrayTestTemplate || this.getDefaultTemplates().arrayTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the null parameter test template
   */
  getNullParameterTestTemplate(params: {
    paramName: string;
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.nullParameterTestTemplate || this.getDefaultTemplates().nullParameterTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the required parameter test template
   */
  getRequiredParameterTestTemplate(params: {
    functionName: string;
    invalidCall: string;
  }): string {
    const template = this.config.requiredParameterTestTemplate || this.getDefaultTemplates().requiredParameterTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the empty string test template
   */
  getEmptyStringTestTemplate(params: {
    paramName: string;
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.emptyStringTestTemplate || this.getDefaultTemplates().emptyStringTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the boundary value test template
   */
  getBoundaryValueTestTemplate(params: {
    paramName: string;
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.boundaryValueTestTemplate || this.getDefaultTemplates().boundaryValueTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the empty array test template
   */
  getEmptyArrayTestTemplate(params: {
    paramName: string;
    arrangeSection: string;
    callExpression: string;
  }): string {
    const template = this.config.emptyArrayTestTemplate || this.getDefaultTemplates().emptyArrayTestTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get the empty test file template
   */
  getEmptyTestFileTemplate(params: {
    modulePath: string;
    moduleName: string;
  }): string {
    const template = this.config.emptyTestFileTemplate || this.getDefaultTemplates().emptyTestFileTemplate;
    return this.interpolate(template!, params);
  }

  /**
   * Get default templates
   */
  private getDefaultTemplates(): Required<JestTemplateConfig> {
    return {
      importTemplate: `import { {{functionNames}} } from '{{importPath}}';`,

      describeTemplate: `describe('{{functionName}}', () => {
{{testCases}}
});`,

      basicTestTemplate: `  it('should execute successfully with valid inputs', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
{{assertSection}}
  });`,

      asyncTestTemplate: `  it('should handle async operation correctly', async () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = await {{callExpression}};
    
    // Assert
    expect(result).toBeDefined();
    // TODO: Add specific assertions for the resolved value
  });`,

      arrayTestTemplate: `  it('should return an array', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
    expect(Array.isArray(result)).toBe(true);
    // TODO: Add assertions for array contents
  });`,

      nullParameterTestTemplate: `  it('should handle null value for {{paramName}}', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
    // TODO: Verify expected behavior with null {{paramName}}
    expect(result).toBeDefined();
  });`,

      requiredParameterTestTemplate: `  it('should handle missing required parameters gracefully', () => {
    // Arrange
    const invalidCall = () => {{invalidCall}};
    
    // Act & Assert
    // TODO: Adjust assertion based on function's error handling
    expect(invalidCall).toThrow();
  });`,

      emptyStringTestTemplate: `  it('should handle empty string for {{paramName}}', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
    // TODO: Verify expected behavior with empty string
    expect(result).toBeDefined();
  });`,

      boundaryValueTestTemplate: `  it('should handle boundary value (0) for {{paramName}}', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
    // TODO: Verify expected behavior with boundary value
    expect(result).toBeDefined();
  });`,

      emptyArrayTestTemplate: `  it('should handle empty array for {{paramName}}', () => {
    // Arrange
{{arrangeSection}}
    
    // Act
    const result = {{callExpression}};
    
    // Assert
    // TODO: Verify expected behavior with empty array
    expect(result).toBeDefined();
  });`,

      emptyTestFileTemplate: `// No functions found in {{modulePath}}
// Add functions to generate test stubs

describe('{{moduleName}}', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`
    };
  }

  /**
   * Simple template interpolation
   */
  private interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
    });
  }
}

/**
 * Default instance for convenience
 */
export const defaultJestTemplates = new JestTemplates();