import { FunctionParser } from './function-parser';
import { ParserConfig } from '../types/parser';
import { Project, ScriptTarget, ModuleKind } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FunctionParser', () => {
  let tempDir: string;
  let project: Project;
  let parser: FunctionParser;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assayer-test-'));
    // Create a project for testing the parse method
    project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    });
    parser = new FunctionParser();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('constructor and configuration', () => {
    it('should create parser with default configuration', () => {
      const parser = new FunctionParser();
      expect(parser).toBeInstanceOf(FunctionParser);
      expect(typeof parser.parse).toBe('function');
      expect(typeof parser.createSourceFileFromPath).toBe('function');
      expect(typeof parser.createSourceFileFromCode).toBe('function');
    });

    it('should create parser with custom configuration', () => {
      const config: ParserConfig = {
        includePrivate: false,
        includeArrowFunctions: true,
        includeClassMethods: false
      };
      const parser = new FunctionParser(config);
      expect(parser).toBeInstanceOf(FunctionParser);
    });
  });

  describe('Parser interface compliance', () => {
    it('should implement Parser interface parse method', () => {
      const sourceCode = `
        function test(): void {
          console.log('test');
        }
      `;
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('test');
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('createSourceFileFromCode helper', () => {
    it('should create SourceFile from code string', () => {
      const sourceCode = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;
      
      const sourceFile = parser.createSourceFileFromCode(sourceCode, 'test.ts');
      const result = parser.parse(sourceFile);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('add');
      expect(result[0].params).toHaveLength(2);
      expect(result[0].returnType).toBe('number');
      
      parser.getProject().removeSourceFile(sourceFile);
    });
  });

  describe('createSourceFileFromPath helper', () => {
    it('should create SourceFile from file path', () => {
      const filePath = path.join(tempDir, 'test.ts');
      const sourceCode = `
        export function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;
      fs.writeFileSync(filePath, sourceCode);
      
      const sourceFile = parser.createSourceFileFromPath(filePath);
      const result = parser.parse(sourceFile);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('greet');
      expect(result[0].params).toHaveLength(1);
      expect(result[0].params[0].name).toBe('name');
      expect(result[0].params[0].type).toBe('string');
      expect(result[0].returnType).toBe('string');
      
      parser.getProject().removeSourceFile(sourceFile);
    });

    it('should throw error for non-existent file', () => {
      const invalidPath = path.join(tempDir, 'non-existent.ts');
      
      expect(() => parser.createSourceFileFromPath(invalidPath))
        .toThrow(/Failed to create SourceFile/);
    });
  });

  describe('parse - function declarations', () => {
    it('should extract regular function declarations', () => {
      const sourceCode = `
        function add(a: number, b: number): number {
          return a + b;
        }
        
        function subtract(x: number, y: number): number {
          return x - y;
        }
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('add');
      expect(result[1].name).toBe('subtract');
      
      project.removeSourceFile(sourceFile);
    });

    it('should handle exported functions when includePrivate is false', () => {
      const exportOnlyParser = new FunctionParser({ includePrivate: false });
      const sourceCode = `
        export function publicFunc(): void {}
        function privateFunc(): void {}
        export default function defaultFunc(): void {}
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = exportOnlyParser.parse(sourceFile);
      
      expect(result).toHaveLength(2);
      const functionNames = result.map(f => f.name);
      expect(functionNames).toEqual(['publicFunc', 'defaultFunc']);
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - arrow functions', () => {
    it('should extract arrow functions when configured', () => {
      const sourceCode = `
        const add = (a: number, b: number): number => a + b;
        export const multiply = (x: number, y: number) => x * y;
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result).toHaveLength(2);
      const functionNames = result.map(f => f.name);
      expect(functionNames).toEqual(['add', 'multiply']);
      
      project.removeSourceFile(sourceFile);
    });

    it('should skip arrow functions when disabled', () => {
      const noArrowParser = new FunctionParser({ includeArrowFunctions: false });
      const sourceCode = `
        function regular(): void {}
        const arrow = () => {};
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = noArrowParser.parse(sourceFile);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('regular');
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - class methods', () => {
    it('should extract class methods when configured', () => {
      const sourceCode = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
          
          subtract(x: number, y: number): number {
            return x - y;
          }
        }
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result).toHaveLength(2);
      const functionNames = result.map(f => f.name);
      expect(functionNames).toEqual(['add', 'subtract']);
      
      project.removeSourceFile(sourceFile);
    });

    it('should skip class methods when disabled', () => {
      const noMethodsParser = new FunctionParser({ includeClassMethods: false });
      const sourceCode = `
        function regular(): void {}
        class Test {
          method(): void {}
        }
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = noMethodsParser.parse(sourceFile);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('regular');
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - object methods', () => {
    it('should extract object literal methods when arrow functions are enabled', () => {
      const sourceCode = `
        const obj = {
          method1: function() { return 1; },
          method2: () => 2,
          method3() { return 3; }
        };
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result).toHaveLength(3);
      const functionNames = result.map(f => f.name);
      expect(functionNames).toEqual(['method1', 'method2', 'method3']);
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - parameter handling', () => {
    it('should correctly extract parameter types', () => {
      const sourceCode = `
        function test(
          required: string,
          optional?: number,
          defaultParam: boolean = true,
          ...rest: string[]
        ): void {}
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result[0].params).toHaveLength(4);
      expect(result[0].params[0]).toEqual({ name: 'required', type: 'string' });
      expect(result[0].params[1]).toEqual({ name: 'optional', type: 'number | undefined' });
      expect(result[0].params[2]).toEqual({ name: 'defaultParam', type: 'boolean | undefined' });
      expect(result[0].params[3]).toEqual({ name: 'rest', type: 'string[]' });
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - return type handling', () => {
    it('should correctly extract various return types', () => {
      const sourceCode = `
        function voidFunc(): void {}
        function numberFunc(): number { return 42; }
        function promiseFunc(): Promise<string> { return Promise.resolve('test'); }
        function inferredFunc() { return 'inferred'; }
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result[0].returnType).toBe('void');
      expect(result[1].returnType).toBe('number');
      expect(result[2].returnType).toBe('Promise<string>');
      expect(result[3].returnType).toBe('string'); // TypeScript infers this
      
      project.removeSourceFile(sourceFile);
    });
  });

  describe('parse - complex scenarios', () => {
    it('should handle mixed function types in a single file', () => {
      const sourceCode = `
        // Regular function
        export function regular(): void {}
        
        // Arrow function
        const arrow = () => 'arrow';
        
        // Class with methods
        class MyClass {
          method(): number { return 1; }
        }
        
        // Object with methods
        const obj = {
          objMethod: () => true
        };
        
        // Function expression
        const expr = function expression() { return false; };
      `;
      
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      const result = parser.parse(sourceFile);
      
      expect(result.length).toBeGreaterThan(4);
      const names = result.map(f => f.name);
      // Sort names for consistent comparison
      const sortedNames = names.sort();
      expect(sortedNames).toEqual(['arrow', 'expr', 'method', 'objMethod', 'regular']);
      
      project.removeSourceFile(sourceFile);
    });

    it('should work with different parser configurations', () => {
      const configs: Array<[ParserConfig, number]> = [
        [{ includePrivate: true, includeArrowFunctions: true, includeClassMethods: true }, 5],
        [{ includePrivate: false, includeArrowFunctions: true, includeClassMethods: true }, 3],
        [{ includePrivate: true, includeArrowFunctions: false, includeClassMethods: true }, 3],
        [{ includePrivate: true, includeArrowFunctions: true, includeClassMethods: false }, 4],
      ];

      const sourceCode = `
        export function exported(): void {}
        function notExported(): void {}
        export const arrow = () => {};
        const privateArrow = () => {};
        class TestClass {
          method(): void {}
        }
      `;

      configs.forEach(([config, expectedCount]) => {
        const parser = new FunctionParser(config);
        const sourceFile = project.createSourceFile('test.ts', sourceCode, { overwrite: true });
        const result = parser.parse(sourceFile);
        
        expect(result).toHaveLength(expectedCount);
        
        project.removeSourceFile(sourceFile);
      });
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', () => {
      const invalidCode = 'function { invalid syntax';
      
      const sourceFile = project.createSourceFile('invalid.ts', invalidCode);
      // The parser should still try to extract what it can
      const result = parser.parse(sourceFile);
      
      // Depending on ts-morph's error handling, it might return empty array
      // or partially parsed results
      expect(Array.isArray(result)).toBe(true);
      
      project.removeSourceFile(sourceFile);
    });

    it('should handle parseSourceCode with complex type errors', () => {
      const sourceCode = `
        function complexTypes(param: import('./some-module').ComplexType): any {
          return param;
        }
      `;
      
      const result = parser.parseSourceCode(sourceCode, 'complex.ts');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('complexTypes');
      // Complex import types are preserved as-is when they have explicit type annotations
      expect(result[0].params[0].type).toBe("import('./some-module').ComplexType");
    });

    it('should handle functions with no explicit signatures', () => {
      const sourceCode = `
        function noSignature(param) {
          return param;
        }
      `;
      
      const result = parser.parseSourceCode(sourceCode, 'no-sig.js');
      expect(result).toHaveLength(1);
      expect(result[0].returnType).toBe('any');
    });

    it('should handle getProject method', () => {
      const project = parser.getProject();
      expect(project).toBeDefined();
      expect(typeof project.createSourceFile).toBe('function');
    });
  });
});