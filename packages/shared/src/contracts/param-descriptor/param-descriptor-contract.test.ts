import { paramDescriptorContract } from './param-descriptor-contract';
import { ParamDescriptorStub } from './param-descriptor.stub';

describe('paramDescriptorContract', () => {
  describe('valid param descriptors', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const param = ParamDescriptorStub();

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual(param);
    });

    // `optional` is carried only when true — a caller owes this parameter nothing, exactly as
    // `maybe(11)` is a legal call of `maybe(size, report?)`.
    it('VALID: {optional: true} => carries the flag that says the caller owes it nothing', () => {
      const param = ParamDescriptorStub({ optional: true });

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual({ name: 'name', type: { kind: 'string' }, optional: true });
    });

    // The same debt spelled the other way — `collect(11)` binds `sinks` to the empty array.
    it('VALID: {rest: true} => carries the flag for a rest parameter', () => {
      const param = ParamDescriptorStub({ rest: true });

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual({ name: 'name', type: { kind: 'string' }, rest: true });
    });

    it('VALID: {declaredText} => carries the source-spelled type text for the P1 invoice', () => {
      const param = ParamDescriptorStub({
        type: { kind: 'object', properties: [] },
        declaredText: 'readonly [string, number]',
      });

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual({
        name: 'name',
        type: { kind: 'object', properties: [] },
        declaredText: 'readonly [string, number]',
      });
    });

    it('VALID: {a callable param} => parses a callback parameter carrying its signature text', () => {
      const param = ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '() => void' } });

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual({ name: 'report', type: { kind: 'callable', text: '() => void' } });
    });
  });

  describe('invalid param descriptors', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return paramDescriptorContract.parse({ name: '', type: { kind: 'string' } });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {no name} => throws validation error', () => {
      expect(() => {
        return paramDescriptorContract.parse({ type: { kind: 'string' } });
      }).toThrow(/Invalid input: expected string, received undefined/u);
    });

    it('INVALID: {no type} => throws validation error', () => {
      expect(() => {
        return paramDescriptorContract.parse({ name: 'name' });
      }).toThrow(/Invalid input: expected object, received undefined/u);
    });
  });
});
