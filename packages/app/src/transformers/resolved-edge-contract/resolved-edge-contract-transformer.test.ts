import { ExternalSignatureStub, ResolvedEdgeStub } from '@assayer/shared/contracts';

import { resolvedEdgeContractTransformer } from './resolved-edge-contract-transformer';

describe('resolvedEdgeContractTransformer', () => {
  describe('local targets', () => {
    it('VALID: {named import carrying the target signature} => symbol, source path, — input, and return', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: './greeting',
          importedName: 'greeting',
          target: {
            kind: 'local',
            relPath: 'src/happy-path/import-local/uses-greeting/greeting.ts',
            signature: ExternalSignatureStub({ params: [], returnType: { kind: 'string' } }),
          },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'greeting',
        source: "import './greeting' → src/happy-path/import-local/uses-greeting/greeting.ts",
        inputs: [],
        output: 'returns string',
      });
    });

    it('VALID: {side-effect import with no named binding} => the bare specifier as symbol and no output', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: './side-effect',
          importedName: undefined,
          target: { kind: 'local', relPath: 'src/side-effect.ts' },
        }),
      });

      expect(result).toStrictEqual({
        symbol: "import './side-effect'",
        source: "import './side-effect' → src/side-effect.ts",
        inputs: [],
      });
    });
  });

  describe('package targets', () => {
    it('VALID: {package import with a declared signature} => pkg source with input and return lines', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: 'vendored-pkg',
          importedName: 'greet',
          target: {
            kind: 'package',
            packageName: 'vendored-pkg',
            signature: ExternalSignatureStub({ params: [{ name: 'name', type: { kind: 'string' } }], returnType: { kind: 'string' } }),
          },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'greet',
        source: 'pkg vendored-pkg',
        inputs: ['name: string'],
        output: 'returns string',
      });
    });

    it('VALID: {package import whose dependency ships no usable types} => pkg source with a — input and no output', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: 'vendored-pkg',
          importedName: 'greet',
          target: { kind: 'package', packageName: 'vendored-pkg' },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'greet',
        source: 'pkg vendored-pkg',
        inputs: [],
      });
    });
  });

  describe('builtin targets', () => {
    it('VALID: {node builtin import with a signature} => the specifier source with the builtin signature', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: 'node:path',
          importedName: 'basename',
          target: {
            kind: 'builtin',
            packageName: 'path',
            signature: ExternalSignatureStub({ params: [{ name: 'path', type: { kind: 'string' } }], returnType: { kind: 'string' } }),
          },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'basename',
        source: 'node:path',
        inputs: ['path: string'],
        output: 'returns string',
      });
    });

    it('VALID: {node builtin bound as a value carrying its type} => the specifier source with a type line', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: 'node:path',
          importedName: 'sep',
          target: { kind: 'builtin', packageName: 'path', type: { kind: 'string' } },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'sep',
        source: 'node:path',
        inputs: [],
        output: 'type string',
      });
    });
  });

  describe('ambient global targets', () => {
    it('VALID: {a called global method with a signature} => name.member, global source, input, and return', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: undefined,
          importedName: undefined,
          target: {
            kind: 'global',
            name: 'console',
            member: 'log',
            signature: ExternalSignatureStub({
              params: [{ name: 'data', type: { kind: 'unknown', text: 'any[]' } }],
              returnType: { kind: 'unknown', text: 'void' },
            }),
          },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'console.log',
        source: 'global',
        inputs: ['data: any[]'],
        output: 'returns void',
      });
    });

    it('VALID: {a global member access with a member type} => a type line instead of a return', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: undefined,
          importedName: undefined,
          target: { kind: 'global', name: 'process', member: 'env', type: { kind: 'unknown', text: 'ProcessEnv' } },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'process.env',
        source: 'global',
        inputs: [],
        output: 'type ProcessEnv',
      });
    });

    it('VALID: {an untyped global} => name.member with a — input and no output', () => {
      const result = resolvedEdgeContractTransformer({
        edge: ResolvedEdgeStub({
          specifier: undefined,
          importedName: undefined,
          target: { kind: 'global', name: 'process', member: 'env' },
        }),
      });

      expect(result).toStrictEqual({
        symbol: 'process.env',
        source: 'global',
        inputs: [],
      });
    });
  });
});
