/**
 * PURPOSE: Asks TypeScript whether every generated specimen is good code, before anything is written to
 * disk. All the specimens go into one program over an in-memory compiler host, so a run costs one
 * typecheck, not one per file. `@types/node` still comes from the real disk through the host's defaults, and
 * the lib files come from the installed `typescript` package, because the bundled compiler keeps its own
 * copies in memory. Reach for this over declarationsLoadBroker when the code under check was generated,
 * not hand-written.
 *
 * USAGE:
 * specimensTypecheckBroker({ files: [{ relPath: 'src/if/a/a.ts', content: 'export {};' }] });
 * // Returns [] when every file is clean, or [{ relPath, messages }] for each file TypeScript rejects
 */
import ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';

import { specimenTypeErrorContract } from '../../../contracts/specimen-type-error/specimen-type-error-contract';
import type { SpecimenTypeError } from '../../../contracts/specimen-type-error/specimen-type-error-contract';
import type { GeneratedFile } from '../../../contracts/generated-file/generated-file-contract';
import { specimenTypecheckStatics } from '../../../statics/specimen-typecheck/specimen-typecheck-statics';
import { typescriptLibLocateBroker } from '../../typescript-lib/locate/typescript-lib-locate-broker';

export const specimensTypecheckBroker = ({
  files,
}: {
  files: readonly GeneratedFile[];
}): SpecimenTypeError[] => {
  const currentDirectory = ts.sys.getCurrentDirectory();
  const converted = ts.convertCompilerOptionsFromJson(specimenTypecheckStatics.compilerOptions, currentDirectory);
  if (converted.errors.length > 0) {
    const problems = converted.errors
      .map((error) => ts.flattenDiagnosticMessageText(error.messageText, ' '))
      .join('; ');
    throw new Error(
      `specimenTypecheckStatics.compilerOptions is not a valid set of compiler options: ${problems}. Fix the option in specimen-typecheck-statics.ts.`,
    );
  }

  const libLocation = typescriptLibLocateBroker();
  if (libLocation === null) {
    throw new Error(
      "cannot find the 'typescript' package, which holds the lib files the specimens are checked against. Install it as a dev dependency.",
    );
  }
  const virtualFiles = new Map(files.map((file) => [join(currentDirectory, file.relPath), file]));
  const base = ts.createCompilerHost(converted.options, true);
  const host: ts.CompilerHost = {
    ...base,
    getDefaultLibLocation: () => libLocation,
    getDefaultLibFileName: (options) => join(libLocation, ts.getDefaultLibFileName(options)),
    fileExists: (fileName) => virtualFiles.has(fileName) || base.fileExists(fileName),
    readFile: (fileName) => virtualFiles.get(fileName)?.content ?? base.readFile(fileName),
    getSourceFile: (fileName, languageVersionOrOptions, onError, shouldCreate) => {
      const virtual = virtualFiles.get(fileName);
      return virtual === undefined
        ? base.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreate)
        : ts.createSourceFile(fileName, virtual.content, languageVersionOrOptions, true);
    },
  };
  const program = ts.createProgram([...virtualFiles.keys()], converted.options, host);

  const messagesByRelPath = new Map<GeneratedFile['relPath'], string[]>();
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    const generated = diagnostic.file === undefined ? undefined : virtualFiles.get(diagnostic.file.fileName);
    if (generated === undefined) {
      const where = diagnostic.file === undefined ? 'no file' : diagnostic.file.fileName;
      throw new Error(
        `the typecheck failed outside the generated files (${where}): ${message}. Fix the compiler setup in specimen-typecheck-statics.ts, or the environment it reads.`,
      );
    }
    const messages = messagesByRelPath.get(generated.relPath) ?? [];
    messagesByRelPath.set(generated.relPath, messages.includes(message) ? messages : [...messages, message]);
  }

  return [...messagesByRelPath.entries()]
    .sort(([left], [right]) => (left < right ? -1 : Number(left > right)))
    .map(([relPath, messages]) => specimenTypeErrorContract.parse({ relPath, messages }));
};
