/**
 * PURPOSE: Reads every declaration under the declarations folder (containers, syntaxes and shims) into
 * the loaded shapes the planner works from. It typechecks all of them in one program first and refuses
 * on any TypeScript diagnostic, because the declarations folder is left out of lint and this is the
 * only tool that checks it. It then transpiles each file and evaluates it in a bare `vm` sandbox whose
 * only reachable import is the kit, bound to the run-time markers. Evaluating a declaration never runs
 * a container's `code`, and the sandbox reaches no `process`, no `fs` and no other module.
 *
 * USAGE:
 * declarationsLoadBroker({ declarationsRoot: '/repo/packages/specimen-generator/declarations' });
 * // Returns { syntaxes: LoadedSyntax[], containers: LoadedContainer[] }, each sorted by name
 */
import { readFileSync, readdirSync } from '#gateway/node/fs';
import { basename, join } from '#gateway/node/path';
import { createContext, runInContext } from '#gateway/node/vm';
import { resolvePackageRoot } from '#gateway/node/module';
import ts from '#gateway/npm/typescript';
import { readTsconfig } from '#gateway/npm/typescript';

import type { LoadedContainer } from '../../../contracts/loaded-container/loaded-container-contract';
import type { LoadedSyntax } from '../../../contracts/loaded-syntax/loaded-syntax-contract';
import { ArmReachedError } from '../../../errors/arm-reached/arm-reached-error';
import { DeclarationError } from '../../../errors/declaration/declaration-error';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';
import { matrixStatics } from '../../../statics/matrix/matrix-statics';
import { containerShapeTransformer } from '../../../transformers/container-shape/container-shape-transformer';
import { declarationExportNameTransformer } from '../../../transformers/declaration-export-name/declaration-export-name-transformer';
import { syntaxShapeTransformer } from '../../../transformers/syntax-shape/syntax-shape-transformer';

export const declarationsLoadBroker = ({
  declarationsRoot,
}: {
  declarationsRoot: string;
}): { syntaxes: LoadedSyntax[]; containers: LoadedContainer[] } => {
  const layout = generatorLayoutStatics.declarations;
  const declarationFiles = [
    { kind: 'container' as const, ...layout.containers },
    { kind: 'syntax' as const, ...layout.syntax },
    { kind: 'shim' as const, ...layout.shims },
  ].flatMap(({ kind, folder, suffix }) =>
    readdirSync(join(declarationsRoot, folder))
      .filter((name) => name.endsWith(suffix))
      .sort()
      .map((name) => ({ kind, suffix, filePath: join(declarationsRoot, folder, name) })),
  );

  const configFilePath = join(declarationsRoot, layout.tsconfigFile);
  const tsconfig = readTsconfig({ configFilePath });
  if (tsconfig === undefined) {
    throw new DeclarationError({
      file: configFilePath,
      message: 'TypeScript cannot read this config. Add a tsconfig.json to the declarations folder.',
    });
  }

  // The program reads each declaration through the file system wrapper. The lib files come from the installed
  // `typescript` package, because the bundled compiler keeps its own copies in memory, not on disk.
  const rootNames = [...new Set([...tsconfig.fileNames, ...declarationFiles.map(({ filePath }) => filePath)])];
  const owned = new Set(rootNames);
  const typescriptRoot = resolvePackageRoot({ specifier: 'typescript' });
  if (typescriptRoot === null) {
    throw new DeclarationError({
      file: configFilePath,
      message:
        "cannot find the 'typescript' package, which holds the lib files the declarations are checked against. Install it as a dev dependency.",
    });
  }
  const libLocation = join(typescriptRoot, 'lib');
  const base = ts.createCompilerHost(tsconfig.options, true);
  const host: ts.CompilerHost = {
    ...base,
    getDefaultLibLocation: () => libLocation,
    getDefaultLibFileName: (options) => join(libLocation, ts.getDefaultLibFileName(options)),
    fileExists: (fileName) => owned.has(fileName) || base.fileExists(fileName),
    directoryExists: (directoryName) =>
      rootNames.some((fileName) => fileName.startsWith(`${directoryName}/`)) ||
      base.directoryExists?.(directoryName) === true,
    readFile: (fileName) => (owned.has(fileName) ? readFileSync(fileName) : base.readFile(fileName)),
    getSourceFile: (fileName, languageVersionOrOptions, onError, shouldCreate) =>
      owned.has(fileName)
        ? ts.createSourceFile(fileName, readFileSync(fileName), languageVersionOrOptions, true)
        : base.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreate),
  };
  const program = ts.createProgram(rootNames, tsconfig.options, host);

  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    const quoted = diagnostics.map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      if (diagnostic.file === undefined || diagnostic.start === undefined) {
        return message;
      }
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName}:${line + 1}: ${message}`;
    });
    throw new DeclarationError({
      file: configFilePath,
      message: `the declarations have TypeScript errors. Fix each one:\n${quoted.join('\n')}`,
    });
  }
  const checker = program.getTypeChecker();

  const runtimeKit = {
    $arm: (name: string): never => {
      throw new ArmReachedError({ arm: name });
    },
    container: (declared: unknown): unknown => declared,
    syntax: (declared: unknown): unknown => declared,
    shim: (declared: unknown): unknown => declared,
    $stmts: (): never => {
      throw new Error('$stmts is a marker in container code. Container code is read as a syntax tree and never run.');
    },
    $expr: (): never => {
      throw new Error('$expr is a marker in container code. Container code is read as a syntax tree and never run.');
    },
    $exportDefault: (): never => {
      throw new Error(
        '$exportDefault is a marker in container code. Container code is read as a syntax tree and never run.',
      );
    },
  };

  const evaluated = declarationFiles.map(({ kind, suffix, filePath }) => {
    const sourceFile = program.getSourceFile(filePath);
    if (sourceFile === undefined) {
      throw new DeclarationError({
        file: filePath,
        message:
          'is not part of the declarations program. Add the file to the include list of the declarations tsconfig.json.',
      });
    }

    const transpiled = ts.transpileModule(sourceFile.text, {
      fileName: filePath,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exported: Record<string, unknown> = {};
    const sandbox = {
      module: { exports: exported },
      exports: exported,
      require: (specifier: string): typeof runtimeKit => {
        if (specifier !== layout.kitSpecifier) {
          throw new DeclarationError({
            file: filePath,
            message: `imports '${specifier}', and a declaration may import only '${layout.kitSpecifier}'. Remove the import. A declaration is read by being run, so anything it imports would run during a load.`,
          });
        }
        return runtimeKit;
      },
    };
    try {
      runInContext(transpiled.outputText, createContext(sandbox), { filename: filePath });
    } catch (error: unknown) {
      if (error instanceof DeclarationError) {
        throw error;
      }
      // `String(error)`, never `instanceof Error`: an error thrown inside the sandbox belongs to that context's
      // own Error class.
      const reason = String(error);
      throw new DeclarationError({
        file: filePath,
        message: `throws while it loads: ${reason}. Fix the declaration so that evaluating it throws nothing.`,
      });
    }

    const expected = declarationExportNameTransformer({ fileName: filePath, kind });
    const exportedNames = Object.keys(exported);
    const [onlyName] = exportedNames;
    if (exportedNames.length !== 1 || onlyName !== expected) {
      throw new DeclarationError({
        file: filePath,
        message: `must export exactly one const named ${expected}. It exports: ${exportedNames.join(', ') || 'nothing'}. Rename or remove the exports.`,
      });
    }
    const declared = exported[expected];

    return { kind, suffix, filePath, sourceFile, declared };
  });

  return {
    syntaxes: evaluated
      .flatMap(({ kind, sourceFile, declared }) =>
        kind === 'container'
          ? []
          : [
              syntaxShapeTransformer({
                sourceFile,
                checker,
                declared,
                origin: kind,
                typeArguments: matrixStatics.typeArguments,
              }),
            ],
      )
      .sort((left, right) => (left.name < right.name ? -1 : Number(left.name > right.name))),
    containers: evaluated
      .flatMap(({ kind, suffix, filePath, sourceFile, declared }) =>
        kind === 'container'
          ? [containerShapeTransformer({ sourceFile, declared, name: basename(filePath, suffix) })]
          : [],
      )
      .sort((left, right) => (left.name < right.name ? -1 : Number(left.name > right.name))),
  };
};
