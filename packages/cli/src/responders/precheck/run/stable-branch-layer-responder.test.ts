import { AssayerConfigStub, BranchNameStub } from '@assayer/shared/contracts';
import { FilePathStub } from '@assayer/core/contracts';

import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { StableBranchLayerResponderProxy } from './stable-branch-layer-responder.proxy';

describe('StableBranchLayerResponder', () => {
  describe('stable branch already configured', () => {
    it('VALID: {config.stableBranch: "main"} => returns the same config unchanged without detecting or saving', async () => {
      const proxy = StableBranchLayerResponderProxy();
      const config = AssayerConfigStub({ stableBranch: 'main' });

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(result).toStrictEqual(config);
      expect(proxy.wasSaveCalled()).toBe(false);
    });
  });

  describe('repo root is not a git working tree', () => {
    it('VALID: {repoRoot not a git repo} => returns config unchanged with stableBranch absent', async () => {
      const proxy = StableBranchLayerResponderProxy();
      proxy.notGitRepo();
      const config = AssayerConfigStub();

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(result).toStrictEqual(config);
      expect(proxy.wasSaveCalled()).toBe(false);
    });
  });

  describe('git repo with neither main nor master', () => {
    it('EDGE: {repoRoot has neither main nor master} => returns config unchanged with stableBranch absent', async () => {
      const proxy = StableBranchLayerResponderProxy();
      proxy.insideNoMainMaster();
      const config = AssayerConfigStub();

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(result).toStrictEqual(config);
      expect(proxy.wasSaveCalled()).toBe(false);
    });
  });

  describe('both main and master present on an interactive TTY', () => {
    it('VALID: {TTY + main and master candidates, picker chooses "develop"} => saves the picker choice, not the preselected candidate', async () => {
      const proxy = StableBranchLayerResponderProxy();
      proxy.enableTty();
      proxy.insideWith({ branchListStdout: '* main\n  master\n' });
      proxy.picksBranch({ branch: BranchNameStub({ value: 'develop' }) });
      proxy.saveSucceeds();
      const config = AssayerConfigStub();

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(proxy.getSavedConfigJson()).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"stableBranch":"develop","darkSpots":"warn","deadSurface":"error"}',
      );
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: '.',
        exclude: [],
        stableBranch: 'develop',
        darkSpots: 'warn',
        deadSurface: 'error',
      });
    });
  });

  describe('only main present', () => {
    it('VALID: {only "main" candidate} => auto-selects "main" and saves without invoking the picker', async () => {
      const proxy = StableBranchLayerResponderProxy();
      proxy.insideWith({ branchListStdout: '* main\n' });
      proxy.saveSucceeds();
      const config = AssayerConfigStub();

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(proxy.getSavedConfigJson()).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"stableBranch":"main","darkSpots":"warn","deadSurface":"error"}',
      );
      expect(proxy.pickerCallCount()).toBe(0);
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: '.',
        exclude: [],
        stableBranch: 'main',
        darkSpots: 'warn',
        deadSurface: 'error',
      });
    });
  });

  describe('both main and master present but stdout is not a TTY (CI / piped)', () => {
    it('VALID: {non-TTY + main and master candidates, preselected "main"} => resolves to "main" WITHOUT invoking the picker or writing a prompt to stdout', async () => {
      const proxy = StableBranchLayerResponderProxy();
      proxy.disableTty();
      proxy.insideWith({ branchListStdout: '* main\n  master\n' });
      proxy.saveSucceeds();
      const config = AssayerConfigStub();

      const result = await StableBranchLayerResponder({
        config,
        configPath: FilePathStub({ value: '/repo/assayer.config.json' }),
        repoRoot: '/repo',
      });

      expect(proxy.pickerCallCount()).toBe(0);
      expect(proxy.promptWritten()).toBe(false);
      expect(proxy.getSavedConfigJson()).toBe(
        '{"version":"1","repoRoot":".","exclude":[],"stableBranch":"main","darkSpots":"warn","deadSurface":"error"}',
      );
      expect(result).toStrictEqual({
        version: '1',
        repoRoot: '.',
        exclude: [],
        stableBranch: 'main',
        darkSpots: 'warn',
        deadSurface: 'error',
      });
    });
  });
});
