# Using Jest Templates

The `JestTemplates` class provides a flexible way to customize test generation output in Assayer. This guide explains how to use and extend the templates.

> **Note**: This documentation has been consolidated into the main [README.md](../../README.md). Please refer to the "Configuration" and "Examples" sections for comprehensive template usage.

## Overview

Jest templates allow you to:
- Customize the format of generated tests
- Support different test frameworks (Jest, Vitest, Mocha, etc.)
- Maintain consistency across generated test files
- Add project-specific conventions to generated tests

**For complete documentation, see the main [README.md](../../README.md) file which contains:**
- Template configuration options
- Framework-specific examples
- Custom template creation
- Integration with the consolidated architecture

## Basic Usage

### Using Default Templates

```typescript
import { JestTemplates } from 'assayer';

const templates = new JestTemplates();

// Generate an import statement
const importStmt = templates.getImportTemplate('myFunction', '../src/utils');
// Result: import { myFunction } from '../src/utils';

// Generate a basic test
const test = templates.getBasicTestTemplate({
  arrangeSection: '    const input = 42;',
  callExpression: 'myFunction(input)',
  assertSection: '    expect(result).toBe(84);'
});
```

### Using the Default Instance

For convenience, a pre-configured instance is available:

```typescript
import { defaultJestTemplates } from 'assayer';

const test = defaultJestTemplates.getBasicTestTemplate({
  arrangeSection: '    const value = "test";',
  callExpression: 'processString(value)',
  assertSection: '    expect(result).toBe("TEST");'
});
```

## Template Methods

### Import Templates

```typescript
getImportTemplate(functionNames: string, importPath: string): string
```

Generates import statements for the functions being tested.

### Test Structure Templates

```typescript
getDescribeTemplate(functionName: string, testCases: string): string
```

Creates the outer describe block containing all test cases.

### Test Case Templates

- `getBasicTestTemplate()` - Standard test with Arrange-Act-Assert pattern
- `getAsyncTestTemplate()` - Tests for async/Promise-returning functions
- `getArrayTestTemplate()` - Tests for array-returning functions
- `getNullParameterTestTemplate()` - Tests for null parameter handling
- `getRequiredParameterTestTemplate()` - Tests for missing required parameters
- `getEmptyStringTestTemplate()` - Tests for empty string edge cases
- `getBoundaryValueTestTemplate()` - Tests for numeric boundary values
- `getEmptyArrayTestTemplate()` - Tests for empty array edge cases
- `getEmptyTestFileTemplate()` - Template for files with no testable functions

## Customizing Templates

### Creating Custom Templates

You can customize any template by passing a configuration object:

```typescript
const customTemplates = new JestTemplates({
  importTemplate: `const { {{functionNames}} } = require('{{importPath}}');`,
  basicTestTemplate: `  test('{{testDescription}}', () => {
    // Given
{{arrangeSection}}
    
    // When
    const result = {{callExpression}};
    
    // Then
{{assertSection}}
  });`
});
```

### Template Variables

Templates use `{{variable}}` syntax for interpolation:

- `{{functionNames}}` - Comma-separated list of function names
- `{{importPath}}` - Path to the module being tested
- `{{functionName}}` - Name of the function being tested
- `{{testCases}}` - Generated test cases content
- `{{arrangeSection}}` - Variable setup code
- `{{callExpression}}` - Function call with parameters
- `{{assertSection}}` - Assertion statements
- `{{paramName}}` - Name of a specific parameter

### Framework-Specific Templates

#### Vitest Configuration

```typescript
const vitestTemplates = new JestTemplates({
  importTemplate: `import { {{functionNames}} } from '{{importPath}}';
import { describe, it, expect } from 'vitest';`,
  asyncTestTemplate: `  it('handles async operations', async () => {
    // Setup
{{arrangeSection}}
    
    // Execute
    const result = await {{callExpression}};
    
    // Verify
    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });`
});
```

#### Mocha/Chai Configuration

```typescript
const mochaTemplates = new JestTemplates({
  importTemplate: `const { {{functionNames}} } = require('{{importPath}}');
const { expect } = require('chai');`,
  describeTemplate: `context('{{functionName}}', function() {
{{testCases}}
});`,
  basicTestTemplate: `  it('should {{testDescription}}', function() {
{{arrangeSection}}
    
    const result = {{callExpression}};
    
{{assertSection}}
  });`
});
```

## Integration with Generators

The `JestTemplates` class is designed to work seamlessly with test generators:

```typescript
import { JestTemplates, Generator, FunctionMetadata } from 'assayer';

class CustomGenerator implements Generator {
  private templates: JestTemplates;
  
  constructor() {
    this.templates = new JestTemplates({
      // Your custom templates here
    });
  }
  
  generateTestStub(functionMeta: FunctionMetadata, modulePath: string): string {
    const importStmt = this.templates.getImportTemplate(
      functionMeta.name,
      this.getImportPath(modulePath)
    );
    
    const testCase = this.templates.getBasicTestTemplate({
      arrangeSection: this.generateArrangeSection(functionMeta.params),
      callExpression: this.generateFunctionCall(functionMeta),
      assertSection: this.generateAssertSection(functionMeta.returnType)
    });
    
    const testSuite = this.templates.getDescribeTemplate(
      functionMeta.name,
      testCase
    );
    
    return `${importStmt}\n\n${testSuite}`;
  }
}
```

## Best Practices

1. **Consistency**: Use the same template instance throughout your generator for consistency
2. **Validation**: Templates preserve placeholders for missing variables (e.g., `{{variable}}`)
3. **Extensibility**: Create new template methods for project-specific patterns
4. **Documentation**: Include TODO comments in templates for manual completion
5. **Testing**: Test your custom templates to ensure correct output

## Examples

See the main [README.md](../../README.md) for comprehensive examples of using templates in different scenarios.

---

## ⚠️ Consolidation Notice

This guide references legacy import patterns. For the current consolidated approach:

1. **Import from 'assayer'** using the single barrel export
2. **Use FunctionParser** with JestTestStubGenerator for complete workflows
3. **See [README.md](../../README.md)** for current examples and configuration options
4. **Use UpdateIntegration** for high-level template integration

### Modern Template Usage

```typescript
import { 
  JestTemplates, 
  JestTestStubGenerator, 
  FunctionParser,
  createDefaultUpdateIntegration 
} from 'assayer';

// High-level approach (templates handled automatically)
const integration = createDefaultUpdateIntegration();
await integration.processFile('./src/module.ts');

// Custom template configuration
const customTemplates = new JestTemplates({
  importTemplate: `import { {{functionNames}} } from '{{importPath}}';`,
  describeTemplate: `describe('{{functionName}}', () => {\n{{testCases}}\n});`
});

const generator = new JestTestStubGenerator({ templates: customTemplates });
const parser = new FunctionParser();
```