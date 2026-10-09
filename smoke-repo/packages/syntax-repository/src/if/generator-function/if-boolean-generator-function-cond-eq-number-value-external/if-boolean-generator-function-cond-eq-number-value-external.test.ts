import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-generator-function-cond-eq-number-value-external', () => {
    it('VALID: {value: external} => if on line 2 locked one way, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/generator-function/if-boolean-generator-function-cond-eq-number-value-external/if-boolean-generator-function-cond-eq-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 2, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
