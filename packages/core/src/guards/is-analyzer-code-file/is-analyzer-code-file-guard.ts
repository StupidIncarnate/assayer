/**
 * PURPOSE: Decides whether one file under an analyzer root is code that runs, and so counts toward the
 *   analyzer hash. In a `dist` root that is emitted JavaScript only. In a `source` root it is an
 *   implementation file: a TypeScript source file `isSourceFileIncludedGuard` accepts that is not a
 *   proxy, a stub, a harness or a declaration file, and does not sit in a test scratch folder.
 *
 *   Reach for this over `isSourceFileIncludedGuard` when the question is what Assayer itself runs,
 *   not what a consumer's repo offers for analysis.
 *
 * USAGE:
 * isAnalyzerCodeFileGuard({ relPath: 'brokers/a/b/a-b-broker.proxy.ts', tree: 'source' });
 * // Returns false -- a proxy only runs inside a test
 */
import type { CoreRuntime } from '../../contracts/core-runtime/core-runtime-contract';
import { analyzerHashStatics } from '../../statics/analyzer-hash/analyzer-hash-statics';
import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';
import { isSourceFileIncludedGuard } from '../is-source-file-included/is-source-file-included-guard';

export const isAnalyzerCodeFileGuard = ({
  relPath,
  tree,
}: {
  relPath?: string;
  tree?: CoreRuntime['tree'];
}): boolean => {
  if (!relPath || !tree) {
    return false;
  }

  const segments = relPath.split('/');
  if (segments.some((segment) => segment === 'node_modules')) {
    return false;
  }

  if (tree === 'dist') {
    return relPath.endsWith(analyzerHashStatics.dist.codeExtension);
  }

  const { testSupportInfixes, declarationSuffix, scratchFolders } = analyzerHashStatics.source;
  const scratch: readonly string[] = scratchFolders;

  return (
    isSourceFileIncludedGuard({ relPath }) &&
    !testSupportInfixes.some((infix) => relPath.includes(infix)) &&
    !relPath.endsWith(harnessModuleStatics.fileSuffix) &&
    !relPath.endsWith(declarationSuffix) &&
    !segments.some((segment) => scratch.includes(segment))
  );
};
