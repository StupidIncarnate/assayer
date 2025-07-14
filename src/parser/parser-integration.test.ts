import { Parser } from '../types/parser';
import { FunctionMetadata } from '../types/metadata';
import { FunctionParser } from './function-parser';
import { Project, ScriptTarget, ModuleKind } from 'ts-morph';

/**
 * Integration tests to verify that parsers correctly implement the Parser interface
 * and can be used interchangeably.
 */
describe('Parser Integration Tests', () => {
  describe('Parser Interface Implementation', () => {
    let parsers: Parser[];
    let project: Project;

    beforeEach(() => {
      parsers = [
        new FunctionParser(),
        new FunctionParser({ includePrivate: false }) // Replaces SimpleFunctionParser
      ];
      project = new Project({
        compilerOptions: {
          target: ScriptTarget.ES2020,
          module: ModuleKind.CommonJS,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      });
    });

    it('should have all parsers implement Parser interface', () => {
      parsers.forEach(parser => {
        expect(parser).toBeDefined();
        expect(typeof parser.parse).toBe('function');
      });
    });

    it('should parse the same source code consistently', () => {
      const sourceCode = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;

      parsers.forEach(parser => {
        const sourceFile = project.createSourceFile('test.ts', sourceCode, { overwrite: true });
        const results = parser.parse(sourceFile);
        project.removeSourceFile(sourceFile);
        
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
          name: 'add',
          params: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' }
          ],
          returnType: 'number'
        });
      });
    });

    it('should handle invalid source code gracefully', () => {
      const invalidCode = 'function { invalid syntax';

      parsers.forEach(parser => {
        const sourceFile = project.createSourceFile('invalid.ts', invalidCode, { overwrite: true });
        // Parsers may either return empty array or throw - both are acceptable
        try {
          const results = parser.parse(sourceFile);
          expect(Array.isArray(results)).toBe(true);
        } catch (error) {
          // Error is acceptable for invalid syntax
          expect(error).toBeDefined();
        }
        project.removeSourceFile(sourceFile);
      });
    });
  });

  describe('FunctionParser Advanced Features', () => {
    let functionParser: FunctionParser;
    let exportOnlyParser: FunctionParser;
    let project: Project;

    beforeEach(() => {
      functionParser = new FunctionParser();
      exportOnlyParser = new FunctionParser({ 
        includePrivate: false,
        includeArrowFunctions: false,
        includeClassMethods: false 
      });
      project = new Project({
        compilerOptions: {
          target: ScriptTarget.ES2020,
          module: ModuleKind.CommonJS,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      });
    });

    it('should extract more functions than export-only mode', () => {
      const sourceCode = `
        // Regular function (both parsers should find this)
        export function regularFunc(): void {}
        
        // Arrow function (FunctionParser should find this)
        export const arrowFunc = () => {};
        
        // Class method (FunctionParser should find this)
        class MyClass {
          method(): void {}
        }
        
        // Object method (FunctionParser should find this)
        const obj = {
          objMethod(): void {}
        };
      `;

      const sourceFile = project.createSourceFile('test.ts', sourceCode, { overwrite: true });
      const functionResults = functionParser.parse(sourceFile);
      const exportOnlyResults = exportOnlyParser.parse(sourceFile);
      project.removeSourceFile(sourceFile);

      // FunctionParser with includePrivate=true should find all 4 functions
      expect(functionResults.length).toBe(4);
      
      // Export-only mode with minimal config only finds exported regular functions
      expect(exportOnlyResults.length).toBe(1); // only regularFunc
      expect(exportOnlyResults[0].name).toBe('regularFunc');
      
      // Verify it found more functions than export-only mode
      expect(functionResults.length).toBeGreaterThan(exportOnlyResults.length);
    });

    it('should handle TypeScript-specific features', () => {
      const sourceCode = `
        // Generic function
        function identity<T>(value: T): T {
          return value;
        }
        
        // Function with union types
        const processValue = (value: string | number): void => {
          console.log(value);
        };
        
        // Function with interface parameter
        interface User {
          id: number;
          name: string;
        }
        
        function getUser(user: User): string {
          return user.name;
        }
      `;

      const sourceFile = project.createSourceFile('test.ts', sourceCode, { overwrite: true });
      const results = functionParser.parse(sourceFile);
      project.removeSourceFile(sourceFile);

      expect(results).toHaveLength(3);
      
      // Check generic function
      const identityFunc = results.find((f: FunctionMetadata) => f.name === 'identity');
      expect(identityFunc).toBeDefined();
      expect(identityFunc?.params[0].type).toBe('T');
      expect(identityFunc?.returnType).toBe('T');
      
      // Check union type handling
      const processFunc = results.find((f: FunctionMetadata) => f.name === 'processValue');
      expect(processFunc).toBeDefined();
      expect(processFunc?.params[0].type).toBe('string | number');
      
      // Check interface parameter
      const getUserFunc = results.find((f: FunctionMetadata) => f.name === 'getUser');
      expect(getUserFunc).toBeDefined();
      expect(getUserFunc?.params[0].type).toBe('User');
    });
  });

  describe('Parser Factory Pattern', () => {
    it('should allow parser selection based on requirements', () => {
      // Factory function to select appropriate parser
      function createParser(options?: { advanced?: boolean }): Parser {
        if (options?.advanced) {
          return new FunctionParser();
        }
        return new FunctionParser({ includePrivate: false });
      }

      const simpleParser = createParser();
      const advancedParser = createParser({ advanced: true });

      expect(simpleParser).toBeInstanceOf(FunctionParser);
      expect(advancedParser).toBeInstanceOf(FunctionParser);

      // Both should implement Parser
      const sourceCode = `export function test(): void {}`;
      const project = new Project();
      const sourceFile = project.createSourceFile('test.ts', sourceCode);
      
      expect(simpleParser.parse(sourceFile)).toBeDefined();
      expect(advancedParser.parse(sourceFile)).toBeDefined();
      
      project.removeSourceFile(sourceFile);
    });
  });
});