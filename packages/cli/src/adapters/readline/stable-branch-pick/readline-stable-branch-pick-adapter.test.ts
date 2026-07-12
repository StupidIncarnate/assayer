import { BranchNameStub } from '@assayer/shared/contracts';
import { readlineStableBranchPickAdapter } from './readline-stable-branch-pick-adapter';
import { readlineStableBranchPickAdapterProxy } from './readline-stable-branch-pick-adapter.proxy';

describe('readlineStableBranchPickAdapter', () => {
  describe('prompt rendering', () => {
    it('VALID: {candidates: [main, develop, feature-x], preselected: main} => prompt lists all three with main marked as default', async () => {
      const proxy = readlineStableBranchPickAdapterProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });

      await readlineStableBranchPickAdapter({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(proxy.getPrompt()).toBe(
        "Select the stable branch for Assayer's diff baseline:\n" +
          '  main (default)\n' +
          '  develop\n' +
          '  feature-x\n' +
          'Enter branch name (press Enter for main): ',
      );
    });
  });

  describe('matched input', () => {
    it('VALID: {input: develop} => resolves BranchName develop', async () => {
      const proxy = readlineStableBranchPickAdapterProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersWith({ input: 'develop' });

      const result = await readlineStableBranchPickAdapter({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('develop');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {input: ""} => resolves preselected BranchName main', async () => {
      const proxy = readlineStableBranchPickAdapterProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersEmpty();

      const result = await readlineStableBranchPickAdapter({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('main');
    });
  });
});
