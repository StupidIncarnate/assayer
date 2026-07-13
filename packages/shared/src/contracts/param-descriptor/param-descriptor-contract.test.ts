import { paramDescriptorContract } from './param-descriptor-contract';
import { ParamDescriptorStub } from './param-descriptor.stub';

describe('paramDescriptorContract', () => {
  describe('valid param descriptors', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const param = ParamDescriptorStub();

      const result = paramDescriptorContract.parse(param);

      expect(result).toStrictEqual(param);
    });
  });

  describe('invalid param descriptors', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return paramDescriptorContract.parse({ name: '', type: { kind: 'string' } });
      }).toThrow(/at least 1 character/u);
    });
  });
});
