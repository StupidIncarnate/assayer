/**
 * PURPOSE: The stitch — turns finished per-file records into resolved cross-file edges without
 *   re-parsing. It loads every already-compiled blob back from the content-keyed blob store, reads the
 *   repo's tsconfig once, and resolves each import's specifier against the importing file's absolute
 *   path exactly once, canonicalizing to a repo-relative definition key BEFORE storing (spelling and
 *   alias variants collapse to one key). Re-export barrels are followed to the definition site.
 *
 *   A `local` edge additionally carries the TARGET file's exported entry signature (its declared
 *   input/output types), looked up by the resolved (relPath, importedName) in the already-loaded
 *   blobs' analysis — so a cross-file import shows its contract in the same currency as a
 *   package/builtin one, no external reader needed.
 *
 *   Every import is classified local / package / builtin, or it is UNRESOLVED — a hard build error
 *   (`relPath:line:column cannot resolve import '<specifier>'`), the same class as a parse failure. A
 *   dynamic `import()` whose specifier is not a literal (a `dynamic` edge) is its own hard error at the
 *   import site — the analyzer cannot drive a runtime-chosen module, so the reader writes a static one.
 *   A
 *   package/builtin import's declared signature is pulled from its `.d.ts` (cached hash-checked) and
 *   attached to the edge — the typed black box — while a CALLED import that ships no usable types is a
 *   hard error of its own (`no usable types for '<name>'`). External type reading only runs when a
 *   `cacheDir` and a tsconfig are supplied; otherwise resolution classifies without pulling types. The
 *   returned index is keyed on `layoutHash` + `tsconfigHash`, so it rebuilds when either changes.
 *
 * USAGE:
 * await compileResolveGraphBroker({ root: '/repo', blobsDir: '/repo/.assayer/cache/blobs',
 *   cacheDir: '/repo/.assayer/cache', files: [{ relPath: 'src/a.ts', contentHash }] });
 * // Returns { index: ResolvedIndex, errors: [{ relPath, line, column, message }] }
 */
import {
  columnNumberContract,
  compiledFileBlobContract,
  lineNumberContract,
  moduleSpecifierContract,
  relPathContract,
  resolvedEdgeContract,
  resolvedIndexContract,
  symbolNameContract,
} from '@assayer/shared/contracts';
import type { ColumnNumber, ContentHash, LineNumber, RelPath, ResolvedIndex } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { nodeModuleBuiltinsAdapter } from '../../../adapters/node-module/builtins/node-module-builtins-adapter';
import { typescriptReadConfigAdapter } from '../../../adapters/typescript/read-config/typescript-read-config-adapter';
import { externalSignatureReadBroker } from '../../external-signature/read/external-signature-read-broker';
import { externalSignatureReadGlobalBroker } from '../../external-signature/read-global/external-signature-read-global-broker';
import { resolveSpecifierLayerBroker } from './resolve-specifier-layer-broker';

export const compileResolveGraphBroker = async ({
  root,
  blobsDir,
  cacheDir,
  files,
}: {
  root: string;
  blobsDir: string;
  cacheDir?: string;
  files: readonly { relPath: RelPath; contentHash: ContentHash }[];
}): Promise<{
  index: ResolvedIndex;
  errors: { relPath: RelPath; line: LineNumber; column: ColumnNumber; message: ErrorMessage }[];
}> => {
  const { options, tsconfigHash, configFilePath } = typescriptReadConfigAdapter({ searchPath: root });
  const builtins = new Set(nodeModuleBuiltinsAdapter().map(String));

  const blobs = await Promise.all(
    files.map(async (file) => {
      const raw = await fsReadFileAdapter({ path: `${blobsDir}/${String(file.contentHash)}.json` });
      return compiledFileBlobContract.parse(JSON.parse(String(raw)));
    }),
  );

  const blobsByRelPath = new Map(blobs.map((blob) => [String(blob.relPath), blob]));

  const sortedFiles = [...files]
    .map((file) => ({ relPath: String(file.relPath), contentHash: String(file.contentHash) }))
    .sort((a, b) => (a.relPath < b.relPath ? -1 : 1));
  const layoutHash = cryptoSha256Adapter({ content: JSON.stringify(sortedFiles) });

  // One resolution unit per imported name: named/default bindings chase a specific export through
  // barrels; namespace/star/side-effect imports name no single export, so they carry no importedName.
  // A `dynamic` edge names no literal module — it is handled separately as a hard error, never a unit.
  const units = blobs.flatMap((blob) =>
    blob.moduleGraph.edges.flatMap((edge) => {
      if (edge.kind === 'dynamic') {
        return [];
      }

      const names =
        edge.bindings.length === 0
          ? [undefined]
          : edge.bindings.flatMap((binding) =>
              binding.kind === 'named'
                ? [String(binding.name)]
                : binding.kind === 'default'
                  ? ['default']
                  : [undefined],
            );

      return names.map((importedName) => ({ blob, edge, importedName }));
    }),
  );

  const classified = units.map((unit) => ({
    ...unit,
    classification: resolveSpecifierLayerBroker({
      containingFile: `${root}/${String(unit.blob.relPath)}`,
      specifier: String(unit.edge.specifier),
      ...(unit.importedName === undefined ? {} : { importedName: unit.importedName }),
      root,
      options,
      blobsByRelPath,
      builtins,
      seen: new Set(),
    }),
  }));

  // Pull each external callable's declared signature (typed black box), cached by `.d.ts` content
  // hash. Only runs with a cache dir and a tsconfig to root the node_modules-aware project at. The
  // SAME export imported by several files names one cache entry, so the reads are deduped by cache
  // identity and each distinct callable is read exactly once — never once per importer. Reading
  // duplicates concurrently would re-derive the identical payload AND race on that entry's shared
  // atomic-write tmp path (one writer renames it away before the other's rename, an ENOENT crash).
  const packageTargets = classified.flatMap((item) =>
    cacheDir !== undefined && configFilePath !== undefined && item.classification.kind === 'package' && item.importedName !== undefined
      ? [
          {
            key: `${String(item.classification.dtsPath)} ${item.importedName}`,
            dtsPath: item.classification.dtsPath,
            exportName: symbolNameContract.parse(item.importedName),
          },
        ]
      : [],
  );

  const builtinTargets = classified.flatMap((item) =>
    cacheDir !== undefined &&
    configFilePath !== undefined &&
    item.classification.kind === 'builtin' &&
    item.importedName !== undefined &&
    item.edge.specifier !== undefined
      ? [
          {
            // A builtin binding is CALLED when a reference records the call; otherwise it is bound as a
            // VALUE. The read differs (a signature vs a member type), so `called` keys the read too.
            called: item.blob.moduleGraph.references.some(
              (reference) =>
                String(reference.specifier) === String(item.edge.specifier) && String(reference.importedName) === item.importedName,
            ),
            key: `${String(item.edge.specifier)} ${item.importedName} ${String(
              item.blob.moduleGraph.references.some(
                (reference) =>
                  String(reference.specifier) === String(item.edge.specifier) && String(reference.importedName) === item.importedName,
              ),
            )}`,
            specifier: moduleSpecifierContract.parse(String(item.edge.specifier)),
            importedName: symbolNameContract.parse(item.importedName),
          },
        ]
      : [],
  );

  // One read PROMISE per distinct callable — the broker (and its atomic write) is kicked off exactly
  // once per key, so every importer awaits the same in-flight read rather than starting its own.
  const packageReadByKey = new Map(
    [...new Map(packageTargets.map((target) => [target.key, target] as const)).values()].map((target) => {
      const pending =
        cacheDir === undefined || configFilePath === undefined
          ? Promise.resolve({ usable: false as const })
          : externalSignatureReadBroker({
              tsConfigFilePath: configFilePath,
              dtsPath: target.dtsPath,
              exportName: target.exportName,
              cacheDir,
            });

      return [target.key, pending] as const;
    }),
  );

  const builtinReadByKey = new Map(
    [...new Map(builtinTargets.map((target) => [target.key, target] as const)).values()].map((target) => {
      // A CALLED node builtin now pulls its declared signature from `@types/node` through the second
      // project — read as an ambient module import (`node:path`), since a builtin resolves only in the
      // checker, never via a `.d.ts` path. Without `@types/node` it ships no usable types (a call is a
      // build error below), exactly as a package with no `.d.ts` does.
      const pending =
        cacheDir === undefined || configFilePath === undefined
          ? Promise.resolve({ usable: false as const })
          : externalSignatureReadGlobalBroker({
              tsConfigFilePath: configFilePath,
              reference: { kind: 'builtin', specifier: target.specifier, importedName: target.importedName, called: target.called },
              cacheDir,
            });

      return [target.key, pending] as const;
    }),
  );

  const typed = await Promise.all(
    classified.map(async (item) => {
      if (cacheDir !== undefined && configFilePath !== undefined && item.classification.kind === 'package' && item.importedName !== undefined) {
        const read = await packageReadByKey.get(`${String(item.classification.dtsPath)} ${item.importedName}`);

        return { ...item, signature: read?.usable ? read.signature : undefined, typeDescriptor: undefined, usableExternal: read?.usable ?? false };
      }

      if (
        cacheDir !== undefined &&
        configFilePath !== undefined &&
        item.classification.kind === 'builtin' &&
        item.importedName !== undefined &&
        item.edge.specifier !== undefined
      ) {
        const called = item.blob.moduleGraph.references.some(
          (reference) =>
            String(reference.specifier) === String(item.edge.specifier) && String(reference.importedName) === item.importedName,
        );
        const read = await builtinReadByKey.get(`${String(item.edge.specifier)} ${item.importedName} ${String(called)}`);

        // A CALLED builtin carries the callable's signature; a builtin bound as a VALUE (`const sep =
        // sep`) carries its declared type instead — both P4-safe, read from `@types/node`.
        if (read?.usable === true) {
          return read.result === 'signature'
            ? { ...item, signature: read.signature, typeDescriptor: undefined, usableExternal: true }
            : { ...item, signature: undefined, typeDescriptor: read.type, usableExternal: true };
        }

        return { ...item, signature: undefined, typeDescriptor: undefined, usableExternal: false };
      }

      // A local target carries the TARGET file's exported entry signature — its declared input/output
      // types, looked up by the resolved (relPath, importedName) in the already-loaded blobs' analysis,
      // so a cross-file import shows its contract in the same currency as a package/global edge. A
      // namespace/star import names no single export to type; a target whose analysis has no matching
      // entry (a re-exported type, an unanalyzed file) stays unsigned but still resolves.
      if (item.classification.kind === 'local' && item.importedName !== undefined) {
        const targetBlob = blobsByRelPath.get(String(item.classification.relPath));
        const entry = targetBlob?.analysis?.functions.find(
          (fn) => String(fn.entry.name) === item.importedName,
        )?.entry;

        return {
          ...item,
          signature: entry === undefined ? undefined : { params: entry.params, returnType: entry.returnType },
          typeDescriptor: undefined,
          usableExternal: true,
        };
      }

      // A namespace/star import names no single export to type; a local target needs none.
      return { ...item, signature: undefined, typeDescriptor: undefined, usableExternal: item.classification.kind === 'local' };
    }),
  );

  const rawEdges = typed.flatMap((item) =>
    item.classification.kind === 'unresolved'
      ? []
      : [
          resolvedEdgeContract.parse({
            from: item.blob.relPath,
            specifier: item.edge.specifier,
            ...(item.importedName === undefined ? {} : { importedName: item.importedName }),
            line: item.edge.line,
            column: item.edge.column,
            target: {
              ...item.classification,
              ...(item.signature === undefined ? {} : { signature: item.signature }),
              ...(item.typeDescriptor === undefined ? {} : { type: item.typeDescriptor }),
            },
          }),
        ],
  );

  const rawErrors = typed.flatMap((item) =>
    item.classification.kind === 'unresolved'
      ? [
          {
            relPath: relPathContract.parse(String(item.blob.relPath)),
            line: lineNumberContract.parse(Number(item.edge.line)),
            column: columnNumberContract.parse(Number(item.edge.column)),
            message: errorMessageContract.parse(`cannot resolve import '${String(item.edge.specifier)}'`),
          },
        ]
      : [],
  );

  // A CALLED import into a package/builtin that yielded no usable signature is a hard build error at
  // the call site — the reader installs the dependency's types, the same class as a broken import.
  const externalKind = new Map(
    typed.flatMap((item) =>
      item.classification.kind === 'package' || item.classification.kind === 'builtin'
        ? [[`${String(item.blob.relPath)} ${String(item.edge.specifier)} ${String(item.importedName)}`, item.usableExternal]]
        : [],
    ),
  );

  const noTypeErrors =
    cacheDir === undefined || configFilePath === undefined
      ? []
      : blobs.flatMap((blob) =>
          blob.moduleGraph.references.flatMap((reference) => {
            const key = `${String(blob.relPath)} ${String(reference.specifier)} ${String(reference.importedName)}`;
            const usable = externalKind.get(key);

            return usable === false
              ? [
                  {
                    relPath: relPathContract.parse(String(blob.relPath)),
                    line: lineNumberContract.parse(Number(reference.line)),
                    column: columnNumberContract.parse(Number(reference.column)),
                    message: errorMessageContract.parse(
                      `import '${String(reference.specifier)}' has no usable types for '${String(reference.importedName)}' (install its type declarations)`,
                    ),
                  },
                ]
              : [];
          }),
        );

  // A dynamic `import()` with a non-literal specifier is a hard build error at the import site: the
  // analyzer cannot drive a runtime-chosen module, so the reader is told to write a static import.
  const dynamicErrors = blobs.flatMap((blob) =>
    blob.moduleGraph.edges.flatMap((edge) =>
      edge.kind === 'dynamic'
        ? [
            {
              relPath: relPathContract.parse(String(blob.relPath)),
              line: lineNumberContract.parse(Number(edge.line)),
              column: columnNumberContract.parse(Number(edge.column)),
              message: errorMessageContract.parse(
                'cannot resolve dynamic import() with a computed specifier (use a static import with a literal specifier)',
              ),
            },
          ]
        : [],
    ),
  );

  // Ambient globals (`console.log`, `process.env`) resolve against `@types/node`'s global scope through
  // the same second project — a CALLED method gets a `{params,returnType}` signature, a member access
  // its member type. A resolved edge is emitted for every use so a candidate is never invisible; a
  // CALLED use `@types/node` cannot type is additionally a no-usable-types build error at the call site
  // (honesty: the reader installs the types), while an untyped member access is merely recorded.
  const globalUnits = blobs.flatMap((blob) => blob.moduleGraph.globalUses.map((use) => ({ blob, use })));

  // Resolve each DISTINCT ambient reference exactly once. Duplicates across files (`process.env` used
  // in many files, `console.log` in several) name the SAME global-signature cache entry; reading them
  // concurrently would both re-derive the identical payload AND race on that entry's shared
  // atomic-write tmp path (one writer renames it away before the other's rename, an ENOENT crash).
  const globalUseByKey = new Map(
    globalUnits.map(({ use }) => [
      `${String(use.name)} ${use.member === undefined ? '' : String(use.member)} ${String(use.called)}`,
      use,
    ]),
  );

  const globalReadByKey = new Map(
    await Promise.all(
      [...globalUseByKey].map(async ([key, use]) => {
        const member = use.member === undefined ? {} : { member: use.member };
        const read =
          cacheDir !== undefined && configFilePath !== undefined
            ? await externalSignatureReadGlobalBroker({
                tsConfigFilePath: configFilePath,
                reference: { kind: 'global', name: use.name, ...member, called: use.called },
                cacheDir,
              })
            : ({ usable: false } as const);

        return [key, read] as const;
      }),
    ),
  );

  const globalResolved = globalUnits.map(({ blob, use }) => {
    const member = use.member === undefined ? {} : { member: use.member };
    const base = { kind: 'global' as const, name: use.name, ...member };
    const key = `${String(use.name)} ${use.member === undefined ? '' : String(use.member)} ${String(use.called)}`;
    const read = globalReadByKey.get(key) ?? ({ usable: false } as const);

    const target =
      read.usable && read.result === 'signature'
        ? { ...base, signature: read.signature }
        : read.usable
          ? { ...base, type: read.type }
          : base;

    const edge = resolvedEdgeContract.parse({ from: blob.relPath, line: use.line, column: use.column, target });

    const error =
      !read.usable && use.called
        ? {
            relPath: relPathContract.parse(String(blob.relPath)),
            line: lineNumberContract.parse(Number(use.line)),
            column: columnNumberContract.parse(Number(use.column)),
            message: errorMessageContract.parse(
              `global '${String(use.name)}${use.member === undefined ? '' : `.${String(use.member)}`}' has no usable types (install its type declarations)`,
            ),
          }
        : undefined;

    return { edge, error };
  });

  const globalEdges = globalResolved.map((resolved) => resolved.edge);
  const globalErrors = globalResolved.flatMap((resolved) => (resolved.error === undefined ? [] : [resolved.error]));

  // A broken specifier's every binding reports the identical error — dedup, then canonicalize order so
  // the resolved index and the error list are byte-identical across runs (no Map/traversal leakage).
  const allEdges = [...rawEdges, ...globalEdges];
  const edges = allEdges
    .filter((edge, index) => allEdges.findIndex((other) => JSON.stringify(other) === JSON.stringify(edge)) === index)
    .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));

  const allErrors = [...rawErrors, ...noTypeErrors, ...dynamicErrors, ...globalErrors];
  const errors = allErrors
    .filter((error, index) => allErrors.findIndex((other) => JSON.stringify(other) === JSON.stringify(error)) === index)
    .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));

  const index = resolvedIndexContract.parse({ layoutHash, tsconfigHash, edges });

  return { index, errors };
};
