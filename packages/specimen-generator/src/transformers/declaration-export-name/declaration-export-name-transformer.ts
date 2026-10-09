/**
 * PURPOSE: The one name a declaration file must export, worked out from the file's own name. Reach for
 * this when a loader checks a declaration's export or a message tells an author what to rename it to.
 *
 * USAGE:
 * declarationExportNameTransformer({ fileName: 'array-at.shim.ts', kind: 'shim' });
 * // Returns 'arrayAtShim'
 */
import { generatorLayoutStatics } from '../../statics/generator-layout/generator-layout-statics';

export const declarationExportNameTransformer = ({
  fileName,
  kind,
}: {
  fileName: string;
  kind: 'container' | 'shim' | 'syntax';
}): string => {
  const suffixes = {
    container: generatorLayoutStatics.declarations.containers.suffix,
    shim: generatorLayoutStatics.declarations.shims.suffix,
    syntax: generatorLayoutStatics.declarations.syntax.suffix,
  };
  const baseName = fileName.slice(fileName.lastIndexOf('/') + 1).replace(suffixes[kind], '');
  const camelCase = baseName
    .split('-')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');

  return camelCase + kind.charAt(0).toUpperCase() + kind.slice(1);
};
