import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-class-getter-cond-array-length-number-receiver-external', () => {
    it('VALID: {receiver: external} => ternary on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/ternary-number-class-getter-cond-array-length-number-receiver-external/ternary-number-class-getter-cond-array-length-number-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
