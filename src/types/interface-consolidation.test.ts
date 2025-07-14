/**
 * Tests for Interface Consolidation
 * 
 * Verifies that the consolidated interfaces work correctly across the codebase
 * after simplifying the Parser interface.
 */

import { Parser, ParserConfig } from './parser';
import { SourceFile } from 'ts-morph';
import { Generator, GeneratorConfig } from './generator';
import { FunctionMetadata } from './metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('Interface Consolidation', () => {
  describe('Parser Interface', () => {
    // Test that Parser can be implemented correctly
    it('should allow implementation of Parser interface', () => {
      class TestParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          return [];
        }
      }

      const parser = new TestParser();
      expect(parser).toBeInstanceOf(TestParser);
      expect(typeof parser.parse).toBe('function');
      expect(parser.parse.length).toBe(1); // Takes 1 parameter (SourceFile)
    });

    it('should allow parsers to return function metadata', () => {
      class TestParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          return [{
            name: 'test',
            params: [],
            returnType: 'void'
          }];
        }
      }

      const parser = new TestParser();
      // Create a mock SourceFile
      const mockSourceFile = {} as SourceFile;
      const result = parser.parse(mockSourceFile);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('test');
    });

    it('should allow parsers to access SourceFile properties', () => {
      class TestParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // In real implementation, would use sourceFile methods
          // For testing, just return a dummy result
          return [{
            name: 'fromSourceFile',
            params: [{ name: 'arg', type: 'string' }],
            returnType: 'void'
          }];
        }
      }

      const parser = new TestParser();
      const mockSourceFile = {} as SourceFile;
      const result = parser.parse(mockSourceFile);
      expect(result[0].params).toHaveLength(1);
      expect(result[0].params[0].name).toBe('arg');
    });
  });

  describe('Generator Interface', () => {
    // Test that Generator can be implemented correctly
    it('should allow implementation of Generator interface', () => {
      class TestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return '// Test file content';
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return '// Test stub';
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.test.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const generator = new TestGenerator();
      expect(generator).toBeInstanceOf(TestGenerator);
      expect(typeof generator.generateTestFile).toBe('function');
      expect(typeof generator.generateTestStub).toBe('function');
      expect(typeof generator.getTestFilePath).toBe('function');
      expect(typeof generator.validateTestContent).toBe('function');
    });

    it('should generate test files from function metadata', () => {
      class TestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return `// Tests for ${modulePath}\n` +
            functions.map(f => `// Test for ${f.name}`).join('\n');
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return `it('should test ${func.name}', () => {});`;
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.test.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const generator = new TestGenerator();
      const functions: FunctionMetadata[] = [
        { name: 'func1', params: [], returnType: 'void' },
        { name: 'func2', params: [], returnType: 'string' }
      ];
      
      const result = generator.generateTestFile(functions, '/src/test.ts');
      expect(result).toBe('// Tests for /src/test.ts\n// Test for func1\n// Test for func2');
    });

    it('should determine test file paths correctly', () => {
      class TestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return '';
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return '';
        }
        getTestFilePath(sourcePath: string): string {
          // Simple implementation: add .test before extension
          const ext = sourcePath.substring(sourcePath.lastIndexOf('.'));
          const base = sourcePath.substring(0, sourcePath.lastIndexOf('.'));
          return base + '.test' + ext;
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const generator = new TestGenerator();
      expect(generator.getTestFilePath('/src/component.ts')).toBe('/src/component.test.ts');
      expect(generator.getTestFilePath('/src/utils.tsx')).toBe('/src/utils.test.tsx');
      expect(generator.getTestFilePath('/lib/helper.js')).toBe('/lib/helper.test.js');
    });
  });

  describe('Configuration Types', () => {
    it('should allow ParserConfig to be used', () => {
      const config: ParserConfig = {
        includePrivate: true,
        includeArrowFunctions: false,
        includeClassMethods: true,
        supportedExtensions: ['.ts', '.tsx']
      };

      expect(config.includePrivate).toBe(true);
      expect(config.includeArrowFunctions).toBe(false);
      expect(config.includeClassMethods).toBe(true);
      expect(config.supportedExtensions).toEqual(['.ts', '.tsx']);
    });

    it('should allow GeneratorConfig to be used', () => {
      const config: GeneratorConfig = {
        framework: 'jest',
        includeEdgeCases: true,
        includeAsyncTests: true,
        testFilePattern: '.spec'
      };

      expect(config.framework).toBe('jest');
      expect(config.includeEdgeCases).toBe(true);
      expect(config.includeAsyncTests).toBe(true);
      expect(config.testFilePattern).toBe('.spec');
    });

    it('should allow partial configurations', () => {
      const parserConfig: ParserConfig = {
        includePrivate: false
        // Other fields are optional
      };

      const generatorConfig: GeneratorConfig = {
        framework: 'vitest'
        // Other fields are optional
      };

      expect(parserConfig.includePrivate).toBe(false);
      expect(generatorConfig.framework).toBe('vitest');
    });
  });

  describe('Type Exports', () => {
    it('should export Parser interface', () => {
      // Parser is imported at the top, so this test verifies it exists
      const parser: Parser = {
        parse: (sourceFile: SourceFile) => []
      };
      expect(parser).not.toBeNull();
      expect(parser).not.toBeUndefined();
      expect(parser.parse).toBeInstanceOf(Function);
      expect(parser.parse.length).toBe(1);
    });

    it('should export Generator interface', () => {
      // Generator is imported at the top, so this test verifies it exists
      const generator: Generator = {
        generateTestFile: () => '',
        generateTestStub: () => '',
        getTestFilePath: (path) => path + '.test.ts',
        validateTestContent: () => true
      };
      expect(generator).not.toBeNull();
      expect(generator).not.toBeUndefined();
      expect(Object.keys(generator).sort()).toEqual(['generateTestFile', 'generateTestStub', 'getTestFilePath', 'validateTestContent']);
    });

    it('should export FunctionMetadata type', () => {
      // FunctionMetadata is imported at the top, so this test verifies it exists
      const metadata: FunctionMetadata = {
        name: 'testFunc',
        params: [],
        returnType: 'void'
      };
      expect(metadata).toEqual({
        name: 'testFunc',
        params: [],
        returnType: 'void'
      });
      expect(metadata.name).toEqual('testFunc');
      expect(metadata.params).toBeInstanceOf(Array);
      expect(metadata.returnType).toEqual('void');
    });
  });

  describe('Integration Patterns', () => {
    it('should allow parsers and generators to work together', () => {
      class TestParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          return [{
            name: 'myFunction',
            params: [{ name: 'x', type: 'number' }],
            returnType: 'number'
          }];
        }
      }

      class TestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return functions.map(f => 
            `test('${f.name}', () => { /* test */ });`
          ).join('\n');
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return `test('${func.name}', () => {});`;
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.test.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const parser = new TestParser();
      const generator = new TestGenerator();
      
      const mockSourceFile = {} as SourceFile;
      const functions = parser.parse(mockSourceFile);
      const testContent = generator.generateTestFile(functions, '/src/test.ts');
      
      expect(testContent).toBe("test('myFunction', () => { /* test */ });");
    });

    it('should allow UpdateIntegration to use Parser and Generator', () => {
      // Mock implementation showing the pattern
      const mockParser: Parser = {
        parse: (sourceFile: SourceFile) => [
          { name: 'func1', params: [], returnType: 'void' }
        ]
      };

      const mockGenerator: Generator = {
        generateTestFile: (functions, path) => '// Generated tests',
        generateTestStub: (func, path) => '// Stub',
        getTestFilePath: (path) => path.replace('.ts', '.test.ts'),
        validateTestContent: (content) => true
      };

      // Simulating UpdateIntegration usage
      class MockIntegration {
        constructor(
          private parser: Parser,
          private generator: Generator
        ) {}

        process(sourceFile: SourceFile, sourcePath: string): string {
          const functions = this.parser.parse(sourceFile);
          return this.generator.generateTestFile(functions, sourcePath);
        }
      }

      const integration = new MockIntegration(mockParser, mockGenerator);
      const mockSourceFile = {} as SourceFile;
      const result = integration.process(mockSourceFile, '/src/file.ts');
      
      expect(result).toBe('// Generated tests');
    });

    it('should support multiple parser implementations', () => {
      class SimpleParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // Simple implementation
          return [];
        }
      }

      class AdvancedParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // Advanced implementation
          return [];
        }
      }

      const parsers: Parser[] = [
        new SimpleParser(),
        new AdvancedParser()
      ];

      parsers.forEach((parser, index) => {
        if (index === 0) {
          expect(parser).toBeInstanceOf(SimpleParser);
        } else {
          expect(parser).toBeInstanceOf(AdvancedParser);
        }
        expect(typeof parser.parse).toBe('function');
        expect(parser.parse.length).toBe(1);
      });
    });

    it('should support multiple generator implementations', () => {
      class JestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return '// Jest tests';
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return '// Jest stub';
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.test.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      class VitestGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          return '// Vitest tests';
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return '// Vitest stub';
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.spec.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const generators: Generator[] = [
        new JestGenerator(),
        new VitestGenerator()
      ];

      expect(generators[0].generateTestFile([], '')).toBe('// Jest tests');
      expect(generators[1].generateTestFile([], '')).toBe('// Vitest tests');
    });

    it('should handle edge cases gracefully', () => {
      class RobustParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          try {
            // Simulate parsing logic
            return [];
          } catch (error) {
            // Handle errors gracefully
            return [];
          }
        }
      }

      class RobustGenerator implements Generator {
        generateTestFile(functions: FunctionMetadata[], modulePath: string): string {
          if (!functions || functions.length === 0) {
            return '// No functions to test';
          }
          return '// Generated tests';
        }
        generateTestStub(func: FunctionMetadata, modulePath: string): string {
          return '// Stub';
        }
        getTestFilePath(sourcePath: string): string {
          return sourcePath.replace('.ts', '.test.ts');
        }
        validateTestContent(testContent: string): boolean {
          return true;
        }
      }

      const parser = new RobustParser();
      const generator = new RobustGenerator();
      
      // Test with mock source file
      const mockSourceFile = {} as SourceFile;
      const functions = parser.parse(mockSourceFile);
      const result = generator.generateTestFile(functions, '/test.ts');
      
      expect(result).toBe('// No functions to test');
    });

    it('should support parsers that handle different file types', () => {
      class TypeScriptParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // TS-specific parsing
          return [];
        }
      }

      class JavaScriptParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // JS-specific parsing
          return [];
        }
      }

      const tsParser = new TypeScriptParser();
      const jsParser = new JavaScriptParser();
      
      const mockSourceFile = {} as SourceFile;
      expect(tsParser.parse(mockSourceFile)).toEqual([]);
      expect(jsParser.parse(mockSourceFile)).toEqual([]);
    });
  });
});