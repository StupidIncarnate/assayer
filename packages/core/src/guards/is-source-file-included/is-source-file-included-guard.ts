/**
 * PURPOSE: Determines whether a repo-relative file path is a TypeScript source file that
 *   Assayer should analyze -- excluding node_modules, test-named files, and any path matching
 *   a caller-supplied exclude glob.
 *
 * USAGE:
 * isSourceFileIncludedGuard({ relPath: 'packages/web/src/app.tsx', exclude: ['**' + '/generated/' + '**'] });
 * // Returns true -- a .tsx file outside node_modules, not test-named, not excluded
 *
 * isSourceFileIncludedGuard({ relPath: 'packages/web/src/app.test.ts' });
 * // Returns false -- test-named files are never included
 */

import { globToRegexTransformer } from '../../transformers/glob-to-regex/glob-to-regex-transformer';

export const isSourceFileIncludedGuard = ({
  relPath,
  exclude,
}: {
  relPath?: string;
  exclude?: readonly string[];
}): boolean => {
  if (!relPath) {
    return false;
  }

  if (!relPath.endsWith('.ts') && !relPath.endsWith('.tsx')) {
    return false;
  }

  if (relPath.includes('node_modules/')) {
    return false;
  }

  if (/\.(test|spec|e2e)\./u.test(relPath) || relPath.includes('__tests__')) {
    return false;
  }

  const patterns = exclude ?? [];
  const isExcluded = patterns.some((pattern) => globToRegexTransformer({ glob: pattern }).test(relPath));

  return !isExcluded;
};
