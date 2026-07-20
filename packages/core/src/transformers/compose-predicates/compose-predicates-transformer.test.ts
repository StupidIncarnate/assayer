import { BranchNodeStub, EntrySignatureStub, ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ExtractedFunctionStub } from '../../contracts/extracted-function/extracted-function.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { composePredicatesTransformer } from './compose-predicates-transformer';

// `classify(x)` guarded by `if (tooBig(x))` — a lone truthy leaf over a call, anchored to the call it
// came from. This is the opaque branch compose swaps for `tooBig`'s own comparison.
const OPAQUE_BRANCH = BranchNodeStub({
  coverageId: '*module*/classify/if:CallExpression,id:tooBig,id:x',
  condition: {
    kind: 'leaf',
    id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf',
    operandCallPosition: { line: 6, column: 7 },
    operandType: { kind: 'boolean' },
    predicate: { kind: 'truthy' },
  },
  startLine: 6,
  endLine: 8,
});

const CLASSIFY_ENTRY = EntrySignatureStub({
  name: 'classify',
  scopePath: ['*module*', 'classify'],
  params: [{ name: 'x', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  line: 5,
  access: { kind: 'named' },
});

const CLASSIFY_EXIT = ExitNodeStub({
  coverageId: '*module*/classify/return@if:CallExpression,id:tooBig,id:x#then',
  guardPath: [{ branchCoverageId: '*module*/classify/if:CallExpression,id:tooBig,id:x', arm: 'then' }],
  line: 7,
});

const CLASSIFY_FN = ExtractedFunctionStub({ entry: CLASSIFY_ENTRY, branches: [OPAQUE_BRANCH], exits: [CLASSIFY_EXIT] });

const CLASSIFY_SCOPE = ScopeRecordStub({
  scopePath: ['*module*', 'classify'],
  name: 'classify',
  params: [{ name: 'x', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  startLine: 5,
  endLine: 11,
  calls: [
    CallSiteStub({
      callee: { target: 'local', name: 'tooBig', startLine: 1 },
      args: [{ kind: 'param-ref', paramName: 'x' }],
      guardPath: [],
      position: { line: 6, column: 7 },
    }),
  ],
});

const TOOBIG_SCOPE = ScopeRecordStub({
  scopePath: ['*module*', 'tooBig'],
  name: 'tooBig',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  returnType: { kind: 'boolean' },
  startLine: 1,
  endLine: 3,
  predicateSignature: {
    kind: 'leaf',
    id: '*module*/tooBig/predicate#leaf',
    operandParamName: 'n',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 50 },
  },
});

describe('composePredicatesTransformer', () => {
  describe('a caller guarded by a same-file predicate it passes its own param into', () => {
    it('VALID: {if (tooBig(x)), tooBig returns n > 50} => the truthy leaf becomes x > 50, id and span preserved', () => {
      const result = composePredicatesTransformer({
        functions: [CLASSIFY_FN],
        walked: WalkFileResultStub({ scopes: [CLASSIFY_SCOPE, TOOBIG_SCOPE] }),
      });

      expect(result).toStrictEqual([
        {
          entry: CLASSIFY_ENTRY,
          exits: [CLASSIFY_EXIT],
          branches: [
            {
              coverageId: '*module*/classify/if:CallExpression,id:tooBig,id:x',
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf',
                operandParamName: 'x',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 50 },
              },
              startLine: 6,
              endLine: 8,
            },
          ],
        },
      ]);
    });
  });

  describe('silent no-ops — every unmet precondition leaves the branch as the walk read it', () => {
    it('ERROR: {walk did not parse} => the functions are returned unchanged', () => {
      const result = composePredicatesTransformer({
        functions: [CLASSIFY_FN],
        walked: WalkFileResultStub({ success: false, error: { line: 1, column: 1, message: 'Unexpected token' } }),
      });

      expect(result).toStrictEqual([CLASSIFY_FN]);
    });

    it('VALID: {callee is an imported predicate} => the leaf stays opaque, since composing needs a local body', () => {
      const importCaller = ScopeRecordStub({
        scopePath: ['*module*', 'classify'],
        name: 'classify',
        params: [{ name: 'x', type: { kind: 'number' } }],
        returnType: { kind: 'string' },
        startLine: 5,
        endLine: 11,
        calls: [
          CallSiteStub({
            callee: { target: 'import', specifier: './too-big', importedName: 'tooBig' },
            args: [{ kind: 'param-ref', paramName: 'x' }],
            guardPath: [],
            position: { line: 6, column: 7 },
          }),
        ],
      });

      const result = composePredicatesTransformer({
        functions: [CLASSIFY_FN],
        walked: WalkFileResultStub({ scopes: [importCaller] }),
      });

      expect(result).toStrictEqual([CLASSIFY_FN]);
    });

    it('VALID: {callee published no predicate signature} => the leaf stays opaque, since there is nothing to compose', () => {
      const plainCallee = ScopeRecordStub({
        scopePath: ['*module*', 'tooBig'],
        name: 'tooBig',
        exported: false,
        access: { kind: 'unreachable' },
        params: [{ name: 'n', type: { kind: 'number' } }],
        returnType: { kind: 'boolean' },
        startLine: 1,
        endLine: 3,
      });

      const result = composePredicatesTransformer({
        functions: [CLASSIFY_FN],
        walked: WalkFileResultStub({ scopes: [CLASSIFY_SCOPE, plainCallee] }),
      });

      expect(result).toStrictEqual([CLASSIFY_FN]);
    });

    it('VALID: {branch is already a real comparison} => it is left untouched, since only a truthy call-leaf composes', () => {
      const plainFn = ExtractedFunctionStub();

      const result = composePredicatesTransformer({ functions: [plainFn], walked: WalkFileResultStub({ scopes: [] }) });

      expect(result).toStrictEqual([plainFn]);
    });
  });
});
