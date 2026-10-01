/**
 * PURPOSE: Serializes a compiler-options set into one deterministic string: the option entries sorted by name, as
 *   JSON. Two spellings of one set give one string, and two different sets never do. Reach for this wherever an
 *   option set keys something: the hermetic transformer keys its in-memory projects on it, and the per-file cache
 *   key takes it as its options ingredient. The values are TypeScript's own parsed forms (enum numbers, library
 *   file names such as `lib.es2022.d.ts`), which ts-morph's TypeScript version fixes.
 *
 * USAGE:
 * compilerOptionsKeyTransformer({ options: { strictNullChecks: true, target: 9 } });
 * // Returns '[["strictNullChecks",true],["target",9]]'
 */
import type { CompilerOptions } from '#gateway/npm/typescript';

export const compilerOptionsKeyTransformer = ({ options }: { options: CompilerOptions }): string =>
  JSON.stringify(
    Object.keys(options)
      .sort()
      .map((name) => [name, options[name]]),
  );
