/**
 * PURPOSE: Compares one generation result with the files on disk under the output root, and lists
 * every file that disagrees. An empty list means the committed output is current. Reach for
 * specimensWriteBroker instead to change the disk. This broker only reads.
 *
 * It reads every file under `src`, plus the manifest and the refusals file when they exist. A file
 * on disk that was not generated is reported as `extra`. The hand-written config files are never
 * read, so they never count as extra.
 *
 * USAGE:
 * specimensCheckBroker({ outRoot: '/repo/smoke-repo/packages/syntax-repository', result });
 * // Returns SpecimenDrift[] sorted by relPath, with problem 'differs', 'missing' or 'extra'
 */
import { readFileSync, readFileSyncIfExists, walkFilesSync } from '#gateway/node/fs';
import { join, relative } from '#gateway/node/path';

import { specimenDriftContract } from '../../../contracts/specimen-drift/specimen-drift-contract';
import type { SpecimenDrift } from '../../../contracts/specimen-drift/specimen-drift-contract';
import type { GenerationResult } from '../../../contracts/generation-result/generation-result-contract';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

export const specimensCheckBroker = ({
  outRoot,
  result,
}: {
  outRoot: string;
  result: GenerationResult;
}): SpecimenDrift[] => {
  const { sourceFolder, manifestFile, refusalsFile } = generatorLayoutStatics.output;

  const onDisk = new Map<string, string>();
  for (const walked of walkFilesSync({ rootPath: join(outRoot, sourceFolder), suffix: '' })) {
    onDisk.set(relative(outRoot, walked.path), readFileSync(walked.path));
  }
  for (const topFile of [manifestFile, refusalsFile]) {
    const content = readFileSyncIfExists(join(outRoot, topFile));
    if (content !== null) {
      onDisk.set(topFile, content);
    }
  }

  const generated = new Map<string, string>();
  for (const file of result.files) {
    generated.set(file.relPath, file.content);
  }

  const drift: { relPath: string; problem: 'differs' | 'missing' | 'extra' }[] = [];
  for (const [relPath, content] of generated) {
    const found = onDisk.get(relPath);
    if (found === undefined) {
      drift.push({ relPath, problem: 'missing' });
    } else if (found !== content) {
      drift.push({ relPath, problem: 'differs' });
    }
  }
  for (const relPath of onDisk.keys()) {
    if (!generated.has(relPath)) {
      drift.push({ relPath, problem: 'extra' });
    }
  }

  drift.sort((a, b) => Number(a.relPath > b.relPath) - Number(a.relPath < b.relPath));

  return drift.map((entry) => specimenDriftContract.parse(entry));
};
