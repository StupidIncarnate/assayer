import { runIdBroker } from './run-id-broker';
import { runIdBrokerProxy } from './run-id-broker.proxy';

const HARNESS = "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: () => () => undefined } } });\n";
const EDITED_HARNESS = "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: () => () => 1 } } });\n";
const OTHER_TOOLS_HARNESS = "export const playwrightHarness = () => ({});\n";

describe('runIdBroker', () => {
  describe('naming a run', () => {
    // Content-keyed, never a timestamp: the same bytes must name the same run or a detail link goes
    // stale the moment it is printed, and no reader could ever find what the runner wrote.
    it('VALID: {a file} => a deterministic id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const result = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(result)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });

    it('VALID: {the same file twice} => the same id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const second = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(second)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });

    // Path alone would collide across edits, so a stale run would answer for new code.
    it('VALID: {same path, changed content} => a different id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const after = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 2;\n' });

      expect(String(after)).toBe('21abc21f1e4c00faaed90374bbfe5551d39a869f701b13e1f3eaaf5803763cad');
    });

    // Content alone would collide across files that happen to read the same.
    it('VALID: {same content, different path} => a different id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/b.harness.ts' });
      proxy.fileWithoutOwner({ absPath: '/repo/src/b.ts' });

      const other = await runIdBroker({ root: '/repo', relPath: 'src/b.ts', source: 'export const a = 1;\n' });

      expect(String(other)).toBe('b2c0c2def6e2bf609d09a2d343d1c6515e0162e6fc7db058e55393f5d745492c');
    });
  });

  describe('the harness it keys on', () => {
    // The harness supplies the ARGUMENTS an entry runs on, so the same source with a different harness
    // is a different run. Without this, a run saved while the harness passed keeps answering after the
    // harness is edited to throw.
    it('VALID: {a colocated harness} => an id that differs from the same source with none', async () => {
      const proxy = runIdBrokerProxy();
      proxy.harness({ harnessPath: '/repo/src/a.harness.ts', source: HARNESS });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const withHarness = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(withHarness)).toBe('92390d8282ea58d7ce144ab609d3ddcd78a8f051e823e8961d68bb16215271e6');
    });

    it('VALID: {an edited harness, unchanged source} => a different id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.harness({ harnessPath: '/repo/src/a.harness.ts', source: EDITED_HARNESS });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const edited = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(edited)).toBe('d3870835e30539459ac01399c98a62627c24ac90fa1f3b47e6d989157b17b0a9');
    });

    // Existing saved runs must not all invalidate: the overwhelming majority of files have no harness,
    // and an absent ingredient contributes nothing rather than a constant.
    it('VALID: {no colocated harness} => the id the file has always had', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const plain = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(plain)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });

    // The symbol gate, not the filename: this repo's own Playwright and Jest harnesses wear the same
    // suffix, and editing one of those must move no run id.
    it('VALID: {a *.harness.ts that is some other tool\'s} => the id the file has always had', async () => {
      const proxy = runIdBrokerProxy();
      proxy.harness({ harnessPath: '/repo/src/a.harness.ts', source: OTHER_TOOLS_HARNESS });
      proxy.fileWithoutOwner({ absPath: '/repo/src/a.ts' });

      const plain = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(plain)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });
  });

  describe('the colocated harness cannot be read', () => {
    it('ERROR: {a harness file exists but reading it is denied with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runIdBrokerProxy();
      proxy.readThrows({ harnessPath: '/repo/src/a.harness.ts' });

      await expect(
        runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' }),
      ).rejects.toThrow(/^EACCES: op '\/repo\/src\/a\.harness\.ts'$/u);
    });
  });

  describe('the owning tsconfig it keys on', () => {
    // The owner's analysis options decide the types the walk reads, so the same bytes under a different
    // `lib` are a different run.
    it('VALID: {a file a tsconfig owns} => an id that differs from the same file with no owner', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileOwnedBy({ absPath: '/repo/src/a.ts', options: { target: 9, outDir: '/repo/dist' } });

      const owned = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(owned)).toBe('fbd102f417ce3d7b819e65b78cf162d623259d36d654d71e7f1f32c5576533a9');
    });

    it('VALID: {an owner whose options differ only outside the analysis set} => the same id', async () => {
      const proxy = runIdBrokerProxy();
      proxy.noHarness({ harnessPath: '/repo/src/a.harness.ts' });
      proxy.fileOwnedBy({ absPath: '/repo/src/a.ts', options: { target: 9, outDir: '/elsewhere/out' } });

      const owned = await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(owned)).toBe('fbd102f417ce3d7b819e65b78cf162d623259d36d654d71e7f1f32c5576533a9');
    });
  });
});
