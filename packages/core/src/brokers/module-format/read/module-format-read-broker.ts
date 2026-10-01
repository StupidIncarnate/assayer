/**
 * PURPOSE: Decides whether one consumer file runs as CommonJS or as an ES module, so the wrapped runner
 *   can run it the way the consumer's own code runs. Reach for this, not a guess from a folder or a file
 *   name, whenever a run needs the file's module format.
 *
 *   It asks TypeScript first, with the compiler options of the tsconfig nearest the file. TypeScript
 *   answers when that tsconfig sets a node module kind (`node16`, `node18`, `nodenext`), and its answer
 *   is the one the consumer's own `tsc` uses. For any other module kind TypeScript makes no claim. Then
 *   it applies Node's own rule, by asking the same TypeScript call under `nodenext`: the file's extension
 *   (`.mts` is ESM, `.cts` is CommonJS), else the `type` field of the nearest `package.json`. A file
 *   that rule leaves undecided runs as CommonJS, which is Node's default.
 *
 * USAGE:
 * moduleFormatReadBroker({ absPath: '/repo/src/grade.ts' });
 * // Returns 'esm' when /repo/package.json says "type": "module", else 'commonjs'
 */
import { dirname } from '#gateway/node/path';
import { ModuleKind, ModuleResolutionKind, impliedNodeFormat } from '#gateway/npm/typescript';

import type { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import { tsconfigReadBroker } from '../../tsconfig/read/tsconfig-read-broker';

export const moduleFormatReadBroker = ({
  absPath,
}: {
  absPath: string;
}): (typeof coreRuntimeStatics.moduleFormats)[number] => {
  const { options } = tsconfigReadBroker({ searchPath: dirname(absPath) });
  const declared = impliedNodeFormat({ fileName: absPath, options });

  if (declared !== undefined) {
    return declared;
  }

  const byNodeRule = impliedNodeFormat({
    fileName: absPath,
    options: { ...options, module: ModuleKind.NodeNext, moduleResolution: ModuleResolutionKind.NodeNext },
  });

  return byNodeRule ?? 'commonjs';
};
