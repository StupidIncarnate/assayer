import type { FunctionMetadata } from './metadata';

describe('FunctionMetadata Interface', () => {
  describe('interface structure', () => {
    it('should accept a valid function metadata object with all required properties', () => {
      // This test verifies that a properly structured object conforms to the interface
      const validMetadata: FunctionMetadata = {
        name: 'calculateSum',
        params: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' }
        ],
        returnType: 'number'
      };

      // TypeScript compilation itself validates the interface structure
      expect(validMetadata.name).toBe('calculateSum');
      expect(validMetadata.params).toHaveLength(2);
      expect(validMetadata.returnType).toBe('number');
    });

    it('should accept function metadata with empty params array', () => {
      // Test edge case of parameterless functions
      const noParamsMetadata: FunctionMetadata = {
        name: 'getCurrentTimestamp',
        params: [],
        returnType: 'Date'
      };

      expect(noParamsMetadata.params).toEqual([]);
      expect(noParamsMetadata.params).toHaveLength(0);
      expect(Array.isArray(noParamsMetadata.params)).toBe(true);
    });

    it('should accept function metadata with multiple parameters', () => {
      // Test functions with many parameters of different types
      const multiParamMetadata: FunctionMetadata = {
        name: 'createUser',
        params: [
          { name: 'name', type: 'string' },
          { name: 'age', type: 'number' },
          { name: 'isActive', type: 'boolean' },
          { name: 'metadata', type: 'Record<string, unknown>' },
          { name: 'tags', type: 'string[]' }
        ],
        returnType: 'User'
      };

      expect(multiParamMetadata.params).toHaveLength(5);
      expect(multiParamMetadata.params[0].name).toBe('name');
      expect(multiParamMetadata.params[4].type).toBe('string[]');
    });
  });

  describe('param structure', () => {
    it('should accept params with simple type strings', () => {
      // Test basic TypeScript types
      const simpleTypesMetadata: FunctionMetadata = {
        name: 'processBasicTypes',
        params: [
          { name: 'str', type: 'string' },
          { name: 'num', type: 'number' },
          { name: 'bool', type: 'boolean' },
          { name: 'obj', type: 'object' },
          { name: 'any', type: 'any' },
          { name: 'unknown', type: 'unknown' },
          { name: 'void', type: 'void' },
          { name: 'undefined', type: 'undefined' },
          { name: 'null', type: 'null' }
        ],
        returnType: 'void'
      };

      simpleTypesMetadata.params.forEach(param => {
        expect(typeof param.name).toBe('string');
        expect(typeof param.type).toBe('string');
      });
    });

    it('should accept params with complex type strings', () => {
      // Test advanced TypeScript type constructs
      const complexTypesMetadata: FunctionMetadata = {
        name: 'handleComplexTypes',
        params: [
          { name: 'union', type: 'string | number | boolean' },
          { name: 'intersection', type: 'User & { id: string }' },
          { name: 'generic', type: 'Array<User>' },
          { name: 'nested', type: 'Map<string, Set<number>>' },
          { name: 'tuple', type: '[string, number, boolean]' },
          { name: 'literal', type: "'success' | 'error' | 'pending'" },
          { name: 'conditional', type: 'T extends string ? boolean : number' }
        ],
        returnType: 'ComplexResult<T>'
      };

      expect(complexTypesMetadata.params[0].type).toContain('|');
      expect(complexTypesMetadata.params[1].type).toContain('&');
      expect(complexTypesMetadata.params[2].type).toContain('<');
      expect(complexTypesMetadata.params[2].type).toContain('>');
    });

    it('should accept params with special characters in type strings', () => {
      // Test types with various special characters and formatting
      const specialCharsMetadata: FunctionMetadata = {
        name: 'parseSpecialTypes',
        params: [
          { name: 'array', type: 'string[]' },
          { name: 'record', type: 'Record<string, any>' },
          { name: 'mapped', type: '{ [key: string]: number }' },
          { name: 'optional', type: 'string | undefined' },
          { name: 'nullable', type: 'string | null' },
          { name: 'function', type: '(x: number) => string' },
          { name: 'promise', type: 'Promise<void>' },
          { name: 'template', type: '`prefix-${string}`' }
        ],
        returnType: 'unknown'
      };

      // Verify special characters are preserved in type strings
      expect(specialCharsMetadata.params[0].type).toContain('[]');
      expect(specialCharsMetadata.params[1].type).toContain('<');
      expect(specialCharsMetadata.params[2].type).toContain('[');
      expect(specialCharsMetadata.params[5].type).toContain('=>');
      expect(specialCharsMetadata.params[7].type).toContain('${');
    });
  });

  describe('type safety', () => {
    it('should enforce required properties at compile time', () => {
      // This test demonstrates TypeScript's compile-time checking
      const metadata: FunctionMetadata = {
        name: 'testFunction',
        params: [],
        returnType: 'void'
      };

      // TypeScript ensures all properties exist
      expect('name' in metadata).toBe(true);
      expect('params' in metadata).toBe(true);
      expect('returnType' in metadata).toBe(true);

      // Test that the interface structure is enforced
      const keys = Object.keys(metadata);
      expect(keys).toContain('name');
      expect(keys).toContain('params');
      expect(keys).toContain('returnType');
    });

    it('should allow creation of FunctionMetadata arrays', () => {
      // Test that arrays of FunctionMetadata work correctly
      const metadataArray: FunctionMetadata[] = [
        {
          name: 'func1',
          params: [{ name: 'x', type: 'number' }],
          returnType: 'number'
        },
        {
          name: 'func2',
          params: [],
          returnType: 'void'
        },
        {
          name: 'func3',
          params: [
            { name: 'a', type: 'string' },
            { name: 'b', type: 'boolean' }
          ],
          returnType: 'Promise<string>'
        }
      ];

      expect(metadataArray).toHaveLength(3);
      expect(metadataArray.every(m => 'name' in m)).toBe(true);
      expect(metadataArray.every(m => Array.isArray(m.params))).toBe(true);
    });

    it('should work with utility types like Partial and Required', () => {
      // Test TypeScript utility type compatibility
      type PartialMetadata = Partial<FunctionMetadata>;
      const partial: PartialMetadata = {
        name: 'partialFunction'
        // params and returnType are optional in Partial
      };

      expect(partial.name).toBe('partialFunction');
      expect(partial.params).toBeUndefined();
      expect(partial.returnType).toBeUndefined();

      // Test with Required (though FunctionMetadata already has all required fields)
      type RequiredMetadata = Required<FunctionMetadata>;
      const required: RequiredMetadata = {
        name: 'requiredFunction',
        params: [],
        returnType: 'void'
      };

      expect(Object.keys(required)).toHaveLength(3);
    });
  });

  describe('real-world usage', () => {
    it('should handle React component function metadata', () => {
      // Test with React-style function signatures
      const reactComponentMetadata: FunctionMetadata = {
        name: 'UserProfile',
        params: [
          { name: 'props', type: '{ userId: string; onUpdate: (user: User) => void }' }
        ],
        returnType: 'JSX.Element'
      };

      expect(reactComponentMetadata.name).toBe('UserProfile');
      expect(reactComponentMetadata.returnType).toBe('JSX.Element');
      expect(reactComponentMetadata.params[0].type).toContain('onUpdate');

      // Test React hooks
      const hookMetadata: FunctionMetadata = {
        name: 'useUserData',
        params: [
          { name: 'userId', type: 'string' },
          { name: 'options', type: '{ refetchInterval?: number }' }
        ],
        returnType: '{ data: User | null; loading: boolean; error: Error | null }'
      };

      expect(hookMetadata.name).toMatch(/^use/);
      expect(hookMetadata.returnType).toContain('loading');
    });

    it('should handle async function metadata', () => {
      // Test with Promise return types
      const asyncMetadata: FunctionMetadata = {
        name: 'fetchUserData',
        params: [
          { name: 'userId', type: 'string' },
          { name: 'signal', type: 'AbortSignal' }
        ],
        returnType: 'Promise<User>'
      };

      expect(asyncMetadata.returnType).toMatch(/^Promise</);
      expect(asyncMetadata.returnType).toContain('User');

      // Test async function with complex Promise types
      const complexAsyncMetadata: FunctionMetadata = {
        name: 'batchProcess',
        params: [
          { name: 'items', type: 'T[]' },
          { name: 'processor', type: '(item: T) => Promise<R>' }
        ],
        returnType: 'Promise<{ results: R[]; errors: Error[] }>'
      };

      expect(complexAsyncMetadata.params[1].type).toContain('Promise');
      expect(complexAsyncMetadata.returnType).toContain('results');
      expect(complexAsyncMetadata.returnType).toContain('errors');
    });

    it('should handle generic function metadata', () => {
      // Test with generic type parameters in strings
      const genericMetadata: FunctionMetadata = {
        name: 'map',
        params: [
          { name: 'array', type: 'T[]' },
          { name: 'fn', type: '(item: T, index: number) => R' }
        ],
        returnType: 'R[]'
      };

      expect(genericMetadata.params[0].type).toBe('T[]');
      expect(genericMetadata.params[1].type).toContain('T');
      expect(genericMetadata.params[1].type).toContain('R');
      expect(genericMetadata.returnType).toBe('R[]');

      // Test with constrained generics
      const constrainedGenericMetadata: FunctionMetadata = {
        name: 'sortBy',
        params: [
          { name: 'items', type: 'T[]' },
          { name: 'keyFn', type: '(item: T) => K' },
          { name: 'compareFn', type: '(a: K, b: K) => number' }
        ],
        returnType: 'T[]'
      };

      expect(constrainedGenericMetadata.params).toHaveLength(3);
      expect(constrainedGenericMetadata.params[1].type).toContain('=>');
    });
  });
});