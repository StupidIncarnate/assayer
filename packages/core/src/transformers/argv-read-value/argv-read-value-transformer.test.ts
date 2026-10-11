import { ArgvReadStub } from '@assayer/shared/contracts/argv-read/argv-read.stub';
import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { argvReadValueTransformer } from './argv-read-value-transformer';

describe('argvReadValueTransformer', () => {
  describe('the read itself', () => {
    it('VALID: {process.argv[2]} => [undefined], since the worker has no argument at index 2', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub() })).toStrictEqual([undefined]);
    });

    it('VALID: {process.argv.slice(2)} => [[]], since nothing follows the worker entry', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ shape: 'tail' }) })).toStrictEqual([[]]);
    });

    it('EMPTY: {process.argv[1]} => [], since that entry is a path Assayer does not predict', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ index: 1 }) })).toStrictEqual([]);
    });

    it('EMPTY: {process.argv.slice(0)} => [], since it holds the paths too', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ shape: 'tail', index: 0 }) })).toStrictEqual([]);
    });
  });

  describe('steps run forward', () => {
    it('VALID: {Number(process.argv[2])} => [NaN]', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'number' })] }) })).toStrictEqual([NaN]);
    });

    it("VALID: {process.argv[2] === 'yes'} => [false]", () => {
      expect(
        argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'equals', literal: 'yes', negated: false })] }) }),
      ).toStrictEqual([false]);
    });

    it("VALID: {process.argv[2] !== 'yes'} => [true]", () => {
      expect(
        argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'equals', literal: 'yes', negated: true })] }) }),
      ).toStrictEqual([true]);
    });

    it("VALID: {process.argv[2] ?? 'x'} => ['x'], since the fallback replaces the absent entry", () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'default', value: 'x' })] }) })).toStrictEqual([
        'x',
      ]);
    });

    it('VALID: {guard, number} => [undefined], since the guarded step does not run', () => {
      expect(
        argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })] }) }),
      ).toStrictEqual([undefined]);
    });

    it('VALID: {guard, equals 7} => [undefined], since the guarded comparison does not run', () => {
      expect(
        argvReadValueTransformer({
          read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'equals', literal: 7, negated: false })] }),
        }),
      ).toStrictEqual([undefined]);
    });

    it('VALID: {guard, number, default 0} => [0], since the fallback replaces the guarded undefined', () => {
      expect(
        argvReadValueTransformer({
          read: ArgvReadStub({
            steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'default', value: 0 })],
          }),
        }),
      ).toStrictEqual([0]);
    });

    it("VALID: {(process.argv[2] ?? 'a,b').split(',')} => [['a', 'b']]", () => {
      expect(
        argvReadValueTransformer({
          read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'default', value: 'a,b' }), EnvStepStub({ kind: 'split', separator: ',' })] }),
        }),
      ).toStrictEqual([['a', 'b']]);
    });

    it("EMPTY: {process.argv[2].split(',')} => [], since splitting an absent entry throws", () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ steps: [EnvStepStub({ kind: 'split', separator: ',' })] }) })).toStrictEqual(
        [],
      );
    });

    it('VALID: {process.argv.slice(2).map(Number)} => [[]], since mapping an empty list keeps it empty', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ shape: 'tail', steps: [EnvStepStub({ kind: 'map' })] }) })).toStrictEqual([
        [],
      ]);
    });

    it("EMPTY: {(process.argv[2] ?? 'a').split(',').map(f)} => [], since the callback does not run here", () => {
      expect(
        argvReadValueTransformer({
          read: ArgvReadStub({
            steps: [
              EnvStepStub({ kind: 'default', value: 'a' }),
              EnvStepStub({ kind: 'split', separator: ',' }),
              EnvStepStub({ kind: 'map' }),
            ],
          }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {process.argv[1] with a number step} => [], and later steps keep it not known', () => {
      expect(argvReadValueTransformer({ read: ArgvReadStub({ index: 1, steps: [EnvStepStub({ kind: 'number' })] }) })).toStrictEqual([]);
    });
  });
});
