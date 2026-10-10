import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-exported-const-cond-array-length-boolean-receiver-external', () => {
    it('VALID: {receiver: external} => ternary then on line 22 never run; ternary else on line 22 never run, undriven from line 22, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/module/undriven/number-exported-const-cond-array-length-boolean-receiver-external/number-exported-const-cond-array-length-boolean-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 22, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 22, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 22 }],
            darkSpots: [],
            gaps: []
        });
    });
});
