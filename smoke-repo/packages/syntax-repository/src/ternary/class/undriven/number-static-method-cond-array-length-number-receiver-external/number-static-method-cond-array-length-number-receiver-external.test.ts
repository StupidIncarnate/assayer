import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-static-method-cond-array-length-number-receiver-external', () => {
    it('VALID: {receiver: external} => ternary then on line 24 never run; ternary else on line 24 never run, undriven from line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/undriven/number-static-method-cond-array-length-number-receiver-external/number-static-method-cond-array-length-number-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 24 }],
            darkSpots: [],
            gaps: []
        });
    });
});
