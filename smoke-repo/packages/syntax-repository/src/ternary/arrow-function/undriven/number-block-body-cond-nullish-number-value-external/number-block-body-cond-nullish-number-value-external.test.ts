import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-block-body-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 24 never run; ternary on line 24 never run, undriven from line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/undriven/number-block-body-cond-nullish-number-value-external/number-block-body-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 24, driven: 'never' }, { kind: 'ternary', line: 24, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 24 }, { startLine: 24 }],
            darkSpots: [],
            gaps: []
        });
    });
});
