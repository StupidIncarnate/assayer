/**
 * PURPOSE: The nested Jest's `resolver`. It resolves an import the way TypeScript resolves it, and
 *   falls back to Jest's own resolver for anything TypeScript does not resolve to TypeScript source.
 *
 *   Jest's resolver does not know TypeScript's rules. A consumer on `node16` or `nodenext` writes
 *   `import { band } from './band.js'` for a file that exists only as `band.ts`, and Jest looks for
 *   `band.js` and fails. TypeScript's own `resolveModuleName`, with the compiler options of the
 *   tsconfig that owns the importing file, finds `band.ts`. The same call also follows a tsconfig
 *   `paths` alias. Only an answer that is TypeScript source outside `node_modules` is taken, so a
 *   package, a declaration file or a JavaScript file still resolves the way Jest resolves it.
 *
 *   The import's mode comes from the conditions Jest resolves with: `import` means an ESM import, so
 *   TypeScript applies its ESM rules; anything else applies its CommonJS rules.
 *
 *   It runs on the TypeScript ts-morph bundles, the same copy the analyzer resolves imports with. It is
 *   plain JS at the package root because Jest's config is JSON and can only name a resolver by path.
 *
 *   The owner is found the way `brokers/tsconfig/owner` finds it: the nearest `tsconfig.json` owns the
 *   file when TypeScript's parsed file list holds it, a solution config asks its project references, and
 *   a config that does not own it is passed over for the one above. Jest gives a resolver only the
 *   importing file's folder, so a config owns the folder when its parsed file list holds a file in it.
 *   That check is the one place the two differ. A folder no config owns gets TypeScript's defaults.
 *
 *   Each tsconfig is parsed once per process, each resolution cache belongs to one owner, and each answer
 *   is kept for the life of the worker process: a new Jest run starts with an empty resolver cache of its own, and asking TypeScript again
 *   for every import of every run costs about 100ms per run. The worker lives for one Assayer process,
 *   and a consumer's files do not move during one.
 *
 * USAGE:
 * // jest config: { resolver: '<core>/ts-resolver.js' }
 */
const { ts } = require('ts-morph');
const { dirname, join } = require('node:path');

const parsedByConfig = new Map();
const projectByDirectory = new Map();
const projectByOwner = new Map();
const answers = new Map();
const sourceExtensions = new Set([ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Mts, ts.Extension.Cts]);

// One tsconfig, parsed by TypeScript once per process: the folders its parsed file list reaches, its project
// references, and its compiler options.
const parsedFor = (configPath) => {
  if (!parsedByConfig.has(configPath)) {
    const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: () => undefined,
    });

    parsedByConfig.set(
      configPath,
      parsed === undefined
        ? undefined
        : {
            folders: new Set(parsed.fileNames.map((fileName) => dirname(fileName))),
            references: (parsed.projectReferences ?? []).map((reference) => ts.resolveProjectReferencePath(reference)),
            options: parsed.options,
          },
    );
  }

  return parsedByConfig.get(configPath);
};

// Jest hands a resolver the importing file's folder, never the file. A config owns a folder when TypeScript's
// own file list for that config holds a file in it. A solution config hands the question to its references.
const ownerInProject = (basedir, configPath, seen) => {
  const parsed = seen.includes(configPath) ? undefined : parsedFor(configPath);

  if (parsed === undefined) {
    return undefined;
  }

  if (parsed.folders.has(basedir)) {
    return { configPath, options: parsed.options };
  }

  return parsed.references.reduce(
    (found, reference) => found ?? ownerInProject(basedir, reference, [...seen, configPath]),
    undefined,
  );
};

// The nearest tsconfig above the search path, then the ones above that, until one owns the folder.
const ownerAbove = (basedir, searchPath) => {
  const configPath = ts.findConfigFile(searchPath, (file) => ts.sys.fileExists(file));

  if (configPath === undefined) {
    return undefined;
  }

  const owner = ownerInProject(basedir, configPath, []);

  if (owner !== undefined) {
    return owner;
  }

  const configFolder = dirname(configPath);
  const above = dirname(configFolder);

  return above === configFolder ? undefined : ownerAbove(basedir, above);
};

// The compiler options of the tsconfig that owns a folder, plus one TypeScript resolution cache per owner, so
// every folder under one owner shares both. A folder no tsconfig owns gets TypeScript's defaults.
const projectFor = (basedir) => {
  if (!projectByDirectory.has(basedir)) {
    const owner = ownerAbove(basedir, basedir);
    const ownerPath = owner === undefined ? '' : owner.configPath;

    if (!projectByOwner.has(ownerPath)) {
      const compilerOptions = owner === undefined ? {} : owner.options;

      projectByOwner.set(ownerPath, {
        compilerOptions,
        cache: ts.createModuleResolutionCache(basedir, (fileName) => fileName, compilerOptions),
      });
    }

    projectByDirectory.set(basedir, projectByOwner.get(ownerPath));
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
