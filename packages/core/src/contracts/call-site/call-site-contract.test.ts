import { callSiteContract } from './call-site-contract';
import { CallSiteStub } from './call-site.stub';

describe('callSiteContract', () => {
  describe('the callee link', () => {
    it('VALID: {stub default} => a local link to a same-file scope, matched by name and line', () => {
      const site = CallSiteStub();

      const result = callSiteContract.parse(site);

      expect(result).toStrictEqual({
        callee: { target: 'local', name: 'inner', startLine: 2 },
        args: [{ kind: 'param-ref', paramName: 'value' }],
        guardPath: [],
      });
    });

    it('VALID: {an unresolved callee} => parses, carrying no reference to inline', () => {
      const result = callSiteContract.parse({ callee: { target: 'unresolved' }, args: [], guardPath: [] });

      expect(result).toStrictEqual({ callee: { target: 'unresolved' }, args: [], guardPath: [] });
    });
  });

  describe('the argument projections', () => {
    it('VALID: {a fixed literal argument} => parses, carrying the welded value', () => {
      const result = callSiteContract.parse({
        callee: { target: 'local', name: 'decide', startLine: 1 },
        args: [{ kind: 'literal', value: 3 }],
        guardPath: [],
      });

      expect(result).toStrictEqual({
        callee: { target: 'local', name: 'decide', startLine: 1 },
        args: [{ kind: 'literal', value: 3 }],
        guardPath: [],
      });
    });

    it('VALID: {an opaque argument} => parses with no value, since none can be projected', () => {
      const result = callSiteContract.parse({ callee: { target: 'unresolved' }, args: [{ kind: 'opaque' }], guardPath: [] });

      expect(result).toStrictEqual({ callee: { target: 'unresolved' }, args: [{ kind: 'opaque' }], guardPath: [] });
    });
  });

  describe('the guard path that reaches the call', () => {
    it('VALID: {a guarded call} => parses, carrying the step that must hold to reach it', () => {
      const result = callSiteContract.parse({
        callee: { target: 'local', name: 'inner', startLine: 2 },
        args: [{ kind: 'param-ref', paramName: 'value' }],
        guardPath: [{ branchCoverageId: 'outer/if:id:flag', arm: 'else' }],
      });

      expect(result).toStrictEqual({
        callee: { target: 'local', name: 'inner', startLine: 2 },
        args: [{ kind: 'param-ref', paramName: 'value' }],
        guardPath: [{ branchCoverageId: 'outer/if:id:flag', arm: 'else' }],
      });
    });
  });

  describe('invalid shapes', () => {
    it('INVALID: {a callee target the follower cannot resolve} => throws on the discriminator', () => {
      expect(() => {
        return callSiteContract.parse({ callee: { target: 'file' }, args: [], guardPath: [] });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {an argument kind that is not projected} => throws on the discriminator', () => {
      expect(() => {
        return callSiteContract.parse({ callee: { target: 'unresolved' }, args: [{ kind: 'expression' }], guardPath: [] });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
