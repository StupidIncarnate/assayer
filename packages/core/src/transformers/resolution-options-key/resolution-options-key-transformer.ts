/**
 * PURPOSE: Serializes the options that decide where an import specifier lands (`analysisOptionsStatics.resolution`)
 *   into one deterministic string, with every absolute path under the source root written relative to that root.
 *   Reach for this when a derived index keys on how imports resolve: the same configs give the same key on every
 *   machine, wherever the repo is checked out. An option outside the resolution list never reaches the key.
 *
 * USAGE:
 * resolutionOptionsKeyTransformer({ options: { baseUrl: '/repo/src', outDir: '/repo/dist' }, root: '/repo' });
 * // Returns '[["baseUrl","src"]]'
 */
import { relative } from '#gateway/node/path';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { analysisOptionsStatics } from '../../statics/analysis-options/analysis-options-statics';

export const resolutionOptionsKeyTransformer = ({
  options,
  root,
}: {
  options: CompilerOptions;
  root: string;
}): string =>
  // Sorted by name, the same order compilerOptionsKeyTransformer writes, so both keys read alike.
  JSON.stringify(
    [...analysisOptionsStatics.resolution]
      .sort()
      .flatMap((name): [string, unknown][] => {
        const value: unknown = options[name];

        if (value === undefined) {
          return [];
        }

        // A path option is a string or a list of strings. Only a value under the root is rewritten, so a path
        // outside the repo (a global typeRoot) keeps its spelling.
        const items: unknown[] = Array.isArray(value) ? value : [value];
        const rewritten = items.map((item) =>
          typeof item === 'string' && (item === root || item.startsWith(`${root}/`)) ? relative(root, item) : item,
        );

        return [[name, Array.isArray(value) ? rewritten : rewritten[0]]];
      }),
  );
