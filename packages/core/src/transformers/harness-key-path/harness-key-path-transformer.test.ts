import { symbolNameContract } from '@assayer/shared/contracts';

import { harnessKeyPathTransformer } from './harness-key-path-transformer';

describe('harnessKeyPathTransformer', () => {
  describe('an entry and parameter pair', () => {
    it('VALID: {entry: audit, param: report} => inputs.audit.report', () => {
      const result = harnessKeyPathTransformer({
        entry: symbolNameContract.parse('audit'),
        param: symbolNameContract.parse('report'),
      });

      expect(result).toBe('inputs.audit.report');
    });

    it('VALID: {entry: tally, param: emit} => inputs.tally.emit', () => {
      const result = harnessKeyPathTransformer({
        entry: symbolNameContract.parse('tally'),
        param: symbolNameContract.parse('emit'),
      });

      expect(result).toBe('inputs.tally.emit');
    });
  });
});
