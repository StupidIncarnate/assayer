import ts from '#gateway/npm/typescript';

import { provenanceStatics } from '../../statics/provenance/provenance-statics';
import { offeredProvenancesTransformer } from './offered-provenances-transformer';

const PROVENANCES = Object.keys(provenanceStatics) as (keyof typeof provenanceStatics)[];

describe('offeredProvenancesTransformer', () => {
  describe('provenances every slot offers', () => {
    it.each(PROVENANCES.filter((name) => provenanceStatics[name].offered === 'always'))(
      'VALID: {enabled: [%s], slot: no $params, reach: call} => offers it',
      (name) => {
        const result = offeredProvenancesTransformer({
          slot: {
            name: 'body',
            kind: 'statement',
            reach: 'call',
            arm: 'return',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: false,
          },
          enabled: [name],
          holeType: 'number',
        });

        expect(result).toStrictEqual([name]);
      },
    );
  });

  describe('provenances that need $params', () => {
    it.each(PROVENANCES.filter((name) => provenanceStatics[name].offered === 'params'))(
      'VALID: {enabled: [%s], slot: hasParams} => offers it',
      (name) => {
        const result = offeredProvenancesTransformer({
          slot: {
            name: 'body',
            kind: 'statement',
            reach: 'call',
            arm: 'return',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: true,
          },
          enabled: [name],
          holeType: 'number',
        });

        expect(result).toStrictEqual([name]);
      },
    );

    it.each(PROVENANCES.filter((name) => provenanceStatics[name].offered === 'params'))(
      'EMPTY: {enabled: [%s], slot: no $params} => offers nothing',
      (name) => {
        const result = offeredProvenancesTransformer({
          slot: {
            name: 'body',
            kind: 'statement',
            reach: 'call',
            arm: 'return',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: false,
          },
          enabled: [name],
          holeType: 'number',
        });

        expect(result).toStrictEqual([]);
      },
    );
  });

  describe('provenances that need module-load reach', () => {
    it.each(PROVENANCES.filter((name) => provenanceStatics[name].offered === 'module-load'))(
      'VALID: {enabled: [%s], slot: reach module-load} => offers it',
      (name) => {
        const result = offeredProvenancesTransformer({
          slot: {
            name: 'statement',
            kind: 'statement',
            reach: 'module-load',
            arm: 'log',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: false,
          },
          enabled: [name],
          holeType: 'number',
        });

        expect(result).toStrictEqual([name]);
      },
    );

    it.each(PROVENANCES.filter((name) => provenanceStatics[name].offered === 'module-load'))(
      'EMPTY: {enabled: [%s], slot: reach call} => offers nothing',
      (name) => {
        const result = offeredProvenancesTransformer({
          slot: {
            name: 'body',
            kind: 'statement',
            reach: 'call',
            arm: 'return',
            marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
            hasParams: false,
          },
          enabled: [name],
          holeType: 'number',
        });

        expect(result).toStrictEqual([]);
      },
    );
  });

  describe('order and selection', () => {
    it('VALID: {enabled: [literal, param, env], slot: hasParams, reach call} => keeps the enabled order and drops env', () => {
      const result = offeredProvenancesTransformer({
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        enabled: ['literal', 'param', 'env'],
        holeType: 'number',
      });

      expect(result).toStrictEqual(['literal', 'param']);
    });

    it('EMPTY: {enabled: []} => offers nothing', () => {
      const result = offeredProvenancesTransformer({
        slot: {
          name: 'body',
          kind: 'statement',
          reach: 'call',
          arm: 'return',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        enabled: [],
        holeType: 'number',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('array-typed holes', () => {
    it('VALID: {enabled: [param, env, literal, external], holeType: readonly number[], slot: module-load with $params} => drops env only', () => {
      const result = offeredProvenancesTransformer({
        slot: {
          name: 'statement',
          kind: 'statement',
          reach: 'module-load',
          arm: 'log',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        enabled: ['param', 'env', 'literal', 'external'],
        holeType: 'readonly number[]',
      });

      expect(result).toStrictEqual(['param', 'literal', 'external']);
    });

    it('VALID: {enabled: [param, env, literal, external], holeType: number, slot: module-load with $params} => keeps env', () => {
      const result = offeredProvenancesTransformer({
        slot: {
          name: 'statement',
          kind: 'statement',
          reach: 'module-load',
          arm: 'log',
          marker: ts.factory.createCallExpression(ts.factory.createIdentifier('$stmts'), undefined, []),
          hasParams: true,
        },
        enabled: ['param', 'env', 'literal', 'external'],
        holeType: 'number',
      });

      expect(result).toStrictEqual(['param', 'env', 'literal', 'external']);
    });
  });
});
