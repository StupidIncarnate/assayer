import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-arrow-function-expression-body-cond-string-length-receiver-const', () => {
    it('VALID: {receiver: const} => ternary on line 3 locked one way, unreachable-exit on line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/ternary-number-arrow-function-expression-body-cond-string-length-receiver-const/ternary-number-arrow-function-expression-body-cond-string-length-receiver-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 3 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
