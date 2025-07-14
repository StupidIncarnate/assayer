# Testing Module

> **Note**: This documentation has been consolidated into the main [README.md](../../README.md). Please refer to the "Testing" section for comprehensive testing guidance.

The testing module provides tools for verifying compatibility between parser and generator implementations with the UpdateIntegration component.

**For complete documentation, see the main [README.md](../../README.md) file which contains:**
- Testing standards and patterns
- Running tests and coverage
- Validation framework usage
- Test categories and examples

## VerifyCompatibility

The `VerifyCompatibility` component ensures that any implementation of `Parser` and `Generator` interfaces will work correctly with UpdateIntegration.

### Features

- **Interface Compliance Validation**: Verifies that implementations correctly implement required methods
- **Integration Testing**: Tests real-world integration scenarios
- **Comprehensive Test Suite**: Runs 8 different compatibility tests
- **Detailed Reporting**: Provides markdown-formatted compatibility reports
- **Error Diagnostics**: Helps identify specific compatibility issues

### Usage

```typescript
import { createCompatibilityVerifier, FunctionParser, JestTestStubGenerator } from 'assayer';

// Create a verifier instance
const verifier = createCompatibilityVerifier(
  new FunctionParser(),
  new JestTestStubGenerator(),
  'FunctionParser',
  'JestTestStubGenerator'
);

// Run compatibility tests
const report = await verifier.runAllTests();

// Check compatibility
if (report.compatible) {
  console.log('✅ Components are compatible!');
} else {
  console.log('❌ Compatibility issues found:');
  report.tests
    .filter(t => !t.passed)
    .forEach(test => {
      console.log(`- ${test.testName}: ${test.error}`);
    });
}

// Generate detailed report
const markdown = VerifyCompatibility.generateMarkdownReport(report);
console.log(markdown);
```

### Compatibility Tests

The verifier runs the following tests:

1. **Basic Parsing**: Validates parser output structure and metadata format
2. **Basic Generation**: Validates generator output and test file path generation
3. **Process Code Integration**: Tests direct code processing functionality
4. **Process File Error Handling**: Verifies graceful error handling for missing files
5. **Hooks Support**: Tests beforeGenerate and afterGenerate hook functionality
6. **Dry Run**: Validates preview functionality without file generation
7. **Batch Processing**: Tests multiple file processing capabilities
8. **Edge Cases**: Handles empty code, invalid syntax, and edge scenarios

### Custom Implementations

To verify custom parser or generator implementations:

```typescript
class CustomParser implements Parser {
  parseFile(filePath: string): FunctionMetadata[] {
    // Custom parsing logic
  }
  
  parseCode(sourceCode: string, fileName?: string): FunctionMetadata[] {
    // Custom parsing logic
  }
}

class CustomGenerator implements Generator {
  generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
    // Custom generation logic
  }
  
  generateTestStub(func: FunctionMetadata, modulePath: string): string {
    // Custom stub generation
  }
  
  getTestFilePath(sourcePath: string): string {
    // Custom path logic
  }
}

// Verify compatibility
const verifier = createCompatibilityVerifier(
  new CustomParser(),
  new CustomGenerator(),
  'CustomParser',
  'CustomGenerator'
);

const report = await verifier.runAllTests();
```

### Integration with UpdateIntegration

Once components are verified as compatible, they can be safely used with UpdateIntegration:

```typescript
if (report.compatible) {
  const integration = new UpdateIntegration(parser, generator);
  
  // Use the integration
  const result = await integration.processFile('src/my-module.ts', {
    overwrite: true,
    createDirectories: true
  });
}
```

## Examples

See the main [README.md](../../README.md) for complete testing examples and validation patterns.

---

## ⚠️ Consolidation Notice

This documentation reflects legacy interface names and adapter patterns. The current consolidated architecture uses:

1. **Parser/Generator** instead of ISimpleParser/ISimpleGenerator
2. **FunctionParser** and **JestTestStubGenerator** as primary implementations
3. **Direct usage** without adapter wrappers
4. **Single barrel export** from 'assayer' package

### Modern Compatibility Testing

```typescript
import { 
  createCompatibilityVerifier, 
  FunctionParser, 
  JestTestStubGenerator,
  UpdateIntegration 
} from 'assayer';

// Test consolidated components
const parser = new FunctionParser();
const generator = new JestTestStubGenerator();

const verifier = createCompatibilityVerifier(
  parser,
  generator,
  'FunctionParser',
  'JestTestStubGenerator'
);

const report = await verifier.runAllTests();

if (report.compatible) {
  // Use with UpdateIntegration
  const integration = new UpdateIntegration(parser, generator);
  await integration.processFile('./src/module.ts');
}
```

For complete current testing documentation, see the main [README.md](../../README.md).