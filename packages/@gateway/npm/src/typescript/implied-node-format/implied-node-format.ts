/**
 * PURPOSE: Reads the module format TypeScript gives one file under one set of compiler options, by
 * running `getImpliedNodeFormatForFile` over `ts.sys`. TypeScript answers from the file's extension and
 * the `type` field of the nearest `package.json`, the same rule Node runs a file by. It answers only
 * when the options name a node module resolution (`node16`, `node18`, `nodenext`); under any other
 * module setting it makes no claim, and this returns `undefined`. This is the seam a test stages
 * through `impliedNodeFormatProxy`, because `ts.sys` reads the real disk and nothing else can stage it.
 *
 * USAGE:
 * impliedNodeFormat({ fileName: '/repo/src/a.ts', options: { module: ModuleKind.NodeNext } });
 * // Returns 'esm' when /repo/package.json says "type": "module", 'commonjs' when it does not
 */
import { ModuleKind, getImpliedNodeFormatForFile, sys } from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';

export const impliedNodeFormat = ({
  fileName,
  options,
}: {
  fileName: string;
  options: CompilerOptions;
}): 'esm' | 'commonjs' | undefined => {
  const format = getImpliedNodeFormatForFile(fileName, undefined, sys, options);

  if (format === ModuleKind.ESNext) {
    return 'esm';
  }

  return format === ModuleKind.CommonJS ? 'commonjs' : undefined;
};
