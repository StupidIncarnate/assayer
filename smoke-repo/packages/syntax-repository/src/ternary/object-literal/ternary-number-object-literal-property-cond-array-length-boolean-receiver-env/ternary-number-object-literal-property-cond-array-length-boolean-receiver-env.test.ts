import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-object-literal-property-cond-array-length-boolean-receiver-env', () => {
    it('VALID: {receiver: env} => ternary on line 4 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/ternary-number-object-literal-property-cond-array-length-boolean-receiver-env/ternary-number-object-literal-property-cond-array-length-boolean-receiver-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 4, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
