import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-class-constructor-body-cond-array-length-number-receiver-const', () => {
    it('VALID: {receiver: const} => if on line 5 locked one way, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/if-number-class-constructor-body-cond-array-length-number-receiver-const/if-number-class-constructor-body-cond-array-length-number-receiver-const.ts'
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
