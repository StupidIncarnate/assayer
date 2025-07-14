# Assayer

A comprehensive TypeScript test stub generator that uses the TypeScript Compiler API to parse source files and generate executable test stubs with comprehensive branch coverage.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Architecture](#core-architecture)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Development](#development)
- [Testing](#testing)

## Overview

Assayer is a deterministic testing tool that addresses the unreliability of AI-based code analysis. It uses the TypeScript Compiler API to parse source files, identify all testable code paths and branches, then generates executable test stubs. The key insight is moving intelligence from AI (unreliable) to AST parsing (deterministic), using AI only for filling pre-structured test stubs.

### Key Features

- **Deterministic Parsing**: Uses TypeScript Compiler API for reliable AST analysis
- **Comprehensive Coverage**: Identifies all function types including arrow functions, class methods, and object methods
- **Flexible Generation**: Supports Jest, Vitest, and custom test frameworks
- **Configurable Extraction**: Control which functions to extract (exported-only vs all functions)
- **Template System**: Customizable test templates for different testing patterns
- **Validation Framework**: Built-in validation to ensure generated tests are syntactically correct

## Installation

```bash
npm install assayer
```

## Quick Start

### Basic Usage

```typescript
import { FunctionParser, JestTestStubGenerator } from 'assayer';

// Parse a TypeScript file
const parser = new FunctionParser();
const functions = parser.parseFile('./src/my-module.ts');

// Generate Jest test stubs
const generator = new JestTestStubGenerator();
const testContent = generator.generateTestFile(functions, './src/my-module');

// Write to test file
import { writeTestFile } from 'assayer';
await writeTestFile('./src/my-module.test.ts', testContent);
```

### High-Level Integration

```typescript
import { createDefaultUpdateIntegration } from 'assayer';

const integration = createDefaultUpdateIntegration();
const result = await integration.processFile('./src/my-functions.ts', {
  overwrite: true
});

console.log(`Generated test file: ${result.testFilePath}`);
```

## Core Architecture

Assayer's architecture is built around three main components:

### 1. Parsers

Extract function metadata from TypeScript/JavaScript source code.

- **FunctionParser**: The main parser supporting configurable function extraction
- **SimpleFunctionParser**: Legacy parser for exported functions only

### 2. Generators

Convert function metadata into executable test stubs.

- **JestTestStubGenerator**: Generates Jest-compatible test files
- **GeneratorFactory**: Factory for creating generators with custom configurations

### 3. Templates

Customizable templates for different test patterns and frameworks.

- **JestTemplates**: Template system for Jest test generation
- **Custom Templates**: Support for Vitest, Mocha, and custom frameworks

## API Reference

### FunctionParser

The main parser class that combines functionality from legacy parsers.

```typescript
import { FunctionParser, ParserConfig } from 'assayer';

const config: ParserConfig = {
  includePrivate: false,        // Only exported functions (like SimpleFunctionParser)
  includeArrowFunctions: true,  // Include arrow functions
  includeClassMethods: true     // Include class methods
};

const parser = new ConsolidatedParser(config);

// Parse from file
const functions = parser.parseFile('./src/module.ts');

// Parse from source code
const functions2 = parser.parseCode(`
export function add(a: number, b: number): number {
  return a + b;
}
`, 'example.ts');
```

### JestTestStubGenerator

Generates Jest-compatible test files from function metadata.

```typescript
import { JestTestStubGenerator, GeneratorConfig } from 'assayer';

const config: GeneratorConfig = {
  framework: 'jest',
  includeEdgeCases: true,
  includeAsyncTests: true,
  testFilePattern: '.test',
  useTypeScript: true
};

const generator = new JestTestStubGenerator(config);

// Generate test for single function
const testStub = generator.generateTestStub(functionMetadata, './src/module');

// Generate complete test file
const testFile = generator.generateTestFile(functionsArray, './src/module');

// Get test file path
const testPath = generator.getTestFilePath('./src/module.ts');
```

### UpdateIntegration

High-level workflow component for processing files end-to-end.

```typescript
import { UpdateIntegration, createDefaultUpdateIntegration } from 'assayer';

// Use default configuration
const integration = createDefaultUpdateIntegration();

// Or create custom integration
const customParser = new ConsolidatedParser({ includePrivate: false });
const customGenerator = new JestTestStubGenerator();
const customIntegration = new UpdateIntegration(customParser, customGenerator);

// Process files
const result = await integration.processFile('./src/functions.ts', {
  overwrite: true,
  beforeGenerate: (functions) => {
    // Filter or modify functions before generation
    return functions.filter(f => !f.name.startsWith('_'));
  },
  afterGenerate: (content) => {
    // Add custom header or modify generated content
    return `// Auto-generated on ${new Date()}\n\n${content}`;
  }
});
```

## Configuration

### Parser Configuration

Control which types of functions to extract:

```typescript
interface ParserConfig {
  includePrivate?: boolean;         // Include non-exported functions (default: true)
  includeArrowFunctions?: boolean;  // Include arrow functions (default: true)
  includeClassMethods?: boolean;    // Include class methods (default: true)
  supportedExtensions?: string[];   // File extensions to support (default: ['.ts', '.tsx', '.js', '.jsx'])
}
```

### Generator Configuration

Control test generation behavior:

```typescript
interface GeneratorConfig {
  framework?: 'jest' | 'vitest' | 'mocha';  // Test framework (default: 'jest')
  includeEdgeCases?: boolean;               // Generate edge case tests (default: true)
  includeAsyncTests?: boolean;              // Generate async tests (default: true)
  testFilePattern?: string;                 // Test file suffix (default: '.test')
  useTypeScript?: boolean;                  // Generate TypeScript tests (default: true)
}
```

### Template Configuration

Customize test templates for different frameworks:

```typescript
import { JestTemplates, JestTemplateConfig } from 'assayer';

const customConfig: JestTemplateConfig = {
  importTemplate: `import { {{functionNames}} } from '{{importPath}}';`,
  describeTemplate: `describe('{{functionName}}', () => {\n{{testCases}}\n});`,
  basicTestTemplate: `  it('should {{testDescription}}', () => {\n{{arrangeSection}}\n    const result = {{callExpression}};\n{{assertSection}}\n  });`
};

const templates = new JestTemplates(customConfig);
```

## Examples

### Exporting Only Public Functions

```typescript
import { ConsolidatedParser } from 'assayer';

// Configure to behave like SimpleFunctionParser
const parser = new ConsolidatedParser({
  includePrivate: false,      // Only exported functions
  includeArrowFunctions: true,
  includeClassMethods: true
});

const functions = parser.parseFile('./src/public-api.ts');
// Only gets exported functions
```

### Extracting All Functions

```typescript
import { FunctionParser } from 'assayer';

// Default configuration includes all function types
const parser = new FunctionParser({
  includePrivate: true,       // All functions
  includeArrowFunctions: true,
  includeClassMethods: true
});

const functions = parser.parseFile('./src/internal-module.ts');
// Gets all functions, including private ones
```

### Custom Framework Support

```typescript
import { JestTemplates } from 'assayer';

// Create Vitest-compatible templates
const vitestTemplates = new JestTemplates({
  importTemplate: `import { {{functionNames}} } from '{{importPath}}';\nimport { describe, it, expect } from 'vitest';`,
  basicTestTemplate: `  it('should work correctly', () => {\n    // TODO: Implement test\n    expect({{functionNames}}[0]).toBeDefined();\n  });`
});
```

### Batch Processing

```typescript
import { createDefaultUpdateIntegration } from 'assayer';

const integration = createDefaultUpdateIntegration();

const files = [
  './src/utils.ts',
  './src/helpers.ts',
  './src/services.ts'
];

for (const file of files) {
  const result = await integration.processFile(file, {
    overwrite: true,
    createDirectories: true
  });
  console.log(`Generated: ${result.testFilePath}`);
}
```

### Validation and Compatibility

```typescript
import { createCompatibilityVerifier, ConsolidatedParser, JestTestStubGenerator } from 'assayer';

// Verify custom implementations work together
const parser = new ConsolidatedParser();
const generator = new JestTestStubGenerator();

const verifier = createCompatibilityVerifier(
  parser,
  generator,
  'ConsolidatedParser',
  'JestTestStubGenerator'
);

const report = await verifier.runAllTests();

if (report.compatible) {
  console.log('✅ Components are compatible!');
} else {
  console.log('❌ Issues found:', report.tests.filter(t => !t.passed));
}
```

## Development

### Building

```bash
npm run build        # Compile TypeScript to dist/
npm run lint         # Run ESLint checks
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Testing Standards

Assayer uses Jest with the following patterns:

- Unit tests: `*.test.ts` files colocated with source files
- Integration tests: `*.integration.test.ts` files
- Coverage requirement: 100% for core modules
- Test environment: Node.js with TypeScript support

### Code Quality

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Extended rules for TypeScript and Node.js
- **Testing**: Jest with comprehensive test coverage
- **Architecture**: Modular design with clear separation of concerns

## Testing

### Test File Patterns

```
src/
├── parser/
│   ├── consolidated-parser.ts
│   ├── consolidated-parser.test.ts
│   └── parser-integration.test.ts
├── generator/
│   ├── jest-test-stub-generator.ts
│   ├── jest-test-stub-generator.test.ts
│   └── generator-factory.test.ts
└── __tests__/
    └── end-to-end.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- consolidated-parser.test.ts

# Run tests in watch mode
npm run test:watch
```

### Test Categories

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **Compatibility Tests**: Verify parser/generator compatibility
4. **End-to-End Tests**: Full workflow validation

## Migration from Legacy Components

### From SimpleFunctionParser

```typescript
// Old way
import { SimpleFunctionParser } from './parser/simple-function-parser';
const parser = new SimpleFunctionParser();

// New way
import { FunctionParser } from 'assayer';
const parser = new FunctionParser({
  includePrivate: false  // Only exported functions
});
```

### From Adapter Pattern

```typescript
// Old way (with adapters)
import { SimpleFunctionParserAdapter } from './refactor/simple-function-parser-adapter';
import { JestGeneratorAdapter } from './refactor/jest-generator-adapter';

// New way (direct usage)
import { ConsolidatedParser, JestTestStubGenerator } from 'assayer';
const parser = new ConsolidatedParser();
const generator = new JestTestStubGenerator();
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Ensure all tests pass and linting is clean
5. Submit a pull request

### Development Workflow

```bash
# Clone and setup
git clone <repository>
cd assayer
npm install

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run test
npm run lint

# Commit and push
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

## License

[Add your license information here]