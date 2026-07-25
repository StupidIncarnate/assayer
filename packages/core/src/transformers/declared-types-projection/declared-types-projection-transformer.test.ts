import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { declaredTypesProjectionTransformer } from './declared-types-projection-transformer';

describe('declaredTypesProjectionTransformer', () => {
  describe('a walk with a named object param', () => {
    it('VALID: {param typed as a local interface} => the interface with its full property list', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            params: [
              {
                name: 'cfg',
                type: {
                  kind: 'object',
                  typeName: 'Config',
                  properties: [
                    { name: 'mode', type: { kind: 'string' } },
                    { name: 'retries', type: { kind: 'number' } },
                  ],
                },
              },
            ],
            returnType: { kind: 'string' },
          }),
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([
        {
          name: 'Config',
          properties: [
            { name: 'mode', type: { kind: 'string' } },
            { name: 'retries', type: { kind: 'number' } },
          ],
        },
      ]);
    });
  });

  // The defect this channel closes: a types-only module declares `Config` and no signature in it
  // mentions the shape, so gathering only off params and return types leaves the file's whole declared
  // surface empty and every reader across the repo is invoiced for a shape Assayer can build itself.
  describe('a walk with a declaration no signature mentions', () => {
    it('VALID: {a declared shape and no scopes} => the declared shape with its full property list', () => {
      const walked = WalkFileResultStub({
        declaredShapes: [
          {
            name: 'Config',
            type: {
              kind: 'object',
              typeName: 'Config',
              properties: [
                { name: 'mode', type: { kind: 'string' } },
                { name: 'region', type: { kind: 'string' } },
              ],
            },
          },
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([
        {
          name: 'Config',
          properties: [
            { name: 'mode', type: { kind: 'string' } },
            { name: 'region', type: { kind: 'string' } },
          ],
        },
      ]);
    });

    it('VALID: {a declared alias to a union} => no declared type, since it names no object shape', () => {
      const walked = WalkFileResultStub({
        declaredShapes: [
          {
            name: 'Method',
            type: { kind: 'union', members: [{ kind: 'literal', value: 'get' }, { kind: 'literal', value: 'post' }] },
          },
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([]);
    });

    // Both channels feed one list, so the same shape arriving twice is still one entry.
    it('VALID: {a shape declared AND taken by a signature} => one entry, not two', () => {
      const walked = WalkFileResultStub({
        declaredShapes: [
          {
            name: 'Config',
            type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          },
        ],
        scopes: [
          ScopeRecordStub({
            params: [
              { name: 'cfg', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] } },
            ],
            returnType: { kind: 'string' },
          }),
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([
        { name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      ]);
    });
  });

  describe('a walk aggregating multiple declaredShapes and scopes', () => {
    // Both the return type and each scope's params feed the same channel, and declaredShapes is itself
    // a collection — every prior test passes exactly one of each. Two declaredShapes plus a scope whose
    // NAMED object arrives only through its return type (never its params) proves all three sources
    // combine into one sorted list.
    it('VALID: {two declaredShapes, and a scope naming Alpha only in its return type} => all names, sorted', () => {
      const walked = WalkFileResultStub({
        declaredShapes: [
          { name: 'Zeta', type: { kind: 'object', typeName: 'Zeta', properties: [{ name: 'z', type: { kind: 'string' } }] } },
          { name: 'Omega', type: { kind: 'object', typeName: 'Omega', properties: [{ name: 'o', type: { kind: 'string' } }] } },
        ],
        scopes: [
          ScopeRecordStub({
            params: [
              { name: 'b', type: { kind: 'object', typeName: 'Beta', properties: [{ name: 'b', type: { kind: 'string' } }] } },
            ],
            returnType: { kind: 'object', typeName: 'Alpha', properties: [{ name: 'a', type: { kind: 'string' } }] },
          }),
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([
        { name: 'Alpha', properties: [{ name: 'a', type: { kind: 'string' } }] },
        { name: 'Beta', properties: [{ name: 'b', type: { kind: 'string' } }] },
        { name: 'Omega', properties: [{ name: 'o', type: { kind: 'string' } }] },
        { name: 'Zeta', properties: [{ name: 'z', type: { kind: 'string' } }] },
      ]);
    });
  });

  describe('a walk with no local object types', () => {
    it('EMPTY: {only primitive params} => no declared types', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' } })],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([]);
    });

    it('EMPTY: {a failed parse} => no declared types', () => {
      const walked = WalkFileResultStub({ success: false, error: { line: 1, column: 1, message: 'boom' } });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([]);
    });
  });

  describe('a walk where one type appears fully and by self-reference', () => {
    it('VALID: {a self-referential interface} => one entry keeping the full property list', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            name: 'walk',
            scopePath: ['walk'],
            params: [
              {
                name: 't',
                type: {
                  kind: 'object',
                  typeName: 'Tree',
                  properties: [
                    { name: 'next', type: { kind: 'object', typeName: 'Tree', properties: [] } },
                    { name: 'value', type: { kind: 'number' } },
                  ],
                },
              },
            ],
            returnType: { kind: 'number' },
          }),
        ],
      });

      expect(declaredTypesProjectionTransformer({ walked })).toStrictEqual([
        {
          name: 'Tree',
          properties: [
            { name: 'next', type: { kind: 'object', typeName: 'Tree', properties: [] } },
            { name: 'value', type: { kind: 'number' } },
          ],
        },
      ]);
    });
  });
});
