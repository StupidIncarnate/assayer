import { assayerCliHarness } from '../test/harnesses/assayer-cli.harness';
import { assayerCompileHarness } from '../test/harnesses/assayer-compile.harness';
import { CliRunResultStub } from '../src/contracts/cli-run-result/cli-run-result.stub';
import { CliFileTextStub } from '../src/contracts/cli-file-text/cli-file-text.stub';
import { cliUsageStatics } from '../src/statics/cli-usage/cli-usage-statics';
import { docsOverviewStatics } from '../src/statics/docs-overview/docs-overview-statics';
import { BranchNameStub, RelPathStub } from '@assayer/shared/contracts';

const DOCS_OVERVIEW_TOPIC_BODY =
  'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.';

// A compile that WROTE something announces itself, then the status lines.
const COMPILED_STATUS_STDOUT = /^Assayer is updating caches\n[\s\S]*\nassayer 1\.0\.0\nAssayer core online\n$/u;
// A run that wrote nothing says nothing about caches. The working-tree namespace re-reads and
// re-hashes every file on every run, so "a file was looked at" is not "a file was updated" — claiming
// otherwise announced an update on every run of an untouched repo.
const QUIET_STATUS_STDOUT = /^assayer 1\.0\.0\nAssayer core online\n$/u;

describe('assayer CLI precheck flow (real built binary)', () => {
  const cli = assayerCliHarness();

  describe('exempt commands — precheck fully skipped (obs-exempt-skips-precheck)', () => {
    describe('help (obs-help-output)', () => {
      it.each(['help', '--help', '-h'])(
        'VALID: {argv: ["%s"]} => prints the usage banner to stdout, exit 0, no config/cache created',
        async (alias) => {
          const result = await cli.run({ argv: [alias] });

          expect(result).toStrictEqual(
            CliRunResultStub({ stdout: `${cliUsageStatics.text}\n`, stderr: '', exitCode: 0 }),
          );
          expect(cli.exists({ relPath: 'assayer.config.json' })).toBe(false);
          expect(cli.exists({ relPath: '.assayer' })).toBe(false);
        },
      );
    });

    describe('version (obs-version-output)', () => {
      it.each(['version', '--version', '-v'])(
        'VALID: {argv: ["%s"]} => prints "assayer 1.0.0", exit 0, no config/cache created',
        async (alias) => {
          const result = await cli.run({ argv: [alias] });

          expect(result).toStrictEqual(
            CliRunResultStub({ stdout: 'assayer 1.0.0\n', stderr: '', exitCode: 0 }),
          );
          expect(cli.exists({ relPath: 'assayer.config.json' })).toBe(false);
          expect(cli.exists({ relPath: '.assayer' })).toBe(false);
        },
      );
    });

    describe('docs (obs-docs-output)', () => {
      it('VALID: {argv: ["docs"]} => prints the LLM overview to stdout, exit 0, no config/cache created', async () => {
        const result = await cli.run({ argv: ['docs'] });

        expect(result).toStrictEqual(
          CliRunResultStub({ stdout: `${docsOverviewStatics.text}\n`, stderr: '', exitCode: 0 }),
        );
        expect(cli.exists({ relPath: 'assayer.config.json' })).toBe(false);
        expect(cli.exists({ relPath: '.assayer' })).toBe(false);
      });

      it('VALID: {argv: ["docs", "overview"]} => prints the overview catalog topic to stdout, exit 0', async () => {
        const result = await cli.run({ argv: ['docs', 'overview'] });

        expect(result).toStrictEqual(
          CliRunResultStub({ stdout: `${DOCS_OVERVIEW_TOPIC_BODY}\n`, stderr: '', exitCode: 0 }),
        );
        expect(cli.exists({ relPath: 'assayer.config.json' })).toBe(false);
      });
    });
  });

  describe('config generation on a clean dir (obs-config-generated + obs-subcommand-after-precheck)', () => {
    // An empty repo has nothing to compile, so it announces nothing — the manifest is still written.
    it('VALID: {argv: ["status"], no config present} => generates the default config, writes the manifest, prints status, exit 0', async () => {
      const { exitCode, stdout } = await cli.run({ argv: ['status'] });
      const generatedConfig = cli.read({ relPath: 'assayer.config.json' });
      const manifestExists = cli.exists({ relPath: '.assayer/cache/manifest.json' });

      expect(exitCode).toBe(0);
      expect(generatedConfig).toBe('{"version":"1","repoRoot":".","exclude":[],"darkSpots":"warn","deadSurface":"error"}');
      expect(manifestExists).toBe(true);
      expect(stdout).toMatch(QUIET_STATUS_STDOUT);
    });
  });

  describe('status with an existing valid config (config found + compile + cache reuse)', () => {
    // The two runs must DIFFER, and that difference is the whole claim of this test. The first
    // compiles the file and says so; the second re-reads and re-hashes it, finds the blob already
    // there, writes nothing — and so says nothing. Both announcing would mean "updating caches" fires
    // on every run of an untouched repo, which is an update that never happened.
    it('VALID: {argv: ["status"], config + one source file} => the first run announces the compile, the reusing second is silent, exit 0', async () => {
      cli.writeConfig({ json: '{"repoRoot":"./src","exclude":[]}' });
      cli.writeSource({ relPath: 'src/sample.ts', source: 'export const sample = (): number => 1;\n' });

      const { exitCode: firstExit, stdout: firstStdout } = await cli.run({ argv: ['status'] });
      const manifestAfterFirst = cli.exists({ relPath: '.assayer/cache/manifest.json' });
      const { exitCode: secondExit, stdout: secondStdout } = await cli.run({ argv: ['status'] });
      const configAfter = cli.read({ relPath: 'assayer.config.json' });

      expect(firstExit).toBe(0);
      expect(firstStdout).toMatch(COMPILED_STATUS_STDOUT);
      expect(manifestAfterFirst).toBe(true);
      expect(secondExit).toBe(0);
      expect(secondStdout).toMatch(QUIET_STATUS_STDOUT);
      expect(configAfter).toBe('{"repoRoot":"./src","exclude":[]}');
    });
  });

  describe('corrupt cache manifest — trash then recompile (obs-cache-trashed)', () => {
    it('EDGE: {argv: ["status"], corrupt manifest + stale blob} => wipes .assayer/cache and recompiles, exit 0', async () => {
      cli.writeConfig({ json: '{"repoRoot":"./src","exclude":[]}' });
      cli.writeSource({ relPath: 'src/sample.ts', source: 'export const sample = (): number => 1;\n' });
      cli.writeCacheFile({ relPath: '.assayer/cache/manifest.json', contents: 'THIS IS NOT JSON {{{' });
      cli.writeCacheFile({ relPath: '.assayer/cache/blobs/staleblob.json', contents: '{"stale":true}' });

      const { exitCode, stdout } = await cli.run({ argv: ['status'] });
      const staleBlobExists = cli.exists({ relPath: '.assayer/cache/blobs/staleblob.json' });
      const manifestExists = cli.exists({ relPath: '.assayer/cache/manifest.json' });

      expect(exitCode).toBe(0);
      expect(staleBlobExists).toBe(false);
      expect(manifestExists).toBe(true);
      // The trashed cache means the file is genuinely compiled again, so this run DOES announce it.
      expect(stdout).toMatch(COMPILED_STATUS_STDOUT);
    });
  });

  describe('compile errors — surfaced, command refused (obs-compile-errors-printed + obs-compile-errors-exit)', () => {
    it('ERROR: {argv: ["status"], a source file that fails to parse} => prints the compile error to stderr, exit 1, no manifest, no status', async () => {
      cli.writeConfig({ json: '{"repoRoot":".","exclude":[]}' });
      cli.writeSource({ relPath: 'broken.ts', source: 'export const broken = ;\n' });

      const { exitCode, stdout, stderr } = await cli.run({ argv: ['status'] });
      const manifestExists = cli.exists({ relPath: '.assayer/cache/manifest.json' });

      expect(exitCode).toBe(1);
      expect(stderr).toMatch(/^broken\.ts:\d+:\d+ [\s\S]+\n$/u);
      expect(manifestExists).toBe(false);
      expect(stdout).toMatch(/^Assayer is updating caches\n[\s\S]*\n$/u);
    });
  });

  describe('unknown command — rejected after the precheck runs (obs-unknown-cmd)', () => {
    it('ERROR: {argv: ["frobnicate"], valid config} => runs precheck then prints the unknown-command error to stderr, exit 1', async () => {
      cli.writeConfig({ json: '{"repoRoot":"./src","exclude":[]}' });
      cli.writeSource({ relPath: 'src/sample.ts', source: 'export const sample = (): number => 1;\n' });

      const { exitCode, stdout, stderr } = await cli.run({ argv: ['frobnicate'] });

      expect(exitCode).toBe(1);
      expect(stderr).toBe(`Unknown command: frobnicate\n\n${cliUsageStatics.text}\n`);
      expect(stdout).toMatch(/^Assayer is updating caches\n[\s\S]*\n$/u);
    });

    it('ERROR: {argv: ["frobnicate"], malformed config} => precheck config error preempts the unknown-command error, exit 1', async () => {
      cli.writeConfig({ json: '{\n  "repoRoot": "."\n  "exclude": []\n}' });

      const { exitCode, stdout, stderr } = await cli.run({ argv: ['frobnicate'] });

      expect(exitCode).toBe(1);
      expect(stdout).toBe('');
      expect(stderr).toMatch(/^assayer\.config\.json: invalid JSON at line 3 column 3: [\s\S]+\n$/u);
    });
  });

  describe('malformed config JSON — config parse error terminal (obs-json-error-msg + obs-json-error-exit)', () => {
    it('ERROR: {argv: ["status"], malformed JSON config} => prints the JSON parse error to stderr, exit 1, no compile', async () => {
      cli.writeConfig({ json: '{\n  "repoRoot": "."\n  "exclude": []\n}' });

      const { exitCode, stdout, stderr } = await cli.run({ argv: ['status'] });
      const cacheExists = cli.exists({ relPath: '.assayer/cache' });

      expect(exitCode).toBe(1);
      expect(stdout).toBe('');
      expect(stderr).toMatch(/^assayer\.config\.json: invalid JSON at line 3 column 3: [\s\S]+\n$/u);
      expect(cacheExists).toBe(false);
    });
  });

  describe('schema-invalid config — zod error terminal (obs-zod-error-msg + obs-zod-error-exit)', () => {
    it('ERROR: {argv: ["status"], repoRoot as a number} => prints the zod path+message to stderr, exit 1, no compile', async () => {
      cli.writeConfig({ json: '{"repoRoot": 123}' });

      const result = await cli.run({ argv: ['status'] });

      expect(result).toStrictEqual(
        CliRunResultStub({ stdout: '', stderr: 'repoRoot: Expected string, received number\n', exitCode: 1 }),
      );
      expect(cli.exists({ relPath: '.assayer/cache' })).toBe(false);
    });
  });
});

const CONFIG_ROOT_DOT = '{"repoRoot":".","exclude":[]}';
const SRC_A = 'export const a = (): number => 1;\n';
const SRC_A_EDITED = 'export const a = (): number => 42;\n';
const SRC_B = 'export const b = (): number => 2;\n';
const SRC_BETA_TSX = 'export const beta = (): number => 2;\n';
const SRC_BROKEN = 'export const broken = ;\n';
const SRC_FN = 'export function pick(x: number): number {\n  if (x > 0) {\n    return 1;\n  }\n  return 0;\n}\n';
const GIT_COMMITTED = 'export const app = (): number => 1;\n';
const GIT_UNCOMMITTED = 'export const app = (): number => 2;\n';

describe('assayer compile flow (real built binary)', () => {
  const compile = assayerCompileHarness();

  describe('obs-manifest-excludes — node_modules + test-named files never enter the manifest', () => {
    it('VALID: {mixed tree: sources + *.test/*.spec/*.e2e/__tests__ + node_modules} => manifest lists ONLY the real .ts/.tsx sources', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/alpha.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/nested/beta.tsx', source: SRC_BETA_TSX });
      compile.writeSource({ relPath: 'src/alpha.test.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/alpha.spec.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/alpha.e2e.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/__tests__/gamma.ts', source: SRC_A });
      compile.writeSource({ relPath: 'node_modules/pkg/index.ts', source: SRC_A });

      const { exitCode } = await compile.run({ argv: ['status'] });

      expect(exitCode).toBe(0);
      expect(compile.manifestNamespaceNames()).toStrictEqual([BranchNameStub({ value: 'default' })]);
      expect(compile.manifestRelPaths({ namespace: 'default' })).toStrictEqual([
        RelPathStub({ value: 'src/alpha.ts' }),
        RelPathStub({ value: 'src/nested/beta.tsx' }),
      ]);
    });
  });

  describe('obs-error-collected + obs-manifest-not-finalized — every parse error surfaces; no manifest on a net-new failed compile', () => {
    it('ERROR: {two unparseable files + one good file, no prior cache} => BOTH error lines on stderr, exit 1, no manifest written', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'good.ts', source: SRC_A });
      compile.writeSource({ relPath: 'broken-a.ts', source: SRC_BROKEN });
      compile.writeSource({ relPath: 'broken-b.ts', source: SRC_BROKEN });

      const { exitCode, stderr } = await compile.run({ argv: ['status'] });

      expect(exitCode).toBe(1);
      expect(stderr).toMatch(
        /^broken-[ab]\.ts:\d+:\d+ [^\n]+\nbroken-[ab]\.ts:\d+:\d+ [^\n]+\n$/u,
      );
      expect(compile.exists({ relPath: '.assayer/cache/manifest.json' })).toBe(false);
    });
  });

  describe('obs-prior-manifest-preserved — a failed incremental compile leaves the last-good manifest untouched', () => {
    it('ERROR: {clean compile, then break a file and recompile} => exit 1 and manifest.json byte-identical to the last-good one', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/keep.ts', source: SRC_A });

      const { exitCode: firstExit } = await compile.run({ argv: ['status'] });
      const manifestBefore = compile.read({ relPath: '.assayer/cache/manifest.json' });

      compile.writeSource({ relPath: 'src/keep.ts', source: SRC_BROKEN });
      const { exitCode: secondExit, stderr: secondStderr } = await compile.run({ argv: ['status'] });
      const manifestAfter = compile.read({ relPath: '.assayer/cache/manifest.json' });

      expect(firstExit).toBe(0);
      expect(secondExit).toBe(1);
      expect(secondStderr).toMatch(/^src\/keep\.ts:\d+:\d+ [^\n]+\n$/u);
      expect(manifestAfter).toBe(manifestBefore);
    });
  });

  describe('obs-determinism — identical content compiles to byte-identical cache', () => {
    it('VALID: {compile, wipe cache, compile again with identical content} => manifest.json AND every blob byte-identical (no timestamps/ordering nondeterminism)', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/one.ts', source: SRC_FN });
      compile.writeSource({ relPath: 'src/two.ts', source: SRC_B });

      await compile.run({ argv: ['status'] });
      const manifestFirst = compile.read({ relPath: '.assayer/cache/manifest.json' });
      const blobsFirst = compile.concatAllBlobs();

      compile.removeCache();
      await compile.run({ argv: ['status'] });
      const manifestSecond = compile.read({ relPath: '.assayer/cache/manifest.json' });
      const blobsSecond = compile.concatAllBlobs();

      expect(manifestSecond).toBe(manifestFirst);
      expect(blobsSecond).toBe(blobsFirst);
    });
  });

  describe('obs-blob-reused — identical file content is compiled to a single shared blob', () => {
    it('VALID: {two files with identical content} => one blob keyed by that content hash; both files point at it', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/dup-one.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/dup-two.ts', source: SRC_A });

      const { exitCode } = await compile.run({ argv: ['status'] });
      const oneHash = compile.manifestContentHash({ namespace: 'default', relPath: 'src/dup-one.ts' });
      const twoHash = compile.manifestContentHash({ namespace: 'default', relPath: 'src/dup-two.ts' });

      expect(exitCode).toBe(0);
      expect(twoHash).toBe(oneHash);
      expect(compile.blobHashes()).toStrictEqual([oneHash]);
    });
  });

  describe('obs-incremental-unchanged — an incremental compile rewrites only the edited file', () => {
    it('VALID: {compile two files, edit one, recompile} => edited file reflects the new source; unchanged file keeps its prior content hash AND blob bytes', async () => {
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/edit.ts', source: SRC_A });
      compile.writeSource({ relPath: 'src/stay.ts', source: SRC_B });

      await compile.run({ argv: ['status'] });
      const stayHashBefore = compile.manifestContentHash({ namespace: 'default', relPath: 'src/stay.ts' });
      const stayBlobBefore = compile.readBlobText({ hash: String(stayHashBefore) });

      compile.writeSource({ relPath: 'src/edit.ts', source: SRC_A_EDITED });
      const { exitCode: secondExit } = await compile.run({ argv: ['status'] });
      const stayHashAfter = compile.manifestContentHash({ namespace: 'default', relPath: 'src/stay.ts' });
      const stayBlobAfter = compile.readBlobText({ hash: String(stayHashBefore) });

      expect(secondExit).toBe(0);
      expect(stayHashAfter).toBe(stayHashBefore);
      expect(stayBlobAfter).toBe(stayBlobBefore);
      expect(compile.blobSourceText({ namespace: 'default', relPath: 'src/edit.ts' })).toBe(
        CliFileTextStub({ value: SRC_A_EDITED }),
      );
    });
  });

  describe('obs-stable-namespace + obs-working-includes-uncommitted + obs-git-blob-read + obs-refresh-no-checkout — two-namespace compile off a real git repo', () => {
    it('VALID: {feature work branch with an uncommitted edit over a committed master baseline} => current namespace = working-tree bytes, stable namespace = committed git blob, working tree + HEAD untouched', async () => {
      await compile.seedGitBaseline({
        workBranch: 'feature',
        stableBranch: 'master',
        sources: [{ relPath: 'src/app.ts', source: GIT_COMMITTED }],
        message: 'baseline',
      });
      compile.writeConfig({ json: CONFIG_ROOT_DOT });
      compile.writeSource({ relPath: 'src/app.ts', source: GIT_UNCOMMITTED });

      const { exitCode } = await compile.run({ argv: ['status'] });

      expect(exitCode).toBe(0);
      expect(compile.manifestNamespaceNames()).toStrictEqual([
        BranchNameStub({ value: 'feature' }),
        BranchNameStub({ value: 'master' }),
      ]);
      expect(compile.manifestNamespaceHasCommit({ namespace: 'master' })).toBe(true);
      expect(compile.manifestNamespaceHasCommit({ namespace: 'feature' })).toBe(false);
      expect(compile.blobSourceText({ namespace: 'feature', relPath: 'src/app.ts' })).toBe(
        CliFileTextStub({ value: GIT_UNCOMMITTED }),
      );
      expect(compile.blobSourceText({ namespace: 'master', relPath: 'src/app.ts' })).toBe(
        CliFileTextStub({ value: GIT_COMMITTED }),
      );
      expect(compile.read({ relPath: 'src/app.ts' })).toBe(CliFileTextStub({ value: GIT_UNCOMMITTED }));
      await expect(compile.headBranch()).resolves.toBe(CliFileTextStub({ value: 'feature' }));
    });
  });

  describe('obs-working-includes-uncommitted (current branch IS the stable branch) — the shared namespace key resolves to the working tree, not the committed baseline', () => {
    it('EDGE: {on master which is also the configured stable branch, uncommitted edit to a committed file} => a single master namespace whose blob is the WORKING-TREE bytes (not the committed git blob) and which carries no commit field', async () => {
      // workBranch === stableBranch: git leaves HEAD on master and master already points at the
      // baseline commit, so the current (working-tree) and stable (git-blob) namespaces collide on
      // the one 'master' key. CURRENT MUST WIN so the uncommitted edit is not silently dropped.
      await compile.seedGitBaseline({
        workBranch: 'master',
        stableBranch: 'master',
        sources: [{ relPath: 'src/app.ts', source: GIT_COMMITTED }],
        message: 'baseline',
      });
      compile.writeConfig({ json: '{"repoRoot":".","exclude":[],"stableBranch":"master"}' });
      compile.writeSource({ relPath: 'src/app.ts', source: GIT_UNCOMMITTED });

      const { exitCode } = await compile.run({ argv: ['status'] });

      expect(exitCode).toBe(0);
      expect(compile.manifestNamespaceNames()).toStrictEqual([BranchNameStub({ value: 'master' })]);
      expect(compile.manifestNamespaceHasCommit({ namespace: 'master' })).toBe(false);
      expect(compile.blobSourceText({ namespace: 'master', relPath: 'src/app.ts' })).toBe(
        CliFileTextStub({ value: GIT_UNCOMMITTED }),
      );
      expect(compile.read({ relPath: 'src/app.ts' })).toBe(CliFileTextStub({ value: GIT_UNCOMMITTED }));
      await expect(compile.headBranch()).resolves.toBe(CliFileTextStub({ value: 'master' }));
    });
  });
});
