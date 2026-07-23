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
