import { symbolNameContract } from '@assayer/shared/contracts';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { resolvePropertyTypeTransformer } from './resolve-property-type-transformer';

describe('resolvePropertyTypeTransformer', () => {
  describe('a one-segment path', () => {
    it("VALID: {config.mode off {mode: string}} => the property's own type", () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({ kind: 'object', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
        path: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });

  describe('a multi-segment path through nested objects', () => {
    it("VALID: {config.db.retry off {db: {retry: number}}} => the type at the FULL path's end", () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({
          kind: 'object',
          properties: [
            {
              name: 'db',
              type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] },
            },
          ],
        }),
        path: [symbolNameContract.parse('db'), symbolNameContract.parse('retry')],
      });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {a three-segment path} => walks every level', () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({
          kind: 'object',
          properties: [
            {
              name: 'db',
              type: {
                kind: 'object',
                properties: [
                  {
                    name: 'retry',
                    type: { kind: 'object', properties: [{ name: 'backoff', type: { kind: 'string' } }] },
                  },
                ],
              },
            },
          ],
        }),
        path: [symbolNameContract.parse('db'), symbolNameContract.parse('retry'), symbolNameContract.parse('backoff')],
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });

  describe('an empty path', () => {
    it('VALID: {no segments} => the type itself, unchanged', () => {
      const result = resolvePropertyTypeTransformer({ type: TypeDescriptorStub({ kind: 'string' }), path: [] });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });

  describe('a path the shape does not declare', () => {
    it('EMPTY: {a segment name no property has} => undefined, never a guess', () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({ kind: 'object', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
        path: [symbolNameContract.parse('other')],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a path that continues past a non-object type', () => {
    it('EMPTY: {config.mode.sub where mode is a plain string} => undefined, the path cannot continue', () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({ kind: 'object', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
        path: [symbolNameContract.parse('mode'), symbolNameContract.parse('sub')],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a path off a non-object root', () => {
    it('EMPTY: {a scalar root with a non-empty path} => undefined', () => {
      const result = resolvePropertyTypeTransformer({
        type: TypeDescriptorStub({ kind: 'unknown', text: 'any' }),
        path: [symbolNameContract.parse('mode')],
      });

      expect(result).toBe(undefined);
    });
  });
});
