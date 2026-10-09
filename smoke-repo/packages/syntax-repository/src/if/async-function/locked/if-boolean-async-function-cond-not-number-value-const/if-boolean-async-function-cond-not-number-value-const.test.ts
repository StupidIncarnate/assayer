import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-boolean-async-function-cond-not-number-value-const', () => {
    it('VALID: {value: const} => if on line 5 locked one way, unreachable-exit on line 6, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/async-function/locked/if-boolean-async-function-cond-not-number-value-const/if-boolean-async-function-cond-not-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 5, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 6 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
