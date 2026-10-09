import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';

import { undrivenInstanceLayerTransformer } from './undriven-instance-layer-transformer';

const FIND = FunctionAnalysisStub({
  entry: {
    name: 'find',
    scopePath: ['Repo', 'find'],
    params: [{ name: 'id', type: { kind: 'number' } }],
    returnType: { kind: 'string' },
    line: 8,
    access: { kind: 'method', className: 'Repo', constructable: false },
  },
  exits: [
    { coverageId: 'Repo/find/return@if-then', kind: 'return', guardPath: [], line: 10 },
    { coverageId: 'Repo/find/return@top', kind: 'return', guardPath: [], line: 13 },
  ],
});

const STATIC_FIX =
  'make `find` a static method, or a plain function that takes what it needs as parameters, since neither needs an instance';

describe('undrivenInstanceLayerTransformer', () => {
  describe('a constructor argument Assayer cannot build', () => {
    it('VALID: {one refused parameter} => names it, says a harness cannot supply it yet, and offers the fixes that work now', () => {
      const result = undrivenInstanceLayerTransformer({ fn: FIND, className: 'Repo', refused: [{ param: 'url', type: 'Url' }] });

      expect(result).toStrictEqual({
        name: 'find',
        reason:
          '`find` is not driven: its class `Repo` needs a constructor argument Assayer cannot build, `url: Url`, so there is no ' +
          'instance to call `find` on. Assayer builds each constructor argument from its declared type, the way it builds a ' +
          "function's inputs: a scalar, a union, an array, or an object shape whose every property is one of those. A harness " +
          'cannot supply it yet. A harness key under `constructor` gives the constructor\'s own test its inputs, and Assayer does ' +
          'not use those to build the instance `find` runs on. To test `find` now, declare that parameter with a type Assayer ' +
          `can build, or ${STATIC_FIX}.`,
        startLine: 8,
        endLine: 13,
      });
    });

    it('VALID: {two refused parameters} => names both, in order, and speaks in the plural', () => {
      const result = undrivenInstanceLayerTransformer({
        fn: FIND,
        className: 'Repo',
        refused: [
          { param: 'url', type: 'Url' },
          { param: 'log', type: '(m: string) => void' },
        ],
      });

      expect(result.reason).toBe(
        '`find` is not driven: its class `Repo` needs constructor arguments Assayer cannot build, `url: Url`, ' +
          '`log: (m: string) => void`, so there is no instance to call `find` on. Assayer builds each constructor argument ' +
          "from its declared type, the way it builds a function's inputs: a scalar, a union, an array, or an object shape " +
          'whose every property is one of those. A harness cannot supply them yet. A harness key under `constructor` gives ' +
          "the constructor's own test its inputs, and Assayer does not use those to build the instance `find` runs on. To test " +
          '`find` now, declare those parameters with a type Assayer can build, or ' +
          `${STATIC_FIX}.`,
      );
    });
  });

  describe('a constructor Assayer has no analysis of', () => {
    it('EMPTY: {refused omitted} => says so, and offers only the fix that needs no constructor', () => {
      const result = undrivenInstanceLayerTransformer({ fn: FIND, className: 'Repo' });

      expect(result.reason).toBe(
        "`find` is not driven: its class `Repo` needs constructor arguments, and Assayer has no analysis of that constructor's " +
          'parameters, so it cannot build an instance to call `find` on. To test `find` now, ' +
          `${STATIC_FIX}.`,
      );
    });

    it('EMPTY: {refused is an empty list} => the same no-analysis text', () => {
      const result = undrivenInstanceLayerTransformer({ fn: FIND, className: 'Repo', refused: [] });

      expect(result.reason).toBe(
        "`find` is not driven: its class `Repo` needs constructor arguments, and Assayer has no analysis of that constructor's " +
          'parameters, so it cannot build an instance to call `find` on. To test `find` now, ' +
          `${STATIC_FIX}.`,
      );
    });
  });

  describe('the span', () => {
    it('EDGE: {a method with no exits} => spans its own declaration line', () => {
      const result = undrivenInstanceLayerTransformer({
        fn: FunctionAnalysisStub({
          entry: {
            name: 'find',
            scopePath: ['Repo', 'find'],
            params: [],
            returnType: { kind: 'string' },
            line: 8,
            access: { kind: 'method', className: 'Repo', constructable: false },
          },
          exits: [],
        }),
        className: 'Repo',
        refused: [{ param: 'url', type: 'Url' }],
      });

      expect({ startLine: result.startLine, endLine: result.endLine }).toStrictEqual({ startLine: 8, endLine: 8 });
    });
  });
});
