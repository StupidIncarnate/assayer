import { BranchNameStub } from '@assayer/shared/contracts/branch-name/branch-name.stub';
import { stableBranchPickBroker } from './stable-branch-pick-broker';
import { stableBranchPickBrokerProxy } from './stable-branch-pick-broker.proxy';

const PROMPT =
  "Select the stable branch for Assayer's diff baseline:\n" +
  '  main (default)\n' +
  '  develop\n' +
  '  feature-x\n' +
  'Enter branch name (press Enter for main): ';

describe('stableBranchPickBroker', () => {
  describe('prompt rendering', () => {
    it('VALID: {candidates: [main, develop, feature-x], preselected: main} => asks one prompt listing all three with main marked as default', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersEmpty({ prompt: PROMPT });

      await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(proxy.getPromptsAsked()).toStrictEqual([PROMPT]);
    });
  });

  describe('matched input', () => {
    it('VALID: {input: develop} => resolves BranchName develop', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersWith({ prompt: PROMPT, input: 'develop' });

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('develop');
    });
  });

  describe('unmatched input', () => {
    it('VALID: {input: release} => resolves preselected BranchName main', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersWith({ prompt: PROMPT, input: 'release' });

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('main');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {input: ""} => resolves preselected BranchName main', async () => {
      const proxy = stableBranchPickBrokerProxy();
      const main = BranchNameStub({ value: 'main' });
      const develop = BranchNameStub({ value: 'develop' });
      const featureX = BranchNameStub({ value: 'feature-x' });
      proxy.answersEmpty({ prompt: PROMPT });

      const result = await stableBranchPickBroker({
        candidates: [main, develop, featureX],
        preselected: main,
      });

      expect(result).toBe('main');
    });
  });
});
