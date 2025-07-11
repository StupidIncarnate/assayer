import { SimpleFunctionParser } from './simple-function-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SimpleFunctionParser', () => {
  let parser: SimpleFunctionParser;
  let tempDir: string;

  beforeEach(() => {
    parser = new SimpleFunctionParser();
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assayer-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('parseSourceCode', () => {
    it('should parse a simple exported function with parameters', () => {
      const sourceCode = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'add',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
        returnType: 'number',
      });
    });

    it('should parse multiple exported functions', () => {
      const sourceCode = `
        export function multiply(x: number, y: number): number {
          return x * y;
        }

        export function divide(dividend: number, divisor: number): number {
          return dividend / divisor;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('multiply');
      expect(result[1].name).toBe('divide');
    });

    it('should ignore non-exported functions', () => {
      const sourceCode = `
        function internal(x: number): number {
          return x * 2;
        }

        export function public(x: number): number {
          return internal(x);
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('public');
    });

    it('should handle functions with no parameters', () => {
      const sourceCode = `
        export function getMessage(): string {
          return "Hello, World!";
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'getMessage',
        params: [],
        returnType: 'string',
      });
    });

    it('should handle void return types', () => {
      const sourceCode = `
        export function logMessage(message: string): void {
          console.log(message);
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'logMessage',
        params: [{ name: 'message', type: 'string' }],
        returnType: 'void',
      });
    });

    it('should handle complex parameter types', () => {
      const sourceCode = `
        interface User {
          id: number;
          name: string;
        }

        export function greetUser(user: User, options: { formal: boolean }): string {
          return options.formal ? \`Dear \${user.name}\` : \`Hi \${user.name}\`;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'greetUser',
        params: [
          { name: 'user', type: 'User' },
          { name: 'options', type: '{ formal: boolean }' },
        ],
        returnType: 'string',
      });
    });

    it('should handle array types', () => {
      const sourceCode = `
        export function sum(numbers: number[]): number {
          return numbers.reduce((a, b) => a + b, 0);
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'sum',
        params: [{ name: 'numbers', type: 'number[]' }],
        returnType: 'number',
      });
    });

    it('should handle union types', () => {
      const sourceCode = `
        export function format(value: string | number): string {
          return String(value);
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'format',
        params: [{ name: 'value', type: 'string | number' }],
        returnType: 'string',
      });
    });

    it('should handle Promise return types', () => {
      const sourceCode = `
        export async function fetchData(url: string): Promise<string> {
          const response = await fetch(url);
          return response.text();
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'fetchData',
        params: [{ name: 'url', type: 'string' }],
        returnType: 'Promise<string>',
      });
    });

    it('should handle default export functions', () => {
      const sourceCode = `
        export default function process(data: string): string {
          return data.toUpperCase();
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'process',
        params: [{ name: 'data', type: 'string' }],
        returnType: 'string',
      });
    });

    it('should handle named exports', () => {
      const sourceCode = `
        function helper(x: number): number {
          return x * 2;
        }

        function calculate(y: number): number {
          return helper(y) + 1;
        }

        export { calculate };
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('calculate');
    });

    it('should handle functions with optional parameters', () => {
      const sourceCode = `
        export function greet(name: string, title?: string): string {
          return title ? \`\${title} \${name}\` : \`Hello \${name}\`;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'greet',
        params: [
          { name: 'name', type: 'string' },
          { name: 'title', type: 'string | undefined' },
        ],
        returnType: 'string',
      });
    });

    it('should handle functions with rest parameters', () => {
      const sourceCode = `
        export function concat(...args: string[]): string {
          return args.join('');
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'concat',
        params: [{ name: 'args', type: 'string[]' }],
        returnType: 'string',
      });
    });

    it('should handle generic functions', () => {
      const sourceCode = `
        export function identity<T>(value: T): T {
          return value;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'identity',
        params: [{ name: 'value', type: 'T' }],
        returnType: 'T',
      });
    });

    it('should handle functions with no explicit return type', () => {
      const sourceCode = `
        export function implicitReturn(x: number) {
          return x + 1;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('implicitReturn');
      expect(result[0].returnType).toBe('number');
    });

    it('should return empty array for source with no exported functions', () => {
      const sourceCode = `
        const x = 42;
        let y = "hello";
        
        class MyClass {
          method() {}
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(0);
    });
  });

  describe('parse', () => {
    it('should parse functions from a file', () => {
      const filePath = path.join(tempDir, 'test.ts');
      const sourceCode = `
        export function subtract(a: number, b: number): number {
          return a - b;
        }
      `;
      
      fs.writeFileSync(filePath, sourceCode);

      const result = parser.parse(filePath);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'subtract',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
        returnType: 'number',
      });
    });

    it('should throw an error for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.ts');

      expect(() => parser.parse(nonExistentPath)).toThrow(/Failed to parse file/);
    });

    it('should handle files with syntax errors gracefully', () => {
      const filePath = path.join(tempDir, 'syntax-error.ts');
      const sourceCode = `
        export function broken(a: number {
          return a;
        }
      `;
      
      fs.writeFileSync(filePath, sourceCode);

      expect(() => parser.parse(filePath)).toThrow(/Failed to parse file/);
    });

    it('should parse real example file correctly', () => {
      const filePath = path.join(tempDir, 'math.ts');
      const sourceCode = `export function add(a: number, b: number): number { return a + b; }`;
      
      fs.writeFileSync(filePath, sourceCode);

      const result = parser.parse(filePath);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'add',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
        returnType: 'number',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle arrow function exports', () => {
      // Note: Currently the parser only handles function declarations
      // Arrow functions would need additional implementation
      const sourceCode = `
        export const multiply = (x: number, y: number): number => x * y;
      `;

      const result = parser.parseSourceCode(sourceCode);

      // Current implementation doesn't support arrow functions
      expect(result).toHaveLength(0);
    });

    it('should handle functions with destructured parameters', () => {
      const sourceCode = `
        export function processUser({ name, age }: { name: string; age: number }): string {
          return \`\${name} is \${age} years old\`;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'processUser',
        params: [
          { name: '{ name, age }', type: '{ name: string; age: number }' },
        ],
        returnType: 'string',
      });
    });

    it('should handle functions with default parameters', () => {
      const sourceCode = `
        export function greetWithDefault(name: string = "Guest"): string {
          return \`Hello, \${name}!\`;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('greetWithDefault');
      expect(result[0].params[0].name).toBe('name');
    });

    it('should handle overloaded functions', () => {
      const sourceCode = `
        export function process(x: string): string;
        export function process(x: number): number;
        export function process(x: string | number): string | number {
          return x;
        }
      `;

      const result = parser.parseSourceCode(sourceCode);

      // ts-morph returns the implementation signature
      expect(result).toHaveLength(1);
      expect(result[0].params[0].type).toBe('string | number');
      expect(result[0].returnType).toBe('string | number');
    });
  });
});