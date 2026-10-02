/**
 * PURPOSE: The compiler options a ts-morph project built from the CONSUMER's tsconfig falls back to
 *   when that tsconfig leaves them unset — passed as ts-morph's `defaultCompilerOptions`, which the
 *   tsconfig overrides. Reach for this wherever a project is rooted at the consumer's tsconfig to read
 *   its dependency types, never for the hermetic walk project, whose missing ambient types are the point.
 *
 *   `types: ['*']` loads every `@types` package under the tsconfig's type roots. TypeScript 5 did that
 *   for a tsconfig naming no `types`; TypeScript 6 loads none. The bundled compiler is 6 while the
 *   consumer may still build with 5, so without this default `process.cwd` and `node:path` read as
 *   untyped for every consumer that never needed a `types` list.
 *
 * USAGE:
 * new Project({ tsConfigFilePath, defaultCompilerOptions: { types: [...consumerProjectStatics.defaultCompilerOptions.types] } });
 * // A tsconfig naming no `types` reads every `@types` package; one naming `types` keeps its own list
 */
export const consumerProjectStatics = {
  defaultCompilerOptions: {
    types: ['*'],
  },
} as const;
