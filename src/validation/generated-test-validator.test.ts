/**
 * GeneratedTestValidator Tests
 * 
 * Comprehensive test suite for the GeneratedTestValidator component.
 * Tests both positive and negative scenarios for test execution validation.
 */

import { GeneratedTestValidator } from './generated-test-validator';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Mock the child_process module to control test execution
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

import { spawn } from 'child_process';
const mockSpawn = jest.mocked(spawn);

describe('GeneratedTestValidator', () => {
  let validator: GeneratedTestValidator;
  let testDir: string;
  let tempTestFile: string;
  let tempSourceFile: string;

  beforeEach(() => {
    validator = new GeneratedTestValidator();
    testDir = join(__dirname, '__temp_test_files__');
    tempTestFile = join(testDir, 'temp.test.ts');
    tempSourceFile = join(testDir, 'temp.ts');
    
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    
    // Reset mocks
    mockSpawn.mockClear();
  });

  afterEach(() => {
    // Clean up temporary files
    try {
      if (existsSync(tempTestFile)) {
        unlinkSync(tempTestFile);
      }
      if (existsSync(tempSourceFile)) {
        unlinkSync(tempSourceFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateGeneratedTest', () => {
    it('should validate a well-formed test file successfully', async () => {
      // Arrange
      const validTestContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should execute successfully with valid inputs', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = testFunction(input);
            
            // Assert
            expect(result).toBeDefined();
          });
        });
      `;
      
      writeFileSync(tempTestFile, validTestContent);
      
      // Mock successful Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Test Suites: 1 passed, 1 total\nTests: 1 passed, 1 total\nTime: 1.234s\n');
              }
            }),
          },
          stderr: {
            on: jest.fn(),
          },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(0); // Success exit code
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.fileExists).toBe(true);
      expect(result.syntaxValid).toBe(true);
      expect(result.passingTests).toBe(1);
      expect(result.failingTests).toBe(0);
      expect(result.testSuites).toBe(1);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle non-existent test files', async () => {
      // Arrange
      const nonExistentPath = join(testDir, 'nonexistent.test.ts');

      // Act
      const result = await validator.validateGeneratedTest(nonExistentPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fileExists).toBe(false);
      expect(result.error).toContain('Test file does not exist');
    });

    it('should detect syntax errors in test files', async () => {
      // Arrange
      const invalidTestContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should have syntax error', () => {
            // Missing closing brace
            expect(result).toBeDefined();
          });
        // Missing closing brace for describe
      `;
      
      writeFileSync(tempTestFile, invalidTestContent);

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fileExists).toBe(true);
      expect(result.syntaxValid).toBe(false);
      expect(result.error).toContain('Unbalanced parentheses');
    });

    it('should handle Jest execution failures', async () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should fail', () => {
            expect(true).toBe(false);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock failed Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Test Suites: 1 failed, 1 total\nTests: 1 failed, 1 total\nTime: 0.5s\n');
              }
            }),
          },
          stderr: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Test failed');
              }
            }),
          },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(1); // Failure exit code
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fileExists).toBe(true);
      expect(result.syntaxValid).toBe(true);
      expect(result.failingTests).toBe(1);
      expect(result.error).toContain('Test execution failed');
    });

    it('should handle test execution timeout', async () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should timeout', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock hanging Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn(),
          },
          on: jest.fn(), // Never calls close
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile, { timeout: 100 });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Test execution timed out');
    });

    it('should collect coverage information when requested', async () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should collect coverage', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock Jest execution with coverage
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback(`
                  Test Suites: 1 passed, 1 total
                  Tests: 1 passed, 1 total
                  Time: 1.5s
                  
                  ----------|---------|----------|---------|---------|-------------------
                  File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
                  ----------|---------|----------|---------|---------|-------------------
                  All files |   85.71 |     75.0 |   90.0  |   88.89 |
                  ----------|---------|----------|---------|---------|-------------------
                `);
              }
            }),
          },
          stderr: {
            on: jest.fn(),
          },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(0);
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile, { collectCoverage: true });

      // Assert
      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
      expect(result.coverage?.statements).toBe(85.71);
      expect(result.coverage?.branches).toBe(75.0);
      expect(result.coverage?.functions).toBe(90.0);
      expect(result.coverage?.lines).toBe(88.89);
    });
  });

  describe('validateMultipleTests', () => {
    it('should validate multiple test files', async () => {
      // Arrange
      const testFile1 = join(testDir, 'test1.test.ts');
      const testFile2 = join(testDir, 'test2.test.ts');
      
      const validTestContent = `
        describe('test', () => {
          it('should pass', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(testFile1, validTestContent);
      writeFileSync(testFile2, validTestContent);
      
      // Mock successful Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn((event, callback) => {
            if (event === 'data') callback('Test Suites: 1 passed, 1 total\nTests: 1 passed, 1 total\n');
          })},
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') callback(0);
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const results = await validator.validateMultipleTests([testFile1, testFile2]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      
      // Clean up
      unlinkSync(testFile1);
      unlinkSync(testFile2);
    });
  });

  describe('validateEndToEnd', () => {
    it('should perform end-to-end validation successfully', async () => {
      // Arrange
      const sourceContent = `
        export function testFunction(input: string): string {
          return 'Hello, ' + input;
        }
      `;
      
      writeFileSync(tempSourceFile, sourceContent);
      
      // Mock successful Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Test Suites: 1 passed, 1 total\nTests: 3 passed, 3 total\nTime: 2.1s\n');
              }
            }),
          },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(0);
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateEndToEnd(tempSourceFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sourcePath).toBe(tempSourceFile);
      expect(result.integrationResult.success).toBe(true);
      expect(result.validationResult.success).toBe(true);
      expect(result.summary).toContain('End-to-end validation successful');
      expect(result.totalTime).toBeGreaterThan(0);
    });

    it('should handle end-to-end validation when test generation fails', async () => {
      // Arrange
      const nonExistentSource = join(testDir, 'nonexistent.ts');

      // Act
      const result = await validator.validateEndToEnd(nonExistentSource);

      // Assert
      expect(result.success).toBe(false);
      expect(result.integrationResult.success).toBe(false);
      expect(result.validationResult.success).toBe(false);
      expect(result.summary).toContain('Test generation failed');
    });
  });

  describe('validateTestFileStructure', () => {
    it('should validate test file structure without execution', () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should execute successfully', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = testFunction(input);
            
            // Assert
            expect(result).toBeDefined();
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);

      // Act
      const result = validator.validateTestFileStructure(tempTestFile);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should identify structural issues in test files', () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        describe('testFunction', () => {
          it('should have no assertions', () => {
            const result = testFunction('test');
            // TODO: Add proper assertions
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);

      // Act
      const result = validator.validateTestFileStructure(tempTestFile);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('No assertions found - tests may not be verifying behavior');
      expect(result.warnings).toContain('TODO comments found - tests may need completion');
    });

    it('should detect missing test structure', () => {
      // Arrange
      const testContent = `
        import { testFunction } from './temp';
        
        console.log('Not a test file');
      `;
      
      writeFileSync(tempTestFile, testContent);

      // Act
      const result = validator.validateTestFileStructure(tempTestFile);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No test suites found');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle spawn errors gracefully', async () => {
      // Arrange
      const testContent = `
        describe('test', () => {
          it('should pass', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock spawn error
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'error') {
              callback(new Error('Spawn failed'));
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute test');
    });

    it('should handle invalid JSON in Jest output', async () => {
      // Arrange
      const testContent = `
        describe('test', () => {
          it('should handle malformed output', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock Jest with malformed output
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Invalid Jest output format');
              }
            }),
          },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(0);
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.passingTests).toBe(0); // Should default to 0 when parsing fails
      expect(result.failingTests).toBe(0);
    });

    it('should handle custom Jest configuration', async () => {
      // Arrange
      const testContent = `
        describe('test', () => {
          it('should use custom config', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      writeFileSync(tempTestFile, testContent);
      
      // Mock successful Jest execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback('Test Suites: 1 passed, 1 total\nTests: 1 passed, 1 total\n');
              }
            }),
          },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              callback(0);
            }
          }),
          kill: jest.fn(),
        };
        return mockProcess as any;
      });

      // Act
      const result = await validator.validateGeneratedTest(tempTestFile, {
        jestConfig: 'custom.config.js',
        silent: true,
        bail: true,
        maxWorkers: 2,
        env: { NODE_ENV: 'test' },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('npx', 
        expect.arrayContaining([
          'jest',
          tempTestFile,
          '--no-cache',
          '--verbose',
          '--silent',
          '--bail',
          '--maxWorkers=2',
          '--config=custom.config.js',
        ]),
        expect.objectContaining({
          env: expect.objectContaining({ NODE_ENV: 'test' }),
        })
      );
    });
  });
});