import { specimenTypecheckStatics } from './specimen-typecheck-statics';

describe('specimenTypecheckStatics', () => {
  describe('compilerOptions', () => {
    it('VALID: {statics} => holds the options generated specimens are checked under', () => {
      expect(specimenTypecheckStatics).toStrictEqual({
        compilerOptions: {
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noImplicitReturns: true,
          target: 'ES2022',
          module: 'commonjs',
          lib: ['es2022'],
          types: ['node'],
          noEmit: true,
        },
      });
    });
  });
});
