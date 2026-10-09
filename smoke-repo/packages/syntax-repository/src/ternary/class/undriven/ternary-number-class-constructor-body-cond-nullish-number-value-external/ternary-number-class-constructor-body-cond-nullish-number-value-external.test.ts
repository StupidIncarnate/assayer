import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-class-constructor-body-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary on line 3 locked one way; ternary on line 3 locked one way, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/undriven/ternary-number-class-constructor-body-cond-nullish-number-value-external/ternary-number-class-constructor-body-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'one-way' }, { kind: 'ternary', line: 3, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }, { startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
