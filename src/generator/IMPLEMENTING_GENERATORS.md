# Implementing Custom Test Generators

This guide explains how to create custom test generators that implement the `Generator` interface.

> **Note**: This documentation has been moved to the main [README.md](../../README.md). Please refer to the "API Reference" and "Examples" sections for comprehensive generator implementation guidance.

## Overview

The `Generator` interface defines the contract that all test generators must implement. This ensures consistency across different testing frameworks and allows for easy swapping of generators.

**For complete documentation, see the main [README.md](../../README.md) file which contains:**
- Complete API reference for all generators
- Configuration options
- Framework-specific examples
- Migration guide from legacy components

## Interface Definition

```typescript
interface Generator {
  generateTestStub(
    functionMeta: FunctionMetadata, 
    modulePath: string,
    options?: GeneratorConfig
  ): string;

  generateTestFile(
    functionsMetadata: FunctionMetadata[], 
    modulePath: string,
    options?: GeneratorConfig
  ): string;

  getTestFilePath(
    sourceFilePath: string,
    options?: GeneratorConfig
  ): string;

  validateTestContent(testContent: string): boolean;
}
```

## Step-by-Step Implementation

### 1. Create Your Generator Class

```typescript
import { Generator, GeneratorConfig, FunctionMetadata } from 'assayer';

export class VitestTestStubGenerator implements Generator {
  // Implementation goes here
}
```

### 2. Implement Required Methods

#### generateTestStub
Generates a test stub for a single function.

```typescript
generateTestStub(
  functionMeta: FunctionMetadata,
  modulePath: string,
  options?: GeneratorConfig
): string {
  // Generate imports
  const imports = this.generateImports(functionMeta, modulePath);
  
  // Generate test cases
  const testCases = this.generateTestCases(functionMeta, options);
  
  // Combine into complete test
  return `${imports}\n\n${testCases}`;
}
```

#### generateTestFile
Generates a complete test file for multiple functions.

```typescript
generateTestFile(
  functionsMetadata: FunctionMetadata[],
  modulePath: string,
  options?: GeneratorConfig
): string {
  if (functionsMetadata.length === 0) {
    return this.generateEmptyTestFile(modulePath);
  }

  // Generate imports for all functions
  const imports = this.generateImports(functionsMetadata, modulePath);
  
  // Generate test suites for each function
  const testSuites = functionsMetadata
    .map(func => this.generateTestSuite(func, options))
    .join('\n\n');

  return `${imports}\n\n${testSuites}`;
}
```

#### getTestFilePath
Determines where the test file should be saved.

```typescript
getTestFilePath(
  sourceFilePath: string,
  options?: GeneratorConfig
): string {
  const pattern = options?.testFilePattern || '.test';
  const baseFileName = sourceFilePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  return `${baseFileName}${pattern}.ts`;
}
```

#### validateTestContent
Validates that generated test content is syntactically correct.

```typescript
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
```

### 3. Handle Generator Options

The `GeneratorConfig` interface allows customization:

```typescript
interface GeneratorConfig {
  framework?: 'jest' | 'vitest' | 'mocha';
  includeEdgeCases?: boolean;
  includeAsyncTests?: boolean;
  testFilePattern?: string;
  useTypeScript?: boolean;
}
```

Example of using options:

```typescript
private generateTestCases(
  functionMeta: FunctionMetadata,
  options?: GeneratorConfig
): string {
  const testCases = [];
  
  // Always include basic test
  testCases.push(this.generateBasicTest(functionMeta));
  
  // Conditionally include edge cases
  if (options?.includeEdgeCases !== false) {
    testCases.push(...this.generateEdgeCases(functionMeta));
  }
  
  // Conditionally include async tests
  if (options?.includeAsyncTests !== false && 
      this.isAsyncFunction(functionMeta)) {
    testCases.push(this.generateAsyncTest(functionMeta));
  }
  
  return testCases.join('\n\n');
}
```

### 4. Register Your Generator

Register your generator with the factory:

```typescript
import { GeneratorFactory } from './generator-factory';
import { VitestTestStubGenerator } from './vitest-generator';

// Register the generator
GeneratorFactory.register('vitest', VitestTestStubGenerator);

// Now it can be used
const generator = GeneratorFactory.create('vitest');
```

## Complete Example: Minimal Mocha Generator

```typescript
import { Generator, GeneratorConfig, FunctionMetadata } from 'assayer';

export class MochaTestStubGenerator implements Generator {
  generateTestStub(
    functionMeta: FunctionMetadata,
    modulePath: string,
    options?: GeneratorConfig
  ): string {
    const imports = `const { expect } = require('chai');
const { ${functionMeta.name} } = require('${modulePath}');`;

    const test = `
describe('${functionMeta.name}', () => {
  it('should work correctly', () => {
    // TODO: Implement test
    expect(${functionMeta.name}).to.be.a('function');
  });
});`;

    return `${imports}\n${test}`;
  }

  generateTestFile(
    functionsMetadata: FunctionMetadata[],
    modulePath: string,
    options?: GeneratorConfig
  ): string {
    if (functionsMetadata.length === 0) {
      return '// No functions to test';
    }

    const functionNames = functionsMetadata.map(f => f.name).join(', ');
    const imports = `const { expect } = require('chai');
const { ${functionNames} } = require('${modulePath}');`;

    const tests = functionsMetadata
      .map(func => this.generateTestSuite(func))
      .join('\n\n');

    return `${imports}\n\n${tests}`;
  }

  getTestFilePath(
    sourceFilePath: string,
    options?: GeneratorConfig
  ): string {
    const pattern = options?.testFilePattern || '.test';
    const baseFileName = sourceFilePath.replace(/\.(ts|tsx|js|jsx)$/, '');
    return `${baseFileName}${pattern}.js`;
  }

  validateTestContent(testContent: string): boolean {
    return testContent.includes('describe') && 
           testContent.includes('it') && 
           testContent.includes('expect');
  }

  private generateTestSuite(func: FunctionMetadata): string {
    return `
describe('${func.name}', () => {
  it('should be a function', () => {
    expect(${func.name}).to.be.a('function');
  });

  it('should have correct arity', () => {
    expect(${func.name}).to.have.lengthOf(${func.params.length});
  });
});`;
  }
}
```

## Best Practices

1. **Follow DAMP Principles**: Tests should be Descriptive And Meaningful Phrases
2. **Include Setup/Act/Assert**: Structure tests with clear phases
3. **Generate Comprehensive Tests**: Cover basic functionality, edge cases, and error conditions
4. **Use Type Information**: Leverage the FunctionMetadata to generate appropriate test cases
5. **Make Tests Executable**: Generated tests should run without modification (though they may fail initially)
6. **Handle Options Gracefully**: Respect user preferences while providing sensible defaults

## Testing Your Generator

Create tests to verify your generator implements the interface correctly:

```typescript
describe('MyCustomGenerator', () => {
  let generator: Generator;

  beforeEach(() => {
    generator = new MyCustomGenerator();
  });

  it('should implement Generator interface', () => {
    expect(generator.generateTestStub).toBeDefined();
    expect(generator.generateTestFile).toBeDefined();
    expect(generator.getTestFilePath).toBeDefined();
    expect(generator.validateTestContent).toBeDefined();
  });

  // Add specific tests for your implementation
});
```

## Integration with Assayer

Once your generator is implemented and tested, it can be used throughout the Assayer system wherever a `Generator` is needed. The interface ensures compatibility with the parser output and the rest of the toolchain.

---

## ⚠️ Consolidation Notice

This implementation guide references legacy patterns. For the most up-to-date approach:

1. **Use FunctionParser** with appropriate configuration
2. **Import from 'assayer'** using the single barrel export
3. **See [README.md](../../README.md)** for current best practices and examples
4. **Use UpdateIntegration** for high-level workflow instead of manual generator usage

### Modern Usage Example

```typescript
import { FunctionParser, JestTestStubGenerator, createDefaultUpdateIntegration } from 'assayer';

// High-level approach (recommended)
const integration = createDefaultUpdateIntegration();
await integration.processFile('./src/my-module.ts');

// Low-level approach (for custom implementations)
const parser = new FunctionParser();
const generator = new JestTestStubGenerator();
const sourceFile = parser.createSourceFileFromPath('./src/my-module.ts');
const functions = parser.parse(sourceFile);
const testContent = generator.generateTestFile(functions, './src/my-module');
// Clean up
parser.getProject().removeSourceFile(sourceFile);
```