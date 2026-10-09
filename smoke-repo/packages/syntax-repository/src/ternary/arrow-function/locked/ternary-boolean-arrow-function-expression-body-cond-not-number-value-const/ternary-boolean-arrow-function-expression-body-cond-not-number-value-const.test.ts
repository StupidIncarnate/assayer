import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-arrow-function-expression-body-cond-not-number-value-const', () => {
    it('VALID: {value: const} => ternary on line 3 locked one way, unreachable-exit on line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/locked/ternary-boolean-arrow-function-expression-body-cond-not-number-value-const/ternary-boolean-arrow-function-expression-body-cond-not-number-value-const.ts'
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
