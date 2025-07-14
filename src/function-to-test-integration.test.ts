import { FunctionToTestIntegration, generateTestsForFile, generateTestsFromCode } from './function-to-test-integration';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';

describe('FunctionToTestIntegration', () => {
  let integration: FunctionToTestIntegration;
  let tempDir: string;

  beforeEach(() => {
    integration = new FunctionToTestIntegration();
    tempDir = join(__dirname, 'temp-test-files');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generateTests', () => {
    it('should generate tests for a simple function', async () => {
      // Arrange
      const sourceCode = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const sourcePath = join(tempDir, 'math.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await integration.generateTests(sourcePath, { verbose: false });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcePath).toBe(sourcePath);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('add');
      expect(result.functions[0].params).toEqual([
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' }
      ]);
      expect(result.functions[0].returnType).toBe('number');
      // Just verify the key parts are present since the generator now creates comprehensive tests
      expect(result.testContent).toMatch(/import { add } from '\.\/math';/);
      expect(result.testContent).toMatch(/describe\('add', \(\) => {/);
      expect(result.testContent).toMatch(/it\('should execute successfully with valid inputs'/);
      expect(result.testContent).toMatch(/const result = add\(a, b\);/);
      expect(result.testContent).toMatch(/expect\(typeof result\)\.toBe\('number'\);/);
      expect(existsSync(result.testPath)).toBe(true);
    });

    it('should generate tests for multiple functions', async () => {
      // Arrange
      const sourceCode = `
        export function add(a: number, b: number): number {
          return a + b;
        }
        
        export function multiply(x: number, y: number): number {
          return x * y;
        }
      `;
      const sourcePath = join(tempDir, 'math.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await integration.generateTests(sourcePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(2);
      expect(result.functions.map(f => f.name)).toEqual(['add', 'multiply']);
      // Verify key parts are present
      expect(result.testContent).toMatch(/import { add, multiply } from '\.\/math';/);
      expect(result.testContent).toMatch(/describe\('add', \(\) => {/);
      expect(result.testContent).toMatch(/describe\('multiply', \(\) => {/);
      expect(result.testContent).toMatch(/const result = add\(a, b\);/);
      expect(result.testContent).toMatch(/const result = multiply\(x, y\);/);
    });

    it('should handle file with no exported functions', async () => {
      // Arrange
      const sourceCode = `
        function privateFunction() {
          return 'private';
        }
      `;
      const sourcePath = join(tempDir, 'private.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await integration.generateTests(sourcePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(0);
      expect(result.testContent).toMatch(/No functions found in.*private\.ts/);
      expect(result.testContent).toMatch(/describe\('private', \(\) => {/);
      expect(result.testContent).toMatch(/TODO: Add functions to the module and regenerate tests/);
    });

    it('should handle custom output path', async () => {
      // Arrange
      const sourceCode = `
        export function test() {
          return 'test';
        }
      `;
      const sourcePath = join(tempDir, 'source.ts');
      const customOutputPath = join(tempDir, 'custom.test.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await integration.generateTests(sourcePath, { outputPath: customOutputPath });

      // Assert
      expect(result.success).toBe(true);
      expect(result.testPath).toBe(customOutputPath);
      expect(existsSync(customOutputPath)).toBe(true);
    });

    it('should handle overwrite option', async () => {
      // Arrange
      const sourceCode = `
        export function test() {
          return 'test';
        }
      `;
      const sourcePath = join(tempDir, 'source.ts');
      const testPath = join(tempDir, 'source.test.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');
      writeFileSync(testPath, 'existing content', 'utf-8');

      // Act - first without overwrite (should fail)
      const result1 = await integration.generateTests(sourcePath, { overwrite: false });
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Test file already exists: ' + testPath + '. Use overwrite option to replace.');

      // Act - then with overwrite (should succeed)
      const result2 = await integration.generateTests(sourcePath, { overwrite: true });

      // Assert
      expect(result2.success).toBe(true);
      expect(existsSync(testPath)).toBe(true);
    });

    it('should handle non-existent source file', async () => {
      // Arrange
      const nonExistentPath = join(tempDir, 'nonexistent.ts');

      // Act
      const result = await integration.generateTests(nonExistentPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Source file not found: ' + nonExistentPath);
    });

    it('should handle syntax errors in source file', async () => {
      // Arrange
      const sourceCode = `
        export function broken(: number {
          return 'broken';
        }
      `;
      const sourcePath = join(tempDir, 'broken.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await integration.generateTests(sourcePath);

      // Assert - The parser is forgiving and returns empty functions for syntax errors
      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(0);
    });
  });

  describe('generateTestsFromCode', () => {
    it('should generate tests from source code string', () => {
      // Arrange
      const sourceCode = `
        export function divide(a: number, b: number): number {
          if (b === 0) throw new Error('Division by zero');
          return a / b;
        }
      `;

      // Act
      const testContent = integration.generateTestsFromCode(sourceCode, 'divide.ts');

      // Assert
      // Verify key parts are present
      expect(testContent).toMatch(/import { divide } from '\.\/divide';/);
      expect(testContent).toMatch(/describe\('divide', \(\) => {/);
      expect(testContent).toMatch(/const result = divide\(a, b\);/);
      expect(testContent).toMatch(/expect\(typeof result\)\.toBe\('number'\);/);
    });

    it('should handle empty source code', () => {
      // Arrange
      const sourceCode = '';

      // Act
      const testContent = integration.generateTestsFromCode(sourceCode);

      // Assert
      expect(testContent).toBe(`// No functions found in temp.ts
// Add functions to generate test stubs

describe('temp', () => {
  it('should have testable functions', () => {
    // TODO: Add functions to the module and regenerate tests
    expect(true).toBe(true);
  });
});`);
    });
  });

  describe('validateGeneratedTest', () => {
    it('should validate correct test file', () => {
      // Arrange
      const testContent = `
        import { add } from './math';
        
        describe('add', () => {
          it('should execute successfully', () => {
            const result = add(1, 2);
            expect(result).toBe(3);
          });
        });
      `;
      const testPath = join(tempDir, 'valid.test.ts');
      writeFileSync(testPath, testContent, 'utf-8');

      // Act
      const validation = integration.validateGeneratedTest(testPath);

      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should detect missing describe blocks', () => {
      // Arrange
      const testContent = `
        import { add } from './math';
        
        it('should execute successfully', () => {
          expect(true).toBe(true);
        });
      `;
      const testPath = join(tempDir, 'no-describe.test.ts');
      writeFileSync(testPath, testContent, 'utf-8');

      // Act
      const validation = integration.validateGeneratedTest(testPath);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('No test suites found (missing describe blocks)');
    });

    it('should detect missing it blocks', () => {
      // Arrange
      const testContent = `
        import { add } from './math';
        
        describe('add', () => {
          // No it blocks
        });
      `;
      const testPath = join(tempDir, 'no-it.test.ts');
      writeFileSync(testPath, testContent, 'utf-8');

      // Act
      const validation = integration.validateGeneratedTest(testPath);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('No test cases found (missing it blocks)');
    });

    it('should detect missing expect statements', () => {
      // Arrange
      const testContent = `
        import { add } from './math';
        
        describe('add', () => {
          it('should execute successfully', () => {
            const result = add(1, 2);
            // No expect statement
          });
        });
      `;
      const testPath = join(tempDir, 'no-expect.test.ts');
      writeFileSync(testPath, testContent, 'utf-8');

      // Act
      const validation = integration.validateGeneratedTest(testPath);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('No assertions found (missing expect statements)');
    });

    it('should detect unbalanced parentheses', () => {
      // Arrange
      const testContent = `
        import { add } from './math';
        
        describe('add', () => {
          it('should execute successfully', () => {
            const result = add(1, 2;
            expect(result).toBe(3);
          });
        });
      `;
      const testPath = join(tempDir, 'unbalanced.test.ts');
      writeFileSync(testPath, testContent, 'utf-8');

      // Act
      const validation = integration.validateGeneratedTest(testPath);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Unbalanced parentheses in generated test');
    });

    it('should handle non-existent test file', () => {
      // Arrange
      const nonExistentPath = join(tempDir, 'nonexistent.test.ts');

      // Act
      const validation = integration.validateGeneratedTest(nonExistentPath);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Test file does not exist');
    });
  });

  describe('generateTestsForDirectory', () => {
    it('should process multiple TypeScript files in directory', async () => {
      // Arrange
      const sourceCode1 = `export function func1() { return 1; }`;
      const sourceCode2 = `export function func2() { return 2; }`;
      
      writeFileSync(join(tempDir, 'file1.ts'), sourceCode1, 'utf-8');
      writeFileSync(join(tempDir, 'file2.ts'), sourceCode2, 'utf-8');
      writeFileSync(join(tempDir, 'existing.test.ts'), 'existing test', 'utf-8');
      writeFileSync(join(tempDir, 'readme.md'), 'readme', 'utf-8');

      // Act
      const results = await integration.generateTestsForDirectory(tempDir);

      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.functions[0].name)).toEqual(['func1', 'func2']);
    });

    it('should handle directory processing errors', async () => {
      // Arrange
      const nonExistentDir = join(tempDir, 'nonexistent');

      // Act
      const results = await integration.generateTestsForDirectory(nonExistentDir);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('extractFunctionMetadata', () => {
    it('should extract function metadata without generating tests', () => {
      // Arrange
      const sourceCode = `
        export function calculate(input: string): number {
          return parseInt(input);
        }
      `;
      const sourcePath = join(tempDir, 'calc.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const metadata = integration.extractFunctionMetadata(sourcePath);

      // Assert
      expect(metadata).toHaveLength(1);
      expect(metadata[0].name).toBe('calculate');
      expect(metadata[0].params).toEqual([{ name: 'input', type: 'string' }]);
      expect(metadata[0].returnType).toBe('number');
    });
  });

  describe('extractFunctionMetadataFromCode', () => {
    it('should extract function metadata from source code string', () => {
      // Arrange
      const sourceCode = `
        export function process(data: any[]): void {
          console.log(data);
        }
      `;

      // Act
      const metadata = integration.extractFunctionMetadataFromCode(sourceCode, 'process.ts');

      // Assert
      expect(metadata).toHaveLength(1);
      expect(metadata[0].name).toBe('process');
      expect(metadata[0].params).toEqual([{ name: 'data', type: 'any[]' }]);
      expect(metadata[0].returnType).toBe('void');
    });
  });
});

describe('convenience functions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(__dirname, 'temp-convenience-test');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generateTestsForFile', () => {
    it('should generate tests for a file with verbose output', async () => {
      // Arrange
      const sourceCode = `
        export function helper(value: boolean): string {
          return value ? 'yes' : 'no';
        }
      `;
      const sourcePath = join(tempDir, 'helper.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await generateTestsForFile(sourcePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('helper');
      expect(existsSync(result.testPath)).toBe(true);
    });

    it('should generate tests with custom output path', async () => {
      // Arrange
      const sourceCode = `export function test() { return 'test'; }`;
      const sourcePath = join(tempDir, 'source.ts');
      const customPath = join(tempDir, 'custom.test.ts');
      writeFileSync(sourcePath, sourceCode, 'utf-8');

      // Act
      const result = await generateTestsForFile(sourcePath, customPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testPath).toBe(customPath);
      expect(existsSync(customPath)).toBe(true);
    });
  });

  describe('generateTestsFromCode', () => {
    it('should generate tests from source code string', () => {
      // Arrange
      const sourceCode = `
        export function format(text: string, uppercase: boolean = false): string {
          return uppercase ? text.toUpperCase() : text.toLowerCase();
        }
      `;

      // Act
      const testContent = generateTestsFromCode(sourceCode, 'format.ts');

      // Assert
      // Verify key parts are present
      expect(testContent).toMatch(/import { format } from '\.\/format';/);
      expect(testContent).toMatch(/describe\('format', \(\) => {/);
      expect(testContent).toMatch(/const result = format\(text, uppercase\);/);
      expect(testContent).toMatch(/expect\(typeof result\)\.toBe\('string'\);/);
    });

    it('should generate tests with default filename', () => {
      // Arrange
      const sourceCode = `export function defaultTest() { return 'default'; }`;

      // Act
      const testContent = generateTestsFromCode(sourceCode);

      // Assert
      // Verify key parts are present
      expect(testContent).toMatch(/import { defaultTest } from '\.\/temp';/);
      expect(testContent).toMatch(/describe\('defaultTest', \(\) => {/);
      expect(testContent).toMatch(/const result = defaultTest\(\);/);
      expect(testContent).toMatch(/expect\(typeof result\)\.toBe\('string'\);/);
    });
  });
});