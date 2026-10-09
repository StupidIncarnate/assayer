/**
 * PURPOSE: The compiler options a generated specimen is checked under. They are plain strings and
 * booleans, so a broker converts them to the compiler's own enums when it builds the program.
 *
 * USAGE:
 * specimenTypecheckStatics.compilerOptions.target;
 * // Returns 'ES2022'
 */
export const specimenTypecheckStatics = {
  compilerOptions: {
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    target: 'ES2022',
    module: 'commonjs',
    lib: ['lib.es2022.d.ts'],
    types: ['node'],
    noEmit: true,
  },
} as const;
