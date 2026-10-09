import { moduleFormatRunHarness } from '../../../../test/harnesses/module-format-run.harness';

// The colocated unit test stages the worker, so it cannot notice a real Jest refusing a format. This
// drives the real thing for each module system a consumer can have: real analysis, the real worker
// with --experimental-vm-modules, real ts-jest on ts-morph's TypeScript, real artifact. The fixtures
// are three small consumer repos, not specimens: each exists only to carry its module system.
describe('runExecuteCasesBroker (integration)', () => {
  const engine = moduleFormatRunHarness();

  afterAll(engine.closeWorkers);

  describe('a CommonJS consumer', () => {
    it('VALID: {commonjs tsconfig, no package type} => runs as CommonJS, and every case reaches its predicted exit', async () => {
      const result = await engine.run({ fixture: 'commonjs', relPath: 'src/grade.ts', runId: 'r-cjs' });

      expect({
        statuses: result.cases.map((testCase) => testCase.status),
        shims: engine.shimFiles({ runId: 'r-cjs' }),
      }).toStrictEqual({ statuses: ['passed', 'passed'], shims: ['assayer.test.cjs'] });
    });

    it('VALID: {a module scope driven by the environment} => each case loads the module again and reaches its arm', async () => {
      const result = await engine.run({ fixture: 'commonjs', relPath: 'src/level.ts', runId: 'r-cjs-level' });

      expect(result.cases.map((testCase) => testCase.status)).toStrictEqual(['passed', 'passed']);
    });
  });

  // node16 with no package type is CommonJS. Its relative imports may still carry a `.js` suffix that
  // names a `.ts` file, which Jest's own resolver cannot find and TypeScript's resolution can.
  describe('a CommonJS consumer on node16 with .js-suffixed imports', () => {
    it("VALID: {import './label.js' naming label.ts} => resolves it the way TypeScript does, and every case passes", async () => {
      const result = await engine.run({ fixture: 'commonjs-node16', relPath: 'src/grade.ts', runId: 'r-node16' });

      expect({
        statuses: result.cases.map((testCase) => testCase.status),
        shims: engine.shimFiles({ runId: 'r-node16' }),
      }).toStrictEqual({ statuses: ['passed', 'passed'], shims: ['assayer.test.cjs'] });
    });
  });

  // The nearest tsconfig to `src/grade.ts` includes nothing, so it does not own the file. The package's own
  // tsconfig owns it and carries the `paths` alias `@lib/*`. Resolving the alias proves the resolver reads the
  // owner's options, never the nearest config's.
  describe('a consumer whose nearest tsconfig does not own the importing file', () => {
    it("VALID: {import '@lib/label' resolved only by the owner's paths} => resolves under the owner's options, and every case passes", async () => {
      const result = await engine.run({ fixture: 'owner-paths', relPath: 'src/grade.ts', runId: 'r-owner' });

      expect(result.cases.map((testCase) => testCase.status)).toStrictEqual(['passed', 'passed']);
    });
  });

  // nodenext with "type": "module" is ESM. The subject uses import.meta, top-level await, an ESM-only
  // package and a `.js` specifier, so it loads only as an ES module. Its tsconfig targets ES2022, so
  // `Promise.resolve` in the module scope is standard library, not a host global, and the module scope
  // has no branch: the two cases are `grade`'s two arms.
  describe('an ESM consumer', () => {
    it('VALID: {nodenext tsconfig, package type module} => runs as ESM, and every case reaches its predicted exit', async () => {
      const result = await engine.run({ fixture: 'esm', relPath: 'src/grade.ts', runId: 'r-esm' });

      expect({
        statuses: result.cases.map((testCase) => testCase.status),
        shims: engine.shimFiles({ runId: 'r-esm' }),
      }).toStrictEqual({ statuses: ['passed', 'passed'], shims: ['assayer.test.mjs'] });
    });

    // Loading an ES module again is an asynchronous import, so this proves the interpreter keeps the
    // arranged environment in place until the module body has run.
    it('VALID: {a module scope driven by the environment} => each case imports the module again and reaches its arm', async () => {
      const result = await engine.run({ fixture: 'esm', relPath: 'src/level.ts', runId: 'r-esm-level' });

      expect(result.cases.map((testCase) => testCase.status)).toStrictEqual(['passed', 'passed']);
    });
  });
});
