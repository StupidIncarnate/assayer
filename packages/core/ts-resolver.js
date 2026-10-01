/**
 * PURPOSE: The nested Jest's `resolver`. It resolves an import the way TypeScript resolves it, and
 *   falls back to Jest's own resolver for anything TypeScript does not resolve to TypeScript source.
 *
 *   Jest's resolver does not know TypeScript's rules. A consumer on `node16` or `nodenext` writes
 *   `import { band } from './band.js'` for a file that exists only as `band.ts`, and Jest looks for
 *   `band.js` and fails. TypeScript's own `resolveModuleName`, with the compiler options of the
 *   tsconfig nearest the importing directory, finds `band.ts`. The same call also follows a tsconfig
 *   `paths` alias. Only an answer that is TypeScript source outside `node_modules` is taken, so a
 *   package, a declaration file or a JavaScript file still resolves the way Jest resolves it.
 *
 *   The import's mode comes from the conditions Jest resolves with: `import` means an ESM import, so
 *   TypeScript applies its ESM rules; anything else applies its CommonJS rules.
 *
 *   It runs on the TypeScript ts-morph bundles, the same copy the analyzer resolves imports with. It is
 *   plain JS at the package root because Jest's config is JSON and can only name a resolver by path.
 *
 *   Each tsconfig is parsed once per process, and each answer is kept for the life of the worker
 *   process: a new Jest run starts with an empty resolver cache of its own, and asking TypeScript again
 *   for every import of every run costs about 100ms per run. The worker lives for one Assayer process,
 *   and a consumer's files do not move during one.
 *
 * USAGE:
 * // jest config: { resolver: '<core>/ts-resolver.js' }
 */
const { ts } = require('ts-morph');
const { join } = require('node:path');

const projectByDirectory = new Map();
const projectByConfig = new Map();
const answers = new Map();
const sourceExtensions = new Set([ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Mts, ts.Extension.Cts]);

// The compiler options of the tsconfig nearest a directory, plus one TypeScript resolution cache per
// tsconfig, so every directory under one tsconfig shares both.
const projectFor = (basedir) => {
  if (!projectByDirectory.has(basedir)) {
    const configPath = ts.findConfigFile(basedir, (file) => ts.sys.fileExists(file)) ?? '';

    if (!projectByConfig.has(configPath)) {
      const parsed =
        configPath === ''
          ? undefined
          : ts.getParsedCommandLineOfConfigFile(configPath, {}, {
              ...ts.sys,
              onUnRecoverableConfigFileDiagnostic: () => undefined,
            });
      const compilerOptions = parsed === undefined ? {} : parsed.options;

      projectByConfig.set(configPath, {
        compilerOptions,
        cache: ts.createModuleResolutionCache(basedir, (fileName) => fileName, compilerOptions),
      });
    }

    projectByDirectory.set(basedir, projectByConfig.get(configPath));
  }

  return projectByDirectory.get(basedir);
};

module.exports = (request, options) => {
  const resolutionMode = (options.conditions ?? []).includes('import') ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;
  const key = `${options.basedir}\0${request}\0${String(resolutionMode)}`;

  if (!answers.has(key)) {
    const { compilerOptions, cache } = projectFor(options.basedir);
    const { resolvedModule } = ts.resolveModuleName(
      request,
      join(options.basedir, '__assayer_importer__.ts'),
      compilerOptions,
      ts.sys,
      cache,
      undefined,
      resolutionMode,
    );

    answers.set(
      key,
      resolvedModule !== undefined &&
        resolvedModule.isExternalLibraryImport !== true &&
        sourceExtensions.has(resolvedModule.extension)
        ? resolvedModule.resolvedFileName
        : undefined,
    );
  }

  return answers.get(key) ?? options.defaultResolver(request, options);
};
