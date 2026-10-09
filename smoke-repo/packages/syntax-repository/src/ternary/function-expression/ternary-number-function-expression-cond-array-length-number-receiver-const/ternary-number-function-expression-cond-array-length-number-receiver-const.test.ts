import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-function-expression-cond-array-length-number-receiver-const', () => {
    it('VALID: {receiver: const} => ternary on line 4 locked one way, unreachable-exit on line 4, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-expression/ternary-number-function-expression-cond-array-length-number-receiver-const/ternary-number-function-expression-cond-array-length-number-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 4, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 4 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
