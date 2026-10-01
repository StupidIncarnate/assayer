/**
 * PURPOSE: LOADING IS THE READ — transpiles one harness file with the npm `typescript` compiler
 *   (`transpileModule`, so no require hook is installed and nothing is added to the module cache) and
 *   EVALUATES it in a fresh `node:vm` context, returning whatever its `assayerHarness` calls registered.
 *   A harness declares callbacks and instances; there is no way to know what it says except to run it.
 *
 *   The sandbox is bare. It holds a CommonJS shell and one reachable import — `@assayer/core`, bound to
 *   the collector this call owns — so a harness sees no `process`, no `require('fs')`, and no host
 *   globals. A value import of anything else is refused by name rather than resolved, which keeps a
 *   compile from executing arbitrary repo code as a side effect of reading a declaration.
 *
 *   The registrar handed to the sandbox is the PUBLISHED `assayerHarness` itself, so the declaration a
 *   compile records and the declaration a run resolves are validated by one function and cannot
 *   disagree about what the file said.
 *
 *   Anything the file throws — a syntax error, a call to an unavailable import, a declaration the
 *   contract refuses — comes back as `{ ok: false }` with the thrown message. The caller turns that into
 *   a P1 naming the file; a gated harness that cannot be read is never silently skipped.
 *
 * USAGE:
 * typescriptLoadHarnessAdapter({ source, fileName: 'src/audit.harness.ts' });
 * // Returns { ok: true, declarations: [{ inputs: { audit: { report: [Function] } } }] }
 * // or { ok: false, message: "cannot find module 'fs'" }
 */
import { types } from '#gateway/node/util';
import { createContext, runInContext } from '#gateway/node/vm';

import ts from '#gateway/npm/typescript';


import type { HarnessDeclaration } from '../../../contracts/harness-declaration/harness-declaration-contract';
import { harnessModuleStatics } from '../../../statics/harness-module/harness-module-statics';
import { assayerHarnessTransformer } from '../../../transformers/assayer-harness/assayer-harness-transformer';

export const typescriptLoadHarnessAdapter = ({
  source,
  fileName,
}: {
  source: string;
  fileName: string;
}): { ok: true; declarations: HarnessDeclaration[] } | { ok: false; message: string } => {
  const transpiled = ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });

  const declarations: HarnessDeclaration[] = [];

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: (specifier: string): { assayerHarness: (declaration: HarnessDeclaration) => HarnessDeclaration } => {
      if (
        specifier !== harnessModuleStatics.packageName &&
        !specifier.startsWith(`${harnessModuleStatics.packageName}/`)
      ) {
        throw new Error(
          `a harness may import only '${harnessModuleStatics.packageName}', and this one imports ` +
            `'${specifier}'. Declare the value inline in the \`inputs\` map instead — a harness is read by ` +
            `being run, so anything it imports would run during a compile.`,
        );
      }

      return {
        assayerHarness: (declaration: HarnessDeclaration): HarnessDeclaration => {
          const validated = assayerHarnessTransformer(declaration);

          declarations.push(validated);

          return validated;
        },
      };
    },
  };

  try {
    runInContext(transpiled.outputText, createContext(sandbox), { filename: fileName });
  } catch (error: unknown) {
    // `isNativeError`, never `instanceof Error`: an error thrown INSIDE the sandbox is an instance of
    // that context's own Error constructor, so the host's `instanceof` answers false and the reader
    // would get a stringified error where the message belongs.
    return {
      ok: false,
      message: types.isNativeError(error) ? error.message : String(error),
    };
  }

  return { ok: true, declarations };
};
