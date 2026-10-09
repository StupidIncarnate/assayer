/**
 * PURPOSE: Puts one generation result on disk under the output root. It clears only what the
 * generator owns (the `src` folder, the manifest and the refusals file) and then writes every
 * generated file, so a specimen that is no longer generated disappears. Reach for
 * specimensCheckBroker instead when the question is whether the disk is current, not to change it.
 *
 * The hand-written config files in the output root (package.json, tsconfig.json, jest.config.js) are
 * never touched, because nothing here names them.
 *
 * USAGE:
 * specimensWriteBroker({ outRoot: '/repo/smoke-repo/packages/syntax-repository', result });
 * // Returns the number of files written
 */
import { ensureDirSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';

import type { GenerationResult } from '../../../contracts/generation-result/generation-result-contract';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

export const specimensWriteBroker = ({
  outRoot,
  result,
}: {
  outRoot: string;
  result: GenerationResult;
}): number => {
  const { sourceFolder, manifestFile, refusalsFile } = generatorLayoutStatics.output;

  rmSync(join(outRoot, sourceFolder), { recursive: true, force: true });
  rmSync(join(outRoot, manifestFile), { force: true });
  rmSync(join(outRoot, refusalsFile), { force: true });

  const files = [...result.files].sort(
    (a, b) => Number(String(a.relPath) > String(b.relPath)) - Number(String(a.relPath) < String(b.relPath)),
  );

  for (const file of files) {
    const absPath = join(outRoot, file.relPath);
    ensureDirSync(dirname(absPath));
    writeFileSync(absPath, file.content);
  }

  return files.length;
};
