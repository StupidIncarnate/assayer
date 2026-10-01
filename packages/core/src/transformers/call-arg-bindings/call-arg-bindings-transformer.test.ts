import { ParamDescriptorStub } from '@assayer/shared/contracts/param-descriptor/param-descriptor.stub';

import { callArgBindingsTransformer } from './call-arg-bindings-transformer';
import { CallSiteStub } from '../../contracts/call-site/call-site.stub';

describe('callArgBindingsTransformer', () => {
  describe('a passthrough argument', () => {
    it('VALID: {callee value <- caller x} => toCallerParam maps value to x, no weld', () => {
      const result = callArgBindingsTransformer({
        calleeParams: [ParamDescriptorStub({ name: 'value', type: { kind: 'number' } })],
        args: CallSiteStub({ args: [{ kind: 'param-ref', paramName: 'x' }] }).args,
      });

      expect(result).toStrictEqual({ toCallerParam: new Map([['value', 'x']]), weldByParam: new Map() });
    });
  });

  describe('a welded literal argument', () => {
    it('VALID: {callee value <- literal 3} => weldByParam maps value to 3, no passthrough', () => {
      const result = callArgBindingsTransformer({
        calleeParams: [ParamDescriptorStub({ name: 'value', type: { kind: 'number' } })],
        args: CallSiteStub({ args: [{ kind: 'literal', value: 3 }] }).args,
      });

      expect(result).toStrictEqual({ toCallerParam: new Map(), weldByParam: new Map([['value', 3]]) });
    });
  });

  describe('a mix', () => {
    it('VALID: {one passthrough, one weld} => each lands in its own map, positionally', () => {
      const result = callArgBindingsTransformer({
        calleeParams: [
          ParamDescriptorStub({ name: 'a', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'b', type: { kind: 'number' } }),
        ],
        args: CallSiteStub({ args: [{ kind: 'param-ref', paramName: 'x' }, { kind: 'literal', value: 9 }] }).args,
      });

      expect(result).toStrictEqual({ toCallerParam: new Map([['a', 'x']]), weldByParam: new Map([['b', 9]]) });
    });
  });

  describe('an opaque argument', () => {
    it('VALID: {an opaque arg} => neither map — the callee is not drivable through it', () => {
      const result = callArgBindingsTransformer({
        calleeParams: [ParamDescriptorStub({ name: 'value', type: { kind: 'number' } })],
        args: CallSiteStub({ args: [{ kind: 'opaque' }] }).args,
      });

      expect(result).toStrictEqual({ toCallerParam: new Map(), weldByParam: new Map() });
    });
  });
});
