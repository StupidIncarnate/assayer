import { caseSettleStatics } from './case-settle-statics';

describe('caseSettleStatics', () => {
  describe('values', () => {
    it('VALID: {statics} => holds both generator tags and the per-case step limit', () => {
      expect(caseSettleStatics).toStrictEqual({
        generatorTags: ['[object Generator]', '[object AsyncGenerator]'],
        limits: { generatorSteps: 10000 },
      });
    });
  });
});
