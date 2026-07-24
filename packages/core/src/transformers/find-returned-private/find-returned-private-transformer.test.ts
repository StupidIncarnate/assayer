import { BranchNodeStub, ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { findReturnedPrivateTransformer } from './find-returned-private-transformer';

// A branching private `inner` the walk recorded at start line 2.
const INNER = ScopeRecordStub({
  scopePath: ['*module*', 'outer', 'inner'],
  name: 'inner',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  startLine: 2,
  endLine: 7,
  branches: [BranchNodeStub()],
  exits: [],
});

// A branchless helper `plain`, otherwise identical — nothing to funnel.
const PLAIN = ScopeRecordStub({
  scopePath: ['*module*', 'outer', 'plain'],
  name: 'plain',
  exported: false,
  access: { kind: 'unreachable' },
  startLine: 2,
  endLine: 7,
  branches: [],
  exits: [],
});

const RETURN_EXIT = ExitNodeStub({ coverageId: 'outer/return@top', kind: 'return', guardPath: [], line: 5 });

const outerReturning = ({ call }: { call: ReturnType<typeof CallSiteStub> }): ReturnType<typeof ScopeRecordStub> =>
  ScopeRecordStub({
    scopePath: ['*module*', 'outer'],
    name: 'outer',
    access: { kind: 'named' },
    params: [{ name: 'value', type: { kind: 'number' } }],
    startLine: 1,
    endLine: 6,
    branches: [],
    exits: [RETURN_EXIT],
    calls: [call],
  });

describe('findReturnedPrivateTransformer', () => {
  describe('an exit that returns a branching private', () => {
    it('VALID: {return inner(value) on the exit line} => the private and the call it links to', () => {
      const call = CallSiteStub({
        callee: { target: 'local', name: 'inner', startLine: 2 },
        args: [{ kind: 'param-ref', paramName: 'value' }],
        guardPath: [],
        position: { line: 5, column: 10 },
      });
      const outer = outerReturning({ call });
      const [outerCall] = outer.calls;

      const result = findReturnedPrivateTransformer({ scope: outer, exit: RETURN_EXIT, scopes: [outer, INNER] });

      expect(result).toStrictEqual({ privateScope: INNER, call: outerCall });
    });
  });

  describe('an exit that returns nothing to funnel', () => {
    it('EMPTY: {an implicit (non-return) exit} => undefined', () => {
      const call = CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, guardPath: [], position: { line: 5, column: 10 } });
      const outer = outerReturning({ call });
      const implicitExit = ExitNodeStub({ coverageId: 'outer/exit@top', kind: 'implicit', guardPath: [], line: 5 });

      const result = findReturnedPrivateTransformer({ scope: outer, exit: implicitExit, scopes: [outer, INNER] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {no call written on the exit line} => undefined', () => {
      const call = CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, guardPath: [], position: { line: 99, column: 10 } });
      const outer = outerReturning({ call });

      const result = findReturnedPrivateTransformer({ scope: outer, exit: RETURN_EXIT, scopes: [outer, INNER] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the call links to a BRANCHLESS helper} => undefined, nothing to funnel', () => {
      const call = CallSiteStub({ callee: { target: 'local', name: 'plain', startLine: 2 }, guardPath: [], position: { line: 5, column: 10 } });
      const outer = outerReturning({ call });

      const result = findReturnedPrivateTransformer({ scope: outer, exit: RETURN_EXIT, scopes: [outer, PLAIN] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the call targets an IMPORT, not a local} => undefined', () => {
      const call = CallSiteStub({ callee: { target: 'import', specifier: './greeting', importedName: 'inner' }, guardPath: [], position: { line: 5, column: 10 } });
      const outer = outerReturning({ call });

      const result = findReturnedPrivateTransformer({ scope: outer, exit: RETURN_EXIT, scopes: [outer, INNER] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the call sits under a different guard arm than the exit} => undefined', () => {
      const call = CallSiteStub({
        callee: { target: 'local', name: 'inner', startLine: 2 },
        guardPath: [{ branchCoverageId: 'outer/if:flag', arm: 'then' }],
        position: { line: 5, column: 10 },
      });
      const outer = outerReturning({ call });

      const result = findReturnedPrivateTransformer({ scope: outer, exit: RETURN_EXIT, scopes: [outer, INNER] });

      expect(result).toBe(undefined);
    });
  });
});
