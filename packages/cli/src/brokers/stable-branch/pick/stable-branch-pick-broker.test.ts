import { BranchNameStub } from '@assayer/shared/contracts';
import { stableBranchPickBroker } from './stable-branch-pick-broker';
import { stableBranchPickBrokerProxy } from './stable-branch-pick-broker.proxy';

describe('stableBranchPickBroker', () => {
  describe('prompt rendering', () => {
    it('VALID: {candidates: [main, develop, feature-x], preselected: main} => prompt lists all three with main marked as default', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });

      await stableBranchPickBroker({
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
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersWith({ input: 'develop' });

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('develop');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {input: ""} => resolves preselected BranchName main', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersEmpty();

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('main');
    });
  });

  describe('non-interactive stdin (EOF / close without a line)', () => {
    it('EDGE: {stdin closes at EOF with no line} => resolves preselected BranchName main (does not hang)', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.closesAtEof();

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('main');
    });
  });
});
