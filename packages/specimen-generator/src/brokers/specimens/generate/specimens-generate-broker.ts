/**
 * PURPOSE: Plans, renders, checks and describes every specimen one run asks for, and returns the whole
 * result in memory. It writes nothing: specimensWriteBroker puts the result on disk, and
 * specimensCheckBroker compares it with the disk. Reach for this when you need the files a run would
 * produce, and for none of the work after it.
 *
 * It loads the declarations, plans one specimen per variant of each focus in each slot, and typechecks
 * all the specimen sources at once. A specimen TypeScript rejects is listed as refused and gets no test.
 * Every other specimen gets its predicted outcome, its test file and its manifest row. The output is
 * sorted, so one set of declarations always gives one result.
 *
 * USAGE:
 * specimensGenerateBroker({ declarationsRoot: '/repo/packages/specimen-generator/declarations', args });
 * // Returns { files, refused, manifest }. Throws when a focus or container name is unknown, or when
 * // two specimens would share a folder name.
 */
import type { GenerationResult } from '../../../contracts/generation-result/generation-result-contract';
import { generationResultContract } from '../../../contracts/generation-result/generation-result-contract';
import { generatedFileContract } from '../../../contracts/generated-file/generated-file-contract';
import type { GeneratorArgs } from '../../../contracts/generator-args/generator-args-contract';
import { refusedSpecimenContract } from '../../../contracts/refused-specimen/refused-specimen-contract';
import { hasAllLiteralNodeGuard } from '../../../guards/has-all-literal-node/has-all-literal-node-guard';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';
import { matrixStatics } from '../../../statics/matrix/matrix-statics';
import { armReachedTransformer } from '../../../transformers/arm-reached/arm-reached-transformer';
import { fillTreeLeavesTransformer } from '../../../transformers/fill-tree-leaves/fill-tree-leaves-transformer';
import { fillTreeRenderTransformer } from '../../../transformers/fill-tree-render/fill-tree-render-transformer';
import { fillTreeUsesTransformer } from '../../../transformers/fill-tree-uses/fill-tree-uses-transformer';
import { fillVariantsTransformer } from '../../../transformers/fill-variants/fill-variants-transformer';
import { manifestEntryTransformer } from '../../../transformers/manifest-entry/manifest-entry-transformer';
import { refusedReportTransformer } from '../../../transformers/refused-report/refused-report-transformer';
import { specimenAssembleTransformer } from '../../../transformers/specimen-assemble/specimen-assemble-transformer';
import { specimenFolderNameTransformer } from '../../../transformers/specimen-folder-name/specimen-folder-name-transformer';
import { specimenPredictTransformer } from '../../../transformers/specimen-predict/specimen-predict-transformer';
import { specimenTestSourceTransformer } from '../../../transformers/specimen-test-source/specimen-test-source-transformer';
import { specimenTestTitleTransformer } from '../../../transformers/specimen-test-title/specimen-test-title-transformer';
import { specimenVerdictTransformer } from '../../../transformers/specimen-verdict/specimen-verdict-transformer';
import { syntaxInstancesTransformer } from '../../../transformers/syntax-instances/syntax-instances-transformer';
import { declarationsLoadBroker } from '../../declarations/load/declarations-load-broker';
import { specimensTypecheckBroker } from '../typecheck/specimens-typecheck-broker';

export const specimensGenerateBroker = ({
  declarationsRoot,
  args,
}: {
  declarationsRoot: string;
  args: GeneratorArgs;
}): GenerationResult => {
  const { output } = generatorLayoutStatics;
  const { syntaxes, containers } = declarationsLoadBroker({ declarationsRoot });
  const instances = syntaxInstancesTransformer({ syntaxes });

  const focusNames: readonly string[] = args.focus ?? matrixStatics.focus;
  const containerNames: readonly string[] | undefined = args.container;
  const depth = args.depth ?? matrixStatics.nesting.depth;

  const knownFocusNames = syntaxes.map(({ name }) => name);
  const unknownFocus = focusNames.find((name) => !knownFocusNames.includes(name));
  if (unknownFocus !== undefined) {
    throw new Error(
      `The focus '${unknownFocus}' matches no syntax or shim declaration. The known names are: ${knownFocusNames.join(', ')}. Name one of them, or add declarations/syntax/${unknownFocus}.syntax.ts.`,
    );
  }
  const knownContainerNames = containers.map(({ name }) => name);
  const unknownContainer = (containerNames ?? []).find((name) => !knownContainerNames.includes(name));
  if (unknownContainer !== undefined) {
    throw new Error(
      `The container '${unknownContainer}' matches no container declaration. The known names are: ${knownContainerNames.join(', ')}. Name one of them, or add declarations/containers/${unknownContainer}.container.ts.`,
    );
  }
  const selectedContainers = containers.filter(
    ({ name }) => containerNames === undefined || containerNames.includes(name),
  );

  const planned = instances
    .filter((focus) => focusNames.includes(focus.syntax.name))
    .flatMap((focus) =>
      selectedContainers.flatMap((container) =>
        [...container.slots]
          .sort((left, right) => (left.name < right.name ? -1 : Number(left.name > right.name)))
          .filter((slot) => !(focus.syntax.kind === 'statement' && slot.kind === 'expression'))
          .flatMap((slot) =>
            fillVariantsTransformer({
              focus,
              depth,
              slot,
              instances,
              enabled: matrixStatics.provenances,
              plainest: matrixStatics.plainest,
              excludedFills: matrixStatics.excludedFills,
            })
              .filter(({ tree }) => !hasAllLiteralNodeGuard({ tree }))
              .map(({ tree, path, provenance }) => {
                const { folder, entryName } = specimenFolderNameTransformer({
                  focusLabel: focus.label,
                  containerName: container.name,
                  slotName: slot.name,
                  multiSlot: container.slots.length > 1,
                  path,
                  provenance,
                  isClass: container.isClass,
                });
                const rendered = fillTreeRenderTransformer({
                  tree,
                  ...(focus.syntax.kind === 'statement' && slot.arm !== undefined ? { armKind: slot.arm } : {}),
                });
                const source = specimenAssembleTransformer({
                  container,
                  slot,
                  rendered,
                  focusKind: focus.syntax.kind,
                  resultType: focus.syntax.kind === 'statement' ? 'string' : focus.returnType,
                  entryName,
                });
                const directory = [output.sourceFolder, focus.syntax.name, container.name, folder];
                const tail = [...directory, folder].join('/');

                return {
                  focus,
                  container,
                  slot,
                  tree,
                  path,
                  provenance,
                  folder,
                  source,
                  directoryDepth: directory.length,
                  relPath: `${tail}${output.specimenSuffix}`,
                  testRelPath: `${tail}${output.testSuffix}`,
                  assayerRelPath: `${output.testRelPathPrefix}/${directory.slice(1).join('/')}/${folder}${output.specimenSuffix}`,
                };
              }),
          ),
      ),
    );

  const folders = planned.map(({ folder }) => folder);
  const collisions = [...new Set(folders.filter((folder, index) => folders.indexOf(folder) !== index))].sort();
  if (collisions.length > 0) {
    throw new Error(
      `Two specimens share one folder name: ${collisions.join(', ')}. Rename a container, slot or hole so the names differ, because the folder name is built from them.`,
    );
  }

  const typeErrors = specimensTypecheckBroker({
    files: planned.map(({ relPath, source }) => generatedFileContract.parse({ relPath, content: source })),
  });
  const reasonByRelPath = new Map(
    typeErrors.map(({ relPath, messages }): [string, string] => [relPath, messages.join(' ')]),
  );
  const refused = planned.flatMap(({ folder, relPath }) => {
    const reason = reasonByRelPath.get(relPath);
    return reason === undefined ? [] : [refusedSpecimenContract.parse({ folder, reason })];
  });
  const kept = planned.filter(({ relPath }) => !reasonByRelPath.has(relPath));

  const built = kept.map((specimen) => {
    const { focus, slot, tree, path, provenance, folder } = specimen;
    const provenances = fillTreeLeavesTransformer({ tree }).map((leaf) => leaf.provenance);
    const verdict = specimenVerdictTransformer({ provenances });
    const prediction = specimenPredictTransformer({
      source: specimen.source,
      focusKind: focus.syntax.kind,
      arms: focus.syntax.arms,
      provenances,
      slotName: slot.name,
      ...(slot.arm === undefined ? {} : { slotArm: slot.arm }),
      ...(verdict === 'locked' ? { liveArm: armReachedTransformer({ tree }) } : {}),
    });
    const title = specimenTestTitleTransformer({
      provenance,
      varyingLeaf: path.slice(-1).join(''),
      prediction,
    });
    // The smoke repo's root is the output root's first segment. Each folder below it, down to the
    // test's own, is one `..` on the way back up.
    const depthToRepoRoot = output.rootSegments.slice(1).length + specimen.directoryDepth;
    const testSource = specimenTestSourceTransformer({
      folder,
      relPath: specimen.assayerRelPath,
      depthToRepoRoot,
      title,
      prediction,
    });

    return {
      files: [
        generatedFileContract.parse({ relPath: specimen.relPath, content: specimen.source }),
        generatedFileContract.parse({ relPath: specimen.testRelPath, content: testSource }),
      ],
      entry: manifestEntryTransformer({
        folder,
        relPath: specimen.assayerRelPath,
        focusName: focus.syntax.name,
        containerName: specimen.container.name,
        slotName: slot.name,
        path,
        provenance,
        uses: fillTreeUsesTransformer({ tree }),
        provenances,
      }),
    };
  });

  const manifest = built
    .map(({ entry }) => entry)
    .sort((left, right) => (left.folder < right.folder ? -1 : Number(left.folder > right.folder)));
  const sortedRefused = [...refused].sort((left, right) =>
    left.folder < right.folder ? -1 : Number(left.folder > right.folder),
  );
  const files = [
    ...built.flatMap((entry) => entry.files),
    generatedFileContract.parse({
      relPath: output.manifestFile,
      content: `${JSON.stringify(manifest, null, '  ')}\n`,
    }),
    generatedFileContract.parse({
      relPath: output.refusalsFile,
      content: refusedReportTransformer({ refused: sortedRefused }),
    }),
  ].sort((left, right) => (left.relPath < right.relPath ? -1 : Number(left.relPath > right.relPath)));

  return generationResultContract.parse({ files, refused: sortedRefused, manifest });
};
