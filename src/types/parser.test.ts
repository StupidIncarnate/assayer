/**
 * Tests for the Parser interface.
 * These tests verify that classes implementing Parser conform to the expected contract.
 */

import { Parser } from './parser';
import { FunctionMetadata } from './metadata';
import { SourceFile, Project } from 'ts-morph';

describe('Parser Interface', () => {
  let project: Project;
  let sourceFile: SourceFile;

  beforeEach(() => {
    project = new Project();
    sourceFile = project.createSourceFile('test.ts', 'function test() { return 42; }');
  });

  afterEach(() => {
    project.removeSourceFile(sourceFile);
  });

  // Mock implementation for testing
  class MockParser implements Parser {
    parse(_sourceFile: SourceFile): FunctionMetadata[] {
      return [{
        name: 'testFunction',
        params: [],
        returnType: 'void'
      }];
    }
  }

  describe('Interface Contract', () => {
    it('should require parse method', () => {
      const parser = new MockParser();
      expect(typeof parser.parse).toBe('function');
      expect(parser.parse.length).toBe(1); // Takes 1 parameter (SourceFile)
      
      // Verify method name
      expect(parser.parse.name).toBe('parse');
    });

    it('should have parse method that accepts a SourceFile and returns FunctionMetadata[]', () => {
      const parser = new MockParser();
      const result = parser.parse(sourceFile);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('params');
      expect(result[0]).toHaveProperty('returnType');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct return type for parse method', () => {
      // This is a compile-time test - if it compiles, the types are correct
      const parser: Parser = new MockParser();
      const result: FunctionMetadata[] = parser.parse(sourceFile);
      
      // Verify it returns an array
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      
      // Verify the structure matches FunctionMetadata type
      expect(result[0]).toEqual({
        name: 'testFunction',
        params: [],
        returnType: 'void'
      });
    });
  });

  describe('Implementation Examples', () => {
    it('should be implementable by classes', () => {
      class TestParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          // Simplified implementation for testing
          const functions = sourceFile.getFunctions();
          return functions.map(func => ({
            name: func.getName() || 'anonymous',
            params: [],
            returnType: 'any'
          }));
        }
      }

      const parser = new TestParser();
      expect(parser).toBeInstanceOf(TestParser);
      expect(typeof parser.parse).toBe('function');
      
      const result = parser.parse(sourceFile);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'test',
        params: [],
        returnType: 'any'
      });
    });

    it('should allow implementations to throw errors', () => {
      class ErrorParser implements Parser {
        parse(_sourceFile: SourceFile): FunctionMetadata[] {
          throw new Error('Parsing error');
        }
      }

      const parser = new ErrorParser();
      expect(() => parser.parse(sourceFile)).toThrow('Parsing error');
    });

    it('should allow implementations to return empty arrays', () => {
      class EmptyParser implements Parser {
        parse(_sourceFile: SourceFile): FunctionMetadata[] {
          return [];
        }
      }

      const parser = new EmptyParser();
      const result = parser.parse(sourceFile);
      expect(result).toEqual([]);
    });
  });

  describe('Real-world Usage', () => {
    it('should work with actual ts-morph SourceFile operations', () => {
      class RealParser implements Parser {
        parse(sourceFile: SourceFile): FunctionMetadata[] {
          const functions = sourceFile.getFunctions();
          return functions.map(func => ({
            name: func.getName() || 'anonymous',
            params: func.getParameters().map(param => ({
              name: param.getName(),
              type: param.getType().getText()
            })),
            returnType: func.getReturnType().getText()
          }));
        }
      }

      const complexSource = project.createSourceFile('complex.ts', `
        function add(a: number, b: number): number {
          return a + b;
        }
        
        function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `);

      const parser = new RealParser();
      const result = parser.parse(complexSource);

      expect(result).toHaveLength(2);
      
      // Verify exact structure of parsed functions
      expect(result[0]).toEqual({
        name: 'add',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' }
        ],
        returnType: 'number'
      });
      
      expect(result[1]).toEqual({
        name: 'greet',
        params: [
          { name: 'name', type: 'string' }
        ],
        returnType: 'string'
      });
      
      // Verify parameter order is preserved
      expect(result[0].params[0].name).toBe('a');
      expect(result[0].params[1].name).toBe('b');

      project.removeSourceFile(complexSource);
    });
  });
});