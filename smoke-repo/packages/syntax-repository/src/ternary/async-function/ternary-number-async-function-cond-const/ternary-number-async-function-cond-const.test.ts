import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-async-function-cond-const', () => {
    it('VALID: {cond: const} => ternary on line 5 locked one way, unreachable-exit on line 5, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/async-function/ternary-number-async-function-cond-const/ternary-number-async-function-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 5, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 5 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
