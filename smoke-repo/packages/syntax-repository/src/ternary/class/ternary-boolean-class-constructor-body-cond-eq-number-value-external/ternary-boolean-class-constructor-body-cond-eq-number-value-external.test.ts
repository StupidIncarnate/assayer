import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-class-constructor-body-cond-eq-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/ternary-boolean-class-constructor-body-cond-eq-number-value-external/ternary-boolean-class-constructor-body-cond-eq-number-value-external.ts'
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
