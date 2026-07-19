/**
 * PURPOSE: Classifies ONE module specifier to its canonical definition — the recursive heart of the
 *   stitch. A `node:`/known-builtin name is a builtin; anything the TypeScript resolver finds inside
 *   the repo (and not under node_modules) is local, keyed by its repo-relative path; anything it finds
 *   in node_modules is a package; anything it cannot find is unresolved (a build error upstream).
 *
 *   Re-export barrels are FOLLOWED to the real definition: when a resolved local file forwards the
 *   name being chased (`export { name } from './x'` or `export * from './x'`), it recurses on that
 *   forward with a seen-set so a barrel cycle terminates (recursion, never `while(true)`). The name
 *   chased is the SOURCE name, so `export { foo as bar }` followed by an import of `bar` continues on
 *   `foo`. Namespace/star/side-effect imports name no single export, so they never follow.
 *
 * USAGE:
 * resolveSpecifierLayerBroker({ containingFile, specifier: '../b/foo', importedName: 'foo', root,
 *   options, blobsByRelPath, builtins, seen: new Set() });
 * // Returns { kind: 'local', relPath } | { kind: 'package', packageName } | { kind: 'builtin', packageName } | { kind: 'unresolved' }
 */
import { packageNameContract, relPathContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob, PackageName, RelPath } from '@assayer/shared/contracts';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { typescriptResolveModuleAdapter } from '../../../adapters/typescript/resolve-module/typescript-resolve-module-adapter';

type ResolveOptions = Parameters<typeof typescriptResolveModuleAdapter>[0]['options'];

export const resolveSpecifierLayerBroker = ({
  containingFile,
  specifier,
  importedName,
  root,
  options,
  blobsByRelPath,
  builtins,
  seen,
}: {
  containingFile: string;
  specifier: string;
  importedName?: string;
  root: string;
  options: ResolveOptions;
  blobsByRelPath: ReadonlyMap<string, CompiledFileBlob>;
  builtins: ReadonlySet<string>;
  seen: ReadonlySet<string>;
}):
  | { kind: 'local'; relPath: RelPath }
  | { kind: 'package'; packageName: PackageName; dtsPath: FilePath }
  | { kind: 'builtin'; packageName: PackageName }
  | { kind: 'unresolved' } => {
  const bareBuiltin = specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;

  if (specifier.startsWith('node:') || builtins.has(bareBuiltin)) {
    return { kind: 'builtin', packageName: packageNameContract.parse(bareBuiltin) };
  }

  const resolved = typescriptResolveModuleAdapter({ specifier, containingFile, options });

  if (!resolved.resolved) {
    return { kind: 'unresolved' };
  }

  const fileName = String(resolved.fileName);
  const rel = String(pathRelativeAdapter({ from: root, to: fileName }));
  const outsideRoot = rel.startsWith('..');
  const inNodeModules = fileName.includes('/node_modules/');

  if (outsideRoot || inNodeModules) {
    const parts = specifier.split('/');
    const packageName = specifier.startsWith('@') ? `${String(parts[0])}/${String(parts[1])}` : String(parts[0]);

    // The resolved `.d.ts` path rides ALONG the classification so the stitch can read the declared
    // signature; it is absolute and machine-specific, so it never enters the persisted edge.
    return { kind: 'package', packageName: packageNameContract.parse(packageName), dtsPath: filePathContract.parse(fileName) };
  }

  const relPath = relPathContract.parse(rel);
  const blob = blobsByRelPath.get(rel);

  if (importedName === undefined || seen.has(rel) || blob === undefined) {
    return { kind: 'local', relPath };
  }

  const [namedForward] = blob.moduleGraph.edges.flatMap((edge) =>
    edge.kind === 'reexport'
      ? edge.bindings.flatMap((binding) =>
          binding.kind === 'named' && String(binding.alias ?? binding.name) === importedName
            ? [{ specifier: String(edge.specifier), sourceName: String(binding.name) }]
            : [],
        )
      : [],
  );

  if (namedForward !== undefined) {
    return resolveSpecifierLayerBroker({
      containingFile: `${root}/${rel}`,
      specifier: namedForward.specifier,
      importedName: namedForward.sourceName,
      root,
      options,
      blobsByRelPath,
      builtins,
      seen: new Set([...seen, rel]),
    });
  }

  const starForward = blob.moduleGraph.edges.find(
    (edge) => edge.kind === 'reexport' && edge.bindings.some((binding) => binding.kind === 'star'),
  );

  if (starForward !== undefined) {
    return resolveSpecifierLayerBroker({
      containingFile: `${root}/${rel}`,
      specifier: String(starForward.specifier),
      importedName,
      root,
      options,
      blobsByRelPath,
      builtins,
      seen: new Set([...seen, rel]),
    });
  }

  return { kind: 'local', relPath };
};
