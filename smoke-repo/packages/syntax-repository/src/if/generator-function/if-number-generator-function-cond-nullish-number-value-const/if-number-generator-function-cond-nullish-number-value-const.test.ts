import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-generator-function-cond-nullish-number-value-const', () => {
    it('VALID: {value: const} => if on line 4 locked one way, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/generator-function/if-number-generator-function-cond-nullish-number-value-const/if-number-generator-function-cond-nullish-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 4, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
