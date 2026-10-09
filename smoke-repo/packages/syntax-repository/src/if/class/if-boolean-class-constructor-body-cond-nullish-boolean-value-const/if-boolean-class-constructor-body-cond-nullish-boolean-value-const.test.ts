import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-class-constructor-body-cond-nullish-boolean-value-const', () => {
    it('VALID: {value: const} => if on line 5 locked one way, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/if-boolean-class-constructor-body-cond-nullish-boolean-value-const/if-boolean-class-constructor-body-cond-nullish-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 5, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
